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
  let transacties = [];

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
    transactieLijst[index].id = index
    let mLasten = new Transactie(transactieLijst[index]);

    if (configData.showHiddenItems == "0" && mLasten.tactic == -1) {
      continue; //
    }
    if (mLasten.startItem) {
      budgetData.firstItem = mLasten;
    }

    transacties.push(mLasten);
  }

  setFirstDate();

  let size = transacties.length;
  for (let index = 0; index < size; index++) {
    let mLasten = transacties[index];
    let realDate = mLasten.performDate; //.minusDays(1);
    /* */
    if (
      (configData.bankDatum === null && realDate.isBefore(budgetData.today)) ||
      (configData.bankDatum != null && realDate.isBefore(configData.bankDatum))
    ) {
      //.minusDays(configData.lastenValid)
      mLasten.performDate = mLasten.nextDate();
      mLasten.debug += "N";
    }

    /* */
    realDate = mLasten.nextDate();
    while (!realDate.isAfter(budgetData.nextPeriod)) {
      let nItem = new Transactie(mLasten);
      nItem.performDate = realDate;
      nItem.debug += " A";
      transacties.push(nItem);
      realDate = nItem.nextDate();
    }
    /*  */
    // Zorg er voor dat alle transacties beschikbaar zijn voor de huidige maand.
    realDate = mLasten.prevDate();
    while (!mLasten.nextDate(realDate).isBefore(budgetData.startPeriod)) {
      let nItem = new Transactie(mLasten);
      nItem.performDate = realDate;

      if (
        configData.bankDatum != null &&
        !realDate.isAfter(configData.bankDatum)
      ) {
        nItem.cloned = 1;
        nItem.debug += "B1";
      } else if (realDate.isBefore(budgetData.startPeriod)) {
        nItem.cloned = 2;
        nItem.debug += "B2";
      } else {
        nItem.debug += "B0";
      }
      transacties.push(nItem);
      realDate = nItem.prevDate();
    }
    /*  */
  }

  for (let index = 0; index < transacties.length; index++) {
    let item = transacties[index];

    if (item.tactic == -1) {
      continue;
    }

    let myAmount = item.amount;
    /* */
    if (
      item.isBefore(budgetData.nextPeriod) &&
      !item.isBefore(budgetData.startPeriod)
    ) {
      item.debug += " *" + item.tactic;
      switch (item.tactic) {
        case 0:
          if (myAmount < 0) {
            budgetData.lasten += myAmount;
          } else {
            budgetData.baten += myAmount;
          }
          break;
        case 1:
          budgetData.directBeschikbaar += myAmount;
          break;
        case 2:
          budgetData.spaarBedrag += myAmount;
      }
    }
    /* */

    if (
      configData.bankDatum != null &&
      item.isAfter(configData.bankDatum)
    ) {
      item.debug += " &"
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
    /* */

    if (
      item.tactic == 0 &&
      budgetData.nextWeek.isAfter(item.performDate) &&
      budgetData.thisWeek.isBefore(item.nextDate())
    ) {
      item.debug += " #"
      let calcBedrag = myAmount / item.days();

      let tmp1 = item.performDate;
      //
      let tmp2 = budgetData.nextWeek.isBefore(item.nextDate())
        ? budgetData.nextWeek
        : item.nextDate();

      let days = tmp1.until(tmp2, JSJoda.ChronoUnit.DAYS);

      if (!budgetData.today.isBefore(item.performDate)) {
        days = item.days() + days;
      }
      budgetData.weekValue += days * calcBedrag;

      if (tmp1.isBefore(budgetData.thisWeek)) tmp1 = budgetData.thisWeek;
      days = tmp1.until(tmp2, JSJoda.ChronoUnit.DAYS);
      //Days.daysBetween(tmp1, tmp2).getDays();
      budgetData.calcPerWeek += days * calcBedrag;
    }
    /* */
  }
  budgetData.list = transacties;

  // configData.beginSaldo = configData.beginSaldo - budgetData.inkomen + budgetData.savings;

  budgetData.totaalBeschikbaar = budgetData.baten + budgetData.lasten;
  budgetData.calcPerDay = budgetData.calcPerWeek / 7;

  budgetData.weekBudget =
    configData.bankSaldo + budgetData.uitgevoerd - budgetData.weekValue;
  budgetData.weekValue =
    configData.bankSaldo + budgetData.uitgevoerd + budgetData.uitgaven;
  if (budgetData.weekBudget > configData.bankSaldo + budgetData.uitgevoerd) {
    budgetData.weekBudget = configData.bankSaldo + budgetData.uitgevoerd;
  }
  if (budgetData.weekBudget < 0.0) budgetData.weekBudget = 0.0;

  /* */
  budgetData.calcPerWeek =
    ((budgetData.inkomen + budgetData.lasten) / budgetData.daysinmonth) * 7;
  budgetData.days = budgetData.today.until(budgetData.today).days();
  budgetData.weeknr = ~~(budgetData.days / 7.0) + 1;

  //if (!budgetData.noSaldo) {
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
  //}
/* */

  transacties.push({
    performDate: budgetData.today,
    title: " Vandaag",
    id: -1,
    cloned: 0,
  });
  transacties.push({
    performDate: budgetData.thisWeek,
    title: " Begin deze week",
    id: -2,
    cloned: 0,
  });
  transacties.push({
    performDate: budgetData.nextWeek,
    title: " Begin nieuwe week",
    id: -2,
    cloned: 0,
  });

  transacties.sort(SortByDay);

  let headerMonth = -1,
    firstOfMonth = -1,
    firstDay = 99;
  for (let index = 0; index < transacties.length; index++) {
    const item = transacties[index];
    const monthYear = item.performDate.month() + item.performDate.year() * 12;

    if (configData.showOldItems == "0" && item.cloned != 0) {
      continue;
    }

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

    if (!(item instanceof Transactie)) {
      addRow(" text-body-tertiary", item.title , item.performDate._day);
      transacties.splice(index, 1);
      index--;
      continue;
    }
    let classes = "";
    if (
      (configData.bankDatum === null && item.isBefore(budgetData.today)) ||
      (configData.bankDatum != null && item.isBefore(configData.bankDatum))
    ) {
      classes += "bg-danger  bg-opacity-10 ";
    }
    //  if (item.performDate.isBefore(budgetData.today) && item.cloned != 0) {
    //    classes += "bg-info bg-opacity-10 "; //body-secondary
    //  } else if (budgetData.startPeriod.isBefore(item.performDate)) {
    //    classes += "bg-danger  bg-opacity-10 ";
    //  }
    if (item.startItem == 1 && configData.startOfMaand == 0) {
      classes += "strong ";
    }
    if (item.performDate.isAfter(budgetData.nextPeriod)) {
      classes += "strike ";
    }

    if (firstOfMonth != monthYear && firstDay <= item.performDate._day) {
      addRow("strong " + classes, "Begin financiële maand", firstDay);
      firstOfMonth = monthYear;
    }

    if (item.tactic == -1) {
      classes += "text-ds-wavy-red ";
    }

    const row = addRow(
      classes,
      item.title ,
      item.performDate._day,
      item.amount
    );
    row.setAttribute("data-debug", item.timesInfo + item.debug);
    row.setAttribute("data-bs-toggle", "modal");
    row.setAttribute("data-bs-target", "#transactieModal");
    row.setAttribute("data-bs-whatever", item.id);
  }

  showDetail(main.baten, budgetData.baten);
  showDetail(main.lasten, budgetData.lasten);
  showDetail(main.totaalBeschikbaar, budgetData.totaalBeschikbaar);
  showDetail(main.calcPerWeek, budgetData.calcPerWeek);
  showDetail(main.spaarBedrag, budgetData.spaarBedrag);
  showDetail(main.directBeschikbaar, budgetData.directBeschikbaar);

  if (!budgetData.noSaldo) {
    document.getElementById("noBankSaldo").classList.add("d-none");
  } else {
    document.getElementById("noBankSaldo").classList.remove("d-none");
  }

  showDetail(main.bankSaldo, configData.bankSaldo);
  if (configData.bankDatum) {
    main.bankDatum.innerText = configData.bankDatum.toString();
  }
  showDetail(main.berekendSaldo, budgetData.berekendSaldo);

  showDetail(main.uitgevoerd, budgetData.uitgevoerd);
  showDetail(main.uitgaven, budgetData.uitgaven);
  showDetail(main.inkomsten, budgetData.inkomsten);
  showDetail(main.privateUitgaven, budgetData.privateUitgaven);

  showDetail(main.besteedbaar, budgetData.besteedbaar);
  showDetail(main.weekBudget, budgetData.weekBudget);

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

function showDetail(elem, bedrag) {
  elem.innerText = bedrag.toFixed(2);
  elem.setAttribute("class", bedrag < 0 ? "text-danger" : "text-success");
  if (bedrag == 0.0) {
    elem.parentElement.classList.add("d-none");
  } else {
    elem.parentElement.classList.remove("d-none");
  }
}

export function SortByDay(s1, s2) {
  let result = s1.performDate.compareTo(s2.performDate);
  if (result === 0) {
    result = s1.id == s2.id ? 0 : s1.id < s2.id ? -1 : 1;
  }
  return result;
}
