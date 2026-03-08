// code.js - Основной файл с общими функциями
class CharacterSheet {
    constructor() {
        this.state = {
            characterName: '',
            characteristics: this.getDefaultCharacteristics(),
            statuses: [],
            traits: [],
            equipment: [],
            nonCombatSkills: [],
            combatSkills: [],
            paths: [],
            charms: [],
            charmSlots: 0, // Ручная корректировка количества слотов (по умолчанию 0)
            techniqueSlots: 0, // Ячейки Техник от малых продвижений
            techniqueSlotsManualAdjustment: 0, // Ручная корректировка ячеек техники
            blockOrder: ['characteristics', 'statuses', 'traits', 'equipment',
                       'nonCombatSkills', 'combatSkills', 'paths', 'charms', 'advancements'],
            collapsedBlocks: {},
            actionsPanelCollapsed: false,
            actionsPanelPosition: { x: null, y: null },
            loadAdjustment: 0,
            combatSkillsCollapsedSections: {}, // Состояние сворачивания разделов боевых навыков
            geo: 0, // Гео (аналог) - местная валюта персонажа
            advancements: [] // Малые продвижения
        };

        this.init();
    }
    
    getDefaultCharacteristics() {
        return {
            template: 'medium',
            base: {
                might: 3,
                insight: 3,
                shell: 3,
                absorption: 0,
                grace: 3,
                attractiveness: 1,
                horror: 1,
                speed: 6,
                heart: 7,
                endurance: 3,
                soul: 3,
                hunger: 4,
                satiety: 0
            },
            modifiers: {
                might: 0,
                insight: 0,
                shell: 0,
                absorption: 0,
                grace: 0,
                attractiveness: 0,
                horror: 0,
                speed: 0,
                heart: 0,
                endurance: 0,
                soul: 0,
                hunger: 0,
                load: 0
            },
            current: {
                heart: 7,
                endurance: 3,
                soul: 3
            }
        };
    }
    
    ensureModifiersIntegrity() {
        // Обеспечиваем обратную совместимость - добавляем недостающие ключи модификаторов
        const requiredModifiers = ['might', 'insight', 'shell', 'absorption', 'grace', 'attractiveness', 'horror', 'speed', 'heart', 'endurance', 'soul', 'hunger', 'load'];

        requiredModifiers.forEach(key => {
            if (this.state.characteristics.modifiers[key] === undefined) {
                this.state.characteristics.modifiers[key] = 0;
            }
        });
    }
    
    init() {
        this.loadState();
        this.setupEventListeners();
        this.renderBlocks();
        this.updateAllCharacteristics();
        
        // Применяем позицию панели только на ПК
        if (window.innerWidth > 768) {
            this.applyActionsPanelPosition();
        } else {
            // На мобильных восстанавливаем состояние сворачивания
            this.restoreActionsPanelState();
        }
    }
    
    saveState() {
        // Сохраняем состояние сворачивания разделов боевых навыков
        if (window.combatSkillsManager) {
            this.state.combatSkillsCollapsedSections = window.combatSkillsManager.collapsedSections;
        }

        const stateToSave = {
            ...this.state,
            // Сохраняем только данные, не функции
            characteristics: JSON.parse(JSON.stringify(this.state.characteristics)),
            statuses: JSON.parse(JSON.stringify(this.state.statuses)),
            traits: JSON.parse(JSON.stringify(this.state.traits)),
            equipment: JSON.parse(JSON.stringify(this.state.equipment)),
            nonCombatSkills: JSON.parse(JSON.stringify(this.state.nonCombatSkills)),
            combatSkills: JSON.parse(JSON.stringify(this.state.combatSkills)),
            paths: JSON.parse(JSON.stringify(this.state.paths)),
            charms: JSON.parse(JSON.stringify(this.state.charms)),
            advancements: JSON.parse(JSON.stringify(this.state.advancements)),
            combatSkillsCollapsedSections: this.state.combatSkillsCollapsedSections,
            techniqueSlots: this.state.techniqueSlots || 0,
            techniqueSlotsManualAdjustment: this.state.techniqueSlotsManualAdjustment || 0
        };

        localStorage.setItem('hk_rpg_character', JSON.stringify(stateToSave));
        console.log('Состояние сохранено');
    }
    
    loadState() {
        const saved = localStorage.getItem('hk_rpg_character');
        if (saved) {
            try {
                const loadedState = JSON.parse(saved);

                // Загружаем каждую часть состояния
                Object.keys(loadedState).forEach(key => {
                    if (this.state.hasOwnProperty(key)) {
                        this.state[key] = loadedState[key];
                    }
                });

                // Обеспечиваем целостность модификаторов (для обратной совместимости)
                this.ensureModifiersIntegrity();

                // Добавляем advancements в blockOrder если его там нет
                if (!this.state.blockOrder.includes('advancements')) {
                    this.state.blockOrder.push('advancements');
                }

                // Инициализируем advancements если не существует
                if (!this.state.advancements) {
                    this.state.advancements = [];
                }

                // Инициализируем techniqueSlots для обратной совместимости
                if (this.state.techniqueSlots === undefined) {
                    this.state.techniqueSlots = 0;
                }
                if (this.state.techniqueSlotsManualAdjustment === undefined) {
                    this.state.techniqueSlotsManualAdjustment = 0;
                }

                console.log('Состояние загружено');
            } catch (e) {
                console.error('Ошибка загрузки состояния:', e);
            }
        }

        // Обновляем отображение имени персонажа после загрузки
        this.updateCharacterNameDisplay();

        // Восстанавливаем состояние сворачивания разделов боевых навыков
        this.restoreCombatSkillsCollapsedState();
    }

    
    exportToJSON() {
        const dataStr = JSON.stringify(this.state, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const characterName = this.state.characterName || 'Без имени';
        const exportFileDefaultName = `${characterName} - JSON данные для загрузки.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    importFromJSON(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const importedState = JSON.parse(e.target.result);

                // Валидация импортированного состояния
                if (this.validateImportedState(importedState)) {
                    this.state = {
                        ...this.state,
                        ...importedState
                    };

                    // Обеспечиваем целостность модификаторов для импортированных данных
                    this.ensureModifiersIntegrity();

                    // Восстанавливаем состояние сворачивания разделов боевых навыков ДО отрисовки
                    this.restoreCombatSkillsCollapsedState();

                    this.renderBlocks();

                    this.updateAllCharacteristics();
                    this.updateCharacterNameDisplay();

                    // Перерисовываем содержимое всех блоков и переназначаем обработчики
                    if (window.characteristicsManager) {
                        window.characteristicsManager.renderBlock();
                        window.characteristicsManager.setupEventListeners();
                    }
                    if (window.statusesManager) {
                        window.statusesManager.renderBlock();
                        window.statusesManager.setupEventListeners();
                    }
                    if (window.traitsManager) {
                        window.traitsManager.renderBlock();
                        window.traitsManager.refreshEventListeners();
                    }
                    if (window.equipmentManager) {
                        window.equipmentManager.renderBlock();
                        window.equipmentManager.setupEventListeners();
                    }
                    if (window.nonCombatSkillsManager) {
                        window.nonCombatSkillsManager.renderBlock();
                        window.nonCombatSkillsManager.setupEventListeners();
                    }
                    if (window.combatSkillsManager) {
                        window.combatSkillsManager.renderBlock();
                        window.combatSkillsManager.setupEventListeners();
                    }
                    if (window.pathsManager) {
                        window.pathsManager.renderBlock();
                        window.pathsManager.setupEventListeners();
                    }
                    if (window.charmsManager) {
                        window.charmsManager.renderBlock();
                        window.charmsManager.setupEventListeners();
                    }
                    if (window.advancementsManager) {
                        window.advancementsManager.renderBlock();
                        window.advancementsManager.setupEventListeners();
                    }

                    // Сохраняем состояние после всех обновлений
                    this.saveState();

                    // Восстанавливаем состояние панели действий
                    if (window.innerWidth > 768) {
                        this.applyActionsPanelPosition();
                    } else {
                        this.restoreActionsPanelState();
                    }

                    // Обновляем обработчики кнопок действий
                    if (window.setupActionButtons) {
                        window.setupActionButtons();
                    }

                    alert('Персонаж успешно импортирован!');
                } else {
                    alert('Ошибка: Импортированный файл не является корректным сохранением персонажа');
                }
            } catch (error) {
                alert('Ошибка при чтении файла: ' + error.message);
            }
        };

        reader.readAsText(file);
    }
    
    validateImportedState(state) {
        // Базовая проверка структуры
        const requiredKeys = ['characteristics', 'statuses', 'traits', 'equipment'];
        return requiredKeys.every(key => state.hasOwnProperty(key));
    }
    
    setupEventListeners() {
        // Экспорт/импорт
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToJSON());
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importFromJSON(e.target.files[0]);
                e.target.value = ''; // Сбрасываем input
            }
        });

        // Кнопка центрирования меню действий
        document.getElementById('centerActionsBtn')?.addEventListener('click', () => {
            this.centerActionsPanel();
        });

        // Обработчик изменения имени персонажа
        document.getElementById('character-name')?.addEventListener('input', (e) => {
            this.state.characterName = e.target.value;
            this.saveState();
        });

        // Drag and drop для блоков
        this.setupDragAndDrop();

        // Drag and drop для actions panel
        this.setupActionsPanelDrag();
    }
    
    setupDragAndDrop() {
        const container = document.getElementById('blocksContainer');

        let draggedBlock = null;

        container.addEventListener('dragstart', (e) => {
            const block = e.target.closest('.block');
            if (block) {
                draggedBlock = block;
                draggedBlock.classList.add('dragging');

                // Устанавливаем данные для drag and drop
                e.dataTransfer.setData('text/plain', draggedBlock.id);
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            const draggable = document.querySelector('.dragging');

            if (afterElement == null) {
                container.appendChild(draggable);
            } else {
                container.insertBefore(draggable, afterElement);
            }
        });

        container.addEventListener('dragend', (e) => {
            const dragged = document.querySelector('.dragging');
            if (dragged) {
                dragged.classList.remove('dragging');

                // Обновляем порядок блоков в состоянии
                this.updateBlockOrder();
            }
        });
    }
    
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.block:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    updateBlockOrder() {
        const blocks = document.querySelectorAll('.block');
        const newOrder = Array.from(blocks).map(block => block.id.replace('block-', ''));
        
        this.state.blockOrder = newOrder;
        this.saveState();
    }
    
    toggleBlockCollapse(blockId) {
        if (!this.state.collapsedBlocks[blockId]) {
            this.state.collapsedBlocks[blockId] = true;
        } else {
            this.state.collapsedBlocks[blockId] = !this.state.collapsedBlocks[blockId];
        }
        
        const blockElement = document.getElementById(`block-${blockId}`);
        if (blockElement) {
            if (this.state.collapsedBlocks[blockId]) {
                blockElement.classList.add('collapsed');
            } else {
                blockElement.classList.remove('collapsed');
            }
        }
        
        this.saveState();
    }
    
    renderBlocks() {
        const container = document.getElementById('blocksContainer');
        container.innerHTML = '';

        // Рендерим блоки в сохраненном порядке
        this.state.blockOrder.forEach(blockId => {
            const blockElement = this.createBlockElement(blockId);
            if (blockElement) {
                container.appendChild(blockElement);

        // Восстанавливаем свернутое состояние
        if (this.state.collapsedBlocks[blockId]) {
            blockElement.classList.add('collapsed');
            const icon = blockElement.querySelector('.toggle-block i');
            if (icon) {
                icon.className = 'fas fa-chevron-down';
            }
        }
            }
        });
    }
    
    createBlockElement(blockId) {
        const blockTypes = {
            'characteristics': { title: 'Характеристики', icon: 'fas fa-chart-bar' },
            'statuses': { title: 'Активные статусы', icon: 'fas fa-hourglass-half' },
            'traits': { title: 'Черты', icon: 'fas fa-star' },
            'equipment': { title: 'Снаряжение', icon: 'fas fa-shield-alt' },
            'nonCombatSkills': { title: 'Умения', icon: 'fas fa-user-friends' },
            'combatSkills': { title: 'Боевые навыки', icon: 'fas fa-fist-raised' },
            'paths': { title: 'Ранги пути', icon: 'fas fa-road' },
            'charms': { title: 'Амулеты', icon: 'fas fa-gem' },
            'advancements': { title: 'Малые продвижения', icon: 'fas fa-arrow-up' }
        };

        if (!blockTypes[blockId]) return null;

        const block = document.createElement('div');
        block.className = 'block';
        block.id = `block-${blockId}`;
        block.draggable = true;

        const blockType = blockTypes[blockId];

        // Добавляем кнопку примечания для блока "Малые продвижения"
        const noteButton = blockId === 'advancements' 
            ? `<button class="note-block-btn" title="Примечание"><i class="fas fa-info-circle"></i></button>` 
            : '';

        block.innerHTML = `
            <div class="block-header">
                <h2><i class="${blockType.icon}"></i> ${blockType.title}</h2>
                <div class="block-controls">
                    ${noteButton}
                    <button class="toggle-block" title="Свернуть/развернуть">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                </div>
            </div>
            <div class="block-content" id="content-${blockId}">
                <!-- Контент будет добавлен соответствующим модулем -->
            </div>
        `;
        
        // Добавляем обработчик для сворачивания
        const toggleBtn = block.querySelector('.toggle-block');
        const self = this; // Сохраняем контекст
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            self.toggleBlockCollapse(blockId);

            // Меняем иконку
            const icon = toggleBtn.querySelector('i');
            if (block.classList.contains('collapsed')) {
                icon.className = 'fas fa-chevron-down';
            } else {
                icon.className = 'fas fa-chevron-up';
            }
        });

        // Добавляем обработчик для кнопки примечания (для блока "Малые продвижения")
        const noteBtn = block.querySelector('.note-block-btn');
        if (noteBtn) {
            noteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.advancementsManager) {
                    window.advancementsManager.showNote();
                }
            });
        }

        return block;
    }
    
    // Методы для обновления характеристик
    updateAllCharacteristics() {
        // Сбрасываем модификаторы
        Object.keys(this.state.characteristics.modifiers).forEach(key => {
            this.state.characteristics.modifiers[key] = 0;
        });

        // Добавляем модификаторы от статусов
        this.state.statuses.forEach(status => {
            this.applyStatusModifiers(status);
        });

        // Добавляем модификаторы от черт
        this.state.traits.forEach(trait => {
            this.applyTraitModifiers(trait);
        });

        // Добавляем модификаторы от амулетов
        this.state.charms.forEach(charm => {
            if (charm.equipped) {
                this.applyCharmModifiers(charm);
            }
        });

        // Добавляем модификаторы от путей
        this.calculatePathBonuses();

        // Добавляем модификаторы от малых продвижений
        this.applyAdvancementModifiers();

        // Применяем эффекты голода
        this.applyHungerEffects();

        // Обновляем отображение
        if (window.updateCharacteristicsDisplay) {
            window.updateCharacteristicsDisplay();
        }

        // Обновляем другие блоки, которые зависят от характеристик
        if (window.updateEquipmentDisplay) {
            window.updateEquipmentDisplay();
        }

        if (window.updateCharmsDisplay) {
            window.updateCharmsDisplay();
        }

        // Обновляем Ячейки Техник
        if (window.updateCombatSkillsTechniqueSlots) {
            window.updateCombatSkillsTechniqueSlots();
        }
    }
    
    applyStatusModifiers(status) {
        // Применяем постоянные модификаторы
        Object.keys(status.modifiers || {}).forEach(key => {
            if (this.state.characteristics.modifiers.hasOwnProperty(key)) {
                this.state.characteristics.modifiers[key] += status.modifiers[key];
            }
        });
    }
    
    applyTraitModifiers(trait) {
        Object.keys(trait.modifiers || {}).forEach(key => {
            if (this.state.characteristics.modifiers.hasOwnProperty(key)) {
                this.state.characteristics.modifiers[key] += trait.modifiers[key];
            }
        });
    }
    
    applyCharmModifiers(charm) {
        Object.keys(charm.modifiers || {}).forEach(key => {
            if (this.state.characteristics.modifiers.hasOwnProperty(key)) {
                this.state.characteristics.modifiers[key] += charm.modifiers[key];
            }
        });
    }
    
    calculatePathBonuses() {
        let militaryRanks = 0;
        let mysticalRanks = 0;

        this.state.paths.forEach(path => {
            if (path.type === 'Военный') {
                militaryRanks += path.rank;
            } else if (path.type === 'Мистический') {
                mysticalRanks += path.rank;
            }
        });

        this.state.characteristics.modifiers.endurance += militaryRanks;
        this.state.characteristics.modifiers.soul += mysticalRanks;
    }

    applySkillModifiers(skill) {
        // Non-combat skills don't modify characteristics - they're just reminders
        // This method is kept for compatibility but does nothing
    }
    
    applyHungerEffects() {
        const satiety = this.state.characteristics.base.satiety;

        if (satiety < -50 && satiety >= -100) {
            // -1 к главным характеристикам
            this.state.characteristics.modifiers.might -= 1;
            this.state.characteristics.modifiers.insight -= 1;
            this.state.characteristics.modifiers.shell -= 1;
            this.state.characteristics.modifiers.grace -= 1;
        }
    }

    applyAdvancementModifiers() {
        // Применяем модификаторы от малых продвижений
        if (!this.state.advancements) return;

        this.state.advancements.forEach(adv => {
            if (adv.type === 'characteristic') {
                const charId = adv.characteristicId;
                if (this.state.characteristics.modifiers.hasOwnProperty(charId)) {
                    this.state.characteristics.modifiers[charId] += adv.value;
                }
            } else if (adv.type === 'speed') {
                this.state.characteristics.modifiers.speed += adv.value;
            } else if (adv.type === 'load') {
                this.state.characteristics.modifiers.load += adv.value;
            }
        });
    }
    
    // Восстановление души при отдыхе
    calculateSoulRecovery() {
        const satiety = this.state.characteristics.base.satiety;
        const maxSoul = this.state.characteristics.base.soul + this.state.characteristics.modifiers.soul;
        
        if (satiety >= 0) {
            // Полное восстановление
            return maxSoul;
        } else if (satiety >= -50) {
            // Половина души, округленная вверх
            return Math.ceil(maxSoul / 2);
        } else {
            // Половина души (при голоде ниже -50)
            return Math.ceil(maxSoul / 2);
        }
    }
    
    // Расчет нагрузки
    calculateLoad() {
        const mightTotal = this.state.characteristics.base.might +
                          this.state.characteristics.modifiers.might;
        
        // Учитываем модификатор нагрузки от черт и других источников
        const loadModifier = this.state.characteristics.modifiers.load || 0;
        
        // Учитываем ручную корректировку максимальной нагрузки
        const loadAdjustment = this.state.loadAdjustment || 0;
        
        const maxLoad = mightTotal + loadModifier + loadAdjustment;

        let totalWeight = 0;
        this.state.equipment.forEach(item => {
            totalWeight += item.weight || 0;
        });

        return {
            max: maxLoad,
            current: totalWeight,
            adjustment: loadAdjustment,
            remaining: maxLoad - totalWeight
        };
    }

    // Изменение характеристик
    changeCharacteristic(button, amount) {
        const charName = button.dataset.char;
        const type = button.dataset.type || 'base';

        if (type === 'current') {
            // Для текущих значений (сердца, выносливость, душа)
            const max = this.state.characteristics.base[charName] +
                       this.state.characteristics.modifiers[charName];

            if (amount > 0) {
                this.state.characteristics.current[charName] =
                    Math.min(this.state.characteristics.current[charName] + 1, max);
            } else {
                this.state.characteristics.current[charName] =
                    Math.max(this.state.characteristics.current[charName] - 1, 0);
            }
        } else {
            // Для базовых значений
            this.state.characteristics.base[charName] += amount;
        }

        this.saveState();
        if (window.characteristicsManager) window.characteristicsManager.updateDisplay();
    }

    // Actions methods
    handleRest() {
        // Apply effects based on current satiety
        const currentSatiety = this.state.characteristics.base.satiety;
        const maxSoul = this.state.characteristics.base.soul + this.state.characteristics.modifiers.soul;
        const maxHeart = this.state.characteristics.base.heart + this.state.characteristics.modifiers.heart;

        let message = `Отдых в лагере завершен.\n`;

        if (currentSatiety >= 0) {
            // Full soul recovery and +1 heart
            this.state.characteristics.current.soul = maxSoul;
            this.state.characteristics.current.heart = Math.min(this.state.characteristics.current.heart + 1, maxHeart);
            message += `Полное восстановление души. Восстановлено 1 сердце.\n`;
        } else if (currentSatiety >= -50) {
            // Half soul recovery (rounded up)
            const recovery = Math.ceil(maxSoul / 2);
            this.state.characteristics.current.soul = Math.min(this.state.characteristics.current.soul + recovery, maxSoul);
            message += `Восстановлено ${recovery} души.\n`;
        } else if (currentSatiety >= -100) {
            // -1 to all main characteristics, can roll twice for food search
            this.state.characteristics.base.might -= 1;
            this.state.characteristics.base.insight -= 1;
            this.state.characteristics.base.shell -= 1;
            this.state.characteristics.base.grace -= 1;
            message += `-1 ко всем главным характеристикам. Можно дважды бросить на поиск еды.\n`;
        } else {
            // Death from hunger
            message += `Смерть от голода!\n`;
        }

        // Calculate total hunger and subtract from satiety
        const totalHunger = this.state.characteristics.base.hunger + this.state.characteristics.modifiers.hunger;
        this.state.characteristics.base.satiety -= totalHunger;

        message += `Сытость уменьшена на ${totalHunger}. Текущая сытость: ${this.state.characteristics.base.satiety}\n`;

        // Show notification
        alert(message);

        this.saveState();
        this.updateAllCharacteristics();
        if (window.updateCharacteristicsDisplay) window.updateCharacteristicsDisplay();
    }

    handleEndRound() {
        let messages = [];
        messages.push("Конец раунда:");

        // Restore endurance
        const maxEndurance = this.state.characteristics.base.endurance + this.state.characteristics.modifiers.endurance;
        const enduranceRestored = maxEndurance - this.state.characteristics.current.endurance;
        if (enduranceRestored > 0) {
            this.state.characteristics.current.endurance = maxEndurance;
            messages.push(`Выносливость восстановлена на ${enduranceRestored} (до ${maxEndurance}).`);
        } else {
            messages.push(`Выносливость уже максимальная (${maxEndurance}).`);
        }

        // Apply status effects
        const statusMessages = window.statusesManager.applyRoundEffects();
        messages = messages.concat(statusMessages);

        // Save and update
        this.saveState();
        this.updateAllCharacteristics();

        // Show notification
        alert(messages.join('\n'));

        // Update display after alert
        if (window.statusesManager) {
            window.statusesManager.renderBlock();
        }
        if (window.characteristicsManager) {
            window.characteristicsManager.updateDisplay();
        }
    }

    handleSave() {
        this.saveState();
        alert('Состояние сохранено!');
    }

    handleReset() {
        if (confirm('Сбросить все данные персонажа? Это действие нельзя отменить.')) {
            localStorage.removeItem('hk_rpg_character');
            location.reload();
        }
    }

    setupActionsPanelDrag() {
        const panel = document.getElementById('actionsPanel');
        if (!panel) return;

        // Не позволяем перетаскивать на мобильных
        if (window.innerWidth <= 768) return;

        let isDragging = false;
        let startX, startY, startLeft, startTop;

        // Обработчик mousedown на панели
        const mouseDownHandler = (e) => {
            if (e.target.closest('.action-btn') || e.target.closest('.toggle-panel')) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = panel.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            panel.style.cursor = 'grabbing';
            e.preventDefault();
        };

        // Обработчик mousemove на документе
        const mouseMoveHandler = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;

            // Ограничиваем перемещение в пределах окна
            const maxLeft = window.innerWidth - panel.offsetWidth;
            const maxTop = window.innerHeight - panel.offsetHeight;

            panel.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
            panel.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
        };

        // Обработчик mouseup на документе
        const mouseUpHandler = () => {
            if (isDragging) {
                isDragging = false;
                panel.style.cursor = 'move';

                // Сохраняем позицию
                const rect = panel.getBoundingClientRect();
                this.state.actionsPanelPosition.x = rect.left;
                this.state.actionsPanelPosition.y = rect.top;
                this.saveState();
            }
        };

        // Сохраняем ссылки на обработчики для возможного удаления
        if (!this.actionsPanelMouseHandlers) {
            this.actionsPanelMouseHandlers = [];
        }

        // Удаляем старые обработчики если они есть
        if (this.actionsPanelMouseHandlers.length > 0) {
            const [oldMouseDown, oldMouseMove, oldMouseUp] = this.actionsPanelMouseHandlers;
            panel.removeEventListener('mousedown', oldMouseDown);
            document.removeEventListener('mousemove', oldMouseMove);
            document.removeEventListener('mouseup', oldMouseUp);
        }

        // Добавляем новые обработчики
        panel.addEventListener('mousedown', mouseDownHandler);
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);

        this.actionsPanelMouseHandlers = [mouseDownHandler, mouseMoveHandler, mouseUpHandler];
    }

    applyActionsPanelPosition() {
        const panel = document.getElementById('actionsPanel');
        if (!panel) return;

        // Не применяем позицию на мобильных
        if (window.innerWidth <= 768) return;

        if (this.state.actionsPanelPosition.x !== null && this.state.actionsPanelPosition.y !== null) {
            panel.style.left = this.state.actionsPanelPosition.x + 'px';
            panel.style.top = this.state.actionsPanelPosition.y + 'px';
        }
    }

    centerActionsPanel() {
        const panel = document.getElementById('actionsPanel');
        if (!panel) return;

        // Центрируем панель по центру окна
        const panelWidth = panel.offsetWidth;
        const panelHeight = panel.offsetHeight;
        const centerX = (window.innerWidth - panelWidth) / 2;
        const centerY = (window.innerHeight - panelHeight) / 2;

        panel.style.left = Math.max(0, centerX) + 'px';
        panel.style.top = Math.max(0, centerY) + 'px';

        // Сохраняем позицию
        this.state.actionsPanelPosition.x = panel.offsetLeft;
        this.state.actionsPanelPosition.y = panel.offsetTop;
        this.saveState();
        
        // Пересоздаем обработчик перетаскивания
        this.setupActionsPanelDrag();
    }

    restoreActionsPanelState() {
        const content = document.getElementById('actionsContent');
        const toggleBtn = document.querySelector('.toggle-panel');
        const icon = document.querySelector('.toggle-panel i');

        if (content && this.state.actionsPanelCollapsed) {
            content.classList.add('collapsed');
            if (toggleBtn) toggleBtn.classList.add('rotated');
            if (icon) icon.className = 'fas fa-chevron-down';
        } else if (content) {
            content.classList.remove('collapsed');
            if (toggleBtn) toggleBtn.classList.remove('rotated');
            if (icon) icon.className = 'fas fa-chevron-up';
        }
    }

    toggleActionsPanel() {
        const content = document.getElementById('actionsContent');
        const toggleBtn = document.querySelector('.toggle-panel');
        const icon = document.querySelector('.toggle-panel i');

        if (content) {
            const isCollapsed = content.classList.contains('collapsed');

            if (isCollapsed) {
                content.classList.remove('collapsed');
                if (toggleBtn) toggleBtn.classList.remove('rotated');
                if (icon) icon.className = 'fas fa-chevron-down';
                this.state.actionsPanelCollapsed = false;
            } else {
                content.classList.add('collapsed');
                if (toggleBtn) toggleBtn.classList.add('rotated');
                if (icon) icon.className = 'fas fa-chevron-up';
                this.state.actionsPanelCollapsed = true;
            }

            this.saveState();
        }
    }

    updateCharacterNameDisplay() {
        const nameInput = document.getElementById('character-name');
        if (nameInput) {
            nameInput.value = this.state.characterName || '';
        }
    }

    restoreCombatSkillsCollapsedState() {
        // Восстанавливаем состояние сворачивания разделов боевых навыков
        if (window.combatSkillsManager && this.state.combatSkillsCollapsedSections) {
            window.combatSkillsManager.collapsedSections = { ...this.state.combatSkillsCollapsedSections };
        }
    }
}

// Создаем глобальный экземпляр
window.characterSheet = new CharacterSheet();
