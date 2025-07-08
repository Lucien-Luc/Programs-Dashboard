import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { useLanguage } from "@/lib/LanguageProvider";
import { ChartCreator } from "@/components/chart-creator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Edit,
  Trash2,
  Settings,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Activity,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
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

interface AnalyticsData {
  programs: Program[];
  totalParticipants: number;
  totalBudget: number;
  activePrograms: number;
  completionRate: number;
  monthlyProgress: Array<{ month: string; progress: number; budget: number; participants: number }>;
  programTypes: Array<{ type: string; count: number; budget: number }>;
  statusDistribution: Array<{ status: string; count: number; value: number }>;
}

const CHART_COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", 
  "#ff00ff", "#00ffff", "#ff0000", "#0000ff", "#ffff00"
];

const CHART_TYPES = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "area", label: "Area Chart" },
];

const DATA_SOURCES = [
  { value: "programs", label: "Programs Overview" },
  { value: "progressAnalysis", label: "Progress Analysis" },
  { value: "budgetUtilization", label: "Budget Utilization" },
  { value: "participantGrowth", label: "Participant Growth" },
  { value: "programPerformance", label: "Program Performance" },
  { value: "statusDistribution", label: "Status Distribution" },
  { value: "typeComparison", label: "Type Comparison" },
];

export default function Analytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("6months");
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([]);
  const { t } = useLanguage();

  // Fetch programs data
  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  // Load saved chart configurations from Firestore
  const { data: savedConfigs = [] } = useQuery<ChartConfig[]>({
    queryKey: ["/api/analytics/charts"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/analytics/charts");
        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        return [];
      }
    },
  });

  // Load analytics data
  const { data: customData = [] } = useQuery({
    queryKey: ["/api/analytics/data"],
    initialData: [],
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

  const queryClient = useQueryClient();

  const handleSaveChart = (chartConfig: ChartConfig) => {
    const updatedCharts = [...chartConfigs, chartConfig];
    setChartConfigs(updatedCharts);
    saveChartsMutation.mutate(updatedCharts);
  };

  // Initialize chart configs from saved data
  useEffect(() => {
    if (savedConfigs && savedConfigs.length > 0) {
      setChartConfigs(savedConfigs);
    } else if (chartConfigs.length === 0) {
      // Set some default sample charts if none exist
      const defaultCharts: ChartConfig[] = [
        {
          id: "sample-progress",
          title: "Sample Progress Chart",
          type: "column",
          subtype: "clustered",
          programId: programs[0]?.id || "",
          dataSource: "progress",
          config: { colors: ['#8884d8', '#82ca9d', '#ffc658'] }
        },

      ];
      setChartConfigs(defaultCharts);
    }
  }, [savedConfigs, programs]);

  const deleteChart = (chartId: string) => {
    const updatedCharts = savedConfigs.filter(chart => chart.id !== chartId);
    saveChartsMutation.mutate(updatedCharts);
  };

  // Calculate analytics data
  const analyticsData: AnalyticsData = {
    programs,
    totalParticipants: programs.reduce((sum, p) => sum + (p.participants || 0), 0),
    totalBudget: programs.reduce((sum, p) => sum + (p.budgetAllocated || 0), 0),
    activePrograms: programs.filter(p => p.status === 'active').length,
    completionRate: programs.length > 0 ? 
      (programs.filter(p => p.status === 'completed').length / programs.length) * 100 : 0,
    
    monthlyProgress: [
      { month: "Jan", progress: 65, budget: 85000, participants: 120 },
      { month: "Feb", progress: 72, budget: 92000, participants: 145 },
      { month: "Mar", progress: 78, budget: 88000, participants: 160 },
      { month: "Apr", progress: 85, budget: 95000, participants: 180 },
      { month: "May", progress: 88, budget: 102000, participants: 195 },
      { month: "Jun", progress: 92, budget: 98000, participants: 210 },
    ],
    
    programTypes: [
      { type: "CORE", count: programs.filter(p => p.type === 'CORE').length, 
        budget: programs.filter(p => p.type === 'CORE').reduce((sum, p) => sum + (p.budgetAllocated || 0), 0) },
      { type: "RIN", count: programs.filter(p => p.type === 'RIN').length,
        budget: programs.filter(p => p.type === 'RIN').reduce((sum, p) => sum + (p.budgetAllocated || 0), 0) },
      { type: "AGUKA", count: programs.filter(p => p.type === 'AGUKA').length,
        budget: programs.filter(p => p.type === 'AGUKA').reduce((sum, p) => sum + (p.budgetAllocated || 0), 0) },
      { type: "i-ACC", count: programs.filter(p => p.type === 'i-ACC').length,
        budget: programs.filter(p => p.type === 'i-ACC').reduce((sum, p) => sum + (p.budgetAllocated || 0), 0) },
      { type: "MCF", count: programs.filter(p => p.type === 'MCF').length,
        budget: programs.filter(p => p.type === 'MCF').reduce((sum, p) => sum + (p.budgetAllocated || 0), 0) },
    ].filter(item => item.count > 0),
    
    statusDistribution: [
      { status: "Active", count: programs.filter(p => p.status === 'active').length, value: 0 },
      { status: "Paused", count: programs.filter(p => p.status === 'paused').length, value: 0 },
      { status: "Completed", count: programs.filter(p => p.status === 'completed').length, value: 0 },
      { status: "Cancelled", count: programs.filter(p => p.status === 'cancelled').length, value: 0 },
    ].map(item => ({ ...item, value: item.count })).filter(item => item.count > 0),
  };



  // Generate data for charts from our chart creator modal format
  const getChartData = (config: ChartConfig) => {
    // Filter programs if specific program is selected
    const targetPrograms = config.programId && config.programId !== "all" 
      ? programs.filter(p => p.id === config.programId)
      : programs;

    switch (config.dataSource) {
      case "Progress":
        return targetPrograms.map(p => ({
          name: p.name,
          value: p.progress,
          progress: p.progress
        }));
      
      case "Budget":
        return targetPrograms.map(p => ({
          name: p.name,
          value: p.budgetAllocated || 0,
          allocated: p.budgetAllocated || 0,
          used: p.budgetUsed || 0
        }));
      
      case "Participants":
        return targetPrograms.map(p => ({
          name: p.name,
          value: p.participants,
          participants: p.participants
        }));
        
      case "Status":
        const statusCounts = targetPrograms.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        return Object.entries(statusCounts).map(([status, count]) => ({
          name: status,
          value: count,
          status: status
        }));
        
      case "Category":
        const categoryCounts = targetPrograms.reduce((acc, p) => {
          const category = p.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        return Object.entries(categoryCounts).map(([category, count]) => ({
          name: category,
          value: count,
          category: category
        }));
      
      default:
        return targetPrograms.map(p => ({
          name: p.name,
          value: p.progress,
          budget: p.budgetAllocated || 0,
          participants: p.participants,
          status: p.status
        }));
    }
  };

  const renderChart = (config: ChartConfig) => {
    const data = getChartData(config);
    const height = config.height === "small" ? 200 : config.height === "large" ? 400 : 300;

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <p>No data available for this chart</p>
          </div>
        </div>
      );
    }

    switch (config.type) {
      case "bar":
      case "column":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend />
              <Bar dataKey="value" fill={config.color || "#8884d8"} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={config.color || "#8884d8"} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={Math.min(height * 0.35, 120)}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case "area":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend />
              <Area type="monotone" dataKey="value" stroke={config.color || "#8884d8"} fill={config.color || "#8884d8"} fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div className="text-center py-8 text-muted-foreground">Unsupported chart type: {config.type}</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Analytics Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ChartBar className="w-12 h-12" />
              <div>
                <h1 className="text-3xl font-bold mb-2">{t("analytics")}</h1>
                <p className="text-blue-100 text-lg">
                  {t("welcome_message")}
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white hover:text-blue-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white hover:text-blue-600"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("total_programs")}</p>
                  <p className="text-2xl font-bold">{analyticsData.programs.length}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("active_programs")}</p>
                  <p className="text-2xl font-bold">{analyticsData.activePrograms}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("total_participants")}</p>
                  <p className="text-2xl font-bold">{analyticsData.totalParticipants.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t("total_budget")}</p>
                  <p className="text-2xl font-bold">${analyticsData.totalBudget.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {savedConfigs.map((config) => (
            <div
              key={config.id}
              className={config.width === "full" ? "lg:col-span-2" : ""}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{config.title}</CardTitle>
                    {config.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {config.type.toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {renderChart(config)}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {savedConfigs.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <ChartBar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Charts Available</h3>
              <p className="text-muted-foreground mb-4">
                Create charts in the admin panel to see program analytics and insights here.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => window.location.href = '/admin'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Charts in Admin
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function ChartConfigForm({ 
  initialConfig, 
  onSave, 
  onCancel 
}: { 
  initialConfig?: ChartConfig | null;
  onSave: (config: ChartConfig) => void;
  onCancel: () => void;
}) {
  const [config, setConfig] = useState<Partial<ChartConfig>>(
    initialConfig || {
      title: "",
      type: "bar",
      dataSource: "programs",
      xAxis: "",
      yAxis: "",
      color: "#8884d8",
      width: "half",
      height: "medium",
      description: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.title && config.type && config.dataSource) {
      onSave(config as ChartConfig);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Chart Title</Label>
          <Input
            id="title"
            value={config.title || ""}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            placeholder="Enter chart title"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type">Chart Type</Label>
          <Select
            value={config.type}
            onValueChange={(value: any) => setConfig({ ...config, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHART_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataSource">Data Source</Label>
          <Select
            value={config.dataSource}
            onValueChange={(value) => setConfig({ ...config, dataSource: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATA_SOURCES.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="color">Chart Color</Label>
          <Input
            id="color"
            type="color"
            value={config.color || "#8884d8"}
            onChange={(e) => setConfig({ ...config, color: e.target.value })}
          />
        </div>
      </div>

      {config.type !== "pie" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="xAxis">X-Axis Field</Label>
            <Input
              id="xAxis"
              value={config.xAxis || ""}
              onChange={(e) => setConfig({ ...config, xAxis: e.target.value })}
              placeholder="e.g., month, type, status"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="yAxis">Y-Axis Field</Label>
            <Input
              id="yAxis"
              value={config.yAxis || ""}
              onChange={(e) => setConfig({ ...config, yAxis: e.target.value })}
              placeholder="e.g., count, progress, budget"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width">Chart Width</Label>
          <Select
            value={config.width}
            onValueChange={(value: any) => setConfig({ ...config, width: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="half">Half Width</SelectItem>
              <SelectItem value="full">Full Width</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="height">Chart Height</Label>
          <Select
            value={config.height}
            onValueChange={(value: any) => setConfig({ ...config, height: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={config.description || ""}
          onChange={(e) => setConfig({ ...config, description: e.target.value })}
          placeholder="Brief description of what this chart shows"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialConfig ? "Update Chart" : "Create Chart"}
        </Button>
      </div>
    </form>
  );
}