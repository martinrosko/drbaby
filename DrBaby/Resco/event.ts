module Resco {
    export class Event<TArgs> {
        constructor(sender: any) {
            this.m_sender = sender;
            this.m_handlers = new Array<EventHandlerDescriptor<TArgs>>();
            this.m_handlersToBeRemoved = new Array<EventHandlerDescriptor<TArgs>>();
            this.m_bRaisingEvent = false;
        }

        private m_sender: any;
        private m_handlers: Array<EventHandlerDescriptor<TArgs>>;
        private m_handlersToBeRemoved: Array<EventHandlerDescriptor<TArgs>>;
        private m_bRaisingEvent: boolean;

        get empty(): boolean {
            return this.m_handlers.length == 0;
        }

        public raise(args: TArgs, sender?: any) {
            // Make sure every handler is called in raise(), if any handler is removed while in 'for' cycle, remove it after the loop finishes
            this.m_bRaisingEvent = true;

            for (var i = 0; i < this.m_handlers.length; i++) {
                this.m_handlers[i].handler.call(this.m_handlers[i].target, sender ? sender : this.m_sender, args);
                if (args && args.hasOwnProperty("cancel") && args["cancel"]) {
                    break;
                }
            }

            this.m_bRaisingEvent = false;

            for (var i = 0; i < this.m_handlersToBeRemoved.length; i++) {
                this.remove(this.m_handlersToBeRemoved[i].target, this.m_handlersToBeRemoved[i].handler);
            }
            this.m_handlersToBeRemoved.splice(0, this.m_handlersToBeRemoved.length);
        }

        public add(target: any, handler: (any, TArgs) => void, unique?: boolean) {
            if (unique) {
                for (var i = 0; i < this.m_handlers.length; i++) {
                    if (this.m_handlers[i].handler == handler && this.m_handlers[i].target == target) {
                        return;
                    }
                }
            }
            this.m_handlers.push(new EventHandlerDescriptor(target, handler));
        }

        public remove(target, handler: (any, TArgs) => void) {
            var index = 0;

            while (index < this.m_handlers.length) {
                if (this.m_handlers[index].handler == handler && this.m_handlers[index].target == target) {
                    if (!this.m_bRaisingEvent) {
                        this.m_handlers.splice(index, 1);
                    }
                    else {
                        this.m_handlersToBeRemoved.push(this.m_handlers[index]);
                        index++;
                    }
                }
                else {
                    index++;
                }
            }
        }

	    public clear () {
            if (!this.m_bRaisingEvent) {
                this.m_handlers.splice(0, this.m_handlers.length);
            }
            else {
                this.m_handlersToBeRemoved = this.m_handlers.slice(0);
            }
        }

        get count(): number {
            return this.m_handlers.length;
        }
    }

    export class EventHandlerDescriptor<TArgs> {
        constructor(t: any, h: (any, TArgs) => void) {
            this.target = t;
            this.handler = h;
        }

        public target: any;
        public handler: (any, TArgs) => void;
    }

    export class EventArgs {
        public cancel: boolean;

        static Empty = new EventArgs();
    }

    export class ResizeEventArgs extends EventArgs{
        public newSize: Resco.Size;
        public oldSize: Resco.Size;

        constructor(nw: number, nh: number, ow: number, oh: number) {
            super();
            this.newSize = new Resco.Size(nw, nh);
            this.oldSize = new Resco.Size(ow, oh);
        }
    }
    
    export class PropertyChangedEventArgs extends EventArgs {
        private m_propertyName: string;
        get propertyName(): string {
            return this.m_propertyName;
        }

        constructor(name: string) {
            super();
            this.m_propertyName = name;
        }
	}

	export class ItemSelectedEventArgs extends EventArgs {
		public data: any;
		public index: number;
		public selected: boolean;
		constructor(data: any, index: number, selected: boolean = true) {
			super();
			this.data = data;
			this.index = index;
			this.selected = selected;
		}
	}
} 