import { SegmentParserBase } from "../../new_parser/segmentParserBase";
import { EdifactParser } from "../../new_parser/edifactParser";
import { EdiElement, EdiSegment, EdiType } from "../../new_parser/entities";
import { X12Parser } from "../../new_parser/x12Parser";
import * as vscode from "vscode";
import * as constants from "../../cat_const";
import { TreeItemType, TreeItemElement, EdiGroup, ElementAttribute } from "../treeEntity";
import { AssistantBase } from "./assistantBase";

/**
 * 
 * 
 * Don't add sample code for Group, it's always the responsibility of child segment.
 * 
 * 
 */
export class AssistantDELFORProductActivity extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_DELFOR_ProductActivity;
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "SG1": // Group
                    return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Reference`,
                            codeSample: `RFF+MS:Ariba Network System ID'`
                        },

                    ]
                case "SG2": // Group
                    return [
                        {
                            key: "NAD",
                            type: TreeItemType.Segment,
                            desc: `Name and address`,
                            codeSample: `NAD+SU+Supplier ID::16+Party AddrName 1:Party AddrName 2:Party AddrName 3:Party AddrName 4:Party AddrName 5+Party Name 1:Party Name 2:Party Name 3:Party Name 4:Party Name 5+Party Street 1:Party Street 2:PartyStreet 3:Party Street 4+Party City+IL+ZIP+US'`
                        },
                        {
                            key: "SG2_SG3",
                            type: TreeItemType.Group,
                            rootVersion: AssistantDELFORProductActivity.versionKey,
                            desc: `Contact information`,
                            codeSample: ``
                        },
                    ]
                case "SG2_SG3": // Group
                    return [
                        {
                            key: "CTA",
                            type: TreeItemType.Segment,
                            desc: `Contact information`,
                            codeSample: `CTA+IC+ID:Ship-To Contact Name'`
                        },
                        {
                            key: "COM",
                            type: TreeItemType.Segment,
                            desc: `Communication contact`,
                            codeSample: `COM+0123456789:TE'`
                        },
                       
                    ]
                    case "SG4": 
                    return this._getSG4Children();
                    case "SG4_SG6": // Group
                    return [
                        {
                            key: "CTA",
                            type: TreeItemType.Segment,
                            desc: `Contact information`,
                            codeSample: `CTA+IC+ID:Ship-To Contact Name'`
                        },
                        {
                            key: "COM",
                            type: TreeItemType.Segment,
                            desc: `Communication contact`,
                            codeSample: `COM+0123456789:TE'`
                        },
                       
                    ]
                    case "SG4_SG8": return this._getSG4_SG8_Children();
                    case "SG4_SG8_SG10": return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Material status`,
                            codeSample: `RFF+AGW:active'`
                        },
                       
                       
                    ]
                    case "SG4_SG8_SG12^1": return this._getSG4_SG8_SG12_1_Children();
                    case "SG4_SG8_SG12^1_SG13": // Group
                    return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Time series type`,
                            codeSample: `RFF+AEH:orderForecast'`
                        },

                    ]
                    case "SG4_SG8_SG12^2": return this._getSG4_SG8_SG12_2_Children();
                    case "SG4_SG8_SG12^2_SG13": // Group
                    return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Time series type`,
                            codeSample: `RFF+AEH:grossdemand'`
                        },

                    ]
                    case "SG4_SG8_SG12^3": return this._getSG4_SG8_SG12_3_Children();
                    case "SG4_SG8_SG12^3_SG13": // Group
                    return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Time series type`,
                            codeSample: `RFF+AEH:projectedStock'`
                        },

                    ]

            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }

    _getSG4Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "NAD",
                type: TreeItemType.Segment,
                desc: `Name and address`,
                codeSample: `NAD+ST+Ship-To ID::16+Ship-To AddrName 1:Ship-To AddrName 2:Ship-To AddrName 3:Ship-To AddrName 4:Ship-To AddrName 5+Ship-To Name 1:Ship-To Name 2:Ship-To Name 3:Ship-To Name 4:Ship-To Name 5+Ship-ToStreet 1:Ship-To Street 2:Ship-To Street 3:Ship-To Street 4+Ship-To City+IL+ZIP+US'`
            },
            {
                key: "LOC",
                type: TreeItemType.Segment,
                desc: `Place/location identification`,
                codeSample: `LOC+7+Location-To ID'`
            },
            {
                key: "SG4_SG6",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFORProductActivity.versionKey,
                desc: ``,
                codeSample: ``
            },
            {
                key: "SG4_SG8",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFORProductActivity.versionKey,
                desc: ``,
                codeSample: ``
            },
        ]
    }

    _getSG4_SG8_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Line item`,
                codeSample: `LIN+++Supplier Part ID:VN'`
            },
            {
                key: "PIA",
                type: TreeItemType.Segment,
                desc: `Additional product id`,
                codeSample: `PIA+1+EAN ID:EN+UPC ID:UP+EU Waste ID:ZZZ+UNSPSC ID:CC'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item description`,
                codeSample: `IMD+F++:::Material Description 1:Material Description 2:EN'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item characteristics, coded`,
                codeSample: `IMD+B+98+:::Small'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item classification`,
                codeSample: `IMD+B++ACA:::domain123:Classification ID'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+143:0:804'`
            },
            {
                key: "SG4_SG8_SG10",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFORProductActivity.versionKey,
                desc: `Material status`,
                codeSample: ``
            },
            {
                key: "SG4_SG8_SG12^1",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFORProductActivity.versionKey,
                desc: `Forecast quantity`,
                codeSample: ``
            },
            {
                key: "SG4_SG8_SG12^2",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFORProductActivity.versionKey,
                desc: `Planning quantity`,
                codeSample: ``
            },
            {
                key: "SG4_SG8_SG12^3",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFORProductActivity.versionKey,
                desc: `Inventory quantity`,
                codeSample: ``
            },
        ]
    }

    _getSG4_SG8_SG12_1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Forecast quantity`,
                codeSample: `QTY+1:100:C62'`
            },
            {
                key: "SCC",
                type: TreeItemType.Segment,
                desc: `Scheduling conditions`,
                codeSample: `SCC+4'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+64:20200101000000M08:304'`
            },
            {
                key: "SG4_SG8_SG12^1_SG13",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFORProductActivity.versionKey,
                desc: `Time series type`,
                codeSample: ``
            },
        ]
    }
    _getSG4_SG8_SG12_2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Planning quantity`,
                codeSample: `QTY+1:200:C62'`
            },
            {
                key: "SCC",
                type: TreeItemType.Segment,
                desc: `Scheduling conditions`,
                codeSample: `SCC+12'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+64:20200202000000M08:304'`
            },
            {
                key: "SG4_SG8_SG12^2_SG13",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFORProductActivity.versionKey,
                desc: `Time series type`,
                codeSample: ``
            },
        ]
    }
    _getSG4_SG8_SG12_3_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Inventory quantity`,
                codeSample: `QTY+1:300:C62'`
            },
            {
                key: "SCC",
                type: TreeItemType.Segment,
                desc: `Scheduling conditions`,
                codeSample: `SCC+17'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+64:20200303000000M08:304'`
            },
            {
                key: "SG4_SG8_SG12^3_SG13",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFORProductActivity.versionKey,
                desc: `Time series type`,
                codeSample: ``
            },
        ]
    }

    _getRootChildren(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "UNA",
                type: TreeItemType.Segment,
                desc: `Service string advice`,
                codeSample: `UNA:+.? '`
            },
            {
                key: "UNB",
                type: TreeItemType.Segment,
                desc: `Interchange header`,
                codeSample: `UNB+UNOC:3+SenderID:ZZZ+ReceiverID:ZZZ+200104:0930+1++++++1'`
            },

            {
                key: "UNH",
                type: TreeItemType.Segment,
                desc: `Message header`,
                codeSample: `UNH+1+DELFOR:D:96A:UN'`
            },

            {
                key: "BGM",
                type: TreeItemType.Segment,
                desc: `Beginning of message`,
                codeSample: `BGM+241+Document ID+9'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+137:20200104012345M08:304'`
            },

            {
                key: "SG1",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFORProductActivity.versionKey,
                desc: `Reference`,
                codeSample: ``
            },

            {
                key: "SG2",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFORProductActivity.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },         
            {
                key: "UNS",
                type: TreeItemType.Segment,
                desc: `Section control`,
                codeSample: `UNS+D'`
            },
            {
                key: "SG4",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFORProductActivity.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },


            {
                key: "UNS",
                type: TreeItemType.Segment,
                desc: `Section control`,
                codeSample: `UNS+S'`
            },

            {
                key: "UNT",
                type: TreeItemType.Segment,
                desc: `Message trailer`,
                codeSample: `UNT+33+1'`
            },
            {
                key: "UNZ",
                type: TreeItemType.Segment,
                desc: `Interchange trailer`,
                codeSample: `UNZ+1+1'`
            },


        ]
    }
}