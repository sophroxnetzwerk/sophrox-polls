import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Calendar, ArrowLeft } from "lucide-react"
import PollForm from "./PollForm"
import { useNavigate } from "react-router-dom"

interface CreatePollModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreatePollModal = ({ open, onOpenChange }: CreatePollModalProps) => {
  const { t } = useTranslation()
  const [pollType, setPollType] = useState<"multiple-choice" | "scheduling" | null>(null)
  const navigate = useNavigate()

  const handleSuccess = (pollId: string) => {
    onOpenChange(false)
    setPollType(null)
    navigate(`/polls/${pollId}`)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen)
      if (!newOpen) setPollType(null)
    }}>
      <DialogContent className="max-w-2xl">
        {pollType ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={() => setPollType(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle>
                    {pollType === "multiple-choice" ? t("polls.multiplePoll") : t("polls.appointmentPoll")}
                  </DialogTitle>
                  <DialogDescription>
                    {pollType === "multiple-choice"
                      ? t("polls.createMultipleChoice")
                      : t("polls.createScheduling")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="mt-4">
              <PollForm pollType={pollType} onSuccess={handleSuccess} />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create New Poll</DialogTitle>
              <DialogDescription>Choose a poll type to get started</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* Multiple Choice */}
              <button
                onClick={() => setPollType("multiple-choice")}
                className="group"
              >
                <Card className="h-full cursor-pointer hover:shadow-lg transition-all hover:border-primary/50">
                  <CardContent className="pt-6 text-center h-full flex flex-col items-center justify-center space-y-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition">
                      <CheckCircle2 className="h-10 w-10 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Multiple Choice</h3>
                      <p className="text-xs text-muted-foreground">
                        Classic poll with multiple options
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>

              {/* Scheduling */}
              <button
                onClick={() => setPollType("scheduling")}
                className="group"
              >
                <Card className="h-full cursor-pointer hover:shadow-lg transition-all hover:border-primary/50">
                  <CardContent className="pt-6 text-center h-full flex flex-col items-center justify-center space-y-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition">
                      <Calendar className="h-10 w-10 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">Termin Umfrage</h3>
                      <p className="text-xs text-muted-foreground">
                        Find the best date and time
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CreatePollModal
