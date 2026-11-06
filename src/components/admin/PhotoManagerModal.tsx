'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { VehicleUnit, UnitImage } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { compressImageToWebP } from '@/lib/compressor';
import {
  X,
  Upload,
  Trash2,
  Loader2,
  Camera,
  AlertCircle,
  CheckCircle2,
  Images,
} from 'lucide-react';

interface PhotoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: VehicleUnit | null;
  onPhotosUpdated: () => void;
}

export default function PhotoManagerModal({
  isOpen,
  onClose,
  unit,
  onPhotosUpdated,
}: PhotoManagerModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [photos, setPhotos] = useState<UnitImage[]>(unit?.images || []);
  const [uploading, setUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync photos when unit changes
  if (unit && unit.images && photos !== unit.images && !uploading && !deletingId) {
    setPhotos(unit.images);
  }

  if (!isOpen || !unit) return null;

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (photos.length + files.length > 40) {
      setErrorMsg(`Maximum 40 photos allowed per vehicle. Current count: ${photos.length}.`);
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const supabase = createClient();
    const startingOrder =
      photos.length > 0 ? Math.max(...photos.map((p) => p.display_order)) + 1 : 1;

    try {
      const newImagesList: UnitImage[] = [...photos];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const stepNum = i + 1;
        setProgressMsg(`Compressing image ${stepNum} of ${files.length}...`);

        // Compress client-side to optimized WebP (~100KB-140KB)
        const compressedWebP = await compressImageToWebP(file, 1600, 0.82);

        setProgressMsg(`Uploading photo ${stepNum} of ${files.length} to storage...`);
        const storagePath = `${unit.id}/${Date.now()}_${i}.webp`;

        const { error: storageError } = await supabase.storage
          .from('vehicle-photos')
          .upload(storagePath, compressedWebP, {
            contentType: 'image/webp',
            upsert: false,
          });

        if (storageError) {
          throw new Error(`Storage upload failed: ${storageError.message}`);
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('vehicle-photos')
          .getPublicUrl(storagePath);

        const displayOrder = startingOrder + i;

        setProgressMsg(`Registering photo record ${stepNum} of ${files.length}...`);
        const { data: insertedRecord, error: dbError } = await supabase
          .from('unit_images')
          .insert({
            unit_id: unit.id,
            image_url: publicUrlData.publicUrl,
            storage_path: storagePath,
            display_order: displayOrder,
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(`Database record creation failed: ${dbError.message}`);
        }

        if (insertedRecord) {
          newImagesList.push(insertedRecord);
        }
      }

      setPhotos(newImagesList.sort((a, b) => a.display_order - b.display_order));
      setSuccessMsg(`Successfully uploaded and compressed ${files.length} photos!`);
      onPhotosUpdated();
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during upload.');
    } finally {
      setUploading(false);
      setProgressMsg('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photo: UnitImage) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    setDeletingId(photo.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const supabase = createClient();

      // Delete file from Supabase Storage
      if (photo.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('vehicle-photos')
          .remove([photo.storage_path]);

        if (storageError) {
          console.warn('Storage file deletion notice:', storageError.message);
        }
      }

      // Delete database row from unit_images
      const { error: dbError } = await supabase
        .from('unit_images')
        .delete()
        .eq('id', photo.id);

      if (dbError) {
        throw new Error(`Failed to delete photo record: ${dbError.message}`);
      }

      const updated = photos.filter((p) => p.id !== photo.id);
      setPhotos(updated);
      setSuccessMsg('Photo deleted successfully.');
      onPhotosUpdated();
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete photo.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl my-8 text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Photo Manager: {unit.year} {unit.make} {unit.model}
              </h2>
              <p className="text-xs text-zinc-400">
                {photos.length} of 40 photos uploaded • Client-side WebP compression applied
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Upload Dropzone / Button */}
        <div className="mt-5 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFilesSelected}
            disabled={uploading || photos.length >= 40}
            className="hidden"
            id="multi-photo-upload"
          />

          <label
            htmlFor="multi-photo-upload"
            className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
              uploading || photos.length >= 40
                ? 'border-zinc-800 bg-zinc-950/40 opacity-50 cursor-not-allowed'
                : 'border-zinc-700 hover:border-amber-500/70 bg-zinc-950/60 hover:bg-zinc-950'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <span className="text-xs font-semibold text-white">{progressMsg}</span>
                <span className="text-[11px] text-zinc-400">
                  Compressing to WebP and uploading to Supabase Storage...
                </span>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-white block">
                    Click to browse or drop vehicle photos
                  </span>
                  <span className="text-xs text-zinc-400 block mt-0.5">
                    Select up to 40 photos (JPEG, PNG, HEIC, WebP). Files are compressed to WebP (~100KB-140KB).
                  </span>
                </div>
              </>
            )}
          </label>
        </div>

        {/* Photos Grid */}
        <div className="mt-6 flex-1 overflow-y-auto pr-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Images className="w-4 h-4" />
              <span>Current Gallery ({photos.length})</span>
            </span>
            <span className="text-[11px] text-zinc-500">
              First image serves as the public cover photo
            </span>
          </div>

          {photos.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-8 text-center text-zinc-500 text-xs">
              No photos currently uploaded for this vehicle.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950"
                >
                  <Image
                    src={photo.image_url}
                    alt={`Photo #${photo.display_order}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />

                  {/* Order Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                    {idx === 0 ? 'Cover (#1)' : `#${photo.display_order}`}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo)}
                    disabled={deletingId === photo.id}
                    aria-label="Delete photo"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md transition-opacity opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {deletingId === photo.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-zinc-800 flex justify-end shrink-0 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

