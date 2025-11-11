import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "../locales/en/translation.json";
import ar from "../locales/ar/translation.json";

const savedLanguage = localStorage.getItem("i18nextLng") || "ar";
const savedDir = savedLanguage === "ar" ? "rtl" : "ltr";

document.documentElement.setAttribute("dir", savedDir);
document.documentElement.setAttribute("lang", savedLanguage);

i18n
  .use(LanguageDetector) 
  .use(initReactI18next)
  .init({
    fallbackLng: "ar",
    lng: savedLanguage,
    debug: false, 
    
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },

    interpolation: {
      escapeValue: false,
    },

    resources: {
      en: {
        translation: en,
      },
      ar: {
        translation: ar,
      },
    },
  });

i18n.on("languageChanged", (lng) => {
  const dir = lng === "ar" ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lng);
  localStorage.setItem("dir", dir);
});

export default i18n;