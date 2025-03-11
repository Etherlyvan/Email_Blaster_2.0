import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Contact } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface GroupWithContacts {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  contacts: Array<{
    contact: Contact;
  }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
  // Await the params object before accessing its properties
  const resolvedParams = await params;
  const groupId = resolvedParams.id;

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch the group with its contacts
  const group = await prisma.group.findUnique({
    where: { 
      id: groupId
    },
    include: {
      contacts: {
        include: {
          contact: true
        }
      }
    }
  });

  // If group not found, show 404
  if (!group) {
    notFound();
  }
  
  // Cast the group to our interface with the correct structure
  const groupWithContacts = group as unknown as GroupWithContacts;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{groupWithContacts.name}</h1>
          <p className="text-muted-foreground">
            Created {format(new Date(groupWithContacts.createdAt), "PPP")}
          </p>
          {groupWithContacts.description && (
            <p className="mt-2">{groupWithContacts.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/groups/${groupWithContacts.id}/edit`}>Edit Group</Link>
          </Button>
          <Button asChild>
            <Link href={`/contacts/new?groupId=${groupWithContacts.id}`}>Add Contact</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <div className="p-4 bg-muted/50">
          <h2 className="text-lg font-medium">Contacts in this Group</h2>
          <p className="text-sm text-muted-foreground">
            {groupWithContacts.contacts.length} contacts
          </p>
        </div>
        
        {groupWithContacts.contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">First Name</th>
                  <th className="px-4 py-3 text-left font-medium">Last Name</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupWithContacts.contacts.map(({ contact }) => (
                  <tr key={contact.id} className="border-b">
                    <td className="px-4 py-3">{contact.email}</td>
                    <td className="px-4 py-3">{contact.firstName || "-"}</td>
                    <td className="px-4 py-3">{contact.lastName || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/contacts/${contact.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-muted-foreground">No contacts in this group yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}