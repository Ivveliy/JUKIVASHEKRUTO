// advancements.js - Блок "Малые продвижения"
class AdvancementsManager {
    constructor() {
        this.clickHandler = null;
        // Не инициализируем сразу - дождёмся создания блоков
    }

    init() {
        this.renderBlock();
        this.setupEventListeners();
    }

    renderBlock() {
        const content = document.getElementById('content-advancements');
        if (!content) return;

        const advancements = characterSheet.state.advancements || [];

        content.innerHTML = `
            <button class="add-btn" id="add-advancement-btn">
                <i class="fas fa-plus"></i> Добавить малое продвижение
            </button>

            <div class="advancements-list" style="margin-top: 15px;">
                ${advancements.length === 0
                    ? '<p class="empty-list" style="text-align: center; color: #888; padding: 20px;">Малые продвижения отсутствуют. Нажмите кнопку выше, чтобы добавить.</p>'
                    : advancements.map((adv, index) => this.renderAdvancementItem(adv, index)).join('')
                }
            </div>
        `;
    }

    renderAdvancementItem(advancement, index) {
        let icon = 'fa-plus';
        let color = 'var(--accent-blue)';
        let description = '';

        switch (advancement.type) {
            case 'characteristic':
                icon = 'fa-chart-bar';
                color = 'var(--accent-green)';
                description = `+0.5 к характеристике "${advancement.characteristicName}"`;
                break;
            case 'speed':
                icon = 'fa-tachometer-alt';
                color = 'var(--accent-yellow)';
                description = '+1 к Скорости';
                break;
            case 'load':
                icon = 'fa-weight-hanging';
                color = 'var(--accent-purple)';
                description = '+1 к Нагрузке';
                break;
            case 'technique':
                icon = 'fa-book-open';
                color = 'var(--accent-blue)';
                description = '+1 Ячейка Техники';
                break;
        }

        return `
            <div class="list-item" data-index="${index}" style="border-left-color: ${color};">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas ${icon}" style="color: ${color}; font-size: 1.2rem;"></i>
                    <div>
                        <strong>${description}</strong>
                    </div>
                </div>
                <div class="list-item-controls">
                    <button class="remove-advancement" title="Удалить продвижение">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }

        this.clickHandler = (e) => {
            if (e.target.closest('#add-advancement-btn')) {
                this.showAdvancementTypeSelector();
            } else if (e.target.closest('.remove-advancement')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.closest('.remove-advancement');
                const index = parseInt(button.closest('.list-item').dataset.index);
                this.removeAdvancement(index);
            }
        };

        document.addEventListener('click', this.clickHandler);
    }

    showAdvancementTypeSelector() {
        // Рассчитываем текущую скорость с учётом только продвижений к скорости
        const baseSpeed = characterSheet.state.characteristics.base.speed;
        let speedAdvancements = 0;

        if (characterSheet.state.advancements) {
            characterSheet.state.advancements.forEach(adv => {
                if (adv.type === 'speed') {
                    speedAdvancements += adv.value;
                }
            });
        }

        const totalSpeed = baseSpeed + speedAdvancements;
        const hideSpeedOption = totalSpeed >= 7;

        const modalContent = `
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 20px;">
                <p style="margin-bottom: 10px; text-align: center;">Выберите тип малого продвижения:</p>

                <button class="advancement-type-btn" data-type="characteristic" style="
                    padding: 15px;
                    background-color: var(--light-bg);
                    border: 2px solid var(--border-color);
                    border-radius: var(--radius);
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    text-align: left;
                ">
                    <i class="fas fa-chart-bar" style="color: var(--accent-green); margin-right: 10px;"></i>
                    <strong>Добавить +0.5 к Главной Характеристике</strong>
                    <br><small style="color: #666; margin-left: 30px;">Мощь, Проницательность, Панцирь, Грация</small>
                </button>

                ${!hideSpeedOption ? `
                <button class="advancement-type-btn" data-type="speed" style="
                    padding: 15px;
                    background-color: var(--light-bg);
                    border: 2px solid var(--border-color);
                    border-radius: var(--radius);
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    text-align: left;
                ">
                    <i class="fas fa-tachometer-alt" style="color: var(--accent-yellow); margin-right: 10px;"></i>
                    <strong>Добавить +1 к Скорости</strong>
                    <br><small style="color: #666; margin-left: 30px;">Максимальное значение: 7 (текущее: ${totalSpeed})</small>
                </button>
                ` : ''}

                <button class="advancement-type-btn" data-type="load" style="
                    padding: 15px;
                    background-color: var(--light-bg);
                    border: 2px solid var(--border-color);
                    border-radius: var(--radius);
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    text-align: left;
                ">
                    <i class="fas fa-weight-hanging" style="color: var(--accent-purple); margin-right: 10px;"></i>
                    <strong>Добавить +1 к Нагрузке</strong>
                    <br><small style="color: #666; margin-left: 30px;">Увеличивает максимальную нагрузку жука</small>
                </button>

                <button class="advancement-type-btn" data-type="technique" style="
                    padding: 15px;
                    background-color: var(--light-bg);
                    border: 2px solid var(--border-color);
                    border-radius: var(--radius);
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    text-align: left;
                ">
                    <i class="fas fa-book-open" style="color: var(--accent-blue); margin-right: 10px;"></i>
                    <strong>Добавить +1 Ячейка Техники</strong>
                    <br><small style="color: #666; margin-left: 30px;">Увеличивает количество Ячеек Техники жука</small>
                </button>
            </div>
        `;

        const modal = this.createModal('Выбор типа продвижения', modalContent);
        document.body.appendChild(modal);

        // Обработчики для кнопок выбора типа
        modal.querySelectorAll('.advancement-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                modal.remove();

                if (type === 'characteristic') {
                    this.showCharacteristicSelector();
                } else if (type === 'speed') {
                    this.addSpeedAdvancement();
                } else if (type === 'load') {
                    this.addLoadAdvancement();
                } else if (type === 'technique') {
                    this.addTechniqueAdvancement();
                }
            });

            btn.addEventListener('mouseenter', () => {
                btn.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                btn.style.borderColor = 'var(--accent-blue)';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.backgroundColor = 'var(--light-bg)';
                btn.style.borderColor = 'var(--border-color)';
            });
        });
    }

    showCharacteristicSelector() {
        // Главные характеристики: Мощь, Проницательность, Панцирь, Грация (без Поглощения)
        const mainCharacteristics = [
            { id: 'might', name: 'Мощь' },
            { id: 'insight', name: 'Проницательность' },
            { id: 'shell', name: 'Панцирь' },
            { id: 'grace', name: 'Грация' }
        ];

        const modalContent = `
            <div style="padding: 20px;">
                <p style="margin-bottom: 15px; text-align: center;">Выберите Главную Характеристику для улучшения:</p>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${mainCharacteristics.map(char => `
                        <button class="characteristic-select-btn" data-char="${char.id}" data-name="${char.name}" style="
                            padding: 12px;
                            background-color: var(--light-bg);
                            border: 2px solid var(--border-color);
                            border-radius: var(--radius);
                            cursor: pointer;
                            font-size: 1rem;
                            transition: all 0.2s ease;
                            text-align: left;
                        ">
                            <i class="fas fa-chart-bar" style="color: var(--accent-blue); margin-right: 10px;"></i>
                            ${char.name} (текущее: ${(characterSheet.state.characteristics.base[char.id] + (characterSheet.state.characteristics.modifiers[char.id] || 0)).toFixed(1)})
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        const modal = this.createModal('Выбор характеристики', modalContent);
        document.body.appendChild(modal);

        modal.querySelectorAll('.characteristic-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const charId = btn.dataset.char;
                const charName = btn.dataset.name;
                modal.remove();
                this.addCharacteristicAdvancement(charId, charName);
            });

            btn.addEventListener('mouseenter', () => {
                btn.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                btn.style.borderColor = 'var(--accent-blue)';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.backgroundColor = 'var(--light-bg)';
                btn.style.borderColor = 'var(--border-color)';
            });
        });
    }

    addCharacteristicAdvancement(charId, charName) {
        // Добавляем продвижение в состояние
        if (!characterSheet.state.advancements) {
            characterSheet.state.advancements = [];
        }

        characterSheet.state.advancements.push({
            type: 'characteristic',
            characteristicId: charId,
            characteristicName: charName,
            value: 0.5
        });

        // Применяем модификатор
        characterSheet.state.characteristics.modifiers[charId] += 0.5;

        characterSheet.saveState();
        characterSheet.updateAllCharacteristics();
        this.renderBlock();

        // Показываем уведомление
        alert(`Добавлено +0.5 к характеристике "${charName}"!`);
    }

    addSpeedAdvancement() {
        // Рассчитываем скорость только от базового значения и продвижений скорости
        const baseSpeed = characterSheet.state.characteristics.base.speed;
        let speedAdvancements = 0;
        
        if (characterSheet.state.advancements) {
            characterSheet.state.advancements.forEach(adv => {
                if (adv.type === 'speed') {
                    speedAdvancements += adv.value;
                }
            });
        }
        
        const totalSpeed = baseSpeed + speedAdvancements;

        if (totalSpeed >= 7) {
            alert('Скорость уже максимальна (7)!');
            return;
        }

        // Добавляем продвижение в состояние
        if (!characterSheet.state.advancements) {
            characterSheet.state.advancements = [];
        }

        characterSheet.state.advancements.push({
            type: 'speed',
            value: 1
        });

        // Увеличиваем модификатор скорости (не базовое значение)
        characterSheet.state.characteristics.modifiers.speed += 1;

        characterSheet.saveState();
        characterSheet.updateAllCharacteristics();
        this.renderBlock();

        alert('Добавлено +1 к Скорости!');
    }

    addLoadAdvancement() {
        // Добавляем продвижение в состояние
        if (!characterSheet.state.advancements) {
            characterSheet.state.advancements = [];
        }

        characterSheet.state.advancements.push({
            type: 'load',
            value: 1
        });

        // Увеличиваем модификатор нагрузки
        characterSheet.state.characteristics.modifiers.load += 1;

        characterSheet.saveState();
        characterSheet.updateAllCharacteristics();
        this.renderBlock();

        alert('Добавлено +1 к максимальной Нагрузке!');
    }

    addTechniqueAdvancement() {
        // Добавляем продвижение в состояние
        if (!characterSheet.state.advancements) {
            characterSheet.state.advancements = [];
        }

        characterSheet.state.advancements.push({
            type: 'technique',
            value: 1
        });

        // Увеличиваем модификатор ячеек техники
        if (!characterSheet.state.techniqueSlots) {
            characterSheet.state.techniqueSlots = 0;
        }
        characterSheet.state.techniqueSlots += 1;

        characterSheet.saveState();
        
        // Обновляем Ячейки Техник
        if (window.updateCombatSkillsTechniqueSlots) {
            window.updateCombatSkillsTechniqueSlots();
        }
        
        this.renderBlock();

        alert('Добавлена +1 Ячейка Техники!');
    }

    removeAdvancement(index) {
        const advancements = characterSheet.state.advancements;
        if (!advancements || index < 0 || index >= advancements.length) return;

        const advancement = advancements[index];

        if (confirm(`Удалить это малое продвижение?`)) {
            // Отменяем эффект продвижения
            if (advancement.type === 'characteristic') {
                characterSheet.state.characteristics.modifiers[advancement.characteristicId] -= advancement.value;
            } else if (advancement.type === 'speed') {
                characterSheet.state.characteristics.modifiers.speed -= advancement.value;
            } else if (advancement.type === 'load') {
                characterSheet.state.characteristics.modifiers.load -= advancement.value;
            } else if (advancement.type === 'technique') {
                if (!characterSheet.state.techniqueSlots) {
                    characterSheet.state.techniqueSlots = 0;
                }
                characterSheet.state.techniqueSlots -= 1;
            }

            // Удаляем из массива
            characterSheet.state.advancements.splice(index, 1);

            characterSheet.saveState();
            
            // Обновляем Ячейки Техник
            if (window.updateCombatSkillsTechniqueSlots) {
                window.updateCombatSkillsTechniqueSlots();
            }
            
            characterSheet.updateAllCharacteristics();
            this.renderBlock();
        }
    }

    showNote() {
        const noteContent = `
            <div style="padding: 20px; line-height: 1.6;">
                <p style="margin-bottom: 15px;"><strong>Когда жук получает Малое Продвижение, есть несколько вариантов того, как он может его использовать:</strong></p>
                
                <ul style="margin-left: 20px;">
                    <li style="margin-bottom: 10px;"><strong>Добавить +0.5 к любой Главной Характеристике жука.</strong></li>
                    
                    <li style="margin-bottom: 10px;"><strong>Добавить +1 к Скорости жука (не более 7).</strong></li>
                    
                    <li style="margin-bottom: 10px;"><strong>Добавить +1 к Нагрузке жука.</strong></li>
                    
                    <li style="margin-bottom: 10px;"><strong>Добавить 1 Ячейку Техники жуку.</strong></li>
                    
                    <li style="margin-bottom: 10px;"><strong>Добавить +1 Качество к природному оружию, природным инструментам или Блокирующим Рукам (максимум 3 к каждой Черте).</strong> Это влияет на все природное оружие от одной черты.</li>
                    
                    <li style="margin-bottom: 10px;"><strong>Добавить модификацию к любому природному оружию жука, кроме Нитяного.</strong> Оружие с модификацией Тяжелый не учитывается при подсчете Нагрузки жука. Модификацию Сбалансированный можно добавить только природным снарядам.</li>
                    
                    <li style="margin-bottom: 10px;"><strong>Добавить +1 к количеству использования ограниченных Черт или Мастерства:</strong> например, к восстановлению склянок в течении сцены.</li>
                </ul>
            </div>
        `;

        const modal = this.createModal('Малые продвижения - Примечание', noteContent);
        document.body.appendChild(modal);
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button class="btn close-modal">Закрыть</button>
                </div>
            </div>
        `;

        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }
}

// Создаём объект сразу, но не инициализируем
window.advancementsManager = new AdvancementsManager();

// Инициализируем после полной загрузки страницы и создания всех блоков
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // DOM уже загружен, ждём немного чтобы characterSheet создал блоки
    setTimeout(() => {
        if (window.characterSheet && window.advancementsManager) {
            window.advancementsManager.init();
        }
    }, 100);
} else {
    // Ждём загрузки DOM
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.characterSheet && window.advancementsManager) {
                window.advancementsManager.init();
            }
        }, 100);
    });
}
