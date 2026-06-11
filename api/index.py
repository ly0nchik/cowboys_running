from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

app = FastAPI(title="Running Coach API")

# CORS для frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === Модели данных ===
class UserParams(BaseModel):
    distance: int  # 10, 21, 42 км
    age: int
    weight: float  # кг
    height: float  # см
    current_pace: float  # мин/км (текущий темп)
    resting_hr: Optional[int] = None  # пульс покоя
    max_hr: Optional[int] = None  # макс. пульс
    weekly_mileage: Optional[float] = None  # недельный объем (км)
    last_race_time: Optional[int] = None  # последнее время на дистанции (мин)
    goal_date: str  # дата цели (YYYY-MM-DD)
    experience_level: str  # beginner, intermediate, advanced
    training_days: int = 4  # дней тренировок в неделю


class TrainingDay(BaseModel):
    day: int  # день недели (0-6)
    type: str  # easy, tempo, intervals, long_run, rest, cross_training
    distance: float  # км
    duration: Optional[int] = None  # минуты
    pace_min: Optional[float] = None  # мин/км (нижняя граница)
    pace_max: Optional[float] = None  # мин/км (верхняя граница)
    description: str
    notes: Optional[str] = None


class TrainingWeek(BaseModel):
    week_number: int
    days: List[TrainingDay]
    weekly_volume: float  # общий объем за неделю (км)
    focus: str  # фокус недели


class TrainingPlan(BaseModel):
    user_params: UserParams
    plan_name: str
    total_weeks: int
    weeks: List[TrainingWeek]
    estimated_finish_time: int  # минуты
    recommendations: List[str]


# === Шаблоны тренировок ===
TEMPLATES = {
    "10k": {
        "beginner": {"weeks": 8, "base_volume": 20, "plan_name": "10K Novice (Higdon-style)"},
        "intermediate": {"weeks": 8, "base_volume": 30, "plan_name": "10K Intermediate"},
        "advanced": {"weeks": 6, "base_volume": 40, "plan_name": "10K Advanced"},
    },
    "21k": {
        "beginner": {"weeks": 12, "base_volume": 30, "plan_name": "Half Marathon Novice (Higdon)"},
        "intermediate": {"weeks": 10, "base_volume": 45, "plan_name": "Half Marathon Intermediate"},
        "advanced": {"weeks": 8, "base_volume": 60, "plan_name": "Half Marathon Advanced"},
    },
    "42k": {
        "beginner": {"weeks": 16, "base_volume": 40, "plan_name": "Marathon Novice 1 (Higdon)"},
        "intermediate": {"weeks": 12, "base_volume": 55, "plan_name": "Marathon Intermediate (Pfitzinger 55)"},
        "advanced": {"weeks": 12, "base_volume": 70, "plan_name": "Marathon Advanced (Pfitzinger 70)"},
    },
}


def calculate_hr_zones(resting_hr: int, max_hr: int) -> dict:
    """Расчет пульсовых зон по формуле Карвонена"""
    if not resting_hr or not max_hr:
        return {}
    hrr = max_hr - resting_hr
    return {
        "zone1": int(resting_hr + hrr * 0.5),
        "zone2": int(resting_hr + hrr * 0.6),
        "zone3": int(resting_hr + hrr * 0.7),
        "zone4": int(resting_hr + hrr * 0.8),
        "zone5": int(resting_hr + hrr * 0.9),
    }


def estimate_finish_time(distance: int, current_pace: float, experience: str) -> int:
    """Оценка времени финиша на основе текущего темпа"""
    fatigue_factor = {"beginner": 1.15, "intermediate": 1.1, "advanced": 1.05}
    base_time = distance * current_pace
    adjusted_time = base_time * fatigue_factor.get(experience, 1.1)
    return int(adjusted_time)


def generate_week(
    week_num: int,
    total_weeks: int,
    base_volume: float,
    training_days: int,
    current_pace: float,
    distance: int,
) -> TrainingWeek:
    """Генерация одной недели тренировок"""
    progress = week_num / total_weeks

    if progress < 0.7:
        volume_mult = 0.8 + (progress / 0.7) * 0.4
    elif progress < 0.9:
        volume_mult = 1.2 - ((progress - 0.7) / 0.2) * 0.2
    else:
        volume_mult = 1.0 - ((progress - 0.9) / 0.1) * 0.4

    weekly_volume = base_volume * volume_mult

    # Распределение по типам тренировок
    if training_days == 3:
        distro = {"long_run": 0.50, "tempo": 0.30, "easy": 0.20}
    elif training_days == 4:
        distro = {"long_run": 0.40, "tempo": 0.25, "intervals": 0.20, "easy": 0.15}
    elif training_days == 5:
        distro = {"long_run": 0.35, "tempo": 0.25, "intervals": 0.20, "easy1": 0.10, "easy2": 0.10}
    else:
        distro = {"long_run": 0.30, "tempo": 0.20, "intervals": 0.20, "easy1": 0.10, "easy2": 0.10, "easy3": 0.10}

    days = []

    # Длительная тренировка (воскресенье)
    long_run_dist = weekly_volume * distro["long_run"]
    days.append(
        TrainingDay(
            day=6, type="long_run", distance=round(long_run_dist, 1),
            pace_min=current_pace * 1.2, pace_max=current_pace * 1.4,
            description=f"Длительный бег {round(long_run_dist, 1)} км",
            notes="Держите комфортный темп",
        )
    )

    # Темповая тренировка (среда)
    tempo_dist = weekly_volume * distro["tempo"]
    days.append(
        TrainingDay(
            day=2, type="tempo", distance=round(tempo_dist, 1),
            pace_min=current_pace * 0.88, pace_max=current_pace * 0.92,
            description=f"Темповый бег {round(tempo_dist, 1)} км",
            notes="Комфортно тяжелый темп",
        )
    )

    # Интервалы (вторник)
    if training_days >= 4:
        interval_dist = weekly_volume * distro["intervals"]
        days.append(
            TrainingDay(
                day=1,
                type="intervals" if week_num % 2 == 1 else "easy",
                distance=round(interval_dist, 1),
                pace_min=current_pace * 0.8 if week_num % 2 == 1 else current_pace * 1.1,
                pace_max=current_pace * 0.88 if week_num % 2 == 1 else current_pace * 1.3,
                description=f"{'Интервалы' if week_num % 2 == 1 else 'Легкий бег'} {round(interval_dist, 1)} км",
                notes="4-6 повторов по 400-800м" if week_num % 2 == 1 else "Восстановительный темп",
            )
        )

    # Дополнительные легкие тренировки
    easy_days = [k for k in distro.keys() if k.startswith("easy")]
    easy_day_indices = [0, 3, 4, 5]

    for i, easy_key in enumerate(easy_days):
        if i < len(easy_day_indices):
            easy_dist = weekly_volume * distro[easy_key]
            days.append(
                TrainingDay(
                    day=easy_day_indices[i], type="easy", distance=round(easy_dist, 1),
                    pace_min=current_pace * 1.15, pace_max=current_pace * 1.35,
                    description=f"Легкий бег {round(easy_dist, 1)} км",
                    notes="Спокойный восстановительный бег",
                )
            )

    # Дни отдыха
    for day in range(7):
        if not any(d.day == day for d in days):
            days.append(
                TrainingDay(day=day, type="rest", distance=0, description="День отдыха", notes="Отдых")
            )

    days.sort(key=lambda d: d.day)
    actual_volume = sum(d.distance for d in days)

    # Фокус недели
    if progress < 0.3:
        focus = "Базовая подготовка"
    elif progress < 0.5:
        focus = "Набор объема"
    elif progress < 0.7:
        focus = "Специфическая работа"
    elif progress < 0.9:
        focus = "Пиковая форма"
    else:
        focus = "Тейпер и восстановление"

    return TrainingWeek(
        week_number=week_num, days=days, weekly_volume=round(actual_volume, 1), focus=focus
    )


def generate_training_plan(params: UserParams) -> TrainingPlan:
    """Генерация полного плана тренировок"""
    distance_map = {10: "10k", 21: "21k", 42: "42k"}
    distance_key = distance_map.get(params.distance)
    if not distance_key or distance_key not in TEMPLATES:
        raise HTTPException(status_code=400, detail="Неподдерживаемая дистанция")

    template = TEMPLATES[distance_key].get(params.experience_level)
    if not template:
        raise HTTPException(status_code=400, detail="Неподдерживаемый уровень подготовки")

    base_volume = template["base_volume"]
    if params.weekly_mileage:
        base_volume = base_volume * 0.7 + params.weekly_mileage * 0.3

    weeks = []
    for week_num in range(1, template["weeks"] + 1):
        week = generate_week(
            week_num=week_num,
            total_weeks=template["weeks"],
            base_volume=base_volume,
            training_days=params.training_days,
            current_pace=params.current_pace,
            distance=params.distance,
        )
        weeks.append(week)

    estimated_time = estimate_finish_time(params.distance, params.current_pace, params.experience_level)

    recommendations = [
        "Спите 7-9 часов в сутки для восстановления",
        "Пейте достаточно воды в течение дня",
        "Включите силовые тренировки 1-2 раза в неделю",
        "Слушайте свое тело - боль это сигнал остановиться",
        "Разминайтесь 5-10 минут перед каждой тренировкой",
    ]

    if params.resting_hr and params.max_hr:
        hr_zones = calculate_hr_zones(params.resting_hr, params.max_hr)
        recommendations.append(
            f"Пульсовые зоны: Z1={hr_zones['zone1']}, Z2={hr_zones['zone2']}, Z3={hr_zones['zone3']}, Z4={hr_zones['zone4']}, Z5={hr_zones['zone5']}"
        )

    return TrainingPlan(
        user_params=params,
        plan_name=template["plan_name"],
        total_weeks=template["weeks"],
        weeks=weeks,
        estimated_finish_time=estimated_time,
        recommendations=recommendations,
    )


# === API Endpoints ===
@app.get("/")
def root():
    return {"message": "Running Coach API", "docs": "/docs"}


@app.post("/api/generate-plan", response_model=TrainingPlan)
def generate_plan(params: UserParams):
    """Генерация плана тренировок"""
    return generate_training_plan(params)


@app.get("/api/templates")
def get_templates():
    """Доступные шаблоны тренировок"""
    return TEMPLATES
