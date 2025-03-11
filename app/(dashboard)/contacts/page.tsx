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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportContacts } from "@/components/contacts/ImportContacts";

export default async function ContactsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const [contacts, groups] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        groups: {
          include: {
            group: true,
          },
        },
      },
    }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/contacts/new">Add Contact</Link>
          </Button>
          <Button asChild>
            <Link href="/groups/new">Create Group</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">All Contacts</TabsTrigger>
          <TabsTrigger value="import">Import Contacts</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts" className="space-y-4">
          {contacts.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Groups
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {contact.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {contact.firstName} {contact.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-1">
                          {contact.groups.map((groupContact) => (
                            <span key={groupContact.groupId} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {groupContact.group.name}
                            </span>
                          ))}
                          {contact.groups.length === 0 && (
                            <span className="text-gray-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(contact.createdAt), "PP")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/contacts/${contact.id}`}>Edit</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">No contacts found. Add or import contacts to get started.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Contacts from Excel</CardTitle>
            </CardHeader>
            <CardContent>
              <ImportContacts groups={groups} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}