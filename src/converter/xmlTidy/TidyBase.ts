import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

/**
 * It's important to arrange tag order based on DTD
 * 
 */
export abstract class TidyBase {
    protected _objAtt = {};

    public att(key: string, val: string) {
        if (key) {
            this._objAtt[key] = val;
        }
        return this;
    }

    protected _sendAtt(pXml:XMLBuilder) {
        for(let k in this._objAtt) {
            pXml.att(k,this._objAtt[k]);
        }
    }

    protected abstract _subSend(pXml: XMLBuilder);

    public sendTo(pXml: XMLBuilder) {
        this._sendAtt(pXml);
        this._subSend(pXml);
    }
}