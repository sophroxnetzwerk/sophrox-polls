import { useState } from "react"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Loader2, Check, RotateCcw } from "lucide-react"
import { useVote } from "../../hooks/useVote"

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

interface VoteFormProps {
  pollId: string
  options: Array<{ id: string; label: string }>
  isMultiChoice?: boolean
  isDisabled?: boolean
  userVotes?: string[] // Array of optionIds that current user voted for
  onSuccess?: () => void
}

export const VoteForm = ({
  pollId,
  options,
  isMultiChoice = false,
  isDisabled = false,
  userVotes = [],
  onSuccess,
}: VoteFormProps) => {
  const { t } = useTranslation()
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const { mutateAsync: vote, isPending } = useVote(pollId)

  const hasVoted = userVotes && userVotes.length > 0
  const showingUserVotes = !isEditMode && hasVoted

  console.log(`[VoteForm] userVotes:`, userVotes, "hasVoted:", hasVoted, "showingUserVotes:", showingUserVotes)

  // Initialize selectedOptions when entering edit mode
  const handleStartEdit = () => {
    setSelectedOptions([...userVotes])
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    setSelectedOptions([])
    setIsEditMode(false)
  }

  const handleVote = async () => {
    if (selectedOptions.length === 0) return

    for (const optionId of selectedOptions) {
      await vote({ optionId, editMode: isEditMode })
    }
    setSelectedOptions([])
    setIsEditMode(false)
    onSuccess?.()
  }

  const toggleOption = (optionId: string) => {
    if (isMultiChoice) {
      setSelectedOptions((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  const isSelected = (optionId: string) => selectedOptions.includes(optionId)
  const hasSelection = selectedOptions.length > 0

  // Display user's current votes
  if (showingUserVotes) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-medium">{t("polls.yourVotes")}</p>
          <div className="grid gap-2">
            {options
              .filter((opt) => userVotes.includes(opt.id))
              .map((option) => (
                <div
                  key={option.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/15 transition-colors"
                >
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-sm text-foreground">{formatPollOption(option.label)}</span>
                </div>
              ))}
          </div>
        </div>

        <Button
          onClick={handleStartEdit}
          disabled={isDisabled || isPending}
          variant="outline"
          className="w-full h-11 gap-2"
          size="lg"
        >
          <RotateCcw className="w-4 h-4" />
          {t("polls.editVote")}
        </Button>
      </div>
    )
  }

  // Display voting form
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => toggleOption(option.id)}
            disabled={isDisabled || isPending}
            className={`group relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              isSelected(option.id)
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{formatPollOption(option.label)}</span>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected(option.id)
                    ? "border-primary bg-primary"
                    : "border-muted-foreground group-hover:border-primary"
                }`}
              >
                {isSelected(option.id) && <Check className="w-3 h-3 text-background" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleVote}
          disabled={!hasSelection || isDisabled || isPending}
          className="flex-1 h-11 font-semibold gap-2"
          size="lg"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending
            ? t("polls.submittingVote")
            : isEditMode
              ? selectedOptions.length > 1
                ? `${t("polls.updateVotes")} (${selectedOptions.length})`
                : t("polls.updateVote")
              : selectedOptions.length > 1
                ? `${t("polls.submitVote")} (${selectedOptions.length})`
                : t("polls.submitVote")}
        </Button>

        {isEditMode && (
          <Button
            onClick={handleCancelEdit}
            disabled={isDisabled || isPending}
            variant="outline"
            className="h-11"
            size="lg"
          >
            {t("common.cancel")}
          </Button>
        )}
      </div>

      {isMultiChoice && (
        <p className="text-xs text-muted-foreground text-center">
          {t("common.selectMultiple")}
        </p>
      )}
    </div>
  )
}

export default VoteForm
