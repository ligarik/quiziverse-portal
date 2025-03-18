
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import BrowseQuizzes from "./pages/BrowseQuizzes";
import CreateQuiz from "./pages/CreateQuiz";
import EditQuiz from "./pages/EditQuiz";
import TakeQuiz from "./pages/TakeQuiz";
import QuizStats from "./pages/QuizStats";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/browse" element={<BrowseQuizzes />} />
            <Route path="/quiz/create" element={<CreateQuiz />} />
            <Route path="/quiz/edit/:id" element={<EditQuiz />} />
            <Route path="/quiz/take/:id" element={<TakeQuiz />} />
            <Route path="/quiz/stats/:id" element={<QuizStats />} />
            {/* Redirect old paths to new ones */}
            <Route path="/editor/:id" element={<Navigate to="/quiz/edit/:id" replace />} />
            <Route path="/stats/:id" element={<Navigate to="/quiz/stats/:id" replace />} />
            <Route path="/take/:id" element={<Navigate to="/quiz/take/:id" replace />} />
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
