
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GradeTextAnswersProps {
  attemptId: string;
  onGradingComplete: () => void;
}

type TextAnswer = {
  id: string;
  question_id: string;
  question_text: string;
  user_answer: string;
  expected_answer: string;
  points: number;
  is_graded: boolean;
  feedback: string;
  points_awarded: number | null;
};

const GradeTextAnswers = ({ attemptId, onGradingComplete }: GradeTextAnswersProps) => {
  const [answers, setAnswers] = useState<TextAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnswers = async () => {
      setIsLoading(true);
      try {
        // Get all text answers for this attempt
        const { data: answersData, error: answersError } = await supabase
          .from('answers')
          .select(`
            id,
            question_id,
            user_answer,
            is_correct,
            points_awarded,
            feedback
          `)
          .eq('attempt_id', attemptId)
          .is('is_correct', null); // Get only ungraded (text) answers
          
        if (answersError) throw answersError;

        // Get question details for each answer
        const textAnswers: TextAnswer[] = [];
        
        for (const answer of answersData || []) {
          const { data: questionData, error: questionError } = await supabase
            .from('questions')
            .select('content, points, correct_answers')
            .eq('id', answer.question_id)
            .single();
            
          if (questionError) continue;
          
          const expectedAnswer = questionData.correct_answers 
            ? (questionData.correct_answers as any[])[0] || ""
            : "";
            
          textAnswers.push({
            id: answer.id,
            question_id: answer.question_id,
            question_text: questionData.content,
            user_answer: answer.user_answer as string || "",
            expected_answer: expectedAnswer,
            points: questionData.points || 1,
            is_graded: answer.is_correct !== null,
            feedback: answer.feedback || "",
            points_awarded: answer.points_awarded
          });
        }
        
        setAnswers(textAnswers);
      } catch (error) {
        console.error('Error fetching text answers:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить ответы для проверки',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnswers();
  }, [attemptId, toast]);

  const handleSaveGrade = async (index: number, isCorrect: boolean, points: number, feedback: string) => {
    if (index >= answers.length) return;
    
    const answer = answers[index];
    setIsSaving(true);
    
    try {
      // Update the answer record
      const { error } = await supabase
        .from('answers')
        .update({
          is_correct: isCorrect,
          points_awarded: points,
          feedback: feedback,
          graded_at: new Date().toISOString()
        })
        .eq('id', answer.id);
        
      if (error) throw error;
      
      // Update local state
      const updatedAnswers = [...answers];
      updatedAnswers[index] = {
        ...answer,
        is_graded: true,
        points_awarded: points,
        feedback: feedback
      };
      setAnswers(updatedAnswers);
      
      // Move to next question if available
      if (index < answers.length - 1) {
        setCurrentIndex(index + 1);
      } else {
        // All questions are graded, update the attempt
        await finalizeGrading();
      }
      
      toast({
        title: 'Оценка сохранена',
        description: 'Ответ успешно проверен'
      });
    } catch (error) {
      console.error('Error saving grade:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить оценку',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const finalizeGrading = async () => {
    try {
      // Calculate total score
      let totalScore = 0;
      
      // Get all answers for this attempt (including auto-graded ones)
      const { data: allAnswers, error: answersError } = await supabase
        .from('answers')
        .select('is_correct, points_awarded, question_id')
        .eq('attempt_id', attemptId);
        
      if (answersError) throw answersError;
      
      // Calculate score from all answers
      for (const answer of allAnswers || []) {
        if (answer.is_correct) {
          // For auto-graded questions
          const { data: questionData } = await supabase
            .from('questions')
            .select('points')
            .eq('id', answer.question_id)
            .single();
            
          totalScore += questionData?.points || 1;
        } else if (answer.points_awarded) {
          // For manually graded questions
          totalScore += answer.points_awarded;
        }
      }
      
      // Update the attempt
      const { error: updateError } = await supabase
        .from('quiz_attempts')
        .update({
          score: totalScore,
          is_graded: true
        })
        .eq('id', attemptId);
        
      if (updateError) throw updateError;
      
      onGradingComplete();
    } catch (error) {
      console.error('Error finalizing grades:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось завершить проверку',
        variant: 'destructive',
      });
    }
  };

  const handleMarkCorrect = (index: number) => {
    if (index >= answers.length) return;
    
    const answer = answers[index];
    const textareaElement = document.getElementById(`feedback-${index}`) as HTMLTextAreaElement;
    const feedback = textareaElement?.value || "Правильный ответ";
    
    handleSaveGrade(index, true, answer.points, feedback);
  };

  const handleMarkIncorrect = (index: number) => {
    if (index >= answers.length) return;
    
    const pointsElement = document.getElementById(`points-${index}`) as HTMLInputElement;
    const points = pointsElement?.value ? parseInt(pointsElement.value, 10) : 0;
    
    const textareaElement = document.getElementById(`feedback-${index}`) as HTMLTextAreaElement;
    const feedback = textareaElement?.value || "Неправильный ответ";
    
    handleSaveGrade(index, false, points, feedback);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!answers.length) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Нет ответов для проверки</p>
      </div>
    );
  }

  const currentAnswer = answers[currentIndex];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Проверка ответов ({currentIndex + 1} из {answers.length})</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="font-medium">Вопрос:</div>
          <div className="p-3 bg-muted rounded-md">{currentAnswer.question_text}</div>
        </div>
        
        <div className="space-y-2">
          <div className="font-medium">Ожидаемый ответ:</div>
          <div className="p-3 bg-muted rounded-md">{currentAnswer.expected_answer}</div>
        </div>
        
        <div className="space-y-2">
          <div className="font-medium">Ответ пользователя:</div>
          <div className="p-3 border rounded-md">{currentAnswer.user_answer}</div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`points-${currentIndex}`}>Баллы (макс. {currentAnswer.points})</Label>
          <Input 
            id={`points-${currentIndex}`}
            type="number" 
            min="0" 
            max={currentAnswer.points}
            defaultValue={currentAnswer.is_graded ? currentAnswer.points_awarded || 0 : 0}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`feedback-${currentIndex}`}>Комментарий</Label>
          <Textarea 
            id={`feedback-${currentIndex}`}
            placeholder="Напишите комментарий к ответу"
            defaultValue={currentAnswer.feedback}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          disabled={isSaving || currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
        >
          Предыдущий
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="destructive"
            disabled={isSaving || currentAnswer.is_graded}
            onClick={() => handleMarkIncorrect(currentIndex)}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Неверно
          </Button>
          
          <Button
            variant="default"
            disabled={isSaving || currentAnswer.is_graded}
            onClick={() => handleMarkCorrect(currentIndex)}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Верно
          </Button>
        </div>
        
        <Button
          variant="outline"
          disabled={isSaving || currentIndex === answers.length - 1}
          onClick={() => setCurrentIndex(currentIndex + 1)}
        >
          Следующий
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GradeTextAnswers;
