// charms.js - Блок амулетов
class CharmsManager {
    constructor() {
        this.clickHandler = null;
        this.init();
    }
    
    init() {
        this.renderBlock();
        this.setupEventListeners();
        window.updateCharmsDisplay = () => this.updateSlotsDisplay();
        window.updateCharmSlotsFromPaths = () => {
            this.renderBlock();
        };
    }

    getPathRanksBonus() {
        return characterSheet.state.paths.reduce((sum, path) => sum + (path.rank || 0), 0);
    }

    renderBlock() {
        const content = document.getElementById('content-charms');
        if (!content) return;

        content.innerHTML = `
            <button class="add-btn" id="add-charm-btn" style="margin-bottom: 15px;">
                <i class="fas fa-plus"></i> Добавить амулет
            </button>
            
            <div class="charm-slots-container">
                <h3 style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-sliders-h"></i>
                    <span>Слоты для амулетов</span>
                    <button class="char-btn char-details" id="slots-info">
                        <i class="fas fa-info"></i>
                    </button>
                </h3>
                ${this.renderSlotsDisplay()}
            </div>

            <div class="equipped-charms">
                <h4>Надетые амулеты</h4>
                ${this.renderCharmsList(true)}
            </div>

            <div class="unequipped-charms" style="margin-top: 20px;">
                <h4>Не надетые амулеты</h4>
                ${this.renderCharmsList(false)}
            </div>
        `;
    }
    
    renderSlotsDisplay() {
        const equippedSlots = characterSheet.state.charms
            .filter(charm => charm.equipped)
            .reduce((sum, charm) => sum + (charm.slots || 1), 0);
        const baseSlots = 3;
        const pathRanksBonus = this.getPathRanksBonus();
        const manualAdjustment = characterSheet.state.charmSlots || 0;
        const totalSlots = baseSlots + pathRanksBonus + manualAdjustment;

        return `
            <div class="characteristic">
                <span class="char-name">Использовано слотов</span>
                <div class="char-value">
                    <span>${equippedSlots} / ${totalSlots}</span>
                </div>
            </div>

            <div class="characteristic">
                <span class="char-name">Всего слотов</span>
                <div class="char-value">
                    <input type="number" id="charm-slots-input" class="form-control" style="width: 80px;"
                           value="${totalSlots}" min="1">
                </div>
            </div>

            <div class="charm-sources" style="margin-top: 10px; padding: 10px; background-color: var(--light-bg); border-radius: var(--radius); font-size: 0.9em;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span><i class="fas fa-book"></i> Базовое значение:</span>
                    <span>${baseSlots}</span>
                </div>
                ${pathRanksBonus > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span><i class="fas fa-road"></i> Ранги путей:</span>
                        <span>+${pathRanksBonus}</span>
                    </div>
                ` : ''}
                ${manualAdjustment !== 0 ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span><i class="fas fa-edit"></i> Корректировка:</span>
                        <span>${manualAdjustment > 0 ? '+' : ''}${manualAdjustment}</span>
                    </div>
                ` : ''}
            </div>

            <div class="charm-slots">
                ${Array.from({length: totalSlots}, (_, i) => `
                    <div class="charm-slot ${i < equippedSlots ? 'filled' : ''}">
                        ${i < equippedSlots ? '<i class="fas fa-gem"></i>' : i + 1}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderCharmsList(equippedOnly) {
        const charms = characterSheet.state.charms.filter(charm => 
            equippedOnly ? charm.equipped : !charm.equipped
        );
        
        if (charms.length === 0) {
            return `<p class="empty-list">${equippedOnly ? 'Нет надетых амулетов' : 'Нет не надетых амулетов'}</p>`;
        }
        
        return charms.map((charm, index) => {
            const originalIndex = characterSheet.state.charms.findIndex(c => c === charm);
            return this.renderCharmItem(charm, originalIndex);
        }).join('');
    }
    
    renderCharmItem(charm, index) {
        const mods = this.getCharmModifiersText(charm);
        const hasDescription = charm.description && charm.description.trim() !== '';

        return `
            <div class="list-item" data-index="${index}">
                <div style="flex-grow: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                        <div style="flex-grow: 1;">
                            <strong>${charm.name}</strong>
                            <div style="margin-top: 5px;">
                                <small>Редкость: ${charm.rarity || 'Обычный'}</small>
                            </div>
                            <div>
                                <small>Стоимость: ${charm.cost || 0} Geo</small>
                                <span style="margin: 0 5px;">•</span>
                                <small>Слотов: ${charm.slots || 1}</small>
                            </div>
                            ${mods ? `<div style="margin-top: 5px;"><small>${mods}</small></div>` : ''}
                            ${hasDescription ? `
                                <div class="charm-description hidden" id="charm-desc-${index}">
                                    <small>${charm.description}</small>
                                </div>
                            ` : ''}
                        </div>
                        <div class="list-item-controls" style="flex-shrink: 0;">
                            ${hasDescription ? `
                                <button class="charm-desc-toggle" title="Показать описание">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            ` : ''}
                            <button class="edit-charm" title="Редактировать">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="remove-charm" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                            <div style="margin-top: 5px;">
                                <label class="charm-equip-checkbox" title="Надеть/снять амулет">
                                    <input type="checkbox" class="charm-equip" data-index="${index}"
                                           ${charm.equipped ? 'checked' : ''}>
                                    <i class="fas ${charm.equipped ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getCharmModifiersText(charm) {
        const charNames = {
            might: 'Мощь', insight: 'Проницательность', shell: 'Панцирь', grace: 'Грация',
            attractiveness: 'Привлекательность', horror: 'Жуть', speed: 'Скорость',
            heart: 'Сердца', endurance: 'Выносливость', soul: 'Душа', hunger: 'Голод'
        };
        
        const mods = [];
        Object.entries(charm.modifiers || {}).forEach(([key, value]) => {
            if (value !== 0 && charNames[key]) {
                mods.push(`${charNames[key]} ${value > 0 ? '+' : ''}${value}`);
            }
        });
        
        return mods.join(', ');
    }
    
    setupEventListeners() {
        const block = document.getElementById('content-charms');
        if (!block) return;

        // Remove existing click handler if it exists
        if (this.clickHandler) {
            block.removeEventListener('click', this.clickHandler);
        }

        this.clickHandler = (e) => {
            if (e.target.closest('#add-charm-btn')) {
                this.showCharmModal();
            } else if (e.target.closest('#slots-info')) {
                this.showSlotsExplanation();
            } else if (e.target.closest('.edit-charm')) {
                const index = parseInt(e.target.closest('.list-item').dataset.index);
                this.showCharmModal(index);
            } else if (e.target.closest('.remove-charm')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.closest('.remove-charm');
                const index = parseInt(button.closest('.list-item').dataset.index);
                button.disabled = true;
                if (confirm('Удалить этот амулет?')) {
                    this.removeCharm(index);
                } else {
                    button.disabled = false;
                }
            } else if (e.target.closest('.charm-equip')) {
                const checkbox = e.target.closest('.charm-equip');
                const index = parseInt(checkbox.dataset.index);
                this.toggleCharmEquip(index, checkbox.checked);
            } else if (e.target.closest('.charm-equip-checkbox')) {
                // Клик по label с иконкой тоже переключает чекбокс
                const checkbox = e.target.closest('.charm-equip-checkbox').querySelector('.charm-equip');
                if (checkbox) {
                    const index = parseInt(checkbox.dataset.index);
                    this.toggleCharmEquip(index, !checkbox.checked);
                }
            } else if (e.target.closest('.charm-desc-toggle')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.charm-desc-toggle');
                const listItem = btn.closest('.list-item');
                const index = parseInt(listItem.dataset.index);
                this.toggleCharmDescription(index);
            }
        };

        block.addEventListener('click', this.clickHandler);

        // Изменение количества слотов
        document.addEventListener('change', (e) => {
            if (e.target.id === 'charm-slots-input') {
                const newTotal = parseInt(e.target.value) || 3;
                const baseSlots = 3;
                const pathRanksBonus = this.getPathRanksBonus();
                // Сохраняем только ручную корректировку
                characterSheet.state.charmSlots = newTotal - baseSlots - pathRanksBonus;
                characterSheet.saveState();
                this.updateSlotsDisplay();
            }
        });
    }
    
    showCharmModal(charmIndex = null) {
        // Remove any existing modal first
        document.querySelector('.modal.active')?.remove();

        const charm = charmIndex !== null ?
            characterSheet.state.charms[charmIndex] :
            this.getDefaultCharm();

        const modalContent = `
            <form id="charm-form">
                <div class="form-row">
                    <div class="form-group" style="flex: 2;">
                        <label for="charm-name">Название амулета</label>
                        <input type="text" id="charm-name" class="form-control" value="${charm.name}" required>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label for="charm-rarity">Редкость</label>
                        <select id="charm-rarity" class="form-control">
                            <option value="ОБЫЧНЫЙ" ${charm.rarity === 'ОБЫЧНЫЙ' ? 'selected' : ''}>ОБЫЧНЫЙ</option>
                            <option value="НЕОБЫЧНЫЙ" ${charm.rarity === 'НЕОБЫЧНЫЙ' ? 'selected' : ''}>НЕОБЫЧНЫЙ</option>
                            <option value="РЕДКИЙ" ${charm.rarity === 'РЕДКИЙ' ? 'selected' : ''}>РЕДКИЙ</option>
                            <option value="УНИКАЛЬНЫЙ" ${charm.rarity === 'УНИКАЛЬНЫЙ' ? 'selected' : ''}>УНИКАЛЬНЫЙ</option>
                            <option value="ЛЕГЕНДАРНЫЙ" ${charm.rarity === 'ЛЕГЕНДАРНЫЙ' ? 'selected' : ''}>ЛЕГЕНДАРНЫЙ</option>
                            <option value="ПРОКЛЯТЫЙ" ${charm.rarity === 'ПРОКЛЯТЫЙ' ? 'selected' : ''}>ПРОКЛЯТЫЙ</option>
                            <option value="ХРУПКИЙ" ${charm.rarity === 'ХРУПКИЙ' ? 'selected' : ''}>ХРУПКИЙ</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="charm-slots">Слотов (меток)</label>
                        <input type="number" step="1" id="charm-slots" class="form-control" value="${charm.slots || 1}" required>
                    </div>
                    <div class="form-group">
                        <label for="charm-cost">Стоимость (Валюта)</label>
                        <input type="number" step="1" min="0" id="charm-cost" class="form-control" value="${charm.cost || 0}">
                    </div>
                </div>
                
                <h5>Влияние на характеристики</h5>
                <div class="form-row">
                    <div class="form-group">
                        <label for="charm-might">Мощь</label>
                        <input type="number" step="0.5" id="charm-might" class="form-control" value="${charm.modifiers.might || 0}">
                    </div>
                    <div class="form-group">
                        <label for="charm-insight">Проницательность</label>
                        <input type="number" step="0.5" id="charm-insight" class="form-control" value="${charm.modifiers.insight || 0}">
                    </div>
                    <div class="form-group">
                        <label for="charm-shell">Панцирь</label>
                        <input type="number" step="0.5" id="charm-shell" class="form-control" value="${charm.modifiers.shell || 0}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="charm-grace">Грация</label>
                        <input type="number" step="0.5" id="charm-grace" class="form-control" value="${charm.modifiers.grace || 0}">
                    </div>
                    <div class="form-group">
                        <label for="charm-attractiveness">Привлекательность</label>
                        <input type="number" step="0.5" id="charm-attractiveness" class="form-control" value="${charm.modifiers.attractiveness || 0}">
                    </div>
                    <div class="form-group">
                        <label for="charm-horror">Жуть</label>
                        <input type="number" step="0.5" id="charm-horror" class="form-control" value="${charm.modifiers.horror || 0}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="charm-speed">Скорость</label>
                        <input type="number" step="1" id="charm-speed" class="form-control" value="${charm.modifiers.speed || 0}">
                    </div>
                    <div class="form-group">
                        <label for="charm-heart">Сердца</label>
                        <input type="number" step="1" id="charm-heart" class="form-control" value="${charm.modifiers.heart || 0}">
                    </div>
                    <div class="form-group">
                        <label for="charm-endurance">Выносливость</label>
                        <input type="number" step="1" id="charm-endurance" class="form-control" value="${charm.modifiers.endurance || 0}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="charm-soul">Душа</label>
                        <input type="number" step="1" id="charm-soul" class="form-control" value="${charm.modifiers.soul || 0}">
                    </div>
                    <div class="form-group">
                        <label for="charm-hunger">Голод</label>
                        <input type="number" step="1" id="charm-hunger" class="form-control" value="${charm.modifiers.hunger || 0}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="charm-description">Описание амулета</label>
                    <textarea id="charm-description" class="form-control" rows="3">${charm.description || ''}</textarea>
                </div>
            </form>
        `;
        
        const modal = this.createModal(
            charmIndex !== null ? 'Редактировать амулет' : 'Добавить амулет',
            modalContent,
            () => this.saveCharm(charmIndex)
        );
        
        document.body.appendChild(modal);
    }
    
    getDefaultCharm() {
        return {
            name: '',
            rarity: 'ОБЫЧНЫЙ',
            slots: 1,
            cost: 0,
            modifiers: {
                might: 0,
                insight: 0,
                shell: 0,
                grace: 0,
                attractiveness: 0,
                horror: 0,
                speed: 0,
                heart: 0,
                endurance: 0,
                soul: 0,
                hunger: 0
            },
            description: '',
            equipped: false
        };
    }
    
    saveCharm(charmIndex = null) {
        const form = document.getElementById('charm-form');
        if (!form) return;
        
        const charmData = {
            name: document.getElementById('charm-name').value,
            rarity: document.getElementById('charm-rarity').value,
            slots: parseInt(document.getElementById('charm-slots').value) || 1,
            cost: parseInt(document.getElementById('charm-cost').value) || 0,
            modifiers: {
                might: parseFloat(document.getElementById('charm-might').value) || 0,
                insight: parseFloat(document.getElementById('charm-insight').value) || 0,
                shell: parseFloat(document.getElementById('charm-shell').value) || 0,
                grace: parseFloat(document.getElementById('charm-grace').value) || 0,
                attractiveness: parseFloat(document.getElementById('charm-attractiveness').value) || 0,
                horror: parseFloat(document.getElementById('charm-horror').value) || 0,
                speed: parseFloat(document.getElementById('charm-speed').value) || 0,
                heart: parseInt(document.getElementById('charm-heart').value) || 0,
                endurance: parseInt(document.getElementById('charm-endurance').value) || 0,
                soul: parseInt(document.getElementById('charm-soul').value) || 0,
                hunger: parseInt(document.getElementById('charm-hunger').value) || 0
            },
            description: document.getElementById('charm-description').value,
            equipped: charmIndex !== null ? characterSheet.state.charms[charmIndex]?.equipped || false : false
        };
        
        if (charmIndex !== null) {
            characterSheet.state.charms[charmIndex] = charmData;
        } else {
            characterSheet.state.charms.push(charmData);
        }
        
        characterSheet.saveState();
        characterSheet.updateAllCharacteristics();
        this.renderBlock();
        
        document.querySelector('.modal.active')?.remove();
    }
    
    removeCharm(index, button) {
        characterSheet.state.charms.splice(index, 1);
        characterSheet.saveState();
        characterSheet.updateAllCharacteristics();
        this.renderBlock();
    }
    
    toggleCharmEquip(index, equip) {
        const charm = characterSheet.state.charms[index];
        const currentEquippedSlots = characterSheet.state.charms
            .filter(c => c.equipped)
            .reduce((sum, c) => sum + (c.slots || 1), 0);
        const charmSlots = charm.slots || 1;
        
        // Вычисляем общее количество слотов
        const totalSlots = 3 + this.getPathRanksBonus() + (characterSheet.state.charmSlots || 0);

        if (equip) {
            // Проверяем, хватает ли слотов для надевания
            const availableSlots = totalSlots - currentEquippedSlots;
            if (charmSlots > availableSlots) {
                // ПЕРЕЧАРОВАН - разрешаем надевание, но показываем уведомление
                alert(`ПЕРЕЧАРОВАН. Получаемый урон удвоен`);
            }
        }

        charm.equipped = equip;

        // Проверяем общее состояние перечарованности после изменения
        const totalEquippedSlots = characterSheet.state.charms
            .filter(c => c.equipped)
            .reduce((sum, c) => sum + (c.slots || 1), 0);

        // Устанавливаем статус перечарованности
        characterSheet.state.isOvercharmed = totalEquippedSlots > totalSlots;

        characterSheet.saveState();
        characterSheet.updateAllCharacteristics();
        this.updateSlotsDisplay();
        this.renderBlock();
    }

    toggleCharmDescription(index) {
        const desc = document.getElementById(`charm-desc-${index}`);
        const toggle = document.querySelector(`.charm-desc-toggle[data-index="${index}"] i`);

        if (desc) {
            const isHidden = desc.classList.contains('hidden');
            
            if (isHidden) {
                desc.classList.remove('hidden');
                desc.style.maxHeight = (desc.scrollHeight + 20) + 'px';
                if (toggle) {
                    toggle.className = 'fas fa-chevron-up';
                }
            } else {
                desc.classList.add('hidden');
                desc.style.maxHeight = '0';
                if (toggle) {
                    toggle.className = 'fas fa-chevron-down';
                }
            }
        }
    }
    
    updateSlotsDisplay() {
        const slotsContainer = document.querySelector('.charm-slots-container');
        if (slotsContainer) {
            slotsContainer.innerHTML = `<h3><i class="fas fa-sliders-h"></i> Слоты для амулетов</h3>${this.renderSlotsDisplay()}`;

            // Обновляем обработчик изменения слотов
            document.getElementById('charm-slots-input')?.addEventListener('change', (e) => {
                const newTotal = parseInt(e.target.value) || 3;
                const baseSlots = 3;
                const pathRanksBonus = this.getPathRanksBonus();
                // Сохраняем только ручную корректировку
                characterSheet.state.charmSlots = newTotal - baseSlots - pathRanksBonus;
                characterSheet.saveState();
                this.updateSlotsDisplay();
            });
        }
    }
    
    showSlotsExplanation() {
        const explanationContent = `
            <div style="text-align: center; padding: 20px;">
                <p style="font-size: 1.1em; line-height: 1.6;">
                    Жуки начинают с 3 меток плюс Ранг их Пути. Метки используются для надевания Амулетов и иногда для управления приспешниками.
                </p>
            </div>
        `;

        const modal = this.createExplanationModal('Пояснение о слотах', explanationContent);
        document.body.appendChild(modal);
    }

    createExplanationModal(title, content) {
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
window.charmsManager = new CharmsManager();