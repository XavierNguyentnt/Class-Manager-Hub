import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/common.json";
import vi from "./locales/vi/common.json";

const saved = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
const fallbackLng = "vi";
const lng = saved || fallbackLng;

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      vi: { common: vi },
    },
    lng,
    fallbackLng,
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;

