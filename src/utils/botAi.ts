import { Player, Language } from '../types/game';

const BOT_NAMES_AR = [
  'فارس النجار', 'ليلى الخياطة', 'عمر الحداد', 'سارة الحكيمة', 
  'يوسف الصياد', 'نور المعلمة', 'كريم المزارع', 'مريم الطاهية'
];

const BOT_NAMES_EN = [
  'Arthur the Blacksmith', 'Elena the Weaver', 'Marcus the Hunter', 'Sophia the Herbalist',
  'Lucas the Miller', 'Clara the Baker', 'Julian the Forester', 'Beatrice the Scholar'
];

const BOT_AVATARS = ['🧔', '👩‍🦰', '👨‍🦳', '👩‍🌾', '🧔‍♂️', '🧕', '🧑‍🔬', '🧙'];

export function generateRandomBot(existingNames: string[], lang: Language): Partial<Player> {
  const pool = lang === 'ar' ? BOT_NAMES_AR : BOT_NAMES_EN;
  const available = pool.filter(n => !existingNames.includes(n));
  const name = available.length > 0 
    ? available[Math.floor(Math.random() * available.length)]
    : `${lang === 'ar' ? 'قروي' : 'Resident'} #${Math.floor(Math.random() * 900 + 100)}`;
  
  const avatar = BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)];

  return {
    uid: `bot_${Math.random().toString(36).substring(2, 9)}`,
    name,
    avatar,
    role: 'unassigned',
    isAlive: true,
    isHost: false,
    isBot: true,
    isMuted: false,
    isSpeaking: false,
    joinedAt: Date.now()
  };
}

const AR_SUSPICION_LINES = [
  'سمعت خطوات ثقيلة الليلة الماضية بالقرب من منزل {target}!',
  'لماذا يلتزم {target} الصمت هكذا؟ هذا مريب جداً للقرية!',
  '{target} يتصرف بطريقة غير معتادة اليوم، أظن أنه يخفي مخالبه!',
  'أنا متأكد من براءة نفسي، ويجب أن ندقق في كلام {target}!',
  'أيها القرويون، لا تشتتوا أصواتكم، انظروا إلى {target}!',
  'أنا كقروي مخلص أرى أن {target} هو التهديد الأكبر علينا اليوم.'
];

const EN_SUSPICION_LINES = [
  'I heard heavy footsteps near {target}’s cabin last night!',
  'Why is {target} being so quiet? It feels awfully suspicious!',
  '{target} is deflecting way too much today. Check their fangs!',
  'Fellow villagers, do not divide our votes; look closely at {target}!',
  'I have watched {target} closely, their behavior doesn’t match an innocent!',
  'We need to hang {target} before the wolves outnumber us tonight!'
];

export function generateBotDayDialogue(bot: Player, allAlive: Player[], lang: Language): { text: string; targetId: string } {
  const possibleTargets = allAlive.filter(p => p.uid !== bot.uid);
  const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
  const pool = lang === 'ar' ? AR_SUSPICION_LINES : EN_SUSPICION_LINES;
  const line = pool[Math.floor(Math.random() * pool.length)];

  return {
    text: line.replace('{target}', target ? target.name : (lang === 'ar' ? 'أحدهم' : 'someone')),
    targetId: target ? target.uid : ''
  };
}
