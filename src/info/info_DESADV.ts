import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";

export class Info_DESADV extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "345": "Ready for despatch advice",
            "351": "Despatch advice",
        },
        "1131": {
            "ZZZ": "Mutually defined"
        },
        "3055": {
            "ZZZ": "Mutually defined"
        },
        "1225": {
            "3": "Deletion",
            "4": "Change (update, future use)",
            "5": "Replace (update, future use)",
            "9": "Original"
        },
        "4343": {
            "CA": "Planned",
            "AP": "Actual"
        }

    };
    static usage_DTM = {
        "2005": {
            "2": "Delivery date/time, requested",
            "11": "Despatch date, and or time",
            "17": "Delivery date/time, estimated",
            "124": "Despatch advice date",
            "137": "Document/message date/time",
            "200": "Pick-up/collection date/time of cargo"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_MEA = {
        "6311": {
            "AAE": "Measurement"
        },
        "6313": DocInfoBase.MeasurementDimension,
        "6411": DocInfoBase.MeasureUnit,
    };

    static usage_SG1_RFF = {
        "1153": {
            "AAN": "Delivery schedule number",
            "AEU": "Supplier reference number",
            "CR": "Customer reference number",
            "CT": "Agreement number",
            "DM": "Document name",
            "DQ": "Delivery note number",
            "GN": "Government registration number",
            "IV": "Invoice number",
            "ON": "Purchase order number",
            "VN": "Supplier order number",
            "UC": "Ultimate customer's reference number"
        },
        "1156": {
            "1": "Schedule agreement"
        }
    };

    static usage_SG1_DTM = {
        "2005": {
            "4": "Order date/time",
            "126": "Contract/Agreement date",
            "171": "Reference date/time*"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };
    static usage_SG2_NAD = {
        "3035": DocInfoBase.PartyQualifier,
        "3055": DocInfoBase.ResponsibleAgency
    };
    static usage_SG2_SG3_RFF = {
        "1153": DocInfoBase.ReferenceQualifier
    };

    static usage_SG2_SG4_CTA = {
        "3139": {
            "DL": "Delivery contact*",
            "IC": "Information contact",
        },
    };
    static usage_SG2_SG4_COM = {
        "3155": DocInfoBase.CommuChannelQualifier3
    };
    static usage_SG5_TOD = {
        "4055": DocInfoBase.TermsOfDelivery,
        "4053": this.TransportationTermsCodeList02
    };

    static usage_SG5_FTX = {
        "4451": {
            "AAI": "Terms of delivery, general",
            "AAR": "Terms of delivery, specific",
            "SSR": "Service level information"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG6_TDT = {
        "8051": {
            "20": "Main-carriage transport",
        },
        "8067": {
            "ZZZ": ""
        },
        "8179": {
            "6": "Aircraft (any kind of flight transport)",
            "11": "Ship (any kind of marine transport)",
            "23": "Rail bulk car (any kind of train or rail service)",
            "31": "Truck (any kind of road transport)"
        },
        "3055": DocInfoBase.ResponsibleAgency,
        "8457": {
            "ZZZ": "Mutually defined"
        },
        "8459": {
            "ZZZ": "Mutually defined"
        }
    };

    static usage_SG6_SG7_LOC = {
        "3227": {
            "92": "Tracking",
            "ZZZ": "Shipping Instructions"
        },
    };
    static usage_SG6_SG7_DTM = {
        "2005": {
            "171": "Reference date/time",
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_SG8_EQD = {
        "8053": {
            "TE": "Trailer",
        },
    };
    static usage_SG8_MEA = {
        "6311": {
            "AAE": "Measurement",
        },
        "6313": DocInfoBase.MeasurementDimension,
        "6411": DocInfoBase.MeasureUnit
    };

    static usage_SG8_SEL = {
        "1153": {
            "CA": "Carrier",
            "CU": "Customs",
            "SH": "Shipper",
            "TO": "Terminal operator"
        }
    };

    static usage_SG10_CPS = {
        "7075": {
            "3": "Outer",
            "1": "Inner",
            "4": "No packaging hierarchy",
        },
    };

    static usage_SG10_FTX = {
        "4451": {
            "AAI": "General information",
            "ZZZ": "Mutually defined"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG10_SG11_MEA = {
        "6311": {
            "AAE": "Measurement",
        },
        "6313": DocInfoBase.MeasurementDimension,
        "6411": DocInfoBase.MeasureUnit
    };

    static usage_SG10_SG11_QTY = {
        "6063": {
            "52": "Quantity per pack",
        },
        "6411": {
            "EA": "each"
        }
    };

    static usage_SG10_SG11_SG13_PCI = {
        "4233": {
            "30": "Mark serial shipping container code",
            "ZZZ": "Mark global individual asset identifier",
        },
    };
    static usage_SG10_SG11_SG13_SG14_GIN = {
        "7405": {
            "AW": "Serial Shipping Container Code (SSCC)",
            "BJ": "Serial Shipping Container Code (SSCC)",
            "ML": "Marking/label number"
        },
    };
    static usage_SG10_SG15_LIN = {
        "7143": {
            "PL": "Purchase order line number",
        },
        "5495": {
            "1": "Sub-line information",
        },
    };
    static usage_SG10_SG15_PIA = {
        "4347": {
            "1": "Additional identification",
            "5": "Product identification",
        },
        "7143": DocInfoBase.ItemNumberType03,
        "3055": DocInfoBase.ResponsibleAgency02
    };

    static usage_SG10_SG15_IMD = {
        "7077": {
            "B": "Code and text",
            "E": "Free-form short description",
            "F": "Free-form",
        },
        "7081": {
            "13": "Quality",
            "35": "Colour",
            "38": "Grade",
            "79": "Other physical description",
            "98": "Size"
        },
        "7009": {
            "ACA": "Classification"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG10_SG15_MEA = {
        "6311": {
            "AAE": "Measurement",
        },
        "6313": DocInfoBase.MeasurementDimension,
        "6411": DocInfoBase.MeasureUnit
    };

    static usage_SG10_SG15_QTY = {
        "6063": {
            "12": "Despatch quantity",
            "21": "Ordered quantity",
            "192": "Free goods quantity",
        },
        "6411": {
            "EA": "each"
        }
    };

    static usage_SG10_SG15_GIR = {
        "7297": {
            "1": "Product"
        },
        "7405": {
            "AN": "Manufacturing reference number",
            "AP": "Tag Number",
            "BN": "Serial number",
        }
    }

    static usage_SG10_SG15_DTM = {
        "2005": {
            "36": "Expiry date",
            "361": "Best before date"
        },
        "2379": {
            "102": "CCYYMMDD"
        }
    }

    static usage_SG10_SG15_FTX = {
        "4451": {
            "AAI": "Terms of delivery, general",
            "ZZZ": "Mutually defined"
        },
        "3453": DocInfoBase.LanguageList
    };
    static usage_SG10_SG15_MOA = {
        "5025": {
            "146": "Unit price",
        },
        "6345": DocInfoBase.CurrencyList
    };

    static usage_SG10_SG15_SG16_RFF = {
        "1153": {
            "CT": "Agreement number",
            "LI": "Line item reference number",
            "ON": "Purchase order number",
            "ZZZ": "Mutually defined reference number"
        },
        "1156": {
            "1": "Schedule agreement"
        }
    };

    static usage_SG10_SG15_SG16_DTM = {
        "2005": {
            "4": "Order date/time",
            "126": "Contract/Agreement date",
            "171": "Reference date/time*"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    }

    static usage_SG10_SG15_SG20_PCI = {
        "4233": {
            "10": "Mark batch number",
            "24": "Shipper assigned",
            "30": "Mark serial shipping container code"
        },
    };
    static usage_SG10_SG15_SG20_DTM = {
        "2005": {
            "36": "Expiry date",
            "94": "Production/manufacture date",
            "351": "Inspection date",
            "361": "Best before date"
        },
        "2379": {
            "102": "CCYYMMDD"
        }
    };

    static usage_SG10_SG15_SG20_QTY = {
        "6063": {
            "12": "Despatch quantity",
            "52": "Quantity per pack"
        },
    };

    static usage_SG10_SG15_SG20_MEA = {
        "6311": {
            "AAE": "Measurement",
        },
        "6313": DocInfoBase.MeasurementDimension,
        "6411": DocInfoBase.MeasureUnit
    };

    static usage_SG10_SG15_SG20_SG21_GIN = {
        "7405": {
            "AW": "Serial Shipping Container Code (SSCC)",
            "BJ": "Serial Shipping Container Code (SSCC)",
        },
    };

    static usage_SG10_SG15_SG23_QVR = {
        "6063": {
            "21": "Ordered quantity",
        },
        "4221": {
            "BP": "Shipment partial - back order to follow",
        },
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
    static comment_SG5_TOD = {
        "4215": DocInfoBase.codelists4215,
    }
    static comment_SG6_SG7_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }
    static comment_SG10_SG11_PAC = {
        "7065": DocInfoBase.codelists7065,
    }

    static comment_SG10_SG15_SG16_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    public getUsage(seg: EdiSegment, ele: EdiElement) {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGM":
                return Info_DESADV.usage_BGM[ele.getSchemaId()]
                break;
            case "ROOT_DTM":
                return Info_DESADV.usage_DTM[ele.getSchemaId()]
                break;
            case "ROOT_MEA":
                return Info_DESADV.usage_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG1_RFF":
                return Info_DESADV.usage_SG1_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_DESADV.usage_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG2_NAD":
                return Info_DESADV.usage_SG2_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_RFF":
                return Info_DESADV.usage_SG2_SG3_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG4_CTA":
                return Info_DESADV.usage_SG2_SG4_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG4_COM":
                return Info_DESADV.usage_SG2_SG4_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG5_TOD":
                return Info_DESADV.usage_SG5_TOD[ele.getSchemaId()]
                break;
            case "ROOT_SG5_FTX":
                return Info_DESADV.usage_SG5_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG6_TDT":
                return Info_DESADV.usage_SG6_TDT[ele.getSchemaId()]
                break;
            case "ROOT_SG6_SG7_LOC":
                return Info_DESADV.usage_SG6_SG7_LOC[ele.getSchemaId()]
                break;
            case "ROOT_SG6_SG7_DTM":
                return Info_DESADV.usage_SG6_SG7_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG8_EQD":
                return Info_DESADV.usage_SG8_EQD[ele.getSchemaId()]
                break;
            case "ROOT_SG8_MEA":
                return Info_DESADV.usage_SG8_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG8_SEL":
                return Info_DESADV.usage_SG8_SEL[ele.getSchemaId()]
                break;
            case "ROOT_SG10_CPS":
                return Info_DESADV.usage_SG10_CPS[ele.getSchemaId()]
                break;
            case "ROOT_SG10_FTX":
                return Info_DESADV.usage_SG10_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG11_MEA":
                return Info_DESADV.usage_SG10_SG11_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG11_QTY":
                return Info_DESADV.usage_SG10_SG11_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG11_SG13_PCI":
                return Info_DESADV.usage_SG10_SG11_SG13_PCI[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG11_SG13_SG14_GIN":
                return Info_DESADV.usage_SG10_SG11_SG13_SG14_GIN[ele.getSchemaId()]
                break;
            
            case "ROOT_SG10_SG15_LIN":
                return Info_DESADV.usage_SG10_SG15_LIN[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_PIA":
                return Info_DESADV.usage_SG10_SG15_PIA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_IMD":
                return Info_DESADV.usage_SG10_SG15_IMD[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_MEA":
                return Info_DESADV.usage_SG10_SG15_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_QTY":
                return Info_DESADV.usage_SG10_SG15_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_GIR":
                return Info_DESADV.usage_SG10_SG15_GIR[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_DTM":
                return Info_DESADV.usage_SG10_SG15_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_FTX":
                return Info_DESADV.usage_SG10_SG15_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_MOA":
                return Info_DESADV.usage_SG10_SG15_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_SG16_RFF":
                return Info_DESADV.usage_SG10_SG15_SG16_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_SG16_DTM":
                return Info_DESADV.usage_SG10_SG15_SG16_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_SG20_PCI":
                return Info_DESADV.usage_SG10_SG15_SG20_PCI[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_SG20_DTM":
                return Info_DESADV.usage_SG10_SG15_SG20_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_SG20_QTY":
                return Info_DESADV.usage_SG10_SG15_SG20_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_SG20_MEA":
                return Info_DESADV.usage_SG10_SG15_SG20_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_SG20_SG21_GIN":
                return Info_DESADV.usage_SG10_SG15_SG20_SG21_GIN[ele.getSchemaId()]
                break;
            case "ROOT_SG10_SG15_SG23_QVR":
                return Info_DESADV.usage_SG10_SG15_SG23_QVR[ele.getSchemaId()]
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
                return Info_DESADV.comment_DTM[ele.getSchemaId()]
                break;
             case "ROOT_SG1_DTM":
                return Info_DESADV.comment_SG1_DTM[ele.getSchemaId()]
                break;
             case "ROOT_SG2_NAD":
                return Info_DESADV.comment_SG2_NAD[ele.getSchemaId()]
                break;
             case "ROOT_SG5_TOD":
                return Info_DESADV.comment_SG5_TOD[ele.getSchemaId()]
                break;
             case "ROOT_SG6_SG7_DTM":
                return Info_DESADV.comment_SG6_SG7_DTM[ele.getSchemaId()]
                break;
             case "ROOT_SG10_SG11_PAC":
                return Info_DESADV.comment_SG10_SG11_PAC[ele.getSchemaId()]
                break;
             case "ROOT_SG10_SG15_SG16_DTM":
                return Info_DESADV.comment_SG10_SG15_SG16_DTM[ele.getSchemaId()]
                break;

            default:

        }
        return undefined;
    }
}