
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase, Quiz } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const BrowseQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPublicQuizzes();
  }, []);

  const fetchPublicQuizzes = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all public quizzes
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setQuizzes(data || []);
    } catch (error) {
      console.error('Ошибка при загрузке публичных тестов:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить публичные тесты.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTakeQuiz = (quizId: string) => {
    navigate(`/quiz/take/${quizId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold mb-6">Публичные тесты</h1>
          
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Поиск тестов..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => (
                <Card key={quiz.id} className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
                    <CardDescription className="flex items-center text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(quiz.created_at), 'dd MMMM yyyy', { locale: ru })}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground line-clamp-3">
                      {quiz.description || 'Нет описания'}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="pt-2">
                    <Button 
                      className="w-full" 
                      onClick={() => handleTakeQuiz(quiz.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Пройти тест
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">Тесты не найдены</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Попробуйте изменить поисковый запрос.' : 'Публичные тесты отсутствуют.'}
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BrowseQuizzes;
