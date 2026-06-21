import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiMasterplanPage() {
  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-tight text-foreground">
          AI Masterplan
        </h1>
        <p className="text-sm font-normal text-muted-foreground">
          Generate and explore AI-powered plans for your business idea.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Masterplan Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This section is currently under development. Here you will be able to run AI generation tools for business planning.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
