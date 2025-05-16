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
    transactieLijst[index].id = index;
    let item = new Transactie(transactieLijst[index]);

    if (configData.showHiddenItems == "0" && item.tactic == -1) {
      continue; //
    }
    if (item.startItem) {
      budgetData.firstItem = item;
    }
    item.debug = item.info+'-';
    transacties.push(item);
  }

  setFirstDate();

  let size = transacties.length;
  for (let index = 0; index < size; index++) {
    let item = transacties[index];
    let realDate = item.performDate; //.minusDays(1);
    /* */
    if (
      (configData.bankDatum === null && realDate.isBefore(budgetData.today)) ||
      (configData.bankDatum != null && realDate.isBefore(configData.bankDatum))
    ) {
      //.minusDays(configData.lastenValid)
      item.performDate = item.nextDate();
      item.debug += "N";
    }

    /* */
    realDate = item.nextDate();
    while (!realDate.isAfter(budgetData.nextPeriod)) {
      let nItem = new Transactie(item);
      nItem.performDate = realDate;
      nItem.debug += " A";
      transacties.push(nItem);
      realDate = nItem.nextDate();
    }
    /*  */
    // Zorg er voor dat alle transacties beschikbaar zijn voor de huidige maand.
    realDate = item.prevDate();
    while (!item.nextDate(realDate).isBefore(budgetData.thisPeriod)) {
      let nItem = new Transactie(item);
      nItem.performDate = realDate;

      if (
        configData.bankDatum != null &&
        !realDate.isAfter(configData.bankDatum)
      ) {
        nItem.cloned = 1;
        nItem.debug += "B1";
      } else if (realDate.isBefore(budgetData.thisPeriod)) {
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

    /* */

    // bereken all in- en uit-gave voor deze financiele maand
    if (
      item.isBefore(budgetData.nextPeriod) &&
      !item.isBefore(budgetData.thisPeriod)
    ) {
      item.debug += "*";
      if (item.amount > 0.0) {
        budgetData.baten += item.amount;
      } else if (item.tactic == 0) {
        budgetData.lasten += item.amount;
      }
      switch (item.tactic) {
        case 1:
          budgetData.directBeschikbaar -= item.amount;
          break;
        case 2:
          budgetData.spaarBedrag -= Math.abs(item.amount);
      }
    }

    // bereken het budget per week
    if (
      budgetData.nextWeek.isAfter(item.performDate) &&
      budgetData.thisWeek.isBefore(item.nextDate())
    ) {
      let beginDatum = budgetData.thisWeek.isBefore(item.performDate)
        ? item.performDate
        : budgetData.thisWeek;
      //
      let endDatum = budgetData.nextWeek.isBefore(item.nextDate())
        ? budgetData.nextWeek
        : item.nextDate();

      let aantalDays = beginDatum.until(endDatum, JSJoda.ChronoUnit.DAYS);
      item.debug += "$" + aantalDays;
      budgetData.bedragPerWeek +=
        aantalDays * ((item.tactic == 0)
          ? item.bedragPerDag
          : -Math.abs(item.bedragPerDag));
    }

    /* */
    // bereken in- en uit-gaven die na de laatste banksaldo zijn uitgevoerd.

    if (configData.bankDatum != null && !item.isBefore(configData.bankDatum)) {
      item.debug += "&";
      if (!item.isAfter(budgetData.today)) {
        budgetData.uitgevoerd += item.amount;
      } else if (item.isBefore(budgetData.nextPeriod)) {
        if (item.amount < 0.0) {
          budgetData.uitgaven += item.amount;
        } else {
          budgetData.inkomsten += item.amount;
        }
      }
    }
    /* */

    if (
      item.tactic == 0 &&
      budgetData.nextWeek.isAfter(item.performDate) &&
      budgetData.thisWeek.isBefore(item.nextDate())
    ) {
      item.debug += "#";
      let calcBedrag = item.amount / item.days;

      let tmp1 = item.performDate;
      //
      let tmp2 = budgetData.nextWeek.isBefore(item.nextDate())
        ? budgetData.nextWeek
        : item.nextDate();

      let days = tmp1.until(tmp2, JSJoda.ChronoUnit.DAYS);

      if (!budgetData.today.isBefore(item.performDate)) {
        days = item.days + days;
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

  budgetData.totaalBeschikbaar =
    budgetData.baten +
    budgetData.lasten +
    budgetData.directBeschikbaar +
    budgetData.spaarBedrag;
  budgetData.calcPerDay = budgetData.bedragPerWeek / 7;

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
    configData.bankSaldo -
    configData.beginSaldo +
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

    if (headerMonth != monthYear) {
      let options = { year: "numeric", month: "long" };
      let jsDate = JSJoda.convert(item.performDate).toDate();
      let s = jsDate.toLocaleDateString("nl-NL", options);
      addRow("", "&nbsp;&nbsp;&#128198; " + s);
      if (configData.startOfMaand == 2) {
        firstDay = calcFirstWeekday(item.performDate)._day;
      } else if (configData.startOfMaand == 3){
        firstDay = budgetData.today._day;
      }
      headerMonth = monthYear;
    }
    if (firstOfMonth != monthYear && firstDay <= item.performDate._day) {
      addRow("strong text-body-tertiary", "Begin financiële maand", firstDay);
      firstOfMonth = monthYear;
    }
    if (!(item instanceof Transactie)) {
      addRow(" text-body-tertiary", item.title, item.performDate._day);
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
    //  } else if (budgetData.thisPeriod.isBefore(item.performDate)) {
    //    classes += "bg-danger  bg-opacity-10 ";
    //  }
    if (item.startItem == 1 && configData.startOfMaand == 0) {
      classes += "strong ";
    }
    if (item.performDate.isAfter(budgetData.nextPeriod)) {
      classes += "strike ";
    }



    if (item.tactic == -1) {
      classes += "text-ds-wavy-red ";
    }

    const row = addRow(classes, item.title +" "+ item.debug, item.performDate._day, item.amount);
    row.setAttribute("data-debug", item.debug);
    row.setAttribute("data-bs-toggle", "modal");
    row.setAttribute("data-bs-target", "#transactieModal");
    row.setAttribute("data-bs-whatever", item.id);
  }

  showDetail(main.baten, budgetData.baten);
  showDetail(main.lasten, budgetData.lasten);
  showDetail(main.totaalBeschikbaar, budgetData.totaalBeschikbaar);
  showDetail(main.calcPerWeek, budgetData.bedragPerWeek);
  showDetail(main.spaarBedrag, budgetData.spaarBedrag);
  showDetail(main.directBeschikbaar, budgetData.directBeschikbaar);

  if (budgetData.noSaldo) {
    main.noBankSaldo.classList.remove("d-none");
    main.hasBankSaldo.classList.add("d-none");
  } else {
    main.noBankSaldo.classList.add("d-none");
    main.hasBankSaldo.classList.remove("d-none");
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

function addRow(classes, title, dag = null, bedrag = null) {
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

    if (bedrag === null) {
      cellCol.setAttribute("colspan", "2");
    } else {
      cellCol = document.createElement("td");
      cellCol.setAttribute(
        "class",
        "text-end " + classes + (bedrag < 0 ? " text-danger" : " text-success")
      );
      cellCol.innerText = bedrag.toFixed(2);
      row.appendChild(cellCol);
    }
  }
  main.lijst.appendChild(row);
  return row;
}

function showDetail(elem, bedrag) {
  elem.innerText = bedrag.toFixed(2);
  elem.setAttribute("class", bedrag < 0 ? "text-danger" : "text-success");
  if (bedrag == 0.0 && !elem.parentElement.classList.contains("no-none")) {
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
