import { getAccessToken, getRefreshToken, setTokens } from "./auth"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api/v1"

class APIClient {
  private baseURL: string
  private isRefreshing = false
  private refreshPromise: Promise<string | null> | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = (async () => {
      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) return null

        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })

        if (!response.ok) {
          // Refresh failed, clear tokens
          setTokens(null as any, null as any, null as any)
          return null
        }

        const data = await response.json()
        console.log("[FRONTEND] Token refreshed successfully")
        setTokens(data.accessToken, data.refreshToken, data.user)
        return data.accessToken
      } catch (error) {
        console.error("[FRONTEND] Token refresh failed:", error)
        setTokens(null as any, null as any, null as any)
        return null
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  private getHeaders(): HeadersInit {
    const token = getAccessToken()
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleUnauthorized<T>(
    fetcher: (headers: HeadersInit) => Promise<Response>
  ): Promise<T> {
    let response = await fetcher(this.getHeaders())

    if (response.status === 401) {
      console.log("[FRONTEND] Got 401, attempting token refresh...")
      const newToken = await this.refreshAccessToken()

      if (newToken) {
        const newHeaders = this.getHeaders()
        response = await fetcher(newHeaders)
      }
    }

    if (!response.ok) {
      const error = await response.json()
      const apiError = new Error(error.message || `API Error: ${response.status}`) as any
      apiError.status = response.status
      apiError.data = error
      throw apiError
    }

    return response.json()
  }

  async get<T>(path: string): Promise<T> {
    return this.handleUnauthorized<T>((headers) =>
      fetch(`${this.baseURL}${path}`, {
        method: "GET",
        headers,
      })
    )
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.handleUnauthorized<T>((headers) =>
      fetch(`${this.baseURL}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })
    )
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.handleUnauthorized<T>((headers) =>
      fetch(`${this.baseURL}${path}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      })
    )
  }

  async delete<T>(path: string): Promise<T> {
    return this.handleUnauthorized<T>((headers) =>
      fetch(`${this.baseURL}${path}`, {
        method: "DELETE",
        headers,
      })
    )
  }
}

export const api = new APIClient(API_BASE)
