# Change Log

##### 2.0.1
- INVRPTC <=> cXML ConsignmentWithdrawal
- DELFORP => cXML Forecast
- ORDERS/ORDCHG <=> cXML PurchaseOrder/Change
- DESADV <=> cXML ShipNotice
- INVOIC <=> cXML Invoice
- 850/860 <=> cXML PurchaseOrder
- 856 <=> cXML ShipNotice
- 855 <=> cXML OrderConfirmation
- 810 <=> cXML Invoice
- 846 => cXML ConsignmentWithdrawal
- 861 => cXML GoodsReceipt
- cXML GoodsReceipt => RECADV

##### 1.0.9
- Add support for X12 940 (Warehouse Shipping Order) parser and info class
- Add support for X12 945 (Warehouse Shipping Advice) parser and info class
- Fix LOC segment parsing issues for ORDERS, ORDCHG, and DELFOR parsers
- Fix DTM segment issues for parseing 830 and 830ProductActivity
- Add TD5, FST, SHP segments/groups for parser830Order
- Add LOC segment support for parserDELFOROrder
- Fix PlannedAcceptanceDays conversion (904->804) for OrderConfirmation
- Reduce release package size by optimizing bundled assets

##### 1.0.8
- add cXML OrderConfirmation-> X12 865 conversion, you need to change edi-cat's extension config to enable it
- add cXML ProductReplenishmentMessage -> EDIFACT INVRPT conversion
- add cXML TransportConfirmation -> EDIFACT IFTSTA conversion
##### 1.0.7
- add SG8_GIN for DELFORP
##### 1.0.6
- set correct from/to(Interchange ID) for ISA of 810/855/856
- add DAP option for 'Transportation Terms Code' 850_860
##### 1.0.5
- EDIFACT, Fix issue on converting Invoice for VATID, to 'RFF+VA'
##### 1.0.4
- Remove char '-' in BAK04 for 855
- 855, Discard AMT*TT segment if there is no corresponding value in cXML
##### 1.0.3
- Remove TreeAssistantExplorer related code
- Invoice conversion for EDIFACT, X12 to cXML, honor cXML DTD
- defaut value for 'enableCodelens' set to 'false'
- cXML -> EDIFACT, even 'paymentMethod' mapping not found, the 'PAI' segment of EDIFACT will be set with original value in cXML
##### 1.0.2
- EDIFACT, escape character for COM segment
- X12 810, IT1 segment value changed to positive even for Credit Memo
- X12 810, fixed N2, N3 segment's components allocation issue