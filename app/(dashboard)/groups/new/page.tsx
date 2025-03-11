import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { GroupForm } from "@/components/groups/GroupForm";

export default async function NewGroupPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create Group</h1>
      <GroupForm />
    </div>
  );
}