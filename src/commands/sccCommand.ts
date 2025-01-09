import { Position, Range, TextDocument, TextEditor, Uri, window } from 'vscode';
import { ParserUtilsBase } from '../utils/parserUtilsBase';


export class SccCommand {
    public async run(range: Range) {
        const editor = window.activeTextEditor;
        const path = require('path');
        const regSplit = '' //;
        const s = editor.document.getText(new Range(range.start.line, 0, range.start.line + 1, 0)).trim();
        let arr = s.split(/\s+/);
        let cmd = arr[0].toLowerCase();
        switch (cmd) {
            case 'rmv':
            case 'del':
                if (arr[1] && arr[1].length >= 2) {
                    let fullPath:string ='';
                    if (arr[1].substring(1, 2) == ':' || arr[1].startsWith('/')) {
                         // full path
                        fullPath = arr[1];
                    } else {
                        // relative path
                        let folderPath = path.dirname(editor.document.uri.fsPath);
                        fullPath = path.join(folderPath, arr[1]);
                    }
                    
                     if (ParserUtilsBase.removeStateVersionKey(Uri.file(fullPath))) {
                        window.showInformationMessage('Done. Do not forget reopen file.')
                    } else {
                        window.showWarningMessage('Failed, maybe wrong path or no need to do');
                    }
                    
                }
                break;
            default:

        }
    }

} // end class SccCommand definition
