import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_865} from "../../info/info_865";
import { ConvertPattern } from "../../cat_const";

/**
 * No need to make singleton because parserUtil already assured it
 */
export class Parser865 extends SyntaxParserBase {
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = constants.versionKeys.X12_865;
        this.docInfo = new Info_865();
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
            "BCA": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
        }
        dfa["ROOT_BCA"] = {
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
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_TXI"] = {
            "TXI": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N9_N9"] = {
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N9"),
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N9_MSG"] = {
            "N9": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N9"),
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N1_N1"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N1_N2"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N1_N3"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N1_N4"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
      
        dfa["ROOT_N1_REF"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_N1_PER"] = {
            "N1": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"N1"),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_POC_POC"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CUR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTP": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SAC"),
            "ACK": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ACK"),
        }
        dfa["ROOT_POC_CUR"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CTP": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SAC"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ACK": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ACK"),
        }
        dfa["ROOT_POC_CTP"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "CTP": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SAC"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ACK": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ACK"),
        }
        dfa["ROOT_POC_MEA"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "MEA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PID": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SAC"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ACK": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ACK"),
        }
        dfa["ROOT_POC_PID_PID"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "PID": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"PID"),
            "REF": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SAC"),
            "TXI": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "ACK": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"ACK"),
        }
        dfa["ROOT_POC_REF"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SAC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SAC"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ACK": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ACK"),
        }
        dfa["ROOT_POC_SAC_SAC"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "SAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SAC"),
            "CUR": new ASTOp(ASTOpType.ADD_SIBLING_SEG,"CUR"),
            "TXI": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "ACK": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"ACK"),
        }
        dfa["ROOT_POC_SAC_CUR"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "SAC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SAC"),
            "TXI": new ASTOp(ASTOpType.ADD_UNCLE_SEG),
            "ACK": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"ACK"),
        }
        dfa["ROOT_POC_TXI"] = {
            // "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "TXI": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "ACK": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"ACK"),
        }
        dfa["ROOT_POC_ACK_ACK"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "ACK": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"ACK"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_POC_ACK_DTM"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "ACK": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"ACK"),
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
      
        dfa["ROOT_POC_SCH_SCH"] = {
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_POC_SCH_REF"] = {
            "SCH": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SCH"),
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_POC_N9_N9"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_POC_N9_MSG"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "N9": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N9"),
            "MSG": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_POC_N1_N1"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_POC_N1_N2"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "N2": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_POC_N1_N3"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "N3": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "N4": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_POC_N1_N4"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_POC_N1_REF"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "REF": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
        }
        dfa["ROOT_POC_N1_PER"] = {
            "POC": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"POC"),
            "N1": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"N1"),
            "PER": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTT": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"CTT"),
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