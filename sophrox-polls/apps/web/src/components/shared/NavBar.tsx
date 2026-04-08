import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { getAccessToken, getUserRole, clearTokens } from "../../lib/auth"

const NavBar = () => {
  const navigate = useNavigate()
  const token = getAccessToken()
  const role = getUserRole()

  const handleLogout = () => {
    clearTokens()
    navigate("/login")
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between py-4">
        <Link to="/dashboard" className="text-lg font-bold">
          Sophrox Poll
        </Link>

        {token ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground capitalize">{role}</span>
            {role === "creator" && (
              <Link to="/polls/create">
                <Button variant="outline" size="sm">
                  Create Poll
                </Button>
              </Link>
            )}
            {role === "admin" && (
              <Link to="/admin">
                <Button variant="outline" size="sm">
                  Admin Panel
                </Button>
              </Link>
            )}
            <Button onClick={handleLogout} variant="ghost" size="sm">
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Register</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default NavBar
