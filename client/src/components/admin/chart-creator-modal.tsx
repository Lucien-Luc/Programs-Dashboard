import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { programsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "recharts";
import { ChartBar, Eye, Sparkles } from "lucide-react";
import type { Program } from "@shared/schema";

interface ChartConfig {
  id: string;
  title: string;
  type: "bar" | "line" | "pie" | "area";
  dataSource: string;
  programId: string;
  color: string;
  width: "full" | "half";
  height: "small" | "medium" | "large";
  description?: string;
}

interface ChartCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (chart: ChartConfig) => void;
  editingChart?: ChartConfig | null;
}

const CHART_TYPES = [
  {
    id: "bar",
    name: "Column Chart",
    icon: "📊",
    description: "Compare values across categories",
    subtypes: [
      { id: "clustered", name: "Clustered Column", preview: "Basic vertical bars" },
      { id: "stacked", name: "Stacked Column", preview: "Stacked data series" },
    ]
  },
  {
    id: "line",
    name: "Line Chart",
    icon: "📈",
    description: "Show trends over time",
    subtypes: [
      { id: "line", name: "Line", preview: "Basic line chart" },
      { id: "smooth", name: "Smooth Line", preview: "Curved line connections" },
    ]
  },
  {
    id: "pie",
    name: "Pie Chart",
    icon: "🍰",
    description: "Show proportion of parts to whole",
    subtypes: [
      { id: "pie", name: "Pie", preview: "Classic pie chart" },
      { id: "doughnut", name: "Doughnut", preview: "Pie with center hole" },
    ]
  },
  {
    id: "area",
    name: "Area Chart",
    icon: "🌄",
    description: "Show volume and trends",
    subtypes: [
      { id: "area", name: "Area", preview: "Filled area under line" },
      { id: "stacked", name: "Stacked Area", preview: "Multiple stacked areas" },
    ]
  }
];

const DATA_SOURCES = [
  { id: "progress", name: "Progress Analysis", description: "Track program completion progress" },
  { id: "budget", name: "Budget Utilization", description: "Monitor allocated vs used budget" },
  { id: "participants", name: "Participant Growth", description: "Analyze participant numbers over time" },
  { id: "status", name: "Status Distribution", description: "View program status breakdown" },
  { id: "performance", name: "Performance Metrics", description: "Overall program performance scores" },
];

const CHART_COLORS = [
  { value: "#3b82f6", name: "Blue", class: "bg-blue-500" },
  { value: "#10b981", name: "Green", class: "bg-emerald-500" },
  { value: "#f59e0b", name: "Amber", class: "bg-amber-500" },
  { value: "#ef4444", name: "Red", class: "bg-red-500" },
  { value: "#8b5cf6", name: "Purple", class: "bg-violet-500" },
  { value: "#06b6d4", name: "Cyan", class: "bg-cyan-500" },
];

const SAMPLE_DATA = [
  { name: "Q1", value: 75, value2: 85 },
  { name: "Q2", value: 82, value2: 90 },
  { name: "Q3", value: 89, value2: 88 },
  { name: "Q4", value: 94, value2: 95 },
];

export function ChartCreatorModal({ isOpen, onClose, onSave, editingChart }: ChartCreatorModalProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSubtype, setSelectedSubtype] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedDataSource, setSelectedDataSource] = useState<string>("");
  const [chartTitle, setChartTitle] = useState<string>("");
  const [chartDescription, setChartDescription] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>(CHART_COLORS[0].value);
  const [chartSize, setChartSize] = useState<{ width: "full" | "half"; height: "small" | "medium" | "large" }>({
    width: "half",
    height: "medium"
  });

  // Fetch programs from Firestore
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["programs"],
    queryFn: () => programsApi.getAll(),
  });

  // Initialize form when editing
  useEffect(() => {
    if (editingChart) {
      setSelectedType(editingChart.type);
      setSelectedProgram(editingChart.programId);
      setSelectedDataSource(editingChart.dataSource);
      setChartTitle(editingChart.title);
      setChartDescription(editingChart.description || "");
      setSelectedColor(editingChart.color);
      setChartSize({ width: editingChart.width, height: editingChart.height });
    }
  }, [editingChart]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedType("");
      setSelectedSubtype("");
      setSelectedProgram("");
      setSelectedDataSource("");
      setChartTitle("");
      setChartDescription("");
      setSelectedColor(CHART_COLORS[0].value);
      setChartSize({ width: "half", height: "medium" });
    }
  }, [isOpen]);

  const selectedChartType = CHART_TYPES.find(type => type.id === selectedType);
  const selectedProgamData = programs.find(p => p.id === selectedProgram);

  const renderChartPreview = () => {
    if (!selectedType) {
      return (
        <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <ChartBar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">Select a chart type</p>
            <p className="text-sm">Choose from the chart types on the left</p>
          </div>
        </div>
      );
    }

    const data = SAMPLE_DATA;

    switch (selectedType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Bar dataKey="value" fill={selectedColor} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Line 
                type={selectedSubtype === "smooth" ? "monotone" : "linear"}
                dataKey="value" 
                stroke={selectedColor} 
                strokeWidth={3}
                dot={{ fill: selectedColor, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: selectedColor, strokeWidth: 2, fill: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={selectedSubtype === "doughnut" ? 80 : 90}
                innerRadius={selectedSubtype === "doughnut" ? 45 : 0}
                fill={selectedColor}
                stroke="white"
                strokeWidth={2}
              >
                {data.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length].value} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={selectedColor} 
                fill={selectedColor}
                fillOpacity={0.3}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const handleSave = () => {
    if (!selectedType || !selectedProgram || !selectedDataSource || !chartTitle) {
      return;
    }

    const chartConfig: ChartConfig = {
      id: editingChart?.id || Date.now().toString(),
      title: chartTitle,
      type: selectedType as "bar" | "line" | "pie" | "area",
      dataSource: selectedDataSource,
      programId: selectedProgram,
      color: selectedColor,
      width: chartSize.width,
      height: chartSize.height,
      description: chartDescription || undefined,
    };

    onSave(chartConfig);
    onClose();
  };

  const isValid = selectedType && selectedProgram && selectedDataSource && chartTitle;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ChartBar className="w-5 h-5 text-blue-600" />
            </div>
            {editingChart ? "Edit Chart" : "Insert Chart"}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Create professional charts for program data visualization
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Left Panel - Chart Types */}
            <div className="col-span-3 overflow-y-auto pr-2">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold text-gray-900">Chart Types</Label>
                  <p className="text-xs text-gray-500 mb-3">Choose how to display your data</p>
                </div>
                
                {CHART_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      setSelectedSubtype(type.subtypes[0].id);
                    }}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all hover:shadow-md group ${
                      selectedType === type.id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {type.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Middle Panel - Configuration */}
            <div className="col-span-4 overflow-y-auto px-2">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-900">Configuration</Label>
                  <p className="text-xs text-gray-500 mb-4">Set up your chart details</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="program-select" className="text-sm font-medium">Target Program</Label>
                    <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: program.color }}
                              />
                              {program.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="data-source-select" className="text-sm font-medium">Data Source</Label>
                    <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose data to visualize" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_SOURCES.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            <div>
                              <div className="font-medium">{source.name}</div>
                              <div className="text-xs text-gray-500">{source.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="chart-title" className="text-sm font-medium">Chart Title</Label>
                    <Input
                      id="chart-title"
                      value={chartTitle}
                      onChange={(e) => setChartTitle(e.target.value)}
                      placeholder="Enter descriptive title"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Chart Color</Label>
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      {CHART_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSelectedColor(color.value)}
                          className={`w-8 h-8 rounded-lg ${color.class} transition-all hover:scale-110 ${
                            selectedColor === color.value 
                              ? "ring-2 ring-offset-2 ring-gray-400" 
                              : ""
                          }`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Width</Label>
                      <Select value={chartSize.width} onValueChange={(value: "full" | "half") => setChartSize(prev => ({ ...prev, width: value }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="half">Half Width</SelectItem>
                          <SelectItem value="full">Full Width</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Height</Label>
                      <Select value={chartSize.height} onValueChange={(value: "small" | "medium" | "large") => setChartSize(prev => ({ ...prev, height: value }))}>
                        <SelectTrigger className="mt-1">
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
                </div>

                {selectedProgamData && selectedDataSource && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Chart Preview</span>
                    </div>
                    <div className="text-xs text-blue-700">
                      <div>Program: {selectedProgamData.name}</div>
                      <div>Data: {DATA_SOURCES.find(ds => ds.id === selectedDataSource)?.name}</div>
                      <div>Type: {selectedChartType?.name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="col-span-5 overflow-y-auto pl-2">
              <div>
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Live Preview
                </Label>
                <p className="text-xs text-gray-500 mb-4">See how your chart will look</p>
              </div>
              
              <Card className="border-2 border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-gray-900">
                    {chartTitle || "Chart Title"}
                  </CardTitle>
                  {chartDescription && (
                    <p className="text-sm text-gray-600">{chartDescription}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-white rounded-lg">
                    {renderChartPreview()}
                  </div>
                </CardContent>
              </Card>

              {selectedType && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 mb-2">Chart Details</div>
                    <div className="space-y-1 text-gray-600">
                      <div>Type: {selectedChartType?.name}</div>
                      <div>Size: {chartSize.width} width, {chartSize.height} height</div>
                      <div>Color: {CHART_COLORS.find(c => c.value === selectedColor)?.name}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {editingChart ? "Update Chart" : "Insert Chart"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}