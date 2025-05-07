// node_modules/.pnpm/alien-signals@2.0.4/node_modules/alien-signals/esm/system.mjs
var ReactiveFlags;
(function(ReactiveFlags2) {
  ReactiveFlags2[ReactiveFlags2["None"] = 0] = "None";
  ReactiveFlags2[ReactiveFlags2["Mutable"] = 1] = "Mutable";
  ReactiveFlags2[ReactiveFlags2["Watching"] = 2] = "Watching";
  ReactiveFlags2[ReactiveFlags2["RecursedCheck"] = 4] = "RecursedCheck";
  ReactiveFlags2[ReactiveFlags2["Recursed"] = 8] = "Recursed";
  ReactiveFlags2[ReactiveFlags2["Dirty"] = 16] = "Dirty";
  ReactiveFlags2[ReactiveFlags2["Pending"] = 32] = "Pending";
})(ReactiveFlags || (ReactiveFlags = {}));
function createReactiveSystem(_a2) {
  var update = _a2.update, notify2 = _a2.notify, unwatched = _a2.unwatched;
  return {
    link: link2,
    unlink: unlink2,
    propagate: propagate2,
    checkDirty: checkDirty2,
    endTracking: endTracking2,
    startTracking: startTracking2,
    shallowPropagate: shallowPropagate2
  };
  function link2(dep, sub) {
    var prevDep = sub.depsTail;
    if (prevDep !== void 0 && prevDep.dep === dep) {
      return;
    }
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
    if (prevSub !== void 0 && prevSub.sub === sub && (!recursedCheck || isValidLink(prevSub, sub))) {
      return;
    }
    var newLink = sub.depsTail = dep.subsTail = {
      dep,
      sub,
      prevDep,
      nextDep,
      prevSub,
      nextSub: void 0
    };
    if (nextDep !== void 0) {
      nextDep.prevDep = newLink;
    }
    if (prevDep !== void 0) {
      prevDep.nextDep = newLink;
    } else {
      sub.deps = newLink;
    }
    if (prevSub !== void 0) {
      prevSub.nextSub = newLink;
    } else {
      dep.subs = newLink;
    }
  }
  function unlink2(link3, sub) {
    if (sub === void 0) {
      sub = link3.sub;
    }
    var dep = link3.dep;
    var prevDep = link3.prevDep;
    var nextDep = link3.nextDep;
    var nextSub = link3.nextSub;
    var prevSub = link3.prevSub;
    if (nextDep !== void 0) {
      nextDep.prevDep = prevDep;
    } else {
      sub.depsTail = prevDep;
    }
    if (prevDep !== void 0) {
      prevDep.nextDep = nextDep;
    } else {
      sub.deps = nextDep;
    }
    if (nextSub !== void 0) {
      nextSub.prevSub = prevSub;
    } else {
      dep.subsTail = prevSub;
    }
    if (prevSub !== void 0) {
      prevSub.nextSub = nextSub;
    } else if ((dep.subs = nextSub) === void 0) {
      unwatched(dep);
    }
    return nextDep;
  }
  function propagate2(link3) {
    var next = link3.nextSub;
    var stack;
    top: do {
      var sub = link3.sub;
      var flags = sub.flags;
      if (flags & 3) {
        if (!(flags & 60)) {
          sub.flags = flags | 32;
        } else if (!(flags & 12)) {
          flags = 0;
        } else if (!(flags & 4)) {
          sub.flags = flags & ~8 | 32;
        } else if (!(flags & 48) && isValidLink(link3, sub)) {
          sub.flags = flags | 40;
          flags &= 1;
        } else {
          flags = 0;
        }
        if (flags & 2) {
          notify2(sub);
        }
        if (flags & 1) {
          var subSubs = sub.subs;
          if (subSubs !== void 0) {
            link3 = subSubs;
            if (subSubs.nextSub !== void 0) {
              stack = { value: next, prev: stack };
              next = link3.nextSub;
            }
            continue;
          }
        }
      }
      if ((link3 = next) !== void 0) {
        next = link3.nextSub;
        continue;
      }
      while (stack !== void 0) {
        link3 = stack.value;
        stack = stack.prev;
        if (link3 !== void 0) {
          next = link3.nextSub;
          continue top;
        }
      }
      break;
    } while (true);
  }
  function startTracking2(sub) {
    sub.depsTail = void 0;
    sub.flags = sub.flags & ~56 | 4;
  }
  function endTracking2(sub) {
    var depsTail = sub.depsTail;
    var toRemove = depsTail !== void 0 ? depsTail.nextDep : sub.deps;
    while (toRemove !== void 0) {
      toRemove = unlink2(toRemove, sub);
    }
    sub.flags &= ~4;
  }
  function checkDirty2(link3, sub) {
    var stack;
    var checkDepth = 0;
    top: do {
      var dep = link3.dep;
      var depFlags = dep.flags;
      var dirty = false;
      if (sub.flags & 16) {
        dirty = true;
      } else if ((depFlags & 17) === 17) {
        if (update(dep)) {
          var subs = dep.subs;
          if (subs.nextSub !== void 0) {
            shallowPropagate2(subs);
          }
          dirty = true;
        }
      } else if ((depFlags & 33) === 33) {
        if (link3.nextSub !== void 0 || link3.prevSub !== void 0) {
          stack = { value: link3, prev: stack };
        }
        link3 = dep.deps;
        sub = dep;
        ++checkDepth;
        continue;
      }
      if (!dirty && link3.nextDep !== void 0) {
        link3 = link3.nextDep;
        continue;
      }
      while (checkDepth) {
        --checkDepth;
        var firstSub = sub.subs;
        var hasMultipleSubs = firstSub.nextSub !== void 0;
        if (hasMultipleSubs) {
          link3 = stack.value;
          stack = stack.prev;
        } else {
          link3 = firstSub;
        }
        if (dirty) {
          if (update(sub)) {
            if (hasMultipleSubs) {
              shallowPropagate2(firstSub);
            }
            sub = link3.sub;
            continue;
          }
        } else {
          sub.flags &= ~32;
        }
        sub = link3.sub;
        if (link3.nextDep !== void 0) {
          link3 = link3.nextDep;
          continue top;
        }
        dirty = false;
      }
      return dirty;
    } while (true);
  }
  function shallowPropagate2(link3) {
    do {
      var sub = link3.sub;
      var nextSub = link3.nextSub;
      var subFlags = sub.flags;
      if ((subFlags & 48) === 32) {
        sub.flags = subFlags | 16;
        if (subFlags & 2) {
          notify2(sub);
        }
      }
      link3 = nextSub;
    } while (link3 !== void 0);
  }
  function isValidLink(checkLink, sub) {
    var depsTail = sub.depsTail;
    if (depsTail !== void 0) {
      var link_1 = sub.deps;
      do {
        if (link_1 === checkLink) {
          return true;
        }
        if (link_1 === depsTail) {
          break;
        }
        link_1 = link_1.nextDep;
      } while (link_1 !== void 0);
    }
    return false;
  }
}

// node_modules/.pnpm/alien-signals@2.0.4/node_modules/alien-signals/esm/index.mjs
var queuedEffects = [];
var _a = createReactiveSystem({
  update: function(signal2) {
    if ("getter" in signal2) {
      return updateComputed(signal2);
    } else {
      return updateSignal(signal2, signal2.value);
    }
  },
  notify,
  unwatched: function(node) {
    if ("getter" in node) {
      var toRemove = node.deps;
      if (toRemove !== void 0) {
        node.flags = 17;
        do {
          toRemove = unlink(toRemove, node);
        } while (toRemove !== void 0);
      }
    } else if (!("previousValue" in node)) {
      effectOper.call(node);
    }
  }
});
var link = _a.link;
var unlink = _a.unlink;
var propagate = _a.propagate;
var checkDirty = _a.checkDirty;
var endTracking = _a.endTracking;
var startTracking = _a.startTracking;
var shallowPropagate = _a.shallowPropagate;
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
    if (subs !== void 0) {
      notify(subs.sub);
    } else {
      queuedEffects[queuedEffectsLength++] = e;
    }
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
  } else if (flags & 32) {
    e.flags = flags & ~32;
  }
  var link2 = e.deps;
  while (link2 !== void 0) {
    var dep = link2.dep;
    var depFlags = dep.flags;
    if (depFlags & 64) {
      run(
        dep,
        dep.flags = depFlags & ~64
        /* EffectFlags.Queued */
      );
    }
    link2 = link2.nextDep;
  }
}
function flush() {
  while (notifyIndex < queuedEffectsLength) {
    var effect_1 = queuedEffects[notifyIndex];
    queuedEffects[notifyIndex++] = void 0;
    run(
      effect_1,
      effect_1.flags &= ~64
      /* EffectFlags.Queued */
    );
  }
  notifyIndex = 0;
  queuedEffectsLength = 0;
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
      if (subs !== void 0) {
        propagate(subs);
        if (!batchDepth) {
          flush();
        }
      }
    }
  } else {
    var value_1 = this.value;
    if (this.flags & 16) {
      if (updateSignal(this, value_1)) {
        var subs = this.subs;
        if (subs !== void 0) {
          shallowPropagate(subs);
        }
      }
    }
    if (activeSub !== void 0) {
      link(this, activeSub);
    }
    return value_1;
  }
}
function effectOper() {
  var dep = this.deps;
  while (dep !== void 0) {
    dep = unlink(dep, this);
  }
  var sub = this.subs;
  if (sub !== void 0) {
    unlink(sub);
  }
  this.flags = 0;
}

// src/index.ts
var count = signal(0);
export {
  count
};
