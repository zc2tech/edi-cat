import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";

import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_ORDERS } from "../../info/info_ORDERS";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserORDERS extends SyntaxParserBase {
    private static _instance: ParserORDERS;
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.EDIFACT_ORDERS;
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
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }

        dfa["ROOT_SG1_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG1_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG2_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG2_LOC"] = {
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG2_SG3_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG3"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG2_SG5_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG5"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG2_SG5_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG5"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG6_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG6_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG7_CUX"] = {
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG8_PAT"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PCD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG8_PCD"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG8_MOA"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG9_TDT"] = {
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG9"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG11_TOD"] = {
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG11"),
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "LOC": new ASTOp(ASTOpType.NOP), // for compatibility with CIG
        }
        dfa["ROOT_SG15_SCC"] = {
            "SCC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }

        dfa["ROOT_SG18_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG20"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG21"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG18_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG20"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG21"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG18_SG20_PCD"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG21"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG18_SG21_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG21"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
        }
        dfa["ROOT_SG25_LIN"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        }
        dfa["ROOT_SG25_PIA"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        }
        dfa["ROOT_SG25_IMD"] = {
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        }
        dfa["ROOT_SG25_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),          
        }
        dfa["ROOT_SG25_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG28"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG29"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG30"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_ALI"] = {
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG28"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG29"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG30"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG28"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG29"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG30"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG28"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG29"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG30"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG28"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG29"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG30"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG26_CCI"] = {
            "CCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG28"),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG29"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG28_PRI"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG28"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "APR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RNG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG29"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG28_APR"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG28"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "RNG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG29"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG28_RNG"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG28"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG29"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG29_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG29"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG29_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG29"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG30_PAC"] = {
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG30_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG30_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG30_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG31"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG30_SG31_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG31"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG30", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG34", "SG25"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG35", "SG25"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG25"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG45", "SG25"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG25"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG30_SG32_PCI"] = {
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG30", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "GIN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG34", "SG25"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG35", "SG25"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG25"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG45", "SG25"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG25"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG30_SG32_GIN"] = {
            "GIN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG30", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "TAX": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG34", "SG25"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG35", "SG25"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG25"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG45", "SG25"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG25"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG34_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG34_MOA"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG35_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG38"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG35_SG36_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG35", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "CTA": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG25"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG45", "SG25"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG25"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG35_SG38_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG35", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG25"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG45", "SG25"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG25"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG35_SG38_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG35", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG25"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG45", "SG25"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG25"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG39_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG41"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG42"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG45", "SG25"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG25"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG39_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG39"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG41"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG42"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG45", "SG25"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG25"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG39_SG41_PCD"] = {
            "PCD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG42"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG45", "SG25"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG25"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG39_SG42_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG42"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG39", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "TDT": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG45", "SG25"),
            "TOD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG47", "SG25"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG45_TDT"] = {
            "TDT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG45"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG47_TOD"] = {
            "TOD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG47"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "LOC": new ASTOp(ASTOpType.NOP), // for compatibility with CIG
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG49_SCC"] = {
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "RFF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG50"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG49_RFF"] = {
            "RFF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG49"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG50"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG49_SG50_QTY"] = {
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG50"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG49_SG50_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG50"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG49", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
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