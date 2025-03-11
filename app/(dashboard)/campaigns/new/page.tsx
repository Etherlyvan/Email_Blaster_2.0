// app/(dashboard)/campaigns/new/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateCampaignForm } from "@/components/campaigns/CreateCampaignForm";


export default async function NewCampaignPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get templates, groups, and API keys for the form
  const [templates, groups, apiKeys] = await Promise.all([
    prisma.template.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.apiKey.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create Campaign</h1>
      <CreateCampaignForm
        templates={templates}
        groups={groups}
        apiKeys={apiKeys}
      />
    </div>
  );
}