
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Question, Answer, QuestionType } from '@/lib/supabase';

interface QuestionItemProps {
  question: Question & { answers: Answer[] };
  index: number;
  onDelete: (questionId: string) => void;
}

const QuestionItem = ({ question, index, onDelete }: QuestionItemProps) => {
  const [expanded, setExpanded] = useState(true);

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SINGLE_CHOICE:
        return 'Один вариант ответа';
      case QuestionType.MULTIPLE_CHOICE:
        return 'Несколько вариантов ответа';
      case QuestionType.TRUE_FALSE:
        return 'Верно/Неверно';
      default:
        return 'Неизвестный тип';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
            {index + 1}
          </span>
          <Button 
            variant="ghost" 
            className="p-0 h-auto font-medium text-left"
            onClick={() => setExpanded(!expanded)}
          >
            {question.question_text} {/* Изменено с text на question_text */}
            {expanded ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
            {getQuestionTypeLabel(question.question_type)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(question.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Удалить вопрос</span>
          </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="py-2">
          <div className="space-y-1">
            {question.answers.map((answer, aIndex) => (
              <div 
                key={answer.id} 
                className={`p-2 rounded-md ${answer.is_correct ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'}`}
              >
                <p className={`text-sm ${answer.is_correct ? 'text-primary font-medium' : ''}`}>
                  {aIndex + 1}. {answer.answer_text} 
                  {answer.is_correct && ' ✓'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default QuestionItem;
