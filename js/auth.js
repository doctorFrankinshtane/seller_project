// js/auth.js

(function () {
    'use strict';

    // Проверка состояния авторизации при загрузке страницы
    document.addEventListener('DOMContentLoaded', function () {
        if (isUserAuthenticated()) {
            showMainApp();
        } else {
            showLoginPage();
        }

        // Обработчик формы входа
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        // Обработчик кнопки выхода
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    });

    // Функция для проверки, авторизован ли пользователь
    function isUserAuthenticated() {
        // В реальном приложении здесь будет проверка токена или сессии
        // Например: return localStorage.getItem('authToken') !== null;
        return localStorage.getItem('isAuthenticated') === 'true';
    }

    // Функция для отображения основного приложения
    function showMainApp() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('sidebar').style.display = 'flex';
        document.getElementById('main-content').style.display = 'flex';
        // Инициализируем остальную логику приложения
        initializeApp();
    }

    // Функция для отображения страницы входа
    function showLoginPage() {
        document.getElementById('login-page').classList.add('active');
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('main-content').style.display = 'none';
        // Очищаем состояние приложения
        // Например: window.chartsData = null;
    }

    // Функция для инициализации основного приложения (вызывается после успешного входа)
    function initializeApp() {
        // Здесь можно вызвать функции для создания графиков, обновления данных и т.д.
        // Они будут определены в других файлах
        if (typeof updateAllData === 'function') {
            console.log('Инициализация данных дашборда...');
            updateAllData('month'); // Предполагая, что это функция из dashboard.js
        }

        if (typeof createMLCharts === 'function') {
            console.log('Инициализация ML-графиков...');
            setTimeout(createMLCharts, 200); // Небольшая задержка
        }

        // Инициализация других компонентов...
        console.log('Приложение инициализировано');
    }

    // Функция обработки входа
    function handleLogin(event) {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('login-error');

        // Простая демонстрационная проверка
        // В реальном приложении здесь будет запрос к серверу
        if (username && password) { // Демо: любой не пустой логин/пароль подходит
            // Успешная авторизация
            localStorage.setItem('isAuthenticated', 'true');
            // Можно сохранить имя пользователя
            localStorage.setItem('currentUser', username);

            // Скрываем ошибку, если она была
            errorElement.style.display = 'none';

            // Показываем основное приложение
            showMainApp();

            console.log(`Пользователь "${username}" вошел в систему`);
        } else {
            // Отображаем ошибку
            errorElement.style.display = 'flex';
            // Анимация для привлечения внимания
            errorElement.animate([
                { transform: 'translateX(0)' },
                { transform: 'translateX(-10px)' },
                { transform: 'translateX(10px)' },
                { transform: 'translateX(0)' }
            ], {
                duration: 300,
                iterations: 1
            });
        }
    }

    // Функция обработки выхода
    function handleLogout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            // Очищаем данные авторизации
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('currentUser');

            // Очищаем любые другие сохраненные данные приложения
            // localStorage.removeItem('...');

            // Показываем страницу входа
            showLoginPage();

            // Очищаем форму входа
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.reset();
            }

            // Скрываем сообщение об ошибке, если оно было
            const errorElement = document.getElementById('login-error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }

            console.log('Пользователь вышел из системы');
        }
    }

})();