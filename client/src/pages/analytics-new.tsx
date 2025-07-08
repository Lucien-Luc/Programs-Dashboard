import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { ChartCreator } from "@/components/chart-creator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  ChartBar,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
} from "lucide-react";
import { programsApi } from "@/lib/api";
import type { Program } from "@shared/schema";

interface ChartConfig {
  id: string;
  title: string;
  type: string;
  subtype: string;
  programId: string;
  dataSource: string;
  config: any;
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export default function Analytics() {
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([]);
  const queryClient = useQueryClient();

  // Fetch programs data
  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["programs"],
    queryFn: () => programsApi.getAll(),
  });

  // Load saved chart configurations from Firestore
  const { data: savedConfigs = [] } = useQuery<ChartConfig[]>({
    queryKey: ["/api/analytics/charts"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/analytics/charts");
        return await response.json();
      } catch (error) {
        return [];
      }
    },
  });

  // Save chart configurations to Firestore
  const saveChartsMutation = useMutation({
    mutationFn: async (charts: ChartConfig[]) => {
      const response = await fetch("/api/analytics/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charts }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/charts"] });
    },
  });

  const handleSaveChart = (chartConfig: ChartConfig) => {
    const updatedCharts = [...chartConfigs, chartConfig];
    setChartConfigs(updatedCharts);
    saveChartsMutation.mutate(updatedCharts);
  };

  const deleteChart = (chartId: string) => {
    const updatedCharts = chartConfigs.filter(chart => chart.id !== chartId);
    setChartConfigs(updatedCharts);
    saveChartsMutation.mutate(updatedCharts);
  };

  // Initialize chart configs from saved data
  useEffect(() => {
    if (savedConfigs && savedConfigs.length > 0) {
      setChartConfigs(savedConfigs);
    }
  }, [savedConfigs]);

  // Calculate analytics data
  const analyticsData = {
    totalParticipants: programs.reduce((sum, p) => sum + (p.participants || 0), 0),
    totalBudget: programs.reduce((sum, p) => sum + (p.budgetAllocated || 0), 0),
    activePrograms: programs.filter(p => p.status === 'active').length,
    completionRate: programs.length > 0 ? 
      (programs.filter(p => p.status === 'completed').length / programs.length) * 100 : 0,
  };

  const generateChartData = (config: ChartConfig) => {
    const selectedProgram = programs.find(p => p.id === config.programId);
    
    if (!selectedProgram) {
      return [];
    }

    switch (config.dataSource) {
      case "progress":
        return [
          { name: "Current", value: selectedProgram.progress },
          { name: "Target", value: 100 },
        ];
      
      case "budget":
        return [
          { name: "Allocated", value: selectedProgram.budgetAllocated || 0 },
          { name: "Used", value: selectedProgram.budgetUsed || 0 },
        ];
      
      case "participants":
        return [
          { name: "Jan", value: Math.floor((selectedProgram.participants || 0) * 0.6) },
          { name: "Feb", value: Math.floor((selectedProgram.participants || 0) * 0.7) },
          { name: "Mar", value: Math.floor((selectedProgram.participants || 0) * 0.8) },
          { name: "Current", value: selectedProgram.participants || 0 },
        ];
      
      case "status":
        const programsByStatus = programs.reduce((acc, program) => {
          acc[program.status] = (acc[program.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(programsByStatus).map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
        }));
      
      default:
        return [];
    }
  };

  const renderChart = (config: ChartConfig) => {
    const data = generateChartData(config);
    const colors = config.config?.colors || CHART_COLORS;

    if (data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available for this chart
        </div>
      );
    }

    switch (config.type) {
      case "column":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type={config.subtype.includes("smooth") ? "monotone" : "linear"}
                dataKey="value" 
                stroke={colors[0]} 
                strokeWidth={2}
                dot={config.subtype.includes("markers")}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={config.subtype === "doughnut" ? 80 : 100}
                innerRadius={config.subtype === "doughnut" ? 40 : 0}
                fill={colors[0]}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={colors[0]} 
                fill={colors[0]} 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="value" />
              <YAxis />
              <Tooltip />
              <Scatter dataKey="value" fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Program Analytics</h1>
          <p className="text-gray-600">Create and manage charts for program data visualization</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Programs</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.activePrograms}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Participants</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.totalParticipants.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">${analyticsData.totalBudget.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.completionRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Creation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Charts</h2>
            <ChartCreator onSave={handleSaveChart} />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartConfigs.map((config) => (
            <Card key={config.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{config.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{config.type}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteChart(config.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderChart(config)}
                <div className="mt-4 text-sm text-gray-600">
                  Program: {programs.find(p => p.id === config.programId)?.name || "Unknown"}
                  <br />
                  Data: {config.dataSource.charAt(0).toUpperCase() + config.dataSource.slice(1)}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {chartConfigs.length === 0 && (
            <Card className="lg:col-span-2">
              <CardContent className="p-12 text-center">
                <ChartBar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Charts Created</h3>
                <p className="text-gray-600 mb-4">
                  Create your first chart to visualize program data using the Microsoft Word-style chart creator.
                </p>
                <ChartCreator onSave={handleSaveChart} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}