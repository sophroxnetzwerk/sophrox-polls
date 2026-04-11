import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LogOut,
  LogIn,
  Home,
  Shield,
} from "lucide-react"
import { getUserRole, getUser, logout, isAuthenticated } from "../../lib/auth"

export const Sidebar = () => {
  const { t } = useTranslation()
  const role = getUserRole()
  const user = getUser()
  const location = useLocation()
  const authenticated = isAuthenticated()
  const [logoClickCount, setLogoClickCount] = useState(0)
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleLogoClick = () => {
    const newCount = logoClickCount + 1
    setLogoClickCount(newCount)

    if (newCount === 5) {
      setShowEasterEgg(true)
      setLogoClickCount(0)
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        setShowEasterEgg(false)
      }, 10000)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const navItems = [
    { label: t("sidebar.dashboard"), href: "/dashboard", icon: Home },
    ...(role === "admin" ? [{ label: t("sidebar.admin"), href: "/admin", icon: Shield }] : []),
  ]

  const isActive = (href: string) => location.pathname === href

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo / Brand */}
      <div className="p-6 flex items-center justify-center cursor-default" onClick={handleLogoClick}>
        <img src="/sophrox-logo.png" alt="Sophrox" className="h-20 w-auto max-w-[220px]" />
      </div>

      {/* Easter Egg Modal */}
      {showEasterEgg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 select-none pointer-events-none">
          <div className="relative animate-bounce">
            <img 
              src="/blume_security.svg" 
              alt="Blume Security" 
              className="h-48 w-auto drop-shadow-2xl select-none"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive(item.href) ? "default" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer with User Profile & Auth */}
      <div className="p-4 border-t border-border space-y-4">
        {authenticated && user && (
          <div className="px-2 py-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="font-semibold text-xs">
                  {user.username?.slice(0, 2).toUpperCase() || "US"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{user.username}</p>
                {role === "admin" && <Badge variant="destructive" className="text-xs whitespace-nowrap">Admin</Badge>}
                {role === "creator" && <Badge variant="secondary" className="text-xs whitespace-nowrap">Creator</Badge>}
                {role === "voter" && <Badge variant="outline" className="text-xs whitespace-nowrap">Voter</Badge>}
              </div>
            </div>
          </div>
        )}

        {authenticated ? (
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {t("sidebar.logout")}
          </Button>
        ) : (
          <Link to="/login" className="w-full">
            <Button className="w-full justify-start gap-2">
              <LogIn className="w-4 h-4" />
              {t("auth.login")}
            </Button>
          </Link>
        )}
      </div>
    </aside>
  )
}
