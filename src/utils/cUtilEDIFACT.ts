import { SegmentParserBase } from "../new_parser/segmentParserBase";
import { EdifactParser } from "../new_parser/edifactParser";
import { ConvertErr, EdiElement, EdiSegment, EdiType, EdiVersion } from "../new_parser/entities";
import { X12Parser } from "../new_parser/x12Parser";
import { SyntaxParserBase } from "../new_parser/syntaxParserBase";
import * as vscode from "vscode";
import * as constants from "../cat_const";
import Utils from "./utils";

/**
 * EANCOM and Standard EDIFACT
 * 
 */
export class CUtilEDI {

  // every chkXXX function will refresh this value
  // be careful with multi-thread scenarios
  public static err: ConvertErr;

  /**
   * detail error is saved in ConvertUtilsX12.err 
   * 
   * @param value 
   * @returns 
   */
  public static chkUsageIndicator(value: string): boolean {
    CUtilEDI.err = undefined;
    // if (!value) {
    //   CUtilEDI.err = new ConvertErr(EdiType.X12, "ISA", 15);
    //   CUtilEDI.err.msg = `ISA Usage Indicator has no value`;
    //   return false;
    // }
    // if (value !== 'T' && value !== 'P') {
    //   CUtilEDI.err = new ConvertErr(EdiType.X12, "ISA", 15);
    //   CUtilEDI.err.msg = `ISA Usage Indicator should be 'T' or 'P'`;
    //   return false;
    // }
    return true;
  }

  public static testIndicatorXML(value: string) {
    if (value == '1') {
      return 'test';
    } else if (value == '') {
      return 'production';
    } else {
      return '';
    }
  }

  /**
   * 
   * @param value 
   * @returns 
   */
  public static transactionTypeCodeXML(value: string) {
    // CN - Line Level Credit Memo
    // CR - Credit Memo
    // DC - Line Level Debit Memo*
    // DI - Debit Invoice
    // DR - Debit Memo
    // FD - Summary Invoice
    switch (value) {
      case 'CR':
        return 'creditMemo';
      case 'DR':
        return 'debitMemo';
      case 'CN':
        return 'lineLevelCreditMemo';
      case 'DC':
        return 'lineLevelDebitMemo';
      default:
        'standard'
    }
  }

  public static mapMsgFunc(value: string) {
    switch (value) {
      case '9':
        return 'new';
      case '3':
        return 'delete';
      case '31':
        return 'new';
      default:
        return ''
    }
  }
}