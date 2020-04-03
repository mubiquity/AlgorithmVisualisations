class EventManager {
    constructor() {
        this.current = 0;
        this.listeners = {};
    }

    addListener(listener) {
        this.listeners[this.current] = listener;
        return this.current++;
    }

    removeListener(id) {
        delete this.listeners[id];
    }

    trigger(paramData) {
        for (let key in this.listeners) {
            this.listeners[key](paramData);
        }
    }
}