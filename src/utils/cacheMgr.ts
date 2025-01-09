import { ASTNode, SyntaxParserBase } from "../new_parser/syntaxParserBase";
import { ExtensionContext, TextDocument } from "vscode";
import { EdiSegment, EdiVersion, FileParserMeta } from "../new_parser/entities";
import { SegmentParserBase } from "../new_parser/segmentParserBase";

export class CacheMgr {
  static syntaxParsers: SyntaxParserBase[];
  static extensionContext: ExtensionContext;

  static parsedDocMap: { [key: string]: FileParserMeta }[] = [];
  
  static getParserMeta(strUri: string): FileParserMeta {
    if (CacheMgr.parsedDocMap[strUri]) {
      return CacheMgr.parsedDocMap[strUri];
    } else {
      return new FileParserMeta();
    }
  }
  
  static clearParserMeta(strUri: string): FileParserMeta {
      return CacheMgr.parsedDocMap[strUri] = null;
  }

  // public segParser:SegmentParserBase | undefined;
  // public syntaxParser:SyntaxParserBase;
  // public ediType:string;
  // public ediVersion:EdiVersion;
  // public segments?:EdiSegment[];
  // public astTree?: ASTNode;
  static saveParserMeta(strUri: string, segParser: SegmentParserBase, syntaxParser: SyntaxParserBase
    , ediType: string, ediVersion: EdiVersion, segments: EdiSegment[], astTree: ASTNode) {
    CacheMgr.parsedDocMap[strUri] = {
      segParser: segParser,
      syntaxParser: syntaxParser,
      ediType: ediType,
      ediVersion: ediVersion,
      segments: segments,
      astTree: astTree
    }
  }
}