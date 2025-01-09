import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";

export class Info_850_SalesOrder extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BEG = {
        "01": {
            "00": "Original",
            "01": "Delete",
            "05": "Replace",
        },
        "02": {
            "NE": "New Order"
        }
    };
    static usage_CUR = {
        "01": {
            "BY": "Buying Party (Purchaser)",
            "SE": "Selling Party"
        },
        "02": DocInfoBase.CurrencyList,
        // "04": {
        //     "SE": "Selling Party"
        // },
        // "05": DocInfoBase.CurrencyList,
    };
    static usage_REF = {
        "01": {
            "86": "Allowed Operation",
            "8X": "Channel Type",
            "ZZ": "Mutually Defined"
        },
        "0401": {
            "RPP": "Relative Priority"
        }
    };
    // static usage_FOB = {
    //     "02": {
    //         "DE": "Destination (Shipping)",
    //         "OF": "Other Unlisted Free On Board (FOB) Point",
    //         "OR": "Origin (Shipping Point)",
    //         "ZZ": "Mutually Defined"
    //     },
    //     "04": {
    //         "ZZ": "Transport Terms"
    //     },
    //     "05": DocInfoBase.TransportationTermsCodeList,
    //     "06": {
    //         "ZZ": "Shipping Payment Method"
    //     }
    // };
    // static usage_CSH = {
    //     "01": {
    //         'SC': "Ship Complete",
    //     }
    // };
    // static usage_SAC_SAC = {
    //     "01": {
    //         "A": "Allowance",
    //         'C': "Charge",
    //         'N': "No Allowance or Charge",
    //     },
    //     "02": {
    //         'G830': "Shipping and Handling",
    //         'F050': "Other",
    //     },
    //     "03": {
    //         'ZZ': "Mutually Defined",
    //     },
    //     "06": {
    //         "6": "Base Price Amount"
    //     },
    //     "14": {

    //         "1": "Used if SAC05 value is amount",
    //         "2": "Used if SAC05 value is price"
    //     },
    //     "16": DocInfoBase.LanguageList
    // };

    // static usage_SAC_CUR = {
    //     "01": {
    //         "BY": "Buying Party (Purchaser)",
    //     },
    //     "02": DocInfoBase.CurrencyList,
    //     "04": {
    //         "SE": "Selling Party",
    //     },
    //     "05": DocInfoBase.CurrencyList,
    //     "07": {
    //         "196": "Start"
    //     },
    //     "10": {
    //         "197": "End"
    //     },
    // };

    // static usage_ITD = {
    //     "01": {
    //         "05": "Discount Not Applicable",
    //         "52": "Discount with Prompt Pay",
    //     },
    //     "02": {
    //         "3": "Invoice Date"
    //     }
    // };
    // static usage_DTM = {
    //     "01": {
    //         "002": "Delivery Requested",
    //         "004": "Purchase Order",
    //         "007": "Effective",
    //         "036": "Expiration",
    //         "070": "Scheduled for Delivery (After and Including)",
    //         "073": "Scheduled for Delivery (Prior to and Including)",
    //         "118": "Requested Pick-up",
    //         "171": "Revision"
    //     }
    // };
    // static usage_PID = {
    //     "01": {
    //         "F": "Free-form",
    //     },
    //     "02": {
    //         "93": "Shipping Instructions",
    //     },
    //     "09": DocInfoBase.LanguageList
    // };
    // static usage_TXI = {
    //     "01": {
    //         "GS": "Goods and Services Tax",
    //         "ST": "State Sales Tax",
    //         "TX": "All Taxes",
    //         "VA": "Value Added Tax",
    //         "ZZ": "Mutually Defined"
    //     },
    //     "04": {
    //         "CD": "Customer defined"
    //     },
    //     "06": {
    //         "0": "Exempt (For Export)",
    //         "2": "No (Not Tax Exempt)"
    //     }
    // };
    static usage_N9_N9 = {
        "01": {
            // "PSM": "Credit Card",
            // "0L": "Referenced By",
            // "U2": "Terms and Condition",
            // "43": "External Document",
            "L1": "Letters or Notes",
            // "URL": "Uniform Resource Locator",
            // "KD": "Control Key/Special Instruction",
            // "ZZ": "Mutually Defined"
        },
        "02": DocInfoBase.LanguageList,
        "0701": {
            "L1": "Letters or Notes"
        }
    };
    // static usage_N9_DTM = {
    //     "01": {
    //         "036": "Expiration",
    //     },
    //     "05": {
    //         "UN": "Unstructured"
    //     }
    // };
    static usage_N9_MSG = {
        "02": {
            "LC": "Line Continuation",
        }
    };
    static usage_N1_N1 = {
        "01": {
            "ST": "Ship To",
            "SU": "Supplier",
            // "ZZ": "Mutually Defined"
        },
        "03": DocInfoBase.IdentificationCodeQualifierList05
    };

    static usage_N1_N4 = {
        "05": {
            "SP": "State/Province",
        }
    };
    static usage_N1_REF = {
        "01": {
            "ME": "Additional Postal Address Information",
        }
    };

    static usage_N1_PER = {
        "01": {
            // "AP": "Accounts Payable Department",
            "CN": "General Contact",
            // "RE": "Receiving Contact"
        },
        "03": DocInfoBase.CommuNumberQualifierList,
        "05": DocInfoBase.CommuNumberQualifierList,
        "07": DocInfoBase.CommuNumberQualifierList,
    };

    // static usage_N1_TD5 = {
    //     "01": {
    //         "Z": "Mutually Defined",
    //     },
    //     "02": {
    //         "ZZ": "Shipping Contract Number",
    //     },
    //     "04": {
    //         "A": "Air",
    //         "J": "Motor",
    //         "R": "Rail",
    //         "S": "Ocean"
    //     },
    //     "07": {
    //         "ZZ": "Shipping Instructions"
    //     }
    // };

    // static usage_N1_TD4 = {
    //     "01": {
    //         "ZZZ": "Mutually Defined",
    //     }
    // };
    static usage_PO1_PO1 = {
        "06": DocInfoBase.ProductServiceIdQualifierList07,
        "08": DocInfoBase.ProductServiceIdQualifierList07,
        "10": DocInfoBase.ProductServiceIdQualifierList07,
        "12": DocInfoBase.ProductServiceIdQualifierList07,
        "14": DocInfoBase.ProductServiceIdQualifierList07,
        "16": DocInfoBase.ProductServiceIdQualifierList07,
    };

    static usage_PO1_CUR = {
        "01": {
            "BY": "Buying Party (Purchaser)",
            "SE": "Selling Party"
        },
        "02": DocInfoBase.CurrencyList,

    };

    // static usage_PO1_PO3 = {
    //     "01": {
    //         "ZZ": "Mutually Defined",
    //     },
    //     "05": {
    //         "ST": "Standard"
    //     }
    // };

    // static usage_PO1_CTP_CTP = {
    //     "01": {
    //         "PY": "Private Label",
    //         "WS": "User",
    //         "TR": "General Trade"
    //     },
    //     "02": {
    //         "MAX": "Maximum Order Quantity Price",
    //         "MIN": "Minimum Order Quantity Price",
    //         "UPC": "Unit Cost Price"
    //     },
    //     "06": {
    //         "CSD": "Cost Markup Multiplier - Original Cost"
    //     }
    // };

    // static usage_PO1_CTP_CUR = {
    //     "01": {
    //         "BY": "Buying Party (Purchaser)"
    //     },
    //     "02": DocInfoBase.CurrencyList,
    //     "04": {
    //         "SE": "Selling Party"
    //     },
    //     "05": DocInfoBase.CurrencyList,
    // };
    // static usage_PO1_MEA = {
    //     "01": {
    //         "PD": "Physical Dimensions",
    //     },
    //     "02": DocInfoBase.MeasurementQualifierList
    // };
    static usage_PO1_PID_PID = {
        "01": {
            "F": "Free-form",
            // "S": "Structured (From Industry Code List)"
        },
        // "02": {
        //     "12": "Type and/or Process",
        //     "21": "Forming",
        //     "93": "Shipping Instructions",
        //     "GEN": "General Description",
        //     "MAC": "Material Classification"
        // },
        // "03": {
        //     "UN": "United Nations (UN)",
        //     "AS": "Assigned by Seller"
        // },
        "09": DocInfoBase.LanguageList
    };

    static usage_PO1_REF = {
        "01": {
            // "0L": "Referenced By (specific Usage)",
            // "18": "Planning Type",
            // "2I": "Tracking Number",
            // "AH": "Agreement Number",
            "BT": "Supplier Batch Number",
            // "CO": "Customer Order Number",
            // "CT": "Agreement Line Item Number",
            // "FL": "Fine Line Classification",
            "KQ": "Item Category",
            // "LT": "Buyer Batch Number",
            // "IP": "Inspection Days",
            // "S1": "Engineering Specification Number",
            // "SE": "Serial Number",
            // "QJ": "Return Material Authorization Number",
            // "RQ": "Purchase Requisition Number",
            // "ZA": "Supplier Number",
            "ACC": "Status",
            "ZZ": "Mutually Defined"
        }
    };

    // static usage_PO1_SAC_SAC = {
    //     "01": {
    //         "A": "Allowance",
    //         'C': "Charge",
    //         'N': "No Allowance or Charge",
    //     },
    //     "02": {
    //         'G830': "Shipping and Handling",
    //         "B840": "Customer Account Identification",
    //         'F050': "Other",
    //     },
    //     "03": {
    //         'ZZ': "Mutually Defined",
    //     },
    //     "06": {
    //         "6": "Base Price Amount"
    //     },
    //     "14": {

    //         "1": "Used if SAC05 value is amount",
    //         "2": "Used if SAC05 value is price"
    //     },
    //     "16": DocInfoBase.LanguageList
    // };

    // static usage_PO1_SAC_CUR = {
    //     "01": {
    //         "BY": "Buying Party (Purchaser)",
    //     },
    //     "02": DocInfoBase.CurrencyList,
    //     "04": {
    //         "SE": "Selling Party",
    //     },
    //     "05": DocInfoBase.CurrencyList,
    //     "07": {
    //         "196": "Start"
    //     },
    //     "10": {
    //         "197": "End"
    //     },
    // };

    // static usage_PO1_FOB = {
    //     "02": {
    //         // "DE": "Destination (Shipping)",
    //         "OF": "Other Unlisted Free On Board (FOB) Point",
    //         // "OR": "Origin (Shipping Point)",
    //         "ZZ": "Mutually Defined"
    //     },
    //     "04": {
    //         // "ZZ": "Transport Terms",
    //         "01": "Incoterms"
    //     },
    //     "05": DocInfoBase.TransportationTermsCodeList,
    //     "06": {
    //         "ZZ": "Shipping Payment Method"
    //     }
    // };
    // static usage_PO1_SDQ = {
    //     "02": {
    //         "54": "Warehouse",
    //     }
    // };
    static usage_PO1_DTM = {
        "01": {
            "002": "Delivery Requested",
            "010": "Requested Ship",
            "017": "Estimated Delivery",
            "069": "Promised for Delivery",
            "079": "Promised for Shipment",
            "193": "Period Start",
            "194": "Period End"
        }
    };

    // static usage_PO1_TXI = {
    //     "01": {
    //         "GS": "Goods and Services Tax",
    //         "ST": "State Sales Tax",
    //         "TX": "All Taxes",
    //         "VA": "Value Added Tax",
    //         "ZZ": "Mutually Defined"
    //     },
    //     "04": {
    //         "CD": "Customer defined"
    //     },
    //     "06": {
    //         "0": "Exempt (For Export)",
    //         "2": "No (Not Tax Exempt)"
    //     }
    // };

    static usage_PO1_QTY_QTY = {
        "01": {
            "27": "Promised quantity",
            "40": "Open quantity"
        }
    };
    static usage_PO1_SCH_SCH = {
        "03": {
            "ST": "Ship To",
        },
        "05": {
            "002": "Delivery Requested"
        },
        "08": {
            "010": "Requested Ship"
        }
    };

    static usage_PO1_SCH_REF = {
        "01": {
            "ZZ": "Mutually Defined",
        }
    };
    // static usage_PO1_PKG_PKG = {
    //     "01": {
    //         "F": "Free-form",
    //     },
    //     "02": {
    //         "01": "Casing Type"
    //     },
    //     "03": {
    //         "ZZ": "Mutually Defined"
    //     }
    // };

    // static usage_PO1_PKG_MEA = {
    //     "01": {
    //         "PD": "Physical Dimensions",
    //     },
    //     "02": DocInfoBase.MeasurementQualifierList
    // };

    // static usage_PO1_N9_N9 = {
    //     "01": {
    //         "0L": "Referenced By",
    //         "ACC": "Status",
    //         "ACE": "Service Request Number",
    //         "BT": "Batch Number",
    //         "H6": "Quality Clause",
    //         "KD": "Control Key/Special Instruction",
    //         "L1": "Letters or Notes",
    //         "LS": "Bar-Coded Serial Number",
    //         "PRT": "Product Type",
    //         "SE": "Serial Number",
    //         "SU": "Special Processing Code",
    //         "URL": "Uniform Resource Locator",
    //         "ZZ": "Mutually Defined"
    //     },
    //     "02": DocInfoBase.LanguageList,
    //     "0701": {
    //         "H6": "Quality Clause",
    //         "L1": "Letters or Notes",
    //         "LI": "Line Item Identifier (Seller's)"
    //     },
    //     "0703": {
    //         "72": "Schedule Reference Number"
    //     }
    // };

    // static usage_PO1_N9_MSG = {
    //     "02": {
    //         "LC": "Line Continuation"
    //     }
    // }

    static usage_PO1_N1_N1 = {
        "01": {
            "ST": "Ship To",
            "SU": "Supplier",
        },
        "03": DocInfoBase.IdentificationCodeQualifierList05
    };

    static usage_PO1_N1_N4 = {
        "05": {
            "SP": "State/Province",
        }
    };

    static usage_PO1_N1_REF = {
        "01": {
            "ME": "Additional Postal Address Information",
        }
    };

    static usage_PO1_N1_PER = {
        "01": {
            // "AP": "Accounts Payable Department",
            "CN": "General Contact",
            // "RE": "Receiving Contact"
        },
        "03": DocInfoBase.CommuNumberQualifierList,
        "05": DocInfoBase.CommuNumberQualifierList,
        "07": DocInfoBase.CommuNumberQualifierList,
    };

    // static usage_PO1_N1_TD5 = {
    //     "01": {
    //         "Z": "Mutually Defined",
    //     },
    //     "02": {
    //         "ZZ": "Shipping Contract Number",
    //     },
    //     "04": {
    //         "A": "Air",
    //         "J": "Motor",
    //         "R": "Rail",
    //         "S": "Ocean"
    //     },
    //     "07": {
    //         "ZZ": "Shipping Instructions"
    //     }
    // };

    // static usage_PO1_N1_TD4 = {
    //     "01": {
    //         "ZZZ": "Mutually Defined",
    //     }
    // };
    static usage_PO1_SLN_SLN = {
        "03": {
            "O": "Information Only",
        },
        "09": DocInfoBase.ProductServiceIdQualifierList08,
        "11": DocInfoBase.ProductServiceIdQualifierList08,
        "13": DocInfoBase.ProductServiceIdQualifierList08,
        "15": DocInfoBase.ProductServiceIdQualifierList08,
        "17": DocInfoBase.ProductServiceIdQualifierList08,
    };

    static usage_PO1_SLN_DTM = {
        "01": {
            "106": "Required By",
        }
    };
    // static usage_PO1_SLN_N9_N9 = {
    //     "01": {
    //         "BT": "Supplier Batch Number",
    //         "LT": "Buyer Batch Number",
    //         "4C": "Storage Location",
    //         "SU": "Special Processing Code"
    //     }
    // };
    // static usage_CTT = {
    //     "01": {
    //         "TT": "Total Transaction Amount",
    //     }
    // };

    static comment_N1_N4 = {
        "02": `**Party state or province code**\n\nFor addresses in the United States or Canada, `
            + `use the two letter digraph recognized by the United States Postal Service or Canada Post. `
            + `Please refer to APPENDIX - [CODELISTS 156 State or Province Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(156)})`,
        "04": `**Party country code**\n\nIdentification of the name of the country or other geographical entity, `
            + `use ISO 3166 two alpha country code. Please refer to APPENDIX - [CODELISTS 26 Country Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(26)})`,
        "06": `**Party state or province code**\n\nFor addresses except in the United States or Canada.`
    }

    static comment_PO1_PO1 = {
        "03": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_PO1_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_PO1_SCH_SCH = {
        "02": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_PO1_N1_N4 = {
        "02": `**Party state or province code**\n\nFor addresses in the United States or Canada, `
            + `use the two letter digraph recognized by the United States Postal Service or Canada Post. `
            + `Please refer to APPENDIX - [CODELISTS 156 State or Province Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(156)})`,
        "04": `**Party country code**\n\nIdentification of the name of the country or other geographical entity, `
            + `use ISO 3166 two alpha country code. Please refer to APPENDIX - [CODELISTS 26 Country Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(26)})`,
        "06": `**Party state or province code**\n\nFor addresses except in the United States or Canada.`
    }

    static comment_PO1_SLN_SLN = {
        "0501": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_PO1_SLN_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGN":
                return Info_850_SalesOrder.usage_BEG[ele.designatorIndex]
                break;
            case "ROOT_CUR":
                return Info_850_SalesOrder.usage_CUR[ele.designatorIndex]
                break;
            case "ROOT_REF":
                return Info_850_SalesOrder.usage_REF[ele.designatorIndex]
                break;

            case "ROOT_N9_N9":
                return Info_850_SalesOrder.usage_N9_N9[ele.designatorIndex]
                break;

            case "ROOT_N9_MSG":
                return Info_850_SalesOrder.usage_N9_MSG[ele.designatorIndex]
                break;
            case "ROOT_N1_N1":
                return Info_850_SalesOrder.usage_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_N1_N4":
                return Info_850_SalesOrder.usage_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_N1_REF":
                return Info_850_SalesOrder.usage_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_N1_PER":
                return Info_850_SalesOrder.usage_N1_PER[ele.designatorIndex]
                break;

            case "ROOT_PO1_PO1":
                return Info_850_SalesOrder.usage_PO1_PO1[ele.designatorIndex]
                break;
            case "ROOT_PO1_CUR":
                return Info_850_SalesOrder.usage_PO1_CUR[ele.designatorIndex]
                break;


            case "ROOT_PO1_PID_PID":
                return Info_850_SalesOrder.usage_PO1_PID_PID[ele.designatorIndex]
                break;
            case "ROOT_PO1_REF":
                return Info_850_SalesOrder.usage_PO1_REF[ele.designatorIndex]
                break;

            case "ROOT_PO1_DTM":
                return Info_850_SalesOrder.usage_PO1_DTM[ele.designatorIndex]
                break;

            case "ROOT_PO1_QTY_QTY":
                return Info_850_SalesOrder.usage_PO1_QTY_QTY[ele.designatorIndex]
                break;
            case "ROOT_PO1_SCH_SCH":
                return Info_850_SalesOrder.usage_PO1_SCH_SCH[ele.designatorIndex]
                break;
            case "ROOT_PO1_SCH_REF":
                return Info_850_SalesOrder.usage_PO1_SCH_REF[ele.designatorIndex]
                break;

            case "ROOT_PO1_N1_N1":
                return Info_850_SalesOrder.usage_PO1_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_PO1_N1_N4":
                return Info_850_SalesOrder.usage_PO1_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_PO1_N1_REF":
                return Info_850_SalesOrder.usage_PO1_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_PO1_N1_PER":
                return Info_850_SalesOrder.usage_PO1_N1_PER[ele.designatorIndex]
                break;

            case "ROOT_PO1_SLN_SLN":
                return Info_850_SalesOrder.usage_PO1_SLN_SLN[ele.designatorIndex]
                break;
            case "ROOT_PO1_SLN_DTM":
                return Info_850_SalesOrder.usage_PO1_SLN_DTM[ele.designatorIndex]
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
            case "ROOT_N1_N4":
                return Info_850_SalesOrder.comment_N1_N4[ele.designatorIndex];
                break;
            case "ROOT_PO1_PO1":
                return Info_850_SalesOrder.comment_PO1_PO1[ele.designatorIndex];
                break;
            case "ROOT_PO1_DTM":
                return Info_850_SalesOrder.comment_PO1_DTM[ele.designatorIndex];
                break;
            case "ROOT_PO1_SCH_SCH":
                return Info_850_SalesOrder.comment_PO1_SCH_SCH[ele.designatorIndex];
                break;
            case "ROOT_PO1_N1_N4":
                return Info_850_SalesOrder.comment_PO1_N1_N4[ele.designatorIndex];
                break;
            case "ROOT_PO1_SLN_SLN":
                return Info_850_SalesOrder.comment_PO1_SLN_SLN[ele.designatorIndex];
                break;
            case "ROOT_PO1_SLN_DTM":
                return Info_850_SalesOrder.comment_PO1_SLN_DTM[ele.designatorIndex];
                break;
            default:

        }
        return undefined;
    }
}