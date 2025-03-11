"use client";

import { Button } from "@/components/ui/button";
import { useCampaignAction } from "@/hooks/use-campaign-action";
import { Send } from "lucide-react";

interface SendButtonProps {
  campaignId: string;
}

export function SendButton({ campaignId }: SendButtonProps) {
  const { executeCampaignAction, error } = useCampaignAction();

  const handleSendCampaign = () => {
    executeCampaignAction(
      () => fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
      }),
      () => {
        // Optional callback after successful send
        window.location.href = `/campaigns/${campaignId}?sent=true`;
      }
    );
  };

  return (
    <div>
      <Button 
        onClick={handleSendCampaign}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Send className="h-4 w-4 mr-2" />
        Send Campaign
      </Button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}