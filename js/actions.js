// actions.js - Действия персонажа

// Глобальные обработчики для удаления
let actionButtonHandlers = null;

document.addEventListener('DOMContentLoaded', () => {
    setupActionButtons();

    // Переключение панели действий
    const toggleBtn = document.querySelector('.toggle-panel');
    const actionsHeader = document.getElementById('actionsHeader');

    // Обработчик для кнопки сворачивания/разворачивания (только ПК)
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            characterSheet.toggleActionsPanel();
        });
    }

    // На мобильных - клик по заголовку сворачивает/разворачивает
    // На ПК - только кнопка сворачивания
    if (actionsHeader && window.innerWidth <= 768) {
        actionsHeader.addEventListener('click', (e) => {
            if (!e.target.closest('.toggle-panel')) {
                characterSheet.toggleActionsPanel();
            }
        });
    }
});

// Функция для установки обработчиков кнопок действий
function setupActionButtons() {
    // Удаляем старые обработчики если они есть
    if (actionButtonHandlers) {
        document.getElementById('restBtn')?.removeEventListener('click', actionButtonHandlers.rest);
        document.getElementById('endRoundBtn')?.removeEventListener('click', actionButtonHandlers.endRound);
        document.getElementById('saveBtn')?.removeEventListener('click', actionButtonHandlers.save);
        document.getElementById('resetBtn')?.removeEventListener('click', actionButtonHandlers.reset);
    }

    // Создаём новые обработчики
    actionButtonHandlers = {
        rest: () => characterSheet.handleRest(),
        endRound: () => characterSheet.handleEndRound(),
        save: () => characterSheet.handleSave(),
        reset: () => characterSheet.handleReset()
    };

    // Добавляем новые обработчики
    document.getElementById('restBtn')?.addEventListener('click', actionButtonHandlers.rest);
    document.getElementById('endRoundBtn')?.addEventListener('click', actionButtonHandlers.endRound);
    document.getElementById('saveBtn')?.addEventListener('click', actionButtonHandlers.save);
    document.getElementById('resetBtn')?.addEventListener('click', actionButtonHandlers.reset);
}

// Делаем функцию доступной для вызова после импорта
window.setupActionButtons = setupActionButtons;
