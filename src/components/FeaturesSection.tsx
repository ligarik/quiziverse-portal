
import { BrainCircuit, Layout, Globe, Zap, BarChart3, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => {
  return (
    <div 
      className="bg-white rounded-xl p-6 shadow-soft border border-gray-100 transition-all duration-300 hover:shadow-medium hover:border-primary/20 slide-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: <Layout className="h-6 w-6" />,
      title: "Интуитивный редактор",
      description: "Создавайте профессиональные тесты с помощью простого и мощного редактора."
    },
    {
      icon: <BrainCircuit className="h-6 w-6" />,
      title: "Различные типы вопросов",
      description: "Выбор из нескольких вариантов, открытые вопросы, сопоставление и многое другое."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Делитесь с легкостью",
      description: "Поделитесь своими тестами с кем угодно с помощью простой ссылки."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Мгновенные результаты",
      description: "Получайте мгновенную обратную связь и результаты после прохождения теста."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Подробная аналитика",
      description: "Анализируйте результаты тестов с помощью детальной статистики и отчетов."
    },
    {
      icon: <UserCircle className="h-6 w-6" />,
      title: "Персональный кабинет",
      description: "Управляйте всеми своими тестами и результатами в одном месте."
    }
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 slide-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Возможности QuizCraft</h2>
          <p className="text-lg text-muted-foreground">
            Все необходимые инструменты для создания и управления тестами в одном приложении
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={0.1 + index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
