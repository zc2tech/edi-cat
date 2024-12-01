import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_810 } from "../../info/info_810";
import { ConvertPattern, X12, XML, versionKeys } from "../../cat_const";
import { create, fragment } from "xmlbuilder2";
import { format } from "date-fns";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { ConvertErr, EdiSegment, EdiType } from "../../new_parser/entities";
import { ConverterBase, MAPStoXML } from "../converterBase";
import { ASTNode } from "../../new_parser/syntaxParserBase";
import { CUtilEDI } from "../../utils/cUtilEDIFACT";
import { XMLBuilderImpl } from "xmlbuilder2/lib/builder";
import { select, select1 } from 'xpath'
import { TidyAddress, TidyContact, TidyItemDetailRetail, TidyItemID, TidyModification, TidyProduct } from "../xmlTidy/TidyCommon";
import { TidyBatch, TidyComponentConsumptionDetails, TidyPackaging, TidyShipControl, TidyShipNoticeHeader, TidyShipNoticeItem, TidyShipNoticeItemDetail, TidyShipNoticeItemRetail, TidyShipNoticePortion, TidyTermsOfDelivery, TidyTermsOfTransport } from "../xmlTidy/ShipNotice";
import { validateHeaderName } from "http";


class ShipPackaging {
    static gMap: { [key: string]: ShipPackaging } = {};
    static currID: string; // the latest sID before entering LIN, help to reverse back to parents
    public sID: string;
    public sParentID: string;
    public sCode = ''; // Pallet, BX, CT,  
    public tPackaging: TidyPackaging;
    public children: ShipPackaging[] = [];

    static clearGMap() {
        ShipPackaging.gMap = {};
    }
}

/**
 * No need to make singleton because parserUtil already assured it
 */
export class Cvt_DESADV_ShipNotice extends ConverterBase {
    protected _mapPortion: { [key: string]: TidyShipNoticePortion } = {};
    // after created ShipNoticeItem, we need to assign it to a ShipNoticePortion
    // this is the one to add
    protected _fixToPortion: TidyShipNoticePortion;
    constructor(astTree: ASTNode) {
        super(astTree);
    }

    /**
     * Can be invoked internally or from outside
     */
    public toXMLCheck(document?: vscode.TextDocument): vscode.Diagnostic[] {
        this._document = document;
        this._clearDiags(); // clear previouse check results
        let bHeader_RFF_ON_exist = false;
        let SG1s = this._rGrps('SG1');
        SG1s = SG1s ?? [];
        for (let SG1 of SG1s) {
            // SG1 items
            // SG1 RFF
            let RFFs = this._dSegs(SG1, 'RFF');
            RFFs = RFFs ?? [];
            for (let RFF of RFFs) {
                let v101 = this._segVal(RFF, 101);
                let v102 = this._segVal(RFF, 102);
                let v103 = this._segVal(RFF, 103);
                if (v101 == 'ON' && v102) {
                    bHeader_RFF_ON_exist = true;
                }
            }
        }

        let SG10s = this._rGrps('SG10');
        SG10s = SG10s ?? [];
        for (let SG10 of SG10s) {
            // SG15
            let SG15s = this._dGrps(SG10, 'SG15');
            SG15s = SG15s ?? [];
            for (let SG15 of SG15s) {
                let bSG15PO = false;
                let SG16s = this._dGrps(SG15, 'SG16');
                for (let SG16 of SG16s) {
                    if (!bHeader_RFF_ON_exist) {
                        // only when header PO info not exist, we try to find in Group15
                        let RFF = this._segByEleVal(SG16, 'RFF', 101, 'ON');
                        if (this._segVal(RFF, 102)) {
                            bSG15PO = true;
                        }
                    } // end if !bHeader_RFF_ON_exist
                }// end loop Sg16s

                if (!bHeader_RFF_ON_exist && !bSG15PO) {
                    this._addCvtDiagHeader(`NO PO info found in Header or SG15 ${SG15.idxInSibling}`)
                }
            } // end loop SG15s
        }
        return this._cvtDiags;
    }

    /**
     * Usually, it's invoked by ConversionCommand.
     * and since diagnotics usually is enabled, maybe we don't need to invoke toXMLCheck??
     * 
     * @returns 
     * 
     */
    public toXML(): string {
        this.toXMLCheck(); // don't care error position, so no 'document' parameter
        if (this._hasConvertErr()) {
            return this._renderConvertErr();
        }
        ShipPackaging.clearGMap();
        this._mapPortion = {};

        const cxml = create({ encoding: "utf-8" }).ele('cXML').dtd({
            sysID: 'http://xml.cxml.org/schemas/cXML/1.2.061/Fulfill.dtd'
        });

        // header supplier2buyer
        this._header_supplier_to_buyer(cxml);

        let request = cxml.ele(XML.Request);

        let tShipHeader = new TidyShipNoticeHeader();
        // UNB
        let UNB = this._rseg('UNB');
        let testIndicator = this._segVal(UNB, 11);
        request.att(XML.deploymentMode, CUtilEDI.testIndicatorXML(testIndicator));

        // BGM
        let BGM = this._rseg("BGM");
        let vBGM3 = this._segVal(BGM, 3);
        let vBGM4 = this._segVal(BGM, 4);
        let sShipmentID = this._segVal(BGM, 2);
        if (vBGM3 == '3') {
            // delete/cancel
            sShipmentID = sShipmentID + '_1';
        }
        tShipHeader.att('shipmentID', sShipmentID);
        tShipHeader.att('operation', this._mcs(MAPS.mapBGM1225, vBGM3));
        tShipHeader.att('shipmentType', this._mcs(MAPS.mapBGM4343, vBGM4));
        tShipHeader.att('fulfillmentType', this._segVal(BGM, 104));

        // DTM
        let DTMs = this._rSegs("DTM");
        DTMs = DTMs ?? [];
        for (let DTM of DTMs) {
            let vDTM101 = this._segVal(DTM, 101);
            let vDTM102 = this._segVal(DTM, 102);
            let vDTM103 = this._segVal(DTM, 103);
            switch (vDTM101) {
                case '11':
                    tShipHeader.att('shipmentDate',
                        Utils.dateStrFromDTM2(vDTM102, vDTM103));
                    break;
                case '17':
                    tShipHeader.att('deliveryDate',
                        Utils.dateStrFromDTM2(vDTM102, vDTM103));
                    break;
                case '124':
                case '137':
                    tShipHeader.att('noticeDate',
                        Utils.dateStrFromDTM2(vDTM102, vDTM103));
                    break;
                case '2':
                    tShipHeader.att('requestedDeliveryDate',
                        Utils.dateStrFromDTM2(vDTM102, vDTM103));
                    break;
                case '200':
                    tShipHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'PickUpDate')
                        .txt(Utils.dateStrFromDTM2(vDTM102, vDTM103));
                    break;
                case '':
                    break;
            } // end switch vDTM101
        } // end loop DTMs


        // MEA
        let MEAs = this._rSegs("MEA");
        MEAs = MEAs ?? [];
        let tPackaging = new TidyPackaging();
        for (let MEA of MEAs) {
            let vMEA1 = this._segVal(MEA, 1);
            if (vMEA1 != 'AAE') {
                continue;
            }
            let eDim = tPackaging.Dimension.ele('Dimension');
            let vMEA201 = this._segVal(MEA, 201);
            let vMEA301 = this._segVal(MEA, 301);
            let vMEA302 = this._segVal(MEA, 302);
            eDim.att(XML.quantity, vMEA302);
            eDim.att('type', this._mcs(MAPS.mapMEA6313, vMEA201));
            eDim.ele(XML.UnitOfMeasure).txt(vMEA301);

        }
        if (!tPackaging.isEmpty()) {
            tPackaging.sendTo(tShipHeader.Packaging.ele('Packaging'));
        }

        // SG1 Group1
        // Group1 RFF+ON should create only 1 <ShipNoticePortion> per <ShipNoticeRequest>
        // Otherwise map from Line Item Group10/15/16 RFF+ON/DTM+4 for multiple occurencies.
        let tHeaderPortion = new TidyShipNoticePortion();
        let SG1s = this._rGrps('SG1');
        SG1s = SG1s ?? [];
        for (let SG1 of SG1s) {
            // SG1 items
            this._SG1(SG1, tShipHeader, tHeaderPortion);
        }

        let tTOD = new TidyTermsOfDelivery();
        // SG2 Group2
        let SG2s = this._rGrps('SG2');
        SG2s = SG2s ?? [];
        for (let SG2 of SG2s) {
            // SG1 items
            this._SG2(SG2, tShipHeader, tTOD);
        }

        // SG5 Group5
        let SG5s = this._rGrps('SG5');
        SG5s = SG5s ?? [];
        for (let SG5 of SG5s) {
            this._SG5(SG5, tShipHeader, tTOD);
        }

        // SG6 Group6
        let tControl = new TidyShipControl();
        let SG6s = this._rGrps('SG6');
        SG6s = SG6s ?? [];
        for (let SG6 of SG6s) {
            this._SG6(SG6, tShipHeader, tControl);
        }

        // SG8 Group8
        let tTOT = new TidyTermsOfTransport();
        let SG8s = this._rGrps('SG8');
        SG8s = SG8s ?? [];
        for (let SG8 of SG8s) {
            this._SG8(SG8, tShipHeader, tTOT);
        }

        // SG10 Group10
        let rootShipPackaging = new ShipPackaging();
        rootShipPackaging.sID = '1';

        let SG10s = this._rGrps('SG10');
        SG10s = SG10s ?? [];
        for (let SG10 of SG10s) {
            let CPS = this._dSeg1(SG10, 'CPS');
            let vCPS1 = this._segVal(CPS, 1);
            let vCPS2 = this._segVal(CPS, 2);
            ShipPackaging.currID = vCPS1;
            if (vCPS1 == '1') {
                this._SG10A(SG10, tShipHeader);
            } else {
                // CPS1 >= 2
                let nShipPackaging = new ShipPackaging();
                nShipPackaging.sID = vCPS1;
                nShipPackaging.sParentID = vCPS2;
                ShipPackaging.gMap[vCPS1] = nShipPackaging;
                let tPackaging = new TidyPackaging();
                nShipPackaging.tPackaging = tPackaging;
                let nParent = ShipPackaging.gMap[nShipPackaging.sParentID];
                if (nParent) {
                    nParent.children.push(nShipPackaging);
                } else {
                    rootShipPackaging.children.push(nShipPackaging);
                }

                this._SG10B(SG10, tShipHeader, tPackaging);
            }
        }

        // SG15 Group15
        for (let SG10 of SG10s) {
            // SG15
            let SG15s = this._dGrps(SG10, 'SG15');
            SG15s = SG15s ?? [];
            for (let SG15 of SG15s) {
                let tItem = this._SG10_SG15(SG15, tHeaderPortion);
                // this._fixToPortion is continuously changing based on RFF+ON
                tItem.sendTo(this._fixToPortion.ShipNoticeItem.ele('ShipNoticeItem'))
            }
        }

        let eShipNoticeRequest = request.ele('ShipNoticeRequest');
        tTOD.sendTo(tShipHeader.TermsOfDelivery.ele('TermsOfDelivery'));
        if (!tTOT.isEmpty()) {
            tTOT.sendTo(tShipHeader.TermsOfTransport.ele('TermsOfTransport'));
        }

        tShipHeader.sendTo(eShipNoticeRequest.ele('ShipNoticeHeader'));
        if (!tControl.isEmpty()) {
            tControl.sendTo(eShipNoticeRequest.ele('ShipControl'));
        }

        for (let k in this._mapPortion) {
            let tPortioin = this._mapPortion[k];
            tPortioin.sendTo(eShipNoticeRequest.ele('ShipNoticePortion'));
        }

        const xml = cxml.end({ prettyPrint: true, indent: '    ', spaceBeforeSlash: false });
        return this._adjustXmlforCIG(xml);
    } // end function toXML

    /**
     * 
     * @param SG15 
     * @param tHeaderPortion May not use this if we find RFF+ON internally
     */
    private _SG10_SG15(SG15: ASTNode, tHeaderPortion: TidyShipNoticePortion): TidyShipNoticeItem {
        let tItem = new TidyShipNoticeItem();
        // LIN
        let LIN = this._dSeg1(SG15, 'LIN');
        tItem.att('shipNoticeLineNumber', this._segVal(LIN, 1));
        if (this._segVal(LIN, 302) == 'PL') {
            tItem.att('lineNumber', this._segVal(LIN, 301));
        }
        if (this._segVal(LIN, 401) == '1') {
            tItem.att('parentLineNumber', this._segVal(LIN, 402));
        }

        let tDetailRetail = new TidyItemDetailRetail();
        // PIA
        let PIAs = this._dSegs(SG15, 'PIA');
        PIAs = PIAs ?? [];
        let tItemDetail = new TidyShipNoticeItemDetail();
        let tItemRetail = new TidyShipNoticeItemRetail();
        let tItemID = new TidyItemID();
        for (let PIA of PIAs) {

            let vPIA4347 = this._segVal(PIA, 1);

            for (let i = 2; i <= 6; i++) {
                let vPIA7140 = this._segVal(PIA, i * 100 + 1);
                let vPIA7143 = this._segVal(PIA, i * 100 + 2);
                let vPIA3055 = this._segVal(PIA, i * 100 + 4);

                if (vPIA4347 == '5') {
                    switch (vPIA7143) {
                        case 'BP':
                            tItemID.BuyerPartID.ele('BuyerPartID').txt(vPIA7140);
                            break;
                        case 'VN':
                            tItemID.SupplierPartID.ele('SupplierPartID').txt(vPIA7140);
                            break;
                        case 'VS':
                            tItemID.SupplierPartAuxiliaryID.ele('SupplierPartAuxiliaryID').txt(vPIA7140);
                            break;
                        case 'MF':
                            tItemDetail.ManufacturerName.ele('ManufacturerPartID')
                                .txt(vPIA7140);
                            break;
                    }
                } else if (vPIA4347 == '1') {
                    switch (vPIA7143) {
                        case 'CC':
                            tItemDetail.Classification.ele('Classification')
                                .att(XML.domain, 'UNSPSC').att('code', vPIA7140);
                            break;
                        case 'NB':
                            tItem.SupplierBatchID.ele('SupplierBatchID').txt(vPIA7140);
                            break;
                        case 'SN':
                            tItem.AssetInfo.ele('AssetInfo').att('serialNumber', vPIA7140);
                            break;
                        case 'EN':
                            tDetailRetail.EANID.ele('EANID').txt(vPIA7140);
                            break;
                        case 'ZZZ':
                            tDetailRetail.EuropeanWasteCatalogID.ele('EuropeanWasteCatalogID').txt(vPIA7140);
                            break;
                        case 'GN':
                            tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'ClassOfGoodsNational').txt(vPIA7140);
                            break;
                        case 'HS':
                            tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'HarmonizedSystemID').txt(vPIA7140);
                            break;
                        case 'UP':
                            tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'ProductIDUPC').txt(vPIA7140);
                            break;
                        case 'PV':
                            tItemRetail.PromotionDealID.ele('PromotionDealID').txt(vPIA7140);
                            break;
                    }
                } // end ifelse for vPIA4347

            } // end loop i

        } // end loop PIAs

        // IMD

        let IMDs = this._dSegs(SG15, 'IMD');
        IMDs = IMDs ?? [];
        let sShortName = '';
        let sShortNameLang = 'en';
        let sDescription = '';
        let sDescriptionLang = 'en';
        for (let IMD of IMDs) {
            let vIMD1 = this._segVal(IMD, 1);
            let vIMD2 = this._segVal(IMD, 2);
            let vIMD301 = this._segVal(IMD, 301);
            let vIMD304 = this._segVal(IMD, 304);
            let vIMD305 = this._segVal(IMD, 305);
            let vIMD306 = this._segVal(IMD, 306);
            switch (vIMD1) {
                case 'E':
                    sShortName = sShortName + vIMD301 + vIMD304 + vIMD305;
                    sShortNameLang = vIMD306 ? vIMD306 : 'en';
                    break;
                case 'F':
                    sDescription = sDescription + vIMD304 + vIMD305;
                    sDescriptionLang = vIMD306 ? vIMD306 : 'en';
                    break;
                case 'B':
                    if (!vIMD301) {
                        let eChar = tDetailRetail.Characteristic.ele('Characteristic')
                        eChar.att(XML.domain, this._mcs(MAPS.mapIMD7081, vIMD2));
                        eChar.att('value', vIMD304);
                    } else if (vIMD301 == 'ACA') {
                        if (vIMD304) {
                            tItemDetail.Classification.ele('Classification').att(XML.domain, vIMD304)
                                .txt(vIMD305);
                        } else {
                            tItemDetail.Classification.ele('Classification').att(XML.domain, 'NotAvailable')
                                .txt(vIMD305);
                        }
                    }

                    break;
            } // end switch vIMD1            
        } // end loop IMDs

        // output concatenated string
        if (sDescription || sShortName) {
            let eDesc = tItemDetail.Description.ele(XML.Description).txt(sDescription).att(XML.lang, sDescriptionLang);
            if (sShortName) {
                eDesc.ele('ShortName').txt(sShortName);
            }
        }

        // MEA
        let MEAs = this._dSegs(SG15, 'MEA');
        MEAs = MEAs ?? [];
        for (let MEA of MEAs) {
            let vMEA1 = this._segVal(MEA, 1);
            let vMEA201 = this._segVal(MEA, 201);
            let vMEA301 = this._segVal(MEA, 301);
            let vMEA302 = this._segVal(MEA, 302);
            if (vMEA1 == 'AAE') {
                tItemDetail.Dimension.ele('Dimension').att(XML.quantity, vMEA302)
                    .att('type', this._mcs(MAPS.mapMEA6313, vMEA201))
                    .ele(XML.UnitOfMeasure).txt(vMEA301);
            }
        }

        // QTY
        // Attention, later step - conditional double map to <Packaging>
        // Please refer to sheet [MAP SEQUENCE 4.2].
        let renderObjID = ShipPackaging.currID;
        let arrRenderIDs: string[] = [];
        while (renderObjID != '1') {
            arrRenderIDs.push(renderObjID);
            let shipPack = ShipPackaging.gMap[renderObjID];
            renderObjID = shipPack.sParentID;
        }
        arrRenderIDs = arrRenderIDs.reverse(); // we need to render with Order: Pallet, Box, Carton
        let lastParentID: string;
        for (let shipID of arrRenderIDs) {
            let shipPack = ShipPackaging.gMap[shipID];
            shipPack.tPackaging.Description.ele(XML.Description).att(XML.type, 'Packaging').att(XML.lang, 'en-US');
            if (lastParentID) {
                let nSerialCode = this._chd(ShipPackaging.gMap[lastParentID].tPackaging.ShippingContainerSerialCode, 'ShippingContainerSerialCode');
                // shipPack.tPackaging.ShippingContainerSerialCodeReference.ele('ShippingContainerSerialCodeReference')
                // .txt(ShipPackaging.gMap[lastParentID].tPackaging.ShippingContainerSerialCode);
                1 + 1;

            }
            shipPack.tPackaging.sendTo(tItem.Packaging.ele('Packaging'));
            lastParentID = shipID;
        }

        // Item Level Packaging
        let tPackaging = new TidyPackaging();
        let QTYs = this._dSegs(SG15, 'QTY');
        QTYs = QTYs ?? [];
        for (let QTY of QTYs) {
            let vQTY101 = this._segVal(QTY, 101);
            let vQTY102 = this._segVal(QTY, 102);
            let vQTY103 = this._segVal(QTY, 103);
            vQTY103 = vQTY103 ? vQTY103 : 'EA';
            switch (vQTY101) {
                case '12':
                    tItem.att(XML.quantity, vQTY102).UnitOfMeasure.ele(XML.UnitOfMeasure)
                        .txt(vQTY103);
                    tItemDetail.UnitOfMeasure.ele(XML.UnitOfMeasure).txt(vQTY103);
                    break;
                case '21':
                    let eQuantity = tItem.OrderedQuantity.ele('OrderedQuantity');
                    eQuantity.att('quantity', vQTY102);
                    eQuantity.ele(XML.UnitOfMeasure).txt(vQTY103);

                    break;
                case '192':
                    let eQuan192 = tItemRetail.FreeGoodsQuantity.ele('FreeGoodsQuantity');
                    eQuan192.att('quantity', vQTY102);
                    eQuan192.ele(XML.UnitOfMeasure).txt(vQTY103);

                    break;
            } // end switch vQTY101
        } // end loop QTYs

        // GIR
        let GIRs = this._dSegs(SG15, 'GIR');
        GIRs = GIRs ?? [];
        for (let GIR of GIRs) {
            let vGIR1 = this._segVal(GIR, 1);
            if (vGIR1 != '1') {
                continue;
            }
            let vGIR201 = this._segVal(GIR, 201);
            let vGIR202 = this._segVal(GIR, 202);
            let vGIR301 = this._segVal(GIR, 301);
            let vGIR302 = this._segVal(GIR, 302);
            let vGIR401 = this._segVal(GIR, 401);
            let vGIR501 = this._segVal(GIR, 501);
            let vGIR601 = this._segVal(GIR, 601);
            switch (vGIR202) {
                case 'AN':
                    tItemDetail.ManufacturerName.ele('ManufacturerName')
                        .txt([vGIR201, vGIR301, vGIR401, vGIR501, vGIR601].join(' ').trim());
                    break;
                case 'AP':
                    tItem.AssetInfo.ele('AssetInfo').att('tagNumber', vGIR201);
                    break;
                case 'BN':
                    tItem.AssetInfo.ele('AssetInfo').att('serialNumber', vGIR201);
                    break;
            };
            switch (vGIR302) {
                // case 'AN':
                //     tItemDetail.ManufacturerName.ele('ManufacturerName')
                //     .txt(vGIR201 + vGIR301 + vGIR401 + vGIR501 + vGIR601);
                //     break;
                case 'AP':
                    tItem.AssetInfo.ele('AssetInfo').att('tagNumber', vGIR301);
                    break;
                case 'BN':
                    tItem.AssetInfo.ele('AssetInfo').att('serialNumber', vGIR301);
                    break;
            };

        } // end loop GIRs

        // DTM
        let DTMs = this._dSegs(SG15, 'DTM');
        DTMs = DTMs ?? [];
        for (let DTM of DTMs) {
            let vDTM101 = this._segVal(DTM, 101);
            let vDTM102 = this._segVal(DTM, 102);
            let vDTM103 = this._segVal(DTM, 103);
            let sDate = Utils.dateStrFromDTM2(vDTM102, vDTM103);
            switch (vDTM101) {
                case '36':
                    tItemRetail.ExpiryDate.ele('ExpiryDate').att('date', sDate);
                    break;
                case '361':
                    tItemRetail.ExpiryDate.ele('BestBeforeDate').att('date', sDate);
                    break;
            } // end switch
        } // end loop DTMs

        // FTX
        let FTXs = this._dSegs(SG15, 'FTX');
        FTXs = FTXs ?? [];
        for (let FTX of FTXs) {
            let vFTX1 = this._segVal(FTX, 1);
            let vFTX401 = this._segVal(FTX, 401);
            switch (vFTX1) {
                case 'AAI':
                    tItem.Comments.ele('Comments').att(XML.lang, this._segVal(FTX, 5)).att('type', this._segVal(FTX, 401))
                        .txt(this._segVal(FTX, 402) + this._segVal(FTX, 403) + this._segVal(FTX, 404) + this._segVal(FTX, 405));

                    break;
                case 'ZZZ':
                    let sName = vFTX401;
                    let sValue = [this._segVal(FTX, 402), this._segVal(FTX, 403), this._segVal(FTX, 404), this._segVal(FTX, 405)].join('').trim();
                    tItem.Extrinsic.ele('Extrinsic').att('name', sName).txt(sValue);
                    break;

            }
        } // end loop FTXs

        // MOA
        let MOA = this._segByEleVal(SG15, 'MOA', 101, '146');
        if (MOA) {
            tItemDetail.UnitPrice.ele('UnitPrice').ele(XML.Money).txt(this._segVal(MOA, 102))
                .att(XML.currency, this._segVal(MOA, 103));
        }

        // SG16 Group16
        let SG16s = this._dGrps(SG15, 'SG16');
        SG16s = SG16s ?? [];
        for (let SG16 of SG16s) {
            this._SG10_SG15_SG16(SG16, tItem);
        } // end loop SG16s

        // SG20
        let SG20s = this._dGrps(SG15, 'SG20');
        SG20s = SG20s ?? [];
        for (let SG20 of SG20s) {
            this._SG10_SG15_SG20_PCI10(SG20, tItem);
            this._SG10_SG15_SG20_PCI4(SG20, tItem);
            this._SG10_SG15_SG20_PCI2430(SG20, tItem, lastParentID);
        }

        // SG23
        let SG23s = this._dGrps(SG15, 'SG23');
        SG23s = SG23s ?? [];
        for (let SG23 of SG23s) {
            let QVR = this._dSeg1(SG23, 'QVR');
            if (this._segVal(QVR, 102) == '21') {
                tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'QuantityVariance')
                    .txt(this._segVal(QVR, 101));
                tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'DiscrepancyNatureIdentificationCode')
                    .txt(this._segVal(QVR, 2));
            }
        }
        if (!tItemRetail.isEmpty()) {
            tItemRetail.sendTo(tItem.ShipNoticeItemIndustry.ele('ShipNoticeItemIndustry').ele('ShipNoticeItemRetail'));
        }
        if (!tItemID.isEmpty()) {
            // to fulfill the DTD in case there is no SupplierPartID yet. create an empty one.
            this._ele2(tItemID.SupplierPartID, 'SupplierPartID');
            tItemID.sendTo(tItem.ItemID.ele('ItemID'));
        }

        if (!tDetailRetail.isEmpty()) {
            tDetailRetail.sendTo(this._ele3(tItemDetail.ItemDetailIndustry, 'ItemDetailIndustry', 'ItemDetailRetail'));
        }
        tItemDetail.sendTo(tItem.ShipNoticeItemDetail.ele('ShipNoticeItemDetail'));


        return tItem;
    }

    /**
     * [MAP SEQUENCE  3] - [MAP SEQUENCE  6] 
     * ATTENTION:  Packaging structure has been enhanced from former SG20 only to SG10+SG20.
     * !Follow the [MAP SEQUENCE] Flow! 
     * For detailed structure and packaging examples please refer to sheet [PackagingSamples].
     * @param SG20 
     * @param tItem 
     * @returns 
     */
    private _SG10_SG15_SG20_PCI2430(SG20: ASTNode, tItem: TidyShipNoticeItem, lastParentID: string) {
        // Every SG20 needs to generate one <Packaging>
        let tPackaging = new TidyPackaging();
        // PCI
        let PCI = this._dSeg1(SG20, 'PCI');
        let vPCI1 = this._segVal(PCI, 1);
        if (vPCI1 != '24' && vPCI1 != '30') {
            return;
        }
        //let sMark = '';
        for (let i = 1; i <= 10; i++) {
            let sMark = this._segVal(PCI, 200 + i);
            if (sMark) {
                tPackaging.ShippingMark.ele('ShippingMark').txt(sMark);
            }
            //sMark += this._segVal(PCI, 200 + i);
        }


        // DTM
        let DTMs = this._dSegs(SG20, 'DTM');
        DTMs = DTMs ?? [];
        for (let DTM of DTMs) {
            let vDTM101 = this._segVal(DTM, 101);
            let vDTM102 = this._segVal(DTM, 102);
            let vDTM103 = this._segVal(DTM, 103);
            switch (vDTM101) {
                case '361':
                    tPackaging.BestBeforeDate.ele('BestBeforeDate').att('date',
                        Utils.dateStrFromDTM2(vDTM102, vDTM103)
                    );
                    break;
            }
        } // end loop DTMs

        // MEA
        let MEAs = this._dSegs(SG20, 'MEA');
        MEAs = MEAs ?? [];
        for (let MEA of MEAs) {
            let eDim = tPackaging.Dimension.ele('Dimension');
            eDim.att(XML.quantity, this._segVal(MEA, 302));
            eDim.att('type', this._mcs(MAPS.mapMEA6313, this._segVal(MEA, 201)));
            eDim.ele(XML.UnitOfMeasure).txt(this._segVal(MEA, 301));
        }

        // QTY
        let QTY = this._dSeg1(SG20, 'QTY');
        if (QTY) {
            let vQTY101 = this._segVal(QTY, 101)
            let vQTY102 = this._segVal(QTY, 102)
            let vQTY103 = this._segVal(QTY, 103)
            if (vQTY101 == '12' || vQTY101 == '52') {
                let sUOM = vQTY103;
                if (!sUOM) {
                    sUOM = 'EA';
                }
                tPackaging.DispatchQuantity.ele('DispatchQuantity').att(XML.quantity, vQTY102)
                    .ele(XML.UnitOfMeasure).txt(sUOM);
            }
        }

        // SG21 Group21
        let SG21s = this._dGrps(SG20, 'SG21');
        SG21s = SG21s ?? [];
        for (let SG21 of SG21s) {
            let GIN = this._dSeg1(SG21, 'GIN');
            let vGIN1 = this._segVal(GIN, 1);
            switch (vGIN1) {
                case 'BJ':
                case 'AW':
                    let sSerialCode = '';
                    for (let i = 2; i <= 6; i++) {
                        let vI01 = this._segVal(GIN, i * 100 + 1);
                        let vI02 = this._segVal(GIN, i * 100 + 2);
                        sSerialCode += (vI01 + vI02);
                    }

                    tPackaging.Description.ele(XML.Description).att(XML.type, 'Material').att(XML.lang, 'en-US');
                    if (lastParentID) {
                        let nSerialCode = this._chd(ShipPackaging.gMap[lastParentID].tPackaging.ShippingContainerSerialCode, 'ShippingContainerSerialCode');
                        // shipPack.tPackaging.ShippingContainerSerialCodeReference.ele('ShippingContainerSerialCodeReference')
                        // .txt(ShipPackaging.gMap[lastParentID].tPackaging.ShippingContainerSerialCode);
                        1 + 1;

                    }
                    tPackaging.ShippingContainerSerialCode.ele('ShippingContainerSerialCode').txt(sSerialCode);
                    break;

            } // end switch vGIN1

        } // end loop SG21s

        tPackaging.sendTo(tItem.Packaging.ele('Packaging'));
    } // end function _SG10_SG15_SG20_PCI2430

    private _SG10_SG15_SG20_PCI10(SG20: ASTNode, tItem: TidyShipNoticeItem) {
        let tBatch = new TidyBatch();
        // PCI
        let PCI = this._dSeg1(SG20, 'PCI');
        if (this._segVal(PCI, 1) != '10') {
            return;
        }
        // DTM
        let DTMs = this._dSegs(SG20, 'DTM');
        DTMs = DTMs ?? [];
        for (let DTM of DTMs) {
            let vDTM101 = this._segVal(DTM, 101);
            let vDTM102 = this._segVal(DTM, 102);
            let vDTM103 = this._segVal(DTM, 103);
            switch (vDTM101) {
                case '36':
                    tBatch.att('expirationDate',
                        Utils.dateStrFromDTM2(vDTM102, vDTM103)
                    );
                    break;
                case '94':
                    tBatch.att('productionDate',
                        Utils.dateStrFromDTM2(vDTM102, vDTM103)
                    );
                    break;
                case '351':
                    tBatch.att('inspectionDate',
                        Utils.dateStrFromDTM2(vDTM102, vDTM103)
                    );
                    break;
            }
        } // end loop DTMs

        // QTY
        let QTY = this._dSeg1(SG20, 'QTY');
        if (QTY) {
            if (this._segVal(QTY, 101) == '12') {
                tBatch.att('batchQuantity', this._segVal(QTY, 102));
            }
        }

        // SG21 Group21
        let SG21s = this._dGrps(SG20, 'SG21');
        SG21s = SG21s ?? [];
        for (let SG21 of SG21s) {
            let GIN = this._dSeg1(SG21, 'GIN');
            for (let i = 2; i <= 3; i++) {
                let vI01 = this._segVal(GIN, i * 100 + 1);
                let vI02 = this._segVal(GIN, i * 100 + 2);
                if (!vI02 || vI02 == '91') {
                    this._ele2(tBatch.SupplierBatchID, 'SupplierBatchID').txt(vI01);
                } else if (vI02 == '92') {
                    this._ele2(tBatch.BuyerBatchID, 'BuyerBatchID').txt(vI01);
                }
            }
        } // end loop SG21s
        tBatch.sendTo(tItem.Batch.ele('Batch'));
    } // end function _SG10_SG15_SG20_PCI10

    /**
     * Each PCI+4 creates a new ComponentConsumptionDetail
     * @param SG20 
     * @param tItem 
     * @returns 
     */
    private _SG10_SG15_SG20_PCI4(SG20: ASTNode, tItem: TidyShipNoticeItem) {
        // PCI
        let PCI = this._dSeg1(SG20, 'PCI');
        if (this._segVal(PCI, 1) != '4') {
            return;
        }

        let tConsumpD = new TidyComponentConsumptionDetails();

        tConsumpD.att('lineNumber', this._segVal(PCI, 201));

        // QTY
        let QTY = this._dSeg1(SG20, 'QTY');
        if (QTY) {
            if (this._segVal(QTY, 101) == '12') {
                tConsumpD.att(XML.quantity, this._segVal(QTY, 102));
                let sUOM = this._segVal(QTY, 103);
                if (sUOM) {
                    tConsumpD.UnitOfMeasure.ele(XML.UnitOfMeasure).txt(sUOM);
                } else {
                    tConsumpD.UnitOfMeasure.ele(XML.UnitOfMeasure).txt('EA');
                }
            }
        } // end if QTY exist

        tConsumpD.att('type', this._segVal(PCI, 202)); // Can be "blocked" or "qualityRestricted" or "scrapped"
        tConsumpD.att('usage', this._segVal(PCI, 203)); // Can be "yes" or "no"

        // SG21 Group21
        let SG21s = this._dGrps(SG20, 'SG21');
        SG21s = SG21s ?? [];
        for (let SG21 of SG21s) {
            let GIN = this._dSeg1(SG21, 'GIN');
            let vGIN1 = this._segVal(GIN, 1);
            switch (vGIN1) {
                case 'AP':
                    let tProduct = new TidyProduct();

                    // BP   <ShipNoticeItem><ComponentConsumptionDetails><Product><BuyerPartID>
                    // VN	<ShipNoticeItem><ComponentConsumptionDetails><Product><SupplierPartID>
                    // VS	<ShipNoticeItem><ComponentConsumptionDetails><Product><SupplierPartAuxiliaryID>
                    for (let i = 2; i <= 4; i++) {
                        let vI01 = this._segVal(GIN, i * 100 + 1);
                        let vI02 = this._segVal(GIN, i * 100 + 2);

                        if (vI02 == 'BP') {
                            tProduct.BuyerPartID.ele('BuyerPartID').txt(vI01);
                        } else if (vI02 == 'VN') {
                            tProduct.SupplierPartID.ele('SupplierPartID').txt(vI01);
                        } else if (vI02 == 'VS') {
                            tProduct.SupplierPartAuxiliaryID.ele('SupplierPartAuxiliaryID').txt(vI01);
                        }
                    }
                    tProduct.sendTo(tConsumpD.Product.ele('Product'));
                    break;
                case 'BX':
                    for (let i = 2; i <= 3; i++) {
                        let vI01 = this._segVal(GIN, i * 100 + 1);
                        let vI02 = this._segVal(GIN, i * 100 + 2);
                        if (vI02 == '91') {
                            tConsumpD.SupplierBatchID.ele('SupplierBatchID').txt(vI01);
                        } else if (vI02 == '92') {
                            tConsumpD.BuyerBatchID.ele('BuyerBatchID').txt(vI01);
                        }
                    }
                    break;
            } // end switch vGIN1

        } // end loop SG21s
        tConsumpD.sendTo(tItem.ComponentConsumptionDetails.ele('ComponentConsumptionDetails'));
    } // end function _SG10_SG15_SG20_PCI4

    private _SG10_SG15_SG16(SG16: ASTNode, tItem: TidyShipNoticeItem) {
        // RFF
        let RFF = this._dSeg1(SG16, 'RFF');
        let vRFF101 = this._segVal(RFF, 101);
        let vRFF102 = this._segVal(RFF, 102);
        let vRFF103 = this._segVal(RFF, 103);
        let vRFF104 = this._segVal(RFF, 104);
        switch (vRFF101) {
            case 'ON':
                if (vRFF102 in this._mapPortion) {
                    this._fixToPortion = this._mapPortion[vRFF102];
                } else {
                    // create new one and save to Map
                    this._fixToPortion = new TidyShipNoticePortion();
                    this._mapPortion[vRFF102] = this._fixToPortion;
                    this._ele2(this._fixToPortion.OrderReference, 'OrderReference').att('orderID', vRFF102)
                        .ele('DocumentReference').att(XML.payloadID, '');
                }
                // DTM
                let DTM_ON = this._dSeg1(SG16, 'DTM');
                if (DTM_ON) {
                    let vDTM101 = this._segVal(DTM_ON, 101);
                    let vDTM102 = this._segVal(DTM_ON, 102);
                    let vDTM103 = this._segVal(DTM_ON, 103);
                    if (vDTM101 == '4' || vDTM101 == '171') {
                        this._ele2(this._fixToPortion.OrderReference, 'OrderReference').att('orderDate'
                            , Utils.dateStrFromDTM2(vDTM102, vDTM103));
                    }
                } // end if DTM exists
                break;
            case 'CT':
                let eAgreeIDInfo = this._ele2(this._fixToPortion.MasterAgreementIDInfo, 'MasterAgreementIDInfo');
                eAgreeIDInfo.att('agreementID', vRFF102);
                if (vRFF103 == '1') {
                    eAgreeIDInfo.att('agreementType', 'scheduling_agreement')
                }
                // DTM
                let DTM_CT = this._dSeg1(SG16, 'DTM');
                if (DTM_CT) {
                    let vDTM101 = this._segVal(DTM_CT, 101);
                    let vDTM102 = this._segVal(DTM_CT, 102);
                    let vDTM103 = this._segVal(DTM_CT, 103);
                    if (vDTM101 == '126' || vDTM101 == '171') {
                        eAgreeIDInfo.att('agreementDate'
                            , Utils.dateStrFromDTM2(vDTM102, vDTM103));
                    }
                } // end if DTM exists
                break;
            case 'LI':
                if (vRFF102) {
                    tItem.att('parentLineNumber', vRFF102);
                }
                tItem.att('itemType', vRFF104); // [Can be "item", "composite" or "lean"]
                break;
            case 'ZZZ':
                tItem.Extrinsic.ele('Extrinsic').att('name', vRFF102)
                    .txt(vRFF104);
                break;

        } // end switch vRFF101
    } // end function _SG10_SG15_SG16

    /**
     * CPS1 >= 2
     * @param SG10 
     * @param tShipHeader 
    */
    private _SG10B(SG10: ASTNode, tShipHeader: TidyShipNoticeHeader, tPackaging: TidyPackaging) {
        // Description/@type may be done outside under root

        // SG10 SG11
        let SG11 = this._dGrp1(SG10, 'SG11');
        if (SG11) {
            let PAC = this._dSeg1(SG11, 'PAC');
            let vPAC301 = this._segVal(PAC, 301);
            let vPAC304 = this._segVal(PAC, 304);


            if (vPAC304) {
                tPackaging.PackagingCode.ele('PackagingCode').txt(vPAC304).att(XML.lang, 'en');
                //tPackaging.PackagingCode.ele('PackageTypeCodeIdentifierCode').txt(vPAC301);
            } else {
                tPackaging.PackagingCode.ele('PackagingCode').txt(this._mcs(MAPS.mapPAC7065, vPAC301)).att(XML.lang, 'en');
                tPackaging.PackagingCode.ele('PackageTypeCodeIdentifierCode').txt(vPAC301);
            }

            // MEA
            let MEAs = this._dSegs(SG11, 'MEA');
            MEAs = MEAs ?? [];
            for (let MEA of MEAs) {
                let vMEA1 = this._segVal(MEA, 1);
                let vMEA201 = this._segVal(MEA, 201);
                let vMEA301 = this._segVal(MEA, 301);
                let vMEA302 = this._segVal(MEA, 302);
                if (vMEA1 == 'AAE') {
                    tPackaging.Dimension.ele('Dimension').att(XML.quantity, vMEA302).att('type', this._mcs(MAPS.mapMEA6313, vMEA201))

                        .ele(XML.UnitOfMeasure).txt(vMEA301);
                } // end if vMEA == 'AAE'
            }

            // QTY
            let QTY = this._dSeg1(SG11, 'QTY');
            if (QTY) {
                tPackaging.DispatchQuantity.ele('DispatchQuantity').att(XML.quantity, this._segVal(QTY, 102))
                    .ele(XML.UnitOfMeasure).txt(this._segVal(QTY, 103));
            }

            // SG11 SG13 Group13
            let SG13s = this._dGrps(SG11, 'SG13');
            SG13s = SG13s ?? [];
            for (let SG13 of SG13s) {
                let PCI = this._dSeg1(SG13, 'PCI');
                let vPCI1 = this._segVal(PCI, 1);
                // SG14 Group14 GIN
                let SG14 = this._dGrp1(SG13, 'SG14');
                let GIN = this._dSeg1(SG13, 'GIN');

                if (vPCI1 == '30') {
                    for (let i = 1; i <= 10; i++) {
                        let v = this._segVal(PCI, 2 * 100 + i);
                        if (v) {
                            tPackaging.ShippingMark.ele('ShippingMark').txt(v);
                        }
                    }
                    let vGIN1 = this._segVal(GIN, 1);
                    if (vGIN1 == 'BJ' || vGIN1 == 'AW') {
                        let s = '';
                        for (let i = 2; i <= 6; i++) {
                            s += this._segVal(GIN, i * 100 + 1) + this._segVal(GIN, i * 100 + 2);
                        }
                        tPackaging.ShippingContainerSerialCode.ele('ShippingContainerSerialCode')
                            .txt(s);
                    }
                } else if (vPCI1 == 'ZZZ') {

                    if (this._segVal(GIN, 1) == 'ML') {
                        // TODO: [Only if PAC 7224 = "1" throughout message, exceept of under CPS+1] 
                        tPackaging.PackageID.ele('GlobalIndividualAssetID').txt(this._segVal(GIN, 201));
                    }
                }
            }

        } // end if exists SG11
    } // enf func _SG10B
    /**
     * CPS1 == 1
     * @param SG10 
     * @param tShipHeader 
     */
    private _SG10A(SG10: ASTNode, tShipHeader: TidyShipNoticeHeader) {

        // FTX
        let FTXs = this._dSegs(SG10, 'FTX');
        FTXs = FTXs ?? [];
        for (let FTX of FTXs) {
            let vFTX1 = this._segVal(FTX, 1);
            if (vFTX1 == 'AAI') {
                tShipHeader.Comments.ele('Comments').att('type', this._segVal(FTX, 401))
                    .txt(this._segVal(FTX, 402) + this._segVal(FTX, 403) + this._segVal(FTX, 404) + this._segVal(FTX, 405))
                    .att(XML.lang, this._segVal(FTX, 5));
            } else if (vFTX1 == 'ZZZ') {
                tShipHeader.Extrinsic.ele('Extrinsic').att('name', this._segVal(FTX, 401))
                    .txt([this._segVal(FTX, 402), this._segVal(FTX, 403), this._segVal(FTX, 404), this._segVal(FTX, 405)].join(' ').trim());
            }
        }

        // SG11 Group11
        let SG11s = this._dGrps(SG10, 'SG11');
        SG11s = SG11s ?? [];
        for (let SG11 of SG11s) {
            this._SG10_SG11A(SG11, tShipHeader);
        }

    } // end function _SG10

    /**
     * CPS1 == '1'
     * @param SG8 
     * @param tShipHeader 
     * @param tTOT 
     */
    private _SG10_SG11A(SG11: ASTNode, tShipHeader: TidyShipNoticeHeader) {
        // PAC  [Only from PAC under CPS+1]
        let PAC = this._dSeg1(SG11, 'PAC');
        if (PAC) {
            tShipHeader.Extrinsic.ele('Extrinsic').att('name', 'totalOfPackages')
                .txt(this._segVal(PAC, 1));
        }

    }
    private _SG8(SG8: ASTNode, tShipHeader: TidyShipNoticeHeader, tTOT: TidyTermsOfTransport) {
        // EQD
        let EQD = this._dSeg1(SG8, 'EQD');
        tTOT.EquipmentIdentificationCode.ele('EquipmentIdentificationCode').txt(this._segVal(EQD, 1));
        tTOT.Extrinsic.ele('Extrinsic').att('name', 'EquipmentID').txt(this._segVal(EQD, 201));
        // MEA
        let MEAs = this._dSegs(SG8, 'MEA');
        for (let MEA of MEAs) {
            let vMEA1 = this._segVal(MEA, 1);
            let vMEA201 = this._segVal(MEA, 201);
            if (vMEA1 == 'AAE') {
                let eDim = tTOT.Dimension.ele('Dimension');
                eDim.att(XML.quantity, this._segVal(MEA, 302));
                eDim.att('type',
                    this._mcs(MAPS.mapMEA6313, vMEA201)
                );
                eDim.ele('UnitOfMeasure').txt(this._segVal(MEA, 301));

            }
        } // end loop MEA

        // SEL
        let SEL = this._dSeg1(SG8, 'SEL');
        if (SEL) {
            tTOT.SealID.ele('SealID').txt(this._segVal(SEL, 1));
            tTOT.SealingPartyCode.ele('SealingPartyCode').txt(this._segVal(SEL, 201));
        }

    } // end function _SG8

    private _SG6(SG6: ASTNode, tShipHeader: TidyShipNoticeHeader, tControl: TidyShipControl) {
        // TDT
        let TDT = this._dSeg1(SG6, 'TDT');
        let vTDT804 = this._segVal(TDT, 804); // [concetenate with LOC_C517_3224, where LOC_3227="92"]
        let vTDT402 = this._segVal(TDT, 402);
        let eShipID = tControl.ShipmentIdentifier.ele('ShipmentIdentifier');
        eShipID.txt(this._segVal(TDT, 2));
        eShipID.att(XML.domain, this._segVal(TDT, 703));
        let eTransInfo = tControl.TransportInformation.ele('TransportInformation');

        eTransInfo.ele('Route').att('method',
            this._mcs(MAPS.mapTDT8179, this._segVal(TDT, 401))
        );

        if (vTDT402) {
            this._ele2(eTransInfo, 'Route').att('means', this._segVal(TDT, 402));
        }

        eTransInfo.ele('ShippingContractNumber').txt(
            this._segVal(TDT, 302)
        );

        let eCarrID1 = tControl.CarrierIdentifier.ele('CarrierIdentifier');
        eCarrID1.txt(this._segVal(TDT, 501));
        eCarrID1.att(XML.domain, this._mcs(MAPS.mapTDT3055, this._segVal(TDT, 503)));
        let eCarrID2 = tControl.CarrierIdentifier.ele('CarrierIdentifier');
        eCarrID2.att(XML.domain, 'companyName').txt(this._segVal(TDT, 504));


        // SG7 Group7 
        let SG7s = this._dGrps(SG6, 'SG7');
        let sTrackingURL = vTDT804;
        for (let SG7 of SG7s) {
            // LOC
            let LOC = this._dSeg1(SG7, 'LOC');
            let vLOC1 = this._segVal(LOC, 1);
            let vLOC204 = this._segVal(LOC, 204);
            let vLOC304 = this._segVal(LOC, 304);
            let vLOC404 = this._segVal(LOC, 404);
            switch (vLOC1) {
                case '92':
                    sTrackingURL += vLOC204;
                    // DTM
                    let DTM = this._dSeg1(SG7, 'DTM');
                    let vDTM101 = this._segVal(DTM, 101);
                    let vDTM102 = this._segVal(DTM, 102);
                    let vDTM103 = this._segVal(DTM, 103);
                    if (vDTM101 == '171') {
                        eShipID.att('trackingNumberDate', Utils.dateStrFromDTM2(vDTM102, vDTM103));
                    }
                    break;
                case 'ZZZ':
                    eTransInfo.ele('ShippingInstructions').ele(XML.Description)
                        .att(XML.lang, 'en').txt(vLOC204 + vLOC304 + vLOC404);
                    break;
            }// end switch vLOC1
        } // end loop SG7s

        eShipID.att('trackingURL', sTrackingURL);

    } // end function _SG6

    private _SG5(SG5: ASTNode, tShipHeader: TidyShipNoticeHeader, tTOD: TidyTermsOfDelivery) {
        // TOD
        let TOD = this._dSeg1(SG5, 'TOD');
        let vTOD1 = this._segVal(TOD, 1);
        let vTOD2 = this._segVal(TOD, 2);
        let vTOD301 = this._segVal(TOD, 301);
        let vTOD304 = this._segVal(TOD, 304);
        let vTOD305 = this._segVal(TOD, 305);
        // [Can be overwritten, refer to FTX+AAR+TDC]
        tTOD.TermsOfDeliveryCode.ele('TermsOfDeliveryCode').att(
            'value', this._mcs(MAPS.mapTOD4055, vTOD1)
        );
        if (vTOD2 != 'ZZZ') {
            tTOD.ShippingPaymentMethod.ele('ShippingPaymentMethod').att(
                'value', this._mcs(MAPS.mapTOD4215, vTOD2)
            );
        }
        if (vTOD301 != 'ZZZ') {
            tTOD.TransportTerms.ele('TransportTerms').att(
                'value', this._mcs(MAPS.mapTOD4053, vTOD301)
            )
        }
        let vCmt = vTOD304 + vTOD305;
        if (vCmt) {
            switch (vTOD1) {
                case '6':
                    tTOD.Comments.ele('Comments').att(XML.lang, 'en').att('type', 'TermsOfDelivery')
                        .txt(vTOD304 + vTOD305);
                    break;
                case '5':
                    tTOD.Comments.ele('Comments').att(XML.lang, 'en').att('type', 'Transport')
                        .txt(vTOD304 + vTOD305);
                    break;
                default:
                // do not map
            } // end switch vTOD1
        }
        // FTX
        let FTXs = this._dSegs(SG5, 'FTX');
        FTXs = FTXs ?? [];
        for (let FTX of FTXs) {
            let vFTX1 = this._segVal(FTX, 1);
            let vFTX301 = this._segVal(FTX, 301);
            let vFTX401 = this._segVal(FTX, 401);
            switch (vFTX1) {
                case 'AAR':
                    if (vFTX301 == 'TDC') {
                        this._ele2(tTOD.TermsOfDeliveryCode, 'TermsOfDeliveryCode').att('value', 'other')
                            .txt(vFTX401);
                    } else if (vTOD2 == 'ZZZ' && vFTX301 == 'SPM') {
                        this._ele2(tTOD.ShippingPaymentMethod, 'ShippingPaymentMethod').att('value', 'Other')
                            .txt(vFTX401);
                    } else if (vTOD301 == 'ZZZ' && vFTX301 == 'TTC') {
                        this._ele2(tTOD.TransportTerms, 'TransportTerms').att('value', 'Other')
                            .txt(vFTX401);
                    }
                    break;
                case 'AAI':
                    tTOD.Comments.ele('Comments').att(XML.lang, this._segVal(FTX, 5)).att('type', vFTX401)
                        .txt(this._segVal(FTX, 402) + this._segVal(FTX, 403) + this._segVal(FTX, 404) + this._segVal(FTX, 405))
                    break;
                case 'SSR':
                    let sSvcLvlLang = this._segVal(FTX, 5);
                    tShipHeader.ServiceLevel.ele('ServiceLevel').att(XML.lang, sSvcLvlLang).txt(this._segVal(FTX, 401));
                    tShipHeader.ServiceLevel.ele('ServiceLevel').att(XML.lang, sSvcLvlLang).txt(this._segVal(FTX, 402));
                    tShipHeader.ServiceLevel.ele('ServiceLevel').att(XML.lang, sSvcLvlLang).txt(this._segVal(FTX, 403));
                    tShipHeader.ServiceLevel.ele('ServiceLevel').att(XML.lang, sSvcLvlLang).txt(this._segVal(FTX, 404));
                    tShipHeader.ServiceLevel.ele('ServiceLevel').att(XML.lang, sSvcLvlLang).txt(this._segVal(FTX, 405));
                    break;
            } // end switch vFTX1
        } // end loop FTXs

    } // end func _SG5
    private _SG2_DP(SG4: ASTNode, NAD: EdiSegment, tShipHeader: TidyShipNoticeHeader, tTOD: TidyTermsOfDelivery) {
        let tAddress = new TidyAddress();
        let v201 = this._segVal(NAD, 201);
        let v202 = this._segVal(NAD, 202);
        let v203 = this._segVal(NAD, 203);
        //let tAddress = tShipHeader.TermsOfDelivery.ele('TermsOfDelivery').ele('Address');
        if (v202 == '160' || v202 == 'ZZZ') {
            tAddress.att('addressID', v201);
            tAddress.att('addressIDDomain', this._mcs(MAPS.mapNAD3055, v203));
        }
        let sName = this._segVal(NAD, 301)
            + this._segVal(NAD, 302)
            + this._segVal(NAD, 303)
            + this._segVal(NAD, 304)
            + this._segVal(NAD, 305);
        tAddress.Name.ele('Name').txt(sName).att(XML.lang, 'en');
        this._NADPostalAddr(tAddress, NAD);
        this._xmlCommFromCTA(SG4, tAddress, sName);
        tAddress.sendTo(tTOD.Address.ele('Address'));
    }

    private _SG2(SG2: ASTNode, tShipHeader: TidyShipNoticeHeader, tTOD: TidyTermsOfDelivery) {
        // NAD
        let NAD = this._dSeg1(SG2, 'NAD');
        let vNAD1 = this._segVal(NAD, 1);
        let vNAD202 = this._segVal(NAD, 202);

        //  [Lookup required, Sheet NAD]
        let sXmlRole = this._mcs(MAPS.mapNAD3035, vNAD1);
        if (!sXmlRole) {
            if (vNAD1 == 'DP') {
                let SG4 = this._dGrp1(SG2, 'SG4');
                return this._SG2_DP(SG4, NAD, tShipHeader, tTOD);
            } else {
                return;
            }
        }

        // from now on, sXMLRole exists
        let tContact = new TidyContact();
        tContact.att(XML.role, sXmlRole);
        if (vNAD202 == '160' || vNAD202 == 'ZZZ') {
            tContact.att('addressID', this._segVal(NAD, 201));
            tContact.att('addressIDDomain', this._mcs(MAPS.mapNAD3055, this._segVal(NAD, 203)));
        }
        tContact.Name.ele('Name').txt(
            this._segVal(NAD, 301)
            + this._segVal(NAD, 302)
            + this._segVal(NAD, 303)
            + this._segVal(NAD, 304)
            + this._segVal(NAD, 305)
        ).att(XML.lang, 'en');
        this._NADPostalAddr(tContact, NAD);

        // SG2_SG3
        let SG3s = this._dGrps(SG2, 'SG3');
        SG3s = SG3s ?? [];
        for (let SG3 of SG3s) {
            let RFF = this._dSeg1(SG3, 'RFF');
            let vRFF101 = this._segVal(RFF, 101);
            let vRFF102 = this._segVal(RFF, 102);
            tContact.IdReference.ele(XML.IdReference)
                .att(XML.domain, this._mcs(MAPS.mapNAD_RFF_1153, vRFF101))
                .att(XML.identifier, vRFF102);
        }

        // SG2_SG4
        let SG4s = this._dGrps(SG2, 'SG4');
        SG4s = SG4s ?? [];
        for (let SG4 of SG4s) {
            this._SG2_SG4(SG4, sXmlRole, tContact)
        }


        if (!this._isXmlEmpty(tContact.Name)) {
            // only when tContact.Name is not empty
            tContact.sendTo(tShipHeader.Contact.ele('Contact'));
        }
    }
    private _SG2_SG4(SG4: ASTNode, roleName: string, tContact: TidyContact) {
        this._xmlCommFromCTA(SG4, tContact, roleName);
    }

    private _SG1(SG1: ASTNode, tShipHeader: TidyShipNoticeHeader, tPortion: TidyShipNoticePortion) {
        // SG1 RFF
        let RFFs = this._dSegs(SG1, 'RFF');
        RFFs = RFFs ?? [];
        for (let RFF of RFFs) {
            let v101 = this._segVal(RFF, 101);
            let v102 = this._segVal(RFF, 102);
            let v103 = this._segVal(RFF, 103);
            switch (v101) {
                case 'ON':
                    // dummy 'DocumentReference' is just to fulfill the DTD requirment
                    this._ele2(tPortion.OrderReference, 'OrderReference').att('orderID', v102)
                        .ele('DocumentReference').att(XML.payloadID, '');
                    this._mapPortion[v102] = tPortion;
                    this._fixToPortion = tPortion;
                    break;
                case 'CT':
                    let eAgreeInfo = this._ele2(tPortion.MasterAgreementIDInfo, 'MasterAgreementIDInfo');
                    eAgreeInfo.att('agreementID', v102);
                    if (v103 == '1') {
                        eAgreeInfo.att('agreementType', 'scheduling_agreement');
                    }
                    break;
                case 'AAN':
                    tShipHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'DeliverySheduleID')
                        .txt(v102);
                    break;
                case 'DQ':
                    tShipHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'DeliveryNoteID')
                        .txt(v102);
                    break;
                case 'IV':
                    tShipHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'InvoiceID').txt(v102);
                    break;
                case 'VN':
                    tShipHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'SupplierOrderID').txt(v102);
                    break;
                case 'CR':
                    tShipHeader.IdReference.ele('IdReference').att(XML.domain, 'CustomerReferenceID')
                        .att(XML.identifier, v102);
                    break;
                case 'UC':
                    tShipHeader.IdReference.ele('IdReference').att(XML.domain, 'UltimateCustomerReferenceID')
                        .att(XML.identifier, v102);
                    break;
                case 'GN':
                    tShipHeader.IdReference.ele('IdReference').att(XML.domain, 'governmentNumber')
                        .att(XML.identifier, v102);
                    break;
                case 'AEU':
                    tShipHeader.IdReference.ele('IdReference').att(XML.domain, 'supplierReference')
                        .att(XML.identifier, v102);
                    break;
                case 'DM':
                    tShipHeader.IdReference.ele('IdReference').att(XML.domain, 'documentName')
                        .att(XML.identifier, v102);
                    break;

                default:

            } // end switch v101
        } // end loop RFFs

        // SG1 DTM
        let DTMs = this._dSegs(SG1, 'DTM');
        DTMs = DTMs ?? [];
        for (let DTM of DTMs) {
            let v101 = this._segVal(DTM, 101);
            let v102 = this._segVal(DTM, 102);
            let v103 = this._segVal(DTM, 103);
            switch (v101) {
                case '126':
                case '171':
                    this._ele2(tPortion.MasterAgreementIDInfo, 'MasterAgreementIDInfo').att('agreementDate'
                        , Utils.dateStrFromDTM2(v102, v103));
                    break;
            }
        }
    } // end function _SG1


} // end class

class MAPS {
    static mapBGM1225: Object = {
        "9": "new",
        "3": "delete",
        "4": "update",
        "5": "update",
    };
    static mapBGM4343: Object = {
        "AP": "actual",
        "CA": "planned",
    };
    static mapMEA6313: Object = {
        "AAA": "unitNetWeight",
        "AAB": "unitGrossWeight",
        "AAW": "grossVolume",
        "AAX": "volume",
        "G": "grossWeight",
        "HM": "stackHeight",
        "HT": "height",
        "LN": "length",
        "WD": "width",
        "WT": "weight",
        "ZZZ": "other",
    };
    static mapNAD3035: Object = {
        "AM": "administrator",
        "AT": "technicalSupport",
        "BI": "buyerMasterAccount",
        "BT": "billTo",
        "BY": "buyer",
        "CA": "carrierCorporate",
        "CO": "corporateOffice",
        "DO": "correspondent",
        //"DP": "deliveryParty",
        "UD": "subsequentBuyer",
        "FD": "buyerCorporate",
        "FR": "from",
        "II": "issuerOfInvoice",
        "IV": "buyer",
        "LP": "consignmentOrigin",
        "MF": "ManufacturerName",
        "OB": "endUser",
        "PD": "purchasingAgent",
        "PK": "taxRepresentative",
        "PO": "buyerAccount",
        "RE": "remitTo",
        "RF": "billFrom",
        "RH": "supplierMasterAccount",
        "SB": "sales",
        "SE": "supplierAccount",
        "SF": "shipFrom",
        "SO": "soldTo",
        "SR": "customerService",
        "ST": "shipTo",
        "SU": "supplierCorporate",
        "UP": "consignmentDestination",
    };

    static mapNAD3055: Object = {
        "3": "IATA",
        "9": "EAN",
        "12": "UIC",
        "16": "DUNS",
        "91": "Assigned by seller or seller's agent",
        "92": "Assigned by buyer or buyer's agent",
        "182": "SCAC",
    };
    static mapNAD_RFF_1153: Object = {
        "ACD": "reference",
        "ACK": "abaRoutingNumber",
        "AGU": "memberNumber",
        "AHL": "creditorRefID",
        "AHP": "supplierTaxID",
        "AIH": "transactionReference",
        "AP": "accountReceivableID",
        "AV": "accountPayableID",
        "FC": "fiscalNumber",
        "GN": "governmentNumber",
        "IA": "vendorNumber",
        "IT": "companyCode",
        "PY": "accountID",
        "RT": "bankRoutingID",
        "SA": "contactPerson",
        "SD": "departmentName",
        "TL": "taxExemptionID",
        "VA": "vatID",
    };

    static mapTOD4055: Object = {
        "1": "PriceCondition",
        "2": "DespatchCondition",
        "3": "PriceAndDespatchCondition",
        "4": "CollectedByCustomer",
        "5": "TransportCondition",
        "6": "DeliveryCondition",
    }

    static mapTOD4215: Object = {
        "A": "Account",
        "CA": "AdvanceCollect",
        "CC": "Collect",
        "CF": "CollectFreightCreditedToPaymentCustomer",
        "DF": "DefinedByBuyerAndSeller",
        "FO": "FobPortOfCall",
        "IC": "InformationCopy-NoPaymentDue",
        "MX": "Mixed",
        "NC": "ServiceFreight-NoCharge",
        "NS": "NotSpecified",
        "PA": "AdvancePrepaid",
        "PB": "CustomerPick-UpOrBackhaul",
        "PC": "PrepaidButChargedToCustomer",
        "PE": "PayableElsewhere",
        "PO": "PrepaidOnly",
        "PP": "Prepaid-BySeller",
        "PU": "Pickup",
        "RC": "ReturnContainerFreightPaidByCustomer",
        "RF": "ReturnContainerFreightFree",
        "RS": "ReturnContainerFreightPaidBySupplier",
        "TP": "ThirdPartyPay",
        "WC": "WeightCondition",
        // "ZZZ": "CashOnDeliveryServiceChargePaidByConsignee",
        // "ZZZ": "CashOnDeliveryServiceChargePaidByConsignor",
        // "ZZZ": "CollectOnDelivery",
        // "ZZZ": "HalfPrepaid",
        // "ZZZ": "Other",

    };
    static mapTOD4053: Object = {
        "CFR": "CostAndFreight",
        "CIF": "Cost-InsuranceAndFreight",
        "CIP": "Carriage-InsurancePaidTo",
        "CPT": "CarriagePaidTo",
        "DAF": "DeliveredAtFrontier",
        "DDP": "DeliveredDutyPaid",
        "DEQ": "DeliveredEx-Quay",
        "DES": "DeliveredEx-Ship",
        "EXW": "Ex-Works",
        "FAS": "FreeAlongsideShip",
        "FCA": "Free-Carrier",
        "FOA": "FreeOnAir",
        "FOB": "FreeOnBoard",
        "FOR": "FreeOnRail",
    };

    static mapTDT8179: Object = {
        "6": "air",
        "11": "ship",
        "23": "rail",
        "31": "motor",
    };
    static mapTDT3055: Object = {
        "3": "IATA",
        "9": "EAN",
        "12": "UIC",
        "16": "DUNS",
        "182": "SCAC",
    };
    static mapPAC7065: Object = {
        "1A1": "Drums, steel, non-removable head",
        "1A2": "Drums, steel, removable head",
        "1B1": "Drums, aluminium, non-removable head",
        "1B2": "Drums, aluminium, removable head",
        "1D": "Drums, plywood",
        "1G": "Drums, fibre",
        "1H1": "Drums, plastics, non-removable head",
        "1H2": "Drums, plastics, removable head",
        "2C1": "Barrels, wooden, bung type",
        "2C2": "Barrels, wooden, removable head",
        "3A1": "Jerricans, steel, non-removable head",
        "3A2": "Jerricans, steel, removable head",
        "3H1": "Jerricans, plastics, non-removable head",
        "3H2": "Jerricans, plastics, removable head",
        "4A": "Boxes, steel",
        "4B": "Boxes, aluminium",
        "4C1": "Boxes, natural wood, ordinary",
        "4C2": "Boxes, natural wood, with sift-proof walls",
        "4D": "Boxes, plywood",
        "4F": "Boxes, reconstituted wood",
        "4G": "Boxes, fibreboard",
        "4H1": "Boxes, plastics, expanded",
        "4H2": "Boxes, plastics, solid",
        "5H1": "Bags, woven plastics, without inner liner or coating",
        "5H2": "Bags, woven plastics, sift-proof",
        "5H3": "Bags, woven plastics, water resistant",
        "5H4": "Bags, plastics film",
        "5L1": "Bags, textile, without inner liner or coating",
        "5L2": "Bags, textile, sift-proof",
        "5L3": "Bags, textile, water resistant",
        "5M1": "Bags, paper, multiwall",
        "5M2": "Bags, paper, multiwall, water resistant",
        "6HA": "Composite packagings, plastics receptacle, in steel",
        //"6HA": "Composite packagings, plastics receptacle, in steel",
        "6HB": "Composite packagings, plastics receptacle, in",
        //"6HB": "Composite packagings, plastics receptacle, in",
        "6HC": "Composite packagings, plastics receptacle, wooden box",
        "6HD": "Composite packagings, plastics receptacle, in",
        //"6HD": "Composite packagings, plastics receptacle, in",
        "6HG": "Composite packagings, plastics receptacle, in fibre",
        //"6HG": "Composite packagings, plastics receptacle, in",
        "6HH": "Composite packagings, plastics receptacle, in",
        //"6HH": "Composite packagings, plastics receptacle, in solid",
        "6PA": "Composite packagings, glass, porcelain or stoneware",
        //"6PA": "Composite packagings, glass, porcelain or stoneware",
        "6PB": "Composite packagings, glass, porcelain or stoneware",
        //"6PB": "Composite packagings, glass, porcelain or stoneware",
        "6PC": "Composite packagings, glass, porcelain or stoneware",
        "6PD": "Composite packagings, glass, porcelain or stoneware",
        //"6PD": "Composite packagings, glass, porcelain or stoneware",
        "6PG": "Composite packagings, glass, porcelain or stoneware",
        //"6PG": "Composite packagings, glass, porcelain or stoneware",
        "6PH": "Composite packagings, glass, porcelain or stoneware",
        //"6PH": "Composite packagings, glass, porcelain or stoneware",
        "AE": "Aerosol",
        "AM": "Ampoule, non-protected",
        "AP": "Ampoule, protected",
        "AT": "Atomizer",
        "BA": "Barrel",
        "BB": "Bobbin",
        "BC": "Bottlecrate, bottlerack",
        "BD": "Board",
        "BE": "Bundle",
        "BF": "Balloon, non-protected",
        "BG": "Bag",
        "BH": "Bunch",
        "BI": "Bin",
        "BJ": "Bucket",
        "BK": "Basket",
        "BL": "Bale, compressed",
        "BN": "Bale, non-compressed",
        "BO": "Bottle, non-protected, cylindrica",
        "BP": "Balloon, protected",
        "BQ": "Bottle, protected cylindrical",
        "BR": "Bar",
        "BS": "Bottle, non-protected, bulbous",
        "BT": "Bolt",
        "BU": "Butt",
        "BV": "Bottle, protected bulbous",
        "BX": "Box",
        "BY": "Board, in bundle/bunch/truss",
        "BZ": "Bars, in bundle/bunch/truss",
        "CA": "Can, rectangular",
        "CB": "Beer crate",
        "CC": "Churn",
        "CE": "Creel",
        "CF": "Coffer",
        "CG": "Cage",
        "CH": "Chest",
        "CI": "Canister",
        "CJ": "Coffin",
        "CK": "Cask",
        "CL": "Coil",
        "CO": "Carboy, non-protected",
        "CP": "Carboy, protected",
        "CR": "Crate",
        "CS": "Case",
        "CT": "Carton",
        "CU": "Cup",
        "CV": "Cover",
        "CX": "Can, cylindrical",
        "CY": "Cylinder",
        "CZ": "Canvas",
        "DJ": "Demijohn, non-protected",
        "DP": "Demijohn, protected",
        "DR": "Drum",
        "EN": "Envelope",
        "FC": "Fruit crate",
        "FD": "Framed crate",
        "FI": "Firkin",
        "FL": "Flask",
        "FO": "Footlocker",
        "FP": "Filmpack",
        "FR": "Frame",
        "GB": "Gas bottle",
        "GI": "Girder",
        "GZ": "Girders, in bundle/bunch/truss",
        "HG": "Hogshead",
        "HR": "Hamper",
        "IN": "Ingot",
        "IZ": "Ingots, in bundle/bunch/truss",
        "JC": "Jerrican, rectangular",
        "JG": "Jug",
        "JR": "Jar",
        "JT": "Jutebag",
        "JY": "Jerrican, cylindrical",
        "KG": "Keg",
        "LG": "Log",
        "LZ": "Logs, in bundle/bunch/truss",
        "MB": "Multiply bag",
        "MC": "Milk crate",
        "MS": "Multiwall sack",
        "MT": "Mat",
        "MX": "Match box",
        "NE": "Unpacked or unpackaged",
        "NS": "Nest",
        "NT": "Net",
        "PA": "Packet",
        "PC": "Parcel",
        "PG": "Plate",
        "PH": "Pitcher",
        "PI": "Pipe",
        "PK": "Package",
        "PL": "Pail",
        "PN": "Plank",
        "PO": "Pouch",
        "PT": "Pot",
        "PU": "Tray",
        //"PU": "Tray pack",
        "PY": "Plates, in bundle/bunch/truss",
        "PZ": "Pipes, in bundle/bunch/truss",
        //"PZ": "Planks, in bundle/bunch/truss",
        "RD": "Rod",
        "RG": "Ring",
        "RL": "Reel",
        "RO": "Roll",
        "RT": "Rednet",
        "RZ": "Rods, in bundle/bunch/truss",
        "SA": "Sack",
        "SC": "Shallow crate",
        "SD": "Spindle",
        "SE": "Sea-chest",
        "SH": "Sachet",
        "SK": "Skeleton case",
        "SL": "Slipsheet",
        "SM": "Sheetmetal",
        "ST": "Sheet",
        "SU": "Suitcase",
        "SW": "Shrinkwrapped",
        "SZ": "Sheets, in bundle/bunch/truss",
        "TB": "Tub",
        "TC": "Tea-chest",
        "TD": "Collapsible tube",
        // "TD": "Tube, collapsible",
        "TK": "Tank, rectangular",
        "TN": "Tin",
        "TO": "Tun",
        "TR": "Trunk",
        "TS": "Truss",
        "TU": "Tube",
        "TY": "Tank, cylindrical",
        "TZ": "Tubes, in bundle/bunch/truss",
        "VA": "Vat",
        "VG": "Bulk, gas (at 1031 mbar and 15/C)",
        "VI": "Vial",
        "VL": "Bulk, liquid",
        "VO": "Bulk, solid, large particles (nodules)",
        "VP": "Vacuumpacked",
        "VQ": "Bulk, liquefied gas (at abnormal temperature/pressure)",
        "VR": "Bulk, solid, granular particles (grains)",
        "VY": "Bulk, solid, fine particles (powders)",
        "WB": "Wickerbottle",

    };


    static mapIMD7081: Object = {
        "13": "quality",
        "35": "color",
        "38": "grade",
        "79": "otherPhysicalDescription",
        "98": "size",

    }
} // end class MAP
