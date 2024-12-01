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
export class Cvt_OrderConfrimation_855 extends XmlConverterBase {
    protected _convertErrs: ConvertErr[];
    protected _cntReceiptItem: number = 0;

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

        this._ISA(true);
        this._GS(false, 'PR');
        this._ST('855');

        let nHeader = this._rn('/ConfirmationRequest/ConfirmationHeader');
        let nOrderRef = this._rn('/ConfirmationRequest/OrderReference');
        // BAK
        let d: Date = new Date();
        let BAK = this._initSegX12('BAK', 11);
        let sHeaderOperation = this._v('@operation', nHeader);
        let sHeaderType = this._v('@type', nHeader);
        let sOrderID = this._v('@orderID', nOrderRef);
        let sOrderDate = this._v('@orderDate', nOrderRef);
        let sNoticeDate = this._v('@noticeDate', nHeader);
        this._setV(BAK, 1, this._mci(MAPS.mapBAK353, sHeaderOperation));
        this._setV(BAK, 2, this._mci(MAPS.mapBAK587, sHeaderType));
        this._setV(BAK, 3, sOrderID);
        // this._setV(BAK, 4, sOrderDate); // to DTM*004 

        this._setV(BAK, 8, this._v('@confirmID', nHeader));
        // this._setV(BAK, 9, sNoticeDate); // to DTM*ACK

        // CUR
        let vCurr = this._v('Total/Money/@currency', nHeader);
        if (vCurr) {
            let CUR = this._initSegX12('CUR', 2);
            this._setV(CUR, 1, 'BY');
            this._setV(CUR, 2, this._v('Total/Money/@currency', nHeader));
        }

        // REF IV
        this._REF_KV_X12D('IV', this._v('@invoiceID', nHeader));
        // REF ON
        this._REF_KV_X12D('ON', sOrderID);
        // REF CR
        this._REF_KV_X12D('CR', this._v('IdReference [@domain="CustomerReferenceID"]/@identifier', nHeader));
        // REF ZB
        this._REF_KV_X12D('ZB', this._v('IdReference [@domain="UltimateCustomerReferenceID"]/@identifier', nHeader));
        // REF D2
        this._REF_KV_X12D('D2', this._v('IdReference [@domain="supplierReference"]/@identifier', nHeader));
        // REF ZZ
        let nExtrins = this._es(XML.Extrinsic, nHeader);
        for (let n of nExtrins) {
            let sName = this._v('@name', n);
            if (sName) {
                let RFF = this._initSegX12('REF', 3);
                this._setV(RFF, 1, 'ZZ');
                this._setV(RFF, 2, sName);
                this._setV(RFF, 3, this._v('', n));
            }
        }

        // FOB
        let vIncoTerms = this._v('@incoTerms', nHeader);
        if (vIncoTerms) {
            let FOB = this._initSegX12('FOB', 5);
            this._setV(FOB, 1, 'DE');
            this._setV(FOB, 4, '01');
            this._setV(FOB, 5, this._mci(MAPS.mapFOB335, vIncoTerms));
        }
        // SAC ShippingMoney
        let vShippingMoney = this._v('Shipping/Money', nHeader);
        if (vShippingMoney) {
            let SAC = this._initSegX12('SAC', 16);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'G830');
            this._setV(SAC, 5, this._x100(vShippingMoney));
            this._setV(SAC, 13, this._v('Shipping/@trackingId', nHeader));
            this._setV(SAC, 14, this._v('Shipping/@trackingDomain', nHeader));
            this._setV(SAC, 15, this._v('Shipping/Description', nHeader));
            this._setV(SAC, 16, this._v('Shipping/Description/@xml:lang', nHeader));
            // CUR
            let vCurr = this._v('Shipping/Money/@currency', nHeader);
            if (vCurr) {
                let CUR = this._initSegX12('CUR', 2);
                this._setV(CUR, 1, 'BY');
                this._setV(CUR, 2, vCurr);
            }
        }
        // SAC TaxMoney
        let vTaxMoney = this._v('Tax/Money', nHeader);
        if (vTaxMoney) {
            let SAC = this._initSegX12('SAC', 16);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'H850');
            this._setV(SAC, 5, this._x100(vTaxMoney));
            this._setV(SAC, 15, this._v('Tax/Description', nHeader));
            this._setV(SAC, 16, this._v('Tax/Description/@xml:lang', nHeader));
            // CUR
            let vCurr = this._v('Tax/Money/@currency', nHeader);
            if (vCurr) {
                let CUR = this._initSegX12('CUR', 2);
                this._setV(CUR, 1, 'BY');
                this._setV(CUR, 2, vCurr);
            }
        }
        // SAC Modifications
        let nMods = this._es('Total/Modifications/Modification', nHeader);
        for (let nMod of nMods) {
            this._SAC_Modification(nMod);

        } // end loop Mods

        // DTM 004 orderDate
        this._DTM_X12A(sOrderDate, '004');
        // DTM ACK
        this._DTM_X12A(sNoticeDate, 'ACK');

        let nTaxDetails = this._es('Tax/TaxDetail', nHeader);
        for (let nTaxDetail of nTaxDetails) {
            let vPurpose = this._v('@purpose', nTaxDetail);
            if (vPurpose != 'tax') {
                continue;
            }
            let TXI = this._initSegX12('TXI', 8);
            let vDesc = this._v('Description', nTaxDetail).trim();
            if (vDesc) {
                this._setV(TXI, 1, this._mci(MAPS.mapTXI963_Desc, vDesc, 'ZZ'));
            }
            this._setV(TXI, 2, this._v('TaxAmount/Money', nTaxDetail));
            this._setV(TXI, 3, this._v('@percentageRate', nTaxDetail));
            this._setV(TXI, 4, 'VD');
            this._setV(TXI, 5, this._v('TaxLocation', nTaxDetail));
            this._setV(TXI, 6, this._v('@exemptDetail', nTaxDetail));
            this._setV(TXI, 8, this._v('TaxableAmount/Money', nTaxDetail));
        } // end loop nTaxDetails

        // All Header N9 segments
        this._N9_Header(nHeader);

        // Group N1
        let nContacts = this._es('Contact', nHeader);
        for (let nContact of nContacts) {
            this._GroupN1(nContact);
        }

        // Details.
        // PO1 Group
        let nItems = this._es('ConfirmationItem', this._rn('ConfirmationRequest'));
        for (let nItem of nItems) {
            let nStatuses = this._es('ConfirmationStatus', nItem);
            if (nStatuses.length <= 0) {
                continue;
            }
            let nFirstStatus = nStatuses[0];
            let nItemIn = this._e('ItemIn', nFirstStatus);
            // PO1
            let PO1 = this._initSegX12('PO1', 3);
            // ConfirmationRequest/ConfirmationItem/@lineNumber
            // (and)
            // ConfirmationRequest/ConfirmationItem/ConfirmationStatus/ItemIn/@lineNumber
            let vLineNumber = this._v('@lineNumber', nItem);
            this._setV(PO1, 1, vLineNumber);
            let vQuantity = this._v('@quantity', nItem);
            this._setV(PO1, 2, vQuantity);
            let vUOM = this._v('UnitOfMeasure', nItem);
            this._setV(PO1, 3, this._v('UnitOfMeasure', nItem));
            // CUR
            let vCurr;
            if (nItemIn) {
                vCurr = this._v('ItemDetail/UnitPrice/Money/@currency', nItemIn);
            } else {
                vCurr = this._v('UnitPrice/Money/@currency ', nFirstStatus);
            }
            if (vCurr) {
                let CUR = this._initSegX12('CUR', 2);
                this._setV(CUR, 1, 'BY');
                this._setV(CUR, 2, vCurr);
                // CTP AS
                let CTP = this._initSegX12('CTP', 3);
                this._setV(CTP, 1, 'AS');
                if (nItemIn) {
                    // CUP
                    this._setV(CTP, 2, 'CUP');
                    this._setV(CTP, 3, this._v('ItemDetail/UnitPrice/Money', nItemIn))
                } else {
                    let vPrice = this._v('UnitPrice/Money ', nItemIn);
                    if (vPrice) {
                        // CHG
                        this._setV(CTP, 2, 'CHG');
                        this._setV(CTP, 3, this._v('UnitPrice/Money ', nFirstStatus))
                    } else {
                        // Let's just said it's CUP
                        this._setV(CTP, 2, 'CUP');
                    }
                }
            } // end if vCurr
            // CTP WS
            if (nItemIn) {
                this._CTP_MEA_PID(nItemIn, nItem);

            }

            this._REF_Item(nItem, nFirstStatus);

            if (nItemIn) {
                this._SAC(nItemIn);
            }
            // Status   
            let iACK06 = 1;
            for (let nStatus of nStatuses) {
                let vType = this._v('@type', nStatus);
                if (vType == 'unknown') {
                    continue;
                }
                let nItemIn = this._e('ItemIn', nStatus);
                let arrItem = [];

                this._ACK_help(nItemIn, arrItem, nStatus);

                let ACK = this._initSegX12('ACK', 6 + arrItem.length * 2);
                switch (vType) {
                    case 'accept':
                        this._setV(ACK, 1, 'IA')
                        break;
                    case 'backordered':
                        this._setV(ACK, 1, 'IB')
                        break;
                    case 'detail':
                        this._setV(ACK, 1, 'IC')
                        break;
                    case 'reject':
                        this._setV(ACK, 1, 'IR')
                        break;
                    default:
                        break;
                } // end switch vTyp
                let vQuantityStatus = this._v('@quantity', nStatus);
                this._setV(ACK, 2, vQuantityStatus);
                // fUnknownQTY -= parseFloat(vQuantityStatus);
                this._setV(ACK, 3, this._v('UnitOfMeasure', nStatus));
                this._setV(ACK, 4, '068');
                let vShipmentDate = this._v('@shipmentDate', nStatus);
                if (vType != 'reject') {
                    let dDTM = Utils.parseToDateSTD2(vShipmentDate);
                    this._setV(ACK, 5, Utils.getYYYYMMDD(dDTM));
                }
                this._setV(ACK, 4, iACK06.toString());
                iACK06++;

                let iEle = 7;
                for (let arr of arrItem) {
                    this._setV(ACK, iEle, arr[0]);
                    this._setV(ACK, iEle + 1, arr[1]);
                    iEle += 2;
                }

                if (vType != 'reject') {
                    this._DTM_X12(nStatus, '@deliveryDate', '017');
                }

            } // end loop nStatuses

            let nTax = this._e('Tax', nItemIn);
            if (nTax) {
                let nTaxDetails = this._es('TaxDetail', nTax);
                for (let nTaxDetail of nTaxDetails) {
                    let vPurpose = this._v('@purpose', nTaxDetail);
                    if (vPurpose != 'tax') {
                        continue;
                    }
                    let TXI = this._initSegX12('TXI', 8);
                    let vDesc = this._v('Description', nTaxDetail).trim();
                    if (vDesc) {
                        this._setV(TXI, 1, this._mci(MAPS.mapTXI963_Desc, vDesc, 'ZZ'));
                    }
                    this._setV(TXI, 2, this._v('TaxAmount/Money', nTaxDetail));
                    this._setV(TXI, 3, this._v('@percentageRate', nTaxDetail));
                    this._setV(TXI, 4, 'VD');
                    this._setV(TXI, 5, this._v('TaxLocation', nTaxDetail));
                    this._setV(TXI, 6, this._v('@exemptDetail', nTaxDetail));
                    this._setV(TXI, 8, this._v('TaxableAmount/Money', nTaxDetail));
                } // end loop nTaxDetails
            } // end if nTax

            for (let nStatus of nStatuses) {
                let nSchedRef = this._e('ScheduleLineReference', nStatus);
                if (nSchedRef) {
                    this._ScheduleLineReference(nSchedRef, vUOM);

                } // end if nSchedRef
            }

            // N9 Shipping
            let vShippingDesc = this._v('Shipping/Description', nItemIn);
            if (vShippingDesc) {
                let N9 = this._initSegX12('N9', 3);
                this._setV(N9, 1, 'L1');
                this._setV(N9, 2, this._v('Shipping/Description/@xml:lang', nItemIn));
                this._setV(N9, 3, 'shipping');
                this._MSG(vShippingDesc);
            }

            // N9 tax
            let vTaxDesc = this._v('Tax/Description', nItemIn);
            if (vTaxDesc) {
                let N9 = this._initSegX12('N9', 3);
                this._setV(N9, 1, 'L1');
                this._setV(N9, 2, this._v('Tax/Description/@xml:lang', nItemIn));
                this._setV(N9, 3, 'tax');
                this._MSG(vTaxDesc);
            }
            // N9 Comments
            let nComments = this._e('Comments', nFirstStatus);
            if (nComments) {
                let N9 = this._initSegX12('N9', 3);
                this._setV(N9, 1, 'L1');
                this._setV(N9, 2, this._v('@xml:lang', nComments));
                this._setV(N9, 3, 'Comments');
                let MSG = this._initSegX12('MSG', 2);
                this._setV(MSG, 1, this._v('', nComments));
                this._setV(MSG, 2, 'LC');
            }

            // N9 Reject Reason Comments
            let vRejectReason = this._v('Extrinsic[@name="RejectionReasonComments"]', nFirstStatus);
            if (vRejectReason) {
                let N9 = this._initSegX12('N9', 3);
                this._setV(N9, 1, 'L1');
                this._setV(N9, 3, 'RejectionReason');
                let MSG = this._initSegX12('MSG', 1);
                this._setV(MSG, 1, this._mci(MAPS.mapN9_RejectReason, vRejectReason));
                N9 = this._initSegX12('N9', 3);
                this._setV(N9, 1, 'L1');
                this._setV(N9, 3, 'CustomRejectionReasonComments');
                MSG = this._initSegX12('MSG', 2);
                this._setV(MSG, 1, vRejectReason);
            }
            // N9 CustomRjectReason
            vRejectReason = this._v('Extrinsic[@name="RejectionReason"]', nFirstStatus);
            if (vRejectReason) {
                let N9 = this._initSegX12('N9', 3);
                this._setV(N9, 1, 'L1');
                this._setV(N9, 3, 'CustomRejectionReason');
                this._MSG(vRejectReason);
            }

            // N9 ZZ
            let nExts = this._es('Extrinsic', nFirstStatus);
            for (let nExt of nExts) {
                let vName = this._v('@name', nExt);
                let vValue = this._v('', nExt);
                if (vName.startsWith('RejectionReason')) {
                    // already done before
                    continue;
                }
                let N9 = this._initSegX12('N9', 3);
                this._setV(N9, 1, 'ZZ');
                this._setV(N9, 2, vName);
                this._setV(N9, 3, vValue.substring(0, 45));
                this._MSG(vValue);
                //this._setV(MSG,2,'LC');
            }

            // Group N1, don't ask me why it's in nStatuses loop
            let nContacts = this._es('Contact', nItem);
            for (let nContact of nContacts) {
                this._GroupN1(nContact);
            }
        } // end loop nItems

        // CTT 
        let CTT = this._initSegX12('CTT', 1);
        if (nItems.length > 0) {
            this._setV(CTT, 1, nItems.length.toString());
        } else {
            // it's Mandatory seg ..., so just set '1'
            this._setV(CTT, 1, '1');
        }

        // AMT
        let vTotalMoney = this._v('Total/Money', nHeader);
        vTotalMoney = vTotalMoney ? vTotalMoney : '0.00'
        let AMT = this._initSegX12('AMT', 2);
        this._setV(AMT, 1, 'TT');
        this._setV(AMT, 2, vTotalMoney);

        this._SE();
        this._GE();
        this._IEA();

        this._tidySegCascade();
        const output = this._segs.join(constants.ediDocument.lineBreak);
        return output;
    }

    private _ACK_help(nItemIn: Element, arrItem: any[], nStatus: Element) {
        let vBuyerPartID = this._v('ItemID/BuyerPartID', nItemIn);
        if (vBuyerPartID) {
            arrItem.push(['BP', vBuyerPartID]);
        }
        let vSupplierPartID = this._v('ItemID/SupplierPartID', nItemIn);
        if (vSupplierPartID) {
            arrItem.push(['VP', vSupplierPartID]);
        }

        let vSupplierPartAuxiliaryID = this._v('ItemID/SupplierPartAuxiliaryID', nItemIn);
        if (vSupplierPartAuxiliaryID) {
            arrItem.push(['VS', vSupplierPartAuxiliaryID]);
        }
        let vManufacturerPartID = this._v('ItemDetail/ManufacturerPartID', nItemIn);
        if (vManufacturerPartID) {
            arrItem.push(['MG', vManufacturerPartID]);
        }
        let vManufacturerName = this._v('ItemDetail/ManufacturerName', nItemIn);
        if (vManufacturerName) {
            arrItem.push(['MF', vManufacturerName]);
        }
        let vDescription = this._v('ItemDetail/Description', nItemIn);
        if (vDescription) {
            arrItem.push(['PD', vDescription]);
        }
        let vUNSPSC = this._v('ItemDetail/Classification [@domain="UNSPSC"]/@code', nItemIn);
        if (vUNSPSC) {
            arrItem.push(['C3', vUNSPSC]);
        }
        let vSupplierBatchID = this._v('SupplierBatchID', nStatus);
        if (vSupplierBatchID) {
            arrItem.push(['B8', vSupplierBatchID]);
        }
        let vUPCID = this._v('ItemDetail/Extrinsic [@name="UPCID"]', nItemIn);
        if (vUPCID) {
            arrItem.push(['UP', vUPCID]);
        }
    }

    private _ScheduleLineReference(nSchedRef: Element, vUOM: string) {
        // SCH
        let SCH = this._initSegX12('SCH', 11);
        this._setV(SCH, 1, this._v('@quantity', nSchedRef));
        this._setV(SCH, 2, vUOM);
        this._setV(SCH, 5, '002');
        let dReqDeliveryDate = Utils.parseToDateSTD2(this._v('@requestedDeliveryDate', nSchedRef));
        if (dReqDeliveryDate) {
            this._setV(SCH, 6, Utils.getYYYYMMDD(dReqDeliveryDate));
            this._setV(SCH, 7, Utils.getHHMMSS(dReqDeliveryDate));
        }
        let vLineNum = this._v('@lineNumber', nSchedRef);
        if (vLineNum) {
            this._setV(SCH, 11, vLineNum);
        }
        // REF for Scheduleline Delivery Date
        if (dReqDeliveryDate) {
            let REF = this._initSegX12('REF', 3);
            this._setV(REF, 1, '0N');
            this._setV(REF, 2, 'SCH05TimeZone');
            this._setV(REF, 3, Utils.getTMZ2(dReqDeliveryDate));
        }
        // REF ZZ
        let nExtrins = this._es(XML.Extrinsic, nSchedRef);
        for (let n of nExtrins) {
            let sName = this._v('@name', n);
            if (sName) {
                let RFF = this._initSegX12('REF', 3);
                this._setV(RFF, 1, 'ZZ');
                this._setV(RFF, 2, sName);
                this._setV(RFF, 3, this._v('', n));
            }
        }
        // REF 0L , bypass because I always see ACK06 is blank
    }

    private _SAC_Modification(nMod: Element) {
        let vName = this._v('ModificationDetail/@name', nMod);
        let sSAC1 = 'A'; // "A" = Allowance, "C" = Charge 
        let nAdditionalCost = this._e('AdditionalCost', nMod);
        if (nAdditionalCost) {
            sSAC1 = 'C'; // Charge
        }
        let SAC = this._initSegX12('SAC', 16);
        this._setV(SAC, 1, sSAC1);
        this._setV(SAC, 2, this._mci(MAPS.mapSAC1300, vName));
        let sSAC12: string = '';
        if (sSAC1 == 'A') {
            // Allowance
            let nDeductionAmount = this._e('AdditionalDeduction/DeductionAmount', nMod);
            let nDeductedPrice = this._e('AdditionalDeduction/DeductedPrice', nMod);
            if (nDeductionAmount) {
                sSAC12 = '13';
                this._setV(SAC, 5, this._x100(this._v('Money', nDeductionAmount)));
            } else if (nDeductedPrice) {
                this._setV(SAC, 5, this._x100(this._v('Money', nDeductedPrice)));
            }
        } else {
            // Charge
            this._setV(SAC, 5, this._x100(this._v('Money', nAdditionalCost)));
        }
        this._setV(SAC, 6, '3');
        // SAC7
        if (sSAC1 == 'A') {
            // Allowance
            let vPercent = this._v('AdditionalDeduction/DeductionPercent/@percent', nMod);
            if (vPercent) {
                this._setV(SAC, 7, vPercent);
            }
        } else {
            // Charge
            let vPercent = this._v('Percentage/@percent', nAdditionalCost);
            if (vPercent) {
                this._setV(SAC, 7, vPercent);
            }
        }
        // If "13" is mapped, map SAC05 to DeductionAmount, else map to DeductedPrice
        if (sSAC12) {
            this._setV(SAC, 12, sSAC12);
        }
        let nOriginalPrice = this._e('OriginalPrice', nMod);
        if (nOriginalPrice) {
            this._setV(SAC, 13, this._v('Money', nOriginalPrice));
            this._setV(SAC, 14, this._v('@type', nOriginalPrice));
        }
        let nDesc = this._e('ModificationDetail/Description', nMod);
        if (nDesc) {
            this._setV(SAC, 15, this._v('', nDesc));
            this._setV(SAC, 16, this._v('@xml:lang', nDesc));
        }
        // CUR
        let vCurr;
        if (sSAC1 == 'A') {
            // Allowance
            let nMoney = this._e('AdditionalDeduction/DeductionAmount/Money/@currency', nMod);
            vCurr = this._v('@currency', nMoney)
        } else {
            // Charge
            let nMoney = this._e('Money', nAdditionalCost);
            vCurr = this._v('@currency', nMoney)
        }

        if (vCurr) {
            let CUR = this._initSegX12('CUR', 12);
            this._setV(CUR, 1, 'BY');
            this._setV(CUR, 2, vCurr);
            // CUR startDate
            let dStartDTM = Utils.parseToDateSTD2(this._v('ModificationDetail/@startDate', nMod));
            if (dStartDTM) {
                this._setV(CUR, 7, '196');
                this._setV(CUR, 8, Utils.getYYYYMMDD(dStartDTM));
                this._setV(CUR, 9, Utils.getHHMMSS(dStartDTM));
            }

            // CUR endDate
            let dEndDTM = Utils.parseToDateSTD2(this._v('ModificationDetail/@endDate', nMod));
            if (dEndDTM) {
                this._setV(CUR, 10, '197');
                this._setV(CUR, 11, Utils.getYYYYMMDD(dEndDTM));
                this._setV(CUR, 12, Utils.getHHMMSS(dEndDTM));
            }
        }
    } // end function _SAC_Modification

    private _REF_Item(nItem: Element, nFirstStatus: Element) {
        // REF FL
        let vItemType = this._v('@itemType', nItem);
        if (vItemType) {
            let REF = this._initSegX12('REF', 3);
            this._setV(REF, 1, 'FL');
            this._setV(REF, 2, this._v('@parentLineNumber', nItem));
            this._setV(REF, 3, vItemType);
        }
        // REF All Others
        let nExts = this._es('Extrinsic', nFirstStatus);
        for (let nExt of nExts) {
            let vExtName = this._v('@name', nExt);
            let REF = this._initSegX12('REF', 3);
            let value = this._v('', nExt);
            if (this._mei(MAPS.mapREF128, vExtName)) {
                this._setV(REF, 1, this._mci(MAPS.mapREF128, vExtName));

                this._setV(REF, 2, value.substring(0, 30));
                if (value.length > 30) {
                    this._setV(REF, 3, value.substring(30));
                }
            } else {
                // ZZ
                this._setV(REF, 1, 'ZZ');
                this._setV(REF, 2, vExtName);
                this._setV(REF, 3, value);
            }
        }
    }

    private _CTP_MEA_PID(nItemIn: Element, nItem: Element) {
        let nPriceBasisQuantity = this._e('ItemDetail/PriceBasisQuantity', nItemIn);
        let CTP = this._initSegX12('CTP', 7);
        this._setV(CTP, 1, 'WS');
        this._setV(CTP, 4, this._v('@quantity', nPriceBasisQuantity));
        let vUOM = this._v('UnitOfMeasure', nPriceBasisQuantity);
        this._setV(CTP, 501, this._mcs(MAPS.mapUOM355, vUOM));
        this._setV(CTP, 6, 'CSD');
        this._setV(CTP, 7, this._v('@conversionFactor', nPriceBasisQuantity));
        // MEA
        let nDim = this._e('ItemDetail/Dimension', nItemIn);
        if (nDim) {
            let MEA = this._initSegX12('MEA', 4);
            this._setV(MEA, 1, 'PD');
            let vType = this._v('@type', nDim);
            let vUOM = this._v('UnitOfMeasure', nDim);
            this._setV(MEA, 2, this._mci(MAPS.mapMEA738, vType));
            this._setV(MEA, 3, this._v('@quantity', nDim));
            this._setV(MEA, 401, this._mcs(MAPS.mapUOM355, vUOM));
        }
        // PID Desc
        let vDesc = this._vt2('ItemDetail/Description', nItemIn);
        if (vDesc) {
            let PID = this._initSegX12('PID', 9);
            this._setV(PID, 1, 'F');
            this._setV(PID, 5, vDesc);
            let vLang = this._v('ItemDetail/Description/@xml:lang', nItemIn);
            vLang = vLang ? vLang : 'en';
            this._setV(PID, 9, vLang);
            // PID ShortName
            let vShortName = this._v('ItemDetail/Description/ShortName', nItemIn);
            if (vShortName) {
                let PID_ShortName = this._initSegX12('PID', 9);
                this._setV(PID_ShortName, 1, 'F');
                this._setV(PID_ShortName, 2, 'GEN');
                this._setV(PID_ShortName, 5, vShortName);
                this._setV(PID_ShortName, 9, vLang);
            }
        }
    }

    private _SAC(nItemIn: Element) {
        let nShipping = this._e('Shipping', nItemIn);
        if (nShipping) {
            // SAC G830
            let SAC = this._initSegX12('SAC', 16);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'G830');
            this._setV(SAC, 5, this._x100(this._v('Money', nShipping)));
            this._setV(SAC, 13, this._v('@trackingId', nShipping));
            this._setV(SAC, 14, this._v('@trackingDomain', nShipping));
            this._setV(SAC, 15, this._v('Description', nShipping));
            this._setV(SAC, 16, this._v('Description/@xml:lang', nShipping));
            // CUR
            let vCurr = this._v('Money/@currency', nShipping);
            if (vCurr) {
                let CUR = this._initSegX12('CUR', 2);
                this._setV(CUR, 1, 'BY');
                this._setV(CUR, 2, vCurr);
            }
        }
        let nTax = this._e('Tax', nItemIn);
        if (nTax) {
            // SAC H850
            let SAC = this._initSegX12('SAC', 16);
            this._setV(SAC, 1, 'C');
            this._setV(SAC, 2, 'H850');
            this._setV(SAC, 5, this._x100(this._v('Money', nTax)));
            this._setV(SAC, 15, this._v('Description', nTax));
            this._setV(SAC, 16, this._v('Description/@xml:lang', nTax));
            // CUR
            let vCurr = this._v('Money/@currency', nTax);
            if (vCurr) {
                let CUR = this._initSegX12('CUR', 2);
                this._setV(CUR, 1, 'BY');
                this._setV(CUR, 2, vCurr);
            }
        } // end if nTax

        // SAC modifications
        let nMods = this._es('ItemDetail/UnitPrice/Modifications/Modification', nItemIn);
        for (let nMod of nMods) {
            this._SAC_Modification(nMod);
        }

    } // end function _SAC

    private _N9_Header(nHeader: Element) {
        // N9 Comments
        let nComments = this._e('Comments', nHeader);
        if (nComments) {
            let N9 = this._initSegX12('N9', 3);
            this._setV(N9, 1, 'L1');
            this._setV(N9, 2, this._v('@xml:lang', nComments));
            this._setV(N9, 3, 'Comments');
            let MSG = this._initSegX12('MSG', 1);
            this._setV(MSG, 1, this._v('', nComments));
            // this._setV(MSG, 2, 'LC');
        }

        // N9 Reject Reason Comments
        let vRejectReason = this._v('Extrinsic[@name="RejectionReasonComments"]', nHeader);
        if (vRejectReason) {
            let N9 = this._initSegX12('N9', 3);
            this._setV(N9, 1, 'L1');
            this._setV(N9, 3, 'RejectionReason');
            let MSG = this._initSegX12('MSG', 1);
            this._setV(MSG, 1, this._mci(MAPS.mapN9_RejectReason, vRejectReason));
            N9 = this._initSegX12('N9', 3);
            this._setV(N9, 1, 'L1');
            this._setV(N9, 3, 'CustomRejectionReasonComments');
            MSG = this._initSegX12('MSG', 2);
            this._setV(MSG, 1, vRejectReason);
        }
        // N9 CustomRjectReason
        vRejectReason = this._v('Extrinsic[@name="RejectionReason"]', nHeader);
        if (vRejectReason) {
            let N9 = this._initSegX12('N9', 3);
            this._setV(N9, 1, 'L1');
            this._setV(N9, 3, 'CustomRejectionReason');
            this._MSG(vRejectReason);
        }
        // N9 Shipping
        let vShippingDesc = this._v('Shipping/Description', nHeader);
        if (vShippingDesc) {
            let N9 = this._initSegX12('N9', 3);
            this._setV(N9, 1, 'L1');
            this._setV(N9, 2, this._v('Shipping/Description/@xml:lang', nHeader));
            this._setV(N9, 3, 'shipping');
            this._MSG(vShippingDesc);
        }
        // N9 tax
        let vTaxDesc = this._v('Tax/Description', nHeader);
        if (vTaxDesc) {
            let N9 = this._initSegX12('N9', 3);
            this._setV(N9, 1, 'L1');
            this._setV(N9, 2, this._v('Tax/Description/@xml:lang', nHeader));
            this._setV(N9, 3, 'tax');
            this._MSG(vTaxDesc);
        }
        // N9 ZZ
        // not do that just because Extrinsics are already mapped to REF*ZZ

        // let nExts = this._es('Extrinsic', nHeader);
        // for (let nExt of nExts) {
        //     let vName = this._v('@name', nExt);
        //     let vValue = this._v('', nExt);
        //     if (vName.startsWith('RejectionReason')) {
        //         // already done before
        //         continue;
        //     }
        //     let N9 = this._initSegX12('N9', 3);
        //     this._setV(N9, 1, 'ZZ');
        //     this._setV(N9, 2, vName);
        //     this._setV(N9, 3, vValue.substring(0, 45));
        //     this._MSG(vValue);
        //     //this._setV(MSG,2,'LC');
        // }
    }

    /**
     * X12 MSG segment
     * @param v 
     * @returns 
     */
    private _MSG(v: string) {
        if (!v) {
            return;
        }
        let isFirstLine: boolean = true;
        while (v) {
            let MSG = this._initSegX12('MSG', 2);
            this._setV(MSG, 1, v);
            if (!isFirstLine) {
                this._setV(MSG, 2, 'LC');
            }
            isFirstLine = false;
            v = v.substring(264);
        }
    }

    /**
     * For Group N1
     * @param nHeader 
     */
    private _GroupN1(nContact: Element) {
        // N1
        let sRole = this._v('@role', nContact);
        let N1 = this._initSegX12('N1', 4);
        this._setV(N1, 1, this._mci(MAPS.mapN1_98, sRole));
        this._setV(N1, 2, this._v('Name', nContact));

        let sCodeQualifer = this._v('@addressIDDomain', nContact);
        if (sCodeQualifer) {
            this._setV(N1, 3, this._mci(MAPS.mapN1_66, sCodeQualifer, ''));
            this._setV(N1, 4, this._v('@addressID', nContact));
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


} // end class

class MAPS {
    static mapBAK353: Object = {
        "new": "00",
        // "delete": "03",
        "update": "05",
    };
    static mapBAK587: Object = {
        "detail": "AC",
        "except": "AE",
        "accept": "AT",
        "reject": "RJ",
    };

    static mapFOB335: Object = {
        "cfr": "CFR", // Cost and freight
        "cif": "CIF", // Cost, insurance and freight
        "cip": "CIP", // Carriage and insurance paid to
        "cpt": "CPT", // Carriage paid to
        "daf": "DAF", // Delivered at frontier
        "ddp": "DDP", // Delivered duty paid
        "ddu": "DDU", // Delivered duty unpaid
        "deq": "DEQ", // Delivered ex quay (duty paid)
        "des": "DES", // Delivered ex ship
        "exw": "EXW", // Ex works
        "fas": "FAS", // Free alongside ship
        "fca": "FCA", // Free carrier
        "fob": "FOB", // Free on board vessel
    }
    static mapSAC1300: Object = {
        "access charge": "A040", // Access Charge
        "accountnumbercorrectioncharge": "A050", // AccountNumberCorrectionCharge
        "acidbattery": "A060", // AcidBattery
        "adjustment": "A170", // Adjustment
        "charge": "A520", // Charge
        "carrier": "A960", // Carrier
        "contract allowance": "B660", // Contract Allowance
        "discount-special": "C300", // Discount-Special
        "discount": "C310", // Discount
        "freightbasedondollarminimum": "D180", // FreightBasedOnDollarMinimum
        "freight": "D240", // Freight
        "handling": "D500", // Handling
        "insurance": "D980", // Insurance
        "royalties": "G580", // Royalties
        "shipping": "G821", // Shipping
        "allowance": "H970", // Allowance
        "volume discount": "I530", // Volume Discount
    }
    static mapTXI963_Desc: Object = {
        "stadium tax": "AA", // Stadium Tax
        "surtax": "AB", // Surtax
        "assessment": "AT", // Assessment
        "business privilege tax": "BP", // Business Privilege Tax
        "city tax": "CA", // City Tax
        "threshold tax": "CB", // Threshold Tax
        "federal value-added tax (gst) on goods": "CG", // Federal Value-added Tax (GST) on Goods
        "city rental tax": "CI", // City Rental Tax
        "county/parish sales tax": "CP", // County/Parish Sales Tax
        "county rental tax": "CR", // County Rental Tax
        "city sales tax": "CS", // City Sales Tax
        "county tax": "CT", // County Tax
        "federal value-added tax (gst) on services": "CV", // Federal Value-added Tax (GST) on Services
        "default labor tax": "DL", // Default Labor Tax
        "equipment tax": "EQ", // Equipment Tax
        "energy tax": "ET", // Energy Tax
        "environmental tax": "EV", // Environmental Tax
        "fica tax": "F1", // FICA Tax
        "fica medicare tax": "F2", // FICA Medicare Tax
        "fica social security tax": "F3", // FICA Social Security Tax
        "federal tax": "FD", // Federal Tax
        "fuel super fund tax": "FF", // Fuel Super Fund Tax
        "federal income tax withholding": "FI", // Federal Income Tax Withholding
        "fuel l.u.s.t. tax (leaking underground storage tank)": "FL", // Fuel L.U.S.T. Tax (Leaking Underground Storage Tank)
        "franchise tax": "FR", // Franchise Tax
        "fuel spill tax": "FS", // Fuel Spill Tax
        "federal excise tax": "FT", // Federal Excise Tax
        "gross receipts tax": "GR", // Gross Receipts Tax
        "goods and services tax": "GS", // Goods and Services Tax
        "public health and education tax": "HS", // Public Health and Education Tax
        "handicap tax": "HT", // Handicap Tax
        "hazardous waste tax": "HZ", // Hazardous Waste Tax
        "labor by trade tax": "LB", // Labor By Trade Tax
        "local tax (not sales tax)": "LO", // Local Tax (Not Sales Tax)
        "state and local sales tax": "LS", // State and Local Sales Tax
        "local sales tax (all applicable sales taxes by taxing authority below the state level)": "LT", // Local Sales Tax (All Applicable Sales Taxes by Taxing Authority Below the State Level)
        "leaky underground storage tank (lust) tax (federal)": "LU", // Leaky Underground Storage Tank (LUST) Tax (federal)
        "leaky underground storage tank (lust) tax (state)": "LV", // Leaky Underground Storage Tank (LUST) Tax (state)
        "material tax": "MA", // Material Tax
        "minimum tax": "MN", // Minimum Tax
        "municipal tax": "MP", // Municipal Tax
        "miscellaneous state tax": "MS", // Miscellaneous State Tax
        "metropolitan transit tax": "MT", // Metropolitan Transit Tax
        "other taxes": "OH", // Other Taxes
        "occupational tax": "OT", // Occupational Tax
        "state or provincial tax on goods": "PG", // State or Provincial Tax on Goods
        "state or provincial tax on services": "PS", // State or Provincial Tax on Services
        "state or provincial fuel tax": "SA", // State or Provincial Fuel Tax
        "secondary percentage tax": "SB", // Secondary Percentage Tax
        "school tax": "SC", // School Tax
        "state excise tax": "SE", // State Excise Tax
        "superfund tax": "SF", // Superfund Tax
        "state and local tax": "SL", // State and Local Tax
        "state/provincial tax": "SP", // State/Provincial Tax
        "state rental tax": "SR", // State Rental Tax
        "state tax on specific labor": "SS", // State Tax on Specific Labor
        "state sales tax": "ST", // State Sales Tax
        "sales and use tax": "SU", // Sales and Use Tax
        "enhanced 911 - state excise tax": "SX", // Enhanced 911 - State Excise Tax
        "pre-threshold tax": "T1", // Pre-threshold Tax
        "post threshold tax": "T2", // Post Threshold Tax
        "telecommunications device for the deaf (tdd) service excise tax": "TD", // Telecommunications Device for the Deaf (TDD) Service Excise Tax
        "telecommunications tax": "TT", // Telecommunications Tax
        "all taxes": "TX", // All Taxes
        "license tax": "UL", // License Tax
        "utility users' tax": "UT", // Utility Users' Tax
        "value added tax": "VA", // Value Added Tax
        "well service": "WS", // Well Service
        "911-city tax": "ZA", // 911-City Tax
        "911-county tax": "ZB", // 911-County Tax
        "911-excise tax": "ZC", // 911-Excise Tax
        "911-state tax": "ZD", // 911-State Tax
        "911-tax": "ZE", // 911-Tax
        "mutually defined": "ZZ", // Mutually Defined
    }

    /**
     * Not intend to use it, so may duplicated entires
     */
    static mapTXI963_Category: Object = {
        "other": "AA", // Stadium Tax
        // "other": "AB", // Surtax
        // "other": "AT", // Assessment
        // "other": "BP", // Business Privilege Tax
        // "other": "CA", // City Tax
        // "other": "CB", // Threshold Tax
        "gst": "CG", // Federal Value-added Tax (GST) on Goods
        // "other": "CI", // City Rental Tax
        "sales": "CP", // County/Parish Sales Tax
        // "other": "CR", // County Rental Tax
        // "sales": "CS", // City Sales Tax
        // "other": "CT", // County Tax
        // "gst": "CV", // Federal Value-added Tax (GST) on Services
        // "other": "DL", // Default Labor Tax
        // "other": "EQ", // Equipment Tax
        // "other": "ET", // Energy Tax
        // "other": "EV", // Environmental Tax
        // "other": "F1", // FICA Tax
        // "other": "F2", // FICA Medicare Tax
        // "other": "F3", // FICA Social Security Tax
        // "usage": "FD", // Federal Tax"
        // "other": "FF", // Fuel Super Fund Tax
        // "other": "FI", // Federal Income Tax Withholding
        // "other": "FL", // Fuel L.U.S.T. Tax (Leaking Underground Storage Tank)
        // "other": "FR", // Franchise Tax
        // "other": "FS", // Fuel Spill Tax
        // "other": "FT", // Federal Excise Tax
        // "other": "GR", // Gross Receipts Tax
        // "gst": "GS", // Goods and Services Tax
        // "other": "HS", // Public Health and Education Tax
        // "other": "HT", // Handicap Tax
        // "other": "HZ", // Hazardous Waste Tax
        // "other": "LB", // Labor By Trade Tax
        // "other": "LO", // Local Tax (Not Sales Tax)
        // "other": "LS", // State and Local Sales Tax
        // "sales": "LT", // Local Sales Tax (All Applicable Sales Taxes by Taxing Authority Below the State Level)
        // "other": "LU", // Leaky Underground Storage Tank (LUST) Tax (federal)
        // "other": "LV", // Leaky Underground Storage Tank (LUST) Tax (state)
        // "other": "MA", // Material Tax
        // "other": "MN", // Minimum Tax
        // "other": "MP", // Municipal Tax
        // "other": "MS", // Miscellaneous State Tax
        // "other": "MT", // Metropolitan Transit Tax
        // "other": "OH", // Other Taxes
        // "other": "OT", // Occupational Tax
        // "other": "PG", // State or Provincial Tax on Goods
        // "other": "PS", // State or Provincial Tax on Services
        // "other": "SA", // State or Provincial Fuel Tax
        // "other": "SB", // Secondary Percentage Tax
        // "other": "SC", // School Tax
        // "usage": "SE", // State Excise Tax"
        // "other": "SF", // Superfund Tax
        // "other": "SL", // State and Local Tax
        // "other": "SP", // State/Provincial Tax
        // "other": "SR", // State Rental Tax
        // "other": "SS", // State Tax on Specific Labor
        // "sales": "ST", // State Sales Tax
        // "sales": "SU", // Sales and Use Tax
        // "other": "SX", // Enhanced 911 - State Excise Tax
        // "other": "T1", // Pre-threshold Tax
        // "other": "T2", // Post Threshold Tax
        // "other": "TD", // Telecommunications Device for the Deaf (TDD) Service Excise Tax
        // "usage": "TT", // Telecommunications Tax"
        // "other": "TX", // All Taxes
        // "other": "UL", // License Tax
        // "usage": "UT", // Utility Users' Tax"
        // "vat": "VA", // Value Added Tax
        // "other": "WS", // Well Service
        // "other": "ZA", // 911-City Tax
        // "other": "ZB", // 911-County Tax
        // "usage": "ZC", // 911-Excise Tax"
        // "other": "ZD", // 911-State Tax
        // "other": "ZE", // 911-Tax
        // "other": "ZZ", // Mutually Defined

    }

    /**
     * 
     */
    static mapN9_RejectReason: Object = {
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
    static mapUOM355: Object = {
        "5": "05", // lift
        "6": "04", // small spray
        "8": "08", // heat lot
        "10": "10", // group
        "11": "11", // outfit
        "13": "13", // ration
        "14": "14", // shot
        "15": "15", // stick. military
        "16": "16", // hundred fifteen kg drum
        "17": "17", // hundred lb drum
        "18": "18", // fiftyfive gallon (US) drum
        "19": "19", // tank truck
        "20": "20", // twenty foot container
        "21": "21", // forty foot container
        "22": "22", // decilitre per gram
        "23": "23", // gram per cubic centimetre
        "24": "24", // theoretical pound
        "25": "25", // gram per square centimetre
        "26": "26", // actual ton
        "27": "27", // theoretical ton
        "28": "28", // kilogram per square metre
        "29": "29", // pound per thousand square foot
        "30": "30", // horse power day per air dry metric ton
        "31": "31", // catch weight
        "32": "32", // kilogram per air dry metric ton
        "33": "33", // kilopascal square metre per gram
        "34": "34", // kilopascal per millimetre
        "35": "35", // millilitre per square centimetre second
        "36": "36", // cubic foot per minute per square foot
        "37": "37", // ounce per square foot
        "38": "38", // ounce per square foot per 0.01inch
        "40": "40", // millilitre per second
        "41": "41", // millilitre per minute
        "43": "43", // super bulk bag
        "44": "44", // fivehundred kg bulk bag
        "45": "45", // threehundred kg bulk bag
        "46": "46", // fifty lb bulk bag
        "47": "47", // fifty lb bag
        "48": "48", // bulk car load
        "53": "53", // theoretical kilogram
        "54": "54", // theoretical tonne
        "56": "56", // sitas
        "57": "57", // mesh
        "58": "58", // net kilogram
        "59": "59", // part per million
        "60": "60", // percent weight
        "61": "61", // part per billion (US)
        "62": "62", // percent per 1000 hour
        "63": "63", // failure rate in time
        "64": "64", // pound per square inch. gauge
        "66": "66", // oersted
        "69": "69", // test specific scale
        "71": "71", // volt ampere per pound
        "72": "72", // watt per pound
        "73": "73", // ampere tum per centimetre
        "74": "74", // millipascal
        "76": "76", // gauss
        "77": "77", // milli-inch
        "78": "78", // kilogauss
        "80": "80", // pound per square inch absolute
        "81": "81", // henry
        "84": "84", // kilopound-force per square inch
        "85": "85", // foot pound-force
        "87": "87", // pound per cubic foot
        "89": "89", // poise
        "90": "90", // Saybold universal second
        "91": "91", // stokes
        "92": "92", // calorie per cubic centimetre
        "93": "93", // calorie per gram
        "94": "94", // curl unit
        "95": "95", // twenty thousand gallon (US) tankcar
        "96": "96", // ten thousand gallon (US) tankcar
        "97": "97", // ten kg drum
        "98": "98", // fifteen kg drum
        "1A": "1A", // car mile
        "1B": "1B", // car count
        "1C": "1C", // locomotive count
        "1D": "1D", // caboose count
        "1E": "1E", // empty car
        "1F": "1F", // train mile
        "1G": "1G", // fuel usage gallon (US)
        "1H": "1H", // caboose mile
        "1I": "1I", // fixed rate
        "1J": "1J", // ton mile
        "1K": "1K", // locomotive mile
        "1L": "1L", // total car count
        "1M": "1M", // total car mile
        "1X": "1X", // quarter mile
        "2A": "2A", // radian per second
        "2B": "2B", // radian per second squared
        "2C": "2C", // roentgen
        "2I": "2I", // British thermal unit (international table) per hour
        "2J": "2J", // cubic centimetre per second
        "2K": "2K", // cubic foot per hour
        "2L": "2L", // cubic foot per minute
        "2M": "2M", // centimetre per second
        "2N": "2N", // decibel
        "2P": "2P", // kilobyte
        "2Q": "2Q", // kilobecquerel
        "2R": "2R", // kilocurie
        "2U": "2U", // megagram
        "2V": "2V", // megagram per hour
        "2W": "2W", // bin
        "2X": "2X", // metre per minute
        "2Y": "2Y", // milliroentgen
        "2Z": "2Z", // millivolt
        "3B": "3B", // megajoule
        "3C": "3C", // manmonth
        "3E": "3E", // pound per pound of product
        "3G": "3G", // pound per piece of product
        "3H": "3H", // kilogram per kilogram of product
        "3I": "3I", // kilogram per piece of product
        "4A": "4A", // bobbin
        "4B": "4B", // cap
        "4C": "4C", // centistokes
        "4E": "4E", // twenty pack
        "4G": "4G", // microlitre
        "4H": "4H", // micrometre (micron)
        "4K": "4K", // milliampere
        "4L": "4L", // megabyte
        "4M": "4M", // milligram per hour
        "4N": "4N", // megabecquerel
        "4O": "4O", // microfarad
        "4P": "4P", // newton per metre
        "4Q": "4Q", // ounce inch
        "4R": "4R", // ounce foot
        "4T": "4T", // picofarad
        "4U": "4U", // pound per hour
        "4W": "4W", // ton (US) per hour
        "4X": "4X", // kilolitre per hour
        "5A": "5A", // barrel (US) per minute
        "5B": "5B", // batch
        "5C": "5C", // gallon(US) per thousand
        "5E": "5E", // MMSCF/day
        "5F": "5F", // pound per thousand
        "5G": "5G", // pump
        "5H": "5H", // stage
        "5I": "5I", // standard cubic foot
        "5J": "5J", // hydraulic horse power
        "5K": "5K", // count per minute
        "5P": "5P", // seismic level
        "5Q": "5Q", // seismic line
        "A11": "AG", // angstrom
        "A53": "79", // electronvolt
        "AA": "AA", // ball
        "AB": "AB", // bulk pack
        "ACR": "AC", // acre
        "ACT": "KU", // activity
        "AD": "AD", // byte
        "AE": "AE", // ampere per metre
        "AH": "AH", // additional minute
        "AI": "AI", // average minute per call
        "AJ": "AJ", // cop
        "AK": "AK", // fathom
        "AL": "AL", // access line
        "AM": "AM", // ampoule
        "AMP": "68", // ampere
        "ANN": "YR", // year
        "AP": "AP", // aluminium pound only
        "APZ": "TO", // troy ounce or apothecary ounce
        "AQ": "AQ", // anti-hemophilic factor (AHF) unit
        "AR": "AR", // suppository
        "AS": "AS", // assortment
        "ATM": "AT", // standard atmosphere
        "AV": "AV", // capsule
        "AW": "AW", // powder filled vial
        "AY": "AY", // assembly
        "AZ": "AZ", // British thermal unit (international table) per pound
        "B0": "B0", // Btu per cubic foot
        "B1": "B1", // barrel (US) per day
        "B2": "B2", // bunk
        "B3": "B3", // batting pound
        "B35": "3F", // kilogram per litre
        "B4": "B4", // barrel. imperial
        "B5": "B5", // billet
        "B6": "B6", // bun
        "B7": "B7", // cycle
        "B9": "B9", // batt
        "BB": "BB", // base box
        "BD": "B8", // board
        "BE": "BD", // bundle
        "BFT": "BF", // board foot
        "BG": "BG", // bag
        "BH": "BH", // brush
        "BHP": "BQ", // brake horse power
        "BJ": "BC", // bucket
        "BK": "BS", // basket
        "BL": "BA", // bale
        "BLL": "BR", // barrel (US)
        "BO": "BO", // bottle
        "BP": "BP", // hundred board foot
        "BQL": "R2", // becquerel
        "BR": "BI", // bar [unit of packaging]
        "BT": "BM", // bolt
        "BTU": "BY", // British thermal unit (international table)
        "BUA": "BU", // bushel (US)
        "BUI": "BV", // bushel (UK)
        "BW": "BW", // base weight
        "BX": "BX", // box
        "BZ": "BZ", // million BTUs
        "C0": "C0", // call
        "C1": "C1", // composite product pound (total weight)
        "C18": "", // millimole
        "C2": "C2", // carset
        "C34": "F5", // mole
        "C4": "C4", // carload
        "C5": "C5", // cost
        "C6": "C6", // cell
        "C62": "UN", // one
        "C7": "C7", // centipoise
        "C77": "PJ", // pound gage
        "C81": "RB", // radian
        "C9": "C9", // coil group
        "CA": "CN", // can
        "CEL": "CE", // degree Celsius
        "CEN": "HU", // hundred
        "CG": "CG", // card
        "CGM": "AF", // centigram
        "CH": "Z2", // container
        "CJ": "CJ", // cone
        "CK": "CK", // connector
        "CL": "CX", // coil
        "CLT": "C3", // centilitre
        "CMK": "SC", // square centimetre
        "CMQ": "CC", // cubic centimetre
        "CMT": "CM", // centimetre
        "CN": "CH", // 
        "CNP": "4F", // hundred pack
        "CO": "CB", // carboy
        "COU": "65", // coulomb
        "CQ": "CQ", // cartridge
        "CR": "CP", // crate
        "CS": "CA", // case
        "CT": "CT", // carton
        "CTM": "CD", // metric carat
        "CU": "CU", // cup
        "CUR": "4D", // curie
        "CV": "CV", // cover
        "CWA": "CW", // hundred pound (cwt) / hundred weight (US)
        "CWI": "HW", // hundred weight (UK)
        "CY": "CL", // cylinder
        "CZ": "CZ", // combo
        "D14": "TU", // thousand linear yard
        "D23": "N4", // pen gram (protein)
        "D5": "D5", // kilogram per square centimetre
        "D63": "BK", // book
        "D64": "BL", // block
        "D65": "RO", // round
        "D66": "CS", // cassette
        "D67": "A8", // dollar per hour
        "D7": "SA", // sandwich
        "D79": "BE", // beam
        "D8": "D8", // draize score
        "D9": "D9", // dyne per square centimetre
        "D90": "CO", // cubic metre (net)
        "D91": "R8", // rem
        "D92": "BJ", // band
        "D95": "JG", // joule per gram
        "D96": "PG", // pound gross
        "D97": "PL", // pallet/unit load
        "D98": "PU", // mass pound
        "D99": "SL", // sleeve
        "DAY": "DA", // day
        "DB": "DB", // dry pound
        "DC": "DC", // disk (disc)
        "DD": "DD", // degree [unit of angle]
        "DE": "DE", // deal
        "DG": "DG", // decigram
        "DI": "DI", // dispenser
        "DJ": "DJ", // decagram
        "DLT": "DL", // decilitre
        "DMK": "D3", // square decimetre
        "DMQ": "C8", // cubic decimetre
        "DMT": "DM", // decimetre
        "DN": "DN", // decinewton metre
        "DPR": "DP", // dozen pair
        "DQ": "DQ", // data record
        "DR": "DR", // drum
        "DRA": "DF", // dram (US)
        "DS": "DS", // display
        "DT": "DT", // dry ton
        "DU": "DU", // dyne
        "DWT": "WP", // pennyweight
        "DX": "DX", // dyne per centimetre
        "DY": "DY", // directory book
        "DZN": "DZ", // dozen
        "E2": "BT", // belt
        "E3": "NT", // trailer
        "E4": "GT", // gross kilogram
        "E5": "MT", // metric long ton
        "E51": "JA", // job
        "EA": "EA", // each
        "EB": "EB", // electronic mail box
        "EC": "EC", // each per month
        "EP": "EP", // eleven pack
        "EQ": "EQ", // equivalent gallon
        "EV": "EV", // envelope
        "F1": "F1", // thousand cubic foot per day
        "F9": "F9", // fibre per cubic centimetre of air
        "FAH": "FA", // degree Fahrenheit
        "FAR": "83", // farad
        "FB": "FB", // field
        "FC": "FC", // thousand cubic foot
        "FD": "FD", // million particle per cubic foot
        "FE": "FE", // track foot
        "FF": "FF", // hundred cubic metre
        "FG": "FG", // transdermal patch
        "FH": "FH", // micromole
        "FL": "FL", // flake ton
        "FM": "FM", // million cubic foot
        "FOT": "FT", // foot
        "FP": "FP", // pound per square foot
        "FR": "FR", // foot per minute
        "FS": "FS", // foot per second
        "FTK": "SF", // square foot
        "FTQ": "CF", // cubic foot
        "G2": "G2", // US gallon per minute
        "G3": "G3", // Imperial gallon per minute
        "G7": "G7", // microfiche sheet
        "GB": "GB", // gallon (US) per day
        "GBQ": "G4", // gigabecquerel
        "GC": "GC", // gram per 100 gram
        "GD": "GD", // gross barrel
        "GE": "GE", // pound per gallon (US)
        "GGR": "GG", // great gross
        "GH": "GH", // half gallon (US)
        "GII": "G5", // gill (UK)
        "GJ": "GJ", // gram per millilitre
        "GK": "GK", // gram per kilogram
        "GL": "GL", // gram per litre
        "GLI": "GI", // gallon (UK)
        "GLL": "GA", // gallon (US)
        "GM": "GM", // gram per square metre
        "GN": "GN", // gross gallon
        "GO": "GO", // milligram per square metre
        "GP": "GP", // milligram per cubic metre
        "GQ": "GQ", // microgram per cubic metre
        "GRM": "GR", // gram
        "GRN": "GX", // grain
        "GRO": "GS", // gross
        "GT": "TG", // gross ton
        "GV": "GV", // gigajoule
        "GW": "GW", // gallon per thousand cubic foot
        "GY": "GY", // gross yard
        "GZ": "GZ", // gage system
        "H1": "H1", // half page â€“ electronic
        "H2": "H2", // half litre
        "H87": "PC", // piece
        "HA": "HA", // hank
        "HAR": "HQ", // hectare
        "HBX": "HB", // hundred boxes
        "HC": "HC", // hundred count
        "HD": "HD", // half dozen
        "HE": "HE", // hundredth of a carat
        "HF": "HF", // hundred foot
        "HGM": "HG", // hectogram
        "HH": "HH", // hundred cubic foot
        "HI": "HI", // hundred sheet
        "HJ": "HJ", // metric horse power
        "HK": "HK", // hundred kilogram
        "HL": "HL", // hundred foot (linear)
        "HLT": "H4", // hectolitre
        "HM": "HM", // mile per hour (statute mile)
        "HMT": "E1", // hectometre
        "HN": "HN", // conventional millimetre of mercury
        "HO": "HO", // hundred troy ounce
        "HP": "HP", // conventional millimetre of water
        "HS": "HS", // hundred square foot
        "HT": "HT", // half hour
        "HTZ": "HZ", // hertz
        "HUR": "HR", // hour
        "HY": "HY", // hundred yard
        "IA": "IA", // inch pound (pound inch)
        "IC": "IC", // count per inch
        "IE": "IE", // person
        "IF": "IF", // inches of water
        "II": "II", // column inch
        "IL": "IL", // inch per minute
        "IM": "IM", // impression
        "INH": "IN", // inch
        "INK": "SI", // square inch
        "INQ": "CI", // cubic inch
        "IP": "IP", // insurance policy
        "IT": "IT", // count per centimetre
        "IU": "IU", // inch per second
        "IV": "IV", // inch per second squared
        "J2": "J2", // joule per kilogram
        "JB": "JB", // jumbo
        "JE": "JE", // joule per kelvin
        "JG": "JU", // jug
        "JK": "JK", // megajoule per kilogram
        "JM": "JM", // megajoule per cubic metre
        "JO": "JO", // joint
        "JOU": "86", // joule
        "JR": "JR", // jar
        "K1": "K1", // kilowatt demand
        "K2": "K2", // kilovolt ampere reactive demand
        "K3": "K3", // kilovolt ampere reactive hour
        "K5": "K5", // kilovolt ampere (reactive)
        "K6": "K6", // kilolitre
        "KA": "KA", // cake
        "KB": "KB", // kilocharacter
        "KD": "KD", // kilogram decimal
        "KEL": "KV", // kelvin
        "KF": "KF", // kilopacket
        "KG": "KE", // keg
        "KGM": "KG", // kilogram
        "KI": "KI", // kilogram per millimetre width
        "KJ": "KJ", // kilosegment
        "KJO": "", // kilojoule
        "KL": "KL", // kilogram per metre
        "KMH": "KP", // kilometre per hour
        "KMK": "8U", // square kilometre
        "KMQ": "KC", // kilogram per cubic metre
        "KMT": "DK", // kilometre
        "KNT": "EH", // knot
        "KO": "KO", // milliequivalence caustic potash per gram of product
        "KPA": "KQ", // kilopascal
        "KR": "KR", // kiloroentgen
        "KS": "KS", // thousand pound per square inch
        "KT": "KT", // kit
        "KVA": "K4", // kilovolt - ampere
        "KVT": "", // kilovolt
        "KW": "KW", // kilogram per millimetre
        "KWH": "KH", // kilowatt hour
        "KWT": "K7", // kilowatt
        "KX": "KX", // millilitre per kilogram
        "L2": "L2", // litre per minute
        "LA": "LA", // pound per cubic inch
        "LBR": "LB", // pound
        "LBT": "TX", // troy pound (US)
        "LC": "LC", // linear centimetre
        "LD": "LQ", // litre per day
        "LE": "LE", // lite
        "LEF": "X7", // leaf
        "LF": "LF", // linear foot
        "LH": "LH", // labour hour
        "LI": "LI", // linear inch
        "LJ": "LJ", // large spray
        "LK": "LK", // link
        "LM": "LM", // linear metre
        "LN": "LN", // length
        "LO": "LO", // lot  [unit of procurement]
        "LP": "LP", // liquid pound
        "LR": "LR", // layer
        "LS": "LS", // lump sum
        "LTN": "LG", // ton (UK) or long ton (US)
        "LTR": "LT", // litre
        "LX": "LX", // linear yard per pound
        "LY": "LY", // linear yard
        "M0": "M0", // magnetic tape
        "M1": "M1", // milligram per litre
        "M4": "M4", // monetary value
        "M5": "M5", // microcurie
        "M7": "M7", // micro-inch
        "M9": "M9", // million Btu per 1000 cubic foot
        "MA": "MA", // machine per unit
        "MBF": "TM", // thousand board foot
        "MBR": "M6", // millibar
        "MC": "MC", // microgram
        "MCU": "MU", // millicurie
        "MD": "MD", // air dry metric ton
        "MF": "MF", // milligram per square foot per side
        "MGM": "ME", // milligram
        "MHZ": "N6", // megahertz
        "MIK": "SB", // square mile (statute mile)
        "MIL": "TH", // thousand
        "MIN": "MJ", // minute [unit of time]
        "MK": "MK", // milligram per square inch
        "MLT": "ML", // millilitre
        "MMK": "MS", // square millimetre
        "MMQ": "", // cubic millimetre
        "MMT": "MM", // millimetre
        "MON": "MO", // month
        "MPA": "M8", // megapascal
        "MQ": "MQ", // thousand metre
        "MQH": "4V", // cubic metre per hour
        "MSK": "4J", // metre per second squared
        "MT": "M3", // mat
        "MTK": "SM", // square metre
        "MTQ": "CR", // cubic metre
        "MTR": "MR", // metre
        "MTS": "4I", // metre per second
        "MV": "MV", // number of mults
        "MWH": "T9", // megawatt hour (1000Â kW.h)
        "N1": "N1", // pen calorie
        "N2": "N2", // number of lines
        "N3": "N3", // print point
        "NA": "NA", // milligram per kilogram
        "NB": "NB", // barge
        "NC": "NC", // car
        "ND": "ND", // net barrel
        "NE": "NE", // net litre
        "NEW": "NW", // newton
        "NF": "NF", // message
        "NG": "NG", // net gallon (us)
        "NH": "NH", // message hour
        "NI": "NI", // net imperial gallon
        "NJ": "NJ", // number of screens
        "NL": "NL", // load
        "NMI": "NM", // nautical mile
        "NN": "NN", // train
        "NQ": "NQ", // mho
        "NR": "NR", // micromho
        "NT": "MN", // net ton
        "NU": "NU", // newton metre
        "NV": "NV", // vehicle
        "NX": "NX", // part per thousand
        "NY": "NY", // pound per air dry metric ton
        "OA": "OA", // panel
        "OHM": "82", // ohm
        "ON": "ON", // ounce per square yard
        "OP": "OP", // two pack
        "OT": "OT", // overtime hour
        "OZ": "OZ", // ounce av
        "OZA": "FO", // fluid ounce (US)
        "OZI": "FZ", // fluid ounce (UK)
        "P0": "P0", // page - electronic
        "P1": "P1", // percent
        "P2": "P2", // pound per foot
        "P3": "P3", // three pack
        "P4": "P4", // four pack
        "P5": "P5", // five pack
        "P6": "P6", // six pack
        "P7": "P7", // seven pack
        "P8": "P8", // eight pack
        "P9": "P9", // nine pack
        "PA": "12", // packet
        "PAL": "4S", // pascal
        "PB": "PB", // pair inch
        "PD": "PD", // pad
        "PE": "PE", // pound equivalent
        "PF": "PF", // pallet (lift)
        "PG": "PP", // plate
        "PI": "PI", // pitch
        "PK": "PK", // pack
        "PL": "PA", // pail
        "PM": "PM", // pound percentage
        "PN": "PN", // pound net
        "PO": "PO", // pound per inch of length
        "PQ": "PQ", // page per inch
        "PR": "PR", // pair
        "PS": "PS", // pound-force per square inch
        "PT": "PT", // pint (US)
        "PTD": "Q2", // dry pint (US)
        "PTI": "PX", // pint (UK)
        "PU": "TY", // tray / tray pack
        "PV": "PV", // half pint (US)
        "PW": "PW", // pound per inch of width
        "PY": "PY", // peck dry (US)
        "PZ": "PZ", // peck dry (UK)
        "Q3": "Q3", // meal
        "QA": "QA", // page - facsimile
        "QAN": "Q1", // quarter (of a year)
        "QB": "QB", // page - hardcopy
        "QD": "QD", // quarter dozen
        "QH": "QH", // quarter hour
        "QK": "QK", // quarter kilogram
        "QR": "QR", // quire
        "QT": "QT", // quart (US)
        "QTD": "QS", // dry quart (US)
        "QTI": "QU", // quart (UK)
        "R1": "R1", // pica
        "R4": "R4", // calorie
        "R9": "R9", // thousand cubic metre
        "RA": "RA", // rack
        "RD": "RD", // rod
        "RG": "RG", // ring
        "RH": "RH", // running or operating hour
        "RK": "RK", // roll metric measure
        "RL": "RE", // reel
        "RM": "RM", // ream
        "RN": "RN", // ream metric measure
        "RO": "RL", // roll
        "RP": "RP", // pound per ream
        "RPM": "R3", // revolutions per minute
        "RS": "RS", // reset
        "RT": "RT", // revenue ton mile
        "RU": "RU", // run
        "S3": "S3", // square foot per second
        "S4": "S4", // square metre per second
        "S5": "S5", // sixty fourths of an inch
        "S6": "S6", // session
        "S7": "S7", // storage unit
        "S8": "S8", // standard advertising unit
        "SA": "SJ", // sack
        "SD": "SD", // solid pound
        "SE": "SE", // section
        "SEC": "03", // second [unit of time]
        "SET": "ST", // set
        "SG": "SG", // segment
        "SIE": "67", // siemens
        "SK": "SK", // split tank truck
        "SL": "S9", // slipsheet
        "SMI": "02", // mile (statute mile)
        "SN": "SN", // square rod
        "SO": "SO", // spool
        "SP": "SP", // shelf package
        "SQ": "SQ", // square
        "SR": "SR", // strip
        "SS": "SS", // sheet metric measure
        "ST": "SH", // sheet
        "STN": "TN", // ton (US) or short ton (UK/US)
        "SV": "SV", // skid
        "SW": "SW", // skein
        "SX": "SX", // shipment
        "T0": "T0", // telecommunication line in service
        "T1": "T1", // thousand pound gross
        "T3": "T3", // thousand piece
        "T4": "T4", // thousand bag
        "T5": "T5", // thousand casing
        "T6": "T6", // thousand gallon (US)
        "T7": "T7", // thousand impression
        "T8": "T8", // thousand linear inch
        "TA": "TA", // tenth cubic foot
        "TC": "TC", // truckload
        "TD": "TD", // therm
        "TE": "TE", // tote
        "TF": "TF", // ten square yard
        "TI": "TI", // thousand square inch
        "TJ": "TJ", // thousand square centimetre
        "TK": "TK", // tank. rectangular
        "TL": "TL", // thousand foot (linear)
        "TNE": "MP", // tonne (metric ton)
        "TP": "TP", // ten pack
        "TQ": "TQ", // thousand foot
        "TR": "TR", // ten square foot
        "TS": "TS", // thousand square foot
        "TT": "TT", // thousand linear metre
        "TU": "TB", // tube
        "TV": "TV", // thousand kilogram
        "TW": "TW", // thousand sheet
        "U1": "U1", // treatment
        "U2": "U2", // tablet
        "UA": "UA", // torr
        "UB": "UB", // telecommunication line in service average
        "UC": "UC", // telecommunication port
        "UD": "UD", // tenth minute
        "UE": "UE", // tenth hour
        "UF": "UF", // usage per telecommunication line average
        "UH": "UH", // ten thousand yard
        "UM": "UM", // million unit
        "VA": "VA", // volt - ampere per kilogram
        "VI": "VI", // vial
        "VLT": "70", // volt
        "VQ": "BN", // bulk
        "VS": "VS", // visit
        "W2": "W2", // wet kilo
        "WA": "WA", // watt per kilogram
        "WB": "WB", // wet pound
        "WCD": "8C", // cord
        "WE": "WE", // wet ton
        "WEE": "WK", // week
        "WG": "WG", // wine gallon
        "WH": "WH", // wheel
        "WI": "WI", // weight per square inch
        "WM": "WM", // working month
        "WR": "WR", // wrap
        "WTT": "99", // watt
        "WW": "WW", // millilitre of water
        "X1": "X1", // Gunter's chain
        "YDK": "SY", // square yard
        "YDQ": "CY", // cubic yard
        "YL": "YL", // hundred linear yard
        "YRD": "YD", // yard
        "YT": "YT", // ten yard
        "Z1": "Z1", // lift van
        "Z3": "Z3", // cask
        "Z4": "Z4", // hogshead
        "Z5": "Z5", // lug
        "Z6": "Z6", // conference point
        "Z8": "Z8", // newspage agate line
        "ZP": "ZP", // page
        "ZZ": "ZZ", // mutually defined
    }
    static mapMEA738: Object = {
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
    static mapREF128: Object = {
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
        //"mutuallydefined": "ZZ", // Mutually Defined
    }
}