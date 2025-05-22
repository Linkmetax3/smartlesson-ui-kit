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
import { LessonContent, LessonActivity, Differentiations, AssessmentType, ASSESSMENT_TYPES } from '@/types/lesson';
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
  const [isOpen, setIsOpen] = useState(false); // Default to closed
  const [currentData, setCurrentData] = useState(initialData);
  const [editData, setEditData] = useState(initialData);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    setCurrentData(initialData);
    setEditData(initialData); // Reset editData when initialData changes (e.g., after save)
    setHasChanged(false); // Reset hasChanged as well
  }, [initialData]);
  
  useEffect(() => {
    // Check if editData is different from currentData (the saved state)
    setHasChanged(JSON.stringify(editData) !== JSON.stringify(currentData));
  }, [editData, currentData]);

  const handleToggleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent collapsible from toggling if edit button is clicked
    if (isEditing) { // If was editing, now cancelling
      setEditData(currentData); // Reset changes
      setHasChanged(false);
    }
    setIsEditing(!isEditing);
    if (!isOpen && !isEditing) { // If not open and about to start editing, open it
      setIsOpen(true);
    }
  };

  const handleSave = async () => {
    const fullContent = getFullContent();
    // Create a new object for the full content to avoid mutating the original state directly
    const updatedFullContent = {
      ...fullContent,
      [sectionKey]: editData,
    };

    const result = await onSave(planId, updatedFullContent);
    if (result.success && result.data) {
      setIsEditing(false);
      setHasChanged(false);
      toast({ title: "Saved!", description: `${sectionTitle} updated successfully.` });
    } else {
      toast({ variant: "destructive", title: "Save Failed", description: result.error || "Could not save changes." });
    }
  };
  
  const getSummary = (data: any): string => {
    if (typeof data === 'string') return data.substring(0, 60) + (data.length > 60 ? '...' : '');
    if (Array.isArray(data)) {
      if (data.length === 0) return 'Empty';
      if (sectionKey === 'materialsNeeded') return data.join(', ').substring(0, 60) + (data.join(', ').length > 60 ? '...' : '');
      if (sectionKey === 'mainActivities') return `${data.length} activit${data.length > 1 ? 'ies' : 'y'}`;
      return `${data.length} items`;
    }
    if (typeof data === 'object' && data !== null) {
      if (sectionKey === 'differentiations') return `${Object.values(data).filter(v => v).length} strategies`;
      return Object.keys(data).length > 0 ? `${Object.keys(data).length} properties` : 'Empty';
    }
    if (data === null || data === undefined) return 'Not specified';
    return String(data).substring(0, 60) + (String(data).length > 60 ? '...' : '');
  };

  const renderDisplayValue = () => {
    if (currentData === null || currentData === undefined) return <span className="text-muted-foreground">Not specified</span>;

    // Specific array types
    if (sectionKey === 'materialsNeeded' && Array.isArray(currentData)) {
      if (currentData.length === 0) return <span className="text-muted-foreground">None specified</span>;
      return (
        <ul className="list-disc pl-5 space-y-1">
          {(currentData as string[]).map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      );
    } else if (sectionKey === 'mainActivities' && Array.isArray(currentData)) {
      if (currentData.length === 0) return <span className="text-muted-foreground">None specified</span>;
      return (currentData as LessonActivity[]).map((activity, index) => (
        <div key={index} className="mb-3 p-3 border rounded-md bg-muted/30">
          <p className="font-semibold text-primary">{activity.title || `Activity ${index + 1}`}</p>
          <p className="text-sm whitespace-pre-wrap mt-1">{activity.description || <span className="text-muted-foreground">No description</span>}</p>
        </div>
      ));
    } 
    // Specific object type
    else if (sectionKey === 'differentiations' && typeof currentData === 'object' && currentData !== null && !Array.isArray(currentData)) {
      const diffData = currentData as Differentiations;
      const diffLabels: Record<keyof Differentiations, string> = {
          strugglingLearners: "Support for Struggling Learners",
          onTrackLearners: "Activities for On-Track Learners",
          advancedLearners: "Challenge for Advanced Learners",
          accommodations: "Accommodations/Modifications"
      };
      const diffContent = (Object.keys(diffData) as Array<keyof Differentiations>).map((key) => (
        <li key={key}>
          <span className="font-semibold capitalize block text-primary">{diffLabels[key]}: </span>
          <p className="text-sm whitespace-pre-wrap pl-2">{diffData[key] || <span className="text-muted-foreground">Not specified</span>}</p>
        </li>
      ));
      if (diffContent.every(item => (item.props.children[1].props.children.props.children === "Not specified"))) {
        return <span className="text-muted-foreground">None specified</span>;
      }
      return <ul className="space-y-2">{diffContent}</ul>;
    }
    // Specific string enum type
    else if (sectionKey === 'assessmentType') {
      if (typeof currentData === 'string' && ASSESSMENT_TYPES.includes(currentData as AssessmentType)) {
        return <p className="capitalize">{currentData}</p>;
      }
      // If it's supposed to be assessmentType but data is wrong type or value
      return <span className="text-muted-foreground">Invalid assessment type value.</span>;
    }
    // Generic string type for other sections
    else if (typeof currentData === 'string') {
      return <p className="whitespace-pre-wrap">{currentData || <span className="text-muted-foreground">Not specified</span>}</p>;
    }
    
    // Fallback for types/keys not explicitly handled above
    return <span className="text-muted-foreground">Display not configured for this content type.</span>;
  };

  const renderEditField = () => {
    // String fields
    if (typeof editData === 'string' && 
        ['lessonTopic', 'themeOfWeek', 'learningObjective', 'introduction', 'extensionActivity', 'conclusion', 'evaluation', 'teacherReflection'].includes(sectionKey)) {
      return (
        <div>
          <Textarea
            value={editData}
            onChange={(e) => setEditData(e.target.value.substring(0, MAX_TEXTAREA_CHARS))}
            placeholder={`Enter ${sectionTitle.toLowerCase()}...`}
            rows={Math.max(4, Math.min(8, (editData || "").split('\n').length + 1))} // Dynamic rows based on content, added null check for editData
            maxLength={MAX_TEXTAREA_CHARS}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{(editData || "").length}/{MAX_TEXTAREA_CHARS}</p>
        </div>
      );
    }

    // materialsNeeded: string[]
    if (sectionKey === 'materialsNeeded' && Array.isArray(editData)) {
      const materials = editData as string[];
      const handleAddMaterial = (material: string) => {
        if (material.trim() && !materials.includes(material.trim())) {
          setEditData([...materials, material.trim()]);
        }
      };
      const handleRemoveMaterial = (index: number) => {
        setEditData(materials.filter((_, i) => i !== index));
      };
      return (
        <div className="space-y-2">
          {materials.map((mat, index) => (
            <div key={index} className="flex items-center gap-2 bg-secondary/30 p-2 rounded-md">
              <span className="flex-grow">{mat}</span>
              <Button variant="ghost" size="icon" onClick={() => handleRemoveMaterial(index)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <form
            className="flex gap-2 mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('materialInput') as HTMLInputElement;
              if (input) {
                 handleAddMaterial(input.value);
                 input.value = '';
              }
            }}
          >
            <Input name="materialInput" placeholder="Add material (e.g., Whiteboard)" className="flex-grow" />
            <Button type="submit">Add</Button>
          </form>
        </div>
      );
    }
    
    // mainActivities: LessonActivity[]
    if (sectionKey === 'mainActivities' && Array.isArray(editData)) {
      const activities = editData as LessonActivity[];
      const updateActivity = (index: number, field: keyof LessonActivity, value: string) => {
        const newActivities = activities.map((act, i) => i === index ? { ...act, [field]: value } : act);
        setEditData(newActivities);
      };
      const addActivity = () => setEditData([...activities, { title: '', description: '' }]);
      const removeActivity = (index: number) => setEditData(activities.filter((_, i) => i !== index));

      return (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/20">
              <Label htmlFor={`activity-title-${index}`} className="text-base font-medium">Activity {index + 1} Title</Label>
              <Input 
                id={`activity-title-${index}`}
                value={activity.title} 
                onChange={(e) => updateActivity(index, 'title', e.target.value)}
                placeholder="E.g., Group Discussion" 
              />
              <Label htmlFor={`activity-desc-${index}`} className="text-base font-medium">Description</Label>
              <Textarea 
                id={`activity-desc-${index}`}
                value={activity.description} 
                onChange={(e) => updateActivity(index, 'description', e.target.value)}
                placeholder="E.g., Students discuss the key concepts in small groups..."
                rows={3}
                className="resize-y"
              />
              {activities.length > 1 && 
                <Button variant="outline" size="sm" onClick={() => removeActivity(index)} className="text-destructive hover:bg-destructive/10 border-destructive/50">
                  Remove Activity {index + 1}
                </Button>
              }
            </div>
          ))}
          <Button variant="outline" onClick={addActivity} className="mt-2">Add New Activity</Button>
        </div>
      );
    }

    // differentiations: Differentiations (object)
    if (sectionKey === 'differentiations' && typeof editData === 'object' && editData !== null && !Array.isArray(editData)) { // Added !Array.isArray(editData) for robustness
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
            <div className="space-y-4">
                {(Object.keys(diffLabels) as Array<keyof Differentiations>).map(key => ( // Iterate over diffLabels to ensure all fields are shown
                    <div key={key}>
                        <Label htmlFor={`diff-${key}`} className="text-base font-medium">{diffLabels[key]}</Label>
                        <Textarea
                            id={`diff-${key}`}
                            value={diffData[key] || ''} // Ensure value is not undefined
                            onChange={(e) => updateDiff(key, e.target.value.substring(0, MAX_TEXTAREA_CHARS))}
                            placeholder={`Describe strategies for ${diffLabels[key].toLowerCase()}`}
                            rows={3}
                            maxLength={MAX_TEXTAREA_CHARS}
                            className="mt-1 resize-y"
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
          value={editData as AssessmentType} // editData should be AssessmentType here
          onValueChange={(value) => setEditData(value as AssessmentType)}
          className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6 pt-2"
        >
          {ASSESSMENT_TYPES.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <RadioGroupItem value={type} id={`${sectionKey}-${type}-${planId}`} />
              <Label htmlFor={`${sectionKey}-${type}-${planId}`} className="font-normal capitalize text-base">{type}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    return <p className="text-red-500 py-4">Edit mode not implemented for this section type.</p>;
  };

  return (
    <Card className={cn("shadow-md rounded-lg mb-4 transition-all duration-300 ease-in-out", isEditing && "ring-2 ring-primary shadow-primary/30")}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader 
            className="flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg"
            onClick={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-collapsible-trigger-area]')) setIsOpen(!isOpen);}} // Allow only header click to toggle, not buttons
          >
            <div data-collapsible-trigger-area className="flex-grow">
              <CardTitle className="text-lg font-semibold">{sectionTitle}</CardTitle>
              {!isOpen && <p className="text-sm text-muted-foreground truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mt-1">{getSummary(currentData)}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="icon" onClick={handleToggleEdit} className="h-9 w-9">
                {isEditing ? <XCircle className="h-5 w-5 text-destructive" /> : <Edit3 className="h-5 w-5 text-primary" />}
              </Button>
              <div data-collapsible-trigger-area className="p-1"> {/* Make chevron part of toggle area */}
                 {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-4 pt-2"> {/* Reduced top padding for content */}
            {isEditing ? renderEditField() : renderDisplayValue()}
          </CardContent>
          {isEditing && (
            <CardFooter className="p-4 pt-2 flex justify-end gap-3 border-t mt-2">
              <Button variant="outline" onClick={() => handleToggleEdit()}>Cancel</Button>
              <Button onClick={handleSave} disabled={!hasChanged}>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
