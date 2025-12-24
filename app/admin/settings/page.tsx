import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-muted-foreground">
          시스템 설정을 관리하세요.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>설정</CardTitle>
          <CardDescription>추후 구현 예정</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}












