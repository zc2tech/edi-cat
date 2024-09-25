import { DocInfoBase } from "../info/docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "../info/docInfoBase";

export class Info_ORDRSP extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "231": "Purchase order response",
        },
        "1225": {
            "4": "Change",
            "27": "Not accepted",
            "29": "Accepted without amendment"
            // "5": "Replace",
            // "9": "Original"
        },
        // "4343": {
        //     "AC": "Acknowledge with changes",
        //     "AI": "Acknowledge only changes",
        //     "AP": "Accepted",
        //     "RE": "Rejected"
        // }

    };

    static usage_DTM = {
        "2005": {
            // "8": "Order confirmation notice date",
            "2": "Delivery date/time, requested",
            "137": "Document/message date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_FTX = {
        "4451": {
            "AAI": "General information",
            "ACD": "Reason",
            "TRA": "Transportation information",
            "TXD": "Tax declaration",
            "ZZZ": "Mutually defined"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG1_RFF = {
        "1153": {
            // "AEU": "Supplier's reference number",
            // "IV": "Invoice number",
            // "ON": "Order number (purchase)",
            // "POR": "Purchase order response number"
            "CR": "Customer reference number",
            "IV": "Invoice number",
            "ON": "Order number (buyer)",
            "POR": "Order confirmation number",
            "PP": "Purchase order change number",
            "UC": "Ultimate customer's reference number"
        }
    };

    static usage_SG1_DTM = {
        "2005": {
            // "4": "Order date/time",
            "171": "Reference date/time",
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_SG3_NAD = {
        "3035": DocInfoBase.PartyQualifier02,
        "3055": DocInfoBase.ResponsibleAgency05
    };
    static usage_SG3_SG6_CTA = {
        "3139": {
            "IC": "Information contact"
        }
    };
    static usage_SG3_SG6_COM = {
        "3155": DocInfoBase.CommuChannelQualifier02
    };
    static usage_SG7_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax"
        },
        "5153": {
            "100": "Insurance tax (GS1 Code)",
            "AAD": "Tobacco tax",
            "AAF": "Coffee tax",
            "AAJ": "Tax on replacement part",
            "AAK": "Mineral oil tax",
            "ACT": "Alcohol tax (GS1 Code)",
            "CAR": "Car tax",
            "ENV": "Environmental tax",
            "EXC": "Excise duty",
            "GST": "Goods and services tax",
            "IMP": "Import tax",
            "OTH": "Other taxes",
            "VAT": "Value added tax"
        },
        // "5289": {
        //     "yes": "The entire invoice is VAT (Value Added Tax)-recoverable"
        // },
        "5305": {
            "A": "Mixed tax rate",
            "E": "Exempt from tax",
            "S": "Standard rate",
            "Z": "Zero rated goods"
        }
    };

    static usage_SG7_MOA = {
        "5025": {
            "124": "Tax amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "9": "Order currency"
        }
    };

    static usage_SG8_CUX = {
        "6347": {
            "2": "Reference currency",
            "3": "Target currency"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "9": "Order currency",
            "11": "Payment currency"
        }
    }

    static usage_SG12_TOD = {
        "4053": DocInfoBase.TransportationTermsCodeList03
    };
    static usage_SG19_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge"
        },
        "1227": {
            "1": "First step of calculation",
            "2": "Second step of calculation",
            "3": "Third step of calculation",
            "4": "Fourth step of calculation",
            "5": "Fifth step of calculation",
            "6": "Sixth step of calculation",
            "7": "Seventh step of calculation",
            "8": "Eighth step of calculation",
            "9": "Ninth step of calculation"
        },
        "7161": {
            "FC": "Freight charge",
            "AJ": "Adjustments",
            "HD": "Handling",
            "IN": "Insurance",
            "VAB": "Volume discount"
        }
    };

    static usage_SG19_DTM = {
        "2005": {
            "194": "Start date/time",
            "206": "End date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    }
    static usage_SG19_SG21_PCD = {
        "5245": {
            "1": "Allowance",
            "2": "Charge",
            "3": "Allowance or charge"
        },
        "5249": {
            "13": "Invoice value"
        }
    }
    static usage_SG19_SG22_MOA = {
        "5025": {
            // "4": "Deducted price",
            "8": "Allowance or charge amount",
            "23": "Charge amount",
            "98": "Original price",
            "204": "Allowance amount",
            "296": "Total authorised deduction"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            // "7": "Target currency",
            "9": "Order currency",
            "11": "Payment currency"
        }
    }

    static usage_SG26_LIN = {
        "1229": {
            "3": "Changed",
            "5": "Accepted without amendment",
            "7": "Not accepted"
        },
        "7143": {
            // "VN": "Suppliers part number",
            // "SA": "Suppliers item number"
            "SRV": "GS1 Global Trade Item Number"
        },
        "5495": {
            "1": "Sub-line information"
        }
    };
    static usage_SG26_PIA = {
        "4347": {
            "1": "Additional identification",
            "5": "Product identification"
        },
        "7143": DocInfoBase.ItemNumberType05
    }

    static usage_SG26_IMD = {
        "7077": {
            "B": "Code and text",
            "E": "Free-form short description",
            "F": "Free-form",
        },
        "7009": {
            "ACA": "Classification"
        },
        "7081": {
            "13": "Quality",
            "35": "Colour",
            "38": "Grade",
            "98": "Size",
            "SGR": "Size grid (GS1 Code)"
        },
        "3453": DocInfoBase.LanguageList
    }

    static usage_SG26_MEA = {
        "6311": {
            "PD": "Physical dimensions (product ordered)",
        },
        "6313": {
            "AAA": "Unit net weight",
            "AAB": "Unit gross weight",
            "AAC": "Total net weight",
            "AAD": "Total gross weight",
            "AAW": "Gross volume",
            "AAX": "Net volume",
            "HT": "Height dimension",
            "LN": "Length dimension",
            "WD": "Width dimension"
        }
    }

    static usage_SG26_QTY = {
        "6063": {
            "21": "Ordered quantity",
            "83": "Backorder quantity",
            "113": "Quantity to be delivered",
            "185": "Rejected quantity",
            "192": "Free goods quantity"
        }
    }

    static usage_SG26_DTM = {
        "2005": {
            "2": "Delivery date/time, requested",
            "11": "Despatch date and/or time",
            "69": "Delivery date/time, promised for",
            "200": "Pick-up/collection date/time of cargo",
            "506": "Back order delivery date/time/period"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    }
    static usage_SG26_FTX = {
        "4451": {
            "AAI": "General information",
            "ACD": "Rejection reason",
            "TXD": "Tax declaration",
            "ZZZ": "Mutually defined"
        },
        "3453": DocInfoBase.LanguageList
    }

    // static usage_SG26_MOA = {
    //     "5025": {
    //         "146": "Unit price"
    //     },
    //     "6345": DocInfoBase.CurrencyList,
    //     "6343": {
    //         "9": "Order currency"
    //     }
    // }

    static usage_SG26_SG30_PRI = {
        "5125": {
            // "CAL": "Calculation price"
            "AAA": "Calculation net",
            "AAE": "Information price, excluding allowances or charges, including taxes"
        },
        "5387": {
            // "AAK": "New price (changed unit price)",
            // "CUP": "Confirmed unit price"
            "AAE": "Changed unit price",
            "AAK": "Confirmed unit price"
        }
    }

    // static usage_SG26_SG30_CUX = {
    //     "6347": {
    //         "5": "Calculation base currency"
    //     },
    //     "6345": DocInfoBase.CurrencyList,
    //     "6343": {
    //         "9": "Order currency"
    //     }
    // }
    static usage_SG26_SG31_RFF = {
        "1153": {
            "FI": "File line identifier",
            "ON": "Order number (buyer)",
            "PP": "Purchase order change number"
        }
    }
    static usage_SG26_SG36_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax"
        },
        "5153": {
            "100": "Insurance tax (GS1 Code)",
            "AAD": "Tobacco tax",
            "AAF": "Coffee tax",
            "AAJ": "Tax on replacement part",
            "AAK": "Mineral oil tax",
            "ACT": "Alcohol tax (GS1 Code)",
            "CAR": "Car tax",
            "ENV": "Environmental tax",
            "EXC": "Excise duty",
            "GST": "Goods and services tax",
            "IMP": "Import tax",
            "OTH": "Other taxes",
            "VAT": "Value added tax"
        },
        // "5289": {
        //     "yes": "The entire invoice is VAT (Value Added Tax)-recoverable"
        // },
        "5305": {
            "A": "Mixed tax rate",
            "E": "Exempt from tax",
            "S": "Standard rate",
            "Z": "Zero rated goods"
        }
    }
    static usage_SG26_SG36_MOA = {
        "5025": {
            "124": "Tax amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "9": "Order currency"
        }
    }

    static usage_SG26_SG37_NAD = {
        "3035": DocInfoBase.PartyQualifier02,
        "3055": DocInfoBase.ResponsibleAgency06
    }

    static usage_SG26_SG37_SG40_CTA = {
        "3139": {
            "IC": "Information contact"
        }
    }

    static usage_SG26_SG37_SG40_COM = {
        "3155": DocInfoBase.CommuChannelQualifier02
    }

    static usage_SG26_SG41_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge"
        },
        "1227": {
            "1": "First step of calculation",
            "2": "Second step of calculation",
            "3": "Third step of calculation",
            "4": "Fourth step of calculation",
            "5": "Fifth step of calculation",
            "6": "Sixth step of calculation",
            "7": "Seventh step of calculation",
            "8": "Eighth step of calculation",
            "9": "Ninth step of calculation"
        },
        "7161": DocInfoBase.SpecialServices03

    }
    static usage_SG26_SG41_DTM = {
        "2005": {
            "194": "Start date/time",
            "206": "End date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    }

    static usage_SG26_SG41_SG43_PCD = {
        "5245": {
            "1": "Allowance",
            "2": "Charge",
            "3": "Allowance or charge"
        },
        "5249": {
            "13": "Invoice value"
        }
    }
    static usage_SG26_SG41_SG44_MOA = {
        "5025": {
            "8": "Allowance or charge amount",
            "23": "Charge amount",
            "98": "Original amount",
            "204": "Allowance amount",
            "296": "Total authorised deduction"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            // "7": "Target currency",
            "9": "Order currency",
            "11": "Payment currency"
        }
    }

    static usage_MOA = {
        "5025": {
            "124": "Tax amount",
            "128": "Total amount",
            "176": "Total tax amount"
        },
        "6345": DocInfoBase.LanguageList,
        "6343": {
            "9": "Order currency",
            "11": "Payment currency"
        }
    };

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

    static comment_SG3_NAD = {
        "3035":DocInfoBase.codelists3035,
        "3207": DocInfoBase.codelists3207,
    }
    static comment_SG3_SG4_RFF = {
        "1153": DocInfoBase.codelists1153,
    }
    static comment_SG7_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG8_CUX = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG19_SG22_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG26_MEA = {
        "6411": DocInfoBase.codelists6411,
    }
    static comment_SG26_QTY = {
        "6411": DocInfoBase.codelists6411,
    }
    static comment_SG26_SG30_PRI = {
        "6411": DocInfoBase.codelists6411,
    }

    static comment_SG26_SG36_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG26_SG37_NAD = {
        "3035": DocInfoBase.codelists3035,
        "3207": DocInfoBase.codelists3207,
    }
    static comment_SG26_SG41_SG44_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    
    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGM":
                return Info_ORDRSP.usage_BGM[ele.getSchemaId()]
                break;
            case "ROOT_DTM":
                return Info_ORDRSP.usage_DTM[ele.getSchemaId()]
                break;
            case "ROOT_FTX":
                return Info_ORDRSP.usage_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG1_RFF":
                return Info_ORDRSP.usage_SG1_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_ORDRSP.usage_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG3_NAD":
                return Info_ORDRSP.usage_SG3_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG3_SG6_CTA":
                return Info_ORDRSP.usage_SG3_SG6_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG3_SG6_COM":
                return Info_ORDRSP.usage_SG3_SG6_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG7_TAX":
                return Info_ORDRSP.usage_SG7_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG7_MOA":
                return Info_ORDRSP.usage_SG7_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG8_CUX":
                return Info_ORDRSP.usage_SG8_CUX[ele.getSchemaId()]
                break;
            case "ROOT_SG12_TOD":
                return Info_ORDRSP.usage_SG12_TOD[ele.getSchemaId()]
                break;
            case "ROOT_SG19_ALC":
                return Info_ORDRSP.usage_SG19_ALC[ele.getSchemaId()]
                break;
            case "ROOT_SG19_DTM":
                return Info_ORDRSP.usage_SG19_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG19_SG21_PCD":
                return Info_ORDRSP.usage_SG19_SG21_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG19_SG22_MOA":
                return Info_ORDRSP.usage_SG19_SG22_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_LIN":
                return Info_ORDRSP.usage_SG26_LIN[ele.getSchemaId()]
                break;
            case "ROOT_SG26_PIA":
                return Info_ORDRSP.usage_SG26_PIA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_IMD":
                return Info_ORDRSP.usage_SG26_IMD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_MEA":
                return Info_ORDRSP.usage_SG26_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_QTY":
                return Info_ORDRSP.usage_SG26_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG26_DTM":
                return Info_ORDRSP.usage_SG26_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_FTX":
                return Info_ORDRSP.usage_SG26_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG30_PRI":
                return Info_ORDRSP.usage_SG26_SG30_PRI[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG31_RFF":
                return Info_ORDRSP.usage_SG26_SG31_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG36_TAX":
                return Info_ORDRSP.usage_SG26_SG36_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG36_MOA":
                return Info_ORDRSP.usage_SG26_SG36_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_NAD":
                return Info_ORDRSP.usage_SG26_SG37_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_SG40_CTA":
                return Info_ORDRSP.usage_SG26_SG37_SG40_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_SG40_COM":
                return Info_ORDRSP.usage_SG26_SG37_SG40_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_ALC":
                return Info_ORDRSP.usage_SG26_SG41_ALC[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_DTM":
                return Info_ORDRSP.usage_SG26_SG41_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_SG43_PCD":
                return Info_ORDRSP.usage_SG26_SG41_SG43_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_SG44_MOA":
                return Info_ORDRSP.usage_SG26_SG41_SG44_MOA[ele.getSchemaId()]
                break;           
            case "ROOT_MOA":
                return Info_ORDRSP.usage_MOA[ele.getSchemaId()]
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
            // case "ROOT_DTM":
            //     return Info_ORDRSP.comment_DTM[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG1_DTM":
            //     return Info_ORDRSP.comment_SG1_DTM[ele.getSchemaId()]
            //     break;
            case "ROOT_SG3_NAD":
                return Info_ORDRSP.comment_SG3_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG3_SG4_RFF":
                return Info_ORDRSP.comment_SG3_SG4_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG7_MOA":
                return Info_ORDRSP.comment_SG7_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG8_CUX":
                return Info_ORDRSP.comment_SG8_CUX[ele.getSchemaId()]
                break;
            case "ROOT_SG19_SG22_MOA":
                return Info_ORDRSP.comment_SG19_SG22_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_MEA":
                return Info_ORDRSP.comment_SG26_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_QTY":
                return Info_ORDRSP.comment_SG26_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG30_PRI":
                return Info_ORDRSP.comment_SG26_SG30_PRI[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG36_MOA":
                return Info_ORDRSP.comment_SG26_SG36_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_NAD":
                return Info_ORDRSP.comment_SG26_SG37_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_SG44_MOA":
                return Info_ORDRSP.comment_SG26_SG41_SG44_MOA[ele.getSchemaId()]
                break;
            case "ROOT_MOA":
                return Info_ORDRSP.comment_MOA[ele.getSchemaId()]
                break;
            // case "ROOT_SG7_TAX":
            //     return Info_ORDRSP.comment_SG7_TAX[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG19_DTM":
            //     return Info_ORDRSP.comment_SG19_DTM[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG26_SG36_TAX":
            //     return Info_ORDRSP.comment_SG26_SG36_TAX[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG26_SG37_NAD":
            //     return Info_ORDRSP.comment_SG26_SG37_NAD[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG26_SG41_DTM":
            //     return Info_ORDRSP.comment_SG26_SG41_DTM[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG26_SG51_SG52_DTM":
            //     return Info_ORDRSP.comment_SG26_SG51_SG52_DTM[ele.getSchemaId()]
            //     break;
            default:

        }
        return undefined;
    }
}