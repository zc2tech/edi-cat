import { DocInfoBase } from "../info/docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "../info/docInfoBase";

export class Info_ORDERS extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            // "150": "Internal order",
            "220": "Purchase order",
            "221": "Blanket order",
            "224": "Rush order",
            // "245": "Release order"
        },
        "1225": {
            "9": "Original",
        },
        // "4343": {
        //     "AB": "Message acknowledgement"
        // }

    };
    static usage_DTM = {
        "2005": {
            "2": "Delivery date/time, requested",
            // "4": "Order date/time",
            "7": "Effective date/time",
            "36": "Expiry date",
            "63": "Delivery date/time, latest",
            "64": "Delivery date/time, earliest",
            "137": "Document/message date/time",
            "200": "Pick-up/collection date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_FTX = {
        "4451": {
            "AAI": "General information",
            "DEL": "Terms of delivery information",
            "DIN": "Transport terms information",
            "PMT": "Method of shipping payment information",
            "PRI": "Priority information",
            "PUR": "General comment",
            "SIN": "Special instructions",
            "TRA": "Transportation information",
            "TXD": "Tax declaration",
            "ZZZ": "Mutually defined"

            // "AAR": "Terms of delivery",
            // "ACB": "Additional information",
            // "DOC": "Documentation instructions",
            // "TDT": "Transport details remarks",
        },
        // "4453": {
        //     "3": "Text for immediate use"
        // },
        // "4441": {
        //     "SPM": "Shipping payment methods",
        //     "TDC": "Terms of delivery",
        //     "TTC": "Transport terms",
        //     "EXT": ""
        // },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG1_RFF = {
        "1153": {
            "ACD": "Additional reference number",
            "AKO": "Action authorization number",
            "BO": "Parent agreement number",
            "CR": "Customer reference number",
            "CT": "Agreement number",
            "IT": "Network number",
            "UC": "Ultimate customer's reference number",
            "VA": "VAT registration number",
            "VN": "Order number (supplier)"
        }
    };

    static usage_SG1_DTM = {
        "2005": {
            // "4": "Order date/time",
            // "8": "Order received date/time",
            // "36": "Expiry date",
            "131": "Tax point date",
            "140": "Payment due date",
            "171": "Reference date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_SG2_NAD = {
        "3035": DocInfoBase.PartyQualifier02,
        // "3055": DocInfoBase.ResponsibleAgency
        "3055": {
            "9": "EAN (International Article Numbering association)",
        }
    };

    // static usage_SG2_LOC = {
    //     "3227": {
    //         "18": "Warehouse / Storage location",
    //         "19": "Factory / plant / Buyer location"
    //     },
    // };
    static usage_SG2_SG3_RFF = {
        "1153": DocInfoBase.ReferenceQualifier
    };
    static usage_SG2_SG5_CTA = {
        // "3139": DocInfoBase.ContactFunction
        "3139": {
            "IC": "Information contact",
            "PD": "Purchasing contact",
        }
    };
    static usage_SG2_SG5_COM = {
        "3155": DocInfoBase.CommuChannelQualifier02
    };
    static usage_SG6_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax",
        },
        "5153": {
            // "FRE": "Free",
            "GST": "Goods and services tax",
            // "LOC": "Local sales taxes",
            "OTH": "Other taxes",
            "VAT": "Value added tax"
        },
        "5289": {
            "TT": "Triangular Transaction"
        },
        "5305": {
            "A": "Mixed tax rate",
            "E": "Exempt from tax",
            "S": "Standard rate",
            "Z": "Zero rated goods"
        }
    };

    static usage_SG6_MOA = {
        "5025": {
            "124": "Tax amount",
            "125": "Taxable amount"
        },
        "6345": DocInfoBase.CurrencyList
    };

    static usage_SG7_CUX = {
        "6347": {
            "2": "Reference currency",
            "3": "Target currency"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            // "7": "Target currency",
            "9": "Order currency",
            "11": "Payment currency"
        }
    };

    static usage_SG8_PAT = {
        "4279": {
            "20": "Penalty terms",
            "22": "Discount"
        },
        "2475": {
            "5": "Date of invoice"
        },
        "2009": {
            "3": "After reference"
        },
        "2151": {
            "D": "Day"
        },
    };

    static usage_SG8_PCD = {
        "5245": {
            "12": "Discount",
            "15": "Penalty percentage"
        },
        "5249": {
            "13": "Invoice value"
        }
    };
    static usage_SG8_SG9_MOA = {
        "5025": {
            // "52": "Discount amount",
            "21": "Cash discount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "9": "Order currency"
        }

    };

    static usage_SG10_TDT = {
        "8051": {
            "20": "Main-carriage transport"
        },
        "8067": {
            "10": "Maritime transport",
            "20": "Rail transport",
            "30": "Road transport",
            "40": "Air transport"
        },
        "8457": {
            "ZZZ": "Mutually defined"
        },
        "8459": {
            "ZZZ": "Mutually defined"
        },
    };

    static usage_SG12_TOD = {
        "4055": DocInfoBase.TermsOfDelivery,
        "4053": this.TransportationTermsCodeList04
    };
    // static usage_SG15_SCC = {
    //     "4017": {
    //         "1": "Firm"
    //     },
    //     "4493": {
    //         "SC": "Ship complete order"
    //     }
    // };

    static usage_SG19_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge"
        },
        // "7161": DocInfoBase.SpecialServices02,
        "7161": {
            "AJ": "Adjustments",
            "FC": "Freight charge",
            "HD": "Handling"
        }
    };

    static usage_SG19_SG22_MOA = {
        "5025": {
            // "4": "Deducted price",
            "8": "Allowance or charge amount",
            "23": "Charge amount",
            "98": "Original price",
            "296": "Deducted price"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            // "7": "Target currency",
            "9": "Order currency",
            "11": "Payment currency"
        }
    };

    static usage_SG19_DTM = {
        "2005": {
            "194": "Start date/time",
            "206": "End date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_SG19_SG21_PCD = {
        "5245": {
            "3": "Allowance or charge",
        },
        "5249": {
            "13": "Invoice value"
        }
    };

    static usage_SG28_LIN = {
        "7143": {
            // "AB": "Assembly",
            // "VN": "Suppliers part number"
            "SRV": "GS1 Global Trade Item Number"
        },
        "5495": {
            "1": "Sub-line information"
        },
        // "7083": {
        //     "A": "Added to the configuration"
        // }
    };

    static usage_SG28_PIA = {
        "4347": {
            "1": "Additional identification",
            "5": "Product identification"
        },
        "7143": DocInfoBase.ItemNumberType06
    };

    static usage_SG28_IMD = {
        "7077": {
            "B": "Code and text",
            "C": "Code (from industry code list)",
            "E": "Free-form short description",
            "F": "Free-form"
        },
        "7081": {
            "13": "Quality",
            "35": "Colour",
            "38": "Grade",
            "98": "Size",
            "SGR": "Size grid (GS1 Code)"
        },
        "7009": {
            "CU": "Consumer unit (GS1 Code)",
            "DU": "Delivery unit (GS1 Code)",
            "IN": "Invoicing unit (GS1 Code)",
            "RC": "Returnable container (GS1 Code)",
            "TU": "Traded unit (GS1 Code)",
            "VQ": "Variable quantity unit (GS1 Code)"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG28_MEA = {
        "6311": {
            // "AAE": "Measurement"
            "PD": "Physical dimensions (product ordered)"
        },
        "6313": DocInfoBase.MeasurementDimension02
    };
    static usage_SG28_QTY = {
        "6063": {
            "21": "Ordered quantity",
            // "53": "Minimum order quantity",
            // "54": "Maximum order quantity",
            // "163": "Component quantity"
            "52": "Quantity per pack",
            "59": "Number of consumer units in the traded unit",
            "192": "Free goods quantity"
        },
    };
    // static usage_SG28_ALI = {
    //     "4183": {
    //         "94": "Service",
    //     },
    // };
    static usage_SG28_DTM = {
        "2005": {
            "2": "Delivery date/time, requested",
            "10": "Shipment date/time, requested",
            // "169": "Lead time (only used with 2379=804)",
            // "318": "Request date"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_SG28_MOA = {
        "5025": {
            // "146": "Unit price",
            // "173": "Minimum amount",
            "176": "Message total duty/tax/fee amount",
            // "179": "Maximum amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "9": "Order currency"
        }
    };

    static usage_SG28_FTX = {
        "4451": {
            "PUR": "General comment",
            "AAI": "General information",
            "DEL": "Terms of delivery information",
            "DIN": "Transport terms information",
            "ORI": "Order instruction",
            "PMT": "Method of shipping payment information",
            "QQD": "Quality demands/requirements",
            "SIN": "Special instructions",
            "TRA": "Transportation information",
            "TXD": "Tax declaration",

            // "AAK": "Price conditions",
            // "AAR": "Terms of delivery",
            // "ACB": "Additional information",
            // "ACL": "Quality statement",
            // "PRD": "Product information",
            // "TDT": "Transport details remarks",
            // "TXD": "Tax declaration",
            // "ZZZ": "Mutually defined"
        },
        "4440": {
            "yes": "",
            "no": "",
        },

        // "4441": {
        //     "SPM": "Shipping payment methods",
        //     "TDC": "Terms of delivery",
        //     "TTC": "Transport terms"
        // },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG28_SG38_PRI = {
        "5125": {
            // "CAL": "Calculation price"
            "AAA": "Calculation net",
            "AAE": "Information price, excluding allowances or charges, including taxes"
        },
        // "5387": {
        //     "PBQ": "Unit price beginning quantity"
        // }
    };

    // static usage_SG28_SG28_APR = {
    //     "4043": {
    //         "WS": "User"
    //     },
    //     "5393": {
    //         "CSD": "Cost markup multiplier - original cost"
    //     }
    // };

    // static usage_SG28_SG28_RNG = {
    //     "6167": {
    //         "4": "Quantity range"
    //     },
    // };
    static usage_SG28_SG33_RFF = {
        "1153": {
            "ALQ": "Returns notice number",
            "CT": "Agreement number",
            "FI": "File line identifier",
            "PD": "Promotion deal number",
            "VA": "VAT registration number"
        }
    };
    static usage_SG28_SG33_DTM = {
        "2005": {
            // "126": "Agreement date",
            "131": "Tax point date/time",
            "140": "Payment due date/time",
            "171": "Reference date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_SG28_SG34_PAC = {
        "7224": {
            // "0": "",
            "1": ""
        },
        "7075": {
            "1": "Inner",
            "2": "Intermediate",
            "3": "Outer"
        },
        // "7077": {
        //     "A": "Free-form long description"
        // },
        // "7143": {
        //     "ZZZ": "Mutually defined"
        // },

    };

    // static usage_SG28_SG34_MEA = {
    //     "6311": {
    //         "AAE": "Measurement"
    //     },
    //     "6313": DocInfoBase.MeasurementDimension
    // };

    // static usage_SG28_SG34_QTY = {
    //     "6063": {
    //         "12": "Despatch quantity",
    //         "21": "Ordered/Batch quantity",
    //         "192": "Free goods quantity"
    //     }
    // }

    // static usage_SG28_SG34_SG31_RFF = {
    //     "1153": {
    //         "AAS": "Transport document number",
    //         "BT": "Batch number/lot number"
    //     },
    // };
    static usage_SG28_SG34_SG36_PCI = {
        "4233": {
            "16": "Buyer's instructions",
            // "10": "Mark batch number",
            // "30": "Mark serial shipping container code"
        },
    };
    static usage_SG28_SG34_SG36_GIN = {
        "7405": {
            "BJ": "Serial shipping container code"
            // "AW": "Serial shipping container code",
            // "BX": "Batch number"
        },
        // "7402": {
        //     "91": "Assigned by seller or seller's agent",
        //     "92": "Assigned by buyer or buyer's agent"
        // }
    };

    // static usage_SG28_SG34_DTM = {
    //     "2005": {
    //         "36": "Expiry date",
    //         "94": "Production/manufacture date",
    //         "351": "Inspection date"
    //     },
    //     "2379": DocInfoBase.TimeFormatQualifier
    // };
    static usage_SG28_SG38_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax"
        },
        "5153": {
            // "FRE": "Free",
            "GST": "Goods and services tax",
            // "LOC": "Local sales taxes",
            "OTH": "Other taxes",
            "VAT": "Value added tax"
        },
        "5289": {
            "TT": "Triangular Transaction",
        },
        "5305": {
            "A": "Mixed tax rate",
            "E": "Exempt from tax",
            "S": "Standard rate",
            "Z": "Zero rated goods"
        }
    }

    static usage_SG28_SG38_MOA = {
        "5025": {
            "124": "Tax amount",
            "125": "Taxable amount"
        },
        "6345": DocInfoBase.CurrencyList
    }
    static usage_SG28_SG39_NAD = {
        "3035": DocInfoBase.PartyQualifier02,
        // "3055": DocInfoBase.ResponsibleAgency
        "3055": {
            "9": "EAN (International Article Numbering association)"
        }
    }
    // static usage_SG28_SG39_SG36_RFF = {
    //     "1153": DocInfoBase.ReferenceQualifier02,
    // }
    static usage_SG28_SG39_SG42_CTA = {
        // "3139": DocInfoBase.ContactFunction02,
        "3139": {
            "IC": "Information contact",
            "PD": "Purchaser contact (only used if NAD/3035=BY)"
        }
    }
    static usage_SG28_SG39_SG42_COM = {
        "3155": DocInfoBase.CommuChannelQualifier02,
    }
    static usage_SG28_SG43_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge",
            // "N": "No allowance or charge"
        },
        // "7161": DocInfoBase.SpecialServices02,
        "7161": {
            "AJ":"Adjustments",
            "HD":"Handling",
            "FC": "Freight charge"
        },
        // "1131": {
        //     "175": "Account analysis codes"
        // },
        // "3055": {
        //     "92": "Assigned by buyer or buyer's agent"
        // }
    }

    static usage_SG28_SG43_SG46_MOA = {
        "5025": {
            // "4": "Deducted price",
            "8": "Allowance or charge amount",
            "23": "Charge amount",
            // "54": "Distribution amount",
            "98": "Original price",
            "296":"Deducted price"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            // "7": "Target currency",
            "9": "Order currency",
            "11": "Payment currency"
        }
    }

    static usage_SG28_SG43_DTM = {
        "2005": {
            "194": "Start date/time",
            "206": "End date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_SG28_SG43_SG45_PCD = {
        "5245": {
            "3": "Allowance or charge"
        },
        "5249":{
            "13":"Invoice value"
        }
    }


    static usage_SG28_SG49_TDT = {
        "8051": {
            "20": "Main-carriage transport"
        },
        "8067": {
            "10": "Maritime transport",
            "20": "Rail transport",
            "30": "Road transport",
            "40": "Air transport"
        },
        "8457": {
            "ZZZ": "Mutually defined"
        },
        "8459": {
            "ZZZ": "Mutually defined"
        }
    };

    static usage_MOA = {
        "5025": {
            "86":"Total amount inclusive tax",
            "124": "Tax amount",
            "128": "Total amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            // "7": "Target currency",
            "9": "Order currency",
            "11":"Payment currency"
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

    static comment_SG2_NAD = {
        "3035": DocInfoBase.codelists3035,
        "3207": DocInfoBase.codelists3207,
    }

    static comment_SG2_SG3_RFF = {
        "1153": DocInfoBase.codelists1153,
    }

    static comment_SG6_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG7_CUX = {
        "6345": DocInfoBase.codelists6345
    }

    static comment_SG8_SG9_MOA = {
        "6345":DocInfoBase.codelists6345
    }

    static comment_SG12_TOD = {
        "4215": DocInfoBase.codelists4215,
    }

    static comment_SG19_SG22_MOA = {
        "6345":DocInfoBase.codelists6345
    }
    static comment_SG28_MEA = {
        "6411": DocInfoBase.codelists6411,
    }
    static comment_SG28_QTY = {
        "6411": DocInfoBase.codelists6411,
    }
    static comment_SG28_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG28_SG32_PRI = {
        "6411": DocInfoBase.codelists6411,
    }
    static comment_SG28_SG38_MOA = {
        "6345": DocInfoBase.codelists6345
    }

    // static comment_SG19_DTM = {
    //     "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
    //         + `Code 304 is recommended. Please refer for special requirements and time zone usage`
    //         + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
    //         + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    // }
    // static comment_SG28_DTM = {
    //     "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
    //         + `Code 304 is recommended. Please refer for special requirements and time zone usage`
    //         + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
    //         + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    // }
    // static comment_SG28_SG33_DTM = {
    //     "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
    //         + `Code 304 is recommended. Please refer for special requirements and time zone usage`
    //         + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
    //         + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    // }
    // static comment_SG28_SG34_DTM = {
    //     "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
    //         + `Code 304 is recommended. Please refer for special requirements and time zone usage`
    //         + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
    //         + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    // }

    static comment_SG28_SG39_NAD = {
        "3035": DocInfoBase.codelists3035,
        "3207": DocInfoBase.codelists3207,
    }

    static comment_SG28_SG43_SG46_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_MOA = {
        "6345": DocInfoBase.codelists6345
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGM":
                return Info_ORDERS.usage_BGM[ele.getSchemaId()]
                break;
            case "ROOT_DTM":
                return Info_ORDERS.usage_DTM[ele.getSchemaId()]
                break;
            case "ROOT_FTX":
                return Info_ORDERS.usage_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG1_RFF":
                return Info_ORDERS.usage_SG1_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_ORDERS.usage_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG2_NAD":
                return Info_ORDERS.usage_SG2_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_RFF":
                return Info_ORDERS.usage_SG2_SG3_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG5_CTA":
                return Info_ORDERS.usage_SG2_SG5_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG5_COM":
                return Info_ORDERS.usage_SG2_SG5_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG6_TAX":
                return Info_ORDERS.usage_SG6_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG6_MOA":
                return Info_ORDERS.usage_SG6_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG7_CUX":
                return Info_ORDERS.usage_SG7_CUX[ele.getSchemaId()]
                break;
            case "ROOT_SG8_PAT":
                return Info_ORDERS.usage_SG8_PAT[ele.getSchemaId()]
                break;
            case "ROOT_SG8_PCD":
                return Info_ORDERS.usage_SG8_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG8_SG9_MOA":
                return Info_ORDERS.usage_SG8_SG9_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_TDT":
                return Info_ORDERS.usage_SG10_TDT[ele.getSchemaId()]
                break;
            case "ROOT_SG12_TOD":
                return Info_ORDERS.usage_SG12_TOD[ele.getSchemaId()]
                break;
            case "ROOT_SG19_ALC":
                return Info_ORDERS.usage_SG19_ALC[ele.getSchemaId()]
                break;
            case "ROOT_SG19_SG22_MOA":
                return Info_ORDERS.usage_SG19_SG22_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG19_DTM":
                return Info_ORDERS.usage_SG19_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG19_SG21_PCD":
                return Info_ORDERS.usage_SG19_SG21_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG28_LIN":
                return Info_ORDERS.usage_SG28_LIN[ele.getSchemaId()]
                break;
            case "ROOT_SG28_PIA":
                return Info_ORDERS.usage_SG28_PIA[ele.getSchemaId()]
                break;
            case "ROOT_SG28_IMD":
                return Info_ORDERS.usage_SG28_IMD[ele.getSchemaId()]
                break;
            case "ROOT_SG28_MEA":
                return Info_ORDERS.usage_SG28_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG28_QTY":
                return Info_ORDERS.usage_SG28_QTY[ele.getSchemaId()]
                break;
            // case "ROOT_SG28_ALI":
            //     return Info_ORDERS.usage_SG28_ALI[ele.getSchemaId()]
            //     break;
            case "ROOT_SG28_DTM":
                return Info_ORDERS.usage_SG28_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG28_MOA":
                return Info_ORDERS.usage_SG28_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG28_FTX":
                return Info_ORDERS.usage_SG28_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG38_PRI":
                return Info_ORDERS.usage_SG28_SG38_PRI[ele.getSchemaId()]
                break;
            // case "ROOT_SG28_SG28_APR":
            //     return Info_ORDERS.usage_SG28_SG28_APR[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG28_SG28_RNG":
            //     return Info_ORDERS.usage_SG28_SG28_RNG[ele.getSchemaId()]
            //     break;
            case "ROOT_SG28_SG33_RFF":
                return Info_ORDERS.usage_SG28_SG33_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG33_DTM":
                return Info_ORDERS.usage_SG28_SG33_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG34_PAC":
                return Info_ORDERS.usage_SG28_SG34_PAC[ele.getSchemaId()]
                break;
            // case "ROOT_SG28_SG34_MEA":
            //     return Info_ORDERS.usage_SG28_SG34_MEA[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG28_SG34_QTY":
            //     return Info_ORDERS.usage_SG28_SG34_QTY[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG28_SG34_SG31_RFF":
            //     return Info_ORDERS.usage_SG28_SG34_SG31_RFF[ele.getSchemaId()]
            //     break;
            case "ROOT_SG28_SG34_SG36_PCI":
                return Info_ORDERS.usage_SG28_SG34_SG36_PCI[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG34_SG36_GIN":
                return Info_ORDERS.usage_SG28_SG34_SG36_GIN[ele.getSchemaId()]
                break;
            // case "ROOT_SG28_SG34_DTM":
            //     return Info_ORDERS.usage_SG28_SG34_DTM[ele.getSchemaId()]
            //     break;
            case "ROOT_SG28_SG38_TAX":
                return Info_ORDERS.usage_SG28_SG38_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG38_MOA":
                return Info_ORDERS.usage_SG28_SG38_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG39_NAD":
                return Info_ORDERS.usage_SG28_SG39_NAD[ele.getSchemaId()]
                break;
            // case "ROOT_SG28_SG39_SG36_RFF":
            //     return Info_ORDERS.usage_SG28_SG39_SG36_RFF[ele.getSchemaId()]
            //     break;
            case "ROOT_SG28_SG39_SG42_CTA":
                return Info_ORDERS.usage_SG28_SG39_SG42_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG39_SG42_COM":
                return Info_ORDERS.usage_SG28_SG39_SG42_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG43_ALC":
                return Info_ORDERS.usage_SG28_SG43_ALC[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG43_SG46_MOA":
                return Info_ORDERS.usage_SG28_SG43_SG46_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG43_DTM":
                return Info_ORDERS.usage_SG28_SG43_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG43_SG45_PCD":
                return Info_ORDERS.usage_SG28_SG43_SG45_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG49_TDT":
                return Info_ORDERS.usage_SG28_SG49_TDT[ele.getSchemaId()]
                break;
            // case "ROOT_SG28_SG47_TOD":
            //     return Info_ORDERS.usage_SG28_SG47_TOD[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG28_SG49_SCC":
            //     return Info_ORDERS.usage_SG28_SG49_SCC[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG28_SG49_RFF":
            //     return Info_ORDERS.usage_SG28_SG49_RFF[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG28_SG49_SG50_QTY":
            //     return Info_ORDERS.usage_SG28_SG49_SG50_QTY[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG28_SG49_SG50_DTM":
            //     return Info_ORDERS.usage_SG28_SG49_SG50_DTM[ele.getSchemaId()]
            //     break;
            case "ROOT_MOA":
                return Info_ORDERS.usage_MOA[ele.getSchemaId()]
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
            //     return Info_ORDERS.comment_DTM[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG1_DTM":
            //     return Info_ORDERS.comment_SG1_DTM[ele.getSchemaId()]
            //     break;
            case "ROOT_SG2_NAD":
                return Info_ORDERS.comment_SG2_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_RFF":
                return Info_ORDERS.comment_SG2_SG3_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG6_MOA":
                return Info_ORDERS.comment_SG6_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG7_CUX":
                return Info_ORDERS.comment_SG7_CUX[ele.getSchemaId()]
                break;
            case "ROOT_SG8_SG9_MOA":
                return Info_ORDERS.comment_SG8_SG9_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG12_TOD":
                return Info_ORDERS.comment_SG12_TOD[ele.getSchemaId()]
                break;
            case "ROOT_SG19_SG22_MOA":
                return Info_ORDERS.comment_SG19_SG22_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG28_MEA":
                return Info_ORDERS.comment_SG28_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG28_QTY":
                return Info_ORDERS.comment_SG28_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG28_MOA":
                return Info_ORDERS.comment_SG28_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG32_PRI":
                return Info_ORDERS.comment_SG28_SG32_PRI[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG38_MOA":
                return Info_ORDERS.comment_SG28_SG38_MOA[ele.getSchemaId()]
                break;


            // case "ROOT_SG19_DTM":
            //     return Info_ORDERS.comment_SG19_DTM[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG28_DTM":
            //     return Info_ORDERS.comment_SG28_DTM[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG28_SG33_DTM":
            //     return Info_ORDERS.comment_SG28_SG33_DTM[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG28_SG34_DTM":
            //     return Info_ORDERS.comment_SG28_SG34_DTM[ele.getSchemaId()]
            //     break;
            case "ROOT_SG28_SG39_NAD":
                return Info_ORDERS.comment_SG28_SG39_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG28_SG43_SG46_MOA":
                return Info_ORDERS.comment_SG28_SG43_SG46_MOA[ele.getSchemaId()]
                break;
            case "ROOT_MOA":
                return Info_ORDERS.comment_MOA[ele.getSchemaId()]
                break;
            // case "ROOT_SG28_SG43_DTM":
            //     return Info_ORDERS.comment_SG28_SG43_DTM[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG28_SG47_TOD":
            //     return Info_ORDERS.comment_SG28_SG47_TOD[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG28_SG49_SG50_DTM":
            //     return Info_ORDERS.comment_SG28_SG49_SG50_DTM[ele.getSchemaId()]
            //     break;
            default:

        }
        return undefined;
    }
}