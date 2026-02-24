import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

//de, en, et, gr, he, mt, th, tr, nl, ua
import de from '@/dictionaries/de.json'
import en from '@/dictionaries/en.json'
import et from '@/dictionaries/et.json'
import gr from '@/dictionaries/gr.json'
//import he from '@/dictionaries/he.json'
import mt from '@/dictionaries/mt.json'
import th from '@/dictionaries/th.json'
import tr from '@/dictionaries/tr.json'
import nl from '@/dictionaries/nl.json'
import ua from '@/dictionaries/ua.json'

const fallbackLng = 'en'

const resources = {
  de: {
    translation: de,
  },
  en: {
    translation: en,
  },
  et: {
    translation: et,
  },
  gr: {
    translation: gr,
  },
  mt: {
    translation: mt,
  },
  th: {
    translation: th,
  },
  tr: {
    translation: tr,
  },
  nl: {
    translation: nl,
  },
  ua: {
    translation: ua,
  },
}

const interpolation = {
  escapeValue: false, // not needed for react as it escapes by default
}

i18n
  // load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
  // learn more: https://github.com/i18next/i18next-http-backend
  // want your translations to be loaded from a professional CDN? => https://github.com/locize/react-tutorial#step-2---use-the-locize-cdn
  //.use(Backend)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  //.use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng,
    //debug: process.env.NODE_ENV === "development",
    debug: false,
    resources,
    interpolation,
  })

export default i18n
