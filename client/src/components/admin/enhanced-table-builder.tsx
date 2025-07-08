import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Settings, 
  ArrowUp, 
  ArrowDown, 
  MoreHorizontal,
  Eye,
  EyeOff,
  Save,
  Upload
} from "lucide-react";
import type { Program } from "@shared/schema";

interface TableColumn {
  key: string;
  displayName: string;
  dataType: 'text' | 'number' | 'date' | 'status' | 'image' | 'actions' | 'color' | 'progress';
  isVisible: boolean;
  isEditable: boolean;
  sortOrder: number;
  width?: number;
  alignment: 'left' | 'center' | 'right';
  formatOptions?: any;
  validationRules?: any;
}

interface TableRow {
  id: string | number;
  [key: string]: any;
}

interface EnhancedTableProps {
  tableName: string;
  data: TableRow[];
  onDataChange?: (data: TableRow[]) => void;
  onEdit?: (row: TableRow) => void;
  onDelete?: (id: string | number) => void;
  customActions?: Array<{
    label: string;
    icon?: any;
    onClick: (row: TableRow) => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
}

const columnSchema = z.object({
  key: z.string().min(1, "Column key is required"),
  displayName: z.string().min(1, "Display name is required"),
  dataType: z.enum(['text', 'number', 'date', 'status', 'image', 'actions', 'color', 'progress']),
  isVisible: z.boolean().default(true),
  isEditable: z.boolean().default(true),
  sortOrder: z.number().default(0),
  width: z.number().optional(),
  alignment: z.enum(['left', 'center', 'right']).default('left'),
});

export function EnhancedTableBuilder({ 
  tableName, 
  data, 
  onDataChange, 
  onEdit, 
  onDelete,
  customActions = []
}: EnhancedTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [editingCell, setEditingCell] = useState<{row: number, col: string} | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  // Fetch table column configuration
  const { data: columnConfig } = useQuery({
    queryKey: ['/api/table-columns', tableName],
    queryFn: async () => {
      const response = await fetch(`/api/table-columns/${tableName}`);
      if (response.ok) {
        return response.json();
      }
      return [];
    },
  });

  // Save column configuration
  const saveColumnConfig = useMutation({
    mutationFn: async (config: TableColumn) => {
      const response = await fetch('/api/table-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          columnKey: config.key,
          displayName: config.displayName,
          dataType: config.dataType,
          isVisible: config.isVisible,
          isEditable: config.isEditable,
          sortOrder: config.sortOrder,
          width: config.width,
          alignment: config.alignment,
          formatOptions: config.formatOptions,
          validationRules: config.validationRules,
        }),
      });
      if (!response.ok) throw new Error('Failed to save column configuration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/table-columns', tableName] });
      toast({ description: "Column configuration saved successfully" });
    },
  });

  const columnForm = useForm({
    resolver: zodResolver(columnSchema),
    defaultValues: {
      key: "",
      displayName: "",
      dataType: "text" as const,
      isVisible: true,
      isEditable: true,
      sortOrder: 0,
      width: undefined,
      alignment: "left" as const,
    },
  });

  useEffect(() => {
    if (columnConfig && columnConfig.length > 0) {
      setColumns(columnConfig.sort((a: any, b: any) => a.sortOrder - b.sortOrder));
    } else if (data && data.length > 0) {
      // Auto-generate columns from data
      const sampleRow = data[0];
      const autoColumns: TableColumn[] = Object.keys(sampleRow).map((key, index) => ({
        key,
        displayName: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        dataType: inferDataType(sampleRow[key]),
        isVisible: true,
        isEditable: key !== 'id',
        sortOrder: index,
        alignment: 'left' as const,
      }));
      setColumns(autoColumns);
    }
  }, [columnConfig, data]);

  function inferDataType(value: any): TableColumn['dataType'] {
    if (typeof value === 'number') return 'number';
    if (value instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    if (typeof value === 'string' && (value.includes('#') || /^(active|inactive|pending|completed)$/i.test(value))) return 'status';
    if (typeof value === 'string' && /^https?:\/\/.*\.(jpg|jpeg|png|gif)$/i.test(value)) return 'image';
    return 'text';
  }

  const handleSort = (columnKey: string) => {
    const direction = sortConfig?.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key: columnKey, direction });
  };

  const sortedData = sortConfig ? [...data].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal === bVal) return 0;
    
    const comparison = aVal < bVal ? -1 : 1;
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  }) : data;

  const handleCellEdit = (rowIndex: number, columnKey: string, value: any) => {
    setEditingCell({ row: rowIndex, col: columnKey });
    setEditValue(String(value || ""));
  };

  const handleCellSave = () => {
    if (!editingCell || !onDataChange) return;
    
    const newData = [...data];
    newData[editingCell.row] = {
      ...newData[editingCell.row],
      [editingCell.col]: editValue
    };
    
    onDataChange(newData);
    setEditingCell(null);
    setEditValue("");
    toast({ description: "Cell updated successfully" });
  };

  const addNewColumn = (columnData: z.infer<typeof columnSchema>) => {
    const newColumn: TableColumn = {
      ...columnData,
      sortOrder: columns.length,
    };
    
    saveColumnConfig.mutate(newColumn);
    setColumns([...columns, newColumn]);
    columnForm.reset();
  };

  const toggleColumnVisibility = (columnKey: string) => {
    const updatedColumns = columns.map(col => 
      col.key === columnKey ? { ...col, isVisible: !col.isVisible } : col
    );
    setColumns(updatedColumns);
    
    const column = updatedColumns.find(col => col.key === columnKey);
    if (column) {
      saveColumnConfig.mutate(column);
    }
  };

  const moveColumn = (columnKey: string, direction: 'up' | 'down') => {
    const currentIndex = columns.findIndex(col => col.key === columnKey);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;
    
    const newColumns = [...columns];
    [newColumns[currentIndex], newColumns[newIndex]] = [newColumns[newIndex], newColumns[currentIndex]];
    
    // Update sort orders
    newColumns.forEach((col, index) => {
      col.sortOrder = index;
      saveColumnConfig.mutate(col);
    });
    
    setColumns(newColumns);
  };

  const renderCellContent = (row: TableRow, column: TableColumn, rowIndex: number) => {
    const value = row[column.key];
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === column.key;

    if (isEditing && column.isEditable) {
      return (
        <div className="flex gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="h-8"
            autoFocus
          />
          <Button size="sm" onClick={handleCellSave}>
            <Save className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    switch (column.dataType) {
      case 'image':
        return value ? (
          <img src={value} alt="Preview" className="w-12 h-12 object-cover rounded" />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
            <Upload className="h-4 w-4 text-gray-400" />
          </div>
        );
      
      case 'status':
        return (
          <Badge variant={getStatusVariant(value)}>
            {value}
          </Badge>
        );
      
      case 'color':
        return (
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: value }}
            />
            <span>{value}</span>
          </div>
        );
      
      case 'progress':
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-sm">{value}%</span>
          </div>
        );
      
      case 'actions':
        return (
          <div className="flex gap-1">
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(row)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(row.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            {customActions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant || "outline"}
                onClick={() => action.onClick(row)}
              >
                {action.icon && <action.icon className="h-3 w-3" />}
                {action.label}
              </Button>
            ))}
          </div>
        );
      
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      
      default:
        return (
          <div
            className={column.isEditable ? "cursor-pointer hover:bg-gray-50 p-1 rounded" : ""}
            onClick={() => column.isEditable && handleCellEdit(rowIndex, column.key, value)}
          >
            {value}
          </div>
        );
    }
  };

  function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status?.toLowerCase()) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  }

  const visibleColumns = columns.filter(col => col.isVisible);

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Enhanced {tableName} Table</h3>
        <div className="flex gap-2">
          <Dialog open={showColumnConfig} onOpenChange={setShowColumnConfig}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure Columns
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Table Column Configuration</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Add New Column Form */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Add New Column</h4>
                  <form onSubmit={columnForm.handleSubmit(addNewColumn)} className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Column Key</Label>
                      <Input {...columnForm.register("key")} placeholder="e.g., customField" />
                    </div>
                    <div>
                      <Label>Display Name</Label>
                      <Input {...columnForm.register("displayName")} placeholder="e.g., Custom Field" />
                    </div>
                    <div>
                      <Label>Data Type</Label>
                      <Select onValueChange={(value: any) => columnForm.setValue("dataType", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select data type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="color">Color</SelectItem>
                          <SelectItem value="progress">Progress</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Alignment</Label>
                      <Select onValueChange={(value: any) => columnForm.setValue("alignment", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select alignment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Button type="submit">Add Column</Button>
                    </div>
                  </form>
                </div>

                {/* Existing Columns */}
                <div>
                  <h4 className="font-medium mb-4">Existing Columns</h4>
                  <div className="space-y-2">
                    {columns.map((column) => (
                      <div key={column.key} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="font-medium">{column.displayName}</span>
                            <span className="text-sm text-gray-500 ml-2">({column.key})</span>
                          </div>
                          <Badge variant="outline">{column.dataType}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleColumnVisibility(column.key)}
                          >
                            {column.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveColumn(column.key, 'up')}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveColumn(column.key, 'down')}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={`cursor-pointer hover:bg-gray-50 text-${column.alignment}`}
                  style={{ width: column.width ? `${column.width}px` : 'auto' }}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.displayName}
                    {sortConfig?.key === column.key && (
                      sortConfig.direction === 'asc' ? 
                      <ArrowUp className="h-3 w-3" /> : 
                      <ArrowDown className="h-3 w-3" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, rowIndex) => (
              <TableRow key={row.id || rowIndex}>
                {visibleColumns.map((column) => (
                  <TableCell 
                    key={column.key}
                    className={`text-${column.alignment}`}
                  >
                    {renderCellContent(row, column, rowIndex)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No data available. Add some records to see them here.
        </div>
      )}
    </div>
  );
}