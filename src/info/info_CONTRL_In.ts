import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_CONTRL_In extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_UCI = {
        "0007": {
            "ZZZ": "Mutually defined",
        },       
        "0083": {
            "4": "This level and all lower levels rejected",
            "7": "This level acknowledged, next lower level acknowledged if not explicitly rejected",
        },
       
    };

    static usage_SG1_UCM = {
        "0065": {
            "ORDERS": "Purchase order message",
            "ORDCHG": "Purchase order change request message",
        },
        "0052": {
            "D": "Draft version/UN/EDIFACT Directory",
        },
        "0051": {
            "UN": "UN/CEFACT",
        },
        "0083": {
            "4": "This level and all lower levels rejected",
            "7": "This level acknowledged, next lower level acknowledged if not explicitly rejected",
        },
    };
   
    static comment_UCI = {
        "0085": `**Syntax error, coded**\n\nA code indicating the error detected Please refer to `
        + `APPENDIX - [CODELISTS 85 Syntax error, coded]`
        + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(85)})`
    }
    static comment_SG1_UCM = {
        "0085": `**Syntax error, coded**\n\nA code indicating the error detected Please refer to `
        + `APPENDIX - [CODELISTS 85 Syntax error, coded]`
        + `(command:edi-cat.showCodeList?${DocInfoBase.paramString(85)})`
    }
    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_UCI":
                return Info_CONTRL_In.usage_UCI[ele.getSchemaId()]
                break;
            case "ROOT_SG1_UCM":
                return Info_CONTRL_In.usage_SG1_UCM[ele.getSchemaId()]
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
            case "ROOT_UCI":
                return Info_CONTRL_In.comment_UCI[ele.getSchemaId()];
                break;
            case "ROOT_SG1_UCM":
                return Info_CONTRL_In.comment_SG1_UCM[ele.getSchemaId()];
                break;

            default:

        }
        return undefined;
    }
}