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
export class Assistant824In extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_824_In
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "OTI": // Group
                    return this._getOTIChildren();
                    break;
                case "OTI_TED":
                    return [
                        {
                            key: "TED",
                            type: TreeItemType.Segment,
                            desc: `Technical Error Description`,
                            codeSample: `TED*ZZZ*Free Form Message~`
                        },
                        {
                            key: "NTE",
                            type: TreeItemType.Segment,
                            desc: `Note/Special Instruction`,
                            codeSample: `NTE*ERN*Purchase orders without buyer and vendor item identification number are rejected~`
                        },
                    ]
                

            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }
    

    _getOTIChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "OTI",
                type: TreeItemType.Segment,
                desc: `Original Transaction Identification`,
                codeSample: `OTI*TR*TN*Related Document ID*******850*******REJ~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*TN*DocumentID*Related Document ID~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*102*20190110*1200*CT~`
            },
            {
                key: "OTI_TED",
                type: TreeItemType.Group,
                rootVersion:Assistant824In.versionKey,
                desc: `Technical Error Description`,
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
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *160111*1330*U*00401*000000001*0*P*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*AG*SenderID*ReceiverID*20160111*1330*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*824*0001~`
            },
            {
                key: "BGN",
                type: TreeItemType.Segment,
                desc: `Beginning Segment`,
                codeSample: `BGN*00*DocumentID*20190111*1230~`
            },
          
            {
                key: "OTI",
                type: TreeItemType.Group,
                rootVersion: Assistant824In.versionKey,
                desc: `Original Transaction Identification`,
                codeSample: ``
            },
           
            {
                key: "SE",
                type: TreeItemType.Segment,
                desc: `Transaction Set Trailer`,
                codeSample: `SE*8*0001~`
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