import { AppLanguage } from "@/types/common/I18nTypes"

export const findFlagUrlByIso2Code = (lang: AppLanguage) => {
    const langToCountry = lang === 'en' ? 'us' : lang // exceptions
    return `https://kapowaz.github.io/square-flags/flags/${langToCountry.toLowerCase()}.svg`
}