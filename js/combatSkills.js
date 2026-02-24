// combatSkills.js - Блок боевых навыков
class CombatSkillsManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.renderBlock();
    }
    
    renderBlock() {
        const content = document.getElementById('content-combatSkills');
        if (!content) return;
        
        content.innerHTML = `
            <div class="combat-skills-list">
                ${this.renderSkillsList()}
            </div>
            <button class="add-btn" id="add-combat-skill-btn">
                <i class="fas fa-plus"></i> Добавить боевой навык
            </button>
        `;
        
        this.setupEventListeners();
    }
    
    renderSkillsList() {
        if (characterSheet.state.combatSkills.length === 0) {
            return '<p class="empty-list">Нет боевых навыков</p>';
        }
        
        // Разделяем навыки по типам
        const combatArts = characterSheet.state.combatSkills.filter(skill => skill.type === 'combat');
        const magic = characterSheet.state.combatSkills.filter(skill => skill.type === 'magic');
        
        let html = '';
        
        if (combatArts.length > 0) {
            html += `<h4>Боевые искусства</h4>`;
            html += combatArts.map((skill, index) => this.renderSkillItem(skill, index)).join('');
        }
        
        if (magic.length > 0) {
            html += `<h4 style="margin-top: 20px;">Магия</h4>`;
            html += magic.map((skill, index) => this.renderSkillItem(skill, index)).join('');
        }
        
        return html;
    }
    
    renderSkillItem(skill, originalIndex) {
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
                ${skill.range ? `<div><small>Дальность: ${skill.range}</small></div>` : ''}
                ${skill.duration ? `<div><small>Длительность: ${skill.duration}</small></div>` : ''}
            `;
        }
        
        return `
            <div class="list-item" data-index="${index}">
                <div>
                    <strong>${skill.name}</strong>
                    <div class="skill-type">
                        <small>${skill.type === 'combat' ? 'Боевое искусство' : 'Магия'}</small>
                    </div>
                    ${details}
                    ${skill.description ? `<div><small>${skill.description}</small></div>` : ''}
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
            if (e.target.closest('#add-combat-skill-btn')) {
                this.showSkillModal();
            } else if (e.target.closest('.edit-combat-skill')) {
                const index = parseInt(e.target.closest('.list-item').dataset.index);
                this.showSkillModal(index);
            } else if (e.target.closest('.remove-combat-skill')) {
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
        };

        block.addEventListener('click', this.clickHandler);
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
                        <select id="magic-range" class="form-control">
                            <option value="На себя" ${skill?.range === 'На себя' ? 'selected' : ''}>На себя</option>
                            <option value="Касание" ${skill?.range === 'Касание' ? 'selected' : ''}>Касание</option>
                            <option value="Рядом" ${skill?.range === 'Рядом' ? 'selected' : ''}>Рядом</option>
                            <option value="Далеко" ${skill?.range === 'Далеко' ? 'selected' : ''}>Далеко</option>
                            <option value="Чувство" ${skill?.range === 'Чувство' ? 'selected' : ''}>Чувство</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="magic-duration">Длительность</label>
                        <select id="magic-duration" class="form-control">
                            <option value="Концентрация" ${skill?.duration === 'Концентрация' ? 'selected' : ''}>Концентрация</option>
                            <option value="Краткая" ${skill?.duration === 'Краткая' ? 'selected' : ''}>Краткая</option>
                            <option value="Сцена" ${skill?.duration === 'Сцена' ? 'selected' : ''}>Сцена</option>
                            <option value="Сцены" ${skill?.duration === 'Сцены' ? 'selected' : ''}>Сцены</option>
                            <option value="Отдых" ${skill?.duration === 'Отдых' ? 'selected' : ''}>Отдых</option>
                            <option value="Жизнь" ${skill?.duration === 'Жизнь' ? 'selected' : ''}>Жизнь</option>
                            <option value="Вечность" ${skill?.duration === 'Вечность' ? 'selected' : ''}>Вечность</option>
                        </select>
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
                
                <div class="form-group">
                    <label for="skill-description">Описание</label>
                    <textarea id="skill-description" class="form-control" rows="3">${skill?.description || ''}</textarea>
                </div>
            </form>
        `;
        
        const modal = this.createModal(
            skillIndex !== null ? 'Редактировать боевой навык' : 'Добавить боевой навык',
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
        
        document.body.appendChild(modal);
    }
    
    updateSkillFields(type) {
        const combatFields = document.getElementById('combat-fields');
        const magicFields = document.getElementById('magic-fields');
        
        if (combatFields) combatFields.style.display = type === 'combat' ? 'block' : 'none';
        if (magicFields) magicFields.style.display = type === 'magic' ? 'block' : 'none';
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