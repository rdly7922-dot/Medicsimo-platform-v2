/**
 * VisualExamModule.jsx — category: 'visual_diagnostic'
 * Covers: Dermatology, Ophthalmology, ENT
 * Before/after photo comparison + media upload for visual conditions.
 */
import React, { useState, useRef } from "react";
import { Camera, Upload, ChevronLeft, ChevronRight, Eye } from "lucide-react";

export default function VisualExamModule({ patientId, examType = "dermatology" }) {
  const [photos, setPhotos] = useState([]); // [{ url, label, date }]
  const [activeIdx, setActiveIdx] = useState(0);
  const fileRef = useRef(null);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files ?? []);
    const newPhotos = files.map((f) => ({
      url: URL.createObjectURL(f),
      label: "New capture",
      date: new Date().toISOString(),
    }));
    setPhotos((p) => [...p, ...newPhotos]);
  };

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-teal-300" />
          <h3 className="font-bold text-white text-base md:text-lg capitalize">
            Visual Exam — {examType}
          </h3>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-500/15 border border-teal-400/30 text-teal-300 text-sm font-semibold active:scale-95 transition-all"
        >
          <Camera className="w-4 h-4" /> Add Photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple capture="environment"
          className="hidden" onChange={handleUpload} />
      </div>

      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-white/10 rounded-xl py-14 flex flex-col items-center gap-2 text-slate-500">
          <Upload className="w-8 h-8" />
          <p className="text-sm">No images yet — tap "Add Photo" to capture the first exam image</p>
        </div>
      ) : (
        <div className="relative">
          <img
            src={photos[activeIdx].url}
            alt={`Exam capture ${activeIdx + 1}`}
            className="w-full h-64 md:h-80 object-cover rounded-xl border border-white/10"
          />
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                className="absolute start-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveIdx((i) => Math.min(photos.length - 1, i + 1))}
                className="absolute end-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <div className="absolute bottom-2 start-2 bg-black/60 rounded-lg px-2.5 py-1 text-xs text-white">
            {activeIdx + 1} / {photos.length} · {new Date(photos[activeIdx].date).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button key={i} onClick={() => setActiveIdx(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${i === activeIdx ? "border-teal-400" : "border-white/10"}`}>
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
