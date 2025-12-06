import { useState, useEffect } from "react";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge";
import { Loader2, Save, X } from "lucide-react";
import { UnifiedStreamDto, CorrelationKeyType } from "@/types/stream"; // Upewnij się, że masz import enumów

interface EditStreamDialogProps {
  stream: UnifiedStreamDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedStream: UnifiedStreamDto) => Promise<void>;
}

export function EditStreamDialog({ 
  stream, 
  open, 
  onOpenChange, 
  onSave 
}: EditStreamDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UnifiedStreamDto>>({});

  useEffect(() => {
    if (stream) {
      setFormData({ ...stream });
    }
  }, [stream]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stream) return;

    setIsLoading(true);
    try {
      await onSave({ ...stream, ...formData } as UnifiedStreamDto);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save stream", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open || !stream) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[600px] bg-[#09090b] border border-white/10 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex flex-col space-y-1.5 p-6 pb-2 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold leading-none tracking-tight text-white">Edit Stream</h3>
              <StreamTypeBadge type={stream.type} />
            </div>
            <button 
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-400">
            ID: <span className="font-mono text-xs opacity-70">{stream.id}</span>
          </p>
        </div>

        {/* Form Body - Scrollable if too long */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <form id="stream-form" onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Display Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-white">
                Display Name
              </label>
              <input
                id="name"
                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Technical Name */}
            <div className="space-y-2">
              <label htmlFor="technicalName" className="text-sm font-medium text-white">
                Technical Name (Topic/Table)
              </label>
              <input
                id="technicalName"
                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.technicalName || ''}
                onChange={(e) => setFormData({ ...formData, technicalName: e.target.value })}
              />
            </div>

            {/* Correlation Config Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="correlationKeyType" className="text-sm font-medium text-white">
                  Correlation Type
                </label>
                <select
                  id="correlationKeyType"
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  value={formData.correlationKeyType || ''}
                  // Zakładam rzutowanie na enum, w razie potrzeby dostosuj
                  onChange={(e) => setFormData({ ...formData, correlationKeyType: e.target.value as any })}
                >
                  <option value="HEADER" className="bg-[#09090b]">HEADER</option>
                  <option value="BODY" className="bg-[#09090b]">BODY</option>
                  <option value="KEY" className="bg-[#09090b]">KEY</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="correlationKeyName" className="text-sm font-medium text-white">
                  Key Name
                </label>
                <input
                  id="correlationKeyName"
                  placeholder="e.g. event_id"
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.correlationKeyName || ''}
                  onChange={(e) => setFormData({ ...formData, correlationKeyName: e.target.value })}
                />
              </div>
            </div>

            {/* Metadata (JSON/Text) */}
            <div className="space-y-2">
              <label htmlFor="metadata" className="text-sm font-medium text-white">
                Metadata (Optional)
              </label>
              <textarea
                id="metadata"
                rows={3}
                className="flex w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                value={formData.metadata || ''}
                onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-white/10 bg-[#09090b] rounded-b-xl">
          <button 
            type="button" 
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-white/10 bg-transparent hover:bg-white/10 text-white h-10 px-4 py-2"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="stream-form" // Linkujemy przycisk z formularzem ID
            disabled={isLoading} 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2 gap-2"
          >
            {isLoading && <Loader2 className="animate-spin" size={16} />}
            {!isLoading && <Save size={16} />}
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}