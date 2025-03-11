import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PageProps {
  readonly params: {
    readonly id: string;
  };
}

export default async function EditCampaignPage({ params }: PageProps) {
  // Await the params object before accessing its properties
  const resolvedParams = await Promise.resolve(params);
  const campaignId = resolvedParams.id;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch the campaign with related data
  const campaign = await prisma.campaign.findUnique({
    where: { 
      id: campaignId
    },
    include: {
      template: true,
      group: true
    }
  });

  // If campaign not found, show 404
  if (!campaign) {
    notFound();
  }

  // Fetch templates and groups for dropdown options
  const templates = await prisma.template.findMany({
    orderBy: { name: 'asc' }
  });

  const groups = await prisma.group.findMany({
    orderBy: { name: 'asc' }
  });

  // Fetch API keys for dropdown
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      userId: session.user.id,
      type: 'SMTP'
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Campaign</h1>
        <Button variant="outline" asChild>
          <Link href={`/campaigns/${campaignId}`}>Back to Campaign</Link>
        </Button>
      </div>

      <Card>
        <form action="/api/campaigns/update" method="POST">
          <input type="hidden" name="id" value={campaignId} />
          
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input 
                id="name" 
                name="name" 
                defaultValue={campaign.name} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input 
                id="subject" 
                name="subject" 
                defaultValue={campaign.subject} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="templateId">Email Template</Label>
              <Select name="templateId" defaultValue={campaign.templateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="groupId">Contact Group</Label>
              <Select name="groupId" defaultValue={campaign.groupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKeyId">SMTP API Key</Label>
              <Select name="apiKeyId" defaultValue={campaign.apiKeyId || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an API key" />
                </SelectTrigger>
                <SelectContent>
                  {apiKeys.map(apiKey => (
                    <SelectItem key={apiKey.id} value={apiKey.id}>
                      {apiKey.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href={`/campaigns/${campaignId}`}>Cancel</Link>
            </Button>
            <Button type="submit">Save Changes</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}