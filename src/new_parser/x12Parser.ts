import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "./entities";
import { SegmentParserBase, IEdiMessage } from "./segmentParserBase";
import Utils from "../utils/utils";
import { EdiReleaseSchemaSegment, EdiSchema } from "../schemas/schemas";
import * as constants from "../cat_const";

export class X12Parser extends SegmentParserBase {
  public getCustomSegmentParser(segmentId: string): (segment: EdiSegment, segmentStr: string) => EdiSegment {
    if (segmentId === constants.ediDocument.x12.segment.ISA) {
      return (segment, segmentStr) => {
        if (!segmentStr.length) {
          return segment;
        }

        return this.parseSegmentISA(segment, segmentStr);
      };
    }
  }

  parseDelimiters(): EdiDelimiter | null {
    let document = this.document.trim();
    // AST tree will have ROOT has first segment
    // so we need to find ISA
    let isaIdx = document.search("\\bISA"); 
    if (isaIdx) {
      document = document.substring(isaIdx);
    }

    if (!document || document.length < 106 || !document.startsWith(constants.ediDocument.x12.segment.ISA)) {
      return null;
    }

    const separators = new EdiDelimiter();
    separators.dataElementDelimiter = document[3];
    const documentFrags = document.split(separators.dataElementDelimiter);
    if (documentFrags.length < 17) {
      return null;
    }

    separators.segmentDelimiter = documentFrags[16][1]??'~';
    separators.componentElementDelimiter = documentFrags[16][0]??'>';

    return separators;
  }

  public getDefaultDelimiter(): EdiDelimiter {
    const separators = new EdiDelimiter();
    separators.segmentDelimiter = constants.ediDocument.x12.defaultDelimiters.segmentDelimiter;
    separators.dataElementDelimiter = constants.ediDocument.x12.defaultDelimiters.dataElementDelimiter;
    separators.componentElementDelimiter = constants.ediDocument.x12.defaultDelimiters.componentElementDelimiter;
    return separators;
  }

  public async parseReleaseAndVersionInternal(): Promise<EdiVersion> {
    // ISA*00*          *00*          *ZZ*DERICL         *ZZ*TEST01         *210517*0643*U*00401*000007080*0*T*>~
    // GS*PO*DERICL*TEST01*20210517*0643*7080*X*004010~
    // ST*850*0001~
    const ediVersion = new EdiVersion();
    const segments = await this.parseSegments(true);

    // Use GS segment to get edi release because ISA12 is a backward compatible release, see https://stackoverflow.com/questions/55401075/edi-headers-why-would-isa12-and-gs8-both-have-a-version-number
    // Eg: ISA segment version is 00400 while GS segment version is 00401
    const gsSegment = segments.find(s => s.id === constants.ediDocument.x12.segment.GS);
    if (gsSegment && gsSegment.elements && gsSegment.elements.length >= 8) {
      const gsEdiRelease = gsSegment.elements[7].value;
      if (gsEdiRelease && gsEdiRelease.length >= 6) {
        ediVersion.release = gsEdiRelease.substring(0, 5);
      }
    }

    if (!ediVersion.release) {
      const isaSegment = segments.find(s => s.id === constants.ediDocument.x12.segment.ISA);
      if (!isaSegment || !isaSegment.elements || isaSegment.elements.length < 12) {
        return ediVersion;
      }

      ediVersion.release = isaSegment.elements[11].value;
    }

    const stSegment = segments.find(s => s.id === constants.ediDocument.x12.segment.ST);
    if (!stSegment || !stSegment.elements || stSegment.elements.length < 1) {
      return ediVersion;
    }

    ediVersion.version = stSegment.elements[0].value;
    return ediVersion;
  }

  public async parseMessage(): Promise<IEdiMessage | undefined> {
    const segments = await this.parseSegments();
    const isa = segments.find(segment => segment.id === constants.ediDocument.x12.segment.ISA);
    const st = segments.find(segment => segment.id === constants.ediDocument.x12.segment.ST);
    if (!isa || !st) {
      return undefined;
    }

    const ediMessage: X12EdiMessage = new X12EdiMessage();
    ediMessage.segments = segments;

    ediMessage.sender = isa.getElement(6)?.value?.trim();
    ediMessage.senderQualifier = isa.getElement(5)?.value;

    ediMessage.recipient = isa.getElement(8)?.value.trim();
    ediMessage.recipientQualifier = isa.getElement(7)?.value;

    const date = isa.getElement(9)?.value;
    const time = isa.getElement(10)?.value;
    if (date && time) {
      ediMessage.datetime = `${Utils.yyMMddFormat(date)} ${Utils.HHmmFormat(time)}`;
    }

    ediMessage.release = isa.getElement(12)?.value;
    ediMessage.type = st.getElement(1)?.value;

    //this.parseHierachy(ediMessage);
    return ediMessage;
  }


  public getSchemaRootPath(): string {
    return "../schemas/x12";
  }

  
  /**
   * X12 path structure is different to EDIFACT
   * @param ediVersion 
   */
  public  getSchemaPath(ediVersion: EdiVersion): string {
    return `${this.getSchemaRootPath()}/${ediVersion.release}/ANSI_${ediVersion.release}.json`;
  }


  async afterSchemaLoaded(schema: EdiSchema): Promise<void> {
    if (schema.ediReleaseSchema?.segments) {
      schema.ediReleaseSchema.segments[constants.ediDocument.x12.segment.ISA] = EdiReleaseSchemaSegment.ISA;
      schema.ediReleaseSchema.segments[constants.ediDocument.x12.segment.GS] = EdiReleaseSchemaSegment.GS;
      schema.ediReleaseSchema.segments[constants.ediDocument.x12.segment.GE] = EdiReleaseSchemaSegment.GE;
      schema.ediReleaseSchema.segments[constants.ediDocument.x12.segment.IEA] = EdiReleaseSchemaSegment.IEA;
    }
  }

  private parseSegmentISA(segment: EdiSegment, segmentStr: string): EdiSegment {
    if (!segmentStr) {
      return segment;
    }

    this.loadSchema();
    segment.elements = [];
    let cIndex = 3;

    const separators = this.getMessageDelimiters();
    if (segmentStr.endsWith(separators.segmentDelimiter)) {
      segmentStr = segmentStr.substring(0, segmentStr.length - 1);
    }

    const segmentFrags = segmentStr.split(separators.dataElementDelimiter);
    if (segmentFrags.length < 1) {
      return segment;
    }

    segmentFrags.splice(0, 1);
    for (let i = 0; i < segmentFrags.length; i++) {
      const element = new EdiElement();
      element.segmentName = segment.id;
      const segmentFrag = segmentFrags[i];
      element.ediReleaseSchemaElement = this.schema?.ediReleaseSchema?.getSegment(constants.ediDocument.x12.segment.ISA)?.elements[i];
      const elementLength = segmentFrag.length + 1;
      element.value = segmentStr.substring(cIndex + 1, cIndex + elementLength);
      element.trueValue = element.value; // ISA won't do any escape/unescape
      element.type = ElementType.dataElement;
      element.startIndex = cIndex;
      element.endIndex = cIndex + elementLength - 1;
      element.designatorIndex = this.pad(i + 1, 2, "0");
      element.delimiter = this.getMessageDelimiters().dataElementDelimiter;
      segment.elements.push(element);
      cIndex += elementLength;
    }

    return segment;
  }
}

export class X12EdiMessage implements IEdiMessage {
  public sender?: string; // ISA06
  public senderQualifier?: string; // ISA05
  public recipient?: string; // ISA08
  public recipientQualifier?: string; // ISA07

  public datetime?: string; // ISA09 + ISA10

  public type?: string; // ST01, 810,850 ...
  public release?: string; // ISA12
  public segments: EdiSegment[];

  public buildIsaDescription(): string {
    return "TODO: ";
  }

  public buildUNHDescription(): string {
    return "TODO: ";
  }
}
