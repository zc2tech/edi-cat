import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_CONTRL_Out } from "../../info/info_CONTRL_Out";

/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserCONTRLOut extends SyntaxParserBase {

    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.EDIFACT_CONTRL_Out;
         this.docInfo = new Info_CONTRL_Out();
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
            "UCI": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_UCI"] = {
            "UCM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        },
        dfa["ROOT_SG1_UCM"] = {
            "UCM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "UCS": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG2"),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        },
        dfa["ROOT_SG1_SG2_UCS"] = {
            "UCM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "UCS": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG2"),
            "UCD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        },
     
        dfa["ROOT_SG1_SG2_UCD"] = {
            "UCM": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "UCS": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG2"),
            "UCD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        },
         
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