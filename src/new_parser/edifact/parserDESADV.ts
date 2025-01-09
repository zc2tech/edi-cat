import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";

import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_DESADV } from "../../info/info_DESADV";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserDESADV extends SyntaxParserBase {
    private static _instance: ParserDESADV;
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.EDIFACT_DESADV;
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
            "MEA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "MEA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_DTM"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG2_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG4"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG2_SG3_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG3"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG4"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG2_SG4_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG4"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG2_SG4_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG4"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG2"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG5_TOD"] = {
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG5"),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG5_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG5"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG6_TDT"] = {
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "LOC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG7"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG6_SG7_LOC"] = {
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG7"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG6_SG7_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG7"),
            "TDT": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG6"),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG8_EQD"] = {
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SEL": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG8_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "SEL": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG8_SEL"] = {
            "SEL": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "EQD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG8"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_CPS"] = {
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG11"),
            "LIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG15"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG11"),
            "LIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG15"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG11_PAC"] = {
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG11"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG13"),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG15"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG11_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG11"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG13"),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG15"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG11_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG11"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG13"),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG15"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG11_SG13_PCI"] = {
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG13"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG11", "SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "GIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG14"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG15", "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG11_SG13_SG14_GIN"] = {
            "GIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG14"),
            "PCI": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG13", "SG11"),
            "PAC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG11", "SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG15", "SG10"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_LIN"] = {
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG15"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "GIR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG16"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG20"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG15_PIA"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG15"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "GIR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG16"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG20"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_IMD"] = {
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG15"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "GIR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG16"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG20"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG15"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "GIR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG16"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG20"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG15"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "GIR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG16"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG20"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_GIR"] = {
            "GIR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG15"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG16"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG20"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG15"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG16"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG20"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG15"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG16"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG20"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG15"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG16"),
            "PCI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG20"),
            "QVR": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG15_SG16_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG15", "SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG20"),
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG15_SG16_DTM"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG15", "SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG20"),
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_SG20_PCI"] = {
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG15", "SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "GIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG21"),
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_SG20_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG15", "SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "GIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG21"),
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG10_SG15_SG20_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG15", "SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "GIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG21"),
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_SG20_QTY"] = {
            "PCI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG20"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG15", "SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "GIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG21"),
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG23"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_SG20_SG21_GIN"] = {
            "GIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG21"),
            "PCI": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG20", "SG15"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG15", "SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
            "QVR": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG23", "SG15"),
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG10_SG15_SG23_QVR"] = {
            "QVR": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG23"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG15", "SG10"),
            "CPS": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG10"),
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
        return undefined;
    }

    public convertCheck(document: vscode.TextDocument): vscode.Diagnostic[] {
        return undefined;
    }
}