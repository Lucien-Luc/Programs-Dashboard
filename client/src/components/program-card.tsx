import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatCurrency, getStatusColor } from "@/lib/utils";
import { 
  Target, 
  Handshake, 
  Sprout, 
  Rocket, 
  TrendingUp,
  Users,
  Lightbulb,
  Heart,
  Star,
  Shield
} from "lucide-react";
import type { Program } from "@shared/schema";

const iconMap = {
  "bullseye": Target,
  "handshake": Handshake,
  "seedling": Sprout,
  "rocket": Rocket,
  "chart-line": TrendingUp,
  "users": Users,
  "lightbulb": Lightbulb,
  "heart": Heart,
  "star": Star,
  "shield": Shield,
};

interface ProgramCardProps {
  program: Program;
  onClick?: () => void;
}

export function ProgramCard({ program, onClick }: ProgramCardProps) {
  const IconComponent = iconMap[program.icon as keyof typeof iconMap] || Target;
  const hasImage = program.imageData || program.imageUrl || program.image;
  
  // Create image source URL - prioritize database stored base64, then URLs, then fallback
  const getImageSrc = () => {
    if (program.imageData && program.imageType) {
      return `data:${program.imageType};base64,${program.imageData}`;
    }
    if (program.imageUrl) {
      return program.imageUrl;
    }
    if (program.image) {
      return `/uploads/${program.image}`;
    }
    return null;
  };
  
  const imageSrc = getImageSrc();

  const CardContent = (
    <Card 
      className={cn(
        "program-card card-hover group relative overflow-hidden border-0 shadow-lg"
      )}
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {hasImage && imageSrc ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <img 
                  src={imageSrc} 
                  alt={program.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: program.color }}
              >
                <IconComponent className="text-white w-7 h-7" />
              </div>
            )}
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              PROGRAM
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={`${getStatusColor(program.status)} shadow-sm font-semibold`}
          >
            {program.status === 'active' ? 'Active' : program.status}
          </Badge>
        </div>
        
        <div 
          className="text-4xl font-bold mb-3 group-hover:scale-105 transition-transform duration-200"
          style={{ color: program.color }}
        >
          {program.participants.toLocaleString()}
        </div>
        
        <h3 className="text-lg font-bold text-card-foreground mb-4 line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {program.name}
        </h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-foreground">{Math.round(program.progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div 
                className="h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${program.progress}%`,
                  backgroundColor: program.color,
                  boxShadow: `0 0 10px ${program.color}40`
                }}
              />
            </div>
          </div>
          
          <div className="pt-2">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1 font-medium">Budget</div>
              <div className="text-lg font-bold text-card-foreground">{formatCurrency(program.budgetAllocated || 0)}</div>
            </div>
          </div>
        </div>
        
        {/* Decorative corner element */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Enhanced image preview on hover */}
      {hasImage && imageSrc && (
        <div 
          className="absolute invisible group-hover:visible bg-black/90 backdrop-blur-sm text-white p-3 rounded-xl text-xs -mt-20 ml-4 z-20 shadow-2xl border border-white/10"
          style={{ top: '-120px', left: '16px' }}
        >
          <img 
            src={imageSrc} 
            alt={program.name}
            className="w-40 h-24 object-cover rounded-lg"
          />
          <div className="text-center mt-2 text-green-400 font-medium">
            💾 Stored in Database
          </div>
        </div>
      )}
    </Card>
  );

  if (onClick) {
    return CardContent;
  }

  return (
    <Link href={`/program/${program.id}`}>
      {CardContent}
    </Link>
  );
}
