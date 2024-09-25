import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";

export class Info_CONTRL_In extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_BGM = {
        "": {
            "": "",
        },
       
    };
    
   
    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_BGM":
                return Info_CONTRL_In.usage_BGM[ele.getSchemaId()]
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