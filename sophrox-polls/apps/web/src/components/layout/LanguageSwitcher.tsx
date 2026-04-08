import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const languageOptions = [
    { code: "en", label: "English" },
    { code: "de", label: "Deutsch" },
  ]

  return (
    <div className="flex gap-2 w-full">
      {languageOptions.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all ${
            i18n.language === lang.code
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
          title={lang.label}
        >
          {lang.label}
          {i18n.language === lang.code && <Check className="w-3 h-3 ml-1" />}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher
