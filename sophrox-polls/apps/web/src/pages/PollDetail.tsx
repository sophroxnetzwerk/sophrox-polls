import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft, X } from "lucide-react"
import { usePollDetail, useClosePoll } from "../hooks/usePolls"
import { getUserRole, getUserId } from "../lib/auth"
import VoteForm from "../components/polls/VoteForm"
import { Separator } from "@/components/ui/separator"

const formatPollOption = (option: string) => {
  try {
    const date = new Date(option)
    if (!isNaN(date.getTime())) {
      return format(date, "PPp")
    }
  } catch (e) {
    // Not a date, return as-is
  }
  return option
}

export const PollDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const role = getUserRole()
  const userId = getUserId()
  const { data: poll, isLoading, error } = usePollDetail(id!)
  const { mutate: closePoll, isPending: isClosing } = useClosePoll(id!)

  console.log(`[PollDetail] Poll data:`, poll, "userVotes:", poll?.userVotes)

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 text-center space-y-4">
            <p className="text-lg font-semibold">{t("errors.pollNotFound")}</p>
            <p className="text-muted-foreground text-sm">{t("errors.pollNotFoundDesc")}</p>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              {t("errors.backToDashboard")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + opt.voteCount, 0)
  const isOpen = poll.status === "active"
  const isClosed = poll.status === "closed"
  const hasDeadlinePassed = poll.config.deadline && new Date(poll.config.deadline) < new Date()

  const canVote = isOpen && !hasDeadlinePassed

  const statusColor = isClosed ? "destructive" : isOpen ? "default" : "secondary"
  const statusLabel = isClosed ? t("polls.statusClosed") : isOpen ? t("polls.statusActive") : t("polls.statusDraft")

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="gap-2 h-9"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4" />
          {t("polls.backToPolls")}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left/Full */}
          <div className="lg:col-span-2">
            <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-3xl font-bold mb-2">{poll.title}</CardTitle>
                {poll.description && (
                  <CardDescription className="text-base">{poll.description}</CardDescription>
                )}
                {poll.creator && (role === "admin" || userId === poll.creatorId) && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    {poll.creator.discordAvatar && (
                      <img
                        src={poll.creator.discordAvatar}
                        alt={poll.creator.discordUsername}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span>{t("polls.createdBy")} {poll.creator.discordUsername && poll.creator.discordUsername.trim() ? poll.creator.discordUsername : `User ${poll.creator.id.slice(0, 8)}`}</span>
                  </div>
                )}
              </div>
              <Badge variant={statusColor} className="text-xs whitespace-nowrap flex-shrink-0">
                {statusLabel}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {!canVote && (
              <Alert variant="destructive">
                <AlertDescription>
                  {isClosed ? t("polls.pollEnded") : t("polls.pollClosed")}
                </AlertDescription>
              </Alert>
            )}

            {/* Results Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{t("polls.results")}</h3>
                <p className="text-sm text-muted-foreground">{totalVotes} {t("polls.totalVotes")}</p>
              </div>

              <div className="space-y-3">
                {poll.options.map((option: any) => {
                  const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0
                  return (
                    <div key={option.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{formatPollOption(option.label)}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.voteCount} vote{option.voteCount !== 1 ? 's' : ''} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Vote Form Section */}
            {canVote && (
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">
                  {poll.userVotes && poll.userVotes.length > 0 ? t("polls.yourVote") : t("polls.castYourVote")}
                </h3>
                <VoteForm
                  pollId={poll.id}
                  options={poll.options}
                  isMultiChoice={poll.config.votesPerUser > 1}
                  userVotes={poll.userVotes}
                />
              </div>
            )}

            {/* Admin/Creator Actions */}
            {(role === "admin" || userId === poll.creatorId) && isOpen && (
              <div className="pt-6 border-t">
                <Button
                  onClick={() => closePoll()}
                  disabled={isClosing}
                  variant="destructive"
                  className="gap-2"
                >
                  {isClosing && <Loader2 className="w-4 h-4 animate-spin" />}
                  <X className="w-4 h-4" />
                  {t("polls.closePollButton")}
                </Button>
              </div>
            )}
          </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Voters Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{t("polls.voteDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const canSeeVoters = role === "admin" || userId === poll.creatorId || poll.config?.showVoters;
                  
                  if (!canSeeVoters) {
                    return (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("polls.voterInfoHidden")}
                      </p>
                    );
                  }

                  const hasVoters = poll.options.some((opt: any) => opt.voters && opt.voters.length > 0);
                  
                  if (!hasVoters) {
                    return (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("polls.noVotesYet")}
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {poll.options.map((option: any, idx: number) => {
                        const voters = option.voters || [];
                        if (voters.length === 0) return null;

                        return (
                          <div key={option.id}>
                            {idx > 0 && <Separator className="my-3" />}
                            <div className="space-y-2">
                              <p className="font-medium text-sm">{formatPollOption(option.label)}</p>
                              <div className="space-y-1">
                                {voters.map((voterObj: any, voterIdx: number) => {
                                  const voter = voterObj.user;
                                  if (!voter) return null;
                                  
                                  return (
                                    <div key={voterIdx} className="flex items-center gap-2 text-xs">
                                      {voter.discordAvatar && (
                                        <img
                                          src={voter.discordAvatar}
                                          alt={voter.discordUsername}
                                          className="w-5 h-5 rounded-full flex-shrink-0"
                                        />
                                      )}
                                      <span className="text-muted-foreground truncate">
                                        {voter.discordUsername && voter.discordUsername.trim() 
                                          ? voter.discordUsername 
                                          : `User ${voter.id.slice(0, 8)}`}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PollDetail
