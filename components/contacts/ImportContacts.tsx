// components/contacts/ImportContacts.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";

interface Group {
  id: string;
  name: string;
}

interface ImportContactsProps {
  readonly groups: ReadonlyArray<Group>;
}

export function ImportContacts({ groups }: ImportContactsProps) {
  const [file, setFile] = useState<File | null>(null);
  const [groupId, setGroupId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGroupId(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append("file", file);
      if (groupId) {
        formData.append("groupId", groupId);
      }
      
      const response = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to import contacts");
      }
      
      toast({
        title: "Import Successful",
        description: `Added: ${data.results.added}, Duplicates: ${data.results.duplicates}, Errors: ${data.results.errors}`,
      });
      
      router.refresh();
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="excel-file" className="block text-sm font-medium mb-1">Excel File</Label>
        <Input
          id="excel-file"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <p className="text-xs text-gray-500 mt-1">
          File should have columns: email, firstName, lastName
        </p>
      </div>
      
      <div>
        <Label htmlFor="group-select" className="block text-sm font-medium mb-1">Add to Group (Optional)</Label>
        <select
          id="group-select"
          value={groupId}
          onChange={handleGroupChange}
          disabled={isUploading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">None</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>
      
      <Button type="submit" disabled={isUploading}>
        {isUploading ? "Importing..." : "Import Contacts"}
      </Button>
    </form>
  );
}