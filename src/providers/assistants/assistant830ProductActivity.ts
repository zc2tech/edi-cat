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
export class Assistant830ProductActivity extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_830_ProductActivity
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "LIN": // Group
                    return this._getLINChildren();
                    break;
                case "LIN_N1":
                    return this._getLINN1Children();
                case "LIN_FST^1":
                    return [
                        {
                            key: "FST",
                            type: TreeItemType.Segment,
                            desc: `Time Series - Forecast`,
                            codeSample: `FST*100*D*F*20160101*20160131***13*orderForecast~`
                        },
                    ]
                case "LIN_FST^2":
                    return [
                        {
                            key: "FST",
                            type: TreeItemType.Segment,
                            desc: `Time Series - Planning`,
                            codeSample: `FST*100*D*F*20160101*20160131***18*grossdemand~`
                        },
                    ]
                case "LIN_FST^3":
                    return [
                        {
                            key: "FST",
                            type: TreeItemType.Segment,
                            desc: `Time Series - Inventory`,
                            codeSample: `FST*100*D*F*20160101*20160131***8X*targetStock~`
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
                codeSample: `N4*Location-To City**ZIP*AU*SP*NSW~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Party Reference`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually defined identification~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },
        ]
    }


    _getLINChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Item Identification`,
                codeSample: `LIN**VP*Vendor Part ID*BP*Buyer Part ID*VS*Vendor Supplemental Part ID*MG*Manufacturer Part ID*MF*Manufacturer Name~`
            },
            {
                key: "UIT",
                type: TreeItemType.Segment,
                desc: `Unit Detail`,
                codeSample: `UIT*EA~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Product/Item Description`,
                codeSample: `PID*F****Free-Form-Description-Text****EN~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Material Classification`,
                codeSample: `PID*S*MAC*AS*12345*Printer Series 12345**ProdFamily~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Material Characteristics`,
                codeSample: `PID*S*09*ZZ*Property*Red**color~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Serial Number Requirements`,
                codeSample: `PID*S*09*ZZ*isSNRequired***list*Y~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Serial Numbers`,
                codeSample: `PID*S*09*ZZ*serialNumber*Serial ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Status`,
                codeSample: `REF*ACC*active~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually Defined Identification~`
            },
            {
                key: "LDT",
                type: TreeItemType.Segment,
                desc: `Lead Time`,
                codeSample: `LDT*AZ*0*DA~`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Inventory/ConsignmentInventory Quantity`,
                codeSample: `QTY*33*100*EA>1~`
            },
            {
                key: "LIN_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant830ProductActivity.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
            {
                key: "LIN_FST^1",
                type: TreeItemType.Group,
                rootVersion: Assistant830ProductActivity.versionKey,
                desc: `Time Series - Forecast`,
                codeSample: ``
            },
            {
                key: "LIN_FST^2",
                type: TreeItemType.Group,
                rootVersion: Assistant830ProductActivity.versionKey,
                desc: `Time Series - Planning`,
                codeSample: ``
            },
            {
                key: "LIN_FST^3",
                type: TreeItemType.Group,
                rootVersion: Assistant830ProductActivity.versionKey,
                desc: `Time Series - Inventory`,
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
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *160104*0830*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*PS*SenderID*ReceiverID*20160104*083059*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*830*0001~`
            },
            {
                key: "BFR",
                type: TreeItemType.Segment,
                desc: `Beginning Segment for Planning Schedule`,
                codeSample: `BFR*00*PlanningScheduleID*ReleaseID*BB*A*20160101*20160131*20160104~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*06*System ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually Defined Identification~`
            },
            {
                key: "LIN",
                type: TreeItemType.Group,
                rootVersion: Assistant830ProductActivity.versionKey,
                desc: `Line Item Identification`,
                codeSample: ``
            },
            {
                key: "CTT",
                type: TreeItemType.Segment,
                desc: `Transaction Totals`,
                codeSample: `CTT*2~`
            },
            {
                key: "SE",
                type: TreeItemType.Segment,
                desc: `Transaction Set Trailer`,
                codeSample: `SE*26*0001~`
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