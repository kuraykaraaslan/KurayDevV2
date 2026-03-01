import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import az from '@/dictionaries/az.json'
import de from '@/dictionaries/de.json'
import el from '@/dictionaries/el.json'
import en from '@/dictionaries/en.json'
import es from '@/dictionaries/es.json'
import et from '@/dictionaries/et.json'
import fi from '@/dictionaries/fi.json'
import fr from '@/dictionaries/fr.json'
import he from '@/dictionaries/he.json'
import it from '@/dictionaries/it.json'
import ja from '@/dictionaries/ja.json'
import kk from '@/dictionaries/kk.json'
import ky from '@/dictionaries/ky.json'
import mt from '@/dictionaries/mt.json'
import nl from '@/dictionaries/nl.json'
import ru from '@/dictionaries/ru.json'
import tk from '@/dictionaries/tk.json'
import tr from '@/dictionaries/tr.json'
import tt from '@/dictionaries/tt.json'
import uk from '@/dictionaries/uk.json'
import uz from '@/dictionaries/uz.json'
import zh from '@/dictionaries/zh.json'
import tw from '@/dictionaries/tw.json'
import ar from '@/dictionaries/ar.json'

const resources = {
  az: { translation: az },
  de: { translation: de },
  el: { translation: el },
  en: { translation: en },
  es: { translation: es },
  et: { translation: et },
  fi: { translation: fi },
  fr: { translation: fr },
  he: { translation: he },
  it: { translation: it },
  ja: { translation: ja },
  kk: { translation: kk },
  ky: { translation: ky },
  mt: { translation: mt },
  nl: { translation: nl },
  ru: { translation: ru },
  tk: { translation: tk },
  tr: { translation: tr },
  tt: { translation: tt },
  uk: { translation: uk },
  uz: { translation: uz },
  zh: { translation: zh },
  tw: { translation: tw },
  ar: { translation: ar }, // Only tried for RTL, never gonna support at all
}

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  debug: false,
  resources,
  interpolation: { escapeValue: false },
})

export default i18n
