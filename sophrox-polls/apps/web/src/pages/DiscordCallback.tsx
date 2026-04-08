import { useEffect, useState, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { setTokens } from "@/lib/auth"
import { toast } from "sonner"

export const DiscordCallback = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(true)
  const hasProcessed = useRef(false)

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent processing the same code twice
      if (hasProcessed.current) return
      hasProcessed.current = true

      try {
        const code = searchParams.get("code")
        const error = searchParams.get("error")

        if (error) {
          toast.error(`${t("auth.discordLoginFailed")}: ${error}`)
          navigate("/login")
          return
        }

        if (!code) {
          toast.error(t("auth.noAuthCode"))
          navigate("/login")
          return
        }

        // Exchange code for tokens
        const response = await api.post<{
          user: { id: string; email: string; role: "admin" | "creator" | "voter"; username?: string; avatar?: string }
          accessToken: string
          refreshToken: string
          userId?: string
        }>("/auth/discord", { code })

        setTokens(response.accessToken, response.refreshToken, response.user)
        
        // Sync user roles after successful login
        try {
          await api.post("/auth/sync-roles", {})
          console.log("✅ Roles synced successfully")
        } catch (syncError) {
          console.warn("⚠️ Failed to sync roles:", syncError)
          // Don't fail login if role sync fails
        }
        
        // Invalidate all queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ["polls"] })
        await queryClient.invalidateQueries({ queryKey: ["categories"] })
        console.log("🔄 Cache invalidated")
        
        toast.success(t("auth.loginSuccess"))
        navigate("/dashboard")
      } catch (error: any) {
        if (error.status === 403) {
          toast.error(t("auth.accountPending"))
          navigate("/login")
        } else {
          toast.error(error.message || t("auth.discordAuthFailed"))
          navigate("/login")
        }
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Authenticating with Discord...</p>
          </>
        ) : (
          <p className="text-muted-foreground">Redirecting...</p>
        )}
      </div>
    </div>
  )
}

export default DiscordCallback
