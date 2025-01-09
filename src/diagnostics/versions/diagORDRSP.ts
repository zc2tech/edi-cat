import { EdiVersion, EdiSegment, EdiElement, ElementType, EdiDelimiter } from "../../new_parser/entities";
import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { DiagBase } from "../diagBase";

export class DiagORDRSP extends DiagBase {

    private _tableDFA = {
        "ROOT": {
            "UNA": "ROOT_UNA",
        },
        "ROOT_UNA": {
            "UNB": "ROOT_UNB",
        },
        "ROOT_UNB": {
            "UNH": "ROOT_UNH",
        },
        "ROOT_UNH": {
            "BGM": "ROOT_BGM",
        },
        "ROOT_BGM": {
            "DTM": "ROOT_DTM",
            "FTX": "ROOT_FTX^1",
            "RFF": "SG1_RFF",
        },
        "ROOT_DTM": {
            "FTX": "ROOT_FTX^1",
            "RFF": "SG1_RFF",
            "NAD": "SG3_NAD",
            "TAX": "SG7_TAX",
            "TOD": "SG12_TOD",
            "ALC": "SG19_ALC",
            "LIN": "SG26_LIN",
        },
        "ROOT_FTX^1": {
            "FTX": "ROOT_FTX^2",
            "RFF": "SG1_RFF",
            "NAD": "SG3_NAD",
            "TAX": "SG7_TAX",
            "TOD": "SG12_TOD",
            "ALC": "SG19_ALC",
            "LIN": "SG26_LIN",
        },
        "ROOT_FTX^2": {
            "FTX": "ROOT_FTX^3",
            "RFF": "SG1_RFF",
            "NAD": "SG3_NAD",
            "TAX": "SG7_TAX",
            "TOD": "SG12_TOD",
            "ALC": "SG19_ALC",
            "LIN": "SG26_LIN",
        },
        "ROOT_FTX^3": {
            "RFF": "SG1_RFF",
            "NAD": "SG3_NAD",
            "TAX": "SG7_TAX",
            "TOD": "SG12_TOD",
            "ALC": "SG19_ALC",
            "LIN": "SG26_LIN",
        },
        "SG1_RFF": {
            "RFF": "SG1_RFF",
            "DTM": "SG1_DTM",
            "NAD": "SG3_NAD",
            "TAX": "SG7_TAX",
            "TOD": "SG12_TOD",
            "ALC": "SG19_ALC",
            "LIN": "SG26_LIN",
        },
        "SG1_DTM": {
            "RFF": "SG1_RFF",
            "NAD": "SG3_NAD",
            "TAX": "SG7_TAX",
            "TOD": "SG12_TOD",
            "ALC": "SG19_ALC",
            "LIN": "SG26_LIN",
        },

        "SG3_NAD": {
            "NAD": "SG3_NAD",
            "CTA": "SG3_SG6_CTA",
            "TAX": "SG7_TAX",
            "TOD": "SG12_TOD",
            "ALC": "SG19_ALC",
            "LIN": "SG26_LIN",
        },
        "SG3_SG6_CTA": {
            "NAD": "SG3_NAD",
            "CTA": "SG3_SG6_CTA",
            "COM": "SG3_SG6_COM",
            "TAX": "SG7_TAX",
            "TOD": "SG12_TOD",
            "ALC": "SG19_ALC",
            "LIN": "SG26_LIN",
        },
        "SG3_SG6_COM": {
            "CTA": "SG3_SG6_CTA",
            "TAX": "SG7_TAX",
            "TOD": "SG12_TOD",
            "ALC": "SG19_ALC",
            "LIN": "SG26_LIN",
        },
        "SG7_TAX": {
            "TAX": "SG7_TAX",
            "MOA": "SG7_MOA",
            "TOD": "SG12_TOD",
            "ALC": "SG19_ALC",
            "LIN": "SG26_LIN",
        },
        "SG7_MOA": {
            "TAX": "SG7_TAX",
            "TOD": "SG12_TOD",
            "ALC": "SG19_ALC",
            "LIN": "SG26_LIN",
        },
        "SG12_TOD": {
            "TOD": "SG12_TOD",
            "ALC": "SG19_ALC",
            "LIN": "SG26_LIN",
        },
        "SG19_ALC": {
            "ALC": "SG19_ALC",
            "DTM": "SG19_DTM",
            "PCD": "SG19_SG21_PCD",
            "MOA": "SG19_SG22_MOA",
            "LIN": "SG26_LIN",
        },
        "SG19_DTM": {
            "ALC": "SG19_ALC",
            "PCD": "SG19_SG21_PCD",
            "MOA": "SG19_SG22_MOA",
            "LIN": "SG26_LIN",
        },
        "SG19_SG21_PCD": {
            "ALC": "SG19_ALC",
            "PCD": "SG19_SG21_PCD",
            "MOA": "SG19_SG22_MOA",
            "LIN": "SG26_LIN",
        },
        "SG19_SG22_MOA": {
            "ALC": "SG19_ALC",
            "MOA": "SG19_SG22_MOA",
            "LIN": "SG26_LIN",
        },
        "SG26_LIN": {
            "LIN": "SG26_LIN",
            "PIA": "SG26_PIA",
            "IMD": "SG26_IMD",
            "QTY": "SG26_QTY",
            "DTM": "SG26_DTM",
            "MOA": "SG26_MOA",
            "CCI": "SG26_SG27_CCI",
            "PRI": "SG26_SG30_PRI",
            "RFF": "SG26_SG31_RFF",
            "TAX": "SG26_SG36_TAX",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_PIA": {
            "LIN": "SG26_LIN",
            "IMD": "SG26_IMD",
            "QTY": "SG26_QTY",
            "DTM": "SG26_DTM",
            "MOA": "SG26_MOA",
            "CCI": "SG26_SG27_CCI",
            "PRI": "SG26_SG30_PRI",
            "RFF": "SG26_SG31_RFF",
            "TAX": "SG26_SG36_TAX",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_IMD": {
            "LIN": "SG26_LIN",
            "QTY": "SG26_QTY",
            "DTM": "SG26_DTM",
            "MOA": "SG26_MOA",
            "CCI": "SG26_SG27_CCI",
            "PRI": "SG26_SG30_PRI",
            "RFF": "SG26_SG31_RFF",
            "TAX": "SG26_SG36_TAX",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_QTY": {
            "LIN": "SG26_LIN",
            "DTM": "SG26_DTM",
            "MOA": "SG26_MOA",
            "CCI": "SG26_SG27_CCI",
            "PRI": "SG26_SG30_PRI",
            "RFF": "SG26_SG31_RFF",
            "TAX": "SG26_SG36_TAX",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_DTM": {
            "LIN": "SG26_LIN",
            "MOA": "SG26_MOA",
            "CCI": "SG26_SG27_CCI",
            "PRI": "SG26_SG30_PRI",
            "RFF": "SG26_SG31_RFF",
            "TAX": "SG26_SG36_TAX",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_MOA": {
            "LIN": "SG26_LIN",
            "CCI": "SG26_SG27_CCI",
            "PRI": "SG26_SG30_PRI",
            "RFF": "SG26_SG31_RFF",
            "TAX": "SG26_SG36_TAX",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG27_CCI": {
            "LIN": "SG26_LIN",
            "CCI": "SG26_SG27_CCI",
            "PRI": "SG26_SG30_PRI",
            "RFF": "SG26_SG31_RFF",
            "TAX": "SG26_SG36_TAX",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG30_PRI": {
            "LIN": "SG26_LIN",
            "PRI": "SG26_SG30_PRI",
            "CUX": "SG26_SG30_CUX",
            "RFF": "SG26_SG31_RFF",
            "TAX": "SG26_SG36_TAX",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG30_CUX": {
            "LIN": "SG26_LIN",
            "PRI": "SG26_SG30_PRI",
            "RFF": "SG26_SG31_RFF",
            "TAX": "SG26_SG36_TAX",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG31_RFF": {
            "LIN": "SG26_LIN",
            "RFF": "SG26_SG31_RFF",
            "TAX": "SG26_SG36_TAX",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG36_TAX": {
            "LIN": "SG26_LIN",
            "TAX": "SG26_SG36_TAX",
            "MOA": "SG26_SG36_MOA",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG36_MOA": {
            "LIN": "SG26_LIN",
            "TAX": "SG26_SG36_TAX",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG37_NAD": {
            "LIN": "SG26_LIN",
            "NAD": "SG26_SG37_NAD",
            "CTA": "SG26_SG37_SG40_CTA",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG37_SG40_CTA": {
            "LIN": "SG26_LIN",
            "CTA": "SG26_SG37_SG40_CTA",
            "COM": "SG26_SG37_SG40_COM",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG37_SG40_COM": {
            "LIN": "SG26_LIN",
            "CTA": "SG26_SG37_SG40_CTA",
            "NAD": "SG26_SG37_NAD",
            "ALC": "SG26_SG41_ALC",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG41_ALC": {
            "LIN": "SG26_LIN",
            "ALC": "SG26_SG41_ALC",
            "MOA": "SG26_SG41_SG44_MOA",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG41_SG44_MOA": {
            "LIN": "SG26_LIN",
            "ALC": "SG26_SG41_ALC",
            "MOA": "SG26_SG41_SG44_MOA",
            "SCC": "SG26_SG51_SCC",
            "UNS": "ROOT_UNS",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG51_SCC": {
            "LIN": "SG26_LIN",
            "SCC": "SG26_SG51_SCC",
            "FTX": "SG26_SG51_FTX^1",
            "QTY": "SG26_SG51_SG52_QTY",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG51_FTX^1": {
            "LIN": "SG26_LIN",
            "SCC": "SG26_SG51_SCC",
            "FTX": "SG26_SG51_FTX^2",
            "QTY": "SG26_SG51_SG52_QTY",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG51_FTX^2": {
            "LIN": "SG26_LIN",
            "SCC": "SG26_SG51_SCC",
            "FTX": "SG26_SG51_FTX^3",
            "QTY": "SG26_SG51_SG52_QTY",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG51_FTX^3": {
            "LIN": "SG26_LIN",
            "SCC": "SG26_SG51_SCC",
            "QTY": "SG26_SG51_SG52_QTY",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG51_SG52_QTY": {
            "LIN": "SG26_LIN",
            "SCC": "SG26_SG51_SCC",
            "QTY": "SG26_SG51_SG52_QTY",
            "DTM": "SG26_SG51_SG52_DTM",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "SG26_SG51_SG52_DTM": {
            "LIN": "SG26_LIN",
            "SCC": "SG26_SG51_SCC",
            "QTY": "SG26_SG51_SG52_QTY",
            "UNS": "ROOT_UNS",
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "ROOT_UNS": {
            "MOA": "ROOT_MOA",
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "ROOT_MOA": {
            "UNT": "ROOT_UNT",
            "UNZ": "ROOT_UNZ",
        },
        "ROOT_UNT": {
            "UNZ": "ROOT_UNZ",
        },
    }

    public runMandatorySegDiag(): vscode.Diagnostic[] {
        // UNA,UNB,UNH are already diagnosed outside, we don't do it here
        const mandSegs: string[] = ["BGM", "DTM", "UNS", "UNT", "UNZ"]
        let rtnArray: vscode.Diagnostic[] = [];
        for (let objId of mandSegs) {
            if (!EdiUtils.containSeg(this._segs, objId)) {
                rtnArray.push(new vscode.Diagnostic(
                    EdiUtils.getFileTailRange(this._document), EdiUtils.formatMsgMandatory(objId), vscode.DiagnosticSeverity.Error))
            }

        }
        return rtnArray;
    }

    /**
     * Usually only return array with 1 element.
     * @returns 
     */
    public runHierarchyDiag(): vscode.Diagnostic[] {
        let statusDFA = "ROOT";
        let rtn: vscode.Diagnostic[] = [];
        for (let seg of this._segs) {

            if (statusDFA == "ROOT_UNZ") {
                // Even after UNZ, we still get input ...
                rtn.push(
                    new vscode.Diagnostic(
                        EdiUtils.getSegmentRange(this._document, seg),
                        `Cannot add segments after UNZ segment`,
                        vscode.DiagnosticSeverity.Error
                    )
                );
                return rtn;
            }

            // Even one Hierarchy Error should stop the diagnose, because it's meaningless to dig deeper
            if (this._tableDFA[statusDFA][seg.id]) { // "Status => Input" exsits
                seg.newStatusDFA = statusDFA = this._tableDFA[statusDFA][seg.id];
                seg.translateToLayerIds();
            } else {
                // make sure here is using the previous statusDFA
                let strExpected = Object.keys(this._tableDFA[statusDFA]).join(',')
                // "Wrong ${seg.id} for DFA Status:${statusDFA}"
                rtn.push(new vscode.Diagnostic(
                    EdiUtils.getSegmentRange(this._document, seg),
                    `Wrong segment ${seg.id} for last syntax status:${statusDFA}, expected:${strExpected}`,
                    vscode.DiagnosticSeverity.Error
                ));

                
                return rtn;
            }
            //   diagnostic.code = elementError.code;
            //   diagnostics.push(diagnostic);

        }

        return rtn;
    }

}