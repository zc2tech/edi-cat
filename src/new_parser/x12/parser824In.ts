import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_824_In } from "../../info/info_824_In";
import { ConvertPattern } from "../../cat_const";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class Parser824In extends SyntaxParserBase {
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = constants.versionKeys.X12_824_In
        this.docInfo = new Info_824_In();
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
            "BGN": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_BGN"] = {
            "OTI": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"OTI"),
        }
        dfa["ROOT_OTI_OTI"] = {
            "OTI": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"OTI"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TED": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"TED"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_OTI_REF"] = {
            "OTI": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"OTI"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TED": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"TED"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        
        dfa["ROOT_OTI_DTM"] = {
            "OTI": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"OTI"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TED": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"TED"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_OTI_TED_TED"] = {
            "OTI": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"OTI"),
            "TED": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"TED"),
            "NTE": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_OTI_TED_NTE"] = {
            "OTI": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"OTI"),
            "TED": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"TED"),
            "NTE": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
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