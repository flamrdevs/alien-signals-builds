import { createReactiveSystem } from "alien-signals/system";

export const CUSTOM = createReactiveSystem({
  notify() {},
  unwatched() {},
  update() {
    return true;
  },
});
