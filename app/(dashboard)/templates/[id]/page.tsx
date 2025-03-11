import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { EmailPreview } from "@/components/email-preview/EmailPreview";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateDetailPage({ params }: PageProps) {
  // Await the params object before accessing its properties
  const resolvedParams = await params;
  const templateId = resolvedParams.id;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch the template
  const template = await prisma.template.findUnique({
    where: { 
      id: templateId
    }
  });

  // If template not found, show 404
  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          <p className="text-muted-foreground">
            Created {format(new Date(template.createdAt), "PPP")}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/templates/${templateId}/edit`}>Edit Template</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailPreview 
            html={template.content} 
            subject="Template Preview" 
          />
        </CardContent>
      </Card>
    </div>
  );
}