import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProgramSchema } from "@shared/schema";
import { useCreateProgram, useUpdateProgram } from "@/hooks/use-programs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Upload, X, Plus, Lightbulb, Check, ChevronsUpDown } from "lucide-react";
import type { Program, InsertProgram, ProgramSuggestion } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Enhanced form schema with proper validation (type field removed)
const formSchema = insertProgramSchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine((data) => {
  // Ensure required fields are provided
  if (!data.name || !data.color) {
    return false;
  }
  return true;
}, {
  message: "Name and color are required fields",
});

type FormData = z.infer<typeof formSchema>;

// Program types removed - each program is now independent

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const priorityOptions = [
  { value: "low", label: "Low Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "high", label: "High Priority" },
];

const categoryOptions = [
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "agriculture", label: "Agriculture" },
  { value: "technology", label: "Technology" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "social", label: "Social Development" },
];

const colorOptions = [
  { value: "#4A90A4", label: "Ocean Breeze" },
  { value: "#E67E22", label: "Sunset Orange" },
  { value: "#27AE60", label: "Forest Green" },
  { value: "#8E44AD", label: "Royal Purple" },
  { value: "#3498DB", label: "Sky Blue" },
  { value: "#F39C12", label: "Golden Yellow" },
  { value: "#E74C3C", label: "Crimson Red" },
  { value: "#95A5A6", label: "Storm Gray" },
  { value: "#2ECC71", label: "Emerald Green" },
  { value: "#E91E63", label: "Rose Pink" },
];

// Icon options removed - focusing on image uploads for visual representation

interface ProgramFormProps {
  program?: Program | null;
  onClose: () => void;
}

export function ProgramForm({ program, onClose }: ProgramFormProps) {
  const { toast } = useToast();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  
  const [suggestions, setSuggestions] = useState<ProgramSuggestion[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      progress: 0,
      participants: 0,
      budgetAllocated: 0,
      budgetUsed: 0,
      color: "#4A90A4",
      icon: "bullseye", // Default icon for compatibility
      startDate: "",
      endDate: "",
      image: "",
      imageUrl: "",
      tags: [],
      category: "",
      priority: "medium",
      metadata: {},
    },
  });

  // Fetch suggestions based on keyword
  const { data: keywordSuggestions } = useQuery({
    queryKey: ['/api/program-suggestions', searchKeyword],
    queryFn: async () => {
      if (!searchKeyword || searchKeyword.length < 2) return [];
      const response = await fetch(`/api/program-suggestions?keyword=${encodeURIComponent(searchKeyword)}`);
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: searchKeyword.length >= 2,
  });

  useEffect(() => {
    if (program) {
      const resetData = {
        name: program.name || "",
        description: program.description || "",
        status: program.status || "active",
        progress: program.progress || 0,
        participants: program.participants || 0,
        budgetAllocated: program.budgetAllocated || 0,
        budgetUsed: program.budgetUsed || 0,
        color: program.color || "#4A90A4",
        icon: program.icon || "bullseye",
        startDate: program.startDate ? new Date(program.startDate).toISOString().split('T')[0] : "",
        endDate: program.endDate ? new Date(program.endDate).toISOString().split('T')[0] : "",
        image: program.image || "",
        imageUrl: program.imageUrl || "",
        tags: program.tags || [],
        category: program.category || "",
        priority: (program.priority as "low" | "medium" | "high") || "medium",
        metadata: program.metadata || {},
      };
      form.reset(resetData);
      setImageUrl(program.imageUrl || "");
      setTags(program.tags || []);
    }
  }, [program, form]);

  // Watch name field for intelligent suggestions
  const watchedName = form.watch("name");
  useEffect(() => {
    if (watchedName && watchedName.length >= 2) {
      setSearchKeyword(watchedName);
    }
  }, [watchedName]);

  const handleSuggestionSelect = (suggestion: ProgramSuggestion) => {
    form.setValue("name", suggestion.name);
    form.setValue("description", suggestion.description || "");
    form.setValue("category", suggestion.category || "");
    form.setValue("priority", (suggestion.priority as "low" | "medium" | "high") || "medium");
    form.setValue("color", suggestion.defaultColor || "#4A90A4");
    // Icon removed - using default for compatibility
    if (suggestion.tags) {
      setTags(suggestion.tags);
      form.setValue("tags", suggestion.tags);
    }
    setShowSuggestions(false);
    toast({ description: "Program template applied successfully" });
  };

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      const newTags = [...tags, currentTag];
      setTags(newTags);
      form.setValue("tags", newTags);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        setUploadProgress(10);
        
        // Import image utilities
        const { fileToBase64, validateImageFile, compressImage, base64ToDataUrl } = await import('@/lib/imageUtils');
        
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        
        setUploadProgress(30);
        
        // Compress image if needed
        const processedFile = await compressImage(file);
        setUploadProgress(50);
        
        // Convert to base64
        const imageData = await fileToBase64(processedFile);
        setUploadProgress(80);
        
        // Create data URL for preview
        const dataUrl = base64ToDataUrl(imageData.data, imageData.type);
        
        // Update form with image data
        setSelectedImage(dataUrl);
        form.setValue("imageData", imageData.data);
        form.setValue("imageName", imageData.name);
        form.setValue("imageType", imageData.type);
        form.setValue("imageUrl", dataUrl); // For immediate preview
        
        setUploadProgress(100);
        toast({ description: "Image processed and ready to save! Will be stored in database." });
      } catch (error) {
        console.error('Image processing error:', error);
        toast({ 
          variant: "destructive", 
          description: error instanceof Error ? error.message : "Failed to process image. Please try again." 
        });
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      console.log("Submitting form data:", data);
      
      const programData: InsertProgram = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        tags: tags,
        imageUrl: imageUrl,
      };

      // Remove undefined fields to avoid validation issues
      Object.keys(programData).forEach(key => {
        if (programData[key as keyof InsertProgram] === undefined) {
          delete programData[key as keyof InsertProgram];
        }
      });

      if (program) {
        await updateProgram.mutateAsync({ id: program.id, program: programData });
        toast({ description: "Program updated successfully" });
      } else {
        await createProgram.mutateAsync(programData);
        toast({ description: "Program created successfully" });
      }

      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      toast({ 
        variant: "destructive",
        description: "Failed to save program. Please check all required fields." 
      });
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Intelligent Suggestions */}
          {keywordSuggestions && keywordSuggestions.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Suggestions based on your input:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywordSuggestions.map((suggestion: ProgramSuggestion) => (
                  <Button
                    key={suggestion.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="text-xs"
                  >
                    {suggestion.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Program Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter program name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    placeholder="Describe the program objectives and activities"
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label>Program Image</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Upload Image</Label>
                <div className="mt-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full"
                  />
                </div>
                {selectedImage && (
                  <div className="mt-2">
                    <img src={selectedImage} alt="Preview" className="w-full h-32 object-cover rounded" />
                  </div>
                )}
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-600">Or Enter Image URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://example.com/image.jpg"
                          onChange={(e) => {
                            field.onChange(e);
                            setImageUrl(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {imageUrl && (
                  <div className="mt-2">
                    <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tags Section */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer">
                  {tag}
                  <X
                    className="h-3 w-3 ml-1"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Progress and Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      min="0"
                      max="100"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Participants</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Budget Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="budgetAllocated"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Allocated</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budgetUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Used</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Visual Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: color.value }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon selection removed - focusing on image uploads */}
            <div className="space-y-2">
              <Label>Program Image</Label>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="flex flex-col items-center gap-4">
                    {isUploading ? (
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">
                          Uploading to Firebase Storage... {Math.round(uploadProgress)}%
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : selectedImage || imageUrl ? (
                      <div className="text-center">
                        <img 
                          src={selectedImage || imageUrl} 
                          alt="Program preview" 
                          className="w-32 h-20 object-cover rounded-lg mx-auto mb-2"
                        />
                        <div className="text-xs text-green-600 font-medium">
                          ✓ Image ready for database storage
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-4xl mb-2">📷</div>
                        <div className="text-sm text-muted-foreground">
                          Click to upload program image
                        </div>
                      </div>
                    )}
                    
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createProgram.isPending || updateProgram.isPending}
            >
              {createProgram.isPending || updateProgram.isPending ? (
                "Saving..."
              ) : program ? (
                "Update Program"
              ) : (
                "Create Program"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}