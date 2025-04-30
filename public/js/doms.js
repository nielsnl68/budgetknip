/*jshint esversion: 10 */
"use strict";

export const main = {
  lijst: "transactieLijstBody",
  baten: "baten",
  lasten: "lasten",
  batenLasten: "batenLasten",
  calcPerWeek: "calcPerWeek",

  noBankSaldo: "noBankSaldo",
  hasBankSaldo: "BankSaldo",

  bankSaldo: "saldo",
  bankDatum: "saldoDate",

  uitgevoerd: "uitgevoerd",
  uitgaven: "uitgaven",
  inkomsten: "inkomsten",
  privateUitgaven: "privateUitgaven",
  besteedbaar: "besteedbaar",
  weekBudget: "weekBudget",

  demoModeAlert: "demoModeAlert",
}

export const config = {
  modal: "configModal",
  form: "configForm",
  verwijder: "verwijderConfig",
  opzetten : "opzettenConfig",
  newSetupModal: "newSetupModal",
  kopie : "copyTransacties",
  nieuw : "nieuweTransacties",
};
export const transactie ={
  modal: "transactieModal",
  form: "transactieForm",
  verwijder: "verwijderTransactie",

  header: "transactieModalLabel",

  Frequentie: "inputFrequentie",
  Times: "inputFrequentie",
  Weeks: "inputWeeks",
  DirectionOutput: "inputDirectionOutput",
  StartItem: "inputStartItem",
  startItemDiv: "startItemDiv",
  TacticIgnore: "inputTacticIgnore",
};
export const bankSaldo = {
  modal: "bankSaldoModel",
  form: "bankSaldoForm",

  BankSaldo: "inputBankSaldo",
  bankDatum: "inputbankDatum",
  Payments: "selectPayments",
};

async function includeHTML() {
  const includes = document.getElementsByTagName('include');
  for (const i of includes) {
      const filePath = i.getAttribute('src');
      const key = i.getAttribute('key');
      console.log("fetch", filePath, key)
      let y = await fetch(filePath).then(file => {
          file.text().then(content => {
              i.insertAdjacentHTML('afterend', content);
              i.remove();
              queryElementsFor(elements[key]);
              console.log("html added")
            });
      });
      console.log("fetched")
  };
}

function queryElementsFor (modal) {
  for (const [key, value] of Object.entries(modal)) {
    modal[key] = document.getElementById(value);
  }
}

function setupThemeSupport() {
  const themeIcons = {light: "bi bi-sun-fill", dark: "bi bi-moon-stars-fill" }
  const themeSwitcher = document.querySelector('#bd-theme')
  const themeSwitcherText = document.querySelector('#bd-theme-text')
  const themeSwitcherIcon = document.querySelector('#bd-theme-icon')

  const getStoredTheme = () => {
    let storedTheme = localStorage.getItem('theme')
    if (storedTheme) {
      return storedTheme
    }
    storedTheme = document.documentElement.getAttribute('data-bs-theme')
    if (storedTheme) {
      return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const setStoredTheme = theme => {
    if (theme === 'auto') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    document.documentElement.setAttribute('data-bs-theme', theme)
    themeSwitcher.setAttribute('aria-label', `${themeSwitcherText.textContent} (${theme})`);
    themeSwitcherIcon.setAttribute('class',themeIcons[theme]);
    localStorage.setItem('theme', theme)
  }

  themeSwitcher.addEventListener('click', () => {
    const theme = getStoredTheme()=="dark"?"light":"dark";
    setStoredTheme(theme)
  })

  window.addEventListener('DOMContentLoaded', () => {
    setStoredTheme(getStoredTheme())
  })

}

function handleModalFocus() {
  document.querySelectorAll(".modal").forEach(function (elem) {
    elem.addEventListener("shown.bs.modal", (event) => {
      setTimeout(function () {
        let form = elem.querySelector("form");
        if (form) form[0].focus();
      }, 500);
    });
    elem.addEventListener("hide.bs.modal", (event) => {
      document.activeElement.blur();
    });
  });
}


export function initModals() {
  queryElementsFor(main );
  queryElementsFor(config );
  queryElementsFor(transactie );
  queryElementsFor(bankSaldo );

  setupThemeSupport();
  handleModalFocus();

}
