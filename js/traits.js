// traits.js - Блок черт
class TraitsManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.listenersAdded = false;
        this.removing = false;
        this.clickHandler = null;
        this.renderBlock();
        this.setupEventListeners();
    }
    
    renderBlock() {
        this.listenersAdded = false;
        const content = document.getElementById('content-traits');
        if (!content) return;

        content.innerHTML = `
            <button class="add-btn" id="add-trait-btn" style="margin-bottom: 15px;">
                <i class="fas fa-plus"></i> Добавить черту
            </button>
            
            <div class="traits-list">
                ${this.renderTraitsList()}
            </div>
        `;
    }
    
    renderTraitsList() {
        if (characterSheet.state.traits.length === 0) {
            return '<p class="empty-list">Нет добавленных черт</p>';
        }
        
        return characterSheet.state.traits.map((trait, index) => `
            <div class="list-item" data-index="${index}">
                <div style="flex-grow: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <strong>${trait.name}</strong>
                            <div class="trait-modifiers">
                                ${this.renderTraitModifiers(trait)}
                            </div>
                        </div>
                    </div>
                    ${trait.description ? `
                        <div class="trait-description hidden" id="trait-desc-${index}" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease;">
                            <small>${trait.description}</small>
                        </div>
                    ` : ''}
                </div>
                <div class="list-item-controls">
                    ${trait.description ? `
                        <button class="trait-toggle" data-index="${index}" title="Показать/скрыть описание">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    ` : ''}
                    <button class="edit-trait" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="remove-trait" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderTraitModifiers(trait) {
        const mods = [];
        const charNames = {
            might: 'Мощь', insight: 'Проницательность', shell: 'Панцирь', grace: 'Грация',
            attractiveness: 'Привлекательность', horror: 'Жуть', speed: 'Скорость',
            heart: 'Сердца', endurance: 'Выносливость', soul: 'Душа', hunger: 'Голод',
            load: 'Нагрузка'
        };
        
        Object.entries(trait.modifiers || {}).forEach(([key, value]) => {
            if (value !== 0 && charNames[key]) {
                mods.push(`${charNames[key]} ${value > 0 ? '+' : ''}${value}`);
            }
        });
        
        return mods.length > 0 ? `<small>${mods.join(', ')}</small>` : '';
    }
    
    setupEventListeners() {
        const block = document.getElementById('block-traits');
        if (!block) return;

        // Remove existing click handler if it exists
        if (this.clickHandler) {
            block.removeEventListener('click', this.clickHandler);
        }

        this.clickHandler = (e) => {
            if (e.target.closest('#add-trait-btn')) {
                this.showTraitModal();
            } else if (e.target.closest('.edit-trait')) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(e.target.closest('.list-item').dataset.index);
                this.showTraitModal(index);
            } else if (e.target.closest('.remove-trait')) {
                e.preventDefault();
                e.stopPropagation();
                if (this.removing) return;
                this.removing = true;
                const button = e.target.closest('.remove-trait');
                const index = parseInt(button.closest('.list-item').dataset.index);
                button.disabled = true;
                if (confirm('Удалить эту черту?')) {
                    this.removeTrait(index);
                } else {
                    button.disabled = false;
                    this.removing = false;
                }
            } else if (e.target.closest('.trait-toggle')) {
                const index = parseInt(e.target.closest('.trait-toggle').dataset.index);
                this.toggleTraitDescription(index);
            }
        };

        block.addEventListener('click', this.clickHandler);
    }
    
    showTraitModal(traitIndex = null) {
        const trait = traitIndex !== null ? 
            characterSheet.state.traits[traitIndex] : 
            this.getDefaultTrait();
        
        const modalContent = `
            <form id="trait-form">
                <div class="form-group">
                    <label for="trait-name">Название черты</label>
                    <input type="text" id="trait-name" class="form-control" value="${trait.name}" required>
                </div>
                
                <h4>Влияние на характеристики</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="trait-might">Мощь</label>
                        <input type="number" step="0.5" id="trait-might" class="form-control" value="${trait.modifiers.might || 0}">
                    </div>
                    <div class="form-group">
                        <label for="trait-insight">Проницательность</label>
                        <input type="number" step="0.5" id="trait-insight" class="form-control" value="${trait.modifiers.insight || 0}">
                    </div>
                    <div class="form-group">
                        <label for="trait-shell">Панцирь</label>
                        <input type="number" step="0.5" id="trait-shell" class="form-control" value="${trait.modifiers.shell || 0}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="trait-grace">Грация</label>
                        <input type="number" step="0.5" id="trait-grace" class="form-control" value="${trait.modifiers.grace || 0}">
                    </div>
                    <div class="form-group">
                        <label for="trait-attractiveness">Привлекательность</label>
                        <input type="number" step="0.5" id="trait-attractiveness" class="form-control" value="${trait.modifiers.attractiveness || 0}">
                    </div>
                    <div class="form-group">
                        <label for="trait-horror">Жуть</label>
                        <input type="number" step="0.5" id="trait-horror" class="form-control" value="${trait.modifiers.horror || 0}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="trait-speed">Скорость</label>
                        <input type="number" step="1" id="trait-speed" class="form-control" value="${trait.modifiers.speed || 0}">
                    </div>
                    <div class="form-group">
                        <label for="trait-heart">Сердца (макс.)</label>
                        <input type="number" step="1" id="trait-heart" class="form-control" value="${trait.modifiers.heart || 0}">
                    </div>
                    <div class="form-group">
                        <label for="trait-endurance">Выносливость (макс.)</label>
                        <input type="number" step="1" id="trait-endurance" class="form-control" value="${trait.modifiers.endurance || 0}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="trait-soul">Душа (макс.)</label>
                        <input type="number" step="1" id="trait-soul" class="form-control" value="${trait.modifiers.soul || 0}">
                    </div>
                    <div class="form-group">
                        <label for="trait-hunger">Голод</label>
                        <input type="number" step="1" id="trait-hunger" class="form-control" value="${trait.modifiers.hunger || 0}">
                    </div>
                    <div class="form-group">
                        <label for="trait-load">Нагрузка</label>
                        <input type="number" step="1" id="trait-load" class="form-control" value="${trait.modifiers.load || 0}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="trait-description">Описание черты</label>
                    <textarea id="trait-description" class="form-control" rows="3">${trait.description || ''}</textarea>
                </div>
            </form>
        `;
        
        const modal = this.createModal(
            traitIndex !== null ? 'Редактировать черту' : 'Добавить черту',
            modalContent,
            () => this.saveTrait(traitIndex)
        );
        
        document.body.appendChild(modal);
    }
    
    getDefaultTrait() {
        return {
            name: '',
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
                hunger: 0,
                load: 0
            },
            description: ''
        };
    }
    
    saveTrait(traitIndex = null) {
        const form = document.getElementById('trait-form');
        if (!form) return;

        const traitData = {
            name: document.getElementById('trait-name').value,
            modifiers: {
                might: parseFloat(document.getElementById('trait-might').value) || 0,
                insight: parseFloat(document.getElementById('trait-insight').value) || 0,
                shell: parseFloat(document.getElementById('trait-shell').value) || 0,
                grace: parseFloat(document.getElementById('trait-grace').value) || 0,
                attractiveness: parseFloat(document.getElementById('trait-attractiveness').value) || 0,
                horror: parseFloat(document.getElementById('trait-horror').value) || 0,
                speed: parseFloat(document.getElementById('trait-speed').value) || 0,
                heart: parseInt(document.getElementById('trait-heart').value) || 0,
                endurance: parseInt(document.getElementById('trait-endurance').value) || 0,
                soul: parseInt(document.getElementById('trait-soul').value) || 0,
                hunger: parseInt(document.getElementById('trait-hunger').value) || 0,
                load: parseInt(document.getElementById('trait-load').value) || 0
            },
            description: document.getElementById('trait-description').value
        };

        if (traitIndex !== null) {
            characterSheet.state.traits[traitIndex] = traitData;
        } else {
            characterSheet.state.traits.push(traitData);
        }

        characterSheet.saveState();
        characterSheet.updateAllCharacteristics();
        this.renderBlock();

        document.querySelector('.modal.active')?.remove();
    }
    
    removeTrait(index) {
        characterSheet.state.traits.splice(index, 1);
        characterSheet.saveState();
        characterSheet.updateAllCharacteristics();
        this.renderBlock();
        this.setupEventListeners();
        this.removing = false;
    }
    
    toggleTraitDescription(index) {
        const desc = document.getElementById(`trait-desc-${index}`);
        const toggle = document.querySelector(`.trait-toggle[data-index="${index}"] i`);

        if (desc) {
            const isHidden = desc.classList.contains('hidden');

            if (isHidden) {
                desc.classList.remove('hidden');
                desc.style.maxHeight = (desc.scrollHeight + 20) + 'px';
                if (toggle) {
                    toggle.className = 'fas fa-chevron-down';
                }
            } else {
                desc.classList.add('hidden');
                desc.style.maxHeight = '0';
                if (toggle) {
                    toggle.className = 'fas fa-chevron-right';
                }
            }
        }
    }

    // Метод для переназначения обработчиков после импорта
    refreshEventListeners() {
        this.setupEventListeners();
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
window.traitsManager = new TraitsManager();