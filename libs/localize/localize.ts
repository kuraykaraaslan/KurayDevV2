import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from '@/dictionaries/de.json'
import el from '@/dictionaries/el.json'
import en from '@/dictionaries/en.json'
import et from '@/dictionaries/et.json'
import he from '@/dictionaries/he.json'
import mt from '@/dictionaries/mt.json'
import nl from '@/dictionaries/nl.json'
import th from '@/dictionaries/th.json'
import tr from '@/dictionaries/tr.json'
import uk from '@/dictionaries/uk.json'

const resources = {
  de: { translation: de },
  el: { translation: el },
  en: { translation: en },
  et: { translation: et },
  he: { translation: he },
  mt: { translation: mt },
  nl: { translation: nl },
  th: { translation: th },
  tr: { translation: tr },
  uk: { translation: uk },
}

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  debug: false,
  resources,
  interpolation: { escapeValue: false },
})

export default i18n
