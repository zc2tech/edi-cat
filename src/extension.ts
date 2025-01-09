/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from "vscode";
//import { EdifactFormattingEditProvider } from "./edifact/edifactFormattingProvider";
import { putAllSegmentsInSingleLineCommandHandler } from "./edifact/commandHandlers";
import { SelectTextByPositionCommand } from "./commands/selectTextByPositionCommand";
import { EdiDiagnosticsMgr } from "./diagnostics/ediDiagnostics";
import { HoverEdifactProvider } from "./providers/hoverEdifactProvider";
import { HoverX12Provider } from "./providers/hoverX12Provider";
import { TreeAssistantProvider } from "./providers/treeAssistantProvider";
import { TreeItemElement } from "./providers/treeEntity";
import { ParseDocumentCommand } from "./commands/parseDocumentCommand";
import { FileTypeSelector } from "./diagnostics/fileTypeSelector";
import { ParserUtils } from "./utils/parserUtils";
import { CodelensEdiProvider } from "./providers/codelensEdiProvider";
import { EdiType } from "./new_parser/entities";
import { FileParserMeta } from "./new_parser/entities";
import { parse } from "path";
import path = require("path");
import { ShowCodeListCommand } from "./commands/showCodeListCommand";
import { CacheMgr } from "./utils/cacheMgr";
import { AllFormatter } from "./providers/documentFormattingEdiProvider";
import { ToggleCodelensCommand } from "./commands/toggleCodelensCommand";
import { HoverEdiDatProvider } from "./providers/hoverEdiDatProvider";
import { ParserUtilsBase } from "./utils/parserUtilsBase";
import { ConversionCommand } from "./commands/conversionCommand";
import { SccCommand } from "./commands/sccCommand";
import { CodeLensSccProvider } from "./providers/codeLensSccProvider";

export function activate(ctx: vscode.ExtensionContext) {
    // let config: Configuration = new Configuration();
    const parsedDocMap: { [key: string]: FileParserMeta }[] = [];
    CacheMgr.parsedDocMap = parsedDocMap;

    ParserUtilsBase.ctx = ctx;

    vscode.workspace.onDidChangeTextDocument(event => {
        CacheMgr.clearParserMeta(event.document.uri.toString());
    });

    // This is the only way we can get 'this' point in class function.
    // let cvtCmd = new AllConversionCommand();
    // ctx.subscriptions.push(vscode.commands.registerCommand('edi-cat.convertTo', cvtCmd.command, cvtCmd));

    // reason I just implemented onDidRenameFiles:
    // In Visual Studio Code (VSCode), there is no specific event that triggers 
    // when a file is duplicated. However, to detect if a file has been duplicated 
    // (usually by copying and pasting), you can utilize the onDidCreateFiles event of the vscode.workspace namespace.
    vscode.workspace.onDidRenameFiles(e => {
        e.files.forEach(file => {
            const oldUri = file.oldUri;
            const newUri = file.newUri;
            ParserUtilsBase.changeStateVersionKey(oldUri, newUri);
        });

        ParserUtilsBase.saveParserMap();
    });

    ctx.subscriptions.push(vscode.commands.registerCommand('edi-cat.selectTextByPosition', new SelectTextByPositionCommand().command));
    let cmdParseDoc = new ParseDocumentCommand();
    ctx.subscriptions.push(vscode.commands.registerCommand('edi-cat.parseDocument', cmdParseDoc.command,cmdParseDoc));

    // lots of things done in constructor, like register event, push View
    const treeAssistantEdiProvider = new TreeAssistantProvider(ctx);
    const allFormatter = new AllFormatter();
    const sccCmd = new SccCommand();
    vscode.commands.registerCommand("edi-cat.addAssistantGroupSegment", (node: TreeItemElement) => treeAssistantEdiProvider.addAssistantGroupSegment(node)),

        ctx.subscriptions.push(
            // Edifact
            vscode.languages.registerDocumentFormattingEditProvider(['edifact'], allFormatter),
            vscode.languages.registerHoverProvider(['edifact'], new HoverEdifactProvider()),

            // X12
            vscode.languages.registerDocumentFormattingEditProvider([EdiType.X12], allFormatter),
            vscode.languages.registerHoverProvider([EdiType.X12], new HoverX12Provider()),

            // edidat(.dat file with content of X12, EDIFACT, XML)
            vscode.languages.registerDocumentFormattingEditProvider(EdiType.EDIDAT, allFormatter),
            vscode.languages.registerHoverProvider([EdiType.EDIDAT], new HoverEdiDatProvider()),

            // others not related to filetype
            vscode.commands.registerCommand("edi-cat.refreshTreeAssistantExplorer", () => treeAssistantEdiProvider.refresh()),
            vscode.commands.registerCommand("edi-cat.sccCommand",
                (document: vscode.TextDocument, range: vscode.Range) => sccCmd.run(range))
        );

    const diagMgr = new EdiDiagnosticsMgr();
    const selector: FileTypeSelector = new FileTypeSelector();
    diagMgr.fileTypeSelector = selector;
    ctx.subscriptions.push(...diagMgr.registerDiagnostics());
    FileTypeSelector.diagMgr = diagMgr;

    ShowCodeListCommand.extensionPath = ctx.extensionPath;
    ctx.subscriptions.push(vscode.commands.registerCommand('edi-cat.showCodeList', new ShowCodeListCommand().command));
    //ctx.subscriptions.push(vscode.commands.registerCommand('edi-cat.convertTo', new ConversionCommand().command));

    ctx.subscriptions.push(vscode.commands.registerCommand('edi-cat.toggleCodelens', new ToggleCodelensCommand().command));

    registerStatusLabel(ctx, selector);

    //addConfiguration(ctx);

    const lensProvider = new CodelensEdiProvider(parsedDocMap);
    const lensSccProvider = new CodeLensSccProvider();
    vscode.languages.registerCodeLensProvider({ language: EdiType.X12 }, lensProvider);
    vscode.languages.registerCodeLensProvider({ language: EdiType.EDIFACT }, lensProvider);
    vscode.languages.registerCodeLensProvider({ language: EdiType.SCC }, lensSccProvider);

    console.log('Test Cmd Started');

    // Sample Code, can be deleted.
    let disposable = vscode.commands.registerCommand('edi-cat.test-cmd', async () => {
        // Display the count in an information message
        var str = 'haha';
        vscode.window.showInformationMessage(`Just for test: ${JSON.stringify(str)}`);
    });

    ctx.subscriptions.push(disposable);
    // ctx.subscriptions.push(...new DocumentSymbolsEdiProvider().registerFunctions());
    console.log('Extension "edi-cat" is now active!');
}

// Function to save an object to workspaceState
async function saveObject(context: vscode.ExtensionContext, key: string, obj: { [key: string]: any }) {
    await context.workspaceState.update(key, obj);
}

// Function to retrieve an object from workspaceState
function getObject(context: vscode.ExtensionContext, key: string): { [key: string]: any } | undefined {
    return context.workspaceState.get<{ [key: string]: any }>(key);
}

function registerStatusLabel(context: vscode.ExtensionContext, selector: FileTypeSelector) {
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    item.text = "File Type Selector";
    item.color = "yellow";
    item.command = 'edi-cat.showQuickPick';
    item.show();
    selector.statusFileType = item;
    context.subscriptions.push(item);

    const disposable = vscode.commands.registerCommand('edi-cat.showQuickPick', selector.showQuickPick.bind(selector));

    context.subscriptions.push(disposable);
}

// function registerProvider(context: vscode.ExtensionContext, provider: IProvidable) {
// 	context.subscriptions.push(...provider.registerFunctions());
// }

// function registerCommand(context: vscode.ExtensionContext, command: ICommandable, callback?: (...args: any[]) => any) {
// 	const commandDisposable = vscode.commands.registerCommand(command.name, callback || command.command);
// 	context.subscriptions.push(commandDisposable);
// }
export function deactivate() { }



