import { SegmentParserBase } from "../../new_parser/segmentParserBase";
import { EdifactParser } from "../../new_parser/edifactParser";
import { EdiElement, EdiSegment, EdiType } from "../../new_parser/entities";
import { X12Parser } from "../../new_parser/x12Parser";
import * as vscode from "vscode";
import * as constants from "../../cat_const";
import { TreeItemType, TreeItemElement, EdiGroup, ElementAttribute } from "../treeEntity";
import { AssistantBase } from "./assistantBase";

/**
 * 842 Inbound and 842 Outbound are identical in hierarchy and sample code
 * Just because we have respective manual, so are the assistants
 * 
 * Don't add sample code for Group, it's always the responsibility of child segment.
 * 
 * 
 */
export class Assistant842In extends AssistantBase {
    public static versionKey = constants.versionKeys.X12_842_In
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "N1":
                    return this._getN1Children();
                case "HL^1":
                    return this._getHL1Children();
                case "HL^1_SPS":
                    return [
                        {
                            key: "SPS",
                            type: TreeItemType.Segment,
                            desc: `Summary Statistics`,
                            codeSample: `SPS*1*1*1~`
                        },
                    ];
                case "HL^1_NCD":
                    return this._getHL1_NCD_Children();
                case "HL^1_NCD_N1":
                    return this._getHL1_NCD_N1_Children();
                case "HL^1_NCD_NCA^1":
                    return this._getHL1_NCD_NCA1_Children();
                case "HL^1_NCD_NCA^1_N1^1":
                    return [
                        {
                            key: "N1",
                            type: TreeItemType.Segment,
                            desc: `Party Identification - Task Processor`,
                            codeSample: `N1*QD*Processor Name*92*Processor ID**BY~`
                        },
                    ];
                case "HL^1_NCD_NCA^1_N1^2":
                    return [
                        {
                            key: "N1",
                            type: TreeItemType.Segment,
                            desc: `Party Identification - Task Owner`,
                            codeSample: `N1*BY**92*User ID~`
                        },
                    ];
                case "HL^1_NCD_NCA^1_N1^3":
                    return [
                        {
                            key: "N1",
                            type: TreeItemType.Segment,
                            desc: `Party Identification - Completed By`,
                            codeSample: `N1*9K**92*completedBy User ID~`
                        },
                    ];

                case "HL^1_NCD_NCA^2":
                    return this._getHL1_NCD_NCA2_Children();
                case "HL^1_NCD_NCA^2_N1":
                    return [
                        {
                            key: "N1",
                            type: TreeItemType.Segment,
                            desc: `Party Identification - Activity Owner`,
                            codeSample: `N1*BY**92*User ID~`
                        },
                    ];
                case "HL^2": // Hierarchical Level - Item
                    return this._getHL2Children();

                case "HL^2_SPS":
                    return [
                        {
                            key: "SPS",
                            type: TreeItemType.Segment,
                            desc: `Summary Statistics`,
                            codeSample: `SPS*1*1*1~`
                        },
                    ];
                case "HL^2_NCD":
                    return this._getHL2_NCD_Children();
                case "HL^2_NCD_N1":
                    return [
                        {
                            key: "N1",
                            type: TreeItemType.Segment,
                            desc: `Party Identification - Defect Owner`,
                            codeSample: `N1*BY**92*User ID~`
                        },
                    ];
                case "HL^2_NCD_NCA^1":
                    return this._getHL2_NCD_NCA1_Children();
                case "HL^2_NCD_NCA^1_N1^1":
                    return [
                        {
                            key: "N1",
                            type: TreeItemType.Segment,
                            desc: `Party Identification - Task Processor`,
                            codeSample: `N1*QD*Processor Name*92*Processor ID**BY~`
                        },
                    ];
                case "HL^2_NCD_NCA^1_N1^2":
                    return [
                        {
                            key: "N1",
                            type: TreeItemType.Segment,
                            desc: `Party Identification - Task Owner`,
                            codeSample: `N1*BY**92*User ID~`
                        },
                    ];
                case "HL^2_NCD_NCA^1_N1^3":
                    return [
                        {
                            key: "N1",
                            type: TreeItemType.Segment,
                            desc: `Party Identification - Completed By`,
                            codeSample: `N1*9K**92*completedBy User ID~`
                        },
                    ];
                case "HL^2_NCD_NCA^2":
                    return this._getHL2_NCD_NCA2_Children();
                case "HL^2_NCD_NCA^2_N1":
                    return [
                        {
                            key: "N1",
                            type: TreeItemType.Segment,
                            desc: `Party Identification - Activity Owner`,
                            codeSample: `N1*BY**92*User ID~`
                        },
                    ];
                case "HL^2_NCD_NCA^3":
                    return this._getHL2_NCD_NCA3_Children();
                case "HL^2_NCD_NCA^3_N1":
                    return [
                        {
                            key: "N1",
                            type: TreeItemType.Segment,
                            desc: `Party Identification - Cause Owner`,
                            codeSample: `N1*BY**92*User ID~`
                        },
                    ];
                case "HL^3": // Hierarchical Level - Component
                    return this._getHL3Children();
                default:

            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }

    /**
         * Nonconformance Description
         * @returns 
         */
    _getHL1_NCD_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "NCD",
                type: TreeItemType.Segment,
                desc: `Nonconformance Description`,
                codeSample: `NCD*52~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*516*20170501*151345*MT~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Nonconformance Code`,
                codeSample: `REF*BZ*QM*Problem Details*H6>subject>6P>3>6P>Quality activity~`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY*86*250.00*EA~`
            },
            {
                key: "HL^1_NCD_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Party Identification - Nonconformance Notes`,
                codeSample: ``
            },
            {
                key: "HL^1_NCD_NCA^1",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Nonconformance Action - Task`,
                codeSample: ``
            },
            {
                key: "HL^1_NCD_NCA^2",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Nonconformance Action - Activity`,
                codeSample: ``
            },

        ]
    }


    /**
    * Nonconformance Action - Task
    * @returns 
    */
    _getHL1_NCD_NCA1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "NCA",
                type: TreeItemType.Segment,
                desc: `Nonconformance Action - Task`,
                codeSample: `NCA*1**task~`
            },
            {
                key: "NTE",
                type: TreeItemType.Segment,
                desc: `Note/Special Instruction`,
                codeSample: `NTE*TES*Return delivery with wrong color code.~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*193*20170510*101000*MT~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Status`,
                codeSample: `REF*ACC**new~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Nonconformance Code`,
                codeSample: `REF*BZ*QM-G3*General Task for Internal Notification*H6>task>6P>6>6P>Rework~`
            },
            {
                key: "HL^1_NCD_NCA^1_N1^1",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Party Identification - Task Processor`,
                codeSample: ``
            },
            {
                key: "HL^1_NCD_NCA^1_N1^2",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Party Identification - Task Owner`,
                codeSample: ``
            },
            {
                key: "HL^1_NCD_NCA^1_N1^3",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Party Identification - Completed By`,
                codeSample: ``
            },

        ]
    }

    /**
    * Nonconformance Action - Activity
    * @returns 
    */
    _getHL1_NCD_NCA2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "NCA",
                type: TreeItemType.Segment,
                desc: `Nonconformance Action - Activity`,
                codeSample: `NCA*1**activity~`
            },
            {
                key: "NTE",
                type: TreeItemType.Segment,
                desc: `Note/Special Instruction`,
                codeSample: `NTE*REG*Review substituted delivery.~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*193*20170512*131500*MT~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Status`,
                codeSample: `REF*ACC**complete~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Nonconformance Code`,
                codeSample: `REF*BZ*GN-00001*Actions for General Notification*H6>activity>6P>100>6P>Internal note~`
            },
            {
                key: "HL^1_NCD_NCA^2_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Party Identification - Activity Owner`,
                codeSample: ``
            },

        ]
    }

    /**
     * Hierarchical Level - Report
     * @returns 
     */
    _getHL1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "HL",
                type: TreeItemType.Segment,
                desc: `Hierarchical Level - Report`,
                codeSample: `HL*1**RP*1~`
            },
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Item Identification`,
                codeSample: `LIN**VP*Supplier Part ID*BP*Buyer Part ID*VS*Supplier Auxiliary ID~`
            },
            {
                key: "PID",
                type: TreeItemType.Segment,
                desc: `Product/Item Description`,
                codeSample: `PID*F****Item Description****en~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*405*20170110*143731*MT~`
            },

            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Item Category`,
                codeSample: `REF*8X**subcontract~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*BT*Supplier Batch ID~`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY*38*250.00*EA~`
            },
            {
                key: "HL^1_SPS",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Summary Statistics`,
                codeSample: ``
            },
            {
                key: "HL^1_NCD",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Nonconformance Description`,
                codeSample: ``
            },

        ]
    }
    /**
     * Hierarchical Level - Item
     * @returns 
     */
    _getHL2Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "HL",
                type: TreeItemType.Segment,
                desc: `Hierarchical Level - Item`,
                codeSample: `HL*2*1*I*1~`
            },
            {
                key: "HL^2_SPS",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Summary Statistics`,
                codeSample: ``
            },
            {
                key: "HL^2_NCD",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Nonconformance Description`,
                codeSample: ``
            },


        ]
    }

    /**
    * Hierarchical Level - Item
    * @returns 
    */
    _getHL2_NCD_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "NCD",
                type: TreeItemType.Segment,
                desc: `Nonconformance Description`,
                codeSample: `NCD*52**1~`
            },
            {
                key: "NTE",
                type: TreeItemType.Segment,
                desc: `Note/Special Instruction`,
                codeSample: `NTE*NCD*Color code of the beam should be Pantone 1234.~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*193*20170510*151000*MT~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Status`,
                codeSample: `REF*ACC**complete~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Nonconformance Code`,
                codeSample: `REF*BZ*QM-M*Defect Types in Mech. Parts Production*H6>defect>6P>22>6P>Color~`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity - Defect Count`,
                codeSample: `QTY*TO*100~`
            },
            {
                key: "HL^2_NCD_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Party Identification - Defect Owner`,
                codeSample: ``
            },
            {
                key: "HL^2_NCD_NCA^1",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Nonconformance Action - Task`,
                codeSample: ``
            },
            {
                key: "HL^2_NCD_NCA^2",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Nonconformance Action - Activity`,
                codeSample: ``
            },
            {
                key: "HL^2_NCD_NCA^3",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Nonconformance Action - Cause`,
                codeSample: ``
            },


        ]
    }

    /**
 * Nonconformance Action - Task
 * @returns 
 */
    _getHL2_NCD_NCA1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "NCA",
                type: TreeItemType.Segment,
                desc: `Nonconformance Action - Task`,
                codeSample: `NCA*1**task~`
            },
            {
                key: "NTE",
                type: TreeItemType.Segment,
                desc: `Note/Special Instruction`,
                codeSample: `NTE*TES*Return delivery with wrong color code.~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*193*20170510*101000*MT~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Status`,
                codeSample: `REF*ACC**new~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Nonconformance Code`,
                codeSample: `REF*BZ*QM-G3*General Task for Internal Notification*H6>task>6P>6>6P>Rework~`
            },
            {
                key: "HL^2_NCD_NCA^1_N1^1",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Party Identification - Task Processor`,
                codeSample: ``
            },
            {
                key: "HL^2_NCD_NCA^1_N1^2",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Party Identification - Task Owner`,
                codeSample: ``
            },
            {
                key: "HL^2_NCD_NCA^1_N1^3",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Party Identification - Completed By`,
                codeSample: ``
            },

        ]
    }
    /**
 * Nonconformance Action - Activity
 * @returns 
 */
    _getHL2_NCD_NCA2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "NCA",
                type: TreeItemType.Segment,
                desc: `Nonconformance Action - Activity`,
                codeSample: `NCA*1**activity~`
            },
            {
                key: "NTE",
                type: TreeItemType.Segment,
                desc: `Note/Special Instruction`,
                codeSample: `NTE*REG*Review substituted delivery.~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*193*20170514*151500*MT~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Status`,
                codeSample: `REF*ACC**complete~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Nonconformance Code`,
                codeSample: `REF*BZ*GN-00001*Actions for General Notification*H6>activity>6P>100>6P>Internal note~`
            },
            {
                key: "HL^2_NCD_NCA^2_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Party Identification - Activity Owner`,
                codeSample: ``
            },


        ]
    }
    /**
 * Nonconformance Action - Cause
 * @returns 
 */
    _getHL2_NCD_NCA3_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "NCA",
                type: TreeItemType.Segment,
                desc: `Nonconformance Action - Cause`,
                codeSample: `NCA*1**cause~`
            },
            {
                key: "NTE",
                type: TreeItemType.Segment,
                desc: `Note/Special Instruction`,
                codeSample: `NTE*DEP*Wrong lot of barcodes.~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Nonconformance Code`,
                codeSample: `REF*BZ*QM*Problem Causes; Defect Causes*H6>cause>6P>1>6P>Design~`
            },

            {
                key: "HL^2_NCD_NCA^3_N1",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Party Identification - Activity Owner`,
                codeSample: ``
            },


        ]
    }
    /**
     * Hierarchical Level - Component
     * @returns 
     */
    _getHL3Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "HL",
                type: TreeItemType.Segment,
                desc: `Hierarchical Level - Component`,
                codeSample: `HL*3*2*F*0~`
            },
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Item Identification`,
                codeSample: `LIN*1*VP*Supplier Part ID*BP*Buyer Part ID*VS*Supplier Auxiliary ID~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*405*20170102*143731*MT~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Plant Location`,
                codeSample: `REF*LU*1748*Buyer Location~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*BT*Supplier Batch ID~`
            },

        ]
    }


    _getN1Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "N1",
                type: TreeItemType.Segment,
                desc: `Party Identification`,
                codeSample: `N1*ST*ShipTo Name*1*ShipTo DUNS ID~`
            },
            {
                key: "N2",
                type: TreeItemType.Segment,
                desc: `Party Additional Name Information`,
                codeSample: `N2*Party AddrName 1*Party AddrName 1~`
            },
            {
                key: "N3",
                type: TreeItemType.Segment,
                desc: `Party Address Information`,
                codeSample: `N3*Party Street 1*Party Street 2~`
            },
            {
                key: "N4",
                type: TreeItemType.Segment,
                desc: `Party Geographic Location`,
                codeSample: `N4*Party City**ZIP*AU*SP*NSW~`
            },


        ]
    }
   
    _getHL1_NCD_N1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "N1",
                type: TreeItemType.Segment,
                desc: `Party Identification - Nonconformance Notes`,
                codeSample: `N1*QQ~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Report Creator`,
                codeSample: `REF*JD*User name*2017050210150000~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Nonconformance Comments`,
                codeSample: `REF*L1**Nonconformance description~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Attachment`,
                codeSample: `REF*E9**URL~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Nonconformance Code`,
                codeSample: `REF*BZ*QM*Problem Details*H6>subject>6P>3>6P>Quality activity~`
            },


        ]
    }
    _getRootChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ISA",
                type: TreeItemType.Segment,
                desc: `Interchange Control Header`,
                codeSample: `ISA*00*          *00*          *ZZ*SenderID       *ZZ*ReceiverID     *170630*1330*U*00401*000000001*0*T*>~`
            },
            {
                key: "GS",
                type: TreeItemType.Segment,
                desc: `Functional Group Header`,
                codeSample: `GS*NC*SenderID*ReceiverID*20170630*1330*1*X*004010~`
            },
            {
                key: "ST",
                type: TreeItemType.Segment,
                desc: `Transaction Set Header`,
                codeSample: `ST*842*0001~`
            },
            {
                key: "BNR",
                type: TreeItemType.Segment,
                desc: `Beginning Segment For Nonconformance Report`,
                codeSample: `BNR*00*QN1*20170629*152900~`
            },

            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Status`,
                codeSample: `REF*ACC**new~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `Reference Identification - Priority`,
                codeSample: `REF*PH*1*Low~`
            },
            {
                key: "REF",
                type: TreeItemType.Segment,
                desc: `References`,
                codeSample: `REF*PO*Purchase Order ID**LI>001~`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM*004*20170405*151500*MT~`
            },
            {
                key: "N1",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Party Identification`,
                codeSample: ``
            },
            {
                key: "HL^1",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Hierarchical Level - Report`,
                codeSample: ``
            },
            {
                key: "HL^2",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Hierarchical Level - Item`,
                codeSample: ``
            },
            {
                key: "HL^3",
                type: TreeItemType.Group,
                rootVersion: Assistant842In.versionKey,
                desc: `Hierarchical Level - Component`,
                codeSample: ``
            },
          
  
            {
                key: "SE",
                type: TreeItemType.Segment,
                desc: `Transaction Set Trailer`,
                codeSample: `SE*74*0001~`
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