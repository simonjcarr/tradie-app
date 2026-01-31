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

interface ImageWithUrl {
  _id: Id<"noteImages">;
  fileName: string;
  url: string;
}

export function TaskImageGallery({ taskId }: TaskImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageWithUrl | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  
  const images = useQuery(api.noteImages.getTaskImages, { taskId });
  const deleteImage = useMutation(api.noteImages.deleteImage);
  const generateDownloadUrls = useAction(api.noteImages.generateDownloadUrls);

  // Fetch presigned URLs for images
  const fetchImageUrls = useCallback(async () => {
    if (!images || images.length === 0) return;
    
    setIsLoadingUrls(true);
    try {
      const imageIds = images.map((img: { _id: Id<"noteImages"> }) => img._id);
      const { urls } = await generateDownloadUrls({ imageIds });
      setImageUrls(urls);
    } catch (error) {
      console.error("Failed to fetch image URLs:", error);
    } finally {
      setIsLoadingUrls(false);
    }
  }, [images, generateDownloadUrls]);

  // Fetch URLs when images change
  useEffect(() => {
    fetchImageUrls();
  }, [fetchImageUrls]);

  const handleDelete = async (imageId: Id<"noteImages">) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    try {
      await deleteImage({ id: imageId });
      setSelectedImage(null);
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  const handleImageClick = (image: { _id: Id<"noteImages">; fileName: string }) => {
    const url = imageUrls[image._id];
    if (url) {
      setSelectedImage({
        _id: image._id,
        fileName: image.fileName,
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
            {images.map((image: { _id: Id<"noteImages">; fileName: string }) => (
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
                onClick={() => selectedImage && handleDelete(selectedImage._id)}
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
