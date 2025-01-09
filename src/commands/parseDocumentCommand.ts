/* eslint-disable prefer-const */
import * as vscode from "vscode";
import { EdiUtils } from "../utils/ediUtils";
import * as constants from "../cat_const";
import { ParserUtils } from "../utils/parserUtils";
import { SyntaxParserBase } from "../new_parser/syntaxParserBase";
import { EdiVersion } from "../new_parser/entities";
import { ParserUtilsEancom } from "../utils/parserUtilsEancom";
import { ParserUtilsBase } from "../utils/parserUtilsBase";

export class ParseDocumentCommand {
    
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
        if (!segParser) {
            vscode.window.showErrorMessage('The content must be in X12 or EDIFACT format.');
            return;
        }

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
                (`Cannot determine corresponding parser. Fix EDI header or select file type from status bar`);
            return;
        } else {
            syntaxParser.parse(document, segments);
            syntaxParser.setMessageDelimiters(segParser.getMessageDelimiters());
        }

        if (syntaxParser.getDiags().length > 0) {
            vscode.window.showWarningMessage(`There are parse errors, so the generated AST may not complete.`);
        }

        const astStr = syntaxParser.renderAST();
        const newDoc = await vscode.workspace.openTextDocument({ content: astStr, language: ediType });
        await vscode.window.showTextDocument(newDoc);

        // let text = segments.join(constants.ediDocument.lineBreak);

        // vscode.window.activeTextEditor.edit((builder) => {
        //   if (!vscode.window.activeTextEditor) {
        //     return;
        //   }

        //   builder.replace(new vscode.Range(
        //     vscode.window.activeTextEditor.document.positionAt(0), 
        //     vscode.window.activeTextEditor.document.positionAt(documentContent.length)
        //     ), text);
        // });
    }
}
