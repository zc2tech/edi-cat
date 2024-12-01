import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";

export const SegComment = {
    time: `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), M = minutes (00-59), S = integer seconds (00-59) `
        + `and DD = decimal seconds; decimal seconds are expressed as follows: D = tenths (0-9) and DD = hundredths (00-99)`,
    timeZone: "Select Text By Position"
};

export abstract class DocInfoBase {

    /**
     * 26:Country Code 
     * 156:Provice or State Code 
     * 355:Unit of Measurement Code 
     * 623:Time Code 
     * 963:Tax Type Code 
     * 1300:Service Promotion Allowance Charge Code 
     * 
     * @param codeType 
     * @returns 
     */
    static paramString(code: number): string {
        return encodeURIComponent(code.toString())
    }


    /**
     * Just lazy to adjust old code, so I add this new function to accommodate
     * string parameter
     * 
     * @param code 
     * @returns 
     */
    static paramStringStr(code: string): string {
        return JSON.stringify(code);
    }

    static codelists1153 = `**Reference code qualifier**`
        + `\n\nIdentification of the reference `
        + `\n\nPlease refer to `
        + `APPENDIX - [CODELISTS 1153 Reference code qualifier]`
        + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(1153)})`;

    static codelists1153A = `**Reference code qualifier**`
        + `\n\nIdentification of the reference `
        + `\n\nPlease refer to `
        + `APPENDIX - [CODELISTS 1153 Reference code qualifier]`
        + `(command:edi-cat.showCodeList?${DocInfoBase.paramStringStr('1153A')})`;

    static codelists3035 = `**Party function code qualifier**`
        + `\n\nIdentification of the role of the party `
        + `\n\nPlease refer to `
        + `APPENDIX - [CODELISTS 3035 Party function code qualifier]`
        + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(3035)})`;

    static codelists3207 = `**Country name code**\n\nIdentification of the name of the country or other geographical entity, `
        + `use ISO 3166 two alpha country code. Please refer to `
        + `APPENDIX - [CODELISTS 3207 Country, coded]`
        + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(3207)})`;

    static codelists4215 = `**Transport charges method of payment**\n\nIdentification of method of payment for `
        + `transport charges.\n\nPlease refer to `
        + `APPENDIX - [CODELISTS 4215 Transport charges method of payment, coded]`
        + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(4215)})\n\n`
        + `Note: Value (ZZZ) has different meanings`;

    static codelists6345 = `**Currency identification code**`
        + `\n\nIdentification of the name or symbol of the monetary unit involved in the transaction.`
        + `\n\nPlease refer to `
        + `APPENDIX - [CODELISTS 6345 Currency, coded]`
        + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(6345)})`;

    static codelists6411 = `**Measurement unit code**`
        + `\n\nIndication of the unit of measurement in which weight (mass), capacity, length, area, volume or other quantity is expressed.`
        + `\n\nPlease refer to `
        + `APPENDIX - [CODELISTS 6411 Measure unit qualifier]`
        + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(6411)})`;

    static codelists7065 = `**Type of packages**\n\n`
        + `Please refer to APPENDIX - [CODELISTS 7065 Type of packages identification]`
        + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(7065)})`;

    static codelists7065A = `**Type of packages**\n\n`
        + `Please refer to APPENDIX - [CODELISTS 7065 Type of packages identification]`
        + `(command:edi-cat.showCodeList?${DocInfoBase.paramStringStr('7065A')})`;

    static CurrencyList = {
        "AUD": "Australian Dollar",
        "CAD": "Canadian Dollar",
        "CHF": "Swiss Franc",
        "CNY": "Chinese Yuan",
        "EUR": "Euro",
        "GBP": "British Pound Sterling",
        "HKD": " Hong Kong Dollar",
        "INR": "Indian Rupee",
        "JPY": "Japanese Yen",
        "NZD": "New Zealand Dollar",
        "SEK": "Swedish Krona",
        "TWD": "Taiwan New Dollar ",
        "USD": "United States Dollar",
    }

    static CommuNumberQualifierList = {
        "EM": "Electronic Mail",
        "FX": "Facsimile",
        "TE": "Telephone",
        "UR": "Uniform Resource Locator (URL)"
    }
    static CommuChannelQualifier = {
        "CA": "World Wide Web",
        "EM": "Electronic mail",
        "FX": "Telefax",
        "TE": "Telephone"
    }
    static CommuChannelQualifier02 = {
        "EM": "Electronic mail",
        "FX": "Fax",
        "TE": "Telephone",
        "WWW": "WWW-Site (GS1 Code)"
    }
    static CommuChannelQualifier3 = {
        "AH": "URL",
        "EM": "Electronic mail",
        "FX": "Telefax",
        "TE": "Telephone"
    }
    static LanguageList = {
        "EN": "English",
        "ES": "Spanish",
        "FR": "French",
        "JA": "Japanese",
        "ZH": "Chinese",
    }
    static ProductServiceIdQualifierList = {
        "BP": "Buyer's Part Number",
        "C3": "Classification",
        "CH": "Country of Origin Code",
        "EA": "European Waste Catalog Number",
        "EN": "European Article Number (EAN)",
        "MF": "Manufacturer Name",
        "MG": "Manufacturer's Part Number",
        "PO": "Purchase Order Number",
        "SH": "Supplier Service Part Number",
        "SN": "Serial Number",
        "UP": "U.P.C. Consumer Package Code (1-5-5-1)",
        "VO": "Vendor's Order Number",
        "VP": "Vendor's (Seller's) Part Number",
        "VS": "Vendor's Supplemental Service Item Number"
    };
    static ProductServiceIdQualifierList02 = {
        "BP": "Buyer's Part Number",
        "C3": "Classification",
        "EN": "European Article Number (EAN)",
        "MF": "Manufacturer Name",
        "MG": "Manufacturer's Part Number",
        "UP": "U.P.C. Consumer Package Code (1-5-5-1)",
        "VP": "Vendor's (Seller's) Part Number",
        "VS": "Vendor's Supplemental Service Item Number"
    };
    static ProductServiceIdQualifierList03 = {
        "BP": "Buyer's Part Number",
        "MF": "Manufacturer Name",
        "MG": "Manufacturer's Part Number",
        "VP": "Vendor's (Seller's) Part Number",
        "VS": "Vendor's Supplemental Service Item Number"
    };
    static ProductServiceIdQualifierList04 = {
        "BP": "Buyer's Part Number",
        "VP": "Vendor's (Seller's) Part Number",
        "VS": "Vendor's Supplemental Service Item Number"
    };
    static ProductServiceIdQualifierList05 = {
        "BP": "Buyer's Part Number",
        "C3": "Classification",
        "DV": "Item/Material storage location",
        "MF": "Manufacturer Name",
        "MG": "Manufacturer's Part Number",
        "VP": "Vendor's (Seller's) Part Number",
        "VS": "Vendor's Supplemental Service Item Number"
    };
    static ProductServiceIdQualifierList06 = {
        "ON": "MO / PO identification number",
        "VP": "Vendor's (Seller's) Part Number",
        "BP": "Buyer's Part Number",
        "MF": "Manufacturer Name",
        "MG": "Manufacturer's Part Number",
        "VS": "Vendor's Supplemental Item Number"
    }

    static ProductServiceIdQualifierList07 = {
        "B8": "Supplier Batch Number",
        "BP": "Buyer's Part Number",
        "C3": "Classification",
        "LT": "Buyer Batch Number",
        "VP": "Vendor's (Seller's) Part Number",
        "VS": "Vendor's Supplemental Service Item Number"
    };
    static ProductServiceIdQualifierList08 = {
        "B8": "Supplier Batch Number",
        "BP": "Buyer's Part Number",
        "LT": "Buyer Batch Number",
        "VP": "Vendor's (Seller's) Part Number",
        "VS": "Vendor's Supplemental Service Item Number"
    };
    static ProductServiceIdQualifierList09 = {
        "VP": "Vendor's (Seller's) Part Number",
        "VS": "Suppliers Supplemental Part Number",
        "BP": "Buyer's Part Number",
        "MG": "Manufacturer Name",
        "MF": "Manufacturer",
        "PD": "Part Number Description",
        "C3": "Classification ID",
        "B8": "Batch Number",
        "UP": "UPC Number"
    };

    static ProductServiceIdQualifierList10 = {
        "B8": "Supplier Batch Number",
        "BP": "Buyer's Part Number",
        "C3": "UNSPSC Classification",
        "EN": "European Article Number (EAN)",
        "HD": "International Harmonized Commodity Code",
        "LT": "Buyer Batch Number",
        "MF": "Manufacturer Name",
        "MG": "Manufacturer's Part Number",
        "PL": "Purchase Order Line Number",
        "SN": "Serial Number",
        "UP": "U.P.C. Consumer Package Code (1-5-5-1)",
        "VP": "Vendor's (Seller's) Part Number",
        "VS": "Vendor's Supplemental Item Number"
    }
    static ProductServiceIdQualifierList11 = {
        "B8": "Supplier Batch Number",
        "BP": "Buyer's Part Number",
        "LT": "Buyer Batch Number",
        "MF": "Manufacturer Name",
        "MG": "Manufacturer's Part Number",
        "PL": "Purchase Order Line Number",
        "VP": "Vendor's (Seller's) Part Number",
        "VS": "Vendor's Supplemental Item Number"
    }
    static ProductServiceIdQualifierList12 = {
        "PL": "Purchase Order Line Number",
        "VP": "Vendor's (Seller's) Part Number",
        "BP": "Buyer's Part Number",
        "VS": "Vendor's Supplemental Item Number",
        "B8": "Supplier Batch Number",
        "LT": "Buyer Batch Number"
    }
    static IdentificationCodeQualifierList =
        {
            "1": "D-U-N-S Number, Dun & Bradstreet",
            "2": "Standard Carrier Alpha Code (SCAC)",
            "4": "International Air Transport Association (IATA)",
            "9": "D-U-N-S+4, D-U-N-S Number with Four Character Suffix",
            "91": "Assigned by Seller or Seller's Agent",
            "92": "Assigned by Buyer or Buyer's Agent"
        }
    static IdentificationCodeQualifierList02 =
        {
            "1": "D-U-N-S Number, Dun & Bradstreet",
            "2": "Standard Carrier Alpha Code (SCAC)",
            "4": "International Air Transport Association (IATA)",
            "9": "D-U-N-S+4, D-U-N-S Number with Four Character Suffix",
            "92": "Assigned by Buyer or Buyer's Agent"
        }
    static IdentificationCodeQualifierList03 =
        {
            "1": "D-U-N-S Number, Dun & Bradstreet",
            "2": "Standard Carrier Alpha Code (SCAC)",
            "4": "International Air Transport Association (IATA)",
            "9": "D-U-N-S+4, D-U-N-S Number with Four Character Suffix",
            "91": "Assigned by Seller or Seller's Agent"
        }
    static IdentificationCodeQualifierList04 =
        {
            "1": "D-U-N-S Number, Dun & Bradstreet",
            "2": "Standard Carrier Alpha Code (SCAC)",
            "4": "International Air Transport Association (IATA)",
            "29": "Grid Location and Facility Code",
            "92": "Assigned by Buyer or Buyer's Agent"
        }
    static IdentificationCodeQualifierList05 =
        {
            "1": "D-U-N-S Number, Dun & Bradstreet",
            "2": "Standard Carrier Alpha Code (SCAC)",
            "4": "International Air Transport Association (IATA)",
            "9": "D-U-N-S+4, D-U-N-S Number with Four Character Suffix",
        }
    static IdentificationDomainList =
        {
            "1": "D-U-N-S Number, Dun & Bradstreet",
            "2": "Standard Carrier Alpha Code (SCAC)",
            "4": "International Air Transport Association (IATA)",
            "91": "Assigned by Seller or Seller's Agent",
            "92": "Assigned by Buyer or Buyer's Agent"
        }
    static ResponsibleAgency = {
        "3": "IATA (International Air Transport Association)",
        "9": "EAN (International Article Numbering association)",
        "12": "UIC (International union of railways)",
        "16": "DUNS (Dun & Bradstreet)",
        "91": "Assigned by seller or seller's agent",
        "92": "Assigned by buyer or buyer's agent",
        "182": "US, Standard Carrier Alpha Code (Motor)",
        "ZZZ": "Mutually defined"
    };
    static ResponsibleAgency02 = {
        "9": "EAN (International Article Numbering association)",
        "90": "Assigned by manufacturer",
        "91": "Assigned by seller or seller's agent",
        "92": "Assigned by buyer or buyer's agent",
    };
    static ResponsibleAgency03 = {
        "90": "Assigned by manufacturer",
        "91": "Assigned by seller or seller's agent",
        "92": "Assigned by buyer or buyer's agent",
    };

    static ResponsibleAgency04 = {
        "3": "IATA (International Air Transport Association)",
        "9": "GS1",
        "91": "Assigned by seller or supplier's agent",
        "92": "Assigned by buyer or buyer's agent",
    };
    static ResponsibleAgency05 = {
        "3": "IATA (International Air Transport Association)",
        "9": "GS1",
        "91": "Assigned by supplier or supplier's agent",
        "182": "US, Standard Carrier Alpha Code (Motor)",
    };
    static ResponsibleAgency06 = {
        "3": "IATA (International Air Transport Association)",
        "9": "GS1",
        "91": "Assigned by supplier or supplier's agent",
        "92": "Assigned by buyer or buyer's agent",
        "182": "US, Standard Carrier Alpha Code (Motor)",
    };

    static ItemNumberType = {
        "BP": "Buyer's part number",
        "CC": "Classification (UNSPSC)",
        "EN": "International Article Numbering Association (EAN)",
        "MF": "Manufacturer's (producer's) article number",
        "UP": "UPC (Universal product code)",
        "VN": "Vendor item number",
        "VS": "Vendor's supplemental item number",
        "ZZZ": "European waste catalog number"
    }
    static ItemNumberType02 = {
        "BP": "Buyer's part number",
        "EN": "International Article Numbering Association (EAN)",
        "MF": "Manufacturer's (producer's) article number",
        "VS": "Vendor's supplemental item number",
        "ZZZ": "European waste catalog number"
    }
    static ItemNumberType03 = {
        "BP": "Buyer's part number",
        "CC": "Classification",
        "EN": "International Article Numbering Association (EAN)",
        "GN": "National product group code",
        "HS": "Harmonised system",
        "MF": "Manufacturer's (producer's) article number",
        "NB": "Batch number",
        "PV": "Promotional variant number",
        "SN": "Serial number",
        "UP": "UPC (Universal product code)",
        "VN": "Vendor item number",
        "VS": "Vendor's supplemental item number",
        "ZZZ": "European waste catalog number"
    }

    static ItemNumberType04 = {
        "BP": "Buyer's part number",
        "MF": "Manufacturer's (producer's) article number",
        "NB": "Supplier batch number",
        "VN": "Vendor item number",
        "VS": "Vendor's supplemental item number"
    }
    static ItemNumberType05 = {
        "EWC": "European Waste Catalogue (GS1 Code)",
        "GD": "Classification",
        "IN": "Buyer's item number",
        "MF": "Manufacturer's (producer's) article number",
        "SA": "Supplier's article number"
    }
    static ItemNumberType06 = {
        "EWC": "European Waste Catalogue (GS1 Code)",
        "IN": "Buyer's item number",
        "MF": "Manufacturer's (producer's) article number",
        "SA": "Supplier's article number"
    }
    static ItemNumberType07 = {
        "EWC": "European Waste Catalogue (GS1 Code)",
        "IN": "Buyer's item number",
        "MF": "Manufacturer's (producer's) article number",
        "PV": "Promotional variant number",
        "SA": "Supplier's article number"
    }
    static ItemNumberType08 = {
        "EWC": "European Waste Catalogue (GS1 Code)",
        "GD": "Classification",
        "IN": "Buyer's item number",
        "MF": "Manufacturer's (producer's) article number",
        "NB": "Batch number",
        "PV": "Promotional variant number",
        "SA": "Supplier's article number",
        "SN": "Serial number"
    }
    static ItemNumberType09 = {
        "EWC": "European Waste Catalogue (GS1 Code)",
        "GD": "Classification",
        "GN": "National product group code",
        "HS": "Harmonised system",
        "IN": "Buyer's item number",
        "MF": "Manufacturer's (producer's) article number",
        "PV": "Promotional variant number",
        "SA": "Supplier's article number",
        "SN": "Serial number"
    }

    static IDNumberQualifierList = {
        "01": "ABA Transit Routing Number Including Check Digits (9 digits)",
        "02": "Swift Identification (8 or 11 characters)",
        "03": "CHIPS (3 or 4 digits)",
        "04": "Canadian Bank Branch and Institution Number",
        "ZZ": "Mutually Defined"
    }

    static TransportationTermsCodeList = {
        "CAF": "Cost and Freight",
        "CIF": "Cost, Insurance, and Freight",
        "CIP": "Carriage and Insurance Paid To",
        "CPT": "Carriage Paid To",
        "DAF": "Delivered at Frontier",
        "DAP": "Delivered At Place*",
        "DAT": "Delivered At Terminal*",
        "DDP": "Delivered Duty Paid",
        "DDU": "Deliver Duty Unpaid",
        "DEQ": "Delivered Ex Quay",
        "DES": "Delivered Ex Ship",
        "EXW": "Ex Works",
        "FAS": "Free Alongside Ship",
        "FCA": "Free Carrier",
        "FOB": "Free on Board",
        "ZZZ": "Mutually Defined"
    };
    static TransportationTermsCodeList02 = {
        "1": "Delivery Arranged By The Supplier",
        "2": "Delivery Arranged By Logistic Service Provider",
        "CFR": "Cost and Freight",
        "CIF": "Cost, Insurance, and Freight",
        "CIP": "Carriage and Insurance Paid To",
        "CPT": "Carriage Paid To",
        "DAF": "Delivered at Frontier",
        "DAP": "Delivered At Place",
        "DAT": "Delivered At Terminal",
        "DDP": "Delivered Duty Paid",
        "DDU": "Deliver Duty Unpaid",
        "DEQ": "Delivered Ex Quay",
        "DES": "Delivered Ex Ship",
        "EXW": "Ex Works",
        "FAS": "Free Alongside Ship",
        "FCA": "Free Carrier",
        "FOA": "FOB Airport - Named airport of departure",
        "FOB": "Free on Board",
        "FOR": "Free on Rail - Named departure point"
    };
    static TransportationTermsCodeList03 = {
        "CFR": "Cost and Freight",
        "CIF": "Cost, Insurance, and Freight",
        "CIP": "Carriage and Insurance Paid To",
        "CPT": "Carriage Paid To",
        "DAF": "Delivered at Frontier",
        "DDP": "Delivered Duty Paid",
        "DDU": "Deliver Duty Unpaid",
        "DEQ": "Delivered Ex Quay",
        "DES": "Delivered Ex Ship",
        "EXW": "Ex Works",
        "FAS": "Free Alongside Ship",
        "FCA": "Free Carrier",
        "FOA": "FOB Airport - Named airport of departure",
        "FOB": "Free on Board",
    };

    static TransportationTermsCodeList04 = {
        "01E": "Contact delivery party before delivery (GS1 Code)",
        "02E": "Despatch goods urgent delivery (GS1 Code)",
        "03E": "Special delivery conditions (GS1 Code)",
        "04E": "Cash on delivery (GS1 Code)",
        "CFR": "Cost & Freight",
        "CIF": "Cost, Insurance, Freight to named destination",
        "CIP": "Freight, Carriage, Insurance to destination",
        "CPT": "Freight, Carriage paid to destination",
        "DAF": "Delivery at frontier - Named place",
        "DAP": "Delivered at place",
        "DAT": "Delivery at terminal",
        "DDP": "Delivered duty paid to destination",
        "DDU": "Delivered duty unpaid",
        "DEQ": "Delivered Ex Quay - Duty paid, Named port",
        "DES": "Delivered Ex ship - Named port of destination",
        "DPU": "Delivered at place unloaded",
        "EXW": "Ex works",
        "FAS": "Free alongside ship",
        "FCA": "Free carrier - Named point",
        "FOA": "FOB Airport - Named airport of departure",
        "FOB": "Free on Board - Named port of shipment",
        "FOR": "Free on Rail - Named departure point",
        "RDN": "Return the delivery note signed by the goods recipient (GS1 Code)",
        "RPD": "Return the number of the 'proof of delivery' generated by the goods recipient has to be returned (GS1 Code)",
        "SD": "Shipment of order split over more than one means of transport (GS1 Code)"
    }

    static TermsOfDelivery = {
        "1": "Price condition",
        "2": "Despatch condition",
        "3": "Price and despatch condition",
        "4": "Collected by customer",
        "5": "Transport condition",
        "6": "Delivery condition"
    };
    static MeasurementQualifierList = {
        "G": "Gross Weight",
        "GW": "Gross Weight, Maximum",
        "HT": "Height",
        "LN": "Length",
        "N": "Actual Net Weight",
        "S": "State Weight",
        "VOL": "Volume",
        "VWT": "Volume Weight",
        "WD": "Width",
        "WT": "Weight"
    };
    static EntityIdentifierCodeList = {
        "60": "Salesperson",
        "7X": "Tax Representative",
        "A9": "Sales Office",
        "AP": "Buyer Master Account",
        "B4": "Buyer Corporate",
        "BF": "Billed From",
        "BT": "Bill-to-Party",
        "BY": "Buying Party (Purchaser)",
        "CA": "Carrier",
        "DA": "Delivery Address",
        "EN": "End User",
        "FR": "Message From",
        "KY": "Technical Support",
        "MA": "Ultimate Customer",
        "MJ": "Supplier Master Account",
        "NG": "Administrator",
        "OB": "Buyer Account",
        "PD": "Purchasing Agent",
        "RI": "Remit To",
        "SE": "Supplier Account",
        "SF": "Ship From",
        "SO": "Sold To",
        "ST": "Ship To",
        "SU": "Supplier",
        "ZZ": "Mutually Defined"
    };

    static EntityIdentifierCodeList02 = {
        "60": "Salesperson",
        "7X": "Tax Representative",
        "A9": "Customer Service",
        "AP": "Buyer Master Account",
        "B4": "Buyer Corporate",
        "BF": "Billed From",
        "BK": "Receiving Correspondent Bank",
        "BT": "Bill-to-Party",
        "BY": "Buying Party (Purchaser)",
        "EN": "End User",
        "CA": "Carrier",
        "FR": "Message From",
        "II": "Issuer of Invoice",
        "KY": "Technical Support",
        "MA": "Ultimate Customer",
        "MJ": "Supplier Master Account",
        "NG": "Administrator",
        "OB": "Buyer Account",
        "PD": "Purchasing Agent",
        "R6": "Requester",
        "RB": "Wire Receiving Bank",
        "RI": "Remit To",
        "SE": "Supplier Account",
        "SF": "Ship From",
        "SO": "Sold To",
        "SU": "Supplier",
        "ST": "Ship To",
        "ZZ": "Mutually Defined"
    };

    static ReferenceIdentificationQualifierList = {
        "01": "ABA Routing Number",
        "02": "SWIFT Identification Number",
        "03": "CHIPS Participant Identification Number",
        "11": "Account Identification Number",
        "12": "Account Payable Identification Number",
        "14": "IBAN Identification Number",
        "3L": "Bank Branch Identification Number",
        "4B": "Loading Point",
        "4C": "Storage Location",
        "4G": "Provincial Tax Identification Number",
        "8W": "Bank National Identification Number",
        "9S": "Transportation Zone",
        "9X": "Account Type",
        "ACT": "Account Name",
        "AEC": "Government Registration Number",
        "AP": "Accounts Receivable Identification Number",
        "BAA": "Supplier Tax Identification Number",
        "BAD": "State Tax Identification Number",
        "BR": "Contact Department Identification Number",
        "D2": "Supplier Reference Number",
        "DD": "Document Name",
        "DNS": "D-U-N-S+4, D-U-N-S Number with Four Character Suffix",
        "DUN": "D-U-N-S Number, Dun & Bradstreet",
        "DP": "Department Name",
        "F8": "Additional Reference Number",
        "GT": "GST Registration Identification Number",
        "KK": "cRADCRS Indicator",
        "LU": "Buyer Location Identification Number",
        "ME": "Additional Postal Address Information",
        "PB": "Payer's Bank Account Identification Number",
        "PY": "Payee's Bank Account Identification Number",
        "RT": "Payee's Bank Routing Identification Number",
        "SA": "Contact Person",
        "TJ": "Federal Tax Identification Number",
        "TX": "Tax Exemption Identification Number",
        "VX": "VAT Identification Number",
        "YD": "Buyer Additional Identification Number",
        "ZA": "Supplier Additional Identification Number",
        "ZZ": "Mutually Defined"
    };
    static ReferenceIdentificationQualifierList02 = {
        "01": "ABA Routing Number",
        "02": "SWIFT Identification Number",
        "03": "CHIPS Participant Identification Number",
        "11": "Account Identification Number",
        "12": "Account Payable Identification Number",
        "3L": "Bank Branch Identification Number",
        "4B": "Loading Point",
        "4C": "Storage Location",
        "4G": "Provincial Tax Identification Number",
        "72": "Buyer Planning Identification Number",
        "8W": "Bank National Identification Number",
        "9S": "Transportation Zone",
        "AEC": "Government Registration Number",
        "AP": "Accounts Receivable Identification Number",
        "BAD": "State Tax Identification Number",
        "D2": "Supplier Reference Number",
        "DD": "Document Name",
        "DNS": "D-U-N-S+4, D-U-N-S Number with Four Character Suffix",
        "DUN": "D-U-N-S Number, Dun & Bradstreet",
        "GT": "GST Registration Identification Number",
        "KK": "cRADCRS Indicator",
        "LU": "Buyer Location Identification Number",
        "TJ": "Federal Tax Identification Number",
        "TX": "Tax Exemption Identification Number",
        "VX": "VAT Identification Number",
        "ZA": "Supplier Additional Identification Number",
        "ZZ": "Mutually Defined"
    }

    static SPACCodeList = {
        "A040": "Access Charges",
        "A050": "Account Number Correction Charge",
        "A060": "Acid (Battery)",
        "A170": "Adjustments",
        "A520": "Base Charge",
        "A960": "Carrier",
        "B660": "Contract Allowance",
        "C300": "Discount - Special",
        "C310": "Discount",
        "D180": "Freight Based on Dollar Minimum",
        "D240": "Freight",
        "D500": "Handling",
        "D980": "Insurance",
        "G580": "Royalties",
        "G821": "Shipping",
        "G830": "Shipping and Handling",
        "H850": "Tax",
        "H970": "Allowance",
        "I530": "Volume Discount"
    };

    static TimeFormatQualifier = {
        "102": "CCYYMMDD",
        "203": "CCYYMMDDHHMM",
        "204": "CCYYMMDDHHMMSS",
        "303": "CCYYMMDDHHMMZZZ",
        "304": "CCYYMMDDHHMMSSZZZ",
        "804": "Day (only used if 2005=169)"
    }
    static TimeFormatQualifier02 = {
        "102": "CCYYMMDD",
        "203": "CCYYMMDDHHMM",
        "204": "CCYYMMDDHHMMSS",
        "303": "CCYYMMDDHHMMZZZ",
        "304": "CCYYMMDDHHMMSSZZZ",
        "718": "CCYYMMDD-CCYYMMDD"
    }
    static TimeFormatQualifier03 = {
        "102": "CCYYMMDD",
        "203": "CCYYMMDDHHMM",
        "204": "CCYYMMDDHHMMSS",
    }
    static TimeFormatQualifier04 = {
        "102": "CCYYMMDD",
        "203": "CCYYMMDDHHMM",
        "204": "CCYYMMDDHHMMSS",
        "718": "CCYYMMDD-CCYYMMDD"
    }

    static PartyQualifier = {
        "AM": "Administrator",
        "AT": "Technical support",
        "BI": "Buyer master account",
        "BT": "Bill to",
        "BY": "Buyer",
        "CA": "Carrier",
        "DO": "Correspondent",
        "DP": "Delivery party",
        "FD": "Buyer corporate",
        "FR": "Message From",
        "II": "Issuer of invoice",
        "LP": "ConsignmentOrigin",
        "MF": "Manufacturer of goods",
        "MI": "BuyerPlannerCode",
        "OB": "Ordered by",
        "PD": "Purchasing agent",
        "PK": "Tax representative",
        "PO": "Buyer account",
        "RE": "Remit to",
        "RH": "Supplier master account",
        "SB": "Sales responsibility",
        "SE": "Supplier account",
        "SF": "Ship from",
        "SO": "Sold to if different than bill to",
        "SR": "Customer service",
        "ST": "Ship to*",
        "SU": "Supplier",
        "UC": "Ultimate consignee",
        "UD": "Subsequent buyer",
        "UP": "ConsignmentDestination",
        "ZZZ": "Mutually defined"
    };

    static PartyQualifier02 = {
        "BY": "Buyer",
        "CA": "Carrier Corporate",
        "DP": "Delivery Party",
        "FD": "Buyer Corporate",
        "FR": "Message From",
        "I1": "Intermediary Bank",
        "II": "Issuer of Invoice",
        "IV": "Bill To",
        "MF": "Manufacturer Name",
        "OB": "Ordered By",
        "PE": "Payee",
        "PR": "Payer",
        "RE": "Remit To",
        "SE": "Supplier Account",
        "SF": "Ship From",
        "SR": "Customer Service",
        "ST": "Ship To",
        "SU": "Supplier",
        "UC": "End User",
        "UD": "Subsequent Buyer"
    }
    static ContactFunction = {
        "AP": "Accounts payable contact",
        "AT": "Technical contact",
        "CF": "Head of unit for information production",
        "CR": "Customer relations",
        "DL": "Delivery contact",
        "EB": "Entered by",
        "GR": "Goods receiving contact",
        "IC": "Information contact",
        "PD": "Purchasing contact",
        "SR": "Sales representative or department",
        "ZZZ": "Mutually defined"
    }
    static ContactFunction02 = {
        "AT": "Technical contact",
        "CF": "Head of unit for information production",
        "CR": "Customer relations",
        "EB": "Entered by",
        "GR": "Goods receiving contact",
        "IC": "Information contact",
        "PD": "Purchasing contact",
        "SR": "Sales representative or department",
        "ZZZ": "Mutually defined"
    }

    static MeasurementDimension = {
        "AAA": "Unit net weight",
        "AAB": "Unit gross weight",
        "AAW": "Gross volume",
        "AAX": "Net volume",
        "G": "Gross weight",
        "HM": "Height, maximum",
        "HT": "Height dimension",
        "LN": "Length dimension",
        "WD": "Width dimension",
        "WT": "Weight",
        "ZZZ": "Mutually defined"
    }
    static MeasurementDimension02 = {
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
    static MeasurementDimension03 = {
        "AAA": "Unit net weight",
        "AAB": "Unit gross weight",
        "AAW": "Gross volume",
        "AAX": "Net volume",
        "AEB": "Stacking height",
        "G": "Gross weight",
        "HT": "Height dimension",
        "LN": "Length dimension",
        "WD": "Width dimension"
    }

    static MeasureUnit = {
        "CEL": "Degree Celsius",
        "KGM": "Kilogram *",
        "LTR": "Litre (1 dm3) *",
        "MTR": "Metre *"
    }

    static ReferenceQualifier = {
        "ACD": "Additional reference number",
        "ACK": "American Banker's Association (ABA) routing number",
        "AGU": "ESR member number",
        "AHR": "taxID",
        "AHL": "Creditor's reference number",
        "AHP": "Tax registration number",
        "AIH": "Common transaction reference number",
        "ALT": "gstID",
        "AP": "Accounts receivable number",
        "AV": "Account payable number",
        "CN": "Carrier's reference number",
        "FC": "Fiscal number",
        "GN": "Government reference number",
        "IA": "Internal vendor number",
        "IT": "Internal customer number",
        "PY": "Payee's financial institution account number",
        "RT": "Payee's financial institution transit routing No.",
        "SA": "Contact person",
        "SD": "Department name",
        "TL": "Tax exemption licence number",
        "VA": "VAT registration number",
        "ZZZ": "Mutually defined reference number"
    }

    static ReferenceQualifier02 = {
        "AHP": "Tax registration number",
        "AP": "Accounts receivable number",
        "AV": "Account payable number",
        "CN": "Carrier's reference number",
        "IT": "Internal customer number",
        "PY": "Payee's financial institution account number",
        "RT": "Payee's financial institution transit routing No.",
        "TL": "Tax exemption licence number",
        "VA": "VAT registration number"
    }
    static ReferenceQualifier03 = {
        "ACK": "Bank Routing Number",
        "AHR": "taxID",
        "ALT": "gstID",
        "AMT": "GST Registration Identification Number",
        "AP": "Accounts Receivable Identification Number",
        "CN": "Carrier's reference number",
        "FC": "Fiscal Number",
        "IA": "Internal Vendor Number",
        "IT": "Company Identification Number",
        "PY": "Account Number",
        "SD": "Department Name",
        "TL": "Tax Exemption License Number",
        "VA": "VAT Identification Number"
    }

    static Settlement = {
        "1": "Bill back",
        "2": "Off invoice",
        "3": "Vendor check to customer",
        "4": "Credit customer account",
        "5": "Charge to be paid by vendor",
        "6": "Charge to be paid by customer",
        "13": "All charges borne by payee",
        "14": "Each pay own cost",
        "15": "All charges borne by payor"
    }

    static CalculationSequence = {
        "1": "First step of calculation",
        "2": "Second step of calculation",
        "3": "Third step of calculation",
        "4": "Fourth step of calculation",
        "5": "Fifth step of calculation",
        "6": "Sixth step of calculation",
        "7": "Seventh step of calculation",
        "8": "Eighth step of calculation",
        "9": "Ninth step of calculation"
    }

    static SpecialServices = {
        "AA": "Advertising allowance",
        "AAB": "Returned goods charges",
        "ABK": "Charge*",
        "ABL": "Packaging surcharge",
        "ABP": "Carriage charge",
        "ACA": "Allowance*",
        "ADI": "Royalties",
        "ADK": "Shipping",
        "ADR": "Other services",
        "ADS": "Full pallet ordering",
        "ADT": "Pick-up/Distribution charge",
        "AJ": "Adjustments",
        "CAC": "Cash discount",
        "CL": "Contract allowance",
        "DI": "Discount",
        "EAB": "Early payment allowance",
        "FAC": "Freight surcharge",
        "FC": "Freight charge",
        "FI": "Finance charge",
        "HD": "Handling",
        "IN": "Insurance",
        "PAD": "Promotional allowance",
        "QD": "Quantity discount",
        "RAA": "Rebate",
        "SAA": "Shipping and handling",
        "SC": "Surcharge",
        "SF": "Special rebate",
        "SH": "Special handling service",
        "TAE": "Truckload discount",
        "TD": "Trade discount",
        "TX": "Tax",
        "VAB": "Volume discount"
    }

    static SpecialServices02 = {
        "ABK": "Charge*",
        "ABP": "Carriage charge",
        "ACA": "Allowance*",
        "ADI": "Royalties",
        "ADK": "Shipping",
        "AJ": "Adjustments",
        "CL": "Contract allowance",
        "FAC": "Freight surcharge",
        "FC": "Freight charge",
        "HD": "Handling",
        "IN": "Insurance",
        "SAA": "Shipping and handling",
        "SC": "Surcharge",
        "SF": "Special rebate",
        "VAB": "Volume discount"
    }
    static SpecialServices03 = {
        "AJ": "Adjustments",
        "FC": "Freight charge",
        "HD": "Handling",
        "IN": "Insurance",
        "VAB": "Volume discount"
    }
    static SpecialServices04 = {
        "AA": "Advertising allowance",
        "AAB": "Returned goods charges",
        "ABL": "Packaging surcharge",
        "ADR": "Other services",
        "ADS": "Full pallet ordering",
        "ADT": "Pick-up",
        "AEK": "Cash on delivery",
        "AJ": "Adjustments",
        "ASS": "Assortment allowance (GS1 Code)",
        "CAC": "Cash discount",
        "DI": "Discount",
        "EAB": "Early payment allowance",
        "FI": "Finance charge",
        "FC": "Freight charge",
        "HD": "Handling",
        "IN": "Insurance",
        "PAD": "Promotional allowance",
        "QD": "Quantity discount",
        "RAA": "Rebate",
        "SH": "Special handling service",
        "TAE": "Truckload discount",
        "TD": "Trade discount",
        "TX": "Tax",
        "VAB": "Volume discount"
    }
    static MonetaryAmountType = {
        "4": "Deducted price",
        "8": "Allowance or charge amount",
        "23": "Charge amount",
        "25": "Charge/allowance basis",
        "52": "Discount amount",
        "54": "Distribution service fee",
        "98": "Original price",
        "204": "Allowance amount"
    }
    static MonetaryAmountType02 = {
        "8": "Allowance or charge amount",
        "23": "Charge amount",
        "25": "Charge/allowance basis",
        "52": "Discount amount",
        "98": "Original amount",
        "296": "Total authorized deduction"
    }
    static MonetaryAmountType03 = {
        "8": "Allowance or charge amount",
        "23": "Charge amount",
        "25": "Charge/allowance basis",
        "52": "Discount amount",
        "98": "Original price",
        "204": "Allowance amount",
        "296": "Deducted price"
    }

    static CountryCode = ``;
    /**
     * Return an array of options list key=>introduction pair
     * @param seg 
     * @param ele 
     */
    public abstract getUsage(seg: EdiSegment, ele: EdiElement): {};

    /**
     * Always return markdown string
     * @param seg 
     * @param ele 
     */
    public abstract getComment(seg: EdiSegment, ele: EdiElement): {};

    /**
     * 
     * @param ele 
     * @param strId 
     * @returns 
     */
    isId(ele: EdiElement, strId: string) {
        return ele.ediReleaseSchemaElement.id === strId;
    }

    /**
     * 
     * @param ele 
     * @param strId 
     * @returns 
     */
    isIdx(ele: EdiElement, strId: string) {
        return ele.designatorIndex === strId;
    }
}