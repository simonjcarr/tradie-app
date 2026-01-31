"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Loader2 } from "lucide-react";

interface NoteImageThumbnailsProps {
  noteId: Id<"taskNotes">;
  onImageDeleted?: () => void;
}

interface ImageWithUrl {
  _id: Id<"noteImages">;
  fileName: string;
  url: string;
}

export function NoteImageThumbnails({ noteId, onImageDeleted }: NoteImageThumbnailsProps) {
  const [selectedImage, setSelectedImage] = useState<ImageWithUrl | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  
  const images = useQuery(api.noteImages.getNoteImages, { noteId });
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
      onImageDeleted?.();
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
      <div className="flex flex-wrap gap-2 mt-2">
        {isLoadingUrls && images.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading images...
          </div>
        )}
        {images.map((image: { _id: Id<"noteImages">; fileName: string }) => (
          <button
            key={image._id}
            onClick={() => handleImageClick(image)}
            disabled={!imageUrls[image._id]}
            className="relative group disabled:opacity-50"
          >
            {imageUrls[image._id] ? (
              <img
                src={imageUrls[image._id]}
                alt={image.fileName}
                className="w-16 h-16 object-cover rounded-md border hover:border-primary transition-colors"
              />
            ) : (
              <div className="w-16 h-16 rounded-md border bg-muted flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>

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
