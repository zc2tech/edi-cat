import * as vscode from "vscode";
import { StatusBarItem } from "vscode";
import { EdiType, type DiagnoscticsContext, EdiSegment } from "../new_parser/entities";

//import { IDiagnosticsable } from "../interfaces/diagnosticsable";
import { EdiUtils } from "../utils/ediUtils";
import { ParserUtils } from "../utils/parserUtils";
import * as constants from "../cat_const";
import { DiagORDRSP } from "./versions/diagORDRSP";
import { SegmentParserBase } from "../new_parser/segmentParserBase";
import { ASTNode, SyntaxParserBase } from "../new_parser/syntaxParserBase";
import { FileTypeSelector } from "./fileTypeSelector";
import { versionKeys } from "../cat_const";

import { ParserAPERAK } from "../new_parser/edifact/parserAPERAK";
import { ParserCONTRLIn } from "../new_parser/edifact/parserCONTRLIn";
import { ParserCONTRLOut } from "../new_parser/edifact/parserCONTRLOut";
import { FileParserMeta } from "../new_parser/entities";
import { EdiVersion } from "../new_parser/entities";
import { CacheMgr } from "../utils/cacheMgr";
import { ParserUtilsEancom } from "../utils/parserUtilsEancom";
import { ParserUtilsBase } from "../utils/parserUtilsBase";

interface VscodeDiagnoscticsContext extends DiagnoscticsContext {
    document: vscode.TextDocument;
}

export class EdiDiagnosticsMgr {
    statusFileType: StatusBarItem;
    fileTypeSelector: FileTypeSelector;
    syntaxParsers: SyntaxParserBase[];
    ediDiagnostics: vscode.DiagnosticCollection;

    private diagEdifactHeader(segs: EdiSegment[], document: vscode.TextDocument): vscode.Diagnostic[] {
        const rtnArray: vscode.Diagnostic[] = [];
        const checkSegs: string[] = ["UNA", "UNB", "UNH"];
        for (const s of checkSegs) {
            if (!EdiUtils.containSeg(segs, s)) {
                rtnArray.push(new vscode.Diagnostic(
                    EdiUtils.getFileHeaderRange(document), EdiUtils.formatMsgMandatory(s), vscode.DiagnosticSeverity.Error))
            }
        }
        return rtnArray;
    }
    private diagX12Header(segs: EdiSegment[], document: vscode.TextDocument): vscode.Diagnostic[] {
        const rtnArray: vscode.Diagnostic[] = [];
        const checkSegs: string[] = ["ISA", "GS", "ST"];
        for (const s of checkSegs) {
            if (!EdiUtils.containSeg(segs, s)) {
                rtnArray.push(new vscode.Diagnostic(
                    EdiUtils.getFileHeaderRange(document), EdiUtils.formatMsgMandatory(s), vscode.DiagnosticSeverity.Error))
            }
        }
        return rtnArray;
    }

    getSegmentRange(document: vscode.TextDocument, segs: EdiSegment[], segId: string) {
        let seg = segs.find(seg => seg.id == segId);
        if (seg) {
            return EdiUtils.getSegmentRange(document, seg);
        } else {
            return EdiUtils.getFileHeaderRange(document);
        }
    }

    /**
     * It's registered by registerDiagnostics function. regardless of file type.
     * So, need to implement file extension determination in this function 
     * @param document 
     * @returns 
     */
    async refreshDiagnostics(document: vscode.TextDocument): Promise<void> {
        // this.ediDiagnostics.clear(); // I don't know if keeping diag info is good idea.
        if (vscode.workspace.getConfiguration(constants.configuration.ediCat).get(constants.configuration.enableDiagnosis) !== true) {
            this.fileTypeSelector.refreshStatusBarLabel("", document.uri);
            this.ediDiagnostics.clear();
            return;
        }

        let fileExtension = document.fileName.split('.').pop().toLowerCase();
        if (!(fileExtension == 'x12' || fileExtension == 'edi' || fileExtension == 'edifact' || fileExtension == 'dat')) {
            this.fileTypeSelector.refreshStatusBarLabel("UNKNOWN", document.uri);
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];

        if (!EdiUtils.checkLength(document)) {
            let diag = new vscode.Diagnostic(
                EdiUtils.getFileHeaderRange(document), "File size exceeds character limit:"
                + constants.ediDocument.sizeLimit + "K, some functions may not work.", vscode.DiagnosticSeverity.Warning)
            diagnostics.push(diag);
            this.ediDiagnostics.set(document.uri, diagnostics);
            return;
        }

        if (ParserUtils.isASTOutput(document.getText())) {
            return;
        }


        let ediType: string;
        let segParser: SegmentParserBase | undefined;
        let segments: EdiSegment[];
        let ediVersion: EdiVersion;
        let syntaxParser: SyntaxParserBase;
        let astTree: ASTNode;

        let cachedParserMeta: FileParserMeta = CacheMgr.getParserMeta(document.uri.toString());
        segParser = cachedParserMeta.segParser;
        syntaxParser = cachedParserMeta.syntaxParser;
        ediType = cachedParserMeta.ediType;
        ediVersion = cachedParserMeta.ediVersion;
        segments = cachedParserMeta.segments;
        astTree = cachedParserMeta.astTree;

        if (!segParser) {
            let tmp = await ParserUtils.getSegmentParser(document);
            segParser = tmp.parser;
            ediType = tmp.ediType;
        }

        // still has possibility that segParser not exist
        if (!segParser) {
            this.fileTypeSelector.refreshStatusBarLabel("UNKNOWN", document.uri);
            return;
        }

        ediVersion = await segParser.parseReleaseAndVersion();
        segments = await segParser.parseSegments();

        // save point
        CacheMgr.saveParserMeta(document.uri.toString(), segParser, syntaxParser, ediType, ediVersion, segments, astTree);

        if (ediType === EdiType.UNKNOWN) {
            this.fileTypeSelector.refreshStatusBarLabel("UNKNOWN", document.uri);
            return;
        }

        if (ediType == EdiType.EDIFACT) {
            let rtnArray = this.diagEdifactHeader(segments, document);
            if (rtnArray.length > 0) {
                diagnostics.push(...rtnArray);
                this.ediDiagnostics.set(document.uri, diagnostics);
                return;
            }
        } else if (ediType == EdiType.X12) {
            let rtnArray = this.diagX12Header(segments, document);
            if (rtnArray.length > 0) {
                diagnostics.push(...rtnArray);
                this.ediDiagnostics.set(document.uri, diagnostics);
                return;
            }
        } else {
            // unknown EDIType and we won't continue
            return;
        }

        if (!EdiUtils.isSupportedRelease(ediVersion)) {
            let diag: vscode.Diagnostic;
            let segRelease: EdiSegment;
            if (ediType == EdiType.X12) {
                segRelease = segments.find(s => s.id == "GS")
            } else if (ediType == EdiType.EDIFACT) {
                segRelease = segments.find(s => s.id == "UNH")
            } else {
                // XML should have other Diagnostics Class
                return;
            }

            // should point to component range, but I'm too lazy to safeguard "undefined" value for that
            if (segRelease) {
                diag = new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(document, segRelease), "Release component not eixst or Not Supported Release: "
                + ediVersion!.release, vscode.DiagnosticSeverity.Error)
            } else {
                diag = new vscode.Diagnostic(
                    EdiUtils.getFileHeaderRange(document), "Release component not eixst or Not Supported Release: "
                + ediVersion!.release, vscode.DiagnosticSeverity.Error)
            }
            diagnostics.push(diag);
            this.ediDiagnostics.set(document.uri, diagnostics);
            return;
        }

        // if (this._ediVersion.release == "00401" || this._ediVersion.release == "D96A") {
        let objSegId = "";
        if (ediType == EdiType.EDIFACT) {
            objSegId = "UNH";
        } else if (ediType == EdiType.X12) {
            objSegId = "GS";
        } else {
            // other type?
        }

        if (!syntaxParser) {  // not exist in cache
            syntaxParser = ParserUtils.getSyntaxParserByUriSmart(ediVersion, segParser.getVersion(), document.uri);
        }

        this.fileTypeSelector.refreshStatusBarLabel(segParser.getVersion(), document.uri)
        if (!syntaxParser) {
            diagnostics.push(new vscode.Diagnostic(
                EdiUtils.getFileHeaderRange(document),
                `Cannot determine corresponding parser. Fix EDI header or select file type from status bar`,
                vscode.DiagnosticSeverity.Error
            ));
        } else {
            // Usually, ediDiagnostics should be a cache content porivder
            syntaxParser.parse(document, segments);
            astTree = syntaxParser.getAstTree();
            diagnostics.push(...syntaxParser.getDiags());
        }

        for (let segment of segments) {
            if (!segment.ediReleaseSchemaSegment || !segment.elements) {
                continue;
            }

            for (let element of segment.elements) {
                const diagnoscticsContext: VscodeDiagnoscticsContext = {
                    document,
                    segment,
                    element,
                    ediType,
                    segments,
                    ediVersion
                };
                const elementDiagnostic = this.getElementDiagnostic(diagnoscticsContext);
                if (elementDiagnostic?.length > 0) {
                    diagnostics.push(...elementDiagnostic);
                }
            }
        }

        if (diagnostics.length == 0 && syntaxParser) {
            // there is no basic diagnostic error, so we go convert error check
            try {
                diagnostics.push(...syntaxParser.convertCheck(document));
            } catch (error) {
                // just ignore
            }
        }

        // save point, astTree is saved for other function like hover, not just for diagnostics.
        CacheMgr.saveParserMeta(document.uri.toString(), segParser, syntaxParser, ediType, ediVersion, segments, astTree);

        this.ediDiagnostics.set(document.uri, diagnostics);
    }

    getElementDiagnostic(context: VscodeDiagnoscticsContext): vscode.Diagnostic[] {
        if (!context.element?.ediReleaseSchemaElement) {
            return [];
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const elementErrors = context.element.checkSegErrors(context);
        for (let elementError of elementErrors) {
            const diagnostic = new vscode.Diagnostic(
                EdiUtils.getElementRange(context.document, context.segment, context.element),
                elementError.error,
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.code = elementError.code;
            diagnostics.push(diagnostic);
        }

        return diagnostics;
    }

    registerDiagnostics(): any[] {
        this.ediDiagnostics = vscode.languages.createDiagnosticCollection(constants.diagnostic.diagnosticCollectionId);
        if (vscode.window.activeTextEditor) {
            this.refreshDiagnostics(vscode.window.activeTextEditor.document);
        }
        return [
            this.ediDiagnostics,
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.refreshDiagnostics(editor.document);
                }
            }),
            vscode.workspace.onDidChangeTextDocument(editor => this.refreshDiagnostics(editor.document)),
            vscode.workspace.onDidCloseTextDocument(doc => this.ediDiagnostics.delete(doc.uri))
        ];
    }
}
