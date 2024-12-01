import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_810 } from "../../info/info_810";
import { ConvertPattern, X12, XML, versionKeys } from "../../cat_const";
import { create } from "xmlbuilder2";
import { format } from "date-fns";
import { CUtilX12 } from "../../utils/cUtilX12";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { ConvertErr, EdiSegment } from "../../new_parser/entities";
import { ConverterBase } from "../converterBase";
import { ASTNode } from "../../new_parser/syntaxParserBase";
import utils from "../../utils/utils";
import { TidyConfirmationHeader, TidyConfirmationItem, TidyConfirmationRequest, TidyConfirmationStatus, TidyItemDetail, TidyItemIn } from "../xmlTidy/OrderConfirm";
import { TidyContact, TidyItemID, TidyTax, TidyTaxDetail } from "../xmlTidy/TidyCommon";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class Cvt_855_OrderConfirm extends ConverterBase {
    protected _convertErrs: ConvertErr[];
    constructor(astTree: ASTNode) {
        super(astTree);
    }


    public toXMLCheck(document?: vscode.TextDocument): vscode.Diagnostic[] {
        this._document = document;
        this._clearDiags(); // clear previouse check results

        this._chkUsageIndicator();
        return this._cvtDiags;
    }

    public toXML(): string {
        this.toXMLCheck();
        if (this._hasConvertErr()) {
            return this._renderConvertErr();
        }

        const cxml = create({ encoding: "utf-8" }).ele('cXML').dtd({
            sysID: 'http://xml.cxml.org/schemas/cXML/1.2.060/Fulfill.dtd'
        });

        // header supplier2buyer
        this._header_supplier_to_buyer(cxml);

        let request = cxml.ele(XML.Request);
        let tConfirmationReq = new TidyConfirmationRequest();
        //let tConfirmationHeader = confirmationRequest.ele('ConfirmationHeader');
        let tConfirmH = new TidyConfirmationHeader();
        let usageIndicator = this._segVal("ISA", 15);
        request.att(XML.deploymentMode, CUtilX12.usageIndicatorXML(usageIndicator));

        let BAK = this._rseg("BAK");
        let BAK01 = this._segVal(BAK, 1);
        let BAK02 = this._segVal(BAK, 2);
        switch (BAK01) {
            case "00":
                tConfirmH.att('operation', 'new');
                break;
            case "05":
                tConfirmH.att('operation', 'update');
                break;
            default:
            // wrong @operation
        }

        switch (BAK02) {
            case "AC":
                tConfirmH.att('type', 'detail');
                break;
            case "AE":
                tConfirmH.att('type', 'except');
                break;
            case "AT":
                tConfirmH.att('type', 'accept');
                break;
            case "RJ":
                tConfirmH.att('type', 'reject');
                break;
            default:
            // wrong @type
        }

        let eOrdRef = tConfirmationReq.OrderReference.ele('OrderReference');

        // BAK04 is ignored - @orderDate is mapped from DTM*004 - only  
        // if DTM*004 is provided with date, time and time zone
        let BAK04 = this._segVal(BAK, 4);
        let DTM004 = this._rSegByEleVal('DTM', 1, '004');
        if (DTM004) {
            let vDate = Utils.dateStrFromDTM(
                this._segVal(DTM004, 2)
                , this._segVal(DTM004, 3)
                , this._segVal(DTM004, 4)
            );
            if (vDate) {
                eOrdRef.att('orderDate', vDate);
            }
        } else {
            // recent MapSpec removed below:
            // let vDate = Utils.dateStrFromCCYYMMDD(BAK04);
            // if (vDate) {
            //     eOrdRef.att('orderDate', vDate);
            // }
        }
        eOrdRef.att('orderID', this._segVal(BAK, 3));

        // Dummy payloadID for X12
        eOrdRef.ele('DocumentReference').att(XML.payloadID, '');

        // BAK08, @confirmID
        tConfirmH.att('confirmID', this._segVal(BAK, 8))

        // BAK09, @noticeDate, not mapped if DTM*ACK is provided
        let BAK09 = this._segVal(BAK, 9);
        let DTMACK = this._rSegByEleVal('DTM', 1, 'ACK');
        if (DTMACK) {
            tConfirmH.att('noticeDate', Utils.dateStrFromDTM2(
                this._segVal(DTMACK, 2)
                + this._segVal(DTMACK, 3)
                + this._segVal(DTMACK, 4)
            ));
        } else {
            tConfirmH.att('noticeDate', Utils.dateStrFromDTM2(BAK09));
        }

        // CUR
        let CUR = this._rSegByEleVal('CUR', 1, 'BY');
        if (CUR) {
            tConfirmH.Total.ele('Total').ele(XML.Money).att(XML.currency, this._segVal(CUR, 2));
        }

        // REF
        let REFs = this._rSegs('REF');
        REFs = REFs ?? [];
        for (let REF of REFs) {
            let vREF1 = this._segVal(REF, 1);
            let vREF2 = this._segVal(REF, 2);
            switch (vREF1) {
                case 'IV':
                    tConfirmH.att('invoiceID', vREF2);
                    break;
                case 'ON':
                    // tConfirmationHeader.att('orderID', vREF2);
                    break;
                case 'CR':
                    tConfirmH.IdReference.ele(XML.IdReference).att(XML.domain, 'CustomerReferenceID')
                        .att(XML.identifier, vREF2);
                    break;
                case 'ZB':
                    tConfirmH.IdReference.ele(XML.IdReference).att(XML.domain, 'UltimateCustomerReferenceID')
                        .att(XML.identifier, vREF2);
                    break;
                case 'D2':
                    tConfirmH.IdReference.ele(XML.IdReference).att(XML.domain, 'supplierReference')
                        .att(XML.identifier, vREF2);
                    break;
                case 'ZZ':
                    tConfirmH.IdReference.ele(XML.Extrinsic).att('name', vREF2).txt(this._segVal(REF, 3));
                    break;
                default:
                    if (MAPS.mapREF128[vREF1]) {
                        tConfirmH.IdReference.ele(XML.Extrinsic).att('name', MAPS.mapREF128[vREF1]).txt(vREF2 + this._segVal(REF, 3));
                    }

            } // end switch vREF1
        } // end loop REFs

        // FOB
        let FOB = this._rSegByEleVal('FOB', 1, 'DE');
        if (FOB) {
            let vFOB4 = this._segVal(FOB, 4);
            let vFOB5 = this._segVal(FOB, 5);
            if (vFOB4 == '01') {
                tConfirmH.att('incoTerms', MAPS.mapFOB335[vFOB5]);
            }
        }

        // SAC Group
        let grpSACs = this._rGrps('SAC');
        grpSACs = grpSACs ?? [];
        for (let grpSAC of grpSACs) {
            this._grpSAC_Header(grpSAC, tConfirmH);
        }

        // DTM
        let DTMs = this._rSegs('DTM');
        DTMs = DTMs ?? [];
        for (let DTM of DTMs) {
            let vDTM1 = this._segVal(DTM, 1);
            let vDTM2 = this._segVal(DTM, 2);
            let vDTM3 = this._segVal(DTM, 3);
            let vDTM4 = this._segVal(DTM, 4);
            if (vDTM1 == '004') {
                eOrdRef.att('orderDate', Utils.dateStrFromDTM(vDTM2, vDTM3, vDTM4));
            } else if (vDTM1 == 'ACK') {
                tConfirmH.att('noticeDate', Utils.dateStrFromDTM2(vDTM2 + vDTM3+vDTM4));
            }
        }

        // TXI
        let TXI = this._rSegByEleVal('TXI', 4, 'VD');
        if (TXI) {
            let vTXI_1 = this._segVal(TXI, 1);

            let eTaxD = tConfirmH.Tax.ele('Tax').ele('TaxDetail');
            eTaxD.att('category', MAPS.mapTXI963Category[vTXI_1])
                .ele(XML.Description).txt(MAPS.mapTXI963Desc[vTXI_1])
                .att('purpose', 'tax');
            eTaxD.ele('TaxAmount').ele(XML.Money).txt(this._segVal(TXI, 2));
            eTaxD.att('percentageRate', this._segVal(TXI, 3));
            eTaxD.ele('TaxLocation').txt(this._segVal(TXI, 5));
            eTaxD.att('exemptDetail', this._segVal(TXI, 6));
            eTaxD.ele('TaxableAmount').ele(XML.Money).txt(this._segVal(TXI, 8));
        }

        // N9 Group
        let grpN9s = this._rGrps('N9');
        grpN9s = grpN9s ?? [];
        for (let gN9 of grpN9s) {
            this._dealHeaderGrpN9(gN9, tConfirmH);

        }

        // N1 Group
        let grpN1s = this._rGrps('N1');
        for (let grpN1 of grpN1s) {
            this._fillHeaderN1Grp(grpN1, tConfirmH);
        }

        // Details
        // PO1
        let grpPO1s = this._rGrps('PO1');
        for (let gPO1 of grpPO1s) {
            let PO1 = this._dSeg1(gPO1, 'PO1');
            let tItem = new TidyConfirmationItem();
            let tStatusLineItem = new TidyConfirmationStatus(); // contain line item level info

            let tItemIn = new TidyItemIn();
            let vLineNumber = this._segVal(PO1, 1);
            tItem.att('lineNumber', vLineNumber);
            tItemIn.att('lineNumber', vLineNumber);
            let vQTYItemLine = this._segVal(PO1, 2);
            tItem.att(XML.quantity, vQTYItemLine);
            let vUOM_LineItem = this._segVal(PO1, 3);
            let vUOM_Mapped_LineItem = this._mcs(MAPS.mapUOM355, vUOM_LineItem);
            tItem.UnitOfMeasure.ele('UnitOfMeasure').txt(vUOM_Mapped_LineItem);
            // CUR
            let CUR = this._dSeg1(gPO1, 'CUR');
            let eUnitPrice = tStatusLineItem.UnitPrice.ele('UnitPrice');
            let tItemDetail = new TidyItemDetail();
            let eUnitPriceItemIn = tItemDetail.UnitPrice.ele('UnitPrice');
            let sCur = 'USD';
            if (CUR) {
                // TODO, maybe MapSpec is incorrect
                let vCUR02 = this._segVal(CUR, 2);
                if (vCUR02) {
                    sCur = vCUR02;
                }
            }
            // CTP AS
            let CTP_AS = this._segByEleVal(gPO1, 'CTP', 1, 'AS');
            if (CTP_AS) {
                let vCTP02 = this._segVal(CTP_AS, 2);
                let vCTP03 = this._segVal(CTP_AS, 3);
                if (vCTP02 == 'CHG') {
                    // so if 'CHG', we don't need to specify ItemIn for whole EDI ?
                    this._ele2(eUnitPrice, XML.Money).txt(vCTP03).att(XML.currency, sCur);
                } else if (vCTP02 == 'CUP') {
                    this._ele2(eUnitPriceItemIn, XML.Money).txt(vCTP03).att(XML.currency, sCur);
                }
            }
            if (this._isXmlEmpty(eUnitPrice)) {
                this._rmv(eUnitPrice);
            }
            // CTP WS
            let CTP_WS = this._segByEleVal(gPO1, 'CTP', 1, 'WS');
            if (CTP_WS) {
                let vCTP04 = this._segVal(CTP_WS, 4);
                let vCTP501 = this._segVal(CTP_WS, 501); // UOM
                let ePriceBasisQuantity = this._ele2(tItemDetail.PriceBasisQuantity, 'PriceBasisQuantity');
                ePriceBasisQuantity.att(XML.quantity, vCTP04);
                ePriceBasisQuantity.ele(XML.UnitOfMeasure).txt(vCTP501);
                ePriceBasisQuantity.att('conversionFactor', this._segVal(CTP_WS, 7));
            }
            // MEA
            let MEAs = this._dSegs(gPO1, 'MEA');
            for (let MEA of MEAs) {
                let eDim = tItemDetail.Dimension.ele(XML.Dimension);
                let vType = this._segVal(MEA, 2);
                eDim.att(XML.type, this._mcs(MAPS.mapMEA738, vType));
                eDim.att(XML.quantity, this._segVal(MEA, 3));
                eDim.ele(XML.UnitOfMeasure).txt(this._segVal(MEA, 401));
            }
            // PID
            let gPIDs = this._dGrps(gPO1, 'PID');
            for (let gPID of gPIDs) {
                let PID = this._dSeg1(gPID, 'PID');
                let v2 = this._segVal(PID, 2);
                let eDesc = this._ele2(tItemDetail.Description, XML.Description);
                if (v2 == '') {
                    eDesc.txt(this._segVal(PID, 5));
                    eDesc.att(XML.lang, this._segVal(PID, 9))
                } else if (v2 == 'GEN') {
                    this._ele2(eDesc, XML.ShortName).txt(this._segVal(PID, 5));
                }
            }
            // REF FL
            let REF_FL = this._segByEleVal(gPO1, 'REF', 1, 'FL');
            if (REF_FL) {
                tItem.att(XML.parentLineNumber, this._segVal(REF_FL, 2))
                tItem.att('itemType', this._segVal(REF_FL, 3))
            }
            // REF all others
            let REFs = this._dSegs(gPO1, 'REF');
            for (let REF of REFs) {
                let v1 = this._segVal(REF, 1);
                if (['FL'].includes(v1)) {
                    continue;
                }
                if (this._mes(MAPS.mapREF128, v1)) {
                    tStatusLineItem.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, this._mcs(MAPS.mapREF128, v1))
                        .txt(this._segVal(REF, 2) + this._segVal(REF, 3));
                } else if (v1 == 'ZZ') {
                    // v1 == 'ZZ'
                    tStatusLineItem.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, this._segVal(REF, 2))
                        .txt(this._segVal(REF, 3));
                }
            }

            let gSACs = this._dGrps(gPO1, 'SAC');
            for (let gSAC of gSACs) {
                this._grpSAC_ItemIn(gSAC, tItemIn, tItemDetail);
            }

            // Status
            // ACK
            let gACKs = this._dGrps(gPO1, 'ACK');
            let arrTStatus: TidyConfirmationStatus[] = [];
            let bItemIDDone = false; // Line Item Level flag
            let mapSchedule: {
                [key: string]: TidyConfirmationStatus;
            } = {};
            let bACK_IC_exist = false;
            let iQTY_ACK_Accum: number = 0;
            for (let gACK of gACKs) {
                let tStauts = new TidyConfirmationStatus();
                arrTStatus.push(tStauts);
                let ACK = this._dSeg1(gACK, 'ACK');
                let v1 = this._segVal(ACK, 1);
                let v2 = this._segVal(ACK, 2);
                let v3 = this._segVal(ACK, 3);
                let v5 = this._segVal(ACK, 5); // shipmentDate
                let v6 = this._segVal(ACK, 6); // Match Scheduleline
                if (v6) {
                    mapSchedule[v6] = tStauts;
                }
                let v1Mapped;
                switch (v1) {
                    case 'IA':
                        v1Mapped = 'accept';
                        break;
                    case 'IB':
                        v1Mapped = 'backordered';
                        break;
                    case 'IC':
                        v1Mapped = 'detail';
                        bACK_IC_exist = true;
                        break;
                    case 'IR':
                        v1Mapped = 'reject';
                        break;
                    default:
                    // do nothing
                }
                tStauts.att(XML.type, v1Mapped);
                tStauts.att(XML.quantity, v2);
                iQTY_ACK_Accum += this._float(v2);
                tItemIn.att(XML.quantity, v2);
                let vUOM = this._mcs(MAPS.mapUOM355, v3);
                tStauts.UnitOfMeasure.ele(XML.UnitOfMeasure).txt(vUOM);

                // Map only if ACK01="IA", "IC" or "IB". Do not map if  "reject"
                if (v1 != 'IR') {
                    let strDate = Utils.dateStrFromDTM2(v5, '102');
                    if (strDate) {
                        tStauts.att('shipmentDate', strDate);
                    }
                }

                if (!bItemIDDone) {
                    this._ele2(tItemDetail.UnitOfMeasure, XML.UnitOfMeasure).txt(vUOM);
                    let tItemID = new TidyItemID();
                    let eItemID = this._ele2(tItemIn.ItemID, 'ItemID');
                    this._ACK_ITEM_ID(ACK, tItemID, tItemDetail, tStauts);
                    tItemID.sendTo(eItemID);
                    bItemIDDone = true;
                }

                let DTM = this._segByEleVal(gACK, 'DTM', 1, '017');
                if (v1 != 'IR') {
                    tStauts.att('deliveryDate', Utils.dateStrFromDTM(this._segVal(DTM, 2),
                        this._segVal(DTM, 3), this._segVal(DTM, 4)));
                }


            } // end loop gACKs
            tItemDetail.sendTo(tItemIn.ItemDetail.ele('ItemDetail'));

            // Status Unknown
            let iQTY_unknown = this._float(vQTYItemLine) - iQTY_ACK_Accum;
            let tStauts = new TidyConfirmationStatus();
            arrTStatus.push(tStauts);
            tStauts.att(XML.type, 'unknown');
            tStauts.att(XML.quantity, iQTY_unknown.toString());
            tStauts.UnitOfMeasure.ele(XML.UnitOfMeasure).txt(vUOM_Mapped_LineItem);

            // TXI
            let TXIs = this._dSegs(gPO1, 'TXI');
            let arrTaxDetail: TidyTaxDetail[] = [];
            for (let TXI of TXIs) {
                let tTaxDetail = new TidyTaxDetail();
                tTaxDetail.att('purpose', 'tax');
                arrTaxDetail.push(tTaxDetail);
                let vCategory = this._segVal(TXI, 1);
                tTaxDetail.att(XML.category, this._mcs(MAPS.mapTXI963Category, vCategory)).Description
                    .ele(XML.Description).txt(this._mcs(MAPS.mapTXI963Desc, vCategory));

                tTaxDetail.TaxAmount.ele('TaxAmount').ele(XML.Money).txt(this._segVal(TXI, 2));
                tTaxDetail.att('percentageRate', this._segVal(TXI, 3));
                tTaxDetail.TaxLocation.ele('TaxLocation').txt(this._segVal(TXI, 5));
                tTaxDetail.att('exemptDetail', this._segVal(TXI, 6));
                tTaxDetail.TaxableAmount.ele('TaxableAmount').ele(XML.Money).txt(this._segVal(TXI, 8));
            }
            if (arrTaxDetail.length > 0) {
                let eTax = tItemIn.Tax.ele('Tax');
                for (let tTaxDetail of arrTaxDetail) {
                    tTaxDetail.sendTo(eTax.ele('TaxDetail'));
                }
            }

            // SCH
            let gSCHs = this._dGrps(gPO1, 'SCH');
            for (let gSCH of gSCHs) {
                let SCH = this._dSeg1(gSCH, 'SCH');
                let REF_0L = this._segByEleVal(gSCH, 'REF', 1, '0L');
                let vREF0L = this._segVal(REF_0L, 3);
                let REF_0N = this._segByEleVal(gSCH, 'REF', 1, '0N');
                let vREF0N = this._segVal(REF_0N, 3);
                let tStatus = mapSchedule[vREF0L]; // find from ACK06
                if (!tStatus) {
                    continue;
                }
                let eSched = tStatus.ScheduleLineReference.ele('ScheduleLineReference');
                eSched.att(XML.quantity, this._segVal(SCH, 1));
                eSched.att('requestedDeliveryDate', Utils.dateStrFromDTM(this._segVal(SCH, 6), this._segVal(SCH, 7), vREF0N));

                let REFs = this._dSegs(gSCH, 'REF');
                for (let REF of REFs) {
                    let v1 = this._segVal(REF, 1);
                    if (v1 == 'ZZ') {
                        eSched.ele(XML.Extrinsic).att(XML.nameXML, this._segVal(REF, 2))
                            .txt(this._segVal(REF, 3));
                    }
                }
            }// end if gSCHs

            // N9 Group
            let grpN9s = this._dGrps(gPO1, 'N9');
            for (let grpN9 of grpN9s) {
                this._dealGrpN9(grpN9, tItemIn, tStatusLineItem);
            }

            // N1 Group
            let grpN1s = this._dGrps(gPO1, 'N1');
            for (let grpN1 of grpN1s) {
                this._fillN1Grp(grpN1, tItem);
            }

            let bItemInDone: boolean = false; // only first Status needs ItemIn element in cXML
            for (let tStatus of arrTStatus) {
                tStatusLineItem.copyTo(tStatus);
                if (!bItemInDone && bACK_IC_exist) {
                    tItemIn.sendTo(tStatus.ItemIn.ele('ItemIn'));
                    bItemInDone = true;
                }
                tStatus.sendTo(tItem.ConfirmationStatus.ele('ConfirmationStatus'));
            }

            tItem.sendTo(tConfirmationReq.ConfirmationItem.ele('ConfirmationItem'));
        } // end loop grpPO1s


        // CTT
        // not mapped

        // AMT
        let AMT = this._rseg('AMT');
        let vAMT01 = this._segVal(AMT, 1);
        let vAMT02 = this._segVal(AMT, 2);
        if (vAMT01 == 'TT') {
            tConfirmH.Total.ele('Total').ele(XML.Money).txt(vAMT02);
        }
        // SE
        // not mapped
        tConfirmH.sendTo(tConfirmationReq.ConfirmationHeader.ele('ConfirmationHeader'));
        tConfirmationReq.sendTo(request.ele('ConfirmationRequest'));
        const xml = cxml.end({ prettyPrint: true, indent: '    ', spaceBeforeSlash: false });
        return xml;
    }

    private _ACK_ITEM_ID(ACK: EdiSegment, tItemID: TidyItemID, tItemDetail: TidyItemDetail, tStatus: TidyConfirmationStatus) {
        for (let i = 7; i <= 23; i = i + 2) {
            let vType = this._segVal(ACK, i);
            let vNumber = this._segVal(ACK, i + 1);
            switch (vType) {
                case 'BP':
                    this._ele2(tItemID.BuyerPartID, 'BuyerPartID')
                        .txt(vNumber);
                    // item.ele(XML.Extrinsic).att('name', `Buyer's Part ID`)
                    //     .txt(vNumber);
                    break;
                case 'VP':
                    tItemID.SupplierPartID.ele('SupplierPartID')
                        .txt(vNumber);
                case 'VS':
                    tItemID.SupplierPartAuxiliaryID.ele('SupplierPartAuxiliaryID')
                        .txt(vNumber);
                    break;
                case 'MG':
                    tItemDetail.ManufacturerPartID.ele('ManufacturerPartID').txt(vNumber);
                    break;
                case 'MF':
                    tItemDetail.ManufacturerPartID.ele('ManufacturerName').txt(vNumber);
                    break;
                case 'PD':
                    tItemDetail.Description.ele('Description').txt(vNumber);
                    break;
                case 'C3':
                    tItemDetail.Classification.ele('Classification').att(XML.domain, 'UNSPSC')
                        .att('code', vNumber);
                    break;
                case 'B8':
                    tStatus.SupplierBatchID.ele('SupplierBatchID').txt(vNumber);
                    break;
                case 'UP':
                    tItemDetail.Extrinsic.ele('Extrinsic').att(XML.nameXML, 'UPCID').txt(vNumber);
                    break;
                default:

            }
        } // end loop i

        // fulfill DTD requirement in case there is no SupplierPartID;
        this._ele2(tItemID.SupplierPartID, 'SupplierPartID');
        // fullfill DTD requirement in case there is no Classification
        if (this._isXmlEmpty(tItemDetail.Classification)) {
            tItemDetail.Classification.ele('Classification').att(XML.domain, 'UNSPSC')
                .att('code', '');
        }

    } // end function

    /**
     *  
     * @param grpN1 it's group Node and segment Node
     * @param invoiceDetailOrder 
     */
    protected _fillHeaderN1Grp(grpN1: ASTNode, tConfirmationHeader: TidyConfirmationHeader) {
        let N1 = this._dSeg1(grpN1, 'N1');
        let vRole = this._segVal(N1, 1);
        if (!vRole || !MAPS.mapN101[vRole]) {
            return;
        }
        // let eContact =;
        let tContact = new TidyContact()
        // N1 ... PER
        this._N1_sub(tContact, vRole, N1, grpN1);
        tContact.sendTo(tConfirmationHeader.Contact.ele('Contact'));

    } // end function _fillN1Grp

    /**
     *  Line Item Level N1
     * @param grpN1 it's group Node and segment Node
     * @param invoiceDetailOrder 
     */
    protected _fillN1Grp(grpN1: ASTNode, tItem: TidyConfirmationItem) {
        let N1 = this._dSeg1(grpN1, 'N1');
        let vRole = this._segVal(N1, 1);
        if (!vRole || !MAPS.mapN101[vRole]) {
            return;
        }
        let tContact = new TidyContact();
        // N1 ... PER
        this._N1_sub(tContact, vRole, N1, grpN1);
        tContact.sendTo(tItem.Contact.ele('Contact'));

    } // end function _fillN1Grp

    private _N1_sub(tContact: TidyContact, vRole: string, N1: EdiSegment, grpN1: ASTNode) {
        tContact.att('role', this._mcs(MAPS.mapN101, vRole));
        tContact.Name.ele('Name').att(XML.lang, 'en').txt(this._segVal(N1, 2));
        let vN1_3 = this._segVal(N1, 3);
        let codeQualifier = this._mcs(MAPS.mapN103, vN1_3);
        if (codeQualifier) {
            tContact.att('addressIDDomain', codeQualifier);
            tContact.att('addressID', this._segVal(N1, 4));
        }

        // N2
        let arrN2: EdiSegment[] = this._dSegs(grpN1, 'N2');
        if (arrN2 && arrN2.length > 0) {
            for (let segN2 of arrN2) {
                let postalAddress = this._ele2(tContact.PostalAddress, 'PostalAddress');
                let dt1 = this._segVal(segN2, 1);
                let dt2 = this._segVal(segN2, 2);
                if (dt1) {
                    postalAddress.ele('DeliverTo').txt(dt1);
                }
                if (dt2) {
                    postalAddress.ele('DeliverTo').txt(dt2);
                }
            }
        }

        // N3
        let arrN3: EdiSegment[] = this._dSegs(grpN1, 'N3');
        if (arrN3 && arrN3.length > 0) {
            for (let segN3 of arrN3) {
                let postalAddress = this._ele2(tContact.PostalAddress, 'PostalAddress');
                let dt1 = this._segVal(segN3, 1);
                let dt2 = this._segVal(segN3, 2);
                if (dt1) {
                    postalAddress.ele('Street').txt(dt1);
                }
                if (dt2) {
                    postalAddress.ele('Street').txt(dt2);
                }
            }
        }

        // N4
        let segN4 = this._dSeg1(grpN1, 'N4');
        let vN404 = this._segVal(segN4, 4);
        let ePostalAddress = this._ele2(tContact.PostalAddress, 'PostalAddress');

        // N4 City
        ePostalAddress.ele('City').txt(this._segVal(segN4, 1));

        // N4 State or Province Code
        if (vN404 && (vN404 == 'US' || vN404 == 'CA' || vN404 == 'IN')) {
            let tmpState = ePostalAddress.ele('State').txt(this._segVal(segN4, 2));
            if (vN404 == 'IN') {
                tmpState.att('isoStateCode', vN404 + '-' + this._segVal(segN4, 2));
            }
        }

        // N4 Postal Code
        ePostalAddress.ele('PostalCode').txt(this._segVal(segN4, 3));
        // N4 Country Code
        ePostalAddress.ele('Country').att('isoCountryCode', vN404).txt(vN404);
        // N4 6
        if (vN404 && !(vN404 == 'US' || vN404 == 'CA' || vN404 == 'IN')) {
            ePostalAddress.ele('State').txt(this._segVal(segN4, 6));
        }

        // // REF ME
        // let REFME = this._segByEleVal(grpN1, 'REF', 1, 'ME');
        // if (REFME) {
        //     let postalAddress = this._ele2(eContact, 'PostalAddress');
        //     postalAddress.att('name', this._segVal(REFME, 3));
        // }
        // REF All and GT 4G 4O
        let REFs: EdiSegment[] = this._dSegs(grpN1, 'REF');
        for (let REF of REFs) {
            let vDomain = this._segVal(REF, 1);
            let vMappedDomain = this._mcs(MAPS.mapN1_REF_128, vDomain);
            let eIDRef = tContact.IdReference.ele('IDReference');
            eIDRef.att(XML.domain, vMappedDomain);
            eIDRef.att(XML.identifier, this._segVal(REF, 3));
        }

        // PER
        let PER = this._dSeg1(grpN1, 'PER');
        this._PER(PER, tContact);
    }

    /**
     * Line Item Level, N9
     * @param gN9 
     * @param tItemIn 
     * @param tStatus 
     */
    private _dealGrpN9(gN9: ASTNode, tItemIn: TidyItemIn, tStatus: TidyConfirmationStatus) {
        // N9
        let N9 = this._dSeg1(gN9, 'N9');
        let MSGs = this._dSegs(gN9, 'MSG');
        let v1 = this._segVal(N9, 1);
        let v2 = this._segVal(N9, 2);
        let v3 = this._segVal(N9, 3);
        let vDesc;
        for (let MSG of MSGs) {
            vDesc += this._segVal(MSG, 1);
        }
        switch (v3) {
            case 'shipping':
                let eShipping = this._ele2(tItemIn.Shipping, 'Shipping');
                eShipping.ele(XML.Description).att(XML.lang, v2)
                    .txt(vDesc);
                break;
            case 'tax':
                let eTax = this._ele2(tItemIn.Tax, 'Tax');
                eTax.ele(XML.Description).att(XML.lang, v2)
                    .txt(vDesc);
                break;

            case 'Comments':
                let eComments = this._ele2(tStatus.Comments, 'Comments');
                eComments.ele(XML.Description).att(XML.lang, v2)
                    .txt(vDesc);
                break;
            case 'RejectionReason':
                let vMappedReason = this._mci(MAPS.mapRejectionReason, vDesc);
                tStatus.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, 'RejectionReasonComments',)
                    .txt(vDesc);
                tStatus.Extrinsic.ele(XML.Extrinsic)
                    .att(XML.nameXML, 'RejectionReason').txt(vMappedReason);
                break;
            case 'CustomRejectionReason':
                tStatus.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, 'RejectionReasonComments')
                    .txt(vDesc);
                break;
            default:
                tStatus.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, v2).txt(
                    v3 + vDesc
                );
        } // end switch v3

    } // end function _dealgrpN9

    /**
     * Deal Heder side N9,
     * although seems logic is identical to N9 in PO1
     * @param gN9 
     * @param tConfirmH 
     */
    private _dealHeaderGrpN9(gN9: ASTNode, tConfirmH: TidyConfirmationHeader) {
        // N9
        let N9 = this._dSeg1(gN9, 'N9');
        let MSGs = this._dSegs(gN9, 'MSG');
        let v1 = this._segVal(N9, 1);
        let v2 = this._segVal(N9, 2);
        let v3 = this._segVal(N9, 3);
        let vDesc;
        for (let MSG of MSGs) {
            vDesc += this._segVal(MSG, 1);
        }
        switch (v3) {
            case 'shipping':
                let eShipping = this._ele2(tConfirmH.Shipping, 'Shipping');
                eShipping.ele(XML.Description).att(XML.lang, v2)
                    .txt(vDesc);
                break;
            case 'tax':
                let eTax = this._ele2(tConfirmH.Tax, 'Tax');
                eTax.ele(XML.Description).att(XML.lang, v2)
                    .txt(vDesc);
                break;

            case 'Comments':
                let eComments = this._ele2(tConfirmH.Comments, 'Comments');
                eComments.ele(XML.Description).att(XML.lang, v2)
                    .txt(vDesc);
                break;
            case 'RejectionReason':
                let vMappedReason = this._mci(MAPS.mapRejectionReason, vDesc);
                tConfirmH.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, 'RejectionReasonComments',)
                    .txt(vDesc);
                tConfirmH.Extrinsic.ele(XML.Extrinsic)
                    .att(XML.nameXML, 'RejectionReason').txt(vMappedReason);
                break;
            case 'CustomRejectionReason':
                tConfirmH.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, 'RejectionReasonComments')
                    .txt(vDesc);
                break;
            default:
                tConfirmH.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, v2).txt(
                    v3 + vDesc
                );
        } // end switch v3

    } // end function _dealgrpN9

    private _grpSAC_Header(grpSAC: ASTNode, tConfirmationHeader: TidyConfirmationHeader) {
        let SAC = this._dSeg1(grpSAC, 'SAC');
        let CUR = this._dSeg1(grpSAC, 'CUR');
        let vSAC1 = this._segVal(SAC, 1);
        let vSAC2 = this._segVal(SAC, 2);
        let vSAC5 = this._segVal(SAC, 5);
        let vSAC7 = this._segVal(SAC, 7);
        let vSAC12 = this._segVal(SAC, 12);
        let vCUR2 = this._segVal(CUR, 2);
        switch (vSAC2) {
            case 'G830':
                let eShipping = tConfirmationHeader.Shipping.ele('Shipping');
                eShipping.ele(XML.Money).txt(this._segVal(SAC, 5))
                    .att(XML.currency, this._segVal(CUR, 2));
                eShipping.att(XML.trackingId, this._segVal(SAC, 13));
                eShipping.att(XML.trackingDomain, this._segVal(SAC, 14));
                eShipping.ele(XML.Description).txt(this._segVal(SAC, 15))
                    .att(XML.lang, this._segVal(SAC, 16));
                break;
            case 'H850':
                let eTax = tConfirmationHeader.Tax.ele('Tax');
                eTax.ele(XML.Money).txt(this._segVal(SAC, 5))
                    .att(XML.currency, this._segVal(CUR, 2));
                eTax.ele(XML.Description).txt(this._segVal(SAC, 15))
                    .att(XML.lang, this._segVal(SAC, 16));
                break;
            default:
                let sModName = MAPS.mapSAC1300[vSAC2];
                if (sModName) {
                    let eMods = this._ele3(tConfirmationHeader.Total, 'Total', 'Modifications');
                    let eMod = eMods.ele('Modification');
                    if (vSAC1 == 'A') {
                        let eAddDed = eMod.ele('AdditionalDeduction');
                        if (vSAC12 == '13') {
                            eAddDed.ele('DeductionAmount').ele(XML.Money).txt(vSAC5)
                                .att(XML.currency, vCUR2);
                        } else {
                            eAddDed.ele('DeductedPrice').ele(XML.Money).txt(vSAC5);
                        }
                        eAddDed.ele('DeductionPercent').att('percent', vSAC7);
                    } else {
                        // C Charge
                        let eAddCost = eMod.ele('AdditionalCost');
                        eAddCost.ele(XML.Money).txt(vSAC5)
                            .att(XML.currency, vCUR2);
                        eAddCost.ele('Percentage').att('percent', vSAC7);
                    }
                    eMod.ele('OriginalPrice').ele(XML.Money).txt(this._segVal(SAC, 13))
                        .att('type', this._segVal(SAC, 14));
                    let eModDetail = eMod.ele('ModificationDetail');
                    eModDetail.ele(XML.Description).txt(this._segVal(SAC, 15))
                        .att(XML.lang, this._segVal(SAC, 16));
                    eModDetail.att('startDate', Utils.dateStrFromDTM2(this._segVal(CUR, 8), this._segVal(CUR, 9)));
                    eModDetail.att('endDate', Utils.dateStrFromDTM2(this._segVal(CUR, 11), this._segVal(CUR, 12)));


                } // end if sModName exists
        } // end switch vSAC2


    } // end method
    private _grpSAC_ItemIn(gSAC: ASTNode, tItemIn: TidyItemIn, tItemDetail: TidyItemDetail) {
        let SAC = this._dSeg1(gSAC, 'SAC');
        let CUR = this._dSeg1(gSAC, 'CUR');
        let vSAC1 = this._segVal(SAC, 1);
        let vSAC2 = this._segVal(SAC, 2);
        let vSAC5 = this._segVal(SAC, 5);
        let vSAC7 = this._segVal(SAC, 7);
        let vSAC12 = this._segVal(SAC, 12);
        let vCUR2 = this._segVal(CUR, 2);
        switch (vSAC2) {
            case 'G830':
                let eShipping = tItemIn.Shipping.ele('Shipping');
                eShipping.ele(XML.Money).txt(this._segVal(SAC, 5))
                    .att(XML.currency, this._segVal(CUR, 2));
                eShipping.att(XML.trackingId, this._segVal(SAC, 13));
                eShipping.att(XML.trackingDomain, this._segVal(SAC, 14));
                eShipping.ele(XML.Description).txt(this._segVal(SAC, 15))
                    .att(XML.lang, this._segVal(SAC, 16));

                break;
            case 'H850':
                let eTax = tItemIn.Tax.ele('Tax');
                eTax.ele(XML.Money).txt(this._segVal(SAC, 5))
                    .att(XML.currency, this._segVal(CUR, 2));
                eTax.ele(XML.Description).txt(this._segVal(SAC, 15))
                    .att(XML.lang, this._segVal(SAC, 16));
                break;
            default:
                let sModName = MAPS.mapSAC1300[vSAC2];
                if (sModName) {
                    let eUnitPrice = this._ele2(tItemDetail.UnitPrice, 'UnitPrice');
                    let eMods = this._ele2(eUnitPrice, 'Modifications');
                    let eMod = eMods.ele('Modification');
                    if (vSAC1 == 'A') {
                        let eAddDed = eMod.ele('AdditionalDeduction');
                        if (vSAC12 == '13') {
                            eAddDed.ele('DeductionAmount').ele(XML.Money).txt(vSAC5)
                                .att(XML.currency, vCUR2);
                        } else {
                            eAddDed.ele('DeductedPrice').ele(XML.Money).txt(vSAC5);
                        }
                        eAddDed.ele('DeductionPercent').att('percent', vSAC7);
                    } else {
                        // C Charge
                        let eAddCost = eMod.ele('AdditionalCost');
                        eAddCost.ele(XML.Money).txt(vSAC5)
                            .att(XML.currency, vCUR2);
                        eAddCost.ele('Percentage').att('percent', vSAC7);
                    }
                    eMod.ele('OriginalPrice').ele(XML.Money).txt(this._segVal(SAC, 13))
                        .att('type', this._segVal(SAC, 14));
                    let eModDetail = eMod.ele('ModificationDetail');
                    eModDetail.att(XML.nameXML, vSAC2);
                    eModDetail.ele(XML.Description).txt(this._segVal(SAC, 15))
                        .att(XML.lang, this._segVal(SAC, 16));
                    // eModDetail.att('startDate', Utils.dateStrFromDTM2(this._segVal(CUR, 8), this._segVal(CUR, 9)));
                    // eModDetail.att('endDate', Utils.dateStrFromDTM2(this._segVal(CUR, 11), this._segVal(CUR, 12)));


                } // end if sModName exists
        } // end switch vSAC2


    } // end method
    private _dealGrpN1(grpN1: ASTNode, salesOrderHeader: XMLBuilder) {
        // N1
        let N1 = this._dSeg1(grpN1, 'N1');
        //let xmlContact = salesOrderHeader.ele('Contact');
        let tContact = new TidyContact();
        let roleCode = this._segVal(N1, 1) ?? 'NotExist';
        tContact.att('role', MAPS.mapN101[roleCode]);
        tContact.Name.ele('Name').txt(this._segVal(N1, 2))
            .att(XML.lang, 'EN');
        let codeQualifier = this._segVal(N1, 3) ?? 'NotExist';
        tContact.att('addressIDDomain', MAPS.mapN103[codeQualifier]);
        tContact.att('addressId', this._segVal(N1, 4));

        // N2
        let arrN2 = this._dSegs(grpN1, 'N2');
        let postalAddress = tContact.PostalAddress.ele('PostalAddress');
        for (let seg of arrN2) {
            postalAddress.ele('DeliverTo').txt(this._segVal(seg, 1));
            postalAddress.ele('DeliverTo').txt(this._segVal(seg, 2));
        }
        // N3
        let arrN3 = this._dSegs(grpN1, 'N3');
        for (let seg of arrN2) {
            postalAddress.ele('Street').txt(this._segVal(seg, 1));
            postalAddress.ele('Street').txt(this._segVal(seg, 2));
        }

        // N4
        this._X12N4(grpN1, tContact);
        tContact.sendTo(salesOrderHeader.ele('Contact'));
    }
}

export class MAPS {

    static mapBEG: Object = {
        "00": "new",
        "05": "update",
        "01": "cancel",
    };
    static mapN101: Object = {
        "40": "correspondent",
        "42": "componentSupplier",
        "60": "sales",
        "7X": "taxRepresentative",
        "A9": "customerService",
        "AP": "buyerMasterAccount",
        "B4": "buyerCorporate",
        "BF": "billFrom",
        "BK": "receivingCorrespondentBank",
        "BT": "billTo",
        "BY": "buyer",
        "CA": "carrierCorporate",
        "EN": "endUser",
        "FR": "from",
        "II": "issuerOfInvoice",
        "KY": "technicalSupport",
        "MA": "subsequentBuyer",
        "MI": "BuyerPlannerCode",
        "MJ": "supplierMasterAccount",
        "NG": "administrator",
        "O1": "originatingBank",
        "OB": "buyerAccount",
        "PD": "purchasingAgent",
        "PE": "payee",
        "PR": "payer",
        "R6": "requester",
        "RB": "wireReceivingBank",
        "RI": "remitTo",
        "SE": "supplierAccount",
        "SF": "shipFrom",
        "SO": "soldTo",
        "ST": "shipTo",
        "SU": "supplierCorporate",
        "TO": "receipientParty",
        "UK": "senderBusinessSystemID",
        "ZZ": "default",
    };
    static mapN103: Object = {
        "1": "DUNS",
        "2": "SCAC",
        "4": "IATA",
        "9": "DUNS+4"
    };
    static mapN1_REF_128: Object = {
        "01": "abaRoutingNumber",
        "02": "swiftID",
        "03": "chipsID",
        "11": "accountID",
        "12": "accountPayableID",
        "14": "ibanID",
        "3L": "bankBranchID",
        "3S": "pstID",
        "4B": "loadingPoint",
        "4C": "storageLocation",
        "4G": "provincialTaxID",
        "4L": "supplierLocationID",
        "4O": "qstID",
        "72": "BuyerPlannerCode",
        "8W": "bankNationalID",
        "9S": "transportationZone",
        "9X": "accountType",
        "ACT": "accountName",
        "AEC": "governmentNumber",
        "AP": "accountReceivableID",
        "BAA": "SupplierTaxID",
        "BAD": "stateTaxID",
        "BR": "ContactDepartmentID",
        "D2": "supplierReference",
        "DD": "documentName",
        "DNS": "duns4",
        "DP": "departmentName",
        "DUN": "duns",
        "F8": "reference",
        "GT": "gstTaxID",
        "J1": "creditorRefID",
        "KK": "cRADCRSDIndicator",
        "LU": "buyerLocationID",
        "PB": "bankAccountID",
        "PY": "bankAccountID",
        "RT": "bankRoutingID",
        "SA": "contactPerson",
        "TJ": "federalTaxID",
        "TX": "taxExemptionID",
        "VX": "vatID",
        "YD": "PartyAdditionalID ",
        "ZA": "PartyAdditionalID2",
    }
    static mapREF128: Object = {
        "01": "transitRoutingNumber",
        "02": "swiftID",
        "03": "chipsParticipantID",
        "04": "financialBranchAndInstitution",
        "05": "chipsUserID",
        "06": "computerManufacturerSystemID",
        "07": "addOnComputerSystemID",
        "08": "carrierPackageID",
        "09": "customsBarCodeNumber",
        "0A": "supervisoryAppraiserCertificationNo",
        "0B": "stateLicenceNumber",
        "0D": "subjectPropertyVerificationSource",
        "0E": "subjectPropertyReferenceNumber",
        "0F": "subscriberNumber",
        "0G": "reviewerFileNumber",
        "0H": "comparablePropertyPendingSaleRef",
        "0I": "comparablePropertySaleRef",
        "0J": "subjectPropertyNonSaleRef",
        "0K": "policyFormID",
        "0L": "referencedBy",
        "0M": "mortgageIdNumber",
        "0N": "attachedTo",
        "0P": "realEstateOwnedPropertyId",
        "10": "accountManagersCode",
        "11": "accountNumber",
        "12": "accountPayableID",
        "13": "horizontalCoordinate",
        "14": "masterAccountNumber",
        "15": "verticalCoordinate",
        "16": "miprNumber",
        "17": "clientReportingCategory",
        "18": "planNumber",
        "19": "divisionID",
        "1A": "blueCrossProviderNumber",
        "1B": "blueShieldProviderNumber",
        "1C": "medicareProviderNumber",
        "1D": "medicaidProviderNumber",
        "1E": "dentistLicenceNumber",
        "1F": "anesthesiaLicenceNumber",
        "1G": "providerUPINNumber",
        "1H": "champusID",
        "1I": "dodIDCode",
        "1J": "facilityID",
        "1K": "payorClaimNumber",
        "1L": "groupOrPolicyNumber",
        "1M": "ppoSiteNumber",
        "1N": "drgNumber",
        "1O": "consolidationShipmentNumber",
        "1P": "accessorialStatusCode",
        "1Q": "errorIDCode",
        "1R": "storageInfoCode",
        "1S": "ambulatoryPatientGroupNo",
        "1T": "resourceUtilizationGroupNo",
        "1U": "payGrade",
        "1V": "relatedVendorOrderNo",
        "1W": "memberIDNumber",
        "1X": "creditOrDebitAdjustmentNo",
        "1Y": "repairActionNo",
        "1Z": "financialDetailCode",
        "20": "repairPartNo",
        "21": "agaEquationNo",
        "22": "specialChargeOrAllowanceCode",
        "23": "clientNumber",
        "24": "shortTermDisabilityPolicyNo",
        "25": "reasonNotLowestCodeCode",
        "26": "unionNumber",
        "27": "InsurorPoolIDNo",
        "28": "employeeIDNo",
        "29": "foreclosureAccountNo",
        "2A": "importLicenseNo",
        "2B": "terminalReleaseOrderNo",
        "2C": "longTermDisabilityPolicyNo",
        "2D": "aeronauticalEquipmentRefNo",
        "2E": "foreignMilitarySalesCaseNo",
        "2F": "consolidatedInvoiceNo",
        "2G": "amendment",
        "2H": "assignedByTransactionSetSender",
        "2I": "trackingNo",
        "2J": "floorNo",
        "2K": "fdaProductType",
        "2L": "aarAccountingRules",
        "2M": "fccID",
        "2N": "fccTradeBrandID",
        "2O": "oshaClaimNo",
        "2P": "subdivisionID",
        "2Q": "fdaAccessionNo",
        "2R": "couponRedemptionNo",
        "2S": "catalog",
        "2T": "subSubhouseBillOfLading",
        "2U": "payerIDNumber",
        "2V": "specialGovACRN",
        "2W": "changeOrderAuthority",
        "2X": "supplementalAgreementAuthority",
        "2Y": "wageDetermination",
        "2Z": "uscsAntiDumpingDutyCaseNo",
        "30": "usGovVisaNo",
        "31": "docketNo",
        "32": "creditRepositoryCode",
        "33": "lenderCaseNo",
        "34": "loanRequestNo",
        "35": "multifamilyProjectNo",
        "36": "underwriterIDNo",
        "37": "condominiumIDNo",
        "38": "masterPolicyNo",
        "39": "proposalNo",
        "3A": "sectionOfNationalHousingActCode",
        "3B": "supplementalClaimNo",
        "3C": "payeeLoanNo",
        "3D": "servicerLoanNo",
        "3E": "investorLoanNo",
        "3F": "showID",
        "3G": "catastropheNo",
        "3H": "caseNo",
        "3I": "precinctNo",
        "3J": "officeNo",
        "3K": "petroleumPoolCode",
        "3L": "branchID",
        "3M": "fccConditionCode",
        "3N": "gasCustodianID",
        "3O": "uscsPreApprovalRulingNo",
        "3P": "thirdPartyOriginatorNo",
        "3Q": "fdaProductCode",
        "3R": "uscsBindingRulingNo",
        "3S": "provincialSalesTaxExemptionNo",
        "3T": "uscsPreClassificationRulingNo",
        "3U": "protractionNo",
        "3V": "formationID",
        "3W": "uscsCommercialDesc",
        "3X": "subcontractNo",
        "3Y": "receiverAssignedDropZone",
        "3Z": "customsBrokerRefNo",
        "40": "leaseScheduleNoReplacement",
        "41": "leaseScheduleNoPrior",
        "42": "phoneCalls",
        "43": "supportingDocumentNo",
        "44": "endUseNo",
        "45": "oldAccountNo",
        "46": "oldMeterNo",
        "47": "plateNo",
        "48": "agencysStudentNo",
        "49": "familyUnitNo",
        "4A": "personalIDNoPIN",
        "4B": "shipmentOriginCode",
        "4C": "shipmentDestinationCode",
        "4D": "shippingZone",
        "4E": "carrierAssignedConsigneeNo",
        "4F": "carrierAssignedShipperNo",
        "4G": "provincialTaxID",
        "4H": "commercialInvoiceNo",
        "4I": "balanceDueRefNo",
        "4J": "vehicleRelatedServicesRefNo",
        "4K": "accessorialRailDiversionRefNo",
        "4L": "locationSpecificServicesRefNo",
        "4M": "specialMoveRefNo",
        "4N": "specialPaymentRefNo",
        "4O": "cdnGSTorQSTRefNo",
        "4P": "affiliationNo",
        "4Q": "fccCallSign",
        "4R": "ruleSection",
        "4S": "preferredCallSign",
        "4T": "nadsID",
        "4U": "marketArea",
        "4V": "emmissionDesignator",
        "4W": "radioEngineeringStudy",
        "4X": "fccLicenseApplicationFileNo",
        "4Y": "subhouseBillOfLading",
        "4Z": "uscsCountervailingDutyCaseNo",
        "50": "stateStudentIDNo",
        "51": "pictureNo",
        "52": "swiftMT100",
        "53": "swiftMT202",
        "54": "fedWireTransfer",
        "55": "sequenceNo",
        "56": "correctedSocialSecurityNo",
        "57": "priorIncorrectSocialSecurityNo",
        "58": "correctedBatchNo",
        "59": "priorIncorrectBatchNo",
        "5A": "offenseTracking",
        "5B": "supplementalAccountNo",
        "5C": "congressionalDistrict",
        "5D": "lineOfCreditCategory",
        "5E": "consumerID",
        "5F": "warrant",
        "5G": "complaint",
        "5H": "incident",
        "5I": "offenderTracking",
        "5J": "driversLicense",
        "5K": "commercialDriversLicense",
        "5L": "juristictionalCommunityNo",
        "5M": "previousSequence",
        "5N": "citationOfStatute",
        "5O": "citationOfOpinion",
        "5P": "natlCriminalInfoCenterOrigAgencyID",
        "5Q": "stateCriminalHistRepIndividualID",
        "5R": "fbiIndividualID",
        "5S": "processingArea",
        "5T": "paymentLocation",
        "5U": "floodDataID",
        "5V": "couponDistributionMethod",
        "5W": "origUniformCommercialCodeFilingNo",
        "5X": "amdUniformCommercialCodeFilingNo",
        "5Y": "contUniformCommercialCodeFilingNo",
        "5Z": "uniformCommercialCodeFilingCollNo",
        "60": "accountSuffixCode",
        "61": "taxingAuthorityIDNo",
        "63": "priorLoanNo",
        "64": "jurisdictionalCommunityNameID",
        "65": "totalOrderCycleNo",
        "66": "previousPolicyNo",
        "67": "previousClaimHistoryID",
        "68": "dentalInsuranceAccountNo",
        "69": "dentalInsurancePolicyNo",
        "6A": "consigneeRefNo",
        "6B": "uscsEntryNo",
        "6C": "uscsEntryTypeCode",
        "6D": "uscsStatementNo",
        "6E": "mapReference",
        "6F": "appraiserLicense",
        "6G": "mapNo",
        "6H": "comparablePropertyVerificationSrc",
        "6I": "comparableProperty",
        "6J": "censusTract",
        "6K": "zone",
        "6L": "agentContractNo",
        "6M": "applicationNo",
        "6N": "claimantNo",
        "6O": "crossReferenceNo",
        "6P": "groupNo",
        "6Q": "insuranceLicenseNo",
        "6R": "providerControlNo",
        "6S": "providerOrderTicketNo",
        "6T": "pilotLicenseNo",
        "6U": "questionNo",
        "6V": "reissueCessionNo",
        "6W": "sequenceNo2",
        "6X": "specimenID",
        "6Y": "equipmentInitial",
        "6Z": "secofiNo",
        "70": "calendarNo",
        "71": "shiftNo",
        "72": "scheduleRefNo",
        "73": "statementOfWork",
        "74": "workBreakdownStructure",
        "75": "organizationBreakdownStructure",
        "76": "milestone",
        "77": "workPackage",
        "78": "planningPackage",
        "79": "costAccount",
        "7A": "poNoIncludedInOnOrderPosition",
        "7B": "poNoOfShipmentRecvSinceLastRepDate",
        "7C": "poNoOfOrderRecvSinceLastRepDate",
        "7D": "testerID",
        "7E": "collectorID",
        "7F": "repeatLocation",
        "7G": "dataQualityRejectReason",
        "7H": "epaTestTypePurposeCode",
        "7I": "subscriberAuthorizationNo",
        "7J": "tollBillingTelephoneRefNMo",
        "7K": "listOfMaterials",
        "7L": "qualifiedMaterialsList",
        "7M": "frame",
        "7N": "piggyback",
        "7O": "tripleback",
        "7P": "sheet",
        "7Q": "engineeringChangeOrder",
        "7R": "representativeIDNo",
        "7S": "drawingType",
        "7T": "masterContract",
        "7U": "relatedTransactionRefNo",
        "7W": "interchangeTrainID",
        "7X": "hmdaStateCode",
        "7Y": "hmdaCountyCode",
        "7Z": "hmdaMSA",
        "80": "chargeNo",
        "81": "symbolNumber",
        "82": "dataItemDescriptionRef",
        "83": "extendedLineItemNoELIN",
        "84": "contractorDataRequirementsListCDRL",
        "85": "subcontractorDataRequirementsSDRL",
        "86": "operationNo",
        "87": "functionalCategory",
        "88": "workCenter",
        "89": "assemblyNo",
        "8A": "hmoAuthorizationNo",
        "8B": "ppoAuthorizationNo",
        "8C": "tpoAuthorizationNo",
        "8D": "chemicalAbstractServiceRegistryNo",
        "8E": "guarantorLoanNo",
        "8F": "schoolLoanNo",
        "8G": "achTraceNo",
        "8H": "checkListNo",
        "8I": "fedwireConfirmationNo",
        "8J": "swiftConfirmationNo",
        "8K": "dominionOfCanadaCode",
        "8L": "isicCode",
        "8M": "originatingCompanyID",
        "8N": "receivingCompanyID",
        "8O": "achEntryDescription",
        "8P": "origDepositFinancialInstID",
        "8Q": "recvDepositFinancialInstID",
        "8R": "securityType",
        "8S": "brokerID",
        "8U": "bankAssignedSecurityID",
        "8V": "creditReference",
        "8W": "bankToBankInformation",
        "8X": "transactionCategoryOrType",
        "8Y": "safekeepingAccountNo",
        "8Z": "alternateClauseNo",
        "90": "subassemblyNo",
        "91": "costElement",
        "92": "changeDocumentNo",
        "93": "fundsAuthorization",
        "94": "fileIdentificationNo",
        "95": "cusipNo",
        "96": "stockCertificateNo",
        "97": "packageNo",
        "98": "containerPackagingSpecNo",
        "99": "rateConferenceIDCode",
        "9A": "repricedClaimReferenceNo",
        "9B": "repricedLineItemReferenceNo",
        "9C": "adjustedRepricedClaimReferenceNo",
        "9D": "adjustedRepricedLineItemReferenceNo",
        "9E": "replacementClaimNo",
        "9F": "referralNo",
        "9G": "dodForm250RequirementCode",
        "9H": "packagingGroupNo",
        "9I": "achStandardEntryClass",
        "9J": "pensionContract",
        "9K": "servicer",
        "9L": "serviceBureau",
        "9M": "chipsSequenceNo",
        "9N": "investor",
        "9P": "loanType",
        "9Q": "poolSuffix",
        "9R": "jobOrderNo",
        "9S": "deliveryRegion",
        "9T": "tenor",
        "9U": "loanFeatureCode",
        "9V": "paymentCategory",
        "9W": "payerCategory",
        "9X": "accountCategory",
        "9Y": "bankAssignedBankersRefNo",
        "9Z": "chamberOfCommerceNo",
        "A0": "adverstiserNo",
        "A1": "analysisTestNumber",
        "A2": "disabilityInsuranceAccountNo",
        "A3": "assignmentNo",
        "A4": "disabilityInsurancePolicyNo",
        "A5": "educationalInstutionID",
        "A6": "employeeID",
        "A7": "fsaInsuranceAccountNo",
        "A8": "fsaInsurancePolicyNo",
        "A9": "healthInsuranceAccountNo",
        "AA": "accountsReceivableStatementNo",
        "AAA": "distributorsSplitAgentNo",
        "AAB": "fundManagersReferenceNo",
        "AAC": "agencyHierarchicalLevel",
        "AAD": "officerLicenseNo",
        "AAE": "previousDistributionNo",
        "AAF": "interviewerID",
        "AAG": "militaryID",
        "AAH": "optionPolicyNo",
        "AAI": "payrollAccountNo",
        "AAJ": "priorContractNo",
        "AAK": "worksiteNo",
        "AAL": "agentNo",
        "AAM": "treatyID",
        "AAN": "associatedCaseControlNo",
        "AAO": "carrierAssignedCode",
        "AAP": "dealerNo",
        "AAQ": "directoryNo",
        "AAR": "distributorAssignedTransactionNo",
        "AAS": "distributorAssignedOrderNo",
        "AAT": "distributorsAccountNo",
        "AAU": "generalAgencyNo",
        "AAV": "laboratoryNo",
        "AAW": "agencyAssignedNo",
        "AAX": "listBillNo",
        "AAY": "accountingPeriodRef",
        "AAZ": "paramedicalID",
        "AB": "acceptableSourcePurchaserID",
        "ABA": "payrollNo",
        "ABB": "personalIDNo",
        "ABC": "policyLinkNo",
        "ABD": "secondaryPolicyNo",
        "ABE": "specialQuoteNo",
        "ABF": "natlPropertyRegistrySystemL1",
        "ABG": "natlPropertyRegistrySystemL2",
        "ABH": "investorAssignedID",
        "ABJ": "ginnieMaePoolPackageNo",
        "ABK": "mortgageElectronicRegSysOrgID",
        "ABL": "sellerLoanNo",
        "ABM": "subServicerLoanNo",
        "ABN": "natlPropertyRegistrySystemL3",
        "ABO": "stateHazardousWasteEntityID",
        "ABP": "bankruptcyProcedureNo",
        "ABQ": "natlBusinessID",
        "ABR": "priorDUNS",
        "ABS": "vesselName",
        "ABT": "securityInstrumentNo",
        "ABU": "assignmentRecordingNo",
        "ABV": "bookNo",
        "ABY": "hcfaNatlPayerID",
        "AC": "airCargoTransferManifest",
        "ACA": "growthFactorRef",
        "ACB": "region",
        "ACC": "status",
        "ACD": "classCode",
        "ACE": "serviceRequestNo",
        "ACF": "supplementNo",
        "ACG": "previousTicketNo",
        "ACH": "oneCallAgencyTicketNo",
        "ACI": "ticketNo",
        "ACJ": "billOfMaterialRevisionNo",
        "ACK": "drawingRevisionNo",
        "ACR": "achNOCCode",
        "ACS": "societyOfPropertyInfoCompilers",
        "ACT": "accountingCode",
        "AD": "acceptableSourceDUNSNo",
        "ADA": "aidar",
        "ADB": "masterPropertyNo",
        "ADC": "projectPropertyNo",
        "ADD": "unitPropertyNo",
        "ADE": "associatedPropertyNo",
        "ADF": "associatedNoForLimComElemParking",
        "ADG": "associatedNoForUnitParking",
        "ADH": "associatedNoForJoinUnitNotResub",
        "ADI": "processorID",
        "ADM": "airDimensionCode",
        "AE": "authorizationForExpenseAFENo",
        "AEA": "numeroCIN",
        "AEB": "croNumber",
        "AEC": "governmentRegistrationNo",
        "AED": "judicialNo",
        "AEE": "numeroNIT",
        "AEF": "passportNo",
        "AEG": "patronNo",
        "AEH": "registroInformacionFiscalRIF",
        "AEI": "registroUnicoDeContribuyenteRUC",
        "AEJ": "numeroSIEX",
        "AEK": "tokyoShokoResearchBusinessID",
        "AEL": "registroNacionalDeContribuyente",
        "AEM": "distributionCenterNo",
        "AF": "airlinesFlightID",
        "AG": "agentsShipmentNo",
        "AH": "masterAgreementID",
        "AHC": "airHandlingCode",
        "AI": "associatedInvoices",
        "AJ": "accountsReceivableCustomerAccount",
        "AK": "sendingCompanyAuditNo",
        "AL": "accountingEquipmentLocationNo",
        "ALC": "agencyLocationCode",
        "ALG": "titleCompanyCodeBookRef",
        "ALH": "titleDocumentSchedule",
        "ALI": "recordingNo",
        "ALJ": "titlePolicyNo",
        "ALT": "alterationNo",
        "AM": "adjustmentMemoChargeBack",
        "AN": "associatedPurchaseOrders",
        "AO": "appointmentNo",
        "AP": "accountReceivableID",
        "API": "apiDeductionCode",
        "AQ": "accessCode",
        "AR": "arrivalCode",
        "AS": "acceptableSourceSupplierID",
        "ASL": "aslbpNo",
        "ASP": "animalSpecial",
        "AST": "animalStrain",
        "AT": "appropriationNo",
        "ATC": "maintenanceAvailabilityType",
        "AU": "authorizationToMeetCompetitionNo",
        "AV": "healthInsuranceRatingAccountNo",
        "AW": "airWaybillNo",
        "AX": "governmentAccountingClassRefNo",
        "AY": "floorPlanApprovalNo",
        "AZ": "healthInsurancePolicyNo",
        "B1": "lesseeBillCodeNo",
        "B2": "axleRatio",
        "B3": "preferredProviderOrgNo",
        "B4": "bilateralCarServiceAgreements",
        "B5": "healthInsuranceRatingSuffixCode",
        "B6": "lifeInsuranceBillingAccountNo",
        "B7": "lifeInsurancePolicyNo",
        "B8": "lifeInsuranceBillingSuffixCode",
        "B9": "retirementPlanAccountNo",
        "BA": "retirementPlanPolicyNo",
        "BAA": "franchaiseTaxAccountNo",
        "BAB": "certificateOfIncorporationNo",
        "BAC": "beamAssemblyCode",
        "BAD": "stateTaxID",
        "BAE": "charterNo",
        "BAF": "receiptNo",
        "BAG": "withdrawlAccountNo",
        "BAH": "depositAccountNo",
        "BAI": "businessIdentNo",
        "BB": "authorizationNo",
        "BC": "buyersContractNo",
        "BCI": "basicContractLineItemNo",
        "BD": "bidNo",
        "BE": "businessActivity",
        "BF": "billingCenterID",
        "BG": "beginningSerialNo",
        "BH": "leaseScheduleNoBlanket",
        "BI": "bondedCarrierIRSID",
        "BJ": "carrierCustomsBondNo",
        "BK": "brokersOrderNo",
        "BKT": "bankTelegraphicNo",
        "BL": "governmentBillOfLading",
        "BLT": "billingType",
        "BM": "billOfLadingNo",
        "BMM": "beginMileMarker",
        "BN": "bookingNo",
        "BO": "binLocationNo",
        "BOI": "binaryObjectID",
        "BP": "adjustmentControlNo",
        "BQ": "healthMaintenanceOrganizationCodeNo",
        "BR": "brokerOrSalesOfficeNo",
        "BS": "splitBookingNo",
        "BT": "batchNo",
        "BU": "buyersApprovalMark",
        "BV": "purchaseOrderLineItemIDBuyer",
        "BW": "blendedWithBatchNo",
        "BX": "buyersShipmentMarkNo",
        "BY": "repairCategoryNo",
        "BZ": "complaintCode",
        "C0": "canadianSocialInsuranceNoSIN",
        "C1": "customerMaterialSpecificationNo",
        "C2": "customerProcessSpecificationNo",
        "C3": "customerSpecificationNo",
        "C4": "changeNo",
        "C5": "customerTrackingNoForLoanedMat",
        "C6": "carnetNo",
        "C7": "contractLineItemNo",
        "C8": "correctedContractNo",
        "C9": "previousCreditDebitAdjustmentNo",
        "CA": "costAllocationRef",
        "CB": "combinedShipment",
        "CBG": "censusBlockGroup",
        "CC": "contractCoOpNo",
        "CD": "creditNoteNo",
        "CDN": "citizenshipDocumentNo",
        "CE": "classOfContractCode",
        "CF": "fleetReferenceNo",
        "CG": "consigneesOrderNo",
        "CH": "customerCatalogNo",
        "CI": "uniqueConsignmentID",
        "CIR": "circuitNo",
        "CIT": "citation",
        "CJ": "clauseNo",
        "CK": "checkNo",
        "CL": "sellersCreditMemo",
        "CM": "buyersCreditMemo",
        "CMN": "continuousMoveNo",
        "CMP": "customerMaintenancePeriodSeqNo",
        "CMT": "component",
        "CN": "carrierShipmentID",
        "CNO": "commitmentNo",
        "CO": "customerOrderNo",
        "COL": "collocationIndicator",
        "COT": "certificateOfTransporation",
        "CP": "conditionOfPurchaseDocumentNo",
        "CPA": "canadianProvinceOperatingAuthNo",
        "CPT": "currentProceduralTerminologyCode",
        "CQ": "customsHouseBrokerLicenseNo",
        // "CR": "customerReferenceNo",
        "CRN": "casualtyReportNo",
        "CRS": "casualtyReportSerialNo",
        "CS": "conditionOfSaleDocumentNo",
        "CSC": "cs54KeyTrainIndicatorCode",
        "CSG": "cs54KeyTrainIndicatorGroupName",
        "CST": "censusStateCode",
        "CT": "contractNo",
        "CTS": "censusTractSuffix",
        "CU": "clearTextClause",
        "CV": "coilNo",
        "CW": "canadianWheatBoardPermitNo",
        "CX": "consignmentClassificationID",
        "CY": "commercialRegistrationNo",
        "CYC": "periodicityCode",
        "CZ": "contractRiderNo",
        "D0": "dataReliabilityCode",
        "D1": "deaOrderBlankNo",
        "D2": "supplierDocumentID",
        "D3": "natlAssocOfBoardsOfPharmacyNo",
        "D4": "cutNo",
        "D5": "dyeLotNo",
        "D6": "duplicateBillNo",
        "D7": "coverageCode",
        "D8": "lossReportNo",
        "D9": "claimNo",
        "DA": "domicileBranchNo",
        "DB": "buyersDebitMemo",
        "DC": "dealerPurchaseOrderNo",
        "DD": "documentIDCode",
        "DE": "depositorNo",
        "DF": "dfar",
        "DG": "drawingNo",
        "DH": "deaNo",
        "DHH": "hhsar",
        "DI": "distributorInvoiceNo",
        "DIS": "districtNo",
        "DJ": "deliveryTicketNo",
        "DK": "dockNo",
        "DL": "sellersDebitMemo",
        "DM": "associatedProductNo",
        "DN": "draftNo",
        "DNR": "depositNo",
        "DNS": "duns4",
        "DO": "deliveryOrderNumber",
        "DOA": "agar",
        "DOC": "car",
        "DOE": "dear",
        "DOI": "diar",
        "DOJ": "jar",
        "DOL": "dolar",
        "DON": "densityOrderNo",
        "DOS": "dosar",
        "DOT": "tar",
        "DP": "departmentNo",
        "DQ": "deliveryQuoteNo",
        "DR": "dockReceiptNo",
        "DRN": "drainholeNo",
        "DS": "dpasPriorityRating",
        "DSC": "departureFromSpecClassCode",
        "DSI": "departureFromSpecNo",
        "DST": "departureFromSpecTypeCode",
        "DT": "downstreamShipperContractNo",
        "DTS": "tapr",
        "DU": "dependentsInformation",
        "DUN": "duns",
        "DV": "diversionAuthorityNo",
        "DW": "depositSequenceNo",
        "DX": "departmentAgencyNo",
        "DY": "dodTransportationServiceCodeNo",
        "DZ": "crnaProviderID",
        "E1": "emergencyOrderNo",
        "E2": "partCausingRepairNo",
        "E3": "expansionOnEffectOfChangeNo",
        "E4": "chargeCardNo",
        "E5": "claimantsClaimNo",
        "E6": "backoutProcedureCode",
        "E7": "serviceBulletinNo",
        "E8": "serviceContractNo",
        "E9": "attachmentCode",
        "EA": "medicalRecordID",
        "EB": "embargoPermitNo",
        "EC": "circular",
        "ED": "exportDeclaration",
        "EDA": "edar",
        "EE": "electionDistrict",
        "EF": "electronicFundsTransferID",
        "EG": "endingSerialNo",
        "EH": "financialClassificationCode",
        "EI": "employersID",
        "EJ": "patientAccountNo",
        "EK": "hmsaFacilityID",
        "EL": "electronicDevicePIN",
        "EM": "electronicPaymentRefNo",
        "EMM": "endMileMarker",
        "EN": "embargoNo",
        "END": "endorsementNo",
        "EO": "submitterID",
        "EP": "exportPermitNo",
        "EPA": "epaAcquisitionRegulationEPAAR",
        "EPB": "epaTransporterID",
        "EQ": "equipmentNo",
        "ER": "containerOrEquipmentReceiptNo",
        "ES": "employersSocialSecurityNo",
        "ESN": "estimateSequenceNo",
        "ET": "excessTransportation",
        "EU": "endUsersPurchaseOrderNo",
        "EV": "receiverID",
        "EW": "mammographyCertNo",
        "EX": "estimateNo",
        "EY": "receiverSubIdentificationNo",
        "EZ": "ediAgreementID",
        "F1": "versionCodeNational",
        "F2": "versionCodeLocal",
        "F3": "submissionNo",
        "F4": "facilityCertificationNo",
        "F5": "medicareVersionCode",
        "F6": "healthInsuranceClaimNoHIC",
        "F7": "newHealthInsuranceClaimNoHIN",
        // "F8": "originalReferenceNo",
        "F9": "freightPayorReferenceNo",
        "FA": "federalAcquisitionRegulationsFAR",
        "FB": "fileTransferFormNo",
        "FC": "filerCodeIssuedByCustoms",
        "FCN": "assignedContractNo",
        "FD": "filerCodeIssuedByBureauOfCustoms",
        "FE": "failureMechanismNo",
        "FF": "filmNo",
        "FG": "fundID",
        "FH": "clinicNo",
        "FI": "fileID",
        "FJ": "lineItemControlNumber",
        "FK": "finishLotNo",
        // "FL": "fineLineClassification",
        "FLZ": "floodZone",
        "FM": "fmcForwardersNo",
        "FMP": "facilityMeasurementPointNo",
        "FN": "forwardersAgentsReferenceNo",
        "FND": "finderNo",
        "FO": "drugFormularyNo",
        "FP": "forestryPermitNo",
        "FQ": "formNo",
        "FR": "freightBillNo",
        "FS": "finalSequenceNo",
        "FSN": "assignedSequenceNo",
        "FT": "foreignTradeZone",
        "FTN": "premarketNotificationNo",
        "FU": "fundCode",
        "FV": "hmoReferenceNo",
        "FW": "stateLicenseID",
        "FWC": "finalWorkCandidateNo",
        "FX": "failureAnalysisReportNo",
        "FY": "claimOfficeNo",
        "FZ": "processorsInvoiceNo",
        "G1": "priorAuthorizationNo",
        "G2": "providerCommercialNo",
        "G3": "predeterminationOfBenefitsID",
        "G4": "peerReviewOrgApprovalNo",
        "G5": "providerSiteNo",
        "G6": "payerAssignedResubmissionRefNo",
        "G7": "resubmissionReasonCode",
        "G8": "resubmissionNo",
        "G9": "secondaryEmployeeID",
        "GA": "governmentAdvanceProgress",
        "GB": "grainBlockNo",
        "GC": "governmentContractNo",
        "GD": "returnGoodsBillOfLadingNo",
        "GE": "geographicNo",
        "GF": "specialtyLicenseNo",
        "GG": "guageTicketNo",
        "GH": "identificationCardSerialNo",
        "GI": "secondaryProviderNo",
        "GJ": "cornboreCertificationNo",
        "GK": "thirdPartyReferenceNo",
        "GL": "geographicDestinationZoneNo",
        "GM": "loanAcquisitionNo",
        "GN": "folderNo",
        "GO": "exhibitID",
        "GP": "governmentPriorityNo",
        "GQ": "internalPurchaseOrderReleaseNo",
        "GR": "grainOrderReferenceNo",
        "GS": "generalServicesAdmissionRegulations",
        "GT": "gstID",
        "GU": "internalPurchaseOrderItemNo",
        "GV": "thirdPartyPurchaseOrderNo",
        "GW": "thirdPartyPurchaseOrderReleaseNo",
        "GWS": "groupWorkCandidateSequenceNo",
        "GX": "thirdPartyPurchaseOrderItemNo",
        "GY": "emptyRepositioningNo",
        "GZ": "generalLedgerNo",
        "H1": "highFabricationAuthorizationNo",
        "H2": "highRawMaterialAuthorizationNo",
        "H3": "gravitySourceMeterNo",
        "H4": "federalInfoResourcesMgmtRegulation",
        "H5": "specialClause",
        "H6": "qualityClause",
        "H7": "standardClause",
        "H8": "hmdaCensusTract",
        "H9": "paymentHistoryReferenceNo",
        "HA": "competentAuthority",
        "HB": "billAndHoldInvoiceNo",
        "HC": "heatCode",
        "HD": "deptOfTransportHazardousNo",
        "HE": "hazardousExemptionNo",
        "HF": "engineeringDataList",
        "HG": "civilActionNo",
        "HH": "fiscalCode",
        "HHT": "typeOfHouseholdGoodsCode",
        "HI": "healthIndustryNoHIN",
        "HJ": "identityCardNo",
        "HK": "judgementNo",
        "HL": "sirenNo",
        "HM": "siretNo",
        "HMB": "hmdaBlockNumberArea",
        "HN": "hazardousCertificationNo",
        "HO": "shippersHazardousNo",
        "HP": "packAndHoldInvoiceNo",
        "HPI": "hcfaNatlProviderID",
        "HQ": "reinsuranceReference",
        "HR": "horsepowerRatingOfEngine",
        "HS": "harmonizedCodeSystemCanada",
        "HT": "codeOfFederalRegulations",
        "HU": "typeOfEscrowNo",
        "HUD": "deptOfHousingAndUrbanDevAcqReg",
        "HV": "escrowFileNo",
        "HW": "highWideFileNo",
        "HX": "autoLossItemNo",
        "HY": "propertyLossItemNo",
        "HZ": "taxAgencyNo",
        "I1": "owningBureauID",
        "I2": "iccAccountNo",
        "I3": "nonAmericanID",
        "I4": "creditCounselingID",
        "I5": "invoiceID",
        "I7": "creditReportNo",
        "I8": "socialInsuranceNo",
        "I9": "pollutant",
        "IA": "internalVendorNo",
        "IB": "inBondNo",
        "IC": "inboundToParty",
        "ICD": "icd9CM",
        "ID": "insuranceCertificateNo",
        "IE": "interchangeAgreementNo",
        "IF": "issueNo",
        "IFT": "intlFuelTaxAgreementAccountNo",
        "IG": "insurancePolicyNo",
        "IH": "initialDealerClaimNo",
        "II": "initialSampleInspectionReportNo",
        "IID": "imageID",
        "IJ": "sicCode",
        "IK": "manufacturerInvoiceID",
        // "IL": "internalOrderID",
        "IM": "imoNo",
        "IMP": "integratedMasterPlanIMP",
        "IMS": "integratedMasterScheduleIMS",
        "IN": "consigneesInvoiceNo",
        "IND": "investigatorialNewDrugNo",
        "IO": "inboundToOrOutboundFromParty",
        "IP": "inspectionReportNo",
        "IQ": "endItem",
        "IR": "intraPlantRouting",
        "IRN": "importersRefNoToLetterOfCredit",
        "IRP": "intlRegistrationPlanAccountNo",
        "IS": "invoiceNoSuffix",
        "ISC": "isicDominionOfCanadaCode",
        "ISN": "intlRegistrationPlanStickerNo",
        "ISS": "inspectionAndSurveySeqNo",
        "IT": "internalCustomerNo",
        "IU": "bargePermitNo",
        // "IV": "sellersInvoiceID",
        "IW": "partInterchangeability",
        "IX": "itemNo",
        "IZ": "insuredParcelPostNo",
        "J0": "proceeding",
        "J1": "creditor",
        "J2": "attorney",
        "J3": "judge",
        "J4": "trustee",
        "J5": "originatingCase",
        "J6": "adversaryCase",
        "J7": "leadCase",
        "J8": "jointlyAdministeredCase",
        "J9": "substantivelyConsolidatedCase",
        "JA": "beginningJobSeqNo",
        "JB": "jobProjectNo",
        "JC": "review",
        "JD": "userIdentification",
        "JE": "endingJobSequenceNo",
        "JF": "automatedUnderwritingRefNo",
        "JH": "tag",
        "JI": "multipleListingServiceArea",
        "JK": "multipleListingServiceSubArea",
        "JL": "packet",
        "JM": "multipleListingServiceMapXCoord",
        "JN": "multipleListingServiceMapYCoord",
        "JO": "multipleListingNo",
        "JP": "multipleListingServiceBookType",
        "JQ": "elevation",
        "JR": "propertyComponentLocation",
        "JS": "jobSequenceNo",
        "JT": "priorTaxIDTIN",
        "JU": "priorPhoneNo",
        "JV": "priorHealthIndustryNo",
        "JW": "priorUniversalProviderIDUPIN",
        "JX": "priorPostalZipCode",
        "JY": "originOfShipmentHarmonizedBasedCode",
        "JZ": "governingClassCode",
        "K0": "approvalCode",
        "K1": "foreignMilitarySalesNoticeNo",
        "K2": "certifiedMailNo",
        "K3": "registeredMailNo",
        "K4": "criticalityDesignator",
        "K5": "taskOrder",
        "K6": "purchaseDescription",
        "K7": "paragraphNo",
        "K8": "projectParagraphNo",
        "K9": "inquiryRequestNo",
        "KA": "distributionList",
        "KB": "beginningKanbanSerialNo",
        "KC": "exhibitDistributionList",
        "KD": "specialInstructionsNo",
        "KE": "endingKanbanSerialNo",
        "KG": "foreclosingStatus",
        "KH": "typeOfLawSuit",
        "KI": "typeOfOutstandingJudgment",
        "KJ": "taxLienJurisdiction",
        "KK": "deliveryReference",
        "KL": "contractReference",
        "KM": "rentalAccountNo",
        "KN": "censusAutomatedFilesID",
        "KO": "customsDrawbackEntryNo",
        "KP": "healthCertificateNo",
        "KQ": "procuringAgency",
        "KR": "responseToARequestForQuoteRef",
        "KS": "socicitation",
        "KT": "requestForQuotationRef",
        "KU": "officeSymbol",
        "KV": "distributionStatementCode",
        "KW": "certification",
        "KX": "representation",
        "KY": "siteSpecificProceduresTermsConds",
        "KZ": "masterSolicitationProcsTermsConds",
        "L1": "lettersOrNotes",
        "L2": "locationOnProductCode",
        "L3": "laborOperationNo",
        "L4": "proposalParagraphNo",
        "L5": "subExhibitLineItemNo",
        "L6": "subContractLineItemNo",
        "L7": "customersReleaseNo",
        "L8": "consigneesReleaseNo",
        "L9": "customersPartNo",
        "LA": "shippingLabelSerialNo",
        "LB": "lockbox",
        "LC": "leaseNo",
        "LD": "loanNo",
        "LE": "lenderEntityNo",
        "LEN": "locationExceptionOrderNo",
        "LF": "assemblyLineFeedLocation",
        "LG": "leaseScheduleNo",
        "LH": "longitudeExpressedInSeconds",
        "LI": "lineItemIDSellers",
        "LIC": "hibccLIC",
        "LJ": "localJurisdiction",
        "LK": "longitudeExpressedInDMS",
        "LL": "latitudeExpressedInSeconds",
        "LM": "prodPeriodForWhichLaborCostsAreFirm",
        "LN": "nonPickupLimitedTariffNo",
        "LO": "loadPlanningNo",
        "LOI": "loinc",
        "LP": "forPickupLimitedFreightTariffNo",
        "LQ": "latitudeExpressedInDMS",
        "LR": "localStudentID",
        "LS": "barCodedSerialNo",
        "LSD": "logisticsSupportDocTypeCode",
        "LT": "lotNo",
        "LU": "locationNo",
        "LV": "licensePlateNo",
        "LVO": "levyingOfficerID",
        "LW": "locationWithinEquipment",
        "LX": "qualifiedProductsList",
        "LY": "destOfShipmentHarmonizedBasedCode",
        "LZ": "lenderAccountNo",
        "M1": "materialStorageLocation",
        "M2": "majorForceProgram",
        "M3": "cropYear",
        "M5": "leaseAgreementAmendmentNoMaster",
        "M6": "militaryOrdnanceSecurityRiskNo",
        "M7": "medicalAssistanceCategory",
        "M8": "limitedPartnershipID",
        "M9": "taxShelterNo",
        // "MA": "shipNoticeID",
        "MB": "masterBillOfLading",
        "MBX": "mailbox",
        "MC": "microfilmNo",
        "MCI": "motorCarrierID",
        "MD": "magazineCode",
        "MDN": "hazardousWasteManifestDocNo",
        "ME": "messageAddressOrID",
        "MF": "manufacturersPartNo",
        "MG": "meterNo",
        "MH": "manufacturingOrderNo",
        "MI": "millOrderNo",
        "MJ": "modelNo",
        "MK": "manifestKeyNo",
        "ML": "militaryRankCivilianPayGardeNo",
        "MM": "masterLeaseAgreementNo",
        "MN": "micrNo",
        "MO": "manufacturingOperationNo",
        "MP": "multiplePOsOfAnInvoice",
        "MQ": "meterProvingReportNo",
        "MR": "merchandiseTypeCode",
        "MS": "manufacturerMaterialSafetyDataSheet",
        "MSL": "mailSlot",
        "MT": "meterTicketNo",
        "MU": "milspecNo",
        "MV": "migrantNo",
        "MW": "miltaryCallNo",
        "MX": "materialChangeNoticeNo",
        "MY": "modelYearNo",
        "MZ": "maintenanceRequestNo",
        "MZO": "multipleZoneOrderNo",
        "N0": "nominationNo",
        "N1": "localSchoolCourseNo",
        "N2": "localSchoolDistrictCourseNo",
        "N3": "statewideCourseNo",
        "N4": "usDoENCESCourseNo",
        "N5": "providerPlanNetworkID",
        "N6": "planNetworkID",
        "N7": "facilityNetworkID",
        "N8": "secondaryHealthInsuranceID",
        "N9": "dataAuthenticationNo",
        "NA": "northAmericanHazardousClass",
        "NAS": "nasaFARSupplement",
        "NB": "letterOfCreditNo",
        "NC": "secondaryCoverageCompanyNo",
        "ND": "letterOfCreditDraftNo",
        "NDA": "abbreviatedNewDrugApplicationNo",
        "NDB": "newDrugApplicationNo",
        "NE": "leaseRiderNo",
        "NF": "naicCode",
        "NFC": "natlFloodInsuranceProgCommunityName",
        "NFD": "natlFloodInsuranceProgCounty",
        "NFM": "natlFloodInsuranceProgMapNo",
        "NFN": "natlFloodInsuranceProgCommunityNo",
        "NFS": "natlFloodInsuranceProgState",
        "NG": "naturalGasPolicyActCategoryCode",
        "NH": "rateCardNo",
        "NI": "militaryStandardNoMILSTD",
        "NJ": "technicalDocumentNo",
        "NK": "priorCase",
        "NL": "technicalOrderNo",
        "NM": "discounterRegistrationNo",
        "NN": "nonconformanceReportNo",
        "NO": "noOT5AuthorityZeroMileageRate",
        "NP": "partialPaymentNo",
        "NQ": "medicaidRecipientID",
        "NR": "progressPaymentNo",
        "NS": "natlStockNo",
        "NT": "administratorsRefNo",
        "NU": "pendingCase",
        "NW": "associatedPolicyNo",
        "NX": "relatedNonconformanceNo",
        "NY": "agentClaimNo",
        "NZ": "criticalApplication",
        "O1": "outerContinentalShelfAreaCode",
        "O2": "outerContinentalShelfBlockNo",
        "O5": "ot5AuthorityCondOrRestOnCarHireRate",
        "O7": "opacTransaction",
        "O8": "originalFiling",
        "O9": "continuationFiling",
        "OA": "outletNo",
        "OB": "oceanBillOfLading",
        "OC": "oceanContainerNo",
        "OD": "originalReturnRequestReference",
        "OE": "openAndPrepaidStationListNo",
        "OF": "operatorID",
        "OG": "terminationFiling",
        "OH": "originHouse",
        "OI": "originalInvoiceNo",
        "OJ": "amendmentFiling",
        "OK": "offerGroup",
        "OL": "originalShippersBillOfLadingNo",
        "OM": "oceanManifest",
        // "ON": "dealerOrderNo",
        "OP": "originalPurchaseOrder",
        "OQ": "orderNo",
        "OR": "orderParagraphNo",
        "OS": "outboundFromParty",
        "OT": "salesAllowanceNo",
        "OU": "tariffSupplementNo",
        "OV": "tariffSuffixNo",
        "OW": "serviceOrderNo",
        "OX": "statementNo",
        "OZ": "productNo",
        "P1": "previousContractNo",
        "P2": "previousDEANo",
        "P3": "previouscCustomerReferenceNo",
        "P4": "projectCode",
        "P5": "positionCode",
        "P6": "pipelineNo",
        "P7": "productLineNo",
        "P8": "pickupReferenceNo",
        "P9": "pageNo",
        "PA": "priceAreaNo",
        "PAC": "patentCooperationTreatyApplNo",
        "PAN": "nonProvisionalPatentApplicationNo",
        "PAP": "provisionalPatentApplicationNo",
        "PB": "payersFinancialInstAccountNo",
        "PC": "productionCode",
        "PCC": "poolContractCode",
        "PCN": "protocolNo",
        "PD": "promotionDealNo",
        "PDL": "previousDriversLicense",
        "PE": "plantNo",
        "PF": "primeContractorContractNo",
        "PG": "productGroup",
        "PGC": "packingGroupCode",
        "PGN": "plugNo",
        "PGS": "proposedGroupWorkCandidateSeqNo",
        "PH": "priorityRating",
        "PHC": "procssHandlingCode",
        "PI": "priceListChangeOrIssueNo",
        "PID": "programID",
        "PIN": "platformID",
        "PJ": "packerNo",
        "PK": "packingListNo",
        "PL": "priceListNo",
        "PLA": "productLicensingAgreementNo",
        "PLN": "proposedContractNo",
        "PM": "partNo",
        "PMN": "premarketApplicationNo",
        "PN": "permitNo",
        "PNN": "patentNo",
        "PO": "purchaseOrderID",
        "POL": "policyNo",
        "PP": "purchaseOrderRevisionNo",
        "PQ": "payeeID",
        "PR": "priceQuoteNo",
        "PRS": "previouslyReportedSocialSecurityNo",
        "PRT": "productType",
        "PS": "purchaseOrderNumberSuffix",
        "PSI": "prevShipmentIDContinuousMove",
        "PSL": "nextShipmentIDContinuousMove",
        "PSM": "creditCard",
        "PSN": "proposedSequenceNo",
        "PT": "purchaseOptionAgreement",
        "PTC": "patentType",
        "PU": "previousBillOfLadingNo",
        "PV": "productChagneInformationNo",
        "PW": "priorPurchaseOrderNo",
        "PWC": "preliminaryWorkCandidateNo",
        "PWS": "proposedWorkCandidateSeqNo",
        "PX": "previousInvoiceNo",
        "PY": "accountID",
        "PZ": "productChagneNoticeNo",
        "Q1": "quoteNo",
        "Q2": "startingPackageNo",
        "Q3": "endingPackageNo",
        "Q4": "priorIdentifierNo",
        "Q5": "propertyControlNo",
        "Q6": "recallNo",
        "Q7": "receiverClaimNo",
        "Q8": "registrationNo",
        "Q9": "repairOrderNo",
        "QA": "pressID",
        "QB": "pressFormID",
        "QC": "productSpecificationDocumentNo",
        "QD": "replacementDEANo",
        "QE": "replacementCustomerRefNo",
        "QF": "qualityDispositionAreaID",
        "QG": "replacementAssemblyModelNo",
        "QH": "replacementassemblySerialNo",
        "QI": "qualityInspectionAreaID",
        "QJ": "returnMaterialAuthorizationNo",
        "QK": "salesProgramNo",
        "QL": "serviceAuthorizationNo",
        "QM": "qualityReviewMaterialCribID",
        "QN": "stopSequenceNo",
        "QO": "serviceEstimateNo",
        "QP": "substitutePartNo",
        "QQ": "unitNo",
        "QR": "qualityReportNo",
        "QS": "warrantyCoverageCode",
        "QT": "warrantyRegistrationNo",
        "QU": "changeVerificationProcedureCode",
        "QV": "newSysteAffectedCode",
        "QW": "newPartNo",
        "QX": "oldPartNo",
        "QY": "servicePerformedCode",
        "QZ": "referenceDrawingNo",
        "R0": "regiristoFederalDeContribuyentes",
        "R1": "currentRevsionNo",
        "R2": "cancelledRevisionNo",
        "R3": "correctionNo",
        "R4": "tariffSectionNo",
        "R5": "tariffPageNo",
        "R6": "tarriffRuleNo",
        "R7": "accountsReceivableOpenItem",
        "R8": "rentalAgreementNo",
        "R9": "rejectionNo",
        "RA": "repetitiveCargoShipmentNo",
        "RAA": "restrictedAvailabilityAuthorization",
        "RAN": "restrictedAvailabilityNo",
        "RB": "rateCodeNo",
        "RC": "railRoutingCode",
        "RD": "reelNo",
        "RE": "releaseNo",
        "REC": "relatedCase",
        "RF": "exportReferenceNo",
        "RG": "routeOrderNumberDomestic",
        "RGI": "regulatoryGuidelineID",
        "RH": "routeOrderNumberExport",
        "RI": "releaseInvoiceNoForPriorBillAndHold",
        "RIG": "rigNo",
        "RJ": "routeOrderNumberEmergency",
        "RK": "rackTypeNo",
        "RL": "reserveAssemblyLineFeedLocation",
        "RM": "rawMaterialSupplierDUNS",
        "RN": "runNo",
        "RO": "repetitiveBookingNo",
        "RP": "repetitivePatternCode",
        "RPP": "relativePriority",
        "RPT": "reportNo",
        "RQ": "purchaseRequisitionNo",
        "RR": "payersFinancialInstTransitRoutingNo",
        "RRS": "reconciliationReportSectionIDCode",
        "RS": "returnableContainerSerialNo",
        "RSN": "reservationNo",
        "RT": "bankRoutingID",
        "RU": "routeNo",
        "RV": "receivingNo",
        "RW": "repetitiveWaybillCode",
        "RX": "resubmitNo",
        "RY": "rebateNo",
        "RZ": "returnedGoodsAuthorizationNo",
        "S0": "specialApproval",
        "S1": "engineeringSpecificationNo",
        "S2": "dataSource",
        "S3": "specificationNo",
        "S4": "shippersBondNo",
        "S5": "routingInstructionNo",
        "S6": "stockNo",
        "S7": "stackTrainID",
        "S8": "sealOffNo",
        "S9": "sealOnNo",
        "SA": "salesperson",
        "SB": "salesRegionNo",
        "SBN": "suretyBondNo",
        "SC": "shipperCarOrderNo",
        "SCA": "scac",
        "SD": "subdayNo",
        "SE": "serialNumber",
        "SEK": "searchKey",
        "SES": "session",
        "SF": "shipFrom",
        "SG": "savings",
        "SH": "senderDefinedClause",
        "SHL": "shelfLifeIndicator",
        "SI": "shippersIdentifyingNoForShipmentSID",
        "SJ": "setNo",
        "SK": "serviceChangeNo",
        "SL": "salesTerritoryCode",
        "SM": "salesOfficeNo",
        "SN": "sealNo",
        "SNH": "snomed",
        "SNV": "stateNonResidentViolatorCompact",
        "SO": "shippersOrderInvoiceNo",
        "SP": "scanLine",
        "SPL": "splc",
        "SPN": "theaterScreenNo",
        "SQ": "containerSequenceNo",
        "SR": "salesResponsibility",
        "SS": "splitShipmentNo",
        "ST": "storeNo",
        "STB": "stccBridgeNo",
        "STR": "stccReplacementCode",
        "SU": "specialProcessingCode",
        "SUB": "titleReference",
        "SUO": "spacingUnitOrderNo",
        "SV": "serviceChargeNo",
        "SW": "sellersSaleNo",
        "SX": "serviceInterruptTrackingNo",
        "SY": "socialSecurityNo",
        "SZ": "specificationRevision",
        "T0": "dealerTypeID",
        "T1": "taxExchangeCode",
        "T2": "taxFormCode",
        "T3": "taxScheduleCode",
        "T4": "defenseFuelSupplyCenterSignalCode",
        "T5": "trailerUseAgreements",
        "T6": "taxFiling",
        "T7": "affectedSubsystemCode",
        "T8": "descriptionOfChangeCode",
        "T9": "documentatinoAffectedNo",
        "TA": "telecomCircuitSupplementalID",
        "TB": "truckersBillOfLading",
        "TC": "vendorTerms",
        "TD": "reasonForChange",
        "TDT": "technicalDocumentationType",
        "TE": "fmcTariffNo",
        "TF": "transferNo",
        "TG": "transportationControlNoTCN",
        "TH": "transportationAccountCodeTAC",
        "TI": "tirNo",
        "TIP": "technicalInformationPackage",
        "TJ": "federalTaxID",
        "TK": "tankNo",
        "TL": "taxLicenseExemption",
        "TM": "travelManifestACIorOTR",
        "TN": "transactionReferenceNo",
        "TO": "terminalOperatorNo",
        "TOC": "typeOfComment",
        "TP": "testSpecificationNo",
        "TPN": "transponderNo",
        "TQ": "tracerActionRequestNo",
        "TR": "governmentTransportationRequest",
        "TS": "tariffNo",
        "TSN": "templateSequenceNo",
        "TT": "terminalCode",
        "TU": "trialLocationCode",
        "TV": "lineOfBusiness",
        "TW": "taxWorksheet",
        "TX": "taxExemptionID",
        "TY": "policyType",
        "TZ": "totalCycleNo",
        "U0": "consolidatorsReceiptNo",
        "U1": "regionalAccountNo",
        "U2": "term",
        "U3": "usin",
        "U4": "unpaidInstallmentReferenceNo",
        "U5": "successorAccount",
        "U6": "predecessorAccount",
        "U8": "mbsLoanNo",
        "U9": "mbsPoolNo",
        "UA": "mortgageNo",
        "UB": "unacceptableSourcePurchaserID",
        "UC": "mortgageInsuranceIndicatorNo",
        "UD": "unacceptableSourceDUNSNo",
        "UE": "secondaryCoverageCertificateNo",
        "UF": "mortgageInsuranceCompanyNo",
        "UG": "usGovTransportationControlNo",
        "UH": "mortgageRemovalNo",
        "UI": "previousCourseNo",
        "UJ": "currentOrLatestCourseNo",
        "UK": "equivalentCourseNoAtRequestingInst",
        "UL": "crossListedCourseNo",
        "UM": "quarterQuarterSectionNo",
        "UN": "unHazardousClassificationNo",
        "UO": "quarterQuarterSpotNo",
        "UP": "upstreamShipperContractNo",
        "UQ": "sectionNo",
        "UR": "unitReliefNo",
        "URL": "url",
        "US": "unacceptableSourceSupplierID",
        "UT": "unitTrain",
        "UU": "townshipNo",
        "UV": "townshipRangeNo",
        "UW": "stateSenateDistrict",
        "UX": "stateAssemlyDistrict",
        "UY": "fannieMaeLoanNo",
        "UZ": "stateLegislativeDistrict",
        "V0": "version",
        "V1": "volumePurchaseAgreementNo",
        "V2": "visaType",
        "V3": "voyageNo",
        "V4": "stateDepartmentI20FormNo",
        "V5": "stateDepartmentIAP66FormNo",
        "V6": "naftaComplianceNo",
        "V7": "judicialDistrict",
        "V8": "institutionNo",
        "V9": "subServicer",
        "VA": "vesselAgentNo",
        "VB": "vaar",
        "VC": "vendorContractNo",
        "VD": "volumeNo",
        "VE": "vendorAbbreviationCode",
        "VF": "vendorProductChangeNoticeNo",
        "VG": "vendorChangeProcedureCode",
        "VH": "countyLegislativeDistrict",
        "VI": "poolNo",
        "VJ": "investorNoteHolderID",
        "VK": "institutionNoteHolderID",
        "VL": "thirdPartyNoteHolderID",
        "VM": "ward",
        "VN": "supplierOrderID",
        "VO": "institutionLoanNo",
        "VP": "vendorProductNo",
        "VQ": "relatedContractLineItemNo",
        "VR": "vendorIDNo",
        "VS": "vendorOrderNoSuffix",
        "VT": "motorVehicleIDNo",
        "VU": "preparersVerificationNo",
        "VV": "voucher",
        "VW": "standard",
        "VX": "vatID",
        "VY": "lineSequenceNo",
        "VZ": "sponsorsReferenceNo",
        "W1": "disposalTurnInDocumentNo",
        "W2": "weaponSystemNo",
        "W3": "manufacturingDirectiveNo",
        "W4": "procurementRequestNo",
        "W5": "inspectorID",
        "W6": "federalSuppyScheduleNo",
        "W7": "commercialAndGovEntityCAGE",
        "W8": "suffix",
        "W9": "specialPackagingInstructionNo",
        "WA": "laborOrAffiliationID",
        "WB": "americanPetroleumInstututeAPIWell",
        "WC": "contractOptionNo",
        "WCS": "workCandidateSequenceNo",
        "WD": "reviewPeriodNo",
        "WDR": "withdrawlRecord",
        "WE": "wellClassificationCode",
        "WF": "locallyAssignedControlNo",
        "WG": "vendorsPreviousJobNo",
        "WH": "masterReferenceLinkNo",
        "WI": "waiver",
        "WJ": "preAwardSurvey",
        "WK": "typeOfScienceCode",
        "WL": "federalSupplyClassificationCode",
        "WM": "weightAgreementNo",
        "WN": "wellNo",
        "WO": "workOrderNo",
        "WP": "warehousePickTicketNo",
        "WQ": "interimFundingOrganizationLoanNo",
        "WR": "warehouseReceiptNo",
        "WS": "warehouseStorageLocationNo",
        "WT": "brokersReferenceNo",
        "WU": "vessel",
        "WV": "dealerID",
        "WW": "depositoryTrustCompanyID",
        "WX": "distributorsAccountID",
        "WY": "waybillNo",
        "WZ": "distributorsRepresentativeID",
        "X0": "debtorsAccount",
        "X1": "providerClaimNo",
        "X2": "specificationClassNo",
        "X3": "defectCodeNo",
        "X4": "clinicalLabImprovementAmendmentNo",
        "X5": "stateIndustrialAccidentProviderNo",
        "X6": "originalVoucherNo",
        "X7": "batchSequenceNo",
        "X8": "secondarySuffixCodeIndicator",
        "X9": "internalControlNo",
        "XA": "substituteNationalStockNo",
        "XB": "substituteManufacturersPartNo",
        "XC": "cargoControlNo",
        "XD": "subsistenceID",
        "XE": "transportationPriorityNo",
        "XF": "governmentBillOfLadingOfficeCode",
        "XG": "airlineTicketNo",
        "XH": "contractAuditorID",
        "XI": "fhlmcLoanNo",
        "XJ": "fhlmcDeafultForeclosureSpecialistNo",
        "XK": "mortgageeLoanNo",
        "XL": "insuredsLoanNo",
        "XM": "gnmaMortgageNo",
        "XN": "titleXIXID",
        "XO": "sampleNo",
        "XP": "previousCargo",
        "XQ": "pierNo",
        "XR": "railroadCommissionRecordNo",
        "XS": "gasAnalyssiSourceMeterNo",
        "XT": "toxicologyID",
        "XU": "universalTransverseMercatorNorth",
        "XV": "universalTransverseMercatorEast",
        "XW": "universalTransverseMercatorZone",
        "XX": "ratingPeriod",
        "XY": "otherUnlistedTypeOfReferenceNo",
        "XZ": "pharmacyPresciptionNo",
        "Y0": "debtor",
        "Y1": "claimAdministratorClaimNo",
        "Y2": "thirdPartyAdministratorClaimNo",
        "Y3": "contractHolderClaimNo",
        "Y4": "agencyClaimNo",
        "Y5": "deliveryTrailerManifest",
        "Y6": "sortAndSegregate",
        "Y7": "processingArea2",
        "Y8": "userID",
        "Y9": "currentCertificateNo",
        "YA": "priorCertificateNo",
        "YB": "revisionNo",
        "YC": "tract",
        "YD": "buyerID",
        "YE": "railroadCommissionOilNo",
        "YF": "lesseeID",
        "YH": "operatorAssignedUnitNo",
        "YI": "refinerID",
        "YJ": "revenueSource",
        "YK": "rentPayorID",
        "YL": "allowanceRecipientID",
        "YM": "resourceScreeningReference",
        "YN": "receiversIDQualifier",
        "YO": "formation",
        "YP": "sellingArrangement",
        "YQ": "minimumRoyaltyPayorID",
        "YR": "operatorLeaseNo",
        "YS": "yardPosition",
        "YT": "reporterID",
        "YV": "participatingArea",
        "YW": "engineeringChangeProposal",
        "YX": "geographicScore",
        "YY": "geographicKey",
        "YZ": "georaphicIndex",
        "Z1": "safetyOfShipCertificate",
        "Z2": "safetyOfRadioCertificate",
        "Z3": "safetyEquipmentCertificate",
        "Z4": "civilLiabilitiesOfOilCertificate",
        "Z5": "loadLineCertificate",
        "Z6": "deratCertificate",
        "Z7": "maritimeDeclarationOfHealth",
        "Z8": "federalHousingAdministrationCaseNo",
        "Z9": "veteransAffairsCaseNo",
        "ZA": "supplier",
        // "ZB": "ultimateConsignee",
        "ZC": "connectingCarrier",
        "ZD": "familyMemberID",
        "ZE": "coalAuthorityNo",
        "ZF": "contractorEstablishmentCodeCEC",
        "ZG": "salesRepresentativeOrderNo",
        "ZH": "carrierAssignedReferenceNo",
        "ZI": "referenceVersionNo",
        "ZJ": "universalRailroadRevenueWaybillID",
        "ZK": "duplicateWaybillInRoute",
        "ZL": "duplicateWaybillNotInRoute",
        "ZM": "manufacturerNo",
        "ZN": "agencyCaseNo",
        "ZO": "makegoodCommercialLineNo",
        "ZP": "spouseTie",
        "ZQ": "nonSpouseTie",
        "ZR": "replacementSupplierNo",
        "ZS": "softwareApplicationNo",
        "ZT": "millingInTransit",
        "ZU": "field",
        "ZV": "block",
        "ZW": "area",
        "ZX": "countyCode",
        "ZY": "referencedPatternID",
    }

    static mapFOB335: Object = {
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

    }

    static mapSAC1300: Object = {
        "A040": "Access Charge",
        "A050": "AccountNumberCorrectionCharge",
        "A060": "AcidBattery",
        "A170": "Adjustment",
        "A520": "Charge",
        "A960": "Carrier",
        "B660": "Contract Allowance",
        "C300": "Discount-Special",
        "C310": "Discount",
        "D180": "FreightBasedOnDollarMinimum",
        "D240": "Freight",
        "D500": "Handling",
        "D980": "Insurance",
        "G580": "Royalties",
        "G821": "Shipping",
        "H970": "Allowance",
        "I530": "Volume Discount",
    }

    static mapTXI963Desc: Object = {
        "AA": "Stadium Tax",
        "AB": "Surtax",
        "AT": "Assessment",
        "BP": "Business Privilege Tax",
        "CA": "City Tax",
        "CB": "Threshold Tax",
        "CG": "Federal Value-added Tax (GST) on Goods",
        "CI": "City Rental Tax",
        "CP": "County/Parish Sales Tax",
        "CR": "County Rental Tax",
        "CS": "City Sales Tax",
        "CT": "County Tax",
        "CV": "Federal Value-added Tax (GST) on Services",
        "DL": "Default Labor Tax",
        "EQ": "Equipment Tax",
        "ET": "Energy Tax",
        "EV": "Environmental Tax",
        "F1": "FICA Tax",
        "F2": "FICA Medicare Tax",
        "F3": "FICA Social Security Tax",
        "FD": "Federal Tax",
        "FF": "Fuel Super Fund Tax",
        "FI": "Federal Income Tax Withholding",
        "FL": "Fuel L.U.S.T. Tax (Leaking Underground Storage Tank)",
        "FR": "Franchise Tax",
        "FS": "Fuel Spill Tax",
        "FT": "Federal Excise Tax",
        "GR": "Gross Receipts Tax",
        "GS": "Goods and Services Tax",
        "HS": "Public Health and Education Tax",
        "HT": "Handicap Tax",
        "HZ": "Hazardous Waste Tax",
        "LB": "Labor By Trade Tax",
        "LO": "Local Tax (Not Sales Tax)",
        "LS": "State and Local Sales Tax",
        "LT": "Local Sales Tax (All Applicable Sales Taxes by Taxing Authority Below the State Level)",
        "LU": "Leaky Underground Storage Tank (LUST) Tax (federal)",
        "LV": "Leaky Underground Storage Tank (LUST) Tax (state)",
        "MA": "Material Tax",
        "MN": "Minimum Tax",
        "MP": "Municipal Tax",
        "MS": "Miscellaneous State Tax",
        "MT": "Metropolitan Transit Tax",
        "OH": "Other Taxes",
        "OT": "Occupational Tax",
        "PG": "State or Provincial Tax on Goods",
        "PS": "State or Provincial Tax on Services",
        "SA": "State or Provincial Fuel Tax",
        "SB": "Secondary Percentage Tax",
        "SC": "School Tax",
        "SE": "State Excise Tax",
        "SF": "Superfund Tax",
        "SL": "State and Local Tax",
        "SP": "State/Provincial Tax",
        "SR": "State Rental Tax",
        "SS": "State Tax on Specific Labor",
        "ST": "State Sales Tax",
        "SU": "Sales and Use Tax",
        "SX": "Enhanced 911 - State Excise Tax",
        "T1": "Pre-threshold Tax",
        "T2": "Post Threshold Tax",
        "TD": "Telecommunications Device for the Deaf (TDD) Service Excise Tax",
        "TT": "Telecommunications Tax",
        "TX": "All Taxes",
        "UL": "License Tax",
        "UT": "Utility Users' Tax",
        "VA": "Value Added Tax",
        "WS": "Well Service",
        "ZA": "911-City Tax",
        "ZB": "911-County Tax",
        "ZC": "911-Excise Tax",
        "ZD": "911-State Tax",
        "ZE": "911-Tax",
        "ZZ": "Mutually Defined",
    }

    static mapTXI963Category: Object = {
        "AA": "other",
        "AB": "other",
        "AT": "other",
        "BP": "other",
        "CA": "other",
        "CB": "other",
        "CG": "gst",
        "CI": "other",
        "CP": "sales",
        "CR": "other",
        "CS": "sales",
        "CT": "other",
        "CV": "gst",
        "DL": "other",
        "EQ": "other",
        "ET": "other",
        "EV": "other",
        "F1": "other",
        "F2": "other",
        "F3": "other",
        "FD": "usage",
        "FF": "other",
        "FI": "other",
        "FL": "other",
        "FR": "other",
        "FS": "other",
        "FT": "other",
        "GR": "other",
        "GS": "gst",
        "HS": "other",
        "HT": "other",
        "HZ": "other",
        "LB": "other",
        "LO": "other",
        "LS": "other",
        "LT": "sales",
        "LU": "other",
        "LV": "other",
        "MA": "other",
        "MN": "other",
        "MP": "other",
        "MS": "other",
        "MT": "other",
        "OH": "other",
        "OT": "other",
        "PG": "other",
        "PS": "other",
        "SA": "other",
        "SB": "other",
        "SC": "other",
        "SE": "usage",
        "SF": "other",
        "SL": "other",
        "SP": "other",
        "SR": "other",
        "SS": "other",
        "ST": "sales",
        "SU": "sales",
        "SX": "other",
        "T1": "other",
        "T2": "other",
        "TD": "other",
        "TT": "usage",
        "TX": "other",
        "UL": "other",
        "UT": "usage",
        "VA": "vat",
        "WS": "other",
        "ZA": "other",
        "ZB": "other",
        "ZC": "usage",
        "ZD": "other",
        "ZE": "other",
        "ZZ": "other",
    }

    static mapUOM355: Object = {
        "05": "5", //lift
        "04": "6", //small spray
        "08": "8", //heat lot
        "10": "10", //group
        "11": "11", //outfit
        "13": "13", //ration
        "14": "14", //shot
        "15": "15", //stick. military
        "16": "16", //hundred fifteen kg drum
        "17": "17", //hundred lb drum
        "18": "18", //fiftyfive gallon (US) drum
        "19": "19", //tank truck
        "20": "20", //twenty foot container
        "21": "21", //forty foot container
        "22": "22", //decilitre per gram
        "23": "23", //gram per cubic centimetre
        "24": "24", //theoretical pound
        "25": "25", //gram per square centimetre
        "26": "26", //actual ton
        "27": "27", //theoretical ton
        "28": "28", //kilogram per square metre
        "29": "29", //pound per thousand square foot
        "30": "30", //horse power day per air dry metric ton
        "31": "31", //catch weight
        "32": "32", //kilogram per air dry metric ton
        "33": "33", //kilopascal square metre per gram
        "34": "34", //kilopascal per millimetre
        "35": "35", //millilitre per square centimetre second
        "36": "36", //cubic foot per minute per square foot
        "37": "37", //ounce per square foot
        "38": "38", //ounce per square foot per 0.01inch
        "40": "40", //millilitre per second
        "41": "41", //millilitre per minute
        "43": "43", //super bulk bag
        "44": "44", //fivehundred kg bulk bag
        "45": "45", //threehundred kg bulk bag
        "46": "46", //fifty lb bulk bag
        "47": "47", //fifty lb bag
        "48": "48", //bulk car load
        "53": "53", //theoretical kilogram
        "54": "54", //theoretical tonne
        "56": "56", //sitas
        "57": "57", //mesh
        "58": "58", //net kilogram
        "59": "59", //part per million
        "60": "60", //percent weight
        "61": "61", //part per billion (US)
        "62": "62", //percent per 1000 hour
        "63": "63", //failure rate in time
        "64": "64", //pound per square inch. gauge
        "66": "66", //oersted
        "69": "69", //test specific scale
        "71": "71", //volt ampere per pound
        "72": "72", //watt per pound
        "73": "73", //ampere tum per centimetre
        "74": "74", //millipascal
        "76": "76", //gauss
        "77": "77", //milli-inch
        "78": "78", //kilogauss
        "80": "80", //pound per square inch absolute
        "81": "81", //henry
        "84": "84", //kilopound-force per square inch
        "85": "85", //foot pound-force
        "87": "87", //pound per cubic foot
        "89": "89", //poise
        "90": "90", //Saybold universal second
        "91": "91", //stokes
        "92": "92", //calorie per cubic centimetre
        "93": "93", //calorie per gram
        "94": "94", //curl unit
        "95": "95", //twenty thousand gallon (US) tankcar
        "96": "96", //ten thousand gallon (US) tankcar
        "97": "97", //ten kg drum
        "98": "98", //fifteen kg drum
        "1A": "1A", //car mile
        "1B": "1B", //car count
        "1C": "1C", //locomotive count
        "1D": "1D", //caboose count
        "1E": "1E", //empty car
        "1F": "1F", //train mile
        "1G": "1G", //fuel usage gallon (US)
        "1H": "1H", //caboose mile
        "1I": "1I", //fixed rate
        "1J": "1J", //ton mile
        "1K": "1K", //locomotive mile
        "1L": "1L", //total car count
        "1M": "1M", //total car mile
        "1X": "1X", //quarter mile
        "2A": "2A", //radian per second
        "2B": "2B", //radian per second squared
        "2C": "2C", //roentgen
        "2I": "2I", //British thermal unit (international table) per hour
        "2J": "2J", //cubic centimetre per second
        "2K": "2K", //cubic foot per hour
        "2L": "2L", //cubic foot per minute
        "2M": "2M", //centimetre per second
        "2N": "2N", //decibel
        "2P": "2P", //kilobyte
        "2Q": "2Q", //kilobecquerel
        "2R": "2R", //kilocurie
        "2U": "2U", //megagram
        "2V": "2V", //megagram per hour
        "2W": "2W", //bin
        "2X": "2X", //metre per minute
        "2Y": "2Y", //milliroentgen
        "2Z": "2Z", //millivolt
        "3B": "3B", //megajoule
        "3C": "3C", //manmonth
        "3E": "3E", //pound per pound of product
        "3G": "3G", //pound per piece of product
        "3H": "3H", //kilogram per kilogram of product
        "3I": "3I", //kilogram per piece of product
        "4A": "4A", //bobbin
        "4B": "4B", //cap
        "4C": "4C", //centistokes
        "4E": "4E", //twenty pack
        "4G": "4G", //microlitre
        "4H": "4H", //micrometre (micron)
        "4K": "4K", //milliampere
        "4L": "4L", //megabyte
        "4M": "4M", //milligram per hour
        "4N": "4N", //megabecquerel
        "4O": "4O", //microfarad
        "4P": "4P", //newton per metre
        "4Q": "4Q", //ounce inch
        "4R": "4R", //ounce foot
        "4T": "4T", //picofarad
        "4U": "4U", //pound per hour
        "4W": "4W", //ton (US) per hour
        "4X": "4X", //kilolitre per hour
        "5A": "5A", //barrel (US) per minute
        "5B": "5B", //batch
        "5C": "5C", //gallon(US) per thousand
        "5E": "5E", //MMSCF/day
        "5F": "5F", //pound per thousand
        "5G": "5G", //pump
        "5H": "5H", //stage
        "5I": "5I", //standard cubic foot
        "5J": "5J", //hydraulic horse power
        "5K": "5K", //count per minute
        "5P": "5P", //seismic level
        "5Q": "5Q", //seismic line
        "AG": "A11", //angstrom
        "79": "A53", //electronvolt
        "AA": "AA", //ball
        "AB": "AB", //bulk pack
        "AC": "ACR", //acre
        "KU": "ACT", //activity
        "AD": "AD", //byte
        "AE": "AE", //ampere per metre
        "AH": "AH", //additional minute
        "AI": "AI", //average minute per call
        "AJ": "AJ", //cop
        "AK": "AK", //fathom
        "AL": "AL", //access line
        "AM": "AM", //ampoule
        "68": "AMP", //ampere
        "YR": "ANN", //year
        "AP": "AP", //aluminium pound only
        "TO": "APZ", //troy ounce or apothecary ounce
        "AQ": "AQ", //anti-hemophilic factor (AHF) unit
        "AR": "AR", //suppository
        "AS": "AS", //assortment
        "AT": "ATM", //standard atmosphere
        "AV": "AV", //capsule
        "AW": "AW", //powder filled vial
        "AY": "AY", //assembly
        "AZ": "AZ", //British thermal unit (international table) per pound
        "B0": "B0", //Btu per cubic foot
        "B1": "B1", //barrel (US) per day
        "B2": "B2", //bunk
        "B3": "B3", //batting pound
        "3F": "B35", //kilogram per litre
        "B4": "B4", //barrel. imperial
        "B5": "B5", //billet
        "B6": "B6", //bun
        "B7": "B7", //cycle
        "B9": "B9", //batt
        "BB": "BB", //base box
        "B8": "BD", //board
        "BD": "BE", //bundle
        "BF": "BFT", //board foot
        "BG": "BG", //bag
        "BH": "BH", //brush
        "BQ": "BHP", //brake horse power
        "BC": "BJ", //bucket
        "BS": "BK", //basket
        "BA": "BL", //bale
        "BR": "BLL", //barrel (US)
        "BO": "BO", //bottle
        "BP": "BP", //hundred board foot
        "R2": "BQL", //becquerel
        "BI": "BR", //bar [unit of packaging]
        "BM": "BT", //bolt
        "BY": "BTU", //British thermal unit (international table)
        "BU": "BUA", //bushel (US)
        "BV": "BUI", //bushel (UK)
        "BW": "BW", //base weight
        "BX": "BX", //box
        "BZ": "BZ", //million BTUs
        "C0": "C0", //call
        "C1": "C1", //composite product pound (total weight)
        "C2": "C2", //carset
        "F5": "C34", //mole
        "C4": "C4", //carload
        "C5": "C5", //cost
        "C6": "C6", //cell
        "UN": "C62", //one
        "C7": "C7", //centipoise
        "PJ": "C77", //pound gage
        "RB": "C81", //radian
        "C9": "C9", //coil group
        "CN": "CA", //can
        "CE": "CEL", //degree Celsius
        "HU": "CEN", //hundred
        "CG": "CG", //card
        "AF": "CGM", //centigram
        "Z2": "CH", //container
        "CJ": "CJ", //cone
        "CK": "CK", //connector
        "CX": "CL", //coil
        "C3": "CLT", //centilitre
        "SC": "CMK", //square centimetre
        "CC": "CMQ", //cubic centimetre
        "CM": "CMT", //centimetre
        "CH": "CN", //
        "4F": "CNP", //hundred pack
        "CB": "CO", //carboy
        "65": "COU", //coulomb
        "CQ": "CQ", //cartridge
        "CP": "CR", //crate
        "CA": "CS", //case
        "CT": "CT", //carton
        "CD": "CTM", //metric carat
        "CU": "CU", //cup
        "4D": "CUR", //curie
        "CV": "CV", //cover
        "CW": "CWA", //hundred pound (cwt) / hundred weight (US)
        "HW": "CWI", //hundred weight (UK)
        "CL": "CY", //cylinder
        "CZ": "CZ", //combo
        "TU": "D14", //thousand linear yard
        "N4": "D23", //pen gram (protein)
        "D5": "D5", //kilogram per square centimetre
        "BK": "D63", //book
        "BL": "D64", //block
        "RO": "D65", //round
        "CS": "D66", //cassette
        "A8": "D67", //dollar per hour
        "SA": "D7", //sandwich
        "BE": "D79", //beam
        "D8": "D8", //draize score
        "D9": "D9", //dyne per square centimetre
        "CO": "D90", //cubic metre (net)
        "R8": "D91", //rem
        "BJ": "D92", //band
        "JG": "D95", //joule per gram
        "PG": "D96", //pound gross
        "PL": "D97", //pallet/unit load
        "PU": "D98", //mass pound
        "SL": "D99", //sleeve
        "DA": "DAY", //day
        "DB": "DB", //dry pound
        "DC": "DC", //disk (disc)
        "DD": "DD", //degree [unit of angle]
        "DE": "DE", //deal
        "DG": "DG", //decigram
        "DI": "DI", //dispenser
        "DJ": "DJ", //decagram
        "DL": "DLT", //decilitre
        "D3": "DMK", //square decimetre
        "C8": "DMQ", //cubic decimetre
        "DM": "DMT", //decimetre
        "DN": "DN", //decinewton metre
        "DP": "DPR", //dozen pair
        "DQ": "DQ", //data record
        "DR": "DR", //drum
        "DF": "DRA", //dram (US)
        "DS": "DS", //display
        "DT": "DT", //dry ton
        "DU": "DU", //dyne
        "WP": "DWT", //pennyweight
        "DX": "DX", //dyne per centimetre
        "DY": "DY", //directory book
        "DZ": "DZN", //dozen
        "BT": "E2", //belt
        "NT": "E3", //trailer
        "GT": "E4", //gross kilogram
        "MT": "E5", //metric long ton
        "JA": "E51", //job
        "EA": "EA", //each
        "EB": "EB", //electronic mail box
        "EC": "EC", //each per month
        "EP": "EP", //eleven pack
        "EQ": "EQ", //equivalent gallon
        "EV": "EV", //envelope
        "F1": "F1", //thousand cubic foot per day
        "F9": "F9", //fibre per cubic centimetre of air
        "FA": "FAH", //degree Fahrenheit
        "83": "FAR", //farad
        "FB": "FB", //field
        "FC": "FC", //thousand cubic foot
        "FD": "FD", //million particle per cubic foot
        "FE": "FE", //track foot
        "FF": "FF", //hundred cubic metre
        "FG": "FG", //transdermal patch
        "FH": "FH", //micromole
        "FL": "FL", //flake ton
        "FM": "FM", //million cubic foot
        "FT": "FOT", //foot
        "FP": "FP", //pound per square foot
        "FR": "FR", //foot per minute
        "FS": "FS", //foot per second
        "SF": "FTK", //square foot
        "CF": "FTQ", //cubic foot
        "G2": "G2", //US gallon per minute
        "G3": "G3", //Imperial gallon per minute
        "G7": "G7", //microfiche sheet
        "GB": "GB", //gallon (US) per day
        "G4": "GBQ", //gigabecquerel
        "GC": "GC", //gram per 100 gram
        "GD": "GD", //gross barrel
        "GE": "GE", //pound per gallon (US)
        "GG": "GGR", //great gross
        "GH": "GH", //half gallon (US)
        "G5": "GII", //gill (UK)
        "GJ": "GJ", //gram per millilitre
        "GK": "GK", //gram per kilogram
        "GL": "GL", //gram per litre
        "GI": "GLI", //gallon (UK)
        "GA": "GLL", //gallon (US)
        "GM": "GM", //gram per square metre
        "GN": "GN", //gross gallon
        "GO": "GO", //milligram per square metre
        "GP": "GP", //milligram per cubic metre
        "GQ": "GQ", //microgram per cubic metre
        "GR": "GRM", //gram
        "GX": "GRN", //grain
        "GS": "GRO", //gross
        "TG": "GT", //gross ton
        "GV": "GV", //gigajoule
        "GW": "GW", //gallon per thousand cubic foot
        "GY": "GY", //gross yard
        "GZ": "GZ", //gage system
        "H1": "H1", //half page â€“ electronic
        "H2": "H2", //half litre
        "PC": "H87", //piece
        "HA": "HA", //hank
        "HQ": "HAR", //hectare
        "HB": "HBX", //hundred boxes
        "HC": "HC", //hundred count
        "HD": "HD", //half dozen
        "HE": "HE", //hundredth of a carat
        "HF": "HF", //hundred foot
        "HG": "HGM", //hectogram
        "HH": "HH", //hundred cubic foot
        "HI": "HI", //hundred sheet
        "HJ": "HJ", //metric horse power
        "HK": "HK", //hundred kilogram
        "HL": "HL", //hundred foot (linear)
        "H4": "HLT", //hectolitre
        "HM": "HM", //mile per hour (statute mile)
        "E1": "HMT", //hectometre
        "HN": "HN", //conventional millimetre of mercury
        "HO": "HO", //hundred troy ounce
        "HP": "HP", //conventional millimetre of water
        "HS": "HS", //hundred square foot
        "HT": "HT", //half hour
        "HZ": "HTZ", //hertz
        "HR": "HUR", //hour
        "HY": "HY", //hundred yard
        "IA": "IA", //inch pound (pound inch)
        "IC": "IC", //count per inch
        "IE": "IE", //person
        "IF": "IF", //inches of water
        "II": "II", //column inch
        "IL": "IL", //inch per minute
        "IM": "IM", //impression
        "IN": "INH", //inch
        "SI": "INK", //square inch
        "CI": "INQ", //cubic inch
        "IP": "IP", //insurance policy
        "IT": "IT", //count per centimetre
        "IU": "IU", //inch per second
        "IV": "IV", //inch per second squared
        "J2": "J2", //joule per kilogram
        "JB": "JB", //jumbo
        "JE": "JE", //joule per kelvin
        "JU": "JG", //jug
        "JK": "JK", //megajoule per kilogram
        "JM": "JM", //megajoule per cubic metre
        "JO": "JO", //joint
        "86": "JOU", //joule
        "JR": "JR", //jar
        "K1": "K1", //kilowatt demand
        "K2": "K2", //kilovolt ampere reactive demand
        "K3": "K3", //kilovolt ampere reactive hour
        "K5": "K5", //kilovolt ampere (reactive)
        "K6": "K6", //kilolitre
        "KA": "KA", //cake
        "KB": "KB", //kilocharacter
        "KD": "KD", //kilogram decimal
        "KV": "KEL", //kelvin
        "KF": "KF", //kilopacket
        "KE": "KG", //keg
        "KG": "KGM", //kilogram
        "KI": "KI", //kilogram per millimetre width
        "KJ": "KJ", //kilosegment
        "KL": "KL", //kilogram per metre
        "KP": "KMH", //kilometre per hour
        "8U": "KMK", //square kilometre
        "KC": "KMQ", //kilogram per cubic metre
        "DK": "KMT", //kilometre
        "EH": "KNT", //knot
        "KO": "KO", //milliequivalence caustic potash per gram of product
        "KQ": "KPA", //kilopascal
        "KR": "KR", //kiloroentgen
        "KS": "KS", //thousand pound per square inch
        "KT": "KT", //kit
        "K4": "KVA", //kilovolt - ampere
        "KW": "KW", //kilogram per millimetre
        "KH": "KWH", //kilowatt hour
        "K7": "KWT", //kilowatt
        "KX": "KX", //millilitre per kilogram
        "L2": "L2", //litre per minute
        "LA": "LA", //pound per cubic inch
        "LB": "LBR", //pound
        "TX": "LBT", //troy pound (US)
        "LC": "LC", //linear centimetre
        "LQ": "LD", //litre per day
        "LE": "LE", //lite
        "X7": "LEF", //leaf
        "LF": "LF", //linear foot
        "LH": "LH", //labour hour
        "LI": "LI", //linear inch
        "LJ": "LJ", //large spray
        "LK": "LK", //link
        "LM": "LM", //linear metre
        "LN": "LN", //length
        "LO": "LO", //lot  [unit of procurement]
        "LP": "LP", //liquid pound
        "LR": "LR", //layer
        "LS": "LS", //lump sum
        "LG": "LTN", //ton (UK) or long ton (US)
        "LT": "LTR", //litre
        "LX": "LX", //linear yard per pound
        "LY": "LY", //linear yard
        "M0": "M0", //magnetic tape
        "M1": "M1", //milligram per litre
        "M4": "M4", //monetary value
        "M5": "M5", //microcurie
        "M7": "M7", //micro-inch
        "M9": "M9", //million Btu per 1000 cubic foot
        "MA": "MA", //machine per unit
        "TM": "MBF", //thousand board foot
        "M6": "MBR", //millibar
        "MC": "MC", //microgram
        "MU": "MCU", //millicurie
        "MD": "MD", //air dry metric ton
        "MF": "MF", //milligram per square foot per side
        "ME": "MGM", //milligram
        "N6": "MHZ", //megahertz
        "SB": "MIK", //square mile (statute mile)
        "TH": "MIL", //thousand
        "MJ": "MIN", //minute [unit of time]
        "MK": "MK", //milligram per square inch
        "ML": "MLT", //millilitre
        "MS": "MMK", //square millimetre
        "MM": "MMT", //millimetre
        "MO": "MON", //month
        "M8": "MPA", //megapascal
        "MQ": "MQ", //thousand metre
        "4V": "MQH", //cubic metre per hour
        "4J": "MSK", //metre per second squared
        "M3": "MT", //mat
        "SM": "MTK", //square metre
        "CR": "MTQ", //cubic metre
        "MR": "MTR", //metre
        "4I": "MTS", //metre per second
        "MV": "MV", //number of mults
        "T9": "MWH", //megawatt hour (1000Â kW.h)
        "N1": "N1", //pen calorie
        "N2": "N2", //number of lines
        "N3": "N3", //print point
        "NA": "NA", //milligram per kilogram
        "NB": "NB", //barge
        "NC": "NC", //car
        "ND": "ND", //net barrel
        "NE": "NE", //net litre
        "NW": "NEW", //newton
        "NF": "NF", //message
        "NG": "NG", //net gallon (us)
        "NH": "NH", //message hour
        "NI": "NI", //net imperial gallon
        "NJ": "NJ", //number of screens
        "NL": "NL", //load
        "NM": "NMI", //nautical mile
        "NN": "NN", //train
        "NQ": "NQ", //mho
        "NR": "NR", //micromho
        "MN": "NT", //net ton
        "NU": "NU", //newton metre
        "NV": "NV", //vehicle
        "NX": "NX", //part per thousand
        "NY": "NY", //pound per air dry metric ton
        "OA": "OA", //panel
        "82": "OHM", //ohm
        "ON": "ON", //ounce per square yard
        "OP": "OP", //two pack
        "OT": "OT", //overtime hour
        "OZ": "OZ", //ounce av
        "FO": "OZA", //fluid ounce (US)
        "FZ": "OZI", //fluid ounce (UK)
        "P0": "P0", //page - electronic
        "P1": "P1", //percent
        "P2": "P2", //pound per foot
        "P3": "P3", //three pack
        "P4": "P4", //four pack
        "P5": "P5", //five pack
        "P6": "P6", //six pack
        "P7": "P7", //seven pack
        "P8": "P8", //eight pack
        "P9": "P9", //nine pack
        "12": "PA", //packet
        "4S": "PAL", //pascal
        "PB": "PB", //pair inch
        "PD": "PD", //pad
        "PE": "PE", //pound equivalent
        "PF": "PF", //pallet (lift)
        "PP": "PG", //plate
        "PI": "PI", //pitch
        "PK": "PK", //pack
        "PA": "PL", //pail
        "PM": "PM", //pound percentage
        "PN": "PN", //pound net
        "PO": "PO", //pound per inch of length
        "PQ": "PQ", //page per inch
        "PR": "PR", //pair
        "PS": "PS", //pound-force per square inch
        "PT": "PT", //pint (US)
        "Q2": "PTD", //dry pint (US)
        "PX": "PTI", //pint (UK)
        "TY": "PU", //tray / tray pack
        "PV": "PV", //half pint (US)
        "PW": "PW", //pound per inch of width
        "PY": "PY", //peck dry (US)
        "PZ": "PZ", //peck dry (UK)
        "Q3": "Q3", //meal
        "QA": "QA", //page - facsimile
        "Q1": "QAN", //quarter (of a year)
        "QB": "QB", //page - hardcopy
        "QD": "QD", //quarter dozen
        "QH": "QH", //quarter hour
        "QK": "QK", //quarter kilogram
        "QR": "QR", //quire
        "QT": "QT", //quart (US)
        "QS": "QTD", //dry quart (US)
        "QU": "QTI", //quart (UK)
        "R1": "R1", //pica
        "R4": "R4", //calorie
        "R9": "R9", //thousand cubic metre
        "RA": "RA", //rack
        "RD": "RD", //rod
        "RG": "RG", //ring
        "RH": "RH", //running or operating hour
        "RK": "RK", //roll metric measure
        "RE": "RL", //reel
        "RM": "RM", //ream
        "RN": "RN", //ream metric measure
        "RL": "RO", //roll
        "RP": "RP", //pound per ream
        "R3": "RPM", //revolutions per minute
        "RS": "RS", //reset
        "RT": "RT", //revenue ton mile
        "RU": "RU", //run
        "S3": "S3", //square foot per second
        "S4": "S4", //square metre per second
        "S5": "S5", //sixty fourths of an inch
        "S6": "S6", //session
        "S7": "S7", //storage unit
        "S8": "S8", //standard advertising unit
        "SJ": "SA", //sack
        "SD": "SD", //solid pound
        "SE": "SE", //section
        "03": "SEC", //second [unit of time]
        "ST": "SET", //set
        "SG": "SG", //segment
        "67": "SIE", //siemens
        "SK": "SK", //split tank truck
        "S9": "SL", //slipsheet
        "02": "SMI", //mile (statute mile)
        "SN": "SN", //square rod
        "SO": "SO", //spool
        "SP": "SP", //shelf package
        "SQ": "SQ", //square
        "SR": "SR", //strip
        "SS": "SS", //sheet metric measure
        "SH": "ST", //sheet
        "TN": "STN", //ton (US) or short ton (UK/US)
        "SV": "SV", //skid
        "SW": "SW", //skein
        "SX": "SX", //shipment
        "T0": "T0", //telecommunication line in service
        "T1": "T1", //thousand pound gross
        "T3": "T3", //thousand piece
        "T4": "T4", //thousand bag
        "T5": "T5", //thousand casing
        "T6": "T6", //thousand gallon (US)
        "T7": "T7", //thousand impression
        "T8": "T8", //thousand linear inch
        "TA": "TA", //tenth cubic foot
        "TC": "TC", //truckload
        "TD": "TD", //therm
        "TE": "TE", //tote
        "TF": "TF", //ten square yard
        "TI": "TI", //thousand square inch
        "TJ": "TJ", //thousand square centimetre
        "TK": "TK", //tank. rectangular
        "TL": "TL", //thousand foot (linear)
        "MP": "TNE", //tonne (metric ton)
        "TP": "TP", //ten pack
        "TQ": "TQ", //thousand foot
        "TR": "TR", //ten square foot
        "TS": "TS", //thousand square foot
        "TT": "TT", //thousand linear metre
        "TB": "TU", //tube
        "TV": "TV", //thousand kilogram
        "TW": "TW", //thousand sheet
        "U1": "U1", //treatment
        "U2": "U2", //tablet
        "UA": "UA", //torr
        "UB": "UB", //telecommunication line in service average
        "UC": "UC", //telecommunication port
        "UD": "UD", //tenth minute
        "UE": "UE", //tenth hour
        "UF": "UF", //usage per telecommunication line average
        "UH": "UH", //ten thousand yard
        "UM": "UM", //million unit
        "VA": "VA", //volt - ampere per kilogram
        "VI": "VI", //vial
        "70": "VLT", //volt
        "BN": "VQ", //bulk
        "VS": "VS", //visit
        "W2": "W2", //wet kilo
        "WA": "WA", //watt per kilogram
        "WB": "WB", //wet pound
        "8C": "WCD", //cord
        "WE": "WE", //wet ton
        "WK": "WEE", //week
        "WG": "WG", //wine gallon
        "WH": "WH", //wheel
        "WI": "WI", //weight per square inch
        "WM": "WM", //working month
        "WR": "WR", //wrap
        "99": "WTT", //watt
        "WW": "WW", //millilitre of water
        "X1": "X1", //Gunter's chain
        "SY": "YDK", //square yard
        "CY": "YDQ", //cubic yard
        "YL": "YL", //hundred linear yard
        "YD": "YRD", //yard
        "YT": "YT", //ten yard
        "Z1": "Z1", //lift van
        "Z3": "Z3", //cask
        "Z4": "Z4", //hogshead
        "Z5": "Z5", //lug
        "Z6": "Z6", //conference point
        "Z8": "Z8", //newspage agate line
        "ZP": "ZP", //page
        // "ZZ":"ZZ", //mutually defined

    }
    static mapMEA738: Object = {
        "G": "grossWeight", //grossWeight
        "GW": "unitGrossWeight", //unitGrossWeight
        "HT": "height", //height
        "LN": "length", //length
        "N": "unitNetWeight", //unitNetWeight
        "VOL": "volume", //volume
        "VWT": "grossVolume", //grossVolume
        "WD": "width", //width
        "WT": "weight", //weight
    }
    static mapRejectionReason: Object = {
        "duplicate order": "duplicateOrder", // Duplicate Order
        "incorrect delivery date": "incorrectDeliveryDate", // Incorrect Delivery Date
        "incorrect description": "incorrectDescription", // Incorrect Description
        "incorrect price": "incorrectPrice", // Incorrect Price
        "incorrect quantity": "incorrectQuantity", // Incorrect Quantity
        "incorrect stock/part number": "incorrectStockPartNumber", // Incorrect Stock/Part Number
        "incorrect supplier code used": "incorrectSupplierCodeUsed", // Incorrect Supplier Code Used
        "incorrect uom": "incorrectUOM", // Incorrect UOM
        "not our product line": "notOurProductLine", // Not our Product Line
        "unable to supply item(s)": "unableToSupplyItems", // Unable to Supply Item(s)
        "other": "other", // Other

    }
}