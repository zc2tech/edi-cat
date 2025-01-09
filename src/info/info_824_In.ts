import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_824_In extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGN = {
        "01": {
            "00": "Original",
        }
    };
    static usage_OTI_OTI = {
        "01": {
            "TA": "Transaction Set Accept",
            "TR": "Transaction Set Reject"
        },
        "02": {
            "TN": "Transaction Reference Number",
        },
        "10" :{
            "810": "Invoice",
            "820": "Payment Order/Remittance Advice",
            "830": "Planning Schedule with Release Capability",
            "846": "Inventory Inquiry/Advice",
            "850": "Purchase Order",
            "855": "Purchase Order Acknowledgment",
            "856": "Ship Notice/Manifest",
            "860": "Purchase Order Change Request - Buyer Initiated",
            "861": "Receiving Advice/Acceptance Certificate",
            "862": "Shipping Schedule",
            "866": "Production Sequence"
          },
          "17": {
            "C20": "Complete",
            "P01": "Processing Delay",
            "REJ": "Rejected - Insufficient or Incorrect Information"
          }
    };
    static usage_OTI_REF = {
        "01": {
            'TN': "Transaction Reference Number",
        }
    };
    static usage_OTI_DTM = {
        "01": {
            '102': "Transaction Reference Date",
        }
    };
    static usage_OTI_TED_TED = {
        "01": {
            'ZZZ': "Mutually Defined",
        }
    };
    static usage_OTI_TED_NTE = {
        "01": {
            'ERN': "Error Notes",
        }
    };

    static comment_OTI_DTM = {
        "02": `**Date**\n\nDate expressed as format CCYYMMDD`,
        "03": `**Time**\n\nTime expressed in 24-hour clock time as follows: HHMM, HHMMSS, HHMMSSD, or HHMMSSDD, where H = hours (00-23), `
            + `M = minutes (00-59), S = integer seconds (00-59) and DD = decimal seconds; decimal seconds are expressed `
            + `as follows: D = tenths (0-9) and DD = hundredths (00-99).`,
        "04": `**Time Code**\n\nCode identifying the time zone\n\nPlease refer to APPENDIX - [CODELISTS 623 Time Code](command:edi-cat.showCodeList?${DocInfoBase.paramString(623)})`
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGN":
                return Info_824_In.usage_BGN[ele.designatorIndex]
                break;
            case "ROOT_OTI_OTI":
                return Info_824_In.usage_OTI_OTI[ele.designatorIndex]
                break;
            case "ROOT_OTI_REF":
                return Info_824_In.usage_OTI_REF[ele.designatorIndex]
                break;
            case "ROOT_OTI_DTM":
                return Info_824_In.usage_OTI_DTM[ele.designatorIndex]
                break;
            case "ROOT_OTI_TED_TED":
                return Info_824_In.usage_OTI_TED_TED[ele.designatorIndex]
                break;
            case "ROOT_OTI_TED_NTE":
                return Info_824_In.usage_OTI_TED_NTE[ele.designatorIndex]
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
            case "ROOT_OTI_DTM":
                return Info_824_In.comment_OTI_DTM[ele.designatorIndex];
                break;
            default:

        }
        return undefined;
    }
}