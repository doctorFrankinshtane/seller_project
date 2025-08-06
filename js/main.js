// Управление навигацией между страницами
document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    // Обработчик для навигационных ссылок
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Убираем активный класс у всех ссылок и страниц
            navLinks.forEach(l => l.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));

            // Добавляем активный класс текущей ссылке и странице
            this.classList.add('active');
            const pageId = this.getAttribute('data-page') + '-page';
            document.getElementById(pageId).classList.add('active');

            // Обновляем заголовок страницы
            document.querySelector('.page-title').textContent = this.textContent.trim();
        });
    });

    // Обработчик для кнопки открытия/закрытия меню на мобильных устройствах
    menuToggle.addEventListener('click', function () {
        sidebar.classList.toggle('collapsed');
    });

    // Инициализация: показываем Dashboard по умолчанию
    document.getElementById('dashboard-page').classList.add('active');
    document.querySelector('[data-page="dashboard"]').classList.add('active');
});

// Управление модальным окном полноэкранного режима
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

    // Получаем данные и layout исходного графика
    // Примечание: Plotly.Fx.getFigure может не работать в некоторых версиях.
    // В таком случае, можно хранить данные графиков в глобальной переменной.
    try {
        const fullLayout = JSON.parse(JSON.stringify(Plotly.purge(chartId))); // Это не сработает, нужно другое решение
        // Лучше хранить данные графиков в window.chartsData = {}
        // Но для простоты примера, попробуем получить текущий график
        const gd = document.getElementById(chartId);
        if (gd && gd.data && gd.layout) {
            const data = JSON.parse(JSON.stringify(gd.data));
            const layout = JSON.parse(JSON.stringify(gd.layout));
            layout.margin = { t: 60, l: 80, r: 50, b: 80 };
            layout.autosize = true;

            Plotly.newPlot(tempDiv, data, layout)
                .then(() => {
                    // Добавляем обработчик для кнопки скачивания
                    document.getElementById('download-fullscreen-chart').onclick = function () {
                        Plotly.downloadImage(tempDiv, { format: 'png', width: 1200, height: 800, filename: chartTitles[chartId] || 'chart' });
                    };
                })
                .catch(err => {
                    console.error('Ошибка при открытии графика в полноэкранном режиме:', err);
                    fullscreenContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; font-size: 1.2rem;">Ошибка отображения графика</div>';
                });
        } else {
            throw new Error('Не удалось получить данные графика');
        }
    } catch (err) {
        console.error('Ошибка при копировании графика:', err);
        // В случае ошибки, просто отображаем изображение
        Plotly.toImage(chartId, { format: 'png', width: 1200, height: 800 })
            .then(function (url) {
                const img = document.createElement('img');
                img.src = url;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.objectFit = 'contain';
                fullscreenContainer.appendChild(img);

                // Добавляем обработчик для кнопки скачивания
                document.getElementById('download-fullscreen-chart').onclick = function () {
                    const link = document.createElement('a');
                    link.download = (chartTitles[chartId] || 'chart') + '.png';
                    link.href = url;
                    link.click();
                };
            })
            .catch(imgErr => {
                console.error('Ошибка при создании изображения графика:', imgErr);
                fullscreenContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; font-size: 1.2rem;">Ошибка отображения графика</div>';
            });
    }

    // Показываем модальное окно
    modal.classList.add('active');
}

// Закрытие полноэкранного режима
function closeFullscreenChart() {
    document.getElementById('fullscreen-modal').classList.remove('active');
    // Очищаем содержимое, чтобы освободить память
    setTimeout(() => {
        document.getElementById('fullscreen-chart-container').innerHTML = '';
    }, 300);
}

// Инициализация обработчиков для кнопок полноэкранного режима
document.addEventListener('DOMContentLoaded', function () {
    // Обработчики для кнопок в карточках и заголовках графиков
    document.querySelectorAll('[data-chart]').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const chartId = this.getAttribute('data-chart');
            if (chartId) {
                openFullscreenChart(chartId);
            }
        });
    });

    // Обработчик для кнопки закрытия
    document.getElementById('close-fullscreen').addEventListener('click', closeFullscreenChart);

    // Закрытие по нажатию Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeFullscreenChart();
        }
    });

    // Закрытие по клику вне контента
    document.getElementById('fullscreen-modal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeFullscreenChart();
        }
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

async function loadHistoricalData() {
    try {
        const response = await fetch('./api/data/historical_data.json');
        if (!response.ok) {
            throw new Error(`Ошибка при загрузке исторических данных: ${response.status}`);
        }
        const data = await response.json();
        console.log("Исторические данные успешно загружены:", data);
        return data;
    } catch (error) {
        console.error("Не удалось загрузить исторические данные:", error);
        alert("Ошибка: Не удалось загрузить исторические данные.");
        return null;
    }
}

// document.addEventListener('DOMContentLoaded', async () => {
//     const historicalData = await loadHistoricalData();
//     if (historicalData) {
//         const trainButton = document.getElementById('train-model-btn');
//         trainButton.addEventListener('click', async () => {
//             await trainModelWithAPI(historicalData);
//         });
//     }
// });