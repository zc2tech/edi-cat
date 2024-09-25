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
export class Assistant810 extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_810
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "N1": // Group
                    return this._getN1Children();
                    break;

                case "N9": // Group
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Letter or Notes`,
                            codeSample: `N9*L1*en*Comments~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Text~`
                        },
                    ]

                case "IT1": // Group
                    return this._getIT1Children();

                case "IT1_PID": // Group
                    return [
                        {
                            key: "PID",
                            type: TreeItemType.Segment,
                            desc: `Product/Item Description`,
                            codeSample: `PID*F*GEN***Free-Form-Description-Text****en~`
                        },
                    ]
                    break;

                case "IT1_SAC^1": // Service, Promotion, Allowance or Charge Information
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Service, Promotion, Allowance or Charge Information`,
                            codeSample: `SAC*A*H970***10000*3*5.00*****13*10.00*ContractPrice*Free-form description*en~`
                        },
                        {
                            key: "TXI",
                            type: TreeItemType.Segment,
                            desc: `Tax Information`,
                            codeSample: `TXI*TX*10.00********Tax description~`
                        },
                        {
                            key: "TXI",
                            type: TreeItemType.Segment,
                            desc: `Tax Detail Information`,
                            codeSample: `TXI*VA*10.00*10.00*VD*Location*0**100.00*Tax Category~`
                        },
                    ]
                    break;
                case "IT1_SAC^2": // Discount, Shipping/Special Handling Charge and Distribution
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Discount, Shipping/Special Handling Charge and Distribution`,
                            codeSample: `SAC*N*B840*AB*Accounting*10000*Z*100******Accounting segment ID*Accounting seg name*Accounting segment description*en~`
                        },

                    ]
                    break;
                case "IT1_SAC^3": // Tax Information
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Service, Promotion, Allowance or Charge Information`,
                            codeSample: `SAC*C*H850***14000********130.69**Tax description*en~`
                        },
                        {
                            key: "TXI",
                            type: TreeItemType.Segment,
                            desc: `Tax Detail Information`,
                            codeSample: `TXI*VA*140.00*14.00*VD*Location*0**1000.00**20170106060000ED~`
                        },
                        {
                            key: "TXI",
                            type: TreeItemType.Segment,
                            desc: `Tax Detail Information - Alternative Tax Amount`,
                            codeSample: `TXI*VA*120.51~`
                        },
                    ]
                    break;

                case "IT1_N1":
                    return this._getIT1N1Children();

                case "SAC^1": // Service, Promotion, Allowance or Charge Information
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Service, Promotion, Allowance or Charge Information`,
                            codeSample: `SAC*A*H970***10000*3*5.00*****13*10.00*ContractPrice*Free-form description*en~`
                        },
                        {
                            key: "TXI",
                            type: TreeItemType.Segment,
                            desc: `Tax Information`,
                            codeSample: `TXI*TX*10.00********Tax description~`
                        },
                        {
                            key: "TXI",
                            type: TreeItemType.Segment,
                            desc: `Tax Detail Information`,
                            codeSample: `TXI*VA*10.00*10.00*VD*Location*0**100.00*Tax Category~`
                        },
                    ]
                    break;
                case "SAC^2": // Discount, Shipping/Special Handling Charge and Distribution
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Discount, Shipping/Special Handling Charge and Distribution`,
                            codeSample: `SAC*C*H090***10000**********Free-form description*en~`
                        },

                    ]
                    break;
                case "SAC^3": // Tax Information
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Service, Promotion, Allowance or Charge Information`,
                            codeSample: `SAC*C*H850***14000********130.69**Tax description*en~`
                        },
                        {
                            key: "TXI",
                            type: TreeItemType.Segment,
                            desc: `Tax Detail Information`,
                            codeSample: `TXI*VA*140.00*14.00*VD*Location*2**1000.00**20170108012000ED~`
                        },
                        {
                            key: "TXI",
                            type: TreeItemType.Segment,
                            desc: `Tax Detail Information - Alternative Tax Amount`,
                            codeSample: `TXI*VA*120.51~`
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
                codeSample: `N4*Bill-To City**Bill-To ZIP*AU*SP*NSW~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference`,
                codeSample: `REF*VX**VAT Registration ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDDomain*Mutually Defined ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Shipment Identification`,
                codeSample: `REF*SI*Tracking ID*20170106060000ED~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Additional Carrier Identification`,
                codeSample: `REF*CN*SCAC*Carrier ID~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Bill-To Contact Name*EM*E-Mail Addr*TE*Phone ID*UR*URL~`
            },


        ]
    }
    _getIT1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "IT1",
                type: TreeItemType.Segment,
                desc: `Baseline Item Data`,
                codeSample: `IT1*1*50*EA*10.00**SN*Serial ID*VP*Supplier Part ID*VS*Supplier Supplemental Part ID*BP*Buyer Part ID*MG*Manufacturer Part ID*MF*Manufacturer Name*CH*Country Code ISO*EN*EAN ID*EA*European Waste ID*C3*Classification~`
            },

            {
                key: "CUR",
                type: TreeItemType.Segment,
                desc: `Currency`,
                codeSample: `CUR*SE*USD**SE*EUR~`
            },
            {
                key: "CTP",
                type: TreeItemType.Segment,
                desc: `Pricing Information`,
                codeSample: `CTP*WS***100*EA*CSD*0.7~`
            },
            {
                key: "PAM",
                type: TreeItemType.Segment,
                desc: `Period Amount`,
                codeSample: `PAM****1*100.00~`
            },
            {
                key: "IT1_PID",
                type: TreeItemType.Group,
                rootVersion: Assistant810.versionKey,
                desc: `Product/Item Description`,
                codeSample: ``
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference`,
                codeSample: `REF*MA*Ship Notice ID**LI>10~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Line Item Comments`,
                codeSample: `REF*L1*en*Text~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually defined identification~`
            },

            {
                key: "YNQ",
                type: TreeItemType.Segment,
                desc: `Yes/No Question - Return Item Indicator`,
                codeSample: `YNQ*Q3*Y~`
            },
            {
                key: "YNQ",
                type: TreeItemType.Segment,
                desc: `Yes/No Question - Ad-Hoc Item Indicator`,
                codeSample: `YNQ**Y********ad-hoc item~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time Reference`,
                codeSample: `DTM*004*20171030*105920*PD~`
            },

            {
                key: "IT1_SAC^1",
                type: TreeItemType.Group,
                rootVersion: Assistant810.versionKey,
                desc: `Service, Promotion, Allowance or Charge Information`,
                codeSample: ``
            },
            {
                key: "IT1_SAC^2",
                type: TreeItemType.Group,
                rootVersion: Assistant810.versionKey,
                desc: `Discount, Shipping/Special Handling Charge and Distribution`,
                codeSample: ``
            },
            {
                key: "IT1_SAC^3",
                type: TreeItemType.Group,
                rootVersion: Assistant810.versionKey,
                desc: `Tax Information`,
                codeSample: ``
            },
            {
                key: "IT1_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant810.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },



        ]
    }
    /**
     * Party Identification
     * @returns 
     */
    _getIT1N1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "N1",
                type: TreeItemType.Segment,
                desc: `Party Name`,
                codeSample: `N1*SF*Ship-From Name*92*Ship-from ID~`
            },
            {
                key: "N2",
                type: TreeItemType.Segment,
                desc: `Party Additional Name Information`,
                codeSample: `N2*Ship-From Addr Name 1*Ship-From Addr Name 2~`
            },
            {
                key: "N3",
                type: TreeItemType.Segment,
                desc: `Party Address Information`,
                codeSample: `N3*Ship-From Street 1*Ship-From Street 2~`
            },
            {
                key: "N4",
                type: TreeItemType.Segment,
                desc: `Party Geographic Location`,
                codeSample: `N4*Ship-From City**ZIP*AU*SP*NSW~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference`,
                codeSample: `REF*VX**VAT Registration ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDDomain*Mutually Defined ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Shipment Identification`,
                codeSample: `REF*SI*Tracking ID*20170106060000ED~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Additional Carrier Identification`,
                codeSample: `REF*CN*SCAC*Carrier ID~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Ship-from Contact Name*EM*E-Mail Addr*TE*Phone ID*UR*URL~`
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
                codeSample: `GS*IN*SenderID*ReceiverID*20160104*0930*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*810*0001~`
            },
            {
                key: "BIG",
                type: TreeItemType.Segment,
                desc: `Beginning Segment for Invoice`,
                codeSample: `BIG*20170103*InvoiceID*20151230*PurchaseOrderID***DI*00*NA~`
            },
            {
                key: "NTE",
                type: TreeItemType.Segment,
                desc: `Note/Special Instruction`,
                codeSample: `NTE*REG*Inc~`
            },
            {
                key: "CUR",
                type: TreeItemType.Segment,
                desc: `Currency`,
                codeSample: `CUR*SE*USD*0.980*SE*EUR~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference`,
                codeSample: `REF*AH*Master Agreement ID*1~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually defined identification~`
            },
            {
                key: "N1",
                type: TreeItemType.Group,
                rootVersion: Assistant810.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },


            {
                key: "ITD",
                type: TreeItemType.Segment,
                desc: `Terms of Sale`,
                codeSample: `ITD*01*3*10.00*20171025*10**30*1000**10000****T*5.00~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*003*20171030*105920*PD~`
            },

            {
                key: "N9",
                type: TreeItemType.Group,
                rootVersion: Assistant810.versionKey,
                desc: `Reference Identification - Comments`,
                codeSample: ``
            },
            {
                key: "IT1",
                type: TreeItemType.Group,
                rootVersion: Assistant810.versionKey,
                desc: `Baseline Item Data`,
                codeSample: ``
            },

            {
                key: "TDS",
                type: TreeItemType.Segment,
                desc: `Total Monetary Value Summary`,
                codeSample: `TDS*100000*100800*112000*90800~`
            },
            {
                key: "AMT",
                type: TreeItemType.Segment,
                desc: `Monetary Amount`,
                codeSample: `AMT*3*100.00~`
            },

            {
                key: "SAC^1",
                type: TreeItemType.Group,
                rootVersion: Assistant810.versionKey,
                desc: `Service, Promotion, Allowance or Charge Information`,
                codeSample: ``
            },

            {
                key: "SAC^2",
                type: TreeItemType.Group,
                rootVersion: Assistant810.versionKey,
                desc: `Discount, Shipping and Special Handling Charge`,
                codeSample: ``
            },

            {
                key: "SAC^3",
                type: TreeItemType.Group,
                rootVersion: Assistant810.versionKey,
                desc: `Tax Information`,
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
                codeSample: `SE*57*0001~`
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