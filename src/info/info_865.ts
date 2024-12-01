import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_865 extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BAK = {
        "01": {
            "00": "Original",
            "05": "Replace"
        },
        "02": {
            "AC": "Acknowledge - With Detail and Change",
            "AE": "Acknowledge - With Exception Detail Only",
            "AT": "Accepted",
            "RJ": "Rejected - No Detail"
        }
    };
    static usage_CUR = {
        "01": {
            "BY": "Buying Party (Purchaser)",
        },
        "02": DocInfoBase.CurrencyList
    };
    static usage_REF = {
        "01": {
            "D2": "Supplier Reference Number",
            "CR": "Customer Reference Number",
            "IV": "Seller's Invoice Number",
            "ON": "Purchase Order Number",
            "ZB": "Ultimate Consignee",
            "ZZ": "Mutually Defined"
        }
    };

    static usage_FOB = {
        "01": {
            "DE": "Per Contract",
        },
        "04": {
            "01": "Incoterms"
        },
        "05": DocInfoBase.TransportationTermsCodeList02,
    };
    static usage_SAC_SAC = {
        "01": {
            "A": "Allowance",
            "C": "Charge",
        },
        "02": DocInfoBase.SPACCodeList,
        "06": {
            "3": "Discount/Gross"
        },
        "12": {
            "13": "Provide Amount"
        },
        "16": DocInfoBase.LanguageList
    };

    static usage_SAC_CUR = {
        "01": {
            "BY": "Buying Party (Purchaser)",
        },
        "02": DocInfoBase.CurrencyList,
        "07": {
            "196": "Start"
        },
        "10": {
            "197": "End"
        }
    };

    static usage_DTM = {
        "01": {
            "004": "Purchase Order",
            "ACK": "Acknowledgment",
        }
    };
    static usage_TXI = {
        "04": {
            "VD": "Vendor defined",
        },
        "06": {
            "0": "Exempt (For Export)",
            "2": "No (Not Tax Exempt)",
        }
    };

    static usage_N9_N9 = {
        "01": {
            "L1": "Letters or Notes",
            "ZZ": "Mutually Defined"
        },
        "02": DocInfoBase.LanguageList
    };

    static usage_N9_MSG = {
        "02": {
            "LC": "Line Continuation",
        }
    };

    static usage_N1_N1 = {
        "01": DocInfoBase.EntityIdentifierCodeList,
        "03": DocInfoBase.IdentificationCodeQualifierList
    };
    static usage_N1_N4 = {
        "05": {
            "SP": "State/Province",
        }
    };
    static usage_N1_REF = {
        "01": DocInfoBase.ReferenceIdentificationQualifierList
    };
    static usage_N1_PER = {
        "01": {
            "CN": "General Contact",
            // "RG": "Registrar"
        },
        "03": DocInfoBase.CommuNumberQualifierList,
        "05": DocInfoBase.CommuNumberQualifierList,
        "07": DocInfoBase.CommuNumberQualifierList,
    };

    static usage_PO1_CUR = {
        "01": {
            "BY": "Buying Party (Purchaser)",
        },
        "02": DocInfoBase.CurrencyList
    };

    static usage_PO1_CTP = {
        "01": {
            "AS": "Seller",
            "WS": "User"
        },
        "02": {
            "CHG": "Changed Price",
            "CUP": "Confirmed Unit Price"
        },
        "06": {
            "CSD": "Cost Markup Multiplier - Original Cost"
        }
    };

    static usage_PO1_MEA = {
        "01": {
            'PD': "Physical Dimensions",
        },
        "02": DocInfoBase.MeasurementQualifierList
    };

    static usage_PO1_PID_PID = {
        "01": {
            "F": "Free-form",
        },
        "02": {
            "GEN": "General Description"
        },
        "09": DocInfoBase.LanguageList
    };

    static usage_PO1_REF = {
        "01": {
            "FL": "Fine Line Classification",
            "ZZ": "Mutually Defined"
        }
    };

    static usage_PO1_SAC_SAC = {
        "01": {
            "A": "Allowance",
            "C": "Charge",
        },
        "02": DocInfoBase.SPACCodeList,
        "06": {
            "3": "Discount/Gross"
        },
        "12": {
            "13": "Provide Amount"
        },
        "16": DocInfoBase.LanguageList
    };

    static usage_PO1_SAC_CUR = {
        "01": {
            "BY": "Buying Party (Purchaser)",
        },
        "02": DocInfoBase.CurrencyList,
        "07": {
            "196": "Start"
        },
        "10": {
            "197": "End"
        }
    };

    static usage_PO1_ACK_ACK = {
        "01": {
            "IA": "Item Accepted",
            "IB": "Item Backordered",
            "IC": "Item Accepted - Changes Made",
            "IR": "Item Rejected"
        },
        "04": {
            "068": "Current Schedule Ship"
        },
        "07": DocInfoBase.ProductServiceIdQualifierList09,
        "09": DocInfoBase.ProductServiceIdQualifierList09,
        "11": DocInfoBase.ProductServiceIdQualifierList09,
        "13": DocInfoBase.ProductServiceIdQualifierList09,
        "15": DocInfoBase.ProductServiceIdQualifierList09,
        "17": DocInfoBase.ProductServiceIdQualifierList09,
        "19": DocInfoBase.ProductServiceIdQualifierList09,
        "21": DocInfoBase.ProductServiceIdQualifierList09,
        "23": DocInfoBase.ProductServiceIdQualifierList09,
    };

    static usage_PO1_ACK_DTM = {
        "01": {
            "017": "Estimated Delivery",
        }
    };

    static usage_PO1_TXI = {
        "04": {
            "VD": "Vendor defined",
        },
        "06": {
            "0": "Exempt (For Export)",
            "2": "No (Not Tax Exempt)",
        }
    };

    static usage_PO1_SCH_SCH = {
        "05": {
            "002": "Delivery Requested",
        }
    };
    static usage_PO1_SCH_REF = {
        "01": {
            "ZZ": "Mutually Defined",
        }
    };
    static usage_PO1_N9_N9 = {
        "01": {
            "L1": "Letters or Notes",
            "ZZ": "Mutually Defined"
        },
        "02": DocInfoBase.LanguageList
    };
    static usage_PO1_N9_MSG = {
        "02": {
            "LC": "Line Continuation"
        }
    };

    static usage_PO1_N1_N1 = {
        "01": DocInfoBase.EntityIdentifierCodeList,
        "03": DocInfoBase.IdentificationCodeQualifierList
    };

    static usage_PO1_N1_N4 = {
        "05": {
            "SP": "State/Province",
        }
    };

    static usage_PO1_N1_REF = {
        "01": DocInfoBase.ReferenceIdentificationQualifierList
    };

    static usage_PO1_N1_PER = {
        "01": {
            "CN": "General Contact",
            // "RG": "Registrar"
        },
        "03": DocInfoBase.CommuNumberQualifierList,
        "05": DocInfoBase.CommuNumberQualifierList,
        "07": DocInfoBase.CommuNumberQualifierList,
    };
    static usage_CTT_AMT= {
        "01": {
            "TT": "Total Transaction Amount",
        },
     
    };

    static comment_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_TXI = {
        "01": `**Tax Type Code**`
            + `Please refer to APPENDIX - [CODELISTS 963 Tax Type Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(963)})`,
        "05": `**Tax location**\n\nLocation or jurisdiction associated with this tax`,
        "08": `Taxable amount on which the tax percentage is calculated.`,
    }

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
    static comment_PO1_CTP = {
        "0501": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_PO1_MEA = {
        "0401": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }
    static comment_PO1_ACK_ACK = {
        "03": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_PO1_ACK_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_PO1_TXI = {
        "01": `**Tax Type Code**`
            + `Please refer to APPENDIX - [CODELISTS 963 Tax Type Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(963)})`,
        "05": `**Tax location**\n\njurisdiction associated with this tax`,
        "08": `Taxable amount on which the tax percentage is calculated.`,
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

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BAK":
                return Info_865.usage_BAK[ele.designatorIndex]
                break;
            case "ROOT_CUR":
                return Info_865.usage_CUR[ele.designatorIndex]
                break;
            case "ROOT_REF":
                return Info_865.usage_REF[ele.designatorIndex]
                break;
            case "ROOT_FOB":
                return Info_865.usage_FOB[ele.designatorIndex]
                break;
            case "ROOT_SAC_SAC":
                return Info_865.usage_SAC_SAC[ele.designatorIndex]
                break;
            case "ROOT_SAC_CUR":
                return Info_865.usage_SAC_CUR[ele.designatorIndex]
                break;
            case "ROOT_DTM":
                return Info_865.usage_DTM[ele.designatorIndex]
                break;
            case "ROOT_TXI":
                return Info_865.usage_TXI[ele.designatorIndex]
                break;
            case "ROOT_N9_N9":
                return Info_865.usage_N9_N9[ele.designatorIndex]
                break;
            case "ROOT_N9_MSG":
                return Info_865.usage_N9_MSG[ele.designatorIndex]
                break;
            case "ROOT_N1_N1":
                return Info_865.usage_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_N1_N4":
                return Info_865.usage_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_N1_REF":
                return Info_865.usage_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_N1_PER":
                return Info_865.usage_N1_PER[ele.designatorIndex]
                break;
            case "ROOT_PO1_CUR":
                return Info_865.usage_PO1_CUR[ele.designatorIndex]
                break;
            case "ROOT_PO1_CTP":
                return Info_865.usage_PO1_CTP[ele.designatorIndex]
                break;
            case "ROOT_PO1_MEA":
                return Info_865.usage_PO1_MEA[ele.designatorIndex]
                break;
            case "ROOT_PO1_PID_PID":
                return Info_865.usage_PO1_PID_PID[ele.designatorIndex]
                break;
            case "ROOT_PO1_REF":
                return Info_865.usage_PO1_REF[ele.designatorIndex]
                break;
            case "ROOT_PO1_SAC_SAC":
                return Info_865.usage_PO1_SAC_SAC[ele.designatorIndex]
                break;
            case "ROOT_PO1_SAC_CUR":
                return Info_865.usage_PO1_SAC_CUR[ele.designatorIndex]
                break;
            case "ROOT_PO1_ACK_ACK":
                return Info_865.usage_PO1_ACK_ACK[ele.designatorIndex]
                break;
            case "ROOT_PO1_ACK_DTM":
                return Info_865.usage_PO1_ACK_DTM[ele.designatorIndex]
                break;
            case "ROOT_PO1_TXI":
                return Info_865.usage_PO1_TXI[ele.designatorIndex]
                break;
            case "ROOT_PO1_SCH_SCH":
                return Info_865.usage_PO1_SCH_SCH[ele.designatorIndex]
                break;
            case "ROOT_PO1_SCH_REF":
                return Info_865.usage_PO1_SCH_REF[ele.designatorIndex]
                break;
            case "ROOT_PO1_N9_N9":
                return Info_865.usage_PO1_N9_N9[ele.designatorIndex]
                break;
            case "ROOT_PO1_N9_MSG":
                return Info_865.usage_PO1_N9_MSG[ele.designatorIndex]
                break;
            case "ROOT_PO1_N1_N1":
                return Info_865.usage_PO1_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_PO1_N1_N4":
                return Info_865.usage_PO1_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_PO1_N1_REF":
                return Info_865.usage_PO1_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_PO1_N1_PER":
                return Info_865.usage_PO1_N1_PER[ele.designatorIndex]
                break;
            case "ROOT_CTT_AMT":
                return Info_865.usage_CTT_AMT[ele.designatorIndex]
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
            case "ROOT_DTM":
                return Info_865.comment_DTM[ele.designatorIndex];
                break;
            case "ROOT_TXI":
                return Info_865.comment_TXI[ele.designatorIndex];
                break;
            case "ROOT_N1_N4":
                return Info_865.comment_N1_N4[ele.designatorIndex];
                break;
            case "ROOT_PO1_PO1":
                return Info_865.comment_PO1_PO1[ele.designatorIndex];
                break;
            case "ROOT_PO1_CTP":
                return Info_865.comment_PO1_CTP[ele.designatorIndex];
                break;
            case "ROOT_PO1_MEA":
                return Info_865.comment_PO1_MEA[ele.designatorIndex];
                break;
            case "ROOT_PO1_ACK_ACK":
                return Info_865.comment_PO1_ACK_ACK[ele.designatorIndex];
                break;
            case "ROOT_PO1_ACK_DTM":
                return Info_865.comment_PO1_ACK_DTM[ele.designatorIndex];
                break;
            case "ROOT_PO1_TXI":
                return Info_865.comment_PO1_TXI[ele.designatorIndex];
                break;
            case "ROOT_PO1_SCH_SCH":
                return Info_865.comment_PO1_SCH_SCH[ele.designatorIndex];
                break;
            case "ROOT_PO1_N1_N4":
                return Info_865.comment_PO1_N1_N4[ele.designatorIndex];
                break;
            default:

        }
        return undefined;
    }
}