import * as vscode from "vscode";
import { StatusBarItem } from "vscode";
import { versionKeys } from "../cat_const";
import { EdiDiagnosticsMgr } from "./ediDiagnostics";
import { EdiUtils } from "../utils/ediUtils";
import { EdiType } from "../new_parser/entities";
import { ParserUtils } from "../utils/parserUtils";
import * as constants from "../cat_const";
import { FileParserMeta } from "../new_parser/entities";
import { version } from "os";
import { CacheMgr } from "../utils/cacheMgr";



export class FileTypeSelector {
    statusFileType: StatusBarItem;
    options: string[] = [];
    static diagMgr: EdiDiagnosticsMgr;

    setFileTypeOptions(options: string[]) {
        this.options = options;
    }

    async showQuickPick() {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showInformationMessage(`Open an EDI(.x12 .edifact) file first.`);
            return;
        }

        let vsDocument = vscode.window.activeTextEditor.document;
        if (!EdiUtils.isEdifact(vsDocument) && !EdiUtils.isX12(vsDocument)) {
            vscode.window.showInformationMessage(`Open an EDI(.x12 .edifact) file first.`);
            return;
        }

        const { parser, ediType } = ParserUtils.getSegmentParser(vsDocument);
        if (!parser) {
            vscode.window.showInformationMessage(`Cannot find Segment Parser for this file.`);
            return;
        }

        if (ediType === EdiType.UNKNOWN) {
            vscode.window.showInformationMessage(`Please specify correct EDI Version/Type in header.`);
            return;
        }

        await parser.parseReleaseAndVersion();
        this.refreshStatusBarLabel(parser.getVersion(), vsDocument.uri);

        vscode.window.showQuickPick(this.options).then(selection => {
            // the user canceled the selection
            if (!selection) {
                return;
            }

            ParserUtils.saveParserMap(vsDocument.uri, selection);
            CacheMgr.clearParserMeta(vsDocument.uri.toString());
            FileTypeSelector.diagMgr.refreshDiagnostics(vsDocument);
        });

    }


    refreshStatusBarLabel(openedFileVersion: string, documentUri: vscode.Uri) {
        switch (openedFileVersion) {
            case "810":
                this._labelFixedSingle(versionKeys.X12_810);
                break;
            case "820":
                this._labelFixedSingle(versionKeys.X12_820);
                break;
            case "824":
               // this._labelSelectable(documentUri, versionKeys.X12_Family_824)
               this._labelFixedSingle(versionKeys.X12_824_Out);
                break;
            case "830":
                this._labelSelectable(documentUri, versionKeys.X12_Family_830)
                break;
            case "842":
                this._labelSelectable(documentUri, versionKeys.X12_Family_842)
                break;
            case "846":
                this._labelSelectable(documentUri, versionKeys.X12_Family_846)
                break;
            case "850":
                this._labelFixedSingle(versionKeys.X12_850);
                //this._labelSelectable(documentUri, versionKeys.X12_Family_850)
                break;
            case "855":
                this._labelFixedSingle(versionKeys.X12_855);
                break;
            case "856":
                this._labelSelectable(documentUri, versionKeys.X12_Family_856)
                break;
            case "860":
                this._labelFixedSingle(versionKeys.X12_860);
                break;
            case "861":
                //this._labelSelectable(documentUri, versionKeys.X12_Family_861)
                this._labelFixedSingle(versionKeys.X12_861_In);
                break;
            case "862":
                this._labelFixedSingle(versionKeys.X12_862);
                break;
            case "865":
                this._labelFixedSingle(versionKeys.X12_865);
                break;
            case "866":
                this._labelFixedSingle(versionKeys.X12_866);
                break;
            case "997":
                this._labelSelectable(documentUri, versionKeys.X12_Family_997)
                break;
            case "APERAK":
                this._labelFixedSingle(versionKeys.EDIFACT_APERAK);
                break;
            case "CONTRL":
                this._labelSelectable(documentUri, [versionKeys.EDIFACT_CONTRL_In, versionKeys.EDIFACT_CONTRL_Out])
                break;
            case "DELFOR":
                this._labelSelectable(documentUri, [versionKeys.EDIFACT_DELFOR_Order, versionKeys.EDIFACT_DELFOR_ProductActivity])
                break;
            case "DELJIT":
                this._labelFixedSingle(versionKeys.EDIFACT_DELJIT);
                break;
            case "DESADV":
                this._labelFixedSingle(versionKeys.EDIFACT_DESADV);
                break;
            case "INVOIC":
                this._labelFixedSingle(versionKeys.EDIFACT_INVOIC);
                break;
            case "ORDCHG":
                this._labelFixedSingle(versionKeys.EDIFACT_ORDCHG);
                break;
            case "ORDRSP":
                this._labelFixedSingle(versionKeys.EDIFACT_ORDRSP);
                break;
            case "ORDERS":
                this._labelFixedSingle(versionKeys.EDIFACT_ORDERS);
                break;
            case "RECADV":
                this._labelFixedSingle(versionKeys.EDIFACT_RECADV);
                break;
            case "REMADV":
                this._labelFixedSingle(versionKeys.EDIFACT_REMADV);
                break;
            case "UNKNOWN":
                this._labelFixedSingle("Unknown");
            case "": // just want to clear
                this._labelFixedSingle("");
            default:

        }
    }

    private _labelFixedSingle(lblText: string) {
        if(!this.statusFileType) {
            return;
        }
        this.statusFileType.command = null;
        if (lblText == "") {
            this.statusFileType.text = lblText;
        } else {
            this.statusFileType.text = "Version: " + lblText;
        }

        this.statusFileType.color = "white";
    }
    private _labelSelectable(documentUri: vscode.Uri, options: string[]) {
        if(!this.statusFileType) {
            return;
        }
        this.statusFileType.command = "edi-cat.showQuickPick";
        // this.statusFileType.command = "edi-cat.test-cmd";
        this.statusFileType.color = "yellow";
        this.options = options;
        let stateVersion = ParserUtils.getStateVersionKey(documentUri);
        if (!stateVersion) {
            this.statusFileType.text = "Version: Choose One";
        } else {
            if (options.includes(stateVersion)) {
                this.statusFileType.text = `Version: ${stateVersion}`;
            } else {
                this.statusFileType.text = "Version: Choose One";
            }

        }


    }
}