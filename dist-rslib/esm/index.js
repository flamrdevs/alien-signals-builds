
;// CONCATENATED MODULE: ./node_modules/.pnpm/alien-signals@2.0.4/node_modules/alien-signals/esm/system.mjs
var system_ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags[ReactiveFlags["None"] = 0] = "None";
    ReactiveFlags[ReactiveFlags["Mutable"] = 1] = "Mutable";
    ReactiveFlags[ReactiveFlags["Watching"] = 2] = "Watching";
    ReactiveFlags[ReactiveFlags["RecursedCheck"] = 4] = "RecursedCheck";
    ReactiveFlags[ReactiveFlags["Recursed"] = 8] = "Recursed";
    ReactiveFlags[ReactiveFlags["Dirty"] = 16] = "Dirty";
    ReactiveFlags[ReactiveFlags["Pending"] = 32] = "Pending";
})(system_ReactiveFlags || (system_ReactiveFlags = {}));
function createReactiveSystem(_a) {
    var update = _a.update, notify = _a.notify, unwatched = _a.unwatched;
    return {
        link: link,
        unlink: unlink,
        propagate: propagate,
        checkDirty: checkDirty,
        endTracking: endTracking,
        startTracking: startTracking,
        shallowPropagate: shallowPropagate,
    };
    function link(dep, sub) {
        var prevDep = sub.depsTail;
        if (prevDep !== undefined && prevDep.dep === dep) {
            return;
        }
        var nextDep = undefined;
        var recursedCheck = sub.flags & 4;
        if (recursedCheck) {
            nextDep = prevDep !== undefined ? prevDep.nextDep : sub.deps;
            if (nextDep !== undefined && nextDep.dep === dep) {
                sub.depsTail = nextDep;
                return;
            }
        }
        var prevSub = dep.subsTail;
        if (prevSub !== undefined
            && prevSub.sub === sub
            && (!recursedCheck || isValidLink(prevSub, sub))) {
            return;
        }
        var newLink = sub.depsTail
            = dep.subsTail
                = {
                    dep: dep,
                    sub: sub,
                    prevDep: prevDep,
                    nextDep: nextDep,
                    prevSub: prevSub,
                    nextSub: undefined,
                };
        if (nextDep !== undefined) {
            nextDep.prevDep = newLink;
        }
        if (prevDep !== undefined) {
            prevDep.nextDep = newLink;
        }
        else {
            sub.deps = newLink;
        }
        if (prevSub !== undefined) {
            prevSub.nextSub = newLink;
        }
        else {
            dep.subs = newLink;
        }
    }
    function unlink(link, sub) {
        if (sub === void 0) { sub = link.sub; }
        var dep = link.dep;
        var prevDep = link.prevDep;
        var nextDep = link.nextDep;
        var nextSub = link.nextSub;
        var prevSub = link.prevSub;
        if (nextDep !== undefined) {
            nextDep.prevDep = prevDep;
        }
        else {
            sub.depsTail = prevDep;
        }
        if (prevDep !== undefined) {
            prevDep.nextDep = nextDep;
        }
        else {
            sub.deps = nextDep;
        }
        if (nextSub !== undefined) {
            nextSub.prevSub = prevSub;
        }
        else {
            dep.subsTail = prevSub;
        }
        if (prevSub !== undefined) {
            prevSub.nextSub = nextSub;
        }
        else if ((dep.subs = nextSub) === undefined) {
            unwatched(dep);
        }
        return nextDep;
    }
    function propagate(link) {
        var next = link.nextSub;
        var stack;
        top: do {
            var sub = link.sub;
            var flags = sub.flags;
            if (flags & 3) {
                if (!(flags & 60)) {
                    sub.flags = flags | 32;
                }
                else if (!(flags & 12)) {
                    flags = 0;
                }
                else if (!(flags & 4)) {
                    sub.flags = (flags & ~8) | 32;
                }
                else if (!(flags & 48) && isValidLink(link, sub)) {
                    sub.flags = flags | 40;
                    flags &= 1;
                }
                else {
                    flags = 0;
                }
                if (flags & 2) {
                    notify(sub);
                }
                if (flags & 1) {
                    var subSubs = sub.subs;
                    if (subSubs !== undefined) {
                        link = subSubs;
                        if (subSubs.nextSub !== undefined) {
                            stack = { value: next, prev: stack };
                            next = link.nextSub;
                        }
                        continue;
                    }
                }
            }
            if ((link = next) !== undefined) {
                next = link.nextSub;
                continue;
            }
            while (stack !== undefined) {
                link = stack.value;
                stack = stack.prev;
                if (link !== undefined) {
                    next = link.nextSub;
                    continue top;
                }
            }
            break;
        } while (true);
    }
    function startTracking(sub) {
        sub.depsTail = undefined;
        sub.flags = (sub.flags & ~56) | 4;
    }
    function endTracking(sub) {
        var depsTail = sub.depsTail;
        var toRemove = depsTail !== undefined ? depsTail.nextDep : sub.deps;
        while (toRemove !== undefined) {
            toRemove = unlink(toRemove, sub);
        }
        sub.flags &= ~4;
    }
    function checkDirty(link, sub) {
        var stack;
        var checkDepth = 0;
        top: do {
            var dep = link.dep;
            var depFlags = dep.flags;
            var dirty = false;
            if (sub.flags & 16) {
                dirty = true;
            }
            else if ((depFlags & 17) === 17) {
                if (update(dep)) {
                    var subs = dep.subs;
                    if (subs.nextSub !== undefined) {
                        shallowPropagate(subs);
                    }
                    dirty = true;
                }
            }
            else if ((depFlags & 33) === 33) {
                if (link.nextSub !== undefined || link.prevSub !== undefined) {
                    stack = { value: link, prev: stack };
                }
                link = dep.deps;
                sub = dep;
                ++checkDepth;
                continue;
            }
            if (!dirty && link.nextDep !== undefined) {
                link = link.nextDep;
                continue;
            }
            while (checkDepth) {
                --checkDepth;
                var firstSub = sub.subs;
                var hasMultipleSubs = firstSub.nextSub !== undefined;
                if (hasMultipleSubs) {
                    link = stack.value;
                    stack = stack.prev;
                }
                else {
                    link = firstSub;
                }
                if (dirty) {
                    if (update(sub)) {
                        if (hasMultipleSubs) {
                            shallowPropagate(firstSub);
                        }
                        sub = link.sub;
                        continue;
                    }
                }
                else {
                    sub.flags &= ~32;
                }
                sub = link.sub;
                if (link.nextDep !== undefined) {
                    link = link.nextDep;
                    continue top;
                }
                dirty = false;
            }
            return dirty;
        } while (true);
    }
    function shallowPropagate(link) {
        do {
            var sub = link.sub;
            var nextSub = link.nextSub;
            var subFlags = sub.flags;
            if ((subFlags & 48) === 32) {
                sub.flags = subFlags | 16;
                if (subFlags & 2) {
                    notify(sub);
                }
            }
            link = nextSub;
        } while (link !== undefined);
    }
    function isValidLink(checkLink, sub) {
        var depsTail = sub.depsTail;
        if (depsTail !== undefined) {
            var link_1 = sub.deps;
            do {
                if (link_1 === checkLink) {
                    return true;
                }
                if (link_1 === depsTail) {
                    break;
                }
                link_1 = link_1.nextDep;
            } while (link_1 !== undefined);
        }
        return false;
    }
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/alien-signals@2.0.4/node_modules/alien-signals/esm/index.mjs


var pauseStack = (/* unused pure expression or super */ null && ([]));
var queuedEffects = [];
var esm_a = createReactiveSystem({
    update: function (signal) {
        if ('getter' in signal) {
            return updateComputed(signal);
        }
        else {
            return updateSignal(signal, signal.value);
        }
    },
    notify: esm_notify,
    unwatched: function (node) {
        if ('getter' in node) {
            var toRemove = node.deps;
            if (toRemove !== undefined) {
                node.flags = 17;
                do {
                    toRemove = esm_unlink(toRemove, node);
                } while (toRemove !== undefined);
            }
        }
        else if (!('previousValue' in node)) {
            effectOper.call(node);
        }
    },
}), esm_link = esm_a.link, esm_unlink = esm_a.unlink, esm_propagate = esm_a.propagate, esm_checkDirty = esm_a.checkDirty, esm_endTracking = esm_a.endTracking, esm_startTracking = esm_a.startTracking, esm_shallowPropagate = esm_a.shallowPropagate;
var batchDepth = 0;
var notifyIndex = 0;
var queuedEffectsLength = 0;
var activeSub;
var activeScope;
function getCurrentSub() {
    return activeSub;
}
function setCurrentSub(sub) {
    var prevSub = activeSub;
    activeSub = sub;
    return prevSub;
}
function getCurrentScope() {
    return activeScope;
}
function setCurrentScope(scope) {
    var prevScope = activeScope;
    activeScope = scope;
    return prevScope;
}
function startBatch() {
    ++batchDepth;
}
function endBatch() {
    if (!--batchDepth) {
        flush();
    }
}
/**
 * @deprecated Will be removed in the next major version. Use `const pausedSub = setCurrentSub(undefined)` instead for better performance.
 */
function pauseTracking() {
    pauseStack.push(setCurrentSub(undefined));
}
/**
 * @deprecated Will be removed in the next major version. Use `setCurrentSub(pausedSub)` instead for better performance.
 */
function resumeTracking() {
    setCurrentSub(pauseStack.pop());
}
function esm_signal(initialValue) {
    return signalOper.bind({
        previousValue: initialValue,
        value: initialValue,
        subs: undefined,
        subsTail: undefined,
        flags: 1,
    });
}
function computed(getter) {
    return computedOper.bind({
        value: undefined,
        subs: undefined,
        subsTail: undefined,
        deps: undefined,
        depsTail: undefined,
        flags: 17,
        getter: getter,
    });
}
function effect(fn) {
    var e = {
        fn: fn,
        subs: undefined,
        subsTail: undefined,
        deps: undefined,
        depsTail: undefined,
        flags: 2,
    };
    if (activeSub !== undefined) {
        esm_link(e, activeSub);
    }
    else if (activeScope !== undefined) {
        esm_link(e, activeScope);
    }
    var prev = setCurrentSub(e);
    try {
        e.fn();
    }
    finally {
        setCurrentSub(prev);
    }
    return effectOper.bind(e);
}
function effectScope(fn) {
    var e = {
        deps: undefined,
        depsTail: undefined,
        subs: undefined,
        subsTail: undefined,
        flags: 0,
    };
    if (activeScope !== undefined) {
        esm_link(e, activeScope);
    }
    var prevSub = setCurrentSub(undefined);
    var prevScope = setCurrentScope(e);
    try {
        fn();
    }
    finally {
        setCurrentScope(prevScope);
        setCurrentSub(prevSub);
    }
    return effectOper.bind(e);
}
function updateComputed(c) {
    var prevSub = setCurrentSub(c);
    esm_startTracking(c);
    try {
        var oldValue = c.value;
        return oldValue !== (c.value = c.getter(oldValue));
    }
    finally {
        setCurrentSub(prevSub);
        esm_endTracking(c);
    }
}
function updateSignal(s, value) {
    s.flags = 1;
    return s.previousValue !== (s.previousValue = value);
}
function esm_notify(e) {
    var flags = e.flags;
    if (!(flags & 64 /* EffectFlags.Queued */)) {
        e.flags = flags | 64 /* EffectFlags.Queued */;
        var subs = e.subs;
        if (subs !== undefined) {
            esm_notify(subs.sub);
        }
        else {
            queuedEffects[queuedEffectsLength++] = e;
        }
    }
}
function run(e, flags) {
    if (flags & 16
        || (flags & 32 && esm_checkDirty(e.deps, e))) {
        var prev = setCurrentSub(e);
        esm_startTracking(e);
        try {
            e.fn();
        }
        finally {
            setCurrentSub(prev);
            esm_endTracking(e);
        }
        return;
    }
    else if (flags & 32) {
        e.flags = flags & ~32;
    }
    var link = e.deps;
    while (link !== undefined) {
        var dep = link.dep;
        var depFlags = dep.flags;
        if (depFlags & 64 /* EffectFlags.Queued */) {
            run(dep, dep.flags = depFlags & ~64 /* EffectFlags.Queued */);
        }
        link = link.nextDep;
    }
}
function flush() {
    while (notifyIndex < queuedEffectsLength) {
        var effect_1 = queuedEffects[notifyIndex];
        queuedEffects[notifyIndex++] = undefined;
        run(effect_1, effect_1.flags &= ~64 /* EffectFlags.Queued */);
    }
    notifyIndex = 0;
    queuedEffectsLength = 0;
}
function computedOper() {
    var flags = this.flags;
    if (flags & 16
        || (flags & 32 && esm_checkDirty(this.deps, this))) {
        if (updateComputed(this)) {
            var subs = this.subs;
            if (subs !== undefined) {
                esm_shallowPropagate(subs);
            }
        }
    }
    else if (flags & 32) {
        this.flags = flags & ~32;
    }
    if (activeSub !== undefined) {
        esm_link(this, activeSub);
    }
    else if (activeScope !== undefined) {
        esm_link(this, activeScope);
    }
    return this.value;
}
function signalOper() {
    var value = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        value[_i] = arguments[_i];
    }
    if (value.length) {
        var newValue = value[0];
        if (this.value !== (this.value = newValue)) {
            this.flags = 17;
            var subs = this.subs;
            if (subs !== undefined) {
                esm_propagate(subs);
                if (!batchDepth) {
                    flush();
                }
            }
        }
    }
    else {
        var value_1 = this.value;
        if (this.flags & 16) {
            if (updateSignal(this, value_1)) {
                var subs = this.subs;
                if (subs !== undefined) {
                    esm_shallowPropagate(subs);
                }
            }
        }
        if (activeSub !== undefined) {
            esm_link(this, activeSub);
        }
        return value_1;
    }
}
function effectOper() {
    var dep = this.deps;
    while (dep !== undefined) {
        dep = esm_unlink(dep, this);
    }
    var sub = this.subs;
    if (sub !== undefined) {
        esm_unlink(sub);
    }
    this.flags = 0;
}

;// CONCATENATED MODULE: ./src/index.ts

const count = esm_signal(0);

export { count };
