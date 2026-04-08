// Token storage with localStorage persistence
const STORAGE_KEY = "sophrox_auth"

interface AuthData {
  accessToken: string
  refreshToken: string
  user: { 
    id: string
    email: string
    role: "admin" | "creator" | "voter"
    username?: string
    avatar?: string
  }
}

// Helper to safely access localStorage
const isBrowser = typeof window !== "undefined"

const getStorageItem = (): AuthData | null => {
  if (!isBrowser) return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const setStorageItem = (data: AuthData | null): void => {
  if (!isBrowser) return
  try {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (e) {
    console.error("Failed to save auth data:", e)
  }
}

// Initialize from localStorage
let authData = getStorageItem()

export const getAccessToken = () => authData?.accessToken ?? null
export const getRefreshToken = () => authData?.refreshToken ?? null
export const getUser = () => authData?.user ?? null

export const setTokens = (
  newAccessToken: string | null,
  newRefreshToken: string | null,
  newUser: { 
    id: string
    email: string
    role: "admin" | "creator" | "voter"
    username?: string
    avatar?: string
  } | null
) => {
  if (!newAccessToken || !newRefreshToken || !newUser) {
    clearTokens()
    return
  }
  authData = {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: newUser,
  }
  setStorageItem(authData)
}

export const clearTokens = () => {
  authData = null
  setStorageItem(null)
}

export const logout = () => {
  clearTokens()
}

export const isAuthenticated = () => !!authData?.accessToken
export const getUserRole = () => authData?.user?.role ?? null
export const getUserId = () => authData?.user?.id ?? null
