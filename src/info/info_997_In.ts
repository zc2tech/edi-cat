import { DocInfoBase } from "./docInfoBase";
import { EdiSegment } from "../new_parser/entities";
import { EdiElement } from "../new_parser/entities";
import { SegComment } from "./docInfoBase";

export class Info_997_In extends DocInfoBase {
    //static usage_BIG: { [key: string]: { [key: string]: string } } = {};
    //static comment_BIG: { [key: string]: string } = {};

    static usage_AK2_AK5 = {
        "01": {
            "A": "Accepted",
            "R": "Rejected",
        }
    };
    static usage_AK9 = {
        "01": {
            "A": "Accepted",
            "R": "Rejected",
        }
    };

    static comment_AK2_AK5 = {
        "02": `**Transaction Set Syntax Error Code**`
            + `\n\nCode indicating error found based on the syntax editing of a transaction set`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 718 Transaction Set Syntax Error Code]`
            +`(command:edi-cat.showCodeList?${DocInfoBase.paramString(718)})`,
        "03": `**Transaction Set Syntax Error Code**`
            + `\n\nCode indicating error found based on the syntax editing of a transaction set`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 718 Transaction Set Syntax Error Code]`
            +`(command:edi-cat.showCodeList?${DocInfoBase.paramString(718)})`,
        "04": `**Transaction Set Syntax Error Code**`
            + `\n\nCode indicating error found based on the syntax editing of a transaction set`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 718 Transaction Set Syntax Error Code]`
            +`(command:edi-cat.showCodeList?${DocInfoBase.paramString(718)})`,
        "05": `**Transaction Set Syntax Error Code**`
            + `\n\nCode indicating error found based on the syntax editing of a transaction set`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 718 Transaction Set Syntax Error Code]`
            +`(command:edi-cat.showCodeList?${DocInfoBase.paramString(718)})`,
        "06": `**Transaction Set Syntax Error Code**`
            + `\n\nCode indicating error found based on the syntax editing of a transaction set`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 718 Transaction Set Syntax Error Code]`
            +`(command:edi-cat.showCodeList?${DocInfoBase.paramString(718)})`,
    }
    static comment_AK9 = {  
        "05": `**Functional Group Syntax Error Code**`
            + `\n\nCode indicating error found based on the syntax editing of a transaction set`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 716 Functional Group Syntax Error Code]`
            +`(command:edi-cat.showCodeList?${DocInfoBase.paramString(716)})`,
        "06": `**Functional Group Syntax Error Code**`
            + `\n\nCode indicating error found based on the syntax editing of a transaction set`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 716 Functional Group Syntax Error Code]`
            +`(command:edi-cat.showCodeList?${DocInfoBase.paramString(716)})`,
        "07": `**Functional Group Syntax Error Code**`
            + `\n\nCode indicating error found based on the syntax editing of a transaction set`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 716 Functional Group Syntax Error Code]`
            +`(command:edi-cat.showCodeList?${DocInfoBase.paramString(716)})`,
        "08": `**Functional Group Syntax Error Code**`
            + `\n\nCode indicating error found based on the syntax editing of a transaction set`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 716 Functional Group Syntax Error Code]`
            +`(command:edi-cat.showCodeList?${DocInfoBase.paramString(716)})`,
        "09": `**Functional Group Syntax Error Code**`
            + `\n\nCode indicating error found based on the syntax editing of a transaction set`
            + `\n\nPlease refer to APPENDIX - [CODELISTS 716 Functional Group Syntax Error Code]`
            +`(command:edi-cat.showCodeList?${DocInfoBase.paramString(716)})`,
       
    }

    public getUsage(seg: EdiSegment, ele: EdiElement): {} {

        switch (seg.astNode.fullPath) {
            case "ROOT_AK2_AK5":
                return Info_997_In.usage_AK2_AK5[ele.designatorIndex]
                break;
            case "ROOT_AK9":
                return Info_997_In.usage_AK9[ele.designatorIndex]
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
            case "ROOT_AK2_AK5":
                return Info_997_In.comment_AK2_AK5[ele.designatorIndex]
                break;
            case "ROOT_AK9":
                return Info_997_In.comment_AK9[ele.designatorIndex]
                break;

            default:

        }
        return undefined;
    }
}