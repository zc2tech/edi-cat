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
import { ParserUtilsEancom } from "./parserUtilsEancom";
import { ParserUtils } from "./parserUtils";


export class ParserUtilsBase {

    static ctx: vscode.ExtensionContext;

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

    // Function to save an object to workspaceState
    static saveCtxObj(key: string, obj: { [key: string]: any }) {
        ParserUtilsBase.ctx.workspaceState.update(key, obj);
    }

    // Function to retrieve an object from workspaceState
    static getCtxObj(key: string): { [key: string]: any } | undefined {
        return ParserUtilsBase.ctx.workspaceState.get<{ [key: string]: any }>(key);
    }

    /**
     * For saving user selection of detail filetype/version
     * so we can select an appropriate SyntaxParser
     * @param documentUri 
     * @param versionKey 
     */
    static saveParserMap(documentUri?: vscode.Uri, versionKey?: string) {
        let mapParser = ParserUtilsBase.getCtxObj(constants.common.MAP_FILE_PARSER) || {};

        if (documentUri) {
            mapParser[documentUri.path] = versionKey;
        }
        ParserUtilsBase.saveCtxObj(constants.common.MAP_FILE_PARSER, mapParser);

    }


    static getStateVersionKey(documentUri: vscode.Uri): string {
        let mapParser = ParserUtilsBase.getCtxObj(constants.common.MAP_FILE_PARSER) || {};
        if (!mapParser) {
            return undefined
        } else {
            return mapParser[documentUri.path];
        }
    }


    static changeStateVersionKey(from: vscode.Uri, to: vscode.Uri): string {
        let mapParser = ParserUtilsBase.getCtxObj(constants.common.MAP_FILE_PARSER) || {};
        if (!mapParser) {
            return undefined
        } else {
            mapParser[to.path] = mapParser[from.path];
            mapParser[from.path] = undefined;
        }
        ParserUtilsBase.saveCtxObj(constants.common.MAP_FILE_PARSER, mapParser);

    }

    static removeStateVersionKey(from: vscode.Uri): boolean {
        let rtn: boolean;
        let mapParser = ParserUtilsBase.getCtxObj(constants.common.MAP_FILE_PARSER);
        if (!mapParser) {
            rtn = false; // we cannot find the corresponding record
        } else {
            if (!mapParser[from.path]) {
                // still not found
                rtn = false;
            } else {
                mapParser[from.path] = undefined;
                //mapParser.delete(from.path); // removed
                rtn = true;
                ParserUtilsBase.saveCtxObj(constants.common.MAP_FILE_PARSER, mapParser);
            }
        }
        return rtn;
    }

    static copyStateVersionKey(from: vscode.Uri, to: vscode.Uri): string {
        let mapParser = ParserUtilsBase.getCtxObj(constants.common.MAP_FILE_PARSER);
        if (!mapParser) {
            return; // do nothing
        } else {
            mapParser[to.path] = mapParser[from.path];
            ParserUtilsBase.saveCtxObj(constants.common.MAP_FILE_PARSER, mapParser);
        }
    }

}