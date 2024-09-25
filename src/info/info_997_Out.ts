import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_997_Out extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_AK2_AK3_AK3 = {
        "04": {
            "3": "Mandatory segment missing",
            "4": "Loop Occurs Over Maximum Times",
            "5": "Segment Exceeds Maximum Use",
            "6": "Segment Not in Defined Transaction Set",
            "7": "Segment Not in Proper Sequence",
            "8": "Segment Has Data Element Errors"
        }
    };
    static usage_AK2_AK3_AK4 = {
        "01": {
            "1": "Mandatory data element missing",
            "3": "Too many data elements.",
            "4": "Data element too short.",
            "5": "Data element too long.",
            "6": "Invalid character in data element.",
            "7": "Invalid code value.",
            "8": "Invalid Date"
        }
    };
    static usage_AK2_AK5 = {
        "01": {
            "A": "Accepted",
            "R": "Rejected",
        },
        "02": {
            "3": "Transaction Set Control Number in Header and Trailer Do Not Match",
            "4": "Number of Included Segments Does Not Match Actual Count"
        },
        "03": {
            "3": "Transaction Set Control Number in Header and Trailer Do Not Match",
            "4": "Number of Included Segments Does Not Match Actual Count"
        },
    };
    static usage_AK9 = {
        "01": {
            "A": "Accepted",
            "R": "Rejected",
        },
        "05": {
            "4": "Group Control Number in the Functional Group Header and Trailer Do Not Agree",
            "5": "Number of Included Transaction Sets Does Not Match Actual Count"
        },
        "06": {
            "4": "Group Control Number in the Functional Group Header and Trailer Do Not Agree",
            "5": "Number of Included Transaction Sets Does Not Match Actual Count"
        },
    };

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_AK2_AK3_AK3":
                return Info_997_Out.usage_AK2_AK3_AK3[ele.designatorIndex]
                break;
            case "ROOT_AK2_AK3_AK4":
                return Info_997_Out.usage_AK2_AK3_AK4[ele.designatorIndex]
                break;
            case "ROOT_AK2_AK5":
                return Info_997_Out.usage_AK2_AK5[ele.designatorIndex]
                break;
            case "ROOT_AK9":
                return Info_997_Out.usage_AK9[ele.designatorIndex]
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
            // case "ROOT_GS":
            //     return Info_824_In_XXX.comment_GS[ele.designatorIndex];
            //     break;

            default:

        }
        return undefined;
    }
}