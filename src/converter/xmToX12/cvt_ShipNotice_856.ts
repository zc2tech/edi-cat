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
export class Cvt_ShipNotice_856 extends XmlConverterBase {
    protected _convertErrs: ConvertErr[];
    protected _cntReceiptItem: number = 0;
    protected _BSN05: string;

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

        this._ISA(false);
        this._GS(false, 'SH');
        this._ST('856');

        let nHeader = this._rn('/ShipNoticeRequest/ShipNoticeHeader');

        // BSN
        let BSN = this._initSegX12('BSN', 7);
        let vOperation = this._v('@operation', nHeader);
        this._setV(BSN, 1, this._mcs(MAPS.mapBSN01, vOperation));
        let vShipmentID = this._v('@shipmentID', nHeader);
        if (vOperation == 'delete' && vShipmentID.endsWith('_1')) {
            vShipmentID = vShipmentID.substring(0, vShipmentID.length - 2);
        }
        this._setV(BSN, 2, vShipmentID);

        let dNoticeDate = Utils.parseToDateSTD2(
            this._v('@orderDate', nHeader)
        )
        this._setV(BSN, 3, Utils.getYYYYMMDD(dNoticeDate));
        this._setV(BSN, 4, Utils.getHHMMSS(dNoticeDate));

        // "Store this value for later steps!!
        // Lookup required from ""ASNType""
        // When ASNtype=""SOPI"", hardcode to ""0001""
        // When ASNtype=""SOIP"", hardcode to ""0002""
        // Otherwise hardcode to ""0004"""
        // ======
        // Actually, according to Katja's reply, this conversion should alwasy be '0001'
        this._setV(BSN, 5, '0001');
        let vShipType = this._v('@shipmentType', nHeader);
        this._setV(BSN, 6, this._mci(MAPS.mapBSN06, vShipType));
        let vFulfillmentType = this._v('@fulfillmentType', nHeader);
        this._setV(BSN, 7, this._mci(MAPS.mapBSN07, vFulfillmentType));

        // DTM 111 @noticeDate
        this._DTM_X12(nHeader, '@noticeDate', '111');
        // DTM 011 @shipmentDate
        this._DTM_X12(nHeader, '@shipmentDate', '011');
        // DTM 017 @deliveryDate
        this._DTM_X12(nHeader, '@deliveryDate', '017');
        // DTM 002 @requestedDeliveryDate
        this._DTM_X12(nHeader, '@requestedDeliveryDate', '002');
        // DTM 118 PickUpDate
        this._DTM_X12(nHeader, 'Extrinsic[ @name="PickUpDate"]', '118');

        // HL
        let HL = this._initSegX12('HL', 4);
        this._setV(HL, 1, '1');
        this._setV(HL, 3, 'S');
        this._setV(HL, 4, '1');

        // PID
        // "Attention Note: 
        // Map only to PID, if NONE of the scenarios below exists. A combination of multiple scenarios is also possible.
        // 1[@type]: The /ShipNoticeHeader/Comments/@type is available and/or
        // 2[Ongoing Comments]: The content of /ShipNoticeHeader/Comments exceeds a length of 80 chars and/or
        // 3[Attachments]: /ShipNoticeHeader/Comments and/or @type exists 
        // AND /ShipNoticeHeader/Comments/Attachment/URL is available.
        // Else map to new REF*L1 segment.
        // -> Please refer to sheet ""Sample cXML completeContent"" for all test scenarios."        

        let nComments = this._es('Comments', nHeader);
        nComments = nComments ?? [];
        for (let nComment of nComments) {
            let vComm = this._v('', nComment);
            let vLang = this._v('@xml:lang', nComment);
            vLang = vLang ? vLang : 'en';
            if (vComm) {
                let PID = this._initSegX12('PID', 9);
                this._setV(PID, 1, 'F');
                this._setV(PID, 2, 'GEN');
                this._setV(PID, 5, vComm);
                this._setV(PID, 9, vLang);
            }
        }

        //  "Create this TD1 segment for the highest packaging level only if Extrinsic name=""totalOfPackagesLevel0001"" exists. 
        // <Extrinsic name=""totalOfPackagesLevel0001"">2</Extrinsic> -> TD1*PLT*2~"
        let nExtTotal0001 = this._e('Extrinsic [@name= "totalOfPackagesLevel0001"]', nHeader);
        let nExtTotal0002 = this._e('Extrinsic [@name= "totalOfPackagesLevel0002"]', nHeader);
        let nExtTotal = this._e('Extrinsic [@name= "totalOfPackages"]', nHeader);
        let nPortions = this._rns('/ShipNoticeRequest/ShipNoticePortion');
        if (nExtTotal0001) {
            let TD1 = this._initSegX12('TD1', 2);
            let nPackaging = this._findPackageWithLevel('0001', nPortions);
            if (nPackaging) {
                this._setV(TD1, 1, this._v('PackageTypeCodeIdentifierCode', nPackaging));
            } else {
                this._setV(TD1, 1, 'MXD');
            }
            this._setV(TD1, 2, this._v('', nExtTotal0001));
        }
        if (nExtTotal0002) {
            let TD1 = this._initSegX12('TD1', 2);
            let nPackaging = this._findPackageWithLevel('0002', nPortions);
            if (nPackaging) {
                this._setV(TD1, 1, this._v('PackageTypeCodeIdentifierCode', nPackaging));
            } else {
                this._setV(TD1, 1, 'MXD');
            }
            this._setV(TD1, 2, this._v('', nExtTotal0002));
        }
        if (nExtTotal) {
            let TD1 = this._initSegX12('TD1', 2);
            let nPackaging = this._findPackageWithLevel('', nPortions);
            if (nPackaging) {
                this._setV(TD1, 1, this._v('PackageTypeCodeIdentifierCode', nPackaging));
            } else {
                this._setV(TD1, 1, 'MXD');
            }
            this._setV(TD1, 2, this._v('', nExtTotal));
        }

        // TD1, grossWeight, weight, grossVolume
        let nDims = this._es('Packaging/Dimension', nHeader);
        nDims = nDims ?? [];
        for (let nDim of nDims) {
            let vType = this._v('@type', nDim);
            let vQTY = this._v('@quantity', nDim);
            let vUOM = this._v('UnitOfMeasure', nDim);
            switch (vType) {
                case 'grossWeight':
                    this._TD1('G', vQTY, vUOM);
                    break;
                case 'weight':
                    this._TD1('N', vQTY, vUOM);
                    break;
                case 'grossVolume':
                    this._TD1('', vQTY, vUOM);
                    break;
            }
        }

        //let nShipControls = this._rns('/ShipNoticeRequest/ShipControl');
        let nShipControl = this._rn('/ShipNoticeRequest/ShipControl');
        let nCompanyName = this._rn('/ShipNoticeRequest/ShipControl/CarrierIdentifier[@domain="companyName"]');
        let vCompanyName = nCompanyName ? this._v('', nCompanyName) : '';

        // TD5
        //for (let nControl of nShipControls) {
        if (nShipControl) {
            let vCarrierDomain = this._v('CarrierIdentifier/@domain', nShipControl);
            let vRouteMethod = this._v('Route/@method', nShipControl);
            let vRoute = this._v('Route', nShipControl);
            if (vCarrierDomain) {
                let TD5 = this._initSegX12('TD5', 14);
                let vMappedCarrierDomain = this._mci(MAPS.mapTD502, vCarrierDomain);
                let vCarrierIdentifier = this._v('CarrierIdentifier', nShipControl)
                this._setV(TD5, 2, vMappedCarrierDomain);
                this._setV(TD5, 3, vCarrierIdentifier);
                if (vRouteMethod == 'custom') {
                    this._setV(TD5, 4, this._mci(MAPS.mapTD504_II, vRoute));
                } else {
                    this._setV(TD5, 4, this._mci(MAPS.mapTD504_I, vRouteMethod));
                }
                this._setV(TD5, 5, vCompanyName);
                this._setV(TD5, 7, 'ZZ');

                // Map this TD4 segment for carrier domain only if CarrierIdentifier/@domain is 
                // NEITHER in the lookup table on sheet TD5, NOR ="companyName".
                if (!vMappedCarrierDomain && vCarrierIdentifier != 'companyName') {
                    // TD4
                    let TD4 = this._initSegX12('TD4', 4);
                    this._setV(TD4, 1, 'ZZZ');
                    this._setV(TD4, 4, vMappedCarrierDomain + '@' + vCarrierIdentifier);
                }
            }

            // TD5
            let vShippingContractNumber = this._v('TransportInformation/ShippingContractNumber', nShipControl);
            if (vShippingContractNumber) {
                let TD5 = this._initSegX12('TD5', 8);
                this._setV(TD5, 2, 'ZZ');
                this._setV(TD5, 3, vShippingContractNumber);
                if (vRouteMethod == 'custom') {
                    this._setV(TD5, 4, this._mci(MAPS.mapTD504_II, vRoute));
                } else {
                    this._setV(TD5, 4, this._mci(MAPS.mapTD504_I, vRouteMethod));
                }
                this._setV(TD5, 7, 'ZZ');
                let vDesc = this._v('TransportInformation/ShippingInstructions/Description', nShipControl);
                if (vDesc) {
                    this._setV(TD5, 8, vDesc.substring(0, 30));
                }
            }
        } // end loop nShipControls

        // TD3
        let vEquipmentIdentificationCode = this._v('TermsOfTransport/EquipmentIdentificationCode', nHeader);
        if (vEquipmentIdentificationCode) {
            let TD3 = this._initSegX12('TD3', 9);
            let nEquipmentID = this._e('TermsOfTransport/Extrinsic[@name="EquipmentID"]', nHeader);
            let vEquipmentID = nEquipmentID ? this._v('', nEquipmentID) : '';
            this._setV(TD3, 1, this._mci(MAPS.mapTD3, vEquipmentIdentificationCode));
            this._setV(TD3, 3, vEquipmentID);
            this._setV(TD3, 9, this._v('TermsOfTransport/SealID', nHeader));

        }

        // TD4 Each /Hazard creates a new TD4 segment
        let nHazards = this._es('Hazard', nHeader);
        nHazards = nHazards ?? [];
        for (let nHazard of nHazards) {
            let vDomain = this._v('Classification/@domain', nHazard);
            if (vDomain) {
                let TD4 = this._initSegX12('TD4', 4);
                this._setV(TD4, 2, this._mci(MAPS.mapTD4, vDomain));
                this._setV(TD4, 3, this._v('Classification', nHazard));
                this._setV(TD4, 4, this._v('Description', nHazard))
            }
        } // end loop nHazards

        // REF IdReference
        let nIDRefs = this._ns('IdReference', nHeader);
        nIDRefs = nIDRefs ?? [];
        for (let nIDRef of nIDRefs) {
            let vMappedDomain = this._mci(MAPS.mapREF_I_IDREF, this._v('@domain', nIDRef));
            if (vMappedDomain) {
                this._REF(vMappedDomain, '', this._v('@Identifier', nIDRef));
            }
        }

        // REF TransportTerms Other
        let nTransOther = this._e('TermsOfDelivery/TransportTerms[@value="Other"]', nHeader);
        if (nTransOther) {
            this._REF('0L', 'FOB05', this._v('', nTransOther));
        }

        // REF TermsOfDelivery/Comments/Transport
        let nTODCommentTrans = this._e('TermsOfDelivery/Comments[@type="Transport"]', nHeader);
        if (nTODCommentTrans) {
            this._REF('0L', 'TransportComments', this._v('', nTODCommentTrans));
        }

        // REF TermsOfDelivery/Comments/TermsOfDelivery
        let nTODComment = this._e('TermsOfDelivery/Comments[@type="TermsOfDelivery"]', nHeader);
        if (nTODComment) {
            this._REF('0L', 'TODComments', this._v('', nTODComment));
        }

        // REF ShippingInstructions
        let vShipInstru = this._v('TransportInformation/ShippingInstructions/Description', nShipControl);
        if (vShipInstru) {
            this._REF('0N', 'ShipInstruct', vShipInstru.substring(0, 30));
        }

        // REF trackingNumber
        let nTrackingNumber = this._e('ShipmentIdentifier [@domain="trackingNumber"]', nShipControl);
        if (nTrackingNumber) {
            let vDate = this._v('@trackingNumberDate', nTrackingNumber);
            this._REF('CN', this._v('trackingURL', nTrackingNumber), Utils.dateStr304TZ(vDate, ''));
        }

        // REF billOfLading
        let nBillOfLading = this._e('ShipmentIdentifier[@domain="billOfLading"]', nShipControl);
        if (nBillOfLading) {
            this._REF('BM', this._v('', nBillOfLading), '');
        }

        // REF Comments and Attachment
        let nHeaderComments = this._es('Comments', nHeader);
        nHeaderComments = nHeaderComments ?? [];
        let iUnique = 100;
        for (let nCom of nHeaderComments) {
            let vCom = this._v('', nCom);
            let vLang = this._v('@xml:lang', nCom);
            vLang = vLang ? vLang : 'EN';
            let vType = this._v('@type', nCom);
            // Comment
            while (vCom) {
                let REF_COM = this._initSegX12('REF', 4);
                this._setV(REF_COM, 1, 'L1');
                this._setV(REF_COM, 2, iUnique.toString());
                this._setV(REF_COM, 3, vCom.substring(0, 80));
                vCom = vCom.substring(80);
                this._setV(REF_COM, 401, 'L1');
                this._setV(REF_COM, 402, vLang);
                if (vType) {
                    this._setV(REF_COM, 403, '0L');
                    this._setV(REF_COM, 404, vType.substring(0, 30));
                }
                if (vType.length > 30) {
                    this._setV(REF_COM, 405, '0L');
                    this._setV(REF_COM, 406, vType.substring(30));
                }
            }
            // Attachment
            let vURL = this._v('Attachment/URL', nCom);
            let vURL_Name = this._v('Attachment/URL/@name', nCom);
            if (vURL) {
                let REF_URL = this._initSegX12('REF', 4);
                this._setV(REF_URL, 1, 'URL');
                this._setV(REF_URL, 2, iUnique.toString());
                this._setV(REF_URL, 3, vURL.substring(0, 80));
                let sLeft = '';
                if (vURL_Name) {
                    this._setV(REF_URL, 401, '0L');
                    this._setV(REF_URL, 402, vURL_Name);
                } else {
                    this._setTV(REF_URL, 401, 'URL');
                    this._setTV(REF_URL, 402, vURL.substring(0, 30));
                    vURL = vURL.substring(30);
                }
                for (let i = 3; i <= 6; i++) {
                    if (vURL) {
                        this._setTV(REF_URL, 400 + i, vURL.substring(0, 30));
                        vURL = vURL.substring(30);
                    }
                }
            } // end if vURL
            iUnique++;
        } // end loop nHeaderComments

        // REF Extrinsic
        let nExtrinsics = this._es('Extrinsic', nHeader);
        nExtrinsics = nExtrinsics ?? [];
        for (let nExt of nExtrinsics) {
            let vName = this._v('@name', nExt);
            let vVal = this._v('', nExt);
            let REF = this._initSegX12('REF', 3);
            if (this._mei(MAPS.mapREF_Extrinsic, vName)) {
                this._setV(REF, 1, this._mci(MAPS.mapREF_Extrinsic, vName));
                this._setV(REF, 3, vVal);
            } else {
                this._setV(REF, 1, 'ZZ');
                this._setV(REF, 2, vName);
                this._setV(REF, 3, vVal);
            }
        }
        // DTM 
        this._DTM_X12(nHeader, '@noticeDate', '111');
        this._DTM_X12(nHeader, '@shipmentDate', '011');
        this._DTM_X12(nHeader, '@requestedDeliveryDate', '012');
        this._DTM_X12(nHeader, 'Extrinsic[@name="PickUpDate"]', '118');

        // FOB
        let nToD = this._e('TermsOfDelivery',nHeader);
        if(nToD) {
            let vShippingPaymentMethod = this._v('ShippingPaymentMethod/@value',nToD);
            let vMappedValue = this._mci(MAPS.mapFOB01_146,vShippingPaymentMethod);
            let FOB = this._initSegX12('FOB',7);
            this._setV(FOB,1,vMappedValue);
            if(vShippingPaymentMethod == 'Other') {
                // ZZ
                this._setV(FOB,2,'ZZ');
                this._setV(FOB,3,'ZZ');

            } else {
                // ZN
                this._setV(FOB,2,'ZN');
            }
        }


        this._SE();
        this._GE();
        this._IEA();

        this._tidySegCascade();
        const output = this._segs.join(constants.ediDocument.lineBreak);
        return output;
    } // end function fromXML


    private _REF(v1: string, v2: string, v3: string) {
        let nCnt = 3;
        if (!v3) {
            nCnt = 2;
        }
        let REF = this._initSegX12('REF', nCnt);
        this._setV(REF, 1, v1);
        if (v2) {
            this._setV(REF, 2, v2);
        }
        if (v3) {
            this._setV(REF, 3, v3);
        }
    }
    /**
     * 
     * @param vX12Type 
     */
    protected _TD1(sX12Type: string, sQTY: string, sUOM) {
        let TD1 = this._initSegX12('TD1', 8);
        this._setV(TD1, 6, sX12Type);
        this._setV(TD1, 7, sQTY);
        this._setV(TD1, 8, this._mcs(MAPS.mapUOM, sUOM));
    }
    /**
     * 
     * @param sLevel 
     * @param nPortions 
     * @returns Packaging element
     */
    protected _findPackageWithLevel(sLevel: string, nPortions: Element[]): Element {
        if (!nPortions) {
            return undefined;
        }
        for (let nP of nPortions) {
            let nItems = this._es('ShipNoticeItem', nP);
            nItems = nItems ?? [];
            for (let nItem of nItems) {
                let nPackagings = this._es('Packaging', nItem);
                nPackagings = nPackagings ?? [];
                for (let nP of nPackagings) {
                    let vLevel = this._v('PackagingLevelCode', nP);
                    if (!sLevel && !vLevel) {
                        return nP;
                    }
                    if (vLevel && vLevel == sLevel) {
                        return nP;
                    }
                }
            }
        }
        return undefined;

    }
} // end main class

class MAPS {
    static mapBSN01: Object = {
        "new": "00",
        "delete": "03",
        "update": "05",
    };
    static mapBSN06: Object = {
        "actual": "09",
        "planned": "PL",
    };
    static mapBSN07: Object = {
        "complete": "C20",
        "partial": "B44",
    };
    static mapUOM: Object = {
        "5": "05",
        "6": "04",
        "8": "08",
        "10": "10",
        "11": "11",
        "13": "13",
        "14": "14",
        "15": "15",
        "16": "16",
        "17": "17",
        "18": "18",
        "19": "19",
        "20": "20",
        "21": "21",
        "22": "22",
        "23": "23",
        "24": "24",
        "25": "25",
        "26": "26",
        "27": "27",
        "28": "28",
        "29": "29",
        "30": "30",
        "31": "31",
        "32": "32",
        "33": "33",
        "34": "34",
        "35": "35",
        "36": "36",
        "37": "37",
        "38": "38",
        "40": "40",
        "41": "41",
        "43": "43",
        "44": "44",
        "45": "45",
        "46": "46",
        "47": "47",
        "48": "48",
        "53": "53",
        "54": "54",
        "56": "56",
        "57": "57",
        "58": "58",
        "59": "59",
        "60": "60",
        "61": "61",
        "62": "62",
        "63": "63",
        "64": "64",
        "66": "66",
        "69": "69",
        "71": "71",
        "72": "72",
        "73": "73",
        "74": "74",
        "76": "76",
        "77": "77",
        "78": "78",
        "80": "80",
        "81": "81",
        "84": "84",
        "85": "85",
        "87": "87",
        "89": "89",
        "90": "90",
        "91": "91",
        "92": "92",
        "93": "93",
        "94": "94",
        "95": "95",
        "96": "96",
        "97": "97",
        "98": "98",
        "1A": "1A",
        "1B": "1B",
        "1C": "1C",
        "1D": "1D",
        "1E": "1E",
        "1F": "1F",
        "1G": "1G",
        "1H": "1H",
        "1I": "1I",
        "1J": "1J",
        "1K": "1K",
        "1L": "1L",
        "1M": "1M",
        "1X": "1X",
        "2A": "2A",
        "2B": "2B",
        "2C": "2C",
        "2I": "2I",
        "2J": "2J",
        "2K": "2K",
        "2L": "2L",
        "2M": "2M",
        "2N": "2N",
        "2P": "2P",
        "2Q": "2Q",
        "2R": "2R",
        "2U": "2U",
        "2V": "2V",
        "2W": "2W",
        "2X": "2X",
        "2Y": "2Y",
        "2Z": "2Z",
        "3B": "3B",
        "3C": "3C",
        "3E": "3E",
        "3G": "3G",
        "3H": "3H",
        "3I": "3I",
        "4A": "4A",
        "4B": "4B",
        "4C": "4C",
        "4E": "4E",
        "4G": "4G",
        "4H": "4H",
        "4K": "4K",
        "4L": "4L",
        "4M": "4M",
        "4N": "4N",
        "4O": "4O",
        "4P": "4P",
        "4Q": "4Q",
        "4R": "4R",
        "4T": "4T",
        "4U": "4U",
        "4W": "4W",
        "4X": "4X",
        "5A": "5A",
        "5B": "5B",
        "5C": "5C",
        "5E": "5E",
        "5F": "5F",
        "5G": "5G",
        "5H": "5H",
        "5I": "5I",
        "5J": "5J",
        "5K": "5K",
        "5P": "5P",
        "5Q": "5Q",
        "A11": "AG",
        "A53": "79",
        "AA": "AA",
        "AB": "AB",
        "ACR": "AC",
        "ACT": "KU",
        "AD": "AD",
        "AE": "AE",
        "AH": "AH",
        "AI": "AI",
        "AJ": "AJ",
        "AK": "AK",
        "AL": "AL",
        "AM": "AM",
        "AMP": "68",
        "ANN": "YR",
        "AP": "AP",
        "APZ": "TO",
        "AQ": "AQ",
        "AR": "AR",
        "AS": "AS",
        "ATM": "AT",
        "AV": "AV",
        "AW": "AW",
        "AY": "AY",
        "AZ": "AZ",
        "B0": "B0",
        "B1": "B1",
        "B2": "B2",
        "B3": "B3",
        "B35": "3F",
        "B4": "B4",
        "B5": "B5",
        "B6": "B6",
        "B7": "B7",
        "B9": "B9",
        "BB": "BB",
        "BD": "B8",
        "BE": "BD",
        "BFT": "BF",
        "BG": "BG",
        "BH": "BH",
        "BHP": "BQ",
        "BJ": "BC",
        "BK": "BS",
        "BL": "BA",
        "BLD": "",
        "BLL": "BR",
        "BO": "BO",
        "BP": "BP",
        "BQL": "R2",
        "BR": "BI",
        "BT": "BM",
        "BTU": "BY",
        "BUA": "BU",
        "BUI": "BV",
        "BW": "BW",
        "BX": "BX",
        "BZ": "BZ",
        "C0": "C0",
        "C1": "C1",
        //"C18": "",
        "C2": "C2",
        "C34": "F5",
        "C4": "C4",
        "C5": "C5",
        "C6": "C6",
        "C62": "UN",
        "C7": "C7",
        "C77": "PJ",
        "C81": "RB",
        "C9": "C9",
        "CA": "CN",
        "CEL": "CE",
        "CEN": "HU",
        "CG": "CG",
        "CGM": "AF",
        "CH": "Z2",
        "CJ": "CJ",
        "CK": "CK",
        "CL": "CX",
        "CLT": "C3",
        "CMK": "SC",
        "CMQ": "CC",
        "CMT": "CM",
        "CN": "CH",
        "CNP": "4F",
        "CO": "CB",
        "COU": "65",
        "CQ": "CQ",
        "CR": "CP",
        "CS": "CA",
        "CT": "CT",
        "CTM": "CD",
        "CU": "CU",
        "CUR": "4D",
        "CV": "CV",
        "CWA": "CW",
        "CWI": "HW",
        "CY": "CL",
        "CZ": "CZ",
        "D14": "TU",
        "D23": "N4",
        "D5": "D5",
        "D63": "BK",
        "D64": "BL",
        "D65": "RO",
        "D66": "CS",
        "D67": "A8",
        "D7": "SA",
        "D79": "BE",
        "D8": "D8",
        "D9": "D9",
        "D90": "CO",
        "D91": "R8",
        "D92": "BJ",
        "D95": "JG",
        "D96": "PG",
        "D97": "PL",
        "D98": "PU",
        "D99": "SL",
        "DAY": "DA",
        "DB": "DB",
        "DC": "DC",
        "DD": "DD",
        "DE": "DE",
        "DG": "DG",
        "DI": "DI",
        "DJ": "DJ",
        "DLT": "DL",
        "DMK": "D3",
        "DMQ": "C8",
        "DMT": "DM",
        "DN": "DN",
        "DPR": "DP",
        "DQ": "DQ",
        "DR": "DR",
        "DRA": "DF",
        "DS": "DS",
        "DT": "DT",
        "DU": "DU",
        "DWT": "WP",
        "DX": "DX",
        "DY": "DY",
        "DZN": "DZ",
        "E2": "BT",
        "E3": "NT",
        "E4": "GT",
        "E5": "MT",
        "E51": "JA",
        "EA": "EA",
        "EB": "EB",
        "EC": "EC",
        "EP": "EP",
        "EQ": "EQ",
        "EV": "EV",
        "F1": "F1",
        "F9": "F9",
        "FAH": "FA",
        "FAR": "83",
        "FB": "FB",
        "FC": "FC",
        "FD": "FD",
        "FE": "FE",
        "FF": "FF",
        "FG": "FG",
        "FH": "FH",
        "FL": "FL",
        "FM": "FM",
        "FOT": "FT",
        "FP": "FP",
        "FR": "FR",
        "FS": "FS",
        "FTK": "SF",
        "FTQ": "CF",
        "G2": "G2",
        "G3": "G3",
        "G7": "G7",
        "GB": "GB",
        "GBQ": "G4",
        "GC": "GC",
        "GD": "GD",
        "GE": "GE",
        "GGR": "GG",
        "GH": "GH",
        "GII": "G5",
        "GJ": "GJ",
        "GK": "GK",
        "GL": "GL",
        "GLI": "GI",
        "GLL": "GA",
        "GM": "GM",
        "GN": "GN",
        "GO": "GO",
        "GP": "GP",
        "GQ": "GQ",
        "GRM": "GR",
        "GRN": "GX",
        "GRO": "GS",
        "GT": "TG",
        "GV": "GV",
        "GW": "GW",
        "GY": "GY",
        "GZ": "GZ",
        "H1": "H1",
        "H2": "H2",
        "H87": "PC",
        "HA": "HA",
        "HAR": "HQ",
        "HBX": "HB",
        "HC": "HC",
        "HD": "HD",
        "HE": "HE",
        "HF": "HF",
        "HGM": "HG",
        "HH": "HH",
        "HI": "HI",
        "HJ": "HJ",
        "HK": "HK",
        "HL": "HL",
        "HLT": "H4",
        "HM": "HM",
        "HMT": "E1",
        "HN": "HN",
        "HO": "HO",
        "HP": "HP",
        "HS": "HS",
        "HT": "HT",
        "HTZ": "HZ",
        "HUR": "HR",
        "HY": "HY",
        "IA": "IA",
        "IC": "IC",
        "IE": "IE",
        "IF": "IF",
        "II": "II",
        "IL": "IL",
        "IM": "IM",
        "INH": "IN",
        "INK": "SI",
        "INQ": "CI",
        "IP": "IP",
        "IT": "IT",
        "IU": "IU",
        "IV": "IV",
        "J2": "J2",
        "JB": "JB",
        "JE": "JE",
        "JG": "JU",
        "JK": "JK",
        "JM": "JM",
        "JO": "JO",
        "JOU": "86",
        "JR": "JR",
        "K1": "K1",
        "K2": "K2",
        "K3": "K3",
        "K5": "K5",
        "K6": "K6",
        "KA": "KA",
        "KB": "KB",
        "KD": "KD",
        "KEL": "KV",
        "KF": "KF",
        "KG": "KE",
        "KGM": "KG",
        "KI": "KI",
        "KJ": "KJ",
        "KJO": "",
        "KL": "KL",
        "KMH": "KP",
        "KMK": "8U",
        "KMQ": "KC",
        "KMT": "DK",
        "KNT": "EH",
        "KO": "KO",
        "KPA": "KQ",
        "KR": "KR",
        "KS": "KS",
        "KT": "KT",
        "KVA": "K4",
        "KVT": "",
        "KW": "KW",
        "KWH": "KH",
        "KWT": "K7",
        "KX": "KX",
        "L2": "L2",
        "LA": "LA",
        "LBR": "LB",
        "LBT": "TX",
        "LC": "LC",
        "LD": "LQ",
        "LE": "LE",
        "LEF": "X7",
        "LF": "LF",
        "LH": "LH",
        "LI": "LI",
        "LJ": "LJ",
        "LK": "LK",
        "LM": "LM",
        "LN": "LN",
        "LO": "LO",
        "LP": "LP",
        "LR": "LR",
        "LS": "LS",
        "LTN": "LG",
        "LTR": "LT",
        "LX": "LX",
        "LY": "LY",
        "M0": "M0",
        "M1": "M1",
        "M4": "M4",
        "M5": "M5",
        "M7": "M7",
        "M9": "M9",
        "MA": "MA",
        "MBF": "TM",
        "MBR": "M6",
        "MC": "MC",
        "MCU": "MU",
        "MD": "MD",
        "MF": "MF",
        "MGM": "ME",
        "MHZ": "N6",
        "MIK": "SB",
        "MIL": "TH",
        "MIN": "MJ",
        "MK": "MK",
        "MLT": "ML",
        "MMK": "MS",
        "MMQ": "",
        "MMT": "MM",
        "MON": "MO",
        "MPA": "M8",
        "MQ": "MQ",
        "MQH": "4V",
        "MSK": "4J",
        "MT": "M3",
        "MTK": "SM",
        "MTQ": "CR",
        "MTR": "MR",
        "MTS": "4I",
        "MV": "MV",
        "MWH": "T9",
        "N1": "N1",
        "N2": "N2",
        "N3": "N3",
        "NA": "NA",
        "NB": "NB",
        "NC": "NC",
        "ND": "ND",
        "NE": "NE",
        "NEW": "NW",
        "NF": "NF",
        "NG": "NG",
        "NH": "NH",
        "NI": "NI",
        "NJ": "NJ",
        "NL": "NL",
        "NMI": "NM",
        "NN": "NN",
        "NQ": "NQ",
        "NR": "NR",
        "NT": "MN",
        "NU": "NU",
        "NV": "NV",
        "NX": "NX",
        "NY": "NY",
        "OA": "OA",
        "OHM": "82",
        "ON": "ON",
        "OP": "OP",
        "OT": "OT",
        "OZ": "OZ",
        "OZA": "FO",
        "OZI": "FZ",
        "P0": "P0",
        "P1": "P1",
        "P2": "P2",
        "P3": "P3",
        "P4": "P4",
        "P5": "P5",
        "P6": "P6",
        "P7": "P7",
        "P8": "P8",
        "P9": "P9",
        "PA": "12",
        "PAL": "4S",
        "PB": "PB",
        "PD": "PD",
        "PE": "PE",
        "PF": "PF",
        "PG": "PP",
        "PGL": "",
        "PI": "PI",
        "PK": "PK",
        "PL": "PA",
        "PM": "PM",
        "PN": "PN",
        "PO": "PO",
        "PQ": "PQ",
        "PR": "PR",
        "PS": "PS",
        "PT": "PT",
        "PTD": "Q2",
        "PTI": "PX",
        "PU": "TY",
        "PV": "PV",
        "PW": "PW",
        "PY": "PY",
        "PZ": "PZ",
        "Q3": "Q3",
        "QA": "QA",
        "QAN": "Q1",
        "QB": "QB",
        "QD": "QD",
        "QH": "QH",
        "QK": "QK",
        "QR": "QR",
        "QT": "QT",
        "QTD": "QS",
        "QTI": "QU",
        "R1": "R1",
        "R4": "R4",
        "R9": "R9",
        "RA": "RA",
        "RD": "RD",
        "RG": "RG",
        "RH": "RH",
        "RK": "RK",
        "RL": "RE",
        "RM": "RM",
        "RN": "RN",
        "RO": "RL",
        "RP": "RP",
        "RPM": "R3",
        "RS": "RS",
        "RT": "RT",
        "RU": "RU",
        "S3": "S3",
        "S4": "S4",
        "S5": "S5",
        "S6": "S6",
        "S7": "S7",
        "S8": "S8",
        "SA": "SJ",
        "SCR": "",
        "SD": "SD",
        "SE": "SE",
        "SEC": "03",
        "SET": "ST",
        "SG": "SG",
        "SIE": "67",
        "SK": "SK",
        "SL": "S9",
        "SMI": "02",
        "SN": "SN",
        "SO": "SO",
        "SP": "SP",
        "SQ": "SQ",
        "SR": "SR",
        "SS": "SS",
        "ST": "SH",
        "STN": "TN",
        "SV": "SV",
        "SW": "SW",
        "SX": "SX",
        "T0": "T0",
        "T1": "T1",
        "T3": "T3",
        "T4": "T4",
        "T5": "T5",
        "T6": "T6",
        "T7": "T7",
        "T8": "T8",
        "TA": "TA",
        "TC": "TC",
        "TD": "TD",
        "TE": "TE",
        "TF": "TF",
        "TI": "TI",
        "TJ": "TJ",
        "TK": "TK",
        "TL": "TL",
        "TN": "",
        "TNE": "MP",
        "TP": "TP",
        "TQ": "TQ",
        "TR": "TR",
        "TS": "TS",
        "TT": "TT",
        "TU": "TB",
        "TV": "TV",
        "TW": "TW",
        "U1": "U1",
        "U2": "U2",
        "UA": "UA",
        "UB": "UB",
        "UC": "UC",
        "UD": "UD",
        "UE": "UE",
        "UF": "UF",
        "UH": "UH",
        "UM": "UM",
        "VA": "VA",
        "VI": "VI",
        "VLT": "70",
        "VQ": "BN",
        "VS": "VS",
        "W2": "W2",
        "WA": "WA",
        "WB": "WB",
        "WCD": "8C",
        "WE": "WE",
        "WEE": "WK",
        "WG": "WG",
        "WH": "WH",
        "WI": "WI",
        "WM": "WM",
        "WR": "WR",
        "WTT": "99",
        "WW": "WW",
        "X1": "X1",
        "YDK": "SY",
        "YDQ": "CY",
        "YL": "YL",
        "YRD": "YD",
        "YT": "YT",
        "Z1": "Z1",
        "Z3": "Z3",
        "Z4": "Z4",
        "Z5": "Z5",
        "Z6": "Z6",
        "Z8": "Z8",
        "ZP": "ZP",
        "ZZ": "ZZ",
    };

    static mapTD502: Object = {
        "duns": "1", // DUNS
        "scac": "2", // SCAC
        "iata": "4", // IATA
    };
    static mapTD504_I: Object = {
        "air": "A", // air
        "mail": "7", // mail
        "motor": "J", // motor
        "rail": "R", // rail
        "ship": "S", // ship
        "inlandwater": "W", // inlandWater
        "multimodal": "X", // multimodal
    };
    static mapTD504_II: Object = {
        "military official mail": "6", // Military Official Mail
        "air charter": "AC", // Air Charter
        "air express": "AE", // Air Express
        "air freight": "AF", // Air Freight
        "air taxi": "AH", // Air Taxi
        "armed forces courier service (arfcos)": "AR", // Armed Forces Courier Service (ARFCOS)
        "barge": "B", // Barge
        "book postal": "BP", // Book Postal
        "bus": "BU", // Bus
        "consolidation": "C", // Consolidation
        "customer pickup / customer's expense": "CE", // Customer Pickup / Customer's Expense
        "parcel post": "D", // Parcel Post
        "driveaway service": "DA", // Driveaway Service
        "driveaway, truckaway, towaway": "DW", // Driveaway, Truckaway, Towaway
        "expedited truck": "E", // Expedited Truck
        "european or pacific distribution system": "ED", // European or Pacific Distribution System
        "flyaway": "F", // Flyaway
        "air freight forwarder": "FA", // Air Freight Forwarder
        "motor (flatbed)": "FL", // Motor (Flatbed)
        "geographic receiving/shipping": "GG", // Geographic Receiving/Shipping
        "geographic receiving": "GR", // Geographic Receiving
        "geographic shipping": "GS", // Geographic Shipping
        "customer pickup": "H", // Customer Pickup
        "household goods truck": "HH", // Household Goods Truck
        "common irregular carrier": "I", // Common Irregular Carrier
        "backhaul": "K", // Backhaul
        "contract carrier": "L", // Contract Carrier
        "logair": "LA", // Logair
        "less than trailer load (ltl)": "LT", // Less Than Trailer Load (LTL)
        "motor (common carrier)": "M", // Motor (Common Carrier)
        "motor (bulk carrier)": "MB", // Motor (Bulk Carrier)
        "motor (package carrier)": "MP", // Motor (Package Carrier)
        "private vessel": "N", // Private Vessel
        "containerized ocean": "O", // Containerized Ocean
        "private carrier": "P", // Private Carrier
        "pooled air": "PA", // Pooled Air
        "pooled piggyback": "PG", // Pooled Piggyback
        "pipeline": "PL", // Pipeline
        "pool to pool": "PP", // Pool to Pool
        "pooled rail": "PR", // Pooled Rail
        "pooled truck": "PT", // Pooled Truck
        "conventional ocean": "Q", // Conventional Ocean
        "rail, less than carload": "RC", // Rail, Less than Carload
        "roadrailer": "RR", // Roadrailer
        "shipper agent": "SB", // Shipper Agent
        "shipper agent (truck)": "SC", // Shipper Agent (Truck)
        "shipper association": "SD", // Shipper Association
        "sea/air": "SE", // Sea/Air
        "supplier truck": "SR", // Supplier Truck
        "steamship": "SS", // Steamship
        "stack train": "ST", // Stack Train
        "best way (shippers option)": "T", // Best Way (Shippers Option)
        "towaway service": "TA", // Towaway Service
        "cab (taxi)": "TC", // Cab (Taxi)
        "tank truck": "TT", // Tank Truck
        "private parcel service": "U", // Private Parcel Service
        "motor (van)": "VA", // Motor (Van)
        "vessel, ocean": "VE", // Vessel, Ocean
        "vessel, lake": "VL", // Vessel, Lake
        "water or pipeline intermodal movement": "WP", // Water or Pipeline Intermodal Movement
        "military intratheater airlift service": "Y", // Military Intratheater Airlift Service
        "ocean conference carrier": "Y1", // Ocean Conference Carrier
        "ocean non-conference carrier": "Y2", // Ocean Non-Conference Carrier
        "other": "ZZ", // Other        
    };

    static mapTD512: Object = {
        "bulk commodity train": "01", // Bulk Commodity Train
        "premium surface": "09", // Premium Surface
        "three day service": "3D", // Three Day Service
        "9 a.m.": "9A", // 9 A.M.
        "air cargo": "AC", // Air Cargo
        "air economy": "AE", // Air Economy
        "a.m.": "AM", // A.M.
        "business class": "BC", // Business Class
        "consignee billing service": "CB", // Consignee Billing Service
        "courier express": "CE", // Courier Express
        "ground": "CG", // Ground
        "express service": "CX", // Express Service
        "delivery scheduled next day by cartage agent": "D1", // Delivery Scheduled Next Day by Cartage Agent
        "delivery scheduled second day by cartage agent": "D2", // Delivery scheduled second day by cartage agent
        "delivery scheduled third day by cartage agent": "D3", // Delivery scheduled third day by cartage agent
        "delivery confirmation": "DC", // Delivery Confirmation
        "deferred service": "DF", // Deferred Service
        "delivery confirmation return": "DR", // Delivery Confirmation Return
        "door service": "DS", // Door Service
        "delivery notification only": "DT", // Delivery Notification Only
        "expedited service": "ES", // Expedited Service
        "proof of delivery (pod) with signature": "ET", // Proof of Delivery (POD) with Signature
        "first class": "FC", // First Class
        "standard service": "G2", // Standard Service
        "express service plus": "GP", // Express Service Plus
        "tracking - ground": "GT", // Tracking - Ground
        "iata": "IA", // IATA
        "expedited service - worldwide": "IE", // Expedited Service - Worldwide
        "express service - worldwide": "IX", // Express Service - Worldwide
        "metro": "ME", // Metro
        "multiweight": "MW", // Multiweight
        "next day air": "ND", // Next Day Air
        "next flight out": "NF", // Next Flight Out
        "next day hundred weight": "NH", // Next Day Hundred Weight
        "next morning": "NM", // Next Morning
        "not served": "NS", // Not Served
        "overnight": "ON", // Overnight
        "primary service area - next day by 10:30 a.m.": "PA", // Primary Service Area - Next Day by 10:30 A.M.
        "priority mail": "PB", // Priority Mail
        "primary service area - next day by 9:30 am": "PC", // Primary Service Area - Next Day By 9:30 AM
        "priority mail insured": "PI", // Priority Mail Insured
        "pm": "PM", // PM
        "primary service area - next day by noon": "PN", // Primary Service Area - Next Day by Noon
        "p.o. box/zip code": "PO", // P.O. Box/Zip Code
        "primary service area - next day by 5:00 p.m.": "PR", // Primary Service Area - Next Day by 5:00 P.M.
        "primary service area - second day by noon": "PS", // Primary Service Area - Second Day by Noon
        "passenger service": "R1", // Passenger Service
        "quality intermodal high speed 70 miles per hour (mph)": "R2", // Quality Intermodal High Speed 70 Miles Per Hour (MPH)
        "other intermodal and stack service": "R3", // Other Intermodal and Stack Service
        "60 miles per hour (mph) service": "R4", // 60 Miles Per Hour (MPH) Service
        "manifest freight": "R5", // Manifest Freight
        "circus train": "R6", // Circus Train
        "work train": "R7", // Work Train
        "commuter service": "R8", // Commuter Service
        "authorized return service": "RS", // Authorized Return Service
        "same day": "SA", // Same Day
        "second day air": "SC", // Second Day Air
        "saturday": "SD", // Saturday
        "second day": "SE", // Second Day
        "standard ground": "SG", // Standard Ground
        "second day hundred weight": "SH", // Second Day Hundred Weight
        "standard ground hundred weight": "SI", // Standard Ground Hundred Weight
        "second morning": "SM", // Second Morning
        "saturday pickup": "SP", // Saturday Pickup
        "standard class": "ST", // Standard Class
        "other": "ZZ", // Other
    };

    static mapTD4: Object = {
        "nahg": "9", // NAHG
        "imdg": "I", // IMDG
        "undg": "U", // UNDG
    }



    static mapTD3: Object = {
        "20 ft. il container (open top)": "20", // 20 ft. IL Container (Open Top)
        "20 ft. il container (closed top)": "2B", // 20 ft. IL Container (Closed Top)
        "control unit": "2D", // Control Unit
        "helper unit": "2E", // Helper Unit
        "roadrailer": "2F", // Roadrailer
        "cut-in helper": "2G", // Cut-in Helper
        "40 ft. il container (open top)": "40", // 40 ft. IL Container (Open Top)
        "40 ft. il container (closed top)": "4B", // 40 ft. IL Container (Closed Top)
        "closed container": "AC", // Closed Container
        "air freight (break bulk)": "AF", // Air Freight (Break Bulk)
        "container, aluminum": "AL", // Container, Aluminum
        "aircraft": "AP", // Aircraft
        "closed container (controlled temperature)": "AT", // Closed Container (Controlled Temperature)
        "covered barge": "BC", // Covered Barge
        "bilevel railcar fully open": "BE", // Bilevel Railcar Fully Open
        "bilevel railcar fully enclosed": "BF", // Bilevel Railcar Fully Enclosed
        "bogie": "BG", // Bogie
        "bilevel railcar screened with roof": "BH", // Bilevel Railcar Screened With Roof
        "bilevel railcar screened, no roof": "BJ", // Bilevel Railcar Screened, No Roof
        "container, bulk": "BK", // Container, Bulk
        "barge open": "BO", // Barge Open
        "barge": "BR", // Barge
        "boxcar": "BX", // Boxcar
        "caboose": "CA", // Caboose
        "chassis, gooseneck": "CB", // Chassis, Gooseneck
        "container resting on a chassis": "CC", // Container resting on a Chassis
        "container with bag hangers": "CD", // Container with Bag Hangers
        "container, tank (gas)": "CG", // Container, Tank (Gas)
        "chassis": "CH", // Chassis
        "container, insulated": "CI", // Container, Insulated
        "container, insulated/ventilated": "CJ", // Container, Insulated/Ventilated
        "container, heated/insulated/ventilated": "CK", // Container, Heated/Insulated/Ventilated
        "container (closed top - length unspecified)": "CL", // Container (Closed Top - Length Unspecified)
        "container, open-sided": "CM", // Container, Open-Sided
        "container": "CN", // Container
        "coil car open": "CP", // Coil Car Open
        "container, tank (food grade-liquid)": "CQ", // Container, Tank (Food Grade-Liquid)
        "coil-car covered": "CR", // Coil-Car Covered
        "container-low side open top": "CS", // Container-Low Side Open Top
        "container-high side open top": "CT", // Container-High Side Open Top
        "container (open top - length unspecified)": "CU", // Container (Open Top - Length Unspecified)
        "closed van": "CV", // Closed Van
        "container, tank (chemicals)": "CW", // Container, Tank (Chemicals)
        "container, tank": "CX", // Container, Tank
        "refrigerated container": "CZ", // Refrigerated Container
        "double-drop trailer": "DD", // Double-Drop Trailer
        "container with flush doors": "DF", // Container with Flush Doors
        "drop back trailer": "DT", // Drop Back Trailer
        "boxcar, damage free equipped": "DX", // Boxcar, Damage Free Equipped
        "end of train device": "ET", // End of Train Device
        "frozen food trailer": "FF", // Frozen Food Trailer
        "flat bed trailer with headboards": "FH", // Flat Bed Trailer with Headboards
        "flat bed trailer with no headboards": "FN", // Flat Bed Trailer with No Headboards
        "flatcar with pedestal": "FP", // Flatcar With Pedestal
        "flat bed trailer - removable sides": "FR", // Flat Bed Trailer - Removable Sides
        "container with floor securing rings": "FS", // Container with Floor Securing Rings
        "flat bed trailer": "FT", // Flat Bed Trailer
        "boxcar cushion under frame of": "FX", // Boxcar Cushion Under Frame OF
        "generator set": "GS", // Generator Set
        "container with hangar bars": "HB", // Container with Hangar Bars
        "hopper car (covered)": "HC", // Hopper Car (Covered)
        "hopper car (open)": "HO", // Hopper Car (Open)
        "hopper car (covered; pneumatic discharge)": "HP", // Hopper Car (Covered; Pneumatic Discharge)
        "head of train device": "HT", // Head of Train Device
        "high cube van": "HV", // High Cube Van
        "hydrant-cart": "HY", // Hydrant-Cart
        "idler car": "ID", // Idler Car
        "boxcar (insulated)": "IX", // Boxcar (Insulated)
        "locomotive": "LO", // Locomotive
        "half height flat rack": "LS", // Half Height Flat Rack
        "load/unload device on equipment": "LU", // Load/unload Device on Equipment
        "boxcar (interior bulkheads)": "NX", // Boxcar (Interior Bulkheads)
        "ocean vessel (break bulk)": "OB", // Ocean Vessel (Break Bulk)
        "open-top/flatbed trailer": "OT", // Open-top/flatbed trailer
        "open top van": "OV", // Open Top Van
        "container, platform": "PL", // Container, Platform
        "power pack": "PP", // Power Pack
        "protected trailer": "PT", // Protected Trailer
        "pick-up truck": "PU", // Pick-up Truck
        "fixed-rack, flat-bed trailer": "RA", // Fixed-Rack, Flat-Bed Trailer
        "refrigerated (reefer) car": "RC", // Refrigerated (Reefer) Car
        "fixed-rack, double drop trailer": "RD", // Fixed-Rack, Double Drop Trailer
        "flat car (end bulkheads)": "RE", // Flat Car (End Bulkheads)
        "flat car": "RF", // Flat Car
        "gondola covered": "RG", // Gondola Covered
        "gondola car (covered - interior bulkheads)": "RI", // Gondola Car (Covered - Interior Bulkheads)
        "gondola car (open)": "RO", // Gondola Car (Open)
        "rail car": "RR", // Rail Car
        "fixed-rack, single-drop trailer": "RS", // Fixed-Rack, Single-Drop Trailer
        "controlled temperature trailer (reefer)": "RT", // Controlled Temperature Trailer (Reefer)
        "saddle": "SA", // Saddle
        "service car": "SC", // Service Car
        "single-drop trailer": "SD", // Single-Drop Trailer
        "stack car": "SK", // Stack Car
        "container, steel": "SL", // Container, Steel
        "stak-rak": "SR", // STAK-RAK
        "container with smooth sides": "SS", // Container with Smooth Sides
        "removable side trailer": "ST", // Removable Side Trailer
        "van - special inside length, width or height requirements": "SV", // Van - Special Inside Length, Width or Height Requirements
        "trailer, heated/insulated/ventilated": "TA", // Trailer, Heated/Insulated/Ventilated
        "trailer, boat": "TB", // Trailer, Boat
        "trailer, car": "TC", // Trailer, Car
        "trailer, dry freight": "TF", // Trailer, Dry Freight
        "trailer, tank (gas)": "TG", // Trailer, Tank (Gas)
        "truck, open top high side": "TH", // Truck, Open Top High Side
        "trailer, insulated": "TI", // Trailer, Insulated
        "trailer, tank (chemicals)": "TJ", // Trailer, Tank (Chemicals)
        "trailer, tank (food grade-liquid)": "TK", // Trailer, Tank (Food Grade-Liquid)
        "trailer (not otherwise specified)": "TL", // Trailer (not otherwise specified)
        "trailer, insulated/ventilated": "TM", // Trailer, Insulated/Ventilated
        "tank car": "TN", // Tank Car
        "truck, open top": "TO", // Truck, Open Top
        "trailer, pneumatic": "TP", // Trailer, Pneumatic
        "trailer, electric heat": "TQ", // Trailer, Electric Heat
        "tractor": "TR", // Tractor
        "telescoping trailer": "TT", // Telescoping Trailer
        "truck, open top low side": "TU", // Truck, Open Top Low Side
        "truck, van": "TV", // Truck, Van
        "trailer, refrigerated": "TW", // Trailer, Refrigerated
        "trilevel railcar 20 feet": "UA", // Trilevel Railcar 20 Feet
        "trilevel railcar screened, fully enclosed": "UB", // Trilevel Railcar Screened, Fully Enclosed
        "trilevel railcar screened, with roof": "UC", // Trilevel Railcar Screened, With Roof
        "trilevel railcar screened, no roof": "UD", // Trilevel Railcar Screened, No Roof
        "trilevel railcar screened, with doors, no roof": "UE", // Trilevel Railcar Screened, With Doors, No Roof
        "unit load device (uld)": "UL", // Unit Load Device (ULD)
        "container, upgraded": "UP", // Container, Upgraded
        "container, vented": "VA", // Container, Vented
        "vessel, ocean": "VE", // Vessel, Ocean
        "vessel, lake": "VL", // Vessel, Lake
        "vessel, ocean, rollon-rolloff": "VR", // Vessel, Ocean, Rollon-Rolloff
        "vessel, ocean, lash": "VS", // Vessel, Ocean, Lash
        "vessel, ocean, containership": "VT", // Vessel, Ocean, Containership
        "container with wavy or ripple sides": "WR", // Container with Wavy or Ripple Sides
        "railroad maintenance of way car": "WY", // Railroad Maintenance of Way Car

    }

    static mapREF_I_IDREF: Object = {
        "governmentnumber": "AEC", // governmentNumber
        "customerreferenceid": "CR", // customerReferenceID
        "ultimatecustomerreferenceid": "EU", // ultimateCustomerReferenceID
        "supplierreference": "D2", // supplierReference
    };
    static mapREF_Extrinsic: Object = {
        "supplierorderid": "VN", // SupplierOrderID
        "invoiceid": "IN", // InvoiceID
        "shippingcontractnumber": "CT", // ShippingContractNumber
    }
    static mapFOB01_146: Object = {
        "rule11shipment": "11", // Rule11Shipment
        "paidbybuyer": "BP", // PaidByBuyer
        "advancecollect": "CA", // AdvanceCollect
        "collect": "CC", // Collect
        "collectondelivery": "CD", // CollectOnDelivery
        "collectfreightcreditedtopaymentcustomer": "CF", // CollectFreightCreditedToPaymentCustomer
        "percontract": "DE", // PerContract
        "account": "DF", // Account
        "cashondeliveryservicechargepaidbyconsignee": "DF", // CashOnDeliveryServiceChargePaidByConsignee
        "cashondeliveryservicechargepaidbyconsignor": "DF", // CashOnDeliveryServiceChargePaidByConsignor
        "definedbybuyerandseller": "DF", // DefinedByBuyerAndSeller
        "informationcopy-nopaymentdue": "DF", // InformationCopy-NoPaymentDue
        "insurancecostspaidbyconsignee": "DF", // InsuranceCostsPaidByConsignee
        "insurancecostspaidbyconsignor": "DF", // InsuranceCostsPaidByConsignor
        "notspecified": "DF", // NotSpecified
        "payableelsewhere": "DF", // PayableElsewhere
        "other": "DF", // Other
        "fobportofcall": "FO", // FobPortOfCall
        "halfprepaid": "HP", // HalfPrepaid
        "mixed": "MX", // Mixed
        "servicefreight-nocharge": "NC", // ServiceFreight-NoCharge
        "nonrevenue": "NR", // NonRevenue
        "advanceprepaid": "PA", // AdvancePrepaid
        "customerpick-uporbackhaul": "PB", // CustomerPick-UpOrBackhaul
        "prepaidbutchargedtocustomer": "PC", // PrepaidButChargedToCustomer
        "prepaidbyprocessor": "PD", // PrepaidByProcessor
        "prepaidandsummarybill": "PE", // PrepaidAndSummaryBill
        "prepaidlocalcollectoutstate": "PL", // PrepaidLocalCollectOutstate
        "prepaidonly": "PO", // PrepaidOnly
        "prepaid-byseller": "PP", // Prepaid-BySeller
        "paidbysupplierorseller": "PS", // PaidBySupplierOrSeller
        "pickup": "PU", // Pickup
        "returncontainerfreightpaidbycustomer": "RC", // ReturnContainerFreightPaidByCustomer
        "returncontainerfreightfree": "RF", // ReturnContainerFreightFree
        "returncontainerfreightpaidbysupplier": "RS", // ReturnContainerFreightPaidBySupplier
        "thirdpartypay": "TP", // ThirdPartyPay
        "weightcondition": "WC", // WeightCondition
    };

    static mapFOB_335: Object = {
        "costandfreight": "CAF", // CostAndFreight
        "cost-insuranceandfreight": "CIF", // Cost-InsuranceAndFreight
        "carriage-insurancepaidto": "CIP", // Carriage-InsurancePaidTo
        "carriagepaidto": "CPT", // CarriagePaidTo
        "deliveredatfrontier": "DAF", // DeliveredAtFrontier
        "delivereddutypaid": "DDP", // DeliveredDutyPaid
        "delivereddutyunpaid": "DDU", // DeliveredDutyUnpaid
        "deliveredex-quay": "DEQ", // DeliveredEx-Quay
        "deliveredex-ship": "DES", // DeliveredEx-Ship
        "ex-works": "EXW", // Ex-Works
        "freealongsideship": "FAS", // FreeAlongsideShip
        "free-carrier": "FCA", // Free-Carrier
        "freeonboard": "FOB", // FreeOnBoard
        "other": "ZZZ", // Other
        "cfr": "CFR", // CFR
        "dom": "DOM", // DOM
        "dup": "DUP", // DUP
        "exq": "EXQ", // EXQ
        "exs": "EXS", // EXS
        "fci": "FCI", // FCI
        "fcp": "FCP", // FCP
        "for": "FOR", // FOR
        "fot": "FOT", // FOT
        "npf": "NPF", // NPF
        "ppf": "PPF", // PPF

    }
}