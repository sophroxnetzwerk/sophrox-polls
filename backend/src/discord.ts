// Helper functions for Discord Bot API interactions

/**
 * Fetch user's roles from a Discord Guild
 * @param userId Discord User ID
 * @param guildId Discord Guild ID (Server ID)
 * @param botToken Discord Bot Token
 * @returns Array of Discord Role IDs
 */
export async function getUserRoles(
  userId: string,
  guildId: string,
  botToken: string
): Promise<string[]> {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`User ${userId} not found in guild ${guildId}`)
        return []
      }
      throw new Error(`Discord API error: ${response.status}`)
    }

    const data = (await response.json()) as any
    return data.roles || []
  } catch (error) {
    console.error("Error fetching user roles from Discord:", error)
    return []
  }
}

/**
 * Fetch information about a specific Discord role
 * @param guildId Discord Guild ID
 * @param roleId Discord Role ID
 * @param botToken Discord Bot Token
 * @returns Role information
 */
export async function getRole(
  guildId: string,
  roleId: string,
  botToken: string
): Promise<any> {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles/${roleId}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching Discord role:", error)
    return null
  }
}

/**
 * Get all roles in a guild
 * @param guildId Discord Guild ID
 * @param botToken Discord Bot Token
 * @returns Array of all roles
 */
export async function getGuildRoles(
  guildId: string,
  botToken: string
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching guild roles:", error)
    return []
  }
}
