// app/(dashboard)/campaigns/new/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateCampaignForm } from "@/components/campaigns/CreateCampaignForm";

// Define a type that matches what CreateCampaignForm expects
type ComponentApiKey = {
  id: string;
  name: string;
  userId: string;
  type: string;
  key?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default async function NewCampaignPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get templates, groups, and API keys for the form
  const templates = await prisma.template.findMany({
    orderBy: { name: "asc" },
  });
  
  const groups = await prisma.group.findMany({
    orderBy: { name: "asc" },
  });
  
  // Fetch API keys and convert null values to undefined
  const apiKeysData = await prisma.apiKey.findMany({
    where: { userId: session.user.id, type: 'SMTP' },
  });
  
  // Convert null values to undefined to match the expected type
  const apiKeys = apiKeysData.map(key => ({
    ...key,
    host: key.host ?? undefined,
    port: key.port ?? undefined,
    key: key.key ?? undefined,
    username: key.username ?? undefined,
    password: key.password ?? undefined
  })) as readonly ComponentApiKey[];

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