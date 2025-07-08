import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/lib/LanguageProvider";
import type { Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart3, 
  Calendar, 
  ChartBar, 
  User, 
  Settings, 
  Palette,
  ChevronDown,
  LogOut,
  Globe,
  Shield,
  Database,
  Users,
  FileText,
  Activity,
  Table,
  Columns,
  RefreshCw,
  Archive,
  Trash2,
  Download,
  Upload,
  Eye,
  Edit,
  Plus
} from "lucide-react";
import logo from "@assets/logo_1750430330014.png";
import { useToast } from "@/hooks/use-toast";

const languages = [
  { code: "en", label: "🇬🇧", name: "English" },
  { code: "es", label: "🇪🇸", name: "Español" },
  { code: "fr", label: "🇫🇷", name: "Français" },
  { code: "rw", label: "🇷🇼", name: "Kinyarwanda" },
  { code: "de", label: "🇩🇪", name: "Deutsch" },
];

const themes = [
  { value: "default", label: "Default Theme", color: "bg-primary" },
  { value: "dark", label: "Dark Theme", color: "bg-gray-800" },
  { value: "blue", label: "Blue Professional", color: "bg-blue-600" },
  { value: "purple", label: "Custom Modern", color: "bg-gradient-to-r from-purple-500 to-purple-600" },
];

export function Navigation() {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t, isAdminRoute } = useLanguage();
  const { toast } = useToast();

  const isActive = (path: string) => location === path;

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    toast({ description: "Logged out successfully" });
    window.location.href = "/";
  };

  const isAdmin = () => {
    const adminUser = localStorage.getItem("adminUser");
    return adminUser && JSON.parse(adminUser).role === "admin";
  };

  const handleAdminAction = (action: string) => {
    switch (action) {
      case 'create_program':
        // Navigate to admin panel with programs tab and trigger create
        setLocation('/admin');
        setTimeout(() => {
          // Set the admin tab to programs and trigger create form
          const event = new CustomEvent('admin:create-program');
          window.dispatchEvent(event);
        }, 100);
        break;
      case 'edit_programs':
        // Navigate to admin panel with programs tab
        setLocation('/admin');
        setTimeout(() => {
          const event = new CustomEvent('admin:switch-tab', { detail: 'programs' });
          window.dispatchEvent(event);
        }, 100);
        break;
      case 'archive_programs':
        // Navigate to admin panel with programs tab focused on archived
        setLocation('/admin');
        setTimeout(() => {
          const event = new CustomEvent('admin:switch-tab', { detail: 'programs' });
          window.dispatchEvent(event);
        }, 100);
        break;
      case 'table_builder':
        // Navigate to admin panel with table builder tab
        setLocation('/admin');
        setTimeout(() => {
          const event = new CustomEvent('admin:switch-tab', { detail: 'table-builder' });
          window.dispatchEvent(event);
        }, 100);
        break;
      case 'column_headers':
        // Navigate to admin panel with settings tab (column headers)
        setLocation('/admin');
        setTimeout(() => {
          const event = new CustomEvent('admin:switch-tab', { detail: 'settings' });
          window.dispatchEvent(event);
        }, 100);
        break;
      case 'activity_logs':
        // Navigate to admin panel with activity logs tab
        setLocation('/admin');
        setTimeout(() => {
          const event = new CustomEvent('admin:switch-tab', { detail: 'activity' });
          window.dispatchEvent(event);
        }, 100);
        break;
      case 'export_data':
        // Trigger data export
        toast({ description: "Starting data export..." });
        handleExportData();
        break;
      case 'import_data':
        // Trigger data import
        toast({ description: "Opening data import..." });
        handleImportData();
        break;
      case 'sync_database':
        // Trigger database sync
        toast({ description: "Syncing database..." });
        handleSyncDatabase();
        break;
      case 'profile_settings':
        // Navigate to admin panel with profile settings
        setLocation('/admin');
        setTimeout(() => {
          const event = new CustomEvent('admin:switch-tab', { detail: 'users' });
          window.dispatchEvent(event);
        }, 100);
        break;
      case 'system_settings':
        // Navigate to admin panel with system settings
        setLocation('/admin');
        setTimeout(() => {
          const event = new CustomEvent('admin:switch-tab', { detail: 'settings' });
          window.dispatchEvent(event);
        }, 100);
        break;
      default:
        break;
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/export/programs', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }
      
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `programs_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ description: "Data exported successfully!" });
    } catch (error) {
      toast({ description: "Export failed. Please try again.", variant: "destructive" });
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Send import data to server
        const response = await fetch('/api/import/programs', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          toast({ description: "Data imported successfully!" });
          window.location.reload();
        } else {
          throw new Error('Import failed');
        }
      } catch (error) {
        toast({ description: "Import failed. Please check file format.", variant: "destructive" });
      }
    };
    input.click();
  };

  const handleSyncDatabase = async () => {
    try {
      const response = await fetch('/api/sync/database', { 
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        toast({ description: "Database synced successfully!" });
        window.location.reload();
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      toast({ description: "Database sync failed. Please try again.", variant: "destructive" });
    }
  };

  const navItems = [
    { path: "/", icon: BarChart3, labelKey: "dashboard" },
    { path: "/analytics", icon: ChartBar, labelKey: "analytics" },
  ];

  return (
    <nav className="nav-blur sticky top-0 z-50 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left Side: Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <img src={logo} alt="BPN Logo" className="w-12 h-12 object-contain transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              
              <p className="text-sm text-muted-foreground">
                {isAdminRoute ? "PROGRAM MANAGEMENT" : t("welcome_title")}
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center space-x-2 transition-all duration-200 rounded-full px-4 py-2 ${
                    isActive(item.path) 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">
                    {t(item.labelKey as TranslationKey)}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Right Side: Language Selector, Theme Selector, User Menu */}
        <div className="flex items-center space-x-4">
          {/* Language Selector - Only show on non-admin routes */}
          {!isAdminRoute && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {languages.find(lang => lang.code === language)?.label}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as Language)}
                    className={`flex items-center space-x-3 ${
                      language === lang.code ? "bg-accent" : ""
                    }`}
                  >
                    <span className="text-lg">{lang.label}</span>
                    <span>{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Theme Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {themes.map((themeOption) => (
                <DropdownMenuItem
                  key={themeOption.value}
                  onClick={() => setTheme(themeOption.value as any)}
                  className={`flex items-center space-x-3 ${
                    theme === themeOption.value ? "bg-accent" : ""
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${themeOption.color}`} />
                  <span>{themeOption.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Admin Menu - Only show for authenticated admins */}
          {isAdmin() && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Admin</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-4 border-b bg-gradient-to-r from-orange-50 to-red-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Admin Dashboard</p>
                      <p className="text-xs text-muted-foreground">System Management</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  {/* Program Management */}
                  <div className="mb-2">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Program Management</p>
                    <Link href="/admin">
                      <DropdownMenuItem className="w-full">
                        <Database className="w-4 h-4 mr-3 text-blue-600" />
                        <div>
                          <p className="font-medium">Admin Panel</p>
                          <p className="text-xs text-muted-foreground">Full system control</p>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="w-full" onClick={() => handleAdminAction('create_program')}>
                      <Plus className="w-4 h-4 mr-3 text-green-600" />
                      <div>
                        <p className="font-medium">Create Program</p>
                        <p className="text-xs text-muted-foreground">Add new program</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="w-full" onClick={() => handleAdminAction('edit_programs')}>
                      <Edit className="w-4 h-4 mr-3 text-amber-600" />
                      <div>
                        <p className="font-medium">Edit Programs</p>
                        <p className="text-xs text-muted-foreground">Modify existing programs</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="w-full" onClick={() => handleAdminAction('archive_programs')}>
                      <Archive className="w-4 h-4 mr-3 text-purple-600" />
                      <div>
                        <p className="font-medium">Archive Programs</p>
                        <p className="text-xs text-muted-foreground">Manage program lifecycle</p>
                      </div>
                    </DropdownMenuItem>
                  </div>

                  {/* Data Management */}
                  <div className="mb-2">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Data Management</p>
                    <DropdownMenuItem className="w-full" onClick={() => handleAdminAction('table_builder')}>
                      <Table className="w-4 h-4 mr-3 text-indigo-600" />
                      <div>
                        <p className="font-medium">Table Builder</p>
                        <p className="text-xs text-muted-foreground">Configure data tables</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="w-full" onClick={() => handleAdminAction('column_headers')}>
                      <Columns className="w-4 h-4 mr-3 text-teal-600" />
                      <div>
                        <p className="font-medium">Column Headers</p>
                        <p className="text-xs text-muted-foreground">Manage table columns</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="w-full" onClick={() => handleAdminAction('activity_logs')}>
                      <Activity className="w-4 h-4 mr-3 text-pink-600" />
                      <div>
                        <p className="font-medium">Activity Logs</p>
                        <p className="text-xs text-muted-foreground">Monitor system activity</p>
                      </div>
                    </DropdownMenuItem>
                  </div>

                  {/* System Tools */}
                  <div className="mb-2">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">System Tools</p>
                    <DropdownMenuItem className="w-full" onClick={() => handleAdminAction('export_data')}>
                      <Download className="w-4 h-4 mr-3 text-blue-600" />
                      <div>
                        <p className="font-medium">Export Data</p>
                        <p className="text-xs text-muted-foreground">Download program data</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="w-full" onClick={() => handleAdminAction('import_data')}>
                      <Upload className="w-4 h-4 mr-3 text-green-600" />
                      <div>
                        <p className="font-medium">Import Data</p>
                        <p className="text-xs text-muted-foreground">Upload program data</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="w-full" onClick={() => handleAdminAction('sync_database')}>
                      <RefreshCw className="w-4 h-4 mr-3 text-orange-600" />
                      <div>
                        <p className="font-medium">Sync Database</p>
                        <p className="text-xs text-muted-foreground">Refresh all data</p>
                      </div>
                    </DropdownMenuItem>
                  </div>

                  {/* Account Management */}
                  <div className="border-t pt-2">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Account</p>
                    <DropdownMenuItem className="w-full" onClick={() => handleAdminAction('profile_settings')}>
                      <User className="w-4 h-4 mr-3 text-gray-600" />
                      <div>
                        <p className="font-medium">Profile Settings</p>
                        <p className="text-xs text-muted-foreground">Manage admin profile</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="w-full" onClick={() => handleAdminAction('system_settings')}>
                      <Settings className="w-4 h-4 mr-3 text-gray-600" />
                      <div>
                        <p className="font-medium">System Settings</p>
                        <p className="text-xs text-muted-foreground">Configure application</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-3" />
                      <div>
                        <p className="font-medium">Sign Out</p>
                        <p className="text-xs text-muted-foreground">End admin session</p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Regular User Menu - Show for non-admin users */}
          {!isAdmin() && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Menu</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <Link href="/admin">
                  <DropdownMenuItem>
                    <Shield className="w-4 h-4 mr-2" />
                    <span>Admin Access</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}