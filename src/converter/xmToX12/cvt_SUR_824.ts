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
export class Cvt_SUR_824 extends XmlConverterBase {
    protected _convertErrs: ConvertErr[];
    protected _cntReceiptItem: number = 0;

    private _fromXMLCheck() {
        this._convertErrs = []; // clear previouse check results


    }

    public fromXML(vsdoc: vscode.TextDocument): string {

        this._init(vsdoc);
        // this._fromXMLCheck();
        // if (this._hasConvertErr()) {
        //     return this._renderConvertErr();
        // }

        this._ISA(true);
        this._GS(true, 'AG');
        this._ST('824');

        // const nRequestHeader = this._rn('/ReceiptRequest/ReceiptRequestHeader');

        // BGN
        let d: Date = new Date();
        let BGN = this._initSegX12('BGN', 4);
        this._setV(BGN, 1, '00');
        this._setV(BGN, 2, 'CN' + this._GS_ControlNumber);
        this._setV(BGN, 3, Utils.getYYYYMMDD(d));
        this._setV(BGN, 4, Utils.getHHMMSS(d));

        // OTI
        let OTI = this._initSegX12('OTI', 17);
        let nDocStatus = this._rn('StatusUpdateRequest/DocumentStatus');
        let nInvStatus = this._rn('StatusUpdateRequest/InvoiceStatus');
        let sType: string
        if (nDocStatus) {
            sType = this._v('@type', nDocStatus).toLowerCase();
            this._setV(OTI, 1, MAPS.mapOTI03Doc[sType]);
            this._setV(OTI, 2, 'TN');
            let sDocID = this._v('DocumentInfo/@documentID', nDocStatus);
            this._setV(OTI, 3, sDocID);
            let sDocType = this._v('DocumentInfo/@documentType', nDocStatus).toLowerCase();
            this._setV(OTI, 10, MAPS.mapOTI10[sDocType]??'');
            this._setV(OTI, 15, '2');
            if (MAPS.mapOTI17_Doc[sType]) {
                this._setV(OTI, 17, MAPS.mapOTI17_Doc[sType]);
            } else {
                let sStatusCode = this._rv('StatusUpdateRequest/Status/@code').toLowerCase();
                if (sStatusCode == '5xx') {
                    this._setV(OTI, 17, 'P01');
                } else {
                    this._setV(OTI, 17, 'RUN');
                }
            }
        } // end nDocStatus exist
        if (nInvStatus) {
            sType = this._v('@type', nInvStatus).toLowerCase();
            this._setV(OTI, 1, MAPS.mapOTI03Inv[sType]);
            this._setV(OTI, 2, 'TN');
            let sInvID = this._v('InvoiceIDInfo/@invoiceID', nInvStatus);
            this._setV(OTI, 3, sInvID);
            // [If /InvoiceStatus is used, hardcode to "810"]
            this._setV(OTI, 10, '810');
            this._setV(OTI, 15, '2');
            if (MAPS.mapOTI17_Inv[sType]) {
                this._setV(OTI, 17, MAPS.mapOTI17_Inv[sType]);
            } else {
                let sStatusCode = this._rv('StatusUpdateRequest/Status/@code').toLowerCase();
                if (sStatusCode == '5xx') {
                    this._setV(OTI, 17, 'P01');
                } else {
                    this._setV(OTI, 17, 'RUN');
                }
            }
        } // end nInvStatus exist

        // REF TN
        let REF: EdiSegment;
        REF = this._initSegX12('REF', 3);
        this._setV(REF, 1, 'TN');
        this._setV(REF, 2, 'DocumentID');
        if (nDocStatus) {
            this._setV(REF, 3, this._v('DocumentInfo/@documentID', nDocStatus));
        }
        if (nInvStatus) {
            this._setV(REF, 3, this._v('InvoiceIDInfo/@invoiceID', nInvStatus));
        }

        // REF ACC
        REF = this._initSegX12('REF', 3);
        this._setV(REF, 1, 'ACC');
        if (nDocStatus) {
            this._setV(REF, 2, this._v('@type', nDocStatus));
        }
        if (nInvStatus) {
            this._setV(REF, 2, this._v('@type', nInvStatus));
        }
        this._setV(REF, 3, this._rv('/StatusUpdateRequest/Status'));

        // REF L1
        let sCommentsPart: string = '';

        if (nDocStatus && MAPS.mapOTI03Doc[sType] == 'TA') {
            sCommentsPart = this._v('Comments', nDocStatus);
        }
        if (nInvStatus && MAPS.mapOTI03Inv[sType] == 'TA') {
            sCommentsPart = this._v('Comments', nInvStatus);
        }
        while (sCommentsPart.length > 0) {
            REF = this._initSegX12('REF', 3);
            this._setV(REF, 1, 'L1');
            this._setV(REF, 3, sCommentsPart.substring(0,80));
            sCommentsPart = sCommentsPart.substring(80, 160);
        }

        // DTM 102
        let DTM: EdiSegment;
        let date102: Date;
        if (nDocStatus) {
            date102 = Utils.parseToDateSTD2(this._v('DocumentInfo/@documentDate', nDocStatus));
        }
        if (nInvStatus) {
            date102 = Utils.parseToDateSTD2(this._v('InvoiceIDInfo/@invoiceDate', nInvStatus));
        }
        if (date102) {
            DTM = this._initSegX12('DTM', 4);
            this._setV(DTM, 1, '102');
            this._setV(DTM, 2, Utils.getYYYYMMDD(date102));
            this._setV(DTM, 3, Utils.getHHMMSS(date102));
            this._setV(DTM, 4, Utils.getTMZ2(date102));
        }

        // DTM 814
        let date814: Date;
        if (nInvStatus) {
            date814 = Utils.parseToDateSTD2(this._v('@paymentNetDueDate', nInvStatus));
        }
        if (date814) {
            DTM = this._initSegX12('DTM', 4);
            this._setV(DTM, 1, '814');
            this._setV(DTM, 2, Utils.getYYYYMMDD(date814));
            this._setV(DTM, 3, Utils.getHHMMSS(date814));
            this._setV(DTM, 4, Utils.getTMZ2(date814));
        }

        // TED
        let sFreeMsg = this._rv('/StatusUpdateRequest/Status/@text');
        if ((nDocStatus && MAPS.mapOTI03Doc[sType] == 'TR')
            || (nInvStatus && MAPS.mapOTI03Inv[sType] == 'TR')) {
            if (sFreeMsg) {
                let TED = this._initSegX12('TED', 2);
                this._setV(TED, 1, 'ZZZ');
                this._setV(TED, 2, sFreeMsg);
            }
        }

        // NTE
        sCommentsPart = '';
        if (nDocStatus && MAPS.mapOTI03Doc[sType] == 'TR') {
            sCommentsPart = this._v('Comments', nDocStatus);
        }
        if (nInvStatus && MAPS.mapOTI03Inv[sType] == 'TR') {
            sCommentsPart = this._v('Comments', nInvStatus);
        }
        let NTE:EdiSegment;
        while (sCommentsPart.length > 0) {
            NTE = this._initSegX12('NTE', 2);
            this._setV(NTE, 1, 'ERN');
            this._setV(NTE, 2, sCommentsPart.substring(0,80));
            sCommentsPart = sCommentsPart.substring(80, 160);
        }


        this._SE();
        this._GE();
        this._IEA();

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
        let sDesc = this._extractText(nRefDesc); // to avoid null value;
        if (sDesc) {
            let IMDF = this._initSegEdi('IMD', 3);
            this._setV(IMDF, 1, 'F');
            this._descIMD(IMDF, sDesc, sLang);
        } else if (sShortName) {
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
    static mapOTI03Doc: Object = {
        "accepted": "TA",
        "approved": "TA",
        "canceled": "TR",
        "declined": "TR",
        "processing": "TA",
        "rejected": "TR",
    };
    static mapOTI03Inv: Object = {
        "paid": "TA",
        "paying": "TA",
        "processing": "TA",
        "reconciled": "TA",
        "rejected": "TR",
        "canceled": "TR",
    };

    static mapOTI10: Object = {
        "shipnoticedocument": "856",
        "invoicedetailrequest": "810",
        "confirmationstatusupdate": "855",
    }

    static mapOTI17_Doc: Object = {
        "accepted": "C20",
        "approved": "C20",
        "processing": "C20",
        "rejected": "REJ",
        "declined": "REJ",
        "canceled": "REJ",
    }
    static mapOTI17_Inv: Object = {
        "paid": "C20",
        "paying": "C20",
        "processing": "C20",
        "reconciled": "C20",
        "rejected": "REJ",
        "canceled": "REJ",

    }

}