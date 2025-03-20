
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { supabase, Quiz, Question, Answer, QuestionType } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

const TakeQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .eq('is_published', true)
          .single();
        
        if (quizError) throw quizError;
        
        if (!quizData) {
          toast({
            title: 'Ошибка',
            description: 'Тест не найден или не опубликован',
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', id);
        
        if (questionsError) throw questionsError;
        
        const questionsWithAnswers: QuestionWithAnswers[] = [];
        
        for (const question of questionsData || []) {
          // Map database type to QuestionType enum
          let questionType: QuestionType;
          
          switch (question.question_type) {
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
            default:
              questionType = QuestionType.SINGLE_CHOICE;
          }
          
          // Get answers from options or create dummy answers
          const answers: Answer[] = [];
          
          if (question.options) {
            const options = question.options as any[];
            const correctAnswers = question.correct_answers as any[];
            
            options.forEach((option, index) => {
              answers.push({
                id: option.id || index.toString(),
                question_id: question.id,
                answer_text: option.text,
                is_correct: correctAnswers ? correctAnswers.includes(option.id || index.toString()) : false,
                created_at: question.created_at
              });
            });
          } else if (questionType === QuestionType.TEXT_INPUT && question.correct_answers) {
            // For text input questions, create a single correct answer
            const correctAnswer = (question.correct_answers as any[])[0] || "";
            answers.push({
              id: "0",
              question_id: question.id,
              answer_text: correctAnswer,
              is_correct: true,
              created_at: question.created_at
            });
          }
          
          questionsWithAnswers.push({
            id: question.id,
            quiz_id: question.quiz_id,
            text: question.content,  // Map content to text for UI
            content: question.content,
            created_at: question.created_at,
            question_type: questionType,
            points: question.points,
            image_url: question.image_url,
            position: question.position,
            answers
          });
        }
        
        setQuiz(quizData);
        setQuestions(questionsWithAnswers);
        
        if (user) {
          const { data: attemptData, error: attemptError } = await supabase
            .from('quiz_attempts')
            .insert({
              quiz_id: id,
              user_id: user.id,
              score: 0,
              max_score: questionsWithAnswers.reduce((total, q) => total + (q.points || 1), 0)
            })
            .select('id')
            .single();
          
          if (attemptError) throw attemptError;
          
          setAttemptId(attemptData.id);
        }
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

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSelectAnswer = (questionId: string, answerId: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerId
    });
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setTextAnswers({
      ...textAnswers,
      [questionId]: text
    });
  };

  const handleSubmitQuiz = async () => {
    if (!id || !questions.length) return;
    
    // Check for unanswered questions
    const unansweredQuestions = questions.filter(q => {
      if (q.question_type === QuestionType.TEXT_INPUT) {
        return !textAnswers[q.id];
      } else {
        return !selectedAnswers[q.id];
      }
    });
    
    if (unansweredQuestions.length > 0) {
      toast({
        title: 'Не все вопросы отвечены',
        description: `Вы не ответили на ${unansweredQuestions.length} вопросов. Хотите продолжить?`,
        action: (
          <Button onClick={submitAnswers}>Завершить тест</Button>
        ),
      });
      return;
    }
    
    await submitAnswers();
  };

  const submitAnswers = async () => {
    if (!id || !questions.length) return;
    
    try {
      setIsSubmitting(true);
      
      let correctAnswers = 0;
      let totalPoints = 0;
      
      for (const question of questions) {
        const isTextQuestion = question.question_type === QuestionType.TEXT_INPUT;
        const userAnswer = isTextQuestion ? textAnswers[question.id] : selectedAnswers[question.id];
        
        let isCorrect = false;
        
        if (isTextQuestion) {
          // For text questions, we'll mark them for manual grading initially
          // and set is_correct to null (pending)
          isCorrect = false; // Will be manually graded later
        } else {
          // For choice questions, check if the selected answer is correct
          const correctAnswer = question.answers.find(a => a.is_correct);
          isCorrect = Boolean(userAnswer && correctAnswer?.id === userAnswer);
        }
        
        if (isCorrect && !isTextQuestion) {
          correctAnswers++;
          totalPoints += question.points || 1;
        }
        
        if (user && attemptId) {
          await supabase
            .from('answers')  // Using answers table instead of question_responses
            .insert({
              attempt_id: attemptId,
              question_id: question.id,
              user_answer: isTextQuestion ? userAnswer : selectedAnswers[question.id],
              is_correct: isTextQuestion ? null : isCorrect // null for text questions pending review
            });
        }
      }
      
      if (user && attemptId) {
        // Set the score but mark as not graded for quizzes with text questions
        const hasTextQuestions = questions.some(q => q.question_type === QuestionType.TEXT_INPUT);
        
        await supabase
          .from('quiz_attempts')
          .update({
            score: correctAnswers,
            completed_at: new Date().toISOString(),
            is_graded: !hasTextQuestions // Only mark as graded if there are no text questions
          })
          .eq('id', attemptId);
      }
      
      setScore({
        correct: correctAnswers,
        total: questions.length
      });
      
      setQuizComplete(true);
    } catch (error) {
      console.error('Ошибка при отправке ответов:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить ваши ответы',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 
    ? Math.round((currentQuestionIndex + 1) / questions.length * 100) 
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-3xl">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к тестам
          </Button>
          
          {!quizComplete ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{quiz?.title}</CardTitle>
                    <CardDescription>{quiz?.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold">
                      {currentQuestionIndex + 1} / {questions.length}
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2 mt-4">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                {currentQuestion && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        {currentQuestion.text}
                      </h3>
                      
                      {currentQuestion.image_url && (
                        <div className="mb-4">
                          <img 
                            src={currentQuestion.image_url}
                            alt="Question image"
                            className="max-h-64 rounded-md object-contain mx-auto"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        {currentQuestion.question_type === QuestionType.TEXT_INPUT ? (
                          // Text input question type
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Введите ваш ответ"
                              value={textAnswers[currentQuestion.id] || ''}
                              onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                              className="min-h-[120px]"
                            />
                          </div>
                        ) : (
                          // Multiple choice question types
                          currentQuestion.answers.map(answer => (
                            <Button
                              key={answer.id}
                              variant={selectedAnswers[currentQuestion.id] === answer.id ? "default" : "outline"}
                              className="w-full justify-start text-left h-auto py-4 px-6"
                              onClick={() => handleSelectAnswer(currentQuestion.id, answer.id)}
                            >
                              {answer.answer_text}
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Назад
                </Button>
                
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={handleNextQuestion}
                    disabled={
                      (currentQuestion?.question_type === QuestionType.TEXT_INPUT 
                        ? !textAnswers[currentQuestion?.id] 
                        : !selectedAnswers[currentQuestion?.id])
                    }
                  >
                    Далее
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Завершение...
                      </>
                    ) : (
                      "Завершить тест"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
                <CardTitle className="text-center text-2xl">Тест завершен</CardTitle>
                <CardDescription className="text-center text-lg">
                  {questions.some(q => q.question_type === QuestionType.TEXT_INPUT) 
                    ? "Ваш результат будет доступен после проверки ответов на текстовые вопросы."
                    : `Вы ответили правильно на ${score.correct} из ${score.total} вопросов`
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 pb-6">
                {!questions.some(q => q.question_type === QuestionType.TEXT_INPUT) && (
                  <>
                    <div className="w-full bg-muted rounded-full h-4 mt-4">
                      <div 
                        className={`h-4 rounded-full transition-all duration-1000 ${
                          score.correct === score.total ? 'bg-green-600' :
                          score.correct / score.total > 0.7 ? 'bg-green-500' :
                          score.correct / score.total > 0.4 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(score.correct / score.total) * 100}%` }}
                      />
                    </div>
                    
                    <p className="text-center mt-6 text-lg">
                      Ваш результат: {Math.round((score.correct / score.total) * 100)}%
                    </p>
                  </>
                )}
              </CardContent>
              
              <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Вернуться к тестам
                </Button>
                {user && quiz && (
                  <Button
                    onClick={() => navigate(`/quiz/stats/${quiz.id}`)}
                  >
                    Посмотреть статистику
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TakeQuiz;
