import { SegmentParserBase } from "../new_parser/segmentParserBase";
import { EdifactParser } from "../new_parser/edifactParser";
import { EdiElement, EdiSegment, EdiType, FileParserMeta } from "../new_parser/entities";
import { X12Parser } from "../new_parser/x12Parser";
import { SyntaxParserBase } from "../new_parser/syntaxParserBase";
import { EdiUtils } from "./ediUtils";
import { EdiDiagnosticsMgr } from "../diagnostics/ediDiagnostics";
import * as vscode from "vscode";
import * as constants from "../cat_const";

import { versionKeys } from "../cat_const";

import { ParserUtilsBase } from "./parserUtilsBase";
import { ParserDESADV } from "../new_parser/edifact_eancom/parserDESADV";
import { ParserREMADV } from "../new_parser/edifact_eancom/parserREMADV";
import { ParserORDERS } from "../new_parser/edifact_eancom/parserORDERS";
import { ParserORDRSP } from "../new_parser/edifact_eancom/parserORDRSP";
import { ParserORDCHG } from "../new_parser/edifact_eancom/parserORDCHG";
import { ParserINVOIC } from "../new_parser/edifact_eancom/parserINVOIC";

export class ParserUtilsEancom extends ParserUtilsBase {
  static syntaxParsers: SyntaxParserBase[];

  static {   
    ParserUtilsEancom.syntaxParsers = [];
    ParserUtilsEancom.syntaxParsers[versionKeys.D01B_DESADV] = new ParserDESADV();
    ParserUtilsEancom.syntaxParsers[versionKeys.D01B_INVOIC] = new ParserINVOIC();
    ParserUtilsEancom.syntaxParsers[versionKeys.D01B_ORDCHG] = new ParserORDCHG();
    ParserUtilsEancom.syntaxParsers[versionKeys.D01B_ORDRSP] = new ParserORDRSP();
    ParserUtilsEancom.syntaxParsers[versionKeys.D01B_ORDERS] = new ParserORDERS();
    ParserUtilsEancom.syntaxParsers[versionKeys.D01B_REMADV] = new ParserREMADV();
  }

  static getSegmentParser(document: vscode.TextDocument): { parser: SegmentParserBase | undefined, ediType: string } {
    let ediType: string;
    let parser: SegmentParserBase | undefined = undefined;
    const documentContent = document.getText();
    if (EdiUtils.isX12(document)) {
      parser = new X12Parser(documentContent);
      ediType = EdiType.X12;
    } else if (EdiUtils.isEdifact(document)) {
      parser = new EdifactParser(documentContent);
      ediType = EdiType.EDIFACT;
    } else {
      ediType = EdiType.UNKNOWN;
    }

    if (ediType !== EdiType.UNKNOWN && document.languageId !== ediType) {
      vscode.languages.setTextDocumentLanguage(document, ediType);
    }

    return {
      parser,
      ediType
    };
  }

  /**
   * Don't do validation, lens, parse document for AST Output document
   * We just highlight the syntax
   */
  static isASTOutput(strDocument: string): boolean {
    if (strDocument.startsWith("ROOT")) {
      return true;
    } else {
      return false;
    }
  }

  static getSyntaxParser(versionKey: string): SyntaxParserBase {
    return ParserUtilsEancom.syntaxParsers[versionKey];
  }

  /**
   * Take 856 as example, we have 856.in and 856.out parsers,
   * So, need to read user's selection to find the parser.
   * 
   * @param openedFileVersion
   * @param documentUri 
   * @returns 
   */
  static getSyntaxParserByUri(openedFileVersion: string, documentUri: vscode.Uri): SyntaxParserBase {
    let versionFromGlobalState: string;

    versionFromGlobalState = this.getStateVersionKey(documentUri);
    switch (openedFileVersion) {
      
      case "APERAK":
        return ParserUtilsEancom.syntaxParsers[versionKeys.D01B_APERAK];
        break;
        // return undefined
        break;

        case "DESADV":
          return ParserUtilsEancom.syntaxParsers[versionKeys.D01B_DESADV];
          break;        
        case "INVOIC":
          return ParserUtilsEancom.syntaxParsers[versionKeys.D01B_INVOIC];
          break;        
        case "ORDCHG":
          return ParserUtilsEancom.syntaxParsers[versionKeys.D01B_ORDCHG];
          break;        
        case "ORDRSP":
          return ParserUtilsEancom.syntaxParsers[versionKeys.D01B_ORDRSP];
          break;        
        case "ORDERS":
          return ParserUtilsEancom.syntaxParsers[versionKeys.D01B_ORDERS];
          break;             
        case "REMADV":
          return ParserUtilsEancom.syntaxParsers[versionKeys.D01B_REMADV];
          break;        
      default:

    }
  }

}