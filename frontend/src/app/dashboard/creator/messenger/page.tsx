import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MessengerPage() {
  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-tight text-foreground">
          Messenger
        </h1>
        <p className="text-sm font-normal text-muted-foreground">
          Chat with investors, service providers, and team members.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This section is currently under development. Here you will be able to manage your conversations and threads.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
