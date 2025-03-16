
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, Search, Plus, Edit, Trash2, BarChart3, Play, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface Quiz {
  id: string;
  title: string;
  description: string;
  created_at: string;
  question_count: number;
  is_published: boolean;
}

const Dashboard = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Fetch quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // In a real implementation, you would fetch quizzes from Supabase
        // For demo purposes, we'll use mock data
        const mockQuizzes: Quiz[] = [
          {
            id: '1',
            title: 'История России',
            description: 'Тест о ключевых событиях в истории России',
            created_at: '2023-06-15T10:30:00Z',
            question_count: 15,
            is_published: true
          },
          {
            id: '2',
            title: 'Основы программирования',
            description: 'Базовые концепции и принципы программирования',
            created_at: '2023-07-22T14:45:00Z',
            question_count: 10,
            is_published: true
          },
          {
            id: '3',
            title: 'Математика: алгебра',
            description: 'Тест по основам алгебры и математического анализа',
            created_at: '2023-08-05T09:15:00Z',
            question_count: 20,
            is_published: false
          }
        ];
        
        setQuizzes(mockQuizzes);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить ваши тесты',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizzes();
  }, [user, toast]);

  // Filter quizzes by search term
  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const publishedQuizzes = filteredQuizzes.filter(quiz => quiz.is_published);
  const draftQuizzes = filteredQuizzes.filter(quiz => !quiz.is_published);

  // Create new quiz
  const handleCreateQuiz = async () => {
    if (!newQuizTitle.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название теста не может быть пустым',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsCreatingQuiz(true);
      
      // In a real implementation, you would create a quiz in Supabase
      // For demo purposes, we'll just simulate it
      
      const newQuiz: Quiz = {
        id: Date.now().toString(),
        title: newQuizTitle,
        description: newQuizDescription,
        created_at: new Date().toISOString(),
        question_count: 0,
        is_published: false
      };
      
      setQuizzes(prev => [newQuiz, ...prev]);
      setIsCreateDialogOpen(false);
      setNewQuizTitle('');
      setNewQuizDescription('');
      
      toast({
        title: 'Тест создан',
        description: 'Новый тест успешно создан',
      });
      
      // Navigate to the quiz editor
      navigate(`/editor/${newQuiz.id}`);
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать тест',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  // Handle deleting a quiz
  const handleDeleteQuiz = async (quizId: string) => {
    try {
      // In a real implementation, you would delete the quiz from Supabase
      setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
      
      toast({
        title: 'Тест удален',
        description: 'Тест успешно удален',
      });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить тест',
        variant: 'destructive',
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Мои тесты</h1>
              <p className="text-muted-foreground mt-1">Управление вашими тестами и аналитика</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск тестов..."
                  className="pl-9 w-full md:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать тест
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Создать новый тест</DialogTitle>
                    <DialogDescription>
                      Введите название и описание для вашего нового теста
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="quiz-title">Название теста</Label>
                      <Input
                        id="quiz-title"
                        placeholder="Введите название теста"
                        value={newQuizTitle}
                        onChange={(e) => setNewQuizTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quiz-description">Описание</Label>
                      <Input
                        id="quiz-description"
                        placeholder="Введите описание теста (опционально)"
                        value={newQuizDescription}
                        onChange={(e) => setNewQuizDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Отмена
                    </Button>
                    <Button
                      onClick={handleCreateQuiz}
                      disabled={isCreatingQuiz || !newQuizTitle.trim()}
                    >
                      {isCreatingQuiz ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Создание...
                        </>
                      ) : (
                        "Создать"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">Все тесты</TabsTrigger>
              <TabsTrigger value="published">Опубликованные</TabsTrigger>
              <TabsTrigger value="drafts">Черновики</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredQuizzes.length > 0 ? (
                <div className="grid gap-4">
                  {filteredQuizzes.map(quiz => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      onDelete={handleDeleteQuiz}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Нет тестов, соответствующих запросу "{searchTerm}"</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">У вас пока нет тестов. Создайте свой первый тест!</p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Создать тест
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="published" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : publishedQuizzes.length > 0 ? (
                <div className="grid gap-4">
                  {publishedQuizzes.map(quiz => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      onDelete={handleDeleteQuiz}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Нет опубликованных тестов, соответствующих запросу "{searchTerm}"</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">У вас пока нет опубликованных тестов</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="drafts" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : draftQuizzes.length > 0 ? (
                <div className="grid gap-4">
                  {draftQuizzes.map(quiz => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      onDelete={handleDeleteQuiz}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Нет черновиков, соответствующих запросу "{searchTerm}"</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">У вас пока нет черновиков</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

interface QuizCardProps {
  quiz: Quiz;
  onDelete: (id: string) => void;
  formatDate: (date: string) => string;
}

const QuizCard = ({ quiz, onDelete, formatDate }: QuizCardProps) => {
  const navigate = useNavigate();
  
  return (
    <Card className="overflow-hidden border border-border/50 transition-all hover:border-border hover:shadow-soft">
      <div className="flex flex-col md:flex-row md:items-center">
        <CardContent className="flex-grow p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{quiz.title}</h3>
                {quiz.is_published ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    Опубликован
                  </span>
                ) : (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Черновик
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm">{quiz.description}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Меню</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/editor/${quiz.id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(quiz.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <span>Создан: {formatDate(quiz.created_at)}</span>
            </div>
            <div className="flex items-center">
              <span>{quiz.question_count} вопросов</span>
            </div>
          </div>
        </CardContent>
        
        <div className="flex p-4 gap-2 md:flex-col border-t md:border-t-0 md:border-l border-border/50 bg-muted/30 justify-end md:p-5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 md:w-[120px]"
            onClick={() => navigate(`/stats/${quiz.id}`)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Статистика
          </Button>
          <Button
            size="sm"
            className="flex-1 md:w-[120px]"
            onClick={() => navigate(`/take/${quiz.id}`)}
          >
            <Play className="h-4 w-4 mr-2" />
            Пройти
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Dashboard;
