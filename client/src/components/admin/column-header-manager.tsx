import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Edit, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Plus,
  Settings2
} from "lucide-react";

interface ColumnHeader {
  id?: number;
  tableName: string;
  columnKey: string;
  displayName: string;
  isVisible: boolean;
  sortOrder: number;
  width: string;
  alignment: string;
}

export function ColumnHeaderManager() {
  const [selectedTable] = useState("activities");
  const [editingHeader, setEditingHeader] = useState<ColumnHeader | null>(null);
  const [isAddingHeader, setIsAddingHeader] = useState(false);
  const [newHeader, setNewHeader] = useState<Partial<ColumnHeader>>({
    tableName: selectedTable,
    columnKey: "",
    displayName: "",
    isVisible: true,
    sortOrder: 0,
    width: "auto",
    alignment: "left"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch column headers
  const { data: headers = [], isLoading } = useQuery({
    queryKey: ['/api/column-headers', selectedTable],
    queryFn: async () => {
      const response = await fetch(`/api/column-headers/${selectedTable}`);
      if (!response.ok) throw new Error('Failed to fetch headers');
      return response.json();
    }
  });

  // Update header mutation
  const updateHeaderMutation = useMutation({
    mutationFn: async (header: ColumnHeader) => {
      const response = await fetch('/api/column-headers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(header)
      });
      if (!response.ok) throw new Error('Failed to update header');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/column-headers'] });
      setEditingHeader(null);
      toast({ description: "Column header updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        description: error.message || "Failed to update header" 
      });
    }
  });

  // Create header mutation
  const createHeaderMutation = useMutation({
    mutationFn: async (header: Partial<ColumnHeader>) => {
      const response = await fetch('/api/column-headers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(header)
      });
      if (!response.ok) throw new Error('Failed to create header');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/column-headers'] });
      setIsAddingHeader(false);
      setNewHeader({
        tableName: selectedTable,
        columnKey: "",
        displayName: "",
        isVisible: true,
        sortOrder: 0,
        width: "auto",
        alignment: "left"
      });
      toast({ description: "Column header created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        description: error.message || "Failed to create header" 
      });
    }
  });

  const handleUpdateHeader = (header: ColumnHeader) => {
    updateHeaderMutation.mutate(header);
  };

  const handleSaveNewHeader = () => {
    if (!newHeader.columnKey || !newHeader.displayName) {
      toast({ 
        variant: "destructive", 
        description: "Column key and display name are required" 
      });
      return;
    }

    createHeaderMutation.mutate({
      ...newHeader,
      tableName: selectedTable,
      sortOrder: headers.length
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Table Column Headers</h2>
          <p className="text-muted-foreground">
            Configure the column headers that appear in the activity table
          </p>
        </div>
        <Button onClick={() => setIsAddingHeader(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Column
        </Button>
      </div>

      {/* Headers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Activity Table Headers
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These headers will appear in the "Recent Program Activity" table in the dashboard
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
                  <TableHead>Column Key</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Visible</TableHead>
                  <TableHead>Width</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {headers.map((header: ColumnHeader, index: number) => (
                  <TableRow key={header.id || header.columnKey}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-sm">
                        {header.columnKey}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{header.displayName}</TableCell>
                    <TableCell>
                      {header.isVisible ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>{header.width || "auto"}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingHeader(header)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Header Dialog */}
      <Dialog open={isAddingHeader} onOpenChange={setIsAddingHeader}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Column Header
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="column-key">Column Key *</Label>
              <Input
                id="column-key"
                value={newHeader.columnKey || ""}
                onChange={(e) => setNewHeader({ ...newHeader, columnKey: e.target.value })}
                placeholder="e.g., participant_count, location"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name *</Label>
              <Input
                id="display-name"
                value={newHeader.displayName || ""}
                onChange={(e) => setNewHeader({ ...newHeader, displayName: e.target.value })}
                placeholder="e.g., Participant Count, Location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                value={newHeader.width || ""}
                onChange={(e) => setNewHeader({ ...newHeader, width: e.target.value })}
                placeholder="auto, 150px, 20%"
              />
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newHeader.isVisible}
                  onCheckedChange={(checked) => setNewHeader({ ...newHeader, isVisible: checked })}
                />
                <Label>Visible in table</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddingHeader(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveNewHeader}
              disabled={createHeaderMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Header
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Header Dialog */}
      {editingHeader && (
        <Dialog open={!!editingHeader} onOpenChange={() => setEditingHeader(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Column Header
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-display-name">Display Name</Label>
                <Input
                  id="edit-display-name"
                  value={editingHeader.displayName}
                  onChange={(e) => setEditingHeader({ ...editingHeader, displayName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-width">Width</Label>
                <Input
                  id="edit-width"
                  value={editingHeader.width || ""}
                  onChange={(e) => setEditingHeader({ ...editingHeader, width: e.target.value })}
                  placeholder="auto, 150px, 20%"
                />
              </div>

              <div className="space-y-2">
                <Label>Options</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingHeader.isVisible}
                    onCheckedChange={(checked) => setEditingHeader({ ...editingHeader, isVisible: checked })}
                  />
                  <Label>Visible in table</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingHeader(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleUpdateHeader(editingHeader)}
                disabled={updateHeaderMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Update Header
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}