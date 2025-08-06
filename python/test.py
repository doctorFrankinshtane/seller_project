# simple_model_test_no_walkforward.py
import sys
import os
import numpy as np
from sklearn.metrics import r2_score, root_mean_squared_error, mean_absolute_error

# Добавляем путь к папке python
sys.path.append('./python')

# Импортируем модель и генератор данных
try:
    from ml_model import AdMetricsPredictor, generate_historical_data
    print("Модуль ml_model загружен.")
except ImportError as e:
    print(f"Ошибка импорта: {e}")
    exit(1)

def print_metrics(y_true, y_pred, name):
    """Печать метрик для одной переменной."""
    if len(y_true) == 0 or len(y_pred) == 0:
        print(f"{name}: Нет данных")
        return
    # Фильтрация некорректных значений (NaN, Inf)
    mask = ~(np.isnan(y_true) | np.isnan(y_pred) | np.isinf(y_true) | np.isinf(y_pred))
    if not np.any(mask):
        print(f"{name}: Нет корректных данных для расчета")
        return
    y_t, y_p = y_true[mask], y_pred[mask]
    try:
        r2 = r2_score(y_t, y_p)
        rmse = root_mean_squared_error(y_t, y_p)
        mae = mean_absolute_error(y_t, y_p)
        print(f"{name}: R2={r2:.4f}, RMSE={rmse:.4f}, MAE={mae:.4f}")
    except Exception as e:
        print(f"{name}: Ошибка при расчете метрик: {e}")

# 1. Генерация данных
print("Генерация данных...")
data = generate_historical_data(days=150) # Увеличено немного для лучшего теста
print(f"Сгенерировано {len(data)} записей.")

# 2. Разделение на обучение и тест
split_index = int(0.7 * len(data)) # 70% для обучения
train_data = data[:split_index]
test_data = data[split_index:]
print(f"Разделение: {len(train_data)} для обучения, {len(test_data)} для теста.")

# 3. Создание и обучение модели
print("Обучение модели...")
model = AdMetricsPredictor()
try:
    model.train(train_data)
    print("Модель обучена.")
except Exception as e:
    print(f"Ошибка обучения: {e}")
    exit(1)

# 4. Предсказания на весь тестовый период
print("Предсказание на тестовый период...")
try:
    # Предсказываем сразу на длину теста
    predictions = model.predict_next_days(train_data, days_ahead=len(test_data))
    print(f"Получено {len(predictions)} предсказаний.")
except Exception as e:
    print(f"Ошибка предсказания: {e}")
    exit(1)

# 5. Подготовка данных для сравнения
# Извлекаем истинные значения из тестовых данных
y_true_ctr = np.array([d['ctr'] for d in test_data])
y_true_cr = np.array([d['cr'] for d in test_data])
y_true_cpc = np.array([d['cpc'] for d in test_data])
y_true_spend = np.array([d['spend'] for d in test_data])

# Извлекаем предсказанные значения
y_pred_ctr = np.array([d['ctr'] for d in predictions])
y_pred_cr = np.array([d['cr'] for d in predictions])
y_pred_cpc = np.array([d['cpc'] for d in predictions])
y_pred_spend = np.array([d['spend'] for d in predictions])

# Проверка длины массивов
if len(y_true_ctr) != len(y_pred_ctr):
    print(f"Предупреждение: Длина истинных ({len(y_true_ctr)}) и предсказанных ({len(y_pred_ctr)}) значений не совпадает.")
    # Обрезаем до минимальной длины
    min_len = min(len(y_true_ctr), len(y_pred_ctr))
    y_true_ctr, y_pred_ctr = y_true_ctr[:min_len], y_pred_ctr[:min_len]
    y_true_cr, y_pred_cr = y_true_cr[:min_len], y_pred_cr[:min_len]
    y_true_cpc, y_pred_cpc = y_true_cpc[:min_len], y_pred_cpc[:min_len]
    y_true_spend, y_pred_spend = y_true_spend[:min_len], y_pred_spend[:min_len]

# 6. Вывод метрик
print("\n=== Результаты оценки модели ===")
print_metrics(y_true_ctr, y_pred_ctr, "CTR")
print_metrics(y_true_cr, y_pred_cr, "CR")
print_metrics(y_true_cpc, y_pred_cpc, "CPC")
print_metrics(y_true_spend, y_pred_spend, "Spend")

# 7. Примеры
print("\n=== Примеры (Факт -> Пред) ===")
examples_count = min(5, len(y_true_ctr))
if examples_count > 0:
    for i in range(examples_count):
        print(f"Дата {i+1}:")
        print(f"  CTR: {y_true_ctr[i]:.4f} -> {y_pred_ctr[i]:.4f}")
        print(f"  CR:  {y_true_cr[i]:.4f} -> {y_pred_cr[i]:.4f}")
        print(f"  CPC: {y_true_cpc[i]:.2f} -> {y_pred_cpc[i]:.2f}")
        print(f"  S:   {y_true_spend[i]:.0f} -> {y_pred_spend[i]:.0f}")
        print("-" * 25)
else:
    print("Недостаточно данных для отображения примеров.")