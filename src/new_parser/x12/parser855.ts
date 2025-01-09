import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_855 } from "../../info/info_855";
import { ConvertPattern } from "../../cat_const";

/**
 * No need to make singleton because parserUtil already assured it
 */
export class Parser855 extends SyntaxParserBase {
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = constants.versionKeys.X12_855;
        this.docInfo = new Info_855();
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
            "BAK": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_BAK"] = {
            "CUR": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "FOB": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SAC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SAC"),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_CUR"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "FOB": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SAC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SAC"),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_REF"] = {
            "REF": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "FOB": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SAC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SAC"),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_FOB"] = {
            "FOB": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "SAC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SAC"),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SAC_SAC"] = {
            "SAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SAC"),
            "CUR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_SAC_CUR"] = {
            "SAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SAC"),
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "TXI": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_TXI"] = {
            "TXI": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N9_N9"] = {
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N9"),
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N9_MSG"] = {
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N9"),
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N1_N1"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N1_N2"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N1_N3"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N1_N4"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
      
        dfa["ROOT_N1_REF"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N1_PER"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_PO1_PO1"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CUR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTP": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SAC"),
            "ACK": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ACK"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SCH": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SCH"),
            "N9": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_PO1_CUR"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CTP": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SAC"),
            "ACK": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ACK"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SCH": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SCH"),
            "N9": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_PO1_CTP"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "CTP": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SAC"),
            "ACK": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ACK"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SCH": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SCH"),
            "N9": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_PO1_MEA"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SAC"),
            "ACK": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ACK"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SCH": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SCH"),
            "N9": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_PO1_PID_PID"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "PID": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SAC"),
            "ACK": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"ACK"),
            "TXI": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_PO1_REF"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SAC"),
            "ACK": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ACK"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SCH": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SCH"),
            "N9": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_PO1_SAC_SAC"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "SAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SAC"),
            "ACK": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"ACK"),
            "CUR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
        }
        dfa["ROOT_PO1_SAC_CUR"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "SAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SAC"),
            "ACK": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"ACK"),
            "TXI": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
        }
        dfa["ROOT_PO1_ACK_ACK"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "ACK": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"ACK"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TXI": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_ACK_DTM"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "ACK": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"ACK"),
            "TXI": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_TXI"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SCH": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SCH"),
            "N9": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_SCH_SCH"] = {
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_SCH_REF"] = {
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_N9_N9"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_N9_MSG"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
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
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_N1_N4"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_N1_REF"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_PO1_N1_PER"] = {
            "PO1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"PO1"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_CTT_CTT"] = {
            "AMT": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SE": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_CTT_AMT"] = {
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