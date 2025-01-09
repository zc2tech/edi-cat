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
 * Don't add sample code for Group, it's always the responsibility of child segment.
 * 
 * 
 */
export class AssistantRECADV extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_RECADV;
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "SG1": // Group
                    return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Reference`,
                            codeSample: `RFF+ZZZ:MutuallyDefinedIDName::Mutually defined identification'`
                        },
                        {
                            key: "DTM",
                            type: TreeItemType.Segment,
                            desc: `Date/Time`,
                            codeSample: `DTM+124:201601111314:203'`
                        },
                    ]
                case "SG4": return [
                    {
                        key: "NAD",
                        type: TreeItemType.Segment,
                        desc: `Name and address`,
                        codeSample: `NAD+XX'`
                    },
                ]
                case "SG16": return this._getSG16Children();
                case "SG16_SG22": return this._getSG16_SG22_Children();
                case "SG16_SG22_SG28": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference`,
                        codeSample: `RFF+ZZZ:MutuallyDefinedIDName::Mutually defined identification'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+124:20170128:102'`
                    },
                ]
                

            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }
    _getSG16Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "CPS",
                type: TreeItemType.Segment,
                desc: `Consignment packing sequence`,
                codeSample: `CPS+1'`
            },
            {
                key: "SG16_SG22",
                type: TreeItemType.Group,
                rootVersion:AssistantRECADV.versionKey,
                desc: `Line item`,
                codeSample: ``
            },
        ]
    }
    _getSG16_SG22_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Line item`,
                codeSample: `LIN+1++10:PL+1:2'`
            },
            {
                key: "PIA",
                type: TreeItemType.Segment,
                desc: `Additional product id`,
                codeSample: `PIA+1+Vendor Part ID:VN::91+Buyer Part ID:BP::92+Manufacturer Part ID:MF::90+Vendor Supplemental Part ID:VS::91+Supplier Batch ID:NB::91'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item description`,
                codeSample: `IMD+F++:::Item-Description-1:Item-Description-2:EN'`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+48:100:C62'`
            },
            {
                key: "SG16_SG22_SG28",
                type: TreeItemType.Group,
                rootVersion:AssistantRECADV.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
        ]
    }
    _getRootChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "UNA",
                type: TreeItemType.Segment,
                desc: `Service string advice`,
                codeSample: `UNA:+.? '`
            },
            {
                key: "UNB",
                type: TreeItemType.Segment,
                desc: `Interchange header`,
                codeSample: `UNB+UNOC:3+SenderID:ZZZ+ReceiverID:ZZZ+160112:1330+1++++++1'`
            },

            {
                key: "UNH",
                type: TreeItemType.Segment,
                desc: `Message header`,
                codeSample: `UNH+1+RECADV:D:96A:UN'`
            },

            {
                key: "BGM",
                type: TreeItemType.Segment,
                desc: `Beginning of message`,
                codeSample: `BGM+632+Receiving Advice ID+9+AB'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+50:201601121330:203'`
            },

            {
                key: "SG1",
                type: TreeItemType.Group,
                rootVersion: AssistantRECADV.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
           
            {
                key: "SG4",
                type: TreeItemType.Group,
                rootVersion:AssistantRECADV.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },
            {
                key: "SG16",
                type: TreeItemType.Group,
                rootVersion:AssistantRECADV.versionKey,
                desc: `Consignment packing sequence`,
                codeSample: ``
            },
            {
                key: "CNT",
                type: TreeItemType.Segment,
                desc: `Control total`,
                codeSample: `CNT+2:1'`
            },
            {
                key: "UNT",
                type: TreeItemType.Segment,
                desc: `Message trailer`,
                codeSample: `UNT+15+1'`
            },
            {
                key: "UNZ",
                type: TreeItemType.Segment,
                desc: `Interchange trailer`,
                codeSample: `UNZ+1+1'`
            },


        ]
    }
}