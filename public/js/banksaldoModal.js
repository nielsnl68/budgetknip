import { bankSaldo as dom } from "./doms.js";
import { budgetData, configData } from "./configData.js";
import { writeTable } from "./filltables.js";
import { setDate }  from "./utils.js";

export default function () {
  dom.modal.addEventListener("show.bs.modal", (event) => {
    dom.form.reset();
    dom.form.classList.remove("was-validated");
    writeTable();
    var bankSaldo = configData.bankSaldo * 1.0;
    if (!configData.bankDatum) {
      bankSaldo += configData.beginSaldo * 1.0;
    }

    while (dom.Payments.options.length > 0) {
      dom.Payments.remove(0);
    }
    for (var loop = 0; loop < budgetData.list.length; loop++) {
      var item = budgetData.list[loop];
      var option = new Option(
        item.desc + "\t" + item.amount.toFixed(2) + "",
        item.amount.toFixed(2) + "|" + loop
      );
      if (
        item.isBefore(budgetData.today) &&
        (budgetData.bankDatum == null ||
          !item.RealDate.isBefore(budgetData.bankDatum))
      ) {
        option.selected = true;
        option.defaultSelected = true;
        bankSaldo += item.amount;
      }
      dom.Payments.add(option);
    }
    dom.BankSaldo.value = bankSaldo.toFixed(2);
  });

  dom.form.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!dom.form.checkValidity()) {
      dom.form.classList.add("was-validated");
      confirm("Vul de ontbrekende velden in voordat u kunt doorgaan.");
    } else {
      let collection = dom.Payments.selectedOptions;
      for (let i = 0; i < collection.length; i++) {}

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
