import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_842_In extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BNR = {
        "01": {
            "00": "Original",
            "05": "Replace"
        }
    };
    static usage_REF = {
        "01": {
            "ACC": "Status",
            "MA": "Ship Notice/Manifest Number",
            "NJ": "Technical Document Number",
            "PH": "Priority Rating",
            "PO": "Purchase Order Number",
            "QR": "Quality Inspection Number",
            "V0": "Version"
        },
        "03": {
            "draft": "",
            "new": "",
            "in-process": "",
            "completed": "",
            "postponed": "",
            "canceled": "",
            "closed": ""
        },
        "0401": {
            "LI": "Line Item Identifier"
        }
    };

    static usage_DTM = {
        "01": {
            "004": "Purchase Order",
            "111": "Manifest/Ship Notice",
            "134": "Inspection"
        }
    };
    static usage_N1_N1 = {
        "01": {
            "BT": "Bill-to-Party",
            "BY": "Buying Party (Purchaser)",
            "ST": "Ship To",
            "SU": "Supplier/Manufacturer",
            "FR": "Message From",
            "TO": "Message To",
            "42": "Component Manufacturer",
            "UK": "Sender Business System ID"
        },
        "03": DocInfoBase.IdentificationCodeQualifierList02
    };
    static usage_N1_N4 = {
        "05": {
            'SP': "State/Province",
        }
    };
    static usage_HL_HL = {
        "03": {
            'RP': "Report",
            "I": "Item",
            "F": "Component"
        },
        "04": {
            "0": "No Subordinate HL Segment in This Hierarchical Structure.",
            "1": "Additional Subordinate HL Data Segment in This Hierarchical Structure."
        }
    };
    static usage_HL_LIN = {
        "02": DocInfoBase.ProductServiceIdQualifierList04,
        "04": DocInfoBase.ProductServiceIdQualifierList04,
        "06": DocInfoBase.ProductServiceIdQualifierList04,

    };
    static usage_HL_PID = {
        "F": "Free-form",
        "09": DocInfoBase.LanguageList,
    };
    static usage_HL_DTM = {
        "01": {
            "036": "Expiration",
            "405": "Production"
        }
    };
    static usage_HL_REF = {
        "01": {
            '8X': "Transaction Category or Type",
            "BT": "Batch Number",
            "LT": "Lot Number",
            "RZ": "Returned Goods Authorization Number",
            "SE": "Serial Number",
            "4C": "Storage Location",
            "4L": "Supplier Location",
            "LU": "Buyer Location"
        }
    };

    static usage_HL_QTY = {
        "01": {
            '38': "Original Quantity",
        }
    };
    static usage_HL_NCD_NCD = {
        "01": {
            '52': "Non-conforming",
        }
    };
    static usage_HL_NCD_DTM = {
        "01": {
            "193": "Malfunction Period Start",
            "194": "Malfunction Period End",
            "198": "Completion",
            "324": "Returned",
            "516": "Discovered",
            "RFD": "Requested Processing Finish",
            "RSD": "Requested Processing Start"
        }
    };
    static usage_HL_NCD_REF = {
        "01": {
            "ACC": "Status",
            "BZ": "Complaint Code"
        },
        "0401": {
            "H6": "Quality Clause"
        },
        "0402": {
            "type": "",
            "subject": "",
            "reason": "",
            "revision": ""
        },
        "0403": {
            "6P": "Group Number"
        },
        "0405": {
            "6P": "Group Number"
        }
    };

    static usage_HL_NCD_QTY = {
        "01": {
            "76": "Returns",
            "86": "Nonconformance Quantity",
            "TO": "Total"
        }
    };
    static usage_HL_NCD_N1_N1 = {
        "01": {
            "QQ": "Quality Control",
            "BY": "Buying Party (Purchaser)",
            "SU": "Supplier/Manufacturer"
        },
        "03": {
            "92": "Assigned by Buyer or Buyer's Agent"
        }
    };
    static usage_HL_NCD_N1_REF = {
        "01": {
            "E9": "Attachment Code",
            "BZ": "Complaint Code",
            "JD": "User Identification",
            "L1": "Letters or Notes"
        },
        "0401": {
            "H6": "Quality Clause"
        },
        "0403": {
            "6P": "Group Number"
        },
        "0405": {
            "6P": "Group Number"
        },
    };
    static usage_HL_NCD_NCA_NTE = {
        "01": {
            "TES": "Task Statement",
            "REG": "Registered Activity",
            "DEP": "Problem Description"
        }
    };
    static usage_HL_NCD_NCA_DTM = {
        "01": {
            "193": "Processing Period Start",
            "194": "Processing Period End",
            "198": "Completion"
        }
    };
    static usage_HL_NCD_NCA_REF = {
        "01": {
            "ACC": "Status",
            "BZ": "Complaint Code"
        },
        "03": {
            "new": "",
            "in-process": "",
            "complete": "",
            "closed": ""
        },
        "0401": {
            "H6": "Quality Clause"
        },
        "0403": {
            "6P": "Group Number"
        },
        "0405": {
            "6P": "Group Number"
        }
    };
    static usage_HL_NCD_NCA_N1_N1 = {
        "01": {
            "9K": "Key Person",
            "BY": "Buying Party (Purchaser)",
            "SU": "Supplier/Manufacturer",
            "QD": "Responsible Party"
        },
        "03": {
            "92": "Assigned by Buyer or Buyer's Agent"
        },
        "06": {
            "BY": "Buying Party (Purchaser)",
            "EN": "End User",
            "SU": "Supplier/Manufacturer"
        }
    };
    static usage_HL_NCD_NTE = {
        "01": {
            'NCD': "Nonconformance Specification",
        }
    };

    static comment_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
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

    static comment_HL_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_HL_QTY = {
        "0301": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_HL_NCD_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_HL_NCD_QTY = {
        "0301": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_HL_NCD_NCA_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BNR":
                return Info_842_In.usage_BNR[ele.designatorIndex]
                break;
            case "ROOT_REF":
                return Info_842_In.usage_REF[ele.designatorIndex]
                break;
            case "ROOT_DTM":
                return Info_842_In.usage_DTM[ele.designatorIndex]
                break;
            case "ROOT_N1_N1":
                return Info_842_In.usage_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_N1_N4":
                return Info_842_In.usage_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_HL_HL":
                return Info_842_In.usage_HL_HL[ele.designatorIndex]
                break;
            case "ROOT_HL_LIN":
                return Info_842_In.usage_HL_LIN[ele.designatorIndex]
                break;
            case "ROOT_HL_PID":
                return Info_842_In.usage_HL_PID[ele.designatorIndex]
                break;
            case "ROOT_HL_DTM":
                return Info_842_In.usage_HL_DTM[ele.designatorIndex]
                break;
            case "ROOT_HL_REF":
                return Info_842_In.usage_HL_REF[ele.designatorIndex]
                break;
            case "ROOT_HL_QTY":
                return Info_842_In.usage_HL_QTY[ele.designatorIndex]
                break;
            case "ROOT_HL_NCD_NCD":
                return Info_842_In.usage_HL_NCD_NCD[ele.designatorIndex]
                break;
            case "ROOT_HL_NCD_DTM":
                return Info_842_In.usage_HL_NCD_DTM[ele.designatorIndex]
                break;
            case "ROOT_HL_NCD_REF":
                return Info_842_In.usage_HL_NCD_REF[ele.designatorIndex]
                break;
            case "ROOT_HL_NCD_QTY":
                return Info_842_In.usage_HL_NCD_QTY[ele.designatorIndex]
                break;
            case "ROOT_HL_NCD_N1_N1":
                return Info_842_In.usage_HL_NCD_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_HL_NCD_N1_REF":
                return Info_842_In.usage_HL_NCD_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_HL_NCD_NCA_NTE":
                return Info_842_In.usage_HL_NCD_NCA_NTE[ele.designatorIndex]
                break;
            case "ROOT_HL_NCD_NCA_DTM":
                return Info_842_In.usage_HL_NCD_NCA_DTM[ele.designatorIndex]
                break;
            case "ROOT_HL_NCD_NCA_REF":
                return Info_842_In.usage_HL_NCD_NCA_REF[ele.designatorIndex]
                break;
            case "ROOT_HL_NCD_NCA_N1_N1":
                return Info_842_In.usage_HL_NCD_NCA_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_HL_NCD_NTE": //usage_HL_NCD_NTE
                return Info_842_In.usage_HL_NCD_NTE[ele.designatorIndex]
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
                return Info_842_In.comment_DTM[ele.designatorIndex];
                break;
            case "ROOT_N1_N4":
                return Info_842_In.comment_N1_N4[ele.designatorIndex];
                break;
            case "ROOT_HL_DTM":
                return Info_842_In.comment_HL_DTM[ele.designatorIndex];
                break;
            case "ROOT_HL_QTY":
                return Info_842_In.comment_HL_QTY[ele.designatorIndex];
                break;
            case "ROOT_HL_NCD_DTM":
                return Info_842_In.comment_HL_NCD_DTM[ele.designatorIndex];
                break;
            case "ROOT_HL_NCD_QTY":
                return Info_842_In.comment_HL_NCD_QTY[ele.designatorIndex];
                break;
            case "ROOT_HL_NCD_NCA_DTM":
                return Info_842_In.comment_HL_NCD_NCA_DTM[ele.designatorIndex];
                break;
            default:

        }
        return undefined;
    }
}