import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Lightbulb } from 'lucide-react';

const DEFAULT_TODOS = [
  { id: '1', text: 'Take iron supplement after breakfast', category: 'supplement' },
  { id: '2', text: 'Drink Amla juice (20ml) in the morning', category: 'diet' },
  { id: '3', text: 'Avoid tea/coffee within 1 hour of meals', category: 'diet' },
  { id: '4', text: 'Eat a Vitamin C-rich fruit (orange, guava)', category: 'diet' },
  { id: '5', text: 'Take a 20-minute walk or light exercise', category: 'fitness' },
  { id: '6', text: 'Drink at least 8 glasses of water', category: 'health' },
  { id: '7', text: 'Schedule / log next Hb test date', category: 'health' },
];

const TIPS = [
  'Did you know? Cooking in an iron kadhai can increase your food\'s iron content by up to 16%!',
  'Vitamin C helps your body absorb iron 6x better. Squeeze some lemon on your dal!',
  'Just 100g of jaggery contains 11mg of iron — almost your daily requirement.',
  'Beetroot juice can improve your hemoglobin levels in just 2 weeks of regular intake.',
  'Soaking dal overnight makes its iron more absorbable by reducing phytic acid.',
  'Dates are rich in iron — eating 5-6 dates daily can help boost Hb levels.',
  'Regular gentle exercise improves blood circulation and helps your body produce more red blood cells.',
];

export default function Todos() {
  const today = new Date().toISOString().split('T')[0];
  const storageKey = `anemiacare_todos_${today}`;

  const [checked, setChecked] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const tip = TIPS[new Date().getDay() % TIPS.length];

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...checked]));
  }, [checked, storageKey]);

  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  };

  const completedCount = checked.size;
  const totalCount = DEFAULT_TODOS.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="mx-auto max-w-lg px-4 py-8 fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Daily Health To-Dos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Check off each item as you complete it today.
      </p>

      {/* Progress */}
      <div className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Today's Progress</span>
          <span className="font-semibold text-foreground">{completedCount}/{totalCount}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {completedCount === totalCount && (
          <p className="mt-3 text-center text-sm font-semibold text-accent">
            🎉 Amazing! You completed all tasks today!
          </p>
        )}
      </div>

      {/* Checklist */}
      <div className="mt-6 space-y-2">
        {DEFAULT_TODOS.map(todo => {
          const done = checked.has(todo.id);
          return (
            <button
              key={todo.id}
              onClick={() => toggle(todo.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all ${
                done
                  ? 'border-accent/30 bg-accent/10 text-muted-foreground line-through'
                  : 'border-border bg-card text-foreground hover:border-secondary/50'
              }`}
            >
              {done ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-accent" />
              ) : (
                <Circle className="h-5 w-5 flex-shrink-0 text-border" />
              )}
              {todo.text}
            </button>
          );
        })}
      </div>

      {/* Tip of the Day */}
      <div className="mt-8 rounded-2xl border bg-secondary/15 p-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-secondary" />
          <h3 className="font-display text-sm font-semibold text-foreground">Tip of the Day</h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tip}</p>
      </div>
    </div>
  );
}
