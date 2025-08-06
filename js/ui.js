// Обновление статистических карточек (с исправленной логикой цветов)
function updateStatCards(data) {
    // ROI
    // ROI - чем выше, тем лучше. Положительное изменение -> хорошо -> зеленый.
    const currentRoi = parseFloat(data.wb.roi[data.wb.roi.length - 1] || 0);
    const previousRoi = data.wb.roi.length > 1 ? parseFloat(data.wb.roi[data.wb.roi.length - 2] || 0) : currentRoi;
    const roiChange = currentRoi - previousRoi;
    const roiChangePercent = previousRoi !== 0 ? (roiChange / previousRoi) * 100 : 0;

    document.getElementById('roi-value').textContent = currentRoi.toFixed(2);
    document.getElementById('roi-trend').textContent = `${roiChange >= 0 ? '+' : ''}${roiChange.toFixed(2)}`;
    // Исправлено: зеленый для повышения, красный для понижения
    document.getElementById('roi-trend').className = `trend ${roiChange >= 0 ? 'up' : 'down'}`;

    // Расходы
    // Расходы - чем ниже, тем лучше. Повышение расходов -> плохо -> красный.
    const totalSpend = data.wb.spend.reduce((sum, val) => sum + val, 0) +
        data.ozon.spend.reduce((sum, val) => sum + val, 0);
    const spendChange = data.dates.length > 1 ?
        ((data.wb.spend[data.wb.spend.length - 1] + data.ozon.spend[data.ozon.spend.length - 1]) -
            (data.wb.spend[data.wb.spend.length - 2] + data.ozon.spend[data.ozon.spend.length - 2])) /
        (data.wb.spend[data.wb.spend.length - 2] + data.ozon.spend[data.ozon.spend.length - 2]) * 100 : 0;

    document.getElementById('spend-value').textContent = `${Math.round(totalSpend).toLocaleString('ru-RU')} ₽`;
    document.getElementById('spend-trend').textContent = `${spendChange >= 0 ? '+' : ''}${spendChange.toFixed(1)}%`;
    // Исправлено: красный для повышения, зеленый для понижения
    document.getElementById('spend-trend').className = `trend ${spendChange >= 0 ? 'down' : 'up'}`;
    // Логика: Повышение расходов - плохо -> красный. Но по общему стилю 'up' обычно зеленый.
    // Для расходов, если тренд "вверх" (положительный %), это плохо.
    // Если следовать строгой логике "зеленый = хорошо":
    // - Расходы выросли -> плохо -> красный. Но если мы показываем "рост" как "up", то это противоречие.
    // Лучше переосмыслить: 
    // Вариант 1 (как в коде выше): "up"/"down" определяет цвет напрямую (up=зеленый, down=красный). 
    // Тогда для расходов: рост -> плохо -> показываем "down" (красный).
    // Вариант 2 (логика ниже): "up"/"down" определяет направление, а цвет определяется интерпретацией.
    // Я использую Вариант 1 для консистентности с остальными метриками.
    // Перепишем для ясности:
    document.getElementById('spend-trend').className = `trend ${spendChange >= 0 ? 'up' : 'down'}`;
    // Это означает: Рост расходов (+X%) -> "up" -> зеленый. Это НЕ интуитивно.
    // Перепишем правильно:
    document.getElementById('spend-trend').className = `trend ${spendChange >= 0 ? 'down' : 'up'}`; // Рост -> плохо -> красный

    // Конверсия
    // Конверсия - чем выше, тем лучше. Повышение -> хорошо -> зеленый.
    const avgCr = (data.wb.cr[data.wb.cr.length - 1] + data.ozon.cr[data.ozon.cr.length - 1]) / 2;
    const prevAvgCr = data.wb.cr.length > 1 ?
        (data.wb.cr[data.wb.cr.length - 2] + data.ozon.cr[data.ozon.cr.length - 2]) / 2 : avgCr;
    const crChange = prevAvgCr !== 0 ? ((avgCr - prevAvgCr) / prevAvgCr) * 100 : 0;

    document.getElementById('conversion-value').textContent = `${(avgCr * 100).toFixed(2)}%`;
    document.getElementById('conversion-trend').textContent = `${crChange >= 0 ? '+' : ''}${crChange.toFixed(1)}%`;
    // Исправлено: зеленый для повышения, красный для понижения
    document.getElementById('conversion-trend').className = `trend ${crChange >= 0 ? 'up' : 'down'}`;

    // CPC
    // CPC (стоимость клика) - чем ниже, тем лучше. Повышение -> плохо -> красный.
    const avgCpc = (data.wb.cpc[data.wb.cpc.length - 1] + data.ozon.cpc[data.ozon.cpc.length - 1]) / 2;
    const prevAvgCpc = data.wb.cpc.length > 1 ?
        (data.wb.cpc[data.wb.cpc.length - 2] + data.ozon.cpc[data.ozon.cpc.length - 2]) / 2 : avgCpc;
    const cpcChange = prevAvgCpc !== 0 ? ((avgCpc - prevAvgCpc) / prevAvgCpc) * 100 : 0;

    document.getElementById('cpc-value').textContent = `${avgCpc.toFixed(2)} ₽`;
    document.getElementById('cpc-trend').textContent = `${cpcChange >= 0 ? '+' : ''}${cpcChange.toFixed(1)}%`;
    // Исправлено: красный для повышения, зеленый для понижения
    document.getElementById('cpc-trend').className = `trend ${cpcChange >= 0 ? 'down' : 'up'}`; // Рост CPC -> плохо -> красный

    // Прибыль
    // Прибыль - чем выше, тем лучше. Повышение -> хорошо -> зеленый.
    const totalProfit = data.wb.profit.reduce((sum, val) => sum + val, 0) +
        data.ozon.profit.reduce((sum, val) => sum + val, 0);
    const profitChange = data.dates.length > 1 ?
        ((data.wb.profit[data.wb.profit.length - 1] + data.ozon.profit[data.ozon.profit.length - 1]) -
            (data.wb.profit[data.wb.profit.length - 2] + data.ozon.profit[data.ozon.profit.length - 2])) /
        Math.abs(data.wb.profit[data.wb.profit.length - 2] + data.ozon.profit[data.ozon.profit.length - 2]) * 100 : 0;

    document.getElementById('profit-value').textContent = `${Math.round(totalProfit).toLocaleString('ru-RU')} ₽`;
    document.getElementById('profit-trend').textContent = `${profitChange >= 0 ? '+' : ''}${profitChange.toFixed(1)}%`;
    // Исправлено: зеленый для повышения, красный для понижения
    document.getElementById('profit-trend').className = `trend ${profitChange >= 0 ? 'up' : 'down'}`;
}

// Обновление времени
function updateTimestamps() {
    const now = new Date();
    const updateTime = now.toLocaleDateString('ru-RU') + ', ' +
        now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('last-update').textContent = updateTime;
    document.getElementById('footer-update').textContent = updateTime;
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
}