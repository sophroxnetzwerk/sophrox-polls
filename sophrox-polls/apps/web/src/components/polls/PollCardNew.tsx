import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDeletePoll } from "../../hooks/usePolls"
import { getUserRole } from "../../lib/auth"
import { Trash2, Eye, BarChart3 } from "lucide-react"

interface PollCardProps {
  id: string
  title: string
  description?: string
  status: "active" | "closed" | "draft"
  optionCount: number
  totalVotes: number
  creatorId: string
  currentUserId?: string
}

export const PollCard = ({
  id,
  title,
  description,
  status,
  optionCount,
  totalVotes,
  creatorId,
  currentUserId,
}: PollCardProps) => {
  const { t } = useTranslation()
  const role = getUserRole()
  const { mutate: deletePoll, isPending } = useDeletePoll(id)
  const isAdmin = role === "admin"
  const isCreator = creatorId === currentUserId || isAdmin

  const statusConfig = {
    active: {
      color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      label: "Active",
      icon: "●",
    },
    draft: {
      color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      label: "Draft",
      icon: "○",
    },
    closed: {
      color: "bg-destructive/10 text-destructive",
      label: "Closed",
      icon: "✕",
    },
  }

  const currentStatus = statusConfig[status]

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link to={`/polls/${id}`}>
              <CardTitle className="text-lg truncate hover:underline">
                {title}
              </CardTitle>
            </Link>
            {description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <Badge variant="secondary" className={`shrink-0 ${currentStatus.color}`}>
            {currentStatus.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t("polls.optionsLabel")}</p>
            <p className="text-lg font-semibold">{optionCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t("polls.votesLabel")}</p>
            <p className="text-lg font-semibold">{totalVotes}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link to={`/polls/${id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              {t("polls.viewButton")}
            </Button>
          </Link>
          
          {isCreator && status === "active" && (
            <Link to={`/polls/${id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                {t("polls.resultsButton")}
              </Button>
            </Link>
          )}

          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm(t("polls.deletePollConfirm"))) {
                  deletePoll()
                }
              }}
              disabled={isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PollCard
