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
            charmSlots: 0,
            techniqueSlots: 0,
            techniqueSlotsManualAdjustment: 0,
            blockOrder: ['characteristics', 'statuses', 'traits', 'equipment',
                       'nonCombatSkills', 'combatSkills', 'paths', 'charms', 'advancements', 'supplies'],
            collapsedBlocks: {},
            actionsPanelCollapsed: false,
            actionsPanelPosition: { x: null, y: null },
            loadAdjustment: 0,
            combatSkillsCollapsedSections: {},
            geo: 0,
            advancements: [],
            supplies: [],
            suppliesMax: 0,
            suppliesCurrent: 0,
            suppliesAdjustment: 0
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
        const requiredModifiers = ['might', 'insight', 'shell', 'absorption', 'grace', 'attractiveness', 'horror', 'speed', 'heart', 'endurance', 'soul', 'hunger', 'load', 'supplies'];

        requiredModifiers.forEach(key => {
            if (this.state.characteristics.modifiers[key] === undefined) {
                this.state.characteristics.modifiers[key] = 0;
            }
        });
    }
    
    init() {
        this.loadStateFromProfile();
        this.setupEventListeners();
        this.setupProfileEventListeners();
        this.renderBlocks();
        this.updateAllCharacteristics();
        this.updateProfileButtonsDisplay();

        if (window.innerWidth > 768) {
            this.applyActionsPanelPosition();
        } else {
            this.restoreActionsPanelState();
        }
    }

    loadStateFromProfile() {
        const profileId = this.getActiveProfile();
        const loaded = this.loadProfile(profileId);
        
        if (!loaded) {
            const oldSaved = localStorage.getItem('hk_rpg_character');
            if (oldSaved && profileId === '1') {
                try {
                    const oldState = JSON.parse(oldSaved);
                    this.state = { ...this.state, ...oldState };
                    this.ensureModifiersIntegrity();
                    this.saveCurrentProfile();
                    console.log('Старые данные мигрированы в профиль 1');
                } catch (e) {
                    console.error('Ошибка миграции старых данных:', e);
                }
            } else {
                this.saveCurrentProfile();
            }
        }
        
        this.updateCharacterNameDisplay();
        this.restoreCombatSkillsCollapsedState();
    }
    
    saveState() {
        if (window.combatSkillsManager) {
            this.state.combatSkillsCollapsedSections = window.combatSkillsManager.collapsedSections;
        }

        const stateToSave = {
            ...this.state,
            characteristics: JSON.parse(JSON.stringify(this.state.characteristics)),
            statuses: JSON.parse(JSON.stringify(this.state.statuses)),
            traits: JSON.parse(JSON.stringify(this.state.traits)),
            equipment: JSON.parse(JSON.stringify(this.state.equipment)),
            nonCombatSkills: JSON.parse(JSON.stringify(this.state.nonCombatSkills)),
            combatSkills: JSON.parse(JSON.stringify(this.state.combatSkills)),
            paths: JSON.parse(JSON.stringify(this.state.paths)),
            charms: JSON.parse(JSON.stringify(this.state.charms)),
            advancements: JSON.parse(JSON.stringify(this.state.advancements)),
            supplies: JSON.parse(JSON.stringify(this.state.supplies)),
            combatSkillsCollapsedSections: this.state.combatSkillsCollapsedSections,
            techniqueSlots: this.state.techniqueSlots || 0,
            techniqueSlotsManualAdjustment: this.state.techniqueSlotsManualAdjustment || 0
        };

        const profileId = this.getActiveProfile();
        const storageKey = this.getProfileStorageKey(profileId);
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
        console.log(`Состояние сохранено в профиль ${profileId}`);
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

                if (this.validateImportedState(importedState)) {
                    this.state = {
                        ...this.state,
                        ...importedState
                    };

                    this.ensureModifiersIntegrity();
                    this.restoreCombatSkillsCollapsedState();

                    this.renderBlocks();
                    this.updateAllCharacteristics();
                    this.updateCharacterNameDisplay();

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
                    if (window.suppliesManager) {
                        window.suppliesManager.renderBlock();
                        window.suppliesManager.setupEventListeners();
                    }

                    this.saveState();
                    this.updateProfileButtonsDisplay();

                    if (window.innerWidth > 768) {
                        this.applyActionsPanelPosition();
                    } else {
                        this.restoreActionsPanelState();
                    }

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
        const requiredKeys = ['characteristics', 'statuses', 'traits', 'equipment'];
        return requiredKeys.every(key => state.hasOwnProperty(key));
    }
    
    setupEventListeners() {
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToJSON());
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importFromJSON(e.target.files[0]);
                e.target.value = '';
            }
        });

        document.getElementById('centerActionsBtn')?.addEventListener('click', () => {
            this.centerActionsPanel();
        });

        document.getElementById('blockOrderBtn')?.addEventListener('click', () => {
            this.showBlockOrderModal();
        });

        document.getElementById('character-name')?.addEventListener('input', (e) => {
            this.state.characterName = e.target.value;
            this.saveState();
            this.updateProfileButtonsDisplay();
        });

        this.setupActionsPanelDrag();
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

        this.state.blockOrder.forEach(blockId => {
            const blockElement = this.createBlockElement(blockId);
            if (blockElement) {
                container.appendChild(blockElement);

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
            'advancements': { title: 'Малые продвижения', icon: 'fas fa-arrow-up' },
            'supplies': { title: 'Припасы', icon: 'fas fa-boxes' }
        };

        if (!blockTypes[blockId]) return null;

        const block = document.createElement('div');
        block.className = 'block';
        block.id = `block-${blockId}`;

        const blockType = blockTypes[blockId];

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

        const toggleBtn = block.querySelector('.toggle-block');
        const self = this;
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            self.toggleBlockCollapse(blockId);

            const icon = toggleBtn.querySelector('i');
            if (block.classList.contains('collapsed')) {
                icon.className = 'fas fa-chevron-down';
            } else {
                icon.className = 'fas fa-chevron-up';
            }
        });

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
    
    updateAllCharacteristics() {
        Object.keys(this.state.characteristics.modifiers).forEach(key => {
            this.state.characteristics.modifiers[key] = 0;
        });

        this.state.statuses.forEach(status => {
            this.applyStatusModifiers(status);
        });

        this.state.traits.forEach(trait => {
            this.applyTraitModifiers(trait);
        });

        this.state.charms.forEach(charm => {
            if (charm.equipped) {
                this.applyCharmModifiers(charm);
            }
        });

        this.calculatePathBonuses();
        this.applyAdvancementModifiers();
        this.applyHungerEffects();

        if (window.updateCharacteristicsDisplay) {
            window.updateCharacteristicsDisplay();
        }

        if (window.updateEquipmentDisplay) {
            window.updateEquipmentDisplay();
        }

        if (window.updateSuppliesDisplay) {
            window.updateSuppliesDisplay();
        }

        if (window.updateCharmSlotsFromPaths) {
            window.updateCharmSlotsFromPaths();
        }

        if (window.updateCombatSkillsTechniqueSlots) {
            window.updateCombatSkillsTechniqueSlots();
        }
    }
    
    applyStatusModifiers(status) {
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
    }
    
    applyHungerEffects() {
        const satiety = this.state.characteristics.base.satiety;

        if (satiety < -50 && satiety >= -100) {
            this.state.characteristics.modifiers.might -= 1;
            this.state.characteristics.modifiers.insight -= 1;
            this.state.characteristics.modifiers.shell -= 1;
            this.state.characteristics.modifiers.grace -= 1;
        }
    }

    applyAdvancementModifiers() {
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
    
    calculateSoulRecovery() {
        const satiety = this.state.characteristics.base.satiety;
        const maxSoul = this.state.characteristics.base.soul + this.state.characteristics.modifiers.soul;
        
        if (satiety >= 0) {
            return maxSoul;
        } else if (satiety >= -50) {
            return Math.ceil(maxSoul / 2);
        } else {
            return Math.ceil(maxSoul / 2);
        }
    }
    
    calculateLoad() {
        const mightTotal = this.state.characteristics.base.might +
                          this.state.characteristics.modifiers.might;
        
        const loadModifier = this.state.characteristics.modifiers.load || 0;
        const loadAdjustment = this.state.loadAdjustment || 0;
        
        const maxLoad = mightTotal + loadModifier + loadAdjustment;

        let totalWeight = 0;
        this.state.equipment.forEach(item => {
            totalWeight += item.weight || 0;
        });
        // Добавляем вес из припасов (еда и ловушки имеют вес)
        this.state.supplies.forEach(item => {
            totalWeight += (item.weight || 0) * (item.quantity || 1);
        });

        return {
            max: maxLoad,
            current: totalWeight,
            adjustment: loadAdjustment,
            remaining: maxLoad - totalWeight
        };
    }

    changeCharacteristic(button, amount) {
        const charName = button.dataset.char;
        const type = button.dataset.type || 'base';

        if (type === 'current') {
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
            this.state.characteristics.base[charName] += amount;
        }

        this.saveState();
        if (window.characteristicsManager) window.characteristicsManager.updateDisplay();
    }

    handleRest() {
        const currentSatiety = this.state.characteristics.base.satiety;
        const maxSoul = this.state.characteristics.base.soul + this.state.characteristics.modifiers.soul;
        const maxHeart = this.state.characteristics.base.heart + this.state.characteristics.modifiers.heart;

        let message = `Отдых в лагере завершен.\n`;

        if (currentSatiety >= 0) {
            this.state.characteristics.current.soul = maxSoul;
            this.state.characteristics.current.heart = Math.min(this.state.characteristics.current.heart + 1, maxHeart);
            message += `Полное восстановление души. Восстановлено 1 сердце.\n`;
        } else if (currentSatiety >= -50) {
            const recovery = Math.ceil(maxSoul / 2);
            this.state.characteristics.current.soul = Math.min(this.state.characteristics.current.soul + recovery, maxSoul);
            message += `Восстановлено ${recovery} души.\n`;
        } else if (currentSatiety >= -100) {
            this.state.characteristics.base.might -= 1;
            this.state.characteristics.base.insight -= 1;
            this.state.characteristics.base.shell -= 1;
            this.state.characteristics.base.grace -= 1;
            message += `-1 ко всем главным характеристикам. Можно дважды бросить на поиск еды.\n`;
        } else {
            message += `Смерть от голода!\n`;
        }

        const totalHunger = this.state.characteristics.base.hunger + this.state.characteristics.modifiers.hunger;
        this.state.characteristics.base.satiety -= totalHunger;

        message += `Сытость уменьшена на ${totalHunger}. Текущая сытость: ${this.state.characteristics.base.satiety}\n`;

        alert(message);

        this.saveState();
        this.updateAllCharacteristics();
        if (window.updateCharacteristicsDisplay) window.updateCharacteristicsDisplay();
    }

    handleEndRound() {
        let messages = [];
        messages.push("Конец раунда:");

        const maxEndurance = this.state.characteristics.base.endurance + this.state.characteristics.modifiers.endurance;
        const enduranceRestored = maxEndurance - this.state.characteristics.current.endurance;
        if (enduranceRestored > 0) {
            this.state.characteristics.current.endurance = maxEndurance;
            messages.push(`Выносливость восстановлена на ${enduranceRestored} (до ${maxEndurance}).`);
        } else {
            messages.push(`Выносливость уже максимальная (${maxEndurance}).`);
        }

        const statusMessages = window.statusesManager.applyRoundEffects();
        messages = messages.concat(statusMessages);

        this.saveState();
        this.updateAllCharacteristics();

        alert(messages.join('\n'));

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
        this.resetCurrentProfile();
    }

    setupActionsPanelDrag() {
        const panel = document.getElementById('actionsPanel');
        if (!panel) return;

        if (window.innerWidth <= 768) return;

        let isDragging = false;
        let startX, startY, startLeft, startTop;

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

        const mouseMoveHandler = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;

            const maxLeft = window.innerWidth - panel.offsetWidth;
            const maxTop = window.innerHeight - panel.offsetHeight;

            panel.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
            panel.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
        };

        const mouseUpHandler = () => {
            if (isDragging) {
                isDragging = false;
                panel.style.cursor = 'move';

                const rect = panel.getBoundingClientRect();
                this.state.actionsPanelPosition.x = rect.left;
                this.state.actionsPanelPosition.y = rect.top;
                this.saveState();
            }
        };

        if (!this.actionsPanelMouseHandlers) {
            this.actionsPanelMouseHandlers = [];
        }

        if (this.actionsPanelMouseHandlers.length > 0) {
            const [oldMouseDown, oldMouseMove, oldMouseUp] = this.actionsPanelMouseHandlers;
            panel.removeEventListener('mousedown', oldMouseDown);
            document.removeEventListener('mousemove', oldMouseMove);
            document.removeEventListener('mouseup', oldMouseUp);
        }

        panel.addEventListener('mousedown', mouseDownHandler);
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);

        this.actionsPanelMouseHandlers = [mouseDownHandler, mouseMoveHandler, mouseUpHandler];
    }

    applyActionsPanelPosition() {
        const panel = document.getElementById('actionsPanel');
        if (!panel) return;

        if (window.innerWidth <= 768) return;

        if (this.state.actionsPanelPosition.x !== null && this.state.actionsPanelPosition.y !== null) {
            panel.style.left = this.state.actionsPanelPosition.x + 'px';
            panel.style.top = this.state.actionsPanelPosition.y + 'px';
        }
    }

    centerActionsPanel() {
        const panel = document.getElementById('actionsPanel');
        if (!panel) return;

        const panelWidth = panel.offsetWidth;
        const panelHeight = panel.offsetHeight;
        const centerX = (window.innerWidth - panelWidth) / 2;
        const centerY = (window.innerHeight - panelHeight) / 2;

        panel.style.left = Math.max(0, centerX) + 'px';
        panel.style.top = Math.max(0, centerY) + 'px';

        this.state.actionsPanelPosition.x = panel.offsetLeft;
        this.state.actionsPanelPosition.y = panel.offsetTop;
        this.saveState();
        
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
        if (window.combatSkillsManager && this.state.combatSkillsCollapsedSections) {
            window.combatSkillsManager.collapsedSections = { ...this.state.combatSkillsCollapsedSections };
        }
    }

    // === Методы управления профилями персонажей ===

    getActiveProfile() {
        const saved = localStorage.getItem('hk_rpg_active_profile');
        return saved || '1';
    }

    setActiveProfile(profileId) {
        localStorage.setItem('hk_rpg_active_profile', profileId);
    }

    getProfileStorageKey(profileId) {
        return `hk_rpg_character_profile_${profileId}`;
    }

    getProfileName(profileId) {
        const storageKey = this.getProfileStorageKey(profileId);
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.characterName && data.characterName.trim() !== '') {
                    return data.characterName.substring(0, 3);
                }
            } catch (e) {
            }
        }
        return '\u2014';
    }

    saveCurrentProfile() {
        const profileId = this.getActiveProfile();
        const storageKey = this.getProfileStorageKey(profileId);
        
        const stateToSave = {
            ...this.state,
            characteristics: JSON.parse(JSON.stringify(this.state.characteristics)),
            statuses: JSON.parse(JSON.stringify(this.state.statuses)),
            traits: JSON.parse(JSON.stringify(this.state.traits)),
            equipment: JSON.parse(JSON.stringify(this.state.equipment)),
            nonCombatSkills: JSON.parse(JSON.stringify(this.state.nonCombatSkills)),
            combatSkills: JSON.parse(JSON.stringify(this.state.combatSkills)),
            paths: JSON.parse(JSON.stringify(this.state.paths)),
            charms: JSON.parse(JSON.stringify(this.state.charms)),
            advancements: JSON.parse(JSON.stringify(this.state.advancements)),
            supplies: JSON.parse(JSON.stringify(this.state.supplies))
        };
        
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }

    loadProfile(profileId) {
        const storageKey = this.getProfileStorageKey(profileId);
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
            try {
                const loadedState = JSON.parse(saved);
                
                Object.keys(loadedState).forEach(key => {
                    if (this.state.hasOwnProperty(key)) {
                        this.state[key] = loadedState[key];
                    }
                });
                
                this.ensureModifiersIntegrity();
                
                if (!this.state.blockOrder.includes('advancements')) {
                    this.state.blockOrder.push('advancements');
                }
                if (!this.state.blockOrder.includes('supplies')) {
                    this.state.blockOrder.push('supplies');
                }
                
                if (this.state.techniqueSlots === undefined) {
                    this.state.techniqueSlots = 0;
                }
                if (this.state.techniqueSlotsManualAdjustment === undefined) {
                    this.state.techniqueSlotsManualAdjustment = 0;
                }
                
                return true;
            } catch (e) {
                console.error('Ошибка загрузки профиля:', e);
                return false;
            }
        }
        
        return false;
    }

    switchProfile(profileId) {
        const currentProfileId = this.getActiveProfile();
        
        this.saveCurrentProfile();
        this.setActiveProfile(profileId);
        
        const loaded = this.loadProfile(profileId);
        
        if (!loaded) {
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
                charmSlots: 0,
                techniqueSlots: 0,
                techniqueSlotsManualAdjustment: 0,
                blockOrder: ['characteristics', 'statuses', 'traits', 'equipment',
                           'nonCombatSkills', 'combatSkills', 'paths', 'charms', 'advancements', 'supplies'],
                collapsedBlocks: {},
                actionsPanelCollapsed: false,
                actionsPanelPosition: { x: null, y: null },
                loadAdjustment: 0,
                combatSkillsCollapsedSections: {},
                geo: 0,
                advancements: [],
                supplies: [],
                suppliesMax: 0,
                suppliesCurrent: 0,
                suppliesAdjustment: 0
            };
        }
        
        this.renderBlocks();
        this.updateAllCharacteristics();
        this.updateCharacterNameDisplay();
        
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
        if (window.suppliesManager) {
            window.suppliesManager.renderBlock();
            window.suppliesManager.setupEventListeners();
        }
        
        this.saveState();
        this.updateProfileButtonsDisplay();
        
        if (window.innerWidth > 768) {
            this.applyActionsPanelPosition();
        } else {
            this.restoreActionsPanelState();
        }
        
        if (window.setupActionButtons) {
            window.setupActionButtons();
        }
    }

    hasProfileData(profileId) {
        const storageKey = this.getProfileStorageKey(profileId);
        const saved = localStorage.getItem(storageKey);
        if (!saved) return false;
        
        try {
            const data = JSON.parse(saved);
            if (data.characterName && data.characterName.trim() !== '') return true;
            if (data.equipment && data.equipment.length > 0) return true;
            if (data.traits && data.traits.length > 0) return true;
            if (data.statuses && data.statuses.length > 0) return true;
            if (data.charms && data.charms.length > 0) return true;
            if (data.geo && data.geo > 0) return true;
            return false;
        } catch (e) {
            return false;
        }
    }

    updateProfileButtonsDisplay() {
        const activeProfile = this.getActiveProfile();
        const totalProfiles = 25;
        const prevProfile = activeProfile > 1 ? String(parseInt(activeProfile) - 1) : String(totalProfiles);
        const nextProfile = activeProfile < totalProfiles ? String(parseInt(activeProfile) + 1) : '1';

        // Обновляем кнопку prev
        const prevBtn = document.querySelector('.profile-btn-prev');
        if (prevBtn) {
            const label = prevBtn.querySelector('.profile-btn-label');
            if (label) {
                label.textContent = this.getProfileName(prevProfile);
            }
            prevBtn.dataset.profile = prevProfile;
            if (this.hasProfileData(prevProfile)) {
                prevBtn.classList.add('has-data');
            } else {
                prevBtn.classList.remove('has-data');
            }
            prevBtn.title = `Предыдущий профиль (${prevProfile})`;
        }

        // Обновляем кнопку active
        const activeBtn = document.querySelector('.profile-btn-active');
        if (activeBtn) {
            const label = activeBtn.querySelector('.profile-btn-label');
            if (label) {
                label.textContent = this.getProfileName(activeProfile);
            }
            activeBtn.dataset.profile = activeProfile;
            activeBtn.classList.add('active');
            if (this.hasProfileData(activeProfile)) {
                activeBtn.classList.add('has-data');
            } else {
                activeBtn.classList.remove('has-data');
            }
            activeBtn.title = `Активный профиль (${activeProfile})`;
        }

        // Обновляем кнопку next
        const nextBtn = document.querySelector('.profile-btn-next');
        if (nextBtn) {
            const label = nextBtn.querySelector('.profile-btn-label');
            if (label) {
                label.textContent = this.getProfileName(nextProfile);
            }
            nextBtn.dataset.profile = nextProfile;
            if (this.hasProfileData(nextProfile)) {
                nextBtn.classList.add('has-data');
            } else {
                nextBtn.classList.remove('has-data');
            }
            nextBtn.title = `Следующий профиль (${nextProfile})`;
        }
    }

    showProfileSelectModal() {
        const existingModal = document.getElementById('profileSelectModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'profileSelectModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content profile-select-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-exchange-alt"></i> Выбор профиля</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="modal-description">Выберите профиль для переключения:</p>
                    <div class="profile-select-grid" id="profileSelectGrid"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn close-modal">Закрыть</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const grid = modal.querySelector('#profileSelectGrid');
        const activeProfile = this.getActiveProfile();

        for (let i = 1; i <= 25; i++) {
            const btn = document.createElement('button');
            btn.className = 'profile-select-btn';
            btn.dataset.profile = String(i);

            if (String(i) === activeProfile) {
                btn.classList.add('is-active');
            }

            if (this.hasProfileData(String(i))) {
                btn.classList.add('has-data');
            }

            const profileName = this.getProfileName(String(i));

            btn.innerHTML = `
                <span class="profile-select-name">${profileName}</span>
                <span class="profile-select-number">Профиль ${i}</span>
            `;

            btn.addEventListener('click', () => {
                const profileId = btn.dataset.profile;
                if (profileId !== this.getActiveProfile()) {
                    this.switchProfile(profileId);
                }
                modal.remove();
            });

            grid.appendChild(btn);
        }

        // Закрытие
        modal.querySelectorAll('.close-modal, .modal-close').forEach(el => {
            el.addEventListener('click', () => modal.remove());
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    resetCurrentProfile() {
        const profileId = this.getActiveProfile();
        const characterName = this.state.characterName || `Профиль ${profileId}`;
        
        if (confirm(`Вы уверены, что хотите очистить профиль "${characterName}"? Все данные будут потеряны.`)) {
            const storageKey = this.getProfileStorageKey(profileId);
            localStorage.removeItem(storageKey);
            
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
                charmSlots: 0,
                techniqueSlots: 0,
                techniqueSlotsManualAdjustment: 0,
                blockOrder: ['characteristics', 'statuses', 'traits', 'equipment',
                           'nonCombatSkills', 'combatSkills', 'paths', 'charms', 'advancements', 'supplies'],
                collapsedBlocks: {},
                actionsPanelCollapsed: false,
                actionsPanelPosition: { x: null, y: null },
                loadAdjustment: 0,
                combatSkillsCollapsedSections: {},
                geo: 0,
                advancements: [],
                supplies: [],
                suppliesMax: 0,
                suppliesCurrent: 0,
                suppliesAdjustment: 0
            };
            
            this.renderBlocks();
            this.updateAllCharacteristics();
            this.updateCharacterNameDisplay();
            this.saveState();
            this.updateProfileButtonsDisplay();
            
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
            if (window.suppliesManager) {
                window.suppliesManager.renderBlock();
                window.suppliesManager.setupEventListeners();
            }
            
            if (window.setupActionButtons) {
                window.setupActionButtons();
            }
        }
    }

    setupProfileEventListeners() {
        // Обработчик для prev кнопки
        document.querySelector('.profile-btn-prev')?.addEventListener('click', (e) => {
            const profileId = e.currentTarget.dataset.profile;
            this.switchProfile(profileId);
        });

        // Обработчик для active кнопки
        document.querySelector('.profile-btn-active')?.addEventListener('click', (e) => {
            const profileId = e.currentTarget.dataset.profile;
            this.switchProfile(profileId);
        });

        // Обработчик для next кнопки
        document.querySelector('.profile-btn-next')?.addEventListener('click', (e) => {
            const profileId = e.currentTarget.dataset.profile;
            this.switchProfile(profileId);
        });

        // Обработчик для кнопки "Смена профиля"
        document.getElementById('profileSwitchBtn')?.addEventListener('click', () => {
            this.showProfileSelectModal();
        });
    }

    showBlockOrderModal() {
        const existingModal = document.getElementById('blockOrderModal');
        if (existingModal) {
            existingModal.remove();
        }

        const blockTypes = {
            'characteristics': { title: 'Характеристики', icon: 'fas fa-chart-bar' },
            'statuses': { title: 'Активные статусы', icon: 'fas fa-hourglass-half' },
            'traits': { title: 'Черты', icon: 'fas fa-star' },
            'equipment': { title: 'Снаряжение', icon: 'fas fa-shield-alt' },
            'nonCombatSkills': { title: 'Умения', icon: 'fas fa-user-friends' },
            'combatSkills': { title: 'Боевые навыки', icon: 'fas fa-fist-raised' },
            'paths': { title: 'Ранги пути', icon: 'fas fa-road' },
            'charms': { title: 'Амулеты', icon: 'fas fa-gem' },
            'advancements': { title: 'Малые продвижения', icon: 'fas fa-arrow-up' },
            'supplies': { title: 'Припасы', icon: 'fas fa-boxes' }
        };

        const modal = document.createElement('div');
        modal.id = 'blockOrderModal';
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content block-order-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-sort"></i> Порядок блоков</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="modal-description">Перетаскивайте блоки мышкой, чтобы изменить их порядок. Затем нажмите "Сохранить".</p>
                    <div class="block-order-list" id="blockOrderList"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="saveBlockOrderBtn"><i class="fas fa-save"></i> Сохранить</button>
                    <button class="btn btn-secondary" id="cancelBlockOrderBtn"><i class="fas fa-times"></i> Отмена</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const listContainer = modal.querySelector('#blockOrderList');
        this.state.blockOrder.forEach((blockId, index) => {
            const blockType = blockTypes[blockId];
            if (blockType) {
                const item = document.createElement('div');
                item.className = 'block-order-item';
                item.dataset.blockId = blockId;
                item.draggable = true;
                item.innerHTML = `
                    <span class="block-order-drag-handle"><i class="fas fa-grip-vertical"></i></span>
                    <span class="block-order-icon"><i class="${blockType.icon}"></i></span>
                    <span class="block-order-title">${blockType.title}</span>
                    <div class="block-order-controls">
                        <button class="block-order-up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-up"></i>
                        </button>
                        <button class="block-order-down" data-index="${index}" ${index === this.state.blockOrder.length - 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                `;
                listContainer.appendChild(item);
            }
        });

        this.setupBlockOrderModalEventListeners(modal);
    }

    setupBlockOrderModalEventListeners(modal) {
        const self = this;
        let draggedItem = null;

        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('#cancelBlockOrderBtn').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('#saveBlockOrderBtn').addEventListener('click', () => {
            const newOrder = Array.from(modal.querySelectorAll('.block-order-item')).map(item => item.dataset.blockId);
            this.state.blockOrder = newOrder;
            this.saveState();
            this.renderBlocks();

            setTimeout(() => {
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
                if (window.suppliesManager) {
                    window.suppliesManager.renderBlock();
                    window.suppliesManager.setupEventListeners();
                }
            }, 0);

            modal.remove();
        });

        const listContainer = modal.querySelector('#blockOrderList');

        listContainer.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.block-order-item');
            if (item) {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        listContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getBlockOrderDragAfterElement(listContainer, e.clientY);
            if (afterElement == null) {
                listContainer.appendChild(draggedItem);
            } else {
                listContainer.insertBefore(draggedItem, afterElement);
            }
        });

        listContainer.addEventListener('dragend', () => {
            if (draggedItem) {
                draggedItem.classList.remove('dragging');
                draggedItem = null;
                this.updateBlockOrderButtons(listContainer);
            }
        });

        listContainer.addEventListener('click', (e) => {
            const upBtn = e.target.closest('.block-order-up');
            const downBtn = e.target.closest('.block-order-down');

            if (upBtn) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(upBtn.dataset.index);
                if (index > 0) {
                    this.swapBlockOrderItems(listContainer, index, index - 1);
                }
            } else if (downBtn) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(downBtn.dataset.index);
                if (index < listContainer.children.length - 1) {
                    this.swapBlockOrderItems(listContainer, index, index + 1);
                }
            }
        });
    }

    getBlockOrderDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.block-order-item:not(.dragging)')];

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

    swapBlockOrderItems(container, index1, index2) {
        const items = Array.from(container.children);
        const item1 = items[index1];
        const item2 = items[index2];
        
        const temp = document.createElement('div');
        
        if (index1 < index2) {
            container.insertBefore(temp, item1);
            container.insertBefore(item1, item2.nextSibling);
            container.insertBefore(item2, temp);
        } else {
            container.insertBefore(temp, item2);
            container.insertBefore(item2, item1.nextSibling);
            container.insertBefore(item1, temp);
        }
        
        container.removeChild(temp);
        this.updateBlockOrderButtons(container);
    }

    updateBlockOrderButtons(container) {
        const items = Array.from(container.children);
        items.forEach((item, index) => {
            const upBtn = item.querySelector('.block-order-up');
            const downBtn = item.querySelector('.block-order-down');

            if (upBtn) {
                upBtn.disabled = index === 0;
                upBtn.dataset.index = index;
            }
            if (downBtn) {
                downBtn.disabled = index === items.length - 1;
                downBtn.dataset.index = index;
            }
        });
    }
}

// Создаем глобальный экземпляр
window.characterSheet = new CharacterSheet();