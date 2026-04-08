import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Outlet } from "react-router-dom"
import {
  LayoutDashboard,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUserRole, clearTokens } from "../../lib/auth"
import { cn } from "../../lib/utils"

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  roles?: string[]
}

const DashboardLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const role = getUserRole()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: "/dashboard",
    },
    {
      label: "Create Poll",
      icon: <Plus className="w-5 h-5" />,
      href: "/polls/create",
      roles: ["creator", "admin"],
    },
    {
      label: "Users",
      icon: <Users className="w-5 h-5" />,
      href: "/admin/users",
      roles: ["admin"],
    },
    {
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      href: "/settings",
    },
  ]

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role || "")
  )

  const handleLogout = () => {
    clearTokens()
    navigate("/login")
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r bg-card transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Header Card */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between gap-2">
            {sidebarOpen && (
              <div className="flex-1">
                <h1 className="text-lg font-bold tracking-tight">Sophrox</h1>
                <p className="text-xs text-muted-foreground">Poll Manager</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8"
            >
              {sidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(true)}
                title={!sidebarOpen ? item.label : ""}
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    isActive && "bg-primary text-primary-foreground",
                    !isActive && "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.icon}
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Footer Section */}
        <div className="p-3 border-t space-y-2">
          {sidebarOpen && (
            <div className="px-2 py-2">
              <p className="text-xs font-medium text-muted-foreground">
                Role
              </p>
              <p className="text-sm font-semibold capitalize">
                {role ? role : "User"}
              </p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="outline"
            size={sidebarOpen ? "default" : "icon"}
            className={cn(
              "w-full transition-all",
              !sidebarOpen && "h-9 w-9 p-0"
            )}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
