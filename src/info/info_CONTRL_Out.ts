import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_CONTRL_Out extends DocInfoBase {
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
        "0085": {
            "2": "Syntax version or level not supported",
            "12": "Invalid value",
            "13": "Missing",
            "14": "Value not supported in this position",
            "15": "Not supported in this position",
            "16": "Too many constituents",
            "18": "Unspecified error",
            "19": "Invalid decimal notation",
            "28": "References do not match",
            "29": "Control count does not match number of instances received",
            "30": "Functional groups and messages mixed",
            "37": "Invalid type of character(s)",
            "39": "Data element too long",
            "40": "Data element too short"
        }

    };

    static usage_SG1_UCM = {
        "0052": {
            "D": "Draft version/UN/EDIFACT Directory",
        },
        "0054": {
            "01B": "Release 2001 - B",
        },
        "0051": {
            "UN": "UN/CEFACT",
        },
        "0083": {
            "4": "This level and all lower levels rejected",
            "7": "This level acknowledged, next lower level acknowledged if not explicitly rejected",
        },
        "0085": {
            "12": "Invalid value",
            "13": "Missing",
            "14": "Value not supported in this position",
            "15": "Not supported in this position",
            "16": "Too many constituents",
            "18": "Unspecified error",
            "28": "References do not match",
            "29": "Control count does not match number of instances received",
            "30": "Functional groups and messages mixed",
            "31": "More than one message type in group",
            "37": "Invalid type of character(s)",
            "39": "Data element too long",
            "40": "Data element too short"
        }

    };

    static usage_SG1_SG2_UCS = {
        "0085": {
            "12": "Invalid value",
            "13": "Missing",
            "14": "Value not supported in this position",
            "15": "Not supported in this position",
            "16": "Too many constituents",
            "18": "Unspecified error",
            "19": "Invalid decimal notation",
            "35": "Too many segment repetitions",
            "36": "Too many segment group repetitions",
            "37": "Invalid type of character(s)",
            "39": "Data element too long",
            "40": "Data element too short"
        }
    }
    static usage_SG1_SG2_UCD = {
        "0085": {
            "12": "Invalid value",
            "13": "Missing",
            "14": "Value not supported in this position",
            "15": "Not supported in this position",
            "16": "Too many constituents",
            "18": "Unspecified error",
            "19": "Invalid decimal notation",
            "35": "Too many segment repetitions",
            "36": "Too many segment group repetitions",
            "37": "Invalid type of character(s)",
            "39": "Data element too long",
            "40": "Data element too short"
        }
    }
   
    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_UCI":
                return Info_CONTRL_Out.usage_UCI[ele.getSchemaId()]
                break;
            case "ROOT_SG1_UCM":
                return Info_CONTRL_Out.usage_SG1_UCM[ele.getSchemaId()]
                break;
            case "ROOT_SG1_SG2_UCS":
                return Info_CONTRL_Out.usage_SG1_SG2_UCS[ele.getSchemaId()]
                break;
            case "ROOT_SG1_SG2_UCD":
                return Info_CONTRL_Out.usage_SG1_SG2_UCD[ele.getSchemaId()]
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
            // case "ROOT_UCI":
            //     return Info_CONTRL_In.comment_UCI[ele.getSchemaId()];
            //     break;
            // case "ROOT_SG1_UCM":
            //     return Info_CONTRL_In.comment_SG1_UCM[ele.getSchemaId()];
            //     break;

            default:

        }
        return undefined;
    }
}