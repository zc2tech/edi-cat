import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_997_Out } from "../../info/info_997_Out";
import { ConvertPattern } from "../../cat_const";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class Parser997Out extends SyntaxParserBase {
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = constants.versionKeys.X12_997_Out;
        this.docInfo = new Info_997_Out();
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
            "AK1": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_AK1"] = {
            "AK2": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"AK2"),
            "AK9": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_AK2_AK2"] = {
            "AK2": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"AK2"),
            "AK3": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"AK3"),
            "AK5": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
           // "AK9": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_AK2_AK3_AK3"] = {
            "AK2": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"AK2"),
            "AK3": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"AK3"),
            "AK4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "AK5": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
           // "AK9": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_AK2_AK3_AK4"] = {
            "AK2": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"AK2"),
            "AK3": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"AK3"),
            "AK4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "AK5": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
           // "AK9": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_AK2_AK5"] = {
            "AK2": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"AK2"),
            "AK9": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_AK9"] = {
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