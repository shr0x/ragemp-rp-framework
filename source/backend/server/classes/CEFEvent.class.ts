const MpEvent = <K extends keyof IServerEvents | string>(eventName: K) => {
    return function (target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
        mp.events.add(eventName, descriptor.value.bind(target));
    };
};

type EventHandlerAsync = (...args: any[]) => Promise<void>;
type EventHandler = (...args: any[]) => void;

type StringifiedObject<T> = string & { __stringifiedObjectTag: T };

interface CefEventMap {
    notify: {
        show: { type: "loading" | "promise" | "success" | "info" | "error" | "warning" | "warn" | "dark"; message: string; skin: "light" | "dark" | "colored" };
    };
    auth: {};
}

interface EventEntry {
    target: string;
    name: string;
    handler: EventHandler;

    _event: EventMp;
}

class Cef_Event {
    private eventsInMemory: EventEntry[] = [];

    constructor() {
        this.eventsInMemory = [];

        console.log("Cef event handler initialised!");
    }

    register(target: string, name: string, handler: EventHandler | EventHandlerAsync): void {
        if (!this.eventsInMemory.some((event) => event.target === target && event.name === name)) {
            const _event = new mp.Event(`server::${target}:${name}`, handler);
            this.eventsInMemory.push({ target, name, handler, _event });
        } else {
            console.log("------------------------------------------------------------");
            throw new Error(`Event: "${target}", "${name}" was found duplicated`);
        }
    }

    remove(target: string): void {
        const targetInEvent = this.eventsInMemory.find((x) => x.target === target);
        if (!targetInEvent) return;

        if (targetInEvent._event) {
            targetInEvent._event.destroy();
        }
        this.eventsInMemory.splice(this.eventsInMemory.indexOf(targetInEvent), 1);
    }

    removeAll(target: string): void {
        this.eventsInMemory = this.eventsInMemory.filter((event) => event.target !== target);
    }

    updateHandler(target: string, name: string, handler: EventHandler): void {
        const index = this.eventsInMemory.findIndex((event) => event.target === target && event.name === name);
        if (index !== -1) {
            this.eventsInMemory[index].handler = handler;
        }
    }
    stringifyObject<T>(obj: T): StringifiedObject<T> {
        return JSON.stringify(obj) as StringifiedObject<T>;
    }
    emit<T extends keyof CefEventMap, K extends keyof CefEventMap[T]>(player: PlayerMp, target: T, name: K, obj: CefEventMap[T][K]): void {
        if (!mp.players.exists(player)) return;
        const eventName = `cef::${target}:${String(name)}`;
        return player.call("client::eventManager", [eventName, obj]);
    }
    async emitAsync<T extends keyof CefEventMap, K extends keyof CefEventMap[T]>(player: PlayerMp, target: T, name: K, obj: CefEventMap[T][K]): Promise<void> {
        if (!mp.players.exists(player)) return;
        const eventName = `cef::${target}:${String(name)}`;
        return player.call("client::eventManager", [eventName, obj]);
    }
}

const CefEvent = new Cef_Event();
export { CefEvent, MpEvent };
