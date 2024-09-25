import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_DELFOR_Order extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "241": "Delivery schedule",
        },
        "1225": {
            "25": "Forecast",
        },
        "4343": {
            "AB": "Message acknowledgement",
        },
    };

    static usage_DTM = {
        "2005": {
            "2": "Delivery date/time, requested",
            "4": "Order date/time",
            "7": "Effective date/time",
            "36": "Expiry date",
            "63": "Delivery date/time, latest",
            "64": "Delivery date/time, earliest",
            "137": "Document/message date/time",
            "200": "Pick-up/collection date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier,
    };
    static usage_SG1_RFF = {
        "1153": {
            "AGI": "Request number",
            "AIU": "Charge card account number",
            "BC": "Parent agreement number",
            "CT": "Contract number / Agreement number",
            "IT": "Ariba Network ID",
            "ON": "Purchase order number",
            "RE": "Release number",
            "VN": "Supplier order number"
        },
    };
    static usage_SG1_DTM = {
        "2005": {
            "4": "Purchase order date/time",
            "8": "Supplier order date/time",
            "36": "Expiry date",
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_SG2_NAD = {
        "3035": DocInfoBase.PartyQualifier,
        "3055": DocInfoBase.ResponsibleAgency,
    };

    static usage_SG2_SG3_CTA = {
        "3139": DocInfoBase.ContactFunction,
    };

    static usage_SG2_SG3_COM = {
        "3155": DocInfoBase.CommuChannelQualifier,
    };

    static usage_UNS = {
        "0081": {
            "D": "Header/detail section separation",
        },
    };

    static usage_SG4_NAD = {
        "3035": {
            "ST": "Ship to",
        },
        "3055": DocInfoBase.ResponsibleAgency,
    };

    // static usage_SG4_LOC = {
    //     "3227": {
    //         "7": "Place of delivery",
    //     },
    // };

    static usage_SG4_SG6_CTA = {
        "3139": {
            "GR": "Goods receiving contact",
        },
    };
    static usage_SG4_SG6_COM = {
        "3155": DocInfoBase.CommuChannelQualifier,
    };
    static usage_SG4_SG7_TDT = {
        "8051": {
            "20": "Main-carriage transport"
        },
        "8067": {
            "10": "Maritime transport",
            "20": "Rail transport",
            "30": "Road transport",
            "40": "Air transport"
        },
        "8457": {
            "ZZZ": "Mutually defined"
        },
        "8459": {
            "ZZZ": "Mutually defined"
        }
    };

    static usage_SG4_SG8_LIN = {
        "7143": {
            "VN": "Suppliers part number"
        },
        "5495": {
            "1": "Sub-line information"
        }
    };
    static usage_SG4_SG8_PIA = {
        "4347": {
            "1": "Additional identification",
            "5": "Product identification"
        },
        "7143": DocInfoBase.ItemNumberType02
    };

    static usage_SG4_SG8_IMD = {
        "7077": {
            "B": "Code and text",
            "E": "Free-form short description",
            "F": "Free-form",

        },
        "3453": DocInfoBase.LanguageList,
        "7081": {
            "13": "Quality",
            "35": "Colour",
            "38": "Grade",
            "98": "Size"
        },
        "7009": {
            "ACA": "Classification"
        },
    };

    static usage_SG4_SG8_MEA = {
        "6311": {
            "AAE": "Measurement"
        },
        "6313":DocInfoBase.MeasurementDimension
    }

    static usage_SG4_SG8_GIR = {
        "7297": {
            "1": "Product"
        },
        "7405": {
            "BN": "Serial number"
        },
    }

    static usage_SG4_SG8_DTM = {
        "2005": {
            "2": "Delivery date/time, requested",
            "10": "Shipment date/time, requested"
        },

        "2379": DocInfoBase.TimeFormatQualifier
    };
    static usage_SG4_SG8_FTX = {
        "4451": {
            "AAI": "General information",
            "ACB": "Additional information",
            "ZZZ": "Mutually defined"
        },
        "3454": DocInfoBase.LanguageList
    };

    static usage_SG4_SG8_SG10_RFF = {
        "1153": {
            "AGI": "Request number",
            "CT": "Agreement number",
            "FI": "File line identifier",
            "MF": "Manufacturer name",
            "VR": "Vendor ID number"
        },

        // "1154": {
        //     "active": "",
        //     "inactive": "",
        //     "deleted": ""
        // }
    };

    static usage_SG4_SG8_SG10_DTM = {
        "2005": {
            "126": "Agreement date",
        },
        "2379": DocInfoBase.TimeFormatQualifier
    }

    static usage_SG4_SG8_SG12_QTY = {
        "6063": {
            "1": "Discrete quantity",
            "3": "Cumulative quantity",
            "21": "Ordered quantity",
            "48": "Received quantity",
            "70": "Cumulative quantity received"
        },
    };

    static usage_SG4_SG8_SG12_SCC = {
        "4017": {
            "1": "Firm",
            "4": "Planning/forecast",
            "26": "Tradeoff"
        }
    };
    static usage_SG4_SG8_SG12_DTM = {
        "2005": {
            "2": "Delivery date/time, requested",
            "10": "Shipment date/time, requested",
            "111": "Manifest/ship notice date"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };
    static usage_SG4_SG8_SG12_SG13_RFF = {
        "1153": {
            "AEH": "Delivery date/time, latest/Time series type",
            "MA": "Ship notice/manifest number"
        },
    };
    static usage_FTX = {
        "4451": {
            "AAI": "General information",
            "ACB": "Additional information",
            "ZZZ": "Mutually defined"
        },
        "3453": DocInfoBase.LanguageList
    };

    static comment_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }
    static comment_SG1_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    static comment_SG2_NAD = {
        "3207": DocInfoBase.codelists3207,
    }
    static comment_SG4_NAD = {
        "3207": DocInfoBase.codelists3207,
    }

    static comment_SG4_SG8_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }
    static comment_SG4_SG8_SG10_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }
    static comment_SG4_SG8_SG12_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }


    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGM":
                return Info_DELFOR_Order.usage_BGM[ele.getSchemaId()]
                break;
            case "ROOT_DTM":
                return Info_DELFOR_Order.usage_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG1_RFF":
                return Info_DELFOR_Order.usage_SG1_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_DELFOR_Order.usage_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG2_NAD":
                return Info_DELFOR_Order.usage_SG2_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_CTA":
                return Info_DELFOR_Order.usage_SG2_SG3_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_COM":
                return Info_DELFOR_Order.usage_SG2_SG3_COM[ele.getSchemaId()]
                break;
            case "ROOT_UNS":
                return Info_DELFOR_Order.usage_UNS[ele.getSchemaId()]
                break;
            case "ROOT_SG4_NAD":
                return Info_DELFOR_Order.usage_SG4_NAD[ele.getSchemaId()]
                break;
            // case "ROOT_SG4_LOC":
            //     return Info_DELFOR_Order.usage_SG4_LOC[ele.getSchemaId()]
            //     break;
            case "ROOT_SG4_SG6_CTA":
                return Info_DELFOR_Order.usage_SG4_SG6_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG6_COM":
                return Info_DELFOR_Order.usage_SG4_SG6_COM[ele.getSchemaId()]
                break;

            case "ROOT_SG4_SG7_TDT":
                return Info_DELFOR_Order.usage_SG4_SG7_TDT[ele.getSchemaId()]
                break;

            case "ROOT_SG4_SG8_LIN":
                return Info_DELFOR_Order.usage_SG4_SG8_LIN[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_PIA":
                return Info_DELFOR_Order.usage_SG4_SG8_PIA[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_IMD":
                return Info_DELFOR_Order.usage_SG4_SG8_IMD[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_MEA":
                return Info_DELFOR_Order.usage_SG4_SG8_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_GIR":
                return Info_DELFOR_Order.usage_SG4_SG8_GIR[ele.getSchemaId()]
                break;

            case "ROOT_SG4_SG8_DTM":
                return Info_DELFOR_Order.usage_SG4_SG8_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_FTX":
                return Info_DELFOR_Order.usage_SG4_SG8_FTX[ele.getSchemaId()]
                break;


            case "ROOT_SG4_SG8_SG10_RFF":
                return Info_DELFOR_Order.usage_SG4_SG8_SG10_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG10_DTM":
                return Info_DELFOR_Order.usage_SG4_SG8_SG10_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG12_QTY":
                return Info_DELFOR_Order.usage_SG4_SG8_SG12_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG12_SCC":
                return Info_DELFOR_Order.usage_SG4_SG8_SG12_SCC[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG12_DTM":
                return Info_DELFOR_Order.usage_SG4_SG8_SG12_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG12_SG13_RFF":
                return Info_DELFOR_Order.usage_SG4_SG8_SG12_SG13_RFF[ele.getSchemaId()]
                break;
            case "ROOT_FTX":
                return Info_DELFOR_Order.usage_FTX[ele.getSchemaId()]
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
                return Info_DELFOR_Order.comment_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_DELFOR_Order.comment_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG2_NAD":
                return Info_DELFOR_Order.comment_SG2_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG4_NAD":
                return Info_DELFOR_Order.comment_SG4_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_DTM":
                return Info_DELFOR_Order.comment_SG4_SG8_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG10_DTM":
                return Info_DELFOR_Order.comment_SG4_SG8_SG10_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG12_DTM":
                return Info_DELFOR_Order.comment_SG4_SG8_SG12_DTM[ele.getSchemaId()]
                break;

            default:

        }
        return undefined;
    }
}