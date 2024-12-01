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
import { XmlConverterBase } from "../xmlConverterBase";
import { DOMParser } from "@xmldom/xmldom";
import xpath = require('xpath');

/**
 * No need to make singleton because parserUtil already assured it
 */
export class Cvt_Receipt_RECADV extends XmlConverterBase {
    protected _convertErrs: ConvertErr[];
    protected _cntReceiptItem:number = 0;

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
        this._UNB('ORDERS',true); // TODO: after BIC team fixed this error for CIG, then we do it

        let UNH = this._initSegEdi('UNH', 2);
        this._setV(UNH, 1, this._sUniqueRefGP); // Unique message reference assigned by the sender.
        // S009
        this._setV(UNH, 201, 'RECADV'); // 65
        this._setV(UNH, 202, 'D');
        this._setV(UNH, 203, '96A');
        this._setV(UNH, 204, 'UN');

        // BGM
        let BGM = this._initSegEdi('BGM', 4);
        this._setV(BGM, 101, '632');

        const nRequestHeader = this._rn('/ReceiptRequest/ReceiptRequestHeader');

        const nBGMReceiptID: Node = this._n('/@receiptID', nRequestHeader);
        this._setV(BGM, 2, nBGMReceiptID.nodeValue);
        const nOperation = this._n('/@operation', nRequestHeader);
        this._setV(BGM, 3, MAPS.mapBGM[nOperation.nodeValue] ?? '');
        this._setV(BGM, 4, 'AB');

        // DTM
        let DTM = this._initSegEdi('DTM', 1);
        this._setV(DTM, 101, '50');
        const nReceiptDate = this._n('@receiptDate', nRequestHeader);
        this._setV(DTM, 102, Utils.dateStr304TZ(nReceiptDate.nodeValue, 'GM'));
        this._setV(DTM, 103, '304'); // hardcoded for now

        // SG1 RFF
        const nShipnoticeID = this._n('/ShipNoticeIDInfo/@shipNoticeID', nRequestHeader);
        if (nShipnoticeID) {
            let SG1REF = this._initSegEdi('RFF', 1);
            this._setV(SG1REF, 101, 'DQ');
            this._setV(SG1REF, 102, nShipnoticeID.nodeValue);
        }

        // SG1 DTM
        const nShipnoticeDate = this._n('/ShipNoticeIDInfo/@shipNoticeDate', nRequestHeader);
        if (nShipnoticeDate) {
            let SG1DTM = this._initSegEdi('DTM', 1);
            this._setV(SG1DTM, 101, '124');
            this._setV(SG1DTM, 102, Utils.dateStr304TZ(nShipnoticeDate.nodeValue, 'GM'));
            this._setV(SG1DTM, 103, '304'); // hardcoded for now
        }

        // SG1 RFF Extrinsic
        const nSG1Extrincs = this._es('/Extrinsic', nRequestHeader);
        for (let n of nSG1Extrincs) {
            let SG1REF = this._initSegEdi('RFF', 1);
            this._setV(SG1REF, 101, 'ZZZ');
            this._setV(SG1REF, 102, n.getAttribute('name'));
            this._setV(SG1REF, 103, '');
            this._setV(SG1REF, 104, n.textContent);
        }

        // SG4 NAD
        let SG4NAD = this._initSegEdi('NAD', 3);
        this._setV(SG4NAD, 1, 'XX')
        this._setV(SG4NAD, 3, 'UNSUPPORTED')

        // SG16 CPS
        let SG16CPS = this._initSegEdi('CPS', 1);
        this._setV(SG16CPS, 1, '1')

        // SG22 LIN
        const nOrders = this._rns('/ReceiptRequest/ReceiptOrder');
        for (let n of nOrders) {
            this._SG22(n);
        }

        // CNT
        let CNT = this._initSegEdi('CNT', 1);
        this._setV(CNT, 101, '2');
        this._setV(CNT, 102, this._cntReceiptItem.toString());

        // UNT
        let iSegCnt = this._segs.length -1 ; // before creating UNT and exclude UNA
        let UNT = this._initSegEdi('UNT', 2);
        this._setV(UNT, 1,iSegCnt.toString()); // Control count of number of segments in a message
        this._setV(UNT, 2,this._sUniqueRefGP); // Unique message reference assigned by the sender

        // UNZ
        let UNZ = this._initSegEdi('UNZ', 2);
        this._setV(UNZ, 1, '1'); // Count either of the number of messages in an interchange
        this._setV(UNZ, 2,this._sUniqueRefIC); // Unique reference assigned by the sender to an interchange.

        this._tidySegCascade();
        const output = this._segs.join(constants.ediDocument.lineBreak);
        return output;
    }

    /**
     * The Group of LIN: SG16_SG22
     * nLIN: /ReceiptRequest/ReceiptOrder
     */
    private _SG22(nOrder: Element) {
        const nItems = this._es("ReceiptItem", nOrder);
        for (let nItem of nItems) {
            this._cntReceiptItem++;
            this._SG22Item(nOrder, nItem);
        }
    }

    /**
     * ReciptItem Level rendering
     * @param segments 
     * @param nOrder 
     * @param nItem 
     */
    private _SG22Item(nOrder: Element, nItem: Element) {
        // SG22 LIN
        let SG22LIN = this._initSegEdi('LIN', 4);
        const nReciptNumber = this._n("@receiptLineNumber", nItem);
        this._setV(SG22LIN, 1, nReciptNumber.nodeValue);
        this._setV(SG22LIN, 2, '');
        // Item number
        const nRef = this._n("ReceiptItemReference/@lineNumber", nItem);
        if (nRef) {
            this._setV(SG22LIN, 301, nRef.nodeValue);
        }
        this._setV(SG22LIN, 302, 'PL');

        const nParentReciptNumber = this._n("@parentReceiptLineNumber", nItem);
        if (nParentReciptNumber) {
            this._setV(SG22LIN, 401, '1');
            this._setV(SG22LIN, 402, nParentReciptNumber.nodeValue);
        } else {
            // this._setV(SG22LIN,3,0,'');
            // this._setV(SG22LIN,3,1,'');
        }

        // SG22 PIA
        this._SG22PIA(nItem);

        // SG22 IMD
        let nRefDesc = this._n('ReceiptItemReference/Description', nItem);
        let sLang = this._v('@xml:lang', nRefDesc);
        let sShortName = this._v('ShortName', nRefDesc);
        
        // IMD F
        let sDesc = this._vt(nRefDesc); // to avoid null value;
        if (sDesc) {
            let IMDF = this._initSegEdi('IMD', 3);
            this._setV(IMDF, 1, 'F');
            this._descIMD(IMDF, sDesc, sLang);
        } else if(sShortName) {
            // will try to create description based on ShortName
            let IMDF = this._initSegEdi('IMD', 3);
            this._setV(IMDF, 1, 'F');
            this._descIMD(IMDF, sShortName, sLang);
        }

        // IMD E
        if (sShortName) {
            let IMDE = this._initSegEdi('IMD', 3);
            this._setV(IMDE, 1, 'E');
            this._descIMD(IMDE, sShortName, sLang);
        }        

        let sDomain = this._v('ReceiptItemReference/Classification/@domain', nItem);
        let sClassification = this._v('ReceiptItemReference/Classification', nItem);
        if (sClassification) {
            let IMDB = this._initSegEdi('IMD', 3);
            this._setV(IMDB, 1, 'B');
            this._setV(IMDB, 301, 'ACA');
            this._setV(IMDB, 304, sDomain);
            this._setV(IMDB, 305, sClassification);
        }

        // SG22 QTY
        let sType = this._v('@type', nItem);
        let sQty = this._v('@quantity', nItem);
        let sUoM = this._v('UnitRate/UnitOfMeasure', nItem);
        if (sType == 'received') {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '48');
            this._setV(QTY, 102, sQty);
            this._setV(QTY, 103, sUoM);
        } else if (sType == 'returned') {
            let QTY = this._initSegEdi('QTY', 1);
            this._setV(QTY, 101, '195');
            this._setV(QTY, 102, sQty);
            this._setV(QTY, 103, sUoM);
        } else {
            // do nothing
        }

        // SG28 RFF ON
        let nOrderInfo = this._n('ReceiptOrderInfo', nOrder);
        let sOrderID1 = this._v('OrderReference/@orderID', nOrderInfo);
        let sOrderDate1 = this._v('OrderReference/@orderDate', nOrderInfo);
        let sOrderID2 = this._v('OrderIDInfo/@orderID', nOrderInfo);
        let sOrderDate2 = this._v('OrderIDInfo/@orderDate', nOrderInfo);
        // yes = Closed
        let sClose = this._v('@closeForReceiving', nOrder) == 'yes' ? 'Closed' : '';
        let sOrderID: string;
        let sOrderDate: string;
        if (sOrderID1) {
            sOrderID = sOrderID1;
            sOrderDate = sOrderDate1;
        } else {
            sOrderID = sOrderID2;
            sOrderDate = sOrderDate2;
        }
        if (sOrderID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ON');
            this._setV(RFF, 102, sOrderID);
            this._setV(RFF, 104, sClose);
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '4');
            this._setV(DTM, 102, Utils.dateStr304TZ(sOrderDate, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // SG28 RFF CT
        let sAgreeID1 = this._v('MasterAgreementReference/@agreementID', nOrderInfo);
        let sAgreeID2 = this._v('MasterAgreementIDInfo/@agreementID', nOrderInfo);
        let sAgreeDate1 = this._v('MasterAgreementReference/@agreementDate', nOrderInfo);
        let sAgreeDate2 = this._v('MasterAgreementIDInfo/@agreementDate', nOrderInfo);
        let sAgreeID: string;
        let sAgreeDate: string;
        if (sAgreeID1) {
            sAgreeID = sAgreeID1;
            sAgreeDate = sAgreeDate1;
        } else {
            sAgreeID = sAgreeID2;
            sAgreeDate = sAgreeDate2;
        }
        if (sAgreeID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'CT');
            this._setV(RFF, 102, sAgreeID);
            this._setV(RFF, 103, '1');
            this._setV(RFF, 104, sClose);
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '126');
            this._setV(DTM, 102, Utils.dateStr304TZ(sAgreeDate, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // SG28 RFF DQ
        let nItemRef = this._n('ReceiptItemReference', nItem);
        let sShipNoticeID1 = this._v('ShipNoticeReference/@shipNoticeID', nItemRef);
        let sShipNoticeID2 = this._v('ShipNoticeIDInfo/@shipNoticeID', nItemRef);
        let sShipNoticeDate1 = this._v('ShipNoticeReference/@shipNoticeDate', nItemRef);
        let sShipNoticeDate2 = this._v('ShipNoticeIDInfo/@shipNoticeDate', nItemRef);
        let sShipNoticeID: string;
        let sShipNoticeDate: string;
        if (sShipNoticeID1) {
            sShipNoticeID = sShipNoticeID1;
            sShipNoticeDate = sShipNoticeDate1;
        } else {
            sShipNoticeID = sShipNoticeID2;
            sShipNoticeDate = sShipNoticeDate2;
        }
        if (sShipNoticeID) {
            let sShipLineItem = this._v('ShipNoticeLineItemReference/@shipNoticeLineNumber', nItemRef);
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'DQ');
            this._setV(RFF, 102, sShipNoticeID);
            this._setV(RFF, 103, sShipLineItem);
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '124');
            this._setV(DTM, 102, Utils.dateStr304TZ(sShipNoticeDate, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // SG28 RFF FI
        let sItemType = this._v('@itemType', nItem);
        let sCompItemType = this._v('@compositeItemType', nItem);
        if (sItemType && sCompItemType) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'FI');
            this._setV(RFF, 102, sItemType);
            this._setV(RFF, 103, sCompItemType);
        }

        // SG28 RFF ACE
        let sDocID = this._v('ReferenceDocumentInfo/DocumentInfo/@documentID', nItemRef);
        let sDocType = this._v('ReferenceDocumentInfo/DocumentInfo/@documentType', nItemRef);
        if (sDocID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'ACE');
            this._setV(RFF, 102, sDocID);
            this._setV(RFF, 103, sDocType);
            let DTM = this._initSegEdi('DTM', 1);
            let sDocDate = this._v('ReferenceDocumentInfo/DocumentInfo/@documentDate', nItemRef);
            this._setV(DTM, 101, '171');
            this._setV(DTM, 102, Utils.dateStr304TZ(sDocDate, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // SG28 RFF AAU
        let sNoteID = this._v(`ShipNoticeIDInfo/IdReference [@domain='deliveryNoteId']/@identifie`, nItemRef);
        let sNoteDate = this._v(`ShipNoticeIDInfo/IdReference [@domain='deliveryNoteDate']/@identifier`, nItemRef);
        if (sNoteID) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, 'AAU');
            this._setV(RFF, 102, sNoteID);
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, '124');
            this._setV(DTM, 102, Utils.dateStr304TZ(sNoteDate, 'GM'));
            this._setV(DTM, 103, '304');
        }

        // SG28 RFF ZZZ
        let nExtrins = this._es(XML.Extrinsic, nItem);
        for (let n of nExtrins) {
            let sName = this._v('@name', n);
            if (sName) {
                let RFF = this._initSegEdi('RFF', 1);
                this._setV(RFF, 101, 'ZZZ');
                this._setV(RFF, 102, sName);
                this._setV(RFF, 104, n.textContent);
            }
        }

    }

    private _SG22PIA(nItem: Node) {

        // SG22 PIA
        let SupplierPartID = this._v('ReceiptItemReference/ItemID/SupplierPartID', nItem);

        let SupplierPartAuxiliaryID = this._v('ReceiptItemReference/ItemID/SupplierPartAuxiliaryID', nItem);
        let BuyerPartID = this._v('ReceiptItemReference/ItemID/BuyerPartID', nItem);
        let ManufacturerPartID = this._v('ReceiptItemReference/ManufacturerPartID', nItem);
        let SupplierBatchID = this._v('Batch/SupplierBatchID', nItem);

        // /ReceiptRequest/ReceiptOrder/ReceiptItem/ReceiptItemReference/ItemID/SupplierPartID	5	VN	91
        if (SupplierPartID || ManufacturerPartID || BuyerPartID) {
            let SG22PIA = this._initSegEdi('PIA', 6);
            this._setV(SG22PIA, 1, '5');
            let counter = 2;
            if (SupplierPartID) {
                this._setV(SG22PIA, counter * 100 + 1, SupplierPartID);
                this._setV(SG22PIA, counter * 100 + 2, 'VN');
                this._setV(SG22PIA, counter * 100 + 4, '91');
                counter++;
            }
            if (ManufacturerPartID) {
                this._setV(SG22PIA, counter * 100 + 1, ManufacturerPartID);
                this._setV(SG22PIA, counter * 100 + 2, 'MF');
                this._setV(SG22PIA, counter * 100 + 4, '90');
                counter++;
            }
            if (ManufacturerPartID) {
                this._setV(SG22PIA, counter * 100 + 1, BuyerPartID);
                this._setV(SG22PIA, counter * 100 + 2, 'BP');
                this._setV(SG22PIA, counter * 100 + 4, '92');
                counter++;
            }
        }

        if (SupplierPartAuxiliaryID || SupplierBatchID) {
            let SG22PIA = this._initSegEdi('PIA', 6);
            this._setV(SG22PIA, 1, '1');
            let counter = 2;
            if (SupplierPartAuxiliaryID) {
                this._setV(SG22PIA, counter * 100 + 1, SupplierPartAuxiliaryID);
                this._setV(SG22PIA, counter * 100 + 2, 'VS');
                this._setV(SG22PIA, counter * 100 + 4, '91');
                counter++;
            }
            if (SupplierBatchID) {
                this._setV(SG22PIA, counter * 100 + 1, SupplierBatchID);
                this._setV(SG22PIA, counter * 100 + 2, 'NB');
                this._setV(SG22PIA, counter * 100 + 4, '91');
                counter++;
            }

        }
    }
}

class MAPS {
    static mapBGM: Object = {
        "delete": "3",
        "update": "5",
        "new": "9",
    };
}