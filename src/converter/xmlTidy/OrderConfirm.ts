import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { TidyBase } from "./TidyBase";

export class TidyConfirmationHeader extends TidyBase {
    DocumentReference = fragment(); Total = fragment(); Shipping = fragment();

    Tax = fragment(); Contact = fragment(); Hazard = fragment();
    Comments = fragment();
    IdReference = fragment(); Extrinsic = fragment();

    protected _subSend(p: XMLBuilder) {
        p.import(this.DocumentReference); p.import(this.Total); p.import(this.Shipping);
        p.import(this.
            Tax); p.import(this.Contact); p.import(this.Hazard);
        p.import(this.Comments); p.import(this.
            IdReference); p.import(this.Extrinsic);
    }
}

// <!ELEMENT ConfirmationItem
//     (UnitOfMeasure, Contact*, Hazard*, ConfirmationStatus+)>
export class TidyConfirmationItem
    extends TidyBase {
    UnitOfMeasure = fragment(); Contact = fragment(); Hazard = fragment();
    ConfirmationStatus = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.UnitOfMeasure); p.import(this.Contact); p.import(this.Hazard);
        p.import(this.ConfirmationStatus);
    }
}

export class TidyConfirmationRequest
    extends TidyBase {
    ConfirmationHeader = fragment(); OrderReference = fragment(); OrderStatusRequestReference = fragment();
    OrderStatusRequestIDInfo = fragment(); ConfirmationItem = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.ConfirmationHeader); p.import(this.OrderReference); p.import(this.OrderStatusRequestReference);
        p.import(this.OrderStatusRequestIDInfo); p.import(this.ConfirmationItem);
    }
}

export class TidyItemIn extends TidyBase {
    ItemID = fragment(); Path = fragment(); ItemDetail = fragment();
    SupplierID = fragment(); SupplierList = fragment();
    ShipTo = fragment();
    Shipping = fragment(); Tax = fragment(); SpendDetail = fragment();
    Distribution = fragment();
    Contact = fragment(); Comments = fragment();
    ScheduleLine = fragment(); BillTo = fragment(); Batch = fragment();
    Period = fragment();
    DateInfo = fragment(); Extrinsic = fragment();

    protected _subSend(p: XMLBuilder) {
        p.import(this.ItemID); p.import(this.Path); p.import(this.ItemDetail);
        p.import(this.SupplierID); p.import(this.SupplierList); p.import(this.
            ShipTo);
        p.import(this.Shipping); p.import(this.Tax); p.import(this.SpendDetail);
        p.import(this.Distribution); p.import(this.
            Contact); p.import(this.Comments);
        p.import(this.ScheduleLine); p.import(this.BillTo); p.import(this.Batch);
        p.import(this.Period); p.import(this.
            DateInfo); p.import(this.Extrinsic);
    }
}
export class TidyConfirmationStatus
    extends TidyBase {
    UnitOfMeasure = fragment(); ItemIn = fragment(); UnitPrice = fragment();
    Tax = fragment(); Shipping = fragment();
    SupplierBatchID = fragment();
    ScheduleLineReference = fragment(); ComponentConsumptionDetails = fragment(); Comments = fragment();
    Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.UnitOfMeasure); p.import(this.ItemIn); p.import(this.UnitPrice);
        p.import(this.Tax); p.import(this.Shipping); p.import(this.
            SupplierBatchID);
        p.import(this.ScheduleLineReference); p.import(this.ComponentConsumptionDetails); p.import(this.Comments);
        p.import(this.Extrinsic);
    }

    public dup():TidyConfirmationStatus {
        let t = new TidyConfirmationStatus();
        return this.copyTo(t);
    }
    public copyTo(t:TidyConfirmationStatus):TidyConfirmationStatus {
        t.UnitOfMeasure.import(this.UnitOfMeasure);
        t.ItemIn.import(this.ItemIn); t.UnitPrice.import(this.UnitPrice);
        t.Tax.import(this.Tax); t.Shipping.import(this.Shipping);
        t.SupplierBatchID.import(this.SupplierBatchID);
        t.ScheduleLineReference.import(this.ScheduleLineReference);
        t.ComponentConsumptionDetails.import(this.ComponentConsumptionDetails); t.Comments.import(this.Comments);
        t.Extrinsic.import(this.Extrinsic);
        for(let k in this._objAtt) {
            t.att(k,this._objAtt[k]);
        }
        return t;
    }
}

export class TidyItemDetail extends TidyBase {
    UnitPrice = fragment(); Description = fragment(); OverallLimit = fragment();
    ExpectedLimit = fragment(); UnitOfMeasure = fragment(); PriceBasisQuantity = fragment();
    Classification = fragment(); ManufacturerPartID = fragment(); ManufacturerName = fragment();
    URL = fragment(); LeadTime = fragment(); Dimension = fragment();
    ItemDetailIndustry = fragment(); AttachmentReference = fragment(); PlannedAcceptanceDays = fragment();
    Extrinsic = fragment();
    protected _subSend(p: XMLBuilder) {
        p.import(this.UnitPrice); p.import(this.Description); p.import(this.OverallLimit);
        p.import(this.ExpectedLimit); p.import(this.UnitOfMeasure); p.import(this.PriceBasisQuantity);
        p.import(this.Classification); p.import(this.ManufacturerPartID); p.import(this.ManufacturerName);
        p.import(this.URL); p.import(this.LeadTime); p.import(this.Dimension);
        p.import(this.ItemDetailIndustry); p.import(this.AttachmentReference); p.import(this.PlannedAcceptanceDays);
        p.import(this.Extrinsic);
    }
}