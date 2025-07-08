import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ProgramCharts } from "@/components/program-charts";
import { 
  X, 
  Download, 
  Share, 
  Calendar, 
  StickyNote,
  Target,
  Handshake,
  Sprout,
  Rocket,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Program } from "@shared/schema";

const iconMap = {
  "bullseye": Target,
  "handshake": Handshake,
  "seedling": Sprout,
  "rocket": Rocket,
  "chart-line": TrendingUp,
};

interface ProgramModalProps {
  program: Program | null;
  open: boolean;
  onClose: () => void;
}

export function ProgramModal({ program, open, onClose }: ProgramModalProps) {
  const [activeTab, setActiveTab] = useState("timeline");

  if (!program) return null;

  const IconComponent = iconMap[program.icon as keyof typeof iconMap] || Target;
  const budgetUtilization = program.budgetAllocated ? Math.round((program.budgetUsed / program.budgetAllocated) * 100) : 0;
  const successRate = 92; // Mock success rate

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: program.color }}
              >
                <IconComponent className="text-white text-xl w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {program.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Last updated: {formatDate(program.updatedAt || new Date())}
                </p>
              </div>
              <Badge 
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                {program.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {program.participants}
                </div>
                <div className="text-sm text-muted-foreground">
                  Participants
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {budgetUtilization}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Budget Utilized
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {program.progress}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Timeline Progress
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {successRate}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Success Rate
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="impact">Impact</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">
                    {program.description || "No description available."}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Timeline</h4>
                    <p className="text-sm text-muted-foreground">
                      {program.startDate ? formatDate(program.startDate) : "TBD"} - {program.endDate ? formatDate(program.endDate) : "TBD"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Budget</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(program.budgetUsed)} / {formatCurrency(program.budgetAllocated)}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <div className="space-y-6">
                <ProgramCharts program={program} />
              </div>
            </TabsContent>

            <TabsContent value="budget" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Budget Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="font-medium mb-2">Budget Allocation</h4>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(program.budgetAllocated)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="font-medium mb-2">Budget Used</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(program.budgetUsed)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activities" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Recent Activities</h3>
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Activity logs and recent updates would be displayed here
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="team" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Team Members</h3>
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Team member information would be displayed here
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="resources" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Resources</h3>
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Documents, files, links, and training materials would be displayed here
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="impact" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Impact Metrics</h3>
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Key performance indicators and success stories would be displayed here
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Internal Notes</h3>
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Internal notes and observations would be displayed here
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t">
            <Button className="space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </Button>
            <Button variant="outline" className="space-x-2">
              <Share className="w-4 h-4" />
              <span>Share Program Info</span>
            </Button>
            <Button variant="outline" className="space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </Button>
            <Button variant="outline" className="space-x-2">
              <StickyNote className="w-4 h-4" />
              <span>Add Note</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
