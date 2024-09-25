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
 * If cXML/Request/OrderRequest/OrderRequestHeader/@type='new' (ORDERS)
 * If cXML/Request/OrderRequest/OrderRequestHeader/@type='update or delete' (ORDCHG)
 *and if not  cXML/Request/OrderRequest/ItemOut/ReleaseInfo/@releaseType='forecast' (DELFOR)
 *and If not cXML/Request/OrderRequest/ItemOut//@agreementType='scheduling_agreement'  (DELJIT)												
 *
 */
export class cvt_Order_ORDCHG extends XmlConverterBase {
    protected _convertErrs: ConvertErr[];
    protected _bHideAmount = false;
    protected _bHideUnitPrice = false;
    protected _sContactPerson = '';

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
        this._UNB('ORDERS', true);

        const nRequestHeader = this._rn('/OrderRequest/OrderRequestHeader');
        const nOrderReq = this._rn('/OrderRequest');
        let sOrderType = this._v('@orderType', nRequestHeader);
        let sOrderID = this._v('@orderID', nRequestHeader);
        let sType = this._v('@type', nRequestHeader);

        // UNH
        let UNH = this._initSegEdi('UNH', 2);
        this._setV(UNH, 1, this._sUniqueRefGP); // Sequential counter throughout message (UNB) Starting at "1"
        this._setV(UNH, 201, 'ORDCHG');
        this._setV(UNH, 202, 'D');
        this._setV(UNH, 203, '96A');
        this._setV(UNH, 204, 'UN');

        // BGM
        let BGM = this._initSegEdi('BGM', 4);
        this._setV(BGM, 101, '632');
        this._setV(BGM, 101, MAPS.mapBGM1001[sOrderType]);
        this._setV(BGM, 104, MAPS.mapBGM1000[sOrderType]);
        this._setV(BGM, 2, sOrderID);
        this._setV(BGM, 3, MAPS.mapBGM1225[sType]);
        this._setV(BGM, 4, 'AB');

        // DTM 
        this._DTM_EDI(nRequestHeader, '@orderDate', '4');
        this._DTM_EDI(nRequestHeader, '@effectiveDate', '7');
        this._DTM_EDI(nRequestHeader, '@expirationDate', '36');
        this._DTM_EDI(nRequestHeader, '@pickUpDate', '200');
        this._DTM_EDI(nRequestHeader, '@requestedDeliveryDate', '2');
        this._DTM_EDI(nRequestHeader, 'DeliveryPeriod/Period/@startDate', '64');
        this._DTM_EDI(nRequestHeader, 'DeliveryPeriod/Period/@endDate', '63');

        // ROOT_FTXs
        this._Root_FTXs(nRequestHeader);

        // SG1 Group1
        this._SG1_RFF_DTM(nRequestHeader);

        // SG3
        let BPs = this._es('BusinessPartner', nRequestHeader);
        for (let bp of BPs) {
            let sRole = this._v('@role', bp);
            this._NAD(this._mci(MAPS.mapNAD3035, sRole), bp)
            // SG2 SG3 Group3
            // RFF
            this._BP_IDRef(bp);
            // RFF ZZZ, Extrinsics
            this._BP_Extrinsic(bp);
            this._CTA('IC', '', this._mci(MAPS.mapNAD3035, sRole), this._e('Address', bp));
        } // end loop for BPs

        // SG4 BT
        let addressBT = this._e('BillTo', nRequestHeader);
        this._NAD('BT', addressBT);
        this._BP_IDRef(addressBT);

        // SG4 Group3 VA
        let sExtBuyerVatID = this._v('Extrinsic[@name="buyerVatID"]', nRequestHeader);
        if (sExtBuyerVatID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'VA');
            this._setV(RFF, 102, sExtBuyerVatID);
        }
        // SG6 CTA AP
        this._CTA('AP', '', '', this._e('Address', addressBT));

        // SG3 ST
        let addressST = this._e('ShipTo', nRequestHeader);
        this._NAD('ST', addressST);

        // ST LOC, IDRef
        this._BP_LOC(addressST);
        this._BP_IDRef(addressST);
        this._CTA('GR', '', '', this._e('Address', addressST));

        // SG3 NAD DP
        let addressDP = this._e('TermsOfDelivery', nRequestHeader);
        this._NAD('ST', addressDP);

        // SG5 Group5 CTA DL
        this._CTA('DL', '', '', this._e('Address', addressDP));

        // SG3 Group3 RFF for supplierVatID          
        let vExtVA = this._v('/Extrinsic/@name="supplierVatID"', nRequestHeader);

        // ContactPerson
        this._sContactPerson = this._v('Contact/IdReference [@domain="ContactPerson"] /@identifier', nRequestHeader);
        // SG3 General Contact
        let nContacts = this._es('Contact', nRequestHeader);
        for (let nCon of nContacts) {
            let sRole = this._v('@role', nCon);
            let sEdiRole = this._mci(MAPS.mapNAD3035, sRole);
            let NAD = this._NAD_Contact(sEdiRole, nCon);
            this._Contact_IDRef(nCon); // for common domain in Map        

            // RFF
            if (vExtVA) {
                let RFF = this._initSegEdi('RFF', 1);
                this._setV(RFF, 101, 'VA');
                this._setV(RFF, 102, vExtVA);
            }

            // CTA
            let sCTARole = 'OC';
            if (this._mei(MAPS.mapCTA3139, sRole)) {
                sCTARole = this._mci(MAPS.mapCTA3139, sRole);
            }
            let v201 = this._v('IdReference [@domain="ContactDepartmentID"] /@identifier', nCon);
            let vName = this._v('@name', nCon);
            if (!vName) {
                vName = this._sContactPerson;
            }
            let CTA = this._CTA(sCTARole, v201, vName, nCon);
        } // end loop nContacts

        // SG7
        let nTax = this._e('Tax', nRequestHeader);
        if (nTax) {
            let nTaxD = this._e('TaxDetail', nTax);
            // TAX
            let TAX = this._initSegEdi('TAX', 7);
            let vPurpose = this._v('/@purpose', nTaxD);
            if (vPurpose == 'tax') {
                this._setV(TAX, 1, '7');
            } else if (vPurpose == 'duty') {
                this._setV(TAX, 1, '5');
            }
            let vCategory = this._v('@category', nTaxD);
            let v201 = this._mci(MAPS.mapTAX5153, vCategory);
            if (v201) {
                this._setV(TAX, 201, v201);
            } else {
                this._setV(TAX, 201, 'OTH');
            }

            this._setV(TAX, 204, this._v('TaxLocation', nTaxD));
            this._setV(TAX, 301, this._v('@isVatRecoverable', nTaxD));
            this._setV(TAX, 4, this._v('TaxableAmount/Money', nTaxD));
            let sTriangular = this._v('@isTriangularTransaction', nTaxD);
            if (sTriangular == 'yes') {
                this._setV(TAX, 501, 'TT');
            }
            this._setV(TAX, 504, this._v('@percentageRate', nTaxD));
            let v5305L = this._v('@exemptDetail', nTaxD).toLowerCase();
            if (v5305L == 'exempt') {
                this._setV(TAX, 6, 'E');
            } else if (v5305L == 'zerorated') {
                this._setV(TAX, 6, 'Z');
            }
            if (sTriangular == 'yes') {
                this._setV(TAX, 7, this._v('Description', nTaxD));
            }

            // MOA
            let nMoney = this._e('TaxAmount/Money', nTaxD);
            if (nMoney) {
                let MOA = this._initSegEdi('MOA', 1);
                this._setV(MOA, 101, '124');
                this._setV(MOA, 102, this._v('', nMoney));
                this._setV(MOA, 103, this._v('@currency', nMoney));
                this._setV(MOA, 104, '9');
            }
        }// end if nTax exists

        // SG8 CUX
        let nMoney = this._e('Total/Money', nRequestHeader);
        let sCurr = this._v('@currency', nMoney);
        let sAltCurr = this._v('@alternateCurrency', nMoney);
        if (sCurr) {
            let CUX = this._initSegEdi('CUX', 2);
            this._setV(CUX, 101, '2');
            this._setV(CUX, 102, sCurr);
            this._setV(CUX, 103, '9');
            if (sAltCurr) {
                this._setV(CUX, 201, '3');
                this._setV(CUX, 202, sAltCurr);
                this._setV(CUX, 203, '7');
            }
        }

        // SG9 PAT
        let nPaymentTerm = this._e('PaymentTerm', nRequestHeader);
        if (nPaymentTerm) {
            // PAT
            let PAT = this._initSegEdi('PAT', 3);
            let vDiscount = this._v('Discount', nPaymentTerm);
            if (vDiscount) {
                this._setV(PAT, 1, '22');
            } else {
                this._setV(PAT, 1, '20');
            }
            this._setV(PAT, 301, '5');
            this._setV(PAT, 302, '3');
            this._setV(PAT, 303, 'D');
            this._setV(PAT, 304, this._v('@payInNumberOfDays', nPaymentTerm));

            // PCD
            let PCD = this._initSegEdi('PCD', 1);
            if (vDiscount) {
                this._setV(PCD, 101, '12');
                // Hardcode to "0" by Default. If Discount is present, then map from cXML
                this._setV(PCD, 102, this._v('Discount/DiscountPercent/@percent', nPaymentTerm));
            } else {
                this._setV(PCD, 101, '15');
                this._setV(PCD, 102, '0');
            }
            this._setV(PCD, 103, '13');

            // MOA
            let nMoney = this._e('Discount/DiscountAmount/Money', nPaymentTerm);
            if (nMoney) {
                let MOA = this._initSegEdi('MOA', 1);
                this._setV(MOA, 101, '52');
                this._setV(MOA, 102, this._v('', nMoney));
                this._setV(MOA, 103, this._v('@currency', nMoney));
                this._setV(MOA, 104, '9');
            }
        } // end if nPaymentTerm exists

        // SG10
        let nShipTo = this._e('ShipTo', nRequestHeader);
        if (nShipTo) {
            // TDT
            let TDT = this._initSegEdi('TDT', 7);
            this._setV(TDT, 1, '20');
            let vMethod = this._v('TransportInformation/Route/@method', nShipTo);
            let v301 = this._mci(MAPS.mapTDT8067, vMethod);
            this._setV(TDT, 301, v301);
            this._setV(TDT, 302, vMethod);
            this._setV(TDT, 402, this._v('TransportInformation/Route/@means', nShipTo));
            this._setV(TDT, 501, this._v('CarrierIdentifier/@domain', nShipTo));
            this._setV(TDT, 504, this._v('CarrierIdentifier', nShipTo));
            this._setV(TDT, 701, 'ZZZ');
            this._setV(TDT, 702, 'ZZZ');
            this._setV(TDT, 703, this._v('TransportInformation/ShippingContractNumber', nShipTo));
        } // end if nShipTo

        // SG12
        let nTOD = this._e('TermsOfDelivery', nRequestHeader);
        if (nTOD) {
            let TOD = this._initSegEdi('TOD', 3);
            this._setV(TOD, 1, this._mci(MAPS.mapTOD4055, this._v('TermsOfDeliveryCode/@value', nTOD)));
            this._setV(TOD, 2, this._mci(MAPS.mapTOD4215, this._v('ShippingPaymentMethod/@value', nTOD), 'ZZZ'));
            this._setV(TOD, 301, this._mci(MAPS.mapTOD4215, this._v('TransportTerms/@value', nTOD), 'ZZZ'));
            this._setV(TOD, 304, this._v('Comments [@type="TermsOfDelivery"]', nTOD));
            this._setV(TOD, 305, this._v('Comments [@type="Transport"]', nTOD));
        }

        // SG16
        let vShipComplete = this._v('@shipComplete', nRequestHeader);
        if (vShipComplete == 'yes') {
            // SCC
            let SCC = this._initSegEdi('SCC', 2);
            this._setV(SCC, 1, '1');
            this._setV(SCC, 2, 'SC');
        }

        let nShipping = this._e('Shipping', nRequestHeader);
        // SG19, Shipping
        if (nShipping) {
            // ALC
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'C');
            this._setV(ALC, 201, this._v('@trackingDomain', nShipping))
            this._setV(ALC, 501, 'SAA');
            // or use _extractText function?
            this._setV(ALC, 504, this._v('Description', nShipping))
            this._setV(ALC, 505, this._v('@trackingId', nShipping))

            // MOA
            let nMoneys = this._es(XML.Money, nShipping);
            for (let nMoney of nMoneys) {
                let MOA = this._initSegEdi('MOA', 1);
                this._setV(MOA, 101, '23');
                this._setV(MOA, 102, this._v('', nMoney));
                this._setV(MOA, 103, this._v('@currency', nMoney));
                this._setV(MOA, 104, '9');
                let sAltAmt = this._v('@alternateAmount', nMoney);
                // Alternate
                if (sAltAmt) {
                    MOA = this._initSegEdi('MOA', 1);
                    this._setV(MOA, 101, '23');
                    this._setV(MOA, 102, this._v('@alternateAmount', nMoney));
                    this._setV(MOA, 103, this._v('@alternateCurrency', nMoney));
                    this._setV(MOA, 104, '7');
                }
            }
        }// end if nShipping

        // SG19, also include SG19,SG21
        this._SG19_Modification(nRequestHeader);

        // hideAmount
        if (this._v('Extrinsic [@name="hideAmount"]', nRequestHeader)) {
            this._bHideAmount = true;
        }
        // hideUnitPrice
        if (this._v('Extrinsic [@name="hideUnitPrice"]', nRequestHeader)) {
            this._bHideUnitPrice = true;
        }


        let nItemOuts = this._es('ItemOut', nOrderReq);
        // SG26
        nItemOuts = nItemOuts ?? [];
        for (let nItemOut of nItemOuts) {
            this._SG26(nItemOut);
        }

        for (let nItemOut of nItemOuts) {
            let nScheduleLines = this._es('ScheduleLine', nItemOut);
            nScheduleLines = nScheduleLines ?? [];
            // create new LIN for subcomponents
            this._SG26_SubComponent(nItemOut, nScheduleLines)
        }
        // Summary
        // UNS
        let UNS = this._initSegEdi('UNS', 1);
        this._setV(UNS, 1, 'S');
        // MOA 128 Frist Currency
        let vMoney = this._v('Total/Money', nRequestHeader);
        if (vMoney) {
            let MOA = this._initSegEdi('MOA', 1);
            this._setV(MOA, 101, '128');
            if (this._bHideAmount) {
                this._setV(MOA, 102, '0.00');
            } else {
                this._setV(MOA, 102, vMoney);
            }
            this._setV(MOA, 103, this._v('Total/Money/@currency', nRequestHeader));
            this._setV(MOA, 104, '9');
        }
        // MOA 128 Alternate Currency
        vMoney = this._v('Total/Money/@alternateAmount', nRequestHeader);
        if (vMoney) {
            let MOA = this._initSegEdi('MOA', 1);
            this._setV(MOA, 101, '128');
            if (this._bHideAmount) {
                this._setV(MOA, 102, '0.00');
            } else {
                this._setV(MOA, 102, vMoney);
            }
            this._setV(MOA, 103, this._v('Total/Money/@alternateCurrency', nRequestHeader));
            this._setV(MOA, 104, '7');
        }

        // MOA 124 Tax
        vMoney = this._v('Tax/Money', nRequestHeader);
        if (vMoney) {
            let MOA = this._initSegEdi('MOA', 1);
            this._setV(MOA, 101, '124');
            if (this._bHideAmount) {
                this._setV(MOA, 102, '0.00');
            } else {
                this._setV(MOA, 102, vMoney);
            }
            this._setV(MOA, 103, this._v('Tax/Money/@currency', nRequestHeader));
            this._setV(MOA, 104, '9');
        }

        // CNT
        let CNT = this._initSegEdi('CNT', 1);
        this._setV(CNT, 101, '2');
        // count of number of /OrderRequest/ItemOut
        this._setV(CNT, 102, nItemOuts.length.toString());

        this._tidySegCascade();
        const output = this._segs.join(constants.ediDocument.lineBreak);
        return output;
    }

    /**
     * 
     */
    private _SG26(nItemOut: Element) {
        // LIN
        let LIN = this._initSegEdi('LIN', 4);
        let vLineNumber = this._v('@lineNumber', nItemOut);
        // trim 00010 => 10
        vLineNumber = this._trimIntStr(vLineNumber);
        this._setV(LIN, 101, vLineNumber);
        //  Hardcode to "2" 
        // [Only if  /OrderRequest/OrderRequestHeader/@type = "update" and 
        // /OrderRequest/ItemOut/@operation = "delete"]
        this._setV(LIN, 102, '2');
        this._setV(LIN, 301, this._v('ItemID/SupplierPartID', nItemOut));
        this._setV(LIN, 302, 'VN');

        let vParentLineNum = this._v('@parentLineNumber', nItemOut);
        if (vParentLineNum) {
            this._setV(LIN, 401, '1');
            this._setV(LIN, 402, this._trimIntStr(vParentLineNum));
        }

        let nItemDetail = this._e('ItemDetail', nItemOut);
        let nBlanketItemDetail = this._e('BlanketItemDetail', nItemOut);
        let nCommonItemDetail = nItemDetail;
        if (nBlanketItemDetail) {
            nCommonItemDetail = nBlanketItemDetail; // take precedency
        }
        // PIA
        this._SG26_PIA(nItemOut, nItemDetail);


        // IMD_E
        let vLang = this._v('Description/@xml:lang', nCommonItemDetail);
        vLang = vLang ? vLang : 'en';
        let vShortName = this._v('Description/ShortName', nCommonItemDetail);
        if (vShortName) {
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'E');
            this._splitStr(IMD, vShortName, 3, 4, 5, 70);
            this._setV(IMD, 306, vLang);
        }
        // IMD_F
        let vDesc = this._v('Description', nCommonItemDetail);
        if (vDesc) {
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'F');
            this._splitStr(IMD, vDesc, 3, 4, 5, 70);
            this._setV(IMD, 306, vLang);
        }
        // @isConfigurableMaterial ="yes"
        let vConfigMaterial = this._v('ItemDetailIndustry/@isConfigurableMaterial', nItemDetail);
        if (vConfigMaterial == 'yes') {
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'E');
            this._setV(IMD, 301, 'Configurable');
        }
        let vDomain = this._v('ItemDetailIndustry/ItemDetailRetail/Characteristic/@domain', nItemDetail);
        if (vDomain && this._mei(MAPS.mapIMD7081, vDomain)) {
            // IMD
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'B');
            this._setV(IMD, 2, this._mcs(MAPS.mapIMD7081, vDomain));
            this._setV(IMD, 3, this._v('ItemDetailIndustry/ItemDetailRetail/Characteristic/@value', nItemDetail));
        }

        // MEA
        let nDimensions = this._es('Dimension', nItemDetail);
        for (let nDim of nDimensions) {
            let vType = this._v('@type', nDim);
            let MEA = this._initSegEdi('MEA', 3);
            this._setV(MEA, 1, 'AAE');
            if (this._mes(MAPS.mapMEA6313, vType)) {
                this._setV(MEA, 201, this._mci(MAPS.mapMEA6313, vType));
            } else {
                this._setV(MEA, 201, 'ZZZ');
            }
            this._setV(MEA, 301, this._v('UnitOfMeasure', nDim));
            this._setV(MEA, 302, this._v('@quantity', nDim));
        }

        // QTY 21
        let vQuantity = this._v('@quantity', nItemOut);
        if (vQuantity) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '21');
            this._setV(QTY, 102, this._trimIntStr(vQuantity));
            this._setV(QTY, 103, this._v('UnitOfMeasure', nCommonItemDetail));
        }
        // QTY 54
        let vMaxQuan = this._v('MaxQuantity', nBlanketItemDetail);
        if (vMaxQuan) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '54');
            this._setV(QTY, 102, vMaxQuan);
            this._setV(QTY, 103, this._v('UnitOfMeasure', nBlanketItemDetail));
        }
        // QTY 53
        let vMinQuan = this._v('MinQuantity', nBlanketItemDetail);
        if (vMinQuan) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '53');
            this._setV(QTY, 102, vMinQuan);
            this._setV(QTY, 103, this._v('UnitOfMeasure', nBlanketItemDetail));
        }

        // ALI
        let vSpendDetail = this._v('SpendDetail', nItemOut);
        if (vSpendDetail) {
            let ALI = this._initSegEdi('ALI', 3);
            this._setV(ALI, 3, '94');
        }
        // DTM 2
        let vRequestedDeliveryDate = this._v('@requestedDeliveryDate', nItemOut);
        if (vRequestedDeliveryDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '2');
            this._setV(DTM, 102, Utils.dateStr304TZ(vRequestedDeliveryDate, 'GM'));
            this._setV(DTM, 103, '304');
        }
        // DTM 10
        let vRequestedShipmentDate = this._v('@requestedShipmentDate', nItemOut);
        if (vRequestedShipmentDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '10');
            this._setV(DTM, 102, Utils.dateStr304TZ(vRequestedShipmentDate, 'GM'));
            this._setV(DTM, 103, '304');
        }
        // DTM 169
        let vLeadTime = this._v('LeadTime', nItemDetail);
        if (vLeadTime) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '169');
            this._setV(DTM, 102, vLeadTime);
            this._setV(DTM, 103, '304');
        }

        // MOA 179
        let vMaxAmount = this._v('MaxAmount/Money', nBlanketItemDetail);
        if (vMaxAmount) {
            let MOA = this._initSegEdi('MOA', 1);
            this._setV(MOA, 101, '179');
            if (this._bHideAmount) {
                this._setV(MOA, 102, '0.00');
            } else {
                this._setV(MOA, 102, vMaxAmount);
            }
            this._setV(MOA, 103, this._v('MaxAmount/Money/@currency', nBlanketItemDetail));
            this._setV(MOA, 104, '9');
        }
        // MOA 173
        let vMinAmount = this._v('MinAmount/Money', nBlanketItemDetail);
        if (vMinAmount) {
            let MOA = this._initSegEdi('MOA', 1);
            this._setV(MOA, 101, '173');
            if (this._bHideAmount) {
                this._setV(MOA, 102, '0.00');
            } else {
                this._setV(MOA, 102, vMinAmount);
            }
            this._setV(MOA, 103, this._v('MinAmount/Money/@currency', nBlanketItemDetail));
            this._setV(MOA, 104, '9');
        }
        // MOA 146
        if (!this._bHideUnitPrice) {
            let vMoney1 = this._v('UnitPrice/Money', nItemDetail);
            let vUOM1 = this._v('UnitPrice/Money/@currency', nItemDetail);
            let vMoney2 = this._v('UnitPrice/Money', nBlanketItemDetail);
            let vUOM2 = this._v('UnitPrice/Money/@currency', nBlanketItemDetail);
            let MOA: EdiSegment;
            if (vMoney1 || vMoney2) {
                MOA = this._initSegEdi('MOA', 1);
                this._setV(MOA, 101, '146');
                this._setV(MOA, 104, '9');
            }
            if (vMoney1) {
                this._setV(MOA, 102, vMoney1);
                this._setV(MOA, 103, vUOM1);
            }
            if (vMoney2) {
                this._setV(MOA, 102, vMoney2);
                this._setV(MOA, 103, vUOM2);
            }
        } // end if !this._bHideUnitPrice

        // MOA 176
        let vMoney = this._v('Tax/Money', nItemOut)
        if (vMoney) {
            let MOA176 = this._initSegEdi('MOA', 1);
            this._setV(MOA176, 101, '176');
            if (this._bHideAmount) {
                this._setV(MOA176, 102, '0.00');
            } else {
                this._setV(MOA176, 102, vMoney);
            }
            this._setV(MOA176, 103, this._v('Tax/Money/@currency', nItemOut));
            this._setV(MOA176, 104, '9');
        }

        // SG26 FTX
        this._SG26_FTX(nItemOut, nItemDetail, nBlanketItemDetail);

        // SG27 CCI
        let nClassification1s = this._es('Classification', nItemDetail);
        let nClassification2s = this._es('Classification', nBlanketItemDetail);
        nClassification1s.push(...nClassification2s);
        for (let nClass of nClassification1s) {
            if (!nClass) {
                continue;
            }
            let vDomain = this._v('@domain', nClass);
            if (!vDomain) {
                continue;
            }
            let CCI = this._initSegEdi('CCI', 3);
            this._setV(CCI, 301, this._v('', nClass));
            this._setV(CCI, 304, vDomain);
        }

        // SG30
        // Without IG-2442
        // If an Extrinsic /OrderRequest/OrderRequestHeader/Extrinsic/@name=hideUnitPrice" is exists, 
        // then don't map  group 30
        if (!this._bHideUnitPrice) {
            let nPriceBasisQuantity1 = this._e('PriceBasisQuantity', nItemDetail);
            let nPriceBasisQuantity2 = this._e('PriceBasisQuantity', nBlanketItemDetail);

            for (let nBasisQuant of [nPriceBasisQuantity1, nPriceBasisQuantity2]) {
                if (!nBasisQuant) {
                    continue;
                }
                // PRI
                let PRI = this._initSegEdi('PRI', 1);
                this._setV(PRI, 101, 'CAL');
                this._setV(PRI, 104, 'PBQ');
                // APR
                let APR = this._initSegEdi('APR', 3);
                this._setV(APR, 1, 'WS');
                this._setV(APR, 201, this._v('@conversionFactor', nBasisQuant));
                this._setV(APR, 202, 'CSD');
                // RNG
                let RNG = this._initSegEdi('RNG', 2);
                this._setV(RNG, 1, '4');
                this._setV(RNG, 201, this._v('UnitOfMeasure', nBasisQuant));
                this._setV(RNG, 202, this._v('@quantity', nBasisQuant));
                this._setV(RNG, 203, this._v('@quantity', nBasisQuant));
            } // end for loop nBasisQuant

        } // end if !this._bHideUnitPrice

        // SG31
        this._SG26_SG31(nItemOut, nItemDetail, nBlanketItemDetail);

        // SG32 Packaging
        let nPackings = this._es('Packaging', nItemOut);
        nPackings = nPackings ?? [];
        for (let nPack of nPackings) {
            this._SG26_SG32_Packaging(nPack);
        }
        // SG32 Batch
        let nBatchs = this._es('Batch', nItemOut);
        nBatchs = nBatchs ?? [];
        for (let nBatch of nBatchs) {
            this._SG26_SG32_Batch(nBatch);
        }

        // SG36
        let nTaxDetails = this._es('Tax/TaxDetail', nItemOut);
        nTaxDetails = nTaxDetails ?? [];
        for (let nTaxD of nTaxDetails) {
            // TAX
            let TAX = this._initSegEdi('TAX', 7);
            let vPurpose = this._v('@purpose', nTaxD);
            if (vPurpose == 'tax') {
                this._setV(TAX, 1, '7');
            } else if (vPurpose == 'duty') {
                this._setV(TAX, 1, '5');
            }
            let vCategory = this._v('@category', nTaxD);
            if (this._mei(MAPS.mapTAX5153, vCategory)) {
                this._setV(TAX, 201, this._mci(MAPS.mapTAX5153, vCategory));
            } else {
                this._setV(TAX, 201, 'OTH');
            }
            this._setV(TAX, 204, this._v('TaxLocation', nTaxD))
            this._setV(TAX, 301, this._v('@isVatRecoverable', nTaxD));
            this._setV(TAX, 4, this._v('TaxableAmount/Money', nTaxD));
            let bIsTraiangular = false;
            if (this._v('@isTriangularTransaction', nTaxD) == 'yes') {
                bIsTraiangular = true;
            }
            if (bIsTraiangular) {
                this._setV(TAX, 501, 'TT');
            }
            this._setV(TAX, 504, this._v('@percentageRate', nTaxD));
            // TODO, from TaxDetail or Extrinsic ?
            let v5305L = this._v('@exemptDetail', nTaxD).toLowerCase();
            if (v5305L == 'exempt') {
                this._setV(TAX, 6, 'E');
            } else if (v5305L == 'zerorated') {
                this._setV(TAX, 6, 'Z');
            }
            if (bIsTraiangular) {
                this._setV(TAX, 7, this._v('Description', nTaxD));
            }
            // MOA
            let vMoney = this._v('TaxAmount/Money', nTaxD);
            if (vMoney) {
                let MOA = this._initSegEdi('MOA', 1);
                this._setV(MOA, 101, '124');
                this._setV(MOA, 102, vMoney);
                this._setV(MOA, 103, this._v('TaxAmount/Money/@currency', nTaxD));
                this._setV(MOA, 104, '9');
            }
        } // end loop nTaxDetails for SG34

        // SG37
        // SG37 MF
        let vManufacturerName = this._v('ManufacturerName', nItemDetail);
        if (vManufacturerName) {
            let NAD = this._initSegEdi('NAD', 3);
            this._setV(NAD, 1, 'MF');
            this._splitStr(NAD, vManufacturerName, 3, 1, 5, 35);
        }
        // SG37 SU
        let vSupplierID = this._v('SupplierID', nItemOut);
        if (vSupplierID) {
            let NAD = this._initSegEdi('NAD', 2);
            this._setV(NAD, 1, 'SU');
            let vDomainLower = this._v('SupplierID/@domain', nItemOut).toLowerCase();
            if (vDomainLower == 'duns') {
                this._setV(NAD, 203, '16');
            } else if (vDomainLower == 'aribanetworkid') {
                this._setV(NAD, 203, 'ZZZ');
            }
        } // end if vSupplierID
        // SG37 DP
        let nTOD = this._e('TermsOfDelivery', nItemOut);
        if (nTOD) {
            this._NAD('DP', nTOD);
        }
        // SG37 ST
        let nShipTo = this._e('ShipTo', nItemOut);
        if (nShipTo) {
            this._NAD('ST', nShipTo);

            // SG37 SG38
            let vDomain = this._v('IdReference/@domain', nShipTo);
            if (vDomain) {
                let RFF = this._initSegEdi('RFF', 1);
                if (this._mei(MAPS.mapNAD1153, vDomain)) {
                    this._setV(RFF, 101, this._mci(MAPS.mapNAD1153, vDomain));
                }
                this._setV(RFF, 102, this._v('IdReference', nShipTo));
            }
            // SG37 SG38 SG40 GR
            this._CTA('GR', '', '', this._e('Address', nShipTo));
        }

        // SG37, General Contact
        let nContacts = this._es('Contact', nItemOut);
        nContacts = nContacts ?? [];
        for (let nContact of nContacts) {
            let vRole = this._v('@role', nContact);
            let vMappedRole = this._mci(MAPS.mapNAD3035, vRole);
            this._NAD_Contact(vMappedRole, nContact);

            // SG37 SG38
            this._Contact_IDRef(nContact);

            // SG37 SG40 GR
            let vName = this._v('@name', nContact);
            if (!vName) {
                vName = this._sContactPerson;
            }
            this._CTA('GR', '', vName, nContact);
        } // end loop nContacts

        // SG43 C
        let nShipping = this._e('Shipping', nItemOut);
        if (nShipping) {
            // ALC
            let ALC = this._initSegEdi('ALC', 5);
            // AdditionalCost
            this._setV(ALC, 1, 'C');
            this._setV(ALC, 201, this._v('@trackingDomain', nShipping));
            this._setV(ALC, 501, 'SAA');
            let sShortName = this._v('Description/ShortName', nShipping);
            this._setV(ALC, 504, sShortName);
            this._setV(ALC, 505, this._v('@trackingId', nShipping));

            // SG43 SG44
            // MOA
            let vMoney = this._v('Money', nShipping);
            let vMoneyCurr = this._v('Money/@currency', nShipping);
            if (vMoney) {
                let MOA = this._initSegEdi('MOA', 1);
                this._setV(MOA, 101, '23');
                this._setV(MOA, 102, vMoney);
                this._setV(MOA, 103, vMoneyCurr);
                this._setV(MOA, 104, '9');
            }
        } // end if nShipping SG41 C

        // SG43 N
        let nDistribution = this._e('Distribution', nItemOut);
        if (nDistribution) {
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, 'N');
            this._setV(ALC, 501, 'ADT');
            this._setV(ALC, 502, '175');
            this._setV(ALC, 503, '92');
            let nSegs = this._es('Accounting/AccountingSegment', nDistribution);
            let arrIds = [];
            let arrDesc = [];
            for (let nSeg of nSegs) {
                arrIds.push(this._v('@id', nSeg));
                arrDesc.push(this._v('@description', nSeg));
            }
            this._setV(ALC, 504, arrIds.join('-'));
            this._setV(ALC, 504, arrDesc.join(''));

            // SG43 N  SG44
            // MOA
            let vMoney = this._v('Charge/Money', nDistribution);
            let vMoneyCurr = this._v('Charge/Money/@currency', nDistribution);
            if (vMoney) {
                let MOA = this._initSegEdi('MOA', 1);
                this._setV(MOA, 101, '54');
                this._setV(MOA, 102, vMoney);
                this._setV(MOA, 103, vMoneyCurr);
                this._setV(MOA, 104, '9');
            }
        } // end if nDiestribution, SG41 N

        // SG43  "A" for /AdditionalDeduction and "C" for /AdditionalCost
        let nMods = this._es('UnitPrice/Modifications/Modification', nItemDetail);
        nMods = nMods ?? [];
        for (let nMod of nMods) {
            let nAD = this._e('AdditionalDeduction', nMod);
            let nAC = this._e('AdditionalCost', nMod);
            let sQualifier = '';
            if (nAD) {
                sQualifier = 'A'
            } else if (nAC) {
                sQualifier = 'C'
            }
            let vModName = this._v('ModificationDetail/@name', nMod);
            let vModDesc = this._v('ModificationDetail/Description', nMod);
            // ALC
            let ALC = this._initSegEdi('ALC', 5);
            this._setV(ALC, 1, sQualifier);
            this._setV(ALC, 501, this._mci(MAPS.mapALC7161, vModName));
            this._splitStr(ALC, vModDesc, 5, 4, 5, 35);
            // DTM
            let vStartDate = this._v('ModificationDetail/@startDate', nMod);
            let vEndDate = this._v('ModificationDetail/@endDate', nMod);
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

            // SG43 PCD
            let PCD = this._initSegEdi('PCD', 5);
            this._setV(PCD, 101, '3');
            if (nAD) {
                this._setV(PCD, 102, this._v('DeductionPercent/@percent', nAD));
            } else {
                // AdditionalCost
                this._setV(PCD, 102, this._v('Percentage/@percent', nAC));
            }
            this._setV(PCD, 103, '13');

            // SG44 MOA OriginalPrice
            // MOA OriginalPrice
            let vMoney = this._v('OriginalPrice/Money', nMod);
            if (vMoney) {
                let MOA = this._initSegEdi('MOA', 1);
                this._setV(MOA, 101, '98');
                this._setV(MOA, 102, vMoney);
                this._setV(MOA, 103, this._v('OriginalPrice/Money/@currency', nMod));
                this._setV(MOA, 104, '9');
            }
            // MOA Price
            if (nAD) {
                let vMoney = this._v('DeductedPrice/Money', nAD);
                if (vMoney) {
                    let MOA = this._initSegEdi('MOA', 1);
                    this._setV(MOA, 101, '4');
                    this._setV(MOA, 102, vMoney);
                    this._setV(MOA, 103, this._v('DeductedPrice/Money/@currency', nAD));
                    this._setV(MOA, 104, '9');
                }
            }
            // MOA Amount
            vMoney = '';
            let vCurrency = '';
            if (nAD) {
                // AdditionalDeduction
                vMoney = this._v('DeductionAmount/Money', nAD);
                vCurrency = this._v('DeductionAmount/Money/@currency', nAD);
            } else {
                // AdditionalCost
                vMoney = this._v('Money', nAC);
                vCurrency = this._v('Money/@currency', nAC);

            }
            if (vMoney) {
                let MOA = this._initSegEdi('MOA', 1);
                this._setV(MOA, 101, '8');
                this._setV(MOA, 104, '9');
                this._setV(MOA, 102, vMoney);
                this._setV(MOA, 103, vCurrency);
            }


        } // end loop for Modifications, SG39

        // SG47
        if (nShipTo) {
            // TDT
            let TDT = this._initSegEdi('TDT', 7);
            this._setV(TDT, 1, '20');
            let vMethod = this._v('TransportInformation/Route/@method', nShipTo);
            let v301 = this._mci(MAPS.mapTDT8067, vMethod);
            this._setV(TDT, 301, v301);
            this._setV(TDT, 302, vMethod);
            this._setV(TDT, 402, this._v('TransportInformation/Route/@means', nShipTo));
            this._setV(TDT, 501, this._v('CarrierIdentifier/@domain', nShipTo));
            this._setV(TDT, 504, this._v('CarrierIdentifier', nShipTo));
            this._setV(TDT, 701, 'ZZZ');
            this._setV(TDT, 702, 'ZZZ');
            this._setV(TDT, 703, this._v('TransportInformation/ShippingContractNumber', nShipTo));
        } // end if nShipTo

        // SG49
        if (nTOD) {
            let TOD = this._initSegEdi('TOD', 3);
            this._setV(TOD, 1, this._mci(MAPS.mapTOD4055, this._v('TermsOfDeliveryCode/@value', nTOD)));
            this._setV(TOD, 2, this._mci(MAPS.mapTOD4215, this._v('ShippingPaymentMethod/@value', nTOD)));
            this._setV(TOD, 301, this._mci(MAPS.mapTOD4215, this._v('TransportTerms/@value', nTOD)));
            this._setV(TOD, 304, this._v('Comments [@type="TermsOfDelivery"]', nTOD));
            this._setV(TOD, 305, this._v('Comments [@type="Transport"]', nTOD));
        }

        // SG51
        let nScheduleLines = this._es('ScheduleLine', nItemOut);
        nScheduleLines = nScheduleLines ?? [];
        for (let nSched of nScheduleLines) {
            // SCC
            let SCC = this._initSegEdi('SCC', 1);
            let vCode = this._v('ScheduleLineReleaseInfo/@commitmentCode', nSched)
            this._setV(SCC, 1, this._mci(MAPS.mapSCC4017, vCode));
            let vLineNum = this._v('@lineNumber', nSched);
            if (vLineNum) {
                // RFF
                let RFF = this._initSegEdi('RFF', 1);
                this._setV(RFF, 101, 'AAN');
                this._setV(RFF, 103, vLineNum);
            }

            // SG51 SG52
            let vQTY = this._v('@quantity', nSched);
            if (vQTY) {
                let QTY = this._initSegEdi('QTY', 1);
                this._setV(QTY, 101, '21');
                this._setV(QTY, 102, this._trimIntStr(vQTY));
                this._setV(QTY, 103, this._v('UnitOfMeasure', nSched));
            }
            // SG52 DTM
            let vRequestedDeliveryDate = this._v('@requestedDeliveryDate', nSched);
            let vDeliveryWindow = this._v('@deliveryWindow', nSched);
            if (!vDeliveryWindow) {
                vDeliveryWindow = '0';
            }
            if (vRequestedDeliveryDate) {
                // DTM , type=718
                let dateRequestedDeliveryDate = Utils.parseToDateSTD2(vRequestedDeliveryDate);
                if (dateRequestedDeliveryDate) {
                    let endDate = new Date(dateRequestedDeliveryDate);
                    endDate.setDate(dateRequestedDeliveryDate.getDate() + Number.parseInt(vDeliveryWindow));
                    let DTM = this._initSegEdi('DTM', 1);
                    this._setV(DTM, 101, '2');
                    this._setV(DTM, 102, Utils.getYYYYMMDD(dateRequestedDeliveryDate)
                        + '-' + Utils.getYYYYMMDD(endDate));
                    this._setV(DTM, 103, '718');

                } // end if dateRequestedDeliveryDate
                // DTM 76
                let DTM = this._initSegEdi('DTM', 1);
                this._setV(DTM, 101, '76');
                this._setV(DTM, 102, Utils.dateStr304TZ(vRequestedDeliveryDate, 'GM'));
                this._setV(DTM, 103, '304');
            } // end if vRequestedDeliveryDate

            let vRequestedShipmentDate = this._v('@requestedShipmentDate', nSched);
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '10');
            this._setV(DTM, 102, Utils.dateStr304TZ(vRequestedShipmentDate, 'GM'));
            this._setV(DTM, 103, '304');

            // SG50
            vQTY = this._v('ScheduleLineReleaseInfo/@cumulativeScheduledQuantity', nSched);
            if (vQTY) {
                let QTY = this._initSegEdi('QTY', 1);
                this._setV(QTY, 101, '3');
                this._setV(QTY, 102, this._trimIntStr(vQTY));
                this._setV(QTY, 103, this._v('ScheduleLineReleaseInfo/UnitOfMeasure', nSched));
            }
        } // end loop nScheduleLines
    } // end functioin _SG25

    /**
     *    SUBCONTRACTING COMPONENTS			
    * "Create this SG25 LIN loop only, if /ItemOut/ScheduleLine/SubcontractingComponent is available.  
    * Create it right after the SG25 LIN loop mapped from the related /ItemOut.
    * Please refer to sheets ""cXML Sample ORDERS"" and ""SubcontractingComponent"" for more details.
    * Each /ItemOut/ScheduleLine/SubcontractingComponent 
    * creates a new SG25 LIN loop under the respective /ItemOut SG25 LIN loop."
    * 
    */
    private _SG26_SubComponent(nItemOut: Element, nScheduleLines: Element[]) {

        for (let nSched of nScheduleLines) {
            let nSubcontractingComponents = this._es('SubcontractingComponent', nSched);
            if (!nSubcontractingComponents || nSubcontractingComponents.length == 0) {
                continue;
            }
            let vSchedLineNum = this._v('@lineNumber', nSched);
            for (let nSubComp of nSubcontractingComponents) {
                // LIN
                let LIN = this._initSegEdi('LIN', 6);
                this._setV(LIN, 301, this._v('ComponentID', nSubComp));
                this._setV(LIN, 302, 'AB');
                this._setV(LIN, 401, '1');
                this._setV(LIN, 402, this._v('@lineNumber', nItemOut));
                this._setV(LIN, 6, 'A');
                // PIA
                let arrPIA5 = [];
                let arrPIA1 = [];
                let vSupplierPartID = this._v('Product/SupplierPartID', nSubComp);
                if (vSupplierPartID) {
                    arrPIA5.push([vSupplierPartID, 'VN']);
                }
                let vBuyerPartID = this._v('Product/BuyerPartID', nSubComp);
                if (vBuyerPartID) {
                    arrPIA5.push([vBuyerPartID, 'BP']);
                }
                let vSupplierPartAuxiliaryID = this._v('Product/SupplierPartAuxiliaryID', nSubComp);
                if (vSupplierPartAuxiliaryID) {
                    arrPIA1.push([vSupplierPartAuxiliaryID, 'VS']);
                }
                let vProductRevisionID = this._v('ProductRevisionID', nSubComp);
                if (vProductRevisionID) {
                    arrPIA1.push([vProductRevisionID, 'DR']);
                }
                if (arrPIA5.length > 0) {
                    let iEle = 2;
                    let PIA = this._initSegEdi('PIA', 5);
                    this._setV(PIA, 1, '5');
                    for (let arrLine of arrPIA5) {
                        this._setV(PIA, iEle * 100 + 1, arrLine[0]);
                        this._setV(PIA, iEle * 100 + 2, arrLine[1]);
                        iEle++;
                    }
                } // end if arrPIA5.length > 0
                if (arrPIA1.length > 0) {
                    let iEle = 2;
                    let PIA = this._initSegEdi('PIA', 5);
                    this._setV(PIA, 1, '1'); // TODO, or '5' ?
                    for (let arrLine of arrPIA1) {
                        this._setV(PIA, iEle * 100 + 1, arrLine[0]);
                        this._setV(PIA, iEle * 100 + 2, arrLine[1]);
                        iEle++;
                    }
                } // end if arrPIA1.length > 0

                // IMD ShortName
                let vLang = this._v('Description/@xml:lang', nSubComp);
                let vShortName = this._v('Description/ShortName', nSubComp);
                if (vShortName) {
                    let IMD = this._initSegEdi('IMD', 3);
                    this._setV(IMD, 101, 'E');
                    this._splitStr(IMD, vShortName, 3, 4, 5, 70)
                    this._setV(IMD, 306, vLang);
                }
                // IMD Desc
                let vDesc = this._v('Description', nSubComp);
                if (vDesc) {
                    let IMD = this._initSegEdi('IMD', 3);
                    this._setV(IMD, 101, 'F');
                    this._splitStr(IMD, vDesc, 3, 4, 5, 70)
                    this._setV(IMD, 306, vLang);
                }
                // QTY
                let vQTY = this._v('@quantity', nSubComp);
                if (vQTY) {
                    let QTY = this._initSegEdi('QTY', 1);
                    this._setV(QTY, 101, '163');
                    this._setV(QTY, 102, this._trimIntStr(vQTY));
                    this._setV(QTY, 103, this._v('UnitOfMeasure', nSubComp));
                }
                // DTM
                let vReqDate = this._v('@requirementDate', nSubComp);
                if (vReqDate) {
                    let DTM = this._initSegEdi('DTM', 1);
                    this._setV(DTM, 101, '318');
                    this._setV(DTM, 102, Utils.dateStr304TZ(vReqDate, 'GM'));
                    this._setV(DTM, 103, '304');
                }

                // SG29 subComponent RFF
                if (vSchedLineNum) {
                    // RFF
                    let RFF = this._initSegEdi('RFF', 1);
                    this._setV(RFF, 101, 'AAN');
                    this._setV(RFF, 103, vSchedLineNum);
                }

                // SG29 RFF ACJ
                let vMaterialProvisionIndicator = this._v('@materialProvisionIndicator', nSubComp);
                this._RFF_KV('ACJ', vMaterialProvisionIndicator);

                // SG30 Map this loop SG30 only if ItemOut/ScheduleLine/SubcontractingComponent/Batch is available
                let nBatch = this._e('Batch', nSubComp);
                if (nBatch) {
                    this._SG26_SG32_SubComp_Batch(nBatch);
                }

            } // end loop nSubcontractingComponents
        } // end loop nScheduleLines for SubcontractingComponent
    }

    private _SG26_SG32_SubComp_Batch(nBatch: Element) {
        // PAC
        let PAC = this._initSegEdi('PAC', 4);
        this._setV(PAC, 1, '0');
        this._setV(PAC, 401, 'A');
        this._setV(PAC, 402, 'batchInformation');
        // QTY
        let vBatchQ = this._v('@batchQuantity', nBatch);
        if (vBatchQ) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '21');
            this._setV(QTY, 102, vBatchQ);
        }
        // DTM 36 expirationDate
        let vExpDate = this._v('@expirationDate', nBatch);
        if (vExpDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '36');
            this._setV(DTM, 102, Utils.dateStr304TZ(vExpDate, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // DTM 94 productionDate
        let vProdDate = this._v('@productionDate', nBatch);
        if (vProdDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '94');
            this._setV(DTM, 102, Utils.dateStr304TZ(vProdDate, 'GM'));
            this._setV(DTM, 103, '304');
        }
        // DTM 351 inspectionDate
        let vInspDate = this._v('@inspectionDate', nBatch);
        if (vInspDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '351');
            this._setV(DTM, 102, Utils.dateStr304TZ(vInspDate, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // SG26 SG32 SG33
        // RFF
        let vShelfLife = this._v('@shelfLife', nBatch);
        if (vShelfLife) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'BT');
            this._setV(RFF, 102, this._v('@originCountryCode', nBatch));
            this._setV(RFF, 104, vShelfLife);
        }
        // SG26 SG32 SG33
        let arrGIN_Lines = [];
        let vBuyerBatchID = this._v('BuyerBatchID', nBatch);
        let vSupplierBatchID = this._v('SupplierBatchID', nBatch);
        if (vBuyerBatchID) {
            arrGIN_Lines.push([vBuyerBatchID, '92']);
        }
        if (vSupplierBatchID) {
            arrGIN_Lines.push([vSupplierBatchID, '91']);
        }
        if (arrGIN_Lines.length > 0) {
            // PCI
            let PCI = this._initSegEdi('PCI', 1);
            this._setV(PCI, 1, '10');
            // GIN
            let GIN = this._initSegEdi('GIN', arrGIN_Lines.length + 2);
            this._setV(GIN, 1, 'BX');
            let iComp = 2;
            for (let arrLine of arrGIN_Lines) {
                this._setV(GIN, iComp * 100 + 1, arrLine[0]);
                this._setV(GIN, iComp * 100 + 2, arrLine[1]);
                iComp++;
            }
        }

    } // end function _SG25_SG32_SubComp_Batch

    private _SG26_SG32_Batch(nBatch: Element) {
        // PAC
        let PAC = this._initSegEdi('PAC', 4);
        this._setV(PAC, 1, '0');
        this._setV(PAC, 401, 'A');
        this._setV(PAC, 402, 'batchInformation');
        // QTY
        let vBatchQ = this._v('@batchQuantity', nBatch);
        if (vBatchQ) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '21');
            this._setV(QTY, 102, vBatchQ);
        }
        // DTM 36 expirationDate
        let vExpDate = this._v('@expirationDate', nBatch);
        if (vExpDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '36');
            this._setV(DTM, 102, Utils.dateStr304TZ(vExpDate, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // DTM 94 productionDate
        let vProdDate = this._v('@productionDate', nBatch);
        if (vProdDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '94');
            this._setV(DTM, 102, Utils.dateStr304TZ(vProdDate, 'GM'));
            this._setV(DTM, 103, '304');
        }
        // DTM 351 inspectionDate
        let vInspDate = this._v('@inspectionDate', nBatch);
        if (vInspDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '351');
            this._setV(DTM, 102, Utils.dateStr304TZ(vInspDate, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // SG26 SG32 SG33
        // RFF
        let vShelfLife = this._v('@shelfLife', nBatch);
        if (vShelfLife) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'BT');
            this._setV(RFF, 102, this._v('@originCountryCode', nBatch));
            this._setV(RFF, 104, vShelfLife);
        }
        // SG26 SG32 SG34
        let arrGIN_Lines = [];
        let vBuyerBatchID = this._v('BuyerBatchID', nBatch);
        let vSupplierBatchID = this._v('SupplierBatchID', nBatch);
        if (vBuyerBatchID) {
            arrGIN_Lines.push([vBuyerBatchID, '92']);
        }
        if (vSupplierBatchID) {
            arrGIN_Lines.push([vSupplierBatchID, '91']);
        }
        if (arrGIN_Lines.length > 0) {
            // PCI
            let PCI = this._initSegEdi('PCI', 1);
            this._setV(PCI, 1, '10');
            // GIN
            let GIN = this._initSegEdi('GIN', arrGIN_Lines.length + 2);
            this._setV(GIN, 1, 'BX');
            let iComp = 2;
            for (let arrLine of arrGIN_Lines) {
                this._setV(GIN, iComp * 100 + 1, arrLine[0]);
                this._setV(GIN, iComp * 100 + 2, arrLine[1]);
                iComp++;
            }
        }

    } // end function _SG25_SG30_Batch

    private _SG26_SG32_Packaging(nPack: Element) {
        // PAC
        let PAC = this._initSegEdi('PAC', 4);
        this._setV(PAC, 1, '1');
        let vPackagingLevelCode = this._v('PackagingLevelCode', nPack);
        this._setV(PAC, 201, this._mci(MAPS.mapPAC7075, vPackagingLevelCode));
        this._setV(PAC, 301, this._v('PackageTypeCodeIdentifierCode', nPack));
        this._setV(PAC, 304, this._v('ShippingContainerSerialCodeReference', nPack));
        this._setV(PAC, 401, 'A');
        let vDesc = this._v('Description', nPack);
        this._setV(PAC, 402, vDesc);
        this._setV(PAC, 403, 'ZZZ');
        vDesc = vDesc.substring(70);
        if (vDesc) {
            this._setV(PAC, 404, vDesc);
            this._setV(PAC, 405, 'ZZZ');
        }
        // MEA
        let nDimensions = this._es('Dimension', nPack);
        nDimensions = nDimensions ?? [];
        for (let nDim of nDimensions) {
            let MEA = this._initSegEdi('MEA', 3);
            let vType = this._v('@type', nDim);
            this._setV(MEA, 1, 'AAE');
            this._setV(MEA, 201, this._mci(MAPS.mapMEA6313, vType));
            this._setV(MEA, 301, this._v('UnitOfMeasure', nDim));
            this._setV(MEA, 302, this._v('@quantity', nDim));
        }
        // QTY 21
        let vOrderedQ = this._v('OrderedQuantity/@quantity', nPack);
        if (vOrderedQ) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '21');
            this._setV(QTY, 102, vOrderedQ);
            this._setV(QTY, 103, this._v('OrderedQuantity/UnitOfMeasure', nPack));
        }
        // QTY 12
        let vDispatchQ = this._v('DispatchQuantity/@quantity', nPack);
        if (vDispatchQ) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '12');
            this._setV(QTY, 102, vDispatchQ);
            this._setV(QTY, 103, this._v('DispatchQuantity/UnitOfMeasure', nPack));
        }
        // QTY 192
        let vFreeGoodsQ = this._v('FreeGoodsQuantity/@quantity', nPack);
        if (vFreeGoodsQ) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '192');
            this._setV(QTY, 102, vFreeGoodsQ);
            this._setV(QTY, 103, this._v('FreeGoodsQuantity/UnitOfMeasure', nPack));
        }

        // SG26 SG32 SG33
        // RFF AAS
        let vPackageTrackingID = this._v('PackageID/PackageTrackingID', nPack);
        if (vPackageTrackingID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'AAS');
            this._setV(RFF, 102, vPackageTrackingID);
        }

        // SG26 SG32 SG34
        // PCI
        let vShippingMark = this._v('ShippingMark', nPack);
        if (vShippingMark) {
            let PCI = this._initSegEdi('PCI', 2);
            this._setV(PCI, 1, '30');
            this._setV(PCI, 201, vShippingMark);
        }
        // GIN
        let vShippingContainerSerialCode = this._v('ShippingContainerSerialCode', nPack);
        if (vShippingContainerSerialCode) {
            let GIN = this._initSegEdi('GIN', 2);
            this._setV(GIN, 1, 'AW');
            this._setV(GIN, 201, vShippingContainerSerialCode);
        }
    } // end function _SG26_SG32_Packaging

    private _SG26_SG31(nItemOut: Element, nItemDetail: Element, nBlanketItemDetail: Element) {
        // RFF FI
        let vItemType = this._v('@itemType', nItemOut);
        if (vItemType) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'FI');
            this._setV(RFF, 102, vItemType);
            this._setV(RFF, 104, this._v('@compositeItemType', nItemOut));
        }
        // RFF CT
        let nMasterAgree = this._e('MasterAgreementIDInfo', nItemOut);
        if (nMasterAgree) {
            // RFF
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'CT');
            this._setV(RFF, 102, this._v('@agreementID', nMasterAgree));
            if (this._v('@agreementType', nMasterAgree) == 'scheduling_agreement') {
                this._setV(RFF, 103, '1');
            }
            // DTM
            let vDate = this._v('@agreementDate', nMasterAgree);
            if (vDate) {
                let DTM = this._initSegEdi('DTM', 1);
                this._setV(DTM, 101, '126');
                this._setV(DTM, 102, Utils.dateStr304TZ(vDate, 'GM'));
                this._setV(DTM, 103, '304');
            }
        } // end if nMasterAgree
        // RFF AGI
        let vRequisitionID = this._v('@requisitionID', nItemOut);
        if (vRequisitionID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'AGI');
            this._setV(RFF, 102, vRequisitionID);
        }
        // RFF PD
        let vPromotionDealID = this._v('ItemOutIndustry/ItemOutRetail/PromotionDealID', nItemOut);
        if (vPromotionDealID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'PD');
            this._setV(RFF, 102, vPromotionDealID);
        }
        // RFF ALQ
        let vReturnAuthorizationNumber = this._v('@returnAuthorizationNumber', nItemOut);
        if (vReturnAuthorizationNumber) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ALQ');
            this._setV(RFF, 102, vReturnAuthorizationNumber);
        }
        // RFF VA TODO:
        let vDesc = this._v('Tax/TaxDetail/Description', nItemOut);
        if (vDesc) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'VA');
            this._setV(RFF, 102, vDesc);
        }
        // DTM 131
        this._DTM_EDI(nItemOut, 'Tax/TaxDetail/@taxPointDate', '131');
        // DTM 140
        this._DTM_EDI(nItemOut, 'Tax/TaxDetail/@paymentDate', '140');

    }
    private _SG26_FTX(nItemOut: Element, nItemDetail: Element, nBlanketItemDetail: Element) {
        // FTX AAK
        let vDesc1 = this._v('PriceBasisQuantity/Description', nItemDetail);
        let vDesc2 = this._v('PriceBasisQuantity/Description', nBlanketItemDetail);
        let vLang: string;
        let vDesc: string;
        if (vDesc1) {
            vDesc = vDesc1;
            vLang = this._v('PriceBasisQuantity/Description/@xml:lang', nItemDetail);
        } else {
            vDesc = vDesc2;
            vLang = this._v('PriceBasisQuantity/Description/@xml:lang', nBlanketItemDetail);
        }
        vLang = vLang ? vLang : 'en';
        if (vDesc) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'AAK');
            this._splitStr(FTX, vDesc, 4, 1, 5, 70);
            this._setV(FTX, 5, vLang);
        }
        // FTX AAI,ACB(not URL)
        let nComments = this._es('Comments', nItemOut);
        nComments = nComments ?? [];
        let iIndex = 0;
        for (let nComm of nComments) {
            if (iIndex == 0) {
                // first one, use AAI
                let FTX = this._initSegEdi('FTX', 5);
                this._setV(FTX, 1, 'AAI');
                let v = this._v('', nComm);
                this._splitStr(FTX, v, 4, 1, 5, 70); // component 1 - 5
                this._setV(FTX, 5, this._v('@xml:lang', nComm));
            } else {
                // from second, use ACB
                let FTX = this._initSegEdi('FTX', 5);
                this._setV(FTX, 1, 'ACB');
                let v = this._v('', nComm);
                this._setV(FTX, 401, this._v('@type', nComm))
                this._splitStr(FTX, v, 4, 2, 5, 70); // component 2 - 5
                this._setV(FTX, 5, this._v('@xml:lang', nComm));
            }
            iIndex++;
        }// end loop nComments
        // FTX ACB(URL)
        let vURL = this._v('URL', nItemDetail);
        if (vURL) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'ACB');
            this._setV(FTX, 401, 'URL');
            this._setV(FTX, 402, this._v('URL/@name', nItemDetail));
            this._splitStr(FTX, vURL, 4, 3, 5, 70);
        }
        // FTX ZZZ
        let nExtrins = this._es(XML.Extrinsic, nItemDetail);
        nExtrins = nExtrins ?? [];
        let nExtrins2 = this._es(XML.Extrinsic, nBlanketItemDetail);
        nExtrins.push(...nExtrins2);
        for (let nExt of nExtrins) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'ZZZ');
            this._setV(FTX, 401, this._v('@name', nExt));
            this._splitStr(FTX, this._v('', nExt), 4, 2, 5, 70);
        }
        // FTX TDT
        vDesc = this._v('ShipTo/TransportInformation/ShippingInstructions/Description', nItemOut);
        if (vDesc) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'TDT');
            this._splitStr(FTX, vDesc, 4, 1, 5, 70);
            this._setV(FTX, 5,
                this._v('ShipTo/TransportInformation/ShippingInstructions/Description/@xml:lang', nItemOut));
        }

        // FTX TXD
        vDesc = this._v('Tax/Description', nItemOut);
        if (vDesc) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'TXD');
            this._splitStr(FTX, vDesc, 4, 1, 5, 70);
            this._setV(FTX, 5,
                this._v('Tax/Description/@xml:lang', nItemOut));
        }
        // FTX AAR_TDC
        let vCode = this._v('TermsOfDelivery/TermsOfDeliveryCode [@value="Other"]', nItemOut);
        if (vCode) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'AAR');
            this._setV(FTX, 301, 'TDC');
            this._splitStr(FTX, vCode, 4, 1, 5, 70);
        }
        // FTX AAR_SPM
        let vMethod = this._v('TermsOfDelivery/ShippingPaymentMethod [@value="Other"]', nItemOut);
        if (vMethod) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'AAR');
            this._setV(FTX, 301, 'SPM');
            this._splitStr(FTX, vMethod, 4, 1, 5, 70);
        }
        // FTX AAR_TTC
        let vTerms = this._v('TermsOfDelivery/TransportTerms [@value="Other"]', nItemOut);
        if (vTerms) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'AAR');
            this._setV(FTX, 301, 'TTC');
            this._splitStr(FTX, vTerms, 4, 1, 5, 70);
        }
        let nControlKeys = this._n('ControlKeys', nItemOut);
        // FTX OCInstruction
        let vOCInstruction = this._v('OCInstruction/@value', nControlKeys);
        if (vOCInstruction) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'OCValue');
            this._setV(FTX, 402, vOCInstruction);
        }
        // FTX OCLowerTimeToleranceInDays
        let vOCLowerTimeToleranceInDays = this._v('OCInstruction/Lower/Tolerances/TimeTolerance [@type="days"]/@limit', nControlKeys);
        if (vOCLowerTimeToleranceInDays) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'OCLowerTimeToleranceInDays');
            this._setV(FTX, 402, vOCLowerTimeToleranceInDays);
        }
        // FTX OCUpperTimeToleranceInDays
        let vOCUpperTimeToleranceInDays = this._v('OCInstruction/Upper/Tolerances/TimeTolerance [@type="days"]/@limit', nControlKeys);
        if (vOCUpperTimeToleranceInDays) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'OCUpperTimeToleranceInDays');
            this._setV(FTX, 402, vOCUpperTimeToleranceInDays);
        }
        // FTX ASNValue
        let vASNValue = this._v('ASNInstruction/@value', nControlKeys)
        if (vASNValue) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'ASNValue');
            this._setV(FTX, 402, vASNValue);
        }
        // FTX INVValue
        let vINVValue = this._v('InvoiceInstruction/@value', nControlKeys)
        if (vINVValue) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'INVValue');
            this._setV(FTX, 402, vINVValue);
        }
        // FTX SESValue
        let vSESValue = this._v('SESInstruction/@value', nControlKeys)
        if (vSESValue) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'SESValue');
            this._setV(FTX, 402, vSESValue);
        }
        // FTX PRD subcontractingType
        let vSubcontractingType = this._v('@subcontractingType', nItemOut)
        if (vSubcontractingType) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'PRD');
            this._setV(FTX, 401, 'subcontractingType');
            this._setV(FTX, 402, vSubcontractingType);
        }
        // FTX PRD itemCategory
        let vItemCategory = this._v('@itemCategory', nItemOut)
        if (vItemCategory) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'PRD');
            this._setV(FTX, 401, 'itemCategory');
            this._setV(FTX, 402, vItemCategory);
        }
        // FTX ORI Return Item
        let bIsReturn = (this._v('@isReturn', nItemOut) == 'yes') ? true : false;
        if (bIsReturn) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'ORI');
            this._setV(FTX, 401, 'Return Item');
        }
        // FTX ORI Delivery is completed
        let bIsDeliveryCompleted = (this._v('@isDeliveryCompleted', nItemOut) == 'yes') ? true : false;
        if (bIsDeliveryCompleted) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'ORI');
            this._setV(FTX, 401, 'Delivery is completed');
        }

        // FTX ACL Quality Info
        let nQualityInfo = this._e('ItemOutIndustry/QualityInfo', nItemOut);
        if (nQualityInfo) {
            let nIdRef = this._e('IdReference', nQualityInfo); // just pick one to see
            let vQualityProcess = this._v('@requiresQualityProcess', nQualityInfo);
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'ACL');
            if (vQualityProcess == 'yes' && !nIdRef) {
                this._setV(FTX, 401, 'no');
            }
            this._setV(FTX, 402, this._v('IdReference [@domain="certificateType"]/@identifier', nQualityInfo));
            this._setV(FTX, 403, this._v('IdReference [@domain="certificateType"]/Description', nQualityInfo));
            this._setV(FTX, 404, this._v('IdReference [@domain="controlCode"]/@identifier', nQualityInfo));
            this._setV(FTX, 405, this._v('IdReference [@domain="controlCode"]/Description', nQualityInfo));

        }

    } // end function _SG25_FTX

    private _SG26_PIA(nItemOut: Element, nItemDetail: Element) {
        let iPIACounter = 2;
        let aPIA_1 = [];
        let aPIA_5 = [];

        // BuyerPartID
        let vBuyerPartID = this._v('ItemID/BuyerPartID', nItemOut);
        if (vBuyerPartID) {
            const aLine = [vBuyerPartID, 'BP'];
            aPIA_5.push(aLine);
        }

        // SupplierPartAuxiliaryID
        let vSupplierPartAuxiliaryID = this._v('ItemID/SupplierPartAuxiliaryID', nItemOut);
        if (vSupplierPartAuxiliaryID) {
            const aLine = [vSupplierPartAuxiliaryID, 'VS'];
            aPIA_1.push(aLine);
        }

        // EANID
        let vEANID = this._v('ItemDetailIndustry/ItemDetailRetail/EANID', nItemDetail);
        let vEAN13 = this._v('ItemID/IdReference[@domain="EAN-13"]/@identifier', nItemOut);
        if (vEANID || vEAN13) {
            let v = vEANID ? vEANID : vEAN13;
            const aLine = [v, 'EN'];
            aPIA_1.push(aLine);
        }

        // ManufacturerPartID
        let vMPARTID = this._v('ManufacturerPartID', nItemDetail);
        if (vMPARTID) {
            const aLine = [vMPARTID, 'MF'];
            aPIA_5.push(aLine);
        }
        // EuropeanWasteCatalogID
        let vEuropeanWasteCatalogID = this._v('ItemDetailIndustry/ItemDetailRetail/EuropeanWasteCatalogID', nItemDetail);
        if (vEuropeanWasteCatalogID) {
            const aLine = [vEuropeanWasteCatalogID, 'ZZZ'];
            aPIA_1.push(aLine);
        }

        // PIA+1
        if (aPIA_1.length > 0) {
            let PIA = this._initSegEdi('PIA', 1 + aPIA_1.length);
            this._setV(PIA, 1, '1');
            let iComp = 2;
            for (let aLine of aPIA_1) {
                this._setV(PIA, iComp * 100 + 1, aLine[0]);
                this._setV(PIA, iComp * 100 + 2, aLine[1]);
                iComp++;
            }
        }
        // PIA+5
        if (aPIA_5.length > 0) {
            let PIA = this._initSegEdi('PIA', 1 + aPIA_5.length);
            this._setV(PIA, 1, '5');
            let iComp = 2;
            for (let aLine of aPIA_5) {
                this._setV(PIA, iComp * 100 + 1, aLine[0]);
                this._setV(PIA, iComp * 100 + 2, aLine[1]);
                iComp++;
            }
        }
    }
    /**
     * SG18, also includes SG20,SG21
     * @param nRequestHeader 
     */
    private _SG19_Modification(nRequestHeader: Element) {

        // SG18, Modification
        let nModifications = this._es('Total/Modifications/Modification', nRequestHeader);
        nModifications = nModifications ?? [];
        for (let nModification of nModifications) {
            let nAD = this._e('AdditionalDeduction', nModification);
            let nAC = this._e('AdditionalCost', nModification);
            // ALC
            let ALC = this._initSegEdi('ALC', 5);
            if (nAD) {
                // AdditionalDeduction
                this._setV(ALC, 1, 'A');
            } else {
                // AdditionalCost
                this._setV(ALC, 1, 'C');
            }

            this._setV(ALC, 501, this._mci(MAPS.mapALC7161, this._v('ModificationDetail/@name', nModification)));
            let sDesc = this._v('ModificationDetail/Description', nModification);
            if (sDesc.length > 35) {
                this._setV(ALC, 504, sDesc.substring(0, 35));
                this._setV(ALC, 505, sDesc.substring(35));
            } else {
                this._setV(ALC, 504, sDesc);
            }

            // DTM
            let vStartDate = this._v('ModificationDetail/@startDate', nModification);
            let vEndDate = this._v('ModificationDetail/@endDate', nModification);
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

            // SG20
            // PCD
            let vPCD = '';
            if (nAD) {
                vPCD = this._v('DeductionPercent/@percent', nAD);
            } else {
                // AdditionalCost
                vPCD = this._v('Percentage/@percent', nAD)
            }
            if (vPCD) {
                let PCD = this._initSegEdi('PCD', 5);
                this._setV(PCD, 101, '3');
                this._setV(PCD, 102, vPCD);
                this._setV(PCD, 103, '13');
            }

            // SG21
            // MOA OriginalPrice
            let vMoney = this._v('OriginalPrice/Money', nModification);
            if (vMoney) {
                let MOA = this._initSegEdi('MOA', 1);
                this._setV(MOA, 101, '98');
                this._setV(MOA, 102, vMoney);
                this._setV(MOA, 103, this._v('OriginalPrice/Money/@currency', nModification));
                this._setV(MOA, 104, '9');
            }
            // MOA Price
            if (nAD) {
                let vMoney = this._v('DeductedPrice/Money', nAD);
                if (vMoney) {
                    let MOA = this._initSegEdi('MOA', 1);
                    this._setV(MOA, 101, '4');
                    this._setV(MOA, 102, vMoney);
                    this._setV(MOA, 103, this._v('DeductedPrice/Money/@currency', nAD));
                    this._setV(MOA, 104, '9');
                }
            }
            // MOA Amount
            vMoney = '';
            let vCurrency = '';
            if (nAD) {
                // AdditionalDeduction
                vMoney = this._v('DeductionAmount/Money', nAD);
                vCurrency = this._v('DeductionAmount/Money/@currency', nAD);
            } else {
                // AdditionalCost
                vMoney = this._v('Money', nAC);
                vCurrency = this._v('Money/@currency', nAC);

            }
            if (vMoney) {
                let MOA = this._initSegEdi('MOA', 1);
                this._setV(MOA, 101, '8');
                this._setV(MOA, 104, '9');
                this._setV(MOA, 102, vMoney);
                this._setV(MOA, 103, vCurrency);
            }

        } // end if nModification
    }
    private _BP_Extrinsic(bp: Element) {
        let extrinscs = this._es('Address/PostalAddress/Extrinsic', bp);
        for (let e of extrinscs) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ZZZ');
            this._setV(RFF, 102, this._v('@name', e));
            this._setV(RFF, 104, this._v('', e));
        }
    }

    /**
     * Business Partner IdReference->RFF
     * @param bp 
     */
    private _BP_IDRef(bp: Element) {
        let IdRefs = this._es('IdReference', bp);
        for (let idRef of IdRefs) {
            let sDomain = this._v('@domain', idRef);
            if (!this._mei(MAPS.mapNADBP1153, sDomain)) {
                continue;
            }
            let RFF = this._initSegEdi('RFF', 1);
            let sIdent = this._v('@identifier', idRef);
            this._setV(RFF, 101, this._mci(MAPS.mapNADBP1153, sDomain));
            this._setV(RFF, 102, sIdent);
        }
    }

    /**
     * Contact IdReference->RFF
     * Use mapNAD1153
     * @param nContact 
     */
    private _Contact_IDRef(nContact: Element) {
        let IdRefs = this._es('IdReference', nContact);
        for (let idRef of IdRefs) {
            let sDomain = this._v('@domain', idRef);
            if (!this._mei(MAPS.mapNAD1153, sDomain)) {
                continue;
            }
            let RFF = this._initSegEdi('RFF', 1);
            let sIdent = this._v('@identifier', idRef);
            this._setV(RFF, 101, this._mci(MAPS.mapNAD1153, sDomain));
            this._setV(RFF, 102, sIdent);
        }
    }

    /**
     * Business Partner IdReference->LOC
     * @param bp 
     */
    private _BP_LOC(bp: Element) {
        let IdRefs = this._es('IdReference', bp);
        for (let idRef of IdRefs) {
            let sDomain = this._v('@domain', idRef);
            if (!MAPS.mapLOC3227[sDomain]) {
                continue;
            }
            let LOC = this._initSegEdi('LOC', 2);
            let sIdent = this._v('@identifier', idRef);
            this._setV(LOC, 1, MAPS.mapLOC3227[sDomain]);
            this._setV(LOC, 201, sIdent);
        }
    }
    private _NAD(sMappedRole: string, bp: Element): EdiSegment {
        let sAddressID = this._v('Address/@addressID', bp);
        let sAddressIDDomain = this._v('Address/@addressIDDomain', bp);
        let sName = this._vs('Address/Name', bp);
        let sDeliverTo = this._vs('Address/PostalAddress/DeliverTo', bp);
        let sStreet = this._vs('Address/PostalAddress/Street', bp);
        let sCity = this._v('Address/PostalAddress/City', bp);
        let sState = this._v('Address/PostalAddress/State', bp);
        let sPostalCode = this._v('Address/PostalAddress/PostalCode', bp);
        let sCountryCode = this._v('Address/PostalAddress/Country/@isoCountryCode', bp);
        let NAD = this._initSegEdi('NAD', 9);
        this._setV(NAD, 1, sMappedRole);
        this._setV(NAD, 201, sAddressID);
        if (this._mei(MAPS.mapNADBP3055, sAddressIDDomain)) {
            this._setV(NAD, 203, this._mci(MAPS.mapNADBP3055, sAddressIDDomain));
        } else {
            this._setV(NAD, 203, '92');
        }
        this._splitStr(NAD, sName, 3, 1, 5, 35);
        this._splitStr(NAD, sDeliverTo, 4, 1, 5, 35);
        this._splitStr(NAD, sStreet, 5, 1, 4, 35);
        this._setV(NAD, 6, sCity);
        this._setV(NAD, 7, sState);
        this._setV(NAD, 8, sPostalCode);
        this._setV(NAD, 9, sCountryCode);
        return NAD;
    }

    private _NAD_Contact(sMappedRole: string, contact: Element): EdiSegment {
        let sAddressID = this._v('@addressID', contact);
        let sAddressIDDomain = this._v('@addressIDDomain', contact);
        let sName = this._vs('Name', contact);
        let sDeliverTo = this._vs('PostalAddress/DeliverTo', contact);
        let sStreet = this._vs('PostalAddress/Street', contact);
        let sCity = this._v('PostalAddress/City', contact);
        let sState = this._v('PostalAddress/State', contact);
        let sPostalCode = this._v('PostalAddress/PostalCode', contact);
        let sCountryCode = this._v('PostalAddress/Country/@isoCountryCode', contact);
        let NAD = this._initSegEdi('NAD', 9);
        this._setV(NAD, 1, sMappedRole);
        if (sAddressID) {
            this._setV(NAD, 201, sAddressID);
            if (this._mei(MAPS.mapNADBP3055, sAddressIDDomain)) {
                this._setV(NAD, 203, this._mci(MAPS.mapNADBP3055, sAddressIDDomain));
            } else {
                this._setV(NAD, 203, '92');
            }
        }
        this._splitStr(NAD, sName, 3, 1, 5, 35);
        this._splitStr(NAD, sDeliverTo, 4, 1, 5, 35);
        this._splitStr(NAD, sStreet, 5, 1, 4, 35);
        this._setV(NAD, 6, sCity);
        this._setV(NAD, 7, sState);
        this._setV(NAD, 8, sPostalCode);
        this._setV(NAD, 9, sCountryCode);
        return NAD;
    }

    private _CTA(v1: string, v201: string, sName202: string, nAddress: Element): EdiSegment {
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
            let COM = this._initSegEdi('COM', 1);
            let sVal = sPhoneCountryCode + '-' + sPhoneAreaOrCityCode + '-' + sPhoneNumber;
            // trim twice
            sVal = sVal.startsWith('-') ? sVal.substring(1) : sVal;
            sVal = sVal.startsWith('-') ? sVal.substring(1) : sVal;
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
            // trim twice
            sVal = sVal.startsWith('-') ? sVal.substring(1) : sVal;
            sVal = sVal.startsWith('-') ? sVal.substring(1) : sVal;
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
    private _SG1_RFF_DTM(nRequestHeader: Element) {
        // RFF PW
        let sOrgID = this._v('@OriginalId', nRequestHeader);
        this._RFF_KV('PW', sOrgID);
        // RFF AGI
        let sReqID = this._v('@requisitionID', nRequestHeader);
        this._RFF_KV('AGI', sReqID);
        // RFF RE
        let sReleaseReq = this._v('@releaseRequired', nRequestHeader);
        this._RFF_KV('RE', sReleaseReq);
        // RFF CT
        let sAgreementID = this._v('@agreementID', nRequestHeader);
        this._RFF_KV('CT', sAgreementID);
        // RFF BC
        let sParentAgreementID = this._v('@parentAgreementID', nRequestHeader);
        this._RFF_KV('BC', sParentAgreementID);
        // RFF CR
        let sCustomerRef = this._v('IdReference[@domain="CustomerReferenceID"]/@identifier', nRequestHeader);
        this._RFF_KV('CR', sCustomerRef);
        // RFF UC
        let sUltiCustomer = this._v('IdReference[@domain="UltimateCustomerReferenceID"]/@identifier', nRequestHeader);
        this._RFF_KV('UC', sUltiCustomer);
        // RFF ACD
        let sACD = this._v('IdReference[@domain="AdditionalReferenceID"]/@identifier', nRequestHeader);
        this._RFF_KV('ACD', sACD);
        // RFF GN
        let sGN = this._v('IdReference[@domain="governmentNumber"]/@identifier', nRequestHeader);
        this._RFF_KV('GN', sGN);

        // RFF AIU
        let sPNumber = this._v('Payment/Pcard/@number', nRequestHeader);
        let sPName = this._v('Payment/Pcard/@name', nRequestHeader);
        if (sPNumber || sPName) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'AIU');
            this._setV(RFF, 102, sPNumber);
            this._setV(RFF, 104, sPName);
        }
        let sExpDate = this._v('Payment/Pcard/@expiration', nRequestHeader);
        if (sExpDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '36');
            this._setV(DTM, 102, Utils.dateStr304TZ(sExpDate, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // RFF ON
        let sOrderID2 = this._v('@orderID', nRequestHeader);
        let sOrderVer2 = this._v('@orderVersion', nRequestHeader);
        let sOrderDate2 = this._v('@orderDate', nRequestHeader);
        if (sOrderID2) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ON');
            this._setV(RFF, 102, sOrderID2);
            this._setV(RFF, 104, sOrderVer2);
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '4');
            this._setV(DTM, 102, Utils.dateStr304TZ(sOrderDate2, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // RFF VN
        let sVOrderID = this._v('SupplierOrderInfo/@orderID', nRequestHeader);
        let sVOrderDate = this._v('SupplierOrderInfo/@orderDate', nRequestHeader);
        if (sVOrderID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'VN');
            this._setV(RFF, 102, sVOrderID);
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '8');
            this._setV(DTM, 102, Utils.dateStr304TZ(sVOrderDate, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // RFF IT
        let sIT = this._prv('/cXML/Header/From/Credential[@domain="AribaNetworkID"]/Identity');
        this._RFF_KV('IT', sIT);

        // RFF VA
        let sVA = this._v('Tax/TaxDetail/Description', nRequestHeader);
        let sTaxPointDate = this._v('Tax/TaxDetail/@taxPointDate', nRequestHeader);
        let sPayDate = this._v('Tax/TaxDetail/@paymentDate', nRequestHeader);
        this._RFF_KV('VA', sVA);
        if (sTaxPointDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '131');
            this._setV(DTM, 102, Utils.dateStr304TZ(sTaxPointDate, 'GM'));
            this._setV(DTM, 103, '304');
        }
        if (sPayDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '140');
            this._setV(DTM, 102, Utils.dateStr304TZ(sPayDate, 'GM'));
            this._setV(DTM, 103, '304');
        }
    }

    private _Root_FTXs(nRequestHeader: Element) {
        // FTX AAI & ACB
        let sComments: string;
        let nComments = this._es('Comments', nRequestHeader);
        let sCommentsLang: string;
        let bAAIDone = false;
        for (let n of nComments) {
            let sComments = this._v('', n);
            let sCommentsType = this._v('@type', n);
            // it's OK to assign the last to global, I'm tired
            sCommentsLang = this._v('@xml:lang', n);
            if (sComments) {
                if (!bAAIDone) {
                    // FTX AAI
                    let FTX = this._initSegEdi('FTX', 5);
                    this._setV(FTX, 1, 'AAI');
                    // Start From compnent 401
                    this._FTX(FTX, 1, sComments.substring(0, 350));
                    this._setV(FTX, 5, sCommentsLang);
                    bAAIDone = true;
                } else {
                    while (sComments) {
                        let FTX = this._initSegEdi('FTX', 5);
                        this._setV(FTX, 1, 'ACB');
                        this._setV(FTX, 401, sCommentsType);
                        // Start From compnent 402
                        this._FTX(FTX, 2, sComments.substring(0, 280));
                        this._setV(FTX, 5, sCommentsLang);
                        sComments = sComments.substring(280, 280 * 2);
                    }
                }
            }
        }


        // TODO:FTX PUR CompanyCode
        // TODO:FTX PUR PurchasingOrganization
        // TODO:FTX PUR PurchasingOrganization

        // FTX ZZZ
        let nExtrinsics = this._es('Extrinsic', nRequestHeader);
        for (let n of nExtrinsics) {
            let sName = this._v('@name', n);
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'ZZZ');
            this._setV(FTX, 401, sName);
            let sExtrinsic = this._v('', n);
            let iFTXZZZ = 2;
            this._FTX(FTX, iFTXZZZ, sExtrinsic);
            // remove below only because CIG doesn't do this
            // this._setV(FTX, 5, sCommentsLang);
        }

        // FTX TDT
        let sShipDesc = this._v('/ShipTo/TransportInformation/ShippingInstructions/Description', nRequestHeader);
        let sShipDescLang = this._v('/ShipTo/TransportInformation/ShippingInstructions/Description/@xml:lang', nRequestHeader);
        if (sShipDesc) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'TDT');
            // this._setV(FTX, 2, '3');
            this._FTX(FTX, 1, sShipDesc);
            this._setV(FTX, 5, sShipDescLang);
        }

        // FTX AAR_TDC
        let sToDCode = this._v('TermsOfDelivery/TermsOfDeliveryCode[@value="Other"]', nRequestHeader);
        if (sToDCode) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'AAR');
            this._setV(FTX, 301, 'TDC');
            this._FTX(FTX, 1, sToDCode);
        }

        // FTX AAR_SPM
        let sShipPayMethod = this._v('TermsOfDelivery/ShippingPaymentMethod[@value="Other"]', nRequestHeader);
        if (sShipPayMethod) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'AAR');
            this._setV(FTX, 301, 'SPM');
            this._FTX(FTX, 1, sShipPayMethod);
        }

        // FTX AAR_TTC
        let sTTC = this._v('TermsOfDelivery/TransportTerms[@value="Other"]', nRequestHeader);
        if (sTTC) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'AAR');
            this._setV(FTX, 301, 'TTC');
            this._FTX(FTX, 1, sTTC);
        }

        // FTX PRI
        let sPRILevel = this._v('OrderRequestHeaderIndustry/Priority/@level', nRequestHeader);
        let sPRIDesc = this._v('OrderRequestHeaderIndustry/Priority/Description', nRequestHeader);
        let sPRISeq = this._v('OrderRequestHeaderIndustry/Priority/@sequence', nRequestHeader);
        if (sPRILevel || sPRIDesc || sPRISeq) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'PRI');
            this._setV(FTX, 401, sPRILevel);
            this._setV(FTX, 402, sPRIDesc);
            this._setV(FTX, 403, sPRISeq);
        }

        // FTX DOC_EXT
        let sDocType = this._v('OrderRequestHeaderIndustry/ExternalDocumentType/@documentType', nRequestHeader);
        let sDocDesc = this._v('OrderRequestHeaderIndustry/ExternalDocumentType/Description', nRequestHeader);
        if (sDocType || sDocDesc) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'DOC');
            this._setV(FTX, 301, 'EXT');
            this._setV(FTX, 401, sDocType);
            this._setV(FTX, 402, sDocDesc);
        }

        // FTX SIN OCValue
        let sSINOCValue = this._v('ControlKeys/OCInstruction/@value', nRequestHeader);
        if (sSINOCValue) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'OCValue');
            this._setV(FTX, 402, sSINOCValue);
        }

        // FTX SIN OCLowerTimeToleranceInDays
        let sSINLowerTime = this._v('ControlKeys/OCInstruction/Lower/Tolerances/TimeTolerance[@type="days"]/@limit', nRequestHeader);
        if (sSINLowerTime) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'OCLowerTimeToleranceInDays');
            this._setV(FTX, 402, sSINLowerTime);
        }
        // FTX SIN OCUpperTimeToleranceInDays
        let sSINUpperTime = this._v('ControlKeys/OCInstruction/Upper/Tolerances/TimeTolerance[@type="days"]/@limit', nRequestHeader);
        if (sSINUpperTime) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'OCUpperTimeToleranceInDays');
            this._setV(FTX, 402, sSINUpperTime);
        }

        // FTX SIN ASNValue
        let sSIN_ASN = this._v('ControlKeys/ASNInstruction/@value', nRequestHeader);
        if (sSIN_ASN) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'ASNValue');
            this._setV(FTX, 402, sSIN_ASN);
        }
        // FTX SIN INVValue
        let sSIN_INV = this._v('ControlKeys/InvoiceInstruction/@value', nRequestHeader);
        if (sSIN_INV) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'INVValue');
            this._setV(FTX, 402, sSIN_INV);
        }
        // FTX SIN INVVerification
        let sSIN_INVVerification = this._v('ControlKeys/InvoiceInstruction/@verificationType', nRequestHeader);
        if (sSIN_INVVerification) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'INVVerification');
            this._setV(FTX, 402, sSIN_INVVerification);
        }
        // FTX SIN INV_unitPriceEditable
        let sSIN_INV_unitPriceEditable = this._v('ControlKeys/InvoiceInstruction/@unitPriceEditable', nRequestHeader);
        if (sSIN_INV_unitPriceEditable) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'INV_unitPriceEditable');
            this._setV(FTX, 402, sSIN_INV_unitPriceEditable);
        }
        // FTX SIN SESValue
        let sSIN_SESValue = this._v('ControlKeys/SESInstruction/@value', nRequestHeader);
        if (sSIN_SESValue) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'SESValue');
            this._setV(FTX, 402, sSIN_SESValue);
        }
        // FTX SIN SES_UnitPriceEditable
        let sSIN_SES_UnitPriceEditable = this._v('ControlKeys/SESInstruction/@unitPriceEditable', nRequestHeader);
        if (sSIN_SES_UnitPriceEditable) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'SIN');
            this._setV(FTX, 401, 'SES_UnitPriceEditable');
            this._setV(FTX, 402, sSIN_SES_UnitPriceEditable);
        }
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
            this._setV(FTX, 400 + iFTX, EdiUtils.escapeEdi(sComments.substring(nextStart, iCompLength)));
            nextStart += iCompLength;
            iFTX++;
        }
    }
}

class MAPS {
    static mapBGM1001: Object = {
        "regular": "220",
        "release": "245",
        "blanket": "221",
    };
    static mapBGM1000: Object = {
        "regular": "Purchase Order",
        "release": "Release Order",
        "blanket": "Blanket Order",
    };
    static mapBGM1225: Object = {
        "delete": "3",
        "update": "5",
        "new": "9",
    };
    static mapNAD3035: Object = {
        "administrator": "AM",
        "technicalsupport": "AT",
        "buyermasteraccount": "BI",
        "billto": "BT",
        "buyer": "BY",
        "carriercorporate": "CA",
        "correspondent": "DO",
        "subsequentbuyer": "UD",
        "buyercorporate": "FD",
        "from": "FR",
        "issuerofinvoice": "II",
        "consignmentorigin": "LP",
        "buyerplannercode": "MI",
        "enduser": "OB",
        "purchasingagent": "PD",
        "taxrepresentative": "PK",
        "buyeraccount": "PO",
        "remitto": "RE",
        "billfrom": "RF",
        "suppliermasteraccount": "RH",
        "sales": "SB",
        "supplieraccount": "SE",
        "shipfrom": "SF",
        "soldto": "SO",
        "customerservice": "SR",
        "suppliercorporate": "SU",
        "consignmentdestination": "UP",
    };
    static mapNAD1153: Object = {
        "reference": "ACD",
        "abaroutingnumber": "ACK",
        "membernumber": "AGU",
        "creditorrefid": "AHL",
        "suppliertaxid": "AHP",
        "transactionreference": "AIH",
        "accountreceivableid": "AP",
        "accountpayableid": "AV",
        "fiscalnumber": "FC",
        "governmentnumber": "GN",
        "vendornumber": "IA",
        "companycode": "IT",
        "accountid": "PY",
        "bankroutingid": "RT",
        "contactperson": "SA",
        "departmentname": "SD",
        "taxexemptionid": "TL",
        "vatid": "VA",
    };

    static mapNADBP1153: Object = {
        "buyeraccountid": "AFN", // buyerAccountID
        "supplierid": "SS", // supplierID
    };

    static mapNADBP3055: Object = {
        "IATA": "3",
        "EAN": "9",
        "UIC": "12",
        "DUNS": "16",
        "SCAC": "182",
    };
    static mapLOC3227: Object = {
        "buyerLocationID": "19",
        "storageLocationID": "18",
    };
    static mapTAX5153: Object = {
        "sales": "LOC",
        "usage": "FRE",
        "vat": "VAT",
        "gst": "GST",
        //"all other values":"OTH",
    };
    static mapTDT8067: Object = {
        "air": "40",
        "motor": "30",
        "rail": "20",
        "ship": "10",
    };
    static mapTOD4055: Object = {
        "pricecondition": "1", // PriceCondition
        "despatchcondition": "2", // DespatchCondition
        "priceanddespatchcondition": "3", // PriceAndDespatchCondition
        "collectedbycustomer": "4", // CollectedByCustomer
        "transportcondition": "5", // TransportCondition
        "deliverycondition": "6", // DeliveryCondition
    };
    static mapTOD4215: Object = {
        "account": "A", // Account
        "advancecollect": "CA", // AdvanceCollect
        "collect": "CC", // Collect
        "collectfreightcreditedtopaymentcustomer": "CF", // CollectFreightCreditedToPaymentCustomer
        "definedbybuyerandseller": "DF", // DefinedByBuyerAndSeller
        "fobportofcall": "FO", // FobPortOfCall
        "informationcopy-nopaymentdue": "IC", // InformationCopy-NoPaymentDue
        "mixed": "MX", // Mixed
        "servicefreight-nocharge": "NC", // ServiceFreight-NoCharge
        "notspecified": "NS", // NotSpecified
        "advanceprepaid": "PA", // AdvancePrepaid
        "customerpick-uporbackhaul": "PB", // CustomerPick-UpOrBackhaul
        "prepaidbutchargedtocustomer": "PC", // PrepaidButChargedToCustomer
        "payableelsewhere": "PE", // PayableElsewhere
        "prepaidonly": "PO", // PrepaidOnly
        "prepaid-byseller": "PP", // Prepaid-BySeller
        "pickup": "PU", // Pickup
        "returncontainerfreightpaidbycustomer": "RC", // ReturnContainerFreightPaidByCustomer
        "returncontainerfreightfree": "RF", // ReturnContainerFreightFree
        "returncontainerfreightpaidbysupplier": "RS", // ReturnContainerFreightPaidBySupplier
        "thirdpartypay": "TP", // ThirdPartyPay
        "weightcondition": "WC", // WeightCondition
        "mutually defined": "ZZZ", // Mutually Defined
    };

    static mapTOD4053: Object = {
        "costandfreight": "CFR", // CostAndFreight
        "cost-insuranceandfreight": "CIF", // Cost-InsuranceAndFreight
        "carriage-insurancepaidto": "CIP", // Carriage-InsurancePaidTo
        "carriagepaidto": "CPT", // CarriagePaidTo
        "deliveredatfrontier": "DAF", // DeliveredAtFrontier
        "delivereddutypaid": "DDP", // DeliveredDutyPaid
        "deliveredex-quay": "DEQ", // DeliveredEx-Quay
        "deliveredex-ship": "DES", // DeliveredEx-Ship
        "ex-works": "EXW", // Ex-Works
        "freealongsideship": "FAS", // FreeAlongsideShip
        "free-carrier": "FCA", // Free-Carrier
        "freeonboard": "FOB", // FreeOnBoard
        "other": "ZZZ", // Other
        "cfr": "CFR", // CFR
        "cif": "CIF", // CIF
        "cip": "CIP", // CIP
        "cpt": "CPT", // CPT
        "daf": "DAF", // DAF
        "ddp": "DDP", // DDP
        "ddu": "DDU", // DDU
        "deq": "DEQ", // DEQ
        "des": "DES", // DES
        "exw": "EXW", // EXW
        "fas": "FAS", // FAS
        "fca": "FCA", // FCA
        "fob": "FOB", // FOB
        "zzz": "ZZZ", // ZZZ
        "deliveryarrangedbythesupplier": "1", // DeliveryArrangedByTheSupplier
        "deliveryarrangedbylogisticserviceprovider": "2", // DeliveryArrangedByLogisticServiceProvider
        "deliveredatplace": "DAP", // DeliveredAtPlace
        "deliveredatterminal": "DAT", // DeliveredAtTerminal
        "delivereddutyunpaid": "DDU", // DeliveredDutyUnpaid
        "1": "1", // 1
        "2": "2", // 2
        "dap": "DAP", // DAP
        "dat": "DAT", // DAT        
    };

    static mapALC7161: Object = {
        "charge": "ABK", // Charge
        "carrier": "ABP", // Carrier
        "allowance": "ACA", // Allowance
        "royalties": "ADI", // Royalties
        "adjustment": "AJ", // Adjustment
        "contract allowance": "CL", // Contract Allowance
        "discount": "DI", // Discount
        "freightbasedondollarminimum": "FAC", // FreightBasedOnDollarMinimum
        "freight": "FC", // Freight
        "handling": "HD", // Handling
        "insurance": "IN", // Insurance
        "shipping": "SAA", // Shipping
        "shippingandhandling": "SAA", // ShippingAndHandling
        "access charge": "SC", // Access Charge
        "accountnumbercorrectioncharge": "SC", // AccountNumberCorrectionCharge
        "acidbattery": "SC", // AcidBattery
        "discount-special": "SF", // Discount-Special
        "volume discount": "VAB", // Volume Discount
    };

    static mapIMD7081: Object = {
        "quality": "13",
        "color": "35",
        "grade": "38",
        "size": "98",
    }

    static mapCTA3139: Object = {
        "technicalsupport": "AT", // technicalSupport
        "administrator": "CF", // administrator
        "administration": "CF", // administration
        "customerservice": "CR", // customerService
        "enduser": "EB", // endUser
        "purchasingagent": "PD", // purchasingAgent
        "sales": "SR", // sales
        //"(unspecified) / not found":"OC", // (unspecified) / not found
        "information contact": "IC", // information contact
    }

    static mapSCC4017: Object = {
        "firm": "1",
        "tradeoff": "26",
        "forecast": "4",
    }

    static mapMEA6313: Object = {
        "width": "WD", // width
        "height": "HT", // height
        "length": "LN", // length
        "volume": "AAX", // volume
        "weight": "WT", // weight
        "grossvolume": "AAW", // grossVolume
        "grossweight": "G", // grossWeight
        "stackheight": "HM", // stackHeight
        "unitnetweight": "AAA", // unitNetWeight
        "unitgrossweight": "AAB", // unitGrossWeight
        // "else": "ZZZ"
    }
    static mapPAC7075: Object = {
        "inner": "1", // inner
        "intermediate": "2", // intermediate
        "outer": "3", // outer
    }
}