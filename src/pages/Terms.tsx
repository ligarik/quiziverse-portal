
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Terms = () => {
  const currentDate = new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow py-12 px-4 md:px-6 mt-16">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-6">Условия использования</h1>
          
          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Введение</h2>
              <p>
                Добро пожаловать на QuizCraft! Наш сайт предоставляет возможность создавать, проходить и делиться тестами. 
                Мы ценим ваше доверие и стремимся защищать вашу конфиденциальность. Настоящая Политика конфиденциальности и 
                Условия пользования регулируют использование нашего сайта и описывают, как мы собираем, используем и защищаем вашу информацию.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">2. Соглашение с условиями</h2>
              <p>
                Используя наш сайт, вы соглашаетесь с настоящими Условиями пользования и Политикой конфиденциальности. 
                Если вы не согласны с этими условиями, пожалуйста, не используйте наш сайт.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">3. Сбор информации</h2>
              <p>Мы можем собирать следующую информацию:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Личные данные: имя, адрес электронной почты, данные аккаунта (если вы регистрируетесь).</li>
                <li>Данные тестов: результаты тестов, созданные вами тесты, ответы на вопросы.</li>
                <li>Технические данные: IP-адрес, тип браузера, операционная система, данные о посещении сайта (с помощью cookies и аналогичных технологий).</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">4. Использование информации</h2>
              <p>Мы используем вашу информацию для следующих целей:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Предоставление доступа к функционалу сайта (создание и прохождение тестов).</li>
                <li>Улучшение качества сайта и разработка новых функций.</li>
                <li>Обратная связь с пользователями (например, ответы на вопросы или уведомления).</li>
                <li>Анализ использования сайта для улучшения его работы.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">5. Хранение и защита данных</h2>
              <p>
                Мы принимаем разумные меры для защиты вашей информации от несанкционированного доступа, изменения, 
                раскрытия или уничтожения. Однако ни один метод передачи данных через интернет или метод электронного 
                хранения не является абсолютно безопасным.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">6. Cookies и отслеживание</h2>
              <p>
                Мы используем cookies и аналогичные технологии для улучшения работы сайта, анализа трафика и 
                персонализации контента. Вы можете отключить cookies в настройках вашего браузера, но это может 
                повлиять на функциональность сайта.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">7. Обмен информацией с третьими лицами</h2>
              <p>
                Мы не продаем и не передаем ваши личные данные третьим лицам без вашего согласия, за исключением случаев, 
                когда это требуется по закону или для предоставления услуг сайта (например, хостинг или аналитические сервисы).
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">8. Права пользователей</h2>
              <p>Вы имеете право:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Запросить доступ к вашим личным данным.</li>
                <li>Исправить неточности в ваших данных.</li>
                <li>Удалить ваши данные (если это не противоречит закону).</li>
                <li>Отказаться от получения рекламных рассылок.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">9. Условия пользования</h2>
              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <strong>Регистрация:</strong> Для доступа к некоторым функциям сайта может потребоваться регистрация. 
                  Вы обязаны предоставлять точную информацию и поддерживать актуальность данных.
                </li>
                <li>
                  <strong>Создание тестов:</strong> Вы несете ответственность за контент, который создаете и публикуете на сайте. 
                  Запрещено размещать материалы, нарушающие авторские права, содержащие ненависть, насилие или незаконный контент.
                </li>
                <li>
                  <strong>Использование тестов:</strong> Результаты тестов носят информационный характер и не являются 
                  профессиональной консультацией.
                </li>
                <li>
                  <strong>Ограничения:</strong> Запрещено использовать сайт для незаконных целей, распространения 
                  вредоносного ПО или нарушения работы сайта.
                </li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">10. Изменения в политике</h2>
              <p>
                Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности и Условия 
                пользования. Изменения вступают в силу с момента их публикации на сайте. Рекомендуем периодически 
                проверять эту страницу.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">11. Контакты</h2>
              <p>
                Если у вас есть вопросы или предложения относительно нашей Политики конфиденциальности или Условий 
                пользования, пожалуйста, свяжитесь с нами по адресу: info@quizcraft.com
              </p>
            </section>
            
            <div className="mt-8 text-sm text-gray-600 border-t pt-4">
              <p>Дата вступления в силу: 1 января 2024 г.</p>
              <p>Последнее обновление: {currentDate}</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
