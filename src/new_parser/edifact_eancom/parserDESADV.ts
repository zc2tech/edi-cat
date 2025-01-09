import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";

import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_DESADV } from "../../info_eancom/info_DESADV";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserDESADV extends SyntaxParserBase {
    private static _instance:ParserDESADV;
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.D01B_DESADV;
        this.docInfo = new Info_DESADV();
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
            "ALI": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "MEA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "ALI": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "MEA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_ALI"] = {
            "ALI": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "MEA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_DTM"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG2_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG4"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG2_SG3_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG3"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG4"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG2_SG4_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG4"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG2_SG4_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG4"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG5_TOD"] = {
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
      
        dfa["ROOT_SG6_TDT"] = {
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "LOC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG7"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG6_SG7_LOC"] = {
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG7"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG6_SG7_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG7"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG8_EQD"] = {
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SEL": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG8_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SEL": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG8_SEL"] = {
            "SEL": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_CPS"] = {
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG11"),
            "LIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG17"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG11"),
            "LIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG17"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG11_PAC"] = {
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG11"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG13"),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG17"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG11_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG11"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG13"),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG17"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG11_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG11"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG13"),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG17"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG11_SG13_PCI"] = {
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG13"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG11","SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "GIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG17","SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG11_SG13_SG15_GIN"] = {
            "GIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG15"),
            "PCI": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG13","SG11"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG11","SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG17","SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG17_LIN"] = {
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG17"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG18"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG22"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG17_PIA"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG17"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG18"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG22"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG17_IMD"] = {
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG17"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG18"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG22"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG17_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG17"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG18"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG22"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG17_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG17"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG18"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG22"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
      
        dfa["ROOT_SG10_SG17_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG17"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG18"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG22"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG17_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG17"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG18"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG22"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG17_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG17"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG18"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG22"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG17_SG18_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG17","SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG22"),
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG17_SG18_DTM"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG18"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG17","SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG22"),
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG17_SG22_PCI"] = {
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG17","SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "GIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG23"),
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG17_SG22_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG17","SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "GIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG23"),
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG17_SG22_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG17","SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "GIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG23"),
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG17_SG22_QTY"] = {
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG17","SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "GIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG23"),
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG25"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG17_SG22_SG23_GIN"] = {
            "GIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG23"),
            "PCI": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG22","SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG17","SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
            "QVR": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG25","SG17"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG17_SG25_QVR"] = {
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG25"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG17","SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG10"),
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