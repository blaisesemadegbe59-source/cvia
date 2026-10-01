"use client";
import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Modal } from "./parts";
import { Loader2 } from "lucide-react";

async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const size = Math.min(800, Math.round(area.width));
  const canvas = document.createElement("canvas"); canvas.width = size; canvas.height = size;
  canvas.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("crop"))), "image/jpeg", 0.88));
}

export function PhotoCropper({ file, round, onCancel, onDone }: { file: File | null; round: boolean; onCancel: () => void; onDone: (blob: Blob) => Promise<void> }) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 }); const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null); const [busy, setBusy] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  if (file && file !== lastFile) { setLastFile(file); setSrc(URL.createObjectURL(file)); setZoom(1); setCrop({ x: 0, y: 0 }); }
  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);
  async function save() {
    if (!src || !area) return;
    setBusy(true);
    try { await onDone(await cropToBlob(src, area)); } finally { setBusy(false); }
  }
  return (
    <Modal open={!!file} onClose={onCancel} title="Recadrer la photo">
      <div className="relative h-72 overflow-hidden rounded-2xl bg-stone-900">
        {src && <Cropper image={src} crop={crop} zoom={zoom} aspect={1} cropShape={round ? "round" : "rect"} showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onComplete} />}
      </div>
      <label className="label mt-4" htmlFor="zoom">Zoom</label>
      <input id="zoom" type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-brand-700" />
      <p className="mt-2 text-xs text-stone-500">Cadrez votre visage, fond neutre de préférence. La photo est redimensionnée et nettoyée automatiquement.</p>
      <div className="mt-5 flex gap-3">
        <button className="btn btn-outline flex-1" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary flex-1" onClick={save} disabled={busy}>{busy && <Loader2 className="animate-spin" size={16} />}Valider</button>
      </div>
    </Modal>
  );
}
