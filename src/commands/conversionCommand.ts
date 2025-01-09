/* eslint-disable prefer-const */
import * as vscode from "vscode";
import path = require("path");
import { Parser810 } from "../new_parser/x12/parser810";
import { EdiUtils } from "../utils/ediUtils";
import * as constants from "../cat_const";
import { ParserUtils } from "../utils/parserUtils";
import { SyntaxParserBase } from "../new_parser/syntaxParserBase";
import { EdiVersion } from "../new_parser/entities";
import { ConvertPattern } from "../cat_const";

export class ConversionCommand {

  public async command(...args) {
    if (!vscode.window.activeTextEditor) {
      return;
    }

    const document = vscode.window.activeTextEditor.document;

    if (!EdiUtils.checkLength(document)) {
      vscode.window.showErrorMessage("File size exceeds character limit:"
        + constants.ediDocument.sizeLimit + "K.");
      return;
    }

    if (ParserUtils.isASTOutput(document.getText())) {
      // it's already parsed document
      vscode.window.showErrorMessage('Do not parse a result document.');
      return;
    }

    const tmp = await ParserUtils.getSegmentParser(document);
    const segParser = tmp.parser;
    const ediType = tmp.ediType;

    let syntaxParser: SyntaxParserBase;
    let ediVersion: EdiVersion;

    ediVersion = await segParser.parseReleaseAndVersion();
    const segments = await segParser.parseSegments();
    if (!segments || segments.length <= 0) {
      vscode.window.showErrorMessage('Error on parsing segment');
      return;
    }

    if (vscode.workspace.getConfiguration(constants.configuration.ediCat).get(constants.configuration.enableDiagnosis) !== true) {
      vscode.window.showErrorMessage
        (`Please enable Diagnosis setting before run this command.`);
      return;
    }

    syntaxParser = ParserUtils.getSyntaxParserByUriSmart(ediVersion, segParser.getVersion(), document.uri);
    if (!syntaxParser) {
      vscode.window.showErrorMessage
        (`Failed to get parser, please fix Diagnosis Error first.`);
      return;
    }

    if ( (ediVersion.release != 'D96A' && ediVersion.release != 'D01B' && ediVersion.release != '00401'
    && ediVersion.release != '00401')) {
      vscode.window.showErrorMessage
        (`Not supported file conversion format`);
      return;
    }
    const astStr: string = syntaxParser.convert(ConvertPattern.X12_to_cXML)

    const newDoc = await vscode.workspace.openTextDocument({ content: astStr, language: 'xml' });
    await vscode.window.showTextDocument(newDoc);

  }

  private _isSupportedVersion(ediVersion: EdiVersion): boolean {
    return (ediVersion.release != 'D96A' && ediVersion.release != 'D01B' && ediVersion.release != '00401'
      && ediVersion.release != '00401')
  }
}

