import { SegmentParserBase } from "../new_parser/segmentParserBase";
import { EdifactParser } from "../new_parser/edifactParser";
import { EdiElement, EdiSegment, EdiType, EdiVersion, FileParserMeta } from "../new_parser/entities";
import { X12Parser } from "../new_parser/x12Parser";
import { SyntaxParserBase } from "../new_parser/syntaxParserBase";
import { EdiUtils } from "./ediUtils";
import { EdiDiagnosticsMgr } from "../diagnostics/ediDiagnostics";
import * as vscode from "vscode";
import * as constants from "../cat_const";

import { versionKeys } from "../cat_const";

import { ParserAPERAK } from "../new_parser/edifact/parserAPERAK";
import { ParserCONTRLIn } from "../new_parser/edifact/parserCONTRLIn";
import { ParserCONTRLOut } from "../new_parser/edifact/parserCONTRLOut";
import { ParserDELFORProductActivity } from "../new_parser/edifact/parserDELFORProductActivity";
import { Parser810 } from "../new_parser/x12/parser810";
import { Parser820 } from "../new_parser/x12/parser820";
//import { Parser824In } from "../new_parser/x12/parser824In";
import { Parser824Out } from "../new_parser/x12/parser824Out";
import { Parser830 } from "../new_parser/x12/parser830";
import { Parser830Order } from "../new_parser/x12/parser830Order";
import { Parser830ProductActivity } from "../new_parser/x12/parser830ProductActivity";
import { Parser842In } from "../new_parser/x12/parser842In";
import { Parser842Out } from "../new_parser/x12/parser842Out";
import { Parser846 } from "../new_parser/x12/parser846";
import { Parser846SMI } from "../new_parser/x12/parser846SMI";
import { Parser846Consignment } from "../new_parser/x12/parser846Consignment";
import { Parser846MOPO } from "../new_parser/x12/parser846MOPO";
import { Parser850 } from "../new_parser/x12/parser850";
import { Parser850SalesOrder } from "../new_parser/x12/parser850SalesOrder";
import { Parser855 } from "../new_parser/x12/parser855";
import { Parser856In } from "../new_parser/x12/parser856In";
import { Parser856Out } from "../new_parser/x12/parser856Out";
import { Parser860 } from "../new_parser/x12/parser860";
import { Parser861In } from "../new_parser/x12/parser861In";
// import { Parser861Out } from "../new_parser/x12/parser861Out";
import { Parser862 } from "../new_parser/x12/parser862";
import { Parser865 } from "../new_parser/x12/parser865";
import { Parser866 } from "../new_parser/x12/parser866";
import { Parser997In } from "../new_parser/x12/parser997In";
import { Parser997Out } from "../new_parser/x12/parser997Out";
import { ParserDELFOROrder } from "../new_parser/edifact/parserDELFOROrder";
import { ParserDELJIT } from "../new_parser/edifact/parserDELJIT";
import { ParserDESADV } from "../new_parser/edifact/parserDESADV";
import { ParserINVOIC } from "../new_parser/edifact/parserINVOIC";
import { ParserORDCHG } from "../new_parser/edifact/parserORDCHG";
import { ParserORDRSP } from "../new_parser/edifact/parserORDRSP";
import { ParserORDERS } from "../new_parser/edifact/parserORDERS";
import { ParserRECADV } from "../new_parser/edifact/parserRECADV";
import { ParserREMADV } from "../new_parser/edifact/parserREMADV";
import { ParserUtilsBase } from "./parserUtilsBase";
import { ParserUtilsEancom } from "./parserUtilsEancom";
import { ParserUtilsLegacy } from "./parserUtilsLegacy";

/**
 * 
 * It's for X12 4010 and EDIFACT D96A, other release/version should have
 * their our parserUtilsXXXX class
 * 
 */
export class ParserUtils extends ParserUtilsBase {

  /**
  * don't want to change parameters, although seems strange
  * @param ediVersion 
  * @param versionKey 
  * @returns 
  */
  static getSyntaxParserSmart(ediVersion: EdiVersion, versionKey: string): SyntaxParserBase {
    if (!ediVersion) {
      return null;
    }
    if (ediVersion.release == "D01B") {
      return ParserUtilsEancom.syntaxParsers[versionKey];
    } else {
      return ParserUtilsLegacy.syntaxParsers[versionKey];
    }
  };

  static getSyntaxParserByUriSmart(ediVersion: EdiVersion, openedFileVersion: string, documentUri: vscode.Uri): SyntaxParserBase {
    if (!ediVersion) {
      return null;
    }
    if (ediVersion.release == "D01B") {
      if (ediVersion.AssociationAssignedCode && ediVersion.AssociationAssignedCode.startsWith('EAN')) {
        // EANCOM D01B
        return ParserUtilsEancom.getSyntaxParserByUri(openedFileVersion, documentUri);
      } else {
        // EDIFACT D01B, interimly use of parsr of EANCOM
        return ParserUtilsEancom.getSyntaxParserByUri(openedFileVersion, documentUri);
      }
    } else {
      // X12 00401 and EDIFACT D96A
      return ParserUtilsLegacy.getSyntaxParserByUri(openedFileVersion, documentUri)
    }
  }

}