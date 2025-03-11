import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      template: true,
      group: true,
    },
  });

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

  function getFormattedDate(campaign: { 
    scheduledAt: Date | string | null; 
    sentAt: Date | string | null;
  }) {
    if (campaign.scheduledAt) {
      return format(new Date(campaign.scheduledAt), "PPp");
    } else if (campaign.sentAt) {
      return format(new Date(campaign.sentAt), "PPp");
    } else {
      return "Not sent yet";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Email Campaigns</h1>
        <Button asChild>
          <Link href="/campaigns/new">Create Campaign</Link>
        </Button>
      </div>

      {campaigns.length > 0 ? (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>
                      Created {format(new Date(campaign.createdAt), "PPP")}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Subject:</p>
                    <p className="font-medium">{campaign.subject}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Recipients:</p>
                    <p className="font-medium">{campaign.group.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">From:</p>
                    <p className="font-medium">{campaign.senderEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Template:</p>
                    <p className="font-medium">{campaign.template.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {campaign.scheduledAt ? "Scheduled for:" : "Sent at:"}
                    </p>
                    <p className="font-medium">
                      {getFormattedDate(campaign)}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/campaigns/${campaign.id}`}>View Details</Link>
                </Button>
                {campaign.status === "DRAFT" && (
                  <Button size="sm" asChild>
                    <Link href={`/campaigns/${campaign.id}/send`}>Send Now</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              No campaigns found. Create your first campaign!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}