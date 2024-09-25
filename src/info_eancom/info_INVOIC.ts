import { DocInfoBase } from "../info/docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "../info/docInfoBase";

export class Info_INVOIC extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "380": "Commercial invoice",
            "381": "Credit note - goods and services",
            "383": "Debit note - goods and services",
            "385": "Summary invoice",
            "388": "Tax invoice"
        },
        "1225": {
            "3": "Deletion",
            "9": "Original",
            "31": "Copy"
        }

    };

    static usage_DTM = {
        "2005": {
            "11": "Shipping date/time",
            "35": "Delivery date/time, actual",
            "137": "Document/message date/time",
            "194": "Invoicing period start date/time",
            "200": "Pick-up/collection date/time of cargo",
            "206": "Invoicing period end date/time",
            "263": "Invoicing period"
        },
        "2379": DocInfoBase.TimeFormatQualifier04
    };

    static usage_PAI = {
        "4461": {
            "3": "Automated clearing house debit",
            "10": "In cash",
            "20": "Cheque",
            "21": "Banker's draft",
            "30": "Credit transfer",
            "31": "Debit transfer",
            "42": "Payment to bank account",
            "49": "Direct debit",
            "60": "Promissory note",
            "70": "Bill drawn by the creditor on the debtor",
            "97": "Clearing between partners",
            "11E": "Credit card (GS1 Code)",
            "12E": "Debit card (GS1 Code)"
        }
    };

    static usage_FTX = {
        "4451": {
            "AAB": "Terms of payments",
            "AAI": "General information",
            "ABN": "Accounting information",
            "PMD": "Payment detail/remittance information",
            "REG": "Regulatory information",
            "SUR": "Supplier remarks",
            "TXD": "Tax declaration*",
            "ZZZ": "Mutually defined"

        },
        "4453": {
            "3": "Triangular Transaction Law Reference"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG1_RFF = {
        "1153": {
            "AAK": "Ship notice number",
            "AGA": "Payment proposal number",
            "ALO": "Receiving advice number",
            "CR": "Customer reference number",
            "CT": "Agreement number",
            "DQ": "Delivery note number",
            "IV": "Previous invoice number",
            "MR": "System ID number",
            "ON": "Order number (buyer)",
            "VA": "VAT registration number*",
            "VN": "Order number (supplier)"
        },
        "1156": {
            "1": "Schedule agreement"
        }
    };

    static usage_SG1_DTM = {
        "2005": {
            "131": "Tax point date/time",
            "140": "Payment due date/time",
            "171": "Reference date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_SG2_NAD = {
        "3035": DocInfoBase.PartyQualifier02,
        "3055": DocInfoBase.ResponsibleAgency06,
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
            // "17": "S.W.I.F.T.",
            // "131": "DE, German Bankers Association"
        }
    };

    static usage_SG2_SG3_RFF = {
        "1153": DocInfoBase.ReferenceQualifier03,
        "4000": DocInfoBase.ResponsibleAgency06
    };

    // static usage_SG2_SG3_DTM = {
    //     "2005": {
    //         "89": "Shipment tracking date"
    //     },
    //     "2379": DocInfoBase.TimeFormatQualifier
    // };
    static usage_SG2_SG5_CTA = {
        "3139": {
            "IC": "Information contact",
            // "BF": "Requester contact"
        },
    };
    static usage_SG2_SG5_COM = {
        "3155": DocInfoBase.CommuChannelQualifier02
    };

    static usage_SG6_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax",
        },
        "5153": {
            "100": "Insurance tax (GS1 Code)",
            "AAD": "Tobacco tax",
            "AAF": "Coffee tax",
            "AAJ": "Tax on replacement part",
            "AAK": "Mineral oil tax",
            "ACT": "Alcohol tax (GS1 Code)",
            "CAR": "Car tax",
            "ENV": "Environmental tax",
            "EXC": "Excise duty",
            "GST": "Goods and services tax",
            "IMP": "Import tax",
            "OTH": "Other taxes",
            "VAT": "Value added tax"
        },
        "5289": {
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
            "11": "Payment currency"
        }
    };

    static usage_SG8_PAT = {
        "4279": {
            "3": "Fixed date",
            "20": "Penalty terms",
            "22": "Discount"
        },
        // "4277": {
        //     "6": "No drafts"
        // },
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
            // "209": "Value date",
            // "265": "Terms penalty due date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
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
            // "52": "Discount amount",
            "21": "Cash discount",
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency"
        }
    };

    static usage_SG12_TOD = {
        "4053": DocInfoBase.TransportationTermsCodeList04
    };

    static usage_SG16_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge"
        },
        "4471": DocInfoBase.Settlement,
        "1227": DocInfoBase.CalculationSequence,
        "7161": DocInfoBase.SpecialServices04
    };

    // static usage_SG16_SG16_RFF = {
    //     "1153": {
    //         "ZZZ": "Mutually defined reference number",
    //     },
    //     "1156": DocInfoBase.LanguageList
    // };

    // static usage_SG16_SG16_DTM = {
    //     "2005": {
    //         "194": "Start date/time",
    //         "206": "End date/time",
    //     },
    //     "2379": DocInfoBase.TimeFormatQualifier
    // };

    static usage_SG16_SG19_PCD = {
        "5245": {
            "1": "Allowance",
            "2": "Charge",
            "3": "Allowance or charge",
            "12": "Discount"
        },
        "5249": {
            "13": "Invoice value"
        }
    };

    static usage_SG16_SG20_MOA = {
        "5025": DocInfoBase.MonetaryAmountType02,
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency",
            "11": "Payment currency"
        }
    };

    static usage_SG16_SG22_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax",
            // "9": "Tax related information"
        },
        "5153": {
            "100": "Insurance tax (GS1 Code)",
            "AAD": "Tobacco tax",
            "AAF": "Coffee tax",
            "AAJ": "Tax on replacement part",
            "AAK": "Mineral oil tax",
            "ACT": "Alcohol tax (GS1 Code)",
            "CAR": "Car tax",
            "ENV": "Environmental tax",
            "EXC": "Excise duty",
            "GST": "Goods and services tax",
            "IMP": "Import tax",
            "OTH": "Other taxes",
            "VAT": "Value added tax"
        },
        "5305": {
            "A": "Mixed tax rate",
            "E": "Exempt from tax",
            "S": "Standard rate",
            "Z": "Zero rated goods"
        }
    };

    static usage_SG16_SG22_MOA = {
        "5025": {
            "124": "Tax amount",
            "176": "Total tax amount",
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency"
        }
    };
    static usage_SG26_LIN = {
        "1229": {
            "1": "Added",
        },
        "7143": {
            "SRV": "GS1 Global Trade Item Number",
        },
        "5495": {
            "1": "Sub-line information"
        }
    };

    static usage_SG26_PIA = {
        "4347": {
            "1": "Additional identification",
            "5": "Product identification",
        },
        "7143": DocInfoBase.ItemNumberType08
    };

    static usage_SG26_IMD = {
        "7077": {
            "B": "Code and text",
            "C": "Code (from industry code list)",
            "E": "Free-form short description",
            "F": "Free-form",
        },
        "7081": {
            "13": "Quality",
            "35": "Colour",
            "38": "Grade",
            "98": "Size",
            "SGR": "Size grid (GS1 Code)"
        },
        "7009": {
            "ACA": "Classification",
            "CSG": "Full display stand (GS1 Code)",
            "CTO": "Cut to order (GS1 Code)",
            "CU": "Consumer unit (GS1 Code)",
            "DU": "Despatch unit (GS1 Code)",
            "IN": "Invoicing unit (GS1 Code)",
            "RC": "Returnable container (GS1 Code)",
            "SG": "Standard group of products (mixed assortment) (GS1 Code)",
            "TU": "Traded unit (GS1 Code)",
            "SER": "Service (GS1 Code)",
            "VQ": "Variable quantity product (GS1 Code)"
        },
        "3055": {
            "9": "GS1"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG26_QTY = {
        "6063": {
            "47": "Invoiced quantity",
            "52": "Quantity per pack",
            "59": "Number of consumer units in the traded unit",
            "192": "Free goods quantity"
        },
    };
    static usage_SG26_ALI = {
        "4183": {
            // "88": "Supply of goods as returned consignment on which payment has been made",
            "140": "Return of goods"
        },
    };
    static usage_SG26_DTM = {
        "2005": {
            "35": "Delivery date/time, actual",
            "171": "Service item reference date",
            "194": "Service period start date/time",
            "206": "Service period end date/time",
            "351": "Inspection date"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_SG26_FTX = {
        "4451": {
            "AAI": "General information",
            // "ACB": "Additional information",
            "TXD": "Tax declaration",

            // "REG": "Regulatory information",
            // "FTX": "Tax declaration",
            "ZZZ": "Mutually defined"
        },
        "4453": {
            // "4": "Triangular transaction law reference"
            "3": "Triangular Transaction Law Reference"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG26_SG27_MOA = {
        "5025": {
            "38": "Invoice item amount",
            "125": "Taxable amount",
            "128": "Total amount",
            "176": "Line item total tax amount",
            "203": "Line item amount",
            "259": "Total charges",
            "260": "Total allowances",
            "289": "Subtotal amount",
            "402": "Total retail value"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency"
        }
    };

    static usage_SG26_SG29_PRI = {
        "5125": {
            "AAA": "Calculation net",
            "AAB": "Calculation gross",
            "AAE": "Information price, excluding allowances or charges, including taxes",
            "AAF": "Information price, excluding allowances or charges and taxes"
        },
        "5387": {
            // "PBQ": "Unit price beginning quantity",
            "AAK": "New price"
        },
    };

    // static usage_SG26_SG29_APR = {
    //     "4043": {
    //         "WS": "User",
    //     },
    //     "5393": {
    //         "CSD": "Cost markup multiplier - original cost",
    //     },
    // };

    // static usage_SG26_SG29_RNG = {
    //     "6167": {
    //         "4": "Quantity range",
    //     },
    //     "6411": {
    //         "BX": "box",
    //     },
    // };

    static usage_SG26_SG30_RFF = {
        "1153": {
            "ACE": "Service entry number",
            "AAK": "Ship notice number",
            "ALO": "Receiving advice number",
            "ASI": "Proof of delivery reference number",
            "BT": "Batch number/lot number",
            "CT": "Agreement number",
            "DQ": "Delivery note number",
            "FI": "File line identifier",
            "ON": "Order number (buyer)",
            "PD": "Promotion deal number",
            "VA": "VAT registration number*",
            "VN": "Order number (supplier)"
        },
        "1156": {
            "1": "Schedule agreement"
        }
    };

    static usage_SG26_SG30_DTM = {
        "2005": {
            "131": "Tax point date",
            "140": "Payment due date",
            "171": "Reference date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_SG26_SG31_PAC = {
        "7075": {
            "1": "Inner",
            "2": "Intermediate",
            "3": "Outer"
        }
    };
    static usage_SG26_SG31_MEA = {
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

    static usage_SG26_SG34_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax",
        },
        "5153": {
            "100": "Insurance tax (GS1 Code)",
            "AAD": "Tobacco tax",
            "AAF": "Coffee tax",
            "AAJ": "Tax on replacement part",
            "AAK": "Mineral oil tax",
            "ACT": "Alcohol tax (GS1 Code)",
            "CAR": "Car tax",
            "ENV": "Environmental tax",
            "EXC": "Excise duty",
            "GST": "Goods and services tax",
            "IMP": "Import tax",
            "OTH": "Other taxes",
            "VAT": "Value added tax"
        },
        "5289": {
            "TT": "Triangular Transaction"
        },
        "5305": {
            "A": "Mixed tax rate",
            "E": "Exempt from tax",
            "S": "Standard rate",
            "Z": "Zero rated goods"
        }
    };

    static usage_SG26_SG34_MOA = {
        "5025": {
            "124": "Tax amount",
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency"
        }
    };

    static usage_SG26_SG35_NAD = {
        "3035": {
            "CA": "Carrier",
            "MF": "Manufacturer of goods",
            "SF": "Ship from",
            "ST": "Ship to"
        },
        "3055": DocInfoBase.ResponsibleAgency06
    };

    static usage_SG26_SG35_SG36_RFF = {
        "1153": {
            "AHL": "Creditor's reference number",
            "CN": "Carrier's reference number",
            "FC": "Fiscal number",
            "IT": "Internal customer number",
            "SD": "Department name",
            "TL": "Tax exemption licence number",
            "VA": "VAT registration number"
        },
        "4000": DocInfoBase.ResponsibleAgency06
    };

    // static usage_SG26_SG35_SG35_DTM = {
    //     "2005": {
    //         "89": "Shipment tracking date",

    //     },
    //     "2379": DocInfoBase.TimeFormatQualifier
    // };
    // static usage_SG26_SG35_SG37_CTA = {
    //     "3139": {
    //         "IC": "Information contact",
    //     },
    // };
    // static usage_SG26_SG35_SG37_COM = {
    //     "3155": DocInfoBase.CommuChannelQualifier
    // };
    static usage_SG26_SG39_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge",
            "N": "Accounting"
        },
        "4471": DocInfoBase.Settlement,
        "1227": DocInfoBase.CalculationSequence,
        "7161": DocInfoBase.SpecialServices04,
        // "1131": {
        //     "175": "Account analysis codes"
        // },
        // "3055": {
        //     "92": "Assigned by buyer or buyer's agent"
        // }
    };

    static usage_SG26_SG39_SG41_PCD = {
        "5245": {
            "1": "Allowance",
            "2": "Charge",
            "3": "Allowance or charge",
            "12": "Discount"
        },
        "5249": {
            "13": "Invoice value"
        }
    };

    static usage_SG26_SG39_SG42_MOA = {
        "5025": DocInfoBase.MonetaryAmountType03,
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency",
            "11": "Payment currency"
        }
    };

    static usage_SG26_SG39_SG44_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax",
            // "9": "Tax related information"
        },
        "5153": {
            "100": "Insurance tax (GS1 Code)",
            "AAD": "Tobacco tax",
            "AAF": "Coffee tax",
            "AAJ": "Tax on replacement part",
            "AAK": "Mineral oil tax",
            "ACT": "Alcohol tax (GS1 Code)",
            "CAR": "Car tax",
            "ENV": "Environmental tax",
            "EXC": "Excise duty",
            "GST": "Goods and services tax",
            "IMP": "Import tax",
            "OTH": "Other taxes",
            "VAT": "Value added tax"
        },
        "5305": {
            "A": "Mixed tax rate",
            "E": "Exempt from tax",
            "S": "Standard rate",
            "Z": "Zero rated goods"
        }
    };

    static usage_SG26_SG39_SG44_MOA = {
        "5025": {
            "124": "Tax amount",
            "176": "Total tax amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency",
        }
    };

    static usage_SG50_MOA = {
        "5025": {
            "9": "Amount due/amount payable",
            "64": "Shipping amount",
            "77": "Invoice amount*",
            "79": "Total line items amount",
            "113": "Prepaid amount",
            "124": "Tax amount",
            "125": "Taxable amount",
            "128": "Total amount*",
            "130": "Special handling amount",
            "176": "Total tax amount",
            "178": "Exact amount",
            "259": "Total charges",
            "260": "Total allowances",
            "402": "Total retail value",
            "35E": "Total returnable items deposit amount (GS1 Code)",
            "36E": "Goods and services total amount (GS1 Code)",
            "37E": "Gross-progress payment amount (GS1 Code)",
            "XB5": "Information amount (SWIFT Code)"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency",
            "11": "Payment currency"
        }
    };

    // static usage_SG50_SG49_RFF = {
    //     "1153": {
    //         "AIL": "ESR reference number"
    //     },
    // };
    static usage_SG52_TAX = {
        "5283": {
            "5": "Customs duty",
            "7": "Tax"
        },
        "5153": {
            "100": "Insurance tax (GS1 Code)",
            "AAD": "Tobacco tax",
            "AAF": "Coffee tax",
            "AAJ": "Tax on replacement part",
            "AAK": "Mineral oil tax",
            "ACT": "Alcohol tax (GS1 Code)",
            "CAR": "Car tax",
            "ENV": "Environmental tax",
            "EXC": "Excise duty",
            "GST": "Goods and services tax",
            "IMP": "Import tax",
            "OTH": "Other taxes",
            "VAT": "Value added tax"
        },
        "5289": {
            "TT": "Triangular Transaction"
        },
        "5305": {
            "A": "Mixed tax rate",
            "E": "Exempt from tax",
            "S": "Standard rate",
            "Z": "Zero rated goods"
        }
    };

    static usage_SG52_MOA = {
        "5025": {
            "124": "Tax amount",
            "125": "Taxable amount",
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "4": "Invoicing currency",
            "11": "Payment currency"
        }
    };

    static usage_SG53_ALC = {
        "5463": {
            "A": "Allowance",
            "C": "Charge"
        },
        // "4471": DocInfoBase.Settlement,
        // "1227": DocInfoBase.CalculationSequence,
        "7161": DocInfoBase.SpecialServices04
    };

    static usage_SG53_MOA = {
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

    static comment_SG2_NAD = {
        "3035": DocInfoBase.codelists3035,
        "3207": DocInfoBase.codelists3207,
    }

    static comment_SG2_SG3_RFF = {
        "1153": DocInfoBase.codelists1153,
    }

    static comment_SG7_CUX = {
        "6345": DocInfoBase.codelists6345
    }

    static comment_SG8_MOA = {
        "6345": DocInfoBase.codelists6345
    }

    static comment_SG16_SG20_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG16_SG22_MOA = {
        "6345": DocInfoBase.codelists6345
    }

    static comment_SG26_QTY = {
        "6411": DocInfoBase.codelists6411,
    }

    static comment_SG26_ALI = {
        "3239": DocInfoBase.codelists3207,
    }

    static comment_SG26_SG27_MOA = {
        "6345": DocInfoBase.codelists6345
    }

    static comment_SG26_SG29_PRI = {
        "6411": DocInfoBase.codelists6411,
    }
    static comment_SG26_SG31_MEA = {
        "6411": DocInfoBase.codelists6411,
    }
    static comment_SG26_SG34_MOA = {
        "6345": DocInfoBase.codelists6345
    }

    static comment_SG26_SG35_NAD = {
        "3207":DocInfoBase.codelists3207,
    }

    static comment_SG26_SG39_SG42_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG26_SG39_SG44_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG50_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG52_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG53_MOA = {
        "6345": DocInfoBase.codelists6345
    }

    static comment_SG26_SG35_SG35_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    static comment_SG26_SG39_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    static comment_SG26_SG39_SG44_TAX = {
        "5153": `**Tax type code**\n\nAll values defined by D.96A are allowed to be used.`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 5153 Duty/tax/fee type]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(5153)})`,
    }
    static comment_SG52_TAX = {
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
            // case "ROOT_SG2_LOC":
            //     return Info_INVOIC.usage_SG2_LOC[ele.getSchemaId()]
            //     break;
            case "ROOT_SG2_FII":
                return Info_INVOIC.usage_SG2_FII[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_RFF":
                return Info_INVOIC.usage_SG2_SG3_RFF[ele.getSchemaId()]
                break;
            // case "ROOT_SG2_SG3_DTM":
            //     return Info_INVOIC.usage_SG2_SG3_DTM[ele.getSchemaId()]
            //     break;
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
            case "ROOT_SG16_ALC":
                return Info_INVOIC.usage_SG16_ALC[ele.getSchemaId()]
                break;
            // case "ROOT_SG16_SG16_RFF":
            //     return Info_INVOIC.usage_SG16_SG16_RFF[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG16_SG16_DTM":
            //     return Info_INVOIC.usage_SG16_SG16_DTM[ele.getSchemaId()]
            //     break;
            case "ROOT_SG16_SG19_PCD":
                return Info_INVOIC.usage_SG16_SG19_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SG20_MOA":
                return Info_INVOIC.usage_SG16_SG20_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SG22_TAX":
                return Info_INVOIC.usage_SG16_SG22_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SG22_MOA":
                return Info_INVOIC.usage_SG16_SG22_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_LIN":
                return Info_INVOIC.usage_SG26_LIN[ele.getSchemaId()]
                break;
            case "ROOT_SG26_PIA":
                return Info_INVOIC.usage_SG26_PIA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_IMD":
                return Info_INVOIC.usage_SG26_IMD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_QTY":
                return Info_INVOIC.usage_SG26_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG26_ALI":
                return Info_INVOIC.usage_SG26_ALI[ele.getSchemaId()]
                break;
            case "ROOT_SG26_DTM":
                return Info_INVOIC.usage_SG26_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_FTX":
                return Info_INVOIC.usage_SG26_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG26_MOA":
                return Info_INVOIC.usage_SG26_SG27_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG29_PRI":
                return Info_INVOIC.usage_SG26_SG29_PRI[ele.getSchemaId()]
                break;
            // case "ROOT_SG26_SG29_APR":
            //     return Info_INVOIC.usage_SG26_SG29_APR[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG26_SG29_RNG":
            //     return Info_INVOIC.usage_SG26_SG29_RNG[ele.getSchemaId()]
            //     break;
            case "ROOT_SG26_SG30_RFF":
                return Info_INVOIC.usage_SG26_SG30_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG30_DTM":
                return Info_INVOIC.usage_SG26_SG30_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG31_PAC":
                return Info_INVOIC.usage_SG26_SG31_PAC[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG31_MEA":
                return Info_INVOIC.usage_SG26_SG31_MEA[ele.getSchemaId()]
                break;
            // case "ROOT_SG26_SG32_LOC":
            //     return Info_INVOIC.usage_SG26_SG32_LOC[ele.getSchemaId()]
            //     break;
            case "ROOT_SG26_SG34_TAX":
                return Info_INVOIC.usage_SG26_SG34_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG34_MOA":
                return Info_INVOIC.usage_SG26_SG34_MOA[ele.getSchemaId()]
                break;
            // case "ROOT_SG26_SG34_LOC":
            //     return Info_INVOIC.usage_SG26_SG34_LOC[ele.getSchemaId()]
            //     break;
            case "ROOT_SG26_SG35_NAD":
                return Info_INVOIC.usage_SG26_SG35_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG35_SG36_RFF":
                return Info_INVOIC.usage_SG26_SG35_SG36_RFF[ele.getSchemaId()]
                break;
            // case "ROOT_SG26_SG35_SG35_DTM":
            //     return Info_INVOIC.usage_SG26_SG35_SG35_DTM[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG26_SG35_SG37_CTA":
            //     return Info_INVOIC.usage_SG26_SG35_SG37_CTA[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG26_SG35_SG37_COM":
            //     return Info_INVOIC.usage_SG26_SG35_SG37_COM[ele.getSchemaId()]
            //     break;
            case "ROOT_SG26_SG39_ALC":
                return Info_INVOIC.usage_SG26_SG39_ALC[ele.getSchemaId()]
                break;
            // case "ROOT_SG26_SG39_DTM":
            //     return Info_INVOIC.usage_SG26_SG39_DTM[ele.getSchemaId()]
            //     break;
            case "ROOT_SG26_SG39_SG41_PCD":
                return Info_INVOIC.usage_SG26_SG39_SG41_PCD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG39_SG42_MOA":
                return Info_INVOIC.usage_SG26_SG39_SG42_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG39_SG44_TAX":
                return Info_INVOIC.usage_SG26_SG39_SG44_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG39_SG44_MOA":
                return Info_INVOIC.usage_SG26_SG39_SG44_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG50_MOA":
                return Info_INVOIC.usage_SG50_MOA[ele.getSchemaId()]
                break;
            // case "ROOT_SG50_SG49_RFF":
            //     return Info_INVOIC.usage_SG50_SG49_RFF[ele.getSchemaId()]
            //     break;
            case "ROOT_SG52_TAX":
                return Info_INVOIC.usage_SG52_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG52_MOA":
                return Info_INVOIC.usage_SG52_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG53_ALC":
                return Info_INVOIC.usage_SG53_ALC[ele.getSchemaId()]
                break;
            case "ROOT_SG53_MOA":
                return Info_INVOIC.usage_SG53_MOA[ele.getSchemaId()]
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
            // case "ROOT_DTM":
            //     return Info_INVOIC.comment_DTM[ele.getSchemaId()]
            //     break;
            // case "ROOT_SG1_DTM":
            //     return Info_INVOIC.comment_SG1_DTM[ele.getSchemaId()]
            //     break;
            case "ROOT_SG2_NAD":
                return Info_INVOIC.comment_SG2_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG2_SG3_RFF":
                return Info_INVOIC.comment_SG2_SG3_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG7_CUX":
                return Info_INVOIC.comment_SG7_CUX[ele.getSchemaId()]
                break;
            case "ROOT_SG8_MOA":
                return Info_INVOIC.comment_SG8_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SG20_MOA":
                return Info_INVOIC.comment_SG16_SG20_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG16_SG22_MOA":
                return Info_INVOIC.comment_SG16_SG22_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_QTY":
                return Info_INVOIC.comment_SG26_QTY[ele.getSchemaId()]
                break;
            case "ROOT_SG26_ALI":
                return Info_INVOIC.comment_SG26_ALI[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG27_MOA":
                return Info_INVOIC.comment_SG26_SG27_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG29_PRI":
                return Info_INVOIC.comment_SG26_SG29_PRI[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG31_MEA":
                return Info_INVOIC.comment_SG26_SG31_MEA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG34_MOA":
                return Info_INVOIC.comment_SG26_SG34_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG35_NAD":
                return Info_INVOIC.comment_SG26_SG35_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG39_SG42_MOA":
                return Info_INVOIC.comment_SG26_SG39_SG42_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG39_SG44_MOA":
                return Info_INVOIC.comment_SG26_SG39_SG44_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG50_MOA":
                return Info_INVOIC.comment_SG50_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG52_MOA":
                return Info_INVOIC.comment_SG52_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG53_MOA":
                return Info_INVOIC.comment_SG53_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG35_SG35_DTM":
                return Info_INVOIC.comment_SG26_SG35_SG35_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG39_DTM":
                return Info_INVOIC.comment_SG26_SG39_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG26_SG39_SG44_TAX":
                return Info_INVOIC.comment_SG26_SG39_SG44_TAX[ele.getSchemaId()]
                break;
            case "ROOT_SG52_TAX":
                return Info_INVOIC.comment_SG52_TAX[ele.getSchemaId()]
                break;
            default:

        }
        return undefined;
    }
}