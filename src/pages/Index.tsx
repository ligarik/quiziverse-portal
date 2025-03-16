
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />

        {/* How It Works Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 slide-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Как это работает</h2>
              <p className="text-lg text-muted-foreground">
                Создание и прохождение тестов еще никогда не было таким простым
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center text-xl font-bold mb-6">1</div>
                <h3 className="text-xl font-semibold mb-3">Создайте аккаунт</h3>
                <p className="text-muted-foreground">
                  Зарегистрируйтесь бесплатно и получите доступ ко всем возможностям платформы.
                </p>
              </div>
              
              <div className="text-center slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center text-xl font-bold mb-6">2</div>
                <h3 className="text-xl font-semibold mb-3">Создайте тест</h3>
                <p className="text-muted-foreground">
                  Используйте интуитивный редактор для создания тестов с различными типами вопросов.
                </p>
              </div>
              
              <div className="text-center slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center text-xl font-bold mb-6">3</div>
                <h3 className="text-xl font-semibold mb-3">Поделитесь и анализируйте</h3>
                <p className="text-muted-foreground">
                  Отправьте ссылку на тест участникам и получите подробную аналитику результатов.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-medium border border-gray-100 text-center slide-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Готовы начать?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Присоединяйтесь к тысячам пользователей, которые уже создают и проходят тесты с QuizCraft.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="h-12 px-6">
                  <Link to="/signup">
                    Зарегистрироваться бесплатно
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-6 group">
                  <Link to="/browse">
                    Найти тесты
                    <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
