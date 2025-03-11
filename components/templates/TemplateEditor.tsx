"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "../ui/use-toast";
import { EmailPreview } from "../email-preview/EmailPreview";
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface TemplateEditorProps {
  readonly initialTemplate?: {
    readonly id?: string;
    readonly name: string;
    readonly content: string;
  };
}

export function TemplateEditor({ initialTemplate }: TemplateEditorProps) {
  const [name, setName] = useState(initialTemplate?.name ?? "");
  const [content, setContent] = useState(initialTemplate?.content ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  
  const isEditing = !!initialTemplate?.id;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !content) {
      toast({
        title: "Validation Error",
        description: "Template name and content are required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const url = isEditing 
        ? `/api/templates/${initialTemplate.id}` 
        : "/api/templates";
      
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to save template");
      }
      
      toast({
        title: isEditing ? "Template Updated" : "Template Created",
        description: `Template "${name}" has been saved successfully`,
      });
      
      router.push("/templates");
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
  
  // Helper function to get submit button text
  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return "Saving...";
    }
    if (isEditing) {
      return "Update Template";
    }
    return "Create Template";
  };
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Welcome Email"
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="content">HTML Content</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? "Edit Mode" : "Preview Mode"}
            </Button>
          </div>
          
          {!previewMode ? (
            <div className="border rounded-md">
              <CodeMirror
                value={content}
                height="500px"
                extensions={[html()]}
                theme={vscodeDark}
                onChange={(value) => setContent(value)}
              />
            </div>
          ) : (
            <EmailPreview html={content} subject="Template Preview" />
          )}
          
          <p className="text-xs text-gray-500">
            You can use &#123;&#123;firstName&#125;&#125;, &#123;&#123;lastName&#125;&#125;, and &#123;&#123;email&#125;&#125; as placeholders.
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button type="submit" disabled={isSubmitting}>
            {getSubmitButtonText()}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}