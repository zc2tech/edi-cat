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
export class Assistant820 extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_820;
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "N1": // Group
                    return this._getN1Children();
                    break;
                case "ENT":
                    return this._getENTChildren();
                case "ENT_RMR":
                    return this._getENT_RMR_Children();
                case "ENT_RMR_ADX":
                    return [
                        {
                            key: "ADX",
                            type: TreeItemType.Segment,
                            desc: `Adjustment`,
                            codeSample: `ADX*100.00*CS~`
                        },
                        {
                            key: "NTE",
                            type: TreeItemType.Segment,
                            desc: `Note/Special Instruction`,
                            codeSample: `NTE*CBH*Adjustment Description Text~`
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
                codeSample: `N1*PE*Payee Name*92*Payee ID~`
            },
            {
                key: "N2",
                type: TreeItemType.Segment,
                desc: `Party Additional Name Information`,
                codeSample: `N2*Payee Addr Name 1*Payee Addr Name 2~`
            },
            {
                key: "N3",
                type: TreeItemType.Segment,
                desc: `Party Address Information`,
                codeSample: `N3*Payee Street 1*Payee Street 2~`
            },
            {
                key: "N4",
                type: TreeItemType.Segment,
                desc: `Party Geographic Location`,
                codeSample: `N4*Payee City**ZIP*AU*SP*NSW~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Party Reference`,
                codeSample: `REF*01*ABA Routing ID~`
            },
            {
                key: "PER",
                type: TreeItemType.Segment,
                desc: `Administrative Communications Contact`,
                codeSample: `PER*CN*Contact Name*EM*e-mail Address*TE*Phone ID*UR*URL~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*036*20161010*1010*01~`
            },           
        ]
    }
    _getENTChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ENT",
                type: TreeItemType.Segment,
                desc: `Entity`,
                codeSample: `ENT*1~`
            },
            {
                key: "ENT_RMR",
                type: TreeItemType.Group,
                rootVersion:Assistant820.versionKey,
                desc: `Remittance Advice Accounts Receiveable Open Item Reference`,
                codeSample: ``
            },
        ]
    }
    _getENT_RMR_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "RMR",
                type: TreeItemType.Segment,
                desc: `Remittance Advice Accounts Receiveable Open Item Reference`,
                codeSample: `RMR*IV*Invoice ID**1000.00*2000.00*900.00~`
            },
            {
                key: "NTE",
                type: TreeItemType.Segment,
                desc: `Note/Special Instruction`,
                codeSample: `NTE*PMT*Payment Description Text~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually defined identification~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*003*20161010*1010*01~`
            },
    
            {
                key: "ENT_RMR_ADX",
                type: TreeItemType.Group,
                rootVersion:Assistant820.versionKey,
                desc: `Adjustment`,
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
                codeSample: `ISA*00*          *00*          *ZZ*Sender ID      *ZZ*Receiver ID    *161012*1230*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*RA*SenderID*ReceiverID*20161012*1230*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*820*0001~`
            },
            {
                key: "BPR",
                type: TreeItemType.Segment,
                desc: `Beginning Segment for Payment Order/Remittance Advice`,
                codeSample: `BPR*I*1000.00*C*ACH**01*000001234567*10*0000100***02*000002345678*10*0000200*20161012~`
            },
            {
                key: "NTE",
                type: TreeItemType.Segment,
                desc: `Note/Special Instruction`,
                codeSample: `NTE*PMT*Payment Description Text~`
            },
            {
                key: "TRN",
                type: TreeItemType.Segment,
                desc: `Trace`,
                codeSample: `TRN*1*Payment Remittance ID~`
            },
            {
                key: "CUR",
                type: TreeItemType.Segment,
                desc: `Currency`,
                codeSample: `CUR*BY*USD*907.32*ZZ*EUR~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*ZZ*MutuallyDefinedIDName*Mutually defined identification~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*097*20161010*0830*CT~`
            },

            {
                key: "N1",
                type: TreeItemType.Group,
                rootVersion:Assistant820.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
            {
                key: "ENT",
                type: TreeItemType.Group,
                rootVersion:Assistant820.versionKey,
                desc: `Entity`,
                codeSample: ``
            },
          
            {
                key: "SE",
                type: TreeItemType.Segment,
                desc: `Transaction Set Trailer`,
                codeSample: `SE*22*0001~`
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