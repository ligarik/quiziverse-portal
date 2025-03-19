
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, Loader2 } from 'lucide-react';
import { QuestionType } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface AnswerInput {
  text: string;
  isCorrect: boolean;
}

interface QuestionFormProps {
  quizId: string;
  onQuestionAdded: (newQuestion: any) => void;
  onCancel: () => void;
}

const QuestionForm = ({ quizId, onQuestionAdded, onCancel }: QuestionFormProps) => {
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.SINGLE_CHOICE);
  const [answers, setAnswers] = useState<AnswerInput[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const handleAnswerChange = (index: number, text: string) => {
    const newAnswers = [...answers];
    newAnswers[index].text = text;
    setAnswers(newAnswers);
  };

  const toggleCorrectAnswer = (index: number) => {
    if (questionType === QuestionType.SINGLE_CHOICE || questionType === QuestionType.TRUE_FALSE) {
      const newAnswers = answers.map((a, i) => ({
        ...a,
        isCorrect: i === index
      }));
      setAnswers(newAnswers);
    } else {
      const newAnswers = [...answers];
      newAnswers[index].isCorrect = !newAnswers[index].isCorrect;
      setAnswers(newAnswers);
    }
  };

  const handleTypeChange = (value: QuestionType) => {
    setQuestionType(value);
    
    if (value === QuestionType.TRUE_FALSE) {
      setAnswers([
        { text: 'Верно', isCorrect: true },
        { text: 'Неверно', isCorrect: false }
      ]);
    } else if (answers.length < 2) {
      setAnswers([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]);
    }
  };

  const addAnswer = () => {
    if (answers.length < 8) {
      setAnswers([...answers, { text: '', isCorrect: false }]);
    } else {
      toast({
        title: 'Максимальное количество ответов',
        description: 'Нельзя добавить больше 8 вариантов ответа',
        variant: 'destructive',
      });
    }
  };

  const removeAnswer = (index: number) => {
    if (answers.length > 2) {
      const newAnswers = [...answers];
      newAnswers.splice(index, 1);
      
      if (!newAnswers.some(a => a.isCorrect)) {
        newAnswers[0].isCorrect = true;
      }
      
      setAnswers(newAnswers);
    } else {
      toast({
        title: 'Минимальное количество ответов',
        description: 'Должно быть как минимум 2 варианта ответа',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!quizId) return;
    
    if (!questionText.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Текст вопроса не может быть пустым',
        variant: 'destructive',
      });
      return;
    }
    
    const validAnswers = answers.filter(a => a.text.trim() !== '');
    const hasCorrectAnswer = validAnswers.some(a => a.isCorrect);
    
    if (validAnswers.length < 2) {
      toast({
        title: 'Ошибка',
        description: 'Добавьте как минимум два варианта ответа',
        variant: 'destructive',
      });
      return;
    }
    
    if (!hasCorrectAnswer) {
      toast({
        title: 'Ошибка',
        description: 'Отметьте хотя бы один правильный ответ',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Обновляем название поля с text на question_text
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .insert({
          quiz_id: quizId,
          question_text: questionText, // Изменено с text на question_text
          question_type: questionType
        })
        .select('id')
        .single();
      
      if (questionError) throw questionError;
      
      const answersToInsert = validAnswers.map(answer => ({
        question_id: questionData.id,
        answer_text: answer.text,
        is_correct: answer.isCorrect
      }));
      
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .insert(answersToInsert)
        .select('*');
      
      if (answersError) throw answersError;
      
      const newQuestion = {
        id: questionData.id,
        quiz_id: quizId,
        question_text: questionText, // Изменено с text на question_text
        question_type: questionType,
        created_at: new Date().toISOString(),
        answers: answersData || []
      };
      
      onQuestionAdded(newQuestion);
      
      toast({
        title: 'Вопрос добавлен',
        description: 'Новый вопрос успешно добавлен в тест',
      });
    } catch (error) {
      console.error('Ошибка при добавлении вопроса:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить вопрос. Пожалуйста, попробуйте еще раз.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Тип вопроса</Label>
        <RadioGroup 
          value={questionType} 
          onValueChange={(value) => handleTypeChange(value as QuestionType)}
          className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={QuestionType.SINGLE_CHOICE} id="single_choice" />
            <Label htmlFor="single_choice">Один вариант</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={QuestionType.MULTIPLE_CHOICE} id="multiple_choice" />
            <Label htmlFor="multiple_choice">Несколько вариантов</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={QuestionType.TRUE_FALSE} id="true_false" />
            <Label htmlFor="true_false">Верно/Неверно</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="questionText">Текст вопроса</Label>
        <Textarea
          id="questionText"
          placeholder="Введите текст вопроса"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="min-h-[80px]"
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Варианты ответов</Label>
          {questionType !== QuestionType.TRUE_FALSE && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addAnswer}
            >
              Добавить вариант
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          {answers.map((answer, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-grow">
                <Input
                  placeholder={`Вариант ответа ${index + 1}`}
                  value={answer.text}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  disabled={questionType === QuestionType.TRUE_FALSE}
                />
              </div>
              
              <Button
                type="button"
                variant={answer.isCorrect ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCorrectAnswer(index)}
                className="min-w-[120px]"
              >
                {answer.isCorrect ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {questionType === QuestionType.MULTIPLE_CHOICE ? "Выбран" : "Правильный"}
                  </>
                ) : (
                  questionType === QuestionType.MULTIPLE_CHOICE ? "Выбрать" : "Отметить"
                )}
              </Button>
              
              {questionType !== QuestionType.TRUE_FALSE && answers.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAnswer(index)}
                >
                  Удалить
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Отмена
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || !questionText.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Добавление...
            </>
          ) : (
            "Добавить вопрос"
          )}
        </Button>
      </div>
    </div>
  );
};

export default QuestionForm;
