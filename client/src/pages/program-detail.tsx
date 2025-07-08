import { useParams } from "wouter";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgram, useProgramActivities } from "@/hooks/use-programs";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  ArrowLeft, 
  Target, 
  Handshake, 
  Sprout, 
  Rocket, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingDown 
} from "lucide-react";
import { Link } from "wouter";

const iconMap = {
  "bullseye": Target,
  "handshake": Handshake,
  "seedling": Sprout,
  "rocket": Rocket,
  "chart-line": TrendingUp,
};

export default function ProgramDetail() {
  const params = useParams();
  const programId = parseInt(params.id || "0");
  
  const { data: program, isLoading: programLoading } = useProgram(programId);
  const { data: activities, isLoading: activitiesLoading } = useProgramActivities(programId);

  if (programLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-destructive mb-4">Program Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The program you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const IconComponent = iconMap[program.icon as keyof typeof iconMap] || Target;
  const budgetUtilization = program.budgetAllocated ? Math.round((program.budgetUsed / program.budgetAllocated) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center space-x-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: program.color }}
            >
              <IconComponent className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{program.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <Badge 
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  {program.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Last updated: {formatDate(program.updatedAt || new Date())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: program.color }}>
                {program.participants}
              </div>
              <p className="text-xs text-muted-foreground">
                Active participants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {budgetUtilization}%
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(program.budgetUsed)} of {formatCurrency(program.budgetAllocated)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {program.progress}%
              </div>
              <Progress value={program.progress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {program.startDate ? formatDate(program.startDate) : "TBD"}
              </div>
              <p className="text-xs text-muted-foreground">
                to {program.endDate ? formatDate(program.endDate) : "TBD"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Program Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Program Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {program.description || "No description available for this program."}
              </p>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{activity.type}</div>
                        <div className="text-sm text-muted-foreground">{activity.details}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatDate(activity.date)}</div>
                        <Badge 
                          variant="secondary" 
                          className={activity.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                   activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                   activity.status === 'scheduled' ? 'bg-orange-100 text-orange-800' :
                                   'bg-yellow-100 text-yellow-800'}
                        >
                          {activity.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No recent activities found for this program.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
