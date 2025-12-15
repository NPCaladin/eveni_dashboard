"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { JobCategoryGroup } from "@/lib/types/consultant";
import { groupByGrade } from "@/lib/utils/parse-consultant-resource";
import { ConsultantCard } from "./consultant-card";

interface JobCategoryAccordionProps {
  groups: JobCategoryGroup[];
}

export function JobCategoryAccordion({ groups }: JobCategoryAccordionProps) {
  const getGradeBadgeStyle = (grade: string) => {
    switch (grade) {
      case "베테랑":
        return "text-blue-700 border-blue-200 bg-blue-50";
      case "숙련":
        return "text-green-700 border-green-200 bg-green-50";
      case "일반":
        return "text-gray-700 border-gray-200 bg-gray-50";
      default:
        return "text-gray-700 border-gray-200 bg-gray-50";
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Accordion type="single"  className="space-y-2">
          {groups.map((group) => {
            const gradeGroups = groupByGrade(group.consultants);

            return (
              <AccordionItem
                key={group.jobCategory}
                value={group.jobCategory}
                className="border rounded-lg"
              >
                <AccordionTrigger
                  value={group.jobCategory}
                  className="px-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-gray-900">
                        {group.jobCategory}
                      </span>
                      <span className="text-sm text-gray-600">
                        {group.totalCount}명 중 {group.availableCount}명 가능
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={group.availableRate}
                        className="w-32 h-2"
                      />
                      <span className="text-sm font-medium text-gray-700 min-w-[50px] text-right">
                        {group.availableRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent
                  value={group.jobCategory}
                  className="px-4 pb-4"
                >
                  <div className="space-y-6 mt-4">
                    {Object.entries(gradeGroups).map(
                      ([grade, consultants]) => {
                        if (consultants.length === 0) return null;

                        return (
                          <div key={grade}>
                            <div
                              className={`text-sm font-semibold mb-3 pb-2 border-b ${getGradeBadgeStyle(
                                grade
                              )}`}
                            >
                              {grade} ({consultants.length}명)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                              {consultants.map((consultant) => (
                                <ConsultantCard
                                  key={consultant.name}
                                  consultant={consultant}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

