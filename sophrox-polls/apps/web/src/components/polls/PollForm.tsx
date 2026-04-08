import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Loader2, X, Plus, ChevronDown, Calendar as CalendarIcon } from "lucide-react"
import { createPollSchema } from "../../lib/validators"
import type { CreatePollInput } from "../../lib/validators"
import { useCreatePoll } from "../../hooks/usePolls"
import { api } from "../../lib/api"

interface PollFormProps {
  pollType: "multiple-choice" | "scheduling"
  onSuccess?: (pollId: string) => void
}

export const PollForm = ({ pollType, onSuccess }: PollFormProps) => {
  const { t } = useTranslation()
  const { mutateAsync: createPoll, isPending } = useCreatePoll()
  const [openDatePickers, setOpenDatePickers] = useState<Record<number, boolean>>({})
  
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Array<{ id: string; name: string }> }>("/categories"),
  })
  
  const form = useForm<CreatePollInput>({
    resolver: zodResolver(createPollSchema),
    defaultValues:
      pollType === "scheduling"
        ? {
            title: "",
            description: "",
            categoryId: "",
            options: [],
            config: {
              votesPerUser: 10,
              requireAuth: false,
              ipLimit: 1,
              captchaEnabled: false,
              showVoters: true,
            },
          }
        : {
            title: "",
            description: "",
            categoryId: "",
            options: ["", ""],
            config: {
              votesPerUser: 1,
              requireAuth: false,
              ipLimit: 1,
              captchaEnabled: false,
              showVoters: false,
            },
          },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  } as any)

  const onSubmit = async (data: CreatePollInput) => {
    try {
      console.log("[FRONTEND] Creating poll with data:", data)
      const response = (await createPoll(data)) as { id: string }
      console.log("[FRONTEND] Poll created successfully:", response)
      if (!response || !response.id) {
        throw new Error("Invalid response from server")
      }
      onSuccess?.(response.id)
    } catch (error: any) {
      console.error("[FRONTEND] Failed to create poll:", error)
      console.error("[FRONTEND] Error details:", error?.data || error?.message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Main Info Section */}
        <div className="space-y-4">
          <div>
            <FormField
              control={form.control}
              name="title"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">
                    {pollType === "scheduling" ? t("polls.title") : t("polls.title")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        pollType === "scheduling"
                          ? "e.g., Team Standup - Next Week"
                          : "e.g., What's your favorite programming language?"
                      }
                      className="h-12 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">
                    {t("polls.description")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        pollType === "scheduling"
                          ? "e.g., We need to find a time that works for everyone. Please vote for all times you're available."
                          : "e.g., Help us understand which technology you prefer for the next project..."
                      }
                      className="min-h-24 text-base resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">{t("polls.category")}</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 text-base">
                        <SelectValue placeholder={t("polls.category")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoriesData?.categories?.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Options Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel className="text-base font-semibold">
              {pollType === "scheduling" ? t("polls.availableTimes") : t("polls.answerOptions")}
            </FormLabel>
            <span className="text-sm text-muted-foreground">
              {fields.length} {fields.length === 1 ? "option" : "options"}
            </span>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 group">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name={`options.${index}`}
                    render={({ field: fieldRender }: any) => (
                      <FormItem>
                        <FormControl>
                          {pollType === "scheduling" ? (
                            <div className="flex gap-2">
                              <Popover open={openDatePickers[index]} onOpenChange={(open) => {
                                setOpenDatePickers({ ...openDatePickers, [index]: open })
                              }}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="h-11 flex-1 justify-start text-left font-normal border-2 transition-colors hover:border-primary/50"
                                  >
                                    <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                    {fieldRender.value ? format(new Date(fieldRender.value), "PPp") : "Pick a time..."}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <div className="p-4 space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Date</label>
                                      <Calendar
                                        mode="single"
                                        selected={fieldRender.value ? new Date(fieldRender.value) : undefined}
                                        onSelect={(date) => {
                                          if (date) {
                                            const currentValue = fieldRender.value ? new Date(fieldRender.value) : new Date()
                                            const newDate = new Date(date)
                                            newDate.setHours(currentValue.getHours())
                                            newDate.setMinutes(currentValue.getMinutes())
                                            fieldRender.onChange(newDate.toISOString())
                                          }
                                        }}
                                        disabled={(date) => date < new Date()}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-sm font-medium">Hour</label>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="23"
                                          value={fieldRender.value ? new Date(fieldRender.value).getHours() : 12}
                                          onChange={(e) => {
                                            const date = fieldRender.value ? new Date(fieldRender.value) : new Date()
                                            date.setHours(parseInt(e.target.value))
                                            fieldRender.onChange(date.toISOString())
                                          }}
                                          className="h-9"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Minute</label>
                                        <Input
                                          type="number"
                                          min="0"
                                          max="59"
                                          step="15"
                                          value={fieldRender.value ? new Date(fieldRender.value).getMinutes() : 0}
                                          onChange={(e) => {
                                            const date = fieldRender.value ? new Date(fieldRender.value) : new Date()
                                            date.setMinutes(parseInt(e.target.value))
                                            fieldRender.onChange(date.toISOString())
                                          }}
                                          className="h-9"
                                        />
                                      </div>
                                    </div>
                                    <Button
                                      onClick={() => setOpenDatePickers({ ...openDatePickers, [index]: false })}
                                      className="w-full"
                                    >
                                      {t("common.close")}
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          ) : (
                            <Input
                              placeholder={`Option ${index + 1}`}
                              className="h-11 text-base border-2 transition-colors hover:border-primary/50"
                              {...fieldRender}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {fields.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="h-11 w-11 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => append("")}
            className="w-full h-11 gap-2 border-2 hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            {pollType === "scheduling" ? t("polls.addTimeSlot") : t("polls.addOption")}
          </Button>
        </div>

        {/* Advanced Settings Section */}
        <Collapsible defaultOpen={false} className="w-full space-y-4">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between hover:bg-muted"
            >
              <span className="font-semibold">Advanced Settings</span>
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            <FormField
              control={form.control}
              name="config.showVoters"
              render={({ field }: any) => (
                <FormItem className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <FormLabel className="text-base font-semibold">Show Who Voted For What</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Admins and poll creator can always see this. When enabled, everyone can see voter names.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 text-base font-semibold gap-2"
        >
          {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
          {t("common.save")} {pollType === "scheduling" ? t("polls.appointmentPoll") : t("polls.createPoll")}
        </Button>
      </form>
    </Form>
  )
}

export default PollForm
