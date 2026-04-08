import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Trash2, CheckCircle2, Clock, BarChart3 } from "lucide-react"
import { getUserRole, getUserId } from "../../lib/auth"
import { useDeletePoll } from "../../hooks/usePolls"
import { getLighterColor, getTextColorForBackground } from "../../lib/discord"

interface PollCardProps {
  id: string
  title: string
  description?: string
  status: "active" | "closed" | "draft"
  optionCount: number
  totalVotes: number
  creatorId: string
  creator?: {
    id: string
    discordUsername?: string
    discordAvatar?: string
  }
  category?: {
    id: string
    name: string
    discordRoleColor?: string
  }
  currentUserId?: string
}

export const PollCard = ({
  id,
  title,
  description,
  status,
  optionCount,
  totalVotes,
  creator,
  creatorId,
  category,
}: PollCardProps) => {
  const { t } = useTranslation()
  const role = getUserRole()
  const userId = getUserId()
  const { mutate: deletePoll, isPending } = useDeletePoll(id)

  const isAdmin = role === "admin"
  const isCreator = userId === creatorId
  // Nur Admin oder Creator selbst können creator-Info sehen
  const showCreator = isAdmin || isCreator

  const statusConfig: Record<string, { label: string; icon: any; badgeVariant: "default" | "secondary" | "destructive"; color: string }> = {
    active: { label: t("polls.results"), icon: CheckCircle2, badgeVariant: "default", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
    draft: { label: t("common.settings"), icon: Clock, badgeVariant: "secondary", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
    closed: { label: t("polls.closePoll"), icon: BarChart3, badgeVariant: "destructive", color: "bg-destructive/10 text-destructive" },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Link to={`/polls/${id}`}>
      <Card className="h-full cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
            <div className={`p-2 rounded-lg flex-shrink-0 ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Category & Creator Info */}
            <div className="flex flex-col gap-2">
              {category && (
                <Badge 
                  variant="outline"
                  style={{
                    backgroundColor: category.discordRoleColor || "#6366f1",
                    color: "#ffffff",
                    borderColor: category.discordRoleColor || "#6366f1",
                  }}
                >
                  {category.name}
                </Badge>
              )}
              {showCreator && creator && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                  {creator.discordAvatar && (
                    <img
                      src={creator.discordAvatar}
                      alt={creator.discordUsername}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="truncate">{t("polls.createdBy")} {creator.discordUsername && creator.discordUsername.trim() ? creator.discordUsername : `User ${creator.id.slice(0, 8)}`}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">{t("polls.options")}</p>
                <p className="font-semibold">{optionCount}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground">{t("polls.votes")}</p>
                <p className="font-semibold">{totalVotes}</p>
              </div>
            </div>

            {/* Status & Action */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Badge variant={config.badgeVariant} className="text-xs">
                {config.label}
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={(e) => {
                    e.preventDefault()
                  }}
                >
                  {t("polls.view")}
                  <ArrowRight className="w-3 h-3" />
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      deletePoll()
                    }}
                    disabled={isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default PollCard
