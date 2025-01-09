import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";

import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_ORDRSP } from "../../info/info_ORDRSP";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserORDRSP extends SyntaxParserBase {
    private static _instance:ParserORDRSP;
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.EDIFACT_ORDRSP;
        this.docInfo = new Info_ORDRSP();
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
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG3_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG6"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG3_SG6_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG6"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG3_SG6_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG6"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG7_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG7_MOA"] = {
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG12_TOD"] = {
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG19_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG21"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG19_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG21"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        
        dfa["ROOT_SG19_SG21_PCD"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG19_SG22_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG22"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG19"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_LIN"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_PIA"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_IMD"] = {
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "CCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG27_CCI"] = {
            "CCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG27"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG30"),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG30_PRI"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "CUX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG30_CUX"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_SG31_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG31"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_SG36_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG36"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG36_MOA"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG36"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_SG37_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG37"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG40"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG41"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG37_SG40_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG40"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG37","SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG41","SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG51","SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG37_SG40_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG40"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG37","SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG41","SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG51","SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_SG41_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG41"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG43"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG44"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_SG41_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG41"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG43"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG44"),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG51"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_SG41_SG43_PCD"] = {
            "PCD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG43"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG41","SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG44"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG51","SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG41_SG44_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG44"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG41","SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG51","SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG51_SCC"] = {
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG51"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG52"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_SG51_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG51"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "RFF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG52"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG51_RFF"] = {
            "SCC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG51"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG52"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_SG51_SG52_QTY"] = {
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG52"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG51","SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_SG51_SG52_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG52"),
            "SCC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG51","SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_UNS"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        
        dfa["ROOT_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        
        dfa["ROOT_UNT"] = {
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
    
        return dfa;

    }
    public convert(pattern: ConvertPattern): string {
        return undefined;
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