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
export class Cvt_Order_830 extends XmlConverterBase {
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
        this._GS(true, 'AG');
        this._ST('830');

        let nHeader = this._rn('/OrderRequest/OrderRequestHeader');

        // BFR
        let d: Date = new Date();
        let BFR = this._initSegX12('BFR', 11);
        let sHeaderType = this._v('@type', nHeader);
        let sHeaderOrderID = this._v('@orderID', nHeader);
        this._setV(BFR, 1, this._mci(MAPS.mapBFR353, sHeaderType));
        this._setV(BFR, 2, sHeaderOrderID);
        this._setV(BFR, 4, 'DL');
        this._setV(BFR, 5, 'A');
        this._setV(BFR, 6, Utils.getYYYYMMDD(d));
        let dOrder = Utils.parseToDateSTD2(
            this._v('@orderDate', nHeader)
        )
        this._setV(BFR, 8, Utils.getYYYYMMDD(dOrder));
        this._setV(BFR, 10, this._v('@agreementID', nHeader));
        this._setV(BFR, 11, this._v('@orderID', nHeader));



        let REF: EdiSegment;
        let sREF: string = '';

        // REF RQ
        sREF = this._v('@requisitionID', nHeader);
        if (sREF) {
            REF = this._initSegX12('REF', 2);
            this._setV(REF, 1, 'RQ');
            this._setV(REF, 2, sREF);
        }
        // REF BC
        sREF = this._v('@parentAgreementID', nHeader);
        if (sREF) {
            REF = this._initSegX12('REF', 2);
            this._setV(REF, 1, 'BC');
            this._setV(REF, 2, sREF);
        }
        // REF PP
        sREF = this._v('@orderVersion', nHeader);
        if (sREF) {
            REF = this._initSegX12('REF', 2);
            this._setV(REF, 1, 'PP');
            this._setV(REF, 2, sREF);
        }
        // REF VN
        sREF = this._v('SupplierOrderInfo/@orderID', nHeader);
        if (sREF) {
            REF = this._initSegX12('REF', 2);
            this._setV(REF, 1, 'VN');
            this._setV(REF, 2, sREF);
        }

        // DTM036
        let dDTM: Date;
        dDTM = Utils.parseToDateSTD2(this._v('@expirationDate', nHeader));
        if (dDTM) {
            let DTM = this._initSegX12('DTM', 4);
            this._setV(DTM, 1, '036');
            this._setV(DTM, 2, Utils.getYYYYMMDD(dDTM));
            this._setV(DTM, 3, Utils.getHHMMSS(dDTM));
            this._setV(DTM, 4, Utils.getTMZ2(dDTM));
        }
        // DTM004
        dDTM = Utils.parseToDateSTD2(this._v('@orderDate', nHeader));
        if (dDTM) {
            let DTM = this._initSegX12('DTM', 4);
            this._setV(DTM, 1, '004');
            this._setV(DTM, 2, Utils.getYYYYMMDD(dDTM));
            this._setV(DTM, 3, Utils.getHHMMSS(dDTM));
            this._setV(DTM, 4, Utils.getTMZ2(dDTM));
        }
        // DTM007
        dDTM = Utils.parseToDateSTD2(this._v('@effectiveDate', nHeader));
        if (dDTM) {
            let DTM = this._initSegX12('DTM', 4);
            this._setV(DTM, 1, '007');
            this._setV(DTM, 2, Utils.getYYYYMMDD(dDTM));
            this._setV(DTM, 3, Utils.getHHMMSS(dDTM));
            this._setV(DTM, 4, Utils.getTMZ2(dDTM));
        }
        // DTM118
        dDTM = Utils.parseToDateSTD2(this._v('@pickUpDate', nHeader));
        if (dDTM) {
            let DTM = this._initSegX12('DTM', 4);
            this._setV(DTM, 1, '118');
            this._setV(DTM, 2, Utils.getYYYYMMDD(dDTM));
            this._setV(DTM, 3, Utils.getHHMMSS(dDTM));
            this._setV(DTM, 4, Utils.getTMZ2(dDTM));
        }
        // DTM002
        dDTM = Utils.parseToDateSTD2(this._v('@requestedDeliveryDate', nHeader));
        if (dDTM) {
            let DTM = this._initSegX12('DTM', 4);
            this._setV(DTM, 1, '002');
            this._setV(DTM, 2, Utils.getYYYYMMDD(dDTM));
            this._setV(DTM, 3, Utils.getHHMMSS(dDTM));
            this._setV(DTM, 4, Utils.getTMZ2(dDTM));
        }
        // DTM070
        dDTM = Utils.parseToDateSTD2(this._v('DeliveryPeriod/Period/@startDate', nHeader));
        if (dDTM) {
            let DTM = this._initSegX12('DTM', 4);
            this._setV(DTM, 1, '070');
            this._setV(DTM, 2, Utils.getYYYYMMDD(dDTM));
            this._setV(DTM, 3, Utils.getHHMMSS(dDTM));
            this._setV(DTM, 4, Utils.getTMZ2(dDTM));
        }
        // DTM073
        dDTM = Utils.parseToDateSTD2(this._v('DeliveryPeriod/Period/@endDate', nHeader));
        if (dDTM) {
            let DTM = this._initSegX12('DTM', 4);
            this._setV(DTM, 1, '073');
            this._setV(DTM, 2, Utils.getYYYYMMDD(dDTM));
            this._setV(DTM, 3, Utils.getHHMMSS(dDTM));
            this._setV(DTM, 4, Utils.getTMZ2(dDTM));
        }

        // Group N1
        let nBPs = this._es('BusinessPartner', nHeader);
        nBPs = nBPs ?? [];
        for (let nBP of nBPs) {
            this._GroupN1(nBP);
        }

        this._SE();
        this._GE();
        this._IEA();

        this._tidySegCascade();
        const output = this._segs.join(constants.ediDocument.lineBreak);
        return output;
    }

    /**
     * For Group N1
     * @param nHeader 
     */
    private _GroupN1(nBP: Element) {
        // N1
        let sRole = this._v('@role', nBP);
        let N1 = this._initSegX12('N1', 4);
        this._setV(N1, 1, this._mci(MAPS.mapN1_BP_98, sRole));
        this._setV(N1, 2, this._v('Address/Name', nBP));

        let sCodeQualifer = this._v('Address/@addressIDDomain', nBP);
        this._setV(N1, 3, this._mci(MAPS.mapN1_66, sCodeQualifer, '92'));

        this._setV(N1, 4, this._v('Address/@addressID', nBP));

        // N2
        let nDeliverTos = this._es('Address/PostalAddress/DeliverTo', nBP);
        this._oneSegX12(nDeliverTos,'N2');
      
        // N3
        let nStreets = this._es('Address/PostalAddress/Street',nBP);
        this._oneSegX12(nStreets,'N3');

        // N4
        let vPostalCode = this._v('Address/PostalAddress/PostalCode', nBP);
        if (vPostalCode) {
            let N4 = this._initSegX12('N4', 6);
            let sCountryCode = this._v('Address/PostalAddress/Country/@isoCountryCode', nBP);
            let sState = this._v('/Address/PostalAddress/State', nBP);
            if (sCountryCode == 'CA' || sCountryCode == 'US') {
                this._setV(N4, 2, this._mci(MAPS_XML_X12.mapN4_156, sState));
            } else {
                this._setV(N4, 5, 'SP'); // Hardcode to "SP" only if N406 is mapped
                this._setV(N4, 6, sState);
            }
            this._setV(N4, 3, vPostalCode);
            this._setV(N4, 4, sCountryCode);
        }

        // REF Idreference
        let sDomain = this._v('IdReference/@domain', nBP);
        if (sDomain) {
            if (this._mei(MAPS.mapN1_BP_REF128, sDomain)) {
                let REF = this._initSegX12('REF', 3);
                this._setV(REF, 1, this._mci(MAPS.mapN1_BP_REF128, sDomain));
                this._setV(REF, 3, this._v('Address/PostalAddress/@name', nBP));
            } else {
                let REF = this._initSegX12('REF', 3);
                this._setV(REF, 1, this._mci(MAPS.mapN1_BP_REF128, sDomain));
                this._setV(REF, 2, 'ZZ');
                this._setV(REF, 3, sDomain);
            }
        }

        // REF ME
        let sRefName = this._v('Address/PostalAddress/@name', nBP);



    } // end function _GroupN1


} // end class

class MAPS {
    static mapBFR353: Object = {
        "new": "00",
        "delete": "03",
        "update": "05",
    };
    static mapN1_BP_66: Object = {
        "duns": "1",
        "scac": "2",
        "iata": "4",
        "duns+4": "9",
    }
    static mapN1_BP_98: Object = {
        "soldto": "SO",
    }
    static mapN1_66: Object = {
        "duns": "1",
        "scac": "2",
        "iata": "4",
        "duns+4": "9",
    }
    static mapN1_BP_REF128: Object = {
        "buyeraccountid": "YD",
        "supplierid": "ZA",
    }
}