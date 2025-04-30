/*jshint esversion: 10 */
"use strict";

import { setDate, nextWeek, localDate, appendAlert } from "./utils.js";
import { config } from "./doms.js";
import { transactieLijst, fillList } from "./transactieLijst.js";

var iTemplate = {
  daysinmonth: 0,
  days: 0,
  weeknr: 0,

  today: null,
  firstItem: null,

  noSaldo: false,

  lasten: 0.0,
  baten: 0.0,
  batenLasten: 0.0,
  calcPerWeek: 0.0,
  weekvalue: 0.0,

  inkomen: 0.0,

  uitgaven: 0.0,
  uitgevoerd: 0.0,
  inkomsten: 0.0,
  privateUitgaven: 0.0,
  uitgegeven: 0.0,

  besteedbaar: 0.0,
  weekBudget: 0.0,
  weekValue: 0.0,
  savings: 0.0,

  expance: 0.0,

  startPeriod: null,
  nextPeriod: null,
  thisWeek: null,
  nextWeek: null,
};

export let configData = {
  startOfMaand: "2",
  dagenPerMaand: "1",

  beginSaldo: 0.0,
  beginDatum: null,

  bankSaldo: 0.0,
  bankDatum: null,

  saldoValid: 7,
  lastenValid: 7,
  showOldItems: "0",
  showHiddenItems: "0",

  volgende_ID: "12",
};

export let budgetData = Object.assign({}, iTemplate);

export function reloadConfig() {
  budgetData = Object.assign({}, iTemplate);
  budgetData.today = localDate.now();
  budgetData.daysinmonth = budgetData.today.lengthOfMonth();

  budgetData.nextWeek = nextWeek(budgetData.today, 1);
  budgetData.thisWeek = budgetData.nextWeek.minusDays(7);

  configData.beginDatum = setDate(configData.beginDatum);
  configData.bankDatum = setDate(configData.bankDatum);

  if (!configData.bankDatum) {
    // configData.bankDatum = budgetData.today; //.clone();
    budgetData.noSaldo = true;
  } else {
    if (
      configData.bankDatum.isBefore(
        budgetData.today.minusDays(configData.saldoValid)
      )
    ) {
      configData.bankDatum = budgetData.today.minusDays(configData.saldoValid);

      budgetData.noSaldo = true;
    }
    configData.bankSaldo = configData.bankSaldo * 1.0;
  }
  return budgetData;
}

export function setFirstDate() {
  switch (configData.startOfMaand * 1) {
    case 0:
      if (budgetData.firstItem) {
        budgetData.startPeriod = budgetData.firstItem.performDate;
        budgetData.nextPeriod = budgetData.startPeriod.plusMonths(1);
        break;
      }
    case 1:
      budgetData.startPeriod = budgetData.today.withDayOfMonth(1);
      budgetData.nextPeriod = budgetData.startPeriod.plusMonths(1);
      break;
    case 2:
      budgetData.startPeriod = calcFirstWeekday(budgetData.today);
      budgetData.nextPeriod = calcFirstWeekday(budgetData.startPeriod.plusMonths(1).plusDays(5));
      break;
  }
}

export function calcFirstWeekday(date, weekday= 1) {
  const fistDayOfMonth = date.withDayOfMonth(1);
  const old = fistDayOfMonth.dayOfWeek().value();
  if (weekday < old) weekday += 7;
  return fistDayOfMonth.plusDays(weekday - old);
}

export function storeSetting(storeLocal = false) {
  if (typeof Storage !== "undefined") {
    let storage = sessionStorage;
    if (localStorage._lijst || storeLocal) {
      storage = localStorage;
    } else if (!sessionStorage._lijst) {
      appendAlert(
        "<strong>Preview mode!</strong> U heeft de preview " +
          "omgeving gewijziged. Wanneer u dit scherm sluit zullen alle wijzigingen verdwijnen.!",
        "danger"
      );
    }

    for (var index = 0; index < configForm.length; index++) {
      if (
        config.form[index].type == "button" ||
        config.form[index].type == "submit"
      ) {
        continue;
      }
      storage.setItem(
        config.form[index].name,
        configData[config.form[index].name]
      );
    }
    storage.setItem("_lijst", JSON.stringify(transactieLijst));
  }
}

export function restoreSetting() {
  if (typeof Storage !== "undefined") {
    let storage = sessionStorage;
    if (localStorage._lijst) {
      storage = localStorage;
    } else if (!sessionStorage._lijst) {
      return;
    }

    for (var index = 0; index < config.form.length; index++) {
      if (
        config.form[index].type == "button" ||
        config.form[index].type == "submit"
      ) {
        continue;
      }
      configData[config.form[index].name] = storage.getItem(
        config.form[index].name
      );
    }
    fillList( JSON.parse(storage.getItem("_lijst")));
  }
}

export function removeSettings() {
  if (typeof Storage !== "undefined") {
    for (var index = 0; index < config.form.length; index++) {
      if (
        config.form[index].type == "button" ||
        config.form[index].type == "submit" ||
        config.form[index].type == "hidden" ||
        config.form[index].name == ""
      ) {
        continue;
      }
      localStorage.removeItem(config.form[index].name);
      sessionStorage.removeItem(config.form[index].name);
    }
    localStorage.removeItem("_lijst");
    sessionStorage.removeItem("_lijst");
    appendAlert(
      "<strong>Instellingen verwijderd!</strong> U kijkt nu naar de preview " +
        "omgeving.",
      "success"
    );
  }

}
