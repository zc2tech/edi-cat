import { CancellationToken, FormattingOptions, ProviderResult, Range, TextDocument, TextEdit } from "vscode";

export default class XmlUtils {
    static isNullOrUndefined(o: any): boolean {
      return o === null || o === undefined;
    }

    public static getConverter(doc:TextDocument) {
        
    }
}