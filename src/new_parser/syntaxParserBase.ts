/* eslint-disable prefer-const */


import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter, ConvertErr } from "./entities";
import * as vscode from "vscode";
import { EdiSchema } from "../schemas/schemas";
import * as constants from "../cat_const";
import Utils from "../utils/utils";
import { StringBuilder } from "../utils/utils";
//import {EdiHierarchy} from "./_ediHierarchy";
import { DiagORDRSP } from "../diagnostics/versions/diagORDRSP";
import { Diag850 } from "../diagnostics/versions/diag850";
import { EdiType } from "./entities";
import { EdiUtils } from "../utils/ediUtils";
import { DocInfoBase } from "../info/docInfoBase";
import { CUtilX12 } from "../utils/cUtilX12";


/**
 * This is a new parser base, for my document level Synatx Check
 * 
 */
export abstract class SyntaxParserBase {

    protected _diags: vscode.Diagnostic[];   
    public docInfo: DocInfoBase;
    _parserKey: string;
    _astTree: ASTNode;
    _currNode: ASTNode;
    _tableDFA: unknown;
    _ediType: EdiType;
    // private _ediHierarchy: EdiHierarchy;

    schema: EdiSchema;
    _separators?: EdiDelimiter;

    _parsingRleaseAndVersion?: boolean = false;

    /**
 * Override 
 * @returns 
 */
    public getDiags(): vscode.Diagnostic[] {
        return this._diags;
    }
    public getAstTree(): ASTNode {
        return this._astTree;
    }

    public getMessageDelimiters(): EdiDelimiter {
        return this._separators;
    }

    /**
     * For output AST
     * @param separators 
     */
    public setMessageDelimiters(separators: EdiDelimiter): void {
        this._separators = separators;
    }

    protected findAncestor(curr: ASTNode, ancestor: string): ASTNode {
        let a: ASTNode = curr;
        while (a) {
            if (a.nodeName === ancestor) {
                return a;
            } else {
                a = a.parentNode;
            }
        }
    }

    /**
     * 1: X12 => cXML
     * 
     * @param pattern 
     * 
     */
    public abstract convert(pattern: constants.ConvertPattern): string;

    /**
     * this method should be invoked only when there is no syntax errors.
     * it's meaningless to do this check if basic syntax requirement is not fulfilled
     * 
     * @param pattern 
     */
    public abstract convertCheck(document:vscode.TextDocument):vscode.Diagnostic[];

    /**
     * Override base
     */
    public renderAST(): string {
        let sb: StringBuilder = new StringBuilder();
        let initLevel = 0;
        this._renderNode(this._astTree, sb, initLevel);
        return sb.toString();
    }

    private _renderNode(node: ASTNode, sb: StringBuilder, nLevel: number) {
        if (node.type == ASTNodeType.Group) {
            sb.append(node.nodeName);
            if (node.nodeName == "ROOT") {
                sb.append('_' + this._parserKey);
            } else {
                sb.append(" [" + node.idxInSibling + "] ");
            }

            // just to make life easy for existing seg parser
            sb.append(this._separators.segmentDelimiter);

        } else {
            sb.append(node.seg.toString());
        }

        if (node.type == ASTNodeType.Group) {
            let currLevel = nLevel + 1;
            for (let c of node.children) {
                sb.append('\r\n');
                sb.append('\t'.repeat(currLevel));
                this._renderNode(c, sb, currLevel);
                //sb.append('\r\n'); // maybe we need to use ediUtils.getNewLine
            }
        }

    }

    //abstract toXML():string;

    public parse(vsDocument: vscode.TextDocument, segs: EdiSegment[]) {
        this._diags = [];
        this._astTree = {
            nodeName: "ROOT",
            fullPath: "ROOT",
            type: ASTNodeType.Group,
            children: [],
            parentNode: null
        }

        this._currNode = this._astTree;
        let endSegPath = "";
        if (EdiUtils.isX12(vsDocument)) {
            endSegPath = "ROOT_IEA";
        } else if (EdiUtils.isEdifact(vsDocument)) {
            endSegPath = "ROOT_UNZ";
        } else {
            // leave it
        }

        for (let seg of segs) {
            let newNode: ASTNode;

            if (this._currNode.fullPath == endSegPath) {
                this._diags.push(new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(vsDocument, seg),
                    `Cannot add segments after the END segment`,
                    vscode.DiagnosticSeverity.Error
                )
                )
                break;
            }

            if (!this._tableDFA[this._currNode.fullPath] || !this._tableDFA[this._currNode.fullPath][seg.id]) {
                // didn't find the mapping
                let strExpected = "";
                if (this._tableDFA[this._currNode.fullPath]) {
                    strExpected = Object.keys(this._tableDFA[this._currNode.fullPath]).join(',')
                }

                this._diags.push(
                    new vscode.Diagnostic(
                        EdiUtils.getSegmentRange(vsDocument, seg),
                        `Wrong segment ${seg.id} for status: ${this._currNode.fullPath}, expected: ${strExpected}`,
                        vscode.DiagnosticSeverity.Error
                    )
                )
                break;
            }

            let o: ASTOp = this._tableDFA[this._currNode.fullPath][seg.id];

            let insertObject: ASTNode;
            switch (o.op) {
                case ASTOpType.NOP:
                    newNode = this._currNode; // do not change position for NOP operation
                    break;
                case ASTOpType.ADD_SEG_UNDER_ROOT:
                    newNode = this._insertSeg(this._astTree, seg);
                    break;

                case ASTOpType.ADD_SIBLING_SEG:
                    insertObject = this._currNode.parentNode;
                    newNode = this._insertSeg(insertObject, seg);
                    break;
                case ASTOpType.ADD_SEG_UNDER_ANCESTOR:
                    insertObject = this.findAncestor(this._currNode, o.data2);
                    newNode = this._insertSeg(insertObject, seg);
                    break;
                case ASTOpType.ADD_UNCLE_SEG:
                    insertObject = this._currNode.parentNode.parentNode;
                    newNode = this._insertSeg(insertObject, seg);
                    break;
                case ASTOpType.NEW_ROOT_GROUP:
                    insertObject = this._astTree;
                    newNode = this._insertGroupWithSeg(insertObject, o.data1, seg);
                    break;
                case ASTOpType.NEW_SIBLING_GROUP:
                    insertObject = this._currNode.parentNode;
                    newNode = this._insertGroupWithSeg(insertObject, o.data1, seg);
                    break;
                case ASTOpType.NEW_UNCLE_GROUP:
                    insertObject = this._currNode.parentNode.parentNode;
                    newNode = this._insertGroupWithSeg(insertObject, o.data1, seg);
                    break;
                case ASTOpType.NEW_GROUP_UNDER_ANCESTOR:
                    insertObject = this.findAncestor(this._currNode, o.data2);
                    newNode = this._insertGroupWithSeg(insertObject, o.data1, seg);
                    break;
            }
            this._currNode = newNode; // switch to new status/node
        } // end loop for segs

        if (EdiUtils.isX12(vsDocument)) {
            this._chkControlNumberISA(vsDocument, segs);
            this._chkControlNumberGS(vsDocument, segs);
            this._chkControlNumberST(vsDocument, segs);
        } else if (EdiUtils.isEdifact(vsDocument)) {
            this._chkControlNumberUNB(vsDocument, segs);
            this._chkControlNumberUNH(vsDocument, segs);
        } else {
            // leave it
        }

        // maybe AST is not complete yet, we do our best to diag


    }

    protected _chkControlNumberISA(vsDocument: vscode.TextDocument, segs: EdiSegment[]): boolean {
        let segISA = segs.find(ele => ele.id == "ISA");
        let segIEA = segs.find(ele => ele.id == "IEA");
        if (!segISA || !segIEA) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getFileTailRange(vsDocument),
                    `Segment ISA/IEA not exists`,
                    vscode.DiagnosticSeverity.Error
                )

            )
            return false;
        }

        let ISA13 = segISA.getElement(13);
        let IEA02 = segIEA.getElement(2);

        if (!ISA13) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(vsDocument, segISA),
                    `Interchange Control Number not exist for ISA Segment`,
                    vscode.DiagnosticSeverity.Error
                )
            )
            return false;
        }
        if (!IEA02) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(vsDocument, segIEA),
                    `Interchange Control Number not exist for IEA Segment`,
                    vscode.DiagnosticSeverity.Error
                )
            )
            return false;
        }

        if (ISA13.value != IEA02.value) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getElementRange(vsDocument, segISA, ISA13),
                    `Interchange Control Number must be identical for ISA and IEA`,
                    vscode.DiagnosticSeverity.Error
                )

            )
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getElementRange(vsDocument, segIEA, IEA02),
                    `Interchange Control Number must be identical for ISA and IEA`,
                    vscode.DiagnosticSeverity.Error
                )

            )
        }
        return true;
    }

    protected _chkControlNumberGS(vsDocument: vscode.TextDocument, segs: EdiSegment[]): boolean {
        let segGS = segs.find(ele => ele.id == "GS");
        let segGE = segs.find(ele => ele.id == "GE");
        if (!segGS || !segGE) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getFileTailRange(vsDocument),
                    `Segment GS/GE not exist`,
                    vscode.DiagnosticSeverity.Error
                )

            )
            return false;
        }

        let GS06 = segGS.getElement(6);
        let GE02 = segGE.getElement(2);

        if (!GS06) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(vsDocument, segGS),
                    `Group Control Number not exist for GS Segment`,
                    vscode.DiagnosticSeverity.Error
                )
            )
            return false;
        }
        if (!GE02) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(vsDocument, segGE),
                    `Group Control Number not exist for GE Segment`,
                    vscode.DiagnosticSeverity.Error
                )
            )
            return false;
        }

        if (GS06.value != GE02.value) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getElementRange(vsDocument, segGS, GS06),
                    `Group Control Number must be identical for GS and GE`,
                    vscode.DiagnosticSeverity.Error
                )

            )
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getElementRange(vsDocument, segGE, GE02),
                    `Group Control Number must be identical for GS and GE`,
                    vscode.DiagnosticSeverity.Error
                )

            )
        }
        return true;
    }
    protected _chkControlNumberST(vsDocument: vscode.TextDocument, segs: EdiSegment[]): boolean {
        let segST = segs.find(ele => ele.id == "ST");
        let segSE = segs.find(ele => ele.id == "SE");
        if (!segST || !segSE) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getFileTailRange(vsDocument),
                    `Segment ST/SE not exist`,
                    vscode.DiagnosticSeverity.Error
                )

            )
            return false;
        }

        let ST02 = segST.getElement(2);
        let SE02 = segSE.getElement(2);

        if (!ST02) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(vsDocument, segST),
                    `Transaction Set Control Number not exist for ST Segment`,
                    vscode.DiagnosticSeverity.Error
                )
            )
            return false;
        }
        if (!SE02) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(vsDocument, segSE),
                    `Transaction Set Control Number not exist for SE Segment`,
                    vscode.DiagnosticSeverity.Error
                )
            )
            return false;
        }

        if (ST02.value != SE02.value) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getElementRange(vsDocument, segST, ST02),
                    `Transaction Set Control Number must be identical for ST and SE`,
                    vscode.DiagnosticSeverity.Error
                )

            )
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getElementRange(vsDocument, segSE, SE02),
                    `Transaction Set Control Number must be identical for ST and SE`,
                    vscode.DiagnosticSeverity.Error
                )

            )
        }
        return true;
    }

    protected _chkControlNumberUNB(vsDocument: vscode.TextDocument, segs: EdiSegment[]): boolean {
        let segUNB = segs.find(ele => ele.id == "UNB");
        let segUNZ = segs.find(ele => ele.id == "UNZ");
        if (!segUNB || !segUNZ) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getFileTailRange(vsDocument),
                    `Segment UNB/UNZ not exist`,
                    vscode.DiagnosticSeverity.Error
                )

            )
            return false;
        }

        // id = 0020
        let UNB0020 = segUNB.getElement(5);
        let UNZ0020 = segUNZ.getElement(2);

        if (!UNB0020) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(vsDocument, segUNB),
                    `Interchange control reference not exist for UNB Segment`,
                    vscode.DiagnosticSeverity.Error
                )
            )
            return false;
        }

        if (!UNZ0020) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(vsDocument, segUNZ),
                    `Interchange control reference not exist for UNZ Segment`,
                    vscode.DiagnosticSeverity.Error
                )
            )
            return false;
        }

        if (UNB0020.value != UNZ0020.value) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getElementRange(vsDocument, segUNB, UNB0020),
                    `Interchange control reference must be identical for UNB and UNZ`,
                    vscode.DiagnosticSeverity.Error
                )

            )
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getElementRange(vsDocument, segUNZ, UNZ0020),
                    `Interchange control reference must be identical for UNB and UNZ`,
                    vscode.DiagnosticSeverity.Error
                )

            )
        }
        return true;
    }

    protected _chkControlNumberUNH(vsDocument: vscode.TextDocument, segs: EdiSegment[]): boolean {
        let segUNH = segs.find(ele => ele.id == "UNH");
        let segUNT = segs.find(ele => ele.id == "UNT");
        if (!segUNH || !segUNT) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getFileTailRange(vsDocument),
                    `Segment UNH/UNT not exist`,
                    vscode.DiagnosticSeverity.Error
                )

            )
            return false;
        }

        // id= 0062
        let UNH0062 = segUNH.getElement(1);
        let UNT0062 = segUNT.getElement(2);

        if (!UNH0062) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(vsDocument, segUNH),
                    `Message reference number Number not exist for UNH Segment`,
                    vscode.DiagnosticSeverity.Error
                )
            )
            return false;
        }
        if (!UNT0062) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(vsDocument, segUNT),
                    `Message reference number Number not exist for UNT Segment`,
                    vscode.DiagnosticSeverity.Error
                )
            )
            return false;
        }

        if (UNH0062.value != UNT0062.value) {
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getElementRange(vsDocument, segUNH, UNH0062),
                    `Message reference number must be identical for UNH and UNT`,
                    vscode.DiagnosticSeverity.Error
                )

            )
            this._diags.push(
                new vscode.Diagnostic(
                    EdiUtils.getElementRange(vsDocument, segUNT, UNT0062),
                    `Message reference number must be identical for UNH and UNT`,
                    vscode.DiagnosticSeverity.Error
                )

            )
        }
        return true;
    }

    /**
     * 
     * @param insertObject 
     * @param seg 
     * @returns The Segment node that newly created
     */
    protected _insertSeg(insertObject: ASTNode, seg: EdiSegment): ASTNode {
        let node: ASTNode = {
            nodeName: seg.id,
            seg: seg,
            fullPath: insertObject.fullPath + "_" + seg.id,
            type: ASTNodeType.Segment,
            children: [],
            parentNode: insertObject,
            idxInSibling:0,
        }
        seg.astNode = node;

        let siblingCount = insertObject.children.filter(n=> n.fullPath == node.fullPath).length;
        if (siblingCount && siblingCount > 0) {
            node.idxInSibling = siblingCount; // because idx start from 0;
        }

        insertObject.children.push(node);
        return node;
    }

    /**
     * 
     * @param insertObject 
     * @param newGroupName 
     * @param seg 
     * @returns The Segment node that newly created
     */
    protected _insertGroupWithSeg(insertObject: ASTNode, newGroupName: string, seg: EdiSegment): ASTNode {
        let groupNode: ASTNode = {
            nodeName: newGroupName,
            fullPath: insertObject.fullPath + "_" + newGroupName,
            type: ASTNodeType.Group,
            children: [],
            parentNode: insertObject,
            idxInSibling: 0,
        }
        
        let siblingCount = insertObject.children.filter(n=> n.fullPath == groupNode.fullPath).length;
        if (siblingCount && siblingCount > 0) {
            groupNode.idxInSibling = siblingCount; // because idx start from 0;
        }

        insertObject.children.push(groupNode);
        let node: ASTNode = {
            nodeName: seg.id,
            seg: seg,
            fullPath: groupNode.fullPath + "_" + seg.id,
            type: ASTNodeType.Segment,
            children: [],
            parentNode: groupNode
        }
        seg.astNode = node;
        groupNode.children.push(node);

        return node;
    }


    protected _getSeg(segName: string): EdiSegment {
        let node = this._astTree.children.find(n => n.nodeName == segName);
        if (node) {
            return node.seg;
        } else {
            return undefined;
        }
    }

    /**
     * return first one matching the fullpath
     * @param segName 
     * @returns 
     */
    protected _getSegByFullPath(fullpath: string): EdiSegment {
        let segs: EdiSegment[] = this._getSegArrayByFullPath(fullpath);
        if (segs && segs.length > 0) {
            return segs[0];
        } else {
            return undefined;
        }
    }

    /**
     * Return all nodes matching the fullpath
     * @param fullpath 
     * @returns 
     */
    protected _getSegArrayByFullPath(fullpath: string): EdiSegment[] {
        let nodes: ASTNode[] = this._astTree.children.filter(n => n.fullPath == fullpath);
        if (!nodes || nodes.length == 0) {
            return undefined;
        }

        let rtn: EdiSegment[] = [];
        for (let n of nodes) {
            rtn.push(n.seg);
        }
        return rtn;
    }

    /**
     * get all segments from fullpath,
     * then find out whose value of index is the expected
     * 
     * Return at most ONE segment
     */
    protected _getSegByEleVal(fullpath: string, idx: number, expected: string) {
        let segs: EdiSegment[] = this._getSegArrayByFullPath(fullpath);
        if (!segs) {
            return undefined;
        }
        return segs.find(s => s.getElement(idx).value == expected)
    }

    protected _getSegValueByIdx(seg: string | EdiSegment, idx: number) {
        let theSeg: EdiSegment;
        if (typeof seg === 'string') {
            theSeg = this._getSeg(seg);
        } else {
            theSeg = seg;
        }

        if (theSeg) {
            let ele = theSeg.getElement(idx);
            if (ele) {
                return theSeg.getElement(idx).value;
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }


}

export class ASTNode {
    nodeName: string; /** Should be segment name or group name */
    type: ASTNodeType;
    seg?: EdiSegment;
    children: ASTNode[] = [];
    parentNode?: ASTNode;
    fullPath: string;
    idxInSibling?: number; // index start from 0;
}

export class ASTOp {
    op: ASTOpType;
    data1?: string;  // New Group Name if type is not ADD_SEG
    data2?: string; // Ancestor Group Name, if need to set
    constructor(op: ASTOpType, data1?: string, data2?: string) {
        this.op = op;
        this.data1 = data1; // Group Name
        this.data2 = data2; // Ancestor Group Name, if need to set
    }
}

/**
 * Operation based on position of Segment Status, NOT Parent Group
 */
export enum ASTOpType {
    NOP, // do nothing
    ADD_SEG_UNDER_ROOT,
    ADD_SIBLING_SEG, // without changing group
    ADD_SEG_UNDER_ANCESTOR,
    ADD_UNCLE_SEG,
    NEW_ROOT_GROUP,
    NEW_SIBLING_GROUP, // sibling group of current segment
    NEW_UNCLE_GROUP, // my parent level group
    NEW_GROUP_UNDER_ANCESTOR // back track to an ancestor(opData2), then add group under it.
}

export enum ASTNodeType {
    Group, // ROOT is a special type
    Segment,
}