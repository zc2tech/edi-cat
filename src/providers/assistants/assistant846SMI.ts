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
export class Assistant846SMI extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_846_SMI;
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "LIN": // Group
                    return this._getLINChildren();
                    break;

                case "LIN_QTY":
                    return [
                        {
                            key: "QTY",
                            type: TreeItemType.Segment,
                            desc: `Quantity`,
                            codeSample: `QTY*QH*100*EA>1~`
                        }
                    ]
             
                case "LIN_N1":
                    return this._getLINN1Children();
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
                codeSample: `LIN**VP*Vendor Part ID*BP*Buyer Part ID*VS*Vendor Supplemental Part ID*MF*Manufacturer Name*MG*Manufacturer Part ID~`
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
                desc: `Material Characteristics`,
                codeSample: `PID*S*MAC*AS*12345*Printer Series 12345**ProdFamily~`
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
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurements`,
                codeSample: `MEA*TI*MI*10*DW~`
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
                desc: `References - Additional Document References`,
                codeSample: `REF*0L*QualityNotification*QN ID*0L>20160110010000ET~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `BatchGroup - Level A - Batch, Identification Numbers`,
                codeSample: `REF*BT*Supplier Batch ID*Buyer Batch ID*0L>A1~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `BatchGroup - Level A - Batch, Additional Information`,
                codeSample: `REF*BT*productionDate*20151210100000ET*01>A1~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `BatchGroup - Level B - PropertyValuation, Property ID References`,
                codeSample: `REF*ADB*domain*ID*0L>A1-B1-Z1~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `BatchGroup - Level C - ValueGroup, Property ID Reference`,
                codeSample: `REF*ADC*domain*ID2*0L>A1-B1-C2-Z1>ADE>ID1~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `BatchGroup - Level D - PropertyValue, Characteristics`,
                codeSample: `REF*ADD*domain*Value1*0L>A1-B1-C2-D1-Z1>ADE>ID1>S3>name~`
            },
           
            {
                key: "UIT",
                type: TreeItemType.Segment,
                desc: `Unit Detail`,
                codeSample: `UIT*EA~`
            },
            {
                key: "LDT",
                type: TreeItemType.Segment,
                desc: `Lead Time`,
                codeSample: `LDT*AF*20*DA~`
            },

            {
                key: "LIN_QTY",
                type: TreeItemType.Group,
                rootVersion: Assistant846SMI.versionKey,
                desc: `Quantity`,
                codeSample: ``
            },
   
            {
                key: "LIN_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant846SMI.versionKey,
                desc: `Party Identification`,
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
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *160104*0930*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*IB*SenderID*ReceiverID*20160104*093059*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*846*0001~`
            },
            {
                key: "BIA",
                type: TreeItemType.Segment,
                desc: `Beginning Segment for Inventory Inquiry/Advice`,
                codeSample: `BIA*00*SI*InventoryAdviceID*20160104*0930*AC~`
            },
            {
                key: "LIN",
                type: TreeItemType.Group,
                rootVersion: Assistant846SMI.versionKey,
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