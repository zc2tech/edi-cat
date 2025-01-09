import { SegmentParserBase } from "../../new_parser/segmentParserBase";
import { EdifactParser } from "../../new_parser/edifactParser";
import { EdiElement, EdiSegment, EdiType } from "../../new_parser/entities";
import { X12Parser } from "../../new_parser/x12Parser";
import * as vscode from "vscode";
import * as constants from "../../cat_const";
import { TreeItemType, TreeItemElement, EdiGroup, ElementAttribute } from "../treeEntity";
import { AssistantBase } from "./assistantBase";

/**
 * APERAK Inbound/Outbound share the same format/samplecode
 * 
 * Don't add sample code for Group, it's always the responsibility of child segment.
 * 
 * 
 */
export class AssistantORDCHG extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_ORDCHG;
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
                            codeSample: `RFF+ON:Purchase Order ID'`
                        },
                        {
                            key: "DTM",
                            type: TreeItemType.Segment,
                            desc: `Date/Time`,
                            codeSample: `DTM+4:20160106:102'`
                        },
                    ]
                case "SG3":
                    return this._getSG3Children();
                case "SG3_SG4":
                    return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Reference`,
                            codeSample: `RFF+AP:Account ID'`
                        },

                    ];
                case "SG3_SG6":
                    return [
                        {
                            key: "CTA",
                            type: TreeItemType.Segment,
                            desc: `Contact information`,
                            codeSample: `CTA+IC+Info Contact:Info Contact Name'`
                        },
                        {
                            key: "COM",
                            type: TreeItemType.Segment,
                            desc: `Communication contact`,
                            codeSample: `COM+Phone Number:TE'`
                        },

                    ];
                case "SG7": return [
                    {
                        key: "TAX",
                        type: TreeItemType.Segment,
                        desc: `Duty/tax/fee details`,
                        codeSample: `TAX+7+VAT:::Tax location++1000.00+:::12.00+E+PartyTaxID'`
                    },
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+124:100.00:EUR'`
                    },

                ]
                case "SG8": return [
                    {
                        key: "CUX",
                        type: TreeItemType.Segment,
                        desc: `Currencies`,
                        codeSample: `CUX+2:EUR:9+3:USD:7'`
                    },
                ]
                case "SG9": return this._getSG9Children();
                case "SG10": return [
                    {
                        key: "TDT",
                        type: TreeItemType.Segment,
                        desc: `Details of transport`,
                        codeSample: `TDT+20++30:Description+:Truck+SCAC:::Carrier Name++ZZZ:ZZZ:Ship Contract ID'`
                    },
                ]
                case "SG12": return [
                    {
                        key: "TOD",
                        type: TreeItemType.Segment,
                        desc: `Terms of delivery or transport`,
                        codeSample: `TOD+6+CC+FOB:::Description 1:Description 2'`
                    },
                ]

                case "SG16": return [
                    {
                        key: "SCC",
                        type: TreeItemType.Segment,
                        desc: `Scheduling conditions`,
                        codeSample: `SCC+1+SC'`
                    },
                ]
                case "SG19^1": return this._getSG19_1_Children();
                case "SG19^1_SG22": return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+23:10.00:EUR:9'`
                    },

                ]

                case "SG19^2": return this._getSG19_2_Children();
                case "SG19^2_SG21": return [
                    {
                        key: "PCD",
                        type: TreeItemType.Segment,
                        desc: `Percentage details`,
                        codeSample: `PCD+3:5.00:13'`
                    },

                ]
                case "SG19^2_SG22": return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+8:100.00:EUR:9'`
                    },
                ]
                case "SG26^1": return this._getSG26_1_Children();
                case "SG26^1_SG27":return [
                    {
                        key: "CCI",
                        type: TreeItemType.Segment,
                        desc: `Characteristic`,
                        codeSample: `CCI+++Class ID:::Class'`
                    },
                    
                ]
                case "SG26^1_SG30":return this._getSG26_1_SG30_Children();
                case "SG26^1_SG31":return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference`,
                        codeSample: `RFF+FI:composite::itemLevel'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+126:20160101:102'`
                    },
                ]
                case "SG26^1_SG32^1":return this._getSG26_1_SG32_1_Children();
                case "SG26^1_SG32^1_SG33": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `References`,
                        codeSample: `RFF+AAS:Package Tracking ID'`
                    },
                ]
                case "SG26^1_SG32^1_SG34": return [
                    {
                        key: "PCI",
                        type: TreeItemType.Segment,
                        desc: `Package identification`,
                        codeSample: `PCI+30+Shipping Mark'`
                    },
                    {
                        key: "GIN",
                        type: TreeItemType.Segment,
                        desc: `Goods identify number`,
                        codeSample: `GIN+AW+SSCC ID'`
                    },
                ]

                case "SG26^1_SG32^2":return this._getSG26_1_SG32_2_Children();
                case "SG26^1_SG32^2_SG33": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `References`,
                        codeSample: `RFF+BT:US::P1Y10M1DT100H10M2S'`
                    },
                ]
                case "SG26^1_SG32^2_SG34": return [
                    {
                        key: "PCI",
                        type: TreeItemType.Segment,
                        desc: `Batch identification`,
                        codeSample: `PCI+10'`
                    },
                    {
                        key: "GIN",
                        type: TreeItemType.Segment,
                        desc: `Batch identification numbers`,
                        codeSample: `GIN+BX+Buyer Batch ID1:92+Supplier Batch ID1:91'`
                    },
                ]
                case "SG26^1_SG36": return [
                    {
                        key: "TAX",
                        type: TreeItemType.Segment,
                        desc: `Duty/tax/fee details`,
                        codeSample: `TAX+7+VAT:::Tax location++1000.00+:::12.00+E+PartyTaxID'`
                    },
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+124:100.00:EUR'`
                    },
                ]
                case "SG26^1_SG37": return this._getSG26_1_SG37_Children();
                case "SG26^1_SG37_SG38": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference`,
                        codeSample: `RFF+CN:Shipment Ref ID'`
                    },
                ]
                case "SG26^1_SG37_SG40": return [
                    {
                        key: "CTA",
                        type: TreeItemType.Segment,
                        desc: `Contact information`,
                        codeSample: `CTA+IC+Info Contact:Info Contact Name'`
                    },
                    {
                        key: "COM",
                        type: TreeItemType.Segment,
                        desc: `Communication contact`,
                        codeSample: `COM+Phone Number:TE'`
                    },
                ]
                case "SG26^1_SG41^1": return this._getSG26_1_SG41_1_Children();
                case "SG26^1_SG41^1_SG44": return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+23:10.00:EUR:9'`
                    },
                ]
                case "SG26^1_SG41^2": return this._getSG26_1_SG41_2_Children();
                case "SG26^1_SG41^2_SG43": return [
                    {
                        key: "PCD",
                        type: TreeItemType.Segment,
                        desc: `Percentage details`,
                        codeSample: `PCD+3:5.00'`
                    },
                ]
                case "SG26^1_SG41^2_SG44": return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+8:100.00:EUR:9'`
                    },
                ]
                case "SG26^1_SG47": return [
                    {
                        key: "TDT",
                        type: TreeItemType.Segment,
                        desc: `Details of transport`,
                        codeSample: `TDT+20++30:Description+:Truck+SCAC:::Carrier Name++ZZZ:ZZZ:Ship Contract ID'`
                    },
                ]
                case "SG26^1_SG49": return [
                    {
                        key: "TOD",
                        type: TreeItemType.Segment,
                        desc: `Terms of delivery or transport`,
                        codeSample: `TOD+6+CC+FOB:::Description 1:Description 2'`
                    },
                ]
                case "SG26^1_SG51": return this._getSG26_1_SG51_Children();
                case "SG26^1_SG51_SG52": return [
                    {
                        key: "QTY",
                        type: TreeItemType.Segment,
                        desc: `Quantity`,
                        codeSample: `QTY+21:100:C62'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+2:20160402-20160403:718'`
                    },
                ]
                case "SG26^2": return this._getSG26_2_Children();
                case "SG26^2_SG31^1": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Scheduling line number`,
                        codeSample: `RFF+AAN::1'`
                    },
                ]
                case "SG26^2_SG31^2": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Material provision indicator`,
                        codeSample: `RFF+ACJ:reworkTo'`
                    },
                ]
                case "SG26^2_SG32": return this._getSG26_2_SG32_Children();
                case "SG26^2_SG32_SG33": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `References`,
                        codeSample: `RFF+BT:US::P1Y10M1DT100H10M2S'`
                    },
                ]
                case "SG26^2_SG32_SG34": return [
                    {
                        key: "PCI",
                        type: TreeItemType.Segment,
                        desc: `Batch identification`,
                        codeSample: `PCI+10'`
                    },
                    {
                        key: "GIN",
                        type: TreeItemType.Segment,
                        desc: `Batch identification numbers`,
                        codeSample: `GIN+BX+Buyer Batch ID1:92+Supplier Batch ID1:91'`
                    },
                ]

            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }

    _getSG3Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "NAD",
                type: TreeItemType.Segment,
                desc: `Name and address`,
                codeSample: `NAD+BT+Bill to ID::92+Bill to Name 1:Bill to Name 2:Bill to Name 3:Bill to Name 4:Bill to Name 5+Bill to AddrName 1:Bill to AddrName 2:Bill to AddrName 3:Bill to AddrName 4:Bill to AddrName 5+Bill to Street 1:Bill to Street 2:Bill to Street 3:Bill to Street 4+Bill to City+IL+ZIP+FR'`
            },
            {
                key: "LOC",
                type: TreeItemType.Segment,
                desc: `Place/Location information`,
                codeSample: `LOC+19+Plant ID'`
            },
            {
                key: "SG3_SG4",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG3_SG6",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Contact information`,
                codeSample: ``
            },
        ]
    }
    /**
     * Payment terms
     * @returns 
     */
    _getSG9Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "PAT",
                type: TreeItemType.Segment,
                desc: `Payment terms`,
                codeSample: `PAT+22++5:3:D:10'`
            },
            {
                key: "PCD",
                type: TreeItemType.Segment,
                desc: `Percentage details`,
                codeSample: `PCD+12:5.00:13'`
            },
            {
                key: "MOA",
                type: TreeItemType.Segment,
                desc: `Monetary amount`,
                codeSample: `MOA+52:10.00:EUR:9'`
            },

        ]
    }

    // Allowance or charge, Shipping costs
    _getSG19_1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ALC",
                type: TreeItemType.Segment,
                desc: `Shipping costs`,
                codeSample: `ALC+C+Tracking Domain+++SAA:::Description:Tracking ID'`
            },
            {
                key: "SG19^1_SG22",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },
        ]
    }
    // Allowance or charge
    _getSG19_2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ALC",
                type: TreeItemType.Segment,
                desc: `Allowance or charge`,
                codeSample: `ALC+C++++FC:::Description 1:Description 2'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+194:20160101:102'`
            },
            {
                key: "SG19^2_SG21",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Percentage details`,
                codeSample: ``
            },
            {
                key: "SG19^2_SG22",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },
        ]
    }
    _getSG26_1_Children(): TreeItemElement[] | null | undefined {
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
                codeSample: `IMD+F++:::Item Description 1:Item Description 2:EN'`
            },
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurement`,
                codeSample: `MEA+AAE+AAA+KGM:100'`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+21:100:C62'`
            },
            {
                key: "ALI",
                type: TreeItemType.Segment,
                desc: `Additional information`,
                codeSample: `ALI+++94'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+2:201601021010:203'`
            },
            {
                key: "MOA",
                type: TreeItemType.Segment,
                desc: `Monetary amount`,
                codeSample: `MOA+179:100.00:EUR:9'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text`,
                codeSample: `FTX+AAI+++TEXT 1:TEXT 2:TEXT 3:TEXT 4:TEXT 5+EN'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Special instructions`,
                codeSample: `FTX+SIN+++OCValue:allowed'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Quality information`,
                codeSample: `FTX+ACL+++yes:CERT123:Certificate Type description:001:Control Code description'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Return information`,
                codeSample: `FTX+ORI+++Return Item'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Delivery information`,
                codeSample: `FTX+ORI+++Delivery is completed'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Item category`,
                codeSample: `FTX+PRD+++itemCategory:subcontract'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Subcontracting type`,
                codeSample: `FTX+PRD+++subcontractingType:regular'`
            },


            {
                key: "SG26^1_SG27",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Characteristic`,
                codeSample: ``
            },

            {
                key: "SG26^1_SG30",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Price details`,
                codeSample: ``
            },

            {
                key: "SG26^1_SG31",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG26^1_SG32^1",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Packaging information`,
                codeSample: ``
            },
            {
                key: "SG26^1_SG32^2",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Batch information`,
                codeSample: ``
            },

            {
                key: "SG26^1_SG36",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Duty/tax/fee details`,
                codeSample: ``
            },
            {
                key: "SG26^1_SG37",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },
            {
                key: "SG26^1_SG41^1",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Allowance or charge`,
                codeSample: ``
            },
            {
                key: "SG26^1_SG41^2",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Allowance or charge`,
                codeSample: ``
            },
            {
                key: "SG26^1_SG47",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Details of transport`,
                codeSample: ``
            },
            {
                key: "SG26^1_SG49",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Terms of delivery or transport`,
                codeSample: ``
            },
            {
                key: "SG26^1_SG51",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Scheduling conditions`,
                codeSample: ``
            },

        ]
    }

    _getSG26_1_SG30_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "PRI",
                type: TreeItemType.Segment,
                desc: `Price details`,
                codeSample: `PRI+CAL:::PBQ'`
            },
            {
                key: "APR",
                type: TreeItemType.Segment,
                desc: `Additional price information`,
                codeSample: `APR+WS+0.1:CSD'`
            },
            {
                key: "RNG",
                type: TreeItemType.Segment,
                desc: `Range details`,
                codeSample: `RNG+4+BX:2:2'`
            },
           
        ]
    }

    _getSG26_1_SG37_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "NAD",
                type: TreeItemType.Segment,
                desc: `Name and address`,
                codeSample: `NAD+ST+Ship to ID::92+Ship to Name 1:Ship to Name 2:Ship to Name 3:Ship to Name 4:Ship to Name 5+Ship toAddrName 1:Ship to AddrName 2:Ship to AddrName 3:Ship to AddrName 4:Ship to AddrName 5+Ship to Street 1:Ship to Street 2:Ship to Street 3:Ship to Street 4+Ship to City+IL+ZIP+FR'`
            },
            {
                key: "SG26^1_SG37_SG38",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG26^1_SG37_SG40",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Contact information`,
                codeSample: ``
            },
        ]
    }
    _getSG26_1_SG41_1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ALC",
                type: TreeItemType.Segment,
                desc: `Shipping costs`,
                codeSample: `ALC+C+Tracking Domain+++SAA:::Description:Tracking ID'`
            },

            {
                key: "SG26^1_SG41^1_SG44",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },
        ]
    }
    _getSG26_1_SG41_2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ALC",
                type: TreeItemType.Segment,
                desc: `Allowance or charge`,
                codeSample: `ALC+A++++ACA:::Description 1:Description 2'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+194:20160101:102'`
            },

            {
                key: "SG26^1_SG41^2_SG43",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Percentage details`,
                codeSample: ``
            },
            {
                key: "SG26^1_SG41^2_SG44",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },
        ]
    }

    _getSG26_1_SG51_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "SCC",
                type: TreeItemType.Segment,
                desc: `Scheduling conditions`,
                codeSample: `SCC+1'`
            },
            {
                key: "RFF",
                type: TreeItemType.Segment,
                desc: `Scheduling line number`,
                codeSample: `RFF+AAN::1'`
            },
            {
                key: "SG26^1_SG51_SG52",
                type: TreeItemType.Group,
                rootVersion:AssistantORDCHG.versionKey,
                desc: `Quantity`,
                codeSample: ``
            },
        ]
    }

    _getSG26_1_SG32_1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "PAC",
                type: TreeItemType.Segment,
                desc: `Packaging information`,
                codeSample: `PAC+1+3+CT:::SSCC Reference+A:Package Description 1:ZZZ:Package Description 2:ZZZ'`
            },
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurement`,
                codeSample: `MEA+AAE+AAA+KGM:100'`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+21:100:C62'`
            },
            {
                key: "SG26^1_SG32^1_SG33",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `References`,
                codeSample: ``
            },
            {
                key: "SG26^1_SG32^1_SG34",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Package identification`,
                codeSample: ``
            },
        ]
    }
    _getSG26_1_SG32_2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "PAC",
                type: TreeItemType.Segment,
                desc: `Batch information`,
                codeSample: `PAC+0+++A:batchInformation'`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+21:100:C62'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+36:201701041010:203'`
            },
            {
                key: "SG26^1_SG32^2_SG33",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `References`,
                codeSample: ``
            },
            {
                key: "SG26^1_SG32^2_SG34",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Batch identification`,
                codeSample: ``
            },
        ]
    }

    _getSG26_2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Scheduling - Subcontracting component`,
                codeSample: `LIN+++Component Part ID:AB+1:10++A'`
            },
            {
                key: "PIA",
                type: TreeItemType.Segment,
                desc: `Additional product id`,
                codeSample: `PIA+5+Buyer Component Part ID:BP+Supplier Component Part ID:VN'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item description`,
                codeSample: `IMD+F++:::Component Description 1:Component Description 2:EN'`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+21:100:C62'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+318:201601021010:203'`
            },
            {
                key: "SG26^2_SG31^1",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Scheduling line number`,
                codeSample: ``
            },
            {
                key: "SG26^2_SG31^2",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Material provision indicator`,
                codeSample: ``
            },
            {
                key: "SG26^2_SG32",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Batch information`,
                codeSample: ``
            },
        ]
    }

    _getSG26_2_SG32_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "PAC",
                type: TreeItemType.Segment,
                desc: `Batch information`,
                codeSample: `PAC+0+++A:batchInformation'`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+21:100:C62'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+36:201701041010:203'`
            },
            {
                key: "SG26^2_SG32_SG33",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `References`,
                codeSample: ``
            },
            {
                key: "SG26^2_SG32_SG34",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Batch identification`,
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
                codeSample: `UNH+1+ORDCHG:D:96A:UN'`
            },

            {
                key: "BGM",
                type: TreeItemType.Segment,
                desc: `Beginning of message`,
                codeSample: `BGM+230:::Purchase Order Change+Purchase Order ID+5+AB'`
            },

            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+4:201601040930:203'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text`,
                codeSample: `FTX+AAI+++TEXT 1:TEXT 2:TEXT 3:TEXT 4:TEXT 5+EN'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Priority information`,
                codeSample: `FTX+PRI+++1:Priority Description:Purchase Order ID 1'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `External document information`,
                codeSample: `FTX+DOC++EXT+PO:Description'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Special instructions`,
                codeSample: `FTX+SIN+++OCValue:allowed'`
            },
            {
                key: "SG1",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Reference`,
                codeSample: ``
            },


            {
                key: "SG3",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },

            {
                key: "SG7",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Duty/tax/fee details`,
                codeSample: ``
            },
            {
                key: "SG8",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Currencies`,
                codeSample: ``
            },

            {
                key: "SG9",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Payment terms`,
                codeSample: ``
            },
            {
                key: "SG10",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Details of transport`,
                codeSample: ``
            },
            {
                key: "SG12",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Terms of delivery or transport`,
                codeSample: ``
            },
            {
                key: "SG16",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Scheduling conditions`,
                codeSample: ``
            },

            {
                key: "SG19^1",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Allowance or charge`,
                codeSample: ``
            },
            {
                key: "SG19^2",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Allowance or charge`,
                codeSample: ``
            },

            {
                key: "SG26^1",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Line item`,
                codeSample: ``
            },
            {
                key: "SG26^2",
                type: TreeItemType.Group,
                rootVersion: AssistantORDCHG.versionKey,
                desc: `Scheduling - Subcontracting component`,
                codeSample: ``
            },
            {
                key: "UNS",
                type: TreeItemType.Segment,
                desc: `Section control`,
                codeSample: `UNS+S'`
            },
            {
                key: "MOA",
                type: TreeItemType.Segment,
                desc: `Monetary amount`,
                codeSample: `MOA+128:1000.00:EUR:9'`
            },
            {
                key: "CNT",
                type: TreeItemType.Segment,
                desc: `Control total`,
                codeSample: `CNT+2:1'`
            },
            {
                key: "UNT",
                type: TreeItemType.Segment,
                desc: `Message trailer`,
                codeSample: `UNT+97+1'`
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