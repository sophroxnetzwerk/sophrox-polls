import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export interface Poll {
  id: string
  title: string
  description?: string
  creatorId: string
  categoryId?: string
  userVotes?: string[] // Array of optionIds that current user voted for
  creator?: {
    id: string
    discordUsername?: string
    discordAvatar?: string
  }
  category?: {
    id: string
    name: string
  }
  options: Array<{ 
    id: string
    label: string
    voteCount: number
    voters?: Array<{
      id: string
      user?: {
        id: string
        discordUsername?: string
        discordAvatar?: string
      }
    }>
  }>
  status: "active" | "closed" | "draft"
  config: {
    maxVotes?: number
    votesPerUser: number
    requireAuth: boolean
    ipLimit: number
    deadline?: string
    captchaEnabled: boolean
    showVoters: boolean
  }
  createdAt: string
  closedAt?: string
}

export const usePollList = () => {
  return useQuery({
    queryKey: ["polls"],
    queryFn: async () => {
      console.log("[FRONTEND] Fetching polls...")
      const result = await api.get<{ polls: Poll[]; total: number }>("/polls")
      console.log("[FRONTEND] Polls loaded:", result)
      if (result.polls && result.polls.length > 0) {
        console.log("[FRONTEND] First poll category:", result.polls[0].category)
      }
      return result
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const usePollDetail = (id: string) => {
  return useQuery({
    queryKey: ["polls", id],
    queryFn: () => api.get<Poll>(`/polls/${id}`),
    refetchInterval: 5000, // Live results every 5s
  })
}

export const useCreatePoll = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => api.post<Poll>("/polls", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls"] })
    },
  })
}

export const useUpdatePoll = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => api.patch<Poll>(`/polls/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls", id] })
      queryClient.invalidateQueries({ queryKey: ["polls"] })
    },
  })
}

export const useDeletePoll = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.delete<{ success: boolean }>(`/polls/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls"] })
    },
  })
}

export const useClosePoll = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.patch<Poll>(`/polls/${id}/close`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls", id] })
      queryClient.invalidateQueries({ queryKey: ["polls"] })
    },
  })
}
