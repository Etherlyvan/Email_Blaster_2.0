// components/campaigns/CreateCampaignForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { EmailPreview } from "../email-preview/EmailPreview";
import { useToast } from "../ui/use-toast";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Upload, Users } from "lucide-react";

interface Template {
  id: string;
  name: string;
  content: string;
}

interface Group {
  id: string;
  name: string;
}

interface ApiKey {
  id: string;
  name: string;
  type: string;
  host?: string;
  port?: number;
}

interface CreateCampaignFormProps {
  readonly templates: ReadonlyArray<Template>;
  readonly groups: ReadonlyArray<Group>;
  readonly apiKeys: ReadonlyArray<ApiKey>;
}

export function CreateCampaignForm({ templates, groups, apiKeys }: CreateCampaignFormProps) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [apiKeyId, setApiKeyId] = useState("");
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Excel upload state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedGroupId, setUploadedGroupId] = useState<string | null>(null);
  const [recipientMethod, setRecipientMethod] = useState<"existing" | "upload">("existing");
  
  const router = useRouter();
  const { toast } = useToast();
  
  // Filter SMTP API keys
  const smtpApiKeys = apiKeys.filter((key) => key.type === "SMTP");
  
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setTemplateId(value);
    const template = templates.find((t) => t.id === value) || null;
    setSelectedTemplate(template);
  };
  
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGroupId(e.target.value);
  };
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setApiKeyId(e.target.value);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setExcelFile(e.target.files[0]);
    }
  };
  
  const handleUploadRecipients = async () => {
    if (!excelFile) {
      toast({
        title: "Error",
        description: "Please select an Excel file to upload",
        variant: "destructive",
      });
      return;
    }
    
    if (!newGroupName) {
      toast({
        title: "Error",
        description: "Please enter a name for the new group",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // First, create a new group
      const groupResponse = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: `Created during campaign creation on ${new Date().toLocaleDateString()}`,
        }),
      });
      
      if (!groupResponse.ok) {
        const errorData = await groupResponse.json();
        throw new Error(errorData.error || "Failed to create group");
      }
      
      const groupData = await groupResponse.json();
      const newGroupId = groupData.group.id;
      
      // Then, upload the Excel file to import contacts to this group
      const formData = new FormData();
      formData.append("file", excelFile);
      formData.append("groupId", newGroupId);
      
      const importResponse = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
      });
      
      if (!importResponse.ok) {
        const errorData = await importResponse.json();
        throw new Error(errorData.error || "Failed to import contacts");
      }
      
      const importData = await importResponse.json();
      
      // Set the newly created group as the selected group
      setGroupId(newGroupId);
      setUploadedGroupId(newGroupId);
      
      toast({
        title: "Recipients Uploaded",
        description: `Created group "${newGroupName}" with ${importData.results.added} contacts`,
        variant: "success",
      });
      
      // Switch to existing group tab since we now have a group
      setRecipientMethod("existing");
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !subject || !senderEmail || !templateId || !groupId) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid sender email address",
        variant: "destructive",
      });
      return;
    }
    
    if (schedule && !scheduledAt) {
      toast({
        title: "Validation Error",
        description: "Please select a scheduled time",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          senderEmail,
          templateId,
          groupId,
          apiKeyId: apiKeyId || undefined,
          schedule,
          scheduledAt: scheduledAt || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create campaign");
      }
      
      toast({
        title: "Campaign Created",
        description: schedule 
          ? "Campaign has been scheduled" 
          : "Campaign has been created as draft",
      });
      
      router.push("/campaigns");
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
  
  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return "Creating...";
    }
    return schedule ? "Schedule Campaign" : "Create Campaign";
  };
  
  // Combine original groups with newly created group if it exists
  const availableGroups = uploadedGroupId 
    ? [...groups, { id: uploadedGroupId, name: newGroupName }] 
    : groups;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Campaign Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Monthly Newsletter"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your Monthly Update"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="senderEmail">Sender Email</Label>
          <Input
            id="senderEmail"
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="your-name@example.com"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This is the email address that will appear in the &quot;From&quot; field
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template">Email Template</Label>
          <select
            id="template"
            value={templateId}
            onChange={handleTemplateChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="" disabled>Select a template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <Label>Recipients</Label>
          <Tabs value={recipientMethod} onValueChange={(v) => setRecipientMethod(v as "existing" | "upload")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Existing Group
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Excel
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing" className="mt-4">
              <select
                id="group"
                value={groupId}
                onChange={handleGroupChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required={recipientMethod === "existing"}
              >
                <option value="" disabled>Select a group</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {availableGroups.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  No contact groups available. Please create a group or use the Upload Excel tab.
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="upload" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Upload Recipients</CardTitle>
                  <CardDescription>
                    Create a new contact group from Excel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="newGroupName">Group Name</Label>
                    <Input
                      id="newGroupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="New Subscribers"
                      required={recipientMethod === "upload"}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="excelFile">Excel File</Label>
                    <Input
                      id="excelFile"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      required={recipientMethod === "upload"}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      File should have columns: email, firstName, lastName
                    </p>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleUploadRecipients}
                    disabled={isUploading || !excelFile || !newGroupName}
                    className="w-full"
                  >
                    {isUploading ? "Uploading..." : "Upload and Create Group"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {smtpApiKeys.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="apiKey">SMTP Configuration (Optional)</Label>
            <select
              id="apiKey"
              value={apiKeyId}
              onChange={handleApiKeyChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Use default</option>
              {smtpApiKeys.map((key) => (
                <option key={key.id} value={key.id}>
                  {key.name} {key.host && key.port ? `(${key.host}:${key.port})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch
            id="schedule"
            checked={schedule}
            onCheckedChange={setSchedule}
          />
          <Label htmlFor="schedule">Schedule for later</Label>
        </div>
        
        {schedule && (
          <div>
            <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
          </div>
        )}
        
        <div className="flex space-x-3">
          <Button 
            type="submit" 
            disabled={isSubmitting || (recipientMethod === "existing" && !groupId) || (recipientMethod === "upload" && !uploadedGroupId)}
          >
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
      
      <div>
        {selectedTemplate && (
          <EmailPreview
            html={selectedTemplate.content}
            subject={subject || "Email Subject"}
          />
        )}
      </div>
    </div>
  );
}