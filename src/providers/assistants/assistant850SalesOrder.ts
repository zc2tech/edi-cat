import { SegmentParserBase } from "../../new_parser/segmentParserBase";
import { EdifactParser } from "../../new_parser/edifactParser";
import { EdiElement, EdiSegment, EdiType } from "../../new_parser/entities";
import { X12Parser } from "../../new_parser/x12Parser";
import * as vscode from "vscode";
import * as constants from "../../cat_const";
import { TreeItemType, TreeItemElement, EdiGroup, ElementAttribute } from "../treeEntity";
import { AssistantBase } from "./assistantBase";

/**
 * Don't add sample code for Group, it's always the responsibility of child segment.
 * 
 */
export class Assistant850SalesOrder extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_850_SalesOrder;
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {

            switch (element.key) {
                
                case "N9":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Letter or Notes`,
                            codeSample: `N9*L1*EN*Comments****L1>CommentType~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Text*LC~`
                        },
                    ]
                    break;
                
                case "N1": // Group
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
                            codeSample: `PID*F****Free-Form-Description-Text****EN~`
                        },

                    ]
                    break;
                
                case "PO1_QTY":
                    return [
                        {
                            key: "QTY",
                            type: TreeItemType.Segment,
                            desc: `Quantity`,
                            codeSample: `QTY*27*20~`
                        },

                    ]
                    break;
                case "PO1_SCH":
                    return [
                        {
                            key: "SCH",
                            type: TreeItemType.Segment,
                            desc: `Line Item Schedule`,
                            codeSample: `SCH*100*EA*ST*Ship-To Name*002*20210106*120000*010*20210106*080000*1~`
                        },
                        {
                            key: "REF",
                            type: TreeItemType.Segment,
                            desc: `References - Mutually Defined References`,
                            codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually Defined Identification~`
                        },

                    ]
                    break;
              
                case "PO1_N1":
                    return this._getPO1N1Children();
                case "PO1_SLN":
                    return this._getPO1SLNChildren();
               
                case "CTT":
                    return [
                        {
                            key: "CTT",
                            type: TreeItemType.Segment,
                            desc: `Transaction Totals`,
                            codeSample: `CTT*1~`
                        }
                    ]
                //PO1_SLN_N9
            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }

    _getPO1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "PO1",
                type: TreeItemType.Segment,
                desc: `Line Item Data`,
                codeSample: `PO1*10*100*EA*0.64**VP*Supplier Part ID*BP*Buyer Part ID*VS*Supplier Supplemental Part ID*C3*Classification*B8*Supplier Batch ID*LT*Buyer Batch ID~`
            },
            {
                key: "CUR",
                type: TreeItemType.Segment,
                desc: `Currency`,
                codeSample: `CUR*BY*USD~`
            },
            {
                key: "PO1_PID",
                type: TreeItemType.Group,
                rootVersion:Assistant850SalesOrder.versionKey,
                desc: `Product/Item Description`,
                codeSample: ``
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually Defined Identification~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Additional Information`,
                codeSample: `REF*ACC**Created~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Item Category`,
                codeSample: `REF*KQ*consignment~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Batch Information`,
                codeSample: `REF*BT*productionDate*20210103090000CT~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*002*20210106*100000*CT~`
            },
            {
                key: "PO1_QTY",
                type: TreeItemType.Group,
                rootVersion:Assistant850SalesOrder.versionKey,
                desc: `Quantity`,
                codeSample: ``
            },
            {
                key: "PO1_SCH",
                type: TreeItemType.Group,
                rootVersion:Assistant850SalesOrder.versionKey,
                desc: `Line Item Schedule`,
                codeSample: ``
            },
            {
                key: "PO1_N1",
                type: TreeItemType.Group,
                rootVersion:Assistant850SalesOrder.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
            {
                key: "PO1_SLN",
                type: TreeItemType.Group,
                rootVersion:Assistant850SalesOrder.versionKey,
                desc: `Subcontracting Components`,
                codeSample: ``
            },

           
        ]
    }
    _getN1Children(): TreeItemElement[] | null | undefined {
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
                codeSample: `REF*ME**Postal Address Name~`
            },
           
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },
           

        ]
    }
    _getPO1SLNChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "SLN",
                type: TreeItemType.Segment,
                desc: `Subcontracting Components`,
                codeSample: `SLN*C10*1*O*10.00*EA****BP*Buyer Component Part ID*VP*Supplier Component Part ID*VS*Supplier Supplemental component Part ID*B8*Supplier Batch ID*LT*Buyer Batch ID~`
            },
            {
                key: "MSG",
                type: TreeItemType.Segment,
                desc: `Message Text`,
                codeSample: `MSG*Free-Form-Description~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*106*20210106*120000*CT~`
            },
           
        ]
    }

    _getPO1N1Children(): TreeItemElement[] | null | undefined {
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
                codeSample: `REF*ME**Postal Address Name~`
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
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *210105*0930*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*PO*SenderID*ReceiverID*20210105*0930*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*850*0001~`
            },
            {
                key: "BEG",
                type: TreeItemType.Segment,
                desc: `Beginning Segment for Purchase Order`,
                codeSample: `BEG*00*NE*SalesOrderID**20210105~`
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
                desc: `References - Additional Information`,
                codeSample: `REF*8X**buy~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually Defined Identification~`
            },          
            {
                key: "N9",
                type: TreeItemType.Group,
                rootVersion: Assistant850SalesOrder.versionKey,
                desc: `Reference Identification - Comments`,
                codeSample: ``
            },
           
            {
                key: "N1",
                type: TreeItemType.Group,
                rootVersion: Assistant850SalesOrder.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
            {
                key: "PO1",
                type: TreeItemType.Group,
                rootVersion: Assistant850SalesOrder.versionKey,
                desc: `Line Item`,
                codeSample: ``
            },
            {
                key: "CTT",
                type: TreeItemType.Group,
                rootVersion: Assistant850SalesOrder.versionKey,
                desc: `Transaction Totals`,
                codeSample: ``
            },
            {
                key: "SE",
                type: TreeItemType.Segment,
                desc: `Transaction Set Trailer`,
                codeSample: `SE*35*0001~`
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