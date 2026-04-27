const HOUR_MS = 60 * 60 * 1000;

const range = (min, max = min) => Object.freeze([min, max]);

const TIER_EFFECTS = Object.freeze({
  1: Object.freeze({
    incomePct: range(10), cleanPct: range(0, 2), dirtyPct: range(8, 15), membersPct: range(1, 2), influencePct: range(5),
    actionBan: "špehování", production: "bez omezení výroby"
  }),
  2: Object.freeze({
    incomePct: range(20), cleanPct: range(2, 7), dirtyPct: range(16, 20), drugPct: range(5), membersPct: range(3, 7),
    attackWeaponPct: range(3), influencePct: range(6, 8), actionBan: "špehování + vykrást", production: "Lékárna -10 %, Lab -10 %"
  }),
  3: Object.freeze({
    incomePct: range(21, 26), cleanPct: range(2, 7), dirtyPct: range(16, 20), drugPct: range(6, 9), membersPct: range(7, 12),
    attackWeaponPct: range(3, 8), defenseWeaponPct: range(3, 8), influencePct: range(8, 12), actionBan: "špehování, vykrást, útok",
    production: "Lékárna + Lab -11 až -13 %, Zbrojovka -8 až -13 %"
  }),
  4: Object.freeze({
    incomePct: range(26, 33), cleanPct: range(7, 12), dirtyPct: range(18, 23), drugPct: range(10, 15), membersPct: range(11, 17),
    attackWeaponPct: range(11), defenseWeaponPct: range(11), attackPowerPct: range(8), defensePowerPct: range(10), influencePct: range(11, 14),
    actionBan: "špehování, vykrást, útok, obsadit + Lékárna/Továrna speciální akce",
    production: "Lékárna + Lab -13 až -15 %, Zbrojovka -12 až -16 %"
  }),
  5: Object.freeze({
    incomePct: range(32, 40), cleanPct: range(14, 18), dirtyPct: range(23, 28), materialPct: range(30), drugPct: range(15, 17),
    membersPct: range(18, 23), attackWeaponPct: range(13), defenseWeaponPct: range(14), attackPowerPct: range(15), defensePowerPct: range(15),
    influencePct: range(14, 17), actionBan: "špehování, vykrást, útok, obsadit + speciální akce budov",
    production: "silně omezená výroba po dobu razie"
  }),
  6: Object.freeze({
    incomePct: range(100), cleanPct: range(25), dirtyPct: range(45), materialPct: range(35), drugPct: range(23), membersPct: range(30),
    attackWeaponPct: range(20), defenseWeaponPct: range(20), attackPowerPct: range(30), defensePowerPct: range(30), influencePct: range(25),
    actionBan: "všechny akce včetně speciálních akcí v budovách", production: "výroba zablokovaná po dobu razie"
  })
});

const pct = ([min = 0, max = min] = []) => Math.round(min + (Math.random() * Math.max(0, max - min)));
const label = ([min = 0, max = min] = []) => min === max ? `${min}%` : `${min}-${max}%`;

export function getPoliceTierShortEffect(tierId) {
  const effect = TIER_EFFECTS[tierId] || TIER_EFFECTS[1];
  return `Income -${label(effect.incomePct)} | ${effect.actionBan}`;
}

export function resolvePoliceTierImpact(tierId) {
  const effect = TIER_EFFECTS[tierId] || TIER_EFFECTS[1];
  return {
    durationMs: HOUR_MS,
    cleanPct: pct(effect.cleanPct),
    dirtyPct: pct(effect.dirtyPct),
    drugPct: pct(effect.drugPct),
    materialPct: pct(effect.materialPct),
    membersPct: pct(effect.membersPct),
    attackWeaponPct: pct(effect.attackWeaponPct),
    defenseWeaponPct: pct(effect.defenseWeaponPct),
    influencePct: pct(effect.influencePct),
    incomePct: pct(effect.incomePct),
    attackPowerPct: pct(effect.attackPowerPct),
    defensePowerPct: pct(effect.defensePowerPct),
    effectRows: [
      { label: "Income na 1h", value: `-${label(effect.incomePct)} globálně` },
      { label: "Zabavení", value: `clean ${label(effect.cleanPct)} • dirty ${label(effect.dirtyPct)}` },
      effect.drugPct ? { label: "Drogy", value: `-${label(effect.drugPct)}` } : null,
      effect.materialPct ? { label: "Materiály", value: `-${label(effect.materialPct)} včetně factory supplies` } : null,
      { label: "Zatčení", value: `-${label(effect.membersPct)} obyvatel` },
      effect.attackWeaponPct || effect.defenseWeaponPct ? { label: "Zbraně", value: `attack -${label(effect.attackWeaponPct)} • defense -${label(effect.defenseWeaponPct)}` } : null,
      effect.attackPowerPct || effect.defensePowerPct ? { label: "Síla zbraní", value: `útok -${label(effect.attackPowerPct)} • obrana -${label(effect.defensePowerPct)}` } : null,
      { label: "Vliv", value: `-${label(effect.influencePct)}` },
      { label: "Zákaz akcí", value: effect.actionBan },
      { label: "Výroba", value: effect.production }
    ].filter(Boolean)
  };
}
