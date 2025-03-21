
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Check if we're on the home page
  const isHomePage = location.pathname === '/';

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
          isScrolled || !isHomePage
            ? 'bg-white/80 backdrop-blur-sm shadow-soft py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              to="/" 
              className="text-2xl font-semibold text-foreground transition-colors hover:text-primary"
            >
              Quiz<span className="text-primary">Craft</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/browse" 
                className="text-foreground/80 hover:text-primary transition-colors"
              >
                Поиск тестов
              </Link>
              
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    Мои тесты
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={signOut}
                    className="text-foreground/80 hover:text-primary"
                  >
                    Выйти
                  </Button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    Вход
                  </Link>
                  <Button asChild variant="default">
                    <Link to="/signup">Регистрация</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={toggleMobileMenu} 
              className="md:hidden focus:outline-none"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-sm shadow-medium py-4 slide-in-right">
            <div className="container mx-auto px-4 flex flex-col space-y-4">
              <Link 
                to="/browse" 
                className="text-foreground/80 hover:text-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Поиск тестов
              </Link>
              
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-foreground/80 hover:text-primary transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Мои тесты
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-foreground/80 hover:text-primary justify-start px-0"
                  >
                    Выйти
                  </Button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-foreground/80 hover:text-primary transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Вход
                  </Link>
                  <Link 
                    to="/signup" 
                    className="text-foreground/80 hover:text-primary transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      {/* Spacer to prevent content from being hidden under the navbar */}
      <div className={`${isHomePage ? 'h-0' : 'h-16'}`}></div>
    </>
  );
};

export default Navbar;
