export type Role = "admin" | "creator" | "voter"
export type PollStatus = "active" | "closed" | "draft"

export interface User {
  id: string
  email: string
  role: Role
  createdAt: Date
}

export interface Poll {
  id: string
  title: string
  description?: string
  creatorId: string
  options: PollOption[]
  config: PollConfig
  status: PollStatus
  createdAt: Date
  closedAt?: Date
}

export interface PollOption {
  id: string
  pollId: string
  label: string
  voteCount: number
}

export interface PollConfig {
  maxVotes?: number        // Auto-close when total votes reach this limit
  votesPerUser: number     // Default: 1
  requireAuth: boolean     // If true, anonymous voting is blocked
  ipLimit: number          // Max votes per IP address per poll
  deadline?: Date          // Auto-close at this timestamp
  captchaEnabled: boolean  // Placeholder for future CAPTCHA integration
}

export interface Vote {
  id: string
  pollId: string
  optionId: string
  userId?: string          // null for anonymous votes
  ipAddress: string
  createdAt: Date
}
