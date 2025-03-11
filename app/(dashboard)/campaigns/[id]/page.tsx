// app/(dashboard)/campaigns/[id]/page.tsx
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the props type correctly
interface PageProps {
  params: {
    id: string;
  };
}

export default async function CampaignDetailPage({ params }: PageProps) {
  // Await the params object before accessing its properties
  const resolvedParams = await Promise.resolve(params);
  const campaignId = resolvedParams.id;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      userId: session.user.id,
    },
    include: {
      template: true,
      group: {
        include: {
          _count: {
            select: { contacts: true },
          },
        },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  const logs = await prisma.emailLog.findMany({
    where: { campaignId: campaignId },
    orderBy: { sentAt: "desc" },
  });

  // Count logs by status
  const statusCounts = logs.reduce(
    (acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case "DRAFT":
        return "bg-gray-200 text-gray-800";
      case "SCHEDULED":
        return "bg-blue-200 text-blue-800";
      case "SENDING":
        return "bg-yellow-200 text-yellow-800";
      case "COMPLETED":
        return "bg-green-200 text-green-800";
      case "FAILED":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground">
            Created {format(new Date(campaign.createdAt), "PPP")}
          </p>
        </div>
        <div className="flex space-x-2">
          {(campaign.status === "DRAFT" || campaign.status === "SCHEDULED") && (
            <Button variant="outline" asChild>
              <Link href={`/campaigns/${campaignId}/edit`}>Edit</Link>
            </Button>
          )}
          {campaign.status === "DRAFT" && (
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/send`}>Send</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(campaign.status)}>
              {campaign.status}
            </Badge>
            {campaign.scheduledAt && campaign.status === "SCHEDULED" && (
              <p className="text-sm mt-2">
                Scheduled for {format(new Date(campaign.scheduledAt), "PPp")}
              </p>
            )}
            {campaign.sentAt && (
              <p className="text-sm mt-2">
                Sent on {format(new Date(campaign.sentAt), "PPp")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-medium">{campaign.group.name}</p>
              <p className="text-sm text-muted-foreground">
                {campaign.group._count.contacts} contacts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-medium">{campaign.subject}</p>
              <p className="text-sm text-muted-foreground">
                Template: {campaign.template.name}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="preview">
        <TabsList>
          <TabsTrigger value="preview">Email Preview</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
       
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{campaign.subject}</p>
                <p className="text-sm text-muted-foreground">
                  From: {campaign.senderEmail}
                </p>
                <p className="text-sm text-muted-foreground">
                  Template: {campaign.template.name}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Status</CardTitle>
              <CardDescription>
                {logs.length > 0
                  ? "Detailed log of all email delivery attempts"
                  : "No logs available yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {logs.length}
                          </div>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {statusCounts["SENT"] || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">Sent</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {statusCounts["QUEUED"] || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Queued
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {statusCounts["FAILED"] || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Failed
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Email
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Sent At
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Message ID
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {log.contactEmail}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Badge
                                className={
                                  log.status === "SENT"
                                    ? "bg-green-100 text-green-800"
                                    : log.status === "FAILED"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {log.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(log.sentAt), "PPp")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.messageId ? (
                                <span className="text-xs font-mono">
                                  {log.messageId.substring(0, 15)}...
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No delivery logs available yet. Logs will appear once the
                  campaign starts sending.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}