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
export class Assistant861Out extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_861_Out
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
                codeSample: `N1*DA*Delivery party Name*92*Delivery party ID~`
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
                codeSample: `RCD*1*100*EA*0*EA~`
            },
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Line item identification`,
                codeSample: `LIN*1*PL*10*VP*Supplier Part ID*BP*Buyer Part ID*VS*Supplier Supplemental Part ID*MG*Manufacturer Part ID*MF*Manufacturer Name*B8*Supplier Batch ID*LT*Buyer Batch ID~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Product Item Description`,
                codeSample: `PID*F*GEN***Short Name Description****EN~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually defined identification~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*111*20160111*1314*ET~`
            },
            {
                key: "RCD_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant861Out.versionKey,
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
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *160112*1330*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*RC*SenderID*ReceiverID*20160111*151459*1*X*004010~`
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
                codeSample: `BRA*Receiving Advice ID*20160112*00*2*1330**AC~`
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
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually defined identification~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*050*20160112*1330*CT~`
            },
            {
                key: "RCD",
                type: TreeItemType.Group,
                rootVersion: Assistant861Out.versionKey,
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
                codeSample: `SE*17*0001~`
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