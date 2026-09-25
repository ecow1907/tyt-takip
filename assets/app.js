/* =====================================================
   YKS TAKİP SİSTEMİ - ORTAK JAVASCRIPT DOSYASI
   ===================================================== */


/* =====================================================
   SAYFA KORUMA SİSTEMİ
   ===================================================== */

const PUBLIC_PAGES = [
  "",
  "index.html",
  "register.html"
];

function getCurrentPage() {
  let page = window.location.pathname
    .split("/")
    .pop()
    .toLowerCase();

  // Ana dizinde açılış yapılırsa index.html kabul edilir
  if (page === "") {
    page = "index.html";
  }

  return page;
}

function checkRegistration() {
  const currentPage = getCurrentPage();

  // Kayıt gerektirmeyen sayfalarda kontrol yapma
  if (PUBLIC_PAGES.includes(currentPage)) {
    return;
  }

  const registeredUser = localStorage.getItem("yks_user");

  // Kullanıcı kayıt olmadıysa index.html'e gönder
  if (!registeredUser) {
    window.location.replace("index.html");
  }
}


/* =====================================================
   SAYFA YÜKLENDİĞİNDE ÇALIŞACAK FONKSİYONLAR
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  checkRegistration();
  updateSidebarLinks();
  updateDashboardDate();

  // YENİ EKLENEN ÖZELLİKLER
  applySavedTheme();
  updateUserInfoAndAvatar();
  initAIChatbot();
  initPremiumVideos();
});


/* =====================================================
   MENÜ LİNKLERİ
   ===================================================== */

function updateSidebarLinks() {
  const currentPage = getCurrentPage();

  document.querySelectorAll(".nav a").forEach(link => {
    let linkPage = link.getAttribute("href");

    if (!linkPage) return;

    // Parametreleri ve # işaretlerini temizle
    linkPage = linkPage
      .split("/")
      .pop()
      .split("?")[0]
      .split("#")[0]
      .toLowerCase();

    // Önceki active sınıfını kaldır
    link.classList.remove("active");

    // Bulunduğumuz sayfayı aktif yap
    if (linkPage === currentPage) {
      link.classList.add("active");
    }
  });
}


/* =====================================================
   TARİH GÜNCELLEME
   ===================================================== */

function updateDashboardDate() {
  const dateElements = document.querySelectorAll(
    "[data-current-date]"
  );

  const today = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  dateElements.forEach(element => {
    element.textContent = today;
  });
}


/* =====================================================
   KULLANICI ADI & DİNAMİK BAŞ HARF AVATARI
   ===================================================== */

function getUserInitials(name) {
  if (!name) return "YKS";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return "YKS";
}

function updateUserInfoAndAvatar() {
  let userName = "Kullanıcı";
  
  // Öncelik: yks_user içindeki fullName / name bilgisi
  const storedUser = localStorage.getItem("yks_user");
  const storedProfile = getStorage("yks_profile", null);

  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.fullName) {
        userName = parsed.fullName;
      } else if (parsed.name) {
        userName = parsed.name;
      } else if (typeof storedUser === "string" && storedUser.length < 30) {
        userName = storedUser;
      }
    } catch (e) {
      if (typeof storedUser === "string" && storedUser.length < 30) {
        userName = storedUser;
      }
    }
  } else if (storedProfile && storedProfile.fullName) {
    userName = storedProfile.fullName;
  }

  const initials = getUserInitials(userName);

  // Sayfadaki tüm kullanıcı adı alanlarını güncelle ([data-name] ve [data-user-name])
  document.querySelectorAll("[data-name], [data-user-name]").forEach(el => {
    el.textContent = userName;
  });

  // Sayfadaki tüm avatar alanlarını güncelle ([data-avatar], [data-user-avatar], .user-avatar, .avatar)
  document.querySelectorAll("[data-avatar], [data-user-avatar], .user-avatar, .user-chip .avatar").forEach(el => {
    el.textContent = initials;
  });
}


/* =====================================================
   KULLANICIYA ÖZEL TEMA SEÇİMİ (LIGHT / DARK / CUSTOM)
   ===================================================== */

function setTheme(themeName) {
  document.documentElement.setAttribute("data-theme", themeName);
  localStorage.setItem("yks_theme", themeName);
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("yks_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  const themeSelect = document.getElementById("themeSelector");
  if (themeSelect) {
    themeSelect.value = savedTheme;
  }
}


/* =====================================================
   YKS AI CHATBOT MODÜLÜ
   ===================================================== */

function initAIChatbot() {
  // Kayıt ve giriş sayfalarında chatbot çalıştırma
  if (PUBLIC_PAGES.includes(getCurrentPage())) return;

  if (document.getElementById("yksChatbotWidget")) return;

  const botContainer = document.createElement("div");
  botContainer.id = "yksChatbotWidget";
  botContainer.className = "chatbot-widget";
  botContainer.innerHTML = `
    <button id="chatbotToggleBtn" class="chatbot-toggle-btn" title="YKS Asistanı">
      💬
    </button>
    <div id="chatbotBox" class="chatbot-box hidden">
      <div class="chatbot-header">
        <span>🤖 YKS Çalışma Koçu</span>
        <button id="chatbotCloseBtn" class="chatbot-close-btn">&times;</button>
      </div>
      <div id="chatbotMessages" class="chatbot-messages">
        <div class="chat-msg bot">Merhaba! Deneme ve çalışma kayıtlarına göre sana uygulanabilir öneriler sunabilirim. İstersen “Bu hafta neye odaklanmalıyım?” diye sor.</div>
      </div>
      <div class="chatbot-input-area">
        <input type="text" id="chatbotInput" placeholder="Örn: Matematikte nasıl ilerleyeyim?" autocomplete="off" />
        <button id="chatbotSendBtn">Gönder</button>
      </div>
    </div>
  `;
  document.body.appendChild(botContainer);

  const toggleBtn = document.getElementById("chatbotToggleBtn");
  const closeBtn = document.getElementById("chatbotCloseBtn");
  const box = document.getElementById("chatbotBox");
  const sendBtn = document.getElementById("chatbotSendBtn");
  const input = document.getElementById("chatbotInput");

  toggleBtn.addEventListener("click", () => box.classList.toggle("hidden"));
  closeBtn.addEventListener("click", () => box.classList.add("hidden"));
  sendBtn.addEventListener("click", handleChatSend);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleChatSend();
  });
}

let recentCoachReplies = [];
let lastCoachSubject = "";

function handleChatSend() {
  const input = document.getElementById("chatbotInput");
  const messages = document.getElementById("chatbotMessages");
  const text = input.value.trim();

  if (!text) return;

  // Kullanıcı mesajı ekle
  const userDiv = document.createElement("div");
  userDiv.className = "chat-msg user";
  userDiv.textContent = text;
  messages.appendChild(userDiv);

  input.value = "";
  messages.scrollTop = messages.scrollHeight;

  // Kısa bir düşünme aralığı, yanıtın sohbet içinde doğal görünmesini sağlar.
  setTimeout(() => {
    const botDiv = document.createElement("div");
    botDiv.className = "chat-msg bot";
    botDiv.textContent = getBotResponse(text);
    messages.appendChild(botDiv);
    messages.scrollTop = messages.scrollHeight;
  }, 500);
}

function getBotResponse(query) {
  const q = normalizeCoachText(query);
  const context = getCoachContext();
  const subjects = [
    ["matematik", ["matematik", "geometri"]],
    ["Türkçe", ["türkçe", "paragraf"]],
    ["Fizik", ["fizik"]], ["Kimya", ["kimya"]], ["Biyoloji", ["biyoloji"]],
    ["Tarih", ["tarih"]], ["Coğrafya", ["coğrafya"]], ["Felsefe", ["felsefe"]],
    ["Edebiyat", ["edebiyat"]]
  ];
  const mentioned = subjects.find(([, words]) => words.some(word => q.includes(normalizeCoachText(word))));
  const isPlan = /program|plan|hafta|bugun|bugün|nereden|nasil|nasıl|neye odak|calis|çalış/.test(q);
  const isMotivation = /motiv|yorgun|istek|kaygi|kaygı|stres|bunald|bunal/.test(q);
  const asksForMore = /baska|başka|farkli|farklı|alternatif|devam|daha fazla|bir tane daha/.test(q);
  const name = context.user.fullName || context.user.name || "";
  const greeting = name ? `${name.split(" ")[0]}, ` : "";

  if (asksForMore) {
    const subject = context.subjects.find(item => normalizeCoachText(item.name).includes(normalizeCoachText(lastCoachSubject))
      || normalizeCoachText(lastCoachSubject).includes(normalizeCoachText(item.name)));
    const subjectName = subject ? subject.name : lastCoachSubject;
    if (subjectName) return chooseCoachReply([
      `${greeting}${subjectName} için farklı bir yöntem: çözüm videosunu açmadan önce soruyu 8 dakika kendin dene. Takıldığın adımı işaretle, o kısmı öğren ve soruyu baştan çöz.`,
      `${greeting}${subjectName} çalışmasında süreli mini tur dene: 12 soruya 20 dakika ayır. Yanlışları konu ve dikkat hatası diye ayır; yarın en sık çıkan başlığa dön.`,
      `${greeting}${subjectName} için aktif hatırlama kullan: konuyu kapatıp bildiklerini kâğıda yaz, eksikleri kontrol et ve ardından benzer 8 soru çöz.`
    ]);
    return chooseCoachReply([
      `${greeting}başka bir yaklaşım olarak bugünkü çalışmayı kısa bir ölçümle başlat: 15 dakika test çöz, yanlışların nedenini yaz ve en sık çıkan konuya odaklan.`,
      `${greeting}alternatif olarak programındaki tek bir görevi seçip 25 dakikalık odak oturumu yap. Bitince ne kadarını tamamladığını kaydet; sonraki adımı buna göre seçelim.`,
      `${greeting}bu kez çalışma şeklini değiştir: önce bildiklerini not et, sonra eksik konuyu kısaca tekrar et ve 5 soruyla kendini kontrol et.`
    ]);
  }
  if (mentioned) lastCoachSubject = mentioned[0];

  if (/premium|uyelik|üyelik|ozel ders|özel ders/.test(q)) {
    return chooseCoachReply([
      "Premium içeriklerin kapsamını Premium sayfasında görebilirsin. İstersen burada çalışma planını ve ders analizini de hazırlayabilirim.",
      "Premium üyelik detayları Premium sayfasında yer alıyor. Ders çalışmanla ilgiliysen son denemelerine göre öncelik çıkarabilirim.",
      "Üyelik özelliklerini Premium bölümünden inceleyebilirsin. Hangi derste desteğe ihtiyacın varsa yaz; kayıtlarına göre bir sonraki adımı önereyim."
    ]);
  }
  if (/deneme|analiz|yanlis|yanlış|bos|boş|net/.test(q)) {
    if (!context.examCount && !context.testCount) return chooseCoachReply([
      "Henüz deneme veya günlük test kaydın yok. İlk sonucu eklediğinde hangi derslere öncelik vermen gerektiğini netlerine göre çıkarabilirim.",
      "Ders bazlı yorum yapabilmem için önce Denemelerim ya da Günlük Test bölümüne bir sonuç kaydet. Sonrasında güçlü ve geliştirilmesi gereken alanları ayırabilirim.",
      "Şu an değerlendirecek sınav verisi bulunmuyor. Bir deneme sonucu ekle; yanlış, boş ve net dağılımına bakarak sana hedefli bir çalışma önerisi hazırlayayım."
    ]);
    const weak = context.subjects.slice(0, 3).map(s => `${s.name} (${s.net.toFixed(1)} net)`).join(", ");
    const summary = weak || "henüz ders bazında yeterli veri yok";
    return chooseCoachReply([
      `${greeting}sonuçlarında öncelik verebileceğin dersler ${summary}. Sonraki çalışmanda en sık yanlış yaptığın konudan 15 soru seç, çözümünü incele ve ertesi gün benzer 5 soruyla tekrar dene. ${context.examCount} deneme ve ${context.testCount} test kaydını dikkate aldım.`,
      `${greeting}kayıtlarına göre çalışma payı en çok ${summary} için görünüyor. Deneme analizinde yanlışları konu eksiği, dikkat hatası ve süre sorunu diye ayır; ilk sıradaki gruba göre bir oturum planla.`,
      `${greeting}şu an en çok geliştirme alanı ${summary}. Bir sonraki denemeyi beklemeden bu derslerden birinde kısa tekrar yapıp 15–20 soru çöz; yanlışlarını iki gün sonra yeniden çözerek ilerlemeyi kontrol et.`
    ]);
  }
  if (isMotivation) {
    return chooseCoachReply([
      `${greeting}bugün çıtayı ulaşılabilir tutalım: 20 dakika çalış, 5 dakika ara ver ve tek bir küçük görevi bitir. Başlangıç için en kolay gelen konudan 10 soru seç.`,
      `${greeting}zorlandığın günlerde bütün programı tamamlamaya çalışma. Bir odak oturumu yap, ardından yalnızca yanlışlarını nedenlerine göre işaretle; bugünün hedefi bu kadar olsun.`,
      `${greeting}enerjin düşükse 10 dakikalık başlangıç koy: masayı hazırla, tek konu aç ve 5 soru çöz. Devam etmek istersen sürdürürsün; istemezsen de küçük hedefini tamamlamış olursun.`
    ]);
  }
  if (mentioned) {
    const subjectName = mentioned[0];
    const data = context.subjects.find(s => normalizeCoachText(s.name).includes(normalizeCoachText(subjectName)));
    if (data) {
      return chooseCoachReply([
        `${greeting}${data.name} sonuçların ${data.net.toFixed(1)} net ortalamasında (${data.samples} kayıt). Bu hafta iki hata konusunu seç; birini tekrar edip 15 soru çöz, ertesi gün yanlışları çözüme bakmadan yeniden dene.`,
        `${greeting}${data.name} için elindeki ${data.samples} kayıt ortalama ${data.net.toFixed(1)} net gösteriyor. Bir sonraki oturumda konu anlatımını kısa tutup soru çözümüne geç; takıldığın soruları ayrı listele ve 48 saat içinde tekrar çöz.`,
        `${greeting}${data.name} dersinde mevcut ortalaman ${data.net.toFixed(1)} net. Önce son testteki boş ve yanlışları konu başlıklarına ayır; en sık tekrarlanan başlıktan 20 dakikalık tekrar ve 10 soruluk kontrol testi yap.`
      ]);
    }
    return chooseCoachReply([
      `${greeting}${subjectName} için henüz sonuç kaydın görünmüyor. Başlangıç olarak 20 dakika konu tekrarı, 15 soru ve ardından 10 dakika yanlış analizi yap; sonucu Günlük Test'e kaydet.`,
      `${greeting}${subjectName} alanında kişisel seviyeni ölçebileceğim veri yok. Bugün kısa bir tarama testi çöz; yanlış çıkan başlıkları kaydedersen sonraki öneriyi o konulara göre kurabilirim.`,
      `${greeting}${subjectName} çalışmasına küçük bir ölçümle başlayalım: bildiğin bir konudan 10 soru çöz, süreyi ve yanlışlarını not et. Sonucu sisteme eklediğinde planı seviyene göre daraltırım.`
    ]);
  }
  if (isPlan) return buildWeeklyCoachPlan(context, greeting);
  if (/selam|merhaba|hey/.test(q)) return chooseCoachReply([
    `${greeting}hoş geldin. Bugün son deneme sonuçlarını mı değerlendirelim, yoksa derslerine göre çalışma planı mı çıkaralım?`,
    `${greeting}merhaba. İstersen önce en çok zorlandığın dersi bulalım; ders adını yazman yeterli.`,
    `${greeting}iyi geldin. Hedefin ya da aklındaki ders ne? Kısa ve uygulanabilir bir sonraki adım belirleyelim.`
  ]);
  return chooseCoachReply([
    `${greeting}sana kayıtlarına göre yardımcı olabilirim. Şu anda ${context.examCount} deneme, ${context.testCount} günlük test ve ${context.pendingTasks} açık program görevi görünüyor. Hangi ders ya da hedef üzerine konuşalım?`,
    `${greeting}başlamak için bir ders adı, son deneme sonucu veya çalışma hedefini yaz. Mevcut kayıtlardan öncelik belirleyip uygulanabilir adımlara çevireyim.`,
    `${greeting}sonuçlarını yorumlayabilir, bir ders için çalışma adımları çıkarabilir ya da haftalık plan hazırlayabilirim. Hangisi şu an daha işine yarar?`
  ]);
}

function chooseCoachReply(options) {
  const available = options.filter(reply => !recentCoachReplies.includes(reply));
  const pool = available.length ? available : options;
  const reply = pool[Math.floor(Math.random() * pool.length)];
  recentCoachReplies = [reply, ...recentCoachReplies].slice(0, 5);
  return reply;
}

function normalizeCoachText(value) {
  return String(value || "").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getCoachContext() {
  const read = (key) => {
    try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; }
    catch (_) { return []; }
  };
  let user = {};
  try {
    const parsedUser = JSON.parse(localStorage.getItem("yks_user") || "{}");
    if (parsedUser && typeof parsedUser === "object") user = parsedUser;
  } catch (_) { }
  const exams = read("yks_exams");
  const tests = read("yks_daily_tests");
  const tasks = read("yks_tasks");
  const examMax = { "Türkçe": 40, "Matematik": 40, "AYT Matematik": 40,
    "Fen Bilimleri": 20, "Sosyal Bilimler": 20, "AYT Fizik": 14,
    "AYT Kimya": 13, "AYT Biyoloji": 13, "Edebiyat - Sosyal 1": 40, "Sosyal 2": 40 };
  const totals = new Map();
  const addResult = (name, net, maximum) => {
    if (!name || !Number.isFinite(Number(net))) return;
    const key = String(name).trim();
    const item = totals.get(key) || { name: key, net: 0, ratio: 0, ratioSamples: 0, samples: 0 };
    item.net += Number(net); item.samples += 1;
    if (Number(maximum) > 0) { item.ratio += Number(net) / Number(maximum); item.ratioSamples += 1; }
    totals.set(key, item);
  };
  exams.forEach(exam => (exam.results || []).forEach(result => addResult(result.subject, result.net, examMax[result.subject])));
  tests.forEach(test => addResult(test.subject, test.net, test.questions));
  const subjects = [...totals.values()].map(item => ({ ...item, net: item.net / item.samples,
    ratio: item.ratioSamples ? item.ratio / item.ratioSamples : 0.5 }))
    .sort((a, b) => a.ratio - b.ratio);
  return { user, exams, tests, subjects, examCount: exams.length, testCount: tests.length,
    pendingTasks: tasks.filter(task => !task.completed).length };
}

function buildWeeklyCoachPlan(context, greeting = "") {
  const weakest = context.subjects.slice(0, 2);
  const weeklyHours = Number(context.user.targetWeeklyHours) || 0;
  const dailyMinutes = weeklyHours ? Math.max(30, Math.min(150, Math.round(weeklyHours * 60 / 6))) : 60;
  const focus = weakest.length ? weakest.map(item => item.name) : [context.user.target ? `${context.user.target} alanı` : "öncelikli dersin", "deneme analizi"];
  const profileLine = context.user.targetUniv ? ` Hedefin ${context.user.targetUniv} olduğu için planı sürdürülebilir tutalım.` : "";
  const evidence = weakest.length ? `Son kayıtlarında öncelik ${weakest.map(item => `${item.name} (${item.net.toFixed(1)} net)`).join(" ve ")}.` : "Ders bazında sonuç kaydı olmadığı için planı dengeli başlatıyorum.";
  const routine = chooseCoachReply([
    `• 1. gün: ${focus[0]} konu tekrarı ve 20 soru\n• 2. gün: ${focus[1]} mini test, yanlışların konu listesi\n• 3. gün: ${focus[0]} yanlışlarından 15 benzer soru\n• 4. gün: ${focus[1]} eksik konuya kısa dönüş\n• 5. gün: İki dersten karışık soru\n• 6. gün: Deneme ve sonuç analizi\n• 7. gün: Dinlenme, gelecek haftanın tek önceliğini seç`,
    `• 1. gün: ${focus[1]} temel konu ve 15 soru\n• 2. gün: ${focus[0]} süre tutarak 20 soru\n• 3. gün: İlk iki günden kalan yanlışları yeniden çöz\n• 4. gün: ${focus[1]} kısa tarama testi\n• 5. gün: ${focus[0]} eksik konu tekrarı\n• 6. gün: Branş denemesi ve hata sınıflandırması\n• 7. gün: Dinlenme veya hafif tekrar`,
    `• 1. gün: ${focus[0]} için 25 dakika konu, 15 soru\n• 2. gün: ${focus[1]} için 25 dakika konu, 15 soru\n• 3. gün: Önceki çalışmaların yanlışlarını çözüme bakmadan dene\n• 4. gün: ${focus[0]} mini deneme\n• 5. gün: ${focus[1]} yanlışlarına göre hedefli tekrar\n• 6. gün: TYT/AYT denemesi; sonucu sisteme ekle\n• 7. gün: Dinlen ve net değişimini önceki haftayla karşılaştır`
  ]);
  lastCoachSubject = focus[0];
  return chooseCoachReply([
    `${greeting}${evidence}${profileLine}\n\nGünde yaklaşık ${dailyMinutes} dakika ayırarak şöyle ilerleyebilirsin:\n${routine}\n\nHer oturumda 25–40 dakika çalışıp kısa ara ver. Bir gün aksarsa görevleri üst üste yığma; kaldığın sıradan devam et.`,
    `${greeting}planı mevcut kayıtlarından çıkardım. ${evidence}${profileLine}\n\nBu hafta için günlük süre: yaklaşık ${dailyMinutes} dakika.\n${routine}\n\nDeneme gününün ardından sonucu ekle; sonraki haftanın önceliğini değişime göre belirle.`,
    `${greeting}${evidence}${profileLine}\n\nÖnümüzdeki 7 günü bu şekilde kullan:\n${routine}\n\nGünlük hedefi ${dailyMinutes} dakika civarında tut. Enerjin düşük olduğunda soru sayısını yarıya indir ama kısa yanlış analizini koru.`
  ]);
}
/* =====================================================
   PREMİUM ÖZEL DERS VİDEOLARI KONTROLÜ
   ===================================================== */

function isUserPremium() {
  const userStatus = getStorage("yks_user_premium", false);
  return Boolean(userStatus);
}

function initPremiumVideos() {
  const premiumVideoElements = document.querySelectorAll(".premium-video-card, [data-premium='true']");

  premiumVideoElements.forEach(card => {
    if (!isUserPremium()) {
      card.classList.add("locked");
      if (!card.querySelector(".lock-badge")) {
        const badge = document.createElement("div");
        badge.className = "lock-badge";
        badge.innerHTML = "🔒 Premium Video";
        card.appendChild(badge);
      }
    } else {
      card.classList.remove("locked");
    }

    card.addEventListener("click", (e) => {
      if (!isUserPremium()) {
        e.preventDefault();
        alert("Bu özel ders videosunu izlemek için Premium üye olmalısın!");
      }
    });
  });
}


/* =====================================================
   LOCAL STORAGE FONKSİYONLARI
   ===================================================== */

function getStorage(key, defaultValue = []) {
  try {
    return JSON.parse(
      localStorage.getItem(key) ||
      JSON.stringify(defaultValue)
    );
  } catch (error) {
    console.error(
      "LocalStorage okuma hatası:",
      error
    );

    return defaultValue;
  }
}


function setStorage(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

    return true;
  } catch (error) {
    console.error(
      "LocalStorage kayıt hatası:",
      error
    );

    return false;
  }
}


function removeStorage(key) {
  localStorage.removeItem(key);
}


/* =====================================================
   TARİH FONKSİYONLARI
   ===================================================== */

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("tr-TR");
}


function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function sortByDateDescending(
  items,
  dateKey = "date"
) {
  return [...items].sort((a, b) => {
    return (
      new Date(b[dateKey]) -
      new Date(a[dateKey])
    );
  });
}


/* =====================================================
   NET VE YÜZDE HESAPLAMA
   ===================================================== */

function calculateNet(correct, wrong) {
  return (
    Number(correct) -
    Number(wrong) / 4
  );
}


function calculatePercentage(value, total) {
  if (!total || total <= 0) {
    return 0;
  }

  return Math.round(
    (value / total) * 100
  );
}


/* =====================================================
   GÜVENLİ HTML
   ===================================================== */

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =====================================================
   MESAJ GÖSTERME
   ===================================================== */

function showMessage(
  elementId,
  message,
  type = "info"
) {
  const element = document.getElementById(
    elementId
  );

  if (!element) return;

  element.textContent = message;

  if (type === "success") {
    element.style.color = "#15803d";
  } else if (type === "error") {
    element.style.color = "#dc2626";
  } else {
    element.style.color = "#6b7280";
  }
}


/* =====================================================
   ONAY PENCERESİ
   ===================================================== */

function confirmDelete(
  message = "Bu kaydı silmek istediğine emin misin?"
) {
  return window.confirm(message);
}


/* =====================================================
   ÇIKIŞ YAPMA
   ===================================================== */

function logoutUser() {
  const confirmLogout = window.confirm(
    "Çıkış yapmak istediğine emin misin?"
  );

  if (!confirmLogout) {
    return;
  }

  // Kullanıcı kaydını ve profilini sil
  localStorage.removeItem("yks_user");
  localStorage.removeItem("yks_profile");

  // Giriş sayfasına yönlendir
  window.location.replace("index.html");
}
