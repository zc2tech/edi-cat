import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_861_Out extends DocInfoBase {
    static usage_BRA = {
        "03": {
            "00": "Original",
            "03": "Delete*",
            "05": "Replace*"
        },
        "04": {
            "2": "Post Receipt Advice"
        },
        "07": {
            "AC": "Acknowledge"
        }
    };
    static usage_CUR = {
        "01": {
            "BY": "Buying Party (Purchaser)"
        },
        "02": DocInfoBase.CurrencyList
    };

    static usage_REF = {
        "01": {
            "1Z": "Financial Detail Code",
            "L1": "Letters or Notes",
            "MA": "Ship Notice/Manifest Number",
            "ZZ": "Mutually Defined"
        },
        "02": DocInfoBase.LanguageList
    };

    static usage_DTM = {
        "01": {
            "050": "Received",
            "111": "Manifest/Ship Notice"
        }
    };
    static usage_RCD_CUR = {
        "01": {
            "BY": "Buying Party (Purchaser)"
        },
        "02": DocInfoBase.CurrencyList
    };

    static usage_RCD_LIN = {
        "02": DocInfoBase.ProductServiceIdQualifierList11,
        "04": DocInfoBase.ProductServiceIdQualifierList11,
        "06": DocInfoBase.ProductServiceIdQualifierList11,
        "08": DocInfoBase.ProductServiceIdQualifierList11,
        "12": DocInfoBase.ProductServiceIdQualifierList11,
        "14": DocInfoBase.ProductServiceIdQualifierList11,
        "16": DocInfoBase.ProductServiceIdQualifierList11,
    };

    static usage_RCD_PID = {
        "01": {
            "F": "Free-form",
            // "S": "Structured (From Industry Code List)"
        },
        "02": {
            "GEN": "General Description",
            // "MAC": "Material Classification"
        },
        // "03": {
        //     "UN": "United Nations (UN)",
        //     "AS": "Assigned by Seller"
        // },
        "09": DocInfoBase.LanguageList
    };

    static usage_RCD_REF = {
        "01": {
            // "0L": "Referenced By",
            // "1Z": "Financial Detail Code",
            "AH": "Agreement Number",
            // "FJ": "Completed Indicator",
            // "FL": "Fine Line Classification",
            "L1": "Letters or Notes",
            "MA": "Ship Notice/Manifest Number",
            "PO": "Purchase Order Number",
            "ZZ": "Mutually Defined"
        },
        // "0401": {
        //     "0L": "Referenced By",
        //     "AH": "Agreement Number",
        //     "LI": "Line Item Identifier"
        // },
        // "0402": {
        //     "1": "Schedule Agreement"
        // }
    };

    static usage_RCD_DTM = {
        "01": {
            "004": "Purchase Order",
            "111": "Manifest/Ship Notice",
            "LEA": "Letter of Agreement"
        }
    };

    // static usage_RCD_MAN = {
    //     "01": {
    //         "L": "Line Item Only"
    //     },
    //     "02": {
    //         "SN": "Serial Number",
    //         "AT": "Tag Number"
    //     },
    //     "04": {
    //         "L": "Line Item Only"
    //     },
    //     "05": {
    //         "SN": "Serial Number",
    //         "AT": "Tag Number"
    //     }
    // };

    static usage_RCD_N1_N1 = {
        "01": {
            "DA":"Delivery Address"
        },
        "03": DocInfoBase.IdentificationCodeQualifierList02,
    };

    static usage_RCD_N1_N4 = {
        "05": {
            "SP": "State/Province",
        },
    };

    // static usage_RCD_N1_REF= {
    //     "01": {
    //        "ME":"Postal Address Name or ID"
    //     },   
    // };

    static usage_RCD_N1_PER = {
        "01": {
            // "AP": "Accounts Payable Department",
            "CN": "General Contact",
            // "RE": "Receiving Contact"
        },
        "03": DocInfoBase.CommuNumberQualifierList,
        "05": DocInfoBase.CommuNumberQualifierList,
        "07": DocInfoBase.CommuNumberQualifierList,
    };

    static comment_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_RCD_RCD = {
        "0301": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
        "0501": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_RCD_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_RCD_N1_N4 = {
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
            case "ROOT_BRA":
                return Info_861_Out.usage_BRA[ele.designatorIndex]
                break;
            case "ROOT_CUR":
                return Info_861_Out.usage_CUR[ele.designatorIndex]
                break;
            case "ROOT_REF":
                return Info_861_Out.usage_REF[ele.designatorIndex]
                break;
            case "ROOT_DTM":
                return Info_861_Out.usage_DTM[ele.designatorIndex]
                break;
            case "ROOT_RCD_CUR":
                return Info_861_Out.usage_RCD_CUR[ele.designatorIndex]
                break;
            case "ROOT_RCD_LIN":
                return Info_861_Out.usage_RCD_LIN[ele.designatorIndex]
                break;
            case "ROOT_RCD_PID":
                return Info_861_Out.usage_RCD_PID[ele.designatorIndex]
                break;
            case "ROOT_RCD_REF":
                return Info_861_Out.usage_RCD_REF[ele.designatorIndex]
                break;
            case "ROOT_RCD_DTM":
                return Info_861_Out.usage_RCD_DTM[ele.designatorIndex]
                break;
            // case "ROOT_RCD_MAN":
            //     return Info_861_Out.usage_RCD_MAN[ele.designatorIndex]
            //     break;
            case "ROOT_RCD_N1_N1":
                return Info_861_Out.usage_RCD_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_RCD_N1_N4":
                return Info_861_Out.usage_RCD_N1_N4[ele.designatorIndex]
                break;
            // case "ROOT_RCD_N1_REF":
            //     return Info_861_Out.usage_RCD_N1_REF[ele.designatorIndex]
            //     break;
            case "ROOT_RCD_N1_PER":
                return Info_861_Out.usage_RCD_N1_PER[ele.designatorIndex]
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
                return Info_861_Out.comment_DTM[ele.designatorIndex];
                break;
            case "ROOT_RCD_RCD":
                return Info_861_Out.comment_RCD_RCD[ele.designatorIndex];
                break;
            case "ROOT_RCD_DTM":
                return Info_861_Out.comment_RCD_DTM[ele.designatorIndex];
                break;
            case "ROOT_RCD_N1_N4":
                return Info_861_Out.comment_RCD_N1_N4[ele.designatorIndex];
                break;
            default:

        }
        return undefined;
    }
}