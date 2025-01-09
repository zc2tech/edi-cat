import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";

import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_ORDCHG } from "../../info/info_ORDCHG";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserORDCHG extends SyntaxParserBase {
    private static _instance: ParserORDCHG;
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.EDIFACT_ORDCHG;
        this.docInfo = new Info_ORDCHG();
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
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            // "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            // "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            // "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            // "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            // "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            // "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            // "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            // "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            // "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            // "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            // "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            // "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            // "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            // "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }

        dfa["ROOT_SG1_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            // "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            // "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            // "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            // "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            // "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            // "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            // "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG1_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            // "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            // "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            // "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            // "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            // "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            // "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            // "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            // "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG3_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG4"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG6"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG3_LOC"] = {
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG4"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG6"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG3_SG4_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG4"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG6"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG3_SG6_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG6"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG3_SG6_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG6"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG3"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG7_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG7_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG8_CUX"] = {
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG9_PAT"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "PCD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG9_PCD"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG9_MOA"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG10_TDT"] = {
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG12_TOD"] = {
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "LOC": new ASTOp(ASTOpType.NOP), // for compatibility with CIG
        }
        dfa["ROOT_SG16_SCC"] = {
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }

        dfa["ROOT_SG19_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG21"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG19_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG21"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG19_SG21_PCD"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG19_SG22_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG22"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
        }
        dfa["ROOT_SG26_LIN"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),           
        }
        dfa["ROOT_SG26_PIA"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),          
        }
        dfa["ROOT_SG26_IMD"] = {
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),           
        }
        dfa["ROOT_SG26_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),        
        }
        dfa["ROOT_SG26_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_ALI"] = {
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG27_CCI"] = {
            "CCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG27"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG31"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG30_PRI"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "APR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RNG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG31"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG30_APR"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "RNG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG31"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG30_RNG"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG31"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG31_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG31"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG31_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG31"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG32_PAC"] = {
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG32_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG32_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG32_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG33"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG32_SG33_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG32", "SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "TAX": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG36", "SG26"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG37", "SG26"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG41", "SG26"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG26"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG51", "SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG32_SG34_PCI"] = {
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG32", "SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "GIN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG36", "SG26"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG37", "SG26"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG41", "SG26"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG26"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG51", "SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG32_SG34_GIN"] = {
            "GIN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG32", "SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "TAX": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG36", "SG26"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG37", "SG26"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG41", "SG26"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG26"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG51", "SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG36_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG36_MOA"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG36"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG37_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG40"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG37_SG38_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG37", "SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "CTA": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG40", "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG41", "SG26"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG26"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG51", "SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG37_SG40_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG40"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG37", "SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG41", "SG26"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG26"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG51", "SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG37_SG40_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG40"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG37", "SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG41", "SG26"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG26"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG51", "SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG41_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG44"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG26"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG51", "SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG41_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG44"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG26"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG51", "SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG41_SG43_PCD"] = {
            "PCD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG41", "SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG44"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG26"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG51", "SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG41_SG44_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG44"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG41", "SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG26"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG51", "SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG47_TDT"] = {
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG49_TOD"] = {
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "LOC": new ASTOp(ASTOpType.NOP), // for compatibility with CIG
        }
        dfa["ROOT_SG26_SG51_SCC"] = {
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "RFF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG52"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG51_RFF"] = {
            "RFF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG51"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG52"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG51_SG52_QTY"] = {
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG52"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG51", "SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG51_SG52_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG52"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG51", "SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_UNS"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
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