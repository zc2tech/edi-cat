import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";

import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_INVOIC } from "../../info_eancom/info_INVOIC";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserINVOIC extends SyntaxParserBase {
    private static _instance:ParserINVOIC;
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.D01B_INVOIC;
        this.docInfo = new Info_INVOIC();
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
            "PAI": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PAI"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG2_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "FII": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
       
        dfa["ROOT_SG2_FII"] = {
            "FII": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG3"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG2_SG3_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG3"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG5"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
   
        dfa["ROOT_SG2_SG5_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG5"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG2_SG5_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG5"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG6_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG6"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG7_CUX"] = {
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG7"),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG8_PAT"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PCD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG8_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "PCD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG8_PCD"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG8_MOA"] = {
            "PAT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG8"),
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG12_TOD"] = {
            "TOD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG12"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG16_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG19"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG20"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
       
        dfa["ROOT_SG16_SG19_PCD"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG20"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG22"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG16_SG20_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG20"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG22"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG16_SG22_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG22"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG16_SG22_MOA"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG22"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG16"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_LIN"] = {
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG29"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG39"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_PIA"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG29"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG39"),            
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_IMD"] = {
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG29"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG39"),            
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG29"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG39"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_ALI"] = {
            "ALI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG29"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG39"),            
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG29"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG39"),            
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG27"),
            "PRI": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG29"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG30"),
            "PAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG39"),            
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG27_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG27"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG29"),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG30"),     
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG39"),                           
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG29_PRI"] = {
            "PRI": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG29"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG30"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG31"),
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG32"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG39"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_SG30_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG39"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG30_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG30"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG31"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG39"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG31_PAC"] = {
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG31"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG39"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG31_MEA"] = {
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG31"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG34"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG39"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_SG34_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG34"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG39"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG34_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG34"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG35"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG39"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
      
        dfa["ROOT_SG26_SG35_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG35"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG36"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG37"),
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG39"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG35_SG36_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG36"),
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG35","SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG39","SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG26_SG39_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG39"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "PCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG41"),
            "MOA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG42"),
            "TAX": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG44"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG39_SG41_PCD"] = {
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG39","SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG42"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG44"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG39_SG42_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG42"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG39","SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG44"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG39_SG44_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG44"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG39","SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG26_SG39_SG44_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG44"),
            "ALC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG39","SG26"),
            "LIN": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG26"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_UNS"] = {
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "MOA": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG50"),
        }
        dfa["ROOT_CNT"] = {
            "CNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "MOA": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG50"),
        }
        dfa["ROOT_SG50_MOA"] = {
            "MOA": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG50"),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG52"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG53"),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG52_TAX"] = {
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG52"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG53"),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG52_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TAX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG52"),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG53"),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG53_ALC"] = {
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG53"),
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG53_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ALC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG53"),
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