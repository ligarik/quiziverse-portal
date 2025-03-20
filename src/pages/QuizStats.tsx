import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GradeTextAnswers from '@/components/GradeTextAnswers';
import { supabase, Quiz, Question, QuestionType } from '@/integrations/supabase/client';

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
}

const QuizStats = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithUser[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Get quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .single();
        
        if (quizError) throw quizError;
        
        setQuiz(quizData);
        
        // Get quiz attempts
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', id)
          .not('completed_at', 'is', null);
        
        if (attemptsError) throw attemptsError;
        
        const formattedAttempts: AttemptWithUser[] = attemptsData.map(attempt => ({
          id: attempt.id,
          quiz_id: attempt.quiz_id,
          user_id: attempt.user_id,
          user_email: 'Unknown User', // We don't have direct access to emails here
          score: attempt.score || 0,
          max_score: attempt.max_score || 0,
          started_at: attempt.started_at,
          completed_at: attempt.completed_at,
          is_graded: attempt.is_graded
        }));
        
        setAttempts(formattedAttempts);
        
        // Get questions for this quiz
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', id);
        
        if (questionsError) throw questionsError;
        
        // Transform DB questions to our Question interface
        const transformedQuestions: Question[] = questionsData.map(q => {
          // Convert database type to enum type
          let questionType: QuestionType;
          
          switch (q.question_type) {
            case 'single_choice':
              questionType = QuestionType.SINGLE_CHOICE;
              break;
            case 'multiple_choice':
              questionType = QuestionType.MULTIPLE_CHOICE;
              break;
            case 'text':
              questionType = QuestionType.TEXT_INPUT;
              break;
            case 'true_false':
              questionType = QuestionType.TRUE_FALSE;
              break;
            case 'matching':
              questionType = QuestionType.MATCHING;
              break;
            case 'number':
              questionType = QuestionType.NUMBER_INPUT;
              break;
            default:
              questionType = QuestionType.SINGLE_CHOICE;
          }
          
          return {
            id: q.id,
            quiz_id: q.quiz_id,
            text: q.content, // Mapping content to text for UI
            content: q.content,
            created_at: q.created_at,
            question_type: questionType,
            points: q.points,
            image_url: q.image_url,
            position: q.position
          };
        });
        
        setQuestions(transformedQuestions);
      } catch (error) {
        console.error('Error fetching quiz stats:', error);
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
  }, [id, navigate, toast]);

  const handleGradeAttempt = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
  };

  const handleGradingComplete = () => {
    setSelectedAttemptId(null);
    
    // Refresh the attempts list to update the grades
    if (id) {
      supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', id)
        .not('completed_at', 'is', null)
        .then(({ data }) => {
          if (data) {
            const formattedAttempts: AttemptWithUser[] = data.map(attempt => ({
              id: attempt.id,
              quiz_id: attempt.quiz_id,
              user_id: attempt.user_id,
              user_email: 'Unknown User',
              score: attempt.score || 0,
              max_score: attempt.max_score || 0,
              started_at: attempt.started_at,
              completed_at: attempt.completed_at,
              is_graded: attempt.is_graded
            }));
            
            setAttempts(formattedAttempts);
          }
        });
    }
    
    toast({
      title: 'Проверка завершена',
      description: 'Ответы успешно проверены',
    });
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
      
      <main className="flex-grow py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к тестам
          </Button>
          
          {selectedAttemptId ? (
            <div className="space-y-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedAttemptId(null)}
              >
                Вернуться к списку попыток
              </Button>
              
              <GradeTextAnswers 
                attemptId={selectedAttemptId}
                onGradingComplete={handleGradingComplete}
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{quiz?.title}</CardTitle>
                <CardDescription className="text-base">
                  {quiz?.description}
                </CardDescription>
                <CardDescription className="mt-2">
                  Всего вопросов: {questions.length}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <h3 className="text-lg font-semibold mb-4">Статистика попыток</h3>
                
                {attempts.length === 0 ? (
                  <p className="text-muted-foreground">Пока никто не проходил этот тест</p>
                ) : (
                  <div className="space-y-4">
                    {attempts.map((attempt) => {
                      const hasTextQuestions = questions.some(q => q.question_type === 'text');
                      const needsGrading = hasTextQuestions && !attempt.is_graded;
                      
                      return (
                        <div 
                          key={attempt.id} 
                          className="border rounded-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                        >
                          <div>
                            <div className="font-medium">
                              {attempt.user_id === user?.id ? 'Вы' : `Пользователь ${attempt.user_id.substring(0, 6)}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Дата: {new Date(attempt.completed_at || attempt.started_at).toLocaleString()}
                            </div>
                            <div className="mt-1">
                              {attempt.is_graded ? (
                                <span className="text-base">
                                  Результат: {attempt.score} из {attempt.max_score} 
                                  ({Math.round((attempt.score / attempt.max_score) * 100)}%)
                                </span>
                              ) : (
                                <span className="text-amber-500">
                                  Ожидает проверки
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {needsGrading && user?.id === quiz?.created_by && (
                            <Button
                              onClick={() => handleGradeAttempt(attempt.id)}
                            >
                              Проверить ответы
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default QuizStats;
