import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_846_Consignment extends DocInfoBase {
    static usage_BIA = {
        "01": {
            "00": "Original",
        },
        "02": {
            "CO": "Consignment Movement",
        },
        "06": {
            "AC": "Acknowledge"
        }
    };
    static usage_LIN_LIN = {
        "02": DocInfoBase.ProductServiceIdQualifierList04,
        "04": DocInfoBase.ProductServiceIdQualifierList04,
        "06": DocInfoBase.ProductServiceIdQualifierList04,
    };

    static usage_LIN_PID = {
        "01": {
            'F': "Free-form",
        },
        "09": DocInfoBase.LanguageList
    };

    static usage_LIN_REF = {
        "01": {
            "BT": "Batch Number",
            "LT": "Lot Number"
        }
    }

    static usage_LIN_QTY_QTY = {
        "01": {
            "33": "Quantity Available for Sale (stock quantity)",
            "V3": "Transfer Quantity"
        },
        "0302": {
            // "1": "Inventory",
            "2": "Consignment Inventory",
            "3": "Consignment Movement"
        }
    };
    static usage_LIN_QTY_DTM = {
        "01": {
            // "196": "Time series start",
            // "197": "Time series end"
            "514": "Transferred"
        }
    }
    static usage_LIN_QTY_LS = {
        "01": {
            "REF": "Loop Indicator"
        }
    }
    static usage_LIN_QTY_REF_REF = {
        "01": {
            "2I": "Consignment Movement Tracking Number",
            "IV": "Invoice Number",
            "IX": "Movement Identification Number"
        },
        "0401": {
            "LI": "Line Item Identifier"
        }
    }
    static usage_LIN_QTY_REF_DTM = {
        "01": {
            "003": "Invoice",
        },
    }
    static usage_LIN_QTY_LE = {
        "01": {
            "REF": "Loop Complete",
        },
    }

    static usage_LIN_N1_N1 = {
        "01": {
            "MI": "Planning Schedule Issuer",
            "ST": "Location-To",
            "SU": "Location-From"
        },
        "03": DocInfoBase.IdentificationCodeQualifierList04
    };

    static usage_LIN_N1_N4 = {
        "05": {
            "SP": "State/Province"
        }
    };
    static usage_LIN_N1_REF = {
        "01": {
            "12": "Account Payable Identification Number",
            "4B": "Loading Point",
            "4C": "Storage Location",
            "72": "Buyer Planning Identification Number",
            "AP": "Accounts Receivable Identification Number",
            "LU": "Buyer Location Identification Number",
            "ZZ": "Mutually Defined"
        }
    };
    static usage_LIN_N1_PER = {
        "01": {
            "CN": "General Contact",
        },
        "03": DocInfoBase.CommuNumberQualifierList,
        "05": DocInfoBase.CommuNumberQualifierList,
        "07": DocInfoBase.CommuNumberQualifierList
    }

    static comment_LIN_QTY_QTY = {
        "0301": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_LIN_QTY_UIT = {
        "0101": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_LIN_QTY_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }
    static comment_LIN_QTY_REF_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_LIN_N1_N4 = {
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
            case "ROOT_BIA":
                return Info_846_Consignment.usage_BIA[ele.designatorIndex]
                break;

            case "ROOT_LIN_LIN":
                return Info_846_Consignment.usage_LIN_LIN[ele.designatorIndex]
                break;
            case "ROOT_LIN_PID":
                return Info_846_Consignment.usage_LIN_PID[ele.designatorIndex]
                break;

            case "ROOT_LIN_REF":
                return Info_846_Consignment.usage_LIN_REF[ele.designatorIndex]
                break;

            case "ROOT_LIN_QTY_QTY":
                return Info_846_Consignment.usage_LIN_QTY_QTY[ele.designatorIndex]
                break;
            case "ROOT_LIN_QTY_DTM":
                return Info_846_Consignment.usage_LIN_QTY_DTM[ele.designatorIndex]
                break;
            case "ROOT_LIN_QTY_LS":
                return Info_846_Consignment.usage_LIN_QTY_LS[ele.designatorIndex]
                break;
            case "ROOT_LIN_QTY_REF_REF":
                return Info_846_Consignment.usage_LIN_QTY_REF_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_QTY_REF_DTM":
                return Info_846_Consignment.usage_LIN_QTY_REF_DTM[ele.designatorIndex]
                break;
            case "ROOT_LIN_QTY_LE":
                return Info_846_Consignment.usage_LIN_QTY_LE[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_N1":
                return Info_846_Consignment.usage_LIN_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_N4":
                return Info_846_Consignment.usage_LIN_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_REF":
                return Info_846_Consignment.usage_LIN_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_PER":
                return Info_846_Consignment.usage_LIN_N1_PER[ele.designatorIndex]
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
            case "ROOT_LIN_QTY_QTY":
                return Info_846_Consignment.comment_LIN_QTY_QTY[ele.designatorIndex];
                break;
            case "ROOT_LIN_QTY_UIT":
                return Info_846_Consignment.comment_LIN_QTY_UIT[ele.designatorIndex];
                break;
            case "ROOT_LIN_QTY_DTM":
                return Info_846_Consignment.comment_LIN_QTY_DTM[ele.designatorIndex];
                break;
            case "ROOT_LIN_QTY_REF_DTM":
                return Info_846_Consignment.comment_LIN_QTY_REF_DTM[ele.designatorIndex];
                break;
            case "ROOT_LIN_N1_N4":
                return Info_846_Consignment.comment_LIN_N1_N4[ele.designatorIndex];
                break;

            default:

        }
        return undefined;
    }
}