/*jshint esversion: 10 */
"use strict";
export const localDate = JSJoda.LocalDate;

export function appendAlert (message, type) {
  const alertPlaceholder = document.getElementById("AlertPlaceholder");
  alertPlaceholder.innerHTML = [
    `<div class="mb=0 alert alert-${type} alert-dismissible" role="alert">`,
    '  <div class="container">',
    `    <div>${message}</div>`,
    '    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    "  </div>",
    "</div>",
  ].join("");
};

export function setDate(value) {
  if (typeof value === "string" && value.length == 10) {
    value = localDate.parse(value);
  } else if (typeof value === "number" && value > 1) {
    value =  localDate.ofInstant(JSJoda.Instant.ofEpochMilli(value));
  } else if (!(value instanceof localDate)) {
    value = null;
  }
  return value;
}

export function nextWeek(current, dayOfWeek= null, incl= true) {
  const old = current.dayOfWeek().value();
  if (dayOfWeek === null) dayOfWeek = old;
  if (dayOfWeek < old || (incl && dayOfWeek == old)) {
    dayOfWeek += 7;
  }
  return current.plusDays(dayOfWeek - old);
}

export function weekNumber(testing) {
  let start = localDate.parse("2020-01-01");
  let sday = start.dayOfWeek().value();
  let start2 = start.minusDays(sday)
  let finish = setDate(testing);
  let fday = finish.dayOfWeek().value();

  let finish2 = finish.plusDays(6-(fday))
  let result = start2.until(finish2, JSJoda.ChronoUnit.WEEKS);
  console.log(start, sday, start2, finish, fday, finish2, result);
  return result;
}

weekNumber(localDate.parse("2021-01-01"))


export function updateObject(data, form ) {
  for (var index = 0; index < form.length; index++) {
    if (
      form[index].type == "button" ||
      form[index].type == "submit" ||
      form[index].type == "hidden" ||
      form[index].name == ""
    ) {
      continue;
    }
    let key = form[index].name;
    if (form[index].type == "radio") {
      if (form[index].checked)  data[key] = form[index].value;
    } else if (form[index].type == "checkbox") {
      data[key] = form[index].checked ? "1" : "0";
    } else if (form[index].type == "date") {
      data[key] = setDate(form[index].valueAsNumber);
    } else if (form[index].inputMode == "decimal") {
      data[key] = form[index].value * 1.0;
    } else {
      data[key] = form[index].value;
    }
  }
  return data;
}
