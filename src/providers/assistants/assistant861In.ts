import { SegmentParserBase } from "../../new_parser/segmentParserBase";
import { EdifactParser } from "../../new_parser/edifactParser";
import { EdiElement, EdiSegment, EdiType } from "../../new_parser/entities";
import { X12Parser } from "../../new_parser/x12Parser";
import * as vscode from "vscode";
import * as constants from "../../cat_const";
import { TreeItemType, TreeItemElement, EdiGroup, ElementAttribute } from "../treeEntity";
import { AssistantBase } from "./assistantBase";

/**
 * 
 * 
 */
export class Assistant861In extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_861_In
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "RCD":
                    return this._getRCDChildren();
                case "RCD_N1":
                    return this._getRCDN1Children();

            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }

    _getRCDN1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "N1",
                type: TreeItemType.Segment,
                desc: `Party Name`,
                codeSample: `N1*DA*Delivery party Name*1*Delivery party ID~`
            },
            {
                key: "N2",
                type: TreeItemType.Segment,
                desc: `Party Additional Name Information`,
                codeSample: `N2*Delivery party Addr Name 1*Delivery party Addr Name 2~`
            },
            {
                key: "N3",
                type: TreeItemType.Segment,
                desc: `Party Address Information`,
                codeSample: `N3*Delivery party Street 1*Delivery party Street 2~`
            },
            {
                key: "N4",
                type: TreeItemType.Segment,
                desc: `Party Geographic Location`,
                codeSample: `N4*Delivery party City**ZIP*AU*SP*NSW~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Party Reference`,
                codeSample: `REF*01**Delivery party Postal Addr Name~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Delivery party Contact Name*EM*E-Mail Addr*TE*Phone ID*UR*URL~`
            },
        ]
    }
    _getRCDChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "RCD",
                type: TreeItemType.Segment,
                desc: `Receiving Conditions`,
                codeSample: `RCD*1*100*EA*200*EA~`
            },
            {
                key: "CUR",
                type: TreeItemType.Segment,
                desc: `Currency`,
                codeSample: `CUR*BY*USD~`
            },
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Line item identification`,
                codeSample: `LIN*1*PL*10*VP*Supplier Part ID*BP*Buyer Part ID*VS*Supplier Auxiliary Part ID*MG*Manufacturer Part ID*MF*Manufacturer Name*EN*EAN ID*B8*Supplier Batch ID*LT*Buyer Batch ID*UP*UPC ID*C3*UNSPSC~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Product Item Description`,
                codeSample: `PID*F*GEN***Short Name Description****EN~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Product Item Classification`,
                codeSample: `PID*S*GEN*UN*Code*Item PID**ProdFamily~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*AH*Agreement ID*CL*AH>1~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Fine Line Definitions`,
                codeSample: `REF*FL*item**LI>1~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Line Item Comments`,
                codeSample: `REF*L1*en*Free-form item text~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Document Info`,
                codeSample: `REF*0L*SalesOrder*Sales Order ID*0L>20210920124000~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Monetary Information`,
                codeSample: `REF*1Z*1234*123400~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually defined identification~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*004*20211004*123931*GM~`
            },
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers`,
                codeSample: `MAN*L*SN*Asset Serial ID*L*AT*Asset Tag ID~`
            },
            {
                key: "RCD_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant861In.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
        ]
    }
    _getRootChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ISA",
                type: TreeItemType.Segment,
                desc: `Interchange Control Header`,
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *211005*1631*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*RC*SenderID*ReceiverID*20211005*163111*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*861*0001~`
            },
            {
                key: "BRA",
                type: TreeItemType.Segment,
                desc: `Beginning Segment for Receiving Advice or Acceptance Certificate`,
                codeSample: `BRA*Receiving Advice ID*20211004*00*2*123931**AC~`
            },
            {
                key: "CUR",
                type: TreeItemType.Segment,
                desc: `Currency`,
                codeSample: `CUR*BY*USD~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*MA*ASN ID*Header Extrinsic~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*111*20211004*103931*GM~`
            },
            {
                key: "RCD",
                type: TreeItemType.Group,
                rootVersion: Assistant861In.versionKey,
                desc: `Receiving Conditions`,
                codeSample: ``
            },
            {
                key: "CTT",
                type: TreeItemType.Segment,
                desc: `Transaction Totals`,
                codeSample: `CTT*1~`
            },
            {
                key: "SE",
                type: TreeItemType.Segment,
                desc: `Transaction Set Trailer`,
                codeSample: `SE*26*0001~`
            },
            {
                key: "GE",
                type: TreeItemType.Segment,
                desc: `Functional Group Trailer`,
                codeSample: `GE*1*1~`
            },
            {
                key: "IEA",
                type: TreeItemType.Segment,
                desc: `Interchange Control Trailer`,
                codeSample: `IEA*1*000000001~`
            },


        ]
    }
}