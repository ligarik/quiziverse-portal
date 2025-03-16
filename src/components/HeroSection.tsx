
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 max-w-xl">
            <div className="space-y-2">
              <p className="inline-block text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full slide-in-right" style={{ animationDelay: '0.1s' }}>
                Инновационная платформа для тестирования
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight slide-in-right" style={{ animationDelay: '0.2s' }}>
                Создавайте и проходите тесты с легкостью
              </h1>
              <p className="text-xl text-muted-foreground mt-4 slide-in-right" style={{ animationDelay: '0.3s' }}>
                Интуитивно понятный редактор. Мгновенные результаты. Бесконечные возможности.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 slide-in-right" style={{ animationDelay: '0.4s' }}>
              <Button asChild size="lg" className="h-12 px-6">
                <Link to="/signup">
                  Начать бесплатно
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 group">
                <Link to="/browse">
                  Найти тесты
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            
            <div className="pt-4 space-y-2 text-sm text-muted-foreground slide-in-right" style={{ animationDelay: '0.5s' }}>
              <p className="flex items-center">
                <span className="inline-block w-1 h-1 rounded-full bg-primary mr-2"></span>
                Без ограничений на количество тестов
              </p>
              <p className="flex items-center">
                <span className="inline-block w-1 h-1 rounded-full bg-primary mr-2"></span>
                Интерактивные вопросы и варианты ответов
              </p>
              <p className="flex items-center">
                <span className="inline-block w-1 h-1 rounded-full bg-primary mr-2"></span>
                Детальная статистика результатов
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-2xl transform rotate-3 scale-105"></div>
            <div className="relative bg-white rounded-2xl shadow-soft overflow-hidden scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="aspect-video bg-muted/50 p-8 flex items-center justify-center">
                <div className="w-full max-w-md bg-white rounded-lg shadow-medium p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="h-6 bg-primary/10 rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-10 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                  <div className="flex justify-end">
                    <div className="h-9 bg-primary/80 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
