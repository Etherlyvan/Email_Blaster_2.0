"use client";

import { useState } from "react";
import { useLoading } from "@/components/loading-provider";
import { useRouter } from "next/navigation";

export function useCampaignAction() {
  const { startLoading, stopLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const executeCampaignAction = async (
    actionFn: () => Promise<Response>,
    successCallback?: () => void
  ) => {
    setError(null);
    startLoading();
    
    try {
      const response = await actionFn();
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "An error occurred");
      }
      
      if (successCallback) {
        successCallback();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      stopLoading();
    }
  };

  return {
    executeCampaignAction,
    error
  };
}