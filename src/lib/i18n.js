const KEY = 'dinamo-lang';

const strings = {
  ka: {
    title: 'დინამო: გზა გოლისკენ',
    namePlaceholder: 'შენი სახელი',
    start: 'დაწყება',
  },
  en: {
    title: 'Dinamo: Road to Goal',
    namePlaceholder: 'Your name',
    start: 'Start',
  },
};

let lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'ka';

export function getLang() {
  return lang;
}

export function setLang(next) {
  lang = next;
  localStorage.setItem(KEY, lang);
}

export function t(key) {
  return strings[lang][key];
}
