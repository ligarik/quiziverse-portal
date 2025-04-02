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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Shuffle, 
  MessageCircle, 
  List, 
  AlertCircle, 
  Copy, 
  ArrowLeft, 
  Check,
  MinusCircle,
  Lock,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Quiz, supabase } from '@/integrations/supabase/client';
import CustomFieldsSettings from './CustomFieldsSettings';

interface QuizSettingsProps {
  quiz: Quiz;
  onSettingsUpdated: (updatedQuiz: Quiz) => void;
}

const QuizSettings = ({ quiz, onSettingsUpdated }: QuizSettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(quiz.time_limit);
  const [randomizeQuestions, setRandomizeQuestions] = useState<boolean>(quiz.randomize_questions || false);
  const [showFeedback, setShowFeedback] = useState<boolean>(quiz.show_feedback || false);
  
  const [showQuestionNumbers, setShowQuestionNumbers] = useState<boolean>(quiz.show_question_numbers || false);
  const [showProgressBar, setShowProgressBar] = useState<boolean>(quiz.show_progress_bar || false);
  const [randomizeAnswers, setRandomizeAnswers] = useState<boolean>(quiz.randomize_answers || false);
  const [limitQuestions, setLimitQuestions] = useState<boolean>(quiz.question_limit !== undefined && quiz.question_limit !== null);
  const [questionLimit, setQuestionLimit] = useState<number>(quiz.question_limit || 10);
  const [showElapsedTime, setShowElapsedTime] = useState<boolean>(quiz.show_elapsed_time || false);
  const [preventCopy, setPreventCopy] = useState<boolean>(quiz.prevent_copy || false);
  const [preventBackButton, setPreventBackButton] = useState<boolean>(quiz.prevent_back_button || false);
  const [confirmLastNext, setConfirmLastNext] = useState<boolean>(quiz.confirm_last_next || false);
  const [confirmFinish, setConfirmFinish] = useState<boolean>(quiz.confirm_finish || true);
  
  const [passwordProtect, setPasswordProtect] = useState<boolean>(Boolean(quiz.password));
  const [password, setPassword] = useState<string>(quiz.password || '');
  
  const [activeTab, setActiveTab] = useState("general");
  
  const { toast } = useToast();
  
  const saveSettings = async () => {
    if (!quiz || !quiz.id) return;
    
    try {
      setIsLoading(true);
      
      const updates = {
        time_limit: timeLimit,
        randomize_questions: randomizeQuestions,
        show_feedback: showFeedback,
        show_question_numbers: showQuestionNumbers,
        show_progress_bar: showProgressBar,
        randomize_answers: randomizeAnswers,
        question_limit: limitQuestions ? questionLimit : null,
        show_elapsed_time: showElapsedTime,
        prevent_copy: preventCopy,
        prevent_back_button: preventBackButton,
        confirm_last_next: confirmLastNext,
        confirm_finish: confirmFinish,
        password: passwordProtect ? password : null
      };
      
      console.log('Saving quiz settings:', updates);
      
      const { data, error } = await supabase
        .from('quizzes')
        .update(updates)
        .eq('id', quiz.id)
        .select();
      
      if (error) {
        console.error('Error saving settings:', error);
        throw error;
      }
      
      console.log('Updated quiz data:', data);
      
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

  const progressValue = 65;
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">Основные настройки</TabsTrigger>
          <TabsTrigger value="appearance">Отображение</TabsTrigger>
          <TabsTrigger value="behavior">Поведение</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
          <TabsTrigger value="custom_fields">Дополнительные поля</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Основные настройки</CardTitle>
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
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="showElapsedTime">Показывать затраченное время</Label>
                  </div>
                  <Switch
                    id="showElapsedTime"
                    checked={showElapsedTime}
                    onCheckedChange={setShowElapsedTime}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Пользователи будут видеть, сколько времени они потратили на прохождение теста
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MinusCircle className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="limitQuestions">Ограничить количество вопросов</Label>
                  </div>
                  <Switch
                    id="limitQuestionsSwitch"
                    checked={limitQuestions}
                    onCheckedChange={setLimitQuestions}
                  />
                </div>
                
                {limitQuestions && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input
                      id="questionLimit"
                      type="number"
                      min="1"
                      max="100"
                      value={questionLimit}
                      onChange={(e) => setQuestionLimit(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground">вопросов</span>
                    </div>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Пользователю будет показано только указанное количество вопросов из всех доступных
                </div>
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
                    <Shuffle className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="randomizeAnswers">Случайный порядок вариантов ответов</Label>
                  </div>
                  <Switch
                    id="randomizeAnswers"
                    checked={randomizeAnswers}
                    onCheckedChange={setRandomizeAnswers}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Варианты ответов будут показаны в случайном порядке для каждого вопроса
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
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить настройки'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Настройки отображения</CardTitle>
              <CardDescription>
                Настройте как будет выглядеть тест
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="showQuestionNumbers">Показывать номера вопросов</Label>
                  </div>
                  <Switch
                    id="showQuestionNumbers"
                    checked={showQuestionNumbers}
                    onCheckedChange={setShowQuestionNumbers}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Перед каждым вопросом будет отображаться его порядковый номер
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="showProgressBar">Показывать шкалу прогресса</Label>
                  </div>
                  <Switch
                    id="showProgressBar"
                    checked={showProgressBar}
                    onCheckedChange={setShowProgressBar}
                  />
                </div>
                
                {showProgressBar && (
                  <div className="mt-2">
                    <Progress value={progressValue} className="h-2" />
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-muted-foreground">{progressValue}%</span>
                    </div>
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground">
                  Пользователь будет видеть прогресс прохождения теста
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
        </TabsContent>
        
        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle>Настройки поведения</CardTitle>
              <CardDescription>
                Настройте дополнительные параметры для прохождения теста
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="preventCopy">Запретить копирование текста</Label>
                  </div>
                  <Switch
                    id="preventCopy"
                    checked={preventCopy}
                    onCheckedChange={setPreventCopy}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Запрещает пользователям копировать текст вопросов и вариантов ответов
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="preventBackButton">Запретить кнопку "Назад" в браузере</Label>
                  </div>
                  <Switch
                    id="preventBackButton"
                    checked={preventBackButton}
                    onCheckedChange={setPreventBackButton}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Предотвращает использование кнопки "Назад" в браузере во время прохождения теста
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="confirmLastNext">Подтверждение на последнем вопросе</Label>
                  </div>
                  <Switch
                    id="confirmLastNext"
                    checked={confirmLastNext}
                    onCheckedChange={setConfirmLastNext}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Запрашивать подтверждение при нажатии кнопки "Далее" на последнем вопросе
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="confirmFinish">Подтверждение завершения теста</Label>
                  </div>
                  <Switch
                    id="confirmFinish"
                    checked={confirmFinish}
                    onCheckedChange={setConfirmFinish}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Запрашивать подтверждение при нажатии кнопки "Завершить тест"
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
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Настройки безопасности</CardTitle>
              <CardDescription>
                Дополнительные параметры защиты вашего теста
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="passwordProtect">Защита паролем</Label>
                  </div>
                  <Switch
                    id="passwordProtect"
                    checked={passwordProtect}
                    onCheckedChange={setPasswordProtect}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Требовать ввод пароля перед началом прохождения теста
                </div>
                
                {passwordProtect && (
                  <div className="mt-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input
                      id="password"
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Введите пароль для доступа к тесту"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
              
              <Button 
                onClick={saveSettings}
                disabled={isLoading || (passwordProtect && !password)}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить настройки'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="custom_fields">
          <CustomFieldsSettings quizId={quiz.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizSettings;
