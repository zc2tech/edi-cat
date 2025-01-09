import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_862 } from "../../info/info_862";
import { ConvertPattern } from "../../cat_const";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class Parser862 extends SyntaxParserBase {
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = constants.versionKeys.X12_862;
        this.docInfo = new Info_862();
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
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
        }
        dfa["ROOT_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
        }
        dfa["ROOT_N1_N1"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FOB": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
        }
        dfa["ROOT_N1_N2"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FOB": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
        }
        dfa["ROOT_N1_N3"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FOB": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
        }
        dfa["ROOT_N1_N4"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FOB": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
        }
        
        dfa["ROOT_N1_REF"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FOB": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
        }
        dfa["ROOT_N1_PER"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FOB": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
        }
        dfa["ROOT_N1_FOB"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
        }
        dfa["ROOT_LIN_LIN"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
            "UIT": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PKG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FST": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"FST"),
            "SHP": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SHP"),
            "TD5": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_UIT"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
            "PKG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FST": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"FST"),
            "SHP": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SHP"),
            "TD5": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_PKG"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
            "PKG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FST": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"FST"),
            "SHP": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SHP"),
            "TD5": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_QTY"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FST": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"FST"),
            "SHP": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SHP"),
            "TD5": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_REF"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FST": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"FST"),
            "SHP": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SHP"),
            "TD5": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_PER"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
            "FST": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"FST"),
            "SHP": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SHP"),
            "TD5": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_FST_FST"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
            "FST": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"FST"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SDQ": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "JIT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"JIT"),
            "SHP": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SHP"),
            "TD5": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_FST_DTM"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
            "FST": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"FST"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SDQ": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "JIT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"JIT"),
            "SHP": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SHP"),
            "TD5": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_FST_SDQ"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
            "FST": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"FST"),
            "SDQ": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "JIT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"JIT"),
            "SHP": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SHP"),
            "TD5": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_FST_JIT_JIT"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
            "FST": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"FST","LIN"),
            "JIT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"JIT"),
            "SHP": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SHP","LIN"),
            "TD5": new ASTOp(ASTOpType.ADD_SEG_UNDER_ANCESTOR,"","LIN"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_SHP_SHP"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
            "SHP": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SHP"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TD5": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_SHP_REF"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
            "SHP": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SHP"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TD5": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_LIN_TD5"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"LIN"),
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