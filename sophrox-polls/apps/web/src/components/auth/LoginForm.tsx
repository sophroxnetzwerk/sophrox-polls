import { Card } from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

interface LoginFormProps {
  onSuccess?: () => void
}

export const LoginForm = (_: LoginFormProps) => {
  const { t } = useTranslation()
  const handleDiscordLogin = () => {
    const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID
    if (!DISCORD_CLIENT_ID) {
      console.error("VITE_DISCORD_CLIENT_ID not configured")
      return
    }
    const REDIRECT_URI = `${window.location.origin}/auth/discord`
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`
    window.location.href = discordAuthUrl
  }

  return (
    <Card className="w-full max-w-md">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Logo */}
        <img src="/sophrox-logo.png" alt="Sophrox" className="h-24 w-auto" />

        {/* Button */}
        <Button onClick={handleDiscordLogin} className="w-full" size="lg">
          <MessageCircle className="mr-2 h-4 w-4" />
          {t("auth.loginWithDiscord")}
        </Button>
      </div>
    </Card>
  )
}

export default LoginForm
