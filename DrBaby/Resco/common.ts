module Resco {
    export interface INotifyPropertyChanged {
        propertyChanged: Resco.Event<Resco.PropertyChangedEventArgs>;
    }

    export function IsINotifyPropertyChanged(obj: any): boolean {
        // hack. chcek if obj has function propertyChanged, and that it has add, remove and raise methods ( -> assume it has event propertyChanged in that case)
        if ((typeof obj.PropertyChanged === "object") && (typeof obj.PropertyChanged.Raise === "function") && (typeof obj.PropertyChanged.Add === "function") && (typeof obj.PropertyChanged.Remove === "function")) {
            return true;
        }
        return false;
    }

    export function AsINotifyPropertyChanged(obj: any): Resco.INotifyPropertyChanged {
        // hack. chcek if obj has function propertyChanged, and that it has add, remove and raise methods ( -> assume it has event propertyChanged in that case)
        if ((typeof obj.PropertyChanged === "object") && (typeof obj.PropertyChanged.Raise === "function") && (typeof obj.PropertyChanged.Add === "function") && (typeof obj.PropertyChanged.Remove === "function")) {
            return <Resco.INotifyPropertyChanged>obj;
        }
        return null;
    }


    export class Size {
        constructor(w: number, h: number) {
            this.width = ko.observable<number>(w);
            this.height = ko.observable<number>(h);
        }

        public width: KnockoutObservable<number>;
        public height: KnockoutObservable<number>;
    }

    export class Position {
        constructor(l: number, t: number) {
            this.left = ko.observable<number>(l);
            this.top = ko.observable<number>(t);
        }

        public left: KnockoutObservable<number>;
        public top: KnockoutObservable<number>;
    }

    export class Rectangle {
        constructor(l: number, t: number, w: number, h: number) {
            this.left = ko.observable<number>(l);
            this.top = ko.observable<number>(t);
            this.width = ko.observable<number>(w);
            this.height = ko.observable<number>(h);
        }

        public left: KnockoutObservable<number>;
        public top: KnockoutObservable<number>;
        public width: KnockoutObservable<number>;
        public height: KnockoutObservable<number>;
    }

    export enum ListCellKind {
        Text,
        Image,
        Button,
        InlineButton
    }

    export enum ListCellAnchor {
        None = 0,
        Top = 1,
        Bottom = 2,
        Left = 4,
        Right = 8
    }

    export enum ListCellBorder {
        None = 0,
        Top = 1,
        Bottom = 2,
        Left = 4,
        Right = 8
    }

    export enum ContentAlignment {
        Near,
        Far,
        Center
    }

    export enum FontWeight {
        Regular,
        Bold,
        Italic,
        Underline,
        Strikeout
    }
    export enum LabelPosition {
        Left,
        Top,
        Right,
        Hidden
    }

    export interface IEnumerator<T> {
        current: T;
        moveNext: () => boolean;
        reset: () => void;
    }

    export interface IEnumerable<T> {
        getEnumerator: () => IEnumerator<T>;
    }

    export interface IAsyncEnumerable<T> extends IEnumerable<T> {
        moveNextCompleted: Event<EventArgs>;
        queryCompleted: Event<EventArgs>;
        exception: Exception;
    }

    export function IsIAsyncEnumerable(obj: any): boolean {
        // hack. chcek if obj has function moveNextCompleted, queryCompleted and that it has add, remove and raise methods ( -> assume it has event moveNextCompleted, queryCompleted in that case)
        if (obj && (typeof obj.moveNextCompleted === "object") && (typeof obj.moveNextCompleted.raise === "function") && (typeof obj.moveNextCompleted.add === "function") && (typeof obj.moveNextCompleted.remove === "function") &&
            (typeof obj.queryCompleted === "object") && (typeof obj.queryCompleted.raise === "function") && (typeof obj.queryCompleted.add === "function") && (typeof obj.queryCompleted.remove === "function")) {
            return true;
        }
        return false;
    }

    export function hasFunction(obj: any, fname: string): boolean {
        if (obj && (typeof obj[fname] === "function")) {
            return true;
        }
        return false;
    }

    export function isIComparable(obj: any): boolean {
        return hasFunction(obj, "compareTo");
    }

    export interface IComparable<T> {
        compareTo: (a: T) => number;
    }

    export interface IComparer<T> {
        compare: (a: T, b: T) => number;
    }

    export class ArrayEnumerator<T> implements IEnumerator<T> {
        public current: T;

        constructor(a: Array<T>) {
            this.m_array = a;
            this.m_position = -1;
        }

        public moveNext(): boolean {
            return (this.m_array !== undefined && this.m_array !== null && ++this.m_position < this.m_array.length);
        }

        public reset(): void {
            this.m_position = -1;
        }

        private m_array: Array<T>;
        private m_position: number;
    }

    export class UnionEnumerable<T> implements IAsyncEnumerable<T>, IEnumerator<T> {
        public moveNextCompleted: Resco.Event<Resco.EventArgs>;
        public queryCompleted: Resco.Event<Resco.EventArgs>;
        public exception: Resco.Exception;

        public current: T;

        private m_source: IEnumerable<T>[];
        private m_items: IEnumerator<T>[];
        private m_comparer: IComparer<T>

        private m_last: T;

        constructor(source: IEnumerable<T>[], comparer: IComparer<T>) {
            this.m_source = source;
            this.m_comparer = comparer;

            this.moveNextCompleted = new Resco.Event<Resco.EventArgs>(this);
            this.queryCompleted = new Resco.Event<Resco.EventArgs>(this);

            this.reset();
        }


        private _sourceMoveNextCompleted(sender: any, args: Resco.EventArgs) {   
            var as = <IAsyncEnumerable<T>>sender;
            var s = as.getEnumerator();    

            //this.m_wait--;
            this.exception = as.exception;
            if (s.moveNext() && this.m_items.indexOf(s) < 0) {
                this.m_items.push(s)
            }
            if (--this.m_wait == 0) {
                if (this.m_comparer) {
                    this.m_items.sort((a, b) => this.m_comparer.compare(a.current, b.current));
                }
                if (this.m_items.length > 0) {
                    this.current = this.m_items[0].current;
                    this.moveNextCompleted.raise(EventArgs.Empty, this);
                }
                else {
                    this.queryCompleted.raise(EventArgs.Empty, this);
                }
            }
        }

        private _sourceQueryCompleted(sender: any, args: Resco.EventArgs) {
            var as = <IAsyncEnumerable<T>>sender;
            var s = as.getEnumerator();    

            this.m_wait--;
            this.exception = as.exception;
            var index = this.m_items.indexOf(s);
            if (index >= 0) {
                this.m_items.splice(index);
            }
            if (this.m_items.length == 0) {
                this.queryCompleted.raise(EventArgs.Empty, this);
            }
        }

        public moveNext(): boolean {
            this.current = null;
            if (this.exception) {
                return false;
            }
            if (this.m_wait > 0) {
                return true;
            }

            if (this.m_comparer) {
                this.m_items.sort((a, b) => this.m_comparer.compare(a.current, b.current));
            }

            if (this.m_items.length > 0) {
                this.current = this.m_items[0].current;

                // move next in all enumerators, that have the same current item as m_items[0] enumerator and move the first enumerator too (satisfy the moveNext method call)
                for (var i = this.m_items.length - 1; i >= 0; i--) {
                    if (i == 0 || this.m_items[i].current == this.current) {
                        var result = this.m_items[i].moveNext();
                        if (result && this.m_items[i].current === null) {   // async, there are items, but must be loaded (not available yet)
                            this.m_wait++;
                        }
                        else if (!result) {
                            this.m_items.splice(i, 1);
                        }
                    }
                }
                return true;
            }
            else {
                this.queryCompleted.raise(EventArgs.Empty, this);
                return false;
            }
        }

        private m_wait: number;

        public reset() {
            this.m_items = new Array<IEnumerator<T>>();
            this.m_last = null;
            this.m_wait = 0;

            // get first item from each source. note: we are not async
            this.m_source.forEach((s) => {
                var e = s.getEnumerator();
                e.reset();

                if (IsIAsyncEnumerable(s)) {
                    var as = <IAsyncEnumerable<any>>s;

                    this.m_wait++;
                    as.moveNextCompleted.add(this, this._sourceMoveNextCompleted);
                    //TODO: uncomment: as.queryCompleted.add(this, this._sourceQueryCompleted);
                    e.moveNext();
                }
            }, this);
        }

        public getEnumerator(): IEnumerator<T> {
            return this;
        }
    }

    export class KeyValuePair<TKey, TValue> {
        constructor(k: TKey, v: TValue) {
            this.key = k;
            this.value = v;
        }
        public key: TKey;
        public value: TValue;
    }

    export class Dictionary<TKey, TValue> implements IEnumerable<KeyValuePair<TKey, TValue>> {
        constructor() {
            this.m_list = new Array<KeyValuePair<TKey, TValue>>();
        }

        private m_list: Array<KeyValuePair<TKey, TValue>>;

        public getEnumerator(): IEnumerator<KeyValuePair<TKey, TValue>> {
            var enumer = {};
            enumer["list"] = this.m_list;
            enumer["position"] = -1;
            enumer["moveNext"] = () => {
                if (enumer["position"]++ < enumer["list"].length - 1) {
                    enumer["current"] = enumer["list"][enumer["position"]];
                    return true;
                }
                enumer["current"] = null;
                return false;
            };
            enumer["current"] = null;
            enumer["reset"] = () => {
                enumer["position"] = -1;
            }
            return <IEnumerator<KeyValuePair<TKey, TValue>>>enumer;
        }

        public indexOfKey(key: TKey): number {
            for (var i = 0; i < this.m_list.length; i++) {
                if (this.m_list[i].key === key) {
                    return i;
                }
            }
            return -1;
        }

        get length(): number {
            return this.m_list.length;
        }

        public containsKey(key: TKey): boolean {
            return this.indexOfKey(key) >= 0;
        }

        public getValue(key: TKey): TValue {
            var index = this.indexOfKey(key);
            return (index >= 0) ? this.m_list[index].value : undefined;
        }

        public getValues(): Array<TValue> {
            return this.m_list.map(kv => kv.value);
        }

        public getIndex(index: number): TValue {
            return this.m_list[index].value;
        }

        public getKeys(): Array<TKey> {
            return this.m_list.map(kv => kv.key);
        }

        public add(key: TKey, value: TValue) {
            if (this.containsKey(key)) {
                throw new Resco.Exception("Dictionary already contains passed Key");
            }
            this.m_list.push(new KeyValuePair(key, value));
        }

        public set(key: TKey, value: TValue) {
            var index = this.indexOfKey(key);
            if (index >= 0) {
                this.m_list[index] = new KeyValuePair(key, value);
            }
            else {
                this.m_list.push(new KeyValuePair(key, value));
            }
        }

        public remove(key: TKey): boolean {
            var index = this.indexOfKey(key);
            if (index >= 0) {
                this.m_list.splice(index, 1);
                return true;
            }
            return false;
        }

        public clear() {
            this.m_list.splice(0, this.m_list.length);
        }

        public firstOrDefault(predicate: (value: TValue) => boolean, def: TValue): TValue {
            for (var i = 0; i < this.m_list.length; i++) {
                var value = this.m_list[i].value;
                if (predicate(value)) {
                    return value;
                }
            }
            return def;
        }

        public forEach(fn: (kv: Resco.KeyValuePair<TKey, TValue>) => void, caller?: any) {
            if (fn) {
                this.m_list.forEach(kv => caller ? fn.call(caller, kv) : fn(kv));
            }
        }
    }

    export class TextReader {
        private m_lines: Array<string>;
        private m_position: number;


        constructor(lines: Array<string>) {
            this.m_lines = lines;
            this.m_position = 0;
        }

        public close() {
            this.m_lines = null;
            this.m_position = -1;
        }

        public readLine(): string {
            if (this.m_lines && this.m_position <= this.m_lines.length) {
                return this.m_lines[this.m_position++];
            }
            return null;
        }

        public getLines(from?: number, to?: number): string[]{
            return this.m_lines.slice(from, to);
        }
    }

    // there might be a problem in Math.random() browseer implementation quality
    export function createGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    export function asString(value: any): string {
        if (typeof value == typeof "") {
            return <string>value;
        }
        return null;
    }

    export function toString(value: any): string {
        if (value && value.toString && typeof value.toString === "function") {
            return value.toString();
        }
        return "";
    }

    export function strictParseFloat(value: string): number {
        if (/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(value)) {
			return +value;
        }
        return NaN;
    }

    export function strictParseInt(value: any): number {
        if (/^(\-|\+)?([0-9]+)$/.test(<string>value)) {
            return +value;
        }
        return NaN;
    }

    export function notNull(v: any): boolean {
        return !(v === null || v === undefined);
    }

    export function formatString(fmt: string, params: any[]): string {
        var result = "";
        var lastIndex = 0;
        var sBracIndex = fmt.indexOf('{', lastIndex);
        
        while (sBracIndex >= 0 && sBracIndex < fmt.length - 1) {
            if (fmt[sBracIndex + 1] == '{') {   // {{ transforms to { and no format replacement occurs
                sBracIndex = fmt.indexOf('{', sBracIndex + 2);
                continue;
            }
            var eBracIndex = fmt.indexOf('}', sBracIndex + 1);
            if (eBracIndex <= 0 || sBracIndex + 1 == eBracIndex) {
                return fmt; // fmt is not valid format string, do not format it
            }

            var formatting = fmt.substring(sBracIndex + 1, eBracIndex);
            var formattingParts = formatting.split(':');
            var paramIndex = strictParseInt(formattingParts[0]);
            var decimalPlaces: number = 0;
            if (isNaN(paramIndex) || paramIndex < 0 || paramIndex > params.length - 1) {
                return fmt;
            }
            if (formattingParts.length > 1) {
                decimalPlaces = strictParseInt(formattingParts[1].substring(1));
            }
            var param = params[paramIndex];
            if (decimalPlaces >= 0) {
                var numParam = strictParseFloat(param);
                
                if (!isNaN(numParam)) {
                    param = round10(numParam, -decimalPlaces);
                    var paramDecimalPlaces = Resco.decimalPlaces(param);
                    if (paramDecimalPlaces < decimalPlaces) {
                        param = param + (paramDecimalPlaces > 0 ? "" : ".") + new Array(decimalPlaces - paramDecimalPlaces + 1).join("0");
                    }
                }
            }

            if (Resco.hasFunction(param, "toString")) {
                param = param.toString();
            }

            result += fmt.substring(lastIndex, sBracIndex); // append characcters betwwen } {
            result += param;
            lastIndex = eBracIndex + 1;
            sBracIndex = fmt.indexOf('{', lastIndex);
        }
        result += fmt.substring(lastIndex);
        return result;
    }

    export function round10(value, exp) {
        // If the exp is undefined or zero...
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math.round(value);
        }
        value = +value;
        exp = +exp;
        // If the value is not a number or the exp is not an integer...
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        // Shift
        value = value.toString().split('e');
        value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }

    export function decimalPlaces(num) {
        var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
        if (!match) { return 0; }
        return Math.max(
            0,
            // Number of digits right of decimal point.
            (match[1] ? match[1].length : 0)
            // Adjust for scientific notation.
            - (match[2] ? +match[2] : 0));
	}

/*    export function showNotification(title: string, body: string, data: any, callback: (o: any) => void, callbackSource?: any, icon?: string): void {
        if ("Notification" in window) {
            if (title && title.length > 40) {
                title = title.substr(0, 40) + "...";
            }
            if (body && body.length > 40) {
                body = body.substr(0, 40) + "...";
            }

            // Let's check whether notification permissions have already been granted
            if (Notification.permission === "granted") {
                var notification = _createNotification(title, body, data, icon);
                notification.onclick = (o) => {
                    if (callback) {
                        callback.call(callbackSource ? callbackSource : this, o);
                    }
                }
            }
            else if (Notification.permission !== 'denied') {
                Notification.requestPermission(function (permission) {
                    if (permission === "granted") {
                        var notification = _createNotification(title, body, data, icon);
                        notification.onclick = (o) => {
                            if (callback) {
                                callback.call(callbackSource ? callbackSource : this, o);
                            }
                        }
                    }
                });
            }
        }
    }

    function _createNotification(title: string, body?: string, data?: any, icon?: string): Notification {
        var options = {
            body: body,
            icon: icon,
            data: data
        }
        return new Notification(title, options);
    }*/
}

interface String {
    hashCode: () => number;
    //startsWith: (prefix: string) => boolean;
    //endsWith: (suffix: string) => boolean;
    indexOfAny: (...chars: string[]) => number;
    encodeXML: () => string;
    decodeXML: () => string;
    makePathFromDottedNotation: () => string;
    fromBase64: () => string;
    fromBase64ToBlob: () => Blob;
    toBase64: () => string;
    toUrlSafeBase64: (skipEncoding?: boolean) => string;
    fromUrlSafeBase64: (skipDecoding?: boolean) => string;
}

String.prototype.hashCode = function (): number {
    var hash = 0, i, chr, len;
    if (this.length == 0) return hash;
    for (i = 0, len = this.length; i < len; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

//String.prototype.startsWith = function (prefix: string): boolean {
//    if (this) {
//        if (prefix.length <= this.length) {
//            return (this.substr(0, prefix.length) === prefix);
//        }
//    }
//    return false;
//}

//String.prototype.endsWith = function (sufix: string): boolean {
//    if (this) {
//        var lastIndex = this.lastIndexOf(sufix);
//        return lastIndex >= 0 && (lastIndex + sufix.length) == this.length;
//    }
//    return false;
//}

String.prototype.indexOfAny = function (...chars: string[]): number {
    var result = -1;
    if (this) {
        for (var i = 0; i < chars.length; i++) {
            var index = this.indexOf(chars[i]);
            if (index >= 0 && (index < result || result == -1)) {
                result = index;
            }
        }
    }
    return result;
}

String.prototype.encodeXML = function (): string {
    return this.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

String.prototype.decodeXML = function (): string {
    return this.replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
}

String.prototype.makePathFromDottedNotation = function (): string {
    var index = this.lastIndexOf(".");
    if (index >= 0) {
        var ext = this.substr(index);
        var path = this.substr(0, index);
        return path.replace(".", "\\") + ext;
    }
    return this;
}

String.prototype.toBase64 = function (): string {
	return Resco.Converter.toBase64String(this);
}

String.prototype.fromBase64ToBlob = function (): Blob {
	var decB64 = Resco.base64js.toByteArray(this);
    var ab = new ArrayBuffer(decB64.length);
    var ua = new Uint8Array(ab);
    for (var i = 0; i < decB64.length; i++) {
        ua[i] = decB64.charCodeAt(i);
	}

    return new Blob([ab]);
}

String.prototype.fromBase64 = function (): string {

	return Resco.Converter.fromBase64String(this);
}

String.prototype.toUrlSafeBase64 = function (skipEncode?: boolean): string {
    var data = this;
    if (!skipEncode) {
        data = this.toBase64();
    }
    return data.replace(/\+/g, '-').replace(/\//g, '_');
}

String.prototype.fromUrlSafeBase64 = function (skipDecode?: boolean): string {
    var dec = this.replace(/-/g, "+").replace(/_/g, "/");
    return skipDecode ? dec : dec.fromBase64();
}


interface Number {
    hashCode: () => number;
}

Number.prototype.hashCode = function (): number {
    var d = this;
    if (!d) {
        return 0;
    }
    return d;   // just return the number
};

interface Array<T> {
	firstOrDefault: (callbackfn?: (value: T, index: number, array: T[]) => boolean, def?: T) => T;
	all: (predicate: (value: T) => boolean) => boolean; // builtin: every
	any: (predicate: (value: T) => boolean) => boolean;// builtin: some
	count: (predicate: (value: T) => boolean) => number; // reduce?
}

Array.prototype.firstOrDefault = function (callbackfn?: (value: any, index: number, array: any[]) => boolean, def?: any): any {
	var filter = this;
	if (callbackfn) {
		filter = this.filter(callbackfn);
	}
    if (filter.length > 0) {
        return filter[0];
    }
    return def;
}

Array.prototype.all = function (predicate: (value: any) => boolean):boolean {
	for (var i = 0; i < this.length; i++) {
		if (!predicate(this[i]))
			return false;
	}
	return true;
}
Array.prototype.any = function (predicate: (value: any) => boolean): boolean {
	for (var i = 0; i < this.length; i++) {
		if (predicate(this[i]))
			return true;
	}
	return false;
}
Array.prototype.count = function (predicate: (value: any) => boolean): number {
	var z = [];
	z.every
	var c = 0;
	for (var i = 0; i < this.length; i++) {
		if (predicate(this[i]))
			c++;
	}
	return c;
}