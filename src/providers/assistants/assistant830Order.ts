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
export class Assistant830Order extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_830_Order;
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "N1": // Group
                    return this._getN1Children();
                    break;
                case "LIN": // Group
                    return this._getLINChildren();
                    break;
                case "LIN_N1": // Group
                    return this._getLINN1Children();
                    break;
                case "LIN_FST": // Group
                    return [
                        {
                            key: "FST",
                            type: TreeItemType.Segment,
                            desc: `Forecast Schedule`,
                            codeSample: `FST*100*D*D*20160101*20160131~`
                        },
                        {
                            key: "QTY",
                            type: TreeItemType.Segment,
                            desc: `Quantity`,
                            codeSample: `QTY*02*10000*EA~`
                        },
                    ]
                
            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }
    _getN1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "N1",
                type: TreeItemType.Segment,
                desc: `Party Name`,
                codeSample: `N1*BT*Bill-To Name*92*Bill-To ID~`
            },
            {
                key: "N2",
                type: TreeItemType.Segment,
                desc: `Party Additional Name Information`,
                codeSample: `N2*Bill-To Addr Name 1*Bill-To Addr Name 2~`
            },
            {
                key: "N3",
                type: TreeItemType.Segment,
                desc: `Party Address Information`,
                codeSample: `N3*Bill-To Street 1*Bill-To Street 2~`
            },
            {
                key: "N4",
                type: TreeItemType.Segment,
                desc: `Party Geographic Location`,
                codeSample: `N4*Bill-To City**ZIP*AU*SP*NSW~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Party Reference`,
                codeSample: `REF*AP**Accounts Receivable ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDDomain*Mutually Defined ID~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*AP*Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },
           

        ]
    }
    _getLINN1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "N1",
                type: TreeItemType.Segment,
                desc: `Party Name`,
                codeSample: `N1*ST*Ship-To Name*92*Ship-To ID~`
            },
            {
                key: "N2",
                type: TreeItemType.Segment,
                desc: `Party Additional Name Information`,
                codeSample: `N2*Ship-To Addr Name 1*Ship-To Addr Name 2~`
            },
            {
                key: "N3",
                type: TreeItemType.Segment,
                desc: `Party Address Information`,
                codeSample: `N3*Ship-To Street 1*Ship-To Street 2~`
            },
            {
                key: "N4",
                type: TreeItemType.Segment,
                desc: `Party Geographic Location`,
                codeSample: `N4*Ship-To City**ZIP*AU*SP*NSW~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Party Reference`,
                codeSample: `REF*AP**Accounts Receivable ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDDomain*Mutually Defined ID~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*RE*Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },
           

        ]
    }

    _getLINFSTChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "FST",
                type: TreeItemType.Segment,
                desc: `Forecast Schedule`,
                codeSample: ``
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: ``
            },
            {
                key: "SDQ",
                type: TreeItemType.Segment,
                desc: `Destination Quantity`,
                codeSample: ``
            },
            {
                key: "LIN_FST_JIT",
                type: TreeItemType.Group,
                rootVersion: Assistant830Order.versionKey,
                desc: `Just-in-Time Schedule`,
                codeSample: ``
            },

        ]
    }

    _getLINChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Item Identification`,
                codeSample: `LIN*10*VP*Vendor Part ID*BP*Buyer Part ID*VS*Vendor Supplemental Part ID*MG*Manufacturer Part ID*MF*Manufacturer Name*EN*EAN ID*UP*UPC ID*C3*Classification~`
            },
            {
                key: "UIT",
                type: TreeItemType.Segment,
                desc: `Unit Detail`,
                codeSample: `UIT*EA~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*002*20200110*083059*CT~`
            },
           
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Product/Item Description`,
                codeSample: `PID*F*GEN***Free-Form-Description-Text****EN~`
            },
           
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Product/Item Configuration`,
                codeSample: `PID*F*21***Configurable Material~`
            },
           
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurements`,
                codeSample: `MEA*PD*G*100.00*KG~`
            },
           
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*AH*Agreement ID~`
            },
           
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Fine Line Classification`,
                codeSample: `REF*FL**lean~`
            },
           
            {
                key: "FOB",
                type: TreeItemType.Segment,
                desc: `F.O.B. Related Instructions`,
                codeSample: `FOB*CC*OF*Terms of Delivery Code*01*EXW*ZZ*Shipment Method of Payment Text~`
            },
           
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY*63*100*EA~`
            },
           
            {
                key: "TD5",
                type: TreeItemType.Segment,
                desc: `Carrier Details - Shipping Contract Number`,
                codeSample: `TD5*Z*ZZ*Shipment Contract ID*J~`
            },
           
            {
                key: "TD5",
                type: TreeItemType.Segment,
                desc: `Carrier Details - Carrier Identification Number`,
                codeSample: `TD5*Z*2*SCAC~`
            },
           
            {
                key: "LIN_N1",
                type: TreeItemType.Group,
                rootVersion:Assistant830Order.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
           
            {
                key: "LIN_FST",
                type: TreeItemType.Group,
                rootVersion:Assistant830Order.versionKey,
                desc: `Forecast Schedule`,
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
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *200104*0830*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*PS*SenderID*ReceiverID*20200104*083059*1*X*004010~`
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
                codeSample: `BFR*00*Forecast ID**DL*A*20200104**20200104**Agreement ID*Forecast ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*VN*Supplier Order ID~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*004*20200104*083059*CT~`
            },
            {
                key: "N1",
                type: TreeItemType.Group,
                rootVersion: Assistant830Order.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
            {
                key: "LIN",
                type: TreeItemType.Group,
                rootVersion: Assistant830Order.versionKey,
                desc: `Line Item`,
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
                codeSample: `SE*34*0001~`
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