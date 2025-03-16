
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

const CreateQuiz = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название теста не может быть пустым',
        variant: 'destructive',
      });
      return;
    }
    
    if (!user) {
      toast({
        title: 'Ошибка',
        description: 'Вы должны быть авторизованы для создания теста',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Создаем тест в Supabase
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .insert({
          title,
          description,
          user_id: user.id,
          is_published: false
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Тест создан',
        description: 'Ваш тест был успешно создан. Теперь вы можете добавить вопросы.',
      });
      
      // Перенаправляем на страницу редактирования теста
      navigate(`/quiz/edit/${quiz.id}`);
    } catch (error) {
      console.error('Ошибка при создании теста:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать тест. Пожалуйста, попробуйте еще раз.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

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
          
          <Card>
            <CardHeader>
              <CardTitle>Создать новый тест</CardTitle>
              <CardDescription>
                Заполните основную информацию о вашем тесте. После создания вы сможете добавить вопросы.
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleCreateQuiz}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название теста</Label>
                  <Input
                    id="title"
                    placeholder="Введите название теста"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    placeholder="Введите описание теста (опционально)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isCreating || !title.trim()}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    "Создать тест"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreateQuiz;
