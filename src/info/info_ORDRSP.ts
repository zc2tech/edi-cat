import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_ORDRSP extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "231": "Purchase order response",
        },
        "1225": {
            "5": "Replace",
            "9": "Original"
        },
        "4343": {
            "AC": "Acknowledge with changes",
            "AI": "Acknowledge only changes",
            "AP": "Accepted",
            "RE": "Rejected"
        }

    };

    static usage_DTM = {
        "2005": {
            "8": "Order confirmation notice date",
            "137": "Document/message date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_FTX = {
        "4451": {
            "AAI": "General information",
            "ACD": "Reason",
            "TRA": "Transportation information",
            "TXD": "Tax declaration",
            "ZZZ": "Mutually defined"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG1_RFF = {
        "1153": {
            "AEU": "Supplier's reference number",
            "IV": "Invoice number",
            "ON": "Order number (purchase)",
            "POR": "Purchase order response number"
        }
    };

    static usage_SG1_DTM = {
        "2005": {
            "4": "Order date/time",
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };
    static usage_SG3_NAD = {
        "3035": DocInfoBase.PartyQualifier,
        "3055": DocInfoBase.ResponsibleAgency
    };
    static usage_SG3_SG6_CTA = {
        "3139": {
            "IC": "Information contact"
        }
    };
    static usage_SG3_SG6_COM = {
        "3155": DocInfoBase.CommuChannelQualifier
    };
    static usage_SG7_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax"
        },
        "5289": {
            "yes": "The entire invoice is VAT (Value Added Tax)-recoverable"
        },
        "5305": {
            "E": "Exempt from tax",
            "Z": "Zero rated goods"
        }
    };

    static usage_SG7_MOA = {
        "5025": {
            "124": "Tax amount"
        },
        "6345": DocInfoBase.CurrencyList
    };
    static usage_SG12_TOD = {
        "4053": DocInfoBase.TransportationTermsCodeList02
    };
    static usage_SG19_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge"
        },
        "7161": DocInfoBase.SpecialServices02
    };

    static usage_SG19_DTM = {
        "2005": {
            "194": "Start date/time",
            "206": "End date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    }
    static usage_SG19_SG21_PCD = {
        "5245": {
            "3": "Allowance or charge"
        },
        "5249": {
            "13": "Invoice value"
        }
    }
    static usage_SG19_SG22_MOA = {
        "5025": {
            "4": "Deducted price",
            "8": "Allowance or charge amount",
            "23": "Charge amount",
            "98": "Original price"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "7": "Target currency",
            "9": "Order currency"
        }
    }
    static usage_SG26_LIN = {
        "7143": {
            "VN": "Suppliers part number",
            "SA": "Suppliers item number"
        },
        "5495": {
            "1": "Sub-line information"
        }
    };
    static usage_SG26_PIA = {
        "4347": {
            "1": "Additional identification",
            "5": "Product identification"
        },
        "7143": DocInfoBase.ItemNumberType
    }

    static usage_SG26_IMD = {
        "7077": {
            "E": "Free-form short description",
            "F": "Free-form",
        },
        "3453": DocInfoBase.LanguageList
    }

    static usage_SG26_QTY = {
        "6063": {
            "21": "Ordered quantity"
        }
    }
    static usage_SG26_DTM = {
        "2005": {
            "143": "Acceptance date/time of goods"
        },
        "2379": {
            "804": "Day"
        }
    }

    static usage_SG26_MOA = {
        "5025": {
            "146": "Unit price"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "9": "Order currency"
        }
    }

    static usage_SG26_SG30_PRI = {
        "5125": {
            "CAL": "Calculation price"
        },
        "5387": {
            "AAK": "New price (changed unit price)",
            "CUP": "Confirmed unit price"
        }
    }

    static usage_SG26_SG30_CUX = {
        "6347": {
            "5": "Calculation base currency"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "9": "Order currency"
        }
    }
    static usage_SG26_SG31_RFF = {
        "1153": {
            "FI": "File line identifier"
        }
    }
    static usage_SG26_SG36_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax"
        },
        "5289": {
            "yes": "The entire invoice is VAT (Value Added Tax)-recoverable"
        },
        "5305": {
            "E": "Exempt from tax",
            "Z": "Zero rated goods"
        }
    }
    static usage_SG26_SG36_MOA = {
        "5025": {
            "124": "Tax amount"
        },
        "6345": DocInfoBase.CurrencyList
    }

    static usage_SG26_SG37_NAD = {
        "3035": DocInfoBase.PartyQualifier,
        "3055": DocInfoBase.ResponsibleAgency
    }
    static usage_SG26_SG37_SG40_CTA = {
        "3139": {
            "IC": "Information contact"
        }
    }

    static usage_SG26_SG37_SG40_COM = {
        "3155": DocInfoBase.CommuChannelQualifier
    }
    static usage_SG26_SG41_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge"
        },
        "7161": DocInfoBase.SpecialServices02
    }
    static usage_SG26_SG41_DTM = {
        "2005": {
            "194": "Start date/time",
            "206": "End date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    }

    static usage_SG26_SG41_SG43_PCD = {
        "5245": {
            "3": "Allowance or charge"
        }
    }
    static usage_SG26_SG41_SG44_MOA = {
        "5025": {
            "4": "Deducted price",
            "8": "Allowance or charge amount",
            "23": "Charge amount",
            "98": "Original price"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            // "7": "Target currency",
            "9": "Order currency"
        }
    }
    static usage_SG26_SG51_SCC = {
        "4017": {
            "1": "Firm"
        }
    }
    static usage_SG26_SG51_FTX = {
        "4451": {
            "AAI": "General information",
            "ACD": "Reason",
            "ZZZ": "Mutually defined"
        },
        "3453": DocInfoBase.LanguageList
    }
    static usage_SG26_SG51_SG52_QTY = {
        "6063": {
            "83": "Backorder quantity",
            "185": "Rejected quantity",
            "187": "ScheduleLineReference quantity",
            "194": "Received and accepted quantity"
        }
    }
    static usage_SG26_SG51_SG52_DTM = {
        "2005": {
            "10": "Shipment date/time, requested",
            "69": "Delivery date/time, promised for",
        },
        "2379": DocInfoBase.TimeFormatQualifier

    }

    static usage_MOA = {
        "5025": {
            "124": "Tax amount",
            "128": "Total amount"
        },
        "6345": DocInfoBase.LanguageList,
        "6343": {
            "9": "Order currency"
        }
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

    static comment_SG3_NAD = {
        "3207": DocInfoBase.codelists3207,
    }

    static comment_SG7_TAX = {
        "5153": `**Tax type code**\n\nAll values defined by D.96A are allowed to be used.`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 5153 Duty/tax/fee type]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(5153)})`,
    }

    static comment_SG19_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    static comment_SG26_SG36_TAX = {
        "5153": `**Tax type code**\n\nAll values defined by D.96A are allowed to be used.`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 5153 Duty/tax/fee type]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(5153)})`,
    }

    static comment_SG26_SG37_NAD = {
        "3207": DocInfoBase.codelists3207,
    }

    static comment_SG26_SG41_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }
    static comment_SG26_SG51_SG52_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGM":
                return Info_ORDRSP.usage_BGM[ele.getSchemaId()]
                break;
            case "ROOT_DTM":
                return Info_ORDRSP.usage_DTM[ele.getSchemaId()]
                break;
            case "ROOT_FTX":
                return Info_ORDRSP.usage_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG1_RFF":
                return Info_ORDRSP.usage_SG1_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_ORDRSP.usage_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG3_NAD":
                return Info_ORDRSP.usage_SG3_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG3_SG6_CTA":
                return Info_ORDRSP.usage_SG3_SG6_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG3_SG6_COM":
                return Info_ORDRSP.usage_SG3_SG6_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG7_TAX":
                return Info_ORDRSP.usage_SG7_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG7_MOA":
                return Info_ORDRSP.usage_SG7_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG12_TOD":
                return Info_ORDRSP.usage_SG12_TOD[ele.getSchemaId()]
                break;
            case "ROOT_SG19_ALC":
                return Info_ORDRSP.usage_SG19_ALC[ele.getSchemaId()]
                break;
            case "ROOT_SG19_DTM":
                return Info_ORDRSP.usage_SG19_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG19_SG21_PCD":
                return Info_ORDRSP.usage_SG19_SG21_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG19_SG22_MOA":
                return Info_ORDRSP.usage_SG19_SG22_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_LIN":
                return Info_ORDRSP.usage_SG26_LIN[ele.getSchemaId()]
                break;
            case "ROOT_SG26_PIA":
                return Info_ORDRSP.usage_SG26_PIA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_IMD":
                return Info_ORDRSP.usage_SG26_IMD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_QTY":
                return Info_ORDRSP.usage_SG26_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG26_DTM":
                return Info_ORDRSP.usage_SG26_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_MOA":
                return Info_ORDRSP.usage_SG26_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG30_PRI":
                return Info_ORDRSP.usage_SG26_SG30_PRI[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG30_CUX":
                return Info_ORDRSP.usage_SG26_SG30_CUX[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG31_RFF":
                return Info_ORDRSP.usage_SG26_SG31_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG36_TAX":
                return Info_ORDRSP.usage_SG26_SG36_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG36_MOA":
                return Info_ORDRSP.usage_SG26_SG36_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_NAD":
                return Info_ORDRSP.usage_SG26_SG37_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_SG40_CTA":
                return Info_ORDRSP.usage_SG26_SG37_SG40_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_SG40_COM":
                return Info_ORDRSP.usage_SG26_SG37_SG40_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_ALC":
                return Info_ORDRSP.usage_SG26_SG41_ALC[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_DTM":
                return Info_ORDRSP.usage_SG26_SG41_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_SG43_PCD":
                return Info_ORDRSP.usage_SG26_SG41_SG43_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_SG44_MOA":
                return Info_ORDRSP.usage_SG26_SG41_SG44_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG51_SCC":
                return Info_ORDRSP.usage_SG26_SG51_SCC[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG51_FTX":
                return Info_ORDRSP.usage_SG26_SG51_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG51_SG52_QTY":
                return Info_ORDRSP.usage_SG26_SG51_SG52_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG51_SG52_DTM":
                return Info_ORDRSP.usage_SG26_SG51_SG52_DTM[ele.getSchemaId()]
                break;
            case "ROOT_MOA":
                return Info_ORDRSP.usage_MOA[ele.getSchemaId()]
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
                return Info_ORDRSP.comment_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_ORDRSP.comment_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG3_NAD":
                return Info_ORDRSP.comment_SG3_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG7_TAX":
                return Info_ORDRSP.comment_SG7_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG19_DTM":
                return Info_ORDRSP.comment_SG19_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG36_TAX":
                return Info_ORDRSP.comment_SG26_SG36_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_NAD":
                return Info_ORDRSP.comment_SG26_SG37_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_DTM":
                return Info_ORDRSP.comment_SG26_SG41_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG51_SG52_DTM":
                return Info_ORDRSP.comment_SG26_SG51_SG52_DTM[ele.getSchemaId()]
                break;
            default:

        }
        return undefined;
    }
}