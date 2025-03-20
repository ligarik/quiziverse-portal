
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Loader2, 
  ArrowLeft, 
  Plus, 
  Check, 
  Save,
  Settings,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Quiz, Question, Answer, QuestionType } from '@/lib/supabase';
import QuestionForm from '@/components/QuestionForm';
import QuestionItem from '@/components/QuestionItem';
import QuizSettings from '@/components/QuizSettings';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

const EditQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .eq('created_by', user.id)
          .single();
        
        if (quizError) throw quizError;
        
        if (!quizData) {
          toast({
            title: 'Ошибка',
            description: 'Тест не найден или у вас нет прав для его редактирования',
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }
        
        const quizWithDefaults = {
          ...quizData,
          is_published: quizData.is_published || false,
          time_limit: quizData.time_limit,
          randomize_questions: quizData.randomize_questions || false,
          show_feedback: quizData.show_feedback || false
        };
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', id);
        
        if (questionsError) throw questionsError;
        
        const questionsWithAnswers: QuestionWithAnswers[] = [];
        
        for (const question of questionsData || []) {
          const { data: answersData, error: answersError } = await supabase
            .from('answers')
            .select('*')
            .eq('question_id', question.id);
          
          if (answersError) throw answersError;
          
          questionsWithAnswers.push({
            ...question,
            answers: answersData || []
          });
        }
        
        setQuiz(quizWithDefaults);
        setTitle(quizWithDefaults.title);
        setDescription(quizWithDefaults.description || '');
        setQuestions(questionsWithAnswers);
      } catch (error) {
        console.error('Ошибка при загрузке теста:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные теста',
          variant: 'destructive',
        });
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizData();
  }, [id, user, navigate, toast]);

  const handleSaveQuiz = async () => {
    if (!id || !user || !quiz) return;
    
    if (!title.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название теста не может быть пустым',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('quizzes')
        .update({
          title,
          description
        })
        .eq('id', id)
        .eq('created_by', user.id);
      
      if (error) throw error;
      
      setQuiz({
        ...quiz,
        title,
        description
      });
      
      toast({
        title: 'Изменения сохранены',
        description: 'Информация о тесте успешно обновлена',
      });
    } catch (error) {
      console.error('Ошибка при сохранении теста:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить изменения',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuestionAdded = (newQuestion: QuestionWithAnswers) => {
    setQuestions([...questions, newQuestion]);
    document.getElementById('closeAddQuestionDialog')?.click();
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!id || !user) return;
    
    try {
      const { error: answersError } = await supabase
        .from('answers')
        .delete()
        .eq('question_id', questionId);
      
      if (answersError) throw answersError;
      
      const { error: questionError } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)
        .eq('quiz_id', id);
      
      if (questionError) throw questionError;
      
      setQuestions(questions.filter(q => q.id !== questionId));
      
      toast({
        title: 'Вопрос удален',
        description: 'Вопрос успешно удален из теста',
      });
    } catch (error) {
      console.error('Ошибка при удалении вопроса:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить вопрос',
        variant: 'destructive',
      });
    }
  };

  const handlePublishToggle = async () => {
    if (!id || !user || !quiz) return;
    
    if (questions.length === 0 && !quiz.is_published) {
      toast({
        title: 'Ошибка',
        description: 'Нельзя опубликовать тест без вопросов',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsPublishing(true);
      
      const newPublishState = !quiz.is_published;
      
      const { error } = await supabase
        .from('quizzes')
        .update({
          is_published: newPublishState
        })
        .eq('id', id)
        .eq('created_by', user.id);
      
      if (error) throw error;
      
      setQuiz({
        ...quiz,
        is_published: newPublishState
      });
      
      toast({
        title: newPublishState ? 'Тест опубликован' : 'Публикация отменена',
        description: newPublishState 
          ? 'Ваш тест теперь доступен для прохождения' 
          : 'Ваш тест больше не доступен для прохождения',
      });
    } catch (error) {
      console.error('Ошибка при изменении статуса публикации:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус публикации',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSettingsUpdated = (updatedQuiz: Quiz) => {
    setQuiz(updatedQuiz);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к тестам
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant={quiz?.is_published ? "outline" : "default"}
                onClick={handlePublishToggle}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {quiz?.is_published ? "Снять с публикации" : "Опубликовать тест"}
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">Редактор</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="space-y-8">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Основная информация</CardTitle>
                    <CardDescription>
                      Информация о вашем тесте
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSaveQuiz}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Сохранить
                  </Button>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название теста</Label>
                    <Input
                      id="title"
                      placeholder="Введите название теста"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      placeholder="Введите описание теста (опционально)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Вопросы</h2>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить вопрос
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Новый вопрос</DialogTitle>
                      <DialogDescription>
                        Добавьте текст вопроса, выберите тип и варианты ответов.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                      <QuestionForm 
                        quizId={id || ''} 
                        onQuestionAdded={handleQuestionAdded}
                        onCancel={() => document.getElementById('closeAddQuestionDialog')?.click()}
                      />
                    </div>
                    
                    <DialogFooter className="hidden">
                      <DialogClose asChild>
                        <Button id="closeAddQuestionDialog">Закрыть</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              {questions.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">У этого теста пока нет вопросов</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Добавить первый вопрос
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Новый вопрос</DialogTitle>
                        <DialogDescription>
                          Добавьте текст вопроса, выберите тип и варианты ответов.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="py-4">
                        <QuestionForm 
                          quizId={id || ''} 
                          onQuestionAdded={handleQuestionAdded}
                          onCancel={() => document.getElementById('closeAddQuestionDialog')?.click()}
                        />
                      </div>
                      
                      <DialogFooter className="hidden">
                        <DialogClose asChild>
                          <Button id="closeAddQuestionDialog">Закрыть</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </Card>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <QuestionItem 
                      key={question.id} 
                      question={question} 
                      index={index} 
                      onDelete={handleDeleteQuestion} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="settings">
              {quiz && <QuizSettings quiz={quiz} onSettingsUpdated={handleSettingsUpdated} />}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EditQuiz;
