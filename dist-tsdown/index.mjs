//#region ../alien-signals/esm/system.mjs
function createReactiveSystem({ update, notify, unwatched }) {
	return {
		link,
		unlink,
		propagate,
		checkDirty,
		endTracking,
		startTracking,
		shallowPropagate
	};
	function link(dep, sub) {
		const prevDep = sub.depsTail;
		if (prevDep !== void 0 && prevDep.dep === dep) return;
		let nextDep = void 0;
		const recursedCheck = sub.flags & 4;
		if (recursedCheck) {
			nextDep = prevDep !== void 0 ? prevDep.nextDep : sub.deps;
			if (nextDep !== void 0 && nextDep.dep === dep) {
				sub.depsTail = nextDep;
				return;
			}
		}
		const prevSub = dep.subsTail;
		if (prevSub !== void 0 && prevSub.sub === sub && (!recursedCheck || isValidLink(prevSub, sub))) return;
		const newLink = sub.depsTail = dep.subsTail = {
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
	function unlink(link2, sub = link2.sub) {
		const dep = link2.dep;
		const prevDep = link2.prevDep;
		const nextDep = link2.nextDep;
		const nextSub = link2.nextSub;
		const prevSub = link2.prevSub;
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
	function propagate(link2) {
		let next = link2.nextSub;
		let stack;
		top: do {
			const sub = link2.sub;
			let flags = sub.flags;
			if (flags & 3) {
				if (!(flags & 60)) sub.flags = flags | 32;
				else if (!(flags & 12)) flags = 0;
				else if (!(flags & 4)) sub.flags = flags & -9 | 32;
				else if (!(flags & 48) && isValidLink(link2, sub)) {
					sub.flags = flags | 40;
					flags &= 1;
				} else flags = 0;
				if (flags & 2) notify(sub);
				if (flags & 1) {
					const subSubs = sub.subs;
					if (subSubs !== void 0) {
						link2 = subSubs;
						if (subSubs.nextSub !== void 0) {
							stack = {
								value: next,
								prev: stack
							};
							next = link2.nextSub;
						}
						continue;
					}
				}
			}
			if ((link2 = next) !== void 0) {
				next = link2.nextSub;
				continue;
			}
			while (stack !== void 0) {
				link2 = stack.value;
				stack = stack.prev;
				if (link2 !== void 0) {
					next = link2.nextSub;
					continue top;
				}
			}
			break;
		} while (true);
	}
	function startTracking(sub) {
		sub.depsTail = void 0;
		sub.flags = sub.flags & -57 | 4;
	}
	function endTracking(sub) {
		const depsTail = sub.depsTail;
		let toRemove = depsTail !== void 0 ? depsTail.nextDep : sub.deps;
		while (toRemove !== void 0) toRemove = unlink(toRemove, sub);
		sub.flags &= -5;
	}
	function checkDirty(link2, sub) {
		let stack;
		let checkDepth = 0;
		top: do {
			const dep = link2.dep;
			const depFlags = dep.flags;
			let dirty = false;
			if (sub.flags & 16) dirty = true;
			else if ((depFlags & 17) === 17) {
				if (update(dep)) {
					const subs = dep.subs;
					if (subs.nextSub !== void 0) shallowPropagate(subs);
					dirty = true;
				}
			} else if ((depFlags & 33) === 33) {
				if (link2.nextSub !== void 0 || link2.prevSub !== void 0) stack = {
					value: link2,
					prev: stack
				};
				link2 = dep.deps;
				sub = dep;
				++checkDepth;
				continue;
			}
			if (!dirty && link2.nextDep !== void 0) {
				link2 = link2.nextDep;
				continue;
			}
			while (checkDepth) {
				--checkDepth;
				const firstSub = sub.subs;
				const hasMultipleSubs = firstSub.nextSub !== void 0;
				if (hasMultipleSubs) {
					link2 = stack.value;
					stack = stack.prev;
				} else link2 = firstSub;
				if (dirty) {
					if (update(sub)) {
						if (hasMultipleSubs) shallowPropagate(firstSub);
						sub = link2.sub;
						continue;
					}
				} else sub.flags &= -33;
				sub = link2.sub;
				if (link2.nextDep !== void 0) {
					link2 = link2.nextDep;
					continue top;
				}
				dirty = false;
			}
			return dirty;
		} while (true);
	}
	function shallowPropagate(link2) {
		do {
			const sub = link2.sub;
			const nextSub = link2.nextSub;
			const subFlags = sub.flags;
			if ((subFlags & 48) === 32) {
				sub.flags = subFlags | 16;
				if (subFlags & 2) notify(sub);
			}
			link2 = nextSub;
		} while (link2 !== void 0);
	}
	function isValidLink(checkLink, sub) {
		const depsTail = sub.depsTail;
		if (depsTail !== void 0) {
			let link2 = sub.deps;
			do {
				if (link2 === checkLink) return true;
				if (link2 === depsTail) break;
				link2 = link2.nextDep;
			} while (link2 !== void 0);
		}
		return false;
	}
}

//#endregion
//#region src/index.ts
const CUSTOM = createReactiveSystem({
	notify() {},
	unwatched() {},
	update() {
		return true;
	}
});

//#endregion
export { CUSTOM };