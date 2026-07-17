/* ═══════════════════════════════════════════════════════════════
   MOTIVATIONAL QUOTES — Daily rotating wisdom
   Sources: Bhagavad Gita, Krishna teachings, Hollywood classics,
   History's greatest minds, Marathi proverbs, Hindi wisdom
═══════════════════════════════════════════════════════════════ */
const QUOTES = [

  // ── BHAGAVAD GITA — Krishna's teachings ──────────────────────
  {
    text: "You have the right to perform your actions, but you are not entitled to the fruits of your actions.",
    textHi: "कर्म करो, फल की चिंता मत करो।",
    textMr: "कर्म कर, फळाची अपेक्षा ठेवू नकोस.",
    source: "श्री कृष्ण — भगवद्गीता", lang:"hi",
    category:"gita"
  },
  {
    text: "Rise above the deceptions of nature. Be seated in the self, Arjuna, and cease to be agitated by the pairs of opposites.",
    textHi: "हे अर्जुन, उठो! स्वयं में स्थित होओ और द्वंद्वों से मुक्त होओ।",
    textMr: "उठ अर्जुना! स्वतःमध्ये स्थिर हो आणि द्वंद्वांपासून मुक्त हो.",
    source: "श्री कृष्ण — भगवद्गीता अध्याय २", lang:"hi",
    category:"gita"
  },
  {
    text: "The soul is never born nor dies at any time. It has not come into being, does not come into being, and will not come into being.",
    textHi: "आत्मा न जन्म लेती है, न मरती है। यह शाश्वत, अजन्मा और अविनाशी है।",
    textMr: "आत्मा कधीच जन्मत नाही किंवा मरत नाही. ती शाश्वत आणि अविनाशी आहे.",
    source: "श्री कृष्ण — भगवद्गीता अध्याय २.२०", lang:"hi",
    category:"gita"
  },
  {
    text: "Let a man raise himself by his own efforts. Let him not degrade himself. For the self is the friend of the self, and the self is also the enemy of the self.",
    textHi: "अपने आप को अपने प्रयासों से ऊपर उठाओ। स्वयं ही अपना मित्र है, स्वयं ही अपना शत्रु।",
    textMr: "स्वतःला स्वतःच्या प्रयत्नांनी उंच उठव. तू स्वतःचा मित्र आहेस, स्वतःचाच शत्रू आहेस.",
    source: "श्री कृष्ण — भगवद्गीता अध्याय ६.५", lang:"mr",
    category:"gita"
  },
  {
    text: "One who is equal to friends and enemies, who is equipoised in honor and dishonor, heat and cold, happiness and distress — such a person is very dear to Me.",
    textHi: "जो मित्र और शत्रु में, मान और अपमान में, सुख और दुख में समान रहता है — वह मुझे प्रिय है।",
    textMr: "जो मित्र आणि शत्रूत, मान आणि अपमानात, सुख आणि दुःखात समान राहतो — तो मला प्रिय आहे.",
    source: "श्री कृष्ण — भगवद्गीता अध्याय १२", lang:"mr",
    category:"gita"
  },
  {
    text: "Whenever and wherever there is a decline in righteousness and a rise in unrighteousness, I manifest Myself.",
    textHi: "जब जब धर्म की हानि होती है, तब तब मैं अवतरित होता हूँ।",
    textMr: "जेव्हा जेव्हा धर्माची हानी होते, तेव्हा तेव्हा मी अवतरित होतो.",
    source: "श्री कृष्ण — भगवद्गीता अध्याय ४.७", lang:"hi",
    category:"gita"
  },
  {
    text: "A person can rise through the efforts of his own mind, or draw himself down in the same manner. Because each person is his own friend or enemy.",
    textHi: "मनुष्य अपने मन के प्रयासों से ऊपर उठ सकता है — या खुद को नीचे खींच सकता है।",
    textMr: "माणूस आपल्या मनाच्या प्रयत्नाने वर उठू शकतो किंवा खाली खेचू शकतो.",
    source: "श्री कृष्ण — भगवद्गीता अध्याय ६", lang:"mr",
    category:"gita"
  },
  {
    text: "Do not grieve for what is lost. Focus your mind on God. Then you will have no difficulties.",
    textHi: "जो चला गया उसका शोक मत करो। ईश्वर पर ध्यान केंद्रित करो।",
    textMr: "जे गेले त्याचे दुःख करू नका. ईश्वरावर मन केंद्रित करा.",
    source: "श्री कृष्ण — भगवद्गीता", lang:"hi",
    category:"gita"
  },
  {
    text: "Change is the law of the universe. You can be a millionaire or a pauper in an instant.",
    textHi: "परिवर्तन ही सृष्टि का नियम है। जो आज है, वह कल नहीं था।",
    textMr: "परिवर्तन हाच सृष्टीचा नियम आहे. जे आज आहे ते उद्या नसेल.",
    source: "श्री कृष्ण — भगवद्गीता", lang:"hi",
    category:"gita"
  },
  {
    text: "Yoga is the journey of the self, through the self, to the self.",
    textHi: "योग स्वयं की यात्रा है — स्वयं के माध्यम से, स्वयं की ओर।",
    textMr: "योग म्हणजे स्वतःच्या माध्यमातून, स्वतःकडे स्वतःची यात्रा.",
    source: "श्री कृष्ण — भगवद्गीता", lang:"hi",
    category:"gita"
  },

  // ── MARATHI WISDOM & PROVERBS ────────────────────────────────
  {
    text: "Even if the whole world is against you, do not be afraid. The one who has truth on his side can face anyone.",
    textMr: "संपूर्ण जग विरोधात असले तरी घाबरू नका. सत्य ज्याच्या बाजूने आहे तो कोणाशीही सामना करू शकतो.",
    textHi: "पूरा संसार विरुद्ध हो तो भी घबराओ नहीं। जिसके पास सत्य है वह किसी से भी लड़ सकता है।",
    source: "स्वामी विवेकानंद", lang:"mr",
    category:"marathi"
  },
  {
    text: "Arise, awake, and stop not until the goal is reached.",
    textMr: "उठा, जागे व्हा आणि ध्येय गाठेपर्यंत थांबू नका.",
    textHi: "उठो, जागो और तब तक मत रुको जब तक लक्ष्य प्राप्त न हो जाए।",
    source: "स्वामी विवेकानंद", lang:"mr",
    category:"marathi"
  },
  {
    text: "The strength and vitality of a nation is determined by its men and their character.",
    textMr: "राष्ट्राची ताकद आणि चैतन्य त्याच्या माणसांच्या चारित्र्यावर अवलंबून आहे.",
    textHi: "राष्ट्र की ताकत उसके पुरुषों के चरित्र पर निर्भर करती है।",
    source: "छत्रपती शिवाजी महाराज", lang:"mr",
    category:"marathi"
  },
  {
    text: "Strike the iron while it is hot. This is the only time to succeed.",
    textMr: "लोखंड गरम असताना ठोका. हाच यशाचा क्षण आहे.",
    textHi: "लोहा गर्म हो तभी ठोको। यही सफलता का समय है।",
    source: "मराठी म्हण", lang:"mr",
    category:"marathi"
  },
  {
    text: "Without health, nothing is possible. Body is the first instrument of dharma.",
    textMr: "आरोग्याशिवाय काहीही शक्य नाही. शरीर हे धर्माचे पहिले साधन आहे.",
    textHi: "स्वास्थ्य के बिना कुछ भी संभव नहीं। शरीर धर्म का पहला साधन है।",
    source: "आयुर्वेद सुभाषित", lang:"mr",
    category:"marathi"
  },
  {
    text: "Education is not filling a bucket but lighting a fire.",
    textMr: "शिक्षण म्हणजे बादली भरणे नव्हे, तर आग पेटवणे आहे.",
    textHi: "शिक्षा एक बाल्टी भरना नहीं बल्कि आग जलाना है।",
    source: "William Butler Yeats", lang:"mr",
    category:"marathi"
  },
  {
    text: "One who is determined never loses. Time is the most powerful weapon.",
    textMr: "जो निश्चयी आहे तो कधीच हरत नाही. वेळ हे सर्वात शक्तिशाली शस्त्र आहे.",
    textHi: "जो दृढ निश्चयी है वह कभी नहीं हारता। समय सबसे शक्तिशाली हथियार है।",
    source: "संत ज्ञानेश्वर", lang:"mr",
    category:"marathi"
  },

  // ── HOLLYWOOD CLASSICS ───────────────────────────────────────
  {
    text: "Get busy living, or get busy dying.",
    textHi: "या तो जीना शुरू करो, या मरना शुरू करो।",
    textMr: "एकतर जगणे सुरू करा, नाहीतर मरणे सुरू करा.",
    source: "The Shawshank Redemption (1994)", lang:"en",
    category:"hollywood"
  },
  {
    text: "You is kind, you is smart, you is important.",
    textHi: "तुम दयालु हो, तुम बुद्धिमान हो, तुम महत्वपूर्ण हो।",
    textMr: "तुम्ही दयाळू आहात, तुम्ही हुशार आहात, तुम्ही महत्त्वाचे आहात.",
    source: "The Help (2011)", lang:"en",
    category:"hollywood"
  },
  {
    text: "After all, tomorrow is another day.",
    textHi: "आखिरकार, कल एक नया दिन है।",
    textMr: "शेवटी, उद्या एक नवा दिवस आहे.",
    source: "Gone with the Wind (1939)", lang:"en",
    category:"hollywood"
  },
  {
    text: "Every passing minute is another chance to turn it all around.",
    textHi: "हर गुजरता पल एक और मौका है, सब कुछ बदल देने का।",
    textMr: "प्रत्येक जाणारी मिनिट सर्व काही बदलण्याची आणखी एक संधी आहे.",
    source: "Vanilla Sky (2001)", lang:"en",
    category:"hollywood"
  },
  {
    text: "To infinity and beyond!",
    textHi: "अनंत तक और उसके भी पार!",
    textMr: "अनंताकडे आणि त्यापलीकडे!",
    source: "Toy Story (1995)", lang:"en",
    category:"hollywood"
  },
  {
    text: "I am going to make him an offer he cannot refuse.",
    textHi: "मैं उसे एक ऐसा प्रस्ताव दूंगा जिसे वह ठुकरा नहीं सकता।",
    textMr: "मी त्याला असा प्रस्ताव देईन जो तो नाकारू शकणार नाही.",
    source: "The Godfather (1972)", lang:"en",
    category:"hollywood"
  },
  {
    text: "With great power comes great responsibility.",
    textHi: "बड़ी शक्ति के साथ बड़ी जिम्मेदारी आती है।",
    textMr: "मोठ्या शक्तीसोबत मोठी जबाबदारी येते.",
    source: "Spider-Man (2002)", lang:"en",
    category:"hollywood"
  },
  {
    text: "Our lives are defined by opportunities, even the ones we miss.",
    textHi: "हमारी जिंदगी अवसरों से परिभाषित होती है — यहां तक कि उन्हें भी जो हम चूक जाते हैं।",
    textMr: "आपले जीवन संधींनी परिभाषित होते — अगदी त्या संधींनीही ज्या आपण गमावतो.",
    source: "The Curious Case of Benjamin Button (2008)", lang:"en",
    category:"hollywood"
  },
  {
    text: "Life is not the amount of breaths you take, it's the moments that take your breath away.",
    textHi: "जिंदगी सांसों की गिनती नहीं है — यह वे पल हैं जो आपकी सांसें छीन लें।",
    textMr: "आयुष्य श्वासांची संख्या नाही — ते क्षण आहेत जे तुमचे श्वास थांबवतात.",
    source: "Hitch (2005)", lang:"en",
    category:"hollywood"
  },
  {
    text: "Just keep swimming.",
    textHi: "बस तैरते रहो।",
    textMr: "फक्त पोहत राहा.",
    source: "Finding Nemo (2003)", lang:"en",
    category:"hollywood"
  },

  // ── HISTORY'S GREATEST MINDS ──────────────────────────────────
  {
    text: "Strength does not come from physical capacity. It comes from an indomitable will.",
    textHi: "शक्ति शारीरिक क्षमता से नहीं आती। यह एक अदम्य इच्छाशक्ति से आती है।",
    textMr: "शक्ती शारीरिक क्षमतेतून येत नाही. ती अदम्य इच्छाशक्तीतून येते.",
    source: "महात्मा गांधी", lang:"hi",
    category:"history"
  },
  {
    text: "The secret of getting ahead is getting started.",
    textHi: "आगे बढ़ने का रहस्य शुरुआत करने में है।",
    textMr: "पुढे जाण्याचे रहस्य म्हणजे सुरुवात करणे.",
    source: "Mark Twain", lang:"en",
    category:"history"
  },
  {
    text: "It always seems impossible until it's done.",
    textHi: "जब तक यह हो न जाए, यह असंभव लगता है।",
    textMr: "जोपर्यंत ते होत नाही, तोपर्यंत ते अशक्य वाटते.",
    source: "Nelson Mandela", lang:"en",
    category:"history"
  },
  {
    text: "I have not failed. I've just found ten thousand ways that won't work.",
    textHi: "मैं असफल नहीं हुआ। मैंने बस दस हजार तरीके खोजे जो काम नहीं करते।",
    textMr: "मी अपयशी झालो नाही. मला फक्त दहा हजार मार्ग सापडले जे काम करत नाहीत.",
    source: "Thomas Edison", lang:"en",
    category:"history"
  },
  {
    text: "Success is not final, failure is not fatal. It is the courage to continue that counts.",
    textHi: "सफलता अंतिम नहीं है, असफलता घातक नहीं है। जारी रखने का साहस ही मायने रखता है।",
    textMr: "यश अंतिम नाही, अपयश घातक नाही. पुढे चालत राहण्याचे धाडस महत्त्वाचे आहे.",
    source: "Winston Churchill", lang:"en",
    category:"history"
  },
  {
    text: "The best time to plant a tree was twenty years ago. The second best time is now.",
    textHi: "पेड़ लगाने का सबसे अच्छा समय बीस साल पहले था। दूसरा सबसे अच्छा समय अभी है।",
    textMr: "झाड लावण्याची सर्वोत्तम वेळ वीस वर्षांपूर्वी होती. दुसरी सर्वोत्तम वेळ आत्ता आहे.",
    source: "Chinese Proverb", lang:"en",
    category:"history"
  },
  {
    text: "In the middle of every difficulty lies opportunity.",
    textHi: "हर कठिनाई के बीच में एक अवसर छुपा होता है।",
    textMr: "प्रत्येक कठीण परिस्थितीच्या मध्यभागी एक संधी दडलेली असते.",
    source: "Albert Einstein", lang:"hi",
    category:"history"
  },
  {
    text: "You miss one hundred percent of the shots you don't take.",
    textHi: "जो शॉट आप नहीं लेते, उनमें से सौ प्रतिशत आप चूक जाते हैं।",
    textMr: "जे शॉट तुम्ही घेत नाही ते शंभर टक्के चुकतात.",
    source: "Wayne Gretzky", lang:"en",
    category:"history"
  },
  {
    text: "Dream is not that which you see while sleeping, it is something that does not let you sleep.",
    textHi: "सपना वो नहीं जो नींद में आए — सपना वो है जो नींद न आने दे।",
    textMr: "स्वप्न ते नाही जे झोपेत येते — स्वप्न ते आहे जे झोपू देत नाही.",
    source: "डॉ. ए.पी.जे. अब्दुल कलाम", lang:"hi",
    category:"history"
  },
  {
    text: "First they ignore you, then they laugh at you, then they fight you, then you win.",
    textHi: "पहले वे आपको अनदेखा करते हैं, फिर हँसते हैं, फिर लड़ते हैं — और फिर आप जीत जाते हैं।",
    textMr: "आधी ते तुम्हाला दुर्लक्षित करतात, मग हसतात, मग लढतात — आणि मग तुम्ही जिंकता.",
    source: "महात्मा गांधी", lang:"hi",
    category:"history"
  },

  // ── DOCUMENTARY / LIFE WISDOM ────────────────────────────────
  {
    text: "The cave you fear to enter holds the treasure you seek.",
    textHi: "जिस गुफा से तुम डरते हो, उसी में वह खजाना है जिसे तुम ढूंढ रहे हो।",
    textMr: "ज्या गुहेत जायला तुम्हाला भीती वाटते, तिथेच तुम्हाला हवा खजिना आहे.",
    source: "Joseph Campbell", lang:"en",
    category:"documentary"
  },
  {
    text: "We are what we repeatedly do. Excellence is not an act but a habit.",
    textHi: "हम वही हैं जो हम बार-बार करते हैं। उत्कृष्टता एक कार्य नहीं, एक आदत है।",
    textMr: "आपण जे वारंवार करतो तेच आपण आहोत. उत्कृष्टता एक कृती नव्हे, एक सवय आहे.",
    source: "Aristotle", lang:"hi",
    category:"documentary"
  },
  {
    text: "Look up at the stars, not down at your feet. Be curious.",
    textHi: "तारों को देखो, पैरों को नहीं। जिज्ञासु रहो।",
    textMr: "तारे पहा, पायाकडे नाही. कुतूहलशील राहा.",
    source: "Stephen Hawking", lang:"en",
    category:"documentary"
  },
  {
    text: "Physical fitness is not only one of the most important keys to a healthy body, it is the basis of dynamic and creative intellectual activity.",
    textHi: "शारीरिक स्वास्थ्य न केवल स्वस्थ शरीर की कुंजी है, बल्कि रचनात्मक बौद्धिक गतिविधि का आधार भी है।",
    textMr: "शारीरिक तंदुरुस्ती म्हणजे केवळ निरोगी शरीराची गुरुकिल्ली नव्हे, तर सर्जनशील बौद्धिक क्रियाकलापाचा पायाही आहे.",
    source: "John F. Kennedy", lang:"en",
    category:"documentary"
  },
  {
    text: "Take care of your body. It's the only place you have to live.",
    textHi: "अपने शरीर की देखभाल करो। यही एकमात्र जगह है जहाँ तुम्हें रहना है।",
    textMr: "तुमच्या शरीराची काळजी घ्या. हीच एकमेव जागा आहे जिथे तुम्हाला राहायचे आहे.",
    source: "Jim Rohn", lang:"mr",
    category:"documentary"
  },
  {
    text: "The groundwork for all happiness is good health.",
    textHi: "सभी सुखों की नींव अच्छा स्वास्थ्य है।",
    textMr: "सर्व आनंदाचा पाया चांगले आरोग्य आहे.",
    source: "Leigh Hunt", lang:"mr",
    category:"documentary"
  },
  {
    text: "The human body is the best picture of the human soul.",
    textHi: "मानव शरीर मानव आत्मा की सबसे अच्छी तस्वीर है।",
    textMr: "मानवी शरीर हे मानवी आत्म्याचे सर्वोत्तम चित्र आहे.",
    source: "Ludwig Wittgenstein", lang:"en",
    category:"documentary"
  },
  {
    text: "An early morning walk is a blessing for the whole day.",
    textHi: "सुबह की सैर पूरे दिन के लिए एक आशीर्वाद है।",
    textMr: "पहाटेची फेरी संपूर्ण दिवसासाठी आशीर्वाद आहे.",
    source: "Henry David Thoreau", lang:"mr",
    category:"documentary"
  },
];

// Pick today's quote — rotates daily, same quote all day
function getTodayQuote() {
  const dayNum = Math.floor(Date.now() / 86400000); // days since epoch
  return QUOTES[dayNum % QUOTES.length];
}

// Get quote text in the right language
function getQuoteText(q) {
  const lang = cfg.pranaLang || "en";
  if(lang === "hi") return (q.textHi || q.text);
  if(lang === "mr") return (q.textMr || q.textHi || q.text);
  return q.text;
}
