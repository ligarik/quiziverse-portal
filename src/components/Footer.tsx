
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white py-12 border-t border-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="text-2xl font-semibold text-foreground">
              Quiz<span className="text-primary">Craft</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Создавайте и проходите интерактивные тесты с легкостью.
            </p>
          </div>
          
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Страницы</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    Главная
                  </Link>
                </li>
                <li>
                  <Link to="/browse" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    Поиск тестов
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    Панель управления
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Аккаунт</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    Вход
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    Регистрация
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Связь</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    О нас
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    Поддержка
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    Контакты
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            &copy; {currentYear} QuizCraft. Все права защищены.
          </p>
          
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Условия использования
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Политика конфиденциальности
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
