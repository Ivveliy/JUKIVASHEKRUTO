// supplies.js - Блок припасов (расходников)
class SuppliesManager {
    constructor() {
        this.clickHandler = null;
        this.changeHandler = null;
        this.init();
    }

    init() {
        this.renderBlock();
        this.setupEventListeners();
        window.updateSuppliesDisplay = () => {
            this.calculateMaxSupplies();
            this.refreshSuppliesIndicator();
            this.updateLoadDisplay();
            // Синхронизируем отображение нагрузки в блоке снаряжения
            if (window.updateEquipmentDisplay) {
                window.updateEquipmentDisplay();
            }
        };
    }

    // Внутреннее обновление индикатора припасов (без перерендера всего блока)
    refreshSuppliesIndicator() {
        this.calculateMaxSupplies();
        const suppliesCurrent = characterSheet.state.suppliesCurrent || 0;
        const totalMax = characterSheet.state.suppliesMax || 0;
        const suppliesAdjustment = characterSheet.state.suppliesAdjustment || 0;
        const adjustedMax = Math.max(0, totalMax + suppliesAdjustment);
        
        const currentDisplay = document.getElementById('supplies-current-display');
        const totalDisplay = document.getElementById('supplies-total-display');
        const bonusDisplay = document.getElementById('supplies-bonus-display');
        const adjustmentInput = document.getElementById('max-supplies-input');
        
        if (currentDisplay) currentDisplay.textContent = suppliesCurrent;
        if (totalDisplay) totalDisplay.textContent = adjustedMax;
        if (bonusDisplay) bonusDisplay.textContent = `+ ${totalMax}`;
        if (adjustmentInput) {
            adjustmentInput.value = suppliesAdjustment;
            this.setInputWidth(adjustmentInput);
        }
    }

    // Установить ширину поля на основе содержимого
    setInputWidth(input) {
        if (!input) return;
        const value = input.value || '0';
        const temp = document.createElement('span');
        temp.style.cssText = 'visibility: hidden; position: absolute; white-space: nowrap; font-size: inherit; font-family: inherit; font-weight: inherit;';
        temp.textContent = value;
        document.body.appendChild(temp);
        const width = temp.offsetWidth;
        document.body.removeChild(temp);
        input.style.width = (width + 20) + 'px';
    }

    renderBlock() {
        const content = document.getElementById('content-supplies');
        if (!content) return;

        // Вычисляем максимальное количество припасов
        this.calculateMaxSupplies();

        const suppliesCurrent = characterSheet.state.suppliesCurrent || 0;
        const totalMax = characterSheet.state.suppliesMax || 0;
        const suppliesAdjustment = characterSheet.state.suppliesAdjustment || 0;
        const adjustedMax = Math.max(0, totalMax + suppliesAdjustment);

        content.innerHTML = `
            <div class="supplies-header" style="margin-bottom: 15px; padding: 10px; background-color: var(--light-bg); border-radius: var(--radius);">
                <div style="display: flex; gap: 20px; align-items: center; flex-wrap: nowrap;">
                    <div class="load-display" style="white-space: nowrap; flex-shrink: 0;">
                        <strong><i class="fas fa-weight-hanging"></i> Нагрузка:</strong>
                        ${this.renderCompactLoadDisplay()}
                    </div>
                    <div class="supplies-indicator" style="white-space: nowrap; flex-shrink: 0;">
                        <strong><i class="fas fa-boxes"></i> Припасы:</strong>
                        <span id="supplies-current-display" style="font-weight: 500;">${suppliesCurrent}</span>
                        <span style="color: #666;">/</span>
                        <span id="supplies-total-display" style="font-weight: 500;">${adjustedMax}</span>
                        <span style="color: #666;">(</span>
                        <input type="number" step="1" id="max-supplies-input" class="compact-input"
                               value="${suppliesAdjustment}" title="Ручная корректировка припасов">
                        <span id="supplies-bonus-display" style="color: #666;">+ ${totalMax}</span>
                        <span style="color: #666;">)</span>
                        <div class="supplies-controls">
                            <button type="button" class="supplies-ctrl-btn" id="supplies-dec-btn" title="Уменьшить припасы">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button type="button" class="supplies-ctrl-btn" id="supplies-inc-btn" title="Увеличить припасы">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button class="add-btn" id="add-supply-btn" style="margin-bottom: 15px;">
                <i class="fas fa-plus"></i> Добавить расходник
            </button>

            <div class="supplies-categories">
                ${this.renderSuppliesCategories()}
            </div>

            <div class="supplies-note">
                <p><strong>Припасы и рецепты</strong><br>
                Жук, вставший на Путь Припасов, может выучить разнообразные рецепты, которые определяются выбранным Путем. Продвижение в Умениях можно потратить на изучение одного рецепта любой редкости.</p>
                <p><strong>Использование Припасов</strong><br>
                Склянки все еще нужно бросать в качестве атаки. Ловушки все еще нужно расставлять за 1 Выносливость. Зелья все еще нужно использовать за 1 Выносливость.<br>
                Припасы — это всего лишь абстрактный ресурс, который делает работу с расходными материалами менее хлопотной для персонажа, который хочет играть с ними.</p>
                <p><strong>Поиск Припасов</strong><br>
                Жук может искать припасы один раз за сцену, пройдя проверку соответствующего навыка. Он получает количество Припасов, равное половине выпавших успехов.</p>
            </div>
        `;

        // Инициализация ширины полей после рендера
        setTimeout(() => this.initInputWidths(), 0);
    }

    initInputWidths() {
        const container = document.getElementById('content-supplies');
        if (!container) return;
        const inputs = container.querySelectorAll('.compact-input');
        inputs.forEach(input => this.setInputWidth(input));
    }

    calculateMaxSupplies() {
        let maxSupplies = 0;

        // Припасы от черт
        characterSheet.state.traits.forEach(trait => {
            if (trait.modifiers && trait.modifiers.supplies) {
                maxSupplies += trait.modifiers.supplies;
            }
        });

        // Припасы от путей с флагом isSuppliesPath
        characterSheet.state.paths.forEach(path => {
            if (path.isSuppliesPath) {
                maxSupplies += path.rank;
            }
        });

        characterSheet.state.suppliesMax = maxSupplies;
        if (characterSheet.state.suppliesCurrent === undefined) {
            characterSheet.state.suppliesCurrent = 0;
        }
        // Не даём текущим припасам превышать скорректированный максимум (с учётом ручной правки)
        const suppliesAdjustment = characterSheet.state.suppliesAdjustment || 0;
        const adjustedMax = Math.max(0, maxSupplies + suppliesAdjustment);
        if (characterSheet.state.suppliesCurrent > adjustedMax) {
            characterSheet.state.suppliesCurrent = adjustedMax;
        }
    }

    renderCompactLoadDisplay() {
        const load = characterSheet.calculateLoad();
        const baseMight = characterSheet.state.characteristics.base.might;
        const mightMod = characterSheet.state.characteristics.modifiers.might || 0;
        const totalMight = baseMight + mightMod;
        const loadModifier = characterSheet.state.characteristics.modifiers.load || 0;
        const loadAdjustment = characterSheet.state.loadAdjustment || 0;
        const maxLoad = totalMight + loadModifier + loadAdjustment;

        return `
            <span id="load-current-display">${load.current}</span>
            <span style="color: #666;">/</span>
            <input type="number" step="0.5" id="max-load-input-supplies" class="compact-input"
                   value="${maxLoad}" title="Максимальная нагрузка">
        `;
    }

    renderSuppliesCategories() {
        const typeNames = {
            'food': 'Еда',
            'potions': 'Зелья и алкоголь',
            'vials': 'Склянки',
            'poisons': 'Яды',
            'traps': 'Ловушки'
        };

        const typeIcons = {
            'food': 'fa-utensils',
            'potions': 'fa-flask',
            'vials': 'fa-vial',
            'poisons': 'fa-skull',
            'traps': 'fa-trap'
        };

        // Группируем предметы по типам
        const grouped = {};
        Object.keys(typeNames).forEach(key => { grouped[key] = []; });

        characterSheet.state.supplies.forEach(item => {
            if (grouped[item.type]) {
                grouped[item.type].push(item);
            }
        });

        let html = '';

        Object.entries(grouped).forEach(([typeKey, items]) => {
            if (items.length > 0) {
                const collapsedKey = `supplies_${typeKey}`;
                const isCollapsed = characterSheet.state.collapsedBlocks[collapsedKey] || false;

                html += `
                    <div class="supplies-category">
                        <h4 class="supplies-category-header" data-type="${typeKey}">
                            <span><i class="fas ${typeIcons[typeKey] || 'fa-box'}"></i> ${typeNames[typeKey] || typeKey}</span>
                            <span class="supplies-category-controls">
                                <span class="category-total-cost">
                                    <i class="fas fa-coins"></i> ${items.reduce((sum, item) => sum + ((item.cost || 0) * (item.quantity || 1)), 0)} гео
                                </span>
                                <button class="toggle-supplies-category" title="${isCollapsed ? 'Развернуть' : 'Свернуть'}">
                                    <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i>
                                </button>
                            </span>
                        </h4>
                        <div class="supplies-category-content ${isCollapsed ? 'collapsed' : ''}">
                            ${items.map((item, idx) => {
                                const globalIndex = characterSheet.state.supplies.findIndex(s => s === item);
                                return this.renderSupplyItem(item, globalIndex);
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        });

        if (!html) {
            html = '<p class="empty-list">Расходники отсутствуют</p>';
        }

        return html;
    }

    renderSupplyItem(item, index) {
        // Определяем иконку в зависимости от типа
        const typeIcons = {
            'food': 'fa-utensils',
            'potions': 'fa-flask',
            'vials': 'fa-vial',
            'poisons': 'fa-skull',
            'traps': 'fa-trap'
        };
        const icon = typeIcons[item.type] || 'fa-box';

        // Основные поля - всегда видны
        let mainParts = [];
        // Текстовые описания/эффекты - скрыты по умолчанию
        let textParts = [];

        if (item.type === 'food') {
            if (item.satiety) mainParts.push(`<i class="fas fa-drumstick-bite equipment-field-icon"></i>Сытость: ${item.satiety}`);
            if (item.weight) mainParts.push(`<i class="fas fa-weight-hanging equipment-field-icon"></i>Вес: ${item.weight}`);
            if (item.cost) mainParts.push(`<i class="fas fa-coins equipment-field-icon"></i>${item.cost} гео`);
            if (item.note) textParts.push(`<i class="fas fa-sticky-note equipment-field-icon"></i>${item.note}`);
        } else if (item.type === 'potions') {
            if (item.rarity) mainParts.push(`<i class="fas fa-star equipment-field-icon"></i><span class="${this.getRarityClass(item.rarity)}">${item.rarity}</span>`);
            if (item.strength) mainParts.push(`<i class="fas fa-gauge-high equipment-field-icon"></i>Крепость: ${item.strength}`);
            if (item.cost) mainParts.push(`<i class="fas fa-coins equipment-field-icon"></i>${item.cost} гео`);
            if (item.effect) textParts.push(`<i class="fas fa-wand-magic-sparkles equipment-field-icon"></i><strong>Эффект:</strong> ${item.effect}`);
            if (item.overdose) textParts.push(`<i class="fas fa-skull equipment-field-icon"></i><strong>Передозировка:</strong> ${item.overdose}`);
        } else if (item.type === 'vials') {
            if (item.rarity) mainParts.push(`<i class="fas fa-star equipment-field-icon"></i><span class="${this.getRarityClass(item.rarity)}">${item.rarity}</span>`);
            if (item.restoration !== undefined) mainParts.push(`<i class="fas fa-heart equipment-field-icon"></i>Восстановление: ${item.restoration ? 'Да' : 'Нет'}`);
            if (item.cost) mainParts.push(`<i class="fas fa-coins equipment-field-icon"></i>${item.cost} гео`);
            if (item.directedEffect) textParts.push(`<i class="fas fa-bullseye equipment-field-icon"></i><strong>Направленный эффект:</strong> ${item.directedEffect}`);
            if (item.areaEffect) textParts.push(`<i class="fas fa-expand equipment-field-icon"></i><strong>Эффект окружения:</strong> ${item.areaEffect}`);
            if (item.areaEffectPlus) textParts.push(`<i class="fas fa-expand-arrows-alt equipment-field-icon"></i><strong>Эффект окружения+:</strong> ${item.areaEffectPlus}`);
            if (item.ingestEffect) textParts.push(`<i class="fas fa-capsules equipment-field-icon"></i><strong>Эффект приёма внутрь:</strong> ${item.ingestEffect}`);
        } else if (item.type === 'poisons') {
            if (item.rarity) mainParts.push(`<i class="fas fa-star equipment-field-icon"></i><span class="${this.getRarityClass(item.rarity)}">${item.rarity}</span>`);
            if (item.doses) mainParts.push(`<i class="fas fa-prescription-bottle equipment-field-icon"></i>Дозы: ${item.doses}`);
            if (item.cost) mainParts.push(`<i class="fas fa-coins equipment-field-icon"></i>${item.cost} гео`);
            if (item.description) textParts.push(`<i class="fas fa-scroll equipment-field-icon"></i><strong>Описание:</strong> ${item.description}`);
            if (item.effect) textParts.push(`<i class="fas fa-skull equipment-field-icon"></i><strong>Эффект:</strong> ${item.effect}`);
        } else if (item.type === 'traps') {
            if (item.rarity) mainParts.push(`<i class="fas fa-star equipment-field-icon"></i><span class="${this.getRarityClass(item.rarity)}">${item.rarity}</span>`);
            if (item.reusable !== undefined) mainParts.push(`<i class="fas fa-recycle equipment-field-icon"></i>Многоразовая: ${item.reusable ? 'Да' : 'Нет'}`);
            if (item.weight) mainParts.push(`<i class="fas fa-weight-hanging equipment-field-icon"></i>Вес: ${item.weight}`);
            if (item.cost) mainParts.push(`<i class="fas fa-coins equipment-field-icon"></i>${item.cost} гео`);
            if (item.effect) textParts.push(`<i class="fas fa-bolt equipment-field-icon"></i><strong>Эффект:</strong> ${item.effect}`);
        }

        const hasTextParts = textParts.length > 0;

        // Основные поля всегда видны
        const mainDetails = mainParts.length > 0
            ? `<div class="item-compact-details"><small>${mainParts.join(' • ')}</small></div>`
            : '';

        // Текстовые описания скрыты по умолчанию
        const textDetails = hasTextParts
            ? `<div class="supply-details hidden" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease; margin-top: 6px;">
                <div class="item-compact-details" style="border-left: 3px solid var(--accent-blue); padding-left: 8px;"><small>${textParts.join('<br>')}</small></div>
               </div>`
            : '';

        // Счётчик количества
        const quantityControl = `
            <div class="item-quantity-control" title="Количество">
                <button type="button" class="supply-quantity-btn" data-index="${index}" data-action="dec">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="item-quantity-display">${item.quantity || 1} шт.</span>
                <button type="button" class="supply-quantity-btn" data-index="${index}" data-action="inc">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;

        return `
            <div class="list-item" data-index="${index}">
                <div>
                    <div style="display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;">
                        <i class="fas ${icon} equipment-icon"></i>
                        <strong class="equipment-weight">${item.name}</strong>
                        ${quantityControl}
                    </div>
                    ${mainDetails}
                    ${textDetails}
                </div>
                <div class="list-item-controls">
                    ${hasTextParts ? `
                    <button class="toggle-supply-details" title="Показать описание">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    ` : ''}
                    <button class="edit-supply" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="remove-supply" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getRarityClass(rarity) {
        const map = {
            'Обычная': 'rarity-common',
            'Необычная': 'rarity-uncommon',
            'Редкая': 'rarity-rare',
            'Уникальная': 'rarity-unique',
            'Легендарная': 'rarity-legendary',
            'Проклятая': 'rarity-cursed',
            'Хрупкая': 'rarity-fragile'
        };
        return map[rarity] || 'rarity-common';
    }

    setupEventListeners() {
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }
        if (this.changeHandler) {
            document.removeEventListener('change', this.changeHandler);
        }

        this.clickHandler = (e) => {
            if (e.target.closest('#add-supply-btn')) {
                this.showSupplyModal();
            } else if (e.target.closest('.edit-supply')) {
                e.preventDefault();
                e.stopPropagation();
                const index = e.target.closest('.list-item').dataset.index;
                this.showSupplyModal(parseInt(index));
            } else if (e.target.closest('.remove-supply')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.closest('.remove-supply');
                const index = parseInt(button.closest('.list-item').dataset.index);
                button.disabled = true;
                this.removeSupply(index, button);
            } else if (e.target.closest('.supply-quantity-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.supply-quantity-btn');
                const index = parseInt(btn.dataset.index);
                const action = btn.dataset.action;
                this.changeQuantity(index, action === 'inc' ? 1 : -1);
            } else if (e.target.closest('.toggle-supply-details')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.toggle-supply-details');
                const listItem = btn.closest('.list-item');
                const details = listItem.querySelector('.supply-details');
                const icon = btn.querySelector('i');

                if (details && icon) {
                    const isHidden = details.classList.contains('hidden');
                    if (isHidden) {
                        details.classList.remove('hidden');
                        details.style.maxHeight = details.scrollHeight + 'px';
                        icon.className = 'fas fa-chevron-up';
                        btn.title = 'Скрыть описание';
                    } else {
                        details.classList.add('hidden');
                        details.style.maxHeight = '0';
                        icon.className = 'fas fa-chevron-down';
                        btn.title = 'Показать описание';
                    }
                }
            } else if (e.target.closest('#supplies-inc-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const totalMax = characterSheet.state.suppliesMax || 0;
                const adjustment = characterSheet.state.suppliesAdjustment || 0;
                const adjustedMax = Math.max(0, totalMax + adjustment);
                const current = characterSheet.state.suppliesCurrent || 0;
                if (current < adjustedMax) {
                    characterSheet.state.suppliesCurrent = current + 1;
                    characterSheet.saveState();
                    this.refreshSuppliesIndicator();
                }
            } else if (e.target.closest('#supplies-dec-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const current = characterSheet.state.suppliesCurrent || 0;
                if (current > 0) {
                    characterSheet.state.suppliesCurrent = current - 1;
                    characterSheet.saveState();
                    this.refreshSuppliesIndicator();
                }
            } else if (e.target.closest('.info-tooltip-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.info-tooltip-btn');
                const encoded = btn.dataset.info;
                if (encoded) {
                    const text = decodeURIComponent(encoded);
                    // Создаём небольшое всплывающее окно
                    const popup = document.createElement('div');
                    popup.className = 'info-tooltip-popup';
                    popup.innerHTML = `
                        <div class="info-tooltip-popup-content">
                            <button type="button" class="info-tooltip-popup-close">&times;</button>
                            <p>${text}</p>
                        </div>
                    `;
                    document.body.appendChild(popup);
                    // Закрытие по клику на крестик или фон
                    popup.addEventListener('click', (ev) => {
                        if (ev.target === popup || ev.target.closest('.info-tooltip-popup-close')) {
                            popup.remove();
                        }
                    });
                }
            } else if (e.target.closest('.supplies-category-header')) {
                e.preventDefault();
                e.stopPropagation();
                const header = e.target.closest('.supplies-category-header');
                // Не срабатываем при клике на кнопки внутри заголовка
                if (e.target.closest('.toggle-supplies-category') || e.target.closest('.category-total-cost')) return;
                const typeKey = header.dataset.type;
                const content = header.nextElementSibling;
                const toggleBtn = header.querySelector('.toggle-supplies-category');
                const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

                const collapsedKey = `supplies_${typeKey}`;
                const isCollapsed = characterSheet.state.collapsedBlocks[collapsedKey] || false;
                characterSheet.state.collapsedBlocks[collapsedKey] = !isCollapsed;

                if (content) {
                    content.classList.toggle('collapsed');
                }
                if (icon) {
                    icon.className = `fas fa-chevron-${!isCollapsed ? 'down' : 'up'}`;
                }
                if (toggleBtn) toggleBtn.title = !isCollapsed ? 'Развернуть' : 'Свернуть';
                characterSheet.saveState();
            }
        };

        this.blurHandler = (e) => {
            if (e.target.classList.contains('compact-input')) {
                // auto-size for compact inputs
            }
        };

        // При потере фокуса с компактного поля - подгоняем ширину
        this.onBlurHandler = (e) => {
            if (e.target.classList.contains('compact-input')) {
                this.setInputWidth(e.target);
            }
        };

        this.changeHandler = (e) => {
            if (e.target.id === 'max-supplies-input') {
                const newVal = parseInt(e.target.value) || 0;
                characterSheet.state.suppliesAdjustment = newVal;
                characterSheet.saveState();
                // Обновляем только отображение припасов, не перерендеривая весь блок
                this.refreshSuppliesIndicator();
            } else if (e.target.id === 'max-load-input-supplies') {
                const newMaxLoad = parseFloat(e.target.value) || 0;
                const baseMight = characterSheet.state.characteristics.base.might;
                const mightMod = characterSheet.state.characteristics.modifiers.might || 0;
                const totalMight = baseMight + mightMod;
                const loadModifier = characterSheet.state.characteristics.modifiers.load || 0;
                characterSheet.state.loadAdjustment = newMaxLoad - totalMight - loadModifier;
                characterSheet.saveState();
                this.updateLoadDisplay();
                if (window.updateEquipmentDisplay) window.updateEquipmentDisplay();
            }
        };

        document.addEventListener('click', this.clickHandler);
        document.addEventListener('change', this.changeHandler);
        document.addEventListener('blur', this.onBlurHandler, true);
    }

    cleanupEventListeners() {
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }
        if (this.changeHandler) {
            document.removeEventListener('change', this.changeHandler);
        }
    }

    changeQuantity(index, amount) {
        const item = characterSheet.state.supplies[index];
        if (!item) return;

        const newQty = (item.quantity || 1) + amount;
        if (newQty <= 0) {
            // Удаляем предмет при уменьшении до 0
            characterSheet.state.supplies.splice(index, 1);
        } else {
            item.quantity = newQty;
        }

        characterSheet.saveState();
        this.renderBlock();
        if (window.updateEquipmentDisplay) window.updateEquipmentDisplay();
    }

    // Создаёт кнопку-подсказку с текстом
    infoTooltip(text) {
        const encoded = encodeURIComponent(text);
        return `<button type="button" class="info-tooltip-btn" data-info="${encoded}"><i class="fas fa-question-circle"></i></button>`;
    }

    showSupplyModal(supplyIndex = null) {
        const supply = supplyIndex !== null ?
            characterSheet.state.supplies[supplyIndex] :
            null;

        const modalContent = `
            <form id="supply-form">
                <div class="form-group">
                    <label for="supply-type">Тип</label>
                    <select id="supply-type" class="form-control" required>
                        <option value="food" ${supply?.type === 'food' ? 'selected' : ''}>Еда</option>
                        <option value="potions" ${supply?.type === 'potions' ? 'selected' : ''}>Зелья и алкоголь</option>
                        <option value="vials" ${supply?.type === 'vials' ? 'selected' : ''}>Склянки</option>
                        <option value="poisons" ${supply?.type === 'poisons' ? 'selected' : ''}>Яды</option>
                        <option value="traps" ${supply?.type === 'traps' ? 'selected' : ''}>Ловушки</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="supply-name">Название</label>
                    <input type="text" id="supply-name" class="form-control" value="${supply?.name || ''}" required>
                </div>

                <!-- Поля для Еды -->
                <div id="supply-fields-food" class="supply-type-fields" style="display: ${!supply || supply.type === 'food' ? 'block' : 'none'}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supply-food-satiety"><i class="fas fa-drumstick-bite equipment-field-icon"></i>Сытость в порции</label>
                            <input type="number" step="1" id="supply-food-satiety" class="form-control" value="${supply?.satiety || ''}">
                        </div>
                        <div class="form-group">
                            <label for="supply-food-weight"><i class="fas fa-weight-hanging equipment-field-icon"></i>Вес порции ${this.infoTooltip('Вес еды, которую носит с собой жук, всегда округляется в меньшую сторону. Например, если жук несет сырые растения весом 0.5, они будут считаться лёгким предметом.')}</label>
                            <input type="number" step="0.5" id="supply-food-weight" class="form-control" value="${supply?.weight || 0}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supply-food-cost"><i class="fas fa-coins equipment-field-icon"></i>Цена порции</label>
                            <input type="number" step="1" id="supply-food-cost" class="form-control" value="${supply?.cost || 0}">
                        </div>
                        <div class="form-group">
                            <label for="supply-food-quantity"><i class="fas fa-layer-group equipment-field-icon"></i>Количество</label>
                            <input type="number" step="1" id="supply-food-quantity" class="form-control" value="${supply?.quantity || 1}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="supply-food-note"><i class="fas fa-sticky-note equipment-field-icon"></i>Примечание</label>
                        <textarea id="supply-food-note" class="form-control" rows="2">${supply?.note || ''}</textarea>
                    </div>
                    <div class="supply-type-info">
                        <p><strong>Прием пищи:</strong> Прием пищи прямо во время боя стоит 1 Выносливость.</p>
                        <p><strong>Разделывание:</strong> Если вы готовите из существ, будь то жуки или грибные монстры, то вес получившейся сырой пищи будет равен весу существа.</p>
                    </div>
                </div>

                <!-- Поля для Зелий и алкоголя -->
                <div id="supply-fields-potions" class="supply-type-fields" style="display: ${supply?.type === 'potions' ? 'block' : 'none'}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supply-potions-rarity"><i class="fas fa-star equipment-field-icon"></i>Редкость</label>
                            <select id="supply-potions-rarity" class="form-control">
                                <option value="">Не выбрана</option>
                                <option value="Обычная" ${supply?.rarity === 'Обычная' ? 'selected' : ''}>Обычная</option>
                                <option value="Необычная" ${supply?.rarity === 'Необычная' ? 'selected' : ''}>Необычная</option>
                                <option value="Редкая" ${supply?.rarity === 'Редкая' ? 'selected' : ''}>Редкая</option>
                                <option value="Уникальная" ${supply?.rarity === 'Уникальная' ? 'selected' : ''}>Уникальная</option>
                                <option value="Легендарная" ${supply?.rarity === 'Легендарная' ? 'selected' : ''}>Легендарная</option>
                                <option value="Проклятая" ${supply?.rarity === 'Проклятая' ? 'selected' : ''}>Проклятая</option>
                                <option value="Хрупкая" ${supply?.rarity === 'Хрупкая' ? 'selected' : ''}>Хрупкая</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="supply-potions-strength"><i class="fas fa-gauge-high equipment-field-icon"></i>Крепость ${this.infoTooltip('Каждый раз, когда жук пьет зелье повторно, он должен совершить проверку Панциря со сложностью, равной крепости зелья, иначе получит эффект передозировки. С каждым последующим напитком крепость возрастает на 1.')}</label>
                            <input type="text" id="supply-potions-strength" class="form-control" value="${supply?.strength || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supply-potions-cost"><i class="fas fa-coins equipment-field-icon"></i>Цена</label>
                            <input type="number" step="1" id="supply-potions-cost" class="form-control" value="${supply?.cost || 0}">
                        </div>
                        <div class="form-group">
                            <label for="supply-potions-quantity"><i class="fas fa-layer-group equipment-field-icon"></i>Количество</label>
                            <input type="number" step="1" id="supply-potions-quantity" class="form-control" value="${supply?.quantity || 1}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="supply-potions-effect"><i class="fas fa-wand-magic-sparkles equipment-field-icon"></i>Эффект</label>
                        <textarea id="supply-potions-effect" class="form-control" rows="2">${supply?.effect || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="supply-potions-overdose"><i class="fas fa-skull equipment-field-icon"></i>Передозировка</label>
                        <textarea id="supply-potions-overdose" class="form-control" rows="2">${supply?.overdose || ''}</textarea>
                    </div>
                    <div class="supply-type-info">
                        <p><strong>Использование зелий:</strong> Использование зелий во время сражения стоит 1 Выносливость. Зелье также можно использовать на другом жуке, если он не против.</p>
                        <p><strong>Вес зелий:</strong> Все зелья считаются легкими.</p>
                        <p><strong>Алкогольные напитки:</strong> Алкогольные напитки считаются зельями из-за наличия у них крепости.</p>
                    </div>
                </div>

                <!-- Поля для Склянок -->
                <div id="supply-fields-vials" class="supply-type-fields" style="display: ${supply?.type === 'vials' ? 'block' : 'none'}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supply-vials-rarity"><i class="fas fa-star equipment-field-icon"></i>Редкость</label>
                            <select id="supply-vials-rarity" class="form-control">
                                <option value="">Не выбрана</option>
                                <option value="Обычная" ${supply?.rarity === 'Обычная' ? 'selected' : ''}>Обычная</option>
                                <option value="Необычная" ${supply?.rarity === 'Необычная' ? 'selected' : ''}>Необычная</option>
                                <option value="Редкая" ${supply?.rarity === 'Редкая' ? 'selected' : ''}>Редкая</option>
                                <option value="Уникальная" ${supply?.rarity === 'Уникальная' ? 'selected' : ''}>Уникальная</option>
                                <option value="Легендарная" ${supply?.rarity === 'Легендарная' ? 'selected' : ''}>Легендарная</option>
                                <option value="Проклятая" ${supply?.rarity === 'Проклятая' ? 'selected' : ''}>Проклятая</option>
                                <option value="Хрупкая" ${supply?.rarity === 'Хрупкая' ? 'selected' : ''}>Хрупкая</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="supply-vials-restoration"><i class="fas fa-heart equipment-field-icon"></i>Восстановление ${this.infoTooltip('Некоторые склянки помечены как восстанавливающиеся. Их можно использовать только один раз за сцену с помощью черт, которые позволяют применять эффекты склянок, но они могут быть использованы и как обычно.')}</label>
                            <select id="supply-vials-restoration" class="form-control">
                                <option value="no" ${supply?.restoration === false || supply?.restoration === 'no' ? 'selected' : ''}>Нет</option>
                                <option value="yes" ${supply?.restoration === true || supply?.restoration === 'yes' ? 'selected' : ''}>Да</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supply-vials-cost"><i class="fas fa-coins equipment-field-icon"></i>Цена</label>
                            <input type="number" step="1" id="supply-vials-cost" class="form-control" value="${supply?.cost || 0}">
                        </div>
                        <div class="form-group">
                            <label for="supply-vials-quantity"><i class="fas fa-layer-group equipment-field-icon"></i>Количество</label>
                            <input type="number" step="1" id="supply-vials-quantity" class="form-control" value="${supply?.quantity || 1}">
                        </div>
                    </div>
                        <div class="form-group">
                            <label for="supply-vials-directed-effect"><i class="fas fa-bullseye equipment-field-icon"></i>Направленный эффект ${this.infoTooltip('Направленные эффекты применяются, когда цель — один жук, в которого попала склянка.')}</label>
                            <textarea id="supply-vials-directed-effect" class="form-control" rows="2">${supply?.directedEffect || ''}</textarea>
                        </div>
                    <div class="form-group">
                        <label for="supply-vials-area-effect"><i class="fas fa-expand equipment-field-icon"></i>Эффект окружения ${this.infoTooltip('Эффекты окружения применяются, когда бросок склянки направлен на клетку. Такие эффекты считаются площадными атаками при попытке защититься от них.')}</label>
                        <textarea id="supply-vials-area-effect" class="form-control" rows="2">${supply?.areaEffect || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="supply-vials-area-effect-plus"><i class="fas fa-expand-arrows-alt equipment-field-icon"></i>Эффект окружения+ ${this.infoTooltip('Если эффект окружения помечен как эффект Окружение+, радиус зоны действия эффекта или размер Конуса увеличивается на один. Это свойство не применяется, если эффект от склянки уже применяется как площадная атака не Конусом или зона действия эффекта распространяется дальше, чем на одну клетку.')}</label>
                        <textarea id="supply-vials-area-effect-plus" class="form-control" rows="2">${supply?.areaEffectPlus || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="supply-vials-ingest-effect"><i class="fas fa-capsules equipment-field-icon"></i>Эффект приёма внутрь ${this.infoTooltip('Эффекты приема внутрь срабатывают, когда жук тратит 1 Выносливость, чтобы наложить его на себя или на желающего или беспомощного жука в пределах одной клетки.')}</label>
                        <textarea id="supply-vials-ingest-effect" class="form-control" rows="2">${supply?.ingestEffect || ''}</textarea>
                    </div>
                    <div class="supply-type-info">
                        <p>Склянки — это маленькие удобные сосуды, в которых жуки хранят жидкости и порошки для дальнейшего использования. Содержимое склянок может быть самым разным: от воды и клея до драгоценной Живокрови и даже странных алхимических составов.</p>
                        <p>Не каждая склянка обязательно должна быть стеклянной! Склянки могут выглядеть как маленькие глиняные бомбочки или разрывные пакетики.</p>
                        <p><strong>Вес:</strong> Все склянки считаются легкими.</p>
                        <p><strong>Метательные склянки:</strong> Когда склянка брошена, она уничтожается. Склянки бросаются как оружие дальнего боя с Дальностью (4) и Качеством 0, если бросать их рукой. Склянки не наносят урона, независимо от бонусов, и для урона от их эффектов броски не делаются.</p>
                        <p>Склянки с затяжным эффектом, но без указанного срока действия, действуют 3 раунда, после чего теряют свою силу.</p>
                    </div>
                </div>

                <!-- Поля для Ядов -->
                <div id="supply-fields-poisons" class="supply-type-fields" style="display: ${supply?.type === 'poisons' ? 'block' : 'none'}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supply-poisons-rarity"><i class="fas fa-star equipment-field-icon"></i>Редкость</label>
                            <select id="supply-poisons-rarity" class="form-control">
                                <option value="">Не выбрана</option>
                                <option value="Обычная" ${supply?.rarity === 'Обычная' ? 'selected' : ''}>Обычная</option>
                                <option value="Необычная" ${supply?.rarity === 'Необычная' ? 'selected' : ''}>Необычная</option>
                                <option value="Редкая" ${supply?.rarity === 'Редкая' ? 'selected' : ''}>Редкая</option>
                                <option value="Уникальная" ${supply?.rarity === 'Уникальная' ? 'selected' : ''}>Уникальная</option>
                                <option value="Легендарная" ${supply?.rarity === 'Легендарная' ? 'selected' : ''}>Легендарная</option>
                                <option value="Проклятая" ${supply?.rarity === 'Проклятая' ? 'selected' : ''}>Проклятая</option>
                                <option value="Хрупкая" ${supply?.rarity === 'Хрупкая' ? 'selected' : ''}>Хрупкая</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="supply-poisons-doses"><i class="fas fa-prescription-bottle equipment-field-icon"></i>Дозы ${this.infoTooltip('Яд держится на оружии, пока не будет совершено несколько попаданий, равных количеству его Доз. После нанесения на цель эффект яда длится до конца сцены, после чего нанесенные яды теряют свою силу и пропадают, если не указано обратное.')}</label>
                            <input type="text" id="supply-poisons-doses" class="form-control" value="${supply?.doses || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supply-poisons-cost"><i class="fas fa-coins equipment-field-icon"></i>Цена</label>
                            <input type="number" step="1" id="supply-poisons-cost" class="form-control" value="${supply?.cost || 0}">
                        </div>
                        <div class="form-group">
                            <label for="supply-poisons-quantity"><i class="fas fa-layer-group equipment-field-icon"></i>Количество</label>
                            <input type="number" step="1" id="supply-poisons-quantity" class="form-control" value="${supply?.quantity || 1}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="supply-poisons-description"><i class="fas fa-scroll equipment-field-icon"></i>Описание</label>
                        <textarea id="supply-poisons-description" class="form-control" rows="2">${supply?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="supply-poisons-effect"><i class="fas fa-skull equipment-field-icon"></i>Эффект</label>
                        <textarea id="supply-poisons-effect" class="form-control" rows="2">${supply?.effect || ''}</textarea>
                    </div>
                    <div class="supply-type-info">
                        <p>Яды — это смеси, приготовленные специально для нанесения на оружие.</p>
                        <p><strong>Вес:</strong> Как и склянки, яды считаются легкими.</p>
                        <p><strong>Использование ядов:</strong> Нанесение яда на оружие тратит 1 Выносливость. Не каждое оружие подходит для нанесения яда, поскольку большинство ядов попадает в кровь только вместе с колющими и режущими атаками.</p>
                    </div>
                </div>

                <!-- Поля для Ловушек -->
                <div id="supply-fields-traps" class="supply-type-fields" style="display: ${supply?.type === 'traps' ? 'block' : 'none'}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supply-traps-rarity"><i class="fas fa-star equipment-field-icon"></i>Редкость</label>
                            <select id="supply-traps-rarity" class="form-control">
                                <option value="">Не выбрана</option>
                                <option value="Обычная" ${supply?.rarity === 'Обычная' ? 'selected' : ''}>Обычная</option>
                                <option value="Необычная" ${supply?.rarity === 'Необычная' ? 'selected' : ''}>Необычная</option>
                                <option value="Редкая" ${supply?.rarity === 'Редкая' ? 'selected' : ''}>Редкая</option>
                                <option value="Уникальная" ${supply?.rarity === 'Уникальная' ? 'selected' : ''}>Уникальная</option>
                                <option value="Легендарная" ${supply?.rarity === 'Легендарная' ? 'selected' : ''}>Легендарная</option>
                                <option value="Проклятая" ${supply?.rarity === 'Проклятая' ? 'selected' : ''}>Проклятая</option>
                                <option value="Хрупкая" ${supply?.rarity === 'Хрупкая' ? 'selected' : ''}>Хрупкая</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="supply-traps-reusable"><i class="fas fa-recycle equipment-field-icon"></i>Многоразовая ${this.infoTooltip('Ловушку можно установить заново за 1 Выносливость, если она многоразовая. Чтобы поднять и убрать многоразовую ловушку, которую уже активировали или обезвредили, необходима Концентрация.')}</label>
                            <select id="supply-traps-reusable" class="form-control">
                                <option value="no" ${supply?.reusable === false || supply?.reusable === 'no' ? 'selected' : ''}>Нет</option>
                                <option value="yes" ${supply?.reusable === true || supply?.reusable === 'yes' ? 'selected' : ''}>Да</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supply-traps-weight"><i class="fas fa-weight-hanging equipment-field-icon"></i>Вес</label>
                            <input type="number" step="0.5" id="supply-traps-weight" class="form-control" value="${supply?.weight || 0}">
                        </div>
                        <div class="form-group">
                            <label for="supply-traps-cost"><i class="fas fa-coins equipment-field-icon"></i>Цена</label>
                            <input type="number" step="1" id="supply-traps-cost" class="form-control" value="${supply?.cost || 0}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="supply-traps-quantity"><i class="fas fa-layer-group equipment-field-icon"></i>Количество</label>
                            <input type="number" step="1" id="supply-traps-quantity" class="form-control" value="${supply?.quantity || 1}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="supply-traps-effect"><i class="fas fa-bolt equipment-field-icon"></i>Эффект</label>
                        <textarea id="supply-traps-effect" class="form-control" rows="2">${supply?.effect || ''}</textarea>
                    </div>
                    <div class="supply-type-info">
                        <p><strong>Установка ловушек:</strong> Установка ловушки тратит 1 Выносливость. Сделать это можно в любом свободном месте рядом с собой.</p>
                        <p><strong>Клетка активации:</strong> Пространство, которое занимает ловушка, называется клеткой активации, причем у некоторых ловушек их может быть несколько. Когда кто-то попадает в клетку активации ловушки, она срабатывает (если только она не активируется иным способом). Ловушка для одной цели воздействует на жука, который активирует ее.</p>
                        <p><strong>Атакующие ловушки:</strong> Для расчета атаки ловушек используются фиксированные значения успеха вместо бросков кубиков.</p>
                        <p><strong>Спрятанные ловушки:</strong> Спрятанные ловушки очень сложно заметить случайно. Чтобы обнаружить их, обычно нужно делать проверку соответствующих навыков.</p>
                        <p><strong>Обезвреживание ловушек:</strong> Для обезвреживания ловушки требуется 1 Выносливость и проверка соответствующего навыка. Проваленная попытка обезвредить ловушку активирует ее.</p>
                    </div>
                </div>
            </form>
        `;

        const modal = this.createModal(
            supplyIndex !== null ? 'Редактировать расходник' : 'Добавить расходник',
            modalContent,
            () => this.saveSupply(supplyIndex)
        );

        // Динамическое отображение полей в зависимости от типа
        const typeSelect = modal.querySelector('#supply-type');
        typeSelect.addEventListener('change', (e) => {
            this.updateSupplyFields(e.target.value);
        });

        document.body.appendChild(modal);
    }

    updateSupplyFields(type) {
        const allFields = document.querySelectorAll('.supply-type-fields');
        allFields.forEach(f => f.style.display = 'none');

        const targetFields = document.getElementById(`supply-fields-${type}`);
        if (targetFields) {
            targetFields.style.display = 'block';
        }
    }

    saveSupply(supplyIndex = null) {
        const form = document.getElementById('supply-form');
        if (!form) return;

        const type = document.getElementById('supply-type').value;
        const name = document.getElementById('supply-name').value;

        if (!name.trim()) {
            alert('Пожалуйста, введите название расходника.');
            return;
        }

        let supplyData = {
            type: type,
            name: name
        };

        if (type === 'food') {
            supplyData.satiety = parseInt(document.getElementById('supply-food-satiety').value) || 0;
            supplyData.weight = parseFloat(document.getElementById('supply-food-weight').value) || 0;
            supplyData.cost = parseInt(document.getElementById('supply-food-cost').value) || 0;
            supplyData.quantity = parseInt(document.getElementById('supply-food-quantity').value) || 1;
            supplyData.note = document.getElementById('supply-food-note').value;
        } else if (type === 'potions') {
            supplyData.rarity = document.getElementById('supply-potions-rarity').value;
            supplyData.strength = document.getElementById('supply-potions-strength').value;
            supplyData.cost = parseInt(document.getElementById('supply-potions-cost').value) || 0;
            supplyData.quantity = parseInt(document.getElementById('supply-potions-quantity').value) || 1;
            supplyData.effect = document.getElementById('supply-potions-effect').value;
            supplyData.overdose = document.getElementById('supply-potions-overdose').value;
        } else if (type === 'vials') {
            supplyData.rarity = document.getElementById('supply-vials-rarity').value;
            const restorationVal = document.getElementById('supply-vials-restoration').value;
            supplyData.restoration = restorationVal === 'yes';
            supplyData.cost = parseInt(document.getElementById('supply-vials-cost').value) || 0;
            supplyData.quantity = parseInt(document.getElementById('supply-vials-quantity').value) || 1;
            supplyData.directedEffect = document.getElementById('supply-vials-directed-effect').value;
            supplyData.areaEffect = document.getElementById('supply-vials-area-effect').value;
            supplyData.areaEffectPlus = document.getElementById('supply-vials-area-effect-plus').value;
            supplyData.ingestEffect = document.getElementById('supply-vials-ingest-effect').value;
        } else if (type === 'poisons') {
            supplyData.rarity = document.getElementById('supply-poisons-rarity').value;
            supplyData.doses = document.getElementById('supply-poisons-doses').value;
            supplyData.cost = parseInt(document.getElementById('supply-poisons-cost').value) || 0;
            supplyData.quantity = parseInt(document.getElementById('supply-poisons-quantity').value) || 1;
            supplyData.description = document.getElementById('supply-poisons-description').value;
            supplyData.effect = document.getElementById('supply-poisons-effect').value;
        } else if (type === 'traps') {
            supplyData.rarity = document.getElementById('supply-traps-rarity').value;
            const reusableVal = document.getElementById('supply-traps-reusable').value;
            supplyData.reusable = reusableVal === 'yes';
            supplyData.weight = parseFloat(document.getElementById('supply-traps-weight').value) || 0;
            supplyData.cost = parseInt(document.getElementById('supply-traps-cost').value) || 0;
            supplyData.quantity = parseInt(document.getElementById('supply-traps-quantity').value) || 1;
            supplyData.effect = document.getElementById('supply-traps-effect').value;
        }

        if (supplyIndex !== null) {
            characterSheet.state.supplies[supplyIndex] = supplyData;
        } else {
            characterSheet.state.supplies.push(supplyData);
        }

        characterSheet.saveState();
        this.renderBlock();
        characterSheet.updateAllCharacteristics();

        document.querySelector('.modal.active')?.remove();
    }

    removeSupply(index, button) {
        if (confirm('Удалить этот расходник?')) {
            characterSheet.state.supplies.splice(index, 1);
            characterSheet.saveState();
            this.renderBlock();
            characterSheet.updateAllCharacteristics();
        } else {
            button.disabled = false;
        }
    }

    // Обновляет только индикатор припасов в заголовке, без перерендера всего блока
    updateSuppliesDisplay() {
        const suppliesHeader = document.querySelector('.supplies-header');
        if (!suppliesHeader) return;
        
        this.calculateMaxSupplies();
        const suppliesCurrent = characterSheet.state.suppliesCurrent || 0;
        const totalMax = characterSheet.state.suppliesMax || 0;
        const suppliesAdjustment = characterSheet.state.suppliesAdjustment || 0;
        const adjustedMax = Math.max(0, totalMax + suppliesAdjustment);
        
        // Обновляем только отображение текущих/максимум припасов
        const suppliesText = suppliesHeader.querySelector('.supplies-indicator span[style*="font-weight: 500"]');
        const suppliesInput = suppliesHeader.querySelector('#max-supplies-input');
        if (suppliesText) suppliesText.textContent = suppliesCurrent;
        if (suppliesInput) {
            suppliesInput.value = adjustedMax;
            this.setInputWidth(suppliesInput);
        }
    }

    updateLoadDisplay() {
        const suppliesHeader = document.querySelector('.supplies-header');
        if (!suppliesHeader) return;
        
        const loadDisplayElement = suppliesHeader.querySelector('.load-display');
        if (!loadDisplayElement) return;
        
        // Обновляем только текстовое значение нагрузки и input, не пересоздавая весь HTML
        const load = characterSheet.calculateLoad();
        const baseMight = characterSheet.state.characteristics.base.might;
        const mightMod = characterSheet.state.characteristics.modifiers.might || 0;
        const totalMight = baseMight + mightMod;
        const loadModifier = characterSheet.state.characteristics.modifiers.load || 0;
        const loadAdjustment = characterSheet.state.loadAdjustment || 0;
        const maxLoad = totalMight + loadModifier + loadAdjustment;
        
        // Обновляем span с текущей нагрузкой
        const loadSpan = document.getElementById('load-current-display');
        if (loadSpan) {
            loadSpan.textContent = load.current;
        }
        
        // Обновляем input макс нагрузки
        const loadInput = document.getElementById('max-load-input-supplies');
        if (loadInput) {
            loadInput.value = maxLoad;
            // Не меняем ширину при обновлении значения
        }
    }

    createModal(title, content, onSave) {
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
                    <button class="btn close-modal">Отмена</button>
                    <button class="btn" id="save-modal-btn">Сохранить</button>
                </div>
            </div>
        `;

        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });

        modal.querySelector('#save-modal-btn').addEventListener('click', () => {
            if (onSave) onSave();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }
}

// Инициализация
window.suppliesManager = new SuppliesManager();