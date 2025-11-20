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
// БЛОК 4 — ОБРАБОТКА КНОПКИ "ОТПРАВИТЬ" + ТАЙМЕР
// =========================
const sendButton = document.querySelector('.send');
const downloadMsg = document.querySelector('.download-msg');
const reloadLink = document.querySelector('.reload-conv');
const buttonsContainer = document.querySelector('.choice-buttons');

if (sendButton) {
    sendButton.addEventListener('click', (e) => {
        e.preventDefault();

        const checkboxes = document.querySelectorAll('.choice-lang input[type="checkbox"]');
        const selectedLanguages = [];

        checkboxes.forEach(cb => {
            const label = cb.closest('.checkbox');
            if (!label) return;

            if (cb.checked) {
                if (cb.id === 'self-var') {
                    const txt = document.getElementById('self-input').value.trim();
                    if (txt.length > 0) selectedLanguages.push(txt);
                } else {
                    selectedLanguages.push(label.dataset.lang);
                }
            }
        });

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

        console.log('Выбранные языки:', selectedLanguages);

        if (downloadMsg) {
            downloadMsg.classList.remove('hidden');
        }

        // =========================
        // ДЕАКТИВАЦИЯ КНОПОК ТОЛЬКО НА МОБИЛЬНОЙ (через CSS)
        // =========================
        if (buttonsContainer) {
            buttonsContainer.classList.add('buttons-disabled');
        }

        let timeLeft = 5 * 60;
        let timerInterval;

        function updateTimer() {
            if (!downloadMsg) {
                clearInterval(timerInterval);
                return;
            }

            const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
            const seconds = String(timeLeft % 60).padStart(2, '0');

            downloadMsg.textContent =
                `Принято! Примерное оставшееся время до скачивания: ${minutes}:${seconds}`;

            if (timeLeft > 0) {
                timeLeft--;
            } else {
                clearInterval(timerInterval);
                downloadMsg.textContent = 'Файл готов к скачиванию!';
                if (reloadLink) {
                    reloadLink.classList.remove('hidden');
                }
            }
        }

        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    });
}
