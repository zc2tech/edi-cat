import * as vscode from "vscode";
import { EdiSchema } from "../../schemas/schemas";
import * as constants from "../../cat_const";
import Utils, { StringBuilder } from "../../utils/utils";
import { EdiUtils } from "../../utils/ediUtils";
import { DocInfoBase } from "../../info/docInfoBase";
import { Info_810 } from "../../info/info_810";
import { ConvertPattern, X12, XML, versionKeys } from "../../cat_const";
import { create } from "xmlbuilder2";
import { format } from "date-fns";
import { CUtilX12 } from "../../utils/cUtilX12";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { ConvertErr, EdiSegment } from "../../new_parser/entities";
import { ConverterBase } from "../converterBase";
import { ASTNode } from "../../new_parser/syntaxParserBase";
import { TidyContact } from "../xmlTidy/TidyCommon";


/**
 * No need to make singleton because parserUtil already assured it
 */
export class Cvt_850_SalesOrder extends ConverterBase {
    protected _convertErrs: ConvertErr[];
    constructor(astTree: ASTNode) {
        super(astTree);
    }


    public toXMLCheck(document?: vscode.TextDocument): vscode.Diagnostic[] {
        this._document = document;
        this._clearDiags(); // clear previouse check results

        this._chkUsageIndicator();
        return this._cvtDiags;
    }

    public toXML(): string {
        this.toXMLCheck();
        if (this._hasConvertErr()) {
            return this._renderConvertErr();
        }

        const cxml = create().ele('cXML').dtd({
            sysID: 'http://xml.cxml.org/schemas/cXML/1.2.060/Fulfill.dtd'
        });

        let currentDateTime = new Date();
        cxml.att('payloadID', 'payload' + format(currentDateTime, "yyyyMMdd-HHmmss"))
        cxml.att('timestamp', format(currentDateTime, "yyyy-MM-dd'T'HH:mm:ssxxx"))
        let header = cxml.ele('Header');

        let from = header.ele(XML.From);
        from.ele(XML.Credential).att(XML.domain, XML.NetworkID).ele(XML.Identity).txt('AN11097769997-T')

        // To
        let to = header.ele(XML.To);
        to.ele(XML.Credential).att(XML.domain, XML.NetworkID).ele(XML.Identity).txt('AN1109Buyer-T');

        let sender = header.ele(XML.Sender);
        let cred = sender.ele(XML.Credential).att(XML.domain, XML.NetworkID);
        cred.ele(XML.Identity).txt('AN01000000087')
        cred.ele(XML.SharedSecret)
        sender.ele(XML.UserAgent).txt('Ariba Supplier')

        let request = cxml.ele(XML.Request);
        let salesOrderRequest = request.ele('SalesOrderRequest');
        let salesOrderHeader = salesOrderRequest.ele('SalesOrderHeader');
        let usageIndicator = this._segVal("ISA", 15);
        request.att(XML.deploymentMode, CUtilX12.usageIndicatorXML(usageIndicator));

        let BEG = this._rseg("BEG");
        let BEG01 = this._segVal(BEG, 1);
        let BEG03 = this._segVal(BEG, 3);
        let BEG05 = this._segVal(BEG, 5);
        if (BEG01 && BEG03 && BEG05 && MAPS.mapBEG[BEG01]) {
            salesOrderHeader.att('operation', MAPS.mapBEG[BEG01]);
            salesOrderHeader.att('salesOrderID', BEG03);
            let tmpDate = Utils.dateStrFromCCYYMMDD(BEG05);
            salesOrderHeader.att('noticeDate', tmpDate);
        }

        // CUR
        let headerCUR: string = this._segVal("CUR", 2);

        let arrREF = this._rSegs("REF");
        for (let tmpRef of arrREF) {
            let tmpVal = this._segVal(tmpRef, 1);
            switch (tmpVal) {
                case '8X':
                    salesOrderHeader.att('channelType', this._segVal(tmpRef, 3));
                    break;
                case '86':
                    salesOrderHeader.att('operationAllowed', this._segVal(tmpRef, 3));
                    break;
                case 'ZZ':
                    let tmpExtrin02 = this._segVal(tmpRef, 2);
                    let tmpExtrin03 = this._segVal(tmpRef, 3);
                    salesOrderHeader.ele(XML.Extrinsic).att('name', tmpExtrin02).txt(tmpExtrin03);
                    break;
                default:
                // do nothing
            }
        }

        // N9
        let grpN9 = this._rGrp1('N9');
        let N9 = grpN9 ? this._dSeg1(grpN9, 'N9') : undefined;
        let xmlComment;
        // this._getRootSegByEleVal('N9', 1, 'L1');
        if (N9) {
            let N9V02 = this._segVal(N9, 2);
            let N9V702 = this._segVal(N9, 702);
            if (N9V02 && N9V702) {
                xmlComment = salesOrderHeader.ele('Comments');
                xmlComment.att(XML.lang, N9V02)
                    .att('type', N9V702);
            }
        }

        // N9 MSG
        let arrMsg = this._dSegs(grpN9, 'MSG');
        let strComment = '';
        for (let m of arrMsg) {
            if (m) {
                strComment = strComment + this._segVal(m, 1);
            }
        }
        if (xmlComment) {
            xmlComment.txt(strComment);
        }

        const xml = cxml.end({ prettyPrint: true, indent: '    ',spaceBeforeSlash: false });
        return xml;
    }

    private _dealGrpN1(grpN1: ASTNode, salesOrderHeader: XMLBuilder) {
        // N1
        let N1 = this._dSeg1(grpN1, 'N1');
        //let xmlContact = salesOrderHeader.ele('Contact');
        let tContact = new TidyContact();
        let roleCode = this._segVal(N1, 1) ?? 'NotExist';
        tContact.att('role', MAPS.mapN101[roleCode]);
        tContact.Name.ele('Name').txt(this._segVal(N1, 2))
            .att(XML.lang, 'EN');
        let codeQualifier = this._segVal(N1, 3) ?? 'NotExist';
        tContact.att('addressIDDomain', MAPS.mapN103[codeQualifier]);
        tContact.att('addressId', this._segVal(N1, 4));

        // N2
        let arrN2 = this._dSegs(grpN1, 'N2');
        let postalAddress = tContact.PostalAddress.ele('PostalAddress');
        for (let seg of arrN2) {
            postalAddress.ele('DeliverTo').txt(this._segVal(seg, 1));
            postalAddress.ele('DeliverTo').txt(this._segVal(seg, 2));
        }
        // N3
        let arrN3 = this._dSegs(grpN1, 'N3');
        for (let seg of arrN2) {
            postalAddress.ele('Street').txt(this._segVal(seg, 1));
            postalAddress.ele('Street').txt(this._segVal(seg, 2));
        }

        // N4
        this._X12N4(grpN1, tContact);
        tContact.sendTo(salesOrderHeader.ele('Contact'));
    }
}

export class MAPS {

    static mapBEG: Object = {
        "00": "new",
        "05": "update",
        "01": "cancel",
    };
    static mapN101: Object = {
        "ST": "locationTo",
        "SU": "supplierCorporate"
    };
    static mapN103: Object = {
        "1": "DUNS",
        "2": "SCAC",
        "4": "IATA",
        "9": "DUNS+4"
    };

}