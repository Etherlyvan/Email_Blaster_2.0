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

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <Button asChild>
          <Link href="/templates/new">Create Template</Link>
        </Button>
      </div>

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="truncate">{template.name}</CardTitle>
                <CardDescription>
                  Created {format(new Date(template.createdAt), "PPP")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 overflow-hidden border rounded-md p-2 text-xs text-gray-500">
                  <div dangerouslySetInnerHTML={{ __html: template.content.substring(0, 200) + "..." }} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/templates/${template.id}`}>Edit</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/templates/${template.id}/preview`}>Preview</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No templates found. Create your first template!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}