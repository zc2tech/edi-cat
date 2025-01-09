import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_861_In } from "../../info/info_861_In";
import { ConvertPattern } from "../../cat_const";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class Parser861In extends SyntaxParserBase {
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = constants.versionKeys.X12_861_In;
        this.docInfo = new Info_861_In();
    }

    private _initDFA() {
        let dfa: { [status: string]: { [key: string]: ASTOp } } = {};

        dfa["ROOT"] = {
            "ISA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_ISA"] = {
            "GS": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "ST": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_GS"] = {
            "ST": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_ST"] = {
            "BRA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_BRA"] = {
            "CUR": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_CUR"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_REF"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RCD_RCD"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "CUR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "LIN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MAN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
      
        dfa["ROOT_RCD_CUR"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "LIN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MAN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RCD_LIN"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "LIN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MAN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RCD_PID"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "PID": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MAN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RCD_REF"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MAN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RCD_DTM"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MAN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RCD_MAN"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "MAN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RCD_N1_N1"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RCD_N1_N2"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RCD_N1_N3"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RCD_N1_N4"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RCD_N1_REF"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_RCD_N1_PER"] = {
            "RCD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"RCD"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_CTT"] = {
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
      
        dfa["ROOT_SE"] = {
            "GE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_GE"] = {
            "IEA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
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