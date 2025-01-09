import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "./entities";
import { SegmentParserBase, IEdiMessage } from "./segmentParserBase";
import Utils from "../utils/utils";
import { EdiReleaseSchemaSegment, EdiSchema } from "../schemas/schemas";
import * as constants from "../cat_const";

export class EdifactParser extends SegmentParserBase {
    public getCustomSegmentParser(segmentId: string): (segment: EdiSegment, segmentStr: string) => EdiSegment {
        if (segmentId === constants.ediDocument.edifact.segment.UNA) {
            return (segment, segmentStr) => {
                if (segmentStr.length !== 9) {
                    return segment;
                }

                return this.parseSegmentUNA(segment, segmentStr);
            };
        }
    }

    parseDelimiters(): EdiDelimiter | null {
        const document = this.document.trim();
        if (!document || document.length < 9 || !document.startsWith(constants.ediDocument.edifact.segment.UNA)) {
            return null;
        }

        const delimiter = new EdiDelimiter();
        delimiter.segmentDelimiter = document[8];
        delimiter.dataElementDelimiter = document[4];
        delimiter.componentElementDelimiter = document[3];
        delimiter.releaseCharacter = document[6];
        this._delimiters = delimiter;

        return delimiter;
    }

    public getDefaultDelimiter(): EdiDelimiter {
        const Delimiters = new EdiDelimiter();
        Delimiters.segmentDelimiter = constants.ediDocument.edifact.defaultDelimiters.segmentDelimiter;
        Delimiters.dataElementDelimiter = constants.ediDocument.edifact.defaultDelimiters.dataElementDelimiter;
        Delimiters.componentElementDelimiter = constants.ediDocument.edifact.defaultDelimiters.componentElementDelimiter;
        Delimiters.releaseCharacter = constants.ediDocument.edifact.defaultDelimiters.releaseCharacter;
        return Delimiters;
    }

    public async parseReleaseAndVersionInternal(): Promise<EdiVersion> {
        const ediVersion = new EdiVersion();
        let separater = this.escapeCharRegex(this.getMessageDelimiters().segmentDelimiter!);
        let regex = new RegExp(`\\b([\\s\\S]*?)(${separater})`, "g");
        let unhStr: string | undefined = undefined;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(this.document)) !== null) {
            if (match[0].startsWith(constants.ediDocument.edifact.segment.UNH)) {
                unhStr = match[0];
                break;
            }
        }

        if (!unhStr) {
            return ediVersion;
        }

        // UNH+1+ORDERS:D:96A:UN'
        // UNH+1+ORDERS:D:01B:UN:EAN009'
        const segmentFrags: string[] = unhStr.split(/[+:]/);
        if (segmentFrags.length >= 3) {
            ediVersion.version = segmentFrags[2];
        }

        if (segmentFrags.length >= 5) {
            ediVersion.release = segmentFrags[3] + segmentFrags[4];
        }
        if (segmentFrags[5]) {
            ediVersion.controllingAgency = segmentFrags[5];
        }
        if (segmentFrags[6]) {
            ediVersion.AssociationAssignedCode = segmentFrags[6];
        }

        return ediVersion;
    }

    public async parseMessage(): Promise<IEdiMessage | undefined> {
        const segments = await this.parseSegments();
        const unb = segments.find(segment => segment.id === constants.ediDocument.edifact.segment.UNB);
        const unh = segments.find(segment => segment.id === constants.ediDocument.edifact.segment.UNH);
        if (!unb || !unh) {
            return undefined;
        }

        const ediMessage: EdifactEdiMessage = new EdifactEdiMessage();
        ediMessage.segments = segments;

        ediMessage.sender = unb.getElement(2, 1)?.value;
        ediMessage.senderQualifier = unb.getElement(2, 2)?.value;

        ediMessage.recipient = unb.getElement(3, 1)?.value;
        ediMessage.recipientQualifier = unb.getElement(3, 2)?.value;

        const date = unb.getElement(4, 1)?.value;
        const time = unb.getElement(4, 2)?.value;
        if (date && time) {
            ediMessage.datetime = `${Utils.yyMMddFormat(date)} ${Utils.HHmmFormat(time)}`;
        }

        ediMessage.communicationsAgreementID = unb.getElement(10)?.value;
        ediMessage.testIndicator = unb.getElement(11)?.value;

        ediMessage.referenceNumber = unh.getElement(1)?.value;
        ediMessage.type = unh.getElement(2, 1)?.value;
        ediMessage.release = `${unh.getElement(2, 2)?.value}${unh.getElement(2, 3)?.value}`;

        return ediMessage;
    }

    public getSchemaRootPath(): string {
        return "../schemas/edifact";
    }

    /**
     * X12 path structure is different to EDIFACT
     * @param ediVersion 
     */
    public getSchemaPath(ediVersion: EdiVersion): string {
        if (ediVersion.AssociationAssignedCode && ediVersion.AssociationAssignedCode.startsWith('EAN')) {
            // EANCOM
            return `${this.getSchemaRootPath()}/EAN/${ediVersion.release}/EAN_${ediVersion.release}.json`;
        } else {
            // UN/EDIFACT
            return `${this.getSchemaRootPath()}/UN/${ediVersion.release}/UN_${ediVersion.release}.json`;
        }
    }

    async afterSchemaLoaded(schema: EdiSchema): Promise<void> {
        const unh = schema.ediReleaseSchema?.getSegment(constants.ediDocument.edifact.segment.UNH);
        if (unh) {
            unh.desc = "Message header";
        }

        const unt = schema.ediReleaseSchema?.getSegment(constants.ediDocument.edifact.segment.UNT);
        if (unt) {
            unt.desc = "Message trailer";
        }

        if (schema.ediReleaseSchema?.segments) {
            schema.ediReleaseSchema.segments[constants.ediDocument.edifact.segment.UNA] = EdiReleaseSchemaSegment.UNA;
            schema.ediReleaseSchema.segments[constants.ediDocument.edifact.segment.UNB] = EdiReleaseSchemaSegment.UNB;
            schema.ediReleaseSchema.segments[constants.ediDocument.edifact.segment.UNZ] = EdiReleaseSchemaSegment.UNZ;
        }
    }

    private parseSegmentUNA(segment: EdiSegment, segmentStr: string): EdiSegment {
        this.loadSchema();
        segment.elements = [];
        if (segmentStr.length !== 9) {
            return segment;
        }

        const ediMessageDelimiters = new EdiDelimiter();
        ediMessageDelimiters.segmentDelimiter = segmentStr[8];
        ediMessageDelimiters.dataElementDelimiter = segmentStr[4];
        ediMessageDelimiters.componentElementDelimiter = segmentStr[3];
        ediMessageDelimiters.releaseCharacter = segmentStr[6];
        this._delimiters = ediMessageDelimiters;

        for (let i = 0; i < 5; i++) {
            const element = new EdiElement();
            element.segmentName = segment.id;
            element.value = segmentStr[i + 3];
            element.trueValue = element.value;
            element.ediReleaseSchemaElement = this.schema?.ediReleaseSchema?.getSegment(constants.ediDocument.edifact.segment.UNA)?.elements[i];
            element.type = ElementType.dataElement;
            element.startIndex = i + 3;
            element.endIndex = i + 3;
            element.designatorIndex = this.pad(i + 1, 2, "0");
            element.delimiter = "";
            segment.elements.push(element);
        }

        return segment;
    }
}

export class EdifactEdiMessage implements IEdiMessage {
    public sender?: string; // UNB02-01
    public senderQualifier?: string; // UNB02-02
    public recipient?: string; // UNB03-01
    public recipientQualifier?: string; // UNB03-02

    public datetime?: string; // UNB04-01 + UNB04-02
    public communicationsAgreementID?: string; // UNB10
    public testIndicator?: string; // UNB11

    public referenceNumber?: string; // UNH01
    public type?: string; // UNH02-01
    public release?: string; // UNH02-02 + UNH02-03
    public segments: EdiSegment[];

    public buildMessageDescriptions(): string[] {
        const descriptions: string[] = [];
        let sender: string | undefined = this.sender?.trim();
        let recipient: string | undefined = this.recipient?.trim();

        if (sender) {
            if (this.senderQualifier) {
                sender += `(${this.senderQualifier})`;
            }
        } else {
            sender = "Unknown";
        }

        if (recipient) {
            if (this.recipientQualifier) {
                recipient += `(${this.recipientQualifier})`;
            }
        } else {
            recipient = "Unknown";
        }

        descriptions.push(`From ${sender} to ${recipient} at ${this.datetime}`);

        let part2 = "";
        if (this.release && this.type) {
            const segDef = Utils.getD96A_SegInfo(this.type);
            if (segDef) {
                part2 = `${this.release}-${this.type}(${segDef.name}): ${segDef.desc}`;
            } else {
                part2 = `${this.release}-${this.type}`;
            }
        } else if (this.type) {
            const segDef = Utils.getD96A_SegInfo(this.type);
            if (segDef) {
                part2 = `${this.type}(${segDef.name}): ${segDef.desc}`;
            } else {
                part2 = `${this.type}`;
            }
        }

        if (part2) {
            descriptions.push(part2);
        }

        return descriptions;
    }
}
