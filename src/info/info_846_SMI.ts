import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_846_SMI extends DocInfoBase {
    static usage_BIA = {
        "01": {
            "00": "Original",
        },
        "02": {
            "SI": "Seller Inventory Report",
        },
        "06": {
            "AC": "Acknowledge"
        }
    };
    static usage_LIN_LIN = {
        "02": DocInfoBase.ProductServiceIdQualifierList03,
        "04": DocInfoBase.ProductServiceIdQualifierList03,
        "06": DocInfoBase.ProductServiceIdQualifierList03,
        "08": DocInfoBase.ProductServiceIdQualifierList03,
        "10": DocInfoBase.ProductServiceIdQualifierList03,
    };

    static usage_LIN_PID = {
        "01": {
            'F': "Free-form",
            "S": "Structured (From Industry Code List)"
        },
        "02": {
            "09": "Sub-product",
            "MAC": "Material Classification"
        },
        "03": {
            "AS": "Assigned by Seller",
            "UN": "United Nations (UN)",
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
            "0L": "Referenced By (specific Usage)",
            "ACC": "Status",
            "BT": "Batch Number",
            "ADB": "PropertyValution",
            "ADC": "ValueGroup/PropertyValue"
            // "LT": "Lot Number"
        },
        "0401": {
            "0L": "Referenced By"
        },
        "0403": {
            "ADE": "Associated ValueGroup"
        },
        "0405": {
            "S3": "PropertyValue name"
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
            "3Y": "Subcontracting Stock Transfer In",
            "69": "Incremental Quantity",
            "72": "Minimum Stock Level",
            "73": "Maximum Stock Level",
            "77": "Stock Transfers In",
            "QH": "Quantity on Hold",
            "XT": "Protected Quantity"
        },
        "0302": {
            "1": "Inventory",
            "2": "Consignment Inventory",
        }
    };
    // static usage_LIN_QTY_DTM = {
    //     "01": {
    //         // "196": "Time series start",
    //         // "197": "Time series end"
    //         "514": "Transferred"
    //     }
    // }
    // static usage_LIN_QTY_LS = {
    //     "01": {
    //         "REF": "Loop Indicator"
    //     }
    // }
    // static usage_LIN_QTY_REF_REF = {
    //     "01": {
    //         "2I": "Consignment Movement Tracking Number",
    //         "IV": "Invoice Number",
    //         "IX": "Movement Identification Number"
    //     },
    //     "0401": {
    //         "LI": "Line Item Identifier"
    //     }
    // }
    // static usage_LIN_QTY_REF_DTM = {
    //     "01": {
    //         "003": "Invoice",
    //     },
    // }
    // static usage_LIN_QTY_LE = {
    //     "01": {
    //         "REF": "Loop Complete",
    //     },
    // }

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
            "01": "ABA Routing Number",
            "02": "SWIFT Identification Number",
            "03": "CHIPS Participant Identification Number",
            "11": "Account Identification Number",
            "12": "Account Payable Identification Number",
            "3L": "Bank Branch Identification Number",
            "4B": "Loading Point",
            "4C": "Storage Location",
            "4G": "Provincial Tax Identification Number",
            "72": "Buyer Planning Identification Number",
            "8W": "Bank National Identification Number",
            "9S": "Transportation Zone",
            "AEC": "Government Registration Number",
            "AP": "Accounts Receivable Identification Number",
            "BAD": "State Tax Identification Number",
            "D2": "Supplier Reference Number",
            "DD": "Document Name",
            "DNS": "D-U-N-S+4, D-U-N-S Number with Four Character Suffix",
            "DUN": "D-U-N-S Number, Dun & Bradstreet",
            "GT": "GST Registration Identification Number",
            "KK": "cRADCRS Indicator",
            "LU": "Buyer Location Identification Number",
            "TJ": "Federal Tax Identification Number",
            "TX": "Tax Exemption Identification Number",
            "VX": "VAT Identification Number",
            "ZA": "Supplier Additional Identification Number",
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

    static comment_LIN_REF = {
        "0402": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }
    static comment_LIN_UIT = {
        "0101": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }
    static comment_LIN_QTY_QTY = {
        "0301": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
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
                return Info_846_SMI.usage_BIA[ele.designatorIndex]
                break;

            case "ROOT_LIN_LIN":
                return Info_846_SMI.usage_LIN_LIN[ele.designatorIndex]
                break;
            case "ROOT_LIN_PID":
                return Info_846_SMI.usage_LIN_PID[ele.designatorIndex]
                break;
            case "ROOT_LIN_MEA":
                return Info_846_SMI.usage_LIN_MEA[ele.designatorIndex]
                break;

            case "ROOT_LIN_REF":
                return Info_846_SMI.usage_LIN_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_LDT":
                return Info_846_SMI.usage_LIN_LDT[ele.designatorIndex]
                break;

            case "ROOT_LIN_QTY_QTY":
                return Info_846_SMI.usage_LIN_QTY_QTY[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_N1":
                return Info_846_SMI.usage_LIN_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_N4":
                return Info_846_SMI.usage_LIN_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_REF":
                return Info_846_SMI.usage_LIN_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_PER":
                return Info_846_SMI.usage_LIN_N1_PER[ele.designatorIndex]
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
            case "ROOT_LIN_REF":
                return Info_846_SMI.comment_LIN_REF[ele.designatorIndex];
                break;
            case "ROOT_LIN_UIT":
                return Info_846_SMI.comment_LIN_UIT[ele.designatorIndex];
                break;
            case "ROOT_LIN_QTY_QTY":
                return Info_846_SMI.comment_LIN_QTY_QTY[ele.designatorIndex];
                break;
            case "ROOT_LIN_N1_N4":
                return Info_846_SMI.comment_LIN_N1_N4[ele.designatorIndex];
                break;

            default:

        }
        return undefined;
    }
}