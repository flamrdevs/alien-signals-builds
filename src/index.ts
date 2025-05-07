import { createReactiveSystem } from "alien-signals";

export const CUSTOM = createReactiveSystem({
  notify() {},
  unwatched() {},
  update() {
    return true;
  },
});
