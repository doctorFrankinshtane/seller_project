// Генерация дат для разных периодов
function generateDates(period) {
    const dates = [];
    const now = new Date();

    switch (period) {
        case 'today':
            dates.push(new Date(now));
            break;

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
            for (let i = 89; i >= 0; i -= 3) {
                const date = new Date(now);
                date.setDate(now.getDate() - i);
                dates.push(date);
            }
            break;

        case 'year':
            for (let i = 0; i < 12; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                dates.unshift(date);
            }
            break;
    }

    return dates;
}

// Генерация реалистичных данных для каждого периода
function generateMetricsData(period, dates) {
    const data = {
        dates: dates,
        wb: {},
        ozon: {}
    };

    const length = dates.length;

    // Базовые значения для разных периодов
    const baseValues = {
        today: { ctr: 0.035, cr: 0.025, cpc: 25, cpm: 150, spend: 50000, revenue: 150000 },
        week: { ctr: 0.032, cr: 0.023, cpc: 23, cpm: 140, spend: 35000, revenue: 120000 },
        month: { ctr: 0.030, cr: 0.022, cpc: 22, cpm: 135, spend: 30000, revenue: 100000 },
        quarter: { ctr: 0.028, cr: 0.020, cpc: 21, cpm: 130, spend: 28000, revenue: 95000 },
        year: { ctr: 0.025, cr: 0.018, cpc: 20, cpm: 125, spend: 25000, revenue: 85000 }
    };

    const base = baseValues[period];

    // Генерация данных с трендами и шумом
    data.wb.ctr = generateTrendData(length, base.ctr, 0.005, period === 'today' ? 0 : 0.001);
    data.wb.cr = generateTrendData(length, base.cr, 0.003, period === 'today' ? 0 : 0.0005);
    data.wb.cpc = generateTrendData(length, base.cpc, 3, period === 'today' ? 0 : 0.2);
    data.wb.cpm = generateTrendData(length, base.cpm, 15, period === 'today' ? 0 : 1);

    data.ozon.ctr = generateTrendData(length, base.ctr * 0.9, 0.004, period === 'today' ? 0 : 0.0008);
    data.ozon.cr = generateTrendData(length, base.cr * 0.85, 0.0025, period === 'today' ? 0 : 0.0004);
    data.ozon.cpc = generateTrendData(length, base.cpc * 1.15, 3.5, period === 'today' ? 0 : 0.25);
    data.ozon.cpm = generateTrendData(length, base.cpm * 1.1, 17, period === 'today' ? 0 : 1.2);

    // Расчет производных метрик
    data.wb.clicks = data.wb.ctr.map((ctr, i) => Math.round((period === 'year' ? 50000 : 2000) * (1 + i * 0.02) * (0.8 + Math.random() * 0.4)));
    data.wb.conversions = data.wb.clicks.map((clicks, i) => Math.round(clicks * data.wb.cr[i]));
    data.wb.spend = data.wb.clicks.map((clicks, i) => Math.round(clicks * data.wb.cpc[i]));
    data.wb.revenue = data.wb.conversions.map((conv, i) => Math.round(conv * (1500 + Math.random() * 500)));
    data.wb.profit = data.wb.revenue.map((rev, i) => rev - data.wb.spend[i]);
    data.wb.roi = data.wb.spend.map((spend, i) => spend > 0 ? ((data.wb.revenue[i] - spend) / spend).toFixed(2) : 0);

    data.ozon.clicks = data.ozon.ctr.map((ctr, i) => Math.round((period === 'year' ? 35000 : 1500) * (1 + i * 0.015) * (0.7 + Math.random() * 0.5)));
    data.ozon.conversions = data.ozon.clicks.map((clicks, i) => Math.round(clicks * data.ozon.cr[i]));
    data.ozon.spend = data.ozon.clicks.map((clicks, i) => Math.round(clicks * data.ozon.cpc[i]));
    data.ozon.revenue = data.ozon.conversions.map((conv, i) => Math.round(conv * (1400 + Math.random() * 400)));
    data.ozon.profit = data.ozon.revenue.map((rev, i) => rev - data.ozon.spend[i]);
    data.ozon.roi = data.ozon.spend.map((spend, i) => spend > 0 ? ((data.ozon.revenue[i] - spend) / spend).toFixed(2) : 0);

    return data;
}

// Генерация данных с трендом и шумом
function generateTrendData(length, base, variance, trend) {
    return Array.from({ length }, (_, i) => {
        const seasonal = Math.sin(2 * Math.PI * i / (length > 7 ? 7 : length)) * variance * 0.3;
        const trendComponent = i * trend;
        const noise = (Math.random() - 0.5) * variance * 0.8;
        return Math.max(0, base + trendComponent + seasonal + noise);
    });
}