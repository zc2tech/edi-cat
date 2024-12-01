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
import { ASTNode } from "../../new_parser/syntaxParserBase";

export enum ShipNodeType {
    Root, // ROOT is a special type
    Portion,
    Container, // includes 0001,0002,0003
    Item,
    SubItem,
}

export class ShipNode {
    nodeKey: string; // Portion: OrderID, Container:SerialCode, Item:shipNoticeLineNumber
    iCPS: number;
    iTraverseLevel: number; // 1,2,3 for 0001,0002,0003
    type: ShipNodeType;
    ele: Element; // Could be ShipPortion, Packaging, Item
    children: ShipNode[] = [];
    parent: ShipNode;
    constructor(nodeKey: string, type: ShipNodeType, ele?: Element) {
        this.nodeKey = nodeKey;
        this.type = type;
        this.ele = ele;
    }
}

/**
 * Condition:										
 *
 */
export class Cvt_ShipNotice_DESADV extends XmlConverterBase {
    protected _convertErrs: ConvertErr[];
    protected _RootNode = new ShipNode('ROOT', ShipNodeType.Root);
    protected _currContainerNode: ShipNode; // for adding Item type ASNNode under it
    protected _shippingMarkKey: { [key: number]: string } = {}; // every hierarchy level has it's own key to compare
    protected _iCPS: number = 1;
    protected _iTraverseLevel: number = 1;

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
        this._UNB('DESADV', true);

        const nHeader = this._rn('/ShipNoticeRequest/ShipNoticeHeader');
        const nShipReq = this._rn('/ShipNoticeRequest');
        let sShipmentID = this._v('@shipmentID', nHeader);
        let sOperation = this._v('@operation', nHeader);
        let sType = this._v('@shipmentType', nHeader);

        // UNH
        let UNH = this._initSegEdi('UNH', 2);
        this._setV(UNH, 1, this._sUniqueRefGP); // Sequential counter throughout message (UNB) Starting at "1"
        this._setV(UNH, 201, 'DESADV'); // 65
        this._setV(UNH, 202, 'D');
        this._setV(UNH, 203, '96A');
        this._setV(UNH, 204, 'UN');

        // BGM
        let BGM = this._initSegEdi('BGM', 4);
        this._setV(BGM, 101, '351');
        this._setV(BGM, 102, 'ZZZ');
        this._setV(BGM, 104, this._v('@fulfillmentType', nHeader));
        this._setV(BGM, 2, sShipmentID);
        this._setV(BGM, 3, this._mcs(MAPS.mapBGM1225, sOperation));
        this._setV(BGM, 4, this._mcs(MAPS.mapBGM4343, sType));
        // SG1 Group1
        let nPortions = this._es('ShipNoticePortion', nShipReq);

        // DTM 124
        this._Header(nHeader, nPortions, nShipReq);

        // PAC
        let vTotalPackages = this._v('Extrinsic[@name="totalOfPackages"]', nHeader);
        if (vTotalPackages) {
            let PAC = this._initSegEdi('PAC', 1);
            this._setV(PAC, 1, vTotalPackages);
        }

        // Peek hierarchy first.
        for (let nPortion of nPortions) {
            // RFF CT, will that duplicate since we've already used first Portioin to create header info ?
            let sAgreementID = this._v('MasterAgreementInfo/@agreementID', nPortion);
            let sAgreementType = this._v('MasterAgreementInfo/@agreementType', nPortion);
            if (sAgreementID) {
                let RFF = this._initSegEdi('RFF', 1);
                this._setV(RFF, 101, 'CT');
                this._setV(RFF, 102, sAgreementID);
                if (sAgreementType && sAgreementType == 'scheduling_agreement') {
                    this._setV(RFF, 103, '1');
                }
                // DTM
                this._DTM_EDI(nPortion, 'MasterAgreementInfo/@agreementDate', '126');
            }

            let vOrderID = this._v('OrderReference/@orderID', nPortion);
            let nodePortion = new ShipNode(vOrderID, ShipNodeType.Portion, nPortion);
            this._currContainerNode = nodePortion;
            this._RootNode.children.push(nodePortion);
            nodePortion.parent = this._RootNode;
            this._peek_hierarchy(nPortion, nodePortion);
            let nodeOne = this._foundNodeByType(nodePortion, ShipNodeType.Container);
            if (!nodeOne) {
                // very simple structure
                let nodeItems = nodePortion.children;
                for (let nodeItem of nodeItems) {
                    let nShipItem = nodeItem.ele;
                    // LIN
                    this._shipItem(nShipItem);

                    let nodePacks = nodeItem.children;
                    this._shippingMarkKey[this._iTraverseLevel] = 'Never Exist Key'; // this variable helps removing duplication of PIC
                    for (let nodePack of nodePacks) {
                        let nPack = nodePack.ele;
                        this._SG20_Packaging(nPack);
                    }

                    // SG23 Group 23
                    // QVR
                    let vQuantityVariance = this._v('Extrinsic[@name="QuantityVariance"]', nShipItem);
                    if (vQuantityVariance) {
                        let QVR = this._initSegEdi('QVR', 2);
                        this._setV(QVR, 101, vQuantityVariance);
                        this._setV(QVR, 102, '21');
                        this._setV(QVR, 2, this._v('Extrinsic[@name="DiscrepancyNatureIdentificationCode"]', nShipItem))
                    }
                }
            } else {
                // nodeOne exist, so we should pack before ShipItem
                // let node01s = nodePortion.children;
                this._iTraverseLevel = 1;
                nodePortion.iCPS = 1; // fixed
                let nodeItems = this._traverse(nodePortion);

            }
        }

        // special program for setting PAC01
        let thePAC: EdiSegment;
        let iCounter: number = 0;
        for (let seg of this._segs) {
            if (seg.id == 'PAC') {
                // reset counter;
                iCounter = 0;
                thePAC = seg;
            }
            if (seg.id == 'GIN') {
                iCounter++;
            }
            if (thePAC && seg.id == 'LIN') {
                // flush to thePAC
                this._setV(thePAC, 1, iCounter.toString());
            }
        }


        // CNT Although there's description in MapSpec, not sure if it's needed
        // let CNT = this._initSegEdi('CNT', 1);
        // this._setV(CNT, 101, '2');

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
     * Reset all the Marks until 'to' level, so we can get the 'CPS' created
     * @param to 
     */
    private _resetMark(to: number) {
        for (let i = 1; i <= to; i++) {
            this._shippingMarkKey[i] = 'Never Exist Key' + i;
        }
    }
    /**
     * Will return a ShipmentItem type ShipNode
     * if found
     * 
     * @param nodeParents 
     * @returns 
     */
    private _traverse(nodeParent: ShipNode): ShipNode[] {
        this._shippingMarkKey[this._iTraverseLevel] = 'Never Exist Key' + this._iTraverseLevel; // this variable helps removing duplication of PIC
        for (let nodeC of nodeParent.children) {
            if (nodeC.type == ShipNodeType.Item) {
                this._resetMark(this._iTraverseLevel);
                let nShipItem = nodeC.ele;
                // LIN
                this._shipItem(nShipItem);
                this._iTraverseLevel++; // even for packs under shipItem, we need a dummy level to distinguish
                let nodePacks = nodeC.children; // ShipItem Children
                this._shippingMarkKey[this._iTraverseLevel] = 'Never Exist Key' + this._iTraverseLevel;
                for (let nodePack of nodePacks) {
                    let nPack = nodePack.ele;
                    // this._pack(nPack, nodeParent.iCPS, nodeParent.children.length);
                    this._SG20_Packaging(nPack);
                }
                this._iTraverseLevel--;
                // SG23 Group 23
                // QVR
                // let vQuantityVariance = this._v('Extrinsic[@name="QuantityVariance"]', nShipItem);
                // if (vQuantityVariance) {
                //     let QVR = this._initSegEdi('QVR', 2);
                //     this._setV(QVR, 101, vQuantityVariance);
                //     this._setV(QVR, 102, '21');
                //     this._setV(QVR, 2, this._v('Extrinsic[@name="DiscrepancyNatureIdentificationCode"]', nShipItem))
                // }

            } else if (nodeC.type == ShipNodeType.Container) {
                let nPackC = nodeC.ele;
                nodeC.iTraverseLevel = this._iTraverseLevel;
                nodeC.iCPS = this._iCPS;

                this._pack(nPackC, nodeParent.iCPS, nodeParent.children.length);

                this._iTraverseLevel++;
                this._traverse(nodeC);
                this._iTraverseLevel--;
            }

        } // end loop nodeParent.children
        return [];
    }

    private _peek_hierarchy(nPortion: Element, nodePortion: ShipNode) {

        let nShipItems = this._es('ShipNoticeItem', nPortion);
        for (let nShipItem of nShipItems) {
            let vShpiLineNum = this._v('@shipNoticeLineNumber', nShipItem);
            let nodeItem = new ShipNode(vShpiLineNum, ShipNodeType.Item, nShipItem);
            let arrNode01 = [];
            let arrNode02 = [];
            let arrNode03 = [];
            let arrNodeUnderItem = [];
            let nPacks = this._es('Packaging', nShipItem);
            for (let nPack of nPacks) {
                let vDesc = this._v('Description/@type', nPack);
                let vSerial = this._v('ShippingContainerSerialCode', nPack);
                let vSerialRef = this._v('ShippingContainerSerialCodeReference', nPack);
                let vPackagingCode = this._v('PackagingCode', nPack) // decide whether it includes ShipmentItem or not
                let vLevel = this._v('PackagingLevelCode', nPack);
                if (vPackagingCode) {
                    switch (vLevel) {
                        case '0001':
                            arrNode01.push(nPack);
                            break;
                        case '0002':
                            arrNode02.push(nPack);
                            break;
                        case '0003':
                            arrNode03.push(nPack);
                            break;
                        default:
                            // the 'PackagingCode' decides it's above shipmentItem, even without any PackagingLevelCode data
                            arrNode01.push(nPack);
                            break;
                    }
                } else {
                    arrNodeUnderItem.push(nPack);
                }
            } // end loop nPacks


            // Level 0001
            for (let nPack of arrNode01) {
                let vSerial = this._v('ShippingContainerSerialCode', nPack);
                let vSerialRef = this._v('ShippingContainerSerialCodeReference', nPack);
                let nodeFound = this._foundNode(nodePortion, vSerial, ShipNodeType.Container);
                if (!nodeFound) {
                    let newNode = new ShipNode(vSerial, ShipNodeType.Container, nPack);
                    this._currContainerNode = newNode;
                    nodePortion.children.push(newNode);
                    newNode.parent = nodePortion;
                } else {
                    this._currContainerNode = nodeFound;
                }
            }

            // Level 0002
            for (let nPack of arrNode02) {
                this._arrange_level_02_03(nPack, nodePortion);
            }

            // Level 0003
            for (let nPack of arrNode03) {
                this._arrange_level_02_03(nPack, nodePortion);
            }

            // assume we have no need to find duplicated ShipItem
            this._currContainerNode.children.push(nodeItem);
            nodeItem.parent = this._currContainerNode;
            for (let nPack of arrNodeUnderItem) {
                let vSerial = this._v('ShippingContainerSerialCode', nPack);
                if (!vSerial) {
                    continue; // I assume all Packs have serial code
                }
                let newNode = new ShipNode(vSerial, ShipNodeType.SubItem, nPack);
                nodeItem.children.push(newNode);
            }

        }
    }

    private _arrange_level_02_03(nPack: any, nodePortion: ShipNode) {
        let vSerial = this._v('ShippingContainerSerialCode', nPack);
        let vSerialRef = this._v('ShippingContainerSerialCodeReference', nPack);
        let nodeFound = this._foundNode(nodePortion, vSerial, ShipNodeType.Container);
        if (!nodeFound) {
            let parentNode = this._foundNode(nodePortion, vSerialRef, ShipNodeType.Container);
            if (parentNode) {
                // it will be very strange if we cannot find the parentNode
                // because we already done Level 0001 at ShipmentItem level
                let newNode = new ShipNode(vSerial, ShipNodeType.Container, nPack);
                this._currContainerNode = newNode;
                parentNode.children.push(newNode);
                newNode.parent = parentNode;
            }
        } else {
            this._currContainerNode = nodeFound;
        }
    }

    /**
     * from nodePortion's descendents to find the node, 
     * @param nodeParent 
     * @param vNodeKey 
     * @param nodeFound 
     * @returns 
     */
    private _foundNode(nodeParent: ShipNode, vNodeKey: string, vType: ShipNodeType): ShipNode {
        for (let nodePack01 of nodeParent.children) {
            if (nodePack01.nodeKey == vNodeKey
                && nodePack01.type == vType) {
                return nodePack01;
            }
            let nodeObj = this._foundNode(nodePack01, vNodeKey, vType);
            if (nodeObj) {
                return nodeObj;
            }
        }
        return undefined;
    }
    /**
     * Find the node by Type 
     * @param nodeParent 
     * @param vNodeKey 
     * @param nodeFound 
     * @returns 
     */
    private _foundNodeByType(nodeParent: ShipNode, vType: ShipNodeType): ShipNode {
        for (let nodePack01 of nodeParent.children) {
            if (nodePack01.type == vType) {
                return nodePack01;
            }
            let nodeObj = this._foundNodeByType(nodePack01, vType);
            if (nodeObj) {
                return nodeObj;
            }
        }
        return undefined;
    }

    private _Header(nHeader: Element, nPortions: Element[], nShipReq: Element) {
        this._DTM_EDI(nHeader, '@noticeDate', '137'); // Should be "124" or "137"
        // DTM 11
        this._DTM_EDI(nHeader, '@shipmentDate', '11');
        // DTM 17
        this._DTM_EDI(nHeader, '@deliveryDate', '17');
        // DTM 2
        this._DTM_EDI(nHeader, '@requestedDeliveryDate', '2');
        // DTM 200
        this._DTM_EDI(nHeader, 'Extrinsic[@name="PickUpDate"]', '200');

        // MEA
        let nHeadPackDims = this._es('Packaging/Dimension', nHeader);
        nHeadPackDims = nHeadPackDims ?? [];
        for (let nDim of nHeadPackDims) {
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

        if (nPortions.length > 0) {
            //SG1 should be header level, so use the first Portion to get data
            this._SG1_RFF_DTM(nHeader, nPortions[0]);
        }

        // SG2 Group3
        let Contacts = this._es('Contact', nHeader);
        for (let ct of Contacts) {
            let sRole = this._v('@role', ct);
            // NAD
            this._NAD(this._mci(MAPS.mapNAD3035, sRole), ct);
            // RFF IdReference
            this._IDRef(ct);
            // Group 6
            this._CTA_COM('IC', '', this._mci(MAPS.mapNAD3035, sRole) + ' Contact Name', ct);

        } // end loop for Contacts


        // SG2 Group2 NAD DP TermsOfDelivery
        let nTOD = this._e('TermsOfDelivery', nHeader);

        if (nTOD) {
            let addressDP = this._e('Address', nTOD);
            if (addressDP) {
                this._NAD('DP', addressDP);
                this._CTA_COM('IC', '', 'DP Contact Name', addressDP);
            }

            // FTX AAR_TDC
            let vOther_AAR_TDC = this._v('TermsOfDeliveryCode [@value="Other" or @value="other"]', nTOD);
            // FTX AAR_SPM
            let vOther_AAR_SPM = this._v('ShippingPaymentMethod [@value="Other" or @value="other"]', nTOD);
            // FTX AAR_TTC
            let vOther_AAR_TTC = this._v('TransportTerms [@value="Other" or @value="other"]', nTOD);

            let TOD = this._initSegEdi('TOD', 3);

            // I think it's wrong for MapSpec to use @value, it's not the CIG's behavior
            if (vOther_AAR_TDC) {
                this._setV(TOD, 1, this._mci(MAPS.mapTOD4055, vOther_AAR_TDC));
            } else {
                this._setV(TOD, 1, this._mci(MAPS.mapTOD4055, this._v('TermsOfDeliveryCode', nTOD)));
            }
            if (vOther_AAR_SPM) {
                this._setV(TOD, 2, 'ZZZ');
            } else {
                this._setV(TOD, 2, this._mci(MAPS.mapTOD4215, this._v('ShippingPaymentMethod/@value', nTOD)));
            }
            if (vOther_AAR_TTC) {
                this._setV(TOD, 301, 'ZZZ');
            } else {
                this._setV(TOD, 301, this._mci(MAPS.mapTOD4053, this._v('TransportTerms/@value', nTOD)));
            }

            this._setV(TOD, 304, this._v('Comments [@type="TermsOfDelivery"]', nTOD));
            this._setV(TOD, 305, this._v('Comments [@type="Transport"]', nTOD));

            if (vOther_AAR_TDC) {
                let FTX = this._initSegEdi('FTX', 4);
                this._setV(FTX, 1, 'AAR');
                this._setV(FTX, 301, 'TDC');
                this._setV(FTX, 401, vOther_AAR_TDC);
            }

            if (vOther_AAR_SPM) {
                let FTX = this._initSegEdi('FTX', 4);
                this._setV(FTX, 1, 'AAR');
                this._setV(FTX, 301, 'SPM');
                this._setV(FTX, 401, vOther_AAR_SPM);
            }

            if (vOther_AAR_TTC) {
                let FTX = this._initSegEdi('FTX', 4);
                this._setV(FTX, 1, 'AAR');
                this._setV(FTX, 301, 'TTC');
                this._setV(FTX, 401, vOther_AAR_TTC);
            }

            // FTX AAI
            // Be careful as EDIFACT cannot convert Comments/Attachment/URL, there is no mapping in MapSpec
            let nComments = this._es('Comments', nTOD);
            let sCommentsLang: string;
            for (let n of nComments) {
                let sComments = this._vt(n);
                //let sCommentsType = this._v('@type', n);
                // it's OK to assign the last to global, I'm tired
                sCommentsLang = this._v('@xml:lang', n);
                if (sComments) {
                    let FTX = this._initSegEdi('FTX', 5);
                    this._setV(FTX, 1, 'AAI');
                    this._setV(FTX, 401, this._v('@type', n).trim());
                    this._FTX(FTX, 2, sComments);
                    this._setV(FTX, 5, sCommentsLang);
                }
            }

        } // end if nTOD


        // FTX ServiceLevel
        let sServiceLevel = this._v('ServiceLevel', nHeader);
        if (sServiceLevel) {
            let sLang = this._v('ServiceLevel/@xml:lang', nHeader);
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'SSR');
            this._FTX(FTX, 1, sServiceLevel);
            this._setV(FTX, 5, sLang);
        }

        // SG6 Group 6
        let nShipControl = this._e('ShipControl', nShipReq);
        if (nShipControl) {
            // TDT
            let TDT = this._initSegEdi('TDT', 8);

            let vShipmentIdentifier = this._v('ShipmentIdentifier', nShipControl);
            this._setV(TDT, 1, '20');
            this._setV(TDT, 2, vShipmentIdentifier);
            this._setV(TDT, 301, 'ZZZ');
            this._setV(TDT, 302, this._v('TransportInformation/ShippingContractNumber', nShipControl));


            let vMethod = this._v('TransportInformation/Route/@method', nShipControl);

            let vMappedMethod = this._mci(MAPS.mapTDT8179, vMethod);
            this._setV(TDT, 401, vMappedMethod);
            this._setV(TDT, 402, this._v('TransportInformation/Route/@means', nShipControl));
            this._setV(TDT, 501, this._v('CarrierIdentifier', nShipControl));
            let vDomain = this._v('CarrierIdentifier/@domain', nShipControl);
            this._setV(TDT, 503, this._mcs(MAPS.mapTDT3055, vDomain));
            this._setV(TDT, 504, this._v('CarrierIdentifier[@domain="companyName"]', nShipControl));
            this._setV(TDT, 701, 'ZZZ');
            this._setV(TDT, 702, 'ZZZ');
            this._setV(TDT, 703, this._v('ShipmentIdentifier/@domain', nShipControl));
            let sTrackingURL = this._v('ShipmentIdentifier/@trackingURL', nShipControl);
            if (sTrackingURL) {
                this._setTV(TDT, 804, sTrackingURL.substring(0, 35));
                sTrackingURL = sTrackingURL.substring(35); // remove the outputted part
            }

            // LOC, if there is tracking URL left
            if (sTrackingURL) {
                let LOC = this._initSegEdi('LOC', 2);
                this._setV(LOC, 1, '92');
                this._setTV(LOC, 204, sTrackingURL);
            }

            // DTM for trackingNumberDate
            this._DTM_EDI(nShipControl, 'ShipmentIdentifier/@trackingNumberDate', '171');

            // LOC ShippingInstructions
            let sDesc = this._v('TransportInformation/ShippingInstructions/Description', nShipControl);
            if (sDesc) {
                let iCnt: number = sDesc.length / 70;
                if (sDesc.length % 70 > 0) {
                    iCnt++;
                }
                let LOC = this._initSegEdi('LOC', iCnt + 1);
                this._setV(LOC, 1, 'ZZZ');
                for (let i = 2; i < iCnt + 2; i++) {
                    this._setV(LOC, i * 100 + 4, sDesc.substring(0, 70));
                    sDesc = sDesc.substring(70);
                }

            }

        } // end if nShipcontrol


        // SG8 Group 8
        let nTermsOfTransport = this._e('TermsOfTransport', nHeader);
        if (nTermsOfTransport) {
            let vEquipCode = this._v('EquipmentIdentificationCode', nTermsOfTransport);
            if (vEquipCode) {
                // EQD
                let EQD = this._initSegEdi('EQD', 2);
                this._setV(EQD, 1, vEquipCode);
                this._setV(EQD, 2, this._v('Extrinsic[@name="EquipmentID"]', nTermsOfTransport));
            }
            // MEA
            let nDim = this._e('Dimension', nTermsOfTransport);
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

            // SEL
            let vSealID = this._v('SealID', nTermsOfTransport);
            if (vSealID) {
                let SEL = this._initSegEdi('SEL', 2);
                this._setV(SEL, 1, vSealID);
                this._setV(SEL, 201, this._v('SealingPartyCode', nTermsOfTransport));
            }
        } // end if nTermsOfTransport



        // SG10 Group 10
        // CPS
        let CPS = this._initSegEdi('CPS', 1);
        this._setV(CPS, 1, this._iCPS.toString());
        this._iCPS++;

        // FTX AAI
        // Be careful as EDIFACT cannot convert Comments/Attachment/URL, there is no mapping in MapSpec
        let nComments = this._es('Comments', nHeader);
        let sCommentsLang: string;
        for (let n of nComments) {
            let sComments = this._vt(n);
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

        // FTX ZZZ
        let nExtrins = this._es(XML.Extrinsic, nHeader);
        nExtrins = nExtrins ?? [];
        for (let nExt of nExtrins) {
            let vName = this._v('@name', nExt);
            let value = this._v('', nExt);
            if (vName.endsWith('Date')) {
                return;
            }
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'ZZZ');
            this._setV(FTX, 401, vName);
            if (vName.endsWith('Date')) {
                // let sDate = Utils.dateStr304FromSTD2(value);
                // if(sDate) {
                //     this._setV(FTX, 402, sDate);
                // } else {
                //     this._splitStr(FTX, value, 4, 2, 5, 70);
                // }
            } else {
                this._splitStr(FTX, value, 4, 2, 5, 70);
            }
        }
    }

    private _shipItem(nShipItem: Element) {
        // SG15 Group 15
        // LIN
        let LIN = this._initSegEdi('LIN', 4);
        let vShipNoticeLineNumber = this._v('@shipNoticeLineNumber', nShipItem);
        if (vShipNoticeLineNumber) {
            this._setV(LIN, 1, vShipNoticeLineNumber);
        }
        this._setV(LIN, 301, this._v('@lineNumber', nShipItem));
        this._setV(LIN, 302, 'PL');
        let vParentLineNum = this._v('@parentLineNumber', nShipItem);
        if (vParentLineNum) {
            this._setV(LIN, 401, '1');
            this._setV(LIN, 402, vParentLineNum);
        }
        // PIA
        this._PIA(nShipItem);

        let nItemDetail = this._e('ShipNoticeItemDetail', nShipItem);

        // IMD_F
        let vLang = this._v('Description/@xml:lang', nItemDetail);
        vLang = vLang ? vLang : 'en';
        let vDesc = this._vt2('Description', nItemDetail);
        if (vDesc) {
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'F');
            this._splitStr(IMD, vDesc, 3, 4, 5, 70);
            this._setV(IMD, 306, vLang);
        }

        // IMD_E

        let vShortName = this._vt2('Description/ShortName', nItemDetail);
        if (vShortName) {
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'E');
            this._splitStr(IMD, vShortName, 3, 4, 5, 70);
            this._setV(IMD, 306, vLang);
        }



        // IMD_B
        let vDomain = this._v('ItemDetailIndustry/ItemDetailRetail/Characteristic/@domain', nItemDetail);
        if (vDomain) {
            // IMD
            let IMD = this._initSegEdi('IMD', 3);
            this._setV(IMD, 1, 'B');
            if (this._mei(MAPS.mapIMD7081, vDomain)) {
                this._setV(IMD, 2, this._mcs(MAPS.mapIMD7081, vDomain));
            } else {
                this._setV(IMD, 2, '79');
            }
            this._setV(IMD, 3, this._v('ItemDetailIndustry/ItemDetailRetail/Characteristic/@value', nItemDetail));
        }
        // IMD_B ACA
        let sDomain = this._v('Classification/@domain', nItemDetail);
        let sClassification = this._v('Classification', nItemDetail);
        if (sClassification) {
            let IMDB = this._initSegEdi('IMD', 3);
            this._setV(IMDB, 1, 'B');
            this._setV(IMDB, 301, 'ACA');
            this._setV(IMDB, 304, sDomain);
            this._setV(IMDB, 305, sClassification);
        }
        // MEA
        let nDimensions = this._es('Dimension', nItemDetail);
        for (let nDim of nDimensions) {
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
        // QTY 12
        let vQTY = this._v('@quantity', nShipItem);
        if (vQTY) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '12');
            this._setV(QTY, 102, this._trimIntStr(vQTY));
            this._setV(QTY, 103, this._v('UnitOfMeasure', nShipItem));
        }
        // QTY 21
        vQTY = this._v('OrderedQuantity/@quantity', nShipItem);
        if (vQTY) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '21');
            this._setV(QTY, 102, this._trimIntStr(vQTY));
            this._setV(QTY, 103, this._v('OrderedQuantity/UnitOfMeasure', nShipItem));
        }
        // QTY 192
        vQTY = this._v('ShipNoticeItemIndustry/ShipNoticeItemRetail/FreeGoodsQuantity/@quantity', nShipItem);
        if (vQTY) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '192');
            this._setV(QTY, 102, this._trimIntStr(vQTY));
            this._setV(QTY, 103, this._v('ShipNoticeItemIndustry/ShipNoticeItemRetail/FreeGoodsQuantity/UnitOfMeasure', nShipItem));
        }
        // GIR
        let vManufacturerName = this._v('ManufacturerName', nItemDetail);
        if (vManufacturerName) {
            let iLenPerEle = 35;
            let GIR = this._initSegEdi('GIR', 2 + vManufacturerName.length / iLenPerEle);
            this._setV(GIR, 1, '1');
            let tmp = vManufacturerName;
            for (let i = 2; i <= 6; i++) {
                if (tmp.length > iLenPerEle) {
                    this._setV(GIR, i * 100 + 1, EdiUtils.escapeEdi(tmp.substring(0, iLenPerEle)));
                    this._setV(GIR, i * 100 + 2, 'AN');
                    tmp = tmp.substring(iLenPerEle);
                } else {
                    this._setV(GIR, i * 100 + 1, EdiUtils.escapeEdi(tmp));
                    this._setV(GIR, i * 100 + 2, 'AN');
                    break;
                }
            }
        }
        // DTM 36 expirationDate
        let vExpDate = this._v('ShipNoticeItemIndustry/ShipNoticeItemRetail/ExpiryDate/@date', nShipItem);
        if (vExpDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '36');
            this._setV(DTM, 102, Utils.dateStr102(vExpDate));
            this._setV(DTM, 103, '102');
        }
        // DTM 361 BestBeforeDate
        let vBestBeforeDate = this._v('ShipNoticeItemIndustry/ShipNoticeItemRetail/BestBeforeDate/@date', nShipItem);
        if (vBestBeforeDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '361');
            this._setV(DTM, 102, Utils.dateStr102(vBestBeforeDate));
            this._setV(DTM, 103, '102');
        }
        // FTX AAI
        // Be careful as EDIFACT cannot convert Comments/Attachment/URL, there is no mapping in MapSpec
        let nComments = this._es('Comments', nShipItem);
        let sCommentsLang: string;
        for (let n of nComments) {
            let sComments = this._vt(n);
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

        // FTX ZZZ
        let arrDoneByFTX: string[] = [];
        let nExtrins = this._es(XML.Extrinsic, nShipItem);
        nExtrins = nExtrins ?? [];
        for (let nExt of nExtrins) {
            let FTX = this._initSegEdi('FTX', 5);
            this._setV(FTX, 1, 'ZZZ');
            let vName = this._v('@name', nExt);
            arrDoneByFTX.push(vName);
            this._setV(FTX, 401, vName);
            this._splitStr(FTX, this._v('', nExt), 4, 2, 5, 70);
        }

        // MOA 146
        let vMoney1 = this._v('UnitPrice/Money', nItemDetail);
        let vCurrency = this._v('UnitPrice/Money/@currency', nItemDetail);
        let MOA: EdiSegment;
        if (vMoney1) {
            MOA = this._initSegEdi('MOA', 1);
            this._setV(MOA, 101, '146');
            this._setV(MOA, 102, vMoney1);
            this._setV(MOA, 103, vCurrency);
        }

        // SG16 Group 16
        vParentLineNum = this._v('@parentLineNumber', nShipItem);
        if (vParentLineNum) {
            // RFF
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'LI');
            this._setV(LIN, 102, this._trimIntStr(vParentLineNum));
            this._setV(LIN, 104, this._v('@itemType', nShipItem));
        }
        // RFF ZZZ
        let nExtrinscs = this._es('Extrinsic', nShipItem);
        for (let e of nExtrinscs) {
            let vName = this._v('@name', e);
            if (arrDoneByFTX.includes(vName)) {
                continue;
            }
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ZZZ');
            this._setV(RFF, 102, vName);
            this._setV(RFF, 104, this._v('', e));
        }

        // SG20 Group 20 Batch
        let nBatch = this._e('Batch', nShipItem);
        if (nBatch) {
            this._SG20_Batch(nBatch);
        }
        // SG20 Group 20 ComponentConsumptionDetails
        let nComsumptionDetail = this._e('ComponentConsumptionDetails', nShipItem);
        if (nComsumptionDetail) {
            this._SG20_Consumption(nComsumptionDetail);
        }
        // // SG20 Group 20 Packaging
        // let nPacks 
        // this._SG20_Pac

    } // end shipItem

    private _SG20_Packaging(nPack: Element) {
        // PCI
        let nShippingMarks = this._es('ShippingMark', nPack);
        let idx: number = 1;
        let sNowMark: string = 'Mark' + this._iTraverseLevel;

        let vDispatchQ = this._v('DispatchQuantity/@quantity', nPack);
        if (nShippingMarks.length > 0) {
            for (let nMark of nShippingMarks) {
                sNowMark += this._v('', nMark);
            }
        }
        if (sNowMark != this._shippingMarkKey[this._iTraverseLevel]) {
            // PCI is necessary regardless of nShippingMarks.length
            for (let nMark of nShippingMarks) {
                let PCI;
                if (idx % 10 == 1) {
                    PCI = this._initSegEdi('PCI', 2);
                    this._setV(PCI, 1, '30');
                }
                let v = this._v('', nMark);
                this._setV(PCI, 2 * 100 + (idx % 10), v);
                sNowMark += v;
            }
            if (nShippingMarks.length <= 0) {
                let PCI = this._initSegEdi('PCI', 2);
                this._setV(PCI, 1, '30');
            }

            // DTM 361 BestBeforeDate
            let vBestBeforeDate = this._v('BestBeforeDate/@date', nPack);
            if (vBestBeforeDate) {
                let DTM = this._initSegEdi('DTM', 1);
                this._setV(DTM, 101, '361');
                this._setV(DTM, 102, Utils.dateStr102(vBestBeforeDate));
                this._setV(DTM, 103, '102');
            }

            // MEA
            let nDimensions = this._es('Dimension', nPack);
            for (let nDim of nDimensions) {
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
            } // end loop nDimensions

            // QTY
            let vDispatchQ = this._v('DispatchQuantity/@quantity', nPack);
            if (vDispatchQ) {
                let QTY = this._initSegEdi('QTY', 1);
                this._setV(QTY, 101, '52');
                this._setV(QTY, 102, vDispatchQ);
                this._setV(QTY, 103, this._v('DispatchQuantity/UnitOfMeasure', nPack));
            }
            this._shippingMarkKey[this._iTraverseLevel] = sNowMark; // save for next round comparison
        } else {
            // Mark is same as before
            // We don't create DTM QTY 
        }

        // SG21 Group 21
        // GIN
        let nContainerCodes = this._es('ShippingContainerSerialCode', nPack);
        idx = 1;
        for (let code of nContainerCodes) {
            let GIN;
            let iDig01 = idx % 10
            if (iDig01 == 1) {
                GIN = this._initSegEdi('GIN', 6);
                this._setV(GIN, 1, 'BJ'); // or AW ?
            }
            let iDig10 = (iDig01 + 1) / 2 + 1; // 1->2, 2->2 , 3->3, 4->3, 5->4, 6->4
            this._setV(GIN, iDig10 * 100 + (iDig01 - (iDig10 - 2) * 2)
                , this._v('', code));
        }
    } // end function _SG20_Packaging

    private _PIA(nShipItem: Element) {
        let arrPIA5 = [];
        let arrPIA1 = [];
        // set PIA array
        this._PIA_Val(arrPIA5, arrPIA1, nShipItem);
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
    private _pack(nPack: Element, iParentPackage: number, iTotalPacks?: number) {
        let nShippingMarks = this._es('ShippingMark', nPack);
        let sNowMark: string = 'Mark' + this._iTraverseLevel;
        if (nShippingMarks.length > 0) {
            for (let nMark of nShippingMarks) {
                sNowMark += this._v('', nMark);
            }
        }
        if (sNowMark != this._shippingMarkKey[this._iTraverseLevel]) {
            // @type = "Material" or "Package", according to PackagingLevelCode
            let vType = this._v('Description/@type', nPack);
            let CPS = this._initSegEdi('CPS', 3);
            this._setV(CPS, 1, this._iCPS.toString());
            this._iCPS++;
            // Hierarchical structure parent identifier to identify the next higher level 
            // in a hierarchical structure.
            // Should start at "1" 


            this._setV(CPS, 2, iParentPackage.toString());

            // TODO Packaging level, coded
            // Can be  "1", "3", "4".  Not mapped due to different usage.
            // if (this._iTraverseLevel) {
            //     this._setV(CPS, 3, (this._iTraverseLevel).toString());
            // }

            // PAC
            let PAC = this._initSegEdi('PAC', 3);
            // Number of packages
            // PAC01 the Package count under a CPS, it's very difficut to calculate
            // So I leave it to 1 because it fulfill most of the case
            this._setV(PAC, 1, '1');
            let vPackageTypeCodeIdentifierCode = this._v('PackageTypeCodeIdentifierCode', nPack);
            let vPackagingCode = this._v('PackagingCode', nPack);
            if (vPackagingCode) {
                let vMapped = this._mci(MAPS.mapPAC7065, vPackagingCode);
                if (vMapped) {
                    this._setV(PAC, 301, vMapped);
                } else {
                    this._setV(PAC, 304, vPackagingCode);
                }
            } else {
                this._setV(PAC, 301, vPackageTypeCodeIdentifierCode);
            }

            // MEA
            let nPackDims = this._es('Dimension', nPack);
            nPackDims = nPackDims ?? [];
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

            // QTY
            let vDispatchQ = this._v('DispatchQuantity/@quantity', nPack);
            if (vDispatchQ) {
                let QTY = this._initSegEdi('QTY', 1);
                this._setV(QTY, 101, '52');
                this._setV(QTY, 102, vDispatchQ);
                this._setV(QTY, 103, this._v('DispatchQuantity/UnitOfMeasure', nPack));
            }

            // SG13 Group 13
            // PCI
            let nShippingMarks = this._es('ShippingMark', nPack);
            let idx: number = 1;
            if (nShippingMarks.length > 0) {
                for (let nMark of nShippingMarks) {
                    let PCI;
                    if (idx % 10 == 1) {
                        PCI = this._initSegEdi('PCI', 2);
                        this._setV(PCI, 1, '30');
                    }
                    this._setV(PCI, 2 * 100 + (idx % 10), this._v('', nMark));
                }
            } else {
                // It's a pack before ShippmentItem, so we always create PCI for it
                let PCI = this._initSegEdi('PCI', 2);
                this._setV(PCI, 1, '30');
            }
            this._shippingMarkKey[this._iTraverseLevel] = sNowMark;
        } // end if sNowMark != this._shippingMarkKey

        // SG14 Group 14
        // GIN
        let nContainerCodes = this._es('ShippingContainerSerialCode', nPack);
        let idx = 1;
        for (let code of nContainerCodes) {
            let GIN;
            let iDig01 = idx % 10
            if (iDig01 == 1) {
                GIN = this._initSegEdi('GIN', 6);
                this._setV(GIN, 1, 'BJ'); // or AW ?
            }
            let iDig10 = (iDig01 + 1) / 2 + 1; // 1->2, 2->2 , 3->3, 4->3, 5->4, 6->4
            this._setV(GIN, iDig10 * 100 + (iDig01 - (iDig10 - 2) * 2)
                , this._v('', code));
        }
        // SG13 Group 13
        // PCI ZZZ
        // let PCI = this._initSegEdi('PCI', 1);
        // this._setV(PCI, 1, 'ZZZ');

        // SG14 Group 14
        // GIN ML
        let vGlobalIndividualAssetID = this._v('PackageID/GlobalIndividualAssetID', nPack);
        if (vGlobalIndividualAssetID) {
            let GIN = this._initSegEdi('GIN', 2);
            this._setV(GIN, 1, 'ML');
            this._setV(GIN, 201, vGlobalIndividualAssetID);
        }
    }
    private _PIA_Val(arrPIA5: any[], arrPIA1: any[], nShipItem: Element) {
        let vBuyerPartID = this._v('ItemID/BuyerPartID', nShipItem);
        if (vBuyerPartID) {
            arrPIA5.push([vBuyerPartID, 'BP']);
        }
        let vSupplierPartID = this._v('ItemID/SupplierPartID', nShipItem);
        if (vSupplierPartID) {
            arrPIA5.push([vSupplierPartID, 'VN']);
        }
        let vSupplierPartAuxiliaryID = this._v('ItemID/SupplierPartAuxiliaryID', nShipItem);
        if (vSupplierPartAuxiliaryID) {
            arrPIA5.push([vSupplierPartAuxiliaryID, 'VS']);
        }
        let vManufacturerPartID = this._v('ShipNoticeItemDetail/ManufacturerPartID', nShipItem);
        if (vManufacturerPartID) {
            arrPIA5.push([vManufacturerPartID, 'MF']);
        }
        let vCC = this._v('ShipNoticeItemDetail/Classification[@domain="UNSPSC"]/@code', nShipItem);
        if (vCC) {
            arrPIA1.push([vCC, 'CC']);
        }
        let vSupplierBatchID = this._v('SupplierBatchID', nShipItem);
        if (vSupplierBatchID) {
            arrPIA1.push([vSupplierBatchID, 'NB']);
        }
        let vSerialNumber = this._v('AssetInfo/@serialNumber', nShipItem);
        if (vSerialNumber) {
            arrPIA1.push([vSerialNumber, 'SN']);
        }
        let vEANID = this._v('ShipNoticeItemDetail/ItemDetailIndustry/ItemDetailRetail/EANID', nShipItem);
        if (vEANID) {
            arrPIA1.push([vEANID, 'EN']);
        }
        let vEuropeanWasteCatalogID = this._v('ShipNoticeItemDetail/ItemDetailIndustry/ItemDetailRetail/EuropeanWasteCatalogID', nShipItem);
        if (vEuropeanWasteCatalogID) {
            arrPIA1.push([vEuropeanWasteCatalogID, 'ZZZ']);
        }
        let vClassOfGoodsNational = this._v('Extrinsic [@name="ClassOfGoodsNational"]', nShipItem);
        if (vClassOfGoodsNational) {
            arrPIA1.push([vClassOfGoodsNational, 'GN']);
        }
        let vHarmonizedSystemID = this._v('HarmonizedSystemID', nShipItem);
        if (vHarmonizedSystemID) {
            arrPIA1.push([vHarmonizedSystemID, 'HS']);
        }
        let vProductIDUPC = this._v('ProductIDUPC', nShipItem);
        if (vProductIDUPC) {
            arrPIA1.push([vProductIDUPC, 'UP']);
        }
        let vPromotionDealID = this._v('ShipNoticeItemIndustry/ShipNoticeItemRetail/PromotionDealID', nShipItem);
        if (vPromotionDealID) {
            arrPIA1.push([vPromotionDealID, 'PV']);
        }
    }

    private _SG20_Consumption(nConsumptionDetail: Element) {
        // PCI
        let PCI = this._initSegEdi('PCI', 2);
        this._setV(PCI, 1, '4');
        this._setV(PCI, 201, this._v('@lineNumber', nConsumptionDetail));
        this._setV(PCI, 202, this._v('@type', nConsumptionDetail));
        this._setV(PCI, 203, this._v('@usage', nConsumptionDetail));
        // QTY
        let QTY = this._initSegEdi('QTY', 1);
        this._setV(QTY, 101, '12');
        this._setV(QTY, 102, this._v('@quantity', nConsumptionDetail));
        this._setV(QTY, 103, this._v('UnitOfMeasure', nConsumptionDetail));
        // SG21 Group 21
        // GIN AP        
        let arrGIN = [];
        let vBuyerPartID = this._v('Product/BuyerPartID', nConsumptionDetail);
        let vSupplierPartID = this._v('Product/SupplierPartID', nConsumptionDetail);
        let vSupplierPartAuxiliaryID = this._v('Product/SupplierPartAuxiliaryID', nConsumptionDetail);
        if (vBuyerPartID) {
            arrGIN.push([vBuyerPartID, 'BP']);
        }
        if (vSupplierPartID) {
            arrGIN.push([vSupplierPartID, 'VN']);
        }
        if (vSupplierPartAuxiliaryID) {
            arrGIN.push([vSupplierPartID, 'VS']);
        }
        let idx: number = 2;
        let GIN;
        for (let pair of arrGIN) {
            if (idx == 2) {
                GIN = this._initSegEdi('GIN', 1 + arrGIN.length);
                this._setV(GIN, 1, 'AP');
            }
            this._setV(GIN, idx * 100 + 1, pair[0]);
            this._setV(GIN, idx * 100 + 1, pair[1]);
            idx++
        }
        // GIN BX
        let arrGIN_Lines = [];
        let vBuyerBatchID = this._v('BuyerBatchID', nConsumptionDetail);
        let vSupplierBatchID = this._v('SupplierBatchID', nConsumptionDetail);
        if (vBuyerBatchID) {
            arrGIN_Lines.push([vBuyerBatchID, '92']);
        }
        if (vSupplierBatchID) {
            arrGIN_Lines.push([vSupplierBatchID, '91']);
        }
        if (arrGIN_Lines.length > 0) {
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

    }
    private _SG20_Batch(nBatch: Element) {

        // PCI
        let PCI = this._initSegEdi('PCI', 1);
        this._setV(PCI, 1, '10');

        // DTM 36 expirationDate
        let vExpDate = this._v('@expirationDate', nBatch);
        if (vExpDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '36');
            this._setV(DTM, 102, Utils.dateStr102(vExpDate));
            this._setV(DTM, 103, '102');
        }

        // DTM 94 productionDate
        let vProdDate = this._v('@productionDate', nBatch);
        if (vProdDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '94');
            this._setV(DTM, 102, Utils.dateStr102(vProdDate));
            this._setV(DTM, 103, '102');
        }
        // DTM 351 inspectionDate
        let vInspDate = this._v('@inspectionDate', nBatch);
        if (vInspDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '351');
            this._setV(DTM, 102, Utils.dateStr102(vInspDate));
            this._setV(DTM, 103, '102');
        }

        // QTY
        let vBatchQ = this._v('@batchQuantity', nBatch);
        if (vBatchQ) {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '12');
            this._setV(QTY, 102, vBatchQ);
        }

        // SG21 Group 21
        // GIN
        let vSupplierBatchID = this._v('SupplierBatchID', nBatch);
        let vBuyerBatchID = this._v('BuyerBatchID', nBatch);
        if (vSupplierBatchID || vBuyerBatchID) {
            let GIN;
            GIN = this._initSegEdi('GIN', 3);
            this._setV(GIN, 1, 'BX');
            let iEle = 2;
            if (vSupplierBatchID) {
                this._setV(GIN, iEle * 100 + 1, vSupplierBatchID);
                this._setV(GIN, iEle * 100 + 2, '91');
                iEle++;
            }
            if (vBuyerBatchID) {
                this._setV(GIN, iEle * 100 + 1, vBuyerBatchID);
                this._setV(GIN, iEle * 100 + 2, '92');
                iEle++;
            }
        }




    } // end function _SG20_Batch

    /**
     * Contact IdReference->RFF
     * use mapNAD1153
     * @param ct  Contact
     */
    private _IDRef(ct: Element) {
        let IdRefs = this._es('IdReference', ct);
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
            this._setV(NAD, 202, '160'); // Should be "160" or "ZZZ"
            if (this._mes(MAPS.mapNAD3055, sAddressIDDomain)) {
                this._setV(NAD, 203, this._mcs(MAPS.mapNAD3055, sAddressIDDomain));
            } else {
                this._setV(NAD, 203, '92');
            }
        } else {
            this._setV(NAD, 201, sMappedRole + ' ID');
            this._setV(NAD, 203, '9');
        }
        this._splitStr(NAD, sName, 3, 1, 5, 35);
        this._splitStr(NAD, sDeliverTo, 4, 1, 5, 35);
        this._splitStr(NAD, sStreet, 5, 1, 4, 35);
        this._setV(NAD, 6, sCity);
        if (this._mei(MAPS.mapNAD3229, sState)) {
            this._setV(NAD, 7, this._mci(MAPS.mapNAD3229, sState));
        } else {
            this._setV(NAD, 7, sState);
        }

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
        } else {
            this._setV(CTA, 201, 'Contact ID');
        }
        if (sName202) {
            this._setV(CTA, 202, sName202);
        } else {
            let vAddressName = this._v('@name', nAddress);
            if (vAddressName) {
                this._setV(CTA, 202, vAddressName);
            } else {
                this._setV(CTA, 202, 'Contact Name');
            }

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
     * SG1 should be header level, so use the first Portion to get data
     * @param nHeader 
     * @param nPortion 
     */
    private _SG1_RFF_DTM(nHeader: Element, nPortion: Element) {

        // RFF ON and DTM
        let sOrderID2 = this._v('OrderReference/@orderID', nPortion);
        let sOrderDate2 = this._v('OrderReference/@orderDate', nPortion);
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

        // RFF CT
        let sAgreementID = this._v('MasterAgreementInfo/@agreementID', nPortion);
        let sAgreementType = this._v('MasterAgreementInfo/@agreementType', nPortion);
        if (sAgreementID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'CT');
            this._setV(RFF, 102, sAgreementID);
            if (sAgreementType && sAgreementType == 'scheduling_agreement') {
                this._setV(RFF, 103, '1');
            }
            // DTM
            this._DTM_EDI(nPortion, 'MasterAgreementInfo/@agreementDate', '126');
        }

        // RFF IdReference
        let IdRefs = this._es('IdReference', nHeader);
        for (let idRef of IdRefs) {
            let sDomain = this._v('@domain', idRef);
            if (!this._mei(MAPS.mapRFF1153, sDomain)) {
                continue;
            }
            let RFF = this._initSegEdi('RFF', 1);
            let sIdent = this._v('@identifier', idRef);
            this._setV(RFF, 101, this._mci(MAPS.mapRFF1153, sDomain));
            this._setV(RFF, 102, sIdent);
        }

        // RFF AAN
        let sDeliverySheduleID = this._v('Extrinsic[@name="DeliverySheduleID"]', nHeader);
        this._RFF_KV_EDI('AAN', sDeliverySheduleID);
        // RFF DQ
        let sDeliveryNoteID = this._v('Extrinsic[@name="DeliveryNoteID"]', nHeader);
        this._RFF_KV_EDI('DQ', sDeliveryNoteID);
        // RFF IV
        let sInvoiceID = this._v('Extrinsic[@name="InvoiceID"]', nHeader);
        this._RFF_KV_EDI('IV', sInvoiceID);
        // RFF VN
        let sSupplierOrderID = this._v('Extrinsic[@name="SupplierOrderID"]', nHeader);
        this._RFF_KV_EDI('VN', sSupplierOrderID);
        // RFF CR
        let sCustomerReferenceID = this._v('IdReference[@domain="CustomerReferenceID"]/@identifier', nHeader);
        this._RFF_KV_EDI('CR', sCustomerReferenceID);
        // RFF UC
        let sUltimateCustomerReferenceID = this._v('IdReference[@domain="UltimateCustomerReferenceID"]/@identifier', nHeader);
        this._RFF_KV_EDI('CR', sUltimateCustomerReferenceID);
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
        "original": "9", // original
        "new": "9", // original
        "delete": "3", // delete
        "update": "4", // update        
    };
    static mapBGM4343: Object = {
        "actual": "AP", // actual
        "planned": "CA", // planned       
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
    static mapRFF1153: Object = {
        "governmentnumber": "GN", // governmentNumber
        "supplierreference": "AEU", // supplierReference
        "documentname": "DM", // documentName
    }
    static mapNAD3035: Object = {
        "administrator": "AM", // administrator
        "technicalsupport": "AT", // technicalSupport
        "buyermasteraccount": "BI", // buyerMasterAccount
        "billto": "BT", // billTo
        "buyer": "BY", // buyer
        "carriercorporate": "CA", // carrierCorporate
        "corporateoffice": "CO", // corporateOffice
        "correspondent": "DO", // correspondent
        "buyercorporate": "FD", // buyerCorporate
        "from": "FR", // from
        "issuerofinvoice": "II", // issuerOfInvoice
        //"buyer": "IV", // buyer
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
        "default": "ZZZ", // default
    };

    static mapNAD3055: Object = {
        "IATA": "3", // IATA
        "EANID": "9", // EANID
        "UIC": "12", // UIC
        "DUNS": "16", // DUNS
        "SellerAssigned": "91",
        "BuyerAssigned": "92",
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

    static mapTDT8179: Object = {
        "air": "6",
        "ship": "11",
        "rail": "23",
        "motor": "31",
    };

    static mapTDT3055: Object = {
        "IATA": "3",
        "EAN": "9",
        "UIC": "12",
        "DUNS": "16",
        "SCAC": "182",
    };

    static mapPAC7065: Object = {
        "drums, steel, non-removable head": "1A1", // Drums, steel, non-removable head
        "drums, steel, removable head": "1A2", // Drums, steel, removable head
        "drums, aluminium, non-removable head": "1B1", // Drums, aluminium, non-removable head
        "drums, aluminium, removable head": "1B2", // Drums, aluminium, removable head
        "drums, plywood": "1D", // Drums, plywood
        "drums, fibre": "1G", // Drums, fibre
        "drums, plastics, non-removable head": "1H1", // Drums, plastics, non-removable head
        "drums, plastics, removable head": "1H2", // Drums, plastics, removable head
        "barrels, wooden, bung type": "2C1", // Barrels, wooden, bung type
        "barrels, wooden, removable head": "2C2", // Barrels, wooden, removable head
        "jerricans, steel, non-removable head": "3A1", // Jerricans, steel, non-removable head
        "jerricans, steel, removable head": "3A2", // Jerricans, steel, removable head
        "jerricans, plastics, non-removable head": "3H1", // Jerricans, plastics, non-removable head
        "jerricans, plastics, removable head": "3H2", // Jerricans, plastics, removable head
        "boxes, steel": "4A", // Boxes, steel
        "boxes, aluminium": "4B", // Boxes, aluminium
        "boxes, natural wood, ordinary": "4C1", // Boxes, natural wood, ordinary
        "boxes, natural wood, with sift-proof walls": "4C2", // Boxes, natural wood, with sift-proof walls
        "boxes, plywood": "4D", // Boxes, plywood
        "boxes, reconstituted wood": "4F", // Boxes, reconstituted wood
        "boxes, fibreboard": "4G", // Boxes, fibreboard
        "boxes, plastics, expanded": "4H1", // Boxes, plastics, expanded
        "boxes, plastics, solid": "4H2", // Boxes, plastics, solid
        "bags, woven plastics, without inner liner or coating": "5H1", // Bags, woven plastics, without inner liner or coating
        "bags, woven plastics, sift-proof": "5H2", // Bags, woven plastics, sift-proof
        "bags, woven plastics, water resistant": "5H3", // Bags, woven plastics, water resistant
        "bags, plastics film": "5H4", // Bags, plastics film
        "bags, textile, without inner liner or coating": "5L1", // Bags, textile, without inner liner or coating
        "bags, textile, sift-proof": "5L2", // Bags, textile, sift-proof
        "bags, textile, water resistant": "5L3", // Bags, textile, water resistant
        "bags, paper, multiwall": "5M1", // Bags, paper, multiwall
        "bags, paper, multiwall, water resistant": "5M2", // Bags, paper, multiwall, water resistant
        "composite packagings, plastics receptacle, in steel": "6HA", // Composite packagings, plastics receptacle, in steel
        "composite packagings, plastics receptacle, in": "6HB", // Composite packagings, plastics receptacle, in
        "composite packagings, plastics receptacle, wooden box": "6HC", // Composite packagings, plastics receptacle, wooden box
        // "composite packagings, plastics receptacle, in": "6HD", // Composite packagings, plastics receptacle, in
        "composite packagings, plastics receptacle, in fibre": "6HG", // Composite packagings, plastics receptacle, in fibre
        // "composite packagings, plastics receptacle, in": "6HH", // Composite packagings, plastics receptacle, in
        "composite packagings, plastics receptacle, in solid": "6HH", // Composite packagings, plastics receptacle, in solid
        "composite packagings, glass, porcelain or stoneware": "6PA", // Composite packagings, glass, porcelain or stoneware
        // "composite packagings, glass, porcelain or stoneware": "6PB", // Composite packagings, glass, porcelain or stoneware
        // "composite packagings, glass, porcelain or stoneware": "6PC", // Composite packagings, glass, porcelain or stoneware
        // "composite packagings, glass, porcelain or stoneware": "6PD", // Composite packagings, glass, porcelain or stoneware
        // "composite packagings, glass, porcelain or stoneware": "6PG", // Composite packagings, glass, porcelain or stoneware
        // "composite packagings, glass, porcelain or stoneware": "6PH", // Composite packagings, glass, porcelain or stoneware
        "aerosol": "AE", // Aerosol
        "ampoule, non-protected": "AM", // Ampoule, non-protected
        "ampoule, protected": "AP", // Ampoule, protected
        "atomizer": "AT", // Atomizer
        "barrel": "BA", // Barrel
        "bobbin": "BB", // Bobbin
        "bottlecrate, bottlerack": "BC", // Bottlecrate, bottlerack
        "board": "BD", // Board
        "bundle": "BE", // Bundle
        "balloon, non-protected": "BF", // Balloon, non-protected
        "bag": "BG", // Bag
        "bunch": "BH", // Bunch
        "bin": "BI", // Bin
        "bucket": "BJ", // Bucket
        "basket": "BK", // Basket
        "bale, compressed": "BL", // Bale, compressed
        "bale, non-compressed": "BN", // Bale, non-compressed
        "bottle, non-protected, cylindrica": "BO", // Bottle, non-protected, cylindrica
        "balloon, protected": "BP", // Balloon, protected
        "bottle, protected cylindrical": "BQ", // Bottle, protected cylindrical
        "bar": "BR", // Bar
        "bottle, non-protected, bulbous": "BS", // Bottle, non-protected, bulbous
        "bolt": "BT", // Bolt
        "butt": "BU", // Butt
        "bottle, protected bulbous": "BV", // Bottle, protected bulbous
        "box": "BX", // Box
        "board, in bundle/bunch/truss": "BY", // Board, in bundle/bunch/truss
        "bars, in bundle/bunch/truss": "BZ", // Bars, in bundle/bunch/truss
        "can, rectangular": "CA", // Can, rectangular
        "beer crate": "CB", // Beer crate
        "churn": "CC", // Churn
        "creel": "CE", // Creel
        "coffer": "CF", // Coffer
        "cage": "CG", // Cage
        "chest": "CH", // Chest
        "canister": "CI", // Canister
        "coffin": "CJ", // Coffin
        "cask": "CK", // Cask
        "coil": "CL", // Coil
        "carboy, non-protected": "CO", // Carboy, non-protected
        "carboy, protected": "CP", // Carboy, protected
        "crate": "CR", // Crate
        "case": "CS", // Case
        "carton": "CT", // Carton
        "cup": "CU", // Cup
        "cover": "CV", // Cover
        "can, cylindrical": "CX", // Can, cylindrical
        "cylinder": "CY", // Cylinder
        "canvas": "CZ", // Canvas
        "demijohn, non-protected": "DJ", // Demijohn, non-protected
        "demijohn, protected": "DP", // Demijohn, protected
        "drum": "DR", // Drum
        "envelope": "EN", // Envelope
        "fruit crate": "FC", // Fruit crate
        "framed crate": "FD", // Framed crate
        "firkin": "FI", // Firkin
        "flask": "FL", // Flask
        "footlocker": "FO", // Footlocker
        "filmpack": "FP", // Filmpack
        "frame": "FR", // Frame
        "gas bottle": "GB", // Gas bottle
        "girder": "GI", // Girder
        "girders, in bundle/bunch/truss": "GZ", // Girders, in bundle/bunch/truss
        "hogshead": "HG", // Hogshead
        "hamper": "HR", // Hamper
        "ingot": "IN", // Ingot
        "ingots, in bundle/bunch/truss": "IZ", // Ingots, in bundle/bunch/truss
        "jerrican, rectangular": "JC", // Jerrican, rectangular
        "jug": "JG", // Jug
        "jar": "JR", // Jar
        "jutebag": "JT", // Jutebag
        "jerrican, cylindrical": "JY", // Jerrican, cylindrical
        "keg": "KG", // Keg
        "log": "LG", // Log
        "logs, in bundle/bunch/truss": "LZ", // Logs, in bundle/bunch/truss
        "multiply bag": "MB", // Multiply bag
        "milk crate": "MC", // Milk crate
        "multiwall sack": "MS", // Multiwall sack
        "mat": "MT", // Mat
        "match box": "MX", // Match box
        "unpacked or unpackaged": "NE", // Unpacked or unpackaged
        "nest": "NS", // Nest
        "net": "NT", // Net
        "packet": "PA", // Packet
        "parcel": "PC", // Parcel
        "plate": "PG", // Plate
        "pitcher": "PH", // Pitcher
        "pipe": "PI", // Pipe
        "package": "PK", // Package
        "pail": "PL", // Pail
        "plank": "PN", // Plank
        "pouch": "PO", // Pouch
        "pot": "PT", // Pot
        "tray": "PU", // Tray
        "tray pack": "PU", // Tray pack
        "plates, in bundle/bunch/truss": "PY", // Plates, in bundle/bunch/truss
        "pipes, in bundle/bunch/truss": "PZ", // Pipes, in bundle/bunch/truss
        "planks, in bundle/bunch/truss": "PZ", // Planks, in bundle/bunch/truss
        "rod": "RD", // Rod
        "ring": "RG", // Ring
        "reel": "RL", // Reel
        "roll": "RO", // Roll
        "rednet": "RT", // Rednet
        "rods, in bundle/bunch/truss": "RZ", // Rods, in bundle/bunch/truss
        "sack": "SA", // Sack
        "shallow crate": "SC", // Shallow crate
        "spindle": "SD", // Spindle
        "sea-chest": "SE", // Sea-chest
        "sachet": "SH", // Sachet
        "skeleton case": "SK", // Skeleton case
        "slipsheet": "SL", // Slipsheet
        "sheetmetal": "SM", // Sheetmetal
        "sheet": "ST", // Sheet
        "suitcase": "SU", // Suitcase
        "shrinkwrapped": "SW", // Shrinkwrapped
        "sheets, in bundle/bunch/truss": "SZ", // Sheets, in bundle/bunch/truss
        "tub": "TB", // Tub
        "tea-chest": "TC", // Tea-chest
        "collapsible tube": "TD", // Collapsible tube
        "tube, collapsible": "TD", // Tube, collapsible
        "tank, rectangular": "TK", // Tank, rectangular
        "tin": "TN", // Tin
        "tun": "TO", // Tun
        "trunk": "TR", // Trunk
        "truss": "TS", // Truss
        "tube": "TU", // Tube
        "tank, cylindrical": "TY", // Tank, cylindrical
        "tubes, in bundle/bunch/truss": "TZ", // Tubes, in bundle/bunch/truss
        "vat": "VA", // Vat
        "bulk, gas (at 1031 mbar and 15/c)": "VG", // Bulk, gas (at 1031 mbar and 15/C)
        "vial": "VI", // Vial
        "bulk, liquid": "VL", // Bulk, liquid
        "bulk, solid, large particles (nodules)": "VO", // Bulk, solid, large particles (nodules)
        "vacuumpacked": "VP", // Vacuumpacked
        "bulk, liquefied gas (at abnormal temperature/pressure)": "VQ", // Bulk, liquefied gas (at abnormal temperature/pressure)
        "bulk, solid, granular particles (grains)": "VR", // Bulk, solid, granular particles (grains)
        "bulk, solid, fine particles (powders)": "VY", // Bulk, solid, fine particles (powders)
        "wickerbottle": "WB", // Wickerbottle        
    }

    static mapIMD7081: Object = {
        "quality": "13",
        "grade": "38",
        "color": "35",
        "size": "98",
    }


    // =========================
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

    static mapTOD4055: Object = {
        "pricecondition": "1", // PriceCondition
        "price condition": "1", // PriceCondition
        "despatchcondition": "2", // DespatchCondition
        "despatch condition": "2", // DespatchCondition
        "priceanddespatchcondition": "3", // PriceAndDespatchCondition
        "price and despatch condition": "3", // PriceAndDespatchCondition
        "collectedbycustomer": "4", // CollectedByCustomer
        "collected by customer": "4", // CollectedByCustomer
        "transportcondition": "5", // TransportCondition
        "transport condition": "5", // TransportCondition
        "deliverycondition": "6", // DeliveryCondition
        "delivery condition": "6", // DeliveryCondition
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


    static mapPAC7075: Object = {
        "inner": "1", // inner
        "intermediate": "2", // intermediate
        "outer": "3", // outer
    }
}