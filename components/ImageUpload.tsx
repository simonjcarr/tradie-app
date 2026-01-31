"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  noteId: Id<"taskNotes">;
  taskId: Id<"tasks">;
  onUploadComplete?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function ImageUpload({ noteId, taskId, onUploadComplete }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useAction(api.noteImages.generateUploadUrl);
  const saveImage = useMutation(api.noteImages.saveImage);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please select a valid image file (JPEG, PNG, GIF, or WebP)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 10MB";
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // Step 1: Get presigned upload URL
      const { uploadUrl, storageId } = await generateUploadUrl({
        noteId,
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        size: selectedFile.size,
      });

      // Step 2: Upload file to R2
      console.log("Uploading to R2:", uploadUrl);
      let uploadResponse;
      try {
        uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: selectedFile,
          headers: {
            "Content-Type": selectedFile.type,
          },
        });
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw new Error(`Network error uploading image: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("R2 upload failed:", uploadResponse.status, errorText);
        throw new Error(`Failed to upload image: ${uploadResponse.status} ${errorText}`);
      }

      // Step 3: Save image metadata to database
      await saveImage({
        noteId,
        taskId,
        storageId,
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        size: selectedFile.size,
      });

      // Reset state
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      onUploadComplete?.();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, noteId, taskId, generateUploadUrl, saveImage, onUploadComplete]);

  const handleCancel = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
      
      {!selectedFile ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <ImagePlus className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      ) : (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
          <span className="text-sm truncate flex-1">{selectedFile.name}</span>
          <span className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
