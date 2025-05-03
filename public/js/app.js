/*jshint esversion: 10 */
"use strict";

import transactieModal from "./transactieModal.js";
import banksaldoModal from "./banksaldoModal.js";
import configModal from "./configModal.js";

import { restoreSetting } from "./configData.js";
import { initModals } from "./doms.js";
import { writeTable } from "./filltables.js";

(async () => {
  initModals();
  restoreSetting();

  transactieModal();
  banksaldoModal();
  configModal();

  writeTable();
})();
