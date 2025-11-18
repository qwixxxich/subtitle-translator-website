document.querySelector('.choose-all').addEventListener('click', function (e) {
    e.preventDefault();

    const checkboxes = document.querySelectorAll('.choice-lang input[type="checkbox"]');
    const targetId = 'self-var';

    const filtered = [...checkboxes].filter(cb => cb.id !== targetId);

    const allChecked = filtered.every(cb => cb.checked);

    filtered.forEach(cb => cb.checked = !allChecked);
});

const selfCheckbox = document.getElementById('self-var');
const selfInput = document.getElementById('self-input');

selfInput.addEventListener('input', () => {
    selfInput.value = selfInput.value.replace(/[^A-Za-z ]/g, '');
    selfCheckbox.checked = selfInput.value.trim().length > 0;
});
