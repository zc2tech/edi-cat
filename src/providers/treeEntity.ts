
import { EdiElement, EdiSegment, EdiType } from "../new_parser/entities";

export enum TreeItemType {
    Version,
    Group,
    Segment,
    // DataElement,
    // CompositeElement,
    // ElementAttribute
}
  
export class TreeItemElement {
    key: string; // ROOT, or group name liek SG2_SG26, or Segment Name like ROOT_ISA , SG2_SG26_PO1
    type: TreeItemType;
    rootVersion?: string; // each group must have this to identify a Group in world
    group?: EdiGroup;
    segment?: EdiSegment;
    desc?:string;
    codeSample?:string;
  }
  
export class EdiGroup {
    key: string;
  
    constructor(key: string) {
      this.key = key;
    }
  }
  
 export class ElementAttribute {
    key: string;
    value: string;
  
    constructor(key: string, value: string) {
      this.key = key;
      this.value = value;
    }
  }