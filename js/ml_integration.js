// js/ml_integration.js

/**
 * Показать сообщение об ошибке на странице
 * @param {string} message - Текст ошибки
 */
function showError(message) {
    const errorContainer = document.getElementById('ml-error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="ml-error-message">
                <i class="fas fa-exclamation-circle"></i>
                <div>
                    <h4>Ошибка</h4>
                    <p>${message}</p>
                </div>
            </div>
        `;
    } else {
        console.error("Контейнер для ошибок #ml-error-container не найден. Ошибка:", message);
        // alert(message); // Альтернатива, если контейнер не найден
    }
}

/**
 * Скрыть сообщения об ошибках
 */
function hideError() {
    const errorContainer = document.getElementById('ml-error-container');
    if (errorContainer) {
        errorContainer.innerHTML = '';
    }
}

/**
 * Показать индикатор загрузки
 */
function showLoadingIndicator() {
    const indicator = document.getElementById('ml-loading-indicator');
    if (indicator) {
        indicator.style.display = 'flex';
    }
}

/**
 * Скрыть индикатор загрузки
 */
function hideLoadingIndicator() {
    const indicator = document.getElementById('ml-loading-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

/**
 * Обновить полосу прогресса (если используется)
 * @param {number} percent - Процент выполнения (0-100)
 */
function updateProgressBar(percent) {
    const progressBar = document.querySelector('.progress-bar');
    const progressText = document.getElementById('training-progress-text');
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
        progressBar.setAttribute('aria-valuenow', percent);
    }
    if (progressText) {
        progressText.textContent = `${percent}%`;
    }
}

/**
 * Обновить статус модели в UI
 * @param {Object} stats - Объект со статистикой модели
 */
function updateModelStatsUI(stats) {
    if (!stats) return;

    // Обновление статуса модели (Обучена/Не обучена)
    const trainedStatusElements = document.querySelectorAll('[data-dynamic="model-trained-status"]');
    trainedStatusElements.forEach(el => {
        if (el) {
            // Определяем класс статуса
            let statusClass = 'status-warning'; // По умолчанию "Не обучена"
            let statusText = 'Не обучена';
            if (stats.model_trained === true) {
                statusClass = 'status-success';
                statusText = 'Обучена';
            } else if (stats.model_trained === false) {
                statusClass = 'status-warning';
                statusText = 'Не обучена';
            } else if (stats.model_trained === 'error') {
                statusClass = 'status-error';
                statusText = 'Ошибка';
            }
            
            el.textContent = statusText;
            el.className = `status-badge ${statusClass}`;
        }
    });

    // Обновление даты последнего обучения
    const lastTrainedElements = document.querySelectorAll('[data-dynamic="last-training"]');
    lastTrainedElements.forEach(el => {
        if (el && stats.last_trained) {
            el.textContent = stats.last_trained;
        } else if (el) {
            el.textContent = 'Никогда';
        }
    });

    // Обновление точности (MAE)
    if (stats.accuracy) {
        const ctrAccuracyElements = document.querySelectorAll('[data-dynamic="model-accuracy-ctr"]');
        ctrAccuracyElements.forEach(el => {
            if (el && stats.accuracy.ctr_mae !== undefined) {
                el.textContent = stats.accuracy.ctr_mae.toFixed(4);
            } else if (el) {
                el.textContent = '-';
            }
        });

        const spendAccuracyElements = document.querySelectorAll('[data-dynamic="model-accuracy-spend"]');
        spendAccuracyElements.forEach(el => {
            if (el && stats.accuracy.spend_mae !== undefined) {
                el.textContent = stats.accuracy.spend_mae.toFixed(2);
            } else if (el) {
                el.textContent = '-';
            }
        });
    }
}

/**
 * Отобразить рекомендации
 * @param {Array} recommendations - Массив объектов с рекомендациями
 */
function displayRecommendations(recommendations) {
    const container = document.getElementById('ml-recommendations');
    if (!container) {
        console.warn("Контейнер для рекомендаций #ml-recommendations не найден");
        return;
    }

    // Очищаем контейнер
    container.innerHTML = '';

    if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
        container.innerHTML = `
            <div class="no-data-message">
                <i class="fas fa-info-circle"></i>
                <p>Рекомендации отсутствуют.</p>
            </div>
        `;
        return;
    }

    // Создаем HTML для каждой рекомендации
    recommendations.forEach(rec => {
        const recElement = document.createElement('div');
        recElement.className = 'recommendation-card';

        // Определяем иконку и цвет в зависимости от типа
        let iconClass, iconBgClass, iconColorClass;
        switch (rec.type) {
            case 'positive':
                iconClass = 'fa-thumbs-up';
                iconBgClass = 'bg-green-100';
                iconColorClass = 'text-green-600';
                break;
            case 'warning':
                iconClass = 'fa-exclamation-triangle';
                iconBgClass = 'bg-yellow-100';
                iconColorClass = 'text-yellow-600';
                break;
            case 'negative':
                iconClass = 'fa-exclamation-circle';
                iconBgClass = 'bg-red-100';
                iconColorClass = 'text-red-600';
                break;
            default: // 'info'
                iconClass = 'fa-info-circle';
                iconBgClass = 'bg-blue-100';
                iconColorClass = 'text-blue-600';
        }

        recElement.innerHTML = `
            <div class="recommendation-icon ${iconBgClass} ${iconColorClass}">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="recommendation-content">
                <div class="recommendation-title">${rec.message || 'Без названия'}</div>
                <div class="recommendation-desc">Приоритет: ${
                    rec.priority === 'high' ? 'Высокий' :
                    rec.priority === 'medium' ? 'Средний' : 'Низкий'
                }</div>
            </div>
        `;
        container.appendChild(recElement);
    });
}

/**
 * Создать график CTR
 * @param {Array} historicalData - Исторические данные
 * @param {Array} predictions - Предсказанные данные
 */
async function createCTRPredictionChart(historicalData, predictions) {
    const elementId = 'ctr-prediction-chart';
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`Элемент с ID ${elementId} не найден`);
        return;
    }

    try {
        // Подготовка исторических данных
        const historicalDates = historicalData.map(d => new Date(d.date));
        // Рассчитываем CTR из исторических данных
        const historicalCTR = historicalData.map(d => {
            const impressions = d.impressions || 1;
            const clicks = d.clicks || 0;
            return impressions > 0 ? clicks / impressions : 0;
        });

        // Подготовка предсказанных данных
        const predictedDates = predictions.map(d => new Date(d.date));
        const predictedCTR = predictions.map(d => d.ctr || 0);
        
        // Для доверительного интервала используем данные из предсказаний или симуляцию
        const predictedUpperBound = predictions.map(d => 
            d.ctr_upper !== undefined ? d.ctr_upper : (d.ctr || 0) * 1.1
        );
        const predictedLowerBound = predictions.map(d => 
            d.ctr_lower !== undefined ? d.ctr_lower : (d.ctr || 0) * 0.9
        );

        const chartData = [
            {
                x: historicalDates,
                y: historicalCTR,
                type: 'scatter',
                mode: 'lines',
                name: 'История CTR',
                line: { color: '#3b82f6' }, // Синий
                fill: 'tozeroy',
                fillcolor: 'rgba(59, 130, 246, 0.1)'
            },
            {
                x: predictedDates,
                y: predictedCTR,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Прогноз CTR',
                line: { color: '#10b981', dash: 'dash' }, // Зеленый пунктир
                marker: { symbol: 'diamond', size: 6 }
            },
            {
                x: [...predictedDates, ...predictedDates.slice().reverse()],
                y: [...predictedUpperBound, ...predictedLowerBound.slice().reverse()],
                type: 'scatter',
                mode: 'lines',
                name: 'Доверительный интервал',
                line: { width: 0 },
                fill: 'toself',
                fillcolor: 'rgba(16, 185, 129, 0.2)',
                hovertemplate: '%{x|%d.%m.%Y}<br>Верхняя граница: %{y:.2%}<br>Нижняя граница: %{y:.2%}<extra>Доверительный интервал</extra>'
            }
        ];

        const layout = {
            title: 'CTR: История и Предсказания',
            showlegend: true,
            hovermode: 'x unified',
            template: 'plotly_white',
            margin: { t: 40, l: 60, r: 30, b: 60 },
            xaxis: { title: 'Дата' },
            yaxis: { title: 'CTR', tickformat: '.2%' },
            legend: { orientation: 'h', y: -0.2 }
        };

        await Plotly.newPlot(elementId, chartData, layout);

    } catch (error) {
        console.error('Ошибка при создании графика CTR:', error);
        element.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">Ошибка загрузки графика CTR</div>`;
    }
}

/**
 * Создать график расходов
 * @param {Array} historicalData - Исторические данные
 * @param {Array} predictions - Предсказанные данные
 */
async function createSpendPredictionChart(historicalData, predictions) {
    const elementId = 'spend-prediction-chart';
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`Элемент с ID ${elementId} не найден`);
        return;
    }

    try {
        // Подготовка исторических данных
        const historicalDates = historicalData.map(d => new Date(d.date));
        const historicalSpend = historicalData.map(d => d.spend || 0);

        // Подготовка предсказанных данных
        const predictedDates = predictions.map(d => new Date(d.date));
        const predictedSpend = predictions.map(d => d.spend || 0);
        
        // Для доверительного интервала используем данные из предсказаний или симуляцию
        const predictedUpperBound = predictions.map(d => 
            d.spend_upper !== undefined ? d.spend_upper : (d.spend || 0) * 1.15
        );
        const predictedLowerBound = predictions.map(d => 
            d.spend_lower !== undefined ? d.spend_lower : (d.spend || 0) * 0.85
        );

        const chartData = [
            {
                x: historicalDates,
                y: historicalSpend,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'История расходов',
                line: { color: '#3b82f6' }, // Синий
                fill: 'tozeroy',
                fillcolor: 'rgba(59, 130, 246, 0.1)'
            },
            {
                x: predictedDates,
                y: predictedSpend,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Прогноз расходов',
                line: { color: '#f97316', dash: 'dash' }, // Оранжевый пунктир
                marker: { symbol: 'diamond', size: 6 }
            },
            {
                x: [...predictedDates, ...predictedDates.slice().reverse()],
                y: [...predictedUpperBound, ...predictedLowerBound.slice().reverse()],
                type: 'scatter',
                mode: 'lines',
                name: 'Доверительный интервал',
                line: { width: 0 },
                fill: 'toself',
                fillcolor: 'rgba(249, 115, 22, 0.2)',
                hovertemplate: '%{x|%d.%m.%Y}<br>Верхняя граница: %{y:,.0f} ₽<br>Нижняя граница: %{y:,.0f} ₽<extra>Доверительный интервал</extra>'
            }
        ];

        const layout = {
            title: 'Расходы: История и Предсказания',
            showlegend: true,
            hovermode: 'x unified',
            template: 'plotly_white',
            margin: { t: 40, l: 60, r: 30, b: 60 },
            xaxis: { title: 'Дата' },
            yaxis: { title: 'Рубли (₽)', tickformat: ',.0f' },
            legend: { orientation: 'h', y: -0.2 }
        };

        await Plotly.newPlot(elementId, chartData, layout);

    } catch (error) {
        console.error('Ошибка при создании графика расходов:', error);
        element.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">Ошибка загрузки графика расходов</div>`;
    }
}

/**
 * Создать график важности признаков
 * @param {Object} featureImportance - Объект с важностью признаков
 */
async function createFeatureImportanceChart(featureImportance) {
    const elementId = 'feature-importance-chart';
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`Элемент с ID ${elementId} не найден`);
        return;
    }

    try {
        if (!featureImportance || typeof featureImportance !== 'object') {
            element.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">Нет данных для отображения</div>`;
            return;
        }

        // Преобразуем объект в массив и сортируем по убыванию
        const features = Object.entries(featureImportance)
            .map(([feature, importance]) => ({ feature, importance: parseFloat(importance) || 0 }))
            .sort((a, b) => b.importance - a.importance);

        const featureNames = features.map(f => f.feature);
        const importanceValues = features.map(f => f.importance);

        const chartData = [{
            x: importanceValues,
            y: featureNames,
            type: 'bar',
            orientation: 'h',
            marker: {
                color: '#3b82f6'
            },
            text: importanceValues.map(v => (v * 100).toFixed(1) + '%'),
            textposition: 'auto'
        }];

        const layout = {
            title: 'Важность признаков в модели',
            xaxis: { title: 'Важность', tickformat: '.1%' },
            yaxis: { title: 'Признаки', automargin: true },
            margin: { l: 150, r: 30, t: 60, b: 60 }
        };

        await Plotly.newPlot(elementId, chartData, layout);

    } catch (error) {
        console.error('Ошибка при создании графика важности признаков:', error);
        element.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">Ошибка загрузки графика важности признаков</div>`;
    }
}

/**
 * Загрузить исторические данные из файла
 * @returns {Promise<Array|null>} Массив данных или null при ошибке
 */
async function loadHistoricalData() {
    try {
        console.log("Загрузка исторических данных из файла ./api/data/historical_data.json...");
        const response = await fetch('./api/data/historical_data.json');

        if (!response.ok) {
            throw new Error(`Ошибка при загрузке исторических данных: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Исторические данные успешно загружены. Загружено ${data.length} записей.`);
        return data;
    } catch (error) {
        console.error("Не удалось загрузить исторические данные:", error);
        showError(`Ошибка: Не удалось загрузить исторические данные из ./api/data/historical_data.json. ${error.message}`);
        return null;
    }
}

/**
 * Получить статистику модели от API
 * @returns {Promise<Object|null>} Объект со статистикой или null при ошибке
 */
async function getModelStatsFromAPI() {
    try {
        console.log("Запрос статистики модели у API...");
        const response = await fetch('http://localhost:5000/api/model-stats');

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка API (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log("Статистика модели получена:", data);
        return data;
    } catch (error) {
        console.error('Ошибка при получении статистики модели:', error);
        showError('Невозможно получить статистику: ' + 'не удается подключиться к модели');
        return null;
    }
}

/**
 * Обучить модель через API
 * @param {Array} historicalData - Массив исторических данных
 * @returns {Promise<Object|null>} Результат обучения или null при ошибке
 */
async function trainModelViaAPI(historicalData) {
    try {
        console.log("Отправка данных на обучение модели через API...");
        showLoadingIndicator();
        hideError(); // Скрываем предыдущие ошибки
        updateProgressBar(0);
        
        const response = await fetch('http://localhost:5000/api/train', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ historical_data: historicalData })
        });

        updateProgressBar(50); // Промежуточный прогресс

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Ошибка API (${response.status})`);
        }

        const data = await response.json();
        console.log("Модель успешно обучена:", data);
        updateProgressBar(100);
        
        // // Показываем сообщение об успехе
        // alert(data.message || "Модель успешно обучена!");
        
        return data;
    } catch (error) {
        console.error('Ошибка при обучении модели через API:', error);
        showError('Не удалось обучить модель: ' + error.message);
        return null;
    } finally {
        hideLoadingIndicator();
        updateProgressBar(0); // Сброс прогресса
    }
}

/**
 * Получить предсказания от API
 * @param {Array} historicalData - Массив исторических данных
 * @param {number} daysAhead - Количество дней для предсказания
 * @returns {Promise<Object|null>} Объект с предсказаниями или null при ошибке
 */
async function getPredictionsFromAPI(historicalData, daysAhead = 7) {
    try {
        console.log(`Запрос предсказаний на ${daysAhead} дней...`);
        const response = await fetch('http://localhost:5000/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                historical_data: historicalData,
                days_ahead: daysAhead
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Ошибка API (${response.status})`);
        }

        const data = await response.json();
        console.log(`Получены предсказания на ${data.days_ahead || daysAhead} дней.`);
        return data;
    } catch (error) {
        console.error('Ошибка при получении предсказаний:', error);
        showError('Не удалось получить предсказания: ' + error.message);
        return null;
    }
}

/**
 * Получить рекомендации от API
 * @param {Array} historicalData - Массив исторических данных
 * @param {number} daysAhead - Количество дней для анализа
 * @returns {Promise<Object|null>} Объект с рекомендациями или null при ошибке
 */
async function getRecommendationsFromAPI(historicalData, daysAhead = 7) {
    try {
        console.log(`Запрос рекомендаций на ${daysAhead} дней...`);
        const response = await fetch('http://localhost:5000/api/recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                historical_data: historicalData,
                days_ahead: daysAhead
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Ошибка API (${response.status})`);
        }

        const data = await response.json();
        console.log("Получены рекомендации.");
        return data;
    } catch (error) {
        console.error('Ошибка при получении рекомендаций:', error);
        showError('Не удалось получить рекомендации: ' + error.message);
        return null;
    }
}

/**
 * Основная функция для обработки нажатия кнопки "Обучить модель"
 */
async function handleTrainModelButtonClick() {
    console.log("Нажата кнопка 'Обучить модель'");
    
    try {
        // 1. Загрузка исторических данных
        const historicalData = await loadHistoricalData();
        if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
            throw new Error("Не удалось загрузить корректные исторические данные.");
        }

        // 2. Обучение модели
        const trainResult = await trainModelViaAPI(historicalData);
        if (!trainResult) {
            // Ошибка уже показана в trainModelViaAPI
            return;
        }

        // 3. Обновление статистики модели в UI
        const updatedStats = await getModelStatsFromAPI();
        if (updatedStats) {
            updateModelStatsUI(updatedStats);
        }

        // 4. Получение и отображение предсказаний
        const predictionData = await getPredictionsFromAPI(historicalData, 14);
        if (predictionData && predictionData.predictions) {
            await createCTRPredictionChart(historicalData, predictionData.predictions);
            await createSpendPredictionChart(historicalData, predictionData.predictions);
        }

        // 5. Получение и отображение важности признаков (если доступна в статистике)
        if (updatedStats && updatedStats.feature_importance) {
            await createFeatureImportanceChart(updatedStats.feature_importance);
        }

        // 6. Получение и отображение рекомендаций
        const recommendationData = await getRecommendationsFromAPI(historicalData, 14);
        if (recommendationData && recommendationData.recommendations) {
            displayRecommendations(recommendationData.recommendations);
        }

        console.log("Все операции после обучения завершены.");

    } catch (error) {
        console.error("Ошибка в процессе обучения модели:", error);
        showError('Произошла ошибка: ' + error.message);
    }
}

/**
 * Инициализация ML-секции при загрузке страницы
 */
async function initializeMLSection() {
    console.log("Инициализация ML-секции...");

    // Проверка состояния API
    try {
        const healthResponse = await fetch('http://localhost:5000/api/health');
        if (healthResponse.ok) {
            console.log("ML API доступен");
        } else {
            console.warn("ML API недоступен:", healthResponse.status);
            showError("Предупреждение: Сервис машинного обучения временно недоступен.");
        }
    } catch (err) {
        console.error("Не удалось подключиться к ML API:", err);
        showError("Ошибка: Не удалось подключиться к сервису машинного обучения.");
    }

    // Загрузка начальной статистики
    const stats = await getModelStatsFromAPI();
    if (stats) {
        updateModelStatsUI(stats);
    }

    // Привязка обработчика к кнопке "Обучить модель"
    const trainButton = document.getElementById('train-model-btn');
    if (trainButton) {
        console.log("Найдена кнопка 'Обучить модель', добавляем обработчик события.");
        trainButton.addEventListener('click', handleTrainModelButtonClick);
    } else {
        console.warn("Кнопка 'Обучить модель' (#train-model-btn) не найдена в DOM.");
        // Попробуем найти по классу, если ID не работает
        const trainButtons = document.querySelectorAll('button.btn-primary .fa-brain');
        if (trainButtons.length > 0) {
            const btn = trainButtons[0].closest('button');
            if (btn) {
                console.log("Найдена кнопка 'Обучить модель' по классу, добавляем обработчик события.");
                btn.addEventListener('click', handleTrainModelButtonClick);
            }
        }
    }

    // Привязка обработчика к кнопке "Обновить"
    const refreshButton = document.getElementById('refresh-ml-charts');
    if (refreshButton) {
        refreshButton.addEventListener('click', async function () {
            console.log("Нажата кнопка 'Обновить ML-графики'");
            const currentStats = await getModelStatsFromAPI();
            if (currentStats) {
                updateModelStatsUI(currentStats);
            }
            // Можно также перезагрузить графики, если данные доступны
        });
    }
}



// --- Запуск инициализации после загрузки DOM ---
document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM загружен, инициализируем ML-интеграцию...");
    initializeMLSection();
});