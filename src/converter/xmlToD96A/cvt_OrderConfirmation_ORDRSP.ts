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
export class Cvt_OrderConfirmation_ORDRSP extends XmlConverterBase {
    protected _convertErrs: ConvertErr[];

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
        this._UNB('ORDRSP', true);

        const nRequestHeader = this._rn('/ConfirmationRequest/ConfirmationHeader');
        const nConfReq = this._rn('/ConfirmationRequest');
        let sConfirmID = this._v('@confirmID', nRequestHeader);
        let sOperation = this._v('@operation', nRequestHeader);
        let sType = this._v('@type', nRequestHeader);

        // UNH
        let UNH = this._initSegEdi('UNH', 2);
        this._setV(UNH, 1, this._sUniqueRefGP); // Sequential counter throughout message (UNB) Starting at "1"
        this._setV(UNH, 201, 'ORDRSP'); // 65
        this._setV(UNH, 202, 'D');
        this._setV(UNH, 203, '96A');
        this._setV(UNH, 204, 'UN');

        // BGM
        let BGM = this._initSegEdi('BGM', 4);
        this._setV(BGM, 101, '231');
        this._setV(BGM, 2, sConfirmID);
        this._setV(BGM, 3, this._mcs(MAPS.mapBGM1225, sOperation));
        this._setV(BGM, 4, this._mcs(MAPS.mapBGM4343, sType));

        // DTM 
        this._DTM_EDI(nRequestHeader, '@noticeDate', '8'); // Should be "8" or "137"

        // ROOT_FTXs
        this._Root_FTXs(nRequestHeader);

        // SG1 Group1
        this._SG1_RFF_DTM(nRequestHeader, nConfReq);

        // SG2 Group3
        let Contacts = this._es('Contact', nRequestHeader);
        for (let ct of Contacts) {
            let sRole = this._v('@role', ct);
            this._NAD(this._mci(MAPS.mapNAD3035, sRole), ct)
            // Group 6
            this._CTA('IC', '', this._mci(MAPS.mapNAD3035, sRole), ct);
        } // end loop for Contacts

        // SG7 Group 7
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

        // SG19  Group 19 Shipping
        let nShipping = this._e('Shipping', nRequestHeader);
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

        // SG19 Group 1
        this._SG19_Modification(nRequestHeader);



        let nConfItems = this._es('ConfirmationItem', nConfReq);
        // SG26
        nConfItems = nConfItems ?? [];
        for (let nConfItem of nConfItems) {
            this._SG26(nConfItem);
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
            // if (this._bHideAmount) {
            //     this._setV(MOA, 102, '0.00');
            // } else {
            //     this._setV(MOA, 102, vMoney);
            // }
            this._setV(MOA, 103, this._v('Total/Money/@currency', nRequestHeader));
            this._setV(MOA, 104, '9');
        }

        // MOA 124 Tax
        vMoney = this._v('Tax/Money', nRequestHeader);
        if (vMoney) {
            let MOA = this._initSegEdi('MOA', 1);
            this._setV(MOA, 101, '124');
            // if (this._bHideAmount) {
            //     this._setV(MOA, 102, '0.00');
            // } else {
            //     this._setV(MOA, 102, vMoney);
            // }
            this._setV(MOA, 103, this._v('Tax/Money/@currency', nRequestHeader));
            this._setV(MOA, 104, '9');
        }

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

    /**
     * 
     */
    private _SG26(nItem: Element) {
        let nConfStatuses = this._es('ConfirmationStatus', nItem);
        if (!nConfStatuses || nConfStatuses.length <= 0) {
            return;
        }
        let nItemIn = this._e('ItemIn', nConfStatuses[0]);

        // LIN
        let LIN = this._initSegEdi('LIN', 4);
        let vLineNumber = this._v('@lineNumber', nItem);
        // trim 00010 => 10
        vLineNumber = this._trimIntStr(vLineNumber);

        this._setV(LIN, 101, vLineNumber);
        if (nItemIn) {
            this._setV(LIN, 301, this._v('ItemID/SupplierPartID', nItemIn));
            this._setV(LIN, 302, 'VN');
        }

        let vParentLineNum = this._v('@parentLineNumber', nItem);
        if (vParentLineNum) {
            this._setV(LIN, 401, '1');
            this._setV(LIN, 402, this._trimIntStr(vParentLineNum));
        }

        // PIA
        this._SG26_PIA(nItem, nItemIn);

        let nItemDetail = this._e('ItemDetail', nItemIn);

        // IMD_E
        let vLang = this._v('Description/@xml:lang', nItemDetail);
        vLang = vLang ? vLang : 'en';
        let vShortName = this._v('Description/ShortName', nItemDetail);
        if (vShortName) {
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'E');
            this._splitStr(IMD, vShortName, 3, 4, 5, 70);
            this._setV(IMD, 306, vLang);
        }

        // IMD_F
        let vDesc = this._v('Description', nItemDetail);
        if (vDesc) {
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'F');
            this._splitStr(IMD, vDesc, 3, 4, 5, 70);
            this._setV(IMD, 306, vLang);
        }

        // QTY 21
        let vQuantity = this._v('@quantity', nItem);
        if (vQuantity) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '21');
            this._setV(QTY, 102, this._trimIntStr(vQuantity));
            this._setV(QTY, 103, this._v('UnitOfMeasure', nItem));
        }

        // DTM 143 PlannedAcceptanceDays
        let vPlannedAcceptanceDays = this._v('PlannedAcceptanceDays', nItemDetail);
        if (vPlannedAcceptanceDays) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '143');
            this._setV(DTM, 102, vPlannedAcceptanceDays);
            this._setV(DTM, 103, '904');
        }

        // MOA 146
        let vMoney1 = this._v('UnitPrice/Money', nItemDetail);
        let vUOM1 = this._v('UnitPrice/Money/@currency', nItemDetail);
        let MOA: EdiSegment;
        if (vMoney1) {
            MOA = this._initSegEdi('MOA', 1);
            this._setV(MOA, 101, '146');
            this._setV(MOA, 102, vMoney1);
            this._setV(MOA, 103, vUOM1);
            this._setV(MOA, 104, '9');
        }

        // SG27 CCI
        let nClassification1s = this._es('Classification', nItemDetail);
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
        let nBasisQuant = this._e('PriceBasisQuantity', nItemDetail);
        if (nBasisQuant) {
            // PRI
            let PRI = this._initSegEdi('PRI', 1);
            this._setV(PRI, 101, 'CAL');
            this._setV(PRI, 104, 'PBQ');
            // // APR
            // let APR = this._initSegEdi('APR', 3);
            // this._setV(APR, 1, 'WS');
            // this._setV(APR, 201, this._v('@conversionFactor', nBasisQuant));
            // this._setV(APR, 202, 'CSD');
            // // RNG
            // let RNG = this._initSegEdi('RNG', 2);
            // this._setV(RNG, 1, '4');
            // this._setV(RNG, 201, this._v('UnitOfMeasure', nBasisQuant));
            // this._setV(RNG, 202, this._v('@quantity', nBasisQuant));
            // this._setV(RNG, 203, this._v('@quantity', nBasisQuant));
        }

        // CUX, I think it's always 'CUP'

        // "[If PRI/C509/5387=""AAK""  - Changed unit price]
        // /ConfirmationRequest/ConfirmationItem/ConfirmationStatus/UnitPrice/Money/@currency
        // or
        // [If PRI/C509/5387=""CUP""  - Confirmed unit price]
        // /ConfirmationRequest/ConfirmationItem/ConfirmationStatus/ItemIn/ItemDetail/UnitPrice/Money/@currency"
        let nMoney = this._e('UnitPrice/Money', nItemDetail);
        let sCurr = this._v('@currency', nMoney);
        let sAltCurr = this._v('@alternateCurrency', nMoney);
        if (sCurr) {
            let CUX = this._initSegEdi('CUX', 2);
            this._setV(CUX, 101, '5');
            this._setV(CUX, 102, sCurr);
            this._setV(CUX, 103, '9');
            if (sAltCurr) {
                this._setV(CUX, 201, '3');
                this._setV(CUX, 202, sAltCurr);
                this._setV(CUX, 203, '7');
            }
        }

        // SG31
        // RFF FI
        let vItemType = this._v('@itemType', nItem);
        if (vItemType) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'FI');
            this._setV(RFF, 102, vItemType);
            this._setV(RFF, 104, this._v('@compositeItemType', nItem));
        }

        // SG37 MF
        let vManufacturerName = this._v('ManufacturerName', nItemDetail);
        if (vManufacturerName) {
            let NAD = this._initSegEdi('NAD', 3);
            this._setV(NAD, 1, 'MF');
            this._splitStr(NAD, vManufacturerName, 4, 1, 5, 35);
        }

        // SG37, General Contact
        let nContacts = this._es('Contact', nItem);
        nContacts = nContacts ?? [];
        for (let nContact of nContacts) {
            let vRole = this._v('@role', nContact);
            let vMappedRole = this._mci(MAPS.mapNAD3035, vRole);
            this._NAD_Contact(vMappedRole, nContact);

            // SG37 SG40 IC
            let vName = this._v('@name', nContact);
            if (!vName) {
                //vName = this._sContactPerson;
                vName = 'default';
            }
            this._CTA('IC', '', vName, nContact);
        } // end loop nContacts

        // SG41 Group 41 C
        let nShipping = this._e('Shipping', nItemIn);
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

            // SG44
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
        } // end if nShipping SG39 C

        // SG41  "A" for /AdditionalDeduction and "C" for /AdditionalCost
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
                this._setV(DTM, 102, Utils.dateStr304TZ(vStartDate));
                this._setV(DTM, 103, '304');
            }
            if (vEndDate) {
                let DTM = this._initSegEdi('DTM', 1);
                this._setV(DTM, 101, '206');
                this._setV(DTM, 102, Utils.dateStr304TZ(vEndDate));
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
        } // end loop for Modifications, SG41

        // SG51
        for (let nStatus of nConfStatuses) {
            // SCC
            let SCC = this._initSegEdi('SCC', 1);
            this._setV(SCC, 1, '1');

            // FTX AAI
            let sComments: string;
            let nComments = this._es('Comments', nStatus);
            let sCommentsLang: string;
            for (let n of nComments) {
                let sComments = this._v('', n);
                //let sCommentsType = this._v('@type', n);
                // it's OK to assign the last to global, I'm tired
                sCommentsLang = this._v('@xml:lang', n);
                if (sComments) {
                    let FTX = this._initSegEdi('FTX', 5);
                    this._setV(FTX, 1, 'AAI');
                    this._FTX(FTX, 1, sComments);
                    this._setV(FTX, 5, sCommentsLang);
                }
            }

            // FTX ACD
            let sRejReason = this._v('Extrinsic/@name="RejectionReason"', nStatus);
            if (sRejReason) {
                let FTX = this._initSegEdi('FTX', 4);
                this._setV(FTX, 1, 'ACD');
                this._setV(FTX, 401, this._mci(MAPS.mapFTX4440, sRejReason));
            }

            // FTX ZZZ
            let nExtrinsics = this._es('Extrinsic', nStatus);
            for (let n of nExtrinsics) {
                let sName = this._v('@name', n);
                if (sName == 'RejectionReason') {
                    continue;
                }
                let FTX = this._initSegEdi('FTX', 5);
                this._setV(FTX, 1, 'ZZZ');
                this._setV(FTX, 401, sName);
                let sExtrinsic = this._v('', n);
                let iFTXZZZ = 2;
                this._FTX(FTX, iFTXZZZ, sExtrinsic);
                // remove below only because CIG doesn't do this
                // this._setV(FTX, 5, sCommentsLang);
            }


            // SG51 SG52
            let vQTY = this._v('@quantity', nStatus);
            let vType = this._v('@type', nStatus);
            if (vQTY && ['accept', 'reject', 'detail', 'backordered'].includes(vType)) {
                let QTY = this._initSegEdi('QTY', 1);
                switch (vType) {
                    case 'accept':
                    case 'detail':
                        this._setV(QTY, 101, '194');
                        break;
                    case 'reject':
                        this._setV(QTY, 101, '185');
                        break;
                    case 'backordered':
                        this._setV(QTY, 101, '83');
                        break;
                }

                this._setV(QTY, 102, this._trimIntStr(vQTY));
                this._setV(QTY, 103, this._v('UnitOfMeasure', nStatus));
            }

            // SG52 DTM
            let vDeliveryDate = this._v('@deliveryDate', nStatus);
            if (vDeliveryDate) {
                // DTM 76
                let DTM = this._initSegEdi('DTM', 1);
                this._setV(DTM, 101, '69');
                this._setV(DTM, 102, Utils.dateStr304TZ(vDeliveryDate));
                this._setV(DTM, 103, '304');
            } // end if vRequestedDeliveryDate

            let vShipmentDate = this._v('@shipmentDate', nStatus);
            if (vShipmentDate) {
                let DTM = this._initSegEdi('DTM', 1);
                this._setV(DTM, 101, '10');
                this._setV(DTM, 102, Utils.dateStr304TZ(vShipmentDate));
                this._setV(DTM, 103, '304');
            }

            // ScheduleLineReference
            let vSchedQTY = this._v('ScheduleLineReference/@quantity', nStatus);
            if (vSchedQTY) {
                let QTY = this._initSegEdi('QTY', 1);
                this._setV(QTY, 101, '187');
                this._setV(QTY, 102, this._trimIntStr(vQTY));
                this._setV(QTY, 103, this._v('UnitOfMeasure', nStatus));
                let vDate = this._v('ScheduleLineReference/@requestedDeliveryDate', nStatus);
                if (vDate) {
                    let DTM = this._initSegEdi('DTM', 1);
                    this._setV(DTM, 101, '2');
                    this._setV(DTM, 102, Utils.dateStr304TZ(vDate));
                    this._setV(DTM, 103, '304');
                }
            }
        } // end loop nConfStatuses
    } // end functioin _SG26

    /**
     *    SUBCONTRACTING COMPONENTS			
    * "Create this SG25 LIN loop only, if /ItemOut/ScheduleLine/SubcontractingComponent is available.  
    * Create it right after the SG25 LIN loop mapped from the related /ItemOut.
    * Please refer to sheets ""cXML Sample ORDERS"" and ""SubcontractingComponent"" for more details.
    * Each /ItemOut/ScheduleLine/SubcontractingComponent 
    * creates a new SG25 LIN loop under the respective /ItemOut SG25 LIN loop."
    * 
    */
    private _SG25_SubComponent(nItemOut: Element, nScheduleLines: Element[]) {

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
                    this._setV(DTM, 102, Utils.dateStr304TZ(vReqDate));
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
                this._RFF_KV_EDI('ACJ', vMaterialProvisionIndicator);

                // SG30 Map this loop SG30 only if ItemOut/ScheduleLine/SubcontractingComponent/Batch is available
                let nBatch = this._e('Batch', nSubComp);
                if (nBatch) {
                    this._SG25_SG30_SubComp_Batch(nBatch);
                }

            } // end loop nSubcontractingComponents
        } // end loop nScheduleLines for SubcontractingComponent
    }

    private _SG25_SG30_SubComp_Batch(nBatch: Element) {
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
            this._setV(DTM, 102, Utils.dateStr304TZ(vExpDate));
            this._setV(DTM, 103, '304');
        }

        // DTM 94 productionDate
        let vProdDate = this._v('@productionDate', nBatch);
        if (vProdDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '94');
            this._setV(DTM, 102, Utils.dateStr304TZ(vProdDate));
            this._setV(DTM, 103, '304');
        }
        // DTM 351 inspectionDate
        let vInspDate = this._v('@inspectionDate', nBatch);
        if (vInspDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '351');
            this._setV(DTM, 102, Utils.dateStr304TZ(vInspDate));
            this._setV(DTM, 103, '304');
        }

        // SG25 SG30 SG31
        // RFF
        let vShelfLife = this._v('@shelfLife', nBatch);
        if (vShelfLife) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'BT');
            this._setV(RFF, 102, this._v('@originCountryCode', nBatch));
            this._setV(RFF, 104, vShelfLife);
        }
        // SG25 SG30 SG32
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

    } // end function _SG25_SG30_SubComp_Batch

    private _SG26_PIA(nItem: Element, nItemIn: Element) {
        let iPIACounter = 2;
        let aPIA_1 = [];
        let aPIA_5 = [];

        // BuyerPartID
        let vBuyerPartID = this._v('ItemID/BuyerPartID', nItemIn);
        if (vBuyerPartID) {
            const aLine = [vBuyerPartID, 'BP'];
            aPIA_5.push(aLine);
        }

        // SupplierPartAuxiliaryID
        let vSupplierPartAuxiliaryID = this._v('ItemID/SupplierPartAuxiliaryID', nItemIn);
        if (vSupplierPartAuxiliaryID) {
            const aLine = [vSupplierPartAuxiliaryID, 'VS'];
            aPIA_1.push(aLine);
        }

        // EANID
        let vEANID = this._v('ItemDetailIndustry/ItemDetailRetail/EANID', nItemIn);
        let vEAN13 = this._v('ItemID/IdReference[@domain="EAN-13"]/@identifier', nItemIn);
        if (vEANID || vEAN13) {
            let v = vEANID ? vEANID : vEAN13;
            const aLine = [v, 'EN'];
            aPIA_1.push(aLine);
        }

        // ManufacturerPartID
        let vMPARTID = this._v('ManufacturerPartID', nItemIn);
        if (vMPARTID) {
            const aLine = [vMPARTID, 'MF'];
            aPIA_5.push(aLine);
        }
        // EuropeanWasteCatalogID
        let vEuropeanWasteCatalogID = this._v('ItemDetailIndustry/ItemDetailRetail/EuropeanWasteCatalogID', nItemIn);
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
     * SG19
     * @param nRequestHeader 
     */
    private _SG19_Modification(nRequestHeader: Element) {

        // SG19, Modification
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
                this._setV(DTM, 102, Utils.dateStr304TZ(vStartDate));
                this._setV(DTM, 103, '304');
            }
            if (vEndDate) {
                let DTM = this._initSegEdi('DTM', 1);
                this._setV(DTM, 101, '206');
                this._setV(DTM, 102, Utils.dateStr304TZ(vEndDate));
                this._setV(DTM, 103, '304');
            }

            // SG21 Group 21
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
            // SG22
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

    /**
     * Business Partner IdReference->RFF
     * use mapNADBP1153
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
     * @param bp 
     */
    private _Contact_IDRef(contact: Element) {
        let IdRefs = this._es('IdReference', contact);
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
        let sState = this._v('PostalAddress/State', ct);
        let sPostalCode = this._v('PostalAddress/PostalCode', ct);
        let sCountryCode = this._v('PostalAddress/Country/@isoCountryCode', ct);
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

    /**
     * For Contact type not BusinessPartner type
     * @param sMappedRole 
     * @param contact 
     * @returns 
     */
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

    private _SG1_RFF_DTM(nRequestHeader: Element, nConfReq: Element) {

        // RFF ON
        let sOrderID2 = this._v('OrderReference/@orderID', nConfReq);
        let sOrderDate2 = this._v('OrderReference/@orderDate', nConfReq);
        if (sOrderID2) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ON');
            this._setV(RFF, 102, sOrderID2);
            if (sOrderDate2) {
                let DTM = this._initSegEdi('DTM', 1);
                this._setV(DTM, 101, '4');
                this._setV(DTM, 102, Utils.dateStr304TZ(sOrderDate2));
                this._setV(DTM, 103, '304');
            }
        }

        // RFF AEU
        let sAEU = this._v('IdReference[ domain="supplierReference" ]/@identifier', nRequestHeader);
        this._RFF_KV_EDI('AEU', sAEU);
    }

    private _Root_FTXs(nRequestHeader: Element) {
        // FTX AAI
        let sComments: string;
        let nComments = this._es('Comments', nRequestHeader);
        let sCommentsLang: string;
        for (let n of nComments) {
            let sComments = this._v('', n);
            //let sCommentsType = this._v('@type', n);
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
        let vDesc = this._v('Tax/Description', nRequestHeader);
        if (vDesc) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'TXD');
            this._splitStr(FTX, vDesc, 4, 1, 5, 70);
            this._setV(FTX, 5,
                this._v('Tax/Description/@xml:lang', nRequestHeader));
        }

        // FTX TRA
        let vShipDesc = this._v('Shipping/Description', nRequestHeader);
        if (vShipDesc) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'TXD');
            this._splitStr(FTX, vShipDesc, 4, 1, 5, 70);
            this._setV(FTX, 5,
                this._v('Shipping/Description/@xml:lang', nRequestHeader));
        }

        // FTX ACD
        let sRejReason = this._v('/ConfirmationRequest/ConfirmationHeader/Extrinsic/@name="RejectionReason"', nRequestHeader);
        if (sRejReason) {
            let FTX = this._initSegEdi('FTX', 4);
            this._setV(FTX, 1, 'ACD');
            this._setV(FTX, 401, this._mci(MAPS.mapFTX4440, sRejReason));
        }

        // FTX ZZZ
        let nExtrinsics = this._es('Extrinsic', nRequestHeader);
        for (let n of nExtrinsics) {
            let sName = this._v('@name', n);
            if (sName == 'RejectionReason') {
                continue;
            }
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'ZZZ');
            this._setV(FTX, 401, sName);
            let sExtrinsic = this._v('', n);
            let iFTXZZZ = 2;
            this._FTX(FTX, iFTXZZZ, sExtrinsic);
            // remove below only because CIG doesn't do this
            // this._setV(FTX, 5, sCommentsLang);
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
            this._setV(FTX, 400 + iFTX, EdiUtils.escapeEdi(sComments.substring(nextStart, nextStart + iCompLength)));
            nextStart += iCompLength;
            iFTX++;
        }
    }

}

class MAPS {
    static mapBGM1225: Object = {
        "update": "5",
        "new": "9",
    };
    static mapBGM4343: Object = {
        "detail": "AC", // AC
        "except": "AI", // AI
        "accept": "AP", // AP
        "reject": "RE", // RE     
    };

    static mapFTX4440: Object = {
        "duplicateorder": "Duplicate Order", // duplicateOrder
        "incorrectdeliverydate": "Incorrect Delivery Date", // incorrectDeliveryDate
        "incorrectdescription": "Incorrect Description", // incorrectDescription
        "incorrectprice": "Incorrect Price", // incorrectPrice
        "incorrectquantity": "Incorrect Quantity", // incorrectQuantity
        "incorrectstockpartnumber": "Incorrect Stock/Part Number", // incorrectStockPartNumber
        "incorrectsuppliercodeused": "Incorrect Supplier Code Used", // incorrectSupplierCodeUsed
        "incorrectuom": "Incorrect UOM", // incorrectUOM
        "notourproductline": "Not our Product Line", // notOurProductLine
        "unabletosupplyitems": "Unable to Supply Item(s)", // unableToSupplyItems
        "other": "Other", // other        
    }

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

    static mapNAD3055: Object = {
        "IATA": "3", // IATA
        "EANID": "9", // EANID
        "UIC": "12", // UIC
        "DUNS": "16", // DUNS
        "Assigned by seller or seller's agent": "91", // Assigned by seller or seller's agent
        "Assigned by buyer or buyer's agent": "92", // Assigned by buyer or buyer's agent
        "SCAC": "182", // SCAC
    };

    static mapALC7161: Object = {
        "advertisingallowance": "AA", // AdvertisingAllowance
        "returnedgoodscharges": "AAB", // ReturnedGoodsCharges
        "charge": "ABK", // Charge
        "packagingsurcharge": "ABL", // PackagingSurcharge
        "carrier": "ABP", // Carrier
        "allowance": "ACA", // Allowance
        "royalties": "ADI", // Royalties
        "shipping": "ADK", // Shipping
        "otherservices": "ADR", // OtherServices
        "fullpalletordering": "ADS", // FullPalletOrdering
        "pickup": "ADT", // PickUp
        "adjustment": "AJ", // Adjustment
        "cashdiscount": "CAC", // CashDiscount
        "contractallowance": "CL", // ContractAllowance
        //"discount": "DI ", // Discount
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
        "volume-discount": "VAB", // Volume-Discount

    };

    // =========================================    

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