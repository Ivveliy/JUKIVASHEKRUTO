// equipment.js - Блок снаряжения
class EquipmentManager {
    constructor() {
        this.clickHandler = null;
        this.changeHandler = null;
        this.inputHandler = null;
        this.init();
    }

    // Форматирование текста описания: сохранение переносов и абзацев
    formatDescription(text) {
        if (!text || text.trim() === '') return '';
        // Сначала разбиваем по двойным переносам на абзацы
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim() !== '');
        // Внутри каждого абзаца одиночные переносы заменяем на <br>
        return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>').trim()}</p>`).join('');
    }

    init() {
        this.renderBlock();
        this.setupEventListeners();
        window.updateEquipmentDisplay = () => this.updateLoadDisplay();
        // Инициализация ширины полей после рендера
        setTimeout(() => this.initInputWidths(), 0);
    }

    renderBlock() {
        const content = document.getElementById('content-equipment');
        if (!content) return;

        content.innerHTML = `
            <div class="equipment-header" style="margin-bottom: 15px; padding: 10px; background-color: var(--light-bg); border-radius: var(--radius);">
                <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                    <div class="geo-display">
                        <strong><i class="fas fa-coins"></i> Гео:</strong>
                        <input type="number" step="1" id="geo-input" class="compact-input"
                               value="${characterSheet.state.geo || 0}" min="0">
                    </div>
                    <div class="load-display">
                        <strong><i class="fas fa-weight-hanging"></i> Нагрузка:</strong>
                        ${this.renderCompactLoadDisplay()}
                    </div>
                </div>
            </div>

            <button class="add-btn" id="add-equipment-btn" style="margin-bottom: 15px;">
                <i class="fas fa-plus"></i> Добавить снаряжение
            </button>

            <div class="equipment-categories">
                ${this.renderEquipmentCategories()}
            </div>
        `;
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
            <span>${load.current} / ${maxLoad}</span>
            <input type="number" step="0.5" id="max-load-input" class="compact-input"
                   value="${maxLoad}" min="0" title="Максимальная нагрузка">
            <small style="color: #666; margin-left: 8px;">(Мощь: ${totalMight}${loadModifier !== 0 ? (loadModifier > 0 ? ' + ' + loadModifier : ' - ' + Math.abs(loadModifier)) : ''}${loadAdjustment !== 0 ? (loadAdjustment > 0 ? ' + ' + loadAdjustment : ' - ' + Math.abs(loadAdjustment)) : ''})</small>
        `;
    }

    // Установить ширину поля на основе содержимого
    setInputWidth(input) {
        if (!input) return;
        const value = input.value || '0';
        // Создаём временный элемент для измерения ширины текста
        const temp = document.createElement('span');
        temp.style.cssText = 'visibility: hidden; position: absolute; white-space: nowrap; font-size: inherit; font-family: inherit; font-weight: inherit;';
        temp.textContent = value;
        document.body.appendChild(temp);
        const width = temp.offsetWidth;
        document.body.removeChild(temp);
        // Устанавливаем ширину + отступы (padding 6px слева и справа) + запас для границы
        input.style.width = (width + 20) + 'px';
    }
    
    renderEquipmentCategories() {
        const categories = {
            weapons: { name: 'Оружие', items: [] },
            armor: { name: 'Броня', items: [] },
            other: { name: 'Прочее', items: [] }
        };

        // Сортируем предметы по категориям
        characterSheet.state.equipment.forEach(item => {
            if (categories[item.category]) {
                categories[item.category].items.push(item);
            }
        });

        let html = '';

        Object.entries(categories).forEach(([key, category]) => {
            if (category.items.length > 0) {
                // Рассчитываем общую стоимость категории
                const totalCost = category.items.reduce((sum, item) => {
                    const itemCost = item.cost || 0;
                    const quantity = item.quantity || 1;
                    return sum + (itemCost * quantity);
                }, 0);

                html += `
                    <div class="equipment-category">
                        <h4>
                            ${category.name}
                            <span class="category-total-cost">
                                <i class="fas fa-coins"></i> ${totalCost} гео
                            </span>
                        </h4>
                        ${category.items.map((item) => {
                            const globalIndex = characterSheet.state.equipment.findIndex(eq => eq === item);
                            return this.renderEquipmentItem(item, globalIndex);
                        }).join('')}
                    </div>
                `;
            }
        });

        if (!html) {
            html = '<p class="empty-list">Снаряжение отсутствует</p>';
        }

        return html;
    }
    
    renderEquipmentItem(item, index) {
        let compactDetails = '';
        let modifications = '';
        let hasModifications = false;

        // Определяем иконку в зависимости от категории
        let equipmentIcon = '';
        if (item.category === 'weapons') {
            equipmentIcon = '<i class="fas fa-sword equipment-icon"></i>';
        } else if (item.category === 'armor') {
            equipmentIcon = '<i class="fas fa-shield-alt equipment-icon"></i>';
        } else {
            equipmentIcon = '<i class="fas fa-box equipment-icon"></i>';
        }

        // Инициализируем used для старых предметов (обратная совместимость)
        if (item.used === undefined) {
            item.used = false;
        }

        // Инициализируем quantity для старых предметов (обратная совместимость)
        if (item.quantity === undefined) {
            item.quantity = 1;
        }

        // Получаем класс качества
        const qualityClass = this.getQualityClass(item.quality || 1);

        if (item.category === 'weapons') {
            // Компактное отображение: Тип | Урон | Дальность | Качество | Стоимость
            let detailsParts = [
                `<i class="fas fa-khanda equipment-field-icon"></i>${item.weaponType || 'Не указан'}`,
                `<i class="fas fa-crosshairs equipment-field-icon"></i>${item.damage || '0'} (${item.damageType || 'не указан'})`
            ];
            if (item.range) detailsParts.push(`<i class="fas fa-arrows-alt equipment-field-icon"></i>${item.range}`);
            detailsParts.push(`<i class="fas fa-star equipment-field-icon"></i><span class="${qualityClass}">Качество: ${item.quality || '1'}</span>`);
            detailsParts.push(`<i class="fas fa-coins equipment-field-icon"></i>${item.cost || 0} гео`);

            compactDetails = `<div class="item-compact-details"><small>${detailsParts.join(' • ')}</small></div>`;

            if (item.modifications) {
                hasModifications = true;
                modifications = `<div><small>Модификации: ${item.modifications}</small></div>`;
            }
        } else if (item.category === 'armor') {
            // Компактное отображение: ПУ | Качество | Прочность | Стоимость
            let detailsParts = [
                `<i class="fas fa-shield-alt equipment-field-icon"></i>ПУ: ${item.absorption || '0'}`,
                `<i class="fas fa-star equipment-field-icon"></i><span class="${qualityClass}">Качество: ${item.quality || '1'}</span>`
            ];
            if (item.durability !== undefined) {
                detailsParts.push(`<i class="fas fa-heart equipment-field-icon"></i>Прочность: ${item.durability}`);
            }
            detailsParts.push(`<i class="fas fa-coins equipment-field-icon"></i>${item.cost || 0} гео`);

            compactDetails = `<div class="item-compact-details"><small>${detailsParts.join(' • ')}</small></div>`;

            if (item.modifications) {
                hasModifications = true;
                modifications = `<div><small>Модификации: ${item.modifications}</small></div>`;
            }
        } else {
            // Для прочего - описание и стоимость
            let otherDetailsParts = [];
            if (item.description) {
                otherDetailsParts.push(`<i class="fas fa-scroll equipment-field-icon"></i>${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}`);
            }
            otherDetailsParts.push(`<i class="fas fa-coins equipment-field-icon"></i>${item.cost || 0} гео`);
            compactDetails = `<div class="item-compact-details"><small>${otherDetailsParts.join(' • ')}</small></div>`;
        }

        // Переключатель "используется" для оружия и брони
        const useToggle = (item.category === 'weapons' || item.category === 'armor') ? `
            <label class="equipment-use-toggle" title="${item.used ? 'Не используется' : 'Используется'}">
                <input type="checkbox" class="equipment-use-checkbox" data-index="${index}" ${item.used ? 'checked' : ''}>
                <i class="fas ${item.used ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            </label>
        ` : '';

        // Счётчик количества для прочего
        const quantityControl = item.category === 'other' ? `
            <div class="item-quantity-control" title="Количество предметов">
                <button type="button" class="item-quantity-btn" data-index="${index}" data-action="dec">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="item-quantity-display">${item.quantity} шт.</span>
                <button type="button" class="item-quantity-btn" data-index="${index}" data-action="inc">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        ` : '';

        return `
            <div class="list-item" data-index="${index}">
                <div>
                    <div style="display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;">
                        ${useToggle}
                        ${equipmentIcon}<strong class="equipment-weight">${item.name}</strong>
                        <span class="item-weight-badge equipment-weight"><small>${item.weight || 0}</small><i class="fas fa-weight-hanging weight-icon"></i></span>
                        ${quantityControl}
                    </div>
                    ${compactDetails}
                    ${hasModifications ? `
                    <div class="item-modifications hidden" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease;">
                        ${modifications}
                    </div>
                    ` : ''}
                </div>
                <div class="list-item-controls">
                    ${hasModifications ? `
                    <button class="toggle-description" title="Показать модификации">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    ` : ''}
                    <button class="edit-equipment" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="remove-equipment" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getQualityClass(quality) {
        const q = parseInt(quality) || 0;
        if (q < 0) return 'quality-negative';
        if (q === 0) return 'quality-0';
        if (q === 1) return 'quality-1';
        if (q === 2) return 'quality-2';
        if (q === 3) return 'quality-3';
        if (q >= 4) return 'quality-4';
        return 'quality-1';
    }

    setupEventListeners() {
        // Удаляем старые обработчики если они есть
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }
        if (this.changeHandler) {
            document.removeEventListener('change', this.changeHandler);
        }
        if (this.inputHandler) {
            document.removeEventListener('input', this.inputHandler);
        }

        // Создаём новые обработчики
        this.clickHandler = (e) => {
            if (e.target.closest('#add-equipment-btn')) {
                this.showEquipmentModal();
            } else if (e.target.closest('.edit-equipment')) {
                e.preventDefault();
                e.stopPropagation();
                const index = e.target.closest('.list-item').dataset.index;
                this.showEquipmentModal(index);
            } else if (e.target.closest('.remove-equipment')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.closest('.remove-equipment');
                const index = button.closest('.list-item').dataset.index;
                button.disabled = true;
                this.removeEquipment(index, button);
            } else if (e.target.closest('.toggle-description')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.toggle-description');
                const listItem = btn.closest('.list-item');
                const modifications = listItem.querySelector('.item-modifications');
                const icon = btn.querySelector('i');

                if (modifications && icon) {
                    const isHidden = modifications.classList.contains('hidden');

                    if (isHidden) {
                        modifications.classList.remove('hidden');
                        modifications.style.maxHeight = (modifications.scrollHeight + 20) + 'px';
                        icon.className = 'fas fa-chevron-up';
                        btn.title = 'Скрыть модификации';
                    } else {
                        modifications.classList.add('hidden');
                        modifications.style.maxHeight = '0';
                        icon.className = 'fas fa-chevron-down';
                        btn.title = 'Показать модификации';
                    }
                }
            } else if (e.target.closest('.durability-dec')) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(e.target.closest('.durability-dec').dataset.index);
                this.changeDurability(index, -1);
            } else if (e.target.closest('.durability-inc')) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(e.target.closest('.durability-inc').dataset.index);
                this.changeDurability(index, 1);
            } else if (e.target.closest('.equipment-use-checkbox')) {
                e.preventDefault();
                e.stopPropagation();
                const checkbox = e.target.closest('.equipment-use-checkbox');
                const index = parseInt(checkbox.dataset.index);
                this.toggleEquipmentUse(index, checkbox.checked);
            } else if (e.target.closest('.equipment-use-toggle')) {
                // Клик по label тоже переключает
                e.preventDefault();
                e.stopPropagation();
                const toggle = e.target.closest('.equipment-use-toggle');
                const checkbox = toggle.querySelector('.equipment-use-checkbox');
                const index = parseInt(checkbox.dataset.index);
                this.toggleEquipmentUse(index, !checkbox.checked);
            } else if (e.target.closest('.item-quantity-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.item-quantity-btn');
                const index = parseInt(btn.dataset.index);
                const action = btn.dataset.action;
                this.changeQuantity(index, action === 'inc' ? 1 : -1);
            }
        };

        // Обработчик для установки ширины после изменения значения
        this.blurHandler = (e) => {
            if (e.target.classList.contains('compact-input')) {
                this.setInputWidth(e.target);
            }
        };

        // Обработчик для сохранения после потери фокуса (вместо input)
        this.changeHandlerCompact = (e) => {
            if (e.target.id === 'max-load-input') {
                const newMaxLoad = parseFloat(e.target.value) || 0;
                const baseMight = characterSheet.state.characteristics.base.might;
                const mightMod = characterSheet.state.characteristics.modifiers.might || 0;
                const totalMight = baseMight + mightMod;
                const loadModifier = characterSheet.state.characteristics.modifiers.load || 0;
                // Сохраняем только ручную корректировку
                characterSheet.state.loadAdjustment = newMaxLoad - totalMight - loadModifier;
                characterSheet.saveState();
                this.updateLoadDisplay();
            }
            if (e.target.id === 'geo-input') {
                characterSheet.state.geo = parseInt(e.target.value) || 0;
                characterSheet.saveState();
                this.setInputWidth(e.target);
            }
        };

        document.addEventListener('click', this.clickHandler);
        document.addEventListener('change', this.changeHandlerCompact);
        document.addEventListener('blur', this.blurHandler, true);
    }

    // Очистка обработчиков
    cleanupEventListeners() {
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }
        if (this.changeHandlerCompact) {
            document.removeEventListener('change', this.changeHandlerCompact);
        }
        if (this.blurHandler) {
            document.removeEventListener('blur', this.blurHandler, true);
        }
    }

    // Инициализация ширины полей после рендера
    initInputWidths() {
        const inputs = document.querySelectorAll('.compact-input');
        inputs.forEach(input => this.setInputWidth(input));
    }

    showEquipmentModal(equipmentIndex = null) {
        const equipment = equipmentIndex !== null ?
            characterSheet.state.equipment[equipmentIndex] :
            null;

        // Инициализируем used и quantity для старых предметов
        const used = equipment?.used || false;
        const quantity = equipment?.quantity || 1;

        const modalContent = `
            <form id="equipment-form">
                <div class="form-group">
                    <label for="equipment-category">Категория</label>
                    <select id="equipment-category" class="form-control" required>
                        <option value="weapons" ${equipment?.category === 'weapons' ? 'selected' : ''}>Оружие</option>
                        <option value="armor" ${equipment?.category === 'armor' ? 'selected' : ''}>Броня</option>
                        <option value="other" ${equipment?.category === 'other' ? 'selected' : ''}>Прочее</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="equipment-name">Название</label>
                    <input type="text" id="equipment-name" class="form-control" value="${equipment?.name || ''}" required>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="equipment-weight"><i class="fas fa-weight-hanging equipment-field-icon"></i>Вес</label>
                        <input type="number" step="0.5" min="0" id="equipment-weight" class="form-control" value="${equipment?.weight || 0}" required>
                    </div>
                    <div class="form-group">
                        <label for="equipment-cost"><i class="fas fa-coins equipment-field-icon"></i>Стоимость</label>
                        <input type="number" step="1" min="0" id="equipment-cost" class="form-control" value="${equipment?.cost || 0}" placeholder="0">
                    </div>
                </div>

                <!-- Поля для оружия -->
                <div id="weapon-fields" style="display: ${equipment?.category === 'weapons' || !equipment ? 'block' : 'none'}">
                    <div class="form-row">
                        <div class="form-group" style="flex: 2;">
                            <label for="weapon-type"><i class="fas fa-khanda equipment-field-icon"></i>Тип оружия</label>
                            <input type="text" id="weapon-type" class="form-control" value="${equipment?.weaponType || ''}">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label for="weapon-range"><i class="fas fa-arrows-alt equipment-field-icon"></i>Дальность</label>
                            <input type="text" id="weapon-range" class="form-control" value="${equipment?.range || ''}" placeholder="например: 1-3">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="weapon-damage"><i class="fas fa-crosshairs equipment-field-icon"></i>Урон</label>
                            <input type="text" id="weapon-damage" class="form-control" value="${equipment?.damage || ''}" placeholder="1d6">
                        </div>
                        <div class="form-group">
                            <label for="weapon-damage-type"><i class="fas fa-sword equipment-field-icon"></i>Тип урона</label>
                            <input type="text" id="weapon-damage-type" class="form-control" value="${equipment?.damageType || ''}" placeholder="рубящий">
                        </div>
                        <div class="form-group">
                            <label for="weapon-quality"><i class="fas fa-star equipment-field-icon"></i>Качество</label>
                            <input type="number" step="1" min="1" id="weapon-quality" class="form-control" value="${equipment?.quality || 1}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="weapon-modifications"><i class="fas fa-wrench equipment-field-icon"></i>Модификации</label>
                        <textarea id="weapon-modifications" class="form-control" rows="2">${equipment?.modifications || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="weapon-used" ${used ? 'checked' : ''}>
                            <i class="fas fa-check-circle equipment-field-icon"></i>Используется
                        </label>
                    </div>
                </div>

                <!-- Поля для брони -->
                <div id="armor-fields" style="display: ${equipment?.category === 'armor' ? 'block' : 'none'}">
                    <div class="form-group">
                        <label for="armor-absorption"><i class="fas fa-shield-alt equipment-field-icon"></i>Поглощение урона (ПУ)</label>
                        <input type="text" id="armor-absorption" class="form-control" value="${equipment?.absorption || ''}">
                    </div>
                    <div class="form-group">
                        <label for="armor-quality"><i class="fas fa-star equipment-field-icon"></i>Качество</label>
                        <input type="number" step="1" min="1" id="armor-quality" class="form-control" value="${equipment?.quality || 1}">
                    </div>
                    <div class="form-group">
                        <label for="armor-durability"><i class="fas fa-heart equipment-field-icon"></i>Прочность</label>
                        <input type="text" id="armor-durability" class="form-control" value="${equipment?.durability || ''}" placeholder="например: 5/5">
                    </div>
                    <div class="form-group">
                        <label for="armor-modifications"><i class="fas fa-wrench equipment-field-icon"></i>Модификации</label>
                        <textarea id="armor-modifications" class="form-control" rows="2">${equipment?.modifications || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="armor-used" ${used ? 'checked' : ''}>
                            <i class="fas fa-check-circle equipment-field-icon"></i>Используется
                        </label>
                    </div>
                </div>

                <!-- Поля для прочего -->
                <div id="other-fields" style="display: ${equipment?.category === 'other' ? 'block' : 'none'}">
                    <div class="form-group">
                        <label for="other-description"><i class="fas fa-scroll equipment-field-icon"></i>Описание</label>
                        <textarea id="other-description" class="form-control" rows="3">${equipment?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="other-quantity"><i class="fas fa-layer-group equipment-field-icon"></i>Количество</label>
                        <input type="number" step="1" min="1" id="other-quantity" class="form-control" value="${quantity}">
                    </div>
                </div>
            </form>
        `;
        
        const modal = this.createModal(
            equipmentIndex !== null ? 'Редактировать снаряжение' : 'Добавить снаряжение',
            modalContent,
            () => this.saveEquipment(equipmentIndex)
        );
        
        // Динамическое отображение полей в зависимости от категории
        const categorySelect = modal.querySelector('#equipment-category');
        categorySelect.addEventListener('change', (e) => {
            this.updateEquipmentFields(e.target.value);
        });

        document.body.appendChild(modal);
    }

    changeDurability(index, amount) {
        const item = characterSheet.state.equipment[index];
        if (!item || item.category !== 'armor') return;

        const value = item.durability;
        // Проверяем формат "X/Y"
        const match = value.match(/^(\d+)\/(\d+)$/);
        if (match) {
            let current = parseInt(match[1]);
            const max = parseInt(match[2]);
            current = Math.max(0, Math.min(max, current + amount));
            item.durability = `${current}/${max}`;
        } else {
            // Если формат не "X/Y", просто увеличиваем/уменьшаем число
            const num = parseInt(value) || 0;
            item.durability = Math.max(0, num + amount).toString();
        }

        characterSheet.saveState();
        this.renderBlock();
    }

    toggleEquipmentUse(index, used) {
        const item = characterSheet.state.equipment[index];
        if (!item) return;

        item.used = used;
        characterSheet.saveState();
        this.renderBlock();
    }

    changeQuantity(index, amount) {
        const item = characterSheet.state.equipment[index];
        if (!item || item.category !== 'other') return;

        // Инициализируем количество если нет
        if (item.quantity === undefined) {
            item.quantity = 1;
        }

        item.quantity = Math.max(1, item.quantity + amount);
        characterSheet.saveState();
        this.renderBlock();
    }

    updateEquipmentFields(category) {
        const weaponFields = document.getElementById('weapon-fields');
        const armorFields = document.getElementById('armor-fields');
        const otherFields = document.getElementById('other-fields');
        
        if (weaponFields) weaponFields.style.display = category === 'weapons' ? 'block' : 'none';
        if (armorFields) armorFields.style.display = category === 'armor' ? 'block' : 'none';
        if (otherFields) otherFields.style.display = category === 'other' ? 'block' : 'none';
    }
    
    saveEquipment(equipmentIndex = null) {
        const form = document.getElementById('equipment-form');
        if (!form) return;

        const category = document.getElementById('equipment-category').value;
        let equipmentData = {
            category: category,
            name: document.getElementById('equipment-name').value,
            weight: parseFloat(document.getElementById('equipment-weight').value) || 0,
            cost: parseInt(document.getElementById('equipment-cost').value) || 0
        };

        if (category === 'weapons') {
            equipmentData.weaponType = document.getElementById('weapon-type').value;
            equipmentData.range = document.getElementById('weapon-range').value;
            equipmentData.damage = document.getElementById('weapon-damage').value;
            equipmentData.damageType = document.getElementById('weapon-damage-type').value;
            equipmentData.quality = parseInt(document.getElementById('weapon-quality').value) || 1;
            equipmentData.modifications = document.getElementById('weapon-modifications').value;
            equipmentData.used = document.getElementById('weapon-used').checked;
        } else if (category === 'armor') {
            equipmentData.absorption = document.getElementById('armor-absorption').value;
            equipmentData.quality = parseInt(document.getElementById('armor-quality').value) || 1;
            equipmentData.durability = document.getElementById('armor-durability').value;
            equipmentData.modifications = document.getElementById('armor-modifications').value;
            equipmentData.used = document.getElementById('armor-used').checked;
        } else if (category === 'other') {
            equipmentData.description = document.getElementById('other-description').value;
            equipmentData.quantity = parseInt(document.getElementById('other-quantity').value) || 1;
        }

        if (equipmentIndex !== null) {
            characterSheet.state.equipment[equipmentIndex] = equipmentData;
        } else {
            characterSheet.state.equipment.push(equipmentData);
        }

        characterSheet.saveState();
        this.renderBlock();
        characterSheet.updateAllCharacteristics();

        document.querySelector('.modal.active')?.remove();
    }
    
    removeEquipment(index, button) {
        if (confirm('Удалить этот предмет снаряжения?')) {
            characterSheet.state.equipment.splice(index, 1);
            characterSheet.saveState();
            this.renderBlock();
            characterSheet.updateAllCharacteristics();
        } else {
            button.disabled = false;
        }
    }
    
    updateLoadDisplay() {
        const equipmentHeader = document.querySelector('.equipment-header');
        if (equipmentHeader) {
            const loadDisplay = this.renderCompactLoadDisplay();
            const loadDisplayElement = equipmentHeader.querySelector('.load-display');
            if (loadDisplayElement) {
                loadDisplayElement.innerHTML = `<strong><i class="fas fa-weight-hanging"></i> Нагрузка:</strong>${loadDisplay}`;
                // Устанавливаем ширину поля после обновления
                setTimeout(() => {
                    const maxLoadInput = document.getElementById('max-load-input');
                    if (maxLoadInput) this.setInputWidth(maxLoadInput);
                }, 0);
            }
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
window.equipmentManager = new EquipmentManager();
