import { useState, useRef } from "react";

export default function ScanRoad() {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <main className="min-h-screen bg-surface pt-32 px-8 pb-20">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-headline font-bold">Road Scan Engine</h1>
          <p className="text-on-surface-variant">Upload an image of a damaged road to analyze pothole severity using our YOLOv12 architecture.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div 
            className="border-2 border-dashed border-outline-variant rounded-2xl p-12 text-center aspect-square flex flex-col items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg, image/png"
              onChange={handleFileChange} 
            />
            <span className="material-symbols-outlined text-6xl text-primary/50 mb-4 group-hover:text-primary transition-colors">cloud_upload</span>
            <h3 className="font-headline font-bold text-xl mb-2">Drag & Drop Image</h3>
            <p className="text-on-surface-variant text-sm mb-6">or click to browse local files (JPG, PNG)</p>
            <button className="btn-gradient px-8 py-3 rounded-md font-headline font-bold text-on-primary-container hover:brightness-110 active:scale-95 transition-all">
              {file ? 'Change Image' : 'Select Image'}
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-8 flex flex-col justify-between border border-outline-variant/10 shadow-xl shadow-primary/5">
            <div>
              <h3 className="font-headline font-bold text-xl mb-6">Inference Results</h3>
              <div className="flex flex-col items-center justify-center h-48 space-y-4 text-on-surface-variant/50">
                <span className="material-symbols-outlined text-4xl animate-pulse">model_training</span>
                <p>{file ? `Analyzing ${file.name}...` : 'Waiting for image upload...'}</p>
              </div>
            </div>
            <div className="pt-6 border-t border-outline-variant/20 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Model</span>
                <span className="font-bold text-primary">YOLOv12 Target Inference</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Confidence</span>
                <span className="font-bold text-primary">---</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
