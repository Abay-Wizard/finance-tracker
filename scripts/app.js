import * as state from "./state.js";
import { start } from "./ui.js";

function boot() {
  state.init();
  start();
}

document.addEventListener("DOMContentLoaded", boot);
