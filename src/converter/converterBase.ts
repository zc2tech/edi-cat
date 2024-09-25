import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter, ConvertErr } from "../new_parser/entities";
import { ASTNode, ASTNodeType } from "../new_parser/syntaxParserBase";
import { CUtilX12 } from "../utils/cUtilX12";
import Utils, { StringBuilder } from "../utils/utils";
import { create, fragment } from "xmlbuilder2";
import * as vscode from "vscode";
import { EdiUtils } from "../utils/ediUtils";
import { TidyAddress, TidyContact } from "./xmlTidy/TidyCommon";
import { XML, configuration } from "../cat_const";
import { formatInTimeZone } from "date-fns-tz";
import { format } from "date-fns";
import constants = require("constants");

export class CommentsURL {
    public _name: string = '';
    public _txt: string = '';
    toString(): string {
        return `URL(_name: ${this._name}, _txt: ${this._txt})`;
    }
}
export class Comments {
    public _lang = 'EN';
    public _type = '';
    public _urls: CommentsURL[] = [];
    public _txt = '';

    public toString(): string {
        return '_urls:' + this._urls.join(' | ') + ' _txt:' + this._txt;
    }
}
/**
 * This is a new parser base, for my document level Synatx Check
 * 
 */
export abstract class ConverterBase {
    protected static EMPTY_KEY = '00000EMPTY_KEY'; // the head '00000' is for sort
    protected _astTree: ASTNode;
    protected _cvtDiags: vscode.Diagnostic[];
    protected _document: vscode.TextDocument; // can be undefined, so we don't need Range info of error
    protected _to: XMLBuilder;
    private _dummyPosition: vscode.Position = new vscode.Position(0, 1);
    private _dummyRange: vscode.Range = new vscode.Range(this._dummyPosition, this._dummyPosition);


    constructor(astTree: ASTNode) {
        this._astTree = astTree;
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
     * Used for display diagnostic path of the error segment
     * @param seg
     * @returns 
     */
    protected _diagPath(seg: EdiSegment): string {
        let arr: string[] = [];
        if (seg.astNode) {
            let p = seg.astNode; // init value
            while (p) {
                if (p.nodeName == "ROOT") {
                    arr.push(p.nodeName);
                    break;
                } else {
                    arr.push(p.nodeName + "[" + p.idxInSibling + "]");
                    p = p.parentNode;
                }

            }
        } else {
            return seg.id;
        }

        return arr.reverse().join("->");
    }


    /**
     *  X12, test or production
      * detail error is saved in ConvertUtilsX12.err 
      * 
      * @param value 
      * @returns 
      */
    protected _chkUsageIndicator(): boolean {
        let ISA = this._rseg("ISA");
        let usageIndicator = this._segVal(ISA, 15);
        if (!usageIndicator) {
            this._addCvtDiagSeg(ISA, 'Usage Indicator not exist, ROOT_ISA index:15');
            return false;
        }
        if (usageIndicator !== 'T' && usageIndicator !== 'P') {
            this._addCvtDiagSeg(ISA, `Usage Indicator should be 'T' or 'P', ROOT_ISA index:15`);
            return false;
        }
        return true;
    }

    /**
   * X12 BIG 01
   * <InvoiceDetailRequest><InvoiceDetailRequestHeader @invoiceDate>
   * @param value 
   * @returns 
   */
    protected _chkBIG01(BIG: EdiSegment): boolean {
        // <InvoiceDetailRequest><InvoiceDetailRequestHeader @invoiceDate>
        let invoiceDate = this._segVal(BIG, 1);
        if (!Utils.parseToDateYMD(invoiceDate)) {
            this._addCvtDiagSeg(BIG, `Invoice Date not correct, ${this._diagPath(BIG)} index:01`);
            return false;
        } else {
            return true;
        }
    }

    /**
     * X12 BIG 03
     * @param value 
     * @returns 
     */
    protected _chkBIG03(BIG: EdiSegment): boolean {

        let orderDate = this._segVal(BIG, 3);

        if (!Utils.parseToDateYMD(orderDate)) {
            this._addCvtDiagSeg(BIG, `Invoice Date not correct,  ${this._diagPath(BIG)}  index:01`);
            return false;
        } else {
            return true;
        }
    }

    protected _clearDiags() {
        this._cvtDiags = [];
    }

    protected _addCvtDiagSeg(seg: EdiSegment, msg: string) {
        let tmp = new vscode.Diagnostic(
            this._document ? EdiUtils.getSegmentRange(this._document, seg) : this._dummyRange,
            msg,
            vscode.DiagnosticSeverity.Error);
        this._cvtDiags.push(tmp);
    }

    protected _addCvtDiagHeader(msg: string) {
        let tmp = new vscode.Diagnostic(
            this._document ? EdiUtils.getFileHeaderRange(this._document) : this._dummyRange,
            msg,
            vscode.DiagnosticSeverity.Error);
        this._cvtDiags.push(tmp);
    }

    protected _addCvtDiagEle(seg: EdiSegment, element: EdiElement, msg: string) {
        let tmp: vscode.Diagnostic;

        if (element) {
            tmp = new vscode.Diagnostic(
                this._document ? EdiUtils.getElementRange(this._document, seg, element) : this._dummyRange,
                msg,
                vscode.DiagnosticSeverity.Error);
        } else {
            tmp = new vscode.Diagnostic(
                this._document ? EdiUtils.getSegmentRange(this._document, seg) : this._dummyRange,
                msg,
                vscode.DiagnosticSeverity.Error);
        }

        this._cvtDiags.push(tmp);
    }

    protected _hasConvertErr(): boolean {
        if (!this._cvtDiags || this._cvtDiags.length == 0) {
            return false;
        } else {
            return true;
        }
    }

    protected _renderConvertErr(): string {
        if (!this._cvtDiags) {
            return '';
        } else {
            let sb: StringBuilder = new StringBuilder();
            for (let e of this._cvtDiags) {
                sb.append(e.message);
                sb.append('\r\n');
                //sb.append('\r\n'); // maybe we need to use ediUtils.getNewLine
            }
            return sb.toString();
        }
    }

    /**
     * return first one matching the fullpath
     * @param segName 
     * @returns 
     */
    protected _rseg(segName: string): EdiSegment | undefined {
        let segs: EdiSegment[] | undefined = this._rsegs(segName);
        if (segs && segs.length > 0) {
            return segs[0];
        } else {
            return undefined;
        }
    }

    /**
     * Return Segment under Root
     * @param fullpath 
     * @returns 
     */
    protected _rsegs(segName: string): EdiSegment[] | undefined {
        let nodes: ASTNode[] = this._astTree.children.filter(n => n.nodeName == segName && n.type == ASTNodeType.Segment);

        if (!nodes || nodes.length == 0) {
            return;
        }

        let rtn: EdiSegment[] = [];
        for (let n of nodes) {
            if (n.seg) {
                rtn.push(n.seg);
            }
        }
        return rtn;
    }

    /**
     * All Groups under Root
     * @param fullpath 
     * @returns 
     */
    protected _rGrps(grpName: string): ASTNode[] | undefined {
        if (this._astTree.children) {
            return this._astTree.children.filter(n => n.nodeName == grpName && n.type == ASTNodeType.Group);
        }
    }

    /**
     * Return one node Under Root
     * @param fullpath 
     * @returns 
     */
    protected _rGrp1(grpName: string): ASTNode | undefined {
        if (this._astTree.children) {
            let arr = this._astTree.children.filter(n => n.nodeName == grpName && n.type == ASTNodeType.Group);
            if (arr) {
                return arr[0];
            }
        }
    }

    /**
     * Return all nodes matching the fullpath
     * recursively
     * @param fullpath empty string not to limit the fullpath
     * @returns 
     */
    protected _allSegs(parent: ASTNode, fullpath: string): EdiSegment[] | undefined {
        let rtn: EdiSegment[] = [];
        let pGroup: ASTNode[] = [];
        if (!parent) {
            return undefined;
        }
        pGroup.push(parent);


        while (pGroup.length > 0) {
            let n = pGroup.shift();
            for (let c of n.children) {
                if (fullpath && !fullpath.startsWith(c.fullPath)) {
                    // not need to go forward
                    continue;
                }
                if (c.type == ASTNodeType.Group) {
                    pGroup.push(c);
                } else {
                    if (fullpath == '' || c.fullPath == fullpath) {
                        rtn.push(c.seg);
                    }
                }
            }
        }
        return rtn;
    }

    /**
     * Direct Children Segments of Group 
     * @param fullpath empty string not to limit the fullpath
     * @returns 
     */
    protected _dSegs(pNode: ASTNode, segName: string): EdiSegment[] | undefined {
        let rtn: EdiSegment[] = [];
        if (!pNode) {
            return undefined;
        }
        for (let c of pNode.children) {
            if (c.type == ASTNodeType.Group) {
                continue;
            }
            if (c.nodeName == segName) {
                rtn.push(c.seg);
            }
        }

        return rtn;
    }

    /**
     * Get all group directly under pNode
     * @param pNode the parent Node
     * @param grpName 
     * @returns 
     */
    protected _dGrps(pNode: ASTNode, grpName: string): ASTNode[] | undefined {
        if (!pNode) {
            return undefined;
        }
        return pNode.children.filter(n => (n.type == ASTNodeType.Group) && (n.nodeName == grpName));
    }

    /**
     * Get ONE group directly under pNode
     * @param pNode the parent Node
     * @param grpName 
     * @returns 
     */
    protected _dGrp1(pNode: ASTNode, grpName: string): ASTNode | undefined {
        if (!pNode) {
            return undefined;
        }
        return pNode.children.find(n => (n.type == ASTNodeType.Group) && (n.nodeName == grpName));
    }

    /**
     * Return all nodes matching the fullpath
     * @param fullpath empty string not to limit the fullpath
     * @returns 
     */
    protected _dSeg1(pNode: ASTNode, segName: string): EdiSegment | undefined {
        let rtn: EdiSegment[] = [];
        if (!pNode) {
            return undefined;
        }
        for (let c of pNode.children) {
            if (c.type == ASTNodeType.Group) {
                continue;
            }
            if (c.nodeName == segName) {
                return c.seg;
            }
        }

        return undefined;
    }

    /**
     * Under Root!
     * get one segment
     * find out whose value of index is the expected
     * 
     * @param segName 
     * @param idx  1-based index
     * @param expected 
     * @returns 
     * Return at most ONE segment
     */

    protected _rSegByEleVal(segName: string, idx: number, expected: string): EdiSegment | undefined {
        let segs: EdiSegment[] | undefined = this._rsegs(segName);
        if (!segs) {
            return undefined;
        }
        return segs.find(s => s.getElement2(idx)!.value == expected)
    }

    /**
     * Under Root!
     * get all segments that match
     * 
     * @param segName 
     * @param idx  1-based index
     * @param expected 
     * @returns 
     */

    protected _rSegsByEleVal(segName: string, idx: number, expected: string): EdiSegment[] {
        let segs: EdiSegment[] | undefined = this._rsegs(segName);
        if (!segs) {
            return undefined;
        }
        return segs.filter(s => s.getElement2(idx)!.value == expected)
    }

    /**
     * Under Root! We can special two positions with two values
     * get all segments from fullpath,
     * then find out whose value of index is the expected
     * 
     * @param segName 
     * @param idx  1-based index
     * @param expected 
     * @returns 
     * Return at most ONE segment
     */

    protected _rSegByEleVal2(segName: string, idx1: number, expected1: string, idx2: number, expected2: string): EdiSegment | undefined {
        let segs: EdiSegment[] | undefined = this._rsegs(segName);
        if (!segs) {
            return undefined;
        }
        return segs.find(s => (s.getElement2(idx1)!.value == expected1 && s.getElement2(idx2)!.value == expected2));
    }

    /**
     * get from Children nodes with one condition
     * 
     * 
     * Return at most ONE segment
     */
    protected _segByEleVal(pNode: ASTNode, segName: string, idx: number, expected: string): EdiSegment | undefined {
        let segs: EdiSegment[] | undefined = this._dSegs(pNode, segName);
        if (!segs) {
            return undefined;
        }
        return segs.find(s => s.getElement2(idx)!.value == expected)
    }

    /**
     * Get only ONE segment from under Group Arrays
     * 
     * 
     * Return at most ONE segment
     */
    protected _segByGrpEleVal(grps: ASTNode[], segName: string, idx: number, expected: string): EdiSegment | undefined {
        let segs = this._segsByEleVal(grps, segName, idx, expected);
        if (segs) {
            return segs[0];
        } else {
            return undefined;
        }
    }



    /**
     * get from Children nodes with two condition
     * 
     * 
     * Return at most ONE segment
     */
    protected _segByEleVal3(pNode: ASTNode, segName: string, idx1: number, expected1: string
        , idx2: number, expected2: string): EdiSegment | undefined {
        let segs: EdiSegment[] | undefined = this._dSegs(pNode, segName);
        if (!segs) {
            return undefined;
        }
        try {
            return segs.find(s => (s.getElement2(idx1)!.value == expected1) && (s.getElement2(idx2)!.value == expected2))
        } catch (error) {
            return undefined;
        }
    }

    /**
     * Get only ONE segment from under Group Arrays, with 2 criteria
     * 
     * 
     * Return at most ONE segment
     */
    protected _segByGrpEleVal2(grps: ASTNode[], segName: string, idx1: number, expected1: string
        , idx2: number, expected2: string): EdiSegment | undefined {
        let segs: EdiSegment[] = [];

        for (let g of grps) {
            segs.push(... this._dSegs(g, segName));
        }

        if (segs.length == 0) {
            return undefined;
        }

        try {
            return segs.find(s => (s.getElement2(idx1)!.value == expected1) && (s.getElement2(idx2)!.value == expected2))
        } catch (error) {
            return undefined;
        }
    }

    /**
     * 
     * Inspect every child Seg of Groups, get Array of EdiSegments
     * 
     * @param grps 
     * @param segName 
     * @param idx 
     * @param expected 
     * @returns 
     */
    protected _segsByEleVal(grps: ASTNode[], segName: string, idx: number, expected: string): EdiSegment[] | undefined {
        let rtn: EdiSegment[] = [];
        for (let g of grps) {

            let segs: EdiSegment[] | undefined = this._dSegs(g, segName);
            if (!segs) {
                continue;
            }
            rtn.push(...segs.filter(s => s.getElement2(idx)!.value == expected));
        }
        return rtn;
    }

    /**
     * 
     * Get all Segments matching criteria under ONE Group
     * 
     * @param grp 
     * @param segName 
     * @param idx 
     * @param expected 
     * @returns 
     */
    protected _segsByEleVal2(grp: ASTNode, segName: string, idx: number, expected: string): EdiSegment[] | undefined {

        let segs: EdiSegment[] | undefined = this._dSegs(grp, segName);
        if (!segs) {
            return undefined;
        }
        return segs.filter(s => s.getElement2(idx)!.value == expected);
    }

    /**
     * 
     * @param seg if it's string, always get it under Root
     * @param idx based on 1 not 0, 102 means element 1 component 2
     * @returns 
     */
    protected _segVal(seg: string | EdiSegment, idx: number) {
        let theSeg: EdiSegment;
        if (typeof seg === 'string') {
            theSeg = this._rseg(seg);
        } else {
            theSeg = seg;
        }

        if (theSeg) {
            let eleIdx: number;
            let compIdx: number;
            if (idx >= 100) {
                // it contains component id
                eleIdx = Math.floor(idx / 100);
                compIdx = idx % 100;
            } else {
                eleIdx = idx;
                compIdx = undefined;
            }
            let ele = theSeg.getElement(eleIdx, compIdx);
            if (ele) {
                // return ele.value;
                return ele.trueValue;
            } else {
                return '';
            }
        } else {
            return '';
        }
    }

    /**
     * Replace value from XMLBuilder.textContent to another one
     * 
     */
    protected _rpl(from: XMLBuilder, to: XMLBuilder) {
        to.node.textContent = from.node.textContent;
    }

    /**
     * Last 3 characters should be mapped to currency. 
     * E.g. 100000 EUR
     * @param nodeParent 
     * @param tagName 
     */
    protected _parseAmtCur(strMoney: string): { amt: string, cur: string } {
        let nulResutl = { amt: '', cur: '' };
        if (strMoney.length < 3) {
            return nulResutl;
        }
        let strCur = strMoney.slice(-3);
        let strAmt = strMoney.replace(strCur, '').trim();
        return { amt: strAmt, cur: strCur };
    };


    /**
     * get one FTX segment under Root with element01 matching the value eleVal
     * @param seg Must be FTX type segment
     * @param ele1Val Value to search at postion 1
     */
    protected _RFTXcmtLang(ele1Val: string): { cmt: string, lang: string } {
        let theSeg: EdiSegment;
        theSeg = this._rSegByEleVal('FTX', 1, ele1Val);
        let seg20Val = this._segVal(theSeg, 2);
        if (seg20Val) {
            // if SEG02 exists, we need to deal with it specially, 
            // cannot be parsed in this function.
            return { cmt: '', lang: '' };
        }
        return this._FTXcmtLang2(theSeg);
    }

    /**
     * Just use EdiSegment to extract comment and langCode value
     * @param seg Must be FTX type segment
     * @param ele1Val Value to search at postion 1
     */
    protected _FTXcmtLang2(theSeg: EdiSegment): { cmt: string, lang: string } {

        let cmtSeg = this._segVal(theSeg, 401)
            + this._segVal(theSeg, 402)
            + this._segVal(theSeg, 403)
            + this._segVal(theSeg, 404)
            + this._segVal(theSeg, 405);

        let langCode = this._segVal(theSeg, 5);
        return { cmt: cmtSeg, lang: langCode };
    }

    /**
     * Element 401 would be Extrinsic's name attribute
     * @param seg Must be FTX type segment
     * @param ele1Val Value to search at postion 1
     */
    protected _FTXcmtLangZZZ(theSeg: EdiSegment): { cmt: string, name: string } {

        let cmtSeg = this._segVal(theSeg, 402)
            + this._segVal(theSeg, 403)
            + this._segVal(theSeg, 404)
            + this._segVal(theSeg, 405);

        let nameVal = this._segVal(theSeg, 401);
        return { cmt: cmtSeg, name: nameVal };
    }

    /**
     * If matching node not exists, create a new one.
     * @param nodeParent 
     * @param tagName 
     */
    protected _ele2(nodeParent: XMLBuilder, tagName: string): XMLBuilder {
        let xmlNode = nodeParent.find(n => n.node.nodeName == tagName);
        if (!xmlNode) {
            return nodeParent.ele(tagName);
        } else {
            return xmlNode;
        }

        // maybe you need to use try...catch
        // try {
        //     // Code that might throw an exception
        //     existing = xmlNode.first();
        // } catch (error) {
        //     existing = undefined;
        // }
    };

    /**
     * If matching node not exists, create a new one.
     * @param nodeParent 
     * @param tagName 
     */
    protected _ele3(nodeParent: XMLBuilder, tagLevel1: string, tagLevel2: string): XMLBuilder {
        return this._ele2(this._ele2(nodeParent, tagLevel1), tagLevel2);
    };

    /**
     * Especially for judge if fragment is empty
     * @param builder 
     * 
     * @returns 
     */
    protected _isXmlEmpty(builder: XMLBuilder): boolean {
        if (builder.node) {
            return !(builder.node.childNodes && builder.node.childNodes.length);
        }
        return true;
    }

    protected _lastKey(o: Object): string {
        let lastKey = undefined;
        if (!o) {
            return undefined;
        } else {
            for (let key in o) {
                lastKey = key;
            }
        }
        return lastKey;
    }
    /**
    * return the Node with name tagName
    * @param nodeParent 
    * @param tagName 
    */
    protected _xmlChild(nodeParent: XMLBuilder, childName: string): XMLBuilder {
        let xmlNode = nodeParent.find(n => n.node.nodeName == childName);
        if (!xmlNode) {
            return undefined;
        } else {
            return xmlNode;
        }

        // maybe you need to use try...catch
        // try {
        //     // Code that might throw an exception
        //     existing = xmlNode.first();
        // } catch (error) {
        //     existing = undefined;
        // }
    };

    protected _X12N4(grpN1: ASTNode, contact: XMLBuilder) {
        // N4
        let segN4 = this._dSeg1(grpN1, 'N4');
        if (!segN4) {
            return;
        }
        let N404 = this._segVal(segN4, 4);
        let postalAddress = this._ele2(contact, 'PostalAddress');

        // N4 City
        postalAddress.ele('City').txt(this._segVal(segN4, 1));

        // N4 State or Province Code
        if (N404 && (N404 == 'US' || N404 == 'CA' || N404 == 'IN')) {
            let tmpState = postalAddress.ele('State').txt(this._segVal(segN4, 2));
            if (N404 == 'IN') {
                tmpState.att('isoStateCode', N404 + '-' + this._segVal(segN4, 2));
            }
        }

        // N4 Postal Code
        postalAddress.ele('PostalCode').txt(this._segVal(segN4, 3));
        // N4 Country Code
        postalAddress.ele('Country').att('isoCountryCode', N404).txt(MAPStoXML.mapCountry[N404]);
        // N4 6
        if (N404 && !(N404 == 'US' || N404 == 'CA' || N404 == 'IN')) {
            postalAddress.ele('State').txt(this._segVal(segN4, 6));
        }
    }

    /**
     * Create multiple 'DeliverTo' and 'Street' , not cancatenate
     * 
     * @param tContact 
     * @param segNAD 
     */
    protected _NADPostalAddr(tContact: TidyContact|TidyAddress, segNAD: EdiSegment) {
        let postalAddress = tContact.PostalAddress.ele('PostalAddress');
        postalAddress.ele('DeliverTo').txt(this._segVal(segNAD, 401));
        let v402 = this._segVal(segNAD, 402);
        if (v402) {
            postalAddress.ele('DeliverTo').txt(v402);
        }
        let v403 = this._segVal(segNAD, 403);
        if (v403) {
            postalAddress.ele('DeliverTo').txt(v403);
        }
        let v404 = this._segVal(segNAD, 404);
        if (v404) {
            postalAddress.ele('DeliverTo').txt(v404);
        }
        let v405 = this._segVal(segNAD, 405);
        if (v405) {
            postalAddress.ele('DeliverTo').txt(v405);
        }


        postalAddress.ele('Street').txt(this._segVal(segNAD, 501));

        let v502 = this._segVal(segNAD, 502);
        if (v502) {
            postalAddress.ele('Street').txt(v502);
        }
        let v503 = this._segVal(segNAD, 503);
        if (v503) {
            postalAddress.ele('Street').txt(v503);
        }
        let v504 = this._segVal(segNAD, 504);
        if (v504) {
            postalAddress.ele('Street').txt(v504);
        }

        postalAddress.ele('City').txt(this._segVal(segNAD, 6));

        // A State or Province code or abbreviation. 
        // If DE3207 = "US" or "CA", then DE3229 is required and must be a valid two-char US State or Canadian Province code.
        postalAddress.ele('State').txt(this._segVal(segNAD, 7));

        postalAddress.ele('PostalCode').txt(this._segVal(segNAD, 8));

        // 509, Country
        let countryCode = this._segVal(segNAD, 9);
        postalAddress.ele('Country').att('isoCountryCode', countryCode)
            .txt(MAPStoXML.mapCountry[countryCode]);
    }
    /**
     * Create only one 'DeliverTo' and 'Street' , 
     * cancatenate the values with one space?
     * 
     * @param tContact 
     * @param segNAD 
     */
    protected _NADPostalAddr2(tContact: TidyContact|TidyAddress, segNAD: EdiSegment) {
        let postalAddress = tContact.PostalAddress.ele('PostalAddress');
        let sDeliverTo = this._segVal(segNAD, 401)
            + ' ' + this._segVal(segNAD, 402)
            + ' ' + this._segVal(segNAD, 403)
            + ' ' + this._segVal(segNAD, 404)
            + ' ' + this._segVal(segNAD, 405);
        postalAddress.ele('DeliverTo').txt(sDeliverTo.trim());

        let sStreet = this._segVal(segNAD, 501)
            + ' ' + this._segVal(segNAD, 502)
            + ' ' + this._segVal(segNAD, 503)
            + ' ' + this._segVal(segNAD, 504)
            + ' ' + this._segVal(segNAD, 505);
        postalAddress.ele('Street').txt(sStreet.trim());

        postalAddress.ele('City').txt(this._segVal(segNAD, 6));

        // A State or Province code or abbreviation. 
        // If DE3207 = "US" or "CA", then DE3229 is required and must be a valid two-char US State or Canadian Province code.
        postalAddress.ele('State').txt(this._segVal(segNAD, 7));

        postalAddress.ele('PostalCode').txt(this._segVal(segNAD, 8));

        // 509, Country
        let countryCode = this._segVal(segNAD, 9);
        postalAddress.ele('Country').att('isoCountryCode', countryCode)
            .txt(MAPStoXML.mapCountry[countryCode]);
    }

    /**
     * COMMUNICATION CONTACT
     * 
     * URL/Email/Fax/Phone
     * TODO:need fix after CIG fixed
     * 
     */
    protected _xmlCommFromCTA(SG: ASTNode, tContact: TidyContact|TidyAddress, roleName: string) {
        let COMs = this._dSegs(SG, 'COM');
        if (!COMs || COMs.length <= 0) {
            return;
        }

        let CTA = this._dSeg1(SG, 'CTA');

        let val201 = this._segVal(CTA, 201);
        let val202 = this._segVal(CTA, 202);
        let contactName = (val201 + val202);
        if (!contactName) {
            contactName = roleName
        }
        if (!contactName) {
            contactName = 'default'
        }

        // DTD "Contact" : "(Name,PostalAddress*,Email*,Phone*,Fax*,URL*,IdReference*,Extrinsic*)
        let fragEM = tContact.Email;
        let fragTE = tContact.Phone;
        let fragFX = tContact.Fax;
        let fragURL = tContact.URL;

        for (let c of COMs) {
            let commQualif = this._segVal(c, 102);
            let v = this._segVal(c, 101);
            let arrV = v.split('-');
            switch (commQualif) {
                case 'EM':
                    fragEM.ele('Email').att('name', contactName).txt(v);
                    break;
                case 'TE':
                    let p = fragTE.ele('Phone');
                    p.att('name', contactName).ele('TelephoneNumber')
                        .ele('CountryCode').att('isoCountryCode', '').txt(this._arrVal(arrV, 0))
                        .up().ele('AreaOrCityCode').txt(this._arrVal(arrV, 1))
                        .up().ele('Number').txt(this._arrVal(arrV, 2))
                    break;
                case 'FX':
                    let f = fragFX.ele('Fax');
                    f.att('name', contactName).ele('TelephoneNumber')
                        .ele('CountryCode').att('isoCountryCode', '').txt(this._arrVal(arrV, 0))
                        .up().ele('AreaOrCityCode').txt(this._arrVal(arrV, 1))
                        .up().ele('Number').txt(this._arrVal(arrV, 2))
                    break;
                case 'CA': // CIG does not implement.
                    fragURL.ele('URL').att('name', contactName).txt(v);
                    break;
                default:
                // do nothing
            } // end switch commQualif
        } // end loop COMs

    } // end function  _xmlCommFromCTA

    protected _fillMoney(fragOrEle: XMLBuilder, tagName: string, vMOA102: string, vMOA103: string, vMOA104: string) {
        let eMoney = this._ele3(fragOrEle, tagName, 'Money');
        if (vMOA104 == '4') {
            eMoney.txt(vMOA102).att(XML.currency, vMOA103);
        }
        if (vMOA104 == '7') {
            eMoney.att('alternateAmount', vMOA102).att('alternateCurrency', vMOA103);
        }
    }

    /**
     * 
     * Confirm if Child exists
     * 
     * @param xmlNode make sure it's not NULL/undefined
     * 
     */
    protected _xmlHasChild(xmlNode: XMLBuilder): boolean {
        let existing;
        try {
            // Code that might throw an exception
            existing = xmlNode.first();
        } catch (error) {
            return false;
        }

        if (existing) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Create XML Header
     * @param cxml 
     * 
     */
    protected _header_supplier_to_buyer(cxml: XMLBuilder) {
        let conf = vscode.workspace.getConfiguration(configuration.ediTsuya);
        let buyerANID: string = conf.get(configuration.buyerANID);
        let supplierANID: string = conf.get(configuration.supplierANID);
        let currentDateTime = new Date();
        cxml.att('payloadID', 'payload' + formatInTimeZone(currentDateTime, 'Z', "yyyyMMdd-HHmmss"));
        cxml.att('timestamp', formatInTimeZone(currentDateTime, 'Z', "yyyy-MM-dd'T'HH:mm:ssxxx"));
        let header = cxml.ele('Header');

        let from = header.ele(XML.From);
        from.ele(XML.Credential).att(XML.domain, XML.NetworkID).ele(XML.Identity).txt(supplierANID);

        // To
        this._to = header.ele(XML.To);
        this._to.ele(XML.Credential).att(XML.domain, XML.NetworkID).ele(XML.Identity).txt(buyerANID);

        let sender = header.ele(XML.Sender);
        let cred = sender.ele(XML.Credential).att(XML.domain, XML.NetworkID)
        cred.ele(XML.Identity).txt('AN01000000087')
        cred.ele(XML.SharedSecret)
        sender.ele(XML.UserAgent).txt('Ariba Supplier')
    }

    /**
     * Adjust format , so it's easier for comparing with
     * output of CIG DocumentValidator
     * 
     */
    protected _adjustXmlforCIG(sXML: string) {
        if (!sXML) {
            return '';
        }
        // sXML = sXML.replace(/<IdReference\s+([^>]*)identifier="([^"]*)"\s+([^>]*)domain="([^"]*)"/g, 
        // '<IdReference $1domain="$4" $3identifier="$2"');
        sXML = sXML.replace(/"en"\/>/g, `"en" />`);
        return sXML;
    }

    protected _adjustDomainIdRefOrder(sXML: string) {
        if (!sXML) {
            return '';
        }
        sXML = sXML.replace(/<IdReference\s+([^>]*)identifier="([^"]*)"\s+([^>]*)domain="([^"]*)"/g,
            '<IdReference $1domain="$4" $3identifier="$2"');
        return sXML;
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
     * Map Exists, Ignore Case
     * check if sKey exists in mapping, will convert to lowercase before comparing
     * @param mapping 
     * @param sKey will be converted to lowercase before finding value in mapping
     */
    protected _mei(mapping: Object, sKey: string): boolean {
        let sLower = sKey.toLocaleLowerCase();
        return (sLower in mapping);
    }

    /**
     * Map Exists,  Case Sensitive
     * check if sKey exists in mapping, will NOT convert to lowercase before comparing
     * @param mapping 
     * @param sKey will be converted to lowercase before finding value in mapping
     */
    protected _mes(mapping: Object, sKey: string): boolean {
        return (sKey in mapping);
    }
}

export class MAPStoXML {
    static mapCountry: Object = {
        "AD": "Andorra",
        "AE": "United Arab Emirates",
        "AF": "Afghanistan",
        "AG": "Antigua And Barbuda",
        "AI": "Anguilla",
        "AL": "Albania",
        "AM": "Armenia",
        "AN": "Netherlands Antiles",
        "AO": "Angola",
        "AQ": "Antarctica",
        "AR": "Argentina",
        "AS": "American Samoa",
        "AT": "Austria",
        "AU": "Australia",
        "AW": "Aruba",
        "AX": "Åland Islands",
        "AZ": "Azerbaijan",
        "BA": "Bosnia And Herzegovina",
        "BB": "Barbados",
        "BD": "Bangladesh",
        "BE": "Belgium",
        "BF": "Burkina Faso",
        "BG": "Bulgaria",
        "BH": "Bahrain",
        "BI": "Burundi",
        "BJ": "Benin",
        "BL": "Saint Barthélemy",
        "BM": "Bermuda",
        "BN": "Brunei Darussalam",
        "BO": "Bolivia (Plurinational State Of)",
        "BQ": "Bonaire, Sint Eustatius And Saba",
        "BR": "Brazil",
        "BS": "Bahamas",
        "BT": "Bhutan",
        "BV": "Bouvet Island",
        "BW": "Botswana",
        "BY": "Belarus",
        "BZ": "Belize",
        "CA": "Canada",
        "CC": "Cocos (Keeling) Islands",
        "CD": "Congo, Democratic Republic Of",
        "CF": "Central African Republic",
        "CG": "Congo",
        "CH": "Switzerland",
        "CI": "Cote D'Ivoire",
        "CK": "Cook Islands",
        "CL": "Chile",
        "CM": "Cameroon",
        "CN": "China",
        "CO": "Colombia",
        "CR": "Costa Rica",
        "CU": "Cuba",
        "CV": "Cabo Verde",
        "CW": "Curaçao",
        "CX": "Christmas Island",
        "CY": "Cyprus",
        "CZ": "Czechia",
        "DE": "Germany",
        "DJ": "Djibouti",
        "DK": "Denmark",
        "DM": "Dominica",
        "DO": "Dominican Republic",
        "DZ": "Algeria",
        "EC": "Ecuador",
        "EE": "Estonia",
        "EG": "Egypt",
        "EH": "Western Sahara",
        "ER": "Eritrea",
        "ES": "Spain",
        "ET": "Ethiopia",
        "FI": "Finland",
        "FJ": "Fiji",
        "FK": "Falkland Islands (Malvinas)",
        "FM": "Micronesia (Federated States Of)",
        "FO": "Faroe Islands",
        "FR": "France",
        "FX": "France, Metropolitan",
        "GA": "Gabon",
        "GB": "United Kingdom Of Great Britain And Northern Ireland",
        "GD": "Grenada",
        "GE": "Georgia",
        "GF": "French Guiana",
        "GG": "Guernsey",
        "GH": "Ghana",
        "GI": "Gibraltar",
        "GL": "Greenland",
        "GM": "Gambia",
        "GN": "Guinea",
        "GP": "Guadeloupe",
        "GQ": "Equatorial Guinea",
        "GR": "Greece",
        "GS": "South Georgia And The South Sandwich Islands",
        "GT": "Guatemala",
        "GU": "Guam",
        "GW": "Guinea-Bissau",
        "GY": "Guyana",
        "HK": "Hong Kong",
        "HM": "Heard Island And Mcdonald Islands",
        "HN": "Honduras",
        "HR": "Croatia",
        "HT": "Haiti",
        "HU": "Hungary",
        "ID": "Indonesia",
        "IE": "Ireland",
        "IL": "Israel",
        "IM": "Isle Of Man",
        "IN": "India",
        "IO": "British Indian Ocean Territory",
        "IQ": "Iraq",
        "IR": "Iran (Islamic Republic Of)",
        "IS": "Iceland",
        "IT": "Italy",
        "JE": "Jersey",
        "JM": "Jamaica",
        "JO": "Jordan",
        "JP": "Japan",
        "KE": "Kenya",
        "KG": "Kyrgyzstan",
        "KH": "Cambodia",
        "KI": "Kiribati",
        "KM": "Comoros",
        "KN": "Saint Kitts And Nevis",
        "KP": "Korea (Democratic People'S Republic Of)",
        "KR": "Korea, Republic Of",
        "KW": "Kuwait",
        "KY": "Cayman Islands",
        "KZ": "Kazakhstan",
        "LA": "Lao People'S Democratic Republic",
        "LB": "Lebanon",
        "LC": "Saint Lucia",
        "LI": "Liechtenstein",
        "LK": "Sri Lanka",
        "LR": "Liberia",
        "LS": "Lesotho",
        "LT": "Lithuania",
        "LU": "Luxembourg",
        "LV": "Latvia",
        "LY": "Libya",
        "MA": "Morocco",
        "MC": "Monaco",
        "MD": "Moldova, Republic Of",
        "ME": "Montenegro",
        "MF": "Saint Martin (French Part)",
        "MG": "Madagascar",
        "MH": "Marshall Islands",
        "MK": "North Macedonia",
        "ML": "Mali",
        "MM": "Myanmar",
        "MN": "Mongolia",
        "MO": "Macao",
        "MP": "Northern Mariana Islands",
        "MQ": "Martinique",
        "MR": "Mauritania",
        "MS": "Montserrat",
        "MT": "Malta",
        "MU": "Mauritius",
        "MV": "Maldives",
        "MW": "Malawi",
        "MX": "Mexico",
        "MY": "Malaysia",
        "MZ": "Mozambique",
        "NA": "Namibia",
        "NC": "New Caledonia",
        "NE": "Niger",
        "NF": "Norfolk Island",
        "NG": "Nigeria",
        "NI": "Nicaragua",
        "NL": "Netherlands",
        "NO": "Norway",
        "NP": "Nepal",
        "NR": "Nauru",
        "NU": "Niue",
        "NZ": "New Zealand",
        "OM": "Oman",
        "PA": "Panama",
        "PE": "Peru",
        "PF": "French Polynesia",
        "PG": "Papua New Guinea",
        "PH": "Philippines",
        "PK": "Pakistan",
        "PL": "Poland",
        "PM": "Saint Pierre And Miquelon",
        "PN": "Pitcairn",
        "PR": "Puerto Rico",
        "PS": "Palestine, State Of",
        "PT": "Portugal",
        "PW": "Palau",
        "PY": "Paraguay",
        "QA": "Qatar",
        "RE": "Reunion",
        "RO": "Romania",
        "RS": "Serbia",
        "RU": "Russian Federation",
        "RW": "Rwanda",
        "SA": "Saudi Arabia",
        "SB": "Solomon Islands",
        "SC": "Seychelles",
        "SD": "Sudan",
        "SE": "Sweden",
        "SG": "Singapore",
        "SH": "Saint Helena, Ascension And Tristan Da Cunha",
        "SI": "Slovenia",
        "SJ": "Svalbard And Jan Mayen",
        "SK": "Slovakia",
        "SL": "Sierra Leone",
        "SM": "San Marino",
        "SN": "Senegal",
        "SO": "Somalia",
        "SR": "Suriname",
        "SS": "South Sudan",
        "ST": "Sao Tome And Principe",
        "SV": "El Salvador",
        "SX": "Sint Maarten (Dutch Part)",
        "SY": "Syrian Arab Republic",
        "SZ": "Eswatini",
        "TC": "Turks And Caicos Islands",
        "TD": "Chad",
        "TF": "French Southern Territories",
        "TG": "Togo",
        "TH": "Thailand",
        "TJ": "Tajikistan",
        "TK": "Tokelau",
        "TL": "Timor-Leste",
        "TM": "Turkmenistan",
        "TN": "Tunisia",
        "TO": "Tonga",
        "TP": "East Timor",
        "TR": "Turkey Türkiye",
        "TT": "Trinidad And Tobago",
        "TV": "Tuvalu",
        "TW": "Taiwan, Province Of China",
        "TZ": "Tanzania, United Republic Of",
        "UA": "Ukraine",
        "UG": "Uganda",
        "UM": "United States Minor Outlying Islands",
        "US": "United States",
        "UY": "Uruguay",
        "UZ": "Uzbekistan",
        "VA": "Holy See",
        "VC": "Saint Vincent And The Grenadines",
        "VE": "Venezuela (Bolivarian Republic Of)",
        "VG": "Virgin Islands, British",
        "VI": "Virgin Islands, U.S.",
        "VN": "Viet Nam",
        "VU": "Vanuatu",
        "WF": "Wallis And Futuna",
        "WS": "Samoa",
        "XK": "Kosovo *(Temporary Country Code For Kosovo Till Iso Officially Assigns A Code. If This Code Is To Be Used Please Make Sure That The System Of Your Business Partner Can Also Process It)",
        "YE": "Yemen",
        "YT": "Mayotte",
        "YU": "Yugoslavia",
        "ZA": "South Africa",
        "ZM": "Zambia",
        "ZR": "Zaire",
        "ZW": "Zimbabwe",

    }
}
