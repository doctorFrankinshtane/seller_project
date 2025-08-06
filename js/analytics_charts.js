// js/analytics_charts.js

/**
 * Создание графика продаж по маркетплейсам
 */
function createSalesByMarketplaceChart() {
    const elementId = 'sales-by-marketplace';
    const element = document.getElementById(elementId);
    if (!element) return;

    const data = [{
        x: ['Wildberries', 'Ozon', 'Яндекс.Маркет', 'AliExpress'],
        y: [4500, 3200, 2800, 1950],
        type: 'bar',
        marker: {
            color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']
        },
        text: ['4 500 шт', '3 200 шт', '2 800 шт', '1 950 шт'],
        textposition: 'auto'
    }];

    const layout = {
        title: 'Продажи по маркетплейсам',
        xaxis: { title: 'Маркетплейс' },
        yaxis: { title: 'Количество продаж, шт' },
        template: 'plotly_white'
    };

    Plotly.newPlot(elementId, data, layout);
}

/**
 * Создание графика рейтинга и отзывов
 */
function createRatingReviewsChart() {
    const elementId = 'rating-reviews';
    const element = document.getElementById(elementId);
    if (!element) return;

    const data = [
        {
            x: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
            y: [4.2, 4.3, 4.4, 4.5, 4.6, 4.7],
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Рейтинг',
            line: { color: '#3b82f6' },
            yaxis: 'y'
        },
        {
            x: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
            y: [80, 95, 110, 130, 150, 180],
            type: 'bar',
            name: 'Отзывы',
            marker: { color: '#10b981' },
            yaxis: 'y2',
            opacity: 0.7
        }
    ];

    const layout = {
        title: 'Динамика рейтинга и отзывов',
        xaxis: { title: 'Месяц' },
        yaxis: { 
            title: 'Рейтинг', 
            side: 'left',
            range: [4.0, 5.0]
        },
        yaxis2: {
            title: 'Количество отзывов',
            side: 'right',
            overlaying: 'y'
        },
        template: 'plotly_white',
        showlegend: true
    };

    Plotly.newPlot(elementId, data, layout);
}

/**
 * Создание графика возрастной структуры
 */
function createAgeStructureChart() {
    const elementId = 'age-structure';
    const element = document.getElementById(elementId);
    if (!element) return;

    const data = [{
        values: [25, 30, 20, 15, 10],
        labels: ['18-25', '26-35', '36-45', '46-55', '55+'],
        type: 'pie',
        marker: {
            colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
        },
        textinfo: 'label+percent',
        textposition: 'inside'
    }];

    const layout = {
        title: 'Возрастная структура покупателей',
        template: 'plotly_white'
    };

    Plotly.newPlot(elementId, data, layout);
}

/**
 * Создание графика полового распределения
 */
function createGenderDistributionChart() {
    const elementId = 'gender-distribution';
    const element = document.getElementById(elementId);
    if (!element) return;

    const data = [{
        x: ['Мужчины', 'Женщины'],
        y: [58, 42],
        type: 'bar',
        marker: {
            color: ['#3b82f6', '#f472b6']
        },
        text: ['58%', '42%'],
        textposition: 'auto'
    }];

    const layout = {
        title: 'Половое распределение',
        xaxis: { title: 'Пол' },
        yaxis: { 
            title: 'Процент', 
            range: [0, 100],
            tickformat: '.0f',
            ticksuffix: '%'
        },
        template: 'plotly_white'
    };

    Plotly.newPlot(elementId, data, layout);
}

/**
 * Создание графика географического распределения
 */
function createGeographyDistributionChart() {
    const elementId = 'geography-distribution';
    const element = document.getElementById(elementId);
    if (!element) return;

    // Для демонстрации создадим простую карту с точками
    // В реальном приложении здесь будет интеграция с картографическим сервисом
    const data = [{
        type: 'scattergeo',
        mode: 'markers',
        locations: ['MOW', 'SPE', 'NSK', 'EKB', 'KZN'],
        locationmode: 'ISO-3',
        marker: {
            size: [200, 150, 100, 80, 70],
            color: [200, 150, 100, 80, 70],
            colorscale: 'Blues',
            colorbar: { title: 'Количество покупателей' },
            sizemode: 'diameter'
        },
        name: 'Покупатели'
    }];

    const layout = {
        title: 'Географическое распределение покупателей',
        geo: {
            scope: 'world',
            projection: { type: 'natural earth' },
            showland: true,
            landcolor: 'rgb(243, 243, 243)',
            countrycolor: 'rgb(204, 204, 204)'
        },
        template: 'plotly_black'
    };

    Plotly.newPlot(elementId, data, layout);
}

// Инициализация графиков при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
    // Проверяем, какая страница активна, и инициализируем соответствующие графики
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        const pageId = activePage.id;
        
        switch (pageId) {
            case 'analytics-page':
                createSalesByMarketplaceChart();
                createRatingReviewsChart();
                break;
            case 'audience-page':
                createAgeStructureChart();
                createGenderDistributionChart();
                createGeographyDistributionChart();
                break;
        }
    }
});

// Добавляем обработчики для переключения между страницами
document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            // Небольшая задержка, чтобы страница успела переключиться
            setTimeout(() => {
                const activePage = document.querySelector('.page.active');
                if (activePage) {
                    const pageId = activePage.id;
                    
                    switch (pageId) {
                        case 'analytics-page':
                            createSalesByMarketplaceChart();
                            createRatingReviewsChart();
                            break;
                        case 'audience-page':
                            createAgeStructureChart();
                            createGenderDistributionChart();
                            createGeographyDistributionChart();
                            break;
                    }
                }
            }, 100);
        });
    });
});