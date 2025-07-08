import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { ProgramForm } from "@/components/admin/program-form";
import { EnhancedTableBuilder } from "@/components/admin/enhanced-table-builder";
import { ColumnHeaderManager } from "@/components/admin/column-header-manager";
import { ChartCreatorModal } from "@/components/admin/chart-creator-modal";
import { EnhancedLoginForm } from "@/components/enhanced-login-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Plus, Edit, Trash2, Search, Activity, RefreshCw, BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { usePrograms, useDeleteProgram } from "@/hooks/use-programs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Program } from "@shared/schema";
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
    const combinedData = [...analyticsData, ...editingData];
    saveDataMutation.mutate(combinedData);
    setEditingData([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-xl border border-white/20 shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Analytics Control Center
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Complete control over analytics charts and data visualization
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant={activeTab === "charts" ? "default" : "outline"}
                onClick={() => setActiveTab("charts")}
                className={activeTab === "charts" 
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" 
                  : "bg-white/60 dark:bg-gray-800/60 hover:bg-white/90 dark:hover:bg-gray-700/90 border-white/30 shadow-md hover:shadow-lg transition-all duration-200"
                }
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Manage Charts
              </Button>
              <Button 
                variant={activeTab === "data" ? "default" : "outline"}
                onClick={() => setActiveTab("data")}
                className={activeTab === "data" 
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg" 
                  : "bg-white/60 dark:bg-gray-800/60 hover:bg-white/90 dark:hover:bg-gray-700/90 border-white/30 shadow-md hover:shadow-lg transition-all duration-200"
                }
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Edit Data
              </Button>
            </div>
          </div>
          {activeTab === "charts" ? (
            <div className="space-y-6">
              <div className="bg-white/40 dark:bg-gray-800/40 rounded-lg p-4 border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chart Management</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Create and manage analytics charts</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleCreateChart}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Chart
                  </Button>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chartConfigs.map((chart) => (
                  <Card key={chart.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{chart.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {chart.description || "No description"}
                          </p>
                        </div>
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
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Data Source:</span>
                          <span className="font-medium">{chart.dataSource}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Size:</span>
                          <span className="font-medium">{chart.width} × {chart.height}</span>
                        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Enhanced Header Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Complete system management and analytics control
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline" className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    System Online
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 shadow-sm">
                    {programs?.length || 0} Programs
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="bg-white/60 dark:bg-gray-800/60 hover:bg-white/90 dark:hover:bg-gray-700/90 border-white/30 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => setFormOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Program
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 shadow-lg"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Admin Tabs */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-100/80 dark:bg-gray-700/80 p-1 rounded-xl shadow-inner">
              <TabsTrigger 
                value="programs" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-medium"
              >
                <Activity className="w-4 h-4 mr-2" />
                Programs
              </TabsTrigger>
              <TabsTrigger 
                value="table-builder"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-medium"
              >
                <Settings className="w-4 h-4 mr-2" />
                Table Builder
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-medium"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="column-headers"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600 data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-medium"
              >
                <Settings className="w-4 h-4 mr-2" />
                Column Headers
              </TabsTrigger>
            </TabsList>

            {/* Enhanced Programs Tab */}
            <TabsContent value="programs" className="space-y-6 mt-6">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 border border-white/30 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Program Management</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Create, edit, and manage all system programs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {programs?.length || 0} Total
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search programs by name, type, or status..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/80 dark:bg-gray-700/80 border-white/30 shadow-sm focus:shadow-lg transition-shadow duration-200"
                    />
                  </div>
                  <Button 
                    onClick={() => setFormOpen(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Program
                  </Button>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">Loading programs...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPrograms.map((program) => (
                      <Card 
                        key={program.id} 
                        className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-white/30 shadow-lg"
                      >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{program.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {program.description || "No description"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {program.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={program.status === "active" ? "default" : "secondary"}>
                            {program.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="font-medium">{program.progress}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Participants:</span>
                          <span className="font-medium">{program.participants}</span>
                        </div>
                        <div className="flex gap-2 pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(program)}
                            className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:shadow-md transition-all duration-200"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(program.id)}
                            className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 hover:shadow-md transition-all duration-200"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                    ))}
                  </div>
                )}

                {filteredPrograms.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No programs found</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Create your first program to get started with the system.
                    </p>
                    <Button 
                      onClick={() => setFormOpen(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Program
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Enhanced Table Builder Tab */}
            <TabsContent value="table-builder" className="space-y-6 mt-6">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 border border-white/30 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Table Builder</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Design and configure dynamic data tables</p>
                  </div>
                </div>
                <EnhancedTableBuilder />
              </div>
            </TabsContent>

            {/* Enhanced Analytics Control Tab */}
            <TabsContent value="analytics" className="space-y-6 mt-6">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 border border-white/30 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics Control Center</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Manage charts, data sources, and analytics configuration</p>
                  </div>
                </div>
                <AnalyticsAdminPanel programs={programs} />
              </div>
            </TabsContent>

            {/* Enhanced Column Headers Tab */}
            <TabsContent value="column-headers" className="space-y-6 mt-6">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 border border-white/30 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Column Header Manager</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Configure table columns, visibility, and display options</p>
                  </div>
                </div>
                <ColumnHeaderManager />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Program Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProgram ? "Edit Program" : "Create New Program"}
            </DialogTitle>
          </DialogHeader>
          <ProgramForm
            program={selectedProgram}
            onClose={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}