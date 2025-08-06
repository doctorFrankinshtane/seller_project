// Создание графиков (обновленная версия)
function createCharts(data) {
    console.log('Создание графиков с данными:', data);

    // 1. CTR и Conversion Rate - Обновлено для ясности
    const ctrCrChart = {
        data: [
            {
                x: data.dates,
                y: data.wb.ctr,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'CTR Wildberries',
                line: { color: '#3b82f6', width: 3 }, // Синий для CTR
                marker: { size: 7, symbol: 'circle' },
                hovertemplate: '%{y:.2%}<extra>%{fullData.name}</extra>'
            },
            {
                x: data.dates,
                y: data.wb.cr,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Конверсия Wildberries',
                line: { color: '#10b981', width: 3 }, // Зеленый для CR
                marker: { size: 7, symbol: 'square' },
                hovertemplate: '%{y:.2%}<extra>%{fullData.name}</extra>'
            },
            {
                x: data.dates,
                y: data.ozon.ctr,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'CTR Ozon',
                line: { color: '#60a5fa', width: 2, dash: 'dot' }, // Светло-синий пунктир для Ozon CTR
                marker: { size: 6, symbol: 'circle-open' },
                hovertemplate: '%{y:.2%}<extra>%{fullData.name}</extra>'
            },
            {
                x: data.dates,
                y: data.ozon.cr,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Конверсия Ozon',
                line: { color: '#34d399', width: 2, dash: 'dot' }, // Светло-зеленый пунктир для Ozon CR
                marker: { size: 6, symbol: 'square-open' },
                hovertemplate: '%{y:.2%}<extra>%{fullData.name}</extra>'
            }
        ],
        layout: {
            title: {
                text: 'Click-Through Rate (CTR) и Конверсия (CR)',
                font: { size: 16 }
            },
            showlegend: true,
            hovermode: 'x unified',
            template: 'plotly_white',
            margin: { t: 50, l: 60, r: 30, b: 60 },
            xaxis: {
                title: { text: 'Дата' },
                type: 'date'
            },
            yaxis: {
                title: { text: 'Проценты' },
                tickformat: '.2%', // Более точный формат
                rangemode: 'tozero' // Начинаем ось Y с нуля
            },
            legend: {
                orientation: 'h',
                y: -0.3,
                x: 0.5,
                xanchor: 'center'
            },
            separators: ', ',
            font: { family: 'Arial, sans-serif' }
        }
    };

    // 2. Расходы и Выручка - Улучшена визуализация
    const spendRevenueChart = {
        data: [
            {
                x: data.dates,
                y: data.wb.spend,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Расходы WB',
                line: { color: '#ef4444', width: 3 }, // Красный для расходов
                marker: { size: 7, symbol: 'diamond' },
                fill: 'tozeroy', // Заливка под кривой
                fillcolor: 'rgba(239, 68, 68, 0.1)',
                hovertemplate: '%{y:,.0f} ₽<extra>%{fullData.name}</extra>'
            },
            {
                x: data.dates,
                y: data.wb.revenue,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Выручка WB',
                line: { color: '#3b82f6', width: 3 }, // Синий для выручки
                marker: { size: 7, symbol: 'triangle-up' },
                fill: 'tozeroy',
                fillcolor: 'rgba(59, 130, 246, 0.1)',
                hovertemplate: '%{y:,.0f} ₽<extra>%{fullData.name}</extra>'
            },
            {
                x: data.dates,
                y: data.ozon.spend,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Расходы Ozon',
                line: { color: '#f87171', width: 2, dash: 'dot' }, // Светло-красный пунктир
                marker: { size: 6, symbol: 'diamond-open' },
                hovertemplate: '%{y:,.0f} ₽<extra>%{fullData.name}</extra>'
            },
            {
                x: data.dates,
                y: data.ozon.revenue,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Выручка Ozon',
                line: { color: '#93c5fd', width: 2, dash: 'dot' }, // Светло-синий пунктир
                marker: { size: 6, symbol: 'triangle-up-open' },
                hovertemplate: '%{y:,.0f} ₽<extra>%{fullData.name}</extra>'
            }
        ],
        layout: {
            title: {
                text: 'Расходы на рекламу и Выручка',
                font: { size: 16 }
            },
            showlegend: true,
            hovermode: 'x unified',
            template: 'plotly_white',
            margin: { t: 50, l: 70, r: 30, b: 60 },
            xaxis: {
                title: { text: 'Дата' },
                type: 'date'
            },
            yaxis: {
                title: { text: 'Рубли (₽)' },
                tickformat: ',.0f',
                tickprefix: "₽",
                separatethousands: true
            },
            legend: {
                orientation: 'h',
                y: -0.3,
                x: 0.5,
                xanchor: 'center'
            },
            separators: ', ',
            font: { family: 'Arial, sans-serif' }
        }
    };

    // 3. ROI - Улучшено оформление
    const roiChart = {
        data: [
            {
                x: data.dates,
                y: data.wb.roi,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'ROI Wildberries',
                line: { color: '#8b5cf6', width: 3 }, // Фиолетовый для ROI
                marker: { size: 7, symbol: 'star' },
                hovertemplate: '%{y:.2f}<extra>%{fullData.name}</extra>'
            },
            {
                x: data.dates,
                y: data.ozon.roi,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'ROI Ozon',
                line: { color: '#c4b5fd', width: 2, dash: 'dot' }, // Светло-фиолетовый пунктир
                marker: { size: 6, symbol: 'star-open' },
                hovertemplate: '%{y:.2f}<extra>%{fullData.name}</extra>'
            }
        ],
        layout: {
            title: {
                text: 'Возврат на инвестиции (ROI)',
                font: { size: 16 }
            },
            showlegend: true,
            hovermode: 'x unified',
            template: 'plotly_white',
            margin: { t: 50, l: 60, r: 30, b: 60 },
            xaxis: {
                title: { text: 'Дата' },
                type: 'date'
            },
            yaxis: {
                title: { text: 'Коэффициент ROI' },
                // tickformat: '.2f', // Убираем формат, чтобы показывать как есть
                rangemode: 'tozero'
            },
            legend: {
                orientation: 'h',
                y: -0.3,
                x: 0.5,
                xanchor: 'center'
            },
            separators: ', ',
            font: { family: 'Arial, sans-serif' }
        }
    };

    // 4. Прибыль по категориям - Сделано более красочным
    const profitCategories = ['Смартфоны', 'Планшеты', 'Ноутбуки', 'Аксессуары', 'ТВ и аудио'];
    const profitValues = [125000, 89000, 67000, 45000, 37000];
    // Создаем цветовую палитру на основе значений
    const colors = profitValues.map((val, i) => {
        // Интерполируем между зеленым (высокая прибыль) и желтым (низкая)
        const ratio = val / Math.max(...profitValues);
        const r = Math.floor(255 * (1 - ratio) + 76 * ratio); // 255->76 (Red: красный -> зеленый)
        const g = Math.floor(215 * ratio + 179 * (1 - ratio)); // 215->179 (Green: желтый -> зеленый)
        const b = Math.floor(0 * ratio + 68 * (1 - ratio));   // 0->68 (Blue: желтый -> зеленый)
        return `rgb(${r},${g},${b})`;
    });

    const profitChart = {
        data: [{
            x: profitCategories,
            y: profitValues,
            type: 'bar',
            name: 'Прибыль',
            marker: {
                color: colors,
                line: {
                    color: 'rgb(8, 48, 107)',
                    width: 1.5
                }
            },
            hovertemplate: '%{x}<br>%{y:,.0f} ₽<extra>Прибыль</extra>'
        }],
        layout: {
            title: {
                text: 'Прибыль по категориям товаров',
                font: { size: 16 }
            },
            showlegend: false,
            template: 'plotly_white',
            margin: { t: 50, l: 80, r: 30, b: 100 },
            xaxis: {
                title: { text: 'Категории товаров' },
                tickangle: -45 // Поворот подписей для лучшей читаемости
            },
            yaxis: {
                title: { text: 'Прибыль (₽)' },
                tickformat: ',.0f',
                tickprefix: "₽",
                separatethousands: true
            },
            separators: ', ',
            font: { family: 'Arial, sans-serif' }
        }
    };

    // Рендеринг графиков с обработкой ошибок
    const chartsToRender = [
        { id: 'ctr-cr-chart', data: ctrCrChart.data, layout: ctrCrChart.layout },
        { id: 'spend-revenue-chart', data: spendRevenueChart.data, layout: spendRevenueChart.layout },
        { id: 'roi-chart', data: roiChart.data, layout: roiChart.layout },
        { id: 'profit-chart', data: profitChart.data, layout: profitChart.layout }
    ];

    // Рендеринг графиков с адаптивными настройками
    const chartConfigs = [
        { id: 'ctr-cr-chart', data: ctrCrChart.data, layout: ctrCrChart.layout },
        { id: 'spend-revenue-chart', data: spendRevenueChart.data, layout: spendRevenueChart.layout },
        { id: 'roi-chart', data: roiChart.data, layout: roiChart.layout },
        { id: 'profit-chart', data: profitChart.data, layout: profitChart.layout }
    ];

    chartConfigs.forEach(config => {
        const element = document.getElementById(config.id);
        if (element) {
            // Добавляем адаптивные параметры к layout
            const responsiveLayout = {
                ...config.layout,
                autosize: true, // Автоматический размер
                responsive: true, // Адаптивность
                margin: {
                    t: config.layout.margin?.t || 40,
                    l: config.layout.margin?.l || 60,
                    r: config.layout.margin?.r || 20, // Уменьшаем правый отступ
                    b: config.layout.margin?.b || 60
                }
            };

            Plotly.newPlot(config.id, config.data, responsiveLayout)
                .then(() => {
                    console.log(`График ${config.id} успешно создан`);
                    // Добавляем обработчик изменения размера окна
                    handlePlotlyResize(config.id);
                })
                .catch(err => {
                    console.error(`Ошибка при создании графика ${config.id}:`, err);
                    element.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280; font-size: 1rem;">Ошибка загрузки графика</div>`;
                });
        }
    });

    chartsToRender.forEach(chart => {
        const element = document.getElementById(chart.id);
        if (element) {
            Plotly.newPlot(chart.id, chart.data, chart.layout)
                .then(() => console.log(`График ${chart.id} успешно создан`))
                .catch(err => {
                    console.error(`Ошибка при создании графика ${chart.id}:`, err);
                    element.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280; font-size: 1rem;">Ошибка загрузки графика</div>`;
                });
        } else {
            console.warn(`Элемент с ID ${chart.id} не найден в DOM`);
        }
    });

    // Сохраняем данные для последующего использования
    window.chartsData = data;
}



// Функция для обработки изменения размера графика
function handlePlotlyResize(chartId) {
    const element = document.getElementById(chartId);
    if (!element) return;

    // Используем ResizeObserver API для отслеживания изменений размера контейнера
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === element) {
                    try {
                        Plotly.Plots.resize(chartId);
                    } catch (e) {
                        console.log(`Не удалось изменить размер графика ${chartId}:`, e);
                    }
                }
            }
        });
        resizeObserver.observe(element);
    } else {
        // Fallback для старых браузеров
        window.addEventListener('resize', () => {
            try {
                Plotly.Plots.resize(chartId);
            } catch (e) {
                console.log(`Не удалось изменить размер графика ${chartId}:`, e);
            }
        });
    }
}