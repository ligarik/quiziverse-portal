import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { supabase, Quiz, Question, Answer, QuestionType } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import CustomFieldsForm from '@/components/CustomFieldsForm';

interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

type SingleChoiceAnswer = string;
type MultipleChoiceAnswer = string[];
type TextAnswer = string;
type NumberAnswer = number;
type MatchingAnswer = Record<string, string>;

type QuestionAnswers = {
  [questionId: string]: SingleChoiceAnswer | MultipleChoiceAnswer | MatchingAnswer;
};

const TakeQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<QuestionAnswers>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [numberAnswers, setNumberAnswers] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [customFieldsStep, setCustomFieldsStep] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
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
          navigate('/');
          return;
        }
        
        const typedQuizData = quizData as Quiz;
        
        if (typedQuizData.password) {
          setPasswordRequired(true);
          setQuiz(typedQuizData);
          setIsLoading(false);
          return;
        }
        
        await loadQuizQuestions(typedQuizData);
      } catch (error) {
        console.error('Ошибка при загрузке теста:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные теста',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizData();
  }, [id, navigate, toast]);
  
  const loadQuizQuestions = async (quizData: Quiz) => {
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizData.id);
      
      if (questionsError) throw questionsError;
      
      let questionsWithAnswers: QuestionWithAnswers[] = [];
      
      for (const question of questionsData || []) {
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
          case 'matching':
            questionType = QuestionType.MATCHING;
            break;
          case 'number':
            questionType = QuestionType.NUMBER_INPUT;
            break;
          default:
            questionType = QuestionType.SINGLE_CHOICE;
        }
        
        const answers: Answer[] = [];
        
        if (question.options) {
          const options = question.options as any[];
          const correctAnswers = question.correct_answers as any[];
          
          options.forEach((option, index) => {
            if (questionType === QuestionType.MATCHING) {
              answers.push({
                id: option.id || index.toString(),
                question_id: question.id,
                answer_text: option.text,
                matching_text: option.matchingText || "",
                is_correct: correctAnswers ? correctAnswers.includes(option.id || index.toString()) : false,
                created_at: question.created_at
              });
            } else {
              answers.push({
                id: option.id || index.toString(),
                question_id: question.id,
                answer_text: option.text,
                is_correct: correctAnswers ? correctAnswers.includes(option.id || index.toString()) : false,
                created_at: question.created_at
              });
            }
          });
        } else if (questionType === QuestionType.TEXT_INPUT && question.correct_answers) {
          const correctAnswer = (question.correct_answers as any[])[0] || "";
          answers.push({
            id: "0",
            question_id: question.id,
            answer_text: correctAnswer,
            is_correct: true,
            created_at: question.created_at
          });
        } else if (questionType === QuestionType.NUMBER_INPUT && question.correct_answers) {
          const correctAnswer = (question.correct_answers as any[])[0] || 0;
          answers.push({
            id: "0",
            question_id: question.id,
            answer_text: correctAnswer.toString(),
            is_correct: true,
            created_at: question.created_at
          });
        }
        
        questionsWithAnswers.push({
          id: question.id,
          quiz_id: question.quiz_id,
          text: question.content,
          content: question.content,
          created_at: question.created_at,
          question_type: questionType,
          points: question.points,
          image_url: question.image_url,
          position: question.position,
          answers
        });
      }
      
      if (quizData.randomize_questions) {
        questionsWithAnswers.sort(() => Math.random() - 0.5);
      } else {
        questionsWithAnswers.sort((a, b) => a.position - b.position);
      }
      
      if (quizData.question_limit && quizData.question_limit > 0 && questionsWithAnswers.length > quizData.question_limit) {
        questionsWithAnswers = questionsWithAnswers.slice(0, quizData.question_limit);
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
        
        const { data: customFields, error: customFieldsError } = await supabase
          .from('quiz_custom_fields')
          .select('*')
          .eq('quiz_id', id);
        
        if (customFieldsError) throw customFieldsError;
        
        if (customFields && customFields.length > 0) {
          setCustomFieldsStep(true);
        }
      }
      
      setIsStarted(true);
    } catch (error) {
      console.error('Ошибка при загрузке вопросов:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить вопросы теста',
        variant: 'destructive',
      });
      navigate('/');
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quiz) return;
    
    setIsCheckingPassword(true);
    setPasswordError('');
    
    try {
      if (password === quiz.password) {
        setPasswordRequired(false);
        await loadQuizQuestions(quiz);
      } else {
        setPasswordError('Неверный пароль. Пожалуйста, попробуйте снова.');
      }
    } catch (error) {
      console.error('Ошибка при проверке пароля:', error);
    } finally {
      setIsCheckingPassword(false);
    }
  };
  
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

  const handleSelectMultipleAnswers = (questionId: string, answerId: string) => {
    const currentAnswers = (selectedAnswers[questionId] || []) as string[];
    
    if (currentAnswers.includes(answerId)) {
      setSelectedAnswers({
        ...selectedAnswers,
        [questionId]: currentAnswers.filter(id => id !== answerId)
      });
    } else {
      setSelectedAnswers({
        ...selectedAnswers,
        [questionId]: [...currentAnswers, answerId]
      });
    }
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setTextAnswers({
      ...textAnswers,
      [questionId]: text
    });
  };

  const handleNumberAnswer = (questionId: string, value: number) => {
    setNumberAnswers({
      ...numberAnswers,
      [questionId]: value
    });
  };

  const handleMatchingSelection = (questionId: string, itemId: string, matchId: string) => {
    const currentMatches = (selectedAnswers[questionId] || {}) as Record<string, string>;
    
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: {
        ...currentMatches,
        [itemId]: matchId
      }
    });
  };

  const handleSubmitQuiz = async () => {
    if (!id || !questions.length) return;
    
    const unansweredQuestions = questions.filter(q => {
      if (q.question_type === QuestionType.TEXT_INPUT) {
        return !textAnswers[q.id];
      } else if (q.question_type === QuestionType.NUMBER_INPUT) {
        return numberAnswers[q.id] === undefined;
      } else if (q.question_type === QuestionType.MULTIPLE_CHOICE) {
        const multipleAnswers = selectedAnswers[q.id] as string[] || [];
        return multipleAnswers.length === 0;
      } else if (q.question_type === QuestionType.MATCHING) {
        const matches = selectedAnswers[q.id] as Record<string, string> || {};
        return !matches || Object.keys(matches).length < q.answers.length;
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
        let isCorrect = false;
        let userAnswer: any = null;
        
        if (question.question_type === QuestionType.TEXT_INPUT) {
          userAnswer = textAnswers[question.id];
          isCorrect = false;
        } else if (question.question_type === QuestionType.NUMBER_INPUT) {
          userAnswer = numberAnswers[question.id];
          const correctNumber = Number(question.answers[0]?.answer_text || 0);
          isCorrect = userAnswer === correctNumber;
        } else if (question.question_type === QuestionType.MULTIPLE_CHOICE) {
          userAnswer = selectedAnswers[question.id] || [];
          const correctIds = question.answers
            .filter(a => a.is_correct)
            .map(a => a.id);
          
          isCorrect = 
            Array.isArray(userAnswer) && 
            userAnswer.length === correctIds.length && 
            correctIds.every(id => userAnswer.includes(id));
        } else if (question.question_type === QuestionType.MATCHING) {
          const selectedMatches = selectedAnswers[question.id] as Record<string, string> || {};
          userAnswer = selectedMatches;
          
          const correctMatches = question.answers.map((a, index) => ({
            id: a.id,
            matchingText: a.matching_text
          }));
          
          isCorrect = Object.entries(selectedMatches).every(([itemId, matchId]) => {
            const answerIndex = question.answers.findIndex(a => a.id === itemId);
            const selectedMatchIndex = question.answers.findIndex(a => a.id === matchId);
            
            if (answerIndex === -1 || selectedMatchIndex === -1) return false;
            
            return question.answers[selectedMatchIndex].matching_text === question.answers[answerIndex].matching_text;
          });
        } else {
          userAnswer = selectedAnswers[question.id];
          const correctAnswer = question.answers.find(a => a.is_correct);
          isCorrect = Boolean(userAnswer && correctAnswer?.id === userAnswer);
        }
        
        if (isCorrect) {
          correctAnswers++;
          totalPoints += question.points || 1;
        }
        
        if (user && attemptId) {
          await supabase
            .from('answers')
            .insert({
              attempt_id: attemptId,
              question_id: question.id,
              user_answer: userAnswer,
              is_correct: question.question_type === QuestionType.TEXT_INPUT ? null : isCorrect
            });
        }
      }
      
      if (user && attemptId) {
        const hasTextQuestions = questions.some(q => q.question_type === QuestionType.TEXT_INPUT);
        
        await supabase
          .from('quiz_attempts')
          .update({
            score: totalPoints,
            completed_at: new Date().toISOString(),
            is_graded: !hasTextQuestions
          })
          .eq('id', attemptId);
      }
      
      setScore({
        correct: correctAnswers,
        total: questions.length
      });
      
      setQuizComplete(true);
      setIsFinished(true);
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

  const handleCustomFieldsComplete = () => {
    setCustomFieldsStep(false);
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

  if (passwordRequired && quiz) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow py-16 px-4 md:px-6">
          <div className="container mx-auto max-w-3xl">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
                {quiz.description && (
                  <CardDescription>{quiz.description}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                    <div className="flex items-start">
                      <Lock className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                      <div>
                        <h3 className="font-medium text-amber-900">Тест защищен паролем</h3>
                        <p className="text-amber-700 text-sm">Для прохождения теста введите пароль, предоставленный вашим преподавателем или организатором.</p>
                      </div>
                    </div>
                  </div>
                  
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Пароль</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={passwordError ? "border-red-500" : ""}
                      />
                      {passwordError && (
                        <p className="text-red-500 text-sm">{passwordError}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isCheckingPassword || !password}
                    >
                      {isCheckingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Проверка...
                        </>
                      ) : (
                        'Начать тест'
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (!isStarted && quiz) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow py-16 px-4 md:px-6">
          <div className="container mx-auto max-w-3xl">
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
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Введите ваш ответ"
                              value={textAnswers[currentQuestion.id] || ''}
                              onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                              className="min-h-[120px]"
                            />
                          </div>
                        ) : currentQuestion.question_type === QuestionType.NUMBER_INPUT ? (
                          <div className="space-y-2">
                            <Input
                              type="number"
                              placeholder="Введите числовой ответ"
                              value={numberAnswers[currentQuestion.id] !== undefined ? numberAnswers[currentQuestion.id] : ''}
                              onChange={(e) => handleNumberAnswer(currentQuestion.id, Number(e.target.value))}
                              className="max-w-[200px]"
                            />
                          </div>
                        ) : currentQuestion.question_type === QuestionType.MULTIPLE_CHOICE ? (
                          currentQuestion.answers.map(answer => {
                            const answers = selectedAnswers[currentQuestion.id] as string[] || [];
                            const isSelected = Array.isArray(answers) && answers.includes(answer.id);
                            
                            return (
                              <Button
                                key={answer.id}
                                variant={isSelected ? "default" : "outline"}
                                className="w-full justify-start text-left h-auto py-4 px-6"
                                onClick={() => handleSelectMultipleAnswers(currentQuestion.id, answer.id)}
                              >
                                {answer.answer_text}
                              </Button>
                            );
                          })
                        ) : currentQuestion.question_type === QuestionType.MATCHING ? (
                          <div className="space-y-4">
                            {currentQuestion.answers.map((answer, index) => {
                              const matches = selectedAnswers[currentQuestion.id] as Record<string, string> || {};
                              const selectedMatchId = matches[answer.id];
                              
                              const selectedMatch = selectedMatchId 
                                ? currentQuestion.answers.find(a => a.id === selectedMatchId)
                                : undefined;
                              
                              return (
                                <div key={answer.id} className="p-3 border rounded-md">
                                  <div className="font-medium mb-2">{answer.answer_text}</div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {currentQuestion.answers.map(matchOption => (
                                      <Button
                                        key={`${answer.id}-${matchOption.id}`}
                                        variant={selectedMatchId === matchOption.id ? "default" : "outline"}
                                        className="w-full justify-start text-left h-auto py-2 px-3 text-sm"
                                        onClick={() => handleMatchingSelection(currentQuestion.id, answer.id, matchOption.id)}
                                      >
                                        {matchOption.matching_text}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
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
                      currentQuestion?.question_type === QuestionType.TEXT_INPUT 
                        ? !textAnswers[currentQuestion?.id] 
                        : currentQuestion?.question_type === QuestionType.NUMBER_INPUT
                          ? numberAnswers[currentQuestion?.id] === undefined
                          : currentQuestion?.question_type === QuestionType.MULTIPLE_CHOICE
                            ? !selectedAnswers[currentQuestion?.id] || 
                              (selectedAnswers[currentQuestion?.id] as string[]).length === 0
                            : currentQuestion?.question_type === QuestionType.MATCHING
                              ? !selectedAnswers[currentQuestion?.id] || 
                                Object.keys(selectedAnswers[currentQuestion?.id] as Record<string, string> || {}).length < 
                                (currentQuestion?.answers.length || 0)
                              : !selectedAnswers[currentQuestion?.id]
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
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow py-16 px-4 md:px-6">
          <div className="container mx-auto max-w-3xl">
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
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

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
          
          {customFieldsStep && attemptId ? (
            <CustomFieldsForm 
              quizId={id || ''} 
              attemptId={attemptId} 
              onComplete={handleCustomFieldsComplete} 
            />
          ) : !quizComplete ? (
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
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Введите ваш ответ"
                              value={textAnswers[currentQuestion.id] || ''}
                              onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                              className="min-h-[120px]"
                            />
                          </div>
                        ) : currentQuestion.question_type === QuestionType.NUMBER_INPUT ? (
                          <div className="space-y-2">
                            <Input
                              type="number"
                              placeholder="Введите числовой ответ"
                              value={numberAnswers[currentQuestion.id] !== undefined ? numberAnswers[currentQuestion.id] : ''}
                              onChange={(e) => handleNumberAnswer(currentQuestion.id, Number(e.target.value))}
                              className="max-w-[200px]"
                            />
                          </div>
                        ) : currentQuestion.question_type === QuestionType.MULTIPLE_CHOICE ? (
                          currentQuestion.answers.map(answer => {
                            const answers = selectedAnswers[currentQuestion.id] as string[] || [];
                            const isSelected = Array.isArray(answers) && answers.includes(answer.id);
                            
                            return (
                              <Button
                                key={answer.id}
                                variant={isSelected ? "default" : "outline"}
                                className="w-full justify-start text-left h-auto py-4 px-6"
                                onClick={() => handleSelectMultipleAnswers(currentQuestion.id, answer.id)}
                              >
                                {answer.answer_text}
                              </Button>
                            );
                          })
                        ) : currentQuestion.question_type === QuestionType.MATCHING ? (
                          <div className="space-y-4">
                            {currentQuestion.answers.map((answer, index) => {
                              const matches = selectedAnswers[currentQuestion.id] as Record<string, string> || {};
                              const selectedMatchId = matches[answer.id];
                              
                              const selectedMatch = selectedMatchId 
                                ? currentQuestion.answers.find(a => a.id === selectedMatchId)
                                : undefined;
                              
                              return (
                                <div key={answer.id} className="p-3 border rounded-md">
                                  <div className="font-medium mb-2">{answer.answer_text}</div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {currentQuestion.answers.map(matchOption => (
                                      <Button
                                        key={`${answer.id}-${matchOption.id}`}
                                        variant={selectedMatchId === matchOption.id ? "default" : "outline"}
                                        className="w-full justify-start text-left h-auto py-2 px-3 text-sm"
                                        onClick={() => handleMatchingSelection(currentQuestion.id, answer.id, matchOption.id)}
                                      >
                                        {matchOption.matching_text}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
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
                      currentQuestion?.question_type === QuestionType.TEXT_INPUT 
                        ? !textAnswers[currentQuestion?.id] 
                        : currentQuestion?.question_type === QuestionType.NUMBER_INPUT
                          ? numberAnswers[currentQuestion?.id] === undefined
                          : currentQuestion?.question_type === QuestionType.MULTIPLE_CHOICE
                            ? !selectedAnswers[currentQuestion?.id] || 
                              (selectedAnswers[currentQuestion?.id] as string[]).length === 0
                            : currentQuestion?.question_type === QuestionType.MATCHING
                              ? !selectedAnswers[currentQuestion?.id] || 
                                Object.keys(selectedAnswers[currentQuestion?.id] as Record<string, string> || {}).length < 
                                (currentQuestion?.answers.length || 0)
                              : !selectedAnswers[currentQuestion?.id]
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
