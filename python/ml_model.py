# ml_model.py
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import json
import joblib
import os
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdMetricsPredictor:
    """Класс для предсказания рекламных метрик с использованием машинного обучения."""

    def __init__(self):
        """Инициализация модели и других атрибутов."""
        self.models = {
            'ctr': RandomForestRegressor(n_estimators=100, random_state=42),
            'cr': RandomForestRegressor(n_estimators=100, random_state=42),
            'cpc': RandomForestRegressor(n_estimators=100, random_state=42),
            'spend': RandomForestRegressor(n_estimators=100, random_state=42)
        }
        self.is_trained = False
        self.feature_columns = []
        self.training_stats = {}

    def create_features(self, historical_data):
        """
        Создание признаков из исторических данных.
        
        Args:
            historical_data (list): Список словарей с историческими данными.
            
        Returns:
            pd.DataFrame: DataFrame с признаками и целевыми переменными.
        """
        if not historical_data:
            raise ValueError("Исторические данные не могут быть пустыми.")
            
        # Создаем DataFrame
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').reset_index(drop=True)
        
        # Преобразуем метрики в числовые значения
        metric_columns = ['spend', 'impressions', 'clicks', 'conversions', 'revenue']
        for col in metric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
                
        # Рассчитываем производные метрики
        df['ctr'] = np.where(df['impressions'] > 0, df['clicks'] / df['impressions'], 0)
        df['cr'] = np.where(df['clicks'] > 0, df['conversions'] / df['clicks'], 0)
        df['cpc'] = np.where(df['clicks'] > 0, df['spend'] / df['clicks'], 0)
        df['roas'] = np.where(df['spend'] > 0, df['revenue'] / df['spend'], 0)
        
        # Создаем временные признаки
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        df['month'] = df['date'].dt.month
        
        # Создаем скользящие средние
        for window in [7, 14]:
            df[f'ctr_ma_{window}'] = df['ctr'].rolling(window=window, min_periods=1).mean()
            df[f'spend_ma_{window}'] = df['spend'].rolling(window=window, min_periods=1).mean()
            df[f'cr_ma_{window}'] = df['cr'].rolling(window=window, min_periods=1).mean()
            
        # Создаем процентные изменения
        df['spend_pct_change'] = df['spend'].pct_change().fillna(0)
        df['impressions_pct_change'] = df['impressions'].pct_change().fillna(0)
        
        return df # Не удаляем NaN здесь, чтобы сохранить все данные

    def prepare_data_for_training(self, historical_data):
        """
        Подготовка данных для обучения.
        
        Args:
            historical_data (list): Список словарей с историческими данными.
            
        Returns:
            tuple: (X, y) - признаки и целевые переменные.
        """
        df = self.create_features(historical_data)
        
        # Признаки (X) - все колонки кроме целевых и даты
        feature_columns = [col for col in df.columns if col not in ['ctr', 'cr', 'cpc', 'spend', 'date', 'revenue', 'clicks', 'impressions', 'conversions']]
        if not feature_columns:
            raise ValueError("Не найдено признаков для обучения.")
            
        self.feature_columns = feature_columns
        X = df[feature_columns]
        
        # Целевые переменные (y)
        y = df[['ctr', 'cr', 'cpc', 'spend']]
        
        # Удаляем строки с NaN в признаках или целях
        mask = X.notna().all(axis=1) & y.notna().all(axis=1)
        X = X[mask]
        y = y[mask]
        
        if X.empty:
            raise ValueError("Нет данных для обучения после очистки.")
            
        return X, y

    def train(self, historical_data):
        """
        Обучение модели на исторических данных.
        
        Args:
            historical_data (list): Список словарей с историческими данными.
        """
        if not historical_data:
            raise ValueError("Для обучения необходимы исторические данные.")
            
        logger.info(f"Начало обучения модели на {len(historical_data)} точках данных...")
        
        # Подготовка данных
        X, y = self.prepare_data_for_training(historical_data)
        
        # Разделение на обучающую и тестовую выборки
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Обучение моделей для каждой метрики
        mae_scores = {}
        for target in ['ctr', 'cr', 'cpc', 'spend']:
            logger.info(f"Обучение модели для {target}...")
            self.models[target].fit(X_train, y_train[target])
            
            # Оценка точности
            y_pred = self.models[target].predict(X_test)
            mae = mean_absolute_error(y_test[target], y_pred)
            mae_scores[target] = mae
            logger.info(f"MAE для {target}: {mae:.6f}")
            
        self.is_trained = True
        self.training_stats = {
            'data_points': len(historical_data),
            'train_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'accuracy': mae_scores
        }
        
        logger.info("Обучение модели завершено успешно.")

    def predict_next_days(self, historical_data, days_ahead=7):
        """
        Предсказание метрик на несколько дней вперед.
        
        Args:
            historical_data (list): Список словарей с историческими данными.
            days_ahead (int): Количество дней для предсказания.
            
        Returns:
            list: Список словарей с предсказаниями.
        """
        if not self.is_trained:
            raise RuntimeError("Модель не обучена. Сначала вызовите метод train().")
            
        if not historical_data:
            raise ValueError("Для предсказания необходимы исторические данные.")
            
        # Получаем последние данные и создаем признаки
        df = self.create_features(historical_data)
        if df.empty:
            raise ValueError("Невозможно создать признаки из предоставленных исторических данных.")
            
        # Берем последнюю строку с признаками (уже с MA, % change и т.д.)
        last_row = df.iloc[[-1]].copy() # Используем двойные скобки для получения DataFrame
        
        predictions = []
        current_date = pd.to_datetime(last_row['date'].iloc[0])
        
        for i in range(1, days_ahead + 1):
            next_date = current_date + timedelta(days=i)
            
            # Создаем новую строку для предсказания
            pred_row = last_row.copy()
            pred_row['date'] = next_date
            pred_row['day_of_week'] = next_date.dayofweek
            pred_row['day_of_month'] = next_date.day
            pred_row['month'] = next_date.month
            
            # Подготавливаем признаки для предсказания
            X_pred = pred_row[self.feature_columns]
            
            # Делаем предсказания
            pred_values = {}
            for target in ['ctr', 'cr', 'cpc', 'spend']:
                pred_values[target] = self.models[target].predict(X_pred)[0]
                
            # Создаем запись предсказания
            prediction = {
                'date': next_date.strftime('%Y-%m-%d'),
                'ctr': float(pred_values['ctr']),
                'cr': float(pred_values['cr']),
                'cpc': float(pred_values['cpc']),
                'spend': float(pred_values['spend'])
            }
            
            # Добавляем доверительные интервалы (симуляция)
            prediction['ctr_lower'] = max(0, prediction['ctr'] * 0.9)
            prediction['ctr_upper'] = prediction['ctr'] * 1.1
            prediction['spend_lower'] = max(0, prediction['spend'] * 0.85)
            prediction['spend_upper'] = prediction['spend'] * 1.15
            
            predictions.append(prediction)
            
            # Обновляем last_row для следующей итерации (простая симуляция)
            last_row = pred_row.copy()
            last_row['ctr'] = prediction['ctr']
            last_row['cr'] = prediction['cr']
            last_row['cpc'] = prediction['cpc']
            last_row['spend'] = prediction['spend']
            
        return predictions

    def save_model(self, filepath):
        """
        Сохранение обученной модели в файл.
        
        Args:
            filepath (str): Путь к файлу для сохранения модели.
        """
        if not self.is_trained:
            raise RuntimeError("Невозможно сохранить необученную модель.")
            
        model_data = {
            'models': self.models,
            'is_trained': self.is_trained,
            'feature_columns': self.feature_columns,
            'training_stats': self.training_stats
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Модель успешно сохранена в '{filepath}'.")

    def load_model(self, filepath):
        """
        Загрузка обученной модели из файла.
        
        Args:
            filepath (str): Путь к файлу с сохраненной моделью.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Файл модели '{filepath}' не найден.")
            
        try:
            model_data = joblib.load(filepath)
            self.models = model_data['models']
            self.is_trained = model_data['is_trained']
            self.feature_columns = model_data['feature_columns']
            self.training_stats = model_data['training_stats']
            logger.info(f"Модель успешно загружена из '{filepath}'.")
        except Exception as e:
            raise RuntimeError(f"Ошибка при загрузке модели из '{filepath}': {e}")

# - НАЧАЛО: Улучшенная функция генерации исторических данных -
def generate_historical_data(days=365, save_to_file=True, filepath='historical_data.json'):
    """
    Генерация синтетических исторических данных, имитирующих рекламные метрики.
    
    Args:
        days (int): Количество дней для генерации.
        save_to_file (bool): Сохранять ли данные в файл.
        filepath (str): Путь к файлу для сохранения данных.
        
    Returns:
        list: Список словарей с историческими данными.
    """
    np.random.seed(42) # Для воспроизводимости
    data = []
    base_date = datetime(2023, 1, 1)
    
    # Базовые параметры
    base_ctr = 0.025
    base_cr = 0.018
    base_cpc = 15.0
    base_spend = 25000.0
    
    # Тренды (изменение в день)
    ctr_trend_daily = 0.00002 # +0.002% в день
    cr_trend_daily = 0.00001 # +0.001% в день
    cpc_trend_daily = 0.005 # +0.005 руб в день
    spend_trend_daily = 100.0 # +100 руб в день
    
    # Сезонность (ежедневные колебания)
    seasonal_amplitude = 0.1 # 10% амплитуда сезонных колебаний
    
    # Инициализация предыдущих значений
    prev_ctr = base_ctr
    prev_cr = base_cr
    prev_cpc = base_cpc
    prev_spend = base_spend
    
    for i in range(days):
        current_date = base_date + timedelta(days=i)
        
        # Применяем тренды
        current_ctr = prev_ctr + ctr_trend_daily + np.random.normal(0, 0.0005)
        current_cr = prev_cr + cr_trend_daily + np.random.normal(0, 0.0002)
        current_cpc = prev_cpc + cpc_trend_daily + np.random.normal(0, 0.5)
        current_spend = prev_spend + spend_trend_daily + np.random.normal(0, 2000)
        
        # Применяем сезонность (в зависимости от дня недели)
        day_of_week_factor = 1 + seasonal_amplitude * np.sin(2 * np.pi * current_date.weekday() / 7)
        current_ctr *= day_of_week_factor
        current_spend *= day_of_week_factor
        
        # Ограничиваем значения разумными пределами
        current_ctr = np.clip(current_ctr, 0.005, 0.08) # CTR от 0.5% до 8%
        current_cr = np.clip(current_cr, 0.005, 0.05) # CR от 0.5% до 5%
        current_cpc = np.clip(current_cpc, 5.0, 50.0) # CPC от 5 до 50 руб
        current_spend = np.clip(current_spend, 5000.0, 100000.0) # Spend от 5K до 100K руб
        
        # Рассчитываем производные метрики
        impressions = current_spend / current_cpc if current_cpc > 0 else 0
        clicks = impressions * current_ctr if impressions > 0 else 0
        conversions = clicks * current_cr if clicks > 0 else 0
        revenue = conversions * np.random.uniform(1000, 3000) # Средний чек от 1K до 3K руб
        
        # Создаем запись данных
        record = {
            'date': current_date.strftime('%Y-%m-%d'),
            'spend': round(current_spend, 2),
            'impressions': int(impressions),
            'clicks': int(clicks),
            'conversions': int(conversions),
            'revenue': round(revenue, 2)
        }
        
        data.append(record)
        
        # Обновляем предыдущие значения для следующей итерации
        prev_ctr = current_ctr
        prev_cr = current_cr
        prev_cpc = current_cpc
        prev_spend = current_spend
    
    # Сохраняем данные в файл, если это требуется
    if save_to_file:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"Исторические данные успешно сохранены в '{filepath}'")
        except Exception as e:
            logger.error(f"Ошибка при сохранении исторических данных в '{filepath}': {e}")
    
    return data
# - КОНЕЦ: Улучшенная функция генерации исторических данных -

def get_model_stats():
    """
    Возвращает словарь со статистикой модели.
    В реальной системе эта информация может храниться в отдельном файле
    или в базе данных после обучения.
    """
    # Это симуляция. В реальном приложении здесь будет логика получения
    # реальной статистики из обученной модели или логов обучения.
    import random
    random.seed(42) # Для воспроизводимости симуляции
    
    return {
        'model_trained': True, # Предположим, модель обучена
        'last_trained': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'accuracy': {
            'ctr_mae': round(random.uniform(0.001, 0.01), 4),
            'cr_mae': round(random.uniform(0.0005, 0.005), 4),
            'cpc_mae': round(random.uniform(0.5, 3.0), 2),
            'spend_mae': round(random.uniform(1000, 5000), 2)
        },
        'feature_importance': {
            'day_of_week': round(random.uniform(0.15, 0.3), 2),
            'ctr_moving_avg': round(random.uniform(0.15, 0.3), 2),
            'seasonality': round(random.uniform(0.1, 0.25), 2),
            'past_spend': round(random.uniform(0.15, 0.3), 2),
            'conversion_rate': round(random.uniform(0.1, 0.2), 2)
        }
    }

def append_predictions_to_historical_data(historical_data_filepath, predictions):
    """
    Добавляет предсказания в файл исторических данных.
    
    Args:
        historical_data_filepath (str): Путь к файлу historical_data.json.
        predictions (list): Список словарей с предсказаниями.
        
    Returns:
        bool: True, если данные успешно добавлены, False в противном случае.
    """
    import json
    import os
    
    try:
        # Проверяем, существует ли файл
        if not os.path.exists(historical_data_filepath):
            logger.warning(f"Файл {historical_data_filepath} не найден. Создаем новый.")
            # Если файла нет, создаем его с пустым массивом
            with open(historical_data_filepath, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
        
        # Загружаем существующие данные
        with open(historical_data_filepath, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
        
        # Преобразуем предсказания в формат исторических данных
        # Предполагаем, что predictions содержит словари с ключами: date, ctr, cr, cpc, spend
        # Нам нужно рассчитать производные метрики (impressions, clicks, conversions, revenue)
        # Это приблизительные расчеты, так как точные значения impressions и clicks неизвестны
        augmented_predictions = []
        for pred in predictions:
            # Берем последние известные значения для расчета базовых метрик
            # В реальном приложении здесь должна быть более сложная логика
            # или модель должна предсказывать все необходимые поля
            
            # Для примера, предположим, что у нас есть средние значения
            # из последних нескольких записей в historical_data
            avg_impressions = 100000  # Это значение нужно рассчитывать динамически
            avg_clicks = int(avg_impressions * pred['ctr'])
            avg_conversions = int(avg_clicks * pred['cr'])
            # Доход можно рассчитать, если известна средняя стоимость конверсии
            avg_revenue_per_conversion = 2000  # Пример
            avg_revenue = avg_conversions * avg_revenue_per_conversion
            
            augmented_pred = {
                'date': pred['date'],
                'spend': round(pred['spend'], 2),
                'impressions': avg_impressions,
                'clicks': avg_clicks,
                'conversions': avg_conversions,
                'revenue': round(avg_revenue, 2),
                # Можно также сохранить сами предсказанные метрики
                # 'predicted_ctr': pred['ctr'],
                # 'predicted_cr': pred['cr'],
                # 'predicted_cpc': pred['cpc']
            }
            augmented_predictions.append(augmented_pred)
        
        # Добавляем предсказания в конец существующих данных
        existing_data.extend(augmented_predictions)
        
        # Сохраняем обновленные данные обратно в файл
        with open(historical_data_filepath, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Успешно добавлено {len(augmented_predictions)} предсказаний в {historical_data_filepath}")
        return True
        
    except Exception as e:
        logger.error(f"Ошибка при добавлении предсказаний в {historical_data_filepath}: {e}")
        return False

# Улучшенная версия функции, которая использует последние данные из файла для более точных расчетов
def append_predictions_to_historical_data_v2(historical_data_filepath, predictions):
    """
    Добавляет предсказания в файл исторических данных, используя последние
    данные из файла для более точных расчетов производных метрик.
    
    Args:
        historical_data_filepath (str): Путь к файлу historical_data.json.
        predictions (list): Список словарей с предсказаниями.
        
    Returns:
        bool: True, если данные успешно добавлены, False в противном случае.
    """
    import json
    import os
    import statistics
    
    try:
        # Проверяем, существует ли файл
        if not os.path.exists(historical_data_filepath):
            logger.warning(f"Файл {historical_data_filepath} не найден. Создаем новый.")
            with open(historical_data_filepath, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
            existing_data = []
        else:
            # Загружаем существующие данные
            with open(historical_data_filepath, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        
        # Если есть исторические данные, рассчитываем средние значения
        if existing_data:
            # Берем последние 30 записей для расчета средних
            recent_data = existing_data[-30:]
            
            # Рассчитываем средние коэффициенты
            ctrs = [d['clicks'] / d['impressions'] for d in recent_data if d['impressions'] > 0]
            crs = [d['conversions'] / d['clicks'] for d in recent_data if d['clicks'] > 0]
            cpcs = [d['spend'] / d['clicks'] for d in recent_data if d['clicks'] > 0]
            avg_revenue_per_conversion = statistics.mean([
                d['revenue'] / d['conversions'] for d in recent_data if d['conversions'] > 0
            ]) if any(d['conversions'] > 0 for d in recent_data) else 2000  # Значение по умолчанию
            
            avg_ctr = statistics.mean(ctrs) if ctrs else 0.025
            avg_cr = statistics.mean(crs) if crs else 0.018
            avg_cpc = statistics.mean(cpcs) if cpcs else 15.0
        else:
            # Если данных нет, используем значения по умолчанию
            avg_ctr = 0.025
            avg_cr = 0.018
            avg_cpc = 15.0
            avg_revenue_per_conversion = 2000
        
        # Преобразуем предсказания
        augmented_predictions = []
        for pred in predictions:
            # Рассчитываем производные метрики на основе предсказаний
            predicted_spend = pred['spend']
            # Из CPC и Spend получаем Clicks
            predicted_clicks = max(1, int(predicted_spend / pred.get('cpc', avg_cpc)))
            # Из CTR и Clicks получаем Impressions
            predicted_impressions = max(1, int(predicted_clicks / pred.get('ctr', avg_ctr)))
            # Из CR и Clicks получаем Conversions
            predicted_conversions = max(0, int(predicted_clicks * pred.get('cr', avg_cr)))
            # Доход
            predicted_revenue = predicted_conversions * avg_revenue_per_conversion
            
            augmented_pred = {
                'date': pred['date'],
                'spend': round(predicted_spend, 2),
                'impressions': predicted_impressions,
                'clicks': predicted_clicks,
                'conversions': predicted_conversions,
                'revenue': round(predicted_revenue, 2)
            }
            augmented_predictions.append(augmented_pred)
        
        # Добавляем предсказания в конец существующих данных
        existing_data.extend(augmented_predictions)
        
        # Сохраняем обновленные данные обратно в файл
        with open(historical_data_filepath, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Успешно добавлено {len(augmented_predictions)} предсказаний в {historical_data_filepath}")
        return True
        
    except Exception as e:
        logger.error(f"Ошибка при добавлении предсказаний в {historical_data_filepath}: {e}")
        return False

if __name__ == "__main__":
    # Пример использования
    print("Генерация исторических данных...")
    
    # Создаем экземпляр предиктора
    predictor = AdMetricsPredictor()
    
    # Определяем путь к файлу исторических данных
    historical_data_filepath = './api/data/historical_data.json'
    
    # Генерируем исторические данные и сохраняем их в файл
    historical_data = generate_historical_data(500, save_to_file=True, filepath=historical_data_filepath)
    print(f"Сгенерировано {len(historical_data)} точек исторических данных.")
    
    # Обучаем модель
    print("Начинаем обучение модели...")
    predictor.train(historical_data)
    print("Обучение завершено.")
    
    # Предсказываем на 7 дней вперед
    print("Генерируем предсказания на 7 дней вперед...")
    predictions = predictor.predict_next_days(historical_data, days_ahead=7)
    print("Предсказания на следующие 7 дней:")
    for pred in predictions:
        print(f"Дата: {pred['date']}")
        print(f"  CTR: {pred['ctr']:.4f}")
        print(f"  CR: {pred['cr']:.4f}")
        print(f"  CPC: {pred['cpc']:.2f} руб")
        print(f"  Spend: {pred['spend']:.2f} руб")
        print()
    
    # Добавляем предсказания в файл исторических данных
    print("Добавляем предсказания в файл исторических данных...")
    success = append_predictions_to_historical_data_v2(historical_data_filepath, predictions)
    if success:
        print("Предсказания успешно добавлены в файл исторических данных.")
    else:
        print("Не удалось добавить предсказания в файл исторических данных.")
    
    # Сохраняем модель
    model_path = './data/model_weights/ad_metrics_model.pkl'
    import os
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    predictor.save_model(model_path)
    print(f"Модель сохранена в {model_path}")