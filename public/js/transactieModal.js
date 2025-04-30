/*jshint esversion: 10 */
"use strict";

import { transactie as dom } from "./doms.js";
import { transactieLijst } from "./transactieLijst.js";
import { configData } from "./configData.js";
import { setDate, updateObject }  from "./utils.js";
import { writeTable } from "./filltables.js";

export default function () {
  dom.modal.addEventListener("show.bs.modal", (event) => {
    // Button that triggered the modal
    // Extract info from data-bs-* attributes
    let recipient = -1;
    const button = event.relatedTarget;
    if (button) {
      recipient = button.getAttribute("data-bs-whatever");
    }

    dom.form.reset();
    dom.form.classList.remove("was-validated");
    dom.form.setAttribute("data-key", -1);
    var item = null;

    if (recipient < 0) {
      dom.header.textContent = "Nieuwe transactie invoeren";
      dom.verwijder.disabled = true;
    } else {
      dom.header.textContent = "Bestaande transactie aanpassen.";
      dom.verwijder.disabled = false;
      for (var index = 0; index < transactieLijst.length; index++) {
        if (transactieLijst[index].id == recipient) {
          item = transactieLijst[index];
          break;
        }
      }
      if (item == null) {
        alert("De geselecteerde transactie is niet gevonden.");
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      dom.form.setAttribute("data-key", index);
      for (var index = 0; index < dom.form.length; index++) {

        const key = dom.form[index].name;
        if (
          dom.form[index].type == "button" ||
          dom.form[index].type == "submit" ||
          item[key] === undefined
        ) {
          continue;
        }

        const value = item[key];
        if (key == "startitem") {
          dom.StartItem.checked = value == 1;
          dom.StartItem.setAttribute("data-preset", value);
        } else if (key == "amount") {
          dom.form[key].value = item.amount.toFixed(2);
          if (item.amount < 0) {
            dom.form[key].value = (-item.amount).toFixed(2);
            dom.DirectionOutput.checked = true;
          }
        } else if (dom.form[key].type == "date") {
          dom.form[key].value = setDate(value);
        } else {
          dom.form[key].value = value;
        }
      }
      if (configData.startOfMaand == 0) {
        dom.startItemDiv.classList.remove("d-none");
        if (dom.StartItem.checked || item["amount"] < 0) {
          dom.StartItem.disabled = true;
        } else {
          dom.StartItem.disabled = false;
        }
        if (dom.StartItem.checked) {
          dom.DirectionOutput.disabled = true;
          dom.TacticIgnore.disabled = true;
        } else {
          dom.DirectionOutput.disabled = false;
          dom.TacticIgnore.disabled = false;
        }
      } else {
        dom.startItemDiv.classList.add("d-none");
      }

      if (dom.Times.value == 6) {
        dom.Weeks.classList.remove("d-none");
      } else {
        dom.Weeks.classList.add("d-none");
      }
    }
  });

  let elementsArray = document.querySelectorAll(".updateStartItem");

  elementsArray.forEach(function (elem) {
    elem.addEventListener("change", (event) => {
      if (dom.Frequentie.value == 6) {
        dom.Weeks.classList.remove("d-none");
        dom.Weeks.value = 1;
      } else {
        dom.Weeks.classList.add("d-none");
      }
      if (configData.startOfMaand == 0) {
        if (
          dom.StartItem.checked &&
          (dom.DirectionOutput.checked || dom.TacticIgnore.checked)
        ) {
          event.preventDefault();
          event.stopPropagation();
          alert("Sorry, deze aanpassing is niet mogelijk.");
        } else if (dom.StartItem.checked) {
          dom.DirectionOutput.disabled = true;
          dom.TacticIgnore.disabled = true;
        } else {
          dom.DirectionOutput.disabled = false;
          dom.TacticIgnore.disabled = false;
        }
        if (dom.StartItem.getAttribute("data-preset") != 1) {
          dom.StartItem.disabled =
            dom.DirectionOutput.checked || dom.TacticIgnore.checked;
        }
      }
    });
  });

  dom.form.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!dom.form.checkValidity()) {
      dom.form.classList.add("was-validated");
      alert("Vul de ontbrekende velden in voordat u kunt doorgaan.");
    } else {
      var pos = dom.form.getAttribute("data-key") * 1;
      var item = {};
      if (pos == -1) {
        pos = configData.volgende_ID++;
      } else {
        item = transactieLijst[pos];
      }
      updateObject (item, dom.form);

      if (dom.DirectionOutput.checked) {
        item.amount = item.amount * -1.0;
      }
      if (item.StartItem =="1") {
        for (var x = 0; x < transactieLijst.length; x++) {
          transactieLijst[x].startitem = "0";
        }
      }
      transactieLijst[pos] = item;
      bootstrap.Modal.getInstance(dom.modal).hide();
      writeTable(true);
    }
  });
}
