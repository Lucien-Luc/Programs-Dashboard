import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/LanguageProvider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  List, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Calendar, 
  Trophy, 
  Clock,
  Target,
  Handshake,
  Sprout,
  Rocket,
  TrendingUp
} from "lucide-react";
import { formatDate, getStatusColor } from "@/lib/utils";
import type { Activity, Program } from "@shared/schema";

interface ColumnHeader {
  id: number;
  tableName: string;
  columnKey: string;
  displayName: string;
  isVisible: boolean;
  sortOrder: number;
  width: string;
  alignment: string;
}

interface ActivityTableProps {
  activities: Activity[];
  programs: Program[];
}

const iconMap = {
  "bullseye": Target,
  "handshake": Handshake,
  "seedling": Sprout,
  "rocket": Rocket,
  "chart-line": TrendingUp,
};

const actionIconMap = {
  "completed": Eye,
  "in_progress": Edit,
  "scheduled": Calendar,
  "pending": Clock,
};

export function ActivityTable({ activities, programs }: ActivityTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const { t } = useLanguage();
  
  const paginatedActivities = activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Fetch configurable column headers
  const { data: columnHeaders = [] } = useQuery({
    queryKey: ['/api/column-headers', 'activities'],
    queryFn: async () => {
      const response = await fetch('/api/column-headers/activities');
      if (!response.ok) {
        // Return default headers if none configured
        return [
          { columnKey: 'program', displayName: t('program'), isVisible: true, sortOrder: 0 },
          { columnKey: 'activity_type', displayName: t('activity_type'), isVisible: true, sortOrder: 1 },
          { columnKey: 'date', displayName: t('date'), isVisible: true, sortOrder: 2 },
          { columnKey: 'status', displayName: t('status'), isVisible: true, sortOrder: 3 },
          { columnKey: 'details', displayName: t('details'), isVisible: true, sortOrder: 4 },
          { columnKey: 'actions', displayName: t('actions'), isVisible: true, sortOrder: 5 },
        ];
      }
      return response.json();
    }
  });

  const getProgramById = (id: number | null) => id ? programs.find(p => p.id === id) : null;
  
  // Sort headers and filter visible ones
  const visibleHeaders = columnHeaders
    .filter((header: ColumnHeader) => header.isVisible)
    .sort((a: ColumnHeader, b: ColumnHeader) => a.sortOrder - b.sortOrder);

  const renderCellContent = (activity: Activity, columnKey: string) => {
    const program = getProgramById(activity.programId);
    
    switch (columnKey) {
      case 'program':
        if (!program) return 'Unknown Program';
        const IconComponent = iconMap[program.icon as keyof typeof iconMap] || Target;
        return (
          <div className="flex items-center space-x-3">
            <IconComponent className="h-5 w-5" style={{ color: program.color }} />
            <span className="font-medium">{program.name}</span>
          </div>
        );
        
      case 'activity_type':
        return activity.type;
        
      case 'date':
        return formatDate(activity.date);
        
      case 'status':
        return (
          <Badge 
            variant="secondary"
            style={{ 
              backgroundColor: getStatusColor(activity.status) + '20', 
              color: getStatusColor(activity.status) 
            }}
          >
            {activity.status.replace('_', ' ').toUpperCase()}
          </Badge>
        );
        
      case 'details':
        return activity.details || activity.description || '-';
        
      case 'actions':
        const ActionIcon = actionIconMap[activity.status as keyof typeof actionIconMap] || Eye;
        return (
          <Button variant="ghost" size="sm">
            <ActionIcon className="w-4 h-4" />
          </Button>
        );
        
      default:
        return '-';
    }
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/10 pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center font-bold">
            <div className="p-2 bg-primary/10 rounded-lg mr-3">
              <List className="w-6 h-6 text-primary" />
            </div>
            {t("activity_table")}
          </CardTitle>
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" className="rounded-full px-4 hover:bg-accent">
              <Filter className="w-4 h-4 mr-2" />
              {t("filter")}
            </Button>
            <Button variant="outline" size="sm" className="rounded-full px-4 hover:bg-accent">
              <Download className="w-4 h-4 mr-2" />
              {t("export")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleHeaders.map((header: ColumnHeader) => (
                  <TableHead key={header.columnKey} style={{ width: header.width !== 'auto' ? header.width : undefined }}>
                    {header.displayName}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedActivities.map((activity) => {
                const program = getProgramById(activity.programId!);
                if (!program) return null;
                
                const IconComponent = iconMap[program.icon as keyof typeof iconMap] || Target;
                const ActionIcon = actionIconMap[activity.status as keyof typeof actionIconMap] || Eye;
                
                return (
                  <TableRow key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: program.color }}
                        >
                          <IconComponent className="text-white w-4 h-4" />
                        </div>
                        <span className="font-medium">PROGRAM</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.type}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(activity.date)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={getStatusColor(activity.status)}
                        variant="secondary"
                      >
                        {activity.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.details}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                      >
                        <ActionIcon className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, activities.length)} of {activities.length} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
