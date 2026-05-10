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

function generateTheory(topicId, titleObj) {
  const uzText = `Bu mavzu "${titleObj.uz}" deb nomlanadi. Raqamli pedagogika va ta'lim texnologiyalari doirasida bu juda muhim hisoblanadi. Tadqiqotlar shuni ko'rsatadiki, bu sohani mukammal egallagan bo'lajak pedagoglar o'quvchilarning diqqatini 40% ga ko'proq jalb eta oladilar. `.repeat(15);
  const ruText = `Эта тема называется "${titleObj.ru}". В рамках цифровой педагогики и образовательных технологий это очень важно. Исследования показывают, что будущие педагоги, в совершенстве овладевшие этой сферой, способны привлекать внимание учащихся на 40% больше. `.repeat(15);
  const enText = `This topic is called "${titleObj.en}". Within the framework of digital pedagogy and educational technologies, this is very important. Studies show that future teachers who perfectly master this field can attract students' attention by 40% more. `.repeat(15);
  return { uz: uzText, ru: ruText, en: enText };
}

function generatePractice(topicId, titleObj) {
  const d = {
    1: {
      action: {uz: "Maktab axborot muhiti loyihasi", ru: "Проект информ. среды школы", en: "School IT environment project"},
      cond: {uz: "Kamida 3 ta xavfsizlik protokoli yozilishi shart", ru: "Минимум 3 протокола безопасности", en: "At least 3 security protocols"},
      p1: {uz: ["1-Bosqich: Audit (Tahlil)", "Sizning maktabingizdagi eng katta raqamli kamchilik nima va uni qanday yechish mumkin? (Muammoni yozing)"], ru: ["Этап 1: Аудит", "В чем главный цифровой недостаток школы и как его решить?"], en: ["Phase 1: Audit", "What is the biggest digital flaw in the school and how to solve it?"]},
      p2: {uz: ["2-Bosqich: Loyihalash", "XMind orqali platformalar arxitekturasini chizing. O'qituvchi va o'quvchi rollari qanday farqlanadi?"], ru: ["Этап 2: Проектирование", "Нарисуйте архитектуру через XMind. Как отличаются роли?"], en: ["Phase 2: Designing", "Draw the architecture using XMind. How do roles differ?"]},
      p3: {uz: ["3-Bosqich: Integratsiya", "Tanlangan turli raqamli platformalar bir-biri bilan qanday ma'lumot (baho, ism) almashadi?"], ru: ["Этап 3: Интеграция", "Как выбранные платформы обмениваются данными?"], en: ["Phase 3: Integration", "How do the selected platforms exchange data?"]},
      p4: {uz: ["4-Bosqich: Himoya", "Yaratilgan raqamli maktab konsepsiyasini iqtisodiy va pedagogik tomondan asoslab bering."], ru: ["Этап 4: Защита", "Обоснуйте концепцию экономически и педагогически."], en: ["Phase 4: Defense", "Justify the concept economically and pedagogically."]},
      tools: ["XMind", "Word"]
    },
    2: {
      action: {uz: "LMS da masofaviy kurs yaratish", ru: "Создание дистанционного курса в LMS", en: "Creating a distance course in LMS"},
      cond: {uz: "Kurs ichida 2 modul, glossariy va yakuniy test bo'lishi kerak", ru: "Курс должен содержать 2 модуля, глоссарий и итоговый тест", en: "The course must contain 2 modules, a glossary, and a final test"},
      p1: {uz: ["1-Bosqich: Sillabus (Dastur)", "O'quv kursingiz qancha vaqt davom etadi va u talabaga qanday aniq ko'nikma beradi?"], ru: ["Этап 1: Силлабус", "Сколько длится курс и какой навык он дает?"], en: ["Phase 1: Syllabus", "How long is the course and what skill does it provide?"]},
      p2: {uz: ["2-Bosqich: Moodle Sozlamalari", "Tizimda yangi kurs ochib, o'quvchilarni ro'yxatdan o'tish (Enrollment) qoidalarini qanday o'rnatasiz?"], ru: ["Этап 2: Настройки Moodle", "Как настроите правила регистрации студентов?"], en: ["Phase 2: Moodle Settings", "How will you set student enrollment rules?"]},
      p3: {uz: ["3-Bosqich: Kontent yuklash", "Video, matn va baholash rubrikalarini modullarga ketma-ketlikda joylashtiring."], ru: ["Этап 3: Загрузка контента", "Загрузите видео, текст и рубрики оценки в модули."], en: ["Phase 3: Content Upload", "Upload video, text, and rubrics into modules."]},
      p4: {uz: ["4-Bosqich: Tekshiruv", "Talaba (Student) rolida tizimga kiring, kursni yeching. Kamchiliklar bormi?"], ru: ["Этап 4: Проверка", "Войдите как студент и протестируйте курс."], en: ["Phase 4: Verification", "Log in as a student and test the course."]},
      tools: ["Moodle", "Canvas LMS"]
    },
    3: {
      action: {uz: "Interaktiv video-dars yaratish", ru: "Создание интерактивного видеоурока", en: "Creating an interactive video lesson"},
      cond: {uz: "Videoda o'quvchi to'xtab javob beradigan 3 ta savol bo'lishi shart", ru: "В видео должно быть 3 вопроса для ответа учащихся", en: "The video must have 3 questions for students to answer"},
      p1: {uz: ["1-Bosqich: Ssenariy (Skript)", "Qaysi qiyin mavzuni videoda oson tushuntirmoqchisiz? Ssenariyning asosiy g'oyasi nima?"], ru: ["Этап 1: Сценарий", "Какую сложную тему объясните? В чем главная идея?"], en: ["Phase 1: Script", "Which hard topic will you explain? What's the main idea?"]},
      p2: {uz: ["2-Bosqich: Yig'ish (Muntaj)", "Canva yoki Prezi orqali ovoz va vizual slaydlarni bitta MP4 formatda yig'ing."], ru: ["Этап 2: Монтаж", "Соберите звук и слайды в один MP4 через Canva/Prezi."], en: ["Phase 2: Assembly", "Assemble audio and slides into one MP4 via Canva/Prezi."]},
      p3: {uz: ["3-Bosqich: Interaktivlik qo'shish", "Edpuzzle orqali videoning eng muhim joylarida qanday savollar qo'shdingiz?"], ru: ["Этап 3: Интерактивность", "Какие вопросы вы добавили в Edpuzzle?"], en: ["Phase 3: Interactivity", "What questions did you add in Edpuzzle?"]},
      p4: {uz: ["4-Bosqich: Analitika tahlili", "O'quvchilar videoni ko'rgach, kim qaysi joyda xato qilganini statistika orqali ko'rsating."], ru: ["Этап 4: Анализ", "Покажите через статистику, где ошиблись ученики."], en: ["Phase 4: Analysis", "Show via stats where students made mistakes."]},
      tools: ["Canva", "Edpuzzle", "Prezi"]
    },
    4: {
      action: {uz: "AI yordamida o'quv materiallari generatsiyasi", ru: "Генерация учебных материалов с помощью ИИ", en: "Generation of educational materials using AI"},
      cond: {uz: "Promplar ketma-ketligi (kamida 5 ta prompt) PDF da saqlanishi kerak", ru: "Последовательность из 5 промптов должна быть сохранена в PDF", en: "A sequence of 5 prompts must be saved in PDF"},
      p1: {uz: ["1-Bosqich: Prompt muhandisligi", "ChatGPT ga mukammal dars ishlanmasi yozdirish uchun qanday 'Super Prompt' tuzdingiz?"], ru: ["Этап 1: Промпт инжиниринг", "Какой 'супер-промпт' вы составили для ChatGPT?"], en: ["Phase 1: Prompt Engineering", "What 'Super Prompt' did you create for ChatGPT?"]},
      p2: {uz: ["2-Bosqich: Vizual AI integratsiyasi", "Darsingiz uchun Midjourney / DALL-E da rasmlar chizdirish uchun qanday so'zlardan foydalandingiz?"], ru: ["Этап 2: Визуальный ИИ", "Какие слова использовали для генерации картинок?"], en: ["Phase 2: Visual AI", "What words did you use to generate images?"]},
      p3: {uz: ["3-Bosqich: Fakt-cheking", "AI yozgan matnlarda gallyusinatsiya (yolg'on axborot) yo'qligini qanday isbotlaysiz?"], ru: ["Этап 3: Факт-чекинг", "Как докажете отсутствие галлюцинаций в тексте ИИ?"], en: ["Phase 3: Fact-checking", "How do you prove no hallucinations in AI text?"]},
      p4: {uz: ["4-Bosqich: Yakuniy Hujjat", "AI bilan muloqotingizni va olingan natijani chiroyli PDF portfolio shaklida taqdim eting."], ru: ["Этап 4: Портфолио", "Представьте диалог с ИИ и результат в виде PDF."], en: ["Phase 4: Portfolio", "Present the AI chat and result as a PDF."]},
      tools: ["ChatGPT", "Midjourney", "Notion"]
    },
    5: {
      action: {uz: "Aralash ta'lim (Blended) darsi loyihasi", ru: "Проект смешанного (Blended) урока", en: "Blended learning lesson project"},
      cond: {uz: "Oflayn va onlayn faoliyat o'rtasida takrorlanish bo'lmasligi shart", ru: "Офлайн и онлайн активности не должны дублироваться", en: "Offline and online activities must not duplicate"},
      p1: {uz: ["1-Bosqich: 'Uy' materialini dizayn qilish", "O'quvchilar uyda qanday nazariyalarni o'qiydilar va videolarni ko'radilar?"], ru: ["Этап 1: Дизайн дома", "Что ученики читают и смотрят дома?"], en: ["Phase 1: Home material design", "What theories and videos do students study at home?"]},
      p2: {uz: ["2-Bosqich: Sinf ichidagi amaliyot", "Nazariya uyda o'rganilgan bo'lsa, sinfdagi 45 daqiqa faqat qaysi amaliyotga sarflanadi?"], ru: ["Этап 2: Практика в классе", "На что потратите 45 минут в классе, если теория пройдена дома?"], en: ["Phase 2: In-class practice", "What practice takes the 45 mins in class if theory is done?"]},
      p3: {uz: ["3-Bosqich: Baholash rubrikasi", "Uy ishi (onlayn) va sinf ishi (oflayn) baholarini qanday qilib yagona reytingga birlashtirasiz?"], ru: ["Этап 3: Рубрика оценки", "Как объединить онлайн и офлайн оценки в один рейтинг?"], en: ["Phase 3: Evaluation Rubric", "How to merge online and offline grades into one?"]},
      p4: {uz: ["4-Bosqich: Himoya", "Loyiha bo'yicha boshqa jamoalarning tanqidlariga qanday javob qaytarasiz?"], ru: ["Этап 4: Защита", "Как ответите на критику других команд?"], en: ["Phase 4: Defense", "How will you respond to critiques from other teams?"]},
      tools: ["Edmodo", "Google Classroom", "Miro"]
    },
    6: {
      action: {uz: "Bulutli muhitda hamkorlik fayllari tizimi", ru: "Система совместных файлов в облаке", en: "Collaborative file system in the cloud"},
      cond: {uz: "Kamida 3 ta hamkorlik hujjati yaratilib, barchaga share qilinishi kerak", ru: "Минимум 3 документа созданы и расшарены", en: "At least 3 collab documents created and shared"},
      p1: {uz: ["1-Bosqich: Strukturani yaratish", "Google Drive da guruh loyihasi uchun qanday papkalar arxitekturasini tuzdingiz?"], ru: ["Этап 1: Структура", "Какую архитектуру папок создали в Google Drive?"], en: ["Phase 1: Structure", "What folder architecture did you create in Google Drive?"]},
      p2: {uz: ["2-Bosqich: Huquqlarni taqsimlash (Permissions)", "Qaysi foydalanuvchiga 'Viewer' va qaysi biriga 'Editor' huquqini berdingiz? Nimaga?"], ru: ["Этап 2: Права доступа", "Кому дали права Viewer, а кому Editor? Почему?"], en: ["Phase 2: Permissions", "Who got Viewer and who got Editor rights? Why?"]},
      p3: {uz: ["3-Bosqich: Sinxron hujjat", "Bitta Docs faylida butun jamoa bir vaqtda qanday matn (maqola) yozyapsiz?"], ru: ["Этап 3: Синхронный документ", "Какой текст пишет вся команда одновременно в одном Docs?"], en: ["Phase 3: Synchronous doc", "What text is the whole team writing simultaneously in Docs?"]},
      p4: {uz: ["4-Bosqich: Tarixni tahlil qilish", "Version History orqali faylning eski holatiga qanday qaytish mumkinligini ko'rsating."], ru: ["Этап 4: История версий", "Покажите, как вернуться к старой версии через Version History."], en: ["Phase 4: Version history", "Show how to revert to an old version via Version History."]},
      tools: ["Google Drive", "Google Docs", "Google Sheets"]
    },
    7: {
      action: {uz: "Escape Room (Qochish xonasi) o'yini loyihasi", ru: "Проект игры Escape Room (Квест-комната)", en: "Escape Room game project"},
      cond: {uz: "O'yinda ketma-ket ochiladigan 3 ta mantiqiy qulf (parol) bo'lishi shart", ru: "В игре должно быть 3 логических замка", en: "The game must have 3 logical locks"},
      p1: {uz: ["1-Bosqich: O'yin mantig'i (Maza)", "O'quvchilar xonadan qochishi uchun qaysi fanga oid savollarni yechishlari kerak?"], ru: ["Этап 1: Логика игры", "Какие вопросы по предмету должны решить ученики?"], en: ["Phase 1: Game logic", "What subject questions must students solve to escape?"]},
      p2: {uz: ["2-Bosqich: Raqamli interfeys", "Genially da xona fonini qanday qilib interaktiv qildingiz? Hotspotlar qayerda?"], ru: ["Этап 2: Цифровой интерфейс", "Как сделали фон в Genially интерактивным? Где Hotspots?"], en: ["Phase 2: Digital interface", "How did you make the Genially background interactive? Where are Hotspots?"]},
      p3: {uz: ["3-Bosqich: Parollar tizimi", "Uchinchi qulfni ochish uchun talaba qanday matematik yoki mantiqiy kodni kiritishi kerak?"], ru: ["Этап 3: Система паролей", "Какой код нужен для открытия третьего замка?"], en: ["Phase 3: Password system", "What code is needed to open the third lock?"]},
      p4: {uz: ["4-Bosqich: Jonli Musobaqa", "O'yin ssilkasi guruhga tarqatilgach, eng tez chiqqan jamoaning vaqti qancha bo'ldi?"], ru: ["Этап 4: Соревнование", "Какое время у самой быстрой команды, прошедшей квест?"], en: ["Phase 4: Competition", "What was the time of the fastest team to escape?"]},
      tools: ["Genially", "Kahoot", "Quizizz"]
    },
    8: {
      action: {uz: "Mobil mikro-ta'lim (Telegram Bot)", ru: "Мобильное микрообучение (Telegram Bot)", en: "Mobile micro-learning (Telegram Bot)"},
      cond: {uz: "Bot menyusida: Ma'ruza, Test va Natija tugmalari to'liq ishlashi kerak", ru: "В меню бота: Лекция, Тест и Результаты", en: "In bot menu: Lecture, Test, and Results must work"},
      p1: {uz: ["1-Bosqich: Bot Arxitekturasi", "Menyu ketma-ketligini qanday rejalashtirdingiz? Talaba birinchi nima ko'radi?"], ru: ["Этап 1: Архитектура", "Как спланировали меню? Что студент видит первым?"], en: ["Phase 1: Architecture", "How did you plan the menu? What does the student see first?"]},
      p2: {uz: ["2-Bosqich: BotFather va Ulanish", "Bot tokenini qanday qilib uchinchi tomon dasturiga (Manychat/Chatfuel) ulab oldingiz?"], ru: ["Этап 2: Подключение", "Как подключили токен к сторонней программе (Manychat)?"], en: ["Phase 2: Connection", "How did you connect the token to a third-party app (Manychat)?"]},
      p3: {uz: ["3-Bosqich: Bite-sized kontent yuklash", "Matn o'rniga infografika yoki kalit so'zlarni botga qanday joylashtirdingiz?"], ru: ["Этап 3: Контент", "Как разместили инфографику вместо длинного текста?"], en: ["Phase 3: Content", "How did you place infographics instead of long text?"]},
      p4: {uz: ["4-Bosqich: Analytics tahlili", "Qaysi o'quvchi botdagi qaysi tugmani ko'p bosganini analitikadan ko'rib tushuntiring."], ru: ["Этап 4: Аналитика", "Объясните по аналитике, на какую кнопку нажимали чаще всего."], en: ["Phase 4: Analytics", "Explain via analytics which button was pressed most."]},
      tools: ["Telegram Bot", "ManyChat", "Glide Apps"]
    },
    9: {
      action: {uz: "Avtomatik sertifikatlovchi test tizimi", ru: "Система тестов с автоматической выдачей сертификатов", en: "Test system with automatic certification"},
      cond: {uz: "80% dan yuqori olganlarga email orqali PDF sertifikat borishi kafolatlanishi kerak", ru: "Сдавшим выше 80% должен уходить PDF-сертификат", en: "Those above 80% must receive a PDF certificate"},
      p1: {uz: ["1-Bosqich: O'lchovchi test tuzish", "Google Forms da savollar qiyinlik darajasi qanday proporsiyada (masalan, 3 ta oson, 2 ta qiyin) taqsimlandi?"], ru: ["Этап 1: Создание теста", "В какой пропорции распределены сложные и легкие вопросы?"], en: ["Phase 1: Test Creation", "In what proportion are hard and easy questions distributed?"]},
      p2: {uz: ["2-Bosqich: Sertifikat Shablon", "Canva yordamida yaratilgan sertifikatga <<Ism_Familiya>> tegini (tag) qanday joylashtirdingiz?"], ru: ["Этап 2: Шаблон сертификата", "Как вы разместили тег <<Ism_Familiya>> в сертификате Canva?"], en: ["Phase 2: Certificate Template", "How did you place the <<Name>> tag in the Canva certificate?"]},
      p3: {uz: ["3-Bosqich: Autocrat avtomatizatsiyasi", "Forma javoblari jadvaliga (Sheets) Autocrat ulanishida qanday xatoliklar yuzaga kelishi mumkin?"], ru: ["Этап 3: Автоматизация", "Какие ошибки могут возникнуть при подключении Autocrat к Sheets?"], en: ["Phase 3: Automation", "What errors can occur when connecting Autocrat to Sheets?"]},
      p4: {uz: ["4-Bosqich: Hayotiy Sinov", "Guruhdoshlaringizga yechdiring. Ularga sertifikat kelganini ekran orqali isbotlang."], ru: ["Этап 4: Испытание", "Пусть одногруппники решат. Докажите получение сертификатов."], en: ["Phase 4: Trial", "Let classmates solve it. Prove the receipt of certificates."]},
      tools: ["Google Forms", "Autocrat", "Canva"]
    },
    10: {
      action: {uz: "AR / VR muhitida ta'lim obyekti yaratish", ru: "Создание образовательного объекта в AR / VR", en: "Creating an educational object in AR / VR"},
      cond: {uz: "AR markeri skaner qilinganda fanga oid animatsion 3D ob'ekt chiqishi shart", ru: "При сканировании AR-маркера должен появляться 3D-объект", en: "Scanning AR marker must show a 3D object"},
      p1: {uz: ["1-Bosqich: Obyektni loyihalash", "Sizning faningizdagi eng mavhum, tushuntirish qiyin bo'lgan tushuncha qaysi va unga mos 3D model nima?"], ru: ["Этап 1: Проектирование", "Какое понятие в вашем предмете самое сложное и какая 3D модель к нему подходит?"], en: ["Phase 1: Designing", "What is the hardest concept in your subject and what is its 3D model?"]},
      p2: {uz: ["2-Bosqich: 3D Animatsiya (CoSpaces)", "3D modelni virtual muhitga kiritgandan so'ng, unga qanday xatti-harakat (harakat yoki ovoz) qo'shdingiz?"], ru: ["Этап 2: 3D Анимация", "Какое действие (движение или звук) вы добавили к 3D модели?"], en: ["Phase 2: 3D Animation", "What action (movement or sound) did you add to the 3D model?"]},
      p3: {uz: ["3-Bosqich: Marker Bog'lash", "Artivive yoki Merge Cube qog'oz markerini o'z modelingiz bilan qanday bog'ladingiz?"], ru: ["Этап 3: Привязка маркера", "Как связали бумажный маркер с вашей моделью?"], en: ["Phase 3: Marker Linking", "How did you link the paper marker to your model?"]},
      p4: {uz: ["4-Bosqich: Immersiv Dars", "Talabalar telefon orqali ob'ektni ko'rganda ularning eslab qolish darajasi qanday o'zgaradi?"], ru: ["Этап 4: Иммерсивный урок", "Как изменится уровень запоминания студентов при просмотре объекта через телефон?"], en: ["Phase 4: Immersive Lesson", "How does students' retention change when viewing the object via phone?"]},
      tools: ["Artivive", "CoSpaces", "Smartfon"]
    }
  }

  const tData = d[topicId] || d[1];

  const createLangObj = (lang) => {
    const timeLimits = {1: [10, 20, 10, 20], 2: [15, 20, 15, 10], 3: [10, 25, 15, 10], 4: [15, 15, 20, 10], 5: [15, 20, 15, 10], 6: [10, 15, 20, 15], 7: [15, 25, 10, 10], 8: [15, 15, 20, 10], 9: [15, 15, 15, 15], 10: [15, 20, 15, 10]};
    const tl = timeLimits[topicId] || [15, 15, 15, 15];
    
    return {
      objective: lang === 'uz' ? `"${titleObj[lang]}" mavzusidagi ilmiy-amaliy mashg'ulot.` : lang === 'ru' ? `Научно-практическое занятие по теме "${titleObj[lang]}".` : `Scientific and practical lesson on the topic "${titleObj[lang]}".`,
      groupTask: lang === 'uz' ? `Topshiriq: ${tData.action[lang]}` : lang === 'ru' ? `Задание: ${tData.action[lang]}` : `Task: ${tData.action[lang]}`,
      conditions: [
        lang === 'uz' ? "Vaqt qat'iy chegaralangan." : lang === 'ru' ? "Время строго ограничено." : "Time is strictly limited.",
        tData.cond[lang],
        lang === 'uz' ? "Barcha jamoa a'zolari faol qatnashishi kerak." : lang === 'ru' ? "Все члены команды должны активно участвовать." : "All team members must actively participate."
      ],
      evaluationCriteria: [
        lang === 'uz' ? "Kreativlik va shartga rioya (30%)" : lang === 'ru' ? "Креативность и соблюдение условий (30%)" : "Creativity and adherence to conditions (30%)",
        lang === 'uz' ? "Raqamli vositalar mahorati (40%)" : lang === 'ru' ? "Мастерство цифровых инструментов (40%)" : "Digital tools mastery (40%)",
        lang === 'uz' ? "Taqdimot san'ati (30%)" : lang === 'ru' ? "Искусство презентации (30%)" : "Presentation skills (30%)"
      ],
      phases: [
        {
          title: tData.p1[lang][0],
          duration: `${tl[0]} min`,
          durationMinutes: tl[0],
          description: tData.p1[lang][1],
          tools: [tData.tools[0]]
        },
        {
          title: tData.p2[lang][0],
          duration: `${tl[1]} min`,
          durationMinutes: tl[1],
          description: tData.p2[lang][1],
          tools: tData.tools
        },
        {
          title: tData.p3[lang][0],
          duration: `${tl[2]} min`,
          durationMinutes: tl[2],
          description: tData.p3[lang][1],
          tools: [tData.tools[1] || tData.tools[0]]
        },
        {
          title: tData.p4[lang][0],
          duration: `${tl[3]} min`,
          durationMinutes: tl[3],
          description: tData.p4[lang][1],
          tools: ["Projector/Screen", "Microphone"]
        }
      ]
    };
  };

  return {
    uz: createLangObj('uz'),
    ru: createLangObj('ru'),
    en: createLangObj('en')
  };
}

function generateTestParts(topicId, titleObj) {
  const parts = [];
  
  for (let p = 1; p <= 6; p++) {
    const questions = [];
    const optionsUz = ["Variant 1: An'anaviy yondashuv", "Variant 2: Innovatsion raqamli yechim", "Variant 3: Faqat kitobdan o'qish", "Variant 4: Hech qaysisi"];
    const optionsRu = ["Вариант 1: Традиционный подход", "Вариант 2: Инновационное цифровое решение", "Вариант 3: Только чтение книг", "Вариант 4: Ни один из вышеперечисленных"];
    const optionsEn = ["Option 1: Traditional approach", "Option 2: Innovative digital solution", "Option 3: Reading books only", "Option 4: None of the above"];
    
    for (let i = 1; i <= 25; i++) {
      questions.push({
        q: {
          uz: `"${titleObj.uz}" mavzusi, ${p}-qism testlari doirasida ${i}-savol. Agar o'quvchi darsga qiziqmasa, qanday raqamli vositadan foydalanish eng to'g'ri bo'ladi?`,
          ru: `Вопрос ${i} (часть ${p}) в рамках темы "${titleObj.ru}". Какой цифровой инструмент лучше всего использовать, если ученику не интересен урок?`,
          en: `Question ${i} (part ${p}) within the topic "${titleObj.en}". Which digital tool is best to use if a student is not interested in the lesson?`
        },
        options: { uz: optionsUz, ru: optionsRu, en: optionsEn },
        answer: 1
      });
    }

    parts.push({
      id: p,
      title: {
        uz: `${p}-qism Testlari`,
        ru: `Тесты (Часть ${p})`,
        en: `Test Part ${p}`
      },
      questions
    });
  }
  return parts;
}

const unsplashIds = [
  '1509062522246-3755977927d7', // education
  '1516321318423-f06f85e504b3', // computer
  '1432888117246-b82839d49419', // classroom
  '1524178232363-1dc2cb065f41', // vr
  '1531482615713-2afd69097998', // learning
  '1503676260728-1c00da094a0b', // tech
  '1517245386807-bb43f82c33c4', // group
  '1522202176988-66273c2fd55f', // study
  '1454165804606-c3d57bc86b40', // working
  '1498050108023-c5249f4df085'  // modern tech
];

const finalTopics = topicsData.map((t, idx) => {
  const colors = ['#00f0ff', '#a855f7', '#ec4899', '#f97316', '#3b82f6', '#22c55e', '#ef4444', '#eab308', '#6366f1', '#14b8a6'];
  return {
    id: t.id,
    title: t.title,
    description: t.desc,
    theory: generateTheory(t.id, t.title),
    theoryImage: `https://images.unsplash.com/photo-${unsplashIds[idx]}?auto=format&fit=crop&w=1200&q=80`,
    practice: generatePractice(t.id, t.title),
    icon: t.icon,
    color: colors[idx % colors.length],
    testParts: generateTestParts(t.id, t.title)
  };
});

const fileContent = `import { Topic } from './types'\n\nexport const pedagogyTopics: Topic[] = ${JSON.stringify(finalTopics, null, 2)};\n`;

fs.writeFileSync(path.join(__dirname, 'src', 'data', 'pedagogyTopics.ts'), fileContent, 'utf-8');
console.log('Data successfully generated!');
