import { User, Poll, PollOption, Vote, Role, PollStatus } from "./types"

// Auth API
export interface RegisterRequest {
  email: string
  password: string
}

export interface RegisterResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
}

export interface LogoutRequest {
  // no body required
}

export interface LogoutResponse {
  success: boolean
}

// Polls API
export interface CreatePollRequest {
  title: string
  description?: string
  options: string[]
  config: {
    maxVotes?: number
    votesPerUser?: number
    requireAuth?: boolean
    ipLimit?: number
    deadline?: string
    captchaEnabled?: boolean
  }
}

export interface PollResponse {
  id: string
  title: string
  description?: string
  creatorId: string
  options: PollOption[]
  config: {
    maxVotes?: number
    votesPerUser: number
    requireAuth: boolean
    ipLimit: number
    deadline?: string
    captchaEnabled: boolean
  }
  status: PollStatus
  createdAt: string
  closedAt?: string
}

export interface PollListResponse {
  polls: PollResponse[]
  total: number
}

export interface UpdatePollRequest {
  title?: string
  description?: string
  status?: PollStatus
}

export interface DeletePollResponse {
  success: boolean
}

// Votes API
export interface CastVoteRequest {
  optionId: string
}

export interface VoteResponse {
  id: string
  pollId: string
  optionId: string
  createdAt: string
}

// Admin API
export interface UserResponse {
  id: string
  email: string
  role: Role
  createdAt: string
}

export interface UserListResponse {
  users: UserResponse[]
  total: number
}

export interface UpdateUserRoleRequest {
  role: Role
}

export interface UpdateUserRoleResponse {
  user: UserResponse
}

// Error responses
export interface ErrorResponse {
  error: string
  statusCode: number
  message: string
}
