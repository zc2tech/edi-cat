import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_820 extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BPR = {
        "01": {
            'I': "Remittance Information Only",
        },
        "03": {
            'C': "Credit",
        },
        "04": {
            "ACH": "Automated Clearing House (ACH)",
            "CAS": "Cash",
            "CCC": "Credit Card",
            "CHK": "Check",
            "DEB": "Debit Card",
            "FWT": "Federal Reserve Funds/Wire Transfer - Nonrepetitive",
            "PBD": "Draft",
            "ZZZ": "Mutually Defined"
        },
        "06": DocInfoBase.IDNumberQualifierList,
        "08": {
            "10": "Business Account"
        },
        "12": DocInfoBase.IDNumberQualifierList,
        "14": {
            "10": "Business Account"
        },
    };
    static usage_NTE = {
        "01": {
            "OTH": "Other Instructions",
            "PMT": "Payment"
        }
    };
    static usage_TRN = {
        "01": {
            "1": "Current Transaction Trace Numbers",
        }
    };
    static usage_CUR = {
        "01": {
            "BY": "Buying Party (Purchaser)",
        },
        "02": DocInfoBase.CurrencyList,
        "04": {
            "ZZ": "Mutually Defined"
        },
        "05": DocInfoBase.CurrencyList
    };

    static usage_REF = {
        "01": {
            "4N": "Debit Card",
            "8I": "Wire Transfer Number",
            "BAF": "Cash Payment Number",
            "CK": "Check Number",
            "DN": "Draft Number",
            "EM": "Automated Clearing House",
            "H9": "Earlier Payment Reference Number",
            "PSM": "Credit Card",
            "XY": "Other Unlisted Type of Reference Number",
            "ZZ": "Mutually Defined"
        }
    };

    static usage_DTM = {
        "01": {
            "097": "Transaction Creation",
            "707": "Last Payment Made",
            "949": "Payment Effective"
        }
    };
    static usage_N1_N1 = {
        "01": {
            "O1": "Originating Bank",
            "PE": "Payee",
            "PR": "Payer",
            "RB": "Receiving Bank"
        },
        "03": DocInfoBase.IdentificationCodeQualifierList
    };
    static usage_N1_N4 = {
        "05": {
            'SP': "State/Province",
        }
    };
    static usage_N1_REF = {
        "01": {
            "01": "ABA Routing Number",
            "02": "SWIFT Identification Number",
            "03": "CHIPS Participant Identification Number",
            "04": "Canadian Financial Institution Branch and Institution Number",
            "PB": "Payer's Bank Account Identification Number",
            "PSM": "Purchasing Card Number",
            "PY": "Payee's Bank Account Identification Number"
        }
    };
    static usage_N1_PER = {
        "01": {
            "CN": "General Contact",
        },
        "03": DocInfoBase.CommuNumberQualifierList,
        "05": DocInfoBase.CommuNumberQualifierList,
        "07": DocInfoBase.CommuNumberQualifierList
    };
    static usage_N1_DTM = {
        "01": {
            "036": "Purchasing Card Expiration",
        },
    };
    static usage_ENT_RMR_RMR = {
        "01": {
            "AH": "Agreement Number",
            "IV": "Invoice Number",
            "PO": "Purchase Order Number"
        }
    };
    static usage_ENT_RMR_NTE = {
        "01": {
            "PMT": "Payment",

        }
    };
    static usage_ENT_RMR_REF = {
        "01": {
            "AH": "Agreement Number",
            "FJ": "Line Number",
            "PO": "Purchase Order Number",
            "ZZ": "Mutually Defined"
        }
    };
    static usage_ENT_RMR_DTM = {
        "01": {
            "003": "Invoice",
            "004": "Purchase Order",
            "LEA": "Agreement"
        }
    };
    static usage_ENT_RMR_ADX_ADX = {
        "02": {
            "CS": "Adjustment",
        }
    };
    static usage_ENT_RMR_ADX_NTE = {
        "01": {
            "CBH": "Monetary Amount Description",
        }
    };

    static comment_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    static comment_N1_N4 = {
        "02": `**Party state or province code**\n\nFor addresses in the United States or Canada, `
            + `use the two letter digraph recognized by the United States Postal Service or Canada Post. `
            + `Please refer to APPENDIX - [CODELISTS 156 State or Province Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(156)})`,
        "04": `**Party country code**\n\nIdentification of the name of the country or other geographical entity, `
            + `use ISO 3166 two alpha country code. Please refer to APPENDIX - [CODELISTS 26 Country Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(26)})`,
        "06": `**Party state or province code**\n\nFor addresses except in the United States or Canada.`
    }

    static comment_N1_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }
    static comment_ENT_RMR_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }


    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BPR":
                return Info_820.usage_BPR[ele.designatorIndex]
                break;
            case "ROOT_NTE":
                return Info_820.usage_NTE[ele.designatorIndex]
                break;
            case "ROOT_TRN":
                return Info_820.usage_TRN[ele.designatorIndex]
                break;
            case "ROOT_CUR":
                return Info_820.usage_CUR[ele.designatorIndex]
                break;
            case "ROOT_REF":
                return Info_820.usage_REF[ele.designatorIndex]
                break;
            case "ROOT_DTM":
                return Info_820.usage_DTM[ele.designatorIndex]
                break;
            case "ROOT_N1_N1":
                return Info_820.usage_N1_N1[ele.designatorIndex]
                break;

            case "ROOT_N1_N4":
                return Info_820.usage_N1_N4[ele.designatorIndex]
                break;
            case "ROOT_N1_REF":
                return Info_820.usage_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_N1_PER":
                return Info_820.usage_N1_PER[ele.designatorIndex]
                break;
            case "ROOT_N1_DTM":
                return Info_820.usage_N1_DTM[ele.designatorIndex]
                break;
            case "ROOT_ENT_RMR_RMR":
                return Info_820.usage_ENT_RMR_RMR[ele.designatorIndex]
                break;
            case "ROOT_ENT_RMR_NTE":
                return Info_820.usage_ENT_RMR_NTE[ele.designatorIndex]
                break;
            case "ROOT_ENT_RMR_REF":
                return Info_820.usage_ENT_RMR_REF[ele.designatorIndex]
                break;
            case "ROOT_ENT_RMR_DTM":
                return Info_820.usage_ENT_RMR_DTM[ele.designatorIndex]
                break;
            case "ROOT_ENT_RMR_ADX_ADX":
                return Info_820.usage_ENT_RMR_ADX_ADX[ele.designatorIndex]
                break;
            case "ROOT_ENT_RMR_ADX_NTE":
                return Info_820.usage_ENT_RMR_ADX_NTE[ele.designatorIndex]
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
                return Info_820.comment_DTM[ele.designatorIndex];
                break;
            case "ROOT_N1_N4":
                return Info_820.comment_N1_N4[ele.designatorIndex];
                break;
            case "ROOT_N1_DTM":
                return Info_820.comment_N1_DTM[ele.designatorIndex];
                break;
            case "ROOT_ENT_RMR_DTM":
                return Info_820.comment_ENT_RMR_DTM[ele.designatorIndex];
                break;

            default:

        }
        return undefined;
    }
}