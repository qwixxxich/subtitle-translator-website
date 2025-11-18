document.querySelector('.choose-all').addEventListener('click', function (e) {
    e.preventDefault();
    const checkboxes = document.querySelectorAll('.choice-lang input[type="checkbox"]');
    const allChecked = [...checkboxes].every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
});