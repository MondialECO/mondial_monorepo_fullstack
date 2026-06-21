import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectStudioPage() {
  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-tight text-foreground">
          Project Studio
        </h1>
        <p className="text-sm font-normal text-muted-foreground">
          Manage your project assets and creation workflow.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Studio Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This section is currently under development. Here you will be able to customize and manage your project.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
