import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"

export interface Category {
  id: string
  name: string
  description?: string
  discordRoleId?: string
  discordRoleColor?: string
  createdBy: string
}

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      console.log("[FRONTEND] Fetching categories...")
      const result = await api.get<{ categories: Category[] }>("/categories")
      console.log("[FRONTEND] Categories loaded:", result)
      return result
    },
    staleTime: 60000,
    gcTime: 600000,
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; discordRoleId?: string }) => {
      return api.post<{ category: Category }>("/categories", data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: { name?: string; description?: string; discordRoleId?: string }
    }) => {
      return api.patch<{ category: Category }>(`/categories/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<{ success: boolean }>(`/categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}
