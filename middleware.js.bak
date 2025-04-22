import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
 
let headers = { 'accept-language': 'en-US,en;q=0.5' }
let languages = new Negotiator({ headers }).languages()

let locales = ["en-US", "tr-TR", "de-DE", "gr-GR"]
let defaultLocale = 'en-US'
 
match(languages, locales, defaultLocale) // -> 'en-US'

export default function middleware(req, res, next) {

  return;
}
