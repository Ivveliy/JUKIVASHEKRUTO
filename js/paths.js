// paths.js - Блок рангов пути
class PathsManager {
    constructor() {
        this.clickHandler = null;
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
        const content = document.getElementById('content-paths');
        if (!content) return;

        content.innerHTML = `
            <button class="add-btn" id="add-path-btn" style="margin-bottom: 15px;">
                <i class="fas fa-plus"></i> Добавить путь
            </button>
            
            <div class="paths-list">
                ${this.renderPathsList()}
            </div>
        `;

        this.setupEventListeners();
    }
    
    renderPathsList() {
        if (characterSheet.state.paths.length === 0) {
            return '<p class="empty-list">Нет добавленных путей</p>';
        }
        
        // Разделяем пути по типам
        const military = characterSheet.state.paths.filter(path => path.type === 'Военный');
        const mystical = characterSheet.state.paths.filter(path => path.type === 'Мистический');

        let html = '';

        if (military.length > 0) {
            html += `<h4>Военные пути</h4>`;
            html += military.map((path) => {
                const globalIndex = characterSheet.state.paths.findIndex(p => p === path);
                return this.renderPathItem(path, globalIndex);
            }).join('');
        }

        if (mystical.length > 0) {
            html += `<h4 style="margin-top: 20px;">Мистические пути</h4>`;
            html += mystical.map((path) => {
                const globalIndex = characterSheet.state.paths.findIndex(p => p === path);
                return this.renderPathItem(path, globalIndex);
            }).join('');
        }
        
        // Сводка бонусов
        const militaryRanks = military.reduce((sum, path) => sum + path.rank, 0);
        const mysticalRanks = mystical.reduce((sum, path) => sum + path.rank, 0);
        
        html += `
            <div class="path-summary" style="margin-top: 20px; padding: 10px; background-color: var(--light-bg); border-radius: var(--radius);">
                <h5>Сводка бонусов:</h5>
                <div>Военные пути: +${militaryRanks} к максимальной выносливости</div>
                <div>Мистические пути: +${mysticalRanks} к максимальной душе</div>
            </div>
        `;
        
        return html;
    }
    
    renderPathItem(path, index) {
        const ranks = [1, 2, 3];
        const hasDescriptions = path.rankDescriptions && path.rankDescriptions.length > 0;

        let rankDescriptions = '';
        if (hasDescriptions) {
            rankDescriptions = path.rankDescriptions.map((desc, i) => `
                <div class="rank-description hidden" id="rank-desc-${index}-${i}" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.3s ease, margin 0.3s ease;">
                    <strong>Ранг ${i + 1}:</strong> ${this.formatDescription(desc)}
                </div>
            `).join('');
        }

        return `
            <div class="list-item" data-index="${index}">
                <div style="flex-grow: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <strong>${path.name}</strong>
                            <div style="margin-top: 5px;">
                                <small>Тип: ${path.type}</small>
                            </div>
                        </div>
                        <div class="path-rank">
                            ${ranks.map(rank => `
                                <div class="rank-dot ${path.rank >= rank ? 'filled' : ''}"></div>
                            `).join('')}
                        </div>
                    </div>
                    ${hasDescriptions ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong>Описания рангов:</strong>
                            <button class="path-ranks-toggle" data-index="${index}" title="Показать описания рангов">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    ` : ''}
                    ${rankDescriptions}
                </div>
                <div class="list-item-controls">
                    <button class="edit-path" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="remove-path" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Удаляем старый обработчик если он есть
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }

        // Создаём новый обработчик
        this.clickHandler = (e) => {
            if (e.target.closest('#add-path-btn')) {
                this.showPathModal();
            } else if (e.target.closest('.edit-path')) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(e.target.closest('.list-item').dataset.index);
                this.showPathModal(index);
            } else if (e.target.closest('.remove-path')) {
                e.preventDefault();
                const button = e.target.closest('.remove-path');
                const index = parseInt(button.closest('.list-item').dataset.index);
                button.disabled = true;
                this.removePath(index, button);
            } else if (e.target.closest('.path-ranks-toggle')) {
                e.preventDefault();
                e.stopPropagation();
                const btn = e.target.closest('.path-ranks-toggle');
                const index = parseInt(btn.dataset.index);
                this.togglePathRankDescriptions(index);
            }
        };

        document.addEventListener('click', this.clickHandler);
    }
    
    showPathModal(pathIndex = null) {
        const path = pathIndex !== null ? 
            characterSheet.state.paths[pathIndex] : 
            this.getDefaultPath();
        
        const modalContent = `
            <form id="path-form">
                <div class="form-group">
                    <label for="path-name">Название пути</label>
                    <input type="text" id="path-name" class="form-control" value="${path.name}" required>
                </div>
                
                <div class="form-group">
                    <label for="path-type">Тип пути</label>
                    <select id="path-type" class="form-control" required>
                        <option value="Военный" ${path.type === 'Военный' ? 'selected' : ''}>Военный</option>
                        <option value="Мистический" ${path.type === 'Мистический' ? 'selected' : ''}>Мистический</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Ранг в пути</label>
                    <div class="path-rank">
                        <div class="rank-dot ${path.rank >= 1 ? 'filled' : ''}" data-modal-rank="1"></div>
                        <div class="rank-dot ${path.rank >= 2 ? 'filled' : ''}" data-modal-rank="2"></div>
                        <div class="rank-dot ${path.rank >= 3 ? 'filled' : ''}" data-modal-rank="3"></div>
                    </div>
                    <input type="hidden" id="path-rank" value="${path.rank}">
                </div>
                
                <div id="rank-descriptions">
                    ${[1, 2, 3].map(rank => `
                        <div class="form-group rank-description-group" style="display: ${path.rank >= rank ? 'block' : 'none'};">
                            <label for="path-desc-${rank}">Описание ранга ${rank}</label>
                            <textarea id="path-desc-${rank}" class="form-control" rows="2">${path.rankDescriptions?.[rank - 1] || ''}</textarea>
                        </div>
                    `).join('')}
                </div>
            </form>
        `;
        
        const modal = this.createModal(
            pathIndex !== null ? 'Редактировать путь' : 'Добавить путь',
            modalContent,
            () => this.savePath(pathIndex)
        );
        
        // Обработчики для рангов в модальном окне
        modal.querySelectorAll('.rank-dot[data-modal-rank]').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const rank = parseInt(e.target.dataset.modalRank);
                this.updateModalRank(rank);
            });
        });
        
        // Обновление полей описания при изменении ранга
        const typeSelect = modal.querySelector('#path-type');
        typeSelect?.addEventListener('change', () => {
            this.updateRankDescriptions();
        });
        
        document.body.appendChild(modal);
    }
    
    getDefaultPath() {
        return {
            name: '',
            type: 'Военный',
            rank: 1,
            rankDescriptions: []
        };
    }
    
    updateModalRank(rank) {
        document.getElementById('path-rank').value = rank;
        
        // Обновляем визуальное отображение рангов
        document.querySelectorAll('.rank-dot[data-modal-rank]').forEach(dot => {
            const dotRank = parseInt(dot.dataset.modalRank);
            if (dotRank <= rank) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
        
        // Показываем/скрываем поля описания
        document.querySelectorAll('.rank-description-group').forEach((group, index) => {
            const groupRank = index + 1;
            group.style.display = groupRank <= rank ? 'block' : 'none';
        });
    }
    
    updateRankDescriptions() {
        // При изменении типа пути можно добавить логику, если нужно
    }
    
    savePath(pathIndex = null) {
        const form = document.getElementById('path-form');
        if (!form) return;
        
        const rank = parseInt(document.getElementById('path-rank').value) || 1;
        const rankDescriptions = [];
        
        for (let i = 1; i <= rank; i++) {
            const desc = document.getElementById(`path-desc-${i}`).value;
            rankDescriptions.push(desc);
        }
        
        const pathData = {
            name: document.getElementById('path-name').value,
            type: document.getElementById('path-type').value,
            rank: rank,
            rankDescriptions: rankDescriptions
        };
        
        if (pathIndex !== null) {
            characterSheet.state.paths[pathIndex] = pathData;
        } else {
            characterSheet.state.paths.push(pathData);
        }
        
        characterSheet.saveState();
        characterSheet.updateAllCharacteristics();
        
        // Обновляем слоты амулетов при изменении рангов путей
        if (window.updateCharmSlotsFromPaths) {
            window.updateCharmSlotsFromPaths();
        }
        
        this.renderBlock();

        document.querySelector('.modal.active')?.remove();
    }
    
    removePath(index, button) {
        if (confirm('Удалить этот путь?')) {
            characterSheet.state.paths.splice(index, 1);
            characterSheet.saveState();
            characterSheet.updateAllCharacteristics();
            
            // Обновляем слоты амулетов при удалении пути
            if (window.updateCharmSlotsFromPaths) {
                window.updateCharmSlotsFromPaths();
            }
            
            this.renderBlock();
        } else {
            button.disabled = false;
        }
    }

    togglePathRankDescriptions(index) {
        const path = characterSheet.state.paths[index];
        const btn = document.querySelector(`.path-ranks-toggle[data-index="${index}"]`);
        const icon = btn?.querySelector('i');
        
        if (!btn || !icon) return;
        
        // Сворачиваем/разворачиваем все описания рангов для этого пути
        for (let i = 0; i < path.rankDescriptions?.length; i++) {
            const desc = document.getElementById(`rank-desc-${index}-${i}`);
            if (desc) {
                const isHidden = desc.classList.contains('hidden');
                
                if (isHidden) {
                    desc.classList.remove('hidden');
                    // Небольшая задержка для правильного вычисления scrollHeight
                    setTimeout(() => {
                        desc.style.maxHeight = (desc.scrollHeight + 30) + 'px';
                    }, 10);
                } else {
                    desc.classList.add('hidden');
                    desc.style.maxHeight = '0';
                }
            }
        }
        
        // Меняем иконку кнопки
        setTimeout(() => {
            const isHidden = document.getElementById(`rank-desc-${index}-0`)?.classList.contains('hidden');
            icon.className = isHidden ? 'fas fa-chevron-right' : 'fas fa-chevron-down';
            btn.title = isHidden ? 'Показать описания рангов' : 'Скрыть описания рангов';
        }, 50);
    }

    setPathRank(index, rank) {
        characterSheet.state.paths[index].rank = rank;
        characterSheet.saveState();
        characterSheet.updateAllCharacteristics();
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
window.pathsManager = new PathsManager();