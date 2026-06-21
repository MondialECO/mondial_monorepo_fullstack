import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DocumentsPage() {
  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-tight text-foreground">
          Documents
        </h1>
        <p className="text-sm font-normal text-muted-foreground">
          Store business plans, legal agreements, pitch decks, and financial spreadsheets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents Repository</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This section is currently under development. Here you will hold and sign your project documents.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
