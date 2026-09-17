const KEY = 'dinamo-lang';

const strings = {
  ka: {
    title: 'დინამო: გზა გოლისკენ',
    namePlaceholder: 'შენი სახელი',
    start: 'დაწყება',
    roomDressing: 'გასახდელი',
    roomPhysio: 'ფიზიო',
    roomShowers: 'საშხაპე',
    roomTunnel: 'გვირაბი',
    substitutedIn: 'შედიხარ თამაშში!',
    stayOnBench: 'დარჩი სკამზე',
  },
  en: {
    title: 'Dinamo: Road to Goal',
    namePlaceholder: 'Your name',
    start: 'Start',
    roomDressing: 'Dressing room',
    roomPhysio: 'Physio',
    roomShowers: 'Showers',
    roomTunnel: 'Tunnel',
    substitutedIn: 'You\'re on!',
    stayOnBench: 'Stay on the bench',
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
