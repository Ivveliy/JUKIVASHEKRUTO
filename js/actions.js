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
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            characterSheet.toggleActionsPanel();
        });
    }
    
    // Клик по заголовку тоже сворачивает/разворачивает
    if (actionsHeader) {
        actionsHeader.addEventListener('click', (e) => {
            if (!e.target.closest('.toggle-panel')) {
                characterSheet.toggleActionsPanel();
            }
        });
    }
});
