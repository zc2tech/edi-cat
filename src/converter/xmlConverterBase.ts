/* eslint-disable no-undef */
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter, ConvertErr } from "../new_parser/entities";
import { ASTNode, ASTNodeType } from "../new_parser/syntaxParserBase";
import { CUtilX12 } from "../utils/cUtilX12";
import Utils, { StringBuilder, UTILS_MAP } from "../utils/utils";
import { create } from "xmlbuilder2";
import * as vscode from "vscode";
import { DOMParser } from "@xmldom/xmldom";
import xpath = require('xpath');
import { XMLPath, configuration } from "../cat_const";
import { EdiUtils } from "../utils/ediUtils";


const sAttXmlLang = 'xml:lang';
/**
 * This is a new parser base, for my document level Synatx Check
 * 
 */
export abstract class XmlConverterBase {

    protected _convertErrs: ConvertErr[];
    protected _dom: Document;
    protected _segs: EdiSegment[];
    protected _sUniqueRefIC: string = '00000002635745';
    protected _sUniqueRefGP: string = '1';
    protected _ISA_ControlNumber = '123456789';
    protected _GS_ControlNumber = '987654321';
    protected _ST_ControlNumber = '7777';

    protected _pushX12ConvertErr() {
        this._convertErrs.push(CUtilX12.err);
    }

    /**
 * Oppresse exception for idx outbound
 * @param arr 
 * @param idx 
 */
    protected _arrVal(arr: string[], idx: number): string {
        try {
            return arr[idx];
        } catch (error) {
            return '';
        }
    }
    /**
  * reverse sign
  * @param sAmount 
  */
    protected _reverseSign(sAmount: string): string {
        if (!sAmount) {
            return '';
        }
        let num;
        try {
            num = parseFloat(sAmount);
        } catch (error) {
            return '';
        }

        return (num * (-1.0)).toString();

    }

    /**
     * Currently, just trim ' ' and '-',
     * will add when needed
     * @param str 
     */
    protected _trim(str:string) {
        const regex = /^[ \-]+|[ \-]+$/g;
        return str.replace(regex, '');
    }
    /**
      * always return negtive number
      * @param sAmount 
      * 
      */

    protected _negSign(sAmount: string): string {
        if (!sAmount) {
            return '';
        }
        if (!sAmount.startsWith('-')) {
            return this._reverseSign(sAmount);
        } else {
            // already negtive
            return sAmount;
        }
    }

    /**
      * always return positive number
      * @param sAmount 
      * 
      */

    protected _posSign(sAmount: string): string {
        if (!sAmount) {
            return '';
        }
        if (sAmount.startsWith('-')) {
            return this._reverseSign(sAmount);
        } else {
            // already negtive
            return sAmount;
        }
    }

    /**
     * Multiple by 100.0
     * @param sNum 
     */
    protected _x100(sNum: string): string {
        if (!sNum) {
            return sNum;
        }
        try {
            // return (parseFloat(sNum) * 100.0).toPrecision(3);
            return (parseFloat(sNum) * 100.0).toString();
        } catch (error) {
            return sNum;
        }
    }

    /**
     * Divided by 100.0
     * @param sNum 
     */
    protected _d100(sNum: string) {
        if (!sNum) {
            return sNum;
        }
        try {
            return (parseFloat(sNum) / 100.0).toPrecision(3);
        } catch (error) {
            return sNum;
        }
    }

    protected _init(vsdoc: vscode.TextDocument) {
        this._dom = new DOMParser().parseFromString(vsdoc.getText(), 'text/xml');
        this._segs = [];
        Utils.sDefaultTMZ = '';
    }
    /**
   * for EDIFACT
   * @param key position in RFF must be 101
   * @param value 
   */
    protected _RFF_KV_EDI(key: string, value: string) {
        if (value) {
            let RFF = this._initSegEdi('RFF', 1);
            this._setV(RFF, 101, key);
            this._setV(RFF, 102, value);
        }
    }

    /**
   * for X12, Double Elements
   * @param key position in RFF must be 1
   * @param value 
   */
    protected _REF_KV_X12D(key: string, value: string) {
        if (value) {
            let REF = this._initSegX12('REF', 2);
            this._setV(REF, 1, key);
            this._setV(REF, 2, value);
        }
    }

    /**
   * for X12, Double Elements
   * @param key position in RFF must be 1
   * @param value 
   */
    protected _MAN_KV_X12D(key: string, value: string) {
        if (value) {
            let MAN = this._initSegX12('MAN', 2);
            this._setV(MAN, 1, key);
            this._setV(MAN, 2, value);
        }
    }
    /**
   * for X12, Tripple Elements
   * @param key position in RFF must be 1
   * @param value 
   */
    protected _MAN_KV_X12T(v01: string, v02: string,v03:string) {
        if (v02|| v03) {
            let MAN = this._initSegX12('MAN', 3);
            this._setV(MAN, 1, v01);
            this._setV(MAN, 2, v02);
            this._setV(MAN, 3, v03);
        }
    }

    /**
   * for X12, Triple Elements
   * @param v01 position in RFF must be 1
   * @param v02 
   */
    protected _REF_KV_X12T(v01: string, v02: string, v03: string) {
        // if you want to create segment when only v02 has value
        // Please create a new function, this function is only for v03
        if (v03) {
            let REF = this._initSegX12('REF', 3);
            this._setV(REF, 1, v01);
            this._setV(REF, 2, v02);
            this._setV(REF, 3, v03);
        }
    }

    /**
    * for X12, Date will be converted to 304 CCYYMMDDHHMMSS[timezone]
    * format and then set to REF
    * 
    * @param v01 position in RFF must be 1
    * @param v02 
    * @param vDate the format is XML format
    */
    protected _REF_Date_X12(v01: string, v02: string, vDate: string) {
        if (vDate) {
            let vConvertedDate = Utils.dateStr304TZ(vDate);
            let RFF = this._initSegX12('REF', 4);
            this._setV(RFF, 1, v01);
            this._setV(RFF, 2, v02);
            this._setV(RFF, 3, vConvertedDate);
        }
    }

    /**
   * for X12
   * @param key position in RFF must be 1
   * @param value 
   */
    protected _AMT_X12(nElement: Element, sRelXpath: string, v1: string) {
        let value = this._v(sRelXpath, nElement);
        if (value) {
            let AMT = this._initSegX12('AMT', 2);
            this._setV(AMT, 1, v1);
            this._setV(AMT, 2, value);
        }
    }

    /**
     * Always use 'GM' timezone
     * Only for 304 qualifier DTM
     * @param nElement 
     * @param sRelXpath 
     * @param s101 
     */
    protected _DTM_EDI(nElement: Element, sRelXpath: string, s101: string) {
        let sDate = this._v(sRelXpath, nElement);
        if (sDate) {
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, s101);
            this._setV(DTM, 102, Utils.dateStr304TZ(sDate));
            this._setV(DTM, 103, '304');
        }
    }

    /**
     * 
     * @param nElement 
     * @param sRelXpath 
     * @param s101 
     */
    protected _DTM_X12(nElement: Element, sRelXpath: string, s1: string) {
        this._DTM_X12A(this._v(sRelXpath, nElement), s1);
    }

    /**
     * 1) convert from string, not xpath
     * 
     * @param sDate the Date String "yyyy-MM-dd'T'HH:mm:ssxxx" or "yyyy-MM-dd'T'HH:mmxxx"
     * @param s1 value for DTM01
     */
    protected _DTM_X12A(sDate: string, s1: string) {
        let dDTM: Date;
        dDTM = Utils.parseToDateSTD2(sDate);
        if (dDTM) {
            let DTM = this._initSegX12('DTM', 4);
            this._setV(DTM, 1, s1);
            this._setV(DTM, 2, Utils.getYYYYMMDD(dDTM));
            this._setV(DTM, 3, Utils.getHHMMSS(dDTM));
            this._setV(DTM, 4, Utils.getTMZ2(dDTM));
        }
    }



    /**
     * Use timezone in XML value
     * Only for 304 qualifier DTM
     * @param nElement 
     * @param sRelXpath 
     * @param s101 
     */
    protected _DTM2(nElement: Element, sRelXpath: string, s101: string) {
        let sDate = this._v(sRelXpath, nElement);
        if (sDate && sDate.length >= 19) {
            let sTMZ = sDate.trim().substring(19).trim(); // like +11:00
            // let sMappedTMZ = UTILS_MAP.mapTimeZone3[sTMZ];
            // sMappedTMZ = sMappedTMZ ?? 'GM';
            let DTM = this._initSegEdi('DTM', 1);
            this._setV(DTM, 101, s101);
            this._setV(DTM, 102, Utils.dateStr304TZ(sDate, sTMZ));
            this._setV(DTM, 103, '304');
        }
    }


    protected _UNA() {
        let UNA = this._initSegEdi('UNA', 6);
        this._setV(UNA, 1, ':');
        this._setV(UNA, 2, '+');
        this._setV(UNA, 3, '.');
        this._setV(UNA, 4, '?');
        this._setV(UNA, 5, ' ');
        this._setV(UNA, 6, "'");
    }
    protected _ISA(bOutbound: boolean) {
        let d: Date = new Date();
        let sYYMMDD = Utils.getYYMMDD(d);
        let sHHMM = Utils.getHHMM(d);
        let conf = vscode.workspace.getConfiguration(configuration.ediCat);
        let buyerIC: string = conf.get(configuration.buyerIC);
        let supplierIC: string = conf.get(configuration.supplierIC);
        let sICFrom: string;
        let sICTo: string;

        if (bOutbound) {
            sICFrom = buyerIC;
            sICTo = supplierIC;
        } else {
            sICFrom = supplierIC;
            sICTo = buyerIC;
        }
        let ISA = this._initSegX12('ISA', 16);
        this._setV(ISA, 1, '00');
        this._setV(ISA, 2, ''.padEnd(10));
        this._setV(ISA, 3, '00');
        this._setV(ISA, 4, ''.padEnd(10));
        this._setV(ISA, 5, 'ZZ');
        this._setV(ISA, 6, sICFrom.padEnd(15));
        this._setV(ISA, 7, 'ZZ');
        this._setV(ISA, 8, sICTo.padEnd(15));
        this._setV(ISA, 9, sYYMMDD); // Date of Interchange, format YYMMDD
        this._setV(ISA, 10, sHHMM); // Time of Interchange, format HHMM
        this._setV(ISA, 11, 'U');
        this._setV(ISA, 12, '00401');
        this._setV(ISA, 13, this._ISA_ControlNumber);
        this._setV(ISA, 14, '0');
        this._setV(ISA, 15, 'T');
        this._setV(ISA, 16, '^');
    }

    protected _IEA() {
        let IEA = this._initSegX12('IEA', 2);
        this._setV(IEA, 1, '1');
        this._setV(IEA, 2, this._ISA_ControlNumber);
    }


    /**
     * Functional Identifier Code
     * AG,PO,PR ...
     * @param sFuncId 
     */
    protected _GS(bOutbound: boolean, sFuncId: string) {
        let conf = vscode.workspace.getConfiguration(configuration.ediCat);
        let buyerIC: string = conf.get(configuration.buyerIC);
        let buyerGP: string = conf.get(configuration.buyerGP);
        let supplierIC: string = conf.get(configuration.supplierIC);
        let supplierGP: string = conf.get(configuration.supplierGP);


        let GS = this._initSegX12('GS', 8);
        this._setV(GS, 1, sFuncId);
        if (bOutbound) {
            this._setV(GS, 2, buyerGP);
            this._setV(GS, 3, supplierGP);
        } else {
            this._setV(GS, 2, supplierGP);
            this._setV(GS, 3, buyerGP);
        }

        let d: Date = new Date();
        this._setV(GS, 4, Utils.getYYYYMMDD(d));
        this._setV(GS, 5, Utils.getHHMMSS(d));
        this._setV(GS, 6, this._GS_ControlNumber);
        this._setV(GS, 7, 'X');
        this._setV(GS, 8, '004010');

    }

    protected _GE() {
        let GE = this._initSegX12('GE', 2);
        this._setV(GE, 1, '1');
        this._setV(GE, 2, this._GS_ControlNumber);
    }

    /**
     * 
     * @param sCode 
     */
    protected _ST(sCode: string) {
        let ST = this._initSegX12('ST', 2);
        this._setV(ST, 1, sCode);
        this._setV(ST, 2, this._ST_ControlNumber);

    }

    protected _SE() {
        let iSegCnt = this._segs.length - 1;
        let SE = this._initSegX12('SE', 2);
        this._setV(SE, 1, iSegCnt.toString());
        this._setV(SE, 2, this._ST_ControlNumber);
    }
    /**
     * TODO:Should use buyer/supplier in reverse order for PO/OC ?
     * @param s0026 
     * @param bReq Request or Message
     */
    protected _UNB(s0026: string, bReq: boolean) {
        let conf = vscode.workspace.getConfiguration(configuration.ediCat);
        let buyerIC: string = conf.get(configuration.buyerIC);
        let buyerGP: string = conf.get(configuration.buyerGP);
        let supplierIC: string = conf.get(configuration.supplierIC);
        let supplierGP: string = conf.get(configuration.supplierGP);


        let UNB = this._initSegEdi('UNB', 11);
        this._setV(UNB, 101, 'UNOC'); // S001
        this._setV(UNB, 102, '3');
        this._setV(UNB, 201, `${buyerIC}`); // S002
        this._setV(UNB, 202, 'ZZZ');
        this._setV(UNB, 301, `${supplierIC}`); // S003
        this._setV(UNB, 302, 'ZZZ');
        this._setV(UNB, 303, `${supplierGP}`);
        // Date of preparation (YYMMDD)
        this._setV(UNB, 401, Utils.getYYMMDD());
        // Time of preparation (HHMM)
        this._setV(UNB, 402, Utils.getHHMM());
        // 0020 
        this._setV(UNB, 4, '1');
        // 0026 Application reference
        this._setV(UNB, 7, s0026);

        let strMode = '';
        if (bReq) {
            strMode = this._ratt("/@deploymentMode");
        } else {
            strMode = this._ratt2("/@deploymentMode");
        }
        if (strMode == 'test') {
            this._setV(UNB, 11, '1');
        }

        // UNB05 Unique reference assigned by the sender to an interchange
        this._setV(UNB, 5, this._sUniqueRefIC);
    }


    protected _descIMD(IMD: EdiSegment, desc: string, lang?: string | undefined) {
        let desc1 = desc;
        let desc2: string;
        if (desc1.length > 35) {
            desc1 = desc1.substring(0, 35);
            desc2 = desc1.substring(35, 70);
            // we discard chars after position 70;
        }
        this._setV(IMD, 304, EdiUtils.escapeEdi(desc1));
        if (desc2) {
            this._setV(IMD, 304, EdiUtils.escapeEdi(desc2));
        }
        if (lang) {
            this._setV(IMD, 306, lang);
        }

    }


    protected _hasConvertErr() {
        if (!this._convertErrs) {
            return false;
        } else {
            return this._convertErrs.length !== 0;
        }
    }

    abstract fromXML(document: vscode.TextDocument): string;

    /**
     * Change String like 1.000 to 1
     * But if it's 1.234 then return the original string because we cannot trim it.
     * @param vFloatStr 
     * 
     */
    protected _trimIntStr(vFloatStr: string) {
        // Convert the string to a float
        const number = parseFloat(vFloatStr);
        // Check if the conversion resulted in a valid number
        if (isNaN(number)) {
            return vFloatStr;
        }

        // Check if the fractional part is zero
        if (number % 1 === 0) {
            return number.toFixed(0);  // Convert to string without fractional part
        } else {
            return vFloatStr;  // Return the input string as is
        }
    }

    /**
     * For Edifact
     * 
     * @param parent 
     * @param name 
     * @param eleCount Count, not index
     * @returns 
     */
    protected _initSegEdi(name: string, eleCount: number): EdiSegment {
        const maxCompPerEle = 8;
        let tmp = new EdiSegment();
        if (name !== 'UNA') {
            tmp.endingDelimiter = "'";
        } else {
            tmp.endingDelimiter = "";
        }

        this._segs.push(tmp);
        tmp.id = name;
        tmp.elements = [];
        for (let i = 0; i < eleCount; i++) {
            let tmpEle = new EdiElement;
            this._initComponents(tmpEle, maxCompPerEle);
            tmpEle.value = '';
            if (name !== 'UNA') {
                tmpEle.delimiter = "+";
            } else {
                tmpEle.delimiter = "";
            }
            tmp.elements.push(tmpEle);
        }
        return tmp;
    }
    /**
     * for X12
     * @param parent 
     * @param name 
     * @param eleCount Count, not index
     * @returns 
     */
    protected _initSegX12(name: string, eleCount: number): EdiSegment {
        const maxCompPerEle = 8;
        let tmp = new EdiSegment();
        // if (name !== 'UNA') {
        //     tmp.endingDelimiter = "'";
        // } else {
        //     tmp.endingDelimiter = "";
        // }
        tmp.endingDelimiter = "~";
        this._segs.push(tmp);
        tmp.id = name;
        tmp.elements = [];
        for (let i = 0; i < eleCount; i++) {
            let tmpEle = new EdiElement;
            this._initCompX12(tmpEle, maxCompPerEle);
            tmpEle.value = '';
            // if (name !== 'UNA') {
            //     tmpEle.delimiter = "+";
            // } else {
            //     tmpEle.delimiter = "";
            // }
            tmpEle.delimiter = "*"
            tmp.elements.push(tmpEle);
        }
        return tmp;
    }

    /**
     * This is for EDIFACT, so the delimiter is ':'
     * @param seg 
     * @param eleIdx always based on 1
     * @param compCount 
     */
    private _initComponents(ele: EdiElement, compCount: number) {
        ele.components = [];
        for (let i = 0; i < compCount; i++) {
            let tmpComp = new EdiElement();
            tmpComp.delimiter = ':';
            tmpComp.value = '';
            ele.components.push(tmpComp);
        }
    }
    /**
     * This is for X12, so the delimiter is '^'
     * @param seg 
     * @param eleIdx always based on 1
     * @param compCount 
     */
    private _initCompX12(ele: EdiElement, compCount: number) {
        ele.components = [];
        for (let i = 0; i < compCount; i++) {
            let tmpComp = new EdiElement();
            tmpComp.delimiter = '^';
            tmpComp.value = '';
            ele.components.push(tmpComp);
        }
    }

    protected _setCompVal(seg: EdiSegment, eleIdx: number, compIdx: number, val: string) {
        seg.elements[eleIdx - 1].components[compIdx - 1].value = val;
    }

    /**
     * Only set trueValue
     * @param seg 
     * @param eleIdx 
     * @param compIdx 
     * @param val 
     */
    protected _setCompTVal(seg: EdiSegment, eleIdx: number, compIdx: number, val: string) {
        seg.elements[eleIdx - 1].components[compIdx - 1].trueValue = val;
    }

    /**
     * Always set the escaped value
     * If you need to set trueValue, _setTV
     * 
     * @param seg 
     * @param idx 1 based, if idx > 100 , that means it also contains component idx 
     * @param val escaped value
     */
    protected _setV(seg: EdiSegment, idx: number, val: string) {
        let eleIdx: number;
        let compIdx: number;
        if (!val) {
            return;
        }
        if (idx >= 100) {
            // it contains component id
            eleIdx = Math.floor(idx / 100);
            compIdx = idx % 100;
        } else {
            eleIdx = idx;
            compIdx = undefined;
        }

        if (compIdx) {
            this._setCompVal(seg, eleIdx, compIdx, val);
        } else {
            this._setSegValue(seg, eleIdx, val);
        }
        //seg.elements[eleIdx-1].components[compIdx-1].value = val;
    }

    /**
     * set Value after escaped it,
     * and trueValue with param val
     * 
     * !!Do not use this function in X12 conversion!!
     * 
     * 
     * @param seg 
     * @param idx 1 based, if idx > 100 , that means it also contains component idx 
     * @param val unescaped value, that is: trueValue
     */
    protected _setTV(seg: EdiSegment, idx: number, val: string) {
        let eleIdx: number;
        let compIdx: number;
        if (!val) {
            return;
        }
        if (idx >= 100) {
            // it contains component id
            eleIdx = Math.floor(idx / 100);
            compIdx = idx % 100;
        } else {
            eleIdx = idx;
            compIdx = undefined;
        }

        if (compIdx) {
            this._setCompVal(seg, eleIdx, compIdx, EdiUtils.escapeEdi(val));
            this._setCompTVal(seg, eleIdx, compIdx, val);
        } else {
            this._setSegValue(seg, eleIdx, EdiUtils.escapeEdi(val));
            this._setSegTValue(seg, eleIdx, val);
        }
    }
    /**
     * set value from children components
     * @param segs 
     */
    protected _tidySegCascade() {
        for (let s of this._segs) {
            for (let e of s.elements) {
                let lastIdx: number = 0; // based on 1;
                for (let i = e.components.length - 1; i >= 0; i--) {
                    if (e.components[i].value) {
                        lastIdx = i + 1; // based on 1;
                        break;
                    }
                }

                if (lastIdx) {
                    // slice function exclusive the component at lastIdx
                    e.value = e.components.slice(0, lastIdx).join('').substring(1); // remove the first ':';
                } else {
                    // do nothing, leave e.value as is
                }
            }
        }

        // search and remove the empty elements in reverse order
        for (let s of this._segs) {
            let lastIdx: number = 0; // based on 1;
            for (let i = s.elements.length - 1; i >= 0; i--) {
                if (s.elements[i].value) {
                    lastIdx = i + 1; // based on 1
                    break;
                }
            }
            if (lastIdx != s.elements.length) {
                s.elements = s.elements.slice(0, lastIdx);
            }
        }

    }

    /**
     * only set value not trueValue
     * @param seg 
     * @param eleIdx index based on 1
     * @param val 
     */
    protected _setSegValue(seg: EdiSegment, eleIdx: number, val: string) {
        seg.elements[eleIdx - 1].value = val;
    }

    /**
     * only set trueValue
     * 
     * @param seg 
     * @param eleIdx index based on 1
     * @param val 
     */
    protected _setSegTValue(seg: EdiSegment, eleIdx: number, val: string) {
        seg.elements[eleIdx - 1].trueValue = val;
    }

    /**
     * Get Value from Root Dom /cXML/Request
     * @param strPath Will remove the leading slash if exists
     * @returns 
     */
    protected _rv(strPath: string): string {
        const nTmp = xpath.select1(XMLPath.CXLM_REQUEST + '/' + this._rmLeadingSlash(strPath), this._dom) as Node;
        if (nTmp) {
            if (nTmp.nodeType == nTmp.ATTRIBUTE_NODE) {
                return nTmp.nodeValue;
            } else if (nTmp.nodeType == nTmp.ELEMENT_NODE) {
                return nTmp.textContent;
            } else {
                return '';
            }
        } else {
            return '';
        }
    }

    /**
     * Get Value from !!Pure!! Root
     * @param strPath Will remove the leading slash if exists
     * @returns 
     */
    protected _prv(strPath: string): string {
        const nTmp = xpath.select1('/' + this._rmLeadingSlash(strPath), this._dom) as Node;
        if (nTmp) {
            if (nTmp.nodeType == nTmp.ATTRIBUTE_NODE) {
                return nTmp.nodeValue;
            } else if (nTmp.nodeType == nTmp.ELEMENT_NODE) {
                return nTmp.textContent;
            } else {
                return '';
            }
        } else {
            return '';
        }
    }

    /**
     * Get Value under Parent Dom Node using strPath
     * 
     * @param strPath 
     * @param p 
     * @returns 
     */
    protected _v(strPath: string, p: Node): string {
        if (!p) {
            return '';
        }
        let nTmp: Node;

        if (!strPath) {
            nTmp = p;
        } else {
            // We cannot use normal xpath syntax to get attribute that belongs to other namespace:xml
            let idxLang = strPath.toLowerCase().indexOf('@' + sAttXmlLang); // will be -1 if not found
            if (idxLang >= 0) { // found
                if (idxLang >= 2) { // seems there is parent in strPath
                    // beware that there is '/' before '@xml:lang'
                    let nBeforeLang = this._n(strPath.substring(0, idxLang - 1), p);
                    return this._v('@' + sAttXmlLang, nBeforeLang);
                } else { // no parent node in strPath, just get the attribute
                    let e = p as Element;
                    let sTmp = e.getAttribute(sAttXmlLang); // like en-US
                    if (!sTmp) {
                        return 'EN';
                    } else {
                        return sTmp.split('-')[0].toUpperCase();
                    }
                }
            }

            // not xml:lang, so use usual way
            nTmp = xpath.select1(this._rmLeadingSlash(strPath), p) as Node;
        }

        if (nTmp) {
            if (nTmp.nodeType == nTmp.ATTRIBUTE_NODE) {
                return nTmp.nodeValue;
            } else if (nTmp.nodeType == nTmp.ELEMENT_NODE) {
                return nTmp.textContent;
            } else {
                return '';
            }
        } else {
            return '';
        }
    }

    /**
     * return Node type, are we using this function ?
     * 
     * @param strPath Relative xpath
     * @param p Parent Node
     * @returns Node
     */
    protected _n(strPath: string, p: Node): Node {
        return xpath.select1(this._rmLeadingSlash(strPath), p) as Node;
    }

    /**
     * One Node under Parent Node
     * 
     * @param strPath Relative xpath
     * @param p Parent Node
     * @returns Element
     */
    protected _e(strPath: string, p: Node): Element {
        if (!p) {
            return undefined;
        }
        return xpath.select1(this._rmLeadingSlash(strPath), p) as Element;
    }

    /**
     * Get Value from Root Dom /cXML/Request
     * @param strPath Will remove the leading slash if exists
     * @returns 
     */
    protected _re(strPath: string): Element {
        return xpath.select1(XMLPath.CXLM_REQUEST + '/' + this._rmLeadingSlash(strPath), this._dom) as Element;
    }

    /**
     * Multiple Nodes
     * @param strPath Relative xpath
     * @param p Parent Node
     * @returns Node
     */
    protected _ns(strPath: string, p: Node): Node[] {
        return xpath.select(this._rmLeadingSlash(strPath), p) as Node[];
    }

    /**
     * Concat values of nodes in same xpath
     * 
     * @param strPath Relative xpath
     * @param p Parent Node
     * @returns Node
     */
    protected _vs(strPath: string, p: Node): string {
        let es = this._es(strPath, p);
        let rtn = '';
        for (let e of es) {
            rtn += this._v('', e);
        }
        return rtn;
    }

    /**
     * Multiple Nodes under Parent Node
     * 
     * @param strPath Relative xpath
     * @param p Parent Node
     * @returns Element[]
     */
    protected _es(strPath: string, p: Node): Element[] {
        if (!p) {
            return [];
        }
        let rtn = xpath.select(this._rmLeadingSlash(strPath), p) as Element[];
        if (!rtn) {
            return [];
        } else {
            return rtn;
        }
    }

    /**
     * Get Dom Node from '/cXML/Request'
     * 
     * @param strPath Relative xpath
     * @param p Parent Node
     * @returns Node
     */
    protected _rn(strPath: string): Element {
        return xpath.select1(XMLPath.CXLM_REQUEST + '/' + this._rmLeadingSlash(strPath), this._dom) as Element;
    }
    /**
     * Get Dom Node from '/cXML/Message'
     * 
     * @param strPath Relative xpath
     * @param p Parent Node
     * @returns Node
     */
    protected _rn2(strPath: string): Element {
        return xpath.select1(XMLPath.CXLM_MESSAGE + '/' + this._rmLeadingSlash(strPath), this._dom) as Element;
    }
    /**
     * Get Dom Node from !Pure! Root
     * 
     * @param strPath Relative xpath
     * @param p Parent Node
     * @returns Node
     */
    protected _prn(strPath: string): Element {
        return xpath.select1('/' + this._rmLeadingSlash(strPath), this._dom) as Element;
    }

    protected _rmLeadingSlash(str: string) {
        if (str.startsWith('/')) {
            return str.substring(1);
        } else {
            return str;
        }
    }

    /**
     * Get Dom Node from Root '/cXML/Request'
     * 
     * @param strPath Relative xpath
     * @param p Parent Node
     * @returns Node
     */
    protected _rns(strPath: string): Element[] {
        return xpath.select(XMLPath.CXLM_REQUEST + '/' + this._rmLeadingSlash(strPath), this._dom) as Element[];
    }
    /**
     * Get Dom Node from Root '/cXML/Message'
     * 
     * @param strPath Relative xpath
     * @param p Parent Node
     * @returns Node
     */
    protected _rns2(strPath: string): Element[] {
        return xpath.select(XMLPath.CXLM_MESSAGE + '/' + this._rmLeadingSlash(strPath), this._dom) as Element[];
    }

    /**
     * 
     * @param strPath Path under Root
     * @param p 
     */
    protected _ratt(strPath: string): string {
        let att = xpath.select1(XMLPath.CXLM_REQUEST + '/' + this._rmLeadingSlash(strPath), this._dom);
        if (att) {
            return att['value'];
        } else {
            return '';
        }
    }

    /**
     * from Root '/cXML/Message'
     * @param strPath Path under Root
     * @param p 
     */
    protected _ratt2(strPath: string): string {
        let att = xpath.select1(XMLPath.CXLM_MESSAGE + '/' + this._rmLeadingSlash(strPath), this._dom);
        if (att) {
            return att['value'];
        } else {
            return '';
        }
    }
    /**
     * 
     * @param strPath Path under Root
     * @param p 
     */
    protected _att(strPath: string, p: Element): string {
        let att = xpath.select1(this._rmLeadingSlash(strPath), p);
        if (att) {
            return att['value'];
        } else {
            return '';
        }
    }

    protected _renderConvertErr(): string {
        if (!this._convertErrs) {
            return '';
        } else {
            let sb: StringBuilder = new StringBuilder();
            for (let e of this._convertErrs) {
                sb.append(e.segName + e.index.toString().padStart(2, '0') + ': ' + e.msg);
                sb.append('\r\n');
                //sb.append('\r\n'); // maybe we need to use ediUtils.getNewLine
            }
            return sb.toString();
        }
    }


    /**
     * We need to remove ShortName/Attachment element inside
     * We found only Text Node and concatenate.
     * the 't' in function name '_vt' means text
     */
    protected _vt(nRefDesc: Node) {
        if (!nRefDesc || !nRefDesc.childNodes) {
            return '';
        }
        let sResult = '';
        for (let i: number = 0; i < nRefDesc.childNodes.length; i++) {
            let n = nRefDesc.childNodes.item(i) as Node;
            if (n.nodeType == n.TEXT_NODE) {
                sResult = sResult + n.textContent.trim();
            }
        }

        return sResult.trim();
    }
    /**
     * Extract pure text, removing included element like <ShortName>
     * 
     */
    protected _vt2(strPath: string, p: Node): string {
        let nNode = this._e(strPath,p);
        return this._vt(nNode);
    }

    /**
     * For both X12 and EDIFACT
     * Split Long String into componets of EDISegment
     * 
     * @param SEG EdiSegement
     * @param iEle Position of the Element
     * @param iStartComp Position of the Start Component , based on 1
     * @param iEndComp Postion of the End Component, based on 1
     * @param iLenPerComp length of per Component, like 35, 280 etc
     */
    protected _splitStr(SEG: EdiSegment, str: string, iEle: number
        , iStartComp: number, iEndComp: number, iLenPerComp: number) {
        if (!str) {
            return;
        }
        let tmp = str;
        // we use endingDelimiter to decide if it's X12 and EDIFACT
        // Hope it will work
        if (SEG.endingDelimiter == "'") {
            // EDIFACT
            for (let i = iStartComp; i <= iEndComp; i++) {
                if (tmp.length > iLenPerComp) {
                    this._setV(SEG, iEle * 100 + i, EdiUtils.escapeEdi(tmp.substring(0, iLenPerComp)));
                    tmp = tmp.substring(iLenPerComp);
                } else {
                    this._setV(SEG, iEle * 100 + i, EdiUtils.escapeEdi(tmp));
                    break;
                }
            }
        } else {
            // X12, endingDelimiter should be '~'
            for (let i = iStartComp; i <= iEndComp; i++) {
                if (tmp.length > iLenPerComp) {
                    this._setV(SEG, iEle * 100 + i, tmp.substring(0, iLenPerComp));
                    tmp = tmp.substring(iLenPerComp);
                } else {
                    this._setV(SEG, iEle * 100 + i, tmp);
                    break;
                }
            }
        }
    }

    /**
     * Usually used for X12 as we don't care at Component Level
     * 
     * Very Simple version
     * For fields like N2,N3, split long string to Edisegment
     */
    protected _splitStrSimple(sLong: string, sSegName: string, iCntUnit: number) {
        sLong = sLong ? sLong.trim() : '';
        if (!sLong) {
            return;
        }
        let idx: number = 1;
        let iEleCount = 1 + (sLong.length - (sLong.length % iCntUnit)) / iCntUnit + 1
        let theSeg = this._initSegX12(sSegName, iEleCount);
        while (sLong) {
            this._setV(theSeg, idx, sLong.substring(0, iCntUnit));
            sLong = sLong.substring(iCntUnit);
            idx++;
        }
    }
    /**
     * Fill different elements of one segment
     * And always start from element 1 to fill
     * 
     */
    protected _oneSegX12(eles: Element[], sSegName: string) {
        if (!eles || eles.length <= 0) {
            return;
        }
        let theSeg = this._initSegX12(sSegName, eles.length);
        let i = 1;
        for (let ele of eles) {
            this._setV(theSeg, i, this._v('', ele));
            i++;
        }
    }

    /**
     * get value from mapping, return '' if not 
     * @param mapping 
     * @param sKey will be converted to lowercase before finding value in mapping
     */
    protected _mci(mapping: Object, sKey: string, sDefault?: string): string {
        let sLower = sKey.toLocaleLowerCase();
        if (sLower in mapping) {
            return mapping[sLower];
        } else {
            return sDefault ?? '';
        }
    }

    /**
    * Case Sensitive
    * get value from mapping, return '' if not 
    * @param mapping 
    * @param sKey will be converted to lowercase before finding value in mapping
    */
    protected _mcs(mapping: Object, sKey: string, sDefault?: string): string {
        if (sKey in mapping) {
            return mapping[sKey];
        } else {
            return sDefault ?? '';
        }
    }

    /**
     * Case Insensitive check if sKey exists in mapping, will convert to lowercase before comparing
     * @param mapping need to be with lower case keys
     * @param sKey will be converted to lowercase before finding value in mapping
     */
    protected _mei(mapping: Object, sKey: string): boolean {
        let sLower = sKey.toLocaleLowerCase();
        return (sLower in mapping);
    }

    /**
     * Case Sensitive
     * @param mapping 
     * @param sKey will be converted to lowercase before finding value in mapping
     */
    protected _mes(mapping: Object, sKey: string): boolean {
        return (sKey in mapping);
    }
}

export class MAPS_XML_X12 {
    // State or Province Code
    static mapN4_156: Object = {
        "alberta": "AB",
        "alaska": "AK",
        "alabama": "AL",
        "arkansas": "AR",
        "american samoa": "AS",
        "arizona": "AZ",
        "british columbia": "BC",
        "california": "CA",
        "colorado": "CO",
        "connecticut": "CT",
        "district of columbia": "DC",
        "delaware": "DE",
        "florida": "FL",
        "federated states of micronesia": "FM",
        "georgia": "GA",
        "guam": "GU",
        "hawaii": "HI",
        "iowa": "IA",
        "idaho": "ID",
        "illinois": "IL",
        "indiana": "IN",
        "kansas": "KS",
        "kentucky": "KY",
        "louisiana": "LA",
        "massachusetts": "MA",
        "manitoba": "MB",
        "maryland": "MD",
        "maine": "ME",
        "marshall islands": "MH",
        "michigan": "MI",
        "minnesota": "MN",
        "missouri": "MO",
        "northern mariana islands": "MP",
        "mississippi": "MS",
        "montana": "MT",
        "new brunswick": "NB",
        "north carolina": "NC",
        "north dakota": "ND",
        "nebraska": "NE",
        "newfoundland": "NF",
        "new hampshire": "NH",
        "new jersey": "NJ",
        "new mexico": "NM",
        "nova scotia": "NS",
        "northwest territories": "NT",
        "nunavut": "NU",
        "nevada": "NV",
        "new york": "NY",
        "ohio": "OH",
        "oklahoma": "OK",
        "ontario": "ON",
        "oregon": "OR",
        "pennsylvania": "PA",
        "prince edward island": "PE",
        "puerto rico": "PR",
        "palau": "PW",
        "quebec": "QC",
        "rhode island": "RI",
        "south carolina": "SC",
        "south dakota": "SD",
        "saskatchewan": "SK",
        "tennessee": "TN",
        "texas": "TX",
        "utah": "UT",
        "virginia": "VA",
        "virgin islands": "VI",
        "vermont": "VT",
        "washington": "WA",
        "wisconsin": "WI",
        "west virginia": "WV",
        "wyoming": "WY",
        "yukon": "YT",
    }
}

export class MAPS_XML_EDIFACT {
    static mapCountry: Object = {
        "AD": "ANDORRA",
        "AE": "UNITED ARAB EMIRATES",
        "AF": "AFGHANISTAN",
        "AG": "ANTIGUA AND BARBUDA",
        "AI": "ANGUILLA",
        "AL": "ALBANIA",
        "AM": "ARMENIA",
        "AN": "NETHERLANDS ANTILES",
        "AO": "ANGOLA",
        "AQ": "ANTARCTICA",
        "AR": "ARGENTINA",
        "AS": "AMERICAN SAMOA",
        "AT": "AUSTRIA",
        "AU": "AUSTRALIA",
        "AW": "ARUBA",
        "AX": "ÅLAND ISLANDS",
        "AZ": "AZERBAIJAN",
        "BA": "BOSNIA AND HERZEGOVINA",
        "BB": "BARBADOS",
        "BD": "BANGLADESH",
        "BE": "BELGIUM",
        "BF": "BURKINA FASO",
        "BG": "BULGARIA",
        "BH": "BAHRAIN",
        "BI": "BURUNDI",
        "BJ": "BENIN",
        "BL": "SAINT BARTHÉLEMY",
        "BM": "BERMUDA",
        "BN": "BRUNEI DARUSSALAM",
        "BO": "BOLIVIA (PLURINATIONAL STATE OF)",
        "BQ": "BONAIRE, SINT EUSTATIUS AND SABA",
        "BR": "BRAZIL",
        "BS": "BAHAMAS",
        "BT": "BHUTAN",
        "BV": "BOUVET ISLAND",
        "BW": "BOTSWANA",
        "BY": "BELARUS",
        "BZ": "BELIZE",
        "CA": "CANADA",
        "CC": "COCOS (KEELING) ISLANDS",
        "CD": "CONGO, DEMOCRATIC REPUBLIC OF",
        "CF": "CENTRAL AFRICAN REPUBLIC",
        "CG": "CONGO",
        "CH": "SWITZERLAND",
        "CI": "COTE D'IVOIRE",
        "CK": "COOK ISLANDS",
        "CL": "CHILE",
        "CM": "CAMEROON",
        "CN": "CHINA",
        "CO": "COLOMBIA",
        "CR": "COSTA RICA",
        "CU": "CUBA",
        "CV": "CABO VERDE",
        "CW": "CURAÇAO",
        "CX": "CHRISTMAS ISLAND",
        "CY": "CYPRUS",
        "CZ": "CZECHIA",
        "DE": "GERMANY",
        "DJ": "DJIBOUTI",
        "DK": "DENMARK",
        "DM": "DOMINICA",
        "DO": "DOMINICAN REPUBLIC",
        "DZ": "ALGERIA",
        "EC": "ECUADOR",
        "EE": "ESTONIA",
        "EG": "EGYPT",
        "EH": "WESTERN SAHARA",
        "ER": "ERITREA",
        "ES": "SPAIN",
        "ET": "ETHIOPIA",
        "FI": "FINLAND",
        "FJ": "FIJI",
        "FK": "FALKLAND ISLANDS (MALVINAS)",
        "FM": "MICRONESIA (FEDERATED STATES OF)",
        "FO": "FAROE ISLANDS",
        "FR": "FRANCE",
        "FX": "FRANCE, METROPOLITAN",
        "GA": "GABON",
        "GB": "UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND",
        "GD": "GRENADA",
        "GE": "GEORGIA",
        "GF": "FRENCH GUIANA",
        "GG": "GUERNSEY",
        "GH": "GHANA",
        "GI": "GIBRALTAR",
        "GL": "GREENLAND",
        "GM": "GAMBIA",
        "GN": "GUINEA",
        "GP": "GUADELOUPE",
        "GQ": "EQUATORIAL GUINEA",
        "GR": "GREECE",
        "GS": "SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS",
        "GT": "GUATEMALA",
        "GU": "GUAM",
        "GW": "GUINEA-BISSAU",
        "GY": "GUYANA",
        "HK": "HONG KONG",
        "HM": "HEARD ISLAND AND MCDONALD ISLANDS",
        "HN": "HONDURAS",
        "HR": "CROATIA",
        "HT": "HAITI",
        "HU": "HUNGARY",
        "ID": "INDONESIA",
        "IE": "IRELAND",
        "IL": "ISRAEL",
        "IM": "ISLE OF MAN",
        "IN": "INDIA",
        "IO": "BRITISH INDIAN OCEAN TERRITORY",
        "IQ": "IRAQ",
        "IR": "IRAN (ISLAMIC REPUBLIC OF)",
        "IS": "ICELAND",
        "IT": "ITALY",
        "JE": "JERSEY",
        "JM": "JAMAICA",
        "JO": "JORDAN",
        "JP": "JAPAN",
        "KE": "KENYA",
        "KG": "KYRGYZSTAN",
        "KH": "CAMBODIA",
        "KI": "KIRIBATI",
        "KM": "COMOROS",
        "KN": "SAINT KITTS AND NEVIS",
        "KP": "KOREA (DEMOCRATIC PEOPLE'S REPUBLIC OF)",
        "KR": "KOREA, REPUBLIC OF",
        "KW": "KUWAIT",
        "KY": "CAYMAN ISLANDS",
        "KZ": "KAZAKHSTAN",
        "LA": "LAO PEOPLE'S DEMOCRATIC REPUBLIC",
        "LB": "LEBANON",
        "LC": "SAINT LUCIA",
        "LI": "LIECHTENSTEIN",
        "LK": "SRI LANKA",
        "LR": "LIBERIA",
        "LS": "LESOTHO",
        "LT": "LITHUANIA",
        "LU": "LUXEMBOURG",
        "LV": "LATVIA",
        "LY": "LIBYA",
        "MA": "MOROCCO",
        "MC": "MONACO",
        "MD": "MOLDOVA, REPUBLIC OF",
        "ME": "MONTENEGRO",
        "MF": "SAINT MARTIN (FRENCH PART)",
        "MG": "MADAGASCAR",
        "MH": "MARSHALL ISLANDS",
        "MK": "NORTH MACEDONIA",
        "ML": "MALI",
        "MM": "MYANMAR",
        "MN": "MONGOLIA",
        "MO": "MACAO",
        "MP": "NORTHERN MARIANA ISLANDS",
        "MQ": "MARTINIQUE",
        "MR": "MAURITANIA",
        "MS": "MONTSERRAT",
        "MT": "MALTA",
        "MU": "MAURITIUS",
        "MV": "MALDIVES",
        "MW": "MALAWI",
        "MX": "MEXICO",
        "MY": "MALAYSIA",
        "MZ": "MOZAMBIQUE",
        "NA": "NAMIBIA",
        "NC": "NEW CALEDONIA",
        "NE": "NIGER",
        "NF": "NORFOLK ISLAND",
        "NG": "NIGERIA",
        "NI": "NICARAGUA",
        "NL": "NETHERLANDS",
        "NO": "NORWAY",
        "NP": "NEPAL",
        "NR": "NAURU",
        "NU": "NIUE",
        "NZ": "NEW ZEALAND",
        "OM": "OMAN",
        "PA": "PANAMA",
        "PE": "PERU",
        "PF": "FRENCH POLYNESIA",
        "PG": "PAPUA NEW GUINEA",
        "PH": "PHILIPPINES",
        "PK": "PAKISTAN",
        "PL": "POLAND",
        "PM": "SAINT PIERRE AND MIQUELON",
        "PN": "PITCAIRN",
        "PR": "PUERTO RICO",
        "PS": "PALESTINE, STATE OF",
        "PT": "PORTUGAL",
        "PW": "PALAU",
        "PY": "PARAGUAY",
        "QA": "QATAR",
        "RE": "REUNION",
        "RO": "ROMANIA",
        "RS": "SERBIA",
        "RU": "RUSSIAN FEDERATION",
        "RW": "RWANDA",
        "SA": "SAUDI ARABIA",
        "SB": "SOLOMON ISLANDS",
        "SC": "SEYCHELLES",
        "SD": "SUDAN",
        "SE": "SWEDEN",
        "SG": "SINGAPORE",
        "SH": "SAINT HELENA, ASCENSION AND TRISTAN DA CUNHA",
        "SI": "SLOVENIA",
        "SJ": "SVALBARD AND JAN MAYEN",
        "SK": "SLOVAKIA",
        "SL": "SIERRA LEONE",
        "SM": "SAN MARINO",
        "SN": "SENEGAL",
        "SO": "SOMALIA",
        "SR": "SURINAME",
        "SS": "SOUTH SUDAN",
        "ST": "SAO TOME AND PRINCIPE",
        "SV": "EL SALVADOR",
        "SX": "SINT MAARTEN (DUTCH PART)",
        "SY": "SYRIAN ARAB REPUBLIC",
        "SZ": "ESWATINI",
        "TC": "TURKS AND CAICOS ISLANDS",
        "TD": "CHAD",
        "TF": "FRENCH SOUTHERN TERRITORIES",
        "TG": "TOGO",
        "TH": "THAILAND",
        "TJ": "TAJIKISTAN",
        "TK": "TOKELAU",
        "TL": "TIMOR-LESTE",
        "TM": "TURKMENISTAN",
        "TN": "TUNISIA",
        "TO": "TONGA",
        "TP": "EAST TIMOR",
        "TR": "TURKEY Türkiye",
        "TT": "TRINIDAD AND TOBAGO",
        "TV": "TUVALU",
        "TW": "TAIWAN, PROVINCE OF CHINA",
        "TZ": "TANZANIA, UNITED REPUBLIC OF",
        "UA": "UKRAINE",
        "UG": "UGANDA",
        "UM": "UNITED STATES MINOR OUTLYING ISLANDS",
        "US": "UNITED STATES OF AMERICA",
        "UY": "URUGUAY",
        "UZ": "UZBEKISTAN",
        "VA": "HOLY SEE",
        "VC": "SAINT VINCENT AND THE GRENADINES",
        "VE": "VENEZUELA (BOLIVARIAN REPUBLIC OF)",
        "VG": "VIRGIN ISLANDS, BRITISH",
        "VI": "VIRGIN ISLANDS, U.S.",
        "VN": "VIET NAM",
        "VU": "VANUATU",
        "WF": "WALLIS AND FUTUNA",
        "WS": "SAMOA",
        "XK": "KOSOVO",
        "YE": "YEMEN",
        "YT": "MAYOTTE",
        "YU": "YUGOSLAVIA",
        "ZA": "SOUTH AFRICA",
        "ZM": "ZAMBIA",
        "ZR": "ZAIRE",
        "ZW": "ZIMBABWE",

    }
}