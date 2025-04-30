import { config, transactie } from "./doms.js";
import { configData, removeSettings, storeSetting } from "./configData.js";
import { fillList } from "./transactieLijst.js";
import { writeTable } from "./filltables.js";
import { updateObject } from "./utils.js";

export default function () {
  config.modal.addEventListener("show.bs.modal", (event) => {
    config.form.reset();
    config.form.classList.remove("was-validated");
    if (typeof Storage !== "undefined") {
      if (localStorage._lijst) {
        config.opzetten.classList.add("d-none");
        config.verwijder.classList.remove("d-none");
      } else {
        config.opzetten.classList.remove("d-none");
        config.verwijder.classList.add("d-none");
      }
    }
    for (var index = 0; index < config.form.length; index++) {
      if (
        config.form[index].type == "button" ||
        config.form[index].type == "submit"
      ) {
        continue;
      }
      if (config.form[index].type == "checkbox") {
        config.form[index].checked = configData[config.form[index].name] == 1;
      } else {
        config.form[index].value = configData[config.form[index].name];
      }
    }
    config.form["beginSaldo"].value = parseFloat(
      configData["beginSaldo"]
    ).toFixed(2);
  });

  config.form.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!config.form.checkValidity()) {
      config.modal.classList.add("was-validated");
      confirm("Vul de ontbrekende velden in voordat u kunt doorgaan.");
    } else {
      updateObject(configData, config.form);
      bootstrap.Modal.getInstance(config.modal).hide();
      writeTable(true);
    }
  });

  config.verwijder.addEventListener("click", (event) => {
    if (
      confirm(
        "Wilt u de huidige configuratie werkelijk verwijderen?\nWanneer u dit doet dan worden de Preview data opnieuw getoond."
      )
    ) {
      removeSettings();
      location.reload();
    }
  });

  config.opzetten.addEventListener("click", (event) => {
    if (!config.form.checkValidity()) {
      config.modal.classList.add("was-validated");
      confirm("Vul de ontbrekende velden in voordat u kunt doorgaan.");
    } else {
      bootstrap.Modal.getInstance(config.modal).hide();
      new bootstrap.Modal(config.newSetupModal, {}).show();
    }
  });

  config.kopie.addEventListener("click", (event) => {
    storeSetting(true);
    writeTable();
  });

  config.nieuw.addEventListener("click", (event) => {
    if (
      !sessionStorage._lijst ||
      confirm("Weet u zeker dat u de huidige wijziging die u al heeft gemaakt wilt vervangen?")
    ) {
      updateObject(configData, config.form);

      configData.volgende_ID = 0;
      fillList([]);

      storeSetting(true);
      writeTable();
      new bootstrap.Modal(transactie.modal, {}).show();
    }
  });
}
