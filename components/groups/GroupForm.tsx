"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface GroupFormProps {
  initialGroup?: {
    id?: string;
    name: string;
    description: string | null;
  };
}

export function GroupForm({ initialGroup }: GroupFormProps) {
  const [name, setName] = useState(initialGroup?.name || "");
  const [description, setDescription] = useState(initialGroup?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const isEditing = !!initialGroup?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast({
        title: "Validation Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const url = isEditing
        ? `/api/groups/${initialGroup.id}`
        : "/api/groups";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save group");
      }

      toast({
        title: isEditing ? "Group Updated" : "Group Created",
        description: `${name} has been saved successfully`,
      });

      router.push("/groups");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Group Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Newsletter Subscribers"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description || ""}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="People who subscribed to our newsletter"
          rows={3}
        />
      </div>

      <div className="flex space-x-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Update Group"
            : "Create Group"}
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