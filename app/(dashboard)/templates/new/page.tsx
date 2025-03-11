
import { TemplateEditor } from "@/components/templates/TemplateEditor";

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create Template</h1>
      <TemplateEditor />
    </div>
  );
}