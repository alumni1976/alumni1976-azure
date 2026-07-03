class MenuView {
  render(datasetObject) {
    const menuUl = document.getElementById('menu');

    if (!menuUl) {
      console.error("Δεν βρέθηκε <ul id='menu'> στο HTML.");
      return;
    }

    menuUl.innerHTML = '';

    if (!datasetObject || datasetObject.isEmpty()) {
      console.warn("Το Object που παραλήφθηκε στο indexviewfromdb.js δεν περιέχει δεδομένα.");
      return;
    }

    datasetObject.items.forEach(row => {
      const itemText = row.item;
      const itemUrl = row.url;

      if (!itemText || !itemUrl) return;

      const li = document.createElement('li');
      const a = document.createElement('a');

      const cleanRoute = itemUrl
        .toString()
        .trim()
        .replace('.html', '')
        .replace(/^#\//, '');

      a.href = '#/' + cleanRoute;
      a.textContent = itemText.toString().trim();

      li.appendChild(a);
      menuUl.appendChild(li);
    });
  }
}

window.MenuView = MenuView;