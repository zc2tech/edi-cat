import { DocInfoBase } from "../info/docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "../info/docInfoBase";

export class Info_REMADV extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "481": "Remittance advice",
        },
        "1225": {
            "7": "Duplicate",
            "9":"Original"
        }

    };

    static usage_DTM = {
        "2005": {
            "137": "Document/message date/time",
            "138": "Payment date/time",
            // "203": "Execution date/time, requested"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_RFF = {
        "1153": {
            // "ALC": "Previous payment remittance",
            "ACW": "Reference number to previous message",
            "PQ": "Payment reference",
            "ZZZ": "Mutually defined reference number"
        }
    }

    static usage_FII = {
        "3035": {
            "PB": "Paying financial institution",
            // "PE": "Payee",
            // "PR": "Payer",
            "RB": "Receiving financial institution"
        },
        "1131": {
            // "150": "Financial routing"
            "25": "Bank identification"
        },
        "3055": {
            "5": "ISO (International Organization for Standardization)",
            "17": "S.W.I.F.T."
            // "ZZZ": "Mutually defined"
        },
    };
    static usage_PAI = {
        "4439": {
            "1": "Direct payment",
            // "2": "Automatic clearing house credit",
            // "3": "Automatic clearing house debit",
            // "4": "Automatic clearing house credit-savings account",
            // "5": "Automatic clearing house debit-demand account",
            // "6": "Bank book transfer (credit)",
            // "7": "Bank book transfer (debit)",
            // "8": "Doc collection via 3rd party with bill of EX",
            // "9": "Doc collection via 3rd party no bill of EX",
            // "10": "Irrevocable documentary credit",
            // "11": "Transferable irrevocable documentary credit",
            // "12": "Confirmed irrevocable documentary credit",
            // "13": "Transferable confirmed irrevocable documentary credit",
            // "14": "Revocable documentary credit",
            // "15": "Irrevocable letter of credit-confirmed",
            // "16": "Letter of guarantee",
            // "17": "Revocable letter of credit",
            // "18": "Standby letter of credit",
            // "19": "Irrevocable letter of credit unconfirmed",
            // "20": "Clean collection (ICC)",
            // "21": "Documentary collection (ICC)",
            // "22": "Documentary sight collection (ICC)",
            // "23": "Documentary collection with date of expiry (ICC)",
            // "24": "Documentary collection: bill of exchange against acceptance",
            // "25": "Documentary collection: bill of exchange against payment",
            // "26": "Collection subject to buyer's approval (ICC)",
            // "27": "Collection by a bank consignee for the goods (ICC)",
            // "28": "Collection under CMEA rules with immediate payment and",
            // "29": "Collection under CMEA rules with prior acceptance",
            // "30": "Other collection",
            // "31": "Open account against payment in advance",
            // "32": "Open account for contra",
            // "33": "Open account for payment",
            // "34": "Seller to advise buyer",
            // "35": "Documents through banks",
            // "36": "Charging (to account)",
            // "37": "Available with issuing bank",
            // "38": "Available with advising bank",
            // "39": "Available with named bank",
            // "40": "Available with any bank",
            // "41": "Available with any bank in ...",
            // "42": "Indirect payment",
            // "43": "Reassignment",
            // "44": "Offset",
            // "45": "Special entries",
            // "46": "Instalment payment",
            // "47": "Instalment payment with draft",
            // "61": "Set-off by exchange of documents",
            // "62": "Set-off by reciprocal credits",
            // "63": "Set-off by \"linkage\" (against reciprocal benefits)",
            // "64": "Set-off by exchange of goods",
            // "69": "Other set-off",
            // "70": "Supplier to invoice",
            // "71": "Recipient to self bill",
            // "ZZZ": "Mutually defined"
        },
        "4461": {
            "3": "Automated clearing house debit",
            "10": "In cash",
            "20": "Cheque",
            "21": "Banker's draft",
            "42": "Payment to bank account",
            "11E": "Credit card (GS1 Code)",
            "12E": "Debit card (GS1 Code)"            
            // "30": "Credit transfer",
            // "31": "Debit transfer",
            // "42": "Payment to bank account",
            // "ZZZ": "Mutually defined"
        }
    };

    // static usage_FTX = {
    //     "4451": {
    //         "AAI": "General information",
    //         "PAI": "Payment instructions information",
    //         "ZZZ": "Mutually defined"
    //     },
    //     "3453": DocInfoBase.LanguageList
    // };

    static usage_SG1_NAD = {
        "3035": {
            // "PB": "Paying financial institution",
            "I1": "ntermediary bank",
            "PE": "Payee",
            "PR": "Payer",
            "RE": "Party to receive commercial invoice remittance",
            // "RB": "Receiving financial institution"
        },
        "3055": DocInfoBase.ResponsibleAgency04
    };

    static usage_SG1_SG3_CTA = {
        "3139": {
            "IC": "Information contact"
        },
    };
    static usage_SG1_SG3_COM = {
        "3155": DocInfoBase.CommuChannelQualifier02
    };
    static usage_SG4_CUX = {
        "6347": {
            "2": "Reference currency",
            "3": "Target currency"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            // "7": "Target currency",
            "4": "Invoicing currency",
            "11": "Payment currency"
        },
    };

    static usage_SG5_DOC = {
        "1001": {
            // "481": "Remittance advice"
            "220": "Order",
            "315": "Contract",
            "380": "Commercial invoice"
        },
        // "1131": {
        //     "150": "Financial routing"
        // },
        // "3055": {
        //     "92": "Assigned by buyer or buyer's agent"
        // }
    };

    static usage_SG5_MOA = {
        "5025": {
            // "11": "Amount paid",
            // "52": "Discount amount",
            // "77": "Invoice amount",
            // "165": "Adjustment amount"
            "9": "Amount due/amount payable",
            "12": "Amount remitted",
            "52": "Discount amount",
            "165": "Adjustment amount"            
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "11": "Payment currency"
        }
    };

    static usage_SG5_DTM = {
        "2005": {
            "3": "Invoice date/time",
            "4": "Order date/time",
            "126": "Contract date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier03
    };

    static usage_SG5_RFF = {
        "1153": {
            // "CT": "Agreement number",
            // "IV": "Invoice number",
            // "ON": "Order number (purchase)"
            "ACE": "Related document number",
            "AGA": "Payment proposal number",
            "CT": "Contract number",
            "ON": "Order number (buyer)",
            "ZZZ":"Mutually defined reference number"        
        }
    }

    static usage_SG5_SG7_AJT = {
        "4465": {
            "1": "Agreed settlement",
            "3": "Damaged goods",
            "4": "Short delivery",
            "5": "Price query",
            "9": "Invoice error",
            "26": "Taxes",
            "40": "Deducted freight costs",
            "66": "Cash discount",
            "74": "Quantity discount",
            "75": "Promotion discount",
            "90": "Treasury management service charge",
            "39E": "Pricing discount (GS1 Code)",
            "41E": "Sundry discount (GS1 Code)",
            "ZZZ": "Mutually defined"         
        },
    };

    static usage_SG5_SG7_MOA = {
        "5025": {
            // "9": "Amount due/amount payable",
            // "12": "Amount remitted",
            // "52": "Discount amount",
            "165": "Adjustment amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343":  {
            "11":"Payment currency"
        }
    };
    static usage_SG5_SG7_FTX = {
        "4451": {
            "ACB": "Additional information"
        },
        "3453": DocInfoBase.LanguageList
  
    };

    // static comment_DTM = {
    //     "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
    //         + `Code 304 is recommended. Please refer for special requirements and time zone usage`
    //         + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
    //         + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    // }

    static comment_SG1_NAD = {
        "3207":DocInfoBase.codelists3207,
    }
    static comment_SG4_CUX = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG5_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_SG5_SG7_MOA = {
        "6345": DocInfoBase.codelists6345
    }
    static comment_MOA = {
        "6345": DocInfoBase.codelists6345
    }

    // static comment_SG5_DTM = {
    //     "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
    //         + `Code 304 is recommended. Please refer for special requirements and time zone usage`
    //         + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
    //         + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    // }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGM":
                return Info_REMADV.usage_BGM[ele.getSchemaId()]
                break;
            case "ROOT_DTM":
                return Info_REMADV.usage_DTM[ele.getSchemaId()]
                break;
            case "ROOT_RFF":
                return Info_REMADV.usage_RFF[ele.getSchemaId()]
                break;
            case "ROOT_FII":
                return Info_REMADV.usage_FII[ele.getSchemaId()]
                break;
            case "ROOT_PAI":
                return Info_REMADV.usage_PAI[ele.getSchemaId()]
                break;
            case "ROOT_SG1_NAD":
                return Info_REMADV.usage_SG1_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG1_SG3_CTA":
                return Info_REMADV.usage_SG1_SG3_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG1_SG3_COM":
                return Info_REMADV.usage_SG1_SG3_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG4_CUX":
                return Info_REMADV.usage_SG4_CUX[ele.getSchemaId()]
                break;
            case "ROOT_SG5_DOC":
                return Info_REMADV.usage_SG5_DOC[ele.getSchemaId()]
                break;
            case "ROOT_SG5_MOA":
                return Info_REMADV.usage_SG5_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG5_DTM":
                return Info_REMADV.usage_SG5_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG5_RFF":
                return Info_REMADV.usage_SG5_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG5_SG7_AJT":
                return Info_REMADV.usage_SG5_SG7_AJT[ele.getSchemaId()]
                break;
            case "ROOT_SG5_SG7_MOA":
                return Info_REMADV.usage_SG5_SG7_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG5_SG7_FTX":
                return Info_REMADV.usage_SG5_SG7_FTX[ele.getSchemaId()]
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
            //     return Info_REMADV.comment_DTM[ele.getSchemaId()]
            //     break;
            case "ROOT_SG1_NAD":
                return Info_REMADV.comment_SG1_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG4_CUX":
                return Info_REMADV.comment_SG4_CUX[ele.getSchemaId()]
                break;
            case "ROOT_SG5_MOA":
                return Info_REMADV.comment_SG5_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG5_SG7_MOA":
                return Info_REMADV.comment_SG5_SG7_MOA[ele.getSchemaId()]
                break;
            case "ROOT_MOA":
                return Info_REMADV.comment_MOA[ele.getSchemaId()]
                break;
            // case "ROOT_SG5_DTM":
            //     return Info_REMADV.comment_SG5_DTM[ele.getSchemaId()]
            //     break;

            default:

        }
        return undefined;
    }
}