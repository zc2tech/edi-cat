import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_RECADV extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "632": "Goods receipt",
        },
        "1225": {
            "3": "Deletion",
            "5": "Replace",
            "9": "Original"
        },
        "4343": {
            "AB": "Message acknowledgement"
        }

    };

    static usage_DTM = {
        "2005": {
            "50": "Goods receipt date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };
    static usage_SG1_RFF = {
        "1153": {
            "DQ": "Despatch advice number",
            "ZZZ": "Mutually defined reference number",
        },
    };
    static usage_SG1_DTM = {
        "2005": {
            "124": "Despatch advice date/time",
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };
    static usage_SG4_NAD = {
        "3035": {
            "XX": "Dummy",
        },
    };
    static usage_SG16_CPS = {
        "7164": {
            "1": "",
        },
    };
    static usage_SG16_SG22_LIN = {
        "7143": {
            "PL": "Purchaser's order line number",
        },
        "5495": {
            "1": "Sub-line information"
        }
    };
    static usage_SG16_SG22_PIA = {
        "4347": {
            "1": "Additional identification",
            "5": "Product identification"
        },
        "7143": DocInfoBase.ItemNumberType04,
        "3055": DocInfoBase.ResponsibleAgency03
    }

    static usage_SG16_SG22_IMD = {
        "7077": {
            "E": "Free-form short description",
            "F": "Free-form"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG16_SG22_QTY = {
        "6063": {
            "48": "Received quantity",
            "195": "Received, not accepted, to be returned"
        },
    };
    static usage_SG16_SG22_SG28_RFF = {
        "1153": {
            "CT": "Agreement number",
            "DQ": "Despatch advice number",
            "ON": "Order number (purchase)",
            "ZZZ": "Mutually defined reference number"
        },
        "1156": {
            "1": "Schedule agreement"
        }
    };
    static usage_SG16_SG22_SG28_DTM = {
        "2005": {
            "4": "Order date/time",
            "124": "Despatch note date/time",
            "126": "Agreement date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    }

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
    static comment_SG16_SG22_SG28_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGM":
                return Info_RECADV.usage_BGM[ele.getSchemaId()]
                break;
            case "ROOT_DTM":
                return Info_RECADV.usage_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG1_RFF":
                return Info_RECADV.usage_SG1_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_RECADV.usage_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG4_NAD":
                return Info_RECADV.usage_SG4_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG16_CPS":
                return Info_RECADV.usage_SG16_CPS[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SG22_LIN":
                return Info_RECADV.usage_SG16_SG22_LIN[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SG22_PIA":
                return Info_RECADV.usage_SG16_SG22_PIA[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SG22_IMD":
                return Info_RECADV.usage_SG16_SG22_IMD[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SG22_QTY":
                return Info_RECADV.usage_SG16_SG22_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SG22_SG28_RFF":
                return Info_RECADV.usage_SG16_SG22_SG28_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SG22_SG28_DTM":
                return Info_RECADV.usage_SG16_SG22_SG28_DTM[ele.getSchemaId()]
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
                return Info_RECADV.comment_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_RECADV.comment_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SG22_SG28_DTM":
                return Info_RECADV.comment_SG16_SG22_SG28_DTM[ele.getSchemaId()]
                break;

            default:

        }
        return undefined;
    }
}