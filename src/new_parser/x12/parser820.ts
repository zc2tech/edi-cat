import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_820 } from "../../info/info_820";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class Parser820 extends SyntaxParserBase {
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = constants.versionKeys.X12_820;
        this.docInfo = new Info_820();
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
            "BPR": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_BPR"] = {
            "NTE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "TRN": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "CUR": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_NTE"] = {
            "TRN": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "CUR": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_TRN"] = {
            "CUR": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_CUR"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_REF"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_N1"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_N2"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_N3"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_N4"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_REF"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_PER"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_DTM"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
       
        dfa["ROOT_ENT_ENT"] = {
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "RMR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"RMR"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_ENT_RMR_RMR"] = {
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "RMR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"RMR"),
            "NTE": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ADX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ADX"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_ENT_RMR_NTE"] = {
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "RMR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"RMR"),
            "NTE": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ADX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ADX"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_ENT_RMR_REF"] = {
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "RMR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"RMR"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ADX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ADX"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_ENT_RMR_DTM"] = {
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "RMR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"RMR"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ADX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ADX"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_ENT_RMR_ADX_ADX"] = {
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "RMR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"RMR"),
            "ADX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"ADX"),
            "NTE": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_ENT_RMR_ADX_NTE"] = {
            "ENT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"ENT"),
            "RMR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"RMR"),
            "ADX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"ADX"),
            "NTE": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
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

    public convert(pattern: constants.ConvertPattern): string {
        throw new Error("Method not implemented yet for this type of document.  ");
    }
    
    public convertCheck(document:vscode.TextDocument):vscode.Diagnostic[] {
        return [];
    }
}