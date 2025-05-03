import { bankSaldo as dom } from "./doms.js";
import { budgetData, configData } from "./configData.js";
import { transactieLijst } from "./transactieLijst.js";
import { writeTable, SortByDay } from "./filltables.js";
import { setDate } from "./utils.js";

export default function () {
  dom.modal.addEventListener("show.bs.modal", (event) => {
    dom.form.reset();
    dom.form.classList.remove("was-validated");
    writeTable();
    let bankSaldo = configData.bankSaldo * 1.0;
    if (!configData.bankDatum) {
      bankSaldo += configData.beginSaldo * 1.0;
    }
    dom.listPayments.innerHTML = "";
    let items = {};
    for (var loop = 0; loop < budgetData.list.length; loop++) {
      let item = budgetData.list[loop];
      item.index = loop;

      if (
        item.isBefore(budgetData.today) &&
        (budgetData.bankDatum == null || !item.isBefore(budgetData.bankDatum))
      ) {
        item.selected = true;
        bankSaldo += item.amount;
        if (
          !item.isBefore(budgetData.today.minusDays(configData.lastenValid)) &&
          (!("B" + item.id in items) ||
            item.isAfter(items["B" + item.id].performDate))
        ) {
          items["B" + item.id] = item;
        }
      } else if (
        !item.isAfter(budgetData.today.plusDays(configData.lastenValid)) &&
            (!("a" + item.id in items)) ||
            item.isBefore(items["a" + item.id].performDate)

      ) {
        items["a" + item.id] = item;
      }
    }
    items = Object.values(items);
    items.sort(SortByDay);

    for (const value in items) {
      addItem(items[value]);
    }
    dom.BankSaldo.value = bankSaldo.toFixed(2);
    dom.bankDatum.value = budgetData.today.toString();
  });

  dom.form.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!dom.form.checkValidity()) {
      dom.form.classList.add("was-validated");
      confirm("Vul de ontbrekende velden in voordat u kunt doorgaan.");
    } else {
      let collection = dom.form["listPayments"];
      for (let i = 0; i < collection.length; i++) {
        if (collection[i].checked) {
          let item = budgetData.list[collection[i].value * 1];
          transactieLijst[item.id].startDate = item.nextDate();
        }
      }

      configData.bankSaldo = dom.BankSaldo.value * 1.0;
      if (dom.bankDatum.value) {
        configData.bankDatum = setDate(dom.bankDatum.valueAsNumber);
      } else {
        configData.bankDatum = budgetData.today;
      }
      bootstrap.Modal.getInstance(dom.modal).hide();
      writeTable(true);
    }
  });
}

function addItem(item) {
  const row = document.createElement("li");
  row.setAttribute("class", "list-group-item");
  let cellCol;
  cellCol = document.createElement("input");
  cellCol.setAttribute("type", "checkbox");
  cellCol.setAttribute("class", "form-check-input mx-2 listPayments");
  cellCol.setAttribute("name", "listPayments");
  cellCol.setAttribute("data-amount", item.amount);
  cellCol.setAttribute("value", item.index);
  cellCol.setAttribute("id", "listPayments_" + item.index);
  cellCol.checked = item.selected;

  row.appendChild(cellCol);

  cellCol = document.createElement("label");
  cellCol.setAttribute("class", "form-check-label");
  cellCol.setAttribute("for", "listPayments_" + item.index);
  cellCol.innerHTML = item.title;
  row.appendChild(cellCol);

  cellCol = document.createElement("span");
  cellCol.setAttribute(
    "class",
    item.amount < 0 ? " text-danger" : " text-success"
  );
  cellCol.innerHTML = item.amount.toFixed(2);
  row.appendChild(cellCol);
  dom.listPayments.appendChild(row);
}
