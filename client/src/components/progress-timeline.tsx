import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";
import type { Program } from "@shared/schema";

interface ProgressTimelineProps {
  programs: Program[];
}

export function ProgressTimeline({ programs }: ProgressTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span>Program Progress Timeline</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {programs.map((program) => (
          <div 
            key={program.id}
            className="flex items-center space-x-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-4 rounded-lg transition-colors"
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: program.color }}
            />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {program.name} - Q2 2025
                </span>
                <span className="text-sm text-muted-foreground">
                  Q1-Q4 2025
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative">
                <div 
                  className="h-3 rounded-full relative"
                  style={{ 
                    width: `${program.progress}%`,
                    backgroundColor: program.color 
                  }}
                >
                  <span className="absolute right-2 top-0 text-xs text-white font-medium leading-3">
                    {program.progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
