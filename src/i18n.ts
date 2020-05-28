import i18n from "i18next"

import commonEN from "./locales/common/en.json"

const resources = {
  en: {
    common: commonEN,
  },
}

const instance = i18n.createInstance()

instance.init({
  resources,
  ns: ["common"],
  defaultNS: "common",
  lng: "en",
  interpolation: {
    escapeValue: false,
  },
  debug: false,
})

export default instance
