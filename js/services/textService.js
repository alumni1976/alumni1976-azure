let texts = null;

export async function loadTexts() {
  if (texts) {
    return texts;
  }

  const response = await fetch("./assets/data/texts.json", {
    cache: "no-cache"
  });

  if (!response.ok) {
    throw new Error(
      `Αποτυχία φόρτωσης texts.json. HTTP ${response.status}`
    );
  }

  texts = await response.json();

  return texts;
}

export function getText(path, fallback = "") {
  if (!texts) {
    console.warn("Το texts.json δεν έχει φορτωθεί ακόμη.");
    return fallback || path;
  }

  const value = path
    .split(".")
    .reduce((current, key) => current?.[key], texts);

  if (typeof value !== "string") {
    console.warn(`Δεν βρέθηκε το κείμενο: ${path}`);
    return fallback || path;
  }

  return value;
}

export function formatText(path, values = {}, fallback = "") {
  let message = getText(path, fallback);

  Object.entries(values).forEach(([key, value]) => {
    message = message.replaceAll(`{${key}}`, String(value));
  });

  return message;
}
