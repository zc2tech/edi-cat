import { SegmentParserBase } from "../../new_parser/segmentParserBase";
import { EdifactParser } from "../../new_parser/edifactParser";
import { EdiElement, EdiSegment, EdiType } from "../../new_parser/entities";
import { X12Parser } from "../../new_parser/x12Parser";
import * as vscode from "vscode";
import * as constants from "../../cat_const";
import { TreeItemType, TreeItemElement, EdiGroup, ElementAttribute } from "../treeEntity";
import { AssistantBase } from "./assistantBase";

/**
 * Consignment Material Movements. Version:1.3
 * 
 * Don't add sample code for Group, it's always the responsibility of child segment.
 * 
 * 
 */
export class Assistant846Consign extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_846_Consignment
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined{
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "LIN": // Group
                    return this._getLINChildren();
                    break;

                case "LIN_QTY^1":
                    return [
                        {
                            key: "QTY",
                            type: TreeItemType.Segment,
                            desc: `Consignment Inventory Quantity`,
                            codeSample: `QTY*33*100*EA>2~`
                        },
                    ]
                    break;
                case "LIN_QTY^2":
                    return this._getLINQTY2Children();
                    break;
                case "LIN_QTY^2_REF":
                    return [
                        {
                            key: "REF",
                            type: TreeItemType.Segment,
                            desc: `Reference`,
                            codeSample: `REF*IX*Movement ID**LI>000001~`
                        },
                        {
                            key: "DTM",
                            type: TreeItemType.Segment,
                            desc: `Date/Time`,
                            codeSample: `DTM*003*20180305*095012*GM~`
                        },
                    ]
                    break;
                case "LIN_N1":
                    return this._getLINN1Children();
            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }
    _getLINN1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "N1",
                type: TreeItemType.Segment,
                desc: `Party Name`,
                codeSample: `N1*ST*Location-To Name*92*Location-To ID~`
            },
            {
                key: "N2",
                type: TreeItemType.Segment,
                desc: `Party Additional Name Information`,
                codeSample: `N2*Location-To Addr Name 1*Location-To Addr Name 2~`
            },
            {
                key: "N3",
                type: TreeItemType.Segment,
                desc: `Party Address Information`,
                codeSample: `N3*Location-To Street 1*Location-To Street 2~`
            },
            {
                key: "N4",
                type: TreeItemType.Segment,
                desc: `Party Geographic Location`,
                codeSample: `N4*Location-To City*CA*ZIP*US~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Party Reference`,
                codeSample: `REF*LU**0002~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },
        ]}
    
    _getLINQTY2Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Consignment Movement Quantity`,
                codeSample: `QTY*V3*100*EA>3~`
            },
            {
                key: "UIT",
                type: TreeItemType.Segment,
                desc: `Unit Detail`,
                codeSample: `UIT*EA*46.00~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*514*20180330*095012*GM~`
            },
            {
                key: "LS",
                type: TreeItemType.Segment,
                desc: `Loop Header`,
                codeSample: `LS*REF~`
            },
            {
                key: "LIN_QTY^2_REF",
                type: TreeItemType.Group,
                rootVersion: Assistant846Consign.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "LE",
                type: TreeItemType.Segment,
                desc: `Loop Trailer`,
                codeSample: `LE*REF~`
            },
        ]
    }
    _getLINChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Item Identification`,
                codeSample: `LIN**VP*Supplier Part ID*BP*Buyer Part ID*VS*Supplier Supplemental Part ID~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Product/Item Description`,
                codeSample: `PID*F****Free-Form-Description-Text****en~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference`,
                codeSample: `REF*BT*Batch ID~`
            },
            {
                key: "LIN_QTY^1",
                type: TreeItemType.Group,
                rootVersion: Assistant846Consign.versionKey,
                desc: `Consignment Inventory Quantity`,
                codeSample: ``
            },
            {
                key: "LIN_QTY^2",
                type: TreeItemType.Group,
                rootVersion: Assistant846Consign.versionKey,
                desc: `Consignment Movement Quantity`,
                codeSample: ``
            },
            {
                key: "LIN_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant846Consign.versionKey,
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
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *180420*2338*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*IB*SenderID*ReceiverID*20180420*233859*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*846*0001~`
            },
            {
                key: "BIA",
                type: TreeItemType.Segment,
                desc: `Beginning Segment for Inventory Inquiry/Advice`,
                codeSample: `BIA*00*CO*Inventory Advice ID*20180401*093000*AC~`
            },
            {
                key: "LIN",
                type: TreeItemType.Group,
                rootVersion: Assistant846Consign.versionKey,
                desc: `Line Item Identification`,
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
                codeSample: `SE*21*0001~`
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