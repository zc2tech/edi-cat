// <!ELEMENT ShipControl (CarrierIdentifier+, ShipmentIdentifier+,
//     PackageIdentification?, (Route|TransportInformation)*, Contact*, Comments*,
//     Extrinsic*)>
const CRLF = "\r\n";

function getContents(input:string):string[] {
    // step 1: get content embraced in round brackets
    input = input.replace(`//`,'');
    const roundBracketsContents = input.match(/\(([^>]+)\)/);
    if (!roundBracketsContents) {
        throw new Error(`Invalid input: No content embraced in round brackets`);
    }
  
    // step 2: split result from step1 with '?,' or '*' or '?,' into array
    const splitContents = roundBracketsContents[1].replace(/[\(\)]/g,'') .split(/[\?,\|\+\*]/);
    return splitContents;
}

function getClassName(s:string):string {
    const matchName = s.match(/ELEMENT\s([^(]+)\s\(/);
    if (!matchName) {
        throw new Error(`Invalid input: cannot find ClassName`);
    }
    return 'Tidy' + matchName[1]
}

// Test the function.
let str = `
<!ELEMENT InvoiceDetailItemRetail (AdditionalPrices?, TotalRetailAmount?, ItemIndicator*, PromotionDealID?, PromotionVariantID?)>
`
const arrFields = getContents(str);
const className = getClassName(str);

// export class TidyItemID extends TidyBase {
//     SupplierPartID = fragment(); SupplierPartAuxiliaryID = fragment();
//     BuyerPartID = fragment(); IdReference = fragment();
//     protected _subSend(p: XMLBuilder) {
//         p.import(this.SupplierPartID); p.import(this.SupplierPartAuxiliaryID);
//         p.import(this.BuyerPartID); p.import(this.IdReference);
//     }
// }

let output = `export class ${className} extends TidyBase {` + CRLF;
let counter = 0;
for (let f of arrFields) {
    if (f.trim() == '') {
        continue;
    }
    output += `${f} = fragment();`
    counter++;
    if (counter > 2) {
        counter =0 ;
        output += CRLF;
    }
}
output =output + CRLF +` protected _subSend(p: XMLBuilder) {` + CRLF;

counter = 0;
for (let f of arrFields) {
    if (f.trim() == '') {
        continue;
    }
    output += ` p.import(this.${f});`
    counter++;
    if (counter > 2) {
        counter =0 ;
        output += CRLF;
    }
}
output =output + ` }`;
output =output + CRLF +`}` + CRLF;


console.log(output);