import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Save, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'date' | 'status' | 'actions';
}

interface TableData {
  [key: string]: any;
}

interface TableConfig {
  id: number;
  tableName: string;
  columns: TableColumn[];
  data: TableData[];
  updatedAt: Date;
}

const columnTypes = [
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'status', label: 'Status' },
  { value: 'actions', label: 'Actions' },
];

const statusOptions = [
  'COMPLETED',
  'IN PROGRESS', 
  'SCHEDULED',
  'PENDING',
  'CANCELLED'
];

export function TableBuilder() {
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [data, setData] = useState<TableData[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingColumn, setEditingColumn] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tableConfig, isLoading } = useQuery<TableConfig>({
    queryKey: ["/api/table-config/recent_activity"],
  });

  const updateTableConfig = useMutation({
    mutationFn: async (config: { tableName: string; columns: TableColumn[]; data: TableData[] }) => {
      const response = await apiRequest("POST", "/api/table-config", config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/table-config/recent_activity"] });
      toast({ description: "Table configuration saved successfully" });
    },
    onError: () => {
      toast({ 
        variant: "destructive",
        description: "Failed to save table configuration" 
      });
    },
  });

  useEffect(() => {
    if (tableConfig) {
      setColumns(tableConfig.columns);
      setData(tableConfig.data);
    }
  }, [tableConfig]);

  const addColumn = () => {
    const newColumn: TableColumn = {
      key: `column_${Date.now()}`,
      label: 'New Column',
      type: 'text'
    };
    setColumns([...columns, newColumn]);
  };

  const updateColumn = (index: number, field: keyof TableColumn, value: string) => {
    const updatedColumns = [...columns];
    updatedColumns[index] = { ...updatedColumns[index], [field]: value };
    setColumns(updatedColumns);
  };

  const deleteColumn = (index: number) => {
    const updatedColumns = columns.filter((_, i) => i !== index);
    setColumns(updatedColumns);
    
    // Remove the column data from all rows
    const columnKey = columns[index].key;
    const updatedData = data.map(row => {
      const { [columnKey]: _, ...rest } = row;
      return rest;
    });
    setData(updatedData);
  };

  const addRow = () => {
    const newRow: TableData = {};
    columns.forEach(column => {
      newRow[column.key] = '';
    });
    setData([...data, newRow]);
  };

  const updateCell = (rowIndex: number, columnKey: string, value: string) => {
    const updatedData = [...data];
    updatedData[rowIndex] = { ...updatedData[rowIndex], [columnKey]: value };
    setData(updatedData);
  };

  const deleteRow = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    setData(updatedData);
  };

  const saveConfiguration = () => {
    updateTableConfig.mutate({
      tableName: 'recent_activity',
      columns,
      data
    });
  };

  const renderCell = (row: TableData, column: TableColumn, rowIndex: number) => {
    const isEditing = editingRow === rowIndex;
    const value = row[column.key] || '';

    if (!isEditing) {
      if (column.type === 'status') {
        return (
          <Badge 
            variant="secondary"
            className={
              value === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              value === 'IN PROGRESS' ? 'bg-blue-100 text-blue-800' :
              value === 'SCHEDULED' ? 'bg-orange-100 text-orange-800' :
              value === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              value === 'CANCELLED' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }
          >
            {value}
          </Badge>
        );
      }
      if (column.type === 'actions') {
        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingRow(rowIndex)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteRow(rowIndex)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      }
      return <span>{value}</span>;
    }

    if (column.type === 'status') {
      return (
        <Select
          value={value}
          onValueChange={(newValue) => updateCell(rowIndex, column.key, newValue)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (column.type === 'actions') {
      return (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingRow(null)}
          >
            <Save className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteRow(rowIndex)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return (
      <Input
        value={value}
        onChange={(e) => updateCell(rowIndex, column.key, e.target.value)}
        className="w-full"
      />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading table configuration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Recent Activity Table Builder</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Column Configuration */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Column Configuration</h3>
              <Button onClick={addColumn} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Column
              </Button>
            </div>
            
            <div className="space-y-4">
              {columns.map((column, index) => (
                <div key={column.key} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label htmlFor={`column-label-${index}`}>Label</Label>
                    <Input
                      id={`column-label-${index}`}
                      value={column.label}
                      onChange={(e) => updateColumn(index, 'label', e.target.value)}
                      placeholder="Column label"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`column-key-${index}`}>Key</Label>
                    <Input
                      id={`column-key-${index}`}
                      value={column.key}
                      onChange={(e) => updateColumn(index, 'key', e.target.value)}
                      placeholder="column_key"
                    />
                  </div>
                  <div className="w-32">
                    <Label>Type</Label>
                    <Select
                      value={column.type}
                      onValueChange={(value) => updateColumn(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columnTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteColumn(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Table Data</h3>
              <Button onClick={addRow} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Row
              </Button>
            </div>

            {columns.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column.key}>{column.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columns.map((column) => (
                          <TableCell key={column.key}>
                            {renderCell(row, column, rowIndex)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={saveConfiguration}
              disabled={updateTableConfig.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
