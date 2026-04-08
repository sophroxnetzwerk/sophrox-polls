import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000"

export interface Category {
  id: string
  name: string
  description?: string
  discordRoleId?: string
  createdBy: string
}

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/v1/categories`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to fetch categories")
      return response.json() as Promise<{ categories: Category[] }>
    },
    staleTime: 60000,
    gcTime: 600000,
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; discordRoleId?: string }) => {
      const response = await fetch(`${API_BASE}/api/v1/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to create category")
      return response.json() as Promise<{ category: Category }>
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
      const response = await fetch(`${API_BASE}/api/v1/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to update category")
      return response.json() as Promise<{ category: Category }>
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
      const response = await fetch(`${API_BASE}/api/v1/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to delete category")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}
