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
export class AssistantDELFOROrder extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_DELFOR_Order;
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
                            codeSample: `RFF+ON:Purchase Order ID::Order Version'`
                        },
                        {
                            key: "DTM",
                            type: TreeItemType.Segment,
                            desc: `Date/Time`,
                            codeSample: `DTM+4:201601010800:203'`
                        },

                    ]
                case "SG2": // Group
                    return [
                        {
                            key: "NAD",
                            type: TreeItemType.Segment,
                            desc: `Name and address`,
                            codeSample: `NAD+BT+Bill to ID::92+Bill to Name 1:Bill to Name 2:Bill to Name 3:Bill to Name 4:Bill to Name 5+Bill to AddrName 1:Bill to AddrNam e 2:Bill to AddrName 3:Bill to AddrName 4:Bill to AddrName 5+Bill to Street 1:Bill to Street 2:Bill to Street 3:Bill to Street 4+Bill to City+IL+ZIP+FR'`
                        },
                        {
                            key: "SG2_SG3",
                            type: TreeItemType.Group,
                            rootVersion: AssistantDELFOROrder.versionKey,
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
                            codeSample: `CTA+IC+:Info Contact Name'`
                        },
                        {
                            key: "COM",
                            type: TreeItemType.Segment,
                            desc: `Communication contact`,
                            codeSample: `COM+Phone Number:TE'`
                        },

                    ]
                case "SG4": return this._getSG4Children();
                case "SG4_SG6": // Group
                    return [
                        {
                            key: "CTA",
                            type: TreeItemType.Segment,
                            desc: `Contact information`,
                            codeSample: `CTA+GR+:Contact Name'`
                        },
                        {
                            key: "COM",
                            type: TreeItemType.Segment,
                            desc: `Communication contact`,
                            codeSample: `COM+Phone Number:TE'`
                        },

                    ]
                case "SG4_SG7": // Group
                    return [
                        {
                            key: "TDT",
                            type: TreeItemType.Segment,
                            desc: `Details of transport`,
                            codeSample: `TDT+20++30:Description+:Truck+SCAC:::Carrier Name++ZZZ:ZZZ:Ship Contract ID'`
                        },


                    ]
                case "SG4_SG8": return this._getSG4_SG8_Children();
                case "SG4_SG8_SG10": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Material status`,
                        codeSample: `RFF+FI:composite::itemLevel'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+126:20151201:102'`
                    },


                ]
                case "SG4_SG8_SG12^1": return this._getSG4_SG8_SG12_1_Children();
                case "SG4_SG8_SG12^2": return this._getSG4_SG8_SG12_2_Children();
                case "SG4_SG8_SG12^3": return this._getSG4_SG8_SG12_3_Children();
                case "SG4_SG8_SG12^4": return this._getSG4_SG8_SG12_4_Children();
                case "SG4_SG8_SG12^5": return this._getSG4_SG8_SG12_5_Children();
                
                case "SG4_SG8_SG12^5_SG13": // Group
                    return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Reference`,
                            codeSample: `RFF+MA:Ship Notice ID'`
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
                codeSample: `NAD+ST+Ship-To ID::92+Ship-To Name 1:Ship-To Name 2:Ship-To Name 3:Ship-To Name 4:Ship-To Name 5+Ship-To AddrName 1:Ship-To AddrNam e 2:Ship-To AddrName 3:Ship-To AddrName 4:Ship-To AddrName 5+Ship-ToStreet 1:Ship-To Street 2:Ship-To Street 3:Ship-To Street 4+Ship-To City+IL+ZIP+FR'`
            },

            {
                key: "SG4_SG6",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFOROrder.versionKey,
                desc: `Contact information`,
                codeSample: ``
            },
            {
                key: "SG4_SG7",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFOROrder.versionKey,
                desc: `Details of transport`,
                codeSample: ``
            },
            {
                key: "SG4_SG8",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFOROrder.versionKey,
                desc: `Line item`,
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
                codeSample: `LIN+10++Supplier Part ID:VN+1:2'`
            },
            {
                key: "PIA",
                type: TreeItemType.Segment,
                desc: `Additional product id`,
                codeSample: `PIA+1+EAN ID:EN+Supplier Supplemental Part ID:VS+European Waste ID:ZZZ'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item description`,
                codeSample: `IMD+E++:::Short Item Description 1:Short Item Description 2:EN'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item characteristics, coded`,
                codeSample: `IMD+B+98+Small'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item characteristics, mutually defined`,
                codeSample: `IMD+B++Mutually defined:::123 domain:123 Value'`
            },
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurement`,
                codeSample: `MEA+AAE+AAA+KGM:100'`
            },
            {
                key: "GIR",
                type: TreeItemType.Segment,
                desc: `Serial numbers`,
                codeSample: `GIR+1+Serial ID 1:BN+Serial ID 2:BN+Serial ID 3:BN+Serial ID 4:BN+Serial ID 5:BN'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+2:201601061030:203'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text`,
                codeSample: `FTX+AAI+++TEXT 1:TEXT 2:TEXT 3:TEXT 4:TEXT 5+EN'`
            },
            {
                key: "SG4_SG8_SG10",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFOROrder.versionKey,
                desc: `Reference`,
                codeSample: ``
            },

            {
                key: "SG4_SG8_SG12^1",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFOROrder.versionKey,
                desc: `Scheduling information`,
                codeSample: ``
            },
            {
                key: "SG4_SG8_SG12^2",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFOROrder.versionKey,
                desc: `Cumulative scheduled quantity`,
                codeSample: ``
            },

            {
                key: "SG4_SG8_SG12^3",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFOROrder.versionKey,
                desc: `Ordered quantity`,
                codeSample: ``
            },
            {
                key: "SG4_SG8_SG12^4",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFOROrder.versionKey,
                desc: `Cumulative received quantity`,
                codeSample: ``
            },
            {
                key: "SG4_SG8_SG12^5",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFOROrder.versionKey,
                desc: `Ship Notice information - Received quantity`,
                codeSample: ``
            },
        ]
    }

    _getSG4_SG8_SG12_1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+1:100:C62'`
            },
            {
                key: "SCC",
                type: TreeItemType.Segment,
                desc: `Scheduling conditions`,
                codeSample: `SCC+1'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+2:201601061030:203'`
            },

        ]
    }
    /**
     * Cumulative scheduled quantity
     * @returns 
     * 
     */
    _getSG4_SG8_SG12_2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+3:200:C62'`
            },

        ]
    }
    /**
     * Ordered quantity
     * @returns 
     * 
     */
    _getSG4_SG8_SG12_3_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+21:100:C62'`
            },

        ]
    }
    /**
     * Cumulative received quantity
     * @returns 
     * 
     */
    _getSG4_SG8_SG12_4_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+70:150:C62'`
            },

        ]
    }
    /**
     * Ship Notice information - Received quantity
     * @returns 
     */
    _getSG4_SG8_SG12_5_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+48:50:C62'`
            },

            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+111:201601071030:203'`
            },
            {
                key: "SG4_SG8_SG12^5_SG13",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFOROrder.versionKey,
                desc: `Reference`,
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
                codeSample: `UNB+UNOC:3+SenderID:ZZZ+ReceiverID:ZZZ+160104:0930+1++++++1'`
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
                codeSample: `BGM+241:::Delivery Forecast+Delivery Schedule ID+25+AB'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+2:201601020930:203'`
            },

            {
                key: "SG1",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFOROrder.versionKey,
                desc: `Reference`,
                codeSample: ``
            },

            {
                key: "SG2",
                type: TreeItemType.Group,
                rootVersion: AssistantDELFOROrder.versionKey,
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
                rootVersion: AssistantDELFOROrder.versionKey,
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
                key: "CNT",
                type: TreeItemType.Segment,
                desc: `Control total`,
                codeSample: `CNT+2:1'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text`,
                codeSample: `FTX+AAI+++TEXT 1:TEXT 2:TEXT 3:TEXT 4:TEXT 5+EN'`
            },
            {
                key: "UNT",
                type: TreeItemType.Segment,
                desc: `Message trailer`,
                codeSample: `UNT+37+1'`
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