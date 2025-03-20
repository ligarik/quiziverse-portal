
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ietgplhyurvswlijjnfb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldGdwbGh5dXJ2c3dsaWpqbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MTQwMDUsImV4cCI6MjA1NjM5MDAwNX0.CsOh_ck-VBmHKiVmEFpYFzS7TG7wC2iA-kl9M7e6Y8E";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Export the types from the previous lib/supabase.ts file
export type User = {
  id: string;
  email?: string;
  created_at?: string;
};

// Update the QuestionType enum to match the database schema exactly
export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TEXT_INPUT = 'text',
  TRUE_FALSE = 'true_false',
  MATCHING = 'matching',
  NUMBER_INPUT = 'number'
}

export type Quiz = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  created_by: string; 
  is_public?: boolean;
  is_published?: boolean;
  time_limit?: number;
  randomize_questions?: boolean;
  show_feedback?: boolean;
};

export type Question = {
  id: string;
  quiz_id: string;
  text: string; // For UI, but maps to content in DB
  content: string; // This is the DB column name
  created_at: string;
  question_type: QuestionType;
  points?: number;
  image_url?: string;
  position: number; // Required by the database schema
};

export type Answer = {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  created_at: string;
  matching_text?: string;
};

export type QuizAttempt = {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  max_score: number;
  created_at: string;
  started_at: string;
  completed_at: string | null;
  is_graded: boolean;
};

export type QuestionResponse = {
  id: string;
  attempt_id: string;
  question_id: string;
  is_correct: boolean;
  created_at: string;
  user_answer?: string;
};
