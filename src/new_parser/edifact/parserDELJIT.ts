import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { SyntaxParserBase, ASTNode, ASTNodeType, ASTOp, ASTOpType } from "../syntaxParserBase";
import { DocInfoBase } from "../../info/docInfoBase";

import { ConvertPattern, versionKeys } from "../../cat_const";
import { Info_DELJIT } from "../../info/info_DELJIT";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class ParserDELJIT extends SyntaxParserBase {
    private static _instance:ParserDELJIT;
    constructor() {
        super();
        this._tableDFA = this._initDFA();
        this._parserKey = versionKeys.EDIFACT_DELJIT;
        this.docInfo = new Info_DELJIT();
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
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
        }

        dfa["ROOT_SG1_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
        }

        dfa["ROOT_SG1_DTM"] = {
            "RFF": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG1"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
        }

        dfa["ROOT_SG2_NAD"] = {
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG3"),
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
        }
        dfa["ROOT_SG2_LOC"] = {
            "LOC": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG3"),
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
        }
        dfa["ROOT_SG2_SG3_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG3"),
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
        }
        dfa["ROOT_SG2_SG3_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG3"),
            "NAD": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG2"),
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),
        }
        dfa["ROOT_SG4_SEQ"] = {
            "LIN": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG7"),            
        }
        dfa["ROOT_SG4_SG7_LIN"] = {
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG7"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),            
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "GIR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "TDT": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG8"),            
            "LOC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG9"),            
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG11"),            
        }
        dfa["ROOT_SG4_SG7_PIA"] = {
            "PIA": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG7"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),            
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "GIR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "TDT": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG8"),            
            "LOC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG9"),            
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG11"),            
        }
        dfa["ROOT_SG4_SG7_IMD"] = {
            "IMD": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG7"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),            
            "GIR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "TDT": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG8"),            
            "LOC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG9"),            
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG11"),            
        }
        dfa["ROOT_SG4_SG7_GIR"] = {
            "GIR": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG7"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),            
            "TDT": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG8"),            
            "LOC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG9"),            
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG11"),            
        }
        dfa["ROOT_SG4_SG7_TDT"] = {
            "TDT": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG7"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),            
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG8"),            
            "LOC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG9"),            
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG11"),            
        }
        dfa["ROOT_SG4_SG7_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG7"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),            
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG8"),            
            "LOC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG9"),            
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG11"),            
        }
        dfa["ROOT_SG4_SG7_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "LIN": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG7"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),            
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG8"),            
            "LOC": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG9"),            
            "QTY": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG11"),      
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
        }
        dfa["ROOT_SG4_SG7_SG8_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG8"),            
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG7","SG4"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),            
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG9"),            
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG11"),      
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
        }
        dfa["ROOT_SG4_SG7_SG8_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),            
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG8"),            
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG7","SG4"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),            
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG9"),            
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG11"),      
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
        }
        dfa["ROOT_SG4_SG7_SG9_LOC"] = {
            "LOC": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG9"),            
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG7","SG4"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"),            
            "CTA": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG10"),            
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG11"),      
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
        }
        dfa["ROOT_SG4_SG7_SG9_SG10_CTA"] = {
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG10"),            
            "LOC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG9","SG7"),            
            "QTY": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG11","SG7"),            
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG7","SG4"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"), 
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),         
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
        }

        dfa["ROOT_SG4_SG7_SG9_SG10_COM"] = {
            "COM": new ASTOp(ASTOpType.ADD_SIBLING_SEG),         
            "CTA": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG10"),            
            "LOC": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG9","SG7"),    
            "QTY": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG11","SG7"),          
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG7","SG4"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"), 
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
        }
       
        dfa["ROOT_SG4_SG7_SG11_QTY"] = {
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG11"),   
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG7","SG4"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"), 
            "SCC": new ASTOp(ASTOpType.ADD_SIBLING_SEG), 
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG), 
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG12"), 
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
        }
       
        dfa["ROOT_SG4_SG7_SG11_SCC"] = {
            "SCC": new ASTOp(ASTOpType.ADD_SIBLING_SEG), 
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG11"),   
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG7","SG4"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"), 
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG), 
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
        }

        dfa["ROOT_SG4_SG7_SG11_DTM"] = {
            "DTM": new ASTOp(ASTOpType.ADD_SIBLING_SEG), 
            "QTY": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG11"),   
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG7","SG4"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"), 
            "RFF": new ASTOp(ASTOpType.NEW_SIBLING_GROUP,"SG12"), 
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
        }
       
        dfa["ROOT_SG4_SG7_SG11_SG12_RFF"] = {
            "RFF": new ASTOp(ASTOpType.NEW_UNCLE_GROUP,"SG12"), 
            "QTY": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG11","SG7"),   
            "LIN": new ASTOp(ASTOpType.NEW_GROUP_UNDER_ANCESTOR,"SG7","SG4"),            
            "SEQ": new ASTOp(ASTOpType.NEW_ROOT_GROUP,"SG4"), 
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
            "UNT": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),       
        }
       
        dfa["ROOT_FTX"] = {
            "FTX": new ASTOp(ASTOpType.ADD_SEG_UNDER_ROOT),
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