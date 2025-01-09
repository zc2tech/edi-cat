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
export class Assistant855 extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_855
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "SAC^1":
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Service, Promotion, Allowance or Charge Information`,
                            codeSample: `SAC*A*H970***10000*3*5.00*****13*10.00*ContractPrice*Free-form description*EN~`
                        },
                        {
                            key: "CUR",
                            type: TreeItemType.Segment,
                            desc: `Currency`,
                            codeSample: `CUR*BY*USD*****196*20160104*1010*197*20160104*1011~`
                        },

                    ]
                case "SAC^2":
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Shipping cost`,
                            codeSample: `SAC*C*G830***10000********TrackingID*TrackingDomain*Shipping description*EN~`
                        },
                        {
                            key: "CUR",
                            type: TreeItemType.Segment,
                            desc: `Currency`,
                            codeSample: `CUR*BY*USD~`
                        },

                    ]
                case "SAC^3":
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Tax Information`,
                            codeSample: `SAC*C*H850***10000**********Free-form description*EN~`
                        },
                        {
                            key: "CUR",
                            type: TreeItemType.Segment,
                            desc: `Currency`,
                            codeSample: `CUR*BY*USD~`
                        },
                    ]
                
                case "N9^1":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification`,
                            codeSample: `N9*L1**RejectionReason~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Unable to Supply Item(s)~`
                        },
                    ]
                    break;
                case "N9^2":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification`,
                            codeSample: `N9*L1*en*Comments~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Free-Form-Message-Text~`
                        },
                    ]
                    break;
                case "N9^3":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification`,
                            codeSample: `N9*L1*en*shipping~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Free-Form-Message-Text~`
                        },
                    ]
                    break;
                case "N9^4":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification`,
                            codeSample: `N9*L1*en*tax~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Free-Form-Message-Text~`
                        },
                    ]
                    break;
                case "N9^5":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification`,
                            codeSample: `N9*ZZ*MutuallyDefinedIDName~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Mutually defined identification~`
                        },
                    ]
                    break;
                case "N1":
                    return this._getN1Children();
                    break;
                case "PO1":
                    return this._getPO1Children();
                    break;
                case "PO1_PID":
                    return [
                        {
                            key: "PID",
                            type: TreeItemType.Segment,
                            desc: `Product/Item Description`,
                            codeSample: `PID*F*GEN***Description****EN~`
                        },
                    ]
                    break;
                case "PO1_N1":
                    return this._getN1Children();
                    break;
                case "CTT":
                    return [
                        {
                            key: "CTT",
                            type: TreeItemType.Segment,
                            desc: `Transaction Totals`,
                            codeSample: `CTT*1*100~`
                        },
                        {
                            key: "AMT",
                            type: TreeItemType.Segment,
                            desc: `Total Transaction Amount`,
                            codeSample: `AMT*TT*1000.00~`
                        },
                    ]
                case "PO1_SAC^1":
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Shipping, Original Price and Distribution`,
                            codeSample: `SAC*A*H970***10000*3*5.00*****13*10.00*ContractPrice*Free-form description*EN~`
                        },
                        {
                            key: "CUR",
                            type: TreeItemType.Segment,
                            desc: `Currency`,
                            codeSample: `CUR*BY*USD*****196*20160104*1010*197*20160104*1011~`
                        },

                    ]
                    break;
                case "PO1_SAC^2":
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Service, Promotion, Allowance or Charge Information`,
                            codeSample: `SAC*C*G830***10000********TrackingID*TrackingDomain*Shipping description*EN~`
                        },
                        {
                            key: "CUR",
                            type: TreeItemType.Segment,
                            desc: `Currency`,
                            codeSample: `CUR*BY*USD~`
                        },

                    ]
                case "PO1_SAC^3":
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Tax Information`,
                            codeSample: `SAC*C*H850***10000**********Free-form description*EN~`
                        },
                        {
                            key: "CUR",
                            type: TreeItemType.Segment,
                            desc: `Currency`,
                            codeSample: `CUR*BY*USD~`
                        },

                    ]
                case "PO1_ACK":
                    return [
                        {
                            key: "ACK",
                            type: TreeItemType.Segment,
                            desc: `Line Item Acknowledgement`,
                            codeSample: `ACK*IC*100*EA*068*20160111**VP*Vendor Part ID*VS*Supplier Supplemental Part ID*BP*Buyer Part ID*MG*Manufacturer Part ID*MF*Manufacturer*PD*Part Description*C3*Classification*B8*Batch ID*UP*UPC Part ID~`
                        },
                        {
                            key: "DTM",
                            type: TreeItemType.Segment,
                            desc: `Date/Time`,
                            codeSample: `DTM*017*20160111*1400*20~`
                        },

                    ]
                case "PO1_SCH":
                    return [
                        {
                            key: "SCH",
                            type: TreeItemType.Segment,
                            desc: `Line Item Schedule`,
                            codeSample: `SCH*1*EA***002*20210929*1107****1~`
                        },
                        {
                            key: "REF",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification`,
                            codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually defined identification~`
                        },
                    ]
                case "PO1_N9^1":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification`,
                            codeSample: `N9*L1**RejectionReason~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Unable to Supply Item(s)~`
                        },

                    ]
                case "PO1_N9^2":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification`,
                            codeSample: `N9*L1*en*Comments~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Free-Form-Message-Text~`
                        },

                    ]
                case "PO1_N9^3":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification`,
                            codeSample: `N9*L1*en*shipping~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Free-Form-Message-Text~`
                        },

                    ]
                case "PO1_N9^4":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification`,
                            codeSample: `N9*L1*en*tax~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Free-Form-Message-Text~`
                        },

                    ]
                case "PO1_N9^5":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification`,
                            codeSample: `N9*ZZ*MutuallyDefinedIDName~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Mutually defined identification~`
                        },

                    ]


                default:

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
                codeSample: `N1*SU*Supplier Name*92*Supplier ID~`
            },
            {
                key: "N2",
                type: TreeItemType.Segment,
                desc: `Party Additional Name Information`,
                codeSample: `N2*Supplier Addr Name 1*Supplier Addr Name 2~`
            },
            {
                key: "N3",
                type: TreeItemType.Segment,
                desc: `Party Address Information`,
                codeSample: `N3*Supplier Street 1*Supplier Street 2~`
            },
            {
                key: "N4",
                type: TreeItemType.Segment,
                desc: `Party Geographic Location`,
                codeSample: `N4*Supplier City*IL*ZIP*AU*SP*NSW~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Party Reference`,
                codeSample: `REF*ZA**Supplier Additional ID~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },

        ]
    }

    _getRootChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ISA",
                type: TreeItemType.Segment,
                desc: `Interchange Control Header`,
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *160105*1030*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*PR*SenderID*ReceiverID*20160105*1030*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*855*0001~`
            },
            {
                key: "BAK",
                type: TreeItemType.Segment,
                desc: `Beginning Segment for Purchase Order Acknowledgement`,
                codeSample: `BAK*00*AE*Purchase Order ID*20160104****PurchaseOrderConfirmationID*20160105~`
            },
            {
                key: "CUR",
                type: TreeItemType.Segment,
                desc: `Currency`,
                codeSample: `CUR*BY*USD~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*ON*Purchase Order ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually defined identification~`
            },
            {
                key: "FOB",
                type: TreeItemType.Segment,
                desc: `F.O.B. Related Instructions`,
                codeSample: `FOB*DE***01*EXW~`
            },


            {
                key: "SAC^1",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Service, Promotion, Allowance or Charge Information`,
                codeSample: ``
            },
            {
                key: "SAC^2",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Service, Shipping cost`,
                codeSample: ``
            },
            {
                key: "SAC^3",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Service, Tax Information`,
                codeSample: ``
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time Reference`,
                codeSample: `DTM*ACK*20160104*0930*CT~`
            },
            {
                key: "TXI",
                type: TreeItemType.Segment,
                desc: `Tax Detail Information`,
                codeSample: `TXI*VA*10.00*5.00*VD*Location*0**100.00~`
            },

            {
                key: "N9^1",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Reference Identification - Rejection Reason`,
                codeSample: ``
            },
            {
                key: "N9^2",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Reference Identification - Comments`,
                codeSample: ``
            },
            {
                key: "N9^3",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Reference Identification - Shipping Description`,
                codeSample: ``
            },
            {
                key: "N9^4",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Reference Identification - Tax Description`,
                codeSample: ``
            },
            {
                key: "N9^5",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Reference Identification - Mutually Defined References`,
                codeSample: ``
            },
            {
                key: "N1",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
            {
                key: "PO1",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
            {
                key: "CTT",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Transaction Totals`,
                codeSample: ``
            },
            {
                key: "SE",
                type: TreeItemType.Segment,
                desc: `Transaction Set Trailer`,
                codeSample: `SE*68*0001~`
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

    _getPO1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "PO1",
                type: TreeItemType.Segment,
                desc: `Line Item Data`,
                codeSample: `PO1*10*100*EA~`
            },
            {
                key: "CUR",
                type: TreeItemType.Segment,
                desc: `Currency`,
                codeSample: `CUR*BY*USD~`
            },
            {
                key: "CTP",
                type: TreeItemType.Segment,
                desc: `Pricing Information - Unit Price`,
                codeSample: `CTP*AS*CUP*0.64~`
            },
            {
                key: "CTP",
                type: TreeItemType.Segment,
                desc: `Pricing Information - Price Basis Quantity`,
                codeSample: `CTP*WS***100*EA*CSD*1~`
            },
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurements`,
                codeSample: `MEA*PD*G*100*KG~`
            },
            {
                key: "PO1_PID",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Product/Item Description`,
                codeSample: ``
            },

            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Fine Line Classification`,
                codeSample: `REF*FL*1*item~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually defined identification~`
            },

            {
                key: "PO1_SAC^1",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Service, Promotion, Allowance or Charge Information`,
                codeSample: ``
            },
            {
                key: "PO1_SAC^2",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Service, Promotion, Allowance or Charge Information`,
                codeSample: ``
            },
            {
                key: "PO1_SAC^3",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Service, Promotion, Allowance or Charge Information`,
                codeSample: ``
            },
            {
                key: "PO1_ACK",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Line Item Acknowledgement`,
                codeSample: ``
            },
            {
                key: "TXI",
                type: TreeItemType.Segment,
                desc: `Tax Information`,
                codeSample: `TXI*ST*4538*8.25*VD*California***550~`
            },
            {
                key: "PO1_SCH",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Line Item Schedule`,
                codeSample: ``
            },
            {
                key: "PO1_N9^1",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Reference Identification - Rejection Reason`,
                codeSample: ``
            },
            {
                key: "PO1_N9^2",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Reference Identification - Comments`,
                codeSample: ``
            },
            {
                key: "PO1_N9^3",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Reference Identification - Shipping Description`,
                codeSample: ``
            },
            {
                key: "PO1_N9^4",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Reference Identification - Tax Description`,
                codeSample: ``
            },
            {
                key: "PO1_N9^5",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Reference Identification - Mutually Defined References`,
                codeSample: ``
            },

            {
                key: "PO1_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant855.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },           
        ]
    }

    _getPO1N1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "N1",
                type: TreeItemType.Segment,
                desc: `Party Name`,
                codeSample: `N1*ST*Shipl-To Name*92*Ship-To ID~`
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
                codeSample: `REF*4C**Storage Location ID~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },
        ]
    }
}