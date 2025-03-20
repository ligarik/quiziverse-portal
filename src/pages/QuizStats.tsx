import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, BarChart3, Users, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { supabase, Quiz, QuizAttempt, Question } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface AttemptWithUser extends QuizAttempt {
  user_email: string;
}

const QuizStats = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithUser[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionStats, setQuestionStats] = useState<Array<{id: string, text: string, correct: number, incorrect: number}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        
        // Получаем основную информацию о тесте
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
            description: 'Тест не найден или у вас нет прав для просмотра статистики',
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }
        
        // Получаем вопросы для теста
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', id)
          .order('position', { ascending: true });
        
        if (questionsError) throw questionsError;
        
        // Add text property for UI compatibility
        const questionsWithText = questionsData?.map(q => ({
          ...q,
          text: q.content
        })) || [];
        
        // Получаем все попытки прохождения теста
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*, users:user_id(email)')
          .eq('quiz_id', id)
          .is('completed_at', 'not.null')
          .order('started_at', { ascending: false });
        
        if (attemptsError) throw attemptsError;
        
        // Convert the attempt data to the expected format
        const formattedAttempts: AttemptWithUser[] = attemptsData?.map(attempt => {
          // @ts-ignore - handle the nested users object from the join
          const email = attempt.users?.email || 'Анонимный пользователь';
          
          return {
            ...attempt,
            user_email: email
          } as AttemptWithUser;
        }) || [];
        
        // Calculate statistics
        const completedAttempts = formattedAttempts.length;
        const totalScore = formattedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
        const avgScore = completedAttempts > 0 ? totalScore / completedAttempts : 0;
        
        setQuiz(quizData);
        setQuestions(questionsWithText);
        setAttempts(formattedAttempts);
        setTotalAttempts(completedAttempts);
        setAverageScore(avgScore);
        
        // Generate dummy question stats for now
        const stats = questionsWithText.map(q => ({
          id: q.id,
          text: q.text,
          correct: Math.floor(Math.random() * 10),
          incorrect: Math.floor(Math.random() * 5)
        }));
        
        setQuestionStats(stats);
      } catch (error) {
        console.error('Ошибка при загрузке статистики:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить статистику теста',
          variant: 'destructive',
        });
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizData();
  }, [id, user, navigate, toast]);

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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

  // Подготовка данных для графиков
  const pieData = [
    { name: 'Правильные ответы', value: questionStats.reduce((sum, q) => sum + q.correct, 0) },
    { name: 'Неправильные ответы', value: questionStats.reduce((sum, q) => sum + q.incorrect, 0) }
  ];
  
  const COLORS = ['#4CAF50', '#F44336'];
  
  const barData = questionStats.map((stat, index) => ({
    name: `Вопрос ${index + 1}`,
    Правильно: stat.correct,
    Неправильно: stat.incorrect
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-7xl">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к тестам
          </Button>
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{quiz?.title}</h1>
            <p className="text-muted-foreground">{quiz?.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Users className="mr-2 h-5 w-5" />
                  Всего прохождений
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalAttempts}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Средний результат
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {averageScore.toFixed(1)} / {questions.length}
                </p>
                <p className="text-muted-foreground">
                  {questions.length > 0 
                    ? `${Math.round((averageScore / questions.length) * 100)}%` 
                    : '0%'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Clock className="mr-2 h-5 w-5" />
                  Последнее прохождение
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">
                  {attempts.length > 0 
                    ? formatDate(attempts[0].created_at) 
                    : 'Нет данных'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Статистика ответов</CardTitle>
                <CardDescription>
                  Соотношение правильных и неправильных ответов
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Статистика по вопросам</CardTitle>
                <CardDescription>
                  Количество правильных и неправильных ответов на каждый вопрос
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Правильно" fill="#4CAF50" />
                    <Bar dataKey="Неправильно" fill="#F44336" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>История прохождений</CardTitle>
              <CardDescription>
                Список всех прохождений теста
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attempts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Результат</TableHead>
                      <TableHead className="text-right">Процент</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map(attempt => (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium">{attempt.user_email}</TableCell>
                        <TableCell>{formatDate(attempt.created_at)}</TableCell>
                        <TableCell>
                          {attempt.score} / {attempt.max_score}
                        </TableCell>
                        <TableCell className="text-right">
                          {Math.round((attempt.score / attempt.max_score) * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Пока нет завершенных прохождений теста</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default QuizStats;
