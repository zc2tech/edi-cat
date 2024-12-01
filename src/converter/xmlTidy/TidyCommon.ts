import { fragment } from "xmlbuilder2";
import { TidyBase } from "./TidyBase";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

// "Contact" : "(Name,PostalAddress*,Email*,Phone*,Fax*,URL*,IdReference*,Extrinsic*)
export class TidyContact extends TidyBase {
    Name = fragment(); PostalAddress = fragment(); Email = fragment();
    Phone = fragment(); Fax = fragment(); URL = fragment();
    IdReference = fragment(); Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.Name); p.import(this.PostalAddress); p.import(this.Email);
        p.import(this.Phone); p.import(this.Fax); p.import(this.URL);
        p.import(this.IdReference); p.import(this.Extrinsic);
    }
}
export class TidyAddress extends TidyBase {
    Name = fragment(); PostalAddress = fragment(); Email = fragment();
    Phone = fragment(); Fax = fragment(); URL = fragment();
    IdReference = fragment(); Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.Name); p.import(this.PostalAddress); p.import(this.Email);
        p.import(this.Phone); p.import(this.Fax); p.import(this.URL);
        p.import(this.IdReference); p.import(this.Extrinsic);
    }
}

// DTD: <!ELEMENT Modification (OriginalPrice?, (AdditionalDeduction | AdditionalCost), Tax?, ModificationDetail?)>
export class TidyModification extends TidyBase {
    OriginalPrice = fragment(); AdditionalDeduction = fragment(); AdditionalCost = fragment();
    Tax = fragment(); ModificationDetail = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.OriginalPrice); p.import(this.AdditionalDeduction); p.import(this.AdditionalCost);
        p.import(this.Tax); p.import(this.ModificationDetail);
    }
    public isEmpty(): boolean {
        return !this.OriginalPrice.some(() => true)
            && !this.AdditionalDeduction.some(() => true)
            && !this.AdditionalCost.some(() => true)
            && !this.Tax.some(() => true)
            && !this.ModificationDetail.some(() => true)
    }
}

// <!ELEMENT TaxDetail (TaxableAmount?, TaxAmount, TaxLocation?,
// TaxAdjustmentAmount?, Description?,TriangularTransactionLawReference ?,
// TaxRegime?, TaxExemption?,Extrinsic* )>
export class TidyTaxDetail extends TidyBase {
    TaxableAmount = fragment(); TaxAmount = fragment(); TaxLocation = fragment();
    TaxAdjustmentAmount = fragment(); Description = fragment(); TriangularTransactionLawReference = fragment();
    TaxRegime = fragment(); TaxExemption = fragment(); Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.TaxableAmount); p.import(this.TaxAmount); p.import(this.TaxLocation);
        p.import(this.TaxAdjustmentAmount); p.import(this.Description); p.import(this.TriangularTransactionLawReference);
        p.import(this.TaxRegime); p.import(this.TaxExemption); p.import(this.Extrinsic);
    }
    public copyTo(t: TidyTaxDetail): TidyTaxDetail {
        t.TaxableAmount.import(this.TaxableAmount); t.TaxAmount.import(this.TaxAmount); t.TaxLocation.import(this.TaxLocation);
        t.TaxAdjustmentAmount.import(this.TaxAdjustmentAmount); t.Description.import(this.Description); t.TriangularTransactionLawReference.import(this.TriangularTransactionLawReference);
        t.TaxRegime.import(this.TaxRegime); t.TaxExemption.import(this.TaxExemption); t.Extrinsic.import(this.Extrinsic);
        for (let k in this._objAtt) {
            t.att(k, this._objAtt[k]);
        }
        return t;
    }
    public isEmpty(): boolean {
        return !this.TaxAmount.some(() => true);
    }

}

// <!ELEMENT Tax (Money, TaxAdjustmentAmount?, Description, TaxDetail*, Distribution*, Extrinsic*)>
export class TidyTax extends TidyBase {
    Money = fragment(); TaxAdjustmentAmount = fragment(); Description = fragment();
    TaxDetail = fragment(); Distribution = fragment(); Extrinsic = fragment();

    protected _subSend(p: XMLBuilder) {
        p.import(this.Money); p.import(this.TaxAdjustmentAmount); p.import(this.Description);
        p.import(this.TaxDetail); p.import(this.Distribution); p.import(this.Extrinsic);
    }
    public isEmpty(): boolean {
        return !this.Money.some(() => true);
    }
}

// <!ELEMENT ItemID (SupplierPartID, SupplierPartAuxiliaryID?, BuyerPartID?, IdReference*)>
export class TidyItemID extends TidyBase {
    SupplierPartID = fragment(); SupplierPartAuxiliaryID = fragment();
    BuyerPartID = fragment(); IdReference = fragment();
    public isEmpty(): boolean {
        return !this.SupplierPartID.some(() => true)
            && !this.SupplierPartAuxiliaryID.some(() => true)
            && !this.BuyerPartID.some(() => true)
            && !this.IdReference.some(() => true);
    }
    protected _subSend(p: XMLBuilder) {
        p.import(this.SupplierPartID); p.import(this.SupplierPartAuxiliaryID);
        p.import(this.BuyerPartID); p.import(this.IdReference);
    }
}

export class TidyProduct extends TidyBase {
    SupplierPartID = fragment(); SupplierPartAuxiliaryID = fragment(); BuyerPartID = fragment();
    IdReference = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.SupplierPartID); p.import(this.SupplierPartAuxiliaryID); p.import(this.BuyerPartID);
        p.import(this.IdReference);
    }
}

export class TidyItemDetailRetail extends TidyBase {
    EANID = fragment(); EuropeanWasteCatalogID = fragment(); Characteristic = fragment();
    public isEmpty(): boolean {
        return !this.EANID.some(() => true)
            && !this.EuropeanWasteCatalogID.some(() => true)
            && !this.Characteristic.some(() => true);
    }
    protected _subSend(p: XMLBuilder) {
        p.import(this.EANID); p.import(this.EuropeanWasteCatalogID); p.import(this.Characteristic);
    }
}