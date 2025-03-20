"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface PublishSettingsDialogProps {
  onSettingsChange: (settings: {
    category: string;
    tags: string[];
    featuredImage: File | null;
  }) => void;
}

export function PublishSettingsDialog({ onSettingsChange }: PublishSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    // Load categories and tags from localStorage
    const storedCategories = localStorage.getItem("wordpress_categories");
    const storedTags = localStorage.getItem("wordpress_tags");
    const storedSelectedCategory = localStorage.getItem("selected_category");
    const storedSelectedTags = localStorage.getItem("selected_tags");

    if (storedCategories) setCategories(JSON.parse(storedCategories));
    if (storedTags) setTags(JSON.parse(storedTags));
    if (storedSelectedCategory) setSelectedCategory(storedSelectedCategory);
    if (storedSelectedTags) setSelectedTags(JSON.parse(storedSelectedTags));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setFeaturedImage(file);
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  };

  const handleSaveSettings = () => {
    onSettingsChange({
      category: selectedCategory,
      tags: selectedTags,
      featuredImage: featuredImage,
    });
    setOpen(false);
  };

  const removeImage = () => {
    setFeaturedImage(null);
    setImagePreview("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Publish Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Featured Image Section */}
          <div className="space-y-2">
            <Label>Featured Image</Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => document.getElementById("featured-image")?.click()}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              <input
                type="file"
                id="featured-image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            {imagePreview && (
              <div className="relative mt-4 inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 rounded-lg object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Categories Section */}
          <div className="space-y-2">
            <Label>Category (Optional)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(categories).map(([id, name]) => (
                <Button
                  key={id}
                  variant={selectedCategory === id ? "default" : "outline"}
                  className="w-full justify-start truncate"
                  onClick={() => setSelectedCategory(id)}
                >
                  <span className="truncate">{name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-2">
            <Label>Tags (Optional)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(tags).map(([id, name]) => (
                <Button
                  key={id}
                  variant={selectedTags.includes(id) ? "default" : "outline"}
                  className="w-full justify-start truncate"
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(id)
                        ? prev.filter(t => t !== id)
                        : [...prev, id]
                    );
                  }}
                >
                  <span className="truncate">{name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 