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
export class AssistantDESADV extends AssistantBase {
    public static versionKey = constants.versionKeys.EDIFACT_DESADV;
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
                            codeSample: `RFF+CT:Agreement ID:1'`
                        },
                        {
                            key: "DTM",
                            type: TreeItemType.Segment,
                            desc: `Date/Time`,
                            codeSample: `DTM+171:20160104093000P00:304'`
                        },
                    ]
                case "SG2": return this._getSG2Children();
                case "SG2_SG3": return [
                    {
                        key: "RFF",
                        type: TreeItemType.Segment,
                        desc: `References`,
                        codeSample: `RFF+VA:Party VAT ID'`
                    },
                ]
                case "SG2_SG4": return [
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
                        codeSample: `COM+e-mail Address:EM'`
                    },
                ]
               case "SG5": return [
                {
                    key: "TOD",
                    type: TreeItemType.Segment,
                    desc: `Terms of delivery or transport`,
                    codeSample: `TOD+6+CA+FOB:::Delivery Text 1:Delivery Text 2'`
                },
                {
                    key: "FTX",
                    type: TreeItemType.Segment,
                    desc: `Free text`,
                    codeSample: `FTX+AAI+++Terms Of Delivery Text 1:Terms Of Delivery Text 2:Terms Of Delivery Text 3:Terms Of Delivery Text 4:Terms Of Delivery Text 5+EN'`
                },
               ]
               case "SG6": return this._getSG6Children();
               case "SG6_SG7^1": return [
                {
                    key: "LOC",
                    type: TreeItemType.Segment,
                    desc: `Tracking information`,
                    codeSample: `LOC+92+:::URL="http?://www.scac.com/xyz'`
                },
                {
                    key: "DTM",
                    type: TreeItemType.Segment,
                    desc: `Date/Time`,
                    codeSample: `DTM+171:20160111093000P00:304'`
                },
               ]
               case "SG6_SG7^2": return [
                {
                    key: "LOC",
                    type: TreeItemType.Segment,
                    desc: `Shipping Instructions`,
                    codeSample: `LOC+ZZZ+:::Shipping Instructions Text 1+:::Shipping Instructions Text 2+:::Shipping Instructions Text 3'`
                },
               ]
               case "SG8": return this._getSG8Children();
               case "SG10": return this._getSG10Children();
               case "SG10_SG11": return this._getSG10_SG11_Children();
               case "SG10_SG15": return this._getSG10_SG15_Children();
               case "SG10_SG11_SG13^1": return [
                {
                    key: "PCI",
                    type: TreeItemType.Segment,
                    desc: `Packaging identification - SSCC`,
                    codeSample: `PCI+30+Shipping Marks 1:Shipping Marks 2:Shipping Marks 3:Shipping Marks 4:Shipping Marks 5:Shipping Marks 6:Shipping Marks 7:Shipping Marks 8:Shipping Marks 9:Shipping Marks 10'`
                },
                {
                    key: "SG10_SG11_SG13^1_SG14",
                    type: TreeItemType.Group,
                    rootVersion:AssistantDESADV.versionKey,
                    desc: `Goods identity number - SSCC`,
                    codeSample: ``
                },
               ]
               case "SG10_SG11_SG13^1_SG14": return [
                {
                    key: "GIN",
                    type: TreeItemType.Segment,
                    desc: `Goods identity number - SSCC`,
                    codeSample: `GIN+BJ+3900000001234501:3900000001234503+3900000001234505:3900000001234506+3900000001234508:3900000001234509+3900000001234511:3900000001234512+3900000001234513:3900000001234520'`
                },
               ]
            
               case "SG10_SG11_SG13^2": return [
                {
                    key: "PCI",
                    type: TreeItemType.Segment,
                    desc: `Packaging identification - GIAI`,
                    codeSample: `PCI+ZZZ'`
                },
                {
                    key: "SG10_SG11_SG13^2_SG14",
                    type: TreeItemType.Group,
                    rootVersion:AssistantDESADV.versionKey,
                    desc: `Goods identity number - GIAI`,
                    codeSample: ``
                },
               ]
               case "SG10_SG11_SG13^2_SG14": return [
                {
                    key: "GIN",
                    type: TreeItemType.Segment,
                    desc: `Goods identity number - GIAI`,
                    codeSample: `GIN+ML+GIAI 301'`
                },
               ]
               case "SG15": return this._getSG10_SG15_Children();
               case "SG10_SG15_SG16": return [
                {
                    key: "RFF",
                    type: TreeItemType.Segment,
                    desc: `Reference`,
                    codeSample: `RFF+LI:2::item'`
                },
                {
                    key: "DTM",
                    type: TreeItemType.Segment,
                    desc: `Date/Time`,
                    codeSample: `DTM+171:20160104093000P00:304'`
                },
               ]
               case "SG10_SG15_SG20^1": return this._getSG10_SG15_SG20_1_Children();

               case "SG10_SG15_SG20^2": return this._getSG10_SG15_SG20_2_Children();
               case "SG10_SG15_SG20^2_SG21": return [
                {
                    key: "GIN",
                    type: TreeItemType.Segment,
                    desc: `Goods identity number - SSCC`,
                    codeSample: `GIN+BJ+3900000001234501:3900000001234503+3900000001234505:3900000001234506+3900000001234508:3900000001234509+3900000001234511:3900000001234512+3900000001234513:3900000001234520'`
                },
               ]
               case "SG10_SG15_SG23": return [
                {
                    key: "QVR",
                    type: TreeItemType.Segment,
                    desc: `Quantity variances`,
                    codeSample: `QVR+-10:21+BP'`
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
                codeSample: `NAD+ST+Party ID::92+Party Name 1:Party Name 2:Party Name 3:Party Name 4:Party Name 5+Party AddrName 1:Party AddrName 2:Party AddrName 3:Party AddrName 4:Party AddrName 5+Party Street 1:Party Street 2:Party Street 3:Party Street 4+Party City+TX+ZIP+US'`
            },
            {
                key: "SG2_SG3",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `References`,
                codeSample: ``
            },
            {
                key: "SG2_SG4",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Contact information`,
                codeSample: ``
            },
        ]
    }
    _getSG6Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "TDT",
                type: TreeItemType.Segment,
                desc: `Details of transport`,
                codeSample: `TDT+20+Carrier PRO ID+ZZZ:ShipContractID+31:truck+SCAC::182:Carrier Name++ZZZ:ZZZ:trackingNumber+:::URL="http?://www.scac.com/xyz'`
            },
            {
                key: "SG6_SG7^1",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Tracking information`,
                codeSample: ``
            },
            {
                key: "SG6_SG7^2",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Shipping instructions`,
                codeSample: ``
            },
        ]
    }
    
    _getSG8Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "EQD",
                type: TreeItemType.Segment,
                desc: `Equipment details`,
                codeSample: `EQD+TE+Trailer ID'`
            },
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurements`,
                codeSample: `MEA+AAE+LN+MTR:13.6'`
            },
            {
                key: "SEL",
                type: TreeItemType.Segment,
                desc: `Seal number`,
                codeSample: `SEL+Seal ID+CA'`
            },
        ]
    }
    _getSG10Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "CPS",
                type: TreeItemType.Segment,
                desc: `Consignment packaging sequence`,
                codeSample: `CPS+1'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text - Comments`,
                codeSample: `FTX+AAI+++Text1:Text2:Text3:Text4:Text5+EN'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text - Mutually Defined Content`,
                codeSample: `FTX+ZZZ+++Mutually defined identification name:Text1:Text2:Text3:Text4'`
            },
            {
                key: "SG10_SG11",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Package`,
                codeSample: ``
            },
            {
                key: "SG10_SG15",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Line item`,
                codeSample: ``
            },
          
        ]
    }
    _getSG10_SG11_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "PAC",
                type: TreeItemType.Segment,
                desc: `Package`,
                codeSample: `PAC+1++:::Pallet'`
            },
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurements`,
                codeSample: `MEA+AAE+AAA+KGM:90'`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+52:10:EA'`
            },
            {
                key: "SG10_SG11_SG13^1",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Packaging identification - SSCC`,
                codeSample: ``
            },
           
            {
                key: "SG10_SG11_SG13^2",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Packaging identification - GIAI`,
                codeSample: ``
            },
           
        ]
    }

    _getSG10_SG15_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "LIN",
                type: TreeItemType.Segment,
                desc: `Line item`,
                codeSample: `LIN+1++10:PL+1:2'`
            },
            {
                key: "PIA",
                type: TreeItemType.Segment,
                desc: `Additional product id`,
                codeSample: `PIA+1+Serial ID:SN::90+Promotional Variant ID:PV::92+UNSPC Classification:CC::90+Class Of Goods ID:GN::90+Harmonized System ID:HS::91'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item description`,
                codeSample: `IMD+F++:::Item Description - long Text 1:Item Description - long Text 2:EN'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item characteristics`,
                codeSample: `IMD+B+98+:::Small'`
            },
            {
                key: "IMD",
                type: TreeItemType.Segment,
                desc: `Item classification`,
                codeSample: `IMD+B++ACA:::customXYZ:Classification ID XYZ'`
            },
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurements`,
                codeSample: `MEA+AAE+AAA+KGM:90'`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+12:90:EA'`
            },
            {
                key: "GIR",
                type: TreeItemType.Segment,
                desc: `Asset identification numbers`,
                codeSample: `GIR+1+Asset Serial ID:BN+Asset Tag ID:AP'`
            },
            {
                key: "GIR",
                type: TreeItemType.Segment,
                desc: `Manufacturer name`,
                codeSample: `GIR+1+Manufacturer Name 1:AN+Manufacturer Name 2:AN+Manufacturer Name 3:AN+Manufacturer Name 4:AN+Manufacturer Name 5:AN'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+361:20171201:102'`
            },
            {
                key: "FTX",
                type: TreeItemType.Segment,
                desc: `Free text`,
                codeSample: `FTX+AAI+++Text1:Text2:Text3:Text4:Text5+EN'`
            },
            {
                key: "MOA",
                type: TreeItemType.Segment,
                desc: `Monetary amount`,
                codeSample: `MOA+146:10:EUR'`
            },
           
            {
                key: "SG10_SG15_SG16",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
            {
                key: "SG10_SG15_SG20^1",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Batch identification`,
                codeSample: ``
            },
            {
                key: "SG10_SG15_SG20^2",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Packaging identification`,
                codeSample: ``
            },
            {
                key: "SG10_SG15_SG23",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Quantity variances`,
                codeSample: ``
            },
            
        ]
    }

    _getSG10_SG15_SG20_1_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "PCI",
                type: TreeItemType.Segment,
                desc: `Batch identification`,
                codeSample: `PCI+10'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+36:20171231:102'`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+12:100'`
            },
            
        ]
    }
    _getSG10_SG15_SG20_2_Children(): TreeItemElement[] | null | undefined {
        return [
            {
                key: "PCI",
                type: TreeItemType.Segment,
                desc: `Packaging identification`,
                codeSample: `PCI+30+Shipping Marks 1:Shipping Marks 2:Shipping Marks 3:Shipping Marks 4:Shipping Marks 5:Shipping Marks 6:Shipping Marks 7:Shipping Marks 8:Shipping Marks 9:Shipping Marks 10'`
            },
            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+361:20171231:102'`
            },
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurements`,
                codeSample: `MEA+AAE+AAA+KGM:90'`
            },
            {
                key: "QTY",
                type: TreeItemType.Segment,
                desc: `Quantity`,
                codeSample: `QTY+12:90:EA'`
            },
            {
                key: "SG10_SG15_SG20^2_SG21",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Goods identity number - SSCC`,
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
                codeSample: `UNB+UNOC:3+SenderID:ZZZ+ReceiverID:ZZZ+160111:1314+1++++++1'`
            },

            {
                key: "UNH",
                type: TreeItemType.Segment,
                desc: `Message header`,
                codeSample: `UNH+1+DESADV:D:96A:UN'`
            },

            {
                key: "BGM",
                type: TreeItemType.Segment,
                desc: `Beginning of message`,
                codeSample: `BGM+351:ZZZ::partial+Despatch Advice ID+9+CA'`
            },

            {
                key: "DTM",
                type: TreeItemType.Segment,
                desc: `Date/Time`,
                codeSample: `DTM+11:20160111141000P00:304'`
            },
            {
                key: "MEA",
                type: TreeItemType.Segment,
                desc: `Measurements`,
                codeSample: `MEA+AAE+LN+MTR:13.6'`
            },
            {
                key: "SG1",
                type: TreeItemType.Group,
                rootVersion: AssistantDESADV.versionKey,
                desc: `Reference`,
                codeSample: ``
            },
           
            {
                key: "SG2",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Name and address`,
                codeSample: ``
            },
            {
                key: "SG5",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Terms of delivery or transport`,
                codeSample: ``
            },
            {
                key: "SG6",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Details of transport`,
                codeSample: ``
            },

            {
                key: "SG8",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Equipment details`,
                codeSample: ``
            },
            {
                key: "SG10",
                type: TreeItemType.Group,
                rootVersion:AssistantDESADV.versionKey,
                desc: `Consignment packaging sequence`,
                codeSample: ``
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
                codeSample: `UNT+54+1'`
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