import { DocumentFilter } from "vscode";

import * as constants from "../cat_const";

export function createDocumentSelector(language: string): DocumentFilter[] {
    return [
        { language, scheme: constants.uriSchemes.file },
        { language, scheme: constants.uriSchemes.untitled },
    ];
}
