import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeEntry } from '@/types';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';

interface EditTimeEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entry: TimeEntry | null;
}

export const EditTimeEntryDialog: React.FC<EditTimeEntryDialogProps> = ({
  isOpen,
  onClose,
  entry
}) => {
  const { updateTimeEntry, settings } = useApp();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    duration: '',
    task: '',
    project: '',
    date: ''
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        duration: entry.duration.toString(),
        task: entry.task,
        project: entry.project,
        date: entry.date
      });
    }
  }, [entry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entry) return;

    const duration = parseFloat(formData.duration);
    if (isNaN(duration) || duration <= 0) {
      toast({
        title: "Invalid Duration",
        description: "Please enter a valid duration greater than 0",
        variant: "destructive"
      });
      return;
    }

    updateTimeEntry(entry.id, {
      duration,
      task: formData.task,
      project: formData.project,
      date: formData.date
    });

    toast({
      title: "Entry Updated",
      description: "Time entry has been successfully updated"
    });

    onClose();
  };

  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Time Entry</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              step="0.25"
              min="0.25"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="task">Task</Label>
            <Select value={formData.task} onValueChange={(value) => setFormData({ ...formData, task: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                {settings.taskTypes.map((taskType) => (
                  <SelectItem key={taskType.id} value={taskType.name}>
                    {taskType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="project">Project</Label>
            <Select value={formData.project} onValueChange={(value) => setFormData({ ...formData, project: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {settings.projects.map((project) => (
                  <SelectItem key={project.id} value={project.name}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-none">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 rounded-none">
              Update Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};