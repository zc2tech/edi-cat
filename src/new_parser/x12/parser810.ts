import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter, ConvertErr } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_810 } from "../../info/info_810";
import { ConvertPattern, X12, XML, versionKeys } from "../../cat_const";
import { create } from "xmlbuilder2";
import { format } from "date-fns";
import { CUtilX12 } from "../../utils/cUtilX12";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class Parser810 extends SyntaxParserBase {
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.X12_810;
        this.docInfo = new Info_810();
    }

    private _initDFA() {
        const dfa: { [status: string]: { [key: string]: ASTOp } } = {};

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
            "BIG": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_BIG"] = {
            "NTE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "CUR": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N1"),
            "ITD": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N9"),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_NTE"] = {
            "NTE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "CUR": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N1"),
            "ITD": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N9"),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_CUR"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N1"),
            "ITD": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N9"),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_REF"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N1"),
            "ITD": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N9"),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_N1"] = {
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ITD": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N9"),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_N2"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ITD": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N9"),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_N3"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N1"),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ITD": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N9"),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_N4"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ITD": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N9"),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_REF"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ITD": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N9"),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N1_PER"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N1"),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ITD": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N9"),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_ITD"] = {
            "ITD": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N9"),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "N9"),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N9_N9"] = {
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_N9_MSG"] = {
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_IT1"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "CUR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTP": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "YNQ": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SAC"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "N1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_CUR"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "CTP": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "YNQ": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SAC"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "N1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_CTP"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "CTP": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "YNQ": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SAC"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "N1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_PAM"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "PAM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "YNQ": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SAC"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "N1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_PID_PID"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "PID": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "PID"),
            "REF": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "YNQ": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SAC"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_REF"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "YNQ": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SAC"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "N1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_YNQ"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "YNQ": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SAC"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "N1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_DTM"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SAC"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "N1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_SAC_SAC"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "SAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SAC"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_SAC_TXI"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "SAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SAC"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_N1_N1"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_N1_N2"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_N1_N3"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_N1_N4"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_N1_REF"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_IT1_N1_PER"] = {
            "IT1": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "IT1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "N1"),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TDS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_TDS"] = {
            "AMT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SAC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SAC"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_AMT"] = {
            "AMT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SAC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SAC"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SAC_SAC"] = {
            "SAC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SAC"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),

        }
        dfa["ROOT_SAC_TXI"] = {
            "SAC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SAC"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
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
        return undefined;
    }

    public convertCheck(document:vscode.TextDocument):vscode.Diagnostic[] {
        return [];
    }
}