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
import { TidyContact, TidyItemID, TidyModification, TidyTax, TidyTaxDetail } from "../xmlTidy/TidyCommon";
import { TidyInvoiceDetailItem, TidyInvoiceDetailItemReference, TidyInvoiceDetailOrder, TidyInvoiceDetailOrderSummary, TidyInvoiceDetailRequest, TidyInvoiceDetailRequestHeader, TidyInvoiceDetailServiceItem, TidyInvoiceDetailServiceItemReference, TidyInvoiceDetailShipping, TidyInvoiceDetailSummary} from "../xmlTidy/Invoice";


type OMapOrderDetail = {
    [key: string]: TidyInvoiceDetailOrder;
}

/**
 * No need to make singleton because parserUtil already assured it
 */
export class Cvt_INVOIC_Invoice extends ConverterBase {
    private _isHeaderInvoice: boolean = false;
    private _bBGM385: boolean = false;
    private _currTrans = '';
    private _currLocal = '';
    private _maptDetailOrders: OMapOrderDetail = {}; // when looping items, we need to find parent InvoiceDetailOrder
    // lineLevelDebitMemo,lineLevelCreditMemo, standard, creditMemo, debitMemo, standard
    private _purposeXML;
    private _tDReqHeader: TidyInvoiceDetailRequestHeader;
    private _bNONPO: boolean = false;
    private _currPO: string;

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

        if (!BGM) {
            this._addCvtDiagHeader('ROOT_BGM segment not exist.')
        } else {
            let purpose = this._segVal(BGM, 101);
            if (!purpose || !MAPS.mapBGMDocName[purpose]) {
                // this._addCvtDiagSeg(BGM, 'Document/message name not exist, ROOT_BGM id:1001')
                this._addCvtDiagEle(BGM, BGM.getElement2(101), `Document/message name not exist, ${this._diagPath(BGM)} id:1001`)
            }
        }

        // DTM invoiceDate
        let DTM3 = this._rSegByEleVal('DTM', 101, '3');
        let DTM137 = this._rSegByEleVal('DTM', 101, '137');
        let focusDTM: EdiSegment;
        let strInvoiceDate: string;
        if (DTM3) {
            let invoiceDate = this._segVal(DTM3, 102);
            strInvoiceDate = Utils.dateStrFromDTM2(invoiceDate, this._segVal(DTM3, 103));
            focusDTM = DTM3;
        }
        if (DTM137) {
            let invoiceDate = this._segVal(DTM137, 102);
            strInvoiceDate = Utils.dateStrFromDTM2(invoiceDate, this._segVal(DTM137, 103));
            focusDTM = DTM137;
        }
        if (focusDTM && !strInvoiceDate) {
            this._addCvtDiagEle(focusDTM, focusDTM.getElement2(102),
                `Invoice Date Format is not correct, ${this._diagPath(focusDTM)} id:2380`)
        }

        // DTM 35
        let DTM35 = this._rSegByEleVal('DTM', 101, '35');
        if (DTM35) {
            let deliveryDate = Utils.dateStrFromDTM2
                (this._segVal(DTM35, 102), this._segVal(DTM35, 103));

            if (!deliveryDate) {
                this._addCvtDiagEle(DTM35, DTM35.getElement2(102),
                    `Delivery Date Format is not correct, ${this._diagPath(DTM35)} id:23801`)
            }
        }

        // DTM 110 Shipping Date
        let DTM110 = this._rSegByEleVal('DTM', 101, '110');

        if (DTM110) {
            let shippingDate = Utils.dateStrFromDTM2
                (this._segVal(DTM110, 102), this._segVal(DTM110, 103));
            if (!shippingDate) {
                this._addCvtDiagEle(DTM110, DTM110.getElement2(102),
                    `Shipping Date Format is not correct, ${this._diagPath(DTM110)} id:2380`)
            }
        }

        // DTM startDate       
        let DTM194 = this._rSegByEleVal('DTM', 101, '194');
        if (DTM194) {
            let startDate = Utils.dateStrFromDTM2
                (this._segVal(DTM194, 102), this._segVal(DTM194, 103));
            if (!startDate) {
                this._addCvtDiagEle(DTM194, DTM194.getElement2(102),
                    `Start Date Format is not correct, ${this._diagPath(DTM194)} id:2380`)
            }
        }

        // DTM startDate
        let DTM206 = this._rSegByEleVal('DTM', 101, '206');
        if (DTM206) {
            let endDate = Utils.dateStrFromDTM2
                (this._segVal(DTM206, 102), this._segVal(DTM206, 103));
            if (!endDate) {
                this._addCvtDiagEle(DTM206, DTM206.getElement2(102),
                    `End Date Format is not correct, ${this._diagPath(DTM206)} id:2380`)
            }
        }

        // DTM start&end Date
        let DTM263 = this._rSegByEleVal('DTM', 101, '263');
        if (DTM263) {
            const { start, end } = Utils.dateStrFromDTM718
                (this._segVal(DTM263, 102), this._segVal(DTM263, 103));

            if (!start || !end) {
                this._addCvtDiagEle(DTM263, DTM263.getElement2(102),
                    `Start/End Date Format is not correct, ${this._diagPath(DTM263)} id:2380`)
            }
        }

        // Group1 RFF, S101 == "IL"
        let SG1s = this._rGrps('SG1');
        // let bNONPO = this._getNONPO(SG1s);
        // let SG1RFFON = this._segByEleVal2(SG1s, 'RFF', 101, 'ON');
        // if(!bNONPO && !SG1RFFON) {
        //     this._addCvtDiagHeader(`This document is neither NONPO or withPO, please inspect RFF+IL and RFF+ON .`);
        // }

        // Maybe don't need to be so strict
        // let SG1RFFON = this._segByEleVal2(SG1s, 'RFF', 101, 'ON');
        // if (SG1RFFON) {
        //     let parentSG1RFFON = SG1RFFON.astNode.parentNode;
        //     let SG1DTMON4 = this._segByEleVal(parentSG1RFFON, 'DTM', 101, '4');
        //     let SG1DTMON171 = this._segByEleVal(parentSG1RFFON, 'DTM', 101, '171');
        //     if (!SG1DTMON4 && !SG1DTMON171) {
        //         this._addCvtDiagSeg(SG1RFFON, `Cannot find following DTM[2005=4 or 2005=171] for this RFF+ON`);
        //     }

        // }
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
            sysID: 'http://xml.cxml.org/schemas/cXML/1.2.060/InvoiceDetail.dtd'
        });

        // header supplier2buyer
        this._header_supplier_to_buyer(cxml);

        let request = cxml.ele(XML.Request);

        //  <!ELEMENT InvoiceDetailRequest
        // (InvoiceDetailRequestHeader,
        //  (InvoiceDetailOrder+ | InvoiceDetailHeaderOrder+),
        //  InvoiceDetailSummary)>
        let eInvoiceDetailRequest = request.ele(XML.InvoiceDetailRequest);
        let tInvoiceDetailRequest = new TidyInvoiceDetailRequest();

        let invoiceDetailRequestHeader = eInvoiceDetailRequest.ele(XML.InvoiceDetailRequestHeader);
        this._tDReqHeader = new TidyInvoiceDetailRequestHeader();
        this._tDReqHeader.att('invoiceOrigin', 'supplier'); // added by reverse engineering

        // let fragIVDetailOrder = fragment();
        // let fragIVDetailHeaderOrder = fragment(); // not used yet
        // let fragIVDetailSummyary = fragment();

        // <!ELEMENT InvoiceDetailSummary (SubtotalAmount, Tax, SpecialHandlingAmount?,
        //     ShippingAmount?, GrossAmount?,
        //     InvoiceDetailDiscount?, InvoiceHeaderModifications?, InvoiceDetailSummaryLineItemModifications?,
        //     TotalCharges?, TotalAllowances?, TotalAmountWithoutTax?, NetAmount,
        //     DepositAmount?, DueAmount?, InvoiceDetailSummaryIndustry?)>
        let invoiceDetailSummary = tInvoiceDetailRequest.InvoiceDetailSummary.ele('InvoiceDetailSummary');
        let tIVDSummary = new TidyInvoiceDetailSummary()
        //let eSummaryTax = tIVDSummary.Tax.ele('Tax');
        let tSummaryTax = new TidyTax();

        let UNB = this._rseg('UNB');
        let testIndicator = this._segVal(UNB, 11);
        request.att(XML.deploymentMode, CUtilEDI.testIndicatorXML(testIndicator));

        let tmpExtrinsic = this._tDReqHeader.Extrinsic.ele(XML.Extrinsic);
        tmpExtrinsic.att('name', XML.invoiceSubmissionMethod);
        tmpExtrinsic.txt('CIG_EDIFact')

        // BGM
        let BGM = this._rseg("BGM");
        // <InvoiceDetailRequestHeader @purpose>
        let purpose = this._segVal(BGM, 101);
        if (purpose == '381' || purpose == '383') {
            this._isHeaderInvoice = true;
            this._tDReqHeader.InvoiceDetailHeaderIndicator.ele('InvoiceDetailHeaderIndicator').att('isHeaderInvoice', 'yes');
        }
        if (purpose == '385') {
            this._bBGM385 = true;
        }
        this._purposeXML = MAPS.mapBGMDocName[purpose];
        this._tDReqHeader.att('purpose', this._purposeXML);
        // <InvoiceDetailRequestHeader><Extrinsic @name="documentName">
        let dname = this._segVal(BGM, 104);
        if (dname) {
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'documentName').txt(dname);
        }

        this._tDReqHeader.att('invoiceID', this._segVal(BGM, 2));
        let op = this._segVal(BGM, 3)
        this._tDReqHeader.att('operation', CUtilEDI.mapMsgFunc(op));
        if (op && op == '31') {
            this._tDReqHeader.att('isInformationOnly', 'yes');
        }

        // ROOT_DTM
        this._DTM();

        // PAI paymentMethod extrinsic
        let PAI = this._rseg('PAI');
        if (PAI) {
            let payMethod = this._segVal(PAI, 103);
            let mapped = MAPS.mapPAI[payMethod];
            if (!mapped) {
                mapped = 'other';
            }
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'paymentMethod').txt(mapped);
        }

        // ROOT_FTX
        this._FTX(tSummaryTax);

        // SG1_RFF
        this._SG1RFF();

        // RFF VA / DTM, TODO:
        // RFF AHR , TODO:

        // SG2 Group2, /InvoiceDetailRequest/InvoiceDetailRequestHeader/InvoicePartner/…
        let SG2s = this._rGrps('SG2');

        // SG2
        // AN business rule require contacts ST and SF as pair
        let bSTDone = false;
        let bSFDone = false;
        let SG2_NAD_RE: ASTNode;
        let SG2_NAD_FR: ASTNode;
        let SG2_NAD_SU: ASTNode;
        let tInvoiceDetailShipping = new TidyInvoiceDetailShipping();
        for (let sg2 of SG2s) {
            let SG2NAD = this._dSeg1(sg2, 'NAD');
            let vNAD1 = this._segVal(SG2NAD, 1); // Role before mapping
            // prepare data for SG2FII
            switch (vNAD1) {
                case 'RE':
                    SG2_NAD_RE = sg2;
                    break;
                case 'FR':
                    SG2_NAD_FR = sg2;
                    break;
                case 'SU':
                    SG2_NAD_SU = sg2;
                    break;
            }
            this._SG2NonShip(sg2);

            // /InvoiceDetailRequest/InvoiceDetailRequestHeader/InvoiceDetailShipping/…
            let strRole = this._SG2Shipping(sg2, tInvoiceDetailShipping);
            if (strRole == 'ST') {
                bSTDone = true;
            }
            if (strRole == 'SF') {
                bSFDone = true;
            }
        }  // end loop SG2s

        let SG2FII = (SG2_NAD_RE ?? SG2_NAD_FR) ?? SG2_NAD_SU;

        // FII RB will create new Contact
        let contactRB;
        let FIIRBs = this._segsByEleVal2(SG2FII, 'FII', 1, 'RB');
        if (FIIRBs && FIIRBs.length > 0) {
            contactRB = this._FII('wireReceivingBank', FIIRBs);
        }

        // FII I1 will create new Contact
        let contactI1;
        let FIII1s = this._segsByEleVal2(SG2FII, 'FII', 1, 'I1');
        if (FIII1s && FIII1s.length > 0) {
            contactI1 = this._FII('receivingCorrespondentBank', FIII1s);
        }

        if (this._xmlHasChild(tInvoiceDetailShipping.Contact)) {
            // Shipping data exists
            // create Dummy Contact for AN business rule;
            if (!bSTDone) {
                tInvoiceDetailShipping.Contact.first()
                    .ele('Contact').att('role', MAPS.mapNADShipping['ST'])
                    .ele('Name').txt('').att(XML.lang, 'en');
            }
            if (!bSFDone) {
                tInvoiceDetailShipping.Contact
                    .ele('Contact').att('role', MAPS.mapNADShipping['SF'])
                    .ele('Name').txt('').att(XML.lang, 'en');
            }
            tInvoiceDetailShipping.sendTo(this._tDReqHeader.InvoiceDetailShipping.ele('InvoiceDetailShipping'));
        }

        // SG6
        let SG6 = this._rGrp1('SG6');
        if (SG6) {
            let tSummaryTaxDetail = new TidyTaxDetail();
            let SG6TAX = this._dSeg1(SG6, 'TAX');
            tSummaryTaxDetail.att('category', MAPS.mapTAXFreeType[this._segVal(SG6TAX, 201)]);
            tSummaryTaxDetail.TaxLocation.ele('TaxLocation').txt(this._segVal(SG6TAX, 204));
            let val301TT = this._segVal(SG6TAX, 301);
            if (val301TT && val301TT == 'TT') {
                tSummaryTaxDetail.att('isTriangularTransaction', 'yes');
            }

            // SG6 <TaxDetail><TaxableAmount><Money>
            tSummaryTaxDetail.TaxableAmount.ele('TaxableAmount').ele('Money').txt(this._segVal(SG6TAX, 304));
            // /InvoiceDetailSummary><Tax><TaxDetail @taxRateType>
            tSummaryTaxDetail.att('taxRateType', this._segVal(SG6TAX, 501));
            // <InvoiceDetailSummary><Tax><TaxDetail @percentageRate>
            tSummaryTaxDetail.att('percentageRate', this._segVal(SG6TAX, 504));
            this._exemptDetail(false, SG6TAX, tSummaryTaxDetail);
            // <InvoiceDetailSummary><Tax><TaxDetail><Description>
            tSummaryTaxDetail.Description.ele('Description').txt(this._segVal(SG6TAX, 506));
            tSummaryTaxDetail.sendTo(tSummaryTax.TaxDetail.ele('TaxDetail'));
        }

        // SG7,CUX
        let SG7 = this._rGrp1('SG7');
        let SG7CUX = this._dSeg1(SG7, 'CUX');

        if (SG7CUX) {
            // Store in currency and use if currency is not provided in MOA/PRI
            this._currTrans = this._segVal(SG7CUX, 102);
            // Store in alternateCurrency and use if alternateCurrency is not provided in MOA/PRI
            this._currLocal = this._segVal(SG7CUX, 202);

            // <InvoiceDetailRequestHeader><Extrinsic @name="TaxExchangeRate">
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'TaxExchangeRate').txt(
                this._segVal(SG7CUX, 3)
            );
        }

        // SG8
        this._SG8();

        // SG12
        let SG12 = this._rGrp1('SG12');
        let SG12TOD = this._dSeg1(SG12, 'TOD');
        if (SG12TOD) {
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'incoTerms').txt(
                MAPS.mapTOD[this._segVal(SG12TOD, 301)]);
        }

        // SG15
        let SG15s = this._rGrps('SG15'); // TODO: add XMLCheck that SG15s should not be empty
        SG15s = SG15s ?? [];
        for (let sg15 of SG15s) {
            // ALC
            let ALC = this._dSeg1(sg15, 'ALC');
            let vALC1 = this._segVal(ALC, 1);
            let vALC501 = this._segVal(ALC, 501);

            if (vALC1 == 'A' || vALC1 == 'C') {
                // InvoiceDetailRequest/InvoiceDetailSummary/InvoiceHeaderModifications/Modification/...
                this._SG15Modification(sg15, ALC, tIVDSummary.InvoiceHeaderModifications);
            }

            if (vALC1 == 'A' && vALC501 == 'DI') {
                // InvoiceDetailRequest/InvoiceDetailSummary/InvoiceDetailDiscount/…
                this._SG15InvoiceDetailDiscount(sg15, tIVDSummary.InvoiceDetailDiscount);
            }

            if (vALC1 == 'C' && vALC501 == 'SAA') {
                // InvoiceDetailRequest/InvoiceDetailSummary/ShippingAmount/…
                this._SG15ShippingAmount(sg15, tIVDSummary.ShippingAmount, tSummaryTax);
            }

            if (vALC1 == 'C' && vALC501 == 'SH') {
                // InvoiceDetailRequest/InvoiceDetailSummary/SpecialHandlingAmount/…
                this._SG15SpecialHandlingAmount(sg15, ALC, tIVDSummary.SpecialHandlingAmount, tSummaryTax);
            }

        } // end loop SG15s

        // SG25 inlucding all sub groups
        let SG25s = this._rGrps('SG25');
        SG25s = SG25s ?? [];
        if (this._isHeaderInvoice) {
            for (let sg25 of SG25s) {
                this._SG25HeaderInvoice(sg25, tInvoiceDetailRequest);
            }
        } else {
            for (let sg25 of SG25s) {
                this._SG25RegularInvoice(sg25, tInvoiceDetailRequest);
            }
        }

        // ROOT_UNS
        // ROOT_CNT

        // ROOT_SG48
        this._SG48(tIVDSummary);

        // ROOT_SG50
        this._SG50(tIVDSummary);

        // ROOT_SG51
        let SG51s = this._rGrps('SG51');
        for (let sg51 of SG51s) {
            let eInvoiceDetailSummaryLineItemModifications = this._ele2(tIVDSummary.InvoiceDetailSummaryLineItemModifications
                , 'InvoiceDetailSummaryLineItemModifications');
            let eModification = eInvoiceDetailSummaryLineItemModifications.ele('Modification');
            let tModification = new TidyModification();

            let ALC = this._dSeg1(sg51, 'ALC');
            let vALC1 = this._segVal(ALC, 1);
            let vALC501 = this._segVal(ALC, 501);
            let eMDetail = tModification.ModificationDetail.ele('ModificationDetail');
            eMDetail.ele('Description').ele('ShortName').txt(this._segVal(ALC, 201));
            if (vALC501 == 'ZZZ') {
                eMDetail.att('name', this._segVal(ALC, 504));
                //eMDetail.att('Description',this._segVal(ALC,504));
            } else {
                eMDetail.att('name', MAPS.mapALCSpecServ[vALC501]);
                eMDetail.att('Description', this._segVal(ALC, 504));
            }

            let MOAs = this._dSegs(sg51, 'MOA');
            let eAdditional: XMLBuilder;
            let tagNameAdditional: string;
            for (let MOA of MOAs) {
                let vMOA101 = this._segVal(MOA, 101);
                let vMOA102 = this._segVal(MOA, 102);
                let vMOA103 = this._segVal(MOA, 103);
                let vMOA104 = this._segVal(MOA, 104);

                // "Should be "A" for <AdditionalDeduction> and "C" for <AdditionalCost>"
                if (vALC1 == 'A') {
                    if (vMOA101 == '8' || vMOA101 == '131') {
                        this._fillMoney(tModification.AdditionalCost, 'AdditionalCost', vMOA102, vMOA103, vMOA104);
                    }
                } else {
                    if (vMOA101 == '8' || vMOA101 == '131') {
                        this._fillMoney(tModification.AdditionalDeduction.ele('AdditionalDeduction'), 'DeductionAmount', vMOA102, vMOA103, vMOA104);
                    }
                }
            }


            tModification.sendTo(eModification);
        }

        // <!ELEMENT InvoiceDetailSummary (SubtotalAmount, Tax, SpecialHandlingAmount?,
        //     ShippingAmount?, GrossAmount?,
        //     InvoiceDetailDiscount?, InvoiceHeaderModifications?, InvoiceDetailSummaryLineItemModifications?,
        //     TotalCharges?, TotalAllowances?, TotalAmountWithoutTax?, NetAmount,
        //     DepositAmount?, DueAmount?, InvoiceDetailSummaryIndustry?)>
        tSummaryTax.sendTo(tIVDSummary.Tax.ele('Tax'));
        tIVDSummary.sendTo(invoiceDetailSummary);

        //  <!ELEMENT InvoiceDetailRequest
        // (InvoiceDetailRequestHeader,
        //  (InvoiceDetailOrder+ | InvoiceDetailHeaderOrder+),
        //  InvoiceDetailSummary)>   
        this._tDReqHeader.sendTo(invoiceDetailRequestHeader);

        for (let k in this._maptDetailOrders) {
            let e = tInvoiceDetailRequest.InvoiceDetailOrder.ele('InvoiceDetailOrder');
            this._maptDetailOrders[k].sendTo(e);
        }
        tInvoiceDetailRequest.sendTo(eInvoiceDetailRequest);

        const xml = cxml.end({ prettyPrint: true, indent: '    ',spaceBeforeSlash: false });
        return this._adjustXmlforCIG(xml);
    }

    private _SG50(tIVDSummary: TidyInvoiceDetailSummary) {
        let SG50s = this._rGrps('SG50');
        //let eTax = this._ele2(tIVDSummary.Tax, 'Tax');
        let tTax = new TidyTax();
        for (let sg50 of SG50s) {
            let TAX = this._dSeg1(sg50, 'TAX');
            let tTaxDetail = new TidyTaxDetail();

            let vTAX201 = this._segVal(TAX, 201);
            let vTAX204 = this._segVal(TAX, 204);
            let vTAX301 = this._segVal(TAX, 301);
            let vTAX304 = this._segVal(TAX, 304);
            let vTAX501 = this._segVal(TAX, 501);
            let vTAX504 = this._segVal(TAX, 504);
            let vTAX6 = this._segVal(TAX, 6);
            let vTAX7 = this._segVal(TAX, 7);

            tTaxDetail.att('category', MAPS.mapTAXFreeType[vTAX201]);
            tTaxDetail.TaxLocation.ele('TaxLocation').txt(vTAX204);


            let MOA_124_4 = this._segByEleVal3(sg50, 'MOA', 101, '124', 104, '4');
            let MOA_124_7 = this._segByEleVal3(sg50, 'MOA', 101, '124', 104, '7');

            if (vTAX301 == 'TT') {
                tTaxDetail.att('isTriangularTransaction', 'yes');
            }
            // 304
            tTaxDetail.TaxableAmount.ele('TaxableAmount').ele('Money').txt(vTAX304);
            // 501
            tTaxDetail.att('taxRateType', vTAX501);
            tTaxDetail.Extrinsic.ele(XML.Extrinsic).att('name', 'taxAccountCode').txt(vTAX501);

            // 504
            tTaxDetail.att('percentageRate', vTAX504);
            // 506
            this._exemptDetail(false, TAX, tTaxDetail);
            // 507 TODO: If value matching to SG29 RFF+VA C506/1154 or SG29 RFF+AHR C506/1154 do not map,
            tTaxDetail.Description.ele('Description').txt(vTAX7);

            // MOA 124_4
            if (MOA_124_4) {
                let vMOA102 = this._segVal(MOA_124_4, 102);
                let vMOA103 = this._segVal(MOA_124_4, 103);
                this._ele3(tTaxDetail.TaxAmount, 'TaxAmount', 'Money').att(XML.currency, vMOA103).txt(vMOA102);
            }
            // MOA 124_7
            if (MOA_124_7) {
                let vMOA102 = this._segVal(MOA_124_7, 102);
                let vMOA103 = this._segVal(MOA_124_7, 103);
                this._ele3(tTaxDetail.TaxAmount, 'TaxAmount', 'Money').att('alternateCurrency', vMOA103).att('alternateAmount', vMOA102);
            }

            tTaxDetail.sendTo(tTax.TaxDetail.ele('TaxDetail'));
        }
        tTax.sendTo(tIVDSummary.Tax.ele('Tax'));

    }
    private _SG48(tIVDSummary: TidyInvoiceDetailSummary) {
        let SG48s = this._rGrps('SG48');
        for (let sg48 of SG48s) {
            let MOA = this._dSeg1(sg48, 'MOA');
            let vMOA101 = this._segVal(MOA, 101);
            let vMOA102 = this._segVal(MOA, 102);
            let vMOA103 = this._segVal(MOA, 103);
            let vMOA104 = this._segVal(MOA, 104);

            switch (vMOA101) {
                case '79':
                case '289':
                    this._fillMoney(tIVDSummary.SubtotalAmount, 'SubtotalAmount', vMOA102, vMOA103, vMOA104);
                    break;
                case '299':
                    this._fillMoney(tIVDSummary.SpecialHandlingAmount, 'SpecialHandlingAmount', vMOA102, vMOA103, vMOA104);
                    break;
                case '144':
                    this._fillMoney(tIVDSummary.ShippingAmount, 'ShippingAmount', vMOA102, vMOA103, vMOA104);
                    break;
                case '128':
                    this._fillMoney(tIVDSummary.GrossAmount, 'GrossAmount', vMOA102, vMOA103, vMOA104);
                    break;
                case '259':
                    this._fillMoney(tIVDSummary.TotalCharges, 'TotalCharges', vMOA102, vMOA103, vMOA104);
                    break;
                case '260':
                    this._fillMoney(tIVDSummary.TotalAllowances, 'TotalAllowances', vMOA102, vMOA103, vMOA104);
                    break;
                case '125':
                case 'ZZZ':
                    this._fillMoney(tIVDSummary.TotalAmountWithoutTax, 'TotalAmountWithoutTax', vMOA102, vMOA103, vMOA104);
                    break;
                case '77':
                    this._fillMoney(tIVDSummary.NetAmount, 'NetAmount', vMOA102, vMOA103, vMOA104);
                    let RFFAIL = this._segByEleVal(sg48, 'RFF', 101, 'AIL');
                    this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'ESRReference')
                        .txt(this._segVal(RFFAIL, 102));
                    break;
                case '113':
                    this._fillMoney(tIVDSummary.DepositAmount, 'DepositAmount', vMOA102, vMOA103, vMOA104);
                    break;
                case '9':
                    this._fillMoney(tIVDSummary.DueAmount, 'DueAmount', vMOA102, vMOA103, vMOA104);
                    break;
                case '124':
                case '176':
                    this._fillMoney(tIVDSummary.Tax, 'Tax', vMOA102, vMOA103, vMOA104);
                    break;
            }

        }
    }

    /**
     * TODO: logic with isHeaderInvoice
     * @param sg25 
     * 
     */
    private _SG25HeaderInvoice(sg25: ASTNode, tInvoiceDetailRequest: TidyInvoiceDetailRequest) {
        let LIN = this._dSeg1(sg25, 'LIN');
        let SG29s = this._dGrps(sg25, 'SG29');
        let RFFON = this._segByGrpEleVal(SG29s, 'RFF', 101, 'ON');
        let RFFFI = this._segByGrpEleVal(SG29s, 'RFF', 101, 'FI');
        let orderID = this._segVal(RFFON, 102);


        // <!ELEMENT InvoiceDetailHeaderOrder
        // (InvoiceDetailOrderInfo, InvoiceDetailOrderSummary)>
        //let invoiceDetailOrder: XMLBuilder
        let tInvoiceDetailOrder: TidyInvoiceDetailOrder

        if (orderID == '') {
            // let me belong to the nearest PO.
            let lastKey = this._lastKey(this._maptDetailOrders);
            if (lastKey) {
                tInvoiceDetailOrder = this._maptDetailOrders[lastKey]
            } else {
                return;
            }
        } else {
            // orderID has value
            if (!this._maptDetailOrders[orderID]) {
                //invoiceDetailOrder = this._maptDetailOrders[orderID] = fragIVDetailHeaderOrder.ele('InvoiceDetailHeaderOrder');
                tInvoiceDetailOrder = this._maptDetailOrders[orderID] = new TidyInvoiceDetailOrder();
            } else {
                tInvoiceDetailOrder = this._maptDetailOrders[orderID]
            }
        }

        let eInvoiceDetailOrderInfo = this._ele2(tInvoiceDetailOrder.InvoiceDetailOrderInfo, 'InvoiceDetailOrderInfo');
        let eInvoiceDetailOrderSummary = this._ele2(tInvoiceDetailRequest.InvoiceDetailSummary, 'InvoiceDetailOrderSummary');
        let tInvoiceDetailOrderSummary = new TidyInvoiceDetailOrderSummary();

        // LIN
        tInvoiceDetailOrderSummary.att('invoiceLineNumber', this._segVal(LIN, 1));

        // PIA IMD QTY ALI
        // not used for HeaderInvoice

        // DTM
        let DTMs = this._dSegs(sg25, 'DTM');
        for (let sg25dtm of DTMs) {
            let dtmVal101 = this._segVal(sg25dtm, 101);
            let dtmVal102 = this._segVal(sg25dtm, 102);
            let dtmVal103 = this._segVal(sg25dtm, 103);
            switch (dtmVal101) {
                case '194':
                    this._ele2(tInvoiceDetailOrderSummary.Period, 'Period').att('startDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                    break;
                case '206':
                    this._ele2(tInvoiceDetailOrderSummary.Period, 'Period').att('endDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                    break;
                case '351':
                    tInvoiceDetailOrderSummary.att('inspectionDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                    break;
                default:
                // do nothing
            }
        } // end loop SG25 DTMs

        // FTX
        this._SG25FTXHeaderInvoice(sg25, tInvoiceDetailOrderSummary);
        // SG25 SG26
        this._SG25_SG26_Header(sg25, tInvoiceDetailOrderSummary);

        //let invoiceDetailOrderInfo = tDetailOrder.InvoiceDetailOrderInfo.ele('InvoiceDetailOrderInfo');

        // SG25_SG29
        for (let sg29 of SG29s) {
            let RFF = this._dSeg1(sg29, 'RFF');
            let DTMs = this._dSegs(sg29, 'DTM');
            let vRFF101 = this._segVal(RFF, 101);
            let vRFF102 = this._segVal(RFF, 102);
            let vRFF103 = this._segVal(RFF, 103);
            let vRFF104 = this._segVal(RFF, 104);
            switch (vRFF101) {
                case 'CT':
                    this._SG25_SG29_RFF_CT_Header(sg29, eInvoiceDetailOrderInfo, vRFF102, vRFF103);
                    break;
                case 'VN':
                    this._SG25_SG29_RFF_VN_Header(sg29, eInvoiceDetailOrderInfo, vRFF102, vRFF103);
                    break;
                case 'ZZZ':
                    tInvoiceDetailOrderSummary.Extrinsic.ele(XML.Extrinsic).att('name', vRFF102)
                        .txt(vRFF104);
                    break;
                case 'VA':
                    // TODO:
                    break;
                case 'AHR':
                    tInvoiceDetailOrderSummary.Tax.ele('Tax').ele('TaxDetail')
                        .ele('TaxRegime').txt(vRFF104);
                    break;
            } // end switch
        } // end loop SG29s

        // SG25_SG38
        this._SG25_SG38_Header(sg25, tInvoiceDetailOrderSummary);

        tInvoiceDetailOrderSummary.sendTo(eInvoiceDetailOrderSummary);
    }
    /**
     * TODO: logic with isHeaderInvoice
     * @param sg25 
     * 
     */
    private _SG25RegularInvoice(sg25: ASTNode, t: TidyInvoiceDetailRequest) {
        let LIN = this._dSeg1(sg25, 'LIN');
        let SG29s = this._dGrps(sg25, 'SG29');
        let RFFON = this._segByGrpEleVal(SG29s, 'RFF', 101, 'ON');
        let RFFFI = this._segByGrpEleVal(SG29s, 'RFF', 101, 'FI');
        let orderID = this._segVal(RFFON, 102);

        // <!ELEMENT InvoiceDetailOrder (InvoiceDetailOrderInfo, InvoiceDetailReceiptInfo?, InvoiceDetailShipNoticeInfo?,
        //     (InvoiceDetailItem | InvoiceDetailServiceItem)+)>
        let tDetailOrder;

        if (orderID == '') {
            // let me belong to the nearest PO.
            let lastKey = this._lastKey(this._maptDetailOrders);
            if (lastKey) {
                tDetailOrder = this._maptDetailOrders[lastKey]
            } else {
                return;
            }
        } else {
            // orderID has value
            if (!this._maptDetailOrders[orderID]) {
                tDetailOrder = this._maptDetailOrders[orderID] = new TidyInvoiceDetailOrder();
            } else {
                tDetailOrder = this._maptDetailOrders[orderID]
            }
        }

        // should be "PL" for InvoiceDetailItem
        // Should be "MP" for InvoiceDetailServiceItem
        let valPLMP = this._segVal(LIN, 302);
        // let item:XMLBuilder;
        // let itemReference:XMLBuilder;
        let tItem = new TidyInvoiceDetailItem();
        let tItemRef = new TidyInvoiceDetailItemReference();
        let tSItem = new TidyInvoiceDetailServiceItem();
        let tSItemRef = new TidyInvoiceDetailServiceItemReference();

        // LIN
        tItem.att('invoiceLineNumber', this._segVal(LIN, 1));
        tSItem.att('invoiceLineNumber', this._segVal(LIN, 1));
        if (this._segVal(LIN, 2) == '1') {
            tItem.att('isAdHoc', 'yes');
            tSItem.att('isAdHoc', 'yes');
        }
        tItemRef.att('lineNumber', this._segVal(LIN, 301))
        tSItemRef.att('lineNumber', this._segVal(LIN, 301))
        if (RFFFI) {
            tItem.att('parentInvoiceLineNumber', this._segVal(LIN, 402));
            tSItem.att('parentInvoiceLineNumber', this._segVal(LIN, 402));
        }

        // PIA
        this._SG25PIA(valPLMP, sg25, tItemRef, tSItemRef);

        // IMD
        let IMDF = this._segByEleVal(sg25, 'IMD', 1, 'F');
        let IMDE = this._segByEleVal(sg25, 'IMD', 1, 'E');
        let IMDB = this._segByEleVal(sg25, 'IMD', 1, 'B');
        if (IMDF) {
            let desc = tItemRef.Description.ele('Description')
                .txt(this._segVal(IMDF, 304) + this._segVal(IMDF, 305))
                .att(XML.lang, this._segVal(IMDF, 306));
            let descS = tSItemRef.Description.ele('Description')
                .txt(this._segVal(IMDF, 304) + this._segVal(IMDF, 305))
                .att(XML.lang, this._segVal(IMDF, 306));
            if (IMDE) {
                desc.ele('ShortName')
                    .txt(this._segVal(IMDE, 304) + this._segVal(IMDE, 305))
                descS.ele('ShortName')
                    .txt(this._segVal(IMDE, 304) + this._segVal(IMDE, 305))
            }
        }
        if (IMDB) {
            let valIMD304 = this._segVal(IMDB, 304) + this._segVal(IMDB, 305);
            tItemRef.Classification.ele('Classification')
                .att(XML.domain, valIMD304 == '' ? 'NotAvailable' : valIMD304);
            tSItemRef.Classification.ele('Classification')
                .att(XML.domain, valIMD304 == '' ? 'NotAvailable' : valIMD304);
        }

        // QTY
        let QTY47 = this._segByEleVal(sg25, 'QTY', 101, '47');
        if (QTY47) {
            tItem.att('quantity', this._segVal(QTY47, 102));
            tSItem.att('quantity', this._segVal(QTY47, 102));
            tItem.UnitOfMeasure.ele('UnitOfMeasure').txt(this._segVal(QTY47, 103));
            tSItem.UnitOfMeasure.ele('UnitOfMeasure').txt(this._segVal(QTY47, 103));
        }

        // ALI
        let ALI = this._dSeg1(sg25, 'ALI');
        if (ALI) {
            tItemRef.Country.ele('Country').att('isoCountryCode', this._segVal(ALI, 1));
            if (this._segVal(ALI, 3) == '88' && this._purposeXML == 'lineLevelCreditMemo') {
                tItem.att('reason', 'return');
            }
        }

        // DTM
        let DTMs = this._dSegs(sg25, 'DTM');
        for (let sg25dtm of DTMs) {
            let dtmVal101 = this._segVal(sg25dtm, 101);
            let dtmVal102 = this._segVal(sg25dtm, 102);
            let dtmVal103 = this._segVal(sg25dtm, 103);
            switch (dtmVal101) {
                case '171':
                    tItem.att('referenceDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                    tSItem.att('referenceDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                    break;
                case '194':
                    this._ele2(tSItem.Period, 'Period').att('startDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                    break;
                case '206':
                    this._ele2(tSItem.Period, 'Period').att('endDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                    break;
                case '35':
                    this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo').ele(XML.IdReference)
                        .att('domain', 'actualDeliveryDate')
                        .att('identifier', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                    break;
                case '351':
                    tItem.att('inspectionDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                    tSItem.att('inspectionDate', Utils.dateStrFromDTM2(dtmVal102, dtmVal103));
                    break;
                default:
                // do nothing
            }
        } // end loop SG25 DTMs

        let tTax = new TidyTax();
        // FTX 
        this._SG25_FTX_Regular(sg25, tItem.Comments, tTax);

        // SG25 SG26 MOA
        this._SG25_SG26_Regular(sg25, tItem, tSItem);

        // SG25 SG28
        this._SG25_SG28_Regular(sg25, tItem, tSItem);

        // SG25 SG29
        this._SG25_SG29_Regular(SG29s, tDetailOrder, tItem, tItemRef, tSItem);

        // SG25 SG30
        let SG30s = this._dGrps(sg25, 'SG30');
        SG30s = SG30s ?? [];
        for (let sg30 of SG30s) {
            let PAC = this._dSeg1(sg30, 'PAC');
            let MEA = this._dSeg1(sg30, 'MEA');
            tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'numberOfPackages')
                .txt(this._segVal(PAC, 1));
            let ePackaging = tItem.Packaging.ele('Packaging');
            ePackaging.ele('PackagingLevelCode').txt(this._segVal(PAC, 201));
            ePackaging.ele('PackagingCode').txt(this._segVal(PAC, 301));
            ePackaging.ele('Description').txt(this._segVal(PAC, 304));
            let eDimension = ePackaging.ele('Dimension');
            eDimension.att('type', this._segVal(MEA, 201));
            eDimension.ele('UnitOfMeasure').txt(this._segVal(MEA, 301));
            eDimension.att('quantity', this._segVal(MEA, 302))
        }

        // SG25 SG32
        let SG32s = this._dGrps(sg25, 'SG32');
        SG32s = SG32s ?? [];
        for (let sg32 of SG32s) {
            let LOC = this._dSeg1(sg32, 'LOC');
            let vLOC1 = this._segVal(LOC, 1);
            let vLOC201 = this._segVal(LOC, 201);
            switch (vLOC1) {
                case '27':
                    tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'ShipFromCountry').txt(vLOC201);
                    break;
                case '28':
                    tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'ShipToCountry').txt(vLOC201);
                    break;
                case '19':
                    tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'plantCode').txt(vLOC201);
                    break;
            }
        }

       
        // SG25 SG33
        this._SG25_SG33_Regular(sg25, tItem, tSItem,tTax);

        // SG25 SG34
        this._SG25_SG34_Regular(sg25, tItem, tItemRef);

        // SG25 SG38
        this._SG25_SG38_Regular(sg25, valPLMP, tItem, tSItem,tTax);


        // <!ELEMENT InvoiceDetailOrder (InvoiceDetailOrderInfo, InvoiceDetailReceiptInfo?, InvoiceDetailShipNoticeInfo?,
        //     (InvoiceDetailItem | InvoiceDetailServiceItem)+)>

        // aggregate all TidyItem  to item
        if (valPLMP == 'PL') {
            // Normal Item
            tTax.sendTo(tItem.Tax.ele('Tax'));
            let eleItemReference = tItem.InvoiceDetailItemReference.ele('InvoiceDetailItemReference');
            tItemRef.sendTo(eleItemReference);
            let eleItem = tDetailOrder.InvoiceDetailItem.ele('InvoiceDetailItem');
            tItem.sendTo(eleItem);
        } else {
            // Service Item
            tTax.sendTo(tSItem.Tax.ele('Tax'));
            let eleItemReference = tSItem.InvoiceDetailServiceItemReference.ele('InvoiceDetailServiceItemReference');
            tSItemRef.sendTo(eleItemReference);
            let eleItem = tDetailOrder.InvoiceDetailServiceItem.ele('InvoiceDetailServiceItem');
            tSItem.sendTo(eleItem);
        }

    }

    private _SG25_SG38_Regular(sg25: ASTNode, valPLMP: string, tItem: TidyInvoiceDetailItem
            , tSItem: TidyInvoiceDetailServiceItem,tTax:TidyTax) {
        let SG38s = this._dGrps(sg25, 'SG38');
        if (SG38s) {
            let eMods: XMLBuilder;
            for (let sg38 of SG38s) {
                let ALC = this._dSeg1(sg38, 'ALC');
                let vALC1 = this._segVal(ALC, 1);
                // If ALC C552/4471 = 2  [@name="settlementCode"] map modifications at <UnitPrice>  section.
                let vALC3 = this._segVal(ALC, 3);
                let vALC501 = this._segVal(ALC, 501);
                if (vALC1 == 'A' || vALC1 == 'C') {
                    // /InvoiceDetailRequest/InvoiceDetailOrder/[ InvoiceDetailItem | InvoiceDetailServiceItem ]/InvoiceItemModifications/Modification/... 
                    // or
                    // /InvoiceDetailRequest/InvoiceDetailOrder/[ InvoiceDetailItem | InvoiceDetailServiceItem ]/UnitPrice/Modifications/Modification/... 
                    if (valPLMP == 'PL') {
                        // Normal Item
                        if (vALC3 == '2') {
                            eMods = this._ele3(tItem.UnitPrice, 'UnitPrice', 'Modifications');
                        } else {
                            eMods = this._ele2(tItem.InvoiceItemModifications, 'InvoiceItemModifications');
                        }

                    } else {
                        // Service Item
                        if (vALC3 == '2') {
                            eMods = this._ele3(tSItem.UnitPrice, 'UnitPrice', 'Modifications');
                        } else {
                            eMods = this._ele2(tSItem.InvoiceItemModifications, 'InvoiceItemModifications');
                        }
                    }
                    this._SG25_SG38_Modification(sg38, ALC, eMods);
                }

                if (vALC1 == 'A' && vALC501 == 'DI') {
                    let fragDetailDiscount: XMLBuilder;
                    if (valPLMP == 'PL') {
                        // Normal Item
                        fragDetailDiscount = tItem.InvoiceDetailDiscount;
                    } else {
                        // Service Item
                        fragDetailDiscount = tSItem.InvoiceDetailDiscount;
                    }
                    this._SG25_SG38_InvoiceDetailDiscount(sg38, fragDetailDiscount);
                }


                if (vALC1 == 'C' && vALC501 == 'SAA') {
                    this._SG25_SG38_DetailLineShipping(sg38, tItem.InvoiceDetailLineShipping, tTax);
                }

                if (vALC1 == 'C' && vALC501 == 'SH') {
                    // not supported for service items
                    this._SG25_SG38_SpecialHandling(sg38, ALC, tItem.InvoiceDetailLineSpecialHandling, tTax);
                }

                if (vALC1 == 'N') {
                    this._SG25_SG38_Distribution(sg38, ALC, tItem.Distribution);
                }


            } // end loop SG38s
        } // end if SG38s

    }
    private _SG25_SG38_Header(sg25: ASTNode, tDOrderSummary: TidyInvoiceDetailOrderSummary) {
        let SG38s = this._dGrps(sg25, 'SG38');
        if (SG38s) {
            let tTax = new TidyTax();
            let eMods: XMLBuilder;

            for (let sg38 of SG38s) {
                let ALC = this._dSeg1(sg38, 'ALC');
                let vALC1 = this._segVal(ALC, 1);
                // If ALC C552/4471 = 2  [@name="settlementCode"] map modifications at <UnitPrice>  section.
                let vALC3 = this._segVal(ALC, 3);
                let vALC501 = this._segVal(ALC, 501);

                if (vALC1 == 'A' && vALC501 == 'DI') {
                    this._SG25_SG38_InvoiceDetailDiscount(sg38, tDOrderSummary.InvoiceDetailDiscount);
                }

                if (vALC1 == 'C' && vALC501 == 'SAA') {
                    this._SG25_SG38_DetailLineShipping(sg38, tDOrderSummary.InvoiceDetailLineShipping, tTax);
                }

                if (vALC1 == 'C' && vALC501 == 'SH') {
                    // not supported for service items
                    this._SG25_SG38_SpecialHandling(sg38, ALC, tDOrderSummary.InvoiceDetailLineSpecialHandling, tTax);
                }

            }
            tTax.sendTo(tDOrderSummary.Tax.ele('Tax'));
        }

    }
    private _SG25_SG34_Regular(sg25: ASTNode, tItem: TidyInvoiceDetailItem, tItemRef: TidyInvoiceDetailItemReference) {
        let SG34s = this._dGrps(sg25, 'SG34');
        if (SG34s) {
            let eInvoiceDetailShipping = tItem.InvoiceDetailLineShipping
                .ele('InvoiceDetailLineShipping')
                .ele('InvoiceDetailShipping');
            let tInvoiceDetailShipping = new TidyInvoiceDetailShipping();
            for (let sg34 of SG34s) {
                let NAD = this._dSeg1(sg34, 'NAD');
                let strEDIRole = this._segVal(NAD, 1);
                if (strEDIRole == 'MF') {
                    // /InvoiceDetailRequest/InvoiceDetailOrder/InvoiceDetailItem/InvoiceDetailItemReference/ManufacturerName
                    let vConcat = '';
                    for (let i = 1; i <= 5; i++) {
                        vConcat += this._segVal(NAD, 400 + i);
                    }
                    tItemRef.ManufacturerName.ele('ManufacturerName').txt(vConcat)
                    continue;
                }
                // DTD "Contact" : "(Name,PostalAddress*,Email*,Phone*,Fax*,URL*,IdReference*,Extrinsic*)
                let eContact = tInvoiceDetailShipping.Contact.ele(XML.Contact);
                let tContact = new TidyContact();

                eContact.att('role', MAPS.mapNADShipping[strEDIRole]);
                eContact.att('addressID', this._segVal(NAD, 201));
                eContact.att('addressIDDomain', this._segVal(NAD, 203));
                // Contact Name
                tContact.Name.ele('Name', this._segVal(NAD, 301) + this._segVal(NAD, 302)
                    + this._segVal(NAD, 303) + this._segVal(NAD, 304) + this._segVal(NAD, 305));
                this._NADPostalAddr(tContact, NAD);

                // SG34_SG35
                let SG35s = this._dGrps(sg34, 'SG35');
                SG35s = SG35s ?? [];
                for (let sg35 of SG35s) {
                    let RFF = this._dSeg1(sg35, 'RFF');
                    let vRFF101 = this._segVal(RFF, 101);
                    let vRFF102 = this._segVal(RFF, 102);
                    if (!vRFF101) {
                        continue;
                    }
                    this._NAD_RFF(strEDIRole, RFF, tContact, tInvoiceDetailShipping);
                } // end loop SG35s

                // SG34_SG37
                let SG37s = this._dGrps(sg34, 'SG37');
                SG37s = SG37s ?? [];
                for (let sg37 of SG37s) {
                    this._xmlCommFromCTA(sg37, tContact, MAPS.mapNADShipping[strEDIRole]);
                }

                tContact.sendTo(eContact);
            } // end loop SG34s
            tInvoiceDetailShipping.sendTo(eInvoiceDetailShipping);
        } // end if SG34s

    }
    private _SG25_SG33_Regular(sg25: ASTNode,
        tItem: TidyInvoiceDetailItem, tSItem: TidyInvoiceDetailServiceItem
        , tTax: TidyTax) {
        let SG33s = this._dGrps(sg25, 'SG33');
        if (!SG33s || SG33s.length == 0) {
            return;
        }

        // let eTax = this._ele2(tItem.Tax, 'Tax');
        // let eSTax = this._ele2(tSItem.Tax, 'Tax');

        SG33s = SG33s ?? [];
        for (let sg33 of SG33s) {
            let TAX = this._dSeg1(sg33, 'TAX');
            let MOA_124_4 = this._segByEleVal3(sg33, 'MOA', 101, '124', 104, '4');
            let MOA_124_7 = this._segByEleVal3(sg33, 'MOA', 101, '124', 104, '7');
            let LOC_157 = this._segByEleVal(sg33, 'LOC', 1, '157');
            let vTAX201 = this._segVal(TAX, 201);
            let vTAX204 = this._segVal(TAX, 204);
            let vTAX301 = this._segVal(TAX, 301);
            let vTAX304 = this._segVal(TAX, 304);
            let vTAX501 = this._segVal(TAX, 501);
            let vTAX504 = this._segVal(TAX, 504);
            let vTAX6 = this._segVal(TAX, 6);
            let vTAX7 = this._segVal(TAX, 7);
            // let eTaxDetail = eTax.ele('TaxDetail');
            // let eSTaxDetail = eSTax.ele('TaxDetail');
            let tTaxDetail = new TidyTaxDetail();
            tTaxDetail.att('category', vTAX201);
            tTaxDetail.TaxLocation.ele('TaxLocation').txt(vTAX204);
            if (vTAX301 == 'TT') {
                tTaxDetail.att('isTriangularTransaction', 'yes');
            }
            // 304
            tTaxDetail.TaxableAmount.ele('TaxableAmount').ele('Money').txt(vTAX304);
            // 501
            tTaxDetail.att('taxRateType', vTAX501);
            tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'taxAccountCode').txt(vTAX501);
            tSItem.Extrinsic.ele(XML.Extrinsic).att('name', 'taxAccountCode').txt(vTAX501);
            // 504
            tTaxDetail.att('percentageRate', vTAX504);
            // 506
            this._exemptDetail(false, TAX, tTaxDetail);
            // 507 TODO: If value matching to SG29 RFF+VA C506/1154 or SG29 RFF+AHR C506/1154 do not map,
            tTaxDetail.Description.ele('Description').txt(vTAX7);

            // MOA 124_4
            if (MOA_124_4) {
                let vMOA102 = this._segVal(MOA_124_4, 102);
                let vMOA103 = this._segVal(MOA_124_4, 103);
                this._ele3(tTaxDetail.TaxAmount, 'TaxAmount', 'Money').att(XML.currency, vMOA103).txt(vMOA102);
            }
            // MOA 124_7
            if (MOA_124_7) {
                let vMOA102 = this._segVal(MOA_124_7, 102);
                let vMOA103 = this._segVal(MOA_124_7, 103);
                this._ele3(tTaxDetail.TaxAmount, 'TaxAmount', 'Money').att('alternateCurrency', vMOA103).att('alternateAmount', vMOA102);
            }
            // LOC 157
            let vLOC201 = this._segVal(LOC_157, 201);
            tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'taxJurisdiction').txt(vLOC201);
            tSItem.Extrinsic.ele(XML.Extrinsic).att('name', 'taxJurisdiction').txt(vLOC201);

            tTaxDetail.sendTo(tTax.TaxDetail.ele('TaxDetail'));
        } // end loop SG33s
    }

    private _SG25_SG29_Regular(SG29s: ASTNode[], tDetailOrder: TidyInvoiceDetailOrder
        , tItem: TidyInvoiceDetailItem, tItemRef: TidyInvoiceDetailItemReference, tSItem: TidyInvoiceDetailServiceItem) {
        if (!SG29s || SG29s.length == 0) {
            return;
        }
        let invoiceDetailOrderInfo = this._ele2(tDetailOrder.InvoiceDetailOrderInfo, 'InvoiceDetailOrderInfo');

        for (let sg29 of SG29s) {
            let RFF = this._dSeg1(sg29, 'RFF');
            let DTMs = this._dSegs(sg29, 'DTM');
            let vRFF101 = this._segVal(RFF, 101);
            let vRFF102 = this._segVal(RFF, 102);
            let vRFF103 = this._segVal(RFF, 103);
            let vRFF104 = this._segVal(RFF, 104);
            switch (vRFF101) {
                case 'CT':
                    this._SG25_SG29_RFF_CT_Regular(sg29, invoiceDetailOrderInfo, vRFF102, vRFF103);
                    break;
                case 'VN':
                    this._SG25_SG29_RFF_VN_Regular(sg29, invoiceDetailOrderInfo, tItem, vRFF102, vRFF103);
                    break;
                case 'FI':
                    tItem.att('itemType', vRFF102);
                    tSItem.att('itemType', vRFF102);
                    if (vRFF102 == 'composite') {
                        tItem.att('compositeItemType', vRFF104)
                    }
                    break;
                case 'DQ':
                    this._SG25_SG29_RFF_DQ_Regular(sg29, invoiceDetailOrderInfo, tItem, vRFF102, vRFF103);
                    break;
                case 'ALO':
                    this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo')
                        .ele(XML.IdReference).att(XML.domain, 'ReceivingAdviceID')
                        .att(XML.identifier, vRFF102);
                    tItem.ReceiptLineItemReference.ele('ReceiptLineItemReference')
                        .att('receiptLineNumber', vRFF103);
                    break;
                case 'MA':
                    let invoiceDetailShipNoticeInfo = tDetailOrder.InvoiceDetailShipNoticeInfo.ele('InvoiceDetailShipNoticeInfo');
                    this._SG25_SG29_RFF_MA_Regular(sg29, invoiceDetailShipNoticeInfo, tItem, vRFF102, vRFF103);
                    break;
                case 'ACE':
                    this._SG25_SG29_RFF_ACE_Regular(sg29, tItem, tSItem, vRFF102, vRFF103);
                    break;
                case 'PK':
                    this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo')
                        .ele(XML.IdReference).att(XML.domain, 'packListID')
                        .att(XML.identifier, vRFF102);
                    break;
                case 'ADE':
                    tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'GLAccount').txt(vRFF102);
                    break;
                case 'ZZZ':
                    tItem.Extrinsic.ele(XML.Extrinsic).att('name', vRFF102)
                        .txt(vRFF103);
                    tSItem.Extrinsic.ele(XML.Extrinsic).att('name', vRFF102)
                        .txt(vRFF103);
                    break;
                case 'VA':
                    // TODO:
                    break;
                case 'BT':
                    tItemRef.SupplierBatchID.ele('SupplierBatchID').txt(vRFF102);
                    break;
                case 'AHR':
                    // TODO:
                    break;
            } // end switch
        } // end loop SG29s



    }
    private _SG25_SG29_RFF_CT_Regular(sg29: ASTNode, invoiceDetailOrderInfo: XMLBuilder, vRFF102: string, vRFF103: string) {
        // RFF102
        if (this._bBGM385) {
            invoiceDetailOrderInfo.ele('MasterAgreementReference')
                .att('agreementID', vRFF102)
                .ele('DocumentReference').att('payloadID', '');
            if (this._bNONPO) {
                invoiceDetailOrderInfo.ele('MasterAgreementIDInfo')
                    .att('agreementID', vRFF102);
            }
        }

        // TODO: [If SG1/SG29 RFF+ON not provided - hardcode extrinsic value] 

        // RFF103
        if (vRFF103 == '1' && this._bBGM385) {
            this._ele2(invoiceDetailOrderInfo, 'MasterAgreementReference')
                .att('agreementType', 'scheduling_agreement');
            if (this._bNONPO) {
                this._ele2(invoiceDetailOrderInfo, 'MasterAgreementIDInfo')
                    .att('agreementType', 'scheduling_agreement');
            }
        }

        // DTM, let's assume only one for one RFF
        let DTMs = this._dSegs(sg29, 'DTM');
        for (let dtm of DTMs) {
            let vDTM101 = this._segVal(dtm, 101);
            let vDTM102 = this._segVal(dtm, 102);
            let vDTM103 = this._segVal(dtm, 103);
            let theDate = Utils.dateStrFromDTM2(vDTM102, vDTM103);
            switch (vDTM101) {
                case '126':
                case '171':
                    if (this._bBGM385) {
                        this._ele2(invoiceDetailOrderInfo, 'MasterAgreementReference')
                            .att('agreementDate', theDate);
                        if (this._bNONPO) {
                            this._ele2(invoiceDetailOrderInfo, 'MasterAgreementIDInfo')
                                .att('agreementDate', theDate);
                        }
                    }
                    break;
            }
        }
    }
    private _SG25_SG29_RFF_CT_Header(sg29: ASTNode, invoiceDetailOrderInfo: XMLBuilder, vRFF102: string, vRFF103: string) {
        // RFF102
        invoiceDetailOrderInfo.ele('MasterAgreementReference')
            .att('agreementID', vRFF102)
            .ele('DocumentReference').att('payloadID', '');
        if (this._bNONPO) {
            invoiceDetailOrderInfo.ele('MasterAgreementIDInfo')
                .att('agreementID', vRFF102);
        }

        // RFF103
        if (vRFF103 == '1') {
            this._ele2(invoiceDetailOrderInfo, 'MasterAgreementReference')
                .att('agreementType', 'scheduling_agreement');
            if (this._bNONPO) {
                this._ele2(invoiceDetailOrderInfo, 'MasterAgreementIDInfo')
                    .att('agreementType', 'scheduling_agreement');
            }
        }

        // DTM, let's assume only one for one RFF
        let DTMs = this._dSegs(sg29, 'DTM');
        for (let dtm of DTMs) {
            let vDTM101 = this._segVal(dtm, 101);
            let vDTM102 = this._segVal(dtm, 102);
            let vDTM103 = this._segVal(dtm, 103);
            let theDate = Utils.dateStrFromDTM2(vDTM102, vDTM103);
            switch (vDTM101) {
                case '126':
                case '171':
                    this._ele2(invoiceDetailOrderInfo, 'MasterAgreementReference')
                        .att('agreementDate', theDate);
                    if (this._bNONPO) {
                        this._ele2(invoiceDetailOrderInfo, 'MasterAgreementIDInfo')
                            .att('agreementDate', theDate);
                    }
                    break;
            }
        }
    }
    private _SG25_SG29_RFF_VN_Regular(sg29: ASTNode, invoiceDetailOrderInfo: XMLBuilder, tItem: TidyInvoiceDetailItem, vRFF102: string, vRFF103: string) {
        // RFF102
        if (this._bBGM385) {
            invoiceDetailOrderInfo.ele('SupplierOrderInfo')
                .att('orderID', vRFF102);
            if (this._bNONPO) {
                invoiceDetailOrderInfo.ele('MasterAgreementIDInfo')
                    .att('agreementID', vRFF102);
            }
        }

        // TODO: [If SG1/SG29 RFF+ON and RFF+CT not provided - hardcode extrinsic value] 

        // RFF103
        tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'supplierOrderLineNum')
            .txt(vRFF103);

        // DTM, let's assume only one for one RFF
        let DTMs = this._dSegs(sg29, 'DTM');
        for (let dtm of DTMs) {
            let vDTM101 = this._segVal(dtm, 101);
            let vDTM102 = this._segVal(dtm, 102);
            let vDTM103 = this._segVal(dtm, 103);
            let theDate = Utils.dateStrFromDTM2(vDTM102, vDTM103);
            switch (vDTM101) {
                case '4':
                case '171':
                    if (this._bBGM385) {
                        this._ele2(invoiceDetailOrderInfo, 'SupplierOrderInfo')
                            .att('orderDate', theDate);
                    }
                    break;
            }
        }
    }
    private _SG25_SG29_RFF_VN_Header(sg29: ASTNode, invoiceDetailOrderInfo: XMLBuilder, vRFF102: string, vRFF103: string) {
        // RFF102
        invoiceDetailOrderInfo.ele('SupplierOrderInfo')
            .att('orderID', vRFF102);
        if (this._bNONPO) {
            invoiceDetailOrderInfo.ele('MasterAgreementIDInfo')
                .att('agreementID', vRFF102);
        }

        // TODO: [If SG1/SG29 RFF+ON and RFF+CT not provided - hardcode extrinsic value] 

        // DTM, let's assume only one for one RFF
        let DTMs = this._dSegs(sg29, 'DTM');
        for (let dtm of DTMs) {
            let vDTM101 = this._segVal(dtm, 101);
            let vDTM102 = this._segVal(dtm, 102);
            let vDTM103 = this._segVal(dtm, 103);
            let theDate = Utils.dateStrFromDTM2(vDTM102, vDTM103);
            switch (vDTM101) {
                case '4':
                case '171':
                    this._ele2(invoiceDetailOrderInfo, 'SupplierOrderInfo')
                        .att('orderDate', theDate);
                    break;
            }
        }
    }

    private _SG25_SG29_RFF_DQ_Regular(sg29: ASTNode, invoiceDetailOrderInfo: XMLBuilder, tItem: TidyInvoiceDetailItem, vRFF102: string, vRFF103: string) {
        // RFF102
        this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo').ele(XML.IdReference)
            .att(XML.domain, 'deliveryNoteID').att('identifier', vRFF102);
        this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo').ele(XML.IdReference)
            .att(XML.domain, 'deliveryNoteLineItemNo').att('identifier', vRFF103);

        // DTM, let's assume only one for one RFF
        let DTMs = this._dSegs(sg29, 'DTM');
        for (let dtm of DTMs) {
            let vDTM101 = this._segVal(dtm, 101);
            let vDTM102 = this._segVal(dtm, 102);
            let vDTM103 = this._segVal(dtm, 103);
            let theDate = Utils.dateStrFromDTM2(vDTM102, vDTM103);
            switch (vDTM101) {
                case '124':
                case '171':
                    if (this._bBGM385) {
                        this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo')
                            .ele(XML.IdReference).att(XML.domain, 'deliveryNoteDate')
                            .txt(theDate);
                    }
                    break;
            }
        }
    }

    private _SG25_SG29_RFF_MA_Regular(sg29: ASTNode, invoiceDetailShipNoticeInfo: XMLBuilder, tItem: TidyInvoiceDetailItem, vRFF102: string, vRFF103: string) {
        // RFF102
        this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo').ele(XML.IdReference)
            .att(XML.domain, 'shipNoticeID').txt(vRFF102);

        invoiceDetailShipNoticeInfo.ele('ShipNoticeReference').att('shipNoticeID', vRFF102)
            .ele('DocumentReference').att('payloadID', '');

        tItem.ShipNoticeLineItemReference.ele('ShipNoticeLineItemReference')
            .att('shipNoticeLineNumber', vRFF103);

        // DTM, let's assume only one for one RFF
        let DTMs = this._dSegs(sg29, 'DTM');
        for (let dtm of DTMs) {
            let vDTM101 = this._segVal(dtm, 101);
            let vDTM102 = this._segVal(dtm, 102);
            let vDTM103 = this._segVal(dtm, 103);
            let theDate = Utils.dateStrFromDTM2(vDTM102, vDTM103);
            switch (vDTM101) {
                case '171':
                    this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo')
                        .att('shipNoticeDate', theDate);
                    this._ele2(invoiceDetailShipNoticeInfo, 'ShipNoticeReference')
                        .att('shipNoticeDate', theDate);
                    break;
            }
        }
    }
    private _SG25_SG29_RFF_ACE_Regular(sg29: ASTNode, tItem: TidyInvoiceDetailItem, tSItem: TidyInvoiceDetailServiceItem, vRFF102: string, vRFF103: string) {

        // RFF102
        let entryRef = tItem.ServiceEntryItemReference.ele('ServiceEntryItemReference')
            .att('serviceEntryID', vRFF102);
        let sEntryRef = tSItem.ServiceEntryItemIDInfo.ele('ServiceEntryItemReference')
            .att('serviceEntryID', vRFF102);

        // RFF103
        entryRef.att('serviceLineNumber', vRFF103)
            .ele('DocumentReference').att(XML.payloadID, '');
        sEntryRef.att('serviceLineNumber', vRFF103)
            .ele('DocumentReference').att(XML.payloadID, '');

        // DTM, let's assume only one for one RFF
        let DTMs = this._dSegs(sg29, 'DTM');
        for (let dtm of DTMs) {
            let vDTM101 = this._segVal(dtm, 101);
            let vDTM102 = this._segVal(dtm, 102);
            let vDTM103 = this._segVal(dtm, 103);
            let theDate = Utils.dateStrFromDTM2(vDTM102, vDTM103);
            switch (vDTM101) {
                case '171':
                    entryRef.att('serviceEntryDate', theDate);
                    sEntryRef.att('serviceEntryDate', theDate);
                    break;
            }
        }
    }


    private _SG25PIA(valPLMP: string, sg25: ASTNode, tItemRef: TidyInvoiceDetailItemReference
        , tSItemRef: TidyInvoiceDetailServiceItemReference) {
        // <!ELEMENT ItemID (SupplierPartID, SupplierPartAuxiliaryID?, BuyerPartID?, IdReference*)>
        // create Structure first
        let eItemID: XMLBuilder;
        let tItemID = new TidyItemID();
        if (valPLMP == 'PL') {
            eItemID = tItemRef.ItemID.ele('ItemID');
        } else {
            eItemID = tSItemRef.ItemID.ele('ItemID');
        }

        // create empty value first, in case there is no value in EDI
        tItemID.SupplierPartID.ele('SupplierPartID').txt('');

        // <!ELEMENT InvoiceDetailItemReferenceRetail (EANID?, EuropeanWasteCatalogID?, Characteristic*)>
        let PIAs = this._dSegs(sg25, 'PIA');
        if (PIAs) {
            let fragEANID = fragment();
            let fragWasteCatalog = fragment();
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
                        case 'CC':
                            tItemRef.Classification.ele('Classification').att(XML.domain, 'UNSPSC')
                                .txt(vNumber);
                            tSItemRef.Classification.ele('Classification').att(XML.domain, 'UNSPSC')
                                .txt(vNumber);
                            break;
                        case 'EN':
                            fragEANID.ele('EANID').txt(vNumber);
                            break;
                        case 'MF':
                            tItemRef.ManufacturerPartID.ele('ManufacturerPartID').txt(vNumber);
                            break;
                        case 'SN':
                            tItemRef.att('serialNumber', vNumber);
                            tItemRef.SerialNumber.ele('SerialNumber').txt(vNumber);
                            break;
                        case 'UP':
                            tItemID.IdReference.ele(XML.IdReference)
                                .att(XML.domain, 'UPCUniversalProductCode')
                                .att(XML.identifier, vNumber);
                            break;
                        case 'VN':
                        case 'SA':
                            this._ele2(tItemID.SupplierPartID, 'SupplierPartID')
                                .txt(vNumber);
                            break;
                        case 'VS':
                            tItemID.SupplierPartAuxiliaryID.ele('SupplierPartAuxiliaryID')
                                .txt(vNumber);
                            break;
                        case 'ZZZ':
                            fragWasteCatalog.ele('EuropeanWasteCatalogID').txt(vNumber);
                            break;

                    }
                }
            } // end loop PIAs
            // <!ELEMENT InvoiceDetailItemReferenceRetail (EANID?, EuropeanWasteCatalogID?, Characteristic*)>
            if (!this._isXmlEmpty(fragEANID) || !this._isXmlEmpty(fragWasteCatalog)) {
                let refDetail = this._ele3(tItemRef.InvoiceDetailItemReferenceIndustry, 'InvoiceDetailItemReferenceIndustry', 'InvoiceDetailItemReferenceRetail');
                refDetail.import(fragEANID);
                refDetail.import(fragWasteCatalog);
            }


        } // end if PIAs
        tItemID.sendTo(eItemID);
    }
    /**
     * 
     * @param sg25 
     * @param tItem 
     * @param tSItem 
     */
    private _SG25_SG28_Regular(sg25: ASTNode, tItem: TidyInvoiceDetailItem, tSItem: TidyInvoiceDetailServiceItem) {
        let SG28s = this._dGrps(sg25, 'SG28');
        for (let sg28 of SG28s) {
            let PRI = this._dSeg1(sg28, 'PRI');
            let APR = this._dSeg1(sg28, 'APR');
            let RNG = this._dSeg1(sg28, 'RNG');
            let vPRI101 = this._segVal(PRI, 101);
            let vPRI104 = this._segVal(PRI, 104);
            let vPRI105 = this._segVal(PRI, 105);
            let vPRI106 = this._segVal(PRI, 106);
            switch (vPRI101) {
                case 'CAL':
                    if (vPRI104 == 'AAK') {
                        this._ele2(this._tDReqHeader.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator')
                            .att('isPriceAdjustmentInLine', 'yes');
                    }
                    if (APR) {
                        let q = tItem.PriceBasisQuantity.ele('PriceBasisQuantity')
                            .att('conversionFactor', this._segVal(APR, 201));
                        q.ele('UnitOfMeasure').txt(this._segVal(RNG, 201));
                        q.att('quantity', this._segVal(RNG, 202));
                    }
                    break;
                case 'AAA':
                    tItem.UnitPrice.ele('UnitPrice').ele('Money')
                        .att(XML.currency, this._currTrans);
                    tSItem.UnitPrice.ele('UnitPrice').ele('Money')
                        .att(XML.currency, this._currTrans);
                    if (vPRI104 == 'AAK') {
                        this._ele2(this._tDReqHeader.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator')
                            .att('isPriceAdjustmentInLine', 'yes');
                    }

                    tItem.PriceBasisQuantity.ele('PriceBasisQuantity').att('quantity', vPRI105)
                        .att('conversionFactor', '1');
                    tSItem.PriceBasisQuantity.ele('PriceBasisQuantity').att('quantity', vPRI105)
                        .att('conversionFactor', '1');

                    this._ele2(tItem.PriceBasisQuantity, 'PriceBasisQuantity').ele('UnitOfMeasure')
                        .txt(vPRI106)
                    this._ele2(tSItem.PriceBasisQuantity, 'PriceBasisQuantity').ele('UnitOfMeasure')
                        .txt(vPRI106)
                    break;
                case 'AAB':
                    let grossPrice = tItem.InvoiceDetailItemIndustry.ele('InvoiceDetailItemIndustry')
                        .ele('InvoiceDetailItemRetail').ele('AdditionalPrices').ele('UnitGrossPrice');
                    let money = grossPrice.ele('Money');
                    money.att(XML.currency, this._currTrans);
                    let qAAB = money.ele('PriceBasisQuantity');
                    qAAB.att('quantity', vPRI105).att('conversionFactor', '1');
                    qAAB.ele('UnitOfMeasure').txt(vPRI106);
                    break;
            }

        }
    }
    private _SG25_SG26_Regular(sg25: ASTNode, tItem: TidyInvoiceDetailItem, tSItem: TidyInvoiceDetailServiceItem) {
        let SG26s = this._dGrps(sg25, 'SG26');
        for (let sg26 of SG26s) {
            let MOAs = this._dSegs(sg26, 'MOA');
            for (let m of MOAs) {
                let v101 = this._segVal(m, 101);
                let v102 = this._segVal(m, 102);
                let v103 = this._segVal(m, 103);
                let v104 = this._segVal(m, 104);
                switch (v101 + '_' + v104) {
                    case '128_4':
                        let eGrossAmount = tItem.GrossAmount.ele('GrossAmount');
                        let eSGrossAmount = tSItem.GrossAmount.ele('GrossAmount');
                        eGrossAmount.ele('Money').att(XML.currency, v103).txt(v102);
                        eSGrossAmount.ele('Money').att(XML.currency, v103).txt(v102);
                        break;
                    case '203_4':
                        let eNetAmount = tItem.NetAmount.ele('NetAmount');
                        let eSNetAmount = tSItem.NetAmount.ele('NetAmount');
                        eNetAmount.ele('Money').att(XML.currency, v103).txt(v102);
                        eSNetAmount.ele('Money').att(XML.currency, v103).txt(v102);
                        break;
                    case '38_4':
                        let eNetAmount2 = tItem.NetAmount.ele('NetAmount');
                        let eSNetAmount2 = tSItem.NetAmount.ele('NetAmount');
                        eNetAmount2.ele('Money').att(XML.currency, v103).txt(v102);
                        eSNetAmount2.ele('Money').att(XML.currency, v103).txt(v102);
                        break;
                    case '289_4':
                        let eSubtotalAmount = tItem.SubtotalAmount.ele('SubtotalAmount');
                        let eSSubtotalAmount = tSItem.SubtotalAmount.ele('SubtotalAmount');
                        eSubtotalAmount.ele('Money').att(XML.currency, v103).txt(v102);
                        eSSubtotalAmount.ele('Money').att(XML.currency, v103).txt(v102);
                        break;
                    case '176_4':
                        let eTax = tItem.Tax.ele('Tax');
                        let eSTax = tSItem.Tax.ele('Tax');
                        eTax.ele('Money').att(XML.currency, v103).txt(v102);
                        eSTax.ele('Money').att(XML.currency, v103).txt(v102);
                        this._ele2(this._tDReqHeader.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator')
                            .att('isTaxInLine', 'yes');
                        break;
                    case '176_7':
                        let eTax2 = tItem.Tax.ele('Tax');
                        let eSTax2 = tSItem.Tax.ele('Tax');
                        eTax2.ele('Money').att(XML.currency, v103).txt(v102);
                        eSTax2.ele('Money').att(XML.currency, v103).txt(v102);
                        break;
                    case '146_4':
                        let eUnitPrice = tItem.UnitPrice.ele('UnitPrice');
                        let eSUnitPrice = tSItem.UnitPrice.ele('UnitPrice');
                        eUnitPrice.ele('Money').att(XML.currency, v103).txt(v102);
                        eSUnitPrice.ele('Money').att(XML.currency, v103).txt(v102);
                        break;
                    case '259_4':
                        let eTotalCharges = tItem.Tax.ele('TotalCharges');
                        let eSTotalCharges = tSItem.Tax.ele('TotalCharges');
                        eTotalCharges.ele('Money').att(XML.currency, v103).txt(v102);
                        eSTotalCharges.ele('Money').att(XML.currency, v103).txt(v102);
                        break;
                    case '260_4':
                        let eTotalAllowances = tItem.Tax.ele('TotalAllowances');
                        let eSTotalAllowances = tSItem.Tax.ele('TotalAllowances');
                        eTotalAllowances.ele('Money').att(XML.currency, v103).txt(v102);
                        eSTotalAllowances.ele('Money').att(XML.currency, v103).txt(v102);
                        break;
                    case '125_4':
                        let eTotalAmountWithoutTax = tItem.Tax.ele('TotalAmountWithoutTax');
                        let eSTotalAmountWithoutTax = tSItem.Tax.ele('TotalAmountWithoutTax');
                        eTotalAmountWithoutTax.ele('Money').att(XML.currency, v103).txt(v102);
                        eSTotalAmountWithoutTax.ele('Money').att(XML.currency, v103).txt(v102);
                        break;


                } // end switch
            } // end loop MOAs
        } // end loop SG26s

    }

    private _SG25_SG26_Header(sg25: ASTNode, tSummary: TidyInvoiceDetailOrderSummary) {
        let SG26s = this._dGrps(sg25, 'SG26');
        for (let sg26 of SG26s) {
            let MOAs = this._dSegs(sg26, 'MOA');
            for (let m of MOAs) {
                let v101 = this._segVal(m, 101);
                let v102 = this._segVal(m, 102);
                let v103 = this._segVal(m, 103);
                let v104 = this._segVal(m, 104);
                switch (v101 + '_' + v104) {
                    case '128_4':
                        let eGrossAmount = tSummary.GrossAmount.ele('GrossAmount');
                        eGrossAmount.ele('Money').att(XML.currency, v103).txt(v102);
                        break;
                    // case '203_4':
                    //     let eNetAmount = tSummary.NetAmount.ele('NetAmount');
                    //     eNetAmount.ele('Money').att(XML.currency, v103).txt(v102);
                    //     break;
                    // case '38_4':
                    //     let eNetAmount2 = tSummary.NetAmount.ele('NetAmount');
                    //     eNetAmount2.ele('Money').att(XML.currency, v103).txt(v102);
                    //     break;
                    case '289_4':
                        let eSubtotalAmount = tSummary.SubtotalAmount.ele('SubtotalAmount');
                        eSubtotalAmount.ele('Money').att(XML.currency, v103).txt(v102);
                        break;
                    case '176_4':
                        let eTax = this._ele2(tSummary.Tax, 'Tax');
                        eTax.ele('Money').att(XML.currency, v103).txt(v102);
                        this._ele2(this._tDReqHeader.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator')
                            .att('isTaxInLine', 'yes');
                        break;
                    case '176_7':
                        let eTax2 = this._ele2(tSummary.Tax, 'Tax');
                        eTax2.ele('Money').att(XML.currency, v103).txt(v102);
                        this._ele2(this._tDReqHeader.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator')
                            .att('isTaxInLine', 'yes');
                        break;
                } // end switch
            } // end loop MOAs
        } // end loop SG26s

    }
    private _SG25_FTX_Regular(sg25: ASTNode, fragComments: XMLBuilder, tTax: TidyTax) {
        let FTXs = this._dSegs(sg25, 'FTX');
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
                    fragComments.ele('Comments')
                        .txt(v401 + v402 + v403 + v404 + v405)
                        .att(XML.lang, v5);
                    break;
                case 'TXD':
                    if (!v2) {
                        tTax.Description
                            .ele('Description')
                            .txt(v401 + v402 + v403 + v404 + v405)
                            .att(XML.lang, v5);
                    } else {
                        // v2 should be '4'
                        tTax.TaxDetail.ele('TaxDetail')
                            .ele('TriangularTransactionLawReference')
                            .txt(v401 + v402 + v403 + v404 + v405)
                            .att(XML.lang, v5);
                    }
                    break;
                case 'ACB':
                    break;
                default:
                // do nothing
            } // end switch FTX v1

        } // end loop FTXs
    }

    private _SG25FTXHeaderInvoice(sg25: ASTNode, tSummary: TidyInvoiceDetailOrderSummary) {
        // <!ELEMENT InvoiceDetailOrderSummary (SubtotalAmount, Period?, Tax?,
        //     InvoiceDetailLineSpecialHandling?,
        //     InvoiceDetailLineShipping?,
        //     GrossAmount?, InvoiceDetailDiscount?,
        //     NetAmount?, Comments?, Extrinsic*)>
        let fragTax = tSummary.Tax
        let fragComments = tSummary.Comments;
        let fragExtrinsic = tSummary.Extrinsic;

        let FTXs = this._dSegs(sg25, 'FTX');
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
                    fragComments.ele('Comments')
                        .txt(v401 + v402 + v403 + v404 + v405)
                        .att(XML.lang, v5);
                    break;
                case 'TXD':
                    if (!v2) {
                        this._ele2(fragTax, 'Tax')
                            .ele('Description')
                            .txt(v401 + v402 + v403 + v404 + v405)
                            .att(XML.lang, v5);
                    } else {
                        // v2 should be '4'
                        this._ele2(fragTax, 'Tax').ele('TaxDetail')
                            .ele('TriangularTransactionLawReference')
                            .txt(v401 + v402 + v403 + v404 + v405)
                            .att(XML.lang, v5);
                    }
                    break;
                case 'ZZZ':
                    fragExtrinsic.ele(XML.Extrinsic).att('name', v401)
                        .txt(v402 + v403 + v404 + v405);
                    break;
                default:
                // do nothing
            } // end switch FTX v1

        } // end loop FTXs
    }


    /**
     * /InvoiceDetailRequest/InvoiceDetailSummary/InvoiceDetailDiscount/…
     * should be at most one element under InvoiceDetailSummary
     * 
     * @param sg15 
     * @param invoiceHeaderModifications 
     * @returns 
     */
    private _SG15InvoiceDetailDiscount(sg15: ASTNode, fragIVDetailDiscount: XMLBuilder) {

        // Don't worry about outside loop, should be at most one element under InvoiceDetailSummary
        let IVDD = fragIVDetailDiscount.ele('InvoiceDetailDiscount');

        let SG18 = this._dGrp1(sg15, 'SG18');
        // PCD <InvoiceDetailDiscount @percentageRate>
        let PCD = this._dSeg1(SG18, 'PCD');
        IVDD.att('percentageRate', this._segVal(PCD, 102))

        let SG19s = this._dGrps(sg15, 'SG19');
        let MOA_52_4 = this._segByGrpEleVal2(SG19s, 'MOA', 101, '52', 104, '4');
        let MOA_52_7 = this._segByGrpEleVal2(SG19s, 'MOA', 101, '52', 104, '7');
        if (MOA_52_4) {
            let m = IVDD.ele('Money').att(XML.currency, this._segVal(MOA_52_4, 103))
                .txt(this._segVal(MOA_52_4, 102));
            if (MOA_52_7) {
                m.att('alternateAmount', this._segVal(MOA_52_7, 102))
                    .att('alternateCurrency', this._segVal(MOA_52_7, 103))
            }
        }

    }
    /**
     * /InvoiceDetailRequest/InvoiceDetailSummary/InvoiceDetailDiscount/…
     * should be at most one element under InvoiceDetailSummary
     * 
     * @param sg15 
     * @param invoiceHeaderModifications 
     * @returns 
     */
    private _SG25_SG38_InvoiceDetailDiscount(sg38: ASTNode, fragIVDetailDiscount: XMLBuilder) {

        // Don't worry about outside loop, should be at most one element under InvoiceDetailSummary
        let eInvoiceDetailDiscount = fragIVDetailDiscount.ele('InvoiceDetailDiscount');

        let SG40 = this._dGrp1(sg38, 'SG40');
        let SG41s = this._dGrps(sg38, 'SG41');
        let SG43s = this._dGrps(sg38, 'SG43');
        // PCD <InvoiceDetailDiscount @percentageRate>
        let PCD = this._dSeg1(SG40, 'PCD');
        eInvoiceDetailDiscount.att('percentageRate', this._segVal(PCD, 102))

        let MOA_52_4 = this._segByGrpEleVal2(SG41s, 'MOA', 101, '52', 104, '4');
        let MOA_52_7 = this._segByGrpEleVal2(SG41s, 'MOA', 101, '52', 104, '7');
        let m: XMLBuilder;
        if (MOA_52_4) {
            m = eInvoiceDetailDiscount.ele('Money').att(XML.currency, this._segVal(MOA_52_4, 103))
                .txt(this._segVal(MOA_52_4, 102));
            if (MOA_52_7) {
                m.att('alternateAmount', this._segVal(MOA_52_7, 102))
                    .att('alternateCurrency', this._segVal(MOA_52_7, 103))
            }
            this._ele2(this._tDReqHeader.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator')
                .att('isDiscountInLine', 'yes');
        }
        if (MOA_52_7 && m) {
            m.att('alternateAmount', this._segVal(MOA_52_7, 102))
                .att('alternateCurrency', this._segVal(MOA_52_7, 104));
        }

    }

    /**
     * /InvoiceDetailRequest/InvoiceDetailSummary/ShippingAmount/…
     * 
     * @returns 
     */
    private _SG15ShippingAmount(sg15: ASTNode, fragShippingAmount: XMLBuilder, tSummaryTax: TidyTax) {
        let IVDD = fragShippingAmount.ele('ShippingAmount');

        let SG19s = this._dGrps(sg15, 'SG19');
        let MOA_23_4 = this._segByGrpEleVal2(SG19s, 'MOA', 101, '23', 104, '4');
        let MOA_23_7 = this._segByGrpEleVal2(SG19s, 'MOA', 101, '23', 104, '7');
        if (MOA_23_4) {
            let m = IVDD.ele('Money').att(XML.currency, this._segVal(MOA_23_4, 103))
                .txt(this._segVal(MOA_23_4, 102));
            if (MOA_23_7) {
                m.att('alternateAmount', this._segVal(MOA_23_7, 102))
                    .att('alternateCurrency', this._segVal(MOA_23_7, 103))
            }
        }

        let SG21s = this._dGrps(sg15, 'SG21');
        for (let sg21 of SG21s) {
            let TAX = this._dSeg1(sg21, 'TAX');
            let MOA_124_4 = this._segByEleVal3(sg21, 'MOA', 101, '124', 104, '4');
            this._SG21_SG43_TaxDetail(TAX, MOA_124_4, tSummaryTax);
        }
    }

    /**
     * /InvoiceDetailRequest/InvoiceDetailSummary/ShippingAmount/…
     * 
     * @returns 
     */
    private _SG25_SG38_DetailLineShipping(sg38: ASTNode, fragDetailLineShipping: XMLBuilder, tTax: TidyTax) {
        let SG41s = this._dGrps(sg38, 'SG41');
        let MOA_23_4 = this._segByGrpEleVal2(SG41s, 'MOA', 101, '23', 104, '4');
        let MOA_23_7 = this._segByGrpEleVal2(SG41s, 'MOA', 101, '23', 104, '7');
        if (MOA_23_4) {
            let eInvoiceDetailLineShipping = fragDetailLineShipping.ele('InvoiceDetailLineShipping');
            let m = eInvoiceDetailLineShipping.ele('Money').att(XML.currency, this._segVal(MOA_23_4, 103))
                .txt(this._segVal(MOA_23_4, 102));
            if (MOA_23_7) {
                m.att('alternateAmount', this._segVal(MOA_23_7, 102))
                    .att('alternateCurrency', this._segVal(MOA_23_7, 103))
            }
            this._ele2(this._tDReqHeader.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator')
                .att('isShippingInLine', 'yes');
        }

        // TAX
        let SG43s = this._dGrps(sg38, 'SG43');
        for (let sg43 of SG43s) {
            let TAX = this._dSeg1(sg43, 'TAX');
            let MOA_124_4 = this._segByEleVal3(sg43, 'MOA', 101, '124', 104, '4');
            this._SG21_SG43_TaxDetail(TAX, MOA_124_4, tTax);
        }


    }
    /**
     * /InvoiceDetailRequest/InvoiceDetailSummary/ShippingAmount/…
     * 
     * @returns 
     */
    private _SG25_SG38_Distribution(sg38: ASTNode, ALC: EdiSegment, fragDistribution: XMLBuilder) {
        let eDistribution = fragDistribution.ele('Distribution');
        eDistribution.ele('Accounting').ele('AccountingSegment').att('id', this._segVal(ALC, 201))
            .ele('Name').txt(this._segVal(ALC, 504))
            .up().ele('Description').txt(this._segVal(ALC, 505));


        let SG41s = this._dGrps(sg38, 'SG41');
        let MOA_54_4 = this._segByGrpEleVal2(SG41s, 'MOA', 101, '54', 104, '4');
        let MOA_54_7 = this._segByGrpEleVal2(SG41s, 'MOA', 101, '54', 104, '7');
        if (MOA_54_4) {
            let m = eDistribution.ele('Charge').ele('Money').att(XML.currency, this._segVal(MOA_54_4, 103))
                .txt(this._segVal(MOA_54_4, 102));
            if (MOA_54_7) {
                m.att('alternateAmount', this._segVal(MOA_54_7, 102))
                    .att('alternateCurrency', this._segVal(MOA_54_7, 103))
            }
            this._ele2(this._tDReqHeader.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator')
                .att('isAccountingInLine', 'yes');
        }
    }

    /**
    * /InvoiceDetailRequest/InvoiceDetailSummary/SpecialHandlingAmount/…
    * 
    * @returns 
    */
    private _SG15SpecialHandlingAmount(sg15: ASTNode, ALC: EdiSegment
        , fragSpecialHandlingAmount: XMLBuilder, tSummaryTax: TidyTax) {
        let SPHandle = fragSpecialHandlingAmount.ele('SpecialHandlingAmount');


        SPHandle.ele('Description').txt(this._segVal(ALC, 504) + this._segVal(ALC, 505));

        let SG19s = this._dGrps(sg15, 'SG19');
        let MOA_23_4 = this._segByGrpEleVal2(SG19s, 'MOA', 101, '23', 104, '4');
        let MOA_23_7 = this._segByGrpEleVal2(SG19s, 'MOA', 101, '23', 104, '7');
        if (MOA_23_4) {
            let m = SPHandle.ele('Money').att(XML.currency, this._segVal(MOA_23_4, 103))
                .txt(this._segVal(MOA_23_4, 102));
            if (MOA_23_7) {
                m.att('alternateAmount', this._segVal(MOA_23_7, 102))
                    .att('alternateCurrency', this._segVal(MOA_23_7, 103))
            }
        }

        let SG21s = this._dGrps(sg15, 'SG21');
        for (let sg21 of SG21s) {
            let TAX = this._dSeg1(sg21, 'TAX');
            let MOA_124_4 = this._segByEleVal3(sg21, 'MOA', 101, '124', 104, '4');
            this._SG21_SG43_TaxDetail(TAX, MOA_124_4, tSummaryTax);
        }
    }
    /**
    * /InvoiceDetailRequest/InvoiceDetailSummary/SpecialHandlingAmount/…
    * 
    * @returns 
    */
    private _SG25_SG38_SpecialHandling(sg38: ASTNode, ALC: EdiSegment
        , fragInvoiceDetailLineSpecialHandling: XMLBuilder, tTax: TidyTax) {
        let eSPHandle = fragInvoiceDetailLineSpecialHandling.ele('InvoiceDetailLineSpecialHandling');
        eSPHandle.ele('Description').txt(this._segVal(ALC, 504) + this._segVal(ALC, 505));

        let SG41s = this._dGrps(sg38, 'SG41');
        let MOA_23_4 = this._segByGrpEleVal2(SG41s, 'MOA', 101, '23', 104, '4');
        let MOA_23_7 = this._segByGrpEleVal2(SG41s, 'MOA', 101, '23', 104, '7');
        if (MOA_23_4) {
            let m = eSPHandle.ele('Money').att(XML.currency, this._segVal(MOA_23_4, 103))
                .txt(this._segVal(MOA_23_4, 102));
            if (MOA_23_7) {
                m.att('alternateAmount', this._segVal(MOA_23_7, 102))
                    .att('alternateCurrency', this._segVal(MOA_23_7, 103))
            }
            this._ele2(this._tDReqHeader.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator')
                .att('isSpecialHandlingInLine', 'yes');
        }

        let SG43s = this._dGrps(sg38, 'SG43');
        for (let sg43 of SG43s) {
            let TAX = this._dSeg1(sg43, 'TAX');
            let MOA_124_4 = this._segByEleVal3(sg43, 'MOA', 101, '124', 104, '4');
            this._SG21_SG43_TaxDetail(TAX, MOA_124_4, tTax);
        }
    }


    /**
     * "A" for <AdditionalDeduction> and  "C" for <AdditionalCost>
     * @param sg15 
     * @param invoiceHeaderModifications 
     * @returns 
     */
    private _SG15Modification(sg15: ASTNode, ALC: EdiSegment, fragIVHDMod: XMLBuilder) {

        let invoiceHeaderModifications = this._ele2(fragIVHDMod, 'InvoiceHeaderModifications');
        // DTD: <!ELEMENT Modification (OriginalPrice?, (AdditionalDeduction | AdditionalCost), Tax?, ModificationDetail?)>
        let eModification = invoiceHeaderModifications.ele('Modification');
        let tModification = new TidyModification();

        let fragOrgPrice = tModification.OriginalPrice;
        let fragADeduction = tModification.AdditionalDeduction;
        let fragACost = tModification.AdditionalCost;
        let tTax = new TidyTax();
        let fragMDetail = tModification.ModificationDetail;

        let mDetail = fragMDetail.ele('ModificationDetail');
        let mDetailDesc = mDetail.ele('Description');
        let arrDescTxt: string[] = [];

        mDetailDesc.ele('ShortName').txt(this._segVal(ALC, 201));
        let val3 = this._segVal(ALC, 3);
        let vALC1 = this._segVal(ALC, 1);
        mDetail.ele(XML.Extrinsic).att('name', 'settlementCode').txt(MAPS.mapALCSettle[val3]);
        eModification.att('level', this._segVal(ALC, 4));
        let val501 = this._segVal(ALC, 501);
        if (val501 != 'ZZZ') {
            mDetail.att('name', MAPS.mapALCSpecServ[val501]);
            arrDescTxt.push(this._segVal(ALC, 504) + this._segVal(ALC, 505));
        } else {
            mDetail.att('name', this._segVal(ALC, 505));
            arrDescTxt.push(this._segVal(ALC, 504));
        }

        // SG15_SG16
        let SG16 = this._dGrp1(sg15, 'SG16');
        // RFF
        let SG16RFF = this._dSeg1(SG16, 'RFF');
        if (SG16RFF) {
            arrDescTxt.push(this._segVal(SG16RFF, 102));
            mDetailDesc.att(XML.lang, this._segVal(SG16RFF, 103));
        }
        mDetailDesc.txt(arrDescTxt.join());

        // SG15_SG16 DTM
        let DTM194 = this._segByEleVal(SG16, 'DTM', 101, '194');
        let DTM206 = this._segByEleVal(SG16, 'DTM', 101, '206');
        if (DTM194) {
            mDetail.att('startDate', Utils.dateStrFromDTM2(this._segVal(DTM194, 102), this._segVal(DTM194, 103)))
        }
        if (DTM206) {
            mDetail.att('endDate', Utils.dateStrFromDTM2(this._segVal(DTM206, 102), this._segVal(DTM206, 103)))
        }

        // SG15_SG18
        let SG18 = this._dGrp1(sg15, 'SG18');
        // PCD
        let PCD = this._dSeg1(SG18, 'PCD');

        if (PCD) {
            if (vALC1 == 'A') {
                fragADeduction.ele('AdditionalDeduction').ele('DeductionPercent')
                    .att('percent', this._segVal(PCD, 102));
            } else {
                // 'C'
                fragACost.ele('AdditionalCost').ele('Percentage')
                    .att('percent', this._segVal(PCD, 102));
            }
        }

        // SG15_SG19
        let SG15_SG19 = this._dGrp1(sg15, 'SG19');
        // MOA
        let SG19MOAs = this._dSegs(SG15_SG19, 'MOA');
        for (let m of SG19MOAs) {
            let val101 = this._segVal(m, 101);
            let val102 = this._segVal(m, 102);
            let val103 = this._segVal(m, 103);
            switch (val101) {
                case '98':
                    fragOrgPrice.ele('OriginalPrice').ele('Money').att(XML.currency, val103)
                        .txt(val102);
                    break;
                case '4':
                    this._ele2(fragADeduction, 'AdditionalDeduction').ele('DeductedPrice').ele('Money')
                        .att(XML.currency, val103)
                        .txt(val102);
                    break;
                case '8':
                    this._ele2(fragADeduction, 'AdditionalDeduction').ele('DeductionAmount').ele('Money')
                        .att(XML.currency, val103)
                        .txt(val102);
                    this._ele2(fragACost, 'AdditionalCost').ele('Money')
                        .att(XML.currency, val103)
                        .txt(val102);
                    break;
                case '23':
                    this._ele2(fragACost, 'AdditionalCost').ele('Money')
                        .att(XML.currency, val103)
                        .txt(val102);
                    break;
                case '204':
                    this._ele2(fragADeduction, 'AdditionalDeduction').ele('DeductionAmount').ele('Money')
                        .att(XML.currency, val103)
                        .txt(val102);
                    break;
                case '25':
                    // If no curremcy is sent in this MOA, use curreny from header CUX segment C504/6345
                    mDetail.ele(XML.Extrinsic).att('name', 'allowanceChargeBasisAmount').ele('Money')
                        .att(XML.currency, val103 == '' ? this._currTrans : val103)
                        .txt(val102);
                    break;
                default:
                // do nothing

            } // end switch MOA val101
        } // end loop SG19 MOAs

        // SG15_SG21 
        let SG21s = this._dGrps(sg15, 'SG21'); // I don't think there will be multiple SG21;      
        // <!ELEMENT Tax (Money, TaxAdjustmentAmount?, Description, TaxDetail*, Distribution*, Extrinsic*)>
        let SG21TAX9 = this._segByGrpEleVal(SG21s, 'TAX', 1, '9');
        let SG21TAX7 = this._segByGrpEleVal(SG21s, 'TAX', 1, '7');
        let SG21TAX5 = this._segByGrpEleVal(SG21s, 'TAX', 1, '5');
        let SG21MOA176 = this._segByGrpEleVal(SG21s, 'MOA', 101, '176');
        let SG21MOA124 = this._segByGrpEleVal(SG21s, 'MOA', 101, '124');


        // Money
        if (SG21MOA176) {
            tTax.Money.ele('Money').att(XML.currency, this._segVal(SG21MOA176, 103))
                .txt(this._segVal(SG21MOA176, 102));
        }
        // Description
        if (SG21TAX9) {
            // Description
            tTax.Description.ele('Description').txt(this._segVal(SG21TAX9, 7));
        }

        // TaxDetail
        if (SG21TAX7) {
            let taxD = tTax.TaxDetail.ele('TaxDetail').att('purpose', 'tax');
            this._SG21_SG43_TaxDetail(SG21TAX7, SG21MOA124, tTax, 'tax');
        }
        if (SG21TAX5) {
            let taxD = tTax.TaxDetail.ele('TaxDetail').att('purpose', 'duty');
            this._SG21_SG43_TaxDetail(SG21TAX7, SG21MOA124, tTax, 'duty');
        }

        // DTD: <!ELEMENT Modification (OriginalPrice?, (AdditionalDeduction | AdditionalCost), Tax?, ModificationDetail?)>
        // DTD: <!ELEMENT AdditionalDeduction (DeductionAmount | DeductionPercent | DeductedPrice)>
        tTax.sendTo(tModification.Tax.ele('Tax'));
        tModification.sendTo(eModification);
    }

    /**
     * "A" for <AdditionalDeduction> and  "C" for <AdditionalCost>
     * @param sg38 
     * @param invoiceHeaderModifications 
     * @returns 
     */
    private _SG25_SG38_Modification(sg38: ASTNode, ALC: EdiSegment, eMods: XMLBuilder) {

        // DTD: <!ELEMENT Modification (OriginalPrice?, (AdditionalDeduction | AdditionalCost), Tax?, ModificationDetail?)>
        let eModification = eMods.ele('Modification');
        let tModification = new TidyModification();

        let fragOrgPrice = tModification.OriginalPrice;
        let fragADeduction = tModification.AdditionalDeduction;
        let fragACost = tModification.AdditionalCost;
        let fragTax = tModification.Tax;
        let fragMDetail = tModification.ModificationDetail;

        let mDetail = fragMDetail.ele('ModificationDetail');
        let mDetailDesc = mDetail.ele('Description');
        let arrDescTxt: string[] = [];


        mDetailDesc.ele('ShortName').txt(this._segVal(ALC, 201));
        let val3 = this._segVal(ALC, 3);
        let vALC1 = this._segVal(ALC, 1);
        mDetail.ele(XML.Extrinsic).att('name', 'settlementCode').txt(MAPS.mapALCSettle[val3]);
        eModification.att('level', this._segVal(ALC, 4));
        let val501 = this._segVal(ALC, 501);
        if (val501 != 'ZZZ') {
            mDetail.att('name', MAPS.mapALCSpecServ[val501]);
            arrDescTxt.push(this._segVal(ALC, 504) + this._segVal(ALC, 505));
        } else {
            mDetail.att('name', this._segVal(ALC, 505));
            arrDescTxt.push(this._segVal(ALC, 504));
        }

        // // SG15_SG16
        // let SG16 = this._dGrp1(sg15, 'SG16');
        // // RFF
        // let SG16RFF = this._dSeg1(SG16, 'RFF');
        // if (SG16RFF) {
        //     arrDescTxt.push(this._segVal(SG16RFF, 102));
        //     mDetailDesc.att(XML.lang, this._segVal(SG16RFF, 103));
        // }
        // mDetailDesc.txt(arrDescTxt.join());

        // SG38 DTM
        let DTM194 = this._segByEleVal(sg38, 'DTM', 101, '194');
        let DTM206 = this._segByEleVal(sg38, 'DTM', 101, '206');
        if (DTM194) {
            mDetail.att('startDate', Utils.dateStrFromDTM2(this._segVal(DTM194, 102), this._segVal(DTM194, 103)))
        }
        if (DTM206) {
            mDetail.att('endDate', Utils.dateStrFromDTM2(this._segVal(DTM206, 102), this._segVal(DTM206, 103)))
        }

        // SG38_SG40
        let SG40 = this._dGrp1(sg38, 'SG40');
        // PCD
        let PCD = this._dSeg1(SG40, 'PCD');

        if (PCD) {
            if (vALC1 == 'A') {
                fragADeduction.ele('AdditionalDeduction').ele('DeductionPercent')
                    .att('percent', this._segVal(PCD, 102));
            } else {
                // 'C'
                fragACost.ele('AdditionalCost').ele('Percentage')
                    .att('percent', this._segVal(PCD, 102));
            }
        }

        // SG38_SG41
        let SG41 = this._dGrp1(sg38, 'SG41');
        // MOA
        let SG41MOAs = this._dSegs(SG41, 'MOA');
        for (let m of SG41MOAs) {
            let val101 = this._segVal(m, 101);
            let val102 = this._segVal(m, 102);
            let val103 = this._segVal(m, 103);
            switch (val101) {
                case '98':
                    fragOrgPrice.ele('OriginalPrice').ele('Money').att(XML.currency, val103)
                        .txt(val102);
                    break;
                case '4':
                    this._ele2(fragADeduction, 'AdditionalDeduction').ele('DeductedPrice').ele('Money')
                        .att(XML.currency, val103)
                        .txt(val102);
                    break;
                case '8':
                    this._ele2(fragADeduction, 'AdditionalDeduction').ele('DeductionAmount').ele('Money')
                        .att(XML.currency, val103)
                        .txt(val102);
                    this._ele2(fragACost, 'AdditionalCost').ele('Money')
                        .att(XML.currency, val103)
                        .txt(val102);
                    break;
                case '23':
                    this._ele2(fragACost, 'AdditionalCost').ele('Money')
                        .att(XML.currency, val103)
                        .txt(val102);
                    break;
                case '204':
                    this._ele2(fragADeduction, 'AdditionalDeduction').ele('DeductionAmount').ele('Money')
                        .att(XML.currency, val103)
                        .txt(val102);
                    break;
                case '25':
                    // If no curremcy is sent in this MOA, use curreny from header CUX segment C504/6345
                    mDetail.ele(XML.Extrinsic).att('name', 'allowanceChargeBasisAmount').ele('Money')
                        .att(XML.currency, val103 == '' ? this._currTrans : val103)
                        .txt(val102);
                    break;
                default:
                // do nothing

            } // end switch MOA val101
        } // end loop SG19 MOAs

        // SG38_SG43 
        let SG43s = this._dGrps(sg38, 'SG43'); // I don't think there will be multiple SG21;      
        // <!ELEMENT Tax (Money, TaxAdjustmentAmount?, Description, TaxDetail*, Distribution*, Extrinsic*)>
        let SG43TAX9 = this._segByGrpEleVal(SG43s, 'TAX', 1, '9');
        let SG43TAX7 = this._segByGrpEleVal(SG43s, 'TAX', 1, '7');
        let SG43TAX5 = this._segByGrpEleVal(SG43s, 'TAX', 1, '5');
        let SG43MOA176 = this._segByGrpEleVal(SG43s, 'MOA', 101, '176');
        let SG43MOA124 = this._segByGrpEleVal(SG43s, 'MOA', 101, '124');
        let tTax = new TidyTax();
        // Money
        if (SG43MOA176) {
            tTax.Money.ele('Money').att(XML.currency, this._segVal(SG43MOA176, 103))
                .txt(this._segVal(SG43MOA176, 102));
        }
        // Description
        if (SG43TAX9) {
            // Description
            tTax.Description.ele('Description').txt(this._segVal(SG43TAX9, 7));
        }

        // TaxDetail
        if (SG43TAX7) {
            this._SG21_SG43_TaxDetail(SG43TAX7, SG43MOA124, tTax, 'tax');
        }
        if (SG43TAX5) {
            this._SG21_SG43_TaxDetail(SG43TAX7, SG43MOA124, tTax, 'duty');
        }

        // DTD: <!ELEMENT Modification (OriginalPrice?, (AdditionalDeduction | AdditionalCost), Tax?, ModificationDetail?)>
        // DTD: <!ELEMENT AdditionalDeduction (DeductionAmount | DeductionPercent | DeductedPrice)>
        tTax.sendTo(tModification.Tax.ele('Tax'));
        tModification.sendTo(eModification);
    }


    private _exemptDetail(bHeader: boolean, TAX: EdiSegment, tTaxDetail: TidyTaxDetail) {
        let vTax6 = this._segVal(TAX, 6);
        switch (vTax6) {
            case 'A':
                if (bHeader) {
                    this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'exemptType')
                        .txt('Mixed')
                } else {
                    tTaxDetail.Extrinsic.ele(XML.Extrinsic).att('name', 'exemptType')
                }
                break;
            case 'E':
                tTaxDetail.att('exemptDetail', 'Exempt');
                break;
            case 'S':
                this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'exemptType')
                    .txt('Standard')
                break;
            case 'Z':
                tTaxDetail.att('exemptDetail', 'ZeroRated');
                break;
        }
    }

    private _SG21_SG43_TaxDetail(TAX: EdiSegment, MOA: EdiSegment, tTidyTax: TidyTax, purpose?: string | undefined) {
        let tTaxDetail = new TidyTaxDetail();
        if (purpose) {
            tTaxDetail.att('purpose', purpose);
        }
        // TAX
        tTaxDetail.att('category', MAPS.mapTAXFreeType[this._segVal(TAX, 201)]);
        tTaxDetail.TaxLocation.ele('TaxLocation').txt(this._segVal(TAX, 204));
        tTaxDetail.TaxAdjustmentAmount.ele('TaxableAmount').ele('Money').txt(this._segVal(TAX, 304));
        tTaxDetail.att('taxRateType', this._segVal(TAX, 501));
        tTaxDetail.att('percentageRate', this._segVal(TAX, 504));

        this._exemptDetail(true, TAX, tTaxDetail);

        // TODO: interact with SG1 RFF+VA
        tTaxDetail.Description.ele('Description').txt(this._segVal(TAX, 506));

        // MOA, TODO: I don't know why the setting for Tax is in deep depth, so commented out
        // tTidyTax.Money.ele('Money').att(XML.currency, this._segVal(MOA, 103))
        //     .txt(this._segVal(MOA, 102));

        tTaxDetail.sendTo(tTidyTax.TaxDetail.ele('TaxDetail'));
    }

    private _SG8() {

        let SG8s = this._rGrps('SG8');

        for (let sg8 of SG8s) {
            // SG8 PAT
            let segPAT = this._dSeg1(sg8, 'PAT');
            let val4279 = this._segVal(segPAT, 1);
            let val201 = this._segVal(segPAT, 201);
            let val204 = this._segVal(segPAT, 204);
            let val205 = this._segVal(segPAT, 1);
            // Should be "6"
            if (val201 !== '6') {
                return;
            }
            switch (val4279) {
                case '3':
                    this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'netTermInformation')
                        .txt(val204 + val205);
                    break;
                case '20':
                    this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'penaltyInformation')
                        .txt(val204 + val205);
                    break;
                case '22':
                    this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'discountInformation')
                        .txt(val204 + val205);
                    break;
                default:
                // do nothing
            }
            let payTerm = this._tDReqHeader.PaymentTerm.ele('PaymentTerm');
            let fragPayTExtrinsic = fragment();
            payTerm.att('payInNumberOfDays', this._segVal(segPAT, 304));

            // DTM
            let segDTMs = this._dSegs(sg8, 'DTM');
            for (let s of segDTMs) {
                let val101 = this._segVal(s, 101);
                let val102 = this._segVal(s, 102);
                let val103 = this._segVal(s, 103);
                switch (val101) {
                    case '265': // use with PAT01="20"
                        fragPayTExtrinsic.ele(XML.Extrinsic).att('name', 'penaltyDueDate')
                            .txt(Utils.dateStrFromDTM2(val102, val103));
                        break;
                    case '12': // use with PAT01="22"
                        fragPayTExtrinsic.ele(XML.Extrinsic).att('name', 'discountDueDate')
                            .txt(Utils.dateStrFromDTM2(val102, val103));
                        break;
                    case '13': // use with PAT01="3"
                        fragPayTExtrinsic.ele(XML.Extrinsic).att('name', 'netDueDate')
                            .txt(Utils.dateStrFromDTM2(val102, val103));
                        break;
                    case '209': // use with ALL PAT01 values
                        fragPayTExtrinsic.ele(XML.Extrinsic).att('name', 'valueDate')
                            .txt(Utils.dateStrFromDTM2(val102, val103));
                        break;
                }
            }
            // PCD
            let PCD = this._dSeg1(sg8, 'PCD');
            let pcdVal101 = this._segVal(PCD, 101);
            let pcdVal102 = this._segVal(PCD, 102);
            let payDiscount: XMLBuilder;

            if (pcdVal101 == '15' && pcdVal102 && !pcdVal102.startsWith('-')) {
                // Penalty, If >0: convert to negative by setting prefix "-" (e.g. 10 -> -10).
                payDiscount = payTerm.ele('Discount');
                // <InvoiceDetailRequestHeader><PaymentTerm><Discount><DiscountPercent @percent>
                payDiscount.ele('DiscountPercent').att('percent', '-' + pcdVal102.replace('+', ''))
            } else {
                payDiscount = payTerm.ele('Discount');
                // <InvoiceDetailRequestHeader><PaymentTerm><Discount><DiscountPercent @percent>
                payDiscount.ele('DiscountPercent').att('percent', pcdVal102.replace('+', ''))
            }

            // MOA
            let MOA = this._dSeg1(sg8, 'MOA');
            if (!PCD && MOA) {
                payDiscount = payDiscount ?? payTerm.ele('Discount');
                payDiscount.ele('DiscountAmount').ele('Money').att(XML.currency,
                    this._segVal(MOA, 103)).txt(this._segVal(MOA, 102));
            }
            payTerm.import(fragPayTExtrinsic);

        } // end SG8 loop

    }
    private _SG1RFF() {
        // Group1 RFF, S101 == "IL"
        let SG1s = this._rGrps('SG1');

        if (!(SG1s && SG1s.length > 0)) {
            return;
        }

        let bNONPO = this._getNONPO(SG1s);
        this._SG1ON(SG1s);
        this._SG1CT(SG1s);
        this._SG1VN(SG1s);

        // RFF+IV
        let SG1RFFIV = this._segByGrpEleVal(SG1s, 'RFF', 101, 'IV');
        if (SG1RFFIV) {
            this._tDReqHeader.att('invoiceID', this._segVal(SG1RFFIV, 102));
            this._tDReqHeader.att('invoiceDate', this._fmtRFFTwoDTMs(SG1RFFIV, '3', '171'));
        }

        // RFF+OI
        let SG1RFFOI = this._segByGrpEleVal(SG1s, 'RFF', 101, 'OI');
        if (SG1RFFOI) {
            let SG1RFFOI_IDInfo = this._tDReqHeader.InvoiceIDInfo.ele('InvoiceIDInfo');
            SG1RFFOI_IDInfo.att('invoiceID', this._segVal(SG1RFFOI, 102));
            SG1RFFOI_IDInfo.att('invoiceDate', this._fmtRFFTwoDTMs(SG1RFFOI, '3', '171'));
        }

        // RFF+MA
        let SG1RFFMA = this._segByGrpEleVal(SG1s, 'RFF', 101, 'MA');
        if (SG1RFFMA) {
            let SG1RFFMA_IDInfo = this._tDReqHeader.ShipNoticeIDInfo.ele('ShipNoticeIDInfo');
            SG1RFFMA_IDInfo.att('shipNoticeID', this._segVal(SG1RFFMA, 102));
            SG1RFFMA_IDInfo.att('shipNoticeDate', this._fmtRFFTwoDTMs(SG1RFFMA, '111', '171'));
        }

        // RFF+DQ
        let SG1RFFDQ = this._segByGrpEleVal(SG1s, 'RFF', 101, 'DQ');
        if (SG1RFFDQ) {
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'DeliveryNoteNumber').txt(this._segVal(SG1RFFMA, 102));
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'shipNoticeDate')
                .txt(this._fmtRFFTwoDTMs(SG1RFFDQ, '124', '171'));
        }

        // RFF+CR
        let SG1RFFCR = this._segByGrpEleVal(SG1s, 'RFF', 101, 'CR');
        if (SG1RFFCR) {
            let eIDref = this._tDReqHeader.IdReference.ele(XML.IdReference);
            eIDref.att(XML.domain, 'customerReferenceID')
                .att(XML.identifier, this._segVal(SG1RFFCR, 102));

            eIDref = this._tDReqHeader.IdReference.ele(XML.IdReference); // new one
            eIDref.att(XML.domain, 'customerReferenceDate')
                .att(XML.identifier, this._fmtSegFollowingDTM(SG1RFFCR, '171'));
        }

        // RFF+ALO
        let tInvoiceDetailOrder = this._maptDetailOrders[this._currPO];
        let SG1RFFALO = this._segByGrpEleVal(SG1s, 'RFF', 101, 'ALO');
        if (SG1RFFALO) {
            // this._mapOrders[orderID]
            let rcptRef = tInvoiceDetailOrder.InvoiceDetailReceiptInfo.ele('InvoiceDetailReceiptInfo').ele('ReceiptReference');
            rcptRef.att('receiptID', this._segVal(SG1RFFALO, 102))
                .ele('DocumentReference').att(XML.payloadID, '');
            rcptRef.att('receiptDate', this._fmtSegFollowingDTM(SG1RFFALO, '171'));
        }

        // RFF+AGA
        let SG1RFFAGA = this._segByGrpEleVal(SG1s, 'RFF', 101, 'AGA');
        if (SG1RFFAGA) {
            this._tDReqHeader.PaymentProposalIDInfo.ele('PaymentProposalIDInfo')
                .att('paymentProposalID', this._segVal(SG1RFFAGA, 102));
        }

        // RFF+UC
        let SG1RFFUC = this._segByGrpEleVal(SG1s, 'RFF', 101, 'UC');
        if (SG1RFFUC) {
            this._tDReqHeader.Extrinsic.att('name', 'ultimateCustomerReferenceID')
                .txt(this._segVal(SG1RFFUC, 102))
        }

        // RFF+PK
        let SG1RFFPK = this._segByGrpEleVal(SG1s, 'RFF', 101, 'PK');
        if (SG1RFFPK) {
            let headerShipNoticeID = this._ele2(this._tDReqHeader.ShipNoticeIDInfo, 'ShipNoticeIDInfo');
            headerShipNoticeID.ele('IdReference').att(XML.domain, 'packListID')
                .att(XML.identifier, this._segVal(SG1RFFPK, 102));
        }

        // RFF+AEG
        let SG1RFFAEG = this._segByGrpEleVal(SG1s, 'RFF', 101, 'AEG');
        if (SG1RFFPK) {
            let toSystemIDIdentity = this._to.ele(XML.Credential).att(XML.domain, XML.SystemID)
                .ele(XML.Identity).txt(this._segVal(SG1RFFPK, 102));
        }

        // RFF ZZZ
        let allSG1RFFZZZ = this._segsByEleVal(SG1s, 'RFF', 101, 'ZZZ');
        for (let z of allSG1RFFZZZ) {
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', this._segVal(z, 102))
                .txt(this._segVal(z, 104));
        }

    }
    /**
     * ROOT_FTX
     * @param invoiceDetailRequestHeader 
     * @param hdExtrs 
     * @param XMLSummaryTax 
     */
    private _FTX(tSummaryTax: TidyTax) {
        // FTX AAI
        const { cmt: cmtAAI, lang: langAAI } = this._RFTXcmtLang('AAI');
        if (cmtAAI) {
            this._tDReqHeader.Comments.ele('Comments').att(XML.lang, langAAI)
                .txt(cmtAAI);
        }

        // FTX REG
        let FTXREG = this._rSegByEleVal('FTX', 1, 'REG');
        // TODO: <InvoicePartner><Contact @role="from"><Name>, Just map from here if NAD+FR C080/3036 empty
        let NADFRName = this._segVal(FTXREG, 401);

        let legalSTatus = this._segVal(FTXREG, 402);
        if (legalSTatus) {
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'LegalStatus')
                .txt(legalSTatus);
        }

        const { amt, cur } = this._parseAmtCur(this._segVal(FTXREG, 403));
        if (amt) {
            let XMLExtLegalMoney = this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'LegalCapital').ele('Money');

            XMLExtLegalMoney.txt(amt);
            XMLExtLegalMoney.att(XML.currency, cur);
        }

        // FTX TXD
        const { cmt: cmtTXD, lang: langTXD } = this._RFTXcmtLang('AAI');
        if (cmtTXD) {
            tSummaryTax.Description.ele(XML.Description).att(XML.lang, langTXD).txt(cmtTXD);
        }

        // FTX TXD with text function = 4
        // let FTXTXDv4 = this._rSegByEleVal2('FTX', 1, 'TXT', 2, '4');
        // TODO:
        // "Map to cXML [corresponding <TaxDetail>]
        // If SG6 or SG50 TAX C533/5289=""TT"", TAX 3346 matching 
        // SG1 RFF+VA C506/1153 and RFF C506/1156=""1"""

        // FTX ZZZ
        let allRFTXZZZ = this._rSegsByEleVal('FTX', 1, 'ZZZ') ?? [];
        for (let z of allRFTXZZZ) {
            const { cmt: cmtZZZ, name: extName } = this._FTXcmtLangZZZ(z);
            if (cmtZZZ) {
                this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', extName);
            }
        }
    }

    /**
     * ROOT_DTM
     */
    private _DTM() {

        // DTM Invoice Date
        let DTM3 = this._rSegByEleVal('DTM', 101, '3');
        let DTM137 = this._rSegByEleVal('DTM', 101, '137');
        if (DTM3) {
            let invoiceDate = this._segVal(DTM3, 102);
            let tmp = Utils.dateStrFromDTM2(invoiceDate, this._segVal(DTM3, 103));
            this._tDReqHeader.att('invoiceDate', tmp);
        }
        if (DTM137) {
            let invoiceDate = this._segVal(DTM137, 102);
            let tmp = Utils.dateStrFromDTM2(invoiceDate, this._segVal(DTM137, 103));
            this._tDReqHeader.att('invoiceDate', tmp);
        }

        // DTM Delivery Date
        let DTM35 = this._rSegByEleVal('DTM', 101, '35');
        if (DTM35) {
            let deliveryDate = Utils.dateStrFromDTM2
                (this._segVal(DTM35, 102), this._segVal(DTM35, 103));
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'deliveryDate').txt(deliveryDate);
        }

        // DTM Shipping Date
        let DTM110 = this._rSegByEleVal('DTM', 101, '110');
        if (DTM110) {
            let shippingDate = Utils.dateStrFromDTM2
                (this._segVal(DTM110, 102), this._segVal(DTM110, 103));
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', shippingDate);
        }

        let eHeaderPeriod: XMLBuilder;
        // DTM startDate       
        let DTM194 = this._rSegByEleVal('DTM', 101, '194');
        // DTM endDate
        let DTM206 = this._rSegByEleVal('DTM', 101, '206');
        // DTM start&end Date
        let DTM263 = this._rSegByEleVal('DTM', 101, '263');
        if (DTM194 || DTM206 || DTM263) {
            eHeaderPeriod = this._tDReqHeader.Period.ele('Period');
        }

        if (DTM194) {
            let startDate = Utils.dateStrFromDTM2
                (this._segVal(DTM194, 102), this._segVal(DTM194, 103));
            eHeaderPeriod.att('startDate', startDate);
        }

        if (DTM206) {
            let endDate = Utils.dateStrFromDTM2
                (this._segVal(DTM206, 102), this._segVal(DTM206, 103));
            eHeaderPeriod.att('endDate', endDate);
        }


        if (DTM263) {
            const { start, end } = Utils.dateStrFromDTM718
                (this._segVal(DTM263, 102), this._segVal(DTM263, 103));

            eHeaderPeriod.att('startDate', start);
            eHeaderPeriod.att('endDate', end);
        }

        // if (DTM194 || DTM206 || DTM263) {
        //     invoiceDetailRequestHeader.import(eHeaderPeriod);
        // }

    }


    /**
     * One Group of SG2, will ingore role related to Shipping
     * @param SG2 
     * @param hdIVPartner 
     */
    private _SG2NonShip(SG2: ASTNode) {
        let SG2NAD = this._dSeg1(SG2, 'NAD');
        let strEDIRole = this._segVal(SG2NAD, 1);

        if (MAPS.mapNADShipping[strEDIRole]) {
            // will be done by _SG2Shipping function
            return;
        }

        let invoicePartner = this._tDReqHeader.InvoicePartner.ele('InvoicePartner');
        let eContact = invoicePartner.ele('Contact');
        let tContact = new TidyContact();

        eContact.att('role', MAPS.mapNADPartner[strEDIRole]);
        eContact.att('addressID', this._segVal(SG2NAD, 201));
        eContact.att('addressIDDomain', MAPS.mapNADAgency[this._segVal(SG2NAD, 203)]);
        // xml:lang is hardcoded
        tContact.Name.ele('Name').txt(
            this._segVal(SG2NAD, 301)
            + this._segVal(SG2NAD, 302)
            + this._segVal(SG2NAD, 303)
            + this._segVal(SG2NAD, 304)
            + this._segVal(SG2NAD, 305)
        ).att(XML.lang, 'en');

        // DTD "Contact" : (Name,PostalAddress*,Email*,Phone*,Fax*,URL*,IdReference*,Extrinsic*)
        this._NADPostalAddr(tContact, SG2NAD);
        let SG5s = this._dGrps(SG2, 'SG5');
        for (let sg5 of SG5s) {
            this._xmlCommFromCTA(sg5, tContact, MAPS.mapNADPartner[strEDIRole]);
        }
        tContact.sendTo(eContact);

        // LOC, '89'
        let LOC89 = this._segByEleVal(SG2, 'LOC', 1, '89');
        if (LOC89) {
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'supplierCommercialCredentials')
                .txt(this._segVal(LOC89, 204));
        }

        let SG3RFFs = this._allSegs(SG2, 'ROOT_SG2_SG3_RFF');
        for (let sg3rff of SG3RFFs) {
            this._dupSG3(sg3rff, eContact);

            //[20170725][IG-1390] MB: IG-1274 addition! RFF+VA need a double mapping to provide header extrinsic
            // @name="supplierVatID" (NAD+FR) and "buyerVatID" (NAD+BT) in addition to IdReference "vatID" 
            // (based on ER IG-1274).
            let vRFF101 = this._segVal(sg3rff, 101);
            let vRFF102 = this._segVal(sg3rff, 102);
            let vNAD1 = this._segVal(SG2NAD, 1);
            if (vNAD1 == 'BT' && vRFF101 == 'VA') {
                this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'buyerVatID')
                    .txt(vRFF102);
            }
            if (vNAD1 == 'FR' && vRFF101 == 'VA') {
                this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'supplierVatID')
                    .txt(vRFF102);
            }
        }

        // Moved to above 
        // SG2_SG3 should map to both main contact and RB/I1 contacts
        // it's easy when there is not DTM under SG3 group
        // let SG3RFFs = this._allSegs(SG2, 'ROOT_SG2_SG3_RFF');
        // for (let sg3rff of SG3RFFs) {
        //     this._dupSG3(sg3rff, eContact, contactRB, contactI1);
        // }

        // SG5
        //If NAD/3035="BY" or "SO" and CTA/3139="BF" =>
        //create new /InvoicePartner/ @role="requester"
        if (strEDIRole == 'BY' || strEDIRole == 'SO ') {
            for (let sg5 of SG5s) {
                this._SG2SG5Add(this._tDReqHeader.InvoicePartner, sg5);
            }
        }



    }

    /**
     * Map for InvoiceDetailShipping
     * @param SG2 
     * @param invoiceDetailRequestHeader 
     * 
     * @returns 'ST' or 'SF' to indicate which role has been done
     */
    private _SG2Shipping(SG2: ASTNode, tInvoiceDetailShipping: TidyInvoiceDetailShipping): string {
        let SG2NAD = this._dSeg1(SG2, 'NAD');
        let strEDIRole = this._segVal(SG2NAD, 1);
        if (!MAPS.mapNADShipping[strEDIRole]) {
            // don't need to create shipping contact
            return '';
        }

        let eContact = tInvoiceDetailShipping.Contact.ele('Contact');
        let tContact = new TidyContact();


        eContact.att('role', MAPS.mapNADShipping[strEDIRole]);
        eContact.att('addressID', this._segVal(SG2NAD, 201));
        eContact.att('addressIDDomain', MAPS.mapNADAgency[this._segVal(SG2NAD, 203)]);
        tContact.Name.ele('Name').txt(
            this._segVal(SG2NAD, 301)
            + this._segVal(SG2NAD, 302)
            + this._segVal(SG2NAD, 303)
            + this._segVal(SG2NAD, 304)
            + this._segVal(SG2NAD, 305)
        ).att(XML.lang, 'en');
        this._NADPostalAddr(tContact, SG2NAD);

        // SG2_SG3 should map to both main contact and RB/I1 contacts
        let SG3s = this._dGrps(SG2, 'SG3');
        let SG5 = this._dGrp1(SG2, 'SG5');

        for (let sg3 of SG3s) {
            let segRFF = this._dSeg1(sg3, 'RFF');

            this._NAD_RFF(strEDIRole, segRFF, tContact, tInvoiceDetailShipping);

        } // end loop

        // CTA and COM
        this._xmlCommFromCTA(SG5, tContact, MAPS.mapNADPartner[strEDIRole]);

        tContact.sendTo(eContact);
        return strEDIRole;
    }

    private _NAD_RFF(strEDIRole: string, segRFF: EdiSegment, tContact: TidyContact, tInvoiceDetailShipping: TidyInvoiceDetailShipping) {
        let val101 = this._segVal(segRFF, 101);

        // "CA": "carrierCorporate",
        // "SF": "shipFrom",
        // "ST": "shipTo",

        if (val101 == 'CN') {
            if (strEDIRole == 'CA') {
                tInvoiceDetailShipping.CarrierIdentifier.ele('CarrierIdentifier').txt(this._segVal(segRFF, 102))
                    .att(XML.domain, this._segVal(segRFF, 104));
            } else {
                //  <!ATTLIST ShipmentIdentifier
                // domain                %string;              #IMPLIED
                // trackingNumberDate    %datetime.tz;         #IMPLIED
                // trackingURL           %URL;                 #IMPLIED>
                let shipIdent = tInvoiceDetailShipping.ShipmentIdentifier.ele('ShipmentIdentifier').txt(this._segVal(segRFF, 102))
                    .att(XML.domain, this._segVal(segRFF, 104));

                // get Parent Group , then get the DTM;
                let segDTM = this._segByEleVal(segRFF.astNode.parentNode, 'DTM', 101, '89');
                if (segDTM) {
                    shipIdent.att('trackingNumberDate', Utils.dateStrFromDTM2(
                        this._segVal(segDTM, 102), this._segVal(segDTM, 103)));
                }
            }
        } else {
            tContact.IdReference.ele(XML.IdReference).att(XML.domain, MAPS.mapIDRef[val101])
                .att(XML.identifier, this._segVal(segRFF, 101));
        }
    }
        

    /**
     * for SG2_SG5
     * If NAD/3035="BY" or "SO" and CTA/3139="BF" =>
     * create new /InvoicePartner/ @role="requester"
     * 
     * @param contact 
     * @param SG5 
     */
    private _SG2SG5Add(requestHeader: XMLBuilder, SG5: ASTNode) {
        let CTA_BF = this._segByEleVal(SG5, 'CTA', 1, 'BF'); // usually first child of SG5
        if (!CTA_BF) {
            return;
        }

        let c = requestHeader.ele('InvoicePartner').ele(XML.Contact).att(XML.role, 'requester');
        let tContact = new TidyContact();
        this._xmlCommFromCTA(SG5, tContact, 'requester');
        tContact.sendTo(c);
    }



    /**
     * Set for all these XML Nodes, for SG2_SG3
     * including InvoicePartner and respective Child Contact
     * 
     * @param mainContact 
     * @param sub1 
     * @param sub2 
     */
    private _dupSG3(segRFF: EdiSegment, mainContact: XMLBuilder, sub1?: XMLBuilder, sub2?: XMLBuilder) {
        let arrContacts: XMLBuilder[] = [];
        let arrInvoicePartners: XMLBuilder[] = [];
        if (mainContact) {
            arrContacts.push(mainContact);
            arrInvoicePartners.push(mainContact.up());
        }
        if (sub1) {
            arrContacts.push(sub1);
            arrInvoicePartners.push(sub1.up());
        }
        if (sub2) {
            arrContacts.push(sub2);
            arrInvoicePartners.push(sub2.up());
        }

        // for all the contacts
        for (let c of arrContacts) {
            let qualifier = this._segVal(segRFF, 101);
            if (!qualifier) {
                continue;
            }
            if (qualifier == 'AHR') {
                c.ele(XML.IdReference).att(XML.domain, 'taxID')
                    .att(XML.identifier, this._segVal(segRFF, 102));
            } else if (qualifier == 'ALT') {
                c.ele(XML.IdReference).att(XML.domain, 'gstID')
                    .att(XML.identifier, this._segVal(segRFF, 102));
            } else {
                // don't do anything for Contact Tag
                // c.ele(XML.IdReference).att(XML.domain, qualifier)
                //     .att(XML.identifier, this._segVal(segRFF, 102))
            }
        }

        // Invoice Partner
        for (let c of arrInvoicePartners) {
            let qualifier = this._segVal(segRFF, 101);
            if (!qualifier || (qualifier == 'AHR') || qualifier == 'ALT' || !MAPS.mapIDRef[qualifier]) {
                continue;
            }

            c.ele(XML.IdReference).att(XML.identifier, this._segVal(segRFF, 102))
                .att(XML.domain, MAPS.mapIDRef[qualifier]);
        }
    }


    /**
     * Created addtional Contact from FII (RB or I1)
     * @param requestHeader 
     * @param strRole 
     * @param FIIs 
     * @returns 
     */
    private _FII(strRole: string, FIIs: EdiSegment[]): XMLBuilder {
        if (!FIIs || FIIs.length == 0) {
            return;
        }

        let IVPartner = this._tDReqHeader.InvoicePartner.ele('InvoicePartner');
        let eContactFII = IVPartner.ele('Contact').att(XML.role, strRole);
        let tContactFII = new TidyContact();
        let accountName;
        let accountType;
        let branchName;
        let bankCountryCode;

        let xmlName = tContactFII.Name.ele('Name'); // make sure it's first child
        for (let F of FIIs) {

            // Account holder number
            let val3055 = this._segVal(F, 303);
            if (val3055 == '17' || val3055 == '5') {
                IVPartner.ele(XML.IdReference).att(XML.identifier, this._segVal(F, 201))
                    .att(XML.domain, 'ibanID');
            };

            if (val3055 == '131') {
                IVPartner.ele(XML.IdReference).att(XML.identifier, this._segVal(F, 201))
                    .att(XML.domain, 'accountID');
            }

            // Account holder name, try get value in every loop until get one
            if (!accountName) {
                // there is possibility it's empty
                // we'll wait for FII
                accountName = this._segVal(F, 202);
                if (accountName) {
                    IVPartner.ele(XML.IdReference).att(XML.identifier, accountName)
                        .att(XML.domain, 'accountName');
                }
            }
            // Account holder type, try get value in every loop until get one
            if (!accountType) {
                // there is possibility it's empty
                // we'll wait for FII
                accountType = this._segVal(F, 203);
                if (accountType) {
                    IVPartner.ele(XML.IdReference).att(XML.identifier, accountType)
                        .att(XML.domain, 'accountType');
                }
            }

            // Institution name identification
            if (val3055 == '17' || val3055 == '5') {
                IVPartner.ele(XML.IdReference).att(XML.identifier, this._segVal(F, 301))
                    .att(XML.domain, 'swiftID');
            };

            if (val3055 == '131') {
                IVPartner.ele(XML.IdReference).att(XML.identifier, this._segVal(F, 301))
                    .att(XML.domain, 'bankCode');
            }

            // Institution name, try get value in every loop until get one
            if (!branchName) {
                // there is possibility it's empty
                // we'll wait for FII
                branchName = this._segVal(F, 307);
                if (branchName) {
                    xmlName.att(XML.lang, 'en-US').txt(branchName);
                    IVPartner.ele(XML.IdReference).att(XML.identifier, branchName)
                        .att(XML.domain, 'branchName');
                }
            }
            // Bank Country, coded, try get value in every loop until get one
            if (!bankCountryCode) {
                // there is possibility it's empty
                // we'll wait for FII
                bankCountryCode = this._segVal(F, 4);
                if (bankCountryCode) {
                    IVPartner.ele(XML.IdReference).att(XML.identifier, bankCountryCode)
                        .att(XML.domain, 'bankCountryCode');
                }
            }

        } // end loop
        tContactFII.sendTo(eContactFII);
        return eContactFII;
        // [Do not override from second FII or duplicate IdReference].

    }
    /**
     * RFF+ON and the DTM
     * @param SG1s 
     * @param bNONPO 
     * @param invoiceDetailOrderInfo1 
     * @param invoiceDetailRequestHeader 
     */
    private _SG1ON(SG1s: ASTNode[]) {

        let SG1RFFON = this._segByGrpEleVal(SG1s, 'RFF', 101, 'ON');
        if (!SG1RFFON) {
            return;
        }

        this._currPO = this._segVal(SG1RFFON, 102);
        this._currPO = (this._currPO == '' ? 'SG1RFF_NON_PO' : this._currPO);

        // ONLY for SG1, this will be PO in header, distinguish LIN/PO in SG25
        let tInvoiceDetailOrder = new TidyInvoiceDetailOrder();
        this._maptDetailOrders[this._currPO] = tInvoiceDetailOrder;

        let invoiceDetailOrderInfo1: XMLBuilder = this._ele2(tInvoiceDetailOrder.InvoiceDetailOrderInfo, 'InvoiceDetailOrderInfo');

        let parentSG1RFFON = SG1RFFON.astNode.parentNode;
        let SG1DTMON4 = this._segByEleVal(parentSG1RFFON, 'DTM', 101, '4');
        let SG1DTMON171 = this._segByEleVal(parentSG1RFFON, 'DTM', 101, '171');
        let SG1orderDate = this._fmtTwoDTMs(SG1DTMON4, SG1DTMON171);

        if (!this._bNONPO && SG1RFFON) {
            // Normal PO

            let ordRef = invoiceDetailOrderInfo1.ele('OrderReference')
                .att('orderID', this._currPO);
            ordRef.ele('DocumentReference').att(XML.payloadID, '');
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).
                att('name', 'invoiceSourceDocument').txt('PurchaseOrder');
            if (SG1orderDate) {
                ordRef.att('orderDate', SG1orderDate);
            }

        }
        if (this._bNONPO && SG1RFFON) {
            // I don't use 'elseif' statement because it's only for SG1, not knowing SG25
            let IDInfo = invoiceDetailOrderInfo1.ele('OrderIDInfo')
                .att('orderID', this._currPO);
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).
                att('name', 'invoiceSourceDocument').txt('ExternalPurchaseOrder');
            if (SG1orderDate) {
                IDInfo.att('orderDate', SG1orderDate);
            }
        }
    }

    /**
     * RFF+CT and the DTM
     * @param SG1s 
     * @param bNONPO 
     * @param invoiceDetailOrderInfo1 
     * @param invoiceDetailRequestHeader 
     */
    private _SG1CT(SG1s: ASTNode[]) {
        let SG1RFFON = this._segByGrpEleVal(SG1s, 'RFF', 101, 'ON'); // we still need RFF+ON in this function
        let SG1RFFCT = this._segByGrpEleVal(SG1s, 'RFF', 101, 'CT');
        if (!SG1RFFCT) {
            return;
        }

        // ONLY for SG1, this will be PO in header, distinguish LIN/PO in SG25
        let tInvoiceDetailOrder = this._maptDetailOrders[this._currPO];
        let invoiceDetailOrderInfo1: XMLBuilder = this._ele2(tInvoiceDetailOrder.InvoiceDetailOrderInfo, 'InvoiceDetailOrderInfo');

        let parentSG1RFFCT = SG1RFFCT.astNode.parentNode;
        let SG1DTMON126 = this._segByEleVal(parentSG1RFFCT, 'DTM', 101, '126');
        let SG1DTMON171 = this._segByEleVal(parentSG1RFFCT, 'DTM', 101, '171');
        let SG1Date = this._fmtTwoDTMs(SG1DTMON126, SG1DTMON171);

        if (!this._bNONPO && SG1RFFCT) {
            // Normal PO
            let theRef = invoiceDetailOrderInfo1.ele('MasterAgreementReference')
                .att('agreementID', this._segVal(SG1RFFCT, 102));
            theRef.ele('DocumentReference').att(XML.payloadID, '');

            // <MasterAgreementReference @agreementType="scheduling_agreement">
            if (this._segVal(SG1RFFCT, 103) == '1') {
                theRef.att('agreementType', 'scheduling_agreement');
            }
            theRef.att('agreementDate', SG1Date);
            // headerExtrincs.ele(XML.Extrinsic).
            //     att('name', 'invoiceSourceDocument').txt('PurchaseOrder');
        }

        if (this._bNONPO && SG1RFFCT) {
            // I don't use 'elseif' statement because it's only for SG1, not knowing SG25
            let IDInfo = invoiceDetailOrderInfo1.ele('MasterAgreementIDInfo')
                .att('agreementID', this._segVal(SG1RFFCT, 102));
            if (this._segVal(SG1RFFCT, 103) == '1') {
                IDInfo.att('agreementType', 'scheduling_agreement');
            }
            IDInfo.att('agreementDate', SG1Date);
        }

        if (!SG1RFFON) {
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).
                att('name', 'invoiceSourceDocument').txt('Contract');
        }
    }

    /**
     * RFF+VN and the DTM
     * @param SG1s 
     * @param bNONPO 
     * @param invoiceDetailOrderInfo1 
     * @param invoiceDetailRequestHeader 
     */
    private _SG1VN(SG1s: ASTNode[]) {
        let SG1RFFON = this._segByGrpEleVal(SG1s, 'RFF', 101, 'ON'); // we still need RFF+ON in this function
        let SG1RFFCT = this._segByGrpEleVal(SG1s, 'RFF', 101, 'CT');
        let SG1RFFVN = this._segByGrpEleVal(SG1s, 'RFF', 101, 'VN');
        if (!SG1RFFVN) {
            return;
        }

        // ONLY for SG1, this will be PO in header, distinguish LIN/PO in SG25
        let tInvoiceDetailOrder = this._maptDetailOrders[this._currPO];
        let invoiceDetailOrderInfo1: XMLBuilder = this._ele2(tInvoiceDetailOrder.InvoiceDetailOrderInfo, 'InvoiceDetailOrderInfo');

        let parentSG1RFF = SG1RFFVN.astNode.parentNode;
        let SG1DTM01 = this._segByEleVal(parentSG1RFF, 'DTM', 101, '4');
        let SG1DTM02 = this._segByEleVal(parentSG1RFF, 'DTM', 101, '171');
        let SG1Date = this._fmtTwoDTMs(SG1DTM01, SG1DTM02);

        let theRef = invoiceDetailOrderInfo1.ele('SupplierOrderInfo')
            .att('orderID', this._segVal(SG1RFFVN, 102));
        theRef.att('orderDate', SG1Date)

        // [If RFF+ON and RFF+CT not provided - hardcode extrinsic value] 
        if (!SG1RFFON && !SG1RFFCT) {
            this._tDReqHeader.Extrinsic.ele(XML.Extrinsic).
                att('name', 'invoiceSourceDocument').txt('SalesOrder');
        }
    }

    /**
     * Format from two EdiSegments
     * @param dtm1 
     * @param dtm2 
     * @returns 
     */
    private _fmtTwoDTMs(dtm1: EdiSegment, dtm2: EdiSegment) {
        if (!dtm1 && !dtm2) {
            return '';
        }
        let dtm: EdiSegment = dtm1 ? dtm1 : dtm2;
        let datVal = this._segVal(dtm, 102);
        return Utils.dateStrFromDTM2(datVal, this._segVal(dtm, 103));
    }

    /**
     * From RFF segment, get the sub DTMs to find the correct date
     * @param dtm1 
     * @param dtm2 
     * @returns 
     */
    private _fmtRFFTwoDTMs(theRFF: EdiSegment, idx101Val1: string, idx101Val2: string) {
        if (!theRFF) {
            return '';
        }
        let parentSG1RFF = theRFF.astNode.parentNode;
        let dtm1 = this._segByEleVal(parentSG1RFF, 'DTM', 101, idx101Val1);
        let dtm2 = this._segByEleVal(parentSG1RFF, 'DTM', 101, idx101Val2);
        return this._fmtTwoDTMs(dtm1, dtm2);
    }

    /**
     * Get DTM XML date string following 'theSeg' with idx101Val
     * @param dtm1 
     * @param dtm2 
     * @returns 
     */
    private _fmtSegFollowingDTM(theSeg: EdiSegment, idx101Val: string) {
        let parentSG1RFF = theSeg.astNode.parentNode;
        let dtm = this._segByEleVal(parentSG1RFF, 'DTM', 101, idx101Val);
        return Utils.dateStrFromDTM2(this._segVal(dtm, 102), this._segVal(dtm, 103));
    }

    /**
     * 
     * get NONPO flag from RFF segments
     * @returns 
     * 
     */
    private _getNONPO(SG1s: ASTNode[]): boolean {
        for (let g of SG1s) {
            let r = this._dSeg1(g, 'RFF');
            if (this._segVal(r, 101) == 'IL' && this._segVal(r, 102) == 'NONPO') {
                this._bNONPO = true;
                break;
            }
        }
        return this._bNONPO;
    }
}


class MAPS {
    static mapBGMDocName: Object = {
        "80": "lineLevelDebitMemo",
        "81": "lineLevelCreditMemo",
        "380": "standard",
        "381": "creditMemo",
        "383": "debitMemo",
        "385": "standard",
    };
    static mapPAI: Object = {
        "2": "ach",
        "3": "ach",
        "10": "cash",
        "20": "check",
        "21": "draft",
        "30": "creditTransfer",
        "31": "debitTransfer",
        "42": "wire",
        "60": "promissoryNote",
        "70": "creditorOnTheDebitor",
    }
    static mapNADPartner: Object = {
        "AM": "administrator",
        "AT": "technicalSupport",
        "BI": "buyerMasterAccount",
        "BT": "billTo",
        "BY": "buyer",
        "CO": "corporateOffice",
        "DP": "deliveryParty",
        "DO": "correspondent",
        "FD": "buyerCorporate",
        "FR": "from",
        "II": "issuerOfInvoice",
        "IV ": "buyer",
        "LP": "consignmentOrigin",
        "OB": "endUser",
        "PD": "purchasingAgent",
        "PK": "taxRepresentative",
        "PO": "buyerAccount",
        "RE": "remitTo",
        "RF": "billFrom",
        "RH": "supplierMasterAccount",
        "SB": "sales",
        "SE": "supplierAccount",
        "SO": "soldTo",
        "SR": "customerService",
        "SU": "supplierCorporate",
        "UD": "subsequentBuyer",
        "UP": "consignmentDestination",
        "ZZZ": "(role unspecified)",
    }
    static mapNADShipping: Object = {
        "CA": "carrierCorporate",
        "SF": "shipFrom",
        "ST": "shipTo",
    }

    static mapNADAgency: Object = {
        "3": "IATA",
        "9": "EANID",
        "12": "UIC",
        "16": "DUNS",
        "91": "Not Mapped",
        "92": "Not Mapped",
        "182": "SCAC",
    }

    static mapIDRef: Object = {
        "ACD": "reference",
        "ACK": "abaRoutingNumber",
        "AGU": "memberNumber",
        "AHL": "creditorRefID",
        "AHP": "supplierTaxID",
        "AIH": "transactionReference",
        "AP": "accountReceivableID",
        "AV": "accountPayableID",
        "FC": "fiscalNumber",
        "GN": "governmentNumber",
        "IA": "vendorNumber",
        "IT": "companyCode",
        "PY": "accountID",
        "RT": "bankRoutingID",
        "SA": "contactPerson",
        "SD": "departmentName",
        "TL": "taxExemptionID",
        "VA": "vatID",
    }

    static mapTAXFreeType: Object = {
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
        "IND": "withholdingTax",
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

    static mapTOD: Object = {
        "CFR": "Cost & Freight",
        "CIF": "Cost, Insurance, Freight to maned destination",
        "CIP": "Freight, Carriage, Insurance to destination",
        "CPT": "Freight, Carriage paid to destination ",
        "DAF": "Delivery at frontier - Named place",
        "DDP": "Delivered duty paid to destination ",
        "DEQ": "Delivered Ex Quay - Duty paid, Named port",
        "DES": "Delivered Ex Ship - Named port of destination",
        "EXW": "EX Works ",
        "FAS": "Free alongside ship ",
        "FCA": "Free carrier - Named point ",
        "FOA": "FOB Airport - Named airport of departure",
        "FOB": "Free on Board - Namedport of shipment",
        "FOR": "Free on Rail - Named departure point",
    }

    static mapALCSpecServ: Object = {
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
        //"ZZZ": "pick the @name value from ALC C214_7160_2",
    }
    static mapALCSettle: Object = {
        "1": "billBack",
        "2": "offInvoice",
        "3": "vendorCheck",
        "4": "creditCustomer",
        "5": "paidByVendor",
        "6": "paidByCustomer",
        "13": "borneByPayee",
        "14": "eachPayOwnCost",
        "15": "borneByPayor",
    }
} // end class MAP
