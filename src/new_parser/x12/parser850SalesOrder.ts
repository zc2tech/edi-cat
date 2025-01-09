import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_850_SalesOrder } from "../../info/inf0_850_SalesOrder";
import { ConvertPattern } from "../../cat_const";

/**
 * No need to make singleton because parserUtil already assured it
 */
export class Parser850SalesOrder extends SyntaxParserBase {
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = constants.versionKeys.X12_850_SalesOrder;
        this.docInfo = new Info_850_SalesOrder();
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
            "BEG": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_BEG"] = {
            "CUR": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
        }
        dfa["ROOT_CUR"] = {
            "CUR": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
        }
        dfa["ROOT_REF"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
        }
        dfa["ROOT_N9_N9"] = {
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N9"),
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
        }
    
        dfa["ROOT_N9_MSG"] = {
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N9"),
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
        }
    
        dfa["ROOT_N1_N1"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
        }
        dfa["ROOT_N1_N2"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
        }
        dfa["ROOT_N1_N3"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
        }
        dfa["ROOT_N1_N4"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
        }
       
        dfa["ROOT_N1_REF"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TD5": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TD4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
        }
        dfa["ROOT_N1_PER"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TD5": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TD4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
        }
       
        dfa["ROOT_PO1_PO1"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CUR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"QTY"),
            "SCH": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SCH"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "SLN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_CUR"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"QTY"),
            "SCH": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SCH"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "SLN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_PID_PID"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "PID": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"QTY"),
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
       
        dfa["ROOT_PO1_REF"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"QTY"),
            "SCH": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SCH"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "SLN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_DTM"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"QTY"),
            "SCH": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SCH"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "SLN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_PO1_QTY_QTY"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"QTY"),
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_SCH_SCH"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_SCH_REF"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_N1_N1"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_N1_N2"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_N1_N3"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_N1_N4"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_N1_REF"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_N1_PER"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_SLN_SLN"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_SLN_MSG"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_SLN_DTM"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "SLN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SLN"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }

        dfa["ROOT_CTT_CTT"] = {
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
        return undefined;
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