import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_866 } from "../../info/info_866";
import { ConvertPattern } from "../../cat_const";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class Parser866 extends SyntaxParserBase {
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = constants.versionKeys.X12_866;
        this.docInfo = new Info_866();
    }

    private _initDFA() {
        let dfa: { [status: string]: { [key: string]: ASTOp } } = {};

        dfa["ROOT"] = {
            "ISA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_ISA"] = {
            "GS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "ST": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_GS"] = {
            "ST": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_ST"] = {
            "BSS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_BSS"] = {
            "DTM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"DTM"),
        }
        dfa["ROOT_DTM_DTM"] = {
            "DTM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"DTM"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"LIN"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_DTM_REF"] = {
            "DTM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"DTM"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"LIN"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_DTM_LIN_LIN"] = {
            "DTM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"DTM"),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"LIN"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SLN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_DTM_LIN_REF"] = {
            "DTM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"DTM"),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"LIN"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SLN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_DTM_LIN_QTY"] = {
            "DTM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"DTM"),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"LIN"),
            "PID": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SLN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_DTM_LIN_PID"] = {
            "DTM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"DTM"),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"LIN"),
            "SLN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_DTM_LIN_SLN_SLN"] = {
            "DTM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"DTM"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"LIN","DTM"),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"PID"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_DTM_LIN_SLN_PID_PID"] = {
            "DTM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"DTM"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"LIN","DTM"),
            "SLN":  new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SLN","LIN"),
            "PID": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"PID"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_CTT"] = {
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        
        dfa["ROOT_SE"] = {
            "GE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_GE"] = {
            "IEA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        return dfa;

    }
    public convert(pattern: ConvertPattern): string {
        throw new Error("Method not implemented yet for this type of document.  ");
    }   

    public convertCheck(document: vscode.TextDocument): vscode.Diagnostic[] {
        if (this._diags.length > 0) {
            // assume parse function is invoked before this 
            // there are other basic diagnostic errors
            return [];
        }

        // let cvt = new CvtINVOIC(this._astTree);
        // return cvt.toXMLCheck(document);
        return [];
    }    
}