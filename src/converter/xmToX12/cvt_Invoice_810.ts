/* eslint-disable no-undef */
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_810 } from "../../info/info_810";
import { ConvertPattern, X12, XML, XMLPath, versionKeys } from "../../cat_const";
import { create } from "xmlbuilder2";
import { format } from "date-fns";
import { CUtilX12 } from "../../utils/cUtilX12";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { ConvertErr, EdiElement, EdiSegment } from "../../new_parser/entities";
import { ConverterBase } from "../converterBase";
import { ASTNode } from "../../new_parser/syntaxParserBase";
import { MAPS_XML_X12, XmlConverterBase } from "../xmlConverterBase";
import { DOMParser } from "@xmldom/xmldom";
import xpath = require('xpath');

/**
 * No need to make singleton because parserUtil already assured it
 */
export class Cvt_Invoice_810 extends XmlConverterBase {
    protected _convertErrs: ConvertErr[];
    protected _cntReceiptItem: number = 0;
    protected _isHeaderInvoice: boolean = false;
    protected _nFirstOrder: Element;
    protected _nFirstOrderRef: Element;
    protected _bNONPO = false;
    protected _isPriceAdjustmentInLine: boolean = false;
    protected _bSummaryInvoice = false;
    protected _arrExcludeREF_ZZ = ['DeliveryNoteNumber', 'ultimateCustomerReferenceID', 'totalNumberOfLineItems',
        'supplierCommercialIdentifier', 'invoiceSourceDocument', 'taxExchangeRate'];

    private _fromXMLCheck() {
        this._convertErrs = []; // clear previouse check results
    }

    /*
    Condition:
    Map from OrderRequest to  830
    If cXML/Request/OrderRequest/ItemOut/ReleaseInfo/@releaseType='forecast' 
    and If not cXML/Request/OrderRequest/ItemOut/@agreementType='scheduling_agreement'  (862)	
    */
    public fromXML(vsdoc: vscode.TextDocument): string {

        this._init(vsdoc);

        // this._fromXMLCheck();
        // if (this._hasConvertErr()) {
        //     return this._renderConvertErr();
        // }

        this._ISA(true);
        this._GS(false, 'IN');
        this._ST('810');

        let nHeader = this._rn('/InvoiceDetailRequest/InvoiceDetailRequestHeader');
        let nOrders = this._es('InvoiceDetailOrder', this._rn('/InvoiceDetailRequest'));
        let nInvoiceDetailSummary = this._rn('/InvoiceDetailRequest/InvoiceDetailSummary');
        let vIsHeaderInvoice = this._v('InvoiceDetailHeaderIndicator/@isHeaderInvoice', nHeader);
        if (vIsHeaderInvoice && (vIsHeaderInvoice == 'yes')) {
            this._isHeaderInvoice = true;
        }
        if (nOrders.length > 0) {
            this._nFirstOrder = nOrders[0];
            this._nFirstOrderRef = this._e('InvoiceDetailOrderInfo/OrderReference', this._nFirstOrder);
        }
        // BIG
        let d: Date = new Date();
        let sInvoiceDate = this._v('@invoiceDate', nHeader);
        let sInvoiceID = this._v('@invoiceID', nHeader);
        let BIG = this._initSegX12('BIG', 9);
        let sOrderDate = this._v('@orderDate', this._nFirstOrderRef);
        let sOrderID = this._v('@orderID', this._nFirstOrderRef);


        let dInvoiceDate = Utils.parseToDateSTD2(sInvoiceDate);
        if (dInvoiceDate) {
            this._setV(BIG, 1, Utils.getYYYYMMDD(dInvoiceDate));
        }
        this._setV(BIG, 2, sInvoiceID);
        let dOrderDate = Utils.parseToDateSTD2(sOrderDate);
        if (dOrderDate) {
            this._setV(BIG, 3, Utils.getYYYYMMDD(dOrderDate));
        }
        let vInvoiceSourceDocument = this._v('Extrinsic [@name="invoiceSourceDocument"]', nHeader);
        if (this._isHeaderInvoice || (vInvoiceSourceDocument == 'NoOrderInformation')) {
            this._setV(BIG, 4, '');
        } else {
            switch (vInvoiceSourceDocument) {
                case 'PurchaseOrder':
                    this._setV(BIG, 4, sOrderID);
                    break;
                case 'ExternalPurchaseOrder':
                    this._bNONPO = true;
                    this._setV(BIG, 4, 'NONPO');
                    break;

                default:
                    break;
            } // end switch
        } // end else 

        let sHeaderPurpose = this._v('@purpose', nHeader);
        if (sHeaderPurpose.toLowerCase() == 'standard') {
            //"standard":"DI", // standard, Not Summary
            //"standard":"FD", // standard, Summary Invoice
            if (nOrders.length > 1) {
                this._bSummaryInvoice = true;
                this._setV(BIG, 7, 'FD');
            } else {
                this._setV(BIG, 7, 'DI');
            }
        } else {
            this._setV(BIG, 7, this._mci(MAPS.mapBIG640, sHeaderPurpose));
        } // end if sHeaderPurpose

        let sHeaderOperation = this._v('@operation', nHeader);
        this._setV(BIG, 8, this._mci(MAPS.mapBIG353, sHeaderOperation));
        let vIsInformationOnly = this._v('@isInformationOnly', nHeader);
        if (vIsInformationOnly) {
            this._setV(BIG, 9, 'NA');
        }

        // NTE LegalStatus
        let nLegalStatus = this._e('Extrinsic [@name="LegalStatus"]', nHeader);
        if (nLegalStatus) {
            let NTE = this._initSegX12('NTE', 2);
            this._setV(NTE, 1, 'REG');
            this._setV(NTE, 2, this._v('', nLegalStatus));
        }
        // NTE LegalCapital
        let nLegalCapital = this._e('Extrinsic [@name="LegalCapital"]', nHeader);
        if (nLegalCapital) {
            let NTE = this._initSegX12('NTE', 2);
            this._setV(NTE, 1, 'CBH');
            this._setV(NTE, 2, this._v('Money', nLegalCapital) + ' ' + this._v('Money/@currency', nLegalCapital));
        }

        // CUR file summary
        let arrAlt: string[] = [];
        let nSubtotalAmountMoney = this._e('SubtotalAmount/Money', nInvoiceDetailSummary);
        arrAlt.push(this._v('@alternateCurrency', nSubtotalAmountMoney));
        let nDueAmountMoney = this._e('DueAmount/Money', nInvoiceDetailSummary);
        arrAlt.push(this._v('@alternateCurrency', nDueAmountMoney));
        let nTaxMoney = this._e('Tax/Money', nInvoiceDetailSummary);
        arrAlt.push(this._v('@alternateCurrency', nTaxMoney));
        let nTotalAmountWithoutTaxMoney = this._e('TotalAmountWithoutTax/Money', nInvoiceDetailSummary);
        arrAlt.push(this._v('@alternateCurrency', nTotalAmountWithoutTaxMoney));
        let vCurr;
        let vCurrAlt;
        if (nSubtotalAmountMoney) {
            vCurr = this._v('@currency', nSubtotalAmountMoney);
        } else if (nDueAmountMoney) {
            vCurr = this._v('@currency', nDueAmountMoney);
        }
        vCurrAlt = arrAlt.find(str => str.trim() !== "");
        let CUR = this._initSegX12('CUR', 5);
        this._setV(CUR, 1, 'SE');
        this._setV(CUR, 2, vCurr);
        this._setV(CUR, 3, this._v('Extrinsic [@name="TaxExchangeRate" or @name="taxExchangeRate" ]', nHeader));
        if (vCurrAlt) {
            this._setV(CUR, 4, 'SE');
            this._setV(CUR, 5, vCurrAlt);
        }
        // REF AH
        let nMasterRef;
        let nMasterAgreementReference = this._e('InvoiceDetailOrderInfo/MasterAgreementReference', this._nFirstOrder);
        let nMasterAgreementIDInfo = this._e('InvoiceDetailOrderInfo/MasterAgreementIDInfo', this._nFirstOrder);
        nMasterRef = nMasterAgreementReference ? nMasterAgreementReference : nMasterAgreementIDInfo;
        if (nMasterRef) {
            let REF = this._initSegX12('REF', 3);
            this._setV(REF, 1, 'AH');
            this._setV(REF, 2, this._v('@agreementID', nMasterRef));
            if (this._v('@agreementType', nMasterRef) == 'scheduling_agreement') {
                this._setV(REF, 3, '1');
            }
        }


        let nReceiptIDInfo = this._e('InvoiceDetailReceiptInfo/ReceiptIDInfo', this._nFirstOrder);
        // REF I5
        // this._REF_KV_X12('I5', sInvoiceID);
        // REF IV
        this._REF_KV_X12D('IV', sInvoiceID);
        let nShipNoticeIDInfo = this._e('ShipNoticeIDInfo', nHeader);
        // REF MA
        let vShipNoticeID = this._v('@shipNoticeID', nShipNoticeIDInfo);
        this._REF_KV_X12D('MA', vShipNoticeID);
        // REF PO
        let nOrderIDInfo = this._e('InvoiceDetailOrderInfo/OrderIDInfo', this._nFirstOrder);
        if (this._bNONPO) {
            this._REF_KV_X12D('PO', this._v('@orderID', nOrderIDInfo));
        } else {
            this._REF_KV_X12D('PO', sOrderID); // from first order reference
        }
        // REF VN
        this._REF_KV_X12D('VN', this._v('InvoiceDetailOrderInfo/SupplierOrderInfo/@orderID', this._nFirstOrder));
        // REF 06, Maybe this is not needed for Supplier created cXML/EDI
        // because it's automatically added by CIG
        let nIdentity = this._prn('/cXML/Header/To/Credential [@domain="SystemID"]/Identity');
        if (nIdentity) {
            this._REF_KV_X12D('06', this._v('', nIdentity));
        }
        // REF PK
        this._REF_KV_X12D('PK', this._v('IdReference [@domain="packListID"]/@identifier', nShipNoticeIDInfo));
        // REF BM
        this._REF_KV_X12D('BM', this._v('IdReference [@domain="freightBillID"]/@identifier', nShipNoticeIDInfo));
        // REF EU
        this._REF_KV_X12D('EU', this._v('Extrinsic[@name="ultimateCustomerReferenceID"]', nHeader));
        // REF KK
        this._REF_KV_X12D('KK', this._v('Extrinsic[@name="DeliveryNoteNumber"]', nHeader));
        // REF CR
        this._REF_KV_X12D('CR', this._v('IdReference [@domain="CustomerReferenceID"]/@identifier', nHeader));
        // REF RV
        if (this._bNONPO) {
            this._REF_KV_X12D('RV', this._v('@receiptID', nReceiptIDInfo));
        } else {
            this._REF_KV_X12D('RV', this._v('InvoiceDetailReceiptInfo/ReceiptReference/@receiptID', this._nFirstOrder));
        }
        // REF 4N
        this._REF_KV_X12D('4N', this._v('PaymentProposalIDInfo/@paymentProposalID', nHeader));

        // REF ZZ and others
        this._extrinsic_all(nHeader);

        // /InvoiceDetailRequest/InvoiceDetailRequestHeader/InvoicePartner/...
        // Group N1
        let nInvoicePartners = this._es('InvoicePartner', nHeader);
        for (let nIP of nInvoicePartners) {
            let nContact = this._e('Contact', nIP);
            this._GroupN1(nContact, undefined, nIP);
        }

        // /InvoiceDetailRequest/InvoiceDetailRequestHeader/InvoiceDetailShipping/…
        let nInvoiceDetailShipping = this._e('InvoiceDetailShipping', nHeader);
        let nContacts = this._es('Contact', nInvoiceDetailShipping);
        for (let nContact of nContacts) {
            this._GroupN1(nContact, nInvoiceDetailShipping);
        }

        // ITD
        this._ITD(nHeader);

        // DTM 003
        this._DTM_X12(nHeader, '@invoiceDate', '003');
        // DTM 922
        this._DTM_X12(nHeader, 'InvoiceIDInfo/@invoiceDate', '922');
        // DTM 004
        if (this._bNONPO) {
            this._DTM_X12(nOrderIDInfo, '@orderDate', '004');
        } else {
            this._DTM_X12A(sOrderDate, '004');
        }

        // DTM 008
        let vSupplierOrderDate = this._v('InvoiceDetailOrderInfo/SupplierOrderInfo/@orderDate', this._nFirstOrder);
        this._DTM_X12A(vSupplierOrderDate, '008');

        // DTM 011
        this._DTM_X12(nInvoiceDetailShipping, '@shippingDate', '011');

        // DTM 050
        if (this._bNONPO) {
            this._DTM_X12(this._nFirstOrder, 'InvoiceDetailReceiptInfo/ReceiptIDInfo/@receiptDate', '050');
        } else {
            this._DTM_X12(this._nFirstOrder, 'InvoiceDetailReceiptInfo/ReceiptReference/@receiptDate', '050');
        }
        // DTM 111
        this._DTM_X12(nShipNoticeIDInfo, '@shipNoticeDate', '111');
        // DTM 186
        this._DTM_X12(nHeader, 'Period/@startDate', '186');
        // DTM 187
        this._DTM_X12(nHeader, 'Period/@endDate', '187');
        // DTM LEA,  it seems a line order level segment
        this._DTM_X12(nMasterAgreementIDInfo, '@agreementDate', 'LEA')
        this._DTM_X12(nMasterAgreementReference, '@agreementDate', 'LEA')

        // N9 Comments
        let nComments = this._e('Comments', nHeader);
        if (nComments) {
            let N9 = this._initSegX12('N9', 3);
            this._setV(N9, 1, 'L1');
            this._setV(N9, 2, this._v('@xml:lang', nComments));
            this._setV(N9, 3, 'Comments');
            let vMsg = this._vt(nComments);
            let bFirstLine = true;
            while (vMsg.length > 0) {
                if (bFirstLine) {
                    let MSG = this._initSegX12('MSG', 1);
                    this._setV(MSG, 1, vMsg.substring(0, 264));
                } else {
                    let MSG = this._initSegX12('MSG', 2);
                    this._setV(MSG, 1, vMsg.substring(0, 264));
                    this._setV(MSG, 2, 'LC');
                }
                vMsg = vMsg.substring(264);
                bFirstLine = false;
            }
        }
        let iTotalItems = 0;
        if (this._isHeaderInvoice) {
            this._headerInvoice();
        } else {
            let vIsPriceAdjustmentInLine = this._v('InvoiceDetailLineIndicator/@isPriceAdjustmentInLine', nHeader);
            if (vIsPriceAdjustmentInLine == 'yes') {
                this._isPriceAdjustmentInLine = true;
            }
            for (let nOrder of nOrders) {

                let nItems = this._es('InvoiceDetailItem', nOrder);
                let nServiceItems = this._es('InvoiceDetailServiceItem', nOrder);
                let nOrderInfo = this._e('InvoiceDetailOrderInfo', nOrder);
                if (nItems) {
                    iTotalItems += nItems.length;
                }
                if (nServiceItems) {
                    iTotalItems += nServiceItems.length;
                }
                for (let nItem of nItems) {
                    this._item(nOrderInfo, nItem, false);
                }
                for (let nItem of nServiceItems) {
                    this._item(nOrderInfo, nItem, true);
                }
            } // end loop nOrders
        } // end if _isHeaderInvoice

        // Summary
        // TDS
        let TDS = this._initSegX12('TDS', 4);
        this._setV(TDS, 1, this._x100(this._v('GrossAmount/Money', nInvoiceDetailSummary)));
        this._setV(TDS, 2, this._x100(this._v('SubtotalAmount/Money', nInvoiceDetailSummary)));
        this._setV(TDS, 3, this._x100(this._v('NetAmount/Money', nInvoiceDetailSummary)));
        this._setV(TDS, 4, this._x100(this._v('DueAmount/Money', nInvoiceDetailSummary)));
        // AMT 3 DepositAmount
        this._AMT_X12(nInvoiceDetailSummary, 'DepositAmount/Money', '3');
        // AMT GW TotalCharges
        this._AMT_X12(nInvoiceDetailSummary, 'TotalCharges/Money', 'GW');
        // AMT EC TotalAllowances
        this._AMT_X12(nInvoiceDetailSummary, 'TotalAllowances/Money', 'EC');
        // AMT N NetAmount
        this._AMT_X12(nInvoiceDetailSummary, 'NetAmount/Money', 'N');
        // AMT 1 SubtotalAmount Main
        this._AMT_X12(nInvoiceDetailSummary, 'SubtotalAmount/Money', '1');
        // AMT 1 SubtotalAmount Alt
        this._AMT_X12(nInvoiceDetailSummary, 'SubtotalAmount/Money/@alternateAmount', '1');
        // AMT BAP DueAmount Main
        this._AMT_X12(nInvoiceDetailSummary, 'DueAmount/Money', 'BAP');
        // AMT BAP SubtotaDueAmountlAmount Alt
        this._AMT_X12(nInvoiceDetailSummary, 'DueAmount/Money/@alternateAmount', 'BAP');
        // AMT ZZ TotalAmountWithoutTax Main
        this._AMT_X12(nInvoiceDetailSummary, 'TotalAmountWithoutTax/Money', 'ZZ');
        // AMT ZZ TotalAmountWithoutTax Alt
        this._AMT_X12(nInvoiceDetailSummary, 'TotalAmountWithoutTax/Money/@alternateAmount', 'ZZ');

        let nMods = this._es('InvoiceHeaderModifications/Modification', nInvoiceDetailSummary);
        for (let nMod of nMods) {
            let nAdditionalDeduction = this._e('AdditionalDeduction', nMod);
            let nAdditionalCost = this._e('AdditionalCost', nMod);
            let SAC = this._initSegX12('SAC', 16);
            if (nAdditionalDeduction) {
                let nModDetail = this._e('ModificationDetail', nMod);
                this._setV(SAC, 1, 'A');
                let vName = this._v('@name', nModDetail);
                this._setV(SAC, 2, this._mci(MAPS.mapSAC1300, vName, 'ZZZZ'));
                let vDeductionAmount = this._x100(this._v('DeductionAmount/Money', nAdditionalDeduction));
                if (vDeductionAmount) {
                    this._setV(SAC, 5, vDeductionAmount);
                    this._setV(SAC, 12, '13')
                } else {
                    this._setV(SAC, 5, this._v('DeductedPrice/Money', nAdditionalDeduction));
                    // no need to set SAC12, or maybe '02' ?
                }
                this._setV(SAC, 7, this._v('DeductionPercent/@percent', nAdditionalDeduction));
                this._TXI_mod_common(SAC, nMod);
            } // end if nAdditionalDeduction
            if (nAdditionalCost) {
                let nModDetail = this._e('ModificationDetail', nMod);
                this._setV(SAC, 1, 'C');
                let vName = this._v('@name', nModDetail);
                this._setV(SAC, 2, this._mci(MAPS.mapSAC1300, vName, 'ZZZZ'));
                let vCostAmount = this._x100(this._v('Money', nAdditionalCost));
                if (vCostAmount) {
                    this._setV(SAC, 5, vCostAmount);
                }
                this._setV(SAC, 7, this._v('Percentage/@percent', nAdditionalCost));
                this._TXI_mod_common(SAC, nMod);
            } // end if nAdditionalCost

        } // end loop nMods

        let nInvoiceDetailDiscount = this._e('InvoiceDetailDiscount', nInvoiceDetailSummary);
        if (nInvoiceDetailDiscount) {
            let SAC = this._initSegX12('SAC', 7);
            this._setV(SAC, 1, 'A');
            this._setV(SAC, 2, 'C310');
            this._setV(SAC, 5, this._x100(this._v('Money', nInvoiceDetailDiscount)));
            this._setV(SAC, 6, '3');
            this._setV(SAC, 7, this._v('@percentageRate', nInvoiceDetailDiscount));
        }

        let nShippingAmount = this._e('ShippingAmount', nInvoiceDetailSummary);
        if (nShippingAmount) {
            let SAC = this._initSegX12('SAC', 5);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'G830');
            this._setV(SAC, 5, this._x100(this._v('Money', nShippingAmount)));
            let nTaxDetail = this._e('Tax/TaxDetail[@purpose="shippingTax"]', nInvoiceDetailSummary);
            if (nTaxDetail) {
                this._taxDetail(nTaxDetail, nInvoiceDetailSummary);
            }
        }

        let nSpecialHandlingAmount = this._e('SpecialHandlingAmount', nInvoiceDetailSummary);
        if (nSpecialHandlingAmount) {
            let SAC = this._initSegX12('SAC', 16);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'H090');
            this._setV(SAC, 5, this._x100(this._v('Money', nSpecialHandlingAmount)));
            this._setV(SAC, 15, this._v('Description', nSpecialHandlingAmount));
            this._setV(SAC, 16, this._v('Description/@xml:lang', nSpecialHandlingAmount));
            let nTaxDetail = this._e('Tax/TaxDetail[@purpose="specialHandlingTax"]', nInvoiceDetailSummary);
            if (nTaxDetail) {
                this._taxDetail(nTaxDetail, nInvoiceDetailSummary);
            }
        }

        // SAC Tax H850
        let nTax = this._e('Tax', nInvoiceDetailSummary);
        if (nTax) {
            let SAC = this._initSegX12('SAC', 16);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'H850');
            this._setV(SAC, 5, this._x100(this._v('Money', nTax)));
            let vAlternateAmount = this._v('Money/@alternateAmount', nTax);
            this._setV(SAC, 13, vAlternateAmount);
            this._setV(SAC, 15, this._v('Description', nTax));
            this._setV(SAC, 16, this._v('Description/@xml:lang', nTax));
            let nTaxDetailTax = this._e('TaxDetail[@purpose="tax"]', nTax);
            if (nTaxDetailTax) {
                this._taxDetail(nTaxDetailTax, nInvoiceDetailSummary);
            }
        }

        // CTT
        let CTT = this._initSegX12('CTT', 1);
        // Not follow MapSpec
        //this._setV(CTT, 1, this._v('Extrinsic [@name="totalNumberOfLineItems"]', nHeader));
        this._setV(CTT, 1, iTotalItems.toString());

        this._SE();
        this._GE();
        this._IEA();

        this._tidySegCascade();
        const output = this._segs.join(constants.ediDocument.lineBreak);
        return output;
    }

    private _ITD(nHeader: Element) {
        let ePaymentTerms = this._es('PaymentTerm', nHeader);
        let arrDiscount: Element[] = [];
        let arrPenalty: Element[] = [];
        let bLastIsPenalty: boolean = true;

        // distribute the PaymentTerms to either arrDiscount or arrPenalty
        // you can see it's very tricky if the value is '0'
        for (let ePT of ePaymentTerms) {
            let vDiscountAmountOrg = this._v('Discount/DiscountAmount/Money', ePT);
            let vDiscountPercentOrg = this._v('Discount/DiscountPercent/@percent', ePT);
            if (vDiscountPercentOrg) {
                if (vDiscountPercentOrg.startsWith('-')) {
                    // Penalty
                    arrPenalty.push(ePT);
                    bLastIsPenalty = true;
                } else if (vDiscountPercentOrg == '0') {
                    if (bLastIsPenalty) {
                        arrDiscount.push(ePT);
                        bLastIsPenalty = false;
                    } else {
                        arrPenalty.push(ePT);
                        bLastIsPenalty = true;
                    }
                } else {
                    // Discount
                    arrDiscount.push(ePT);
                    bLastIsPenalty = false;
                }
            } else {
                // vDiscountAmountOrg
                if (vDiscountAmountOrg.startsWith('-')) {
                    // Penalty
                    arrPenalty.push(ePT);
                    bLastIsPenalty = true;
                } else if (vDiscountAmountOrg == '0') {
                    if (bLastIsPenalty) {
                        arrDiscount.push(ePT);
                        bLastIsPenalty = false;
                    } else {
                        arrPenalty.push(ePT);
                        bLastIsPenalty = true;
                    }
                } else {
                    // Discount
                    arrDiscount.push(ePT);
                    bLastIsPenalty = false;
                }
            }
        }

        let iMaxLen = arrDiscount.length > arrPenalty.length ? arrDiscount.length : arrPenalty.length;
        for (let i = 0; i < iMaxLen; i++) {
            let eDiscount = arrDiscount[i];
            let ePenalty = arrPenalty[i];
            // one ITD for both discount and penalty
            let ITD = this._initSegX12('ITD', 15);
            // 01 Basic, 05 Discount Not Applicable, 52 Discount with Prompt Pay
            this._setV(ITD, 1, '01');
            this._setV(ITD, 2, '3');
            let vPaymentMethod = this._v('Extrinsic [@name="paymentMethod"]', nHeader);
            if (vPaymentMethod) {
                this._setV(ITD, 14, vPaymentMethod);
            }
            if (eDiscount) {
                let vPayInNumberOfDays = this._v('@payInNumberOfDays', eDiscount);
                let vDiscountAmountOrg = this._v('Discount/DiscountAmount/Money', eDiscount);
                let vDiscountPercentOrg = this._v('Discount/DiscountPercent/@percent', eDiscount);
                this._setV(ITD, 5, vPayInNumberOfDays);
                if (vDiscountPercentOrg) {
                    this._setV(ITD, 3, vDiscountPercentOrg);
                } else {
                    this._setV(ITD, 8, vDiscountAmountOrg);
                }
                let vDiscountDueDate = this._v('Extrinsic [@name="discountDueDate"]', eDiscount);
                if (vDiscountDueDate) {
                    // Discount due date
                    this._setV(ITD, 4, vDiscountDueDate);
                }
            }
            if (ePenalty) {
                let vPayInNumberOfDays = this._v('@payInNumberOfDays', ePenalty);
                let vDiscountAmountOrg = this._v('Discount/DiscountAmount/Money', ePenalty);
                let vDiscountPercentOrg = this._v('Discount/DiscountPercent/@percent', ePenalty);
                this._setV(ITD, 7, vPayInNumberOfDays);
                if (vDiscountPercentOrg) {
                    this._setV(ITD, 15, this._posSign(vDiscountPercentOrg));
                } else {
                    this._setV(ITD, 10, this._x100(this._posSign(vDiscountAmountOrg)));
                }
                let vDiscountDueDate = this._v('Extrinsic [@name="discountDueDate"]', ePenalty);
                if (vDiscountDueDate) {
                    // Discount due date
                    this._setV(ITD, 4, vDiscountDueDate);
                }
            }
        }
    }

    /**
     * Modifications common for /InvoiceDetailRequest/InvoiceDetailSummary/InvoiceHeaderModifications
     * @param SAC 
     * @param nMod 
     */
    private _TXI_mod_common(SAC: EdiSegment, nMod: Element) {
        this._setV(SAC, 6, '3');
        this._setV(SAC, 13, this._v('OriginalPrice/Money', nMod));
        this._setV(SAC, 14, this._v('OriginalPrice/@type', nMod));
        this._setV(SAC, 15, this._v('ModificationDetail/Description', nMod));
        this._setV(SAC, 16, this._v('ModificationDetail/Description/@xml:lang', nMod));

        // TXI
        let nTax = this._e('Tax', nMod);
        let nTaxDetail = this._e('TaxDetail [@purpose="tax"]', nTax);
        if (nTaxDetail) {
            // TXI Money
            let TXI = this._initSegX12('TXI', 10);
            this._setV(TXI, 1, 'ZZ'); // Should be "ZZ" or "TX"
            this._setV(TXI, 2, this._v('Money', nTax));
            this._setV(TXI, 10, this._v('Description', nTax));
            // TXI TaxDetail
            TXI = this._initSegX12('TXI', 9);
            let vCategory = this._v('@category', nTaxDetail);
            this._setV(TXI, 1, this._mci(MAPS.mapTXI963, vCategory, 'VA'));
            this._setV(TXI, 2, this._v('TaxAmount/Money', nTaxDetail));
            this._setV(TXI, 3, this._v('@percentageRate', nTaxDetail));
            this._setV(TXI, 4, 'VD');
            this._setV(TXI, 5, this._v('TaxLocation', nTaxDetail));
            let vExempt = this._v('@exemptDetail', nTaxDetail);
            // let vExemptDesc = this._v('Description',nTaxDetail);
            if (vExempt == 'exempt') {
                this._setV(TXI, 6, '2');
            } else if (vExempt == 'zeroRated') {
                this._setV(TXI, 6, '0');
            }
            this._setV(TXI, 8, this._v('TaxableAmount/Money', nTaxDetail));
            this._setV(TXI, 9, vCategory);
        }
    }

    /**
     * HEADER INVOICE 
     */
    private _headerInvoice() {
        let nInvoiceDetailHeaderOrder = this._rn('InvoiceDetailRequest/InvoiceDetailHeaderOrder');
        let nInvoiceDetailSummary = this._rn('InvoiceDetailRequest/InvoiceDetailSummary');
        let nInvoiceDetailOrderSummary = this._e('InvoiceDetailOrderSummary', nInvoiceDetailHeaderOrder);
        let vSubtotalAmount = this._v('SubtotalAmount/Money', nInvoiceDetailOrderSummary);
        let vOrderID = this._v('SubtotalAmount/Money', nInvoiceDetailHeaderOrder);
        // IT1
        let IT1 = this._initSegX12('IT1', 9);
        this._setV(IT1, 2, '1');
        this._setV(IT1, 3, 'ZZ');
        this._setV(IT1, 4, vSubtotalAmount);
        this._setV(IT1, 6, 'PO');
        this._setV(IT1, 7, vOrderID);
        let vSupplierOrderID = this._v('InvoiceDetailOrderInfo/SupplierOrderInfo/@orderID', nInvoiceDetailHeaderOrder);
        if (vSupplierOrderID) {
            this._setV(IT1, 8, 'VO');
            this._setV(IT1, 9, vSupplierOrderID);
        }

        // CUR file summary
        let nSubtotalAmountMoney = this._e('SubtotalAmount/Money', nInvoiceDetailSummary);
        let nDueAmountMoney = this._e('DueAmount/Money', nInvoiceDetailSummary);
        let nTaxMoney = this._e('Tax/Money', nInvoiceDetailSummary);
        let nTotalAmountWithoutTaxMoney = this._e('TotalAmountWithoutTax/Money', nInvoiceDetailSummary);
        let vCurr;
        let vCurrAlt;
        if (nSubtotalAmountMoney) {
            vCurr = this._v('@currency', nSubtotalAmountMoney);
        } else if (nDueAmountMoney) {
            vCurr = this._v('@currency', nDueAmountMoney);
        }
        if (nTaxMoney) {
            vCurrAlt = this._v('@alternateCurrency', nTaxMoney);
        } else if (nTotalAmountWithoutTaxMoney) {
            vCurrAlt = this._v('@alternateCurrency', nTotalAmountWithoutTaxMoney);
        }

        // PAM KK  N?
        let vGrossAmount = this._v('GrossAmount/Money', nInvoiceDetailOrderSummary);
        if (vGrossAmount) {
            let PAM = this._initSegX12('PAM', 5);
            this._setV(PAM, 4, 'KK');
            this._setV(PAM, 5, vGrossAmount);
        }
        // REF AH
        let vAgreementID = this._v('InvoiceDetailOrderInfo/MasterAgreementReference/@agreementID', nInvoiceDetailHeaderOrder);
        let vAgreementType = this._v('InvoiceDetailOrderInfo/MasterAgreementReference/@agreementType', nInvoiceDetailHeaderOrder);
        if (vAgreementID) {
            let REF = this._initSegX12('REF', 3);
            this._setV(REF, 1, 'AH');
            this._setV(REF, 2, vAgreementID);
            this._setV(REF, 3, vAgreementType == 'scheduling_agreement' ? '1' : '');
        }
        // REF FJ
        let vInvoiceLineNumber = this._v('InvoiceDetailOrderSummary/@invoiceLineNumber', nInvoiceDetailHeaderOrder);
        this._REF_KV_X12D('FJ', vInvoiceLineNumber);
        // REF L1
        let vComments = this._v('InvoiceDetailOrderSummary/Comments', nInvoiceDetailHeaderOrder);
        if (vComments) {
            let REF = this._initSegX12('REF', 3);
            let vLang = this._v('InvoiceDetailOrderSummary/Comments/@xml:lang', nInvoiceDetailHeaderOrder);
            vLang = vLang ? vLang : 'en';
            this._setV(REF, 1, 'L1');
            this._setV(REF, 2, vLang);
            this._setV(REF, 3, vComments);
        }

        // REF all others
        this._extrinsic_all(nInvoiceDetailOrderSummary);

        // DTM 004
        this._DTM_X12(nInvoiceDetailHeaderOrder, 'InvoiceDetailOrderInfo/OrderReference/@orderDate', '004');
        // DTM 008
        this._DTM_X12(nInvoiceDetailHeaderOrder, 'InvoiceDetailOrderInfo/SupplierOrderInfo/@orderDate', '008');
        // DTM 150
        this._DTM_X12(nInvoiceDetailOrderSummary, 'Period/@startDate', '150');
        // DTM 151
        this._DTM_X12(nInvoiceDetailOrderSummary, 'Period/@endDate', '151');
        // DTM LEA
        this._DTM_X12(nInvoiceDetailOrderSummary, 'InvoiceDetailOrderInfo/MasterAgreementReference/@agreementDate', 'LEA');
        // DTM 517
        this._DTM_X12(nInvoiceDetailOrderSummary, '@inspectionDate', '517');

        // SAC A C310
        let nInvoiceDetailDiscount = this._e('InvoiceDetailDiscount', nInvoiceDetailOrderSummary);
        if (nInvoiceDetailDiscount) {
            let SAC = this._initSegX12('SAC', 7);
            this._setV(SAC, 1, 'A');
            this._setV(SAC, 2, 'C310');
            this._setV(SAC, 5, this._x100(this._v('Money', nInvoiceDetailDiscount)));
            this._setV(SAC, 6, '3');
            this._setV(SAC, 7, this._v('@percentageRate', nInvoiceDetailDiscount));
        }
        // SAC C G830
        let nInvoiceDetailLineShipping = this._e('InvoiceDetailLineShipping', nInvoiceDetailOrderSummary);
        if (nInvoiceDetailLineShipping) {
            let SAC = this._initSegX12('SAC', 5);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'G830');
            this._setV(SAC, 5, this._x100(this._v('Money', nInvoiceDetailLineShipping)));
        }
        // Tax
        let nOrderTax = this._e('Tax', nInvoiceDetailOrderSummary);
        let nTaxDetailShippingTax = this._e('TaxDetail[@purpose="shippingTax"]', nOrderTax);
        if (nTaxDetailShippingTax) {
            this._taxDetail(nTaxDetailShippingTax, nInvoiceDetailSummary);
        } // end if nTaxDetailShippingTax
        // SAC C H090
        let nInvoiceDetailLineSpecialHandling = this._e('InvoiceDetailLineSpecialHandling', nInvoiceDetailOrderSummary);
        if (nInvoiceDetailLineSpecialHandling) {
            let SAC = this._initSegX12('SAC', 16);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'H090');
            this._setV(SAC, 5, this._x100(this._v('Money', nInvoiceDetailLineSpecialHandling)));
            this._setV(SAC, 15, this._v('Description', nInvoiceDetailLineSpecialHandling));
            this._setV(SAC, 16, this._v('Description/@xml:lang', nInvoiceDetailLineSpecialHandling));
        }
        // TXI TaxDetail
        let nTaxDetailSpecialHandling = this._e('TaxDetail[@purpose="specialHandlingTax"]', nOrderTax);
        if (nTaxDetailSpecialHandling) {
            this._taxDetail(nTaxDetailSpecialHandling, nInvoiceDetailSummary);
        } // end if
        // SAC C H850
        if (nOrderTax) {
            let SAC = this._initSegX12('SAC', 16);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'H850');
            this._setV(SAC, 5, this._x100(this._v('Money', nOrderTax)));
            let vAlternateAmount = this._v('Money/@alternateAmount', nOrderTax);
            this._setV(SAC, 13, vAlternateAmount);
            this._setV(SAC, 15, this._v('Description', nOrderTax));
            this._setV(SAC, 16, this._v('Description/@xml:lang', nOrderTax));
            let nTaxDetailTax = this._e('TaxDetail[@purpose="tax"]', nOrderTax);
            if (nTaxDetailTax) {
                this._taxDetail(nTaxDetailTax, nInvoiceDetailSummary);
            }
        } // end if nOrderTax

        let nInvoiceDetailShipping = this._e('InvoiceDetailLineShipping/nInvoiceDetailShipping', nInvoiceDetailOrderSummary);
        let nContacts = this._es('InvoicePartner/Contact', nInvoiceDetailShipping);
        for (let nContact of nContacts) {
            this._GroupN1(nContact, nInvoiceDetailShipping);
        }

    } // end function _headerInvoice

    private _taxDetail(nTaxDetail: Element, nInvoiceDetailSummary: Element) {
        // TXI Main
        let TXI = this._initSegX12('TXI', 10);
        let vCategory = this._v('@category', nTaxDetail);
        let vMappedCategory = this._mci(MAPS.mapTXI963, vCategory, 'ZZ');
        this._setV(TXI, 1, vMappedCategory);
        let vMoney = this._v('TaxAmount/Money', nTaxDetail);
        this._setV(TXI, 2, vMoney);
        this._setV(TXI, 3, this._v('@percentageRate', nTaxDetail));
        this._setV(TXI, 4, 'VD');
        this._setV(TXI, 5, this._v('TaxLocation', nTaxDetail));
        let vExempt = this._v('@exemptDetail', nTaxDetail);
        // let vExemptDesc = this._v('Description',nTaxDetail);
        if (vExempt == 'exempt') {
            this._setV(TXI, 6, '2');
        } else if (vExempt == 'zeroRated') {
            this._setV(TXI, 6, '0');
        }
        this._setV(TXI, 8, this._v('TaxableAmount/Money', nTaxDetail));
        // seems no need to override TXI01
        //this._setV(TXI, 9, vMappedCategory);
        if (vMappedCategory == 'VA') {
            let dTaxPointDate = Utils.parseToDateSTD2(this._v('@taxPointDate', nTaxDetail));
            this._setV(TXI, 10, Utils.getFullDateStr(dTaxPointDate));
        } else {
            let vDesc = this._v('Description', nTaxDetail);
            if (vDesc) {
                this._setV(TXI, 10, vDesc);
            }
        }

        // TXI Alt
        let vAlternateAmount = this._v('TaxAmount/Money/@alternateAmount', nTaxDetail);
        if (vAlternateAmount) {
            let TXI = this._initSegX12('TXI', 10);
            this._setV(TXI, 1, vMappedCategory);
            this._setV(TXI, 2, vAlternateAmount);
            // [This should overwrite any amount if provided in TXI08 field of the first TXI segment]
            // BUT, TXI08 of previous TXI segment is enough and seems MapSpec samples will not set this.
            // this._setV(TXI, 10, this._v('Tax/TaxDetail/TaxableAmount/Money', nInvoiceDetailSummary));
        }
    }

    private _item(nOrderInfo: Element, nItem: Element, bService: boolean) {
        // IT1
        let arrItem = [];

        this._IT1_help(nItem, bService, arrItem);
        let IT1 = this._initSegX12('IT1', 5 + arrItem.length * 2);
        this._setV(IT1, 1, this._v('InvoiceDetailItemReference/@lineNumber', nItem));
        this._setV(IT1, 2, this._v('@quantity', nItem));
        let vUOM = this._v('UnitOfMeasure', nItem);
        this._setV(IT1, 3, this._mcs(MAPS.mapUOM355, vUOM));
        this._setV(IT1, 4, this._v('UnitPrice/Money', nItem));

        let iEle = 6;
        for (let arr of arrItem) {
            this._setV(IT1, iEle, arr[0]);
            this._setV(IT1, iEle + 1, arr[1]);
            iEle += 2;
        }

        // CUR item level
        let nSubtotalAmountMoney = this._e('SubtotalAmount/Money', nItem);
        let nTaxMoney = this._e('Tax/Money', nItem);
        let vCurr;
        let vCurrAlt;
        if (nSubtotalAmountMoney) {
            vCurr = this._v('@currency', nSubtotalAmountMoney);
        }
        if (nTaxMoney) {
            vCurrAlt = this._v('@alternateCurrency', nTaxMoney);
        }
        if (vCurr) {
            let CUR = this._initSegX12('CUR', 5);
            this._setV(CUR, 1, 'SE');
            this._setV(CUR, 2, vCurr);
            this._setV(CUR, 3, '');
            if (vCurrAlt) {
                this._setV(CUR, 4, 'SE');
                this._setV(CUR, 5, vCurrAlt);
            }
        }

        // CTP
        let nPriceBasisQuantity = this._e('PriceBasisQuantity', nItem);
        let CTP = this._initSegX12('CTP', 7);
        this._setV(CTP, 1, 'WS');
        if (this._isPriceAdjustmentInLine) {
            this._setV(CTP, 2, 'CHG');
        }
        this._setV(CTP, 4, this._v('@quantity', nPriceBasisQuantity));
        vUOM = this._v('UnitOfMeasure', nPriceBasisQuantity);
        this._setV(CTP, 501, this._mcs(MAPS.mapUOM355, vUOM));
        this._setV(CTP, 6, 'CSD');
        this._setV(CTP, 7, this._v('@conversionFactor', nPriceBasisQuantity));

        // PAM SubtotalAmount
        this._PAM(nItem, 'SubtotalAmount', '1');
        // PAM GrossAmount
        this._PAM(nItem, 'GrossAmount', 'KK');
        // PAM NetAmount
        this._PAM(nItem, 'NetAmount', 'N');
        // PAM TotalCharges
        this._PAM(nItem, 'TotalCharges', 'GW');
        // PAM TotalAllowances
        this._PAM(nItem, 'TotalAllowances', 'EC');
        // PAM TotalAmountWithoutTax
        this._PAM(nItem, 'TotalAmountWithoutTax', 'ZZ',);

        // PID
        let vDesc = this._vt2('InvoiceDetailItemReference/Description', nItem);
        let vLang = this._v('InvoiceDetailItemReference/Description/@xml:lang', nItem);
        let vDescShort = this._vt2('InvoiceDetailItemReference/Description/ShortName', nItem);
        if (vDesc) {
            let PID = this._initSegX12('PID', 9);
            this._setV(PID, 1, 'F');
            this._setV(PID, 5, vDesc);
            this._setV(PID, 9, vLang);
            if (vDescShort) {
                PID = this._initSegX12('PID', 9);
                this._setV(PID, 1, 'F');
                this._setV(PID, 2, 'GEN');
                this._setV(PID, 5, vDescShort);
                this._setV(PID, 9, vLang);
            }
        } // end if vDesc

        if (this._bSummaryInvoice) {
            // REF PO
            this._REF_KV_X12D('PO', this._v('OrderReference/@orderID', nOrderInfo));
            // REF AH
            let nMasterAgreementReference = this._e('MasterAgreementReference', nOrderInfo);
            if (nMasterAgreementReference) {
                let REF = this._initSegX12('REF', 3);
                this._setV(REF, 1, 'AH');
                this._setV(REF, 2, this._v('@agreementID', nMasterAgreementReference));
                if (this._v('@agreementType', nMasterAgreementReference) == 'scheduling_agreement') {
                    this._setV(REF, 3, '1');
                }
            }
            // REF VN
            this._REF_KV_X12D('VN', this._v('SupplierOrderInfo/@orderID', nOrderInfo))

        }// end if _bSummaryInvoice

        // REF MA
        let vShipNoticeID = this._v('ShipNoticeIDInfo/@shipNoticeID', nItem);
        if (vShipNoticeID) {
            let REF = this._initSegX12('REF', 4);
            this._setV(REF, 1, 'MA');
            this._setV(REF, 2, vShipNoticeID);
            let vShipNoticeLineNumber = this._v('ShipNoticeLineItemReference/@shipNoticeLineNumber', nItem);
            if (vShipNoticeLineNumber) {
                this._setV(REF, 401, 'LI');
                this._setV(REF, 402, vShipNoticeLineNumber);
            }
        }

        // REF RV
        let vReceivingAdviceID = this._v('ShipNoticeIDInfo/IdReference[@domain="ReceivingAdviceID"]/@identifier', nItem);
        if (vReceivingAdviceID) {
            let REF = this._initSegX12('REF', 4);
            this._setV(REF, 1, 'RV');
            this._setV(REF, 2, vReceivingAdviceID);
            let vReceiptLineNumber = this._v('ReceiptLineItemReference/@receiptLineNumber', nItem);
            if (vReceiptLineNumber) {
                this._setV(REF, 401, 'LI');
                this._setV(REF, 402, vReceiptLineNumber);
            }
        }
        // REF FJ
        this._REF_KV_X12D('FJ', this._v('@invoiceLineNumber', nItem));
        // REF PK
        this._REF_KV_X12D('PK', this._v('ShipNoticeIDInfo/IdReference [@domain="packListID"]/@identifier', nItem));
        // REF KK
        this._REF_KV_X12D('KK', this._v('ShipNoticeIDInfo/Extrinsic[@name="DeliveryNoteNumber"]', nItem));
        // REF PD
        this._REF_KV_X12D('PD', this._v('InvoiceDetailItemIndustry/InvoiceDetailItemRetail/PromotionDealID', nItem));
        // REF BT
        this._REF_KV_X12D('BT', this._v('InvoiceDetailItemReference/SupplierBatchID', nItem));
        // REF FL
        let vItemType = this._v('@itemType', nItem);
        if (vItemType) {
            let REF = this._initSegX12('REF', 4);
            this._setV(REF, 1, 'FL');
            this._setV(REF, 2, vItemType);
            if (vItemType == 'composite') {
                this._setV(REF, 3, this._v('@compositeItemType', nItem))
            }
            let vParentInvoiceLineNumber = this._v('parentInvoiceLineNumber', nItem);
            if (vParentInvoiceLineNumber && (vItemType == 'item')) {
                this._setV(REF, 401, 'LI');
                this._setV(REF, 402, vParentInvoiceLineNumber);
            }
        } // end if vItemType

        // REF ACE
        let vServiceEntryID = this._v('serviceEntryID', nItem);
        if (vServiceEntryID) {
            let REF = this._initSegX12('REF', 4);
            this._setV(REF, 1, 'ACE');
            this._setV(REF, 2, vServiceEntryID);
            let vServiceLineNumber = this._v('ServiceEntryItemReference/@serviceLineNumber', nItem);
            if (vServiceLineNumber) {
                this._setV(REF, 401, 'LI');
                this._setV(REF, 402, vServiceLineNumber);
            }
        }

        // REF 8L
        let nClassifications = this._es('InvoiceDetailItemReference/Classification', nItem);
        for (let nClass of nClassifications) {
            let REF = this._initSegX12('REF', 3);
            this._setV(REF, 1, '8L');
            this._setV(REF, 2, this._v('@domain', nClass));
            this._setV(REF, 3, this._v('', nClass));
        }

        // REF 4M
        let vMovementID = this._v('ProductMovementItemIDInfo/@movementID', nItem);
        if (vMovementID) {
            let REF = this._initSegX12('REF', 4);
            this._setV(REF, 1, '4M');
            this._setV(REF, 2, vMovementID);
            let vMovementLineNumber = this._v('ProductMovementItemIDInfo/@movementLineNumber', nItem);
            if (vMovementLineNumber) {
                this._setV(REF, 401, 'LI');
                this._setV(REF, 402, vMovementLineNumber);
            }
        }

        // REF L1
        let vComments = this._v('Comments', nItem);
        if (vComments) {
            let REF = this._initSegX12('REF', 3);
            let vLang = this._v('Comments/@xml:lang', nItem);
            vLang = vLang ? vLang : 'en';
            this._setV(REF, 1, 'L1');
            this._setV(REF, 2, vLang);
            this._setV(REF, 3, vComments);
        }

        // REF ZZ and others
        this._extrinsic_all(nItem);
        // YNQ reason
        let vReason = this._v('@reason', nItem);
        if (vReason == 'return') {
            let YNQ = this._initSegX12('YNQ', 2);
            this._setV(YNQ, 1, 'Q3');
            this._setV(YNQ, 2, 'Y');
        }
        // YNQ AdHoc
        let vIsAdHoc = this._v('@isAdHoc', nItem);
        if (vIsAdHoc == 'yes') {
            let YNQ = this._initSegX12('YNQ', 10);
            this._setV(YNQ, 2, 'Y');
            this._setV(YNQ, 10, 'ad-hoc item');
        }

        // DTM 004
        if (this._bSummaryInvoice) {
            this._DTM_X12(nOrderInfo, 'OrderReference/@orderDate', '004');
        }

        // DTM 008
        if (this._bSummaryInvoice) {
            let vSupplierOrderDate = this._v('SupplierOrderInfo/@orderDate', nOrderInfo);
            this._DTM_X12A(vSupplierOrderDate, '008');
        }

        let nShipNoticeIDInfo = this._e('ShipNoticeIDInfo', nItem);
        // DTM 111
        this._DTM_X12(nShipNoticeIDInfo, '@shipNoticeDate', '111');

        // DTM 011
        this._DTM_X12(nItem, 'InvoiceDetailLineShipping/@shippingDate', '011');

        // DTM 192
        this._DTM_X12(nShipNoticeIDInfo, 'IdReference[@domain="deliveryNoteDate"]/@identifier', '192');

        // DTM 150
        this._DTM_X12(nItem, 'Period/@startDate', '150');
        // DTM 151
        this._DTM_X12(nItem, 'Period/@endDate', '151');
        // DTM 214
        this._DTM_X12(nItem, '@referenceDate', '214');

        // DTM LEA
        if (this._bSummaryInvoice) {
            this._DTM_X12(nOrderInfo, 'MasterAgreementReference/@agreementDate', 'LEA')
        }
        // DTM 517
        this._DTM_X12(nItem, '@inspectionDate', '517');
        // DTM 472
        this._DTM_X12(nItem, 'ServiceEntryItemReference/@serviceEntryDate', '472');
        // DTM 514
        this._DTM_X12(nItem, 'ProductMovementItemIDInfo/@movementDate', '514');

        let nMods = this._es('InvoiceItemModifications/Modification', nItem);
        for (let nMod of nMods) {
            this._item_mod('13', nMod);
        }
        nMods = this._es('UnitPrice/Modifications/Modification', nItem);
        for (let nMod of nMods) {
            this._item_mod('02', nMod);
        }


        let nInvoiceDetailDiscount = this._e('InvoiceDetailDiscount', nItem);
        if (nInvoiceDetailDiscount) {
            let SAC = this._initSegX12('SAC', 7);
            this._setV(SAC, 1, 'A');
            this._setV(SAC, 2, 'C310');
            this._setV(SAC, 5, this._x100(this._v('Money', nInvoiceDetailDiscount)));
            this._setV(SAC, 6, '3');
            this._setV(SAC, 7, this._v('@percentageRate', nInvoiceDetailDiscount));
        }

        let nInvoiceDetailLineShipping = this._e('InvoiceDetailLineShipping', nItem);
        if (nInvoiceDetailLineShipping) {
            let SAC = this._initSegX12('SAC', 5);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'G830');
            this._setV(SAC, 5, this._x100(this._v('Money', nInvoiceDetailLineShipping)));
            let nTaxDetail = this._e('Tax/TaxDetail[@purpose="shippingTax"]', nItem);
            if (nTaxDetail) {
                this._taxDetail(nTaxDetail, nItem);
            }
        }

        let nSpecialHandlingAmount = this._e('InvoiceDetailLineSpecialHandling', nItem);
        if (nSpecialHandlingAmount) {
            let SAC = this._initSegX12('SAC', 16);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'H090');
            this._setV(SAC, 5, this._x100(this._v('Money', nSpecialHandlingAmount)));
            this._setV(SAC, 15, this._v('Description', nSpecialHandlingAmount));
            this._setV(SAC, 16, this._v('Description/@xml:lang', nSpecialHandlingAmount));
            let nTaxDetail = this._e('Tax/TaxDetail[@purpose="specialHandlingTax"]', nItem);
            if (nTaxDetail) {
                this._taxDetail(nTaxDetail, nItem);
            }
        }

        let nDistribution = this._e('Distribution', nItem);
        if (nDistribution) {
            let SAC = this._initSegX12('SAC', 16);
            this._setV(SAC, 1, 'N');
            this._setV(SAC, 2, 'B840');
            this._setV(SAC, 3, 'AB');
            this._setV(SAC, 4, this._v('Accounting/@name', nDistribution));
            this._setV(SAC, 5, this._v('Charge/Money', nDistribution));
            this._setV(SAC, 6, 'Z');
            //this._setV(SAC,7,'Z');
            this._setV(SAC, 13, this._v('Accounting/AccountingSegment/@id', nDistribution));
            this._setV(SAC, 14, this._v('Accounting/AccountingSegment/Name', nDistribution));
            this._setV(SAC, 15, this._v('Accounting/AccountingSegment/Description', nDistribution));
            this._setV(SAC, 15, this._v('Accounting/AccountingSegment/Description/@xml:lang', nDistribution));
        }

        // SAC Tax H850
        let nTax = this._e('Tax', nItem);
        if (nTax) {
            let SAC = this._initSegX12('SAC', 16);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'H850');
            this._setV(SAC, 5, this._x100(this._v('Money', nTax)));
            let vAlternateAmount = this._v('Money/@alternateAmount', nTax);
            this._setV(SAC, 13, vAlternateAmount);
            this._setV(SAC, 15, this._v('Description', nTax));
            this._setV(SAC, 16, this._v('Description/@xml:lang', nTax));
            let nTaxDetail = this._e('Tax/TaxDetail[@purpose="tax"]', nItem);
            if (nTaxDetail) {
                this._taxDetail(nTaxDetail, nItem);
            }
        }

        if (!bService) {
            let nInvoiceDetailShipping = this._e('InvoiceDetailLineShipping/InvoiceDetailShipping', nItem);
            let nContacts = this._es('Contact', nInvoiceDetailShipping);
            for (let nContact of nContacts) {
                this._GroupN1(nContact, nInvoiceDetailShipping);
            }
        }

    } // end function _item

    private _item_mod(vSAC12: string, nMod: Element) {
        let nAdditionalDeduction = this._e('AdditionalDeduction', nMod);
        let nAdditionalCost = this._e('AdditionalCost', nMod);
        let SAC = this._initSegX12('SAC', 16);
        this._setV(SAC, 12, vSAC12);
        if (nAdditionalDeduction) {
            let nModDetail = this._e('ModificationDetail', nMod);
            this._setV(SAC, 1, 'A');
            let vName = this._v('@name', nModDetail);
            this._setV(SAC, 2, this._mci(MAPS.mapSAC1300, vName, 'ZZZZ'));
            let vDeductionAmount = this._x100(this._v('DeductionAmount/Money', nAdditionalDeduction));
            if (vSAC12 == '13') {
                this._setV(SAC, 5, vDeductionAmount);
            } else {
                this._setV(SAC, 5, this._v('DeductedPrice/Money', nAdditionalDeduction));
            }
            this._setV(SAC, 7, this._v('DeductionPercent/@percent', nAdditionalDeduction));
            this._TXI_mod_common(SAC, nMod);
        } // end if nAdditionalDeduction
        if (nAdditionalCost) {
            let nModDetail = this._e('ModificationDetail', nMod);
            this._setV(SAC, 1, 'C');
            let vName = this._v('@name', nModDetail);
            this._setV(SAC, 2, this._mci(MAPS.mapSAC1300, vName, 'ZZZZ'));
            let vCostAmount = this._x100(this._v('Money', nAdditionalCost));
            this._setV(SAC, 5, vCostAmount);
            this._setV(SAC, 7, this._v('Percentage/@percent', nAdditionalCost));
            this._TXI_mod_common(SAC, nMod);
        }
    }

    private _extrinsic_all(nParent: Element) {
        let nExtrins = this._es(XML.Extrinsic, nParent);
        for (let n of nExtrins) {
            let sName = this._v('@name', n);
            let sNameLower = sName.toLowerCase();
            if (this._arrExcludeREF_ZZ.includes(sName)) {
                continue;
            }
            if (this._mei(MAPS.mapREF128, sName)) {
                let REF = this._initSegX12('REF', 3);
                this._setV(REF, 1, this._mci(MAPS.mapREF128, sName));
                let v = this._v('', n);
                this._setV(REF, 2, v.substring(0, 30));
                if (v.length > 30) {
                    this._setV(REF, 3, v.substring(30));
                }
            } else {
                if (sNameLower.startsWith('legal')) {
                    // LegalStatus and LegalCapital;
                    continue;
                }
                if (['invoiceSubmissionMethod'].includes(sName)) {
                    continue;
                }
                let REF = this._initSegX12('REF', 3);
                this._setV(REF, 1, 'ZZ');
                this._setV(REF, 2, sName);
                this._setV(REF, 3, this._v('', n));
            }
        }
    }

    private _PAM(nItem: Element, xPath: string, v401: string) {
        let vAmount = this._v(xPath + '/Money', nItem);
        if (vAmount) {
            let PAM = this._initSegX12('PAM', 5);
            this._setV(PAM, 4, v401);
            this._setV(PAM, 5, vAmount);
        }
    }

    private _IT1_help(nItem: Element, bService: boolean, arrItem: any[]) {
        if (!bService) {
            let nItemRef = this._e('InvoiceDetailItemReference', nItem);
            let vBuyerPartID = this._v('ItemID/BuyerPartID ', nItemRef);
            if (vBuyerPartID) {
                arrItem.push(['BP', vBuyerPartID]);
            }
            let vUNSPSC = this._v('Classification[@domain="UNSPSC"] ', nItemRef);
            if (vUNSPSC) {
                arrItem.push(['C3', vUNSPSC]);
            }
            let vCountryCode = this._v('Country/@isoCountryCode', nItemRef);
            if (vCountryCode) {
                arrItem.push(['CH', vCountryCode]);
            }
            let vEurID = this._v('InvoiceDetailItemReferenceIndustry/InvoiceDetailItemReferenceRetail/EuropeanWasteCatalogID', nItemRef);
            if (vEurID) {
                arrItem.push(['EA', vEurID]);
            }
            let vEANID = this._v('InvoiceDetailItemReferenceIndustry/InvoiceDetailItemReferenceRetail/EANID', nItemRef);
            if (vEANID) {
                arrItem.push(['EN', vEANID]);
            }
            let vManufacturerName = this._v('ManufacturerName', nItemRef);
            if (vManufacturerName) {
                arrItem.push(['MF', vManufacturerName]);
            }
            let vManufacturerPartID = this._v('ManufacturerPartID', nItemRef);
            if (vManufacturerPartID) {
                arrItem.push(['MG', vManufacturerPartID]);
            }
            let vSN = this._v('@serialNumber', nItemRef);
            if (vSN) {
                arrItem.push(['SN', vSN]);
            }

            let vUPCID = this._v('ItemID/IdReference [@domain="UPCConsumerPackageCode"]/@identifier ', nItemRef);
            if (vUPCID) {
                arrItem.push(['UP', vUPCID]);
            }

            let vSupplierPartID = this._v('ItemID/SupplierPartID ', nItemRef);
            if (vSupplierPartID) {
                arrItem.push(['VP', vSupplierPartID]);
            }
            let vSupplierPartAuxiliaryID = this._v('ItemID/SupplierPartAuxiliaryID ', nItemRef);
            if (vSupplierPartAuxiliaryID) {
                arrItem.push(['VS', vSupplierPartAuxiliaryID]);
            }


        } else {
            let nItemRef = this._e('InvoiceDetailServiceItemReference', nItem);
            let vBuyerPartID = this._v('ItemID/BuyerPartID ', nItemRef);
            if (vBuyerPartID) {
                arrItem.push(['BP', vBuyerPartID]);
            }
            let vUNSPSC = this._v('Classification[@domain="UNSPSC"] ', nItemRef);
            if (vUNSPSC) {
                arrItem.push(['C3', vUNSPSC]);
            }
            let vSupplierPartID = this._v('ItemID/SupplierPartID ', nItemRef);
            if (vSupplierPartID) {
                arrItem.push(['SH', vSupplierPartID]);
            }
            let vSupplierPartAuxiliaryID = this._v('ItemID/SupplierPartAuxiliaryID ', nItemRef);
            if (vSupplierPartAuxiliaryID) {
                arrItem.push(['VS', vSupplierPartAuxiliaryID]);
            }
        }

    }

    /**
     * For Group N1, including N1,N2,N3,N4 and REF, PER
     * @param nHeader 
     * @param nIP the Parent InvoicePartner if have
     */
    private _GroupN1(nContact: Element, nInvoiceDetaiShipping: Element, nIP?: Element) {
        // N1
        let sRole = this._v('@role', nContact);
        let sMappedRole = this._mci(MAPS.mapN1_98_InvoicePartner, sRole);
        let N1 = this._initSegX12('N1', 4);
        this._setV(N1, 1, sMappedRole);
        this._setV(N1, 2, this._v('Name', nContact).substring(0, 60));

        let sCodeQualifer = this._v('@addressIDDomain', nContact);
        this._setV(N1, 3, this._mci(MAPS.mapN1_66, sCodeQualifer, '92'));

        this._setV(N1, 4, this._v('@addressID', nContact));

        // N2
        let nDeliverTos = this._es('PostalAddress/DeliverTo', nContact);
        this._oneSegX12(nDeliverTos, 'N2');

        // N3
        let nStreets = this._es('PostalAddress/Street', nContact);
        this._oneSegX12(nStreets, 'N3');

        // N4
        let vPostalCode = this._v('PostalAddress/PostalCode', nContact);
        let vCity = this._v('PostalAddress/City', nContact);
        if (vPostalCode || vCity) {
            let N4 = this._initSegX12('N4', 6);
            this._setV(N4, 1, vCity);
            let sCountryCode = this._v('PostalAddress/Country/@isoCountryCode', nContact);
            let sState = this._v('PostalAddress/State', nContact);
            if (sCountryCode == 'CA' || sCountryCode == 'US') {
                if (sState.length != 2) {
                    sState = this._mci(MAPS_XML_X12.mapN4_156, sState);
                }
                this._setV(N4, 2, sState);
            } else {
                this._setV(N4, 5, 'SP'); // Hardcode to "SP" only if N406 is mapped         
                this._setV(N4, 6, sState);
            }
            this._setV(N4, 3, vPostalCode);
            this._setV(N4, 4, sCountryCode);
        }

        // REF ME
        let vPostalAddressName = this._v('PostalAddress/@name', nContact);
        if (vPostalAddressName) {
            let REF = this._initSegX12('REF', 2);
            this._setV(REF, 1, 'ME');
            this._setV(REF, 2, vPostalAddressName);
        }
        if (nInvoiceDetaiShipping) {
            // REF SI
            let vShipmentIdentifier = this._v('ShipmentIdentifier', nInvoiceDetaiShipping);
            if (vShipmentIdentifier && (sMappedRole == 'SF' || sMappedRole == 'ST')) {
                let REF = this._initSegX12('REF', 3);
                this._setV(REF, 1, 'SI');
                this._setV(REF, 2, vShipmentIdentifier);
                this._setV(REF, 3, this._v('ShipmentIdentifier/@trackingNumberDate', nInvoiceDetaiShipping));
            }
            // REF CN
            let vCarrierIdentifier = this._v('CarrierIdentifier', nInvoiceDetaiShipping);
            if (vCarrierIdentifier && (sMappedRole == 'CA')) {
                let vDomain = this._v('CarrierIdentifier/@domain', nInvoiceDetaiShipping);
                let REF = this._initSegX12('REF', 3);
                this._setV(REF, 1, 'CN');
                this._setV(REF, 2, this._mci(MAPS.mapN1_98_InvoiceDetailShipping, vDomain));
                this._setV(REF, 3, vCarrierIdentifier);
            }
        } else {
            // REF TW
            let vTaxID = this._v('IdReference[@domain="taxID"]/@identifier', nContact);
            if (vTaxID) {
                let REF = this._initSegX12('REF', 3);
                this._setV(REF, 1, 'TW');
                this._setV(REF, 3, vTaxID);
            }

            if (nIP) {
                if (sMappedRole == 'FR' || sMappedRole == 'BT') {
                    // REF VX , not in MapSpec
                    let vVatID = this._v('IdReference[@domain="vatID"]/@identifier', nIP);
                    if (vVatID) {
                        let REF = this._initSegX12('REF', 3);
                        this._setV(REF, 1, 'VX');
                        this._setV(REF, 3, vVatID);
                    }
                }
            }
        } // end if nInvoiceDetaiShipping

        // REF Idreference
        // From Contact
        let nIDRefs = this._es('IdReference', nContact);
        let arrDoneByContact: string[] = [];
        for (let nIDRef of nIDRefs) {
            let sDomain = this._v('@domain', nIDRef);
            if (sDomain) {
                let REF = this._initSegX12('REF', 3);
                if (this._mei(MAPS.mapN1_REF128, sDomain)) {
                    arrDoneByContact.push(sDomain);
                    this._setV(REF, 1, this._mci(MAPS.mapN1_REF128, sDomain));
                    this._setV(REF, 3, this._v('@identifier', nIDRef));
                } else if (!this._arrExcludeREF_ZZ.includes(sDomain)) {
                    arrDoneByContact.push(sDomain);
                    this._setV(REF, 1, 'ZZ');
                    this._setV(REF, 2, sDomain);
                    this._setV(REF, 3, this._v('@identifier', nIDRef));
                }
            }
        }

        // From Invoice Partner
        nIDRefs = this._es('IdReference', nIP);
        for (let nIDRef of nIDRefs) {
            let sDomain = this._v('@domain', nIDRef);
            if (arrDoneByContact.includes(sDomain)) {
                continue;
            }
            if (sDomain) {
                let REF = this._initSegX12('REF', 3);
                if (this._mei(MAPS.mapN1_REF128, sDomain)) {
                    this._setV(REF, 1, this._mci(MAPS.mapN1_REF128, sDomain));
                    this._setV(REF, 3, this._v('@identifier', nIDRef));
                } else if (!this._arrExcludeREF_ZZ.includes(sDomain)) {
                    this._setV(REF, 1, 'ZZ');
                    this._setV(REF, 2, sDomain);
                    this._setV(REF, 3, this._v('@identifier', nIDRef));
                }
            }
        }

        // PER
        //  <Phone>
        //     <TelephoneNumber>
        //        <CountryCode isoCountryCode="SG">65</CountryCode>
        //        <AreaOrCityCode/>
        //        <Number>65-63676788</Number>
        //     </TelephoneNumber>
        //  </Phone>
        let arrContactWays = [];
        let nPhoneNum = this._e('Phone/TelephoneNumber', nContact);
        if (nPhoneNum) {
            let sPhone = this._v('CountryCode', nPhoneNum) + '-' + this._v('Number', nPhoneNum)
            arrContactWays.push(['TE', sPhone]);
        }
        let nFaxNum = this._e('Fax/TelephoneNumber', nContact);
        if (nFaxNum) {
            let sFax = this._v('CountryCode', nFaxNum) + '-' + this._v('Number', nFaxNum)
            arrContactWays.push(['FX', sFax]);
        }
        let vEmail = this._v('Email', nContact);
        if (vEmail) {
            arrContactWays.push(['EM', vEmail]);
        }
        let vURL = this._v('URL', nContact);
        if (vURL) {
            arrContactWays.push(['UR', vURL]);
        }
        // PER CN Email Phone Fax URL
        if (arrContactWays.length > 0) {
            let PER = this._initSegX12('PER', 2 + arrContactWays.length * 2);
            this._setV(PER, 1, 'CN');
            this._setV(PER, 2, 'default');
            let i = 3;
            for (let arrWay of arrContactWays) {
                this._setV(PER, i, arrWay[0]);
                this._setV(PER, i + 1, arrWay[1]);
                i += 2;
            } // end loop arrContactWays
        } // end if arrContactWays.length > 0

        // PER supplierCommercialCredentials
        if (sRole == 'from') {
            let vSupplierCommercialCredentials = this._v('Extrinsic [@name="supplierCommercialCredentials"]', nContact);
            if (vSupplierCommercialCredentials) {
                let PER = this._initSegX12('PER', 2);
                this._setV(PER, 2, vSupplierCommercialCredentials);
            }
        }

    } // end function _GroupN1


} // end class

class MAPS {
    static mapBIG353: Object = {
        "new": "00",
        "delete": "03",
    };
    static mapBIG640: Object = {
        "linelevelcreditmemo": "CN", // lineLevelCreditMemo
        "creditmemo": "CR", // creditMemo
        "lineleveldebitmemo": "DC", // lineLevelDebitMemo
        //"standard":"DI", // standard, Not Summary
        "debitmemo": "DR", // debitMemo
        //"standard":"FD", // standard, Summary Invoice        
    };
    static mapREF128: Object = {
        "transitroutingnumber": "01", // American Bankers Assoc. (ABA) Transit/Routing Number (Including Check Digit, 9 Digits)
        "swiftid": "02", // Society for Worldwide Interbank Financial Telecommunication (S.W.I.F.T.) Identification (8 or 11 Characters)
        "chipsparticipantid": "03", // Clearing House Interbank Payment System (CHIPS) Participant Number (3 or 4 Digits)
        "financialbranchandinstitution": "04", // Canadian Financial Institution Branch and Institution Number
        "chipsuserid": "05", // Clearing House Interbank Payment System (CHIPS) User Identification (6 digits)
        "computermanufacturersystemid": "06", // System Number
        "addoncomputersystemid": "07", // Add-On System Number
        "carrierpackageid": "08", // Carrier Assigned Package Identification Number
        "customsbarcodenumber": "09", // Customs Bar Code Number
        "supervisoryappraisercertificationno": "0A", // Supervisory Appraiser Certification Number
        "statelicencenumber": "0B", // State License Number
        "subjectpropertyverificationsource": "0D", // Subject Property Verification Source
        "subjectpropertyreferencenumber": "0E", // Subject Property Reference Number
        "subscribernumber": "0F", // Subscriber Number
        "reviewerfilenumber": "0G", // Reviewer File Number
        "comparablepropertypendingsaleref": "0H", // Comparable Property Pending Sale Reference Number
        "comparablepropertysaleref": "0I", // Comparable Property Sale Reference Number
        "subjectpropertynonsaleref": "0J", // Subject Property Non-Sale Reference Number
        "policyformid": "0K", // Policy Form Identifying Number
        "referencedby": "0L", // Referenced By
        "mortgageidnumber": "0M", // Mortgage Identification Number
        "attachedto": "0N", // Attached To
        "realestateownedpropertyid": "0P", // Real Estate Owned Property Identifier
        "accountmanagerscode": "10", // Account Managers Code
        "accountnumber": "11", // Account Number
        "accountpayableid": "12", // Billing Account
        "horizontalcoordinate": "13", // Horizontal Coordinate
        "masteraccountnumber": "14", // Master Account Number
        "verticalcoordinate": "15", // Vertical Coordinate
        "miprnumber": "16", // Military Interdepartmental Purchase Request (MIPR) Number
        "clientreportingcategory": "17", // Client Reporting Category
        "plannumber": "18", // Plan Number
        "divisionid": "19", // Division Identifier
        "bluecrossprovidernumber": "1A", // Blue Cross Provider Number
        "blueshieldprovidernumber": "1B", // Blue Shield Provider Number
        "medicareprovidernumber": "1C", // Medicare Provider Number
        "medicaidprovidernumber": "1D", // Medicaid Provider Number
        "dentistlicencenumber": "1E", // Dentist License Number
        "anesthesialicencenumber": "1F", // Anesthesia License Number
        "providerupinnumber": "1G", // Provider UPIN Number
        "champusid": "1H", // CHAMPUS Identification Number
        "dodidcode": "1I", // Department of Defense Identification Code (DoDIC)
        "facilityid": "1J", // Facility ID Number
        "payorclaimnumber": "1K", // Payor's Claim Number
        "grouporpolicynumber": "1L", // Group or Policy Number
        "ppositenumber": "1M", // Preferred Provider Organization Site Number
        "drgnumber": "1N", // Diagnosis Related Group (DRG) Number
        "consolidationshipmentnumber": "1O", // Consolidation Shipment Number
        "accessorialstatuscode": "1P", // Accessorial Status Code
        "erroridcode": "1Q", // Error Identification Code
        "storageinfocode": "1R", // Storage Information Code
        "ambulatorypatientgroupno": "1S", // Ambulatory Patient Group (APG) Number
        "resourceutilizationgroupno": "1T", // Resource Utilization Group (RUG) Number
        "paygrade": "1U", // Pay Grade
        "relatedvendororderno": "1V", // Related Vendor Order Number
        "memberidnumber": "1W", // Member Identification Number
        "creditordebitadjustmentno": "1X", // Credit or Debit Adjustment Number
        "repairactionno": "1Y", // Repair Action Number
        "financialdetailcode": "1Z", // Financial Detail Code
        "repairpartno": "20", // Repair Part Number
        "agaequationno": "21", // American Gas Association Equation Number
        "specialchargeorallowancecode": "22", // Special Charge or Allowance Code
        "clientnumber": "23", // Client Number
        "shorttermdisabilitypolicyno": "24", // Short-term Disability Policy Number
        "reasonnotlowestcodecode": "25", // Reason Not Lowest Cost Code
        "unionnumber": "26", // Union Number
        "insurorpoolidno": "27", // Insuror Pool Identification Number
        "employeeidno": "28", // Employee Identification Number
        "foreclosureaccountno": "29", // Foreclosure Account Number
        "importlicenseno": "2A", // Import License Number
        "terminalreleaseorderno": "2B", // Terminal Release Order Number
        "longtermdisabilitypolicyno": "2C", // Long-term Disability Policy Number
        "aeronauticalequipmentrefno": "2D", // Aeronautical Equipment Reference Number (AERNO)
        "foreignmilitarysalescaseno": "2E", // Foreign Military Sales Case Number
        "consolidatedinvoiceno": "2F", // Consolidated Invoice Number
        "amendment": "2G", // Amendment
        "assignedbytransactionsetsender": "2H", // Assigned by transaction set sender
        "trackingno": "2I", // Tracking Number
        "floorno": "2J", // Floor Number
        "fdaproducttype": "2K", // Food and Drug Administration (FDA) Product Type
        "aaraccountingrules": "2L", // Association of American Railroads (AAR) Railway Accounting Rules
        "fccid": "2M", // Federal Communications Commission (FCC) Identifier
        "fcctradebrandid": "2N", // Federal Communications Commission (FCC) Trade/Brand Identifier
        "oshaclaimno": "2O", // Occupational Safety and Health Administration (OSHA) Claim Number
        "subdivisionid": "2P", // Subdivision Identifier
        "fdaaccessionno": "2Q", // Food and Drug Administration (FDA) Accession Number
        "couponredemptionno": "2R", // Coupon Redemption Number
        "catalog": "2S", // Catalog
        "subsubhousebilloflading": "2T", // Sub-subhouse Bill of Lading
        "payeridnumber": "2U", // Payer Identification Number
        "specialgovacrn": "2V", // Special Government Accounting Classification Reference Number (ACRN)
        "changeorderauthority": "2W", // Change Order Authority
        "supplementalagreementauthority": "2X", // Supplemental Agreement Authority
        "wagedetermination": "2Y", // Wage Determination
        "uscsantidumpingdutycaseno": "2Z", // U.S. Customs Service (USCS) Anti-dumping Duty Case Number
        "usgovvisano": "30", // United States Government Visa Number
        "docketno": "31", // Docket Number
        "creditrepositorycode": "32", // Credit Repository Code
        "lendercaseno": "33", // Lender Case Number
        "loanrequestno": "34", // Loan Request Number
        "multifamilyprojectno": "35", // Multifamily Project Number
        "underwriteridno": "36", // Underwriter Identification Number
        "condominiumidno": "37", // Condominium Identification Number
        "masterpolicyno": "38", // Master Policy Number
        "proposalno": "39", // Proposal Number
        "sectionofnationalhousingactcode": "3A", // Section of the National Housing Act Code
        "supplementalclaimno": "3B", // Supplemental Claim Number
        "payeeloanno": "3C", // Payee Loan Number
        "servicerloanno": "3D", // Servicer Loan Number
        "investorloanno": "3E", // Investor Loan Number
        "showid": "3F", // Show Identification
        "catastropheno": "3G", // Catastrophe Number
        "caseno": "3H", // Case Number
        "precinctno": "3I", // Precinct Number
        "officeno": "3J", // Office Number
        "petroleumpoolcode": "3K", // Petroleum Pool Code
        "branchid": "3L", // Branch Identifier
        "fccconditioncode": "3M", // Federal Communications Commission (FCC) Condition Code
        "gascustodianid": "3N", // Gas Custodian Identification
        "uscspreapprovalrulingno": "3O", // U.S. Customs Service (USCS) Pre-approval Ruling Number
        "thirdpartyoriginatorno": "3P", // Third Party Originator Number
        "fdaproductcode": "3Q", // Food and Drug Administration (FDA) Product Code
        "uscsbindingrulingno": "3R", // U.S. Customs Service (USCS) Binding Ruling Number
        "provincialsalestaxexemptionno": "3S", // Provincial (Canadian) Sales Tax Exemption Number
        "uscspreclassificationrulingno": "3T", // U.S. Customs Service (USCS) Pre-classification Ruling Number
        "protractionno": "3U", // Protraction Number
        "formationid": "3V", // Formation Identifier
        "uscscommercialdesc": "3W", // U.S. Customs Service (USCS) Commercial Description
        "subcontractno": "3X", // Subcontract Number
        "receiverassigneddropzone": "3Y", // Receiver Assigned Drop Zone
        "customsbrokerrefno": "3Z", // Customs Broker Reference Number
        "leaseschedulenoreplacement": "40", // Lease Schedule Number - Replacement
        "leaseschedulenoprior": "41", // Lease Schedule Number - Prior
        "phonecalls": "42", // Phone Calls
        "supportingdocumentno": "43", // Supporting Document Number
        "enduseno": "44", // End Use Number
        "oldaccountno": "45", // Old Account Number
        "oldmeterno": "46", // Old Meter Number
        "plateno": "47", // Plate Number
        "agencysstudentno": "48", // Agency's Student Number. This is the number assigned by an agency other than the institution sending the record.
        "familyunitno": "49", // Family Unit Number
        "personalidnopin": "4A", // Personal Identification Number (PIN)
        "shipmentorigincode": "4B", // Shipment Origin Code
        "shipmentdestinationcode": "4C", // Shipment Destination Code
        "shippingzone": "4D", // Shipping Zone
        "carrierassignedconsigneeno": "4E", // Carrier-assigned Consignee Number
        "carrierassignedshipperno": "4F", // Carrier-assigned Shipper Number
        "provincialtaxid": "4G", // Provincial Tax Identification
        "commercialinvoiceno": "4H", // Commercial Invoice Number
        "balanceduerefno": "4I", // Balance-due Reference Number
        "vehiclerelatedservicesrefno": "4J", // Vehicle-related Services Reference Number
        "accessorialraildiversionrefno": "4K", // Accessorial Rail Diversion Reference Number
        "locationspecificservicesrefno": "4L", // Location-specific Services Reference Number
        "specialmoverefno": "4M", // Special Move Reference Number
        "specialpaymentrefno": "4N", // Special Payment Reference Number
        "cdngstorqstrefno": "4O", // Canadian Goods & Services or Quebec Sales Tax Reference Number
        "affiliationno": "4P", // Affiliation Number
        "fcccallsign": "4Q", // Call Sign
        "rulesection": "4R", // Rule Section
        "preferredcallsign": "4S", // Preferred Call Sign
        "nadsid": "4T", // North American Datum Standard (NADS)
        "marketarea": "4U", // Market Area
        "emmissiondesignator": "4V", // Emission Designator
        "radioengineeringstudy": "4W", // Study
        "fcclicenseapplicationfileno": "4X", // Log
        "subhousebilloflading": "4Y", // Subhouse Bill of Lading
        "uscscountervailingdutycaseno": "4Z", // U.S. Customs Service (USCS) Countervailing Duty Case Number
        "statestudentidno": "50", // State Student Identification Number
        "pictureno": "51", // Picture Number
        "swiftmt100": "52", // SWIFT (MT 100)
        "swiftmt202": "53", // SWIFT (MT 202)
        "fedwiretransfer": "54", // FEDWIRE (Federal Wire Transfer)
        "sequenceno": "55", // Sequence Number
        "correctedsocialsecurityno": "56", // Corrected Social Security Number
        "priorincorrectsocialsecurityno": "57", // Prior Incorrect Social Security Number
        "correctedbatchno": "58", // Corrected Batch Number
        "priorincorrectbatchno": "59", // Prior Incorrect Batch Number
        "offensetracking": "5A", // Offense Tracking
        "supplementalaccountno": "5B", // Supplemental Account Number
        "congressionaldistrict": "5C", // Congressional District
        "lineofcreditcategory": "5D", // Line of Credit Category
        "consumerid": "5E", // Consumer Identifier
        "warrant": "5F", // Warrant
        "complaint": "5G", // Complaint
        "incident": "5H", // Incident
        "offendertracking": "5I", // Offender Tracking
        "driverslicense": "5J", // Driver's License
        "commercialdriverslicense": "5K", // Commercial Driver's License
        "juristictionalcommunityno": "5L", // Jurisdictional Community Number
        "previoussequence": "5M", // Previous Sequence
        "citationofstatute": "5N", // Citation of Statute
        "citationofopinion": "5O", // Citation of Opinion
        "natlcriminalinfocenterorigagencyid": "5P", // National Criminal Information Center Originating Agency Identification
        "statecriminalhistrepindividualid": "5Q", // State Criminal History Repository Individual Identification
        "fbiindividualid": "5R", // Federal Bureau of Investigation Individual Identification
        "processingarea": "5S", // Processing Area
        "paymentlocation": "5T", // Payment Location
        "flooddataid": "5U", // Flood Data Identifier
        "coupondistributionmethod": "5V", // Coupon Distribution Method
        "origuniformcommercialcodefilingno": "5W", // Original Uniform Commercial Code Filing Number
        "amduniformcommercialcodefilingno": "5X", // Amended Uniform Commercial Code Filing Number
        "contuniformcommercialcodefilingno": "5Y", // Continuation Uniform Commercial Code Filing Number
        "uniformcommercialcodefilingcollno": "5Z", // Uniform Commercial Code Filing Collateral Number
        "accountsuffixcode": "60", // Account Suffix Code
        "taxingauthorityidno": "61", // Taxing Authority Identification Number
        "priorloanno": "63", // Prior Loan Number
        "jurisdictionalcommunitynameid": "64", // Jurisdictional Community Name Identifier
        "totalordercycleno": "65", // Total Order Cycle Number
        "previouspolicyno": "66", // Previous Policy Number
        "previousclaimhistoryid": "67", // Previous Claim History Identifier
        "dentalinsuranceaccountno": "68", // Dental Insurance Account Number
        "dentalinsurancepolicyno": "69", // Dental Insurance Policy Number
        "consigneerefno": "6A", // Consignee Reference Number
        "uscsentryno": "6B", // U.S. Customs Service (USCS) Entry Number
        "uscsentrytypecode": "6C", // U.S. Customs Service (USCS) Entry Type Code
        "uscsstatementno": "6D", // U.S. Customs Service (USCS) Statement Number
        "mapreference": "6E", // Map Reference
        "appraiserlicense": "6F", // Appraiser License
        "mapno": "6G", // Map Number
        "comparablepropertyverificationsrc": "6H", // Comparable Property Verification Source
        "comparableproperty": "6I", // Comparable Property
        "censustract": "6J", // Census Tract
        "zone": "6K", // Zone
        "agentcontractno": "6L", // Agent Contract Number
        "applicationno": "6M", // Application Number
        "claimantno": "6N", // Claimant Number
        "crossreferenceno": "6O", // Cross Reference Number
        "groupno": "6P", // Group Number
        "insurancelicenseno": "6Q", // Insurance License Number
        "providercontrolno": "6R", // Provider Control Number
        "providerorderticketno": "6S", // Provider Order Ticket Number
        "pilotlicenseno": "6T", // Pilot License Number
        "questionno": "6U", // Question Number
        "reissuecessionno": "6V", // Reissue Cession Number
        "sequenceno2": "6W", // Sequence Number
        "specimenid": "6X", // Specimen Identifier
        "equipmentinitial": "6Y", // Equipment Initial
        "secofino": "6Z", // Secretaria de Comercia y Famenta Industrial (SECOFI) Number
        "calendarno": "70", // Calendar Number
        "shiftno": "71", // (Working) Shift Number
        "schedulerefno": "72", // Schedule Reference Number
        "statementofwork": "73", // Statement of Work (SOW)
        "workbreakdownstructure": "74", // Work Breakdown Structure (WBS)
        "organizationbreakdownstructure": "75", // Organization Breakdown Structure
        "milestone": "76", // Milestone
        "workpackage": "77", // Work Package
        "planningpackage": "78", // Planning Package
        "costaccount": "79", // Cost Account
        "ponoincludedinonorderposition": "7A", // Purchase Order Number Included in On-Order Position
        "ponoofshipmentrecvsincelastrepdate": "7B", // Purchase Order Number of Shipment Received since Last Reporting Date
        "ponooforderrecvsincelastrepdate": "7C", // Purchase Order Number of Order Received since Last Reporting Date
        "testerid": "7D", // Tester Identification
        "collectorid": "7E", // Collector Identification
        "repeatlocation": "7F", // Repeat Location
        "dataqualityrejectreason": "7G", // Data Quality Reject Reason
        "epatesttypepurposecode": "7H", // Environmental Protection Agency (EPA) Test Type Purpose Code
        "subscriberauthorizationno": "7I", // Subscriber Authorization Number
        "tollbillingtelephonerefnmo": "7J", // Toll Billing Telephone Reference Number
        "listofmaterials": "7K", // List of Materials
        "qualifiedmaterialslist": "7L", // Qualified Materials List
        "frame": "7M", // Frame
        "piggyback": "7N", // Piggyback
        "tripleback": "7O", // Tripleback
        "sheet": "7P", // Sheet
        "engineeringchangeorder": "7Q", // Engineering Change Order
        "representativeidno": "7R", // Representative Identification Number
        "drawingtype": "7S", // Drawing Type
        "mastercontract": "7T", // Master Contract
        "relatedtransactionrefno": "7U", // Related Transaction Reference Number
        "interchangetrainid": "7W", // Interchange Train Identification
        "hmdastatecode": "7X", // Home Mortgage Disclosure Act (HMDA) State Code
        "hmdacountycode": "7Y", // Home Mortgage Disclosure Act (HMDA) County Code
        "hmdamsa": "7Z", // Home Mortgage Disclosure Act (HMDA) Metropolitan Statistical Area (MSA)
        "chargeno": "80", // Charge Number
        "symbolnumber": "81", // Symbol Number (for Milestone or LOB reports)
        "dataitemdescriptionref": "82", // Data Item Description (DID) Reference
        "extendedlineitemnoelin": "83", // Extended (or Exhibit) Line Item Number (ELIN)
        "contractordatarequirementslistcdrl": "84", // Contractor Data Requirements List (CDRL)
        "subcontractordatarequirementssdrl": "85", // Subcontractor Data Requirements (SDRL)
        "operationno": "86", // Operation Number
        "functionalcategory": "87", // Functional Category
        "workcenter": "88", // Work Center
        "assemblyno": "89", // Assembly Number
        "hmoauthorizationno": "8A", // Health Maintenance Organization (HMO) Authorization Number
        "ppoauthorizationno": "8B", // Preferred Provider Organization (PPO) Authorization Number
        "tpoauthorizationno": "8C", // Third-party Organization (TPO) Authorization Number
        "chemicalabstractserviceregistryno": "8D", // Chemical Abstract Service Registry Number
        "guarantorloanno": "8E", // Guarantor Loan Number
        "schoolloanno": "8F", // School Loan Number
        "achtraceno": "8G", // Automated Clearinghouse (ACH) Trace Number
        "checklistno": "8H", // Check List Number
        "fedwireconfirmationno": "8I", // FEDWIRE Confirmation Number
        "swiftconfirmationno": "8J", // Society for Worldwide Interbank Financial Telecommunications (SWIFT) Confirmation Number
        "dominionofcanadacode": "8K", // Dominion of Canada Code
        "isiccode": "8L", // International Standard Industry Classification Code (ISIC)
        "originatingcompanyid": "8M", // Originating Company Identifier
        "receivingcompanyid": "8N", // Receiving Company Identifier
        "achentrydescription": "8O", // Automated Clearing House (ACH) Entry Description
        "origdepositfinancialinstid": "8P", // Originating Depository Financial Institution Identifier
        "recvdepositfinancialinstid": "8Q", // Receiving Depository Financial Institution Identifier
        "securitytype": "8R", // Security Type
        "brokerid": "8S", // Broker Identification
        "bankassignedsecurityid": "8U", // Bank Assigned Security Identifier
        "creditreference": "8V", // Credit Reference
        "banktobankinformation": "8W", // Bank to Bank Information
        "transactioncategoryortype": "8X", // Transaction Category or Type
        "safekeepingaccountno": "8Y", // Safekeeping Account Number
        "alternateclauseno": "8Z", // Alternate Clause Number
        "subassemblyno": "90", // Subassembly Number
        "costelement": "91", // Cost Element
        "changedocumentno": "92", // Change Document Number
        "fundsauthorization": "93", // Funds Authorization
        "fileidentificationno": "94", // File Identification Number
        "cusipno": "95", // Committee on Uniform Securities Identification Procedures (CUSIP) Number
        "stockcertificateno": "96", // Stock Certificate Number
        "packageno": "97", // Package Number
        "containerpackagingspecno": "98", // Container/Packaging Specification Number
        "rateconferenceidcode": "99", // Rate Conference ID Code
        "repricedclaimreferenceno": "9A", // Repriced Claim Reference Number
        "repricedlineitemreferenceno": "9B", // Repriced Line Item Reference Number
        "adjustedrepricedclaimreferenceno": "9C", // Adjusted Repriced Claim Reference Number
        "adjustedrepricedlineitemreferenceno": "9D", // Adjusted Repriced Line Item Reference Number
        "replacementclaimno": "9E", // Replacement Claim Number
        "referralno": "9F", // Referral Number
        "dodform250requirementcode": "9G", // Department of Defense Form 250 Requirement Code
        "packaginggroupno": "9H", // Packaging Group Number
        "achstandardentryclass": "9I", // Automated Clearing House (ACH) Standard Entry Class
        "pensioncontract": "9J", // Pension Contract
        "servicer": "9K", // Servicer
        "servicebureau": "9L", // Service Bureau
        "chipssequenceno": "9M", // Clearing House Interbank Payments System (CHIPS) Sequence Number
        "investor": "9N", // Investor
        "loantype": "9P", // Loan Type
        "poolsuffix": "9Q", // Pool Suffix
        "joborderno": "9R", // Job Order Number
        "deliveryregion": "9S", // Delivery Region
        "tenor": "9T", // Tenor
        "loanfeaturecode": "9U", // Loan Feature Code
        "paymentcategory": "9V", // Payment Category
        "payercategory": "9W", // Payer Category
        "accountcategory": "9X", // Account Category
        "bankassignedbankersrefno": "9Y", // Bank Assigned Bankers Reference Number
        "chamberofcommerceno": "9Z", // Chamber of Commerce Number
        "adverstiserno": "A0", // Advertiser Number
        "analysistestnumber": "A1", // Analysis number/Test number
        "disabilityinsuranceaccountno": "A2", // Disability Insurance Account Number
        "assignmentno": "A3", // Assignment Number
        "disabilityinsurancepolicyno": "A4", // Disability Insurance Policy Number
        "educationalinstutionid": "A5", // Educational Institution Identification Number
        "employeeid": "A6", // Employee Identification Number
        "fsainsuranceaccountno": "A7", // Flexible Spending Account (FSA) Insurance Account Number
        "fsainsurancepolicyno": "A8", // Flexible Spending Account (FSA) Insurance Policy Number
        "healthinsuranceaccountno": "A9", // Health Insurance Account Number
        "accountsreceivablestatementno": "AA", // Accounts Receivable Statement Number
        "distributorssplitagentno": "AAA", // Distributor's Split Agent Number
        "fundmanagersreferenceno": "AAB", // Fund Manager's Reference Number
        "agencyhierarchicallevel": "AAC", // Agency Hierarchical Level
        "officerlicenseno": "AAD", // Officer License Number
        "previousdistributionno": "AAE", // Previous Distributor Number
        "interviewerid": "AAF", // Interviewer ID
        "militaryid": "AAG", // Military ID
        "optionpolicyno": "AAH", // Option Policy Number
        "payrollaccountno": "AAI", // Payroll Account Number
        "priorcontractno": "AAJ", // Prior Contract Number
        "worksiteno": "AAK", // Worksite Number
        "agentno": "AAL", // Agent Number
        "treatyid": "AAM", // Treaty Identifier
        "associatedcasecontrolno": "AAN", // Associated Case Control Number
        "carrierassignedcode": "AAO", // Carrier Assigned Code
        "dealerno": "AAP", // Dealer Number
        "directoryno": "AAQ", // Directory Number
        "distributorassignedtransactionno": "AAR", // Distributor Assigned Transaction Number
        "distributorassignedorderno": "AAS", // Distributor Assigned Order Number
        "distributorsaccountno": "AAT", // Distributor's Account Number
        "generalagencyno": "AAU", // General Agency Number
        "laboratoryno": "AAV", // Laboratory Number
        "agencyassignedno": "AAW", // Agency Assigned Number
        "listbillno": "AAX", // List Bill Number
        "accountingperiodref": "AAY", // Accounting Period Reference
        "paramedicalid": "AAZ", // Paramedical ID Number
        "acceptablesourcepurchaserid": "AB", // Acceptable Source Purchaser ID
        "payrollno": "ABA", // Payroll Number
        "personalidno": "ABB", // Personal ID Number
        "policylinkno": "ABC", // Policy Link Number
        "secondarypolicyno": "ABD", // Secondary Policy Number
        "specialquoteno": "ABE", // Special Quote Number
        "natlpropertyregistrysysteml1": "ABF", // National Property Registry System Level 1
        "natlpropertyregistrysysteml2": "ABG", // National Property Registry System Level 2
        "investorassignedid": "ABH", // Investor Assigned Identification Number
        "ginniemaepoolpackageno": "ABJ", // Ginnie Mae (Government National Mortgage Association) Pool Package Number
        "mortgageelectronicregsysorgid": "ABK", // Mortgage Electronic Registration System Organization Identifier
        "sellerloanno": "ABL", // Seller Loan Number
        "subservicerloanno": "ABM", // Sub-Servicer Loan Number
        "natlpropertyregistrysysteml3": "ABN", // National Property Registry System Level 3
        "statehazardouswasteentityid": "ABO", // State Hazardous Waste Entity Identifier
        "bankruptcyprocedureno": "ABP", // Bankruptcy Procedure Number
        "natlbusinessid": "ABQ", // National Business Identification Number
        "priorduns": "ABR", // Prior Data Universal Number System (D-U-N-S) Number, Dun & Bradstreet
        "vesselname": "ABS", // Vessel Name
        "securityinstrumentno": "ABT", // Security Instrument Number
        "assignmentrecordingno": "ABU", // Assignment Recording Number
        "bookno": "ABV", // Book Number
        "hcfanatlpayerid": "ABY", // Health Care Financing Administration National Payer Identification Number
        "aircargotransfermanifest": "AC", // Air Cargo Transfer Manifest
        "growthfactorref": "ACA", // Growth Factor Reference
        "region": "ACB", // Region
        "status": "ACC", // Status
        "classcode": "ACD", // Class Code
        "servicerequestno": "ACE", // Service Request Number
        "supplementno": "ACF", // Supplement Number
        "previousticketno": "ACG", // Previous Ticket Number
        "onecallagencyticketno": "ACH", // One Call Agency Ticket Number
        "ticketno": "ACI", // Ticket Number
        "billofmaterialrevisionno": "ACJ", // Bill of Material Revision Number
        "drawingrevisionno": "ACK", // Drawing Revision Number
        "achnoccode": "ACR", // Automated Clearinghouse (ACH) Return/Notification of Change (NOC) Code
        "societyofpropertyinfocompilers": "ACS", // Society of Property Information Compilers and Analysts
        "accountingcode": "ACT", // Accounting Code
        "acceptablesourcedunsno": "AD", // Acceptable Source DUNS Number
        "aidar": "ADA", // Agency for International Development Acquisition Regulation (AIDAR)
        "masterpropertyno": "ADB", // Master Property Number
        "projectpropertyno": "ADC", // Project Property Number
        "unitpropertyno": "ADD", // Unit Property Number
        "associatedpropertyno": "ADE", // Associated Property Number
        "associatednoforlimcomelemparking": "ADF", // Associated Number For Limited Common Element Parking
        "associatednoforunitparking": "ADG", // Associated Number For Unit Parking
        "associatednoforjoinunitnotresub": "ADH", // Associated Number For Joined Unit not re-subdivided
        "processorid": "ADI", // Processor Identification Number
        "airdimensioncode": "ADM", // Air Dimension Code
        "authorizationforexpenseafeno": "AE", // Authorization for Expense (AFE) Number
        "numerocin": "AEA", // Numero de Cedula de Identidad (CIN) Number
        "cronumber": "AEB", // Company's Registry Office (CRO) Number
        "governmentregistrationno": "AEC", // Government Registration Number
        "judicialno": "AED", // Judicial Number
        "numeronit": "AEE", // Numero de Identificacion Tributaria (NIT)
        "passportno": "AEF", // Passport Number
        "patronno": "AEG", // Patron Number
        "registroinformacionfiscalrif": "AEH", // Registro Informacion Fiscal (RIF)
        "registrounicodecontribuyenteruc": "AEI", // Registro Unico de Contribuyente (RUC)
        "numerosiex": "AEJ", // Superintendencia de Inversiones Extranjeras (SIEX) Number
        "tokyoshokoresearchbusinessid": "AEK", // Tokyo Shoko Research Business Identifier
        "registronacionaldecontribuyente": "AEL", // Registro Nacional de Contribuyente (RNC)
        "distributioncenterno": "AEM", // Distribution Center Number
        "airlinesflightid": "AF", // Airlines Flight Identification Number
        "agentsshipmentno": "AG", // Agent's Shipment Number
        "masteragreementid": "AH", // Agreement Number
        "airhandlingcode": "AHC", // Air Handling Code
        "associatedinvoices": "AI", // Associated Invoices
        "accountsreceivablecustomeraccount": "AJ", // Accounts Receivable Customer Account
        "sendingcompanyauditno": "AK", // Sending Company Audit Number (Automated Clearinghouse Transfers)
        "accountingequipmentlocationno": "AL", // Accounting (Equipment) Location Number
        "agencylocationcode": "ALC", // Agency Location Code
        "titlecompanycodebookref": "ALG", // Title Company Code Book Reference
        "titledocumentschedule": "ALH", // Title Document Schedule
        "recordingno": "ALI", // Recording Number
        "titlepolicyno": "ALJ", // Title Policy Number
        "alterationno": "ALT", // Alteration Number
        "adjustmentmemochargeback": "AM", // Adjustment Memo (Charge Back)
        "associatedpurchaseorders": "AN", // Associated Purchase Orders
        "appointmentno": "AO", // Appointment Number
        "accountreceivableid": "AP", // Accounts Receivable Number
        "apideductioncode": "API", // American Petroleum Institute (API) Deduction Code
        "accesscode": "AQ", // Access Code
        "arrivalcode": "AR", // Arrival Code
        "acceptablesourcesupplierid": "AS", // Acceptable Source Supplier ID
        "aslbpno": "ASL", // Atomic Safety and Licensing Board Panel (ASLBP) Number
        "animalspecial": "ASP", // Animal Species
        "animalstrain": "AST", // Animal Strain
        "appropriationno": "AT", // Appropriation Number
        "maintenanceavailabilitytype": "ATC", // Maintenance Availability Type
        "authorizationtomeetcompetitionno": "AU", // Authorization to Meet Competition Number
        "healthinsuranceratingaccountno": "AV", // Health Insurance Rating Account Number
        "airwaybillno": "AW", // Air Waybill Number
        "governmentaccountingclassrefno": "AX", // Government Accounting Class Reference Number (ACRN)
        "floorplanapprovalno": "AY", // Floor Plan Approval Number
        "healthinsurancepolicyno": "AZ", // Health Insurance Policy Number
        "lesseebillcodeno": "B1", // Lessee Bill Code Number
        "axleratio": "B2", // Axle Ratio
        "preferredproviderorgno": "B3", // Preferred Provider Organization Number
        "bilateralcarserviceagreements": "B4", // Bilateral Car Service Agreements
        "healthinsuranceratingsuffixcode": "B5", // Health Insurance Rating Suffix Code
        "lifeinsurancebillingaccountno": "B6", // Life Insurance Billing Account Number
        "lifeinsurancepolicyno": "B7", // Life Insurance Policy Number
        "lifeinsurancebillingsuffixcode": "B8", // Life Insurance Billing Suffix Code
        "retirementplanaccountno": "B9", // Retirement Plan Account Number
        "retirementplanpolicyno": "BA", // Retirement Plan Policy Number
        "franchaisetaxaccountno": "BAA", // Franchise Tax Account Number
        "certificateofincorporationno": "BAB", // Certificate of Incorporation Number
        "beamassemblycode": "BAC", // Beam Assembly Code
        "statetaxid": "BAD", // State Tax Identification Number
        "charterno": "BAE", // Charter Number
        "receiptno": "BAF", // Receipt Number
        "withdrawlaccountno": "BAG", // Withdrawal Account Number
        "depositaccountno": "BAH", // Deposit Account Number
        "businessidentno": "BAI", // Business Identification Number
        "authorizationno": "BB", // Authorization Number
        "buyerscontractno": "BC", // Buyer's Contract Number
        "basiccontractlineitemno": "BCI", // Basic Contract Line Item Number
        "bidno": "BD", // Bid Number
        "businessactivity": "BE", // Business Activity
        "billingcenterid": "BF", // Billing Center Identification
        "beginningserialno": "BG", // Beginning Serial Number
        "leaseschedulenoblanket": "BH", // Lease Schedule Number - Blanket
        "bondedcarrierirsid": "BI", // Bonded Carrier Internal Revenue Service Identification Number
        "carriercustomsbondno": "BJ", // Carrier's Customs Bond Number
        "brokersorderno": "BK", // Broker's Order Number
        "banktelegraphicno": "BKT", // Bank Telegraphic Number
        "governmentbilloflading": "BL", // Government Bill of Lading
        "billingtype": "BLT", // Billing Type
        "billofladingno": "BM", // Bill of Lading Number
        "beginmilemarker": "BMM", // Begin Mile Marker
        "bookingno": "BN", // Booking Number
        "binlocationno": "BO", // Bin Location Number
        "binaryobjectid": "BOI", // Binary Object Identifier
        "adjustmentcontrolno": "BP", // Adjustment Control Number
        "healthmaintenanceorganizationcodeno": "BQ", // Health Maintenance Organization Code Number
        "brokerorsalesofficeno": "BR", // Broker or Sales Office Number
        "splitbookingno": "BS", // Split Booking Number
        "batchno": "BT", // Batch Number
        "buyersapprovalmark": "BU", // Buyer's Approval Mark
        "purchaseorderlineitemidbuyer": "BV", // Purchase Order Line Item Identifier (Buyer)
        "blendedwithbatchno": "BW", // Blended With Batch Number
        "buyersshipmentmarkno": "BX", // Buyer's Shipment Mark Number
        "repaircategoryno": "BY", // Repair Category Number
        "complaintcode": "BZ", // Complaint Code
        "canadiansocialinsurancenosin": "C0", // Canadian Social Insurance Number
        "customermaterialspecificationno": "C1", // Customer material specification number
        "customerprocessspecificationno": "C2", // Customer process specification number
        "customerspecificationno": "C3", // Customer specification number
        "changeno": "C4", // Change Number
        "customertrackingnoforloanedmat": "C5", // Customer Tracking Number For Loaned Materials
        "carnetno": "C6", // Carnet Number
        "contractlineitemno": "C7", // Contract Line Item Number
        "correctedcontractno": "C8", // Corrected Contract Number
        "previouscreditdebitadjustmentno": "C9", // Previous Credit/Debit Adjustment Number
        "costallocationref": "CA", // Cost Allocation Reference
        "combinedshipment": "CB", // Combined Shipment
        "censusblockgroup": "CBG", // Census Block Group
        "contractcoopno": "CC", // Contract Co-op Number
        "creditnoteno": "CD", // Credit Note Number
        "citizenshipdocumentno": "CDN", // Citizenship Document Number
        "classofcontractcode": "CE", // Class of Contract Code
        "fleetreferenceno": "CF", // Fleet Reference Number
        "consigneesorderno": "CG", // Consignee's Order Number
        "customercatalogno": "CH", // Customer catalog number
        "uniqueconsignmentid": "CI", // Unique Consignment Identifier
        "circuitno": "CIR", // Circuit Number
        "citation": "CIT", // Citation
        "clauseno": "CJ", // Clause Number
        "checkno": "CK", // Check Number
        "sellerscreditmemo": "CL", // Seller's Credit Memo
        "buyerscreditmemo": "CM", // Buyer's Credit Memo
        "continuousmoveno": "CMN", // Continuous Move Number
        "customermaintenanceperiodseqno": "CMP", // Customer Maintenance Period Sequence Number
        "component": "CMT", // Component
        "carriershipmentid": "CN", // Carrier's Reference Number (PRO/Invoice)
        "commitmentno": "CNO", // Commitment Number
        "customerorderno": "CO", // Customer Order Number
        "collocationindicator": "COL", // Collocation Indicator
        "certificateoftransporation": "COT", // Certificate of Transportation
        "conditionofpurchasedocumentno": "CP", // Condition of Purchase Document Number
        "canadianprovinceoperatingauthno": "CPA", // Canadian Province Operating Authority Number
        "currentproceduralterminologycode": "CPT", // Current Procedural Terminology Code
        "customshousebrokerlicenseno": "CQ", // Customshouse Broker License Number
        "customerreferenceno": "CR", // Customer Reference Number
        "casualtyreportno": "CRN", // Casualty Report Number
        "casualtyreportserialno": "CRS", // Casualty Report Serial Number
        "conditionofsaledocumentno": "CS", // Condition of Sale Document Number
        "cs54keytrainindicatorcode": "CSC", // CS54 Key Train Indicator Code
        "cs54keytrainindicatorgroupname": "CSG", // CS54 Key Train Indicator Group Name
        "censusstatecode": "CST", // Census State Code
        "contractno": "CT", // Contract Number
        "censustractsuffix": "CTS", // Census Tract Suffix
        "cleartextclause": "CU", // Clear Text Clause
        "coilno": "CV", // Coil Number
        "canadianwheatboardpermitno": "CW", // Canadian Wheat Board Permit Number
        "consignmentclassificationid": "CX", // Consignment Classification ID
        "commercialregistrationno": "CY", // Commercial Registration Number
        "periodicitycode": "CYC", // Periodicity Code
        "contractriderno": "CZ", // Contract Rider Number (Used in conjunction with contract number)
        "datareliabilitycode": "D0", // Data Reliability Code
        "deaorderblankno": "D1", // Drug Enforcement Administration Order Blank Number
        "supplierdocumentid": "D2", // Supplier Document Identification Number
        "natlassocofboardsofpharmacyno": "D3", // National Association of Boards of Pharmacy Number
        "cutno": "D4", // Cut Number
        "dyelotno": "D5", // Dye Lot Number
        "duplicatebillno": "D6", // Duplicate Bill Number
        "coveragecode": "D7", // Coverage Code
        "lossreportno": "D8", // Loss Report Number
        "claimno": "D9", // Claim Number
        "domicilebranchno": "DA", // Domicile Branch Number
        "buyersdebitmemo": "DB", // Buyer's Debit Memo
        "dealerpurchaseorderno": "DC", // Dealer purchase order number
        "documentidcode": "DD", // Document Identification Code
        "depositorno": "DE", // Depositor Number
        "dfar": "DF", // Defense Federal Acquisition Regulations (DFAR)
        "drawingno": "DG", // Drawing Number
        "deano": "DH", // Drug Enforcement Administration Number
        "hhsar": "DHH", // Department of Health and Human Services Acquisition Regulation (HHSAR)
        "distributorinvoiceno": "DI", // Distributor Invoice Number
        "districtno": "DIS", // District Number
        "deliveryticketno": "DJ", // Delivery Ticket Number
        "dockno": "DK", // Dock Number
        "sellersdebitmemo": "DL", // Seller's Debit Memo
        "associatedproductno": "DM", // Associated Product Number
        "draftno": "DN", // Draft Number
        "depositno": "DNR", // Deposit Number
        "duns4": "DNS", // D-U-N-S+4, D-U-N-S Number with Four Character Suffix
        "deliveryordernumber": "DO", // Delivery Order Number
        "agar": "DOA", // Department of Agriculture Acquisition Regulation (AGAR)
        "car": "DOC", // Department of Commerce Acquisition Regulation (CAR)
        "dear": "DOE", // Department of Energy Acquisition Regulation (DEAR)
        "diar": "DOI", // Department of Interior Acquisition Regulation (DIAR)
        "jar": "DOJ", // Department of Justice Acquisition Regulation (JAR)
        "dolar": "DOL", // Department of Labor Acquisition Regulation (DOLAR)
        "densityorderno": "DON", // Density Order Number
        "dosar": "DOS", // Department of State Acquisition Regulation (DOSAR)
        "tar": "DOT", // Department of Transportation Acquisition Regulation (TAR)
        "departmentno": "DP", // Department Number
        "deliveryquoteno": "DQ", // Delivery Quote Number
        "dockreceiptno": "DR", // Dock Receipt Number
        "drainholeno": "DRN", // Drainhole Number
        "dpaspriorityrating": "DS", // Defense Priorities Allocation System (DPAS) Priority Rating
        "departurefromspecclasscode": "DSC", // Departure from Specification Class Code
        "departurefromspecno": "DSI", // Departure from Specification Number
        "departurefromspectypecode": "DST", // Departure from Specification Type Code
        "downstreamshippercontractno": "DT", // Downstream Shipper Contract Number
        "tapr": "DTS", // Department of the Treasury Acquisition/Procurement Regulation (TAPR)
        "dependentsinformation": "DU", // Dependents Information
        "duns": "DUN", // D-U-N-S Number Dun & Bradstreet
        "diversionauthorityno": "DV", // Diversion Authority Number
        "depositsequenceno": "DW", // Deposit Sequence Number
        "departmentagencyno": "DX", // Department/Agency Number
        "dodtransportationservicecodeno": "DY", // Department of Defense Transportation Service Code Number (Household Goods)
        "crnaproviderid": "DZ", // Certified Registered Nurse Anesthetist (CRNA) Provider Identification Number
        "emergencyorderno": "E1", // Emergency Order Number
        "partcausingrepairno": "E2", // Part Causing Repair Number
        "expansiononeffectofchangeno": "E3", // Expansion on Effect of Change Number
        "chargecardno": "E4", // Charge Card Number
        "claimantsclaimno": "E5", // Claimant's Claim Number
        "backoutprocedurecode": "E6", // Backout Procedure Code
        "servicebulletinno": "E7", // Service Bulletin Number
        "servicecontractno": "E8", // Service Contract (Coverage) Number
        "attachmentcode": "E9", // Attachment Code
        "medicalrecordid": "EA", // Medical Record Identification Number
        "embargopermitno": "EB", // Embargo Permit Number
        "circular": "EC", // Circular
        "exportdeclaration": "ED", // Export Declaration
        "edar": "EDA", // Department of Education Acquisition Regulation (EDAR)
        "electiondistrict": "EE", // Election District
        "electronicfundstransferid": "EF", // Electronic Funds Transfer ID Number
        "endingserialno": "EG", // Ending Serial Number
        "financialclassificationcode": "EH", // Financial Classification Code
        "employersid": "EI", // Employer's Identification Number
        "patientaccountno": "EJ", // Patient Account Number
        "hmsafacilityid": "EK", // Healthcare Manpower Shortage Area (HMSA) Facility Identification Number
        "electronicdevicepin": "EL", // Electronic device pin number
        "electronicpaymentrefno": "EM", // Electronic Payment Reference Number
        "endmilemarker": "EMM", // End Mile Marker
        "embargono": "EN", // Embargo Number
        "endorsementno": "END", // Endorsement Number
        "submitterid": "EO", // Submitter Identification Number
        "exportpermitno": "EP", // Export Permit Number
        "epaacquisitionregulationepaar": "EPA", // Environmental Protection Agency Acquisition Regulation (EPAAR)
        "epatransporterid": "EPB", // Environmental Protection Agency Transporter Identification Number
        "equipmentno": "EQ", // Equipment Number
        "containerorequipmentreceiptno": "ER", // Container or Equipment Receipt Number
        "employerssocialsecurityno": "ES", // Employer's Social Security Number
        "estimatesequenceno": "ESN", // Estimate Sequence Number
        "excesstransportation": "ET", // Excess Transportation
        "enduserspurchaseorderno": "EU", // End User's Purchase Order Number
        "receiverid": "EV", // Receiver Identification Number
        "mammographycertno": "EW", // Mammography Certification Number
        "estimateno": "EX", // Estimate Number
        "receiversubidentificationno": "EY", // Receiver Sub-identification Number
        "ediagreementid": "EZ", // Electronic Data Interchange Agreement Number
        "versioncodenational": "F1", // Version Code - National
        "versioncodelocal": "F2", // Version Code - Local
        "submissionno": "F3", // Submission Number
        "facilitycertificationno": "F4", // Facility Certification Number
        "medicareversioncode": "F5", // Medicare Version Code
        "healthinsuranceclaimnohic": "F6", // Health Insurance Claim (HIC) Number
        "newhealthinsuranceclaimnohin": "F7", // New Health Insurance Claim (HIC) Number
        "originalreferenceno": "F8", // Original Reference Number
        "freightpayorreferenceno": "F9", // Freight Payor Reference Number
        "federalacquisitionregulationsfar": "FA", // Federal Acquisition Regulations (FAR)
        "filetransferformno": "FB", // File Transfer Form Number
        "filercodeissuedbycustoms": "FC", // Filer Code Issued by Customs
        "assignedcontractno": "FCN", // Assigned Contract Number
        "filercodeissuedbybureauofcustoms": "FD", // Filer Code Issued by Bureau of Census
        "failuremechanismno": "FE", // Failure mechanism number
        "filmno": "FF", // Film Number
        "fundid": "FG", // Fund Identification Number
        "clinicno": "FH", // Clinic Number
        "fileid": "FI", // File Identifier
        "lineitemcontrolnumber": "FJ", // Line Item Control Number
        "finishlotno": "FK", // Finish Lot Number
        "finelineclassification": "FL", // Fine Line Classification
        "floodzone": "FLZ", // Flood Zone
        "fmcforwardersno": "FM", // Federal Maritime Commission (FMC) Forwarders Number
        "facilitymeasurementpointno": "FMP", // Facility Measurement Point Number
        "forwardersagentsreferenceno": "FN", // Forwarder's/Agent's Reference Number
        "finderno": "FND", // Finder Number
        "drugformularyno": "FO", // Drug Formulary Number
        "forestrypermitno": "FP", // Forestry Permit Number
        "formno": "FQ", // Form Number
        "freightbillno": "FR", // Freight Bill Number
        "finalsequenceno": "FS", // Final Sequence Number
        "assignedsequenceno": "FSN", // Assigned Sequence Number
        "foreigntradezone": "FT", // Foreign Trade Zone
        "premarketnotificationno": "FTN", // Premarket Notification Number
        "fundcode": "FU", // Fund Code
        "hmoreferenceno": "FV", // Health Maintenance Organization (HMO) Reference Number
        "statelicenseid": "FW", // State License Identification Number
        "finalworkcandidateno": "FWC", // Final Work Candidate Number
        "failureanalysisreportno": "FX", // Failure Analysis Report Number
        "claimofficeno": "FY", // Claim Office Number
        "processorsinvoiceno": "FZ", // Processor's Invoice Number
        "priorauthorizationno": "G1", // Prior Authorization Number
        "providercommercialno": "G2", // Provider Commercial Number
        "predeterminationofbenefitsid": "G3", // Predetermination of Benefits Identification Number
        "peerrevieworgapprovalno": "G4", // Peer Review Organization (PRO) Approval Number
        "providersiteno": "G5", // Provider Site Number
        "payerassignedresubmissionrefno": "G6", // Payer Assigned Resubmission Reference Number
        "resubmissionreasoncode": "G7", // Resubmission Reason Code
        "resubmissionno": "G8", // Resubmission Number
        "secondaryemployeeid": "G9", // Secondary Employee Identification Number
        "governmentadvanceprogress": "GA", // Government Advance Progress
        "grainblockno": "GB", // Grain Block Number
        "governmentcontractno": "GC", // Government Contract Number
        "returngoodsbillofladingno": "GD", // Return Goods Bill of Lading Number
        "geographicno": "GE", // Geographic Number
        "specialtylicenseno": "GF", // Specialty License Number
        "guageticketno": "GG", // Gauge Ticket Number
        "identificationcardserialno": "GH", // Identification Card Serial Number
        "secondaryproviderno": "GI", // Secondary Provider Number
        "cornborecertificationno": "GJ", // Cornbore Certification Number
        "thirdpartyreferenceno": "GK", // Third Party Reference Number
        "geographicdestinationzoneno": "GL", // Geographic Destination Zone Number
        "loanacquisitionno": "GM", // Loan Acquisition Number
        "folderno": "GN", // Folder Number
        "exhibitid": "GO", // Exhibit Identifier
        "governmentpriorityno": "GP", // Government Priority Number
        "internalpurchaseorderreleaseno": "GQ", // Internal Purchase Order Release Number
        "grainorderreferenceno": "GR", // Grain Order Reference Number
        "generalservicesadmissionregulations": "GS", // General Services Administration Regulations (GSAR)
        "gstid": "GT", // Goods and Service Tax Registration Number
        "internalpurchaseorderitemno": "GU", // Internal Purchase Order Item Number
        "thirdpartypurchaseorderno": "GV", // Third Party Purchase Order Number
        "thirdpartypurchaseorderreleaseno": "GW", // Third Party Purchase Order Release Number
        "groupworkcandidatesequenceno": "GWS", // Group Work Candidate Sequence Number
        "thirdpartypurchaseorderitemno": "GX", // Third Party Purchase Order Item Number
        "emptyrepositioningno": "GY", // Empty Repositioning Number
        "generalledgerno": "GZ", // General Ledger Account
        "highfabricationauthorizationno": "H1", // High Fabrication Authorization Number
        "highrawmaterialauthorizationno": "H2", // High Raw Material Authorization Number
        "gravitysourcemeterno": "H3", // Gravity Source Meter Number
        "federalinforesourcesmgmtregulation": "H4", // Federal Information Resources Management Regulation
        "specialclause": "H5", // Special Clause
        "qualityclause": "H6", // Quality Clause
        "standardclause": "H7", // Standard Clause
        "hmdacensustract": "H8", // Home Mortgage Disclosure Act (HMDA) Census Tract
        "paymenthistoryreferenceno": "H9", // Payment History Reference Number
        "competentauthority": "HA", // Competent Authority
        "billandholdinvoiceno": "HB", // Bill & Hold Invoice Number
        "heatcode": "HC", // Heat Code
        "deptoftransporthazardousno": "HD", // Department of Transportation Hazardous Number
        "hazardousexemptionno": "HE", // Hazardous Exemption Number
        "engineeringdatalist": "HF", // Engineering Data List
        "civilactionno": "HG", // Civil Action Number
        "fiscalcode": "HH", // Fiscal Code
        "typeofhouseholdgoodscode": "HHT", // Type of Household Goods Code
        "healthindustrynohin": "HI", // Health Industry Number (HIN)
        "identitycardno": "HJ", // Identity Card Number
        "judgementno": "HK", // Judgment Number
        "sirenno": "HL", // SIREN Number
        "siretno": "HM", // SIRET Number
        "hmdablocknumberarea": "HMB", // Home Mortgage Disclosure Act Block Number Area
        "hazardouscertificationno": "HN", // Hazardous Certification Number
        "shippershazardousno": "HO", // Shipper's Hazardous Number
        "packandholdinvoiceno": "HP", // Pack & Hold Invoice Number
        "hcfanatlproviderid": "HPI", // Health Care Financing Administration National Provider Identifier
        "reinsurancereference": "HQ", // Reinsurance Reference
        "horsepowerratingofengine": "HR", // Horsepower
        "harmonizedcodesystemcanada": "HS", // Harmonized Code System (Canada)
        "codeoffederalregulations": "HT", // Code of Federal Regulations
        "typeofescrowno": "HU", // Type of Escrow Number
        "deptofhousingandurbandevacqreg": "HUD", // Department of Housing and Urban Development Acquisition Regulation (HUDAR)
        "escrowfileno": "HV", // Escrow File Number
        "highwidefileno": "HW", // High/Wide File Number
        "autolossitemno": "HX", // Auto Loss Item Number
        "propertylossitemno": "HY", // Property Loss Item Number
        "taxagencyno": "HZ", // Tax Agency Number (MERS [Mortgage Electronic Registration System] Federal Information Processing Standards [FIPS] Based Number)
        "owningbureauid": "I1", // Owning Bureau Identification Number
        "iccaccountno": "I2", // Interstate Commerce Commission (ICC) Account Number
        "nonamericanid": "I3", // Non-American Identification Number
        "creditcounselingid": "I4", // Credit Counseling Identification Number
        "invoiceid": "I5", // Invoice Identification
        "creditreportno": "I7", // Credit Report Number
        "socialinsuranceno": "I8", // Social Insurance Number
        "pollutant": "I9", // Pollutant
        "internalvendorno": "IA", // Internal Vendor Number
        "inbondno": "IB", // In Bond Number
        "inboundtoparty": "IC", // Inbound-to Party
        "icd9cm": "ICD", // ICD-9-CM (International Classification of Diseases)
        "insurancecertificateno": "ID", // Insurance Certificate Number
        "interchangeagreementno": "IE", // Interchange Agreement Number
        "issueno": "IF", // Issue Number
        "intlfueltaxagreementaccountno": "IFT", // International Fuel Tax Agreement Account Number
        "insurancepolicyno": "IG", // Insurance Policy Number
        "initialdealerclaimno": "IH", // Initial Dealer Claim Number
        "initialsampleinspectionreportno": "II", // Initial Sample Inspection Report Number
        "imageid": "IID", // Image Identifier
        "siccode": "IJ", // Standard Industry Classification (SIC) Code
        "manufacturerinvoiceid": "IK", // Invoice Number
        "internalorderid": "IL", // Internal Order Number
        "imono": "IM", // Intergovernmental Maritime Organization (IMO) Number
        "integratedmasterplanimp": "IMP", // Integrated Master Plan (IMP)
        "integratedmasterscheduleims": "IMS", // Integrated Master Schedule (IMS)
        "consigneesinvoiceno": "IN", // Consignee's Invoice Number
        "investigatorialnewdrugno": "IND", // Investigatorial New Drug Number
        "inboundtooroutboundfromparty": "IO", // Inbound-to or Outbound-from Party
        "inspectionreportno": "IP", // Inspection Report Number
        "enditem": "IQ", // End Item
        "intraplantrouting": "IR", // Intra Plant Routing
        "importersrefnotoletterofcredit": "IRN", // Importer's Reference Number to Letter of Credit
        "intlregistrationplanaccountno": "IRP", // International Registration Plan Account Number
        "invoicenosuffix": "IS", // Invoice Number Suffix
        "isicdominionofcanadacode": "ISC", // International Standard Industrial Classification (ISIC) Dominion of Canada Code (DCC)
        "intlregistrationplanstickerno": "ISN", // International Registration Plan Sticker Number
        "inspectionandsurveyseqno": "ISS", // Inspection and Survey Sequence Number
        "internalcustomerno": "IT", // Internal Customer Number
        "bargepermitno": "IU", // Barge Permit Number
        "sellersinvoiceid": "IV", // Seller's Invoice Number
        "partinterchangeability": "IW", // Part Interchangeability
        "itemno": "IX", // Item Number
        "insuredparcelpostno": "IZ", // Insured Parcel Post Number
        "proceeding": "J0", // Proceeding
        "creditor": "J1", // Creditor
        "attorney": "J2", // Attorney
        "judge": "J3", // Judge
        "trustee": "J4", // Trustee
        "originatingcase": "J5", // Originating Case
        "adversarycase": "J6", // Adversary Case
        "leadcase": "J7", // Lead Case
        "jointlyadministeredcase": "J8", // Jointly Administered Case
        "substantivelyconsolidatedcase": "J9", // Substantively Consolidated Case
        "beginningjobseqno": "JA", // Beginning Job Sequence Number
        "jobprojectno": "JB", // Job (Project) Number
        "review": "JC", // Review
        "useridentification": "JD", // User Identification
        "endingjobsequenceno": "JE", // Ending Job Sequence Number
        "automatedunderwritingrefno": "JF", // Automated Underwriting Reference Number
        "tag": "JH", // Tag
        "multiplelistingservicearea": "JI", // Multiple Listing Service Area
        "multiplelistingservicesubarea": "JK", // Multiple Listing Service Sub-area
        "packet": "JL", // Packet
        "multiplelistingservicemapxcoord": "JM", // Multiple Listing Service Map X Coordinate
        "multiplelistingservicemapycoord": "JN", // Multiple Listing Service Map Y Coordinate
        "multiplelistingno": "JO", // Multiple Listing Number
        "multiplelistingservicebooktype": "JP", // Multiple Listing Service Book Type
        "elevation": "JQ", // Elevation
        "propertycomponentlocation": "JR", // Property Component Location
        "jobsequenceno": "JS", // Job Sequence Number
        "priortaxidtin": "JT", // Prior Tax Identification Number (TIN)
        "priorphoneno": "JU", // Prior Phone Number
        "priorhealthindustryno": "JV", // Prior Health Industry Number
        "prioruniversalprovideridupin": "JW", // Prior Universal Provider Identification Number (UPIN)
        "priorpostalzipcode": "JX", // Prior Postal Zip Code
        "originofshipmentharmonizedbasedcode": "JY", // Origin of Shipment Harmonized-Based Code
        "governingclasscode": "JZ", // Governing Class Code
        "approvalcode": "K0", // Approval Code
        "foreignmilitarysalesnoticeno": "K1", // Foreign Military Sales Notice Number
        "certifiedmailno": "K2", // Certified Mail Number
        "registeredmailno": "K3", // Registered Mail Number
        "criticalitydesignator": "K4", // Criticality Designator
        "taskorder": "K5", // Task Order
        "purchasedescription": "K6", // Purchase Description
        "paragraphno": "K7", // Paragraph Number
        "projectparagraphno": "K8", // Project Paragraph Number
        "inquiryrequestno": "K9", // Inquiry Request Number
        "distributionlist": "KA", // Distribution List
        "beginningkanbanserialno": "KB", // Beginning Kanban Serial Number
        "exhibitdistributionlist": "KC", // Exhibit Distribution List
        "specialinstructionsno": "KD", // Special Instructions Number
        "endingkanbanserialno": "KE", // Ending Kanban Serial Number
        "foreclosingstatus": "KG", // Foreclosing Status
        "typeoflawsuit": "KH", // Type of Law Suit
        "typeofoutstandingjudgment": "KI", // Type of Outstanding Judgment
        "taxlienjurisdiction": "KJ", // Tax Lien Jurisdiction
        "deliveryreference": "KK", // Delivery Reference
        "contractreference": "KL", // Contract Reference
        "rentalaccountno": "KM", // Rental Account Number
        "censusautomatedfilesid": "KN", // Census Automated Files ID
        "customsdrawbackentryno": "KO", // Customs Drawback Entry Number
        "healthcertificateno": "KP", // Health Certificate Number
        "procuringagency": "KQ", // Procuring Agency
        "responsetoarequestforquoteref": "KR", // Response to a Request for Quotation Reference
        "socicitation": "KS", // Solicitation
        "requestforquotationref": "KT", // Request for Quotation Reference
        "officesymbol": "KU", // Office Symbol
        "distributionstatementcode": "KV", // Distribution Statement Code
        "certification": "KW", // Certification
        "representation": "KX", // Representation
        "sitespecificprocedurestermsconds": "KY", // Site Specific Procedures, Terms, and Conditions
        "mastersolicitationprocstermsconds": "KZ", // Master Solicitation Procedures, Terms, and Conditions
        "lettersornotes": "L1", // Letters or Notes
        "locationonproductcode": "L2", // Location on Product Code
        "laboroperationno": "L3", // Labor Operation Number
        "proposalparagraphno": "L4", // Proposal Paragraph Number
        "subexhibitlineitemno": "L5", // Subexhibit Line Item Number
        "subcontractlineitemno": "L6", // Subcontract Line Item Number
        "customersreleaseno": "L7", // Customer's Release Number
        "consigneesreleaseno": "L8", // Consignee's Release Number
        "customerspartno": "L9", // Customer's Part Number
        "shippinglabelserialno": "LA", // Shipping Label Serial Number
        "lockbox": "LB", // Lockbox
        "leaseno": "LC", // Lease Number
        "loanno": "LD", // Loan Number
        "lenderentityno": "LE", // Lender Entity Number
        "locationexceptionorderno": "LEN", // Location Exception Order Number
        "assemblylinefeedlocation": "LF", // Assembly Line Feed Location
        "leasescheduleno": "LG", // Lease Schedule Number
        "longitudeexpressedinseconds": "LH", // Longitude Expressed in Seconds
        "lineitemidsellers": "LI", // Line Item Identifier (Seller's)
        "hibcclic": "LIC", // Health Industry Business Communications Council (HIBCC) Labeler Identification Code (LIC)
        "localjurisdiction": "LJ", // Local Jurisdiction
        "longitudeexpressedindms": "LK", // Longitude expressed in Degrees, Minutes and Seconds
        "latitudeexpressedinseconds": "LL", // Latitude Expressed in Seconds
        "prodperiodforwhichlaborcostsarefirm": "LM", // Product Period for which Labor Costs are Firm
        "nonpickuplimitedtariffno": "LN", // Non pickup Limited Tariff Number
        "loadplanningno": "LO", // Load Planning Number
        "loinc": "LOI", // Logical Observation Identifier Names and Codes (LOINC)
        "forpickuplimitedfreighttariffno": "LP", // For Pickup Limited Freight Tariff Number
        "latitudeexpressedindms": "LQ", // Latitude Expressed in Degrees, Minutes and Seconds
        "localstudentid": "LR", // Local Student Identification Number
        "barcodedserialno": "LS", // Bar-Coded Serial Number
        "logisticssupportdoctypecode": "LSD", // Logistics Support Documentation Type Code
        "lotno": "LT", // Lot Number
        "locationno": "LU", // Location Number
        "licenseplateno": "LV", // License Plate Number
        "levyingofficerid": "LVO", // Levying Officer Identification
        "locationwithinequipment": "LW", // Location Within Equipment
        "qualifiedproductslist": "LX", // Qualified Products List
        "destofshipmentharmonizedbasedcode": "LY", // Destination of Shipment Harmonized-Based Code
        "lenderaccountno": "LZ", // Lender Account Number
        "materialstoragelocation": "M1", // Material Storage Location
        "majorforceprogram": "M2", // Major Force Program
        "cropyear": "M3", // Crop Year
        "leaseagreementamendmentnomaster": "M5", // Lease Agreement Amendment Number - Master
        "militaryordnancesecurityriskno": "M6", // Military Ordnance Security Risk Number
        "medicalassistancecategory": "M7", // Medical Assistance Category
        "limitedpartnershipid": "M8", // Limited Partnership Identification Number
        "taxshelterno": "M9", // Tax Shelter Number
        "shipnoticeid": "MA", // Ship Notice/Manifest Number
        "masterbilloflading": "MB", // Master Bill of Lading
        "mailbox": "MBX", // Mailbox
        "microfilmno": "MC", // Microfilm Number
        "motorcarrierid": "MCI", // Motor Carrier Identification Number
        "magazinecode": "MD", // Magazine Code
        "hazardouswastemanifestdocno": "MDN", // Hazardous Waste Manifest Document Number
        "messageaddressorid": "ME", // Message Address or ID
        "manufacturerspartno": "MF", // Manufacturers Part Number
        "meterno": "MG", // Meter Number
        "manufacturingorderno": "MH", // Manufacturing Order Number
        "millorderno": "MI", // Mill Order Number
        "modelno": "MJ", // Model Number
        "manifestkeyno": "MK", // Manifest Key Number
        "militaryrankcivilianpaygardeno": "ML", // Military Rank/Civilian Pay Grade Number
        "masterleaseagreementno": "MM", // Master Lease Agreement Number
        "micrno": "MN", // MICR Number
        "manufacturingoperationno": "MO", // Manufacturing Operation Number
        "multipleposofaninvoice": "MP", // Multiple P.O.s of an Invoice
        "meterprovingreportno": "MQ", // Meter Proving Report Number
        "merchandisetypecode": "MR", // Merchandise Type Code
        "manufacturermaterialsafetydatasheet": "MS", // Manufacturer's Material Safety Data Sheet Number
        "mailslot": "MSL", // Mail Slot
        "meterticketno": "MT", // Meter Ticket Number
        "milspecno": "MU", // Military Specification (MILSPEC) Number
        "migrantno": "MV", // Migrant Number, This number is assigned by the national Migrant Records Transfer System
        "miltarycallno": "MW", // Military Call Number
        "materialchangenoticeno": "MX", // Material Change Notice Number
        "modelyearno": "MY", // Model year number
        "maintenancerequestno": "MZ", // Maintenance Request Number
        "multiplezoneorderno": "MZO", // Multiple Zone Order Number
        "nominationno": "N0", // Nomination Number
        "localschoolcourseno": "N1", // Local School Course Number
        "localschooldistrictcourseno": "N2", // Local School District Course Number
        "statewidecourseno": "N3", // Statewide Course Number
        "usdoencescourseno": "N4", // United States Department of Education, National Center for Education Statistics (NCES) Course Number
        "providerplannetworkid": "N5", // Provider Plan Network Identification Number
        "plannetworkid": "N6", // Plan Network Identification Number
        "facilitynetworkid": "N7", // Facility Network Identification Number
        "secondaryhealthinsuranceid": "N8", // Secondary Health Insurance Identification Number
        "dataauthenticationno": "N9", // Data Authentication Number
        "northamericanhazardousclass": "NA", // North American Hazardous Classification Number
        "nasafarsupplement": "NAS", // National Aeronautics and Space Administration FAR Supplement (NFS)
        "letterofcreditno": "NB", // Letter of Credit Number
        "secondarycoveragecompanyno": "NC", // Secondary Coverage Company Number
        "letterofcreditdraftno": "ND", // Letter of Credit Draft Number
        "abbreviatednewdrugapplicationno": "NDA", // Abbreviated New Drug Application Number
        "newdrugapplicationno": "NDB", // New Drug Application Number
        "leaseriderno": "NE", // Lease Rider Number
        "naiccode": "NF", // National Association of Insurance Commissioners (NAIC) Code
        "natlfloodinsuranceprogcommunityname": "NFC", // National Flood Insurance Program Community Name
        "natlfloodinsuranceprogcounty": "NFD", // National Flood Insurance Program County
        "natlfloodinsuranceprogmapno": "NFM", // National Flood Insurance Program Map Number
        "natlfloodinsuranceprogcommunityno": "NFN", // National Flood Insurance Program Community Number
        "natlfloodinsuranceprogstate": "NFS", // National Flood Insurance Program State
        "naturalgaspolicyactcategorycode": "NG", // Natural Gas Policy Act Category Code
        "ratecardno": "NH", // Rate Card Number
        "militarystandardnomilstd": "NI", // Military Standard (MIL-STD) Number
        "technicaldocumentno": "NJ", // Technical Document Number
        "priorcase": "NK", // Prior Case
        "technicalorderno": "NL", // Technical Order Number
        "discounterregistrationno": "NM", // Discounter Registration Number
        "nonconformancereportno": "NN", // Nonconformance Report Number
        "noot5authorityzeromileagerate": "NO", // No OT5 Authority-zero Mileage Rate
        "partialpaymentno": "NP", // Partial Payment Number
        "medicaidrecipientid": "NQ", // Medicaid Recipient Identification Number
        "progresspaymentno": "NR", // Progress Payment Number
        "natlstockno": "NS", // National Stock Number
        "administratorsrefno": "NT", // Administrator's Reference Number
        "pendingcase": "NU", // Pending Case
        "associatedpolicyno": "NW", // Associated Policy Number
        "relatednonconformanceno": "NX", // Related Nonconformance Number
        "agentclaimno": "NY", // Agent Claim Number
        "criticalapplication": "NZ", // Critical Application
        "outercontinentalshelfareacode": "O1", // Outer Continental Shelf Area Code
        "outercontinentalshelfblockno": "O2", // Outer Continental Shelf Block Number
        "ot5authoritycondorrestoncarhirerate": "O5", // OT5 Authority-Condition or Restriction on Car Hire Rate
        "opactransaction": "O7", // On-line Procurement and Accounting Control (OPAC) Transaction
        "originalfiling": "O8", // Original Filing
        "continuationfiling": "O9", // Continuation Filing
        "outletno": "OA", // Outlet Number
        "oceanbilloflading": "OB", // Ocean Bill of Lading
        "oceancontainerno": "OC", // Ocean Container Number
        "originalreturnrequestreference": "OD", // Original Return Request Reference Number
        "openandprepaidstationlistno": "OE", // Open and Prepaid Station List Number
        "operatorid": "OF", // Operator Identification Number
        "terminationfiling": "OG", // Termination Filing
        "originhouse": "OH", // Origin House
        "originalinvoiceno": "OI", // Original Invoice Number
        "amendmentfiling": "OJ", // Amendment Filing
        "offergroup": "OK", // Offer Group
        "originalshippersbillofladingno": "OL", // Original Shipper's Bill of Lading Number
        "oceanmanifest": "OM", // Ocean Manifest
        "dealerorderno": "ON", // Dealer Order Number
        "originalpurchaseorder": "OP", // Original Purchase Order
        "orderno": "OQ", // Order Number
        "orderparagraphno": "OR", // Order/Paragraph Number
        "outboundfromparty": "OS", // Outbound-from Party
        "salesallowanceno": "OT", // Sales Allowance Number
        "tariffsupplementno": "OU", // Tariff Supplement Number
        "tariffsuffixno": "OV", // Tariff Suffix Number
        "serviceorderno": "OW", // Service Order Number
        "statementno": "OX", // Statement Number
        "productno": "OZ", // Product Number
        "previouscontractno": "P1", // Previous Contract Number
        "previousdeano": "P2", // Previous Drug Enforcement Administration Number
        "previousccustomerreferenceno": "P3", // Previous customer reference number
        "projectcode": "P4", // Project Code
        "positioncode": "P5", // Position Code
        "pipelineno": "P6", // Pipeline Number
        "productlineno": "P7", // Product Line Number
        "pickupreferenceno": "P8", // Pickup Reference Number
        "pageno": "P9", // Page Number
        "priceareano": "PA", // Price Area Number
        "patentcooperationtreatyapplno": "PAC", // Patent Cooperation Treaty Application Number
        "nonprovisionalpatentapplicationno": "PAN", // Nonprovisional Patent Application Number
        "provisionalpatentapplicationno": "PAP", // Provisional Patent Application Number
        "payersfinancialinstaccountno": "PB", // Payer's Financial Institution Account Number for Check, Draft, or Wire Payments; Originating Company Account Number for ACH Transfers
        "productioncode": "PC", // Production Code
        "poolcontractcode": "PCC", // Pool Contract Code
        "protocolno": "PCN", // Protocol Number
        "promotiondealno": "PD", // Promotion/Deal Number
        "previousdriverslicense": "PDL", // Previous Driver's License
        "plantno": "PE", // Plant Number
        "primecontractorcontractno": "PF", // Prime Contractor Contract Number
        "productgroup": "PG", // Product Group
        "packinggroupcode": "PGC", // Packing Group Code
        "plugno": "PGN", // Plug Number
        "proposedgroupworkcandidateseqno": "PGS", // Proposed Group Work Candidate Sequence Number
        "priorityrating": "PH", // Priority Rating
        "procsshandlingcode": "PHC", // Process Handling Code
        "pricelistchangeorissueno": "PI", // Price List Change or Issue Number
        "programid": "PID", // Program Identification Number
        "platformid": "PIN", // Platform Identification Number
        "packerno": "PJ", // Packer Number
        "packinglistno": "PK", // Packing List Number
        "pricelistno": "PL", // Price List Number
        "productlicensingagreementno": "PLA", // Product Licensing Agreement Number
        "proposedcontractno": "PLN", // Proposed Contract Number
        "partno": "PM", // Part Number
        "premarketapplicationno": "PMN", // Premarket Application Number
        "permitno": "PN", // Permit Number
        "patentno": "PNN", // Patent Number
        "purchaseorderid": "PO", // Purchase Order Number
        "policyno": "POL", // Policy Number
        "purchaseorderrevisionno": "PP", // Purchase Order Revision Number
        "payeeid": "PQ", // Payee Identification
        "pricequoteno": "PR", // Price Quote Number
        "previouslyreportedsocialsecurityno": "PRS", // Previously Reported Social Security Number
        "producttype": "PRT", // Product Type
        "purchaseordernumbersuffix": "PS", // Purchase Order Number Suffix
        "prevshipmentidcontinuousmove": "PSI", // Previous Shipment Identification Number - Continuous Move
        "nextshipmentidcontinuousmove": "PSL", // Next Shipment Identification Number - Continuous Move
        "creditcard": "PSM", // Credit Card
        "proposedsequenceno": "PSN", // Proposed Sequence Number
        "purchaseoptionagreement": "PT", // Purchase Option Agreement
        "patenttype": "PTC", // Patent Type
        "previousbillofladingno": "PU", // Previous Bill of Lading Number
        "productchagneinformationno": "PV", // Product change information number
        "priorpurchaseorderno": "PW", // Prior purchase order number
        "preliminaryworkcandidateno": "PWC", // Preliminary Work Candidate Number
        "proposedworkcandidateseqno": "PWS", // Proposed Work Candidate Sequence Number
        "previousinvoiceno": "PX", // Previous Invoice Number
        "accountid": "PY", // Account Number
        "productchagnenoticeno": "PZ", // Product Change Notice Number
        "quoteno": "Q1", // Quote Number
        "startingpackageno": "Q2", // Starting Package Number
        "endingpackageno": "Q3", // Ending Package Number
        "prioridentifierno": "Q4", // Prior Identifier Number
        "propertycontrolno": "Q5", // Property Control Number
        "recallno": "Q6", // Recall Number
        "receiverclaimno": "Q7", // Receiver Claim Number
        "registrationno": "Q8", // Registration Number
        "repairorderno": "Q9", // Repair Order Number
        "pressid": "QA", // Press Identifier
        "pressformid": "QB", // Press Form Identifier
        "productspecificationdocumentno": "QC", // Product Specification Document Number
        "replacementdeano": "QD", // Replacement Drug Enforcement Administration Number
        "replacementcustomerrefno": "QE", // Replacement Customer Reference Number
        "qualitydispositionareaid": "QF", // Quality Disposition Area Identifier
        "replacementassemblymodelno": "QG", // Replacement Assembly Model Number
        "replacementassemblyserialno": "QH", // Replacement Assembly Serial Number
        "qualityinspectionareaid": "QI", // Quality Inspection Area Identifier
        "returnmaterialauthorizationno": "QJ", // Return Material Authorization Number
        "salesprogramno": "QK", // Sales Program Number
        "serviceauthorizationno": "QL", // Service Authorization Number
        "qualityreviewmaterialcribid": "QM", // Quality Review Material Crib Identifier
        "stopsequenceno": "QN", // Stop Sequence Number
        "serviceestimateno": "QO", // Service Estimate Number
        "substitutepartno": "QP", // Substitute Part Number
        "unitno": "QQ", // Unit Number
        "qualityreportno": "QR", // Quality Report Number
        "warrantycoveragecode": "QS", // Warranty Coverage Code
        "warrantyregistrationno": "QT", // Warranty Registration Number
        "changeverificationprocedurecode": "QU", // Change Verification Procedure Code
        "newsysteaffectedcode": "QV", // Major System Affected Code
        "newpartno": "QW", // New Part Number
        "oldpartno": "QX", // Old Part Number
        "serviceperformedcode": "QY", // Service Performed Code
        "referencedrawingno": "QZ", // Reference Drawing Number
        "regiristofederaldecontribuyentes": "R0", // Regiristo Federal de Contribuyentes (Mexican Federal Tax ID Number)
        "currentrevsionno": "R1", // Current Revision Number
        "cancelledrevisionno": "R2", // Canceled Revision Number
        "correctionno": "R3", // Correction Number
        "tariffsectionno": "R4", // Tariff Section Number
        "tariffpageno": "R5", // Tariff Page Number
        "tarriffruleno": "R6", // Tariff Rule Number
        "accountsreceivableopenitem": "R7", // Accounts Receivable Open Item
        "rentalagreementno": "R8", // Rental Agreement Number
        "rejectionno": "R9", // Rejection Number
        "repetitivecargoshipmentno": "RA", // Repetitive Cargo Shipment Number
        "restrictedavailabilityauthorization": "RAA", // Restricted Availability Authorization
        "restrictedavailabilityno": "RAN", // Restricted Availability Number
        "ratecodeno": "RB", // Rate code number
        "railroutingcode": "RC", // Rail Routing Code
        "reelno": "RD", // Reel Number
        "releaseno": "RE", // Release Number
        "relatedcase": "REC", // Related Case
        "exportreferenceno": "RF", // Export Reference Number
        "routeordernumberdomestic": "RG", // Route Order Number-Domestic
        "regulatoryguidelineid": "RGI", // Regulatory Guideline Identifier
        "routeordernumberexport": "RH", // Route Order Number-Export
        "releaseinvoicenoforpriorbillandhold": "RI", // Release invoice number for prior bill and hold
        "rigno": "RIG", // Rig Number
        "routeordernumberemergency": "RJ", // Route Order Number-Emergency
        "racktypeno": "RK", // Rack Type Number
        "reserveassemblylinefeedlocation": "RL", // Reserve Assembly Line Feed Location
        "rawmaterialsupplierduns": "RM", // Raw material supplier Dun & Bradstreet number
        "runno": "RN", // Run Number
        "repetitivebookingno": "RO", // Repetitive Booking Number
        "repetitivepatterncode": "RP", // Repetitive Pattern Code
        "relativepriority": "RPP", // Relative Priority
        "reportno": "RPT", // Report Number
        "purchaserequisitionno": "RQ", // Purchase Requisition Number
        "payersfinancialinsttransitroutingno": "RR", // Payer's Financial Institution Transit Routing Number for Check, Draft or Wire Payments. Originating Depository Financial Institution Routing Number for ACH Transfers
        "reconciliationreportsectionidcode": "RRS", // Reconciliation Report Section Identification Code
        "returnablecontainerserialno": "RS", // Returnable Container Serial Number
        "reservationno": "RSN", // Reservation Number
        "bankroutingid": "RT", // American Banker's Association (ABA)
        "routeno": "RU", // Route Number
        "receivingno": "RV", // Receiving Number
        "repetitivewaybillcode": "RW", // Repetitive Waybill Code (Origin Carrier, Standard Point Location Code, Repetitive Waybill Code Number)
        "resubmitno": "RX", // Resubmit number
        "rebateno": "RY", // Rebate Number
        "returnedgoodsauthorizationno": "RZ", // Returned Goods Authorization Number
        "specialapproval": "S0", // Special Approval
        "engineeringspecificationno": "S1", // Engineering Specification Number
        "datasource": "S2", // Data Source
        "specificationno": "S3", // Specification Number
        "shippersbondno": "S4", // Shippers Bond Number
        "routinginstructionno": "S5", // Routing Instruction Number
        "stockno": "S6", // Stock Number
        "stacktrainid": "S7", // Stack Train Identification
        "sealoffno": "S8", // Seal Off Number
        "sealonno": "S9", // Seal On Number
        "salesperson": "SA", // Salesperson
        "salesregionno": "SB", // Sales Region Number
        "suretybondno": "SBN", // Surety Bond Number
        "shippercarorderno": "SC", // Shipper Car Order Number
        "scac": "SCA", // Standard Carrier Alpha Code (SCAC)
        "subdayno": "SD", // Subday Number
        "serialnumber": "SE", // Serial Number
        "searchkey": "SEK", // Search Key
        "session": "SES", // Session
        "shipfrom": "SF", // Ship From
        "savings": "SG", // Savings
        "senderdefinedclause": "SH", // Sender Defined Clause
        "shelflifeindicator": "SHL", // Shelf Life Indicator
        "shippersidentifyingnoforshipmentsid": "SI", // Shipper's Identifying Number for Shipment (SID)
        "setno": "SJ", // Set Number
        "servicechangeno": "SK", // Service Change Number
        "salesterritorycode": "SL", // Sales/Territory Code
        "salesofficeno": "SM", // Sales Office Number
        "sealno": "SN", // Seal Number
        "snomed": "SNH", // Systematized Nomenclature of Human and Veterinary Medicine (SNOMED)
        "statenonresidentviolatorcompact": "SNV", // State Non-Resident Violator Compact
        "shippersorderinvoiceno": "SO", // Shipper's Order (Invoice Number)
        "scanline": "SP", // Scan Line
        "splc": "SPL", // Standard Point Location Code (SPLC)
        "theaterscreenno": "SPN", // Theater Screen Number
        "containersequenceno": "SQ", // Container Sequence Number
        "salesresponsibility": "SR", // Sales Responsibility
        "splitshipmentno": "SS", // Split Shipment Number
        "storeno": "ST", // Store Number
        "stccbridgeno": "STB", // Standard Transportation Commodity Code (STCC) Bridge Number
        "stccreplacementcode": "STR", // Standard Transportation Commodity Code (STCC) Replacement Code
        "specialprocessingcode": "SU", // Special Processing Code
        "titlereference": "SUB", // Title Reference
        "spacingunitorderno": "SUO", // Spacing Unit Order Number
        "servicechargeno": "SV", // Service Charge Number
        "sellerssaleno": "SW", // Seller's Sale Number
        "serviceinterrupttrackingno": "SX", // Service Interrupt Tracking Number
        "socialsecurityno": "SY", // Social Security Number
        "specificationrevision": "SZ", // Specification Revision
        "dealertypeid": "T0", // Dealer Type Identification
        "taxexchangecode": "T1", // Tax Exchange Code
        "taxformcode": "T2", // Tax Form Code
        "taxschedulecode": "T3", // Tax Schedule Code
        "defensefuelsupplycentersignalcode": "T4", // Signal Code
        "traileruseagreements": "T5", // Trailer Use Agreements
        "taxfiling": "T6", // Tax Filing
        "affectedsubsystemcode": "T7", // Affected Subsystem Code
        "descriptionofchangecode": "T8", // Description of Change Code
        "documentatinoaffectedno": "T9", // Documentation Affected Number
        "telecomcircuitsupplementalid": "TA", // Telecommunication Circuit Supplemental ID
        "truckersbilloflading": "TB", // Trucker's Bill of Lading
        "vendorterms": "TC", // Vendor Terms
        "reasonforchange": "TD", // Reason for Change
        "technicaldocumentationtype": "TDT", // Technical Documentation Type
        "fmctariffno": "TE", // Federal Maritime Commission (FMC) Tariff Number
        "transferno": "TF", // Transfer Number
        "transportationcontrolnotcn": "TG", // Transportation Control Number (TCN)
        "transportationaccountcodetac": "TH", // Transportation Account Code (TAC)
        "tirno": "TI", // TIR Number
        "technicalinformationpackage": "TIP", // Technical Information Package
        "federaltaxid": "TJ", // Federal Taxpayer's Identification Number
        "tankno": "TK", // Tank Number
        "taxlicenseexemption": "TL", // Tax License Exemption
        "travelmanifestaciorotr": "TM", // Travel Manifest (ACI or OTR)
        "transactionreferenceno": "TN", // Transaction Reference Number
        "terminaloperatorno": "TO", // Terminal Operator Number
        "typeofcomment": "TOC", // Type of Comment
        "testspecificationno": "TP", // Test Specification Number
        "transponderno": "TPN", // Transponder Number
        "traceractionrequestno": "TQ", // Tracer Action Request Number
        "governmenttransportationrequest": "TR", // Government Transportation Request
        "tariffno": "TS", // Tariff Number
        "templatesequenceno": "TSN", // Template Sequence Number
        "terminalcode": "TT", // Terminal Code
        "triallocationcode": "TU", // Trial Location Code
        "lineofbusiness": "TV", // Line of Business
        "taxworksheet": "TW", // Tax Worksheet
        "taxexemptionid": "TX", // Tax Exempt Number
        "policytype": "TY", // Policy Type
        "totalcycleno": "TZ", // Total Cycle Number
        "consolidatorsreceiptno": "U0", // Consolidator's Receipt Number
        "regionalaccountno": "U1", // Regional Account Number
        "term": "U2", // Term
        "usin": "U3", // Unique Supplier Identification Number (USIN)
        "unpaidinstallmentreferenceno": "U4", // Unpaid Installment Reference Number
        "successoraccount": "U5", // Successor Account
        "predecessoraccount": "U6", // Predecessor Account
        "mbsloanno": "U8", // Mortgage Backed Security (MBS) Loan Number
        "mbspoolno": "U9", // Mortgage Backed Security (MBS) Pool Number
        "mortgageno": "UA", // Mortgage Number
        "unacceptablesourcepurchaserid": "UB", // Unacceptable Source Purchaser ID
        "mortgageinsuranceindicatorno": "UC", // Mortgage Insurance Indicator Number
        "unacceptablesourcedunsno": "UD", // Unacceptable Source DUNS Number
        "secondarycoveragecertificateno": "UE", // Secondary Coverage Certificate Number
        "mortgageinsurancecompanyno": "UF", // Mortgage Insurance Company Number
        "usgovtransportationcontrolno": "UG", // U.S. Government Transportation Control Number
        "mortgageremovalno": "UH", // Removal Number
        "previouscourseno": "UI", // Previous Course Number
        "currentorlatestcourseno": "UJ", // Current or Latest Course Number
        "equivalentcoursenoatrequestinginst": "UK", // Equivalent Course Number at Requesting Institution
        "crosslistedcourseno": "UL", // Cross-listed Course Number
        "quarterquartersectionno": "UM", // Quarter Quarter Section Number
        "unhazardousclassificationno": "UN", // United Nations Hazardous Classification Number
        "quarterquarterspotno": "UO", // Quarter Quarter Spot Number
        "upstreamshippercontractno": "UP", // Upstream Shipper Contract Number
        "sectionno": "UQ", // Section Number
        "unitreliefno": "UR", // Unit Relief Number
        "url": "URL", // Uniform Resource Locator
        "unacceptablesourcesupplierid": "US", // Unacceptable Source Supplier ID
        "unittrain": "UT", // Unit Train
        "townshipno": "UU", // Township Number
        "townshiprangeno": "UV", // Range Number
        "statesenatedistrict": "UW", // State Senate District
        "stateassemlydistrict": "UX", // State Assembly District
        "fanniemaeloanno": "UY", // Federal National Mortgage Association (Fannie Mae) Loan Number
        "statelegislativedistrict": "UZ", // State Legislative District
        "version": "V0", // Version
        "volumepurchaseagreementno": "V1", // Volume Purchase Agreement Number
        "visatype": "V2", // Visa Type
        "voyageno": "V3", // Voyage Number
        "statedepartmenti20formno": "V4", // State Department I-20 Form Number
        "statedepartmentiap66formno": "V5", // State Department IAP-66 Form Number
        "naftacomplianceno": "V6", // North American Free Trade Agreement (NAFTA) Compliance Number
        "judicialdistrict": "V7", // Judicial District
        "institutionno": "V8", // Institution Number
        "subservicer": "V9", // Subservicer
        "vesselagentno": "VA", // Vessel Agent Number
        "vaar": "VB", // Department of Veterans Affairs Acquisition Regulations (VAAR)
        "vendorcontractno": "VC", // Vendor Contract Number
        "volumeno": "VD", // Volume Number
        "vendorabbreviationcode": "VE", // Vendor Abbreviation Code
        "vendorproductchangenoticeno": "VF", // Vendor Change Identification Code
        "vendorchangeprocedurecode": "VG", // Vendor Change Procedure Code
        "countylegislativedistrict": "VH", // County Legislative District
        "poolno": "VI", // Pool Number
        "investornoteholderid": "VJ", // Investor Note Holder Identification
        "institutionnoteholderid": "VK", // Institution Note Holder Identification
        "thirdpartynoteholderid": "VL", // Third Party Note Holder Identification
        "ward": "VM", // Ward
        "supplierorderid": "VN", // Vendor Order Number
        "institutionloanno": "VO", // Institution Loan Number
        "vendorproductno": "VP", // Vendor Product Number
        "relatedcontractlineitemno": "VQ", // Related Contract Line Item Number
        "vendoridno": "VR", // Vendor ID Number
        "vendorordernosuffix": "VS", // Vendor Order Number Suffix
        "motorvehicleidno": "VT", // Motor Vehicle ID Number
        "preparersverificationno": "VU", // Preparer's Verification Number
        "voucher": "VV", // Voucher
        "standard": "VW", // Standard
        "vatid": "VX", // Value-Added Tax Registration Number (Europe)
        "linesequenceno": "VY", // Link Sequence Number
        "sponsorsreferenceno": "VZ", // Sponsor's Reference Number
        "disposalturnindocumentno": "W1", // Disposal Turn-In Document Number
        "weaponsystemno": "W2", // Weapon System Number
        "manufacturingdirectiveno": "W3", // Manufacturing Directive Number
        "procurementrequestno": "W4", // Procurement Request Number
        "inspectorid": "W5", // Inspector Identification Number
        "federalsuppyscheduleno": "W6", // Federal Supply Schedule Number
        "commercialandgoventitycage": "W7", // Commercial and Government Entity (CAGE) Code
        "suffix": "W8", // Suffix
        "specialpackaginginstructionno": "W9", // Special Packaging Instruction Number
        "labororaffiliationid": "WA", // Labor or Affiliation Identification
        "americanpetroleuminstututeapiwell": "WB", // American Petroleum Institute (API) Well
        "contractoptionno": "WC", // Contract Option Number
        "workcandidatesequenceno": "WCS", // Work Candidate Sequence Number
        "reviewperiodno": "WD", // Review Period Number
        "withdrawlrecord": "WDR", // Withdrawal Record
        "wellclassificationcode": "WE", // Well Classification Code
        "locallyassignedcontrolno": "WF", // Locally Assigned Control Number
        "vendorspreviousjobno": "WG", // Vendor's Previous Job Number
        "masterreferencelinkno": "WH", // Master Reference (Link) Number
        "waiver": "WI", // Waiver
        "preawardsurvey": "WJ", // Pre-Award Survey
        "typeofsciencecode": "WK", // Type of Science Code
        "federalsupplyclassificationcode": "WL", // Federal Supply Classification Code
        "weightagreementno": "WM", // Weight Agreement Number
        "wellno": "WN", // Well Number
        "workorderno": "WO", // Work Order Number
        "warehousepickticketno": "WP", // Warehouse Pick Ticket Number
        "interimfundingorganizationloanno": "WQ", // Interim Funding Organization Loan Number
        "warehousereceiptno": "WR", // Warehouse Receipt Number
        "warehousestoragelocationno": "WS", // Warehouse storage location number
        "brokersreferenceno": "WT", // Broker's Reference Number
        "vessel": "WU", // Vessel
        "dealerid": "WV", // Dealer Identification
        "depositorytrustcompanyid": "WW", // Depository Trust Company Identification
        "distributorsaccountid": "WX", // Distributor's Account Identification
        "waybillno": "WY", // Waybill Number
        "distributorsrepresentativeid": "WZ", // Distributor's Representative Identification
        "debtorsaccount": "X0", // Debtor's Account
        "providerclaimno": "X1", // Provider Claim Number
        "specificationclassno": "X2", // Specification Class Number
        "defectcodeno": "X3", // Defect Code Number
        "clinicallabimprovementamendmentno": "X4", // Clinical Laboratory Improvement Amendment Number
        "stateindustrialaccidentproviderno": "X5", // State Industrial Accident Provider Number
        "originalvoucherno": "X6", // Original Voucher Number
        "batchsequenceno": "X7", // Batch Sequence Number
        "secondarysuffixcodeindicator": "X8", // Secondary Suffix Code Indicator
        "internalcontrolno": "X9", // Internal Control Number
        "substitutenationalstockno": "XA", // Substitute National Stock Number
        "substitutemanufacturerspartno": "XB", // Substitute Manufacturer's Part Number
        "cargocontrolno": "XC", // Cargo Control Number
        "subsistenceid": "XD", // Subsistence Identification Number
        "transportationpriorityno": "XE", // Transportation Priority Number
        "governmentbillofladingofficecode": "XF", // Government Bill of Lading Office Code
        "airlineticketno": "XG", // Airline Ticket Number
        "contractauditorid": "XH", // Contract Auditor ID Number
        "fhlmcloanno": "XI", // Federal Home Loan Mortgage Corporation Loan Number
        "fhlmcdeafultforeclosurespecialistno": "XJ", // Federal Home Loan Mortgage Corporation Default/Foreclosure Specialist Number
        "mortgageeloanno": "XK", // Mortgagee Loan Number
        "insuredsloanno": "XL", // Insured's Loan Number
        "gnmamortgageno": "XM", // Issuer Number
        "titlexixid": "XN", // Title XIX Identifier Number
        "sampleno": "XO", // Sample Number
        "previouscargo": "XP", // Previous Cargo Control Number
        "pierno": "XQ", // Pier Number
        "railroadcommissionrecordno": "XR", // Railroad Commission Record Number
        "gasanalyssisourcemeterno": "XS", // Gas Analysis Source Meter Number
        "toxicologyid": "XT", // Toxicology ID
        "universaltransversemercatornorth": "XU", // Universal Transverse Mercator - North
        "universaltransversemercatoreast": "XV", // Universal Transverse Mercator - East
        "universaltransversemercatorzone": "XW", // Universal Transverse Mercator - Zone
        "ratingperiod": "XX", // Rating Period
        "otherunlistedtypeofreferenceno": "XY", // Other Unlisted Type of Reference Number
        "pharmacypresciptionno": "XZ", // Pharmacy Prescription Number
        "debtor": "Y0", // Debtor
        "claimadministratorclaimno": "Y1", // Claim Administrator Claim Number
        "thirdpartyadministratorclaimno": "Y2", // Third-Party Administrator Claim Number
        "contractholderclaimno": "Y3", // Contract Holder Claim Number
        "agencyclaimno": "Y4", // Agency Claim Number
        "deliverytrailermanifest": "Y5", // Delivery Trailer Manifest
        "sortandsegregate": "Y6", // Sort and Segregate
        "processingarea2": "Y7", // Processing Area
        "userid": "Y8", // User ID
        "currentcertificateno": "Y9", // Current Certificate Number
        "priorcertificateno": "YA", // Prior Certificate Number
        "revisionno": "YB", // Revision Number
        "tract": "YC", // Tract
        "buyerid": "YD", // Buyer Identification
        "railroadcommissionoilno": "YE", // Railroad Commission Oil Number
        "lesseeid": "YF", // Lessee Identification
        "operatorassignedunitno": "YH", // Operator Assigned Unit Number
        "refinerid": "YI", // Refiner Identification
        "revenuesource": "YJ", // Revenue Source
        "rentpayorid": "YK", // Rent Payor Identification
        "allowancerecipientid": "YL", // Allowance Recipient Identification
        "resourcescreeningreference": "YM", // Resource Screening Reference
        "receiversidqualifier": "YN", // Receiver ID Qualifier
        "formation": "YO", // Formation
        "sellingarrangement": "YP", // Selling Arrangement
        "minimumroyaltypayorid": "YQ", // Minimum Royalty Payor Identification
        "operatorleaseno": "YR", // Operator Lease Number
        "yardposition": "YS", // Yard Position
        "reporterid": "YT", // Reporter Identification
        "participatingarea": "YV", // Participating Area
        "engineeringchangeproposal": "YW", // Engineering Change Proposal
        "geographicscore": "YX", // Geographic Score
        "geographickey": "YY", // Geographic Key
        "georaphicindex": "YZ", // Geographic Index
        "safetyofshipcertificate": "Z1", // Safety of Ship Certificate
        "safetyofradiocertificate": "Z2", // Safety of Radio Certificate
        "safetyequipmentcertificate": "Z3", // Safety Equipment Certificate
        "civilliabilitiesofoilcertificate": "Z4", // Civil Liabilities of Oil Certificate
        "loadlinecertificate": "Z5", // Load Line Certificate
        "deratcertificate": "Z6", // Derat Certificate
        "maritimedeclarationofhealth": "Z7", // Maritime Declaration of Health
        "federalhousingadministrationcaseno": "Z8", // Federal Housing Administration Case Number
        "veteransaffairscaseno": "Z9", // Veterans Affairs Case Number
        "supplier": "ZA", // Supplier
        "ultimateconsignee": "ZB", // Ultimate Consignee
        "connectingcarrier": "ZC", // Connecting Carrier
        "familymemberid": "ZD", // Family Member Identification
        "coalauthorityno": "ZE", // Coal Authority Number
        "contractorestablishmentcodecec": "ZF", // Contractor Establishment Code (CEC)
        "salesrepresentativeorderno": "ZG", // Sales Representative Order Number
        "carrierassignedreferenceno": "ZH", // Carrier Assigned Reference Number
        "referenceversionno": "ZI", // Reference Version Number
        "universalrailroadrevenuewaybillid": "ZJ", // Universal Railroad Revenue Waybill Identified Number (URRWIN)
        "duplicatewaybillinroute": "ZK", // Duplicate Waybill in Route
        "duplicatewaybillnotinroute": "ZL", // Duplicate Waybill Not in Route
        "manufacturerno": "ZM", // Manufacturer Number
        "agencycaseno": "ZN", // Agency Case Number
        "makegoodcommerciallineno": "ZO", // Makegood Commercial Line Number
        "spousetie": "ZP", // Spouse Tie
        "nonspousetie": "ZQ", // Non-Spouse Tie
        "replacementsupplierno": "ZR", // Supplier (Replacement)
        "softwareapplicationno": "ZS", // Software Application Number
        "millingintransit": "ZT", // Milling in Transit
        "field": "ZU", // Field
        "block": "ZV", // Block
        "area": "ZW", // Area
        "countycode": "ZX", // County Code
        "referencedpatternid": "ZY", // Referenced Pattern Identification
        // "mutuallydefined":"ZZ", // Mutually Defined

    }
    static mapN1_98_InvoicePartner: Object = {
        "correspondent": "40", // correspondent
        "componentsupplier": "42", // componentSupplier
        "sales": "60", // sales
        "taxrepresentative": "7X", // taxRepresentative
        "customerservice": "A9", // customerService
        "buyermasteraccount": "AP", // buyerMasterAccount
        "buyercorporate": "B4", // buyerCorporate
        "billfrom": "BF", // billFrom
        "receivingcorrespondentbank": "BK", // receivingCorrespondentBank
        "billto": "BT", // billTo
        "buyer": "BY", // buyer
        "carriercorporate": "CA", // carrierCorporate
        "enduser": "EN", // endUser
        "from": "FR", // from
        "issuerofinvoice": "II", // issuerOfInvoice
        "technicalsupport": "KY", // technicalSupport
        "subsequentbuyer": "MA", // subsequentBuyer
        "buyerplannercode": "MI", // BuyerPlannerCode
        "suppliermasteraccount": "MJ", // supplierMasterAccount
        "administrator": "NG", // administrator
        "originatingbank": "O1", // originatingBank
        "buyeraccount": "OB", // buyerAccount
        "purchasingagent": "PD", // purchasingAgent
        "payee": "PE", // payee
        "payer": "PR", // payer
        "requester": "R6", // requester
        "wirereceivingbank": "RB", // wireReceivingBank
        "remitto": "RI", // remitTo
        "supplieraccount": "SE", // supplierAccount
        "shipfrom": "SF", // shipFrom
        "soldto": "SO", // soldTo
        "shipto": "ST", // shipTo
        "suppliercorporate": "SU", // supplierCorporate
        "receipientparty": "TO", // receipientParty
        "senderbusinesssystemid": "UK", // senderBusinessSystemID
        // "mutually defined":"ZZ", // Mutually Defined
    }
    static mapN1_98_InvoiceDetailShipping: Object = {
        "carriercorporate": "CA", // carrierCorporate
        "shipfrom": "SF", // shipFrom
        "shipto": "ST", // shipTo
    }
    static mapN1_66: Object = {
        "duns": "1", // DUNS
        "scac": "2", // SCAC
        "iata": "4", // IATA
        "duns+4": "9", // DUNS+4
        // "not mapped":"91", // Not Mapped
        // "not mapped":"92", // Not Mapped         
    }
    static mapN1_REF128: Object = {
        "abaroutingnumber": "01", // abaRoutingNumber
        "swiftid": "02", // swiftID
        "chipsid": "03", // chipsID
        "accountid": "11", // accountID
        "accountpayableid": "12", // accountPayableID
        "ibanid": "14", // ibanID
        "buyerplannercode": "72", // BuyerPlannerCode
        "bankbranchid": "3L", // bankBranchID
        "pstid": "3S", // pstID
        "loadingpoint": "4B", // loadingPoint
        "storagelocation": "4C", // storageLocation
        "provincialtaxid": "4G", // provincialTaxID
        "supplierlocationid": "4L", // supplierLocationID
        "qstid": "4O", // qstID
        "banknationalid": "8W", // bankNationalID
        "transportationzone": "9S", // transportationZone
        "accounttype": "9X", // accountType
        "accountname": "ACT", // accountName
        "governmentnumber": "AEC", // governmentNumber
        "accountreceivableid": "AP", // accountReceivableID
        "suppliertaxid": "BAA", // SupplierTaxID
        "statetaxid": "BAD", // stateTaxID
        "contactdepartmentid": "BR", // ContactDepartmentID
        "supplierreference": "D2", // supplierReference
        "documentname": "DD", // documentName
        "duns4": "DNS", // duns4
        "departmentname": "DP", // departmentName
        "duns": "DUN", // duns
        "reference": "F8", // reference
        // "gsttaxid": "GT", // gstTaxID
        "gstid": "GT", //  gstID
        "creditorrefid": "J1", // creditorRefID
        "cradcrsdindicator": "KK", // cRADCRSDIndicator
        "buyerlocationid": "LU", // buyerLocationID
        "bankaccountid": "PB", // bankAccountID
        // "bankaccountid":"PY", // bankAccountID
        "bankroutingid": "RT", // bankRoutingID
        "contactperson": "SA", // contactPerson
        "federaltaxid": "TJ", // federalTaxID
        "taxexemptionid": "TX", // taxExemptionID
        // "vatid": "VX", // vatID
        "partyadditionalid ": "YD", // PartyAdditionalID 
        "partyadditionalid2": "ZA", // PartyAdditionalID2

    }
    static mapUOM355: Object = {
        "5": "05", // lift
        "6": "04", // small spray
        "8": "08", // heat lot
        "10": "10", // group
        "11": "11", // outfit
        "13": "13", // ration
        "14": "14", // shot
        "15": "15", // stick. military
        "16": "16", // hundred fifteen kg drum
        "17": "17", // hundred lb drum
        "18": "18", // fiftyfive gallon (US) drum
        "19": "19", // tank truck
        "20": "20", // twenty foot container
        "21": "21", // forty foot container
        "22": "22", // decilitre per gram
        "23": "23", // gram per cubic centimetre
        "24": "24", // theoretical pound
        "25": "25", // gram per square centimetre
        "26": "26", // actual ton
        "27": "27", // theoretical ton
        "28": "28", // kilogram per square metre
        "29": "29", // pound per thousand square foot
        "30": "30", // horse power day per air dry metric ton
        "31": "31", // catch weight
        "32": "32", // kilogram per air dry metric ton
        "33": "33", // kilopascal square metre per gram
        "34": "34", // kilopascal per millimetre
        "35": "35", // millilitre per square centimetre second
        "36": "36", // cubic foot per minute per square foot
        "37": "37", // ounce per square foot
        "38": "38", // ounce per square foot per 0.01inch
        "40": "40", // millilitre per second
        "41": "41", // millilitre per minute
        "43": "43", // super bulk bag
        "44": "44", // fivehundred kg bulk bag
        "45": "45", // threehundred kg bulk bag
        "46": "46", // fifty lb bulk bag
        "47": "47", // fifty lb bag
        "48": "48", // bulk car load
        "53": "53", // theoretical kilogram
        "54": "54", // theoretical tonne
        "56": "56", // sitas
        "57": "57", // mesh
        "58": "58", // net kilogram
        "59": "59", // part per million
        "60": "60", // percent weight
        "61": "61", // part per billion (US)
        "62": "62", // percent per 1000 hour
        "63": "63", // failure rate in time
        "64": "64", // pound per square inch. gauge
        "66": "66", // oersted
        "69": "69", // test specific scale
        "71": "71", // volt ampere per pound
        "72": "72", // watt per pound
        "73": "73", // ampere tum per centimetre
        "74": "74", // millipascal
        "76": "76", // gauss
        "77": "77", // milli-inch
        "78": "78", // kilogauss
        "80": "80", // pound per square inch absolute
        "81": "81", // henry
        "84": "84", // kilopound-force per square inch
        "85": "85", // foot pound-force
        "87": "87", // pound per cubic foot
        "89": "89", // poise
        "90": "90", // Saybold universal second
        "91": "91", // stokes
        "92": "92", // calorie per cubic centimetre
        "93": "93", // calorie per gram
        "94": "94", // curl unit
        "95": "95", // twenty thousand gallon (US) tankcar
        "96": "96", // ten thousand gallon (US) tankcar
        "97": "97", // ten kg drum
        "98": "98", // fifteen kg drum
        "1A": "1A", // car mile
        "1B": "1B", // car count
        "1C": "1C", // locomotive count
        "1D": "1D", // caboose count
        "1E": "1E", // empty car
        "1F": "1F", // train mile
        "1G": "1G", // fuel usage gallon (US)
        "1H": "1H", // caboose mile
        "1I": "1I", // fixed rate
        "1J": "1J", // ton mile
        "1K": "1K", // locomotive mile
        "1L": "1L", // total car count
        "1M": "1M", // total car mile
        "1X": "1X", // quarter mile
        "2A": "2A", // radian per second
        "2B": "2B", // radian per second squared
        "2C": "2C", // roentgen
        "2I": "2I", // British thermal unit (international table) per hour
        "2J": "2J", // cubic centimetre per second
        "2K": "2K", // cubic foot per hour
        "2L": "2L", // cubic foot per minute
        "2M": "2M", // centimetre per second
        "2N": "2N", // decibel
        "2P": "2P", // kilobyte
        "2Q": "2Q", // kilobecquerel
        "2R": "2R", // kilocurie
        "2U": "2U", // megagram
        "2V": "2V", // megagram per hour
        "2W": "2W", // bin
        "2X": "2X", // metre per minute
        "2Y": "2Y", // milliroentgen
        "2Z": "2Z", // millivolt
        "3B": "3B", // megajoule
        "3C": "3C", // manmonth
        "3E": "3E", // pound per pound of product
        "3G": "3G", // pound per piece of product
        "3H": "3H", // kilogram per kilogram of product
        "3I": "3I", // kilogram per piece of product
        "4A": "4A", // bobbin
        "4B": "4B", // cap
        "4C": "4C", // centistokes
        "4E": "4E", // twenty pack
        "4G": "4G", // microlitre
        "4H": "4H", // micrometre (micron)
        "4K": "4K", // milliampere
        "4L": "4L", // megabyte
        "4M": "4M", // milligram per hour
        "4N": "4N", // megabecquerel
        "4O": "4O", // microfarad
        "4P": "4P", // newton per metre
        "4Q": "4Q", // ounce inch
        "4R": "4R", // ounce foot
        "4T": "4T", // picofarad
        "4U": "4U", // pound per hour
        "4W": "4W", // ton (US) per hour
        "4X": "4X", // kilolitre per hour
        "5A": "5A", // barrel (US) per minute
        "5B": "5B", // batch
        "5C": "5C", // gallon(US) per thousand
        "5E": "5E", // MMSCF/day
        "5F": "5F", // pound per thousand
        "5G": "5G", // pump
        "5H": "5H", // stage
        "5I": "5I", // standard cubic foot
        "5J": "5J", // hydraulic horse power
        "5K": "5K", // count per minute
        "5P": "5P", // seismic level
        "5Q": "5Q", // seismic line
        "A11": "AG", // angstrom
        "A53": "79", // electronvolt
        "AA": "AA", // ball
        "AB": "AB", // bulk pack
        "ACR": "AC", // acre
        "ACT": "KU", // activity
        "AD": "AD", // byte
        "AE": "AE", // ampere per metre
        "AH": "AH", // additional minute
        "AI": "AI", // average minute per call
        "AJ": "AJ", // cop
        "AK": "AK", // fathom
        "AL": "AL", // access line
        "AM": "AM", // ampoule
        "AMP": "68", // ampere
        "ANN": "YR", // year
        "AP": "AP", // aluminium pound only
        "APZ": "TO", // troy ounce or apothecary ounce
        "AQ": "AQ", // anti-hemophilic factor (AHF) unit
        "AR": "AR", // suppository
        "AS": "AS", // assortment
        "ATM": "AT", // standard atmosphere
        "AV": "AV", // capsule
        "AW": "AW", // powder filled vial
        "AY": "AY", // assembly
        "AZ": "AZ", // British thermal unit (international table) per pound
        "B0": "B0", // Btu per cubic foot
        "B1": "B1", // barrel (US) per day
        "B2": "B2", // bunk
        "B3": "B3", // batting pound
        "B35": "3F", // kilogram per litre
        "B4": "B4", // barrel. imperial
        "B5": "B5", // billet
        "B6": "B6", // bun
        "B7": "B7", // cycle
        "B9": "B9", // batt
        "BB": "BB", // base box
        "BD": "B8", // board
        "BE": "BD", // bundle
        "BFT": "BF", // board foot
        "BG": "BG", // bag
        "BH": "BH", // brush
        "BHP": "BQ", // brake horse power
        "BJ": "BC", // bucket
        "BK": "BS", // basket
        "BL": "BA", // bale
        "BLL": "BR", // barrel (US)
        "BO": "BO", // bottle
        "BP": "BP", // hundred board foot
        "BQL": "R2", // becquerel
        "BR": "BI", // bar [unit of packaging]
        "BT": "BM", // bolt
        "BTU": "BY", // British thermal unit (international table)
        "BUA": "BU", // bushel (US)
        "BUI": "BV", // bushel (UK)
        "BW": "BW", // base weight
        "BX": "BX", // box
        "BZ": "BZ", // million BTUs
        "C0": "C0", // call
        "C1": "C1", // composite product pound (total weight)
        "C18": "", // millimole
        "C2": "C2", // carset
        "C34": "F5", // mole
        "C4": "C4", // carload
        "C5": "C5", // cost
        "C6": "C6", // cell
        "C62": "UN", // one
        "C7": "C7", // centipoise
        "C77": "PJ", // pound gage
        "C81": "RB", // radian
        "C9": "C9", // coil group
        "CA": "CN", // can
        "CEL": "CE", // degree Celsius
        "CEN": "HU", // hundred
        "CG": "CG", // card
        "CGM": "AF", // centigram
        "CH": "Z2", // container
        "CJ": "CJ", // cone
        "CK": "CK", // connector
        "CL": "CX", // coil
        "CLT": "C3", // centilitre
        "CMK": "SC", // square centimetre
        "CMQ": "CC", // cubic centimetre
        "CMT": "CM", // centimetre
        "CN": "CH", // 
        "CNP": "4F", // hundred pack
        "CO": "CB", // carboy
        "COU": "65", // coulomb
        "CQ": "CQ", // cartridge
        "CR": "CP", // crate
        "CS": "CA", // case
        "CT": "CT", // carton
        "CTM": "CD", // metric carat
        "CU": "CU", // cup
        "CUR": "4D", // curie
        "CV": "CV", // cover
        "CWA": "CW", // hundred pound (cwt) / hundred weight (US)
        "CWI": "HW", // hundred weight (UK)
        "CY": "CL", // cylinder
        "CZ": "CZ", // combo
        "D14": "TU", // thousand linear yard
        "D23": "N4", // pen gram (protein)
        "D5": "D5", // kilogram per square centimetre
        "D63": "BK", // book
        "D64": "BL", // block
        "D65": "RO", // round
        "D66": "CS", // cassette
        "D67": "A8", // dollar per hour
        "D7": "SA", // sandwich
        "D79": "BE", // beam
        "D8": "D8", // draize score
        "D9": "D9", // dyne per square centimetre
        "D90": "CO", // cubic metre (net)
        "D91": "R8", // rem
        "D92": "BJ", // band
        "D95": "JG", // joule per gram
        "D96": "PG", // pound gross
        "D97": "PL", // pallet/unit load
        "D98": "PU", // mass pound
        "D99": "SL", // sleeve
        "DAY": "DA", // day
        "DB": "DB", // dry pound
        "DC": "DC", // disk (disc)
        "DD": "DD", // degree [unit of angle]
        "DE": "DE", // deal
        "DG": "DG", // decigram
        "DI": "DI", // dispenser
        "DJ": "DJ", // decagram
        "DLT": "DL", // decilitre
        "DMK": "D3", // square decimetre
        "DMQ": "C8", // cubic decimetre
        "DMT": "DM", // decimetre
        "DN": "DN", // decinewton metre
        "DPR": "DP", // dozen pair
        "DQ": "DQ", // data record
        "DR": "DR", // drum
        "DRA": "DF", // dram (US)
        "DS": "DS", // display
        "DT": "DT", // dry ton
        "DU": "DU", // dyne
        "DWT": "WP", // pennyweight
        "DX": "DX", // dyne per centimetre
        "DY": "DY", // directory book
        "DZN": "DZ", // dozen
        "E2": "BT", // belt
        "E3": "NT", // trailer
        "E4": "GT", // gross kilogram
        "E5": "MT", // metric long ton
        "E51": "JA", // job
        "EA": "EA", // each
        "EB": "EB", // electronic mail box
        "EC": "EC", // each per month
        "EP": "EP", // eleven pack
        "EQ": "EQ", // equivalent gallon
        "EV": "EV", // envelope
        "F1": "F1", // thousand cubic foot per day
        "F9": "F9", // fibre per cubic centimetre of air
        "FAH": "FA", // degree Fahrenheit
        "FAR": "83", // farad
        "FB": "FB", // field
        "FC": "FC", // thousand cubic foot
        "FD": "FD", // million particle per cubic foot
        "FE": "FE", // track foot
        "FF": "FF", // hundred cubic metre
        "FG": "FG", // transdermal patch
        "FH": "FH", // micromole
        "FL": "FL", // flake ton
        "FM": "FM", // million cubic foot
        "FOT": "FT", // foot
        "FP": "FP", // pound per square foot
        "FR": "FR", // foot per minute
        "FS": "FS", // foot per second
        "FTK": "SF", // square foot
        "FTQ": "CF", // cubic foot
        "G2": "G2", // US gallon per minute
        "G3": "G3", // Imperial gallon per minute
        "G7": "G7", // microfiche sheet
        "GB": "GB", // gallon (US) per day
        "GBQ": "G4", // gigabecquerel
        "GC": "GC", // gram per 100 gram
        "GD": "GD", // gross barrel
        "GE": "GE", // pound per gallon (US)
        "GGR": "GG", // great gross
        "GH": "GH", // half gallon (US)
        "GII": "G5", // gill (UK)
        "GJ": "GJ", // gram per millilitre
        "GK": "GK", // gram per kilogram
        "GL": "GL", // gram per litre
        "GLI": "GI", // gallon (UK)
        "GLL": "GA", // gallon (US)
        "GM": "GM", // gram per square metre
        "GN": "GN", // gross gallon
        "GO": "GO", // milligram per square metre
        "GP": "GP", // milligram per cubic metre
        "GQ": "GQ", // microgram per cubic metre
        "GRM": "GR", // gram
        "GRN": "GX", // grain
        "GRO": "GS", // gross
        "GT": "TG", // gross ton
        "GV": "GV", // gigajoule
        "GW": "GW", // gallon per thousand cubic foot
        "GY": "GY", // gross yard
        "GZ": "GZ", // gage system
        "H1": "H1", // half page â€“ electronic
        "H2": "H2", // half litre
        "H87": "PC", // piece
        "HA": "HA", // hank
        "HAR": "HQ", // hectare
        "HBX": "HB", // hundred boxes
        "HC": "HC", // hundred count
        "HD": "HD", // half dozen
        "HE": "HE", // hundredth of a carat
        "HF": "HF", // hundred foot
        "HGM": "HG", // hectogram
        "HH": "HH", // hundred cubic foot
        "HI": "HI", // hundred sheet
        "HJ": "HJ", // metric horse power
        "HK": "HK", // hundred kilogram
        "HL": "HL", // hundred foot (linear)
        "HLT": "H4", // hectolitre
        "HM": "HM", // mile per hour (statute mile)
        "HMT": "E1", // hectometre
        "HN": "HN", // conventional millimetre of mercury
        "HO": "HO", // hundred troy ounce
        "HP": "HP", // conventional millimetre of water
        "HS": "HS", // hundred square foot
        "HT": "HT", // half hour
        "HTZ": "HZ", // hertz
        "HUR": "HR", // hour
        "HY": "HY", // hundred yard
        "IA": "IA", // inch pound (pound inch)
        "IC": "IC", // count per inch
        "IE": "IE", // person
        "IF": "IF", // inches of water
        "II": "II", // column inch
        "IL": "IL", // inch per minute
        "IM": "IM", // impression
        "INH": "IN", // inch
        "INK": "SI", // square inch
        "INQ": "CI", // cubic inch
        "IP": "IP", // insurance policy
        "IT": "IT", // count per centimetre
        "IU": "IU", // inch per second
        "IV": "IV", // inch per second squared
        "J2": "J2", // joule per kilogram
        "JB": "JB", // jumbo
        "JE": "JE", // joule per kelvin
        "JG": "JU", // jug
        "JK": "JK", // megajoule per kilogram
        "JM": "JM", // megajoule per cubic metre
        "JO": "JO", // joint
        "JOU": "86", // joule
        "JR": "JR", // jar
        "K1": "K1", // kilowatt demand
        "K2": "K2", // kilovolt ampere reactive demand
        "K3": "K3", // kilovolt ampere reactive hour
        "K5": "K5", // kilovolt ampere (reactive)
        "K6": "K6", // kilolitre
        "KA": "KA", // cake
        "KB": "KB", // kilocharacter
        "KD": "KD", // kilogram decimal
        "KEL": "KV", // kelvin
        "KF": "KF", // kilopacket
        "KG": "KE", // keg
        "KGM": "KG", // kilogram
        "KI": "KI", // kilogram per millimetre width
        "KJ": "KJ", // kilosegment
        "KJO": "", // kilojoule
        "KL": "KL", // kilogram per metre
        "KMH": "KP", // kilometre per hour
        "KMK": "8U", // square kilometre
        "KMQ": "KC", // kilogram per cubic metre
        "KMT": "DK", // kilometre
        "KNT": "EH", // knot
        "KO": "KO", // milliequivalence caustic potash per gram of product
        "KPA": "KQ", // kilopascal
        "KR": "KR", // kiloroentgen
        "KS": "KS", // thousand pound per square inch
        "KT": "KT", // kit
        "KVA": "K4", // kilovolt - ampere
        "KVT": "", // kilovolt
        "KW": "KW", // kilogram per millimetre
        "KWH": "KH", // kilowatt hour
        "KWT": "K7", // kilowatt
        "KX": "KX", // millilitre per kilogram
        "L2": "L2", // litre per minute
        "LA": "LA", // pound per cubic inch
        "LBR": "LB", // pound
        "LBT": "TX", // troy pound (US)
        "LC": "LC", // linear centimetre
        "LD": "LQ", // litre per day
        "LE": "LE", // lite
        "LEF": "X7", // leaf
        "LF": "LF", // linear foot
        "LH": "LH", // labour hour
        "LI": "LI", // linear inch
        "LJ": "LJ", // large spray
        "LK": "LK", // link
        "LM": "LM", // linear metre
        "LN": "LN", // length
        "LO": "LO", // lot  [unit of procurement]
        "LP": "LP", // liquid pound
        "LR": "LR", // layer
        "LS": "LS", // lump sum
        "LTN": "LG", // ton (UK) or long ton (US)
        "LTR": "LT", // litre
        "LX": "LX", // linear yard per pound
        "LY": "LY", // linear yard
        "M0": "M0", // magnetic tape
        "M1": "M1", // milligram per litre
        "M4": "M4", // monetary value
        "M5": "M5", // microcurie
        "M7": "M7", // micro-inch
        "M9": "M9", // million Btu per 1000 cubic foot
        "MA": "MA", // machine per unit
        "MBF": "TM", // thousand board foot
        "MBR": "M6", // millibar
        "MC": "MC", // microgram
        "MCU": "MU", // millicurie
        "MD": "MD", // air dry metric ton
        "MF": "MF", // milligram per square foot per side
        "MGM": "ME", // milligram
        "MHZ": "N6", // megahertz
        "MIK": "SB", // square mile (statute mile)
        "MIL": "TH", // thousand
        "MIN": "MJ", // minute [unit of time]
        "MK": "MK", // milligram per square inch
        "MLT": "ML", // millilitre
        "MMK": "MS", // square millimetre
        "MMQ": "", // cubic millimetre
        "MMT": "MM", // millimetre
        "MON": "MO", // month
        "MPA": "M8", // megapascal
        "MQ": "MQ", // thousand metre
        "MQH": "4V", // cubic metre per hour
        "MSK": "4J", // metre per second squared
        "MT": "M3", // mat
        "MTK": "SM", // square metre
        "MTQ": "CR", // cubic metre
        "MTR": "MR", // metre
        "MTS": "4I", // metre per second
        "MV": "MV", // number of mults
        "MWH": "T9", // megawatt hour (1000Â kW.h)
        "N1": "N1", // pen calorie
        "N2": "N2", // number of lines
        "N3": "N3", // print point
        "NA": "NA", // milligram per kilogram
        "NB": "NB", // barge
        "NC": "NC", // car
        "ND": "ND", // net barrel
        "NE": "NE", // net litre
        "NEW": "NW", // newton
        "NF": "NF", // message
        "NG": "NG", // net gallon (us)
        "NH": "NH", // message hour
        "NI": "NI", // net imperial gallon
        "NJ": "NJ", // number of screens
        "NL": "NL", // load
        "NMI": "NM", // nautical mile
        "NN": "NN", // train
        "NQ": "NQ", // mho
        "NR": "NR", // micromho
        "NT": "MN", // net ton
        "NU": "NU", // newton metre
        "NV": "NV", // vehicle
        "NX": "NX", // part per thousand
        "NY": "NY", // pound per air dry metric ton
        "OA": "OA", // panel
        "OHM": "82", // ohm
        "ON": "ON", // ounce per square yard
        "OP": "OP", // two pack
        "OT": "OT", // overtime hour
        "OZ": "OZ", // ounce av
        "OZA": "FO", // fluid ounce (US)
        "OZI": "FZ", // fluid ounce (UK)
        "P0": "P0", // page - electronic
        "P1": "P1", // percent
        "P2": "P2", // pound per foot
        "P3": "P3", // three pack
        "P4": "P4", // four pack
        "P5": "P5", // five pack
        "P6": "P6", // six pack
        "P7": "P7", // seven pack
        "P8": "P8", // eight pack
        "P9": "P9", // nine pack
        "PA": "12", // packet
        "PAL": "4S", // pascal
        "PB": "PB", // pair inch
        "PD": "PD", // pad
        "PE": "PE", // pound equivalent
        "PF": "PF", // pallet (lift)
        "PG": "PP", // plate
        "PI": "PI", // pitch
        "PK": "PK", // pack
        "PL": "PA", // pail
        "PM": "PM", // pound percentage
        "PN": "PN", // pound net
        "PO": "PO", // pound per inch of length
        "PQ": "PQ", // page per inch
        "PR": "PR", // pair
        "PS": "PS", // pound-force per square inch
        "PT": "PT", // pint (US)
        "PTD": "Q2", // dry pint (US)
        "PTI": "PX", // pint (UK)
        "PU": "TY", // tray / tray pack
        "PV": "PV", // half pint (US)
        "PW": "PW", // pound per inch of width
        "PY": "PY", // peck dry (US)
        "PZ": "PZ", // peck dry (UK)
        "Q3": "Q3", // meal
        "QA": "QA", // page - facsimile
        "QAN": "Q1", // quarter (of a year)
        "QB": "QB", // page - hardcopy
        "QD": "QD", // quarter dozen
        "QH": "QH", // quarter hour
        "QK": "QK", // quarter kilogram
        "QR": "QR", // quire
        "QT": "QT", // quart (US)
        "QTD": "QS", // dry quart (US)
        "QTI": "QU", // quart (UK)
        "R1": "R1", // pica
        "R4": "R4", // calorie
        "R9": "R9", // thousand cubic metre
        "RA": "RA", // rack
        "RD": "RD", // rod
        "RG": "RG", // ring
        "RH": "RH", // running or operating hour
        "RK": "RK", // roll metric measure
        "RL": "RE", // reel
        "RM": "RM", // ream
        "RN": "RN", // ream metric measure
        "RO": "RL", // roll
        "RP": "RP", // pound per ream
        "RPM": "R3", // revolutions per minute
        "RS": "RS", // reset
        "RT": "RT", // revenue ton mile
        "RU": "RU", // run
        "S3": "S3", // square foot per second
        "S4": "S4", // square metre per second
        "S5": "S5", // sixty fourths of an inch
        "S6": "S6", // session
        "S7": "S7", // storage unit
        "S8": "S8", // standard advertising unit
        "SA": "SJ", // sack
        "SD": "SD", // solid pound
        "SE": "SE", // section
        "SEC": "03", // second [unit of time]
        "SET": "ST", // set
        "SG": "SG", // segment
        "SIE": "67", // siemens
        "SK": "SK", // split tank truck
        "SL": "S9", // slipsheet
        "SMI": "02", // mile (statute mile)
        "SN": "SN", // square rod
        "SO": "SO", // spool
        "SP": "SP", // shelf package
        "SQ": "SQ", // square
        "SR": "SR", // strip
        "SS": "SS", // sheet metric measure
        "ST": "SH", // sheet
        "STN": "TN", // ton (US) or short ton (UK/US)
        "SV": "SV", // skid
        "SW": "SW", // skein
        "SX": "SX", // shipment
        "T0": "T0", // telecommunication line in service
        "T1": "T1", // thousand pound gross
        "T3": "T3", // thousand piece
        "T4": "T4", // thousand bag
        "T5": "T5", // thousand casing
        "T6": "T6", // thousand gallon (US)
        "T7": "T7", // thousand impression
        "T8": "T8", // thousand linear inch
        "TA": "TA", // tenth cubic foot
        "TC": "TC", // truckload
        "TD": "TD", // therm
        "TE": "TE", // tote
        "TF": "TF", // ten square yard
        "TI": "TI", // thousand square inch
        "TJ": "TJ", // thousand square centimetre
        "TK": "TK", // tank. rectangular
        "TL": "TL", // thousand foot (linear)
        "TNE": "MP", // tonne (metric ton)
        "TP": "TP", // ten pack
        "TQ": "TQ", // thousand foot
        "TR": "TR", // ten square foot
        "TS": "TS", // thousand square foot
        "TT": "TT", // thousand linear metre
        "TU": "TB", // tube
        "TV": "TV", // thousand kilogram
        "TW": "TW", // thousand sheet
        "U1": "U1", // treatment
        "U2": "U2", // tablet
        "UA": "UA", // torr
        "UB": "UB", // telecommunication line in service average
        "UC": "UC", // telecommunication port
        "UD": "UD", // tenth minute
        "UE": "UE", // tenth hour
        "UF": "UF", // usage per telecommunication line average
        "UH": "UH", // ten thousand yard
        "UM": "UM", // million unit
        "VA": "VA", // volt - ampere per kilogram
        "VI": "VI", // vial
        "VLT": "70", // volt
        "VQ": "BN", // bulk
        "VS": "VS", // visit
        "W2": "W2", // wet kilo
        "WA": "WA", // watt per kilogram
        "WB": "WB", // wet pound
        "WCD": "8C", // cord
        "WE": "WE", // wet ton
        "WEE": "WK", // week
        "WG": "WG", // wine gallon
        "WH": "WH", // wheel
        "WI": "WI", // weight per square inch
        "WM": "WM", // working month
        "WR": "WR", // wrap
        "WTT": "99", // watt
        "WW": "WW", // millilitre of water
        "X1": "X1", // Gunter's chain
        "YDK": "SY", // square yard
        "YDQ": "CY", // cubic yard
        "YL": "YL", // hundred linear yard
        "YRD": "YD", // yard
        "YT": "YT", // ten yard
        "Z1": "Z1", // lift van
        "Z3": "Z3", // cask
        "Z4": "Z4", // hogshead
        "Z5": "Z5", // lug
        "Z6": "Z6", // conference point
        "Z8": "Z8", // newspage agate line
        "ZP": "ZP", // page
        "ZZ": "ZZ", // mutually defined
    }
    static mapTXI963: Object = {
        "other": "AA", // other
        // "other":"AB", // other
        // "other":"AT", // other
        // "other":"BP", // other
        // "other":"CA", // other
        // "other":"CB", // other
        "gst": "CG", // gst
        // "other":"CI", // other
        // "sales": "CP", // sales
        // "other":"CR", // other
        // "sales":"CS", // sales
        // "other":"CT", // other
        // "gst":"CV", // gst
        // "other":"DL", // other
        // "other":"EQ", // other
        // "other":"ET", // other
        // "other":"EV", // other
        // "other":"F1", // other
        // "other":"F2", // other
        // "other":"F3", // other
        "usage": "FD", // usage
        // "other":"FF", // other
        "withholdingtax": "FI", // withholdingTax
        // "other":"FL", // other
        // "other":"FR", // other
        // "other":"FS", // other
        // "other":"FT", // other
        // "other":"GR", // other
        // "gst":"GS", // gst
        // "other":"HS", // other
        // "other":"HT", // other
        // "other":"HZ", // other
        // "other":"LB", // other
        // "other":"LO", // other
        // "sales":"LS", // sales
        // "sales":"LT", // sales
        // "other":"LU", // other
        // "other":"LV", // other
        // "other":"MA", // other
        // "other":"MN", // other
        // "other":"MP", // other
        // "other":"MS", // other
        // "other":"MT", // other
        // "other":"OH", // other
        // "other":"OT", // other
        // "other":"PG", // other
        // "other":"PS", // other
        // "other":"SA", // other
        // "other":"SB", // other
        // "other":"SC", // other
        // "usage":"SE", // usage
        // "other":"SF", // other
        // "other":"SL", // other
        // "other":"SP", // other
        // "other":"SR", // other
        // "other":"SS", // other
        "sales": "ST", // sales
        // "other":"SU", // other
        // "other":"SX", // other
        // "other":"T1", // other
        // "other":"T2", // other
        // "other":"TD", // other
        // "usage":"TT", // usage
        // "other":"UL", // other
        // "usage":"UT", // usage
        "vat": "VA", // vat
        // "other":"WS", // other
        // "other":"ZA", // other
        // "other":"ZB", // other
        // "usage":"ZC", // usage
        // "other":"ZD", // other
        // "other":"ZE", // other
        // "other":"ZZ", // other    
    }

    static mapSAC1300: Object = {
        "absoluteminimumcharge": "A010", // Absolute Minimum Charge
        "accesscharge-federal": "A020", // Access Charge - Federal
        "accesscharge-state": "A030", // Access Charge - State
        "accesscharge": "A040", // Access Charges
        "accountnumbercorrectioncharge": "A050", // Account Number Correction Charge
        "acidbattery": "A060", // Acid (Battery)
        "acknowledgementofdeliveryfee-aod": "A070", // Acknowledgement of Delivery Fee (AOD)
        "activationofcarnet": "A080", // Activation of Carnet
        "advalorem": "A090", // Ad Valorem
        "addon-destination": "A100", // Add on - Destination
        "addon-origin": "A110", // Add on - Origin
        "addtomakemarketvalue": "A112", // Add to Make Market Value
        "additionalcopiesoffreightbill": "A120", // Additional Copies of Freight Bill
        "additionalcommercialinvoices": "A121", // Additional Commercial Invoices
        "additionaltariffclassifications": "A122", // Additional Tariff Classifications
        "additionalmaterial": "A130", // Additional Material
        "addresscorrection": "A140", // Address Correction
        "adjustmentformaximumchargesbilling": "A150", // Adjustment for Maximum Charges Billing
        "adjustmentforminimumaveragetimerequirementbilling": "A160", // Adjustment for Minimum Average Time Requirement Billing
        "adjustment": "A170", // Adjustments
        "administrative": "A172", // Administrative
        "advancechargeshandling": "A180", // Advance Charges Handling
        "advancedestinationamount": "A190", // Advance Destination Amount
        "advancedestinationfee": "A200", // Advance Destination Fee
        "advancefee": "A210", // Advance Fee
        "advanceladingcharge": "A220", // Advance Lading Charge
        "advanceoriginamount": "A230", // Advance Origin Amount
        "advanceoriginfee": "A240", // Advance Origin Fee
        "advances": "A250", // Advances
        "advertisingallowance": "A260", // Advertising Allowance
        "affidavit": "A270", // Affidavit
        "agentdisbursement-destination": "A280", // Agent Disbursement - Destination
        "agentdisbursement-origin": "A290", // Agent Disbursement - Origin
        "airexportcertificate": "A300", // Air Export Certificate
        "airexpresscharge": "A310", // Air Express Charge
        "airtransportationcharge": "A320", // Air Transportation Charge
        "aircraftonground-aog": "A330", // Aircraft On Ground (AOG)
        "airlineopeningfee": "A340", // Airline Opening Fee
        "airportterminalhandlingcharge": "A350", // Airport Terminal Handling Charge
        "alcoholicbeveragereportcharge": "A360", // Alcoholic Beverage Report Charge
        "alleghenycountyandpadeliverycharge": "A370", // Allegheny County, PA Delivery Charge
        "allowanceadvance": "A380", // Allowance Advance
        "allowanceforconsignmentmerchandise": "A390", // Allowance for Consignment Merchandise
        "allowancenon-performance": "A400", // Allowance Non-performance
        "alterations": "A410", // Alterations
        "amendingexportdocumentation": "A420", // Amending Export Documentation
        "annealorheat-steelorglasstreatment": "A430", // Anneal/Heat (Steel or Glass Treatment)
        "anodizingcharge": "A440", // Anodizing Charge
        "anti-dumpingduty": "A445", // Anti-dumping Duty
        "appointment-notification": "A450", // Appointment (Notification)
        "arbitrary-inadditiontothroughratesandcharges": "A460", // Arbitrary (In Addition to Through Rates and Charges)
        "artwork": "A470", // Art Work
        "assembly": "A480", // Assembly
        "assistamount": "A485", // Assist Amount
        "attachmentstobillofladingcharge": "A490", // Attachments to Bill of Lading Charge
        "baddebt": "A500", // Bad Debt
        "bankingdrafts": "A510", // Banking Drafts
        "charge": "A520", // Base Charge
        "basicreorderallowance": "A530", // Basic Reorder Allowance
        "beamingcharge": "A540", // Beaming Charge
        "beddingorfeedingordisinfecting": "A550", // Bedding/Feeding/Disinfecting
        "beeffee": "A555", // Beef Fee
        "beyondcharge": "A560", // Beyond Charge
        "beyondfreightcharges": "A570", // Beyond Freight Charges
        "billandhold": "A580", // Bill and Hold
        "billofladingattendancy": "A590", // Bill of Lading Attendancy
        "billofladingcharge": "A600", // Bill of Lading Charge
        "billeddemand": "A610", // Billed Demand
        "blacklungtax": "A620", // Black Lung Tax
        "blockingandbracingcharge": "A630", // Blocking and Bracing Charge
        "blowercharge": "A640", // Blower Charge
        "bobtailcharges": "A650", // Bobtail Charges
        "bondamount": "A658", // Bond Amount
        "bondcharge": "A660", // Bond Charge
        "bordeauxarbitraries": "A670", // Bordeaux Arbitraries
        "both-flat": "A680", // Both-Flat
        "breakbulksurfacecharge": "A690", // Break Bulk Surface Charge
        "breakbulkservices": "A691", // Breakbulk Services
        "bridgetoll": "A700", // Bridge Toll
        "brokenlot": "A710", // Broken Lot
        "brokenpackagecharge": "A720", // Broken Package Charge
        "brokerage": "A721", // Brokerage
        "brokerageorduty": "A730", // Brokerage or Duty
        "bunkersurcharge": "A740", // Bunker Surcharge
        "burning": "A750", // Burning
        "buyerhandcarry": "A760", // Buyer Hand Carry
        "buyerscarallowance": "A770", // Buyers Car Allowance
        "cablepressurization": "A780", // Cable Pressurization
        "cables-sendingof": "A790", // Cables (sending of)
        "calltag": "A800", // Call Tag
        "camparbitrary": "A810", // Camp Arbitrary
        "canadagreatlakesadditionals": "A820", // Canada Great Lakes Additionals
        "canadianc.q.customsclearance": "A830", // Canadian C.Q.Customs Clearance
        "canadiancurrencyexchange": "A840", // Canadian Currency Exchange
        "canadianimportterminationfee": "A850", // Canadian Import Termination Fee
        "canadianreconsignmentfee": "A860", // Canadian Reconsignment Fee
        "canadianremanifestfee": "A870", // Canadian Remanifest Fee
        "cancellationcharge": "A880", // Cancellation Charge
        "cancelledorder-heavydutyflatcar": "A890", // Cancelled Order, Heavy Duty Flatcar
        "capping": "A900", // Capping
        "carloading": "A910", // Car Loading
        "carrental": "A920", // Car Rental
        "carriercreditallowance": "A930", // Carrier Credit Allowance
        "carrierdebitallowance": "A940", // Carrier Debit Allowance
        "carriernotificationcharge": "A950", // Carrier Notification Charge
        "carrier": "A960", // Carrier
        "cartagecharge": "A970", // Cartage Charge
        "cartage": "A980", // Cartage
        "catalogingservices": "A990", // Cataloging Services
        "payrolladditives-overtimelabor": "ADOW", // Payroll Additives, Overtime Labor
        "payrolladditives-straighttimelabor": "ADRW", // Payroll Additives, Straight Time Labor
        "fee": "AFEE", // Fee
        "portchanges": "ALPT", // Port Changes
        "centralbuy": "B000", // Central Buy
        "centsoff": "B010", // Cents Off
        "bopsheet": "B015", // Bop Sheet
        "certificateofconformance": "B020", // Certificate of Conformance
        "certificateoforigin": "B030", // Certificate of Origin
        "certificateofregistration": "B040", // Certificate of Registration
        "certification": "B050", // Certification
        "chainandbinders": "B060", // Chain and Binders
        "chamberofcommerceservicecharge": "B070", // Chamber of Commerce Service Charge
        "changeofairbilll-servicefee": "B080", // Change of Airbilll - Service Fee
        "chargesforwardoradvancecharge": "B090", // Charges Forward/Advance Charge
        "charterservices": "B091", // Charter Services
        "chassistransfer": "B100", // Chassis Transfer
        "chemicalmillingcharge": "B110", // Chemical Milling Charge
        "chicagoloopcharge": "B120", // Chicago Loop Charge
        "cigarettestamping": "B130", // Cigarette Stamping
        "citydelivery": "B140", // City Delivery
        "citymaintenancefee": "B150", // City maintenance fee
        "citypick-up": "B160", // City Pick-up
        "cityterminalcharge": "B170", // City Terminal Charge
        "cleaningcharge": "B180", // Cleaning Charge
        "closingandsealing": "B190", // Closing & Sealing
        "co-manufacturingdiscount": "B200", // Co-manufacturing Discount
        "co-opcredit": "B210", // Co-op Credit
        "coating-dipandrustproofandedp": "B220", // Coating (Dip, Rustproof, EDP)
        "codamount": "B230", // COD Amount
        "codcharges": "B240", // COD Charges
        "collectondeliveryalterationcharge": "B250", // Collect on Delivery Alteration Charge
        "collectondeliverydeletioncharge": "B260", // Collect on Delivery Deletion Charge
        "collectsurcharge": "B270", // Collect Surcharge
        "combinationperformanceandnon-performance": "B280", // Combination Performance and Non-performance
        "combination": "B290", // Combination
        "combineallsamedayshipment": "B300", // Combine All Same Day Shipment
        "commissionamount": "B310", // Commission Amount
        "competitiveallowance": "B320", // Competitive Allowance
        "competitivecarallowance": "B330", // Competitive Car Allowance
        "competitiveprice": "B340", // Competitive Price
        "compressorcharge": "B350", // Compressor Charge
        "concessioncredit": "B360", // Concession Credit
        "concessionmoney": "B370", // Concession Money
        "congestionsurcharge": "B380", // Congestion Surcharge
        "connectcharge": "B390", // Connect Charge
        "conservationresearchfee": "B400", // Conservation research fee
        "consigneeunload": "B500", // Consignee Unload
        "consolidation": "B510", // Consolidation
        "constantsurveillanceservice-armed": "B520", // Constant Surveillance Service - Armed
        "constantsurveillanceservice": "B530", // Constant Surveillance Service
        "consularlegalizationservice": "B540", // Consular Legalization Service
        "consularizationfee": "B550", // Consularization Fee
        "consultingservice": "B551", // Consulting Service
        "containerallowance": "B560", // Container Allowance
        "containerdeposits": "B570", // Container Deposits
        "containerdestuffing": "B580", // Container Destuffing
        "containerdiscount": "B581", // Container Discount
        "containerleasing": "B590", // Container Leasing
        "containerservicechargeukoreur": "B600", // Container Service Charge UK/EUR
        "containerservicechargeusaorcanada": "B610", // Container Service Charge USA/Canada
        "containerstuffing": "B620", // Container Stuffing
        "containerortrailerallowance": "B630", // Container/Trailer Allowance
        "continuousmileage": "B650", // Continuous Mileage
        "contract-allowance": "B660", // Contract Allowance
        "contractescalation": "B670", // Contract Escalation
        "contractservicecharge": "B680", // Contract Service Charge
        "controlledatmosphere": "B690", // Controlled Atmosphere
        "converting": "B700", // Converting
        "cooperativeadvertisingormerchandisingallowance-performance": "B720", // Cooperative Advertising/Merchandising Allowance (Performance)
        "copyofbillofladingcharge": "B730", // Copy of Bill of Lading Charge
        "copyofdeliveryreceiptcharge": "B740", // Copy of Delivery Receipt Charge
        "copying": "B742", // Copying
        "corecharge": "B750", // Core Charge
        "costrecoveryfactor": "B760", // Cost Recovery Factor
        "costrecoveryoradjustment": "B770", // Cost recovery/adjustment
        "cottonfee": "B775", // Cotton Fee
        "countandrecount": "B780", // Count and Recount
        "couponreimbursement": "B785", // Coupon Reimbursement
        "countervailingduty": "B787", // Countervailing Duty
        "crafting": "B790", // Crafting
        "crating": "B791", // Crating
        "credit": "B800", // Credit
        "currencyadjustmentfactor": "B810", // Currency Adjustment Factor
        "currencyadjustment": "B820", // Currency Adjustment
        "currencydiscount": "B830", // Currency Discount
        "customeraccountidentification": "B840", // Customer Account Identification
        "customerequipmentallowance": "B850", // Customer Equipment Allowance
        "customsbrokerfee": "B860", // Customs Broker Fee
        "customscharge": "B870", // Customs Charge
        "customsduty": "B872", // Customs Duty
        "customsentry": "B880", // Customs Entry
        "customsexam": "B881", // Customs Exam
        "customsformalities": "B890", // Customs Formalities
        "customsinvoice-additionalpage": "B900", // Customs Invoice - Additional Page
        "customsinvoice": "B910", // Customs Invoice
        "customspenalty": "B911", // Customs Penalty
        "cutandparallel": "B920", // Cut and Parallel
        "cut": "B930", // Cut
        "cuttingcharge": "B940", // Cutting Charge
        "damagedmerchandise": "B950", // Damaged Merchandise
        "dataordrawingcharge": "B960", // Data/Drawing Charge
        "de-installation": "B970", // De-Installation
        "deadheadmileagecharge": "B980", // Deadhead Mileage Charge
        "deafanddisabledsurcharge": "B990", // Deaf and Disabled Surcharge
        "declaredvalueforcarriage": "B992", // Declared Value for Carriage
        "declaredvalueforcustoms": "B994", // Declared Value for Customs
        "declaredvalueforinsurance": "B996", // Declared Value for Insurance
        "deducttomakemarketvalue": "B998", // Deduct to Make Market Value
        "bunkeradjustment-20footcontainer": "BU2T", // Bunker Adjustment - 20 Foot Container
        "bunkeradjustment-40footcontainer": "BU4T", // Bunker Adjustment - 40 Foot Container
        "bunkeradjustment": "BUAT", // Bunker Adjustment
        "burdenandoverheadorallowanceforindirectcosts": "BURD", // Burden, Overhead, or Allowance for Indirect Costs
        "defectiveallowance": "C000", // Defective Allowance
        "deficitfreight": "C010", // Deficit Freight
        "delayfurnishingdestinationweights": "C020", // Delay Furnishing Destination Weights
        "deliverysurcharge": "C030", // Delivery Surcharge
        "delivery": "C040", // Delivery
        "demandcharge": "C050", // Demand charge
        "demurrage-averageagreement": "C060", // Demurrage - Average Agreement
        "demurrage-special": "C070", // Demurrage - Special
        "demurrage": "C080", // Demurrage
        "depositcharges": "C090", // Deposit Charges
        "depositinlieuoforder": "C100", // Deposit In Lieu of Order
        "deposit": "C110", // Deposit
        "deramping": "C120", // Deramping
        "derrickcharge": "C130", // Derrick Charge
        "designatedsupplierinspection": "C140", // Designated Supplier Inspection
        "destinationcharge": "C150", // Destination Charge
        "detention-specialtypeflatcar": "C160", // Detention - Special Type Flat Car
        "detentionloading": "C170", // Detention Loading
        "detentionofpowerunits": "C180", // Detention of Power Units
        "detentionoftrailers": "C190", // Detention of Trailers
        "detentionunloading": "C200", // Detention Unloading
        "determinedfreight": "C210", // Determined Freight
        "developmentcharge": "C220", // Development Charge
        "dieservicecharge": "C230", // Die Service Charge
        "disbursement": "C231", // Disbursement
        "disconnectcharge": "C240", // Disconnect Charge
        "discount-dropboxorconveniencectr.": "C250", // Discount - Drop Box/Convenience Ctr.
        "discount-incentive": "C260", // Discount - Incentive
        "discount-multipleshipment": "C270", // Discount - Multiple Shipment
        "discount-serviceoption-delivery": "C280", // Discount - Service Option (Delivery)
        "discount-serviceoption-pickup": "C290", // Discount - Service Option (Pickup)
        "discount-special": "C300", // Discount - Special
        "discount": "C310", // Discount
        "displayallowance": "C320", // Display Allowance
        "distributionfee": "C330", // Distribution Fee
        "distributionservice": "C340", // Distribution Service
        "distributordiscountorallowance": "C350", // Distributor Discount/Allowance
        "diversionandreconsignment": "C360", // Diversion and Reconsignment
        "diversioncharge": "C370", // Diversion Charge
        "diversiontoaircharge": "C380", // Diversion to Air Charge
        "dockage-boatdetention": "C390", // Dockage - Boat Detention
        "documentationcharge": "C400", // Documentation Charge
        "documenthandling": "C401", // Document Handling
        "door-to-door": "C402", // Door-to-Door
        "dowelpincharge": "C410", // Dowel Pin Charge
        "drayage": "C420", // Drayage
        "drayageorlinehaul": "C430", // Drayage/Line Haul
        "driverassistedunloading": "C440", // Driver Assisted Unloading
        "driver'swages": "C450", // Driver's Wages
        "dropdock": "C460", // Drop Dock
        "dropyard": "C470", // Drop Yard
        "drumcost": "C480", // Drum Cost
        "drumdeposit": "C490", // Drum Deposit
        "drumupcharge": "C500", // Drum Up Charge
        "dryice": "C510", // Dry Ice
        "dryercharge": "C520", // Dryer Charge
        "dutycharge": "C530", // Duty Charge
        "dutydrawback": "C531", // Duty Drawback
        "earlybuyallowance": "C540", // Early Buy Allowance
        "earlypaymentallowance": "C550", // Early Payment Allowance
        "earlyshipallowance": "C560", // Early Ship Allowance
        "emergencyportcharge": "C570", // Emergency Port Charge
        "emergencyservice": "C580", // Emergency Service
        "emergencysurcharge": "C590", // Emergency Surcharge
        "emptyweighingcharge": "C600", // Empty Weighing Charge
        "enclosure": "C610", // Enclosure
        "endorsementfee": "C630", // Endorsement Fee
        "energycharge": "C640", // Energy charge
        "energysurcharge-fueladjustmentfactor": "C650", // Energy Surcharge (Fuel Adjustment Factor)
        "engineeringcharge": "C660", // Engineering Charge
        "engraving": "C670", // Engraving
        "enteredvalue": "C675", // Entered Value
        "environmentalprotectionservice": "C680", // Environmental Protection Service
        "escalation": "C690", // Escalation
        "escortservice": "C700", // Escort Service
        "eur1presentationfee": "C710", // Eur1 Presentation Fee
        "europeanportcharges": "C720", // European Port Charges
        "excessmileagecharge": "C730", // Excess Mileage Charge
        "excessperiods": "C740", // Excess Periods
        "excessvaluefee": "C750", // Excess Value Fee
        "excessweight": "C760", // Excess Weight
        "excessivevaluecharge": "C770", // Excessive Value Charge
        "exchangeaccesscredit": "C780", // Exchange Access Credit
        "exclusiveuseofequipment": "C790", // Exclusive Use Of Equipment
        "exclusiveuse": "C800", // Exclusive Use
        "exhibitiondeliverycharge": "C810", // Exhibition Delivery Charge
        "exhibitionpickupcharge": "C820", // Exhibition Pickup Charge
        "expandedservice": "C830", // Expanded Service
        "expeditedonedayconsularservice": "C840", // Expedited One Day Consular Service
        "expeditedservicecharge": "C850", // Expedited Service Charge
        "expeditedshipments": "C860", // Expedited Shipments
        "expeditingfee": "C870", // Expediting Fee
        "expeditingpremium": "C880", // Expediting Premium
        "exportcustomsclearance": "C890", // Export Customs Clearance
        "exportdeclarations-automated": "C900", // Export Declarations - Automated
        "exportdeclarations-u.s.shippers": "C910", // Export Declarations - U.S. Shippers
        "exportlicenseapplication": "C920", // Export License Application
        "exportshippingcharge": "C930", // Export Shipping Charge
        "exportorimportcharge": "C940", // Export/Import Charge
        "extracopiesandmailings": "C950", // Extra Copies and Mailings
        "extralabor-helperservice": "C960", // Extra Labor (Helper Service)
        "extralength": "C970", // Extra Length
        "extraservice-counter-to-counter": "C980", // Extra Service - Counter-to-Counter
        "fabricationcharge": "C990", // Fabrication Charge
        "currencyadjustment-20footcontainer": "CA2T", // Currency Adjustment - 20 Foot Container
        "currencyadjustment-40footcontainer": "CA4T", // Currency Adjustment - 40 Foot Container
        "customsfees-containerlevel": "CFCT", // Customs Fees - Container Level
        "customsfees-liftlevel": "CFLT", // Customs Fees - Lift Level
        "cargotaxes": "CGTT", // Cargo Taxes
        "containerlossordamage": "CLDT", // Container Loss/Damage
        "communicationscharges": "COMM", // Communications Charges
        "containerlease": "CRLT", // Container Lease
        //"controlledatmosphere": "CTLT", // Controlled Atmosphere
        "currencyadjustment-breakbulk": "CUFT", // Currency Adjustment - Break Bulk
        "facsimilecharges-additionalpages": "D000", // Facsimile Charges - Additional Pages
        "facsimilecharges": "D010", // Facsimile Charges
        "dunnage": "D015", // Dunnage
        "failedlamppanelcharge": "D020", // Failed Lamp Panel Charge
        "faxpre-alert": "D025", // Fax Pre-alert
        "federaltransfersurcharge": "D030", // Federal Transfer Surcharge
        "financecharge": "D040", // Finance Charge
        "firstarticlecharge": "D050", // First Article Charge
        "firstflightout": "D060", // First Flight Out
        "flatrate": "D070", // Flat Rate
        "floorstockprotection": "D080", // Floor Stock Protection
        "foodandlodging": "D100", // Food and Lodging
        "foreignofficeadvance": "D101", // Foreign Office Advance
        "foreigncustomsduty": "D103", // Foreign Customs Duty
        "foreignmilitarysales-fms-rental": "D110", // Foreign Military Sales (FMS) Rental
        "foreignmilitarysales-fms-specialcharge": "D120", // Foreign Military Sales (FMS) Special Charge
        "forwardingagentcommission": "D130", // Forwarding Agent Commission
        "forwardingcharge": "D140", // Forwarding Charge
        "forwardcoupons": "D141", // Forward Coupons
        "captureadditionaldata": "D142", // Capture Additional Data
        "providenameandaddress": "D143", // Provide Name and Address
        "providehouseholdidentifier": "D144", // Provide Household Identifier
        "franchisefee": "D150", // Franchise fee
        "freedomicileshipmentprocessing": "D160", // Free Domicile Shipment Processing
        "freegoods": "D170", // Free Goods
        "freightbasedondollarminimum": "D180", // Freight Based on Dollar Minimum
        "freightchargestoborder": "D190", // Freight Charges to Border
        "freightchargestodestination": "D200", // Freight Charges to Destination
        "freightequalization": "D210", // Freight Equalization
        "freightpassthrough": "D220", // Freight Passthrough
        "freightsurcharge": "D230", // Freight Surcharge
        "freight": "D240", // Freight
        "freightinternational": "D242", // Freight, International
        "freight-international-u.s.dollars": "D244", // Freight, International, U.S. Dollars
        "freight-international-non-u.s.dollars": "D246", // Freight, International, Non-U.S. Dollars
        "freshnessorleakerallowance": "D250", // Freshness/Leaker Allowance
        "fuelcharge": "D260", // Fuel Charge
        "fuelsurcharge": "D270", // Fuel Surcharge
        "fullservice": "D280", // Full Service
        "fulltruckloadallowance": "D290", // Full Truckload Allowance
        "fumigation": "D292", // Fumigation
        "garmentdistrict": "D300", // Garment District
        "gatewayfee": "D301", // Gateway Fee
        "gaspressure": "D310", // Gas Pressure
        "glaze": "D320", // Glaze
        "goldfactor": "D330", // Gold Factor
        "goodsandservicescharge": "D340", // Goods and Services Charge
        "goodsandservicescreditallowance": "D350", // Goods and Services Credit Allowance
        "goodsandservicestaxcharge": "D360", // Goods and Services Tax Charge
        "governmentinspection": "D370", // Government Inspection
        "governmentwarehousefee-destination": "D380", // Government Warehouse Fee - Destination
        "governmentwarehousefee-origin": "D390", // Government Warehouse Fee - Origin
        "graindoors": "D400", // Grain Doors
        "grainflowcharge": "D410", // Grain Flow Charge
        "grinding": "D420", // Grinding
        "grossreceiptssurcharge": "D430", // Gross Receipts Surcharge
        "groupagediscount": "D440", // Groupage Discount
        "groupeditems": "D450", // Grouped Items
        "guaranteedinspectiontechnicalservice": "D460", // Guaranteed Inspection Technical Service
        "gulfportdeliverycharge": "D470", // Gulf Port Delivery Charge
        "handlingchargesondistributionfreightforwardedbeyond": "D480", // Handling Charges on Distribution Freight Forwarded Beyond
        "handlingfreightatpositionsnotimmediatelyadjacenttovehiclecharge": "D490", // Handling Freight At Positions Not Immediately Adjacent To Vehicle Charge
        "handling": "D500", // Handling
        "harbormaintenancereport": "D501", // Harbor Maintenance Report
        "harbormaintenancefee": "D502", // Harbor Maintenance Fee
        "haulingandhoistingtobedirectbilled": "D510", // Hauling and Hoisting to be Direct Billed
        "haulingandhoisting": "D520", // Hauling and Hoisting
        "hazardouscargocharge": "D530", // Hazardous Cargo Charge
        "hazardousmaterialshandlingfee-domestic": "D540", // Hazardous Materials Handling Fee - Domestic
        "hazardousmaterialshandlingfee-international": "D550", // Hazardous Materials Handling Fee - International
        "hazardousstorage": "D560", // Hazardous Storage
        "heatintransitcharges": "D570", // Heat In Transit Charges
        "heattreatcharge": "D580", // Heat Treat Charge
        "heavydutyflatcarcharge": "D590", // Heavy Duty Flat Car Charge
        "heavylift": "D600", // Heavy Lift
        "highsecurityredin-bondsealcharge": "D610", // High Security Red In-bond Seal Charge
        "highwayinterchange": "D620", // Highway Interchange
        "hointinsandhauling": "D630", // Hointins and Hauling
        "holdingcharge": "D640", // Holding Charge
        "homelinefreightcharge": "D650", // Home Line Freight Charge
        "honeyfee": "D655", // Honey Fee
        "hook-upcharge": "D660", // Hook-up charge
        "hosechargespecial": "D670", // Hose Charge Special
        "hosecharge": "D680", // Hose Charge
        "householdgoodspick-upordelivery": "D690", // Household Goods Pick-up or Delivery
        "iataairbillpreparation": "D700", // IATA Airbill Preparation
        "internationalairtransportassociation-iata-commission": "D701", // International Air Transport Association (IATA) Commission
        "iatafee": "D710", // IATA Fee
        "internationalairtransportassociation-iata-markup": "D711", // International Air Transport Association (IATA) Markup
        "identification": "D720", // Identification
        "importservicefee": "D730", // Import Service Fee
        "intransitpriceprotection": "D740", // In Transit Price Protection
        "inboundfreightcharges": "D750", // Inbound Freight Charges
        "incomefreight-manufacturingtoshippingpoint": "D760", // Income Freight (Manufacturing to Shipping Point)
        "incorrectbillingaccountcharge": "D770", // Incorrect Billing Account Charge
        "industrypriceallowance": "D780", // Industry Price Allowance
        "initiallicensefee": "D790", // Initial License Fee
        "inlandtransportation": "D800", // Inland Transportation
        "insidecableconnectors": "D810", // Inside Cable Connectors
        "insidedelivery": "D820", // Inside Delivery
        "insidepick-up": "D830", // Inside Pick-up
        "inspectatdestination": "D840", // Inspect at Destination
        "inspectatorigin": "D850", // Inspect at Origin
        "inspectionfee": "D860", // Inspection Fee
        "inspection": "D870", // Inspection
        "installationandwarranty": "D880", // Installation & Warranty
        "installationandtraining": "D890", // Installation and Training
        "installation": "D900", // Installation
        "insulatedtankcharge": "D910", // Insulated Tank Charge
        "insurancefee": "D920", // Insurance Fee
        "insuranceplacementcostcharge": "D930", // Insurance Placement Cost Charge
        "insurancepremium": "D940", // Insurance Premium
        "insuranceprovidedbylessee": "D950", // Insurance Provided by Lessee
        "insuranceprovidedbylessor": "D960", // Insurance Provided by Lessor
        "insurancesurcharge": "D970", // Insurance Surcharge
        "insurance": "D980", // Insurance
        "interdivisionprofit": "D990", // Interdivision Profit
        "interestamount": "D995", // Interest Amount
        "damagetocarrierequipment": "DCET", // Damage to Carrier Equipment
        "damagetocarriervessel": "DCVT", // Damage to Carrier Vessel
        "drayageatportofdebarkation-ratezone": "DDZT", // Drayage at Port of Debarkation (Rate Zone)
        "drayageatportofembarkation-ratezone": "DEZT", // Drayage at Port of Embarkation (Rate Zone)
        "keepfromfreezingpercentdifferential": "DFDT", // Keep From Freezing Percent Differential
        "damagetogovernmentequipment": "DGET", // Damage to Government Equipment
        "containerdiversion": "DOVT", // Container Diversion
        "drayageatportofdebarkation": "DPDT", // Drayage at Port of Debarkation
        "drayageatportofembarkation": "DPET", // Drayage at Port of Embarkation
        "interestonrefund": "E000", // Interest on refund
        "interestonsecuritydeposit": "E010", // Interest on Security Deposit
        "interimusepermittedatspecialrate": "E020", // Interim Use Permitted at Special Rate
        "internationalcourier": "E022", // International Courier
        "internationaldoor-to-doorhandlingfee": "E030", // International Door-to-Door Handling Fee
        "interplantcharge": "E040", // Interplant Charge
        "interstateorhighwaytoll": "E050", // Interstate/Highway Toll
        "intra-plantcharge": "E060", // Intra-plant Charge
        "invoiceadditionalamount": "E063", // Invoice Additional Amount
        "invoiceadjustment": "E065", // Invoice Adjustment
        "invoiceat-costamount": "E067", // Invoice At-Cost Amount
        "invoicedeliverytermsamount": "E068", // Invoice Delivery Terms Amount
        "invoiceno-chargeamount": "E069", // Invoice No-Charge Amount
        "invoiceservices": "E070", // Invoice Services
        "invoicewithgoods": "E080", // Invoice with Goods
        "irisharbitraries": "E090", // Irish Arbitraries
        "islanddeliverycharge": "E100", // Island Delivery Charge
        "islandpick-upcharge": "E110", // Island Pick-Up Charge
        "italianreleasecharge": "E120", // Italian Release Charge
        "itempercentage": "E130", // Item Percentage
        "item-unit": "E140", // Item-Unit
        "koshering": "E150", // Koshering
        "labelallowance": "E160", // Label Allowance
        "labeling": "E170", // Labeling
        "labor-repairandreturnorders": "E180", // Labor (Repair and Return Orders)
        "laborcharges": "E190", // Labor Charges
        "labor-straight-time": "E191", // Labor, Straight-time
        "labor-overtime": "E192", // Labor, Overtime
        "labor-premiumovertime": "E193", // Labor, Premium Overtime
        "laborcostofremoval": "E200", // Labor Cost of Removal
        "laborservice": "E210", // Labor Service
        "labor-modify": "E220", // Labor, Modify
        "labor-notroublefound": "E230", // Labor, No Trouble Found
        "labor-testandcalibrate": "E240", // Labor, Test and Calibrate
        "ladingadjustmentcharge": "E250", // Lading Adjustment Charge
        "lashing": "E260", // Lashing
        "lateordercharge": "E270", // Late Order Charge
        "latepaymentcharge": "E280", // Late Payment Charge
        "layoutordesign": "E290", // Layout/Design
        "layovercharges": "E300", // Layover Charges
        "leadfactor": "E310", // Lead Factor
        "leakingundergroundstoragetax-lust": "E320", // Leaking Underground Storage Tax (LUST)
        "leaseshortfallconsideration": "E330", // Lease Shortfall Consideration
        "lessthantruckload-ltl-charge": "E340", // Less Than Truckload (LTL) Charge
        "letterofcreditprocessing": "E350", // Letter of Credit Processing
        "licenseandtitle": "E360", // License and Title
        "lifelinesurcharge": "E370", // Lifeline Surcharge
        "liftgate-truck-orforkliftserviceatpick-upordelivery": "E380", // Lift Gate (Truck) or Forklift Service at Pick-up/Delivery
        "limefee": "E381", // Lime Fee
        "liquidationanti-dumpingduty": "E382", // Liquidation Anti-Dumping Duty
        "liquidationcountervailingduty": "E384", // Liquidation Countervailing Duty
        "liquidationtaxamount": "E386", // Liquidation Tax Amount
        "liquidationtotaldueu.s.customsservice-uscs": "E388", // Liquidation Total Due U.S. Customs Service (USCS)
        "liquidationtotalfees": "E389", // Liquidation Total Fees
        "loadweighingcharge": "E390", // Load Weighing Charge
        "loading-laborcharges": "E400", // Loading (Labor Charges)
        "loading": "E410", // Loading
        "loanfee": "E420", // Loan Fee
        "localdeliveryordrayage": "E430", // Local Delivery/Drayage
        "locomotivedelayedinswitchingservice": "E440", // Locomotive Delayed In Switching Service
        "locomotiveunderownpower": "E450", // Locomotive Under Own Power
        "lotcharge": "E460", // Lot Charge
        "lumpsum": "E470", // Lump Sum
        "machiningcharge": "E480", // Machining Charge
        "mailfee": "E485", // Mail Fee
        "mailinvoicetoeachlocation": "E490", // Mail Invoice to Each Location
        "mailinvoice": "E500", // Mail Invoice
        "mailing-postagecost": "E510", // Mailing - Postage Cost
        "mailing-servicefee": "E520", // Mailing - Service Fee
        "manifestcharge": "E530", // Manifest Charge
        "manufacturing": "E540", // Manufacturing
        "marketdevelopmentfunds": "E550", // Market Development Funds
        "markingortaggingcharge": "E560", // Marking or Tagging Charge
        "marriagerule": "E570", // Marriage Rule
        "memoreturnablecontainer": "E580", // Memo Returnable Container
        "merchandiseprocessingfee": "E585", // Merchandise Processing Fee
        "messagecharge": "E590", // Message Charge
        "messagerateadjustment": "E600", // Message Rate Adjustment
        "messengerservice": "E610", // Messenger Service
        "metalssurcharge": "E620", // Metals Surcharge
        "metercharge": "E630", // Meter Charge
        "mileagefee-forrepairandreturn": "E640", // Mileage Fee (For Repair and Return)
        "mileageortravel": "E650", // Mileage or Travel
        "monthlyrental": "E660", // Monthly Rental
        "mountordemount": "E670", // Mount/Demount
        "mounting": "E680", // Mounting
        "municipalsurcharge": "E690", // Municipal Surcharge
        "mushroomfee": "E695", // Mushroom Fee
        "n.h.d.wharfage": "E700", // N.H.D. Wharfage
        "newdiscount": "E710", // New Discount
        "newdistributionallowance": "E720", // New Distribution Allowance
        "newitemallowance": "E730", // New Item Allowance
        "newstoreallowance": "E740", // New Store Allowance
        "newstorediscount": "E750", // New Store Discount
        "newwarehousediscount": "E760", // New Warehouse Discount
        "newwarehouse": "E770", // New Warehouse
        "newyorkdeliverycharge": "E780", // New York Delivery Charge
        "newyorkpick-upcharge": "E790", // New York Pick-up Charge
        "noreturncreditallowance": "E800", // No Return Credit Allowance
        "non-dutiablecharges": "E805", // Non-Dutiable Charges
        "nongeneratedfreight": "E810", // Non Generated Freight
        "non-returnablecontainers": "E820", // Non-returnable Containers
        "normalpumpcharge": "E830", // Normal Pump Charge
        "notarizedaffidavit": "E840", // Notarized Affidavit
        "notifyconsigneebeforedelivery": "E850", // Notify Consignee Before Delivery
        "notifyconsignee": "E860", // Notify Consignee
        "nozzlecharge": "E870", // Nozzle Charge
        "oceancharges-hazardous": "E880", // Ocean Charges - Hazardous
        "oceanfreight": "E890", // Ocean Freight
        "offshore-alaska/hawaii": "E900", // Offshore - Alaska/Hawaii
        "oncarriage": "E910", // On Carriage
        "onhandservice": "E920", // On Hand Service
        "one-dayservice": "E930", // One - Day Service
        "onetimeengineeringcharge": "E940", // One Time Engineering Charge
        "one-timelicensefee": "E950", // One-Time License Fee
        "one-time-onlycharge": "E960", // One-Time-Only Charge
        "onetimetooling": "E970", // Onetime Tooling
        "operatorcredit": "E980", // Operator Credit
        "optioncharge-colorfabricofficefurniture": "E990", // Option Charge (Color Fabric Office Furniture)
        "engineeringsupplies": "ENGA", // Engineering Supplies
        "extralengthsurcharge": "EXLT", // Extra Length Surcharge
        "optionalcharge": "F000", // Optional Charge
        "optionalsoftwaresupportforoperationalsupportsystems": "F010", // Optional Software Support for Operational Support Systems
        "optionalsoftwaresupportforswitchingsystems": "F020", // Optional Software Support for Switching Systems
        "ordernotifycharge": "F030", // Order Notify Charge
        "order-flat": "F040", // Order-Flat
        "other-seerelateddescription": "F050", // Other (See related description)
        "otheraccessorialservicecharge": "F060", // Other Accessorial Service Charge
        "otheradvances": "F061", // Other Advances
        "otherexportcharges": "F062", // Other Export Charges
        "othergovernmentagencydeclaration": "F063", // Other Government Agency Declaration
        "othergovernmentagencyexam": "F065", // Other Government Agency Exam
        "otherimportcharge": "F067", // Other Import Charge
        "outofroutemiles": "F070", // Out of Route Miles
        "outofzonepick-upordelivery": "F080", // Out of Zone Pick-up or Delivery
        "outsidecableconnectors": "F090", // Outside Cable Connectors
        "overdimension": "F100", // Over Dimension
        "overruncharge": "F110", // Overrun Charge
        "oversizedpremium": "F120", // Oversized Premium
        "overtimeloading": "F130", // Overtime Loading
        "packinvoicewithshipment": "F140", // Pack Invoice with Shipment
        "packagingservice": "F150", // Packaging Service
        "packaging": "F155", // Packaging
        "painting-primerorfinish": "F160", // Painting (Primer or Finish)
        "palletexchangecharge": "F170", // Pallet Exchange Charge
        "pallet": "F180", // Pallet
        "palletizing": "F190", // Palletizing
        "paralleling": "F200", // Paralleling
        "parishorcountysalestax-only": "F210", // Parish/County Sales Tax (only)
        "passingshippersexportentry": "F220", // Passing Shippers Export Entry
        "pecanfee": "F225", // Pecan Fee
        "penaltycharge": "F230", // Penalty Charge
        "peritemcharge": "F240", // Per Item Charge
        "perordercharge": "F250", // Per Order Charge
        "perpoundcharge": "F260", // Per Pound Charge
        "percentofproduct": "F270", // Percent of Product
        "percentofshippedquantitythatisreturnable": "F271", // Percent of Shipped Quantity That Is Returnable
        "percentofshipmentvaluethatisreturnable": "F272", // Percent of Shipment Value That Is Returnable
        "performanceallowance": "F280", // Performance Allowance
        "performanceaward": "F290", // Performance Award
        "permitcharge": "F300", // Permit Charge
        "permitsbondsescortattendant": "F310", // Permits Bonds Escort Attendant
        "phosphatizing-steeltreatment": "F320", // Phosphatizing (Steel Treatment)
        "pick-upanddelivery": "F330", // Pick-up and Delivery
        "pick-up": "F340", // Pick/Up
        "pickleandoil": "F350", // Pickle and Oil
        "pickup-outofarea": "F360", // Pickup - Out of Area
        "pickupsurcharge": "F370", // Pickup Surcharge
        "piercharges-wharfage": "F380", // Pier Charges - Wharfage
        "pierchargesotherthanwharfage": "F390", // Pier Charges Other Than Wharfage
        "pierpick-upandordelivery": "F400", // Pier Pick-up and/or Delivery
        "pierunloading": "F401", // Pier Unloading
        "pilotinspection": "F410", // Pilot Inspection
        "placementandorremovalcharge": "F420", // Placement and/or Removal Charge
        "plating": "F430", // Plating
        "poleandwood-servicecharge": "F440", // Pole, Wood-service Charge
        "porkfee": "F445", // Pork Fee
        "positioningatorigin": "F450", // Positioning at Origin
        "postage": "F460", // Postage
        "potatofee": "F465", // Potato Fee
        "powerfactoradjustment": "F470", // Power Factor Adjustment
        "pre-carriageexcess": "F480", // Pre-carriage Excess
        "pre-carriage": "F490", // Pre-carriage
        "pre-positionedinventoryservice": "F500", // Pre-Positioned Inventory Service
        "preciousmetalcontent": "F510", // Precious Metal Content
        "preloadingcharge": "F520", // Preloading Charge
        "prelodgecharge": "F530", // Prelodge Charge
        "premiseuse": "F540", // Premise Use
        "premiumcharge": "F550", // Premium Charge
        "premiumtransportation": "F560", // Premium Transportation
        "prepaidusageallowance": "F570", // Prepaid Usage Allowance
        "preparationanddelivery": "F580", // Preparation and Delivery
        "preparationofairwaybill-origin": "F590", // Preparation of Air Waybill - Origin
        "preparationofcanadiancustomsinvoice": "F600", // Preparation of Canadian Customs Invoice
        "preparationofcommercialinvoice": "F610", // Preparation of Commercial Invoice
        "preparationofexportentry": "F620", // Preparation of Export Entry
        "preparationofinsurancecertificate": "F630", // Preparation of Insurance Certificate
        "preparationofu.s.exportdocumentation": "F640", // Preparation of U.S. Export Documentation
        "preparation": "F650", // Preparation
        "previousbilling": "F660", // Previous Billing
        "priceandmarketingallowance": "F670", // Price and Marketing Allowance
        "pricedeviation": "F680", // Price Deviation
        "priorbalance": "F690", // Prior Balance
        "priorbillingamount": "F700", // Prior Billing Amount
        "priordeliveryofbillcharge": "F710", // Prior Delivery Of Bill Charge
        "priormonthcredit": "F720", // Prior Month Credit
        "priorityservice": "F730", // Priority Service
        "processintransitprivilege": "F740", // Process In Transit Privilege
        "processingcharge": "F750", // Processing Charge
        "processing": "F760", // Processing
        "professionalfees": "F770", // Professional Fees
        "proformainvoice": "F780", // Proforma Invoice
        "progresspaymentrequirement": "F790", // Progress Payment Requirement
        "promotionalallowance": "F800", // Promotional Allowance
        "promotionaldiscount": "F810", // Promotional Discount
        "proofandcomposition": "F820", // Proof & Composition
        "proofofdelivery": "F830", // Proof of Delivery
        "protectiveservice-cold": "F840", // Protective Service - Cold
        "protectiveservice-heat": "F850", // Protective Service - Heat
        "protectiveservicecharge": "F860", // Protective Service Charge
        "pullingeyes": "F870", // Pulling Eyes
        "pumpaircharge": "F880", // Pump Air Charge
        "pumpcharge": "F890", // Pump Charge
        "purchaseoption": "F900", // Purchase Option
        "quantitydiscount": "F910", // Quantity Discount
        "quantitysurcharge": "F920", // Quantity Surcharge
        "equipmentmanufacturerrestorationaudit": "F930", // Equipment Manufacturer Restoration Audit
        "ramping": "F940", // Ramping
        "ratecode": "F950", // Rate Code
        "re-billcharge": "F960", // Re-Bill Charge
        "rebate": "F970", // Rebate
        "rebilleddrayage-destination": "F980", // Rebilled Drayage - Destination
        "rebilleddrayage-origin": "F990", // Rebilled Drayage - Origin
        "receiving": "F991", // Receiving
        "bargefreightallkindsservice": "FAKT", // Barge Freight All Kinds Service
        "flatracksurcharge": "FLST", // Flatrack Surcharge
        "recipientaddresscorrection": "G000", // Recipient Address Correction
        "reclamation-federal": "G010", // Reclamation, Federal
        "reclamation-state": "G020", // Reclamation, State
        "reconciliation": "G025", // Reconciliation
        "reconnectcharge": "G030", // Reconnect charge
        "reconsignconsigneecharge": "G040", // Reconsign Consignee Charge
        "reconsigndeliverycharge": "G050", // Reconsign Delivery Charge
        "reconsignmentcharge": "G060", // Reconsignment Charge
        "recoopering-atowner'sorshipper'sexpense": "G070", // Recoopering (at Owner's or Shipper's Expense)
        "recordorfiling": "G080", // Record/Filing
        "recoveryfee": "G090", // Recovery Fee
        "recovery": "G100", // Recovery
        "recratingorrecoopering-destination": "G110", // Recrating/Recoopering - Destination
        "recratingorrecoopering-origin": "G120", // Recrating/Recoopering - Origin
        "recurringhardwaremaintenancecharge": "G130", // Recurring Hardware Maintenance Charge
        "recurringlicensefee": "G140", // Recurring License Fee
        "recurringsoftwaremaintenancecharge": "G150", // Recurring Software Maintenance Charge
        "redelivery": "G160", // Redelivery
        "redistributionallowance": "G170", // Redistribution Allowance
        "reductionprepalletizedcargo": "G180", // Reduction Prepalletized Cargo
        "reelcable": "G190", // Reel Cable
        "reeldeposit": "G200", // Reel Deposit
        "reel": "G210", // Reel
        "refrigeration": "G220", // Refrigeration
        "refrigerationormechanicaldetention": "G230", // Refrigeration/Mechanical Detention
        "refund": "G240", // Refund
        "refurbishingcharge": "G250", // Refurbishing Charge
        "regain": "G260", // Regain
        "registrationofexportforreentry": "G270", // Registration of Export for Reentry
        "registrationofexportshipments": "G280", // Registration of Export Shipments
        "regulatoryfee": "G290", // Regulatory Fee
        "regulatoryrequiredrefund": "G300", // Regulatory required refund
        "reliabilitycharge": "G310", // Reliability Charge
        "relinquishmentcharge": "G320", // Relinquishment Charge
        "reliquidationanti-dumpingduty": "G322", // Reliquidation Anti-Dumping Duty
        "reliquidationcountervailingduty": "G324", // Reliquidation Countervailing Duty
        "reliquidationtaxamount": "G326", // Reliquidation Tax Amount
        "reliquidationtotaldueu.s.customsservice-uscs": "G328", // Reliquidation Total Due U.S. Customs Service (USCS)
        "reliquidationtotalfees": "G329", // Reliquidation Total Fees
        "rentalcharge": "G330", // Rental Charge
        "rentaldeduction": "G340", // Rental Deduction
        "rentsandleases": "G350", // Rents and Leases
        "repackcharge": "G360", // Repack Charge
        "repairatbuyersexpensecharge": "G370", // Repair at Buyers Expense Charge
        "repairatcustomerexpensecharge": "G380", // Repair at Customer Expense Charge
        "repairatgovernmentexpensecharge": "G390", // Repair at Government Expense Charge
        "repair": "G400", // Repair
        "repickup": "G410", // Repickup
        "requestviacanada": "G420", // Request Via Canada
        "researchanddevelopmentfee": "G430", // Research & Development Fee
        "resellersdiscount": "G440", // Resellers Discount
        "residentialdelivery": "G450", // Residential Delivery
        "residentialpick-up": "G460", // Residential Pick-up
        "restockingcharge": "G470", // Restocking Charge
        "restrictedarticlefee": "G480", // Restricted Article Fee
        "retainer": "G490", // Retainer
        "returncargocharge": "G500", // Return Cargo Charge
        "returnablecontainer": "G510", // Returnable Container
        "returnedload": "G520", // Returned Load
        "rework": "G530", // Rework
        "ridingattendantcharge": "G540", // Riding Attendant Charge
        "rockymountainbureau583item1100arbitrarycharge": "G550", // Rocky Mountain Bureau 583 Item 1100 Arbitrary Charge
        "rolloutadjustment": "G560", // Roll Out Adjustment
        "rollrebate": "G570", // Roll Rebate
        "royalties": "G580", // Royalties
        "salvage": "G590", // Salvage
        "same-dayservice": "G600", // Same - Day Service
        "saturdaydelivery": "G610", // Saturday Delivery
        "saturdaypick-upordeliverycharge": "G620", // Saturday Pick-up or Delivery Charge
        "saturdaypick-up": "G630", // Saturday Pick-Up
        "scalechargeunloading": "G640", // Scale Charge Unloading
        "scalecharge": "G650", // Scale Charge
        "scrapallowance": "G660", // Scrap Allowance
        "securitysignatureservice": "G670", // Security Signature Service
        "segregating-sorting": "G680", // Segregating (Sorting)
        "selectcharge": "G690", // Select Charge
        "selfunloader": "G700", // Self Unloader
        "sellerhandcarry": "G710", // Seller Hand Carry
        "serviceassistanceprogramsurcharge": "G720", // Service Assistance Program Surcharge
        "servicecharge-withcashdiscount": "G730", // Service Charge (with Cash Discount)
        "servicecharge": "G740", // Service Charge
        "serviceupgrade": "G750", // Service Upgrade
        "set-up": "G760", // Set-up
        "shearing": "G770", // Shearing
        "sheepfee": "G775", // Sheep Fee
        "shiptostockqualityaudit": "G780", // Ship to Stock Quality Audit
        "shipperloadandcount": "G790", // Shipper Load and Count
        "shipperloadcarriercount": "G800", // Shipper Load Carrier Count
        "shipperloadconsigneeunload": "G810", // Shipper Load Consignee Unload
        "shipperload": "G820", // Shipper Load
        "shipping": "G821", // Shipping
        "shippingandhandling": "G830", // Shipping and Handling
        "shipsidepickup": "G840", // Shipside Pickup
        "shotblasting": "G850", // Shotblasting
        "shrinkallowance": "G860", // Shrink Allowance
        "shrink-wrapcharge": "G870", // Shrink-Wrap Charge
        "shrinkageallowance": "G880", // Shrinkage Allowance
        "singleinvoiceallowance": "G890", // Single Invoice Allowance
        "singlepick-up": "G900", // Single Pick-up
        "singleshipmentfee": "G910", // Single Shipment Fee
        "sleeving": "G920", // Sleeving
        "slipsheetunloadingallowance": "G930", // Slip Sheet Unloading Allowance
        "slipsheet-rail": "G940", // Slip Sheet, Rail
        "slipsheet-truck": "G950", // Slip Sheet, Truck
        "slottingallowance": "G960", // Slotting Allowance
        "smallordercharge": "G970", // Small Order Charge
        "softwaresupportservice": "G980", // Software Support Service
        "sourceinspection": "G990", // Source Inspection
        "garmentsurcharge": "GMST", // Garment Surcharge
        "specialallowance": "H000", // Special Allowance
        "specialbuy": "H010", // Special Buy
        "specialcircustrains": "H020", // Special Circus Trains
        "specialcredit": "H030", // Special Credit
        "specialdelivery": "H040", // Special Delivery
        "specialdetentioncharge": "H050", // Special Detention Charge
        "specialequipmentcharge": "H060", // Special Equipment Charge
        "specialfinishcharge": "H070", // Special Finish Charge
        "specialfreightsupplements": "H080", // Special Freight Supplements
        "specialhandling": "H090", // Special Handling
        "specialmileagemovements": "H100", // Special Mileage Movements
        "specialpackaging": "H110", // Special Packaging
        "specialpermits": "H120", // Special Permits
        "specialpickup": "H130", // Special Pickup
        "specialpumpcharge": "H140", // Special Pump Charge
        "specialsealcharge": "H150", // Special Seal Charge
        "specialservices": "H151", // Special Services
        "specialtestequipmentcharge": "H160", // Special Test Equipment Charge
        "specialtoolingcharge": "H170", // Special Tooling Charge
        "specialtoolingreworkcharge": "H180", // Special Tooling rework charge
        "specialtrainmovement": "H190", // Special Train Movement
        "specialuse": "H200", // Special Use
        "specialvehiclerent": "H210", // Special Vehicle Rent
        "specificduty": "H215", // Specific Duty
        "specificationreview": "H220", // Specification Review
        "splitdelivery": "H230", // Split Delivery
        "splitpick-upatpiercharge": "H240", // Split Pick-Up at Pier Charge
        "splitpick-up": "H250", // Split Pick-up
        "spoolcharge": "H260", // Spool Charge
        "spottingoftrailer": "H270", // Spotting of Trailer
        "spreadercharge": "H280", // Spreader Charge
        "stampfee": "H290", // Stamp Fee
        "stamping": "H300", // Stamping
        "standbycharge": "H310", // Standby Charge
        "statemotorfuel": "H320", // State Motor Fuel
        "statesalescharge": "H330", // State Sales Charge
        "statesurcharge": "H340", // State Surcharge
        "stateormetropolitantransitauthoritysurcharge": "H350", // State/Metropolitan Transit Authority Surcharge
        "steamingcharge": "H360", // Steaming Charge
        "stencilingcharge": "H370", // Stenciling Charge
        "stop-offatpiercharge": "H380", // Stop-off at Pier Charge
        "stop-offcharge": "H390", // Stop-off Charge
        "stopcharge": "H400", // Stopcharge
        "stoppingintransit": "H410", // Stopping In Transit
        "storageintransit": "H420", // Storage In Transit
        "storage": "H430", // Storage
        "straighteningcharge": "H440", // Straightening Charge
        "strapping": "H450", // Strapping
        "streetlampscharge": "H460", // Street lamps charge
        "strippingandsortingandconsolidation": "H470", // Stripping, Sorting, and Consolidation
        "subjecttocooperativeadvertisingallowance": "H480", // Subject to Cooperative Advertising Allowance
        "subjecttotaxonresale": "H490", // Subject To Tax On Resale
        "sufferancewarehousecharge-exportorimport": "H500", // Sufferance Warehouse Charge (Export or Import)
        "sugarfee": "H505", // Sugar Fee
        "sumofaddsanddeductstomakemarketvalue": "H507", // Sum of Adds and Deducts to Make Market Value
        "sundayorholidaypick-upordelivery": "H510", // Sunday or Holiday Pick-up or Delivery
        "superbagcharge": "H520", // Super Bag Charge
        "supervisorcharge": "H530", // Supervisor Charge
        "supplementalduty": "H535", // Supplemental Duty
        "supplementalitems": "H540", // Supplemental Items
        "surcharge": "H550", // Surcharge
        "suretybond": "H551", // Surety Bond
        "swell": "H560", // Swell
        "switchcharge": "H570", // Switch Charge
        "switchingcharge": "H580", // Switching Charge
        "tankcarallowance": "H590", // Tank Car Allowance
        "tankrental": "H600", // Tank Rental
        "tarping": "H605", // Tarping
        "tax-airporttax-destination": "H610", // Tax - Airport Tax, Destination
        "tax-airporttax-origin": "H620", // Tax - Airport Tax, Origin
        "tax-beveragetax": "H625", // Tax - Beverage Tax
        "tax-citysalestax-only": "H630", // Tax - City Sales Tax (Only)
        "tax-excisetax-destination": "H640", // Tax - Excise Tax - Destination
        "tax-excisetax-origin": "H650", // Tax - Excise Tax - Origin
        "tax-federalexcisetax-fet": "H660", // Tax - Federal Excise Tax, FET
        "tax-federalexcisetax-fet-ontires": "H670", // Tax - Federal Excise Tax, FET, on Tires
        "tax-governmental": "H680", // Tax - Governmental
        "tax-handlingchargetax": "H690", // Tax - Handling Charge Tax
        "tax-localtax": "H700", // Tax - Local Tax
        "tax-metropolitantransittax": "H710", // Tax - Metropolitan Transit Tax
        "tax-regulatorytax": "H720", // Tax - Regulatory Tax
        "tax-localsalestax": "H730", // Tax - Local Sales Tax
        "tax-salesanduse": "H740", // Tax - Sales and Use
        "tax-salestax-stateandlocal": "H750", // Tax - Sales Tax (State and Local)
        "tax-statehazardoussubstance": "H760", // Tax - State Hazardous Substance
        "tax-statetax": "H770", // Tax - State Tax
        "tax-superfundexcisetax": "H780", // Tax - Super Fund Excise Tax
        "tax-usetax": "H790", // Tax - Use Tax
        "tax-valueaddedtax-vat": "H800", // Tax - Value Added Tax (VAT)
        "taxcredit": "H806", // Tax Credit
        "taxliability-amortized": "H810", // Tax Liability - Amortized
        "taxliability-onetime": "H820", // Tax Liability - One Time
        "taxonmiscellaneouscharges": "H830", // Tax on Miscellaneous Charges
        "taxontransportation": "H840", // Tax on Transportation
        "tax": "H850", // Tax
        "teafee": "H855", // Tea Fee
        "technologyexchange": "H860", // Technology Exchange
        "telegramchargeback": "H870", // Telegram Chargeback
        "telephone-destination": "H880", // Telephone - Destination
        "telephone-origin": "H890", // Telephone - Origin
        "telephonecharge": "H900", // Telephone Charge
        "temperatureprotection": "H910", // Temperature Protection
        "temporaryallowance": "H920", // Temporary Allowance
        "temporaryvoluntaryallowance": "H930", // Temporary Voluntary Allowance
        "tenderedastruckload": "H935", // Tendered as Truckload
        "terminalcharge": "H940", // Terminal Charge
        "terminaldifferential": "H950", // Terminal Differential
        "terminalservicefee": "H960", // Terminal Service Fee
        "allowance": "H970", // Terms Allowance
        "testorqualificationcharge": "H980", // Test/Qualification Charge
        "testingservicescharge": "H990", // Testing Services Charge
        "hazardouscargoondeck": "HZDT", // Hazardous Cargo on Deck
        "testing": "I000", // Testing
        "thirdpartyallowance": "I010", // Third Party Allowance
        "thirdpartypallets": "I020", // Third Party Pallets
        "throughputallowance": "I030", // Throughput Allowance
        "throughputcontainercharge": "I040", // Throughput Container Charge
        "thruwaycharge": "I050", // Thruway Charge
        "ticketingservice": "I060", // Ticketing Service
        "tobaccoproductsreportcharge": "I070", // Tobacco Products Report Charge
        "tofcservicecharge": "I080", // TOFC Service Charge
        "toolcharge": "I090", // Tool Charge
        "toolingreworkcharge": "I100", // Tooling Rework Charge
        "tooling": "I110", // Tooling
        "toolsforprinting": "I120", // Tools for Printing
        "totalassessorialcharges": "I130", // Total Assessorial Charges
        "totalfees": "I131", // Total Fees
        "totalinvoiceamount": "I132", // Total Invoice Amount
        "totaldueu.s.customsservice-uscs": "I133", // Total Due U.S. Customs Service (USCS)
        "totalinvoiceamount-u.s.dollars": "I134", // Total Invoice Amount, U.S. Dollars
        "totalinvoiceamount-non-u.s.dollars": "I136", // Total Invoice Amount, Non-U.S. Dollars
        "totalmaterialinvoiceamount": "I138", // Total Material Invoice Amount
        "tracinginboundviaothercarriers": "I140", // Tracing Inbound Via Other Carriers
        "tracingservicefee": "I150", // Tracing Service Fee
        "trackstorage": "I160", // Track Storage
        "tradediscount": "I170", // Trade Discount
        "tradein": "I180", // Trade In
        "trailerrentalcharge": "I190", // Trailer Rental Charge
        "transfercharge": "I200", // Transfer Charge
        "transferofladingcharge": "I210", // Transfer of Lading Charge
        "transferredcharges": "I220", // Transferred Charges
        "transit": "I230", // Transit
        "transportationandsetup": "I240", // Transportation And Setup
        "transportationcharge-minimumrate": "I250", // Transportation Charge (Minimum Rate)
        "transportationdirectbilling": "I260", // Transportation Direct Billing
        "transportationthirdpartybilling": "I270", // Transportation Third Party Billing
        "transportationvendorprovided": "I280", // Transportation Vendor Provided
        "trimmingcharge": "I290", // Trimming Charge
        "truckdetention": "I300", // Truck Detention
        "truckloaddiscount": "I310", // Truckload Discount
        "turningcharge": "I320", // Turning Charge
        "two-dayservice": "I330", // Two - Day Service
        "twodoorpickup": "I340", // Two Door Pick Up
        "u.s.vehicles": "I350", // U.S. Vehicles
        "unabsorbedswitching": "I360", // Unabsorbed Switching
        "unitized": "I370", // Unitized
        "unloading-laborcharges": "I380", // Unloading (Labor Charges)
        "unloading": "I390", // Unloading
        "unloadingorreloadingcharge": "I400", // Unloading/Reloading Charge
        "unsaleablemerchandiseallowance": "I410", // Unsaleable Merchandise Allowance
        "unscheduledfee": "I411", // Unscheduled Fee
        "upcharge": "I420", // Up Charge
        "usageplandetailcharge": "I430", // Usage Plan Detail Charge
        "u.s.customsservice-uscs-flatassistamount": "I431", // U.S. Customs Service (USCS) Flat Assist Amount
        "u.s.customsservice-uscs-maximumassistamount": "I432", // U.S. Customs Service (USCS) Maximum Assist Amount
        "usdainspected-stampingcertification": "I440", // USDA Inspected, Stamping Certification
        "use-specialtypeflatcar": "I450", // Use - Special Type Flat Car
        "usechargetoolingorpersonnel": "I460", // Use Charge Tooling/Personnel
        "valuationfee": "I470", // Valuation Fee
        "vehicleorderedbutnotused": "I480", // Vehicle Ordered but Not Used
        "vehicleprepcharge-courtesydelivery": "I490", // Vehicle Prep Charge (Courtesy Delivery)
        "vehicleroadcharge": "I495", // Vehicle Road Charge
        "vendorfreight": "I500", // Vendor Freight
        "ventinginstructions": "I510", // Venting Instructions
        "virginislandtransfercharge": "I520", // Virgin Island Transfer Charge
        "volume-discount": "I530", // Volume Discount
        "voluntarycontributioncharge": "I540", // Voluntary Contribution Charge
        "waitingtime": "I550", // Waiting Time
        "warrisksurcharge": "I560", // War Risk Surcharge
        "warehouse": "I570", // Warehouse
        "warehousing": "I580", // Warehousing
        "warranties": "I590", // Warranties
        "watermelonfee": "I595", // Watermelon Fee
        "waybillandinvoicedistribution": "I600", // Waybill and Invoice Distribution
        "weatherprotection": "I610", // Weather Protection
        "weightverificationcharge": "I620", // Weight Verification Charge
        "wharfageandhandling": "I630", // Wharfage & Handling
        "wharfagecharge": "I640", // Wharfage Charge
        "wideareatelephoneservice-wats-usagecredit": "I650", // Wide Area Telephone Service (WATS) Usage Credit
        "willcallcharge": "I660", // Will Call Charge
        "writtenproofofdelivery": "I670", // Written Proof of Delivery
        "x-raycharge": "I680", // X-ray Charge
        "gratuity": "I690", // Gratuity
        "escrow": "I700", // Escrow
        "payment": "I710", // Payment
        "directproducthandling-dpc": "I720", // Direct Product Handling (DPC)
        "priceadjustmentpercent-pct": "I730", // Price Adjustment Percent (PCT)
        "postdamagedhandling-pdc": "I740", // Post Damaged Handling (PDC)
        "reclamationcenterhandling-chute": "I750", // Reclamation Center Handling (Chute)
        "reclamationsharedresponsibility-srs": "I760", // Reclamation Shared Responsibility (SRS)
        "improperdocumentation": "IDCT", // Improper Documentation
        "landcurrencyadjustmentfactor-20footcontainer": "LC2T", // Land Currency Adjustment Factor - 20 Foot Container
        "landcurrencyadjustmentfactor-40footcontainer": "LC4T", // Land Currency Adjustment Factor - 40 Foot Container
        "percentdifferential-lessthancontainer": "LCLT", // Percent Differential - Less Than Container
        "lessthancontainer": "LECT", // Less Than Container
        "linehaulfromportofdebarkation": "LFDT", // Linehaul from Port of Debarkation
        "linertermsatportofembarkation": "LMDT", // Liner Terms at Port of Embarkation
        "linertermsatportofdebarkation": "LNDT", // Liner Terms at Port of Debarkation
        "linehaulpercentdifferential": "LPDT", // Linehaul Percent Differential
        "liquidateddamages": "LQDT", // Liquidated Damages
        "linehaultoportofembarkation": "LTET", // Linehaul to Port of Embarkation
        "modifiedatmosphere": "MATT", // Modified Atmosphere
        "overheightcontainer": "OCNT", // Over Height Container
        "officesupplies": "OFFA", // Office Supplies
        "ondeckbreakbulkdifferential": "OODT", // On Deck Break Bulk Differential
        "othermiscellaneousearningoradditive": "OTHR", // Other Miscellaneous Earning or Additive
        "overwidthcontainer": "OWCT", // Over Width Container
        "stuffingcharge": "PRST", // Stuffing Charge
        "payrolltaxes": "PTAX", // Payroll Taxes
        "privateownedvehicleprocessing": "PVPT", // Private Owned Vehicle Processing
        "personalproperty-member": "R020", // Personal Property, Member
        "personalproperty-spouse": "R030", // Personal Property, Spouse
        "porthandlingandunloading": "R040", // Port Handling and Unloading
        "packingandcratingandhandlingcharge": "R060", // Packing, Crating, and Handling Charge
        "packingandcratingandhandlingandtransportationcharge": "R080", // Packing, Crating, Handling, and Transportation Charge
        "railheadhandling": "RDHT", // Railhead Handling
        "reefermaintenance": "RFMT", // Reefer Maintenance
        "reefercargopercentdifferential": "RPDT", // Reefer Cargo Percent Differential
        "respotting": "RSTT", // Respotting
        "singlefactororiginationordestination": "SFBT", // Single Factor Origination/Destination
        "singlefactororiginationorportofdebarkation": "SFDT", // Single Factor Origination/Port of Debarkation
        "singlefactorportofembarkationordestination": "SFET", // Single Factor Port of Embarkation/Destination
        // "strippingandsortingandconsolidation": "SSCT", // Stripping, Sorting and Consolidation
        "polelashingequipment-ple-surcharge": "SSUT", // Pole Lashing Equipment (PLE) Surcharge
        "stopoffatdestination": "STDT", // Stopoff at Destination
        "stuffing": "STFT", // Stuffing
        "stopoffatorigination": "STOT", // Stopoff at Origination
        "terminalhandlingcharges": "TERT", // Terminal Handling Charges
        "vancleaning": "VCLT", // Van Cleaning
        "wharfage-breakbulk": "WBBT", // Wharfage - Breakbulk
        "wharfage-container": "WCFT", // Wharfage - Container
        "wastedorfutiletrip": "WFTT", // Wasted/Futile Trip
        "warriskcrewinsurance": "WRBT", // War Risk Crew Insurance
        "warriskinsurance": "WRIT", // War Risk Insurance
        // "mutuallydefined": "ZZZZ", // Mutually Defined


    }
}