// =========================
// БЛОК 1 — КНОПКА "ВЫБРАТЬ ВСЁ"
// =========================
const chooseAllLink = document.querySelector('.choose-all');

if (chooseAllLink) {
    chooseAllLink.addEventListener('click', function (e) {
        e.preventDefault();

        const checkboxes = document.querySelectorAll('.choice-lang input[type="checkbox"]');
        const targetId = 'self-var';

        const filtered = [...checkboxes].filter(cb => cb.id !== targetId);
        const allChecked = filtered.every(cb => cb.checked);

        filtered.forEach(cb => (cb.checked = !allChecked));
    });
}


// =========================
// БЛОК 2 — "СВОЙ ВАРИАНТ" ЯЗЫКА
// =========================
const selfCheckbox = document.getElementById('self-var');
const selfInput = document.getElementById('self-input');

if (selfInput && selfCheckbox) {
    selfInput.addEventListener('input', () => {
        selfInput.value = selfInput.value.replace(/[^A-Za-z ]/g, '');
        selfCheckbox.checked = selfInput.value.trim().length > 0;
    });
}


// =========================
// БЛОК 3 — ЗАГРУЗКА ФАЙЛА (отображение имени)
// =========================
const uploadLabel = document.querySelector('.upload-file');
const uploadText = uploadLabel ? uploadLabel.querySelector('.upload-text') : null;
const fileInput = uploadLabel ? uploadLabel.querySelector('input[type="file"]') : null;

let defaultUploadText = '';
let fileLoaded = false;

if (uploadText) {
    defaultUploadText = uploadText.textContent.trim();
}

if (fileInput && uploadText) {
    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
            uploadText.textContent = fileInput.files[0].name;
            fileLoaded = true;
        } else {
            uploadText.textContent = defaultUploadText;
            fileLoaded = false;
        }
    });
}


// =========================
// БЛОК 4 — МОДАЛКА ПАРОЛЯ
// =========================
// В HTML должны быть:
// <div id="passwordModal" class="modal hidden"> ... </div>
// <input id="passwordInput" type="password">
// <button id="confirmSend">ОТПРАВИТЬ</button>
const passwordModal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');
const confirmSendBtn = document.getElementById('confirmSend');

function openPasswordModal() {
    if (!passwordModal) return;
    if (passwordInput) passwordInput.value = '';
    passwordModal.classList.remove('hidden');
    if (passwordInput) passwordInput.focus();
}

function closePasswordModal() {
    if (!passwordModal) return;
    passwordModal.classList.add('hidden');
}

if (passwordModal) {
    passwordModal.addEventListener('click', (e) => {
        if (e.target && e.target.dataset && e.target.dataset.close) {
            closePasswordModal();
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePasswordModal();
});


// =========================
// БЛОК 5 — ОТПРАВКА + POLLING
// =========================
const sendButton = document.querySelector('.send');
const downloadMsg = document.querySelector('.download-msg');
const reloadLink = document.querySelector('.reload-conv');
const buttonsContainer = document.querySelector('.choice-buttons');

const API_BASE = 'http://localhost:8080/translate';

// тут храним подготовленные данные до ввода пароля
let pending = {
    file: null,
    languages: []
};

function collectSelectedLanguages() {
    const checkboxes = document.querySelectorAll('.choice-lang input[type="checkbox"]');
    const selected = [];

    checkboxes.forEach(cb => {
        const label = cb.closest('.checkbox');
        if (!label) return;

        if (cb.checked) {
            if (cb.id === 'self-var') {
                const txt = (selfInput ? selfInput.value : '').trim();
                if (txt) selected.push(txt.toLowerCase());
            } else {
                const lang = (label.dataset.lang || '').trim();
                if (lang) selected.push(lang.toLowerCase());
            }
        }
    });

    return selected;
}

function setButtonsDisabled(disabled) {
    if (!buttonsContainer) return;
    if (disabled) buttonsContainer.classList.add('buttons-disabled');
    else buttonsContainer.classList.remove('buttons-disabled');
}

// Реальная отправка после ввода пароля
function startUploadWithPassword(password) {
    if (!pending.file || !pending.languages || pending.languages.length === 0) {
        alert('Ошибка: данные для отправки не готовы.');
        return;
    }

    const formData = new FormData();
    formData.append('languages', pending.languages.join(','));
    formData.append('file', pending.file);
    formData.append('password', password); // ✅ пароль уходит вместе с файлом

    setButtonsDisabled(true);

    // если хочешь показывать "downloadMsg" как индикатор — просто делаем видимым
    if (downloadMsg) downloadMsg.classList.remove('hidden');

    fetch(`${API_BASE}/add`, {
        method: 'POST',
        body: formData
    })
        .then(async (res) => {
            // ❌ неверный пароль => 403 Forbidden (как ты сказал)
            if (res.status === 403) {
                throw new Error('FORBIDDEN');
            }
            if (!res.ok) {
                throw new Error('SERVER_ERROR');
            }
            return res.text(); // id задачи
        })
        .then((id) => {
            const requestId = (id || '').trim();
            if (!requestId) {
                throw new Error('BAD_ID');
            }
            pollStatusAndDownload(requestId);
        })
        .catch((err) => {
            setButtonsDisabled(false);

            // если не хочешь показывать downloadMsg при ошибках — прячем обратно
            if (downloadMsg) downloadMsg.classList.add('hidden');

            if (err.message === 'FORBIDDEN') {
                alert('Неверный пароль. Попробуйте ещё раз.');
                openPasswordModal();
                return;
            }

            alert('Произошла ошибка при отправке файла. Подробности в консоли.');
            console.error(err);
        });
}

if (sendButton) {
    // Клик по основной "ОТПРАВИТЬ": только проверки + открытие модалки
    sendButton.addEventListener('click', (e) => {
        e.preventDefault();

        const selectedLanguages = collectSelectedLanguages();
        const hasLanguages = selectedLanguages.length > 0;

        if (!fileLoaded && !hasLanguages) {
            alert('Ошибка: вы не загрузили .srt файл и не выбрали языки.');
            return;
        }

        if (!fileLoaded) {
            alert('Ошибка: вы не загрузили .srt файл.');
            return;
        }

        if (!hasLanguages) {
            alert('Ошибка: вы не выбрали ни одного языка.');
            return;
        }

        // сохраняем подготовленные данные и просим пароль
        pending.file = fileInput.files[0];
        pending.languages = selectedLanguages;

        openPasswordModal();
    });
}

if (confirmSendBtn) {
    // Клик по "ОТПРАВИТЬ" в модалке
    confirmSendBtn.addEventListener('click', () => {
        const password = (passwordInput ? passwordInput.value : '').trim();
        if (!password) {
            alert('Введите пароль.');
            return;
        }

        closePasswordModal();
        startUploadWithPassword(password);
    });
}

// Опционально: отправка пароля по Enter в инпуте
if (passwordInput && confirmSendBtn) {
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmSendBtn.click();
        }
    });
}


/**
 * Опрос /translate/status/{id} и скачивание /translate/files/{id}, когда готово
 * @param {string} id
 */
function pollStatusAndDownload(id) {
    const POLL_INTERVAL = 3000;

    function checkStatus() {
        fetch(`${API_BASE}/status/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('STATUS_ERROR');
                return res.text();
            })
            .then(text => {
                const isReady = text.trim() === 'true';

                if (!isReady) {
                    setTimeout(checkStatus, POLL_INTERVAL);
                    return;
                }

                // готово — скачиваем
                window.location.href = `${API_BASE}/files/${id}`;

                if (reloadLink) reloadLink.classList.remove('hidden');
                setButtonsDisabled(false);
            })
            .catch(err => {
                setButtonsDisabled(false);
                if (downloadMsg) downloadMsg.classList.add('hidden');
                alert('Ошибка при запросе статуса перевода. Подробности в консоли.');
                console.error(err);
            });
    }

    checkStatus();
}