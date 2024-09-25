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
export class AssistantINVOIC extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_INVOIC;
    getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
        if (element.type === TreeItemType.Version) {
            return this._getRootChildren();
        } else if (element.type === TreeItemType.Group) {
            switch (element.key) {
                case "SG1^1": return [
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
                        codeSample: `DTM+4:20160101:102'`
                    },
                ]
                case "SG1^2": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference - Tax point and payment due dates for VAT tax charges`,
                        codeSample: `RFF+VA:VAT Registration ID:1:Tax Description'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+131:20160101:102'`
                    },
                ]
                case "SG1^3": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference - Mutually defined references`,
                        codeSample: `RFF+ZZZ:MutuallyDefinedIDName::Mutually defined identification'`
                    },
                    
                ]
                case "SG2": return this._getSG2Children();
                case "SG2_SG3^1": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference`,
                        codeSample: `RFF+TL:Tax Examption ID'`
                    },
                ]
                case "SG2_SG3^2": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference - Additional carrier/shipment identification`,
                        codeSample: `RFF+CN:Tracking ID::trackingNumber'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+89:20160101:102'`
                    },
                ]
                case "SG2_SG3^3": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference - Mutually defined references`,
                        codeSample: `RFF+ZZZ:MutuallyDefinedIDName::Mutually defined identification'`
                    },
                ]
                case "SG2_SG5": return [
                    {
                        key: "CTA",
                        type: TreeItemType.Segment,
                        desc: `Contact information`,
                        codeSample: `CTA+IC+Contact ID:Contact Name'`
                    },
                    {
                        key: "COM",
                        type: TreeItemType.Segment,
                        desc: `Communication contact`,
                        codeSample: `COM+billing@thesupplier.org:EM'`
                    },
                ]
                case "SG6": return [
                    {
                        key: "TAX",
                        type: TreeItemType.Segment,
                        desc: `Duty/tax/fee details`,
                        codeSample: `TAX+7+VAT:::Tax location++1000.00+:::12.00+E'`
                    },
                ]
                case "SG7": return [
                    {
                        key: "CUX",
                        type: TreeItemType.Segment,
                        desc: `Currencies`,
                        codeSample: `CUX+2:EUR:4+3:USD:7+0.123'`
                    },
                ]
                case "SG8": return this._getSG8Children();
                case "SG12": return [
                    {
                        key: "TOD",
                        type: TreeItemType.Segment,
                        desc: `Terms of delivery or transport`,
                        codeSample: `TOD+++EXW'`
                    },
                ]
                case "SG15^1" : return this._getSG15_1_Children();
                case "SG15^1_SG16":return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference`,
                        codeSample: `RFF+ZZZ:Special-Service-Description:EN'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+194:20160101:102'`
                    },
                ]
                case "SG15^1_SG18":return [
                    {
                        key: "PCD",
                        type: TreeItemType.Segment,
                        desc: `Percentage details`,
                        codeSample: `PCD+3:5.00:13'`
                    },
                ]
                case "SG15^1_SG19":return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+8:100.00:EUR:4'`
                    },
                ]
                case "SG15^1_SG21":return [
                    {
                        key: "TAX",
                        type: TreeItemType.Segment,
                        desc: `Duty/tax/fee details - Shipping and special handling tax`,
                        codeSample: `TAX+7+VAT:::Tax location++1000.00+:::12.00+E+Description'`
                    },
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+124:100.00:EUR:4'`
                    },
                ]

                case "SG15^2" : return this._getSG15_2_Children();
                case "SG15^2_SG18": return [
                    {
                        key: "PCD",
                        type: TreeItemType.Segment,
                        desc: `Percentage details`,
                        codeSample: `PCD+12:5.00:13'`
                    },

                ]
                case "SG15^2_SG19": return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+23:100.00:EUR:4'`
                    },
                   
                ]
                case "SG15^2_SG21" : return [
                    {
                        key: "TAX",
                        type: TreeItemType.Segment,
                        desc: `Duty/tax/fee details - Shipping and special handling tax`,
                        codeSample: `TAX+7+OTH:::Tax location++100.00+:::19.00+E+Shipping tax'`
                    },
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+124:100.00:EUR:4'`
                    },
                ]
                case "SG25": return this._getSG25Children();
                case "SG25_SG26": return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+128:100.00:EUR:4'`
                    },
                   
                ]

                case "SG25_SG28": return this._getSG25_SG28_Children();
                case "SG25_SG29^1" : return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference`,
                        codeSample: `RFF+CT:Contract ID'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+126:20160101:102'`
                    },
                ]
                case "SG25_SG29^2" : return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference -Type of item identification`,
                        codeSample: `RFF+FI:item'`
                    },
                ]
                case "SG25_SG29^3" : return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference - Tax point and payment due dates for VAT tax charges`,
                        codeSample: `RFF+VA:VAT Registration ID:1:Tax description'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+131:20160101:102'`
                    },
                ]
                case "SG25_SG29^4" : return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference - Mutually defined references`,
                        codeSample: `RFF+ZZZ:MutuallyDefinedIDName::Mutually defined identification'`
                    },
                ]
                case "SG25_SG30" : return [
                    {
                        key: "PAC",
                        type: TreeItemType.Segment,
                        desc: `Package`,
                        codeSample: `PAC+5+1+CT:::Carton'`
                    },
                    {
                        key: "MEA",
                        type: TreeItemType.Segment,
                        desc: `Measurements`,
                        codeSample: `MEA+PD+AAD+KGM:100'`
                    },
                ]
                case "SG25_SG32" : return [
                    {
                        key: "LOC",
                        type: TreeItemType.Segment,
                        desc: `Place/location identification`,
                        codeSample: `LOC+27+DE'`
                    },
                   
                ]
                case "SG25_SG33" : return this._getSG25_SG33_Children();
                case "SG25_SG34^1": return this._getSG25_SG34_1_Children();
                case "SG25_SG34^1_SG35^1": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference`,
                        codeSample: `RFF+TL:Tax Exemption ID'`
                    },
                ]
                case "SG25_SG34^1_SG35^2": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference - Additional carrier/shipment identification`,
                        codeSample: `RFF+CN:Tracking ID::trackingNumber'`
                    },
                    {
                        key: "DTM",
                        type: TreeItemType.Segment,
                        desc: `Date/Time`,
                        codeSample: `DTM+89:20160101:102'`
                    },
                ];
                case "SG25_SG34^1_SG35^3": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference - Mutually defined references`,
                        codeSample: `RFF+ZZZ:MutuallyDefinedIDName::Mutually defined identification'`
                    },
                ]
                
                case "SG25_SG34^1_SG37": return [
                    {
                        key: "CTA",
                        type: TreeItemType.Segment,
                        desc: `Contact information`,
                        codeSample: `CTA+IC+Conact ID:Contact Name'`
                    },
                    {
                        key: "COM",
                        type: TreeItemType.Segment,
                        desc: `Communication contact`,
                        codeSample: `COM+billing@thesupplier.org:EM'`
                    },
                ]
                case "SG25_SG34^2": return [
                    {
                        key: "NAD",
                        type: TreeItemType.Segment,
                        desc: `Name and address - Manufacturer`,
                        codeSample: `NAD+MF+++Manufacturer Name'`
                    },
                ]
                case "SG25_SG38^1": return this._getSG25_SG38_1_Children();
                case "SG25_SG38^1_SG40": return [
                    {
                        key: "PCD",
                        type: TreeItemType.Segment,
                        desc: `Percentage details`,
                        codeSample: `PCD+3:5.00:13'`
                    },
                ]
                case "SG25_SG38^1_SG41": return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+8:100.00:EUR:4'`
                    },
                ]
                case "SG25_SG38^1_SG43": return [
                    {
                        key: "TAX",
                        type: TreeItemType.Segment,
                        desc: `Duty/tax/fee details`,
                        codeSample: `TAX+7+VAT:::Tax location++1000.00+:::12.00+E+Description'`
                    },
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+176:123:EUR:4'`
                    },
                ]
                case "SG25_SG38^2": return this._getSG25_SG38_2_Children()
                case "SG25_SG38^2_SG40": return [
                    {
                        key: "PCD",
                        type: TreeItemType.Segment,
                        desc: `Percentage details`,
                        codeSample: `PCD+12:5.00:13'`
                    },
                ]
                case "SG25_SG38^2_SG41": return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+23:5.77:EUR:4'`
                    },
                ]
                case "SG25_SG38^2_SG43": return [
                    {
                        key: "TAX",
                        type: TreeItemType.Segment,
                        desc: `Duty/tax/fee details - Shipping and special handling tax`,
                        codeSample: `TAX+7+OTH:::Tax location++100.00+:::19.00+E+Shipping tax'`
                    },
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+124:100.00:EUR:4'`
                    },
                ]
                case "SG25_SG38^3": return this._getSG25_SG38_3_Children();
                case "SG25_SG38^3_SG41": return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+54:5.77:EUR:4'`
                    },
                ]
                case "SG48": return [
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+9:1200.00:EUR:4'`
                    },
                    {
                        key: "SG48_SG49",
                        type: TreeItemType.Group,
                        rootVersion:AssistantINVOIC.versionKey,
                        desc: `Reference`,
                        codeSample: ``
                    },
                ]
                case "SG48_SG49": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `Reference`,
                        codeSample: `RFF+AIL:120000000000234478943216899'`
                    },
                   
                ]
                
                case "SG50": return [
                    {
                        key: "TAX",
                        type: TreeItemType.Segment,
                        desc: `Duty/tax/fee details`,
                        codeSample: `TAX+7+VAT:::Tax location++1000.00+AN:::12.00+E+PartyTaxID'`
                    },
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+124:100.00:EUR:4'`
                    },
                ]
                case "SG51": return [
                    {
                        key: "ALC",
                        type: TreeItemType.Segment,
                        desc: `Allowance or charge - Line item summary`,
                        codeSample: `ALC+C+Charge ID+++HD:::Handling-Charge-Description-1:Handling-Charge-Description-2'`
                    },
                    {
                        key: "MOA",
                        type: TreeItemType.Segment,
                        desc: `Monetary amount`,
                        codeSample: `MOA+131:200.00:EUR:4'`
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
                codeSample: `NAD+SU+Party ID::92+Contact Name+Postal Address Name+Street+City+TX+ZIP+US'`
            },
            {
                key: "LOC",
                type: TreeItemType.Segment,
                desc: `Place/location identification`,
                codeSample: `LOC+89+:::Amtsgericht Ludwigshafen'`
            },
            {
                key: "FII",
                type: TreeItemType.Segment,
                desc: `Financial institution information`,
                codeSample: `FII+RB+IBAN ID+SWIFT ID:25:17::::Bank Name+US'`
            },
            {
                key: "SG2_SG3^1",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG2_SG3^2",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Reference - Additional carrier/shipment identification`,
                codeSample: ``
            },
            {
                key: "SG2_SG3^3",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Reference - Mutually defined references`,
                codeSample: ``
            },
            {
                key: "SG2_SG5",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Contact information`,
                codeSample: ``
            },
        ]
    }
    _getSG8Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "PAT",
                type: TreeItemType.Segment,
                desc: `Payment terms`,
                codeSample: `PAT+22+6:::Terms description 1:Terms description 2+5:3:D:10'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+12:20160330:102'`
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
                codeSample: `MOA+52:10.00:EUR:4'`
            },
        ]
    }

    _getSG15_1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ALC",
                type: TreeItemType.Segment,
                desc: `Allowance or charge`,
                codeSample: `ALC+A+Allowance ID+3+1+AJ:::Discount-Description'`
            },
            {
                key: "SG15^1_SG16",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG15^1_SG18",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Percentage details`,
                codeSample: ``
            },
            {
                key: "SG15^1_SG19",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },
            {
                key: "SG15^1_SG21",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Duty/tax/fee details`,
                codeSample: ``
            },
        ]
    }

    _getSG15_2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ALC",
                type: TreeItemType.Segment,
                desc: `Allowance or charge - Discount, shipping and special handling charge`,
                codeSample: `ALC+C++++SH:::Special-Handling-Description'`
            },
            {
                key: "SG15^2_SG18",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Percentage details`,
                codeSample: ``
            },
            {
                key: "SG15^2_SG19",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },
            {
                key: "SG15^2_SG21",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Duty/tax/fee details - Shipping and special handling tax`,
                codeSample: ``
            },
        ]
    }

    _getSG25Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Line item`,
                codeSample: `LIN+1++0001:PL+1:1'`
            },
            {
                key: "PIA",
                type: TreeItemType.Segment,
                desc: `Additional product id`,
                codeSample: `PIA+1+Supplier Part ID:SA+Buyer Part ID:BP+Manufacturer Part ID:MF+EAN:EN+Waste Catalog ID:ZZZ'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item description`,
                codeSample: `IMD+F++:::Item-Description::EN'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item description - Classification`,
                codeSample: `IMD+B++ACA:::custom:X0141'`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+47:24:C62'`
            },
            {
                key: "ALI",
                type: TreeItemType.Segment,
                desc: `Additional information`,
                codeSample: `ALI+US++88'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+35:20160203:102'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text`,
                codeSample: `FTX+AAI+++General Information Text+EN'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text - Tax details`,
                codeSample: `FTX+TXD+++Tax Details Text+EN'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text - Mutually defined references`,
                codeSample: `FTX+ZZZ+++MutuallyDefinedIDName:Mutually defined identification'`
            },
            {
                key: "SG25_SG26",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },
            {
                key: "SG25_SG28",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Price details - Additional information - Unit price`,
                codeSample: ``
            },
            {
                key: "SG25_SG29^1",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG25_SG29^2",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Reference - Type of item identification`,
                codeSample: ``
            },
            {
                key: "SG25_SG29^3",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Reference - Tax point and payment due dates for VAT tax charges`,
                codeSample: ``
            },
            {
                key: "SG25_SG29^4",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Reference - Mutually defined references`,
                codeSample: ``
            },
            {
                key: "SG25_SG30",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Package`,
                codeSample: ``
            },
            {
                key: "SG25_SG32",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Place/location identification`,
                codeSample: ``
            },
            {
                key: "SG25_SG33",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Duty/tax/fee details`,
                codeSample: ``
            },
            {
                key: "SG25_SG34^1",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },
            {
                key: "SG25_SG34^2",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Name and address - Manufacturer`,
                codeSample: ``
            },
            {
                key: "SG25_SG38^1",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Allowance or charge`,
                codeSample: ``
            },
            {
                key: "SG25_SG38^2",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Allowance or charge - Discount, shipping/special handling charge`,
                codeSample: ``
            },
            {
                key: "SG25_SG38^3",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Allowance or charge - Distribution charge`,
                codeSample: ``
            },
            
        ]
    }

    _getSG25_SG28_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "PRI",
                type: TreeItemType.Segment,
                desc: `Price details - Additional information - Unit price`,
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

    _getSG25_SG33_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "TAX",
                type: TreeItemType.Segment,
                desc: `Duty/tax/fee details`,
                codeSample: `TAX+7+VAT:::Tax location++1000.00+AN:::12.00+E+Party Tax ID'`
            },
            {
                key: "MOA",
                type: TreeItemType.Segment,
                desc: `Monetary amount`,
                codeSample: `MOA+124:100.00:EUR:4'`
            },
            {
                key: "LOC",
                type: TreeItemType.Segment,
                desc: `Place/location identification`,
                codeSample: `LOC+157+ME'`
            },
        ]
    }
    _getSG25_SG34_1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "NAD",
                type: TreeItemType.Segment,
                desc: `Name and address`,
                codeSample: `NAD+CA+CA-ID::92+Contact Name+Postal Address Name+Street+City+CsubID+Postcode+US'`
            },
            {
                key: "SG25_SG34^1_SG35^1",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG25_SG34^1_SG35^2",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Reference - Additional carrier/shipment identification`,
                codeSample: ``
            },
            {
                key: "SG25_SG34^1_SG35^3",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Reference - Mutually defined references`,
                codeSample: ``
            },
            {
                key: "SG25_SG34^1_SG37",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Contact information`,
                codeSample: ``
            },
        ]
    }
    _getSG25_SG38_1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ALC",
                type: TreeItemType.Segment,
                desc: `Allowance or charge`,
                codeSample: `ALC+C++++FC:::Freight-Charge-Description'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+194:20160101:102'`
            },
            {
                key: "SG25_SG38^1_SG40",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Percentage details`,
                codeSample: ``
            },
            {
                key: "SG25_SG38^1_SG41",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },
            {
                key: "SG25_SG38^1_SG43",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Duty/tax/fee details`,
                codeSample: ``
            },
        ]
    }
    _getSG25_SG38_2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ALC",
                type: TreeItemType.Segment,
                desc: `Allowance or charge - Discount, shipping/special handling charge`,
                codeSample: `ALC+C++++SH:::Special Handling Description'`
            },
          
            {
                key: "SG25_SG38^2_SG40",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Percentage details`,
                codeSample: ``
            },
            {
                key: "SG25_SG38^2_SG41",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },
            {
                key: "SG25_SG38^2_SG43",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Duty/tax/fee details - Shipping and special handling tax`,
                codeSample: ``
            },
        ]
    }
    _getSG25_SG38_3_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ALC",
                type: TreeItemType.Segment,
                desc: `Allowance or charge - Distribution charge`,
                codeSample: `ALC+N+Accounting Segment ID+++ADT:175:92:Accounting Segment Name:Accounting Segment Description'`
            },
            {
                key: "SG25_SG38^3_SG41",
                type: TreeItemType.Group,
                rootVersion:AssistantINVOIC.versionKey,
                desc: `Monetary amount`,
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
                codeSample: `UNB+UNOC:3+SenderID:ZZZ+ReceiverID:ZZZ+160204:0930+1++++++1'`
            },

            {
                key: "UNH",
                type: TreeItemType.Segment,
                desc: `Message header`,
                codeSample: `UNH+1+INVOIC:D:96A:UN'`
            },

            {
                key: "BGM",
                type: TreeItemType.Segment,
                desc: `Beginning of message`,
                codeSample: `BGM+380:::Document-Name+INVOIC ID+9'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+137:20160203:102'`
            },
            {
                key: "PAI",
                type: TreeItemType.Segment,
                desc: `Payment instructions`,
                codeSample: `PAI+::42'`
            },

            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text`,
                codeSample: `FTX+AAI+++General Information Text+EN'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text - Legal information`,
                codeSample: `FTX+REG+++Company Name:GmbH:1000000 EUR'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text - Tax details`,
                codeSample: `FTX+TXD+++Tax Details Text+EN'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text - Mutually defined references`,
                codeSample: `FTX+ZZZ+++MutuallyDefinedIDName:Mutually defined identification'`
            },

            {
                key: "SG1^1",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG1^2",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Reference - Tax point and payment due dates for VAT tax charges`,
                codeSample: ``
            },
            {
                key: "SG1^3",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Reference - Mutually defined references`,
                codeSample: ``
            },

            {
                key: "SG2",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },

            {
                key: "SG6",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Duty/tax/fee details`,
                codeSample: ``
            },
            {
                key: "SG7",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Currencies`,
                codeSample: ``
            },
            {
                key: "SG8",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Payment terms`,
                codeSample: ``
            },
            {
                key: "SG12",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Terms of delivery or transport`,
                codeSample: ``
            },
            {
                key: "SG15^1",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Allowance or charge`,
                codeSample: ``
            },
            {
                key: "SG15^2",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Allowance or charge - Discount, shipping and special handling charge`,
                codeSample: ``
            },

            {
                key: "SG25",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Line item`,
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
                key: "SG48",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },
            {
                key: "SG50",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Duty/tax/fee details`,
                codeSample: ``
            },
            {
                key: "SG51",
                type: TreeItemType.Group,
                rootVersion: AssistantINVOIC.versionKey,
                desc: `Allowance or charge - Line item summary`,
                codeSample: ``
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