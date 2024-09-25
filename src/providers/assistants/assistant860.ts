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
export class Assistant860 extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_860;
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
                            desc: `Shipping and Original Price`,
                            codeSample: `SAC*C*G830***4680********SAC-Reference ID**SAC-Description*EN~`
                        },
                        {
                            key: "CUR",
                            type: TreeItemType.Segment,
                            desc: `Currency`,
                            codeSample: `CUR*BY*USD*0.9*SE*EUR~`
                        },
                    ]
                    break;
                case "SAC^2":
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Service, Promotion, Allowance or Charge Information`,
                            codeSample: `SAC*A*D500*ZZ**4680*6*0.12******AMT_PRI*1*SAC-Description*EN~`
                        },
                        {
                            key: "CUR",
                            type: TreeItemType.Segment,
                            desc: `Currency`,
                            codeSample: `CUR*BY*USD*****196*20160104*1010*197*20160104*1011~`
                        },
                    ]
                    break;
                case "N9^1":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Purchasing Card Information`,
                            codeSample: `N9*PSM*0000000000000000*VISA~`
                        },
                        {
                            key: "DTM",
                            type: TreeItemType.Segment,
                            desc: `Date/Time`,
                            codeSample: `DTM*036****UN*2021-03-12~`
                        },
                    ]
                    break;
                case "N9^2":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Additional Information`,
                            codeSample: `N9*U2**Terms~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Text*LC~`
                        },
                    ]
                    break;
                case "N9^3":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - External Document Information`,
                            codeSample: `N9*43*External Document Reference*ERP Doc Type~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*External Document Text*LC~`
                        },
                    ]
                    break;
                case "N9^4":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Comments and Attachments`,
                            codeSample: `N9*L1*EN*Comments****L1>Reason~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Text*LC~`
                        },
                    ]
                    break;
                case "N9^5":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Control keys`,
                            codeSample: `N9*KD*OCValue*allowed~`
                        },
                    ]
                    break;
                case "N9^6":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Mutually Defined References`,
                            codeSample: `N9*ZZ**MutuallyDefinedIDName~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Message Text`,
                            codeSample: `MSG*Mutually Defined Identification*LC~`
                        },
                    ]
                    break;
                case "N1": // Group
                    return this._getN1Children();
                    break;
                case "POC":
                    return this._getPOCChildren();
                    break;
                
                case "POC_PID^1":
                    return [
                        {
                            key: "PID",
                            type: TreeItemType.Segment,
                            desc: `Product/Item Description`,
                            codeSample: `PID*F*GEN***Free-Form-Description-Text****EN~`
                        },

                    ]
                    break;
                case "POC_PID^2":
                    return [
                        {
                            key: "PID",
                            type: TreeItemType.Segment,
                            desc: `Product/Item Shipping Instructions`,
                            codeSample: `PID*F*93***Shipping Instruction Text****EN~`
                        },

                    ]
                    break;
                case "POC_PID^3":
                    return [
                        {
                            key: "PID",
                            type: TreeItemType.Segment,
                            desc: `Product/Item Configuration`,
                            codeSample: `PID*F*21***Configurable Material~`
                        },

                    ]
                    break;
                case "POC_PID^4":
                    return [
                        {
                            key: "PID",
                            type: TreeItemType.Segment,
                            desc: `Product/Item Material or Service Classification`,
                            codeSample: `PID*F*12***material~`
                        },

                    ]
                    break;
                case "POC_PID^5":
                    return [
                        {
                            key: "PID",
                            type: TreeItemType.Segment,
                            desc: `Product/Item Classification`,
                            codeSample: `PID*S*MAC*UN*451215***SPSC~`
                        },

                    ]
                    break;
                case "POC_SAC^1":
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Shipping, Original Price and Distribution`,
                            codeSample: `SAC*C*G830***4680********SAC-Reference ID**SAC-Description*EN~`
                        },
                        {
                            key: "CUR",
                            type: TreeItemType.Segment,
                            desc: `Currency`,
                            codeSample: `CUR*BY*USD*0.9*SE*EUR~`
                        },

                    ]
                    break;
                case "POC_SAC^2":
                    return [
                        {
                            key: "SAC",
                            type: TreeItemType.Segment,
                            desc: `Service, Promotion, Allowance or Charge Information`,
                            codeSample: `SAC*C*D240*ZZ**4680*6*0.12******AMT_PRI*1*SAC-Description*EN~`
                        },
                        {
                            key: "CUR",
                            type: TreeItemType.Segment,
                            desc: `Currency`,
                            codeSample: `CUR*BY*USD*****196*20160104*1010*197*20160104*1011~`
                        },

                    ]
                    break;
                case "POC_QTY":
                    return [
                        {
                            key: "QTY",
                            type: TreeItemType.Segment,
                            desc: `Range Maximum/Minimum`,
                            codeSample: `QTY*7D*100~`
                        },

                    ]
                    break;
                case "POC_SCH":
                    return [
                        {
                            key: "SCH",
                            type: TreeItemType.Segment,
                            desc: `Line Item Schedule`,
                            codeSample: `SCH*100*EA*ST*Ship-To Name*002*20160111*083059*010*20160113*183159*001*20160113~`
                        },

                    ]
                    break;
                
                case "POC_N9^1":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Characteristics`,
                            codeSample: `N9*PRT*size~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Large~`
                        },

                    ]
                    break;
                case "POC_N9^2":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Special Indicators`,
                            codeSample: `N9*ACE*requiresServiceEntry*yes~`
                        },
                    ]
                    break;
                case "POC_N9^3":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Quality Information`,
                            codeSample: `N9*H6*yes*Control code****H6>Control Code ID~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Message Text`,
                            codeSample: `MSG*Control Code Text~`
                        },

                    ]
                    break;
                case "POC_N9^4":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Additional Document References`,
                            codeSample: `N9*0L*PO ID*ProductionOrder*20160130*093059*CT*LI>01>72>001~`
                        },

                    ]
                    break;
                case "POC_N9^5":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Comments`,
                            codeSample: `N9*L1*EN*Comments****L1>Reason~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*Text*LC~`
                        },

                    ]
                    break;
                case "POC_N9^6":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Item URL`,
                            codeSample: `N9*URL*URL*URL Reference~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Free-Form Message Text`,
                            codeSample: `MSG*http://www.url/~`
                        },

                    ]
                    break;
                case "POC_N9^7":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Control keys`,
                            codeSample: `N9*KD*OCValue*allowed~`
                        },

                    ]
                    break;
                case "POC_N9^8":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification - Mutually Defined References`,
                            codeSample: `N9*ZZ**MutuallyDefinedIDName~`
                        },
                        {
                            key: "MSG",
                            type: TreeItemType.Segment,
                            desc: `Message Text`,
                            codeSample: `MSG*Mutually Defined Identification*LC~`
                        },
                    ]
                    break;
                case "POC_N1":
                    return this._getPOCN1Children();
                case "POC_SLN":
                    return this._getPOCSLNChildren();
                case "POC_SLN_N9^1":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Reference Identification`,
                            codeSample: `N9*LT**Component Buyer Batch ID~`
                        },
                    ]
                case "POC_SLN_N9^2":
                    return [
                        {
                            key: "N9",
                            type: TreeItemType.Segment,
                            desc: `Material Provision Indicator - Subcontracting Type`,
                            codeSample: `N9*SU*materialProvisionIndicator*reworkTo~`
                        },
                    ]
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
                            desc: `Monetary Amount`,
                            codeSample: `AMT*TT*640.00~`
                        },
                    ]
                //POC_SLN_N9
            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }

    _getPOCChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "POC",
                type: TreeItemType.Segment,
                desc: `Line Item Data`,
                codeSample: `POC*10*RZ*100*10*EA*0.64**VP*Supplier Part ID*BP*Buyer Part ID*VS*Supplier Supplemental Part ID*MG*Manufacturer Part ID*MF*Manufacturer Name*C3*Classification*EN*EAN Part ID*UP*UPC Package ID~`
            },
            {
                key: "CUR",
                type: TreeItemType.Segment,
                desc: `Currency`,
                codeSample: `CUR*BY*USD*0.900*SE*EUR~`
            },
            {
                key: "PO3",
                type: TreeItemType.Segment,
                desc: `Additional Item Detail`,
                codeSample: `PO3*ZZ****ST*100*EA~`
            },
            {
                key: "CTP",
                type: TreeItemType.Segment,
                rootVersion: Assistant860.versionKey,
                desc: `Pricing Information`,
                codeSample: `CTP*WS***100*EA*CSD*0.7~`
            },
            {
                key: "CTP",
                type: TreeItemType.Segment,
                rootVersion: Assistant860.versionKey,
                desc: `Line Item Amount/Unit Price`,
                codeSample: `CTP*TR*MAX*1000.00~`
            },
        
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurements`,
                codeSample: `MEA*PD*G*100.00*KG~`
            },
            {
                key: "POC_PID^1",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Product/Item Description`,
                codeSample: ``
            },
            {
                key: "POC_PID^2",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Product/Item Shipping Instruction`,
                codeSample: ``
            },
            {
                key: "POC_PID^3",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Product/Item Configuration`,
                codeSample: ``
            },
            {
                key: "POC_PID^4",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Product/Item Material or Service Classification`,
                codeSample: ``
            },
            {
                key: "POC_PID^5",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Product/Item Classification`,
                codeSample: ``
            },
            {
                key: "PKG",
                type: TreeItemType.Segment,
                desc: `Marking, Packaging, Loading`,
                codeSample: `PKG*F*01*ZZ*Code*Packaging Description~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*ZA*Supplier ID*DUNS~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Additional Information`,
                codeSample: `REF*0L*FOB05*MyOwnTermsTransportTerms~`
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
                desc: `References - Item Category`,
                codeSample: `REF*KQ*consignment~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually Defined Identification~`
            },
            {
                key: "POC_SAC^1",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Shipping, Original Price and Distribution`,
                codeSample: ``
            },
            {
                key: "POC_SAC^2",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Service, Promotion, Allowance or Charge Information`,
                codeSample: ``
            },
            {
                key: "FOB",
                type: TreeItemType.Segment,
                desc: `F.O.B. Related Instructions`,
                codeSample: `FOB*DF*OF*Description*01*EXW*ZZ*@TPTransport description@TODDelivery at the doorstep~`
            },
            {
                key: "SDQ",
                type: TreeItemType.Segment,
                desc: `Destination Quantity - Packaging Distribution`,
                codeSample: `SDQ*EA*54*Store ID*100~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*002*20160111*101059*CT~`
            },
            {
                key: "TXI",
                type: TreeItemType.Segment,
                desc: `Tax Information`,
                codeSample: `TXI*ZZ*10.00*10.00*CD*TaxLoc*0**100.00*CU*Description~`
            },
            {
                key: "POC_QTY",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Quantity`,
                codeSample: ``
            },
            {
                key: "POC_SCH",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Line Item Schedule`,
                codeSample: ``
            },
            {
                key: "POC_N9^1",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Characteristics`,
                codeSample: ``
            },
            {
                key: "POC_N9^2",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Special Indicators`,
                codeSample: ``
            },
            {
                key: "POC_N9^3",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Quality Information`,
                codeSample: ``
            },
            {
                key: "POC_N9^4",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Additional Document References`,
                codeSample: ``
            },
            {
                key: "POC_N9^5",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Comments`,
                codeSample: ``
            },
            {
                key: "POC_N9^6",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Item URL`,
                codeSample: ``
            },
            {
                key: "POC_N9^7",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Control keys`,
                codeSample: ``
            },
            {
                key: "POC_N9^8",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Mutually Defined References`,
                codeSample: ``
            },
            {
                key: "POC_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
            {
                key: "POC_SLN",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
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
                key: "TD5",
                type: TreeItemType.Segment,
                desc: `Carrier Details - Transport Information`,
                codeSample: `TD5*Z*ZZ*Shipping Contract ID*A***ZZ*Shipping Instruction Text~`
            },
            {
                key: "TD4",
                type: TreeItemType.Segment,
                desc: `Carrier Details - Carrier Identification`,
                codeSample: `TD4*ZZZ***Carrier Company Name XYZ@companyName~`
            },

        ]
    }
    _getPOCSLNChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "SLN",
                type: TreeItemType.Segment,
                desc: `Subcontracting Components`,
                codeSample: `SLN*C10*001*O*10.00*EA****BP*Buyer Component Part ID*VP*Supplier Component Part ID*VS*Supplier Supplemental component Part ID~`
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
                codeSample: `DTM*106*20160111*1020*CT~`
            },
            {
                key: "POC_SLN_N9^1",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification`,
                codeSample: ``
            },
            {
                key: "POC_SLN_N9^2",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Material Provision Indicator - Subcontracting Type`,
                codeSample: ``
            },

        ]
    }

    _getPOCN1Children(): TreeItemElement[] | null | undefined {
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
                codeSample: `REF*AP**Accounts receivable ID~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },
            {
                key: "TD5",
                type: TreeItemType.Segment,
                desc: `Carrier Details - Transport Information`,
                codeSample: `TD5*Z*ZZ*Shipping Contract ID*A***ZZ*Shipping Instruction Text~`
            },
            {
                key: "TD4",
                type: TreeItemType.Segment,
                desc: `Carrier Details - Carrier Identification`,
                codeSample: `TD4*ZZZ***Carrier Company Name XYZ@companyName~`
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
                codeSample: `GS*PC*SenderID*ReceiverID*20160104*093059*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*860*0001~`
            },
            {
                key: "BCH",
                type: TreeItemType.Segment,
                desc: `Beginning Segment for Purchase Order Change`,
                codeSample: `BCH*03*KN*PurchaseOrderID*ReleaseID**20160104~`
            },
            {
                key: "CUR",
                type: TreeItemType.Segment,
                desc: `Currency`,
                codeSample: `CUR*BY*USD*0.900*SE*EUR~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*VN*Supplier Order ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Promotional Deal Number`,
                codeSample: `REF*PD*Promotional Deal ID*Promotional Deal Description~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Priority`,
                codeSample: `REF*RPP*1*High Priority*RPP>Sequence ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Additional Information`,
                codeSample: `REF*0L*FOB05*MyOwnTermsTransportTerms~`
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
                desc: `Purchasing Legal Entity and Organizational Unit`,
                codeSample: `PER*ZZ*CompanyCode ID*******CompanyCode~`
            },
            {
                key: "FOB",
                type: TreeItemType.Segment,
                desc: `F.O.B. Related Instructions`,
                codeSample: `FOB*DF*ZZ*Description*ZZ*EXW*ZZ*@TPTransport description@TODDelivery at the doorstep~`
            },
            {
                key: "CSH",
                type: TreeItemType.Segment,
                desc: `Sales Requirements`,
                codeSample: `CSH*SC~`
            },
            {
                key: "SAC^1",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Shipping and Original Price`,
                codeSample: ``
            },
            {
                key: "SAC^2",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Service, Promotion, Allowance or Charge Information`,
                codeSample: ``
            },
            {
                key: "ITD",
                type: TreeItemType.Segment,
                desc: `Terms of Sale`,
                codeSample: `ITD*05*3*****30*****PaymentTermsDescription***15~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*004*20160104*093059*CT~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Shipping Instructions`,
                codeSample: `PID*F*93***Shipping Instruction Text****EN~`
            },
            {
                key: "TXI",
                type: TreeItemType.Segment,
                desc: `Tax Information`,
                codeSample: `TXI*ZZ*10.00*10.00*CD*TaxLoc*0**100.00*CU*Description~`
            },
            {
                key: "N9^1",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Purchasing Card Information`,
                codeSample: ``
            },
            {
                key: "N9^2",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Additional Information`,
                codeSample: ``
            },
            {
                key: "N9^3",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - External Document Information`,
                codeSample: ``
            },
            {
                key: "N9^4",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Comments and Attachments`,
                codeSample: ``
            },
            {
                key: "N9^5",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Control keys`,
                codeSample: ``
            },
            {
                key: "N9^6",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Reference Identification - Mutually Defined References`,
                codeSample: ``
            },
            {
                key: "N1",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
            {
                key: "POC",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Line Item`,
                codeSample: ``
            },
            {
                key: "CTT",
                type: TreeItemType.Group,
                rootVersion: Assistant860.versionKey,
                desc: `Transaction Totals`,
                codeSample: ``
            },
            {
                key: "SE",
                type: TreeItemType.Segment,
                desc: `Transaction Set Trailer`,
                codeSample: `SE*95*0001~`
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