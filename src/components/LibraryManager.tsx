import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Folder, Edit2, Trash2, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LibraryFolder {
  id: string;
  name: string;
  color: string;
  created_at: string;
  novel_count?: number;
}

interface LibraryManagerProps {
  userId: string;
}

export const LibraryManager = ({ userId }: LibraryManagerProps) => {
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#8B5CF6");
  const [editingFolder, setEditingFolder] = useState<LibraryFolder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const predefinedColors = [
    "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", 
    "#EF4444", "#EC4899", "#6366F1", "#84CC16"
  ];

  useEffect(() => {
    fetchFolders();
  }, [userId]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from("library_folders")
        .select(`
          *,
          library_items(count)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const foldersWithCount = data?.map(folder => ({
        ...folder,
        novel_count: folder.library_items?.length || 0
      })) || [];

      setFolders(foldersWithCount);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load library folders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from("library_folders")
        .insert({
          user_id: userId,
          name: newFolderName.trim(),
          color: newFolderColor,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder created successfully",
      });

      setNewFolderName("");
      setNewFolderColor("#8B5CF6");
      setDialogOpen(false);
      fetchFolders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  const updateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from("library_folders")
        .update({
          name: newFolderName.trim(),
          color: newFolderColor,
        })
        .eq("id", editingFolder.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder updated successfully",
      });

      setEditingFolder(null);
      setNewFolderName("");
      setNewFolderColor("#8B5CF6");
      setDialogOpen(false);
      fetchFolders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update folder",
        variant: "destructive",
      });
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from("library_folders")
        .delete()
        .eq("id", folderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });

      fetchFolders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete folder",
        variant: "destructive",
      });
    }
  };

  const startEdit = (folder: LibraryFolder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderColor(folder.color);
    setDialogOpen(true);
  };

  const resetDialog = () => {
    setEditingFolder(null);
    setNewFolderName("");
    setNewFolderColor("#8B5CF6");
    setDialogOpen(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading folders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Library Folders</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetDialog} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFolder ? "Edit Folder" : "Create New Folder"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Choose Color</p>
                <div className="flex gap-2 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newFolderColor === color ? "border-foreground" : "border-muted"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewFolderColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={editingFolder ? updateFolder : createFolder}
                  className="bg-gradient-primary flex-1"
                >
                  {editingFolder ? "Update" : "Create"}
                </Button>
                <Button variant="outline" onClick={resetDialog}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <Card key={folder.id} className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder
                    className="h-5 w-5"
                    style={{ color: folder.color }}
                  />
                  <CardTitle className="text-lg truncate">{folder.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(folder)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFolder(folder.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">
                  {folder.novel_count || 0} novels
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {folders.length === 0 && (
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardContent className="text-center py-8">
            <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No folders yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first folder to organize your library
            </p>
            <Button onClick={resetDialog} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};