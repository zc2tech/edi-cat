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

class HL_Info {
    public iHL: number;
    public sType: string; // S O I F T P
    public sParentID: string;
    constructor(iInfoHL: number, sType: string, sParentID?: string) {
        this.iHL = iInfoHL;
        this.sType = sType;
        this.sParentID = sParentID;
    }
}

type MapHL_O = {
    [key: string]: HL_Info
}
type MapHL_I = {
    [key: string]: HL_Info
}
type MapHL_F = {
    [key: string]: HL_Info
}
type MapHL_T = {
    [key: string]: HL_Info
}
type MapHL_P = {
    [key: string]: HL_Info
}


/**
 * No need to make singleton because parserUtil already assured it
 */
export class Cvt_ShipNotice_856 extends XmlConverterBase {
    protected _convertErrs: ConvertErr[];
    protected _cntReceiptItem: number = 0;
    protected _BSN05: string;
    protected _mapHL_O: MapHL_O = {};
    protected _mapHL_I: MapHL_I = {};
    protected _mapHL_F: MapHL_F = {};
    protected _mapHL_T: MapHL_T = {};
    protected _mapHL_P: MapHL_P = {};
    protected _arrREF_ZZ_exclude: string[] = ['DiscrepancyNatureIdentificationCode']

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
            this._v('@noticeDate', nHeader)
        )
        Utils.sDefaultTMZ = 'Z'; // seems noticeDate like GMT to get YYYYMMD and HHMMSS
        this._setV(BSN, 3, Utils.getYYYYMMDD(dNoticeDate));
        this._setV(BSN, 4, Utils.getHHMMSS(dNoticeDate));

        // BSN05 will be set at the end
        // this._setV(BSN, 5, '0001');

        let vShipType = this._v('@shipmentType', nHeader);
        this._setV(BSN, 6, this._mci(MAPS.mapBSN06, vShipType));
        let vFulfillmentType = this._v('@fulfillmentType', nHeader);
        this._setV(BSN, 7, this._mci(MAPS.mapBSN07, vFulfillmentType));


        let nPortions = this._Header(nHeader);
        let iTotalItemCnt = 0;

        // HL O
        let iHL = 2; // Since Shipment is always 1, we start from 2;
        let bHaveP: boolean = false;
        let bHaveT: boolean = false;
        let bMultipleContainerPerItem: boolean = false;
        // Peek the structure and set the necessary variables
        for (let nShipPortion of nPortions) {
            let nShipNoticeItems = this._es('ShipNoticeItem', nShipPortion);
            iTotalItemCnt += nShipNoticeItems.length;

            for (let nShipNoticeItem of nShipNoticeItems) {
                let nPacks = this._es('Packaging', nShipNoticeItem);
                let arrUsedContainer = []; // Item Level Array
                for (let nPack of nPacks) {
                    let vShippingContainerSerialCode = this._v('ShippingContainerSerialCode', nPack);
                    let vDescription = this._v('Description/@type', nPack);
                    let vShippingContainerSerialCodeReference = this._v('ShippingContainerSerialCodeReference', nPack);
                    if (vShippingContainerSerialCode) {
                        bHaveP = true;
                    }
                    if (vShippingContainerSerialCodeReference) {
                        bHaveT = true;
                    }
                    if (vDescription == 'Material') {
                        if ((arrUsedContainer.length > 0) && !arrUsedContainer.includes(vShippingContainerSerialCode)) {
                            // we found this is a new pack that is different to the data we stored
                            bMultipleContainerPerItem = true;
                        } else {
                            arrUsedContainer.push(vShippingContainerSerialCode);
                        }
                    }

                } // end loop nPacks
            } // end loop nShipNoticeItems
        } // end loop nPortions

        // really generate Segments after we peepked
        for (let nShipPortion of nPortions) {
            // clear existing mapping every ShipPortion
            this._mapHL_I = {};
            this._mapHL_T = {};
            this._mapHL_P = {};

            let nShipNoticeItems = this._es('ShipNoticeItem', nShipPortion);

            // HL O
            let iHL_O = this._HL_O(iHL, nShipPortion);
            iHL++;

            if (!bHaveP) {
                // HL SOI
                this._BSN05 = '0004';
                for (let nShipNoticeItem of nShipNoticeItems) {
                    // HL I
                    let iHL_I = this._HL_I(iHL, iHL_O, nShipNoticeItem);
                    if (iHL_I == iHL) {
                        // Not Using existing one, so we increase
                        iHL++;
                    }

                    // HL F
                    let nConsumpts = this._es('ComponentConsumptionDetails', nShipNoticeItem);
                    for (let nConsumpt of nConsumpts) {
                        this._HL_F(iHL, iHL_I, nConsumpt);
                        iHL_I++;
                    }

                }
            } else if (bMultipleContainerPerItem) {
                // HL SOITP or HL SOIP
                this._BSN05 = '0002';
                for (let nShipNoticeItem of nShipNoticeItems) {
                    // HL I
                    let iHL_I = this._HL_I(iHL, iHL_O, nShipNoticeItem);
                    if (iHL_I == iHL) {
                        // Not Using existing one, so we increase
                        iHL++;
                    }
                    // HL F
                    let nConsumpts = this._es('ComponentConsumptionDetails', nShipNoticeItem);
                    for (let nConsumpt of nConsumpts) {
                        this._HL_F(iHL, iHL_I, nConsumpt);
                        iHL++;
                    }

                    // Force to create new T and P, becaust T P are under I 
                    this._mapHL_T = {};
                    this._mapHL_P = {};

                    // bHaveT does not mean EVERY Item has T,
                    // So we still need to decide in a regular way
                    // HL SOI T P or HL SOIP
                    // T
                    let nPackagingsLvl01 = this._es('Packaging[PackagingLevelCode = "0001"]', nShipNoticeItem);
                    if (nPackagingsLvl01.length > 0) {
                        for (let nPack0001 of nPackagingsLvl01) {
                            let vSerialCode0001 = this._v('ShippingContainerSerialCode', nPack0001);
                            let iHL_T = this._HL_T(iHL, iHL_I, nPack0001);
                            if (iHL_T == iHL) {
                                // Not Using existing one, so we increase
                                iHL++;
                            }
                            // P
                            let nPackagingsLvl02 = this._es('Packaging[PackagingLevelCode = "0002"]', nShipNoticeItem);
                            for (let nPackP of nPackagingsLvl02) {
                                let vShippingContainerSerialCodeReference = this._v('ShippingContainerSerialCodeReference', nPackP);
                                if (vShippingContainerSerialCodeReference != vSerialCode0001) {
                                    continue;
                                }
                                let iHL_P = this._HL_P(iHL, iHL_T, nPackP);
                                if (iHL_P == iHL) {
                                    // Not Using existing one, so we increase
                                    iHL++;
                                }
                            }
                        }
                    } else {
                        // P
                        // this time PackagingLevelCode will not set as "0002"
                        let nPackagings_P = this._es('Packaging[Description/@type = "Material"]', nShipNoticeItem);
                        for (let nPackP of nPackagings_P) {
                            let iHL_P = this._HL_P(iHL, iHL_I, nPackP);
                            if (iHL_P == iHL) {
                                // Not Using existing one, so we increase
                                iHL++;
                            }
                        }
                    }
                }
            } else {
                // bMultipleContainerPerItem == false
                // HL SOTPI or HL SOPI
                this._BSN05 = '0001';
                for (let nShipNoticeItem of nShipNoticeItems) {
                    // bHaveT does not mean EVERY Item has T,
                    // So we still need to decide in a regular way
                    let iHL_P; // save for Item use;

                    let nPackagingsLvl01 = this._es('Packaging[PackagingLevelCode = "0001"]', nShipNoticeItem);
                    if (nPackagingsLvl01.length > 0) {
                        for (let nPack0001 of nPackagingsLvl01) {
                            let vSerialCode0001 = this._v('ShippingContainerSerialCode', nPack0001);
                            // HL SO T PI
                            // T
                            let iHL_T = this._HL_T(iHL, iHL_O, nPack0001);
                            if (iHL_T == iHL) {
                                // Not Using existing one, so we increase
                                iHL++;
                            }
                            // P
                            let nPackagingsLvl02 = this._es('Packaging[PackagingLevelCode = "0002"]', nShipNoticeItem);
                            for (let nPackP of nPackagingsLvl02) {
                                let vShippingContainerSerialCodeReference = this._v('ShippingContainerSerialCodeReference', nPackP);
                                if (vShippingContainerSerialCodeReference != vSerialCode0001) {
                                    continue;
                                }
                                iHL_P = this._HL_P(iHL, iHL_T, nPackP);
                                if (iHL_P == iHL) {
                                    // Not Using existing one, so we increase
                                    iHL++;
                                }
                            }
                        }
                    } else {
                        // HL SO P I
                        // P
                        // this time PackagingLevelCode will not set as "0002"
                        let nPackagings_P = this._es('Packaging[Description/@type = "Material"]', nShipNoticeItem);
                        for (let nPackP of nPackagings_P) {
                            iHL_P = this._HL_P(iHL, iHL_O, nPackP);
                            if (iHL_P == iHL) {
                                // Not Using existing one, so we increase
                                iHL++;
                            }
                        }
                    }

                    // HL I , after SOTPI or SOPI
                    let iHL_I = this._HL_I(iHL, iHL_P, nShipNoticeItem);
                    if (iHL_I == iHL) {
                        // Not Using existing one, so we increase
                        iHL++;
                    }
                    // HL F
                    let nConsumpts = this._es('ComponentConsumptionDetails', nShipNoticeItem);
                    for (let nConsumpt of nConsumpts) {
                        iHL = this._HL_F(iHL, iHL_I, nConsumpt);
                        iHL++;
                    }
                } // end loop nShipNoticeItems
            } // end if else
        } // end loop nPortions

        // now we know BSN05
        this._setV(BSN, 5, this._BSN05);

        // CTT
        let CTT = this._initSegX12('CTT', 1);
        this._setV(CTT, 1, iTotalItemCnt.toString());

        this._SE();
        this._GE();
        this._IEA();

        this._tidySegCascade();
        const output = this._segs.join(constants.ediDocument.lineBreak);
        return output;
    } // end function fromXML

    private _Header(nHeader: Element) {
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

        // HL S
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
            let vComm = this._vt(nComment);
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



        // MEA/TD1, grossWeight, weight, grossVolume
        let nDims = this._es('Packaging/Dimension', nHeader);
        // MEA
        this._MEA_DIM(nDims, ['G', 'VWT', 'WT']); // end loop for MEA



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
                // Don't use PackageTypeCodeIdentifierCode, it's not in the cXML ...
                let vPackagingCode = this._v('PackagingCode', nPackaging).trim()
                this._setV(TD1, 1, this._mci(MAPS.mapPackaginCode, vPackagingCode));
            } else {
                this._setV(TD1, 1, 'MXD');
            }
            this._setV(TD1, 2, this._v('', nExtTotal0001));
        }
        if (nExtTotal0002) {
            let TD1 = this._initSegX12('TD1', 2);
            let nPackaging = this._findPackageWithLevel('0002', nPortions);
            if (nPackaging) {
                // Don't use PackageTypeCodeIdentifierCode, it's not in the cXML ...
                let vPackagingCode = this._v('PackagingCode', nPackaging).trim();
                this._setV(TD1, 1, this._mci(MAPS.mapPackaginCode, vPackagingCode));
            } else {
                this._setV(TD1, 1, 'MXD');
            }
            this._setV(TD1, 2, this._v('', nExtTotal0002));
        }
        if (nExtTotal) {
            let TD1 = this._initSegX12('TD1', 2);
            let nPackaging = this._findPackageWithLevel('', nPortions);
            if (nPackaging) {
                // Don't use PackageTypeCodeIdentifierCode, it's not in the cXML ...
                let vPackagingCode = this._v('PackagingCode', nPackaging).trim();
                this._setV(TD1, 1, this._mci(MAPS.mapPackaginCode, vPackagingCode));
            } else {
                this._setV(TD1, 1, 'MXD');
            }
            this._setV(TD1, 2, this._v('', nExtTotal));
        }

        // TD1
        for (let nDim of nDims) {
            let vType = this._v('@type', nDim);
            let vQTY = this._v('@quantity', nDim);
            let vUOM = this._v('UnitOfMeasure', nDim);
            let vUOMMapped = this._mcs(MAPS.mapUOM, vUOM);
            let vMappedType = this._mci(MAPS.mapMEA_738, vType);


            switch (vType) {
                case 'grossWeight':
                    this._TD1('G', vQTY, vUOMMapped);
                    break;
                case 'weight':
                    this._TD1('N', vQTY, vUOMMapped);
                    break;
                case 'grossVolume':
                    this._TD1('', vQTY, vUOMMapped);
                    break;
            }
        }

        //let nShipControls = this._rns('/ShipNoticeRequest/ShipControl');
        let nShipControl = this._rn('/ShipNoticeRequest/ShipControl');
        let nCompanyName = this._rn('/ShipNoticeRequest/ShipControl/CarrierIdentifier[@domain="companyName"]');
        let vCompanyName = nCompanyName ? this._v('', nCompanyName) : '';

        // TD5 CarrierIdentifier
        //for (let nControl of nShipControls) {
        if (nShipControl) {
            let vCarrierDomain = this._v('CarrierIdentifier/@domain', nShipControl);
            let vRouteMethod = this._v('Route/@method', nShipControl);
            let vRoute = this._v('Route', nShipControl);
            if (vCarrierDomain) {
                let TD5 = this._initSegX12('TD5', 14);
                let vMappedCarrierDomain = this._mci(MAPS.mapTD502, vCarrierDomain);
                let vCarrierIdentifier = this._v('CarrierIdentifier', nShipControl);
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
                // if (!vMappedCarrierDomain && vCarrierIdentifier != 'companyName') {
                //     // TD4
                //     let TD4 = this._initSegX12('TD4', 4);
                //     this._setV(TD4, 1, 'ZZZ');
                //     this._setV(TD4, 4, vMappedCarrierDomain + '@' + vCarrierIdentifier);
                // }
                // TD5 12,13,14 serviceLevel
                this._TD5_ServiceLevel(nHeader, TD5);

            }

            // TD5 TransportInformation
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

                // TD5 12,13,14 serviceLevel
                this._TD5_ServiceLevel(nHeader, TD5);
            }
        } // end if nShipControls


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

        // TD4 'ZZZ'
        let vCarrierDomain = this._v('CarrierIdentifier/@domain', nShipControl);
        if (vCarrierDomain) {
            let vCarrierID = this._v('CarrierIdentifier', nShipControl);

            let TD4 = this._initSegX12('TD4', 4);
            this._setV(TD4, 1, 'ZZZ');
            this._setV(TD4, 4, vCarrierDomain + '@' + vCarrierID);
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
                this._setV(TD4, 4, this._v('Description', nHazard));
            }
        } // end loop nHazards


        // REF IdReference
        let nIDRefs = this._ns('IdReference', nHeader);
        nIDRefs = nIDRefs ?? [];
        for (let nIDRef of nIDRefs) {
            let vMappedDomain = this._mci(MAPS.mapREF128_PartI_IDREF, this._v('@domain', nIDRef));
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

        // REF DocumentInfo
        this._REF_DocInfo(nHeader);

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
        this._REF_Comments(nHeader);

        // REF Extrinsic
        this._REF_extrinsic(nHeader);

        // PER CompanyCode
        this._PER_ZZ('LegalEntity', 'CompanyCode', nHeader);
        // PER PurchasingOrganization
        //this._PER_ZZ('OrganizationalUnit', 'PurchasingOrganization', nHeader);
        // PER PurchasingGroup
        //this._PER_ZZ('OrganizationalUnit', 'PurchasingGroup', nHeader);

        // DTM 111,011,017,002,118
        this._DTM_X12(nHeader, '@noticeDate', '111');
        this._DTM_X12(nHeader, '@shipmentDate', '011');
        this._DTM_X12(nHeader, '@deliveryDate', '017');
        this._DTM_X12(nHeader, '@requestedDeliveryDate', '002');
        this._DTM_X12(nHeader, 'Extrinsic[@name="PickUpDate"]', '118');

        // FOB
        let nToD = this._e('TermsOfDelivery', nHeader);
        if (nToD) {
            let vShippingPaymentMethod = this._v('ShippingPaymentMethod/@value', nToD);
            let vShippingPaymentMethodMapped = this._mci(MAPS.mapFOB01_146, vShippingPaymentMethod);
            let vTODVale = this._v('TermsOfDeliveryCode/@value', nToD);
            let vTOD = this._v('TermsOfDeliveryCode', nToD);
            let FOB = this._initSegX12('FOB', 7);
            this._setV(FOB, 1, vShippingPaymentMethodMapped);
            if (vTODVale == 'Other') {
                // ZZ
                this._setV(FOB, 2, 'ZZ');
                this._setV(FOB, 3, vTOD);
            } else {
                // ZN
                this._setV(FOB, 2, 'ZN');
                this._setV(FOB, 3, vTODVale);
            }
            this._setV(FOB, 4, 'ZZ');
            let vTransportTerms = this._v('TransportTerms', nToD);
            this._setV(FOB, 5, this._mci(MAPS.mapFOB_335, vTransportTerms));
            // Maybe we don't need to set 6 and 7, let FOB01 take over the burden
            if (["Account",
                "CashOnDeliveryServiceChargePaidByConsignee",
                "CashOnDeliveryServiceChargePaidByConsignor",
                "InformationCopy-NoPaymentDue",
                "InsuranceCostsPaidByConsignee",
                "InsuranceCostsPaidByConsignor",
                "NotSpecified",
                "PayableElsewhere"
            ].includes(vShippingPaymentMethod)) {
                // overwrite FOB01
                this._setV(FOB, 1, 'DF');
                this._setV(FOB, 6, 'ZZ');
                this._setV(FOB, 7, vShippingPaymentMethod);
            }

            // modify come from REF*0L*FOB05
            if (nTransOther) {
                // this._REF('0L', 'FOB05', this._v('', nTransOther));
                this._setV(FOB, 4, 'ZZ');
                this._setV(FOB, 5, 'ZZZ');
            }
        }

        // N1 Contact
        let nContacts = this._es('Contact', nHeader);
        for (let nContact of nContacts) {
            this._GroupN1(nContact);
        }

        // N1 DA TermsOfDelivery
        let nAddress = this._e('TermsOfDelivery/Address', nHeader);
        if (nAddress) {
            this._GroupN1(nAddress, 'DA');
        }
        return nPortions;
    }

    private _MEA_DIM(nDims: Element[], arrExclued: string[]) {
        // Map to cXML [Only if NOT"G" or "VWT" or "WT"][Lookup required, sheet MEA]
        for (let nDim of nDims) {
            let vType = this._v('@type', nDim);
            let vQTY = this._v('@quantity', nDim);
            let vUOM = this._v('UnitOfMeasure', nDim);
            let vUOMMapped = this._mcs(MAPS.mapUOM, vUOM);
            let vMappedType = this._mci(MAPS.mapMEA_738, vType);

            if (!vMappedType || arrExclued.includes(vMappedType)) {
                continue;
            }
            let MEA = this._initSegX12('MEA', 4);
            this._setV(MEA, 1, 'PD');
            this._setV(MEA, 2, vMappedType);
            this._setV(MEA, 3, vQTY);
            this._setV(MEA, 401, vUOMMapped);
        }
    }

    private _HL_F(iHL: number, iHL_I: number, nComponentConsumptionDetails: Element) {
        // HL
        let HL_F = this._initSegX12('HL', 4);
        let sHL_ID = iHL.toString();

        let infoO = new HL_Info(iHL, 'F', iHL_I.toString());
        this._mapHL_F[sHL_ID] = infoO;
        this._setV(HL_F, 1, sHL_ID);
        this._setV(HL_F, 2, iHL_I.toString());
        this._setV(HL_F, 3, 'F');
        this._setV(HL_F, 4, '0');
        // LIN
        let arrItem = [];
        this._LIN_help_ConsumptionDetail(nComponentConsumptionDetails, arrItem); // ITEM ID 234
        let LIN = this._initSegX12('LIN', 1 + arrItem.length * 2);
        this._setV(LIN, 1, this._v('@lineNumber', nComponentConsumptionDetails));
        let iEle = 2;
        for (let arr of arrItem) {
            this._setV(LIN, iEle, arr[0]);
            this._setV(LIN, iEle + 1, arr[1]);
            iEle += 2;
        }
        // SN1
        let vQuantity = this._v('@quantity', nComponentConsumptionDetails);
        let vUOM = this._v('UnitOfMeasure', nComponentConsumptionDetails);
        let vUOMMapped = this._mcs(MAPS.mapUOM, vUOM);
        this._REF_KV_X12T('', vQuantity, vUOMMapped);
        // REF ZZ
        let nExts = this._es('Extrinsic', nComponentConsumptionDetails);
        for (let nExt of nExts) {
            let vName = this._v('@name', nExt);
            let vValue = this._v('', nExt);
            if (this._arrREF_ZZ_exclude.includes(vName)) {
                continue;
            }
            this._REF_KV_X12T('ZZ', vName, vValue);
        }
        // MAN
        this._MAN_tag_serial_number(nComponentConsumptionDetails);
        return iHL;
    } // end function _HL_F

    private _HL_I(iHL: number, iHL_Parent: number, nShipNoticeItem: Element) {
        let vLineNumber = this._v('@lineNumber', nShipNoticeItem);
        let sKey = iHL_Parent + '_' + vLineNumber;
        let info_found = this._mapHL_I[sKey];
        if (info_found) {
            return info_found.iHL;
        }
        let HL_I = this._initSegX12('HL', 4);
        let sHL_ID = iHL.toString();

        let infoI = new HL_Info(iHL, 'I', iHL_Parent.toString());
        this._mapHL_I[sKey] = infoI;
        this._setV(HL_I, 1, sHL_ID);

        // HL02 
        // "0004" HL SOIF - Each HL ITEM segment refers to the related HL ORDER segment.
        // "0002" HL SOIFTP - Each HL ITEM segment refers to the related HL ORDER segment.
        // "0001" HL SOTPIF - Each HL ITEM segment refers either to the related HL PACK segment or HL ORDER segment.
        this._setV(HL_I, 2, iHL_Parent.toString());
        this._setV(HL_I, 3, 'I');
        // HL04 
        // "0004" HL SOIF - If used, it should be "1", if  HL F follows. Otherwise "0". 
        // "0002" HL SOIFTP -  If used, it shoud be "1". (At least P should follow.)
        // "0001" HL SOTPIF - If used, it shoud be "1", if  HL F follows. Otherwise "0".     
        let nConsumpts = this._es('ComponentConsumptionDetails', nShipNoticeItem); // HL F
        let v04;
        switch (this._BSN05) {
            case '0004':
                v04 = nConsumpts.length > 0 ? '1' : '0'
                break;
            case '0002':
                v04 = '1'
                break;
            case '0001':
                v04 = nConsumpts.length > 0 ? '1' : '0'
                break;
            default:
                break;
        }
        this._setV(HL_I, 4, v04);

        // LIN
        let arrItem = [];
        this._LIN_help(nShipNoticeItem, arrItem); // ITEM ID 234
        let LIN = this._initSegX12('LIN', 1 + arrItem.length * 2);
        this._setV(LIN, 1, this._v('@shipNoticeLineNumber', nShipNoticeItem));
        let iEle = 2;
        for (let arr of arrItem) {
            this._setV(LIN, iEle, arr[0]);
            this._setV(LIN, iEle + 1, arr[1]);
            iEle += 2;
        }

        // SN1
        let vQuantity = this._v('@quantity', nShipNoticeItem);
        if (vQuantity) {
            let SN1 = this._initSegX12('SN1', 6);
            this._setV(SN1, 1, this._v('@lineNumber', nShipNoticeItem));
            this._setV(SN1, 2, vQuantity);
            this._setV(SN1, 3, this._mcs(MAPS.mapUOM, this._v('UnitOfMeasure', nShipNoticeItem)));
            let vOrderedQuantity = this._v('OrderedQuantity/@quantity', nShipNoticeItem);
            if (vOrderedQuantity) {
                this._setV(SN1, 5, vOrderedQuantity);
                this._setV(SN1, 6, this._mcs(MAPS.mapUOM, this._v('OrderedQuantity/UnitOfMeasure', nShipNoticeItem)));
            }
        }
        // SLN
        let vUnitPrice = this._v('ShipNoticeItemDetail/UnitPrice/Money', nShipNoticeItem)
        if (vUnitPrice) {
            let SLN = this._initSegX12('SLN', 6);
            this._setV(SLN, 1, vLineNumber);
            this._setV(SLN, 3, 'O');
            this._setV(SLN, 6, vUnitPrice);
            // 'CUR'
        }

        // PO4 
        let nPackagingItem = this._e('Packaging', nShipNoticeItem);
        if (nPackagingItem) {
            let PO4 = this._initSegX12('PO4', 13);
            // Don't use PackageTypeCodeIdentifierCode, it's not in the cXML ...
            let vPackagingCode = this._v('PackagingCode', nPackagingItem).trim();
            this._setV(PO4, 4, this._mci(MAPS.mapPackaginCode, vPackagingCode));
            this._Package_Dimension(nPackagingItem, PO4);
            if (this._BSN05 == '0004') {
                // we only set PO4 when it's '0004'
                let vDispatchQuantity = this._v('DispatchQuantity/@quantity', nPackagingItem);
                if (vDispatchQuantity) {
                    if (vDispatchQuantity) {
                        this._setV(PO4, 1, '1');
                        this._setV(PO4, 2, vDispatchQuantity);
                    }
                    this._setV(PO4, 3, this._mcs(MAPS.mapUOM, this._v('DispatchQuantity/UnitOfMeasure', nPackagingItem)));
                }
            }
        }

        // PID
        let nShipNoticeItemDetail = this._e('ShipNoticeItemDetail', nShipNoticeItem);
        let vShortName = this._vt2('Description/ShortName', nShipNoticeItemDetail);
        let vDesc = this._vt2('Description', nShipNoticeItemDetail).trim();
        let vLang = this._v('Description/@xml:lang', nShipNoticeItemDetail);
        vLang = vLang ? vLang : 'en';
        if (vDesc) {
            let PID = this._initSegX12('PID', 9);
            // With PID02="GEN", map to /Description/ShortName.
            // Else without PID02, map to /Description.]
            this._setV(PID, 1, 'F');
            this._setV(PID, 2, '');
            this._setV(PID, 5, vDesc);
            this._setV(PID, 9, vLang);
        }
        if (vShortName) {
            let PID = this._initSegX12('PID', 5);
            // With PID02="GEN", map to /Description/ShortName.
            // Else without PID02, map to /Description.]
            this._setV(PID, 1, 'F');
            this._setV(PID, 2, 'GEN');
            this._setV(PID, 5, vShortName);
        }

        // MEA
        let nDimMEAs = this._es('Dimension', nShipNoticeItemDetail);
        for (let nDim of nDimMEAs) {
            let MEA = this._initSegX12('MEA', 4);
            let vType = this._v('@type', nDim);
            this._setV(MEA, 1, 'PD');
            this._setV(MEA, 2, this._mci(MAPS.mapMEA_738, vType));
            this._setV(MEA, 3, this._v('@quantity', nDim));
            this._setV(MEA, 401, this._mcs(MAPS.mapUOM, this._v('UnitOfMeasure', nDim)));
        }

        // TD4 Each /Hazard creates a new TD4 segment
        let nHazards = this._es('Hazard', nShipNoticeItem);
        for (let nHazard of nHazards) {
            let vDomain = this._v('Classification/@domain', nHazard);
            if (vDomain) {
                let TD4 = this._initSegX12('TD4', 4);
                this._setV(TD4, 2, this._mci(MAPS.mapTD4, vDomain));
                this._setV(TD4, 3, this._v('Classification', nHazard));
                this._setV(TD4, 4, this._v('Description', nHazard))
            }
        } // end loop nHazards

        // REF FL
        let vItemType = this._v('@itemType', nShipNoticeItem);
        if (vItemType) {
            let REF = this._initSegX12('REF', 4);
            this._setV(REF, 1, 'FL');
            this._setV(REF, 2, vItemType);
            if (vItemType == 'composite') {
                this._setV(REF, 3, this._v('@compositeItemType', nShipNoticeItem))
            }
            let vParentInvoiceLineNumber = this._v('parentInvoiceLineNumber', nShipNoticeItem);
            if (vParentInvoiceLineNumber && (vItemType == 'item')) {
                this._setV(REF, 401, 'LI');
                this._setV(REF, 402, vParentInvoiceLineNumber);
            }
        } // end if vItemType

        // REF PD
        let vPromotionDealID = this._v('ShipNoticeItemIndustry/ShipNoticeItemRetail/PromotionDealID', nShipNoticeItem);
        this._REF_KV_X12T('PD', '', vPromotionDealID);

        // REF DocInfo
        this._REF_DocInfo(nShipNoticeItem);
        // REF BT productionDate
        let vProductionDate = this._v('Batch/@productionDate', nShipNoticeItem);
        this._REF_Date_X12('BT', 'productionDate', vProductionDate);
        // REF BT expirationDate
        let vExpirationDate = this._v('Batch/@expirationDate', nShipNoticeItem);
        this._REF_Date_X12('BT', 'expirationDate', vExpirationDate);
        // REF BT inspectionDate
        let vInspectionDate = this._v('Batch/@inspectionDate', nShipNoticeItem);
        this._REF_Date_X12('BT', 'inspectionDate', vInspectionDate);
        // REF BT shelfLif
        let vShelfLife = this._v('Batch/@shelfLife', nShipNoticeItem);
        this._REF_KV_X12T('BT', 'shelfLif', vShelfLife);
        // REF BT originCountryCode
        let vOriginCountryCode = this._v('Batch/@originCountryCode', nShipNoticeItem);
        this._REF_KV_X12T('BT', 'originCountryCode', vOriginCountryCode);
        // REF Comments
        this._REF_Comments(nShipNoticeItem);
        // REF all other extrinsc
        this._REF_extrinsic(nShipNoticeItem);
        // MAN
        this._MAN_tag_serial_number(nShipNoticeItem);
        // DTM 036
        this._DTM_X12(nShipNoticeItem, 'ShipNoticeItemIndustry/ShipNoticeItemRetail/ExpiryDate/@date', '036');
        // DTM 511
        this._DTM_X12(nShipNoticeItem, 'ShipNoticeItemIndustry/ShipNoticeItemRetail/BestBeforeDate/@date', '511');
        // CUR
        let vCurr = this._v('ShipNoticeItemDetail/UnitPrice/Money/@currency', nShipNoticeItem);
        if (vCurr) {
            let CUR = this._initSegX12('CUR', 2);
            this._setV(CUR, 1, 'BY');
            this._setV(CUR, 2, vCurr);
        }
        return iHL;
    } // end function _HL_I

    private _MAN_tag_serial_number(nShipNoticeItem: Element) {
        let nAssetInfos = this._es('AssetInfo', nShipNoticeItem);

        for (let nAssetInfo of nAssetInfos) {
            let vTagNumber = this._v('@tagNumber  ', nAssetInfo);
            let vSerialNumber = this._v('@serialNumber  ', nAssetInfo);
            let arrMan = [];
            if (vSerialNumber) {
                arrMan.push(['SN', vSerialNumber]);
            }
            if (vTagNumber) {
                arrMan.push(['AT', vTagNumber]);
            }
            if (arrMan.length > 0) {
                let MAN = this._initSegX12('MAN', arrMan.length * 3);
                let iMan = 1;
                for (let pairMan of arrMan) {
                    this._setV(MAN, iMan, 'L');
                    this._setV(MAN, iMan + 1, pairMan[0]);
                    this._setV(MAN, iMan + 2, pairMan[1]);
                    iMan += 3;
                }
            }
        }
    }

    private _Package_Dimension(nParent: Element, PO4: EdiSegment) {
        let nDims = this._es('Dimension', nParent);
        for (let nDim of nDims) {
            let vType = this._v('@type', nDim);
            let vUOM = this._v('UnitOfMeasure', nDim);
            let vUOMMapped = this._mcs(MAPS.mapUOM, vUOM);
            switch (vType) {
                case 'weight':
                    this._setV(PO4, 6, this._v('@quantity', nDim));
                    this._setV(PO4, 7, vUOMMapped);
                    break;
                case 'volume':
                    this._setV(PO4, 8, this._v('@quantity', nDim));
                    this._setV(PO4, 9, vUOMMapped);
                    break;
                case 'length':
                    this._setV(PO4, 10, this._v('@quantity', nDim));
                    this._setV(PO4, 13, vUOMMapped);
                    break;
                case 'width':
                    this._setV(PO4, 11, this._v('@quantity', nDim));
                    break;
                case 'height':
                    this._setV(PO4, 12, this._v('@quantity', nDim));
                    break;
                default:
                    break;
            }
        }
    }

    /**
     * For nShipNoticeItem
     * @param nShipNoticeItem 
     * @param arrItem 
     */
    private _LIN_help(nShipNoticeItem: Element, arrItem: any[]) {
        let iMaxLenInX12 = 48;
        // PL always the first one
        let vLineNumber = this._v('@lineNumber', nShipNoticeItem);
        if (vLineNumber) {
            arrItem.push(['PL', vLineNumber]);
        }

        let vSupplierBatchID = this._v('Batch/SupplierBatchID', nShipNoticeItem);
        if (vSupplierBatchID) {
            arrItem.push(['B8', vSupplierBatchID]);
        }

        let vBuyerPartID = this._v('ItemID/BuyerPartID', nShipNoticeItem);
        if (vBuyerPartID) {
            arrItem.push(['BP', vBuyerPartID]);
        }
        let vUNSPSC = this._v('ShipNoticeItemDetail/Classification [@domain="UNSPSC"]/@code', nShipNoticeItem);
        if (vUNSPSC) {
            arrItem.push(['C3', vUNSPSC]);
        }

        let vEANID = this._v('ShipNoticeItemDetail/ItemDetailIndustry/ItemDetailRetail/EANID', nShipNoticeItem);
        if (vEANID) {
            arrItem.push(['EN', vEANID]);
        }
        let vHD = this._v('Extrinsic[@name="HarmonizedSystemID"]', nShipNoticeItem);
        if (vHD) {
            arrItem.push(['HD', vHD]);
        }
        let vBuyerBatchID = this._v('Batch/BuyerBatchID', nShipNoticeItem);
        if (vBuyerBatchID) {
            arrItem.push(['LT', vBuyerBatchID.substring(0, iMaxLenInX12)]);
        }
        let vManufacturerPartID = this._v('ShipNoticeItemDetail/ManufacturerPartID', nShipNoticeItem);
        if (vManufacturerPartID) {
            arrItem.push(['MG', vManufacturerPartID]);
        }
        let vManufacturerName = this._v('ShipNoticeItemDetail/ManufacturerName', nShipNoticeItem);
        if (vManufacturerName) {
            arrItem.push(['MF', vManufacturerName.substring(0, iMaxLenInX12)]);
        }

        // AssetInfo has 'MAN' segment, don't need this 'LIN' segment
        // let vSerialNumber = this._v('AssetInfo/@serialNumber', nShipNoticeItem);
        // if (vSerialNumber) {
        //     arrItem.push(['SN', vSerialNumber]);
        // }

        // @UPCID or @UPCConsumerPackageCode ??? in Extrinsic or ItemID element ?
        let vUPCID = this._v('ShipNoticeItemDetail/Extrinsic [@name="customersBarCodeNumber"]', nShipNoticeItem);
        if (vUPCID) {
            arrItem.push(['UP', vUPCID]);
        }


        let vSupplierPartID = this._v('ItemID/SupplierPartID', nShipNoticeItem);
        if (vSupplierPartID) {
            arrItem.push(['VP', vSupplierPartID]);
        }
        let vSupplierPartAuxiliaryID = this._v('ItemID/SupplierPartAuxiliaryID', nShipNoticeItem);
        if (vSupplierPartAuxiliaryID) {
            arrItem.push(['VS', vSupplierPartAuxiliaryID]);
        }

        // I don't think I need to do for below element again
        // /ShipNoticeRequest/ShipNoticePortion/ShipNoticeItem/ComponentConsumptionDetails
    }

    /**
     * For ComponentConsumptionDetails
     * @param nComponentConsumptionDetails
     * @param arrItem 
     */
    private _LIN_help_ConsumptionDetail(nComponentConsumptionDetails: Element, arrItem: any[]) {
        let iMaxLenInX12 = 48;

        let vSupplierBatchID = this._v('SupplierBatchID', nComponentConsumptionDetails);
        if (vSupplierBatchID) {
            arrItem.push(['B8', vSupplierBatchID]);
        }

        let vBuyerPartID = this._v('Product/BuyerPartID', nComponentConsumptionDetails);
        if (vBuyerPartID) {
            arrItem.push(['BP', vBuyerPartID]);
        }

        let vBuyerBatchID = this._v('BuyerBatchID', nComponentConsumptionDetails);
        if (vBuyerBatchID) {
            arrItem.push(['LT', vBuyerBatchID.substring(0, iMaxLenInX12)]);
        }
        let vSN = this._v('AssetInfo/@serialNumber', nComponentConsumptionDetails);
        if (vSN) {
            arrItem.push(['SN', vSN]);
        }

        let vSupplierPartID = this._v('Product/SupplierPartID', nComponentConsumptionDetails);
        if (vSupplierPartID) {
            arrItem.push(['VP', vSupplierPartID]);
        }
        let vSupplierPartAuxiliaryID = this._v('Product/SupplierPartAuxiliaryID', nComponentConsumptionDetails);
        if (vSupplierPartAuxiliaryID) {
            arrItem.push(['VS', vSupplierPartAuxiliaryID]);
        }
    }
    /**
     * BSN05 == '0001' or '0002'
     * @param iHL 
     * @param nParent can be nShipPortion or nShipNoticeItem
     */
    private _HL_T(iHL: number, iHL_Parent: number, nPackaging: Element): number {
        let vShippingContainerSerialCode = this._v('ShippingContainerSerialCode', nPackaging);
        let infoT_found = this._mapHL_T[vShippingContainerSerialCode];
        if (infoT_found) {
            // we do nothing as it's already exist
            return infoT_found.iHL;
        }
        let HL_T = this._initSegX12('HL', 4);
        let sHL_ID = iHL.toString();

        let infoT = new HL_Info(iHL, 'T', iHL_Parent.toString());
        this._mapHL_T[vShippingContainerSerialCode] = infoT;
        this._setV(HL_T, 1, sHL_ID);
        this._setV(HL_T, 2, iHL_Parent.toString());
        this._setV(HL_T, 3, 'T');
        this._setV(HL_T, 4, '1'); // Should be "1", when HL Item is present. Otherwise "0".
        // PO4
        let vDispatchQuantity = this._v('DispatchQuantity/@quantity', nPackaging);
        // even vDispatchQuantity is undefined, we still need to write PO4
        let PO4 = this._initSegX12('PO4', 13);
        if (vDispatchQuantity) {
            this._setV(PO4, 1, '1');
            this._setV(PO4, 2, vDispatchQuantity);
        }
        this._setV(PO4, 3, this._mcs(MAPS.mapUOM, this._v('DispatchQuantity/UnitOfMeasure', nPackaging)));
        // Don't use PackageTypeCodeIdentifierCode, it's not in the cXML ...
        let vPackagingCode = this._v('PackagingCode', nPackaging).trim();
        this._setV(PO4, 4, this._mci(MAPS.mapPackaginCode, vPackagingCode));
        this._Package_Dimension(nPackaging, PO4);

        // MEA/TD1, grossWeight, weight, grossVolume
        let nDims = this._es('Dimension', nPackaging);
        // MEA
        this._MEA_DIM(nDims, ['HT', 'LN', 'VOL', 'WD', 'WT']);
        // REF WS
        let vStoreCode = this._v('StoreCode', nPackaging);
        this._REF_KV_X12T('WS', '', vStoreCode);
        // MAN GM        
        this._MAN_KV_X12D('GM', vShippingContainerSerialCode);
        // MAN CA
        let vPackageTrackingID = this._v('PackageID/PackageTrackingID', nPackaging);
        this._MAN_KV_X12D('CA', vPackageTrackingID);
        // MAN ZZ GIAI
        let vGlobalIndividualAssetID = this._v('PackageID/GlobalIndividualAssetID', nPackaging);
        this._MAN_KV_X12T('ZZ', 'GIAI', vGlobalIndividualAssetID);

        return iHL;
    }
    /**
     * BSN05 == '0001' or '0002'
     * @param iHL 
     * @param nParent can be nShipPortion or nShipNoticeItem or HL_T
     */
    private _HL_P(iHL: number, iHL_Parent: number, nPackaging: Element): number {
        let vShippingContainerSerialCode = this._v('ShippingContainerSerialCode', nPackaging);
        let info_found = this._mapHL_P[vShippingContainerSerialCode];
        if (info_found) {
            // we do nothing as it's already exist
            return info_found.iHL;
        }
        let HL_P = this._initSegX12('HL', 4);
        let sHL_ID = iHL.toString();

        let infoP = new HL_Info(iHL, 'P', iHL_Parent.toString());
        this._mapHL_P[vShippingContainerSerialCode] = infoP;
        this._setV(HL_P, 1, sHL_ID);
        this._setV(HL_P, 2, iHL_Parent.toString());
        this._setV(HL_P, 3, 'P');
        if (this._BSN05 == '0002') {
            // [BSN_1005]: "0002" HL SOIFTP - If used, it shoud be "0". 
            this._setV(HL_P, 4, '0');
        } else {
            // "0001" HL SOTPIF - If used, it shoud be "1" as HL ITEM is expected.
            this._setV(HL_P, 4, '1');
        }
        // PO4
        let vDispatchQuantity = this._v('DispatchQuantity/@quantity', nPackaging);
        let PO4 = this._initSegX12('PO4', 13);
        if (vDispatchQuantity) {
            this._setV(PO4, 1, '1');
            this._setV(PO4, 2, vDispatchQuantity);
        }
        this._setV(PO4, 3, this._mcs(MAPS.mapUOM, this._v('DispatchQuantity/UnitOfMeasure', nPackaging)));
        // Don't use PackageTypeCodeIdentifierCode, it's not in the cXML ...
        let vPackagingCode = this._v('PackagingCode', nPackaging).trim();
        this._setV(PO4, 4, this._mci(MAPS.mapPackaginCode, vPackagingCode));
        this._Package_Dimension(nPackaging, PO4);
        // MEA/TD1, grossWeight, weight, grossVolume
        let nDims = this._es('Dimension', nPackaging);
        // MEA
        this._MEA_DIM(nDims, ['HT', 'LN', 'VOL', 'WD', 'WT']);
        // REF WS
        let vStoreCode = this._v('StoreCode', nPackaging);
        this._REF_KV_X12T('WS', '', vStoreCode);
        // MAN GM
        this._MAN_KV_X12D('GM', vShippingContainerSerialCode);
        // MAN CA
        let vPackageTrackingID = this._v('PackageID/PackageTrackingID', nPackaging);
        this._MAN_KV_X12D('CA', vPackageTrackingID);
        // MAN ZZ GIAI
        let vGlobalIndividualAssetID = this._v('PackageID/GlobalIndividualAssetID', nPackaging);
        this._MAN_KV_X12T('ZZ', 'GIAI', vGlobalIndividualAssetID);

        return iHL;
    }

    private _HL_O(iHL: number, nShipPortion: Element) {
        let HL_O = this._initSegX12('HL', 4);
        let sHL_ID = iHL.toString();

        let infoO = new HL_Info(iHL, 'O', '1');
        this._mapHL_O[sHL_ID] = infoO;
        this._setV(HL_O, 1, sHL_ID);
        this._setV(HL_O, 2, '1');
        this._setV(HL_O, 3, 'O');
        this._setV(HL_O, 4, '1'); // Should be "1", when HL Item is present. Otherwise "0".

        // PRF
        let sOrderID = this._v('OrderReference/@orderID', nShipPortion);
        let sOrderDate = this._v('OrderReference/@orderDate', nShipPortion);
        let dOrderDate = Utils.parseToDateSTD2(sOrderDate);
        let sAgreementID = this._v('MasterAgreementIDInfo/@agreementID', nShipPortion);
        if (sAgreementID) {
            let PRF = this._initSegX12('PRF', 6);
            this._setV(PRF, 1, sOrderID);
            this._setV(PRF, 4, Utils.getYYYYMMDD(dOrderDate));
            this._setV(PRF, 6, sAgreementID);
        }

        // PID 
        // "Attention Note: 
        // Map only to PID, if NONE of the scenarios below exists. A combination of multiple scenarios is also possible.
        // 1[@type]: The /Comments/@type is available and/or
        // 2[Ongoing Comments]: The content of /Comments exceeds a length of 80 chars and/or
        // 3[Attachments]: /Comments and/or @type exists 
        // AND /Comments/Attachment/URL is available.
        // Else map to new REF*L1 segment.
        // -> Please refer to sheet ""Sample cXML completeContent"" for all test scenarios."                
        let nComments = this._e('Comments', nShipPortion);
        if (nComments) {
            let vComments = this._vt(nComments);
            let vType = this._v('@type', nComments);
            let nAttach = this._e('Attachment', nComments);
            if (vComments.length > 80 || vType || nAttach) {
                // do nothing
            } else {
                let PID = this._initSegX12('PID', 9);
                this._setV(PID, 1, 'F');
                this._setV(PID, 2, 'GEN');
                this._setV(PID, 5, vComments);
                let vLang = this._v('@xml:lang', nComments);
                vLang = vLang ? vLang : 'en';
                // this._setV(PID, 7, vType);
                this._setV(PID, 9, vLang);
            }
        }

        // REF PO REF03 overwrites PRF01
        if (sOrderID) {
            let REF = this._initSegX12('REF', 2);
            this._setV(REF, 1, 'PO');
            this._setV(REF, 2, sOrderID);
        }
        // REF CT or AH
        if (sAgreementID) {
            let vAgreementType = this._v('MasterAgreementIDInfo/@agreementType', nShipPortion);
            let REF = this._initSegX12('REF', 3);
            this._setV(REF, 1, 'CT');
            if (vAgreementType == 'scheduling_agreement') {
                this._setV(REF, 2, '1');
            }
            this._setV(REF, 3, sAgreementID);
        }
        // REF 0L DocumentInfo
        this._REF_DocInfo(nShipPortion);

        // REF all other extrinsic
        this._REF_extrinsic(nShipPortion);

        // REF Comments
        this._REF_Comments(nShipPortion);

        // // REF ZZ
        // this._REF_extrinsic(nShipPortion);

        // DTM 004
        this._DTM_X12A(sOrderDate, '004');
        // DTM LEA
        let sAgrrementDate = this._v('MasterAgreementIDInfo/@agreementDate', nShipPortion);
        this._DTM_X12A(sAgrrementDate, 'LEA');

        let nContacts = this._es('Contact', nShipPortion);
        for (let nContact of nContacts) {
            this._GroupN1(nContact);
            // CUR
            // I don't want to specify in ShipPortion Level, let's try ShipNoticeItem level
        }
        return iHL;
    }

    private _REF_Comments(nCommentsParent: Element) {
        let nCMTs = this._es('Comments', nCommentsParent);
        let iREF02: number = 1;
        for (let nCMT of nCMTs) {
            // [Match]: Must be a unique identifier:
            let sCommentID = 'ID_' + iREF02;
            let vCMT = this._vt(nCMT);
            let vType = this._v('@type', nCMT);
            let vLang = this._v('@xml:lang', nCMT);
            vLang = vLang ? vLang : 'en';
            let nAttachURLs = this._es('Attachment/URL', nCMT);
            let bFirstLine = true;
            while (vCMT) {
                let REF = this._initSegX12('REF', 4);
                this._setV(REF, 1, 'L1');
                this._setV(REF, 2, sCommentID);
                this._setV(REF, 3, vCMT.substring(0, 80));
                if (bFirstLine) {
                    bFirstLine = false;
                    this._setV(REF, 401, 'L1');
                    this._setV(REF, 402, vLang);
                    this._REF_Split_Comments('0L', vType, 403, 0, 30, REF);
                    this._REF_Split_Comments('0L', vType, 405, 30, 60, REF);
                } else {
                    this._REF_Split_Comments('0L', vType, 401, 0, 30, REF);
                    this._REF_Split_Comments('0L', vType, 403, 30, 60, REF);
                    this._REF_Split_Comments('0L', vType, 405, 60, 90, REF);
                }
                vCMT = vCMT.substring(80);
            } // end loop vCMT
            let bURLFirstLine = true;
            for (let nURL of nAttachURLs) {
                let vUrlName = this._v('@name', nURL);
                let vUrl = this._v('', nURL);
                while (vUrl) {
                    let REF_URL = this._initSegX12('REF', 4);
                    this._setV(REF_URL, 1, 'URL');
                    this._setV(REF_URL, 2, sCommentID);
                    this._setV(REF_URL, 3, vUrl.substring(0, 80));
                    if(vUrl.length <= 80) {
                        break;
                    }
                    if (bURLFirstLine) {
                        bURLFirstLine = false;
                        this._setV(REF_URL, 401, '0L');
                        this._setV(REF_URL, 402, vUrlName);
                        this._REF_Split_Comments('URL', vUrl, 403, 80, 110, REF_URL);
                        this._REF_Split_Comments('URL', vUrl, 405, 110, 140, REF_URL);
                        vUrl = vUrl.substring(140);
                    } else {
                        this._setV(REF_URL, 401, 'URL');
                        this._REF_Split_Comments('URL', vUrl, 401, 80, 110, REF_URL);
                        this._REF_Split_Comments('URL', vUrl, 403, 110, 140, REF_URL);
                        this._REF_Split_Comments('URL', vUrl, 405, 140, 170, REF_URL);
                        vUrl = vUrl.substring(170);
                    }

                } // end loop vURl

            } // end loop nAttachURLs
            iREF02++;
        } // end loop nCMTs
    }

    /**
     * @param sQualifier '0L' or 'URL'
     * @param theStr 
     * @param iStartComp for example: 403
     * @param REF 
     */
    private _REF_Split_Comments(sQualifier: string, theStr: string, iStartComp: number, iSubStart: number, iSubEnd: number, REF: EdiSegment) {
        if (theStr.length > iSubStart) {
            this._setV(REF, iStartComp, sQualifier);
            this._setV(REF, iStartComp + 1, theStr.substring(iSubStart, iSubEnd));
        }
    }

    private _REF_DocInfo(nParent: Element) {
        let nDocInfos = this._es('ReferenceDocumentInfo/DocumentInfo', nParent);
        for (let nInfo of nDocInfos) {
            let REF = this._initSegX12('REF', 4);
            this._setV(REF, 1, '0L');
            this._setV(REF, 2, this._v('@documentID', nInfo));
            this._setV(REF, 3, this._v('@documentType', nInfo));
            this._setV(REF, 401, '0L');
            let vDate = this._v('@documentDate', nInfo);
            this._setV(REF, 402, Utils.dateStr304TZ(vDate, ''));
        }
    }

    private _REF_extrinsic(nParent: Element) {
        let nExtrinsics = this._es('Extrinsic', nParent);
        nExtrinsics = nExtrinsics ?? [];
        for (let nExt of nExtrinsics) {
            let vName = this._v('@name', nExt);
            let vVal = this._v('', nExt);
            if (this._arrREF_ZZ_exclude.includes(vName)) {
                continue;
            }
            let REF = this._initSegX12('REF', 3);
            if (this._mei(MAPS.mapREF128_PartI_Ext, vName)) {
                this._setV(REF, 1, this._mci(MAPS.mapREF128_PartI_Ext, vName));
                this._setV(REF, 3, vVal);
            } else if (this._mei(MAPS.mapREF128_PartII, vName)) {
                this._setV(REF, 1, this._mci(MAPS.mapREF128_PartII, vName));
                this._setV(REF, 2, vVal.substring(0, 30));
                if (vVal.length > 30) {
                    this._setV(REF, 3, vVal.substring(30));
                }
            } else {
                this._setV(REF, 1, 'ZZ');
                this._setV(REF, 2, vName);
                this._setV(REF, 3, vVal);
            }
        }
    }

    /**
     * For Group N1
     * @param nHeader 
     */
    private _GroupN1(nContact: Element, sN1_1?: string) {
        // N1
        let sRole = this._v('@role', nContact);
        let N1 = this._initSegX12('N1', 4);
        if (!sN1_1) {
            this._setV(N1, 1, this._mci(MAPS.mapN1_98, sRole));
        } else {
            this._setV(N1, 1, sN1_1);
        }
        this._setV(N1, 2, this._v('Name', nContact).trim());

        let sCodeQualifer = this._v('@addressIDDomain', nContact);
        let sAddressID = this._v('@addressID', nContact);
        if (sAddressID) {
            this._setV(N1, 3, this._mci(MAPS.mapN1_66, sCodeQualifer, '')); // addressIDDomain
            this._setV(N1, 4, sAddressID);
        }

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

        // REF Idreference
        let sDomain = this._v('IdReference/@domain', nContact);
        if (sDomain) {
            if (this._mei(MAPS.mapN1_REF128, sDomain)) {
                let REF = this._initSegX12('REF', 3);
                this._setV(REF, 1, this._mci(MAPS.mapN1_REF128, sDomain));
                this._setV(REF, 3, this._v('IdReference/@identifier', nContact));
            } else {
                let REF = this._initSegX12('REF', 3);
                this._setV(REF, 1, 'ZZ');
                this._setV(REF, 2, sDomain);
                this._setV(REF, 3, this._v('IdReference/@identifier', nContact));
            }
        }

        // REF ME
        let vPostalAddressName = this._v('PostalAddress/@name', nContact);
        if (vPostalAddressName) {
            let REF = this._initSegX12('REF', 2);
            this._setV(REF, 1, 'ME');
            this._setV(REF, 2, vPostalAddressName);
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


    } // end function _GroupN1

    private _PER_ZZ(vIDParent: string, vDomain: string, nHeader: Element) {
        let nLegalEntityCompany = this._e(vIDParent + '/IdReference [@domain="' + vDomain + '"]', nHeader);
        if (nLegalEntityCompany) {
            let PER = this._initSegX12('PER', 3);
            this._setV(PER, 1, 'ZZ');
            this._setV(PER, 2, this._v('@identifier', nLegalEntityCompany));
            this._setV(PER, 9, 'CompanyCode');
        }
    }

    private _TD5_ServiceLevel(nHeader: Element, TD5: EdiSegment) {
        let nServiceLevels = this._es('ServiceLevel', nHeader);
        let iSL = 12;
        for (let nSL of nServiceLevels) {
            let vMapped = this._mci(MAPS.mapTD512, this._v('', nSL));
            this._setV(TD5, iSL, vMapped);
            iSL++;
        }
    }

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

    static mapREF128_PartI_IDREF: Object = {
        "governmentnumber": "AEC", // governmentNumber
        "customerreferenceid": "CR", // customerReferenceID
        "ultimatecustomerreferenceid": "EU", // ultimateCustomerReferenceID
        "supplierreference": "D2", // supplierReference
        "documentname": "DD", // documentName
    };

    static mapREF128_PartI_Ext: Object = {
        "supplierorderid": "VN", // SupplierOrderID
        "invoiceid": "IN", // InvoiceID
        "shippingcontractnumber": "CT", // ShippingContractNumber
        "deliverynoteid": "DJ", // DeliveryNoteID
    }
    static mapREF128_PartII: Object = {
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
        //"mutuallydefined":"ZZ", // Mutually Defined

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
    static mapMEA_738: Object = {
        "grossweight": "G", // grossWeight
        "unitgrossweight": "GW", // unitGrossWeight
        "height": "HT", // height
        "length": "LN", // length
        "unitnetweight": "N", // unitNetWeight
        "volume": "VOL", // volume
        "grossvolume": "VWT", // grossVolume
        "width": "WD", // width
        "weight": "WT", // weight
    }

    static mapN1_98: Object = {
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
        "default": "ZZ", // default
    }

    static mapN1_66: Object = {
        "duns": "1", // DUNS
        "scac": "2", // SCAC
        "iata": "4", // IATA
        "duns+4": "9", // DUNS+4
        // "not mapped":"92", // Not Mapped
        // "not mapped":"91", // Not Mapped
        // "other":"Any other Code", // Other

    }
    static mapN1_REF128: Object = {
        "abaroutingnumber": "01", // abaRoutingNumber
        "swiftid": "02", // swiftID
        "chipsid": "03", // chipsID
        "accountid": "11", // accountID
        "accountpayableid": "12", // accountPayableID
        "ibanid": "14", // ibanID
        "bankbranchid": "3L", // bankBranchID
        "pstid": "3S", // pstID
        "loadingpoint": "4B", // loadingPoint
        "storagelocation": "4C", // storageLocation
        "provincialtaxid": "4G", // provincialTaxID
        "supplierlocationid": "4L", // supplierLocationID
        "qstid": "4O", // qstID
        "buyerplannercode": "72", // BuyerPlannerCode
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
        "gsttaxid": "GT", // gstTaxID
        "creditorrefid": "J1", // creditorRefID
        "cradcrsdindicator": "KK", // cRADCRSDIndicator
        "buyerlocationid": "LU", // buyerLocationID
        "bankaccountid": "PB", // bankAccountID
        // "bankaccountid": "PY", // bankAccountID
        "bankroutingid": "RT", // bankRoutingID
        "contactperson": "SA", // contactPerson
        "federaltaxid": "TJ", // federalTaxID
        "taxexemptionid": "TX", // taxExemptionID
        "vatid": "VX", // vatID
        "partyadditionalid ": "YD", // PartyAdditionalID 
        "partyadditionalid2": "ZA", // PartyAdditionalID2
    }
    /**
     * TD101 and PO404 103 Packaging Code
     */
    static mapPackaginCode: Object = {
        "ammo pack": "AMM", // Ammo Pack
        "ampoule": "AMP", // Ampoule
        "attachment": "ATH", // Attachment
        "bag": "BAG", // Bag
        "bale": "BAL", // Bale
        "barrel": "BBL", // Barrel
        "banding": "BDG", // Banding
        "bundle": "BDL", // Bundle
        "beam": "BEM", // Beam
        "bing chest": "BIC", // Bing Chest
        "bin": "BIN", // Bin
        "bulk": "BLK", // Bulk
        "belting": "BLT", // Belting
        "bobbin": "BOB", // Bobbin
        "bottle": "BOT", // Bottle
        "box": "BOX", // Box
        "bracing": "BRC", // Bracing
        "barge": "BRG", // Barge
        "basket or hamper": "BSK", // Basket or hamper
        "box, with inner container": "BXI", // Box, with inner container
        "bucket": "BXT", // Bucket
        "cabinet": "CAB", // Cabinet
        "cage": "CAG", // Cage
        "can": "CAN", // Can
        "carrier": "CAR", // Carrier
        "case": "CAS", // Case
        "containers of bulk cargo": "CBC", // Containers of Bulk Cargo
        "carboy": "CBY", // Carboy
        "can case": "CCS", // Can Case
        "cheeses": "CHE", // Cheeses
        "chest": "CHS", // Chest
        "car load, rail": "CLD", // Car Load, Rail
        "household goods container, wood": "CNA", // Household Goods Container, Wood
        "container, mac-iso, lt. wgt. 8x8x20 foot air": "CNB", // Container, MAC-ISO, LT. WGT. 8x8x20 Foot Air
        "container, navy cargo transporter": "CNC", // Container, Navy Cargo Transporter
        "container, commercial highway lift": "CND", // Container, Commercial Highway Lift
        "container, engine": "CNE", // Container, Engine
        "container, multi-walled, secured to warehouse pallet": "CNF", // Container, Multi-walled, Secured to Warehouse Pallet
        "container": "CNT", // Container
        "coil": "COL", // Coil
        "cones": "CON", // Cones
        "core": "COR", // Core
        "cradle": "CRD", // Cradle
        "corner reinforcement": "CRF", // Corner Reinforcement
        "crate": "CRT", // Crate
        "cask": "CSK", // Cask
        "carton": "CTN", // Carton
        "conex": "CX2", // CONEX
        "cylinder": "CYL", // Cylinder
        "dry bulk": "DBK", // Dry Bulk
        "double-length rack": "DRK", // Double-length Rack
        "drum": "DRM", // Drum
        "double-length skid": "DSK", // Double-length Skid
        "double-length tote bin": "DTB", // Double-length Tote Bin
        "duffelbag": "DUF", // Duffelbag
        "egg crating": "EGG", // Egg Crating
        "envelope": "ENV", // Envelope
        "edge protection": "EPR", // Edge Protection
        "firkin": "FIR", // Firkin
        "flo-bin": "FLO", // Flo-bin
        "frame": "FRM", // Frame
        "flask": "FSK", // Flask
        "forward reel": "FWR", // Forward Reel
        "heads of beef": "HED", // Heads of Beef
        "hogshead": "HGH", // Hogshead
        "hamper": "HPR", // Hamper
        "hopper truck": "HPT", // Hopper Truck
        "on hanger or rack in boxes": "HRB", // On Hanger or Rack in Boxes
        "half-standard rack": "HRK", // Half-Standard Rack
        "half-standard tote bin": "HTB", // Half-Standard Tote Bin
        "intermediate container": "INT", // Intermediate Container
        "jar": "JAR", // Jar
        "keg": "KEG", // Keg
        "kit": "KIT", // Kit
        "knockdown rack": "KRK", // Knockdown Rack
        "knockdown tote bin": "KTB", // Knockdown Tote Bin
        "liquid bulk": "LBK", // Liquid Bulk
        "lip/top": "LID", // Lip/Top
        "lifts": "LIF", // Lifts
        "liners": "LNR", // Liners
        "log": "LOG", // Log
        "loose": "LSE", // Loose
        "lug": "LUG", // Lug
        "lift van": "LVN", // Lift Van
        "mixed container types": "MIX", // Mixed Container Types
        "milvan": "ML2", // MILVAN
        "multi-roll pack": "MRP", // Multi-Roll Pack
        "mscvan": "MS2", // MSCVAN
        "mixed": "MXD", // Mixed
        "noil": "NOL", // Noil
        "pallet - 4 way": "PAF", // Pallet - 4 Way
        "pail": "PAL", // Pail
        "pallet - 2 way": "PAT", // Pallet - 2 Way
        "packed - not otherwise specified": "PCK", // Packed - not otherwise specified
        "pieces": "PCS", // Pieces
        "pirns": "PIR", // Pirns
        "package": "PKG", // Package
        "primary lift container": "PLC", // Primary Lift Container
        "platform": "PLF", // Platform
        "pipeline": "PLN", // Pipeline
        "pallet": "PLT", // Pallet
        "private vehicle": "POV", // Private Vehicle
        "pipe rack": "PRK", // Pipe Rack
        "partitioning": "PRT", // Partitioning
        "plastic-wrapped tray": "PWT", // Plastic-Wrapped Tray
        "quarter of beef": "QTR", // Quarter of Beef
        "rail (semiconductor)": "RAL", // Rail (Semiconductor)
        "rack": "RCK", // Rack
        "reel": "REL", // Reel
        "reinforcement": "RFT", // Reinforcement
        "roll": "ROL", // Roll
        "reverse reel": "RVR", // Reverse Reel
        "sack": "SAK", // Sack
        "suitcase": "SCS", // Suitcase
        "shook": "SHK", // Shook
        "sheet": "SHT", // Sheet
        "side of beef": "SID", // Side of Beef
        "skid": "SKD", // Skid
        "skid, elevating or lift truck": "SKE", // Skid, elevating or lift truck
        "slip sheet": "SLP", // Slip Sheet
        "sleeve": "SLV", // Sleeve
        "spin cylinders": "SPI", // Spin Cylinders
        "spool": "SPL", // Spool
        "separator/divider": "SPR", // Separator/Divider
        "shrink wrap": "SRW", // Shrink Wrap
        "stretch wrap": "STW", // Stretch Wrap
        "seavan": "SV2", // SEAVAN
        "tube": "TBE", // Tube
        "tote bin": "TBN", // Tote Bin
        "tank car": "TKR", // Tank Car
        "tank truck": "TKT", // Tank Truck
        "intermodal trailer/container load (rail)": "TLD", // Intermodal Trailer/Container Load (Rail)
        "tank": "TNK", // Tank
        "tierce": "TRC", // Tierce
        "trunk and chest": "TRK", // Trunk and Chest
        "truck": "TRU", // Truck
        "tray": "TRY", // Tray
        "trunk, salesmen sample": "TSS", // Trunk, Salesmen Sample
        "tub": "TUB", // Tub
        "unpacked": "UNP", // Unpacked
        "unit": "UNT", // Unit
        "vehicles": "VEH", // Vehicles
        "vial": "VIL", // Vial
        "vehicle in operating condition": "VOC", // Vehicle in Operating Condition
        "van pack": "VPK", // Van Pack
        "on own wheel": "WHE", // On Own Wheel
        "wheeled carrier": "WLC", // Wheeled Carrier
        "wrapped": "WRP", // Wrapped
        "aluminum": "01", // Aluminum
        "as specified by the dot": "04", // As Specified by the DOT
        "burlap": "07", // Burlap
        "chemically hardened fibre": "10", // Chemically Hardened Fibre
        "cloth": "13", // Cloth
        "cloth top": "16", // Cloth Top
        "cloth or fabric": "19", // Cloth or Fabric
        "compressed": "22", // Compressed
        "corrugated or solid": "25", // Corrugated or Solid
        "double-wall paper": "28", // Double-wall Paper
        "fibre": "31", // Fibre
        "fibre (paperboard)": "34", // Fibre (Paperboard)
        "fiberboard": "37", // Fiberboard
        "fiberboard metal": "40", // Fiberboard Metal
        "glass": "43", // Glass
        "in inner containers": "46", // In Inner Containers
        "wire/cord": "48", // Wire/Cord
        "insulated": "49", // Insulated
        "steel - vinyl coated": "50", // Steel - Vinyl Coated
        "wire mesh": "51", // Wire Mesh
        "iron or steel": "52", // Iron or Steel
        "jumbo": "53", // Jumbo
        "special jumbo": "54", // Special Jumbo
        "lead": "55", // Lead
        "metal": "58", // Metal
        "metal cans": "59", // Metal Cans
        "moisture resistant": "61", // Moisture Resistant
        "molded plastic": "64", // Molded Plastic
        "multiple-wall paper (2 or more walls)": "67", // Multiple-wall Paper (2 or more walls)
        "multiple-wall paper (3 or more walls)": "70", // Multiple-wall Paper (3 or more walls)
        "not otherwise specified": "71", // Not Otherwise Specified
        "paper - vci": "72", // Paper - VCI
        "other than glass": "73", // Other than Glass
        "other than metal or plastic tubes, or glass": "74", // Other than Metal or Plastic Tubes, or Glass
        "plastic - vacuum formed": "75", // Plastic - Vacuum Formed
        "paper": "76", // Paper
        "plastic - structural foam": "77", // Plastic - Structural Foam
        "plastic - injection molded": "78", // Plastic - Injection Molded
        "plastic": "79", // Plastic
        "polyethylene lined": "80", // Polyethylene Lined
        "plastic - virgin": "81", // Plastic - Virgin
        "pulpboard": "82", // Pulpboard
        "plastic - regrind": "83", // Plastic - Regrind
        "polystyrene": "84", // Polystyrene
        "rubber": "85", // Rubber
        "foam": "86", // Foam
        "rubber and fabric": "88", // Rubber and Fabric
        "special": "89", // Special
        "standard": "90", // Standard
        "stainless steel": "91", // Stainless Steel
        "tubes, metal or plastic": "92", // Tubes, Metal or Plastic
        "wood": "94", // Wood
        "single wall corrugated board": "95", // Single Wall Corrugated Board
        "double wall corrugated board": "96", // Double Wall Corrugated Board
        "triple wall corrugated board": "97", // Triple Wall Corrugated Board
    }
}