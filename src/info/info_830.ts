import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_830 extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BFR = {
        "01": {
            "00": "Original",
        },
        "04": {
            "BB": "Customer Production (Consumption) Based",
        },
        "05": {
            "A": "Actual Discrete Quantities",
        },
    };
    static usage_REF = {
        "01": {
            '06': "System ID Number",
            "44": "End Point Identification Number",
            'PHC': "Process Handling Code",
            "VR": "Vendor Identification Number"
        }
    };
    static usage_LIN_LIN = {
        "02": DocInfoBase.ProductServiceIdQualifierList04,
        "04": DocInfoBase.ProductServiceIdQualifierList04,
        "06": DocInfoBase.ProductServiceIdQualifierList04,
    };
    static usage_LIN_PID = {
        "01": {
            "F": "Free-form",
            "S": "Structured (From Industry Code List)"
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
    static usage_LIN_QTY = {
        "01": {
            "1N": "Scrap allowed",
            "17": "Quantity on Hand",
            "3Y": "Subcontracting Stock Transfer In",
            "33": "Quantity Available for Sale (stock quantity)",
            "37": "Work In Process",
            "57": "Minimum Order Quantity",
            "69": "Incremental Quantity",
            "70": "Maximum Order Quantity",
            "72": "Minimum Stock Level",
            "73": "Maximum Stock Level",
            "77": "Stock Transfers In",
            "IQ": "In-Transit Quantity",
            "QH": "Quantity on Hold",
            "XT": "Protected Quantity",
            "XU": "Reserved"
        },
        "0302": {
            "1": "Inventory",
            "2": "Consignment Inventory"
        }
    };

    static usage_LIN_N1_N1 = {
        "01": {
            "MI": "Planning Schedule Issuer",
            "ST": "Ship To",
            "SU": "Supplier/Manufacturer",
            "Z4": "Owning Inventory Control Point"
        },
        "03": {
            "1": "D-U-N-S Number, Dun & Bradstreet",
            "2": "Standard Carrier Alpha Code (SCAC)",
            "4": "International Air Transport Association (IATA)",
            "29": "Grid Location and Facility Code",
            "92": "Assigned by Buyer or Buyer's Agent"
        }
    };
    static usage_LIN_N1_N4 = {
        "05": {
            "SP": "State/Province",
        },
    };
    static usage_LIN_N1_REF = {
        "01": DocInfoBase.ReferenceIdentificationQualifierList02,
    };
    
    static usage_LIN_N1_PER = {
        "01": {
            "CN":"General Contact"
        },
        "03":DocInfoBase.CommuNumberQualifierList,
        "05":DocInfoBase.CommuNumberQualifierList,
        "07":DocInfoBase.CommuNumberQualifierList
    }
    static usage_LIN_FST_FST = {
        "02": {
            "C":"Confirm",
            "D":"Planning"
        },
        "03":{
            "F":"Flexible Interval (from Date X through Date Y)"
        },
        "08":{
            "REC":"Related Case"
        }
    }

    static comment_LIN_UIT = {
        "0101": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
    }

    static comment_LIN_QTY = {
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
            case "ROOT_BFR":
                return Info_830.usage_BFR[ele.designatorIndex]
                break;
            case "ROOT_REF":
                return Info_830.usage_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_LIN":
                return Info_830.usage_LIN_LIN[ele.designatorIndex]
                break;
            case "ROOT_LIN_PID":
                return Info_830.usage_LIN_PID[ele.designatorIndex]
                break;
            case "ROOT_LIN_MEA":
                return Info_830.usage_LIN_MEA[ele.designatorIndex]
                break;

            case "ROOT_LIN_QTY":
                return Info_830.usage_LIN_QTY[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_N1":
                return Info_830.usage_LIN_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_N4":
                return Info_830.usage_LIN_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_REF":
                return Info_830.usage_LIN_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_LIN_N1_PER":
                return Info_830.usage_LIN_N1_PER[ele.designatorIndex]
                break;
            case "ROOT_LIN_FST_FST":
                return Info_830.usage_LIN_FST_FST[ele.designatorIndex]
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
            case "ROOT_LIN_UIT":
                return Info_830.comment_LIN_UIT[ele.designatorIndex];
                break;
            case "ROOT_LIN_QTY":
                return Info_830.comment_LIN_QTY[ele.designatorIndex];
                break;
            case "ROOT_LIN_N1_N4":
                return Info_830.comment_LIN_N1_N4[ele.designatorIndex];
                break;
            default:

        }
        return undefined;
    }
}