"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

export default function SendCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isSchedule, setIsSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSchedule && !scheduledAt) {
      toast({
        title: "Validation Error",
        description: "Please select a scheduled time",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      let endpoint = `/api/campaigns/${params.id}/send`;
      let method = "POST";
      let body = {};

      if (isSchedule) {
        // Use the update endpoint to schedule
        endpoint = `/api/campaigns/${params.id}`;
        method = "PUT";
        body = {
          scheduledAt,
        };
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send campaign");
      }

      toast({
        title: isSchedule ? "Campaign Scheduled" : "Campaign Sent",
        description: isSchedule
          ? "Your campaign has been scheduled"
          : "Your campaign is being sent",
      });

      router.push(`/campaigns/${params.id}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Send Campaign</CardTitle>
          <CardDescription>
            Choose when to send your campaign
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="schedule"
                  checked={isSchedule}
                  onCheckedChange={setIsSchedule}
                />
                <Label htmlFor="schedule">Schedule for later</Label>
              </div>

              {isSchedule && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    required={isSchedule}
                  />
                </div>
              )}

              <div className="text-sm text-gray-500">
                {isSchedule
                  ? "Your campaign will be sent at the scheduled time."
                  : "Your campaign will be sent immediately."}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Processing..."
                : isSchedule
                ? "Schedule Campaign"
                : "Send Now"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}