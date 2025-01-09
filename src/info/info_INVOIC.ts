import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_INVOIC extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "80": "Debit note related to line items*",
            "81": "Credit note related to line items",
            "380": "Commercial invoice",
            "381": "Credit note",
            "383": "Debit note",
            "385": "Summary invoice"
        },
        "1225": {
            "3": "Deletion",
            "9": "Original",
            "31": "Copy"
        }

    };

    static usage_DTM = {
        "2005": {
            "3": "Invoice date/time*",
            "35": "Delivery date/time, actual",
            "110": "Shipping date/time",
            "137": "Document/message date/time*",
            "194": "Invoicing period start date/time",
            "206": "Invoicing period end date/time",
            "263": "Invoicing period"
        },
        "2379": DocInfoBase.TimeFormatQualifier02
    };

    static usage_PAI = {
        "4461": {
            "2": "Automated clearing house credit",
            "3": "Automated clearing house debit",
            "10": "In cash",
            "20": "Cheque",
            "21": "Banker's draft",
            "30": "Credit transfer",
            "31": "Debit transfer",
            "42": "Payment to bank account",
            "60": "Promissory note",
            "70": "Bill drawn by the creditor on the debtor"
        }
    };

    static usage_FTX = {
        "4451": {
            "AAI": "General information",
            "REG": "Regulatory information",
            "FTX": "Tax declaration",
            "ZZZ": "Mutually defined"
        },
        "4453": {
            "4": "Triangular transaction law reference"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG1_RFF = {
        "1153": {
            "AEG": "System ID number",
            "AGA": "Payment proposal number",
            "ALO": "Receiving advice number",
            "CR": "Customer reference number",
            "CT": "Agreement number",
            "DQ": "Delivery note number",
            "IV": "Invoice number",
            "MA": "Ship notice/manifest number",
            "OI": "Previous invoice number",
            "ON": "Order number (purchase)",
            "PK": "Packing list number",
            "UC": "Ultimate customer's reference number",
            "VA": "VAT registration number",
            "VN": "Order number (vendor)",
            "ZZZ": "Mutually defined reference number"
        },
        "1156": {
            "1": "Schedule agreement"
        }
    };

    static usage_SG1_DTM = {
        "2005": {
            "3": "Invoice date/time",
            "4": "Order date/time",
            "111": "Manifest/ship notice date/time",
            "124": "Delivery note date/time",
            "126": "Agreement date/time",
            "131": "Tax point date/time",
            "140": "Payment due date/time",
            "171": "Reference date/time*"
        },

        "2379": DocInfoBase.TimeFormatQualifier

    };

    static usage_SG2_NAD = {
        "3035": DocInfoBase.PartyQualifier,
        "3055": DocInfoBase.ResponsibleAgency,
    };

    static usage_SG2_LOC = {
        "3227": {
            "89": "Place of registration",
        },
    };
    static usage_SG2_FII = {
        "3035": {
            "RB": "Receiving credit institution/bank",
            "I1": "Receiving correspondent bank"
        },
        "1131": {
            "25": "Bank identification"
        },
        "3055": {
            "5": "ISO (International Organization for Standardization)",
            "17": "S.W.I.F.T.",
            "131": "DE, German Bankers Association"
        }
    };

    static usage_SG2_SG3_RFF = {
        "1153": DocInfoBase.ReferenceQualifier,
        "4000": DocInfoBase.ResponsibleAgency
    };
    static usage_SG2_SG3_DTM = {
        "2005": {
            "89": "Shipment tracking date"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };
    static usage_SG2_SG5_CTA = {
        "3139": {
            "IC": "Information contact",
            "BF": "Requester contact"
        },
    };
    static usage_SG2_SG5_COM = {
        "3155": DocInfoBase.CommuChannelQualifier
    };

    static usage_SG6_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax",
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

    static usage_SG7_CUX = {
        "6347": {
            "2": "Reference currency",
            "3": "Target currency"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency",
            "7": "Target currency"
        }
    };

    static usage_SG8_PAT = {
        "4279": {
            "3": "Fixed date",
            "20": "Penalty terms",
            "22": "Discount"
        },
        "4277": {
            "6": "No drafts"
        },
        "2475": {
            "5": "Date of invoice"
        },
        "2009": {
            "3": "After reference"
        },
        "2151": {
            "D": "Day"
        }
    };
    static usage_SG8_DTM = {
        "2005": {
            "12": "Terms discount due date/time",
            "13": "Terms net due date/time",
            "209": "Value date",
            "265": "Terms penalty due date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    }

    static usage_SG8_PCD = {
        "5245": {
            "12": "Discount",
            "15": "Penalty percentage",
        },
        "5249": {
            "13": "Invoice value"
        }
    };

    static usage_SG8_MOA = {
        "5025": {
            "52": "Discount amount",
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency"
        }
    };

    static usage_SG12_TOD = {
        "4053": DocInfoBase.TransportationTermsCodeList02
    };

    static usage_SG15_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge"
        },
        "4471": DocInfoBase.Settlement,
        "1227": DocInfoBase.CalculationSequence,
        "7161": DocInfoBase.SpecialServices
    };

    static usage_SG15_SG16_RFF = {
        "1153": {
            "ZZZ": "Mutually defined reference number",
        },
        "1156": DocInfoBase.LanguageList
    };

    static usage_SG15_SG16_DTM = {
        "2005": {
            "194": "Start date/time",
            "206": "End date/time",
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_SG15_SG18_PCD = {
        "5245": {
            "2": "Charge",
            "3": "Allowance or charge",
            "12": "Discount"
        },
        "5249": {
            "13": "Invoice value"
        }
    };

    static usage_SG15_SG19_MOA = {
        "5025": DocInfoBase.MonetaryAmountType,
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency",
            "7": "Target currency"
        }
    };

    static usage_SG15_SG21_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax",
            "9": "Tax related information"
        },
        "5305": {
            "A": "Mixed tax rate",
            "E": "Exempt from tax",
            "S": "Standard rate",
            "Z": "Zero rated goods"
        }
    };

    static usage_SG15_SG21_MOA = {
        "5025": {
            "124": "Tax amount",
            "176": "Total tax amount",
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency"
        }
    };
    static usage_SG25_LIN = {
        "1229": {
            "1": "Added",
        },
        "7143": {
            "PL": "Purchaser's order line number",
            "MP": "Product/service identification numbe",
        },
        "5495": {
            "1": "Sub-line information"
        }
    };

    static usage_SG25_PIA = {
        "4347": {
            "1": "Additional identification",
            "5": "Product identification",
        },
        "7143": DocInfoBase.ItemNumberType03
    };

    static usage_SG25_IMD = {
        "7077": {
            "B": "Code and text",
            "E": "Free-form short description",
            "F": "Free-form",
        },
        "7009": {
            "ACD": "Classification",
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG25_QTY = {
        "6063": {
            "47": "Invoiced quantity",
        },
    };
    static usage_SG25_ALI = {
        "4183": {
            "88": "Supply of goods as returned consignment on which payment has been made",
        },
    };
    static usage_SG25_DTM = {
        "2005": {
            "35": "Delivery date/time, actual",
            "171": "Service item reference date",
            "194": "Service period start date/time",
            "206": "Service period end date/time",
            "351": "Inspection date"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_SG25_FTX = {
        "4451": {
            "AAI": "General information",
            "ACB": "Additional information",
            "TXD": "Tax declaration",

            // "REG": "Regulatory information",
            // "FTX": "Tax declaration",
            "ZZZ": "Mutually defined"
        },
        "4453": {
            "4": "Triangular transaction law reference"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG25_SG26_MOA = {
        "5025": {
            "38": "Invoice item amount",
            "125": "Total line item amount without tax",
            "128": "Total amount",
            "146": "Unit price",
            "176": "Line item total tax amount",
            "203": "Line item amount",
            "259": "Total charges",
            "260": "Total allowances",
            "289": "Subtotal amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency"
        }
    };

    static usage_SG25_SG28_PRI = {
        "5125": {
            "CAL": "Calculation price",
        },
        "5387": {
            "PBQ": "Unit price beginning quantity",
        },
    };

    static usage_SG25_SG28_APR = {
        "4043": {
            "WS": "User",
        },
        "5393": {
            "CSD": "Cost markup multiplier - original cost",
        },
    };

    static usage_SG25_SG28_RNG = {
        "6167": {
            "4": "Quantity range",
        },
        "6411": {
            "BX": "box",
        },
    };

    static usage_SG25_SG29_RFF = {
        "1153": {
            "ACE": "Related document number",
            "ADE": "Account number",
            "ALO": "Receiving advice number",
            "CT": "Agreement number",
            "DQ": "Delivery note number",
            "FI": "File line identifier",
            "ON": "Order number (purchase)",
            "MA": "Ship notice/manifest number",
            "PK": "Packing list number",
            "VA": "VAT registration number",
            "VN": "Order number (vendor)",
            "ZZZ": "Mutually defined reference number"
        },
        "1156": {
            "1": "Schedule agreement"
        }
    };

    static usage_SG25_SG29_DTM = {
        "2005": {
            "4": "Order date/time",
            "124": "Despatch note date",
            "126": "Agreement date/time",
            "131": "Tax point date/time",
            "140": "Payment due date/time",
            "171": "Reference date/time*"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_SG25_SG30_PAC = {
        "7075": {
            "1": "Inner",
            "2": "Intermediate",
            "3": "Outer"
        }
    };
    static usage_SG25_SG30_MEA = {
        "6311": {
            "PD": "Physical dimensions (product ordered)",
        },
        "6313": {
            "AAA": "Unit net weight",
            "AAB": "Unit gross weight",
            "AAC": "Total net weight",
            "AAD": "Total gross weight",
            "AAW": "Gross volume",
            "AAX": "Net volume",
            "HT": "Height dimension",
            "LN": "Length dimension",
            "WD": "Width dimension"
        }
    };

    static usage_SG25_SG32_LOC = {
        "3227": {
            "19": "Factory/plant",
            "27": "Country of origin",
            "28": "Country of destination of goods"
        }
    };

    static usage_SG25_SG33_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax",
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

    static usage_SG25_SG33_MOA = {
        "5025": {
            "124": "Tax amount",
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency"
        }
    };

    static usage_SG25_SG33_LOC = {
        "3227": {
            "157": "Country of Value Added Tax (VAT) jurisdiction",
        },
    };
    static usage_SG25_SG34_NAD = {
        "3035": {
            "CA": "Carrier",
            "MF": "Manufacturer of goods",
            "SF": "Ship from",
            "ST": "Ship to"
        },
        "3055": DocInfoBase.ResponsibleAgency
    };

    static usage_SG25_SG34_SG35_RFF = {
        "1153": {
            "ACD": "Additional reference number",
            "ACK": "American Banker's Association (ABA) routing number",
            "AGU": "ESR member number",
            "AHL": "Creditor's reference number",
            "AHP": "Tax registration number",
            "AIH": "Common transaction reference number",
            "AP": "Accounts receivable number",
            "AV": "Account payable number",
            "CN": "Carrier's reference number",
            "FC": "Fiscal number",
            "GN": "Government reference number",
            "IA": "Internal vendor number",
            "IT": "Internal customer number",
            "PY": "Payee's financial institution account number",
            "RT": "Bank routing number",
            "SA": "Contact person",
            "SD": "Department name",
            "TL": "Tax exemption licence number",
            "VA": "VAT registration number",
            "ZZZ": "Mutually defined reference number"
        },
        "4000": DocInfoBase.ResponsibleAgency
    };

    static usage_SG25_SG34_SG35_DTM = {
        "2005": {
            "89": "Shipment tracking date",

        },
        "2379": DocInfoBase.TimeFormatQualifier
    };
    static usage_SG25_SG34_SG37_CTA = {
        "3139": {
            "IC": "Information contact",
        },
    };
    static usage_SG25_SG34_SG37_COM = {
        "3155": DocInfoBase.CommuChannelQualifier
    };
    static usage_SG25_SG38_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge"
        },
        "4471": DocInfoBase.Settlement,
        "1227": DocInfoBase.CalculationSequence,
        "7161": DocInfoBase.SpecialServices,
        "1131": {
            "175": "Account analysis codes"
        },
        "3055": {
            "92": "Assigned by buyer or buyer's agent"
        }
    };
    static usage_SG25_SG38_DTM = {
        "2005": {
            // "3": "Invoice date/time*",
            // "35": "Delivery date/time, actual",
            // "110": "Shipping date/time",
            // "137": "Document/message date/time*",
            "194": "Invoicing period start date/time",
            "206": "Invoicing period end date/time",
            // "263": "Invoicing period"
        },
        "2379": DocInfoBase.TimeFormatQualifier02
    };

    static usage_SG25_SG38_SG40_PCD = {
        "5245": {
            "2": "Charge",
            "3": "Allowance or charge",
            "12": "Discount"
        },
        "5249": {
            "13": "Invoice value"
        }
    };

    static usage_SG25_SG38_SG41_MOA = {
        "5025": DocInfoBase.MonetaryAmountType,
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency",
            "7": "Target currency"
        }
    };

    static usage_SG25_SG38_SG43_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax",
            "9": "Tax related information"
        },
        "5305": {
            "A": "Mixed tax rate",
            "E": "Exempt from tax",
            "S": "Standard rate",
            "Z": "Zero rated goods"
        }
    };

    static usage_SG48_MOA = {
        "5025": {
            "9": "Amount due/amount payable",
            "77": "Invoice amount",
            "79": "Total line items amount1",
            "113": "Prepaid amount",
            "124": "Tax amount2",
            "125": "Taxable amount3",
            "128": "Total amount",
            "144": "Shipping amount",
            "176": "Message total tax amount2",
            "259": "Total charges",
            "260": "Total allowances",
            "289": "Subtotal amount1",
            "299": "Special handling amount",
            "ZZZ": "Total amount without tax3"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency",
            "7": "Target currency"
        }
    };

    static usage_SG48_SG49_RFF = {
        "1153": {
            "AIL": "ESR reference number"
        },
    };
    static usage_SG50_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax"
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

    static usage_SG50_MOA = {
        "5025": {
            "124": "Tax amount",
            "125": "Taxable amount",
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency",
            "7": "Target currency"
        }
    };

    static usage_SG51_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge"
        },
        // "4471": DocInfoBase.Settlement,
        // "1227": DocInfoBase.CalculationSequence,
        "7161": DocInfoBase.SpecialServices02
    };

    static usage_SG51_MOA = {
        "5025": {
            "8": "Allowance or charge amount",
            // "38": "Invoice item amount",
            // "125": "Total line item amount without tax",
            // "128": "Total amount",
            "131": "Total charges/allowances",
            // "146": "Unit price",
            // "176": "Line item total tax amount",
            // "203": "Line item amount",
            // "259": "Total charges",
            // "260": "Total allowances",
            // "289": "Subtotal amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency",
            "11": "Payment currency"
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
    static comment_SG2_NAD = {
        "3207": DocInfoBase.codelists3207,
    }
    static comment_SG2_FII = {
        "3207": DocInfoBase.codelists3207,
    }

    static comment_SG2_SG3_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }
    static comment_SG6_TAX = {
        "5153": `**Tax type code**\n\nAll values defined by D.96A are allowed to be used.`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 5153 Duty/tax/fee type]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(5153)})`,
    }
    static comment_SG8_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }
    static comment_SG15_SG16_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    static comment_SG15_SG21_TAX = {
        "5153": `**Tax type code**\n\nAll values defined by D.96A are allowed to be used.`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 5153 Duty/tax/fee type]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(5153)})`,
    }

    static comment_SG25_ALI = {
        "3239": DocInfoBase.codelists3207,
    }

    static comment_SG25_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }
    static comment_SG25_SG29_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }
    static comment_SG25_SG30_PAC = {
        "7065": `**Type of packages**\n\n`
            + `Please refer to APPENDIX - [CODELISTS 7065 Type of packages identification]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(7065)})`,
    }
    static comment_SG25_SG32_LOC = {
        "3225": DocInfoBase.codelists3207,
    }

    static comment_SG25_SG33_TAX = {
        "5153": `**Tax type code**\n\nAll values defined by D.96A are allowed to be used.`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 5153 Duty/tax/fee type]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(5153)})`,
    }

    static comment_SG25_SG34_NAD = {
        "3207":DocInfoBase.codelists3207,
    }

    static comment_SG25_SG34_SG35_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    static comment_SG25_SG38_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    static comment_SG25_SG38_SG43_TAX = {
        "5153": `**Tax type code**\n\nAll values defined by D.96A are allowed to be used.`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 5153 Duty/tax/fee type]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(5153)})`,
    }
    static comment_SG50_TAX = {
        "5153": `**Tax type code**\n\nAll values defined by D.96A are allowed to be used.`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 5153 Duty/tax/fee type]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(5153)})`,
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGM":
                return Info_INVOIC.usage_BGM[ele.getSchemaId()]
                break;
            case "ROOT_DTM":
                return Info_INVOIC.usage_DTM[ele.getSchemaId()]
                break;
            case "ROOT_PAI":
                return Info_INVOIC.usage_PAI[ele.getSchemaId()]
                break;
            case "ROOT_FTX":
                return Info_INVOIC.usage_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG1_RFF":
                return Info_INVOIC.usage_SG1_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_INVOIC.usage_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG2_NAD":
                return Info_INVOIC.usage_SG2_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG2_LOC":
                return Info_INVOIC.usage_SG2_LOC[ele.getSchemaId()]
                break;
            case "ROOT_SG2_FII":
                return Info_INVOIC.usage_SG2_FII[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_RFF":
                return Info_INVOIC.usage_SG2_SG3_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_DTM":
                return Info_INVOIC.usage_SG2_SG3_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG5_CTA":
                return Info_INVOIC.usage_SG2_SG5_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG5_COM":
                return Info_INVOIC.usage_SG2_SG5_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG6_TAX":
                return Info_INVOIC.usage_SG6_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG7_CUX":
                return Info_INVOIC.usage_SG7_CUX[ele.getSchemaId()]
                break;
            case "ROOT_SG8_PAT":
                return Info_INVOIC.usage_SG8_PAT[ele.getSchemaId()]
                break;
            case "ROOT_SG8_DTM":
                return Info_INVOIC.usage_SG8_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG8_PCD":
                return Info_INVOIC.usage_SG8_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG8_MOA":
                return Info_INVOIC.usage_SG8_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG12_TOD":
                return Info_INVOIC.usage_SG12_TOD[ele.getSchemaId()]
                break;
            case "ROOT_SG15_ALC":
                return Info_INVOIC.usage_SG15_ALC[ele.getSchemaId()]
                break;
            case "ROOT_SG15_SG16_RFF":
                return Info_INVOIC.usage_SG15_SG16_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG15_SG16_DTM":
                return Info_INVOIC.usage_SG15_SG16_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG15_SG18_PCD":
                return Info_INVOIC.usage_SG15_SG18_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG15_SG19_MOA":
                return Info_INVOIC.usage_SG15_SG19_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG15_SG21_TAX":
                return Info_INVOIC.usage_SG15_SG21_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG15_SG21_MOA":
                return Info_INVOIC.usage_SG15_SG21_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG25_LIN":
                return Info_INVOIC.usage_SG25_LIN[ele.getSchemaId()]
                break;
            case "ROOT_SG25_PIA":
                return Info_INVOIC.usage_SG25_PIA[ele.getSchemaId()]
                break;
            case "ROOT_SG25_IMD":
                return Info_INVOIC.usage_SG25_IMD[ele.getSchemaId()]
                break;
            case "ROOT_SG25_QTY":
                return Info_INVOIC.usage_SG25_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG25_ALI":
                return Info_INVOIC.usage_SG25_ALI[ele.getSchemaId()]
                break;
            case "ROOT_SG25_DTM":
                return Info_INVOIC.usage_SG25_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG25_FTX":
                return Info_INVOIC.usage_SG25_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG26_MOA":
                return Info_INVOIC.usage_SG25_SG26_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG28_PRI":
                return Info_INVOIC.usage_SG25_SG28_PRI[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG28_APR":
                return Info_INVOIC.usage_SG25_SG28_APR[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG28_RNG":
                return Info_INVOIC.usage_SG25_SG28_RNG[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG29_RFF":
                return Info_INVOIC.usage_SG25_SG29_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG29_DTM":
                return Info_INVOIC.usage_SG25_SG29_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG30_PAC":
                return Info_INVOIC.usage_SG25_SG30_PAC[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG30_MEA":
                return Info_INVOIC.usage_SG25_SG30_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG32_LOC":
                return Info_INVOIC.usage_SG25_SG32_LOC[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG33_TAX":
                return Info_INVOIC.usage_SG25_SG33_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG33_MOA":
                return Info_INVOIC.usage_SG25_SG33_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG33_LOC":
                return Info_INVOIC.usage_SG25_SG33_LOC[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG34_NAD":
                return Info_INVOIC.usage_SG25_SG34_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG34_SG35_RFF":
                return Info_INVOIC.usage_SG25_SG34_SG35_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG34_SG35_DTM":
                return Info_INVOIC.usage_SG25_SG34_SG35_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG34_SG37_CTA":
                return Info_INVOIC.usage_SG25_SG34_SG37_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG34_SG37_COM":
                return Info_INVOIC.usage_SG25_SG34_SG37_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG38_ALC":
                return Info_INVOIC.usage_SG25_SG38_ALC[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG38_DTM":
                return Info_INVOIC.usage_SG25_SG38_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG38_SG40_PCD":
                return Info_INVOIC.usage_SG25_SG38_SG40_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG38_SG41_MOA":
                return Info_INVOIC.usage_SG25_SG38_SG41_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG38_SG43_TAX":
                return Info_INVOIC.usage_SG25_SG38_SG43_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG48_MOA":
                return Info_INVOIC.usage_SG48_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG48_SG49_RFF":
                return Info_INVOIC.usage_SG48_SG49_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG50_TAX":
                return Info_INVOIC.usage_SG50_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG50_MOA":
                return Info_INVOIC.usage_SG50_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG51_ALC":
                return Info_INVOIC.usage_SG51_ALC[ele.getSchemaId()]
                break;
            case "ROOT_SG51_MOA":
                return Info_INVOIC.usage_SG51_MOA[ele.getSchemaId()]
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
                return Info_INVOIC.comment_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG1_DTM":
                return Info_INVOIC.comment_SG1_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG2_NAD":
                return Info_INVOIC.comment_SG2_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG2_FII":
                return Info_INVOIC.comment_SG2_FII[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_DTM":
                return Info_INVOIC.comment_SG2_SG3_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG6_TAX":
                return Info_INVOIC.comment_SG6_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG8_DTM":
                return Info_INVOIC.comment_SG8_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG15_SG16_DTM":
                return Info_INVOIC.comment_SG15_SG16_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG15_SG21_TAX":
                return Info_INVOIC.comment_SG15_SG21_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG25_ALI":
                return Info_INVOIC.comment_SG25_ALI[ele.getSchemaId()]
                break;
            case "ROOT_SG25_DTM":
                return Info_INVOIC.comment_SG25_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG29_DTM":
                return Info_INVOIC.comment_SG25_SG29_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG30_PAC":
                return Info_INVOIC.comment_SG25_SG30_PAC[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG32_LOC":
                return Info_INVOIC.comment_SG25_SG32_LOC[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG33_TAX":
                return Info_INVOIC.comment_SG25_SG33_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG34_NAD":
                return Info_INVOIC.comment_SG25_SG34_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG34_SG35_DTM":
                return Info_INVOIC.comment_SG25_SG34_SG35_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG38_DTM":
                return Info_INVOIC.comment_SG25_SG38_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG25_SG38_SG43_TAX":
                return Info_INVOIC.comment_SG25_SG38_SG43_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG50_TAX":
                return Info_INVOIC.comment_SG50_TAX[ele.getSchemaId()]
                break;
            default:

        }
        return undefined;
    }
}