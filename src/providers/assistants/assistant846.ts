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
export class Assistant846 extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_846;
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined{
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "LIN": // Group
                    return this._getLINChildren();
                    break;

                case "LIN_QTY^1":
                    return [
                        {
                            key: "QTY",
                            type: TreeItemType.Segment,
                            desc: `Related Inventory Quantity`,
                            codeSample: `QTY*38*100*EA~`
                        }
                    ]
                case "LIN_QTY^2":
                    return [
                        {
                            key: "QTY",
                            type: TreeItemType.Segment,
                            desc: `Inventory/ConsignmentInventory Quantity`,
                            codeSample: `QTY*QH*100*EA>2~`
                        }
                    ];
                case "LIN_QTY^3":
                    return this._getLINQTY3Children();
                    break;
                
                case "LIN_QTY^3_REF^1":
                    return [
                        {
                            key: "REF",
                            type: TreeItemType.Segment,
                            desc: `Time Series Type`,
                            codeSample: `REF*8X*custom*salesOrderQuantity~`
                        },
                    ]
                    break;
                case "LIN_QTY^3_REF^2":
                    return [
                        {
                            key: "REF",
                            type: TreeItemType.Segment,
                            desc: `Additional Document References`,
                            codeSample: `REF*0L*Sales Order ID*SalesOrder~`
                        },
                    ]
                    break;
              
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
                codeSample: `N1*LC*LocationTo Name*9*LocationFrom ID~`
            },
            {
                key: "N2",
                type: TreeItemType.Segment,
                desc: `Party Additional Name Information`,
                codeSample: `N2*LocationTo Addr Name 1*LocationTo Addr Name 2~`
            },
            {
                key: "N3",
                type: TreeItemType.Segment,
                desc: `Party Address Information`,
                codeSample: `N3*LocationTo Street 1*LocationTo Street 2~`
            },
            {
                key: "N4",
                type: TreeItemType.Segment,
                desc: `Party Geographic Location`,
                codeSample: `N4*LocationTo City**ZIP*AU*SP*NSW~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Party Reference`,
                codeSample: `REF*IR*buyerLocationID*Buyer Location ID~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },
        ]}
    
   
    _getLINQTY3Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Replenishment Time Series Quantity`,
                codeSample: `QTY*7K*10*EA~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*196*20160201*060000*ED~`
            },
            {
                key: "LS",
                type: TreeItemType.Segment,
                desc: `Loop Header`,
                codeSample: `LS*REF~`
            },
            {
                key: "LIN_QTY^3_REF^1",
                type: TreeItemType.Group,
                rootVersion: Assistant846.versionKey,
                desc: `Time Series Type`,
                codeSample: ``
            },
            {
                key: "LIN_QTY^3_REF^2",
                type: TreeItemType.Group,
                rootVersion: Assistant846.versionKey,
                desc: `Additional Document References`,
                codeSample: ``
            },
            {
                key: "LE",
                type: TreeItemType.Segment,
                desc: `Loop Trailer`,
                codeSample: `LE*REF~`
            },
        ]
    }
    _getLINChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Item Identification`,
                codeSample: `LIN*1*C3*CC*BP*Buyer Part ID*VP*Vendor Part ID*VS*Vendor Supplemental Part ID*DV*Material Storage Location*MG*Manufacturer Part ID*MF*Manufacturer Name~`
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
                codeSample: `PID*S*09*ZZ*Property*Red**color~`
            },
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurements`,
                codeSample: `MEA*TI*MI*10*DW~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*184*20160103*1015*LT~`
            },
            
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Material Characteristics`,
                codeSample: `REF*PRT*Red*colorCharacteristic123~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Batch Numbers`,
                codeSample: `REF*BT*Supplier Batch ID*Buyer Batch ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Additional Batch Information`,
                codeSample: `REF*BT*productionDate*20151210100000ET~`
            },
            {
                key: "LDT",
                type: TreeItemType.Segment,
                desc: `Lead Time`,
                codeSample: `LDT*AF*20*DA~`
            },
            {
                key: "LIN_QTY^1",
                type: TreeItemType.Group,
                rootVersion: Assistant846.versionKey,
                desc: `Related Inventory Quantity`,
                codeSample: ``
            },
            {
                key: "LIN_QTY^2",
                type: TreeItemType.Group,
                rootVersion: Assistant846.versionKey,
                desc: `Inventory/ConsignmentInventory Quantity`,
                codeSample: ``
            },
            {
                key: "LIN_QTY^3",
                type: TreeItemType.Group,
                rootVersion: Assistant846.versionKey,
                desc: `Replenishment Time Series Quantity`,
                codeSample: ``
            },
            {
                key: "LIN_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant846.versionKey,
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
                codeSample: `GS*IB*SenderID*ReceiverID*20160104*0930*1*X*004010~`
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
                codeSample: `BIA*00*SI*201001151008*20160103*1030~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Process Type`,
                codeSample: `REF*PHC*SMI~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Credentials`,
                codeSample: `REF*06*System ID~`
            },
            {
                key: "LIN",
                type: TreeItemType.Group,
                rootVersion: Assistant846.versionKey,
                desc: `Item Identification`,
                codeSample: ``
            },
            {
                key: "CTT",
                type: TreeItemType.Segment,
                desc: `Transaction Totals`,
                codeSample: `CTT*1~`
            },

            {
                key: "SE",
                type: TreeItemType.Segment,
                desc: `Transaction Set Trailer`,
                codeSample: `SE*29*0001~`
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