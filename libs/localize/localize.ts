import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import az from '@/dictionaries/az.json'
import de from '@/dictionaries/de.json'
import el from '@/dictionaries/el.json'
import en from '@/dictionaries/en.json'
import et from '@/dictionaries/et.json'
import he from '@/dictionaries/he.json'
import ky from '@/dictionaries/ky.json'
import mt from '@/dictionaries/mt.json'
import nl from '@/dictionaries/nl.json'
import tk from '@/dictionaries/tk.json'
import tr from '@/dictionaries/tr.json'
import uk from '@/dictionaries/uk.json'
import uz from '@/dictionaries/uz.json'

const resources = {
  az: { translation: az },
  de: { translation: de },
  el: { translation: el },
  en: { translation: en },
  et: { translation: et },
  he: { translation: he },
  ky: { translation: ky },
  mt: { translation: mt },
  nl: { translation: nl },
  tk: { translation: tk },
  tr: { translation: tr },
  uk: { translation: uk },
  uz: { translation: uz },
}

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  debug: false,
  resources,
  interpolation: { escapeValue: false },
})

export default i18n
