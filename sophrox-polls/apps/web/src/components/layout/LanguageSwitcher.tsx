import { useTranslation } from "react-i18next"

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation()

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">{t("common.language")}</span>
      <div className="flex gap-2">
        <button
          onClick={() => i18n.changeLanguage("en")}
          className={`text-2xl transition-opacity hover:opacity-100 ${
            i18n.language === "en" ? "opacity-100" : "opacity-50"
          }`}
          title="English"
        >
          🇺🇸
        </button>
        <button
          onClick={() => i18n.changeLanguage("de")}
          className={`text-2xl transition-opacity hover:opacity-100 ${
            i18n.language === "de" ? "opacity-100" : "opacity-50"
          }`}
          title="Deutsch"
        >
          🇩🇪
        </button>
      </div>
    </div>
  )
}

export default LanguageSwitcher
