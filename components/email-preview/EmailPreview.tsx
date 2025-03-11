"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface EmailPreviewProps {
  readonly html: string;
  readonly subject: string;
}

export function EmailPreview({ html, subject }: EmailPreviewProps) {
  const [iframeHeight, setIframeHeight] = useState(500);
  
  // Resize iframe based on content
  useEffect(() => {
    const iframe = document.getElementById('email-preview') as HTMLIFrameElement;
    if (iframe) {
      iframe.onload = () => {
        const height = iframe.contentWindow?.document.body.scrollHeight;
        if (height) {
          setIframeHeight(height + 50);
        }
      };
    }
  }, [html]);
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-4 border-b">
        <h3 className="font-medium">Email Preview</h3>
        <p className="text-sm text-gray-500">Subject: {subject}</p>
      </div>
      
      <div className="bg-white p-4">
        <iframe
          id="email-preview"
          srcDoc={html}
          title="Email Preview"
          className="w-full border-0"
          style={{ height: `${iframeHeight}px` }}
        />
      </div>
      
      <div className="bg-gray-50 p-4 flex justify-end">
        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>
    </div>
  );
}