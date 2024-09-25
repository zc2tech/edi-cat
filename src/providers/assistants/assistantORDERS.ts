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
export class AssistantORDERS extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_ORDERS;
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
                            codeSample: `DTM+4:20160110:102'`
                        },
                    ]
                case "SG2":
                    return this._getSG2Children();
                case "SG2_SG3":
                    return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Reference`,
                            codeSample: `RFF+AP:Account ID'`
                        },

                    ];
                case "SG2_SG5":
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

                    ]
                case "SG6":
                    return [
                        {
                            key: "TAX",
                            type: TreeItemType.Segment,
                            desc: `Duty/tax/fee details`,
                            codeSample: `TAX+7+VAT:::Tax location++100.00+:::12.00+E+PartyTaxID'`
                        },
                        {
                            key: "MOA",
                            type: TreeItemType.Segment,
                            desc: `Monetary amount`,
                            codeSample: `MOA+124:100.00:EUR'`
                        },
                    ]
                case "SG7":
                    return [
                        {
                            key: "CUX",
                            type: TreeItemType.Segment,
                            desc: `Currencies`,
                            codeSample: `CUX+2:EUR:9+3:USD:7'`
                        },

                    ]
                case "SG8": return this._getSG8Children();
                case "SG9": return [
                    {
                        key: "TDT",
                        type: TreeItemType.Segment,
                        desc: `Details of transport`,
                        codeSample: `TDT+20++30:Description+:Truck+SCAC:::Carrier Name++ZZZ:ZZZ:Ship Contract ID'`
                    },
                ]
                case "SG11": return [
                    {
                        key: "TOD",
                        type: TreeItemType.Segment,
                        desc: `Terms of delivery or transport`,
                        codeSample: `TOD+6+CC+FOB:::Description 1:Description 2'`
                    },
                ]
                case "SG15": return [
                    {
                        key: "SCC",
                        type: TreeItemType.Segment,
                        desc: `Scheduling conditions`,
                        codeSample: `SCC+1+SC'`
                    },
                ]
                case "SG18^1": return this._getSG18_1_Children();
                case "SG18^1_SG21": return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+23:10.00:EUR:9'`
                    },
                ]
                case "SG18^2": return this._getSG18_2_Children();
                case "SG18^2_SG20": return [
                    {
                        key: "PCD",
                        type: TreeItemType.Segment,
                        desc: `Percentage details`,
                        codeSample: `PCD+3:5.00:13'`
                    },
                ]
                case "SG18^2_SG21": return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+8:100.00:EUR:9'`
                    },
                ]
                case "SG25^1":
                    return this._getSG25_1_Children();
                    case "SG25^1_SG26": return [
                        {
                            key: "CCI",
                            type: TreeItemType.Segment,
                            desc: `Characteristic`,
                            codeSample: `CCI+++Class ID:::Class'`
                        },
                    ]
                    case "SG25^1_SG28": return [
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
                    case "SG25^1_SG29": return [
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
                    case "SG25^1_SG30^1": return this._getSG25_1_SG30_1_Children();
                    case "SG25^1_SG30^1_SG31": return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `References`,
                            codeSample: `RFF+AAS:Package Tracking ID'`
                        },
                       
                    ]
                    case "SG25^1_SG30^1_SG32": return [
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
                    case "SG25^1_SG30^2": return this._getSG25_1_SG30_2_Children();
                    case "SG25^1_SG30^2_SG31": return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `References`,
                            codeSample: `RFF+BT:US::P1Y10M1DT100H10M2S'`
                        },
                       
                    ]
                    case "SG25^1_SG30^2_SG32": return [
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
                    case "SG25^1_SG34": return [
                        {
                            key: "TAX",
                            type: TreeItemType.Segment,
                            desc: `Duty/tax/fee details`,
                            codeSample: `TAX+7+VAT:::Tax location++100.00+:::12.00+S+PartyTaxID'`
                        },
                        {
                            key: "MOA",
                            type: TreeItemType.Segment,
                            desc: `Monetary amount`,
                            codeSample: `MOA+124:100.00:EUR'`
                        },
                       
                    ]
                    case "SG25^1_SG35": return [
                        {
                            key: "NAD",
                            type: TreeItemType.Segment,
                            desc: `Name and address`,
                            codeSample: `NAD+ST+Ship to ID::92+Ship to Name 1:Ship to Name 2:Ship to Name 3:Ship to Name 4:Ship to Name 5+Ship toAddrName 1:Ship to AddrName 2:Ship to AddrName 3:Ship to AddrName 4:Ship to AddrName 5+Ship to Street 1:Ship to Street 2:Ship to Street 3:Ship to Street 4+Ship to City+IL+ZIP+FR'`
                        },
                        {
                            key: "SG25^1_SG35_SG36",
                            type: TreeItemType.Group,
                            rootVersion: AssistantORDERS.versionKey,
                            desc: `Reference`,
                            codeSample: ``
                        },
                        {
                            key: "SG25^1_SG35_SG38",
                            type: TreeItemType.Group,
                            rootVersion: AssistantORDERS.versionKey,
                            desc: `Contact information`,
                            codeSample: ``
                        },              
                    ]
                    case "SG25^1_SG35_SG36": return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Reference`,
                            codeSample: `RFF+CN:Shipment Ref ID'`
                        },
                                    
                    ]
                    case "SG25^1_SG35_SG38": return [
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
                    case "SG25^1_SG39^1": return [
                        {
                            key: "ALC",
                            type: TreeItemType.Segment,
                            desc: `Shipping costs`,
                            codeSample: `ALC+C+Tracking Domain+++SAA:::Description:Tracking ID'`
                        },
                        {
                            key: "SG25^1_SG39^1_SG42",
                            type: TreeItemType.Group,
                            rootVersion: AssistantORDERS.versionKey,
                            desc: `Monetary amount`,
                            codeSample: ``
                        },      
                    ]
                    case "SG25^1_SG39^1_SG42": return [
                        {
                            key: "MOA",
                            type: TreeItemType.Segment,
                            desc: `Monetary amount`,
                            codeSample: `MOA+23:10.00:EUR:9'`
                        },                     
                    ]
                    case "SG25^1_SG39^2": return [
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
                            key: "SG25^1_SG39^2_SG41",
                            type: TreeItemType.Group,
                            rootVersion: AssistantORDERS.versionKey,
                            desc: `Percentage details`,
                            codeSample: ``
                        },      
                        {
                            key: "SG25^1_SG39^2_SG42",
                            type: TreeItemType.Group,
                            rootVersion: AssistantORDERS.versionKey,
                            desc: `Monetary amount`,
                            codeSample: ``
                        },      
                    ]
                    case "SG25^1_SG39^2_SG41": return [
                        {
                            key: "PCD",
                            type: TreeItemType.Segment,
                            desc: `Percentage details`,
                            codeSample: `PCD+3:5.00'`
                        },                     
                    ]
                    case "SG25^1_SG39^2_SG42": return [
                        {
                            key: "MOA",
                            type: TreeItemType.Segment,
                            desc: `Monetary amount`,
                            codeSample: `MOA+8:100.00:EUR:9'`
                        },                     
                    ]
                    case "SG25^1_SG45": return [
                        {
                            key: "TDT",
                            type: TreeItemType.Segment,
                            desc: `Details of transport`,
                            codeSample: `TDT+20++30:Description+:Truck+SCAC:::Carrier Name++ZZZ:ZZZ:Ship Contract ID'`
                        },                     
                    ]
                    case "SG25^1_SG47": return [
                        {
                            key: "TOD",
                            type: TreeItemType.Segment,
                            desc: `Terms of delivery or transport`,
                            codeSample: `TOD+6+CC+FOB:::Description 1:Description 2'`
                        },                     
                    ]
                    case "SG25^1_SG49": return [
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
                            key: "SG25^1_SG49_SG50",
                            type: TreeItemType.Group,
                            rootVersion: AssistantORDERS.versionKey,
                            desc: `Quantity`,
                            codeSample: ``
                        },                    
                    ]
                    case "SG25^1_SG49_SG50": return [
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
                            codeSample: `DTM+2:20160102-20160103:718'`
                        },                           
                    ]
                    case "SG25^2": return this._getSG25_2_Children();
                    case "SG25^2_SG29^1":return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Scheduling line number`,
                            codeSample: `RFF+AAN::1'`
                        },
                                           
                    ]
                    case "SG25^2_SG29^2":return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Material provision indicator`,
                            codeSample: `RFF+ACJ:reworkTo'`
                        },
                                          
                    ]
                    case "SG25^2_SG30":return this._getSG25_2_SG30_Children();
                    case "SG25^2_SG30_SG31":return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `References`,
                            codeSample: `RFF+BT:US::P1Y10M1DT100H10M2S'`
                        },
                                          
                    ]
                    case "SG25^2_SG30_SG32":return [
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

    _getSG2Children(): TreeItemElement[] | null | undefined {
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
                key: "SG2_SG3",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG2_SG5",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Contact information`,
                codeSample: ``
            },
        ]
    }
    /**
     * Payment terms
     * @returns 
     */
    _getSG8Children(): TreeItemElement[] | null | undefined {
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
    _getSG18_1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ALC",
                type: TreeItemType.Segment,
                desc: `Shipping costs`,
                codeSample: `ALC+C+Tracking Domain+++SAA:::Description:Tracking ID'`
            },
            {
                key: "SG18^1_SG21",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },
        ]
    }
    // Allowance or charge
    _getSG18_2_Children(): TreeItemElement[] | null | undefined {
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
                key: "SG18^2_SG20",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Percentage details`,
                codeSample: ``
            },
            {
                key: "SG18^2_SG21",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },
        ]
    }
    _getSG25_1_Children(): TreeItemElement[] | null | undefined {
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
                codeSample: `DTM+2:201601041010:203'`
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
                key: "SG25^1_SG26",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Characteristic`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG28",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Price details`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG29",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG30^1",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Packaging information`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG30^2",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Batch information`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG34",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Duty/tax/fee details`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG35",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG39^1",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Allowance or charge`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG39^2",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Allowance or charge`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG45",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Details of transport`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG47",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Terms of delivery or transport`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG49",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Scheduling conditions`,
                codeSample: ``
            },

        ]
    }

    _getSG25_1_SG30_1_Children(): TreeItemElement[] | null | undefined {
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
                key: "SG25^1_SG30^1_SG31",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `References`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG30^1_SG32",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Package identification`,
                codeSample: ``
            },
        ]
    }
    _getSG25_1_SG30_2_Children(): TreeItemElement[] | null | undefined {
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
                key: "SG25^1_SG30^2_SG31",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `References`,
                codeSample: ``
            },
            {
                key: "SG25^1_SG30^2_SG32",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Batch identification`,
                codeSample: ``
            },
        ]
    }

    _getSG25_2_Children(): TreeItemElement[] | null | undefined {
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
                key: "SG25^2_SG29^1",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Scheduling line number`,
                codeSample: ``
            },
            {
                key: "SG25^2_SG29^2",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Material provision indicator`,
                codeSample: ``
            },
            {
                key: "SG25^2_SG30",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Batch information`,
                codeSample: ``
            },
        ]
    }

    _getSG25_2_SG30_Children(): TreeItemElement[] | null | undefined {
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
                key: "SG25^2_SG30_SG31",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `References`,
                codeSample: ``
            },
            {
                key: "SG25^2_SG30_SG32",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
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
                codeSample: `UNH+1+ORDERS:D:96A:UN'`
            },

            {
                key: "BGM",
                type: TreeItemType.Segment,
                desc: `Beginning of message`,
                codeSample: `BGM+220:::Purchase Order+Purchase Order ID+9+AB'`
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
                rootVersion: AssistantORDERS.versionKey,
                desc: `Reference`,
                codeSample: ``
            },


            {
                key: "SG2",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },
            {
                key: "SG6",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Duty/tax/fee details`,
                codeSample: ``
            },
            {
                key: "SG7",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Currencies`,
                codeSample: ``
            },
            {
                key: "SG8",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Payment terms`,
                codeSample: ``
            },
            {
                key: "SG9",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Details of transport`,
                codeSample: ``
            },
            {
                key: "SG11",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Terms of delivery or transport`,
                codeSample: ``
            },
            {
                key: "SG15",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Scheduling conditions`,
                codeSample: ``
            },
            {
                key: "SG18^1",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Allowance or charge`,
                codeSample: ``
            },
            {
                key: "SG18^2",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Allowance or charge`,
                codeSample: ``
            },
            {
                key: "SG25^1",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Line item`,
                codeSample: ``
            },
            {
                key: "SG25^2",
                type: TreeItemType.Group,
                rootVersion: AssistantORDERS.versionKey,
                desc: `Scheduling - Subcontracting component`,
                codeSample: ``
            },
            {
                key: "UNT",
                type: TreeItemType.Segment,
                desc: `Message trailer`,
                codeSample: `UNT+94+1'`
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