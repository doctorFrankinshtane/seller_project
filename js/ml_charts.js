// js/ml_charts.js

/**
 * Класс для управления ML-графиками.
 */
class MLCharts {
    /**
     * @param {string} apiUrl - Базовый URL вашего Flask API.
     */
    constructor(apiUrl = 'http://localhost:5000') {
        this.apiUrl = apiUrl;
        // Карта соответствия ID графиков и их названий для полноэкранного режима
        this.chartTitles = {
            'training-progress-chart': 'Процесс обучения модели',
            'accuracy-chart': 'Точность предсказаний (MAE)',
            'ctr-prediction-chart': 'История и Предсказания CTR',
            'spend-prediction-chart': 'История и Предсказания Расходов',
            'feature-importance-chart': 'Важность признаков в модели'
        };
        console.log(`MLCharts инициализирован с API URL: ${this.apiUrl}`);
    }

    /**
     * Загрузка данных из JSON-файла.
     * @param {string} filepath - Путь к JSON-файлу.
     * @returns {Promise<Object|null>} Разобранные данные JSON или null при ошибке.
     */
    async loadJSONData(filepath) {
        try {
            console.log(`Загрузка данных из ${filepath}...`);
            const response = await fetch(filepath);
            if (!response.ok) {
                throw new Error(`Ошибка загрузки ${filepath}: ${response.status}`);
            }
            const data = await response.json();
            console.log(`Данные из ${filepath} успешно загружены.`);
            return data;
        } catch (error) {
            console.error(`Ошибка при загрузке ${filepath}:`, error);
            // Не показываем alert, чтобы не мешать другим графикам
            return null;
        }
    }

    /**
     * Получение статистики модели от API.
     * @returns {Promise<Object|null>} Данные статистики или null при ошибке.
     */
    async fetchModelStats() {
        try {
            console.log("Запрос статистики модели у API...");
            const response = await fetch(`${this.apiUrl}/api/model-stats`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log("Статистика модели получена:", data);
            return data;
        } catch (error) {
            console.error('Ошибка при получении статистики модели:', error);
            // showError('Не удалось получить статистику модели: ' + error.message);
            return null;
        }
    }

    /**
     * Получение предсказаний от API.
     * @param {Array} historicalData - Массив исторических данных.
     * @param {number} daysAhead - Количество дней для предсказания.
     * @returns {Promise<Object|null>} Данные предсказаний или null при ошибке.
     */
    async fetchPredictions(historicalData, daysAhead = 7) {
        try {
            console.log(`Запрос предсказаний на ${daysAhead} дней...`);
            const requestData = {
                historical_data: historicalData,
                days_ahead: daysAhead
            };

            const response = await fetch(`${this.apiUrl}/api/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Получены предсказания на ${data.days_ahead || daysAhead} дней.`);
            return data;
        } catch (error) {
            console.error('Ошибка загрузки предсказаний:', error);
            // showError('Не удалось загрузить предсказания: ' + error.message);
            return null;
        }
    }

    /**
     * Загрузка исторических данных.
     * @returns {Promise<Array|null>} Массив исторических данных или null при ошибке.
     */
    async loadHistoricalData() {
        try {
            console.log("Загрузка исторических данных из ./api/data/historical_data.json...");
            const response = await fetch('./api/data/historical_data.json');
            if (!response.ok) {
                throw new Error(`Ошибка загрузки исторических данных: ${response.status}`);
            }
            const data = await response.json();
            console.log(`Исторические данные загружены (${data.length} записей).`);
            return data;
        } catch (error) {
            console.error("Ошибка загрузки исторических данных:", error);
            // showError('Не удалось загрузить исторические данные: ' + error.message);
            return null;
        }
    }

    /**
     * Создание графика CTR (История и Предсказания).
     * @param {Array} historicalData - Исторические данные.
     * @param {Array} predictionsData - Данные предсказаний.
     */
    async createCTRPredictionChart(historicalData, predictionsData) {
        const elementId = 'ctr-prediction-chart';
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Элемент с ID ${elementId} не найден для графика CTR.`);
            return;
        }

        try {
            // Проверяем, есть ли данные
            if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
                throw new Error("Нет исторических данных для графика CTR.");
            }
            if (!predictionsData || !Array.isArray(predictionsData.predictions) || predictionsData.predictions.length === 0) {
                 throw new Error("Нет данных предсказаний для графика CTR.");
            }

            // --- Подготовка данных ---
            // Исторические данные
            const historicalDates = historicalData.map(d => new Date(d.date));
            const historicalCTR = historicalData.map(d => {
                const impressions = d.impressions || 1;
                const clicks = d.clicks || 0;
                return impressions > 0 ? clicks / impressions : 0;
            });

            // Предсказанные данные
            const predictedDates = predictionsData.predictions.map(d => new Date(d.date));
            const predictedCTR = predictionsData.predictions.map(d => d.ctr !== undefined ? d.ctr : 0);
            
            // Доверительный интервал (если есть в данных)
            let hasConfidenceInterval = false;
            let predictedUpperBound = [];
            let predictedLowerBound = [];
            
            if (predictionsData.predictions.some(p => p.ctr_upper !== undefined || p.ctr_lower !== undefined)) {
                hasConfidenceInterval = true;
                predictedUpperBound = predictionsData.predictions.map(d => d.ctr_upper !== undefined ? d.ctr_upper : (d.ctr !== undefined ? d.ctr * 1.1 : 0));
                predictedLowerBound = predictionsData.predictions.map(d => d.ctr_lower !== undefined ? d.ctr_lower : (d.ctr !== undefined ? d.ctr * 0.9 : 0));
            } else {
                // Симуляция, если интервал не предоставлен
                predictedUpperBound = predictedCTR.map(val => val * 1.1);
                predictedLowerBound = predictedCTR.map(val => val * 0.9);
            }

            // --- Подготовка данных для Plotly ---
            const plotlyData = [
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
                }
            ];

            // Добавляем доверительный интервал, если он есть или симулирован
            if (hasConfidenceInterval || predictedUpperBound.length > 0) {
                plotlyData.push({
                    x: [...predictedDates, ...predictedDates.slice().reverse()],
                    y: [...predictedUpperBound, ...predictedLowerBound.slice().reverse()],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Доверительный интервал',
                    line: { width: 0 },
                    fill: 'toself',
                    fillcolor: 'rgba(16, 185, 129, 0.2)',
                    hovertemplate: '%{x|%d.%m.%Y}<br>Верхняя граница: %{y:.2%}<br>Нижняя граница: %{y:.2%}<extra>Доверительный интервал</extra>'
                });
            }

            const layout = {
                title: {
                    text: 'CTR: История и Предсказания',
                    font: { size: 18, color: '#1f2937' }
                },
                showlegend: true,
                hovermode: 'x unified',
                template: 'plotly_white',
                margin: { t: 60, l: 70, r: 30, b: 100 },
                xaxis: {
                    title: { text: 'Дата', font: { size: 14 } },
                    type: 'date',
                    gridcolor: '#f3f4f6'
                },
                yaxis: {
                    title: { text: 'Click-Through Rate (CTR)', font: { size: 14 } },
                    tickformat: '.2%', // Формат в процентах
                    gridcolor: '#f3f4f6',
                    rangemode: 'tozero'
                },
                legend: {
                    orientation: 'h',
                    y: -0.3,
                    x: 0.5,
                    xanchor: 'center',
                    font: { size: 12 }
                },
                plot_bgcolor: 'white',
                paper_bgcolor: 'white'
            };

            // --- Отрисовка графика ---
            await Plotly.newPlot(elementId, plotlyData, layout);
            console.log(`График CTR (${elementId}) успешно создан.`);

            // Сохраняем конфигурацию для полноэкранного режима
            window.mlChartConfigs = window.mlChartConfigs || {};
            window.mlChartConfigs[elementId] = { data: plotlyData, layout: layout };

        } catch (error) {
            console.error(`Ошибка при создании графика CTR (${elementId}):`, error);
            element.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">Ошибка загрузки графика CTR: ${error.message}</div>`;
        }
    }

    /**
     * Создание графика Расходов (История и Предсказания).
     * @param {Array} historicalData - Исторические данные.
     * @param {Array} predictionsData - Данные предсказаний.
     */
    async createSpendPredictionChart(historicalData, predictionsData) {
        const elementId = 'spend-prediction-chart';
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Элемент с ID ${elementId} не найден для графика Расходов.`);
            return;
        }

        try {
             // Проверяем, есть ли данные
            if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
                throw new Error("Нет исторических данных для графика Расходов.");
            }
            if (!predictionsData || !Array.isArray(predictionsData.predictions) || predictionsData.predictions.length === 0) {
                 throw new Error("Нет данных предсказаний для графика Расходов.");
            }

            // --- Подготовка данных ---
            // Исторические данные
            const historicalDates = historicalData.map(d => new Date(d.date));
            const historicalSpend = historicalData.map(d => d.spend !== undefined ? d.spend : 0);

            // Предсказанные данные
            const predictedDates = predictionsData.predictions.map(d => new Date(d.date));
            const predictedSpend = predictionsData.predictions.map(d => d.spend !== undefined ? d.spend : 0);
            
            // Доверительный интервал (если есть в данных)
            let hasConfidenceInterval = false;
            let predictedUpperBound = [];
            let predictedLowerBound = [];
            
            if (predictionsData.predictions.some(p => p.spend_upper !== undefined || p.spend_lower !== undefined)) {
                hasConfidenceInterval = true;
                predictedUpperBound = predictionsData.predictions.map(d => d.spend_upper !== undefined ? d.spend_upper : (d.spend !== undefined ? d.spend * 1.15 : 0));
                predictedLowerBound = predictionsData.predictions.map(d => d.spend_lower !== undefined ? d.spend_lower : (d.spend !== undefined ? d.spend * 0.85 : 0));
            } else {
                // Симуляция, если интервал не предоставлен
                predictedUpperBound = predictedSpend.map(val => val * 1.15);
                predictedLowerBound = predictedSpend.map(val => val * 0.85);
            }

            // --- Подготовка данных для Plotly ---
            const plotlyData = [
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
                }
            ];

            // Добавляем доверительный интервал, если он есть или симулирован
            if (hasConfidenceInterval || predictedUpperBound.length > 0) {
                plotlyData.push({
                    x: [...predictedDates, ...predictedDates.slice().reverse()],
                    y: [...predictedUpperBound, ...predictedLowerBound.slice().reverse()],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Доверительный интервал',
                    line: { width: 0 },
                    fill: 'toself',
                    fillcolor: 'rgba(249, 115, 22, 0.2)',
                    hovertemplate: '%{x|%d.%m.%Y}<br>Верхняя граница: %{y:,.0f} ₽<br>Нижняя граница: %{y:,.0f} ₽<extra>Доверительный интервал</extra>'
                });
            }

            const layout = {
                title: {
                    text: 'Расходы: История и Предсказания',
                    font: { size: 18, color: '#1f2937' }
                },
                showlegend: true,
                hovermode: 'x unified',
                template: 'plotly_white',
                margin: { t: 60, l: 70, r: 30, b: 100 },
                xaxis: {
                    title: { text: 'Дата', font: { size: 14 } },
                    type: 'date',
                    gridcolor: '#f3f4f6'
                },
                yaxis: {
                    title: { text: 'Расходы (₽)', font: { size: 14 } },
                    tickformat: ',.0f', // Формат с разделителями тысяч
                    separatethousands: true,
                    gridcolor: '#f3f4f6'
                },
                legend: {
                    orientation: 'h',
                    y: -0.3,
                    x: 0.5,
                    xanchor: 'center',
                    font: { size: 12 }
                },
                plot_bgcolor: 'white',
                paper_bgcolor: 'white'
            };

            // --- Отрисовка графика ---
            await Plotly.newPlot(elementId, plotlyData, layout);
            console.log(`График Расходов (${elementId}) успешно создан.`);

            // Сохраняем конфигурацию для полноэкранного режима
            window.mlChartConfigs = window.mlChartConfigs || {};
            window.mlChartConfigs[elementId] = { data: plotlyData, layout: layout };

        } catch (error) {
            console.error(`Ошибка при создании графика Расходов (${elementId}):`, error);
            element.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">Ошибка загрузки графика Расходов: ${error.message}</div>`;
        }
    }

    /**
     * Создание графика Важности признаков.
     * @param {Object} featureImportanceData - Данные о важности признаков.
     */
    async createFeatureImportanceChart(featureImportanceData) {
        const elementId = 'feature-importance-chart';
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Элемент с ID ${elementId} не найден для графика Важности признаков.`);
            return;
        }

        try {
            // Проверяем, есть ли данные
            if (!featureImportanceData || typeof featureImportanceData !== 'object') {
                 throw new Error("Нет данных о важности признаков.");
            }

            // --- Подготовка данных ---
            // Преобразуем объект в массив и сортируем по убыванию важности
            const featuresArray = Object.entries(featureImportanceData)
                .map(([feature, importance]) => ({
                    feature: feature,
                    importance: parseFloat(importance) || 0
                }))
                .sort((a, b) => b.importance - a.importance);

            const featureNames = featuresArray.map(item => item.feature);
            const importanceValues = featuresArray.map(item => item.importance);

            // --- Подготовка данных для Plotly ---
            const plotlyData = [{
                x: importanceValues,
                y: featureNames,
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: '#3b82f6' // Синий
                },
                text: importanceValues.map(v => (v * 100).toFixed(1) + '%'),
                textposition: 'auto'
            }];

            const layout = {
                title: {
                    text: 'Важность признаков в модели',
                    font: { size: 18, color: '#1f2937' }
                },
                xaxis: {
                    title: { text: 'Важность', font: { size: 14 } },
                    tickformat: '.1%', // Формат в процентах
                    gridcolor: '#f3f4f6'
                },
                yaxis: {
                    title: { text: 'Признаки', font: { size: 14 } },
                    automargin: true,
                    gridcolor: 'rgba(0,0,0,0)' // Нет сетки по Y для гистограмм
                },
                margin: { l: 150, r: 30, t: 60, b: 60 }, // Больше места слева для названий признаков
                plot_bgcolor: 'white',
                paper_bgcolor: 'white'
            };

            // --- Отрисовка графика ---
            await Plotly.newPlot(elementId, plotlyData, layout);
            console.log(`График Важности признаков (${elementId}) успешно создан.`);

            // Сохраняем конфигурацию для полноэкранного режима
            window.mlChartConfigs = window.mlChartConfigs || {};
            window.mlChartConfigs[elementId] = { data: plotlyData, layout: layout };

        } catch (error) {
            console.error(`Ошибка при создании графика Важности признаков (${elementId}):`, error);
            element.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">Ошибка загрузки графика Важности признаков: ${error.message}</div>`;
        }
    }

    /**
     * Создание графиков процесса обучения и точности из training_charts.json.
     * Предполагается, что файл содержит готовые данные Plotly.
     */
    async createTrainingChartsFromJSON() {
        try {
            const trainingData = await this.loadJSONData('./api/data/training_charts.json');
            if (!trainingData) {
                console.warn("Файл training_charts.json не найден или пуст.");
                // Можно создать симулированные графики здесь, если файл отсутствует
                // await this.createSimulatedTrainingCharts();
                return;
            }

            // --- График процесса обучения ---
            if (trainingData.training_progress && document.getElementById('training-progress-chart')) {
                const progressData = trainingData.training_progress.data;
                const progressLayout = trainingData.training_progress.layout || {
                    title: 'Процесс обучения модели',
                    showlegend: true,
                    hovermode: 'x unified',
                    template: 'plotly_white',
                    xaxis: { title: 'Эпоха' },
                    yaxis: { title: 'Значение функции потерь (Loss)', type: 'log' },
                    legend: { orientation: 'h', y: -0.2 }
                };
                await Plotly.newPlot('training-progress-chart', progressData, progressLayout);
                console.log('График процесса обучения создан из JSON.');
                
                // Сохраняем конфигурацию
                window.mlChartConfigs = window.mlChartConfigs || {};
                window.mlChartConfigs['training-progress-chart'] = { data: progressData, layout: progressLayout };
            }

            // --- График точности ---
            if (trainingData.accuracy && document.getElementById('accuracy-chart')) {
                const accuracyData = trainingData.accuracy.data;
                const accuracyLayout = trainingData.accuracy.layout || {
                    title: 'Точность предсказаний (MAE)',
                    showlegend: true,
                    hovermode: 'x unified',
                    template: 'plotly_white',
                    xaxis: { title: 'Эпоха' },
                    yaxis: { title: 'Средняя абсолютная ошибка (MAE)' },
                    legend: { orientation: 'h', y: -0.2 }
                };
                await Plotly.newPlot('accuracy-chart', accuracyData, accuracyLayout);
                console.log('График точности создан из JSON.');
                
                // Сохраняем конфигурацию
                window.mlChartConfigs = window.mlChartConfigs || {};
                window.mlChartConfigs['accuracy-chart'] = { data: accuracyData, layout: accuracyLayout };
            }

        } catch (error) {
            console.error('Ошибка при создании графиков обучения из JSON:', error);
            // При ошибке можно создать симулированные графики
            // await this.createSimulatedTrainingCharts();
        }
    }

    /**
     * (Опционально) Создание симулированных графиков обучения, если JSON недоступен.
     * Можно реализовать позже, если нужно.
     */
    // async createSimulatedTrainingCharts() { ... }

    /**
     * Создание всех ML-графиков.
     * Эта функция координирует загрузку данных и отрисовку графиков.
     */
    async createAllMLCharts() {
        console.log("Начало создания всех ML-графиков...");

        try {
            // 1. Загружаем исторические данные (необходимы для всех графиков с предсказаниями)
            const historicalData = await this.loadHistoricalData();
            if (!historicalData) {
                console.warn("Невозможно создать графики: нет исторических данных.");
                // Можно показать сообщение в UI
                return;
            }

            // 2. Получаем предсказания от API
            const predictionsData = await this.fetchPredictions(historicalData, 14); // Предсказания на 14 дней
            if (!predictionsData) {
                console.warn("Невозможно создать графики предсказаний: нет данных от API.");
                // Можно показать сообщение в UI
            }

            // 3. Получаем статистику модели (для графика важности признаков)
            const modelStats = await this.fetchModelStats();
            if (!modelStats) {
                console.warn("Невозможно создать график важности признаков: нет статистики модели.");
                // Можно показать сообщение в UI
            }

            // 4. Создаем графики
            // Графики предсказаний (требуют исторические данные и предсказания)
            if (predictionsData) {
                await this.createCTRPredictionChart(historicalData, predictionsData);
                await this.createSpendPredictionChart(historicalData, predictionsData);
            } else {
                // Если предсказаний нет, можно очистить контейнеры или показать сообщение
                ['ctr-prediction-chart', 'spend-prediction-chart'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">Нет данных для отображения</div>`;
                });
            }

            // График важности признаков (требует статистику модели)
            if (modelStats && modelStats.feature_importance) {
                await this.createFeatureImportanceChart(modelStats.feature_importance);
            } else {
                const el = document.getElementById('feature-importance-chart');
                if (el) el.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">Нет данных о важности признаков</div>`;
            }

            // Графики обучения (из JSON файла)
            await this.createTrainingChartsFromJSON();

            console.log("Все ML-графики созданы (или попытались создать).");

        } catch (error) {
            console.error("Критическая ошибка при создании ML-графиков:", error);
            // showError('Критическая ошибка при создании графиков: ' + error.message);
        }
    }
}

// --- Инициализация и запуск ---
document.addEventListener('DOMContentLoaded', async function () {
    console.log("DOM загружен, инициализация ML-графиков...");

    // Создаем экземпляр класса
    const mlCharts = new MLCharts();

    // Создаем графики
    await mlCharts.createAllMLCharts();

    // --- Обработчик для кнопки обновления ML-графиков ---
    const refreshBtn = document.getElementById('refresh-ml-charts');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function () {
            console.log('Обновление ML-графиков...');
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновление...';
            
            await mlCharts.createAllMLCharts();
            
            this.innerHTML = originalHTML;
            console.log('Обновление ML-графиков завершено.');
        });
    } else {
        console.warn("Кнопка обновления ML-графиков (#refresh-ml-charts) не найдена.");
    }
// Пример вызова из js/ml_charts.js
async function fetchTrainingCharts() {
    try {
        console.log("Запрос данных графиков обучения у API...");
        const response = await fetch('http://localhost:5000/api/training-charts');
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const chartsData = await response.json();
        console.log("Данные графиков обучения получены:", chartsData);
        
        // Отображаем графики
        if (chartsData.feature_importance) {
            await Plotly.newPlot('feature-importance-chart', 
                                chartsData.feature_importance.data, 
                                chartsData.feature_importance.layout);
        }
        if (chartsData.prediction_mae) {
            await Plotly.newPlot('accuracy-chart', 
                                chartsData.prediction_mae.data, 
                                chartsData.prediction_mae.layout);
        }
        if (chartsData.training_loss) {
            await Plotly.newPlot('training-progress-chart', 
                                chartsData.training_loss.data, 
                                chartsData.training_loss.layout);
        }
        
        return chartsData;
    } catch (error) {
        console.error('Ошибка при получении данных графиков:', error);
        // Показать сообщение об ошибке пользователю или использовать симуляции
        return null;
    }
}
    // --- Обработчик для полноэкранного режима ---
    // Предполагается, что у вас есть глобальная функция openFullscreenChart
    // из dashboard.js или другого файла. Если нет, вот базовая реализация:
    /*
    document.querySelectorAll('[data-chart]').forEach(button => {
        button.addEventListener('click', function() {
            const chartId = this.getAttribute('data-chart');
            if (typeof openFullscreenChart === 'function') {
                openFullscreenChart(chartId);
            } else {
                console.warn(`Функция openFullscreenChart не найдена для графика ${chartId}`);
                // Альтернативная реализация или сообщение об ошибке
            }
        });
    });
    */
});