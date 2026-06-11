import * as state from './state.js';
import * as ui from './ui.js';

function main() {
  state.init();
  ui.bindEvents();
  ui.refresh();
}

document.addEventListener('DOMContentLoaded', main);
