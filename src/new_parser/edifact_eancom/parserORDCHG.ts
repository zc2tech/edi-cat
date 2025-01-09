import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";

import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_ORDCHG } from "../../info_eancom/info_ORDCHG";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserORDCHG extends SyntaxParserBase {
    private static _instance: ParserORDCHG;
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.D01B_ORDCHG;
        this.docInfo = new Info_ORDCHG();
    }

    private _initDFA() {
        let dfa: { [status: string]: { [key: string]: ASTOp } } = {};

        dfa["ROOT"] = {
            "UNA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_UNA"] = {
            "UNB": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_UNB"] = {
            "UNH": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_UNH"] = {
            "BGM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_BGM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            // "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            // "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            // "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            // "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            // "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),       
            // "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            // "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            // "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            // "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            // "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            // "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            // "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),         
            // "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            // "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }

        dfa["ROOT_SG1_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            // "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            // "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            // "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            // "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            // "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            // "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            // "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG1_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            // "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            // "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            // "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            // "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            // "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            // "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            // "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG3_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG4"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG6"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG3_LOC"] = {
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG4"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG6"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG3_SG4_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG4"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG6"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG3_SG6_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG6"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG3_SG6_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG6"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG7_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG7_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG8_CUX"] = {
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG9_PAT"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "PCD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG10"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG9_PCD"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG10"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG9_SG10_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG10"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG11_TDT"] = {
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG13_TOD"] = {
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG13"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }

        dfa["ROOT_SG20_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG22"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG23"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG20_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG22"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG23"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG20_SG22_PCD"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG23"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG20_SG23_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG23"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        }
        dfa["ROOT_SG27_LIN"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_PIA"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_IMD"] = {
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
       
        dfa["ROOT_SG27_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
      
        dfa["ROOT_SG27_SG32_PRI"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            // "APR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "RNG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        // dfa["ROOT_SG27_SG32_APR"] = {
        //     "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        //     "RNG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
        //     "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
        //     "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
        //     "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
        //     "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
        //     "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     
            
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        // dfa["ROOT_SG27_SG32_RNG"] = {
        //     "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
        //     "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
        //     "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
        //     "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
        //     "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
        //     "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
        //     "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     
            
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        dfa["ROOT_SG27_SG33_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_SG33_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_SG34_PAC"] = {
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),            
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }    
        dfa["ROOT_SG27_SG34_SG36_PCI"] = {
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG34", "SG27"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "GIN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG27"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG27"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG27"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG27"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_SG34_SG36_GIN"] = {
            "GIN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG34", "SG27"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "TAX": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG27"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG27"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG27"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG27"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_SG38_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_SG38_MOA"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_SG39_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG42"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
      
        dfa["ROOT_SG27_SG39_SG42_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG42"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG27"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG27"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG27"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_SG39_SG42_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG42"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG27"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG27"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG27"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_SG43_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG45"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG46"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG27"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_SG43_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG45"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG46"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG27"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_SG43_SG45_PCD"] = {
            "PCD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG27"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG46"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG27"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_SG43_SG46_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG46"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG27"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG27"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG27_SG49_TDT"] = {
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG27"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
       
        dfa["ROOT_UNS"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_MOA"] = {
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_CNT"] = {
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_UNT"] = {
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
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