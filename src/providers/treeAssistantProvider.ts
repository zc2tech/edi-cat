import * as vscode from "vscode";
import Utils, { StringBuilder } from "../utils/utils";
import { EdiUtils } from "../utils/ediUtils";
import { EdiElement, EdiSegment, EdiType } from "../new_parser/entities";
import * as constants from "../cat_const";
import { TreeItemType, TreeItemElement, EdiGroup, ElementAttribute } from "./treeEntity";

import { Assistant810 } from "./assistants/assistant810";
import { Assistant820 } from "./assistants/assistant820";
import { Assistant824In } from "./assistants/assistant824In";
import { Assistant824Out } from "./assistants/assistant824Out";
import { Assistant830 } from "./assistants/assistant830";
import { Assistant830ProductActivity } from "./assistants/assistant830ProductActivity";
import { Assistant830Order } from "./assistants/assistant830Order";
import { Assistant842In } from "./assistants/assistant842In";
import { Assistant842Out } from "./assistants/assistant842Out";
import { Assistant846 } from "./assistants/assistant846";
import { Assistant846Consign } from "./assistants/assistant846Consign";
import { Assistant846MOPO } from "./assistants/assistant846MOPO";
import { Assistant846SMI } from "./assistants/assistant846SMI";
import { Assistant850 } from "./assistants/assistant850"
import { Assistant850SalesOrder } from "./assistants/assistant850SalesOrder";
import { Assistant855 } from "./assistants/assistant855";
import { Assistant856In } from "./assistants/assistant856In";
import { Assistant856Out } from "./assistants/assistant856Out";
import { Assistant860 } from "./assistants/assistant860";
import { Assistant861In } from "./assistants/assistant861In";
import { Assistant861Out } from "./assistants/assistant861Out";
import { Assistant862 } from "./assistants/assistant862";
import { Assistant866 } from "./assistants/assistant866";
import { Assistant997In } from "./assistants/assistant997In";
import { Assistant997Out } from "./assistants/assistant997Out";

import { AssistantAPERAK } from "./assistants/assistantAPERAK"; // Inbound Outbound share the same
import { AssistantCONTRLIn } from "./assistants/assistantCONTRLIn";
import { AssistantCONTRLOut } from "./assistants/assistantCONTRLOut";
import { AssistantDELFOROrder } from "./assistants/assistantDELFOROrder";
import { AssistantDELFORProductActivity } from "./assistants/assistantDELFORProductActivity";
import { AssistantDELJIT } from "./assistants/assistantDELJIT";
import { AssistantDESADV } from "./assistants/assistantDESADV";
import { AssistantINVOIC } from "./assistants/assistantINVOIC";
import { AssistantORDCHG } from "./assistants/assistantORDCHG";
import { AssistantORDERS } from "./assistants/assistantORDERS";
import { AssistantORDRSP } from "./assistants/assistantORDRSP";
import { AssistantRECADV } from "./assistants/assistantRECADV";
import { AssistantREMADV } from "./assistants/assistantREMADV";

import * as path from 'path';

export class TreeAssistantProvider implements vscode.TreeDataProvider<TreeItemElement> {
  //name: string = "edi-cat.refreshTreeAssistantExplorer";
  private _languageId = "";
  private _newLineStr: string = "";
  private _selection: TreeItemElement[] = [];
  private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
  private _context: vscode.ExtensionContext;

  private _ass810 = new Assistant810();
  private _ass820 = new Assistant820();
  private _ass824In = new Assistant824In();
  private _ass824Out = new Assistant824Out();
  private _ass830 = new Assistant830();
  private _ass830ProductActivity = new Assistant830ProductActivity();
  private _ass830Order = new Assistant830Order();
  private _ass842In = new Assistant842In();
  private _ass842Out = new Assistant842Out();
  private _ass846 = new Assistant846();
  private _ass846Consign = new Assistant846Consign();
  private _ass846MOPO = new Assistant846MOPO();
  private _ass846SMI = new Assistant846SMI();
  private _ass850 = new Assistant850();
  private _ass850SalesOrder = new Assistant850SalesOrder();
  private _ass855 = new Assistant855();
  private _ass856In = new Assistant856In();
  private _ass856Out = new Assistant856Out();
  private _ass860 = new Assistant860();
  private _ass861In = new Assistant861In();
  private _ass861Out = new Assistant861Out();
  private _ass862 = new Assistant862();
  private _ass866 = new Assistant866();
  private _ass997In = new Assistant997In();
  private _ass997Out = new Assistant997Out();

  private _assAPERAK = new AssistantAPERAK();
  private _assCONTRLIn = new AssistantCONTRLIn();
  private _assCONTRLOut = new AssistantCONTRLOut();
  private _assDELFOROrder = new AssistantDELFOROrder();
  private _assDELFORProductActivity = new AssistantDELFORProductActivity();
  private _assDELJIT = new AssistantDELJIT();
  private _assDESADV = new AssistantDESADV();
  private _assINVOIC = new AssistantINVOIC();
  private _assORDCHG = new AssistantORDCHG();
  private _assORDERS = new AssistantORDERS();
  private _assORDRSP = new AssistantORDRSP();
  private _assRECADV = new AssistantRECADV();
  private _assREMADV = new AssistantREMADV();

  private _treeView: vscode.TreeView<TreeItemElement>;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
    if (vscode.window.activeTextEditor) {
      this._languageId = vscode.window.activeTextEditor.document.languageId;
    }

    this._treeView = vscode.window.createTreeView('edi-cat.treeAssistantExplorer', { treeDataProvider: this, showCollapseAll: true, canSelectMany: true });
    this._treeView.onDidChangeSelection((e) => {
      this._selection = [];
      this._selection.push(...e.selection);
      //(e.selection && e.selection.length === 1 ? e.selection[0] : undefined);
    })

    context.subscriptions.push(this._treeView);

    vscode.window.onDidChangeActiveTextEditor(e => this.onActiveEditorChange(e));
    //vscode.window.onDidChangeVisibleTextEditors(e => this.onActiveEditorChange(e));

    let d = vscode.window.activeTextEditor.document;
    if (EdiUtils.isX12(d) || EdiUtils.isEdifact(d)) {
      vscode.commands.executeCommand('setContext', 'showEdiTsuyaAssistant', true);
      this.refresh();
    }

  }

  public refresh(): any {
    this._onDidChangeTreeData.fire(undefined);
  }

  private _renderGroup(gNode: TreeItemElement, sb: StringBuilder) {
    let children = this.getChildren(gNode);
    for (let n of children) {
      if (n.type == TreeItemType.Segment) {
        sb.append(n.codeSample + this._newLineStr);
      } else if (n.type === TreeItemType.Group) {
        this._renderGroup(n, sb);
      } else {
        // do nothing
      }
    }
  }
  private _createAssistantStr(): string {
    let sb: StringBuilder = new StringBuilder();
    for (let n of this._selection) {
      if (n.type == TreeItemType.Group || n.type == TreeItemType.Version) {
        this._renderGroup(n, sb);
      } else if (n.type == TreeItemType.Segment) {
        sb.append(n.codeSample + this._newLineStr);
      } else {
        // do nothing
      }
    }
    return sb.toString();
  }


  public addAssistantGroupSegment(node: TreeItemElement): any {

    if (this._selection.length > 0) {
      if (!this._selection.find(obj => obj === node)) {
        // there are nodes selected, but not me:
        this._selection = [];
        this._selection.push(node);
        this._treeView.reveal(node, { select: true, focus: true });
      }
    } else {
      // there is no selection, add myself
      this._selection.push(node);
      this._treeView.reveal(node, { select: true, focus: true }); // coordinate the UI
    }


    this._newLineStr = EdiUtils.getNewLine();

    //this._onDidChangeTreeData.fire(undefined);
    if (!vscode.window.activeTextEditor) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const cursorPosition = editor.selection.anchor;
    let lineText = editor.document.lineAt(cursorPosition.line).text;
    let snip = new vscode.SnippetString();

    let assistantText: string;
    assistantText = this._createAssistantStr();

    // make sure there is no newline at last of string
    // then we can tweak as we want
    if (assistantText.slice(-1) == this._newLineStr) {
      // /n
      assistantText = assistantText.slice(0, assistantText.length - 1);
    }
    if (assistantText.slice(-2) == this._newLineStr) {
      // /r/n
      assistantText = assistantText.slice(0, assistantText.length - 2);
    }

    if (lineText.trim().length === 0) {
      // always not tweak for blank line
      snip.appendText(assistantText)
    } else if (cursorPosition.character === 0) {
      snip.appendText(assistantText + this._newLineStr)
    } else if (cursorPosition.character === lineText.length) {
      snip.appendText(this._newLineStr + assistantText)
    } else {
      // we don't tweak anything
      snip.appendText(assistantText)
    }

    editor.insertSnippet(snip);
    //editor.document
    vscode.commands.executeCommand(constants.nativeCommands.focusFirstEditorGroup);
  }

  // key: string; // ROOT, or group name liek SG2_SG26, or Segment Name like ROOT_ISA , SG2_SG26_PO1
  //   type: TreeItemType;
  //   group?: EdiGroup;
  //   segment?: EdiSegment;
  //   version?: string;
  //   codeSample?:string;
  private _getIcon(t: TreeItemType): any {

    if (t === TreeItemType.Group) {
      return {

        light: this._context.asAbsolutePath(path.join('img', 'icon.png')),
        dark: this._context.asAbsolutePath(path.join('img', 'icon.png'))
      };
    }
    return null;
  }


  private _getGroupLabel(key: string): string {
    let arr: string[] = key.split('_');
    return arr[arr.length - 1];
  }
  async getTreeItem(element: TreeItemElement): Promise<vscode.TreeItem> {
    if (element.type === TreeItemType.Version) {
      return {
        label: element.key,
        iconPath: new vscode.ThemeIcon("file-code"),
        description: element.desc,
        tooltip: element.desc,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        contextValue: "insertable"
        // command: {
        //   command: constants.commands.selectTextByPositionCommand.name,
        //   title: "",
        //   arguments: [segment.startIndex, segment.endIndex + 1]
        // }
      };
    } else if (element.type === TreeItemType.Group) {
      return {
        label: this._getGroupLabel(element.key),
        //iconPath: vscode.ThemeIcon.Folder,
        description: element.desc,
        tooltip: "Group: " + element.key,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        contextValue: "insertable"
        // command: {
        //   command: constants.commands.selectTextByPositionCommand.name,
        //   title: "command fro group",
        //   //arguments: [segment.startIndex, segment.endIndex + 1]
        //   arguments: [1, 2]
        // }
      }
    } else if (element.type === TreeItemType.Segment) {
      return {
        label: element.key,
        iconPath: new vscode.ThemeIcon("three-bars"),
        description: element.desc,
        tooltip: new vscode.MarkdownString('```' + this._languageId + '\n' + element.codeSample + '\n```'),
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        contextValue: "insertable"
        // command: {
        //   command: constants.commands.selectTextByPositionCommand.name,
        //   title: "command for segment",
        //   arguments: [3, 4]
        // }
      }
    }
    else {
      throw new Error(`Unknown tree item type: ${element.type}`);
    }
  }

  getChildren(element?: TreeItemElement | undefined): TreeItemElement[] | null | undefined {
    if (!element) {
      if (this._languageId == EdiType.X12) {
        return [
          {
            key: constants.versionKeys.X12_810,
            type: TreeItemType.Version,
            desc: "Invoice, Inbound"
          },
          {
            key: constants.versionKeys.X12_820,
            type: TreeItemType.Version,
            desc: "Payment Order/Remittance Advice, Inbound"
          },
          {
            key: constants.versionKeys.X12_824_In,
            type: TreeItemType.Version,
            desc: "Application Advice, Inbound"
          },
          {
            key: constants.versionKeys.X12_824_Out,
            type: TreeItemType.Version,
            desc: "Application Advice, Outbound"
          },
          {
            key: constants.versionKeys.X12_830,
            type: TreeItemType.Version,
            desc: "Planning Schedule with Release Capability, Inbound"
          },
          {
            key: constants.versionKeys.X12_830_Order,
            type: TreeItemType.Version,
            desc: "Planning Schedule with Release Capability, Outbound"
          },
          {
            key: constants.versionKeys.X12_830_ProductActivity,
            type: TreeItemType.Version,
            desc: "Planning Schedule with Release Capability, Outbound"
          },
          {
            key: constants.versionKeys.X12_842_In,
            type: TreeItemType.Version,
            desc: "Nonconformance Report, Inbound"
          },
          {
            key: constants.versionKeys.X12_842_Out,
            type: TreeItemType.Version,
            desc: "Nonconformance Report, Outbound"
          },
          {
            key: constants.versionKeys.X12_846,
            type: TreeItemType.Version,
            desc: "Inventory Inquiry/Advice, Inbound"
          },
          {
            key: constants.versionKeys.X12_846_SMI,
            type: TreeItemType.Version,
            desc: "SMI Inventory Inquiry/Advice, Outbound"
          },
          {
            key: constants.versionKeys.X12_846_Consignment,
            type: TreeItemType.Version,
            desc: "Consignment Material Movements, Outbound"
          },
          {
            key: constants.versionKeys.X12_846_MOPO,
            type: TreeItemType.Version,
            desc: "Manufacturing Visibility Production (MO / PO), Inbound"
          },
          {
            key: constants.versionKeys.X12_850,
            type: TreeItemType.Version,
            desc: "Purchase Order, Outbound"
          },
          {
            key: constants.versionKeys.X12_850_SalesOrder,
            type: TreeItemType.Version,
            desc: "Sales Order, Inbound"
          },
          {
            key: constants.versionKeys.X12_855,
            type: TreeItemType.Version,
            desc: "Purchase Order Acknowledgement, Inbound"
          },
          {
            key: constants.versionKeys.X12_856_In,
            type: TreeItemType.Version,
            desc: "Ship Notice/Manifest, Inbound"
          },
          {
            key: constants.versionKeys.X12_856_Out,
            type: TreeItemType.Version,
            desc: "Copy Ship Notice/Manifest / Component Shipment, Outbound"
          },
          {
            key: constants.versionKeys.X12_860,
            type: TreeItemType.Version,
            desc: "Purchase Order Change, Outbound"
          },
          {
            key: constants.versionKeys.X12_861_In,
            type: TreeItemType.Version,
            desc: "Receiving Advice/Acceptance Certificate, Inbound"
          },
          {
            key: constants.versionKeys.X12_861_Out,
            type: TreeItemType.Version,
            desc: "Receiving Advice/Acceptance Certificate, Outbound"
          },
          {
            key: constants.versionKeys.X12_862,
            type: TreeItemType.Version,
            desc: "Shipping Schedule (Scheduling Agreement), Outbound"
          },
          {
            key: constants.versionKeys.X12_866,
            type: TreeItemType.Version,
            desc: "Production Sequence (Component Consumption), Inbound"
          },
          {
            key: constants.versionKeys.X12_997_In,
            type: TreeItemType.Version,
            desc: "Functional Acknowledgement, Inbound"
          },
          {
            key: constants.versionKeys.X12_997_Out,
            type: TreeItemType.Version,
            desc: "Functional Acknowledgement, Outbound"
          },
        ];
      } else if (this._languageId == EdiType.EDIFACT) {
        return [
          {
            key: constants.versionKeys.EDIFACT_APERAK,
            type: TreeItemType.Version,
            desc: "Application error and acknowledgement, Inbound/Outbound"
          },
          {
            key: constants.versionKeys.EDIFACT_CONTRL_In,
            type: TreeItemType.Version,
            desc: "Syntax and service report message, Inbound"
          },
          {
            key: constants.versionKeys.EDIFACT_CONTRL_Out,
            type: TreeItemType.Version,
            desc: "Syntax and service report message, Outbound"
          },
          {
            key: constants.versionKeys.EDIFACT_DELFOR_Order,
            type: TreeItemType.Version,
            desc: "Delivery Schedule, Order based, Outbound"
          },
          {
            key: constants.versionKeys.EDIFACT_DELFOR_ProductActivity,
            type: TreeItemType.Version,
            desc: "Delivery Schedule, ProductActivity based, Outbound"
          },
          {
            key: constants.versionKeys.EDIFACT_DELJIT,
            type: TreeItemType.Version,
            desc: "Delivery Just in Time, Order based, Outbound"
          },
          {
            key: constants.versionKeys.EDIFACT_DESADV,
            type: TreeItemType.Version,
            desc: "Despatch advice, Inbound"
          },
          {
            key: constants.versionKeys.EDIFACT_INVOIC,
            type: TreeItemType.Version,
            desc: "Invoice, Inbound"
          },
          {
            key: constants.versionKeys.EDIFACT_ORDCHG,
            type: TreeItemType.Version,
            desc: "Purchase order change request, Outbound"
          },
          {
            key: constants.versionKeys.EDIFACT_ORDERS,
            type: TreeItemType.Version,
            desc: "Purchase order, Outbound"
          },
          {
            key: constants.versionKeys.EDIFACT_ORDRSP,
            type: TreeItemType.Version,
            desc: "Purchase order response, Inbound"
          },
          {
            key: constants.versionKeys.EDIFACT_RECADV,
            type: TreeItemType.Version,
            desc: "Receiving advice, Outbound"
          },
          {
            key: constants.versionKeys.EDIFACT_REMADV,
            type: TreeItemType.Version,
            desc: "Remittance Advice, Outbound"
          },
        ];
      }
      return;
    }

    // element exists, so it's not root
    let finalVersion: string;
    if (element.type == TreeItemType.Version) {
      finalVersion = element.key
    } else if (element.type == TreeItemType.Group) {
      finalVersion = element.rootVersion;
    }

    switch (finalVersion) { // rootVersion always exist for Group
      case Assistant810.versionKey:
        return this._ass810.getChildren(element);
      case Assistant820.versionKey:
        return this._ass820.getChildren(element);
        break;
      case Assistant824In.versionKey:
        return this._ass824In.getChildren(element);
        break;
      case Assistant824Out.versionKey:
        return this._ass824Out.getChildren(element);
        break;
      case Assistant830.versionKey:
        return this._ass830.getChildren(element);
        break;
      case Assistant830Order.versionKey:
        return this._ass830Order.getChildren(element);
        break;
      case Assistant830ProductActivity.versionKey:
        return this._ass830ProductActivity.getChildren(element);
        break;
      case Assistant842In.versionKey:
        return this._ass842In.getChildren(element);
        break;
      case Assistant842Out.versionKey:
        return this._ass842Out.getChildren(element);
        break;
      case Assistant846.versionKey:
        return this._ass846.getChildren(element);
        break;
      case Assistant846Consign.versionKey:
        return this._ass846Consign.getChildren(element);
        break;
      case Assistant846MOPO.versionKey:
        return this._ass846MOPO.getChildren(element);
        break;
      case Assistant846SMI.versionKey:
        return this._ass846SMI.getChildren(element);
        break;
      case Assistant850.versionKey:
        return this._ass850.getChildren(element);
        break;
      case Assistant850SalesOrder.versionKey:
        return this._ass850SalesOrder.getChildren(element);
        break;
      case Assistant855.versionKey:
        return this._ass855.getChildren(element);
        break;
      case Assistant856In.versionKey:
        return this._ass856In.getChildren(element);
        break;
      case Assistant856Out.versionKey:
        return this._ass856Out.getChildren(element);
        break;
      case Assistant860.versionKey:
        return this._ass860.getChildren(element);
        break;
      case Assistant861In.versionKey:
        return this._ass861In.getChildren(element);
        break;
      case Assistant861Out.versionKey:
        return this._ass861Out.getChildren(element);
        break;
      case Assistant862.versionKey:
        return this._ass862.getChildren(element);
        break;
      case Assistant866.versionKey:
        return this._ass866.getChildren(element);
        break;
      case Assistant997In.versionKey:
        return this._ass997In.getChildren(element);
        break;
      case Assistant997Out.versionKey:
        return this._ass997Out.getChildren(element);

      case AssistantAPERAK.versionKey:
        return this._assAPERAK.getChildren(element);
      case AssistantCONTRLIn.versionKey:
        return this._assCONTRLIn.getChildren(element);
      case AssistantCONTRLOut.versionKey:
        return this._assCONTRLOut.getChildren(element);
      case AssistantDESADV.versionKey:
        return this._assDESADV.getChildren(element);
      case AssistantDELFOROrder.versionKey:
        return this._assDELFOROrder.getChildren(element);
      case AssistantDELFORProductActivity.versionKey:
        return this._assDELFORProductActivity.getChildren(element);
      case AssistantDELJIT.versionKey:
        return this._assDELJIT.getChildren(element);
      case AssistantINVOIC.versionKey:
        return this._assINVOIC.getChildren(element);
      case AssistantORDCHG.versionKey:
        return this._assORDCHG.getChildren(element);
      case AssistantORDERS.versionKey:
        return this._assORDERS.getChildren(element);
      case AssistantORDRSP.versionKey:
        return this._assORDRSP.getChildren(element);
      case AssistantRECADV.versionKey:
        return this._assRECADV.getChildren(element);
      case AssistantREMADV.versionKey:
        return this._assREMADV.getChildren(element);

      default:
    }
    //return ass950.getChildren(element);

  }

  getParent?(element: TreeItemElement): vscode.ProviderResult<TreeItemElement> {
    throw new Error(constants.errors.methodNotImplemented);
  }

  resolveTreeItem?(item: vscode.TreeItem, element: TreeItemElement, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    return item;
  }


  command(...args: any[]) {
    this.refresh();
  }

  private getSegmentTreeItem(segment: EdiSegment): vscode.TreeItem {
    const segmentDesc = segment.ediReleaseSchemaSegment?.desc ?? "";
    return {
      label: segment.id,
      iconPath: EdiUtils.icons.segment,
      description: segmentDesc,
      tooltip: segmentDesc,
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
      command: {
        command: 'edi-cat.selectTextByPosition',
        title: "",
        arguments: [segment.startIndex, segment.endIndex + 1]
      }
    };
  }


  private getCompositeElementTreeItem(segment: EdiSegment, element: EdiElement): vscode.TreeItem {
    const elementDesc = element.ediReleaseSchemaElement?.desc ?? "";
    return {
      label: element.getDesignatorWithId(),
      iconPath: EdiUtils.icons.element,
      description: elementDesc,
      tooltip: elementDesc,
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
      command: {
        command: 'edi-cat.selectTextByPosition',
        title: "",
        arguments: [segment.startIndex + element.startIndex, segment.startIndex + element.endIndex + 1]
      }
    };
  }

  /**
   * I think it's dangerous to implement it, seem there will be infinite loop
   * @param e 
   */
  public onTextChange(e: any) {
    // if (!e?.document) {
    //   return;
    // }

    // this._languageId = e?.document.languageId;

    // if (EdiUtils.isX12(e?.document) || EdiUtils.isEdifact(e?.document)) {
    //   this.refresh();
    // }
  }

  public onActiveEditorChange(e: any) {
    if (!e?.document) {
      vscode.commands.executeCommand('setContext', 'showEdiTsuyaAssistant', false);
      return;
    }

    this._languageId = e?.document.languageId;

    if (EdiUtils.isX12(e?.document) || EdiUtils.isEdifact(e?.document)) {
      vscode.commands.executeCommand('setContext', 'showEdiTsuyaAssistant', true);
      this.refresh();
    }
  }
}


