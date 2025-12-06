import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StreamTypeBadge } from "@/components/shared/StreamTypeBadge"; // Twój badge!
import { Loader2, Save } from "lucide-react";
import { ConnectionDto } from "@/types/connection";

export interface EditConnectionDialogProps {
  connection: ConnectionDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedConnection: ConnectionDto) => Promise<void>;
}

// Zakładam taki typ na podstawie Twojego screena
export function EditConnectionDialog({ 
  connection, 
  open, 
  onOpenChange, 
  onSave 
}: EditConnectionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ConnectionDto>>({});

  // Reset formularza przy otwarciu
  useEffect(() => {
    if (connection) {
      setFormData({
        ...connection
      });
    }
  }, [connection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connection) return;

    setIsLoading(true);
    try {
      // Scalamy stare dane z nowymi
      await onSave({ ...connection, ...formData } as ConnectionDto);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save", error);
      // Tu możesz dodać toast notification
    } finally {
      setIsLoading(false);
    }
  };

  if (!connection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <DialogTitle>Edit Connection</DialogTitle>
            <StreamTypeBadge type={connection.type} />
          </div>
          <DialogDescription>
            Make changes to your connection details here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          
          {/* Nazwa - zazwyczaj edytowalna */}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-background-main/50"
            />
          </div>

          {/* Host - wspólne dla wszystkich */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={formData.host || ''}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="bg-background-main/50 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                value={formData.port || ''}
                onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                className="bg-background-main/50 font-mono"
                type="number"
              />
            </div>
          </div>

          {/* Pola specyficzne dla Typu - przykład warunkowego renderowania */}
          {connection.type === 'POSTGRES' && (
            <div className="space-y-2 p-3 rounded-md bg-blue-500/5 border border-blue-500/10">
              <Label className="text-blue-400 text-xs uppercase font-bold">Postgres Specific</Label>
              <Input 
                 placeholder="Database Name" 
                 className="bg-background-main/50"
                 // Tutaj logika do obsługi specyficznych pól, np. zapis do formData.config
              />
            </div>
          )}
 
          {connection.type === 'KAFKA' && (
             <div className="space-y-2 p-3 rounded-md bg-purple-500/5 border border-purple-500/10">
             <Label className="text-purple-400 text-xs uppercase font-bold">Kafka Properties</Label>
             <Input 
                placeholder="Topic Filter (Regex)" 
                className="bg-background-main/50"
             />
           </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="animate-spin" size={16} />}
              {!isLoading && <Save size={16} />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}