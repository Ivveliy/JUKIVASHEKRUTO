// combatSkills.js - Блок боевых навыков
class CombatSkillsManager {
    constructor() {
        this.activeFilter = 'all'; // 'all', 'combat', 'magic', 'ritual'
        this.clickHandler = null;
        this.collapsedSections = {}; // Состояние сворачивания разделов
        this.init();
    }

    init() {
        this.renderBlock();
        this.setupEventListeners();
    }

    renderBlock() {
        const content = document.getElementById('content-combatSkills');
        if (!content) return;

        content.innerHTML = `
            <button class="add-btn" id="add-combat-skill-btn" style="margin-bottom: 15px;">
                <i class="fas fa-plus"></i> Добавить навык
            </button>

            <div class="combat-skills-filters">
                <button class="filter-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
                    Все
                </button>
                <button class="filter-btn ${this.activeFilter === 'combat' ? 'active' : ''}" data-filter="combat">
                    <i class="fas fa-fist-raised"></i> Искусство
                </button>
                <button class="filter-btn ${this.activeFilter === 'magic' ? 'active' : ''}" data-filter="magic">
                    <i class="fas fa-magic"></i> Магия
                </button>
                <button class="filter-btn ${this.activeFilter === 'ritual' ? 'active' : ''}" data-filter="ritual">
                    <i class="fas fa-book-dead"></i> Ритуалы
                </button>
            </div>
            <div class="combat-skills-list">
                ${this.renderSkillsList()}
            </div>
        `;

        this.setupEventListeners();
    }

    renderSkillsList() {
        if (characterSheet.state.combatSkills.length === 0) {
            return '<p class="empty-list">Нет боевых навыков</p>';
        }

        // Инициализируем isActive для старых навыков (обратная совместимость)
        characterSheet.state.combatSkills.forEach(skill => {
            if (skill.isActive === undefined) {
                skill.isActive = false;
            }
        });

        // Фильтрация навыков
        let filteredSkills = characterSheet.state.combatSkills;

        if (this.activeFilter === 'combat') {
            filteredSkills = filteredSkills.filter(skill => skill.type === 'combat');
        } else if (this.activeFilter === 'magic') {
            filteredSkills = filteredSkills.filter(skill => skill.type === 'magic');
        } else if (this.activeFilter === 'ritual') {
            filteredSkills = filteredSkills.filter(skill => skill.type === 'ritual');
        }

        if (filteredSkills.length === 0) {
            return '<p class="empty-list">Нет навыков в выбранном фильтре</p>';
        }

        // Разделяем навыки по типам для отображения
        const combatArts = filteredSkills.filter(skill => skill.type === 'combat');
        const magic = filteredSkills.filter(skill => skill.type === 'magic');
        const rituals = filteredSkills.filter(skill => skill.type === 'ritual');

        // Активные навыки (боевые искусства и магия) для отображения вверху
        const activeCombatArts = combatArts.filter(skill => skill.isActive);
        const activeMagic = magic.filter(skill => skill.isActive);
        const activeSkills = [...activeCombatArts, ...activeMagic];

        let html = '';

        // Отображаем активные навыки в самом верху (если они есть)
        if (activeSkills.length > 0) {
            const activeCollapsed = this.collapsedSections['active'];
            html += `
                <div class="skill-section">
                    <div class="skill-section-header" data-section="active">
                        <h4 style="color: #4CAF50; margin: 0;"><i class="fas fa-check-circle"></i> Активные навыки</h4>
                        <i class="fas fa-chevron-${activeCollapsed ? 'down' : 'up'}"></i>
                    </div>
                    <div class="skill-section-content ${activeCollapsed ? 'collapsed' : ''}">
                        ${activeSkills.map((skill) => this.renderSkillItem(skill, true)).join('')}
                    </div>
                </div>
            `;
        }

        // Отображаем боевые искусства
        if (combatArts.length > 0) {
            const combatCollapsed = this.collapsedSections['combat'];
            html += `
                <div class="skill-section">
                    <div class="skill-section-header" data-section="combat">
                        <h4 style="margin: 0;">Боевые искусства</h4>
                        <i class="fas fa-chevron-${combatCollapsed ? 'down' : 'up'}"></i>
                    </div>
                    <div class="skill-section-content ${combatCollapsed ? 'collapsed' : ''}">
                        ${combatArts.map((skill) => this.renderSkillItem(skill)).join('')}
                    </div>
                </div>
            `;
        }

        // Отображаем магию
        if (magic.length > 0) {
            const magicCollapsed = this.collapsedSections['magic'];
            html += `
                <div class="skill-section">
                    <div class="skill-section-header" data-section="magic">
                        <h4 style="margin: 0;">Магия</h4>
                        <i class="fas fa-chevron-${magicCollapsed ? 'down' : 'up'}"></i>
                    </div>
                    <div class="skill-section-content ${magicCollapsed ? 'collapsed' : ''}">
                        ${magic.map((skill) => this.renderSkillItem(skill)).join('')}
                    </div>
                </div>
            `;
        }

        // Отображаем ритуалы
        if (rituals.length > 0) {
            const ritualCollapsed = this.collapsedSections['ritual'];
            html += `
                <div class="skill-section">
                    <div class="skill-section-header" data-section="ritual">
                        <h4 style="margin: 0;">Ритуалы</h4>
                        <i class="fas fa-chevron-${ritualCollapsed ? 'down' : 'up'}"></i>
                    </div>
                    <div class="skill-section-content ${ritualCollapsed ? 'collapsed' : ''}">
                        ${rituals.map((skill) => this.renderSkillItem(skill)).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    }
    
    renderSkillItem(skill, isDuplicate = false) {
        // Инициализируем isActive для старых навыков (обратная совместимость)
        if (skill.isActive === undefined) {
            skill.isActive = false;
        }

        // Находим реальный индекс в массиве
        const index = characterSheet.state.combatSkills.findIndex(s => s === skill);

        let details = '';

        if (skill.type === 'combat') {
            details = `
                <div><small>Характеристика атаки: ${this.getCharacteristicName(skill.attackChar)}</small></div>
                <div><small>Стоимость: ${skill.soulCost || 0} души, ${skill.enduranceCost || 0} выносливости</small></div>
                ${skill.weaponName ? `<div><small>Оружие: ${skill.weaponName}</small></div>` : ''}
                ${skill.damage ? `<div><small>Урон: ${skill.damage}</small></div>` : ''}
            `;
        } else if (skill.type === 'magic') {
            details = `
                <div><small>Характеристика атаки: ${this.getCharacteristicName(skill.attackChar)}</small></div>
                <div><small>Сложность: ${skill.difficulty || 0}</small></div>
                ${skill.range ? `
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <small>Дальность: ${skill.range}</small>
                        <button type="button" class="charm-desc-toggle range-info-btn" title="Таблица дальности" style="background: none; border: none; cursor: pointer; padding: 2px;">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                ` : ''}
                ${skill.duration ? `
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <small>Длительность: ${skill.duration}</small>
                        <button type="button" class="charm-desc-toggle duration-info-btn" title="Таблица длительности" style="background: none; border: none; cursor: pointer; padding: 2px;">
                            <i class="fas fa-info"></i>
                        </button>
                    </div>
                ` : ''}
            `;
        } else if (skill.type === 'ritual') {
            details = `
                <div><small>Стоимость: ${skill.cost || 'Не указана'}</small></div>
                ${skill.requirements ? `<div><small>Требования: ${skill.requirements}</small></div>` : ''}
                ${skill.castTime ? `<div><small>Время каста: ${skill.castTime}</small></div>` : ''}
            `;
        }

        return `
            <div class="list-item ${isDuplicate ? 'duplicate-skill' : ''}" data-index="${index}">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        ${skill.type !== 'ritual' ? `
                            <label class="active-skill-checkbox" title="Отметить как активный">
                                <input type="checkbox" class="skill-active-toggle" ${skill.isActive ? 'checked' : ''} data-index="${index}">
                                <i class="fas ${skill.isActive ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            </label>
                        ` : ''}
                        <strong>${skill.name}</strong>
                    </div>
                    <div class="skill-type">
                        <small>${this.getSkillTypeName(skill.type)}</small>
                    </div>
                    ${details}
                    ${skill.description ? `<div class="ritual-description" style="margin-top: 8px; white-space: pre-wrap; background: var(--light-bg); padding: 8px; border-radius: 4px;"><small>${skill.description}</small></div>` : ''}
                </div>
                <div class="list-item-controls">
                    <button class="edit-combat-skill" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="remove-combat-skill" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getSkillTypeName(type) {
        const names = {
            combat: 'Боевое искусство',
            magic: 'Магия',
            ritual: 'Ритуал'
        };
        return names[type] || type;
    }
    
    getCharacteristicName(key) {
        const names = {
            might: 'Мощь',
            insight: 'Проницательность',
            grace: 'Грация'
        };
        return names[key] || key;
    }
    
    setupEventListeners() {
        const block = document.getElementById('content-combatSkills');
        if (!block) return;

        // Remove existing click handler if it exists
        if (this.clickHandler) {
            block.removeEventListener('click', this.clickHandler);
        }

        this.clickHandler = (e) => {
            // Сворачивание/разворачивание разделов
            if (e.target.closest('.skill-section-header')) {
                const header = e.target.closest('.skill-section-header');
                const section = header.dataset.section;
                this.toggleSection(section);
            }
            // Обработка кнопок фильтров
            else if (e.target.closest('.filter-btn')) {
                const btn = e.target.closest('.filter-btn');
                const filter = btn.dataset.filter;
                this.setFilter(filter);
            }
            // Добавление навыка
            else if (e.target.closest('#add-combat-skill-btn')) {
                this.showSkillModal();
            }
            // Редактирование навыка
            else if (e.target.closest('.edit-combat-skill')) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(e.target.closest('.list-item').dataset.index);
                this.showSkillModal(index);
            }
            // Удаление навыка
            else if (e.target.closest('.remove-combat-skill')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.closest('.remove-combat-skill');
                const index = parseInt(button.closest('.list-item').dataset.index);
                button.disabled = true;
                if (confirm('Удалить этот боевой навык?')) {
                    this.removeSkill(index);
                } else {
                    button.disabled = false;
                }
            }
            // Переключение активного статуса навыка
            else if (e.target.closest('.skill-active-toggle')) {
                e.preventDefault();
                e.stopPropagation();
                const checkbox = e.target.closest('.skill-active-toggle');
                const index = parseInt(checkbox.dataset.index);
                this.toggleSkillActive(index, checkbox.checked);
            }
            // Информация о дальности
            else if (e.target.closest('.range-info-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.showRangeTable();
            }
            // Информация о длительности
            else if (e.target.closest('.duration-info-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.showDurationTable();
            }
        };

        block.addEventListener('click', this.clickHandler);
    }

    setFilter(filter) {
        this.activeFilter = filter;
        this.renderBlock();
    }

    toggleSection(section) {
        if (this.collapsedSections[section] === undefined) {
            this.collapsedSections[section] = false;
        }
        this.collapsedSections[section] = !this.collapsedSections[section];
        characterSheet.saveState();
        this.renderBlock();
    }

    toggleSkillActive(index, isActive) {
        const skill = characterSheet.state.combatSkills[index];
        // Ритуалы не могут быть активными навыками
        if (skill && skill.type !== 'ritual') {
            skill.isActive = isActive;
            characterSheet.saveState();
            this.renderBlock();
        }
    }

    showSkillModal(skillIndex = null) {
        const skill = skillIndex !== null ? 
            characterSheet.state.combatSkills[skillIndex] : 
            null;
        
        const weaponOptions = characterSheet.state.equipment
            .filter(item => item.category === 'weapons')
            .map(item => `<option value="${item.name}" ${skill?.weaponName === item.name ? 'selected' : ''}>${item.name}</option>`)
            .join('');
        
        const modalContent = `
            <form id="combat-skill-form">
                <div class="form-group">
                    <label for="skill-name">Название навыка</label>
                    <input type="text" id="skill-name" class="form-control" value="${skill?.name || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="skill-type">Тип навыка</label>
                    <select id="skill-type" class="form-control" required>
                        <option value="combat" ${skill?.type === 'combat' ? 'selected' : ''}>Боевое искусство</option>
                        <option value="magic" ${skill?.type === 'magic' ? 'selected' : ''}>Магия</option>
                        <option value="ritual" ${skill?.type === 'ritual' ? 'selected' : ''}>Ритуал</option>
                    </select>
                </div>
                
                <!-- Поля для боевых искусств -->
                <div id="combat-fields" style="display: ${skill?.type === 'combat' || !skill ? 'block' : 'none'}">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="combat-soul-cost">Стоимость души</label>
                            <input type="number" step="1" min="0" id="combat-soul-cost" class="form-control" value="${skill?.soulCost || 0}">
                        </div>
                        <div class="form-group">
                            <label for="combat-endurance-cost">Стоимость выносливости</label>
                            <input type="number" step="1" min="0" id="combat-endurance-cost" class="form-control" value="${skill?.enduranceCost || 0}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="combat-attack-char">Характеристика атаки</label>
                        <select id="combat-attack-char" class="form-control">
                            <option value="might" ${skill?.attackChar === 'might' ? 'selected' : ''}>Мощь</option>
                            <option value="insight" ${skill?.attackChar === 'insight' ? 'selected' : ''}>Проницательность</option>
                            <option value="grace" ${skill?.attackChar === 'grace' ? 'selected' : ''}>Грация</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="combat-weapon">Оружие</label>
                        <select id="combat-weapon" class="form-control">
                            <option value="">Без оружия</option>
                            ${weaponOptions}
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="combat-weapon-type">Тип оружия</label>
                            <input type="text" id="combat-weapon-type" class="form-control" value="${skill?.weaponType || ''}">
                        </div>
                        <div class="form-group">
                            <label for="combat-damage">Урон</label>
                            <input type="text" id="combat-damage" class="form-control" value="${skill?.damage || ''}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="combat-quality">Качество оружия</label>
                        <input type="number" step="1" min="1" id="combat-quality" class="form-control" value="${skill?.quality || 1}">
                    </div>
                </div>
                
                <!-- Поля для магии -->
                <div id="magic-fields" style="display: ${skill?.type === 'magic' ? 'block' : 'none'}">
                    <div class="form-group">
                        <label for="magic-difficulty">Сложность</label>
                        <input type="number" step="1" min="0" id="magic-difficulty" class="form-control" value="${skill?.difficulty || 0}">
                    </div>

                    <div class="form-group">
                        <label for="magic-range">Дальность</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <select id="magic-range" class="form-control" style="flex-grow: 1;">
                                <option value="На себя" ${skill?.range === 'На себя' ? 'selected' : ''}>На себя</option>
                                <option value="Касание" ${skill?.range === 'Касание' ? 'selected' : ''}>Касание</option>
                                <option value="Рядом" ${skill?.range === 'Рядом' ? 'selected' : ''}>Рядом</option>
                                <option value="Далеко" ${skill?.range === 'Далеко' ? 'selected' : ''}>Далеко</option>
                                <option value="Чувство" ${skill?.range === 'Чувство' ? 'selected' : ''}>Чувство</option>
                            </select>
                            <button type="button" class="char-btn char-details" id="range-info" title="Таблица дальности">
                                <i class="fas fa-info"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="magic-duration">Длительность</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <select id="magic-duration" class="form-control" style="flex-grow: 1;">
                                <option value="" ${skill?.duration === '' || !skill?.duration ? 'selected' : ''}>-</option>
                                <option value="Концентрация" ${skill?.duration === 'Концентрация' ? 'selected' : ''}>Концентрация</option>
                                <option value="Краткая" ${skill?.duration === 'Краткая' ? 'selected' : ''}>Краткая</option>
                                <option value="Сцена" ${skill?.duration === 'Сцена' ? 'selected' : ''}>Сцена</option>
                                <option value="Сцены" ${skill?.duration === 'Сцены' ? 'selected' : ''}>Сцены</option>
                                <option value="Отдых" ${skill?.duration === 'Отдых' ? 'selected' : ''}>Отдых</option>
                                <option value="Жизнь" ${skill?.duration === 'Жизнь' ? 'selected' : ''}>Жизнь</option>
                                <option value="Вечность" ${skill?.duration === 'Вечность' ? 'selected' : ''}>Вечность</option>
                            </select>
                            <button type="button" class="char-btn char-details" id="duration-info" title="Таблица длительности">
                                <i class="fas fa-info"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="magic-attack-char">Характеристика атаки</label>
                        <select id="magic-attack-char" class="form-control">
                            <option value="might" ${skill?.attackChar === 'might' ? 'selected' : ''}>Мощь</option>
                            <option value="insight" ${skill?.attackChar === 'insight' ? 'selected' : ''}>Проницательность</option>
                            <option value="grace" ${skill?.attackChar === 'grace' ? 'selected' : ''}>Грация</option>
                        </select>
                    </div>
                </div>

                <!-- Поля для ритуалов -->
                <div id="ritual-fields" style="display: ${skill?.type === 'ritual' ? 'block' : 'none'}">
                    <div class="form-group">
                        <label for="ritual-cost">Стоимость</label>
                        <input type="text" id="ritual-cost" class="form-control" value="${skill?.cost || ''}" placeholder="Ресурсы и материальные компоненты">
                    </div>

                    <div class="form-group">
                        <label for="ritual-requirements">Требования</label>
                        <input type="text" id="ritual-requirements" class="form-control" value="${skill?.requirements || ''}" placeholder="Уровни и место проведения">
                    </div>

                    <div class="form-group">
                        <label for="ritual-cast-time">Время каста</label>
                        <input type="text" id="ritual-cast-time" class="form-control" value="${skill?.castTime || ''}" placeholder="Раунды, сцены, иные единицы времени">
                    </div>
                </div>

                <div class="form-group">
                    <label for="skill-description">Описание</label>
                    <textarea id="skill-description" class="form-control" rows="5" style="white-space: pre-wrap; font-family: monospace;">${skill?.description || ''}</textarea>
                    <small style="color: #666; display: block; margin-top: 5px;">Описание поддерживает переносы строк и абзацы</small>
                </div>

                ${skill?.type !== 'ritual' ? `
                <div class="form-group">
                    <label class="active-skill-toggle-label" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="skill-is-active" ${skill?.isActive ? 'checked' : ''}>
                        <span>Активный навык</span>
                    </label>
                </div>
                ` : ''}
            </form>
        `;
        
        const skillType = skill?.type === 'ritual' ? 'навык (ритуал)' : 
                          skill?.type === 'magic' ? 'навык (магия)' : 
                          skill?.type === 'combat' ? 'навык (боевое искусство)' : 'навык';
        
        const modal = this.createModal(
            skillIndex !== null ? `Редактировать ${skillType}` : `Добавить ${skillType}`,
            modalContent,
            () => this.saveSkill(skillIndex)
        );
        
        // Динамическое переключение полей
        const typeSelect = modal.querySelector('#skill-type');
        typeSelect.addEventListener('change', (e) => {
            this.updateSkillFields(e.target.value);
        });
        
        // Автозаполнение данных об оружии
        const weaponSelect = modal.querySelector('#combat-weapon');
        weaponSelect?.addEventListener('change', (e) => {
            this.updateWeaponDetails(e.target.value);
        });

        // Обработчики для кнопок информации о дальности и длительности
        const rangeInfoBtn = modal.querySelector('#range-info');
        rangeInfoBtn?.addEventListener('click', () => {
            this.showRangeTable();
        });

        const durationInfoBtn = modal.querySelector('#duration-info');
        durationInfoBtn?.addEventListener('click', () => {
            this.showDurationTable();
        });

        document.body.appendChild(modal);
    }
    
    updateSkillFields(type) {
        const combatFields = document.getElementById('combat-fields');
        const magicFields = document.getElementById('magic-fields');
        const ritualFields = document.getElementById('ritual-fields');
        const activeCheckbox = document.querySelector('.active-skill-toggle-label').closest('.form-group');

        if (combatFields) combatFields.style.display = type === 'combat' ? 'block' : 'none';
        if (magicFields) magicFields.style.display = type === 'magic' ? 'block' : 'none';
        if (ritualFields) ritualFields.style.display = type === 'ritual' ? 'block' : 'none';
        // Скрываем чекбокс "Активный навык" для ритуалов
        if (activeCheckbox) activeCheckbox.style.display = type === 'ritual' ? 'none' : 'block';
    }

    showRangeTable() {
        const rangeData = [
            { range: 'На себя', description: 'Заклинание действует на творца', difficulty: 0 },
            { range: 'Касание', description: 'Цель, до которой можно дотронуться', difficulty: 1 },
            { range: 'Рядом', description: 'Дальность равна половине Проницательности, округляется в большую сторону', difficulty: 1 },
            { range: 'Далеко', description: 'Дальность равна Проницательности', difficulty: 1 },
            { range: 'Чувство', description: 'Везде, где маг может чувствовать цель', difficulty: 2 }
        ];

        const tableContent = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background: rgba(0,0,0,0.1);">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Дальность</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Описание</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Сложность</th>
                    </tr>
                </thead>
                <tbody>
                    ${rangeData.map(row => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">${row.range}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${row.description}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${row.difficulty > 0 ? '+' + row.difficulty : row.difficulty}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const modal = this.createExplanationModal('Таблица дальности', tableContent);
        document.body.appendChild(modal);
    }

    showDurationTable() {
        const durationData = [
            { duration: 'Концентрация', description: 'Пока не будут использована Выносливость или Душа', difficulty: 0 },
            { duration: 'Краткая', description: 'Количество раундов, равное Проницательности', difficulty: 1 },
            { duration: 'Сцена', description: 'Длится одну сцену', difficulty: 2 },
            { duration: 'Сцены', description: 'Количество сцен, равное Проницательности', difficulty: 2 },
            { duration: 'Отдых', description: 'Количество отдыха, равное Проницательности', difficulty: 2 },
            { duration: 'Жизнь', description: 'Длится, пока заклинатель жив', difficulty: 2 },
            { duration: 'Вечность', description: 'Длится, пока не будет рассеяно', difficulty: 2 }
        ];

        const tableContent = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background: rgba(0,0,0,0.1);">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Длительность</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Описание</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Сложность</th>
                    </tr>
                </thead>
                <tbody>
                    ${durationData.map(row => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;">${row.duration}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${row.description}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${row.difficulty > 0 ? '+' + row.difficulty : row.difficulty}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const modal = this.createExplanationModal('Таблица длительности', tableContent);
        document.body.appendChild(modal);
    }
    
    updateWeaponDetails(weaponName) {
        if (!weaponName) {
            // Если "Без оружия" - устанавливаем значения по умолчанию
            document.getElementById('combat-weapon-type').value = 'естественное';
            document.getElementById('combat-damage').value = '1';
            document.getElementById('combat-quality').value = '1';
            return;
        }
        
        // Находим оружие в снаряжении
        const weapon = characterSheet.state.equipment.find(item => 
            item.category === 'weapons' && item.name === weaponName
        );
        
        if (weapon) {
            document.getElementById('combat-weapon-type').value = weapon.weaponType || '';
            document.getElementById('combat-damage').value = weapon.damage || '';
            document.getElementById('combat-quality').value = weapon.quality || '1';
        }
    }
    
    saveSkill(skillIndex = null) {
        const form = document.getElementById('combat-skill-form');
        if (!form) return;

        const type = document.getElementById('skill-type').value;
        let skillData = {
            name: document.getElementById('skill-name').value,
            type: type,
            description: document.getElementById('skill-description').value
        };

        // Активный навык только для боевых искусств и магии
        if (type !== 'ritual') {
            skillData.isActive = document.getElementById('skill-is-active').checked;
        } else {
            skillData.isActive = false;
        }

        if (type === 'combat') {
            skillData.soulCost = parseInt(document.getElementById('combat-soul-cost').value) || 0;
            skillData.enduranceCost = parseInt(document.getElementById('combat-endurance-cost').value) || 0;
            skillData.attackChar = document.getElementById('combat-attack-char').value;
            skillData.weaponName = document.getElementById('combat-weapon').value;
            skillData.weaponType = document.getElementById('combat-weapon-type').value;
            skillData.damage = document.getElementById('combat-damage').value;
            skillData.quality = parseInt(document.getElementById('combat-quality').value) || 1;
        } else if (type === 'magic') {
            skillData.difficulty = parseInt(document.getElementById('magic-difficulty').value) || 0;
            skillData.range = document.getElementById('magic-range').value;
            skillData.duration = document.getElementById('magic-duration').value;
            skillData.attackChar = document.getElementById('magic-attack-char').value;
        } else if (type === 'ritual') {
            skillData.cost = document.getElementById('ritual-cost').value;
            skillData.requirements = document.getElementById('ritual-requirements').value;
            skillData.castTime = document.getElementById('ritual-cast-time').value;
        }

        if (skillIndex !== null) {
            characterSheet.state.combatSkills[skillIndex] = skillData;
        } else {
            characterSheet.state.combatSkills.push(skillData);
        }

        characterSheet.saveState();
        this.renderBlock();

        document.querySelector('.modal.active')?.remove();
    }
    
    removeSkill(index) {
        characterSheet.state.combatSkills.splice(index, 1);
        characterSheet.saveState();
        this.renderBlock();
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
window.combatSkillsManager = new CombatSkillsManager();