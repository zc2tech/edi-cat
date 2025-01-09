import { EdiType } from "./new_parser/entities";

/* eslint-disable @typescript-eslint/no-namespace */
export namespace nativeCommands {
  export const revealLine = "revealLine";
  export const focusFirstEditorGroup = "workbench.action.focusFirstEditorGroup";
  export const open = "vscode.open";
}

export namespace ediDocument {
  export const sizeLimit = 1024; // K chars 
  export const lineBreak = "\n";
  export const x12 = {
    name: "x12",
    segment: {
      ISA: "ISA",
      ST: "ST",
      GS: "GS",
      GE: "GE",
      IEA: "IEA",
    },
    defaultDelimiters: {
      segmentDelimiter: "~",
      dataElementDelimiter: "*",
      componentElementDelimiter: ":",
    }
  };
  export const edifact = {
    name: "edifact",
    segment: {
      UNA: "UNA",
      UNB: "UNB",
      UNH: "UNH",
      UNZ: "UNZ",
      UNT: "UNT",
    },
    defaultDelimiters: {
      segmentDelimiter: "'",
      dataElementDelimiter: "+",
      componentElementDelimiter: ":",
      releaseCharacter: "?"
    }
  };
  export const edidat = {
    name: "edidat",    
  };
  export const scc = {
    name: "scc",    
  };
}

export namespace configuration {
  export const ediCat = "edi-cat";
  export const enableCodelens = "enableCodelens";
  export const enableDiagnosis = "enableDiagnosis";
  export const enableHover = "enableHover";
  export const buyerANID = "buyerANID";
  export const buyerIC = "buyerIC";
  export const buyerGP = "buyerGP";
  export const supplierANID = "supplierANID";
  export const supplierIC = "supplierIC";
  export const supplierGP = "supplierGP";

}

export namespace diagnostic {
  export const diagnosticCollectionId = "ediCatDiagnostics";
}

export namespace explorers {
  export const treeExplorerId = "edi-cat.explorer";
  export const refreshEdiExplorer = "edi-cat.refreshEdiExplorer";
  export const treeAssistantExplorerId = "edi-cat.treeAssistantExplorer";
  //export const refreshTreeAssistantExplorer = "edi-cat.refreshTreeAssistantExplorer";
}

export namespace errors {
  export const methodNotImplemented = "Method not implemented.";
  export const ediCatError = "EDI Cat Error";
  export const segmentParseError = "Error ParseSegment: ";
  export const importSchemaError = "Failed to import schema {0}";
  export const schemaFileNotFound = "Schema file {0} not found";
}

export namespace common {
  // export const kasoftware = {
  //   name: "",
  //   url: "",
  //   allRightsReserved: "",
  //   schemaViewer: {
  //     url: ""
  //   }
  // };
  export const MAP_FILE_PARSER = "MAP_FILE_PARSER_v3";
}

export namespace themeIcons {
  export const symbolParameter = "symbol-parameter";
  export const recordSmall = "record-small";
  export const mention = "mention";
}

export namespace versionKeys {
  export const X12_810 = "X12.810";
  export const X12_820 = "X12.820";
  export const X12_824_In = "X12.824.In";
  export const X12_824_Out = "X12.824.Out";
  export const X12_Family_824 = [X12_824_In,X12_824_Out];
  export const X12_830 = "X12.830";
  export const X12_830_ProductActivity = "X12.830.ProductActivity";
  export const X12_830_Order = "X12.830.Order";
  export const X12_Family_830 = [X12_830,X12_830_Order,X12_830_ProductActivity];
  export const X12_842_In = "X12.842.In";
  export const X12_842_Out = "X12.842.Out";
  export const X12_Family_842 = [X12_842_In,X12_842_Out];
  export const X12_846 = "X12.846";
  export const X12_846_Consignment = "X12.846.Consignment";
  export const X12_846_MOPO = "X12.846.MOPO";
  export const X12_846_SMI = "X12.846.SMI";
  export const X12_Family_846 = [X12_846,X12_846_Consignment,X12_846_MOPO,X12_846_SMI];
  export const X12_850 = "X12.850";
  export const X12_850_SalesOrder = "X12.850.SalesOrder";
  export const X12_Family_850 = [X12_850,X12_850_SalesOrder];
  export const X12_855 = "X12.855";
  export const X12_856_In = "X12.856.In";
  export const X12_856_Out = "X12.856.Out";
  export const X12_Family_856 = [X12_856_In,X12_856_Out];
  export const X12_860 = "X12.860";
  export const X12_861_In = "X12.861.In";
  export const X12_861_Out = "X12.861.Out"; // for backward compatibility
  //export const X12_Family_861 = [X12_861_In,X12_861_Out];
  export const X12_862 = "X12.862";
  export const X12_865 = "X12.865";
  export const X12_866 = "X12.866";
  export const X12_997_In = "X12.997.In";
  export const X12_997_Out = "X12.997.Out";
  export const X12_Family_997 = [X12_997_In,X12_997_Out];
  export const EDIFACT_APERAK = "APERAK"; // Inbound and Outbound show the same format/samplecode
  export const EDIFACT_CONTRL_In = "CONTRL.In"; 
  export const EDIFACT_CONTRL_Out = "CONTRL.Out"; 
  export const EDIFACT_DELFOR_ProductActivity = "DELFOR.ProductActivity"; 
  export const EDIFACT_DELFOR_Order = "DELFOR.Order"; 
  export const EDIFACT_DELJIT = "DELJIT"; 
  export const EDIFACT_DESADV = "DESADV"; 
  export const EDIFACT_INVOIC = "INVOIC"; 
  export const EDIFACT_ORDCHG = "ORDCHG"; 
  export const EDIFACT_ORDRSP = "ORDRSP";
  export const EDIFACT_ORDERS = "ORDERS"; 
  export const EDIFACT_RECADV = "RECADV"; 
  export const EDIFACT_REMADV = "REMADV"; 
  // For EANCOM D01B
  export const D01B_APERAK = "D01B_APERAK"; // Inbound and Outbound show the same format/samplecode
  export const D01B_DESADV = "D01B_DESADV"; 
  export const D01B_INVOIC = "D01B_INVOIC"; 
  export const D01B_ORDCHG = "D01B_ORDCHG"; 
  export const D01B_ORDRSP = "D01B_ORDRSP";
  export const D01B_ORDERS = "D01B_ORDERS"; 
  export const D01B_REMADV = "D01B_REMADV";   
}

////////// for XML //////////////////
export namespace commands {
  export const evaluateXPath = "xmlTools.evaluateXPath";
  export const executeXQuery = "xmlTools.executeXQuery";
  export const formatAsXml = "xmlTools.formatAsXml";
  export const xmlToText = "xmlTools.xmlToText";
  export const textToXml = "xmlTools.textToXml";
  export const getCurrentXPath = "xmlTools.getCurrentXPath";
  export const minifyXml = "xmlTools.minifyXml";
}

export namespace contextKeys {
  export const xmlTreeViewEnabled = "xmlTreeViewEnabled";
}

export namespace diagnosticCollections {
  export const xquery = "XQueryDiagnostics";
}

export namespace languageIds {
  export const xml = "xml";
  export const xsd = "xsd";
  export const xquery = "xquery";
}

export namespace stateKeys {
  export const xpathQueryHistory = "xpathQueryHistory";
  export const xPathQueryLast = "xPathQueryLast";
}

export namespace uriSchemes {
  export const file = "file";
  export const untitled = "untitled";
}

export namespace views {
  export const xmlTreeView = "xmlTreeView";
}

export namespace xmlFormatterImplementations {
  export const classic = "classic";
  export const v2 = "v2";
}

export class XML {
  static readonly cXML = 'cXML';
  static readonly payloadID = 'payloadID';
  static readonly timestamp = 'timestamp';
  static readonly Header = 'Header';
  static readonly From = 'From';
  static readonly To = 'To';
  static readonly Sender = 'Sender';
  static readonly SharedSecret = 'SharedSecret';
  static readonly NetworkID = 'NetworkID';
  static readonly SystemID = 'SystemID';
  static readonly domain = 'domain';
  static readonly Identity = 'Identity';
  static readonly Credential = 'Credential';
  static readonly UserAgent = 'UserAgent';
  static readonly Request = 'Request';
  static readonly quantity = 'quantity';
  static readonly UnitOfMeasure = 'UnitOfMeasure';
  static readonly InvoiceDetailRequest = 'InvoiceDetailRequest';
  static readonly InvoiceDetailRequestHeader = 'InvoiceDetailRequestHeader';
  static readonly Extrinsic = 'Extrinsic';
  static readonly lang = 'xml:lang';
  static readonly DocumentReference = 'DocumentReference';
  static readonly IdReference = 'IdReference';
  static readonly identifier = 'identifier';
  static readonly DeliverTo = 'DeliverTo';
  static readonly invoiceSubmissionMethod = 'invoiceSubmissionMethod';
  static readonly CIG_X12 = 'CIG_X12';
  static readonly deploymentMode='deploymentMode';
  static readonly Contact = 'Contact';
  static readonly Description = 'Description';
  static readonly currency = 'currency';
  static readonly Money = 'Money';
  static readonly role = 'role';
  static readonly Dimension = 'Dimension';
  static readonly type = 'type';
  static readonly ShortName = 'ShortName';
  static readonly parentLineNumber = 'parentLineNumber';
  static readonly nameXML = 'name';
  static readonly trackingId = 'trackingId';
  static readonly trackingDomain = 'trackingDomain';
  static readonly category = 'category';
  static readonly alternateCurrency = 'alternateCurrency';
  static readonly alternateAmount = 'alternateAmount';
}

export class XMLPath {
  static readonly CXLM_REQUEST = '/cXML/Request';
  static readonly CXLM_MESSAGE = '/cXML/Message';
}
export class X12 {
  static readonly ROOT_REF = 'ROOT_REF';
  static readonly BIG = 'BIG';
  static readonly REF = 'REF';
  static readonly IT1_IT1 = 'IT1_IT1';
}


export enum ConvertPattern {
  X12_to_cXML = 'X12_to_cXML',
  cXML_to_EDIFACT_D96A = 'cXML_to_EDIFACT_D96A',
  EDIFACT_D96A_to_cXML = 'EDIFACT_D96A_to_cXML',
  cXML_to_X12 = 'cXML_to_X12',
}
