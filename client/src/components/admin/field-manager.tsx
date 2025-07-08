import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Eye, 
  EyeOff, 
  GripVertical,
  Save,
  X
} from "lucide-react";

interface TableField {
  id?: number;
  tableName: string;
  key: string;
  displayName: string;
  dataType: 'text' | 'number' | 'date' | 'status' | 'image' | 'actions' | 'color' | 'progress' | 'boolean' | 'select';
  isVisible: boolean;
  isEditable: boolean;
  sortOrder: number;
  width?: number;
  alignment: 'left' | 'center' | 'right';
  formatOptions?: any;
  validationRules?: any;
  selectOptions?: string[];
  description?: string;
}

const DATA_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'status', label: 'Status' },
  { value: 'image', label: 'Image' },
  { value: 'color', label: 'Color' },
  { value: 'progress', label: 'Progress' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'select', label: 'Select' },
  { value: 'actions', label: 'Actions' }
];

const ALIGNMENTS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

export function FieldManager() {
  const [selectedTable, setSelectedTable] = useState("programs");
  const [editingField, setEditingField] = useState<TableField | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newField, setNewField] = useState<Partial<TableField>>({
    tableName: selectedTable,
    key: "",
    displayName: "",
    dataType: "text",
    isVisible: true,
    isEditable: true,
    alignment: "left",
    sortOrder: 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch table fields
  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['/api/table-columns', selectedTable],
    queryFn: async () => {
      const response = await fetch(`/api/table-columns/${selectedTable}`);
      if (!response.ok) throw new Error('Failed to fetch fields');
      return response.json();
    }
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (field: Partial<TableField>) => {
      const response = await fetch('/api/table-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(field)
      });
      if (!response.ok) throw new Error('Failed to create field');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/table-columns'] });
      setIsAddingField(false);
      setNewField({
        tableName: selectedTable,
        key: "",
        displayName: "",
        dataType: "text",
        isVisible: true,
        isEditable: true,
        alignment: "left",
        sortOrder: 0
      });
      toast({ description: "Field created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        description: error.message || "Failed to create field" 
      });
    }
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async (field: TableField) => {
      const response = await fetch('/api/table-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(field)
      });
      if (!response.ok) throw new Error('Failed to update field');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/table-columns'] });
      setEditingField(null);
      toast({ description: "Field updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        description: error.message || "Failed to update field" 
      });
    }
  });

  const handleSaveNewField = () => {
    if (!newField.key || !newField.displayName) {
      toast({ 
        variant: "destructive", 
        description: "Field key and display name are required" 
      });
      return;
    }

    createFieldMutation.mutate({
      ...newField,
      tableName: selectedTable,
      sortOrder: fields.length
    });
  };

  const handleUpdateField = (field: TableField) => {
    updateFieldMutation.mutate(field);
  };

  const handleDeleteField = (fieldId: number) => {
    // Implementation for delete would go here
    toast({ description: "Delete functionality will be implemented" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Field Management</h2>
          <p className="text-muted-foreground">
            Configure table fields, data types, and display options
          </p>
        </div>
        <Button onClick={() => setIsAddingField(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      {/* Table Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Table Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="table-select">Select Table:</Label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="programs">Programs</SelectItem>
                <SelectItem value="activities">Activities</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline">{fields.length} fields configured</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Fields Table */}
      <Card>
        <CardHeader>
          <CardTitle>Table Fields</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage field properties, visibility, and data types for the {selectedTable} table
          </p>
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
                  <TableHead>Order</TableHead>
                  <TableHead>Field Key</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Editable</TableHead>
                  <TableHead>Alignment</TableHead>
                  <TableHead>Width</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field: TableField, index: number) => (
                  <TableRow key={field.id || field.key}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-sm">
                        {field.key}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{field.displayName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{field.dataType}</Badge>
                    </TableCell>
                    <TableCell>
                      {field.isVisible ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch checked={field.isEditable} disabled />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{field.alignment}</Badge>
                    </TableCell>
                    <TableCell>
                      {field.width ? `${field.width}px` : "Auto"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingField(field)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => field.id && handleDeleteField(field.id)}
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

      {/* Add Field Dialog */}
      <Dialog open={isAddingField} onOpenChange={setIsAddingField}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Field
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="field-key">Field Key *</Label>
              <Input
                id="field-key"
                value={newField.key || ""}
                onChange={(e) => setNewField({ ...newField, key: e.target.value })}
                placeholder="e.g., priority, category"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name *</Label>
              <Input
                id="display-name"
                value={newField.displayName || ""}
                onChange={(e) => setNewField({ ...newField, displayName: e.target.value })}
                placeholder="e.g., Priority Level, Category"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-type">Data Type</Label>
              <Select 
                value={newField.dataType} 
                onValueChange={(value: any) => setNewField({ ...newField, dataType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alignment">Alignment</Label>
              <Select 
                value={newField.alignment} 
                onValueChange={(value: any) => setNewField({ ...newField, alignment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALIGNMENTS.map(align => (
                    <SelectItem key={align.value} value={align.value}>
                      {align.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                value={newField.width || ""}
                onChange={(e) => setNewField({ ...newField, width: parseInt(e.target.value) || undefined })}
                placeholder="Auto"
              />
            </div>

            <div className="space-y-2">
              <Label>Visibility & Edit Options</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newField.isVisible}
                    onCheckedChange={(checked) => setNewField({ ...newField, isVisible: checked })}
                  />
                  <Label>Visible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newField.isEditable}
                    onCheckedChange={(checked) => setNewField({ ...newField, isEditable: checked })}
                  />
                  <Label>Editable</Label>
                </div>
              </div>
            </div>

            {newField.dataType === 'select' && (
              <div className="col-span-2 space-y-2">
                <Label htmlFor="select-options">Select Options (comma-separated)</Label>
                <Textarea
                  id="select-options"
                  value={newField.selectOptions?.join(', ') || ''}
                  onChange={(e) => setNewField({ 
                    ...newField, 
                    selectOptions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newField.description || ""}
                onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                placeholder="Brief description of this field..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddingField(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNewField}
              disabled={createFieldMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Field
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Field Dialog */}
      {editingField && (
        <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Field: {editingField.displayName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-display-name">Display Name</Label>
                <Input
                  id="edit-display-name"
                  value={editingField.displayName}
                  onChange={(e) => setEditingField({ ...editingField, displayName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-data-type">Data Type</Label>
                <Select 
                  value={editingField.dataType} 
                  onValueChange={(value: any) => setEditingField({ ...editingField, dataType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-alignment">Alignment</Label>
                <Select 
                  value={editingField.alignment} 
                  onValueChange={(value: any) => setEditingField({ ...editingField, alignment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALIGNMENTS.map(align => (
                      <SelectItem key={align.value} value={align.value}>
                        {align.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-width">Width (px)</Label>
                <Input
                  id="edit-width"
                  type="number"
                  value={editingField.width || ""}
                  onChange={(e) => setEditingField({ ...editingField, width: parseInt(e.target.value) || undefined })}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Options</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingField.isVisible}
                      onCheckedChange={(checked) => setEditingField({ ...editingField, isVisible: checked })}
                    />
                    <Label>Visible</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingField.isEditable}
                      onCheckedChange={(checked) => setEditingField({ ...editingField, isEditable: checked })}
                    />
                    <Label>Editable</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingField(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleUpdateField(editingField)}
                disabled={updateFieldMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Update Field
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}