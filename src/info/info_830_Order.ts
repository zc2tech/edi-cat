import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_830_Order extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BFR = {
        "01": {
            "00": "Original",
            "03": "Delete",
            "05": "Update"
        },
        "04": {
            "DL": "Delivery Based",
        },
        "05": {
            "A": "Actual Discrete Quantities",
        },
    };
    static usage_REF = {
        "01": {
            "BC": "Parent Agreement Number",
            "PP": "Order Version",
            "RQ": "Purchase Requisition Number",
            "VN": "Vendor Order Number"
        }
    };
    static usage_DTM = {
        "01": {
            "002": "Delivery Requested",
            "004": "Forecast/Document",
            "007": "Effective",
            "036": "Expiration",
            "070": "Scheduled for Delivery (After and Including)",
            "073": "Scheduled for Delivery (Prior to and Including)",
            "118": "Requested Pick-up"
        }
    };

    static usage_N1_N1 = {
        "01": DocInfoBase.EntityIdentifierCodeList02,
        "03": DocInfoBase.IdentificationCodeQualifierList,
    };

    static usage_N1_N4 = {
        "05": {
            "SP": "State/Province",
        },
    };
    static usage_N1_REF = {
        "01": {
            "01": "ABA Routing Number",
            "02": "SWIFT Identification Number",
            "03": "CHIPS Participant Identification Number",
            "11": "Account Identification Number",
            "12": "Account Payable Identification Number",
            "14": "IBAN Identification Number",
            "3L": "Bank Branch Identification Number",
            "4B": "Loading Point",
            "4C": "Storage Location",
            "4G": "Provincial Tax Identification Number",
            "8W": "Bank National Identification Number",
            "9S": "Transportation Zone",
            "9X": "Account Type",
            "ACT": "Account Name",
            "AEC": "Government Registration Number",
            "AP": "Accounts Receivable Identification Number",
            "BAA": "Supplier Tax Identification Number",
            "BAD": "State Tax Identification Number",
            "BR": "Contact Department Identification Number",
            "D2": "Supplier Reference Number",
            "DD": "Document Name",
            "DNS": "D-U-N-S+4, D-U-N-S Number with Four Character Suffix",
            "DP": "Department Name",
            "DUN": "D-U-N-S Number, Dun & Bradstreet",
            "F8": "Additional Reference Number",
            "GT": "GST Registration Identification Number",
            "KK": "cRADCRS Indicator",
            "LU": "Buyer Location Identification Number",
            "SA": "Contact Person",
            "TJ": "Federal Tax Identification Number",
            "TX": "Tax Exemption Identification Number",
            "VX": "VAT Identification Number",
            "YD": "Buyer Additional Identification Number",
            "ZA": "Supplier Additional Identification Number",
            "ZZ": "Mutually Defined"
        }
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
    }

    static usage_LIN_LIN = {
        "02": DocInfoBase.ProductServiceIdQualifierList02,
        "04": DocInfoBase.ProductServiceIdQualifierList02,
        "06": DocInfoBase.ProductServiceIdQualifierList02,
        "08": DocInfoBase.ProductServiceIdQualifierList02,
        "10": DocInfoBase.ProductServiceIdQualifierList02,
        "12": DocInfoBase.ProductServiceIdQualifierList02,
        "14": DocInfoBase.ProductServiceIdQualifierList02,
        "16": DocInfoBase.ProductServiceIdQualifierList02,
    };
    static usage_LIN_DTM = {
        "01": {
            "002": "Delivery Requested",
            "010": "Requested Ship",
            "LEA": "Agreement"
        }
    };
    static usage_LIN_PID = {
        "01": {
            "F": "Free-form",
        },
        "02": {
            "GEN": "General Description",
            "21": "Forming"
        },
        "09": DocInfoBase.LanguageList
    };

    static usage_LIN_MEA = {
        "01": {
            'PD': "Physical Dimensions",
        },
        "02": DocInfoBase.MeasurementQualifierList
    };

    static usage_LIN_REF = {
        "01": {
            "AH": "Agreement Number",
            "FL": "Fine Line Classification",
            "RQ": "Purchase Requisition Number",
        }
    };
    static usage_LIN_FOB = {
        "02": {
            "OF": "Other Unlisted Free On Board (FOB) Point",
            "ZZ": "Mutually Defined",
        },
        "04": {
            "01": "Incoterms",
        },
        "05": DocInfoBase.TransportationTermsCodeList,
        "06": {
            "ZZ": "Shipping payment method"
        }
    };

    static usage_LIN_QTY = {
        "01": {
            "02": "Cumulated Received Quantity",
            "63": "Order Quantity"
        },
    };
    static usage_LIN_TD5 = {
        "01": {
            "Z": "Mutually Defined",
        },
        "02": {
            "1": "D-U-N-S Number, Dun & Bradstreet",
            "2": "Standard Carrier Alpha Code (SCAC)",
            "4": "International Air Transport Association (IATA)",
            "ZZ": "Mutually Defined",
        },
        "04": {
            "A": "Air",
            "J": "Motor",
            "R": "Rail",
            "S": "Ocean"
        }
    };

    static usage_LIN_N1_N1 = {
        "01": DocInfoBase.EntityIdentifierCodeList,
        "03": DocInfoBase.IdentificationCodeQualifierList02,
    };

    static usage_LIN_N1_N4 = {
        "05": {
            "SP": "State/Province",
        },
    };

    static usage_LIN_N1_REF = {
        "01": {
            "01": "ABA Routing Number",
            "02": "SWIFT Identification Number",
            "03": "CHIPS Participant Identification Number",
            "11": "Account Identification Number",
            "12": "Account Payable Identification Number",
            "14": "IBAN Identification Number",
            "3L": "Bank Branch Identification Number",
            "4B": "Loading Point",
            "4C": "Storage Location",
            "4G": "Provincial Tax Identification Number",
            "8W": "Bank National Identification Number",
            "9S": "Transportation Zone",
            "9X": "Account Type",
            "ACT": "Account Name",
            "AEC": "Government Registration Number",
            "AP": "Accounts Receivable Identification Number",
            "BAA": "Supplier Tax Identification Number",
            "BAD": "State Tax Identification Number",
            "BR": "Contact Department Identification Number",
            "D2": "Supplier Reference Number",
            "DD": "Document Name",
            "DNS": "D-U-N-S+4, D-U-N-S Number with Four Character Suffix",
            "DP": "Department Name",
            "DUN": "D-U-N-S Number, Dun & Bradstreet",
            "F8": "Additional Reference Number",
            "GT": "GST Registration Identification Number",
            "KK": "cRADCRS Indicator",
            "LU": "Buyer Location Identification Number",
            "SA": "Contact Person",
            "TJ": "Federal Tax Identification Number",
            "TX": "Tax Exemption Identification Number",
            "VX": "VAT Identification Number",
            "YD": "Buyer Additional Identification Number",
            "ZA": "Supplier Additional Identification Number",
            "ZZ": "Mutually Defined"
        }
    };
    static usage_LIN_N1_PER = {
        "01": {
            "CN": "General Contact",
            "RE": "Receiving Contact"
        },
        "03": DocInfoBase.CommuNumberQualifierList,
        "05": DocInfoBase.CommuNumberQualifierList,
        "07": DocInfoBase.CommuNumberQualifierList
    }
    static usage_LIN_FST_FST = {
        "02": {
            "C": "Confirm",
            "D": "Planning"
        },
        "03": {
            "D": "Discrete"
        },
    }
    static usage_LIN_FST_QTY = {
        "01": {
            "02": "Cumulated Scheduled Quantity",
        },
    }

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

    static comment_LIN_UIT = {
        "03": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_LIN_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_LIN_MEA = {
        "03": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_LIN_FOB = {
        "01": `**Shipment Method of Payment**\n\n`
            + `Please refer to APPENDIX - [CODELISTS 146 Shipment Method of Payment]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(146)})`,
    }

    static comment_LIN_QTY = {
        "03": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
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

    static comment_LIN_FST_QTY = {
        "0301": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BFR":
                return Info_830_Order.usage_BFR[ele.designatorIndex]
                break;
            case "ROOT_REF":
                return Info_830_Order.usage_REF[ele.designatorIndex]
                break;
            case "ROOT_DTM":
                return Info_830_Order.usage_DTM[ele.designatorIndex]
                break;
            case "ROOT_N1_N1":
                return Info_830_Order.usage_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_N1_N4":
                return Info_830_Order.usage_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_N1_REF":
                return Info_830_Order.usage_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_N1_PER":
                return Info_830_Order.usage_N1_PER[ele.designatorIndex]
                break;
            case "ROOT_LIN_LIN":
                return Info_830_Order.usage_LIN_LIN[ele.designatorIndex]
                break;
            case "ROOT_LIN_DTM":
                return Info_830_Order.usage_LIN_DTM[ele.designatorIndex]
                break;
            case "ROOT_LIN_PID":
                return Info_830_Order.usage_LIN_PID[ele.designatorIndex]
                break;
            case "ROOT_LIN_MEA":
                return Info_830_Order.usage_LIN_MEA[ele.designatorIndex]
                break;
            case "ROOT_LIN_REF":
                return Info_830_Order.usage_LIN_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_FOB":
                return Info_830_Order.usage_LIN_FOB[ele.designatorIndex]
                break;
            case "ROOT_LIN_QTY":
                return Info_830_Order.usage_LIN_QTY[ele.designatorIndex]
                break;
            case "ROOT_LIN_TD5":
                return Info_830_Order.usage_LIN_TD5[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_N1":
                return Info_830_Order.usage_LIN_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_N4":
                return Info_830_Order.usage_LIN_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_REF":
                return Info_830_Order.usage_LIN_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_PER":
                return Info_830_Order.usage_LIN_N1_PER[ele.designatorIndex]
                break;
            case "ROOT_LIN_FST_FST":
                return Info_830_Order.usage_LIN_FST_FST[ele.designatorIndex]
                break;
            case "ROOT_LIN_FST_QTY":
                return Info_830_Order.usage_LIN_FST_QTY[ele.designatorIndex]
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
                return Info_830_Order.comment_DTM[ele.designatorIndex];
                break;
            case "ROOT_N1_N4":
                return Info_830_Order.comment_N1_N4[ele.designatorIndex];
                break;
            case "ROOT_LIN_UIT":
                return Info_830_Order.comment_LIN_UIT[ele.designatorIndex];
                break;
            case "ROOT_LIN_DTM":
                return Info_830_Order.comment_LIN_DTM[ele.designatorIndex];
                break;
            case "ROOT_LIN_MEA":
                return Info_830_Order.comment_LIN_MEA[ele.designatorIndex];
                break;
            case "ROOT_LIN_FOB":
                return Info_830_Order.comment_LIN_FOB[ele.designatorIndex];
                break;
            case "ROOT_LIN_QTY":
                return Info_830_Order.comment_LIN_QTY[ele.designatorIndex];
                break;
            case "ROOT_LIN_N1_N4":
                return Info_830_Order.comment_LIN_N1_N4[ele.designatorIndex];
                break;
            case "ROOT_LIN_FST_QTY":
                return Info_830_Order.comment_LIN_FST_QTY[ele.designatorIndex];
                break;
            default:

        }
        return undefined;
    }
}