import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity, Target, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Program } from "@shared/schema";
import { programsApi } from "@/lib/api";

interface ChartConfig {
  id: string;
  title: string;
  type: string;
  subtype: string;
  programId: string;
  dataSource: string;
  config: {
    colors: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    animationDuration?: number;
    insights?: {
      showTrend?: boolean;
      showAverage?: boolean;
      showPeakPoints?: boolean;
      showComparison?: boolean;
    };
    timeRange?: {
      start?: Date;
      end?: Date;
      interval?: string;
    };
  };
}

interface ChartCreatorProps {
  onSave: (chartConfig: ChartConfig) => void;
}

const CHART_TYPES = [
  {
    id: "column",
    name: "Column",
    icon: BarChart3,
    subtypes: [
      { id: "clustered", name: "Clustered Column", description: "Compare values across categories" },
      { id: "stacked", name: "Stacked Column", description: "Show parts of a whole" },
      { id: "100-stacked", name: "100% Stacked Column", description: "Show proportional relationships" },
    ]
  },
  {
    id: "line",
    name: "Line",
    icon: TrendingUp,
    subtypes: [
      { id: "line", name: "Line", description: "Show trends over time" },
      { id: "smooth", name: "Smooth Line", description: "Show smooth trend progression" },
      { id: "stepped", name: "Stepped Line", description: "Show discrete value changes" },
    ]
  },
  {
    id: "pie",
    name: "Pie",
    icon: PieChartIcon,
    subtypes: [
      { id: "pie", name: "Pie", description: "Show proportional data" },
      { id: "doughnut", name: "Doughnut", description: "Highlight total value" },
    ]
  },
  {
    id: "bar",
    name: "Bar",
    icon: BarChart3,
    subtypes: [
      { id: "clustered", name: "Clustered Bar", description: "Compare values horizontally" },
      { id: "stacked", name: "Stacked Bar", description: "Show parts horizontally" },
    ]
  },
  {
    id: "area",
    name: "Area",
    icon: Activity,
    subtypes: [
      { id: "area", name: "Area", description: "Show volume over time" },
      { id: "stacked", name: "Stacked Area", description: "Show cumulative values" },
    ]
  },
  {
    id: "scatter",
    name: "Scatter",
    icon: Target,
    subtypes: [
      { id: "scatter", name: "Scatter", description: "Show correlation between variables" },
      { id: "bubble", name: "Bubble", description: "Show three-dimensional data" },
    ]
  }
];

const DATA_SOURCES = [
  {
    id: "progress",
    name: "Progress Tracking",
    description: "Monitor program completion rates and milestones",
    icon: TrendingUp,
    color: "bg-blue-500"
  },
  {
    id: "budget",
    name: "Budget Analysis",
    description: "Track allocated vs. used budget across programs",
    icon: Target,
    color: "bg-green-500"
  },
  {
    id: "participants",
    name: "Participant Metrics",
    description: "Analyze participant engagement and growth",
    icon: Activity,
    color: "bg-purple-500"
  },
  {
    id: "status",
    name: "Status Distribution",
    description: "View program status breakdown and completion rates",
    icon: BarChart3,
    color: "bg-orange-500"
  },
  {
    id: "category",
    name: "Category Performance",
    description: "Compare performance across different program categories",
    icon: PieChartIcon,
    color: "bg-pink-500"
  },
  {
    id: "performance",
    name: "Performance Metrics",
    description: "Comprehensive performance analysis with KPIs",
    icon: TrendingUp,
    color: "bg-indigo-500"
  },
  {
    id: "multi-program",
    name: "Multi-Program Comparison",
    description: "Side-by-side comparison of multiple programs",
    icon: BarChart3,
    color: "bg-teal-500"
  },
  {
    id: "trend-forecast",
    name: "Trend Forecast",
    description: "Predictive analysis with trend projections",
    icon: TrendingUp,
    color: "bg-cyan-500"
  },
  {
    id: "roi-analysis",
    name: "ROI Analysis",
    description: "Return on investment calculations and insights",
    icon: Target,
    color: "bg-emerald-500"
  },
  {
    id: "timeline",
    name: "Timeline Analytics",
    description: "Time-based analysis with milestone tracking",
    icon: Calendar,
    color: "bg-amber-500"
  }
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export function ChartCreator({ onSave }: ChartCreatorProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSubtype, setSelectedSubtype] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedDataSource, setSelectedDataSource] = useState<string>("");
  const [chartTitle, setChartTitle] = useState<string>("");
  const [showInsights, setShowInsights] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [timeRange, setTimeRange] = useState("last30days");

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["programs"],
    queryFn: () => programsApi.getAll(),
  });

  const selectedChartType = CHART_TYPES.find(type => type.id === selectedType);
  const selectedChartSubtype = selectedChartType?.subtypes.find(subtype => subtype.id === selectedSubtype);

  const generateChartData = () => {
    const filteredPrograms = selectedProgram === "all" 
      ? programs 
      : programs.filter(p => p.id === selectedProgram);

    if (!filteredPrograms.length) return [];

    switch (selectedDataSource) {
      case "progress":
        return filteredPrograms.map(p => ({
          name: p.name,
          value: p.progress,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }));
      case "budget":
        return filteredPrograms.map(p => ({
          name: p.name,
          allocated: p.budgetAllocated || 0,
          used: p.budgetUsed || 0,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }));
      case "participants":
        return filteredPrograms.map(p => ({
          name: p.name,
          value: p.participants,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }));
      case "status":
        const statusCount = filteredPrograms.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        return Object.entries(statusCount).map(([status, count]) => ({
          name: status,
          value: count,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }));
      default:
        return filteredPrograms.map(p => ({
          name: p.name,
          value: Math.floor(Math.random() * 100),
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        }));
    }
  };

  const renderChart = () => {
    const data = generateChartData();
    if (!data.length) return null;

    const commonProps = {
      width: 300,
      height: 200,
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (selectedType) {
      case "column":
      case "bar":
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">Select a chart type to preview</div>;
    }
  };

  const handleSave = () => {
    const chartConfig: ChartConfig = {
      id: Date.now().toString(),
      title: chartTitle,
      type: selectedType,
      subtype: selectedSubtype,
      programId: selectedProgram,
      dataSource: selectedDataSource,
      config: {
        colors: COLORS,
        showLegend: true,
        showGrid: true,
        showTooltip: true,
        animationDuration: 500,
        insights: {
          showTrend: showInsights,
          showAverage: showInsights,
          showPeakPoints: showInsights,
          showComparison: showComparison,
        },
        timeRange: {
          interval: timeRange,
        },
      },
    };

    onSave(chartConfig);
    
    // Reset form
    setSelectedType("");
    setSelectedSubtype("");
    setSelectedProgram("");
    setSelectedDataSource("");
    setChartTitle("");
  };

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Insert Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Chart Types */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Chart Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {CHART_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      setSelectedSubtype("");
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <type.icon className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedChartType && (
              <div>
                <Label className="text-sm font-medium mb-3 block">Chart Subtype</Label>
                <div className="space-y-2">
                  {selectedChartType.subtypes.map((subtype) => (
                    <button
                      key={subtype.id}
                      onClick={() => setSelectedSubtype(subtype.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        selectedSubtype === subtype.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{subtype.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{subtype.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle Panel - Configuration */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="chartTitle" className="text-sm font-medium">Chart Title</Label>
              <Input
                id="chartTitle"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                placeholder="Enter chart title"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Target Program</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs Combined</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Data Source</Label>
              <div className="space-y-2">
                {DATA_SOURCES.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => setSelectedDataSource(source.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedDataSource === source.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${source.color} flex items-center justify-center`}>
                        <source.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{source.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{source.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Insights & Analytics</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Show Insights</div>
                      <div className="text-xs text-gray-600">Display trend analysis and key metrics</div>
                    </div>
                    <Switch checked={showInsights} onCheckedChange={setShowInsights} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Comparison Mode</div>
                      <div className="text-xs text-gray-600">Enable side-by-side comparisons</div>
                    </div>
                    <Switch checked={showComparison} onCheckedChange={setShowComparison} />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Time Range</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7days">Last 7 days</SelectItem>
                    <SelectItem value="last30days">Last 30 days</SelectItem>
                    <SelectItem value="last90days">Last 90 days</SelectItem>
                    <SelectItem value="last1year">Last 1 year</SelectItem>
                    <SelectItem value="alltime">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Live Preview</Label>
              <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px]">
                {selectedType && selectedSubtype && selectedProgram && selectedDataSource ? (
                  <div className="space-y-3">
                    {chartTitle && (
                      <h3 className="text-lg font-semibold text-center">{chartTitle}</h3>
                    )}
                    {renderChart()}
                    {showInsights && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900">Insights Enabled</div>
                        <div className="text-xs text-blue-700 mt-1">
                          Trend analysis and key metrics will be displayed with this chart.
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">
                        Select chart type, program, and data source to see preview
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!selectedType || !selectedSubtype || !selectedProgram || !selectedDataSource || !chartTitle}
                className="flex-1"
              >
                Insert Chart
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}