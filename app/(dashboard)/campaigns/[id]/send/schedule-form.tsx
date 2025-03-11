"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EnhancedButton } from "@/components/enhanced-button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  scheduledDate: z.date({
    required_error: "Please select a date to schedule your campaign.",
  }).refine(date => {
    // Ensure date is in the future
    const now = new Date();
    return date > now;
  }, {
    message: "Schedule date must be in the future",
  }),
});

interface ScheduleFormProps {
  campaignId: string;
}

export function ScheduleForm({ campaignId }: ScheduleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);

    try {
      // Set time to noon (12:00 PM) to ensure it runs daily
      const scheduledDate = new Date(values.scheduledDate);
      scheduledDate.setHours(12, 0, 0, 0);

      const formData = new FormData();
      formData.append("campaignId", campaignId);
      formData.append("scheduledAt", scheduledDate.toISOString());

      const response = await fetch("/api/campaigns/schedule", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to schedule campaign");
      }

      router.push(`/campaigns/${campaignId}?scheduled=true`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Scheduling Limitation</AlertTitle>
        <AlertDescription className="text-amber-700">
          Due to hosting limitations, campaigns can only be scheduled to run once per day.
          Your campaign will be scheduled to run at 12:00 PM on the selected date.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Schedule Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <EnhancedButton
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </EnhancedButton>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Select the date when you want your campaign to be sent.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <EnhancedButton
              variant="outline"
              onClick={() => router.back()}
              type="button"
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Scheduling..." : "Schedule Campaign"}
            </EnhancedButton>
          </div>
        </form>
      </Form>
    </div>
  );
}