"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

interface Group {
  id: string;
  name: string;
}

interface ContactFormProps {
  readonly groups: ReadonlyArray<Group>;
  readonly initialContact?: {
    readonly id?: string;
    readonly email: string;
    readonly firstName?: string | null;
    readonly lastName?: string | null;
    readonly groups?: ReadonlyArray<{ readonly groupId: string }>;
  };
}

export function ContactForm({ groups, initialContact }: ContactFormProps) {
  const [email, setEmail] = useState(initialContact?.email ?? "");
  const [firstName, setFirstName] = useState(initialContact?.firstName ?? "");
  const [lastName, setLastName] = useState(initialContact?.lastName ?? "");
  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    initialContact?.groups?.map((g) => g.groupId) ?? []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const isEditing = !!initialContact?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const url = isEditing
        ? `/api/contacts/${initialContact.id}`
        : "/api/contacts";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          groupIds: selectedGroups,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save contact");
      }

      toast({
        title: isEditing ? "Contact Updated" : "Contact Created",
        description: `${email} has been saved successfully`,
      });

      router.push("/contacts");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Split into two separate methods instead of using a conditional
  const addGroupToSelection = (groupId: string) => {
    setSelectedGroups((prev) => [...prev, groupId]);
  };

  const removeGroupFromSelection = (groupId: string) => {
    setSelectedGroups((prev) => prev.filter((id) => id !== groupId));
  };

  const handleGroupChange = (groupId: string, checked: boolean) => {
    if (checked) {
      addGroupToSelection(groupId);
    } else {
      removeGroupFromSelection(groupId);
    }
  };

  // Helper function to get submit button text
  const getSubmitButtonText = () => {
    if (isSubmitting) {
      return "Saving...";
    }
    if (isEditing) {
      return "Update Contact";
    }
    return "Add Contact";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@example.com"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={firstName ?? ""}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={lastName ?? ""}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
          />
        </div>
      </div>

      <div>
        <Label>Groups</Label>
        <div className="mt-2 border rounded-md p-4 space-y-2">
          {groups.length > 0 ? (
            groups.map((group) => (
              <div key={group.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`group-${group.id}`}
                  checked={selectedGroups.includes(group.id)}
                  onCheckedChange={(checked) =>
                    handleGroupChange(group.id, checked === true)
                  }
                />
                <Label htmlFor={`group-${group.id}`} className="cursor-pointer">
                  {group.name}
                </Label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No groups available</p>
          )}
        </div>
      </div>

      <div className="flex space-x-3">
        <Button type="submit" disabled={isSubmitting}>
          {getSubmitButtonText()}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}