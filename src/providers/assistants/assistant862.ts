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
export class Assistant862 extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_862;
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
                case "LIN_FST": // Group
                    return this._getLINFSTChildren();
                    break;
                case "LIN_FST_JIT": // Group
                    return [
                        {
                            key: "JIT",
                            type: TreeItemType.Segment,
                            desc: `Just-in-Time Schedule`,
                            codeSample: `JIT*100*103000~`
                        }]
                    break;
                case "LIN_SHP^1": // Group
                    return [
                        {
                            key: "SHP",
                            type: TreeItemType.Segment,
                            desc: `Cumulative Quantity/Release Information`,
                            codeSample: `SHP*87*800*405*20160115*120000*20160131*120000~`
                        },
                        {
                            key: "REF",
                            type: TreeItemType.Segment,
                            desc: `References`,
                            codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually defined identification~`
                        }
                    ]
                    break;
                case "LIN_SHP^2": // Group
                    return [
                        {
                            key: "SHP",
                            type: TreeItemType.Segment,
                            desc: `Shipped/Received Information`,
                            codeSample: `SHP*90*800*111*20160101*120000~`
                        },
                        {
                            key: "REF",
                            type: TreeItemType.Segment,
                            desc: `References`,
                            codeSample: `REF*MA*DespatchAdvise ID*Description~`
                        }
                    
                    ]
                    break;
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
                codeSample: `REF*AP**Accounts receivable ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually Defined Identification~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*AP*Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },
            {
                key: "FOB",
                type: TreeItemType.Segment,
                desc: `F.O.B. Related Instructions`,
                codeSample: `FOB*DF***ZZ*FOB~`
            },

        ]
    }

    _getLINFSTChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "FST",
                type: TreeItemType.Segment,
                desc: `Forecast Schedule`,
                codeSample: `FST*100*C*Z*20160101*20160131***BV*1~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*002*20160101*1030*CT~`
            },
            {
                key: "SDQ",
                type: TreeItemType.Segment,
                desc: `Destination Quantity`,
                codeSample: `SDQ*EA**CUMULATIVE SCHEDULED QTY*900*RECEIVED QTY*800~`
            },
            {
                key: "LIN_FST_JIT",
                type: TreeItemType.Group,
                rootVersion: Assistant862.versionKey,
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
                codeSample: `LIN*1*VP*Vendor Part ID*BP*Buyer Part ID*VS*Vendor Supplemental Part ID*MG*Manufacturer Part ID*MF*Manufacturer Name*C3*Classification*EN*EAN Part ID*PD*Item Description*KB*consignment~`
            },
            {
                key: "UIT",
                type: TreeItemType.Segment,
                desc: `Unit Detail`,
                codeSample: `UIT*EA*20.00~`
            },
            {
                key: "PKG",
                type: TreeItemType.Segment,
                desc: `Marking, Packaging, Loading`,
                codeSample: `PKG*F*01*ZZ*Code*Packaging Description~`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY*38*100~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*CT*Contract ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Fine Line Classification`,
                codeSample: `REF*FL**lean~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Supplier Identification Numbe`,
                codeSample: `REF*ZA*Supplier DUNS ID*DUNS~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually Defined Identification~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*SC*Buyer Planning Contact ID~`
            },
            {
                key: "LIN_FST",
                type: TreeItemType.Group,
                rootVersion: Assistant862.versionKey,
                desc: `Forecast Schedule`,
                codeSample: ``
            },
            {
                key: "LIN_SHP^1",
                type: TreeItemType.Group,
                rootVersion: Assistant862.versionKey,
                desc: `Cumulative Quantity/Release Information`,
                codeSample: ``
            },
            {
                key: "LIN_SHP^2",
                type: TreeItemType.Group,
                rootVersion: Assistant862.versionKey,
                desc: `Shipped/Received Information`,
                codeSample: ``
            },
            {
                key: "TD5",
                type: TreeItemType.Segment,
                desc: `Carrier Details`,
                codeSample: `TD5*Z*ZZ*Shipment Contract ID*A***ZZ*Description~`
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
                codeSample: `GS*SS*SenderID*ReceiverID*20160104*123059*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*862*0001~`
            },
            {
                key: "BSS",
                type: TreeItemType.Segment,
                desc: `Beginning Segment for Shipping Schedule/Production Sequence`,
                codeSample: `BSS*00*RL*20160101*BB*20160102*20160104*1*RequisitionID*AgreementID*OrderID~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*004*20160101*0830*CT~`
            },
            {
                key: "N1",
                type: TreeItemType.Group,
                rootVersion: Assistant862.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
            {
                key: "LIN",
                type: TreeItemType.Group,
                rootVersion: Assistant862.versionKey,
                desc: `Line Item`,
                codeSample: ``
            },
            {
                key: "CTT",
                type: TreeItemType.Segment,
                desc: `Transaction Totals`,
                codeSample: `CTT*1*100~`
            },
            {
                key: "SE",
                type: TreeItemType.Segment,
                desc: `Transaction Set Trailer`,
                codeSample: `SE*31*0001~`
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