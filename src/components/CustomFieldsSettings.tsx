
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { 
  Plus, 
  Trash, 
  GripVertical, 
  UserRound, 
  School, 
  BookText,
  AlertTriangle 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase, CustomField } from '@/integrations/supabase/client';

interface CustomFieldsSettingsProps {
  quizId: string;
}

const CustomFieldsSettings = ({ quizId }: CustomFieldsSettingsProps) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchCustomFields = async () => {
      if (!quizId) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('quiz_custom_fields')
          .select('*')
          .eq('quiz_id', quizId)
          .order('position', { ascending: true });
        
        if (error) throw error;
        
        setFields(data || []);
      } catch (error) {
        console.error('Error fetching custom fields:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить настройки дополнительных полей',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomFields();
  }, [quizId, toast]);
  
  const addField = () => {
    const newPosition = fields.length > 0 
      ? Math.max(...fields.map(f => f.position)) + 1 
      : 1;
    
    setFields([
      ...fields, 
      {
        id: `temp-${Date.now()}`,
        quiz_id: quizId,
        field_name: `field_${newPosition}`,
        field_label: '',
        is_required: false,
        position: newPosition,
        created_at: new Date().toISOString()
      }
    ]);
  };
  
  const removeField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };
  
  const updateField = (index: number, field: Partial<CustomField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...field };
    setFields(newFields);
  };
  
  const saveFields = async () => {
    if (!quizId) return;
    
    // Validate fields
    const invalidFields = fields.filter(f => !f.field_name.trim() || !f.field_label.trim());
    if (invalidFields.length > 0) {
      toast({
        title: 'Ошибка',
        description: 'Заполните названия и метки для всех полей',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // First delete all existing fields
      const { error: deleteError } = await supabase
        .from('quiz_custom_fields')
        .delete()
        .eq('quiz_id', quizId);
      
      if (deleteError) throw deleteError;
      
      if (fields.length > 0) {
        // Then insert all fields
        const fieldsToInsert = fields.map((field, index) => ({
          quiz_id: quizId,
          field_name: field.field_name.trim(),
          field_label: field.field_label.trim(),
          is_required: field.is_required,
          position: index + 1
        }));
        
        const { error: insertError } = await supabase
          .from('quiz_custom_fields')
          .insert(fieldsToInsert);
        
        if (insertError) throw insertError;
      }
      
      toast({
        title: 'Настройки сохранены',
        description: 'Настройки дополнительных полей успешно обновлены',
      });
      
      // Refresh fields list
      const { data, error } = await supabase
        .from('quiz_custom_fields')
        .select('*')
        .eq('quiz_id', quizId)
        .order('position', { ascending: true });
      
      if (error) throw error;
      
      setFields(data || []);
    } catch (error) {
      console.error('Error saving custom fields:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки дополнительных полей',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getFieldIcon = (index: number) => {
    const icons = [UserRound, School, BookText];
    return icons[index % icons.length];
  };

  if (isLoading) {
    return <div className="py-8 text-center">Загрузка настроек...</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Дополнительные поля</CardTitle>
        <CardDescription>
          Настройте дополнительную информацию, которую нужно собрать перед началом теста
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Нет настроенных дополнительных полей</p>
            <Button onClick={addField}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить поле
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {fields.map((field, index) => {
                const FieldIcon = getFieldIcon(index);
                return (
                  <div 
                    key={field.id} 
                    className="flex items-start gap-3 p-4 border rounded-md"
                  >
                    <div className="mt-1">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      <div>
                        <Label htmlFor={`field_name_${index}`} className="text-xs flex items-center gap-1">
                          <FieldIcon className="h-3.5 w-3.5" />
                          Идентификатор поля
                        </Label>
                        <Input
                          id={`field_name_${index}`}
                          value={field.field_name}
                          onChange={(e) => updateField(index, { field_name: e.target.value })}
                          placeholder="name"
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor={`field_label_${index}`} className="text-xs">
                          Метка поля (что увидит пользователь)
                        </Label>
                        <Input
                          id={`field_label_${index}`}
                          value={field.field_label}
                          onChange={(e) => updateField(index, { field_label: e.target.value })}
                          placeholder="Имя и фамилия"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-6 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`required_${index}`}
                          checked={field.is_required}
                          onCheckedChange={(checked) => updateField(index, { is_required: checked })}
                        />
                        <Label htmlFor={`required_${index}`} className="text-xs">
                          Обязательное
                        </Label>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeField(index)}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
              <Button 
                variant="outline" 
                onClick={addField}
              >
                <Plus className="mr-2 h-4 w-4" />
                Добавить поле
              </Button>
              
              <Button
                onClick={saveFields}
                disabled={isSaving}
              >
                Сохранить настройки полей
              </Button>
            </div>
          </>
        )}
        
        {fields.length > 0 && (
          <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-md mt-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>Эти поля будут показаны пользователям перед началом теста. Собранная информация будет отображаться в статистике попыток.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomFieldsSettings;
