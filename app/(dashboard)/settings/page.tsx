// app/(dashboard)/settings/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiKeyForm } from "@/components/settings/ApiKeyForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const smtpKeys = apiKeys.filter((key) => key.type === "SMTP");
  const apiOnlyKeys = apiKeys.filter((key) => key.type === "API");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="smtp">
        <TabsList>
          <TabsTrigger value="smtp">SMTP Configurations</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>
        <TabsContent value="smtp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configurations</CardTitle>
              <CardDescription>
                Configure your Brevo SMTP credentials for sending emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {smtpKeys.length > 0 ? (
                  <div className="border rounded-md divide-y">
                    {smtpKeys.map((key) => (
                      <div key={key.id} className="p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{key.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Server: {key.host}:{key.port}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Username: {key.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Added: {format(new Date(key.createdAt), "PPP")}
                          </p>
                        </div>
                        <div>
                          {key.isDefault && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No SMTP configurations added.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add SMTP Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ApiKeyForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Configure your Brevo API keys for fetching analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiOnlyKeys.length > 0 ? (
                  <div className="border rounded-md divide-y">
                    {apiOnlyKeys.map((key) => (
                      <div key={key.id} className="p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{key.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Added: {format(new Date(key.createdAt), "PPP")}
                          </p>
                        </div>
                        <div>
                          {key.isDefault && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No API keys configured.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}