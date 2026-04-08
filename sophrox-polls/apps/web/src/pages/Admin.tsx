import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Plus, Edit2, Trash2, Clock, CheckCircle2 } from "lucide-react"

interface User {
  id: string
  email: string
  discordUsername?: string
  discordAvatar?: string
  role: "admin" | "creator" | "voter"
  isBlocked: boolean
  createdAt: string
}

interface Category {
  id: string
  name: string
  description?: string
  discordRoleId?: string
  createdBy: string
}

const Admin = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState("")
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    discordRoleId: "",
  })

  // Queries
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => {
      console.log("[ADMIN] Fetching admin users...")
      return api.get<{ users: User[] }>("/admin/users")
    },
  })

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => {
      console.log("[ADMIN] Fetching categories...")
      return api.get<{ categories: Category[] }>("/categories")
    },
    staleTime: 60000,
    gcTime: 600000,
  })

  const { data: discordRolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["discord", "roles"],
    queryFn: () => {
      console.log("[ADMIN] Fetching Discord roles...")
      return api
        .get<{
          roles: Array<{ id: string; name: string; color: string }>
        }>("/discord/roles")
        .then((data) => {
          console.log("[ADMIN] Discord roles loaded successfully:", data?.roles?.length || 0, "roles")
          console.log("[ADMIN] Role names:", data?.roles?.map((r: any) => r.name).join(", "))
          return data
        })
        .catch((error) => {
          console.error("[ADMIN] Failed to fetch Discord roles:", error)
          throw error
        })
    },
    staleTime: 60000,
    gcTime: 600000,
  })

  // Mutations
  const { mutateAsync: updateRole, isPending: isUpdatingRole } = useMutation({
    mutationFn: (variables: { userId: string; role: string }) =>
      api.patch<{ user: User }>(`/admin/users/${variables.userId}`, {
        role: variables.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success(t("admin.roleUpdatedSuccess"))
      setSelectedUser(null)
      setIsUserDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.message || t("admin.failedToUpdateRole"))
    },
  })

  const { mutateAsync: blockUser, isPending: isBlockingUser } = useMutation({
    mutationFn: (userId: string) =>
      api.patch(`/admin/users/${userId}`, { isBlocked: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success(t("admin.userBlockedSuccess"))
    },
    onError: (error: any) => {
      toast.error(error.message || t("admin.failedToBlockUser"))
    },
  })

  const { mutateAsync: unblockUser, isPending: isUnblockingUser } = useMutation({
    mutationFn: (userId: string) =>
      api.patch(`/admin/users/${userId}`, { isBlocked: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success(t("admin.userUnblockedSuccess"))
    },
    onError: (error: any) => {
      toast.error(error.message || t("admin.failedToUnblockUser"))
    },
  })

  const { mutateAsync: deleteUser, isPending: isDeletingUser } = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success(t("admin.userDeletedSuccess"))
    },
    onError: (error: any) => {
      toast.error(error.message || t("admin.failedToDeleteUser"))
    },
  })

  const { mutateAsync: createCategory, isPending: isCreatingCategory } = useMutation({
    mutationFn: (data: {
      name: string
      description?: string
      discordRoleId?: string
    }) => api.post("/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success(t("admin.categoryCreatedSuccess"))
      handleCloseCategoryDialog()
    },
    onError: (error: any) => {
      toast.error(error instanceof Error ? error.message : t("admin.operationFailed"))
    },
  })

  const { mutateAsync: updateCategory, isPending: isUpdatingCategory } = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { name?: string; description?: string; discordRoleId?: string }
    }) => api.patch(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success(t("admin.categoryUpdatedSuccess"))
      handleCloseCategoryDialog()
    },
    onError: (error: any) => {
      toast.error(error instanceof Error ? error.message : t("admin.operationFailed"))
    },
  })

  const { mutateAsync: deleteCategory, isPending: isDeletingCategory } = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.success(t("admin.categoryDeletedSuccess"))
    },
    onError: (error: any) => {
      toast.error(error instanceof Error ? error.message : t("admin.operationFailed"))
    },
  })

  const handleUpdateRole = async () => {
    if (selectedUser && editRole && editRole !== selectedUser.role) {
      await updateRole({ userId: selectedUser.id, role: editRole })
    }
  }

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategoryId(category.id)
      setCategoryForm({
        name: category.name,
        description: category.description || "",
        discordRoleId: category.discordRoleId || "",
      })
    } else {
      setEditingCategoryId(null)
      setCategoryForm({ name: "", description: "", discordRoleId: "" })
    }
    setIsCategoryDialogOpen(true)
  }

  const handleCloseCategoryDialog = () => {
    setIsCategoryDialogOpen(false)
    setEditingCategoryId(null)
    setCategoryForm({ name: "", description: "", discordRoleId: "" })
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error(t("admin.nameRequired"))
      return
    }

    try {
      if (editingCategoryId) {
        await updateCategory({
          id: editingCategoryId,
          data: categoryForm,
        })
      } else {
        await createCategory(categoryForm)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operation failed")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const users = usersData?.users || []
  const blockedUsers = users.filter(u => u.isBlocked)
  const activeUsers = users.filter(u => !u.isBlocked)
  const categories = categoriesData?.categories || []

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t("admin.manageUsers")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.manageCategories")}</p>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="pending" className="w-full flex flex-col flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            {t("admin.blockedUsers")} {blockedUsers.length > 0 && `(${blockedUsers.length})`}
          </TabsTrigger>
          <TabsTrigger value="users">
            {t("admin.users")} {activeUsers.length > 0 && `(${activeUsers.length})`}
          </TabsTrigger>
          <TabsTrigger value="categories">{t("admin.categories")}</TabsTrigger>
        </TabsList>

        {/* Pending Users Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-destructive" />
                {t("admin.blockedUsers")}
              </CardTitle>
              <CardDescription>
                {blockedUsers.length} blocked user{blockedUsers.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">{t("common.loading")}</div>
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground text-sm">{t("admin.noBlockedUsers")}</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((user: User) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.discordAvatar} />
                          <AvatarFallback>{user.discordUsername?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.discordUsername || user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => unblockUser(user.id)}
                          disabled={isUnblockingUser}
                          className="flex-1 sm:flex-none"
                        >
                          Unblock
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          disabled={isDeletingUser}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Users Tab */}
        <TabsContent value="users" className="flex flex-col gap-4 flex-1">
          <Card className="flex flex-col flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                Active Users
              </CardTitle>
              <CardDescription>
                Total: {usersLoading ? "..." : activeUsers.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : activeUsers.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground text-sm">{t("admin.noActiveUsers")}</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeUsers.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.discordAvatar} />
                                <AvatarFallback>{user.discordUsername?.charAt(0) || "U"}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.discordUsername || user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{user.role}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setEditRole(user.role)
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Update User Role</DialogTitle>
                                  </DialogHeader>
                                  {selectedUser && (
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12">
                                          <AvatarImage src={selectedUser.discordAvatar} />
                                          <AvatarFallback>
                                            {selectedUser.discordUsername?.charAt(0) || "U"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">
                                            {selectedUser.discordUsername || selectedUser.email}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedUser.email}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <Label htmlFor="new-role" className="text-sm mb-2 block">
                                          New Role
                                        </Label>
                                        <Select
                                          value={editRole}
                                          onValueChange={setEditRole}
                                        >
                                          <SelectTrigger id="new-role">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="voter">{t("common.voter")}</SelectItem>
                                            <SelectItem value="creator">{t("common.creator")}</SelectItem>
                                            <SelectItem value="admin">{t("common.admin")}</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex gap-2 justify-end pt-4">
                                        <Button
                                          variant="outline"
                                          onClick={() => setIsUserDialogOpen(false)}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={handleUpdateRole}
                                          disabled={isUpdatingRole || editRole === selectedUser.role}
                                        >
                                          Update
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => blockUser(user.id)}
                                disabled={isBlockingUser}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="flex flex-col gap-4 flex-1">
          <Card className="flex flex-col flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Categories</CardTitle>
                <CardDescription>
                  {categoriesLoading ? "Loading..." : `${categories.length} categories`}
                </CardDescription>
              </div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenCategoryDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategoryId ? t("admin.editCategory") : t("admin.createNewCategory")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Name *</Label>
                      <Input
                        placeholder="e.g., Backend Team"
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea
                        placeholder="Optional description..."
                        value={categoryForm.description}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, description: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Discord Role (Optional)</Label>
                      <Select
                        value={categoryForm.discordRoleId}
                        onValueChange={(value) =>
                          setCategoryForm({ ...categoryForm, discordRoleId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingRoles ? "Loading roles..." : "Select a Discord role..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {!isLoadingRoles && discordRolesData?.roles && discordRolesData.roles.length > 0 ? (
                            discordRolesData.roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))
                          ) : isLoadingRoles ? (
                            <div className="p-2 text-sm text-muted-foreground">Loading roles...</div>
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">No roles available</div>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        Users with the selected role will automatically get access to this category.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={handleCloseCategoryDialog}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveCategory}
                      disabled={isCreatingCategory || isUpdatingCategory}
                    >
                      {isCreatingCategory || isUpdatingCategory ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : categories.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {t("admin.noCategoriesCreated")}
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Discord Role ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          {category.description || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {category.discordRoleId ? category.discordRoleId.slice(0, 12) + "..." : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenCategoryDialog(category)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteCategory(category.id)}
                              disabled={isDeletingCategory}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Admin
