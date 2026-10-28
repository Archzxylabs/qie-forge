// Progressive enhancement only: every document and source link works without JS.
for (const group of document.querySelectorAll('[data-filter-group]')) {
  const input = group.querySelector('input[type="search"]');
  const select = group.querySelector('select');
  const items = [...group.querySelectorAll('[data-search]')];
  const output = group.querySelector('[data-result-count]');
  const empty = group.querySelector('[data-empty]');
  function filter() {
    const query = input.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const item of items) {
      const visible = item.dataset.search.includes(query)
        && (!select || !select.value || item.dataset.status === select.value);
      item.hidden = !visible;
      if (visible) count += 1;
    }
    output.textContent = `${count} ${count === 1 ? 'result' : 'results'}`;
    empty.hidden = count !== 0;
  }
  input.addEventListener('input', filter);
  select?.addEventListener('change', filter);
  group.querySelector('[data-reset]').addEventListener('click', () => {
    input.value = '';
    if (select) select.value = '';
    filter();
    input.focus();
  });
  filter();
}

for (const button of document.querySelectorAll('[data-copy]')) {
  button.hidden = false;
  button.addEventListener('click', async () => {
    const code = document.getElementById(button.dataset.copy);
    const output = button.parentElement.querySelector('[role="status"]');
    try {
      await navigator.clipboard.writeText(code.textContent);
      output.textContent = 'Copied.';
    } catch {
      output.textContent = 'Copy unavailable. Select the command and copy it manually.';
    }
  });
}
