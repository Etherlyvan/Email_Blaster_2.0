import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart, Users, Mail, Layers, ArrowRight, PieChart, Send, CalendarClock } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }
  
  // Get stats
  const contactCount = await prisma.contact.count();
  const groupCount = await prisma.group.count();
  const templateCount = await prisma.template.count();
  
  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      group: true,
    },
  });

  // Calculate campaign stats
  const completedCampaigns = campaigns.filter(c => c.status === "COMPLETED").length;
  const pendingCampaigns = campaigns.filter(c => ["DRAFT", "SCHEDULED"].includes(c.status)).length;
  const sendingCampaigns = campaigns.filter(c => c.status === "SENDING").length;
  const totalCampaigns = await prisma.campaign.count({
    where: { userId: session.user.id }
  });
  
  return (
    <div className="space-y-8 pb-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-950">Dashboard</h1>
            <p className="text-blue-700 mt-1">Welcome back, {session.user.name?.split(' ')[0] || 'User'}!</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50" asChild>
              <Link href="/templates/new">
                <Mail className="h-4 w-4" />
                New Template
              </Link>
            </Button>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700" asChild>
              <Link href="/campaigns/new">
                <Send className="h-4 w-4" />
                Create Campaign
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-6">
        <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Contacts
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contactCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              People you can reach with your campaigns
            </p>
            <Button variant="link" className="p-0 h-auto mt-2 text-sm text-blue-600" asChild>
              <Link href="/contacts" className="flex items-center">
                View all contacts <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all border-l-4 border-l-purple-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Contact Groups
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Layers className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{groupCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Organized segments for targeted campaigns
            </p>
            <Button variant="link" className="p-0 h-auto mt-2 text-sm text-purple-600" asChild>
              <Link href="/groups" className="flex items-center">
                Manage groups <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all border-l-4 border-l-green-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Email Templates
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <Mail className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{templateCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Reusable email designs for your campaigns
            </p>
            <Button variant="link" className="p-0 h-auto mt-2 text-sm text-green-600" asChild>
              <Link href="/templates" className="flex items-center">
                View templates <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all border-l-4 border-l-amber-500">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Campaigns
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Send className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCampaigns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All your email campaigns
            </p>
            <Button variant="link" className="p-0 h-auto mt-2 text-sm text-amber-600" asChild>
              <Link href="/campaigns" className="flex items-center">
                View campaigns <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4 md:px-6">
        <Card className="md:col-span-3 border-t-4 border-t-blue-500 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-blue-500" />
              Recent Campaigns
            </CardTitle>
            <CardDescription>
              Overview of your latest email campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <div className="grid grid-cols-3 p-3 text-sm font-medium bg-gray-50">
                  <div>Campaign</div>
                  <div>Audience</div>
                  <div>Status</div>
                </div>
                <div className="divide-y">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="grid grid-cols-3 p-3 items-center hover:bg-gray-50 transition-colors">
                      <div>
                        <Link href={`/campaigns/${campaign.id}`} className="font-medium hover:text-blue-600 hover:underline">
                          {campaign.name}
                        </Link>
                        <div className="flex items-center text-xs text-gray-500 mt-1.5">
                          <CalendarClock className="h-3 w-3 mr-1" />
                          {new Date(campaign.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1 text-gray-400" />
                          {campaign.group.name}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          campaign.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                          campaign.status === "SENDING" ? "bg-amber-100 text-amber-800" :
                          campaign.status === "FAILED" ? "bg-red-100 text-red-800" :
                          campaign.status === "SCHEDULED" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {campaign.status}
                        </span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600" asChild>
                          <Link href={`/campaigns/${campaign.id}`}>
                            <span className="sr-only">View details</span>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-3 text-center">
                  <Button variant="link" className="text-blue-600" asChild>
                    <Link href="/campaigns" className="flex items-center justify-center">
                      View all campaigns <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50 rounded-lg">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <BarChart className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium">No campaigns yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
                  Create your first email campaign to start reaching your audience.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href="/campaigns/new">Create Campaign</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-t-4 border-t-purple-500">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-purple-500" />
              Campaign Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    Completed
                  </div>
                  <div className="text-sm font-medium">{completedCampaigns}</div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-500" 
                    style={{ width: totalCampaigns ? `${(completedCampaigns / totalCampaigns) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium flex items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                    Pending
                  </div>
                  <div className="text-sm font-medium">{pendingCampaigns}</div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                    style={{ width: totalCampaigns ? `${(pendingCampaigns / totalCampaigns) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium flex items-center">
                    <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
                    Sending
                  </div>
                  <div className="text-sm font-medium">{sendingCampaigns}</div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                    style={{ width: totalCampaigns ? `${(sendingCampaigns / totalCampaigns) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800" asChild>
                <Link href="/campaigns" className="flex items-center justify-center">
                  View All Campaigns
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}