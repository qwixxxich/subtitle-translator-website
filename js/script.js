document.querySelector('.choose-all').addEventListener('click', function (e) {
    e.preventDefault();

    const checkboxes = document.querySelectorAll('.choice-lang input[type="checkbox"]');
    const targetId = 'self-var';

    const filtered = [...checkboxes].filter(cb => cb.id !== targetId);

    const allChecked = filtered.every(cb => cb.checked);

    filtered.forEach(cb => cb.checked = !allChecked);
});