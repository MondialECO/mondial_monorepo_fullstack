import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfferPricingPage() {
  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-tight text-foreground">
          Offer & Pricing
        </h1>
        <p className="text-sm font-normal text-muted-foreground">
          Define your financial offers, funding goals, and pricing structure.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offer & Pricing Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This section is currently under development. Here you will be able to structure equity terms and pricing models.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
