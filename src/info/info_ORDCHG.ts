import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_ORDCHG extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "230": "Purchase order change request",
        },
        "1225": {
            "3": "Deletion",
            "5": "Replace"
        },
        "4343": {
            "AB": "Message acknowledgement"
        }

    };
    static usage_DTM = {
        "2005": {
            "2": "Delivery date/time, requested",
            "4": "Order date/time",
            "7": "Effective date/time",
            "36": "Expiry date",
            "63": "Delivery date/time, latest",
            "64": "Delivery date/time, earliest",
            "200": "Pick-up/collection date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_FTX = {
        "4451": {
            "AAI": "General information",
            "AAR": "Terms of delivery",
            "ACB": "Additional information",
            "DOC": "Documentation instructions",
            "PRI": "Priority information",
            "SIN": "Special instructions",
            "TDT": "Transport details remarks",
            "TXD": "Tax declaration",
            "ZZZ": "Mutually defined"
        },
        "4453": {
            "3": "Text for immediate use"
        },
        "4441": {
            "SPM": "Shipping payment methods",
            "TDC": "Terms of delivery",
            "TTC": "Transport terms",
            "EXT": ""
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG1_RFF = {
        "1153": {
            "ACD": "Additional reference number",
            "AGI": "Request number",
            "AIU": "Charge card account number",
            "BC": "Parent agreement number",
            "CR": "Customer reference number",
            "CT": "Contract number / Agreement number",
            "GN": "Government registration number",
            "IT": "Ariba Network ID",
            "ON": "Purchase order number",
            "PW": "Prior purchase order number",
            "RE": "Release number",
            "UC": "Ultimate customer's reference number",
            "VA": "VAT registration number",
            "VN": "Supplier order number"
        }
    };

    static usage_SG1_DTM = {
        "2005": {
            "4": "Order date/time",
            "8": "Order received date/time",
            "36": "Expiry date",
            "131": "Tax point date",
            "140": "Payment due date"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_SG3_NAD = {
        "3035": DocInfoBase.PartyQualifier,
        "3055": DocInfoBase.ResponsibleAgency
    };

    static usage_SG3_LOC = {
        "3227": {
            "18": "Warehouse / Storage location",
            "19": "Factory / plant / Buyer location"
        },
    };
    static usage_SG3_SG4_RFF = {
        "1153": DocInfoBase.ReferenceQualifier02
    };
    static usage_SG3_SG6_CTA = {
        "3139": DocInfoBase.ContactFunction
    };
    static usage_SG3_SG6_COM = {
        "3155": DocInfoBase.CommuChannelQualifier
    };
    static usage_SG7_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax",
        },
        "5153": {
            "FRE": "Free",
            "GST": "Goods and services tax",
            "LOC": "Local sales taxes",
            "OTH": "Other taxes",
            "VAT": "Value added tax"
        },
        "5279": {
            "TT": "Triangular Transaction"
        },
        "5305": {
            "A": "Mixed tax rate",
            "E": "Exempt from tax",
            "S": "Standard rate",
            "Z": "Zero rated goods"
        }
    };

    static usage_SG7_MOA = {
        "5025": {
            "124": "Tax amount"
        },
        "6345": DocInfoBase.CurrencyList
    };

    static usage_SG8_CUX = {
        "6347": {
            "2": "Reference currency",
            "3": "Target currency"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "7": "Target currency",
            "9": "Order currency",

        }
    };

    static usage_SG9_PAT = {
        "4279": {
            "20": "Penalty terms",
            "22": "Discount"
        },
        "2475": {
            "5": "Date of invoice"
        },
        "2009": {
            "3": "After reference"
        },
        "2151": {
            "D": "Day"
        },
    };

    static usage_SG9_PCD = {
        "5245": {
            "12": "Discount",
            "15": "Penalty percentage"
        },
        "5249": {
            "13": "Invoice value"
        }
    };
    static usage_SG9_MOA = {
        "5025": {
            "52": "Discount amount",
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "9": "Order currency"
        }

    };

    static usage_SG10_TDT = {
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
        },
    };

    static usage_SG12_TOD = {
        "4055": DocInfoBase.TermsOfDelivery,
        "4053": this.TransportationTermsCodeList02
    };
    static usage_SG16_SCC = {
        "4017": {
            "1": "Firm"
        },
        "4493": {
            "SC": "Ship complete order"
        }
    };

    static usage_SG19_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge"
        },
        "7161": DocInfoBase.SpecialServices02,
    };

    static usage_SG19_SG22_MOA = {
        "5025": {
            "4": "Deducted price",
            "8": "Allowance or charge amount",
            "23": "Charge amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "7": "Target currency",
            "9": "Order currency"
        }
    };

    static usage_SG19_DTM = {
        "2005": {
            "194": "Start date/time",
            "206": "End date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };
    static usage_SG19_SG21_PCD = {
        "5245": {
            "3": "Allowance or charge",
        },
        "5249": {
            "13": "Invoice value"
        }
    };

    static usage_SG26_LIN = {
        "7143": {
            "AB": "Assembly",
            "VN": "Suppliers part number"
        },
        "5495": {
            "1": "Sub-line information"
        },
        "7083": {
            "A": "Added to the configuration"
        }
    };

    static usage_SG26_PIA = {
        "4347": {
            "1": "Additional identification",
            "5": "Product identification"
        },
        "7143": {
            "BP": "Buyers part number",
            "DR": "Product revision number",
            "EN": "International Article Numbering Association (EAN)",
            "MF": "Manufacturers part number",
            "VS": "Suppliers supplemental part number",
            "ZZZ": "European waste catalog number"
        }
    };

    static usage_SG26_IMD = {
        "7077": {
            "B": "Code and text",
            "E": "Free-form short description",
            "F": "Free-form"
        },
        "7081": {
            "13": "Quality",
            "35": "Colour",
            "38": "Grade",
            "98": "Size"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG26_MEA = {
        "6311": {
            "AAE": "Measurement"
        },
        "6313": DocInfoBase.MeasurementDimension
    };
    static usage_SG26_QTY = {
        "6063": {
            "21": "Ordered quantity",
            "53": "Minimum order quantity",
            "54": "Maximum order quantity",
            "163": "Component quantity"
        },
    };
    static usage_SG26_ALI = {
        "4183": {
            "94": "Service",
        },
    };
    static usage_SG26_DTM = {
        "2005": {
            "2": "Delivery date/time, requested",
            "10": "Shipment date/time, requested",
            "169": "Lead time (only used with 2379=804)",
            "318": "Request date"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_SG26_MOA = {
        "5025": {
            "146": "Unit price",
            "173": "Minimum amount",
            "176": "Message total duty/tax/fee amount",
            "179": "Maximum amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "9": "Order currency"
        }
    };

    static usage_SG26_FTX = {
        "4451": {
            "AAI": "General information",
            "AAK": "Price conditions",
            "AAR": "Terms of delivery",
            "ACB": "Additional information",
            "ACL": "Quality statement",
            "ORI": "Order instruction",
            "PRD": "Product information",
            "SIN": "Special instructions",
            "TDT": "Transport details remarks",
            "TXD": "Tax declaration",
            "ZZZ": "Mutually defined"
        },

        "4441": {
            "SPM": "Shipping payment methods",
            "TDC": "Terms of delivery",
            "TTC": "Transport terms"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG26_SG30_PRI = {
        "5125": {
            "CAL": "Calculation price"
        },
        "5387": {
            "PBQ": "Unit price beginning quantity"
        }
    };

    static usage_SG26_SG30_APR = {
        "4043": {
            "WS": "User"
        },
        "5393": {
            "CSD": "Cost markup multiplier - original cost"
        }
    };

    static usage_SG26_SG30_RNG = {
        "6167": {
            "4": "Quantity range"
        },
    };
    static usage_SG26_SG31_RFF = {
        "1153": {
            "AAN": "Delivery schedule number",
            "ACJ": "Customer material specification number",
            "AGI": "Request number",
            "ALQ": "Returns notice number",
            "CT": "Contract number",
            "FI": "File line identifier",
            "PD": "Promotion deal number",
            "VA": "VAT registration number"
        }
    };
    static usage_SG26_SG31_DTM = {
        "2005": {
            "126": "Agreement date",
            "131": "Tax point date/time",
            "140": "Payment due date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_SG26_SG32_PAC = {
        "7224": {
            "0": "",
            "1": ""
        },
        "7075": {
            "1": "Inner",
            "2": "Intermediate",
            "3": "Outer"
        },
        "7077": {
            "A": "Free-form long description"
        },
        "7143": {
            "ZZZ": "Mutually defined"
        },

    };

    static usage_SG26_SG32_MEA = {
        "6311": {
            "AAE": "Measurement"
        },
        "6313": DocInfoBase.MeasurementDimension
    };

    static usage_SG26_SG32_QTY = {
        "6063": {
            "12": "Despatch quantity",
            "21": "Ordered/Batch quantity",
            "192": "Free goods quantity"
        }
    }

    static usage_SG26_SG32_SG33_RFF = {
        "1153": {
            "AAS": "Transport document number",
            "BT": "Batch number/lot number"
        },
    };
    static usage_SG26_SG32_SG34_PCI = {
        "4233": {
            "10": "Mark batch number",
            "30": "Mark serial shipping container code"
        },
    };
    static usage_SG26_SG32_SG34_GIN = {
        "7405": {
            "AW": "Serial shipping container code",
            "BX": "Batch number"
        },
        "7402": {
            "91": "Assigned by seller or seller's agent",
            "92": "Assigned by buyer or buyer's agent"
        }
    };

    static usage_SG26_SG32_DTM = {
        "2005": {
            "36": "Expiry date",
            "94": "Production/manufacture date",
            "351": "Inspection date"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };
    static usage_SG26_SG32_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax"
        },
        "5153": {
            "FRE": "Free",
            "GST": "Goods and services tax",
            "LOC": "Local sales taxes",
            "OTH": "Other taxes",
            "VAT": "Value added tax"
        },
        "5279": {
            "TT": "Triangular Transaction",
        },
        "5305": {
            "A": "Mixed tax rate",
            "E": "Exempt from tax",
            "S": "Standard rate",
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
    static usage_SG26_SG37_SG38_RFF = {
        "1153": DocInfoBase.ReferenceQualifier02,
    }
    static usage_SG26_SG37_SG40_CTA = {
        "3139": DocInfoBase.ContactFunction02,
    }
    static usage_SG26_SG37_SG40_COM = {
        "3155": DocInfoBase.CommuChannelQualifier,
    }
    static usage_SG26_SG41_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge",
            "N": "No allowance or charge"
        },
        "7161": DocInfoBase.SpecialServices02,
        "1131": {
            "175": "Account analysis codes"
        },
        "3055": {
            "92": "Assigned by buyer or buyer's agent"
        }
    }

    static usage_SG26_SG41_SG44_MOA = {
        "5025": {
            "4": "Deducted price",
            "8": "Allowance or charge amount",
            "23": "Charge amount",
            "54": "Distribution amount",
            "98": "Original price"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "7": "Target currency",
            "9": "Order currency"
        }
    }

    static usage_SG26_SG41_DTM = {
        "2005": {
            "194": "Start date/time",
            "206": "End date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_SG26_SG41_SG43_PCD = {
        "5245": {
            "3": "Allowance or charge"
        }
    }
    static usage_SG26_SG47_TDT = {
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
    static usage_SG26_SG49_TOD = {
        "4055": DocInfoBase.TermsOfDelivery,
        "4053": this.TransportationTermsCodeList02
    };
    static usage_SG26_SG51_SCC = {
        "4017": {
            "1": "Firm",
            "4": "Planning/forecast",
            "26": "Tradeoff"
        }
    };
    static usage_SG26_SG51_RFF = {
        "AAN": "Delivery schedule number"
    }

    static usage_SG26_SG51_SG52_QTY = {
        "6063": {
            "3": "Cumulative quantity",
            "21": "Ordered quantity"
        },

    }
    static usage_SG26_SG51_SG52_DTM = {
        "2005": {
            "2": "Delivery date/time, requested",
        },
        "2379": DocInfoBase.TimeFormatQualifier02

    }
    static usage_MOA = {
        "5025": {
            "124": "Tax amount",
            "128": "Total amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "7": "Target currency",
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
    static comment_SG12_TOD = {
        "4215": DocInfoBase.codelists4215,
    }

    static comment_SG19_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }
    static comment_SG26_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }
    static comment_SG26_SG31_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }
    static comment_SG26_SG32_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
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

    static comment_SG26_SG49_TOD = {
        "4215":DocInfoBase.codelists4215,
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
                return Info_ORDCHG.usage_BGM[ele.getSchemaId()]
                break;
            case "ROOT_DTM":
                return Info_ORDCHG.usage_DTM[ele.getSchemaId()]
                break;
            case "ROOT_FTX":
                return Info_ORDCHG.usage_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG1_RFF":
                return Info_ORDCHG.usage_SG1_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_ORDCHG.usage_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG3_NAD":
                return Info_ORDCHG.usage_SG3_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG3_LOC":
                return Info_ORDCHG.usage_SG3_LOC[ele.getSchemaId()]
                break;
            case "ROOT_SG3_SG4_RFF":
                return Info_ORDCHG.usage_SG3_SG4_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG3_SG6_CTA":
                return Info_ORDCHG.usage_SG3_SG6_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG3_SG6_COM":
                return Info_ORDCHG.usage_SG3_SG6_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG7_TAX":
                return Info_ORDCHG.usage_SG7_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG7_MOA":
                return Info_ORDCHG.usage_SG7_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG8_CUX":
                return Info_ORDCHG.usage_SG8_CUX[ele.getSchemaId()]
                break;
            case "ROOT_SG9_PAT":
                return Info_ORDCHG.usage_SG9_PAT[ele.getSchemaId()]
                break;
            case "ROOT_SG9_PCD":
                return Info_ORDCHG.usage_SG9_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG9_MOA":
                return Info_ORDCHG.usage_SG9_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG10_TDT":
                return Info_ORDCHG.usage_SG10_TDT[ele.getSchemaId()]
                break;
            case "ROOT_SG12_TOD":
                return Info_ORDCHG.usage_SG12_TOD[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SCC":
                return Info_ORDCHG.usage_SG16_SCC[ele.getSchemaId()]
                break;
            case "ROOT_SG19_ALC":
                return Info_ORDCHG.usage_SG19_ALC[ele.getSchemaId()]
                break;
            case "ROOT_SG19_SG22_MOA":
                return Info_ORDCHG.usage_SG19_SG22_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG19_DTM":
                return Info_ORDCHG.usage_SG19_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG19_SG21_PCD":
                return Info_ORDCHG.usage_SG19_SG21_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_LIN":
                return Info_ORDCHG.usage_SG26_LIN[ele.getSchemaId()]
                break;
            case "ROOT_SG26_PIA":
                return Info_ORDCHG.usage_SG26_PIA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_IMD":
                return Info_ORDCHG.usage_SG26_IMD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_MEA":
                return Info_ORDCHG.usage_SG26_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_QTY":
                return Info_ORDCHG.usage_SG26_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG26_ALI":
                return Info_ORDCHG.usage_SG26_ALI[ele.getSchemaId()]
                break;
            case "ROOT_SG26_DTM":
                return Info_ORDCHG.usage_SG26_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_MOA":
                return Info_ORDCHG.usage_SG26_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_FTX":
                return Info_ORDCHG.usage_SG26_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG30_PRI":
                return Info_ORDCHG.usage_SG26_SG30_PRI[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG30_APR":
                return Info_ORDCHG.usage_SG26_SG30_APR[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG30_RNG":
                return Info_ORDCHG.usage_SG26_SG30_RNG[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG31_RFF":
                return Info_ORDCHG.usage_SG26_SG31_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG31_DTM":
                return Info_ORDCHG.usage_SG26_SG31_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG32_PAC":
                return Info_ORDCHG.usage_SG26_SG32_PAC[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG32_MEA":
                return Info_ORDCHG.usage_SG26_SG32_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG32_QTY":
                return Info_ORDCHG.usage_SG26_SG32_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG32_SG33_RFF":
                return Info_ORDCHG.usage_SG26_SG32_SG33_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG32_SG34_PCI":
                return Info_ORDCHG.usage_SG26_SG32_SG34_PCI[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG32_SG34_GIN":
                return Info_ORDCHG.usage_SG26_SG32_SG34_GIN[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG32_DTM":
                return Info_ORDCHG.usage_SG26_SG32_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG32_TAX":
                return Info_ORDCHG.usage_SG26_SG32_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG36_MOA":
                return Info_ORDCHG.usage_SG26_SG36_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_NAD":
                return Info_ORDCHG.usage_SG26_SG37_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_SG38_RFF":
                return Info_ORDCHG.usage_SG26_SG37_SG38_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_SG40_CTA":
                return Info_ORDCHG.usage_SG26_SG37_SG40_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_SG40_COM":
                return Info_ORDCHG.usage_SG26_SG37_SG40_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_ALC":
                return Info_ORDCHG.usage_SG26_SG41_ALC[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_SG44_MOA":
                return Info_ORDCHG.usage_SG26_SG41_SG44_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_DTM":
                return Info_ORDCHG.usage_SG26_SG41_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_SG43_PCD":
                return Info_ORDCHG.usage_SG26_SG41_SG43_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG47_TDT":
                return Info_ORDCHG.usage_SG26_SG47_TDT[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG49_TOD":
                return Info_ORDCHG.usage_SG26_SG49_TOD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG51_SCC":
                return Info_ORDCHG.usage_SG26_SG51_SCC[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG51_RFF":
                return Info_ORDCHG.usage_SG26_SG51_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG51_SG52_QTY":
                return Info_ORDCHG.usage_SG26_SG51_SG52_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG51_SG52_DTM":
                return Info_ORDCHG.usage_SG26_SG51_SG52_DTM[ele.getSchemaId()]
                break;
            case "ROOT_MOA":
                return Info_ORDCHG.usage_MOA[ele.getSchemaId()]
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
                return Info_ORDCHG.comment_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_ORDCHG.comment_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG3_NAD":
                return Info_ORDCHG.comment_SG3_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG12_TOD":
                return Info_ORDCHG.comment_SG12_TOD[ele.getSchemaId()]
                break;
            case "ROOT_SG19_DTM":
                return Info_ORDCHG.comment_SG19_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_DTM":
                return Info_ORDCHG.comment_SG26_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG31_DTM":
                return Info_ORDCHG.comment_SG26_SG31_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG32_DTM":
                return Info_ORDCHG.comment_SG26_SG32_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG37_NAD":
                return Info_ORDCHG.comment_SG26_SG37_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG41_DTM":
                return Info_ORDCHG.comment_SG26_SG41_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG49_TOD":
                return Info_ORDCHG.comment_SG26_SG49_TOD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG51_SG52_DTM":
                return Info_ORDCHG.comment_SG26_SG51_SG52_DTM[ele.getSchemaId()]
                break;
           
            
            default:

        }
        return undefined;
    }
}