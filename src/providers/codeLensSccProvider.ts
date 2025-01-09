import { CancellationToken, CodeLens, CodeLensProvider, Command, Range, TextDocument } from 'vscode';

export interface RequestRangeOptions {
    ignoreCommentLine?: boolean;
    ignoreEmptyLine?: boolean;
    ignoreFileVariableDefinitionLine?: boolean;
    ignoreResponseRange?: boolean;
}

export class CodeLensSccProvider implements CodeLensProvider {
    public provideCodeLenses(document: TextDocument, token: CancellationToken): Promise<CodeLens[]> {
        const blocks: CodeLens[] = [];
        const RegNewline: RegExp = /\r?\n/g;
        const lines: string[] = document.getText().split(RegNewline);
        const requestRanges: [number, number][] = CodeLensSccProvider.getRequestRanges(lines);

        for (const [blockStart, blockEnd] of requestRanges) {
            const range = new Range(blockStart, 0, blockEnd, 0);
            const cmd: Command = {
                arguments: [document, range],
                title: 'Execute Command',
                command: 'edi-cat.sccCommand'
            };
            blocks.push(new CodeLens(range, cmd));
        }

        return Promise.resolve(blocks);
    }

    private static getDelimiterRows(lines: string[]): number[] {
        return Object.entries(lines)
            .filter(([, value]) => /^#{3,}/.test(value))
            .map(([index, ]) => +index);
    }

    public static getRequestRanges(lines: string[], options?: RequestRangeOptions): [number, number][] {
        options = {
            ignoreCommentLine: true,
            ignoreEmptyLine: true,
            ignoreFileVariableDefinitionLine: true,
            ignoreResponseRange: true,
            ...options
        };
        const requestRanges: [number, number][] = [];
        const delimitedLines = this.getDelimiterRows(lines);
        delimitedLines.push(lines.length);

        let prev = -1;
        for (const current of delimitedLines) {
            let start = prev + 1;
            let end = current - 1;
            while (start <= end) {
                const startLine = lines[start];
                if (options.ignoreResponseRange && this.isResponseStatusLine(startLine)) {
                    break;
                }

                if (options.ignoreCommentLine && this.isCommentLine(startLine)
                    || options.ignoreEmptyLine && this.isEmptyLine(startLine)
                    || options.ignoreFileVariableDefinitionLine && this.isFileVariableDefinitionLine(startLine)) {
                    start++;
                    continue;
                }

                const endLine = lines[end];
                if (options.ignoreCommentLine && this.isCommentLine(endLine)
                    || options.ignoreEmptyLine && this.isEmptyLine(endLine)) {
                    end--;
                    continue;
                }

                requestRanges.push([start, end]);
                break;
            }
            prev = current;
        }

        return requestRanges;
    }

    public static isCommentLine(line: string): boolean {
        const CommentIdentifiersRegex: RegExp = /^\s*(#|\/{2})/;
        return CommentIdentifiersRegex.test(line);
    }

    public static isResponseStatusLine(line: string): boolean {
        const responseStatusLineRegex: RegExp = /^\s*HTTP\/[\d.]+/;
        return responseStatusLineRegex.test(line);
    }

    public static isFileVariableDefinitionLine(line: string): boolean {
        const FileVariableDefinitionRegex: RegExp = /^\s*@([^\s=]+)\s*=\s*(.*?)\s*$/;
        return FileVariableDefinitionRegex.test(line);
    }

    public static isEmptyLine(line: string): boolean {
        return line.trim() === '';
    }

}
