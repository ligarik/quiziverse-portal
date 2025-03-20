import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { supabase, Quiz } from '@/integrations/supabase/client';

const BrowseQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizzes = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('quizzes')
          .select('*')
          .eq('is_public', true);

        if (category !== 'all') {
          // Assuming you have a category column in your quizzes table
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setQuizzes(data || []);
      } catch (error: any) {
        console.error('Error fetching quizzes:', error);
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
  }, [category, toast]);

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Доступные тесты</h1>
              <p className="text-muted-foreground">Выберите тест и проверьте свои знания</p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="w-full sm:max-w-[200px]">
                <Input
                  type="search"
                  placeholder="Поиск теста..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.map(quiz => (
                <Card key={quiz.id} className="bg-card text-card-foreground shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-muted-foreground">
                      {quiz.description}
                    </CardDescription>
                    <Button
                      variant="secondary"
                      className="mt-4 w-full"
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
                    >
                      Начать тест
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BrowseQuizzes;
