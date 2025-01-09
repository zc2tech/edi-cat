import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";

import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_REMADV } from "../../info/info_REMADV";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserREMADV extends SyntaxParserBase {
    private static _instance:ParserREMADV;
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.EDIFACT_REMADV;
        this.docInfo = new Info_REMADV();
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
            "RFF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "FII": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "PAI": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RFF"] = {
            "RFF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "FII": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "PAI": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_FII"] = {
            "FII": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "PAI": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PAI"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG2"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_SG2_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG2"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG1_SG2_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG2"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG3_CUX"] = {
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG4_DOC"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CUX": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG3"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_MOA"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "AJT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG6"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "RFF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "AJT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG6"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_RFF"] = {
            "RFF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "AJT": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG6"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_SG6_AJT"] = {
            "AJT": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG6"),
            "DOC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_UNS"] = {
            "MOA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
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