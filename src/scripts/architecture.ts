const section = document.querySelector<HTMLElement>('.architecture-section');
if (section) {
  const catalogue = section.querySelector<HTMLElement>('.architecture-catalogue');
  const count = section.querySelector<HTMLElement>('[data-project-count]');
  const empty = section.querySelector<HTMLElement>('[data-empty]');
  const items = [...section.querySelectorAll<HTMLElement>('.catalogue-item')];
  const filters = [...section.querySelectorAll<HTMLSelectElement>('select[data-filter]')];
  const views = [...section.querySelectorAll<HTMLButtonElement>('[data-view]')];
  const selection = { type: 'todos', status: 'todos' };
  const update = () => {
    let visible = 0;
    for (const item of items) {
      item.hidden = (selection.type !== 'todos' && item.dataset.type !== selection.type)
        || (selection.status !== 'todos' && item.dataset.status !== selection.status);
      if (!item.hidden) visible++;
    }
    for (const filter of filters) {
      const group = filter.dataset.filter as keyof typeof selection;
      filter.value = selection[group];
    }
    if (count) {
      // Preserve the Figma headline for the unfiltered 12-item mock subset.
      const total = selection.type === 'todos' && selection.status === 'todos' ? 27 : visible;
      count.textContent = `${total} ${total === 1 ? 'proyecto' : 'proyectos'}`;
    }
    if (empty) empty.hidden = visible !== 0;
  };
  for (const filter of filters) {
    filter.addEventListener('change', () => {
      const group = filter.dataset.filter as keyof typeof selection;
      selection[group] = filter.value;
      update();
    });
  }
  for (const button of views) {
    button.addEventListener('click', () => {
      if (catalogue) catalogue.dataset.view = button.dataset.view;
      for (const view of views) view.setAttribute('aria-pressed', String(view === button));
    });
  }
  section.querySelector('[data-reset]')?.addEventListener('click', () => {
    selection.type = 'todos';
    selection.status = 'todos';
    update();
  });
}
