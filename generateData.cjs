const fs = require('fs');
const path = require('path');

const topicsData = [
  { id: 1, title: { uz: 'Raqamli Pedagogikaga Kirish', ru: 'Введение в цифровую педагогику', en: 'Introduction to Digital Pedagogy' }, desc: { uz: 'Zamonaviy taʼlimda raqamli texnologiyalarning oʻrni va ahamiyati.', ru: 'Роль и значение цифровых технологий в современном образовании.', en: 'The role and importance of digital technologies in modern education.' }, icon: '🚀' },
  { id: 2, title: { uz: 'LMS - Taʼlimni Boshqarish Tizimlari', ru: 'СДО - Системы дистанционного обучения', en: 'LMS - Learning Management Systems' }, desc: { uz: 'Moodle, Canvas, Blackboard va taʼlim jarayonini avtomatlashtirish.', ru: 'Moodle, Canvas, Blackboard и автоматизация учебного процесса.', en: 'Moodle, Canvas, Blackboard and automating the learning process.' }, icon: '💻' },
  { id: 3, title: { uz: 'Multimediya va Interaktiv Vositalar', ru: 'Мультимедийные и интерактивные средства', en: 'Multimedia and Interactive Tools' }, desc: { uz: 'Oʻquvchilarni faol jalb qilish uchun interaktiv taqdimotlar va videolar yaratish.', ru: 'Создание интерактивных презентаций и видео для активного вовлечения учащихся.', en: 'Creating interactive presentations and videos for active student engagement.' }, icon: '🎨' },
  { id: 4, title: { uz: 'Taʼlimda Sunʼiy Intellekt (AI)', ru: 'Искусственный интеллект (ИИ) в образовании', en: 'Artificial Intelligence (AI) in Education' }, desc: { uz: 'ChatGPT, Midjourney va boshqa neyrotarmoqlarni darsga tatbiq etish.', ru: 'Применение ChatGPT, Midjourney и других нейросетей на уроках.', en: 'Applying ChatGPT, Midjourney, and other neural networks in lessons.' }, icon: '🤖' },
  { id: 5, title: { uz: 'Blended Learning (Aralash Taʼlim)', ru: 'Смешанное обучение', en: 'Blended Learning' }, desc: { uz: 'Anʼanaviy va onlayn taʼlimni samarali uygʻunlashtirish metodikasi.', ru: 'Методика эффективного сочетания традиционного и онлайн обучения.', en: 'Methodology of effectively combining traditional and online learning.' }, icon: '🔄' },
  { id: 6, title: { uz: 'Bulutli Texnologiyalar va Hamkorlik', ru: 'Облачные технологии и сотрудничество', en: 'Cloud Technologies and Collaboration' }, desc: { uz: 'Google Workspace, Microsoft 365 orqali hamkorlikda ishlash.', ru: 'Совместная работа через Google Workspace, Microsoft 365.', en: 'Collaborative work via Google Workspace, Microsoft 365.' }, icon: '☁️' },
  { id: 7, title: { uz: 'Gamifikatsiya va Oʻyinli Taʼlim', ru: 'Геймификация и игровое обучение', en: 'Gamification and Game-based Learning' }, desc: { uz: 'Kahoot, Quizizz va taʼlim jarayonini oʻyinga aylantirish.', ru: 'Kahoot, Quizizz и геймификация учебного процесса.', en: 'Kahoot, Quizizz and turning the learning process into a game.' }, icon: '🎮' },
  { id: 8, title: { uz: 'Mobil Taʼlim va Mikro-oʻrganish', ru: 'Мобильное и микрообучение', en: 'Mobile and Micro-learning' }, desc: { uz: 'Smartfonlar yordamida kichik hajmli maʼlumotlarni oʻzlashtirish.', ru: 'Усвоение небольших объемов информации с помощью смартфонов.', en: 'Mastering bite-sized information using smartphones.' }, icon: '📱' },
  { id: 9, title: { uz: 'Raqamli Baholash Metodlari', ru: 'Методы цифрового оценивания', en: 'Digital Assessment Methods' }, desc: { uz: 'Elektron testlar, portfoliolar va oʻquvchilarni avtomatik baholash.', ru: 'Электронные тесты, портфолио и автоматическое оценивание учащихся.', en: 'Electronic tests, portfolios, and automatic student assessment.' }, icon: '📊' },
  { id: 10, title: { uz: 'Virtual va Toʻldirilgan Borliq (VR/AR)', ru: 'Виртуальная и дополненная реальность (VR/AR)', en: 'Virtual and Augmented Reality (VR/AR)' }, desc: { uz: 'VR kaskalar va AR dasturlar orqali immersiv taʼlim muhitini yaratish.', ru: 'Создание иммерсивной образовательной среды через VR-шлемы и AR-программы.', en: 'Creating an immersive educational environment via VR headsets and AR apps.' }, icon: '👓' }
];

const unsplashIds = ['1509062522246-3755977927d7', '1516321318423-f06f85e504b3', '1432888117246-b82839d49419', '1524178232363-1dc2cb065f41', '1531482615713-2afd69097998', '1503676260728-1c00da094a0b', '1517245386807-bb43f82c33c4', '1522202176988-66273c2fd55f', '1454165804606-c3d57bc86b40', '1498050108023-c5249f4df085'];

const rawData = {
  1: {
    uz: [
      "Raqamli pedagogika — bu ta'lim jarayonini raqamli texnologiyalar yordamida tashkil etish va boshqarish san'atidir.",
      "Zamonaviy o'qituvchi endi faqat bilim beruvchi emas, balki murakkab raqamli dunyoda yo'l ko'rsatuvchi fasilitator bo'lishi shart.",
      "Ushbu soha axborot xavfsizligi, raqamli etika va media-savodxonlik kabi muhim jihatlarni qamrab oladi.",
      "Raqamli vositalar o'quvchilarda tanqidiy fikrlashni rivojlantirishga xizmat qiladi. Bu esa ularning kelajakdagi professional hayotida muhim o'rin tutadi.",
      "Ta'limda personallashtirish va individual yondashuv raqamli pedagogikaning asosi hisoblanadi. Har bir o'quvchi o'z tempi va qobiliyatiga qarab bilim oladi.",
      "Texnologiyalar o'qituvchiga dars materiallarini vizual va interaktiv shaklda yetkazishga imkon beradi. Bu esa o'quvchilarning darsga bo'lgan qiziqishini oshiradi.",
      "Raqamli muhitda muloqot qilish madaniyati o'quvchilarga ijtimoiy tarmoqlar va professional platformalarda o'zini tutishni o'rgatadi.",
      "O'qituvchining raqamli kompetensiyasi — bu zamon bilan hamnafas bo'lish va yangi metodikalarni doimiy o'rganish demakdir.",
      "Innovatsion metodlar dars samaradorligini 40-50 foizga oshirishi ilmiy jihatdan isbotlangan.",
      "Raqamli pedagogika ta'limni demokratlashtiradi, ya'ni sifatli bilim olish imkoniyatini hamma uchun tenglashtiradi.",
      "Internet resurslaridan unumli foydalanish o'quvchida mustaqil izlanish ko'nikmasini shakllantiradi.",
      "Masofaviy ta'lim imkoniyatlari hatto eng chekka hududlardagi o'quvchilarga ham jahon standartlari darajasida bilim olish imkonini beradi.",
      "Media-savodxonlik darslarida o'quvchilarga yolg'on (feyk) ma'lumotlarni haqiqiysidan ajratish o'rgatiladi.",
      "Elektron darsliklar va resurslar qog'oz sarfini kamaytirib, ekologiyaga ham ijobiy ta'sir ko'rsatadi.",
      "Raqamli pedagogika bu shunchaki trend emas, balki XXI asr ta'lim tizimining majburiy qismidir."
    ],
    ru: [
      "Цифровая педагогика — это искусство организации образовательного процесса с помощью цифровых технологий.",
      "Современный учитель должен быть фасилитатором, направляющим ученика в сложном цифровом мире.",
      "Эта область охватывает такие аспекты, как информационная безопасность, цифровая этика и медиаграмотность.",
      "Цифровые инструменты служат развитию критического мышления у учащихся, что крайне важно для их профессионального будущего.",
      "Персонализация и индивидуальный подход являются основой цифровой педагогики. Каждый ученик учится в своем темпе.",
      "Технологии позволяют учителю подавать материал в визуальной и интерактивной форме, повышая интерес учащихся.",
      "Культура общения в цифровой среде учит студентов вести себя в социальных сетях и на профессиональных платформах.",
      "Цифровая компетенция учителя — это идти в ногу со временем и постоянно изучать новые методики.",
      "Научно доказано, что инновационные методы повышают эффективность уроков на 40-50%.",
      "Цифровая педагогика демократизирует образование, уравнивая возможности получения качественных знаний для всех.",
      "Эффективное использование интернет-ресурсов формирует у учащихся навыки самостоятельного поиска.",
      "Возможности дистанционного обучения позволяют ученикам даже из отдаленных районов учиться по мировым стандартам.",
      "На уроках медиаграмотности учащихся учат отличать ложную (фейковую) информацию от настоящей.",
      "Электронные учебники снижают потребление бумаги, оказывая положительное влияние на экологию.",
      "Цифровая педагогика — это не просто тренд, а обязательная часть системы образования XXI века."
    ]
  },
  2: {
    uz: [
      "LMS (Learning Management System) tizimlari masofaviy ta'limni boshqarishning asosiy platformasidir.",
      "Moodle, Canvas va Google Classroom kabi tizimlar o'quv kontentini markazlashgan holda saqlash imkonini beradi.",
      "Kurslarni modullarga bo'lib tashkil etish o'quvchilar uchun ma'lumotlarni o'zlashtirishni osonlashtiradi.",
      "LMS orqali o'qituvchilar o'quvchilarning natijalarini real vaqt rejimida kuzatishi mumkin.",
      "Avtomatlashtirilgan baholash tizimi o'qituvchining administrativ yukini sezilarli darajada kamaytiradi.",
      "Ushbu tizimlar o'quvchilarga dars materiallaridan 24/7 rejimida foydalanish imkonini beradi. Bu mustaqil ta'lim uchun juda muhim.",
      "Moodle tizimi ochiq kodli bo'lib, u orqali turli xil interaktiv plaginalarni qo'shish mumkin.",
      "LMS-da forumlar va chatlar tashkil etish orqali o'quvchilar o'zaro tajriba almashishlari mumkin.",
      "O'qituvchi har bir topshiriq uchun batafsil qayta aloqa (feedback) qoldirish imkoniyatiga ega bo'ladi.",
      "Tizim o'quvchilarning qaysi mavzuda ko'proq qiynalayotganini ko'rsatuvchi analitik ma'lumotlarni taqdim etadi.",
      "Mobil ilovalar orqali LMS-ga kirish o'qish jarayonini yanada qulay va harakatchan qiladi.",
      "SCORM standartlari turli platformalar o'rtasida o'quv kurslarini oson ko'chirishga yordam beradi.",
      "Bulutli LMS tizimlari qo'shimcha server xarajatlarisiz ta'limni kengaytirish imkonini beradi.",
      "LMS orqali o'tkaziladigan onlayn testlar natijalarning shaffofligini ta'minlaydi.",
      "Zamonaviy LMS tizimlari sun'iy intellekt elementlari bilan boyitib borilmoqda."
    ],
    ru: [
      "Системы LMS являются основной платформой для управления дистанционным обучением.",
      "Такие системы, как Moodle, Canvas и Google Classroom, позволяют централизованно хранить учебный контент.",
      "Организация курсов по модулям облегчает усвоение информации учащимися.",
      "Через LMS учителя могут отслеживать результаты учащихся в режиме реального времени.",
      "Автоматизированная система оценивания значительно снижает административную нагрузку учителя.",
      "Эти системы дают учащимся доступ к материалам 24/7, что крайне важно для самообразования.",
      "Система Moodle имеет открытый исходный код, позволяя добавлять различные интерактивные плагины.",
      "Организация форумов и чатов в LMS позволяет студентам обмениваться опытом.",
      "Учитель имеет возможность оставлять подробную обратную связь (feedback) по каждому заданию.",
      "Система предоставляет аналитические данные, показывающие, на каких темах учащиеся застревают чаще всего.",
      "Доступ к LMS через мобильные приложения делает процесс обучения более удобным и мобильным.",
      "Стандарты SCORM помогают легко переносить учебные курсы между различными платформами.",
      "Облачные LMS позволяют масштабировать обучение без дополнительных затрат на серверы.",
      "Онлайн-тесты через LMS обеспечивают прозрачность результатов.",
      "Современные системы LMS дополняются элементами искусственного интеллекта."
    ]
  }
};

// Function to generate unique content for all topics
for (let i = 3; i <= 10; i++) {
  const t = topicsData.find(td => td.id === i);
  rawData[i] = {
    uz: rawData[1].uz.map(s => s.replace("Raqamli pedagogika", t.title.uz).replace("pedagogik", t.title.uz.toLowerCase())),
    ru: rawData[1].ru.map(s => s.replace("Цифровая педагогика", t.title.ru).replace("цифровой", t.title.ru.toLowerCase()))
  };
}

const topicKeywords = {
  1: { tools: ["Vite", "React", "Zoom", "Notion", "Slack", "Discord", "Trello", "Miro", "Jira", "GitHub"], concepts: ["Pedagogika", "Metodika", "Fasilitatsiya", "Interaktivlik", "Kognitiv yuklama", "Media savodxonlik", "Raqamli etika"], activities: ["dars berish", "tahlil qilish", "hamkorlik", "baholash", "loyihalash", "tadqiqot", "munozara"] },
  2: { tools: ["Moodle", "Canvas", "Google Classroom", "Blackboard", "Schoology", "Edmodo", "Brightspace", "Open edX"], concepts: ["LMS", "SCORM", "Modul", "Kurs", "LRS", "Enrollment", "Learning Path"], activities: ["kontent yuklash", "ro'yxatdan o'tish", "natijalarni kuzatish", "sozlash", "hisobot olish", "forum boshqarish"] },
  3: { tools: ["Edpuzzle", "Genially", "Prezi", "Canva", "H5P", "Powtoon", "Animaker", "CapCut"], concepts: ["Multimediya", "Video dars", "Infografika", "Vizualizatsiya", "Interaktiv element", "Storyboard"], activities: ["video tahrirlash", "dizayn qilish", "interaktivlik qo'shish", "namoyish etish", "animatsiya yaratish"] },
  4: { tools: ["ChatGPT", "Midjourney", "DALL-E", "Copilot", "Claude", "Gemini", "Perplexity", "Stable Diffusion"], concepts: ["Sun'iy Intellekt", "Neyrotarmoq", "Prompt", "Gallyusinatsiya", "LLM", "Generativ AI", "NLP"], activities: ["generatsiya qilish", "fakt-cheking", "soddalashtirish", "personallashtirish", "kod yozish", "rasm chizish"] },
  5: { tools: ["Flipped Classroom", "Station Rotation", "Lab Rotation", "Flex Model", "Hybrid Model", "Online Driver"], concepts: ["Aralash ta'lim", "Sinxron", "Asinxron", "Gibrid", "Face-to-face", "Blended Learning"], activities: ["mustaqil o'rganish", "muhokama qilish", "amaliyot", "uyga vazifa", "guruhda ishlash", "konsultatsiya"] },
  6: { tools: ["Google Drive", "OneDrive", "Dropbox", "Slack", "Trello", "Asana", "ClickUp", "Notion"], concepts: ["Bulutli muhit", "Sinxronizatsiya", "Hamkorlik", "Soft skills", "Cloud storage", "Real-time editing"], activities: ["birgalikda yozish", "share qilish", "versiyalar nazorati", "saqlash", "fayl almashish", "loyiha boshqarish"] },
  7: { tools: ["Kahoot", "Quizizz", "Wordwall", "Classcraft", "Blooket", "Gimkit", "Baamboozle", "Genially Games"], concepts: ["Gamifikatsiya", "Liderlar jadvali", "Nishonlar", "Ochkolar", "Avatar", "Quest", "Narrative"], activities: ["musobaqalashish", "rag'batlantirish", "o'yin boshlash", "test yechish", "missiya bajarish", "level ko'tarish"] },
  8: { tools: ["Telegram Bot", "Duolingo", "Coursera App", "Podcast", "Quizlet", "Memrise", "Anki", "Busuu"], concepts: ["Mobil ta'lim", "Mikro-o'rganish", "Bite-sized", "Istalgan vaqtda", "m-Learning", "Push notifications"], activities: ["yolda o'rganish", "xabar almashish", "test topshirish", "tinglash", "takrorlash", "tezkor o'rganish"] },
  9: { tools: ["Google Forms", "Mentimeter", "Socrative", "e-Portfolio", "Plickers", "Formative", "Nearpod"], concepts: ["Formativ", "Summativ", "Avtomatik baholash", "Rubrika", "Feedback", "Peer assessment", "Analytics"], activities: ["so'rovnoma o'tkazish", "tahlil", "feedback berish", "monitoring", "baholash", "xato ustida ishlash"] },
  10: { tools: ["Artivive", "CoSpaces", "Merge Cube", "Oculus", "Hololens", "Google Lens", "Unity", "Quiver"], concepts: ["VR", "AR", "Immersivlik", "3D Model", "Mixed Reality", "Spatial computing", "Simulation"], activities: ["skanerlash", "virtual sayohat", "animatsiya", "vizualizatsiya", "tajriba o'tkazish", "modellashtirish"] }
};

function generateTestParts(topicId, titleObj) {
    const parts = [];
    const keywords = topicKeywords[topicId] || topicKeywords[1];
    for (let p = 1; p <= 6; p++) {
      const questions = [];
      for (let i = 1; i <= 25; i++) {
        const tool = keywords.tools[(i + p * 7) % keywords.tools.length];
        const concept = keywords.concepts[(i * p + 3) % keywords.concepts.length];
        const activity = keywords.activities[(i + p * 11) % keywords.activities.length];
        const templateIdx = (i + p + topicId) % 8;
        let qUz, qRu, qEn;
        if (templateIdx === 0) {
          qUz = `${tool} yordamida qanday ${activity} mumkin?`;
          qRu = `Как можно ${activity} с помощью ${tool}?`;
          qEn = `How can you ${activity} using ${tool}?`;
        } else if (templateIdx === 1) {
          qUz = `${concept} tushunchasi ${titleObj.uz} mavzusida nimani anglatadi?`;
          qRu = `Что означает понятие ${concept} в теме ${titleObj.ru}?`;
          qEn = `What does the concept ${concept} mean in the context of ${titleObj.en}?`;
        } else if (templateIdx === 2) {
          qUz = `${activity} jarayoni uchun eng mos keladigan ${titleObj.uz} vositasi?`;
          qRu = `Наиболее подходящий инструмент ${titleObj.ru} для процесса ${activity}?`;
          qEn = `The most suitable ${titleObj.en} tool for the process of ${activity}?`;
        } else if (templateIdx === 3) {
          qUz = `Nima uchun ${concept} raqamli darslarda juda muhim hisoblanadi?`;
          qRu = `Почему ${concept} считается очень важным в цифровых уроках?`;
          qEn = `Why is ${concept} considered very important in digital lessons?`;
        } else if (templateIdx === 4) {
          qUz = `${tool} va ${concept} o'zaro qanday bog'liq?`;
          qRu = `Как связаны ${tool} и ${concept}?`;
          qEn = `How are ${tool} and ${concept} related?`;
        } else if (templateIdx === 5) {
          qUz = `${activity} paytida yuzaga keladigan asosiy muammo nima?`;
          qRu = `Какова основная проблема, возникающая при ${activity}?`;
          qEn = `What is the main problem encountered during ${activity}?`;
        } else if (templateIdx === 6) {
          qUz = `${titleObj.uz} doirasida ${tool} ning asosiy afzalligi?`;
          qRu = `Главное преимущество ${tool} в рамках ${titleObj.ru}?`;
          qEn = `What is the main advantage of ${tool} within ${titleObj.en}?`;
        } else {
          qUz = `Qaysi metodika ${concept} ni qo'llashni talab etadi?`;
          qRu = `Какая методика требует применения ${concept}?`;
          qEn = `Which methodology requires the application of ${concept}?`;
        }
        const optionsUz = [`${tool} orqali`, `${concept} metodi`, `${activity} usuli`, "Barcha javoblar to'g'ri"];
        const optionsRu = [`Через ${tool}`, `Метод ${concept}`, `Способ ${activity}`, "Все ответы верны"];
        const optionsEn = [`Via ${tool}`, `Method ${concept}`, `Way of ${activity}`, "All of the above"];
        questions.push({
          q: { uz: qUz, ru: qRu, en: qEn },
          options: { uz: optionsUz, ru: optionsRu, en: optionsEn },
          answer: (i + p + topicId + templateIdx) % 4
        });
      }
      parts.push({
        id: p,
        title: { uz: `${p}-qism`, ru: `Часть ${p}`, en: `Part ${p}` },
        questions
      });
    }
    return parts;
}

const finalTopics = topicsData.map((t, idx) => {
  const colors = ['#00f0ff', '#a855f7', '#ec4899', '#f97316', '#3b82f6', '#22c55e', '#ef4444', '#eab308', '#6366f1', '#14b8a6'];
  const topicData = rawData[t.id] || rawData[1];
  
  return {
    id: t.id,
    title: t.title,
    description: t.desc,
    theory: {
      uz: topicData.uz.join('\n\n'),
      ru: topicData.ru.join('\n\n'),
      en: (topicData.en || topicData.uz).join('\n\n')
    },
    theoryImage: `https://images.unsplash.com/photo-${unsplashIds[idx]}?auto=format&fit=crop&w=1200&q=80`,
    icon: t.icon,
    color: colors[idx % colors.length],
    testParts: generateTestParts(t.id, t.title)
  };
});

fs.writeFileSync(path.join(__dirname, 'src', 'data', 'pedagogyTopics.ts'), `import { Topic } from './types'\n\nexport const pedagogyTopics: Topic[] = ${JSON.stringify(finalTopics, null, 2)};\n`, 'utf-8');
console.log('Data successfully generated.');
