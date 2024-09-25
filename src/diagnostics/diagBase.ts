import * as vscode from "vscode";
import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../new_parser/entities";
import { EdiUtils } from "../utils/ediUtils";
export abstract class DiagBase {
    protected _document: vscode.TextDocument;
    protected _segs: EdiSegment[];
    protected _ediVersion: EdiVersion;
    constructor(document,segs:EdiSegment[],ediVersion:EdiVersion) {
        this._document = document;
        this._segs = segs;
        this._ediVersion = ediVersion;
    }


    /**
     * If we have special check , like N9_CUR should be mandatory,
     * Use custom Diagnose, not here.
     * Here, just a very basic mandatory check regardless of hierarchy.
     * @returns 
     */
    public runMandatorySegDiag(): vscode.Diagnostic[] {
        // Edifact:UNA,UNB,UNH X12:ISA, GS, ST are already diagnosed outside, we don't do it here
        let mandSegs: string[] = [];

        if (this._ediVersion.release == "00401") {
            // X12
             mandSegs = ["CTT","SE","GE","IEA"];
             switch( this._ediVersion.version) {
                case "850":
                    mandSegs.push("BEG");
                    mandSegs.push("N1");
                    mandSegs.push("PO1");
                    break;
                default:

             }
        } else if (this._ediVersion.release == "D96A"){
            // EDIFACT
            mandSegs = ["BGM", "DTM", "UNS", "UNT", "UNZ"];
        } else {
            // do nothing
        }

        let rtnArray: vscode.Diagnostic[] = [];
        for (let objId of mandSegs) {
            if (!EdiUtils.containSeg(this._segs, objId)) {
                rtnArray.push(new vscode.Diagnostic(
                    EdiUtils.getFileTailRange(this._document), EdiUtils.formatMsgMandatory(objId), vscode.DiagnosticSeverity.Error))
            }

        }
        return rtnArray;
    }

}