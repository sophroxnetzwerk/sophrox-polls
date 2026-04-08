import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { toast } from "sonner"

export interface Vote {
  id: string
  pollId: string
  optionId: string
  createdAt: string
}

export const useVote = (pollId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { optionId: string; editMode?: boolean }) =>
      api.post<Vote>(`/polls/${pollId}/vote`, { optionIds: [params.optionId], editMode: params.editMode || false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls", pollId] })
      toast.success("Vote cast successfully!")
    },
    onError: (error: any) => {
      const statusCode = error.message.match(/\d{3}/)?.[0]

      if (statusCode === "409") {
        toast.error("Already Voted: You have already voted on this poll.")
      } else if (statusCode === "429") {
        toast.error("Vote Limit Exceeded: You have reached the maximum votes from your IP address.")
      } else if (statusCode === "400") {
        toast.error(error.message || "Cannot Vote: This poll is closed or expired.")
      } else if (statusCode === "401") {
        toast.error("Authentication Required: You must be logged in to vote on this poll.")
      } else {
        toast.error(error.message || "Failed to cast vote.")
      }
    },
  })
}
