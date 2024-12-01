/* eslint-disable no-undef */
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { ConvertPattern, X12, XML, XMLPath, versionKeys } from "../../cat_const";
import { ConvertErr, EdiElement, EdiSegment } from "../../new_parser/entities";
import { XmlConverterBase } from "../xmlConverterBase";
import { DOMParser } from "@xmldom/xmldom";
import xpath = require('xpath');
import { EdiUtils } from "../../utils/ediUtils";
import { MAPStoXML } from "../converterBase";

/**
 * Condition:										
 *
 */
export class Cvt_Invoice_INVOIC extends XmlConverterBase {
    protected _convertErrs: ConvertErr[];
    private _isHeaderInvoice: boolean = false;
    private _isTaxInLine: boolean = false;
    private _vPurpose;
    private _vBGM01;
    protected _RFF_VA102: string; // I don't know how to use, just store
    protected _RFF_AHR102: string; // I don't know how to use, just store
    protected _arrExcludeZZZ = ['LegalStatus', 'LegalCapital', 'invoiceSubmissionMethod', 'paymentMethod', 'supplierCommercialCredentials'
        , 'supplierCommercialIdentifier', 'supplierVatID', 'DeliveryNoteNumber', 'deliveryNoteDate', 'deliveryDate'
        , 'documentName', 'invoiceSourceDocument', 'buyerVatID', 'TaxExchangeRate'];
    // only for exclude from RFF ZZZ, usually because it's already coverted to FTX
    protected _arrExcludeRFF = ['punchinItemFromCatalog'];
    private _fromXMLCheck() {
        this._convertErrs = []; // clear previouse check results
    }

    public fromXML(vsdoc: vscode.TextDocument): string {

        this._init(vsdoc);
        // this._fromXMLCheck();
        // if (this._hasConvertErr()) {
        //     return this._renderConvertErr();
        // }

        this._UNA();
        this._UNB('INVOIC', true);

        const nRequestHeader = this._rn('/InvoiceDetailRequest/InvoiceDetailRequestHeader');
        const nInvReq = this._rn('/InvoiceDetailRequest');
        const nInvDetailSummary = this._e('InvoiceDetailSummary', nInvReq);

        // even the multiple OrderRefs are referencing same order, we still consider it as Summary Invoice
        let nOrderRefs = this._es('InvoiceDetailOrder/InvoiceDetailOrderInfo', nInvReq);

        // 381	creditMemo	"All the quantities and amount values in cXML need to be converted to negative if not already provided as -ve sign in EDI.
        //  =>
        // /InvoiceDetailHeaderIndicator/@isHeaderInvoice=""yes"" "
        // 383	debitMemo	
        //  =>
        // /InvoiceDetailHeaderIndicator/@isHeaderInvoice=""yes"" "
        let vIsHeaderInvoice = this._v('InvoiceDetailHeaderIndicator/@isHeaderInvoice', nRequestHeader);
        if (vIsHeaderInvoice == 'yes') {
            this._isHeaderInvoice = true;
        }
        let vIsTaxInLine = this._v('InvoiceDetailLineIndicator/@isTaxInLine', nRequestHeader);
        if (vIsTaxInLine == 'yes') {
            this._isTaxInLine = true;
        }

        // let sShipmentID = this._v('@shipmentID', nRequestHeader);
        // let sOperation = this._v('@operation', nRequestHeader);
        // let sType = this._v('@shipmentType', nRequestHeader);

        // UNH
        let UNH = this._initSegEdi('UNH', 2);
        this._setV(UNH, 1, this._sUniqueRefGP); // Sequential counter throughout message (UNB) Starting at "1"
        this._setV(UNH, 201, 'INVOIC'); // 65
        this._setV(UNH, 202, 'D');
        this._setV(UNH, 203, '96A');
        this._setV(UNH, 204, 'UN');

        // BGM
        this._vPurpose = this._v('@purpose', nRequestHeader);
        let vInvoiceID = this._v('@invoiceID', nRequestHeader);
        let vOperation = this._v('@operation', nRequestHeader);
        let vIsInfoOnly = this._v('@isInformationOnly', nRequestHeader);
        let BGM = this._initSegEdi('BGM', 4);
        if (this._vPurpose.toLowerCase() == 'standard' && nOrderRefs.length > 1) {
            this._vBGM01 = '385'; // Summary Invoice
        } else {
            this._vBGM01 = this._mci(MAPS.mapBGM1001, this._vPurpose);

        }
        this._setV(BGM, 101, this._vBGM01);
        this._setV(BGM, 104, this._v('Extrinsic[@name="documentName"]', nRequestHeader));
        this._setV(BGM, 2, vInvoiceID);

        if (vOperation.toLowerCase() == 'new' && vIsInfoOnly == 'yes') {
            this._setV(BGM, 3, '31');
        } else {
            this._setV(BGM, 3, this._mci(MAPS.mapBGM1225, vOperation));
        }

        // DTM invoiceDate, Should be "3" or "137"
        this._DTM_EDI(nRequestHeader, '@invoiceDate', '137');

        // DTM 35 deliveryDate
        this._DTM_EDI(nRequestHeader, 'Extrinsic[@name="deliveryDate"]', '35');

        // DTM 110 shippingDate
        this._DTM_EDI(nRequestHeader, 'InvoiceDetailShipping/@shippingDate', '110');

        // DTM 194/206, startDate and endDate
        // I don't map to DTM+263 because seems there is no real case
        let vStartDate = this._v('Period/@startDate', nRequestHeader);
        let vEndDate = this._v('Period/@endDate', nRequestHeader);
        if (vStartDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '194');
            this._setV(DTM, 102, Utils.dateStr304TZ(vStartDate, 'GM'));
            this._setV(DTM, 103, '304');
        }
        if (vEndDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '206');
            this._setV(DTM, 102, Utils.dateStr304TZ(vEndDate, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // PAI
        let vPaymentMethod = this._v('Extrinsic[@name="paymentMethod"]', nRequestHeader);
        if (vPaymentMethod) {
            let PAI = this._initSegEdi('PAI', 1);
            this._setV(PAI, 103, this._mci(MAPS.mapPAI4461, vPaymentMethod));
        }

        // FTX AAI
        let nComments = this._es('Comments', nRequestHeader);
        let sCommentsLang: string;
        for (let n of nComments) {
            let sComments = this._v('', n);
            sCommentsLang = this._v('@xml:lang', n);
            if (sComments) {
                let FTX = this._initSegEdi('FTX', 5);
                this._setV(FTX, 1, 'AAI');
                this._FTX(FTX, 1, sComments);
                this._setV(FTX, 5, sCommentsLang);
            }
        }

        // FTX REG
        let v401 = this._v('InvoicePartner/Contact [@role="from"]/Name', nRequestHeader);
        let v402 = this._v('Extrinsic [@name="LegalStatus"]', nRequestHeader);
        if (!v402) {
            v402 = this._v('InvoicePartner/Contact [@role="from"]/Extrinsic [@name="LegalStatus"]', nRequestHeader)
        }
        let v403 = this._v('Extrinsic [@name="LegalCapital"]/Money', nRequestHeader)
            + ' ' + this._v('Extrinsic [@name="LegalCapital"]/Money/@currency', nRequestHeader)

        if (!v403) {
            v403 = this._v('InvoicePartner/Contact [@role="from"]/Extrinsic [@name="LegalCapital"]/Money', nRequestHeader)
                + this._v('InvoicePartner/Contact [@role="from"]/Extrinsic [@name="LegalCapital"]/Money/@currency', nRequestHeader)
        }
        if (v402) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'REG');
            this._setTV(FTX, 401, v401.substring(0, 70));
            this._setV(FTX, 402, v402);
            this._setV(FTX, 403, v403);
        }

        // FTX TXD
        let vDesc = this._vt2('Tax/Description', nInvDetailSummary);
        if (vDesc) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'TXD');
            this._splitStr(FTX, vDesc, 4, 1, 5, 70);
            this._setV(FTX, 5,
                this._v('Tax/Description/@xml:lang', nInvDetailSummary));
        }

        // FTX TXD 4
        let vTriangularTransactionLawReference = this._v('Tax/TaxDetail/TriangularTransactionLawReference', nInvDetailSummary);
        if (vTriangularTransactionLawReference) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'TXD');
            this._setV(FTX, 2, '4');
            this._splitStr(FTX, vDesc, 4, 1, 5, 70);
            this._setV(FTX, 5,
                this._v('Tax/TaxDetail/TriangularTransactionLawReference/@xml:lang', nInvDetailSummary));
        }

        // FTX ZZZ
        let nExtrins = this._es(XML.Extrinsic, nRequestHeader);
        this._FTX_ZZZ(nExtrins, this._arrExcludeZZZ);

        // SG1 Group 1
        let nInvoiceDetailOrders = this._es('InvoiceDetailOrder', nInvReq);
        let nHeadOrder;
        if (nInvoiceDetailOrders[0]) {
            nHeadOrder = nInvoiceDetailOrders[0];
            let nOrderInfo = this._e('InvoiceDetailOrderInfo', nHeadOrder);
            if (this._vBGM01 != '385') {
                // RFF
                let RFF = this._initSegEdi('RFF', 2);
                this._setV(RFF, 101, 'ON');
                this._setV(RFF, 102, this._v('OrderReference/@orderID', nOrderInfo));
                // DTM orderDate
                this._DTM_EDI(nOrderInfo, 'OrderReference/@orderDate', '4');

                // RFF CT
                let sAgreementID = this._v('MasterAgreementReference/@agreementID', nOrderInfo);
                let sAgreementType = this._v('MasterAgreementReference/@agreementType', nOrderInfo);
                if (sAgreementID) {
                    let RFF = this._initSegEdi('RFF', 1);
                    this._setV(RFF, 101, 'CT');
                    this._setV(RFF, 102, sAgreementID);
                    if (sAgreementType && sAgreementType == 'scheduling_agreement') {
                        this._setV(RFF, 103, '1');
                    }

                    // DTM agreementDate
                    this._DTM_EDI(nOrderInfo, 'MasterAgreementInfo/@agreementDate', '126');
                } // end if sAgreementID
            }

        } // end if nInvoiceDetailOrders[0]

        // RFF IV
        this._RFF_KV_EDI('IV', this._v('@invoiceID', nRequestHeader));
        // DTM invoiceDate for RFF IV, Should be "3" or "171"
        this._DTM_EDI(nRequestHeader, '@invoiceDate', '3');
        // RFF OI
        this._RFF_KV_EDI('OI', this._v('InvoiceIDInfo/invoiceID', nRequestHeader));
        // DTM invoiceDate for RFF OI
        this._DTM_EDI(nRequestHeader, 'InvoiceIDInfo/@invoiceDate', '3');
        // RFF MA
        this._RFF_KV_EDI('MA', this._v('ShipNoticeIDInfo/@shipNoticeID', nRequestHeader));
        // DTM shipNoticeDate
        this._DTM_EDI(nRequestHeader, 'ShipNoticeIDInfo/@shipNoticeDate', '111');
        // RFF DQ
        this._RFF_KV_EDI('DQ', this._v('Extrinsic[@name="DeliveryNoteNumber"]', nRequestHeader));
        // DTM deliveryNoteDate
        this._DTM_EDI(nRequestHeader, 'Extrinsic[@name="deliveryNoteDate"]', '124');
        // RFF CR
        this._RFF_KV_EDI('CR', this._v('IdReference[@domain="customerReferenceID"]/@identifier', nRequestHeader));
        // DTM customerReferenceDate
        this._DTM_EDI(nRequestHeader, 'IdReference[@domain="customerReferenceDate"]/@identifier', '171');

        if (nHeadOrder) {
            let nRef = this._e('InvoiceDetailReceiptInfo/ReceiptReference', nHeadOrder);
            // RFF ALO
            this._RFF_KV_EDI('ALO', this._v('@receiptID', nRef));
            // DTM receiptDate
            this._DTM_EDI(nRef, '@receiptDate', '171');
        }

        // RFF AGA
        this._RFF_KV_EDI('AGA', this._v('PaymentProposalIDInfo/@paymentProposalID', nRequestHeader));
        // RFF UC
        this._RFF_KV_EDI('UC', this._v('Extrinsic[@name="ultimateCustomerReferenceID"]', nRequestHeader));
        // RFF PK
        this._RFF_KV_EDI('PK', this._v('ShipNoticeIDInfo/IdReference[@domain="packListID"]/@identifier', nRequestHeader));
        // RFF AEG
        let nTo = this._prn('/cXML/Header/To');
        this._RFF_KV_EDI('AEG', this._v('Credential[@domain="SystemID"]/Identity', nTo));
        // RFF ZZZ
        let nExtrinscs = this._es('Extrinsic', nRequestHeader);
        this._RFF_ZZZ(nExtrinscs);
        // RFF VA, cannot use common function for 104
        let sDesc1 = this._v('Tax/TaxDetail/Description', nInvDetailSummary);
        let sDesc2 = this._v('InvoiceHeaderModifications/Modification/Tax/TaxDetail/Description', nInvDetailSummary);
        let sDesc = sDesc1 ?? sDesc2;
        if (sDesc) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'VA');
            this._setTV(RFF, 104, sDesc);
        }

        // DTM taxPointDate
        let sTaxPointDate1 = this._v('Tax/TaxDetail/@taxPointDate', nInvDetailSummary);
        let sTaxPointDate2 = this._v('InvoiceHeaderModifications/Modification/Tax/TaxDetail/@taxPointDate', nInvDetailSummary);
        let sTaxPointDate = sTaxPointDate1 ?? sTaxPointDate2;
        if (sTaxPointDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '131');
            this._setV(DTM, 102, Utils.dateStr304TZ(sTaxPointDate));
            this._setV(DTM, 103, '304');
        }

        // DTM paymentDate
        let spaymentDate1 = this._v('Tax/TaxDetail/@paymentDate', nInvDetailSummary);
        let spaymentDate2 = this._v('InvoiceHeaderModifications/Modification/Tax/TaxDetail/@paymentDate', nInvDetailSummary);
        let spaymentDate = spaymentDate1 ?? spaymentDate2;
        if (spaymentDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '140');
            this._setV(DTM, 102, Utils.dateStr304TZ(spaymentDate));
            this._setV(DTM, 103, '304');
        }

        // RFF AHR
        let vTaxRegime = this._v('Tax/TaxDetail/TaxRegime', nInvDetailSummary);
        if (vTaxRegime) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'AHR');
            this._setV(RFF, 104, vTaxRegime);
        }

        // SG2 Group 2
        // NAD
        // let nContacts = this._es('InvoicePartner/Contact', nRequestHeader);
        let nIPs = this._es('InvoicePartner', nRequestHeader);
        let nWireReceivingBank = this._e('InvoicePartner [Contact/@role="wireReceivingBank"]', nRequestHeader);
        let nCorrespondentBank = this._e('InvoicePartner [Contact/@role="receivingCorrespondentBank"]', nRequestHeader);
        let bFIIDone = false;
        for (let nIP of nIPs) {
            let nContact = this._e('Contact', nIP);
            let vRole = this._v('@role', nContact);
            if (vRole == 'wireReceivingBank' || vRole == 'receivingCorrespondentBank') {
                // we already saved it for later use
                continue;
            }

            let vMappedRole = this._mci(MAPS.mapNAD3035, vRole) ?? 'ZZZ';
            this._NAD(vMappedRole, nContact);
            // LOC
            let vSupplierCommercialCredentials = this._v('Extrinsic[@name="supplierCommercialCredentials"]', nRequestHeader);
            if (vSupplierCommercialCredentials && vRole == 'from') {
                let LOC = this._initSegEdi('LOC', 2);
                this._setV(LOC, 1, '89');
                this._setV(LOC, 204, this._v('Extrinsic [@name="supplierCommercialCredentials"]', nRequestHeader));
            }

            // FII
            // I just don't like to put FII under 'from' or 'supplierCorporate', seems diffrent to MS
            if (!bFIIDone && (vRole == 'remitTo')) {
                this._FII(nWireReceivingBank, nCorrespondentBank);
                bFIIDone = true;
            }
            // RFF ALL
            let nRefs = this._es('IdReference', nIP);
            for (let nRef of nRefs) {
                let vDomain = this._v('@domain', nRef);
                if (this._mei(MAPS.mapRFF1153, vDomain)) {
                    this._RFF_KV_EDI(this._mci(MAPS.mapRFF1153, vDomain), this._v('@identifier', nRef));
                }
            }
            // RFF AHR
            this._RFF_KV_EDI('AHR', this._v('IdReference[@domain="taxID"]/@identifier', nContact));
            // RFF ALT
            this._RFF_KV_EDI('ALT', this._v('IdReference[@domain="gstID"]/@identifier', nContact));

            // SG5 Group 5
            if (vRole == 'requester') {
                // CAT COM
                this._CTA_COM('BF', '', this._v('Name', nContact), nContact);
            } else {
                let vName = this._v('Phone/@name', nContact);
                if (!vName) {
                    vName = this._v('Fax/@name', nContact);
                }
                if (!vName) {
                    vName = this._v('Email/@name', nContact);
                }
                this._CTA_COM('ZZZ', vName, vName, nContact);
            }


        } // end loop nIPs

        // NAD InvoiceDetailShipping
        let nInvoiceDetailShipping = this._e('InvoiceDetailShipping', nRequestHeader);
        let nContactsShipping = this._es('Contact', nInvoiceDetailShipping);
        for (let nContact of nContactsShipping) {
            let vRole = this._v('@role', nContact);
            let vMappedRole = this._mci(MAPS.mapNAD3035Shipping, vRole);
            if (!vMappedRole) {
                continue;
            }
            // NAD
            this._NAD(vMappedRole, nContact);
            // RFF
            let nRefs = this._es('IdReference', nInvoiceDetailShipping);
            for (let nRef of nRefs) {
                let vDomain = this._v('@domain', nRef);
                if (this._mei(MAPS.mapRFF1153, vDomain)) {
                    this._RFF_KV_EDI(this._mci(MAPS.mapRFF1153, vDomain), this._v('@identifier', nRef));
                }
            }
            // RFF CN
            // Don't move _initSegEdi to outside, because we may not need to create it.
            let RFF;
            switch (vRole) {
                case 'carrierCorporate':
                    let nCarrierIdentifiers = this._es('CarrierIdentifier', nInvoiceDetailShipping);
                    for (let n of nCarrierIdentifiers) {
                        RFF = this._initSegEdi('RFF', 1);
                        this._setV(RFF, 101, 'CN');
                        this._setV(RFF, 102, this._v('', n));
                        this._setV(RFF, 104, this._v('@domain', n));
                    }
                    break;
                case 'shipFrom':
                case 'shipTo':
                    let nShipmentIdentifiers = this._es('ShipmentIdentifier', nInvoiceDetailShipping);
                    for (let n of nShipmentIdentifiers) {
                        RFF = this._initSegEdi('RFF', 1);
                        this._setV(RFF, 101, 'CN');
                        this._setV(RFF, 102, this._v('', n));
                        this._setV(RFF, 104, this._v('@domain', n));

                        // DTM
                        this._DTM_EDI(n, '@trackingNumberDate', '89');
                    }
                    break;
            } // end switch vRole

            let vName = this._v('Phone/@name', nContact);
            if (!vName) {
                vName = this._v('Fax/@name', nContact);
            }
            if (!vName) {
                vName = this._v('Email/@name', nContact);
            }
            this._CTA_COM('ZZZ', vName, vName, nContact);
        } // end loop nContactsShipping

        // SG6 Group 6
        // Used for HEADER TAX informations. 
        // If line level tax apply, SG50 is used instead to support different tax rates. 
        // For special use cases, SG6 and SG50 can be used both (See C533/5289 comments)
        // this._Summary_Tax(nInvDetailSummary);

        // SG7 Group 7
        // CUX not need for now
        let arrAlt: string[] = [];
        let vDefaultCurr = this._v('SubtotalAmount/Money/@currency', nInvDetailSummary) ?? 'USD';
        arrAlt.push(this._v('SubtotalAmount/Money/@alternateCurrency', nInvDetailSummary));
        arrAlt.push(this._v('SpecialHandlingAmount/Money/@alternateCurrency', nInvDetailSummary))
        arrAlt.push(this._v('ShippingAmount/Money/@alternateCurrency', nInvDetailSummary));
        arrAlt.push(this._v('InvoiceDetailDiscount/Money/@alternateCurrency', nInvDetailSummary));
        let vDefaultAltCurr = arrAlt.find(str => str.trim() !== "");
        let CUX = this._initSegEdi('CUX', 3);
        this._setV(CUX, 101, '2');
        this._setV(CUX, 102, vDefaultCurr);
        this._setV(CUX, 103, '4');
        if (vDefaultAltCurr) {
            this._setV(CUX, 201, '3');
            this._setV(CUX, 202, vDefaultAltCurr);
            this._setV(CUX, 203, '7');
        }
        this._setV(CUX, 3, this._v('Extrinsic [@name="TaxExchangeRate"]', nRequestHeader));

        // SG8 Group 8
        let nPaymentTerms = this._es('PaymentTerm', nRequestHeader);
        for (let nPayT of nPaymentTerms) {
            // PAT
            this._SG8_PAT(nRequestHeader, nPayT);
            // DTM 265
            this._DTM_EDI(nPayT, 'Extrinsic [@name="penaltyDueDate"]', '265');
            // DTM 12
            this._DTM_EDI(nPayT, 'Extrinsic [@name="discountDueDate"]', '12');
            // DTM 13
            this._DTM_EDI(nPayT, 'Extrinsic [@name="netDueDate"]', '13');
            // DTM 209
            this._DTM_EDI(nPayT, 'Extrinsic [@name="valueDate"]', '209');
            // PCD
            let vDiscountPercent = this._v('Discount/DiscountPercent/@percent', nPayT);
            if (vDiscountPercent) {
                let PCD = this._initSegEdi('PCD', 1);

                if (vDiscountPercent.startsWith('-')) {
                    this._setV(PCD, 101, '15');
                } else {
                    this._setV(PCD, 101, '12');
                }
                this._setV(PCD, 102, vDiscountPercent);
                this._setV(PCD, 103, '13');
            }
            // MOA Discount
            this._MOA(nPayT, 'Discount/DiscountAmount/Money', '52');

        } // end loop nPaymentTerms

        // SG12 Group 12
        // TOD
        let vIncoTerms = this._v('Extrinsic [@name="incoTerms"]', nRequestHeader);
        if (vIncoTerms) {
            let TOD = this._initSegEdi('TOD', 3);
            this._setV(TOD, 301, vIncoTerms);
        }

        // SG15 Group 15
        // ALC
        let nMods = this._es('InvoiceHeaderModifications/Modification', nInvDetailSummary);
        for (let nMod of nMods) {
            this._SG15_Modifications(nMod);
        } // end loop nMods

        // SG15 Group 15 /InvoiceDetailRequest/InvoiceDetailSummary/InvoiceDetailDiscount/…
        let nInvoiceDetailDiscount = this._e('InvoiceDetailDiscount', nInvDetailSummary);
        if (nInvoiceDetailDiscount) {
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'A');
            this._setV(ALC, 501, 'DI');

            // SG18 Group 18
            // PCD
            let PCD = this._initSegEdi('PCD', 1);
            this._setV(PCD, 101, '12');
            this._setV(PCD, 102, this._v('@percentageRate', nInvoiceDetailDiscount));
            this._setV(PCD, 103, '13');
            // MOA 52 4
            this._MOA(nInvoiceDetailDiscount, 'Money', '52');

            // MOA 52 7
            this._MOA_Alt(nInvoiceDetailDiscount, 'Money', '52');

        } // end if nInvoiceDetailDiscount

        // SG15 Group 15 ShippingAmount
        let nShippingAmount = this._e('ShippingAmount', nInvDetailSummary);
        if (nShippingAmount) {
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'C');
            this._setV(ALC, 501, 'SAA');
            // SG19 Group 19
            // MOA 23 4
            this._MOA(nShippingAmount, 'Money', '23');

            // MOA 23 7
            this._MOA_Alt(nShippingAmount, 'Money', '23');

            // TAX
            let nTaxDetail = this._e('Tax/TaxDetail [@purpose="shippingTax"]', nInvDetailSummary)
            if (nTaxDetail) {
                this._TaxDetail(nTaxDetail, false);
            } // end if nTaxDetail
        } // end if nShippingAmount
        // SG15 Group 15 /InvoiceDetailRequest/InvoiceDetailSummary/SpecialHandlingAmount/…
        let nSpecialHandlingAmount = this._e('SpecialHandlingAmount', nInvDetailSummary);
        if (nSpecialHandlingAmount) {
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'C');
            this._setV(ALC, 501, 'SH');
            let vDesc = this._v('Description', nSpecialHandlingAmount);
            this._setV(ALC, 504, vDesc.substring(0, 35));
            if (vDesc.length > 35) {
                this._setV(ALC, 505, vDesc.substring(35));
            }
            // SG19 Group 19
            // MOA 23 4
            this._MOA(nSpecialHandlingAmount, 'Money', '23');

            // MOA 23 7
            this._MOA_Alt(nSpecialHandlingAmount, 'Money', '23');

            let nTaxDetail = this._e('Tax/TaxDetail [@purpose="specialHandlingTax"]', nInvDetailSummary)
            if (nTaxDetail) {
                this._TaxDetail(nTaxDetail, false);
            } // end if nTaxDetail

        } // end if nSpecialHandlingAmount

        // SG25 Group 25
        // Regular and Summary Invoice => map to /InvoiceDetailRequest/InvoiceDetailOrder/[ InvoiceDetailItem | InvoiceDetailServiceItem]/                  
        // Header Invoice => map to /InvoiceDetailRequest/[InvoiceDetailHeaderOrder | InvoiceDetailOrderSummary]]																						
        // Regular item => map to /InvoiceDetailRequest/InvoiceDetailOrder/InvoiceDetailItem [INDICATOR => LIN C212/7143="PL"]              
        // Service item => map to /InvoiceDetailRequest/InvoiceDetailOrder/InvoiceDetailServiceItem [INDICATOR => LIN C212/7143="MP"]           									

        // SG25 Group 25
        let iItemCNT = 0;
        if (this._isHeaderInvoice) {
            this._headerInvoice(this._e('InvoiceDetailHeaderOrder', nInvReq));
        } else {
            for (let nOrder of nInvoiceDetailOrders) {
                let nItems = this._es('InvoiceDetailItem', nOrder);
                let nServiceItems = this._es('InvoiceDetailServiceItem', nOrder);
                if (nItems) {
                    iItemCNT += nItems.length;
                } else {
                    iItemCNT += nServiceItems.length;
                }
                for (let nItem of nItems) {
                    this._item(true, nItem, nRequestHeader, nOrder);
                };
                for (let nItem of nServiceItems) {
                    this._item(true, nItem, nRequestHeader, nOrder);
                };
            }
        }

        // UNS
        let UNS = this._initSegEdi('UNS', 1);
        this._setV(UNS, 1, 'S');
        // CNT
        let CNT = this._initSegEdi('CNT', 1);
        this._setV(CNT, 101, '2');
        this._setV(CNT, 102, iItemCNT.toString());

        // SG48
        // SubtotalAmount Should be "79" or "289" 
        this._sumAmount('SubtotalAmount', '79', nInvDetailSummary);
        // SpecialHandlingAmount
        this._sumAmount('SpecialHandlingAmount', '299', nInvDetailSummary);
        // ShippingAmount
        this._sumAmount('ShippingAmount', '144', nInvDetailSummary);
        // GrossAmount
        this._sumAmount('GrossAmount', '128', nInvDetailSummary);
        // TotalCharges
        this._sumAmount('TotalCharges', '259', nInvDetailSummary);
        // TotalAllowances
        this._sumAmount('TotalAllowances', '260', nInvDetailSummary);
        // TotalAmountWithoutTax Should be "125" or "ZZZ"
        this._sumAmount('TotalAmountWithoutTax', 'ZZZ', nInvDetailSummary);
        // NetAmount
        this._sumAmount('NetAmount', '77', nInvDetailSummary);
        // DepositAmount
        this._sumAmount('DepositAmount', '113', nInvDetailSummary);
        // DueAmount
        this._sumAmount('DueAmount', '9', nInvDetailSummary);
        // Tax
        this._sumAmount('Tax', '124', nInvDetailSummary);

        // SG50
        this._Summary_Tax(nInvDetailSummary);

        // UNT
        let iSegCnt = this._segs.length - 1; // before creating UNT and exclude UNA
        let UNT = this._initSegEdi('UNT', 2);
        this._setV(UNT, 1, iSegCnt.toString()); // Control count of number of segments in a message
        this._setV(UNT, 2, this._sUniqueRefGP); // Unique message reference assigned by the sender

        // UNZ
        let UNZ = this._initSegEdi('UNZ', 2);
        this._setV(UNZ, 1, '1'); // Count either of the number of messages in an interchange
        this._setV(UNZ, 2, this._sUniqueRefIC); // Unique reference assigned by the sender to an interchange.

        this._tidySegCascade();
        const output = this._segs.join(constants.ediDocument.lineBreak);
        return output;
    }

    private _Summary_Tax(nInvDetailSummary: Element) {
        let vTaxCategory = this._v('Tax/TaxDetail/@category', nInvDetailSummary);
        let vPurpose = this._v('Tax/TaxDetail/@purpose', nInvDetailSummary);
        if (vTaxCategory) {
            let TAX = this._initSegEdi('TAX', 7);
            if (vPurpose == 'tax') {
                this._setV(TAX, 1, '7');
            } else {
                this._setV(TAX, 1, '5');
            }
            this._setV(TAX, 201, this._mci(MAPS.mapTAX5153, vTaxCategory));
            this._setV(TAX, 204, this._v('Tax/TaxDetail/TaxLocation', nInvDetailSummary));
            let isTriangular = this._v('Tax/TaxDetail/@isTriangularTransaction', nInvDetailSummary);
            if (isTriangular == 'yes') {
                this._setV(TAX, 301, 'TT');
            }
            this._setV(TAX, 4, this._v('Tax/TaxDetail/TaxableAmount/Money', nInvDetailSummary));
            this._setV(TAX, 501, this._v('Tax/TaxDetail/@taxRateType', nInvDetailSummary));
            this._setV(TAX, 504, this._v('Tax/TaxDetail/@percentageRate', nInvDetailSummary));
            let vExemptDetail = this._v('Tax/TaxDetail/@exemptDetail', nInvDetailSummary);
            let vExemptType = this._v('Extrinsic[@name="exemptType"]', nInvDetailSummary);
            let vMappedExempt;
            if (vExemptDetail == 'exempt') {
                vMappedExempt = 'E';
            } else if (vExemptDetail == 'ZeroRated') {
                vMappedExempt = 'Z';
            } else if (vExemptType == 'Mixed') {
                vMappedExempt = 'A';
            } else if (vExemptType == 'ZeroRated') {
                vMappedExempt = 'S';
            } else {
                vMappedExempt = '';
            }
            this._setV(TAX, 6, vMappedExempt);
            // Max Length is 3, always too long ...
            let vDesc = this._v('Tax/TaxDetail/Description', nInvDetailSummary);
            if (vDesc) {
                this._setTV(TAX, 7, vDesc.trim().substring(0,20));
            }
        }
    }

    private _FII(nWireReceivingBank: Element, nCorrespondentBank: Element) {
        for (let nIP_FII of [nWireReceivingBank, nCorrespondentBank]) {
            if (!nIP_FII) {
                continue;
            }
            let nContact = this._e('Contact', nIP_FII);
            let vRole_FII = this._v('@role', nContact);

            let nIBanIDs = this._es('IdReference [@domain="ibanID"]', nIP_FII);
            let nISwifitIDs = this._es('IdReference [@domain="swiftID"]', nIP_FII);
            let vAccountID = this._v('IdReference [@domain="accountID"]/@identifier', nIP_FII);
            let vBankCode = this._v('IdReference [@domain="bankCode"]/@identifier', nIP_FII);
            let i = 0;
            let iTotalLines = nIBanIDs.length;
            for (let nIBanID of nIBanIDs) {
                let vIBanID = this._v('@identifier', nIBanID);
                let vSwiftID = this._v('@identifier', nISwifitIDs[i]);
                if (i == 0) {
                    let FII = this._initSegEdi('FII', 4);
                    if (vRole_FII == 'wireReceivingBank') {
                        this._setV(FII, 1, 'RB');
                    } else {
                        this._setV(FII, 1, 'I1');
                    }
                    this._setV(FII, 201, vIBanID);
                    if (iTotalLines == 1) {
                        // merge to one FII
                        this._setV(FII, 202, this._v('IdReference [@domain="accountName"]/@identifier', nIP_FII));
                        this._setV(FII, 203, this._v('IdReference [@domain="accountType"]/@identifier', nIP_FII));
                    }
                    this._setV(FII, 301, vSwiftID);
                    this._setV(FII, 302, '25');
                    this._setV(FII, 303, '17');  // "swiftID" @identifier> [If C088/3055="17" or "5"]
                    if (iTotalLines == 1) {
                        // Merge to one FII
                        this._setV(FII, 307, this._v('IdReference [@domain="branchName"]/@identifier', nIP_FII));
                    }
                    this._setV(FII, 4, this._v('IdReference [@domain="bankCountryCode"]/@identifier', nIP_FII));
                }
                if (i == 1) {
                    let FII = this._initSegEdi('FII', 4);
                    if (vRole_FII == 'wireReceivingBank') {
                        this._setV(FII, 1, 'RB');
                    } else {
                        this._setV(FII, 1, 'I1');
                    }
                    this._setV(FII, 201, vIBanID);
                    this._setV(FII, 202, this._v('IdReference [@domain="accountName"]/@identifier', nIP_FII));
                    this._setV(FII, 203, this._v('IdReference [@domain="accountType"]/@identifier', nIP_FII));
                    this._setV(FII, 301, vSwiftID);
                    this._setV(FII, 302, '25');
                    this._setV(FII, 303, '5'); // "swiftID" @identifier> [If C088/3055="17" or "5"]
                    this._setV(FII, 307, this._v('IdReference [@domain="branchName"]/@identifier', nIP_FII));
                    this._setV(FII, 4, this._v('IdReference [@domain="bankCountryCode"]/@identifier', nIP_FII));
                    this._RFF_KV_EDI('PY', vAccountID);
                }
                i++;
            } // end loop i;

            // TODO: may need to map LOC, RFF for wireReceivingBank and receivingCorrespondentBank
        }

    }

    private _RFF_ZZZ(nExtrinscs: Element[], arrExclude?: string[]) {
        if (!arrExclude) {
            arrExclude = this._arrExcludeZZZ;
        }
        for (let nExt of nExtrinscs) {
            let vName = this._v('@name', nExt);
            if (this._arrExcludeZZZ.includes(vName)) {
                continue;
            }
            if (this._arrExcludeRFF.includes(vName)) {
                continue;
            }
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ZZZ');
            this._setV(RFF, 102, vName);
            let v = this._v('', nExt);
            this._splitStr(RFF, v, 1, 4, 8, 35);
        }
    }

    /**
     * All under /InvoiceDetailRequest/InvoiceDetailSummary
     */
    private _sumAmount(xPath: string, v101: string, nInvDetailSummary) {
        let nNode = this._e(xPath, nInvDetailSummary);
        if (nNode) {
            this._MOA(nNode, 'Money', v101);
            this._MOA_Alt(nNode, 'Money', v101);
        }
    }

    private _SG8_PAT(nRequestHeader: Element, nPayT: Element) {
        let vPAT1;
        let vPAT204;
        let vNetTermInformation = this._v('Extrinsic [@name="netTermInformation"]', nRequestHeader);
        let vPenaltyInformation = this._v('Extrinsic [@name="penaltyInformation"]', nRequestHeader);
        let vDiscountInformation = this._v('Extrinsic [@name="discountInformation"]', nRequestHeader);
        if (vNetTermInformation) {
            vPAT1 = '3';
            vPAT204 = vNetTermInformation;
        } else if (vPenaltyInformation) {
            vPAT1 = '20';
            vPAT204 = vPenaltyInformation;
        } else if (vDiscountInformation) {
            vPAT1 = '22';
            vPAT204 = vDiscountInformation;
        } else {
            // default to Discount
            vPAT1 = '22';
            vPAT204 = vDiscountInformation;
        }

        if (vPAT1) {
            let PAT = this._initSegEdi('PAT', 3);
            this._setV(PAT, 1, vPAT1);
            this._setV(PAT, 201, '6'); // MapSpec said it should be '6', seems some files do not follow the rule
            this._setTV(PAT, 204, vPAT204.substring(0, 35));
            if (vPAT204.length > 35) {
                this._setTV(PAT, 205, vPAT204.substring(35));
            }
            this._setV(PAT, 301, '5');
            this._setV(PAT, 302, '3');
            this._setV(PAT, 303, 'D');
            // <!ELEMENT PaymentTerm (Discount?, Extrinsic*)> , so even it's Penalty, we still need
            // to find it in <Discount> element ?
            this._setV(PAT, 304, this._v('@payInNumberOfDays', nPayT));
        }
    }
    private _SG15_Modifications(nMod: Element) {
        let nAdditionalDeduction = this._e('AdditionalDeduction', nMod);
        let nAdditionalCost = this._e('AdditionalCost', nMod);
        let nModDetail = this._e('ModificationDetail', nMod);
        let ALC;
        if (nAdditionalDeduction) {
            ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'A');
        } else if (nAdditionalCost) {
            ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'C');
        } else {
            return;
        }
        this._setTV(ALC, 201, this._v('Description/ShortName', nModDetail));
        this._setV(ALC, 3, this._mci(MAPS.mapALC4471, this._v('Extrinsic [@name="settlementCode"]', nModDetail)));
        this._setV(ALC, 4, this._v('@level', nMod));
        let vName = this._v('@name', nModDetail);
        let vDesc = this._vt2('Description', nModDetail);
        if (this._mei(MAPS.mapALC7161, vName)) {
            this._setV(ALC, 501, this._mci(MAPS.mapALC7161, vName));
            this._setTV(ALC, 504, vDesc.substring(0, 35));
            if (vDesc.length > 35) {
                this._setTV(ALC, 505, vDesc.substring(35));
            }
        } else {
            this._setV(ALC, 501, 'ZZZ');
            this._setTV(ALC, 504, vDesc.substring(0, 35));
            this._setTV(ALC, 505, vName);
        }

        // SG16 Group 16
        // RFF
        let vDescRFF = this._vt2('Description', nModDetail);
        if (vDescRFF) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ZZZ');
            this._setV(RFF, 102, vDescRFF.substring(0, 35));
            this._setV(RFF, 103, this._v('Description/@xml:lang', nModDetail).toLowerCase());
            if (vDescRFF.length > 35) {
                this._setV(RFF, 104, vDescRFF.substring(35));
            }
        }
        // DTM 194
        this._DTM_EDI(nModDetail, '@startDate', '194');
        // DTM 206
        this._DTM_EDI(nModDetail, '@startDate', '206');

        // SG18 Group 18
        // PCD
        if (nAdditionalDeduction) {
            let vPercent = this._v('DeductionPercent/@percent', nAdditionalDeduction);
            let PCD = this._initSegEdi('PCD', 1);
            this._setV(PCD, 101, '12');
            this._setV(PCD, 102, vPercent);
            this._setV(PCD, 103, '13');
        } else {
            let vPercent = this._v('Percentage/@percent', nAdditionalCost);
            let PCD = this._initSegEdi('PCD', 1);
            this._setV(PCD, 101, '12');
            this._setV(PCD, 102, vPercent);
            this._setV(PCD, 103, '13');
        }
        // SG19 Group 19
        // MOA 98
        this._MOA(nMod, 'OriginalPrice/Money', '98');

        // MOA 4
        this._MOA(nMod, 'DeductedPrice/Money', '4');

        if (nAdditionalCost) {
            this._MOA(nAdditionalCost, 'Money', '8');
        } else {
            this._MOA(nAdditionalDeduction, 'Money', '204');
        }
        // MOA 25
        let vAllowanceCharge = this._v('Extrinsic [@name="allowanceChargeBasisAmount"]/Money', nModDetail);
        if (vAllowanceCharge) {
            this._MOA(nModDetail, 'Extrinsic [@name="allowanceChargeBasisAmount"]/Money', '25');
        }
        // SG21 Group 21
        let vTaxMoney = this._v('Tax/Money', nMod);
        if (vTaxMoney) {
            // TAX
            let TAX = this._initSegEdi('TAX', 7);
            this._setV(TAX, 1, '9');
            this._setV(TAX, 7, this._v('Tax/Description', nMod));
            // MOA
            this._MOA(nMod, 'Tax/Money', '176');
        }

        let vTaxCategory = this._v('Tax/TaxDetail/@category', nMod)
        let nTaxDetails = this._es('Tax/TaxDetail', nMod);
        for (let nTaxDetail of nTaxDetails) {
            this._TaxDetail(nTaxDetail, false);
        }
    }
    /**
     * For Normal Material Item and Service Item
     * 
     * @param isMaterial true for normal item, false for service item
     * @param nItem 
     * 
     */
    private _item(isMaterial: boolean, nItem: Element, nRequestHeader: Element, nOrder: Element) {
        // LIN
        let LIN = this._initSegEdi('LIN', 4);
        this._setV(LIN, 1, this._v('@invoiceLineNumber', nItem));
        let vIsAdHoc = this._v('@isAdHoc', nItem)
        if (vIsAdHoc == 'yes') {
            this._setV(LIN, 2, '1');
        }
        let nItemRef;
        if (isMaterial) {
            nItemRef = this._e('InvoiceDetailItemReference', nItem);
        } else {
            nItemRef = this._e('InvoiceDetailServiceItemReference', nItem);
        }
        this._setV(LIN, 301, this._v('@lineNumber', nItemRef));
        if (isMaterial) {
            this._setV(LIN, 302, 'PL');
        } else {
            this._setV(LIN, 302, 'MP');
        }

        let vParent = this._v('parentInvoiceLineNumber', nItem);
        if (vParent) {
            this._setV(LIN, 401, '1');
            this._setV(LIN, 402, vParent);
        }

        // PIA
        this._PIA(nItemRef);

        // IMD_E
        let vLang = this._v('Description/@xml:lang', nItemRef);
        vLang = vLang ? vLang : 'en';
        let vShortName = this._v('Description/ShortName', nItemRef);
        if (vShortName) {
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'E');
            this._splitStr(IMD, vShortName, 3, 4, 5, 70);
            this._setV(IMD, 306, vLang);
        }

        // IMD_F
        let vDesc = this._v('Description', nItemRef);
        if (vDesc) {
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'F');
            this._splitStr(IMD, vDesc, 3, 4, 5, 70);
            this._setV(IMD, 306, vLang);
        }

        // IMD_B ACA
        let sDomain = this._v('Classification/@domain', nItemRef);
        let sClassification = this._v('Classification', nItemRef);
        if (sClassification) {
            let IMDB = this._initSegEdi('IMD', 3);
            this._setV(IMDB, 1, 'B');
            this._setV(IMDB, 301, 'ACA');
            this._setV(IMDB, 304, sDomain);
            this._setV(IMDB, 305, sClassification);
        }
        // QTY
        let vQuantity = this._v('@quantity', nItem);
        if (vQuantity) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '47');
            this._setV(QTY, 102, vQuantity);
            this._setV(QTY, 103, this._v('UnitOfMeasure', nItem));
        }
        // ALI
        let vCountry = this._v('Country/@isoCountryCode', nItemRef);
        if (vCountry) {
            let ALI = this._initSegEdi('ALI', 3);
            this._setV(ALI, 1, vCountry);
            let vReason = this._v('@reason', nItem);
            if (vReason && vReason == 'return') {
                this._setV(ALI, 3, '88');
            }
        }

        // DTM 171
        this._DTM_EDI(nItem, '@referenceDate', '171');
        // DTM 194
        this._DTM_EDI(nItem, 'Period/@startDate', '194');
        // DTM 206
        this._DTM_EDI(nItem, 'Period/@endDate', '206');
        // DTM 35
        this._DTM_EDI(nItem, 'ShipNoticeIDInfo/IdReference [@domain="actualDeliveryDate"]/@identifier', '35');
        // DTM 351
        this._DTM_EDI(nItem, '@inspectionDate', '351');

        // FTX AAI
        let nComments = this._es('Comments', nItem);
        let sCommentsLang: string;
        for (let n of nComments) {
            let sComments = this._v('', n);
            let sCommentsType = this._v('@type', n);
            // it's OK to assign the last to global, I'm tired
            sCommentsLang = this._v('@xml:lang', n);
            if (sComments) {
                let FTX = this._initSegEdi('FTX', 5);
                this._setV(FTX, 1, 'AAI');
                this._FTX(FTX, 1, sComments);
                this._setV(FTX, 5, sCommentsLang);
            }
        }

        // FTX TXD
        vDesc = this._v('Tax/Description', nItem);
        if (vDesc) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'TXD');
            this._splitStr(FTX, vDesc, 4, 1, 5, 70);
            this._setV(FTX, 5,
                this._v('Tax/Description/@xml:lang', nItem));
        }

        // FTX TXD 4
        let vTriangularTransactionLawReference = this._v('Tax/TaxDetail/TriangularTransactionLawReference', nItem);
        if (vTriangularTransactionLawReference) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'TXD');
            this._setV(FTX, 2, '4');
            this._splitStr(FTX, vDesc, 4, 1, 5, 70);
            this._setV(FTX, 5,
                this._v('Tax/TaxDetail/TriangularTransactionLawReference/@xml:lang', nItem));
        }

        // FTX ACB
        let vSGPosition = this._v('Extrinsic [@name="SGPositionText"]', nItem);
        if (vSGPosition) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'ACB');
            // Start From compnent 402
            this._FTX(FTX, 1, vSGPosition.substring(0, 280));
            this._setV(FTX, 5, 'en');
        }

        // FTX ZZZ
        let nExtrins = this._es(XML.Extrinsic, nItem);
        this._FTX_ZZZ(nExtrins);
        // MOA 128
        this._MOA(nItem, 'GrossAmount/Money', '128');
        // MOA 203
        this._MOA(nItem, 'NetAmount/Money', '203');

        // MOA 38 // HeaderOrder

        // MOA 289
        this._MOA(nItem, 'SubtotalAmount/Money', '289');
        // MOA 176 4 // Should be "124" or "176"
        this._MOA(nItem, 'Tax/Money', '176');
        // MOA 176 7 // Should be "124" or "176"
        this._MOA_Alt(nItem, 'Tax/Money', '176');

        // MOA 146
        this._MOA(nItem, 'UnitPrice/Money', '146');
        // MOA 259
        this._MOA(nItem, 'TotalCharges/Money', '259');
        // MOA 260
        this._MOA(nItem, 'TotalAllowances/Money', '260');
        // MOA 125, Should be "125" or "ZZZ"
        this._MOA(nItem, 'TotalAmountWithoutTax/Money', 'ZZZ');
        // SG28 Group 28
        // PRI CAL
        let vBasisQuantity = this._v('PriceBasisQuantity/@quantity', nItem);
        let PRI = this._initSegEdi('PRI', 1);
        this._setV(PRI, 101, 'CAL');
        if (this._vPurpose == 'lineLevelCreditMemo' || this._vPurpose == 'lineLevelDebitMemo') {
            let vIsPriceAdjustmentInLine = this._v('InvoiceDetailLineIndicator/@isPriceAdjustmentInLine', nRequestHeader);
            if (vIsPriceAdjustmentInLine == 'yes') {
                this._setV(PRI, 104, 'AAK');
            } else {
                this._setV(PRI, 104, 'PBQ');
            }
        } else {
            this._setV(PRI, 104, 'PBQ');
        }
        if (vBasisQuantity) {
            // APR
            let vConversionFactor = this._v('PriceBasisQuantity/@conversionFactor', nItem);
            if (vConversionFactor) {
                let APR = this._initSegEdi('APR', 2);
                this._setV(APR, 1, 'WS');
                this._setV(APR, 201, vConversionFactor);
                this._setV(APR, 202, 'CSD');
            }
            // RNG
            let RNG = this._initSegEdi('RNG', 2);
            this._setV(RNG, 1, '4');
            this._setV(RNG, 201, this._v('PriceBasisQuantity/UnitOfMeasure', nItem));
            this._setV(RNG, 202, vBasisQuantity);
            this._setV(RNG, 203, vBasisQuantity);
        }


        // PRI AAA
        if (vBasisQuantity) {
            let PRI = this._initSegEdi('PRI', 1);
            this._setV(PRI, 101, 'AAA');

            this._setV(PRI, 102, this._v('UnitPrice/Money', nItem));
            if (this._vPurpose == 'lineLevelCreditMemo' || this._vPurpose == 'lineLevelDebitMemo') {
                let vIsPriceAdjustmentInLine = this._v('InvoiceDetailLineIndicator/@isPriceAdjustmentInLine', nRequestHeader);

                if (vIsPriceAdjustmentInLine == 'yes') {
                    this._setV(PRI, 104, 'AAK');
                } else {
                    //this._setV(PRI, 104, 'PBQ');
                }
            } // end if lineLevelCreditMemo or lineLevelDebitMemo 
            this._setV(PRI, 105, vBasisQuantity);
            this._setV(PRI, 106, this._v('PriceBasisQuantity/UnitOfMeasure', nItem));
        } // end if vBasisQuantity for AAA

        let nOrderInfo = this._e('InvoiceDetailOrderInfo', nOrder);
        // RFF ON
        let vOrderID = this._v('OrderReference/@orderID', nOrderInfo);
        if (vOrderID && this._vBGM01 == '385') {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ON');
            this._setV(RFF, 102, vOrderID);
            // DTM Order Date
            this._DTM_EDI(nOrderInfo, 'OrderReference/@orderDate', '4');
        }
        // SG29 Group 29
        let sAgreementID = this._v('MasterAgreementInfo/@agreementID', nOrderInfo);
        let sAgreementType = this._v('MasterAgreementInfo/@agreementType', nOrderInfo);
        if (sAgreementID && this._vBGM01 == '385') {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'CT');
            this._setV(RFF, 102, sAgreementID);
            if (sAgreementType && sAgreementType == 'scheduling_agreement') {
                this._setV(RFF, 103, '1');
            }
            // DTM
            this._DTM_EDI(nOrderInfo, 'MasterAgreementInfo/@agreementDate', '126');
        }
        // RFF VN
        let vSupplierOrderID = this._v('SupplierOrderInfo/@orderID', nOrderInfo);
        let vSupplierOrderLine = this._v('Extrinsic[@name="supplierOrderLineNum"]', nItem);
        if (vSupplierOrderID && vSupplierOrderLine) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'VN');
            this._setV(RFF, 102, vSupplierOrderID);
            this._setV(RFF, 103, vSupplierOrderLine);
            // DTM
            this._DTM_EDI(nOrderInfo, 'SupplierOrderInfo/@orderDate', '4');
        }
        // RFF FI
        let vItemType = this._v('@itemType', nItem);
        if (vItemType) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'FI');
            this._setV(RFF, 102, vItemType);
            this._setV(RFF, 104, this._v('@compositeItemType', nItem));
        }
        // RFF DQ
        let vDeliveryNoteID = this._v('ShipNoticeIDInfo/IdReference [@domain="deliveryNoteID"]/@identifier', nItem);
        if (vDeliveryNoteID) {
            let REF = this._initSegEdi('RFF', 1);
            this._setV(REF, 101, 'DQ');
            this._setV(REF, 102, vDeliveryNoteID);
            this._setV(REF, 103, this._v('ShipNoticeIDInfo/IdReference [@domain="deliveryNoteLineItemNo"]/@identifier', nItem));
            // DTM
            this._DTM_EDI(nItem, 'ShipNoticeIDInfo/IdReference [@domain="deliveryNoteDate"]/@identifier', '124');
        }
        // RFF ALO
        let vReceivingAdviceID = this._v('ShipNoticeIDInfo/IdReference [@domain="ReceivingAdviceID"]/@identifier', nItem);
        if (vReceivingAdviceID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ALO');
            this._setV(RFF, 102, vReceivingAdviceID);
            this._setV(RFF, 103, this._v('ShipNoticeLineItemReference/@shipNoticeLineNumber', nItem));
        }
        // RFF MA
        let vShipNoticeID1 = this._v('ShipNoticeIDInfo/@shipNoticeID', nItem);
        let vShipNoticeID2 = this._v('InvoiceDetailShipNoticeInfo/ShipNoticeReference/@shipNoticeID', nOrder);
        let vShipNoticeID = vShipNoticeID1 ?? vShipNoticeID2;
        if (vShipNoticeID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'MA');
            this._setV(RFF, 102, vShipNoticeID);
            this._setV(RFF, 103, this._v('ShipNoticeLineItemReference/@shipNoticeLineNumber', nItem));
            // DTM
            let vDate1 = this._v('ShipNoticeIDInfo/@shipNoticeDate', nItem);
            if (vDate1) {
                this._DTM_EDI(nItem, 'ShipNoticeIDInfo/@shipNoticeDate', '171');
            } else {
                // try another source
                this._DTM_EDI(nOrder, 'InvoiceDetailShipNoticeInfo/ShipNoticeReference/@shipNoticeDate', '171');
            }
        } // end if vShipNoticeID
        // RFF ACE
        let vServiceEntryID = this._v('ServiceEntryItemReference/@serviceEntryID', nItem);
        if (vServiceEntryID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ACE');
            this._setV(RFF, 102, vServiceEntryID);
            this._setV(RFF, 103, this._v('ServiceEntryItemReference/@serviceLineNumbe', nItem));
            // DTM
            this._DTM_EDI(nItem, 'ServiceEntryItemReference/@serviceEntryDate', '171')
        }
        // RFF PK
        let vPackListID = this._v('ShipNoticeIDInfo/IdReference [@domain="packListID"]/@identifier', nItem);
        this._RFF_KV_EDI('PK', vPackListID);
        // RFF ADE
        let vGLAccount = this._v('Extrinsic[@name="GLAccount"]', nItem);
        this._RFF_KV_EDI('ADE', vGLAccount);
        // RFF ZZZ
        let nExtrinscs = this._es('Extrinsic', nItem);
        this._RFF_ZZZ(nExtrinscs);

        // RFF VA
        let vDescTax = this._v('Tax/TaxDetail/Description', nItem);
        if (vDescTax) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'VA');
            this._setV(RFF, 104, vDescTax);
            // DTM 131
            this._DTM_EDI(nItem, 'Tax/TaxDetail/@taxPointDate', '131');
            // DTM 140
            this._DTM_EDI(nItem, 'Tax/TaxDetail/@paymentDate', '140');
        }
        // RFF AHR
        let vTaxRegime = this._v('Tax/TaxDetail/TaxRegime', nItem);
        if (vTaxRegime) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'AHR');
            this._setV(RFF, 104, vTaxRegime);
        }
        // PAC
        let vPackagingLevelCode = this._v('Packaging/PackagingLevelCode', nItem);
        if (vPackagingLevelCode) {
            let PAC = this._initSegEdi('PAC', 3);
            // Number of packages
            this._setV(PAC, 1, this._v('Extrinsic [@name="numberOfPackages"]', nItem));
            this._setV(PAC, 201, this._mci(MAPS.mapPAC7075, vPackagingLevelCode))
            let vPackagingCode = this._v('Packaging/PackagingCode', nItem);
            this._setV(PAC, 301, vPackagingCode);
            this._setV(PAC, 304, this._v('Packaging/Description', nItem));

            // MEA
            let nPackDims = this._es('Packaging/Dimension', nItem);
            for (let nDim of nPackDims) {
                let vType = this._v('@type', nDim);
                let MEA = this._initSegEdi('MEA', 3);
                this._setV(MEA, 1, 'AAE');
                if (this._mei(MAPS.mapMEA6313, vType)) {
                    this._setV(MEA, 201, this._mci(MAPS.mapMEA6313, vType));
                } else {
                    this._setV(MEA, 201, 'ZZZ');
                }
                this._setV(MEA, 301, this._v('UnitOfMeasure', nDim));
                this._setV(MEA, 302, this._v('@quantity', nDim));
            }
        } // end if vPackagingLevelCode
        // SG32 Group 32
        // LOC 27
        this._LOC(nItem, 'Extrinsic [@name = "ShipFromCountry"]', '27');
        // LOC 28
        this._LOC(nItem, 'Extrinsic [@name = "ShipToCountry"]', '28');
        // LOC 19
        this._LOC(nItem, 'Extrinsic [@name = "plantCode"]', '27');

        // TAX
        let nTaxDetails = this._es('Tax/TaxDetail [@purpose="tax" or @purpose="duty" ]', nItem);
        for (let nTaxDetail of nTaxDetails) {
            this._TaxDetail(nTaxDetail, true);

            this._LOC(nTaxDetail, 'Extrinsic [@name="taxJurisdiction"]', '157');
        } // end if nTaxDetail

        let nInvoiceDetailLineShipping = this._e('InvoiceDetailLineShipping', nItem);
        let nInvoiceDetailShipping = this._e('InvoiceDetailShipping', nInvoiceDetailLineShipping);
        if (nInvoiceDetailShipping) {
            let nContactsShipping = this._es('Contact', nInvoiceDetailShipping);
            for (let nContact of nContactsShipping) {
                let vRole = this._v('@role', nContact);
                let vMappedRole = this._mci(MAPS.mapNAD3035Shipping, vRole);
                if (!vMappedRole) {
                    continue;
                }
                // NAD
                this._NAD(vMappedRole, nContact);
                // RFF
                let nRefs = this._es('IdReference', nInvoiceDetailShipping);
                for (let nRef of nRefs) {
                    let vDomain = this._v('@domain', nRef);
                    if (this._mei(MAPS.mapRFF1153, vDomain)) {
                        this._RFF_KV_EDI(this._mci(MAPS.mapRFF1153, vDomain), this._v('@identifier', nRef));
                    }
                }
                // RFF CN
                // Don't move _initSegEdi to outside, because we may not need to create it.
                let RFF;
                switch (vRole) {
                    case 'carrierCorporate':
                        let nCarrierIdentifiers = this._es('CarrierIdentifier', nInvoiceDetailShipping);
                        for (let n of nCarrierIdentifiers) {
                            RFF = this._initSegEdi('RFF', 1);
                            this._setV(RFF, 101, 'CN');
                            this._setV(RFF, 102, this._v('', n));
                            this._setV(RFF, 104, this._v('@domain', n));
                        }
                        break;
                    case 'shipFrom':
                    case 'shipTo':
                        let nShipmentIdentifiers = this._es('ShipmentIdentifier', nInvoiceDetailShipping);
                        for (let n of nShipmentIdentifiers) {
                            RFF = this._initSegEdi('RFF', 1);
                            this._setV(RFF, 101, 'CN');
                            this._setV(RFF, 102, this._v('', n));
                            this._setV(RFF, 104, this._v('@domain', n));

                            // DTM
                            this._DTM_EDI(n, '@trackingNumberDate', '89');
                        }
                        break;
                } // end switch vRole

                let vName = this._v('Phone/@name', nContact);
                if (!vName) {
                    vName = this._v('Fax/@name', nContact);
                }
                if (!vName) {
                    vName = this._v('Email/@name', nContact);
                }
                this._CTA_COM('ZZZ', vName, vName, nContact);
            } // end loop nContactsShipping
        } // end if nInvoiceDetailShipping

        // SG34 Group 34
        let vManuName = this._v('InvoiceDetailItemReference/ManufacturerName', nItem);
        if (vManuName) {
            let NAD = this._initSegEdi('NAD', 4);
            this._setV(NAD, 1, 'MF');
            this._splitStr(NAD, vManuName, 4, 1, 5, 35);
        }
        // SG38 Group 38
        // ALC Modification
        let nMods = this._es('InvoiceItemModifications/Modification', nItem);
        for (let nMod of nMods) {
            this._SG38_Modifications(nMod);
        } // end loop nMods

        // SG38 Group 38 InvoiceDetailDiscount
        let nInvoiceDetailDiscount = this._e('InvoiceDetailDiscount', nItem);
        if (nInvoiceDetailDiscount) {
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'A');
            this._setV(ALC, 501, 'DI');

            // SG40 Group 40
            // PCD
            let PCD = this._initSegEdi('PCD', 1);
            this._setV(PCD, 101, '12');
            this._setV(PCD, 102, this._v('@percentageRate', nInvoiceDetailDiscount));
            this._setV(PCD, 103, '13');
            // MOA 52 4
            this._MOA(nInvoiceDetailDiscount, 'Money', '52');
            // MOA 52 7
            this._MOA_Alt(nInvoiceDetailDiscount, 'Money', '52');
        } // end if nInvoiceDetailDiscount

        // SG38 Group 38
        // ALC
        if (nInvoiceDetailLineShipping) {
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'C');
            this._setV(ALC, 501, 'SAA');
            // MOA 23 4
            this._MOA(nInvoiceDetailLineShipping, 'Money', '23');
            // MOA 23 7
            this._MOA_Alt(nInvoiceDetailLineShipping, 'Money', '23');
        } // nInvoiceDetailShipping

        // SG43 Group 43
        // TAX
        let nTaxDetail = this._e('Tax/TaxDetail [@purpose="shippingTax"]', nItem)
        if (nTaxDetail) {
            this._TaxDetail(nTaxDetail, false);
        } // end if nTaxDetail        

        let nInvoiceDetailLineSpecialHandling = this._e('InvoiceDetailLineSpecialHandling', nItem);
        // ALC
        if (nInvoiceDetailLineSpecialHandling) {
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'C');
            this._setV(ALC, 501, 'SH');
            this._splitStr(ALC, this._v('Description', nInvoiceDetailLineSpecialHandling), 5, 4, 5, 35);
            // MOA 23 4
            this._MOA(nInvoiceDetailLineSpecialHandling, 'Money', '23');
            // MOA 23 7
            this._MOA_Alt(nInvoiceDetailLineSpecialHandling, 'Money', '23');
        } // nInvoiceDetailLineSpecialHandling

        // SG43 Group 43
        // TAX
        nTaxDetail = this._e('Tax/TaxDetail [@purpose="specialHandlingTax"]', nItem)
        if (nTaxDetail) {
            this._TaxDetail(nTaxDetail, false);
        } // end if nTaxDetail        

        // SG38 Group 38
        // ALC
        let nDistribution = this._e('Distribution', nItem);
        if (nDistribution) {
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'N');
            this._setV(ALC, 501, 'ADT');
            this._setV(ALC, 502, '175');
            this._setV(ALC, 503, '92');
            this._setTV(ALC, 504, this._v('Accounting/AccountingSegment/Name', nDistribution));
            this._setTV(ALC, 505, this._v('Accounting/AccountingSegment/Description', nDistribution));
            // MOA 54 4
            this._MOA(nDistribution, 'Charge/Money', '54');
            // MOA 54 7
            this._MOA_Alt(nDistribution, 'Charge/Money', '54');
        }

    } // end function _item

    /**
     * Only for Header Invoice
     * 
     * @param isMaterial true for normal item, false for service item
     * @param nItem 
     * 
     */
    private _headerInvoice(nDetailHeaderOrder: Element) {
        let nInvoiceDetailOrderSummary = this._e('InvoiceDetailOrderSummary', nDetailHeaderOrder);
        // LIN
        let LIN = this._initSegEdi('LIN', 1);
        this._setV(LIN, 1, this._v('@invoiceLineNumber', nInvoiceDetailOrderSummary));

        // PIA
        // this._PIA(nItemRef);

        // DTM 194
        this._DTM_EDI(nInvoiceDetailOrderSummary, 'Period/@startDate', '194');
        // DTM 206
        this._DTM_EDI(nInvoiceDetailOrderSummary, 'Period/@endDate', '206');
        // DTM 351
        this._DTM_EDI(nInvoiceDetailOrderSummary, '@inspectionDate', '351');

        // FTX AAI
        let nComments = this._es('Comments', nInvoiceDetailOrderSummary);
        let sCommentsLang: string;
        for (let n of nComments) {
            let sComments = this._v('', n);
            let sCommentsType = this._v('@type', n);
            // it's OK to assign the last to global, I'm tired
            sCommentsLang = this._v('@xml:lang', n);
            if (sComments) {
                let FTX = this._initSegEdi('FTX', 5);
                this._setV(FTX, 1, 'AAI');
                this._FTX(FTX, 1, sComments);
                this._setV(FTX, 5, sCommentsLang);
            }
        }

        // FTX TXD
        let vDesc = this._v('Tax/Description', nInvoiceDetailOrderSummary);
        if (vDesc) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'TXD');
            this._splitStr(FTX, vDesc, 4, 1, 5, 70);
            this._setV(FTX, 5,
                this._v('Tax/Description/@xml:lang', nInvoiceDetailOrderSummary));
        }

        // FTX TXD 4
        let vTriangularTransactionLawReference = this._v('Tax/TaxDetail/TriangularTransactionLawReference', nInvoiceDetailOrderSummary);
        if (vTriangularTransactionLawReference) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'TXD');
            this._setV(FTX, 2, '4');
            this._splitStr(FTX, vDesc, 4, 1, 5, 70);
            this._setV(FTX, 5,
                this._v('Tax/TaxDetail/TriangularTransactionLawReference/@xml:lang', nInvoiceDetailOrderSummary));
        }

        // FTX ZZZ
        let nExtrins = this._es(XML.Extrinsic, nInvoiceDetailOrderSummary);
        this._FTX_ZZZ(nExtrins);

        // MOA 128
        this._MOA(nInvoiceDetailOrderSummary, 'GrossAmount/Money', '128');
        // MOA 38 // HeaderOrder
        this._MOA(nInvoiceDetailOrderSummary, 'NetAmount/Money', '38');
        // MOA 289
        this._MOA(nInvoiceDetailOrderSummary, 'SubtotalAmount/Money', '289');
        // MOA 176 4
        this._MOA(nInvoiceDetailOrderSummary, 'Tax/Money', '176');
        // MOA 176 7
        this._MOA_Alt(nInvoiceDetailOrderSummary, 'Tax/Money', '176');

        // SG28 Group 28    
        let nOrderInfo = this._e('InvoiceDetailOrderInfo', nDetailHeaderOrder);
        // RFF ON
        let vOrderID = this._v('OrderReference/@orderID', nOrderInfo);
        if (vOrderID && this._vBGM01 == '385') {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ON');
            this._setV(RFF, 102, vOrderID);
            // DTM Order Date
            this._DTM_EDI(nOrderInfo, 'OrderReference/@orderDate', '4');
        }
        // SG29 Group 29
        let sAgreementID = this._v('MasterAgreementInfo/@agreementID', nOrderInfo);
        let sAgreementType = this._v('MasterAgreementInfo/@agreementType', nOrderInfo);
        if (sAgreementID && this._vBGM01 == '385') {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'CT');
            this._setV(RFF, 102, sAgreementID);
            if (sAgreementType && sAgreementType == 'scheduling_agreement') {
                this._setV(RFF, 103, '1');
            }
            // DTM
            this._DTM_EDI(nOrderInfo, 'MasterAgreementInfo/@agreementDate', '126');
        }
        // RFF VN
        let vSupplierOrderID = this._v('SupplierOrderInfo/@orderID', nOrderInfo);
        let vSupplierOrderLine = this._v('Extrinsic[@name="supplierOrderLineNum"]', nInvoiceDetailOrderSummary);
        // if (vSupplierOrderID && vSupplierOrderLine) {
        if (vSupplierOrderID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'VN');
            this._setV(RFF, 102, vSupplierOrderID);
            //this._setV(RFF, 103, vSupplierOrderLine);
            // DTM
            this._DTM_EDI(nOrderInfo, 'SupplierOrderInfo/@orderDate', '4');
        }

        // RFF ZZZ
        let nExtrinscs = this._es('Extrinsic', nInvoiceDetailOrderSummary);
        this._RFF_ZZZ(nExtrins);

        // RFF VA
        let vDescTax = this._v('Tax/TaxDetail/Description', nInvoiceDetailOrderSummary);
        if (vDescTax) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'VA');
            this._setV(RFF, 104, vDescTax);
            // DTM 131
            this._DTM_EDI(nInvoiceDetailOrderSummary, 'Tax/TaxDetail/@taxPointDate', '131');
            // DTM 140
            this._DTM_EDI(nInvoiceDetailOrderSummary, 'Tax/TaxDetail/@paymentDate', '140');
        }
        // RFF AHR
        let vTaxRegime = this._v('Tax/TaxDetail/TaxRegime', nInvoiceDetailOrderSummary);
        if (vTaxRegime) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'AHR');
            this._setV(RFF, 104, vTaxRegime);
        }

        // TAX
        let nTaxDetails = this._es('Tax/TaxDetail [@purpose="tax" or @purpose="duty" ]', nInvoiceDetailOrderSummary);
        for (let nTaxDetail of nTaxDetails) {
            this._TaxDetail(nTaxDetail, true);

            this._LOC(nTaxDetail, 'Extrinsic [@name="taxJurisdiction"]', '157');
        } // end if nTaxDetail

        let nInvoiceDetailLineShipping = this._e('InvoiceDetailLineShipping', nInvoiceDetailOrderSummary);
        let nInvoiceDetailShipping = this._e('InvoiceDetailShipping', nInvoiceDetailLineShipping);
        if (nInvoiceDetailShipping) {
            let nContactsShipping = this._es('Contact', nInvoiceDetailShipping);
            for (let nContact of nContactsShipping) {
                let vRole = this._v('@role', nContact);
                let vMappedRole = this._mci(MAPS.mapNAD3035Shipping, vRole);
                if (!vMappedRole) {
                    continue;
                }
                // NAD
                this._NAD(vMappedRole, nContact);
                // RFF
                let nRefs = this._es('IdReference', nInvoiceDetailShipping);
                for (let nRef of nRefs) {
                    let vDomain = this._v('@domain', nRef);
                    if (this._mei(MAPS.mapRFF1153, vDomain)) {
                        this._RFF_KV_EDI(this._mci(MAPS.mapRFF1153, vDomain), this._v('@identifier', nRef));
                    }
                }
                // RFF CN
                // Don't move _initSegEdi to outside, because we may not need to create it.
                let RFF;
                switch (vRole) {
                    case 'carrierCorporate':
                        let nCarrierIdentifiers = this._es('CarrierIdentifier', nInvoiceDetailShipping);
                        for (let n of nCarrierIdentifiers) {
                            RFF = this._initSegEdi('RFF', 1);
                            this._setV(RFF, 101, 'CN');
                            this._setV(RFF, 102, this._v('', n));
                            this._setV(RFF, 104, this._v('@domain', n));
                        }
                        break;
                    case 'shipFrom':
                    case 'shipTo':
                        let nShipmentIdentifiers = this._es('ShipmentIdentifier', nInvoiceDetailShipping);
                        for (let n of nShipmentIdentifiers) {
                            RFF = this._initSegEdi('RFF', 1);
                            this._setV(RFF, 101, 'CN');
                            this._setV(RFF, 102, this._v('', n));
                            this._setV(RFF, 104, this._v('@domain', n));

                            // DTM
                            this._DTM_EDI(n, '@trackingNumberDate', '89');
                        }
                        break;
                } // end switch vRole

                let vName = this._v('Phone/@name', nContact);
                if (!vName) {
                    vName = this._v('Fax/@name', nContact);
                }
                if (!vName) {
                    vName = this._v('Email/@name', nContact);
                }
                this._CTA_COM('ZZZ', vName, vName, nContact);
            } // end loop nContactsShipping
        } // end if nInvoiceDetailShipping

        // SG38 Group 38 InvoiceDetailDiscount
        let nInvoiceDetailDiscount = this._e('InvoiceDetailDiscount', nInvoiceDetailOrderSummary);
        if (nInvoiceDetailDiscount) {
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'A');
            this._setV(ALC, 501, 'DI');

            // SG40 Group 40
            // PCD
            let PCD = this._initSegEdi('PCD', 1);
            this._setV(PCD, 101, '12');
            this._setV(PCD, 102, this._v('@percentageRate', nInvoiceDetailDiscount));
            this._setV(PCD, 103, '13');
            // MOA 52 4
            this._MOA(nInvoiceDetailDiscount, 'Money', '52');
            // MOA 52 7
            this._MOA_Alt(nInvoiceDetailDiscount, 'Money', '52');
        } // end if nInvoiceDetailDiscount

        // SG38 Group 38
        // ALC
        if (nInvoiceDetailLineShipping) {
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'C');
            this._setV(ALC, 501, 'SAA');
            // MOA 23 4
            this._MOA(nInvoiceDetailLineShipping, 'Money', '23');
            // MOA 23 7
            this._MOA_Alt(nInvoiceDetailLineShipping, 'Money', '23');
        } // nInvoiceDetailShipping

        // SG43 Group 43
        // TAX
        let nTaxDetail = this._e('Tax/TaxDetail [@purpose="shippingTax"]', nInvoiceDetailOrderSummary)
        if (nTaxDetail) {
            this._TaxDetail(nTaxDetail, false);
        } // end if nTaxDetail        

        let nInvoiceDetailLineSpecialHandling = this._e('InvoiceDetailLineSpecialHandling', nInvoiceDetailOrderSummary);
        // ALC
        if (nInvoiceDetailLineSpecialHandling) {
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'C');
            this._setV(ALC, 501, 'SH');
            this._splitStr(ALC, this._v('Description', nInvoiceDetailLineSpecialHandling), 5, 4, 5, 35);
            // MOA 23 4
            this._MOA(nInvoiceDetailLineSpecialHandling, 'Money', '23');
            // MOA 23 7
            this._MOA_Alt(nInvoiceDetailLineSpecialHandling, 'Money', '23');
        } // nInvoiceDetailLineSpecialHandling

        // SG43 Group 43
        // TAX
        nTaxDetail = this._e('Tax/TaxDetail [@purpose="specialHandlingTax"]', nInvoiceDetailOrderSummary)
        if (nTaxDetail) {
            this._TaxDetail(nTaxDetail, false);
        } // end if nTaxDetail        

    } // end function _headerInvoice

    private _FTX_ZZZ(nExtrins: Element[], arrExclude?: string[]) {
        if (!arrExclude) {
            arrExclude = this._arrExcludeZZZ;
        }
        for (let nExt of nExtrins) {
            let vName = this._v('@name', nExt);
            if (arrExclude.includes(vName)) {
                continue;
            }
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'ZZZ');
            this._setV(FTX, 401, vName);
            this._splitStr(FTX, this._v('', nExt), 4, 2, 5, 70);
        }
    }

    /**
     * TAX and MOA
     * @param nTaxDetail 
     * @param withAltAmount 
     */
    private _TaxDetail(nTaxDetail: Element, withAltAmount: boolean) {
        let vTaxCategory = this._v('@category', nTaxDetail)
        let TAX = this._initSegEdi('TAX', 7);
        let vTaxPurpose = this._v('@purpose', nTaxDetail);
        switch (vTaxPurpose) {
            case 'tax':
            case 'specialHandlingTax':
            case 'shippingTax':
                this._setV(TAX, 1, '7');
                break;
            case 'duty':
                this._setV(TAX, 1, '5');
                break;
        } // end switch
        if (vTaxPurpose == 'tax') {
            this._setV(TAX, 1, '7');
        } else {
            this._setV(TAX, 1, '5');
        }
        this._setV(TAX, 201, this._mci(MAPS.mapTAX5153, vTaxCategory));
        this._setV(TAX, 204, this._v('TaxLocation', nTaxDetail));
        let isTriangular = this._v('@isTriangularTransaction', nTaxDetail);
        if (isTriangular == 'yes') {
            this._setV(TAX, 301, 'TT');
        }
        this._setV(TAX, 4, this._v('TaxableAmount/Money', nTaxDetail));
        this._setV(TAX, 501, this._v('@taxRateType', nTaxDetail));
        this._setV(TAX, 504, this._v('@percentageRate', nTaxDetail));
        let vMappedExempt = this._mapExemept(nTaxDetail, nTaxDetail);
        this._setV(TAX, 6, vMappedExempt);
        // Max Length is 3, always too long ...
        //this._setTV(TAX, 7, this._vt2('Description', nTaxDetail));

        // MOA Should be "124" or "176"
        this._MOA(nTaxDetail, 'TaxAmount/Money', '124');
        if (withAltAmount) {
            this._MOA_Alt(nTaxDetail, 'TaxAmount/Money', '124');
        }
    }

    private _SG38_Modifications(nMod: Element) {
        let nAdditionalDeduction = this._e('AdditionalDeduction', nMod);
        let nAdditionalCost = this._e('AdditionalCost', nMod);
        let nModDetail = this._e('ModificationDetail', nMod);
        let ALC;
        if (nAdditionalDeduction) {
            ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'A');
        } else if (nAdditionalCost) {
            ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'C');
        } else {
            return;
        }
        this._setTV(ALC, 201, this._v('Description/ShortName', nModDetail));
        this._setV(ALC, 3, this._mci(MAPS.mapALC4471, this._v('Extrinsic [@name="settlementCode"]', nModDetail)));
        this._setV(ALC, 4, this._v('@level', nMod));
        let vName = this._v('@name', nModDetail);
        let vDesc = this._vt2('Description', nModDetail);
        if (this._mei(MAPS.mapALC7161, vName)) {
            this._setV(ALC, 501, this._mci(MAPS.mapALC7161, vName));
            this._setTV(ALC, 504, vDesc.substring(0, 35));
            if (vDesc.length > 35) {
                this._setTV(ALC, 505, vDesc.substring(35));
            }
        } else {
            this._setV(ALC, 501, 'ZZZ');
            this._setTV(ALC, 504, vDesc.substring(0, 35));
            this._setTV(ALC, 505, vName);
        }

        // DTM 194
        this._DTM_EDI(nModDetail, '@startDate', '194');
        // DTM 206
        this._DTM_EDI(nModDetail, '@startDate', '206');

        // SG40 Group 40
        // PCD
        if (nAdditionalDeduction) {
            let vPercent = this._v('DeductionPercent/@percent', nAdditionalDeduction);
            let PCD = this._initSegEdi('PCD', 1);
            this._setV(PCD, 101, '12');
            this._setV(PCD, 102, vPercent);
            this._setV(PCD, 103, '13');
        } else {
            let vPercent = this._v('Percentage/@percent', nAdditionalCost);
            let PCD = this._initSegEdi('PCD', 1);
            this._setV(PCD, 101, '12');
            this._setV(PCD, 102, vPercent);
            this._setV(PCD, 103, '13');
        }
        // SG41 Group 41
        // MOA 98
        this._MOA(nMod, 'OriginalPrice/Money', '98');

        // MOA 4
        this._MOA(nMod, 'DeductedPrice/Money', '4');

        // MOA 8 and MOA 204
        if (nAdditionalCost) {
            this._MOA(nAdditionalCost, 'Money', '8');
        } else {
            this._MOA(nAdditionalDeduction, 'Money', '204');
        }
        // MOA 25
        let vAllowanceCharge = this._v('Extrinsic [@name="allowanceChargeBasisAmount"]/Money', nModDetail);
        if (vAllowanceCharge) {
            this._MOA(nModDetail, 'Extrinsic [@name="allowanceChargeBasisAmount"]/Money', '25');
        }
        // SG43 Group 43
        let vTaxMoney = this._v('Tax/Money', nMod);
        if (vTaxMoney) {
            // TAX
            let TAX = this._initSegEdi('TAX', 7);
            this._setV(TAX, 1, '9');
            this._setTV(TAX, 7, this._vt2('Tax/Description', nMod));
            // MOA 176 
            this._MOA(nMod, 'Tax/Money', '176');
            this._MOA_Alt(nMod, 'Tax/Money', '176');
        }
        // TAX, still SG43 Group 43
        let nTaxDetails = this._es('Tax/TaxDetail [@purpose="tax" or @purpose="duty" ]', nMod);
        for (let nTaxDetail of nTaxDetails) {
            this._TaxDetail(nTaxDetail, true);
            this._LOC(nTaxDetail, 'Extrinsic [@name="taxJurisdiction"]', '157');
        } // end if nTaxDetail
    }
    private _LOC(nParent: Element, sXpath: string, sKey: string) {
        let val = this._v(sXpath, nParent);
        if (val) {
            let LOC = this._initSegEdi('LOC', 2);
            this._setV(LOC, 1, sKey);
            this._setV(LOC, 201, val);
        }
    }
    private _MOA(nItem: Element, sXpath: string, v101: string) {
        let val = this._v(sXpath, nItem);
        if (val) {
            let MOA = this._initSegEdi('MOA', 1);
            this._setV(MOA, 101, v101);
            this._setV(MOA, 102, val);
            this._setV(MOA, 103, this._v(sXpath + '/@currency', nItem));
            this._setV(MOA, 104, '4');
        }
    }
    /**
     * v104 is always '7' for AlternateAmount, so no need to be parameter
     * @param nItem 
     * @param sXpath 
     * @param v101 
     */
    private _MOA_Alt(nItem: Element, sXpath: string, v101: string) {
        let val = this._v(sXpath + '/@alternateAmount', nItem);
        if (val) {
            let MOA = this._initSegEdi('MOA', 1);
            this._setV(MOA, 101, v101);
            this._setV(MOA, 102, val);
            this._setV(MOA, 103, this._v(sXpath + '/@alternateCurrency', nItem));
            this._setV(MOA, 104, '7');
        }
    }

    private _PIA(nItemRef: Element) {
        let arrPIA5 = [];
        let arrPIA1 = [];
        // set PIA array
        this._PIA_Val(arrPIA5, arrPIA1, nItemRef);
        let idx: number = 0;
        let PIA;
        for (let arr of arrPIA5) {
            if (idx % 5 == 0) {
                PIA = this._initSegEdi('PIA', 6);
                this._setV(PIA, 1, '5');
            }
            let idxComp = idx % 5 + 2;
            this._setV(PIA, idxComp * 100 + 1, arr[0]);
            this._setV(PIA, idxComp * 100 + 2, arr[1]);
            idx++;
        }
        for (let arr of arrPIA1) {
            if (idx % 5 == 0) {
                PIA = this._initSegEdi('PIA', 6);
                this._setV(PIA, 1, '5');
            }
            let idxComp = idx % 5 + 2;
            this._setV(PIA, idxComp * 100 + 1, arr[0]);
            this._setV(PIA, idxComp * 100 + 2, arr[1]);
            idx++;
        }
    }

    private _PIA_Val(arrPIA5: any[], arrPIA1: any[], nItemRef: Element) {
        let vBuyerPartID = this._v('ItemID/BuyerPartID', nItemRef);
        if (vBuyerPartID) {
            arrPIA5.push([vBuyerPartID, 'BP']);
        }
        let vCC = this._v('Classification[@domain="UNSPSC"]/@code', nItemRef);
        if (vCC) {
            arrPIA1.push([vCC, 'CC']);
        }
        let vEANID = this._v('ItemDetailIndustry/ItemDetailRetail/EANID', nItemRef);
        if (vEANID) {
            arrPIA1.push([vEANID, 'EN']);
        }
        let vManufacturerPartID = this._v('ManufacturerPartID', nItemRef);
        if (vManufacturerPartID) {
            arrPIA5.push([vManufacturerPartID, 'MF']);
        }

        let vSerialNumber = this._v('@serialNumber', nItemRef);
        if (vSerialNumber) {
            arrPIA1.push([vSerialNumber, 'SN']);
        }

        let vProductIDUPC = this._v('ProductIDUPC', nItemRef);
        if (vProductIDUPC) {
            arrPIA1.push([vProductIDUPC, 'UP']);
        }

        let vSupplierPartID = this._v('ItemID/SupplierPartID', nItemRef);
        if (vSupplierPartID) {
            arrPIA5.push([vSupplierPartID, 'VN']);
        }

        let vSupplierPartAuxiliaryID = this._v('ItemID/SupplierPartAuxiliaryID', nItemRef);
        if (vSupplierPartAuxiliaryID) {
            arrPIA5.push([vSupplierPartAuxiliaryID, 'VS']);
        }

        // let vSupplierBatchID = this._v('SupplierBatchID', nItemRef);
        // if (vSupplierBatchID) {
        //     arrPIA1.push([vSupplierBatchID, 'NB']);
        // }

        let vEuropeanWasteCatalogID = this._v('ItemDetailIndustry/ItemDetailRetail/EuropeanWasteCatalogID', nItemRef);
        if (vEuropeanWasteCatalogID) {
            arrPIA1.push([vEuropeanWasteCatalogID, 'ZZZ']);
        }
        // let vClassOfGoodsNational = this._v('Extrinsic [@name="ClassOfGoodsNational"]', nItemRef);
        // if (vClassOfGoodsNational) {
        //     arrPIA1.push([vClassOfGoodsNational, 'GN']);
        // }
        // let vHarmonizedSystemID = this._v('HarmonizedSystemID', nItemRef);
        // if (vHarmonizedSystemID) {
        //     arrPIA1.push([vHarmonizedSystemID, 'HS']);
        // }

        // let vPromotionDealID = this._v('ShipNoticeItemIndustry/ShipNoticeItemRetail/PromotionDealID', nItemRef);
        // if (vPromotionDealID) {
        //     arrPIA1.push([vPromotionDealID, 'PV']);
        // }
    }
    private _mapExemept(nTaxParent, nExtParent) {
        let vExemptDetail = this._v('Tax/TaxDetail/@exemptDetail', nTaxParent);
        let vExemptType = this._v('Extrinsic[@name="exemptType"]', nExtParent);
        let vMappedExempt;
        let vExcemptLower = vExemptDetail.toLowerCase();
        if (vExcemptLower == 'exempt') {
            vMappedExempt = 'E';
        } else if (vExcemptLower == 'zerorated') {
            vMappedExempt = 'Z';
        } else if (vExemptType.toLowerCase() == 'mixed') {
            vMappedExempt = 'A';
        } else if (vExemptType.toLowerCase() == 'zerorated') {
            vMappedExempt = 'S';
        } else {
            vMappedExempt = '';
        }
        return vMappedExempt;
    }
    /**
     * For Business Partner type
     * @param sMappedRole 
     * @param ct 
     * @returns 
     */
    private _NAD(sMappedRole: string, ct: Element): EdiSegment {
        let sAddressID = this._v('@addressID', ct);
        let sAddressIDDomain = this._v('@addressIDDomain', ct);
        let sName = this._vs('Name', ct);
        let sDeliverTo = this._vs('PostalAddress/DeliverTo', ct);
        let sStreet = this._vs('PostalAddress/Street', ct);
        let sCity = this._v('PostalAddress/City', ct);
        let sIsoStateCode = this._v('PostalAddress/State/@isoStateCode', ct);
        let sState = this._v('PostalAddress/State', ct);
        let sPostalCode = this._v('PostalAddress/PostalCode', ct);
        let sCountryCode = this._v('PostalAddress/Country/@isoCountryCode', ct);
        let NAD = this._initSegEdi('NAD', 9);
        this._setV(NAD, 1, sMappedRole);
        if (sAddressID) {
            this._setV(NAD, 201, sAddressID);
            this._setV(NAD, 202, 'ZZZ'); // Should be "160" or "ZZZ"
            if (this._mes(MAPS.mapNAD3055, sAddressIDDomain)) {
                this._setV(NAD, 203, this._mcs(MAPS.mapNAD3055, sAddressIDDomain));
            } else {
                this._setV(NAD, 203, '92');
            }
        }
        this._splitStr(NAD, sName, 3, 1, 5, 35);
        this._splitStr(NAD, sDeliverTo, 4, 1, 5, 35);
        this._splitStr(NAD, sStreet, 5, 1, 4, 35);
        this._setV(NAD, 6, sCity);
        // if (this._mei(MAPS.mapNAD3229, sState)) {
        //     this._setV(NAD, 7, this._mci(MAPS.mapNAD3229, sState));
        // } else {
        //     this._setV(NAD, 7, sState);
        // }

        // Below is current CIG behavior, although I don't like it
        this._setV(NAD, 7, sIsoStateCode);

        this._setV(NAD, 8, sPostalCode);
        this._setV(NAD, 9, sCountryCode);
        return NAD;
    }

    private _CTA_COM(v1: string, v201: string, sName202: string, nAddress: Element): EdiSegment {
        if (!this._e('Phone', nAddress)
            && !this._e('Email', nAddress)
            && !this._e('Fax', nAddress)
            && !this._e('URL', nAddress)
        ) {
            return;
        }
        let CTA = this._initSegEdi('CTA', 2);
        this._setV(CTA, 1, v1);
        if (v201) {
            this._setV(CTA, 201, v201);
        }
        if (sName202) {
            this._setV(CTA, 202, sName202);
        } else {
            this._setV(CTA, 202, this._v('@name', nAddress));
        }

        // CTA Email
        let sEmail = this._v('Email', nAddress);
        if (sEmail) {
            let COM = this._initSegEdi('COM', 1);
            this._setV(COM, 101, sEmail);
            this._setV(COM, 102, 'EM');
        }

        // CTA Phone
        let sPhoneCountryCode = this._v('Phone/TelephoneNumber/CountryCode', nAddress);
        let sPhoneAreaOrCityCode = this._v('Phone/TelephoneNumber/AreaOrCityCode', nAddress);
        let sPhoneNumber = this._v('Phone/TelephoneNumber/Number', nAddress);
        if (sPhoneCountryCode || sPhoneAreaOrCityCode || sPhoneNumber) {
            // COM
            let COM = this._initSegEdi('COM', 1);
            let sVal = sPhoneCountryCode + '-' + sPhoneAreaOrCityCode + '-' + sPhoneNumber;
            sVal = this._trim(sVal);
            this._setV(COM, 101, sVal);
            this._setV(COM, 102, 'TE');
        }

        // CTA Fax
        let sFaxCountryCode = this._v('Fax/TelephoneNumber/CountryCode', nAddress);
        let sFaxAreaOrCityCode = this._v('Fax/TelephoneNumber/AreaOrCityCode', nAddress);
        let sFaxNumber = this._v('Fax/TelephoneNumber/Number', nAddress);
        if (sFaxCountryCode || sFaxAreaOrCityCode || sFaxNumber) {
            let COM = this._initSegEdi('COM', 1);
            let sVal = sFaxCountryCode + '-' + sFaxAreaOrCityCode + '-' + sFaxNumber;
            sVal = this._trim(sVal);
            this._setV(COM, 101, sVal);
            this._setV(COM, 102, 'FX');
        }

        // CTA URL
        let sURL = this._v('URL', nAddress);
        if (sURL) {
            let COM = this._initSegEdi('COM', 1);
            this._setV(COM, 101, sURL);
            this._setV(COM, 102, 'AH');
        }
        return CTA;

    }

    /**
     * Text length for each component is 70
     * @param FTX 
     * @param iCompStart 
     * @param sComments 
     */
    private _FTX(FTX: EdiSegment, iCompStart: number, sComments: string) {
        let iFTX = iCompStart;
        let nextStart = 0;
        const iCompLength = 70;
        while (nextStart < sComments.length) {
            if (iFTX >= 6) {
                break; // cannot exceed FTX 405;
            }
            this._setV(FTX, 400 + iFTX, EdiUtils.escapeEdi(sComments.substring(nextStart, nextStart + iCompLength)));
            nextStart += iCompLength;
            iFTX++;
        }
    }

}

class MAPS {
    static mapBGM1001: Object = {
        "lineleveldebitmemo": "80", // lineLevelDebitMemo
        "linelevelcreditmemo": "81", // lineLevelCreditMemo
        "standard": "380", // standard
        "creditmemo": "381", // creditMemo
        "debitmemo": "383", // debitMemo
        // "standard":"385", // standard  summary invoice   
    };
    static mapBGM1225: Object = {
        "new": "9", // original
        // "new": "31", // create => /InvoiceDetailRequestHeader/@isInformationOnly="yes"
        "delete": "3", // delete
    };

    static mapPAI4461: Object = {
        "ach": "2", // ach
        // "ach": "3", // ach
        "cash": "10", // cash
        "check": "20", // check
        "draft": "21", // draft
        "credittransfer": "30", // creditTransfer
        "debittransfer": "31", // debitTransfer
        "wire": "42", // wire
        "promissorynote": "60", // promissoryNote
        "creditoronthedebitor": "70", // creditorOnTheDebitor
        // "other": "any other EDIFACT value not in this list", // other
    }
    static mapNAD3035: Object = {
        "administrator": "AM", // administrator
        "technicalsupport": "AT", // technicalSupport
        "buyermasteraccount": "BI", // buyerMasterAccount
        "billto": "BT", // billTo
        "buyer": "IV", // buyer
        //"buyer": "BY", // 'BY' is OK too
        "carriercorporate": "CA", // carrierCorporate
        "corporateoffice": "CO", // corporateOffice
        "deliveryparty": "DP", // corporateOffice
        "correspondent": "DO", // correspondent
        "buyercorporate": "FD", // buyerCorporate
        "from": "FR", // from
        "issuerofinvoice": "II", // issuerOfInvoice
        "consignmentorigin": "LP", // consignmentOrigin
        "enduser": "OB", // orderedBy
        "purchasingagent": "PD", // purchasingAgent
        "taxrepresentative": "PK", // taxRepresentative
        "buyeraccount": "PO", // buyerAccount
        "remitto": "RE", // remitTo
        "billfrom": "RF", // billFrom
        "suppliermasteraccount": "RH", // supplierMasterAccount
        "sales": "SB", // sales
        "supplieraccount": "SE", // supplierAccount
        "shipfrom": "SF", // shipFrom
        "soldto": "SO", // soldTo
        "customerservice": "SR", // customerService
        "shipto": "ST", // shipTo
        "suppliercorporate": "SU", // supplierCorporate
        "subsequentbuyer": "UD", // subsequentBuyer
        "consignmentdestination": "UP", // consignmentDestination
        // "(role unspecified)": "ZZZ", // (role unspecified)
    };
    static mapNAD3035Shipping: Object = {
        "carriercorporate": "CA", // carrierCorporate
        "shipfrom": "SF", // shipFrom
        "shipto": "ST", // shipTo        
    }

    static mapNAD3055: Object = {
        "IATA": "3", // IATA
        "EANID": "9", // EANID
        "UIC": "12", // UIC
        "DUNS": "16", // DUNS
        // "SellerAssigned": "91",
        // "BuyerAssigned": "92",
        "SCAC": "182", // SCAC
    };

    static mapNAD3229: Object = {
        "alabama": "AL", // Alabama
        "alaska": "AK", // Alaska
        "american samoa": "AS", // American Samoa
        "arizona": "AZ", // Arizona
        "arkansas": "AR", // Arkansas
        "california": "CA", // California
        "colorado": "CO", // Colorado
        "connecticut": "CT", // Connecticut
        "delaware": "DE", // Delaware
        "district of columbia": "DC", // District of Columbia
        "florida": "FL", // Florida
        "georgia": "GA", // Georgia
        "hawaii": "HI", // Hawaii
        "idaho": "ID", // Idaho
        "illinois": "IL", // Illinois
        "indiana": "IN", // Indiana
        "iowa": "IA", // Iowa
        "kansas": "KS", // Kansas
        "kentucky": "KY", // Kentucky
        "louisiana": "LA", // Louisiana
        "maine": "ME", // Maine
        "maryland": "MD", // Maryland
        "massachusetts": "MA", // Massachusetts
        "michigan": "MI", // Michigan
        "minnesota": "MN", // Minnesota
        "mississippi": "MS", // Mississippi
        "missouri": "MO", // Missouri
        "montana": "MT", // Montana
        "nebraska": "NE", // Nebraska
        "nevada": "NV", // Nevada
        "new hampshire": "NH", // New Hampshire
        "new jersey": "NJ", // New Jersey
        "new mexico": "NM", // New Mexico
        "new york": "NY", // New York
        "north carolina": "NC", // North Carolina
        "north dakota": "ND", // North Dakota
        "ohio": "OH", // Ohio
        "oklahoma": "OK", // Oklahoma
        "oregon": "OR", // Oregon
        "pennsylvania": "PA", // Pennsylvania
        "puerto rico": "PR", // Puerto Rico
        "rhode island": "RI", // Rhode Island
        "south carolina": "SC", // South Carolina
        "south dakota": "SD", // South Dakota
        "tennessee": "TN", // Tennessee
        "texas": "TX", // Texas
        "utah": "UT", // Utah
        "vermont": "VT", // Vermont
        "virginia": "VA", // Virginia
        "washington": "WA", // Washington
        "west virginia": "WV", // West Virginia
        "wisconsin": "WI", // Wisconsin
        "wyoming": "WY", // Wyoming
        "alberta": "AB", // Alberta
        "british columbia": "BC", // British Columbia
        "manitoba": "MB", // Manitoba
        "new brunswick": "NB", // New Brunswick
        "newfoundland": "NL", // Newfoundland
        "nova scotia": "NS", // Nova Scotia
        "northwest territory": "NT", // Northwest Territory
        "nunavut": "NU", // Nunavut
        "ontario": "ON", // Ontario
        "prince edward island": "PE", // Prince Edward Island
        "quebec": "QC", // Quebec
        "saskatchewan": "SK", // Saskatchewan
        "yukon": "YT", // Yukon
        "victoria": "VIC", // Victoria
        "new south wales": "NSW", // New South Wales
        "queensland": "QLD", // Queensland
        "western australia": "WAU", // Western Australia
        "south australia": "SAU", // South Australia
        "tasmania": "TAS", // Tasmania
        "northern territory": "NTE", // Northern Territory
        "australian capital territory": "ACT", // Australian Capital Territory
        "hokkaido": "Hokkaido", // Hokkaido
        "aomori": "Aomori", // Aomori
        "iwate": "Iwate", // Iwate
        "miyagi": "Miyagi", // Miyagi
        "akita": "Akita", // Akita
        "yamagata": "Yamagata", // Yamagata
        "fukushima": "Fukushima", // Fukushima
        "ibaraki": "Ibaraki", // Ibaraki
        "tochigi": "Tochigi", // Tochigi
        "gunma": "Gunma", // Gunma
        "saitama": "Saitama", // Saitama
        "chiba": "Chiba", // Chiba
        "tokyo": "Tokyo", // Tokyo
        "kangawa": "Kangawa", // Kangawa
        "niigata": "Niigata", // Niigata
        "toyama": "Toyama", // Toyama
        "ishikawa": "Ishikawa", // Ishikawa
        "fukui": "Fukui", // Fukui
        "yamanashi": "Yamanashi", // Yamanashi
        "nagano": "Nagano", // Nagano
        "gifu": "Gifu", // Gifu
        "shizuoka": "Shizuoka", // Shizuoka
        "aichi": "Aichi", // Aichi
        "mie": "Mie", // Mie
        "shiga": "Shiga", // Shiga
        "kyoto": "Kyoto", // Kyoto
        "osaka": "Osaka", // Osaka
        "hyogo": "Hyogo", // Hyogo
        "nara": "Nara", // Nara
        "wakayama": "Wakayama", // Wakayama
        "tottori": "Tottori", // Tottori
        "shimane": "Shimane", // Shimane
        "okayama": "Okayama", // Okayama
        "hiroshima": "Hiroshima", // Hiroshima
        "yamaguchi": "Yamaguchi", // Yamaguchi
        "tokushima": "Tokushima", // Tokushima
        "kagawa": "Kagawa", // Kagawa
        "kochi": "Kochi", // Kochi
        "fukuoka": "Fukuoka", // Fukuoka
        "saga": "Saga", // Saga
        "nagasaki": "Nagasaki", // Nagasaki
        "kumamoto": "Kumamoto", // Kumamoto
        "oita": "Oita", // Oita
        "miyazaki": "Miyazaki", // Miyazaki
        "kagoshima": "Kagoshima", // Kagoshima
        "okinawa": "Okinawa", // Okinawa
        "eastern cape": "Eastern Cape", // Eastern Cape
        "free state": "Free State", // Free State
        "gauteng": "Gauteng", // Gauteng
        "kwazulu-natal": "KwaZulu-Natal", // KwaZulu-Natal
        "mpumalanga": "Mpumalanga", // Mpumalanga
        "north west": "North West", // North West
        "northern cape": "Northern Cape", // Northern Cape
        "northern province": "Northern Province", // Northern Province
        "western cape": "Western Cape", // Western Cape
    }

    static mapRFF1153: Object = {
        "reference": "ACD", // reference
        "abaroutingnumber": "ACK", // abaRoutingNumber
        "membernumber": "AGU", // memberNumber
        "creditorrefid": "AHL", // creditorRefID
        "suppliertaxid": "AHP", // supplierTaxID
        "transactionreference": "AIH", // transactionReference
        "accountreceivableid": "AP", // accountReceivableID
        "accountpayableid": "AV", // accountPayableID
        "fiscalnumber": "FC", // fiscalNumber
        "governmentnumber": "GN", // governmentNumber
        "vendornumber": "IA", // vendorNumber
        "companycode": "IT", // companyCode
        "accountid": "PY", // accountID
        "bankroutingid": "RT", // bankRoutingID
        "contactperson": "SA", // contactPerson
        "departmentname": "SD", // departmentName
        "taxexemptionid": "TL", // taxExemptionID
        "vatid": "VA", // vatID
    }

    static mapTAX5153: Object = {
        "other": "AAA", // other
        // "other": "AAB", // other
        // "other": "AAC", // other
        // "other": "ADD", // other
        // "other": "BOL", // other
        // "other": "CAP", // other
        // "other": "CAR", // other
        // "other": "COC", // other
        // "other": "CST", // other
        // "other": "CUD", // other
        // "other": "CVD", // other
        // "other": "ENV", // other
        // "other": "EXC", // other
        // "other": "EXP", // other
        // "other": "FET", // other
        // "other": "FRE", // other
        // "other": "GCN", // other
        "gst": "GST", // gst
        // "other": "ILL", // other
        // "other": "IMP", // other
        "withholdingtax": "IND", // withholdingTax
        // "other": "LAC", // other
        // "other": "LCN", // other
        // "other": "LDP", // other
        "sales": "LOC", // sales
        // "other": "LST", // other
        // "other": "MCA", // other
        // "other": "MCD", // other
        // "other": "OTH", // other
        // "other": "PDB", // other
        // "other": "PDC", // other
        // "other": "PRF", // other
        // "other": "SCN", // other
        // "other": "SSS", // other
        // "sales": "STT", // sales
        // "other": "SUP", // other
        // "other": "SUR", // other
        // "other": "SWT", // other
        // "other": "TAC", // other
        // "other": "TOT", // other
        // "other": "TOX", // other
        // "other": "TTA", // other
        // "other": "VAD", // other
        "vat": "VAT", // vat
    };

    static mapALC7161: Object = {
        "advertisingallowance": "AA", // AdvertisingAllowance
        "returnedgoodscharges": "AAB", // ReturnedGoodsCharges
        "charge": "ABK", // Charge
        "packagingsurcharge": "ABL", // PackagingSurcharge
        "carrier": "ABP", // Carrier
        "allowance": "ACA", // Allowance
        "royalties": "ADI", // Royalties
        "shipping ": "ADK", // Shipping 
        "otherservices": "ADR", // OtherServices
        "fullpalletordering": "ADS", // FullPalletOrdering
        "pickup": "ADT", // PickUp
        "adjustment": "AJ", // Adjustment
        "cashdiscount": "CAC", // CashDiscount
        "contractallowance": "CL", // ContractAllowance
        "earlypaymentallowance": "EAB", // EarlyPaymentAllowance
        "freightbasedondollarminimum": "FAC", // FreightBasedOnDollarMinimum
        "freight": "FC", // Freight
        "financecharge": "FI", // FinanceCharge
        "handling": "HD", // Handling
        "insurance": "IN", // Insurance
        "promotionalallowance": "PAD", // PromotionalAllowance
        "quantitydiscount": "QD", // QuantityDiscount
        "rebate": "RAA", // Rebate
        "surcharge": "SC", // Surcharge
        "discount-special": "SF", // Discount-Special
        "truckloaddiscount": "TAE", // TruckloadDiscount
        "tradediscount": "TD", // TradeDiscount
        "tax": "TX", // Tax
        "volume discount": "VAB", // Volume Discount
    };
    static mapALC4471: Object = {
        "billback": "1", // billBack
        "offinvoice": "2", // offInvoice
        "vendorcheck": "3", // vendorCheck
        "creditcustomer": "4", // creditCustomer
        "paidbyvendor": "5", // paidByVendor
        "paidbycustomer": "6", // paidByCustomer
        "bornebypayee": "13", // borneByPayee
        "eachpayowncost": "14", // eachPayOwnCost
        "bornebypayor": "15", // borneByPayor
    };
    static mapPAC7075: Object = {
        "inner": "1", // inner
        "intermediate": "2", // intermediate
        "outer": "3", // outer
    };
    static mapMEA6313: Object = {
        "unitnetweight": "AAA", // unitNetWeight
        "unitgrossweight": "AAB", // unitGrossWeight
        "weight": "AAC", // weight
        "grossweight": "AAD", // grossWeight
        "grossvolume": "AAW", // grossVolume
        "volume": "AAX", // volume
        "height": "HT", // height
        "length": "LN", // length
        "width": "WD", // width        
        //"other": "ZZZ", // other
    };


}