(function () {

'use strict'

// ────────────────────────────────────────────────
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ / КОНСТАНТЫ / ОБЪЕКТЫ
// ────────────────────────────────────────────────

/** @typedef {{ name: string|null, basePrice: number, french: boolean }} BalconyType */
/** @typedef {{ length: number, width: number, height: number, square: number|string }} Size */
/** @typedef {{ coeff: number|null, material: string|null }} InteriorPart */
/** @typedef {{ walls: InteriorPart, ceiling: InteriorPart, floor: InteriorPart }} Interior */
/** @typedef {{ price: number, name: string }} ExtraItem */

/** @typedef {{
    step: number,
    balconyType: BalconyType,
    size: Size,
    interior: Interior,
    extra: ExtraItem[],
    total: number
}} CalculatorState */

/** @type {CalculatorState} */
let state = {
    step: 1,
    balconyType: { name: null, basePrice: 0, french: false },
    size: { length: 0, width: 0, height: 0, square: 0 },
    interior: {
        walls: { coeff: null, material: null },
        ceiling: { coeff: null, material: null },
        floor: { coeff: null, material: null }
    },
    extra: [],           
    total: 0
};

/** @type {CalculatorState} */
const calcRefs = {
    content: /** @type {HTMLElement|null} */ document.querySelector('.cost-calculator__content'),
    steps: /** @type {NodeListOf<HTMLElement>} */ document.querySelectorAll('.cost-calculator__step'),
    popupOverlay: /** @type {HTMLElement|null} */ document.querySelector('.popup-response-ok__overlay'),
    closeBtn: /** @type {HTMLElement|null} */ document.querySelector('.popup__close'),
    popupTitle: /** @type {HTMLElement|null} */ document.querySelector('.popup-response-ok__title'),
    popupSubtitle: /** @type {HTMLElement|null} */ document.querySelector('.popup-response-ok__subtitle'),
    headerBtn: /** @type {HTMLElement|null} */ document.querySelector('.header__button'),
    loader: /** @type {HTMLElement|null} */ document.querySelector('.loader'),
    popupResponseOk: /** @type {HTMLElement|null} */ document.querySelector('.popup-response-ok'),
    headerPopupOverlay: /** @type {HTMLElement|null} */ document.querySelector('.header-popup__overlay'),
    popupResponseOkIcon: /** @type {HTMLElement|null} */ document.querySelector('.popup-response-ok__icon'),
    mobileNavBtn: /** @type {HTMLElement|null} */ document.querySelector('.header__mobile-nav'),
    mobileList: /** @type {HTMLElement|null} */ document.querySelector('.header__mobile-nav-list'),
};

/** @type {Function[]} */
const stepFnsArr = [calcStepFn1, calcStepFn2, calcStepFn3, calcStepFn4, calcStepFn5];

/**
 * @type {number|null}
 * Текущий шаг калькулятора (1–5). null до инициализации.
 */
let calcStepPosition = null;

/**
 * @type {boolean} 
 * Флаг: true — форма вызвана из шапки (без анимации переходов калькулятора),
 * false — обычный режим калькулятора с анимацией.
 */
let isHeaderMode = false;
// ────────────────────────────────────────────────
// ФУНКЦИИ-УТИЛИТЫ
// ────────────────────────────────────────────────

/**
 * Включает/отключает кнопку и меняет курсор
 * @param {string} btnSelector 
 * @param {boolean} [disabled=true]
 */
function setBtnState(btnSelector, disabled = true) {
    const btn = document.querySelector(btnSelector);
    if (!btn) return;
    btn.disabled = disabled;
    btn.style.cursor = disabled ? 'default' : 'pointer';
}

/** Сбрасывает состояние калькулятора полностью */
function resetState() {
    state = {
        step: 1,
        balconyType: { name: null, basePrice: 0, french: false },
        size: { length: 0, width: 0, height: 0, square: 0 },
        interior: {
            walls: { coeff: null, material: null },
            ceiling: { coeff: null, material: null },
            floor: { coeff: null, material: null }
        },
        extra: [],           
        total: 0
    };
    sessionStorage.removeItem('state');
    calcStepPosition = 1;
}

/**
 * Переключает шаг калькулятора
 * @param {number} stepNumber 
 */
function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > stepFnsArr.length) return;

    const content = calcRefs.content;
    if (!content) return;

    // ❗ если форма из хедера — без анимации
    if (isHeaderMode) {
        stepFnsArr[stepNumber - 1]();

        calcRefs.steps.forEach(step =>
            step.classList.remove('cost-calculator__step--active')
        );
        calcRefs.steps[stepNumber - 1]
            .classList.add('cost-calculator__step--active');

        state.step = stepNumber;
        calcStepPosition = stepNumber;
        sessionStorage.setItem('state', JSON.stringify(state));
        return;
    }

    // ⬇️ обычная анимация шагов
    content.classList.add('fade-out');

    setTimeout(() => {
        calcRefs.steps.forEach(step =>
            step.classList.remove('cost-calculator__step--active')
        );
        calcRefs.steps[stepNumber - 1]
            .classList.add('cost-calculator__step--active');

        stepFnsArr[stepNumber - 1]();

        state.step = stepNumber;
        calcStepPosition = stepNumber;
        sessionStorage.setItem('state', JSON.stringify(state));

        requestAnimationFrame(() => {
            content.classList.remove('fade-out');
        });
    }, 300);
}

/** Закрывает форму в шапке сайта */
function closeHeaderForm() {
    isHeaderMode = false;
    const form = document.querySelector('.cost-calculator__estimat-form')
    if (!form) return;
    form.classList.remove('form-site');
    if (state.step < 5) form.style.display = 'none';
    const formClose = document.querySelector('.form-close');
    if (formClose) {
        formClose.style.opacity = '0';
    }
    document.body.style.overflow = '';
}

/** @returns {string} HTML-код навигационных кнопок */
function getNavButtons() {
    return `
        <div class="cost-calculator__nav">
            <button class="cost-calculator__btn btn-back">Назад</button>
            <button class="cost-calculator__btn btn-next">Вперёд</button>
        </div>
    `;
}

/** @returns {string} HTML-код формы */
function getEstimateFormHTML(hidden = true) {
    const style = hidden ? ' style="display: none;"' : '';
    return `
      <form class="cost-calculator__estimat-form"${style}>
        <button type="button" class="form-close">×</button>
        <input type="hidden" name="access_key" value="4abdbaac-cf19-47b2-a882-f05931f786fe">
        <input type="text" class="cost-calculator__estimat-input" autocomplete="name" placeholder="введите ваше имя">
        <input type="text" class="cost-calculator__estimat-input" autocomplete="on" placeholder="ваш email или номер телефона">
        <textarea class="cost-calculator__estimat-textarea" placeholder="примечание..."></textarea>
        <button type="submit" class="submit-btn">Оставить заявку</button>
      </form>
    `;
}

// ────────────────────────────────────────────────
// ФУНКЦИИ ШАГОВ КАЛЬКУЛЯТОРА
// ────────────────────────────────────────────────

function calcStepFn1() {
  const template = document.getElementById('step-1-template');
  if (!template) {
    console.error('Шаблон step-1-template не найден');
    return;
  }

  const clone = template.content.cloneNode(true);

  // полностью заменяем содержимое контейнера
  calcRefs.content.replaceChildren(clone);

  // добавляем навигацию и форму
  calcRefs.content.insertAdjacentHTML('beforeend', getNavButtons());
  calcRefs.content.insertAdjacentHTML('beforeend', getEstimateFormHTML(true));

  // инициализация состояния
  fromSumbitFn();
  setBtnState('.btn-back', true);
  setBtnState('.btn-next', true);
}
function calcStepFn2() {
  const template = document.getElementById('step-2-template');
  if (!template) {
    console.error('Шаблон step-2-template не найден');
    return;
  }

  const clone = template.content.cloneNode(true);

  calcRefs.content.replaceChildren(clone);

  calcRefs.content.insertAdjacentHTML('beforeend', getNavButtons());
  calcRefs.content.insertAdjacentHTML('beforeend', getEstimateFormHTML(true));

  fromSumbitFn();
  setBtnState('.btn-next', true);

  const sizeInput = calcRefs.content.querySelectorAll('.cost-calculator__size-input');
  sizeInput.forEach(input => {
      input.addEventListener('input', () => {
        if ([...sizeInput].every(i => i.value > 0)) {
          const [l, w, h] = [...sizeInput].map(i => Number(i.value));
          const s = 2 * (l * w + l * h + h * w);

          state.size = {
            length: l,
            width: w,
            height: h,
            square: s.toFixed(1)
          };

          sessionStorage.setItem('state', JSON.stringify(state));
          setBtnState('.btn-next', false);
        } else {
          setBtnState('.btn-next', true);
        }
      });
  });
}

function calcStepFn3() {
  const template = document.getElementById('step-3-template');
    if (!template) {
      console.error('Шаблон step-3-template не найден');
      return;
    }
  const clone = template.content.cloneNode(true);

  calcRefs.content.replaceChildren(clone);
  calcRefs.content.insertAdjacentHTML('beforeend', getNavButtons());
  calcRefs.content.insertAdjacentHTML('beforeend', getEstimateFormHTML(true));

  fromSumbitFn('', '', '', '', '', '');
    state.interior = {
        walls: { coeff: null, material: null },
        ceiling: { coeff: null, material: null },
        floor: { coeff: null, material: null }
    };
    setBtnState('.btn-next', true);

    const french = state.balconyType.french;
    const wallsSection = document.querySelector('.walls');
    if (french) wallsSection?.classList.add('walls--no-active');
}

function calcStepFn4() {
  const template = document.getElementById('step-4-template');
  if (!template) {
    console.error('Шаблон step-4-template не найден');
    return;
  }

  const clone = template.content.cloneNode(true);

  calcRefs.content.replaceChildren(clone);

  calcRefs.content.insertAdjacentHTML('beforeend', getNavButtons());
  calcRefs.content.insertAdjacentHTML('beforeend', getEstimateFormHTML(true));
 
  fromSumbitFn();
  state.extra = [];
}

function calcStepFn5() {
  const template = document.getElementById('step-5-template');
  if (!template) {
    console.error('Шаблон step-5-template не найден');
    return;
  }

  const clone = template.content.cloneNode(true);

  calcRefs.content.replaceChildren(clone);

  const estimatWrap = calcRefs.content.querySelector('.cost-calculator__estimat-wrap');
  if (!estimatWrap) {
    console.error('Элемент .cost-calculator__estimat-wrap не найден в шаблоне!');
    return;
  }

  estimatWrap.insertAdjacentHTML('beforeend', getEstimateFormHTML(false));

  calcRefs.content.insertAdjacentHTML('beforeend', getNavButtons());

  const costStart = Number(state.balconyType.basePrice) || 0;
  const costInterior = Object.values(state.interior)
      .reduce((sum, item) => sum + (Number(item.coeff) || 0), 0);
  const costExtra = state.extra.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const square = Number(state.size.square) || 0;
  let extra = state.extra.map(el => el.name).join(', ');
  if (!extra) extra = 'ничего';
  const total = (costStart + costInterior) * square + costExtra;
  state.total = Math.round(total);
  sessionStorage.setItem('state', JSON.stringify(state));

  const params = [
  { label: 'тип', value: state.balconyType.name || 'не выбран' },
  { label: 'размер', value: `${state.size.length} x ${state.size.width} x ${state.size.height}` },
  { label: 'стены', value: state.interior.walls.material || 'не выбрано' },
  { label: 'пол', value: state.interior.floor.material || 'не выбрано' },
  { label: 'потолок', value: state.interior.ceiling.material || 'не выбрано' },
  { label: 'дополнительно', value: extra }
];

const listItems = calcRefs.content.querySelectorAll('.cost-calculator__estimat-list li');

listItems.forEach((li, i) => {
  if (params[i]) li.innerHTML = `<span>${params[i].label}:</span> ${params[i].value}`;
});

  const totalElem = calcRefs.content.querySelector('.cost-calculator__estimat');
  if (totalElem) totalElem.textContent = state.total.toLocaleString('ru-RU') + ' ₽';

  const sizeStr = `${state.size.length} x ${state.size.width} x ${state.size.height}`;
  fromSumbitFn(
    state.balconyType.name,
    sizeStr,
    state.interior.walls.material,
    state.interior.floor.material,
    state.interior.ceiling.material,
    extra
  );

  setBtnState('.btn-next', true);
}

// ────────────────────────────────────────────────
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ФОРМЫ
// ────────────────────────────────────────────────

function fromSumbitFn (extra = '', type = '', size = '', walls = '', floor = '', ceiling = '') {
  const formSubmit = document.querySelector('.cost-calculator__estimat-form');
  const formInput = document.querySelectorAll('.cost-calculator__estimat-input');
  const formText = document.querySelector('.cost-calculator__estimat-textarea');
  const submitBtn = document.querySelector('.submit-btn');
  
  setupFormInputValidation(formSubmit, submitBtn);
  formSubmit.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = formInput[0]?.value || '';
        const contacts = formInput[1]?.value || '';
        const text = formText?.value || '';
        const apiInfo = buildFormPayload(name, contacts, text, type, size, walls, floor, ceiling, extra);
        await sendFormJson(apiInfo, calcRefs.closeBtn, formSubmit, state);
    });
}

function buildFormPayload(name, contacts, comment, type, size, walls, floor, ceiling, extra) {
    return {
        access_key: "4abdbaac-cf19-47b2-a882-f05931f786fe",
        имя: name,
        контакты: contacts,
        примечание: comment,
        тип: type,
        размер: size,
        стены: walls,
        пол: floor, 
        потолок: ceiling,
        дополнительно: extra,
        стоимость: state.total,
    };
}

function setupFormInputValidation(formSubmit, submitBtn) {
    const inputs = formSubmit.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const name = inputs[0].value.trim();
            const contacts = inputs[1].value.trim();
            submitBtn.disabled = !(name && contacts);
            submitBtn.style.opacity = (name && contacts) ? '1' : '0.6';
            submitBtn.style.cursor = (name && contacts) ? 'pointer' : 'default';
        });
    });
    
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'default';
}

async function sendFormJson(apiInfo, closeBtn, formSubmit, state) {
    calcRefs.loader.classList.add('loader-on');
    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(apiInfo)
        });
        
        const result = await response.json();
        if (result.success) {
            calcRefs.popupOverlay.classList.add('popup-response-ok__overlay--active');
            document.body.style.overflow = 'hidden';
            showPopupOk(closeBtn, formSubmit, state);
        } else {
            showPopupError('Заявка не отправлена!', 'Ошибка на сервере');
        }
    } catch (err) {
        console.error(err);
        showPopupError('Заявка не отправлена!', 'Ошибка на клиенте');
    } finally {
        calcRefs.loader.classList.remove('loader-on');
        calcRefs.headerPopupOverlay?.classList.remove('header-popup__overlay--active');
    }
}

function showPopupOk(closeBtn, formSubmit, state) {
    calcRefs.popupResponseOkIcon.style.backgroundImage = "url('img/popup-icon.png')";
    closeBtn.addEventListener('click', () => {
      setTimeout(() => {
        calcRefs.popupOverlay.classList.remove('popup-response-ok__overlay--active');
        document.body.style.overflow = '';    
        formSubmit.reset();
        formSubmit.classList.remove('form-site');
        sessionStorage.removeItem('state');
        resetState();
        goToStep(1);
      }, 500)
    }, { once: true });
}

function showPopupError(title, subtitle) {
    calcRefs.popupOverlay.classList.add('popup-response-ok__overlay--active');
    document.body.style.overflow = 'hidden';
    calcRefs.popupResponseOkIcon.style.backgroundImage = 'url(img/popup-icon-error.png)';
    calcRefs.popupTitle.textContent = title;
    calcRefs.popupSubtitle.textContent = subtitle;

    calcRefs.closeBtn.addEventListener('click', () => {
        calcRefs.popupOverlay.classList.remove('popup-response-ok__overlay--active');
        document.body.style.overflow = '';
    }, { once: true });
}

// ────────────────────────────────────────────────
// ОБРАБОТЧИКИ СОБЫТИЙ
// ────────────────────────────────────────────────

// ЕДИНЫЙ ОБРАБОТЧИК КЛИКОВ ПО КОНТЕНТУ КАЛЬКУЛЯТОРА
calcRefs.content?.addEventListener('click', function handleCalcClick(e) {
    const target = e.target;

    if (target.closest('.btn-back')) {
        goToStep(calcStepPosition - 1);
        return;
    }

    if (target.closest('.btn-next')) {
        goToStep(calcStepPosition + 1);
        return;
    }

    if (calcStepPosition === 1) {
        const typeEl = target.closest('.cost-calculator__type');
        if (typeEl) {
            setBtnState('.btn-next', false);

            document.querySelectorAll('.cost-calculator__type')
                .forEach(el => el.classList.remove('cost-calculator__type--active'));

            typeEl.classList.add('cost-calculator__type--active');

            const cost = typeEl.dataset.price;
            const typeName = typeEl.querySelector('.cost-calculator__type-text')?.textContent?.trim() ?? '';

            state.balconyType.basePrice = Number(cost);
            state.balconyType.name = typeName;
            state.balconyType.french = typeEl.classList.contains('french');

            sessionStorage.setItem('state', JSON.stringify(state));
        }
    }

    if (calcStepPosition === 3) {
        const option = target.closest('.cost-calculator__interior-option');
        if (!option) return;

        const item = option.closest('.cost-calculator__interior-item');
        if (!item) return;

        item.querySelectorAll('.cost-calculator__interior-option')
            .forEach(opt => opt.classList.remove('cost-calculator__type--active'));

        option.classList.add('cost-calculator__type--active');

        const coeff = Number(option.dataset.coeff);
        const material = option.querySelector('.cost-calculator__interior-text')?.textContent?.trim() ?? '';

        if (item.classList.contains('walls')) {
            state.interior.walls = { coeff, material };
        }
        if (item.classList.contains('ceiling')) {
            state.interior.ceiling = { coeff, material };
        }
        if (item.classList.contains('floor')) {
            state.interior.floor = { coeff, material };
        }

        sessionStorage.setItem('state', JSON.stringify(state));

        const french = state.balconyType.french;
        const requiredCount = french ? 2 : 3;
        const filledCount = [
            state.interior.walls.coeff,
            state.interior.ceiling.coeff,
            state.interior.floor.coeff
        ].filter(v => v !== null).length;

        setBtnState('.btn-next', filledCount < requiredCount);
    }

    if (calcStepPosition === 4) {
        const option = target.closest('.cost-calculator__interior-option');
        if (!option) return;

        const price = Number(option.dataset.price);
        const name = option.querySelector('.cost-calculator__interior-text')?.textContent?.trim() ?? '';

        option.classList.toggle('cost-calculator__type--active');

        if (option.classList.contains('cost-calculator__type--active')) {
            state.extra.push({ price, name });
        } else {
            state.extra = state.extra.filter(item => !(item.price === price && item.name === name));
        }

        sessionStorage.setItem('state', JSON.stringify(state));
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('state')) {
        Object.assign(state, JSON.parse(sessionStorage.getItem('state')));
    }

    calcStepPosition = state.step;

    if (calcRefs.steps[calcStepPosition - 1]) {
        calcRefs.steps.forEach(step => step.classList.remove('cost-calculator__step--active'));
        calcRefs.steps[calcStepPosition - 1].classList.add('cost-calculator__step--active');
        stepFnsArr[calcStepPosition - 1]();
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('.form-close')) {
            e.preventDefault();
            calcRefs.headerPopupOverlay?.classList.remove('header-popup__overlay--active');
            closeHeaderForm();
        }
        if (e.target.closest('.popup__close')) {
            if (isHeaderMode) {
               calcRefs.headerPopupOverlay?.classList.remove('header-popup__overlay--active');
               closeHeaderForm();
            }
        }
    });

    calcRefs.headerBtn?.addEventListener('click', () => {
        isHeaderMode = true;
       
        const formClose = document.querySelector('.form-close');
        if (formClose) formClose.style.opacity = '1';
        const headerForm = document.querySelector('.cost-calculator__estimat-form');
        if (headerForm) {
            headerForm.classList.add('form-site');
            headerForm.style.display = 'flex';
            headerForm.classList.add('visible');
        }
           
        calcRefs.headerPopupOverlay?.classList.add('header-popup__overlay--active');
        document.body.style.overflow = 'hidden';
    });

    calcRefs.mobileNavBtn?.addEventListener('click', (e) => {
       calcRefs.mobileList.classList.toggle('header__mobile-nav-list--active');
    });

    calcRefs.mobileList?.addEventListener('click', (e) => {
        if (e.target.closest('.header__mobile-nav-item')) {
            calcRefs.mobileList.classList.remove('header__mobile-nav-list--active');
        }
    })

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.header__mobile-nav-list') && !e.target.closest('.header__mobile-nav')) {
           calcRefs.mobileList.classList.remove('header__mobile-nav-list--active'); 
        }
    })
});
})();