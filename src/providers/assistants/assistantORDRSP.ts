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
export class AssistantORDRSP extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_ORDRSP;
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
                            codeSample: `DTM+4:20160103:102'`
                        },
                       
                    ]
                    case "SG3": return [
                        {
                            key: "NAD",
                            type: TreeItemType.Segment,
                            desc: `Name and address`,
                            codeSample: `NAD+BT+Bill to ID::92+Bill to Name+Bill to AddrName+Bill to Street+Bill to City+IL+ZIP+FR'`
                        },
                        {
                            key: "SG3_SG6",
                            type: TreeItemType.Group,
                            rootVersion:AssistantORDRSP.versionKey,
                            desc: `Contact information`,
                            codeSample: ``
                        },
                    ]
                    case "SG3_SG6": return [
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
                    case "SG7": return [
                        {
                            key: "TAX",
                            type: TreeItemType.Segment,
                            desc: `Duty/tax/fee details`,
                            codeSample: `TAX+7+VAT:::Tax location+yes+1000.00+:::12.00+E+PartyTaxID'`
                        },
                        {
                            key: "MOA",
                            type: TreeItemType.Segment,
                            desc: `Monetary amount`,
                            codeSample: `MOA+124:100.00:USD'`
                        },
                    ]
                    case "SG12":return [
                        {
                            key: "TOD",
                            type: TreeItemType.Segment,
                            desc: `Terms of delivery or transport`,
                            codeSample: `TOD+++FOB'`
                        },
                    ]
                    case "SG19^1": return this._getSG19_1_Children();
                    case "SG19^1_SG21" : return [
                        {
                            key: "PCD",
                            type: TreeItemType.Segment,
                            desc: `Percentage details`,
                            codeSample: `PCD+3:5.00:13'`
                        },
                        
                    ]
                    case "SG19^1_SG22" : return [
                        {
                            key: "MOA",
                            type: TreeItemType.Segment,
                            desc: `Monetary amount`,
                            codeSample: `MOA+8:100.00:USD:9'`
                        },
                     
                    ]
                    case "SG19^2": return this._getSG19_2_Children();
                    case "SG19^2_SG22": return [
                        {
                            key: "MOA",
                            type: TreeItemType.Segment,
                            desc: `Monetary amount`,
                            codeSample: `MOA+23:10.00:EUR:9'`
                        },
                    ]
                    case "SG26":  return this._getSG26Children();
                    case "SG26_SG27": return [
                        {
                            key: "CCI",
                            type: TreeItemType.Segment,
                            desc: `Characteristic/class id - Item Classification`,
                            codeSample: `CCI+++custom:::5136030000'`
                        },
                    ]
                    case "SG26_SG30": return [
                        {
                            key: "PRI",
                            type: TreeItemType.Segment,
                            desc: `Price details`,
                            codeSample: `PRI+CAL:::CUP:100:C62'`
                        },
                        {
                            key: "CUX",
                            type: TreeItemType.Segment,
                            desc: `Currencies`,
                            codeSample: `CUX+5:EUR:9'`
                        },
                    ]
                    case "SG26_SG31": return [
                        {
                            key: "RFF",
                            type: TreeItemType.Segment,
                            desc: `Reference - Type of item identification`,
                            codeSample: `RFF+FI:composite::itemLevel'`
                        },
                    ]
                    case "SG26_SG36": return [
                        {
                            key: "TAX",
                            type: TreeItemType.Segment,
                            desc: `Duty/tax/fee details`,
                            codeSample: `TAX+7+VAT:::Tax location+yes+1000.00+:::12.00+E+PartyTaxID'`
                        },
                        {
                            key: "MOA",
                            type: TreeItemType.Segment,
                            desc: `Monetary amount`,
                            codeSample: `MOA+124:100.00:USD'`
                        },
                    ]
                    case "SG26_SG37^1": return [
                        {
                            key: "NAD",
                            type: TreeItemType.Segment,
                            desc: `Name and address`,
                            codeSample: `NAD+ST+Ship to ID::9+Ship to Name+Ship to AddrName+Ship to Street 1+Ship to City+TX+ZIP+US'`
                        },
                        {
                            key: "SG26_SG37^1_SG40",
                            type: TreeItemType.Group,
                            rootVersion:AssistantORDRSP.versionKey,
                            desc: `Contact information`,
                            codeSample: ``
                        },
                    ]
                    case "SG26_SG37^1_SG40": return [
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
                    case "SG26_SG37^2": return [
                        {
                            key: "NAD",
                            type: TreeItemType.Segment,
                            desc: `Name and address - Manufacturer`,
                            codeSample: `NAD+MF+++Manufacturer Name'`
                        },
                      
                    ]
                    case "SG26_SG41^1": return this._getSG26_SG41_1_Children();
                    case "SG26_SG41^1_SG43" : return [
                        {
                            key: "PCD",
                            type: TreeItemType.Segment,
                            desc: `Percentage details`,
                            codeSample: `PCD+3:5.00'`
                        },
                    ]
                    case "SG26_SG41^1_SG44" : return [
                        {
                            key: "MOA",
                            type: TreeItemType.Segment,
                            desc: `Monetary amount`,
                            codeSample: `MOA+8:100.00:USD:9'`
                        },
                    ]
                    case "SG26_SG41^2": return this._getSG26_SG41_2_Children();
                    case "SG26_SG41^2_SG44" : return [
                        {
                            key: "MOA",
                            type: TreeItemType.Segment,
                            desc: `Monetary amount`,
                            codeSample: `MOA+23:10.00:EUR:9'`
                        },
                    ]
                    case "SG26_SG51": return this._getSG26_SG51_Children();
                    case "SG26_SG51_SG52": return [
                        {
                            key: "QTY",
                            type: TreeItemType.Segment,
                            desc: `Quantity`,
                            codeSample: `QTY+194:100:C62'`
                        },
                        {
                            key: "DTM",
                            type: TreeItemType.Segment,
                            desc: `Date/Time`,
                            codeSample: `DTM+69:201601110101:203'`
                        },
                    ]

            }
        } else {
            // should be segment type, do we add children for that?
        }

        return null;
    }

    _getSG26_SG41_1_Children(): TreeItemElement[] | null | undefined {
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
                key: "SG26_SG41^1_SG43",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Percentage details`,
                codeSample: ``
            },  
            {
                key: "SG26_SG41^1_SG44",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },  
        ]
    }
    _getSG26_SG41_2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ALC",
                type: TreeItemType.Segment,
                desc: `Allowance or charge - Shipping costs`,
                codeSample: `ALC+C+Tracking Domain+++SAA:::Description:Tracking ID'`
            },
            
            {
                key: "SG26_SG41^2_SG44",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },  
        ]
    }
    _getSG19_1_Children(): TreeItemElement[] | null | undefined {
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
                key: "SG19^1_SG21",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Percentage details`,
                codeSample: ``
            },
            {
                key: "SG19^1_SG22",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },      
        ]
    }
    _getSG19_2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "ALC",
                type: TreeItemType.Segment,
                desc: `Allowance or charge - Shipping costs`,
                codeSample: `ALC+C+Tracking Domain+++SAA:::Description:Tracking ID'`
            }, 
            {
                key: "SG19^2_SG22",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Monetary amount`,
                codeSample: ``
            },         
        ]
    }
    _getSG26_SG51_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "SCC",
                type: TreeItemType.Segment,
                desc: `Scheduling conditions`,
                codeSample: `SCC+1'`
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
                desc: `Free text - Mutually defined references`,
                codeSample: `FTX+ZZZ+++MutuallyDefinedIDName:Mutually defined identification'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text - Rejection Reason`,
                codeSample: `FTX+ACD+++Duplicate Order'`
            },
            {
                key: "SG26_SG51_SG52",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Quantity`,
                codeSample: ``
            },   
        ]
    }
    _getSG26Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Line item`,
                codeSample: `LIN+10++Supplier Part ID:VN+1:1'`
            },
            {
                key: "PIA",
                type: TreeItemType.Segment,
                desc: `Additional product id`,
                codeSample: `PIA+1+EAN Part ID:EN+Supplemental Part ID:VS+European Waste ID:ZZZ+unspsc:CC+Supplier Batch:NB'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item description`,
                codeSample: `IMD+F++:::Item Description::EN'`
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
                desc: `Date/time/period`,
                codeSample: `DTM+143:10:804'`
            },
            {
                key: "MOA",
                type: TreeItemType.Segment,
                desc: `Monetary amount`,
                codeSample: `MOA+146:100.00:EUR:9'`
            },
            {
                key: "SG26_SG27",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Characteristic/class id - Item Classification`,
                codeSample: ``
            }, 
            {
                key: "SG26_SG30",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Price details`,
                codeSample: ``
            }, 
            {
                key: "SG26_SG31",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Reference - Type of item identification`,
                codeSample: ``
            }, 
            {
                key: "SG26_SG36",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Duty/tax/fee details`,
                codeSample: ``
            }, 
            {
                key: "SG26_SG37^1",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Name and address`,
                codeSample: ``
            }, 
            {
                key: "SG26_SG37^2",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Name and address - Manufacturer`,
                codeSample: ``
            }, 
            {
                key: "SG26_SG41^1",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Allowance or charge`,
                codeSample: ``
            }, 
            {
                key: "SG26_SG41^2",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Allowance or charge - Shipping costs`,
                codeSample: ``
            }, 
            {
                key: "SG26_SG51",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Scheduling conditions`,
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
                codeSample: `UNH+1+ORDRSP:D:96A:UN'`
            },

            {
                key: "BGM",
                type: TreeItemType.Segment,
                desc: `Beginning of message`,
                codeSample: `BGM+231+Purchase Order Conf ID+9+AC'`
            },

            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+8:20160104:102'`
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
                desc: `Free text - Rejection Reason`,
                codeSample: `FTX+ACD+++Duplicate Order'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text - Mutually defined references`,
                codeSample: `FTX+ZZZ+++MutuallyDefinedIDName:Mutually defined identification'`
            },
        
            {
                key: "SG1",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG3",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },
            {
                key: "SG7",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Duty/tax/fee details`,
                codeSample: ``
            },
            {
                key: "SG12",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Terms of delivery or transport`,
                codeSample: ``
            },
            {
                key: "SG19^1",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Allowance or charge`,
                codeSample: ``
            },
            {
                key: "SG19^2",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
                desc: `Allowance or charge - Shipping costs`,
                codeSample: ``
            },

            {
                key: "SG26",
                type: TreeItemType.Group,
                rootVersion:AssistantORDRSP.versionKey,
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
                key: "MOA",
                type: TreeItemType.Segment,
                desc: `Monetary amount`,
                codeSample: `MOA+128:1000.00:EUR:9'`
            },
            {
                key: "UNT",
                type: TreeItemType.Segment,
                desc: `Message trailer`,
                codeSample: `UNT+51+1'`
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