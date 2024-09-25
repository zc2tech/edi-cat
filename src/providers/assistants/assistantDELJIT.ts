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
export class AssistantDELJIT extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_DELJIT;
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
                            codeSample: `RFF+ON:Purchase Order ID::Order Version'`
                        },
                        {
                            key: "DTM",
                            type: TreeItemType.Segment,
                            desc: `Date/Time`,
                            codeSample: `DTM+4:201601010800:203'`
                        },
                    ]
                case "SG2": return [
                    {
                        key: "NAD",
                        type: TreeItemType.Segment,
                        desc: `Name and address`,
                        codeSample: `NAD+BT+Bill to ID::92+Bill to Name 1:Bill to Name 2:Bill to Name 3:Bill to Name 4:Bill to Name 5+Bill to AddrName 1:Bill to AddrNam e 2:Bill to AddrName 3:Bill to AddrName 4:Bill to AddrName 5+Bill to Street 1:Bill to Street 2:Bill to Street 3:Bill to Street 4+Bill to City+I L+ZIP+FR'`
                    },
                    {
                        key: "LOC",
                        type: TreeItemType.Segment,
                        desc: `Place/Location information`,
                        codeSample: `LOC+19+Plant ID'`
                    },
                    {
                        key: "SG2_SG3",
                        type: TreeItemType.Group,
                        rootVersion:AssistantDELJIT.versionKey,
                        desc: `Contact information`,
                        codeSample: ``
                    },
                ]
                case "SG2_SG3": return [
                    {
                        key: "CTA",
                        type: TreeItemType.Segment,
                        desc: `Contact information`,
                        codeSample: `CTA+IC+:Info Contact Name'`
                    },
                    {
                        key: "COM",
                        type: TreeItemType.Segment,
                        desc: `Communication contact`,
                        codeSample: `COM+Phone Number:TE'`
                    },
                ]
                case "SG4": return [
                    {
                        key: "SEQ",
                        type: TreeItemType.Segment,
                        desc: `Sequence details`,
                        codeSample: `SEQ+3'`
                    },
                    {
                        key: "SG4_SG7",
                        type: TreeItemType.Group,
                        rootVersion:AssistantDELJIT.versionKey,
                        desc: `Line item`,
                        codeSample: ``
                    },
                ]
                case "SG4_SG7": return this._getSG4_SG7_Children();
                case "SG4_SG7_SG8": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference`,
                        codeSample: `RFF+FI:composite::itemLeve'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+126:20151201:102'`
                    },
                ]
                case "SG4_SG7_SG9^1": return [
                    {
                        key: "LOC",
                        type: TreeItemType.Segment,
                        desc: `Ship-To Place/Location information`,
                        codeSample: `LOC+7+1234::9:Unloading Point Name'`
                    },
                    {
                        key: "SG4_SG7_SG9^1_SG10",
                        type: TreeItemType.Group,
                        rootVersion:AssistantDELJIT.versionKey,
                        desc: `Contact information`,
                        codeSample: ``
                    },
                ]
                case "SG4_SG7_SG9^1_SG10": return [
                    {
                        key: "CTA",
                        type: TreeItemType.Segment,
                        desc: `Contact information`,
                        codeSample: `CTA+SD+:Ship to Name'`
                    },
                    {
                        key: "COM",
                        type: TreeItemType.Segment,
                        desc: `Communication contact`,
                        codeSample: `COM+Phone Number:TE'`
                    },
                ]
                case "SG4_SG7_SG9^2": return [
                    {
                        key: "LOC",
                        type: TreeItemType.Segment,
                        desc: `Additional Place/Location information`,
                        codeSample: `LOC+19+Plant ID'`
                    },
                ]
                case "SG4_SG7_SG11^1": return [
                    {
                        key: "QTY",
                        type: TreeItemType.Segment,
                        desc: `Quantity`,
                        codeSample: `QTY+21:200:C62'`
                    },
                ]
                case "SG4_SG7_SG11^2": return [
                    {
                        key: "QTY",
                        type: TreeItemType.Segment,
                        desc: `Quantity`,
                        codeSample: `QTY+1:10:C62'`
                    },
                    {
                        key: "SCC",
                        type: TreeItemType.Segment,
                        desc: `Scheduling condition`,
                        codeSample: `SCC+1'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+2:201601021030:203'`
                    },
                ]
                case "SG4_SG7_SG11^3": return [
                    {
                        key: "QTY",
                        type: TreeItemType.Segment,
                        desc: `Quantity`,
                        codeSample: `QTY+3:200:C62'`
                    },
                ]
                case "SG4_SG7_SG11^4": return [
                    {
                        key: "QTY",
                        type: TreeItemType.Segment,
                        desc: `Quantity`,
                        codeSample: `QTY+70:150:C62'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+94:201601011030:203'`
                    },
                    {
                        key: "SG4_SG7_SG11^4_SG12",
                        type: TreeItemType.Group,
                        rootVersion:AssistantDELJIT.versionKey,
                        desc: `Reference`,
                        codeSample: ``
                    },
                ]
                case "SG4_SG7_SG11^4_SG12": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference`,
                        codeSample: `RFF+RE:Release ID::JIT'`
                    },
                ]
                case "SG4_SG7_SG11^5": return [
                    {
                        key: "QTY",
                        type: TreeItemType.Segment,
                        desc: `Quantity`,
                        codeSample: `QTY+48:50:04'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+111:201601071030:203'`
                    },
                    {
                        key: "SG4_SG7_SG11^5_SG12",
                        type: TreeItemType.Group,
                        rootVersion:AssistantDELJIT.versionKey,
                        desc: `Reference`,
                        codeSample: ``
                    },
                ]
                case "SG4_SG7_SG11^5_SG12": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference`,
                        codeSample: `RFF+MA:Ship Notice ID'`
                    },
                ]
            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }
    _getSG4_SG7_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Line item`,
                codeSample: `LIN+10++Supplier Part ID:VN+1:2'`
            },
            {
                key: "PIA",
                type: TreeItemType.Segment,
                desc: `Additional product id`,
                codeSample: `PIA+1+EAN ID:EN+Supplier Supplemental Part ID:VS+European Waste ID:ZZZ'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item description`,
                codeSample: `IMD+E++:::Short Item Description 1:Short Item Description 2:EN'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item characteristics, coded`,
                codeSample: `IMD+B+98+Small'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item characteristics, mutually defined`,
                codeSample: `IMD+B++Mutually defined:::123 domain:123 Value'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item classification`,
                codeSample: `IMD+B++ACA:::domain123:Classification ID'`
            },
            {
                key: "GIR",
                type: TreeItemType.Segment,
                desc: `Serial numbers`,
                codeSample: `GIR+1+Serial ID 1:BN+Serial ID 2:BN+Serial ID 3:BN+Serial ID 4:BN+Serial ID 5:BN'`
            },
            {
                key: "TDT",
                type: TreeItemType.Segment,
                desc: `Details of transport`,
                codeSample: `TDT+20++30:Description++SCAC:::Carrier Name++ZZZ:ZZZ:Ship Contract ID'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text`,
                codeSample: `FTX+AAI+++TEXT 1:TEXT 2:TEXT 3:TEXT 4:TEXT 5+EN'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+2:201601061030:203'`
            },
            {
                key: "SG4_SG7_SG8",
                type: TreeItemType.Group,
                rootVersion:AssistantDELJIT.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG4_SG7_SG9^1",
                type: TreeItemType.Group,
                rootVersion:AssistantDELJIT.versionKey,
                desc: `Ship-To Place/Location information`,
                codeSample: ``
            },
            {
                key: "SG4_SG7_SG9^2",
                type: TreeItemType.Group,
                rootVersion:AssistantDELJIT.versionKey,
                desc: `Additional Place/Location information`,
                codeSample: ``
            },
            {
                key: "SG4_SG7_SG11^1",
                type: TreeItemType.Group,
                rootVersion:AssistantDELJIT.versionKey,
                desc: `Ordered quantity`,
                codeSample: ``
            },
            {
                key: "SG4_SG7_SG11^2",
                type: TreeItemType.Group,
                rootVersion:AssistantDELJIT.versionKey,
                desc: `Scheduling information`,
                codeSample: ``
            },
            {
                key: "SG4_SG7_SG11^3",
                type: TreeItemType.Group,
                rootVersion:AssistantDELJIT.versionKey,
                desc: `Cumulative scheduled quantity`,
                codeSample: ``
            },
            {
                key: "SG4_SG7_SG11^4",
                type: TreeItemType.Group,
                rootVersion:AssistantDELJIT.versionKey,
                desc: `Cumulative received quantity`,
                codeSample: ``
            },
            {
                key: "SG4_SG7_SG11^5",
                type: TreeItemType.Group,
                rootVersion:AssistantDELJIT.versionKey,
                desc: `Ship Notice information - Received quantity`,
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
                codeSample: `UNB+UNOC:3+SenderID:ZZZ+ReceiverID:ZZZ+160104:0930+1++++++1'`
            },

            {
                key: "UNH",
                type: TreeItemType.Segment,
                desc: `Message header`,
                codeSample: `UNH+1+DELJIT:D:96A:UN'`
            },
            {
                key: "BGM",
                type: TreeItemType.Segment,
                desc: `Beginning of message`,
                codeSample: `BGM+242:::Delivery Just-In-Time+Document ID+24+AB'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+137:201601010930:203'`
            },
            {
                key: "SG1",
                type: TreeItemType.Group,
                rootVersion:AssistantDELJIT.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
           
            {
                key: "SG2",
                type: TreeItemType.Group,
                rootVersion:AssistantDELJIT.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },
           
            {
                key: "SG4",
                type: TreeItemType.Group,
                rootVersion:AssistantDELJIT.versionKey,
                desc: `Sequence details`,
                codeSample: ``
            },
           
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Item Category`,
                codeSample: `FTX+PRD+++itemCategory:consignment'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text - General Comments`,
                codeSample: `FTX+AAI+++TEXT 1:TEXT 2:TEXT 3:TEXT 4:TEXT 5+EN'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text - Mutually Defined Content`,
                codeSample: `FTX+ZZZ+++Mutually defined identification name:Text1:Text2:Text3:Text4'`
            },

            {
                key: "UNT",
                type: TreeItemType.Segment,
                desc: `Message trailer`,
                codeSample: `UNT+41+1'`
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