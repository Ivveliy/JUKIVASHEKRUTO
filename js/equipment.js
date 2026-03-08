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
    }

    renderBlock() {
        const content = document.getElementById('content-equipment');
        if (!content) return;

        content.innerHTML = `
            <div class="equipment-header" style="margin-bottom: 15px; padding: 10px; background-color: var(--light-bg); border-radius: var(--radius);">
                <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                    <div class="geo-display">
                        <strong><i class="fas fa-coins"></i> Гео:</strong>
                        <input type="number" step="1" id="geo-input" class="form-control" style="width: 80px; display: inline-block;"
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
            <input type="number" step="0.5" id="max-load-input" class="form-control" style="width: 60px; margin-left: 8px; display: inline-block;"
                   value="${maxLoad}" min="0" title="Максимальная нагрузка">
            <small style="color: #666; margin-left: 8px;">(Мощь: ${totalMight}${loadModifier !== 0 ? (loadModifier > 0 ? ' + ' + loadModifier : ' - ' + Math.abs(loadModifier)) : ''}${loadAdjustment !== 0 ? (loadAdjustment > 0 ? ' + ' + loadAdjustment : ' - ' + Math.abs(loadAdjustment)) : ''})</small>
        `;
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
                html += `
                    <div class="equipment-category">
                        <h4>${category.name}</h4>
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

        if (item.category === 'weapons') {
            // Компактное отображение: Тип | Урон | Дальность | Качество
            let detailsParts = [
                `${item.weaponType || 'Не указан'}`,
                `${item.damage || '0'} (${item.damageType || 'не указан'})`
            ];
            if (item.range) detailsParts.push(`${item.range}`);
            detailsParts.push(`Качество: ${item.quality || '1'}`);
            detailsParts.push(`${item.cost || 0} гео`);
            
            compactDetails = `<div class="item-compact-details"><small>${detailsParts.join(' • ')}</small></div>`;
            
            if (item.modifications) {
                hasModifications = true;
                modifications = `<div><small>Модификации: ${item.modifications}</small></div>`;
            }
        } else if (item.category === 'armor') {
            // Компактное отображение: ПУ | Качество | Прочность | Стоимость
            let detailsParts = [
                `ПУ: ${item.absorption || '0'}`,
                `Качество: ${item.quality || '1'}`
            ];
            if (item.durability !== undefined) {
                detailsParts.push(`Прочность: ${item.durability}`);
            }
            detailsParts.push(`${item.cost || 0} гео`);
            
            compactDetails = `<div class="item-compact-details"><small>${detailsParts.join(' • ')}</small></div>`;
            
            if (item.modifications) {
                hasModifications = true;
                modifications = `<div><small>Модификации: ${item.modifications}</small></div>`;
            }
        } else {
            // Для прочего - только описание если есть
            compactDetails = item.description ? 
                `<div class="item-compact-details"><small>${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</small></div>` : 
                `<div class="item-compact-details"><small>Стоимость: ${item.cost || 0} гео</small></div>`;
        }

        return `
            <div class="list-item" data-index="${index}">
                <div>
                    <div style="display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;">
                        <strong>${item.name}</strong>
                        <span class="item-weight-badge"><small>${item.weight || 0}</small></span>
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
            }
        };

        this.changeHandler = (e) => {
            if (e.target.id === 'geo-input') {
                characterSheet.state.geo = parseInt(e.target.value) || 0;
                characterSheet.saveState();
            }
        };

        this.inputHandler = (e) => {
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
        };

        document.addEventListener('click', this.clickHandler);
        document.addEventListener('change', this.changeHandler);
        document.addEventListener('input', this.inputHandler);
    }

    showEquipmentModal(equipmentIndex = null) {
        const equipment = equipmentIndex !== null ? 
            characterSheet.state.equipment[equipmentIndex] : 
            null;
        
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
                        <label for="equipment-weight">Вес</label>
                        <input type="number" step="0.5" min="0" id="equipment-weight" class="form-control" value="${equipment?.weight || 0}" required>
                    </div>
                    <div class="form-group">
                        <label for="equipment-cost">Стоимость</label>
                        <input type="number" step="1" min="0" id="equipment-cost" class="form-control" value="${equipment?.cost || 0}" placeholder="0">
                    </div>
                </div>

                <!-- Поля для оружия -->
                <div id="weapon-fields" style="display: ${equipment?.category === 'weapons' || !equipment ? 'block' : 'none'}">
                    <div class="form-row">
                        <div class="form-group" style="flex: 2;">
                            <label for="weapon-type">Тип оружия</label>
                            <input type="text" id="weapon-type" class="form-control" value="${equipment?.weaponType || ''}">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label for="weapon-range">Дальность</label>
                            <input type="text" id="weapon-range" class="form-control" value="${equipment?.range || ''}" placeholder="например: 1-3">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="weapon-damage">Урон</label>
                            <input type="text" id="weapon-damage" class="form-control" value="${equipment?.damage || ''}" placeholder="1d6">
                        </div>
                        <div class="form-group">
                            <label for="weapon-damage-type">Тип урона</label>
                            <input type="text" id="weapon-damage-type" class="form-control" value="${equipment?.damageType || ''}" placeholder="рубящий">
                        </div>
                        <div class="form-group">
                            <label for="weapon-quality">Качество</label>
                            <input type="number" step="1" min="1" id="weapon-quality" class="form-control" value="${equipment?.quality || 1}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="weapon-modifications">Модификации</label>
                        <textarea id="weapon-modifications" class="form-control" rows="2">${equipment?.modifications || ''}</textarea>
                    </div>
                </div>

                <!-- Поля для брони -->
                <div id="armor-fields" style="display: ${equipment?.category === 'armor' ? 'block' : 'none'}">
                    <div class="form-group">
                        <label for="armor-absorption">Поглощение урона (ПУ)</label>
                        <input type="text" id="armor-absorption" class="form-control" value="${equipment?.absorption || ''}">
                    </div>
                    <div class="form-group">
                        <label for="armor-quality">Качество</label>
                        <input type="number" step="1" min="1" id="armor-quality" class="form-control" value="${equipment?.quality || 1}">
                    </div>
                    <div class="form-group">
                        <label for="armor-durability">Прочность</label>
                        <input type="text" id="armor-durability" class="form-control" value="${equipment?.durability || ''}" placeholder="например: 5/5">
                    </div>
                    <div class="form-group">
                        <label for="armor-modifications">Модификации</label>
                        <textarea id="armor-modifications" class="form-control" rows="2">${equipment?.modifications || ''}</textarea>
                    </div>
                </div>

                <!-- Поля для прочего -->
                <div id="other-fields" style="display: ${equipment?.category === 'other' ? 'block' : 'none'}">
                    <div class="form-group">
                        <label for="other-description">Описание</label>
                        <textarea id="other-description" class="form-control" rows="3">${equipment?.description || ''}</textarea>
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
        } else if (category === 'armor') {
            equipmentData.absorption = document.getElementById('armor-absorption').value;
            equipmentData.quality = parseInt(document.getElementById('armor-quality').value) || 1;
            equipmentData.durability = document.getElementById('armor-durability').value;
            equipmentData.modifications = document.getElementById('armor-modifications').value;
        } else if (category === 'other') {
            equipmentData.description = document.getElementById('other-description').value;
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
