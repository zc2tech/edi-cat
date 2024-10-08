/* eslint-disable prefer-const */
import * as vscode from "vscode";
import path = require("path");
import xpath = require('xpath');
import { Parser810 } from "../new_parser/x12/parser810";
import { EdiUtils } from "../utils/ediUtils";
import * as constants from "../cat_const";
import { ParserUtils } from "../utils/parserUtils";
import { SyntaxParserBase } from "../new_parser/syntaxParserBase";
import { EdiVersion } from "../new_parser/entities";
import { ConvertPattern, XMLPath } from "../cat_const";
import { XmlConverterBase } from "../converter/xmlConverterBase";
import { DOMParser } from "@xmldom/xmldom";
import { Cvt_Receipt_RECADV } from "../converter/xmlToD96A/cvt_Receipt_RECADV";
import { Cvt_SUR_824 } from "../converter/xmToX12/cvt_SUR_824";
import { cvt_Order_ORDERS } from "../converter/xmlToD96A/cvt_Order_ORDERS";
import { cvt_Order_ORDCHG } from "../converter/xmlToD96A/cvt_Order_ORDCHG";
import { cvt_Forecast_DELFOR } from "../converter/xmlToD96A/cvt_Forecast_DELFOR";
const sAttXmlLang = 'xml:lang';
export class AllConversionCommand {

    public async command(...args) {
        if (!vscode.window.activeTextEditor) {
            return;
        }

        const document = vscode.window.activeTextEditor.document;

        if (!EdiUtils.checkLength(document)) {
            vscode.window.showErrorMessage("File size exceeds character limit:"
                + constants.ediDocument.sizeLimit + "K.");
            return;
        }

        if (ParserUtils.isASTOutput(document.getText())) {
            // it's already parsed document
            vscode.window.showErrorMessage('Do not parse a result document.');
            return;
        }

        if (this._hasExistingDiag(document)) {
            vscode.window.showErrorMessage('Please fix diagnostic error first.');
            return;
        };

        if (EdiUtils.isDocXML(document)) {
            await this._fromXML(document);
        } else {
            await this._fromX12orEDI(document);
        }

    }

    private _hasExistingDiag(document: vscode.TextDocument): boolean {
        let uri = vscode.window.activeTextEditor.document.uri;
        let diagnostics = vscode.languages.getDiagnostics(uri);

        return diagnostics.some(diagnostic => diagnostic.severity === vscode.DiagnosticSeverity.Error);
    }

    /**
     * Get Dom Node from '/cXML/Request'
     * 
     * @param strPath Relative xpath
     * @param p Parent Node
     * @returns Node
     */
    protected _rn(strPath: string, dom: Document): Element {
        return xpath.select1(XMLPath.CXLM_REQUEST + '/' + this._rmLeadingSlash(strPath), dom) as Element;
    }

    /**
     * 
     * @param strPath Relative xpath
     * @param p Parent Node
     * @returns Node
     */
    protected _n(strPath: string, p: Node): Node {
        return xpath.select1(this._rmLeadingSlash(strPath), p) as Node;
    }

    /**
        * Get Value under Parent Dom Node using strPath
        * @param strPath 
        * @param p 
        * @returns 
        */
    protected _v(strPath: string, p: Node): string {
        if (!p) {
            return '';
        }
        let nTmp: Node;

        if (!strPath) {
            nTmp = p;
        } else {
            // We cannot use normal xpath syntax to get attribute that belongs to other namespace:xml
            let idxLang = strPath.toLowerCase().indexOf('@' + sAttXmlLang); // will be -1 if not found
            if (idxLang >= 0) { // found
                if (idxLang >= 2) { // seems there is parent in strPath
                    // beware that there is '/' before '@xml:lang'
                    let nBeforeLang = this._n(strPath.substring(0, idxLang - 1), p);
                    return this._v('@' + sAttXmlLang, nBeforeLang);
                } else { // no parent node in strPath, just get the attribute
                    let e = p as Element;
                    let sTmp = e.getAttribute(sAttXmlLang); // like en-US
                    if (!sTmp) {
                        return 'EN';
                    } else {
                        return sTmp.split('-')[0].toUpperCase();
                    }
                }
            }

            // not xml:lang, so use usual way
            nTmp = xpath.select1(this._rmLeadingSlash(strPath), p) as Node;
        }

        if (nTmp) {
            if (nTmp.nodeType == nTmp.ATTRIBUTE_NODE) {
                return nTmp.nodeValue;
            } else if (nTmp.nodeType == nTmp.ELEMENT_NODE) {
                return nTmp.textContent;
            } else {
                return '';
            }
        } else {
            return '';
        }
    }

    protected _rmLeadingSlash(str: string) {
        if (str.startsWith('/')) {
            return str.substring(1);
        } else {
            return str;
        }
    }

    private _findCvt(vsdoc: vscode.TextDocument, sPattern: String): XmlConverterBase | undefined {
        let dom = new DOMParser().parseFromString(vsdoc.getText(), 'text/xml');
        // RECADV
        const nReceipt = xpath.select1("/cXML/Request/ReceiptRequest/ReceiptRequestHeader", dom);
        if (nReceipt) {
            return new Cvt_Receipt_RECADV();
        }

        // Order
        const nOrder = xpath.select1("/cXML/Request/OrderRequest/OrderRequestHeader", dom);
        const nRequestHeader = this._rn('/OrderRequest/OrderRequestHeader', dom);
        if (nOrder) {
            let sType = this._v('@type', nRequestHeader);
            if (sType == 'new') {
                return new cvt_Order_ORDERS();
            } else {
                return new cvt_Order_ORDCHG();
            }
        }

        // Forecast
        const nHeader = xpath.select1("/cXML/Message/ProductActivityMessage/ProductActivityHeader", dom) as Element;
        if (nHeader) {
            return new cvt_Forecast_DELFOR();
            // let sType = this._v('@processType', nHeader);
            // if (sType == 'Forecast') {
            //     return new cvt_Forecast_DELFOR();
            // }
        }

        // 824, StatusUpdateRequest
        const nDocStatus = xpath.select1("/cXML/Request/StatusUpdateRequest/DocumentStatus", dom);
        const nInvStatus = xpath.select1("/cXML/Request/StatusUpdateRequest/InvoiceStatus", dom);
        if (nDocStatus || nInvStatus) {
            return new Cvt_SUR_824();
        }
    }
    /**
     * Convert From cXML to ...
     * @param vsdoc 
     * @returns 
     */
    private async _fromXML(vsdoc: vscode.TextDocument) {
        const selected = await vscode.window.showQuickPick(
            [
                { label: ConvertPattern.cXML_to_EDIFACT_D96A, description: 'Convert to EDIFACT D96A' },
                { label: ConvertPattern.cXML_to_X12, description: 'Convert to X12' },
            ],
            { placeHolder: 'Select object EDI type.' }
        );
        if (!selected) {
            return;
        }

        let cvt: XmlConverterBase;
        let sPattern: string = selected.label;

        // find cvt
        cvt = this._findCvt(vsdoc, sPattern);
        if (cvt) {
            const astStr: string = cvt.fromXML(vsdoc);
            const newDoc = await vscode.workspace.openTextDocument(
                { content: astStr, language: this._getObjLanguageFromPattern(sPattern) });
            await vscode.window.showTextDocument(newDoc);

        }

    }

    private _getObjLanguageFromPattern(sPattern): string {
        switch (sPattern) {
            case ConvertPattern.X12_to_cXML:
                return 'xml';
            case ConvertPattern.cXML_to_EDIFACT_D96A:
                return 'edifact';
            case ConvertPattern.cXML_to_X12:
                return 'x12';
        }
    }
    private async _fromX12orEDI(vsdoc: vscode.TextDocument) {
        const tmp = await ParserUtils.getSegmentParser(vsdoc);
        const segParser = tmp.parser;
        const ediType = tmp.ediType;

        let syntaxParser: SyntaxParserBase;
        let ediVersion: EdiVersion;

        ediVersion = await segParser.parseReleaseAndVersion();
        const segments = await segParser.parseSegments();
        if (!segments || segments.length <= 0) {
            vscode.window.showErrorMessage('Error on parsing segment');
            return;
        }

        if (vscode.workspace.getConfiguration(constants.configuration.ediTsuya).get(constants.configuration.enableDiagnosis) !== true) {
            vscode.window.showErrorMessage
                (`Please enable Diagnosis setting before run this command.`);
            return;
        }

        syntaxParser = ParserUtils.getSyntaxParserByUriSmart(ediVersion, segParser.getVersion(), vsdoc.uri);
        if (!syntaxParser) {
            vscode.window.showErrorMessage
                (`Failed to get parser, please fix Diagnosis Error first.`);
            return;
        }

        if ((ediVersion.release != 'D96A' && ediVersion.release != 'D01B' && ediVersion.release != '00401'
            && ediVersion.release != '004010')) {
            vscode.window.showErrorMessage
                (`Not supported file conversion format`);
            return;
        }

        let options = [];
        if (ediVersion.release == 'D96A') {
            options.push({
                label: ConvertPattern.EDIFACT_D96A_to_cXML.toString(), description: 'Convert to cXML'
            })
        } else if (ediVersion.release == '00401' || ediVersion.release == '004010') {
            options.push({
                label: ConvertPattern.X12_to_cXML.toString(), description: 'Convert to cXML'
            })
        }

        if (options.length == 0) {
            vscode.window.showErrorMessage
                (`Not supported for conversion.`);
            return;
        }

        const selected = await vscode.window.showQuickPick(
            options,
            { placeHolder: 'Select object EDI type.' }
        );
        if (!selected) {
            return;
        }

        let sPattern: string = selected.label;

        const cvtResult: string = syntaxParser.convert(this._toPattern(sPattern));

        let lang: string;
        if (EdiUtils.isTxtXML(cvtResult)) {
            lang = 'xml';
        } else {
            lang = 'txt';
        }
        const newDoc = await vscode.workspace.openTextDocument({ content: cvtResult, language: lang });
        await vscode.window.showTextDocument(newDoc);

    }

    private _toPattern(value: string): constants.ConvertPattern | undefined {
        if (value in constants.ConvertPattern) {
            return constants.ConvertPattern[value as keyof typeof constants.ConvertPattern];
        }
        return undefined; // Or throw an error, based on what's appropriate in your case
    }

    private _isSupportedVersion(ediVersion: EdiVersion): boolean {
        return (ediVersion.release != 'D96A' && ediVersion.release != 'D01B' && ediVersion.release != '00401'
            && ediVersion.release != '00401')
    }
}

