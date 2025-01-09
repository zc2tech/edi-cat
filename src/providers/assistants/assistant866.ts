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
export class Assistant866 extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_866
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "DTM": // Group
                    return this._getDTMChildren();
                    break;
                case "DTM_LIN": // Group
                    return this._getDTMLINChildren();
                    break;
                case "DTM_LIN_SLN": // Group
                    return this._getDTMLINSLNChildren();
                    break;
                case "DTM_LIN_SLN_PID": // Group
                    return [
                        {
                            key: "PID",
                            type: TreeItemType.Segment,
                            desc: `Product/Item Description`,
                            codeSample: `PID*F*PR*ZZ*ID*Production Order ID~`
                        },
                    ]
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
                codeSample: ``
            },
            {
                key: "N2",
                type: TreeItemType.Segment,
                desc: `Party Additional Name Information`,
                codeSample: ``
            },
            {
                key: "N3",
                type: TreeItemType.Segment,
                desc: `Party Address Information`,
                codeSample: ``
            },
            {
                key: "N4",
                type: TreeItemType.Segment,
                desc: `Party Geographic Location`,
                codeSample: ``
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Party Reference`,
                codeSample: ``
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: ``
            },
        ]
    }


    _getDTMChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*004*20160104*093059*ED~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*PO*Purchase Order ID~`
            },
            {
                key: "DTM_LIN",
                type: TreeItemType.Group,
                rootVersion: Assistant866.versionKey,
                desc: `Line Item Identification`,
                codeSample: ``
            },

        ]
    }
    _getDTMLINChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Item Identification`,
                codeSample: `LIN*1*PL*1*VP*Vendor Part ID*BP*Buyer Part ID*VS*Vendor Supplemental Part ID*B8*Supplier Batch ID*LT*Buyer Batch ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Production Order Number`,
                codeSample: `REF*MH*ProductionOrderID*Production Order ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Report Completion Indicator`,
                codeSample: `REF*RPT*CompletedIndicator*yes~`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY*99*100*EA~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Product/Item Description`,
                codeSample: `PID*F****Free-Form-Description-Text****EN~`
            },
            {
                key: "DTM_LIN_SLN",
                type: TreeItemType.Group,
                rootVersion: Assistant866.versionKey,
                desc: `Subline Item Detail`,
                codeSample: ``
            },


        ]
    }
    _getDTMLINSLNChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "SLN",
                type: TreeItemType.Segment,
                desc: `Subline Item Detail`,
                codeSample: `SLN*1**I*100*EA****VP*Vendor SubPart ID*BP*Not Applicable*VS*Vendor Supplemental SubPart ID*A1*X*A1*X~`
            },

            {
                key: "DTM_LIN_SLN_PID",
                type: TreeItemType.Group,
                rootVersion: Assistant866.versionKey,
                desc: `Product/Item Description`,
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
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *160108*1314*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*SQ*SenderID*ReceiverID*20160108*1314*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*866*0001~`
            },
            {
                key: "BSS",
                type: TreeItemType.Segment,
                desc: `Beginning Segment for Shipping Schedule/Production Sequence`,
                codeSample: `BSS*00*ProductionSequenceID*20160108*BB*20160106*20160109**Document Ref ID~`
            },
            {
                key: "DTM",
                type: TreeItemType.Group,
                rootVersion: Assistant866.versionKey,
                desc: `Date/Time Reference`,
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
                codeSample: `SE*13*0001~`
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