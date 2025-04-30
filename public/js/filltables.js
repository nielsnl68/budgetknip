/*jshint esversion: 10 */
"use strict";

import Transactie from "./transactie.js";
import { transactieLijst } from "./transactieLijst.js";
import { main } from "./doms.js";

import {
  reloadConfig,
  configData,
  setFirstDate,
  storeSetting,
  calcFirstWeekday,
} from "./configData.js";

export function writeTable(storeData = false) {
  let LastenList = [];

  if (storeData) storeSetting();

  let budgetData = reloadConfig();

  main.lijst.innerHTML = "";

  if (transactieLijst.length == 0) {
    addRow("text-danger text-center h5", "Geen Transactie gedefineerd.");
    addRow(
      "blockquote-footer text-center",
      'Klik op <i class="bi bi-calendar-plus-fill"></i> hierboven om uw eerste transactie toe te voegen.'
    );
    document.getElementById("noBankSaldo").classList.remove("d-none");
    return;
  }

  for (let index = 0; index < transactieLijst.length; index++) {
    let mLasten = new Transactie(transactieLijst[index]);
    if (configData.showHiddenItems == "0" && mLasten.tactic == -1) {
      continue; //
    }
    if (mLasten.startItem) {
      budgetData.firstItem = mLasten;
    }
    LastenList.push(mLasten);
  }
  setFirstDate();
  let size = LastenList.length;
  for (let index = 0; index < size; index++) {
    let mLasten = LastenList[index];
    let realDate;
/*
    if (
     // mLasten.isBefore(configData.bankDatum) &&
      mLasten.isBefore(budgetData.today) //.minusDays(configData.lastenValid)
    ) {
      mLasten.performDate = mLasten.nextDate();
      mLasten.title += " N"
    }
/* */
    realDate = mLasten.nextDate();
    while (!realDate.isAfter(configData.nextPeriod)) {
      let nItem = new Transactie(mLasten);
      nItem.performDate = realDate;
      nItem.title += " A"
      LastenList.push(nItem);
      realDate = nItem.nextDate();
    }
/* */
    // Zorg er voor dat alle transacties beschikbaar zijn voor de huidige week.
    realDate = mLasten.performDate;
    while (!mLasten.nextDate(realDate).isBefore(budgetData.thisWeek)) {

      let nItem = new Transactie(mLasten);
      nItem.performDate = realDate.prevDate();

      if (configData.bankDatum != null && !realDate.isAfter(configData.bankDatum)) {
        nItem.cloned = 1;
        nItem.title += " B1"
      } else if (realDate.isBefore(budgetData.startPeriod)) {
        nItem.cloned = 2;
        nItem.title += " B2"
      } else {
        nItem.title += " B0"
      }
      LastenList.push(nItem);
      realDate = nItem.prevDate();
    }
/*  */
  }

  LastenList.sort(SortByDay);
/*
  for (let index = 0; index < LastenList.length; index++) {
    let item = LastenList[index];

    if (item.tactic == -1) {
      if (configData.showHiddenItems == "0") {
        LastenList.splice(index, 1);
        index--;
      }
      continue;
    }

    let myAmount = item.amount;

    if (
      item.tactic <= 1 &&
      item.isBefore(budgetData.nextPeriod) &&
      !item.isBefore(budgetData.startPeriod)
    ) {
      item.title += " *"
      if (myAmount < 0) {
        budgetData.lasten += myAmount;
      } else {
        budgetData.baten += myAmount;
      }
    }

    if (
      item.cloned <= 1 &&
      configData.bankDatum != null &&
      item.isAfter(configData.bankDatum)
    ) {
      if (!item.isAfter(budgetData.today)) {
        budgetData.uitgevoerd += myAmount;
      } else if (item.isBefore(budgetData.nextPeriod)) {
        if (myAmount < 0.0) {
          budgetData.uitgaven += myAmount;
        } else {
          budgetData.inkomsten += myAmount;
        }
      }
    }
    if (
      item.tactic == 0 &&
      budgetData.nextWeek.isAfter(item.performDate) &&
      budgetData.thisWeek.isBefore(item.nextDate())
    ) {
      let CalcInkomen = myAmount / item.daysBetween();

      let tmp1 = item.performDate;
      //
      let tmp2 = budgetData.nextWeek.isBefore(item.nextDate())
        ? budgetData.nextWeek
        : item.nextDate();

      let days = tmp1.until(tmp2, JSJoda.ChronoUnit.DAYS);

      if (!budgetData.today.isBefore(item.performDate)) {
        days = item.daysBetween(false) + days;
      }
      budgetData.weekValue += days * CalcInkomen;

      if (tmp1.isBefore(budgetData.thisWeek)) tmp1 = budgetData.thisWeek;
      days = tmp1.until(tmp2, JSJoda.ChronoUnit.DAYS);
      //Days.daysBetween(tmp1, tmp2).getDays();
      budgetData.calcPerWeek += days * CalcInkomen;
    }

    if (configData.showOldItems == "0" && item.cloned != 0) {
      LastenList.splice(index, 1);
      index--;
      continue;
    }
  }
  budgetData.list = LastenList;

  // configData.beginSaldo = configData.beginSaldo - budgetData.inkomen + budgetData.savings;

  budgetData.batenLasten = budgetData.baten + budgetData.lasten;
  budgetData.calcPerDay = budgetData.calcPerWeek / 7;

  budgetData.weekBudget =
    configData.bankSaldo + budgetData.uitgevoerd - budgetData.weekValue;
  budgetData.weekValue =
    configData.bankSaldo + budgetData.uitgevoerd + budgetData.uitgaven;
  if (budgetData.weekBudget > configData.bankSaldo + budgetData.uitgevoerd) {
    budgetData.weekBudget = configData.bankSaldo + budgetData.uitgevoerd;
  }
  if (budgetData.weekBudget < 0.0) budgetData.weekBudget = 0.0;

  /*
  budgetData.calcPerWeek =
    ((budgetData.inkomen + budgetData.lasten) / budgetData.daysinmonth) * 7;
  budgetData.days = budgetData.today.until(budgetData.today).days();
  budgetData.weeknr = ~~(budgetData.days / 7.0) + 1;

  if (!budgetData.noSaldo) {
    budgetData.uitgegeven = -budgetData.lasten + budgetData.uitgaven;
    budgetData.privateUitgaven = -(
      budgetData.inkomen -
      budgetData.uitgegeven -
      budgetData.uitgevoerd -
      (configData.bankSaldo - configData.beginSaldo)
    );

    budgetData.besteedbaar =
      (configData.bankSaldo -
      configData.beginSaldo) +
      budgetData.uitgevoerd +
      budgetData.uitgaven;

    budgetData.weekvalue = budgetData.weeknr * budgetData.calcPerWeek;
    budgetData.weekBudget = budgetData.weekvalue + budgetData.privateUitgaven;

    if (budgetData.weekBudget > budgetData.besteedbaar)
      budgetData.weekBudget = budgetData.besteedbaar;
    if (budgetData.weekBudget < 0.0) budgetData.weekBudget = 0.0;
  }
*/

  let headerMonth = -1,
    firstOfMonth = -1,
    firstDay = 99;
  for (let index = 0; index < LastenList.length; index++) {
    const item = LastenList[index];
    const monthYear = item.performDate.month() + item.performDate.year() * 12;
    // create an <tr> element, append it to the <tbody> and cache it as a variable:
    if (headerMonth != monthYear) {
      let options = { year: "numeric", month: "long" };
      let jsDate = JSJoda.convert(item.performDate).toDate();
      let s = jsDate.toLocaleDateString("nl-NL", options);
      addRow("", "&nbsp;&nbsp;&#128198; " + s);
      if (configData.startOfMaand == 2) {
        firstDay = calcFirstWeekday(item.performDate)._day;
      }
      headerMonth = monthYear;
    }

    let classes = "";

    if (item.performDate.isBefore(budgetData.today) && item.cloned != 0) {
      classes += "bg-info bg-opacity-10 "; //body-secondary
    } else if (budgetData.startPeriod.isBefore(item.performDate.plusDays(1))) {
      classes += "bg-danger  bg-opacity-10 ";
    }
    if (item.startItem == 1 && configData.startOfMaand == 0) {
      classes += "strong ";
    }
    if (item.performDate.isAfter(budgetData.nextPeriod)) {
      classes += "strike ";
    }


    if (firstOfMonth != monthYear && firstDay <= item.performDate._day) {
      addRow("strong " + classes, "Begin financielle maand", firstDay);
      firstOfMonth = monthYear;
    }

    if (item.tactic == -1) {
      classes += "text-ds-wavy-red ";
    }

    const row = addRow(classes, item.title, item.performDate._day, item.amount);
    row.setAttribute("data-bs-toggle", "modal");
    row.setAttribute("data-bs-target", "#transactieModal");
    row.setAttribute("data-bs-whatever", item.id);
  }

  main.baten.innerText = budgetData.baten.toFixed(2);
  main.baten.setAttribute(
    "class",
    budgetData.baten < 0 ? "text-danger" : "text-success"
  );

  main.lasten.innerText = budgetData.lasten.toFixed(2);
  main.lasten.setAttribute(
    "class",
    budgetData.lasten < 0 ? "text-danger" : "text-success"
  );
  main.batenLasten.innerText = budgetData.batenLasten.toFixed(2);
  main.batenLasten.setAttribute(
    "class",
    budgetData.batenLasten < 0 ? "text-danger" : "text-success"
  );
  main.calcPerWeek.innerText = budgetData.calcPerWeek.toFixed(2);
  main.calcPerWeek.setAttribute(
    "class",
    budgetData.calcPerWeek < 0 ? "text-danger" : "text-success"
  );

  if (!budgetData.noSaldo) {
    document.getElementById("noBankSaldo").classList.add("d-none");
    document.getElementById("BankSaldo").classList.remove("d-none");

    main.bankSaldo.innerText = configData.bankSaldo.toFixed(2);
    main.bankSaldo.setAttribute(
      "class",
      configData.bankSaldo < 0 ? "text-danger" : "text-success"
    );
    main.bankDatum.innerText = configData.bankDatum.toString();

    main.uitgevoerd.innerText = budgetData.uitgevoerd.toFixed(2);
    main.uitgevoerd.setAttribute(
      "class",
      budgetData.uitgevoerd < 0 ? "text-danger" : "text-success"
    );
    main.uitgaven.innerText = budgetData.uitgaven.toFixed(2);
    main.uitgaven.setAttribute(
      "class",
      budgetData.uitgaven < 0 ? "text-danger" : "text-success"
    );
    main.privateUitgaven.innerText = budgetData.privateUitgaven.toFixed(2);
    main.privateUitgaven.setAttribute(
      "class",
      budgetData.privateUitgaven < 0 ? "text-danger" : "text-success"
    );

    main.besteedbaar.innerText = budgetData.besteedbaar.toFixed(2);
    main.besteedbaar.setAttribute(
      "class",
      budgetData.besteedbaar < 0 ? "text-danger" : "text-success"
    );
    main.weekBudget.innerText = budgetData.weekBudget.toFixed(2);
    main.weekBudget.setAttribute(
      "class",
      budgetData.weekBudget < 0 ? "text-danger" : "text-success"
    );
    // main.baten.innerText = budgetData.baten.toFixed(2)
    // main.baten.setAttribute("class", (budgetData.baten < 0 ? "text-danger" : "text-success"))
  } else {
    document.getElementById("noBankSaldo").classList.remove("d-none");
    document.getElementById("BankSaldo").classList.add("d-none");
  }
  console.log(budgetData, configData);
}

function addRow(classes, title, dag = null, amount = null) {
  const row = document.createElement("tr");
  let cellCol;
  if (dag === null) {
    cellCol = document.createElement("td");
    cellCol.setAttribute("colspan", "3");
    cellCol.setAttribute(
      "class",
      classes
        ? classes
        : "bg-dark-subtle border-0 border-bottom border-secondary border-2"
    );
    cellCol.innerHTML = title;
    row.appendChild(cellCol);
  } else {
    cellCol = document.createElement("td");
    cellCol.setAttribute("class", "text-body text-end " + classes);
    cellCol.innerText = dag;
    row.appendChild(cellCol);

    cellCol = document.createElement("td");
    cellCol.setAttribute("class", "text-body " + classes);
    cellCol.innerText = title;
    row.appendChild(cellCol);

    if (amount === null) {
      cellCol.setAttribute("colspan", "2");
    } else {
      cellCol = document.createElement("td");
      cellCol.setAttribute(
        "class",
        "text-end " + classes + (amount < 0 ? " text-danger" : " text-success")
      );
      cellCol.innerText = amount.toFixed(2);
      row.appendChild(cellCol);
    }
  }
  main.lijst.appendChild(row);
  return row;
}

export function SortByDay(s1, s2) {
  let result = s1.performDate.compareTo(s2.performDate);
  if (result === 0) {
    result = s1.id == s2.id ? 0 : s1.id < s2.id ? -1 : 1;
  }
  return result;
}
