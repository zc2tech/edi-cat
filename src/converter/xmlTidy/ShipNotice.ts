import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { TidyBase } from "./TidyBase";

export class TidyShipNoticeHeader extends TidyBase {
    ServiceLevel = fragment(); DocumentReference = fragment(); Contact = fragment();
    LegalEntity = fragment(); OrganizationalUnit = fragment();
    Hazard = fragment();
    Comments = fragment(); TermsOfDelivery = fragment(); TermsOfTransport = fragment();
    Packaging = fragment(); Extrinsic = fragment(); IdReference = fragment();
    ReferenceDocumentInfo = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.ServiceLevel); p.import(this.DocumentReference); p.import(this.Contact);
        p.import(this.LegalEntity); p.import(this.OrganizationalUnit); p.import(this.
            Hazard);
        p.import(this.Comments); p.import(this.TermsOfDelivery); p.import(this.TermsOfTransport);
        p.import(this.Packaging); p.import(this.Extrinsic); p.import(this.IdReference);
        p.import(this.ReferenceDocumentInfo);
    }
}

export class TidyShipControl extends TidyBase {
    CarrierIdentifier = fragment(); ShipmentIdentifier = fragment();
    PackageIdentification = fragment();
    Route = fragment(); TransportInformation = fragment(); Contact = fragment();
    Comments = fragment();
    Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.CarrierIdentifier); p.import(this.ShipmentIdentifier); p.import(this.
            PackageIdentification);
        p.import(this.Route); p.import(this.TransportInformation); p.import(this.Contact);
        p.import(this.Comments); p.import(this.
            Extrinsic);
    }
}

/**
 * HL O:Order 
 */
export class TidyShipNoticePortion
    extends TidyBase {
    OrderReference = fragment(); MasterAgreementReference = fragment(); MasterAgreementIDInfo = fragment();

    Contact = fragment(); Comments = fragment(); Extrinsic = fragment();
    ShipNoticeItem = fragment(); ReferenceDocumentInfo = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.OrderReference); p.import(this.MasterAgreementReference); p.import(this.MasterAgreementIDInfo);
        p.import(this.
            Contact); p.import(this.Comments); p.import(this.Extrinsic);
        p.import(this.ShipNoticeItem); p.import(this.ReferenceDocumentInfo);
    }
}

/**
 * HL I:Item 
 */
export class TidyShipNoticeItem extends TidyBase {
    parentID: string;
    tPacking: TidyPackaging = new TidyPackaging(); // to save some data when passing HL I:Item
    ItemID = fragment(); ShipNoticeItemDetail = fragment(); UnitOfMeasure = fragment();
    Packaging = fragment(); Hazard = fragment(); Batch = fragment();
    SupplierBatchID = fragment();
    AssetInfo = fragment(); TermsOfDelivery = fragment();
    OrderedQuantity = fragment(); ShipNoticeItemIndustry = fragment(); ComponentConsumptionDetails = fragment();
    ReferenceDocumentInfo = fragment(); Comments = fragment(); Extrinsic = fragment();

    protected _subSend(p: XMLBuilder) {
        p.import(this.ItemID); p.import(this.ShipNoticeItemDetail); p.import(this.UnitOfMeasure);
        p.import(this.Packaging); p.import(this.Hazard); p.import(this.Batch);
        p.import(this.SupplierBatchID); p.import(this.
            AssetInfo); p.import(this.TermsOfDelivery);
        p.import(this.OrderedQuantity); p.import(this.ShipNoticeItemIndustry); p.import(this.ComponentConsumptionDetails);
        p.import(this.ReferenceDocumentInfo); p.import(this.Comments); p.import(this.Extrinsic);
    }
}

/**
 * HL F:Component
 */
export class TidyComponentConsumptionDetails extends TidyBase {
    parentID: string;
    Product = fragment(); UnitOfMeasure = fragment(); BuyerBatchID = fragment();
    SupplierBatchID = fragment(); ReferenceDocumentInfo = fragment(); AssetInfo = fragment();
    Dimension = fragment(); Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.Product); p.import(this.UnitOfMeasure); p.import(this.BuyerBatchID);
        p.import(this.SupplierBatchID); p.import(this.ReferenceDocumentInfo); p.import(this.AssetInfo);
        p.import(this.Dimension); p.import(this.Extrinsic);
    }
}

/**
 * HL T:Shipping Tare , P:Pack
 * depending on ShipNoticeItem/Packaging/PackagingLevelCode
 */
export class TidyPackaging extends TidyBase {
    parentID: string;
    PackagingCode = fragment(); Dimension = fragment();
    Description = fragment();
    PackagingLevelCode = fragment(); PackageTypeCodeIdentifierCode = fragment();
    ShippingContainerSerialCode = fragment();
    ShippingContainerSerialCodeReference = fragment();
    PackageID = fragment();
    ShippingMark = fragment(); OrderedQuantity = fragment(); DispatchQuantity = fragment();

    FreeGoodsQuantity = fragment(); QuantityVarianceNote = fragment(); BestBeforeDate = fragment();
    AssetInfo = fragment(); PackagingIndustry = fragment(); StoreCode = fragment();
    Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.PackagingCode); p.import(this.Dimension);
        p.import(this.Description); p.import(this.
            PackagingLevelCode); p.import(this.PackageTypeCodeIdentifierCode);
        p.import(this.ShippingContainerSerialCode); p.import(this.
            ShippingContainerSerialCodeReference); p.import(this.
                PackageID);
        p.import(this.ShippingMark); p.import(this.OrderedQuantity); p.import(this.DispatchQuantity);
        p.import(this.
            FreeGoodsQuantity); p.import(this.QuantityVarianceNote); p.import(this.BestBeforeDate);
        p.import(this.AssetInfo); p.import(this.PackagingIndustry); p.import(this.StoreCode);
        p.import(this.Extrinsic);
    }
}

export class TidyTermsOfDelivery extends TidyBase {
    TermsOfDeliveryCode = fragment(); ShippingPaymentMethod = fragment(); TransportTerms = fragment();
    Address = fragment(); Comments = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.TermsOfDeliveryCode); p.import(this.ShippingPaymentMethod); p.import(this.TransportTerms);
        p.import(this.Address); p.import(this.Comments);
    }
}

export class TidyShipNoticeItemDetail extends TidyBase {
    UnitPrice = fragment(); Description = fragment(); UnitOfMeasure = fragment();
    PriceBasisQuantity = fragment(); Classification = fragment(); ManufacturerPartID = fragment();

    ManufacturerName = fragment(); Dimension = fragment(); ItemDetailIndustry = fragment();
    Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.UnitPrice); p.import(this.Description); p.import(this.UnitOfMeasure);
        p.import(this.PriceBasisQuantity); p.import(this.Classification); p.import(this.ManufacturerPartID);
        p.import(this.
            ManufacturerName); p.import(this.Dimension); p.import(this.ItemDetailIndustry);
        p.import(this.Extrinsic);
    }
}

export class TidyTermsOfTransport extends TidyBase {
    SealID = fragment(); SealingPartyCode = fragment(); EquipmentIdentificationCode = fragment();
    TransportTerms = fragment(); Dimension = fragment(); Extrinsic = fragment();

    protected _subSend(p: XMLBuilder) {
        p.import(this.SealID); p.import(this.SealingPartyCode); p.import(this.EquipmentIdentificationCode);
        p.import(this.TransportTerms); p.import(this.Dimension); p.import(this.Extrinsic);
    }
}

export class TidyShipNoticeItemRetail extends TidyBase {
    BestBeforeDate = fragment(); ExpiryDate = fragment(); FreeGoodsQuantity = fragment();
    PromotionDealID = fragment(); PromotionVariantID = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.BestBeforeDate); p.import(this.ExpiryDate); p.import(this.FreeGoodsQuantity);
        p.import(this.PromotionDealID); p.import(this.PromotionVariantID);
    }
}
