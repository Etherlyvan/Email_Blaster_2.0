// components/settings/ApiKeyForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Switch } from "../ui/switch";
import { useToast } from "../ui/use-toast";
import { Loader2 } from "lucide-react";

export function ApiKeyForm() {
  const [name, setName] = useState("");
  const [type, setType] = useState<"SMTP" | "API">("SMTP");
  const [key, setKey] = useState("");
  const [host, setHost] = useState("smtp-relay.brevo.com");
  const [port, setPort] = useState("587");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Please provide a name for this configuration",
        variant: "destructive",
      });
      return;
    }
    
    if (type === "SMTP") {
      if (!host || !port || !username || !password) {
        toast({
          title: "Validation Error",
          description: "SMTP configuration requires host, port, username, and password",
          variant: "destructive",
        });
        return;
      }
    } else if (!key) {
      toast({
        title: "Validation Error",
        description: "API key is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/settings/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          key: type === "API" ? key : null,
          host: type === "SMTP" ? host : null,
          port: type === "SMTP" && port ? parseInt(port) : null,
          username: type === "SMTP" ? username : null,
          password: type === "SMTP" ? password : null,
          isDefault,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to add configuration");
      }
      
      toast({
        title: "Configuration Added",
        description: `${type} configuration "${name}" has been added successfully`,
      });
      
      router.refresh();
      setName("");
      setKey("");
      setUsername("");
      setPassword("");
      setIsDefault(false);
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
  
  const handleTestSmtp = async () => {
    if (!host || !port || !username || !password) {
      toast({
        title: "Validation Error",
        description: "Please fill all SMTP fields before testing",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsTesting(true);
      
      const response = await fetch("/api/settings/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          port: parseInt(port),
          username,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "SMTP test failed");
      }
      
      toast({
        title: "SMTP Test Successful",
        description: "Your SMTP configuration is working correctly",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "SMTP Test Failed",
        description: error instanceof Error ? error.message : "Could not connect to SMTP server",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Configuration Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Production SMTP"
          required
        />
      </div>
      
      <div>
        <Label>Configuration Type</Label>
        <RadioGroup 
          value={type} 
          onValueChange={(value: string) => setType(value as "SMTP" | "API")} 
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="SMTP" id="smtp" />
            <Label htmlFor="smtp">SMTP</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="API" id="api" />
            <Label htmlFor="api">API Key</Label>
          </div>
        </RadioGroup>
      </div>
      
      {type === "API" ? (
        <div>
          <Label htmlFor="key">API Key</Label>
          <Input
            id="key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="xkeysib-..."
            required={type === "API"}
          />
        </div>
      ) : (
        <>
          <div>
            <Label htmlFor="host">SMTP Host</Label>
            <Input
              id="host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="smtp-relay.brevo.com"
              required={type === "SMTP"}
            />
          </div>
          
          <div>
            <Label htmlFor="port">SMTP Port</Label>
            <Input
              id="port"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="587"
              type="number"
              required={type === "SMTP"}
            />
          </div>
          
          <div>
            <Label htmlFor="username">SMTP Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-smtp-username@brevo.com"
              required={type === "SMTP"}
            />
          </div>
          
          <div>
            <Label htmlFor="password">SMTP Password/API Key</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="xsmtpsib-..."
              required={type === "SMTP"}
            />
            <p className="text-xs text-gray-500 mt-1">
              For Brevo, use your SMTP API key here
            </p>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleTestSmtp}
            disabled={isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test SMTP Connection"
            )}
          </Button>
        </>
      )}
      
      <div className="flex items-center space-x-2">
        <Switch
          id="isDefault"
          checked={isDefault}
          onCheckedChange={setIsDefault}
        />
        <Label htmlFor="isDefault">Set as default for {type}</Label>
      </div>
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Add Configuration"
        )}
      </Button>
    </form>
  );
}