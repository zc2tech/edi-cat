import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_810 extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BIG = {
        "07": {
            CN: "Line Level Credit Memo",
            CR: "Credit Memo",
            DC: "Line Level Debit Memo*",
            DI: "Debit Invoice",
            DR: "Debit Memo",
            FD: "Summary Invoice"
        },
        "08": {
            '00': "Original",
            '03': "Delete"
        },
        "09": {
            'NA': "No Action Required",
        }
    };
    static usage_CUR = {
        "01": {
            BY: "Buying Party (Purchaser)",
            SE: "Selling Party",
        },
        "02": DocInfoBase.CurrencyList,

        "04": {
            BY: "Buying Party (Purchaser)",
            SE: "Selling Party",
        },
        "05": DocInfoBase.CurrencyList,
    };
    static usage_REF = {
        "01": {
            "AH": "Agreement Number",
            "BM": "Bill of Lading Number",
            "CR": "Customer Reference Number",
            "EU": "Ultimate Customer Reference Number",
            "I5": "Invoice Identification",
            "IV": "Invoice Number",
            "KK": "Delivery Note Number",
            "MA": "Ship Notice/Manifest Number",
            "RV": "Receiving Advice Number",
            "PK": "Packing List Number",
            "PO": "Purchase Order Number*",
            "VN": "Vendor Order Number",
            "06": "System ID Number",
            "4N": "Payment Proposal Number",
            "ZZ": "Mutually Defined"
        },
        "03": {
            "1": "Schedule Agreement"
        }
    };
    static usage_N1_N1 = {
        "01": DocInfoBase.EntityIdentifierCodeList02,
        "03": DocInfoBase.IdentificationCodeQualifierList,
    };

    static usage_N1_REF = {
        "01": DocInfoBase.ReferenceIdentificationQualifierList,
        "02": DocInfoBase.IdentificationDomainList

    };

    static usage_N1_PER = {
        "01": {
            "CN": "General Contact",
            "RG": "Registrar"
        },
        "03": DocInfoBase.CommuNumberQualifierList,
        "05": DocInfoBase.CommuNumberQualifierList,
        "07": DocInfoBase.CommuNumberQualifierList,
    };
    static usage_ITD = {
        "01": {
            "01": "Basic",
            "05": "Discount Not Applicable",
            "52": "Discount with Prompt Pay"
        },
        "02": {
            "3": "Invoice Date",
        },
        "14": {
            "AA": "Bank Draft",
            "AB": "Cash",
            "AC": "Credit Card",
            "AD": "Direct Deposit",
            "C": "Pay By Check",
            "D": "Debited",
            "G": "CCD (NACHA Cash Concentration/Disbursement - Funds Transacted without Remittance Information)",
            "H": "CCD+(NACHA Cash Concentration/Disbursement - Funds Transacted Plus an 80 Record Remittance Detail)",
            "J": "CTX (NACHA Corporate Trade Exchange - Transaction Plus Remittance Detail in ANSI Standard Flexible Format)",
            "O": "CTP (NACHA Corporate Trade Payment - Transaction Plus Remittance Detail in Fixed Format)",
            "T": "Wire Transfer",
            "Y": "Credit"
        }

    };
    static usage_DTM = {
        "01": {
            "003": "Invoice",
            "004": "Purchase Order",
            "008": "Supplier Order",
            "011": "Shipped",
            "050": "Received",
            "111": "Manifest/Ship Notice",
            "186": "Invoice Period Start",
            "187": "Invoice Period End",
            "922": "Previous Invoice",
            "LEA": "Agreement"
        }

    };
    static usage_N9_N9 = {
        "01": {
            "L1": "Letters or Notes",
        },
        "02": DocInfoBase.LanguageList,
    };

    static usage_IT1_IT1 = {
        "06": DocInfoBase.ProductServiceIdQualifierList,
        "08": DocInfoBase.ProductServiceIdQualifierList,
        "10": DocInfoBase.ProductServiceIdQualifierList,
        "12": DocInfoBase.ProductServiceIdQualifierList,
        "14": DocInfoBase.ProductServiceIdQualifierList,
        "16": DocInfoBase.ProductServiceIdQualifierList,
        "18": DocInfoBase.ProductServiceIdQualifierList,
        "20": DocInfoBase.ProductServiceIdQualifierList,
        "22": DocInfoBase.ProductServiceIdQualifierList,
        "24": DocInfoBase.ProductServiceIdQualifierList,
    };

    static usage_IT1_CUR = {
        "01": {
            "BY": "Buying Party (Purchaser)",
            "SE": "Selling Party"
        },
        "02": DocInfoBase.CurrencyList,
        "04": {
            "BY": "Buying Party (Purchaser)",
            "SE": "Selling Party"
        },
        "05": DocInfoBase.CurrencyList,

    };

    static usage_IT1_CTP = {
        "01": {
            "WS": "User"
        },
        "02": {
            "CHG": "Changed Price*"
        },
        "06": {
            "CSD": "Cost Markup Multiplier - Original Cost"
        },

    };
    static usage_IT1_PAM = {
        "04": {
            "1": "Line Item Total",
            "EC": "Total Allowance",
            "GW": "Total Charge",
            "KK": "Item Gross Amount",
            "N": "Item Net Amount",
            "ZZ": "Total Amount Withou Tax"
        }
    };
    static usage_IT1_PID_PID = {
        "01": {
            "F": "Free-form",
        },
        "02": {
            "GEN": "General Description",
        },
        "09": DocInfoBase.LanguageList
    };

    static usage_IT1_REF = {
        "01": {
            "ACE": "Service Entry Number",
            "AH": "Agreement Number",
            "BT": "Batch Number",
            "FJ": "Invoice Line Number",
            "FL": "Fine Line Classification",
            "KK": "Delivery Note Number",
            "L1": "Letters or Notes",
            "MA": "Ship Notice/Manifest Number",
            "PD": "Promotion/Deal Number",
            "PK": "Packing List Number",
            "PO": "Purchase Order Number",
            "RV": "Receiving Advice Number",
            "VN": "Vendor Order Number",
            "ZZ": "Mutually Defined"
        },
        "02": DocInfoBase.LanguageList,
        "03": {
            "1": "Schedule Agreement",
        },
        "0401": {
            "LI": "Line Item Identifier",
        },
    };

    static usage_IT1_DTM = {
        "01": {
            "004": "Purchase Order",
            "008": "Supplier Order",
            "011": "Shipped",
            "111": "Manifest/Ship Notice",
            "150": "Service Period Start",
            "151": "Service Period End",
            "192": "Delivery Note",
            "214": "Reference",
            "472": "Service Entry",
            "517": "Inspection",
            "LEA": "Agreement"
        }

    };

    static usage_IT1_SAC_SAC = {
        "01": {
            "A": "Allowance",
            "C": "Charge",
            "N": "No Allowance or Charge",
        },
        "02": {
            "C310": "Discount",
            "G830": "Shipping and Handling",
            "H090": "Special Handling",
            "H850": "Tax",
            "B840": "Customer Account Identification"
        },
        "03": {
            "AB": "Assigned by Buyer"
        },
        "06": {
            "3": "Allowance or Charge",
            "Z": "Mutually Defined",
        },
        "12": {
            "02": "Off-Invoice*",
            "13": "Provide Amount*",
        },
        "16": DocInfoBase.LanguageList
    };

    static usage_IT1_N1_N1 = {
        "01": {
            "CA": "Carrier",
            "SF": "Ship From",
            "ST": "Ship To"
        },

        "03": DocInfoBase.IdentificationCodeQualifierList,
    };
    static usage_IT1_N1_REF = {
        "01": {
            "01": "ABA Routing Number",
            "03": "CHIPS Participant Identification Number",
            "4B": "Loading Point",
            "4C": "Storage Location",
            "4G": "Provincial Tax Identification Number",
            "8W": "Bank National Identification Number",
            "9S": "Transportation Zone",
            "AEC": "Government Registration Number",
            "AP": "Accounts Receivable Identification Number",
            "BAD": "State Tax Identification Number",
            "BR": "Contact Department Identification Number",
            "CN": "Carrier's Identification",
            "D2": "Supplier Reference Number",
            "DD": "Document Name",
            "DNS": "D-U-N-S+4, D-U-N-S Number with Four Character Suffix",
            "DUN": "D-U-N-S Number, Dun & Bradstreet",
            "F8": "Additional Reference Number",
            "GT": "GST Registration Identification Number",
            "J1": "Creditor Reference Identification Number",
            "KK": "cRADCRS Indicator",
            "LU": "Buyer Location Identification Number",
            "ME": "Postal Address Name or ID",
            "SA": "Contact Person",
            "SI": "Shipper's Identifying Number for Shipment (SID)",
            "TJ": "Federal Tax Identification Number",
            "TX": "Tax Exemption Identification Number",
            "VX": "VAT Identification Number",
            "ZZ": "Mutually Defined"
        },
        "02": this.IdentificationDomainList,
    };

    static usage_IT1_N1_PER = {
        "01": {
            "CN": "General Contact"
        },
        "03": DocInfoBase.CommuNumberQualifierList,
        "05": DocInfoBase.CommuNumberQualifierList,
        "07": DocInfoBase.CommuNumberQualifierList,

    };
    static usage_AMT = {
        "01": {
            "1": "Line Item Total*",
            "3": "Deposit Total",
            "BAP": "Total Amount Due*",
            "EC": "Total Allowance",
            "GW": "Total Charge",
            "N": "Net Amount*",
            "ZZ": "Total Amount without Tax"
        }
    };

    static usage_SAC_SAC = {
        "01": {
            "A": "Allowance",
            "C": "Charge",
        },
        "02": {
            "C310": "Discount",
            "G830": "Shipping and Handling",
            "H090": "Special Handling",
            "H850": "Tax"
        },
        "06": {
            "3": "Allowance or Charge",
        },
        "12": {
            "13": "Provide Amount*",
        },
        "16": DocInfoBase.LanguageList
    };
    static usage_SAC_TXI = {
        "01": {
            "TX": "All Taxes",
            "ZZ": "Mutually Defined",
        },
        "04": {
            "VD": "Vendor defined"
        },
        "06": {
            "0": "Exempt (For Export)",
            "2": "No (Not Tax Exempt)"
        }
    };

    static comment_GS = {
        "02": `**Sender identification number**`,
        "03": `**Receiver identification number**`,
        "04": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "05": SegComment.time,
        "06": `**Group Control Number**\n\nAssigned number originated and maintained by the sender, start with 1 and increment by 1 for each subsequent GS segment.`
    }
    static comment_BIG = {
        "01": `**Invoice date** \n\nDate expressed as format CCYYMMDD`,
        "02": `**Invoice number**`,
        "03": `**Purchase order date** \n\nDate expressed as format CCYYMMDD. `
            + `\n\n\*Should match BEG05 from a received 850. `
            + `\n\n\nMust be null in case of multiple PO scenario. `,
        "04": `**Purchase order number**\n\n\*Should match BEG03 from a received 850.`
            + `\n\nMust be null in case of multiple PO scenario`
            + `\n\nHardcode to "NONPO" if the invoice refer to an external purchase order`
    }

    static comment_CUR = {
        "02": `**Currency Code**\n\nCode (Standard ISO*) for country in whose currency the charges are specified.`,
        "03": `**Tax exchange rate**`,
        "05": `**Currency Code**`
            + `\n\nSpecifies the currency for the alternate amount.`
            + `\n\nCode (Standard ISO*) for country in whose alternate currency the charges are specified.`
    }
    static comment_N1_N2 = {
        "01": `**Party postal address name 1**`,
        "02": `**Party postal address name 2**`,
    }
    static comment_N1_N3 = {
        "01": `**Party street 1**`,
        "02": `**Party street 2**`,
    }
    static comment_N1_N4 = {
        "02": `**Party state or province code**\n\nFor addresses in the United States or Canada, `
            + `use the two letter digraph recognized by the United States Postal Service or Canada Post. `
            + `Please refer to APPENDIX - [CODELISTS 156 State or Province Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(156)})`,
        "03": `**Party postal code**\n\nZip codes will be either five or nine digits with no separator. Canadian postal codes must be formatted A9A9A9, with no separator.`,
        "04": `**Party country code**\n\nIdentification of the name of the country or other geographical entity, `
            + `use ISO 3166 two alpha country code. Please refer to APPENDIX - [CODELISTS 26 Country Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(26)})`,
        "06": `**Party state or province code**\n\nFor addresses except in the United States or Canada.`
    }

    static comment_N1_REF = {
        "03": `**Identification number**\n\n**Mutually defined identification**\n\n`
            + `**Tracking number date**\n\nDate expressed as format CCYYMMDDHHMMSS[timezone]. Time expressed in 24-hour clock time as follows: `
            + `HHMM, HHMMSS, HHMMSS, where H = hours (00-23), M = minutes (00-59) and S = integer seconds (00-59). `
            + `[timezone] = Please refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }
    static comment_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }
    static comment_N9_MSG = {
        "02": `**Printer Carriage Control Code**\n\nA field to be used for the control of the line feed of the receiving printer If a line was broken by the limitation of MSG01, and a new segment is created for continuation, then MSG02="LC", otherwise it is not used.`
    }
    static comment_IT1_IT1 = {
        "03": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is being `
            + `expressed, or manner in which a measurement has been taken. Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code \[UOM\]](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
        "04": `**Unit Price**\n\n[Regular Invoice] Price per unit of product or service\n\n[Header Invoice] Subtotal amount`
    }
    static comment_IT1_CTP = {
        "04": `**Price basis quantity**`,
        "0501": `**Unit or Basis for Measurement Code**\n\nCode specifying the units in which a value is`
            + ` being expressed, or manner in which a measurement has been taken Please refer to `
            + `APPENDIX - [CODELISTS 355 Unit or Basis for Measurement Code (UOM)](command:edi-cat.showCodeList?${DocInfoBase.paramString(355)})`,
        "07": `**Conversion factor**`
    }
    static comment_IT1_PID_PID = {
        "02": `**Product/Process Characteristic Code**\n\nWrite "GEN" to this element to cause a "Short Name" to be generated, otherwise leave it blank.`,
        "09": `**Language Code**\n\nThis is the language code attribute sent to describe the language used for the comment. `
            + `The code is ISO 639 compliant. Note that this code is required in Ariba Network and will be defaulted if not `
            + `transmitted in the invoice (can be supplied in lower case)`
    }
    static comment_IT1_REF = {
        "02": `**Identification number**\n\n**Language code**\n\n**Mutually defined identification name**`,
        "03": `**Description**\n\n[REF*AH] Schedule agreement indicator Used to specify the agreement type to indicate whether the referenced agreement is a scheduling agreement. Otherwise it is not used.`,
        "0402": `**Reference Identification**\n\n[REF*ACE] Service line number \n\n[REF*MA] Ship notice line number \n\n[REF*RV] Receipt line number `
            + `\n\n[REF*FL] Parent line item number`
    }
    static comment_IT1_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }
    static comment_IT1_SAC_SAC = {
        "02": `**Service, Promotion, Allowance, or Charge Code**\n\nPlease refer to APPENDIX - `
            + `[CODELISTS 1300 Service, Promotion, Allowance, or Charge Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(1300)})`,
        "05": `**Amount**\n\nAllowance or charge amount* \n\n[SAC*A] Deducted price*\n\n**Total tax amount**`,
        "13": `**Original price**\n\n**Alternate total tax amount**\n\nThe amount of money in the alternate currency. `
            + `Optional and used to support dual-currency requirements.`,
        "14": `**Price type**\n\nExample type values might be MSRP, ListPrice, Actual, AverageSellingPrice, CalculationGross, BaseCharge, AverageWholesalePrice, ExportPrice, AlternatePrice, ContractPrice, etc.`
    }
    static comment_IT1_SAC_TXI = {
        "01": `**Tax Type Code**`
            + `Please refer to APPENDIX - [CODELISTS 963 Tax Type Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(963)})`,
        "02": `**Total tax amount**\n\n**Alternate tax amount**`,
        "05": `**Tax location**\n\nLocation or jurisdiction associated with this tax`,
        "08": `Taxable amount on which the tax percentage is calculated.`,
        "09": `**Custom tax category**\n\nUsed for providing custom tax categories to override the standard tax categories on TXI01.`,
        "10": `**Tax description**\n\n**[TXI*VA] Tax point date** \n\nDate expressed as format CCYYMMDDHHMMSS[timezone]. Time expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSS, where H = hours (00-23), M = minutes (00-59) and S = integer seconds (00-59). [timezone] = `
            + `Please refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }
    static comment_IT1_N1_N2 = {
        "01": `**Party postal address name 1**`,
        "02": `**Party postal address name 2**`,
    }

    static comment_IT1_N1_N3 = {
        "01": `**Party street 1**`,
        "02": `**Party street 2**`,
    }
    static comment_IT1_N1_N4 = {
        "02": `**Party state or province code**\n\nFor addresses in the United States or Canada, `
            + `use the two letter digraph recognized by the United States Postal Service or Canada Post. `
            + `Please refer to APPENDIX - [CODELISTS 156 State or Province Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(156)})`,
        "03": `**Party postal code**\n\nZip codes will be either five or nine digits with no separator. Canadian postal codes must be formatted A9A9A9, with no separator.`,
        "04": `**Party country code**\n\nIdentification of the name of the country or other geographical entity, `
            + `use ISO 3166 two alpha country code. Please refer to APPENDIX - [CODELISTS 26 Country Code]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(26)})`,
        "06": `**Party state or province code**\n\nFor addresses except in the United States or Canada.`
    }
    static comment_IT1_N1_REF = {
        "02":`**Identification domain**\n\n**Identification number**\n\n**Mutually defined identification domain**`,
        "03": `**Identification number**\n\n**Company name**\n\n**Mutually defined identification**\n\n**Tracking number date**`
        + `\n\nDate expressed as format CCYYMMDDHHMMSS[timezone]. Time expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSS, where H = hours (00-23), M = minutes (00-59) and S = integer seconds (00-59). [timezone] = ` 
        +`Please refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }
    static comment_TDS = {
        "01": `**Gross amount**`,
        "02": `**Subtotal amount**`,
        "03": `**Net amount**`,
        "04": `**Due amount**\n\n*UserNote [TDS/AMT]: Subtotal, Net and Due amount are all required. In Ariba Network, AMT is the preferred segment and highly recommended to use. If you can't provide this information within AMT, it is allowed to use TDS02-TDS04`,
    }

    static comment_SAC_SAC = {
        "02": `**Service, Promotion, Allowance, or Charge Code**\n\nPlease refer to APPENDIX - `
            + `[CODELISTS 1300 Service, Promotion, Allowance, or Charge Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(1300)})`,
        "05": `**Amount**\n\nAllowance or charge amount* \n\n[SAC*A] Deducted price*\n\n**Total tax amount**`,
        "13": `**Original price**\n\n**Alternate total tax amount**\n\nThe amount of money in the alternate currency. `
            + `Optional and used to support dual-currency requirements.`,
        "14": `**Price type**\n\nExample type values might be MSRP, ListPrice, Actual, AverageSellingPrice, CalculationGross, BaseCharge, AverageWholesalePrice, ExportPrice, AlternatePrice, ContractPrice, etc.`
    }

    static comment_SAC_TXI = {
        "01": `**Tax Type Code**`
            + `Please refer to APPENDIX - [CODELISTS 963 Tax Type Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(963)})`,
        "02": `**Total tax amount**\n\n**Alternate tax amount**`,
        "05": `**Tax location**\n\nLocation or jurisdiction associated with this tax`,
        "08": `Taxable amount on which the tax percentage is calculated.`,
        "09": `**Custom tax category**\n\nUsed for providing custom tax categories to override the standard tax categories on TXI01.`,
        "10": `**Tax description**\n\n**[TXI*VA] Tax point date** \n\nDate expressed as format CCYYMMDDHHMMSS[timezone]. Time expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSS, where H = hours (00-23), M = minutes (00-59) and S = integer seconds (00-59). [timezone] = `
            + `Please refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }
    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BIG":
                return Info_810.usage_BIG[ele.designatorIndex]
                break;
            case "ROOT_NTE":
                if (this.isIdx(ele, "01")) {
                    return {
                        "CBH": "Monetary Amount Description",
                        "REG": "Registered Activity"
                    }
                }
                break;
            case "ROOT_CUR":
                return Info_810.usage_CUR[ele.designatorIndex]
                break;
            case "ROOT_REF":
                return Info_810.usage_REF[ele.designatorIndex]
                break;
            case "ROOT_N1_N1":
                return Info_810.usage_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_N1_N4":
                if (this.isIdx(ele, "05")) {
                    return {
                        "SP": "State/Province*",
                    }
                }
                break;
            case "ROOT_N1_REF":
                return Info_810.usage_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_N1_PER":
                return Info_810.usage_N1_PER[ele.designatorIndex]
                break;
            case "ROOT_ITD":
                return Info_810.usage_ITD[ele.designatorIndex]
                break;
            case "ROOT_DTM":
                return Info_810.usage_DTM[ele.designatorIndex]
                break;
            case "ROOT_N9_N9":
                return Info_810.usage_N9_N9[ele.designatorIndex]
                break;
            case "ROOT_N9_MSG":
                if (this.isIdx(ele, "02")) {
                    return {
                        "LC": "Line Continuation",
                    }
                }
                break;
            case "ROOT_IT1_IT1":
                return Info_810.usage_IT1_IT1[ele.designatorIndex]
                break;
            case "ROOT_IT1_CUR":
                return Info_810.usage_IT1_CUR[ele.designatorIndex]
                break;
            case "ROOT_IT1_CTP":
                return Info_810.usage_IT1_CTP[ele.designatorIndex]
                break;
            case "ROOT_IT1_PAM":
                return Info_810.usage_IT1_PAM[ele.designatorIndex]
                break;
            case "ROOT_IT1_PID_PID":
                return Info_810.usage_IT1_PID_PID[ele.designatorIndex]
                break;
            case "ROOT_IT1_REF":
                return Info_810.usage_IT1_REF[ele.designatorIndex]
                break;
            case "ROOT_IT1_YNQ":
                if (this.isIdx(ele, "01")) {
                    return {
                        "Q3": "Goods Returned",
                    }
                }
                if (this.isIdx(ele, "02")) {
                    return {
                        "Y": "Yes",
                    }
                }
                break;
            case "ROOT_IT1_DTM":
                return Info_810.usage_IT1_DTM[ele.designatorIndex]
                break;
            case "ROOT_IT1_SAC_SAC":
                return Info_810.usage_IT1_SAC_SAC[ele.designatorIndex]
                break;
            case "ROOT_IT1_SAC_TXI":
                if (this.isIdx(ele, "01")) {
                    return {
                        "TX": "All Taxes",
                        "ZZ": "Mutually Defined",
                    }
                }
                if (this.isIdx(ele, "04")) {
                    return {
                        "VD": "Vendor defined",
                    }
                }
                if (this.isIdx(ele, "06")) {
                    return {
                        "0": "Exempt (For Export)",
                        "2": "No (Not Tax Exempt)",
                    }
                }

                break;
            case "ROOT_IT1_N1_N1":
                return Info_810.usage_IT1_N1_N1[ele.designatorIndex]
                break;
            case "ROOT_IT1_N1_N4":
                if (this.isIdx(ele, "05")) {
                    return {
                        "SP": "State/Province*",
                    }
                }
                break;
            case "ROOT_IT1_N1_REF":
                return Info_810.usage_IT1_N1_REF[ele.designatorIndex]
                break;
            case "ROOT_IT1_N1_PER":
                return Info_810.usage_IT1_N1_PER[ele.designatorIndex]
                break;
            case "ROOT_AMT":
                return Info_810.usage_AMT[ele.designatorIndex]
                break;
            case "ROOT_SAC_SAC":
                return Info_810.usage_SAC_SAC[ele.designatorIndex]
                break;
            case "ROOT_SAC_TXI":
                return Info_810.usage_SAC_TXI[ele.designatorIndex]
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
            case "ROOT_GS":
                return Info_810.comment_GS[ele.designatorIndex];
                break;
            case "ROOT_BIG":
                return Info_810.comment_BIG[ele.designatorIndex];
                break;
            case "ROOT_NTE":
                if (this.isIdx(ele, "02")) {
                    return `** Description ** \n\n[NTE * REG] Legal form \n\n[NTE * CBH] Share capital`
                }
                break;
            case "ROOT_CUR":
                return Info_810.comment_CUR[ele.designatorIndex];
                break;
            case "ROOT_N1_N2":
                return Info_810.comment_N1_N2[ele.designatorIndex];
                break;
            case "ROOT_N1_N3":
                return Info_810.comment_N1_N3[ele.designatorIndex];
                break;
            case "ROOT_N1_N4":
                return Info_810.comment_N1_N4[ele.designatorIndex];
                break;
            case "ROOT_N1_REF":
                return Info_810.comment_N1_REF[ele.designatorIndex];
                break;
            case "ROOT_DTM":
                return Info_810.comment_DTM[ele.designatorIndex];
                break;
            case "ROOT_N9_MSG":
                return Info_810.comment_N9_MSG[ele.designatorIndex];
                break;
            case "ROOT_IT1_IT1":
                return Info_810.comment_IT1_IT1[ele.designatorIndex];
                break;
            case "ROOT_IT1_CTP":
                return Info_810.comment_IT1_CTP[ele.designatorIndex];
                break;
            case "ROOT_IT1_PID_PID":
                return Info_810.comment_IT1_PID_PID[ele.designatorIndex];
                break;
            case "ROOT_IT1_REF":
                return Info_810.comment_IT1_REF[ele.designatorIndex];
                break;
            case "ROOT_IT1_DTM":
                return Info_810.comment_IT1_DTM[ele.designatorIndex];
                break;
            case "ROOT_IT1_SAC_SAC":
                return Info_810.comment_IT1_SAC_SAC[ele.designatorIndex];
                break;
            case "ROOT_IT1_SAC_TXI":
                return Info_810.comment_IT1_SAC_TXI[ele.designatorIndex];
                break;
            case "ROOT_IT1_N1_N2":
                return Info_810.comment_IT1_N1_N2[ele.designatorIndex];
                break;
            case "ROOT_IT1_N1_N3":
                return Info_810.comment_IT1_N1_N3[ele.designatorIndex];
                break;
            case "ROOT_IT1_N1_N4":
                return Info_810.comment_IT1_N1_N4[ele.designatorIndex];
                break;
            case "ROOT_IT1_N1_REF":
                return Info_810.comment_IT1_N1_REF[ele.designatorIndex];
                break;
            case "ROOT_TDS":
                return Info_810.comment_TDS[ele.designatorIndex];
                break;
            case "ROOT_SAC_SAC":
                return Info_810.comment_SAC_SAC[ele.designatorIndex];
                break;
            case "ROOT_SAC_TXI":
                return Info_810.comment_SAC_TXI[ele.designatorIndex];
                break;
            default:

        }
    }
}