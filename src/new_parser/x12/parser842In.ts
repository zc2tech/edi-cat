import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_842_In } from "../../info/info_842_In";
import { ConvertPattern } from "../../cat_const";

/**
 * No need to make singleton because parserUtil already assured it
 */
export class Parser842In extends SyntaxParserBase {
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = constants.versionKeys.X12_842_In;
        this.docInfo = new Info_842_In();
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
            "BNR": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_BNR"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_REF"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
        }
        dfa["ROOT_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
        }
        dfa["ROOT_N1_N1"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
        }
        dfa["ROOT_N1_N2"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
        }
        dfa["ROOT_N1_N3"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
        }
        dfa["ROOT_N1_N4"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
        }
        dfa["ROOT_HL_HL"] = {
            "LIN": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SPS": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SPS"),
            "NCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"NCD"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_HL_LIN"] = {
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
            "PID": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_HL_PID"] = {
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
            "PID": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_HL_DTM"] = {
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_HL_REF"] = {
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_HL_QTY"] = {
            "SPS": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SPS"),
            "NCD": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"NCD"),
        }

        dfa["ROOT_HL_SPS_SPS"] = {
            "NCD": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"NCD"),
        }
        dfa["ROOT_HL_NCD_NCD"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            // Option 2
            "NTE": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NCA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"NCA"),
        }
        
        dfa["ROOT_HL_NCD_NTE"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "NCA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"NCA"),
        }
        dfa["ROOT_HL_NCD_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "NCA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"NCA"),
        }
        dfa["ROOT_HL_NCD_REF"] = {
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "NCA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"NCA"),
        }
        dfa["ROOT_HL_NCD_QTY"] = {
            "QTY": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "NCA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"NCA"),
        }
        dfa["ROOT_HL_NCD_N1_N1"] = {
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NCA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"NCA"),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
        }

        dfa["ROOT_HL_NCD_N1_REF"] = {
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NCA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"NCA"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_HL_NCD_NCA_NCA"] = {
            "NCA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"NCA"),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
            "NTE": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_HL_NCD_NCA_NTE"] = {
            "NCA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"NCA"),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
            "NTE": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_HL_NCD_NCA_DTM"] = {
            "NCA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"NCA"),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_HL_NCD_NCA_REF"] = {
            "NCA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"NCA"),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_HL_NCD_NCA_N1_N1"] = {
            "NCA": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"NCA","NCD"),
            "HL": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"HL"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
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