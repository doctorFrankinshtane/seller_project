// Глобальные переменные
let currentPeriod = 'month';

// Обновление всех данных
function updateAllData(period) {
    currentPeriod = period;

    // Обновляем время
    updateTimestamps();

    // Генерируем новые данные
    const dates = generateDates(period);
    const data = generateMetricsData(period, dates);

    // Обновляем UI
    updateStatCards(data);
    createCharts(data);

    // Обновляем ML-графики
    if (typeof createMLCharts === 'function') {
        createMLCharts();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM загружен, инициализация...');

    // Установка обработчиков событий для кнопок периодов
    // (Предполагается, что они есть в HTML)
    // document.querySelectorAll('.time-filter').forEach(button => {
    //     button.addEventListener('click', function (e) {
    //         // ... логика переключения периодов
    //     });
    // });

    // Инициализация с данными за месяц
    console.log('Инициализация данных за месяц...');
    updateAllData('month');
    console.log('Инициализация завершена');

    // Обработчик для кнопки обновления ML-графиков
    const refreshMLBtn = document.getElementById('refresh-ml-charts');
    if (refreshMLBtn) {
        refreshMLBtn.addEventListener('click', function () {
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновление...';
            if (typeof createMLCharts === 'function') {
                setTimeout(() => {
                    createMLCharts();
                    this.innerHTML = originalHTML;
                }, 1500);
            } else {
                this.innerHTML = originalHTML;
            }
        });
    }

    // Обработчик для кнопки обучения модели
    const trainModelBtns = document.querySelectorAll('.btn .fa-brain').closest('.btn');
    trainModelBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            alert('В демонстрационной версии обучение модели симулируется. В реальной системе здесь будет запущен процесс обучения ML-модели.');
        });
    });
});

// Обновление статистических карточек
function updateStatCards(data) {
    // ROI
    const currentRoi = parseFloat(data.wb.roi[data.wb.roi.length - 1] || 0);
    const previousRoi = data.wb.roi.length > 1 ? parseFloat(data.wb.roi[data.wb.roi.length - 2] || 0) : currentRoi;
    const roiChange = currentRoi - previousRoi;

    document.getElementById('roi-value').textContent = currentRoi.toFixed(2);
    document.getElementById('roi-trend').textContent = `${roiChange >= 0 ? '↑ +' : '↓ '}${Math.abs(roiChange).toFixed(2)}`;
    document.getElementById('roi-trend').className = `trend ${roiChange >= 0 ? 'up' : 'down'}`;

    // Расходы
    const totalSpend = data.wb.spend.reduce((sum, val) => sum + val, 0) +
        data.ozon.spend.reduce((sum, val) => sum + val, 0);
    const spendChange = data.dates.length > 1 ?
        ((data.wb.spend[data.wb.spend.length - 1] + data.ozon.spend[data.ozon.spend.length - 1]) -
            (data.wb.spend[data.wb.spend.length - 2] + data.ozon.spend[data.ozon.spend.length - 2])) /
        (data.wb.spend[data.wb.spend.length - 2] + data.ozon.spend[data.ozon.spend.length - 2]) * 100 : 0;

    document.getElementById('spend-value').textContent = `${Math.round(totalSpend).toLocaleString('ru-RU')} ₽`;
    document.getElementById('spend-trend').textContent = `${spendChange >= 0 ? '↑ +' : '↓ '}${Math.abs(spendChange).toFixed(1)}%`;
    document.getElementById('spend-trend').className = `trend ${spendChange >= 0 ? 'up' : 'down'}`;

    // Конверсия
    const avgCr = (data.wb.cr[data.wb.cr.length - 1] + data.ozon.cr[data.ozon.cr.length - 1]) / 2;
    const prevAvgCr = data.wb.cr.length > 1 ?
        (data.wb.cr[data.wb.cr.length - 2] + data.ozon.cr[data.ozon.cr.length - 2]) / 2 : avgCr;
    const crChange = prevAvgCr !== 0 ? ((avgCr - prevAvgCr) / prevAvgCr) * 100 : 0;

    document.getElementById('conversion-value').textContent = `${(avgCr * 100).toFixed(2)}%`;
    document.getElementById('conversion-trend').textContent = `${crChange >= 0 ? '↑ +' : '↓ '}${Math.abs(crChange).toFixed(1)}%`;
    document.getElementById('conversion-trend').className = `trend ${crChange >= 0 ? 'up' : 'down'}`;

    // CPC
    const avgCpc = (data.wb.cpc[data.wb.cpc.length - 1] + data.ozon.cpc[data.ozon.cpc.length - 1]) / 2;
    const prevAvgCpc = data.wb.cpc.length > 1 ?
        (data.wb.cpc[data.wb.cpc.length - 2] + data.ozon.cpc[data.ozon.cpc.length - 2]) / 2 : avgCpc;
    const cpcChange = prevAvgCpc !== 0 ? ((avgCpc - prevAvgCpc) / prevAvgCpc) * 100 : 0;

    document.getElementById('cpc-value').textContent = `${avgCpc.toFixed(2)} ₽`;
    document.getElementById('cpc-trend').textContent = `${cpcChange >= 0 ? '↑ +' : '↓ '}${Math.abs(cpcChange).toFixed(1)}%`;
    document.getElementById('cpc-trend').className = `trend ${cpcChange >= 0 ? 'up' : 'down'}`;

    // Прибыль
    const totalProfit = data.wb.profit.reduce((sum, val) => sum + val, 0) +
        data.ozon.profit.reduce((sum, val) => sum + val, 0);
    const profitChange = data.dates.length > 1 ?
        ((data.wb.profit[data.wb.profit.length - 1] + data.ozon.profit[data.ozon.profit.length - 1]) -
            (data.wb.profit[data.wb.profit.length - 2] + data.ozon.profit[data.ozon.profit.length - 2])) /
        Math.abs(data.wb.profit[data.wb.profit.length - 2] + data.ozon.profit[data.ozon.profit.length - 2]) * 100 : 0;

    document.getElementById('profit-value').textContent = `${Math.round(totalProfit).toLocaleString('ru-RU')} ₽`;
    document.getElementById('profit-trend').textContent = `${profitChange >= 0 ? '↑ +' : '↓ '}${Math.abs(profitChange).toFixed(1)}%`;
    document.getElementById('profit-trend').className = `trend ${profitChange >= 0 ? 'up' : 'down'}`;
}

// Обновление времени
function updateTimestamps() {
    const now = new Date();
    const updateTime = now.toLocaleDateString('ru-RU') + ', ' +
        now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    // Предполагается, что эти элементы есть в HTML
    const lastUpdateElements = document.querySelectorAll('#last-update, #footer-update');
    lastUpdateElements.forEach(el => {
        if (el) el.textContent = updateTime;
    });
}

// Создание графиков
function createCharts(data) {
    // 1. CTR и Conversion Rate
    const ctrCrChart = {
        data:
            [
                {
                    x: data.dates,
                    y: data.wb.ctr,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'CTR Wildberries',
                    line: { color: '#2563eb', width: 3 },
                    marker: { size: 6 }
                },
                {
                    x: data.dates,
                    y: data.wb.cr,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'CR Wildberries',
                    line: { color: '#10b981', width: 3 },
                    marker: { size: 6 }
                },
                {
                    x: data.dates,
                    y: data.ozon.ctr,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'CTR Ozon',
                    line: { color: '#8b5cf6', width: 3, dash: 'dash' },
                    marker: { size: 6 }
                },
                {
                    x: data.dates,
                    y: data.ozon.cr,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'CR Ozon',
                    line: { color: '#f59e0b', width: 3, dash: 'dash' },
                    marker: { size: 6 }
                }
            ],
        layout: {
            title: '',
            showlegend: true,
            hovermode: 'x unified',
            template: 'plotly_white',
            margin: { t: 30, l: 60, r: 30, b: 60 },
            xaxis: { title: 'Дата' },
            yaxis: { title: 'Проценты', tickformat: '.1%' },
            legend: { orientation: 'h', y: -0.2 }
        }
    };

    // 2. Расходы и Выручка
    const spendRevenueChart = {
        data:
            [
                {
                    x: data.dates,
                    y: data.wb.spend,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Расходы Wildberries',
                    line: { color: '#dc2626', width: 3 },
                    marker: { size: 6 }
                },
                {
                    x: data.dates,
                    y: data.wb.revenue,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Выручка Wildberries',
                    line: { color: '#2563eb', width: 3 },
                    marker: { size: 6 }
                },
                {
                    x: data.dates,
                    y: data.ozon.spend,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Расходы Ozon',
                    line: { color: '#ef4444', width: 3, dash: 'dash' },
                    marker: { size: 6 }
                },
                {
                    x: data.dates,
                    y: data.ozon.revenue,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Выручка Ozon',
                    line: { color: '#3b82f6', width: 3, dash: 'dash' },
                    marker: { size: 6 }
                }
            ],
        layout: {
            title: '',
            showlegend: true,
            hovermode: 'x unified',
            template: 'plotly_white',
            margin: { t: 30, l: 60, r: 30, b: 60 },
            xaxis: { title: 'Дата' },
            yaxis: { title: 'Рубли (₽)', tickformat: ',.0f' },
            legend: { orientation: 'h', y: -0.2 }
        }
    };

    // 3. ROI и ROAS
    const roiChart = {
        data:
            [
                {
                    x: data.dates,
                    y: data.wb.roi,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'ROI Wildberries',
                    line: { color: '#10b981', width: 3 },
                    marker: { size: 6 }
                },
                {
                    x: data.dates,
                    y: data.ozon.roi,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'ROI Ozon',
                    line: { color: '#8b5cf6', width: 3, dash: 'dash' },
                    marker: { size: 6 }
                }
            ],
        layout: {
            title: '',
            showlegend: true,
            hovermode: 'x unified',
            template: 'plotly_white',
            margin: { t: 30, l: 60, r: 30, b: 60 },
            xaxis: { title: 'Дата' },
            yaxis: { title: 'Коэффициент' },
            legend: { orientation: 'h', y: -0.2 }
        }
    };

    // 4. Прибыль по категориям
    const profitCategories = ['Смартфоны', 'Планшеты', 'Ноутбуки', 'Аксессуары', 'ТВ и аудио'];
    const profitValues = [125000, 89000, 67000, 45000, 37000];

    const profitChart = {
        data:
            [{
                x: profitCategories,
                y: profitValues,
                type: 'bar',
                name: 'Прибыль',
                marker: {
                    color: ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#dc2626']
                }
            }],
        layout: {
            title: '',
            showlegend: false,
            template: 'plotly_white',
            margin: { t: 30, l: 60, r: 30, b: 60 },
            xaxis: { title: 'Категории' },
            yaxis: { title: 'Прибыль (₽)', tickformat: ',.0f' }
        }
    };

    // Рендеринг графиков
    Plotly.newPlot('ctr-cr-chart', ctrCrChart.data, ctrCrChart.layout);
    Plotly.newPlot('spend-revenue-chart', spendRevenueChart.data, spendRevenueChart.layout);
    Plotly.newPlot('roi-chart', roiChart.data, roiChart.layout);
    Plotly.newPlot('profit-chart', profitChart.data, profitChart.layout);

    // Сохраняем данные для последующего использования
    window.chartsData = data;
}

// Генерация дат
function generateDates(period) {
    const dates = [];
    const now = new Date();

    switch (period) {
        case 'week':
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(now.getDate() - i);
                dates.push(date);
            }
            break;
        case 'month':
            for (let i = 29; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(now.getDate() - i);
                dates.push(date);
            }
            break;
        case 'quarter':
            for (let i = 89; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(now.getDate() - i);
                dates.push(date);
            }
            break;
    }

    return dates;
}

// Генерация метрик
function generateMetricsData(period, dates) {
    const wb = {
        ctr: dates.map(() => 0.02 + Math.random() * 0.03),
        cr: dates.map(() => 0.01 + Math.random() * 0.02),
        spend: dates.map(() => 50000 + Math.random() * 100000),
        revenue: dates.map(() => 100000 + Math.random() * 200000),
        cpc: dates.map(() => 50 + Math.random() * 100),
        roi: dates.map(() => 1.0 + Math.random() * 2.0),
        profit: dates.map(() => 30000 + Math.random() * 150000)
    };

    const ozon = {
        ctr: dates.map(() => 0.01 + Math.random() * 0.02),
        cr: dates.map(() => 0.005 + Math.random() * 0.015),
        spend: dates.map(() => 30000 + Math.random() * 80000),
        revenue: dates.map(() => 80000 + Math.random() * 150000),
        cpc: dates.map(() => 40 + Math.random() * 80),
        roi: dates.map(() => 0.8 + Math.random() * 1.5),
        profit: dates.map(() => 20000 + Math.random() * 100000)
    };

    return { dates, wb, ozon };
}

// Адаптивность графиков
function resizeCharts() {
    const charts = ['ctr-cr-chart', 'spend-revenue-chart', 'roi-chart', 'profit-chart'];
    charts.forEach(chartId => {
        try {
            Plotly.Plots.resize(chartId);
        } catch (e) {
            console.log('Ошибка при ресайзе:', chartId);
        }
    });

    // Также ресайзим ML-графики, если они есть
    const mlCharts = ['training-progress-chart', 'accuracy-chart', 'ctr-prediction-chart', 'spend-prediction-chart', 'feature-importance-chart'];
    mlCharts.forEach(chartId => {
        if (document.getElementById(chartId)) {
            try {
                Plotly.Plots.resize(chartId);
            } catch (e) {
                console.log('Ошибка при ресайзе ML-графика:', chartId);
            }
        }
    });
}

// Добавьте в существующий DOMContentLoaded обработчик:
document.addEventListener('DOMContentLoaded', function () {
    // ... ваши существующие обработчики ...

    // Обработчик для кнопки обновления уведомлений (если есть)
    const refreshAlertsBtn = document.getElementById('refresh-alerts');
    if (refreshAlertsBtn) {
        refreshAlertsBtn.addEventListener('click', function () {
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновление...';
            setTimeout(() => {
                this.innerHTML = originalHTML;
            }, 1500);
        });
    }

    // Адаптивность
    window.addEventListener('resize', function () {
        resizeCharts();
    });
});

function formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы с 0
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

/**
 * Форматирует объект Date в строку вида "YYYY-MM-DD"
 * @param {Date} date - Объект даты
 * @returns {string} - Отформатированная строка даты
 */
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы с 0
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
}

/**
 * Форматирует объект Date в строку вида "D MMMM YYYY, HH:MM" (для примера)
 * @param {Date} date - Объект даты
 * @returns {string} - Отформатированная строка даты
 */
function formatLongDateTime(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    // Используем локаль ru-RU для русского языка
    return date.toLocaleDateString('ru-RU', options);
}

// --- Заполнение дат при загрузке страницы ---
document.addEventListener('DOMContentLoaded', function () {
    const now = new Date(); // Текущая дата и время

    // 1. Обновление заголовка дашборда
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = formatDateTime(now);
    }

    // 2. Обновление футера (если есть)
    const footerUpdateElements = document.querySelectorAll('#footer-update'); // Предполагаемый ID
    footerUpdateElements.forEach(el => {
        if (el) el.textContent = formatDateTime(now);
    });

    // 3. Обновление дат в отчетах
    // Для примера: "Создан: 30.10.2023, 09:15" - предположим, это недельная давность
    const reportCreated1Element = document.querySelector('[data-dynamic="report-created-1"]');
    if (reportCreated1Element) {
        const reportCreated1Date = new Date(now);
        reportCreated1Date.setDate(now.getDate() - 7); // 7 дней назад
        reportCreated1Element.textContent = formatDateTime(reportCreated1Date);
    }

    // Для примера: "Последняя попытка: 14.03.2024, 16:45" - предположим, это вчера
    const lastAttemptElement = document.querySelector('[data-dynamic="last-attempt"]');
    if (lastAttemptElement) {
        const lastAttemptDate = new Date(now);
        lastAttemptDate.setDate(now.getDate() - 1); // 1 день назад
        lastAttemptElement.textContent = formatDateTime(lastAttemptDate);
    }

    // 4. Обновление дат в ML-моделях (статус)
    // Для примера: "Последнее обучение: 2023-10-26 14:30" - предположим, это 2 дня назад
    const lastTrainingElements = document.querySelectorAll('[data-dynamic="last-training"]'); // Предполагаемый атрибут
    lastTrainingElements.forEach(el => {
        if (el) {
            const lastTrainingDate = new Date(now);
            lastTrainingDate.setDate(now.getDate() - 2); // 2 дня назад
            // Формат может отличаться, например, без секунд
            const formattedDate = `${formatDate(lastTrainingDate)} ${String(lastTrainingDate.getHours()).padStart(2, '0')}:${String(lastTrainingDate.getMinutes()).padStart(2, '0')}`;
            el.textContent = formattedDate;
        }
    });

    // 5. Обновление периодов в отчетах (примеры)
    // "Период: 2023-10-23 - 2023-10-29" - предположим, это последняя неделя
    const reportPeriod1Elements = document.querySelectorAll('[data-dynamic="report-period-1"]'); // Предполагаемый атрибут
    reportPeriod1Elements.forEach(el => {
        if (el) {
            const endDate = new Date(now);
            endDate.setDate(now.getDate() - 1); // Вчера - конец периода
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6); // 7 дней назад - начало периода
            el.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        }
    });

    // "Период: 2023-10-16 - 2023-10-22" - предположим, это неделя до последней
    const reportPeriod2Elements = document.querySelectorAll('[data-dynamic="report-period-2"]'); // Предполагаемый атрибут
    reportPeriod2Elements.forEach(el => {
        if (el) {
            const endDate = new Date(now);
            endDate.setDate(now.getDate() - 8); // 8 дней назад - конец предыдущего периода
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6); // Еще 7 дней назад - начало
            el.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        }
    });

    // "Период: 2023-09-01 - 2023-09-30" - для ошибочного отчета, можно оставить статичным или сделать предыдущий месяц
    // const errorReportPeriodElements = document.querySelectorAll('[data-dynamic="error-report-period"]');
    // errorReportPeriodElements.forEach(el => {
    //     if (el) {
    //         const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Первый день прошлого месяца
    //         const endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Последний день прошлого месяца
    //         el.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    //     }
    // });

    // 6. Обновление дат в моделях (примеры)
    // "Последний запуск: 01.11.2023, 10:00" - предположим, это сегодня утром
    const lastRunElements = document.querySelectorAll('[data-dynamic="last-run"]'); // Предполагаемый атрибут
    lastRunElements.forEach(el => {
        if (el) {
            const lastRunDate = new Date(now);
            lastRunDate.setHours(10, 0, 0, 0); // Сегодня в 10:00
            el.textContent = formatDateTime(lastRunDate);
        }
    });

    console.log("Динамические даты обновлены");
});

// dashboard.js

/**
 * Форматирует объект Date в строку вида "YYYY-MM-DD"
 * @param {Date} date - Объект даты
 * @returns {string} - Отформатированная строка даты
 */
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы с 0
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
}

/**
 * Форматирует объект Date в строку вида "D MMMM YYYY, HH:MM" (для примера)
 * @param {Date} date - Объект даты
 * @returns {string} - Отформатированная строка даты
 */
function formatLongDateTime(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    // Используем локаль ru-RU для русского языка
    return date.toLocaleDateString('ru-RU', options);
}

// --- Заполнение динамических данных при загрузке страницы ---
document.addEventListener('DOMContentLoaded', function () {
    const now = new Date();

    // 1. Обновление даты последнего обновления (например, "Последнее обновление: 2023-10-30 14:30")
    const lastUpdateElements = document.querySelectorAll('[data-dynamic="last-update"]');
    lastUpdateElements.forEach(el => {
        if (el) {
            const formattedDate = `${formatDate(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            el.textContent = formattedDate;
        }
    });

    // 2. Обновление даты последнего анализа (например, "Последний анализ: 2023-10-29 09:15")
    const lastAnalysisElements = document.querySelectorAll('[data-dynamic="last-analysis"]');
    lastAnalysisElements.forEach(el => {
        if (el) {
            const lastAnalysisDate = new Date(now);
            lastAnalysisDate.setDate(now.getDate() - 1); // Вчера
            lastAnalysisDate.setHours(9, 15, 0, 0); // 09:15
            const formattedDate = `${formatDate(lastAnalysisDate)} ${String(lastAnalysisDate.getHours()).padStart(2, '0')}:${String(lastAnalysisDate.getMinutes()).padStart(2, '0')}`;
            el.textContent = formattedDate;
        }
    });

    // 3. Обновление даты последнего отчета (например, "Последний отчет: 2023-10-27 16:45")
    const lastReportElements = document.querySelectorAll('[data-dynamic="last-report"]');
    lastReportElements.forEach(el => {
        if (el) {
            const lastReportDate = new Date(now);
            lastReportDate.setDate(now.getDate() - 3); // 3 дня назад
            lastReportDate.setHours(16, 45, 0, 0); // 16:45
            const formattedDate = `${formatDate(lastReportDate)} ${String(lastReportDate.getHours()).padStart(2, '0')}:${String(lastReportDate.getMinutes()).padStart(2, '0')}`;
            el.textContent = formattedDate;
        }
    });

    // 4. Обновление даты последнего обучения модели (например, "Последнее обучение: 2023-10-25 11:20")
    // Этот элемент будет обновляться через API, но задаем начальное значение
    const lastTrainingElements = document.querySelectorAll('[data-dynamic="last-training"]');
    lastTrainingElements.forEach(el => {
        if (el) {
            // Пока ставим "Никогда" или дату по умолчанию
            // Реальное значение будет установлено при загрузке статистики модели
            el.textContent = 'Никогда';
        }
    });

    // 5. Обновление периодов в отчетах
    // "Период: 2023-10-23 - 2023-10-29" - предположим, это последняя неделя
    const reportPeriod1Elements = document.querySelectorAll('[data-dynamic="report-period-1"]');
    reportPeriod1Elements.forEach(el => {
        if (el) {
            const endDate = new Date(now);
            endDate.setDate(now.getDate() - 1); // Вчера - конец периода
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6); // Еще 7 дней назад - начало
            el.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        }
    });

    // "Период: 2023-09-01 - 2023-09-30" - для ошибочного отчета
    // Можно оставить статичным или сделать предыдущий месяц
    // const errorReportPeriodElements = document.querySelectorAll('[data-dynamic="error-report-period"]');
    // errorReportPeriodElements.forEach(el => {
    //     if (el) {
    //         const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Первый день прошлого месяца
    //         const endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Последний день прошлого месяца
    //         el.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    //     }
    // });
});

// --- Навигация по страницам ---
document.querySelectorAll('[data-page-toggle]').forEach(button => {
    button.addEventListener('click', function () {
        const targetPage = this.getAttribute('data-page-toggle');

        // Убираем активный класс со всех кнопок и страниц
        document.querySelectorAll('[data-page-toggle]').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('[data-page]').forEach(page => page.classList.remove('active'));

        // Добавляем активный класс к текущей кнопке и странице
        this.classList.add('active');
        document.querySelector(`[data-page="${targetPage}"]`).classList.add('active');
    });
});

// --- Управление модальным окном полноэкранного режима ---
function openFullscreenChart(chartId) {
    const modal = document.getElementById('fullscreen-modal');
    const fullscreenContainer = document.getElementById('fullscreen-chart-container');
    const titleElement = document.getElementById('fullscreen-title');

    // Карта соответствия ID графиков и их названий
    const chartTitles = {
        'ctr-cr-chart': 'CTR и Конверсия',
        'spend-revenue-chart': 'Расходы и Выручка',
        'roi-chart': 'ROI',
        'profit-chart': 'Прибыль по категориям',
        'channel-performance-chart': 'Эффективность каналов',
        'geography-chart': 'Географическое распределение',
        'training-progress-chart': 'Процесс обучения модели',
        'accuracy-chart': 'Точность предсказаний (MAE)',
        'ctr-prediction-chart': 'История и Предсказания CTR',
        'spend-prediction-chart': 'История и Предсказания Расходов',
        'feature-importance-chart': 'Важность признаков в модели'
    };

    titleElement.textContent = chartTitles[chartId] || 'График';

    // Очищаем контейнер
    fullscreenContainer.innerHTML = '';

    // Создаем временный div для рендеринга графика
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '100%';
    tempDiv.style.height = '100%';
    fullscreenContainer.appendChild(tempDiv);

    // Клонируем график в полноэкранный контейнер
    Plotly.react(tempDiv, [], {}).then(() => {
        const originalChart = document.getElementById(chartId);
        if (originalChart && originalChart.data && originalChart.layout) {
            Plotly.react(tempDiv, originalChart.data, originalChart.layout);
        }
    });

    // Показываем модальное окно
    modal.style.display = 'flex';
}

function closeFullscreenChart() {
    const modal = document.getElementById('fullscreen-modal');
    modal.style.display = 'none';
}

// Закрытие модального окна по клику вне его
document.getElementById('fullscreen-modal').addEventListener('click', function (event) {
    if (event.target === this) {
        closeFullscreenChart();
    }
});

// Обработчики для кнопок в модальном окне
document.getElementById('close-fullscreen')?.addEventListener('click', closeFullscreenChart);
document.getElementById('download-fullscreen-chart')?.addEventListener('click', function () {
    const chartId = document.querySelector('#fullscreen-chart-container > div')?.id?.replace('-fullscreen', '');
    if (chartId) {
        Plotly.downloadImage(document.getElementById(chartId), { format: 'png', width: 1200, height: 800, filename: chartId });
    }
});

// --- Переключение видимости боковой панели на мобильных устройствах ---
document.getElementById('sidebar-toggle')?.addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('active');
});
