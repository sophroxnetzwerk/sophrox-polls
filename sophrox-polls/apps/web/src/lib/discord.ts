/**
 * Discord utility functions and constants
 */

// Map to cache Discord roles with their colors
const roleColorCache: Map<string, { name: string; color: string }> = new Map()

export interface DiscordRole {
  id: string
  name: string
  color: string
}

/**
 * Sync Discord role colors with backend (Admin only)
 */
export const syncDiscordRoleColors = async (token: string): Promise<{ synced: number; total: number } | null> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:3000"}/api/v1/categories/sync-colors`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    })

    if (!response.ok) {
      console.error("Failed to sync Discord role colors:", response.statusText)
      return null
    }

    const data = await response.json()
    console.log(`✅ Synced ${data.synced}/${data.total} categories with Discord colors`)
    return data
  } catch (error) {
    console.error("Error syncing Discord role colors:", error)
    return null
  }
}

/**
 * Fetch Discord roles from the backend
 */
export const fetchDiscordRoles = async (token: string): Promise<DiscordRole[]> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:3000"}/api/v1/discord/roles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    })

    if (!response.ok) {
      console.error("Failed to fetch Discord roles:", response.statusText)
      return []
    }

    const data = await response.json()
    return data.roles || []
  } catch (error) {
    console.error("Error fetching Discord roles:", error)
    return []
  }
}

/**
 * Get the hex color for a Discord role ID
 */
export const getDiscordRoleColor = (roleId: string | null | undefined, defaultColor: string = "#6366f1"): string => {
  if (!roleId) return defaultColor
  
  const cached = roleColorCache.get(roleId)
  if (cached) return cached.color
  
  return defaultColor
}

/**
 * Cache a Discord role's color
 */
export const cacheDiscordRoleColor = (roleId: string, name: string, color: string): void => {
  roleColorCache.set(roleId, { name, color })
}

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Get a lighter shade of a color for background (with better contrast)
 */
export const getLighterColor = (hex: string, percent: number = 90): string => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  // For lighter backgrounds, we want to lighten more aggressively
  const lighter = {
    r: Math.min(255, Math.round(rgb.r + (255 - rgb.r) * ((100 - percent) / 100))),
    g: Math.min(255, Math.round(rgb.g + (255 - rgb.g) * ((100 - percent) / 100))),
    b: Math.min(255, Math.round(rgb.b + (255 - rgb.b) * ((100 - percent) / 100))),
  }

  return `rgba(${lighter.r}, ${lighter.g}, ${lighter.b}, 0.15)`
}

/**
 * Get text color based on background brightness
 */
export const getTextColorForBackground = (hex: string): string => {
  const rgb = hexToRgb(hex)
  if (!rgb) return "#000000"

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255

  return luminance > 0.5 ? "#000000" : "#ffffff"
}
