import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";

export class Info_856_In extends DocInfoBase {

    static usage_BSN = {
        "01": {
            "00": "Original",
            "03": "Delete",
            "05": "Replace",
        },
        "05": {
            "0001": "Shipment, Order, Packaging, Item*",
            "0002": "Shipment, Order, Item, Packaging*",
            "0004": "Shipment, Order, Item*"
        },
        "06": {
            "PL": "Planned",
            "09": "Actual"
        },
        "07": {
            "B44": "Partial",
            "C20": "Complete"
        }
    };

    static usage_DTM = {
        "01": {
            "002": "Delivery Requested",
            "011": "Shipped",
            "017": "Estimated Delivery",
            "111": "Manifest/Ship Notice",
            "118": "Requested Pick-up"
        }
    };

    static usage_HL_HL = {
        "03": {
            "S": "Shipment",
            "O": "Order",
            "T": "Shipping Tare",
            "P": "Pack",
            "I": "Item",
            "F": "Component",
        },
        "04": {
            "0": "No Subordinate HL Segment in This Hierarchical Structure.",
            "1": "Additional Subordinate HL Data Segment in This Hierarchical Structure."
        }
    };

    static usage_HL_PID = {
        "01": {
            "F": "Free-form"
        },
        "02": {
            "GEN": "General Description"
        },
        "09": DocInfoBase.LanguageList
    };

    static usage_HL_MEA = {
        "01": {
            "PD": "Physical Dimensions"
        },
        "02": DocInfoBase.MeasurementQualifierList
    };

    static usage_HL_TD1 = {
        "06": {
            "G": "Gross Weight",
            "N": "Net Weight"
        }
    };

    static usage_HL_TD5 = {
        "02": {
            "1": "D-U-N-S Number, Dun & Bradstreet",
            "2": "Standard Carrier Alpha Code (SCAC)*",
            "4": "International Air Transport Association (IATA)",
            "ZZ": "Shipping Contract Number"
        },
        "07": {
            "ZZ": "Mutually Defined"
        }
    };

    static usage_HL_TD4 = {
        "01": {
            "ZZ": "Mutually Defined"
        },
        "02": {
            "9": "Title 49, Code of Federal Regulations (CFR)",
            "I": "Intergovernmental Maritime Organization (IMO) Code",
            "U": "United Nations",
        }
    };

    static usage_HL_REF = {
        "01": {
            "0L": "Referenced By (specific Usage)",
            "0N": "Shipping Instructions",
            "AEC": "Government Registration Number",
            "AH": "Contract Number / Agreement Number",
            "BT": "Batch Number",
            "BM": "Bill of Lading Number",
            "CN": "Carrier's Reference Number (PRO/Invoice)",
            "CT": "Shipping Contract Number",
            "CR": "Customer Reference Number",
            "D2": "Supplier Reference Number",
            "DD": "Document Fullfilment Type",
            "DJ": "Delivery Note Number",
            "EU": "Ultimate Customer Reference Number",
            "FL": "Fine Line Classification",
            "IN": "Invoice Number",
            "L1": "Letters or Notes",
            "PD": "Promotion/Deal Number",
            "PO": "Purchase Order Number",
            "URL": "Uniform Resource Locator",
            "VN": "Supplier Order Number",
            "WS": "Warehouse storage location number",
            "ZZ": "Mutually Defined"
        },

        "02": {
            "1": "Schedule Agreement"
        },
        "0401": {
            "0L": "Referenced By/Comment Type/Uniform Recource Locator Name",
            "FL": "Fine Line Classification",
            "L1": "Language Code",
            "URL": "Uniform Resource Locator"
        },
        //"0402": DocInfoBase.LanguageList,
        "0403": {
            "0L": "Comment Type/Uniform Resource Locator"
        },
        "0405": {
            "0L": "Comment Type/Uniform Resource Locator"
        }
    };

    static usage_HL_DTM = {
        "01": {
            "002": "Delivery Requested",
            "004": "Purchase Order",
            "011": "Shipped",
            "017": "Estimated Delivery",
            "036": "Expiration",
            "111": "Manifest/Ship Notice",
            "118": "Requested Pick-up",
            "511": "Shelf Life Expiration",
            "LEA": "Letter of Agreement"
        }
    };

    static usage_HL_FOB = {
        "02": {
            "ZN": "Terms of Delivery",
            "ZZ": "Terms of Delivery, free Text"
        },
        "04": {
            "ZZ": "Transport Terms"
        },
        "05": DocInfoBase.TransportationTermsCodeList,
        "06": {
            "ZZ": "Shipping Payment Method"
        }
    };

    static usage_HL_N1_N4 = {
        "05": {
            "SP": "State/Province",
        }
    };

    static usage_HL_N1_N1 = {
        "01": DocInfoBase.EntityIdentifierCodeList,
        "03": DocInfoBase.IdentificationCodeQualifierList05
    };

    static usage_HL_N1_REF = {
        "01": DocInfoBase.ReferenceIdentificationQualifierList,
    };
    static usage_HL_N1_PER = {
        "01": {
            "CN": "General Contact",
        },
        "03": DocInfoBase.CommuNumberQualifierList,
        "05": DocInfoBase.CommuNumberQualifierList,
        "07": DocInfoBase.CommuNumberQualifierList,
    };

    static usage_HL_CUR = {
        "01": {
            "BY": "Buying Party (Purchaser)",
            "SE": "Selling Party"
        },
        "02": DocInfoBase.CurrencyList
    };
    static usage_HL_MAN = {
        "01": {
            "CA": "Shipper-Assigned Case Number",
            "L": "Line Item Only",
            "GM": "SSCC-18 and Application Identifier",
            "ZZ": "Mutually Defined"
        },
        "02": {
            "SN": "Serial Number",
            "AT": "Tag Number"
        },
        "04": {
            "L": "Line Item Only"
        },
        "05": {
            "SN": "Serial Number",
            "AT": "Tag Number"
        }
    };

    static usage_HL_SLN = {
        "03": {
            "O": "Information Only"
        },
    };

    static usage_HL_LIN = {
        "02": DocInfoBase.ProductServiceIdQualifierList10,
        "04": DocInfoBase.ProductServiceIdQualifierList10,
        "06": DocInfoBase.ProductServiceIdQualifierList10,
        "08": DocInfoBase.ProductServiceIdQualifierList10,
        "10": DocInfoBase.ProductServiceIdQualifierList10,
    };

    static comment_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_HL_MEA = {
        "0401": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }
    static comment_HL_TD1 = {
        "01": `**Packaging Code**\n\nCode identifying the type of packaging (3 or 3+2 characters)`
            + ` If the Data Element is used, then Part 1 is always required.`
            + `\n\nPart 1 (1-3): Packaging Form - mandatory`
            + `\n\nPart 2 (4-5): Packaging Material - optional`
            + `\n\nPlease refer to  APPENDIX - [CODELISTS 103 Packaging Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(103)})`,
        "08": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_HL_TD5 = {
        "03": `**Identification Code**\n\n(TD502=1/2/4) Carrier identification number `
            + `\n\n(TD502=ZZ) Shipping contract number`,
        "04": `**Transportation Method/Type Code**`
            + `\n\nPlease refer to  APPENDIX - [CODELISTS 91 Transportation Method/Type Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(91)})`,
        "12": `**Service Level Code**`
            + `\n\nPlease refer to  APPENDIX - [CODELISTS 284 Service Level Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(284)})`,
        "13": `**Service Level Code**`
            + `\n\nPlease refer to  APPENDIX - [CODELISTS 284 Service Level Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(284)})`,
        "14": `**Service Level Code**`
            + `\n\nPlease refer to  APPENDIX - [CODELISTS 284 Service Level Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(284)})`,
    }

    static comment_HL_TD3 = {
        "01": `**Equipment Description Code**`
            + `\n\nCode identifying type of equipment used for the shipment.`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 40 Equipment Description Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(40)})`,
    }
    static comment_HL_REF = {
        "0402": `**Document date**`
            + `\n\nDate expressed as format CCYYMMDDHHMMSS[timezone]\n\n[timezone] = Please refer to APPENDIX - `
            + `[CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_HL_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_HL_FOB = {
        "01": `**Shipment Method of Payment**\n\n`
            + `Please refer to APPENDIX - [CODELISTS 146 Shipment Method of Payment]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(146)})`,
    }

    static comment_HL_N1_N4 = {
        "02": `**Party state or province code**\n\nFor addresses in the United States or Canada, `
            + `use the two letter digraph recognized by the United States Postal Service or Canada Post. `
            + `Please refer to APPENDIX - [CODELISTS 156 State or Province Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(156)})`,
        "04": `**Party country code**\n\nIdentification of the name of the country or other geographical entity, `
            + `use ISO 3166 two alpha country code. Please refer to APPENDIX - [CODELISTS 26 Country Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(26)})`,
        "06": `**Party state or province code**\n\nFor addresses except in the United States or Canada.`
    }
    static comment_HL_PO4 = {
        "03": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
        "04": `**Packaging Code**\n\nCode identifying the type of packaging (3 or 3+2 characters)`
            + ` If the Data Element is used, then Part 1 is always required.`
            + `\n\nPart 1 (1-3): Packaging Form - mandatory`
            + `\n\nPart 2 (4-5): Packaging Material - optional`
            + `\n\nPlease refer to  APPENDIX - [CODELISTS 103 Packaging Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(103)})`,
        "07": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
        "09": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
        "13": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,

    }
    static comment_HL_SN1 = {
        "03": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): object {

        switch (seg.astNode.fullPath) {
            case "ROOT_BSN":
                return Info_856_In.usage_BSN[ele.designatorIndex]
                break;
            case "ROOT_DTM":
                return Info_856_In.usage_DTM[ele.designatorIndex]
                break;
            case "ROOT_HL_HL":
                return Info_856_In.usage_HL_HL[ele.designatorIndex]
                break;
            case "ROOT_HL_PID":
                return Info_856_In.usage_HL_PID[ele.designatorIndex]
                break;
            case "ROOT_HL_MEA":
                return Info_856_In.usage_HL_MEA[ele.designatorIndex]
                break;
            case "ROOT_HL_TD1":
                return Info_856_In.usage_HL_TD1[ele.designatorIndex]
                break;
            case "ROOT_HL_TD5":
                return Info_856_In.usage_HL_TD5[ele.designatorIndex]
                break;
            case "ROOT_HL_TD4":
                return Info_856_In.usage_HL_TD4[ele.designatorIndex]
                break;
            case "ROOT_HL_REF":
                return Info_856_In.usage_HL_REF[ele.designatorIndex]
                break;
            case "ROOT_HL_DTM":
                return Info_856_In.usage_HL_DTM[ele.designatorIndex]
                break;
            case "ROOT_HL_FOB":
                return Info_856_In.usage_HL_FOB[ele.designatorIndex]
                break;
            case "ROOT_HL_N1_N1":
                return Info_856_In.usage_HL_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_HL_N1_N4":
                return Info_856_In.usage_HL_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_HL_N1_REF":
                return Info_856_In.usage_HL_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_HL_N1_PER":
                return Info_856_In.usage_HL_N1_PER[ele.designatorIndex]
                break;
            case "ROOT_HL_CUR":
                return Info_856_In.usage_HL_CUR[ele.designatorIndex]
                break;
            case "ROOT_HL_MAN":
                return Info_856_In.usage_HL_MAN[ele.designatorIndex]
                break;
            case "ROOT_HL_LIN":
                return Info_856_In.usage_HL_LIN[ele.designatorIndex]
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
                return Info_856_In.comment_DTM[ele.designatorIndex];
                break;
            case "ROOT_HL_MEA":
                return Info_856_In.comment_HL_MEA[ele.designatorIndex];
                break;
            case "ROOT_HL_TD1":
                return Info_856_In.comment_HL_TD1[ele.designatorIndex];
                break;
            case "ROOT_HL_TD5":
                return Info_856_In.comment_HL_TD5[ele.designatorIndex];
                break;
            case "ROOT_HL_TD3":
                return Info_856_In.comment_HL_TD3[ele.designatorIndex];
                break;
            case "ROOT_HL_REF":
                return Info_856_In.comment_HL_REF[ele.designatorIndex];
                break;
            case "ROOT_HL_DTM":
                return Info_856_In.comment_HL_DTM[ele.designatorIndex];
                break;
            case "ROOT_HL_FOB":
                return Info_856_In.comment_HL_FOB[ele.designatorIndex];
                break;
            case "ROOT_HL_N1_N4":
                return Info_856_In.comment_HL_N1_N4[ele.designatorIndex];
                break;
            case "ROOT_HL_PO4":
                return Info_856_In.comment_HL_PO4[ele.designatorIndex];
                break;
            case "ROOT_HL_SN1":
                return Info_856_In.comment_HL_SN1[ele.designatorIndex];
                break;

            default:

        }
        return undefined;
    }
}