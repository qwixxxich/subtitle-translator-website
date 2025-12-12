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

        filtered.forEach(cb => cb.checked = !allChecked);
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
// БЛОК 4 — МОДАЛКА ПАРОЛЯ (ОТПРАВИТЬ в окне)
// =========================
// В HTML должны быть элементы:
// #passwordModal, #passwordInput, #confirmSend
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
// БЛОК 5 — ОТПРАВКА НА СЕРВЕР + ОЖИДАНИЕ ГОТОВОГО ФАЙЛА
// (с требованием пароля)
// =========================
const sendButton = document.querySelector('.send');
const downloadMsg = document.querySelector('.download-msg');
const reloadLink = document.querySelector('.reload-conv');
const buttonsContainer = document.querySelector('.choice-buttons');

const API_BASE = 'http://localhost:8080/translate';

// Временно храним данные до ввода пароля
let pending = {
    file: null,
    languages: []
};

function collectSelectedLanguages() {
    const checkboxes = document.querySelectorAll('.choice-lang input[type="checkbox"]');
    const selectedLanguages = [];

    checkboxes.forEach(cb => {
        const label = cb.closest('.checkbox');
        if (!label) return;

        if (cb.checked) {
            if (cb.id === 'self-var') {
                const txt = (selfInput ? selfInput.value : '').trim();
                if (txt.length > 0) selectedLanguages.push(txt.toLowerCase());
            } else {
                selectedLanguages.push((label.dataset.lang || '').toLowerCase());
            }
        }
    });

    return selectedLanguages;
}

function startUploadWithPassword(password) {
    if (!pending.file || pending.languages.length === 0) {
        alert('Ошибка: данные для отправки не готовы.');
        return;
    }

    // Формируем FormData как в Postman:
    // languages: "russian,hindi"
    // file: ...
    // password: ...
    const formData = new FormData();
    formData.append('languages', pending.languages.join(','));
    formData.append('file', pending.file);
    formData.append('password', password);

    if (downloadMsg) {
        downloadMsg.classList.remove('hidden');
        downloadMsg.textContent = 'Отправляем файл на сервер...';
    }

    if (buttonsContainer) {
        buttonsContainer.classList.add('buttons-disabled');
    }

    // ===== 1. POST /translate/add =====
    fetch(`${API_BASE}/add`, {
        method: 'POST',
        body: formData
    })
        .then(res => {
            if (!res.ok) {
                throw new Error('Ошибка ответа сервера при загрузке файла');
            }
            return res.text();
        })
        .then(id => {
            const requestId = id.trim();
            console.log('ID задачи перевода:', requestId);

            if (downloadMsg) {
                downloadMsg.textContent = 'Файл принят! Ожидаем завершения перевода...';
            }

            pollStatusAndDownload(requestId);
        })
        .catch(err => {
            console.error(err);
            alert('Произошла ошибка при отправке файла. Подробности в консоли.');

            if (buttonsContainer) {
                buttonsContainer.classList.remove('buttons-disabled');
            }
            if (downloadMsg) {
                downloadMsg.classList.add('hidden');
            }
        });
}

if (sendButton) {
    // 1) Нажатие основной "ОТПРАВИТЬ" — только проверки + открытие модалки
    sendButton.addEventListener('click', (e) => {
        e.preventDefault();

        const selectedLanguages = collectSelectedLanguages();
        const hasLanguages = selectedLanguages.length > 0;

        if (!fileLoaded && !hasLanguages) {
            alert('Ошибка: вы не загрузили .srt файл и не выбрали языки.');
            console.error('Ошибка: не выбран файл и не выбраны языки (technical log).');
            return;
        }

        if (!fileLoaded) {
            alert('Ошибка: вы не загрузили .srt файл.');
            console.error('Ошибка: не выбран файл (technical log).');
            return;
        }

        if (!hasLanguages) {
            alert('Ошибка: вы не выбрали ни одного языка.');
            console.error('Ошибка: не выбраны языки (technical log).');
            return;
        }

        // Сохраняем данные, но не отправляем — просим пароль
        pending.file = fileInput.files[0];
        pending.languages = selectedLanguages;

        // Открываем модальное окно пароля
        openPasswordModal();
    });
}

// 2) Нажатие "ОТПРАВИТЬ" внутри модалки — реальная отправка
if (confirmSendBtn) {
    confirmSendBtn.addEventListener('click', () => {
        const password = (passwordInput ? passwordInput.value : '').trim();

        if (!password) {
            alert('Введите пароль');
            return;
        }

        closePasswordModal();
        startUploadWithPassword(password);
    });
}


/**
 * Опрос /translate/status/{id} и скачивание /translate/files/{id}, когда готово
 * @param {string} id
 */
function pollStatusAndDownload(id) {
    const POLL_INTERVAL = 3000; // мс между запросами статуса

    function checkStatus() {
        fetch(`${API_BASE}/status/${id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Ошибка ответа сервера при запросе статуса');
                }
                return res.text();
            })
            .then(text => {
                const isReady = text.trim() === 'true';

                if (!downloadMsg) return;

                if (!isReady) {
                    downloadMsg.textContent = 'Перевод ещё не готов. Продолжаем ожидание...';
                    setTimeout(checkStatus, POLL_INTERVAL);
                } else {
                    downloadMsg.textContent = 'Перевод готов! Начинаем скачивание...';

                    // ===== 3. GET /translate/files/{id} =====
                    window.location.href = `${API_BASE}/files/${id}`;

                    if (reloadLink) {
                        reloadLink.classList.remove('hidden');
                    }
                    if (buttonsContainer) {
                        buttonsContainer.classList.remove('buttons-disabled');
                    }
                }
            })
            .catch(err => {
                console.error(err);
                alert('Ошибка при запросе статуса перевода. Подробности в консоли.');

                if (buttonsContainer) {
                    buttonsContainer.classList.remove('buttons-disabled');
                }
                if (downloadMsg) {
                    downloadMsg.classList.add('hidden');
                }
            });
    }

    checkStatus();
}
