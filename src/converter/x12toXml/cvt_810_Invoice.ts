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
import { TidyContact, TidyItemID, TidyModification, TidyTax, TidyTaxDetail } from "../xmlTidy/TidyCommon";
import { TidyDiscount, TidyInvoiceDetailHeaderOrder, TidyInvoiceDetailItem, TidyInvoiceDetailItemReference, TidyInvoiceDetailItemReferenceRetail, TidyInvoiceDetailItemRetail, TidyInvoiceDetailLineShipping, TidyInvoiceDetailOrder, TidyInvoiceDetailOrderInfo, TidyInvoiceDetailOrderSummary, TidyInvoiceDetailRequest, TidyInvoiceDetailRequestHeader, TidyInvoiceDetailServiceItem, TidyInvoiceDetailServiceItemReference, TidyInvoiceDetailShipping, TidyInvoiceDetailSummary, TidyInvoicePartner, TidyModificationDetail } from "../xmlTidy/Invoice";


/**
 * No need to make singleton because we always need the latest AST and vscode.document
 * to do the check. Just create new one even in ediDiagnostic
 */
export class Cvt_810_Invoice extends ConverterBase {
    private _bNonPO = false;
    private _CUR02: string;
    private _CUR05: string;
    private _CUR02_Line; // IT1 line item level Currency
    private _CUR05_Line; // IT1 line item level AlternateCurrency
    private _bIsHeaderInvoice = false;
    private _tInvDReqH: TidyInvoiceDetailRequestHeader;
    private _REF01AH128: EdiSegment;
    private _REF01PO128: EdiSegment;
    private _REF01VN128: EdiSegment;
    private _REF01MA128: EdiSegment;
    private _tInvDOrderInfo: TidyInvoiceDetailOrderInfo
    private _receiptDate;
    private _tInvDItemRef: TidyInvoiceDetailItemReference
    private _tTax_SAC: TidyTax;
    private _tInvDLineShipping: TidyInvoiceDetailLineShipping;

    constructor(astTree: ASTNode) {
        super(astTree);
    }

    public toXMLCheck(document?: vscode.TextDocument): vscode.Diagnostic[] {
        this._document = document;
        this._clearDiags(); // clear previouse check results

        this._chkUsageIndicator();

        let BIG = this._rseg("BIG");

        // <InvoiceDetailRequest><InvoiceDetailRequestHeader @invoiceDate>
        let invoiceDate = this._segVal(BIG, 1);
        this._chkBIG01(BIG);
        this._chkBIG03(BIG);
        return this._cvtDiags;
    }

    public toXML(): string {
        this.toXMLCheck();
        if (this._hasConvertErr()) {
            return this._renderConvertErr();
        }

        const cxml = create().ele('cXML').dtd({
            sysID: 'http://xml.cxml.org/schemas/cXML/1.2.060/InvoiceDetail.dtd'
        });

        // header supplier2buyer
        this._header_supplier_to_buyer(cxml);

        let eRequest = cxml.ele(XML.Request);
        let tInvDReq = new TidyInvoiceDetailRequest();
        this._tInvDReqH = new TidyInvoiceDetailRequestHeader();

        let usageIndicator = this._segVal("ISA", 15);
        eRequest.att(XML.deploymentMode, CUtilX12.usageIndicatorXML(usageIndicator));

        let eTmpExtrinsic = this._tInvDReqH.Extrinsic.ele(XML.Extrinsic);
        eTmpExtrinsic.att('name', XML.invoiceSubmissionMethod);
        eTmpExtrinsic.txt(XML.CIG_X12);

        // ST , do nothing

        // BIG
        let BIG = this._rseg("BIG");

        // <InvoiceDetailRequest><InvoiceDetailRequestHeader @invoiceDate>
        let invoiceDate = this._segVal(BIG, 1);
        let tmpDate = Utils.dateStrFromCCYYMMDD(invoiceDate);
        this._tInvDReqH.att('invoiceDate', tmpDate);

        this._tInvDReqH.att('invoiceID', this._segVal(BIG, 2));

        let REF01AH128 = this._rSegByEleVal(X12.REF, 1, 'AH');
        let REF01PO128 = this._rSegByEleVal(X12.REF, 1, 'PO');
        let REF01VN128 = this._rSegByEleVal(X12.REF, 1, 'VN');
        let REF01MA128 = this._rSegByEleVal(X12.REF, 1, 'MA');
        let vBIG04 = this._segVal(BIG, 4)

        if (!vBIG04 || vBIG04 == 'NONPO') {
            this._bNonPO = true;
            // BIG04 = "NONPO"
            eTmpExtrinsic = this._tInvDReqH.Extrinsic.ele(XML.Extrinsic);
            eTmpExtrinsic.att('name', 'invoiceSourceDocument');
            eTmpExtrinsic.txt('ExternalPurchaseOrder')
        } else if (!vBIG04) {
            // BIG04 is blank
            if (!REF01PO128 && !REF01AH128 && !REF01VN128) {
                // REF [128=PO], [128=VN], [128=AH] are not provided
                // if (IT106PO235 || IT108VO235) {
                //     // IT1 [234 with 235=PO and/or VO] is sent
                //     // create - [HEADER INVOICE] InvoiceDetailHeaderIndicator @isHeaderInvoice="yes"/>
                //     invoiceDetailRequestHeader.ele('InvoiceDetailHeaderIndicator')
                //         .att('isHeaderInvoice', 'yes')
                // }
                eTmpExtrinsic = this._tInvDReqH.Extrinsic.ele(XML.Extrinsic);
                eTmpExtrinsic.att('name', 'invoiceSourceDocument');
                eTmpExtrinsic.txt('NoOrderInformation')
            }
        }

        this._tInvDReqH.att('purpose',
            CUtilX12.transactionTypeCodeXML(this._segVal(BIG, 7)));

        let BIG07Value = this._segVal(BIG, 7);
        if (BIG07Value && (BIG07Value == 'CR' || BIG07Value == 'DR')) {
            this._tInvDReqH.InvoiceDetailHeaderIndicator.ele('InvoiceDetailHeaderIndicator')
                .att('isHeaderInvoice', 'yes')
            this._bIsHeaderInvoice = true;
        } else {
            // create a blank one
            this._tInvDReqH.InvoiceDetailHeaderIndicator.ele('InvoiceDetailHeaderIndicator');
        }

        // <InvoiceDetailRequest><InvoiceDetailRequestHeader @operation>
        this._tInvDReqH.att('operation',
            CUtilX12.transactionSetPurposeCode(this._segVal(BIG, 8)));

        // Action Code, Map to cXML if value is "NA". 
        // Hardcode to "yes"
        let actionCode = this._segVal(BIG, 9)
        if (actionCode && actionCode == 'NA') {
            this._tInvDReqH.att('isInformationOnly', 'yes');
        }

        // let invoicePartner = invoiceDetailRequestHeader.ele('InvoicePartner');
        // let contactFrom: XMLBuilder;
        // NTE
        this._NTE(this._tInvDReqH);

        // ROOT_CUR // CUR
        let CUR = this._rseg('CUR');

        // Exchange Rate
        let exchangeRate = this._segVal(CUR, 3);
        this._tInvDReqH.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, 'taxExchangeRate').txt(exchangeRate);

        // Currency Code
        this._CUR02 = this._segVal(CUR, 2);
        this._CUR05 = this._segVal(CUR, 5);

        this._tInvDOrderInfo = new TidyInvoiceDetailOrderInfo();
        // REF
        this._ROOT_REF();

        let tInvDShipping = new TidyInvoiceDetailShipping();
        // N1
        // let N1Nodes = this._astTree.children.filter(n => n.fullPath = 'ROOT_N1') // all group N1 nodes
        // N1 Group, InvoicePartner
        let grpN1s = this._rGrps('N1');
        for (let grpN1 of grpN1s) {
            this._fillN1Grp_InvoicePartner(grpN1, this._tInvDReqH.InvoicePartner);
        }
        // N1 Group, InvoiceDetailShipping
        for (let grpN1 of grpN1s) {
            this._fillN1Grp_InvoiceDetailShipping(grpN1, tInvDShipping);
        }
        if (!tInvDShipping.isEmpty()) {
            tInvDShipping.sendTo(this._tInvDReqH.InvoiceDetailShipping.ele('InvoiceDetailShipping'));
        }

        // ITD
        this._Header_ITD();

        // DTM
        this._ROOT_DTM();

        // N9
        let gN9 = this._rGrp1('N9');
        let N9 = this._dSeg1(gN9, 'N9');
        if (N9) {
            let vLang = this._segVal(N9, 2);
            vLang = vLang ? vLang : 'en';
            let MSGs = this._dSegs(gN9, 'MSG');
            for (let MSG of MSGs) {
                this._ele2(this._tInvDReqH.Comments, 'Comments').att(XML.lang, vLang).txt(this._segVal(MSG, 1));
            }
        }

        // <InvoiceDetailOrder>
        let gIT1s = this._rGrps('IT1');

        if (this._bIsHeaderInvoice) {
            let tInvDHeaderOrder = this._IT1_PO_Header(gIT1s[0]);
            tInvDHeaderOrder.sendTo(tInvDReq.InvoiceDetailHeaderOrder.ele('InvoiceDetailHeaderOrder'));
        } else {
            this._Non_Header_Orders(REF01PO128, REF01MA128, BIG, gIT1s, tInvDReq);
        }

        let tInvDSummary = new TidyInvoiceDetailSummary();
        this._tTax_SAC = new TidyTax();
        // Since some COMMON functions are using _CUR02_Line and _CUR05_Line
        // we set both back to Root Level variable not line level, a bit little tricky but seems workable
        this._CUR02_Line = this._CUR02;
        this._CUR05_Line = this._CUR05;

        // TDS
        this._TDS(tInvDSummary);
        // AMT
        this._AMT(tInvDSummary);

        // SAC
        this._SAC_Summary(tInvDSummary);
        if (!this._tTax_SAC.isEmpty()) {
            this._tTax_SAC.sendTo(tInvDSummary.Tax.ele('Tax'));
        }

        // CTT
        this._tInvDReqH.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, 'totalNumberOfLineItems').txt(gIT1s.length.toString());

        // invoiceOrigin, cannot find the description in MapSpec, but in CIG result,
        // So I add a constant value
        this._tInvDReqH.att('invoiceOrigin', 'supplier');

        this._tInvDReqH.sendTo(tInvDReq.InvoiceDetailRequestHeader.ele(XML.InvoiceDetailRequestHeader));
        tInvDSummary.sendTo(tInvDReq.InvoiceDetailSummary.ele('InvoiceDetailSummary'));
        tInvDReq.sendTo(eRequest.ele('InvoiceDetailRequest'));
        const xml = cxml.end({ prettyPrint: true, indent: '    ', spaceBeforeSlash: false });
        return xml;

    }

    private _Non_Header_Orders(REF01PO128: EdiSegment, REF01MA128: EdiSegment, BIG: EdiSegment, gIT1s: ASTNode[], tInvDReq: TidyInvoiceDetailRequest) {
        let vBIG04 = this._segVal(BIG, 4);
        let headerPO: string;
        let headerPODate: string;
        let headerMA: string;
        if (REF01PO128) {
            headerPO = this._segVal(REF01PO128, 2);
            let tmpSeg = this._rSegByEleVal('DTM', 1, '004');
            headerPODate = this._segVal(tmpSeg, 2);
        } else {
            headerPO = vBIG04;
            headerPODate = this._segVal(BIG, 3);
        }

        if (REF01MA128) {
            headerMA = this._segVal(headerMA, 2);
        }
        const mapInvoiceDetailOrder: { [POMA: string]: TidyInvoiceDetailOrder; } = {};
        for (let gIT1 of gIT1s) {
            let REFMA = this._segByEleVal(gIT1, 'REF', 1, 'MA');
            let REFPO = this._segByEleVal(gIT1, 'REF', 1, 'PO');
            let DTMPODate = this._segByEleVal(gIT1, 'DTM', 1, '004');
            let it1PO: string;
            let it1PODate: string;
            let it1MA: string;
            if (REFPO) {
                it1PO = this._segVal(REFPO, 2);
                it1PODate = this._segVal(DTMPODate, 2);
            } else {
                it1PO = headerPO;
                it1PODate = headerPODate;
            }
            if (REFMA) {
                it1MA = this._segVal(REFMA, 2);
            } else {
                it1MA = headerMA;
            }
            let keyStr = 'PO_' + it1PO + 'MA_' + it1MA;

            if (!mapInvoiceDetailOrder[keyStr]) {
                mapInvoiceDetailOrder[keyStr] = new TidyInvoiceDetailOrder();
                // first time create node
                this._fillInvoiceDetailOrder(it1PO, it1PODate, it1MA, gIT1, mapInvoiceDetailOrder[keyStr]);
            }

            this._fillInvoiceDetailItem(mapInvoiceDetailOrder[keyStr], gIT1);
            if (!this._tInvDOrderInfo.isEmpty()) {
                this._tInvDOrderInfo.sendTo(mapInvoiceDetailOrder[keyStr].InvoiceDetailOrderInfo.ele('InvoiceDetailOrderInfo'));
            }
        } // end loop gIT1

        // flush to tInvDReq
        for (const key in mapInvoiceDetailOrder) {
            if (mapInvoiceDetailOrder.hasOwnProperty(key)) {
                let tDetailOrder = mapInvoiceDetailOrder[key];
                tDetailOrder.sendTo(tInvDReq.InvoiceDetailOrder.ele('InvoiceDetailOrder'));
            }
        }
    }

    private _NTE(tExtrinsicParent: TidyInvoiceDetailRequestHeader | TidyContact) {
        let NTE_REG = this._rSegByEleVal('NTE', 1, 'REG');
        let NTE_CBH = this._rSegByEleVal('NTE', 1, 'CBH');
        if (NTE_REG) {
            let NTE01 = this._segVal(NTE_REG, 1);
            let NTE02 = this._segVal(NTE_REG, 2);
            // contactFrom = invoicePartner.ele('Contact');
            // contactFrom.att('role', 'from');
            let eTmpExtrinsic;
            eTmpExtrinsic = tExtrinsicParent.Extrinsic.ele(XML.Extrinsic);
            eTmpExtrinsic.att('name', 'LegalStatus');
            eTmpExtrinsic.txt(NTE02);
            // add contactFrom later
        }

        if (NTE_CBH) {
            let NTE01 = this._segVal(NTE_CBH, 1);
            let NTE02 = this._segVal(NTE_CBH, 2);
            // contactFrom = invoicePartner.ele('Contact');
            // contactFrom.att('role', 'from');
            let eTmpExtrinsic;

            let arr = NTE02.split(' ');
            let amt = arr[0];
            let cur = arr[1];

            eTmpExtrinsic = tExtrinsicParent.Extrinsic.ele(XML.Extrinsic);
            eTmpExtrinsic.att('name', 'LegalCapital');
            eTmpExtrinsic.ele('Money').att(XML.currency, cur).txt(amt);
            // add contactFrom later
        }
    }

    private _ROOT_REF() {
        let eShipNoticeIDInfo: XMLBuilder;
        let REFs = this._rSegs('REF');
        for (let REF of REFs) {
            let v1 = this._segVal(REF, 1);
            let v2 = this._segVal(REF, 2);
            let v3 = this._segVal(REF, 3);
            switch (v1) {
                case 'AH':
                    this._REF01AH128 = REF;
                    break;
                case 'PO':
                    this._REF01PO128 = REF;
                    break;
                case 'VN':
                    this._REF01VN128 = REF;
                    break;
                case 'I5':
                    this._tInvDReqH.InvoiceIDInfo.ele('InvoiceIDInfo')
                        .att('invoiceID', v2);
                    break;
                case 'IV':
                    this._tInvDReqH.att('invoiceID', v2);
                    break;
                case 'MA':
                    this._REF01MA128 = REF;
                    eShipNoticeIDInfo = this._ele2(this._tInvDReqH.ShipNoticeIDInfo, 'ShipNoticeIDInfo');
                    eShipNoticeIDInfo.att('shipNoticeID', v2);
                    break;
                case 'PK':
                    eShipNoticeIDInfo = this._ele2(this._tInvDReqH.ShipNoticeIDInfo, 'ShipNoticeIDInfo');
                    eShipNoticeIDInfo.ele('IdReference').att('domain', 'packListID').att('identifier', v2);
                    break;
                case 'BM':
                    eShipNoticeIDInfo = this._ele2(this._tInvDReqH.ShipNoticeIDInfo, 'ShipNoticeIDInfo');
                    eShipNoticeIDInfo.ele('IdReference').att('domain', 'freightBillID').att('identifier', v2);
                    break;
                case 'EU':
                    this._tInvDReqH.Extrinsic.ele(XML.Extrinsic).att('name', 'ultimateCustomerReferenceID')
                        .txt(v2);
                    break;
                case 'KK':
                    this._tInvDReqH.Extrinsic.ele(XML.Extrinsic).att('name', 'DeliveryNoteNumber')
                        .txt(v2);
                    break;
                case 'CR':
                    this._tInvDReqH.IdReference.ele('IdReference').att('identifier', v2).att('domain', 'customerReferenceID');
                    break;
                case '4N':
                    this._tInvDReqH.PaymentProposalIDInfo.ele('PaymentProposalIDInfo')
                        .att('paymentProposalID', v2);
                    break;
                case 'ZZ':
                    // REF ZZ
                    this._tInvDReqH.Extrinsic.ele('Extrinsic')
                        .att('name', v2).txt(v3);
                    break;
                default:
                    let vMappedV1 = this._mcs(MAPS.mapREF, v1);
                    if (vMappedV1) {
                        this._tInvDReqH.Extrinsic.ele('Extrinsic')
                            .att('name', vMappedV1).txt(v2 + v3);
                    }
                    break;
            } // end switch v1
        } // end loop REFs
    }

    private _SAC_Summary(tInvDSummary: TidyInvoiceDetailSummary) {
        let gSACs = this._rGrps('SAC');
        for (let gSAC of gSACs) {
            let SAC = this._dSeg1(gSAC, 'SAC');
            let v1 = this._segVal(SAC, 1); // A Allowance , C Charge
            let v2 = this._segVal(SAC, 2);
            let v12 = this._segVal(SAC, 2);
            let tMod = new TidyModification();
            let tModD = new TidyModificationDetail();
            if (v1 == 'A') {
                if (v2 == 'C310') {
                    this._SAC_Summary_A_C310(SAC, tInvDSummary);
                } else {
                    this._SAC_Summary_A(SAC, tModD, tMod, gSAC, v1);
                }
            } else if (v1 == 'C') {
                // C Charge
                if (v2 == 'H850') {
                    // Tax
                    this._SAC_Summary_C_H850(SAC, tInvDSummary, gSAC, v1);
                } else if (v2 == 'H090') {
                    // InvoiceDetailLineSpecialHandling
                    this._SAC_Summary_C_H090(SAC, tInvDSummary, gSAC, v1);
                } else if (v2 == 'G830') {
                    // ShippingAmount
                    this._SAC_Summary_C_G830(SAC, tInvDSummary, gSAC, v1);
                }
                else {
                    this._SAC_Summary_C(SAC, tModD, tMod, gSAC, v1);
                }
            }

            if (!tModD.isEmpty()) {
                tModD.sendTo(tMod.ModificationDetail.ele('ModificationDetail'));
            }
            if (!tMod.isEmpty()) {
                tMod.sendTo(this._ele2(tInvDSummary.InvoiceHeaderModifications, 'InvoiceHeaderModifications').ele('Modification'));
            }
        }
    }

    private _AMT(tInvDSummary: TidyInvoiceDetailSummary) {
        let AMTs = this._rSegs('AMT');
        let arrCUR02Done: string[] = [];
        for (let AMT of AMTs) {
            let vAMT1 = this._segVal(AMT, 1);
            let vAMT2 = this._segVal(AMT, 2);
            switch (vAMT1) {
                case '3':
                    this._ele3(tInvDSummary.DepositAmount, 'DepositAmount', XML.Money).att(XML.currency, this._CUR02)
                        .txt(vAMT2);
                    break;
                case 'GW':
                    this._ele3(tInvDSummary.TotalCharges, 'TotalCharges', XML.Money).att(XML.currency, this._CUR02)
                        .txt(vAMT2);
                    break;
                case 'EC':
                    this._ele3(tInvDSummary.TotalAllowances, 'TotalAllowances', XML.Money).att(XML.currency, this._CUR02)
                        .txt(vAMT2);
                    break;
                case 'N':
                    this._ele3(tInvDSummary.NetAmount, 'NetAmount', XML.Money).att(XML.currency, this._CUR02)
                        .txt(vAMT2);
                    break;
                case '1':
                    if (arrCUR02Done.includes(vAMT1)) {
                        // Alternate Currency
                        this._ele3(tInvDSummary.SubtotalAmount, 'SubtotalAmount', XML.Money).att(XML.alternateCurrency, this._CUR05)
                            .att(XML.alternateAmount, vAMT2);
                    } else {
                        // remove Data set by TDS
                        this._ele2(tInvDSummary.SubtotalAmount, 'SubtotalAmount').remove();
                        // Basic Currency
                        this._ele3(tInvDSummary.SubtotalAmount, 'SubtotalAmount', XML.Money).att(XML.currency, this._CUR02)
                            .txt(vAMT2);
                        arrCUR02Done.push(vAMT1);
                    }
                    break;
                case 'BAP':
                    if (arrCUR02Done.includes(vAMT1)) {
                        // Alternate Currency
                        this._ele3(tInvDSummary.DueAmount, 'DueAmount', XML.Money).att(XML.alternateCurrency, this._CUR05)
                            .att(XML.alternateAmount, vAMT2);
                    } else {
                        // remove Data set by TDS
                        this._ele2(tInvDSummary.DueAmount, 'DueAmount').remove();
                        // Basic Currency
                        this._ele3(tInvDSummary.DueAmount, 'DueAmount', XML.Money).att(XML.currency, this._CUR02)
                            .txt(vAMT2);
                        arrCUR02Done.push(vAMT1);
                    }

                    break;
                case 'ZZ':
                    if (arrCUR02Done.includes(vAMT1)) {
                        // Alternate Currency
                        this._ele3(tInvDSummary.TotalAmountWithoutTax, 'TotalAmountWithoutTax', XML.Money).att(XML.alternateCurrency, this._CUR05)
                            .att(XML.alternateAmount, vAMT2);
                    } else {
                        // Basic Currency
                        this._ele3(tInvDSummary.TotalAmountWithoutTax, 'TotalAmountWithoutTax', XML.Money).att(XML.currency, this._CUR02)
                            .txt(vAMT2);
                        arrCUR02Done.push(vAMT1);
                    }
                    break;

                default:
                    break;
            }
        }
    }

    private _TDS(tInvDSummary: TidyInvoiceDetailSummary) {
        let TDS = this._rseg('TDS');
        let vTDS1 = this._segVal(TDS, 1);
        let vTDS2 = this._segVal(TDS, 2);
        let vTDS3 = this._segVal(TDS, 3);
        let vTDS4 = this._segVal(TDS, 4);
        if (vTDS1) {
            tInvDSummary.GrossAmount.ele('GrossAmount').ele('Money').att(XML.currency, this._CUR02)
                .txt(this._d100(vTDS1));
        }
        if (vTDS2) {
            tInvDSummary.SubtotalAmount.ele('SubtotalAmount').ele('Money').att(XML.currency, this._CUR02)
                .txt(this._d100(vTDS2));
        }
        if (vTDS3) {
            tInvDSummary.NetAmount.ele('NetAmount').ele('Money').att(XML.currency, this._CUR02)
                .txt(this._d100(vTDS3));
        }
        if (vTDS4) {
            tInvDSummary.DueAmount.ele('DueAmount').ele('Money').att(XML.currency, this._CUR02)
                .txt(this._d100(vTDS4));
        }
    }

    private _ROOT_DTM() {
        let DTMs = this._rSegs('DTM');
        for (let DTM of DTMs) {
            let v1 = this._segVal(DTM, 1);
            let v2 = this._segVal(DTM, 2);
            let v3 = this._segVal(DTM, 3);
            let v4 = this._segVal(DTM, 4);
            let theDate = Utils.dateStrFromREFDTM(v2 + v3 + v4, false);
            let eInvoiceIDInfo;
            switch (v1) {
                case '003':
                    this._tInvDReqH.att('invoiceDate', theDate);
                    break;
                case '922':
                    eInvoiceIDInfo = this._ele2(this._tInvDReqH.InvoiceIDInfo, 'InvoiceIDInfo');
                    eInvoiceIDInfo.att('invoiceDate', theDate);
                    break;
                case '004':
                    if (this._bNonPO) {
                        // let eInvoiceIDInfo = this._ele2(this._tInvDReqH.InvoiceIDInfo, 'InvoiceIDInfo');
                        // eInvoiceIDInfo.att('orderDate', theDate);
                    } else {
                        //  InvoiceDetailOrder><InvoiceDetailOrderInfo><OrderReference
                        this._ele2(this._tInvDOrderInfo.OrderReference, 'OrderReference').att('orderDate', theDate);
                    }
                    break;
                case '008':
                    this._ele2(this._tInvDOrderInfo.SupplierOrderInfo, 'SupplierOrderInfo').att('orderDate', theDate);
                    break;
                case '011':
                    this._ele2(this._tInvDReqH.InvoiceDetailShipping, 'InvoiceDetailShipping').att('shippingDate', theDate);
                    break;
                case '050':
                    this._receiptDate = theDate;
                    break;
                case '111':
                    this._ele2(this._tInvDReqH.ShipNoticeIDInfo, 'ShipNoticeIDInfo').att('shipNoticeDate', theDate);
                    break;
                case '186':
                    this._ele2(this._tInvDReqH.Period, 'Period').att('startDate', theDate);
                    break;
                case '187':
                    this._ele2(this._tInvDReqH.Period, 'Period').att('endDate', theDate);
                    break;
                case 'LEA':
                    this._ele2(this._tInvDOrderInfo.MasterAgreementReference, 'MasterAgreementReference').att('agreementDate', theDate);
                    break;
                default:
                    break;
            }
        }
    }

    private _Header_ITD() {
        let ITDs = this._rSegs('ITD');
        for (let ITD of ITDs) {
            let v1 = this._segVal(ITD, 1);
            let v2 = this._segVal(ITD, 2);
            let v3 = this._segVal(ITD, 3);
            let v4 = this._segVal(ITD, 4);
            let v5 = this._segVal(ITD, 5);
            let v7 = this._segVal(ITD, 7);
            let v8 = this._segVal(ITD, 8);
            let v10 = this._segVal(ITD, 10);
            let v14 = this._segVal(ITD, 14);
            let v15 = this._segVal(ITD, 15);

            // ITD03|08+05 (03|08: positive value=discount/"0"=Net Term*) and 
            // ITD15|10+07 (15|10: negative value=penalty/"0"=Net Term*) 
            // create one <PaymentTerm> each. 

            if (v5) {
                let tDiscount = new TidyDiscount();
                if (v3) {
                    tDiscount.DiscountPercent.ele('DiscountPercent').att('percent', v3);
                }
                if (!v3 && v8) {
                    // 'DiscountPercent' takes priority
                    tDiscount.DiscountAmount.ele('DiscountAmount').ele(XML.Money).txt(v8).att(XML.currency, this._CUR02);
                }
                if (!tDiscount.isEmpty()) {
                    let ePaymentTerm = this._tInvDReqH.PaymentTerm.ele('PaymentTerm');
                    ePaymentTerm.att('payInNumberOfDays', v5);
                    // v15 same as v3 ?
                    tDiscount.sendTo(ePaymentTerm.ele('Discount'));
                    if (v4) {
                        ePaymentTerm.ele(XML.Extrinsic).att(XML.nameXML, 'discountDueDate').txt(v4);
                    }
                    if (v14) {
                        this._tInvDReqH.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, 'paymentMethod').txt(
                            this._mcs(MAPS.mapITD107, v14, 'other')
                        );
                    }
                }
            } // end if v5

            // Negtive Part
            if (v7) {
                let tDiscount = new TidyDiscount();
                if (v15) {
                    tDiscount.DiscountPercent.ele('DiscountPercent').att('percent', this._negSign(v15));
                }

                if (!v15 && v10) {
                    // 'DiscountPercent' takes priority
                    tDiscount.DiscountAmount.ele('DiscountAmount').ele(XML.Money).txt(this._negSign(v10))
                        .att(XML.currency, this._CUR02);
                }
                if (!tDiscount.isEmpty()) {
                    let ePaymentTerm = this._tInvDReqH.PaymentTerm.ele('PaymentTerm');
                    ePaymentTerm.att('payInNumberOfDays', v7);

                    // v15 same as v3 ?
                    tDiscount.sendTo(ePaymentTerm.ele('Discount'));

                    if (v4) {
                        ePaymentTerm.ele(XML.Extrinsic).att(XML.nameXML, 'discountDueDate').txt(v4);
                    }
                    if (v14) {
                        this._tInvDReqH.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, 'paymentMethod').txt(
                            this._mcs(MAPS.mapITD107, v14, 'other')
                        );
                    }
                }
            } // end if v7

        }
    }

    /**
     * Fill In XML tag <InvoiceDetailOrder>
     * @param it1PO 
     * @param it1PODate 
     * @param it1MA 
     * @param it1 
     * @param invoiceDetailOrder 
     */
    protected _fillInvoiceDetailOrder(it1PO: string, it1PODate: string, it1MA: string, it1: ASTNode,
        tInvDOrder: TidyInvoiceDetailOrder) {
        let REF01AH128 = this._segByEleVal(it1, X12.REF, 1, 'AH');
        let REF01PO128 = this._segByEleVal(it1, X12.REF, 1, 'PO');
        let REF01VN128 = this._segByEleVal(it1, X12.REF, 1, 'VN');
        let REF01MA128 = this._segByEleVal(it1, X12.REF, 1, 'MA');

        if (!REF01PO128) {
            // get these from Root REF
            REF01AH128 = this._REF01AH128;
            REF01PO128 = this._REF01PO128;
            REF01VN128 = this._REF01VN128;
            REF01MA128 = this._REF01MA128;
        }

        let BIG = this._rseg("BIG");
        let BIG04 = this._segVal(BIG, 4)

        // REF AH,VN PO
        let masterAgreementIDInfo;
        let eMasterAgreementRef;
        let orderIDInfo;
        let supplierOrderInfo;
        let eOrderRef;


        if (!BIG04 || BIG04 == 'NONPO') {
            // A
            if (REF01AH128) {
                eMasterAgreementRef = this._ele2(this._tInvDOrderInfo.MasterAgreementReference, 'MasterAgreementReference');
                eMasterAgreementRef.ele('DocumentReference').att(XML.payloadID, '');
                eMasterAgreementRef.att('agreementID', this._segVal(REF01AH128, 2))
                eMasterAgreementRef.att('agreementType', 'scheduling_agreement')
            }
            if (REF01PO128) {
                this._ele2(this._tInvDOrderInfo.OrderIDInfo, 'OrderIDInfo').att('orderID', this._segVal(REF01PO128, 2));
            }
            if (REF01VN128) {
                this._ele2(this._tInvDOrderInfo.SupplierOrderInfo, 'SupplierOrderInfo').att('orderID', this._segVal(REF01VN128, 2));
            }
        } else if (REF01AH128 || REF01PO128 || BIG04 !== '') {
            // B
            eOrderRef = this._ele2(this._tInvDOrderInfo.OrderReference, 'OrderReference');
            let orderDate = this._segVal(BIG, 3);
            if (orderDate) {
                let tmpDate = Utils.dateStrFromCCYYMMDD(orderDate);
                eOrderRef.att('orderDate', tmpDate);
            }
            eOrderRef.ele('DocumentReference').att('payloadID', '');
            if (REF01PO128) {
                eOrderRef.att('orderID', this._segVal(REF01PO128, 2));
            } else {
                // BIG04 != ''
                eOrderRef.att('orderID', BIG04);
            }

            if (REF01AH128) {
                eMasterAgreementRef = this._tInvDOrderInfo.MasterAgreementReference.ele('MasterAgreementReference');
                eMasterAgreementRef.att('agreementID', this._segVal(REF01AH128, 2));
                eMasterAgreementRef.att('agreementType', 'scheduling_agreement');
                eMasterAgreementRef.ele('DocumentReference').att('payloadID', '');
            }
            if (REF01VN128) {
                this._ele2(this._tInvDOrderInfo.SupplierOrderInfo, 'SupplierOrderInfo').att('orderID', this._segVal(REF01VN128, 2))
            }
        } else if (REF01VN128) {
            this._ele2(this._tInvDOrderInfo.SupplierOrderInfo, 'SupplierOrderInfo').att('orderID', this._segVal(REF01VN128, 2));
        } else {
            //orderIDInfo = this._tInvDOrderInfo.OrderIDInfo.ele('OrderIDInfo');
        }

        // REF RV
        let REF01RV = this._segByEleVal(it1, X12.REF, 1, 'RV');
        if (REF01RV) {
            let val = this._segVal(REF01RV, 2);
            let invoiceDetailReceiptInfo = this._ele2(tInvDOrder.InvoiceDetailReceiptInfo, 'InvoiceDetailReceiptInfo');
            if (BIG04 && BIG04 != 'NONPO') {
                invoiceDetailReceiptInfo.ele('ReceiptReference').att('receiptID', val).att('receiptDate', this._receiptDate)
                    .ele('DocumentReference').att(XML.payloadID, '');
            } else {
                invoiceDetailReceiptInfo.ele('ReceiptIDInfo').att('receiptID', val).att('receiptDate', this._receiptDate);
            }

        }

    }

    /**
     * Fill In XML tag <InvoiceDetailOrder>
     * Header Invoice don't use this function
     * @param it1PO 
     * @param it1PODate 
     * @param it1MA 
     * @param gIT1 
     * @param tInvDOrder 
     */
    protected _fillInvoiceDetailItem(tInvDOrder: TidyInvoiceDetailOrder, gIT1: ASTNode) {
        let IT1 = this._dSeg1(gIT1, 'IT1');
        let arr235: string[] = [];
        for (let i = 6; i <= 24; i = i + 2) {
            let v235 = this._segVal(IT1, i);
            if (v235) {
                arr235.push(v235);
            }
        }

        let vIT1_01 = this._segVal(IT1, 1);
        let vIT1_02 = this._segVal(IT1, 2);
        let vIT1_03 = this._segVal(IT1, 3);
        let vIT1_04 = this._segVal(IT1, 4);
        this._tInvDItemRef = new TidyInvoiceDetailItemReference();
        this._tInvDLineShipping = new TidyInvoiceDetailLineShipping();
        this._tTax_SAC = new TidyTax();
        if (arr235.includes('VP')) {
            let tItem = this._IT1_VP_One_Seg(IT1);
            this._IT1_VP_Material(gIT1, tInvDOrder, tItem);
            if (!this._tInvDItemRef.isEmpty()) {
                this._tInvDItemRef.sendTo(tItem.InvoiceDetailItemReference.ele('InvoiceDetailItemReference'));
            }
            if (!this._tTax_SAC.isEmpty()) {
                this._tTax_SAC.sendTo(tItem.Tax.ele('Tax'));
            }
            if (!this._tInvDLineShipping.isEmpty()) {
                this._tInvDLineShipping.sendTo(tItem.InvoiceDetailLineShipping.ele('InvoiceDetailLineShipping'));
            }
            tItem.sendTo(tInvDOrder.InvoiceDetailItem.ele('InvoiceDetailItem'));
        } else if (arr235.includes('SH')) {
            let tSItem = this._IT1_SH_Service(gIT1);
            if (!this._tTax_SAC.isEmpty()) {
                this._tTax_SAC.sendTo(tSItem.Tax.ele('Tax'));
            }
            tSItem.sendTo(tInvDOrder.InvoiceDetailServiceItem.ele('InvoiceDetailServiceItem'))

        }


    } // end function


    /**
     * Normal Material Line Item
     * @param gIT1 
     * @param eInvDReqH 
     */
    private _IT1_VP_Material(gIT1: ASTNode, tInvDOrder: TidyInvoiceDetailOrder, tItem: TidyInvoiceDetailItem) {
        let vCUR02_Line;
        let vCUR05_Line;
        // CUR
        let CUR = this._dSeg1(gIT1, 'CUR');
        if (CUR) {
            // save for later use
            vCUR02_Line = this._segVal(CUR, 2);
            vCUR05_Line = this._segVal(CUR, 5);
        }
        this._CUR02_Line = vCUR02_Line ? vCUR02_Line : this._CUR02;
        this._CUR05_Line = vCUR05_Line ? vCUR05_Line : this._CUR05;
        // CTP
        let CTP = this._dSeg1(gIT1, 'CTP');
        if (CTP) {
            let vCTP2 = this._segVal(CTP, 2);
            let vCTP4 = this._segVal(CTP, 4);
            let vCTP501 = this._segVal(CTP, 501);
            let vCTP7 = this._segVal(CTP, 7);
            if (vCTP2 == 'CHG') {
                this._ele2(this._tInvDReqH.InvoiceDetailHeaderIndicator, 'InvoiceDetailLineIndicator').att('isPriceAdjustmentInLine', 'yes');
            }
            if (vCTP4) {
                tItem.PriceBasisQuantity.ele('PriceBasisQuantity').att(XML.quantity, vCTP4)
            }
            if (vCTP501) {
                this._ele2(tItem.PriceBasisQuantity, 'PriceBasisQuantity').ele(XML.UnitOfMeasure).txt(vCTP501);
            }
            if (vCTP7) {
                this._ele2(tItem.PriceBasisQuantity, 'PriceBasisQuantity').att('conversionFactor', vCTP7);
            }
        } // end if CTP
        // PAM
        this._PAM_Material_Service(gIT1, tItem);
        // PID
        this._PID_Material(gIT1, tItem);
        // REF
        this._REF_Material(gIT1, tInvDOrder, tItem);
        // YNQ
        this._YNQ_Material(gIT1, tItem);
        let tInvDShipping = new TidyInvoiceDetailShipping();
        // DTM
        this._DTM_Material(gIT1, tItem, tInvDOrder, tInvDShipping);
        // SAC
        this._SAC_Material(gIT1, tItem);
        // N1 InvoiceDetailShipping
        let gN1s = this._dGrps(gIT1, 'N1');

        for (let gN1 of gN1s) {
            let tContact = new TidyContact();
            this._fillContact(tContact, gN1);

            this._N1_REF_Material_Special(tInvDShipping, gN1);
            tContact.sendTo(tInvDShipping.Contact.ele('Contact'));
        }
        if (!tInvDShipping.isEmpty()) {
            tInvDShipping.sendTo(this._tInvDLineShipping.InvoiceDetailShipping.ele('InvoiceDetailShipping'));
        }

    } // end function


    private _SAC_Material(gIT1: ASTNode, tItem: TidyInvoiceDetailItem) {
        let gSACs = this._dGrps(gIT1, 'SAC');
        for (let gSAC of gSACs) {
            let SAC = this._dSeg1(gSAC, 'SAC');
            let v1 = this._segVal(SAC, 1); // A Allowance , C Charge
            let v2 = this._segVal(SAC, 2);
            let v12 = this._segVal(SAC, 12);
            let tMod = new TidyModification();
            let tModD = new TidyModificationDetail();
            if (v1 == 'A') {
                if (v2 == 'C310') {
                    this._SAC_Common_A_C310(SAC, tItem);
                } else {
                    this._SAC_Material_Service_A(SAC, tModD, tMod, gSAC, v1);
                }
            } else if (v1 == 'C') {
                // C Charge
                if (v2 == 'H850') {
                    // Tax
                    this._SAC_Common_C_H850(SAC, tItem, gSAC, v1);
                } else if (v2 == 'H090') {
                    // InvoiceDetailLineSpecialHandling
                    this._SAC_Material_Header_C_H090(SAC, tItem, gSAC, v1);
                } else if (v2 == 'G830') {
                    // InvoiceDetailLineShipping
                    this._SAC_Material_Header_C_G830(SAC, tItem, gSAC, v1);
                }
                else {
                    this._SAC_Material_Service_C(SAC, tModD, tMod, gSAC, v1);
                }

            } else if (v1 == 'N') {
                // B840
                if (v2 == 'B840') {
                    this._SAC_Common_N_B840(SAC, tItem, gSAC, v1);
                }
            } // end if v1=='A'

            if (!tModD.isEmpty()) {
                tModD.sendTo(tMod.ModificationDetail.ele('ModificationDetail'));
            }
            if (!tMod.isEmpty()) {
                if (v12 == '02') {
                    tMod.sendTo(this._ele3(tItem.UnitPrice, 'UnitPrice', 'Modifications').ele('Modification'));
                } else {
                    tMod.sendTo(this._ele2(tItem.InvoiceItemModifications, 'InvoiceItemModifications').ele('Modification'));
                }
            }
        }
    }
    private _SAC_Header_Invoice(gIT1: ASTNode, tInvDOrderSummary: TidyInvoiceDetailOrderSummary) {
        let gSACs = this._dGrps(gIT1, 'SAC');
        for (let gSAC of gSACs) {
            let SAC = this._dSeg1(gSAC, 'SAC');
            let v1 = this._segVal(SAC, 1); // A Allowance , C Charge
            let v2 = this._segVal(SAC, 2);
            let v12 = this._segVal(SAC, 12);
            // let tMod = new TidyModification();
            // let tModD = new TidyModificationDetail();
            if (v1 == 'A') {
                if (v2 == 'C310') {
                    this._SAC_Common_A_C310(SAC, tInvDOrderSummary);
                } else {
                    // not supported for HEADER INVOICE
                }
            } else if (v1 == 'C') {
                // C Charge
                if (v2 == 'G830') {
                    // InvoiceDetailLineShipping
                    this._SAC_Material_Header_C_G830(SAC, tInvDOrderSummary, gSAC, v1);
                } else if (v2 == 'H090') {
                    // InvoiceDetailLineSpecialHandling
                    this._SAC_Material_Header_C_H090(SAC, tInvDOrderSummary, gSAC, v1);
                } else if (v2 == 'H850') {
                    // Tax
                    this._SAC_Common_C_H850(SAC, tInvDOrderSummary, gSAC, v1);
                }
                else {
                    // not supported for HEADER INVOICE
                }

            } else if (v1 == 'N') {
                // B840
                // if (v2 == 'B840') {
                //     this._SAC_Common_N_B840(SAC, this._tInvDReqH, tItem, gSAC, v1);
                // }
            } // end if v1=='A'

            // if (!tModD.isEmpty()) {
            //     tModD.sendTo(tMod.ModificationDetail.ele('ModificationDetail'));
            // }
            // if (!tMod.isEmpty()) {
            //     if (v12 == '02') {
            //         tMod.sendTo(this._ele2(tItem.UnitPrice, 'UnitPrice').ele('Modifications'));
            //     } else {
            //         tMod.sendTo(this._ele2(tItem.InvoiceItemModifications, 'InvoiceItemModifications'));
            //     }
            // }
        }
    }
    private _SAC_Service(gIT1: ASTNode, tSItem: TidyInvoiceDetailServiceItem) {
        let gSACs = this._dGrps(gIT1, 'SAC');
        for (let gSAC of gSACs) {
            let SAC = this._dSeg1(gSAC, 'SAC');
            let v1 = this._segVal(SAC, 1); // A Allowance , C Charge
            let v2 = this._segVal(SAC, 2);
            let v12 = this._segVal(SAC, 12);
            let tMod = new TidyModification();
            let tModD = new TidyModificationDetail();
            if (v1 == 'A') {
                if (v2 == 'C310') {
                    this._SAC_Common_A_C310(SAC, tSItem);
                } else {
                    this._SAC_Material_Service_A(SAC, tModD, tMod, gSAC, v1);
                }
            } else if (v1 == 'C') {
                // C Charge
                if (v2 == 'G830') {
                    // not Supported for service items
                } else if (v2 == 'H090') {
                    // not Supported for service items
                } else if (v2 == 'H850') {
                    // Tax , not explictly clarified in MapSpec, I think ServiceItem needs this, anyway no harm.
                    this._SAC_Common_C_H850(SAC, tSItem, gSAC, v1);
                }
                else {
                    this._SAC_Material_Service_C(SAC, tModD, tMod, gSAC, v1);
                }

            } else if (v1 == 'N') {
                // B840
                if (v2 == 'B840') {
                    this._SAC_Common_N_B840(SAC, tSItem, gSAC, v1);
                }
            } // end if v1=='A'

            if (!tModD.isEmpty()) {
                tModD.sendTo(tMod.ModificationDetail.ele('ModificationDetail'));
            }
            if (!tMod.isEmpty()) {
                if (v12 == '02') {
                    tMod.sendTo(this._ele3(tSItem.UnitPrice, 'UnitPrice', 'Modifications').ele('Modification'));
                } else {
                    tMod.sendTo(this._ele2(tSItem.InvoiceItemModifications, 'InvoiceItemModifications').ele('Modification'));
                }
            }
        }
    }

    /**
     * 
     * @param SAC 
     * @param tItem not only Item could be DetailSummary
     */
    private _SAC_Common_A_C310(SAC: EdiSegment,
        tItem: TidyInvoiceDetailItem | TidyInvoiceDetailServiceItem | TidyInvoiceDetailOrderSummary) {
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let eDisCount = tItem.InvoiceDetailDiscount.ele('InvoiceDetailDiscount');
        if (v5) {
            eDisCount.ele(XML.Money).att(XML.currency, this._CUR02_Line).txt(v5);
        }
        if (v7) {
            eDisCount.att('percentageRate', v7);
        }
    }
    /**
     * 
     * @param SAC 
     * @param tInvDSummary not only Item could be DetailSummary
     */
    private _SAC_Summary_A_C310(SAC: EdiSegment, tInvDSummary: TidyInvoiceDetailSummary) {
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let eDisCount = tInvDSummary.InvoiceDetailDiscount.ele('InvoiceDetailDiscount');
        if (v5) {
            eDisCount.ele(XML.Money).att(XML.currency, this._CUR02_Line).txt(v5);
        }
        if (v7) {
            eDisCount.att('percentageRate', v7);
        }
    }

    /**
     * for Item Level Material
     * @param SAC 
     * @param tModD 
     * @param tMod 
     * @param gSAC 
     * @param v1 
     */
    private _SAC_Material_Service_A(SAC: EdiSegment, tModD: TidyModificationDetail, tMod: TidyModification, gSAC: ASTNode, v1: string) {
        let vLang;
        let v2 = this._segVal(SAC, 2);
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let v12 = this._segVal(SAC, 12);
        let v13 = this._segVal(SAC, 13);
        let v14 = this._segVal(SAC, 14);
        let v15 = this._segVal(SAC, 15);
        let v16 = this._segVal(SAC, 16);
        // A Allowance
        tModD.att(XML.nameXML, this._mcs(MAPS.mapSAC1300, v2));
        if (v5) {
            if (v12 == '13') {
                tMod.AdditionalDeduction.ele('AdditionalDeduction').ele('DeductionAmount')
                    .ele(XML.Money).att(XML.currency, this._CUR02_Line).txt(this._d100(v5));
            } else {
                tMod.AdditionalDeduction.ele('AdditionalDeduction').ele('DeductedPrice').ele(XML.Money)
                    .att(XML.currency, this._CUR02_Line).txt(this._d100(v5));
            }
        }

        if (!v5 && v7) {
            this._ele2(tMod.AdditionalDeduction, 'AdditionalDeduction').ele('DeductionPercent').att('percent', v7);
        }

        if (v13) {
            this._ele2(tMod.OriginalPrice, 'OriginalPrice').ele(XML.Money).att(XML.currency, this._CUR02_Line).txt(v13);
            this._ele2(tMod.OriginalPrice, 'OriginalPrice').att('type', v14);
        }
        if (v15) {
            vLang = v16 ? v16.toLowerCase() : 'en';
            tModD.Description.ele(XML.Description).att(XML.lang, vLang).txt(v15);
        } else {
            vLang = 'en';
        }
        // TXI
        this._TXI_MOD(gSAC, vLang, v1, tMod);
    }
    /**
     * for Item Level Material
     * @param SAC 
     * @param tModD 
     * @param tMod 
     * @param gSAC 
     * @param v1 
     */
    private _SAC_Summary_A(SAC: EdiSegment, tModD: TidyModificationDetail, tMod: TidyModification, gSAC: ASTNode, v1: string) {
        let vLang;
        let v2 = this._segVal(SAC, 2);
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let v12 = this._segVal(SAC, 12);
        let v13 = this._segVal(SAC, 13);
        let v14 = this._segVal(SAC, 14);
        let v15 = this._segVal(SAC, 15);
        let v16 = this._segVal(SAC, 16);
        // A Allowance
        tModD.att(XML.nameXML, this._mcs(MAPS.mapSAC1300, v2));
        if (v5) {
            if (v12 == '13') {
                tMod.AdditionalDeduction.ele('AdditionalDeduction').ele('DeductionAmount')
                    .ele(XML.Money).att(XML.currency, this._CUR02_Line).txt(this._d100(v5));
            } else {
                tMod.AdditionalDeduction.ele('AdditionalDeduction').ele('DeductedPrice').ele(XML.Money)
                    .att(XML.currency, this._CUR02_Line).txt(this._d100(v5));
            }
        }
        if (!v5 && v7) {
            this._ele2(tMod.AdditionalDeduction, 'AdditionalDeduction').ele('DeductionPercent').att('percent', v7);
        }
        if (v13) {
            this._ele2(tMod.OriginalPrice, 'OriginalPrice').ele(XML.Money).att(XML.currency, this._CUR02_Line).txt(v13);
            this._ele2(tMod.OriginalPrice, 'OriginalPrice').att('type', v14);
        }
        if (v15) {
            vLang = v16 ? v16.toLowerCase() : 'en';
            tModD.Description.ele(XML.Description).att(XML.lang, vLang).txt(v15);
        } else {
            vLang = 'en';
        }
        // TXI
        this._TXI_MOD(gSAC, vLang, v1, tMod);
    }
    /**
     * 'C Charge' for Material Item Modification
     * @param SAC 
     * @param tModD 
     * @param tMod 
     * @param vCUR02_Line 
     * @param gSAC 
     * @param v1 
     */
    private _SAC_Material_Service_C(SAC: EdiSegment, tModD: TidyModificationDetail, tMod: TidyModification, gSAC: ASTNode, v1: string) {
        let vLang;
        let v2 = this._segVal(SAC, 2);
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let v12 = this._segVal(SAC, 12);
        let v13 = this._segVal(SAC, 13);
        let v14 = this._segVal(SAC, 14);
        let v15 = this._segVal(SAC, 15);
        let v16 = this._segVal(SAC, 16);
        // C Charge
        tModD.att(XML.nameXML, this._mcs(MAPS.mapSAC1300, v2));

        if (v5) {
            this._ele2(tMod.AdditionalCost, 'AdditionalCost').ele(XML.Money).att(XML.currency, this._CUR02_Line)
                .txt(this._d100(v5));
        } else if (v7) {
            this._ele2(tMod.AdditionalCost, 'AdditionalCost').ele('Percentage').att('percent', v7);
        }

        if (v13) {
            this._ele2(tMod.OriginalPrice, 'OriginalPrice').ele(XML.Money).att(XML.currency, this._CUR02_Line).txt(v13);
            this._ele2(tMod.OriginalPrice, 'OriginalPrice').att('type', v14);
        }
        if (v15) {
            vLang = v16 ? v16.toLowerCase() : 'en';
            tModD.Description.ele(XML.Description).att(XML.lang, vLang).txt(v15);
        } else {
            vLang = 'en';
        }
        // TXI
        this._TXI_MOD(gSAC, vLang, v1, tMod);
    }
    /**
     * 'C Charge' for Material Item Modification
     * @param SAC 
     * @param tModD 
     * @param tMod 
     * @param vCUR02_Line 
     * @param gSAC 
     * @param v1 
     */
    private _SAC_Summary_C(SAC: EdiSegment, tModD: TidyModificationDetail, tMod: TidyModification, gSAC: ASTNode, v1: string) {
        let vLang;
        let v2 = this._segVal(SAC, 2);
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let v12 = this._segVal(SAC, 12);
        let v13 = this._segVal(SAC, 13);
        let v14 = this._segVal(SAC, 14);
        let v15 = this._segVal(SAC, 15);
        let v16 = this._segVal(SAC, 16);
        // C Charge
        tModD.att(XML.nameXML, this._mcs(MAPS.mapSAC1300, v2));

        if (v5) {
            this._ele2(tMod.AdditionalCost, 'AdditionalCost').ele(XML.Money).att(XML.currency, this._CUR02_Line)
                .txt(this._d100(v5));
        } else if (v7) {
            this._ele2(tMod.AdditionalCost, 'AdditionalCost').ele('Percentage').att('percent', v7);
        }
        if (v13) {
            this._ele2(tMod.OriginalPrice, 'OriginalPrice').ele(XML.Money).att(XML.currency, this._CUR02_Line).txt(v13);
            this._ele2(tMod.OriginalPrice, 'OriginalPrice').att('type', v14);
        }
        if (v15) {
            vLang = v16 ? v16.toLowerCase() : 'en';
            tModD.Description.ele(XML.Description).att(XML.lang, vLang).txt(v15);
        } else {
            vLang = 'en';
        }
        // TXI
        this._TXI_MOD(gSAC, vLang, v1, tMod);
    }
    /**
     * 'C Charge' for Material Item Modification
     * @param SAC 
     * @param tModD 
     * @param tMod 
     * @param vCUR02_Line 
     * @param gSAC 
     * @param v1 
     */
    private _SAC_Common_N_B840(SAC: EdiSegment, tItem: TidyInvoiceDetailItem | TidyInvoiceDetailServiceItem, gSAC: ASTNode, v1: string) {
        let vLang;
        let v2 = this._segVal(SAC, 2);
        let v4 = this._segVal(SAC, 4);
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let v12 = this._segVal(SAC, 12);
        let v13 = this._segVal(SAC, 13);
        let v14 = this._segVal(SAC, 14);
        let v15 = this._segVal(SAC, 15);
        let v16 = this._segVal(SAC, 16);

        let eDist = tItem.Distribution.ele('Distribution');
        if (v4) {
            eDist.ele('Accounting').att(XML.nameXML, v4);
        }

        if (v5) {
            eDist.ele('Charge').ele(XML.Money).att(XML.currency, this._CUR02_Line).txt(this._d100(v5));
            this._ele2(this._tInvDReqH.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator').att('isAccountingInLine', 'yes');
        }
        let eAccSeg = this._ele3(eDist, 'Accounting', 'AccountingSegment');
        if (v13) {
            eAccSeg.att('id', v13);
        }
        if (v14) {
            eAccSeg.ele('Name').att(XML.lang, 'en').txt(v14);
        }

        if (v15) {
            vLang = v16 ? v16.toLowerCase() : 'en';
            eAccSeg.ele(XML.Description).att(XML.lang, vLang).txt(v15);
        } else {
            vLang = 'en';
        }

    }
    /**
     * 'C Charge' for InvoiceDetailLineShipping
     * @param SAC 
     * @param tModD 
     * @param tMod 
     * @param vCUR02_Line 
     * @param gSAC 
     * @param v1 
     */
    private _SAC_Material_Header_C_G830(SAC: EdiSegment,
        tItem: TidyInvoiceDetailItem | TidyInvoiceDetailOrderSummary, gSAC: ASTNode, v1: string) {
        let vLang;
        let v2 = this._segVal(SAC, 2);
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let v12 = this._segVal(SAC, 12);
        let v13 = this._segVal(SAC, 13);
        let v14 = this._segVal(SAC, 14);
        let v15 = this._segVal(SAC, 15);
        let v16

        if (v5) {
            this._tInvDLineShipping.Money.ele(XML.Money).att(XML.currency, this._CUR02_Line)
                .txt(this._d100(v5));

            this._ele2(this._tInvDReqH.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator').att('isShippingInLine', 'yes');
        }
        // TXI
        this._SAC_TXI_Common('C_G830', gSAC, vLang, v1, tItem);
    }

    /**
     * 'C Charge' for InvoiceDetailLineShipping
     * @param SAC 
     * @param tModD 
     * @param tMod 
     * @param vCUR02_Line 
     * @param gSAC 
     * @param v1 
     */
    private _SAC_Summary_C_G830(SAC: EdiSegment, tInvDSummary: TidyInvoiceDetailSummary, gSAC: ASTNode, v1: string) {
        let vLang;
        let v2 = this._segVal(SAC, 2);
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let v12 = this._segVal(SAC, 12);
        let v13 = this._segVal(SAC, 13);
        let v14 = this._segVal(SAC, 14);
        let v15 = this._segVal(SAC, 15);
        let v16

        tInvDSummary.ShippingAmount.ele('ShippingAmount').ele(XML.Money).att(XML.currency, this._CUR02_Line)
            .txt(this._d100(v5));

        // TXI
        this._SAC_TXI_Common('C_G830', gSAC, vLang, v1, tInvDSummary);
    }
    /**
     * InvoiceDetailLineSpecialHandling
     */
    private _SAC_Material_Header_C_H090(SAC: EdiSegment, tItem: TidyInvoiceDetailItem | TidyInvoiceDetailOrderSummary, gSAC: ASTNode, v1: string) {
        let vLang;
        let v2 = this._segVal(SAC, 2);
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let v12 = this._segVal(SAC, 12);
        let v13 = this._segVal(SAC, 13);
        let v14 = this._segVal(SAC, 14);
        let v15 = this._segVal(SAC, 15);
        let v16 = this._segVal(SAC, 16);

        if (v15) {
            vLang = v16 ? v16.toLowerCase() : 'en';
            this._ele2(tItem.InvoiceDetailLineSpecialHandling, 'InvoiceDetailLineSpecialHandling')
                .ele(XML.Description).att(XML.lang, vLang).txt(v15);
        } else {
            vLang = 'en';
        }

        if (v5) {
            this._ele2(tItem.InvoiceDetailLineSpecialHandling, 'InvoiceDetailLineSpecialHandling').ele(XML.Money)
                .att(XML.currency, this._CUR02_Line)
                .txt(this._d100(v5));
            this._ele2(this._tInvDReqH.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator').att('isSpecialHandlingInLine', 'yes');
        }

        // TXI
        this._SAC_TXI_Common('C_H090', gSAC, vLang, v1, tItem);
    }

    /**
     * SpecialHandlingAmount
     */
    private _SAC_Summary_C_H090(SAC: EdiSegment, tInvDSummary: TidyInvoiceDetailSummary, gSAC: ASTNode, v1: string) {
        let vLang;
        let v2 = this._segVal(SAC, 2);
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let v12 = this._segVal(SAC, 12);
        let v13 = this._segVal(SAC, 13);
        let v14 = this._segVal(SAC, 14);
        let v15 = this._segVal(SAC, 15);
        let v16 = this._segVal(SAC, 16);

        if (v5) {
            tInvDSummary.SpecialHandlingAmount.ele('SpecialHandlingAmount').ele(XML.Money)
                .att(XML.currency, this._CUR02_Line)
                .txt(this._d100(v5));
        }
        if (v15) {
            vLang = v16 ? v16.toLowerCase() : 'en';
            this._ele2(tInvDSummary.SpecialHandlingAmount, 'SpecialHandlingAmount')
                .ele(XML.Description).att(XML.lang, vLang).txt(v15);
        } else {
            vLang = 'en';
        }

        // TXI
        this._SAC_TXI_Common('C_H090', gSAC, vLang, v1, tInvDSummary);
    }

    /**
     * Tax
     */
    private _SAC_Common_C_H850(SAC: EdiSegment, tItem: TidyInvoiceDetailItem | TidyInvoiceDetailServiceItem | TidyInvoiceDetailOrderSummary, gSAC: ASTNode, v1: string) {
        let vLang;
        let v2 = this._segVal(SAC, 2);
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let v12 = this._segVal(SAC, 12);
        let v13 = this._segVal(SAC, 13);
        let v14 = this._segVal(SAC, 14);
        let v15 = this._segVal(SAC, 15);
        let v16 = this._segVal(SAC, 16);

        if (v5) {
            this._tTax_SAC.Money.ele(XML.Money)
                .att(XML.currency, this._CUR02_Line)
                .txt(this._d100(v5));
            this._ele2(this._tInvDReqH.InvoiceDetailLineIndicator, 'InvoiceDetailLineIndicator').att('isTaxInLine', 'yes');
        }
        if (v13) {
            this._ele2(this._tTax_SAC.Money, XML.Money).att(XML.alternateCurrency, this._CUR05_Line).att(XML.alternateAmount, v13);
        }
        if (v15) {
            vLang = v16 ? v16.toLowerCase() : 'en';
            this._tTax_SAC.Description.ele(XML.Description).att(XML.lang, vLang).txt(v15);
        } else {
            vLang = 'en';
        }

        // TXI
        this._SAC_TXI_Common('C_H850', gSAC, vLang, v1, tItem);
    }

    /**
     * Tax
     */
    private _SAC_Summary_C_H850(SAC: EdiSegment, tInvDSummary: TidyInvoiceDetailSummary, gSAC: ASTNode, v1: string) {
        let vLang;
        let v2 = this._segVal(SAC, 2);
        let v5 = this._segVal(SAC, 5);
        let v6 = this._segVal(SAC, 6);
        let v7 = this._segVal(SAC, 7);
        let v12 = this._segVal(SAC, 12);
        let v13 = this._segVal(SAC, 13);
        let v14 = this._segVal(SAC, 14);
        let v15 = this._segVal(SAC, 15);
        let v16 = this._segVal(SAC, 16);

        if (v5) {
            this._tTax_SAC.Money.ele(XML.Money)
                .att(XML.currency, this._CUR02_Line)
                .txt(this._d100(v5));
        }
        if (v13) {
            this._ele2(this._tTax_SAC.Money, XML.Money).att(XML.alternateCurrency, this._CUR05_Line).att(XML.alternateAmount, v13);
        }
        if (v15) {
            vLang = v16 ? v16.toLowerCase() : 'en';
            this._ele2(this._tTax_SAC.Description, XML.Description).att(XML.lang, vLang).txt(v15);
        } else {
            vLang = 'en';
        }

        // TXI
        this._SAC_TXI_Common('C_H850', gSAC, vLang, v1, tInvDSummary);
    }

    /**
     * Seems can be shared by Material A/C and Service
     * @param gSAC 
     * @param vCUR02_Line 
     * @param vLang 
     * @param v1 
     * @param tMod 
     */
    private _TXI_MOD(gSAC: ASTNode, vLang: any, v1: string, tMod: TidyModification) {
        let TXIs = this._dSegs(gSAC, 'TXI');
        let tTax = new TidyTax();
        for (let TXI of TXIs) {
            let vTXI1 = this._segVal(TXI, 1);
            let vTXI2 = this._segVal(TXI, 2);
            let vTXI3 = this._segVal(TXI, 3);
            let vTXI4 = this._segVal(TXI, 4);
            let vTXI5 = this._segVal(TXI, 5);
            let vTXI6 = this._segVal(TXI, 6);
            let vTXI8 = this._segVal(TXI, 8);
            let vTXI9 = this._segVal(TXI, 9);
            let vTXI10 = this._segVal(TXI, 10);

            // Mod has their own tTax, don't use this._tTax_SAC
            let tTaxD = new TidyTaxDetail();
            if (vTXI1 == 'ZZ' || vTXI1 == 'TX') {
                tTax.Money.ele(XML.Money).att(XML.currency, this._CUR02_Line).txt(vTXI2);
                if (vTXI10) {
                    tTax.Description.ele(XML.Description).txt(vTXI10).att(XML.lang, vLang);
                }
            } else {
                // TXI for TaxDetail
                let vMappedCategory = this._mcs(MAPS.mapTXI963, vTXI1, 'other');
                tTaxD.att('purpose', 'tax').att('category', vMappedCategory);
                tTaxD.TaxAmount.ele('TaxAmount').ele(XML.Money).att(XML.currency, this._CUR02_Line).txt(vTXI2);
                if (vTXI3) {
                    tTaxD.att('percentageRate', vTXI3);
                }
                if (vTXI5) {
                    tTaxD.TaxLocation.ele('TaxLocation').att(XML.lang, 'en').txt(vTXI5);
                }
                if (vTXI6 == '0') {
                    tTaxD.att('exemptDetail', 'zeroRated');
                    tTaxD.Description.ele(XML.Description).att(XML.lang, 'en').txt('Zero rated tax');
                } else if (vTXI6 == '2') {
                    tTaxD.att('exemptDetail', 'exempt');
                }
                if (vTXI8) {
                    tTaxD.TaxableAmount.ele('TaxableAmount').ele(XML.Money).att(XML.currency, this._CUR02_Line)
                        .txt(vTXI8);
                }
                if (vTXI9) {
                    // overfides TXI01
                    tTaxD.att('category', vTXI9);
                }
                if (!tTaxD.isEmpty()) {
                    tTaxD.sendTo(tTax.TaxDetail.ele('TaxDetail'));
                }
            } // end if vTXI1
        } // end loop TXIs
        if (!tTax.isEmpty()) {
            tTax.sendTo(tMod.Tax.ele('Tax'));
        }
    }

    /**
     * 
     * @param gSAC 
     * @param vCUR02_Line 
     * @param vLang 
     * @param v1 
     * @param tMod 
     */
    private _SAC_TXI_Common(sFlag: string, gSAC: ASTNode, vLang: any, v1: string,
        tItem: TidyInvoiceDetailItem | TidyInvoiceDetailServiceItem | TidyInvoiceDetailSummary | TidyInvoiceDetailOrderSummary) {
        vLang = vLang ? vLang : 'en';
        let TXIs = this._dSegs(gSAC, 'TXI');
        //let tTax = new TidyTax();
        let vTXI1_Prev = 'Not Exists';
        let tTaxD_Prev: TidyTaxDetail;
        for (let TXI of TXIs) {
            let vTXI1 = this._segVal(TXI, 1);
            let vTXI2 = this._segVal(TXI, 2);
            let vTXI3 = this._segVal(TXI, 3);
            let vTXI4 = this._segVal(TXI, 4);
            let vTXI5 = this._segVal(TXI, 5);
            let vTXI6 = this._segVal(TXI, 6);
            let vTXI8 = this._segVal(TXI, 8);
            let vTXI9 = this._segVal(TXI, 9);
            let vTXI10 = this._segVal(TXI, 10);
            if (vTXI1 == vTXI1_Prev && !vTXI3) {
                this._ele3(tTaxD_Prev.TaxAmount, 'TaxAmount', 'Money').att('alternateCurrency', this._CUR05_Line).att('alternateAmount', vTXI2);
                if (vTXI10) {
                    // This should overwrite any amount if provided in TXI08 field of the first TXI segment
                    this._ele3(tTaxD_Prev.TaxableAmount, 'TaxableAmount', 'Money').txt(vTXI10).att(XML.currency, this._CUR02_Line);
                }
                vTXI1_Prev = 'Not Exists'; // reset the flag since we already get the alternateAmount
            } else {
                let tTaxD = new TidyTaxDetail();
                // TXI for TaxDetail
                let vMappedCategory = this._mcs(MAPS.mapTXI963, vTXI1, 'other');
                switch (sFlag) {
                    case 'C_G830':
                        tTaxD.att('purpose', 'shippingTax').att('category', vMappedCategory);
                        break;
                    case 'C_H090':
                        tTaxD.att('purpose', 'specialHandlingTax').att('category', vMappedCategory);
                        break;
                    case 'C_H850':
                        tTaxD.att('purpose', 'tax').att('category', vMappedCategory);
                        break;

                    default:
                        break;
                }

                tTaxD.TaxAmount.ele('TaxAmount').ele(XML.Money).att(XML.currency, this._CUR02_Line).txt(vTXI2);
                if (vTXI3) {
                    tTaxD.att('percentageRate', vTXI3);
                }
                if (vTXI5) {
                    tTaxD.TaxLocation.ele('TaxLocation').att(XML.lang, 'en').txt(vTXI5);
                }
                if (vTXI6 == '0') {
                    tTaxD.att('exemptDetail', 'zeroRated');
                    if (sFlag == 'C_H850') {
                        tTaxD.Description.ele(XML.Description).att(XML.lang, 'en').txt('Zero rated tax');
                    }
                } else if (vTXI6 == '2') {
                    tTaxD.att('exemptDetail', 'exempt');
                }
                if (vTXI8) {
                    tTaxD.TaxableAmount.ele('TaxableAmount').ele(XML.Money).att(XML.currency, this._CUR02_Line)
                        .txt(vTXI8);
                }
                if (vTXI9) {
                    // overfides TXI01
                    tTaxD.att('category', vTXI9);
                }
                if (vTXI10) {
                    if (vTXI1 == 'VA') {
                        // taxPointDate, maybe need to convert date?
                        tTaxD.att('taxPointDate', Utils.dateStrFromDTM2(vTXI10));
                    } else {
                        tTaxD.Description.ele(XML.Description).att(XML.lang, vLang).txt(vTXI10);
                    }
                }
                if (vTXI1 != vTXI1_Prev) {
                    if (tTaxD_Prev && !tTaxD_Prev.isEmpty()) {
                        tTaxD_Prev.sendTo(this._tTax_SAC.TaxDetail.ele('TaxDetail'));
                    }
                }
                vTXI1_Prev = vTXI1;
                tTaxD_Prev = tTaxD;
            } // end if vTXI1 == vTXI1_Prev
        } // end loop TXIs

        // The last one
        if (tTaxD_Prev && !tTaxD_Prev.isEmpty()) {
            tTaxD_Prev.sendTo(this._tTax_SAC.TaxDetail.ele('TaxDetail'));
        }

    }

    private _DTM_Material(gIT1: ASTNode, tItem: TidyInvoiceDetailItem, tInvDOrder: TidyInvoiceDetailOrder, tInvDShipping: TidyInvoiceDetailShipping) {
        let DTMs = this._dSegs(gIT1, 'DTM');

        for (let DTM of DTMs) {
            let v1 = this._segVal(DTM, 1);
            let v2 = this._segVal(DTM, 2);
            let v3 = this._segVal(DTM, 3);
            let v4 = this._segVal(DTM, 4);
            let theDate = Utils.dateStrFromREFDTM(v2 + v3 + v4, false);

            switch (v1) {
                case '004':
                    this._ele2(this._tInvDOrderInfo.OrderReference, 'OrderReference')
                        .att('orderDate', theDate);
                    break;
                case '008':
                    this._ele2(this._tInvDOrderInfo.SupplierOrderInfo, 'SupplierOrderInfo').att('orderDate', theDate);
                    break;
                case '111':
                    this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo').att('shipNoticeDate', theDate);
                    break;
                case '011':
                    tInvDShipping.att('shippingDate', theDate);
                    let e = this._ele3(tInvDOrder.InvoiceDetailShipNoticeInfo, 'InvoiceDetailShipNoticeInfo', 'ShipNoticeReference')
                        .att('shipNoticeDate', theDate);
                    this._ele2(e, 'DocumentReference').att(XML.payloadID, '');
                    break;
                case '192':
                    this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo').ele(XML.IdReference)
                        .att(XML.domain, 'deliveryNoteDate').att(XML.identifier, theDate);
                    break;
                // case '150':
                //     eInvDReqH.att('invoiceDate', theDate);
                //     break;
                case '214':
                    tItem.att('referenceDate', theDate);
                    break;
                case 'LEA':
                    this._ele2(this._tInvDOrderInfo.MasterAgreementReference, 'MasterAgreementReference').att('agreementDate', theDate);
                    break;
                case '517':
                    tItem.att('inspectionDate', theDate);
                    break;
                case '472':
                    this._ele2(tItem.ServiceEntryItemReference, 'ServiceEntryItemReference').att('serviceEntryDate', theDate);
                    break;
                case '514':
                    this._ele2(tItem.ProductMovementItemIDInfo, 'ProductMovementItemIDInfo').att('movementDate', theDate);
                    break;
                default:
                    break;
            }
        } // end loop DTMs

    }
    private _DTM_Header_Invoice(gIT1: ASTNode, tInvDOrderSummary: TidyInvoiceDetailOrderSummary) {
        let DTMs = this._dSegs(gIT1, 'DTM');
        for (let DTM of DTMs) {
            let v1 = this._segVal(DTM, 1);
            let v2 = this._segVal(DTM, 2);
            let v3 = this._segVal(DTM, 3);
            let v4 = this._segVal(DTM, 4);
            let theDate = Utils.dateStrFromDTM2(v2 + v3 + v4);

            switch (v1) {
                case '004':
                    this._tInvDOrderInfo.OrderReference.ele('OrderReference')
                        .att('orderDate', theDate);
                    break;
                case '008':
                    this._tInvDOrderInfo.SupplierOrderInfo.ele('SupplierOrderInfo').att('orderDate', theDate);
                    break;

                case '150':
                    this._ele2(tInvDOrderSummary.Period, 'Period').att('startDate', theDate);
                    break;
                case '151':
                    this._ele2(tInvDOrderSummary.Period, 'Period').att('endDate', theDate);
                    break;
                case 'LEA':
                    this._ele2(this._tInvDOrderInfo.MasterAgreementReference, 'MasterAgreementReference').att('agreementDate', theDate);
                    break;
                case '517':
                    tInvDOrderSummary.att('inspectionDate', theDate);
                    break;
                default:
                    break;
            }
        } // end loop DTMs

    }
    private _DTM_Service(gIT1: ASTNode, tSItem: TidyInvoiceDetailServiceItem) {
        let DTMs = this._dSegs(gIT1, 'DTM');
        for (let DTM of DTMs) {
            let v1 = this._segVal(DTM, 1);
            let v2 = this._segVal(DTM, 2);
            let v3 = this._segVal(DTM, 3);
            let v4 = this._segVal(DTM, 4);
            let theDate = Utils.dateStrFromDTM2(v2 + v3 + v4);

            switch (v1) {

                case '150':
                    this._ele2(tSItem.Period, 'Period').att('startDate', theDate);
                    break;
                case '151':
                    this._ele2(tSItem.Period, 'Period').att('endDate', theDate);
                    break;
                case '214':
                    tSItem.att('referenceDate', theDate);
                    break;

                case '517':
                    tSItem.att('inspectionDate', theDate);
                    break;
                case '472':
                    this._ele2(tSItem.ServiceEntryItemReference, 'ServiceEntryItemReference').att('serviceEntryDate', theDate);
                    break;

                default:
                    break;
            }
        } // end loop DTMs

    }

    private _YNQ_Material(gIT1: ASTNode, tItem: TidyInvoiceDetailItem) {
        let YNQs = this._dSegs(gIT1, 'YNQ');
        for (let YNQ of YNQs) {
            let v1 = this._segVal(YNQ, 2);
            let v2 = this._segVal(YNQ, 2);
            if (v1 == 'Q3') {
                if (v2 && v2 == 'Y') {
                    // also needs BIG07="CN", I'm too lazy to code it
                    tItem.att('reason', 'return');
                }
            } else {
                if (v2 && v2 == 'Y') {
                    tItem.att('isAdHoc', 'yes');
                }
            }
        }
    }
    private _YNQ_Service(gIT1: ASTNode, tSItem: TidyInvoiceDetailServiceItem) {
        let YNQs = this._dSegs(gIT1, 'YNQ');
        for (let YNQ of YNQs) {
            let v1 = this._segVal(YNQ, 2);
            let v2 = this._segVal(YNQ, 2);
            if (v1 == 'Q3') {
                // not for service item
                // if (v2 && v2 == 'Y') {
                //     // also needs BIG07="CN", I'm too lazy to code it
                //     tSItem.att('reason', 'return');
                // }
            } else {
                if (v2 && v2 == 'Y') {
                    tSItem.att('isAdHoc', 'yes');
                }
            }
        }
    }

    private _REF_Material(gIT1: ASTNode, tInvDOrder: TidyInvoiceDetailOrder, tItem: TidyInvoiceDetailItem) {
        let REFs = this._dSegs(gIT1, 'REF');
        let tRetail = new TidyInvoiceDetailItemRetail();
        for (let REF of REFs) {
            let v1 = this._segVal(REF, 1);
            let v2 = this._segVal(REF, 2);
            let v3 = this._segVal(REF, 3);
            let v402 = this._segVal(REF, 402);
            switch (v1) {
                case 'PO':
                    let eOrderRef = this._ele2(this._tInvDOrderInfo.OrderReference, 'OrderReference');
                    eOrderRef.att('orderID', v2);
                    eOrderRef.ele('DocumentReference').att(XML.payloadID, '');
                    break;
                case 'AH':
                    let eMasterAgreeRef = this._ele2(this._tInvDOrderInfo.MasterAgreementReference, 'MasterAgreementReference');
                    eMasterAgreeRef.att('agreementID', v2).ele('DocumentReference').att(XML.payloadID, '');
                    if (v3 == '1') {
                        eMasterAgreeRef.att('agreementType', 'scheduling_agreement');
                    }
                    break;
                case 'VN':
                    this._ele2(this._tInvDOrderInfo.SupplierOrderInfo, 'SupplierOrderInfo').att('orderID', v2);
                    break;
                case 'MA':
                    this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo').att('shipNoticeID', v2);
                    let e = this._ele3(tInvDOrder.InvoiceDetailShipNoticeInfo, 'InvoiceDetailShipNoticeInfo', 'ShipNoticeReference').att('shipNoticeID', v2);
                    this._ele2(e, 'DocumentReference').att(XML.payloadID, '');

                    if (v402) {
                        this._ele2(tItem.ShipNoticeLineItemReference, 'ShipNoticeLineItemReference').att('shipNoticeLineNumber', v402);
                    }
                    break;
                case 'RV':
                    this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo').ele(XML.IdReference).att(XML.domain, 'ReceivingAdviceID')
                        .att(XML.identifier, v2);
                    if (v402) {
                        this._ele2(tItem.ReceiptLineItemReference, 'ReceiptLineItemReference').att('ReceiptLineItemReference', v402);
                    }
                    break;
                case 'FJ':
                    tItem.att('invoiceLineNumber', v2);
                    break;
                case 'PK':
                    this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo').ele(XML.IdReference).att(XML.domain, 'packListID')
                        .att(XML.identifier, v2);
                    break;
                case 'KK':
                    this._ele2(tItem.ShipNoticeIDInfo, 'ShipNoticeIDInfo').ele(XML.IdReference).att(XML.domain, 'deliveryNoteID')
                        .att(XML.identifier, v2);
                    break;
                case 'PD':
                    tRetail.PromotionDealID.ele('PromotionDealID').txt(v2);
                    break;
                case 'BT':
                    this._ele2(this._tInvDItemRef.SupplierBatchID, 'SupplierBatchID')
                        .txt(v2);
                    break;
                case 'FL':
                    if (v2) {
                        tItem.att('itemType', v2);
                    }
                    if (v3) {
                        tItem.att('compositeItemType', v3);
                    }
                    if (v402) {
                        tItem.att('parentInvoiceLineNumber', v402);
                    }
                    break;
                case 'ACE':
                    let eServiceEntryRef = this._ele2(tItem.ServiceEntryItemReference, 'ServiceEntryItemReference');
                    eServiceEntryRef.att('serviceEntryID', v2);
                    if (v402) {
                        eServiceEntryRef.att('serviceLineNumber', v402).ele('DocumentReference').att(XML.payloadID, '');
                    }
                    break;
                case '8L':
                    this._tInvDItemRef.Classification.ele('Classification').att(XML.domain, v2).txt(v3);
                    break;
                case '4M':
                    let eMovIDInfo = tItem.ProductMovementItemIDInfo.ele('ProductMovementItemIDInfo');
                    eMovIDInfo.att('movementID', v2);
                    if (v402) {
                        eMovIDInfo.att('movementLineNumber', v402);
                    }
                    break;
                case 'L1':
                    let vLang = v2 ? v2 : 'en';
                    this._ele2(tItem.Comments, 'Comments').att(XML.lang, vLang)
                        .txt(v3);
                    break;
                case 'ZZ':
                    tItem.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, v2)
                        .txt(v3);
                    break;
                default:
                    // try to get map
                    if (this._mcs(MAPS.mapREF, v1)) {
                        tItem.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, v1)
                            .txt(v2 + v3);
                    }
                    break;
            }
        } // end loop REFs

        if (!tRetail.isEmpty()) {
            tRetail.sendTo(tItem.InvoiceDetailItemIndustry.ele('InvoiceDetailItemIndustry').ele('InvoiceDetailItemRetail'));
        }
    }
    private _REF_Header_Invoice(gIT1: ASTNode, tInvDOrderSummary: TidyInvoiceDetailOrderSummary) {
        let REFs = this._dSegs(gIT1, 'REF');
        let tRetail = new TidyInvoiceDetailItemRetail();
        for (let REF of REFs) {
            let v1 = this._segVal(REF, 1);
            let v2 = this._segVal(REF, 2);
            let v3 = this._segVal(REF, 3);
            let v6 = this._segVal(REF, 6);
            switch (v1) {
                case 'AH':
                    let eMasterAgreeRef = this._ele2(this._tInvDOrderInfo.MasterAgreementReference, 'MasterAgreementReference');
                    eMasterAgreeRef.att('agreementID', v2).ele('DocumentReference').att(XML.payloadID, '');
                    if (v3 == '1') {
                        eMasterAgreeRef.att('agreementType', 'scheduling_agreement');
                    }
                    break;
                case 'FJ':
                    tInvDOrderSummary.att('invoiceLineNumber', v2);
                    break;

                case 'L1':
                    let vLang = v2 ? v2 : 'en';
                    this._ele2(tInvDOrderSummary.Comments, 'Comments').att(XML.lang, vLang)
                        .txt(v3);
                    break;
                case 'ZZ':
                    tInvDOrderSummary.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, v2)
                        .txt(v3);
                    break;
                default:
                    // try to get map
                    if (this._mcs(MAPS.mapREF, v1)) {
                        tInvDOrderSummary.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, v1)
                            .txt(v2 + v3);
                    }
                    break;
            }
        } // end loop REFs

        // if (!tRetail.isEmpty()) {
        //     tRetail.sendTo(tItem.InvoiceDetailItemIndustry.ele('InvoiceDetailItemIndustry').ele('InvoiceDetailItemRetail'));
        // }
    }
    private _REF_Service(gIT1: ASTNode, tSItem: TidyInvoiceDetailServiceItem) {
        let REFs = this._dSegs(gIT1, 'REF');
        for (let REF of REFs) {
            let v1 = this._segVal(REF, 1);
            let v2 = this._segVal(REF, 2);
            let v3 = this._segVal(REF, 3);
            let v6 = this._segVal(REF, 6);
            switch (v1) {
                case 'FJ':
                    tSItem.att('invoiceLineNumber', v2);
                    break;
                case 'FL':
                    if (v2) {
                        tSItem.att('itemType', v2);
                    }
                    if (v3) {
                        tSItem.att('compositeItemType', v3);
                    }
                    if (v6) {
                        tSItem.att('parentInvoiceLineNumber', v6);
                    }
                    break;
                case 'ACE':
                    let eServiceEntryRef = this._ele2(tSItem.ServiceEntryItemReference, 'ServiceEntryItemReference');
                    eServiceEntryRef.att('serviceEntryID', v2);
                    if (v6) {
                        eServiceEntryRef.att('serviceLineNumber', v6).ele('DocumentReference').att(XML.payloadID, '');
                    }
                    break;
                case '8L':
                    let eInvDRef = this._ele2(tSItem.InvoiceDetailServiceItemReference, 'InvoiceDetailServiceItemReference');
                    eInvDRef.ele('Classification').att(XML.domain, v2);
                    eInvDRef.txt(v3);
                    break;

                case 'L1':
                    let vLang = v2 ? v2 : 'en';
                    this._ele2(tSItem.Comments, 'Comments').att(XML.lang, vLang)
                        .txt(v3);
                    break;
                case 'ZZ':
                    tSItem.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, v2)
                        .txt(v3);
                    break;
                default:
                    // try to get map
                    if (this._mcs(MAPS.mapREF, v1)) {
                        tSItem.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, v1)
                            .txt(v2 + v3);
                    }
                    break;
            }
        } // end loop REFs

    }

    private _PID_Material(gIT1: ASTNode, tItem: TidyInvoiceDetailItem) {
        let gPIDs = this._dGrps(gIT1, 'PID');
        let vDesc = '';
        let vShortName = '';
        for (let gPID of gPIDs) {
            let PID = this._dSeg1(gPID, 'PID');

            if (PID) {
                let v2 = this._segVal(PID, 2);
                let v5 = this._segVal(PID, 5);
                let v9 = this._segVal(PID, 9);
                if (v2 == 'GEN') {
                    vShortName += v5;
                } else {
                    vDesc += v5;
                }
            }
        } // end loop gPIDs
        if (vDesc || vShortName) {
            let eDesc = this._tInvDItemRef.Description.ele(XML.Description).att(XML.lang, 'en')
                .txt(vDesc);
            if (vShortName) {
                eDesc.ele('ShortName').txt(vShortName);
            }
        }
    }
    private _PID_Service(gIT1: ASTNode, tSItem: TidyInvoiceDetailServiceItem) {
        let gPIDs = this._dGrps(gIT1, 'PID');
        let vDesc = '';
        let vShortName = '';
        for (let gPID of gPIDs) {
            let PID = this._dSeg1(gPID, 'PID');

            if (PID) {
                let v2 = this._segVal(PID, 2);
                let v5 = this._segVal(PID, 5);
                let v9 = this._segVal(PID, 9);
                if (v2 == 'GEN') {
                    vShortName += v5;
                } else {
                    vDesc += v5;
                }
            }
        } // end loop gPIDs
        if (vDesc || vShortName) {
            let eDesc = this._ele2(tSItem.InvoiceDetailServiceItemReference, 'InvoiceDetailServiceItemReference').ele(XML.Description)
                .txt(vDesc);
            if (vShortName) {
                eDesc.ele('ShortName').txt(vShortName);
            }
        }
    }

    private _PAM_Material_Service(gIT1: ASTNode, tItem: TidyInvoiceDetailItem | TidyInvoiceDetailServiceItem) {
        let PAMs = this._dSegs(gIT1, 'PAM');
        for (let PAM of PAMs) {
            let v1 = this._segVal(PAM, 1);
            let v4 = this._segVal(PAM, 4);
            let v5 = this._segVal(PAM, 5);
            switch (v4) {
                case '1':
                    tItem.SubtotalAmount.ele('SubtotalAmount').ele(XML.Money)
                        .txt(v5).att(XML.currency, this._CUR02_Line);
                    break;
                case 'KK':
                    tItem.GrossAmount.ele('GrossAmount').ele(XML.Money)
                        .txt(v5).att(XML.currency, this._CUR02_Line);
                    break;
                case 'N':
                    tItem.NetAmount.ele('NetAmount').ele(XML.Money)
                        .txt(v5).att(XML.currency, this._CUR02_Line);
                    break;
                case 'GW':
                    tItem.TotalCharges.ele('TotalCharges').ele(XML.Money)
                        .txt(v5).att(XML.currency, this._CUR02_Line);
                    break;
                case 'EC':
                    tItem.TotalAllowances.ele('TotalAllowances').ele(XML.Money)
                        .txt(v5).att(XML.currency, this._CUR02_Line);
                    break;
                case 'ZZ':
                    tItem.TotalAmountWithoutTax.ele('TotalAmountWithoutTax').ele(XML.Money)
                        .txt(v5).att(XML.currency, this._CUR02_Line);
                    break;

                default:
                    break;
            }
        }
    }
    private _PAM_Header_Invoice(gIT1: ASTNode, tInvDOrderSummary: TidyInvoiceDetailOrderSummary) {
        let PAMs = this._dSegs(gIT1, 'PAM');
        for (let PAM of PAMs) {
            let v1 = this._segVal(PAM, 1);
            let v4 = this._segVal(PAM, 4);
            let v5 = this._segVal(PAM, 5);
            switch (v4) {
                case 'KK':
                    // remove data set by TDS
                    this._ele2(tInvDOrderSummary.GrossAmount, 'GrossAmount').remove();

                    tInvDOrderSummary.GrossAmount.ele('GrossAmount').ele(XML.Money)
                        .txt(v5).att(XML.currency, this._CUR02_Line);
                    break;
                case 'N':
                    // remove data set by TDS
                    this._ele2(tInvDOrderSummary.NetAmount, 'NetAmount').remove();

                    tInvDOrderSummary.NetAmount.ele('NetAmount').ele(XML.Money)
                        .txt(v5).att(XML.currency, this._CUR02_Line);
                    break;
                default:
                    break;
            }
        }
    }

    private _IT1_VP_One_Seg(IT1: EdiSegment): TidyInvoiceDetailItem {
        let vIT1_01 = this._segVal(IT1, 1);
        let vIT1_02 = this._segVal(IT1, 2);
        let vIT1_03 = this._segVal(IT1, 3);
        let vIT1_04 = this._segVal(IT1, 4);

        let tItem = new TidyInvoiceDetailItem();
        let tItemID = new TidyItemID();

        let tInvDItemRefRetail = new TidyInvoiceDetailItemReferenceRetail();
        if (vIT1_01) {
            this._tInvDItemRef.att('lineNumber', vIT1_01);
        }
        tItem.att(XML.quantity, vIT1_02);
        tItem.UnitOfMeasure.ele(XML.UnitOfMeasure).txt(vIT1_03);
        tItem.UnitPrice.ele('UnitPrice').ele(XML.Money).txt(vIT1_04).att(XML.currency, this._CUR02);

        for (let i = 6; i <= 24; i = i + 2) {
            let v235 = this._segVal(IT1, i);
            let v234 = this._segVal(IT1, i + 1);
            switch (v235) {
                case 'BP':
                    tItemID.BuyerPartID.ele('BuyerPartID').txt(v234);
                    break;
                case 'C3':
                    this._tInvDItemRef.Classification.ele('Classification').txt(v234).att(XML.domain, 'UNSPSC');
                    break;
                case 'CH':
                    this._tInvDItemRef.Country.ele('Country').att('isoCountryCode', v234);
                    break;
                case 'EA':
                    tInvDItemRefRetail.EuropeanWasteCatalogID.ele('EuropeanWasteCatalogID').txt(v234);
                    break;
                case 'EN':
                    tInvDItemRefRetail.EANID.ele('EANID').txt(v234);
                    break;
                case 'MF':
                    this._tInvDItemRef.ManufacturerName.ele('ManufacturerName').txt(v234);
                    break;
                case 'MG':
                    this._tInvDItemRef.ManufacturerPartID.ele('ManufacturerPartID').txt(v234);
                    break;
                case 'SN':
                    this._tInvDItemRef.att('serialNumber', v234);
                    this._tInvDItemRef.SerialNumber.ele('SerialNumber').txt(v234);
                    break;
                case 'UP':
                    tItemID.IdReference.ele(XML.IdReference).att(XML.domain, 'UPCConsumerPackageCode')
                        .att(XML.identifier, v234);
                    break;
                case 'VP':
                    tItemID.SupplierPartID.ele('SupplierPartID').txt(v234);
                    break;
                case 'VS':
                    tItemID.SupplierPartAuxiliaryID.ele('SupplierPartAuxiliaryID').txt(v234);
                    break;
                default:
                    break;
            }

        } // end loop i
        if (!tItemID.isEmpty()) {
            tItemID.sendTo(this._tInvDItemRef.ItemID.ele('ItemID'));
        }
        if (!tInvDItemRefRetail.isEmpty()) {
            tInvDItemRefRetail.sendTo(this._tInvDItemRef.InvoiceDetailItemReferenceIndustry.ele('InvoiceDetailItemReferenceIndustry')
                .ele('InvoiceDetailItemReferenceRetail'));
        }
        return tItem;
    }

    /**
     * For <InvoiceDetailServiceItem> (IT1 235 = "SH", not "VP")	

     * @param vIT1_01 
     * @param vIT1_02 
     * @param vIT1_03 
     * @param vIT1_04 
     * @param IT1 
     */
    private _IT1_SH_Service(gIT1: ASTNode): TidyInvoiceDetailServiceItem {
        let IT1 = this._dSeg1(gIT1, 'IT1');
        let vIT1_01 = this._segVal(IT1, 1);
        let vIT1_02 = this._segVal(IT1, 2);
        let vIT1_03 = this._segVal(IT1, 3);
        let vIT1_04 = this._segVal(IT1, 4);
        let tSItem = new TidyInvoiceDetailServiceItem();
        let tItemID = new TidyItemID();
        let tInvDSRef = new TidyInvoiceDetailServiceItemReference();
        if (vIT1_01) {
            tInvDSRef.att('lineNumber', vIT1_01);
        }
        tSItem.att(XML.quantity, vIT1_02);
        tSItem.UnitOfMeasure.ele(XML.UnitOfMeasure).txt(vIT1_03);
        tSItem.UnitPrice.ele('UnitPrice').ele(XML.Money).txt(vIT1_04).att(XML.currency, this._CUR02);

        for (let i = 6; i <= 24; i = i + 2) {
            let v235 = this._segVal(IT1, i);
            let v234 = this._segVal(IT1, i + 1);
            switch (v235) {
                case 'BP':
                    tItemID.BuyerPartID.ele('BuyerPartID').txt(v234);
                    break;
                case 'C3':
                    tInvDSRef.Classification.ele('Classification').txt(v234).att(XML.domain, 'UNSPSC');
                    break;
                case 'SH':
                    tItemID.SupplierPartID.ele('SupplierPartID').txt(v234);
                    break;
                case 'VS':
                    tItemID.SupplierPartAuxiliaryID.ele('SupplierPartAuxiliaryID').txt(v234);
                    break;
                default:
                    break;
            }

        } // end loop i

        // PAM
        this._PAM_Material_Service(gIT1, tSItem);

        // PID
        this._PID_Service(gIT1, tSItem);

        // REF
        this._REF_Service(gIT1, tSItem);
        // YNQ
        this._YNQ_Service(gIT1, tSItem);

        // DTM
        this._DTM_Service(gIT1, tSItem);
        // SAC
        this._SAC_Service(gIT1, tSItem);

        // N1 Group not supported for service items

        if (!tItemID.isEmpty()) {
            tItemID.sendTo(tInvDSRef.ItemID.ele('ItemID'));
        }
        tInvDSRef.sendTo(tSItem.InvoiceDetailServiceItemReference.ele('InvoiceDetailServiceItemReference'));
        return tSItem;
    }

    /**
     * IT1 segment,  [IT1 235 = "PO"] HEADER INVOICE 
     * @param IT1 
     * @param tInvDHeaderOrder 
     */
    private _IT1_PO_Header(gIT1: ASTNode): TidyInvoiceDetailHeaderOrder {
        let IT1 = this._dSeg1(gIT1, 'IT1');
        let vIT1_01 = this._segVal(IT1, 1);
        let vIT1_02 = this._segVal(IT1, 2);
        let vIT1_03 = this._segVal(IT1, 3);
        let vIT1_04 = this._segVal(IT1, 4);
        let tInvDHeaderOrder = new TidyInvoiceDetailHeaderOrder();
        let tInvDOrderSummary = new TidyInvoiceDetailOrderSummary();
        tInvDOrderSummary.SubtotalAmount.ele('SubtotalAmount')
            .ele(XML.Money).txt(vIT1_04).att(XML.currency, this._CUR02);
        let vIT1_07 = this._segVal(IT1, 7);
        let vIT1_09 = this._segVal(IT1, 9);
        if (vIT1_07) {
            let eOrderRef = this._tInvDOrderInfo.OrderReference.ele('OrderReference');
            eOrderRef.att('orderID', vIT1_07);
            eOrderRef.ele('DocumentReference').att(XML.payloadID, '');
        }
        if (vIT1_09) {
            this._ele2(this._tInvDOrderInfo.SupplierOrderInfo, 'SupplierOrderInfo')
                .att('orderID', vIT1_09);
        }

        let vCUR02_Line;
        let vCUR05_Line;
        // CUR, I know it's tricky, but finally, it will feed back
        // to Summary Level currency, so don't worry;
        let CUR = this._dSeg1(gIT1, 'CUR');
        if (CUR) {
            // save for later use
            vCUR02_Line = this._segVal(CUR, 2);
            vCUR05_Line = this._segVal(CUR, 5);
        }
        this._CUR02_Line = vCUR02_Line ? vCUR02_Line : this._CUR02;
        this._CUR05_Line = vCUR05_Line ? vCUR05_Line : this._CUR05;
        // CTP , ignore

        // PAM
        this._PAM_Header_Invoice(gIT1, tInvDOrderSummary);
        // REF
        this._REF_Header_Invoice(gIT1, tInvDOrderSummary);
        // YNQ, no header invoice
        // DTM
        this._DTM_Header_Invoice(gIT1, tInvDOrderSummary);
        // SAC
        this._SAC_Header_Invoice(gIT1, tInvDOrderSummary);

        let gN1s = this._dGrps(gIT1, 'N1');
        let tInvDShipping = new TidyInvoiceDetailShipping();
        for (let gN1 of gN1s) {
            let tContact = new TidyContact();
            this._fillContact(tContact, gN1);

            //this._N1_REF_Material_Special(tInvDShipping, gN1);
            tContact.sendTo(tInvDShipping.Contact.ele('Contact'));
        }
        if (!tInvDShipping.isEmpty()) {
            tInvDShipping.sendTo(tInvDOrderSummary.InvoiceDetailLineShipping.ele('InvoiceDetailLineShipping').ele('InvoiceDetailShipping'));
        }

        if (!this._tInvDOrderInfo.isEmpty()) {
            this._tInvDOrderInfo.sendTo(tInvDHeaderOrder.InvoiceDetailOrderInfo.ele('InvoiceDetailOrderInfo'));
        }
        tInvDOrderSummary.sendTo(tInvDHeaderOrder.InvoiceDetailOrderSummary.ele('InvoiceDetailOrderSummary'));
        return tInvDHeaderOrder;
    }

    /**
     * If we want to ignore InvoicePartner, use _fillContact function
     * @param gN1 it's group Node and segment Node
     * @param invoiceDetailOrder 
     */
    protected _fillN1Grp_InvoicePartner(gN1: ASTNode, eIP_Parent: XMLBuilder) {
        let N1 = this._dSeg1(gN1, 'N1');
        let role = this._segVal(N1, 1);
        if (!role || !MAPS.mapN1_InvoicePartner[role]) {
            return;
        }

        // N1
        let tInvoicePartner = new TidyInvoicePartner();
        // let contact = invoicePartner.ele('Contact');
        let tContact = new TidyContact();
        this._fillContact(tContact, gN1, tInvoicePartner);

        tContact.sendTo(tInvoicePartner.Contact.ele('Contact'));
        tInvoicePartner.sendTo(eIP_Parent.ele('InvoicePartner'))
    } // end function

    /**
     * If we want to ignore InvoicePartner, use _fillContact function
     * @param gN1 it's group Node and segment Node
     * @param invoiceDetailOrder 
     */
    protected _fillN1Grp_InvoiceDetailShipping(gN1: ASTNode, tInvDShipping: TidyInvoiceDetailShipping) {
        let N1 = this._dSeg1(gN1, 'N1');
        let role = this._segVal(N1, 1);
        if (!role || !MAPS.mapN1_InvoiceDetailShipping[role]) {
            return;
        }

        // N1        
        // let contact = invoicePartner.ele('Contact');
        let tContact = new TidyContact();
        this._fillContact(tContact, gN1, tInvDShipping);

        tContact.sendTo(tInvDShipping.Contact.ele('Contact'));
    } // end function



    /**
     * It's for whole gN1 group, including REF and PER
     * @param tContact 
     * @param role 
     * @param N1 
     * @param gN1 
     * @param tInvoicePartner if 'undefined' or not TidyInvoicePartner , we don't set value for this object
     */
    private _fillContact(tContact: TidyContact, gN1: ASTNode, tInvoicePartner?: TidyInvoicePartner | TidyInvoiceDetailShipping) {
        let N1 = this._dSeg1(gN1, 'N1');
        let role = this._segVal(N1, 1);
        let vMappedRole = MAPS.mapN1_InvoicePartner[role];
        vMappedRole = vMappedRole ? vMappedRole : MAPS.mapN1_InvoiceDetailShipping[role];
        tContact.att('role', vMappedRole);

        if (role == 'FR') {
            this._NTE(tContact);
        }
        tContact.Name.ele('Name').att(XML.lang, 'en').txt(this._segVal(N1, 2));
        let codeQualifier = MAPS.mapIdentificationCodeQualifier[this._segVal(N1, 3)];
        if (codeQualifier) {
            tContact.att('addressIDDomain', codeQualifier);
        }
        let vAddressID = this._segVal(N1, 4);
        if (vAddressID) {
            tContact.att('addressID', vAddressID);
        }

        // N2
        let N2s: EdiSegment[] = this._dSegs(gN1, 'N2');
        if (N2s && N2s.length > 0) {
            for (let segN2 of N2s) {
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
        let arrN3: EdiSegment[] = this._dSegs(gN1, 'N3');
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

        this._X12N4(gN1, tContact);

        // REF All and GT 4G 4O
        let N1REFs: EdiSegment[] = this._dSegs(gN1, 'REF');
        for (let REF of N1REFs) {
            let v1 = this._segVal(REF, 1);
            let v2 = this._segVal(REF, 2);
            let v3 = this._segVal(REF, 3);
            switch (v1) {
                case 'ME':
                    let postalAddress = this._ele2(tContact.PostalAddress, 'PostalAddress');
                    postalAddress.att('name', v2);
                    break;
                case 'SI':
                    // will do outside this function
                    break;
                case 'CN':
                    // will do outside this function
                    break;
                case 'TW':
                    tContact.IdReference.ele(XML.IdReference).att(XML.identifier, v3).att(XML.domain, 'taxID');
                    if (tInvoicePartner instanceof TidyInvoicePartner) {
                        tInvoicePartner.IdReference.ele(XML.IdReference).att(XML.identifier, v3).att(XML.domain, 'taxID');
                    }
                    break;
                case 'GT':
                    // Double Map
                    if (tInvoicePartner instanceof TidyInvoicePartner) {
                        tInvoicePartner.IdReference.ele(XML.IdReference).att(XML.identifier, v3).att(XML.domain, 'gstID');
                        tInvoicePartner.IdReference.ele(XML.IdReference).att(XML.identifier, v3).att(XML.domain, 'gstTaxID');
                    }
                    if (['FR', 'SO'].includes(role)) {
                        // Additional for Contact
                        tContact.IdReference.ele(XML.IdReference).att(XML.identifier, v3).att(XML.domain, 'gstID');
                        tContact.IdReference.ele(XML.IdReference).att(XML.identifier, v3).att(XML.domain, 'gstTaxID');
                    }
                    break;
                default:
                    let vMappedDomain = this._mcs(MAPS.mapN1RefPart1, v1);
                    if (tInvoicePartner instanceof TidyInvoicePartner) {
                        if (vMappedDomain) {
                            tInvoicePartner.IdReference.ele(XML.IdReference).att(XML.identifier, v3).att(XML.domain, vMappedDomain);
                        } else {
                            // ZZ
                            tInvoicePartner.IdReference.ele(XML.IdReference).att(XML.identifier, v3).att(XML.domain, v2);
                        }
                    }
                    // Additional for Contact
                    if (['FR', 'SO'].includes(role) && ['4G', '4O'].includes(v1)) {
                        tContact.IdReference.ele(XML.IdReference).att(XML.identifier, v3).att(XML.domain, vMappedDomain);
                    }
                    if (role == 'FR' && v1 == 'AEC') {
                        // added a map
                        this._tInvDReqH.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, 'supplierCommercialIdentifier')
                            .txt(v3);
                    }
            } // end switch v101

        } // end loop N1REFs


        // PER
        let PER = this._dSeg1(gN1, 'PER');
        this._PER(PER, tContact);
    }

    /**
     * for N1_REF, some data is not for TidyContact, we handle these data
     * @param tContact 
     * @param role 
     * @param N1 
     * @param gN1 
     * @param eInvoicePartner if 'undefined' , we don't set value for this object
     */
    private _N1_REF_Material_Special(tInvDShipping: TidyInvoiceDetailShipping, gN1: ASTNode) {
        let N1 = this._dSeg1(gN1, 'N1');
        let vN1_01 = this._segVal(N1, 1);

        // REF All and GT 4G 4O
        let N1REFs = this._dSegs(gN1, 'REF');
        for (let REF of N1REFs) {
            let v1 = this._segVal(REF, 1);
            let v2 = this._segVal(REF, 2);
            let v3 = this._segVal(REF, 3);
            switch (v1) {
                case 'SI':
                    if (['SF', 'ST'].includes(vN1_01)) {
                        if (!this._chd(tInvDShipping.ShipmentIdentifier, 'ShipmentIdentifier')) {
                            // Data of Item Level is set by N1 level, we need to avoid duplication 
                            tInvDShipping.ShipmentIdentifier.ele('ShipmentIdentifier').txt(v2)
                                .att('trackingNumberDate', v3);
                        }
                    }
                    break;
                case 'CN':
                    if ('CA' == vN1_01) {
                        tInvDShipping.CarrierIdentifier.ele('CarrierIdentifier').att(XML.domain, v2).txt(v3);
                    }
                    break;

                default:
                    break;
            } // end switch v101

        } // end loop N1REFs
    }
}

export class MAPS {
    static mapN1_InvoicePartner: Object = {
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
        //"CA": "carrierCorporate", // Differ MapSpec
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
        //"SF": "shipFrom", // Differ MapSpec
        "SO": "soldTo",
        //"ST": "shipTo", // Differ MapSpec
        "SU": "supplierCorporate",
        "TO": "receipientParty",
        "UK": "senderBusinessSystemID",
        "ZZ": "Mutually Defined",
    };

    static mapN1_InvoiceDetailShipping: Object = {
        "CA": "carrierCorporate",
        "SF": "shipFrom",
        "ST": "shipTo",
    };

    static mapIdentificationCodeQualifier: Object = {
        "1": "DUNS",
        "2": "SCAC",
        "4": "IATA",
        "9": "DUNS+4",
        "91": "", // Not Mapped
        "92": "", // Not Mapped
    }
    /**
     * Be carefull with "GT", it needs double map
     */
    static mapN1RefPart1: Object = {
        "01": "abaRoutingNumber",
        "02": "swiftID",
        "03": "chipsID",
        "11": "accountID",
        "12": "accountPayableID",
        "14": "ibanID",
        "72": "BuyerPlannerCode",
        "3L": "bankBranchID",
        "3S": "pstID",
        "4B": "loadingPoint",
        "4C": "storageLocation",
        "4G": "provincialTaxID",
        "4L": "supplierLocationID",
        "4O": "qstID",
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
        //"GT": "gstTaxID,gstID", // !! Need Double Map !!
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
    };

    static mapREF: Object = {
        "01": "transitRoutingNumber",
        "02": "swiftID",
        "03": "chipsParticipantID",
        "04": "financialBranchAndInstitution",
        "05": "chipsUserID",
        //"06": "computerManufacturerSystemID",
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
        // "4N": "specialPaymentRefNo",
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
        // "ACE": "serviceRequestNo",
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
        // "AH": "masterAgreementID",
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
        // "BM": "billOfLadingNo",
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
        // "EU": "endUsersPurchaseOrderNo",
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
        "F8": "originalReferenceNo",
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
        //"FJ": "lineItemControlNumber",
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
        //"I5": "invoiceID",
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
        "IL": "internalOrderID",
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
        // "KK": "deliveryReference",
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
        // "L1": "lettersOrNotes",
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
        "ON": "dealerOrderNo",
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
        // "PD": "promotionDealNo",
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
        // "PK": "packingListNo",
        "PL": "priceListNo",
        "PLA": "productLicensingAgreementNo",
        "PLN": "proposedContractNo",
        "PM": "partNo",
        "PMN": "premarketApplicationNo",
        "PN": "permitNo",
        "PNN": "patentNo",
        // "PO": "purchaseOrderID",
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
        // "RV": "receivingNo",
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
        // "VN": "supplierOrderID",
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
        "ZB": "ultimateConsignee",
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
        // "ZZ": "mutuallyDefined",
    }

    static mapITD107: Object = {
        "AA": "draft", //draft
        "AB": "cash", //cash
        "AC": "creditCard", //creditCard
        "AD": "directDeposit", //directDeposit
        "C": "check", //check
        "D": "debitCard", //debitCard
        "G": "ach", //ach
        "H": "ach", //ach
        "J": "ach", //ach
        "O": "ach", //ach
        "T": "wire", //wire
        "Y": "creditTransfer", //creditTransfer
    }
    static mapTXI963: Object = {
        "AA": "other", //other
        "AB": "other", //other
        "AT": "other", //other
        "BP": "other", //other
        "CA": "other", //other
        "CB": "other", //other
        "CG": "gst", //gst
        "CI": "other", //other
        "CP": "sales", //sales
        "CR": "other", //other
        "CS": "sales", //sales
        "CT": "other", //other
        "CV": "gst", //gst
        "DL": "other", //other
        "EQ": "other", //other
        "ET": "other", //other
        "EV": "other", //other
        "F1": "other", //other
        "F2": "other", //other
        "F3": "other", //other
        "FD": "usage", //usage
        "FF": "other", //other
        "FI": "withholdingTax", //withholdingTax
        "FL": "other", //other
        "FR": "other", //other
        "FS": "other", //other
        "FT": "other", //other
        "GR": "other", //other
        "GS": "gst", //gst
        "HS": "other", //other
        "HT": "other", //other
        "HZ": "other", //other
        "LB": "other", //other
        "LO": "other", //other
        "LS": "sales", //sales
        "LT": "sales", //sales
        "LU": "other", //other
        "LV": "other", //other
        "MA": "other", //other
        "MN": "other", //other
        "MP": "other", //other
        "MS": "other", //other
        "MT": "other", //other
        "OH": "other", //other
        "OT": "other", //other
        "PG": "other", //other
        "PS": "other", //other
        // """PG"":""other
        // or
        // ""qst"": If TXI05 is '.qc.ca'
        // ""hst"": If TXI05 is '.ns.ca', '.nf.ca' , '.nb.ca','.on.ca' or '.pe.ca'
        // ""pst"": for all other Canada tax locations. (end with .ca)"", //other
        // or
        // ""qst"": If TXI05 is '.qc.ca'
        // ""hst"": If TXI05 is '.ns.ca', '.nf.ca' , '.nb.ca','.on.ca' or '.pe.ca'
        // ""pst"": for all other Canada tax locations. (end with .ca)"
        // """PS"":""other
        // or
        // ""qst"": If TXI05 is '.qc.ca'
        // ""hst"": If TXI05 is '.ns.ca', '.nf.ca' , '.nb.ca','.on.ca' or '.pe.ca'
        // ""pst"": for all other Canada tax locations. (end with .ca)"", //other
        // or
        // ""qst"": If TXI05 is '.qc.ca'
        // ""hst"": If TXI05 is '.ns.ca', '.nf.ca' , '.nb.ca','.on.ca' or '.pe.ca'
        // ""pst"": for all other Canada tax locations. (end with .ca)"
        "SA": "other", //other
        "SB": "other", //other
        "SC": "other", //other
        "SE": "usage", //usage
        "SF": "other", //other
        "SL": "other", //other
        "SP": "other", //other
        "SR": "other", //other
        "SS": "other", //other
        "ST": "sales", //other
        // """ST"":""sales
        // or
        // ""qst"": If TXI05 is '.qc.ca'
        // ""hst"": If TXI05 is '.ns.ca', '.nf.ca' , '.nb.ca','.on.ca' or '.pe.ca'
        // ""pst"": for all other Canada tax locations. (end with .ca)"", //sales
        // or
        // ""qst"": If TXI05 is '.qc.ca'
        // ""hst"": If TXI05 is '.ns.ca', '.nf.ca' , '.nb.ca','.on.ca' or '.pe.ca'
        // ""pst"": for all other Canada tax locations. (end with .ca)"
        "SU": "other", //other
        "SX": "other", //other
        "T1": "other", //other
        "T2": "other", //other
        "TD": "other", //other
        "TT": "usage", //usage
        "UL": "other", //other
        "UT": "usage", //usage
        "VA": "vat", //vat
        "WS": "other", //other
        "ZA": "other", //other
        "ZB": "other", //other
        "ZC": "usage", //usage
        "ZD": "other", //other
        "ZE": "other", //other
        "ZZ": "other", //other

    }
    static mapSAC1300: Object = {
        "A010": "AbsoluteMinimumCharge", //Absolute Minimum Charge
        "A020": "AccessCharge-Federal", //Access Charge - Federal
        "A030": "AccessCharge-State", //Access Charge - State
        "A040": "AccessCharge", //Access Charges
        "A050": "AccountNumberCorrectionCharge", //Account Number Correction Charge
        "A060": "AcidBattery", //Acid (Battery)
        "A070": "AcknowledgementOfDeliveryFee-AOD", //Acknowledgement of Delivery Fee (AOD)
        "A080": "ActivationOfCarnet", //Activation of Carnet
        "A090": "AdValorem", //Ad Valorem
        "A100": "Addon-Destination", //Add on - Destination
        "A110": "Addon-Origin", //Add on - Origin
        "A112": "AddToMakeMarketValue", //Add to Make Market Value
        "A120": "AdditionalCopiesOfFreightBill", //Additional Copies of Freight Bill
        "A121": "AdditionalCommercialInvoices", //Additional Commercial Invoices
        "A122": "AdditionalTariffClassifications", //Additional Tariff Classifications
        "A130": "AdditionalMaterial", //Additional Material
        "A140": "AddressCorrection", //Address Correction
        "A150": "AdjustmentForMaximumChargesBilling", //Adjustment for Maximum Charges Billing
        "A160": "AdjustmentForMinimumAverageTimeRequirementBilling", //Adjustment for Minimum Average Time Requirement Billing
        "A170": "Adjustment", //Adjustments
        "A172": "Administrative", //Administrative
        "A180": "AdvanceChargesHandling", //Advance Charges Handling
        "A190": "AdvanceDestinationAmount", //Advance Destination Amount
        "A200": "AdvanceDestinationFee", //Advance Destination Fee
        "A210": "AdvanceFee", //Advance Fee
        "A220": "AdvanceLadingCharge", //Advance Lading Charge
        "A230": "AdvanceOriginAmount", //Advance Origin Amount
        "A240": "AdvanceOriginFee", //Advance Origin Fee
        "A250": "Advances", //Advances
        "A260": "AdvertisingAllowance", //Advertising Allowance
        "A270": "Affidavit", //Affidavit
        "A280": "AgentDisbursement-Destination", //Agent Disbursement - Destination
        "A290": "AgentDisbursement-Origin", //Agent Disbursement - Origin
        "A300": "AirExportCertificate", //Air Export Certificate
        "A310": "AirExpressCharge", //Air Express Charge
        "A320": "AirTransportationCharge", //Air Transportation Charge
        "A330": "AircraftOnGround-AOG", //Aircraft On Ground (AOG)
        "A340": "AirlineOpeningFee", //Airline Opening Fee
        "A350": "AirportTerminalHandlingCharge", //Airport Terminal Handling Charge
        "A360": "AlcoholicBeverageReportCharge", //Alcoholic Beverage Report Charge
        "A370": "AlleghenyCountyAndPADeliveryCharge", //Allegheny County, PA Delivery Charge
        "A380": "AllowanceAdvance", //Allowance Advance
        "A390": "AllowanceForConsignmentMerchandise", //Allowance for Consignment Merchandise
        "A400": "AllowanceNon-performance", //Allowance Non-performance
        "A410": "Alterations", //Alterations
        "A420": "AmendingExportDocumentation", //Amending Export Documentation
        "A430": "AnnealOrHeat-SteelOrGlassTreatment", //Anneal/Heat (Steel or Glass Treatment)
        "A440": "AnodizingCharge", //Anodizing Charge
        "A445": "Anti-dumpingDuty", //Anti-dumping Duty
        "A450": "Appointment-Notification", //Appointment (Notification)
        "A460": "Arbitrary-InAdditionToThroughRatesAndCharges", //Arbitrary (In Addition to Through Rates and Charges)
        "A470": "ArtWork", //Art Work
        "A480": "Assembly", //Assembly
        "A485": "AssistAmount", //Assist Amount
        "A490": "AttachmentsToBillOfLadingCharge", //Attachments to Bill of Lading Charge
        "A500": "BadDebt", //Bad Debt
        "A510": "BankingDrafts", //Banking Drafts
        "A520": "Charge", //Base Charge
        "A530": "BasicReorderAllowance", //Basic Reorder Allowance
        "A540": "BeamingCharge", //Beaming Charge
        "A550": "BeddingOrFeedingOrDisinfecting", //Bedding/Feeding/Disinfecting
        "A555": "BeefFee", //Beef Fee
        "A560": "BeyondCharge", //Beyond Charge
        "A570": "BeyondFreightCharges", //Beyond Freight Charges
        "A580": "BillAndHold", //Bill and Hold
        "A590": "BillOfLadingAttendancy", //Bill of Lading Attendancy
        "A600": "BillOfLadingCharge", //Bill of Lading Charge
        "A610": "BilledDemand", //Billed Demand
        "A620": "BlackLungTax", //Black Lung Tax
        "A630": "BlockingAndBracingCharge", //Blocking and Bracing Charge
        "A640": "BlowerCharge", //Blower Charge
        "A650": "BobtailCharges", //Bobtail Charges
        "A658": "BondAmount", //Bond Amount
        "A660": "BondCharge", //Bond Charge
        "A670": "BordeauxArbitraries", //Bordeaux Arbitraries
        "A680": "Both-Flat", //Both-Flat
        "A690": "BreakBulkSurfaceCharge", //Break Bulk Surface Charge
        "A691": "BreakbulkServices", //Breakbulk Services
        "A700": "BridgeToll", //Bridge Toll
        "A710": "BrokenLot", //Broken Lot
        "A720": "BrokenPackageCharge", //Broken Package Charge
        "A721": "Brokerage", //Brokerage
        "A730": "BrokerageOrDuty", //Brokerage or Duty
        "A740": "BunkerSurcharge", //Bunker Surcharge
        "A750": "Burning", //Burning
        "A760": "BuyerHandCarry", //Buyer Hand Carry
        "A770": "BuyersCarAllowance", //Buyers Car Allowance
        "A780": "CablePressurization", //Cable Pressurization
        "A790": "Cables-SendingOf", //Cables (sending of)
        "A800": "CallTag", //Call Tag
        "A810": "CampArbitrary", //Camp Arbitrary
        "A820": "CanadaGreatLakesAdditionals", //Canada Great Lakes Additionals
        "A830": "CanadianC.Q.CustomsClearance", //Canadian C.Q.Customs Clearance
        "A840": "CanadianCurrencyExchange", //Canadian Currency Exchange
        "A850": "CanadianImportTerminationFee", //Canadian Import Termination Fee
        "A860": "CanadianReconsignmentFee", //Canadian Reconsignment Fee
        "A870": "CanadianRemanifestFee", //Canadian Remanifest Fee
        "A880": "CancellationCharge", //Cancellation Charge
        "A890": "CancelledOrder-HeavyDutyFlatcar", //Cancelled Order, Heavy Duty Flatcar
        "A900": "Capping", //Capping
        "A910": "CarLoading", //Car Loading
        "A920": "CarRental", //Car Rental
        "A930": "CarrierCreditAllowance", //Carrier Credit Allowance
        "A940": "CarrierDebitAllowance", //Carrier Debit Allowance
        "A950": "CarrierNotificationCharge", //Carrier Notification Charge
        "A960": "Carrier", //Carrier
        "A970": "CartageCharge", //Cartage Charge
        "A980": "Cartage", //Cartage
        "A990": "CatalogingServices", //Cataloging Services
        "ADOW": "PayrollAdditives-OvertimeLabor", //Payroll Additives, Overtime Labor
        "ADRW": "PayrollAdditives-StraightTimeLabor", //Payroll Additives, Straight Time Labor
        "AFEE": "Fee", //Fee
        "ALPT": "PortChanges", //Port Changes
        "B000": "CentralBuy", //Central Buy
        "B010": "CentsOff", //Cents Off
        "B015": "BopSheet", //Bop Sheet
        "B020": "CertificateOfConformance", //Certificate of Conformance
        "B030": "CertificateOfOrigin", //Certificate of Origin
        "B040": "CertificateOfRegistration", //Certificate of Registration
        "B050": "Certification", //Certification
        "B060": "ChainAndBinders", //Chain and Binders
        "B070": "ChamberOfCommerceServiceCharge", //Chamber of Commerce Service Charge
        "B080": "ChangeOfAirbilll-ServiceFee", //Change of Airbilll - Service Fee
        "B090": "ChargesForwardOrAdvanceCharge", //Charges Forward/Advance Charge
        "B091": "CharterServices", //Charter Services
        "B100": "ChassisTransfer", //Chassis Transfer
        "B110": "ChemicalMillingCharge", //Chemical Milling Charge
        "B120": "ChicagoLoopCharge", //Chicago Loop Charge
        "B130": "CigaretteStamping", //Cigarette Stamping
        "B140": "CityDelivery", //City Delivery
        "B150": "Citymaintenancefee", //City maintenance fee
        "B160": "CityPick-up", //City Pick-up
        "B170": "CityTerminalCharge", //City Terminal Charge
        "B180": "CleaningCharge", //Cleaning Charge
        "B190": "ClosingAndSealing", //Closing & Sealing
        "B200": "Co-manufacturingDiscount", //Co-manufacturing Discount
        "B210": "Co-opCredit", //Co-op Credit
        "B220": "Coating-DipAndRustproofAndEDP", //Coating (Dip, Rustproof, EDP)
        "B230": "CODAmount", //COD Amount
        "B240": "CODCharges", //COD Charges
        "B250": "CollectOnDeliveryAlterationCharge", //Collect on Delivery Alteration Charge
        "B260": "CollectOnDeliveryDeletionCharge", //Collect on Delivery Deletion Charge
        "B270": "CollectSurcharge", //Collect Surcharge
        "B280": "CombinationPerformanceAndNon-performance", //Combination Performance and Non-performance
        "B290": "Combination", //Combination
        "B300": "CombineAllSameDayShipment", //Combine All Same Day Shipment
        "B310": "CommissionAmount", //Commission Amount
        "B320": "CompetitiveAllowance", //Competitive Allowance
        "B330": "CompetitiveCarAllowance", //Competitive Car Allowance
        "B340": "CompetitivePrice", //Competitive Price
        "B350": "CompressorCharge", //Compressor Charge
        "B360": "ConcessionCredit", //Concession Credit
        "B370": "ConcessionMoney", //Concession Money
        "B380": "CongestionSurcharge", //Congestion Surcharge
        "B390": "ConnectCharge", //Connect Charge
        "B400": "Conservationresearchfee", //Conservation research fee
        "B500": "ConsigneeUnload", //Consignee Unload
        "B510": "Consolidation", //Consolidation
        "B520": "ConstantSurveillanceService-Armed", //Constant Surveillance Service - Armed
        "B530": "ConstantSurveillanceService", //Constant Surveillance Service
        "B540": "ConsularLegalizationService", //Consular Legalization Service
        "B550": "ConsularizationFee", //Consularization Fee
        "B551": "ConsultingService", //Consulting Service
        "B560": "ContainerAllowance", //Container Allowance
        "B570": "ContainerDeposits", //Container Deposits
        "B580": "ContainerDestuffing", //Container Destuffing
        "B581": "ContainerDiscount", //Container Discount
        "B590": "ContainerLeasing", //Container Leasing
        "B600": "ContainerServiceChargeUKorEUR", //Container Service Charge UK/EUR
        "B610": "ContainerServiceChargeUSAorCanada", //Container Service Charge USA/Canada
        "B620": "ContainerStuffing", //Container Stuffing
        "B630": "ContainerOrTrailerAllowance", //Container/Trailer Allowance
        "B650": "ContinuousMileage", //Continuous Mileage
        "B660": "Contract-Allowance", //Contract Allowance
        "B670": "ContractEscalation", //Contract Escalation
        "B680": "ContractServiceCharge", //Contract Service Charge
        "B690": "ControlledAtmosphere", //Controlled Atmosphere
        "B700": "Converting", //Converting
        "B720": "CooperativeAdvertisingOrMerchandisingAllowance-Performance", //Cooperative Advertising/Merchandising Allowance (Performance)
        "B730": "CopyOfBillOfLadingCharge", //Copy of Bill of Lading Charge
        "B740": "CopyOfDeliveryReceiptCharge", //Copy of Delivery Receipt Charge
        "B742": "Copying", //Copying
        "B750": "CoreCharge", //Core Charge
        "B760": "CostRecoveryFactor", //Cost Recovery Factor
        "B770": "CostRecoveryOrAdjustment", //Cost recovery/adjustment
        "B775": "CottonFee", //Cotton Fee
        "B780": "CountAndRecount", //Count and Recount
        "B785": "CouponReimbursement", //Coupon Reimbursement
        "B787": "CountervailingDuty", //Countervailing Duty
        "B790": "Crafting", //Crafting
        "B791": "Crating", //Crating
        "B800": "Credit", //Credit
        "B810": "CurrencyAdjustmentFactor", //Currency Adjustment Factor
        "B820": "CurrencyAdjustment", //Currency Adjustment
        "B830": "CurrencyDiscount", //Currency Discount
        "B840": "CustomerAccountIdentification", //Customer Account Identification
        "B850": "CustomerEquipmentAllowance", //Customer Equipment Allowance
        "B860": "CustomsBrokerFee", //Customs Broker Fee
        "B870": "CustomsCharge", //Customs Charge
        "B872": "CustomsDuty", //Customs Duty
        "B880": "CustomsEntry", //Customs Entry
        "B881": "CustomsExam", //Customs Exam
        "B890": "CustomsFormalities", //Customs Formalities
        "B900": "CustomsInvoice-AdditionalPage", //Customs Invoice - Additional Page
        "B910": "CustomsInvoice", //Customs Invoice
        "B911": "CustomsPenalty", //Customs Penalty
        "B920": "CutAndParallel", //Cut and Parallel
        "B930": "Cut", //Cut
        "B940": "CuttingCharge", //Cutting Charge
        "B950": "DamagedMerchandise", //Damaged Merchandise
        "B960": "DataOrDrawingCharge", //Data/Drawing Charge
        "B970": "De-Installation", //De-Installation
        "B980": "DeadheadMileageCharge", //Deadhead Mileage Charge
        "B990": "DeafAndDisabledSurcharge", //Deaf and Disabled Surcharge
        "B992": "DeclaredValueForCarriage", //Declared Value for Carriage
        "B994": "DeclaredValueForCustoms", //Declared Value for Customs
        "B996": "DeclaredValueForInsurance", //Declared Value for Insurance
        "B998": "DeductToMakeMarketValue", //Deduct to Make Market Value
        "BU2T": "BunkerAdjustment-20FootContainer", //Bunker Adjustment - 20 Foot Container
        "BU4T": "BunkerAdjustment-40FootContainer", //Bunker Adjustment - 40 Foot Container
        "BUAT": "BunkerAdjustment", //Bunker Adjustment
        "BURD": "BurdenAndOverheadOrAllowanceForIndirectCosts", //Burden, Overhead, or Allowance for Indirect Costs
        "C000": "DefectiveAllowance", //Defective Allowance
        "C010": "DeficitFreight", //Deficit Freight
        "C020": "DelayFurnishingDestinationWeights", //Delay Furnishing Destination Weights
        "C030": "DeliverySurcharge", //Delivery Surcharge
        "C040": "Delivery", //Delivery
        "C050": "DemandCharge", //Demand charge
        "C060": "Demurrage-AverageAgreement", //Demurrage - Average Agreement
        "C070": "Demurrage-Special", //Demurrage - Special
        "C080": "Demurrage", //Demurrage
        "C090": "DepositCharges", //Deposit Charges
        "C100": "DepositInLieuOfOrder", //Deposit In Lieu of Order
        "C110": "Deposit", //Deposit
        "C120": "Deramping", //Deramping
        "C130": "DerrickCharge", //Derrick Charge
        "C140": "DesignatedSupplierInspection", //Designated Supplier Inspection
        "C150": "DestinationCharge", //Destination Charge
        "C160": "Detention-SpecialTypeFlatCar", //Detention - Special Type Flat Car
        "C170": "DetentionLoading", //Detention Loading
        "C180": "DetentionOfPowerUnits", //Detention of Power Units
        "C190": "DetentionOfTrailers", //Detention of Trailers
        "C200": "DetentionUnloading", //Detention Unloading
        "C210": "DeterminedFreight", //Determined Freight
        "C220": "DevelopmentCharge", //Development Charge
        "C230": "DieServiceCharge", //Die Service Charge
        "C231": "Disbursement", //Disbursement
        "C240": "DisconnectCharge", //Disconnect Charge
        "C250": "Discount-DropBoxOrConvenienceCtr.", //Discount - Drop Box/Convenience Ctr.
        "C260": "Discount-Incentive", //Discount - Incentive
        "C270": "Discount-MultipleShipment", //Discount - Multiple Shipment
        "C280": "Discount-ServiceOption-Delivery", //Discount - Service Option (Delivery)
        "C290": "Discount-ServiceOption-Pickup", //Discount - Service Option (Pickup)
        "C300": "Discount-Special", //Discount - Special
        "C310": "Discount", //Discount
        "C320": "DisplayAllowance", //Display Allowance
        "C330": "DistributionFee", //Distribution Fee
        "C340": "DistributionService", //Distribution Service
        "C350": "DistributorDiscountOrAllowance", //Distributor Discount/Allowance
        "C360": "DiversionAndReconsignment", //Diversion and Reconsignment
        "C370": "DiversionCharge", //Diversion Charge
        "C380": "DiversionToAirCharge", //Diversion to Air Charge
        "C390": "Dockage-BoatDetention", //Dockage - Boat Detention
        "C400": "DocumentationCharge", //Documentation Charge
        "C401": "DocumentHandling", //Document Handling
        "C402": "Door-to-Door", //Door-to-Door
        "C410": "DowelPinCharge", //Dowel Pin Charge
        "C420": "Drayage", //Drayage
        "C430": "DrayageOrLineHaul", //Drayage/Line Haul
        "C440": "DriverAssistedUnloading", //Driver Assisted Unloading
        "C450": "Driver'sWages", //Driver's Wages
        "C460": "DropDock", //Drop Dock
        "C470": "DropYard", //Drop Yard
        "C480": "DrumCost", //Drum Cost
        "C490": "DrumDeposit", //Drum Deposit
        "C500": "DrumUpCharge", //Drum Up Charge
        "C510": "DryIce", //Dry Ice
        "C520": "DryerCharge", //Dryer Charge
        "C530": "DutyCharge", //Duty Charge
        "C531": "DutyDrawback", //Duty Drawback
        "C540": "EarlyBuyAllowance", //Early Buy Allowance
        "C550": "EarlyPaymentAllowance", //Early Payment Allowance
        "C560": "EarlyShipAllowance", //Early Ship Allowance
        "C570": "EmergencyPortCharge", //Emergency Port Charge
        "C580": "EmergencyService", //Emergency Service
        "C590": "EmergencySurcharge", //Emergency Surcharge
        "C600": "EmptyWeighingCharge", //Empty Weighing Charge
        "C610": "Enclosure", //Enclosure
        "C630": "EndorsementFee", //Endorsement Fee
        "C640": "EnergyCharge", //Energy charge
        "C650": "EnergySurcharge-FuelAdjustmentFactor", //Energy Surcharge (Fuel Adjustment Factor)
        "C660": "EngineeringCharge", //Engineering Charge
        "C670": "Engraving", //Engraving
        "C675": "EnteredValue", //Entered Value
        "C680": "EnvironmentalProtectionService", //Environmental Protection Service
        "C690": "Escalation", //Escalation
        "C700": "EscortService", //Escort Service
        "C710": "Eur1PresentationFee", //Eur1 Presentation Fee
        "C720": "EuropeanPortCharges", //European Port Charges
        "C730": "ExcessMileageCharge", //Excess Mileage Charge
        "C740": "ExcessPeriods", //Excess Periods
        "C750": "ExcessValueFee", //Excess Value Fee
        "C760": "ExcessWeight", //Excess Weight
        "C770": "ExcessiveValueCharge", //Excessive Value Charge
        "C780": "ExchangeAccessCredit", //Exchange Access Credit
        "C790": "ExclusiveUseOfEquipment", //Exclusive Use Of Equipment
        "C800": "ExclusiveUse", //Exclusive Use
        "C810": "ExhibitionDeliveryCharge", //Exhibition Delivery Charge
        "C820": "ExhibitionPickupCharge", //Exhibition Pickup Charge
        "C830": "ExpandedService", //Expanded Service
        "C840": "ExpeditedOneDayConsularService", //Expedited One Day Consular Service
        "C850": "ExpeditedServiceCharge", //Expedited Service Charge
        "C860": "ExpeditedShipments", //Expedited Shipments
        "C870": "ExpeditingFee", //Expediting Fee
        "C880": "ExpeditingPremium", //Expediting Premium
        "C890": "ExportCustomsClearance", //Export Customs Clearance
        "C900": "ExportDeclarations-Automated", //Export Declarations - Automated
        "C910": "ExportDeclarations-U.S.Shippers", //Export Declarations - U.S. Shippers
        "C920": "ExportLicenseApplication", //Export License Application
        "C930": "ExportShippingCharge", //Export Shipping Charge
        "C940": "ExportOrImportCharge", //Export/Import Charge
        "C950": "ExtraCopiesAndMailings", //Extra Copies and Mailings
        "C960": "ExtraLabor-HelperService", //Extra Labor (Helper Service)
        "C970": "ExtraLength", //Extra Length
        "C980": "ExtraService-Counter-to-Counter", //Extra Service - Counter-to-Counter
        "C990": "FabricationCharge", //Fabrication Charge
        "CA2T": "CurrencyAdjustment-20FootContainer", //Currency Adjustment - 20 Foot Container
        "CA4T": "CurrencyAdjustment-40FootContainer", //Currency Adjustment - 40 Foot Container
        "CFCT": "CustomsFees-ContainerLevel", //Customs Fees - Container Level
        "CFLT": "CustomsFees-LiftLevel", //Customs Fees - Lift Level
        "CGTT": "CargoTaxes", //Cargo Taxes
        "CLDT": "ContainerLossOrDamage", //Container Loss/Damage
        "COMM": "CommunicationsCharges", //Communications Charges
        "CRLT": "ContainerLease", //Container Lease
        "CTLT": "ControlledAtmosphere", //Controlled Atmosphere
        "CUFT": "CurrencyAdjustment-BreakBulk", //Currency Adjustment - Break Bulk
        "D000": "FacsimileCharges-AdditionalPages", //Facsimile Charges - Additional Pages
        "D010": "FacsimileCharges", //Facsimile Charges
        "D015": "Dunnage", //Dunnage
        "D020": "FailedLampPanelCharge", //Failed Lamp Panel Charge
        "D025": "FaxPre-alert", //Fax Pre-alert
        "D030": "FederalTransferSurcharge", //Federal Transfer Surcharge
        "D040": "FinanceCharge", //Finance Charge
        "D050": "FirstArticleCharge", //First Article Charge
        "D060": "FirstFlightOut", //First Flight Out
        "D070": "FlatRate", //Flat Rate
        "D080": "FloorStockProtection", //Floor Stock Protection
        "D100": "FoodAndLodging", //Food and Lodging
        "D101": "ForeignOfficeAdvance", //Foreign Office Advance
        "D103": "ForeignCustomsDuty", //Foreign Customs Duty
        "D110": "ForeignMilitarySales-FMS-Rental", //Foreign Military Sales (FMS) Rental
        "D120": "ForeignMilitarySales-FMS-SpecialCharge", //Foreign Military Sales (FMS) Special Charge
        "D130": "ForwardingAgentCommission", //Forwarding Agent Commission
        "D140": "ForwardingCharge", //Forwarding Charge
        "D141": "ForwardCoupons", //Forward Coupons
        "D142": "CaptureAdditionalData", //Capture Additional Data
        "D143": "ProvideNameAndAddress", //Provide Name and Address
        "D144": "ProvideHouseholdIdentifier", //Provide Household Identifier
        "D150": "Franchisefee", //Franchise fee
        "D160": "FreeDomicileShipmentProcessing", //Free Domicile Shipment Processing
        "D170": "FreeGoods", //Free Goods
        "D180": "FreightBasedOnDollarMinimum", //Freight Based on Dollar Minimum
        "D190": "FreightChargesToBorder", //Freight Charges to Border
        "D200": "FreightChargesToDestination", //Freight Charges to Destination
        "D210": "FreightEqualization", //Freight Equalization
        "D220": "FreightPassthrough", //Freight Passthrough
        "D230": "FreightSurcharge", //Freight Surcharge
        "D240": "Freight", //Freight
        "D242": "FreightInternational", //Freight, International
        "D244": "Freight-International-U.S.Dollars", //Freight, International, U.S. Dollars
        "D246": "Freight-International-Non-U.S.Dollars", //Freight, International, Non-U.S. Dollars
        "D250": "FreshnessOrLeakerAllowance", //Freshness/Leaker Allowance
        "D260": "FuelCharge", //Fuel Charge
        "D270": "FuelSurcharge", //Fuel Surcharge
        "D280": "FullService", //Full Service
        "D290": "FullTruckloadAllowance", //Full Truckload Allowance
        "D292": "Fumigation", //Fumigation
        "D300": "GarmentDistrict", //Garment District
        "D301": "GatewayFee", //Gateway Fee
        "D310": "GasPressure", //Gas Pressure
        "D320": "Glaze", //Glaze
        "D330": "GoldFactor", //Gold Factor
        "D340": "GoodsAndServicesCharge", //Goods and Services Charge
        "D350": "GoodsAndServicesCreditAllowance", //Goods and Services Credit Allowance
        "D360": "GoodsAndServicesTaxCharge", //Goods and Services Tax Charge
        "D370": "GovernmentInspection", //Government Inspection
        "D380": "GovernmentWarehouseFee-Destination", //Government Warehouse Fee - Destination
        "D390": "GovernmentWarehouseFee-Origin", //Government Warehouse Fee - Origin
        "D400": "GrainDoors", //Grain Doors
        "D410": "GrainFlowCharge", //Grain Flow Charge
        "D420": "Grinding", //Grinding
        "D430": "GrossReceiptsSurcharge", //Gross Receipts Surcharge
        "D440": "GroupageDiscount", //Groupage Discount
        "D450": "GroupedItems", //Grouped Items
        "D460": "GuaranteedInspectionTechnicalService", //Guaranteed Inspection Technical Service
        "D470": "GulfPortDeliveryCharge", //Gulf Port Delivery Charge
        "D480": "HandlingChargesOnDistributionFreightForwardedBeyond", //Handling Charges on Distribution Freight Forwarded Beyond
        "D490": "HandlingFreightAtPositionsNotImmediatelyAdjacentToVehicleCharge", //Handling Freight At Positions Not Immediately Adjacent To Vehicle Charge
        "D500": "Handling", //Handling
        "D501": "HarborMaintenanceReport", //Harbor Maintenance Report
        "D502": "HarborMaintenanceFee", //Harbor Maintenance Fee
        "D510": "HaulingAndHoistingTobeDirectBilled", //Hauling and Hoisting to be Direct Billed
        "D520": "HaulingAndHoisting", //Hauling and Hoisting
        "D530": "HazardousCargoCharge", //Hazardous Cargo Charge
        "D540": "HazardousMaterialsHandlingFee-Domestic", //Hazardous Materials Handling Fee - Domestic
        "D550": "HazardousMaterialsHandlingFee-International", //Hazardous Materials Handling Fee - International
        "D560": "HazardousStorage", //Hazardous Storage
        "D570": "HeatInTransitCharges", //Heat In Transit Charges
        "D580": "HeatTreatCharge", //Heat Treat Charge
        "D590": "HeavyDutyFlatCarCharge", //Heavy Duty Flat Car Charge
        "D600": "HeavyLift", //Heavy Lift
        "D610": "HighSecurityRedIn-bondSealCharge", //High Security Red In-bond Seal Charge
        "D620": "HighwayInterchange", //Highway Interchange
        "D630": "HointinsAndHauling", //Hointins and Hauling
        "D640": "HoldingCharge", //Holding Charge
        "D650": "HomeLineFreightCharge", //Home Line Freight Charge
        "D655": "HoneyFee", //Honey Fee
        "D660": "Hook-upCharge", //Hook-up charge
        "D670": "HoseChargeSpecial", //Hose Charge Special
        "D680": "HoseCharge", //Hose Charge
        "D690": "HouseholdGoodsPick-upOrDelivery", //Household Goods Pick-up or Delivery
        "D700": "IATAAirbillPreparation", //IATA Airbill Preparation
        "D701": "InternationalAirTransportAssociation-IATA-Commission", //International Air Transport Association (IATA) Commission
        "D710": "IATAFee", //IATA Fee
        "D711": "InternationalAirTransportAssociation-IATA-Markup", //International Air Transport Association (IATA) Markup
        "D720": "Identification", //Identification
        "D730": "ImportServiceFee", //Import Service Fee
        "D740": "InTransitPriceProtection", //In Transit Price Protection
        "D750": "InboundFreightCharges", //Inbound Freight Charges
        "D760": "IncomeFreight-ManufacturingToShippingPoint", //Income Freight (Manufacturing to Shipping Point)
        "D770": "IncorrectBillingAccountCharge", //Incorrect Billing Account Charge
        "D780": "IndustryPriceAllowance", //Industry Price Allowance
        "D790": "InitialLicenseFee", //Initial License Fee
        "D800": "InlandTransportation", //Inland Transportation
        "D810": "InsideCableConnectors", //Inside Cable Connectors
        "D820": "InsideDelivery", //Inside Delivery
        "D830": "InsidePick-up", //Inside Pick-up
        "D840": "InspectAtDestination", //Inspect at Destination
        "D850": "InspectAtOrigin", //Inspect at Origin
        "D860": "InspectionFee", //Inspection Fee
        "D870": "Inspection", //Inspection
        "D880": "InstallationAndWarranty", //Installation & Warranty
        "D890": "InstallationAndTraining", //Installation and Training
        "D900": "Installation", //Installation
        "D910": "InsulatedTankCharge", //Insulated Tank Charge
        "D920": "InsuranceFee", //Insurance Fee
        "D930": "InsurancePlacementCostCharge", //Insurance Placement Cost Charge
        "D940": "InsurancePremium", //Insurance Premium
        "D950": "InsuranceProvidedbyLessee", //Insurance Provided by Lessee
        "D960": "InsuranceProvidedbyLessor", //Insurance Provided by Lessor
        "D970": "InsuranceSurcharge", //Insurance Surcharge
        "D980": "Insurance", //Insurance
        "D990": "InterdivisionProfit", //Interdivision Profit
        "D995": "InterestAmount", //Interest Amount
        "DCET": "DamageToCarrierEquipment", //Damage to Carrier Equipment
        "DCVT": "DamageToCarrierVessel", //Damage to Carrier Vessel
        "DDZT": "DrayageAtPortOfDebarkation-RateZone", //Drayage at Port of Debarkation (Rate Zone)
        "DEZT": "DrayageAtPortOfEmbarkation-RateZone", //Drayage at Port of Embarkation (Rate Zone)
        "DFDT": "KeepFromFreezingPercentDifferential", //Keep From Freezing Percent Differential
        "DGET": "DamageToGovernmentEquipment", //Damage to Government Equipment
        "DOVT": "ContainerDiversion", //Container Diversion
        "DPDT": "DrayageAtPortOfDebarkation", //Drayage at Port of Debarkation
        "DPET": "DrayageAtPortOfEmbarkation", //Drayage at Port of Embarkation
        "E000": "InterestOnrefund", //Interest on refund
        "E010": "InterestOnSecurityDeposit", //Interest on Security Deposit
        "E020": "InterimUsePermittedAtSpecialRate", //Interim Use Permitted at Special Rate
        "E022": "InternationalCourier", //International Courier
        "E030": "InternationalDoor-to-DoorHandlingFee", //International Door-to-Door Handling Fee
        "E040": "InterplantCharge", //Interplant Charge
        "E050": "InterstateOrHighwayToll", //Interstate/Highway Toll
        "E060": "Intra-plantCharge", //Intra-plant Charge
        "E063": "InvoiceAdditionalAmount", //Invoice Additional Amount
        "E065": "InvoiceAdjustment", //Invoice Adjustment
        "E067": "InvoiceAt-CostAmount", //Invoice At-Cost Amount
        "E068": "InvoiceDeliveryTermsAmount", //Invoice Delivery Terms Amount
        "E069": "InvoiceNo-ChargeAmount", //Invoice No-Charge Amount
        "E070": "InvoiceServices", //Invoice Services
        "E080": "InvoicewithGoods", //Invoice with Goods
        "E090": "IrishArbitraries", //Irish Arbitraries
        "E100": "IslandDeliveryCharge", //Island Delivery Charge
        "E110": "IslandPick-UpCharge", //Island Pick-Up Charge
        "E120": "ItalianReleaseCharge", //Italian Release Charge
        "E130": "ItemPercentage", //Item Percentage
        "E140": "Item-Unit", //Item-Unit
        "E150": "Koshering", //Koshering
        "E160": "LabelAllowance", //Label Allowance
        "E170": "Labeling", //Labeling
        "E180": "Labor-RepairAndReturnOrders", //Labor (Repair and Return Orders)
        "E190": "LaborCharges", //Labor Charges
        "E191": "Labor-Straight-time", //Labor, Straight-time
        "E192": "Labor-Overtime", //Labor, Overtime
        "E193": "Labor-PremiumOvertime", //Labor, Premium Overtime
        "E200": "LaborCostOfRemoval", //Labor Cost of Removal
        "E210": "LaborService", //Labor Service
        "E220": "Labor-Modify", //Labor, Modify
        "E230": "Labor-NoTroubleFound", //Labor, No Trouble Found
        "E240": "Labor-TestAndCalibrate", //Labor, Test and Calibrate
        "E250": "LadingAdjustmentCharge", //Lading Adjustment Charge
        "E260": "Lashing", //Lashing
        "E270": "LateOrderCharge", //Late Order Charge
        "E280": "LatePaymentCharge", //Late Payment Charge
        "E290": "LayoutOrDesign", //Layout/Design
        "E300": "LayoverCharges", //Layover Charges
        "E310": "LeadFactor", //Lead Factor
        "E320": "LeakingUndergroundStorageTax-LUST", //Leaking Underground Storage Tax (LUST)
        "E330": "LeaseShortfallConsideration", //Lease Shortfall Consideration
        "E340": "LessThanTruckload-LTL-Charge", //Less Than Truckload (LTL) Charge
        "E350": "LetterOfCreditProcessing", //Letter of Credit Processing
        "E360": "LicenseAndTitle", //License and Title
        "E370": "LifelineSurcharge", //Lifeline Surcharge
        "E380": "LiftGate-Truck-OrForkliftServiceAtPick-upOrDelivery", //Lift Gate (Truck) or Forklift Service at Pick-up/Delivery
        "E381": "LimeFee", //Lime Fee
        "E382": "LiquidationAnti-DumpingDuty", //Liquidation Anti-Dumping Duty
        "E384": "LiquidationCountervailingDuty", //Liquidation Countervailing Duty
        "E386": "LiquidationTaxAmount", //Liquidation Tax Amount
        "E388": "LiquidationTotalDueU.S.CustomsService-USCS", //Liquidation Total Due U.S. Customs Service (USCS)
        "E389": "LiquidationTotalFees", //Liquidation Total Fees
        "E390": "LoadWeighingCharge", //Load Weighing Charge
        "E400": "Loading-LaborCharges", //Loading (Labor Charges)
        "E410": "Loading", //Loading
        "E420": "LoanFee", //Loan Fee
        "E430": "LocalDeliveryOrDrayage", //Local Delivery/Drayage
        "E440": "LocomotiveDelayedInSwitchingService", //Locomotive Delayed In Switching Service
        "E450": "LocomotiveUnderOwnPower", //Locomotive Under Own Power
        "E460": "LotCharge", //Lot Charge
        "E470": "LumpSum", //Lump Sum
        "E480": "MachiningCharge", //Machining Charge
        "E485": "MailFee", //Mail Fee
        "E490": "MailInvoiceToEachLocation", //Mail Invoice to Each Location
        "E500": "MailInvoice", //Mail Invoice
        "E510": "Mailing-PostageCost", //Mailing - Postage Cost
        "E520": "Mailing-ServiceFee", //Mailing - Service Fee
        "E530": "ManifestCharge", //Manifest Charge
        "E540": "Manufacturing", //Manufacturing
        "E550": "MarketDevelopmentFunds", //Market Development Funds
        "E560": "MarkingOrTaggingCharge", //Marking or Tagging Charge
        "E570": "MarriageRule", //Marriage Rule
        "E580": "MemoReturnableContainer", //Memo Returnable Container
        "E585": "MerchandiseProcessingFee", //Merchandise Processing Fee
        "E590": "MessageCharge", //Message Charge
        "E600": "MessageRateAdjustment", //Message Rate Adjustment
        "E610": "MessengerService", //Messenger Service
        "E620": "MetalsSurcharge", //Metals Surcharge
        "E630": "MeterCharge", //Meter Charge
        "E640": "MileageFee-ForRepairAndReturn", //Mileage Fee (For Repair and Return)
        "E650": "MileageOrTravel", //Mileage or Travel
        "E660": "MonthlyRental", //Monthly Rental
        "E670": "MountOrDemount", //Mount/Demount
        "E680": "Mounting", //Mounting
        "E690": "MunicipalSurcharge", //Municipal Surcharge
        "E695": "MushroomFee", //Mushroom Fee
        "E700": "N.H.D.Wharfage", //N.H.D. Wharfage
        "E710": "NewDiscount", //New Discount
        "E720": "NewDistributionAllowance", //New Distribution Allowance
        "E730": "NewItemAllowance", //New Item Allowance
        "E740": "NewStoreAllowance", //New Store Allowance
        "E750": "NewStoreDiscount", //New Store Discount
        "E760": "NewWarehouseDiscount", //New Warehouse Discount
        "E770": "NewWarehouse", //New Warehouse
        "E780": "NewYorkDeliveryCharge", //New York Delivery Charge
        "E790": "NewYorkPick-upCharge", //New York Pick-up Charge
        "E800": "NoReturnCreditAllowance", //No Return Credit Allowance
        "E805": "Non-DutiableCharges", //Non-Dutiable Charges
        "E810": "NonGeneratedFreight", //Non Generated Freight
        "E820": "Non-returnableContainers", //Non-returnable Containers
        "E830": "NormalPumpCharge", //Normal Pump Charge
        "E840": "NotarizedAffidavit", //Notarized Affidavit
        "E850": "NotifyConsigneeBeforeDelivery", //Notify Consignee Before Delivery
        "E860": "NotifyConsignee", //Notify Consignee
        "E870": "NozzleCharge", //Nozzle Charge
        "E880": "OceanCharges-Hazardous", //Ocean Charges - Hazardous
        "E890": "OceanFreight", //Ocean Freight
        "E900": "Offshore-Alaska/Hawaii", //Offshore - Alaska/Hawaii
        "E910": "OnCarriage", //On Carriage
        "E920": "OnHandService", //On Hand Service
        "E930": "One-DayService", //One - Day Service
        "E940": "OneTimeEngineeringCharge", //One Time Engineering Charge
        "E950": "One-TimeLicenseFee", //One-Time License Fee
        "E960": "One-Time-OnlyCharge", //One-Time-Only Charge
        "E970": "OnetimeTooling", //Onetime Tooling
        "E980": "OperatorCredit", //Operator Credit
        "E990": "OptionCharge-ColorFabricOfficeFurniture", //Option Charge (Color Fabric Office Furniture)
        "ENGA": "EngineeringSupplies", //Engineering Supplies
        "EXLT": "ExtraLengthSurcharge", //Extra Length Surcharge
        "F000": "OptionalCharge", //Optional Charge
        "F010": "OptionalSoftwareSupportForOperationalSupportSystems", //Optional Software Support for Operational Support Systems
        "F020": "OptionalSoftwareSupportForSwitchingSystems", //Optional Software Support for Switching Systems
        "F030": "OrderNotifyCharge", //Order Notify Charge
        "F040": "Order-Flat", //Order-Flat
        "F050": "Other-SeeRelatedDescription", //Other (See related description)
        "F060": "OtherAccessorialServiceCharge", //Other Accessorial Service Charge
        "F061": "OtherAdvances", //Other Advances
        "F062": "OtherExportCharges", //Other Export Charges
        "F063": "OtherGovernmentAgencyDeclaration", //Other Government Agency Declaration
        "F065": "OtherGovernmentAgencyExam", //Other Government Agency Exam
        "F067": "OtherImportCharge", //Other Import Charge
        "F070": "OutOfRouteMiles", //Out of Route Miles
        "F080": "OutOfZonePick-upOrDelivery", //Out of Zone Pick-up or Delivery
        "F090": "OutsideCableConnectors", //Outside Cable Connectors
        "F100": "OverDimension", //Over Dimension
        "F110": "OverrunCharge", //Overrun Charge
        "F120": "OversizedPremium", //Oversized Premium
        "F130": "OvertimeLoading", //Overtime Loading
        "F140": "PackInvoicewithShipment", //Pack Invoice with Shipment
        "F150": "PackagingService", //Packaging Service
        "F155": "Packaging", //Packaging
        "F160": "Painting-PrimerOrFinish", //Painting (Primer or Finish)
        "F170": "PalletExchangeCharge", //Pallet Exchange Charge
        "F180": "Pallet", //Pallet
        "F190": "Palletizing", //Palletizing
        "F200": "Paralleling", //Paralleling
        "F210": "ParishOrCountySalesTax-Only", //Parish/County Sales Tax (only)
        "F220": "PassingShippersExportEntry", //Passing Shippers Export Entry
        "F225": "PecanFee", //Pecan Fee
        "F230": "PenaltyCharge", //Penalty Charge
        "F240": "PerItemCharge", //Per Item Charge
        "F250": "PerOrderCharge", //Per Order Charge
        "F260": "PerPoundCharge", //Per Pound Charge
        "F270": "PercentOfProduct", //Percent of Product
        "F271": "PercentOfShippedQuantityThatIsReturnable", //Percent of Shipped Quantity That Is Returnable
        "F272": "PercentOfShipmentValueThatIsReturnable", //Percent of Shipment Value That Is Returnable
        "F280": "PerformanceAllowance", //Performance Allowance
        "F290": "PerformanceAward", //Performance Award
        "F300": "PermitCharge", //Permit Charge
        "F310": "PermitsBondsEscortAttendant", //Permits Bonds Escort Attendant
        "F320": "Phosphatizing-SteelTreatment", //Phosphatizing (Steel Treatment)
        "F330": "Pick-upAndDelivery", //Pick-up and Delivery
        "F340": "Pick-Up", //Pick/Up
        "F350": "PickleAndOil", //Pickle and Oil
        "F360": "Pickup-OutofArea", //Pickup - Out of Area
        "F370": "PickupSurcharge", //Pickup Surcharge
        "F380": "PierCharges-Wharfage", //Pier Charges - Wharfage
        "F390": "PierChargesOtherThanWharfage", //Pier Charges Other Than Wharfage
        "F400": "PierPick-upAndOrDelivery", //Pier Pick-up and/or Delivery
        "F401": "PierUnloading", //Pier Unloading
        "F410": "PilotInspection", //Pilot Inspection
        "F420": "PlacementAndOrRemovalCharge", //Placement and/or Removal Charge
        "F430": "Plating", //Plating
        "F440": "PoleAndWood-serviceCharge", //Pole, Wood-service Charge
        "F445": "PorkFee", //Pork Fee
        "F450": "PositioningAtOrigin", //Positioning at Origin
        "F460": "Postage", //Postage
        "F465": "PotatoFee", //Potato Fee
        "F470": "PowerFactorAdjustment", //Power Factor Adjustment
        "F480": "Pre-carriageExcess", //Pre-carriage Excess
        "F490": "Pre-carriage", //Pre-carriage
        "F500": "Pre-PositionedInventoryService", //Pre-Positioned Inventory Service
        "F510": "PreciousMetalContent", //Precious Metal Content
        "F520": "PreloadingCharge", //Preloading Charge
        "F530": "PrelodgeCharge", //Prelodge Charge
        "F540": "PremiseUse", //Premise Use
        "F550": "PremiumCharge", //Premium Charge
        "F560": "PremiumTransportation", //Premium Transportation
        "F570": "PrepaidUsageAllowance", //Prepaid Usage Allowance
        "F580": "PreparationAndDelivery", //Preparation and Delivery
        "F590": "PreparationOfAirWaybill-Origin", //Preparation of Air Waybill - Origin
        "F600": "PreparationOfCanadianCustomsInvoice", //Preparation of Canadian Customs Invoice
        "F610": "PreparationOfCommercialInvoice", //Preparation of Commercial Invoice
        "F620": "PreparationOfExportEntry", //Preparation of Export Entry
        "F630": "PreparationOfInsuranceCertificate", //Preparation of Insurance Certificate
        "F640": "PreparationOfU.S.ExportDocumentation", //Preparation of U.S. Export Documentation
        "F650": "Preparation", //Preparation
        "F660": "PreviousBilling", //Previous Billing
        "F670": "PriceAndMarketingAllowance", //Price and Marketing Allowance
        "F680": "PriceDeviation", //Price Deviation
        "F690": "PriorBalance", //Prior Balance
        "F700": "PriorBillingAmount", //Prior Billing Amount
        "F710": "PriorDeliveryOfBillCharge", //Prior Delivery Of Bill Charge
        "F720": "PriorMonthCredit", //Prior Month Credit
        "F730": "PriorityService", //Priority Service
        "F740": "ProcessInTransitPrivilege", //Process In Transit Privilege
        "F750": "ProcessingCharge", //Processing Charge
        "F760": "Processing", //Processing
        "F770": "ProfessionalFees", //Professional Fees
        "F780": "ProformaInvoice", //Proforma Invoice
        "F790": "ProgressPaymentRequirement", //Progress Payment Requirement
        "F800": "PromotionalAllowance", //Promotional Allowance
        "F810": "PromotionalDiscount", //Promotional Discount
        "F820": "ProofAndComposition", //Proof & Composition
        "F830": "ProofOfDelivery", //Proof of Delivery
        "F840": "ProtectiveService-Cold", //Protective Service - Cold
        "F850": "ProtectiveService-Heat", //Protective Service - Heat
        "F860": "ProtectiveServiceCharge", //Protective Service Charge
        "F870": "PullingEyes", //Pulling Eyes
        "F880": "PumpAirCharge", //Pump Air Charge
        "F890": "PumpCharge", //Pump Charge
        "F900": "PurchaseOption", //Purchase Option
        "F910": "QuantityDiscount", //Quantity Discount
        "F920": "QuantitySurcharge", //Quantity Surcharge
        "F930": "EquipmentManufacturerRestorationAudit", //Equipment Manufacturer Restoration Audit
        "F940": "Ramping", //Ramping
        "F950": "RateCode", //Rate Code
        "F960": "Re-BillCharge", //Re-Bill Charge
        "F970": "Rebate", //Rebate
        "F980": "RebilledDrayage-Destination", //Rebilled Drayage - Destination
        "F990": "RebilledDrayage-Origin", //Rebilled Drayage - Origin
        "F991": "Receiving", //Receiving
        "FAKT": "BargeFreightAllKindsService", //Barge Freight All Kinds Service
        "FLST": "FlatrackSurcharge", //Flatrack Surcharge
        "G000": "RecipientAddressCorrection", //Recipient Address Correction
        "G010": "Reclamation-Federal", //Reclamation, Federal
        "G020": "Reclamation-State", //Reclamation, State
        "G025": "Reconciliation", //Reconciliation
        "G030": "ReconnectCharge", //Reconnect charge
        "G040": "ReconsignConsigneeCharge", //Reconsign Consignee Charge
        "G050": "ReconsignDeliveryCharge", //Reconsign Delivery Charge
        "G060": "ReconsignmentCharge", //Reconsignment Charge
        "G070": "Recoopering-AtOwner'sOrShipper'sExpense", //Recoopering (at Owner's or Shipper's Expense)
        "G080": "RecordOrFiling", //Record/Filing
        "G090": "RecoveryFee", //Recovery Fee
        "G100": "Recovery", //Recovery
        "G110": "RecratingOrRecoopering-Destination", //Recrating/Recoopering - Destination
        "G120": "RecratingOrRecoopering-Origin", //Recrating/Recoopering - Origin
        "G130": "RecurringHardwareMaintenanceCharge", //Recurring Hardware Maintenance Charge
        "G140": "RecurringLicenseFee", //Recurring License Fee
        "G150": "RecurringSoftwareMaintenanceCharge", //Recurring Software Maintenance Charge
        "G160": "Redelivery", //Redelivery
        "G170": "RedistributionAllowance", //Redistribution Allowance
        "G180": "ReductionPrepalletizedCargo", //Reduction Prepalletized Cargo
        "G190": "ReelCable", //Reel Cable
        "G200": "ReelDeposit", //Reel Deposit
        "G210": "Reel", //Reel
        "G220": "Refrigeration", //Refrigeration
        "G230": "RefrigerationOrMechanicalDetention", //Refrigeration/Mechanical Detention
        "G240": "Refund", //Refund
        "G250": "RefurbishingCharge", //Refurbishing Charge
        "G260": "Regain", //Regain
        "G270": "RegistrationOfExportForReentry", //Registration of Export for Reentry
        "G280": "RegistrationOfExportShipments", //Registration of Export Shipments
        "G290": "RegulatoryFee", //Regulatory Fee
        "G300": "Regulatoryrequiredrefund", //Regulatory required refund
        "G310": "ReliabilityCharge", //Reliability Charge
        "G320": "RelinquishmentCharge", //Relinquishment Charge
        "G322": "ReliquidationAnti-DumpingDuty", //Reliquidation Anti-Dumping Duty
        "G324": "ReliquidationCountervailingDuty", //Reliquidation Countervailing Duty
        "G326": "ReliquidationTaxAmount", //Reliquidation Tax Amount
        "G328": "ReliquidationTotalDueU.S.CustomsService-USCS", //Reliquidation Total Due U.S. Customs Service (USCS)
        "G329": "ReliquidationTotalFees", //Reliquidation Total Fees
        "G330": "RentalCharge", //Rental Charge
        "G340": "RentalDeduction", //Rental Deduction
        "G350": "RentsAndLeases", //Rents and Leases
        "G360": "RepackCharge", //Repack Charge
        "G370": "RepairAtBuyersExpenseCharge", //Repair at Buyers Expense Charge
        "G380": "RepairAtCustomerExpenseCharge", //Repair at Customer Expense Charge
        "G390": "RepairAtGovernmentExpenseCharge", //Repair at Government Expense Charge
        "G400": "Repair", //Repair
        "G410": "Repickup", //Repickup
        "G420": "RequestViaCanada", //Request Via Canada
        "G430": "ResearchAndDevelopmentFee", //Research & Development Fee
        "G440": "ResellersDiscount", //Resellers Discount
        "G450": "ResidentialDelivery", //Residential Delivery
        "G460": "ResidentialPick-up", //Residential Pick-up
        "G470": "RestockingCharge", //Restocking Charge
        "G480": "RestrictedArticleFee", //Restricted Article Fee
        "G490": "Retainer", //Retainer
        "G500": "ReturnCargoCharge", //Return Cargo Charge
        "G510": "ReturnableContainer", //Returnable Container
        "G520": "ReturnedLoad", //Returned Load
        "G530": "Rework", //Rework
        "G540": "RidingAttendantCharge", //Riding Attendant Charge
        "G550": "RockyMountainBureau583Item1100ArbitraryCharge", //Rocky Mountain Bureau 583 Item 1100 Arbitrary Charge
        "G560": "RollOutAdjustment", //Roll Out Adjustment
        "G570": "RollRebate", //Roll Rebate
        "G580": "Royalties", //Royalties
        "G590": "Salvage", //Salvage
        "G600": "Same-DayService", //Same - Day Service
        "G610": "SaturdayDelivery", //Saturday Delivery
        "G620": "SaturdayPick-UpOrDeliveryCharge", //Saturday Pick-up or Delivery Charge
        "G630": "SaturdayPick-Up", //Saturday Pick-Up
        "G640": "ScaleChargeUnloading", //Scale Charge Unloading
        "G650": "ScaleCharge", //Scale Charge
        "G660": "ScrapAllowance", //Scrap Allowance
        "G670": "SecuritySignatureService", //Security Signature Service
        "G680": "Segregating-Sorting", //Segregating (Sorting)
        "G690": "SelectCharge", //Select Charge
        "G700": "SelfUnloader", //Self Unloader
        "G710": "SellerHandCarry", //Seller Hand Carry
        "G720": "ServiceAssistanceProgramSurcharge", //Service Assistance Program Surcharge
        "G730": "ServiceCharge-WithCashDiscount", //Service Charge (with Cash Discount)
        "G740": "ServiceCharge", //Service Charge
        "G750": "ServiceUpgrade", //Service Upgrade
        "G760": "Set-up", //Set-up
        "G770": "Shearing", //Shearing
        "G775": "SheepFee", //Sheep Fee
        "G780": "ShipToStockQualityAudit", //Ship to Stock Quality Audit
        "G790": "ShipperLoadAndCount", //Shipper Load and Count
        "G800": "ShipperLoadCarrierCount", //Shipper Load Carrier Count
        "G810": "ShipperLoadConsigneeUnload", //Shipper Load Consignee Unload
        "G820": "ShipperLoad", //Shipper Load
        "G821": "Shipping", //Shipping
        "G830": "ShippingAndHandling", //Shipping and Handling
        "G840": "ShipsidePickup", //Shipside Pickup
        "G850": "Shotblasting", //Shotblasting
        "G860": "ShrinkAllowance", //Shrink Allowance
        "G870": "Shrink-WrapCharge", //Shrink-Wrap Charge
        "G880": "ShrinkageAllowance", //Shrinkage Allowance
        "G890": "SingleInvoiceAllowance", //Single Invoice Allowance
        "G900": "SinglePick-up", //Single Pick-up
        "G910": "SingleShipmentFee", //Single Shipment Fee
        "G920": "Sleeving", //Sleeving
        "G930": "SlipSheetUnloadingAllowance", //Slip Sheet Unloading Allowance
        "G940": "SlipSheet-Rail", //Slip Sheet, Rail
        "G950": "SlipSheet-Truck", //Slip Sheet, Truck
        "G960": "SlottingAllowance", //Slotting Allowance
        "G970": "SmallOrderCharge", //Small Order Charge
        "G980": "SoftwareSupportService", //Software Support Service
        "G990": "SourceInspection", //Source Inspection
        "GMST": "GarmentSurcharge", //Garment Surcharge
        "H000": "SpecialAllowance", //Special Allowance
        "H010": "SpecialBuy", //Special Buy
        "H020": "SpecialCircusTrains", //Special Circus Trains
        "H030": "SpecialCredit", //Special Credit
        "H040": "SpecialDelivery", //Special Delivery
        "H050": "SpecialDetentionCharge", //Special Detention Charge
        "H060": "SpecialEquipmentCharge", //Special Equipment Charge
        "H070": "SpecialFinishCharge", //Special Finish Charge
        "H080": "SpecialFreightSupplements", //Special Freight Supplements
        "H090": "SpecialHandling", //Special Handling
        "H100": "SpecialMileageMovements", //Special Mileage Movements
        "H110": "SpecialPackaging", //Special Packaging
        "H120": "SpecialPermits", //Special Permits
        "H130": "SpecialPickup", //Special Pickup
        "H140": "SpecialPumpCharge", //Special Pump Charge
        "H150": "SpecialSealCharge", //Special Seal Charge
        "H151": "SpecialServices", //Special Services
        "H160": "SpecialTestEquipmentCharge", //Special Test Equipment Charge
        "H170": "SpecialToolingCharge", //Special Tooling Charge
        "H180": "SpecialToolingreworkcharge", //Special Tooling rework charge
        "H190": "SpecialTrainMovement", //Special Train Movement
        "H200": "SpecialUse", //Special Use
        "H210": "SpecialVehicleRent", //Special Vehicle Rent
        "H215": "SpecificDuty", //Specific Duty
        "H220": "SpecificationReview", //Specification Review
        "H230": "SplitDelivery", //Split Delivery
        "H240": "SplitPick-UpAtPierCharge", //Split Pick-Up at Pier Charge
        "H250": "SplitPick-up", //Split Pick-up
        "H260": "SpoolCharge", //Spool Charge
        "H270": "SpottingOfTrailer", //Spotting of Trailer
        "H280": "SpreaderCharge", //Spreader Charge
        "H290": "StampFee", //Stamp Fee
        "H300": "Stamping", //Stamping
        "H310": "StandbyCharge", //Standby Charge
        "H320": "StateMotorFuel", //State Motor Fuel
        "H330": "StateSalesCharge", //State Sales Charge
        "H340": "StateSurcharge", //State Surcharge
        "H350": "StateOrMetropolitanTransitAuthoritySurcharge", //State/Metropolitan Transit Authority Surcharge
        "H360": "SteamingCharge", //Steaming Charge
        "H370": "StencilingCharge", //Stenciling Charge
        "H380": "Stop-offAtPierCharge", //Stop-off at Pier Charge
        "H390": "Stop-offCharge", //Stop-off Charge
        "H400": "Stopcharge", //Stopcharge
        "H410": "StoppingInTransit", //Stopping In Transit
        "H420": "StorageInTransit", //Storage In Transit
        "H430": "Storage", //Storage
        "H440": "StraighteningCharge", //Straightening Charge
        "H450": "Strapping", //Strapping
        "H460": "Streetlampscharge", //Street lamps charge
        "H470": "StrippingAndSortingAndConsolidation", //Stripping, Sorting, and Consolidation
        "H480": "SubjectToCooperativeAdvertisingAllowance", //Subject to Cooperative Advertising Allowance
        "H490": "SubjectToTaxOnResale", //Subject To Tax On Resale
        "H500": "SufferanceWarehouseCharge-ExportOrImport", //Sufferance Warehouse Charge (Export or Import)
        "H505": "SugarFee", //Sugar Fee
        "H507": "SumOfAddsAndDeductsToMakeMarketValue", //Sum of Adds and Deducts to Make Market Value
        "H510": "SundayOrHolidayPick-upOrDelivery", //Sunday or Holiday Pick-up or Delivery
        "H520": "SuperBagCharge", //Super Bag Charge
        "H530": "SupervisorCharge", //Supervisor Charge
        "H535": "SupplementalDuty", //Supplemental Duty
        "H540": "SupplementalItems", //Supplemental Items
        "H550": "Surcharge", //Surcharge
        "H551": "SuretyBond", //Surety Bond
        "H560": "Swell", //Swell
        "H570": "SwitchCharge", //Switch Charge
        "H580": "SwitchingCharge", //Switching Charge
        "H590": "TankCarAllowance", //Tank Car Allowance
        "H600": "TankRental", //Tank Rental
        "H605": "Tarping", //Tarping
        "H610": "Tax-AirportTax-Destination", //Tax - Airport Tax, Destination
        "H620": "Tax-AirportTax-Origin", //Tax - Airport Tax, Origin
        "H625": "Tax-BeverageTax", //Tax - Beverage Tax
        "H630": "Tax-CitySalesTax-Only", //Tax - City Sales Tax (Only)
        "H640": "Tax-ExciseTax-Destination", //Tax - Excise Tax - Destination
        "H650": "Tax-ExciseTax-Origin", //Tax - Excise Tax - Origin
        "H660": "Tax-FederalExciseTax-FET", //Tax - Federal Excise Tax, FET
        "H670": "Tax-FederalExciseTax-FET-onTires", //Tax - Federal Excise Tax, FET, on Tires
        "H680": "Tax-Governmental", //Tax - Governmental
        "H690": "Tax-HandlingChargeTax", //Tax - Handling Charge Tax
        "H700": "Tax-LocalTax", //Tax - Local Tax
        "H710": "Tax-MetropolitanTransitTax", //Tax - Metropolitan Transit Tax
        "H720": "Tax-RegulatoryTax", //Tax - Regulatory Tax
        "H730": "Tax-LocalSalesTax", //Tax - Local Sales Tax
        "H740": "Tax-SalesandUse", //Tax - Sales and Use
        "H750": "Tax-SalesTax-StateAndLocal", //Tax - Sales Tax (State and Local)
        "H760": "Tax-StateHazardousSubstance", //Tax - State Hazardous Substance
        "H770": "Tax-StateTax", //Tax - State Tax
        "H780": "Tax-SuperFundExciseTax", //Tax - Super Fund Excise Tax
        "H790": "Tax-UseTax", //Tax - Use Tax
        "H800": "Tax-ValueAddedTax-VAT", //Tax - Value Added Tax (VAT)
        "H806": "TaxCredit", //Tax Credit
        "H810": "TaxLiability-Amortized", //Tax Liability - Amortized
        "H820": "TaxLiability-OneTime", //Tax Liability - One Time
        "H830": "TaxOnMiscellaneousCharges", //Tax on Miscellaneous Charges
        "H840": "TaxOnTransportation", //Tax on Transportation
        "H850": "Tax", //Tax
        "H855": "TeaFee", //Tea Fee
        "H860": "TechnologyExchange", //Technology Exchange
        "H870": "TelegramChargeback", //Telegram Chargeback
        "H880": "Telephone-Destination", //Telephone - Destination
        "H890": "Telephone-Origin", //Telephone - Origin
        "H900": "TelephoneCharge", //Telephone Charge
        "H910": "TemperatureProtection", //Temperature Protection
        "H920": "TemporaryAllowance", //Temporary Allowance
        "H930": "TemporaryVoluntaryAllowance", //Temporary Voluntary Allowance
        "H935": "TenderedasTruckload", //Tendered as Truckload
        "H940": "TerminalCharge", //Terminal Charge
        "H950": "TerminalDifferential", //Terminal Differential
        "H960": "TerminalServiceFee", //Terminal Service Fee
        "H970": "Allowance", //Terms Allowance
        "H980": "TestOrQualificationCharge", //Test/Qualification Charge
        "H990": "TestingServicesCharge", //Testing Services Charge
        "HZDT": "HazardousCargoOnDeck", //Hazardous Cargo on Deck
        "I000": "Testing", //Testing
        "I010": "ThirdPartyAllowance", //Third Party Allowance
        "I020": "ThirdPartyPallets", //Third Party Pallets
        "I030": "ThroughputAllowance", //Throughput Allowance
        "I040": "ThroughputContainerCharge", //Throughput Container Charge
        "I050": "ThruwayCharge", //Thruway Charge
        "I060": "TicketingService", //Ticketing Service
        "I070": "TobaccoProductsReportCharge", //Tobacco Products Report Charge
        "I080": "TOFCServiceCharge", //TOFC Service Charge
        "I090": "ToolCharge", //Tool Charge
        "I100": "ToolingReworkCharge", //Tooling Rework Charge
        "I110": "Tooling", //Tooling
        "I120": "ToolsForPrinting", //Tools for Printing
        "I130": "TotalAssessorialCharges", //Total Assessorial Charges
        "I131": "TotalFees", //Total Fees
        "I132": "TotalInvoiceAmount", //Total Invoice Amount
        "I133": "TotalDueU.S.CustomsService-USCS", //Total Due U.S. Customs Service (USCS)
        "I134": "TotalInvoiceAmount-U.S.Dollars", //Total Invoice Amount, U.S. Dollars
        "I136": "TotalInvoiceAmount-Non-U.S.Dollars", //Total Invoice Amount, Non-U.S. Dollars
        "I138": "TotalMaterialInvoiceAmount", //Total Material Invoice Amount
        "I140": "TracingInboundViaOtherCarriers", //Tracing Inbound Via Other Carriers
        "I150": "TracingServiceFee", //Tracing Service Fee
        "I160": "TrackStorage", //Track Storage
        "I170": "TradeDiscount", //Trade Discount
        "I180": "TradeIn", //Trade In
        "I190": "TrailerRentalCharge", //Trailer Rental Charge
        "I200": "TransferCharge", //Transfer Charge
        "I210": "TransferOfLadingCharge", //Transfer of Lading Charge
        "I220": "TransferredCharges", //Transferred Charges
        "I230": "Transit", //Transit
        "I240": "TransportationAndSetup", //Transportation And Setup
        "I250": "TransportationCharge-MinimumRate", //Transportation Charge (Minimum Rate)
        "I260": "TransportationDirectBilling", //Transportation Direct Billing
        "I270": "TransportationThirdPartyBilling", //Transportation Third Party Billing
        "I280": "TransportationVendorProvided", //Transportation Vendor Provided
        "I290": "TrimmingCharge", //Trimming Charge
        "I300": "TruckDetention", //Truck Detention
        "I310": "TruckloadDiscount", //Truckload Discount
        "I320": "TurningCharge", //Turning Charge
        "I330": "Two-DayService", //Two - Day Service
        "I340": "TwoDoorPickUp", //Two Door Pick Up
        "I350": "U.S.Vehicles", //U.S. Vehicles
        "I360": "UnabsorbedSwitching", //Unabsorbed Switching
        "I370": "Unitized", //Unitized
        "I380": "Unloading-LaborCharges", //Unloading (Labor Charges)
        "I390": "Unloading", //Unloading
        "I400": "UnloadingOrReloadingCharge", //Unloading/Reloading Charge
        "I410": "UnsaleableMerchandiseAllowance", //Unsaleable Merchandise Allowance
        "I411": "UnscheduledFee", //Unscheduled Fee
        "I420": "UpCharge", //Up Charge
        "I430": "UsagePlanDetailCharge", //Usage Plan Detail Charge
        "I431": "U.S.CustomsService-USCS-FlatAssistAmount", //U.S. Customs Service (USCS) Flat Assist Amount
        "I432": "U.S.CustomsService-USCS-MaximumAssistAmount", //U.S. Customs Service (USCS) Maximum Assist Amount
        "I440": "USDAInspected-StampingCertification", //USDA Inspected, Stamping Certification
        "I450": "Use-SpecialTypeFlatCar", //Use - Special Type Flat Car
        "I460": "UseChargeToolingOrPersonnel", //Use Charge Tooling/Personnel
        "I470": "ValuationFee", //Valuation Fee
        "I480": "VehicleOrderedbutNotUsed", //Vehicle Ordered but Not Used
        "I490": "VehiclePrepCharge-CourtesyDelivery", //Vehicle Prep Charge (Courtesy Delivery)
        "I495": "VehicleRoadCharge", //Vehicle Road Charge
        "I500": "VendorFreight", //Vendor Freight
        "I510": "VentingInstructions", //Venting Instructions
        "I520": "VirginIslandTransferCharge", //Virgin Island Transfer Charge
        "I530": "Volume-Discount", //Volume Discount
        "I540": "VoluntaryContributionCharge", //Voluntary Contribution Charge
        "I550": "WaitingTime", //Waiting Time
        "I560": "WarRiskSurcharge", //War Risk Surcharge
        "I570": "Warehouse", //Warehouse
        "I580": "Warehousing", //Warehousing
        "I590": "Warranties", //Warranties
        "I595": "WatermelonFee", //Watermelon Fee
        "I600": "WaybillAndInvoiceDistribution", //Waybill and Invoice Distribution
        "I610": "WeatherProtection", //Weather Protection
        "I620": "WeightVerificationCharge", //Weight Verification Charge
        "I630": "WharfageAndHandling", //Wharfage & Handling
        "I640": "WharfageCharge", //Wharfage Charge
        "I650": "WideAreaTelephoneService-WATS-UsageCredit", //Wide Area Telephone Service (WATS) Usage Credit
        "I660": "WillCallCharge", //Will Call Charge
        "I670": "WrittenProofOfDelivery", //Written Proof of Delivery
        "I680": "X-rayCharge", //X-ray Charge
        "I690": "Gratuity", //Gratuity
        "I700": "Escrow", //Escrow
        "I710": "Payment", //Payment
        "I720": "DirectProductHandling-DPC", //Direct Product Handling (DPC)
        "I730": "PriceAdjustmentPercent-PCT", //Price Adjustment Percent (PCT)
        "I740": "PostDamagedHandling-PDC", //Post Damaged Handling (PDC)
        "I750": "ReclamationCenterHandling-Chute", //Reclamation Center Handling (Chute)
        "I760": "ReclamationSharedResponsibility-SRS", //Reclamation Shared Responsibility (SRS)
        "IDCT": "ImproperDocumentation", //Improper Documentation
        "LC2T": "LandCurrencyAdjustmentFactor-20FootContainer", //Land Currency Adjustment Factor - 20 Foot Container
        "LC4T": "LandCurrencyAdjustmentFactor-40FootContainer", //Land Currency Adjustment Factor - 40 Foot Container
        "LCLT": "PercentDifferential-LessThanContainer", //Percent Differential - Less Than Container
        "LECT": "LessThanContainer", //Less Than Container
        "LFDT": "LinehaulfromPortOfDebarkation", //Linehaul from Port of Debarkation
        "LMDT": "LinerTermsAtPortOfEmbarkation", //Liner Terms at Port of Embarkation
        "LNDT": "LinerTermsAtPortOfDebarkation", //Liner Terms at Port of Debarkation
        "LPDT": "LinehaulPercentDifferential", //Linehaul Percent Differential
        "LQDT": "LiquidatedDamages", //Liquidated Damages
        "LTET": "LinehaulToPortOfEmbarkation", //Linehaul to Port of Embarkation
        "MATT": "ModifiedAtmosphere", //Modified Atmosphere
        "OCNT": "OverHeightContainer", //Over Height Container
        "OFFA": "OfficeSupplies", //Office Supplies
        "OODT": "OnDeckBreakBulkDifferential", //On Deck Break Bulk Differential
        "OTHR": "OtherMiscellaneousEarningOrAdditive", //Other Miscellaneous Earning or Additive
        "OWCT": "OverWidthContainer", //Over Width Container
        "PRST": "StuffingCharge", //Stuffing Charge
        "PTAX": "PayrollTaxes", //Payroll Taxes
        "PVPT": "PrivateOwnedVehicleProcessing", //Private Owned Vehicle Processing
        "R020": "PersonalProperty-Member", //Personal Property, Member
        "R030": "PersonalProperty-Spouse", //Personal Property, Spouse
        "R040": "PortHandlingAndUnloading", //Port Handling and Unloading
        "R060": "PackingAndCratingAndHandlingCharge", //Packing, Crating, and Handling Charge
        "R080": "PackingAndCratingAndHandlingAndTransportationCharge", //Packing, Crating, Handling, and Transportation Charge
        "RDHT": "RailheadHandling", //Railhead Handling
        "RFMT": "ReeferMaintenance", //Reefer Maintenance
        "RPDT": "ReeferCargoPercentDifferential", //Reefer Cargo Percent Differential
        "RSTT": "Respotting", //Respotting
        "SFBT": "SingleFactorOriginationOrDestination", //Single Factor Origination/Destination
        "SFDT": "SingleFactorOriginationOrPortOfDebarkation", //Single Factor Origination/Port of Debarkation
        "SFET": "SingleFactorPortOfEmbarkationOrDestination", //Single Factor Port of Embarkation/Destination
        "SSCT": "StrippingAndSortingAndConsolidation", //Stripping, Sorting and Consolidation
        "SSUT": "PoleLashingEquipment-PLE-Surcharge", //Pole Lashing Equipment (PLE) Surcharge
        "STDT": "StopoffAtDestination", //Stopoff at Destination
        "STFT": "Stuffing", //Stuffing
        "STOT": "StopoffAtOrigination", //Stopoff at Origination
        "TERT": "TerminalHandlingCharges", //Terminal Handling Charges
        "VCLT": "VanCleaning", //Van Cleaning
        "WBBT": "Wharfage-Breakbulk", //Wharfage - Breakbulk
        "WCFT": "Wharfage-Container", //Wharfage - Container
        "WFTT": "WastedOrFutileTrip", //Wasted/Futile Trip
        "WRBT": "WarRiskCrewInsurance", //War Risk Crew Insurance
        "WRIT": "WarRiskInsurance", //War Risk Insurance
        "ZZZZ": "MutuallyDefined", //Mutually Defined

    }


}