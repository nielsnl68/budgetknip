import { config } from "./doms.js";
import { configData } from "./configData.js";
import { writeTable } from "./filltables.js";
import { updateObject } from "./utils.js";

export default function () {
  config.modal.addEventListener("show.bs.modal", (event) => {
    config.form.reset();
    config.form.classList.remove("was-validated");

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


}
