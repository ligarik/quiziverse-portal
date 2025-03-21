
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuizAttempt } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';

interface QuizResultsAnalyticsProps {
  attempts: QuizAttempt[];
  maxScore: number;
}

const QuizResultsAnalytics = ({ attempts, maxScore }: QuizResultsAnalyticsProps) => {
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([]);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [medianScore, setMedianScore] = useState<number>(0);
  const [passRate, setPassRate] = useState<number>(0);
  const [completionTimeData, setCompletionTimeData] = useState<any[]>([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    if (attempts.length === 0) return;

    // Calculate average score
    const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    const avgScore = totalScore / attempts.length;
    setAverageScore(Number(avgScore.toFixed(2)));

    // Calculate median score
    const sortedScores = [...attempts].sort((a, b) => (a.score || 0) - (b.score || 0)).map(a => a.score || 0);
    const mid = Math.floor(sortedScores.length / 2);
    const median = sortedScores.length % 2 === 0 
      ? (sortedScores[mid - 1] + sortedScores[mid]) / 2 
      : sortedScores[mid];
    setMedianScore(median);

    // Calculate pass rate (assuming 60% is passing)
    const passingThreshold = maxScore * 0.6;
    const passCount = attempts.filter(a => (a.score || 0) >= passingThreshold).length;
    setPassRate(Number(((passCount / attempts.length) * 100).toFixed(2)));

    // Generate score distribution data
    const distribution: Record<string, number> = {};
    const step = maxScore > 10 ? Math.ceil(maxScore / 5) : 1;
    
    for (let i = 0; i <= maxScore; i += step) {
      const rangeEnd = Math.min(i + step - 1, maxScore);
      const range = `${i}-${rangeEnd}`;
      distribution[range] = 0;
    }

    attempts.forEach(attempt => {
      const score = attempt.score || 0;
      for (const range in distribution) {
        const [start, end] = range.split('-').map(Number);
        if (score >= start && score <= end) {
          distribution[range]++;
          break;
        }
      }
    });

    const distributionData = Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
      percentage: Number(((count / attempts.length) * 100).toFixed(2))
    }));
    
    setScoreDistribution(distributionData);

    // Calculate completion time data
    const timeData: Record<string, number> = {
      'Under 5 min': 0,
      '5-10 min': 0,
      '10-15 min': 0,
      '15-30 min': 0,
      'Over 30 min': 0
    };

    attempts.forEach(attempt => {
      if (attempt.completed_at && attempt.started_at) {
        const startTime = new Date(attempt.started_at).getTime();
        const endTime = new Date(attempt.completed_at).getTime();
        const durationMinutes = (endTime - startTime) / (1000 * 60);

        if (durationMinutes < 5) timeData['Under 5 min']++;
        else if (durationMinutes < 10) timeData['5-10 min']++;
        else if (durationMinutes < 15) timeData['10-15 min']++;
        else if (durationMinutes < 30) timeData['15-30 min']++;
        else timeData['Over 30 min']++;
      }
    });

    const completionTimeChartData = Object.entries(timeData)
      .filter(([_, value]) => value > 0)
      .map(([range, count]) => ({
        range,
        count,
        percentage: Number(((count / attempts.length) * 100).toFixed(2))
      }));
    
    setCompletionTimeData(completionTimeChartData);
  }, [attempts, maxScore]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Статистический анализ</CardTitle>
        <CardDescription>
          Аналитика результатов теста на основе {attempts.length} попыток
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Общая статистика</TabsTrigger>
            <TabsTrigger value="distribution">Распределение баллов</TabsTrigger>
            <TabsTrigger value="time">Время выполнения</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Средний балл</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageScore} / {maxScore}</div>
                  <p className="text-xs text-muted-foreground">
                    {((averageScore / maxScore) * 100).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Медианный балл</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{medianScore} / {maxScore}</div>
                  <p className="text-xs text-muted-foreground">
                    {((medianScore / maxScore) * 100).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Процент прохождения</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{passRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    При пороге 60%
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Показатель</TableHead>
                    <TableHead>Значение</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Общее количество попыток</TableCell>
                    <TableCell>{attempts.length}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Средний балл</TableCell>
                    <TableCell>{averageScore} ({((averageScore / maxScore) * 100).toFixed(2)}%)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Медианный балл</TableCell>
                    <TableCell>{medianScore} ({((medianScore / maxScore) * 100).toFixed(2)}%)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Минимальный балл</TableCell>
                    <TableCell>
                      {attempts.length > 0
                        ? Math.min(...attempts.map(a => a.score || 0))
                        : 0} ({attempts.length > 0
                          ? ((Math.min(...attempts.map(a => a.score || 0)) / maxScore) * 100).toFixed(2)
                          : 0}%)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Максимальный балл</TableCell>
                    <TableCell>
                      {attempts.length > 0
                        ? Math.max(...attempts.map(a => a.score || 0))
                        : 0} ({attempts.length > 0
                          ? ((Math.max(...attempts.map(a => a.score || 0)) / maxScore) * 100).toFixed(2)
                          : 0}%)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Процент прохождения (порог 60%)</TableCell>
                    <TableCell>{passRate}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="distribution">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Распределение баллов</h3>
              
              {scoreDistribution.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={scoreDistribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis yAxisId="left" orientation="left" label={{ value: 'Количество попыток', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Процент', angle: 90, position: 'insideRight' }} />
                      <Tooltip formatter={(value, name) => {
                        return name === 'percentage' ? `${value}%` : value;
                      }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" name="Количество попыток" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="percentage" name="Процент" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground">Недостаточно данных для отображения графика</p>
              )}
              
              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Диапазон баллов</TableHead>
                      <TableHead>Количество попыток</TableHead>
                      <TableHead>Процент</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scoreDistribution.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.range}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>{item.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="time">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Время выполнения теста</h3>
              
              {completionTimeData.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={completionTimeData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Количество попыток" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={completionTimeData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="range"
                        >
                          {completionTimeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [value, props.payload.range]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Недостаточно данных для отображения графика</p>
              )}
              
              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Время выполнения</TableHead>
                      <TableHead>Количество попыток</TableHead>
                      <TableHead>Процент</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completionTimeData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.range}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>{item.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default QuizResultsAnalytics;
