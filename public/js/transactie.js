/*jshint esversion: 10 */
"use strict";

import { setDate, nextWeek } from "./utils.js";
import { budgetData, configData } from "./configData.js";

export default class Transactie {
  #id;
  #title = "";
  #amount = 0.0;
  #startItem = false;
  #startDate = null;
  #finalDate = null;
  #performDate = null;
  #times = 1;
  #weeks = 1;
  #tactic = 0;

  #cloned = 0;

  #categorie = null;


  constructor(data = null) {
    if (data) {
      this.id = data.id;
      this.title = data.title;
      this.amount = data.amount;
      this.times = data.times;
      this.weeks = data.weeks;
      this.tactic = data.tactic;
      this.startDate = data.startDate;
      this.finalDate = data.finalPayment;
      this.startItem = data.startitem;
      this.categorie = data.categorie;
    }
  }

  get id() {
    return this.#id;
  }
  set id(id) {
    this.#id = id * 1;
  }

  get title() {
    return this.#title;
  }
  set title(title) {
    this.#title = title;
  }

  get amount() {
    return this.#amount;
  }
  set amount(amount) {
    this.#amount = amount * 1.0;
  }

  get startItem() {
    return this.#startItem;
  }
  set startItem(startItem) {
    this.#startItem = startItem;
  }

  get categorie() {
    return this.#categorie;
  }
  set categorie(categorie) {
    this.#categorie = categorie * 1;
  }

  get times() {
    return this.#times;
  }
  set times(times) {
    this.#times = times * 1;
  }

  get weeks() {
    return this.#weeks;
  }
  set weeks(weeks) {
    this.#weeks = weeks * 1;
  }

  get interval() {
    var interval = this.times;
    switch (interval) {
      case 4: //  <item>Half jaar</item>
        interval = 6;
        break;
      case 5: //  <item>Per jaar</item>
        interval = 12;
        break;
      case 6: //  <item>Per week</item>
        interval = -this.weeks;
        break;
    }
    return interval;
  }

  get tactic() {
    return this.#tactic;
  }
  set tactic(tactic) {
    this.#tactic = tactic * 1;
  }

  get startDate() {
    return this.#startDate;
  }
  set startDate(startDate) {
    this.#performDate = null;
    this.#startDate = setDate(startDate);
  }

  get finalDate() {
    return this.#finalDate;
  }
  set finalDate(startDate) {
    this.#finalDate = setDate(startDate);
  }

  get performDate() {
    if (this.#performDate == null) {
      this.calcPerformDate();
    }
    return this.#performDate;
  }
  set performDate(performDate) {
    this.#performDate = setDate(performDate);
  }

  clearPerformDate() {
    this.#performDate = null;
  }

  nextDate(date = null) {
    if (date === null) date = this.performDate;
    let interval = this.interval;
    let result;
    if (interval < 0) {
      result = date.plusWeeks(-interval);
    } else {
      result = date.plusMonths(interval);
    }
    return result;
  }

  prevDate(date = null) {
    if (date === null) date = this.performDate;
    let interval = this.interval * 1;
    let result;
    if (interval < 0) {
      result = date.minusWeeks(-interval);
    } else {
      result = date.minusMonths(interval);
    }

    return result;
  }

  isBefore(testDate = null) {
    if (!testDate) return false
    return this.performDate.isBefore(testDate);
  }

  isAfter(testDate= null) {
    if (!testDate) return false
    return this.performDate.isAfter(testDate);
  }

  daysBetween(fixed = true) {
    if (this.times <= 3 && fixed) {
      return this.times * 31;
    }
    return this.performDate.until(this.nextDate(), JSJoda.ChronoUnit.DAYS);
  }

  get day() {
    return this.performDate.dayOfMonth();
  }

  get month() {
    let now = budgetData.today;
    let year = (this.performDate.year() - now.year()) * 12;
    return this.performDate.monthValue() - now.monthValue() + year;
  }

  get cloned() {
    return this.#cloned;
  }
  set cloned(cloned) {
    if (typeof value === "boolean") {
      this.#cloned = cloned ? 1 : 0;
    } else {
      this.#cloned = cloned * 1;
    }
  }

  toString() {
    return (
      this.title +
      ", " +
      this.performDate.toString("dd/MM/YY") +
      ", " +
      this.amount
    );
  }

  calcPerformDate() {
    let today = budgetData.today;

    this.performDate = this.startDate
      .withMonth(today.month())
      .withYear(today.year());
    switch (this.times) {
      case 1: //      <item>Elke maand</item>
        if (
          configData.bankDatum != null &&
          this.isBefore(configData.bankDatum)
        ) {
          this.#performDate = this.nextDate();
        }
        break;
      case 2: //  <item>Per 2 maanden</item>
      case 3: //  <item>Per kwartaal</item>
      case 4: //  <item>Half jaar</item>
        let z = this.interval;
        let months = (this.startDate.month() % z) - (today.month() % z);
        this.#performDate = this.performDate.plusMonths(months);
        break;
      case 5: //  <item>Per jaar</item>
        this.#performDate = this.startDate.withYear(today.year());
        break;
      case 6: //  <item>Per week</item>
        let weekBetween = this.weeks();
        let weekStart = calcWeeks(this.startDate);
        let weekEnd = calcWeeks(budgetData.today);
        let weeks = (weekStart % weekBetween) - (weekEnd % weekBetween);
        let realDate = today.plusWeeks(weeks);
        this.#performDate = nextWeek(
          realDate,
          this.startDate.dayOfWeek().value()
        );
        break;
    }
  }
}
