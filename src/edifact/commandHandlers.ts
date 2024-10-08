import {window} from "vscode";
import { putAllSegmentsToSingleLine } from "./edifactDocumentTransformations";
import { entrireDocRange } from "./rangeUtils";

export async function putAllSegmentsInSingleLineCommandHandler() {
    const editor = window.activeTextEditor;
    if (editor === undefined) {
        return;
    }

    const document = editor.document;
    if (document === undefined) {
        return;
    }

    await editor.edit(builder => {
        builder.replace(
            entrireDocRange(document),
            putAllSegmentsToSingleLine(document.getText()));
    })
}