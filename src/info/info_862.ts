import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_862 extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BSS = {
        "01": {
            "00": "Original",
            "03": "Delete",
            "05": "Replace"
        },
        "02": {
            "BK": "Blanket Order",
            "DS": "Drop Ship",
            "IN": "Information Copy",
            "KN": "Purchase Order",
            "NE": "New Order",
            "RL": "Release Order",
            "RO": "Rush Order"
        },
        "04": {
            "BB": "Customer Production (Consumption) Based"
        }
    };

    static usage_DTM = {
        "01": {
            "002": "Delivery Requested",
            "004": "Purchase Order",
            "007": "Effective",
            "036": "Expiration",
            "070": "Scheduled for Delivery (After and Including)",
            "073": "Scheduled for Delivery (Prior to and Including)",
            "118": "Requested Pick-up",
            "171": "Revision",
            "707": "Last Payment Made",
            "983": "Tax Point"
        }
    };

    static usage_N1_N1 = {
        "01": DocInfoBase.EntityIdentifierCodeList,
        "03": DocInfoBase.IdentificationCodeQualifierList02,
    };

    static usage_N1_N4 = {
        "05": {
            "SP": "State/Province",
        },
    };

    static usage_N1_REF = {
        "01": DocInfoBase.ReferenceIdentificationQualifierList02,
    };

    static usage_N1_PER = {
        "01": {
            "AP": "Accounts Payable Department",
            "CN": "General Contact",
            "RE": "Receiving Contact"
        },
        "03": DocInfoBase.CommuNumberQualifierList,
        "05": DocInfoBase.CommuNumberQualifierList,
        "07": DocInfoBase.CommuNumberQualifierList
    };

    static usage_N1_FOB = {
        "04": {
            "ZZ": "Transport Terms"
        },
        "05": DocInfoBase.TransportationTermsCodeList,
    };

    static usage_LIN_LIN = {
        "02": DocInfoBase.ProductServiceIdQualifierList02,
        "04": DocInfoBase.ProductServiceIdQualifierList02,
        "06": DocInfoBase.ProductServiceIdQualifierList02,
        "08": DocInfoBase.ProductServiceIdQualifierList02,
        "10": DocInfoBase.ProductServiceIdQualifierList02,
        "12": DocInfoBase.ProductServiceIdQualifierList02,
        "14": DocInfoBase.ProductServiceIdQualifierList02,
        "16": DocInfoBase.ProductServiceIdQualifierList02,
        "18": DocInfoBase.ProductServiceIdQualifierList02,
    };

    static usage_LIN_PKG = {
        "01": {
            "F": "Free-form"
        },
        "02": {
            "01": "Casing Type",
        },
        "03": {
            "ZZ": "Mutually Defined"
        }
    };

    static usage_LIN_QTY = {
        "01": {
            "38": "Original Quantity"
        },
    };
    static usage_LIN_REF = {
        "01": {
            "CT": "Contract Number",
            "D2": "Supplier Document Identification Number",
            "FL": "Fine Line Classification",
            "LT": "Buyer Batch Number",
            "RQ": "Purchase Requisition Number",
            "S1": "Customer Reference Number",
            "SE": "Serial Number",
            "ZA": "Supplier",
            "ZG": "Sales Order Number",
            "ZZ": "Mutually Defined"
        }
    };

    static usage_LIN_PER = {
        "01": {
            "SC": "Schedule Contact"
        },
    };
    static usage_LIN_FST_FST = {
        "02": {
            "B": "Tradeoff",
            "C": "Firm",
            "D": "Planning"
        },
        "03": {
            "Z": "Mutually Defined"
        },
        "08": {
            "BV": "Purchase Order Line Item Identifier (Buyer)"
        }
    };

    static usage_LIN_FST_DTM = {
        "01": {
            "002": "Delivery Requested",
            "011": "Shipped",
            "017": "Estimated Delivery"
        }
    };

    static usage_LIN_SHP_SHP = {
        "01": {
            "87": "Quantity Received",
            "90": "Received Quantity",
        },
        "03": {
            "111": "Manifest/Ship Notice",
            "405": "Production",
        }
    };

    static usage_LIN_SHP_REF = {
        "01": {
            "DO": "Delivery Note Number",
            "KK": "Proof of Delivery Number",
            "MA": "Despatch Advise Number",
            "RV": "Receiving Number",
            "ZZ": "Mutually Defined"
        },
    };

    static usage_LIN_TD5 = {
        "01": {
            "Z": "Mutually Defined",
        },
        "02": {
            // "1": "D-U-N-S Number, Dun & Bradstreet",
            // "2": "Standard Carrier Alpha Code (SCAC)",
            // "4": "International Air Transport Association (IATA)",
            "ZZ": "Mutually Defined",
        },
        "04": {
            "A": "Air",
            "J": "Motor",
            "R": "Rail",
            "S": "Ocean"
        },
        "07": {
            "ZZ": "Mutually Defined"
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

    static comment_N1_FOB = {
        "01": `**Shipment Method of Payment**\n\n`
            + `Please refer to APPENDIX - [CODELISTS 146 Shipment Method of Payment]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(146)})`,
    }

    static comment_LIN_UIT = {
        "0101": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_LIN_FST_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_LIN_FST_SDQ = {
        "01": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
        "03":`Hardcoded to "CUMULATIVE SCHEDULED QTY"`,
        "05":`Hardcoded to "RECEIVED QTY"`
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BSS":
                return Info_862.usage_BSS[ele.designatorIndex]
                break;
            case "ROOT_DTM":
                return Info_862.usage_DTM[ele.designatorIndex]
                break;
            case "ROOT_N1_N1":
                return Info_862.usage_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_N1_N4":
                return Info_862.usage_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_N1_REF":
                return Info_862.usage_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_N1_PER":
                return Info_862.usage_N1_PER[ele.designatorIndex]
                break;
            case "ROOT_N1_FOB":
                return Info_862.usage_N1_FOB[ele.designatorIndex]
                break;
            case "ROOT_LIN_LIN":
                return Info_862.usage_LIN_LIN[ele.designatorIndex]
                break;
            case "ROOT_LIN_PKG":
                return Info_862.usage_LIN_PKG[ele.designatorIndex]
                break;
            case "ROOT_LIN_QTY":
                return Info_862.usage_LIN_QTY[ele.designatorIndex]
                break;
            case "ROOT_LIN_REF":
                return Info_862.usage_LIN_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_PER":
                return Info_862.usage_LIN_PER[ele.designatorIndex]
                break;
            case "ROOT_LIN_FST_FST":
                return Info_862.usage_LIN_FST_FST[ele.designatorIndex]
                break;
            case "ROOT_LIN_FST_DTM":
                return Info_862.usage_LIN_FST_DTM[ele.designatorIndex]
                break;
            case "ROOT_LIN_SHP_SHP":
                return Info_862.usage_LIN_SHP_SHP[ele.designatorIndex]
                break;
            case "ROOT_LIN_SHP_REF":
                return Info_862.usage_LIN_SHP_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_TD5":
                return Info_862.usage_LIN_TD5[ele.designatorIndex]
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
                return Info_862.comment_DTM[ele.designatorIndex];
                break;
           case "ROOT_N1_N4":
                return Info_862.comment_N1_N4[ele.designatorIndex];
                break;
           case "ROOT_N1_FOB":
                return Info_862.comment_N1_FOB[ele.designatorIndex];
                break;
           case "ROOT_LIN_UIT":
                return Info_862.comment_LIN_UIT[ele.designatorIndex];
                break;
           case "ROOT_LIN_FST_DTM":
                return Info_862.comment_LIN_FST_DTM[ele.designatorIndex];
                break;
           case "ROOT_LIN_FST_SDQ":
                return Info_862.comment_LIN_FST_SDQ[ele.designatorIndex];
                break;

            default:

        }
        return undefined;
    }
}