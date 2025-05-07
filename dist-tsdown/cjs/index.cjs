"use strict";

//#region node_modules/.pnpm/alien-signals@2.0.4/node_modules/alien-signals/esm/system.mjs
var ReactiveFlags;
(function(ReactiveFlags$1) {
	ReactiveFlags$1[ReactiveFlags$1["None"] = 0] = "None";
	ReactiveFlags$1[ReactiveFlags$1["Mutable"] = 1] = "Mutable";
	ReactiveFlags$1[ReactiveFlags$1["Watching"] = 2] = "Watching";
	ReactiveFlags$1[ReactiveFlags$1["RecursedCheck"] = 4] = "RecursedCheck";
	ReactiveFlags$1[ReactiveFlags$1["Recursed"] = 8] = "Recursed";
	ReactiveFlags$1[ReactiveFlags$1["Dirty"] = 16] = "Dirty";
	ReactiveFlags$1[ReactiveFlags$1["Pending"] = 32] = "Pending";
})(ReactiveFlags || (ReactiveFlags = {}));
function createReactiveSystem(_a$1) {
	var update = _a$1.update, notify$1 = _a$1.notify, unwatched = _a$1.unwatched;
	return {
		link: link$1,
		unlink: unlink$1,
		propagate: propagate$1,
		checkDirty: checkDirty$1,
		endTracking: endTracking$1,
		startTracking: startTracking$1,
		shallowPropagate: shallowPropagate$1
	};
	function link$1(dep, sub) {
		var prevDep = sub.depsTail;
		if (prevDep !== void 0 && prevDep.dep === dep) return;
		var nextDep = void 0;
		var recursedCheck = sub.flags & 4;
		if (recursedCheck) {
			nextDep = prevDep !== void 0 ? prevDep.nextDep : sub.deps;
			if (nextDep !== void 0 && nextDep.dep === dep) {
				sub.depsTail = nextDep;
				return;
			}
		}
		var prevSub = dep.subsTail;
		if (prevSub !== void 0 && prevSub.sub === sub && (!recursedCheck || isValidLink(prevSub, sub))) return;
		var newLink = sub.depsTail = dep.subsTail = {
			dep,
			sub,
			prevDep,
			nextDep,
			prevSub,
			nextSub: void 0
		};
		if (nextDep !== void 0) nextDep.prevDep = newLink;
		if (prevDep !== void 0) prevDep.nextDep = newLink;
		else sub.deps = newLink;
		if (prevSub !== void 0) prevSub.nextSub = newLink;
		else dep.subs = newLink;
	}
	function unlink$1(link$2, sub) {
		if (sub === void 0) sub = link$2.sub;
		var dep = link$2.dep;
		var prevDep = link$2.prevDep;
		var nextDep = link$2.nextDep;
		var nextSub = link$2.nextSub;
		var prevSub = link$2.prevSub;
		if (nextDep !== void 0) nextDep.prevDep = prevDep;
		else sub.depsTail = prevDep;
		if (prevDep !== void 0) prevDep.nextDep = nextDep;
		else sub.deps = nextDep;
		if (nextSub !== void 0) nextSub.prevSub = prevSub;
		else dep.subsTail = prevSub;
		if (prevSub !== void 0) prevSub.nextSub = nextSub;
		else if ((dep.subs = nextSub) === void 0) unwatched(dep);
		return nextDep;
	}
	function propagate$1(link$2) {
		var next = link$2.nextSub;
		var stack;
		top: do {
			var sub = link$2.sub;
			var flags = sub.flags;
			if (flags & 3) {
				if (!(flags & 60)) sub.flags = flags | 32;
				else if (!(flags & 12)) flags = 0;
				else if (!(flags & 4)) sub.flags = flags & -9 | 32;
				else if (!(flags & 48) && isValidLink(link$2, sub)) {
					sub.flags = flags | 40;
					flags &= 1;
				} else flags = 0;
				if (flags & 2) notify$1(sub);
				if (flags & 1) {
					var subSubs = sub.subs;
					if (subSubs !== void 0) {
						link$2 = subSubs;
						if (subSubs.nextSub !== void 0) {
							stack = {
								value: next,
								prev: stack
							};
							next = link$2.nextSub;
						}
						continue;
					}
				}
			}
			if ((link$2 = next) !== void 0) {
				next = link$2.nextSub;
				continue;
			}
			while (stack !== void 0) {
				link$2 = stack.value;
				stack = stack.prev;
				if (link$2 !== void 0) {
					next = link$2.nextSub;
					continue top;
				}
			}
			break;
		} while (true);
	}
	function startTracking$1(sub) {
		sub.depsTail = void 0;
		sub.flags = sub.flags & -57 | 4;
	}
	function endTracking$1(sub) {
		var depsTail = sub.depsTail;
		var toRemove = depsTail !== void 0 ? depsTail.nextDep : sub.deps;
		while (toRemove !== void 0) toRemove = unlink$1(toRemove, sub);
		sub.flags &= -5;
	}
	function checkDirty$1(link$2, sub) {
		var stack;
		var checkDepth = 0;
		top: do {
			var dep = link$2.dep;
			var depFlags = dep.flags;
			var dirty = false;
			if (sub.flags & 16) dirty = true;
			else if ((depFlags & 17) === 17) {
				if (update(dep)) {
					var subs = dep.subs;
					if (subs.nextSub !== void 0) shallowPropagate$1(subs);
					dirty = true;
				}
			} else if ((depFlags & 33) === 33) {
				if (link$2.nextSub !== void 0 || link$2.prevSub !== void 0) stack = {
					value: link$2,
					prev: stack
				};
				link$2 = dep.deps;
				sub = dep;
				++checkDepth;
				continue;
			}
			if (!dirty && link$2.nextDep !== void 0) {
				link$2 = link$2.nextDep;
				continue;
			}
			while (checkDepth) {
				--checkDepth;
				var firstSub = sub.subs;
				var hasMultipleSubs = firstSub.nextSub !== void 0;
				if (hasMultipleSubs) {
					link$2 = stack.value;
					stack = stack.prev;
				} else link$2 = firstSub;
				if (dirty) {
					if (update(sub)) {
						if (hasMultipleSubs) shallowPropagate$1(firstSub);
						sub = link$2.sub;
						continue;
					}
				} else sub.flags &= -33;
				sub = link$2.sub;
				if (link$2.nextDep !== void 0) {
					link$2 = link$2.nextDep;
					continue top;
				}
				dirty = false;
			}
			return dirty;
		} while (true);
	}
	function shallowPropagate$1(link$2) {
		do {
			var sub = link$2.sub;
			var nextSub = link$2.nextSub;
			var subFlags = sub.flags;
			if ((subFlags & 48) === 32) {
				sub.flags = subFlags | 16;
				if (subFlags & 2) notify$1(sub);
			}
			link$2 = nextSub;
		} while (link$2 !== void 0);
	}
	function isValidLink(checkLink, sub) {
		var depsTail = sub.depsTail;
		if (depsTail !== void 0) {
			var link_1 = sub.deps;
			do {
				if (link_1 === checkLink) return true;
				if (link_1 === depsTail) break;
				link_1 = link_1.nextDep;
			} while (link_1 !== void 0);
		}
		return false;
	}
}

//#endregion
//#region node_modules/.pnpm/alien-signals@2.0.4/node_modules/alien-signals/esm/index.mjs
var queuedEffects = [];
var _a = createReactiveSystem({
	update: function(signal$1) {
		if ("getter" in signal$1) return updateComputed(signal$1);
		else return updateSignal(signal$1, signal$1.value);
	},
	notify,
	unwatched: function(node) {
		if ("getter" in node) {
			var toRemove = node.deps;
			if (toRemove !== void 0) {
				node.flags = 17;
				do
					toRemove = unlink(toRemove, node);
				while (toRemove !== void 0);
			}
		} else if (!("previousValue" in node)) effectOper.call(node);
	}
}), link = _a.link, unlink = _a.unlink, propagate = _a.propagate, checkDirty = _a.checkDirty, endTracking = _a.endTracking, startTracking = _a.startTracking, shallowPropagate = _a.shallowPropagate;
var batchDepth = 0;
var notifyIndex = 0;
var queuedEffectsLength = 0;
var activeSub;
function setCurrentSub(sub) {
	var prevSub = activeSub;
	activeSub = sub;
	return prevSub;
}
function signal(initialValue) {
	return signalOper.bind({
		previousValue: initialValue,
		value: initialValue,
		subs: void 0,
		subsTail: void 0,
		flags: 1
	});
}
function updateComputed(c) {
	var prevSub = setCurrentSub(c);
	startTracking(c);
	try {
		var oldValue = c.value;
		return oldValue !== (c.value = c.getter(oldValue));
	} finally {
		setCurrentSub(prevSub);
		endTracking(c);
	}
}
function updateSignal(s, value) {
	s.flags = 1;
	return s.previousValue !== (s.previousValue = value);
}
function notify(e) {
	var flags = e.flags;
	if (!(flags & 64)) {
		e.flags = flags | 64;
		var subs = e.subs;
		if (subs !== void 0) notify(subs.sub);
		else queuedEffects[queuedEffectsLength++] = e;
	}
}
function run(e, flags) {
	if (flags & 16 || flags & 32 && checkDirty(e.deps, e)) {
		var prev = setCurrentSub(e);
		startTracking(e);
		try {
			e.fn();
		} finally {
			setCurrentSub(prev);
			endTracking(e);
		}
		return;
	} else if (flags & 32) e.flags = flags & -33;
	var link$1 = e.deps;
	while (link$1 !== void 0) {
		var dep = link$1.dep;
		var depFlags = dep.flags;
		if (depFlags & 64) run(
			dep,
			dep.flags = depFlags & -65
			/* EffectFlags.Queued */
);
		link$1 = link$1.nextDep;
	}
}
function flush() {
	while (notifyIndex < queuedEffectsLength) {
		var effect_1 = queuedEffects[notifyIndex];
		queuedEffects[notifyIndex++] = void 0;
		run(
			effect_1,
			effect_1.flags &= -65
			/* EffectFlags.Queued */
);
	}
	notifyIndex = 0;
	queuedEffectsLength = 0;
}
function signalOper() {
	var value = [];
	for (var _i = 0; _i < arguments.length; _i++) value[_i] = arguments[_i];
	if (value.length) {
		var newValue = value[0];
		if (this.value !== (this.value = newValue)) {
			this.flags = 17;
			var subs = this.subs;
			if (subs !== void 0) {
				propagate(subs);
				if (!batchDepth) flush();
			}
		}
	} else {
		var value_1 = this.value;
		if (this.flags & 16) {
			if (updateSignal(this, value_1)) {
				var subs = this.subs;
				if (subs !== void 0) shallowPropagate(subs);
			}
		}
		if (activeSub !== void 0) link(this, activeSub);
		return value_1;
	}
}
function effectOper() {
	var dep = this.deps;
	while (dep !== void 0) dep = unlink(dep, this);
	var sub = this.subs;
	if (sub !== void 0) unlink(sub);
	this.flags = 0;
}

//#endregion
//#region src/index.ts
const count = signal(0);

//#endregion
exports.count = count