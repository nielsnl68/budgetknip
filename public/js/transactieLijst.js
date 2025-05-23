/*jshint esversion: 10 */
"use strict";

export let transactieLijst = [
  {
    id: "1",
    title: "Uitkering ",
    bedrag: 1045.0,
    times: "1",
    startDate: 1558569600000,
    startitem: 1,
    categorie: "1",
    tactic: "0",
  },
  {
    id: "2",
    title: "zorgtoeslag",
    bedrag: 99.0,
    times: "1",
    startDate: 1555718400000,
    startitem: 0,
    categorie: "1",
    tactic: "0",
  },
  {
    id: "3",
    title: "Streaming service",
    bedrag: -10.99,
    times: "1",
    startDate: 1556056800000,
    startitem: 0,
    categorie: "5",
    tactic: "0",
  },
  {
    id: "4",
    title: "Vakantie geld",
    bedrag: 729.0,
    times: "5",
    startDate: 1558569600000,
    startitem: 0,
    categorie: "1",
    tactic: "0",
  },
  {
    id: "5",
    title: "Cak",
    bedrag: -17.5,
    times: "1",
    weeks: "4",
    startDate: 1564963200000,
    startitem: 0,
    categorie: "1",
    tactic: "0",
  },
  {
    id: "6",
    title: "huur woning",
    bedrag: -178.0,
    times: "1",
    startDate: 1556409600000,
    startitem: 0,
    categorie: "2",
    tactic: "0",
  },
  {
    id: "7",
    title: "zorg premie",
    bedrag: -153.94,
    times: "1",
    startDate: 1556488800000,
    startitem: 0,
    categorie: "1",
    tactic: "0",
  },
  {
    id: "8",
    title: "bank kosten",
    bedrag: -1.55,
    times: "1",
    startDate: 1556834400000,
    startitem: 0,
    categorie: "1",
    tactic: "0",
  },
  {
    id: "9",
    title: "Energie kosten",
    bedrag: -137.0,
    times: "1",
    startDate: 1557187200000,
    startitem: 0,
    categorie: "1",
    tactic: "0",
  },
  {
    id: "10",
    title: "Inboedel verzekering",
    bedrag: -3.93,
    times: "1",
    startDate: 1555545600000,
    startitem: 0,
    categorie: "1",
    tactic: "0",
  },
  {
    id: "11",
    title: "TV abonnement",
    bedrag: -31.24,
    times: "1",
    startDate: 1563753600000,
    startitem: 0,
    categorie: "4",
    tactic: "0",
  },
  {
    id: "12",
    title: "Net beheerder",
    bedrag: -16.82,
    times: "1",
    startDate: 1555624800000,
    startitem: 0,
    categorie: "2",
    tactic: "0",
  },
];

export function fillList(list) {
  transactieLijst = list;
}
