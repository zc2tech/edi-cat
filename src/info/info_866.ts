import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_866 extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BSS = {
        "01": {
            "00": "Original",
            "05":"Replace"
        },
        "04":{
            "BB":"Customer Production (Consumption) Based"
        }
    };
   
    static usage_DTM_DTM = {
        "01": {
            "004": "Purchase Order",
        }
    };
    static usage_DTM_REF = {
        "01": {
            "PO": "Purchase Order Number",
        }
    };

    static usage_DTM_LIN_LIN = {
        "02": DocInfoBase.ProductServiceIdQualifierList12,
        "04": DocInfoBase.ProductServiceIdQualifierList12,
        "06": DocInfoBase.ProductServiceIdQualifierList12,
        "08": DocInfoBase.ProductServiceIdQualifierList12,
        "10": DocInfoBase.ProductServiceIdQualifierList12,
        "12": DocInfoBase.ProductServiceIdQualifierList12,
    };

    static usage_DTM_LIN_REF = {
        "01": {
            "MH": "Manufacturing Order Number",
            "RPT": "Report Completion Indicator",
        },     
    };

    static usage_DTM_LIN_QTY = {
        "01": {
            "99": "Quantity Used",
        },     
    };

    static usage_DTM_LIN_PID = {
        "01": {
            "F": "Free-form",
        },     
        "09": DocInfoBase.LanguageList
    };

    static usage_DTM_LIN_SLN_SLN = {
        "03": {
            "I": "Included",
            "O":"Information Only"
        },
        "09": DocInfoBase.ProductServiceIdQualifierList08,
        "11": DocInfoBase.ProductServiceIdQualifierList08,
        "13": DocInfoBase.ProductServiceIdQualifierList08,
        "15": DocInfoBase.ProductServiceIdQualifierList08,
        "17": DocInfoBase.ProductServiceIdQualifierList08,
    };

    static usage_DTM_LIN_SLN_PID_PID = {
        "01": {
            "F": "Free-form",
        },     
        "02": {
            "PR":"Manufacturing Process"
        },
        "03": {
            "ZZ":"MMutually Defined"
        },
    };

    static comment_DTM_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_DTM_LIN_QTY = {
        "0301": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }
    static comment_DTM_LIN_SLN_SLN = {
        "0301": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BSS":
                return Info_866.usage_BSS[ele.designatorIndex]
                break;
            case "ROOT_DTM_DTM":
                return Info_866.usage_DTM_DTM[ele.designatorIndex]
                break;
            case "ROOT_DTM_REF":
                return Info_866.usage_DTM_REF[ele.designatorIndex]
                break;
            case "ROOT_DTM_LIN_LIN":
                return Info_866.usage_DTM_LIN_LIN[ele.designatorIndex]
                break;
            case "ROOT_DTM_LIN_REF":
                return Info_866.usage_DTM_LIN_REF[ele.designatorIndex]
                break;
            case "ROOT_DTM_LIN_QTY":
                return Info_866.usage_DTM_LIN_QTY[ele.designatorIndex]
                break;
            case "ROOT_DTM_LIN_PID":
                return Info_866.usage_DTM_LIN_PID[ele.designatorIndex]
                break;
            case "ROOT_DTM_LIN_SLN_SLN":
                return Info_866.usage_DTM_LIN_SLN_SLN[ele.designatorIndex]
                break;
            case "ROOT_DTM_LIN_SLN_PID_PID":
                return Info_866.usage_DTM_LIN_SLN_PID_PID[ele.designatorIndex]
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
            case "ROOT_DTM_DTM":
                return Info_866.comment_DTM_DTM[ele.designatorIndex];
                break;
            case "ROOT_DTM_LIN_QTY":
                return Info_866.comment_DTM_LIN_QTY[ele.designatorIndex];
                break;
            case "ROOT_DTM_LIN_SLN_SLN":
                return Info_866.comment_DTM_LIN_SLN_SLN[ele.designatorIndex];
                break;

            default:

        }
        return undefined;
    }
}