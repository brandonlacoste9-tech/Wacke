import { translations } from "./apps/web/lib/translations";
const frKeys = Object.keys(translations.fr);
const enKeys = Object.keys(translations.en);
const missing = frKeys.filter(k => !enKeys.includes(k));
console.log("Missing from EN:", missing);
