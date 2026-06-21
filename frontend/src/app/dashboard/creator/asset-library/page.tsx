import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssetLibraryPage() {
  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-tight text-foreground">
          Asset Library
        </h1>
        <p className="text-sm font-normal text-muted-foreground">
          Upload and manage images, videos, design assets, and links.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Media Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            This section is currently under development. Here you will store your presentation and media assets.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
