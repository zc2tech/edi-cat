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
export class AssistantREMADV extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_REMADV;
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "SG1": // Group
                    return [
                        {
                            key: "NAD",
                            type: TreeItemType.Segment,
                            desc: `Name and address`,
                            codeSample: `NAD+PR+Payer ID::92+Payer Name 1:Payer Name 2:Payer Name 3:Payer Name 4:Payer Name 5+Payer AddrName1:Payer AddrName 2:Payer AddrName 3:Payer AddrName 4:Payer AddrName 5+Payer Street 1:Payer Street 2:Payer Street 3:Payer Street 4+Payer City+IL+ZIP+FR'`
                        },
                        {
                            key: "SG1_SG2",
                            type: TreeItemType.Group,
                            rootVersion: AssistantREMADV.versionKey,
                            desc: `Contact information`,
                            codeSample: ``
                        },
                    ]
                case "SG1_SG2": return [
                    {
                        key: "CTA",
                        type: TreeItemType.Segment,
                        desc: `Contact information`,
                        codeSample: `CTA+IC+Contact ID:Contact Name'`
                    },
                    {
                        key: "COM",
                        type: TreeItemType.Segment,
                        desc: `Communication contact`,
                        codeSample: `COM+billing@supplier.org:EM'`
                    },
                ]
                case "SG3": return [
                    {
                        key: "CUX",
                        type: TreeItemType.Segment,
                        desc: `Currencies`,
                        codeSample: `CUX+2:USD:11+3:EUR:7+91.83'`
                    },
                ]
                case "SG4": return this._getSG4Children();
                case "SG4_SG6": return [
                    {
                        key: "AJT",
                        type: TreeItemType.Segment,
                        desc: `Adjustment details`,
                        codeSample: `AJT+1+1'`
                    },
                ]
            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }
    _getSG4Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "DOC",
                type: TreeItemType.Segment,
                desc: `Document/message details`,
                codeSample: `DOC+481:150:92:Payment Remittance'`
            },
            {
                key: "MOA",
                type: TreeItemType.Segment,
                desc: `Monetary amount`,
                codeSample: `MOA+77:100.00:USD:11'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+3:20160729:102'`
            },
            {
                key: "RFF",
                type: TreeItemType.Segment,
                desc: `Reference`,
                codeSample: `RFF+ON:Purchase Order ID:0001'`
            },
            {
                key: "SG4_SG6",
                type: TreeItemType.Group,
                rootVersion: AssistantREMADV.versionKey,
                desc: `Adjustment details`,
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
                codeSample: `UNH+1+REMADV:D:96A:UN'`
            },

            {
                key: "BGM",
                type: TreeItemType.Segment,
                desc: `Beginning of message`,
                codeSample: `BGM+481:150:92:Payment Remittance+Payment Remittance ID+7'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+137:20160701:102'`
            },
            {
                key: "RFF",
                type: TreeItemType.Segment,
                desc: `Reference`,
                codeSample: `RFF+ZZZ:MutuallyDefinedIDName::Mutually defined identification'`
            },
            {
                key: "FII",
                type: TreeItemType.Segment,
                desc: `Financial institution information`,
                codeSample: `FII+PB++Routing ID:150:ZZZ::::Paying Institution Party Name'`
            },
            {
                key: "PAI",
                type: TreeItemType.Segment,
                desc: `Payment instructions`,
                codeSample: `PAI+1::20'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text`,
                codeSample: `FTX+AAI+++TEXT1:TEXT2:TEXT3:TEXT4:TEXT5+EN'`
            },

            {
                key: "SG1",
                type: TreeItemType.Group,
                rootVersion: AssistantREMADV.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },
            {
                key: "SG3",
                type: TreeItemType.Group,
                rootVersion: AssistantREMADV.versionKey,
                desc: `Currencies`,
                codeSample: ``
            },
            {
                key: "SG4",
                type: TreeItemType.Group,
                rootVersion: AssistantREMADV.versionKey,
                desc: `Document/message details`,
                codeSample: ``
            },
            {
                key: "UNS",
                type: TreeItemType.Segment,
                desc: `Section control`,
                codeSample: `UNS+S'`
            },
            {
                key: "MOA",
                type: TreeItemType.Segment,
                desc: `Monetary amount`,
                codeSample: `MOA+12:100.00:USD:11'`
            },

            {
                key: "UNT",
                type: TreeItemType.Segment,
                desc: `Message trailer`,
                codeSample: `UNT+19+1'`
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