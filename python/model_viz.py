# python/model_viz.py
"""
Скрипт для визуализации метрик и процесса обучения модели.
"""
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
import os

def create_training_charts(model_stats=None, training_history=None):
    """
    Создает графики, иллюстрирующие процесс и результаты обучения модели.
    
    Args:
        model_stats (dict, optional): Статистика модели из API.
        training_history (list, optional): История обучения (например, loss по эпохам).
        
    Returns:
        dict: Словарь с конфигурациями графиков Plotly.
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
        charts['feature_importance'] = fig_importance.to_plotly_json()

    # --- График 2: Точность модели (R2 Score) ---
    # Предположим, у нас есть R2 для каждой метрики
    metrics = ['CTR', 'CR', 'CPC', 'Spend']
    if model_stats and 'accuracy' in model_stats:
        r2_values = [
            model_stats['accuracy'].get('ctr_r2', 0.85),
            model_stats['accuracy'].get('cr_r2', 0.78),
            model_stats['accuracy'].get('cpc_r2', 0.91),
            model_stats['accuracy'].get('spend_r2', 0.88)
        ]
    else:
        # Симуляция данных, если статистика не предоставлена
        r2_values = [0.85, 0.78, 0.91, 0.88]
        
    fig_r2 = go.Figure(data=go.Bar(
        x=r2_values,
        y=metrics,
        orientation='h',
        marker_color=['#2563eb', '#10b981', '#8b5cf6', '#dc2626'],
        text=[f"{v:.2f}" for v in r2_values],
        textposition='auto',
    ))
    
    fig_r2.update_layout(
        title="Коэффициент детерминации (R²) для метрик",
        xaxis_title="R² Score",
        yaxis_title="Метрики",
        template="plotly_white",
        height=300,
        margin=dict(l=100, r=20, t=40, b=40),
        xaxis=dict(range=[0, 1]) # R2 от 0 до 1
    )
    charts['model_r2'] = fig_r2.to_plotly_json()

    # --- График 3: Средняя абсолютная ошибка (MAE) ---
    if model_stats and 'accuracy' in model_stats:
        mae_values = [
            model_stats['accuracy'].get('ctr_mae', 0.005),
            model_stats['accuracy'].get('cr_mae', 0.002),
            model_stats['accuracy'].get('cpc_mae', 1.2),
            model_stats['accuracy'].get('spend_mae', 2500)
        ]
    else:
        # Симуляция данных
        mae_values = [0.005, 0.002, 1.2, 2500]
        
    # Для лучшего отображения CPC и Spend нормализуем или используем логарифмическую шкалу
    # Здесь мы просто покажем значения как есть, но с пояснением
    fig_mae = go.Figure()
    
    # Добавляем MAE для CTR и CR (в процентах)
    fig_mae.add_trace(go.Bar(
        x=mae_values[:2], # CTR, CR
        y=metrics[:2],
        name='MAE (%)',
        marker_color=['#2563eb', '#10b981'],
        yaxis='y',
        offsetgroup=1
    ))
    
    # Добавляем MAE для CPC и Spend (в рублях)
    fig_mae.add_trace(go.Bar(
        x=mae_values[2:], # CPC, Spend
        y=metrics[2:],
        name='MAE (₽)',
        marker_color=['#8b5cf6', '#dc2626'],
        yaxis='y2',
        offsetgroup=2
    ))
    
    fig_mae.update_layout(
        title="Средняя абсолютная ошибка (MAE) предсказаний",
        yaxis=dict(
            title="Метрики (%)",
            categoryorder='array',
            categoryarray=metrics[:2]
        ),
        yaxis2=dict(
            title="Метрики (₽)",
            categoryorder='array',
            categoryarray=metrics[2:],
            overlaying='y',
            side='right'
        ),
        template="plotly_white",
        height=300,
        margin=dict(l=100, r=100, t=40, b=40),
        barmode='group'
    )
    charts['prediction_mae'] = fig_mae.to_plotly_json()

    # --- График 4: История обучения (если доступна) ---
    # Этот график обычно строится во время обучения, например, для loss
    # Для демонстрации создадим симулированную историю
    if training_history:
        epochs = list(range(1, len(training_history) + 1))
        loss_values = training_history
    else:
        epochs = list(range(1, 21)) # 20 эпох
        # Симуляция убывающего loss
        loss_values = [10 * np.exp(-0.2 * i) + np.random.normal(0, 0.1) for i in range(20)]
        loss_values = [max(0, val) for val in loss_values] # Не отрицательные значения
        
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
    charts['training_loss'] = fig_loss.to_plotly_json()

    return charts

# --- Пример использования ---
if __name__ == "__main__":
    # Симулируем данные для тестирования
    sample_stats = {
        'model_trained': True,
        'last_trained': '2023-10-27 10:00:00',
        'accuracy': {
            'ctr_r2': 0.87,
            'cr_r2': 0.81,
            'cpc_r2': 0.92,
            'spend_r2': 0.89,
            'ctr_mae': 0.0048,
            'cr_mae': 0.0019,
            'cpc_mae': 1.15,
            'spend_mae': 2450.0
        },
        'feature_importance': {
            'day_of_week': 0.25,
            'ctr_moving_avg': 0.22,
            'seasonality': 0.18,
            'past_spend': 0.19,
            'conversion_rate': 0.16
        }
    }
    
    # Создаем графики
    charts_data = create_training_charts(model_stats=sample_stats)
    
    # Сохраняем в JSON файл для использования в JS
    output_dir = '../data/viz'
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'training_charts.json')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(charts_data, f, ensure_ascii=False, indent=2)
    
    print(f"Графики сохранены в {output_path}")
