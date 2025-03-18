
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-16 px-4 md:px-6">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-7xl font-bold text-primary mb-4">404</h1>
          <p className="text-2xl font-medium text-foreground mb-6">
            Страница не найдена
          </p>
          <p className="text-muted-foreground mb-8">
            Извините, запрашиваемая страница не существует или была перемещена.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/">На главную</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Мои тесты</Link>
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
