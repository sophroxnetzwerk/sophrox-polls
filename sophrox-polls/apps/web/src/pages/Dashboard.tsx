import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, FileText, Settings } from "lucide-react"
import { getUserRole, getUserId } from "../lib/auth"
import { usePollList } from "../hooks/usePolls"
import type { Poll } from "../hooks/usePolls"
import PollCard from "../components/polls/PollCard"

export const NewDashboard = () => {
  const { t } = useTranslation()
  const role = getUserRole()
  const userId = getUserId() || ""
  const { data, isLoading } = usePollList()

  const myPolls = data?.polls.filter((poll: Poll) => poll.creatorId === userId) || []
  const allPolls = data?.polls || []

  const stats = {
    totalPolls: allPolls.length,
    myPolls: myPolls.length,
    totalVotes: allPolls.reduce(
      (sum: number, poll: Poll) => sum + poll.options.reduce((s: number, o: any) => s + o.voteCount, 0),
      0
    ),
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Welcome Header */}
      <div>
        <h1 className="text-4xl font-bold">{t("dashboard.welcomeBack")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("dashboard.managePolls")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.myPolls")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myPolls}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.pollsYouCreated")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalPolls")}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPolls}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.inTheSystem")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalVotes")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVotes}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.castAcrossAll")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="my-polls" className="w-full flex flex-col flex-1">
        <TabsList className="grid w-full grid-cols-3 w-min">
          <TabsTrigger value="my-polls">{t("dashboard.myPolls")}</TabsTrigger>
          {role === "admin" && (
            <TabsTrigger value="all-polls">{t("dashboard.allPolls")}</TabsTrigger>
          )}
          {(role === "creator" || role === "admin") && (
            <TabsTrigger value="actions">{t("common.settings")}</TabsTrigger>
          )}
        </TabsList>

        {/* My Polls Tab */}
        <TabsContent value="my-polls" className="flex flex-col flex-1">
          <h2 className="text-xl font-semibold mb-6">{t("polls.myPolls")}</h2>
          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-muted-foreground">{t("common.loading")}</div>
            </div>
          ) : myPolls.length === 0 ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-muted-foreground">{t("dashboard.noPollsFound")}</p>
              {(role === "creator" || role === "admin") && (
                <Link to="/polls/create">
                  <Button>{t("dashboard.createNewPoll")}</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myPolls.map((poll: Poll) => (
                <PollCard
                  key={poll.id}
                  id={poll.id}
                  title={poll.title}
                  description={poll.description}
                  status={poll.status}
                  optionCount={poll.options.length}
                  totalVotes={poll.options.reduce(
                    (sum: number, opt: any) => sum + opt.voteCount,
                    0
                  )}
                  creatorId={poll.creatorId}
                  creator={poll.creator}
                  category={poll.category}
                  currentUserId={userId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* All Polls Tab (Admin only) */}
        {role === "admin" && (
          <TabsContent value="all-polls" className="flex flex-col flex-1">
            <h2 className="text-xl font-semibold mb-6">{t("polls.allPollsInSystem")}</h2>
            {isLoading ? (
              <div className="flex items-center justify-center flex-1">
                <div className="text-muted-foreground">{t("common.loading")}</div>
              </div>
            ) : allPolls.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t("dashboard.noPollsFound")}</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allPolls.map((poll: Poll) => (
                  <PollCard
                    key={poll.id}
                    id={poll.id}
                    title={poll.title}
                    description={poll.description}
                    status={poll.status}
                    optionCount={poll.options.length}
                    totalVotes={poll.options.reduce(
                      (sum: number, opt: any) => sum + opt.voteCount,
                      0
                    )}
                    creatorId={poll.creatorId}
                    creator={poll.creator}
                    category={poll.category}
                    currentUserId={userId}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* Quick Actions Tab */}
        {(role === "creator" || role === "admin") && (
          <TabsContent value="actions" className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer hover:bg-accent transition-colors">
                <Link to="/polls/create">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Create New Poll
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Create a new poll and share it with others
                    </p>
                  </CardContent>
                </Link>
              </Card>

              {role === "admin" && (
                <>
                  <Card className="cursor-pointer hover:bg-accent transition-colors">
                    <Link to="/admin">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          Admin Panel
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Manage categories and users
                        </p>
                      </CardContent>
                    </Link>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default NewDashboard
