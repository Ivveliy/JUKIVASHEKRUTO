    // statuses.js - Блок активных статусов
class StatusesManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.renderBlock();
        this.setupEventListeners();
    }
    
    renderBlock() {
        const content = document.getElementById('content-statuses');
        if (!content) return;

        content.innerHTML = `
            <div class="statuses-list">
                ${this.renderStatusesList()}
            </div>
            <button class="add-btn" id="add-status-btn">
                <i class="fas fa-plus"></i> Добавить статус
            </button>
        `;
    }
    
    renderStatusesList() {
        if (characterSheet.state.statuses.length === 0) {
            return '<p class="empty-list">Нет активных статусов</p>';
        }

        return characterSheet.state.statuses.map((status, index) => {
            let details = '';
            if (status.type === 'poison') {
                details = `<strong style="font-size: 1.1em; color: var(--accent-red);">ОУ: ${status.delayedDamage}</strong>`;
            } else {
                details = `<strong style="font-size: 1.1em; color: var(--accent-blue);">Осталось: ${status.duration} раундов</strong>`;
            }

            const modifiersText = this.renderStatusModifiers(status);
            const hasDescription = status.description && status.description.trim() !== '';

            return `
                <div class="list-item" data-index="${index}">
                    <div style="flex-grow: 1;">
                        <div>
                            <strong>${status.name}</strong>
                            <div class="status-duration">
                                ${details}
                            </div>
                            ${modifiersText ? `<div class="status-modifiers"><small>${modifiersText}</small></div>` : ''}
                        </div>
                        ${hasDescription ? `
                            <div class="status-description hidden" id="status-desc-${index}" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease;">
                                <strong>Описание:</strong> ${status.description}
                            </div>
                        ` : ''}
                    </div>
                    <div class="list-item-controls">
                        ${hasDescription ? `
                            <button class="status-toggle" data-index="${index}" title="Показать/скрыть описание">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        ` : ''}
                        <button class="edit-status" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="remove-status" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderStatusModifiers(status) {
        if (status.type === 'poison') return '';

        const mods = [];
        const charNames = {
            might: 'Мощь', insight: 'Проницательность', shell: 'Панцирь', grace: 'Грация',
            attractiveness: 'Привлекательность', horror: 'Жуть', speed: 'Скорость',
            heart: 'Сердца', endurance: 'Выносливость', soul: 'Душа'
        };

        if (status.modifiers) {
            Object.entries(status.modifiers).forEach(([key, value]) => {
                if (value !== 0 && charNames[key]) {
                    mods.push(`${charNames[key]} ${value > 0 ? '+' : ''}${value}`);
                }
            });
        }

        if (status.roundEffects) {
            const roundMods = [];
            if (status.roundEffects.heart !== 0) roundMods.push(`Сердца ${status.roundEffects.heart > 0 ? '+' : ''}${status.roundEffects.heart}/р`);
            if (status.roundEffects.endurance !== 0) roundMods.push(`Выносливость ${status.roundEffects.endurance > 0 ? '+' : ''}${status.roundEffects.endurance}/р`);
            if (status.roundEffects.soul !== 0) roundMods.push(`Душа ${status.roundEffects.soul > 0 ? '+' : ''}${status.roundEffects.soul}/р`);
            if (status.roundEffects.hunger !== 0) roundMods.push(`Голод ${status.roundEffects.hunger > 0 ? '+' : ''}${status.roundEffects.hunger}/р`);

            if (roundMods.length > 0) {
                mods.push(...roundMods);
            }
        }

        if (status.roundModifiers) {
            const charRoundMods = [];
            if (status.roundModifiers.might !== 0) charRoundMods.push(`Мощь ${status.roundModifiers.might > 0 ? '+' : ''}${status.roundModifiers.might}/р`);
            if (status.roundModifiers.insight !== 0) charRoundMods.push(`Проницательность ${status.roundModifiers.insight > 0 ? '+' : ''}${status.roundModifiers.insight}/р`);
            if (status.roundModifiers.shell !== 0) charRoundMods.push(`Панцирь ${status.roundModifiers.shell > 0 ? '+' : ''}${status.roundModifiers.shell}/р`);
            if (status.roundModifiers.grace !== 0) charRoundMods.push(`Грация ${status.roundModifiers.grace > 0 ? '+' : ''}${status.roundModifiers.grace}/р`);
            if (status.roundModifiers.attractiveness !== 0) charRoundMods.push(`Привлекательность ${status.roundModifiers.attractiveness > 0 ? '+' : ''}${status.roundModifiers.attractiveness}/р`);
            if (status.roundModifiers.horror !== 0) charRoundMods.push(`Жуть ${status.roundModifiers.horror > 0 ? '+' : ''}${status.roundModifiers.horror}/р`);
            if (status.roundModifiers.speed !== 0) charRoundMods.push(`Скорость ${status.roundModifiers.speed > 0 ? '+' : ''}${status.roundModifiers.speed}/р`);

            if (charRoundMods.length > 0) {
                mods.push(...charRoundMods);
            }
        }

        return mods.join(', ');
    }
    
    setupEventListeners() {
        // Делегирование событий для всех кнопок
        document.addEventListener('click', (e) => {
            if (e.target.closest('#add-status-btn')) {
                this.showStatusModal();
            } else if (e.target.closest('.edit-status')) {
                const index = e.target.closest('.list-item').dataset.index;
                this.showStatusModal(index);
            } else if (e.target.closest('.remove-status')) {
                e.preventDefault();
                const button = e.target.closest('.remove-status');
                const index = button.closest('.list-item').dataset.index;
                button.disabled = true;
                this.removeStatus(index, button);
            } else if (e.target.closest('.status-toggle')) {
                const index = e.target.closest('.status-toggle').dataset.index;
                this.toggleStatusDescription(index);
            }
        });
    }
    
    showStatusModal(statusIndex = null) {
        const status = statusIndex !== null ?
            characterSheet.state.statuses[statusIndex] :
            this.getDefaultStatus();

        // Ensure modifiers, roundModifiers and roundEffects exist for backward compatibility
        if (!status.modifiers) {
            status.modifiers = {
                might: 0,
                insight: 0,
                shell: 0,
                grace: 0,
                attractiveness: 0,
                horror: 0,
                speed: 0,
                heart: 0,
                endurance: 0,
                soul: 0
            };
        }
        if (!status.roundModifiers) {
            status.roundModifiers = {
                might: 0,
                insight: 0,
                shell: 0,
                grace: 0,
                attractiveness: 0,
                horror: 0,
                speed: 0
            };
        }
        if (!status.accumulatedRoundModifiers) {
            status.accumulatedRoundModifiers = {
                might: 0,
                insight: 0,
                shell: 0,
                grace: 0,
                attractiveness: 0,
                horror: 0,
                speed: 0
            };
        }
        if (!status.roundEffects) {
            status.roundEffects = {
                heart: 0,
                endurance: 0,
                soul: 0,
                hunger: 0
            };
        }

        const modalContent = `
            <form id="status-form">
                <div class="form-group">
                    <label for="status-name">Название статуса</label>
                    <input type="text" id="status-name" class="form-control" value="${status.name}" required>
                </div>

                <div class="form-group">
                    <label for="status-type">Тип статуса</label>
                    <select id="status-type" class="form-control" required>
                        <option value="other" ${status.type === 'other' ? 'selected' : ''}>Прочее</option>
                        <option value="poison" ${status.type === 'poison' ? 'selected' : ''}>Яд</option>
                    </select>
                </div>

                <div id="duration-field" class="form-group" style="display: ${status.type === 'other' ? 'block' : 'none'}">
                    <label for="status-duration">Длительность (раунды)</label>
                    <input type="number" step="1" min="1" id="status-duration" class="form-control" style="height: 40px; font-size: 1.2em;" value="${status.duration || 1}" required>
                </div>

                <!-- Поля для яда -->
                <div id="poison-fields" style="display: ${status.type === 'poison' ? 'block' : 'none'}">
                    <div class="form-group">
                        <label for="status-delayed-damage">Отложенный урон (ОУ)</label>
                        <input type="number" step="1" min="1" id="status-delayed-damage" class="form-control" value="${status.delayedDamage || 1}" required>
                    </div>
                </div>

                <!-- Поля для прочих статусов -->
                <div id="other-fields" style="display: ${status.type === 'other' ? 'block' : 'none'}">
                    <h4>Ресурсы</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="status-heart-mod">Сердца (макс.)</label>
                            <input type="number" step="1" id="status-heart-mod" class="form-control" value="${(status.modifiers && status.modifiers.heart) || 0}">
                        </div>
                        <div class="form-group">
                            <label for="status-endurance-mod">Выносливость (макс.)</label>
                            <input type="number" step="1" id="status-endurance-mod" class="form-control" value="${(status.modifiers && status.modifiers.endurance) || 0}">
                        </div>
                        <div class="form-group">
                            <label for="status-soul-mod">Душа (макс.)</label>
                            <input type="number" step="1" id="status-soul-mod" class="form-control" value="${(status.modifiers && status.modifiers.soul) || 0}">
                        </div>
                    </div>

                    <h4>Характеристики</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="status-might">Мощь</label>
                            <input type="number" step="0.5" id="status-might" class="form-control" value="${(status.modifiers && status.modifiers.might) || 0}">
                        </div>
                        <div class="form-group">
                            <label for="status-insight">Проницательность</label>
                            <input type="number" step="0.5" id="status-insight" class="form-control" value="${(status.modifiers && status.modifiers.insight) || 0}">
                        </div>
                        <div class="form-group">
                            <label for="status-shell">Панцирь</label>
                            <input type="number" step="0.5" id="status-shell" class="form-control" value="${(status.modifiers && status.modifiers.shell) || 0}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="status-grace">Грация</label>
                            <input type="number" step="0.5" id="status-grace" class="form-control" value="${(status.modifiers && status.modifiers.grace) || 0}">
                        </div>
                        <div class="form-group">
                            <label for="status-attractiveness">Привлекательность</label>
                            <input type="number" step="0.5" id="status-attractiveness" class="form-control" value="${(status.modifiers && status.modifiers.attractiveness) || 0}">
                        </div>
                        <div class="form-group">
                            <label for="status-horror">Жуть</label>
                            <input type="number" step="0.5" id="status-horror" class="form-control" value="${(status.modifiers && status.modifiers.horror) || 0}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="status-speed">Скорость</label>
                            <input type="number" step="1" id="status-speed" class="form-control" value="${(status.modifiers && status.modifiers.speed) || 0}">
                        </div>
                    </div>

                    <h4>За раунд</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="status-heart">Сердца</label>
                            <input type="number" step="1" id="status-heart" class="form-control" value="${(status.roundEffects && status.roundEffects.heart) || 0}">
                        </div>
                        <div class="form-group">
                            <label for="status-endurance">Выносливость</label>
                            <input type="number" step="1" id="status-endurance" class="form-control" value="${(status.roundEffects && status.roundEffects.endurance) || 0}">
                        </div>
                        <div class="form-group">
                            <label for="status-soul">Душа</label>
                            <input type="number" step="1" id="status-soul" class="form-control" value="${(status.roundEffects && status.roundEffects.soul) || 0}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="status-hunger">Голод</label>
                            <input type="number" step="1" id="status-hunger" class="form-control" value="${(status.roundEffects && status.roundEffects.hunger) || 0}">
                        </div>
                    </div>

                    <h4>Характеристики за раунд</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="status-might-round">Мощь</label>
                            <input type="number" step="0.5" id="status-might-round" class="form-control" value="${(status.roundModifiers && status.roundModifiers.might) || 0}">
                        </div>
                        <div class="form-group">
                            <label for="status-insight-round">Проницательность</label>
                            <input type="number" step="0.5" id="status-insight-round" class="form-control" value="${(status.roundModifiers && status.roundModifiers.insight) || 0}">
                        </div>
                        <div class="form-group">
                            <label for="status-shell-round">Панцирь</label>
                            <input type="number" step="0.5" id="status-shell-round" class="form-control" value="${(status.roundModifiers && status.roundModifiers.shell) || 0}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="status-grace-round">Грация</label>
                            <input type="number" step="0.5" id="status-grace-round" class="form-control" value="${(status.roundModifiers && status.roundModifiers.grace) || 0}">
                        </div>
                        <div class="form-group">
                            <label for="status-attractiveness-round">Привлекательность</label>
                            <input type="number" step="0.5" id="status-attractiveness-round" class="form-control" value="${(status.roundModifiers && status.roundModifiers.attractiveness) || 0}">
                        </div>
                        <div class="form-group">
                            <label for="status-horror-round">Жуть</label>
                            <input type="number" step="0.5" id="status-horror-round" class="form-control" value="${(status.roundModifiers && status.roundModifiers.horror) || 0}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="status-speed-round">Скорость</label>
                            <input type="number" step="1" id="status-speed-round" class="form-control" value="${(status.roundModifiers && status.roundModifiers.speed) || 0}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="status-description">Описание</label>
                        <textarea id="status-description" class="form-control" rows="3">${status.description || ''}</textarea>
                    </div>
            </form>
        `;

        const modal = this.createModal(
            statusIndex !== null ? 'Редактировать статус' : 'Добавить статус',
            modalContent,
            () => this.saveStatus(statusIndex)
        );

        // Динамическое переключение полей
        const typeSelect = modal.querySelector('#status-type');
        typeSelect.addEventListener('change', (e) => {
            this.updateStatusFields(e.target.value);
        });

        document.body.appendChild(modal);
    }
    
    updateStatusFields(type) {
        const poisonFields = document.getElementById('poison-fields');
        const otherFields = document.getElementById('other-fields');
        const durationField = document.getElementById('duration-field');

        if (poisonFields) poisonFields.style.display = type === 'poison' ? 'block' : 'none';
        if (otherFields) otherFields.style.display = type === 'other' ? 'block' : 'none';
        if (durationField) durationField.style.display = type === 'other' ? 'block' : 'none';
    }

    getDefaultStatus() {
        return {
            name: '',
            type: 'other',
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
                soul: 0
            },
            roundModifiers: {
                might: 0,
                insight: 0,
                shell: 0,
                grace: 0,
                attractiveness: 0,
                horror: 0,
                speed: 0
            },
            roundEffects: {
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
            delayedDamage: 1,
            duration: 1,
            description: ''
        };
    }
    
    saveStatus(statusIndex = null) {
        const form = document.getElementById('status-form');
        if (!form) return;

        const type = document.getElementById('status-type').value;
        let statusData = {
            name: document.getElementById('status-name').value,
            type: type,
            description: document.getElementById('status-description').value
        };

        if (type === 'poison') {
            statusData.delayedDamage = parseInt(document.getElementById('status-delayed-damage').value) || 1;
        } else {
            statusData.modifiers = {
                might: parseFloat(document.getElementById('status-might').value) || 0,
                insight: parseFloat(document.getElementById('status-insight').value) || 0,
                shell: parseFloat(document.getElementById('status-shell').value) || 0,
                grace: parseFloat(document.getElementById('status-grace').value) || 0,
                attractiveness: parseFloat(document.getElementById('status-attractiveness').value) || 0,
                horror: parseFloat(document.getElementById('status-horror').value) || 0,
                speed: parseFloat(document.getElementById('status-speed').value) || 0,
                heart: parseInt(document.getElementById('status-heart-mod').value) || 0,
                endurance: parseInt(document.getElementById('status-endurance-mod').value) || 0,
                soul: parseInt(document.getElementById('status-soul-mod').value) || 0
            };
            statusData.roundModifiers = {
                might: parseFloat(document.getElementById('status-might-round').value) || 0,
                insight: parseFloat(document.getElementById('status-insight-round').value) || 0,
                shell: parseFloat(document.getElementById('status-shell-round').value) || 0,
                grace: parseFloat(document.getElementById('status-grace-round').value) || 0,
                attractiveness: parseFloat(document.getElementById('status-attractiveness-round').value) || 0,
                horror: parseFloat(document.getElementById('status-horror-round').value) || 0,
                speed: parseFloat(document.getElementById('status-speed-round').value) || 0
            };
            statusData.accumulatedRoundModifiers = {
                might: 0,
                insight: 0,
                shell: 0,
                grace: 0,
                attractiveness: 0,
                horror: 0,
                speed: 0
            };
            statusData.roundEffects = {
                heart: parseInt(document.getElementById('status-heart').value) || 0,
                endurance: parseInt(document.getElementById('status-endurance').value) || 0,
                soul: parseInt(document.getElementById('status-soul').value) || 0,
                hunger: parseInt(document.getElementById('status-hunger').value) || 0
            };
            statusData.duration = parseInt(document.getElementById('status-duration').value) || 1;
        }

        if (statusIndex !== null) {
            characterSheet.state.statuses[statusIndex] = statusData;
        } else {
            characterSheet.state.statuses.push(statusData);
        }

        characterSheet.saveState();
        characterSheet.updateAllCharacteristics();

        // Закрываем модальное окно
        document.querySelector('.modal.active')?.remove();

        this.renderBlock();
    }
    
    removeStatus(index, button) {
        if (confirm('Удалить этот статус?')) {
            characterSheet.state.statuses.splice(index, 1);
            characterSheet.saveState();
            characterSheet.updateAllCharacteristics();
            this.renderBlock();
        } else {
            button.disabled = false;
        }
    }

    toggleStatusDescription(index) {
        const desc = document.getElementById(`status-desc-${index}`);
        const toggle = document.querySelector(`.status-toggle[data-index="${index}"] i`);

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
    
    applyRoundEffects() {
        let messages = [];
        let changed = false;

        // Loop backwards to safely remove items during iteration
        for (let i = characterSheet.state.statuses.length - 1; i >= 0; i--) {
            const status = characterSheet.state.statuses[i];
            if (status.type === 'poison') {
                // Логика для яда: отнимаем ОУ от текущих сердец, затем уменьшаем ОУ на 1
                if (status.delayedDamage > 0) {
                    const damage = status.delayedDamage;
                    characterSheet.state.characteristics.current.heart = Math.max(0,
                        characterSheet.state.characteristics.current.heart - damage);
                    messages.push(`Яд "${status.name}": нанесено ${damage} урона сердцам.`);
                    status.delayedDamage -= 1;
                    changed = true;

                    // Если ОУ достигло 0, удаляем статус
                    if (status.delayedDamage <= 0) {
                        messages.push(`Яд "${status.name}": эффект истек.`);
                        characterSheet.state.statuses.splice(i, 1);
                        changed = true;
                    }
                }
            } else {
                // Обычная логика для других статусов
                if (status.roundEffects) {
                    if (status.roundEffects.heart !== 0) {
                        const effect = status.roundEffects.heart;
                        characterSheet.state.characteristics.current.heart =
                            Math.max(0, characterSheet.state.characteristics.current.heart + effect);
                        messages.push(`Статус "${status.name}": сердца ${effect > 0 ? '+' : ''}${effect}.`);
                        changed = true;
                    }

                    if (status.roundEffects.endurance !== 0) {
                        const effect = status.roundEffects.endurance;
                        characterSheet.state.characteristics.current.endurance =
                            Math.max(0, characterSheet.state.characteristics.current.endurance + effect);
                        messages.push(`Статус "${status.name}": выносливость ${effect > 0 ? '+' : ''}${effect}.`);
                        changed = true;
                    }

                    if (status.roundEffects.soul !== 0) {
                        const effect = status.roundEffects.soul;
                        characterSheet.state.characteristics.current.soul =
                            Math.max(0, characterSheet.state.characteristics.current.soul + effect);
                        messages.push(`Статус "${status.name}": душа ${effect > 0 ? '+' : ''}${effect}.`);
                        changed = true;
                    }

                    if (status.roundEffects.hunger !== 0) {
                        const effect = status.roundEffects.hunger;
                        characterSheet.state.characteristics.base.satiety += effect;
                        messages.push(`Статус "${status.name}": сытость ${effect > 0 ? '+' : ''}${effect}.`);
                        changed = true;
                    }

                    // Apply round modifiers to characteristics
                    if (status.roundModifiers) {
                        if (status.roundModifiers.might !== 0) {
                            const mod = status.roundModifiers.might;
                            characterSheet.state.characteristics.modifiers.might += mod;
                            if (!status.accumulatedRoundModifiers) status.accumulatedRoundModifiers = { might: 0, insight: 0, shell: 0, grace: 0, attractiveness: 0, horror: 0, speed: 0 };
                            status.accumulatedRoundModifiers.might += mod;
                            messages.push(`Статус "${status.name}": мощь ${mod > 0 ? '+' : ''}${mod} за раунд.`);
                            changed = true;
                        }
                        if (status.roundModifiers.insight !== 0) {
                            const mod = status.roundModifiers.insight;
                            characterSheet.state.characteristics.modifiers.insight += mod;
                            if (!status.accumulatedRoundModifiers) status.accumulatedRoundModifiers = { might: 0, insight: 0, shell: 0, grace: 0, attractiveness: 0, horror: 0, speed: 0 };
                            status.accumulatedRoundModifiers.insight += mod;
                            messages.push(`Статус "${status.name}": проницательность ${mod > 0 ? '+' : ''}${mod} за раунд.`);
                            changed = true;
                        }
                        if (status.roundModifiers.shell !== 0) {
                            const mod = status.roundModifiers.shell;
                            characterSheet.state.characteristics.modifiers.shell += mod;
                            if (!status.accumulatedRoundModifiers) status.accumulatedRoundModifiers = { might: 0, insight: 0, shell: 0, grace: 0, attractiveness: 0, horror: 0, speed: 0 };
                            status.accumulatedRoundModifiers.shell += mod;
                            messages.push(`Статус "${status.name}": панцирь ${mod > 0 ? '+' : ''}${mod} за раунд.`);
                            changed = true;
                        }
                        if (status.roundModifiers.grace !== 0) {
                            const mod = status.roundModifiers.grace;
                            characterSheet.state.characteristics.modifiers.grace += mod;
                            if (!status.accumulatedRoundModifiers) status.accumulatedRoundModifiers = { might: 0, insight: 0, shell: 0, grace: 0, attractiveness: 0, horror: 0, speed: 0 };
                            status.accumulatedRoundModifiers.grace += mod;
                            messages.push(`Статус "${status.name}": грация ${mod > 0 ? '+' : ''}${mod} за раунд.`);
                            changed = true;
                        }
                        if (status.roundModifiers.attractiveness !== 0) {
                            const mod = status.roundModifiers.attractiveness;
                            characterSheet.state.characteristics.modifiers.attractiveness += mod;
                            if (!status.accumulatedRoundModifiers) status.accumulatedRoundModifiers = { might: 0, insight: 0, shell: 0, grace: 0, attractiveness: 0, horror: 0, speed: 0 };
                            status.accumulatedRoundModifiers.attractiveness += mod;
                            messages.push(`Статус "${status.name}": привлекательность ${mod > 0 ? '+' : ''}${mod} за раунд.`);
                            changed = true;
                        }
                        if (status.roundModifiers.horror !== 0) {
                            const mod = status.roundModifiers.horror;
                            characterSheet.state.characteristics.modifiers.horror += mod;
                            if (!status.accumulatedRoundModifiers) status.accumulatedRoundModifiers = { might: 0, insight: 0, shell: 0, grace: 0, attractiveness: 0, horror: 0, speed: 0 };
                            status.accumulatedRoundModifiers.horror += mod;
                            messages.push(`Статус "${status.name}": жуть ${mod > 0 ? '+' : ''}${mod} за раунд.`);
                            changed = true;
                        }
                        if (status.roundModifiers.speed !== 0) {
                            const mod = status.roundModifiers.speed;
                            characterSheet.state.characteristics.modifiers.speed += mod;
                            if (!status.accumulatedRoundModifiers) status.accumulatedRoundModifiers = { might: 0, insight: 0, shell: 0, grace: 0, attractiveness: 0, horror: 0, speed: 0 };
                            status.accumulatedRoundModifiers.speed += mod;
                            messages.push(`Статус "${status.name}": скорость ${mod > 0 ? '+' : ''}${mod} за раунд.`);
                            changed = true;
                        }
                    }
                }

                // Уменьшаем длительность
                status.duration -= 1;

                // Удаляем истекшие статусы и сбрасываем модификаторы
                if (status.duration <= 0) {
                    messages.push(`Статус "${status.name}": истек.`);
                    // Remove round modifiers from characteristics
                    if (status.roundModifiers) {
                        characterSheet.state.characteristics.modifiers.might -= status.roundModifiers.might;
                        characterSheet.state.characteristics.modifiers.insight -= status.roundModifiers.insight;
                        characterSheet.state.characteristics.modifiers.shell -= status.roundModifiers.shell;
                        characterSheet.state.characteristics.modifiers.grace -= status.roundModifiers.grace;
                        characterSheet.state.characteristics.modifiers.attractiveness -= status.roundModifiers.attractiveness;
                        characterSheet.state.characteristics.modifiers.horror -= status.roundModifiers.horror;
                        characterSheet.state.characteristics.modifiers.speed -= status.roundModifiers.speed;
                    }
                    characterSheet.state.statuses.splice(i, 1);
                    changed = true;
                }
            }
        }

        if (changed) {
            characterSheet.saveState();
            characterSheet.updateAllCharacteristics();
            this.renderBlock();

            // Обновляем отображение характеристик
            if (window.characteristicsManager) {
                window.characteristicsManager.updateDisplay();
            }
        }

        return messages;
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
        
        // Закрытие модального окна
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        // Сохранение
        modal.querySelector('#save-modal-btn').addEventListener('click', () => {
            if (onSave) onSave();
        });
        
        // Закрытие при клике вне окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }
}

// Инициализация
window.statusesManager = new StatusesManager();