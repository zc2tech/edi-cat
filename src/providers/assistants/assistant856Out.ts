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
export class Assistant856Out extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_856_Out
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "HL^1":
                    return this._getHL1Children();
                case "HL^1_N1":
                    return this._getHL1N1Children();
                case "HL^2":
                    return this._getHL2Children();
                case "HL^2_N1":
                    return this._getHL2N1Children();
                case "HL^3":
                    return this._getHL3Children();
                case "HL^4":
                    return this._getHL4Children();
                case "HL^5":
                    return this._getHL5Children();
                case "HL^6":
                    return this._getHL6Children();
                case "HL^7":
                    return this._getHL7Children();
                case "HL^8":
                    return this._getHL8Children();
                default:

            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }




    /**
     * Hierarchical Level - Shipment
     * @returns 
     */
    _getHL1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "HL",
                type: TreeItemType.Segment,
                desc: `Hierarchical Level - Shipment`,
                codeSample: `HL*1**S*1~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Simple Comments`,
                codeSample: `PID*F*GEN***General Shipment Text****EN~`
            },

            {
                key: "TD1",
                type: TreeItemType.Segment,
                desc: `Carrier Details (Total Number of Packaging)`,
                codeSample: `TD1*PLT*1~`
            },
            {
                key: "TD1",
                type: TreeItemType.Segment,
                desc: `Carrier Details (Weight)`,
                codeSample: `TD1******G*100*LB~`
            },
            {
                key: "TD1",
                type: TreeItemType.Segment,
                desc: `Carrier Details (Volume)`,
                codeSample: `TD1*********100*LT~`
            },
            {
                key: "TD5",
                type: TreeItemType.Segment,
                desc: `Carrier Details (Carrier Information/Transport Information)`,
                codeSample: `TD5**2*SCAC*J*Carrier Name**ZZ*Carrier PRO ID****NM*9A*CX~`
            },
            {
                key: "TD3",
                type: TreeItemType.Segment,
                desc: `Carrier Details (Equipment)`,
                codeSample: `TD3*TL**Trailer ID******Seal ID~`
            },
            {
                key: "TD4",
                type: TreeItemType.Segment,
                desc: `Carrier Details (Hazardous Materials)`,
                codeSample: `TD4**U*0004*Hazard Description~`
            },
            {
                key: "TD4",
                type: TreeItemType.Segment,
                desc: `Carrier Details (Carrier Identification)`,
                codeSample: `TD4*ZZZ***UPS@domainXYZ~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*DJ**Delivery Note ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Additional Tracking Number Information`,
                codeSample: `REF*CN*Tracking URL*20190111060000ET~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Bill Of Lading Number`,
                codeSample: `REF*BM*Bill Of Lading ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Additional Information`,
                codeSample: `REF*0L*TODComments*Terms Of Delivery Text~`
            },
           
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Complex Comments`,
                codeSample: `REF*L1*01*Complex Order Text 01*L1>EN>0L>CommentType01 - first 30 Chars>0L>CommentType01 - next 30 Chars~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Attachments`,
                codeSample: `REF*URL*01*URL Address - first 80 Chars*0L>URLname>URL>URL Address - next 30 Chars>URL>URL Address -next 30 Chars~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually Defined Identification~`
            },

            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*011*20190111*141010*ET~`
            },
            {
                key: "FOB",
                type: TreeItemType.Segment,
                desc: `F.O.B Related Instructions`,
                codeSample: `FOB*DF*ZN*DeliveryCondition*ZZ*FOB*ZZ*InsuranceCostsPaidByConsignor~`
            },
            {
                key: "HL^1_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant856Out.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },          

        ]
    }
    /**
     * Hierarchical Level - Order
     * @returns 
     */
    _getHL2Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "HL",
                type: TreeItemType.Segment,
                desc: `Hierarchical Level - Order`,
                codeSample: `HL*2*1*O*1~`
            },
            {
                key: "PRF",
                type: TreeItemType.Segment,
                desc: `Purchase Order Reference`,
                codeSample: `PRF*Purchase Order ID***20190104**Agreement ID~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Simple Comments`,
                codeSample: `PID*F*GEN***General Order Text****EN~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*PO**Purchase Order ID - more than 22 characters~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Complex Comments`,
                codeSample: `REF*L1*01*Complex Order Text 01*L1>EN>0L>CommentType01 - first 30 Chars>0L>CommentType01 - next 30 Chars~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Attachments`,
                codeSample: `REF*URL*01*URL Address - first 80 Chars*0L>URLname>URL>URL Address - next 30 Chars>URL>URL Address -next 30 Chars~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually Defined Identification~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*004*20190104*093059*20~`
            },
            {
                key: "HL^2_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant856Out.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
        ]
    }
    /**
     * Hierarchical Level - Tare (BSN05 = 0001)
     * @returns 
     */
    _getHL3Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "HL",
                type: TreeItemType.Segment,
                desc: `Hierarchical Level - Tare (BSN05 = 0001)`,
                codeSample: `HL*3*2*T*1~`
            },
            {
                key: "PO4",
                type: TreeItemType.Segment,
                desc: `Item Physical Details`,
                codeSample: `PO4****PLT**200*KG*20*CR*200.1*200.2*200.3*CM~`
            },
          
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers - SSCC`,
                codeSample: `MAN*GM*0000123450000000018~`
            },
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers - GIAI`,
                codeSample: `MAN*ZZ*GIAI*9012345ABC1357~`
            },
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers - Package Tracking Number`,
                codeSample: `MAN*CA*Pallet Tracking ID~`
            },

        ]
    }

    /**
     * Hierarchical Level - Pack (BSN05 = 0001)
     * @returns 
     */
    _getHL4Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "HL",
                type: TreeItemType.Segment,
                desc: `Hierarchical Level - Tare (BSN05 = 0001)`,
                codeSample: `HL*4*3*P*1~`
            },
            {
                key: "PO4",
                type: TreeItemType.Segment,
                desc: `Item Physical Details`,
                codeSample: `PO4****CTN**100*KG*10*CR*100.1*100.2*100.3*CM~`
            },
          
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers - SSCC`,
                codeSample: `MAN*GM*0000123450000000018~`
            },
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers - GIAI`,
                codeSample: `MAN*ZZ*GIAI*9012345ABC1357~`
            },
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers - Package Tracking Number`,
                codeSample: `MAN*CA*Carton Tracking ID~`
            },
        ]
    }

    /**
     * Hierarchical Level - Item
     * @returns 
     */
    _getHL5Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "HL",
                type: TreeItemType.Segment,
                desc: `Hierarchical Level - Item`,
                codeSample: `HL*5*4*I*1~`
            },
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Line Item Identification`,
                codeSample: `LIN*1*PL*10*VP*Vendor Part ID*VS*Vendor Supplemental Part ID*BP*Buyer Part ID*B8*Supplier Batch ID*LT*Buyer Batch ID*SN*Serial ID*EN*EAN ID*UP*UPC Package ID*MG*Manufacturer Part ID*MF*Manufacturer Name*C3*UNSPSC Class ID*HD*Harmonized System ID~`
            },
            {
                key: "SN1",
                type: TreeItemType.Segment,
                desc: `Item Detail (Shipment)`,
                codeSample: `SN1*10*100*EA**100*EA~`
            },
            {
                key: "SLN",
                type: TreeItemType.Segment,
                desc: `Subline Item Detail - Unit Price`,
                codeSample: `SLN*10**O***100~`
            },
            {
                key: "PO4",
                type: TreeItemType.Segment,
                desc: `Item Physical Details`,
                codeSample: `PO4*1*10*EA*CTN90**10.5*KG*0.16*CR*0.8*0.5*0.4*MR~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Description`,
                codeSample: `PID*F****Item-Description****en~`
            },
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurements`,
                codeSample: `MEA*PD*G*100*KG~`
            },
            {
                key: "TD4",
                type: TreeItemType.Segment,
                desc: `Carrier Details (Hazardous Materials)`,
                codeSample: `TD4**U*0004*Hazard Description~`
            },

            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Fine Line Classification`,
                codeSample: `REF*FL**composite*FL>groupLevel~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*PD**Promotional Deal ID~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Batch Information`,
                codeSample: `REF*BT*productionDate*20190108012000ED~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Comments`,
                codeSample: `REF*L1*01*Complex Order Text 01*L1>EN>0L>CommentType01 - first 30 Chars>0L>CommentType01 - next 30 Chars~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Attachments`,
                codeSample: `REF*URL*01*URL Address - first 80 Chars*0L>URLname>URL>URL Address - next 30 Chars>URL>URL Address -next 30 Chars~`
            },
           
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References - Mutually Defined References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually Defined Identification~`
            },
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers`,
                codeSample: `MAN*L*SN*Asset Serial ID*L*AT*Asset Tag ID~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*036*20191201~`
            },
            {
                key: "CUR",
                type: TreeItemType.Segment,
                desc: `Currency`,
                codeSample: `CUR*SE*USD~`
            },
        ]
    }
    /**
     * Hierarchical Level - Component
     * @returns 
     */
    _getHL6Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "HL",
                type: TreeItemType.Segment,
                desc: `Hierarchical Level - Component`,
                codeSample: `HL*6*5*F*0~`
            },
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Line Item Identification`,
                codeSample: `LIN*1*VP*Comp Supplier Part ID*VS*Comp Supplier Supplemental Part ID*BP*Comp Buyer Part ID*B8*Comp Supplier Batch ID*LT*Comp Buyer Batch ID*SN*Comp Serial ID~`
            },
            {
                key: "SN1",
                type: TreeItemType.Segment,
                desc: `Item Detail (Shipment)`,
                codeSample: `SN1**1*EA~`
            },
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers`,
                codeSample: `MAN*L*SN*Comp Asset Serial ID*L*AT*Comp Asset Tag ID~`
            },
        ]
    }

    /**
     * Hierarchical Level - Tare (BSN05 = 0002)
     * @returns 
     */
    _getHL7Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "HL",
                type: TreeItemType.Segment,
                desc: `Hierarchical Level - Tare (BSN05 = 0002)`,
                codeSample: `HL*7*5*T*1~`
            },
            {
                key: "PO4",
                type: TreeItemType.Segment,
                desc: `Item Physical Details`,
                codeSample: `PO4****PLT**200*KG*20*CR*200.1*200.2*200.3*CM~`
            },
           
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers - SSCC`,
                codeSample: `MAN*GM*0000123450000000018~`
            },
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers - GIAI`,
                codeSample: `MAN*ZZ*GIAI*9012345ABC1357~`
            },
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers - Package Tracking Number`,
                codeSample: `MAN*CA*Pallet Tracking ID~`
            },
        ]
    }

    /**
     * Hierarchical Level - Pack (BSN05 = 0002)
     * @returns 
     */
    _getHL8Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "HL",
                type: TreeItemType.Segment,
                desc: `Hierarchical Level - Pack (BSN05 = 0002)`,
                codeSample: `HL*8*7*P*0~`
            },
            {
                key: "PO4",
                type: TreeItemType.Segment,
                desc: `Item Physical Details`,
                codeSample: `PO4*1*100*EA*CTN**100*KG*10*CR*100.1*100.2*100.3*CM~`
            },
          
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers - SSCC`,
                codeSample: `MAN*GM*0000123450000000018~`
            },
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers - GIAI`,
                codeSample: `MAN*ZZ*GIAI*9012345ABC1357~`
            },
            {
                key: "MAN",
                type: TreeItemType.Segment,
                desc: `Marks and Numbers - Package Tracking Number`,
                codeSample: `MAN*CA*Carton Tracking ID~`
            },

        ]
    }

    _getHL1N1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "N1",
                type: TreeItemType.Segment,
                desc: `Party Name`,
                codeSample: `N1*DA*Delivery party Name*9*Delivery party ID~`
            },
            {
                key: "N2",
                type: TreeItemType.Segment,
                desc: `Party Additional Name Information`,
                codeSample: `N2*Delivery party Addr Name 1*Delivery party Addr Name 2~`
            },
            {
                key: "N3",
                type: TreeItemType.Segment,
                desc: `Party Address Information`,
                codeSample: `N3*Delivery party Street 1*Delivery party Street 2~`
            },
            {
                key: "N4",
                type: TreeItemType.Segment,
                desc: `Party Geographic Location`,
                codeSample: `N4*Delivery party City**ZIP*AU*SP*NSW~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Party Reference`,
                codeSample: `REF*VX**VAT ID~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Delivery party Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },

        ]
    }
    _getHL2N1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "N1",
                type: TreeItemType.Segment,
                desc: `Party Name`,
                codeSample: `N1*SF*Ship From Name*9*Ship From ID~`
            },
            {
                key: "N2",
                type: TreeItemType.Segment,
                desc: `Party Additional Name Information`,
                codeSample: `N2*Ship From Addr Name 1*Ship From Addr Name 2~`
            },
            {
                key: "N3",
                type: TreeItemType.Segment,
                desc: `Party Address Information`,
                codeSample: `N3*Ship From Street 1*Ship From Street 2~`
            },
            {
                key: "N4",
                type: TreeItemType.Segment,
                desc: `Party Geographic Location`,
                codeSample: `N4*Ship From City**ZIP*AU*SP*NSW~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Party Reference`,
                codeSample: `REF*VX**VAT ID~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Ship-From Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },

        ]
    }
    _getRootChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ISA",
                type: TreeItemType.Segment,
                desc: `Interchange Control Header`,
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *160111*1314*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*SH*SenderID*ReceiverID*20190111*131459*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*856*0001~`
            },
            {
                key: "BSN",
                type: TreeItemType.Segment,
                desc: `Beginning Segment for Ship Notice`,
                codeSample: `BSN*00*Ship Notice ID*20190111*131459*0001*PL*B44~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*011*20190111*141010*ET~`
            },
            {
                key: "HL^1",
                type: TreeItemType.Group,
                rootVersion: Assistant856Out.versionKey,
                desc: `Hierarchical Level - Shipment`,
                codeSample: ``
            },
            {
                key: "HL^2",
                type: TreeItemType.Group,
                rootVersion: Assistant856Out.versionKey,
                desc: `Hierarchical Level - Order`,
                codeSample: ``
            },
            {
                key: "HL^3",
                type: TreeItemType.Group,
                rootVersion: Assistant856Out.versionKey,
                desc: `Hierarchical Level - Tare (BSN05 = 0001)`,
                codeSample: ``
            },
            {
                key: "HL^4",
                type: TreeItemType.Group,
                rootVersion: Assistant856Out.versionKey,
                desc: `Hierarchical Level - Pack (BSN05 = 0001)`,
                codeSample: ``
            },
            {
                key: "HL^5",
                type: TreeItemType.Group,
                rootVersion: Assistant856Out.versionKey,
                desc: `Hierarchical Level - Item`,
                codeSample: ``
            },
            {
                key: "HL^6",
                type: TreeItemType.Group,
                rootVersion: Assistant856Out.versionKey,
                desc: `Hierarchical Level - Component`,
                codeSample: ``
            },
            {
                key: "HL^7",
                type: TreeItemType.Group,
                rootVersion: Assistant856Out.versionKey,
                desc: `Hierarchical Level - Tare (BSN05 = 0002)`,
                codeSample: ``
            },
            {
                key: "HL^8",
                type: TreeItemType.Group,
                rootVersion: Assistant856Out.versionKey,
                desc: `Hierarchical Level - Pack (BSN05 = 0002)`,
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
                codeSample: `SE*84*0001~`
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