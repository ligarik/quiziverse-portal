
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, Loader2, Image as ImageIcon, X, Upload } from 'lucide-react';
import { QuestionType, supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnswerInput {
  text: string;
  isCorrect: boolean;
  matchingText?: string; // For matching questions
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
  const [correctAnswer, setCorrectAnswer] = useState(''); // For text/number input
  const [isLoading, setIsLoading] = useState(false);
  const [points, setPoints] = useState(1); // Default points per question
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAnswerChange = (index: number, text: string) => {
    const newAnswers = [...answers];
    newAnswers[index].text = text;
    setAnswers(newAnswers);
  };

  const handleMatchingChange = (index: number, matchingText: string) => {
    const newAnswers = [...answers];
    newAnswers[index].matchingText = matchingText;
    setAnswers(newAnswers);
  };

  const toggleCorrectAnswer = (index: number) => {
    if (questionType === QuestionType.SINGLE_CHOICE || questionType === QuestionType.TRUE_FALSE) {
      const newAnswers = answers.map((a, i) => ({
        ...a,
        isCorrect: i === index
      }));
      setAnswers(newAnswers);
    } else if (questionType === QuestionType.MULTIPLE_CHOICE) {
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
    } else if (value === QuestionType.TEXT_INPUT || value === QuestionType.NUMBER_INPUT) {
      setAnswers([{ text: 'Ответ', isCorrect: true }]);
    } else if (value === QuestionType.MATCHING) {
      setAnswers([
        { text: 'Элемент 1', isCorrect: true, matchingText: 'Соответствие 1' },
        { text: 'Элемент 2', isCorrect: true, matchingText: 'Соответствие 2' },
        { text: 'Элемент 3', isCorrect: true, matchingText: 'Соответствие 3' },
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
      if (questionType === QuestionType.MATCHING) {
        setAnswers([...answers, { text: '', isCorrect: true, matchingText: '' }]);
      } else {
        setAnswers([...answers, { text: '', isCorrect: false }]);
      }
    } else {
      toast({
        title: 'Максимальное количество ответов',
        description: 'Нельзя добавить больше 8 вариантов ответа',
        variant: 'destructive',
      });
    }
  };

  const removeAnswer = (index: number) => {
    if ((questionType === QuestionType.SINGLE_CHOICE || questionType === QuestionType.MULTIPLE_CHOICE) 
        && answers.length > 2) {
      const newAnswers = [...answers];
      newAnswers.splice(index, 1);
      
      if (!newAnswers.some(a => a.isCorrect)) {
        newAnswers[0].isCorrect = true;
      }
      
      setAnswers(newAnswers);
    } else if (questionType === QuestionType.MATCHING && answers.length > 2) {
      const newAnswers = [...answers];
      newAnswers.splice(index, 1);
      setAnswers(newAnswers);
    } else {
      toast({
        title: 'Минимальное количество ответов',
        description: 'Должно быть как минимум 2 варианта ответа',
        variant: 'destructive',
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!image) return null;
    
    setIsUploading(true);
    
    try {
      const fileExt = image.name.split('.').pop();
      const fileName = `${quizId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('question_images')
        .upload(fileName, image);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('question_images')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить изображение',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
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
    
    // Validate answers based on question type
    if (questionType === QuestionType.SINGLE_CHOICE || questionType === QuestionType.MULTIPLE_CHOICE || 
        questionType === QuestionType.TRUE_FALSE) {
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
    } else if (questionType === QuestionType.MATCHING) {
      const validAnswers = answers.filter(a => a.text.trim() !== '' && a.matchingText && a.matchingText.trim() !== '');
      
      if (validAnswers.length < 2) {
        toast({
          title: 'Ошибка',
          description: 'Добавьте как минимум два элемента для сопоставления',
          variant: 'destructive',
        });
        return;
      }
    } else if (questionType === QuestionType.TEXT_INPUT || questionType === QuestionType.NUMBER_INPUT) {
      if (!answers[0].text.trim()) {
        toast({
          title: 'Ошибка',
          description: 'Укажите правильный ответ',
          variant: 'destructive',
        });
        return;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Upload image if present
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage();
      }
      
      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .insert({
          quiz_id: quizId,
          content: questionText, // Use content instead of text for db
          question_type: questionType,
          points: points,
          image_url: imageUrl
        })
        .select('id')
        .single();
      
      if (questionError) {
        console.error('Error inserting question:', questionError);
        throw questionError;
      }
      
      // Prepare answers based on question type
      let answersToInsert = [];
      
      if (questionType === QuestionType.SINGLE_CHOICE || questionType === QuestionType.MULTIPLE_CHOICE || 
          questionType === QuestionType.TRUE_FALSE) {
        const validAnswers = answers.filter(a => a.text.trim() !== '');
        answersToInsert = validAnswers.map(answer => ({
          question_id: questionData.id,
          answer_text: answer.text,
          is_correct: answer.isCorrect
        }));
      } else if (questionType === QuestionType.TEXT_INPUT || questionType === QuestionType.NUMBER_INPUT) {
        answersToInsert = [{
          question_id: questionData.id,
          answer_text: answers[0].text,
          is_correct: true
        }];
      } else if (questionType === QuestionType.MATCHING) {
        answersToInsert = answers.filter(a => a.text.trim() !== '' && a.matchingText && a.matchingText.trim() !== '')
          .map(answer => ({
            question_id: questionData.id,
            answer_text: answer.text,
            matching_text: answer.matchingText,
            is_correct: true
          }));
      }
      
      // Insert answers
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .insert(answersToInsert)
        .select('*');
      
      if (answersError) throw answersError;
      
      const newQuestion = {
        id: questionData.id,
        quiz_id: quizId,
        content: questionText,
        text: questionText, // Add text property for UI
        question_type: questionType,
        created_at: new Date().toISOString(),
        points: points,
        image_url: imageUrl,
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
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2"
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
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={QuestionType.TEXT_INPUT} id="text_input" />
            <Label htmlFor="text_input">Ввод текста</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={QuestionType.NUMBER_INPUT} id="number_input" />
            <Label htmlFor="number_input">Ввод числа</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={QuestionType.MATCHING} id="matching" />
            <Label htmlFor="matching">Соответствие</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 space-y-2">
          <Label htmlFor="questionText">Текст вопроса</Label>
          <Textarea
            id="questionText"
            placeholder="Введите текст вопроса"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="points">Баллы за вопрос</Label>
          <Input
            id="points"
            type="number"
            min="1"
            max="100"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Изображение (опционально)</Label>
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            ref={fileInputRef}
          />
          
          {!imagePreview ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 flex flex-col items-center justify-center border-dashed"
            >
              <ImageIcon className="h-10 w-10 mb-2 text-muted-foreground" />
              <span>Нажмите, чтобы загрузить изображение</span>
            </Button>
          ) : (
            <div className="relative border rounded-md overflow-hidden">
              <img 
                src={imagePreview} 
                alt="Question preview" 
                className="w-full max-h-60 object-contain"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>
            {questionType === QuestionType.MATCHING ? 'Элементы для сопоставления' :
             questionType === QuestionType.TEXT_INPUT ? 'Правильный ответ (текст)' :
             questionType === QuestionType.NUMBER_INPUT ? 'Правильный ответ (число)' :
             'Варианты ответов'}
          </Label>
          {(questionType === QuestionType.SINGLE_CHOICE || 
            questionType === QuestionType.MULTIPLE_CHOICE || 
            questionType === QuestionType.MATCHING) && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addAnswer}
            >
              {questionType === QuestionType.MATCHING ? 'Добавить элемент' : 'Добавить вариант'}
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          {questionType === QuestionType.MATCHING ? (
            // Matching question UI
            answers.map((answer, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex-grow">
                    <Input
                      placeholder={`Элемент ${index + 1}`}
                      value={answer.text}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-grow">
                    <Input
                      placeholder={`Соответствие ${index + 1}`}
                      value={answer.matchingText || ''}
                      onChange={(e) => handleMatchingChange(index, e.target.value)}
                    />
                  </div>
                  
                  {answers.length > 2 && (
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
              </div>
            ))
          ) : questionType === QuestionType.TEXT_INPUT || questionType === QuestionType.NUMBER_INPUT ? (
            // Text/Number input UI
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <Input
                  placeholder={questionType === QuestionType.NUMBER_INPUT ? "Введите числовой ответ" : "Введите текстовый ответ"}
                  value={answers[0].text}
                  type={questionType === QuestionType.NUMBER_INPUT ? "number" : "text"}
                  onChange={(e) => handleAnswerChange(0, e.target.value)}
                />
              </div>
            </div>
          ) : (
            // Single/Multiple choice UI
            answers.map((answer, index) => (
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
            ))
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading || isUploading}
        >
          Отмена
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || isUploading || !questionText.trim()}
        >
          {isLoading || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUploading ? 'Загрузка изображения...' : 'Добавление...'}
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
