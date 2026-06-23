import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function IpVaultPage() {
  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-tight text-foreground">
          IP Vault
        </h1>
        <p className="text-sm font-normal text-muted-foreground">
          Secure and verify your Intellectual Property assets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>IP Vault Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This section is currently under development. Here you will store, sign, and manage your IP certificates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
