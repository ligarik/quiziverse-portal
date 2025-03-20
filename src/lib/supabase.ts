
import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise fallback to provided values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ietgplhyurvswlijjnfb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldGdwbGh5dXJ2c3dsaWpqbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MTQwMDUsImV4cCI6MjA1NjM5MDAwNX0.CsOh_ck-VBmHKiVmEFpYFzS7TG7wC2iA-kl9M7e6Y8E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email?: string;
  created_at?: string;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  created_by: string; 
  is_public?: boolean;
  is_published?: boolean;
  time_limit?: number; // Added: time limit in minutes
  randomize_questions?: boolean; // Added: option to randomize questions
  show_feedback?: boolean; // Added: whether to show feedback after completion
};

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  NUMBER_INPUT = 'number_input', // Added: for number input questions
  TEXT_INPUT = 'text_input', // Added: for text input questions
  MATCHING = 'matching' // Added: for matching questions
}

export type Question = {
  id: string;
  quiz_id: string;
  text: string; // Kept 'text' for TypeScript types, will handle DB column mismatch in component
  created_at: string;
  question_type: QuestionType;
  points?: number; // Added: points value for the question
  image_url?: string; // Added: for question images
};

export type Answer = {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  created_at: string;
  matching_text?: string; // Added: for matching question types
};

export type QuizAttempt = {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  max_score: number;
  created_at: string;
  completed_at: string | null;
};

export type QuestionResponse = {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_id: string | null;
  is_correct: boolean;
  created_at: string;
  user_answer_text?: string; // Added: for text/number input responses
};
