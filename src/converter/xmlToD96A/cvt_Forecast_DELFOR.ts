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
* "1) if "cXML/Message/ProductActivityMessage/ProductActivityHeader/@processType = 'SMI' and not
* (cXML/Message/ProductActivityMessage/ProductActivityDetails[PlanningTimeSeries/@type = 'grossdemand' 
* or PlanningTimeSeries/@type = 'netdemand' or InventoryTimeSeries/@type = 'projectedStock'])" 
* then doctype = SMIProductActivityMessage
*
* 2) if "cXML/Message/ProductActivityMessage/ProductActivityHeader/@processType = 'Consignment'" 
* then doctype = ConsignmentProductActivity
*
* 3) if "cXML/Message/ProductActivityMessage/ProductActivityHeader/@processType = 'Other'" 
* then doctype = InventoryReportProductActivity
*
* 4) else 
* doctype = ProductActivityMessage"																	
*										
*
*/
export class cvt_Forecast_DELFOR extends XmlConverterBase {
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
        // Utils.sDefaultTMZ = ''; // I want a local timezone for UNB 
        this._UNB('DELFOR', false);

        // let sOrderType = this._v('@orderType', nRequestHeader);
        // let sOrderID = this._v('@orderID', nRequestHeader);
        // let sType = this._v('@type', nRequestHeader);
        let nActMsg = this._rn2('/ProductActivityMessage');
        let nActHeader = this._rn2('/ProductActivityMessage/ProductActivityHeader');


        // UNH
        let UNH = this._initSegEdi('UNH', 2);
        this._setV(UNH, 1, this._sUniqueRefGP); // Sequential counter throughout message (UNB) Starting at "1"
        this._setV(UNH, 201, 'DELFOR'); // 65
        this._setV(UNH, 202, 'D');
        this._setV(UNH, 203, '96A');
        this._setV(UNH, 204, 'UN');

        // BGM
        let BGM = this._initSegEdi('BGM', 3);
        this._setV(BGM, 101, '241');
        this._setV(BGM, 2, this._v('@messageID', nActHeader));
        this._setV(BGM, 3, '9');

        // DTM 
        this._DTM2(nActHeader, '@creationDate', '137');

        // SG1
        // RFF
        let nIdentity = this._prn('/cXML/Header/From/Credential [@domain="SystemID"]/Identity');
        if (nIdentity) {
            this._RFF_KV('MS', this._v('', nIdentity));
        }

        // SG2
        // "Map the following SG2 NAD loops only, if
        // only 1x /ProductActivityDetails per message
        // ELSE do not map"
        let nActDetails = this._es('ProductActivityDetails', nActMsg);
        let nLocationTo;
        let nBuyerPlannerCode;
        if (nActDetails && nActDetails.length == 1) {
            // "Map from all /Contact to this SG2 loop except 
            // /Contact/@role="locationTo" (mapped to SG4 trigger) and
            // /Contact/@role="BuyerPlannerCode" (different mapping for CTA, see below)"

            let nActD = nActDetails[0];
            let nContacts = this._es('Contact', nActD);
            for (let nCon of nContacts) {
                let sRole = this._v('@role', nCon);
                if (sRole == 'locationTo') {
                    nLocationTo = nCon;
                    return;
                }
                if (sRole == 'BuyerPlannerCode') {
                    nBuyerPlannerCode = nCon;
                    return;
                }
                let sEdiRole = this._mci(MAPS.mapNAD3035, sRole);
                // NAD
                let NAD = this._NAD_Contact(sEdiRole, nCon);
                //this._Contact_IDRef(nCon); // for common domain in Map   

                // CTA COM
                let CTA = this._CTA("IC", '', '', nCon);
            } // end loop nContacts

            // NAD BuyerPlannerCode
            // NAD
            this._NAD_Contact('MI', nBuyerPlannerCode);
            let vIdentifier = this._v('IdReference/@identifier', nBuyerPlannerCode)
            let vDesc = this._v('IdReference/Description', nBuyerPlannerCode)
            this._CTA("PD", vIdentifier, vDesc, nBuyerPlannerCode);


        } // end if nActDetails.length == 1

        // UNS
        let UNS_D = this._initSegEdi('UNS', 1);
        this._setV(UNS_D, 1, 'D');

        // "NAD+ST Trigger Creation:
        // Check if >1 /ProductActivityDetails element exist per message.
        // If no, map directly from /ProductActivityMessage/ProductActivityDetails/Contact [@locationTo] to this SG4 NAD+ST.
        // If yes, build 1 unique trigger SG4 NAD+ST whenever /ProductActivityMessage/ProductActivityDetails/Contact [@locationTo]/@addressID is equal and map all related 
        // ProductActivityDetails for the same within this loop as SG8 LIN loops."	
        let mapLocationTo: { [key: string]: Element } = {};
        if (nLocationTo) {
            // come from "ActDetails.length == 1"
            let vKey = this._v('@addressID', nLocationTo);
            if (vKey) {
                mapLocationTo[vKey] = nLocationTo;
            }
        }
        if (nActDetails.length > 1) {
            for (let nActDetail of nActDetails) {
                nLocationTo = this._e('Contact [@role="locationTo"]', nActDetail);
                if (nLocationTo) {
                    // come from "ActDetails.length == 1"
                    let vKey = this._v('@addressID', nLocationTo);
                    if (vKey && !(vKey in mapLocationTo)) {
                        mapLocationTo[vKey] = nLocationTo;
                    }
                }
            }
        } // end if nActDetails.length > 1
        // SG4 NAD+ST
        for (let sKey in mapLocationTo) {
            let nLocationTo = mapLocationTo[sKey];
            this._NAD_Contact('ST', nLocationTo);

            // LOC
            let vIdentifier = this._v('IdReference [@domain="locationTo"]/@identifier', nLocationTo);
            if (vIdentifier) {
                let LOC = this._initSegEdi('LOC', 2);
                this._setV(LOC, 1, '7');
                this._setV(LOC, 201, vIdentifier);
            }

            // SG6        
            // CTA COM   
            this._CTA("IC", '', '', nLocationTo);

            // SG8
            // "Collect all related ProductActivityDetails for the same 
            // ProductActivityDetails/Contact [@locationTo] on this SG4 NAD+ST trigger as one SG8 LIN loop each."   
            for (let nActDetail of nActDetails) {
                let nCurrAddr = this._e(`Contact [@role="locationTo" and @addressID="${sKey}"]`, nActDetail);
                if (nCurrAddr) {
                    this._SG8(nActDetail);
                }
            }

        } // end loop mapLocationTo

        // UNS
        let UNS = this._initSegEdi('UNS', 1);
        this._setV(UNS, 1, 'S');

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

    private _SG8(nActDetail: Element) {
        // LIN
        // Logic Step1	First map to LIN C212 7140 according to avalability and Priority Sequence Number LIN
        let aLIN: {
            [key: string]: string;
        } = {};

        let aPIA_1 = [];
        let aPIA_5 = [];

        // EANID
        //let vEANID = this._v('ItemDetailIndustry/ItemDetailRetail/EANID', nActDetail);
        let vEAN13 = this._v('ItemID/IdReference[@domain="EAN-13"]/@identifier', nActDetail);
        if (vEAN13) {
            const aLine = [vEAN13, 'EN'];
            aPIA_1.push(aLine);
            aLIN['EN'] = vEAN13;
        }

        // BuyerPartID
        let vBuyerPartID = this._v('ItemID/BuyerPartID', nActDetail);
        if (vBuyerPartID) {
            const aLine = [vBuyerPartID, 'BP'];
            aPIA_5.push(aLine);
            aLIN['BP'] = vBuyerPartID;
        }

        // SupplierPartAuxiliaryID
        let vSupplierPartAuxiliaryID = this._v('ItemID/SupplierPartAuxiliaryID', nActDetail);
        if (vSupplierPartAuxiliaryID) {
            const aLine = [vSupplierPartAuxiliaryID, 'VS'];
            aPIA_5.push(aLine);
            aLIN['VS'] = vSupplierPartAuxiliaryID;
        }

        // ManufacturerPartID
        let vMPARTID = this._v('ManufacturerPartID', nActDetail);
        if (vMPARTID) {
            const aLine = [vMPARTID, 'MF'];
            aPIA_5.push(aLine);
            aLIN['MF'] = vMPARTID;
        }

        // UPCUniversalProductCode
        let vUPCUniversalProductCode = this._v('ItemID/IdReference [@domain="UPCUniversalProductCode"] /@identifier', nActDetail);
        if (vUPCUniversalProductCode) {
            const aLine = [vUPCUniversalProductCode, 'UP'];
            aPIA_1.push(aLine);
            aLIN['UP'] = vUPCUniversalProductCode;
        }

        // EuropeanWasteCatalogID
        let vEuropeanWasteCatalogID = this._v('ItemID/IdReference [@domain="europeanWasteCatalogID"] /@identifier', nActDetail);
        if (vEuropeanWasteCatalogID) {
            const aLine = [vEuropeanWasteCatalogID, 'ZZZ'];
            aPIA_1.push(aLine);
            aLIN['ZZZ'] = vEuropeanWasteCatalogID;
        }

        // UNSPSC
        let vUNSPSC = this._v('Classification [@domain="UNSPSC"]', nActDetail);
        if (vUNSPSC) {
            const aLine = [vUNSPSC, 'CC'];
            aPIA_1.push(aLine);
            aLIN['CC'] = vUNSPSC;
        }

        let LIN = this._initSegEdi('LIN', 3);
        let vSupplierPartID = this._v('ItemID/SupplierPartID', nActDetail);
        if (vSupplierPartID) {
            aLIN['VN'] = vSupplierPartID;
        }

        // it's very important to keep priority 
        for (let sKey of ['VN', 'EN', 'BP', 'MF', 'VS', 'UP', 'ZZZ', 'CC']) {
            if (aLIN[sKey]) {
                this._setV(LIN, 301, aLIN[sKey]);
                this._setV(LIN, 302, sKey);
                break; // already found, don't need other keys
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

        let vLang = this._v('Description/@xml:lang', nActDetail);
        vLang = vLang ? vLang : 'en';
        // IMD_F
        let vDesc = this._v('Description', nActDetail);
        if (vDesc) {
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'F');
            this._splitStr(IMD, vDesc, 3, 4, 5, 35);
            this._setV(IMD, 306, vLang);
        }

        // IMD_E
        let vShortName = this._v('Description/ShortName', nActDetail);
        if (vShortName) {
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'E');
            this._splitStr(IMD, vShortName, 3, 4, 5, 35);
            this._setV(IMD, 306, vLang);
        }

        // IMD_B (Not ACA)
        let nChars = this._es('Characteristic', nActDetail);
        nChars = nChars ?? [];
        for (let nChar of nChars) {
            let vCharDomain = this._v('@domain', nChar);
            if (vCharDomain) {
                let vMapped = this._mci(MAPS.mapIMD7081, vCharDomain);
                if (vMapped) {
                    let IMD = this._initSegEdi('IMD', 3);
                    this._setV(IMD, 1, 'B');
                    this._setV(IMD, 2, vMapped);
                    this._setV(IMD, 301, this._v('@value', nChar));
                }
            }
        }

        // IMD_B ACA // [20240816] [SBNI-1026] KN: removed mappingin sync with implementation. [BIC int.] GU needed
        // let nClasses = this._es('Classification', nActDetail);
        // nClasses = nClasses ?? [];
        // for (let nClass of nClasses) {
        //     let vDomain = this._v('@domain', nClass);
        //     if (vDomain) {
        //         let IMD = this._initSegEdi('IMD', 3);
        //         this._setV(IMD, 1, 'B');
        //         this._setV(IMD, 301, 'ACA');
        //         this._setV(IMD, 304, this._v('@domain', nClass));
        //         this._setV(IMD, 305, this._v('', nClass));
        //     }
        // }

        // DTM 143
        let vPlannedAcceptanceDays = this._v('PlannedAcceptanceDays', nActDetail);
        if (vPlannedAcceptanceDays) {
            let DTM = this._initSegEdi('DTM', 3);
            this._setV(DTM, 101, '143');
            this._setV(DTM, 102, vPlannedAcceptanceDays);
            this._setV(DTM, 103, '804');
        }

        // DTM 169
        let vLeadTime = this._v('LeadTime', nActDetail);
        if (vLeadTime) {
            let DTM = this._initSegEdi('DTM', 3);
            this._setV(DTM, 101, '169');
            this._setV(DTM, 102, vLeadTime);
            this._setV(DTM, 103, '804');
        }

        // SG10

        // RFF
        let vStatus = this._v('@status', nActDetail);
        if (vStatus) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'AGW');
            this._setV(RFF, 102, vStatus);
        }

        // SG12 TimeSeries
        this._SG8_SG12_TimeSeries(nActDetail);
        // SG12 PlanningTimeSeries
        this._SG8_SG12_PlanningTimeSeries(nActDetail);
        // SG12 InventoryTimeSeries
        this._SG8_SG12_InventoryTimeSeries(nActDetail);

    } // end function _SG8

    private _SG8_SG12_PlanningTimeSeries(nActDetail: Element) {
        let nPlanningTimes = this._es('PlanningTimeSeries', nActDetail);
        nPlanningTimes = nPlanningTimes ?? [];
        for (let nPlanningTime of nPlanningTimes) {
            let vType = this._v('@type', nPlanningTime);
            let nDetails = this._es('TimeSeriesDetails', nPlanningTime);
            nDetails = nDetails ?? [];
            for (let nDetail of nDetails) {
                // QTY
                let vQTY = this._v('TimeSeriesQuantity/@quantity', nDetail);
                if (vQTY) {
                    let QTY = this._initSegEdi('QTY', 1);
                    this._setV(QTY, 101, '1');
                    this._setV(QTY, 102, vQTY);
                    this._setV(QTY, 103, this._v('TimeSeriesQuantity/UnitofMeasure', nDetail));
                }
                // SCC
                let SCC = this._initSegEdi('SCC', 1);
                this._setV(SCC, 1, '12');
                // DTM startDate
                this._DTM2(nDetail, 'Period/@startDate', '64');
                // DTM endDate
                this._DTM2(nDetail, 'Period/@endDate', '63');

                // SG13
                // RFF
                if (vType) {
                    let vTrueType;
                    if (vType == 'custom') {
                        vTrueType = this._v('@customType', nPlanningTime)
                    } else {
                        // @type="any other than ~custom~"
                        vTrueType = vType;
                    }
                    this._RFF_KV('AEH', vTrueType);
                }
            } // end loop nDetails


        } // end loop nPlanningTimes

    }
    private _SG8_SG12_InventoryTimeSeries(nActDetail: Element) {
        let nInventoryTimes = this._es('InventoryTimeSeries', nActDetail);
        nInventoryTimes = nInventoryTimes ?? [];
        for (let nInventoryTime of nInventoryTimes) {
            let vType = this._v('@type', nInventoryTime);
            let nDetails = this._es('InventoryTimeSeriesDetails', nInventoryTime);
            nDetails = nDetails ?? [];
            for (let nDetail of nDetails) {
                // QTY
                let vQTY = this._v('TimeSeriesQuantity/@quantity', nDetail);
                if (vQTY) {
                    let QTY = this._initSegEdi('QTY', 1);
                    this._setV(QTY, 101, '1');
                    this._setV(QTY, 102, vQTY);
                    this._setV(QTY, 103, this._v('TimeSeriesQuantity/UnitofMeasure', nDetail));
                }
                // SCC
                let SCC = this._initSegEdi('SCC', 1);
                this._setV(SCC, 1, '17');
                // DTM startDate
                this._DTM2(nDetail, 'Period/@startDate', '64');
                // DTM endDate
                this._DTM2(nDetail, 'Period/@endDate', '63');

                // SG13
                // RFF

                if (vType) {
                    this._RFF_KV('AEH', vType);
                }
            } // end loop nDetails


        } // end loop nInventoryTimes

    }
    private _SG8_SG12_TimeSeries(nActDetail: Element) {
        let nTimes = this._es('TimeSeries', nActDetail);
        nTimes = nTimes ?? [];
        for (let nTime of nTimes) {
            let vType = this._v('@type', nTime); // Map from cXML [Can be "orderForecast"|"demand"]
            let nForecasts = this._es('Forecast', nTime);
            nForecasts = nForecasts ?? [];
            for (let nForecast of nForecasts) {
                // QTY
                let vQTY = this._v('ForecastQuantity/@quantity', nForecast);
                if (vQTY) {
                    let QTY = this._initSegEdi('QTY', 1);
                    this._setV(QTY, 101, '1');
                    this._setV(QTY, 102, vQTY);
                    this._setV(QTY, 103, this._v('ForecastQuantity/UnitofMeasure', nForecast));
                }
                // SCC
                let SCC = this._initSegEdi('SCC', 1);
                this._setV(SCC, 1, '4');
                // DTM startDate
                this._DTM2(nForecast, 'Period/@startDate', '64');
                // DTM endDate
                this._DTM2(nForecast, 'Period/@endDate', '63');

                // RFF
                if (vType) {
                    this._RFF_KV('AEH', vType);
                }

            }// end loop nForecasts
            // SG13

        } // end loop nTimes
    }

    /**
     * CAT and COM
     * @param v1 
     * @param v201 
     * @param sName202 
     * @param nAddress 
     * @returns 
     */
    private _CTA(v1: string, v201: string, sName202: string, nAddress: Element) {

        // if (sName202) {
        //     this._setV(CTA, 202, sName202);
        // } else {
        //     this._setV(CTA, 202, this._v('@name', nAddress));
        // }

        let oCTAGroup: { [key: string]: [[string, string]] } = {};
        // CTA COM Phone
        let sPhoneCountryCode = this._v('Phone/TelephoneNumber/CountryCode', nAddress);
        let sPhoneAreaOrCityCode = this._v('Phone/TelephoneNumber/AreaOrCityCode', nAddress);
        let sPhoneNumber = this._v('Phone/TelephoneNumber/Number', nAddress);
        let sName = this._v('Phone/@name', nAddress);
        sName = sName ? sName : 'default';
        if (sPhoneCountryCode || sPhoneAreaOrCityCode || sPhoneNumber) {
            //let COM = this._initSegEdi('COM', 1);
            let sVal = sPhoneCountryCode + '-' + sPhoneAreaOrCityCode + '-' + sPhoneNumber;
            // trim twice
            sVal = sVal.startsWith('-') ? sVal.substring(1) : sVal;
            sVal = sVal.startsWith('-') ? sVal.substring(1) : sVal;
            let linesOfKey = oCTAGroup[sName]; // multiple lines
            let arr: [string, string] = [sVal, 'TE'];
            if (linesOfKey) {
                linesOfKey.push(arr);
            } else {
                linesOfKey = [arr];
            }
            oCTAGroup[sName] = linesOfKey;
            // this._setV(COM, 101, sVal);
            // this._setV(COM, 102, 'TE');
        }



        // CTA COM Email
        let sEmail = this._v('Email', nAddress);
        sName = this._v('Email/@name', nAddress);
        sName = sName ? sName : 'default';
        if (sEmail) {
            let linesOfKey = oCTAGroup[sName]; // multiple lines
            let arr: [string, string] = [sEmail, 'EM'];
            if (linesOfKey) {
                linesOfKey.push(arr);
            } else {
                linesOfKey = [arr];
            }
            oCTAGroup[sName] = linesOfKey;

            //let COM = this._initSegEdi('COM', 1);
            // this._setV(COM, 101, sEmail);
            // this._setV(COM, 102, 'EM');
        }


        // CTA COM Fax
        let sFaxCountryCode = this._v('Fax/TelephoneNumber/CountryCode', nAddress);
        let sFaxAreaOrCityCode = this._v('Fax/TelephoneNumber/AreaOrCityCode', nAddress);
        let sFaxNumber = this._v('Fax/TelephoneNumber/Number', nAddress);
        sName = this._v('Fax/@name', nAddress);
        sName = sName ? sName : 'default';
        if (sFaxCountryCode || sFaxAreaOrCityCode || sFaxNumber) {
            //let COM = this._initSegEdi('COM', 1);
            let sVal = sFaxCountryCode + '-' + sFaxAreaOrCityCode + '-' + sFaxNumber;
            // trim twice
            sVal = sVal.startsWith('-') ? sVal.substring(1) : sVal;
            sVal = sVal.startsWith('-') ? sVal.substring(1) : sVal;
            let linesOfKey = oCTAGroup[sName]; // multiple lines
            let arr: [string, string] = [sVal, 'FX'];
            if (linesOfKey) {
                linesOfKey.push(arr);
            } else {
                linesOfKey = [arr];
            }
            oCTAGroup[sName] = linesOfKey;
            // this._setV(COM, 101, sVal);
            // this._setV(COM, 102, 'FX');
        }

        // CTA COM URL
        let sURL = this._v('URL', nAddress);
        sName = this._v('URL/@name', nAddress);
        sName = sName ? sName : 'default';
        if (sURL) {
            //let COM = this._initSegEdi('COM', 1);
            // this._setV(COM, 101, sURL);
            // this._setV(COM, 102, 'AH');
            let linesOfKey = oCTAGroup[sName]; // multiple lines
            let arr: [string, string] = [sURL, 'AH'];
            if (linesOfKey) {
                linesOfKey.push(arr);
            } else {
                linesOfKey = [arr];
            }
            oCTAGroup[sName] = linesOfKey;

        }

        for (let sKey in oCTAGroup) {
            let CTA = this._initSegEdi('CTA', 2);
            this._setV(CTA, 1, v1);
            if (v201) {
                this._setV(CTA, 201, v201);
            } else {
                this._setV(CTA, 201, 'Not Avaiable');
            }
            this._setV(CTA, 202, sKey);

            let linesOfKey = oCTAGroup[sKey];
            for (let arr of linesOfKey) {
                let COM = this._initSegEdi('COM', 1);
                this._setV(COM, 101, arr[0]);
                this._setV(COM, 102, arr[1]);
            }
        }


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
            if (this._mei(MAPS.mapNAD3055, sAddressIDDomain)) {
                this._setV(NAD, 203, this._mci(MAPS.mapNAD3055, sAddressIDDomain));
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


} // end main class
class MAPS {
    static mapNAD3035: Object = {
        "locationfrom": "SU",
    };
    static mapNAD3055: Object = {
        "buyerassigned": "92", // BuyerAssigned
        "sellerassigned": "91", // SellerAssigned
        "duns": "16", // DUNS
        "ean": "9", // EAN
        "iata": "3", // IATA
        "scac": "182", // SCAC

    };
    static mapIMD7081: Object = {
        "quality": "13", // quality
        "color": "35", // color
        "grade": "38", // grade
        "size": "98", // size

    };
}