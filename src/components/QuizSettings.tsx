import { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from '@/components/ui/select';
import { Clock, Shuffle, MessageCircle, Scale } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Quiz, supabase } from '@/integrations/supabase/client';

interface QuizSettingsProps {
  quiz: Quiz;
  onSettingsUpdated: (updatedQuiz: Quiz) => void;
}

const QuizSettings = ({ quiz, onSettingsUpdated }: QuizSettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(quiz.time_limit);
  const [randomizeQuestions, setRandomizeQuestions] = useState<boolean>(quiz.randomize_questions || false);
  const [showFeedback, setShowFeedback] = useState<boolean>(quiz.show_feedback || false);
  
  const { toast } = useToast();
  
  const saveSettings = async () => {
    if (!quiz || !quiz.id) return;
    
    try {
      setIsLoading(true);
      
      const updates = {
        time_limit: timeLimit,
        randomize_questions: randomizeQuestions,
        show_feedback: showFeedback
      };
      
      const { data, error } = await supabase
        .from('quizzes')
        .update(updates)
        .eq('id', quiz.id)
        .select('*')
        .single();
      
      if (error) throw error;
      
      // We assume the update was successful
      const updatedQuiz = {
        ...quiz,
        ...updates
      };
      
      onSettingsUpdated(updatedQuiz);
      
      toast({
        title: 'Настройки сохранены',
        description: 'Настройки теста успешно обновлены',
      });
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки теста',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки теста</CardTitle>
        <CardDescription>
          Настройте параметры прохождения теста
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="timeLimit">Лимит времени</Label>
            </div>
            <Switch
              id="timeLimitSwitch"
              checked={timeLimit !== undefined}
              onCheckedChange={(checked) => setTimeLimit(checked ? 30 : undefined)}
            />
          </div>
          
          {timeLimit !== undefined && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Input
                id="timeLimit"
                type="number"
                min="1"
                max="180"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">минут</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shuffle className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="randomizeQuestions">Случайный порядок вопросов</Label>
            </div>
            <Switch
              id="randomizeQuestions"
              checked={randomizeQuestions}
              onCheckedChange={setRandomizeQuestions}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Вопросы будут показаны в случайном порядке для каждого пользователя
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="showFeedback">Показывать правильные ответы</Label>
            </div>
            <Switch
              id="showFeedback"
              checked={showFeedback}
              onCheckedChange={setShowFeedback}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            После прохождения пользователи увидят правильные ответы и свои ошибки
          </div>
        </div>
        
        <Button 
          onClick={saveSettings}
          disabled={isLoading}
          className="w-full"
        >
          Сохранить настройки
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuizSettings;
