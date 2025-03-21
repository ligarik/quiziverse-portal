
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-6">О нас</h1>
          
          <div className="prose max-w-none">
            <p className="mb-4">
              QuizCraft - это современная платформа для создания и прохождения интерактивных тестов и опросов. 
              Наша миссия - сделать процесс тестирования и обучения максимально простым и эффективным.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Наши цели</h2>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li>Предоставить удобный и интуитивно понятный инструмент для создания разнообразных тестов.</li>
              <li>Обеспечить преподавателей и организаторов тестирования детальной аналитикой результатов.</li>
              <li>Сделать процесс прохождения тестов увлекательным и информативным для учащихся.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Особенности платформы</h2>
            <p className="mb-4">
              QuizCraft предлагает широкий спектр типов вопросов, включая выбор одного или нескольких вариантов, 
              текстовые ответы, числовые ответы и вопросы на соответствие. Вы можете настроить время прохождения теста, 
              параметры отображения результатов и собирать дополнительную информацию об участниках.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Контакты</h2>
            <p className="mb-4">
              Если у вас возникли вопросы или предложения по улучшению платформы, 
              пожалуйста, свяжитесь с нами по электронной почте: <strong>info@quizcraft.com</strong>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
