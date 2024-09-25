import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_APERAK extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "1001": {
            "23": "Status information",
        },
        "1225": {
            "27": "Rejected",
            "29": "Approved",
        }
    };
    static usage_FTX = {
        "4451": {
            "ACB": "Additional information",
        },
        "3453": DocInfoBase.LanguageList,
    };
    static usage_SG1_RFF = {
        "1153": {
            "ACW": "Original document number",
        },
    };
    static usage_SG1_DTM = {
        "2005": {
            "171": "Reference date/time",
        },
        "2379": DocInfoBase.TimeFormatQualifier,
    };

    static usage_SG3_ERC = {
        "9321": {
            "Reject": "Reject Error",
            "Connect": "Connectivity Error",
            "Other": "Other Error",
        },
    };
    static usage_SG3_FTX = {
        "4451": {
            "AAO": "Status information",
        },
    };
   
    static comment_SG1_DTM = {
        "2379": `**Date/time/period format qualifier**\n\nThe above codes are supported. `
            + `Code 304 is recommended. Please refer for special requirements and time zone usage`
            + ` to APPENDIX - [CODELISTS 2379 Date/time/period format qualifier]`
            + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(2379)})`,
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGM":
                return Info_APERAK.usage_BGM[ele.getSchemaId()]
                break;
            case "ROOT_FTX":
                return Info_APERAK.usage_FTX[ele.getSchemaId()]
                break;           
            case "ROOT_SG1_RFF":
                return Info_APERAK.usage_SG1_RFF[ele.getSchemaId()]
                break;           
            case "ROOT_SG1_DTM":
                return Info_APERAK.usage_SG1_DTM[ele.getSchemaId()]
                break;           
            case "ROOT_SG3_ERC":
                return Info_APERAK.usage_SG3_ERC[ele.getSchemaId()]
                break;           
            case "ROOT_SG3_FTX":
                return Info_APERAK.usage_SG3_FTX[ele.getSchemaId()]
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
            case "ROOT_SG1_DTM":
                return Info_APERAK.comment_SG1_DTM[ele.getSchemaId()];
                break;

            default:

        }
        return undefined;
    }
}