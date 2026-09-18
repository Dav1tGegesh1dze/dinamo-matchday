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
    kitFirst: 'ჯერ ფორმა და ბუცები!',
    stayOnBench: 'დარჩი სკამზე',
    tackled: 'წაგართვეს!',
    saved: 'მეკარემ დაიჭირა!',
    goal: 'გოოოლ!',
    yourTime: 'შენი დრო',
    outAt: 'თამაში დასრულდა',
    stage1: 'სკამზე დარჩი',
    stage2: 'პირველი მცველი',
    stage3: 'მეორე მცველი',
    stage4: 'მეკარე',
    leaderboard: 'საუკეთესო დროები',
    noScores: 'ჯერ არავის გაუტანია გოლი',
    confirmReset: 'წავშალოთ ყველა შედეგი?',
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
    kitFirst: 'Get your kit first!',
    stayOnBench: 'Stay on the bench',
    tackled: 'Tackled!',
    saved: 'Saved!',
    goal: 'GOAL!',
    yourTime: 'Your time',
    outAt: 'Game over',
    stage1: 'Stayed on the bench',
    stage2: 'Defender 1',
    stage3: 'Defender 2',
    stage4: 'Goalkeeper',
    leaderboard: 'Fastest goals',
    noScores: 'Nobody has scored yet',
    confirmReset: 'Delete all results?',
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
