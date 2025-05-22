
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Edit3, Save, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LessonContent, LessonActivity, Differentiations, AssessmentType, ASSESSMENT_TYPES, lessonSectionTitles } from '@/types/lesson';
import { useToast } from '@/hooks/use-toast';

type SectionKey = keyof Omit<LessonContent, 'id' | 'grade' | 'date' | 'learnerLevel' | 'user_id'>;

interface LessonSectionCardProps {
  planId: string;
  sectionKey: SectionKey;
  sectionTitle: string;
  initialData: LessonContent[SectionKey];
  onSave: (planId: string, updatedFullContent: LessonContent) => Promise<{ success: boolean; data?: LessonContent; error?: string }>;
  getFullContent: () => LessonContent;
}

const MAX_TEXTAREA_CHARS = 200;

export const LessonSectionCard: React.FC<LessonSectionCardProps> = ({
  planId,
  sectionKey,
  sectionTitle,
  initialData,
  onSave,
  getFullContent,
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentData, setCurrentData] = useState(initialData);
  const [editData, setEditData] = useState(initialData);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    setCurrentData(initialData);
    setEditData(initialData);
    setHasChanged(false);
  }, [initialData]);
  
  useEffect(() => {
    setHasChanged(JSON.stringify(editData) !== JSON.stringify(currentData));
  }, [editData, currentData]);

  const handleToggleEdit = () => {
    if (isEditing) { // Cancel
      setEditData(currentData); // Reset changes
    }
    setIsEditing(!isEditing);
    if (!isOpen && !isEditing) setIsOpen(true); // Open if starting to edit
  };

  const handleSave = async () => {
    const fullContent = getFullContent();
    const updatedFullContent = {
      ...fullContent,
      [sectionKey]: editData,
    };

    const { success, data: savedData, error } = await onSave(planId, updatedFullContent);
    if (success && savedData) {
      setCurrentData(savedData[sectionKey]);
      setEditData(savedData[sectionKey]);
      setIsEditing(false);
      toast({ title: "Saved!", description: `${sectionTitle} updated successfully.` });
    } else {
      toast({ variant: "destructive", title: "Save Failed", description: error || "Could not save changes." });
    }
  };

  const renderDisplayValue = () => {
    if (Array.isArray(currentData)) {
      if (sectionKey === 'materialsNeeded') {
        return (currentData as string[]).length > 0 ? (currentData as string[]).join(', ') : <span className="text-muted-foreground">Not specified</span>;
      }
      if (sectionKey === 'mainActivities') {
        return (currentData as LessonActivity[]).map((activity, index) => (
          <div key={index} className="mb-2 p-2 border rounded">
            <p className="font-semibold">{activity.title || `Activity ${index + 1}`}</p>
            <p className="text-sm whitespace-pre-wrap">{activity.description || <span className="text-muted-foreground">No description</span>}</p>
          </div>
        )).length > 0 ? (currentData as LessonActivity[]).map((activity, index) => (
          <div key={index} className="mb-2 p-2 border rounded">
            <p className="font-semibold">{activity.title || `Activity ${index + 1}`}</p>
            <p className="text-sm whitespace-pre-wrap">{activity.description || <span className="text-muted-foreground">No description</span>}</p>
          </div>
        )) : <span className="text-muted-foreground">No activities</span>;
      }
    }
    if (typeof currentData === 'object' && currentData !== null) {
      if (sectionKey === 'differentiations') {
        const diffData = currentData as Differentiations;
        return (
          <ul className="list-disc pl-5 space-y-1">
            {Object.entries(diffData).map(([key, value]) => (
              <li key={key}>
                <span className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                {value || <span className="text-muted-foreground">Not specified</span>}
              </li>
            ))}
          </ul>
        );
      }
    }
    if (typeof currentData === 'string') {
      return currentData || <span className="text-muted-foreground">Not specified</span>;
    }
    return <span className="text-muted-foreground">Not specified</span>;
  };
  
  const getSummary = (data: any) => {
    if (typeof data === 'string') return data.substring(0, 60) + (data.length > 60 ? '...' : '');
    if (Array.isArray(data)) return data.length > 0 ? `${data.length} items` : 'Empty';
    if (typeof data === 'object' && data !== null) return Object.keys(data).length > 0 ? `${Object.keys(data).length} properties` : 'Empty';
    return 'No data';
  }

  const renderEditField = () => {
    // String fields (lessonTopic, themeOfWeek, learningObjective, introduction, extensionActivity, conclusion, evaluation, teacherReflection)
    if (typeof editData === 'string' && 
        ['lessonTopic', 'themeOfWeek', 'learningObjective', 'introduction', 'extensionActivity', 'conclusion', 'evaluation', 'teacherReflection'].includes(sectionKey)) {
      return (
        <div>
          <Textarea
            value={editData}
            onChange={(e) => setEditData(e.target.value.substring(0, MAX_TEXTAREA_CHARS))}
            placeholder={`Enter ${sectionTitle.toLowerCase()}...`}
            rows={4}
            maxLength={MAX_TEXTAREA_CHARS}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{editData.length}/{MAX_TEXTAREA_CHARS}</p>
        </div>
      );
    }

    // materialsNeeded: string[]
    if (sectionKey === 'materialsNeeded' && Array.isArray(editData)) {
      const materials = editData as string[];
      const addMaterial = (material: string) => {
        if (material.trim() && !materials.includes(material.trim())) {
          setEditData([...materials, material.trim()]);
        }
      };
      const removeMaterial = (index: number) => {
        setEditData(materials.filter((_, i) => i !== index));
      };
      return (
        <div>
          {materials.map((mat, index) => (
            <div key={index} className="flex items-center gap-2 mb-2 bg-secondary/20 p-2 rounded">
              <span>{mat}</span>
              <Button variant="ghost" size="icon" onClick={() => removeMaterial(index)} className="ml-auto h-6 w-6"><XCircle className="h-4 w-4" /></Button>
            </div>
          ))}
          <form
            className="flex gap-2 mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('materialInput') as HTMLInputElement;
              if (input) {
                 addMaterial(input.value);
                 input.value = '';
              }
            }}
          >
            <Input name="materialInput" placeholder="Add material" className="flex-grow" />
            <Button type="submit">Add</Button>
          </form>
        </div>
      );
    }
    
    // mainActivities: LessonActivity[]
    if (sectionKey === 'mainActivities' && Array.isArray(editData)) {
      const activities = editData as LessonActivity[];
      const updateActivity = (index: number, field: keyof LessonActivity, value: string) => {
        const newActivities = [...activities];
        newActivities[index] = { ...newActivities[index], [field]: value };
        setEditData(newActivities);
      };
      const addActivity = () => setEditData([...activities, { title: '', description: '' }]);
      const removeActivity = (index: number) => setEditData(activities.filter((_, i) => i !== index));

      return (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="p-3 border rounded space-y-2">
              <Label htmlFor={`activity-title-${index}`}>Activity {index + 1} Title</Label>
              <Input 
                id={`activity-title-${index}`}
                value={activity.title} 
                onChange={(e) => updateActivity(index, 'title', e.target.value)}
                placeholder="Activity Title" 
              />
              <Label htmlFor={`activity-desc-${index}`}>Description</Label>
              <Textarea 
                id={`activity-desc-${index}`}
                value={activity.description} 
                onChange={(e) => updateActivity(index, 'description', e.target.value)}
                placeholder="Activity Description"
                rows={3}
              />
              {activities.length > 1 && <Button variant="outline" size="sm" onClick={() => removeActivity(index)}>Remove Activity</Button>}
            </div>
          ))}
          <Button variant="outline" onClick={addActivity}>Add Activity</Button>
        </div>
      );
    }

    // differentiations: Differentiations (object)
    if (sectionKey === 'differentiations' && typeof editData === 'object' && editData !== null) {
        const diffData = editData as Differentiations;
        const updateDiff = (key: keyof Differentiations, value: string) => {
            setEditData({ ...diffData, [key]: value });
        };
        const diffLabels: Record<keyof Differentiations, string> = {
            strugglingLearners: "Support for Struggling Learners",
            onTrackLearners: "Activities for On-Track Learners",
            advancedLearners: "Challenge for Advanced Learners",
            accommodations: "Accommodations/Modifications (IEPs, 504s, ELLs)"
        };
        return (
            <div className="space-y-3">
                {(Object.keys(diffData) as Array<keyof Differentiations>).map(key => (
                    <div key={key}>
                        <Label htmlFor={`diff-${key}`}>{diffLabels[key]}</Label>
                        <Textarea
                            id={`diff-${key}`}
                            value={diffData[key]}
                            onChange={(e) => updateDiff(key, e.target.value.substring(0, MAX_TEXTAREA_CHARS))}
                            placeholder={`Describe ${diffLabels[key].toLowerCase()}`}
                            rows={3}
                            maxLength={MAX_TEXTAREA_CHARS}
                        />
                         <p className="text-xs text-muted-foreground mt-1 text-right">{diffData[key]?.length || 0}/{MAX_TEXTAREA_CHARS}</p>
                    </div>
                ))}
            </div>
        );
    }
    
    // assessmentType: AssessmentType (enum)
    if (sectionKey === 'assessmentType') {
      return (
        <RadioGroup
          value={editData as AssessmentType}
          onValueChange={(value) => setEditData(value as AssessmentType)}
          className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
        >
          {ASSESSMENT_TYPES.map((type) => (
            <div key={type} className="flex items-center space-x-3">
              <RadioGroupItem value={type} id={`${sectionKey}-${type}`} />
              <Label htmlFor={`${sectionKey}-${type}`} className="font-normal capitalize">{type}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    return <p className="text-red-500">Edit mode not implemented for this section type.</p>;
  };

  return (
    <Card className={cn("shadow-md rounded-lg mb-4", isEditing && "ring-2 ring-primary")}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
            <div>
              <CardTitle className="text-lg">{sectionTitle}</CardTitle>
              {!isOpen && <p className="text-sm text-muted-foreground truncate max-w-xs sm:max-w-sm md:max-w-md">{getSummary(currentData)}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleToggleEdit(); }} className="h-8 w-8">
                {isEditing ? <XCircle className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
              </Button>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            {isEditing ? renderEditField() : renderDisplayValue()}
          </CardContent>
          {isEditing && (
            <CardFooter className="p-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={handleToggleEdit}>Cancel</Button>
              <Button onClick={handleSave} disabled={!hasChanged}>
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
            </CardFooter>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

