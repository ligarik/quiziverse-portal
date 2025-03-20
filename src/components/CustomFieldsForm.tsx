
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase, CustomField } from '@/integrations/supabase/client';

interface CustomFieldsFormProps {
  quizId: string;
  attemptId: string;
  onComplete: () => void;
}

const CustomFieldsForm = ({ quizId, attemptId, onComplete }: CustomFieldsFormProps) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          description: 'Не удалось загрузить дополнительные поля',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomFields();
  }, [quizId, toast]);
  
  const handleInputChange = (fieldName: string, value: string) => {
    setValues({
      ...values,
      [fieldName]: value
    });
  };
  
  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = fields.filter(f => f.is_required);
    const missingFields = requiredFields.filter(f => !values[f.field_name]?.trim());
    
    if (missingFields.length > 0) {
      toast({
        title: 'Заполните обязательные поля',
        description: 'Пожалуйста, заполните все обязательные поля перед началом теста',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const fieldEntries = Object.entries(values).filter(([_, value]) => value.trim());
      
      if (fieldEntries.length > 0) {
        const fieldsToInsert = fieldEntries.map(([field_name, field_value]) => ({
          attempt_id: attemptId,
          field_name,
          field_value
        }));
        
        const { error } = await supabase
          .from('quiz_attempt_fields')
          .insert(fieldsToInsert);
        
        if (error) throw error;
      }
      
      onComplete();
    } catch (error) {
      console.error('Error saving custom fields values:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить дополнительную информацию',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <div className="py-8 text-center">Загрузка...</div>;
  }
  
  if (fields.length === 0) {
    // If no custom fields, just complete the process
    onComplete();
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Дополнительная информация</CardTitle>
        <CardDescription>
          Пожалуйста, заполните следующие поля перед началом теста
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.field_name}
              value={values[field.field_name] || ''}
              onChange={(e) => handleInputChange(field.field_name, e.target.value)}
              placeholder={field.field_label}
              required={field.is_required}
            />
          </div>
        ))}
        
        <Button 
          className="w-full mt-4" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          Начать тест
        </Button>
      </CardContent>
    </Card>
  );
};

export default CustomFieldsForm;
