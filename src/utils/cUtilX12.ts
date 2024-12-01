import { SegmentParserBase } from "../new_parser/segmentParserBase";
import { EdifactParser } from "../new_parser/edifactParser";
import { ConvertErr, EdiElement, EdiSegment, EdiType, EdiVersion } from "../new_parser/entities";
import { X12Parser } from "../new_parser/x12Parser";
import { SyntaxParserBase } from "../new_parser/syntaxParserBase";
import * as vscode from "vscode";
import * as constants from "../cat_const";
import Utils from "./utils";

export class CUtilX12 {

    // every chkXXX function will refresh this value
    // be careful with multi-thread scenarios
    public static err: ConvertErr;


    public static usageIndicatorXML(value: string): string {
        if (value == 'T') {
            return 'test';
        } else if (value == 'P') {
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
    public static transactionTypeCodeXML(value: string): string {
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
                return 'standard'
        }
    }

    public static transactionSetPurposeCode(value: string): string {
        switch (value) {
            case '00':
                return 'new';
            case '03':
                return 'delete'
            default:
                return ''
        }
    }
}