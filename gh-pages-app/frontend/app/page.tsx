"use client";

import { useState } from "react";

interface UserParams {
  distance: number;
  age: number;
  weight: number;
  height: number;
  current_pace: number;
  resting_hr?: number;
  max_hr?: number;
  weekly_mileage?: number;
  last_race_time?: number;
  goal_date: string;
  experience_level: string;
  training_days: number;
}

interface TrainingDay {
  day: number;
  type: string;
  distance: number;
  duration?: number;
  pace_min?: number;
  pace_max?: number;
  description: string;
  notes?: string;
}

interface TrainingWeek {
  week_number: number;
  days: TrainingDay[];
  weekly_volume: number;
  focus: string;
}

interface TrainingPlan {
  user_params: UserParams;
  plan_name: string;
  total_weeks: number;
  weeks: TrainingWeek[];
  estimated_finish_time: number;
  recommendations: string[];
}

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  rest: "Отдых",
  easy: "Легкий",
  steady: "Ровный",
  tempo: "Темповый",
  intervals: "Интервалы",
  long_run: "Длительный",
  cross_training: "Кросс",
};

const WORKOUT_TYPE_COLORS: Record<string, string> = {
  rest: "bg-stone-400 text-stone-900",
  easy: "bg-amber-200 text-amber-900",
  steady: "bg-orange-300 text-orange-900",
  tempo: "bg-orange-500 text-white",
  intervals: "bg-red-700 text-white",
  long_run: "bg-purple-700 text-white",
  cross_training: "bg-cyan-600 text-white",
};

const FOCUS_ICONS: Record<string, string> = {
  "Базовая подготовка": "🌵",
  "Набор объема": "📈",
  "Специфическая работа": "💪",
  "Пиковая форма": "🔥",
  "Тейпер и восстановление": "🏆",
};

export default function Home() {
  const [formData, setFormData] = useState<UserParams>({
    distance: 21,
    age: 30,
    weight: 75,
    height: 175,
    current_pace: 5.5,
    resting_hr: 60,
    max_hr: 190,
    weekly_mileage: 30,
    goal_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    experience_level: "intermediate",
    training_days: 4,
  });

  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const handleChange = (field: keyof UserParams, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Ошибка генерации плана");
      }

      const data = await response.json();
      setPlan(data);
      setExpandedWeek(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}:${mins.toString().padStart(2, "0")}`;
  };

  const getExperienceBadge = (level: string) => {
    const badges: Record<string, string> = {
      beginner: "🤠 Новичок",
      intermediate: "🤠🤠 Стрелок",
      advanced: "🤠🤠🤠 Легенда",
    };
    return badges[level] || level;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-100">
      {/* Декоративная верхняя панель */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-800 to-amber-900 border-b-4 border-amber-600">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🤠</span>
              <div>
                <h1 className="text-2xl font-bold text-amber-50 tracking-wider" style={{ fontFamily: "Georgia, serif" }}>
                  WILD WEST RUNNING CO.
                </h1>
                <p className="text-amber-200 text-sm italic">
                  Тренируйся как настоящий ковбой
                </p>
              </div>
            </div>
            <div className="text-amber-200 text-right">
              <div className="text-xs uppercase tracking-widest">Сезон 2026</div>
              <div className="text-lg font-bold">🌵🐎🏜️</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Форма ввода */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="bg-[#F5E6D3] rounded-lg shadow-xl p-6 border-4 border-amber-800" style={{ fontFamily: "Georgia, serif" }}>
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">📋</div>
                <h2 className="text-xl font-bold text-amber-900 uppercase tracking-wider">
                  Анкета ковбоя
                </h2>
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent mt-2"></div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-amber-900 mb-1 uppercase tracking-wide">
                    🎯 Дистанция
                  </label>
                  <select
                    value={formData.distance}
                    onChange={(e) => handleChange("distance", Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-amber-700 bg-[#FFF8DC] rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-600 text-amber-900 font-semibold"
                  >
                    <option value={10}>10 км — Быстрая тропа</option>
                    <option value={21}>21 км — Полупустыня</option>
                    <option value={42}>42 км — Через всю Аризону</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-amber-900 mb-1 uppercase tracking-wide">
                    ⭐ Опыт
                  </label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => handleChange("experience_level", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-amber-700 bg-[#FFF8DC] rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-600 text-amber-900 font-semibold"
                  >
                    <option value="beginner">🌵 Новичок в прериях</option>
                    <option value="intermediate">🤠 Опытный стрелок</option>
                    <option value="advanced">🏆 Легенда Дикого Запада</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-amber-900 mb-1 uppercase tracking-wide">
                      📅 Лет
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleChange("age", Number(e.target.value))}
                      className="w-full px-3 py-2 border-2 border-amber-700 bg-[#FFF8DC] rounded-lg focus:ring-2 focus:ring-amber-500 text-amber-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-amber-900 mb-1 uppercase tracking-wide">
                      ⚖️ Вес (кг)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => handleChange("weight", Number(e.target.value))}
                      className="w-full px-3 py-2 border-2 border-amber-700 bg-[#FFF8DC] rounded-lg focus:ring-2 focus:ring-amber-500 text-amber-900 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-amber-900 mb-1 uppercase tracking-wide">
                    📏 Рост (см)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleChange("height", Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-amber-700 bg-[#FFF8DC] rounded-lg focus:ring-2 focus:ring-amber-500 text-amber-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-amber-900 mb-1 uppercase tracking-wide">
                    🐎 Темп (мин/км)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.current_pace}
                    onChange={(e) => handleChange("current_pace", Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-amber-700 bg-[#FFF8DC] rounded-lg focus:ring-2 focus:ring-amber-500 text-amber-900 font-semibold"
                  />
                  <p className="text-xs text-amber-700 mt-1 italic">
                    Как быстро скачет твой мустанг?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-amber-900 mb-1 uppercase tracking-wide">
                      💓 Пульс покоя
                    </label>
                    <input
                      type="number"
                      value={formData.resting_hr}
                      onChange={(e) => handleChange("resting_hr", Number(e.target.value))}
                      className="w-full px-3 py-2 border-2 border-amber-700 bg-[#FFF8DC] rounded-lg focus:ring-2 focus:ring-amber-500 text-amber-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-amber-900 mb-1 uppercase tracking-wide">
                      🔥 Макс. пульс
                    </label>
                    <input
                      type="number"
                      value={formData.max_hr}
                      onChange={(e) => handleChange("max_hr", Number(e.target.value))}
                      className="w-full px-3 py-2 border-2 border-amber-700 bg-[#FFF8DC] rounded-lg focus:ring-2 focus:ring-amber-500 text-amber-900 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-amber-900 mb-1 uppercase tracking-wide">
                    🗺️ Км в неделю
                  </label>
                  <input
                    type="number"
                    value={formData.weekly_mileage}
                    onChange={(e) => handleChange("weekly_mileage", Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-amber-700 bg-[#FFF8DC] rounded-lg focus:ring-2 focus:ring-amber-500 text-amber-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-amber-900 mb-1 uppercase tracking-wide">
                    📅 Дней в седле
                  </label>
                  <select
                    value={formData.training_days}
                    onChange={(e) => handleChange("training_days", Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-amber-700 bg-[#FFF8DC] rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-600 text-amber-900 font-semibold"
                  >
                    <option value={3}>3 дня — Неторопливый ковбой</option>
                    <option value={4}>4 дня — Опытный следопыт</option>
                    <option value={5}>5 дней — Быстрый стрелок</option>
                    <option value={6}>6 дней — Легенда прерий</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-amber-900 mb-1 uppercase tracking-wide">
                    🎯 День большого забега
                  </label>
                  <input
                    type="date"
                    value={formData.goal_date}
                    onChange={(e) => handleChange("goal_date", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-amber-700 bg-[#FFF8DC] rounded-lg focus:ring-2 focus:ring-amber-500 text-amber-900 font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 text-white py-3 rounded-lg font-bold uppercase tracking-wider hover:from-amber-600 hover:via-orange-500 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-amber-900 shadow-lg"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {loading ? "🐎 Скачем..." : "🤠 Составить план!"}
                </button>
              </div>
            </form>
          </div>

          {/* Результат */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-100 border-4 border-red-700 text-red-900 px-4 py-3 rounded-lg mb-6" style={{ fontFamily: "Georgia, serif" }}>
                <span className="font-bold">🚫 Внимание, ковбой!</span> {error}
              </div>
            )}

            {!plan && !loading && (
              <div className="bg-[#F5E6D3] rounded-lg shadow-xl p-12 text-center border-4 border-amber-800" style={{ fontFamily: "Georgia, serif" }}>
                <div className="text-7xl mb-4">🌵</div>
                <h3 className="text-2xl font-bold text-amber-900 mb-2 uppercase tracking-wider">
                  Готов к приключениям?
                </h3>
                <p className="text-amber-700 text-lg italic">
                  Заполни анкету слева и получи свой план покорения прерий!
                </p>
                <div className="mt-6 text-4xl">🐎🤠🏜️</div>
              </div>
            )}

            {loading && (
              <div className="bg-[#F5E6D3] rounded-lg shadow-xl p-12 text-center border-4 border-amber-800" style={{ fontFamily: "Georgia, serif" }}>
                <div className="text-6xl animate-bounce mb-4">🐎</div>
                <p className="text-amber-900 text-lg font-bold uppercase">Шериф составляет план...</p>
                <div className="flex justify-center gap-2 mt-4">
                  <span className="w-3 h-3 bg-amber-600 rounded-full animate-pulse"></span>
                  <span className="w-3 h-3 bg-amber-600 rounded-full animate-pulse delay-100"></span>
                  <span className="w-3 h-3 bg-amber-600 rounded-full animate-pulse delay-200"></span>
                </div>
              </div>
            )}

            {plan && (
              <div className="space-y-6">
                {/* Информация о плане */}
                <div className="bg-[#F5E6D3] rounded-lg shadow-xl p-6 border-4 border-amber-800" style={{ fontFamily: "Georgia, serif" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-amber-900 uppercase tracking-wider">
                      📜 {plan.plan_name}
                    </h2>
                    <span className="text-3xl">{getExperienceBadge(plan.user_params.experience_level)}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-3 bg-amber-100 rounded-lg border-2 border-amber-600">
                      <div className="text-3xl mb-1">📅</div>
                      <div className="text-2xl font-bold text-amber-800">
                        {plan.total_weeks}
                      </div>
                      <div className="text-xs text-amber-700 uppercase tracking-wide">Недель в пути</div>
                    </div>
                    <div className="text-center p-3 bg-green-100 rounded-lg border-2 border-green-600">
                      <div className="text-3xl mb-1">⏱️</div>
                      <div className="text-2xl font-bold text-green-800">
                        {formatTime(plan.estimated_finish_time)}
                      </div>
                      <div className="text-xs text-green-700 uppercase tracking-wide">Время финиша</div>
                    </div>
                    <div className="text-center p-3 bg-purple-100 rounded-lg border-2 border-purple-600">
                      <div className="text-3xl mb-1">🗺️</div>
                      <div className="text-2xl font-bold text-purple-800">
                        {plan.user_params.distance} км
                      </div>
                      <div className="text-xs text-purple-700 uppercase tracking-wide">Дистанция</div>
                    </div>
                    <div className="text-center p-3 bg-orange-100 rounded-lg border-2 border-orange-600">
                      <div className="text-3xl mb-1">🐴</div>
                      <div className="text-2xl font-bold text-orange-800">
                        {formData.training_days}
                      </div>
                      <div className="text-xs text-orange-700 uppercase tracking-wide">Дней в седле</div>
                    </div>
                  </div>
                </div>

                {/* Рекомендации */}
                <div className="bg-[#F5E6D3] rounded-lg shadow-xl p-6 border-4 border-amber-800" style={{ fontFamily: "Georgia, serif" }}>
                  <h3 className="text-lg font-bold text-amber-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <span>💡</span> Советы шерифа
                  </h3>
                  <ul className="space-y-2">
                    {plan.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-amber-900">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="italic">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Недели тренировок */}
                <div className="bg-[#F5E6D3] rounded-lg shadow-xl p-6 border-4 border-amber-800" style={{ fontFamily: "Georgia, serif" }}>
                  <h3 className="text-lg font-bold text-amber-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <span>📅</span> Карта пути
                  </h3>
                  <div className="space-y-3">
                    {plan.weeks.map((week) => (
                      <div key={week.week_number} className="border-2 border-amber-600 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedWeek(expandedWeek === week.week_number ? null : week.week_number)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-100 transition-colors bg-gradient-to-r from-amber-200 to-orange-200"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-amber-900 text-lg">
                              Неделя {week.week_number}
                            </span>
                            <span className="px-3 py-1 bg-amber-800 text-amber-100 text-xs rounded-full uppercase tracking-wide">
                              {FOCUS_ICONS[week.focus] || "🎯"} {week.focus}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-amber-800 font-bold">
                              📍 {week.weekly_volume} км
                            </span>
                            <span className={`transform transition-transform text-amber-700 ${expandedWeek === week.week_number ? 'rotate-180' : ''}`}>
                              ▼
                            </span>
                          </div>
                        </button>

                        {expandedWeek === week.week_number && (
                          <div className="px-4 pb-4 border-t-2 border-amber-600 bg-[#FFF8DC]">
                            <div className="grid grid-cols-7 gap-2 mt-3">
                              {week.days.map((day, idx) => (
                                <div
                                  key={idx}
                                  className={`p-2 rounded-lg text-center border-2 border-amber-700 ${
                                    WORKOUT_TYPE_COLORS[day.type] || "bg-stone-300"
                                  }`}
                                >
                                  <div className="text-xs font-bold mb-1 uppercase">
                                    {DAY_NAMES[day.day]}
                                  </div>
                                  <div className="text-xs font-bold">
                                    {WORKOUT_TYPE_LABELS[day.type] || day.type}
                                  </div>
                                  {day.distance > 0 && (
                                    <div className="text-xs mt-1 font-bold">
                                      {day.distance} км
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Декоративный подвал */}
      <footer className="mt-12 bg-gradient-to-r from-amber-900 via-orange-800 to-amber-900 border-t-4 border-amber-600 py-4" style={{ fontFamily: "Georgia, serif" }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-amber-200 text-sm italic">
            🌵 Wild West Running Co. © 2026 — Тренируйся как настоящий ковбой! 🐎
          </p>
          <div className="text-amber-300 text-xs mt-1">
            От солёных равнин Техаса до золотых холмов Калифорнии
          </div>
        </div>
      </footer>
    </div>
  );
}
