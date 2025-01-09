import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";

import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_ORDERS } from "../../info_eancom/info_ORDERS";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserORDERS extends SyntaxParserBase {
    private static _instance: ParserORDERS;
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.D01B_ORDERS;
        this.docInfo = new Info_ORDERS();
    }

    private _initDFA() {
        const dfa: { [status: string]: { [key: string]: ASTOp } } = {};

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
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            // "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            // "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            // "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            // "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            // "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            // "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            // "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            // "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            // "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            // "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            // "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            // "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            // "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            // "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }

        dfa["ROOT_SG1_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            // "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            // "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            // "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            // "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            // "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            // "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            // "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG1_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            // "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            // "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            // "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            // "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            // "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            // "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            // "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG2_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            // "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        // dfa["ROOT_SG2_LOC"] = {
        //     "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
        //     "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG3"),
        //     "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG5"),
        //     "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
        //     "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
        //     "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
        //     "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
        //     "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
        //     // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
        //     "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        // }
        dfa["ROOT_SG2_SG3_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG3"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG2_SG5_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG5"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG2_SG5_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG5"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG6_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG6_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG7_CUX"] = {
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG8_PAT"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PCD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG8_PCD"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG8_SG9_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG9"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG10_TDT"] = {
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG12_TOD"] = {
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        // dfa["ROOT_SG15_SCC"] = {
        //     "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
        //     "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        // }

        dfa["ROOT_SG19_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG21"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG19_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG21"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG19_SG21_PCD"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG19_SG22_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG22"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        }
        dfa["ROOT_SG28_LIN"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_PIA"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_IMD"] = {
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            // "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        // dfa["ROOT_SG28_ALI"] = {
        //     "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
        //     "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
        //     "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
        //     "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
        //     "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
        //     "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
        //     "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
        //     "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
        //     "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
        //     "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        dfa["ROOT_SG28_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            // "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        // dfa["ROOT_SG28_SG26_CCI"] = {
        //     "CCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG26"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
        //     "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
        //     "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
        //     "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
        //     "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
        //     "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
        //     "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
        //     "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        dfa["ROOT_SG28_SG36_PRI"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            // "APR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "RNG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        // dfa["ROOT_SG28_SG28_APR"] = {
        //     "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "RNG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
        //     "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
        //     "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
        //     "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
        //     "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
        //     "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
        //     // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        // dfa["ROOT_SG28_SG28_RNG"] = {
        //     "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
        //     "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
        //     "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
        //     "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
        //     "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
        //     "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
        //     // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        dfa["ROOT_SG28_SG33_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_SG33_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_SG34_PAC"] = {
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            // "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            // "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        // dfa["ROOT_SG28_SG34_MEA"] = {
        //     "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
        //     "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
        //     "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
        //     "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
        //     "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
        //     "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
        //     // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        // dfa["ROOT_SG28_SG34_QTY"] = {
        //     "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
        //     "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
        //     "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
        //     "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
        //     "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
        //     "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
        //     // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        // dfa["ROOT_SG28_SG34_DTM"] = {
        //     "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
        //     "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
        //     "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
        //     "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
        //     "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
        //     "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
        //     // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        // dfa["ROOT_SG28_SG34_SG31_RFF"] = {
        //     "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG31"),
        //     "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG34", "SG28"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
        //     "TAX": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG28"),
        //     "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG28"),
        //     "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG28"),
        //     "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
        //     // "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG28"),
        //     // "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        dfa["ROOT_SG28_SG34_SG36_PCI"] = {
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG34", "SG28"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "GIN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG28"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG28"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG28"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            // "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG28"),
            // "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_SG34_SG36_GIN"] = {
            "GIN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG34", "SG28"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "TAX": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG28"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG28"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG28"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            // "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG28"),
            // "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_SG38_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_SG38_MOA"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_SG39_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            // "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG42"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        // dfa["ROOT_SG28_SG39_SG36_RFF"] = {
        //     "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
        //     "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG28"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "CTA": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG39"),
        //     "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG28"),
        //     "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
        //     // "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG28"),
        //     // "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        dfa["ROOT_SG28_SG39_SG42_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG28"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG28"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            // "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG28"),
            // "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_SG39_SG42_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG42"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG28"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG28"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            // "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG28"),
            // "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_SG43_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG45"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG46"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            // "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG28"),
            // "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_SG43_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG45"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG46"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            // "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG28"),
            // "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_SG43_SG45_PCD"] = {
            "PCD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG28"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG46"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            // "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG28"),
            // "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_SG43_SG46_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG46"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG43", "SG28"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            // "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG28"),
            // "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG28_SG49_TDT"] = {
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
            // "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            // "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        // dfa["ROOT_SG28_SG47_TOD"] = {
        //     "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        // dfa["ROOT_SG28_SG49_SCC"] = {
        //     "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "RFF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG50"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        // dfa["ROOT_SG28_SG49_RFF"] = {
        //     "RFF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG50"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        // dfa["ROOT_SG28_SG49_SG50_QTY"] = {
        //     "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG50"),
        //     "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }
        // dfa["ROOT_SG28_SG49_SG50_DTM"] = {
        //     "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        //     "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG50"),
        //     "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG28"),
        //     "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG28"),
        //     "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        // }

        dfa["ROOT_UNS"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
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