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
import { CUtilX12 } from "../../utils/cUtilX12";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { ConvertErr, EdiSegment } from "../../new_parser/entities";
import { Comments, CommentsURL, ConverterBase, MAPStoXML } from "../converterBase";
import { ASTNode } from "../../new_parser/syntaxParserBase";
import { TidyBatch, TidyComponentConsumptionDetails, TidyPackaging, TidyShipControl, TidyShipNoticeHeader, TidyShipNoticeItem, TidyShipNoticeItemDetail, TidyShipNoticePortion, TidyTermsOfDelivery } from "../xmlTidy/ShipNotice";
import { XmlConverterBase } from "../xmlConverterBase";
import utils from "../../utils/utils";
import { TidyContact, TidyItemID } from "../xmlTidy/TidyCommon";

class ShipmentHL {
    // S:Shipment O:Order T:Shipping Tare P:Pack I:Item F:Component
    protected _sType = 'S';
    protected _Seg: EdiSegment;
    protected _grpHL: ASTNode;
    protected _childShipmentHL: ShipmentHL[] = [];
}

type MapHL_O = {
    [key: string]: TidyShipNoticePortion;
}

type MapHL_I = {
    [key: string]: TidyShipNoticeItem;
}

type MapHL_F = {
    [key: string]: TidyComponentConsumptionDetails;
}

type MapHL_T = {
    [key: string]: TidyPackaging;
}
type MapHL_P = {
    [key: string]: TidyPackaging;
}
type MapComments = {
    [key: string]: Comments;
}

/**
 * No need to make singleton because parserUtil already assured it
 */
export class Cvt_856_ShipNotice extends ConverterBase {
    protected _vBSN05: string;
    protected _vCUR: string = 'USD';
    protected _iEmptyKey = 0;
    protected _commentsLang: string = '';
    protected _mapComments: MapComments = {};
    protected _arrCommentsKeys: string[] = [];
    protected _sShipmentIdentifier: string = '';
    // Root Shipment HL
    protected _vShipmentHL: ShipmentHL = new ShipmentHL();
    protected _convertErrs: ConvertErr[];
    constructor(astTree: ASTNode) {
        super(astTree);
    }


    public toXMLCheck(document?: vscode.TextDocument): vscode.Diagnostic[] {
        this._document = document;
        this._clearDiags(); // clear previouse check results

        this._chkUsageIndicator();
        return this._cvtDiags;
    }

    public toXML(): string {
        // this.toXMLCheck();
        // if (this._hasConvertErr()) {
        //     return this._renderConvertErr();
        // }

        const cxml = create({ encoding: "utf-8" }).ele('cXML').dtd({
            sysID: 'http://xml.cxml.org/schemas/cXML/1.2.060/Fulfill.dtd'
        });

        // header supplier2buyer
        this._header_supplier_to_buyer(cxml);
        // <!ELEMENT ShipNoticeRequest
        // (ShipNoticeHeader, ShipControl*, ShipNoticePortion*)>
        let request = cxml.ele(XML.Request);
        let shipNoticeRequest = request.ele('ShipNoticeRequest');
        let eShipNoticeHeader = shipNoticeRequest.ele('ShipNoticeHeader');
        let tShipNoticeHeader = new TidyShipNoticeHeader();
        let tControl = new TidyShipControl();

        let usageIndicator = this._segVal("ISA", 15);
        request.att(XML.deploymentMode, CUtilX12.usageIndicatorXML(usageIndicator));

        // BSN
        let BSN = this._rseg("BSN");

        let vBSN01 = this._segVal(BSN, 1);
        let vBSN02 = this._segVal(BSN, 2);
        let vBSN03 = this._segVal(BSN, 3);
        let vBSN04 = this._segVal(BSN, 4);
        this._vBSN05 = this._segVal(BSN, 5);
        let vBSN06 = this._segVal(BSN, 6);
        let vBSN07 = this._segVal(BSN, 7);
        let vShipmentID = vBSN02;
        if (vBSN01 == '03') {
            vShipmentID = vShipmentID + '_1';
        }
        tShipNoticeHeader.att('shipmentID', vShipmentID);
        tShipNoticeHeader.att('operation', MAPS.mapBSN353[vBSN01]);
        tShipNoticeHeader.att('noticeDate', Utils.dateStrFromDTM(
            this._segVal(vBSN03, 2)
            , this._segVal(vBSN04, 3)
            , 'Z'
        ));
        tShipNoticeHeader.att('shipmentType', MAPS.mapBSN640[vBSN06]);
        if (this._mes(MAPS.mapBSN641, vBSN07)) {
            tShipNoticeHeader.att('fulfillmentType', MAPS.mapBSN641[vBSN07]);
        }

        let DTMs = this._rSegs('DTM');
        DTMs = DTMs ?? [];
        for (let dtm of DTMs) {
            let vDTM1 = this._segVal(dtm, 1);
            let vDTM2 = this._segVal(dtm, 2);
            let vDTM3 = this._segVal(dtm, 3);
            let vDTM4 = this._segVal(dtm, 4);
            switch (vDTM1) {
                case '111':
                    tShipNoticeHeader.att('noticeDate', Utils.dateStrFromDTM(
                        vDTM2, vDTM3, vDTM4
                    ));
                case '011':
                    tShipNoticeHeader.att('shipmentDate', Utils.dateStrFromDTM(
                        vDTM2, vDTM3, vDTM4
                    ));
                    break;
                case '017':
                    tShipNoticeHeader.att('deliveryDate', Utils.dateStrFromDTM(
                        vDTM2, vDTM3, vDTM4
                    ));
                    break;
                case '002':
                    tShipNoticeHeader.att('requestedDeliveryDate', Utils.dateStrFromDTM(
                        vDTM2, vDTM3, vDTM4
                    ));
                    break;
                case '118':
                    let sPickUpDate = Utils.dateStrFromDTM(
                        vDTM2, vDTM3, vDTM4
                    );

                    tShipNoticeHeader.Extrinsic.ele(XML.Extrinsic).att('name', sPickUpDate)
                        .txt(sPickUpDate);
                    break;
            }
        } // end loop DTMs

        let grpHLs = this._rGrps('HL');
        let mapHL_O: MapHL_O = {};
        let mapHL_I: MapHL_I = {};
        let mapHL_F: MapHL_F = {};
        let mapHL_T: MapHL_T = {};
        let mapHL_P: MapHL_P = {};


        // let tPortioin = new TidyShipNoticePortion();
        for (let grpHL of grpHLs) {
            let HL = this._dSeg1(grpHL, 'HL');
            let vHL1 = this._segVal(HL, 1); // ID
            let vHL2 = this._segVal(HL, 2); // Parent ID
            let vHL3 = this._segVal(HL, 3);
            let vHL4 = this._segVal(HL, 4);
            switch (vHL3) {
                case 'S':
                    this._dealGrpHL_S(grpHL, tShipNoticeHeader, tControl);
                    break;
                case 'O':
                    mapHL_O[vHL1] = new TidyShipNoticePortion();
                    this._dealGrpHL_O(grpHL, mapHL_O[vHL1]);
                    break;
                case 'I':
                    mapHL_I[vHL1] = new TidyShipNoticeItem();
                    mapHL_I[vHL1].parentID = vHL2;
                    this._dealGrpHL_I(grpHL, mapHL_I[vHL1]);
                    break;
                case 'F':
                    mapHL_F[vHL1] = new TidyComponentConsumptionDetails();
                    mapHL_F[vHL1].parentID = vHL2;
                    this._dealGrpHL_F(grpHL, mapHL_F[vHL1]);
                    break;
                case 'T':
                    mapHL_T[vHL1] = new TidyPackaging;
                    mapHL_T[vHL1].parentID = vHL2;
                    this._dealGrpHL_T(grpHL, mapHL_T[vHL1]);
                    break;
                case 'P':
                    mapHL_P[vHL1] = new TidyPackaging;
                    mapHL_P[vHL1].parentID = vHL2;
                    this._dealGrpHL_P(grpHL, mapHL_P[vHL1]);
                    break;
            }
        }

        tShipNoticeHeader.sendTo(eShipNoticeHeader);
        if (!tControl.isEmpty()) {
            tControl.sendTo(shipNoticeRequest.ele('ShipControl'));
        }

        switch (this._vBSN05) {
            case '0001': //  HL SO[T]PI -- Shipment, Order, Packaging, Item*
                // we still need follow same order to generate cXML,
                // the only difference is how to find parent/child X12 Segment
                this._0001_SOTPI(mapHL_O, mapHL_T, mapHL_P, mapHL_I, mapHL_F, shipNoticeRequest);

                break;
            case '0002': //  HL SOI[T]P --  Shipment, Order, item, Packaging*
                this._0002_SOITP(mapHL_O, mapHL_I, mapHL_F, mapHL_T, mapHL_P, shipNoticeRequest);
                // Dispatch Quantity is already set when dealing Pack
                break;
            case '0004': // HL SOI --  Shipment, Order, Item*
                for (let sHL_O in mapHL_O) {
                    let tPortion: TidyShipNoticePortion = mapHL_O[sHL_O];
                    for (let sHL_I in mapHL_I) {
                        if (mapHL_I[sHL_I].parentID != sHL_O) {
                            // bypass the Item whose parent is not sHL_O
                            continue;
                        }
                        let tItem: TidyShipNoticeItem = mapHL_I[sHL_I];
                        if (tItem.PO4_QTY_UOM.qty) {
                            let ePacking = this._ele2(tItem.Packaging, 'Packaging');
                            ePacking.ele('DispatchQuantity').att(XML.quantity, tItem.PO4_QTY_UOM.qty)
                                .ele(XML.UnitOfMeasure).txt(tItem.PO4_QTY_UOM.uom);
                        }
                        this._mergeConsumptionDetails(mapHL_F, sHL_I, tItem);
                        tItem.sendTo(tPortion.ShipNoticeItem.ele('ShipNoticeItem'));
                    }
                    tPortion.sendTo(shipNoticeRequest.ele('ShipNoticePortion'));
                }
                break;

        } // end switch

        const xml = cxml.end({ prettyPrint: true, indent: '    ', spaceBeforeSlash: false });
        //xml = this._adjustDomainIdRefOrder(xml);
        return xml;
    }

    private _0001_SOTPI(mapHL_O: MapHL_O, mapHL_T: MapHL_T, mapHL_P: MapHL_P, mapHL_I: MapHL_I, mapHL_F: MapHL_F, shipNoticeRequest: XMLBuilder) {
        for (let sHL_O in mapHL_O) {
            let tPortion: TidyShipNoticePortion = mapHL_O[sHL_O];

            if (Object.keys(mapHL_T).length > 0) {
                // Have Tare
                for (let sHL_T in mapHL_T) { // HL T
                    if (mapHL_T[sHL_T].parentID != sHL_O) {
                        // bypass
                        continue;
                    }
                    let tTare: TidyPackaging = mapHL_T[sHL_T];
                    tTare.Description.ele(XML.Description).att('type', 'Packaging').att(XML.lang, 'en');
                    tTare.PackagingLevelCode.ele('PackagingLevelCode').txt('0001');
                    for (let sHL_P in mapHL_P) { // HL P
                        if (mapHL_P[sHL_P].parentID != sHL_T) {
                            // bypass
                            continue;
                        }
                        let tPack: TidyPackaging = mapHL_P[sHL_P];
                        tPack.Description.ele(XML.Description).att('type', 'Material').att(XML.lang, 'en');
                        tPack.PackagingLevelCode.ele('PackagingLevelCode').txt('0002');
                        this._rpl(this._chd(tTare.ShippingContainerSerialCode, 'ShippingContainerSerialCode'),
                            this._ele2(tPack.ShippingContainerSerialCodeReference, 'ShippingContainerSerialCodeReference'));


                        for (let sHL_I in mapHL_I) { // HL I
                            if (mapHL_I[sHL_I].parentID != sHL_P) {
                                // bypass the Item whose parent is no iHL_O
                                continue;
                            }
                            let tItem: TidyShipNoticeItem = mapHL_I[sHL_I];
                            if (tItem.SN1_QTY_UOM.qty) {
                                // maybe other tItem has already set the tPack, we need to clear first
                                this._rmv(tPack.DispatchQuantity, 'DispatchQuantity');
                                tPack.DispatchQuantity.ele('DispatchQuantity').att(XML.quantity, tItem.SN1_QTY_UOM.qty)
                                    .ele(XML.UnitOfMeasure).txt(tItem.SN1_QTY_UOM.uom);
                            }
                            this._mergeConsumptionDetails(mapHL_F, sHL_I, tItem);
                            if (!tPack.isEmpty()) {
                                tPack.sendTo(tItem.Packaging.ele('Packaging'));
                            }
                            if (!tTare.isEmpty()) {
                                tTare.sendTo(tItem.Packaging.ele('Packaging'));
                            }
                            tItem.sendTo(tPortion.ShipNoticeItem.ele('ShipNoticeItem'));
                        }
                    }
                }
            } else {
                // No Tare, so send tPack to ShipNoticiItem.Packaging
                for (let iHL_P in mapHL_P) {
                    if (mapHL_P[iHL_P].parentID != sHL_O) {
                        // bypass
                        continue;
                    }
                    let tPack: TidyPackaging = mapHL_P[iHL_P];
                    tPack.Description.ele(XML.Description).att('type', 'Material').att(XML.lang, 'en');
                    for (let sHL_I in mapHL_I) {
                        if (mapHL_I[sHL_I].parentID != iHL_P) {
                            // bypass the Item whose parent is no iHL_O
                            continue;
                        }
                        let tItem: TidyShipNoticeItem = mapHL_I[sHL_I];
                        if (tItem.SN1_QTY_UOM.qty) {
                            // maybe other tItem has already set the tPack, we need to clear first
                            this._rmv(tPack.DispatchQuantity, 'DispatchQuantity');
                            // use data saved in tItem to fill out tPack
                            tPack.DispatchQuantity.ele('DispatchQuantity').att(XML.quantity, tItem.SN1_QTY_UOM.qty)
                                .ele(XML.UnitOfMeasure).txt(tItem.SN1_QTY_UOM.uom);
                        }
                        this._mergeConsumptionDetails(mapHL_F, sHL_I, tItem);
                        if (!tPack.isEmpty()) {
                            tPack.sendTo(tItem.Packaging.ele('Packaging'));
                        }
                        tItem.sendTo(tPortion.ShipNoticeItem.ele('ShipNoticeItem'));
                    }
                }
            }

            tPortion.sendTo(shipNoticeRequest.ele('ShipNoticePortion'));
        }
    }

    private _0002_SOITP(mapHL_O: MapHL_O, mapHL_I: MapHL_I, mapHL_F: MapHL_F, mapHL_T: MapHL_T, mapHL_P: MapHL_P, shipNoticeRequest: XMLBuilder) {
        for (let iHL_O in mapHL_O) {
            let tPortion: TidyShipNoticePortion = mapHL_O[iHL_O];
            for (let sHL_I in mapHL_I) {
                if (mapHL_I[sHL_I].parentID != iHL_O) {
                    // bypass the Item whose parent is not sHL_O
                    continue;
                }
                let tItem: TidyShipNoticeItem = mapHL_I[sHL_I];
                this._mergeConsumptionDetails(mapHL_F, sHL_I, tItem);
                if (Object.keys(mapHL_T).length > 0) {
                    // Have Tare
                    for (let sHL_T in mapHL_T) {
                        if (mapHL_T[sHL_T].parentID != sHL_I) {
                            // bypass
                            continue;
                        }
                        let tTare: TidyPackaging = mapHL_T[sHL_T];
                        tTare.Description.ele(XML.Description).att('type', 'Packaging').att(XML.lang, 'en');
                        tTare.PackagingLevelCode.ele('PackagingLevelCode').txt('0001');
                        for (let sHL_P in mapHL_P) {
                            if (mapHL_P[sHL_P].parentID != sHL_T) {
                                // bypass
                                continue;
                            }
                            let tPack: TidyPackaging = mapHL_P[sHL_P];
                            tPack.Description.ele(XML.Description).att('type', 'Material').att(XML.lang, 'en');
                            tPack.PackagingLevelCode.ele('PackagingLevelCode').txt('0002');
                            this._rpl(this._chd(tTare.ShippingContainerSerialCode, 'ShippingContainerSerialCode'),
                                this._ele2(tPack.ShippingContainerSerialCodeReference, 'ShippingContainerSerialCodeReference'));
                            tPack.sendTo(tItem.Packaging.ele('Packaging'));
                        }
                        // need to be sent after tPack
                        tTare.sendTo(tItem.Packaging.ele('Packaging'));
                    }
                } else {
                    // No Tare, so send tPack to ShipNoticiItem.Packaging
                    for (let iHL_P in mapHL_P) {
                        if (mapHL_P[iHL_P].parentID != sHL_I) {
                            // bypass
                            continue;
                        }
                        let tPack: TidyPackaging = mapHL_P[iHL_P];
                        tPack.Description.ele(XML.Description).att('type', 'Material').att(XML.lang, 'en');
                        tPack.sendTo(tItem.Packaging.ele('Packaging'));
                    }
                }

                tItem.sendTo(tPortion.ShipNoticeItem.ele('ShipNoticeItem'));
            }
            tPortion.sendTo(shipNoticeRequest.ele('ShipNoticePortion'));
        }
    }

    private _mergeConsumptionDetails(mapHL_F: MapHL_F, sHL_I: string, tItem: TidyShipNoticeItem) {
        for (let sHL_F in mapHL_F) {
            if (mapHL_F[sHL_F].parentID != sHL_I) {
                // bypass the ComponentConsumptionDetails
                continue;
            }
            mapHL_F[sHL_F].sendTo(tItem.ComponentConsumptionDetails.ele('ComponentConsumptionDetails'));
        }
    }
    /**
     * I:Item
     * @param grpHL 
     */
    private _dealGrpHL_I(grpHL: ASTNode, tItem: TidyShipNoticeItem) {
        let tItemID = new TidyItemID();
        let arrDoneExtrinsic:string[] = [];
        // LIN
        let LIN = this._dSeg1(grpHL, 'LIN');
        let tItemDetail = new TidyShipNoticeItemDetail();
        let tBatch = new TidyBatch();

        for (let i = 2; i <= 30; i++) {
            let vQualifier = this._segVal(LIN, i);
            let v = this._segVal(LIN, i + 1);
            switch (vQualifier) {
                case 'B8':
                    tBatch.SupplierBatchID.ele('SupplierBatchID').txt(v);
                    break;
                case 'BP':
                    this._ele2(tItemID.BuyerPartID, 'BuyerPartID').txt(v);
                    arrDoneExtrinsic.push('customersPartNo');
                    tItem.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, 'customersPartNo')
                        .txt(v);
                    break;
                case 'C3':
                    tItemDetail.Classification.ele('Classification')
                        .att(XML.domain, 'UNSPSC').txt(v);
                    break;
                case 'EN':
                    tItemDetail.ItemDetailIndustry.ele('ItemDetailIndustry')
                        .ele('ItemDetailRetail').ele('EANID').txt(v);
                    this._ele2(tItemID.IdReference, XML.IdReference).att(XML.domain, 'EAN-13')
                        .att(XML.identifier, v);
                    break;
                case 'HD':
                    arrDoneExtrinsic.push('HarmonizedSystemID');
                    tItem.Extrinsic.ele(XML.Extrinsic).att('name', 'HarmonizedSystemID').txt(v);
                    break;
                case 'LT':
                    tBatch.BuyerBatchID.ele('BuyerBatchID').txt(v);

                    break;
                case 'MG':
                    tItemDetail.ManufacturerPartID.ele('ManufacturerPartID').txt(v);
                    break;
                case 'MF':
                    tItemDetail.ManufacturerName.ele('ManufacturerName').txt(v);
                    break;
                case 'PL':
                    tItem.att('lineNumber', v);
                    break;
                case 'SN':
                    tItem.AssetInfo.ele('AssetInfo').att('serialNumber', v);
                    break;
                case 'UP':
                    this._ele2(tItemID.IdReference, XML.IdReference).att(XML.domain, 'UPCConsumerPackageCode')
                        .att(XML.identifier, v);
                    tItem.Extrinsic.ele(XML.Extrinsic).att(XML.nameXML, 'customersBarCodeNumber').txt(v);
                    break;
                case 'VP':
                    this._ele2(tItemID.SupplierPartID, 'SupplierPartID').txt(v);
                    break;
                case 'VS':
                    this._ele2(tItemID.SupplierPartAuxiliaryID, 'SupplierPartAuxiliaryID').txt(v);
                    break;

            } // end  switch(vQualifier)
        } // end for loop i

        // avoid DTD warning
        this._ele2(tItemID.SupplierPartID, 'SupplierPartID');

        tItemID.sendTo(this._ele2(tItem.ItemID, 'ItemID'));

        if (!tBatch.isEmpty()) {
            tBatch.sendTo(tItem.Batch.ele('Batch'));
        }

        // SN1
        let SN1 = this._dSeg1(grpHL, 'SN1');
        if (SN1) {
            let vSN1_2 = this._segVal(SN1, 2);
            let vSN1_3 = this._segVal(SN1, 3);
            let vSN1_5 = this._segVal(SN1, 5);
            let vSN1_6 = this._segVal(SN1, 6);
            tItem.att('quantity', vSN1_2);
            tItem.att('lineNumber', this._segVal(SN1, 1));

            tItem.SN1_QTY_UOM.qty = vSN1_2;
            tItem.SN1_QTY_UOM.uom = vSN1_3;
            tItem.UnitOfMeasure.ele(XML.UnitOfMeasure).txt(vSN1_3);
            if (vSN1_5) {
                let eOrderedQuantity = tItem.OrderedQuantity.ele('OrderedQuantity');
                eOrderedQuantity.att(XML.quantity, vSN1_5);
                if (vSN1_6) {
                    eOrderedQuantity.ele(XML.UnitOfMeasure).txt(vSN1_6);
                    tItemDetail.UnitOfMeasure.ele(XML.UnitOfMeasure).txt(vSN1_6);
                }
            }
        }
        // adjust output order for comparing CIG result
        tItem.att('shipNoticeLineNumber', this._segVal(LIN, 1));
        // SLN
        let SLN = this._dSeg1(grpHL, 'SLN');
        if (SLN) {
            if (this._segVal(SLN, 3) == 'O') {
                tItem.att('lineNumber', this._segVal(SLN, 1));
                this._ele3(tItemDetail.UnitPrice, 'UnitPrice', 'Money').txt(this._segVal(SLN, 6));
            }
        }

        // PO4
        let PO4 = this._dSeg1(grpHL, 'PO4');
        if (PO4 && (this._vBSN05 == '0004')) {
            let vPO4_1 = this._segVal(PO4, 1);
            let vPO4_2 = this._segVal(PO4, 2);
            let vPO4_4 = this._segVal(PO4, 4);
            let vPO4_7 = this._segVal(PO4, 7);
            let vPO4_9 = this._segVal(PO4, 9);
            let vPO4_13 = this._segVal(PO4, 13);

            tItem.PO4_QTY_UOM.qty = (this._float(vPO4_1) * this._float(vPO4_2)).toString();
            tItem.PO4_QTY_UOM.uom = this._segVal(PO4, 3);

            tItem.tPacking.PackagingCode.ele('PackagingCode').att(XML.lang, 'en').txt(MAPS.mapPackaging103[vPO4_4]);
            tItem.tPacking.PackageTypeCodeIdentifierCode.ele('PackageTypeCodeIdentifierCode')
                .txt(vPO4_4);
            tItem.tPacking.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 6)).att('type', 'weight')
                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_7]);
            tItem.tPacking.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 8)).att('type', 'volume')
                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_9]);
            tItem.tPacking.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 10)).att('type', 'length')
                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_13]);
            tItem.tPacking.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 11)).att('type', 'width')
                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_13]);
            tItem.tPacking.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 12)).att('type', 'height')
                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_13]);
        } // end PO4

        // PID
        let PID = this._dSeg1(grpHL, 'PID');
        if (PID) {
            let vPID1 = this._segVal(PID, 1);
            let vPID2 = this._segVal(PID, 2);
            if (vPID1 == 'F') {
                let eDesc = tItemDetail.Description
                    .ele('Description');
                if (vPID2 == 'GEN') {
                    eDesc.ele('ShortName').txt(this._segVal(PID, 5));
                }
                eDesc.att(XML.lang, 'EN');
                eDesc.txt(this._segVal(PID, 5));
            }
        }

        // MEA
        let MEAs = this._dSegs(grpHL, 'MEA');
        MEAs = MEAs ?? [];
        for (let MEA of MEAs) {
            let vMEA1 = this._segVal(MEA, 1);
            let vMEA2 = this._segVal(MEA, 2);
            let vMEA3 = this._segVal(MEA, 3);
            let vMEA401 = this._segVal(MEA, 401);
            if (vMEA1 == 'PD') {
                tItemDetail.Dimension
                    .ele('Dimension').att('type', MAPS.mapMEA738[vMEA2]).att(XML.quantity, vMEA3)
                    .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vMEA401]);
            }
        } // end MEAs loop

        // TD4
        let TD4s = this._dSegs(grpHL, 'TD4');
        TD4s = TD4s ?? [];
        for (let TD4 of TD4s) {
            let vTD4_2 = this._segVal(TD4, 2);
            let vTD4_3 = this._segVal(TD4, 3);
            let vTD4_4 = this._segVal(TD4, 4);
            tItem.Hazard.ele('Hazard').ele(XML.Description).att(XML.lang, 'en-US').txt(vTD4_4)
                .up().ele('Classification').att(XML.domain, MAPS.mapTD4[vTD4_2])
                .txt(vTD4_3);

        }

        // REF
        let REFs = this._dSegs(grpHL, 'REF');
        REFs = REFs ?? [];
        this._iEmptyKey = 0;
        this._commentsLang = '';
        this._mapComments = {};
        this._arrCommentsKeys = [];
        // 0:BestBeforeDate , 1:ExpiryDate, 2:PromotionDealID
        let arrRetailChild: string[] = ['', '', ''];
        for (let REF of REFs) {
            let vREF1 = this._segVal(REF, 1);
            let vREF2 = this._segVal(REF, 2);
            let vREF3 = this._segVal(REF, 3);
            let vREF401 = this._segVal(REF, 401);
            let vREF402 = this._segVal(REF, 402);
            let vREF404 = this._segVal(REF, 404);
            let vREF406 = this._segVal(REF, 406);
            switch (vREF1) {
                case 'FL':
                    tItem.att('parentLineNumber', vREF2)
                        .att('itemType', vREF3);
                    if (vREF401 == 'FL') {
                        tItem.att('compositeItemType', vREF402);
                    }
                    break;
                case 'PD':
                    // PromotionDealID
                    arrRetailChild[2] = vREF3;
                    break;
                case '0L':
                    let eDocInfo = tItem.ReferenceDocumentInfo.ele('ReferenceDocumentInfo')
                        .ele('DocumentInfo');
                    eDocInfo.att('documentID', vREF2).att('documentType', vREF3);
                    if (vREF401 == '0L') {
                        // sample:20160110010000ET
                        eDocInfo.att('documentDate', utils.dateStrFromREFDTM(vREF402));
                    }
                    break;
                case 'BT':
                    let sDate = utils.dateStrFromREFDTM(vREF3, false);
                    let eBatch = this._ele2(tItem.Batch, 'Batch');
                    if (vREF2 == 'productionDate') {
                        eBatch.att('productionDate', sDate);
                    } else if (vREF2 == 'expirationDate') {
                        eBatch.att('expirationDate', sDate);
                    } else if (vREF2 == 'inspectionDate') {
                        eBatch.att('inspectionDate', sDate);
                    } else if (vREF2 == 'shelfLife') {
                        eBatch.att('shelfLife', vREF3);
                    } else if (vREF2 == 'batchQuantity') {
                        eBatch.att('batchQuantity', vREF3);
                    } else if (vREF2 == 'originCountryCode') {
                        eBatch.att('originCountryCode', vREF3);
                    }
                    break;
                case 'L1':
                    if (vREF401 == 'L1' || vREF401 == '0L' || vREF3) {
                        this._commentsParse(REF, vREF2, vREF3, vREF401);
                    }
                    break;
                case 'URL':
                    this._commentUrlParse(REF, vREF2, vREF3, vREF401, vREF402);
                    break;
                case 'ZZ':
                    tItem.Extrinsic.ele('Extrinsic').att('name', vREF2)
                        .txt(vREF3);
                    break;
                default:
                    let vMapped = MAPS.mapREF01_II[vREF1];
                    if (vMapped && !arrDoneExtrinsic.includes(vMapped)) {
                        tItem.Extrinsic.ele('Extrinsic').att('name', MAPS.mapREF01_II[vREF1])
                            .txt(vREF2);
                    }

            } // end switch vREF1
        } // end REFs loop
        // REFs, output concatenated result
        // for all comments without attahcment/url
        this._commentsRender(tItem.Comments);

        // MAN
        let MANs = this._dSegs(grpHL, 'MAN');
        MANs = MANs ?? [];
        for (let MAN of MANs) {
            let vMAN1 = this._segVal(MAN, 1);
            let vMAN2 = this._segVal(MAN, 2);
            let vMAN3 = this._segVal(MAN, 3);
            let vMAN4 = this._segVal(MAN, 4);
            let vMAN5 = this._segVal(MAN, 5);
            let vMAN6 = this._segVal(MAN, 6);
            if (vMAN1 == 'L') {
                let vTag = '';
                let vSN = '';
                switch (vMAN2) {
                    case 'SN':
                        vSN += vMAN3;
                        break;
                    case 'AT':
                        vTag += vMAN3;
                        break;
                }
                switch (vMAN5) {
                    case 'SN':
                        vSN += vMAN6;
                        break;
                    case 'AT':
                        vTag += vMAN6;
                        break;
                }
                let eAssetInfo = tItem.AssetInfo.ele('AssetInfo');
                if (vSN) {
                    eAssetInfo.att('serialNumber', vSN);
                }
                if (vTag) {
                    eAssetInfo.att('tagNumber', vTag);
                }
            } // end if vMAN == 'L'
        } // end loop MANs


        // DTM
        let DTMs = this._dSegs(grpHL, 'DTM');
        DTMs = DTMs ?? [];
        for (let DTM of DTMs) {
            let vDTM1 = this._segVal(DTM, 1);
            let vDTM2 = this._segVal(DTM, 2); // YYYYMMDD
            let vDTM3 = this._segVal(DTM, 3); // HHMMSS
            let vDTM4 = this._segVal(DTM, 4); // TZ

            switch (vDTM1) {
                case '036':
                    // ExpiryDate
                    //arrRetailChild[1] = utils.dateStrFromCCYYMMDD(vDTM2);
                    arrRetailChild[1] = utils.dateStrFromDTM(vDTM2, vDTM3, vDTM4);
                    break;
                case '511':
                    // BestBeforeDate
                    arrRetailChild[0] = utils.dateStrFromDTM(vDTM2, vDTM3, vDTM4);
                    break;
            }
        }
        if (arrRetailChild[0] || arrRetailChild[1] || arrRetailChild[2]) {
            let eRetail = this._ele3(tItem.ShipNoticeItemIndustry, 'ShipNoticeItemIndustry', 'ShipNoticeItemRetail');
            // 0:BestBeforeDate , 1:ExpiryDate, 2:PromotionDealID
            eRetail.ele('BestBeforeDate').att('date', arrRetailChild[0]);
            eRetail.ele('ExpiryDate').att('date', arrRetailChild[1]);
            if (arrRetailChild[2]) {
                eRetail.ele('PromotionDealID').txt(arrRetailChild[2]);
            }
        }

        // CUR
        let CUR = this._dSeg1(grpHL, 'CUR');
        if (CUR) {
            this._ele3(tItemDetail.UnitPrice, 'UnitPrice', 'Money').att(XML.currency, this._segVal(CUR, 2));
        } else {
            // [Otherwise use stored value from either CUR under HL03="S" or CUR under HL03="O"]
            // TODO: should fill data outside of this function
        }

        tItemDetail.sendTo(tItem.ShipNoticeItemDetail.ele('ShipNoticeItemDetail'));
    } // end method


    /**
     * F:Component
     * @param grpHL 
     */
    private _dealGrpHL_F(grpHL: ASTNode, tComp: TidyComponentConsumptionDetails) {
        let LIN = this._dSeg1(grpHL, 'LIN');
        // LIN
        let objProdChild = {
            'BuyerPartID': '',
            'SupplierPartID': '',
            'SupplierPartAuxiliaryID': '',
        }
        for (let i = 2; i <= 30; i++) {
            let vQualifier = this._segVal(LIN, i);
            let v = this._segVal(LIN, i + 1);
            switch (vQualifier) {
                case 'B8':
                    tComp.SupplierBatchID.ele('SupplierBatchID').txt(v);
                    break;
                case 'BP':
                    objProdChild['BuyerPartID'] = v;
                    break;
                case 'LT':
                    tComp.BuyerBatchID.ele('BuyerBatchID').txt(v);
                    break;
                case 'SN':
                    tComp.AssetInfo.ele('AssetInfo').att('serialNumber', v);
                    break;
                case 'VP':
                    objProdChild['SupplierPartID'] = v;
                    break;
                case 'VS':
                    objProdChild['SupplierPartAuxiliaryID'] = v;
                    break;

            } // end  switch(vQualifier)
        } // end for loop i
        let eProduct = this._ele2(tComp.Product, 'Product');
        // need to keep the key order when generationg xml elements
        for (let s of ['SupplierPartID', 'SupplierPartAuxiliaryID', 'BuyerPartID']) {
            eProduct.ele(s).txt(objProdChild[s]);
        }

        // SN1
        let SN1 = this._dSeg1(grpHL, 'SN1');
        if (SN1) {
            let vSN1_2 = this._segVal(SN1, 2);
            let vSN1_3 = this._segVal(SN1, 3);
            tComp.att('quantity', vSN1_2);
            tComp.UnitOfMeasure.ele('UnitOfMeasure').txt(MAPS.mapUOM355[vSN1_3])
        }

        // putting in this location is just for adapting display order in CIG result
        tComp.att('lineNumber', this._segVal(LIN, 1));

        // REF
        let REFs = this._dSegs(grpHL, 'REF');
        REFs = REFs ?? [];
        for (let REF of REFs) {
            let vREF1 = this._segVal(REF, 1);
            let vREF2 = this._segVal(REF, 2);
            let vREF3 = this._segVal(REF, 3);
            switch (vREF1) {
                case 'ZZ':
                    tComp.Extrinsic.ele('Extrinsic').att('name', vREF2)
                        .txt(vREF3);
                    break;
                default:
                // nothing for HL_F
            } // end switch vREF1
        } // end REFs loop

        // MAN
        let MANs = this._dSegs(grpHL, 'MAN');
        MANs = MANs ?? [];
        for (let MAN of MANs) {
            let vMAN1 = this._segVal(MAN, 1);
            let vMAN2 = this._segVal(MAN, 2);
            let vMAN3 = this._segVal(MAN, 3);
            let vMAN4 = this._segVal(MAN, 4);
            let vMAN5 = this._segVal(MAN, 5);
            let vMAN6 = this._segVal(MAN, 6);
            if (vMAN1 == 'L') {
                let vTag = '';
                let vSN = '';
                switch (vMAN2) {
                    case 'SN':
                        vSN += vMAN3;
                        break;
                    case 'AT':
                        vTag += vMAN3;
                        break;
                }
                switch (vMAN5) {
                    case 'SN':
                        vSN += vMAN6;
                        break;
                    case 'AT':
                        vTag += vMAN6;
                        break;
                }
                let eAssetInfo = tComp.AssetInfo.ele('AssetInfo');
                if (vSN) {
                    eAssetInfo.att('serialNumber', vSN);
                }
                if (vTag) {
                    eAssetInfo.att('tagNumber', vTag);
                }
            } // end if vMAN == 'L'
        } // end loop MANs

    }// end method

    /**
     * T:Shipping Tare
     * @param grpHL 
     */
    private _dealGrpHL_T(grpHL: ASTNode, tTare: TidyPackaging) {

        // MEA, dealt before PO4 only because CIG does this way
        let MEAs = this._dSegs(grpHL, 'MEA');
        MEAs = MEAs ?? [];
        let arrExclude = ["HT", "LN", "VOL", "WD", "WT"]
        for (let MEA of MEAs) {
            let vMEA1 = this._segVal(MEA, 1);
            let vMEA2 = this._segVal(MEA, 2);
            let vMEA3 = this._segVal(MEA, 3);
            let vMEA401 = this._segVal(MEA, 401);

            if (vMEA1 == 'PD') {
                if (arrExclude.includes(vMEA2)) {
                    continue;
                }
                tTare.Dimension.ele('Dimension')
                    .att(XML.quantity, vMEA3)
                    .att('type', MAPS.mapMEA738[vMEA2])
                    .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vMEA401]);
            }
        } // end MEAs loop

        // PO4
        let PO4 = this._dSeg1(grpHL, 'PO4');
        if (PO4) {
            let vPO4_1 = this._segVal(PO4, 1);
            let vPO4_2 = this._segVal(PO4, 2);
            let vPO4_4 = this._segVal(PO4, 4);
            let vPO4_7 = this._segVal(PO4, 7);
            let vPO4_9 = this._segVal(PO4, 9);
            let vPO4_13 = this._segVal(PO4, 13);

            tTare.PackagingCode.ele('PackagingCode').att(XML.lang, 'en').txt(MAPS.mapPackaging103[vPO4_4]);
            tTare.PackageTypeCodeIdentifierCode.ele('PackageTypeCodeIdentifierCode')
                .txt(vPO4_4);
            tTare.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 6)).att('type', 'weight')

                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_7]);
            tTare.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 8)).att('type', 'volume')

                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_9]);
            tTare.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 10)).att('type', 'length')

                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_13]);
            tTare.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 11)).att('type', 'width')

                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_13]);
            tTare.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 12)).att('type', 'height')

                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_13]);
        } // end PO4

        // REF
        let REFs = this._dSegs(grpHL, 'REF');
        REFs = REFs ?? [];
        for (let REF of REFs) {
            let vREF1 = this._segVal(REF, 1);
            let vREF2 = this._segVal(REF, 2);
            let vREF3 = this._segVal(REF, 3);
            switch (vREF1) {
                case 'WS':
                    tTare.StoreCode.ele('StoreCode').txt(vREF3);
                    break;
                default:
                // nothing else for HL_T
            } // end switch vREF1
        } // end REFs loop

        // MAN
        let MANs = this._dSegs(grpHL, 'MAN');
        MANs = MANs ?? [];
        let sPackageTrackingID: string;
        let sGlobalIndividualAssetID: string;
        for (let MAN of MANs) {
            let vMAN1 = this._segVal(MAN, 1);
            let vMAN2 = this._segVal(MAN, 2);
            let vMAN3 = this._segVal(MAN, 3);
            let vMAN4 = this._segVal(MAN, 4);
            let vMAN5 = this._segVal(MAN, 5);
            let vMAN6 = this._segVal(MAN, 6);

            switch (vMAN1) {
                case 'GM':
                    if (this._vBSN05 == '0001' || this._vBSN05 == '0002') {
                        tTare.ShippingContainerSerialCode.ele('ShippingContainerSerialCode')
                            .txt(vMAN2);
                        // ShippingContainerSerialCodeReference should be set from outside loop
                        // tTare.ShippingContainerSerialCodeReference.ele('ShippingContainerSerialCodeReference')
                        //     .txt(vMAN2);
                    }
                    break;
                case 'CA':
                    sPackageTrackingID = vMAN2;
                    break;
                case 'ZZ':
                    sGlobalIndividualAssetID = vMAN3;
                    break;
            }

        } // end loop MANs

        // use 2 variables just to make sure the display order of PackageID child elements
        if (sGlobalIndividualAssetID) {
            this._ele2(tTare.PackageID, 'PackageID').ele('GlobalIndividualAssetID').txt(sGlobalIndividualAssetID);
        };
        if (sPackageTrackingID) {
            this._ele2(tTare.PackageID, 'PackageID').ele('PackageTrackingID').txt(sPackageTrackingID);
        };

    }
    /**
     * like HL*4*3*P*1~
     * @param grpHL 
     */
    private _dealGrpHL_P(grpHL: ASTNode, tPack: TidyPackaging) {

        // MEA, deal before PO4 because CIG does this way
        let MEAs = this._dSegs(grpHL, 'MEA');
        MEAs = MEAs ?? [];
        const arrExclude: string[] = ["HT", "LN", "VOL", "WD", "WT"]
        for (let MEA of MEAs) {
            let vMEA1 = this._segVal(MEA, 1);
            let vMEA2 = this._segVal(MEA, 2);
            let vMEA3 = this._segVal(MEA, 3);
            let vMEA401 = this._segVal(MEA, 401);

            switch (vMEA1) {
                case 'PD':
                    if (arrExclude.includes(vMEA2)) {
                        continue;
                    }
                    tPack.Dimension.ele('Dimension').att(XML.quantity, vMEA3)
                        .att('type', MAPS.mapMEA738[vMEA2])
                        .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vMEA401]);
                    break;
            } // end switch vMEA1

        } // end MEAs loop

        // PO4
        let PO4 = this._dSeg1(grpHL, 'PO4');
        if (PO4) {

            let vPO4_1 = this._segVal(PO4, 1);
            let vPO4_2 = this._segVal(PO4, 2);
            let vPO4_4 = this._segVal(PO4, 4);
            let vPO4_7 = this._segVal(PO4, 7);
            let vPO4_9 = this._segVal(PO4, 9);
            let vPO4_13 = this._segVal(PO4, 13);

            // Only when '0002', Pack will do it here
            // otherwise, will use data from HL ITEM, and set from outside loop
            if (this._vBSN05 == '0002' && vPO4_1 && vPO4_2) {
                let eDispatchQuantity = tPack.DispatchQuantity.ele('DispatchQuantity');
                eDispatchQuantity.att(XML.quantity,
                    (this._float(vPO4_1) * this._float(vPO4_2)).toString());
                eDispatchQuantity.ele(XML.UnitOfMeasure).txt(this._segVal(PO4, 3));
            }

            tPack.PackagingCode.ele('PackagingCode').att(XML.lang, 'en').txt(MAPS.mapPackaging103[vPO4_4]);
            tPack.PackageTypeCodeIdentifierCode.ele('PackageTypeCodeIdentifierCode')
                .txt(vPO4_4);
            tPack.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 6)).att('type', 'weight')

                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_7]);
            tPack.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 8)).att('type', 'volume')

                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_9]);
            tPack.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 10)).att('type', 'length')

                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_13]);
            tPack.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 11)).att('type', 'width')

                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_13]);
            tPack.Dimension.ele('Dimension').att(XML.quantity, this._segVal(PO4, 12)).att('type', 'height')

                .ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vPO4_13]);
        } // end PO4

        // REF
        let REFs = this._dSegs(grpHL, 'REF');
        REFs = REFs ?? [];
        for (let REF of REFs) {
            let vREF1 = this._segVal(REF, 1);
            let vREF2 = this._segVal(REF, 2);
            let vREF3 = this._segVal(REF, 3);
            switch (vREF1) {
                case 'WS':
                    tPack.StoreCode.ele('StoreCode').txt(vREF3);
                    break;
                default:
                // nothing else for HL_T
            } // end switch vREF1
        } // end REFs loop

        // MAN
        let MANs = this._dSegs(grpHL, 'MAN');
        MANs = MANs ?? [];
        let sPackageTrackingID: string;
        let sGlobalIndividualAssetID: string;
        for (let MAN of MANs) {
            let vMAN1 = this._segVal(MAN, 1);
            let vMAN2 = this._segVal(MAN, 2);
            let vMAN3 = this._segVal(MAN, 3);
            let vMAN4 = this._segVal(MAN, 4);
            let vMAN5 = this._segVal(MAN, 5);
            let vMAN6 = this._segVal(MAN, 6);

            switch (vMAN1) {
                case 'GM':
                    if (this._vBSN05 == '0001' || this._vBSN05 == '0002') {
                        tPack.ShippingContainerSerialCode.ele('ShippingContainerSerialCode')
                            .txt(vMAN2);
                        // should be set from outside loop
                        // tPack.ShippingContainerSerialCodeReference.ele('ShippingContainerSerialCodeReference')
                        //     .txt(vMAN2);
                    }
                    break;
                case 'CA':
                    sPackageTrackingID = vMAN2;

                    break;
                case 'ZZ':
                    if (vMAN2 == 'GIAI') {
                        sGlobalIndividualAssetID = vMAN3;

                    }
                    break;
            }

        } // end loop MANs
        // just for arrange elements display order;
        if (sGlobalIndividualAssetID) {
            this._ele2(tPack.PackageID, 'PackageID').ele('GlobalIndividualAssetID').txt(sGlobalIndividualAssetID);
        }
        if (sPackageTrackingID) {
            this._ele2(tPack.PackageID, 'PackageID').ele('PackageTrackingID').txt(sPackageTrackingID);
        }
    }

    /**
     * O:Order
     * @param grpHL 
     */
    private _dealGrpHL_O(grpHL: ASTNode, tPortion: TidyShipNoticePortion) {
        let ordRef: XMLBuilder;
        let masterAgreeInfo: XMLBuilder;

        // PRF
        let PRF = this._dSeg1(grpHL, 'PRF');
        if (PRF) {
            let vPRF4 = this._segVal(PRF, 4); // 20160104, usually no HHmmss and TZ
            ordRef = tPortion.OrderReference.ele('OrderReference');
            ordRef.att('orderID', this._segVal(PRF, 1))
                .att('orderDate', utils.dateStrFromCCYYMMDD(vPRF4));
            ordRef.ele(XML.DocumentReference).att(XML.payloadID, '');
            masterAgreeInfo =
                tPortion.MasterAgreementIDInfo.ele('MasterAgreementIDInfo');
            masterAgreeInfo.att(
                'agreementID', this._segVal(PRF, 6)
            );
        }
        // PID
        let PID = this._dSeg1(grpHL, 'PID');
        if (PID) {
            let vPID1 = this._segVal(PID, 1);
            let vPID2 = this._segVal(PID, 2);
            if (vPID1 == 'F' && vPID2 == 'GEN') {
                let eComments = tPortion.Comments.ele('Comments');
                eComments.txt(this._segVal(PID, 5))
                let vPID7 = this._segVal(PID, 7);
                if (vPID7) {
                    eComments.att('type', this._segVal(PID, 7))
                }
                eComments.att(XML.lang, this._segVal(PID, 9));
            }
        }
        // REF
        let REFs = this._dSegs(grpHL, 'REF');
        REFs = REFs ?? [];
        this._iEmptyKey = 0;
        this._commentsLang = '';
        this._mapComments = {};
        this._arrCommentsKeys = [];
        for (let REF of REFs) {
            let vREF1 = this._segVal(REF, 1);
            let vREF2 = this._segVal(REF, 2);
            let vREF3 = this._segVal(REF, 3);
            let vREF401 = this._segVal(REF, 401);
            let vREF402 = this._segVal(REF, 402);
            switch (vREF1) {
                case 'PO':
                    if (!ordRef) {
                        // let PRF take precedence
                        ordRef = tPortion.OrderReference.ele('OrderReference');
                        ordRef.att('orderID', vREF2);
                        ordRef.ele(XML.DocumentReference).att(XML.payloadID, '');
                    }

                    break;
                case 'CT':
                case 'AH':
                    if (!masterAgreeInfo) {
                        // let PRF take precedence
                        masterAgreeInfo = tPortion.MasterAgreementIDInfo.ele('MasterAgreementIDInfo');
                        if (vREF2 == '1') {
                            masterAgreeInfo.att('agreementType', 'scheduling_agreement');
                        }
                        masterAgreeInfo.att('agreementID', vREF3);
                    }

                    break;
                case '0L':
                    let dInfo = tPortion.ReferenceDocumentInfo.ele('ReferenceDocumentInfo')
                        .ele('DocumentInfo');
                    dInfo.att('documentID', vREF2);
                    dInfo.att('documentType', vREF3);

                    dInfo.att('documentDate', utils.dateStrFromREFDTM(this._segVal(REF, 402)));
                    break;
                case 'L1':
                    if (vREF401 == 'L1' || vREF401 == '0L' || vREF3) {
                        this._commentsParse(REF, vREF2, vREF3, vREF401);
                    }
                    break;
                case 'URL':
                    this._commentUrlParse(REF, vREF2, vREF3, vREF401, vREF402);
                    break;
                case 'ZZ':
                    tPortion.Extrinsic.ele('Extrinsic').att('name', vREF2)
                        .txt(vREF3);
                    break;
                default:
                    if (this._mes(MAPS.mapREF01_II, vREF1)) {
                        tPortion.Extrinsic.ele('Extrinsic').att('name', MAPS.mapREF01_II[vREF1])
                            .txt(vREF2);
                    }
            }
        } // end loop REFs
        // REFs, output concatenated result
        // for all comments without attahcment/url
        this._commentsRender(tPortion.Comments);

        // DTM
        let DTMs = this._dSegs(grpHL, 'DTM');
        DTMs = DTMs ?? [];
        for (let DTM of DTMs) {
            let vDTM1 = this._segVal(DTM, 1);
            let vDTM2 = this._segVal(DTM, 2);
            let vDTM3 = this._segVal(DTM, 3);
            let vDTM4 = this._segVal(DTM, 4);
            if (vDTM1 == '004') {
                ordRef = this._ele2(tPortion.OrderReference, 'OrderReference');
                ordRef.att('orderDate', utils.dateStrFromDTM(vDTM2, vDTM3, vDTM4));
            } else if (vDTM1 == 'LEA') {
                masterAgreeInfo = this._ele2(tPortion.MasterAgreementIDInfo, 'MasterAgreementIDInfo');
                masterAgreeInfo.att('agreementDate', utils.dateStrFromDTM(vDTM2, vDTM3, vDTM4));
            }
        }

        // N1 Group
        let grpN1s = this._dGrps(grpHL, 'N1');
        for (let grpN1 of grpN1s) {
            // let N1 = this._dSeg1(grpN1, 'N1');
            // let vN1_1 = this._segVal(N1, 1);
            this._fill_HL_O_N1Grp1(grpN1, tPortion);
        }



    } // end method _dealGrpHL_O

    /**
     * S:Shipment
     * @param grpHL 
     */
    private _dealGrpHL_S(grpHL: ASTNode, tShipHeader: TidyShipNoticeHeader, tControl: TidyShipControl) {
        // PID
        let PID = this._dSeg1(grpHL, 'PID');
        if (PID) {
            tShipHeader.Comments.ele('Comments').txt(this._segVal(PID, 5))
                .att(XML.lang, this._segVal(PID, 9))
        }
        let tPack = new TidyPackaging();

        // MEA
        let MEAs = this._dSegs(grpHL, 'MEA');
        for (let MEA of MEAs) {
            let vMEA1 = this._segVal(MEA, 1);
            let vMEA2 = this._segVal(MEA, 2);
            let vMEA3 = this._segVal(MEA, 3);
            let vMEA401 = this._segVal(MEA, 401);
            // G:grossWeight, VWT:grossVolume, WT:weight
            if (vMEA1 == 'PD' && vMEA2 != 'G' && vMEA2 != 'VWT' && vMEA2 != 'WT') {
                let eDim = tPack.Dimension.ele('Dimension');
                let sXMLType = MAPS.mapMEA738[vMEA2];
                eDim.att('quantity', vMEA3);
                eDim.att('type', sXMLType);
                eDim.ele(XML.UnitOfMeasure).txt(MAPS.mapUOM355[vMEA401]);

            }
        }
        // TD1
        let TD1s = this._dSegs(grpHL, 'TD1');
        let counterTD1: number = 0;
        let vTotalOfpackage1;
        let vTotalOfpackage2;
        for (let TD1 of TD1s) {
            let vTD1_1 = this._segVal(TD1, 1);
            let vTD1_2 = this._segVal(TD1, 2);
            let vTD1_6 = this._segVal(TD1, 6);
            let vTD1_7 = this._segVal(TD1, 7);
            let vTD1_8 = this._segVal(TD1, 8);
            let vTD1_9 = this._segVal(TD1, 9);
            let vTD1_10 = this._segVal(TD1, 10);
            if (vTD1_1) {
                counterTD1++; // only count when vTD1_1 has value
                if (counterTD1 == 1) {
                    vTotalOfpackage1 = vTD1_2;
                } else if (counterTD1 == 2) {
                    vTotalOfpackage2 = vTD1_2
                }
            } else {
                // when vTD1_1 == ''
                switch (vTD1_6) {
                    case 'G':
                        this._ele2(tPack.Dimension, 'Dimension').att('quantity', vTD1_7).att('type', 'grossWeight')
                            .ele(XML.UnitOfMeasure)
                            .txt(MAPS.mapUOM355[vTD1_8]);
                        break;
                    case 'N':
                        this._ele2(tPack.Dimension, 'Dimension').att('quantity', vTD1_7).att('type', 'weight')
                            .ele(XML.UnitOfMeasure)
                            .txt(MAPS.mapUOM355[vTD1_8]);
                        break;
                    case '':
                        this._ele2(tPack.Dimension, 'Dimension').att('quantity', vTD1_9).att('type', 'grossVolume')
                            .ele(XML.UnitOfMeasure)
                            .txt(MAPS.mapUOM355[vTD1_10]);
                        break;
                }
            }
        } // end loop TD1s

        if (!tPack.isEmpty()) {
            tPack.sendTo(tShipHeader.Packaging.ele('Packaging'));
        }
        // if TD1 with TD102 repeat is only 1 map to "totalOfPackages"
        if (counterTD1) {
            if (counterTD1 == 1) {
                tShipHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'totalOfPackages').txt(vTotalOfpackage1);
            } else {
                tShipHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'totalOfPackagesLevel0001').txt(vTotalOfpackage1);
                tShipHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'totalOfPackagesLevel0002').txt(vTotalOfpackage2);
            }
        }
        // TD5
        let TD5s = this._dSegs(grpHL, 'TD5');

        let TD5_ZZ = this._segByEleVal(grpHL, 'TD5', 2, 'ZZ'); // find if there is any TD5_ZZ exist
        TD5s = TD5s ?? [];
        for (let TD5 of TD5s) {
            let vTD5_2 = this._segVal(TD5, 2);
            let vTD5_3 = this._segVal(TD5, 3);
            let vTD5_4 = this._segVal(TD5, 4);
            let vTD5_5 = this._segVal(TD5, 5);
            let vTD5_7 = this._segVal(TD5, 7); // should be 'ZZ'
            let vTD5_8 = this._segVal(TD5, 8);
            let vTD5_12 = this._segVal(TD5, 12);
            let vTD5_13 = this._segVal(TD5, 13);
            let vTD5_14 = this._segVal(TD5, 14);
            if (vTD5_2 != 'ZZ') {
                let eCarrierId = tControl.CarrierIdentifier.ele('CarrierIdentifier');

                eCarrierId.att(XML.domain, MAPS.mapTD502[vTD5_2]);
                eCarrierId.txt(vTD5_3);

                if (!TD5_ZZ) {
                    let eRoute = tControl.Route.ele('Route');
                    if (MAPS.mapTD504_I[vTD5_4]) {
                        eRoute.att('method', MAPS.mapTD504_I[vTD5_4]);
                    } else {
                        eRoute.att('method', 'custom').txt(MAPS.mapTD504_II[vTD5_4]);
                    }
                }

                // Map to cXML [Hardcode/@domain to "companyName"]
                tControl.CarrierIdentifier.ele('CarrierIdentifier').att(XML.domain, 'companyName')
                    .txt(vTD5_5);

                // [Attention: Check if REF*CN is present to map tracking data in addition]
                // tControl.ShipmentIdentifier.ele('ShipmentIdentifier').txt(vTD5_8);
                this._sShipmentIdentifier = vTD5_8;
            } else {
                // vTD5_2 == 'ZZ'
                // <!ELEMENT TransportInformation (Route?, ShippingContractNumber?, ShippingInstructions?)>
                let eTransInfo = tControl.TransportInformation.ele('TransportInformation');
                // Map only if no TD5 exists where TD502="ZZ"
                let eRoute = eTransInfo.ele('Route');
                if (MAPS.mapTD504_I[vTD5_4]) {
                    eRoute.att('method', MAPS.mapTD504_I[vTD5_4]);
                } else {
                    eRoute.att('method', 'custom').txt(MAPS.mapTD504_II[vTD5_4]);
                }
                eTransInfo.ele('ShippingContractNumber').txt(vTD5_3);
                this._ele3(eTransInfo, 'ShippingInstructions', XML.Description)
                    .att(XML.lang, 'en').txt(vTD5_8);

                //  KN: added double mapping (CarrierIdentifier) 
                // in sync with implementation (known defect - waiting for customer request)
                let eCarrierID = this._ele2(tControl.CarrierIdentifier, 'CarrierIdentifier');
                eCarrierID.att(XML.domain, '').txt(vTD5_3);

            }
            for (let vLevel of [vTD5_12, vTD5_13, vTD5_14]) {
                if (vLevel) {
                    tShipHeader.ServiceLevel.ele('ServiceLevel').att('xml:lang', 'en')
                        .txt(MAPS.mapTD512[vLevel]);
                }
            }
        } // end loop TD5s

        // TD3, assume only have one
        let TD3 = this._dSeg1(grpHL, 'TD3');
        if (TD3) {
            let vTD3_1 = this._segVal(TD3, 1);
            let vTD3_2 = this._segVal(TD3, 2);
            let vTD3_3 = this._segVal(TD3, 3);
            let vTD3_9 = this._segVal(TD3, 9);
            let eTermsOfTrans = tShipHeader.TermsOfTransport.ele('TermsOfTransport');
            eTermsOfTrans.ele('SealID').txt(vTD3_9);
            if (vTD3_3) {
                eTermsOfTrans.ele('EquipmentIdentificationCode').txt(vTD3_2 + vTD3_3);
            } else {
                eTermsOfTrans.ele('EquipmentIdentificationCode').txt(MAPS.mapTD3[vTD3_1]);
            }
            eTermsOfTrans.ele(XML.Extrinsic).att('name', 'EquipmentID').txt(vTD3_2 + vTD3_3);

        }

        // TD4
        let TD4s = this._dSegs(grpHL, 'TD4');
        TD4s = TD4s ?? [];
        for (let TD4 of TD4s) {
            let vTD4_1 = this._segVal(TD4, 1);
            let vTD4_2 = this._segVal(TD4, 2);
            let vTD4_3 = this._segVal(TD4, 3);
            let vTD4_4 = this._segVal(TD4, 4);
            if (vTD4_1 == 'ZZZ') {
                let arrTD4 = vTD4_4.split('@');
                if (arrTD4.length > 1) {
                    tControl.CarrierIdentifier.ele('CarrierIdentifier').att(XML.domain, arrTD4[0])
                        .txt(arrTD4[1]);
                }
            } else {
                if (MAPS.mapTD4[vTD4_2]) {
                    let eHazard = tShipHeader.Hazard.ele('Hazard');
                    eHazard.ele(XML.Description).att(XML.lang, 'en-US').txt(vTD4_4);
                    eHazard.ele('Classification').att(XML.domain, MAPS.mapTD4[vTD4_2])
                        .txt(vTD4_3);

                }

            }
        }

        // REF
        let REFs = this._dSegs(grpHL, 'REF');
        REFs = REFs ?? [];
        let tTermOfD = new TidyTermsOfDelivery();
        let FOB = this._dSeg1(grpHL, 'FOB');
        this._iEmptyKey = 0;
        this._commentsLang = '';
        this._mapComments = {};
        this._arrCommentsKeys = [];
        for (let REF of REFs) {
            let vREF1 = this._segVal(REF, 1);
            let vREF2 = this._segVal(REF, 2);
            let vREF3 = this._segVal(REF, 3);
            let vREF401 = this._segVal(REF, 401);
            let vREF402 = this._segVal(REF, 402);
            if (MAPS.mapREF01_I_IdR[vREF1]) {
                tShipHeader.IdReference.ele('IdReference').att(XML.domain, MAPS.mapREF01_I_IdR[vREF1]).att(XML.identifier, vREF3);
            } else if (vREF1 == '0L') {

                switch (vREF2) {
                    case 'FOB05':
                        // Map to cXML [Only if FOB05 is not present][Hardcode/@value to "Other"]
                        // !! That REF is only taken into account if FOB04=ZZ and FOB05=ZZZ due to a previously unknown logic in the code. 
                        if (FOB) {
                            let vFOB04 = this._segVal(FOB, 4);
                            let vFOB05 = this._segVal(FOB, 5);
                            // if (!MAPS.mapFOB05[vFOB05]) {
                            if (vFOB04 == 'ZZ' && vFOB05 == 'ZZZ') {
                                tTermOfD.TransportTerms.ele('TransportTerms').att('value', 'Other').txt(vREF3);
                            }
                        }
                        break;
                    case 'TransportComments':
                        tTermOfD.Comments.ele('Comments').txt(vREF3).att(XML.lang, 'en')
                            .att('type', 'Transport');
                        break;
                    case 'TODComments':
                        tTermOfD.Comments.ele('Comments').txt(vREF3).att(XML.lang, 'en')
                            .att('type', 'TermsOfDelivery');
                        break;
                    default:
                        tShipHeader.ReferenceDocumentInfo.ele('ReferenceDocumentInfo').ele('DocumentInfo')
                            .att('documentID', vREF2)
                            .att('documentType', vREF3)
                            .att('documentDate', utils.dateStrFromREFDTM(vREF402))
                } // end switch
            } else if (vREF1 == '0N') {
                let eTransInfo = this._ele2(tControl.TransportInformation, 'TransportInformation');
                this._ele3(eTransInfo, 'ShippingInstructions', XML.Description)
                    .att(XML.lang, 'en').txt(vREF3);

            } else if (vREF1 == 'CN') {
                tControl.ShipmentIdentifier.ele('ShipmentIdentifier').att(XML.domain, 'trackingNumber')
                    .att('trackingURL', vREF2).att('trackingNumberDate', utils.dateStrFromREFDTM(vREF3)).txt(this._sShipmentIdentifier);
            } else if (vREF1 == 'BM') {
                tControl.ShipmentIdentifier.ele('ShipmentIdentifier').att(XML.domain, 'billOfLading')
                    .txt(vREF2);
            } else if (vREF1 == 'L1' && (vREF401 == 'L1' || vREF401 == '0L')) {
                this._commentsParse(REF, vREF2, vREF3, vREF401);
            } else if (vREF1 == 'URL') {
                this._commentUrlParse(REF, vREF2, vREF3, vREF401, vREF402);
            } else if (MAPS.mapREF01_I_Ext[vREF1]) {
                tShipHeader.Extrinsic.ele(XML.Extrinsic).att('name', MAPS.mapREF01_I_Ext[vREF1])
                    .txt(vREF3)
            } else if (MAPS.mapREF01_II[vREF1]) {
                tShipHeader.Extrinsic.ele(XML.Extrinsic).att('name', MAPS.mapREF01_II[vREF1])
                    .txt(vREF3)
            } else if (vREF1 == 'ZZ') {
                tShipHeader.Extrinsic.ele(XML.Extrinsic).att('name', vREF2)
                    .txt(vREF3)
            }
        } // end loop REF

        // REFs, output concatenated result
        // for all comments without attahcment/url
        this._commentsRender(tShipHeader.Comments);

        // PER
        let PERs = this._dSegs(grpHL, 'PER');
        PERs = PERs ?? [];
        for (let PER of PERs) {
            let vPER1 = this._segVal(PER, 1);
            let vPER2 = this._segVal(PER, 2);
            let vPER9 = this._segVal(PER, 9);
            if (vPER1 == 'ZZ') {
                switch (vPER9) {
                    case 'CompanyCode':
                        tShipHeader.LegalEntity.ele('LegalEntity').ele('IdReference')
                            .att(XML.identifier, vPER2).att(XML.domain, 'CompanyCode');
                        break;
                    // case 'PurchasingOrg':
                    //     tShipHeader.OrganizationalUnit.ele('OrganizationalUnit').ele('IdReference')
                    //         .att(XML.identifier, vPER2).att(XML.domain, 'PurchasingOrganization');
                    //     break;
                    // case 'PurchasingGroup':
                    //     tShipHeader.OrganizationalUnit.ele('OrganizationalUnit').ele('IdReference')
                    //         .att(XML.identifier, vPER2).att(XML.domain, 'PurchasingGroup');
                    //     break;
                }

            } // end if vPER1 == 'ZZ'
        } // end loop PERs

        // DTM
        let DTMs = this._dSegs(grpHL, 'DTM');
        DTMs = DTMs ?? [];
        for (let DTM of DTMs) {
            let vDTM1 = this._segVal(DTM, 1);
            let vDTM2 = this._segVal(DTM, 2);
            let vDTM3 = this._segVal(DTM, 3);
            let vDTM4 = this._segVal(DTM, 4);
            switch (vDTM1) {
                case '111':
                    tShipHeader.att('noticeDate', utils.dateStrFromDTM(vDTM2, vDTM3, vDTM4));
                    break;
                case '011':
                    tShipHeader.att('shipmentDate', utils.dateStrFromDTM(vDTM2, vDTM3, vDTM4));
                    break;
                case '017':
                    tShipHeader.att('deliveryDate', utils.dateStrFromDTM(vDTM2, vDTM3, vDTM4));
                    break;
                case '002':
                    tShipHeader.att('requestedDeliveryDate', utils.dateStrFromDTM(vDTM2, vDTM3, vDTM4));
                    break;
                case '118':
                    tShipHeader.Extrinsic.ele(XML.Extrinsic).att('name', 'PickUpDate')
                        .txt(utils.dateStrFromDTM(vDTM2, vDTM3, vDTM4, 'local'));
                    break;
            }
        }

        // FOB, assume only one
        //let FOB = this._dSeg1(grpHL, 'FOB');
        if (FOB) {
            let vFOB1 = this._segVal(FOB, 1);
            let vFOB2 = this._segVal(FOB, 2);
            let vFOB3 = this._segVal(FOB, 3);
            let vFOB4 = this._segVal(FOB, 4);
            let vFOB5 = this._segVal(FOB, 5);
            let vFOB6 = this._segVal(FOB, 6);
            let vFOB7 = this._segVal(FOB, 7);

            let arrPaymentInclude = ["Account",
                "CashOnDeliveryServiceChargePaidByConsignee",
                "CashOnDeliveryServiceChargePaidByConsignor",
                "InformationCopy-NoPaymentDue",
                "InsuranceCostsPaidByConsignee",
                "InsuranceCostsPaidByConsignor",
                "NotSpecified",
                "PayableElsewhere"]

            let eTermOfDerliveryCode = tTermOfD.TermsOfDeliveryCode.ele('TermsOfDeliveryCode');

            if (vFOB2 == 'ZZ') {
                eTermOfDerliveryCode.att('value', 'Other').txt(vFOB3);
            } else if (vFOB2 == 'ZN') {
                eTermOfDerliveryCode.att('value', '').txt(vFOB3);
            }

            if (!vFOB3) {
                // hardcode TermsOfDeliveryCode to "Other", but only if FOB03 is not present]
                eTermOfDerliveryCode.txt('Other');
            }

            if (MAPS.mapFOB05[vFOB5]) {
                tTermOfD.TransportTerms.ele('TransportTerms').att('value', MAPS.mapFOB05[vFOB5]);
            }

            //Map to cXML if FOB06 is "ZZ". FOB07 always overwrites FOB01. [FOB01 should be "DF", recommendation only]
            if (vFOB6 == 'ZZ') {
                if (["Account",
                    "CashOnDeliveryServiceChargePaidByConsignee",
                    "CashOnDeliveryServiceChargePaidByConsignor",
                    "InformationCopy-NoPaymentDue",
                    "InsuranceCostsPaidByConsignee",
                    "InsuranceCostsPaidByConsignor",
                    "NotSpecified",
                    "PayableElsewhere"].includes(vFOB7)) {
                    tTermOfD.ShippingPaymentMethod.ele('ShippingPaymentMethod').att('value', vFOB7);
                } else {
                    tTermOfD.ShippingPaymentMethod.ele('ShippingPaymentMethod').att('value', 'Other');
                } // end if includes
            } else {
                tTermOfD.ShippingPaymentMethod.ele('ShippingPaymentMethod').att('value', MAPS.mapFOB01[vFOB1]);
            }

        } // end if FOB exists

        // N1
        let grpN1s = this._dGrps(grpHL, 'N1');
        for (let grpN1 of grpN1s) {
            let N1 = this._dSeg1(grpN1, 'N1');
            let vN1_1 = this._segVal(N1, 1);
            if (vN1_1 == 'DA') {
                this._fill_HL_S_N1GrpDA(grpN1, tShipHeader, tTermOfD);
            } else if (MAPS.mapN101[vN1_1]) {
                this._fill_HL_S_N1Grp1(grpN1, tShipHeader);
            }
        }

        // CUR
        // Use wherever/@currency is required in whole message
        let CUR = this._dSeg1(grpHL, 'CUR');
        if (CUR) {
            this._vCUR = this._segVal(CUR, 2);
        }
        if (!tTermOfD.isEmpty()) {
            tTermOfD.sendTo(tShipHeader.TermsOfDelivery.ele('TermsOfDelivery'));
        }
    } // end Method

    protected _commentUrlParse(REF: EdiSegment, vREF2: string, vREF3: string, vREF401: string, vREF402: string) {
        if (!vREF2) {
            vREF2 = ConverterBase.EMPTY_KEY + (++this._iEmptyKey);
        }
        if (!this._arrCommentsKeys.includes(vREF2)) {
            this._arrCommentsKeys.push(vREF2);
        }
        this._mapComments[vREF2] = this._mapComments[vREF2] ?? new Comments();
        let u = new CommentsURL();
        u._txt = vREF3;

        if (vREF401 == '0L') {
            // [If REF C040_127_1= "0L": Map to /URL/@name]
            u._name = vREF402;
        } else if (vREF401 == 'URL') {
            // [If REF C040_127_1= "URL": Concetanete to /URL, next 30 chars]
            u._txt += vREF402;
        }
        u._txt += this._segVal(REF, 404);
        u._txt += this._segVal(REF, 406);
        this._mapComments[vREF2]._urls.push(u);
    }
    protected _commentsParse(REF: EdiSegment, vREF2: string, vREF3: string, vREF401: string) {
        if (!vREF2) {
            vREF2 = ConverterBase.EMPTY_KEY + (++this._iEmptyKey);
        }
        if (!this._arrCommentsKeys.includes(vREF2)) {
            this._arrCommentsKeys.push(vREF2);
        }
        this._mapComments[vREF2] = this._mapComments[vREF2] ?? new Comments();
        this._mapComments[vREF2]._txt = this._mapComments[vREF2]._txt + ' ' + vREF3;
        if (vREF401 == 'L1') {
            this._commentsLang = this._segVal(REF, 402);
            if (!this._mapComments[vREF2]._type) {
                // we only take first occurence of 'type'
                this._mapComments[vREF2]._type = this._segVal(REF, 404) + this._segVal(REF, 406);
            }
        } else if (vREF401 == '0L') {
            if (!this._mapComments[vREF2]._type) {
                // we only take first occurence of 'type'
                this._mapComments[vREF2]._type = this._segVal(REF, 402) + this._segVal(REF, 404) + this._segVal(REF, 406);
            }
        }
        if (!this._commentsLang) {
            this._mapComments[vREF2]._lang = 'EN';
        }
    }
    protected _commentsRender(fComments: XMLBuilder) {
        for (let k of this._arrCommentsKeys) {
            let vComments = this._mapComments[k];
            if (vComments._urls.length > 0) {
                // will do URLs later
                continue;
            }
            let eComments = fComments.ele('Comments');
            eComments.att(XML.lang, vComments._lang);
            if (vComments._type) {
                eComments.att('type', vComments._type);
            }
            eComments.txt(vComments._txt.trim());
        }
        // for all comments with attahcment/url
        for (let k of this._arrCommentsKeys) {
            let vComments = this._mapComments[k];
            if (vComments._urls.length == 0) {
                // bypass comments without urls
                continue;
            }
            let eComments = fComments.ele('Comments');
            eComments.att(XML.lang, vComments._lang);
            if (vComments._type) {
                eComments.att('type', vComments._type);
            }
            for (let u of vComments._urls) {
                let eURL = eComments.ele('Attachment').ele('URL');
                if (u._name) {
                    eURL.att('name', u._name);
                }
                eURL.txt(u._txt);
            }
            eComments.txt(vComments._txt.trim());
        }

    }
    /**
     * vN1_1 : 'DA'
     * @param grpN1 it's group Node and segment Node
     * @param invoiceDetailOrder 
     */
    protected _fill_HL_S_N1GrpDA(grpN1: ASTNode, tShipHeader: TidyShipNoticeHeader, tTermOfD: TidyTermsOfDelivery) {
        let N1 = this._dSeg1(grpN1, 'N1');
        //let eTermofD = tShipHeader.TermsOfDelivery.ele('TermsOfDelivery');
        // let eAddr = tTermOfD.Address.ele('Address');
        let tContact = new TidyContact();
        // N1

        tContact.Name.ele('Name').att(XML.lang, 'en').txt(this._segVal(N1, 2));
        tContact.att('addressID', this._segVal(N1, 4));
        tContact.att('addressIDDomain', MAPS.mapN103[this._segVal(N1, 3)]);

        // N2
        let N2s = this._dSegs(grpN1, 'N2');
        N2s = N2s ?? [];
        let ePostalAddress: XMLBuilder;
        for (let N2 of N2s) {
            if (!ePostalAddress) {
                ePostalAddress = tContact.PostalAddress.ele('PostalAddress');
            }
            ePostalAddress.ele('DeliverTo').txt(
                this._segVal(N2, 1)
            );
            ePostalAddress.ele('DeliverTo').txt(
                this._segVal(N2, 2)
            );
        }
        // N3
        let N3s = this._dSegs(grpN1, 'N3');
        N3s = N3s ?? [];
        for (let N3 of N3s) {
            if (!ePostalAddress) {
                ePostalAddress = tContact.PostalAddress.ele('PostalAddress');
            }
            ePostalAddress.ele('Street').txt(
                this._segVal(N3, 1)
            );
            ePostalAddress.ele('Street').txt(
                this._segVal(N3, 2)
            );
        }

        // N4
        let N4 = this._dSeg1(grpN1, 'N4');
        if (N4) {
            let sCountryCode = this._segVal(N4, 4);
            let vN4_06 = this._segVal(N4, 6);
            if (!ePostalAddress) {
                ePostalAddress = tContact.PostalAddress.ele('PostalAddress');
            }
            ePostalAddress.ele('City').txt(this._segVal(N4, 1));
            // Map to cXML from N402 only if (N405 + ) N406 is not present. 
            if (!vN4_06) {
                ePostalAddress.ele('State').txt(this._segVal(N4, 2));
            } else {
                ePostalAddress.ele('State').txt(this._segVal(N4, 6));
            }
            ePostalAddress.ele('PostalCode').txt(this._segVal(N4, 3));

            ePostalAddress.ele('Country').att('isoCountryCode', sCountryCode).txt(MAPStoXML.mapCountry[sCountryCode]);

        }
        // REF
        let REF = this._dSeg1(grpN1, 'REF');
        if (REF) {
            let vREF1 = this._segVal(REF, 1);
            if (vREF1 == 'ME') {
                if (!ePostalAddress) {
                    ePostalAddress = tContact.PostalAddress.ele('PostalAddress');
                }
                ePostalAddress.att('name', this._segVal(REF, 3));
            }
        }

        // PER assume only one under grpN1
        let PER = this._dSeg1(grpN1, 'PER');
        this._PER(PER, tContact); // end 'if PER exists'
        tContact.sendTo(tTermOfD.Address.ele('Address'));


    } // end method _fillN1GrpDA

    /**
     * vN1_1 : Map to cXML [Lookup required, sheet N1]
     * @param grpN1 it's group Node and segment Node
     * @param invoiceDetailOrder 
     */
    protected _fill_HL_S_N1Grp1(grpN1: ASTNode, tShipHeader: TidyShipNoticeHeader) {
        let N1 = this._dSeg1(grpN1, 'N1');
        let x12Role = this._segVal(N1, 1);
        if (!x12Role || !MAPS.mapN101[x12Role]) {
            return;
        }

        // N1        
        // let eContact = tShipHeader.Contact.ele('Contact');
        let tContact = new TidyContact();
        tContact.att('role', MAPS.mapN101[x12Role]);
        tContact.Name.ele('Name').att(XML.lang, 'en').txt(this._segVal(N1, 2));
        let codeQualifier = MAPS.mapN103[this._segVal(N1, 3)];
        if (codeQualifier) {
            tContact.att('addressID', this._segVal(N1, 4))
            tContact.att('addressIDDomain', codeQualifier);

        }

        // N2
        let arrN2: EdiSegment[] = this._dSegs(grpN1, 'N2');
        let ePostalAddress: XMLBuilder;
        if (arrN2 && arrN2.length > 0) {
            for (let segN2 of arrN2) {
                let ePostalAddress = this._ele2(tContact.PostalAddress, 'PostalAddress')
                let dt1 = this._segVal(segN2, 1);
                let dt2 = this._segVal(segN2, 2);
                if (dt1) {
                    ePostalAddress.ele('DeliverTo').txt(dt1);
                }
                if (dt2) {
                    ePostalAddress.ele('DeliverTo').txt(dt2);
                }
            }
        }

        // N3
        let arrN3: EdiSegment[] = this._dSegs(grpN1, 'N3');
        if (arrN3 && arrN3.length > 0) {
            for (let segN3 of arrN3) {
                ePostalAddress = this._ele2(tContact.PostalAddress, 'PostalAddress')
                let dt1 = this._segVal(segN3, 1);
                let dt2 = this._segVal(segN3, 2);
                if (dt1) {
                    ePostalAddress.ele('Street').txt(dt1);
                }
                if (dt2) {
                    ePostalAddress.ele('Street').txt(dt2);
                }
            }
        }

        this._X12N4(grpN1, tContact);

        // REF
        let REFs = this._dSegs(grpN1, 'REF');
        REFs = REFs ?? [];
        let fIdRefs = tContact.IdReference;
        for (let REF of REFs) {
            let vREF1 = this._segVal(REF, 1);
            let vREF2 = this._segVal(REF, 2);
            let vREF3 = this._segVal(REF, 3);
            if (MAPS.mapN1REF128_I[vREF1]) {
                fIdRefs.ele(XML.IdReference).att(XML.identifier, vREF3).att(XML.domain, MAPS.mapN1REF128_I[vREF1]);

            } else if (MAPS.mapN1REF128_II[vREF1]) {
                fIdRefs.ele(XML.IdReference).att(XML.identifier, vREF2 + vREF3).att(XML.domain, MAPS.mapN1REF128_II[vREF1]);
            }
            // can co-exists with IdReference
            if (vREF1 == 'ME' && ePostalAddress) {
                ePostalAddress.att('name', vREF3);
            }
        }

        // PER assume only one under grpN1
        let PER = this._dSeg1(grpN1, 'PER');
        if (PER) {
            let vPER1 = this._segVal(PER, 1);
            let vPER2 = this._segVal(PER, 2); // always @name for TE/FX/EM/UR          
            if (vPER1 == 'CN') {
                for (let i = 3; i <= 7; i = i + 2) {
                    let v = this._segVal(PER, i + 1);
                    let arrV = v.split('-');
                    switch (this._segVal(PER, i)) {
                        case 'TE':
                            tContact.Phone.ele('Phone').att('name', vPER2).ele('TelephoneNumber')
                                .ele('CountryCode').att('isoCountryCode', this._arrVal(arrV, 0)).txt(MAPStoXML.mapCountry[this._arrVal(arrV, 0)])
                                .up().ele('AreaOrCityCode').txt(this._arrVal(arrV, 1))
                                .up().ele('Number').txt(this._arrVal(arrV, 2))
                            break;
                        case 'FX':
                            tContact.Fax.ele('Fax').att('name', vPER2).ele('TelephoneNumber')
                                .ele('CountryCode').att('isoCountryCode', '').txt(this._arrVal(arrV, 0))
                                .up().ele('AreaOrCityCode').txt(this._arrVal(arrV, 1))
                                .up().ele('Number').txt(this._arrVal(arrV, 2))
                            break;
                        case 'EM':
                            tContact.Email.ele('Email').att('name', vPER2)
                                .txt(v);
                            break;
                        case 'UR':
                            tContact.URL.ele('URL').att('name', vPER2)
                                .txt(v);
                            break;
                    }
                }
            } // end vPER1 == 'CN'
        } // end if PER
        tContact.sendTo(tShipHeader.Contact.ele('Contact'));
    } // end method _fillN1Grp

    /**
     * vN1_1 : Map to cXML [Lookup required, sheet N1]
     * @param grpN1 it's group Node and segment Node
     * @param invoiceDetailOrder 
     */
    protected _fill_HL_O_N1Grp1(grpN1: ASTNode, tPortion: TidyShipNoticePortion) {
        let N1 = this._dSeg1(grpN1, 'N1');
        let x12Role = this._segVal(N1, 1);
        if (!x12Role || !MAPS.mapN101[x12Role]) {
            return;
        }

        // N1        
        // let eContact = tPortion.Contact.ele('Contact');
        let tContact = new TidyContact();
        tContact.att('role', MAPS.mapN101[x12Role]);
        tContact.Name.ele('Name').att(XML.lang, 'en').txt(this._segVal(N1, 2));
        let codeQualifier = MAPS.mapN103[this._segVal(N1, 3)];
        if (codeQualifier) {
            tContact.att('addressID', this._segVal(N1, 4))
            tContact.att('addressIDDomain', codeQualifier);

        }

        // N2
        let arrN2: EdiSegment[] = this._dSegs(grpN1, 'N2');
        let ePostalAddress: XMLBuilder;
        if (arrN2 && arrN2.length > 0) {
            for (let segN2 of arrN2) {
                let ePostalAddress = this._ele2(tContact.PostalAddress, 'PostalAddress')
                let dt1 = this._segVal(segN2, 1);
                let dt2 = this._segVal(segN2, 2);
                if (dt1) {
                    ePostalAddress.ele('DeliverTo').txt(dt1);
                }
                if (dt2) {
                    ePostalAddress.ele('DeliverTo').txt(dt2);
                }
            }
        }

        // N3
        let arrN3: EdiSegment[] = this._dSegs(grpN1, 'N3');
        if (arrN3 && arrN3.length > 0) {
            for (let segN3 of arrN3) {
                ePostalAddress = this._ele2(tContact.PostalAddress, 'PostalAddress')
                let dt1 = this._segVal(segN3, 1);
                let dt2 = this._segVal(segN3, 2);
                if (dt1) {
                    ePostalAddress.ele('Street').txt(dt1);
                }
                if (dt2) {
                    ePostalAddress.ele('Street').txt(dt2);
                }
            }
        }

        this._X12N4(grpN1, tContact);

        // REF
        let REFs = this._dSegs(grpN1, 'REF');
        REFs = REFs ?? [];
        let fIdRefs = tContact.IdReference;
        for (let REF of REFs) {
            let vREF1 = this._segVal(REF, 1);
            let vREF2 = this._segVal(REF, 2);
            let vREF3 = this._segVal(REF, 3);
            if (MAPS.mapN1REF128_I[vREF1]) {
                fIdRefs.ele(XML.IdReference).att(XML.identifier, vREF3).att(XML.domain, MAPS.mapN1REF128_I[vREF1]);

            } else if (MAPS.mapN1REF128_II[vREF1]) {
                fIdRefs.ele(XML.IdReference).att(XML.identifier, vREF2 + vREF3).att(XML.domain, MAPS.mapN1REF128_II[vREF1]);
            }
            // can co-exists with IdReference
            if (vREF1 == 'ME' && ePostalAddress) {
                ePostalAddress.att('name', vREF3);
            }
        }

        // PER assume only one under grpN1
        let PER = this._dSeg1(grpN1, 'PER');
        if (PER) {
            let vPER1 = this._segVal(PER, 1);
            let vPER2 = this._segVal(PER, 2); // always @name for TE/FX/EM/UR          
            if (vPER1 == 'CN') {
                for (let i = 3; i <= 7; i = i + 2) {
                    let v = this._segVal(PER, i + 1);
                    let arrV = v.split('-');
                    switch (this._segVal(PER, i)) {
                        case 'TE':
                            tContact.Phone.ele('Phone').att('name', vPER2).ele('TelephoneNumber')
                                .ele('CountryCode').att('isoCountryCode', this._arrVal(arrV, 0)).txt(MAPStoXML.mapCountry[this._arrVal(arrV, 0)])
                                .up().ele('AreaOrCityCode').txt(this._arrVal(arrV, 1))
                                .up().ele('Number').txt(this._arrVal(arrV, 2))
                            break;
                        case 'FX':
                            tContact.Fax.ele('Fax').att('name', vPER2).ele('TelephoneNumber')
                                .ele('CountryCode').att('isoCountryCode', '').txt(this._arrVal(arrV, 0))
                                .up().ele('AreaOrCityCode').txt(this._arrVal(arrV, 1))
                                .up().ele('Number').txt(this._arrVal(arrV, 2))
                            break;
                        case 'EM':
                            tContact.Email.ele('Email').att('name', vPER2)
                                .txt(v);
                            break;
                        case 'UR':
                            tContact.URL.ele('URL').att('name', vPER2)
                                .txt(v);
                            break;
                    }
                }
            } // end vPER1 == 'CN'
        } // end if PER
        tContact.sendTo(tPortion.Contact.ele('Contact'));
    } // end method _fillN1Grp

} // end class


export class MAPS {

    static mapBSN353: Object = {
        "00": "new",
        "03": "delete",
        "05": "update",
    };
    static mapBSN640: Object = {
        "09": "actual",
        "PL": "planned",
    };
    static mapBSN641: Object = {
        "C20": "complete",
        "B44": "partial",
    };
    static mapMEA738: Object = {
        "G": "grossWeight",
        "GW": "unitGrossWeight",
        "HT": "height",
        "LN": "length",
        "N": "unitNetWeight",
        "VOL": "volume",
        "VWT": "grossVolume",
        "WD": "width",
        "WT": "weight",
    };

    static mapUOM355: Object = {
        "05": "5",
        "04": "6",
        "08": "8",
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
        "AG": "A11",
        "79": "A53",
        "AA": "AA",
        "AB": "AB",
        "AC": "ACR",
        "KU": "ACT",
        "AD": "AD",
        "AE": "AE",
        "AH": "AH",
        "AI": "AI",
        "AJ": "AJ",
        "AK": "AK",
        "AL": "AL",
        "AM": "AM",
        "68": "AMP",
        "YR": "ANN",
        "AP": "AP",
        "TO": "APZ",
        "AQ": "AQ",
        "AR": "AR",
        "AS": "AS",
        "AT": "ATM",
        "AV": "AV",
        "AW": "AW",
        "AY": "AY",
        "AZ": "AZ",
        "B0": "B0",
        "B1": "B1",
        "B2": "B2",
        "B3": "B3",
        "3F": "B35",
        "B4": "B4",
        "B5": "B5",
        "B6": "B6",
        "B7": "B7",
        "B9": "B9",
        "BB": "BB",
        "B8": "BD",
        "BD": "BE",
        "BF": "BFT",
        "BG": "BG",
        "BH": "BH",
        "BQ": "BHP",
        "BC": "BJ",
        "BS": "BK",
        "BA": "BL",
        "BR": "BLL",
        "BO": "BO",
        "BP": "BP",
        "R2": "BQL",
        "BI": "BR",
        "BM": "BT",
        "BY": "BTU",
        "BU": "BUA",
        "BV": "BUI",
        "BW": "BW",
        "BX": "BX",
        "BZ": "BZ",
        "C0": "C0",
        "C1": "C1",
        "C2": "C2",
        "F5": "C34",
        "C4": "C4",
        "C5": "C5",
        "C6": "C6",
        "UN": "C62",
        "C7": "C7",
        "PJ": "C77",
        "RB": "C81",
        "C9": "C9",
        "CN": "CA",
        "CE": "CEL",
        "HU": "CEN",
        "CG": "CG",
        "AF": "CGM",
        "Z2": "CH",
        "CJ": "CJ",
        "CK": "CK",
        "CX": "CL",
        "C3": "CLT",
        "SC": "CMK",
        "CC": "CMQ",
        "CM": "CMT",
        "CH": "CN",
        "4F": "CNP",
        "CB": "CO",
        "65": "COU",
        "CQ": "CQ",
        "CP": "CR",
        "CA": "CS",
        "CT": "CT",
        "CD": "CTM",
        "CU": "CU",
        "4D": "CUR",
        "CV": "CV",
        "CW": "CWA",
        "HW": "CWI",
        "CL": "CY",
        "CZ": "CZ",
        "TU": "D14",
        "N4": "D23",
        "D5": "D5",
        "BK": "D63",
        "BL": "D64",
        "RO": "D65",
        "CS": "D66",
        "A8": "D67",
        "SA": "D7",
        "BE": "D79",
        "D8": "D8",
        "D9": "D9",
        "CO": "D90",
        "R8": "D91",
        "BJ": "D92",
        "JG": "D95",
        "PG": "D96",
        "PL": "D97",
        "PU": "D98",
        "SL": "D99",
        "DA": "DAY",
        "DB": "DB",
        "DC": "DC",
        "DD": "DD",
        "DE": "DE",
        "DG": "DG",
        "DI": "DI",
        "DJ": "DJ",
        "DL": "DLT",
        "D3": "DMK",
        "C8": "DMQ",
        "DM": "DMT",
        "DN": "DN",
        "DP": "DPR",
        "DQ": "DQ",
        "DR": "DR",
        "DF": "DRA",
        "DS": "DS",
        "DT": "DT",
        "DU": "DU",
        "WP": "DWT",
        "DX": "DX",
        "DY": "DY",
        "DZ": "DZN",
        "BT": "E2",
        "NT": "E3",
        "GT": "E4",
        "MT": "E5",
        "JA": "E51",
        "EA": "EA",
        "EB": "EB",
        "EC": "EC",
        "EP": "EP",
        "EQ": "EQ",
        "EV": "EV",
        "F1": "F1",
        "F9": "F9",
        "FA": "FAH",
        "83": "FAR",
        "FB": "FB",
        "FC": "FC",
        "FD": "FD",
        "FE": "FE",
        "FF": "FF",
        "FG": "FG",
        "FH": "FH",
        "FL": "FL",
        "FM": "FM",
        "FT": "FOT",
        "FP": "FP",
        "FR": "FR",
        "FS": "FS",
        "SF": "FTK",
        "CF": "FTQ",
        "G2": "G2",
        "G3": "G3",
        "G7": "G7",
        "GB": "GB",
        "G4": "GBQ",
        "GC": "GC",
        "GD": "GD",
        "GE": "GE",
        "GG": "GGR",
        "GH": "GH",
        "G5": "GII",
        "GJ": "GJ",
        "GK": "GK",
        "GL": "GL",
        "GI": "GLI",
        "GA": "GLL",
        "GM": "GM",
        "GN": "GN",
        "GO": "GO",
        "GP": "GP",
        "GQ": "GQ",
        "GR": "GRM",
        "GX": "GRN",
        "GS": "GRO",
        "TG": "GT",
        "GV": "GV",
        "GW": "GW",
        "GY": "GY",
        "GZ": "GZ",
        "H1": "H1",
        "H2": "H2",
        "PC": "H87",
        "HA": "HA",
        "HQ": "HAR",
        "HB": "HBX",
        "HC": "HC",
        "HD": "HD",
        "HE": "HE",
        "HF": "HF",
        "HG": "HGM",
        "HH": "HH",
        "HI": "HI",
        "HJ": "HJ",
        "HK": "HK",
        "HL": "HL",
        "H4": "HLT",
        "HM": "HM",
        "E1": "HMT",
        "HN": "HN",
        "HO": "HO",
        "HP": "HP",
        "HS": "HS",
        "HT": "HT",
        "HZ": "HTZ",
        "HR": "HUR",
        "HY": "HY",
        "IA": "IA",
        "IC": "IC",
        "IE": "IE",
        "IF": "IF",
        "II": "II",
        "IL": "IL",
        "IM": "IM",
        "IN": "INH",
        "SI": "INK",
        "CI": "INQ",
        "IP": "IP",
        "IT": "IT",
        "IU": "IU",
        "IV": "IV",
        "J2": "J2",
        "JB": "JB",
        "JE": "JE",
        "JU": "JG",
        "JK": "JK",
        "JM": "JM",
        "JO": "JO",
        "86": "JOU",
        "JR": "JR",
        "K1": "K1",
        "K2": "K2",
        "K3": "K3",
        "K5": "K5",
        "K6": "K6",
        "KA": "KA",
        "KB": "KB",
        "KD": "KD",
        "KV": "KEL",
        "KF": "KF",
        "KE": "KG",
        "KG": "KGM",
        "KI": "KI",
        "KJ": "KJ",
        "KL": "KL",
        "KP": "KMH",
        "8U": "KMK",
        "KC": "KMQ",
        "DK": "KMT",
        "EH": "KNT",
        "KO": "KO",
        "KQ": "KPA",
        "KR": "KR",
        "KS": "KS",
        "KT": "KT",
        "K4": "KVA",
        "KW": "KW",
        "KH": "KWH",
        "K7": "KWT",
        "KX": "KX",
        "L2": "L2",
        "LA": "LA",
        "LB": "LBR",
        "TX": "LBT",
        "LC": "LC",
        "LQ": "LD",
        "LE": "LE",
        "X7": "LEF",
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
        "LG": "LTN",
        "LT": "LTR",
        "LX": "LX",
        "LY": "LY",
        "M0": "M0",
        "M1": "M1",
        "M4": "M4",
        "M5": "M5",
        "M7": "M7",
        "M9": "M9",
        "MA": "MA",
        "TM": "MBF",
        "M6": "MBR",
        "MC": "MC",
        "MU": "MCU",
        "MD": "MD",
        "MF": "MF",
        "ME": "MGM",
        "N6": "MHZ",
        "SB": "MIK",
        "TH": "MIL",
        "MJ": "MIN",
        "MK": "MK",
        "ML": "MLT",
        "MS": "MMK",
        "MM": "MMT",
        "MO": "MON",
        "M8": "MPA",
        "MQ": "MQ",
        "4V": "MQH",
        "4J": "MSK",
        "M3": "MT",
        "SM": "MTK",
        "CR": "MTQ",
        "MR": "MTR",
        "4I": "MTS",
        "MV": "MV",
        "T9": "MWH",
        "N1": "N1",
        "N2": "N2",
        "N3": "N3",
        "NA": "NA",
        "NB": "NB",
        "NC": "NC",
        "ND": "ND",
        "NE": "NE",
        "NW": "NEW",
        "NF": "NF",
        "NG": "NG",
        "NH": "NH",
        "NI": "NI",
        "NJ": "NJ",
        "NL": "NL",
        "NM": "NMI",
        "NN": "NN",
        "NQ": "NQ",
        "NR": "NR",
        "MN": "NT",
        "NU": "NU",
        "NV": "NV",
        "NX": "NX",
        "NY": "NY",
        "OA": "OA",
        "82": "OHM",
        "ON": "ON",
        "OP": "OP",
        "OT": "OT",
        "OZ": "OZ",
        "FO": "OZA",
        "FZ": "OZI",
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
        "12": "PA",
        "4S": "PAL",
        "PB": "PB",
        "PD": "PD",
        "PE": "PE",
        "PF": "PF",
        "PP": "PG",
        "PI": "PI",
        "PK": "PK",
        "PA": "PL",
        "PM": "PM",
        "PN": "PN",
        "PO": "PO",
        "PQ": "PQ",
        "PR": "PR",
        "PS": "PS",
        "PT": "PT",
        "Q2": "PTD",
        "PX": "PTI",
        "TY": "PU",
        "PV": "PV",
        "PW": "PW",
        "PY": "PY",
        "PZ": "PZ",
        "Q3": "Q3",
        "QA": "QA",
        "Q1": "QAN",
        "QB": "QB",
        "QD": "QD",
        "QH": "QH",
        "QK": "QK",
        "QR": "QR",
        "QT": "QT",
        "QS": "QTD",
        "QU": "QTI",
        "R1": "R1",
        "R4": "R4",
        "R9": "R9",
        "RA": "RA",
        "RD": "RD",
        "RG": "RG",
        "RH": "RH",
        "RK": "RK",
        "RE": "RL",
        "RM": "RM",
        "RN": "RN",
        "RL": "RO",
        "RP": "RP",
        "R3": "RPM",
        "RS": "RS",
        "RT": "RT",
        "RU": "RU",
        "S3": "S3",
        "S4": "S4",
        "S5": "S5",
        "S6": "S6",
        "S7": "S7",
        "S8": "S8",
        "SJ": "SA",
        "SD": "SD",
        "SE": "SE",
        "03": "SEC",
        "ST": "SET",
        "SG": "SG",
        "67": "SIE",
        "SK": "SK",
        "S9": "SL",
        "02": "SMI",
        "SN": "SN",
        "SO": "SO",
        "SP": "SP",
        "SQ": "SQ",
        "SR": "SR",
        "SS": "SS",
        "SH": "ST",
        "TN": "STN",
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
        "MP": "TNE",
        "TP": "TP",
        "TQ": "TQ",
        "TR": "TR",
        "TS": "TS",
        "TT": "TT",
        "TB": "TU",
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
        "70": "VLT",
        "BN": "VQ",
        "VS": "VS",
        "W2": "W2",
        "WA": "WA",
        "WB": "WB",
        "8C": "WCD",
        "WE": "WE",
        "WK": "WEE",
        "WG": "WG",
        "WH": "WH",
        "WI": "WI",
        "WM": "WM",
        "WR": "WR",
        "99": "WTT",
        "WW": "WW",
        "X1": "X1",
        "SY": "YDK",
        "CY": "YDQ",
        "YL": "YL",
        "YD": "YRD",
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

    static mapPackaging103: Object = {
        "AMM": "Ammo Pack",
        "AMP": "Ampoule",
        "ATH": "Attachment",
        "BAG": "Bag",
        "BAL": "Bale",
        "BBL": "Barrel",
        "BDG": "Banding",
        "BDL": "Bundle",
        "BEM": "Beam",
        "BIC": "Bing Chest",
        "BIN": "Bin",
        "BLK": "Bulk",
        "BLT": "Belting",
        "BOB": "Bobbin",
        "BOT": "Bottle",
        "BOX": "Box",
        "BRC": "Bracing",
        "BRG": "Barge",
        "BSK": "Basket or hamper",
        "BXI": "Box, with inner container",
        "BXT": "Bucket",
        "CAB": "Cabinet",
        "CAG": "Cage",
        "CAN": "Can",
        "CAR": "Carrier",
        "CAS": "Case",
        "CBC": "Containers of Bulk Cargo",
        "CBY": "Carboy",
        "CCS": "Can Case",
        "CHE": "Cheeses",
        "CHS": "Chest",
        "CLD": "Car Load, Rail",
        "CNA": "Household Goods Container, Wood",
        "CNB": "Container, MAC-ISO, LT. WGT. 8x8x20 Foot Air",
        "CNC": "Container, Navy Cargo Transporter",
        "CND": "Container, Commercial Highway Lift",
        "CNE": "Container, Engine",
        "CNF": "Container, Multi-walled, Secured to Warehouse Pallet",
        "CNT": "Container",
        "COL": "Coil",
        "CON": "Cones",
        "COR": "Core",
        "CRD": "Cradle",
        "CRF": "Corner Reinforcement",
        "CRT": "Crate",
        "CSK": "Cask",
        "CTN": "Carton",
        "CX2": "CONEX",
        "CYL": "Cylinder",
        "DBK": "Dry Bulk",
        "DRK": "Double-length Rack",
        "DRM": "Drum",
        "DSK": "Double-length Skid",
        "DTB": "Double-length Tote Bin",
        "DUF": "Duffelbag",
        "EGG": "Egg Crating",
        "ENV": "Envelope",
        "EPR": "Edge Protection",
        "FIR": "Firkin",
        "FLO": "Flo-bin",
        "FRM": "Frame",
        "FSK": "Flask",
        "FWR": "Forward Reel",
        "HED": "Heads of Beef",
        "HGH": "Hogshead",
        "HPR": "Hamper",
        "HPT": "Hopper Truck",
        "HRB": "On Hanger or Rack in Boxes",
        "HRK": "Half-Standard Rack",
        "HTB": "Half-Standard Tote Bin",
        "INT": "Intermediate Container",
        "JAR": "Jar",
        "KEG": "Keg",
        "KIT": "Kit",
        "KRK": "Knockdown Rack",
        "KTB": "Knockdown Tote Bin",
        "LBK": "Liquid Bulk",
        "LID": "Lip/Top",
        "LIF": "Lifts",
        "LNR": "Liners",
        "LOG": "Log",
        "LSE": "Loose",
        "LUG": "Lug",
        "LVN": "Lift Van",
        "MIX": "Mixed Container Types",
        "ML2": "MILVAN",
        "MRP": "Multi-Roll Pack",
        "MS2": "MSCVAN",
        "MXD": "Mixed",
        "NOL": "Noil",
        "PAF": "Pallet - 4 Way",
        "PAL": "Pail",
        "PAT": "Pallet - 2 Way",
        "PCK": "Packed - not otherwise specified",
        "PCS": "Pieces",
        "PIR": "Pirns",
        "PKG": "Package",
        "PLC": "Primary Lift Container",
        "PLF": "Platform",
        "PLN": "Pipeline",
        "PLT": "Pallet",
        "POV": "Private Vehicle",
        "PRK": "Pipe Rack",
        "PRT": "Partitioning",
        "PWT": "Plastic-Wrapped Tray",
        "QTR": "Quarter of Beef",
        "RAL": "Rail (Semiconductor)",
        "RCK": "Rack",
        "REL": "Reel",
        "RFT": "Reinforcement",
        "ROL": "Roll",
        "RVR": "Reverse Reel",
        "SAK": "Sack",
        "SCS": "Suitcase",
        "SHK": "Shook",
        "SHT": "Sheet",
        "SID": "Side of Beef",
        "SKD": "Skid",
        "SKE": "Skid, elevating or lift truck",
        "SLP": "Slip Sheet",
        "SLV": "Sleeve",
        "SPI": "Spin Cylinders",
        "SPL": "Spool",
        "SPR": "Separator/Divider",
        "SRW": "Shrink Wrap",
        "STW": "Stretch Wrap",
        "SV2": "SEAVAN",
        "TBE": "Tube",
        "TBN": "Tote Bin",
        "TKR": "Tank Car",
        "TKT": "Tank Truck",
        "TLD": "Intermodal Trailer/Container Load (Rail)",
        "TNK": "Tank",
        "TRC": "Tierce",
        "TRK": "Trunk and Chest",
        "TRU": "Truck",
        "TRY": "Tray",
        "TSS": "Trunk, Salesmen Sample",
        "TUB": "Tub",
        "UNP": "Unpacked",
        "UNT": "Unit",
        "VEH": "Vehicles",
        "VIL": "Vial",
        "VOC": "Vehicle in Operating Condition",
        "VPK": "Van Pack",
        "WHE": "On Own Wheel",
        "WLC": "Wheeled Carrier",
        "WRP": "Wrapped",
        "01": "Aluminum",
        "04": "As Specified by the DOT",
        "07": "Burlap",
        "10": "Chemically Hardened Fibre",
        "13": "Cloth",
        "16": "Cloth Top",
        "19": "Cloth or Fabric",
        "22": "Compressed",
        "25": "Corrugated or Solid",
        "28": "Double-wall Paper",
        "31": "Fibre",
        "34": "Fibre (Paperboard)",
        "37": "Fiberboard",
        "40": "Fiberboard Metal",
        "43": "Glass",
        "46": "In Inner Containers",
        "48": "Wire/Cord",
        "49": "Insulated",
        "50": "Steel - Vinyl Coated",
        "51": "Wire Mesh",
        "52": "Iron or Steel",
        "53": "Jumbo",
        "54": "Special Jumbo",
        "55": "Lead",
        "58": "Metal",
        "59": "Metal Cans",
        "61": "Moisture Resistant",
        "64": "Molded Plastic",
        "67": "Multiple-wall Paper (2 or more walls)",
        "70": "Multiple-wall Paper (3 or more walls)",
        "71": "Not Otherwise Specified",
        "72": "Paper - VCI",
        "73": "Other than Glass",
        "74": "Other than Metal or Plastic Tubes, or Glass",
        "75": "Plastic - Vacuum Formed",
        "76": "Paper",
        "77": "Plastic - Structural Foam",
        "78": "Plastic - Injection Molded",
        "79": "Plastic",
        "80": "Polyethylene Lined",
        "81": "Plastic - Virgin",
        "82": "Pulpboard",
        "83": "Plastic - Regrind",
        "84": "Polystyrene",
        "85": "Rubber",
        "86": "Foam",
        "88": "Rubber and Fabric",
        "89": "Special",
        "90": "Standard",
        "91": "Stainless Steel",
        "92": "Tubes, Metal or Plastic",
        "94": "Wood",
        "95": "Single Wall Corrugated Board",
        "96": "Double Wall Corrugated Board",
        "97": "Triple Wall Corrugated Board",

    };

    static mapTD502: Object = {
        "1": "DUNS",
        "2": "SCAC",
        "4": "IATA",

    };
    static mapTD504_I: Object = {
        "A": "air",
        "7": "mail",
        "J": "motor",
        "R": "rail",
        "S": "ship",
        "W": "inlandWater",
        "X": "multimodal",
    };

    static mapTD504_II: Object = {
        "6": "Military Official Mail",
        "7": "Mail",
        "A": "Air",
        "AC": "Air Charter",
        "AE": "Air Express",
        "AF": "Air Freight",
        "AH": "Air Taxi",
        "AR": "Armed Forces Courier Service (ARFCOS)",
        "B": "Barge",
        "BP": "Book Postal",
        "BU": "Bus",
        "C": "Consolidation",
        "CE": "Customer Pickup / Customer's Expense",
        "D": "Parcel Post",
        "DA": "Driveaway Service",
        "DW": "Driveaway, Truckaway, Towaway",
        "E": "Expedited Truck",
        "ED": "European or Pacific Distribution System",
        "F": "Flyaway",
        "FA": "Air Freight Forwarder",
        "FL": "Motor (Flatbed)",
        "GG": "Geographic Receiving/Shipping",
        "GR": "Geographic Receiving",
        "GS": "Geographic Shipping",
        "H": "Customer Pickup",
        "HH": "Household Goods Truck",
        "I": "Common Irregular Carrier",
        "J": "Motor",
        "K": "Backhaul",
        "L": "Contract Carrier",
        "LA": "Logair",
        "LT": "Less Than Trailer Load (LTL)",
        "M": "Motor (Common Carrier)",
        "MB": "Motor (Bulk Carrier)",
        "MP": "Motor (Package Carrier)",
        "N": "Private Vessel",
        "O": "Containerized Ocean",
        "P": "Private Carrier",
        "PA": "Pooled Air",
        "PG": "Pooled Piggyback",
        "PL": "Pipeline",
        "PP": "Pool to Pool",
        "PR": "Pooled Rail",
        "PT": "Pooled Truck",
        "Q": "Conventional Ocean",
        "R": "Rail",
        "RC": "Rail, Less than Carload",
        "RR": "Roadrailer",
        "S": "Ocean",
        "SB": "Shipper Agent",
        "SC": "Shipper Agent (Truck)",
        "SD": "Shipper Association",
        "SE": "Sea/Air",
        "SR": "Supplier Truck",
        "SS": "Steamship",
        "ST": "Stack Train",
        "T": "Best Way (Shippers Option)",
        "TA": "Towaway Service",
        "TC": "Cab (Taxi)",
        "TT": "Tank Truck",
        "U": "Private Parcel Service",
        "VA": "Motor (Van)",
        "VE": "Vessel, Ocean",
        "VL": "Vessel, Lake",
        "W": "Inland Waterway",
        "WP": "Water or Pipeline Intermodal Movement",
        "X": "Intermodal (Piggyback)",
        "Y": "Military Intratheater Airlift Service",
        "Y1": "Ocean Conference Carrier",
        "Y2": "Ocean Non-Conference Carrier",
        "ZZ": "Other",
    };

    static mapTD512: Object = {
        "01": "Bulk Commodity Train",
        "09": "Premium Surface",
        "3D": "Three Day Service",
        "9A": "9 A.M.",
        "AC": "Air Cargo",
        "AE": "Air Economy",
        "AM": "A.M.",
        "BC": "Business Class",
        "CB": "Consignee Billing Service",
        "CE": "Courier Express",
        "CG": "Ground",
        "CX": "Express Service",
        "D1": "Delivery Scheduled Next Day by Cartage Agent",
        "D2": "Delivery scheduled second day by cartage agent",
        "D3": "Delivery scheduled third day by cartage agent",
        "DC": "Delivery Confirmation",
        "DF": "Deferred Service",
        "DR": "Delivery Confirmation Return",
        "DS": "Door Service",
        "DT": "Delivery Notification Only",
        "ES": "Expedited Service",
        "ET": "Proof of Delivery (POD) with Signature",
        "FC": "First Class",
        "G2": "Standard Service",
        "GP": "Express Service Plus",
        "GT": "Tracking - Ground",
        "IA": "IATA",
        "IE": "Expedited Service - Worldwide",
        "IX": "Express Service - Worldwide",
        "ME": "Metro",
        "MW": "Multiweight",
        "ND": "Next Day Air",
        "NF": "Next Flight Out",
        "NH": "Next Day Hundred Weight",
        "NM": "Next Morning",
        "NS": "Not Served",
        "ON": "Overnight",
        "PA": "Primary Service Area - Next Day by 10:30 A.M.",
        "PB": "Priority Mail",
        "PC": "Primary Service Area - Next Day By 9:30 AM",
        "PI": "Priority Mail Insured",
        "PM": "PM",
        "PN": "Primary Service Area - Next Day by Noon",
        "PO": "P.O. Box/Zip Code",
        "PR": "Primary Service Area - Next Day by 5:00 P.M.",
        "PS": "Primary Service Area - Second Day by Noon",
        "R1": "Passenger Service",
        "R2": "Quality Intermodal High Speed 70 Miles Per Hour (MPH)",
        "R3": "Other Intermodal and Stack Service",
        "R4": "60 Miles Per Hour (MPH) Service",
        "R5": "Manifest Freight",
        "R6": "Circus Train",
        "R7": "Work Train",
        "R8": "Commuter Service",
        "RS": "Authorized Return Service",
        "SA": "Same Day",
        "SC": "Second Day Air",
        "SD": "Saturday",
        "SE": "Second Day",
        "SG": "Standard Ground",
        "SH": "Second Day Hundred Weight",
        "SI": "Standard Ground Hundred Weight",
        "SM": "Second Morning",
        "SP": "Saturday Pickup",
        "ST": "Standard Class",
        "ZZ": "Other",

    };

    static mapTD3: Object = {
        "20": "20 ft. IL Container (Open Top)",
        "2B": "20 ft. IL Container (Closed Top)",
        "2D": "Control Unit",
        "2E": "Helper Unit",
        "2F": "Roadrailer",
        "2G": "Cut-in Helper",
        "40": "40 ft. IL Container (Open Top)",
        "4B": "40 ft. IL Container (Closed Top)",
        "AC": "Closed Container",
        "AF": "Air Freight (Break Bulk)",
        "AL": "Container, Aluminum",
        "AP": "Aircraft",
        "AT": "Closed Container (Controlled Temperature)",
        "BC": "Covered Barge",
        "BE": "Bilevel Railcar Fully Open",
        "BF": "Bilevel Railcar Fully Enclosed",
        "BG": "Bogie",
        "BH": "Bilevel Railcar Screened With Roof",
        "BJ": "Bilevel Railcar Screened, No Roof",
        "BK": "Container, Bulk",
        "BO": "Barge Open",
        "BR": "Barge",
        "BX": "Boxcar",
        "CA": "Caboose",
        "CB": "Chassis, Gooseneck",
        "CC": "Container resting on a Chassis",
        "CD": "Container with Bag Hangers",
        "CG": "Container, Tank (Gas)",
        "CH": "Chassis",
        "CI": "Container, Insulated",
        "CJ": "Container, Insulated/Ventilated",
        "CK": "Container, Heated/Insulated/Ventilated",
        "CL": "Container (Closed Top - Length Unspecified)",
        "CM": "Container, Open-Sided",
        "CN": "Container",
        "CP": "Coil Car Open",
        "CQ": "Container, Tank (Food Grade-Liquid)",
        "CR": "Coil-Car Covered",
        "CS": "Container-Low Side Open Top",
        "CT": "Container-High Side Open Top",
        "CU": "Container (Open Top - Length Unspecified)",
        "CV": "Closed Van",
        "CW": "Container, Tank (Chemicals)",
        "CX": "Container, Tank",
        "CZ": "Refrigerated Container",
        "DD": "Double-Drop Trailer",
        "DF": "Container with Flush Doors",
        "DT": "Drop Back Trailer",
        "DX": "Boxcar, Damage Free Equipped",
        "ET": "End of Train Device",
        "FF": "Frozen Food Trailer",
        "FH": "Flat Bed Trailer with Headboards",
        "FN": "Flat Bed Trailer with No Headboards",
        "FP": "Flatcar With Pedestal",
        "FR": "Flat Bed Trailer - Removable Sides",
        "FS": "Container with Floor Securing Rings",
        "FT": "Flat Bed Trailer",
        "FX": "Boxcar Cushion Under Frame OF",
        "GS": "Generator Set",
        "HB": "Container with Hangar Bars",
        "HC": "Hopper Car (Covered)",
        "HO": "Hopper Car (Open)",
        "HP": "Hopper Car (Covered; Pneumatic Discharge)",
        "HT": "Head of Train Device",
        "HV": "High Cube Van",
        "HY": "Hydrant-Cart",
        "ID": "Idler Car",
        "IX": "Boxcar (Insulated)",
        "LO": "Locomotive",
        "LS": "Half Height Flat Rack",
        "LU": "Load/unload Device on Equipment",
        "NX": "Boxcar (Interior Bulkheads)",
        "OB": "Ocean Vessel (Break Bulk)",
        "OT": "Open-top/flatbed trailer",
        "OV": "Open Top Van",
        "PL": "Container, Platform",
        "PP": "Power Pack",
        "PT": "Protected Trailer",
        "PU": "Pick-up Truck",
        "RA": "Fixed-Rack, Flat-Bed Trailer",
        "RC": "Refrigerated (Reefer) Car",
        "RD": "Fixed-Rack, Double Drop Trailer",
        "RE": "Flat Car (End Bulkheads)",
        "RF": "Flat Car",
        "RG": "Gondola Covered",
        "RI": "Gondola Car (Covered - Interior Bulkheads)",
        "RO": "Gondola Car (Open)",
        "RR": "Rail Car",
        "RS": "Fixed-Rack, Single-Drop Trailer",
        "RT": "Controlled Temperature Trailer (Reefer)",
        "SA": "Saddle",
        "SC": "Service Car",
        "SD": "Single-Drop Trailer",
        "SK": "Stack Car",
        "SL": "Container, Steel",
        "SR": "STAK-RAK",
        "SS": "Container with Smooth Sides",
        "ST": "Removable Side Trailer",
        "SV": "Van - Special Inside Length, Width or Height Requirements",
        "TA": "Trailer, Heated/Insulated/Ventilated",
        "TB": "Trailer, Boat",
        "TC": "Trailer, Car",
        "TF": "Trailer, Dry Freight",
        "TG": "Trailer, Tank (Gas)",
        "TH": "Truck, Open Top High Side",
        "TI": "Trailer, Insulated",
        "TJ": "Trailer, Tank (Chemicals)",
        "TK": "Trailer, Tank (Food Grade-Liquid)",
        "TL": "Trailer (not otherwise specified)",
        "TM": "Trailer, Insulated/Ventilated",
        "TN": "Tank Car",
        "TO": "Truck, Open Top",
        "TP": "Trailer, Pneumatic",
        "TQ": "Trailer, Electric Heat",
        "TR": "Tractor",
        "TT": "Telescoping Trailer",
        "TU": "Truck, Open Top Low Side",
        "TV": "Truck, Van",
        "TW": "Trailer, Refrigerated",
        "UA": "Trilevel Railcar 20 Feet",
        "UB": "Trilevel Railcar Screened, Fully Enclosed",
        "UC": "Trilevel Railcar Screened, With Roof",
        "UD": "Trilevel Railcar Screened, No Roof",
        "UE": "Trilevel Railcar Screened, With Doors, No Roof",
        "UL": "Unit Load Device (ULD)",
        "UP": "Container, Upgraded",
        "VA": "Container, Vented",
        "VE": "Vessel, Ocean",
        "VL": "Vessel, Lake",
        "VR": "Vessel, Ocean, Rollon-Rolloff",
        "VS": "Vessel, Ocean, Lash",
        "VT": "Vessel, Ocean, Containership",
        "WR": "Container with Wavy or Ripple Sides",
        "WY": "Railroad Maintenance of Way Car",
    };

    static mapTD4: Object = {
        "9": "NAHG",
        "I": "IMDG",
        "U": "UNDG",

    };
    static mapREF01_I_IdR: Object = {
        "AEC": "governmentNumber",
        "CR": "customerReferenceID",
        "EU": "ultimateCustomerReferenceID",
        "D2": "supplierReference",
        "DD": "documentName",
    };
    static mapREF01_I_Ext: Object = {
        "VN": "SupplierOrderID",
        "IN": "InvoiceID",
        "CT": "ShippingContractNumber",
        "DJ": "DeliveryNoteID",
    };

    static mapREF01_II: Object = {
        "01": "transitRoutingNumber",
        "02": "swiftID",
        "03": "chipsParticipantID",
        "04": "financialBranchAndInstitution",
        "05": "chipsUserID",
        "06": "computerManufacturerSystemID",
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
        "4N": "specialPaymentRefNo",
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
        "ACE": "serviceRequestNo",
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
        "AH": "masterAgreementID",
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
        "BM": "billOfLadingNo",
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
        "CR": "customerReferenceNo",
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
        "EU": "endUsersPurchaseOrderNo",
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
        "FJ": "lineItemControlNumber",
        "FK": "finishLotNo",
        "FL": "fineLineClassification",
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
        "I5": "invoiceID",
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
        "IV": "sellersInvoiceID",
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
        "KK": "deliveryReference",
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
        "MA": "shipNoticeID",
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
        "PD": "promotionDealNo",
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
        "PK": "packingListNo",
        "PL": "priceListNo",
        "PLA": "productLicensingAgreementNo",
        "PLN": "proposedContractNo",
        "PM": "partNo",
        "PMN": "premarketApplicationNo",
        "PN": "permitNo",
        "PNN": "patentNo",
        "PO": "purchaseOrderID",
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
        "RV": "receivingNo",
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
        "VN": "supplierOrderID",
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
        //"ZZ": "mutuallyDefined",

    };

    static mapFOB01: Object = {
        "11": "Rule11Shipment",
        "BP": "PaidByBuyer",
        "CA": "AdvanceCollect",
        "CC": "Collect",
        "CD": "CollectOnDelivery",
        "CF": "CollectFreightCreditedToPaymentCustomer",
        "DE": "PerContract",
        // "DF":"Account",
        // "DF":"CashOnDeliveryServiceChargePaidByConsignee",
        // "DF":"CashOnDeliveryServiceChargePaidByConsignor",
        "DF": "DefinedByBuyerAndSeller",
        // "DF":"InformationCopy-NoPaymentDue",
        // "DF":"InsuranceCostsPaidByConsignee",
        // "DF":"InsuranceCostsPaidByConsignor",
        // "DF":"NotSpecified",
        // "DF":"PayableElsewhere",
        // "DF":"Other",
        "FO": "FobPortOfCall",
        "HP": "HalfPrepaid",
        "MX": "Mixed",
        "NC": "ServiceFreight-NoCharge",
        "NR": "NonRevenue",
        "PA": "AdvancePrepaid",
        "PB": "CustomerPick-UpOrBackhaul",
        "PC": "PrepaidButChargedToCustomer",
        "PD": "PrepaidByProcessor",
        "PE": "PrepaidAndSummaryBill",
        "PL": "PrepaidLocalCollectOutstate",
        "PO": "PrepaidOnly",
        "PP": "Prepaid-BySeller",
        "PS": "PaidBySupplierOrSeller",
        "PU": "Pickup",
        "RC": "ReturnContainerFreightPaidByCustomer",
        "RF": "ReturnContainerFreightFree",
        "RS": "ReturnContainerFreightPaidBySupplier",
        "TP": "ThirdPartyPay",
        "WC": "WeightCondition",

    };

    static mapFOB05: Object = {
        "CAF": "CostAndFreight",
        "CFR": "CostAndFreight",
        "CIF": "Cost-InsuranceAndFreight",
        "CIP": "Carriage-InsurancePaidTo",
        "CPT": "CarriagePaidTo",
        "DAF": "DeliveredAtFrontier",
        "DAP": "DeliveryAtPlace",
        "DAT": "DeliveryAtTerminal",
        "DDP": "DeliveredDutyPaid",
        "DDU": "DeliveredDutyUnpaid",
        "DEQ": "DeliveredEx-Quay",
        "DES": "DeliveredEx-Ship",
        "EXW": "Ex-Works",
        "FAS": "FreeAlongsideShip",
        "FCA": "Free-Carrier",
        "FOB": "FreeOnBoard",
    };

    static mapN101: Object = {
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
        "CA": "carrierCorporate",
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
        "SF": "shipFrom",
        "SO": "soldTo",
        "ST": "shipTo",
        "SU": "supplierCorporate",
        "TO": "receipientParty",
        "UK": "senderBusinessSystemID",
        "ZZ": "default",

    }

    static mapN103: Object = {
        "1": "DUNS",
        "2": "SCAC",
        "4": "IATA",
        "9": "DUNS+4",
    }
    static mapN1REF128_I: Object = {
        "01": "abaRoutingNumber",
        "02": "swiftID",
        "03": "chipsID",
        "11": "accountID",
        "12": "accountPayableID",
        "14": "ibanID",
        "3L": "bankBranchID",
        "3S": "pstID",
        "4B": "loadingPoint",
        "4C": "storageLocation",
        "4G": "provincialTaxID",
        "4L": "supplierLocationID",
        "4O": "qstID",
        "72": "BuyerPlannerCode",
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
        "GT": "gstTaxID",
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
        "YD": "PartyAdditionalID",
        "ZA": "PartyAdditionalID2",

    }

    static mapN1REF128_II: Object = {
        "01": "transitRoutingNumber",
        "02": "swiftID",
        "03": "chipsParticipantID",
        "04": "financialBranchAndInstitution",
        "05": "chipsUserID",
        "06": "computerManufacturerSystemID",
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
        "4N": "specialPaymentRefNo",
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
        "ACE": "serviceRequestNo",
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
        "AH": "masterAgreementID",
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
        "BM": "billOfLadingNo",
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
        "CR": "customerReferenceNo",
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
        "EU": "endUsersPurchaseOrderNo",
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
        "FJ": "lineItemControlNumber",
        "FK": "finishLotNo",
        "FL": "fineLineClassification",
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
        "I5": "invoiceID",
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
        "IV": "sellersInvoiceID",
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
        "KK": "deliveryReference",
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
        "MA": "shipNoticeID",
        "MB": "masterBillOfLading",
        "MBX": "mailbox",
        "MC": "microfilmNo",
        "MCI": "motorCarrierID",
        "MD": "magazineCode",
        "MDN": "hazardousWasteManifestDocNo",
        //"ME": "messageAddressOrID",
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
        "PD": "promotionDealNo",
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
        "PK": "packingListNo",
        "PL": "priceListNo",
        "PLA": "productLicensingAgreementNo",
        "PLN": "proposedContractNo",
        "PM": "partNo",
        "PMN": "premarketApplicationNo",
        "PN": "permitNo",
        "PNN": "patentNo",
        "PO": "purchaseOrderID",
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
        "RV": "receivingNo",
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
        "VN": "supplierOrderID",
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
        "ZZ": "mutuallyDefined",


    }



}