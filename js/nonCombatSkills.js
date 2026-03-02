// nonCombatSkills.js - Блок не боевых навыков
class NonCombatSkillsManager {
    constructor() {
        this.clickHandler = null;
        this.removing = false;
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
    }
    
    renderBlock() {
        const content = document.getElementById('content-nonCombatSkills');
        if (!content) return;

        content.innerHTML = `
            <button class="add-btn" id="add-skill-btn" style="margin-bottom: 15px;">
                <i class="fas fa-plus"></i> Добавить навык
            </button>
            
            <div class="skills-list">
                ${this.renderSkillsList()}
            </div>
        `;

        this.setupEventListeners();
    }
    
    renderSkillsList() {
        if (characterSheet.state.nonCombatSkills.length === 0) {
            return '<p class="empty-list">Нет не боевых навыков</p>';
        }

        return characterSheet.state.nonCombatSkills.map((skill, index) => `
            <div class="skill-item" data-index="${index}">
                <div class="skill-header">
                    <div style="flex-grow: 1;">
                        <strong>${skill.name}</strong>
                        <div class="skill-bonus">
                            ${this.renderSkillBonus(skill)}
                        </div>
                    </div>
                    <div class="list-item-controls">
                        <button class="skill-toggle" data-index="${index}" title="Показать описание">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="edit-skill" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="remove-skill" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="skill-description hidden" id="skill-desc-${index}">
                    <strong>Описание:</strong> ${skill.description ? this.formatDescription(skill.description) : 'Нет описания'}
                    ${skill.characteristics && skill.characteristics.length > 0 ? `
                        <div style="margin-top: 5px;">
                            <strong>Основа:</strong> ${skill.characteristics.map(char => this.getCharacteristicName(char)).join(', ')}
                            ${skill.modifier ? ` + ${skill.modifier}` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
    
    renderSkillBonus(skill) {
        if (skill.characteristics && skill.characteristics.length > 0) {
            const charNames = {
                might: 'Мощь', insight: 'Проницательность', shell: 'Панцирь', grace: 'Грация',
                attractiveness: 'Привлекательность', horror: 'Жуть'
            };

            const effects = skill.characteristics.map(char => charNames[char] || char).join(', ');
            const modifier = skill.modifier || 0;
            const sign = modifier >= 0 ? '+' : '';
            const modifierText = modifier !== 0 ? ` ${sign}${modifier}` : '';

            return `<small>Основа: ${effects}${modifierText}</small>`;
        }

        return skill.modifier ? `<small>Бонус: ${skill.modifier}</small>` : '';
    }
    
    getCharacteristicName(key) {
        const names = {
            might: 'Мощь',
            insight: 'Проницательность',
            shell: 'Панцирь',
            grace: 'Грация',
            attractiveness: 'Привлекательность',
            horror: 'Жуть'
        };
        return names[key] || key;
    }
    
    setupEventListeners() {
        const block = document.getElementById('block-nonCombatSkills');
        if (!block) return;

        // Remove existing click handler if it exists
        if (this.clickHandler) {
            block.removeEventListener('click', this.clickHandler);
        }

        this.clickHandler = (e) => {
            if (e.target.closest('#add-skill-btn')) {
                this.showSkillModal();
            } else if (e.target.closest('.edit-skill')) {
                const index = parseInt(e.target.closest('.skill-item').dataset.index);
                this.showSkillModal(index);
            } else if (e.target.closest('.remove-skill')) {
                e.preventDefault();
                e.stopPropagation();
                if (this.removing) return;
                this.removing = true;
                const button = e.target.closest('.remove-skill');
                const index = parseInt(button.closest('.skill-item').dataset.index);
                button.disabled = true;
                if (confirm('Удалить этот навык?')) {
                    this.removeSkill(index);
                } else {
                    button.disabled = false;
                    this.removing = false;
                }
            } else if (e.target.closest('.skill-toggle')) {
                const index = parseInt(e.target.closest('.skill-toggle').dataset.index);
                this.toggleSkillDescription(index);
            }
        };

        block.addEventListener('click', this.clickHandler);
    }
    
    showSkillModal(skillIndex = null) {
        const skill = skillIndex !== null ? 
            characterSheet.state.nonCombatSkills[skillIndex] : 
            this.getDefaultSkill();
        
        const characteristics = [
            { id: 'might', name: 'Мощь' },
            { id: 'insight', name: 'Проницательность' },
            { id: 'shell', name: 'Панцирь' },
            { id: 'grace', name: 'Грация' },
            { id: 'attractiveness', name: 'Привлекательность' },
            { id: 'horror', name: 'Жуть' }
        ];
        
        const modalContent = `
            <form id="skill-form">
                <div class="form-group">
                    <label for="skill-name">Название навыка</label>
                    <input type="text" id="skill-name" class="form-control" value="${skill.name}" required>
                </div>
                
                <div class="form-group">
                    <label>Основные характеристики (можно выбрать несколько):</label>
                    <div class="characteristics-checkboxes">
                        ${characteristics.map(char => `
                            <div class="checkbox-item">
                                <label>
                                    <input type="checkbox" name="skill-characteristics" value="${char.id}" 
                                           ${skill.characteristics?.includes(char.id) ? 'checked' : ''}>
                                    ${char.name}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="skill-modifier">Модификатор</label>
                    <input type="number" step="0.5" id="skill-modifier" class="form-control" value="${skill.modifier || 0}">
                    <small>Дополнительный бонус к характеристике</small>
                </div>
                
                <div class="form-group">
                    <label for="skill-description">Описание навыка</label>
                    <textarea id="skill-description" class="form-control" rows="3">${skill.description || ''}</textarea>
                </div>
            </form>
        `;
        
        const modal = this.createModal(
            skillIndex !== null ? 'Редактировать навык' : 'Добавить навык',
            modalContent,
            () => this.saveSkill(skillIndex)
        );
        
        document.body.appendChild(modal);
    }
    
    getDefaultSkill() {
        return {
            name: '',
            characteristics: [],
            modifier: 0,
            description: ''
        };
    }
    
    saveSkill(skillIndex = null) {
        const form = document.getElementById('skill-form');
        if (!form) return;
        
        const selectedCharacteristics = Array.from(
            document.querySelectorAll('input[name="skill-characteristics"]:checked')
        ).map(cb => cb.value);
        
        const skillData = {
            name: document.getElementById('skill-name').value,
            characteristics: selectedCharacteristics,
            modifier: parseFloat(document.getElementById('skill-modifier').value) || 0,
            description: document.getElementById('skill-description').value
        };
        
        if (skillIndex !== null) {
            characterSheet.state.nonCombatSkills[skillIndex] = skillData;
        } else {
            characterSheet.state.nonCombatSkills.push(skillData);
        }
        
        characterSheet.saveState();
        this.renderBlock();

        document.querySelector('.modal.active')?.remove();
    }
    
    removeSkill(index) {
        characterSheet.state.nonCombatSkills.splice(index, 1);
        characterSheet.saveState();
        this.renderBlock();
        this.setupEventListeners();
        this.removing = false;
    }
    
    toggleSkillDescription(index) {
        const desc = document.getElementById(`skill-desc-${index}`);
        const toggle = document.querySelector(`.skill-toggle[data-index="${index}"] i`);

        if (desc) {
            const isHidden = desc.classList.contains('hidden');

            if (isHidden) {
                desc.classList.remove('hidden');
                if (toggle) {
                    toggle.className = 'fas fa-chevron-down';
                }
            } else {
                desc.classList.add('hidden');
                if (toggle) {
                    toggle.className = 'fas fa-chevron-right';
                }
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
window.nonCombatSkillsManager = new NonCombatSkillsManager();