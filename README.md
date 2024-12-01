# EDI-Cat README

AN EDIFACT/X12 file viewer, formatter, converter.

## Install
It's a VSCode Extension, search this extension and install it.
![Install from Marketplace](./docs/images/install_from_marketplace.jpg "Install from Marketplace")

## Features


##### Convert from cXML to X12 or EDIFACT D96A
1) Open a cXML (OrderConfirmation, ASN, Invoice)
2) Make sure there is no xml syntax and DTD validation error.
  (Recommend you to install other extension to check XML)
3) Use menu "View->Command Palette", then find command "EDI Cat: Convert to ..."
4) Then use menu cXML_to_X12 or cXML_to_EDIFACT_D96A
![Converter](./docs/images/convert.gif "Converter")

##### Parse Document
Make sure document version correctly recognized and
there is no validation error.
Use menu "view->Command Palette..." and search for "Parse Document".

![Parse Document 01](./docs/images/parse_document01.jpg "Parse Document 01")

after executing this command, the structure of the file displays. 
You still can hover to key element to see details.

![Parse Document 02](./docs/images/parse_document02.jpg "Parse Document 02")

##### Syntax Check
Extention can detect file version automatically and display it on right-bottom of window.
Usually the color is normal white, but if it's yellow, it means user need to click there to help it decide the version.

![Code List display](./docs/images/version_picker.jpg "Code List display")

It can do Control  Number check

![Control Number check](./docs/images/interchange_check.jpg "Control Number check")

Or Syntax Check, below is example when NTE segment is deliberately put before BIG segment, which caused an error.

![Syntax Check](./docs/images/syntax_check.jpg "Syntax Check")

##### Format Document
For .xml or .x12 .edi .edifact File, right click on the content,
There is a context menu "Format Document" to help you format this document.
![Format Document](./docs/images/format.jpg "Format Document")

##### Hover for detail
Mouse hover to some fields like Currency, Country, UoM, Timezone, it will show you the detail meaning of the value.

![Hover to show detail](./docs/images/hover01.jpg "Hover to show detail")

Some fields need a list to explore, you can click the the link for details

![Link in Hover menu](./docs/images/hover02.jpg "Link in Hover menu")

##### Codelists
Use menu "view->Command Palette..." and search for "Open Code List",

![Menu for Code List](./docs/images/codelist01.jpg "Menu for Code List")

after executing this command, you have option to select the code list you want to view

![List Option](./docs/images/codelist02.jpg "List Option")

Code List display:

![Code List display](./docs/images/codelist03.jpg "Code List display")

##### Codelens
Make sure document version correctly selected and there is no syntax error.
Use menu "view->Command Palette..." and search for "Toggle Codelens".

![Toggle Codelens 01](./docs/images/toggle01.jpg "Toggle Codelens 01")

after executing this command, the group of every segment is shown in Codelens.
No group means it's under ROOT group.

![Toggle Codelens 02](./docs/images/toggle02.jpg "Toggle Codelens 02")

If you feel it's disturbing, re-run this command to disable Codelens.

## Requirements

Make sure the file extension is .x12, .edi or .edifact.
For .txt, it will detect the file type and apply syntax color.

## Known Issues

1) Delimiter like '~', '*', '+', '>' is hard-coded to recognize x12 and EDIFACT structure.
Please make sure you are using delimiters shown in screenshots of this README.

2) The purpose of this product is to reduce workload on creating Supplier side EDI documents. So it may lack of functions for Buyer to use.

## Future
Add more formats and more conversion functions

---

**Enjoy!**
