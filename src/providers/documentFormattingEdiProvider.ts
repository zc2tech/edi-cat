import * as vscode from "vscode";
import { EdiType } from "../new_parser/entities";
import { EdiUtils } from "../utils/ediUtils";
import { ParserUtils } from "../utils/parserUtils";
import * as constants from "../cat_const";
import { CancellationToken, FormattingOptions, ProviderResult, Range, TextDocument, TextEdit } from "vscode";
import { XmlFormatter, XmlFormatterFactory } from "../formatting/xml-formatter";
import { XmlFormattingOptionsFactory } from "../formatting/xml-formatting-options";

export class AllFormatter implements vscode.DocumentFormattingEditProvider {
  public xmlFormatter: XmlFormatter
  constructor() {
    this.xmlFormatter = XmlFormatterFactory.getXmlFormatter();
   }

  async provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Promise<vscode.TextEdit[] | null | undefined> {

    if (EdiUtils.isDocXML(document)) {
      const lastLine = document.lineAt(document.lineCount - 1);
      const documentRange = new Range(document.positionAt(0), lastLine.range.end);

      return this._provideXmlRangeEdits(document, documentRange, options, token);
    }
    
    const { parser } = ParserUtils.getSegmentParser(document);
    let segments = await parser!.parseSegments();
    if (!segments || segments.length <= 0) {
      return;
    }
    const formattedDocumentText = segments.join(constants.ediDocument.lineBreak);

    const result: vscode.TextEdit[] = [];
    result.push(new vscode.TextEdit(
      new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      ),
      formattedDocumentText
    ));
    return result;
  }


  _provideXmlEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
    const lastLine = document.lineAt(document.lineCount - 1);
    const documentRange = new Range(document.positionAt(0), lastLine.range.end);

    return this._provideXmlRangeEdits(document, documentRange, options, token);
  }

  _provideXmlRangeEdits(document: TextDocument, range: Range, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
    const allXml = document.getText();
    let selectedXml = document.getText(range);
    const extFormattingOptions = XmlFormattingOptionsFactory.getXmlFormattingOptions(options, document);

    const selectionStartOffset = document.offsetAt(range.start);
    let tabCount = 0;
    let spaceCount = 0;

    for (let i = (selectionStartOffset - 1); i >= 0; i--) {
      const cc = allXml.charAt(i);

      if (/\t/.test(cc)) {
        tabCount++;
      }

      else if (/ /.test(cc)) {
        spaceCount++;
      }

      else {
        break;
      }
    }

    if (options.insertSpaces) {
      extFormattingOptions.initialIndentLevel = Math.ceil(spaceCount / (options.tabSize || 1));
    }

    else {
      extFormattingOptions.initialIndentLevel = tabCount;
    }

    selectedXml = this.xmlFormatter.formatXml(selectedXml, extFormattingOptions);

    // we need to remove the leading whitespace because the formatter will add an indent before the first element
    selectedXml = selectedXml.replace(/^\s+/, "");

    return [TextEdit.replace(range, selectedXml)];
  }
}
