import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";

import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_INVOIC } from "../../info/info_INVOIC";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserINVOIC extends SyntaxParserBase {
    private static _instance: ParserINVOIC;
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.EDIFACT_INVOIC;
        this.docInfo = new Info_INVOIC();
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
            "PAI": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PAI"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG2_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FII": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG2_LOC"] = {
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "FII": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG2_FII"] = {
            "FII": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG2_SG3_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG3"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG2_SG3_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG3"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG2_SG5_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG5"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG2_SG5_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG5"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG6_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG7_CUX"] = {
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG8_PAT"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG8_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "PCD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG8_PCD"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG8_MOA"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG12_TOD"] = {
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG15_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG16"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG18"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG19"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG21"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG15_SG16_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG18"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG19"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG21"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG15_SG16_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG16"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "PCD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG18"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG19"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG21"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG15_SG18_PCD"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG19"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG21"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG15_SG19_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG19"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG21"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG15_SG21_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG21"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG15_SG21_MOA"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG21"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG25_LIN"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_PIA"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG25_IMD"] = {
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_ALI"] = {
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG28"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG26_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG28"),
            // TODO: is SG25_SG28_PRI mandatory?, is so, remove below line
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG29"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG28_PRI"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG28"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "APR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RNG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG29"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG28_APR"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG28"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "RNG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG29"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG28_RNG"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG28"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG29"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG29_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG29"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG29_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG29"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG30_PAC"] = {
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG30_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG25_SG32_LOC"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG33_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG33_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG33_LOC"] = {
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG33"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG34_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG34"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG35"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG34_SG35_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG34", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG34_SG35_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG35"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG34", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG34_SG37_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG34", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG34_SG37_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG37"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG34", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG38_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG40"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG41"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG38_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG38"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG40"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG41"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG43"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG38_SG40_PCD"] = {
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG38_SG41_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG41"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG38_SG43_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG25_SG38_SG43_MOA"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG43"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG38", "SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG25"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_UNS"] = {
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "MOA": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG48"),
        }
        dfa["ROOT_CNT"] = {
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "MOA": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG48"),
        }
        dfa["ROOT_SG48_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG48"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG49"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG50"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG51"),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG48_SG49_RFF"] = {
            "MOA": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG48"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG50"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG51"),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG50_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG50"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG51"),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG50_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG50"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG51"),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG51_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG51"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG51_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG51"),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_UNT"] = {
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        return dfa;

    }

    public convert(pattern: ConvertPattern): string {
        return '';
    }

    public convertCheck(document: vscode.TextDocument): vscode.Diagnostic[] {
        if (this._diags.length > 0) {
            // assume parse function is invoked before this 
            // there are other basic diagnostic errors
            return [];
        }

    }
}