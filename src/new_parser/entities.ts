import { EdiReleaseSchemaElement, EdiReleaseSchemaSegment } from "../schemas/schemas";
import * as constants from "../cat_const";
import { ASTNode, SyntaxParserBase } from "./syntaxParserBase";
import { SegmentParserBase } from "./segmentParserBase";

export class EdiVersion {
    public release?: string; // D96A
    public version?: string; // ORDERS
    public controllingAgency?: string; // UN
    public AssociationAssignedCode?: string; // undefined, EAN009 , EAN008 , etc

    constructor(release?: string, version?: string) {
        this.release = release;
        this.version = version;
    }
}

export class FileParserMeta {
    public segParser: SegmentParserBase | undefined;
    public syntaxParser: SyntaxParserBase;
    public ediType: string;
    public ediVersion: EdiVersion;
    public segments?: EdiSegment[];
    public astTree?: ASTNode;
}

export class EdiSegment {
    public startIndex: number;
    public endIndex: number;
    public length: number;
    public id: string;
    public elements: Array<EdiElement>;
    public endingDelimiter: string;
    public ediReleaseSchemaSegment?: EdiReleaseSchemaSegment;
    public parentLayerIds: string[]; // translated from newStatusDFA
    public newStatusDFA: string = ""; // After fed successfully, the current status of Segment.
    public astNode?: ASTNode;

    public toString() {
        return `${this.id}${this.elements.join("")}${this.endingDelimiter}`;
    }

    public translateToLayerIds() {
        if (this.newStatusDFA == "" || this.newStatusDFA.startsWith("ROOT")) {
            //  ROOT_UNA, ROOT_BGM
            this.parentLayerIds = [];
            return;
        }
        let withLastSeg = this.newStatusDFA.split('_'); // like SG26_LIN ...
        let pureParents = withLastSeg.slice(0, withLastSeg.length - 1);
        this.parentLayerIds = Array.from(pureParents);


    }

    public getElement(elementIndex: number, componentIndex: number | undefined = undefined): EdiElement | null {
        if (!this.elements || this.elements.length <= 0) {
            return null;
        }
        const element = this.elements[elementIndex - 1];
        if (!element) {
            return null;
        }
        if (componentIndex === undefined) {
            return element;
        }
        if (!element.components || element.components.length <= 0) {
            return null;
        }
        const component = element.components[componentIndex - 1];
        if (!component) {
            return null;
        }
        return component;
    }

    /**
     * Without using componentIndex, 102 means: element 1, component 2
     * 
     */
    public getElement2(idx: number): EdiElement | null {
        let eleIdx: number;
        let compIdx: number;
        if (idx >= 100) {
            // it contains component id
            eleIdx = Math.floor(idx / 100);
            compIdx = idx % 100;
        } else {
            eleIdx = idx;
            compIdx = undefined;
        }
        return this.getElement(eleIdx, compIdx);
    }

}



export enum ElementType {
    dataElement = "Data Element",
    componentElement = "Component Element"
}

export class DiagnosticError {
    error: string;
    code: string;
    constructor(error: string, code: string) {
        this.error = error;
        this.code = `EDI Cat: ${code}`;
    }
}

export interface DiagnoscticsContext {
    segment: EdiSegment;
    element: EdiElement;
    ediType: string;
    segments: EdiSegment[];
    ediVersion: EdiVersion;
}

export class EdiElement {
    public type: ElementType;
    public value: string;
    public trueValue: string; // rendered escape chars. ?: => : , ?+ => + ...
    public startIndex: number;
    public delimiter: string;
    public endIndex: number;
    public designatorIndex: string;
    public segmentName: string;
    public usage: string;
    public components: EdiElement[];
    //public lastCompIdx:number = 0; // based on 1, so 0 is init status
    public ediReleaseSchemaElement?: EdiReleaseSchemaElement;

    public getDesignator(): string {
        return `${this.segmentName}${this.designatorIndex}`;
    }

    public getDesignatorWithId(): string {
        const elementId = this.ediReleaseSchemaElement?.id;
        if (!elementId) {
            return this.getDesignator();
        }

        return `${this.getDesignator()}(${elementId})`;
    }

    /**
     * sample: 1001, 1004, 1225
     * @returns 
     */
    public getSchemaId(): string {
        return this.ediReleaseSchemaElement?.id;
    }

    public checkSegErrors(context: DiagnoscticsContext): DiagnosticError[] {
        const errors = this.getCustomElementErrors(context);

        if (this.components && this.components.length > 0) {
            return this.components.reduce((errors: DiagnosticError[], component: EdiElement) => {
                return errors.concat(component.checkSegErrors(context));
            }, errors);
        }

        if (!this.ediReleaseSchemaElement) {
            return errors;
        }

        if (this.trueValue && this.trueValue.length > this.ediReleaseSchemaElement.maxLength) {
            errors.push(
                new DiagnosticError(
                    `Element ${this.ediReleaseSchemaElement?.id} is too long. Max length is ${this.ediReleaseSchemaElement.maxLength}, got ${this.trueValue.length}.`,
                    "Value too long"
                )
            );
        }

        if (this.trueValue && this.trueValue.length < this.ediReleaseSchemaElement.minLength) {
            errors.push(
                new DiagnosticError(
                    `Element ${this.ediReleaseSchemaElement?.id} is too short. Min length is ${this.ediReleaseSchemaElement.minLength}, got ${this.trueValue.length}.`,
                    "Value too short"
                )
            );
        }

        if (this.ediReleaseSchemaElement?.required && !this.value) {
            errors.push(
                new DiagnosticError(
                    `Element ${this.ediReleaseSchemaElement?.id} is required.`,
                    "Value required"
                )
            );
        }

        if (this.ediReleaseSchemaElement.qualifierRef && this.value) {
            const codes = this.ediReleaseSchemaElement.getCodes();
            if (codes) {
                const elementValueCode = this.ediReleaseSchemaElement.getCodeOrNullByValue(this.value);
                if (!elementValueCode) {
                    errors.push(
                        new DiagnosticError(
                            `Invalid code value '${this.value}' for qualifer '${this.ediReleaseSchemaElement.qualifierRef}'.`,
                            "Qualifier invalid code"
                        )
                    );
                }
            }
        }

        return errors;
    }

    getCustomElementErrors(context: DiagnoscticsContext): DiagnosticError[] {
        const errors: DiagnosticError[] = [];
        if (context.ediType === EdiType.X12) {
            if (context.element.getDesignator() === "SE01") {
                errors.push(...this.getErrors_SE01(context));
            }
        } else if (context.ediType === EdiType.EDIFACT) {
            if (context.element.getDesignator() === "UNT01") {
                errors.push(...this.getErrors_UNT01(context));
            }
            if (context.ediVersion.version === 'ORDRSP' && context.element.getDesignator() === "UNZ01") {
                if (context.element.value !== '1') {
                    errors.push(
                        new DiagnosticError(
                            `Multiple-Transaction ORDRSP is not supported`,
                            "UNZ01 value must be 1."
                        )
                    );
                }
            }
        }

        return errors;
    }

    getErrors_SE01(context: DiagnoscticsContext): DiagnosticError[] {
        const errors: DiagnosticError[] = [];
        const startSegmentIndex = context.segments.findIndex(segment => segment.id === "ST");
        if (startSegmentIndex === -1) {
            return errors;
        }

        const endSegmentIndex = context.segments.findIndex(segment => segment === context.segment);
        if (startSegmentIndex === -1) {
            return errors;
        }
        // To indicate the end of the transaction set and provide the count of the transmitted segments (including the beginning (ST) and ending (SE) segments)
        const valueExpected = (endSegmentIndex - startSegmentIndex + 1).toString();
        if (context.element.value !== valueExpected) {
            errors.push(
                new DiagnosticError(
                    `${valueExpected} is expected, got ${this.value}. There are ${valueExpected} transmitted segments in the message.`,
                    "Wrong SE01 value"
                )
            );
        }

        return errors;
    }

    getErrors_UNT01(context: DiagnoscticsContext): DiagnosticError[] {
        const errors: DiagnosticError[] = [];
        const startSegmentIndex = context.segments.findIndex(segment => segment.id === "UNH");
        if (startSegmentIndex === -1) {
            return errors;
        }

        const endSegmentIndex = context.segments.findIndex(segment => segment === context.segment);
        if (startSegmentIndex === -1) {
            return errors;
        }
        // Control count of number of segments in a message.
        const valueExpected = (endSegmentIndex - startSegmentIndex + 1).toString();
        if (context.element.value !== valueExpected) {
            errors.push(
                new DiagnosticError(
                    `${valueExpected} is expected, got ${this.value}. There are ${valueExpected} transmitted segments in the message.`,
                    "Wrong UNT01 value"
                )
            );
        }

        return errors;
    }

    public isComposite(): boolean {
        return this.components && this.components.length > 0;
    }

    public toString() {
        return this.delimiter + this.value;
    }
}

export class EdiDelimiter {
    public segmentDelimiter?: string;
    public dataElementDelimiter?: string;
    public componentElementDelimiter?: string;
    public releaseCharacter?: string; // escape char
}

export class EdiType {
    static X12 = constants.ediDocument.x12.name;
    static EDIFACT = constants.ediDocument.edifact.name;
    static EDIDAT = constants.ediDocument.edidat.name;
    static SCC = constants.ediDocument.scc.name;
    static UNKNOWN = "unknown";
}

export class ConvertErr {
    ediType: EdiType;
    segName: string;
    index: number; // index in EdiSegment, so it's based on 1
    msg?: string;
    // constructor(ediType:EdiType,segName: string, index: number) {
    //   this.ediType = ediType;
    //   this.segName = segName;
    //   this.index = index;
    // }
    constructor(segName: string, index: number) {
        //this.ediType = ediType;
        this.segName = segName;
        this.index = index;
    }
}
