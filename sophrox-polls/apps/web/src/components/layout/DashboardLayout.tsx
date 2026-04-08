import { useState, useMemo, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, Zap, TrendingUp, BarChart3, Loader2, Filter } from "lucide-react"
import { getUserRole, getUserId, isAuthenticated } from "../../lib/auth"
import { usePollList } from "../../hooks/usePolls"
import { useCategories } from "../../hooks/useCategories"
import { api } from "../../lib/api"
import type { Poll } from "../../hooks/usePolls"
import PollCard from "../polls/PollCard"
import CreatePollModal from "../polls/CreatePollModal"

export const DashboardLayout = () => {
  const { t } = useTranslation()
  const role = getUserRole()
  const userId = getUserId() || ""
  const queryClient = useQueryClient()
  const { data, isLoading } = usePollList()
  const { data: categoriesData } = useCategories()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("polls")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<{ active: boolean; closed: boolean }>({ active: true, closed: true })

  // Sync roles every 15 seconds to catch Discord role changes
  useEffect(() => {
    if (!isAuthenticated()) return

    const syncInterval = setInterval(async () => {
      try {
        await api.post("/auth/sync-roles", {})
        // Invalidate cache to refresh polls and categories
        await queryClient.invalidateQueries({ queryKey: ["polls"] })
        await queryClient.invalidateQueries({ queryKey: ["categories"] })
        console.log("🔄 [AUTO-SYNC] Roles and cache refreshed")
      } catch (error) {
        console.warn("⚠️ [AUTO-SYNC] Failed to sync roles:", error)
      }
    }, 15000) // 15 seconds

    return () => clearInterval(syncInterval)
  }, [queryClient])

  const myPolls = useMemo(
    () => (data?.polls || []).filter((poll: Poll) => poll.creatorId === userId) || [],
    [data?.polls, userId]
  )

  const activePolls = useMemo(
    () => (data?.polls || []).filter((poll: Poll) => poll.status === "active") || [],
    [data?.polls]
  )

  const filteredPolls = useMemo(
    () =>
      (role === "admin" ? data?.polls || [] : myPolls).filter(
        (poll: Poll) =>
          (poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          poll.description?.toLowerCase().includes(searchQuery.toLowerCase())) &&
          (selectedCategory === "all" || poll.categoryId === selectedCategory) &&
          ((poll.status === "active" && statusFilter.active) || (poll.status === "closed" && statusFilter.closed))
      ),
    [data?.polls, myPolls, searchQuery, role, selectedCategory, statusFilter]
  )

  const totalVotes = useMemo(
    () =>
      (data?.polls || []).reduce(
        (sum: number, poll: Poll) =>
          sum +
          poll.options.reduce((s: number, o: any) => s + (o.voteCount || 0), 0),
        0
      ),
    [data?.polls]
  )

  const stats = [
    {
      title: t("dashboard.totalPolls"),
      value: data?.polls?.length || 0,
      icon: BarChart3,
      description: t("polls.allPollsInSystem"),
      color: "bg-primary/10 text-primary",
    },
    {
      title: t("polls.activePollsLabel"),
      value: activePolls?.length || 0,
      icon: Zap,
      description: t("polls.currentlyOpen"),
      color: "bg-green-500/10 text-green-700 dark:text-green-400",
    },
    {
      title: role === "admin" ? t("polls.creatorPolls") : t("dashboard.myPolls"),
      value: myPolls?.length || 0,
      icon: TrendingUp,
      description: role === "admin" ? t("polls.pollsCreatedByUsers") : t("dashboard.pollsYouCreated"),
      color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    },
    {
      title: t("dashboard.totalVotes"),
      value: totalVotes || 0,
      icon: BarChart3,
      description: t("polls.votesCastOverall"),
      color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header Bar */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-8 py-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {activeTab === "polls" ? (role === "admin" ? t("polls.allPolls") : t("dashboard.myPolls")) : t("admin.recentActivity")}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1 p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <div className={`p-2.5 rounded-lg ${stat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <CardDescription className="text-xs">{stat.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Search & Content */}
          <Tabs defaultValue="polls" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <TabsList className="self-start">
                <TabsTrigger value="polls">
                  {role === "admin" ? t("polls.allPolls") : t("dashboard.myPolls")}
                </TabsTrigger>
                {role === "admin" && <TabsTrigger value="recent">{t("admin.recentActivity")}</TabsTrigger>}
              </TabsList>

              <div className="flex gap-2 w-full sm:w-auto">
                {/* Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Filter</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Status Submenu */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Zap className="w-4 h-4 mr-2" />
                        Status
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuCheckboxItem
                          checked={statusFilter.active}
                          onCheckedChange={(checked) =>
                            setStatusFilter({ ...statusFilter, active: checked })
                          }
                        >
                          <Zap className="w-3 h-3 mr-2 text-green-500" />
                          Open
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={statusFilter.closed}
                          onCheckedChange={(checked) =>
                            setStatusFilter({ ...statusFilter, closed: checked })
                          }
                        >
                          <BarChart3 className="w-3 h-3 mr-2 text-red-500" />
                          Closed
                        </DropdownMenuCheckboxItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {/* Categories Submenu */}
                    {categoriesData?.categories && categoriesData.categories.length > 0 && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Categories
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuCheckboxItem
                            checked={selectedCategory === "all"}
                            onCheckedChange={() => setSelectedCategory("all")}
                          >
                            All Categories
                          </DropdownMenuCheckboxItem>
                          {categoriesData.categories.map((category: any) => (
                            <DropdownMenuCheckboxItem
                              key={category.id}
                              checked={selectedCategory === category.id}
                              onCheckedChange={() => setSelectedCategory(category.id)}
                            >
                              {category.name}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Search Input */}
                <div className="relative flex-1 sm:flex-none sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search polls..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>

                {/* Create New Button */}
                {(role === "creator" || role === "admin") && (
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="gap-2 whitespace-nowrap h-10"
                    size="default"
                  >
                    <Plus className="w-4 h-4" />
                    Create New
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="polls" className="space-y-6">
              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-10 h-10 animate-spin text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Loading polls...</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && filteredPolls.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="pt-8">
                    <div className="flex flex-col items-center justify-center text-center py-8">
                      <BarChart3 className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
                      <p className="text-base font-medium">
                        {searchQuery
                          ? t("polls.noPollsFoundMatching")
                          : role === "admin"
                            ? t("polls.noPollsCreatedYet")
                            : t("polls.youHaventCreatedAnyPolls")}
                      </p>
                      {!searchQuery && (role === "creator" || role === "admin") && (
                        <Link to="/polls/create" className="mt-4">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            {t("polls.createYourFirstPoll")}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Polls Grid */}
              {!isLoading && filteredPolls.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPolls.map((poll: Poll) => (
                    <PollCard
                      key={poll.id}
                      id={poll.id}
                      title={poll.title}
                      description={poll.description}
                      status={poll.status}
                      optionCount={poll.options.length}
                      totalVotes={poll.options.reduce((sum, o) => sum + (o.voteCount || 0), 0)}
                      creatorId={poll.creatorId}
                      creator={poll.creator}
                      category={poll.category}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {role === "admin" && (
              <TabsContent value="recent" className="space-y-6">
                <Card className="border-dashed">
                  <CardContent className="pt-8">
                    <div className="flex flex-col items-center justify-center text-center py-12">
                      <p className="text-muted-foreground">{t("admin.recentActivityComingSoon")}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Footer - sticky to bottom */}
        <div className="border-t border-border px-8 py-4 mt-auto">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>© 2026 Sophrox</span>
            <span>•</span>
            <span>Secured by Blume Security</span>
          </div>
        </div>
      </div>

      {/* Create Poll Modal */}
      <CreatePollModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  )
}
