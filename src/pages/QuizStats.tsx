import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase, Question, QuestionType } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface AttemptWithUser {
  id: string;
  quiz_id: string;
  user_id: string;
  user_email: string;
  score: number;
  max_score: number;
  started_at: string;
  completed_at: string | null;
  is_graded: boolean;
  created_at: string;
}

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
        
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            users:user_id(email)
          `)
          .eq('quiz_id', id)
          .not('completed_at', 'is', null);
        
        if (attemptsError) throw attemptsError;

        const formattedAttempts: AttemptWithUser[] = (attemptsData || []).map(attempt => ({
          id: attempt.id,
          quiz_id: attempt.quiz_id,
          user_id: attempt.user_id,
          user_email: attempt.users?.email || 'Unknown',
          score: attempt.score || 0,
          max_score: attempt.max_score || 0,
          started_at: attempt.started_at,
          completed_at: attempt.completed_at,
          is_graded: attempt.is_graded,
          created_at: attempt.started_at
        }));
        
        setAttempts(formattedAttempts);
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
        
        setQuestions(questionsData.map(q => ({
          id: q.id,
          quiz_id: q.quiz_id,
          content: q.content,
          text: q.content,
          created_at: q.created_at,
          question_type: mapDatabaseQuestionType(q.question_type),
          points: q.points,
          image_url: q.image_url,
          position: q.position
        })));
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

function mapDatabaseQuestionType(dbType: string): QuestionType {
  switch (dbType) {
    case 'single_choice':
      return QuestionType.SINGLE_CHOICE;
    case 'multiple_choice':
      return QuestionType.MULTIPLE_CHOICE;
    case 'text':
      return QuestionType.TEXT_INPUT;
    case 'true_false':
      return QuestionType.TRUE_FALSE;
    case 'matching':
      return QuestionType.MATCHING;
    case 'number':
      return QuestionType.NUMBER_INPUT;
    default:
      return QuestionType.SINGLE_CHOICE;
  }
}
