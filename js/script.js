const chooseAllLink = document.querySelector('.choose-all');

if (chooseAllLink) {
    chooseAllLink.addEventListener('click', (e) => {
        e.preventDefault();
        const checkboxes = document.querySelectorAll('.choice-lang input[type="checkbox"]');
        const filtered = [...checkboxes].filter(cb => cb.id !== 'self-var');
        const allChecked = filtered.every(cb => cb.checked);
        filtered.forEach(cb => (cb.checked = !allChecked));
    });
}

const selfCheckbox = document.getElementById('self-var');
const selfInput = document.getElementById('self-input');

if (selfInput && selfCheckbox) {
    selfInput.addEventListener('input', () => {
        selfInput.value = selfInput.value.replace(/[^A-Za-z ]/g, '');
        selfCheckbox.checked = selfInput.value.trim().length > 0;
    });
}

const uploadLabel = document.querySelector('.upload-file');
const uploadText = uploadLabel ? uploadLabel.querySelector('.upload-text') : null;
const fileInput = uploadLabel ? uploadLabel.querySelector('input[type="file"]') : null;

let defaultUploadText = '';
let fileLoaded = false;

if (uploadText) defaultUploadText = uploadText.textContent.trim();

function isSrtFile(file) {
    if (!file) return false;
    const name = (file.name || '').toLowerCase().trim();
    return name.endsWith('.srt');
}

if (fileInput && uploadText) {
    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

        if (!file) {
            uploadText.textContent = defaultUploadText;
            fileLoaded = false;
            return;
        }

        if (!isSrtFile(file)) {
            alert('Ошибка: можно загрузить только файл .srt');
            fileInput.value = '';
            uploadText.textContent = defaultUploadText;
            fileLoaded = false;
            return;
        }

        uploadText.textContent = file.name;
        fileLoaded = true;
    });
}

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
        if (e.target && e.target.dataset && e.target.dataset.close) closePasswordModal();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePasswordModal();
});

const sendButton = document.querySelector('.send');
const downloadMsg = document.querySelector('.download-msg');
const reloadLink = document.querySelector('.reload-conv');
const buttonsContainer = document.querySelector('.choice-buttons');

const API_BASE = 'https://81.31.245.146:8080/translate';

let pending = { file: null, languages: [] };

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

function startUploadWithPassword(password) {
    if (!pending.file || !pending.languages || pending.languages.length === 0) {
        alert('Ошибка: данные для отправки не готовы.');
        return;
    }

    const formData = new FormData();
    formData.append('languages', pending.languages.join(','));
    formData.append('file', pending.file);
    formData.append('password', password);

    setButtonsDisabled(true);
    if (downloadMsg) downloadMsg.classList.remove('hidden');

    fetch(`${API_BASE}/add`, { method: 'POST', body: formData })
        .then(async (res) => {
            if (res.status === 403) throw new Error('FORBIDDEN');
            if (!res.ok) throw new Error('SERVER_ERROR');
            return res.text();
        })
        .then((id) => {
            const token = (id || '').trim();
            if (!token) throw new Error('BAD_ID');
            pollStatusAndDownload(token);
        })
        .catch((err) => {
            setButtonsDisabled(false);
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
    sendButton.addEventListener('click', (e) => {
        e.preventDefault();

        const pickedFile = fileInput?.files?.[0] || null;

        if (!pickedFile || !isSrtFile(pickedFile)) {
            alert('Ошибка: выберите файл .srt');
            if (fileInput) fileInput.value = '';
            if (uploadText) uploadText.textContent = defaultUploadText;
            fileLoaded = false;
            return;
        }

        const selectedLanguages = collectSelectedLanguages();

        if (selectedLanguages.length === 0) {
            alert('Ошибка: вы не выбрали ни одного языка.');
            return;
        }

        pending.file = pickedFile;
        pending.languages = selectedLanguages;

        openPasswordModal();
    });
}

if (confirmSendBtn) {
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

if (passwordInput && confirmSendBtn) {
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmSendBtn.click();
        }
    });
}

function pollStatusAndDownload(token) {
    const POLL_INTERVAL = 3000;

    function checkStatus() {
        fetch(`${API_BASE}/status/${token}`)
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
                window.location.href = `${API_BASE}/files/${token}`;
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
