import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PageProps {
  readonly params: {
    readonly id: string;
  };
}

export default async function EditGroupPage({ params }: PageProps) {
  // Await the params object before accessing its properties
  const resolvedParams = await Promise.resolve(params);
  const groupId = resolvedParams.id;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch the group
  const group = await prisma.group.findUnique({
    where: { 
      id: groupId
    }
  });

  // If group not found, show 404
  if (!group) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Group</h1>
        <Button variant="outline" asChild>
          <Link href={`/groups/${groupId}`}>Back to Group</Link>
        </Button>
      </div>

      <Card>
        <form action="/api/groups/update" method="POST">
          <input type="hidden" name="id" value={groupId} />
          
          <CardHeader>
            <CardTitle>Group Details</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input 
                id="name" 
                name="name" 
                defaultValue={group.name} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                name="description" 
                defaultValue={group.description || ''} 
                rows={4}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href={`/groups/${groupId}`}>Cancel</Link>
            </Button>
            <Button type="submit">Save Changes</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}