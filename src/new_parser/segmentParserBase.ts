import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "./entities";
import * as vscode from "vscode";
import { EdiSchema } from "../schemas/schemas";
import * as constants from "../cat_const";
import Utils from "../utils/utils";
//import {EdiHierarchy} from "./_ediHierarchy";
import { DiagORDRSP } from "../diagnostics/versions/diagORDRSP";
import { Diag850 } from "../diagnostics/versions/diag850";
import { promises } from "dns";
import { ParserUtils } from "../utils/parserUtils";
import { EdiUtils } from "../utils/ediUtils";

export abstract class SegmentParserBase {
    private _segments: EdiSegment[];
    private _ediVersion: EdiVersion;
    private _vsdocument: vscode.TextDocument
    // private _ediHierarchy: EdiHierarchy;
    document: string;
    schema: EdiSchema;
    _delimiters?: EdiDelimiter;

    _parsingRleaseAndVersion?: boolean = false;
    public constructor(document: string) {
        this.document = document;
    }

    public async parseReleaseAndVersion(): Promise<EdiVersion> {
        if (this._parsingRleaseAndVersion) {
            return;
        }

        if (!this._ediVersion) {
            this._parsingRleaseAndVersion = true;
            try {
                this._ediVersion = await this.parseReleaseAndVersionInternal();
            } finally {
                this._parsingRleaseAndVersion = false;
            }
        }

        return this._ediVersion;
    }

    public getVersion(): string {
        return this._ediVersion.version;
    }

    public isVersion(ver: string): boolean {
        if (this._ediVersion && this._ediVersion.version && this._ediVersion.version == ver) {
            return true;
        }
        return false;
    }

    public isRelease(release: string): boolean {
        if (this._ediVersion && this._ediVersion.release && this._ediVersion.release == release) {
            return true;
        }
        return false;
    }

    public abstract parseReleaseAndVersionInternal(): Promise<EdiVersion>

    public abstract parseMessage(): IEdiMessage | undefined;

    public async parseSegments(force: boolean = false): Promise<EdiSegment[]> {
        if (force) {
            return await this.parseSegmentsInternal();
        }

        if (!this._segments) {
            this._segments = await this.parseSegmentsInternal();
        }

        // // TODO:we are using parser in diagnostics folder
        // this._ediHierarchy.parseHierarchy(this._segments);
        return this._segments;
    }

    /**
     * Only for AST Content, which has header like "ROOT_X12.830.In"
     * @returns 
     */
    public getVersionKey(): string {
        const strStart = `_`;
        const strEnd = this.getMessageDelimiters().segmentDelimiter!;
        const iStart = this.document.indexOf(strStart);
        const iEnd = this.document.indexOf(strEnd);
        if (iEnd - iStart < 30) {
            // reasonable
            return this.document.substring(iStart + 1, iEnd);
        }
    }

    private async parseSegmentsInternal(): Promise<EdiSegment[]> {
        const separater = this.escapeCharRegex(this.getMessageDelimiters().segmentDelimiter!);
        const releaseCharacter = this.escapeCharRegex(this.getMessageDelimiters().releaseCharacter!);

        // currently, we only use first 4 chars to determine if it's ASTOutput
        const isASTOutput = ParserUtils.isASTOutput(this.document);
        let regexPattern: string;
        if (releaseCharacter) {
            regexPattern = `\\b([\\s\\S]*?)((?<!${releaseCharacter})${separater})`;
        } else {
            regexPattern = `\\b([\\s\\S]*?)(${separater})`;
        }
        const regex = new RegExp(regexPattern, "g");
        const results: EdiSegment[] = [];
        let match: RegExpExecArray | null;
        while ((match = regex.exec(this.document)) !== null) {
            try {
                const ediSegment = await this.parseSegment(match[0], match.index, match.index + match[0].length - 1, match[2]);
                if (ediSegment && ediSegment.elements.length > 0) {
                    results.push(ediSegment);
                }
            } catch (ex) {
                console.error(constants.errors.segmentParseError, match[0], '\r\n', ex);
            }
        }
        return results;
    }

    public async parseSegment(segmentStr: string, startIndex: number, endIndex: number,
        endingDelimiter: string): Promise<EdiSegment> {
        await this.loadSchema();

        const segment = new EdiSegment();
        segment.endingDelimiter = endingDelimiter;
        segment.startIndex = startIndex;
        segment.endIndex = endIndex;
        segment.length = segmentStr.length;

        const firstElementDelimiterIndex = /\W/.exec(segmentStr)?.index ?? segmentStr.length - 1;
        segment.id = segmentStr.substring(0, firstElementDelimiterIndex);
        segment.elements = [];

        segment.ediReleaseSchemaSegment = this.schema?.ediReleaseSchema?.getSegment(segment.id);

        const customSegmentParser = this.getCustomSegmentParser(segment.id);
        if (customSegmentParser) {
            return customSegmentParser(segment, segmentStr);
        }

        let element: EdiElement | undefined = undefined;
        let subElement: EdiElement | undefined = undefined;
        let elementIndex = 0;
        let subElementIndex = 0;
        let elementDesignator: string | undefined = undefined;
        const { segmentDelimiter, dataElementDelimiter, componentElementDelimiter, releaseCharacter } = this.getMessageDelimiters();
        for (let i = segment.id.length; i < segmentStr.length; i++) {
            const isSegmentDelimiter = SegmentParserBase.isCharWithoutEscape(segmentStr, i, segmentDelimiter, releaseCharacter);
            const isDataElementDelimiter = SegmentParserBase.isCharWithoutEscape(segmentStr, i, dataElementDelimiter, releaseCharacter);
            const isComponentElementDelimiter = SegmentParserBase.isCharWithoutEscape(segmentStr, i, componentElementDelimiter, releaseCharacter);
            if (isDataElementDelimiter || isSegmentDelimiter) {
                if (element) {
                    element.endIndex = i - 1;
                    element.value = segmentStr.substring(element.startIndex + 1, element.endIndex + 1);
                    element.trueValue = EdiUtils.unescapeEdi(element.value, releaseCharacter);
                    element = undefined;
                }

                if (subElement) {
                    subElement.endIndex = i - 1;
                    subElement.value = segmentStr.substring(subElement.startIndex + 1, subElement.endIndex + 1);
                    subElement.trueValue = EdiUtils.unescapeEdi(subElement.value, releaseCharacter);
                    subElement = undefined;
                }

                subElementIndex = 0;
            } else if (isComponentElementDelimiter) {
                if (subElement) {
                    subElement.endIndex = i - 1;
                    subElement.value = segmentStr.substring(subElement.startIndex + 1, subElement.endIndex + 1);
                    subElement.trueValue = EdiUtils.unescapeEdi(subElement.value, releaseCharacter);
                    subElement = undefined;
                }
            }

            if (isDataElementDelimiter) {
                elementIndex++;
                element = new EdiElement();
                element.ediReleaseSchemaElement = segment.ediReleaseSchemaSegment?.elements[elementIndex - 1];
                element.type = ElementType.dataElement;
                element.startIndex = i;
                element.designatorIndex = this.pad(elementIndex, 2, "0");
                elementDesignator = element.designatorIndex;
                element.delimiter = dataElementDelimiter;
                element.segmentName = segment.id;
                segment.elements.push(element);
                if (element.ediReleaseSchemaElement?.isComposite()) {
                    const nextC: string = i < segmentStr.length - 1 ? segmentStr[i + 1] : undefined;
                    const isElementValueEmpty = nextC === dataElementDelimiter || nextC === segmentDelimiter || nextC === undefined;
                    if (!isElementValueEmpty) {
                        element.components = [];
                        subElementIndex++;
                        subElement = new EdiElement();
                        subElement.type = ElementType.componentElement;
                        subElement.startIndex = i;
                        subElement.designatorIndex = `${elementDesignator}${this.pad(subElementIndex, 2, "0")}`;
                        subElement.segmentName = segment.id;
                        subElement.delimiter = dataElementDelimiter;
                        subElement.ediReleaseSchemaElement = segment.ediReleaseSchemaSegment?.elements[elementIndex - 1]?.components[subElementIndex - 1];
                        element.components = element.components || [];
                        element.components.push(subElement);
                    }
                }
            } else if (isComponentElementDelimiter) {
                subElementIndex++;
                subElement = new EdiElement();
                subElement.type = ElementType.componentElement;
                subElement.startIndex = i;
                subElement.designatorIndex = `${elementDesignator}${this.pad(subElementIndex, 2, "0")}`;
                subElement.segmentName = segment.id;
                subElement.delimiter = componentElementDelimiter;
                subElement.ediReleaseSchemaElement = segment.ediReleaseSchemaSegment?.elements[elementIndex - 1]?.components[subElementIndex - 1];
                element!.components = element!.components || [];
                element!.components.push(subElement);
            }
        }

        return segment;
    }

    private static isCharWithoutEscape(str: string, i: number, char: string, escapeChar: string): boolean {
        if (i < 0 || i >= str.length) return false;
        if (i === 0 || !escapeChar) {
            return str[i] === char;
        }

        return str[i] === char && str[i - 1] !== escapeChar;
    }

    public abstract getCustomSegmentParser(segmentId: string): ((segment: EdiSegment, segmentStr: string) => EdiSegment) | undefined;

    public setEdiVersion(ediVersion: EdiVersion) {
        this._ediVersion = ediVersion;
    }

    public getMessageDelimiters(): EdiDelimiter {
        if (!this._delimiters) {
            this._delimiters = this.parseDelimiters();
        }

        if (!this._delimiters) {
            return this.getDefaultDelimiter();
        }

        return this._delimiters;
    }

    public setMessageDelimiters(delimiters: EdiDelimiter): void {
        this._delimiters = delimiters;
    }

    abstract parseDelimiters(): EdiDelimiter | null;

    public abstract getDefaultDelimiter(): EdiDelimiter;

    private async parseRegex<T>(exp: RegExp, str: string, selector: (match: RegExpExecArray) => Promise<T>): Promise<Array<T>> {
        const results: Array<T> = [];
        let match: RegExpExecArray | null;
        while ((match = exp.exec(str)) !== null) {
            results.push(await selector(match));
        }
        return results;
    }

    public abstract getSchemaRootPath(): string;

    public abstract getSchemaPath(ediVersion: EdiVersion): string;
    async loadSchema(): Promise<void> {
        if (this.schema) {
            return;
        }

        const ediVersion = await this.parseReleaseAndVersion();
        if (!ediVersion || !ediVersion.release) {
            return;
        }

        let releaseSchema = null;
        try {
            // for debug
            const str = this.getSchemaPath(ediVersion);
            releaseSchema = await import(str);
        } catch (ex) {
            console.error(Utils.formatString(constants.errors.importSchemaError, ediVersion.release), ex);
            return;
        }
        const ediSchema = new EdiSchema(releaseSchema);
        this.afterSchemaLoaded(ediSchema);
        this.schema = ediSchema;
    }

    abstract afterSchemaLoaded(schema: EdiSchema): Promise<void>;

    escapeCharRegex(str: string | undefined | null): string {
        if (str === undefined || str === null) {
            return str;
        }

        return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    }

    pad(n: number, width: number, z: string = '0') {
        const nStr = n.toString() + '';
        return nStr.length >= width ? nStr : new Array(width - nStr.length + 1).join(z) + nStr;
    }
}

export interface IEdiMessage {
}
