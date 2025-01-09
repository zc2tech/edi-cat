import * as vscode from "vscode";
import { EdiVersion, EdiElement, EdiSegment, EdiType, FileParserMeta } from "../new_parser/entities";
import { StringBuilder } from "../utils/utils";
import { EdiUtils } from "../utils/ediUtils";
import { ParserUtils } from "../utils/parserUtils";
import { SegmentParserBase } from "../new_parser/segmentParserBase";
import * as constants from "../cat_const";
import { ASTNode, SyntaxParserBase } from "../new_parser/syntaxParserBase";
import { DocInfoBase } from "../info/docInfoBase";
import { CacheMgr } from "../utils/cacheMgr";
import { ParserUtilsEancom } from "../utils/parserUtilsEancom";
import { ParserUtilsBase } from "../utils/parserUtilsBase";



export abstract class HoverProviderBase implements vscode.HoverProvider {
  parsedDocMap: { [key: string]: FileParserMeta }[];

  async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | undefined | null> {
    if (vscode.workspace.getConfiguration(constants.configuration.ediCat).get(constants.configuration.enableHover) !== true) {
      return null;
    }

    if (!EdiUtils.checkLength(document)) {      
      return;
    }

    let ediType: string;
    let segParser: SegmentParserBase | undefined;
    let ediVersion: EdiVersion;
    let syntaxParser: SyntaxParserBase;
    let segments: EdiSegment[];
    let astTree: ASTNode;

    // if (ParserUtils.isASTOutput(document)) {
    //   return;
    // }

    let cachedParserMeta: FileParserMeta = CacheMgr.getParserMeta(document.uri.toString());
    segParser = cachedParserMeta.segParser;
    ediType = cachedParserMeta.ediType;
    ediVersion = cachedParserMeta.ediVersion;
    syntaxParser = cachedParserMeta.syntaxParser;
    segments = cachedParserMeta.segments;
    astTree = cachedParserMeta.astTree;
    if (!segParser) {
      let tmp = ParserUtils.getSegmentParser(document);
      segParser = tmp.parser;
      ediType = tmp.ediType;
    }

    // still not exist
    if (!segParser) {
      return null;
    }

    if (!segments) {
      ediVersion = await segParser.parseReleaseAndVersion();
      segments = await segParser.parseSegments();
    }

    if (!syntaxParser) {

      // not exist in cache
      if (ParserUtils.isASTOutput(document.getText())) {
        // it's a AST Document
          syntaxParser = ParserUtils.getSyntaxParserSmart(ediVersion,segParser.getVersionKey());        
      } else {
          syntaxParser = ParserUtils.getSyntaxParserByUriSmart(ediVersion,segParser.getVersion(), document.uri);        
      }
    }

    // still not exist
    if (!syntaxParser) {
      return null;
    }

    if (!astTree) {
      // create hierarchy info for segments
      syntaxParser.parse(document, segments);
      astTree = syntaxParser.getAstTree();

      // save point
      CacheMgr.saveParserMeta(document.uri.toString(), segParser, syntaxParser, ediType, ediVersion, segments, astTree);
    }

    let realPosition = document.offsetAt(
      new vscode.Position(position.line, position.character)
    );
    let selectedSegment = segments.find(x => realPosition >= x.startIndex && realPosition <= (x.endIndex + 1));

    if (!selectedSegment?.elements || selectedSegment?.elements?.length <= 0) {
      return null;
    }

    const selectedElement = selectedSegment?.elements.find(x => realPosition >= (selectedSegment!.startIndex + x.startIndex) && realPosition <= (selectedSegment!.startIndex + x.endIndex + 1));
    if (!selectedElement) {
      return new vscode.Hover(this.buildSegmentMarkdownString(ediType, ediVersion, selectedSegment));
    }
    let selectedComponentElement: EdiElement | undefined = undefined;
    if (selectedElement?.ediReleaseSchemaElement?.isComposite()) {
      selectedComponentElement = selectedElement?.components.find(x => realPosition >= (selectedSegment!.startIndex + x.startIndex) && realPosition <= (selectedSegment!.startIndex + x.endIndex + 1));
    }

    if (!selectedElement) {
      return null;
    }

    if (selectedComponentElement) {
      return new vscode.Hover(
          this.buildElementMarkdownString(syntaxParser.docInfo, ediType, ediVersion, selectedSegment, selectedComponentElement,selectedElement.ediReleaseSchemaElement.id));
    } else {
      return new vscode.Hover(
          this.buildElementMarkdownString(syntaxParser.docInfo, ediType, ediVersion, selectedSegment, selectedElement,""));
    }
  }

  public abstract getLanguageName(): string;

  private buildSegmentMarkdownString(ediType: EdiType, ediVersion: EdiVersion, segment: EdiSegment): vscode.MarkdownString[] {
    const part2MdSb = new StringBuilder();
    if (segment?.ediReleaseSchemaSegment?.desc) {
      part2MdSb.append(`**${segment.ediReleaseSchemaSegment.desc}**\n\n`);
    }
    if (segment?.ediReleaseSchemaSegment?.purpose) {
      part2MdSb.append(`${segment.ediReleaseSchemaSegment.purpose}\n\n`);
    }
    //part2MdSb.append(`\`\`\`${this.getLanguageName()}\n${segment}\n\`\`\``);
    const mdStrings: vscode.MarkdownString[] = [
      new vscode.MarkdownString(
        `**${segment.id}** (Segment)`
      ),
      new vscode.MarkdownString(part2MdSb.toString()),
    ];

    return mdStrings;
  }

  private formatUsage(usage: {}, currentValue: string): string {
    const sb = new StringBuilder();
    const spanStartNormal = `<span style="color:#87CEFA;">`;
    const spanStartHighlight = `<span style="color:#f4f40b;background-color:#666;">`;
    const spanEnd = `</span>`;
    let comment: string = "";
    //sb.append(`<p style="line-height: 1px">`);
    //let keys = Object.keys(usage);
    for (let key in usage) {
      let spanStart: string = "";
      if (key === "comment") {
        comment = usage[key];
        continue;
      }
      if (key.toUpperCase() === currentValue.toUpperCase()) {
        spanStart = spanStartHighlight;
      } else {
        spanStart = spanStartNormal;
      }
      sb.append(`\n\n`);
      sb.append(`${spanStart}<b>${key}</b>`);
      if (usage[key] !== "") {
        sb.append(`: ${usage[key]}`); // pure key list would not add these chars
      }
      sb.append(`${spanEnd} `);
    }
    //sb.append(`</p>`);
    if (comment !== "") {
      return `\n\n` + comment + `\n\n` + sb.toString();
    } else {
      return sb.toString();
    }
  }

  /**
   * 
   * @param docInfo 
   * @param ediType 
   * @param ediVersion 
   * @param segment 
   * @param element 
   * @param EleId Only when element is component, we need to know the parent Element ID, like: S002 or S003
   * @returns 
   */
  private buildElementMarkdownString(docInfo: DocInfoBase, ediType: EdiType, ediVersion: EdiVersion,
    segment: EdiSegment, element: EdiElement, EleId:String): vscode.MarkdownString[] {

    const mdStrings: vscode.MarkdownString[] = [];
    const part1MdSb = new StringBuilder();
    part1MdSb.append(`**${segment.id}**${element.designatorIndex} (Element)`);
    if (element?.ediReleaseSchemaElement) {
      if (element.ediReleaseSchemaElement.id !== undefined) {
        part1MdSb.append(`\n\n\`Id ${element.ediReleaseSchemaElement.id}\``);
      }
      if (element.ediReleaseSchemaElement.dataType !== undefined) {
        part1MdSb.append(` \`Type ${element.ediReleaseSchemaElement.dataType}\``);
      }
      if (element.ediReleaseSchemaElement.minLength !== undefined && element.ediReleaseSchemaElement.maxLength !== undefined) {
        part1MdSb.append(` \`Min ${element.ediReleaseSchemaElement.minLength} / Max ${element.ediReleaseSchemaElement.maxLength}\``);
      }

      let usage = docInfo ? docInfo.getUsage(segment, element) : false;
      if (usage) {
        part1MdSb.append(this.formatUsage(usage, element.value));
      }
    }

    const part2MdSb = new StringBuilder();
    let comment = docInfo ? docInfo.getComment(segment, element) : false;
    if (comment) {
      part2MdSb.append(`${comment}\n\n`);
    } else {
      if (element?.ediReleaseSchemaElement) {
        if (element.ediReleaseSchemaElement.desc) {
          part2MdSb.append(`**${element.ediReleaseSchemaElement.desc}**\n\n`);
        }
        if (element.ediReleaseSchemaElement.definition) {
          part2MdSb.append(`${element.ediReleaseSchemaElement.definition}\n\n`);
        }
      }
    }

    let mdStr01 = new vscode.MarkdownString();
    let mdStr02 = new vscode.MarkdownString();
    mdStr02.isTrusted = true;
    mdStr01.supportHtml = true;
    mdStr01.appendMarkdown(part1MdSb.toString());
    mdStr02.appendMarkdown(part2MdSb.toString());
    mdStrings.push(mdStr01);
    mdStrings.push(mdStr02);

    return mdStrings;
  }

}
