/*jshint esversion: 10 */
"use strict";

import { setDate, nextWeek, weekNumber } from "./utils.js";
import { budgetData, configData } from "./configData.js";

const fixedDays = [31, 61, 93, 183, 356, 7]

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
  #selected = false;
  #categorie = null;
  debug = "";

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
        interval = -this.#weeks;
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

  get selected() {
    return this.#selected;
  }
  set selected(selected) {
    this.#selected = selected;
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

  days() {
    if (configData.dagenPerMaand && this.times <= 5) {
      return fixedDays[this.times-1];
    }
    return this.performDate.until(this.nextDate(), JSJoda.ChronoUnit.DAYS);
  }

  get cloned() {
    return this.#cloned;
  }
  set cloned(cloned) {
    this.#cloned = cloned * 1;
  }

  get timesInfo() {
    const info = ["M","M2","Q","H","J","W"]
    let times = info[this.times-1];
    if (this.times==6) times += this.#weeks
    if (configData.startOfMaand==0 && this.#startItem == 1) times += "!"
  }

  toString() {
    return (
      this.performDate.toString("dd/MM/YY") +
      ", " +
      this.timesInfo +
      ", " +
      this.title +
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
        let weekBetween = this.#weeks;
        let weekStart = weekNumber(this.startDate);
        let weekEnd = weekNumber(budgetData.today);
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
