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
export class Assistant997Out extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_997_Out
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "AK2": // Group
                    return this._getAK2Children();
                    break;

                case "AK2_AK3":
                    return [
                        {
                            key: "AK3",
                            type: TreeItemType.Segment,
                            desc: `Data Segment Note`,
                            codeSample: `AK3*REF*4**8~`
                        },
                        {
                            key: "AK4",
                            type: TreeItemType.Segment,
                            desc: `Data Element Note`,
                            codeSample: `AK4*4>2*127*1~`
                        },
                    ]
                

            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }
    

    _getAK2Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "AK2",
                type: TreeItemType.Segment,
                desc: `Transaction Set Response Header`,
                codeSample: `AK2*810*0001~`
            },
            {
                key: "AK2_AK3",
                type: TreeItemType.Group,
                rootVersion:Assistant997Out.versionKey,
                desc: `Data Segment Note`,
                codeSample: ``
            },

            {
                key: "AK5",
                type: TreeItemType.Segment,
                desc: `Transaction Set Response Trailer`,
                codeSample: `AK5*R*3*4~`
            },
         
           
        ]
    }

    _getRootChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ISA",
                type: TreeItemType.Segment,
                desc: `Interchange Control Header`,
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *160111*1320*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*FA*SenderID*ReceiverID*20160111*1320*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*997*0001~`
            },
            {
                key: "AK1",
                type: TreeItemType.Segment,
                desc: `Functional Group Response Header`,
                codeSample: `AK1*IN*1~`
            },
            {
                key: "AK2",
                type: TreeItemType.Group,
                rootVersion:Assistant997Out.versionKey,
                desc: `Transaction Set Response Header`,
                codeSample: ``
            },
          
            {
                key: "AK9",
                type: TreeItemType.Segment,
                desc: `Functional Group Response Trailer`,
                codeSample: `AK9*R*1*1*0*4*5~`
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