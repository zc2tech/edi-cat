import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_846_MOPO extends DocInfoBase {

    static usage_BIA = {
        "01": {
            "00": "Original",
        },
        "02": {
            "ZZ": "Mutually Defined",
        }
    };
    static usage_REF = {
        "01": {
            'PHC': "Process Handling Code",
            "06": "System Identification Number",
            "44": "End Point Identification Number",
            "VR": "Vendor Identification Number"
        },
    };

    static usage_LIN_LIN = {
        "02": DocInfoBase.ProductServiceIdQualifierList06,
        "04": DocInfoBase.ProductServiceIdQualifierList06,
        "06": DocInfoBase.ProductServiceIdQualifierList06,
        "08": DocInfoBase.ProductServiceIdQualifierList06,
        "10": DocInfoBase.ProductServiceIdQualifierList06,
        "12": DocInfoBase.ProductServiceIdQualifierList06,
    };

    static usage_LIN_PID = {
        "01": {
            'F': "Free-form",
            "S": "Structured (From Industry Code List)",
        },
        "02": {
            "09": "Sub-product"
        },
        "03": {
            "ZZ": "Mutually Defined"
        },
        "09": DocInfoBase.LanguageList
    };
    static usage_LIN_MEA = {
        "01": {
            'TI': "Time",
        },
        "02": {
            'MI': "Minimum",
            'MX': "Maximum",
        },
        "0401": {
            'DW': "Calendar Days",
        }
    };

    static usage_LIN_REF = {
        "01": {
            "BT": "Batch Number",
            "PRT": "Product Type, Characteristics",
            "MH": "Manufacturing Order Number",
            "PO": "Purchase Order Number"
        }
    }
    static usage_LIN_LDT = {
        "01": {
            "AF": "From date of PO receipt to delivery",
        },
        "03": {
            "DA": "Calendar Days"
        }
    }
    static usage_LIN_QTY_QTY = {
        "01": {
            "33": "Quantity Available for Sale (stock quantity)",
            "3Y": "Subcontracting Stock Transfer In Quantity",
            "69": "Incremental Quantity",
            "72": "Minimum Stock Level",
            "73": "Maximum Stock Level",
            "77": "Stock Transfers In",
            "QH": "Quantity on Hold",
            "XT": "Protected Quantity",
            "7K": "Replenishment Quantity",
            "99": "Replenishment quantity",
            "NT": "Reports"
        },
        "0302": {
            "1": "Inventory",
            "2": "Consignment Inventory"
        }
    };
    static usage_LIN_QTY_DTM = {
        "01": {
            "196": "Time series start",
            "197": "Time series end"
        }
    }
    static usage_LIN_QTY_REF_REF = {
        "01": {
            "MH": "Manufacturing Order Number",
            "PO": "Purchase Order Number",
            "8X": "Transaction Category or Type",
            "0L": "Referenced By"
        },
        "0401": {
            "RPT": "Report"
        },
        "0402": {
            "Production Start": "",
            "Production Finish": "",
            "Stop Change": "",
        }
    }
    static usage_LIN_QTY_REF_DTM = {
        "01": {
            "196": "Production order start",
            "197": "Production order end"
        },
    }

    static usage_LIN_N1_N1 = {
        "01": {
            "LC": "Location To",
            "SU": "Location From",
            "Z4": "Inventory Owner"
        },
        "03": DocInfoBase.IdentificationCodeQualifierList03
    };
    static usage_LIN_N1_N4 = {
        "05": {
            "SP": "State/Province"
        }
    };
    static usage_LIN_N1_REF = {
        "01": {
            "1M": "Supplier Location Code",
            "IR": "Buyer Location Code",
            "IA": "Inventory Owner Code"
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

    // static comment_LIN_QTY_UIT = {
    //     "0101": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
    //         + `expressed, or manner in which a measurement has been taken. Please refer to `
    //         + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    // }

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
                return Info_846_MOPO.usage_BIA[ele.designatorIndex]
                break;
            case "ROOT_REF":
                return Info_846_MOPO.usage_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_LIN":
                return Info_846_MOPO.usage_LIN_LIN[ele.designatorIndex]
                break;
            case "ROOT_LIN_PID":
                return Info_846_MOPO.usage_LIN_PID[ele.designatorIndex]
                break;
            case "ROOT_LIN_MEA":
                return Info_846_MOPO.usage_LIN_MEA[ele.designatorIndex]
                break;
            case "ROOT_LIN_REF":
                return Info_846_MOPO.usage_LIN_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_LDT":
                return Info_846_MOPO.usage_LIN_LDT[ele.designatorIndex]
                break;
            case "ROOT_LIN_QTY_QTY":
                return Info_846_MOPO.usage_LIN_QTY_QTY[ele.designatorIndex]
                break;
            case "ROOT_LIN_QTY_DTM":
                return Info_846_MOPO.usage_LIN_QTY_DTM[ele.designatorIndex]
                break;
            case "ROOT_LIN_QTY_REF_REF":
                return Info_846_MOPO.usage_LIN_QTY_REF_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_QTY_REF_DTM":
                return Info_846_MOPO.usage_LIN_QTY_REF_DTM[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_N1":
                return Info_846_MOPO.usage_LIN_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_N4":
                return Info_846_MOPO.usage_LIN_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_REF":
                return Info_846_MOPO.usage_LIN_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_PER":
                return Info_846_MOPO.usage_LIN_N1_PER[ele.designatorIndex]
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
                return Info_846_MOPO.comment_LIN_QTY_QTY[ele.designatorIndex];
                break;
            // case "ROOT_LIN_QTY_UIT":
            //     return Info_846_MOPO.comment_LIN_QTY_UIT[ele.designatorIndex];
            //     break;
            case "ROOT_LIN_QTY_DTM":
                return Info_846_MOPO.comment_LIN_QTY_DTM[ele.designatorIndex];
                break;
            case "ROOT_LIN_QTY_REF_DTM":
                return Info_846_MOPO.comment_LIN_QTY_REF_DTM[ele.designatorIndex];
                break;
            case "ROOT_LIN_N1_N4":
                return Info_846_MOPO.comment_LIN_N1_N4[ele.designatorIndex];
                break;
            default:

        }
        return undefined;
    }
}