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

import { ParserAPERAK } from "../new_parser/edifact/parserAPERAK";
import { ParserCONTRLIn } from "../new_parser/edifact/parserCONTRLIn";
import { ParserCONTRLOut } from "../new_parser/edifact/parserCONTRLOut";
import { ParserDELFORProductActivity } from "../new_parser/edifact/parserDELFORProductActivity";
import { Parser810 } from "../new_parser/x12/parser810";
import { Parser820 } from "../new_parser/x12/parser820";
import { Parser824In } from "../new_parser/x12/parser824In";
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
import { Parser865 } from "../new_parser/x12/parser865";

/**
 * 
 * It's for X12 4010 and EDIFACT D96A, other release/version should have
 * their our parserUtilsXXXX class
 * 
 */
export class ParserUtilsLegacy extends ParserUtilsBase {
  static syntaxParsers: SyntaxParserBase[];

  static {
    ParserUtilsLegacy.syntaxParsers = [];
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_810] = new Parser810();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_820] = new Parser820();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_824_In] = new Parser824In();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_824_Out] = new Parser824Out();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_830] = new Parser830();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_830_Order] = new Parser830Order();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_830_ProductActivity] = new Parser830ProductActivity();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_842_In] = new Parser842In();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_842_Out] = new Parser842Out();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_846] = new Parser846();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_846_Consignment] = new Parser846Consignment();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_846_MOPO] = new Parser846MOPO();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_846_SMI] = new Parser846SMI();
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_850] = new Parser850()
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_850_SalesOrder] = new Parser850SalesOrder()
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_855] = new Parser855()
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_856_In] = new Parser856In()
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_856_Out] = new Parser856Out()
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_860] = new Parser860()
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_861_In] = new Parser861In()
    // ParserUtilsLegacy.syntaxParsers[versionKeys.X12_861_Out] = new Parser861Out()
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_862] = new Parser862()
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_865] = new Parser865()
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_866] = new Parser866()
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_997_In] = new Parser997In()
    ParserUtilsLegacy.syntaxParsers[versionKeys.X12_997_Out] = new Parser997Out()

    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_APERAK] = new ParserAPERAK();
    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_CONTRL_In] = new ParserCONTRLIn();
    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_CONTRL_Out] = new ParserCONTRLOut();
    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_DELFOR_ProductActivity] = new ParserDELFORProductActivity();
    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_DELFOR_Order] = new ParserDELFOROrder();
    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_DELJIT] = new ParserDELJIT();
    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_DESADV] = new ParserDESADV();
    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_INVOIC] = new ParserINVOIC();
    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_ORDCHG] = new ParserORDCHG();
    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_ORDRSP] = new ParserORDRSP();
    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_ORDERS] = new ParserORDERS();
    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_RECADV] = new ParserRECADV();
    ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_REMADV] = new ParserREMADV();
  }


  static getSyntaxParser(versionKey: string): SyntaxParserBase {
    return ParserUtilsLegacy.syntaxParsers[versionKey];
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
      case "810":
        return ParserUtilsLegacy.syntaxParsers[versionKeys.X12_810];
        break;
      case "820":
        return ParserUtilsLegacy.syntaxParsers[versionKeys.X12_820];
        break;
      case "824":
        // if (versionFromGlobalState) {
        //   if (versionKeys.X12_Family_824.includes(versionFromGlobalState)) {
        //     return ParserUtilsLegacy.syntaxParsers[versionFromGlobalState];
        //   }
        // }
        return ParserUtilsLegacy.syntaxParsers[versionKeys.X12_824_Out];
        break;
      case "830":
        if (versionFromGlobalState) {
          if (versionKeys.X12_Family_830.includes(versionFromGlobalState)) {
            return ParserUtilsLegacy.syntaxParsers[versionFromGlobalState];
          }
        }
        break;
      case "842":
        if (versionFromGlobalState) {
          if (versionKeys.X12_Family_842.includes(versionFromGlobalState)) {
            return ParserUtilsLegacy.syntaxParsers[versionFromGlobalState];
          }
        }
        break;
      case "846":
        if (versionFromGlobalState) {
          if (versionKeys.X12_Family_846.includes(versionFromGlobalState)) {
            return ParserUtilsLegacy.syntaxParsers[versionFromGlobalState];
          }
        } 
        break;
      case "850":
        // if (versionFromGlobalState) {
        //   if (versionKeys.X12_Family_850.includes(versionFromGlobalState)) {
        //     return ParserUtilsLegacy.syntaxParsers[versionFromGlobalState];
        //   }
        // }
        // break;
        return ParserUtilsLegacy.syntaxParsers[versionKeys.X12_850];
        break;
      case "855":
        return ParserUtilsLegacy.syntaxParsers[versionKeys.X12_855];
        break;
      case "856":
        if (versionFromGlobalState) {
          if (versionKeys.X12_Family_856.includes(versionFromGlobalState)) {
            return ParserUtilsLegacy.syntaxParsers[versionFromGlobalState];
          }
        } else {
          // give a default value if versionFromGlobalState not found
          // not sure if it's a good decsion
          ParserUtilsLegacy.saveParserMap(documentUri,versionKeys.X12_856_In);
          return ParserUtilsLegacy.syntaxParsers[versionKeys.X12_856_In];
        }
        break;
      case "860":
        return ParserUtilsLegacy.syntaxParsers[versionKeys.X12_860];
        break;
      case "861":
        // if (versionFromGlobalState) {
        //   if (versionKeys.X12_Family_861.includes(versionFromGlobalState)) {
        //     return ParserUtilsLegacy.syntaxParsers[versionFromGlobalState];
        //   }
        // }
        return ParserUtilsLegacy.syntaxParsers[versionKeys.X12_861_In];
        break;
      case "862":
        return ParserUtilsLegacy.syntaxParsers[versionKeys.X12_862];
        break;
      case "865":
        return ParserUtilsLegacy.syntaxParsers[versionKeys.X12_865];
        break;
      case "866":
        return ParserUtilsLegacy.syntaxParsers[versionKeys.X12_866];
        break;
      case "997":
        if (versionFromGlobalState) {
          if (versionKeys.X12_Family_997.includes(versionFromGlobalState)) {
            return ParserUtilsLegacy.syntaxParsers[versionFromGlobalState];
          }
        }
        break;
      case "APERAK":
        return ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_APERAK];
        break;
      case "CONTRL":
        if (versionFromGlobalState) {
          if (versionFromGlobalState == versionKeys.EDIFACT_CONTRL_In
            || versionFromGlobalState == versionKeys.EDIFACT_CONTRL_Out) {
            return ParserUtilsLegacy.syntaxParsers[versionFromGlobalState];
          }
        }
        // return undefined
        break;
      case "DELFOR":
        if (versionFromGlobalState) {
          if (versionFromGlobalState == versionKeys.EDIFACT_DELFOR_Order
            || versionFromGlobalState == versionKeys.EDIFACT_DELFOR_ProductActivity) {
            return ParserUtilsLegacy.syntaxParsers[versionFromGlobalState];
          }
        }
        break;
        case "DELJIT":
          return ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_DELJIT];
          break;        
        case "DESADV":
          return ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_DESADV];
          break;        
        case "INVOIC":
          return ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_INVOIC];
          break;        
        case "ORDCHG":
          return ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_ORDCHG];
          break;        
        case "ORDRSP":
          return ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_ORDRSP];
          break;        
        case "ORDERS":
          return ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_ORDERS];
          break;        
        case "RECADV":
          return ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_RECADV];
          break;        
        case "REMADV":
          return ParserUtilsLegacy.syntaxParsers[versionKeys.EDIFACT_REMADV];
          break;        
      default:

    }
  }

}