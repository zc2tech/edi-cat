import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_846_MOPO } from "../../info/info_846_MOPO";
import { ConvertPattern } from "../../cat_const";

/**
 * No need to make singleton because parserUtil already assured it
 */
export class Parser846MOPO extends SyntaxParserBase {
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = constants.versionKeys.X12_846_MOPO;
        this.docInfo = new Info_846_MOPO();
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
            "BIA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_BIA"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
        }
        dfa["ROOT_REF"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
        }

        dfa["ROOT_LIN_LIN"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "PID": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LDT": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "QTY"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_PID"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "PID": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LDT": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "QTY"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_MEA"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LDT": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "QTY"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_REF"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LDT": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "QTY"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_LIN_LDT"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "LDT": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "QTY"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_LIN_QTY_QTY"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "QTY"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LS": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "REF"),
            "LE": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_LIN_QTY_DTM"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "QTY"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LS": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "REF"),
            "LE": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_QTY_LS"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "QTY"),
            "REF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "REF"),
            "LE": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_QTY_REF_REF"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "QTY": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "QTY", "LIN"),
            "REF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "REF"),
            "DTM": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "LE": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "N1": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "N1", "LIN"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_QTY_REF_DTM"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "QTY": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "QTY", "LIN"),
            "REF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "REF"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LE": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "N1": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "N1", "LIN"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_QTY_LE"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "QTY"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_N1_N1"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_N1_N2"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_N1_N3"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_N1_N4"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_N1_REF"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_N1_PER"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "LIN"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
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