import * as vscode from "vscode";
import * as constants from "../cat_const";

export class ToggleCodelensCommand {

  public async command(...args) {
    if (!vscode.window.activeTextEditor) {
      return;
    }
    let conf = vscode.workspace.getConfiguration(constants.configuration.ediCat);
    let isEnabled = conf.get(constants.configuration.enableCodelens);

    // The arguments are:
    // Setting key
    // New value
    // true to make the change user-level (saved between sessions)
    conf.update(constants.configuration.enableCodelens, !isEnabled, true);

  }
}