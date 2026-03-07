// characteristics.js - Блок характеристик
class CharacteristicsManager {
    constructor() {
        this.clickHandler = null;
        this.templates = {
            small: {
                name: 'Мелкий Жук',
                might: 2,
                insight: 3,
                shell: 3,
                absorption: 0,
                grace: 4,
                heart: 6,
                endurance: 3,
                soul: 3,
                attractiveness: 1.5,
                horror: 1,
                speed: 7,
                hunger: -1
            },
            medium: {
                name: 'Средний Жук',
                might: 3,
                insight: 3,
                shell: 3,
                absorption: 0,
                grace: 3,
                heart: 7,
                endurance: 3,
                soul: 3,
                attractiveness: 1,
                horror: 1,
                speed: 6,
                hunger: 4
            },
            large: {
                name: 'Большой Жук',
                might: 4,
                insight: 3,
                shell: 4,
                absorption: 0,
                grace: 2,
                heart: 8,
                endurance: 3,
                soul: 3,
                attractiveness: 1,
                horror: 1.5,
                speed: 5,
                hunger: 9
            }
        };

        this.explanations = {
            might: "Сила и физическая подготовленность жука. Мощь определяет, как эффективно жук применяет оружие и парирует удары. Также она используется для проверок, включающих проявления грубой силы, подъём значительного веса или атлетику.",
            grace: "Быстрота и ловкость движений жука. Грация определяет эффективность жука в бросках на дальнобойное оружия и уклонении от опасности. Она используется в проверках на ловкость, баланс и изящество. Манёвренность жука равна половине его Грации, округлённой в большую сторону. Каждый ход он может переместиться на количество клеток в пределах области угрозы противника, равное значению Манёвренности, не провоцируя атаку. Если жук покинет область угрозы, то он всё равно провоцирует атаку.",
            shell: "Толщина хитина и жёсткость плоти жука определяет сопротивление повреждениям и болезням.\n\nКогда по жуку проходит успешная физическая атака, он может совершить бросок Панциря на Впитывание урона. Тогда он игнорирует урон, равный числу успешно брошенных костей.\n\nРазмер Пояса жука равен половине значения его Панциря, округлённого в меньшую сторону. В Поясе хранятся различные предметы, к которым можно получить быстрый доступ в напряжённых ситуациях. Жук может взять предмет из Пояса в свободную руку и наоборот, не тратя Скорости.\n\nПодбор предмета не из Пояса или использование лежащей неподалёку вещи тратит значение Скорости, равное Весу предмета (минимум 1).\n\nВыбрасывание предмета не считается! К примеру, персонаж может выкинуть лопату не тратя Скорости, но ему следует помнить, что тогда её способен подобрать другой жук.",
            absorption: "У некоторых жуков есть очки Поглощения. После того, как Понижение Урона снизило вероятный урон, а часть полученного урона была Впитана, применяется Поглощение. Оно снижает полученный урон до суммы 1 и результата деления нацело оставшегося урона на ваше значение Поглощения. Это относится также к эффектам, наносящим урон постепенно, а также к невпитываемому урону.",
            insight: "Насколько жук внимателен и умён. Проницательность используется для многих элементов магии (будет объяснено в главе 7. Магия), а также для выполнения любой задачи, требующей остроту ума, чувств и отличную память.\n\nЯчейки Техник жука используются для подготовки его Искусств и Тайн, подобно тому, как персонажи в игре могут назначать способности на определённые клавиши.\n\nКоличество ячеек Техник жука равно половине его Проницательности, округлённой в меньшую сторону.",
            attractiveness: "Жуть и Привлекательность жука влияют на то,как он социально взаимодействует с другими жуками. Это может быть его внешний вид, поведение и даже запах.\n\nНачальные бонусные очки, которые вы можете вложить в Жуть и Привлекательность своего жука, при желании могут быть разделены между ними пополам.",
            horror: "Жуть и Привлекательность жука влияют на то,как он социально взаимодействует с другими жуками. Это может быть его внешний вид, поведение и даже запах.\n\nНачальные бонусные очки, которые вы можете вложить в Жуть и Привлекательность своего жука, при желании могут быть разделены между ними пополам.",
            speed: "Значение Скорости жука определяется его размером и чертами. Оно влияет на то, как быстро он двигается. Каждый ход жук может переместиться на число клеток, равное его Скорости."
        };

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
        window.updateCharacteristicsDisplay = () => this.updateDisplay();
    }
    
    renderBlock() {
        const content = document.getElementById('content-characteristics');
        if (!content) return;
        
        content.innerHTML = `
            <div class="template-selector">
                <h3>Шаблон жука</h3>
                <div class="template-buttons">
                    <button class="template-btn ${characterSheet.state.characteristics.template === 'small' ? 'active' : ''}" data-template="small">
                        Мелкий Жук
                    </button>
                    <button class="template-btn ${characterSheet.state.characteristics.template === 'medium' ? 'active' : ''}" data-template="medium">
                        Средний Жук
                    </button>
                    <button class="template-btn ${characterSheet.state.characteristics.template === 'large' ? 'active' : ''}" data-template="large">
                        Большой Жук
                    </button>
                </div>
            </div>

            <div class="heart-container">
                <h3><i class="fas fa-heart" style="color: var(--accent-red);"></i> Сердца</h3>
                <div class="characteristic">
                    <span class="char-name">Текущее/Максимальное</span>
                    <div class="char-value">
                        <input type="number" id="current-heart" class="form-control" style="width: 60px;"
                               value="${characterSheet.state.characteristics.current.heart}">
                        <span>/</span>
                        <input type="number" id="max-heart" class="form-control char-total" style="width: 60px;"
                               value="${characterSheet.state.characteristics.base.heart + characterSheet.state.characteristics.modifiers.heart}">
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="heart" data-type="current">-</button>
                            <button class="char-btn char-plus" data-char="heart" data-type="current">+</button>
                        </div>
                    </div>
                </div>
                <div class="vital-segments" id="heart-segments">
                    ${this.renderVitalSegments(characterSheet.state.characteristics.base.heart + characterSheet.state.characteristics.modifiers.heart, characterSheet.state.characteristics.current.heart, 'heart')}
                </div>
            </div>

            <div class="endurance-container">
                <h3><i class="fas fa-running" style="color: var(--accent-yellow);"></i> Выносливость</h3>
                <div class="characteristic">
                    <span class="char-name">Текущее/Максимальное</span>
                    <div class="char-value">
                        <input type="number" id="current-endurance" class="form-control" style="width: 60px;"
                               value="${characterSheet.state.characteristics.current.endurance}">
                        <span>/</span>
                        <input type="number" id="max-endurance" class="form-control char-total" style="width: 60px;"
                               value="${characterSheet.state.characteristics.base.endurance + characterSheet.state.characteristics.modifiers.endurance}">
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="endurance" data-type="current">-</button>
                            <button class="char-btn char-plus" data-char="endurance" data-type="current">+</button>
                        </div>
                    </div>
                </div>
                <div class="vital-segments" id="endurance-segments">
                    ${this.renderVitalSegments(characterSheet.state.characteristics.base.endurance + characterSheet.state.characteristics.modifiers.endurance, characterSheet.state.characteristics.current.endurance, 'endurance')}
                </div>
            </div>

            <div class="soul-container">
                <h3><i class="fas fa-magic" style="color: var(--accent-purple);"></i> Душа</h3>
                <div class="characteristic">
                    <span class="char-name">Текущее/Максимальное</span>
                    <div class="char-value">
                        <input type="number" id="current-soul" class="form-control" style="width: 60px;"
                               value="${characterSheet.state.characteristics.current.soul}">
                        <span>/</span>
                        <input type="number" id="max-soul" class="form-control char-total" style="width: 60px;"
                               value="${characterSheet.state.characteristics.base.soul + characterSheet.state.characteristics.modifiers.soul}">
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="soul" data-type="current">-</button>
                            <button class="char-btn char-plus" data-char="soul" data-type="current">+</button>
                        </div>
                    </div>
                </div>
    <div class="vital-segments" id="soul-segments">
        ${this.renderVitalSegments(characterSheet.state.characteristics.base.soul + characterSheet.state.characteristics.modifiers.soul, characterSheet.state.characteristics.current.soul, 'soul')}
    </div>
            </div>

            <div id="characteristics-list">
                <div class="characteristic">
                    <span class="char-name">Мощь</span>
                    <div class="char-value">
                        <input type="number" step="0.5" id="might-input" class="char-base-input form-control" data-char="might" value="${characterSheet.state.characteristics.base.might}" style="width: 60px; font-size: 0.9rem;">
                        <span> + </span>
                        <span class="char-mod" id="might-mod">${characterSheet.state.characteristics.modifiers.might >= 0 ? '+' : ''}${characterSheet.state.characteristics.modifiers.might}</span>
                        <span> = </span>
                        <span class="char-total" id="might-total">${(characterSheet.state.characteristics.base.might + characterSheet.state.characteristics.modifiers.might).toFixed(1)}</span>
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="might">-</button>
                            <button class="char-btn char-plus" data-char="might">+</button>
                        </div>
                    </div>
                </div>
                <div class="characteristic">
                    <span class="char-name">Проницательность</span>
                    <div class="char-value">
                        <input type="number" step="0.5" id="insight-input" class="char-base-input form-control" data-char="insight" value="${characterSheet.state.characteristics.base.insight}" style="width: 60px; font-size: 0.9rem;">
                        <span> + </span>
                        <span class="char-mod" id="insight-mod">${characterSheet.state.characteristics.modifiers.insight >= 0 ? '+' : ''}${characterSheet.state.characteristics.modifiers.insight}</span>
                        <span> = </span>
                        <span class="char-total" id="insight-total">${(characterSheet.state.characteristics.base.insight + characterSheet.state.characteristics.modifiers.insight).toFixed(1)}</span>
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="insight">-</button>
                            <button class="char-btn char-plus" data-char="insight">+</button>
                        </div>
                    </div>
                </div>
                <div class="characteristic">
                    <span class="char-name">Панцирь</span>
                    <div class="char-value">
                        <input type="number" step="0.5" id="shell-input" class="char-base-input form-control" data-char="shell" value="${characterSheet.state.characteristics.base.shell}" style="width: 60px; font-size: 0.9rem;">
                        <span> + </span>
                        <span class="char-mod" id="shell-mod">${characterSheet.state.characteristics.modifiers.shell >= 0 ? '+' : ''}${characterSheet.state.characteristics.modifiers.shell}</span>
                        <span> = </span>
                        <span class="char-total" id="shell-total">${(characterSheet.state.characteristics.base.shell + characterSheet.state.characteristics.modifiers.shell).toFixed(1)}</span>
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="shell">-</button>
                            <button class="char-btn char-plus" data-char="shell">+</button>
                        </div>
                    </div>
                </div>
                <div class="characteristic">
                    <span class="char-name">Поглощение</span>
                    <div class="char-value">
                        <input type="number" step="0.5" id="absorption-input" class="char-base-input form-control" data-char="absorption" value="${characterSheet.state.characteristics.base.absorption}" style="width: 60px; font-size: 0.9rem;">
                        <span> + </span>
                        <span class="char-mod" id="absorption-mod">${characterSheet.state.characteristics.modifiers.absorption >= 0 ? '+' : ''}${characterSheet.state.characteristics.modifiers.absorption}</span>
                        <span> = </span>
                        <span class="char-total" id="absorption-total">${(characterSheet.state.characteristics.base.absorption + characterSheet.state.characteristics.modifiers.absorption).toFixed(1)}</span>
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="absorption">-</button>
                            <button class="char-btn char-plus" data-char="absorption">+</button>
                        </div>
                    </div>
                </div>
                <div class="characteristic">
                    <span class="char-name">Грация</span>
                    <div class="char-value">
                        <input type="number" step="0.5" id="grace-input" class="char-base-input form-control" data-char="grace" value="${characterSheet.state.characteristics.base.grace}" style="width: 60px; font-size: 0.9rem;">
                        <span> + </span>
                        <span class="char-mod" id="grace-mod">${characterSheet.state.characteristics.modifiers.grace >= 0 ? '+' : ''}${characterSheet.state.characteristics.modifiers.grace}</span>
                        <span> = </span>
                        <span class="char-total" id="grace-total">${(characterSheet.state.characteristics.base.grace + characterSheet.state.characteristics.modifiers.grace).toFixed(1)}</span>
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="grace">-</button>
                            <button class="char-btn char-plus" data-char="grace">+</button>
                        </div>
                    </div>
                </div>
                <div class="characteristic">
                    <span class="char-name">Привлекательность</span>
                    <div class="char-value">
                        <input type="number" step="0.5" id="attractiveness-input" class="char-base-input form-control" data-char="attractiveness" value="${characterSheet.state.characteristics.base.attractiveness}" style="width: 60px; font-size: 0.9rem;">
                        <span> + </span>
                        <span class="char-mod" id="attractiveness-mod">${characterSheet.state.characteristics.modifiers.attractiveness >= 0 ? '+' : ''}${characterSheet.state.characteristics.modifiers.attractiveness}</span>
                        <span> = </span>
                        <span class="char-total" id="attractiveness-total">${(characterSheet.state.characteristics.base.attractiveness + characterSheet.state.characteristics.modifiers.attractiveness).toFixed(1)}</span>
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="attractiveness">-</button>
                            <button class="char-btn char-plus" data-char="attractiveness">+</button>
                        </div>
                    </div>
                </div>
                <div class="characteristic">
                    <span class="char-name">Жуть</span>
                    <div class="char-value">
                        <input type="number" step="0.5" id="horror-input" class="char-base-input form-control" data-char="horror" value="${characterSheet.state.characteristics.base.horror}" style="width: 60px; font-size: 0.9rem;">
                        <span> + </span>
                        <span class="char-mod" id="horror-mod">${characterSheet.state.characteristics.modifiers.horror >= 0 ? '+' : ''}${characterSheet.state.characteristics.modifiers.horror}</span>
                        <span> = </span>
                        <span class="char-total" id="horror-total">${(characterSheet.state.characteristics.base.horror + characterSheet.state.characteristics.modifiers.horror).toFixed(1)}</span>
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="horror">-</button>
                            <button class="char-btn char-plus" data-char="horror">+</button>
                        </div>
                    </div>
                </div>
                <div class="characteristic">
                    <span class="char-name">Скорость</span>
                    <div class="char-value">
                        <input type="number" step="1" id="speed-input" class="char-base-input form-control" data-char="speed" value="${characterSheet.state.characteristics.base.speed}" style="width: 60px; font-size: 0.9rem;">
                        <span> + </span>
                        <span class="char-mod" id="speed-mod">${characterSheet.state.characteristics.modifiers.speed >= 0 ? '+' : ''}${characterSheet.state.characteristics.modifiers.speed}</span>
                        <span> = </span>
                        <span class="char-total" id="speed-total">${characterSheet.state.characteristics.base.speed + characterSheet.state.characteristics.modifiers.speed}</span>
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="speed">-</button>
                            <button class="char-btn char-plus" data-char="speed">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="satiety-container">
                <h3><i class="fas fa-apple-alt"></i> Сытость и Голод</h3>
                <div class="characteristic">
                    <span class="char-name">Сытость</span>
                    <div class="char-value">
                        <input type="number" id="satiety-input" class="form-control" style="width: 80px;"
                               value="${characterSheet.state.characteristics.base.satiety}">
                        <div class="char-controls">
                            <button class="char-btn char-details" id="satiety-info">
                                <i class="fas fa-info"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="satiety-bar">
                    <div class="satiety-fill" id="satiety-fill"></div>
                </div>
                <div class="characteristic">
                    <span class="char-name">Голод</span>
                    <div class="char-value">
                        <input type="number" step="0.5" id="hunger-input" class="char-base-input form-control" data-char="hunger" value="${characterSheet.state.characteristics.base.hunger}" style="width: 60px; font-size: 0.9rem;">
                        <span> + </span>
                        <span class="char-mod">${characterSheet.state.characteristics.modifiers.hunger >= 0 ? '+' : ''}${characterSheet.state.characteristics.modifiers.hunger}</span>
                        <span> = </span>
                        <span class="char-total">${(characterSheet.state.characteristics.base.hunger + characterSheet.state.characteristics.modifiers.hunger).toFixed(1)}</span>
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="hunger">-</button>
                            <button class="char-btn char-plus" data-char="hunger">+</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    setupEventListeners() {
        // Удаляем старый обработчик клика если он есть
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }

        // Создаём новый обработчик для кнопок изменения характеристик
        this.clickHandler = (e) => {
            if (e.target.classList.contains('char-plus') ||
                e.target.closest('.char-plus')) {
                const btn = e.target.classList.contains('char-plus') ? e.target : e.target.closest('.char-plus');
                if (btn.dataset.type === 'current') {
                    this.changeCurrentValue(btn, 1);
                } else {
                    characterSheet.changeCharacteristic(btn, 0.5);
                }
            } else if (e.target.classList.contains('char-minus') ||
                      e.target.closest('.char-minus')) {
                const btn = e.target.classList.contains('char-minus') ? e.target : e.target.closest('.char-minus');
                if (btn.dataset.type === 'current') {
                    this.changeCurrentValue(btn, -1);
                } else {
                    characterSheet.changeCharacteristic(btn, -0.5);
                }
            }
        };

        document.addEventListener('click', this.clickHandler);

        // Выбор шаблона - удаляем старые и добавляем новые
        document.querySelectorAll('.template-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                const template = e.target.dataset.template;
                this.applyTemplate(template);
            });
        });

        // Информация о сытости
        const satietyInfoBtn = document.getElementById('satiety-info');
        if (satietyInfoBtn) {
            const newSatietyBtn = satietyInfoBtn.cloneNode(true);
            satietyInfoBtn.parentNode.replaceChild(newSatietyBtn, satietyInfoBtn);
            newSatietyBtn.addEventListener('click', () => {
                this.showSatietyInfo();
            });
        }




        
        // Изменение текущих значений - заменяем элементы для удаления старых обработчиков
        const replaceInputHandler = (id, handler) => {
            const el = document.getElementById(id);
            if (el) {
                const newEl = el.cloneNode(true);
                el.parentNode.replaceChild(newEl, el);
                newEl.addEventListener('change', handler);
            }
        };

        replaceInputHandler('current-heart', (e) => {
            const value = parseInt(e.target.value);
            const max = characterSheet.state.characteristics.base.heart +
                       characterSheet.state.characteristics.modifiers.heart;
            characterSheet.state.characteristics.current.heart = Math.min(Math.max(value, 0), max);
            characterSheet.saveState();
            this.updateDisplay();
        });

        replaceInputHandler('current-endurance', (e) => {
            const value = parseInt(e.target.value);
            const max = characterSheet.state.characteristics.base.endurance +
                       characterSheet.state.characteristics.modifiers.endurance;
            characterSheet.state.characteristics.current.endurance = Math.min(Math.max(value, 0), max);
            characterSheet.saveState();
            this.updateDisplay();
        });

        replaceInputHandler('current-soul', (e) => {
            const value = parseInt(e.target.value);
            const max = characterSheet.state.characteristics.base.soul +
                       characterSheet.state.characteristics.modifiers.soul;
            characterSheet.state.characteristics.current.soul = Math.min(Math.max(value, 0), max);
            characterSheet.saveState();
            this.updateDisplay();
        });

        replaceInputHandler('hunger-input', (e) => {
            const value = parseInt(e.target.value) || 0;
            characterSheet.state.characteristics.base.hunger = value;
            characterSheet.saveState();
            characterSheet.updateAllCharacteristics();
        });

        replaceInputHandler('satiety-input', (e) => {
            const value = parseInt(e.target.value) || 0;
            characterSheet.state.characteristics.base.satiety = value;
            characterSheet.saveState();
            characterSheet.updateAllCharacteristics();
        });

        replaceInputHandler('max-heart', (e) => {
            const value = parseInt(e.target.value);
            const modifiers = characterSheet.state.characteristics.modifiers.heart;
            characterSheet.state.characteristics.base.heart = Math.max(0, value - modifiers);
            characterSheet.saveState();
            this.updateDisplay();
        });

        replaceInputHandler('max-endurance', (e) => {
            const value = parseInt(e.target.value);
            const modifiers = characterSheet.state.characteristics.modifiers.endurance;
            characterSheet.state.characteristics.base.endurance = Math.max(0, value - modifiers);
            characterSheet.saveState();
            this.updateDisplay();
        });

        replaceInputHandler('max-soul', (e) => {
            const value = parseInt(e.target.value);
            const modifiers = characterSheet.state.characteristics.modifiers.soul;
            characterSheet.state.characteristics.base.soul = Math.max(0, value - modifiers);
            characterSheet.saveState();
            this.updateDisplay();
        });
    }
    
    applyTemplate(template) {
        if (!this.templates[template]) return;
        
        const templateData = this.templates[template];
        const char = characterSheet.state.characteristics;
        
        // Обновляем базовые значения
        char.template = template;
        char.base.might = templateData.might;
        char.base.insight = templateData.insight;
        char.base.shell = templateData.shell;
        char.base.grace = templateData.grace;
        char.base.attractiveness = templateData.attractiveness;
        char.base.horror = templateData.horror;
        char.base.speed = templateData.speed;
        char.base.heart = templateData.heart;
        char.base.endurance = templateData.endurance;
        char.base.soul = templateData.soul;
        char.base.hunger = templateData.hunger;
        
        // Сбрасываем текущие значения к максимумам
        char.current.heart = templateData.heart;
        char.current.endurance = templateData.endurance;
        char.current.soul = templateData.soul;
        
        // Обновляем активные кнопки шаблонов
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.template-btn[data-template="${template}"]`).classList.add('active');
        
        characterSheet.saveState();
        characterSheet.updateAllCharacteristics();
    }
    
    changeCharacteristic(button, amount) {
        const charName = button.dataset.char;
        const type = button.dataset.type || 'base';

        if (type === 'current') {
            // Для текущих значений (сердца, выносливость, душа)
            const max = characterSheet.state.characteristics.base[charName] +
                       characterSheet.state.characteristics.modifiers[charName];

            if (amount > 0) {
                characterSheet.state.characteristics.current[charName] =
                    Math.min(characterSheet.state.characteristics.current[charName] + 1, max);
            } else {
                characterSheet.state.characteristics.current[charName] =
                    Math.max(characterSheet.state.characteristics.current[charName] - 1, 0);
            }
        } else {
            // Для базовых значений
            characterSheet.state.characteristics.base[charName] += amount;
        }

        characterSheet.saveState();
        this.updateDisplay();
    }

    changeCurrentValue(button, amount) {
        const charName = button.dataset.char;
        const inputId = `current-${charName}`;
        const input = document.getElementById(inputId);

        if (!input) return;

        const max = characterSheet.state.characteristics.base[charName] +
                   characterSheet.state.characteristics.modifiers[charName];
        let currentValue = parseInt(input.value) || 0;

        currentValue += amount;
        currentValue = Math.max(0, Math.min(currentValue, max));

        input.value = currentValue;
        characterSheet.state.characteristics.current[charName] = currentValue;
        characterSheet.saveState();
        this.updateDisplay();
    }

    renderVitalSegments(max, current, type) {
        let html = '';
        for (let i = 0; i < max; i++) {
            const filled = i < current;
            html += `<div class="vital-segment ${type}-segment ${filled ? 'filled' : ''}"></div>`;
        }
        return html;
    }
    
    updateDisplay() {
        const char = characterSheet.state.characteristics;
        const list = document.getElementById('characteristics-list');
        if (!list) return;

        // Список характеристик для отображения
        const characteristics = [
            { id: 'might', name: 'Мощь', isMain: true },
            { id: 'insight', name: 'Проницательность', isMain: true },
            { id: 'shell', name: 'Панцирь', isMain: true },
            { id: 'absorption', name: 'Поглощение', isMain: true },
            { id: 'grace', name: 'Грация', isMain: true },
            { id: 'attractiveness', name: 'Привлекательность' },
            { id: 'horror', name: 'Жуть' },
            { id: 'speed', name: 'Скорость' }
        ];

        // Пояснения к характеристикам
        const explanations = {
            might: "Сила и физическая подготовленность жука. Мощь определяет, как эффективно жук применяет оружие и парирует удары. Также она используется для проверок, включающих проявления грубой силы, подъём значительного веса или атлетику.",
            grace: "Быстрота и ловкость движений жука. Грация определяет эффективность жука в бросках на дальнобойное оружия и уклонении от опасности. Она используется в проверках на ловкость, баланс и изящество. Манёвренность жука равна половине его Грации, округлённой в большую сторону. Каждый ход он может переместиться на количество клеток в пределах области угрозы противника, равное значению Манёвренности, не провоцируя атаку. Если жук покинет область угрозы, то он всё равно провоцирует атаку.",
            shell: "Толщина хитина и жёсткость плоти жука определяет сопротивление повреждениям и болезням.\n\nКогда по жуку проходит успешная физическая атака, он может совершить бросок Панциря на Впитывание урона. Тогда он игнорирует урон, равный числу успешно брошенных костей.\n\nРазмер Пояса жука равен половине значения его Панциря, округлённого в меньшую сторону. В Поясе хранятся различные предметы, к которым можно получить быстрый доступ в напряжённых ситуациях. Жук может взять предмет из Пояса в свободную руку и наоборот, не тратя Скорости.\n\nПодбор предмета не из Пояса или использование лежащей неподалёку вещи тратит значение Скорости, равное Весу предмета (минимум 1).\n\nВыбрасывание предмета не считается! К примеру, персонаж может выкинуть лопату не тратя Скорости, но ему следует помнить, что тогда её способен подобрать другой жук.",
            absorption: "У некоторых жуков есть очки Поглощения. После того, как Понижение Урона снизило вероятный урон, а часть полученного урона была Впитана, применяется Поглощение. Оно снижает полученный урон до суммы 1 и результата деления нацело оставшегося урона на ваше значение Поглощения. Это относится также к эффектам, наносящим урон постепенно, а также к невпитываемому урону.",
            insight: "Насколько жук внимателен и умён. Проницательность используется для многих элементов магии (будет объяснено в главе 7. Магия), а также для выполнения любой задачи, требующей остроту ума, чувств и отличную память.\n\nЯчейки Техник жука используются для подготовки его Искусств и Тайн, подобно тому, как персонажи в игре могут назначать способности на определённые клавиши.\n\nКоличество ячеек Техник жука равно половине его Проницательности, округлённой в меньшую сторону.",
            attractiveness: "Жуть и Привлекательность жука влияют на то,как он социально взаимодействует с другими жуками. Это может быть его внешний вид, поведение и даже запах.\n\nНачальные бонусные очки, которые вы можете вложить в Жуть и Привлекательность своего жука, при желании могут быть разделены между ними пополам.",
            horror: "Жуть и Привлекательность жука влияют на то,как он социально взаимодействует с другими жуками. Это может быть его внешний вид, поведение и даже запах.\n\nНачальные бонусные очки, которые вы можете вложить в Жуть и Привлекательность своего жука, при желании могут быть разделены между ними пополам."
        };

        let html = '<h3>Основные характеристики</h3>';

        characteristics.forEach(charData => {
            const base = char.base[charData.id];
            const mod = char.modifiers[charData.id];
            const total = base + mod;
            const hasExplanation = explanations[charData.id];

            const baseDisplay = `<input type="number" step="0.5" class="char-base-input form-control" data-char="${charData.id}" value="${base}" style="width: 60px; font-size: 0.9rem;">`;

            html += `
                <div class="characteristic">
                    <span class="char-name">
                        ${charData.name}
                        ${hasExplanation ? `<button class="char-explanation-btn" data-char="${charData.id}" title="Пояснение" style="margin-left: 5px; background: none; border: none; color: var(--primary-color); cursor: pointer; font-size: 0.9em;"><i class="fas fa-question-circle"></i></button>` : ''}
                        ${charData.isMain ? '<i class="fas fa-crown" style="color: var(--accent-yellow); margin-left: 5px;"></i>' : ''}
                    </span>
                    <div class="char-value">
                        ${baseDisplay}
                        <span> + </span>
                        <span class="char-mod">${mod >= 0 ? '+' : ''}${mod}</span>
                        <span> = </span>
                        <span class="char-total">${total.toFixed(1)}</span>
                        <div class="char-controls">
                            <button class="char-btn char-minus" data-char="${charData.id}">-</button>
                            <button class="char-btn char-plus" data-char="${charData.id}">+</button>
                            <button class="char-btn char-details" data-char="${charData.id}">
                                <i class="fas fa-info"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        list.innerHTML = html;

        // Обновляем максимальные значения и корректируем текущие
        const maxHeart = char.base.heart + char.modifiers.heart;
        char.current.heart = Math.min(char.current.heart, maxHeart);
        document.getElementById('max-heart').value = maxHeart;
        document.getElementById('current-heart').value = char.current.heart;

        const maxEndurance = char.base.endurance + char.modifiers.endurance;
        char.current.endurance = Math.min(char.current.endurance, maxEndurance);
        document.getElementById('max-endurance').value = maxEndurance;
        document.getElementById('current-endurance').value = char.current.endurance;

        const maxSoul = char.base.soul + char.modifiers.soul;
        char.current.soul = Math.min(char.current.soul, maxSoul);
        document.getElementById('max-soul').value = maxSoul;
        document.getElementById('current-soul').value = char.current.soul;

        // Обновляем сытость
        document.getElementById('satiety-input').value = char.base.satiety;
        document.getElementById('hunger-input').value = char.base.hunger;

        // Обновляем отображение модификаторов и итогов для голода
        const hungerValue = document.querySelector('#hunger-input').closest('.char-value');
        if (hungerValue) {
            const modSpan = hungerValue.querySelector('.char-mod');
            const totalSpan = hungerValue.querySelector('.char-total');
            if (modSpan) {
                modSpan.textContent = char.modifiers.hunger >= 0 ? '+' + char.modifiers.hunger : char.modifiers.hunger;
            }
            if (totalSpan) {
                totalSpan.textContent = (char.base.hunger + char.modifiers.hunger).toFixed(1);
            }
        }

        // Обновляем индикатор сытости
        this.updateSatietyBar();

        // Re-render vital segments
        document.getElementById('heart-segments').innerHTML = this.renderVitalSegments(maxHeart, char.current.heart, 'heart');
        document.getElementById('endurance-segments').innerHTML = this.renderVitalSegments(maxEndurance, char.current.endurance, 'endurance');
        document.getElementById('soul-segments').innerHTML = this.renderVitalSegments(maxSoul, char.current.soul, 'soul');

        // Добавляем обработчики для кнопок информации
        document.querySelectorAll('.char-details[data-char]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const charId = e.target.closest('button').dataset.char;
                this.showCharacterDetails(charId);
            });
        });

        // Добавляем обработчики для кнопок пояснений
        document.querySelectorAll('.char-explanation-btn[data-char]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const charId = e.target.closest('button').dataset.char;
                this.showCharacterExplanation(charId);
            });
        });

        // Обработчики для редактирования базовых значений основных характеристик
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('char-base-input')) {
                const charId = e.target.dataset.char;
                const newValue = parseFloat(e.target.value) || 0;
                characterSheet.state.characteristics.base[charId] = newValue;
                characterSheet.saveState();
                characterSheet.updateAllCharacteristics();
            }
        });
    }
    
    updateSatietyBar() {
        const satiety = characterSheet.state.characteristics.base.satiety;
        const fill = document.getElementById('satiety-fill');

        if (!fill) return;

        // Процент заполнения: 0% при сытости >=0, увеличивается по мере уменьшения сытости
        let percentage = Math.max(0, Math.min(100, -satiety));

        fill.style.width = `${percentage}%`;

        // Цвет в зависимости от диапазона сытости согласно таблице
        if (satiety >= 0) {
            fill.style.backgroundColor = 'var(--accent-green)';
        } else if (satiety >= -50) {
            fill.style.backgroundColor = 'var(--accent-yellow)';
        } else {
            fill.style.backgroundColor = 'var(--accent-red)';
        }
    }

    updateVitalBars() {
        const char = characterSheet.state.characteristics;

        // Обновляем индикатор сердец
        const heartMax = char.base.heart + char.modifiers.heart;
        const heartCurrent = char.current.heart;
        const heartPercentage = heartMax > 0 ? (heartCurrent / heartMax) * 100 : 0;
        const heartFill = document.getElementById('heart-fill');
        if (heartFill) {
            heartFill.style.width = `${heartPercentage}%`;
        }

        // Обновляем индикатор выносливости
        const enduranceMax = char.base.endurance + char.modifiers.endurance;
        const enduranceCurrent = char.current.endurance;
        const endurancePercentage = enduranceMax > 0 ? (enduranceCurrent / enduranceMax) * 100 : 0;
        const enduranceFill = document.getElementById('endurance-fill');
        if (enduranceFill) {
            enduranceFill.style.width = `${endurancePercentage}%`;
        }

        // Обновляем индикатор души
        const soulMax = char.base.soul + char.modifiers.soul;
        const soulCurrent = char.current.soul;
        const soulPercentage = soulMax > 0 ? (soulCurrent / soulMax) * 100 : 0;
        const soulFill = document.getElementById('soul-fill');
        if (soulFill) {
            soulFill.style.width = `${soulPercentage}%`;
        }
    }
    
    showSatietyInfo() {
        const modalContent = `
            <div>
                <h4>Сытость</h4>
                <p>Показывает уровень сытости персонажа. Влияет на восстановление души при отдыхе:</p>
                <ul>
                    <li><strong>Сытость ≥ 0:</strong> Полное восстановление души</li>
                    <li><strong>Сытость ≥ -50:</strong> Восстановление половины души (округлено вверх)</li>
                    <li><strong>Сытость < -50:</strong> Восстановление половины души</li>
                </ul>
                <p>Сытость уменьшается на значение голода каждый раунд.</p>
            </div>
        `;

        const modal = this.createModal('Информация о сытости', modalContent);
        document.body.appendChild(modal);
    }

    showHungerInfo() {
        const modalContent = `
            <div>
                <h4>Голод</h4>
                <p>Показывает скорость, с которой персонаж теряет сытость. Каждый раунд сытость уменьшается на значение голода.</p>
                <p><strong>Эффекты голода:</strong></p>
                <ul>
                    <li><strong>Сытость ≥ -50:</strong> Нет эффектов</li>
                    <li><strong>Сытость от -50 до -100:</strong> -1 к главным характеристикам (Мощь, Проницательность, Панцирь, Грация)</li>
                    <li><strong>Сытость < -100:</strong> Дополнительные эффекты (не реализованы)</li>
                </ul>
            </div>
        `;

        const modal = this.createModal('Информация о голоде', modalContent);
        document.body.appendChild(modal);
    }

    showCharacteristicInfo(charName) {
        const charInfo = {
            might: {
                name: 'Мощь',
                description: 'Определяет физическую силу персонажа. Влияет на урон в ближнем бою, переносимый вес и некоторые проверки силы.'
            },
            insight: {
                name: 'Проницательность',
                description: 'Определяет умственные способности и восприятие. Влияет на обнаружение скрытого, сопротивление иллюзиям и некоторые магические проверки.'
            },
            shell: {
                name: 'Панцирь',
                description: 'Определяет прочность и устойчивость. Влияет на максимальное количество сердец и сопротивление физическому урону.'
            },
            grace: {
                name: 'Грация',
                description: 'Определяет ловкость и координацию. Влияет на уклонение, точность и некоторые проверки ловкости.'
            },
            attractiveness: {
                name: 'Привлекательность',
                description: 'Определяет харизму и внешнюю привлекательность. Влияет на социальные взаимодействия и некоторые проверки убеждения.'
            },
            horror: {
                name: 'Жуть',
                description: 'Определяет устрашающий вид и ауру. Влияет на запугивание и сопротивление страху.'
            },
            speed: {
                name: 'Скорость',
                description: 'Определяет подвижность персонажа. Влияет на инициативу в бою и дальность перемещения.'
            }
        };

        const info = charInfo[charName];
        if (!info) return;

        const modalContent = `
            <div>
                <h4>${info.name}</h4>
                <p>${info.description}</p>
            </div>
        `;

        const modal = this.createModal(`Информация о ${info.name.toLowerCase()}`, modalContent);
        document.body.appendChild(modal);
    }

    showCharacterDetails(charId) {
        const charNames = {
            might: 'Мощь',
            insight: 'Проницательность',
            shell: 'Панцирь',
            grace: 'Грация',
            attractiveness: 'Привлекательность',
            horror: 'Жуть',
            speed: 'Скорость',
            heart: 'Сердца',
            endurance: 'Выносливость',
            soul: 'Душа',
            hunger: 'Голод'
        };

        const char = characterSheet.state.characteristics;
        const base = char.base[charId];
        const mod = char.modifiers[charId];

        let details = `<h4>${charNames[charId]}</h4>`;
        details += `<p><strong>Базовое значение:</strong> ${base}</p>`;
        details += `<p><strong>Модификаторы:</strong> ${mod >= 0 ? '+' : ''}${mod}</p>`;
        details += `<p><strong>Итоговое значение:</strong> ${(base + mod).toFixed(1)}</p>`;

        // Собираем источники модификаторов
        const sources = [];

        // Черты
        characterSheet.state.traits.forEach(trait => {
            if (trait.modifiers && trait.modifiers[charId]) {
                sources.push({
                    type: 'Черта',
                    name: trait.name,
                    value: trait.modifiers[charId],
                    description: trait.description
                });
            }
        });

        // Статусы
        characterSheet.state.statuses.forEach(status => {
            if (status.modifiers && status.modifiers[charId]) {
                sources.push({
                    type: 'Статус',
                    name: status.name,
                    value: status.modifiers[charId],
                    description: status.description
                });
            }
        });

        // Амулеты
        characterSheet.state.charms.forEach(charm => {
            if (charm.equipped && charm.modifiers && charm.modifiers[charId]) {
                sources.push({
                    type: 'Амулет',
                    name: charm.name,
                    value: charm.modifiers[charId],
                    description: charm.description
                });
            }
        });

        // Малые продвижения
        if (characterSheet.state.advancements) {
            characterSheet.state.advancements.forEach(adv => {
                if (adv.type === 'characteristic' && adv.characteristicId === charId) {
                    sources.push({
                        type: 'Малое продвижение',
                        name: `+${adv.value} к ${adv.characteristicName}`,
                        value: adv.value,
                        description: 'Малое продвижение: увеличение характеристики'
                    });
                } else if (adv.type === 'speed' && charId === 'speed') {
                    sources.push({
                        type: 'Малое продвижение',
                        name: '+1 к Скорости',
                        value: adv.value,
                        description: 'Малое продвижение: увеличение скорости'
                    });
                } else if (adv.type === 'load' && charId === 'load') {
                    sources.push({
                        type: 'Малое продвижение',
                        name: '+1 к Нагрузке',
                        value: adv.value,
                        description: 'Малое продвижение: увеличение нагрузки'
                    });
                }
            });
        }

        // Голод
        if (char.base.satiety < -50 && ['might', 'insight', 'shell', 'grace'].includes(charId)) {
            sources.push({
                type: 'Голод',
                name: 'Сильный голод',
                value: -1,
                description: 'Жук получает -1 к главным характеристикам при сытости ниже -50'
            });
        }

        if (sources.length > 0) {
            details += '<h5>Источники модификаторов:</h5>';
            details += '<ul>';
            sources.forEach(source => {
                details += `<li><strong>${source.type}: ${source.name}</strong> (${source.value >= 0 ? '+' : ''}${source.value})`;
                if (source.description) {
                    details += `<br><small>${source.description}</small>`;
                }
                details += '</li>';
            });
            details += '</ul>';
        } else {
            details += '<p>Нет активных модификаторов</p>';
        }

        const modal = this.createModal('Детали характеристики', details);
        document.body.appendChild(modal);
    }

    showCharacterExplanation(charId) {
        const charNames = {
            might: 'Мощь',
            insight: 'Проницательность',
            shell: 'Панцирь',
            absorption: 'Поглощение',
            grace: 'Грация',
            attractiveness: 'Привлекательность',
            horror: 'Жуть'
        };

        const explanation = this.explanations[charId];
        if (!explanation) return;

        const modalContent = `
            <div>
                <h4>${charNames[charId]}</h4>
                <div class="char-explanation-content">${this.formatDescription(explanation)}</div>
            </div>
        `;

        const modal = this.createModal('Пояснение к характеристике', modalContent);
        document.body.appendChild(modal);
    }
    
    showSatietyInfo() {
        const info = `
            <h4>Эффекты сытости</h4>
            <ul>
                <li><strong>0 или выше:</strong> Полное восстановление Души и по 1 Сердцу за сон в лагере</li>
                <li><strong>От -1 до -50:</strong> Восстановление половины Души (округление вверх)</li>
                <li><strong>От -50 до -100:</strong> -1 ко всем главным характеристикам, можно дважды бросить на поиск еды</li>
                <li><strong>Ниже -100:</strong> Смерть от голода</li>
            </ul>
            <p>Главные характеристики: Мощь, Проницательность, Панцирь, Грация</p>
        `;
        
        const modal = this.createModal('Эффекты сытости', info);
        document.body.appendChild(modal);
    }
    
    createModal(title, content) {
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
}

// Инициализация
window.characteristicsManager = new CharacteristicsManager();