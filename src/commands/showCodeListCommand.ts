import * as vscode from "vscode";
import * as constants from "../cat_const";
import path = require("path");

export class ShowCodeListCommand {
  static extensionPath;
  public async command(...args: string[]) {
    let codeType:string;
    if (!args || args.length < 1) {
      const selected = await vscode.window.showQuickPick(
				[
					{ label: '26', description: 'Country Code(X12)' },
					{ label: '40', description: 'Equipment Description Code' },
					{ label: '85', description: 'Syntax Error' },
					{ label: '91', description: 'Transportation Method/Type Code' },
					{ label: '103', description: 'Packing Code' },
					{ label: '146', description: 'Shipment Method of Payment' },
					{ label: '156', description: 'Provice or State Code' },
					{ label: '284', description: 'Service Level Code' },
					{ label: '355', description: 'Unit of Measurement Code' },
					{ label: '623', description: 'Time Code' },
					{ label: '716', description: 'Functional Group Syntax Error Code' },
					{ label: '718', description: 'Transaction Set Syntax Error Code' },
					{ label: '963', description: 'Tax Type Code' },
					{ label: '1153', description: 'Reference Code Qualifier(EDIFACT)' },
					{ label: '1153A', description: 'Reference Code Qualifier(EANCOM)' },
					{ label: '1300', description: 'Service Promotion Allowance Charge Code' },
					{ label: '2379', description: 'Date/time/period Format Qualifier' },
					{ label: '3035', description: 'Party Function Code Qualifier' },
					{ label: '3207', description: 'Country Code(EDIFACT)' },
					{ label: '4215', description: 'Transport Charges Method of Payment' },
					{ label: '5153', description: 'Duty/tax/fee Type' },
					{ label: '6411', description: 'Measurement Unit Code' },
					{ label: '6345', description: 'Currency Code' },
					{ label: '7065', description: 'Type of Packages Identification(EDIFACT)' },
					{ label: '7065A', description: 'Package Type Description Code(EANCOM)' },
				],
				{ placeHolder: 'Select the view to show when opening a window.' }
      );
      if (!selected) {
        return;
      }
      codeType = selected.label;
      //codeType = await vscode.window.showInputBox({ prompt: "1:XXX \n , 2:UUU" });
    } else {
      codeType = args[0].toString();
    }
    // Prepare the resource file (for example a markdown file)
    
    if (!codeType) {
      vscode.window.showErrorMessage("Please specify code type.");
      return;
    }

    let codeListFile = "";
    switch (codeType) {
      case "26":
        codeListFile = "26_country_code.pair";
        break;
      case "40":
        codeListFile = "40_equipment_description_code.pair";
        break;
      case "85":
        codeListFile = "85_syntax_error_coded.pair";
        break;
      case "91":
        codeListFile = "91_transportation_method_type_code.pair";
        break;
      case "103":
        codeListFile = "103_packaging_code.pair";
        break;
      case "146":
        codeListFile = "146_shipment_method_of_payment.pair";
        break;
      case "156":
        codeListFile = "156_province_code.pair";
        break;
      case "284":
        codeListFile = "284_service_level_code.pair";
        break;
      case "355":
        codeListFile = "355_uom_code.pair";
        break;
      case "623":
        codeListFile = "623_time_code.pair";
        break;
      case "716":
        codeListFile = "716_functional_group_syntax_error_code.pair";
        break;
      case "718":
        codeListFile = "718_transaction_set_syntax_error_code.pair";
        break;
      case "963":
        codeListFile = "963_tax_type_code.pair";
        break;
      case "1153":
        codeListFile = "1153_reference_code_qualifier.pair";
        break;
      case "1153A":
        codeListFile = "1153A_reference_code_qualifier.pair";
        break;
      case "1300":
        codeListFile = "1300_service_promotion_allowance_charge_code.pair";
        break;
      case "2379":
        codeListFile = "2379_date_time_period_format_qualifier.pair";
        break;
      case "3035":
        codeListFile = "3035_party_function_code_qualifier.pair";
        break;
      case "3207":
        codeListFile = "3207_country_coded.pair";
        break;
      case "4215":
        codeListFile = "4215_transport_charges_method_of_payment.pair";
        break;
      case "5153":
        codeListFile = "5153_duty_tax_fee_type.pair";
        break;
      case "6411":
        codeListFile = "6411_measurement_unit_code.pair";
        break;
      case "6345":
        codeListFile = "6345_currency.pair";
        break;
      case "7065":
        codeListFile = "7065_type_of_packages_identification.pair";
        break;
      case "7065A":
        codeListFile = "7065A_type_of_packages_identification.pair";
        break;

      default:
        vscode.window.showErrorMessage(`Code Type ${codeType} not exist.`);
        return;
    }

    const filePath = path.join(ShowCodeListCommand.extensionPath, 'resource', 'code_list', codeListFile);
    // let uri = vscode.Uri.file(filePath);

    // let doc = await vscode.workspace.openTextDocument(uri);

    //vscode.window.showTextDocument(doc);
    //Open the file in a new editor window
    vscode.workspace.openTextDocument(filePath)
      .then(doc => vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside));

    //vscode.commands.executeCommand(constants.nativeCommands.focusFirstEditorGroup);
  }
}
