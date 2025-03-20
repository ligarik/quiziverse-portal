import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Quiz, Question } from '@/integrations/supabase/client';

// Update the AttemptWithUser type to match the database structure
type AttemptWithUser = {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number | null;
  max_score: number | null;
  started_at: string;
  completed_at: string | null;
  is_graded: boolean;
  user_email: string;
};

const QuizStats = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithUser[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setIsLoadingAttempts(true);
        
        // Fix the query to avoid type errors
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select(`
            id, 
            quiz_id, 
            user_id, 
            score, 
            max_score, 
            started_at, 
            completed_at, 
            is_graded,
            users:user_id (email)
          `)
          .eq('quiz_id', id);
          
        if (error) throw error;

        // Transform the data to include user_email
        const attemptsWithUser: AttemptWithUser[] = data.map((attempt: any) => ({
          id: attempt.id,
          quiz_id: attempt.quiz_id,
          user_id: attempt.user_id,
          score: attempt.score,
          max_score: attempt.max_score,
          started_at: attempt.started_at,
          completed_at: attempt.completed_at,
          is_graded: attempt.is_graded,
          user_email: attempt.users?.email
        }));
        
        setAttempts(attemptsWithUser);
      } catch (error) {
        console.error('Error fetching attempts:', error);
      } finally {
        setIsLoadingAttempts(false);
      }
    };
    
    const fetchQuizAndQuestions = async () => {
      if (!id) return;
      
      try {
        setIsLoadingQuiz(true);
        
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (quizError) throw quizError;
        
        setQuiz(quizData);
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', id);
        
        if (questionsError) throw questionsError;
        
        setQuestions(questionsData);
      } catch (error) {
        console.error('Error fetching quiz and questions:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные теста',
          variant: 'destructive',
        });
        navigate('/dashboard');
      } finally {
        setIsLoadingQuiz(false);
      }
    };
    
    fetchQuizAndQuestions();
    fetchAttempts();
  }, [id, toast, navigate]);

  if (isLoadingQuiz || isLoadingAttempts) {
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
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к тестам
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle>Статистика по тесту: {quiz?.title}</CardTitle>
              <CardDescription>
                Общая статистика по прохождениям теста
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead>
                    <tr>
                      <th className="p-2 border-b text-left">Пользователь</th>
                      <th className="p-2 border-b text-left">Дата прохождения</th>
                      <th className="p-2 border-b text-left">Результат</th>
                      <th className="p-2 border-b text-left">Процент</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => (
                      <tr key={attempt.id}>
                        <td className="p-2 border-b">{attempt.user_email}</td>
                        <td className="p-2 border-b">
                          {new Date(attempt.started_at).toLocaleDateString()}
                        </td>
                        <td className="p-2 border-b">
                          {attempt.score} / {attempt.max_score}
                        </td>
                        <td className="p-2 border-b">
                          {Math.round((attempt.score || 0) / (attempt.max_score || 1) * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default QuizStats;
