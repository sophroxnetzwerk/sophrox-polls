import express, { Request, Response, NextFunction } from "express"
import cors from "cors"
import { PrismaClient } from "@prisma/client"
import jwt, { JwtPayload } from "jsonwebtoken"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import { getUserRoles } from "./discord"
import { initializeDiscordBot, getDiscordBotClient } from "./discord-bot"

// Load environment variables
dotenv.config()

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
}

const logger = {
  info: (msg: string) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  debug: (msg: string) => console.log(`${colors.gray}[DEBUG]${colors.reset} ${msg}`),
  api: (msg: string) => console.log(`${colors.blue}[API]${colors.reset} ${msg}`),
}

const app = express()
const prisma = new PrismaClient()

// Middleware
app.use(cors())
app.use(express.json())

// Types
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: "admin" | "creator" | "voter" }
    }
  }
}

interface AuthJWT extends JwtPayload {
  userId: string
  role: string
}

// Constants
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret"

// Utility functions
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10)
}

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" })
}

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" })
}
let dbInitialized = false

const checkAndSyncDatabase = async () => {
  try {
    logger.info("🔄 Checking database schema...")
    
    // Try to query a table with all fields to see if migration is applied
    try {
      await prisma.user.findFirst({
        select: { id: true, isBlocked: true },
        take: 1,
      })
      logger.success("✅ Database schema is in sync")
      return true
    } catch (error: any) {
      if (error.code === 'P2022' || error.message.includes('does not exist')) {
        logger.warn("⚠️ Database schema out of sync - migrations not applied")
        logger.info("💡 Please run: npx prisma db push")
        logger.info("Or if using migrations: npx prisma migrate deploy")
        return false
      }
      throw error
    }
  } catch (error) {
    logger.error("Database check failed: " + (error instanceof Error ? error.message : String(error)))
    return false
  }
}

const seedDiscordAdmin = async () => {
  if (dbInitialized) return
  try {
    logger.info("Starting admin seed...")
    const adminDiscordId = process.env.DISCORD_ADMIN_ID
    if (!adminDiscordId) {
      logger.warn("DISCORD_ADMIN_ID not set in .env - skipping admin seed")
      dbInitialized = true
      return
    }

    logger.debug(`Checking for admin user with Discord ID: ${adminDiscordId}`)
    const existingAdmin = await prisma.user.findUnique({
      where: { discordId: adminDiscordId } as any,
    })

    if (!existingAdmin) {
      logger.info("Creating new admin user...")
      await prisma.user.create({
        data: {
          discordId: adminDiscordId,
          email: `admin-${adminDiscordId}@discord`,
          role: "admin",
          isBlocked: false,
        } as any,
      })

      logger.success("Discord Admin User Created Successfully!")
      logger.debug(`Discord ID: ${adminDiscordId}`)
    } else {
      logger.info("Discord admin user already exists, ensuring settings are correct...")
      
      // Make sure admin is not blocked and has admin role
      await prisma.user.update({
        where: { discordId: adminDiscordId } as any,
        data: { 
          isBlocked: false,
          role: "admin"
        } as any
      })
      logger.success("Admin user settings verified")
    }
    dbInitialized = true
  } catch (error) {
    logger.error("Error during admin seed: " + (error instanceof Error ? error.message : String(error)))
    dbInitialized = true
  }
}

const initializeDatabase = async () => {
  // Check database schema first
  const isInSync = await checkAndSyncDatabase()
  
  if (!isInSync) {
    logger.error("Database schema is out of sync. Please run migrations first.")
    logger.info("Run one of these commands:")
    logger.info("  npx prisma db push")
    logger.info("  or: npx prisma migrate deploy")
    return
  }
  
  // Fire and forget - don't block
  seedDiscordAdmin().catch((err) => {
    console.error("Database initialization error:", err instanceof Error ? err.message : String(err))
  })
}

const initializeServices = async () => {
  // Initialize Discord bot
  initializeDiscordBot().catch((err) => {
    console.error("Discord bot initialization error:", err instanceof Error ? err.message : String(err))
  })
}

// Middleware: Auth verification
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "No token provided", statusCode: 401, message: "Unauthorized" })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthJWT
    req.user = { id: decoded.userId, email: "", role: decoded.role as any }
    next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid token", statusCode: 401, message: "Unauthorized" })
  }
}

// Middleware: Role check
const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden", statusCode: 403, message: "Insufficient permissions" })
    }
    next()
  }
}

// Middleware: Get user IP
const getClientIp = (req: Request): string => {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    (req.socket.remoteAddress || "unknown")
}

// Auth Routes
// Email registration removed - only Discord OAuth available// Email login removed - only Discord OAuth available// Discord OAuth Endpoint
app.post("/api/v1/auth/discord", async (req: Request, res: Response) => {
  try {
    const { code } = req.body
    logger.api("Discord auth request received " + (code ? "[code valid]" : "[NO CODE]"))

    if (!code) {
      logger.warn("No Discord code provided")
      return res.status(400).json({ error: "No code", statusCode: 400, message: "Discord code required" })
    }

    // Exchange code for Discord access token
    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
    const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "http://localhost:5173/auth/discord"

    logger.debug("Discord credentials check: " + (DISCORD_CLIENT_ID ? "ID[ok]" : "ID[missing]") + " " + (DISCORD_CLIENT_SECRET ? "SECRET[ok]" : "SECRET[missing]"))

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      logger.error("Discord credentials not configured in .env")
      return res.status(500).json({ error: "Server configuration error", statusCode: 500, message: "Internal server error" })
    }

    logger.info("Exchanging code for Discord access token...")
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: DISCORD_REDIRECT_URI,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      logger.error("Discord token exchange failed: " + tokenResponse.status + " " + tokenResponse.statusText)
      return res.status(401).json({ error: "Discord auth failed", statusCode: 401, message: "Failed to authenticate with Discord" })
    }

    const tokenData: any = await tokenResponse.json()
    logger.success("Discord access token received")

    // Get Discord user info
    logger.info("Fetching Discord user info...")
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userResponse.ok) {
      const errorData = await userResponse.text()
      logger.error("Discord user fetch failed: " + userResponse.status + " " + userResponse.statusText)
      return res.status(401).json({ error: "Discord user fetch failed", statusCode: 401, message: "Failed to get Discord user info" })
    }

    const discordUser: any = await userResponse.json()
    logger.success("Discord user info received: " + discordUser.username + "#" + discordUser.discriminator)

    // Find or create user
    logger.debug("Looking up user with Discord ID: " + discordUser.id)
    let user = await prisma.user.findUnique({
      where: { discordId: discordUser.id } as any,
    })

    if (!user) {
      // New user - create auto-approved (not blocked)
      console.log("👤 Creating new user...")
      user = await prisma.user.create({
        data: {
          discordId: discordUser.id,
          discordUsername: discordUser.global_name || discordUser.username,
          discordAvatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null,
          email: discordUser.email || `${discordUser.id}@discord`,
          role: "voter",
          isBlocked: false,
        } as any,
      })
      console.log("✅ New user created:", { id: user.id, role: user.role })
    } else {
      // Update Discord info in case it changed
      console.log("👤 Updating existing user...")
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          discordUsername: discordUser.global_name || discordUser.username,
          discordAvatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null,
        } as any,
      })
      console.log("✅ User updated:", { id: user.id })
    }

    // Check if blocked
    if ((user as any).isBlocked) {
      console.warn("⚠️ User is blocked:", { id: user.id })
      return res.status(403).json({
        error: "Blocked",
        statusCode: 403,
        message: "Your account has been blocked by an administrator",
        userId: user.id,
      })
    }

    console.log("🔐 Generating JWT tokens...")
    const accessToken = generateAccessToken(user.id, user.role)
    const refreshToken = generateRefreshToken(user.id)

    // If admin, sync category colors with Discord
    if (user.role === "admin") {
      console.log("👑 Admin detected, syncing category colors...")
      try {
        const client = getDiscordBotClient()
        if (client) {
          const guildId = process.env.DISCORD_GUILD_ID
          if (guildId) {
            const guild = await client.guilds.fetch(guildId)
            const roles = await guild.roles.fetch()
            
            const roleColorMap = new Map<string, string>()
            const DEFAULT_COLOR = "#6366f1" // Indigo fallback
            
            roles.forEach((role) => {
              const color = role.hexColor === "#000000" ? DEFAULT_COLOR : role.hexColor
              roleColorMap.set(role.id, color)
            })

            // Get ALL categories to debug
            const allCategories = await prisma.category.findMany()
            console.log(`[SYNC_DEBUG] Total categories: ${allCategories.length}`)
            allCategories.forEach((cat: any) => {
              console.log(`  - ${cat.name}: discordRoleId = ${cat.discordRoleId || "NOT SET"}`)
            })

            // Update all categories with role colors
            const categories = await prisma.category.findMany({
              where: { discordRoleId: { not: null } },
            })

            console.log(`[SYNC_DEBUG] Categories with discordRoleId: ${categories.length}`)

            let updated = 0
            for (const category of categories) {
              if (category.discordRoleId && roleColorMap.has(category.discordRoleId)) {
                const color = roleColorMap.get(category.discordRoleId)!
                console.log(`[SYNC_DEBUG] ✅ Found color for ${category.name}: ${color}`)
                await prisma.category.update({
                  where: { id: category.id },
                  data: { discordRoleColor: color },
                })
                updated++
              } else if (category.discordRoleId) {
                console.log(`[SYNC_DEBUG] ⚠️ Role ID not found in Discord: ${category.discordRoleId}`)
              }
            }
            
            if (updated > 0) {
              console.log(`✅ Updated ${updated} categories with Discord role colors`)
            }
          }
        }
      } catch (error) {
        console.warn("⚠️ Could not sync category colors:", error instanceof Error ? error.message : String(error))
      }
    }

    console.log("✅ Discord auth successful:", { userId: user.id, role: user.role })
    return res.status(200).json({
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        username: (user as any).discordUsername,
        avatar: (user as any).discordAvatar
      },
      accessToken,
      refreshToken,
    })
  } catch (error) {
    console.error("❌ Discord auth error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.post("/api/v1/auth/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token", statusCode: 401, message: "Unauthorized" })
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

      if (!user) {
        return res.status(401).json({ error: "User not found", statusCode: 401, message: "Unauthorized" })
      }

      const accessToken = generateAccessToken(user.id, user.role)
      return res.status(200).json({ accessToken })
    } catch {
      return res.status(401).json({ error: "Invalid refresh token", statusCode: 401, message: "Unauthorized" })
    }
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.post("/api/v1/auth/logout", async (req: Request, res: Response) => {
  // Token is invalidated on client side (in-memory)
  res.json({ success: true })
})

// ========== CATEGORY ROUTES ==========
app.get("/api/v1/discord/roles", verifyToken, async (req: Request, res: Response) => {
  logger.api(`[DISCORD_ROLES] Request from user: ${req.user?.id}`)
  try {
    const client = getDiscordBotClient()

    if (!client) {
      logger.warn("[DISCORD_ROLES] Discord bot not initialized")
      return res.status(503).json({
        error: "Discord bot not available",
        statusCode: 503,
        message: "Discord bot is not currently connected",
      })
    }

    const guildId = process.env.DISCORD_GUILD_ID
    if (!guildId) {
      logger.warn("[DISCORD_ROLES] DISCORD_GUILD_ID not configured")
      return res.status(400).json({
        error: "Configuration missing",
        statusCode: 400,
        message: "Discord Guild ID not configured",
      })
    }

    logger.debug(`[DISCORD_ROLES] Fetching guild with ID: ${guildId}`)

    try {
      const guild = await client.guilds.fetch(guildId)
      logger.debug(`[DISCORD_ROLES] Guild fetched: ${guild.name} (${guild.id})`)

      const roles = await guild.roles.fetch()
      logger.debug(`[DISCORD_ROLES] Total roles from Discord: ${roles.size}`)

      const formattedRoles = roles
        .filter((role) => !role.managed)
        .map((role) => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      logger.success(`[DISCORD_ROLES] Formatted ${formattedRoles.length} roles (filtered out ${roles.size - formattedRoles.length} managed roles)`)
      logger.debug(`[DISCORD_ROLES] Role list: ${formattedRoles.map((r) => r.name).join(", ")}`)
      
      res.json({ roles: formattedRoles })
    } catch (error) {
      logger.error(`[DISCORD_ROLES] Failed to fetch guild roles: ${error instanceof Error ? error.message : String(error)}`)
      return res.status(500).json({
        error: "Failed to fetch roles",
        statusCode: 500,
        message: "Could not fetch Discord roles",
      })
    }
  } catch (error) {
    logger.error(`[DISCORD_ROLES] Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.get("/api/v1/categories", verifyToken, async (req: Request, res: Response) => {
  try {
    console.log("📋 Fetching categories for user:", req.user?.id)
    
    // Use raw query to get all fields including discordRoleColor
    let categories = await prisma.$queryRaw`
      SELECT id, name, description, discordRoleId, discordRoleColor, createdAt 
      FROM Category 
      ORDER BY name
    ` as any[]
    
    console.log("[CATEGORIES] Raw query result:", JSON.stringify(categories))
    
    // If any category has null discordRoleColor and has a discordRoleId, try to sync colors
    const hasNullColors = categories.some((c) => c.discordRoleId && !c.discordRoleColor)
    
    if (hasNullColors) {
      console.log("[SYNC] Categories have null colors, attempting to sync from Discord...")
      try {
        const client = getDiscordBotClient()
        if (client) {
          const guildId = process.env.DISCORD_GUILD_ID
          if (guildId) {
            const guild = await client.guilds.fetch(guildId)
            const roles = await guild.roles.fetch()
            
            const roleColorMap = new Map<string, string>()
            const DEFAULT_COLOR = "#6366f1"
            
            roles.forEach((role) => {
              const color = role.hexColor === "#000000" ? DEFAULT_COLOR : role.hexColor
              roleColorMap.set(role.id, color)
              console.log(`[DISCORD_ROLE] ${role.name}: ${role.hexColor} -> ${color}`)
            })

            // Update categories with null colors
            for (const category of categories) {
              if (category.discordRoleId && !category.discordRoleColor && roleColorMap.has(category.discordRoleId)) {
                const color = roleColorMap.get(category.discordRoleId)!
                await prisma.category.update({
                  where: { id: category.id },
                  data: { discordRoleColor: color },
                })
                category.discordRoleColor = color
                console.log(`[SYNC] ✅ Updated ${category.name} with color ${color}`)
              }
            }
          }
        }
      } catch (error) {
        console.warn("[SYNC] Could not sync colors:", error instanceof Error ? error.message : String(error))
      }
    }
    
    console.log("✅ Categories fetched:", { count: categories.length, colors: categories.map((c) => ({ name: c.name, color: c.discordRoleColor })) })
    res.json({ categories })
  } catch (error) {
    console.error("❌ Error fetching categories:", { error })
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

// Debug endpoint to see all Discord roles with their colors
app.get("/api/v1/discord/roles/debug", verifyToken, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    console.log("[DEBUG_ROLES] Admin debug request")
    const client = getDiscordBotClient()

    if (!client) {
      return res.status(503).json({ error: "Discord bot not available" })
    }

    const guildId = process.env.DISCORD_GUILD_ID
    if (!guildId) {
      return res.status(400).json({ error: "Guild ID not configured" })
    }

    const guild = await client.guilds.fetch(guildId)
    const roles = await guild.roles.fetch()

    const rolesList = roles
      .map((role) => ({
        id: role.id,
        name: role.name,
        hexColor: role.hexColor,
        color: role.color,
        managed: role.managed,
        position: role.position,
      }))
      .sort((a, b) => b.position - a.position)

    // Auch Kategorien zeigen
    const categories = await prisma.category.findMany()

    res.json({
      total: rolesList.length,
      withColors: rolesList.filter((r) => r.hexColor !== "#000000").length,
      roles: rolesList,
      categories: categories,
      debug: {
        message: "Check if categories have discordRoleId set",
        coloredRoles: rolesList.filter((r) => r.hexColor !== "#000000").map((r) => ({ id: r.id, name: r.name, color: r.hexColor })),
      }
    })
  } catch (error) {
    console.error("[DEBUG_ROLES] Error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

app.post("/api/v1/categories", verifyToken, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { name, description, discordRoleId } = req.body
    console.log("➕ Creating category:", { name, userId: req.user?.id })

    if (!name) {
      return res.status(400).json({ error: "Name required", statusCode: 400, message: "Category name is required" })
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        discordRoleId,
        createdBy: req.user!.id,
      },
    })

    console.log("✅ Category created:", { id: category.id, name })
    res.status(201).json(category)
  } catch (error: any) {
    console.error("❌ Error creating category:", { error: error.message })
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Name exists", statusCode: 400, message: "Category name already exists" })
    }
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.patch("/api/v1/categories/:id", verifyToken, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { name, description, discordRoleId } = req.body
    const categoryId = req.params.id as string

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(discordRoleId !== undefined && { discordRoleId }),
      },
    })

    res.json(category)
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Not found", statusCode: 404, message: "Category not found" })
    }
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.delete("/api/v1/categories/:id", verifyToken, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.id as string

    await prisma.category.delete({
      where: { id: categoryId },
    })

    res.json({ success: true })
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Not found", statusCode: 404, message: "Category not found" })
    }
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

// Admin endpoint to refresh Discord role colors for all categories
app.post("/api/v1/categories/sync-colors", verifyToken, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    console.log("🔄 Syncing Discord role colors for categories...")
    const client = getDiscordBotClient()

    if (!client) {
      console.warn("[SYNC_COLORS] Discord bot not initialized")
      return res.status(503).json({
        error: "Discord bot not available",
        statusCode: 503,
        message: "Discord bot is not currently connected",
      })
    }

    const guildId = process.env.DISCORD_GUILD_ID
    if (!guildId) {
      console.warn("[SYNC_COLORS] DISCORD_GUILD_ID not configured")
      return res.status(400).json({
        error: "Configuration missing",
        statusCode: 400,
        message: "Discord Guild ID not configured",
      })
    }

    // Fetch all roles from Discord
    const guild = await client.guilds.fetch(guildId)
    const roles = await guild.roles.fetch()
    
    // Create map of role IDs to colors
    const roleColorMap = new Map<string, string>()
    roles.forEach((role) => {
      if (role.hexColor !== "#000000") { // Skip default color
        roleColorMap.set(role.id, role.hexColor)
      }
    })

    console.log(`📍 Found ${roleColorMap.size} roles with colors`)

    // Get all categories with Discord role IDs
    const categories = await prisma.category.findMany({
      where: {
        discordRoleId: {
          not: null,
        },
      },
    })

    let updated = 0
    for (const category of categories) {
      if (category.discordRoleId && roleColorMap.has(category.discordRoleId)) {
        const color = roleColorMap.get(category.discordRoleId)!
        await prisma.category.update({
          where: { id: category.id },
          data: { discordRoleColor: color },
        })
        updated++
        console.log(`✅ Updated ${category.name} with color ${color}`)
      }
    }

    console.log(`🎨 Synced colors for ${updated} categories`)
    res.json({ synced: updated, total: categories.length })
  } catch (error) {
    console.error("❌ Error syncing colors:", error)
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

// Polls Routes
app.get("/api/v1/polls", verifyToken, async (req: Request, res: Response) => {
  try {
    console.log("\x1b[34m[API]\x1b[0m GET /polls - Fetching polls with categories")
    
    const polls = await prisma.poll.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        creatorId: true,
        categoryId: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            discordUsername: true,
            discordAvatar: true,
          }
        } as any,
        category: {
          select: {
            id: true,
            name: true,
            discordRoleColor: true,
          }
        } as any,
        options: {
          select: {
            id: true,
            label: true,
            _count: {
              select: { votes: true }
            }
          }
        }
      }
    })

    console.log(`\x1b[32m[DEBUG]\x1b[0m Found ${polls.length} polls`)
    const pollsWithCategory = polls.filter((p: any) => p.category)
    console.log(`\x1b[32m[DEBUG]\x1b[0m Polls with category: ${pollsWithCategory.length}/${polls.length}`)
    if (polls.length > 0) {
      console.log(`\x1b[32m[DEBUG]\x1b[0m First poll category:`, polls[0].category)
      console.log(`\x1b[32m[DEBUG]\x1b[0m First poll categoryId:`, polls[0].categoryId)
    }

    const formattedPolls = polls.map((poll: any) => ({
      ...poll,
      options: poll.options.map((opt: any) => ({
        id: opt.id,
        label: opt.label,
        voteCount: opt._count.votes,
      })),
      totalVotes: poll.options.reduce((sum: number, opt: any) => sum + opt._count.votes, 0)
    }))

    console.log(`\x1b[32m[DEBUG]\x1b[0m Formatted polls sent to client`)
    res.json({ polls: formattedPolls, total: formattedPolls.length })
  } catch (error) {
    console.error(`\x1b[31m[ERROR]\x1b[0m GET /polls failed:`, error)
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.post("/api/v1/polls", verifyToken, requireRole("creator", "admin"), async (req: Request, res: Response) => {
  try {
    console.log(`\x1b[34m[API]\x1b[0m POST /polls - Creating new poll`)
    const { title, description, options, config, categoryId } = req.body
    console.log(`\x1b[32m[DEBUG]\x1b[0m Request body categoryId:`, categoryId)

    // If no deadline specified, poll is active immediately. Otherwise draft.
    const hasDeadline = config?.deadline
    const initialStatus = hasDeadline ? "draft" : "active"

    const poll = await prisma.poll.create({
      data: {
        title,
        description,
        creatorId: req.user!.id,
        categoryId: categoryId || null,
        status: initialStatus,
        options: {
          create: options.map((label: string) => ({ label })),
        },
        config: {
          create: {
            maxVotesPerUser: config?.maxVotesPerUser || 1,
            requireAuth: config?.requireAuth || false,
            ipLimit: config?.ipLimit || 1,
            totalMaxVotes: config?.maxVotes || null,
            multipleChoice: config?.multipleChoice || false,
            deadline: config?.deadline ? new Date(config.deadline) : null,
            captchaEnabled: config?.captchaEnabled || false,
            showVoters: config?.showVoters || false,
          } as any,
        },
      },
      include: {
        options: { include: { votes: true } },
        config: true,
      },
    })

    console.log(`\x1b[32m[DEBUG]\x1b[0m Poll created with categoryId:`, poll.categoryId)

    // Fetch creator separately to ensure latest data
    const creator = await prisma.user.findUnique({
      where: { id: poll.creatorId },
      select: {
        id: true,
        discordUsername: true,
        discordAvatar: true,
      } as any
    })

    const formattedPoll = {
      ...poll,
      creator,
      options: (poll as any).options.map((opt: any) => ({
        id: opt.id,
        label: opt.label,
        voteCount: opt.votes.length,
      })),
    }

    res.status(201).json(formattedPoll)
  } catch (error) {
    console.error(`\x1b[31m[ERROR]\x1b[0m POST /polls failed:`, error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    res.status(500).json({ error: "Server error", statusCode: 500, message: errorMessage })
  }
})

app.get("/api/v1/polls/:id", async (req: Request, res: Response) => {
  try {
    console.log(`\x1b[34m[API]\x1b[0m GET /polls/${req.params.id} - Fetching poll with category`)
    
    // Extract user from auth header if available
    let userId: string | null = null
    const authHeader = req.headers.authorization
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, JWT_SECRET) as AuthJWT
        userId = decoded.userId
      } catch (e) {
        // No valid token, continue as guest
      }
    }
    
    const poll = await prisma.poll.findUnique({
      where: { id: req.params.id as string },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        creatorId: true,
        categoryId: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            discordUsername: true,
            discordAvatar: true,
          }
        } as any,
        category: {
          select: {
            id: true,
            name: true,
          }
        } as any,
        options: {
          select: {
            id: true,
            label: true,
            votes: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    discordUsername: true,
                    discordAvatar: true,
                  }
                } as any,
              }
            },
            _count: {
              select: { votes: true }
            }
          }
        },
        config: true
      }
    })

    if (!poll) {
      console.warn(`\x1b[33m[WARN]\x1b[0m Poll not found: ${req.params.id}`)
      return res.status(404).json({ error: "Poll not found", statusCode: 404, message: "Not found" })
    }

    console.log(`\x1b[32m[DEBUG]\x1b[0m Poll category:`, poll.category)

    // Get current user's votes if logged in
    let userVotes: string[] = []
    if (userId) {
      const userVoteRecords = await prisma.vote.findMany({
        where: {
          pollId: req.params.id as string,
          userId: userId,
        },
        select: { optionId: true },
      })
      userVotes = userVoteRecords.map((v: any) => v.optionId)
      console.log(`\x1b[32m[DEBUG]\x1b[0m User ${userId} has voted for options:`, userVotes)
    }

    const formattedPoll = {
      ...poll,
      userVotes, // Array of optionIds that current user voted for
      options: poll.options.map((opt: any) => ({
        id: opt.id,
        label: opt.label,
        voteCount: opt._count.votes,
        voters: opt.votes.map((v: any) => ({
          id: v.id,
          user: v.user ? {
            id: v.user.id,
            discordUsername: v.user.discordUsername,
            discordAvatar: v.user.discordAvatar,
          } : null,
        })),
      })),
    }

    console.log(`\x1b[32m[DEBUG]\x1b[0m Formatted poll sent to client`)
    res.json(formattedPoll)
  } catch (error) {
    console.error(`\x1b[31m[ERROR]\x1b[0m GET /polls/:id failed:`, error)
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.patch("/api/v1/polls/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const poll = await prisma.poll.findUnique({ where: { id: req.params.id as string } })

    if (!poll) {
      return res.status(404).json({ error: "Poll not found", statusCode: 404, message: "Not found" })
    }

    if (poll.creatorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Forbidden", statusCode: 403, message: "Insufficient permissions" })
    }

    const updated = await prisma.poll.update({
      where: { id: req.params.id as string },
      data: req.body,
      include: {
        options: { include: { votes: true } },
        config: true,
      },
    })

    const formattedPoll = {
      ...updated,
      options: updated.options.map((opt: any) => ({
        id: opt.id,
        label: opt.label,
        voteCount: opt.votes.length,
      })),
    }

    res.json(formattedPoll)
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

// Close/End Poll
app.patch("/api/v1/polls/:id/close", verifyToken, async (req: Request, res: Response) => {
  try {
    const pollId = req.params.id as string
    const userId = req.user!.id
    const userRole = (req.user as any).role

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { creatorId: true, status: true }
    })

    if (!poll) {
      return res.status(404).json({ error: "Poll not found", statusCode: 404, message: "Not found" })
    }

    // Only admin or creator can close poll
    if (userRole !== "admin" && poll.creatorId !== userId) {
      return res.status(403).json({ error: "Not authorized", statusCode: 403, message: "Only admin or creator can close poll" })
    }

    // Update poll status to closed
    const updatedPoll = await prisma.poll.update({
      where: { id: pollId },
      data: { status: "closed" },
      select: {
        id: true,
        title: true,
        status: true,
        creatorId: true,
      }
    })

    res.json(updatedPoll)
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.delete("/api/v1/polls/:id", verifyToken, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const poll = await prisma.poll.findUnique({ where: { id: req.params.id as string } })

    if (!poll) {
      return res.status(404).json({ error: "Poll not found", statusCode: 404, message: "Not found" })
    }

    await prisma.poll.delete({ where: { id: req.params.id as string } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

// Vote Route with middleware chain
app.post("/api/v1/polls/:id/vote", async (req: Request, res: Response) => {
  try {
    const { optionIds, editMode } = req.body // Array for multiple choice support, editMode to update existing vote
    const pollId = req.params.id

    // Get user from auth header if available
    let userId: string | null = null
    const authHeader = req.headers.authorization
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, JWT_SECRET) as AuthJWT
        userId = decoded.userId
      } catch (e) {
        // No valid token, continue as guest
      }
    }

    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return res.status(400).json({ error: "Invalid options", statusCode: 400, message: "Must provide at least one option" })
    }

    const ipAddress = getClientIp(req)

    // 1. Check poll exists
    const poll = await prisma.poll.findUnique({
      where: { id: pollId as string },
      include: { config: true, options: { include: { votes: true } } },
    }) as any

    if (!poll) {
      return res.status(404).json({ error: "Poll not found", statusCode: 404, message: "Poll not found" })
    }

    // 2. Check poll is open
    if (poll.status !== "active") {
      return res.status(400).json({ error: "Poll closed", statusCode: 400, message: "This poll is no longer accepting votes" })
    }

    // 3. Check deadline
    if (poll.config?.deadline && new Date(poll.config.deadline) < new Date()) {
      return res.status(400).json({ error: "Deadline passed", statusCode: 400, message: "This poll has expired" })
    }

    // 4. Check auth required
    if (poll.config?.requireAuth && !userId) {
      return res.status(401).json({ error: "Auth required", statusCode: 401, message: "You must be logged in to vote on this poll" })
    }

    // 5. Check access control
    if (poll.config?.requireAccess && userId) {
      const hasAccess = await (prisma as any).pollAccess.findUnique({
        where: { pollId_userId: { pollId: pollId as string, userId } },
      })
      if (!hasAccess) {
        return res.status(403).json({ error: "No access", statusCode: 403, message: "You don't have permission to vote on this poll" })
      }
    }

    // 6. Check multiple choice limit
    if (!poll.config?.multipleChoice && optionIds.length > 1) {
      return res.status(400).json({ error: "Single choice only", statusCode: 400, message: "This poll only allows one vote" })
    }

    if (optionIds.length > (poll.config?.maxVotesPerUser || 1)) {
      return res.status(400).json({ error: "Too many votes", statusCode: 400, message: `You can only vote for up to ${poll.config?.maxVotesPerUser} options` })
    }

    // 7. Check existing votes
    if (userId) {
      const existingVotes = await prisma.vote.count({
        where: { pollId: pollId as string, userId },
      })
      if (existingVotes > 0 && !editMode) {
        return res.status(409).json({ error: "Duplicate vote", statusCode: 409, message: "You have already voted on this poll" })
      }
      // If editMode is true, delete existing votes before creating new ones
      if (existingVotes > 0 && editMode) {
        await prisma.vote.deleteMany({
          where: { pollId: pollId as string, userId },
        })
        console.log(`\x1b[32m[DEBUG]\x1b[0m User ${userId} deleted ${existingVotes} existing votes for poll ${pollId}`)
      }
    }

    // 8. Check IP limit
    const ipVotes = await prisma.vote.count({
      where: { pollId: pollId as string, ipAddress },
    })
    if (ipVotes >= (poll.config?.ipLimit || 1)) {
      return res.status(429).json({ error: "IP limit exceeded", statusCode: 429, message: "Too many votes from this IP address" })
    }

    // 9. Check total max votes
    const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + opt.votes.length, 0)
    if (poll.config?.totalMaxVotes && totalVotes + optionIds.length > poll.config.totalMaxVotes) {
      return res.status(400).json({ error: "Max votes reached", statusCode: 400, message: "This poll has reached its maximum vote count" })
    }

    // Record votes
    const votes = await Promise.all(
      optionIds.map((optionId) =>
        prisma.vote.create({
          data: {
            pollId: pollId as string,
            optionId,
            userId,
            ipAddress,
          },
        })
      )
    )

    res.status(200).json({
      votes: votes.map((v) => ({ id: v.id, pollId: v.pollId, optionId: v.optionId, createdAt: v.createdAt })),
    })
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

// Poll Access Routes
app.get("/api/v1/polls/:id/access", verifyToken, async (req: Request, res: Response) => {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: req.params.id as string },
    })

    if (!poll) {
      return res.status(404).json({ error: "Poll not found", statusCode: 404, message: "Not found" })
    }

    if (poll.creatorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Forbidden", statusCode: 403, message: "Insufficient permissions" })
    }

    const access = await (prisma as any).pollAccess.findMany({
      where: { pollId: req.params.id as string },
      include: { user: { select: { id: true, email: true } } },
    })

    res.json({ access })
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.post("/api/v1/polls/:id/access", verifyToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body
    const pollId = req.params.id as string

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    })

    if (!poll) {
      return res.status(404).json({ error: "Poll not found", statusCode: 404, message: "Not found" })
    }

    if (poll.creatorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Forbidden", statusCode: 403, message: "Insufficient permissions" })
    }

    const access = await (prisma as any).pollAccess.create({
      data: {
        pollId,
        userId,
        grantedBy: req.user!.id,
      },
      include: { user: { select: { id: true, email: true } } },
    })

    res.status(201).json({ access })
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Already granted", statusCode: 409, message: "User already has access" })
    }
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.delete("/api/v1/polls/:id/access/:userId", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params as { id: string; userId: string }

    const poll = await prisma.poll.findUnique({
      where: { id },
    })

    if (!poll) {
      return res.status(404).json({ error: "Poll not found", statusCode: 404, message: "Not found" })
    }

    if (poll.creatorId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Forbidden", statusCode: 403, message: "Insufficient permissions" })
    }

    await (prisma as any).pollAccess.delete({
      where: { pollId_userId: { pollId: id, userId } },
    })

    res.json({ message: "Access revoked" })
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

// Admin Routes
app.get("/api/v1/admin/users", verifyToken, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const users = (await prisma.user.findMany()) as any
    res.json({
      users: users.map((u: any) => ({
        id: u.id,
        email: u.email,
        discordUsername: u.discordUsername,
        discordAvatar: u.discordAvatar,
        role: u.role,
        isBlocked: u.isBlocked,
        createdAt: u.createdAt
      })),
      total: users.length,
    })
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.post("/api/v1/admin/users", verifyToken, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { email, role = "voter" } = req.body

    if (!email) {
      return res.status(400).json({ error: "Missing email", statusCode: 400, message: "Email is required" })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ error: "User exists", statusCode: 409, message: "Email already registered" })
    }

    // Generate random password
    const randomPassword = Math.random().toString(36).slice(-12) + "Aa1!"
    const passwordHash = await hashPassword(randomPassword)

    const user = await prisma.user.create({
      data: { email, passwordHash, role },
    })

    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
      password: randomPassword,
    })
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.delete("/api/v1/admin/users/:id", verifyToken, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ error: "User not found", statusCode: 404, message: "User does not exist" })
    }

    // Check if trying to delete the last admin
    if (user.role === "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } })
      if (adminCount === 1) {
        return res.status(400).json({ error: "Cannot delete", statusCode: 400, message: "Cannot delete the last admin" })
      }
    }

    // Delete user's polls and votes first
    await prisma.vote.deleteMany({ where: { userId } })
    await prisma.poll.deleteMany({ where: { creatorId: userId } })

    // Delete user
    await prisma.user.delete({ where: { id: userId } })

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.patch("/api/v1/admin/users/:id", verifyToken, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { role, isBlocked } = req.body
    const updateData: any = {}

    // Update role if provided
    if (role) {
      // Check if downgrading last admin
      if (role !== "admin") {
        const adminCount = await prisma.user.count({ where: { role: "admin" } })
        const targetUser = await prisma.user.findUnique({ where: { id: req.params.id as string } })

        if (targetUser?.role === "admin" && adminCount === 1) {
          return res.status(400).json({ error: "Cannot demote", statusCode: 400, message: "Cannot demote the last admin" })
        }
      }
      updateData.role = role
    }

    // Update blocked status if provided
    if (typeof isBlocked === "boolean") {
      updateData.isBlocked = isBlocked
    }

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: updateData,
    })

    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        discordUsername: (user as any).discordUsername,
        discordAvatar: (user as any).discordAvatar,
        role: user.role, 
        isBlocked: (user as any).isBlocked,
        createdAt: user.createdAt 
      } 
    })
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

app.patch("/api/v1/admin/users/:id/role", verifyToken, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { role } = req.body

    // Check if downgrading last admin
    if (role !== "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } })
      const targetUser = await prisma.user.findUnique({ where: { id: req.params.id as string } })

      if (targetUser?.role === "admin" && adminCount === 1) {
        return res.status(400).json({ error: "Cannot demote", statusCode: 400, message: "Cannot demote the last admin" })
      }
    }

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { role },
    })

    res.json({ user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt } })
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

// Stats endpoint
app.get("/api/v1/stats", verifyToken, async (req: Request, res: Response) => {
  try {
    const totalPolls = await prisma.poll.count()
    const activePolls = await prisma.poll.count({ where: { status: "active" } })
    const totalUsers = await prisma.user.count()
    const totalVotes = await prisma.vote.count()

    res.json({
      data: {
        totalPolls,
        activePolls,
        totalUsers,
        totalVotes,
      },
    })
  } catch (error) {
    res.status(500).json({ error: "Server error", statusCode: 500, message: "Internal server error" })
  }
})

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" })
})

// Start server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`\n🚀 Server is running at http://localhost:${port}\n`)
  
  // Initialize database async in background (non-blocking)
  initializeDatabase().catch(() => {})
  
  // Initialize Discord bot async in background (non-blocking)
  initializeServices().catch(() => {})
})

export default app
