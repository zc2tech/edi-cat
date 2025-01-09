import { DocInfoBase } from "../info/docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "../info/docInfoBase";

export class Info_DESADV extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "345": "Ready for despatch advice",
            "351": "Despatch advice",
        },
        // "1131": {
        //     "ZZZ": "Mutually defined"
        // },
        // "3055": {
        //     "ZZZ": "Mutually defined"
        // },
        "1225": {
            "3": "Deletion",
            // "4": "Change (update, future use)",
            "5": "Replace (update, future use)",
            "9": "Original"
        },
        // "4343": {
        //     "CA": "Planned",
        //     "AP": "Actual"
        // }

    };
    static usage_DTM = {
        "2005": {
            "2": "Delivery date/time, requested",
            "11": "Despatch date, and or time",
            "17": "Delivery date/time, estimated",
            // "124": "Despatch advice date",
            "137": "Document/message date/time",
            "200": "Pick-up/collection date/time of cargo"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_ALI = {
        "4183": {
            "164": "Shipment completes order",
            "165": "Split shipment"
        },

    };
    static usage_MEA = {
        "6311": {
            "PD": "Physical dimensions (product ordered)"
        },
        "6313": DocInfoBase.MeasurementDimension03,
    };

    static usage_SG1_RFF = {
        "1153": {
            "AAN": "Delivery schedule number",
            "CR": "Customer reference number",
            "CT": "Agreement number",
            "DQ": "Delivery note number",
            "IV": "Invoice number",
            "ON": "Order number (buyer)",
            "VN": "Order number (supplier)",
            "UC": "Ultimate customer's reference number"
        },
        "1156": {
            "1": "Schedule agreement"
        }
    };

    static usage_SG1_DTM = {
        "2005": {
            // "4": "Order date/time",
            // "126": "Contract/Agreement date",
            "171": "Reference date/time*"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };
    static usage_SG2_NAD = {
        "3035": DocInfoBase.PartyQualifier02,
        "3055": DocInfoBase.ResponsibleAgency06
    };
    static usage_SG2_SG3_RFF = {
        // "1153": DocInfoBase.ReferenceQualifier
    };

    static usage_SG2_SG4_CTA = {
        "3139": {
            "DL": "Delivery contact*",
            "IC": "Information contact",
            "SD": "Shipping contact"
        },
    };
    static usage_SG2_SG4_COM = {
        "3155": DocInfoBase.CommuChannelQualifier02
    };
    static usage_SG5_TOD = {
        "4055": DocInfoBase.TermsOfDelivery,
        "4053": this.TransportationTermsCodeList04
    };

    // static usage_SG5_FTX = {
    //     "4451": {
    //         "AAI": "Terms of delivery, general",
    //         "AAR": "Terms of delivery, specific",
    //         "SSR": "Service level information"
    //     },
    //     "3453": DocInfoBase.LanguageList
    // };

    static usage_SG6_TDT = {
        "8051": {
            "20": "Main-carriage transport",
        },
        "8067": {
            "10": "Maritime transport",
            "20": "Rail transport",
            "30": "Road transport",
            "40": "Air transport",
            "50": "Mail",
            "60": "Multimodal transport",
            "70": "Fixed transport installations",
            "80": "Inland water transport"
        },
        // "8179": {
        //     "6": "Aircraft (any kind of flight transport)",
        //     "11": "Ship (any kind of marine transport)",
        //     "23": "Rail bulk car (any kind of train or rail service)",
        //     "31": "Truck (any kind of road transport)"
        // },
        "3055": DocInfoBase.ResponsibleAgency06,
        "8457": {
            "ZZZ": "Mutually defined"
        },
        "8459": {
            "ZZZ": "Mutually defined"
        }
    };

    static usage_SG6_SG7_LOC = {
        "3227": {
            "5": "Place of departure",
            "8": "Place of destination",
            "92": "Routing",
            "22E": "Movement to location (GS1 Code)"
        },
    };
    static usage_SG6_SG7_DTM = {
        "2005": {
            "194": "Start date/time",
            "206": "End date/time",
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_SG8_EQD = {
        "8053": {
            "TE": "Trailer",
        },
    };
    static usage_SG8_MEA = {
        "6311": {
            "PD": "Physical dimensions (product ordered)",
        },
        "6313": DocInfoBase.MeasurementDimension03,
        // "6411": DocInfoBase.MeasureUnit
    };

    static usage_SG8_SEL = {
        "1153": {
            "CA": "Carrier",
            "CU": "Customs",
            "SH": "Shipper",
            "TO": "Terminal operator"
        }
    };

    static usage_SG10_CPS = {
        "7075": {
            "1": "Inner",
            "1E": "Highest (GS1 Temporary Code)",
            "3": "Outer",
            "4": "No packaging hierarchy",
            "5": "Shipment Level"
        },
    };

    static usage_SG10_SG11_PAC = {
        "3055": {
            "9": "GS1",
        },
    };

    // static usage_SG10_FTX = {
    //     "4451": {
    //         "AAI": "General information",
    //         "ZZZ": "Mutually defined"
    //     },
    //     "3453": DocInfoBase.LanguageList
    // };

    static usage_SG10_SG11_MEA = {
        "6311": {
            "PD": "Physical dimensions (product ordered)",
        },
        "6313": DocInfoBase.MeasurementDimension03,
        // "6411": DocInfoBase.MeasureUnit
    };

    static usage_SG10_SG11_QTY = {
        "6063": {
            "52": "Quantity per pack",
        },
        // "6411": {
        //     "EA": "each"
        // }
    };

    static usage_SG10_SG11_SG13_PCI = {
        "4233": {
            "33E": "Marked with serial shipping container code (GS1 Code)",
            "34E": "Marked with GS1 number (Global Individual Asset Identifier)"
            // "30": "Mark serial shipping container code",
            // "ZZZ": "Mark global individual asset identifier",
        },
    };
    static usage_SG10_SG11_SG13_SG15_GIN = {
        "7405": {
            "AW": "Serial Shipping Container Code (SSCC)",
            "BJ": "Serial Shipping Container Code (SSCC)",
            "CU": "GS1 Global Individual Asset Identifier",
            // "ML": "Marking/label number"
        },
    };
    static usage_SG10_SG17_LIN = {
        "7143": {
            "SRV": "GS1 Global Trade Item Number",
        },
        "5495": {
            "1": "Sub-line information",
        },
    };
    static usage_SG10_SG17_PIA = {
        "4347": {
            "1": "Additional identification",
            "5": "Product identification",
        },
        "7143": DocInfoBase.ItemNumberType09,
        "3055": DocInfoBase.ResponsibleAgency02
    };

    static usage_SG10_SG17_IMD = {
        "7077": {
            "B": "Code and text",
            "E": "Free-form short description",
            "F": "Free-form",
        },
        "7081": {
            "13": "Quality",
            "35": "Colour",
            "38": "Grade",
            "79": "Other physical description",
            "98": "Size",
            "DSC": "Description (GS1 Code)",
            "SGR": "Size grid (GS1 Code)"
        },
        "3055": {
            "9": "GS1",
        },
        "7009": {
            "ACA": "Classification"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG10_SG17_MEA = {
        "6311": {
            "PD": "MeasuremPhysical dimensions (product ordered)ent",
        },
        "6313": DocInfoBase.MeasurementDimension03,
        // "6411": DocInfoBase.MeasureUnit
    };

    static usage_SG10_SG17_QTY = {
        "6063": {
            "12": "Despatch quantity",
            "21": "Ordered quantity",
            "192": "Free goods quantity",
        },
        // "6411": {
        //     "EA": "each"
        // }
    };

    // static usage_SG10_SG17_GIR = {
    //     "7297": {
    //         "1": "Product"
    //     },
    //     "7405": {
    //         "AN": "Manufacturing reference number",
    //         "AP": "Tag Number",
    //         "BN": "Serial number",
    //     }
    // }

    static usage_SG10_SG17_DTM = {
        "2005": {
            "36": "Expiry date",
            "361": "Best before date"
        },
        "2379": {
            "102": "CCYYMMDD"
        }
    }

    static usage_SG10_SG17_FTX = {
        "4451": {
            "AAI": "General information",
            "MKS": "Additional marks/numbers information",
            "ZZZ": "Mutually defined"
        },
        "3453": DocInfoBase.LanguageList
    };
    static usage_SG10_SG17_MOA = {
        "5025": {
            "146": "Unit price",
        },
        "6345": DocInfoBase.CurrencyList
    };

    static usage_SG10_SG17_SG18_RFF = {
        "1153": {
            "CT": "Agreement number",
            "LI": "Line item reference number",
            "ON": "Purchase order number",
            "PD": "Promotion deal number",
            "ZZZ": "Mutually defined reference number"
        },
        "1156": {
            "1": "Schedule agreement"
        }
    };

    static usage_SG10_SG17_SG18_DTM = {
        "2005": {
            // "4": "Order date/time",
            // "126": "Contract/Agreement date",
            "171": "Reference date/time*"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    }

    static usage_SG10_SG17_SG22_PCI = {
        "4233": {
            // "10": "Mark batch number",
            // "24": "Shipper assigned",
            // "30": "Mark serial shipping container code"
            "17": "Supplier's instructions",
            "33E": "Marked with serial shipping container code (GS1 Code)",
            "36E": "Marked with batch number (GS1 Code)"
        },
    };
    static usage_SG10_SG17_SG22_DTM = {
        "2005": {
            "36": "Expiry date",
            "94": "Production/manufacture date",
            "351": "Inspection date",
            "361": "Best before date"
        },
        "2379": {
            "102": "CCYYMMDD"
        }
    };

    static usage_SG10_SG17_SG22_QTY = {
        "6063": {
            "12": "Despatch quantity",
            "52": "Quantity per pack"
        },
    };

    static usage_SG10_SG17_SG22_MEA = {
        "6311": {
            "PD": "Physical dimensions (product ordered)",
        },
        "6313": DocInfoBase.MeasurementDimension03,
        // "6411": DocInfoBase.MeasureUnit
    };

    static usage_SG10_SG17_SG22_SG23_GIN = {
        "7405": {
            "AW": "Serial Shipping Container Code (SSCC)",
            "BJ": "Serial Shipping Container Code (SSCC)",
            "BX": "Batch number",
        },
        "7402": {
            "91": "Assigned by supplier or supplier's agent",
            "92": "Assigned by buyer or buyer's agent"
        }
    };

    static usage_SG10_SG17_SG25_QVR = {
        "6063": {
            "21": "Ordered quantity",
        },
        "4221": {
            "BP": "Shipment partial - back order to follow",
        },
    };

    static comment_MEA = {
        "6411": DocInfoBase.codelists6411,
    }

    // static comment_DTM = {
    //     "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
    //         + `Code 304 is recommended. Please refer for special requirements and time zone usage`
    //         + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
    //         + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    // }
    // static comment_SG1_DTM = {
    //     "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
    //         + `Code 304 is recommended. Please refer for special requirements and time zone usage`
    //         + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
    //         + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    // }

    static comment_SG2_NAD = {
        "3035": DocInfoBase.codelists3035,
        "3207": DocInfoBase.codelists3207,
    }

    static comment_SG2_SG3_RFF = {
        "1153": DocInfoBase.codelists1153A,
    }


    static comment_SG5_TOD = {
        "4215": DocInfoBase.codelists4215,
    }

    static comment_SG8_MEA = {
        "6411": DocInfoBase.codelists6411,
    }

    static comment_SG10_SG11_PAC = {
        "7065": DocInfoBase.codelists7065A,
    }

    static comment_SG10_SG11_MEA = {
        "6411": DocInfoBase.codelists6411,
    }
    static comment_SG10_SG11_QTY = {
        "6411": DocInfoBase.codelists6411,
    }

    static comment_SG10_SG17_MEA = {
        "6411": DocInfoBase.codelists6411,
    }
    static comment_SG10_SG17_QTY = {
        "6411": DocInfoBase.codelists6411,
    }    
    static comment_SG10_SG17_MOA = {
        "6345": DocInfoBase.codelists6345,
    }    

    static comment_SG10_SG17_SG22_MEA = {
        "6411": DocInfoBase.codelists6411,
    }
    static comment_SG10_SG17_SG22_QTY = {
        "6411": DocInfoBase.codelists6411,
    }   

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGM":
                return Info_DESADV.usage_BGM[ele.getSchemaId()]
                break;
            case "ROOT_DTM":
                return Info_DESADV.usage_DTM[ele.getSchemaId()]
                break;
            case "ROOT_ALI":
                return Info_DESADV.usage_ALI[ele.getSchemaId()]
                break;
            case "ROOT_MEA":
                return Info_DESADV.usage_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG1_RFF":
                return Info_DESADV.usage_SG1_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_DESADV.usage_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG2_NAD":
                return Info_DESADV.usage_SG2_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_RFF":
                return Info_DESADV.usage_SG2_SG3_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG4_CTA":
                return Info_DESADV.usage_SG2_SG4_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG4_COM":
                return Info_DESADV.usage_SG2_SG4_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG5_TOD":
                return Info_DESADV.usage_SG5_TOD[ele.getSchemaId()]
                break;
            case "ROOT_SG6_TDT":
                return Info_DESADV.usage_SG6_TDT[ele.getSchemaId()]
                break;
            case "ROOT_SG6_SG7_LOC":
                return Info_DESADV.usage_SG6_SG7_LOC[ele.getSchemaId()]
                break;
            case "ROOT_SG6_SG7_DTM":
                return Info_DESADV.usage_SG6_SG7_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG8_EQD":
                return Info_DESADV.usage_SG8_EQD[ele.getSchemaId()]
                break;
            case "ROOT_SG8_MEA":
                return Info_DESADV.usage_SG8_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG8_SEL":
                return Info_DESADV.usage_SG8_SEL[ele.getSchemaId()]
                break;
            case "ROOT_SG10_CPS":
                return Info_DESADV.usage_SG10_CPS[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG11_PAC":
                return Info_DESADV.usage_SG10_SG11_PAC[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG11_MEA":
                return Info_DESADV.usage_SG10_SG11_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG11_QTY":
                return Info_DESADV.usage_SG10_SG11_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG11_SG13_PCI":
                return Info_DESADV.usage_SG10_SG11_SG13_PCI[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG11_SG13_SG15_GIN":
                return Info_DESADV.usage_SG10_SG11_SG13_SG15_GIN[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_LIN":
                return Info_DESADV.usage_SG10_SG17_LIN[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_PIA":
                return Info_DESADV.usage_SG10_SG17_PIA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_IMD":
                return Info_DESADV.usage_SG10_SG17_IMD[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_MEA":
                return Info_DESADV.usage_SG10_SG17_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_QTY":
                return Info_DESADV.usage_SG10_SG17_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_DTM":
                return Info_DESADV.usage_SG10_SG17_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_FTX":
                return Info_DESADV.usage_SG10_SG17_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_MOA":
                return Info_DESADV.usage_SG10_SG17_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_SG18_RFF":
                return Info_DESADV.usage_SG10_SG17_SG18_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_SG18_DTM":
                return Info_DESADV.usage_SG10_SG17_SG18_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_SG22_PCI":
                return Info_DESADV.usage_SG10_SG17_SG22_PCI[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_SG22_DTM":
                return Info_DESADV.usage_SG10_SG17_SG22_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_SG22_QTY":
                return Info_DESADV.usage_SG10_SG17_SG22_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_SG22_MEA":
                return Info_DESADV.usage_SG10_SG17_SG22_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_SG22_SG23_GIN":
                return Info_DESADV.usage_SG10_SG17_SG22_SG23_GIN[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_SG25_QVR":
                return Info_DESADV.usage_SG10_SG17_SG25_QVR[ele.getSchemaId()]
                break;

            default:

        }
        return;
    }

    /**
     * Always markdown syntax
     * @param seg 
     * @param ele 
     * @returns 
     */
    public getComment(seg: EdiSegment, ele: EdiElement): string {
        switch (seg.astNode.fullPath) {
            case "ROOT_MEA":
                return Info_DESADV.comment_MEA[ele.getSchemaId()]
                break;
            // case "ROOT_DTM":
            //     return Info_DESADV.comment_DTM[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG1_DTM":
            //     return Info_DESADV.comment_SG1_DTM[ele.getSchemaId()]
            //     break;
            case "ROOT_SG2_NAD":
                return Info_DESADV.comment_SG2_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_RFF":
                return Info_DESADV.comment_SG2_SG3_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG5_TOD":
                return Info_DESADV.comment_SG5_TOD[ele.getSchemaId()]
                break;
            case "ROOT_SG8_MEA":
                return Info_DESADV.comment_SG8_MEA[ele.getSchemaId()]
                break;
            // case "ROOT_SG6_SG7_DTM":
            //     return Info_DESADV.comment_SG6_SG7_DTM[ele.getSchemaId()]
            //     break;
            case "ROOT_SG10_SG11_PAC":
                return Info_DESADV.comment_SG10_SG11_PAC[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG11_MEA":
                return Info_DESADV.comment_SG10_SG11_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG11_QTY":
                return Info_DESADV.comment_SG10_SG11_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_MEA":
                return Info_DESADV.comment_SG10_SG17_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_QTY":
                return Info_DESADV.comment_SG10_SG17_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_MOA":
                return Info_DESADV.comment_SG10_SG17_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_SG22_MEA":
                return Info_DESADV.comment_SG10_SG17_SG22_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG17_SG22_QTY":
                return Info_DESADV.comment_SG10_SG17_SG22_QTY[ele.getSchemaId()]
                break;
            // case "ROOT_SG10_SG17_SG18_DTM":
            //     return Info_DESADV.comment_SG10_SG17_SG18_DTM[ele.getSchemaId()]
            //     break;

            default:

        }
        return undefined;
    }
}