"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConsultantResource } from "@/lib/types/consultant";

interface ConsultantCardProps {
  consultant: ConsultantResource;
}

export function ConsultantCard({ consultant }: ConsultantCardProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "available":
        return {
          bg: "bg-white",
          border: "border-green-200",
          text: "text-gray-900",
          badge: "bg-green-100 text-green-800",
          icon: "✅",
        };
      case "unavailable":
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-400",
          badge: "bg-gray-100 text-gray-500",
          icon: "❌",
        };
      case "pending":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200 border-dashed",
          text: "text-gray-700",
          badge: "bg-yellow-100 text-yellow-800",
          icon: "⏳",
        };
      default:
        return {
          bg: "bg-white",
          border: "border-gray-200",
          text: "text-gray-900",
          badge: "bg-gray-100 text-gray-500",
          icon: "",
        };
    }
  };

  const style = getStatusStyle(consultant.status);

  return (
    <Card
      className={`${style.bg} ${style.border} border hover:shadow-md transition-shadow`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`font-semibold ${style.text}`}>
            {consultant.status === "unavailable" && (
              <span className="mr-1">{style.icon}</span>
            )}
            {consultant.name}
          </div>
          {consultant.capacity !== null && consultant.capacity > 0 && (
            <Badge variant="outline" className="text-xs">
              {consultant.capacity}명
            </Badge>
          )}
        </div>
        {consultant.status !== "available" && (
          <Badge className={`text-xs ${style.badge}`}>
            {consultant.status === "unavailable" ? "불가" : "미정"}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}



