
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { supabase, Quiz } from '@/lib/supabase';

const Dashboard = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('created_by', user.id) // Changed from user_id to created_by
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Ensure all quizzes have is_published property
        const quizzesWithPublishState = (data || []).map(quiz => ({
          ...quiz,
          is_published: quiz.is_published || false // Default to false if not set
        }));
        
        setQuizzes(quizzesWithPublishState);
      } catch (error) {
        console.error('Ошибка при загрузке тестов:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить список тестов',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizzes();
  }, [user, toast]);

  const handleCreateQuiz = () => {
    navigate('/quiz/create');
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!user) return;
    
    try {
      setIsDeletingId(quizId);
      
      // Получаем все вопросы для этого теста
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id')
        .eq('quiz_id', quizId);
      
      if (questionsError) throw questionsError;
      
      // Удаляем все ответы для каждого вопроса
      for (const question of questions || []) {
        await supabase
          .from('answers')
          .delete()
          .eq('question_id', question.id);
      }
      
      // Удаляем все вопросы
      await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizId);
      
      // Удаляем результаты попыток
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('quiz_id', quizId);
      
      if (attemptsError) throw attemptsError;
      
      for (const attempt of attempts || []) {
        await supabase
          .from('question_responses')
          .delete()
          .eq('attempt_id', attempt.id);
      }
      
      await supabase
        .from('quiz_attempts')
        .delete()
        .eq('quiz_id', quizId);
      
      // Наконец, удаляем сам тест
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .eq('created_by', user.id); // Changed from user_id to created_by
      
      if (error) throw error;
      
      // Обновляем список тестов
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
      
      toast({
        title: 'Тест удален',
        description: 'Тест успешно удален',
      });
    } catch (error) {
      console.error('Ошибка при удалении теста:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить тест',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Мои тесты</h1>
            <Button onClick={handleCreateQuiz}>
              <Plus className="mr-2 h-4 w-4" />
              Создать тест
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : quizzes.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Нет тестов</CardTitle>
                <CardDescription>
                  У вас пока нет созданных тестов. Создайте свой первый тест!
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={handleCreateQuiz}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать тест
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата создания</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizzes.map((quiz) => (
                      <TableRow key={quiz.id}>
                        <TableCell className="font-medium">{quiz.title}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              quiz.is_published
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {quiz.is_published ? 'Опубликован' : 'Черновик'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigate(`/quiz/edit/${quiz.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Редактировать</span>
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigate(`/quiz/take/${quiz.id}`)}
                              disabled={!quiz.is_published}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Пройти</span>
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => navigate(`/quiz/stats/${quiz.id}`)}
                            >
                              <BarChart className="h-4 w-4" />
                              <span className="sr-only">Статистика</span>
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Удалить</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Вы уверены?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Это действие нельзя отменить. Тест и все вопросы будут удалены навсегда.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteQuiz(quiz.id)}
                                    disabled={isDeletingId === quiz.id}
                                    className="bg-red-500 hover:bg-red-700"
                                  >
                                    {isDeletingId === quiz.id ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Удаление...
                                      </>
                                    ) : (
                                      "Удалить тест"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
