import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";

export default async function GroupsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const groups = await prisma.group.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { contacts: true }
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contact Groups</h1>
        <Button asChild>
          <Link href="/groups/new">Create Group</Link>
        </Button>
      </div>

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    {group.description || "No description"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">{group._count.contacts}</span> contacts
                  </p>
                  <p className="text-xs text-gray-500">
                    Created {format(new Date(group.createdAt), "PPP")}
                  </p>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/groups/${group.id}`}>Edit</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/groups/${group.id}/contacts`}>View Contacts</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No groups found. Create your first group!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}