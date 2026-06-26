import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HireProvidersPage() {
  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-tight text-foreground">
          Hire Providers
        </h1>
        <p className="text-sm font-normal text-muted-foreground">
          Find and hire verified service providers to help build your ideas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider Marketplace</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This section is currently under development. Here you will be able to search and contract professional service providers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
