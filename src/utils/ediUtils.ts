import { SegmentParserBase } from "../new_parser/segmentParserBase";
import { EdifactParser } from "../new_parser/edifactParser";
import { EdiElement, EdiSegment, EdiType, EdiVersion } from "../new_parser/entities";
import { X12Parser } from "../new_parser/x12Parser";
import { SyntaxParserBase } from "../new_parser/syntaxParserBase";
import * as vscode from "vscode";
import * as constants from "../cat_const";

export class EdiUtils {
  static icons = {
    segment: new vscode.ThemeIcon(constants.themeIcons.symbolParameter),
    element: new vscode.ThemeIcon(constants.themeIcons.recordSmall),
    elementAttribute: new vscode.ThemeIcon(constants.themeIcons.mention),
  };

  static isX12(document: vscode.TextDocument): boolean {
    if (document.languageId === EdiType.X12) {
      return true;
    }

    if (!document) {
      return false;
    }

    let content = document.getText();
    if (!content) {
      return false;
    }

    // content = content.trim();
    content = EdiUtils.tidyMimeContent(content);
    if (content.startsWith(`${constants.ediDocument.x12.segment.ISA}${constants.ediDocument.x12.defaultDelimiters.dataElementDelimiter}`) || // ISA*
      content.startsWith(`${constants.ediDocument.x12.segment.GS}${constants.ediDocument.x12.defaultDelimiters.dataElementDelimiter}`) || // GS*
      content.startsWith(`${constants.ediDocument.x12.segment.ST}${constants.ediDocument.x12.defaultDelimiters.dataElementDelimiter}`) // ST*
    ) {
      return true;
    }

    return false;
  }

  static isEdifact(document: vscode.TextDocument): boolean {
    if (document.languageId === EdiType.EDIFACT) {
      return true;
    }

    if (!document) {
      return false;
    }

    let content = document.getText();
    if (!content) {
      return false;
    }

    // content = content.trim();
    content = EdiUtils.tidyMimeContent(content);
    if (content.startsWith(`${constants.ediDocument.edifact.segment.UNA}${constants.ediDocument.edifact.defaultDelimiters.componentElementDelimiter}${constants.ediDocument.edifact.defaultDelimiters.dataElementDelimiter}`) || // UNA*
      content.startsWith(`${constants.ediDocument.edifact.segment.UNB}${constants.ediDocument.edifact.defaultDelimiters.dataElementDelimiter}`) || // UNB*
      content.startsWith(`${constants.ediDocument.edifact.segment.UNH}${constants.ediDocument.edifact.defaultDelimiters.dataElementDelimiter}`) // UNH*
    ) {
      return true;
    }

    return false;
  }

  static tidyMimeContent(cont: string): string {
    let regexX12 = /ISA\*(.*?)\d+~/s;
    let matchX12 = cont.match(regexX12);
    if (matchX12) {
      return matchX12[0].trim();
    }

    let regexEDI = /UNA:(.*?)UNZ\+\d+/s;
    let matchEDI = cont.match(regexEDI);
    if (matchEDI) {
      return matchEDI[0].trim();
    } else {
      return cont.trim();
    }
  }

  // we check strictly for Edidat in order not to affect other extensions dealing with .dat
  static isEdiDat(document: vscode.TextDocument): boolean {
    if (document.languageId === EdiType.EDIFACT) {
      return true;
    }

    if (!document) {
      return false;
    }

    let content = document.getText();
    if (!content) {
      return false;
    }

    content = content.trim();
    if (content.startsWith(`${constants.ediDocument.edifact.segment.UNA}${constants.ediDocument.edifact.defaultDelimiters.dataElementDelimiter}`) || // UNA*
      content.startsWith(`${constants.ediDocument.edifact.segment.UNB}${constants.ediDocument.edifact.defaultDelimiters.dataElementDelimiter}`) || // UNB*
      content.startsWith(`${constants.ediDocument.edifact.segment.UNH}${constants.ediDocument.edifact.defaultDelimiters.dataElementDelimiter}`) // UNH*
    ) {
      return true;
    }

    return false;
  }

  static containSeg(segs: EdiSegment[], segId: string): boolean {
    const found = segs.find(s => s.id == segId);
    if (found) {
      return true;
    } else {
      return false;
    }
  }

  static formatMsgMandatory(segId: string): string {
    return `Segment ${segId} is mandatory, but not found.`;
  }

  static isDocXML(document: vscode.TextDocument): boolean {
    let firstStr = document.getText().substring(0, 22).trim().toLowerCase();
    return EdiUtils.isTxtXML(firstStr);
  }

  static isTxtXML(firstStr: string): boolean {
    if (firstStr.startsWith('<')) {
      let iCloseTag = firstStr.indexOf('>', 1);
      if (iCloseTag >= 2 && iCloseTag <= 18) {
        // seems like a xml file
        return true;
      } else {
        if (firstStr.startsWith("<?xml") || firstStr.startsWith("<cxml") || firstStr.startsWith("<xml")) {
          return true;
        } else {
          return false;
        }
      }
    }

  }

  static getSegmentStartPosition(document: vscode.TextDocument, segment: EdiSegment): vscode.Position {
    return document.positionAt(segment.startIndex);
  }

  static getSegmentEndPosition(document: vscode.TextDocument, segment: EdiSegment): vscode.Position {
    return document.positionAt(segment.endIndex + 1);
  }

  static getSegmentRange(document: vscode.TextDocument, segment: EdiSegment): vscode.Range {
    let endPosition: vscode.Position;
    if (segment.elements[0]) {
      endPosition = EdiUtils.getElementStartPosition(document, segment, segment.elements[0]);
    } else {
      endPosition = EdiUtils.getSegmentEndPosition(document, segment);
    }
    return new vscode.Range(
      EdiUtils.getSegmentStartPosition(document, segment), endPosition);
  }

  static getFileHeaderRange(document: vscode.TextDocument): vscode.Range {
    return new vscode.Range(
      document.positionAt(0), document.positionAt(1)
    );
  }

  static isSupportedRelease(ediVersion: EdiVersion): boolean {
    if (!ediVersion || !ediVersion.release) {
      return false;
    }
    let r = ediVersion.release;
    if (r == "00401" || r == "004010" || r == "D96A" || r == "D01B") {
      return true;
    } else {
      return false;
    }
  }

  /**
  *  I know I should create reg expression based on segmentDelimiter,dataElementDelimiter,componentElementDelimiter
  *  below is interim solution
  * 
  * 
  * @param releaseCharacter It's undefined for X12
  * @param str 
  * @returns 
  */
  static unescapeEdi(str: string, releaseCharacter?: string ): string {
    if (!str) {
      return "";
    }
    if (!releaseCharacter || releaseCharacter != '?') {
      return str;
    }

    return str.replace(/\?:/g, ':').replace(/\?\+/g, '+')
     .replace(/\?\?/g, '?').replace(/\?'/g, '\'');
  }
  /**
  *  I know I should create reg expression based on segmentDelimiter,dataElementDelimiter,componentElementDelimiter
  *  below is interim solution
  * 
  * 
  * @param releaseCharacter It's undefined for X12
  * @param str 
  * @returns 
  */
  static escapeEdi(str: string): string {
    if (!str) {
      return "";
    }
    // if (!releaseCharacter || releaseCharacter != '?') {
    //   return str;
    // }

    return str.replace(/\?/g, '\?\?').replace(/:/g, '\?:').replace(/\+/g, '\?\+')
     .replace(/\'/g, '\?\'');
  }

  /**
   * Help us avoid parsing large file
   * @param document 
   * @returns 
   */
  static checkLength(document: vscode.TextDocument): boolean {
    let sizeK = document.getText().length / 1024;
    if (sizeK > constants.ediDocument.sizeLimit) {
      return false;
    } else {
      return true
    }
  }

  static getNewLine(): string {
    let editor = vscode.window.activeTextEditor;
    if (editor) {
      let document = editor.document;

      let newLineStr;
      if (document.eol === vscode.EndOfLine.CRLF) {
        newLineStr = '\r\n';
      } else {
        newLineStr = '\n';
      }

      return newLineStr;
    }
  }
  static getFileTailRange(document: vscode.TextDocument): vscode.Range {
    // get line count
    let lineCount = document.lineCount;
    // get the last line
    let lastLine = document.lineAt(lineCount - 1);
    // get the character count of last line
    let textLength = lastLine.text.length;

    let lastPosition = new vscode.Position(lineCount - 1, textLength);

    return new vscode.Range(
      lastPosition, lastPosition
    );
  }

  static getElementStartPosition(document: vscode.TextDocument, segment: EdiSegment, element: EdiElement): vscode.Position {
    return document.positionAt(segment.startIndex + element.startIndex);
  }

  static getElementEndPosition(document: vscode.TextDocument, segment: EdiSegment, element: EdiElement): vscode.Position {
    return document.positionAt(segment.startIndex + element.endIndex + 1);
  }

  static getElementRange(document: vscode.TextDocument, segment: EdiSegment, element: EdiElement): vscode.Range {
    return new vscode.Range(
      EdiUtils.getElementStartPosition(document, segment, element),
      EdiUtils.getElementEndPosition(document, segment, element),
    );
  }
}