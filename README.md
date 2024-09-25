# EDI-Cat README

AN EDIFACT/X12 file viewer, formatter.

## Install
It can be installed for as an extension for vscode
under Windows or MacOS

make sure VS code version >= 1.83

![VSC Version](./docs/images/vsc_version.jpg "VSC Version")

then go to extensions menu, use "...->Install from VSIX" menu, then select the downloaded VSIX to install
![Install from VSIX](./docs/images/install_vsix.jpg "Install from VSIX")

## Features

##### Assistant Explorer. 
When you open .x12/.edi/.edifact file, it will give you assistant correspondingly. Then you can use "+" to add sample code to you file.

![Assistant Explorer](./docs/images/assistant.jpg "Assistant Explorer")

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

##### Syntax Check
Before letting extension to do Syntax Check, you need to specify document version before that, because it cannot determine some version like 850, 856 automatically.
The menu is on the bottom-left, a yellow label.

![Code List display](./docs/images/version_picker.jpg "Code List display")

It can do Control  Number check

![Control Number check](./docs/images/interchange_check.jpg "Control Number check")

Or Syntax Check, below is example when QTY segment is deliberately put under DTM segment, which caused an error.

![Syntax Check](./docs/images/syntax_check.jpg "Syntax Check")

##### Codelens
Make sure document version correctly selected and there is no syntax error.
Use menu "view->Command Palette..." and search for "Toggle Codelens"

![Toggle Codelens 01](./docs/images/toggle01.jpg "Toggle Codelens 01")

after executing this command, the group of every segment is shown in Codelens.
No group means it's under ROOT group.

![Toggle Codelens 02](./docs/images/toggle02.jpg "Toggle Codelens 02")

##### Parse Document
Make sure document version correctly selected and there is no syntax error.
Use menu "view->Command Palette..." and search for "Parse Document".

![Parse Document 01](./docs/images/parse_document01.jpg "Parse Document 01")

after executing this command, the structure of the file displays. 
You can hover to see details, but please don't edit in this window.

![Parse Document 02](./docs/images/parse_document02.jpg "Parse Document 02")

## Requirements

Make sure the file extension is x12,edi or edifact

## Known Issues

Need your feedback. Welcome Bug Report and Enhancement Request.

## Future
Trying to add functionality to convert to cXML or vice versa

## Release Notes

It's Alpha version.

### 1.0.0

---

**Enjoy!**
