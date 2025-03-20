import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Question, Answer, QuestionType } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

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
      case QuestionType.TEXT_INPUT:
        return 'Ввод текста';
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
            className="p-0 h-auto font-medium text-left flex items-center"
            onClick={() => setExpanded(!expanded)}
          >
            {question.text}
            {question.image_url && (
              <ImageIcon className="ml-2 h-4 w-4 text-muted-foreground" />
            )}
            {expanded ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        <div className="flex items-center gap-2">
          {question.points && question.points > 1 && (
            <Badge variant="secondary">
              {question.points} {question.points > 1 ? 'баллов' : 'балл'}
            </Badge>
          )}
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
          {question.image_url && (
            <div className="mb-3">
              <img 
                src={question.image_url} 
                alt="Изображение вопроса" 
                className="max-h-40 rounded-md object-contain"
              />
            </div>
          )}
          
          {question.question_type === QuestionType.MATCHING ? (
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="font-medium text-sm">Эле��ент</div>
                <div className="font-medium text-sm">Соответствие</div>
              </div>
              {question.answers.map((answer, aIndex) => (
                <div key={answer.id} className="grid grid-cols-2 gap-4 p-2 rounded-md bg-muted/50">
                  <p className="text-sm">{aIndex + 1}. {answer.answer_text}</p>
                  <p className="text-sm">{answer.matching_text}</p>
                </div>
              ))}
            </div>
          ) : question.question_type === QuestionType.TEXT_INPUT || question.question_type === QuestionType.NUMBER_INPUT ? (
            <div className="p-2 rounded-md bg-primary/10 border border-primary/30">
              <p className="text-sm text-primary font-medium">
                Правильный ответ: {question.answers[0]?.answer_text}
              </p>
            </div>
          ) : (
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
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default QuestionItem;
