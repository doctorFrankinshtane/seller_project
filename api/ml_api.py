# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os
import json
import logging
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Получаем путь к текущему скрипту (app.py)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Получаем путь к директории python/
python_dir = os.path.abspath(os.path.join(current_dir, '..', 'python'))
# Добавляем путь к python/ в sys.path
if python_dir not in sys.path:
    sys.path.append(python_dir)

# Импортируем необходимый класс
try:
    from ml_model import AdMetricsPredictor
    logger.info("Модуль ml_model успешно импортирован!")
except ImportError as e:
    logger.error(f"Ошибка импорта ml_model: {e}")
    raise

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для фронтенда

# Глобальные переменные для модели
predictor = AdMetricsPredictor()
model_trained = False
last_trained = None
# Используем абсолютный путь относительно директории api или корня проекта
model_save_path = os.path.abspath(os.path.join(current_dir, '..', 'data', 'model_weights', 'ad_metrics_model.pkl'))

# Убедимся, что директория для сохранения модели существует
os.makedirs(os.path.dirname(model_save_path), exist_ok=True)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Проверка состояния API"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model_trained,
        'last_trained': last_trained
    })

@app.route('/api/train', methods=['POST'])
def train_model():
    """API endpoint для обучения модели"""
    global model_trained, last_trained, predictor
    try:
        data = request.json
        if not data:
             logger.warning("Запрос на обучение: Тело запроса пустое или не в формате JSON.")
             return jsonify({'error': 'Тело запроса должно быть в формате JSON'}), 400

        historical_data = data.get('historical_data', [])
        if not historical_data:
            logger.warning("Запрос на обучение: Не предоставлены исторические данные.")
            return jsonify({'error': 'Не предоставлены исторические данные'}), 400

        logger.info(f"Начало обучения модели с {len(historical_data)} точками данных...")
        # Здесь будет реальное обучение модели
        predictor.train(historical_data)
        model_trained = True
        last_trained = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        # Сохраняем модель
        try:
            predictor.save_model(model_save_path)
            logger.info(f"Модель успешно сохранена в {model_save_path}.")
        except Exception as save_error:
            logger.error(f"Ошибка при сохранении модели: {save_error}")
            # Не возвращаем ошибку клиенту, так как обучение прошло успешно
        logger.info("Модель успешно обучена.")
        return jsonify({
            'status': 'success',
            'message': 'Модель успешно обучена',
            'last_trained': last_trained,
            'data_points': len(historical_data)
        })
    except Exception as e:
        logger.error(f"Ошибка при обучении модели: {e}", exc_info=True)
        return jsonify({'error': f'Ошибка при обучении модели: {str(e)}'}), 500

@app.route('/api/predict', methods=['POST'])
def predict_metrics():
    """API endpoint для предсказания метрик"""
    global model_trained, predictor
    if not model_trained:
        logger.warning("Запрос на предсказание: Модель не обучена.")
        return jsonify({'error': 'Модель не обучена'}), 400
    try:
        data = request.json
        if not data:
             logger.warning("Запрос на предсказание: Тело запроса пустое или не в формате JSON.")
             return jsonify({'error': 'Тело запроса должно быть в формате JSON'}), 400

        historical_data = data.get('historical_data', [])
        days_ahead = data.get('days_ahead', 7)
        if not historical_data:
            logger.warning("Запрос на предсказание: Не предоставлены исторические данные.")
            return jsonify({'error': 'Не предоставлены исторические данные'}), 400
        logger.info(f"Генерация предсказаний на {days_ahead} дней...")
        # Используем реальную модель для предсказаний
        predictions = predictor.predict_next_days(historical_data, days_ahead)
        logger.info(f"Сгенерировано {len(predictions)} предсказаний.")
        return jsonify({
            'predictions': predictions,
            'days_ahead': days_ahead
        })
    except Exception as e:
        logger.error(f"Ошибка при генерации предсказаний: {e}", exc_info=True)
        return jsonify({'error': f'Ошибка при генерации предсказаний: {str(e)}'}), 500

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    """API endpoint для получения рекомендаций"""
    global model_trained, predictor
    if not model_trained:
        logger.warning("Запрос на рекомендации: Модель не обучена.")
        return jsonify({'error': 'Модель не обучена'}), 400
    try:
        data = request.json
        if not data:
             logger.warning("Запрос на рекомендации: Тело запроса пустое или не в формате JSON.")
             return jsonify({'error': 'Тело запроса должно быть в формате JSON'}), 400

        historical_data = data.get('historical_data', [])
        days_ahead = data.get('days_ahead', 7)
        if not historical_data:
            logger.warning("Запрос на рекомендации: Не предоставлены исторические данные.")
            return jsonify({'error': 'Не предоставлены исторические данные'}), 400
        logger.info("Генерация рекомендаций...")
        # Получаем предсказания от модели (для согласованности)
        # В вашем JS-коде generate_mock_recommendations использует только historical_data,
        # но мы передаём и предсказания для полноты картины.
        try:
            predictions = predictor.predict_next_days(historical_data, days_ahead)
        except Exception as pred_error:
            logger.warning(f"Не удалось получить предсказания для рекомендаций: {pred_error}")
            predictions = [] # Используем пустой список, если предсказания не нужны
        # Генерируем симулированные рекомендации (как в оригинале)
        # В будущем можно заменить на логику, использующую predictions
        recommendations = generate_mock_recommendations(historical_data, days_ahead)
        logger.info(f"Сгенерировано {len(recommendations)} рекомендаций.")
        return jsonify({
            'recommendations': recommendations,
            'days_ahead': days_ahead
        })
    except Exception as e:
        logger.error(f"Ошибка при генерации рекомендаций: {e}", exc_info=True)
        return jsonify({'error': f'Ошибка при генерации рекомендаций: {str(e)}'}), 500

@app.route('/api/model-stats', methods=['GET'])
def get_model_stats():
    """
    API endpoint для получения статистики модели.
    Пытается получить статистику из метода predictor.get_stats().
    Если метод не существует или вызывает ошибку, возвращаются симулированные данные.
    """
    global model_trained, last_trained, predictor
    try:
        # Предполагаем, что в AdMetricsPredictor есть метод get_stats()
        # Проверяем, существует ли атрибут и является ли он вызываемым
        if model_trained and hasattr(predictor, 'get_stats') and callable(getattr(predictor, 'get_stats')):
            stats = predictor.get_stats()
            logger.info("Статистика модели получена через predictor.get_stats()")
        else:
            # Если метод predictor.get_stats() отсутствует,
            # попробуем импортировать отдельную функцию get_model_stats из модуля ml_model
            # (убедитесь, что такая функция определена в ml_model.py)
            logger.info("Метод predictor.get_stats() не найден, пробуем импортировать функцию из модуля.")
            try:
                from ml_model import get_model_stats as get_stats_function
                if callable(get_stats_function):
                    stats = get_stats_function()
                    logger.info("Статистика модели получена через функцию из модуля ml_model.")
                else:
                     raise AttributeError("Функция get_model_stats в ml_model.py не является вызываемой.")
            except (ImportError, AttributeError) as import_error:
                 logger.warning(f"Не удалось импортировать или вызвать функцию из ml_model: {import_error}")
                 # Если и это не удалось, используем симуляцию по умолчанию
                 raise # Передаем ошибку в основной блок except для симуляции

    except Exception as e:
        # В случае любой ошибки (метод не найден, ошибка при вызове, ошибка импорта) используем симуляцию по умолчанию
        logger.warning(f"Не удалось получить статистику модели, используются симулированные данные: {e}")
        stats = {
            'model_trained': model_trained,
            'last_trained': last_trained,
            'accuracy': {
                'ctr_mae': round(np.random.uniform(0.001, 0.01), 4),
                'cr_mae': round(np.random.uniform(0.0005, 0.005), 4),
                'cpc_mae': round(np.random.uniform(0.5, 3.0), 2),
                'spend_mae': round(np.random.uniform(1000, 5000), 2)
            },
            'feature_importance': {
                'day_of_week': round(np.random.uniform(0.15, 0.3), 2),
                'ctr_moving_avg': round(np.random.uniform(0.15, 0.3), 2),
                'seasonality': round(np.random.uniform(0.1, 0.25), 2),
                'past_spend': round(np.random.uniform(0.15, 0.3), 2),
                'conversion_rate': round(np.random.uniform(0.1, 0.2), 2)
            }
        }

    # Убедимся, что основные поля присутствуют
    stats.setdefault('model_trained', model_trained)
    stats.setdefault('last_trained', last_trained)
    return jsonify(stats)

def generate_mock_recommendations(historical_data, days_ahead):
    """Генерация симулированных рекомендаций"""
    recommendations = []
    # Анализируем последние данные
    if historical_data:
        try:
            last_data = historical_data[-1]
            # Используем последние 7 точек данных, если доступно
            recent_data_slice = historical_data[-min(14, len(historical_data)):]
            avg_ctr = float(np.mean([d.get('ctr', 0) for d in recent_data_slice]))
            avg_spend = float(np.mean([d.get('spend', 0) for d in recent_data_slice]))
            # Генерируем рекомендации на основе анализа
            if last_data.get('ctr', 0) > avg_ctr * 1.1:
                recommendations.append({
                    'type': 'positive',
                    'message': 'Высокий CTR наблюдается в последнее время. Рассмотрите увеличение бюджета для масштабирования успешных кампаний.',
                    'priority': 'high'
                })
            if last_data.get('spend', 0) > avg_spend * 1.5:
                recommendations.append({
                    'type': 'warning',
                    'message': 'Значительный рост расходов. Проверьте эффективность новых кампаний.',
                    'priority': 'medium'
                })
            if last_data.get('cpc', 0) > 25: # Используем .get для безопасности
                recommendations.append({
                    'type': 'negative',
                    'message': 'Высокая стоимость клика. Рассмотрите оптимизацию таргетинга или креативов.',
                    'priority': 'high'
                })
        except (IndexError, KeyError, TypeError, ValueError) as e:
             logger.warning(f"Ошибка при анализе historical_data для рекомендаций: {e}")

    # Добавляем общие рекомендации
    recommendations.extend([
        {
            'type': 'info',
            'message': f'Прогноз на {days_ahead} дней готов. Следите за предсказанными трендами.',
            'priority': 'low'
        },
        {
            'type': 'info',
            'message': 'Рекомендуется регулярное обучение модели для повышения точности предсказаний.',
            'priority': 'medium'
        }
    ])
    return recommendations

def create_training_charts(model_stats=None):
    """
    Создает графики, иллюстрирующие процесс и результаты обучения модели.
    Адаптировано из python/model_viz.py
    """
    charts = {}

    # --- График 1: Важность признаков ---
    if model_stats and 'feature_importance' in model_stats:
        feature_names = list(model_stats['feature_importance'].keys())
        importances = list(model_stats['feature_importance'].values())
        
        # Сортировка по убыванию важности
        sorted_indices = np.argsort(importances)[::-1]
        sorted_features = [feature_names[i] for i in sorted_indices]
        sorted_importances = [importances[i] for i in sorted_indices]
        
        fig_importance = go.Figure(data=go.Bar(
            x=sorted_importances,
            y=sorted_features,
            orientation='h',
            marker=dict(
                color=sorted_importances,
                colorscale='Blues',
                showscale=False
            ),
            text=[f"{imp:.2f}" for imp in sorted_importances],
            textposition='auto',
        ))
        
        fig_importance.update_layout(
            title="Важность признаков в модели",
            xaxis_title="Важность",
            yaxis_title="Признаки",
            template="plotly_white",
            height=400,
            margin=dict(l=150, r=20, t=40, b=40)
        )
        # Сохраняем данные и layout отдельно, как ожидает фронтенд
        charts['feature_importance'] = {
            'data': fig_importance.data,
            'layout': fig_importance.layout
        }

    # --- График 2: Точность модели (MAE) ---
    metrics = ['CTR', 'CR', 'CPC', 'Spend']
    if model_stats and 'accuracy' in model_stats:
        # Используем MAE для "точности"
        mae_values = [
            model_stats['accuracy'].get('ctr_mae', 0.005),
            model_stats['accuracy'].get('cr_mae', 0.002),
            model_stats['accuracy'].get('cpc_mae', 1.2),
            model_stats['accuracy'].get('spend_mae', 2500)
        ]
    else:
        # Симуляция данных
        mae_values = [0.005, 0.002, 1.2, 2500]
        
    fig_mae = go.Figure(data=go.Bar(
        x=mae_values,
        y=metrics,
        orientation='h',
        marker_color=['#2563eb', '#10b981', '#8b5cf6', '#dc2626'],
        text=[f"{v:.4f}" if i < 2 else f"{v:,.0f}" for i, v in enumerate(mae_values)],
        textposition='auto',
    ))
    
    fig_mae.update_layout(
        title="Средняя абсолютная ошибка (MAE) предсказаний",
        xaxis_title="MAE",
        yaxis_title="Метрики",
        template="plotly_white",
        height=300,
        margin=dict(l=100, r=20, t=40, b=40)
    )
    charts['prediction_mae'] = {
        'data': fig_mae.data,
        'layout': fig_mae.layout
    }

    # --- График 3: История обучения (Loss) ---
    # Симуляция убывающего loss
    epochs = list(range(1, 51)) # 50 эпох для примера
    # Более реалистичная симуляция loss
    initial_loss = 5.0
    decay_rate = 0.05
    noise_level = 0.1
    loss_values = []
    current_loss = initial_loss
    for i in range(len(epochs)):
        decay = current_loss * decay_rate
        noise = np.random.normal(0, noise_level)
        current_loss = max(0.01, current_loss - decay + noise)
        loss_values.append(current_loss)
        
    fig_loss = go.Figure()
    fig_loss.add_trace(go.Scatter(
        x=epochs,
        y=loss_values,
        mode='lines+markers',
        name='Training Loss',
        line=dict(color='#dc2626', width=2),
        marker=dict(size=4)
    ))
    
    fig_loss.update_layout(
        title="История обучения (Loss)",
        xaxis_title="Эпоха",
        yaxis_title="Значение Loss",
        template="plotly_white",
        height=300,
        margin=dict(l=60, r=30, t=40, b=60)
    )
    charts['training_loss'] = {
        'data': fig_loss.data,
        'layout': fig_loss.layout
    }

    return charts

@app.route('/api/training-charts', methods=['GET'])
def get_training_charts():
    """
    API endpoint для получения данных графиков обучения и точности.
    """
    global model_trained, predictor
    
    try:
        logger.info("Генерация данных для графиков обучения...")
        
        # Получаем статистику модели для использования в графиках
        model_stats = None
        try:
            # Пытаемся получить реальную статистику
            if model_trained:
                 # Предполагаем, что predictor имеет метод get_stats или аналогичный
                 if hasattr(predictor, 'get_stats') and callable(getattr(predictor, 'get_stats')):
                     model_stats = predictor.get_stats()
                 else:
                     # Если метода нет, используем эндпоинт /api/model-stats
                     # Но для этого нужно имитировать вызов самого себя или иметь кэш
                     # Проще использовать симуляцию или вызвать внутреннюю функцию
                     # Пока используем симуляцию
                     pass
        except Exception as e:
            logger.warning(f"Не удалось получить статистику модели для графиков: {e}")
        
        # Если статистика не получена, используем симуляцию
        # В реальном приложении здесь должна быть логика получения реальных данных
        if not model_stats:
            model_stats = {
                'model_trained': model_trained,
                'last_trained': last_trained or 'Никогда',
                'accuracy': {
                    'ctr_mae': round(np.random.uniform(0.001, 0.01), 4),
                    'cr_mae': round(np.random.uniform(0.0005, 0.005), 4),
                    'cpc_mae': round(np.random.uniform(0.5, 3.0), 2),
                    'spend_mae': round(np.random.uniform(1000, 5000), 2)
                },
                'feature_importance': {
                    'day_of_week': round(np.random.uniform(0.15, 0.3), 2),
                    'ctr_moving_avg': round(np.random.uniform(0.15, 0.3), 2),
                    'seasonality': round(np.random.uniform(0.1, 0.25), 2),
                    'past_spend': round(np.random.uniform(0.15, 0.3), 2),
                    'conversion_rate': round(np.random.uniform(0.1, 0.2), 2)
                }
            }
        
        # Создаем графики
        charts_data = create_training_charts(model_stats=model_stats)
        
        logger.info("Данные для графиков обучения успешно сгенерированы.")
        return jsonify(charts_data)
        
    except Exception as e:
        logger.error(f"Ошибка при генерации данных для графиков: {e}", exc_info=True)
        return jsonify({'error': f'Ошибка при генерации данных для графиков: {str(e)}'}), 500

if __name__ == '__main__':
    # Попробуем загрузить уже обученную модель при запуске
    if os.path.exists(model_save_path):
        try:
            predictor.load_model(model_save_path)
            model_trained = True
            # last_trained можно установить в текущее время или сохранить/загрузить вместе с моделью
            last_trained = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            logger.info(f"Загружена ранее обученная модель из {model_save_path}.")
        except Exception as e:
            logger.warning(f"Не удалось загрузить модель из {model_save_path}: {e}")
    else:
         logger.info(f"Файл модели {model_save_path} не найден. Будет использована новая модель.")

    host = 'localhost'  # Слушаем на всех интерфейсах
    port = 5000
    logger.info("Запуск ML API сервера...")
    logger.info(f"Сервер доступен по адресу: http://{host}:{port}")
    app.run(debug=True, port=port, host=host) # debug=True для разработки, в продакшене лучше False
