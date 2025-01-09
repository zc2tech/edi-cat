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
export class AssistantCONTRLIn extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_CONTRL_In;
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
                            codeSample: `UCM+1+ORDERS:D:96A:UN+7+2'`
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
                codeSample: `UNH+1+CONTRL:D:96A:UN'`
            },

            {
                key: "UCI",
                type: TreeItemType.Segment,
                desc: `Interchange response`,
                codeSample: `UCI+1+SenderID:ZZZ+ReceiverID:ZZZ+7+2'`
            },

            {
                key: "SG1",
                type: TreeItemType.Group,
                rootVersion: AssistantCONTRLIn.versionKey,
                desc: `Message Response`,
                codeSample: ``
            },
           

            {
                key: "UNT",
                type: TreeItemType.Segment,
                desc: `Message trailer`,
                codeSample: `UNT+4+1'`
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