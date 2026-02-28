// actions.js - Действия персонажа
document.addEventListener('DOMContentLoaded', () => {
    // Кнопки действий
    document.getElementById('restBtn')?.addEventListener('click', () => {
        characterSheet.handleRest();
    });

    document.getElementById('endRoundBtn')?.addEventListener('click', () => {
        characterSheet.handleEndRound();
    });

    document.getElementById('saveBtn')?.addEventListener('click', () => {
        characterSheet.handleSave();
    });

    document.getElementById('resetBtn')?.addEventListener('click', () => {
        characterSheet.handleReset();
    });

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
