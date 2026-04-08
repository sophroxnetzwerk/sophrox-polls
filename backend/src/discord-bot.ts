import { Client, GatewayIntentBits, PresenceUpdateStatus, ActivityType } from "discord.js"

let client: Client | null = null

export const initializeDiscordBot = async () => {
  const botToken = process.env.DISCORD_BOT_TOKEN

  if (!botToken || botToken === "your-discord-bot-token-here") {
    console.log("⚠️  Discord bot token not configured - skipping bot initialization")
    return
  }

  try {
    console.log("🤖 Initializing Discord bot...")

    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
      ],
    })

    client.on("clientReady", () => {
      if (!client) return

      console.log(`✅ Discord bot logged in as ${client.user?.tag}`)

      // Set bot status to DND with "Managing our Users" activity
      client.user?.setPresence({
        activities: [
          {
            name: "Managing our Users",
            type: ActivityType.Custom,
          },
        ],
        status: PresenceUpdateStatus.DoNotDisturb,
      })

      console.log("🔴 Bot status set to: DND - Managing our Users")
    })

    client.on("error", (error) => {
      console.error("❌ Discord bot error:", error)
    })

    await client.login(botToken)
  } catch (error) {
    console.error("❌ Failed to initialize Discord bot:", error instanceof Error ? error.message : String(error))
  }
}

export const getDiscordBotClient = () => client
