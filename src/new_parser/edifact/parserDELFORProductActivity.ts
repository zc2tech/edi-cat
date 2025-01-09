import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_DELFOR_ProductActivity } from "../../info/info_DELFOR_ProductActivity";

/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserDELFORProductActivity extends SyntaxParserBase {

    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.EDIFACT_DELFOR_ProductActivity;
        this.docInfo = new Info_DELFOR_ProductActivity();
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
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG2"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG1_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG2"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG2_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG2"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG3"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG2_SG3_CTA"] = {
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG2", "ROOT"),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG3"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_SG2_SG3_COM"] = {
            "NAD": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG2", "ROOT"),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG3"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_UNS"] = {
            "NAD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG4"), // for first ROOT_UNS
            // for last ROOT_UNS
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_NAD"] = {
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG6"),
            "LIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG8"),
        }
        dfa["ROOT_SG4_LOC"] = {
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG6"),
            "LIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG8"),
        }
        dfa["ROOT_SG4_SG6_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG6"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG8"),
        }
        dfa["ROOT_SG4_SG6_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG6"),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG8"),
        }
        dfa["ROOT_SG4_SG8_LIN"] = {
            "LIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG8"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG4"),
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG10"),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG12"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_SG8_PIA"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG8"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG4"),
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG10"),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG12"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_SG8_IMD"] = {
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG8"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG4"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG10"),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG12"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_SG8_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG8"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG4"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG10"),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG12"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_SG8_SG10_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG10"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG8", "SG4"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG4"),
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG12"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_SG8_SG12_QTY"] = {
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG12"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG8", "SG4"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG4"),
            "SCC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG13"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_SG8_SG12_SCC"] = {
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG12"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG8", "SG4"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG4"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG13"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_SG8_SG12_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG12"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG8", "SG4"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG4"),
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP, "SG13"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SG4_SG8_SG12_SG13_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP, "SG13"),
            "QTY": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG12", "SG8"),
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR, "SG8", "SG4"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP, "SG4"),
            "UNS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "UNZ": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
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