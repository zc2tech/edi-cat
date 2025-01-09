// <!ELEMENT ShipControl (CarrierIdentifier+, ShipmentIdentifier+,
//     PackageIdentification?, (Route|TransportInformation)*, Contact*, Comments*,
//     Extrinsic*)>
var CRLF = "\r\n";
function getContents(input) {
    // step 1: get content embraced in round brackets
    input = input.replace("//", '');
    var roundBracketsContents = input.match(/\(([^>]+)\)/);
    if (!roundBracketsContents) {
        throw new Error("Invalid input: No content embraced in round brackets");
    }
    // step 2: split result from step1 with '?,' or '*' or '?,' into array
    var splitContents = roundBracketsContents[1].replace(/[\(\)]/g, '').split(/[\?,\|\+\*]/);
    return splitContents;
}
function getClassName(s) {
    var matchName = s.match(/ELEMENT\s([^(]+)\s\(/);
    if (!matchName) {
        throw new Error("Invalid input: cannot find ClassName");
    }
    return 'Tidy' + matchName[1];
}
// Test the function.
var str = "\n<!ELEMENT InvoiceDetailItemRetail (AdditionalPrices?, TotalRetailAmount?, ItemIndicator*, PromotionDealID?, PromotionVariantID?)>\n";
var arrFields = getContents(str);
var className = getClassName(str);
// export class TidyItemID extends TidyBase {
//     SupplierPartID = fragment(); SupplierPartAuxiliaryID = fragment();
//     BuyerPartID = fragment(); IdReference = fragment();
//     protected _subSend(p: XMLBuilder) {
//         p.import(this.SupplierPartID); p.import(this.SupplierPartAuxiliaryID);
//         p.import(this.BuyerPartID); p.import(this.IdReference);
//     }
// }
var output = "export class ".concat(className, " extends TidyBase {") + CRLF;
var counter = 0;
for (var _i = 0, arrFields_1 = arrFields; _i < arrFields_1.length; _i++) {
    var f = arrFields_1[_i];
    if (f.trim() == '') {
        continue;
    }
    output += "".concat(f, " = fragment();");
    counter++;
    if (counter > 2) {
        counter = 0;
        output += CRLF;
    }
}
output = output + CRLF + " protected _subSend(p: XMLBuilder) {" + CRLF;
counter = 0;
for (var _a = 0, arrFields_2 = arrFields; _a < arrFields_2.length; _a++) {
    var f = arrFields_2[_a];
    if (f.trim() == '') {
        continue;
    }
    output += " p.import(this.".concat(f, ");");
    counter++;
    if (counter > 2) {
        counter = 0;
        output += CRLF;
    }
}
output = output + " }";
output = output + CRLF + "}" + CRLF;
console.log(output);
