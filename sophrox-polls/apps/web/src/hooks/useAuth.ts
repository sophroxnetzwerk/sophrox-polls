import { useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { api } from "../lib/api"
import { setTokens, clearTokens, getAccessToken } from "../lib/auth"
import type { LoginInput, RegisterInput } from "../lib/validators"

export const useAuth = () => {
  const navigate = useNavigate()

  const login = useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const response = await api.post<{
        user: { id: string; email: string; role: "admin" | "creator" | "voter" }
        accessToken: string
        refreshToken: string
      }>("/auth/login", credentials)
      return response
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken, data.user)
      navigate("/dashboard")
    },
  })

  const register = useMutation({
    mutationFn: async (credentials: RegisterInput) => {
      const { confirmPassword, ...data } = credentials
      const response = await api.post<{
        user: { id: string; email: string; role: "admin" | "creator" | "voter" }
        accessToken: string
        refreshToken: string
      }>("/auth/register", data)
      return response
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken, data.user)
      navigate("/dashboard")
    },
  })

  const logout = useCallback(() => {
    clearTokens()
    navigate("/login")
  }, [navigate])

  return {
    login,
    register,
    logout,
    isAuthenticated: !!getAccessToken(),
  }
}
