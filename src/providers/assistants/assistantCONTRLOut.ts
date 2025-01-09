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
export class AssistantCONTRLOut extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_CONTRL_Out;
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "SG1": // Group
                    return [
                        {
                            key: "UCM",
                            type: TreeItemType.Segment,
                            desc: `Message Response`,
                            codeSample: `UCM+1+DESADV:D:01B:UN+4+28'`
                        },
                        {
                            key: "SG1_SG2",
                            type: TreeItemType.Group,
                            rootVersion:AssistantCONTRLOut.versionKey,
                            desc: `Segment/Data element error indication`,
                            codeSample: ``
                        },
                    ]
                case "SG1_SG2": // Group
                    return [
                        {
                            key: "UCS",
                            type: TreeItemType.Segment,
                            desc: `Segment error indication`,
                            codeSample: `UCS+1+39'`
                        },
                        {
                            key: "UCD",
                            type: TreeItemType.Segment,
                            desc: `Data element error indication`,
                            codeSample: `UCD+39+2:3'`
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
                codeSample: `UNB+UNOC:3+SenderID:ZZZ+ReceiverID:ZZZ+160111:1320+1++++++1'`
            },

            {
                key: "UNH",
                type: TreeItemType.Segment,
                desc: `Message header`,
                codeSample: `UNH+1+CONTRL:D:96A:UN'`
            },

            {
                key: "UCI",
                type: TreeItemType.Segment,
                desc: `Interchange response`,
                codeSample: `UCI+1+SenderID:ZZZ+ReceiverID:ZZZ+4+13+UNB+4'`
            },

            {
                key: "SG1",
                type: TreeItemType.Group,
                rootVersion: AssistantCONTRLOut.versionKey,
                desc: `Message Response`,
                codeSample: ``
            },
           

            {
                key: "UNT",
                type: TreeItemType.Segment,
                desc: `Message trailer`,
                codeSample: `UNT+6+1'`
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