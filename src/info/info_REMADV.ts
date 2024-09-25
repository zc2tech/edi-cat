import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_REMADV extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "481": "Remittance advice",
        },
        "1131": {
            "150": "Financial routing"
        },
        "3055": {
            "92": "Assigned by buyer or buyer's agent"
        },
        "1225": {
            "7": "Duplicate"
        }

    };

    static usage_DTM = {
        "2005": {
            "137": "Document/message date/time",
            "138": "Earlier payment date/time",
            "203": "Execution date/time, requested"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };
    static usage_RFF = {
        "1153": {
            "ALC": "Previous payment remittance",
            "PQ": "Payment reference",
            "ZZZ": "Mutually defined reference number"
        }
    }

    static usage_FII = {
        "3035": {
            "PB": "Paying financial institution",
            "PE": "Payee",
            "PR": "Payer",
            "RB": "Receiving financial institution"
        },
        "1131": {
            "150": "Financial routing"
        },
        "3055": {
            "ZZZ": "Mutually defined"
        },
    };
    static usage_PAI = {
        "4439": {
            "1": "Direct payment",
            "2": "Automatic clearing house credit",
            "3": "Automatic clearing house debit",
            "4": "Automatic clearing house credit-savings account",
            "5": "Automatic clearing house debit-demand account",
            "6": "Bank book transfer (credit)",
            "7": "Bank book transfer (debit)",
            "8": "Doc collection via 3rd party with bill of EX",
            "9": "Doc collection via 3rd party no bill of EX",
            "10": "Irrevocable documentary credit",
            "11": "Transferable irrevocable documentary credit",
            "12": "Confirmed irrevocable documentary credit",
            "13": "Transferable confirmed irrevocable documentary credit",
            "14": "Revocable documentary credit",
            "15": "Irrevocable letter of credit-confirmed",
            "16": "Letter of guarantee",
            "17": "Revocable letter of credit",
            "18": "Standby letter of credit",
            "19": "Irrevocable letter of credit unconfirmed",
            "20": "Clean collection (ICC)",
            "21": "Documentary collection (ICC)",
            "22": "Documentary sight collection (ICC)",
            "23": "Documentary collection with date of expiry (ICC)",
            "24": "Documentary collection: bill of exchange against acceptance",
            "25": "Documentary collection: bill of exchange against payment",
            "26": "Collection subject to buyer's approval (ICC)",
            "27": "Collection by a bank consignee for the goods (ICC)",
            "28": "Collection under CMEA rules with immediate payment and",
            "29": "Collection under CMEA rules with prior acceptance",
            "30": "Other collection",
            "31": "Open account against payment in advance",
            "32": "Open account for contra",
            "33": "Open account for payment",
            "34": "Seller to advise buyer",
            "35": "Documents through banks",
            "36": "Charging (to account)",
            "37": "Available with issuing bank",
            "38": "Available with advising bank",
            "39": "Available with named bank",
            "40": "Available with any bank",
            "41": "Available with any bank in ...",
            "42": "Indirect payment",
            "43": "Reassignment",
            "44": "Offset",
            "45": "Special entries",
            "46": "Instalment payment",
            "47": "Instalment payment with draft",
            "61": "Set-off by exchange of documents",
            "62": "Set-off by reciprocal credits",
            "63": "Set-off by \"linkage\" (against reciprocal benefits)",
            "64": "Set-off by exchange of goods",
            "69": "Other set-off",
            "70": "Supplier to invoice",
            "71": "Recipient to self bill",
            "ZZZ": "Mutually defined"
        },
        "4461": {
            "3": "Automated clearing house debit",
            "10": "In cash",
            "20": "Cheque",
            "21": "Banker's draft",
            "30": "Credit transfer",
            "31": "Debit transfer",
            "42": "Payment to bank account",
            "ZZZ": "Mutually defined"
        }
    };

    static usage_FTX = {
        "4451": {
            "AAI": "General information",
            "PAI": "Payment instructions information",
            "ZZZ": "Mutually defined"
        },
        "3453": DocInfoBase.LanguageList
    };

    static usage_SG1_NAD = {
        "3035": {
            "PB": "Paying financial institution",
            "PE": "Payee",
            "PR": "Payer",
            "RB": "Receiving financial institution"
        },
        "3055": DocInfoBase.ResponsibleAgency
    };

    static usage_SG1_SG2_CTA = {
        "3139": {
            "IC": "Information contact"
        },
    };
    static usage_SG1_SG2_COM = {
        "3155": DocInfoBase.CommuChannelQualifier
    };
    static usage_SG3_CUX = {
        "6347": {
            "2": "Reference currency",
            "3": "Target currency"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "7": "Target currency",
            "11": "Payment currency"
        },
    };

    static usage_SG4_DOC = {
        "1001": {
            "481": "Remittance advice"
        },
        "1131": {
            "150": "Financial routing"
        },
        "3055": {
            "92": "Assigned by buyer or buyer's agent"
        }
    };

    static usage_SG4_MOA = {
        "5025": {
            "11": "Amount paid",
            "52": "Discount amount",
            "77": "Invoice amount",
            "165": "Adjustment amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343": {
            "11": "Payment currency"
        }
    };

    static usage_SG4_DTM = {
        "2005": {
            "3": "Invoice date/time",
            "4": "Order date/time",
            "126": "Agreement date/time"
        },
        "2379": DocInfoBase.TimeFormatQualifier
    };

    static usage_SG4_RFF = {
        "1153": {
            "CT": "Agreement number",
            "IV": "Invoice number",
            "ON": "Order number (purchase)"
        }
    }

    static usage_SG4_SG6_AJT = {
        "4465": {
            "1": "Agreed settlement",
            "2": "Below specification goods",
            "3": "Damaged goods",
            "4": "Short delivery",
            "5": "Price query",
            "6": "Proof of delivery required",
            "7": "Payment on account",
            "8": "Returnable container charge included",
            "9": "Invoice error",
            "10": "Costs for draft",
            "11": "Bank charges",
            "12": "Agent commission",
            "13": "Counter claim",
            "14": "Wrong delivery",
            "15": "Goods returned to agent",
            "16": "Goods partly returned",
            "17": "Transport damage",
            "18": "Goods on consignment",
            "19": "Trade discount",
            "20": "Discount for late delivery",
            "21": "Advertising costs",
            "22": "Customs duties",
            "23": "Telephone and postal costs",
            "24": "Repair costs",
            "25": "Attorney fees",
            "26": "Taxes",
            "27": "Reclaimed deduction",
            "28": "See separate advice",
            "29": "Buyer refused to take delivery",
            "30": "Direct payment to seller",
            "31": "Buyer disagrees with due date",
            "32": "Goods not delivered",
            "33": "Late delivery",
            "34": "Quoted as paid to you",
            "35": "Goods returned",
            "36": "Invoice not received",
            "37": "Credit note to debtor/not to us",
            "38": "Deducted bonus",
            "39": "Deducted discount",
            "40": "Deducted freight costs",
            "41": "Deduction against other invoices",
            "42": "Credit balance(s)",
            "43": "Reason unknown",
            "44": "Awaiting message from seller",
            "45": "Debit note to seller",
            "46": "Discount beyond terms",
            "47": "See buyer's letter",
            "48": "Allowance/charge error",
            "49": "Substitute product",
            "50": "Terms of sale error",
            "51": "Required data missing",
            "52": "Wrong invoice",
            "53": "Duplicate invoice",
            "54": "Weight error",
            "55": "Additional charge not authorized",
            "56": "Incorrect discount",
            "57": "Price change",
            "58": "Variation",
            "59": "Chargeback",
            "60": "Offset",
            "61": "Indirect payment",
            "62": "Financial reassignment",
            "63": "Reinstatement of chargeback/offset",
            "64": "Expecting new terms",
            "65": "Settlement to agent",
            "ZZZ": "Mutually defined"
        },
    };

    static usage_MOA = {
        "5025": {
            "9": "Amount due/amount payable",
            "12": "Amount remitted",
            "52": "Discount amount",
            "165": "Adjustment amount"
        },
        "6345": DocInfoBase.CurrencyList,
        "6343":  {
            "11":"Payment currency"
        }
    };

    static comment_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    static comment_SG1_NAD = {
        "3207": DocInfoBase.codelists3207,
    }

    static comment_SG4_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

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
            case "ROOT_FTX":
                return Info_REMADV.usage_FTX[ele.getSchemaId()]
                break;
            case "ROOT_SG1_NAD":
                return Info_REMADV.usage_SG1_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG1_SG2_CTA":
                return Info_REMADV.usage_SG1_SG2_CTA[ele.getSchemaId()]
                break;
            case "ROOT_SG1_SG2_COM":
                return Info_REMADV.usage_SG1_SG2_COM[ele.getSchemaId()]
                break;
            case "ROOT_SG3_CUX":
                return Info_REMADV.usage_SG3_CUX[ele.getSchemaId()]
                break;
            case "ROOT_SG4_DOC":
                return Info_REMADV.usage_SG4_DOC[ele.getSchemaId()]
                break;
            case "ROOT_SG4_MOA":
                return Info_REMADV.usage_SG4_MOA[ele.getSchemaId()]
                break;
            case "ROOT_SG4_RFF":
                return Info_REMADV.usage_SG4_RFF[ele.getSchemaId()]
                break;
            case "ROOT_SG4_SG6_AJT":
                return Info_REMADV.usage_SG4_SG6_AJT[ele.getSchemaId()]
                break;
            case "ROOT_MOA":
                return Info_REMADV.usage_MOA[ele.getSchemaId()]
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
                return Info_REMADV.comment_DTM[ele.getSchemaId()]
                break;
            case "ROOT_SG1_NAD":
                return Info_REMADV.comment_SG1_NAD[ele.getSchemaId()]
                break;
            case "ROOT_SG4_DTM":
                return Info_REMADV.comment_SG4_DTM[ele.getSchemaId()]
                break;

            default:

        }
        return undefined;
    }
}