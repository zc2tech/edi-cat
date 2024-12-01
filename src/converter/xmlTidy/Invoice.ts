
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { TidyBase } from "./TidyBase";

// <!ELEMENT InvoiceDetailItem (UnitOfMeasure, UnitPrice, PriceBasisQuantity?,
//     InvoiceDetailItemReference,
//     ReceiptLineItemReference?,
//     ShipNoticeLineItemReference?,
//     (ServiceEntryItemReference | ServiceEntryItemIDInfo)?,
//     ProductMovementItemIDInfo?,
//     SubtotalAmount?,
//     Tax?, InvoiceDetailLineSpecialHandling?,
//     InvoiceDetailLineShipping?, ShipNoticeIDInfo?, GrossAmount?,
//     InvoiceDetailDiscount?, InvoiceItemModifications?, TotalCharges?, 
//     TotalAllowances?, TotalAmountWithoutTax?, NetAmount?,
//     Distribution*, Packaging*, InvoiceDetailItemIndustry?, Comments?, CustomsInfo?, Extrinsic*)>
export class TidyInvoiceDetailItem extends TidyBase {
    UnitOfMeasure = fragment(); UnitPrice = fragment(); PriceBasisQuantity = fragment();
    InvoiceDetailItemReference = fragment();
    ReceiptLineItemReference = fragment();
    ShipNoticeLineItemReference = fragment();
    ServiceEntryItemReference = fragment(); ServiceEntryItemIDInfo = fragment();
    ProductMovementItemIDInfo = fragment();
    SubtotalAmount = fragment();
    Tax = fragment(); InvoiceDetailLineSpecialHandling = fragment();
    InvoiceDetailLineShipping = fragment(); ShipNoticeIDInfo = fragment(); GrossAmount = fragment();
    InvoiceDetailDiscount = fragment(); InvoiceItemModifications = fragment(); TotalCharges = fragment();
    TotalAllowances = fragment(); TotalAmountWithoutTax = fragment(); NetAmount = fragment();
    Distribution = fragment(); Packaging = fragment(); InvoiceDetailItemIndustry = fragment();
    Comments = fragment(); CustomsInfo = fragment(); Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.UnitOfMeasure); p.import(this.UnitPrice); p.import(this.PriceBasisQuantity);
        p.import(this.InvoiceDetailItemReference);
        p.import(this.ReceiptLineItemReference);
        p.import(this.ShipNoticeLineItemReference);
        p.import(this.ServiceEntryItemReference); p.import(this.ServiceEntryItemIDInfo);
        p.import(this.ProductMovementItemIDInfo);
        p.import(this.SubtotalAmount);
        p.import(this.Tax); p.import(this.InvoiceDetailLineSpecialHandling);
        p.import(this.InvoiceDetailLineShipping); p.import(this.ShipNoticeIDInfo); p.import(this.GrossAmount);
        p.import(this.InvoiceDetailDiscount); p.import(this.InvoiceItemModifications); p.import(this.TotalCharges);
        p.import(this.TotalAllowances); p.import(this.TotalAmountWithoutTax); p.import(this.NetAmount);
        p.import(this.Distribution); p.import(this.Packaging); p.import(this.InvoiceDetailItemIndustry);
        p.import(this.Comments); p.import(this.CustomsInfo); p.import(this.Extrinsic);
    }

}

// <!ELEMENT InvoiceDetailItemReference (ItemID?, Description?, Classification*,
//     (ManufacturerPartID, ManufacturerName)?,
//     Country?, SerialNumber*, SupplierBatchID?, InvoiceDetailItemReferenceIndustry?)>
export class TidyInvoiceDetailItemReference extends TidyBase {
    ItemID = fragment(); Description = fragment(); Classification = fragment();
    ManufacturerPartID = fragment(); ManufacturerName = fragment();
    Country = fragment(); SerialNumber = fragment(); SupplierBatchID = fragment(); InvoiceDetailItemReferenceIndustry = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.ItemID); p.import(this.Description); p.import(this.Classification);
        p.import(this.ManufacturerPartID); p.import(this.ManufacturerName);
        p.import(this.Country); p.import(this.SerialNumber); p.import(this.SupplierBatchID); p.import(this.InvoiceDetailItemReferenceIndustry);
    }
    public isEmpty(): boolean {
        return !this.ItemID.some(() => true)
            && !this.Description.some(() => true)
            && !this.Classification.some(() => true)
            && !this.ManufacturerPartID.some(() => true)
            && !this.ManufacturerName.some(() => true)
            && !this.Country.some(() => true)
            && !this.SerialNumber.some(() => true)
            && !this.SupplierBatchID.some(() => true)
            && !this.InvoiceDetailItemReferenceIndustry.some(() => true)
    }
}

// <!ELEMENT InvoiceDetailLineShipping (InvoiceDetailShipping, Money, Distribution*)>
export class TidyInvoiceDetailLineShipping extends TidyBase {
    InvoiceDetailShipping = fragment(); Money = fragment(); Distribution = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.InvoiceDetailShipping); p.import(this.Money); p.import(this.Distribution);
    }
    public isEmpty(): boolean {
        return !this.InvoiceDetailShipping.some(() => true)
            && !this.Money.some(() => true)
            && !this.Distribution.some(() => true)         
    }
}


// <!ELEMENT InvoiceDetailServiceItem (
//     InvoiceDetailServiceItemReference,
//     (ServiceEntryItemReference | ServiceEntryItemIDInfo)?,
//     SubtotalAmount,
//     Period?, 
//     (UnitRate | (UnitOfMeasure, UnitPrice, PriceBasisQuantity?))?,
//     Tax?,
//     GrossAmount?,
//     InvoiceDetailDiscount?, InvoiceItemModifications?, TotalCharges?, 
//     TotalAllowances?, TotalAmountWithoutTax?, NetAmount?,
//     Distribution*, Comments?, 
//     (InvoiceLaborDetail)?,
//     Extrinsic*)>
export class TidyInvoiceDetailServiceItem extends TidyBase {
    InvoiceDetailServiceItemReference = fragment();
    ServiceEntryItemReference = fragment(); ServiceEntryItemIDInfo = fragment();
    SubtotalAmount = fragment();
    Period = fragment();
    UnitRate = fragment(); UnitOfMeasure = fragment(); UnitPrice = fragment(); PriceBasisQuantity = fragment();
    Tax = fragment();
    GrossAmount = fragment();
    InvoiceDetailDiscount = fragment(); InvoiceItemModifications = fragment(); TotalCharges = fragment();
    TotalAllowances = fragment(); TotalAmountWithoutTax = fragment(); NetAmount = fragment();
    Distribution = fragment(); Comments = fragment();
    InvoiceLaborDetail = fragment(); Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.InvoiceDetailServiceItemReference);
        p.import(this.ServiceEntryItemReference); p.import(this.ServiceEntryItemIDInfo);
        p.import(this.SubtotalAmount);
        p.import(this.Period);
        p.import(this.UnitRate); p.import(this.UnitOfMeasure); p.import(this.UnitPrice); p.import(this.PriceBasisQuantity);
        p.import(this.Tax); p.import(this.GrossAmount);
        p.import(this.InvoiceDetailDiscount); p.import(this.InvoiceItemModifications); p.import(this.TotalCharges);
        p.import(this.TotalAllowances); p.import(this.TotalAmountWithoutTax); p.import(this.NetAmount);
        p.import(this.Distribution); p.import(this.Comments);
        p.import(this.InvoiceLaborDetail); p.import(this.Extrinsic);
    }
}

// <!ELEMENT InvoiceDetailServiceItemReference (Classification*, ItemID?, Description?)>
export class TidyInvoiceDetailServiceItemReference extends TidyBase {
    Classification = fragment(); ItemID = fragment(); Description = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.Classification); p.import(this.ItemID); p.import(this.Description);
    }
}

// <!ELEMENT InvoiceDetailOrderSummary (SubtotalAmount, Period?, Tax?,
//     InvoiceDetailLineSpecialHandling?,
//     InvoiceDetailLineShipping?,
//     GrossAmount?, InvoiceDetailDiscount?,
//     NetAmount?, Comments?, Extrinsic*)>
export class TidyInvoiceDetailOrderSummary extends TidyBase {
    SubtotalAmount = fragment(); Period = fragment(); Tax = fragment();
    InvoiceDetailLineSpecialHandling = fragment();
    InvoiceDetailLineShipping = fragment();
    GrossAmount = fragment(); InvoiceDetailDiscount = fragment();
    NetAmount = fragment(); Comments = fragment(); Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.SubtotalAmount); p.import(this.Period); p.import(this.Tax);
        p.import(this.InvoiceDetailLineSpecialHandling); p.import(this.InvoiceDetailLineShipping);
        p.import(this.GrossAmount); p.import(this.InvoiceDetailDiscount);
        p.import(this.NetAmount); p.import(this.Comments); p.import(this.Extrinsic);
    }
}

// <!ELEMENT InvoiceDetailRequestHeader (
//     InvoiceDetailHeaderIndicator, InvoiceDetailLineIndicator,
//     InvoicePartner*,    DocumentReference?,    InvoiceIDInfo?,
//     PaymentProposalIDInfo?,    InvoiceDetailShipping?,
//     ShipNoticeIDInfo?,    (InvoiceDetailPaymentTerm*|PaymentTerm*),
//     PaymentInformation?,    Period?,    Comments?,
//     IdReference*,    Extrinsic*)>
export class TidyInvoiceDetailRequestHeader extends TidyBase {
    InvoiceDetailHeaderIndicator = fragment(); InvoiceDetailLineIndicator = fragment();
    InvoicePartner = fragment(); DocumentReference = fragment(); InvoiceIDInfo = fragment();
    PaymentProposalIDInfo = fragment(); InvoiceDetailShipping = fragment();
    ShipNoticeIDInfo = fragment(); InvoiceDetailPaymentTerm = fragment(); PaymentTerm = fragment();
    PaymentInformation = fragment(); Period = fragment(); Comments = fragment();
    IdReference = fragment(); Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.InvoiceDetailHeaderIndicator); p.import(this.InvoiceDetailLineIndicator);
        p.import(this.InvoicePartner); p.import(this.DocumentReference); p.import(this.InvoiceIDInfo);
        p.import(this.PaymentProposalIDInfo); p.import(this.InvoiceDetailShipping);
        p.import(this.ShipNoticeIDInfo); p.import(this.InvoiceDetailPaymentTerm); p.import(this.PaymentTerm);
        p.import(this.PaymentInformation); p.import(this.Period); p.import(this.Comments);
        p.import(this.IdReference); p.import(this.Extrinsic);
    }
}


// <!ELEMENT InvoiceDetailOrder (InvoiceDetailOrderInfo, InvoiceDetailReceiptInfo?, InvoiceDetailShipNoticeInfo?,
//     (InvoiceDetailItem | InvoiceDetailServiceItem)+)>
export class TidyInvoiceDetailOrder extends TidyBase {
    InvoiceDetailOrderInfo = fragment(); InvoiceDetailReceiptInfo = fragment(); InvoiceDetailShipNoticeInfo = fragment();
    InvoiceDetailItem = fragment(); InvoiceDetailServiceItem = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.InvoiceDetailOrderInfo); p.import(this.InvoiceDetailReceiptInfo); p.import(this.InvoiceDetailShipNoticeInfo);
        p.import(this.InvoiceDetailItem); p.import(this.InvoiceDetailServiceItem);
    }
}

// <!ELEMENT Discount (DiscountPercent | DiscountAmount)>
export class TidyDiscount extends TidyBase {
    DiscountPercent = fragment(); DiscountAmount = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.DiscountPercent); p.import(this.DiscountAmount);
    }
    public isEmpty(): boolean {
        return !this.DiscountPercent.some(() => true)
            && !this.DiscountAmount.some(() => true)
    }

}
// <!ELEMENT InvoiceDetailItemReferenceRetail (EANID?, EuropeanWasteCatalogID?, Characteristic*)>
export class TidyInvoiceDetailItemReferenceRetail extends TidyBase {
    EANID = fragment(); EuropeanWasteCatalogID = fragment(); Characteristic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.EANID); p.import(this.EuropeanWasteCatalogID); p.import(this.Characteristic);
    }
    public isEmpty(): boolean {
        return !this.EANID.some(() => true)
            && !this.EuropeanWasteCatalogID.some(() => true)
            && !this.Characteristic.some(() => true)
    }

}

//<!ELEMENT InvoiceDetailItemRetail (AdditionalPrices?, TotalRetailAmount?, ItemIndicator*, PromotionDealID?, PromotionVariantID?)>
export class TidyInvoiceDetailItemRetail extends TidyBase {
    AdditionalPrices = fragment(); TotalRetailAmount = fragment(); ItemIndicator = fragment();
    PromotionDealID = fragment(); PromotionVariantID = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.AdditionalPrices); p.import(this.TotalRetailAmount); p.import(this.ItemIndicator);
        p.import(this.PromotionDealID); p.import(this.PromotionVariantID);
    }
    public isEmpty(): boolean {
        return !this.AdditionalPrices.some(() => true)
            && !this.TotalRetailAmount.some(() => true)
            && !this.ItemIndicator.some(() => true)
            && !this.PromotionDealID.some(() => true)
            && !this.PromotionVariantID.some(() => true)
    }
}

// <!ELEMENT InvoiceDetailHeaderOrder
//     (InvoiceDetailOrderInfo, InvoiceDetailOrderSummary)>
export class TidyInvoiceDetailHeaderOrder extends TidyBase {
    InvoiceDetailOrderInfo = fragment(); InvoiceDetailOrderSummary = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.InvoiceDetailOrderInfo); p.import(this.InvoiceDetailOrderSummary);
    }
    public isEmpty(): boolean {
        return !this.InvoiceDetailOrderInfo.some(() => true)
            && !this.InvoiceDetailOrderSummary.some(() => true)
    }

}

// <!ELEMENT InvoiceDetailSummary (SubtotalAmount, Tax, SpecialHandlingAmount?,
//     ShippingAmount?, GrossAmount?,
//     InvoiceDetailDiscount?, InvoiceHeaderModifications?, InvoiceDetailSummaryLineItemModifications?,
//     TotalCharges?, TotalAllowances?, TotalAmountWithoutTax?, NetAmount,
//     DepositAmount?, DueAmount?, InvoiceDetailSummaryIndustry?)>
export class TidyInvoiceDetailSummary extends TidyBase {
    SubtotalAmount = fragment(); Tax = fragment(); SpecialHandlingAmount = fragment();
    ShippingAmount = fragment(); GrossAmount = fragment();
    InvoiceDetailDiscount = fragment(); InvoiceHeaderModifications = fragment();
    InvoiceDetailSummaryLineItemModifications = fragment();
    TotalCharges = fragment(); TotalAllowances = fragment();
    TotalAmountWithoutTax = fragment(); NetAmount = fragment();
    DepositAmount = fragment(); DueAmount = fragment(); InvoiceDetailSummaryIndustry = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.SubtotalAmount); p.import(this.Tax); p.import(this.SpecialHandlingAmount);
        p.import(this.ShippingAmount); p.import(this.GrossAmount);
        p.import(this.InvoiceDetailDiscount); p.import(this.InvoiceHeaderModifications);
        p.import(this.InvoiceDetailSummaryLineItemModifications);
        p.import(this.TotalCharges); p.import(this.TotalAllowances);
        p.import(this.TotalAmountWithoutTax); p.import(this.NetAmount);
        p.import(this.DepositAmount); p.import(this.DueAmount); p.import(this.InvoiceDetailSummaryIndustry);
    }
}


// <!ELEMENT InvoiceDetailShipping (Contact, Contact+, CarrierIdentifier+, 
// ShipmentIdentifier+)?,DocumentReference?) >
export class TidyInvoiceDetailShipping extends TidyBase {
    Contact = fragment(); CarrierIdentifier = fragment();
    ShipmentIdentifier = fragment(); DocumentReference = fragment();
    public isEmpty(): boolean {
        return !this.Contact.some(() => true)
            && !this.CarrierIdentifier.some(() => true)
            && !this.ShipmentIdentifier.some(() => true)
            && !this.DocumentReference.some(() => true);
    }
    protected _subSend(p: XMLBuilder) {
        p.import(this.Contact); p.import(this.CarrierIdentifier);
        p.import(this.ShipmentIdentifier); p.import(this.DocumentReference);

    }
}

// <!ELEMENT InvoiceDetailSummaryLineItemModifications (Modification+)>
export class TidyInvoiceDetailSummaryLineItemModifications extends TidyBase {
    Modification = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.Modification);
    }
    public isEmpty(): boolean {
        return !this.Modification.some(() => true)
    }
}
export class TidyInvoiceDetailRequest extends TidyBase {
    InvoiceDetailRequestHeader = fragment(); InvoiceDetailOrder = fragment();
    InvoiceDetailHeaderOrder = fragment(); InvoiceDetailSummary = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.InvoiceDetailRequestHeader); p.import(this.InvoiceDetailOrder);
        p.import(this.InvoiceDetailHeaderOrder); p.import(this.InvoiceDetailSummary);
    }
}
export class TidyInvoiceDetailOrderInfo
    extends TidyBase {
    OrderReference = fragment(); MasterAgreementReference = fragment(); MasterAgreementIDInfo = fragment();
    SupplierOrderInfo = fragment();
    OrderIDInfo = fragment();

    protected _subSend(p: XMLBuilder) {
        p.import(this.OrderReference); p.import(this.MasterAgreementReference);
        p.import(this.MasterAgreementIDInfo);
        p.import(this.SupplierOrderInfo); p.import(this.OrderIDInfo);
    }
    public isEmpty(): boolean {
        return !this.OrderReference.some(() => true)
            && !this.MasterAgreementReference.some(() => true)
            && !this.MasterAgreementIDInfo.some(() => true)
            && !this.OrderIDInfo.some(() => true)
    }
}
// <!ELEMENT ModificationDetail (Description?, IdReference?, ParentID?, Extrinsic*)>
export class TidyModificationDetail
    extends TidyBase {
        Description = fragment(); IdReference = fragment(); ParentID = fragment();
        Extrinsic = fragment();

    protected _subSend(p: XMLBuilder) {
        p.import(this.Description); p.import(this.IdReference);
        p.import(this.ParentID);
        p.import(this.Extrinsic);
    }
    public isEmpty(): boolean {
        return !this.Description.some(() => true)
            && !this.IdReference.some(() => true)
            && !this.ParentID.some(() => true)
            && !this.Extrinsic.some(() => true)
    }
}

// <!ELEMENT InvoicePartner (Contact, IdReference*)>
export class TidyInvoicePartner
    extends TidyBase {
        Contact = fragment(); IdReference = fragment(); 

    protected _subSend(p: XMLBuilder) {
        p.import(this.Contact); p.import(this.IdReference);
    }
    public isEmpty(): boolean {
        return !this.Contact.some(() => true)
            && !this.IdReference.some(() => true)
    }
}
