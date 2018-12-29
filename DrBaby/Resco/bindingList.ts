module Resco {
    export interface IList<T> {
        add: (value: T) => number;
        insert: (index: number, value: T) => void;
        remove: (value: T) => void;
        removeAt: (index: number) => void;
        clear: () => void;
        contains: (value: T) => boolean;
        indexOf: (value: T) => number;
        get: (index: number) => T;
        set: (index: number, value: T) => void;
        length: number;
    }

    export interface INotifyListChanged<T> {
        listChanged: Resco.Event<ListChangedEventArgs>;
    }

    export function IsINotifyListChanged(obj: any): boolean {
        // hack. chcek if obj has function moveNextCompleted, queryCompleted and that it has add, remove and raise methods ( -> assume it has event moveNextCompleted, queryCompleted in that case)
        if (obj && (typeof obj.listChanged === "object") && (typeof obj.listChanged.Raise === "function") && (typeof obj.listChanged.Add === "function") && (typeof obj.listChanged.Remove === "function")) {
            return true;
        }
        return false;
    }

    export interface IBindingList<T> extends IEnumerable<T>, INotifyListChanged<T>, IList<T> {
        list: T[];
        raiseChangedEvents: boolean;
    }

    export enum ListChangedType {
        Reset,
        ItemAdded,
        ItemDeleted,
        ItemMoved,
        ItemChanged
    } 

    export class ListChangedEventArgs extends EventArgs {
        public listChangedType: ListChangedType;
        public newIndex: number;
        public oldIndex: number;
        public item: any;

        constructor(listChangedType: ListChangedType, item?: any, newIndex?: number, oldIndex?: number) {
            super();
            this.listChangedType = listChangedType;
            this.newIndex = newIndex;
            this.oldIndex = oldIndex;
            this.item = item;
        }
    }

    export class BindingList<T> implements IBindingList<T> {
        constructor(source?: Array<T>) {
            this.m_list = new Array<T>();
            if (source) {
                source.forEach(s => this.m_list.push(s));
            }
            this.listChanged = new Resco.Event<ListChangedEventArgs>(this);
            this.raiseChangedEvents = true;
        }

        public add(value: T): number {
            this._insertItem(-1, value);
            return this.m_list.length - 1;
        }

        public insert(index: number, value: T) {
            this._insertItem(index, value);
        }

        public _removeItem(index: number, bDontRaiseEvent?: boolean) {
            if (index >= 0 && index < this.m_list.length) {
                var item = this.m_list[index];
                this._removePropertyChangedHandler(item);
                this.m_list.splice(index, 1);
                this._onListChanged(ListChangedType.ItemDeleted, item, null, index, bDontRaiseEvent);
            }
        }

        public _insertItem(index: number, value: T) {
            if (index < 0) {
                index = this.m_list.length;
                this.m_list.push(value);
            }
            else {
                if (index > this.m_list.length) {
                    index = this.m_list.length;
                }
                this.m_list.splice(index, 0, value);
            }
            this._onListChanged(ListChangedType.ItemAdded, value, index);
            this._addPropertyChangedHandler(value);
       }

        public remove(value: T) {
            var list = this.m_list;
            for (var i = 0; i < list.length; i++) {
                if (typeof (<any>value).equals === "function") {    // try to use equals function if possible
                    if ((<any>value).equals(list[i])) {
                        this._removeItem(i);
                        break;
                    }
                }
                else if (list[i] === value) {
                    this._removeItem(i);
                    break;
                }
            }
        }

        public removeAt(index: number, bDontRaiseEvent?: boolean) {
            this._removeItem(index, bDontRaiseEvent);
        }

        public clear() {
            this.m_list.forEach((item) => this._removePropertyChangedHandler(item));
            this.m_list.splice(0);
            this._onListChanged(ListChangedType.Reset);
        }

        public contains(value: T): boolean {            
            return this.indexOf(value) >= 0;
        }

        public indexOf(value: T): number {
            var list = this.m_list;
            var valueIsIComparable = Resco.isIComparable(value);
            for (var i = 0; i < list.length; i++) {
                if (valueIsIComparable && (<Resco.IComparable<T>>(<any>value)).compareTo(<T>list[i]) == 0) {
                    return i;
                }
                else if (list[i] === value) {
                    return i;
                }
            }
            return -1;
        }

        get(index: number): T {
            if (index >= 0 && index < this.m_list.length) {
                return this.m_list[index];
            }
            return null;
        }

        set(index: number, value: T) {
            if (index >= 0 && index < this.m_list.length) {
                this.m_list[index] = value;
                this._onListChanged(ListChangedType.ItemChanged, value, index);
            }
        }

        public move(oldIndex: number, newIndex: number) {
            if (oldIndex >= 0 && oldIndex < this.m_list.length && newIndex >= 0 && newIndex < this.m_list.length && oldIndex != newIndex) {
                var item = this.m_list[oldIndex];
                this.m_list.splice(oldIndex, 1);
                this.m_list.splice(newIndex, 0, item);
                this._onListChanged(ListChangedType.ItemMoved, item, newIndex, oldIndex);
            }
        }

        get length(): number {
            return this.m_list.length;
        }

        public getEnumerator(): IEnumerator<T> {
            return this;
        }

        private m_enumerPosition = -1;
        public current: T = null;
        public moveNext(): boolean {
            if (this.m_enumerPosition++ < this.m_list.length - 1) {
                this.current = this.m_list[this.m_enumerPosition];
                return true;
            }
            this.current = null;
            return false;
        }

        public reset() {
            this.m_enumerPosition = -1;
            this.current = null;
        }

        public _onListChanged(listChangedType: ListChangedType, item?: T, newIndex?: number, oldIndex?: number, bDontRaiseEvent?: boolean) {
            if (listChangedType == ListChangedType.Reset) {
                this.reset();
            }
            else if (listChangedType == ListChangedType.ItemDeleted) {
                if (oldIndex <= this.m_enumerPosition) {
                    this.m_enumerPosition--;
                }
            }
            else if (listChangedType == ListChangedType.ItemAdded) {
                if (newIndex <= this.m_enumerPosition) {
                    this.m_enumerPosition++;
                }
            }
            else if (listChangedType == ListChangedType.ItemMoved) {
                if (oldIndex > this.m_enumerPosition && newIndex <= this.m_enumerPosition) {
                    this.m_enumerPosition++;
                }
                else if (oldIndex <= this.m_enumerPosition && newIndex > this.m_enumerPosition) {
                    this.m_enumerPosition--;
                }
            }

            if (this.raiseChangedEvents && !bDontRaiseEvent) {
                this.listChanged.raise(new ListChangedEventArgs(listChangedType, item, newIndex, oldIndex), this);
            }
        }

        public _onItemPropertyChanged(sender: any, e: PropertyChangedEventArgs) {
            var index = this.m_list.indexOf(<T>sender);
            this._onListChanged(ListChangedType.ItemChanged, <T>sender, index);
        }

        private _addPropertyChangedHandler(item: T) {
            if (Resco.IsINotifyPropertyChanged(item)) {
                (<Resco.INotifyPropertyChanged>(<any>item)).propertyChanged.add(this, this._onItemPropertyChanged);
            }        
        }

        private _removePropertyChangedHandler(item: T) {
            if (Resco.IsINotifyPropertyChanged(item)) {
               (<Resco.INotifyPropertyChanged>(<any>item)).propertyChanged.remove(this, this._onItemPropertyChanged);
            }
        }

        private m_list: Array<T>;
        get list(): Array<T> {
            return this.m_list;
        }

        static as(obj: any): BindingList<any> {
            if (obj instanceof BindingList) {
                return <BindingList<any>>obj;
            }
            return null;
        }

        public listChanged: Event<ListChangedEventArgs>;
        public raiseChangedEvents: boolean;
    }

    export class AsyncBindingList<T extends IComparable<any>> implements IAsyncEnumerable<T>, INotifyListChanged<T> {
        public exception: Exception;
        public listChanged: Event<ListChangedEventArgs>;

        private m_list: Array<T>;
        private m_loadSource: IAsyncEnumerable<T>;
        private m_loadEnumerator: IEnumerator<T>;   // enumerator for loading the items
        private m_updateEnumerator: IEnumerator<T>; // enumerator for updating the list
        private m_position: number;
        private m_loadingFinished: boolean;

        public m_onAsyncItemInserting: (item: T, index: number, completed: (item: T) => void) => void;
        public m_onAsyncItemInsertingSource: any;

        constructor(loadSource: IAsyncEnumerable<T>, updateSource: IAsyncEnumerable<T>, onAsyncItemInserting?: (item: T, index: number, completed: (item: T, index: number) => void) => void, onAsyncItemInsertingSource?: any) {
            this.m_loadSource = loadSource;
            this.m_loadEnumerator = this.m_loadSource.getEnumerator();
            this.m_updateEnumerator = updateSource.getEnumerator();
            this.m_position = -1;
            this.m_loadingFinished = false;
            this.m_list = new Array<T>();

            this.listChanged = new Event<ListChangedEventArgs>(this);

            this.queryCompleted.add(this,(sender, args) => {
                this.m_loadingFinished = true;
            });

            this.m_onAsyncItemInserting = onAsyncItemInserting;
            this.m_onAsyncItemInsertingSource = onAsyncItemInsertingSource;
        }

        get moveNextCompleted(): Event<EventArgs> {
            return this.m_loadSource.moveNextCompleted;
        }

        get queryCompleted(): Event<EventArgs> {
            return this.m_loadSource.queryCompleted;
        }

        public getEnumerator(): IEnumerator<T> {
            return this;
        }

        get current(): T {
            return this.m_loadEnumerator.current;
        }

        public moveNext(): boolean {
            var result = this.m_loadEnumerator.moveNext();
            if (result && this.current) {
                this.m_list.push(this.current);
            }
            return result;
        }

        public reset(): void {
            this.m_list.splice(0);
            this.m_position = -1;
            this.m_loadingFinished = false;
            this.m_loadEnumerator.reset();
        }

        private m_updateInterval: number; 

        public update(): void {
            if (this.m_updateInterval) {
                console.log("update postponed");
                return;
            }

            this.m_updateEnumerator.reset();

            var position = 0; 
            var waitForAsyncResult = false;          
            var oldListLength = this.m_list.length;

            this.m_updateInterval = window.setInterval(() => {
                // move until we reach end of previous enumeration
                while (!waitForAsyncResult) {
                    var moveNextResult = this.m_updateEnumerator.moveNext()
                    // no more items or we checked all previous items and loadEnumerator still works 
                    // (if so, let the loading enumerator do the rest of the work and load the data, otherwise just update the list with current update enumerator)
                    if (!moveNextResult || (position >= oldListLength && !this.m_loadingFinished)) {
                        // remove items that are on the end of the list
                        for (var i = position; i < oldListLength; i++) {
                            this.m_list.splice(position, 1);
                            this.listChanged.raise(new ListChangedEventArgs(ListChangedType.ItemDeleted, removedItem, -1, position), this);
                        }
                        window.clearInterval(this.m_updateInterval);
                        this.m_updateInterval = null;
                        console.log("update interval cleared");
                        break;
                    }
                    var current = this.m_updateEnumerator.current;
                    if (!current) {
                        // wait next 10ms and check again
                        break;
                    }
                    var positionInList = this._getPositionInList(current);
                    if (positionInList >= 0) {
                        // remove all items between the current position and the old items position in list (we are sorted, so the items between are not in enumeration anymore)
                        for (var i = position; i < positionInList; i++) {
                            var removedItem = this.m_list[position];
                            this.m_list.splice(position, 1);  // remove from same position (items will shit position)
                            this.listChanged.raise(new ListChangedEventArgs(ListChangedType.ItemDeleted, removedItem, -1, position), this);
                            oldListLength--;
                        }
                    }
                    else {
                        // this functionality is implemented because of the emails (the email update enumerator is downloading only email ids and we need to download full email when inserting it to list)
                        // for that there is an option to define a method that asynchronously obtains the item from any source (this method is optional and set in constructor)
                        if (this.m_onAsyncItemInserting) {
                            waitForAsyncResult = true;
                            this.m_onAsyncItemInserting.call(this.m_onAsyncItemInsertingSource ? this.m_onAsyncItemInsertingSource : this, current, position, (item, index) => {
                                this._insertItem(index, item);
                                waitForAsyncResult = false;
                                position++;
                            });
                            break;
                        }
                        else {
                            this._insertItem(position, current);
                        }
                    }
                    position++;
                }
            }, 10);
            
            // Update the cached list (add new and remove deleted items from cache) until we reach the end of the list, then continue with enumeration as normal (wait for moveNext, etc...)
        }

        private _insertItem(index: number, item: T): void {
            this.m_list.splice(index, 0, item);   // TODO: download email if it has only ID field set
            this.listChanged.raise(new ListChangedEventArgs(ListChangedType.ItemAdded, item, index, -1), this);
        }

        private _getPositionInList(item: T): number {
            for (var i = 0; i < this.m_list.length; i++) {
                if (item.compareTo(this.m_list[i]) == 0) {
                    return i;
                }
            }            
            return -1;
        }

        static as(obj: any): AsyncBindingList<any> {
            if (obj instanceof AsyncBindingList) {
                return <AsyncBindingList<any>>obj;
            }
            return null;
        }
    }
}

