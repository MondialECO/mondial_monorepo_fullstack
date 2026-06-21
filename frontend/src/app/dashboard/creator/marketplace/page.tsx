import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MarketplacePage() {
  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-tight text-foreground">
          Marketplace
        </h1>
        <p className="text-sm font-normal text-muted-foreground">
          Browse and buy/sell project listings and resources.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marketplace Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This section is currently under development. Here you will see verified projects and assets available on the market.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
