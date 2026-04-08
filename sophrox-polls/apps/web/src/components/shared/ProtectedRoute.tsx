import { Navigate, Outlet } from "react-router-dom"
import { getAccessToken, getUserRole } from "../../lib/auth"

export interface ProtectedRouteProps {
  role?: "admin" | "creator" | "voter"
  allowedRoles?: ("admin" | "creator" | "voter")[]
  children?: React.ReactNode
}

export const ProtectedRoute = ({ role, allowedRoles, children }: ProtectedRouteProps) => {
  const token = getAccessToken()
  const userRole = getUserRole()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Check if role is required
  if (role) {
    // Allow admin users to access creator-only routes
    if (role === "creator" && userRole === "admin") {
      return children || <Outlet />
    }
    if (userRole !== role) {
      return <Navigate to="/dashboard" replace />
    }
  }

  // Check if allowedRoles is specified
  if (allowedRoles && !allowedRoles.includes(userRole as any)) {
    return <Navigate to="/dashboard" replace />
  }

  return children || <Outlet />
}

export default ProtectedRoute
