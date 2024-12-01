import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_810 } from "../../info/info_810";
import { ConvertPattern, X12, XML, versionKeys } from "../../cat_const";
import { create, fragment } from "xmlbuilder2";
import { format } from "date-fns";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { ConvertErr, EdiSegment, EdiType } from "../../new_parser/entities";
import { ConverterBase } from "../converterBase";
import { ASTNode } from "../../new_parser/syntaxParserBase";
import { CUtilEDI } from "../../utils/cUtilEDIFACT";
import { XMLBuilderImpl } from "xmlbuilder2/lib/builder";
import { select, select1 } from 'xpath'
import { TidyConfirmationHeader, TidyConfirmationItem, TidyConfirmationRequest, TidyConfirmationStatus, TidyItemDetail, TidyItemIn } from "../xmlTidy/OrderConfirm";
import { TidyContact, TidyItemDetailRetail, TidyItemID, TidyModification } from "../xmlTidy/TidyCommon";

/**
 * No need to make singleton because parserUtil already assured it
 */
export class Cvt_ORDRSP_OrderConfirmation extends ConverterBase {
    private _deliveryDate = '';

    constructor(astTree: ASTNode) {
        super(astTree);
    }

    /**
     * Can be invoked internally or from outside
     */
    public toXMLCheck(document?: vscode.TextDocument): vscode.Diagnostic[] {
        this._document = document;
        this._clearDiags(); // clear previouse check results
        let BGM = this._rseg("BGM");

        return this._cvtDiags;
    }

    /**
     * Usually, it's invoked by ConversionCommand.
     * and since diagnotics usually is enabled, maybe we don't need to invoke toXMLCheck??
     * 
     * @returns 
     * 
     */
    public toXML(): string {
        // this.toXMLCheck(); // don't care error position, so no 'document' parameter
        // if (this._hasConvertErr()) {
        //     return this._renderConvertErr();
        // }

        const cxml = create({ encoding: "utf-8" }).ele('cXML').dtd({
            sysID: 'http://xml.cxml.org/schemas/cXML/1.2.061/Fulfill.dtd'
        });

        // header supplier2buyer
        this._header_supplier_to_buyer(cxml);

        let request = cxml.ele(XML.Request);

        //  <!ELEMENT InvoiceDetailRequest
        // (InvoiceDetailRequestHeader,
        //  (InvoiceDetailOrder+ | InvoiceDetailHeaderOrder+),
        //  InvoiceDetailSummary)>
        //let eConfReq = request.ele('ConfirmationRequest');
        let tConfReq = new TidyConfirmationRequest();
        let tConfHeader = new TidyConfirmationHeader();

        // UNB
        let UNB = this._rseg('UNB');
        let testIndicator = this._segVal(UNB, 11);
        request.att(XML.deploymentMode, CUtilEDI.testIndicatorXML(testIndicator));

        // BGM
        let BGM = this._rseg("BGM");
        tConfHeader.att('confirmID', this._segVal(BGM, 2));
        tConfHeader.att('operation', MAPS.mapBGM1225[this._segVal(BGM, 2)]);
        tConfHeader.att('type', MAPS.mapBGM4343[this._segVal(BGM, 4)]);

        // DTM
        let DTMs = this._rSegs("DTM");
        DTMs = DTMs ?? [];
        for (let DTM of DTMs) {
            let vDTM101 = this._segVal(DTM, 101);
            let vDTM102 = this._segVal(DTM, 102);
            let vDTM103 = this._segVal(DTM, 103);
            switch (vDTM101) {
                case '8':
                case '137':
                    //Utils.dateStrFromDTM2(dtmVal102, dtmVal103)
                    tConfHeader.att('noticeDate', Utils.dateStrFromDTM2(vDTM102, vDTM103));
                    break;
                case '2':
                    // If SG52 DTM+69 C507/2380 does not exist, 
                    // Map to all /ConfirmationItem/ConfirmationStatus/@deliveryDate 
                    this._deliveryDate = Utils.dateStrFromDTM2(vDTM102, vDTM103);
                    break;
            }
        }

        // FTX
        let FTXs = this._rSegs("FTX");
        FTXs = FTXs ?? [];
        for (let f of FTXs) {
            let v1 = this._segVal(f, 1);
            let v2 = this._segVal(f, 2);
            let v401 = this._segVal(f, 401);
            let v402 = this._segVal(f, 402);
            let v403 = this._segVal(f, 403);
            let v404 = this._segVal(f, 404);
            let v405 = this._segVal(f, 405);
            let v5 = this._segVal(f, 5);
            switch (v1) {
                case 'AAI':
                    tConfHeader.Comments.ele('Comments')
                        .txt(v401 + v402 + v403 + v404 + v405)
                        .att(XML.lang, v5);
                    break;
                case 'TXD':
                    let eTax = this._ele2(tConfHeader.Tax, 'Tax');
                    // TODO: MapSpec needs fix   
                    break;
                case 'TRA':
                    let eShipping = this._ele2(tConfHeader.Shipping, 'Shipping');
                    this._ele2(eShipping, XML.Description)
                        .txt(v401 + v402 + v403 + v404 + v405)
                        .att(XML.lang, v5);
                    break;
                case 'ACD':
                    tConfHeader.Extrinsic.ele(XML.Extrinsic)
                        .att('name', 'RejectionReason')
                        .txt(this._mci(MAPS.mapRejectReason, v401));
                    tConfHeader.Extrinsic.ele(XML.Extrinsic)
                        .att('name', 'RejectionReasonComments')
                        .txt(this._mci(MAPS.mapRejectReason, v401));
                    break;
                case 'ZZZ':
                    tConfHeader.Extrinsic.ele(XML.Extrinsic)
                        .att('name', v401).txt(v402 + v403 + v404 + v405);
                    break;
                default:
                // do nothing
            } // end switch FTX v1
        } // end loop FTXs

        // SG1 Group1
        let SG1s = this._rGrps('SG1');
        SG1s = SG1s ?? [];
        for (let SG1 of SG1s) {
            // SG1 items
            this._SG1(SG1, tConfReq, tConfHeader);
        }

        // SG3 Group3
        let SG3s = this._rGrps('SG3');
        SG3s = SG3s ?? [];
        for (let SG3 of SG3s) {
            this._SG3(SG3, tConfReq, tConfHeader);
        }

        // SG7 Group7
        let SG7 = this._rGrp1('SG7');
        let TAX = this._dSeg1(SG7, 'TAX');
        let vTAX1 = this._segVal(TAX, 1);
        let vTAX201 = this._segVal(TAX, 201);
        let eTaxD: XMLBuilder;
        if (vTAX1) {
            eTaxD = this._ele3(tConfHeader.Tax, 'Tax', 'TaxDetail');
            switch (vTAX1) {
                case '7':
                    eTaxD.att('purpose', 'tax');
                    break;
                case '5':
                    eTaxD.att('purpose', 'duty');
                    break;
                default:
                // should raise error
            } // end switch vTAX1
            eTaxD.att('category', MAPS.mapTAX5153[vTAX201]);

            eTaxD.att('isVatRecoverable', this._segVal(TAX, 301));
            eTaxD.att('taxRateType', this._segVal(TAX, 501));
            eTaxD.att('percentageRate', this._segVal(TAX, 504));
            eTaxD.att('exemptDetail', this._segVal(TAX, 506));
            // MOA
            let MOA = this._dSeg1(SG7, 'MOA');
            let vMOA101 = this._segVal(MOA, 101);
            if (vMOA101 == '124') {
                eTaxD.ele('TaxAmount').ele(XML.Money).txt(
                    this._segVal(MOA, 102)
                ).att(XML.currency, this._segVal(MOA, 103))
            }
            eTaxD.ele('TaxLocation').txt(this._segVal(TAX, 204)).att(XML.lang, 'EN');
            eTaxD.ele(XML.Description).txt(this._segVal(TAX, 507)).att(XML.lang, 'EN');
        } // end if vTAX1 exist

        // SG12 Group12
        let SG12 = this._rGrp1('SG12');
        // TOD
        let TOD = this._dSeg1(SG12, 'TOD');
        let vTOD301 = this._segVal(TOD, 301);
        if (vTOD301) {
            tConfHeader.att('incoTerms', this._mcs(MAPS.mapTOD4053, vTOD301));
        }

        // SG19 Group19
        let SG19s = this._rGrps('SG19');
        SG19s = SG19s ?? [];
        for (let SG19 of SG19s) {
            this._SG19(SG19, tConfReq, tConfHeader);
        }

        // SG26 Group26
        let SG26s = this._rGrps('SG26');
        SG26s = SG26s ?? [];
        for (let SG26 of SG26s) {
            // all lineitems are merged to tConfReq
            this._SG26(SG26, tConfReq, tConfHeader);
        }

        // MOA
        let MOAs = this._rSegs('MOA');
        MOAs = MOAs ?? [];
        for (let MOA of MOAs) {
            let vMOA101 = this._segVal(MOA, 101);
            let vMOA102 = this._segVal(MOA, 102);
            let vMOA103 = this._segVal(MOA, 103);
            let vMOA104 = this._segVal(MOA, 104);
            switch (vMOA101) {
                case '128':
                    if (vMOA104 == '9') {
                        this._ele3(tConfHeader.Total, 'Total', XML.Money).txt(vMOA102)
                            .att(XML.currency, vMOA103);
                    }
                    if (vMOA104 == '7') {
                        this._ele3(tConfHeader.Total, 'Total', XML.Money).att('alternateAmount', vMOA102)
                            .att('alternateCurrency', vMOA103);
                    }
                    break;
                case '124':
                case '176':
                    // seems it's same as '128', maybe there is bug in MapSpec
                    if (vMOA104 == '9') {
                        this._ele3(tConfHeader.Tax, 'Tax', XML.Money).txt(vMOA102)
                            .att(XML.currency, vMOA103);
                    }
                    if (vMOA104 == '7') {
                        this._ele3(tConfHeader.Tax, 'Tax', XML.Money).att('alternateAmount', vMOA102)
                            .att('alternateCurrency', vMOA103);
                    }
                    break;
            }
        }
        tConfHeader.sendTo(tConfReq.ConfirmationHeader.ele('ConfirmationHeader'));
        tConfReq.sendTo(request.ele('ConfirmationRequest'));

        const xml = cxml.end({ prettyPrint: true, indent: '    ', spaceBeforeSlash: false });
        return this._adjustXmlforCIG(xml);
    } // end function toXML

    private _SG26(SG26: ASTNode, tConfReq: TidyConfirmationRequest, tConfHeader: TidyConfirmationHeader) {
        let tConfItem = new TidyConfirmationItem();
        let tDetailConfStatus = new TidyConfirmationStatus();
        let tOtherConfStatus = new TidyConfirmationStatus();
        let tItemIn = new TidyItemIn();
        let tItemID = new TidyItemID();
        let tItemDetail = new TidyItemDetail();


        // LIN
        let LIN = this._dSeg1(SG26, 'LIN');
        tConfItem.att('lineNumber', this._segVal(LIN, 1));
        tItemID.SupplierPartID.ele('SupplierPartID').txt(this._segVal(LIN, 301));
        tConfItem.att('parentLineNumber', this._segVal(LIN, 402));

        let tDetailRetail = new TidyItemDetailRetail();
        // PIA
        let PIAs = this._dSegs(SG26, 'PIA');
        for (let p of PIAs) {
            let v1 = this._segVal(p, 1);
            if (!(v1 == '1' || v1 == '5')) {
                continue;
            }
            for (let i = 2; i <= 6; i++) {
                let vNumber = this._segVal(p, i * 100 + 1);
                let vType = this._segVal(p, i * 100 + 2);
                switch (vType) {
                    case 'BP':
                        this._ele2(tItemID.BuyerPartID, 'BuyerPartID')
                            .txt(vNumber);
                        // item.ele(XML.Extrinsic).att('name', `Buyer's Part ID`)
                        //     .txt(vNumber);
                        break;
                    case 'VS':
                        tItemID.SupplierPartAuxiliaryID.ele('SupplierPartAuxiliaryID')
                            .txt(vNumber);
                        break;
                    case 'EN':
                        tDetailRetail.EANID.ele('EANID').txt(vNumber);
                        break;
                    case 'MF':
                        tItemDetail.ManufacturerPartID.ele('ManufacturerPartID').txt(vNumber);
                        break;
                    case 'ZZZ':
                        tDetailRetail.EuropeanWasteCatalogID.ele('EuropeanWasteCatalogID').txt(vNumber);
                        break;
                    case 'CC':
                        tItemDetail.Classification.ele('Classification').att(XML.domain, 'UNSPSC')
                            .txt(vNumber);
                        break;
                    case 'NB':
                        tDetailConfStatus.SupplierBatchID.ele('SupplierBatchID').txt(vNumber);
                        break;
                }
            } // end loop i
        } // end loop PIAs
       
        // IMD
        let IMDs = this._dSegs(SG26, 'IMD');
        IMDs = IMDs ?? [];
        let sShortName = '';
        let sShortNameLang = 'EN';
        let sDescription = '';
        let sDescriptionLang = 'EN';
        for (let IMD of IMDs) {
            let vIMD1 = this._segVal(IMD, 1);
            let vIMD201 = this._segVal(IMD, 201);
            let vIMD301 = this._segVal(IMD, 301);
            let vIMD304 = this._segVal(IMD, 304);
            let vIMD305 = this._segVal(IMD, 305);
            let vIMD306 = this._segVal(IMD, 306);
            switch (vIMD1) {
                case 'E':
                    sShortName = sShortName + vIMD301 + vIMD304 + vIMD305;
                    sShortNameLang = vIMD306 ? vIMD306 : 'EN';
                    break;
                case 'F':
                    sDescription = sDescription + vIMD304 + vIMD305;
                    sDescriptionLang = vIMD306 ? vIMD306 : 'EN';
                    break;
                case 'B':
                    let eChar = tDetailRetail.Characteristic.ele('Characteristic')
                    eChar.att(XML.domain, this._mcs(MAPS.mapIMD7081, vIMD201));
                    eChar.att('value', vIMD304);
                    break;
            } // end switch vIMD1            
        } // end loop IMDs

        // output concatenated string
        tItemDetail.Description.ele(XML.Description).ele('ShortName').txt(sShortName)
            .up().txt(sDescription).att(XML.lang, sDescriptionLang)


        // MEA, new feature TODO

        // SG26 QTY
        let iOutQty = 0; // used for calculation of type 'unknown'
        let QTY = this._dSeg1(SG26, 'QTY');
        let vQTY102 = this._segVal(QTY, 102);
        let iLineQty = Number.parseInt(vQTY102); // also used for calculation of type 'unknown'
        tConfItem.att(XML.quantity, vQTY102);
        tItemIn.att(XML.quantity, vQTY102);
        let sItemUoM = this._segVal(QTY, 103);
        tConfItem.UnitOfMeasure.ele('UnitOfMeasure').txt(sItemUoM);


        // SG26 DTM
        let DTM = this._dSeg1(SG26, 'DTM');
        if (DTM) {
            tItemDetail.PlannedAcceptanceDays.ele('PlannedAcceptanceDays').txt(this._segVal(DTM, 102));
        }
        // SG26 MOA
        let MOAs = this._dSegs(SG26, 'MOA');
        MOAs = MOAs ?? [];
        for (let MOA of MOAs) {
            let v101 = this._segVal(MOA, 101);
            let v102 = this._segVal(MOA, 102);
            let v103 = this._segVal(MOA, 103);
            let v104 = this._segVal(MOA, 104);
            switch (v101) {
                case '146':
                    this._ele3(tItemDetail.UnitPrice, 'UnitPrice', XML.Money)
                        .txt(v102).att(XML.currency, v103);
                    break;
                case '176':
                    // TODO future 
                    break;
            }
        } // end loop MOAs

        // SG26_SG27 CCI
        let SG27 = this._dGrp1(SG26, 'SG27');
        let CCI = this._dSeg1(SG27, 'CCI');
        if (CCI) {
            let v301 = this._segVal(CCI, 301);
            tItemDetail.Classification.ele('Classification').att(XML.domain,
                v301 ? v301 : 'NotAvailable'
            ).txt(this._segVal(CCI, 304));
        }

        // SG30 Group30
        // "[ConfirmationStatus @type]
        // If "G_SG52/S_QTY/C_C186/D_6063 = '194' 
        //  and ../G_SG30/S_PRI/C_C509[D_5125 = 'CAL'][D_5387 = 'CUP' or D_5387 = 'AAK]/D_5118 ---> hardcode @type="detail"
        // If "G_SG52/S_QTY/C_C186/D_6063 = '194'" ---> hardcode @type="accept"
        // If "G_SG52/S_QTY/C_C186/D_6063 = '185'" ---> hardcode @type="reject"
        // If "G_SG52/S_QTY/C_C186/D_6063 = '83'" ---> hardcode @type"backordered""
        let SG30 = this._dGrp1(SG26, 'SG30');
        let sSG30_PRI: string;
        if (SG30) {
            // PRI
            let PRI = this._dSeg1(SG30, 'PRI');
            // CUX
            let CUX = this._dSeg1(SG30, 'CUX');
            let vPRI101 = this._segVal(PRI, 101);
            let vPRI102 = this._segVal(PRI, 102);
            let vPRI104 = this._segVal(PRI, 104);
            sSG30_PRI = vPRI104; // for judging the ConfirmationStatus type
            let vPRI105 = this._segVal(PRI, 105);
            let vPRI106 = this._segVal(PRI, 106);
            let vCUX102 = this._segVal(CUX, 102);
            if (vPRI104 == 'AAK') {
                // AAK
                this._ele3(tDetailConfStatus.UnitPrice, 'UnitPrice', XML.Money).txt(vPRI102)
                    .att(XML.currency, vCUX102);
            } else {
                // CUP
                this._ele3(tItemDetail.UnitPrice, 'UnitPrice', XML.Money).txt(vPRI102)
                    .att(XML.currency, vCUX102);
            }
            tItemDetail.PriceBasisQuantity.ele('PriceBasisQuantity').att(XML.quantity, vPRI105)
                .att('conversionFactor', '1').ele(XML.UnitOfMeasure).txt(vPRI106);
        } // end if SG30 exists

        // SG31
        let SG31s = this._dGrps(SG26, 'SG31');
        SG31s = SG31s ?? [];
        for (let SG31 of SG31s) {
            // RFF
            let RFF = this._dSeg1(SG31, 'RFF');
            let vRFF101 = this._segVal(RFF, 101);
            let vRFF102 = this._segVal(RFF, 102);
            let vRFF104 = this._segVal(RFF, 104);
            switch (vRFF101) {
                case 'FI':
                    tConfItem.att('itemType', vRFF102);
                    tConfItem.att('compositeItemType', vRFF104);
                    break;
                case 'ON':
                    tConfItem.att('lineNumber', vRFF102);
                    break;
            }
        }

        // SG26 SG36
        let SG36s = this._dGrps(SG26, 'SG36');
        SG36s = SG36s ?? [];
        for (let SG36 of SG36s) {

            // placeholder for Tax/Money
            this._ele3(tItemIn.Tax, 'Tax', XML.Money);
            // I think we will transfer content from tMainConfStatus to seperate ConfStatus
            // after setting all values for main
            let eTaxD = this._ele2(tItemIn.Tax, 'Tax').ele('TaxDetail');
            // TAX
            let TAX = this._dSeg1(SG36, 'TAX');
            // Should be "7" if/@purpose='tax' else "5"/@purpose='duty'
            let vTAX1 = this._segVal(TAX, 1);
            let vTAX201 = this._segVal(TAX, 201);
            let vTAX606 = this._segVal(TAX, 606);
            if (vTAX201 == 'IND') {
                eTaxD.att('isWithholdingTax', 'yes');
            } else {
                eTaxD.att('purpose', this._mcs(MAPS.mapTAX5153, vTAX201));
            }

            eTaxD.att('isVatRecoverable', this._segVal(TAX, 301));

            eTaxD.att('taxRateType', this._segVal(TAX, 501));
            eTaxD.att('percentageRate', this._segVal(TAX, 504));
            eTaxD.att('exemptDetail', this._segVal(TAX, 504));
            eTaxD.ele(XML.Description).txt(this._segVal(TAX, 707)).att(XML.lang, 'EN');
            // MOA
            let MOA = this._dSeg1(SG36, 'MOA');
            let vMOA101 = this._segVal(MOA, 101);
            if (vMOA101 == '124') {
                eTaxD.ele('TaxAmount').ele(XML.Money).txt(this._segVal(MOA, 102))
                    .att(XML.currency, this._segVal(MOA, 103));
            }

            eTaxD.ele('TaxLocation').txt(this._segVal(TAX, 204)).att(XML.lang, 'EN');
            eTaxD.ele('TaxableAmount').ele(XML.Money).txt(this._segVal(TAX, 304));
        } // end loop SG36s

        // SG26 SG37
        let SG37s = this._dGrps(SG26, 'SG37');
        SG37s = SG37s ?? [];
        for (let SG37 of SG37s) {
            let tContact = new TidyContact();
            let sXmlRole: string;
            // NAD
            let NAD = this._dSeg1(SG37, 'NAD');
            let vNAD1 = this._segVal(NAD, 1);
            if (vNAD1 == 'MF') {
                tItemDetail.ManufacturerName.ele('ManufacturerName')
                    .txt(this._segVal(NAD, 401) + this._segVal(NAD, 402) + this._segVal(NAD, 403)
                        + this._segVal(NAD, 404) + this._segVal(NAD, 405)
                    )
            } else {
                //  [Lookup required, Sheet NAD]
                sXmlRole = this._mcs(MAPS.mapNAD3035, vNAD1);
                tContact.att(XML.role, sXmlRole);
                tContact.att('addressID', this._segVal(NAD, 201));
                tContact.att('addressIDDomain', this._mcs(MAPS.mapNAD3055, this._segVal(NAD, 203)));
                tContact.Name.ele('Name').txt(
                    this._segVal(NAD, 301)
                    + this._segVal(NAD, 302)
                    + this._segVal(NAD, 303)
                    + this._segVal(NAD, 304)
                    + this._segVal(NAD, 305)
                ).att(XML.lang, 'en');
                this._NADPostalAddr2(tContact, NAD);
            }

            // TODO: SG26 SG37 SG38
            // let SG38s = this._dGrps(SG26, 'SG38');
            // SG37s = SG37s ?? [];

            // SG26 SG37 SG40
            let SG40s = this._dGrps(SG37, 'SG40');
            SG40s = SG40s ?? [];
            for (let SG40 of SG40s) {
                this._xmlCommFromCTA(SG40, tContact, sXmlRole);
            } // end loop SG40

            if (!this._isXmlEmpty(tContact.Name)) {
                // only when tContact.Name is not empty
                tContact.sendTo(tConfItem.Contact.ele('Contact'));
            }
        } // end loop SG37s

        // SG26 SG41
        let SG41s = this._dGrps(SG26, 'SG41');
        SG41s = SG41s ?? [];
        for (let SG41 of SG41s) {
            this._SG41(SG41, tOtherConfStatus, tItemIn, tItemDetail);
        } // end loop SG41s

        if (!tDetailRetail.isEmpty()) {
            tDetailRetail.sendTo(this._ele3(tItemDetail.ItemDetailIndustry, 'ItemDetailIndustry', 'ItemDetailRetail'));
        }

        // Everything related to tItemIn is done,
        // before creating new real ConfirmationStatus, we merge our template
        tItemDetail.sendTo(tItemIn.ItemDetail.ele('ItemDetail'));
        tItemID.sendTo(tItemIn.ItemID.ele('ItemID'));
        tItemIn.sendTo(tDetailConfStatus.ItemIn.ele('ItemIn'));

        // SG51
        // SG51/RFF+AAN is linked with SG52/QTY+187 

        let sSG51_RFF_AAN = '';
        let SG51s = this._dGrps(SG26, 'SG51');
        SG51s = SG51s ?? [];
        for (let SG51 of SG51s) {
            let tSG51ConfStatus = new TidyConfirmationStatus(); // SG51 level template
            // SCC, ignore
            // FTX
            let FTXs = this._dSegs(SG51, 'FTX');
            FTXs = FTXs ?? [];
            for (let FTX of FTXs) {
                let vFTX1 = this._segVal(FTX, 1);
                let vFTX401 = this._segVal(FTX, 401);
                switch (vFTX1) {
                    case 'AAI':
                        let sComments = this._segVal(FTX, 401)
                            + this._segVal(FTX, 402)
                            + this._segVal(FTX, 403)
                            + this._segVal(FTX, 404);
                        + this._segVal(FTX, 405);
                        let sLang = this._segVal(FTX, 5);
                        tSG51ConfStatus.Comments.ele('Comments').txt(sComments)
                            .att(XML.lang, sLang);
                        break;
                    case 'TXD':
                        // TODO
                        break;
                    case 'ACD':
                        tSG51ConfStatus.Extrinsic.ele('Extrinsic').att('name', 'RejectionReasonComments')
                            .txt(this._mci(MAPS.mapRejectReason, vFTX401));
                        tSG51ConfStatus.Extrinsic.ele('Extrinsic').att('name', 'RejectionReason')
                            .txt(vFTX401);
                        break;
                    case 'ZZZ':
                        let sName = vFTX401;
                        let sValue = this._segVal(FTX, 402) + this._segVal(FTX, 403) + this._segVal(FTX, 404) + this._segVal(FTX, 405);
                        tSG51ConfStatus.Extrinsic.ele('Extrinsic').att('name', sName).txt(sValue);
                        break;

                }
            } // end loop FTXs

            // RFF, assume only one
            let RFF = this._dSeg1(SG51, 'RFF');
            if (RFF) {
                if (this._segVal(RFF, 101) == 'AAN') {
                    sSG51_RFF_AAN = this._segVal(RFF, 102);
                }
            }

            // SG52
            let SG52s = this._dGrps(SG51, 'SG52');
            SG52s = SG52s ?? [];

            let DTM_2 = this._segByGrpEleVal(SG52s, 'DTM', 101, '2'); // peek the value before creating real ConfStatus
            let sRequestedDeliveryDate = Utils.dateStrFromDTM2(this._segVal(DTM_2, 102), this._segVal(DTM_2, 103));
            let QTY_187 = this._segByGrpEleVal(SG52s, 'QTY', 101, '187');
            let tNewConfStatus: TidyConfirmationStatus;
            for (let SG52 of SG52s) {
                tNewConfStatus = undefined; // clear it in every loop
                //tDetailConfStatus.sendTo(newConfStatus);
                // QTY
                let QTY = this._dSeg1(SG52, 'QTY');
                let vQTY101 = this._segVal(QTY, 101);
                let vQTY102 = this._segVal(QTY, 102);
                let vQTY103 = this._segVal(QTY, 103);
                let iQty102 = Number.parseInt(vQTY102);
                switch (vQTY101) {
                    case '194':
                        iOutQty += iQty102;
                        tNewConfStatus = new TidyConfirmationStatus();
                        if (sSG30_PRI == 'CUP' || sSG30_PRI == 'AAK') {
                            // @type = 'detail'
                            tDetailConfStatus.copyTo(tNewConfStatus);
                            tSG51ConfStatus.copyTo(tNewConfStatus);
                            tNewConfStatus.att('type', 'detail');
                        } else {
                            // @type = 'accept'
                            tOtherConfStatus.copyTo(tNewConfStatus);
                            tSG51ConfStatus.copyTo(tNewConfStatus);
                            tNewConfStatus.att('type', 'accept');
                        }
                        tNewConfStatus.att('quantity', vQTY102);
                        tNewConfStatus.UnitOfMeasure.ele('UnitOfMeasure').txt(vQTY103);
                        break;
                    case '185':
                        iOutQty += iQty102;
                        tNewConfStatus = new TidyConfirmationStatus();
                        tOtherConfStatus.copyTo(tNewConfStatus);
                        tSG51ConfStatus.copyTo(tNewConfStatus);
                        tNewConfStatus.att('type', 'reject');
                        tNewConfStatus.att('quantity', vQTY102);
                        tNewConfStatus.UnitOfMeasure.ele('UnitOfMeasure').txt(vQTY103);
                        break;
                    case '83':
                        iOutQty += iQty102;
                        tNewConfStatus = new TidyConfirmationStatus();
                        tDetailConfStatus.copyTo(tNewConfStatus);
                        tSG51ConfStatus.copyTo(tNewConfStatus);
                        tNewConfStatus.att('type', 'backordered');
                        tNewConfStatus.att('quantity', vQTY102);
                        tNewConfStatus.UnitOfMeasure.ele('UnitOfMeasure').txt(vQTY103);
                        break;
                    case '187':
                        // should not create a new /ConfirmationStatus node.
                        // sSG51_RFF_AAN: /ConfirmationRequest/ConfirmationItem/ConfirmationStatus/ScheduleLineReference/@lineNumber
                        // ConfirmationRequest/ConfirmationItem/ConfirmationStatus/ScheduleLineReference/@requestedDeliveryDate

                        break;

                } // end switch vQTY101

                // SG52/QTY+187 is linked with SG51/RFF+AAN and should not create a new /ConfirmationStatus node.
                // If both exist map to /ConfirmationRequest/ConfirmationItem/ConfirmationStatus/ScheduleLineReference/ 
                // for every /ConfirmationStatus node created by SG52/QTY+194 or SG52/QTY+185 or SG52/QTY+83
                if (tNewConfStatus && sSG51_RFF_AAN && QTY_187) {
                    let vQTY102 = this._segVal(QTY_187, 102);
                    tNewConfStatus.ScheduleLineReference.ele('ScheduleLineReference').att(XML.quantity, vQTY102)
                        .att('requestedDeliveryDate', sRequestedDeliveryDate).att('lineNumber', sSG51_RFF_AAN);
                }

                // DTM
                let DTMs = this._dSegs(SG52, 'DTM');

                for (let DTM of DTMs) {
                    let vDTM101 = this._segVal(DTM, 101);
                    let vDTM102 = this._segVal(DTM, 102);
                    let vDTM103 = this._segVal(DTM, 103);
                    switch (vDTM101) {
                        case '69':
                            if (tNewConfStatus) {
                                tNewConfStatus.att('deliveryDate',
                                    Utils.dateStrFromDTM2(vDTM102, vDTM103)
                                )
                            }
                            break;
                        case '10':
                            if (tNewConfStatus) {
                                tNewConfStatus.att('shipmentDate',
                                    Utils.dateStrFromDTM2(vDTM102, vDTM103)
                                )
                            }
                            break;
                        case '200':
                            // TODO
                            break;
                        case '2':
                            // sRequestedDeliveryDate already set date before this loop for requestDeliveryDate
                            break;
                    }
                }

                if (tNewConfStatus) {
                    tNewConfStatus.sendTo(tConfItem.ConfirmationStatus.ele('ConfirmationStatus'));
                }

            } // end loop SG52s
        } // end loop SG51s

        // extra record for type='unknown'
        // Required calculation:
        // SG26/QTY/C_C186/D_6063="21"/D_6060 
        // - [minus] 
        // sum of SG52/QTY/C_C186/D_6060/D_6063=ANY = Difference quantity 
        if (iLineQty > iOutQty) {
            let tNewConfStatus = new TidyConfirmationStatus();
            tNewConfStatus.att('type', 'unknown');
            tNewConfStatus.att('quantity', (iLineQty - iOutQty).toString());
            tNewConfStatus.UnitOfMeasure.ele('UnitOfMeasure').txt(sItemUoM);
            tNewConfStatus.sendTo(tConfItem.ConfirmationStatus.ele('ConfirmationStatus'));
        }

        tConfItem.sendTo(tConfReq.ConfirmationItem.ele('ConfirmationItem'));
    } // end function _SG26

    private _SG41(SG41: ASTNode, tOtherConfStatus: TidyConfirmationStatus, tItemIn: TidyItemIn, tItemDetail: TidyItemDetail) {
        // ALC 
        let ALC = this._dSeg1(SG41, 'ALC');
        // Should be "A" for /AdditionalDeduction and "C" for /AdditionalCost
        let vALC1 = this._segVal(ALC, 1);
        let vALC201 = this._segVal(ALC, 201);
        let vALC204 = this._segVal(ALC, 204);
        let vALC501 = this._segVal(ALC, 501);
        let vALC504 = this._segVal(ALC, 504);
        let vALC505 = this._segVal(ALC, 505);
        if (vALC1 == 'C' && vALC501 == 'SAA') {
            let eShippingOther = this._ele2(tOtherConfStatus.Shipping, 'Shipping');
            eShippingOther.att('trackingDomain', vALC201);
            eShippingOther.ele(XML.Description).att(XML.lang, 'EN').ele('ShortName').txt(vALC504);

            let eShippingDetail = this._ele2(tItemIn.Shipping, 'Shipping');
            eShippingDetail.att('trackingDomain', vALC201);
            eShippingDetail.ele(XML.Description).att(XML.lang, 'EN').ele('ShortName').txt(vALC504);
        }

        let eModsOther = this._ele3(tOtherConfStatus.UnitPrice, 'UnitPrice', 'Modifications'); // for Status other thant 'detail' and 'backordered'
        let eModsDetail = this._ele3(tItemDetail.UnitPrice, 'UnitPrice', 'Modifications'); // 'detail' and 'backordered' from /ConfirmationStatus/ItemIn/ItemDetail
        if (this._mei(MAPS.mapALC7161, vALC501)) {
            // for Status other thant 'detail' and 'backordered'
            //let eMod = eModsOther.ele('Modification');
            let tMod = new TidyModification();
            let eModDetail = tMod.ModificationDetail.ele('ModificationDetail');
            eModDetail.ele(XML.Description).att(XML.lang, 'EN').ele('ShortName').txt(vALC201);
            tMod.att('level', vALC204);
            eModDetail.att('name', this._mcs(MAPS.mapALC7161, vALC501));
            this._ele2(eModDetail, XML.Description).att(XML.lang, 'EN').txt(vALC504 + vALC505);
            // DTM
            let DTMs = this._dSegs(SG41, 'DTM');
            DTMs = DTMs ?? [];
            this._SG41_DTM(eModDetail, DTMs);
            tMod.sendTo(eModsOther.ele('Modification'));
            tMod.sendTo(eModsDetail.ele('Modification'));
        }

        // SG41 SG43
        let SG43 = this._dGrp1(SG41, 'SG43');
        let PCD = this._dSeg1(SG43, 'PCD');
        if (PCD) {
            let vPCD101 = this._segVal(PCD, 101);
            let vPCD102 = this._segVal(PCD, 102);
            if (vPCD101 in ['1', '2', '3']) {
                let tMod = new TidyModification();
                // Should be "A" for /AdditionalDeduction and "C" for /AdditionalCost
                if (vALC1 == 'A') {
                    tMod.AdditionalDeduction.ele('AdditionalDeduction').ele('DeductionPercent')
                        .att('percent', vPCD102);
                } else {
                    // 'C'
                    tMod.AdditionalCost.ele('AdditionalCost').ele('Percentage')
                        .att('percent', vPCD102);
                }
                tMod.sendTo(eModsOther.ele('Modification'));
                tMod.sendTo(eModsDetail.ele('Modification'));
            }

        } // end PCD exists

        // SG44 group44
        let SG44s = this._dGrps(SG41, 'SG44');
        SG44s = SG44s ?? [];
        for (let SG44 of SG44s) {
            let tMod = new TidyModification();
            let MOA = this._dSeg1(SG44, 'MOA');
            let vMOA101 = this._segVal(MOA, 101);
            let vMOA102 = this._segVal(MOA, 102);
            let vMOA103 = this._segVal(MOA, 103);
            let vMOA104 = this._segVal(MOA, 104);
            switch (vMOA101) {
                case '98':
                    tMod.OriginalPrice.ele('OriginalPrice').ele(XML.Money)
                        .txt(vMOA102).att(XML.currency, vMOA103);
                    break;
                case '4':
                case '296':
                    tMod.AdditionalDeduction.ele('DeductedPrice').ele(XML.Money)
                        .txt(vMOA102).att(XML.currency, vMOA103);
                    break;
                case '8':
                case '23':
                    // [MOA+8 or MOA+23 : /AdditionalCost/Money]
                    tMod.AdditionalCost.ele('AdditionalCost').ele(XML.Money)
                        .txt(vMOA102).att(XML.currency, vMOA103);
                    break;
                case '204':
                    // [MOA+204 : /AdditionalDeduction/DeductionAmount/Money]
                    tMod.AdditionalDeduction.ele('AdditionalDeduction').ele('DeductionAmount').ele(XML.Money)
                        .txt(vMOA102).att(XML.currency, vMOA103);
                    break;
            } // end switch vMOA101

            // SG44 (the red part)
            // TODO: MOA

            tMod.sendTo(eModsOther.ele('Modification'));
            tMod.sendTo(eModsDetail.ele('Modification'));

        } // end loop SG44
    }

    private _SG41_DTM(eModDetail: XMLBuilder, DTMs: EdiSegment[]) {
        for (let DTM of DTMs) {
            let vDTM101 = this._segVal(DTM, 101);
            let vDTM102 = this._segVal(DTM, 102);
            let vDTM103 = this._segVal(DTM, 103);
            // .att('startDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
            switch (vDTM101) {
                case '194':
                    eModDetail.att('startDate', Utils.dateStrFromDTM2(vDTM102, vDTM103))
                    break;
                case '206':
                    eModDetail.att('endDate', Utils.dateStrFromDTM2(vDTM102, vDTM103))
                    break;
            }
        }

    }
    private _SG19(SG19: ASTNode, tConfReq: TidyConfirmationRequest, tConfHeader: TidyConfirmationHeader) {
        // ALC
        let ALC = this._dSeg1(SG19, 'ALC');
        let vALC1 = this._segVal(ALC, 1);
        if (vALC1 != 'C' && vALC1 != 'A') {
            return;
        }

        let vALC501 = this._segVal(ALC, 501);

        if (vALC1 == 'C' && vALC501 == 'SAA') {
            let eShipping = this._ele2(tConfHeader.Shipping, 'Shipping');
            eShipping.att('trackingDomain', this._segVal(ALC, 201));

            eShipping.att('trackingId', this._segVal(ALC, 505));

            // SG22 Group22
            let SG22s = this._dGrps(SG19, 'SG22');
            SG22s = SG22s ?? [];
            for (let SG22 of SG22s) {
                let MOA = this._dSeg1(SG22, 'MOA');
                let v101 = this._segVal(MOA, 101);
                let v104 = this._segVal(MOA, 104);

                if (v101 == '23' && v104 == '9') {
                    // main currency
                    let eMoney = this._ele2(eShipping, XML.Money);
                    eMoney.txt(this._segVal(MOA, 102));
                    eMoney.att(XML.currency, this._segVal(MOA, 103));
                }
                if (v101 == '23' && v104 == '7') {
                    // alternate currency
                    let eMoney = this._ele2(eShipping, XML.Money);
                    eMoney.att('alternateAmount', this._segVal(MOA, 102));
                    eMoney.att('alternateCurrency', this._segVal(MOA, 103));
                }
            }

            // according to DTD, adjusted order
            this._ele2(eShipping, XML.Description).att(XML.lang, 'EN').ele('ShortName').txt(this._segVal(ALC, 504));
        } // end SAA

        // ALC 7161
        if (MAPS.mapALC7161[vALC501]) {

            let eTotal = this._ele2(tConfHeader.Total, 'Total');
            this._ele2(eTotal, XML.Money); // create placeholder to ensure cXML DTD regulation
            let eMods = this._ele2(eTotal, 'Modifications');
            //let eMod = eMods.ele('Modification');
            let tMod = new TidyModification();
            let eModDetail = tMod.ModificationDetail.ele('ModificationDetail');
            let eDesc = eModDetail.ele(XML.Description);
            eDesc.att(XML.lang, 'EN');
            eDesc.ele('ShortName').txt(this._segVal(ALC, 201));
            tMod.att('level', this._segVal(ALC, 204));
            eModDetail.att('name', this._mcs(MAPS.mapALC7161, vALC501));
            eDesc.txt(this._segVal(ALC, 504) + this._segVal(ALC, 505));

            // DTM
            let DTMs = this._dSegs(SG19, 'DTM');
            for (let DTM of DTMs) {
                let dtmVal101 = this._segVal(DTM, 101);
                let dtmVal102 = this._segVal(DTM, 102);
                let dtmVal103 = this._segVal(DTM, 103);
                switch (dtmVal101) {
                    case '194':
                        eModDetail.att('startDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                        break;
                    case '206':
                        eModDetail.att('endDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                        break;
                    // case '351':
                    //     tInvoiceDetailOrderSummary.att('inspectionDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                    //     break;
                    default:
                    // do nothing
                }
            } // end loop DTMs

            // SG21 Group 21
            let SG21 = this._dGrp1(SG19, 'SG21');
            let PCD = this._dSeg1(SG21, 'PCD');
            let vPCD101 = this._segVal(PCD, 101);
            let vPCD102 = this._segVal(PCD, 102);
            if (vPCD101 in ['1', '2', '3']) {
                // Should be "A" for /AdditionalDeduction and "C" for /AdditionalCost
                if (vALC1 == 'A') {
                    tMod.AdditionalDeduction.ele('AdditionalDeduction').ele('DeductionPercent')
                        .att('percent', vPCD102);
                } else {
                    // 'C'
                    tMod.AdditionalCost.ele('AdditionalCost').ele('Percentage')
                        .att('percent', vPCD102);
                }
            }

            // SG22 Group 22
            let SG22s = this._dGrps(SG19, 'SG22');
            SG22s = SG22s ?? [];
            for (let SG22 of SG22s) {
                let MOA = this._dSeg1(SG22, 'MOA');
                let v101 = this._segVal(MOA, 101);
                let v102 = this._segVal(MOA, 102);
                let v103 = this._segVal(MOA, 103);
                let v104 = this._segVal(MOA, 104);
                switch (v101) {
                    case '98':
                        tMod.OriginalPrice.ele('OriginalPrice').ele(XML.Money)
                            .txt(v102).att(XML.currency, v103);
                        break;
                    case '4':
                    case '296':
                        tMod.AdditionalDeduction.ele('AdditionalDeduction').ele('DeductionAmount').ele(XML.Money)
                            .txt(v102).att(XML.currency, v103);
                        break;
                    case '8':
                    case '23':
                        tMod.AdditionalCost.ele('AdditionalCost').ele(XML.Money)
                            .txt(v102).att(XML.currency, v103);
                        break;
                    case '204':
                        tMod.AdditionalDeduction.ele('AdditionalDeduction').ele('DeductionAmount').ele(XML.Money)
                            .txt(v102).att(XML.currency, v103);
                        break;
                }
            } // end loop SG22s
            tMod.sendTo(eMods.ele('Modification'));
        } // end if MAPS.mapALC7161[vALC501] exists


    } // end function _SG19

    private _SG3(SG3: ASTNode, tConfReq: TidyConfirmationRequest, tConfHeader: TidyConfirmationHeader) {
        // NAD
        let NAD = this._dSeg1(SG3, 'NAD');
        let vNAD1 = this._segVal(NAD, 1);
        let tContact = new TidyContact();
        let roleName = this._mcs(MAPS.mapNAD3035, vNAD1)
        tContact.att('role', roleName);
        tContact.att('addressID', this._segVal(NAD, 201));
        tContact.att('addressIDDomain', this._mcs(MAPS.mapNAD3055, this._segVal(NAD, 203)));
        tContact.Name.ele('Name').txt(this._segVal(NAD, 301)
            + this._segVal(NAD, 302)
            + this._segVal(NAD, 303)
            + this._segVal(NAD, 304)
            + this._segVal(NAD, 305)
        ).att(XML.lang, 'EN');
        this._NADPostalAddr2(tContact, NAD);

        // SG3_SG6
        let SG6 = this._dGrp1(SG3, 'SG6');
        this._xmlCommFromCTA(SG6, tContact, roleName);

        tContact.sendTo(tConfHeader.Contact.ele('Contact'));

    }
    private _SG1(SG1: ASTNode, tConfReq: TidyConfirmationRequest, tConfHeader: TidyConfirmationHeader) {
        // SG1 RFF
        let RFFs = this._dSegs(SG1, 'RFF');
        RFFs = RFFs ?? [];
        for (let RFF of RFFs) {
            let v101 = this._segVal(RFF, 101);
            let v102 = this._segVal(RFF, 102);
            switch (v101) {
                case 'ON':
                    // dummy 'DocumentReference' is just to fulfill the DTD requirment
                    this._ele2(tConfReq.OrderReference, 'OrderReference').att('orderID', v102)
                        .ele('DocumentReference').att(XML.payloadID, '');
                    break;
                case 'POR':
                    tConfHeader.att('confirmID', v102)
                    break;
                case 'IV':
                    tConfHeader.att('invoiceID', v102)
                    break;
                case 'CR':
                    tConfHeader.IdReference.ele(XML.IdReference)
                        .att(XML.domain, 'CustomerReferenceID')
                        .att(XML.identifier, v102);
                    break;
                case 'UC':
                    tConfHeader.IdReference.ele(XML.IdReference)
                        .att(XML.domain, 'UltimateCustomerReferenceID')
                        .att(XML.identifier, v102);
                    break;
                case 'AEU':
                    tConfHeader.IdReference.ele(XML.IdReference)
                        .att(XML.domain, 'supplierReference')
                        .att(XML.identifier, v102);
                    break;
            }
        }

        // SG1 DTM
        let DTMs = this._dSegs(SG1, 'DTM');
        DTMs = DTMs ?? [];
        for (let DTM of DTMs) {
            let v101 = this._segVal(DTM, 101);
            let v102 = this._segVal(DTM, 102);
            let v103 = this._segVal(DTM, 103);
            switch (v101) {
                case '171':
                case '4':
                    this._ele2(tConfReq.OrderReference, 'OrderReference').att('orderDate'
                        , Utils.dateStrFromDTM2(v102, v103));
                    break;
            }
        }
    }
} // end class Cvt_ORDRSP_OrderConfirmation

class MAPS {
    static mapBGM1225: Object = {
        "5": "update",
        "9": "new",
    };
    static mapBGM4343: Object = {
        "AC": "detail",
        "AI": "except",
        "AP": "accept",
        "RE": "reject",
    };
    static mapRejectReason: Object = {
        "duplicate order": "duplicateOrder",
        "incorrect delivery date": "incorrectDeliveryDate",
        "incorrect description": "incorrectDescription",
        "incorrect price": "incorrectPrice",
        "incorrect quantity": "incorrectQuantity",
        "incorrect stock/part number": "incorrectStockPartNumber",
        "incorrect supplier code used": "incorrectSupplierCodeUsed",
        "incorrect uom": "incorrectUOM",
        "not our product line": "notOurProductLine",
        "unable to supply item(s)": "unableToSupplyItems",
        "other": "other",

    };

    static mapNAD3035: Object = {
        "AM": "administrator",
        "AT": "technicalSupport",
        "BI": "buyerMasterAccount",
        "BT": "billTo",
        "BY": "buyer",
        "CA": "carrierCorporate",
        "CO": "corporateOffice",
        "DO": "correspondent",
        "DP": "deliveryParty",
        "UD": "subsequentBuyer",
        "FD": "buyerCorporate",
        "FR": "from",
        "II": "issuerOfInvoice",
        "IV": "buyer",
        "LP": "consignmentOrigin",
        "MF": "ManufacturerName",
        "OB": "endUser",
        "PD": "purchasingAgent",
        "PK": "taxRepresentative",
        "PO": "buyerAccount",
        "RE": "remitTo",
        "RF": "billFrom",
        "RH": "supplierMasterAccount",
        "SB": "sales",
        "SE": "supplierAccount",
        "SF": "shipFrom",
        "SO": "soldTo",
        "SR": "customerService",
        "ST": "shipTo",
        "SU": "supplierCorporate",
        "UP": "consignmentDestination",
    };

    static mapNAD3055: Object = {
        "3": "IATA",
        "9": "EAN",
        "12": "UIC",
        "16": "DUNS",
        "91": "Assigned by seller or seller's agent",
        "92": "Assigned by buyer or buyer's agent",
        "182": "SCAC",
    }

    static mapTAX5153: Object = {
        "AAA": "other",
        "AAB": "other",
        "AAC": "other",
        "ADD": "other",
        "BOL": "other",
        "CAP": "other",
        "CAR": "other",
        "COC": "other",
        "CST": "other",
        "CUD": "other",
        "CVD": "other",
        "ENV": "other",
        "EXC": "other",
        "EXP": "other",
        "FET": "other",
        "FRE": "other",
        "GCN": "other",
        "GST": "gst",
        "ILL": "other",
        "IMP": "other",
        //"IND": "withholdingTax",
        "LAC": "other",
        "LCN": "other",
        "LDP": "other",
        "LOC": "sales",
        "LST": "other",
        "MCA": "other",
        "MCD": "other",
        "OTH": "other",
        "PDB": "other",
        "PDC": "other",
        "PRF": "other",
        "SCN": "other",
        "SSS": "other",
        "STT": "sales",
        "SUP": "other",
        "SUR": "other",
        "SWT": "other",
        "TAC": "other",
        "TOT": "other",
        "TOX": "other",
        "TTA": "other",
        "VAD": "other",
        "VAT": "vat",
    }

    static mapTOD4053: Object = {
        "CFR": "cfr",
        "CIF": "cif",
        "CIP": "cip",
        "CPT": "cpt",
        "DAF": "daf",
        "DDP": "ddp",
        "DDU": "ddu",
        "DEQ": "deq",
        "DES": "des",
        "EXW": "exw",
        "FAS": "fas",
        "FCA": "fca",
        "FOB": "fob",
    };

    static mapALC7161: Object = {
        "AA": "AdvertisingAllowance",
        "AAB": "ReturnedGoodsCharges",
        "ABK": "Charge",
        "ABL": "PackagingSurcharge",
        "ABP": "Carrier",
        "ACA": "Allowance",
        "ADI": "Royalties",
        "ADK": "Shipping ",
        "ADR": "OtherServices",
        "ADS": "FullPalletOrdering",
        "ADT": "PickUp",
        "AJ": "Adjustment",
        "CAC": "CashDiscount",
        "CL": "ContractAllowance",
        "DI ": "Discount",
        "EAB": "EarlyPaymentAllowance",
        "FAC": "FreightBasedOnDollarMinimum",
        "FC": "Freight",
        "FI": "FinanceCharge",
        "HD": "Handling",
        "IN": "Insurance",
        "PAD": "PromotionalAllowance",
        "QD": "QuantityDiscount",
        "RAA": "Rebate",
        "SC": "Surcharge",
        "SF": "Discount-Special",
        "TAE": "TruckloadDiscount",
        "TD": "TradeDiscount",
        "TX": "Tax",
        "VAB": "Volume Discount",
    };

    static mapIMD7081: Object = {
        "13": "quality",
        "35": "color",
        "38": "grade",
        "98": "size",

    }

} // end class MAP
