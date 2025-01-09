import * as vscode from "vscode";
import { HoverProviderBase } from "./hoverProviderBase";
import { Disposable } from "vscode";
import { EdiType } from "../new_parser/entities";
import * as constants from "../cat_const";

export class HoverEdiDatProvider extends HoverProviderBase {
  public getLanguageName(): string {
    return constants.ediDocument.edidat.name;
  }
}
