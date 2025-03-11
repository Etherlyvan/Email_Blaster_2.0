// app/(dashboard)/templates/[id]/preview/page.tsx
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { EmailPreview } from "@/components/email-preview/EmailPreview";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function TemplatePreviewPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const template = await prisma.template.findUnique({
    where: {
      id: params.id,
    },
  });

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/templates/${template.id}`} className="flex items-center space-x-1">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Editor</span>
            </Link>
          </Button>
        </div>
        <h1 className="text-xl font-semibold">{template.name} - Preview</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Template Preview</CardTitle>
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