import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { ProgramForm } from "@/components/admin/program-form";
import { EnhancedTableBuilder } from "@/components/admin/enhanced-table-builder";
import { ColumnHeaderManager } from "@/components/admin/column-header-manager";
import { ChartCreatorModal } from "@/components/admin/chart-creator-modal";
import { EnhancedLoginForm } from "@/components/enhanced-login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePrograms, useDeleteProgram } from "@/hooks/use-programs";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Copy, 
  Archive,
  Users,
  Activity,
  FileText,
  Database,
  LogOut,
  RefreshCw,
  Image,
  ChartBar
} from "lucide-react";
import type { Program } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";

interface ChartConfig {
  id: string;
  title: string;
  type: "bar" | "line" | "pie" | "area";
  dataSource: string;
  programId?: number | "all"; // Specific program or all programs
  metrics: string[]; // Which metrics to display
  xAxis?: string;
  yAxis?: string;
  color: string;
  description?: string;
  width: "full" | "half";
  height: "small" | "medium" | "large";
  filters?: {
    status?: string[];
    type?: string[];
    dateRange?: { start: string; end: string };
  };
}

interface AnalyticsData {
  id: string;
  name: string;
  value: number;
  category: string;
  date?: string;
  metadata?: any;
}

function AnalyticsAdminPanel({ programs }: { programs: Program[] | undefined }) {
  const [selectedChart, setSelectedChart] = useState<ChartConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingData, setEditingData] = useState<AnalyticsData[]>([]);
  const [activeTab, setActiveTab] = useState<"charts" | "data">("charts");
  const [showChartModal, setShowChartModal] = useState(false);
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load chart configurations
  const { data: chartConfigs = [], refetch: refetchCharts } = useQuery<ChartConfig[]>({
    queryKey: ["/api/analytics/charts"],
  });

  // Load analytics data
  const { data: analyticsData = [], refetch: refetchData } = useQuery<AnalyticsData[]>({
    queryKey: ["/api/analytics/data"],
    initialData: [],
  });

  // Save chart configuration
  const saveChartMutation = useMutation({
    mutationFn: async (configs: ChartConfig[]) => {
      const response = await fetch("/api/analytics/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charts: configs }),
      });
      if (!response.ok) throw new Error("Failed to save charts");
      return response.json();
    },
    onSuccess: () => {
      refetchCharts();
      toast({ description: "Charts updated successfully" });
    },
  });

  // Save analytics data
  const saveDataMutation = useMutation({
    mutationFn: async (data: AnalyticsData[]) => {
      const response = await fetch("/api/analytics/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!response.ok) throw new Error("Failed to save data");
      return response.json();
    },
    onSuccess: () => {
      refetchData();
      toast({ description: "Analytics data updated successfully" });
    },
  });

  const handleCreateChart = () => {
    setEditingChart(null);
    setShowChartModal(true);
  };

  const handleEditChart = (chart: ChartConfig) => {
    setEditingChart(chart);
    setShowChartModal(true);
  };

  const handleSaveChart = (chart: ChartConfig) => {
    const updatedCharts = editingChart 
      ? chartConfigs.map(c => c.id === chart.id ? chart : c)
      : [...chartConfigs, chart];
    saveChartMutation.mutate(updatedCharts);
    setShowChartModal(false);
    setEditingChart(null);
  };

  const handleDeleteChart = (chartId: string) => {
    if (confirm("Delete this chart?")) {
      const updatedCharts = chartConfigs.filter(c => c.id !== chartId);
      saveChartMutation.mutate(updatedCharts);
    }
  };

  const handleAddDataPoint = () => {
    const newDataPoint: AnalyticsData = {
      id: Date.now().toString(),
      name: "New Data Point",
      value: 0,
      category: "custom",
      date: new Date().toISOString().split('T')[0],
    };
    setEditingData([...editingData, newDataPoint]);
  };

  const handleUpdateDataPoint = (id: string, field: keyof AnalyticsData, value: any) => {
    setEditingData(editingData.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleDeleteDataPoint = (id: string) => {
    setEditingData(editingData.filter(item => item.id !== id));
  };

  const handleSaveData = () => {
    saveDataMutation.mutate(editingData);
  };

  // Initialize editing data
  React.useEffect(() => {
    if (analyticsData.length > 0) {
      setEditingData([...analyticsData]);
    } else {
      // Generate initial data from programs
      const programData: AnalyticsData[] = programs?.map(program => ({
        id: `program-${program.id}`,
        name: program.name,
        value: program.progress,
        category: program.type,
        date: program.startDate?.toString().split('T')[0] || new Date().toISOString().split('T')[0],
        metadata: {
          participants: program.participants,
          budget: program.budgetAllocated,
          status: program.status,
        }
      })) || [];
      setEditingData(programData);
    }
  }, [analyticsData, programs]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Analytics Control Center
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete control over analytics charts and data
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={activeTab === "charts" ? "default" : "outline"}
                onClick={() => setActiveTab("charts")}
              >
                Manage Charts
              </Button>
              <Button 
                variant={activeTab === "data" ? "default" : "outline"}
                onClick={() => setActiveTab("data")}
              >
                Edit Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "charts" ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Chart Management</h3>
                <Button onClick={handleCreateChart}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Chart
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chartConfigs.map((chart) => (
                  <Card key={chart.id} className="border-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {chart.type.toUpperCase()}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditChart(chart)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteChart(chart.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-sm">{chart.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div>Source: {chart.dataSource}</div>
                        <div>Program: {
                          chart.programId === "all" 
                            ? "All Programs" 
                            : programs?.find(p => p.id === chart.programId)?.name || "Unknown"
                        }</div>
                        <div>Metrics: {chart.metrics?.join(", ") || "None"}</div>
                        <div>Size: {chart.width} × {chart.height}</div>
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: chart.color }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {chartConfigs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No charts configured. Create your first chart to get started.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Analytics Data Editor</h3>
                <div className="flex gap-2">
                  <Button onClick={handleAddDataPoint} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Data Point
                  </Button>
                  <Button onClick={handleSaveData}>
                    Save Changes
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editingData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            value={item.name}
                            onChange={(e) => handleUpdateDataPoint(item.id, 'name', e.target.value)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.value}
                            onChange={(e) => handleUpdateDataPoint(item.id, 'value', Number(e.target.value))}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            value={item.category}
                            onChange={(e) => handleUpdateDataPoint(item.id, 'category', e.target.value)}
                            className="w-full p-2 border rounded"
                          >
                            <option value="CORE">CORE</option>
                            <option value="RIN">RIN</option>
                            <option value="AGUKA">AGUKA</option>
                            <option value="i-ACC">i-ACC</option>
                            <option value="MCF">MCF</option>
                            <option value="custom">Custom</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={item.date || ''}
                            onChange={(e) => handleUpdateDataPoint(item.id, 'date', e.target.value)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDataPoint(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {editingData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No data points configured. Add some data to get started.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart Creator Modal */}
      <ChartCreatorModal
        isOpen={showChartModal}
        onClose={() => setShowChartModal(false)}
        onSave={handleSaveChart}
        editingChart={editingChart}
      />

    </div>
  );
}

function ChartEditor({ 
  chart, 
  onSave, 
  onCancel,
  programs 
}: { 
  chart: ChartConfig;
  onSave: (chart: ChartConfig) => void;
  onCancel: () => void;
  programs?: Program[];
}) {
  const [config, setConfig] = useState<ChartConfig>(chart);

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
    { value: "custom", label: "Custom Data" },
  ];

  const AVAILABLE_METRICS = [
    { value: "progress", label: "Progress %" },
    { value: "participants", label: "Participants Count" },
    { value: "budgetAllocated", label: "Budget Allocated" },
    { value: "budgetUsed", label: "Budget Used" },
    { value: "budgetUtilization", label: "Budget Utilization %" },
    { value: "efficiency", label: "Efficiency Score" },
    { value: "status", label: "Status" },
    { value: "type", label: "Program Type" },
    { value: "startDate", label: "Start Date" },
    { value: "endDate", label: "End Date" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Chart Title</label>
          <Input
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            placeholder="Enter chart title"
            required
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Chart Type</label>
          <select
            value={config.type}
            onChange={(e) => setConfig({ ...config, type: e.target.value as any })}
            className="w-full p-2 border rounded"
          >
            {CHART_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Data Source</label>
          <select
            value={config.dataSource}
            onChange={(e) => setConfig({ ...config, dataSource: e.target.value })}
            className="w-full p-2 border rounded"
          >
            {DATA_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Chart Color</label>
          <Input
            type="color"
            value={config.color}
            onChange={(e) => setConfig({ ...config, color: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Program</label>
          <select
            value={config.programId || "all"}
            onChange={(e) => setConfig({ 
              ...config, 
              programId: e.target.value === "all" ? "all" : Number(e.target.value)
            })}
            className="w-full p-2 border rounded"
          >
            <option value="all">All Programs</option>
            {programs?.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Metrics to Display</label>
          <div className="max-h-32 overflow-y-auto border rounded p-2">
            {AVAILABLE_METRICS.map((metric) => (
              <label key={metric.value} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.metrics?.includes(metric.value) || false}
                  onChange={(e) => {
                    const currentMetrics = config.metrics || [];
                    if (e.target.checked) {
                      setConfig({
                        ...config,
                        metrics: [...currentMetrics, metric.value]
                      });
                    } else {
                      setConfig({
                        ...config,
                        metrics: currentMetrics.filter(m => m !== metric.value)
                      });
                    }
                  }}
                />
                <span>{metric.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Filters</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status Filter</label>
            <div className="space-y-1">
              {["active", "paused", "completed", "cancelled"].map((status) => (
                <label key={status} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.filters?.status?.includes(status) || false}
                    onChange={(e) => {
                      const currentStatuses = config.filters?.status || [];
                      const newFilters = { ...config.filters };
                      if (e.target.checked) {
                        newFilters.status = [...currentStatuses, status];
                      } else {
                        newFilters.status = currentStatuses.filter(s => s !== status);
                      }
                      setConfig({ ...config, filters: newFilters });
                    }}
                  />
                  <span className="capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type Filter</label>
            <div className="space-y-1">
              {["CORE", "RIN", "AGUKA", "i-ACC", "MCF"].map((type) => (
                <label key={type} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.filters?.type?.includes(type) || false}
                    onChange={(e) => {
                      const currentTypes = config.filters?.type || [];
                      const newFilters = { ...config.filters };
                      if (e.target.checked) {
                        newFilters.type = [...currentTypes, type];
                      } else {
                        newFilters.type = currentTypes.filter(t => t !== type);
                      }
                      setConfig({ ...config, filters: newFilters });
                    }}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="space-y-2">
              <Input
                type="date"
                placeholder="Start Date"
                value={config.filters?.dateRange?.start || ""}
                onChange={(e) => setConfig({
                  ...config,
                  filters: {
                    ...config.filters,
                    dateRange: {
                      ...config.filters?.dateRange,
                      start: e.target.value
                    }
                  }
                })}
              />
              <Input
                type="date"
                placeholder="End Date"
                value={config.filters?.dateRange?.end || ""}
                onChange={(e) => setConfig({
                  ...config,
                  filters: {
                    ...config.filters,
                    dateRange: {
                      ...config.filters?.dateRange,
                      end: e.target.value
                    }
                  }
                })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Width</label>
          <select
            value={config.width}
            onChange={(e) => setConfig({ ...config, width: e.target.value as any })}
            className="w-full p-2 border rounded"
          >
            <option value="half">Half Width</option>
            <option value="full">Full Width</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Height</label>
          <select
            value={config.height}
            onChange={(e) => setConfig({ ...config, height: e.target.value as any })}
            className="w-full p-2 border rounded"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={config.description || ""}
          onChange={(e) => setConfig({ ...config, description: e.target.value })}
          placeholder="Chart description"
          className="w-full p-2 border rounded h-20"
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Chart
        </Button>
      </div>
    </form>
  );
}

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("programs");
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("adminUser");
  });
  
  const { data: programs, isLoading } = usePrograms();
  const deleteProgram = useDeleteProgram();
  const { toast } = useToast();

  // Listen for admin navigation events from dropdown
  React.useEffect(() => {
    const handleTabSwitch = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    const handleCreateProgram = () => {
      setActiveTab("programs");
      setSelectedProgram(null);
      setFormOpen(true);
    };

    window.addEventListener('admin:switch-tab', handleTabSwitch);
    window.addEventListener('admin:create-program', handleCreateProgram);

    return () => {
      window.removeEventListener('admin:switch-tab', handleTabSwitch);
      window.removeEventListener('admin:create-program', handleCreateProgram);
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("adminUser");
      setIsLoggedIn(false);
      toast({ description: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("adminUser");
      setIsLoggedIn(false);
    }
  };

  if (!isLoggedIn) {
    return <EnhancedLoginForm onSuccess={handleLoginSuccess} />;
  }

  const filteredPrograms = programs?.filter(program =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (program: Program) => {
    setSelectedProgram(program);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this program?")) {
      try {
        await deleteProgram.mutateAsync(id);
        toast({ description: "Program deleted successfully" });
      } catch (error) {
        toast({ 
          variant: "destructive",
          description: "Failed to delete program" 
        });
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedProgram(null);
  };

  // Transform programs data for enhanced table
  const programTableData = programs?.map(program => ({
    id: program.id,
    name: program.name,
    type: program.type,
    description: program.description || "",
    status: program.status,
    progress: program.progress,
    participants: program.participants,
    budgetAllocated: program.budgetAllocated || 0,
    budgetUsed: program.budgetUsed || 0,
    color: program.color,
    image: program.imageUrl || program.image || "",
    category: program.category || "",
    priority: program.priority || "medium",
    startDate: program.startDate,
    endDate: program.endDate,
  })) || [];

  const customTableActions = [
    {
      label: "View",
      icon: Activity,
      onClick: (row: any) => {
        const program = programs?.find(p => p.id === row.id);
        if (program) handleEdit(program);
      },
      variant: "outline" as const,
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage programs and system configurations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Program
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Programs</p>
                  <p className="text-2xl font-bold">{programs?.length || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Programs</p>
                  <p className="text-2xl font-bold">
                    {programs?.filter(p => p.status === 'active').length || 0}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                  <p className="text-2xl font-bold">
                    {programs?.reduce((sum, p) => sum + (p.participants || 0), 0) || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(programs?.reduce((sum, p) => sum + (p.budgetAllocated || 0), 0) || 0)}
                  </p>
                </div>
                <Database className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="table-builder">Table Builder</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Programs Tab */}
          <TabsContent value="programs" className="space-y-6">
            {/* Search */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Programs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Program Management</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Timeline</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPrograms.map((program) => (
                        <TableRow key={program.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {(program.imageUrl || program.image) ? (
                                <img 
                                  src={program.imageUrl || program.image || ""} 
                                  alt={program.name}
                                  className="w-10 h-10 object-cover rounded-lg"
                                />
                              ) : (
                                <div 
                                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: program.color }}
                                >
                                  <Image className="h-5 w-5 text-white" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{program.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {program.description ? program.description.substring(0, 50) + "..." : "No description"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{program.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={program.status === 'active' ? 'default' : 'secondary'}
                            >
                              {program.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${program.progress}%`,
                                    backgroundColor: program.color 
                                  }}
                                />
                              </div>
                              <span className="text-sm">{program.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {program.participants}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatCurrency(program.budgetUsed || 0)}</div>
                              <div className="text-muted-foreground">
                                of {formatCurrency(program.budgetAllocated || 0)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {program.startDate ? formatDate(program.startDate) : "TBD"} - 
                              {program.endDate ? formatDate(program.endDate) : "TBD"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEdit(program)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(program.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Table Builder Tab */}
          <TabsContent value="table-builder" className="space-y-6">
            <EnhancedTableBuilder />
          </TabsContent>

          {/* Analytics Control Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsAdminPanel programs={programs} />
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search activities..."
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-muted-foreground">
                            No activity logs available
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search users..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-muted-foreground">
                            No users found
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <ColumnHeaderManager />
          </TabsContent>
        </Tabs>

        {/* Program Form Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedProgram ? (
                  <>
                    <Edit className="h-5 w-5" />
                    Edit Program: {selectedProgram.name}
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Create New Program
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <ProgramForm program={selectedProgram} onClose={handleFormClose} />
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}