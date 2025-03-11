import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentationPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Campaign App Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Learn how to use the Email Campaign App effectively
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Learn the basics of the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Creating Your First Campaign</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to create and send your first email campaign in minutes.
              </p>
              <Button variant="link" className="px-0" asChild>
                <Link href="/documentation/getting-started">Read More</Link>
              </Button>
            </div>
            <div>
              <h3 className="font-medium">Managing Contacts</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to import, organize, and manage your contact lists.
              </p>
              <Button variant="link" className="px-0" asChild>
                <Link href="/documentation/contacts">Read More</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Create and manage email templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Creating Templates</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to create beautiful, responsive email templates.
              </p>
              <Button variant="link" className="px-0" asChild>
                <Link href="/documentation/templates">Read More</Link>
              </Button>
            </div>
            <div>
              <h3 className="font-medium">Personalization</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to use personalization tags in your templates.
              </p>
              <Button variant="link" className="px-0" asChild>
                <Link href="/documentation/personalization">Read More</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>Create and manage email campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Scheduling Campaigns</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to schedule campaigns for future delivery.
              </p>
              <Button variant="link" className="px-0" asChild>
                <Link href="/documentation/scheduling">Read More</Link>
              </Button>
            </div>
            <div>
              <h3 className="font-medium">Campaign Analytics</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to track and analyze your campaign performance.
              </p>
              <Button variant="link" className="px-0" asChild>
                <Link href="/documentation/analytics">Read More</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Integration</CardTitle>
            <CardDescription>Connect with external services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">SMTP Configuration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to configure SMTP settings for email delivery.
              </p>
              <Button variant="link" className="px-0" asChild>
                <Link href="/documentation/smtp">Read More</Link>
              </Button>
            </div>
            <div>
              <h3 className="font-medium">API Keys</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn how to manage and use API keys for external services.
              </p>
              <Button variant="link" className="px-0" asChild>
                <Link href="/documentation/api-keys">Read More</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}