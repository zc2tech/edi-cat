import * as vscode from "vscode";
import { EdiSegment, EdiType, EdiVersion } from "../new_parser/entities";
import * as constants from "../cat_const";
import { ParserUtils } from "../utils/parserUtils";
import { EdiUtils } from "../utils/ediUtils";
import { ASTNode } from "../new_parser/syntaxParserBase";
import { FileParserMeta } from "../new_parser/entities";
import { SegmentParserBase } from "../new_parser/segmentParserBase";
import { SyntaxParserBase } from "../new_parser/syntaxParserBase";
import { ParserUtilsEancom } from "../utils/parserUtilsEancom";
import { ParserUtilsBase } from "../utils/parserUtilsBase";

export class CodelensEdiProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private regex: RegExp;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  // private _segments: EdiSegment[];
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
  parsedDocMap: { [key: string]: FileParserMeta }[];

  constructor(parsedDocMap: { [key: string]: FileParserMeta }[]) {
    this.parsedDocMap = parsedDocMap;
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[] | null | undefined> {

    if (vscode.workspace.getConfiguration(constants.configuration.ediCat).get(constants.configuration.enableCodelens) !== true) {
      return [];
    }

    if (ParserUtils.isASTOutput(document.getText())) {
      return;
    }
   
    if (!EdiUtils.checkLength(document)) {      
      return;
    }

    let ediType: string;
    let segParser: SegmentParserBase | undefined;
    let segments: EdiSegment[];
    let ediVersion: EdiVersion;
    let syntaxParser: SyntaxParserBase;

    let cachedParserMeta: FileParserMeta = this.parsedDocMap[document.uri.toString()];
    if (cachedParserMeta) {
      segParser = cachedParserMeta.segParser;
      syntaxParser = cachedParserMeta.syntaxParser;
      ediType = cachedParserMeta.ediType;
      ediVersion = cachedParserMeta.ediVersion;
      segments = cachedParserMeta.segments;
    } else {
      let tmp = ParserUtils.getSegmentParser(document);
      segParser = tmp.parser;
      ediType = tmp.ediType;
    }

    if (!segParser) {
      //this.fileTypeSelector.refreshStatusBarLabel("UNKNOWN", document.uri);
      return [];
    }

    if (ediType === EdiType.UNKNOWN) {
      //this.fileTypeSelector.refreshStatusBarLabel("UNKNOWN", document.uri);
      return [];
    }

    if (!cachedParserMeta) {
      ediVersion = await segParser.parseReleaseAndVersion();
      segments = await segParser.parseSegments();
      syntaxParser = ParserUtils.getSyntaxParserByUriSmart(ediVersion,segParser.getVersion(), document.uri);
      // save it, regardless if it's null or not.
      this.parsedDocMap[document.uri.toString()] = {
        segParser: segParser,
        syntaxParser: syntaxParser,
        ediType: ediType,
        ediVersion: ediVersion,
        segments: segments
      }
    }

     if (!syntaxParser) {
      return [];
    } else {
      syntaxParser.parse(document, segments);
    }

    this.codeLenses = [];
    for (let seg of segments) {
      let c = new vscode.CodeLens(EdiUtils.getSegmentRange(document, seg));
      c.command = {
        title: this._renderLens(seg),
        //tooltip: "Tooltip provided by sample extension 22",
        //command: "codelens-sample.codelensAction 33",
        command: "",
        //arguments: ["Argument 1", false]
      }

      if (c.command.title != "") {
        this.codeLenses.push(c);
      }

    }


    return this.codeLenses;

  }

  /**
   * Maybe , it's good idea that not using full_path
   * @param seg 
   * @returns 
   */
  private _renderLens(seg: EdiSegment): string {
    let arr: string[] = [];

    if (seg.astNode) {
      let p = seg.astNode.parentNode;
      while (p) {
        if (p.nodeName == "ROOT") {
          break;
        }
        arr.push(p.nodeName +" [" + p.idxInSibling + "]");
        p = p.parentNode;
      }

    }

    if (arr.length == 0) {
      // usually, it's a Segment under Root
      return "";
    } else {
      return arr.reverse().join(" -> ");
    }
  }

  public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
    if (vscode.workspace.getConfiguration(constants.configuration.ediCat).get(constants.configuration.enableCodelens) !== true) {
      return null;
    }

    // codeLens.command = {
    //   title: "Codelens provided by sample extension 11",
    //   tooltip: "Tooltip provided by sample extension 22",
    //   command: "codelens-sample.codelensAction 33",
    //   arguments: ["Argument 1", false]
    // };
    return codeLens;
  }

}
