import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_DELFOR_ProductActivity extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "241": "Delivery schedule",
        },
        "1225": {
            "9": "Original",
        },
    };

    static usage_DTM = {
        "2005": {
            "137": "Document/message date/time",
        },
        "2379": DocInfoBase.TimeFormatQualifier,
    };
    static usage_SG1_RFF = {
        "1153": {
            "MS": "System identification number",
        },
    };
    static usage_SG2_NAD = {
        "3035": {
            "MI": "Planning schedule/material release issuer",
            "SU": "Location from/Supplier",
        },
        "3055": DocInfoBase.ResponsibleAgency,
    };

    static usage_SG2_SG3_CTA = {
        "3139": {
            "IC": "Information contact",
            "PD": "Purchasing contact",
        },
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
            "ST": "Location to/Ship to",
        },
        "3055": DocInfoBase.ResponsibleAgency,
    };

    static usage_SG4_LOC = {
        "3227": {
            "7": "Place of delivery",
        },
    };

    static usage_SG4_SG6_CTA = {
        "3139": {
            "IC": "Information contact",
        },
    };
    static usage_SG4_SG6_COM = {
        "3155": DocInfoBase.CommuChannelQualifier,
    };
    static usage_SG4_SG8_LIN = {
        "7143": DocInfoBase.ItemNumberType,
    };
    static usage_SG4_SG8_PIA = {
        "4347": {
            "1": "Additional identification",
            "5": "Product identification"
        },
        "7143": DocInfoBase.ItemNumberType
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

    static usage_SG4_SG8_DTM = {
        "2005": {
            "143": "Acceptance date/time of goods",
            "169": "Lead time"
        },

        "2379": {
            "804": "Day"
        }
    };

    static usage_SG4_SG8_SG10_RFF = {
        "1153": {
            "AGW": "Material status",
        },

        "1154": {
            "active": "",
            "inactive": "",
            "deleted": ""
        }
    };
    static usage_SG4_SG8_SG12_QTY = {
        "6063": {
            "1": "Discrete quantity",
        },
    };
    static usage_SG4_SG8_SG12_SCC = {
        "4017": {
            "4": "Forecast",
            "12": "Planning",
            "17": "Inventory"
        },
    };
    static usage_SG4_SG8_SG12_DTM = {
        "2005": {
            "63": "Delivery date/time, latest",
            "64": "Delivery date/time, earliest",
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };
    static usage_SG4_SG8_SG12_SG13_RFF = {
        "1153": {
            "AEH": "Delivery date/time, latest/Time series type",
        },
    };

    static comment_DTM = {
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

    static comment_SG4_SG8_SG12_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGM":
                return Info_DELFOR_ProductActivity.usage_BGM[ele.getSchemaId()]
                break;
            case "ROOT_DTM":
                return Info_DELFOR_ProductActivity.usage_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG1_RFF":
                return Info_DELFOR_ProductActivity.usage_SG1_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG2_NAD":
                return Info_DELFOR_ProductActivity.usage_SG2_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_CTA":
                return Info_DELFOR_ProductActivity.usage_SG2_SG3_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_COM":
                return Info_DELFOR_ProductActivity.usage_SG2_SG3_COM[ele.getSchemaId()]
                break;
            case "ROOT_UNS":
                return Info_DELFOR_ProductActivity.usage_UNS[ele.getSchemaId()]
                break;
            case "ROOT_SG4_NAD":
                return Info_DELFOR_ProductActivity.usage_SG4_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG4_LOC":
                return Info_DELFOR_ProductActivity.usage_SG4_LOC[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG6_CTA":
                return Info_DELFOR_ProductActivity.usage_SG4_SG6_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG6_COM":
                return Info_DELFOR_ProductActivity.usage_SG4_SG6_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_LIN":
                return Info_DELFOR_ProductActivity.usage_SG4_SG8_LIN[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_PIA":
                return Info_DELFOR_ProductActivity.usage_SG4_SG8_PIA[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_IMD":
                return Info_DELFOR_ProductActivity.usage_SG4_SG8_IMD[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_DTM":
                return Info_DELFOR_ProductActivity.usage_SG4_SG8_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG10_RFF":
                return Info_DELFOR_ProductActivity.usage_SG4_SG8_SG10_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG12_QTY":
                return Info_DELFOR_ProductActivity.usage_SG4_SG8_SG12_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG12_SCC":
                return Info_DELFOR_ProductActivity.usage_SG4_SG8_SG12_SCC[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG12_DTM":
                return Info_DELFOR_ProductActivity.usage_SG4_SG8_SG12_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG12_SG13_RFF":
                return Info_DELFOR_ProductActivity.usage_SG4_SG8_SG12_SG13_RFF[ele.getSchemaId()]
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
                return Info_DELFOR_ProductActivity.comment_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG2_NAD":
                return Info_DELFOR_ProductActivity.comment_SG2_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG4_NAD":
                return Info_DELFOR_ProductActivity.comment_SG4_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG8_SG12_DTM":
                return Info_DELFOR_ProductActivity.comment_SG4_SG8_SG12_DTM[ele.getSchemaId()]
                break;
          
           
            default:

        }
        return undefined;
    }
}