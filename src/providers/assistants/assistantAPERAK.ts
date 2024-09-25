import { SegmentParserBase } from "../../new_parser/segmentParserBase";
import { EdifactParser } from "../../new_parser/edifactParser";
import { EdiElement, EdiSegment, EdiType } from "../../new_parser/entities";
import { X12Parser } from "../../new_parser/x12Parser";
import * as vscode from "vscode";
import * as constants from "../../cat_const";
import { TreeItemType, TreeItemElement, EdiGroup, ElementAttribute } from "../treeEntity";
import { AssistantBase } from "./assistantBase";

/**
 * APERAK Inbound/Outbound share the same format/samplecode
 * 
 * Don't add sample code for Group, it's always the responsibility of child segment.
 * 
 * 
 */
export class AssistantAPERAK extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_APERAK;
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
                            codeSample: `RFF+ACW:Original Document ID'`
                        },
                        {
                            key: "DTM",
                            type: TreeItemType.Segment,
                            desc: `Date/Time`,
                            codeSample: `DTM+171:201601110930:203'`
                        },
                    ]
                case "SG3":
                    return [
                        {
                            key: "ERC",
                            type: TreeItemType.Segment,
                            desc: `Application error information`,
                            codeSample: `ERC+Other'`
                        },
                        {
                            key: "FTX",
                            type: TreeItemType.Segment,
                            desc: `Free text`,
                            codeSample: `FTX+AAO+++Status information'`
                        },
                    ]


            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
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
                codeSample: `UNB+UNOC:3+Sender ID:ZZZ+Reciepient ID:ZZZ+160111:1320+1++++++1'`
            },

            {
                key: "UNH",
                type: TreeItemType.Segment,
                desc: `Message header`,
                codeSample: `UNH+1+APERAK:D:96A:UN'`
            },

            {
                key: "BGM",
                type: TreeItemType.Segment,
                desc: `Beginning of message`,
                codeSample: `BGM+23+DocumentID+27'`
            },

            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text`,
                codeSample: `FTX+ACB+++Text1:Text2:Text3:Text4:Text5+EN'`
            },

            {
                key: "SG1",
                type: TreeItemType.Group,
                rootVersion: AssistantAPERAK.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG3",
                type: TreeItemType.Group,
                rootVersion: AssistantAPERAK.versionKey,
                desc: `Application error information`,
                codeSample: ``
            },

            {
                key: "UNT",
                type: TreeItemType.Segment,
                desc: `Message trailer`,
                codeSample: `UNT+8+1'`
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