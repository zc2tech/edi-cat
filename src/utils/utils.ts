import { format, parse } from "date-fns";
import { d96a_message_infos } from "../schemas/edifact_d96a_meta";
import { time } from "console";
import { formatInTimeZone } from "date-fns-tz";
import { SegDef } from "./segDef";

export type Nullable<T> = T | null | undefined;

export default class Utils {
    public static sDefaultTMZ = '+00:00';
    static isNullOrUndefined(o: any): boolean {
        return o === null || o === undefined;
    }

    static yyMMddFormat(date: string): string {
        // 140407 -> 14-04-07
        if (!date || date.length !== 6) {
            return date;
        }
        return `${date.substring(0, 2)}-${date.substring(2, 4)}-${date.substring(4, 6)}`;
    }

    static HHmmFormat(time: string): string {
        // 0910 -> 09:10
        // 091035 -> 09:10:35
        if (!time || time.length < 4) {
            return time;
        }
        if (time.length === 4) {
            return `${time.substring(0, 2)}:${time.substring(2, 4)}`;
        }
        return `${time.substring(0, 2)}:${time.substring(2, 4)}:${time.substring(4, 6)}`;
    }

    static getD96A_SegInfo(docType: string): SegDef | null {
        return d96a_message_infos.find(m => m.type === docType) || null;
    }

    static toString(value: Nullable<any>): string | null | undefined {
        if (value === null || value === undefined) {
            return value;
        }

        return value.toString();
    }

    static formatString(value: string, ...args: string[]): string {
        return value.replace(/{(\d+)}/g, (match, index) => {
            return args[index] || "";
        });
    }

    static parseToDateYMD(dateStr: string): Date {
        if (dateStr.length !== 8) {
            // throw new Error('Invalid Date String. It should be in YYCCMMDD format.');
            return undefined;
        }

        const date = parse(dateStr, 'yyyyMMdd', new Date());
        if (!Utils.isValidDate(date)) {
            return undefined;
        }

        // Set to 12:00 UTC
        date.setUTCHours(12, 0, 0, 0);
        return date;
    }

    /**
     * "yyyyMMddHHmmssXXXX"
     * @param dateStr 
     * @returns 
     */
    static parseToDateSTD(dateStr: string): Date {
        if (!dateStr) {
            return undefined;
        }
        if (dateStr.trim().length < 15) {
            // throw new Error('Invalid Date String. It should be in YYCCMMDD format.');
            return undefined;
        }
        Utils.sDefaultTMZ = dateStr.trim().substring(14).trim(); // like +11:00
        const date = parse(dateStr.trim(), 'yyyyMMddHHmmssXXXX', new Date());
        if (isNaN(date.getTime())) {
            return undefined
        } else {
            return date;
        }
    }

    /**
     * "yyyy-MM-dd'T'HH:mm:ssxxx" to Date object
     * @param dateStr 
     * @returns 
     */
    static parseToDateSTD2(dateStr: string): Date {
        if (!dateStr) {
            return undefined;
        }
        if (dateStr.trim().length < 19) {
            // throw new Error('Invalid Date String. It should be in "yyyy-MM-dd'T'HH:mm:ssxxx" format.');
            return undefined;
        }

        // we need to consider a special format like "2023-04-28T17:55+08:00" which is "Hhmm" not "HHmmss"
        let iPosT = dateStr.indexOf('T');
        if (iPosT) {
            let sSecPart = dateStr.substring(iPosT + 6);
            if (!sSecPart.startsWith(':')) {
                // if we cannot find second part, it's obviouse the timezone part
                // we concatenate them to a correct format
                dateStr = dateStr.substring(0, iPosT + 6) + ':00' + sSecPart;
            }
        }

        Utils.sDefaultTMZ = dateStr.trim().substring(19).trim(); // like +11:00
        const date = parse(dateStr.trim(), "yyyy-MM-dd'T'HH:mm:ssxxx", new Date());
        if (isNaN(date.getTime())) {
            return undefined
        } else {
            return date;
        }
    }

    /**
     * get String like: 20170106060000ED
     * Since the Timezone part still need MAPS object,
     * we use a not very efficient way
     */
    static getFullDateStr(d?: Date | undefined): string {
        let d2: Date = d ?? new Date();
        let sFormat = 'yyyyMMddHHmmss';
        let sTimePart: string;
        if (Utils.sDefaultTMZ) {
            sTimePart = formatInTimeZone(d2, Utils.sDefaultTMZ, sFormat);
        } else {
            sTimePart = format(d2, sFormat);
        }
        return sTimePart ? sTimePart + this.getTMZ2(d) : '';
    }
    static getYYMMDD(d?: Date | undefined): string {
        let d2: Date = d ?? new Date();
        let sFormat = 'yyMMdd';
        if (Utils.sDefaultTMZ) {
            return formatInTimeZone(d2, Utils.sDefaultTMZ, sFormat);
        } else {
            return format(d2, sFormat);
        }
    }
    static getYYYYMMDD(d?: Date | undefined): string {
        let d2: Date = d ?? new Date();
        let sFormat = 'yyyyMMdd';
        if (Utils.sDefaultTMZ) {
            return formatInTimeZone(d2, Utils.sDefaultTMZ, sFormat);
        } else {
            return format(d2, sFormat);
        }
    }

    static getHHMM(d?: Date | undefined): string {
        let d2: Date = d ?? new Date();
        let sFormat = 'HHmm';
        if (Utils.sDefaultTMZ) {
            return formatInTimeZone(d2, Utils.sDefaultTMZ, sFormat);
        } else {
            return format(d2, sFormat);
        }

    }

    static getHHMMSS(d?: Date | undefined): string {
        let d2: Date = d ?? new Date();
        let sFormat = 'HHmmss';
        if (Utils.sDefaultTMZ) {
            return formatInTimeZone(d2, Utils.sDefaultTMZ, sFormat);
        } else {
            return format(d2, sFormat);
        }
    }

    /**
     * 
     * @param d 
     * @returns like '-06:00' , '+05:00'
     */
    static getTMZ(d?: Date | undefined): string {
        let d2: Date = d ?? new Date();
        let sFormat = 'xxx';
        if (Utils.sDefaultTMZ) {
            return Utils.sDefaultTMZ;
        } else {
            return format(d2, sFormat);
        }
    }

    /**
     * like 12, ES , HT, GM
     * @param d 
     * @returns 
     */
    static getTMZ2(d?: Date | undefined): string {
        return UTILS_MAP.mapTimeZone2[Utils.getTMZ()];
    }

    /**
     * Usually don't need check
     * It will not complete with 'Z' timezone and 12:00:00 time
     * 
     * If you have above requirement, use dateStrFromDTM2 function
     * 
     * @param dateStr 
     * @returns 
     */
    static dateStrFromCCYYMMDD(dateStr: string): string {
        let date: Date = Utils.parseToDateYMD(dateStr);
        if (date) {
            return format(date, "yyyy-MM-dd'T'HH:mm:ssxxx");
        }
        return '';
    }

    /**
     * Try to fix format like '20160130' or '2016-01-30' to "yyyy-MM-dd'T'HH:mm:ssxxx"
     * 
     */
    static tryFixToSTD(dateStr: string): string {
        if (!dateStr || !(dateStr.length == 8 || dateStr.length == 10)) {
            return dateStr;
        }
        let sCCYYMMDD = dateStr.replace('-', '').replace('/', '');
        return Utils.dateStrFromCCYYMMDD(sCCYYMMDD);
    }

    /**
     * From: yyyy-MM-dd'T'HH:mm:ssxxx
     * To: CCYYMMDDHHMMSSZZZ	304
     * The timezone part is stiff as M01 P09 ..., no 'AD','GM' 'ET' etc.
     * @param dateStr 
     * @returns 
     */
    static dateStr304FromSTD2(dateStr: string): string {
        let date: Date = Utils.parseToDateSTD2(dateStr);
        if (Utils.isValidDate(date)) {
            // timezone: x: -08, +0530, +00 
            return format(date, "yyyyMMddHHmmssx").replace('-', 'M').replace('+', 'P');
            //return formatInTimeZone(date, 'Europe/Paris', 'yyyy-MM-dd HH:mm:ss zzz')
        }
        return '';
    }

    /**
     * From: yyyy-MM-dd'T'HH:mm:ssxxx
     * To: CCYYMMDDHHMMSSZZZ	304
     * recommend to use as it's very flexible for TimeZone
     * @param fromStr DateString from XML, so pretty formal
     * @returns 
     */
    static dateStr304TZ(fromStr: string, toTZ?: string): string {
        let date: Date = Utils.parseToDateSTD2(fromStr);
        let strDate: string = '';
        if (Utils.isValidDate(date)) {
            // timezone: GM, or +00:00 or -11:00 etc.
            let sFormatedDate = '';
            let sToFormat = 'yyyyMMddHHmmssx';
            if (!toTZ) {
                // sDefaultTMZ is set by parseToDateSTD2
                sFormatedDate = formatInTimeZone(date, Utils.sDefaultTMZ, sToFormat);
            } else if (toTZ == 'GM') {
                sFormatedDate = formatInTimeZone(date, 'Z', sToFormat);
            } else {
                sFormatedDate = formatInTimeZone(date, toTZ, sToFormat);
            }

            if (sFormatedDate && sFormatedDate.length > 14) {
                let sTZ = sFormatedDate.substring(14);
                let sMappedTZ = UTILS_MAP.mapTimeZone3[sTZ];
                return sFormatedDate.substring(0, 14) + sMappedTZ ?? 'GM';
            } else {
                return '';
            }

        } else {
            return '';
        }
    }

    /**
     * From: yyyy-MM-dd'T'HH:mm:ssxxx
     * To: CCYYMMDD	102
     * @param fromStr DateString from XML, so pretty formal
     * @returns 
     */
    static dateStr102(fromStr: string, toTZ?: string): string {
        if (fromStr.length == 8 && fromStr.indexOf('-') < 0) {
            // consider it's already CCYYMMDD format
            return fromStr;
        }
        let date: Date = Utils.parseToDateSTD2(fromStr);
        let strDate: string = '';
        if (Utils.isValidDate(date)) {
            // timezone: GM, or +00:00 or -11:00 etc.
            let sFormatedDate = '';
            return this.getYYYYMMDD(date);
        } else {
            return '';
        }
    }

    static isValidDate(date: Date): boolean {
        if (date && date.toString() != 'Invalid Date') {
            return true;
        } else {
            return false;
        }
    }
    /**
     * Date String from sample like: DTM*004*20180810*0930*CT~
     * It will use local date to complete info that is missing.
     * to Format: "yyyy-MM-dd'T'HH:mm:ssxxx"
     * 
     * @param YMDStr 
     * @param toTimezone If not specified, then use Utils.sDefaultTMZ , if 'local' then use Local Time Zone
     * @returns 
     */
    static dateStrFromDTM(YMDStr: string, timeStr: string, timezone: string, toTimezone?: string): string {
        if (YMDStr.length != 8) {
            return undefined;
        }

        // || timeStr.length < 4 || !UTILS_MAP.mapTimeZone[timezone]
        let nowDate = new Date();
        let tmpTimeStr: string = timeStr;
        let tmpTimezone: String;
        let date: Date;
        if (!timeStr) {
            tmpTimeStr = format(nowDate, "HHmmssXXXX");
            date = Utils.parseToDateSTD(YMDStr + tmpTimeStr);
        } else {

            if (!UTILS_MAP.mapTimeZone[timezone]) {
                return undefined;
            }

            let tmrHMMSS: string = timeStr;
            if (timeStr.length > 6) {
                tmrHMMSS = timeStr.substring(0, 6);
            } else if (timeStr.length == 4) {
                tmrHMMSS = timeStr + '00';
            } else if (timeStr.length == 5) {
                tmrHMMSS = timeStr + '0';
            }
            date = Utils.parseToDateSTD(YMDStr + tmrHMMSS + UTILS_MAP.mapTimeZone[timezone]);
        }

        if (Utils.isValidDate(date)) {
            if (toTimezone) {
                if (toTimezone == 'local') {
                    return format(date, "yyyy-MM-dd'T'HH:mm:ssxxx");
                } else {
                    return formatInTimeZone(date, toTimezone, "yyyy-MM-dd'T'HH:mm:ssxxx");
                }
            }
            return formatInTimeZone(date, Utils.sDefaultTMZ, "yyyy-MM-dd'T'HH:mm:ssxxx");
            //
        } else {
            return undefined;
        }
    }


    /**
     * [20180322] [IG-3125] MB: added info: Date/Time Handling:
     * Default the time to noon (12:00) and timezone to UTC (+00:00) on all dates 
     * 
     * to Format: "yyyy-MM-dd'T'HH:mm:ssxxx" 
     *
     * @param dateTime 
     * @param qualifier 
     * @returns
     */
    static dateStrFromDTM2(dateTime: string, qualifier?: string): string {
        let ymd: string;
        let tmr: string;
        let tmzone: string;
        if (!dateTime) {
            return '';
        }
        switch (qualifier) {
            case '102': // CCYYMMDD	102
                if (dateTime.length != 8) {
                    return '';
                }
                ymd = dateTime;
                tmr = '120000';
                tmzone = 'Z';
                break;
            case '203': // CCYYMMDDHHMM	203
                if (dateTime.length != 12) {
                    return '';
                }
                ymd = dateTime.substring(0, 8);
                tmr = dateTime.substring(8, 12) + '00';
                tmzone = 'Z';
                break;
            case '204': // CCYYMMDDHHMMSS	204
                if (dateTime.length != 14) {
                    return '';
                }
                ymd = dateTime.substring(0, 8);
                tmr = dateTime.substring(8, 14);
                tmzone = 'Z';
                break;
            case '303': // CCYYMMDDHHMMZZZ	303
                if (dateTime.length < 13) {
                    return '';
                }
                ymd = dateTime.substring(0, 8);
                tmr = dateTime.substring(8, 12) + '00';
                tmzone = UTILS_MAP.mapTimeZone[dateTime.substring(12)];
                break;
            case '304': // CCYYMMDDHHMMSSZZZ	304
                if (dateTime.length < 15) {
                    return '';
                }
                ymd = dateTime.substring(0, 8);
                tmr = dateTime.substring(8, 14);
                tmzone = UTILS_MAP.mapTimeZone[dateTime.substring(14)];
                break;
            case '718':
                if (dateTime.length < 15) {
                    return '';
                }
                // not implemented, you need to invoke
                return '';
                break;
            default:
                // automatically judge
                let iLen = dateTime.length;
                if (iLen == 8) {
                    return Utils.dateStrFromDTM2(dateTime, '102');
                } else if (dateTime.length >= 16) {
                    return Utils.dateStrFromDTM2(dateTime, '304');
                }

        } // end switch
        let theDate = parse(ymd + tmr + tmzone, 'yyyyMMddHHmmssXXXX', new Date());
        if (Utils.isValidDate(theDate)) {
            if (['303', '304'].includes(qualifier)) {
                // keep the timezone in original source
                return formatInTimeZone(theDate, tmzone, "yyyy-MM-dd'T'HH:mm:ssxxx");
            } else {
                return formatInTimeZone(theDate, 'Z', "yyyy-MM-dd'T'HH:mm:ssxxx");
            }
        }
        return '';
    }

    /**
     * [CCYYMMDDHHMMSS[timezone]] => xml date format
     * 
     * @param dateTimeWithTZ 
     * @param bFormatUseLocalTZ if true, use local timezone to 'format' else use timezone in the param dateTimeWithTZ, 
     *          the time itself will not change
     * @returns 
     */
    static dateStrFromREFDTM(dateTimeWithTZ: string, bFormatUseLocalTZ: boolean = true): string {
        if (dateTimeWithTZ.length < 15) {
            return '';
        }
        let sTZ = dateTimeWithTZ.substring(14);
        if (!UTILS_MAP.mapTimeZone[sTZ]) {
            sTZ = 'Z';
        }
        let sNewDateTime = dateTimeWithTZ.substring(0, 14) + UTILS_MAP.mapTimeZone[sTZ];
        const dDate = parse(sNewDateTime, 'yyyyMMddHHmmssXXXX', new Date());
        if (Utils.isValidDate(dDate)) {
            if (bFormatUseLocalTZ) {
                return format(dDate, "yyyy-MM-dd'T'HH:mm:ssxxx");
            } else {
                return formatInTimeZone(dDate, UTILS_MAP.mapTimeZone[sTZ], "yyyy-MM-dd'T'HH:mm:ssxxx");
            }
        } else {
            return '';
        }
    }

    /**
     * Only for qualifier == 718
     * @param dateTime 
     * @param qualifier 
     */
    static dateStrFromDTM718(dateTime: string, qualifier: string): { start: string, end: string } {
        let nullResult = { start: '', end: '' };
        if (qualifier != '718') {
            return nullResult;
        }
        let dashPos = dateTime.indexOf('-');
        if (dashPos != 8) {
            return nullResult;
        }
        let strStart = dateTime.substring(0, 8);
        let strEnd = dateTime.substring(9);
        if (strStart.length != 8 || strEnd.length != 8) {
            return nullResult;
        }
        return {
            start: Utils.dateStrFromDTM2(strStart, '102'),
            end: Utils.dateStrFromDTM2(strEnd, '102'),
        }

    }
}

export class StringBuilder {
    private buffer: string[];

    constructor() {
        this.buffer = [];
    }

    public append(value: string): StringBuilder {
        this.buffer.push(value);
        return this;
    }

    public toString(): string {
        return this.buffer.join("");
    }
}

export class UTILS_MAP {

    // Pattern: XXXX    | -0800, +0530, Z, +123456   
    static mapTimeZone: Object = {
        "Z": "Z", // keep it as is
        "01": "+0100",
        "P01": "+0100",
        "02": "+0200",
        "P2": "+0200",
        "03": "+0300",
        "P03": "+0300",
        "04": "+0400",
        "P04": "+0400",
        "05": "+0500",
        "P05": "+0500",
        "IST": "+0530",
        "06": "+0600",
        "P06": "+0600",
        "07": "+0700",
        "P07": "+0700",
        "08": "+0800",
        "P08": "+0800",
        "09": "+0900",
        "P09": "+0900",
        "10": "+1000",
        "P10": "+1000",
        "11": "+1100",
        "P11": "+1100",
        "12": "+1200",
        "P12": "+1200",
        "13": "-1200",
        "M12": "-1200",
        "14": "-1100",
        "M11": "-1100",
        "15": "-1000",
        "M10": "-1000",
        "16": "-0900",
        "M09": "-0900",
        "17": "-0800",
        "M08": "-0800",
        "18": "-0700",
        "M07": "-0700",
        "19": "-0600",
        "M06": "-0600",
        "20": "-0500",
        "M05": "-0500",
        "21": "-0400",
        "M04": "-0400",
        "22": "-0300",
        "M03": "-0300",
        "23": "-0200",
        "M02": "-0200",
        "24": "-0100",
        "M01": "-0100",
        "AD": "-0800",
        "AS": "-0900",
        "AT": "-0900", // Maybe it's dynamic, difficult to program ...
        "CD": "-0500",
        "CS": "-0600",
        "CT": "-0600",
        "ED": "-0400",
        "ES": "-0500",
        "ET": "-0500",
        "GM": "Z",
        "HD": "-0900",
        "HS": "-1000",
        "MD": "-0600",
        "MS": "-0700",
        "MT": "-0700",
        "ND": "-0230",
        "NS": "-0330",
        "NT": "-0330",
        "PD": "-0700",
        "PS": "-0800",
        "PT": "-0800",
        "TD": "-0300",
        "TS": "-0400",
        "TT": "-0400",
        "UT": "Z",
    };

    static mapTimeZone2: Object = {
        "+01:00": "01",
        "+02:00": "02",
        "+03:00": "03",
        "+04:00": "04",
        "+05:00": "05",
        "+05:30": "05", // IST, 0530 all not work, so I take '05'
        "+06:00": "06",
        "+07:00": "07",
        "+08:00": "08",
        "+09:00": "09",
        "+10:00": "10",
        "+11:00": "11",
        "+12:00": "12",
        "-12:00": "13",
        "-11:00": "14",
        //"-10:00": "15",
        "-09:00": "16",
        //"-08:00": "17",
        //"-07:00": "18",
        //"-06:00": "19",
        //"-05:00": "20",
        //"-04:00": "21",
        //"-03:00": "22",
        "-02:00": "23",
        "-01:00": "24",
        "-08:00": "AD",
        // "-09:00": "AS",
        // "-09:00": "AT",
        // "-05:00": "CD",
        // "-06:00": "CS",
        // "-06:00": "CT",
        // "-04:00": "ED",
        //"-05:00": "ES",
        "-05:00": "ET",
        "+00:00": "GM",
        "-10:00": "HD",
        //"-10:00": "HS",
        //"-10:00": "HT",
        "-06:00": "MD",
        //"-07:00": "MS",
        //"-07:00": "MT",
        "-02:30": "ND",
        "-03:30": "NS",
        //"-03:30": "NT",
        "-07:00": "PD",
        //"-08:00": "PS",
        //"-08:00": "PT",
        "-03:00": "TD",
        //"-04:00": "TS",
        "-04:00": "TT",
        "-00:00": "UT",
    }

    static mapTimeZone3: Object = {
        "+01": "P01",
        "+02": "P02",
        "+03": "P03",
        "+04": "P04",
        "+05": "P05",
        "+0530": "P05", // although not accurate, should work
        "+06": "P06",
        "+07": "P07",
        "+08": "P08",
        "+09": "P09",
        "+10": "P10",
        "+11": "P11",
        "+12": "P12",
        "-12": "M12",
        "-11": "M11",
        "-10": "M10",
        "-09": "M09",
        "-08": "M08",
        "-07": "M07",
        "-06": "M06",
        //"-05": "M05",
        "-05": "ET",
        "-04": "M04",
        "-03": "M03",
        "-02": "M02",
        "-01": "M01",
        "+00": "GM",
        "-02:30": "ND",
        "-03:30": "NS",
        "-00": "UT",
    }
    static mapN101: Object = {
        "ST": "locationTo",
        "SU": "supplierCorporate"
    };
    static mapN103: Object = {
        "1": "DUNS",
        "2": "SCAC",
        "4": "IATA",
        "9": "DUNS+4"
    };

}