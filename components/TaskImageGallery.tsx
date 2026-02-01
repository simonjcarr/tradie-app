"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, ImageIcon, Trash2, Loader2 } from "lucide-react";

interface TaskImageGalleryProps {
  taskId: Id<"tasks">;
}

interface ImageItem {
  _id: Id<"taskImages"> | Id<"noteImages">;
  fileName: string;
  source: 'task' | 'note';
}

interface ImageWithUrl extends ImageItem {
  url: string;
}

export function TaskImageGallery({ taskId }: TaskImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageWithUrl | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  
  const images = useQuery(api.taskImages.getAllTaskImages, { taskId });
  const deleteTaskImage = useMutation(api.taskImages.deleteImage);
  const deleteNoteImage = useMutation(api.noteImages.deleteImage);
  const generateTaskImageUrls = useAction(api.taskImages.generateDownloadUrls);
  const generateNoteImageUrls = useAction(api.noteImages.generateDownloadUrls);

  // Fetch presigned URLs for images
  const fetchImageUrls = useCallback(async () => {
    if (!images || images.length === 0) return;
    
    setIsLoadingUrls(true);
    try {
      // Separate task images and note images
      const taskImageIds = images
        .filter(img => img.source === 'task')
        .map((img: { _id: Id<"taskImages"> }) => img._id);
      
      const noteImageIds = images
        .filter(img => img.source === 'note')
        .map((img: { _id: Id<"noteImages"> }) => img._id);

      // Fetch URLs for both types
      const [taskUrlsResult, noteUrlsResult] = await Promise.all([
        taskImageIds.length > 0 ? generateTaskImageUrls({ imageIds: taskImageIds }) : Promise.resolve({ urls: {} }),
        noteImageIds.length > 0 ? generateNoteImageUrls({ imageIds: noteImageIds }) : Promise.resolve({ urls: {} }),
      ]);

      // Merge URLs
      setImageUrls({
        ...taskUrlsResult.urls,
        ...noteUrlsResult.urls,
      });
    } catch (error) {
      console.error("Failed to fetch image URLs:", error);
    } finally {
      setIsLoadingUrls(false);
    }
  }, [images, generateTaskImageUrls, generateNoteImageUrls]);

  // Fetch URLs when images change
  useEffect(() => {
    fetchImageUrls();
  }, [fetchImageUrls]);

  const handleDelete = async (image: ImageItem) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    try {
      if (image.source === 'task') {
        await deleteTaskImage({ id: image._id as Id<"taskImages"> });
      } else {
        await deleteNoteImage({ id: image._id as Id<"noteImages"> });
      }
      setSelectedImage(null);
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  const handleImageClick = (image: ImageItem) => {
    const url = imageUrls[image._id];
    if (url) {
      setSelectedImage({
        ...image,
        url,
      });
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg p-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              <span className="font-semibold">All Images</span>
              <span className="text-sm text-muted-foreground">({images.length})</span>
              {isLoadingUrls && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {images.map((image: ImageItem) => (
              <button
                key={image._id}
                onClick={() => handleImageClick(image)}
                disabled={!imageUrls[image._id]}
                className="relative group aspect-square disabled:opacity-50"
              >
                {imageUrls[image._id] ? (
                  <img
                    src={imageUrls[image._id]}
                    alt={image.fileName}
                    className="w-full h-full object-cover rounded-md border hover:border-primary transition-colors"
                  />
                ) : (
                  <div className="w-full h-full rounded-md border bg-muted flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedImage?.fileName}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => selectedImage && handleDelete(selectedImage)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={selectedImage.url}
                alt={selectedImage.fileName}
                className="max-w-full max-h-[60vh] object-contain rounded-md"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
