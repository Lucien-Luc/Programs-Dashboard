import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { useLanguage } from "@/lib/LanguageProvider";
import { ProgramCard } from "@/components/program-card";
import { ActivityTable } from "@/components/activity-table";
import { ProgramModal } from "@/components/program-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrograms, useActivities } from "@/hooks/use-programs";
import { RefreshCw, BarChart3, Plus } from "lucide-react";
import type { Program } from "@shared/schema";
import logo from "@assets/logo_1750430330014.png";

export default function Dashboard() {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { t } = useLanguage();
  
  const { data: programs, isLoading: programsLoading, refetch: refetchPrograms } = usePrograms();
  const { data: activities, isLoading: activitiesLoading } = useActivities();

  const handleProgramClick = (program: Program) => {
    setSelectedProgram(program);
    setModalOpen(true);
  };

  const handleRefresh = () => {
    refetchPrograms();
  };

  if (programsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-primary text-primary-foreground rounded-xl p-8 mb-8">
            <Skeleton className="h-8 w-48 mb-2 bg-primary-foreground/20" />
            <Skeleton className="h-6 w-96 bg-primary-foreground/20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-12">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Header */}
        <div className="hero-gradient text-primary-foreground rounded-3xl p-8 mb-12 relative overflow-hidden">
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img src={logo} alt="BPN Logo" className="h-16 w-16 object-contain drop-shadow-lg" />
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-3 flex items-center tracking-tight">
                    <BarChart3 className="mr-4 w-10 h-10" />
                    {t("welcome_title")}
                  </h1>
                  <p className="text-primary-foreground/90 text-xl leading-relaxed">
                    {t("welcome_message")}
                  </p>
                  <div className="mt-4 flex items-center space-x-6 text-primary-foreground/80">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">{programs?.length || 0} Active Programs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">{activities?.length || 0} Recent Activities</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-3">
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/20"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="font-medium">{t("refresh")}</span>
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </Button>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Program Overview Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  {t("programs")}
                </h2>
                <p className="text-muted-foreground">Monitor your active program portfolio</p>
              </div>
            </div>
            
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-8">
            {programs?.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onClick={() => handleProgramClick(program)}
              />
            ))}
          </div>
        </section>

        {/* Recent Activity Section */}
        {activities && programs && (
          <section className="mb-12">
            <ActivityTable 
              activities={activities} 
              programs={programs} 
            />
          </section>
        )}
      </main>

      {/* Program Modal */}
      <ProgramModal
        program={selectedProgram}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
