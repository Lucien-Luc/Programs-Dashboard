import { Router } from "express";
import { db } from "./db";
import { adminSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";

const router = Router();

// Chart configuration storage key
const CHART_CONFIG_KEY = "analytics_chart_configs";
const ANALYTICS_DATA_KEY = "analytics_data";

// Get chart configurations
router.get("/charts", async (req, res) => {
  try {
    const settings = await storage.getAdminSettings("charts");
    const chartSetting = settings.find(s => s.key === CHART_CONFIG_KEY);
    
    if (chartSetting) {
      res.json(JSON.parse(chartSetting.value));
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching chart configurations:", error);
    res.status(500).json({ error: "Failed to fetch chart configurations" });
  }
});

// Save chart configurations
router.post("/charts", async (req, res) => {
  try {
    const { charts } = req.body;

    if (!Array.isArray(charts)) {
      return res.status(400).json({ error: "Charts must be an array" });
    }

    // Validate chart configurations
    for (const chart of charts) {
      if (!chart.id || !chart.title || !chart.type || !chart.dataSource) {
        return res.status(400).json({ 
          error: "Each chart must have id, title, type, and dataSource" 
        });
      }
    }

    const chartConfigJson = JSON.stringify(charts);

    // Store in memory storage
    await storage.updateAdminSetting(
      CHART_CONFIG_KEY,
      chartConfigJson,
      "charts"
    );

    res.json({ success: true, charts });
  } catch (error) {
    console.error("Error saving chart configurations:", error);
    res.status(500).json({ error: "Failed to save chart configurations" });
  }
});

// Get real analytics data for charts with optional program filtering
router.get("/data/:dataSource", async (req, res) => {
  try {
    const { dataSource } = req.params;
    const { programId, metrics, status, type } = req.query;
    
    let programs = await storage.getPrograms();
    
    // Apply filters - "all" means use all programs, specific ID means filter to that program
    if (programId && programId !== "all") {
      programs = programs.filter(p => p.id === programId);
    }
    // If programId is "all", we keep all programs (no filtering)
    
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      programs = programs.filter(p => statusArray.includes(p.status));
    }
    
    if (type) {
      const typeArray = Array.isArray(type) ? type : [type];
      programs = programs.filter(p => typeArray.includes(p.type));
    }
    
    switch (dataSource) {
      case "programs":
        res.json(programs);
        break;
        
      case "progressAnalysis":
        // Real progress analysis by program
        const progressData = programs.map(program => ({
          name: program.name,
          progress: program.progress,
          target: 100,
          efficiency: program.progress / (program.participants || 1),
          type: program.type,
          startDate: program.startDate,
        })).filter(p => p.progress > 0);
        res.json(progressData);
        break;
        
      case "budgetUtilization":
        // Real budget utilization analysis
        const budgetData = programs.map(program => ({
          name: program.name,
          allocated: program.budgetAllocated || 0,
          used: program.budgetUsed || 0,
          remaining: (program.budgetAllocated || 0) - (program.budgetUsed || 0),
          utilization: program.budgetAllocated ? ((program.budgetUsed || 0) / program.budgetAllocated) * 100 : 0,
          type: program.type,
          status: program.status,
        })).filter(p => p.allocated > 0);
        res.json(budgetData);
        break;
        
      case "participantGrowth":
        // Participant analysis by program type
        const participantData = programs.reduce((acc: any[], program) => {
          const existing = acc.find(item => item.type === program.type);
          if (existing) {
            existing.totalParticipants += program.participants || 0;
            existing.programCount += 1;
            existing.avgParticipants = Math.round(existing.totalParticipants / existing.programCount);
          } else {
            acc.push({
              type: program.type,
              totalParticipants: program.participants || 0,
              programCount: 1,
              avgParticipants: program.participants || 0,
              status: program.status,
            });
          }
          return acc;
        }, []);
        res.json(participantData);
        break;
        
      case "programPerformance":
        // Performance metrics combining multiple factors
        const performanceData = programs.map(program => {
          const efficiency = program.participants ? (program.progress * program.participants) / 100 : 0;
          const budgetEfficiency = program.budgetAllocated ? 
            ((program.progress / 100) * (program.participants || 0)) / (program.budgetAllocated / 1000) : 0;
          
          return {
            name: program.name,
            progress: program.progress,
            participants: program.participants || 0,
            efficiency: Math.round(efficiency),
            budgetEfficiency: Math.round(budgetEfficiency * 10) / 10,
            status: program.status,
            type: program.type,
            score: Math.round((program.progress + efficiency + budgetEfficiency) / 3),
          };
        }).filter(p => p.participants > 0);
        res.json(performanceData);
        break;
        
      case "statusDistribution":
        // Real status distribution
        const statusData = programs.reduce((acc: any[], program) => {
          const existing = acc.find(item => item.status === program.status);
          if (existing) {
            existing.count += 1;
            existing.value += 1;
            existing.totalBudget += program.budgetAllocated || 0;
            existing.totalParticipants += program.participants || 0;
          } else {
            acc.push({
              status: program.status,
              count: 1,
              value: 1,
              totalBudget: program.budgetAllocated || 0,
              totalParticipants: program.participants || 0,
            });
          }
          return acc;
        }, []);
        res.json(statusData);
        break;
        
      case "typeComparison":
        // Program type comparison with real metrics
        const typeData = programs.reduce((acc: any[], program) => {
          const existing = acc.find(item => item.type === program.type);
          if (existing) {
            existing.count += 1;
            existing.totalBudget += program.budgetAllocated || 0;
            existing.totalParticipants += program.participants || 0;
            existing.avgProgress = Math.round((existing.avgProgress * (existing.count - 1) + program.progress) / existing.count);
          } else {
            acc.push({
              type: program.type,
              count: 1,
              totalBudget: program.budgetAllocated || 0,
              totalParticipants: program.participants || 0,
              avgProgress: program.progress,
            });
          }
          return acc;
        }, []);
        res.json(typeData);
        break;
        
      default:
        res.status(404).json({ error: "Data source not found" });
    }
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
});

// Get analytics data
router.get("/data", async (req, res) => {
  try {
    const [setting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, ANALYTICS_DATA_KEY));

    if (setting) {
      res.json(JSON.parse(setting.value));
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
});

// Save analytics data
router.post("/data", async (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "Data must be an array" });
    }

    const dataJson = JSON.stringify(data);

    // Check if setting exists
    const [existingSetting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, ANALYTICS_DATA_KEY));

    if (existingSetting) {
      // Update existing data
      await db
        .update(adminSettings)
        .set({ 
          value: dataJson,
          updatedAt: new Date()
        })
        .where(eq(adminSettings.key, ANALYTICS_DATA_KEY));
    } else {
      // Create new data
      await db.insert(adminSettings).values({
        key: ANALYTICS_DATA_KEY,
        value: dataJson,
        category: "analytics"
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error saving analytics data:", error);
    res.status(500).json({ error: "Failed to save analytics data" });
  }
});

export default router;