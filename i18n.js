/* English / हिंदी switch for every page.
   The choice is kept in localStorage ('pyq-lang'). In Hindi mode the page's own English text is swapped
   for Hindi as it renders (a fixed dictionary plus a few patterns for counts and dates), and pages that have
   Hindi question text call PYQ_I18N.preHindi() / hiRows() to show it. Load this in <head>, before page scripts. */
(function(){
  var L = 'en';
  try { var m = location.search.match(/[?&]lang=(en|hi)\b/); if (m) localStorage.setItem('pyq-lang', m[1]); L = localStorage.getItem('pyq-lang') === 'hi' ? 'hi' : 'en'; } catch(e){}
  window.PYQ_LANG = L;
  var root = document.documentElement;
  root.setAttribute('data-lang', L);

  /* ---------- dictionary ---------- */
  var SUBJ = {
    "Economy":"अर्थव्यवस्था", "Modern Indian History":"आधुनिक भारत का इतिहास", "Science and Technology":"विज्ञान एवं प्रौद्योगिकी",
    "Environment and Ecology":"पर्यावरण एवं पारिस्थितिकी", "Indian Polity and Governance":"भारतीय राजव्यवस्था एवं शासन", "Geography":"भूगोल",
    "Agriculture":"कृषि", "Ancient Indian History":"प्राचीन भारत का इतिहास", "Medieval Indian History":"मध्यकालीन भारत का इतिहास",
    "Art and Culture":"कला एवं संस्कृति", "International Relations":"अंतर्राष्ट्रीय संबंध", "Miscellaneous":"विविध",
    // CSAT sections and topics
    "Reading Comprehension":"बोधगम्यता (रीडिंग कॉम्प्रिहेंशन)", "Quantitative Aptitude":"मात्रात्मक अभियोग्यता", "Logical Reasoning":"तार्किक क्षमता",
    "Data Interpretation":"आँकड़ों की व्याख्या", "Interpersonal and Communication Skills":"अंतर्वैयक्तिक एवं संचार कौशल",
    "Data Sufficiency":"आँकड़ों की पर्याप्तता", "Inference and Conclusion":"अनुमान और निष्कर्ष", "Facts from the Passage":"गद्यांश से तथ्य",
    "Algebra and Equations":"बीजगणित और समीकरण", "Permutations and Combinations":"क्रमचय और संचय", "Number System":"संख्या पद्धति",
    "Seating Arrangement":"बैठने की व्यवस्था", "Puzzles":"पहेलियाँ", "Assumption":"पूर्वधारणा", "Series and Patterns":"श्रेणी और पैटर्न",
    "Time and Distance":"समय और दूरी", "Cubes and Cutting":"घन और कटाई", "Averages":"औसत", "Main Idea and Author's Intent":"मुख्य विचार और लेखक का आशय",
    "Ratio and Proportion":"अनुपात और समानुपात", "Ranking and Ordering":"क्रम और रैंकिंग", "Statements and Logic":"कथन और तर्क", "Percentages":"प्रतिशत",
    "Blood Relations":"रक्त संबंध", "Syllogism":"न्याय निगमन", "Direction Sense":"दिशा ज्ञान", "Mixtures and Alligation":"मिश्रण और एलिगेशन",
    "Coding-Decoding":"कोडिंग-डिकोडिंग", "Geometry and Mensuration":"ज्यामिति और क्षेत्रमिति", "Tables":"तालिकाएँ", "Communication":"संचार",
    "Interpersonal Skills":"अंतर्वैयक्तिक कौशल", "Profit and Partnership":"लाभ और साझेदारी", "Time and Work":"समय और कार्य",
    "Sets and Venn Diagrams":"समुच्चय और वेन आरेख", "Ages":"आयु", "Clocks and Calendars":"घड़ी और कैलेंडर", "Statements and Conclusions":"कथन और निष्कर्ष",
    // Prelims GS I topics
    "Banking":"बैंकिंग", "Economic Growth and Development":"आर्थिक संवृद्धि और विकास", "Economic Reforms and Planning":"आर्थिक सुधार और योजना",
    "Energy":"ऊर्जा", "Financial Markets":"वित्तीय बाज़ार", "Fiscal Policy":"राजकोषीय नीति", "Inclusive Growth":"समावेशी विकास", "Industry":"उद्योग",
    "Inflation":"मुद्रास्फीति", "Infrastructure":"अवसंरचना", "International Economics & Balance of Payments":"अंतर्राष्ट्रीय अर्थशास्त्र और भुगतान संतुलन",
    "Microeconomics":"व्यष्टि अर्थशास्त्र", "Monetary Policy":"मौद्रिक नीति", "National Income":"राष्ट्रीय आय", "Pension & Insurance":"पेंशन और बीमा",
    "Poverty & Inequality":"गरीबी और असमानता", "Service Sector":"सेवा क्षेत्र", "Unemployment":"बेरोज़गारी",
    "Advent of Europeans":"यूरोपीयों का आगमन", "Civil Disobedience Movement":"सविनय अवज्ञा आंदोलन", "Constitutional Developments":"संवैधानिक विकास",
    "Development of Education":"शिक्षा का विकास", "Development of Press":"प्रेस का विकास", "Economic Impact of British Rule":"ब्रिटिश शासन का आर्थिक प्रभाव",
    "Emergence of Gandhi":"गांधी का उदय", "Expansion and Consolidation of British Rule":"ब्रिटिश शासन का विस्तार और सुदृढ़ीकरण", "Extremist Phase":"उग्रवादी चरण",
    "First World War and Nationalist Response":"प्रथम विश्व युद्ध और राष्ट्रवादी प्रतिक्रिया", "Formation of Indian National Congress":"भारतीय राष्ट्रीय कांग्रेस का गठन",
    "Independence and Partition":"स्वतंत्रता और विभाजन", "India on the Eve of British Conquest":"ब्रिटिश विजय की पूर्व संध्या पर भारत", "Indian National Army":"आज़ाद हिंद फ़ौज",
    "Non-Cooperation Movement":"असहयोग आंदोलन", "Peasant Movements":"किसान आंदोलन", "Princely States":"रियासतें", "Quit India Movement":"भारत छोड़ो आंदोलन",
    "Revolutionary Movement":"क्रांतिकारी आंदोलन", "Rise of Indian Nationalism":"भारतीय राष्ट्रवाद का उदय", "Second World War and Nationalist Response":"द्वितीय विश्व युद्ध और राष्ट्रवादी प्रतिक्रिया",
    "Socio-Religious Reform Movements":"सामाजिक-धार्मिक सुधार आंदोलन", "Tribal Movements":"जनजातीय आंदोलन", "Working-Class Movements":"मज़दूर वर्ग के आंदोलन",
    "Biotechnology":"जैव प्रौद्योगिकी", "Defence Technology":"रक्षा प्रौद्योगिकी", "General Biology":"सामान्य जीव विज्ञान", "General Chemistry":"सामान्य रसायन विज्ञान",
    "General Physics":"सामान्य भौतिकी", "Genetics and Heredity":"आनुवंशिकी और वंशागति", "Human Health and Diseases":"मानव स्वास्थ्य और रोग", "Human Physiology":"मानव शरीर क्रिया विज्ञान",
    "IT & Computers":"आईटी और कंप्यूटर", "Nanotechnology":"नैनो प्रौद्योगिकी", "Nuclear Technology":"नाभिकीय प्रौद्योगिकी", "Plant Physiology":"पादप शरीर क्रिया विज्ञान",
    "Robotics":"रोबोटिक्स", "Space Technology":"अंतरिक्ष प्रौद्योगिकी", "Telecommunications":"दूरसंचार",
    "Biodiversity & Conservation":"जैव विविधता और संरक्षण", "Climate Change":"जलवायु परिवर्तन", "Ecology":"पारिस्थितिकी",
    "Environmental Laws & Regulations":"पर्यावरण कानून और विनियम", "Pollution":"प्रदूषण", "Sustainable Development":"सतत विकास",
    "Basic Structure":"मूल ढाँचा", "Centre-State Relations":"केंद्र-राज्य संबंध", "Citizenship":"नागरिकता", "Constitutional Amendments":"संविधान संशोधन",
    "Constitutional Bodies":"संवैधानिक निकाय", "Directive Principles of State Policy":"राज्य के नीति निदेशक तत्व", "Emergency Provisions":"आपातकालीन प्रावधान",
    "Federalism":"संघवाद", "Fundamental Duties":"मौलिक कर्तव्य", "Fundamental Rights":"मौलिक अधिकार", "Historical Background":"ऐतिहासिक पृष्ठभूमि",
    "Inter-State Relations":"अंतर-राज्य संबंध", "Judiciary":"न्यायपालिका", "Non-Constitutional Bodies":"गैर-संवैधानिक निकाय",
    "Panchayati Raj & Municipalities":"पंचायती राज और नगरपालिकाएँ", "Parliament":"संसद", "Preamble":"प्रस्तावना",
    "Salient Features of the Constitution":"संविधान की प्रमुख विशेषताएँ", "Scheduled Areas and Tribal Areas":"अनुसूचित क्षेत्र और जनजातीय क्षेत्र",
    "Special Provisions":"विशेष प्रावधान", "State Executive":"राज्य कार्यपालिका", "State Legislature":"राज्य विधानमंडल", "Union Executive":"संघ कार्यपालिका",
    "Union and its Territory":"संघ और उसका राज्यक्षेत्र",
    "Climate of India":"भारत की जलवायु", "Climatology":"जलवायु विज्ञान", "Drainage of India":"भारत का अपवाह तंत्र", "Earth and the Universe":"पृथ्वी और ब्रह्मांड",
    "Earth's Interior and Crust":"पृथ्वी का आंतरिक भाग और भूपर्पटी", "Energy Resources":"ऊर्जा संसाधन", "Geomorphology":"भू-आकृति विज्ञान", "Industries":"उद्योग",
    "Location of India":"भारत की अवस्थिति", "Mineral Resources":"खनिज संसाधन", "Natural Vegetation":"प्राकृतिक वनस्पति", "Natural Vegetation of India":"भारत की प्राकृतिक वनस्पति",
    "Oceanography":"समुद्र विज्ञान", "Physiography of India":"भारत का भौतिक स्वरूप", "Population":"जनसंख्या", "Soils of India":"भारत की मृदाएँ", "Urbanisation":"नगरीकरण",
    "Allied Activities":"संबद्ध गतिविधियाँ", "Cropping Patterns":"फसल प्रतिरूप", "Food Processing":"खाद्य प्रसंस्करण", "Indian Agriculture":"भारतीय कृषि",
    "Irrigation":"सिंचाई", "Land Reforms":"भूमि सुधार", "Major Crops":"प्रमुख फसलें", "Sustainable Agriculture":"सतत कृषि",
    "Buddhism":"बौद्ध धर्म", "Chola Empire":"चोल साम्राज्य", "Gupta Empire":"गुप्त साम्राज्य", "Indus Valley Civilisation":"सिंधु घाटी सभ्यता", "Jainism":"जैन धर्म",
    "Mahajanapadas":"महाजनपद", "Mauryan Empire":"मौर्य साम्राज्य", "Post-Gupta Period":"गुप्तोत्तर काल", "Prehistory":"प्रागैतिहासिक काल", "Sangam Age":"संगम युग",
    "South Indian Empires":"दक्षिण भारतीय साम्राज्य", "Vedic Age":"वैदिक युग",
    "Bahmani Kingdom":"बहमनी राज्य", "Bhakti Movement":"भक्ति आंदोलन", "Delhi Sultanate":"दिल्ली सल्तनत", "Early Medieval India":"प्रारंभिक मध्यकालीन भारत",
    "Mughal Empire":"मुगल साम्राज्य", "Regional States":"क्षेत्रीय राज्य", "Vijayanagara Empire":"विजयनगर साम्राज्य",
    "Awards and Honours":"पुरस्कार और सम्मान", "Coins":"सिक्के", "Fairs and Festivals":"मेले और त्योहार", "Geographical Indication Tags":"भौगोलिक संकेत (GI) टैग",
    "Indian Architecture":"भारतीय स्थापत्य", "Indian Dance":"भारतीय नृत्य", "Indian Handicrafts":"भारतीय हस्तशिल्प", "Indian Literature":"भारतीय साहित्य",
    "Indian Music":"भारतीय संगीत", "Indian Paintings":"भारतीय चित्रकला", "Indian Sculpture":"भारतीय मूर्तिकला", "Languages of India":"भारत की भाषाएँ",
    "Martial Arts":"मार्शल आर्ट", "Schools of Philosophy":"दर्शन के संप्रदाय", "Science and Technology through the Ages":"युगों में विज्ञान और प्रौद्योगिकी",
    "UNESCO Heritage Sites":"यूनेस्को विरासत स्थल", "Other Multilateral Organisations":"अन्य बहुपक्षीय संगठन", "Places in News":"चर्चा में रहे स्थान",
    "United Nations and its Bodies":"संयुक्त राष्ट्र और उसके निकाय",
    // Mains topics
    "Indian Culture & Heritage":"भारतीय संस्कृति और विरासत", "Freedom Struggle":"स्वतंत्रता संग्राम", "Post-Independence Consolidation":"स्वतंत्रता के बाद का सुदृढ़ीकरण",
    "World History":"विश्व इतिहास", "Indian Society":"भारतीय समाज", "Women, Population & Urbanization":"महिलाएँ, जनसंख्या और शहरीकरण", "Globalization":"वैश्वीकरण",
    "Communalism, Secularism & Regionalism":"सांप्रदायिकता, धर्मनिरपेक्षता और क्षेत्रवाद", "Geography (Physical, Resources & Phenomena)":"भूगोल (भौतिक, संसाधन और परिघटनाएँ)",
    "Historical Underpinnings":"ऐतिहासिक आधार", "Salient Features of Indian Constitution":"भारतीय संविधान की प्रमुख विशेषताएँ", "Parliament & State Legislature":"संसद और राज्य विधानमंडल",
    "Union & State Executive":"संघ और राज्य कार्यपालिका", "Local Self Government":"स्थानीय स्वशासन",
    "Comparison of the Indian Constitutional Scheme with that of Other Countries":"भारतीय संवैधानिक योजना की अन्य देशों से तुलना",
    "Salient Features of the Representation of People's Act":"जनप्रतिनिधित्व अधिनियम की प्रमुख विशेषताएँ", "Constitutional & Statutory Bodies":"संवैधानिक और सांविधिक निकाय",
    "Role of NGOs, SHGs & Pressure Groups":"एनजीओ, स्वयं सहायता समूहों और दबाव समूहों की भूमिका", "Developmental Policies & Process":"विकास नीतियाँ और प्रक्रिया",
    "Governance, Transparency & Accountability":"शासन, पारदर्शिता और जवाबदेही", "Social Justice & Welfare":"सामाजिक न्याय और कल्याण",
    "Issues relating to Poverty and Hunger":"गरीबी और भूख से जुड़े मुद्दे", "Health, Education & Human Resources":"स्वास्थ्य, शिक्षा और मानव संसाधन",
    "Role of Civil Services in a Democracy":"लोकतंत्र में सिविल सेवाओं की भूमिका", "India & Its Neighbourhood":"भारत और उसका पड़ोस",
    "Bilateral, Regional & Global Groupings":"द्विपक्षीय, क्षेत्रीय और वैश्विक समूह",
    "Impact of Global Policies and Politics on India; Indian Diaspora":"भारत पर वैश्विक नीतियों और राजनीति का प्रभाव; भारतीय प्रवासी",
    "International Institutions":"अंतर्राष्ट्रीय संस्थाएँ", "Indian Economy & Planning":"भारतीय अर्थव्यवस्था और योजना", "Government Budgeting":"सरकारी बजट",
    "Effects of Liberalization on the Economy":"अर्थव्यवस्था पर उदारीकरण के प्रभाव", "Investment Models":"निवेश मॉडल", "Infrastructure & Energy":"अवसंरचना और ऊर्जा",
    "Science & Technology":"विज्ञान एवं प्रौद्योगिकी", "Environment & Ecology":"पर्यावरण एवं पारिस्थितिकी", "Disaster Management":"आपदा प्रबंधन",
    "Internal Security":"आंतरिक सुरक्षा", "Ethics & Human Interface":"नैतिकता और मानवीय सह-संबंध", "Attitude":"अभिवृत्ति",
    "Aptitude & Foundational Values":"अभिरुचि और आधारभूत मूल्य", "Emotional Intelligence":"भावनात्मक बुद्धिमत्ता", "Moral Thinkers & Philosophers":"नैतिक विचारक और दार्शनिक",
    "Public Service Values & Ethics in Administration":"लोक सेवा मूल्य और प्रशासन में नैतिकता", "Probity in Governance":"शासन में शुचिता", "Case Studies":"केस स्टडी"
  };

  var UI = {
    // header, footer, shared
    "Mains":"मेन्स", "Prelims":"प्रीलिम्स", "Practice":"अभ्यास", "Sections":"अनुभाग", "Privacy":"गोपनीयता", "Home":"होम",
    "Switch to dark theme":"डार्क थीम पर जाएँ", "Switch to light theme":"लाइट थीम पर जाएँ", "Dark theme":"डार्क थीम", "Light theme":"लाइट थीम",
    "Switch colour theme":"रंग थीम बदलें", "Close":"बंद करें", "Exit":"बाहर निकलें", "Clear":"हटाएँ", "Select all":"सभी चुनें", "Search":"खोजें", "Show":"दिखाएँ",
    "Browse every question:":"सभी प्रश्न देखें:", "UPSC PYQ":"UPSC PYQ", "UPSC Prelims PYQ":"UPSC प्रीलिम्स PYQ", "UPSC Mains PYQ":"UPSC मेन्स PYQ",
    "PYQ Astra, built for UPSC aspirants.":"PYQ Astra, UPSC अभ्यर्थियों के लिए।",
    "Question papers and answer keys are published by UPSC. Explanations are our own.":"प्रश्नपत्र और उत्तर कुंजियाँ UPSC द्वारा प्रकाशित हैं। व्याख्याएँ हमारी अपनी हैं।",
    "Questions transcribed from the official UPSC Civil Services (Main) papers.":"प्रश्न UPSC सिविल सेवा (मुख्य) परीक्षा के आधिकारिक प्रश्नपत्रों से लिए गए हैं।",
    "Practised and bookmarked marks are saved in this browser, and to your account when signed in.":"अभ्यास और बुकमार्क इसी ब्राउज़र में सहेजे जाते हैं, और साइन इन करने पर आपके खाते में भी।",
    "Answers follow UPSC's official answer keys. Explanations and notes are written by PYQ Astra, not UPSC.":"उत्तर UPSC की आधिकारिक उत्तर कुंजी के अनुसार हैं। व्याख्याएँ और टिप्पणियाँ PYQ Astra ने लिखी हैं, UPSC ने नहीं।",
    "Your answers and bookmarks are saved in this browser, and to your account when signed in.":"आपके उत्तर और बुकमार्क इसी ब्राउज़र में सहेजे जाते हैं, और साइन इन करने पर आपके खाते में भी।",
    "Read every question online:":"सभी प्रश्न ऑनलाइन पढ़ें:", "UPSC Prelims PYQ, year-wise and subject-wise":"UPSC प्रीलिम्स PYQ, वर्षवार और विषयवार",

    // home
    "UPSC Civil Services Examination · Prelims and Mains":"UPSC सिविल सेवा परीक्षा · प्रारंभिक और मुख्य",
    "Every UPSC CSE previous-year question,":"UPSC CSE के सभी पिछले वर्षों के प्रश्न,", "in one place.":"एक ही जगह।",
    "Download official Mains and Prelims question papers with answer keys, solve Prelims questions with instant marking, and study Mains questions sorted by syllabus topic.":"मेन्स और प्रीलिम्स के आधिकारिक प्रश्नपत्र उत्तर कुंजी के साथ डाउनलोड करें, प्रीलिम्स प्रश्न हल करें और तुरंत अंक पाएँ, और मेन्स के प्रश्न पाठ्यक्रम के टॉपिक के अनुसार पढ़ें।",
    "Solve Prelims PYQs":"प्रीलिम्स PYQ हल करें", "Prelims papers and keys":"प्रीलिम्स प्रश्नपत्र और कुंजियाँ", "Mains papers":"मेन्स प्रश्नपत्र",
    "Mains questions":"मेन्स प्रश्न", "papers":"प्रश्नपत्र", "Prelims MCQs with explanations":"व्याख्या सहित प्रीलिम्स MCQ", "Light and dark":"लाइट और डार्क", "themes":"थीम",
    "What you can do here":"यहाँ आप क्या कर सकते हैं",
    "Everything is free. Browse every question openly; sign up free with Google to download papers and practise.":"सब कुछ मुफ़्त है। हर प्रश्न खुलकर देखें; प्रश्नपत्र डाउनलोड करने और अभ्यास के लिए Google से मुफ़्त साइन अप करें।",
    "Download official UPSC CSE Mains question papers":"UPSC CSE मेन्स के आधिकारिक प्रश्नपत्र डाउनलोड करें",
    "Original papers for GS I, II, III and IV, year by year, straight from UPSC.":"GS I, II, III और IV के मूल प्रश्नपत्र, वर्षवार, सीधे UPSC से।",
    "Open Mains papers →":"मेन्स प्रश्नपत्र खोलें →", "Download official Prelims papers and answer keys":"प्रीलिम्स के आधिकारिक प्रश्नपत्र और उत्तर कुंजियाँ डाउनलोड करें",
    "General Studies I and CSAT question papers, each with UPSC's official answer key.":"सामान्य अध्ययन I और CSAT के प्रश्नपत्र, हर एक UPSC की आधिकारिक उत्तर कुंजी के साथ।",
    "GS I and CSAT":"GS I और CSAT", "Open Prelims papers →":"प्रीलिम्स प्रश्नपत्र खोलें →", "New":"नया", "Solve Prelims PYQs online":"प्रीलिम्स PYQ ऑनलाइन हल करें",
    "Answer real Prelims questions with instant marking (+2 / −0.66), explanations, and a score card at the end.":"असली प्रीलिम्स प्रश्नों के उत्तर दें, तुरंत अंक (+2 / −0.66), व्याख्या और अंत में स्कोर कार्ड पाएँ।",
    "Start practising →":"अभ्यास शुरू करें →", "Mains questions sorted by topic":"टॉपिक के अनुसार मेन्स प्रश्न",
    "Every Mains question tagged to its syllabus topic. Search, filter by year or topic, and read them in one place.":"हर मेन्स प्रश्न उसके पाठ्यक्रम टॉपिक से जुड़ा है। खोजें, वर्ष या टॉपिक से छाँटें, और एक ही जगह पढ़ें।",
    "Browse questions →":"प्रश्न देखें →", "See what UPSC asks most":"देखें UPSC सबसे ज़्यादा क्या पूछता है",
    "Topic heatmaps for Mains and Prelims show how often each topic appears, year after year.":"मेन्स और प्रीलिम्स के टॉपिक हीटमैप दिखाते हैं कि हर टॉपिक साल-दर-साल कितनी बार आया।",
    "Mains and Prelims":"मेन्स और प्रीलिम्स", "View topic trends →":"टॉपिक रुझान देखें →", "Track your progress":"अपनी प्रगति देखें",
    "Mark Mains questions as practised, bookmark tough ones, and revisit wrong Prelims answers. Synced to your account across devices.":"मेन्स प्रश्नों को 'अभ्यास हुआ' चिह्नित करें, कठिन प्रश्न बुकमार्क करें और प्रीलिम्स के गलत उत्तर दोबारा देखें। सब कुछ आपके खाते में हर डिवाइस पर सिंक होता है।",
    "No sign-up needed":"साइन अप की ज़रूरत नहीं", "Try it →":"आज़माएँ →", "Jump to a paper":"सीधे प्रश्नपत्र पर जाएँ",
    "Mains · History, society, geography":"मेन्स · इतिहास, समाज, भूगोल", "Mains · Polity, governance, IR":"मेन्स · राजव्यवस्था, शासन, अंतर्राष्ट्रीय संबंध",
    "Mains · Economy, environment, S&T":"मेन्स · अर्थव्यवस्था, पर्यावरण, विज्ञान-प्रौद्योगिकी", "Mains · Ethics and case studies":"मेन्स · नैतिकता और केस स्टडी",
    "Prelims GS I":"प्रीलिम्स GS I", "Papers and answer keys":"प्रश्नपत्र और उत्तर कुंजियाँ", "Question of the day":"आज का प्रश्न",
    "A real Mains question, a new one every day.":"मेन्स का एक असली प्रश्न, हर दिन नया।", "Another question":"दूसरा प्रश्न", "Open this paper":"यह प्रश्नपत्र खोलें",

    // mains
    "Nothing practised yet":"अभी कोई अभ्यास नहीं", "This paper":"यह प्रश्नपत्र", "All papers":"सभी प्रश्नपत्र", "All years":"सभी वर्ष", "All topics":"सभी टॉपिक",
    "All questions":"सभी प्रश्न", "Not practised yet":"जिनका अभ्यास नहीं हुआ", "Practised":"अभ्यास हुआ", "Bookmarked":"बुकमार्क किए गए", "Bookmark":"बुकमार्क",
    "Filter here, or click a topic, year or cell in the heatmap below, then press Start.":"यहाँ छाँटें, या नीचे हीटमैप में कोई टॉपिक, वर्ष या खाना चुनें, फिर 'शुरू करें' दबाएँ।",
    "Clear filters":"फ़िल्टर हटाएँ", "Where the questions come from":"प्रश्न कहाँ से आते हैं",
    "Each cell counts questions per topic per year. Click a cell, a topic or a year to pick those questions.":"हर खाना बताता है कि किसी वर्ष किसी टॉपिक से कितने प्रश्न आए। उन प्रश्नों को चुनने के लिए खाना, टॉपिक या वर्ष पर क्लिक करें।",
    "Fewer":"कम", "More":"ज़्यादा", "‹ List":"‹ सूची", "GS papers":"GS प्रश्नपत्र", "Search questions, e.g. federalism, Gandhi, cyber":"प्रश्न खोजें, जैसे federalism, Gandhi, cyber",
    "Search questions":"प्रश्न खोजें", "Search in":"कहाँ खोजें", "Year":"वर्ष", "Topic":"टॉपिक", "None":"कोई नहीं", "Questions":"प्रश्न", "Coming soon":"जल्द आ रहा है",
    "Mark as practised":"अभ्यास हुआ चिह्नित करें", "More on this topic":"इस टॉपिक पर और", "‹ Previous":"‹ पिछला", "Next ›":"अगला ›", "No questions":"कोई प्रश्न नहीं",
    "All four papers":"चारों प्रश्नपत्र", "not practised":"अभ्यास नहीं हुआ", "practised":"अभ्यास हुआ", "bookmarked":"बुकमार्क किए गए",
    "Bookmark questions with the star to find them here.":"प्रश्नों को तारे से बुकमार्क करें, वे यहाँ दिखेंगे।", "Try a shorter search, or clear the filters.":"छोटा शब्द खोजें, या फ़िल्टर हटाएँ।",
    "move ·":"आगे-पीछे ·", "practised ·":"अभ्यास हुआ ·", "bookmark":"बुकमार्क", "answer ·":"उत्तर ·",
    "History, Culture, Society, Geography, and World History are pulled apart so you can drill straight into what you're revising.":"इतिहास, संस्कृति, समाज, भूगोल और विश्व इतिहास अलग-अलग किए गए हैं, ताकि आप सीधे वही पढ़ें जिसका रिवीज़न कर रहे हैं।",
    "Polity, Governance, Social Justice and International Relations are pulled apart so you can drill straight into what you're revising.":"राजव्यवस्था, शासन, सामाजिक न्याय और अंतर्राष्ट्रीय संबंध अलग-अलग किए गए हैं, ताकि आप सीधे वही पढ़ें जिसका रिवीज़न कर रहे हैं।",
    "Economy, Agriculture, Science & Tech, Environment and Security are pulled apart so you can drill straight into what you're revising.":"अर्थव्यवस्था, कृषि, विज्ञान-प्रौद्योगिकी, पर्यावरण और सुरक्षा अलग-अलग किए गए हैं, ताकि आप सीधे वही पढ़ें जिसका रिवीज़न कर रहे हैं।",
    "Theory questions are grouped by syllabus area, and Section B case studies sit in their own block since they read differently.":"सैद्धांतिक प्रश्न पाठ्यक्रम के क्षेत्र के अनुसार समूहित हैं, और खंड B की केस स्टडी अलग रखी गई हैं क्योंकि उन्हें अलग तरह से पढ़ा जाता है।",
    "Mains questions are in English for now. Hindi text of the official papers is being added year by year.":"मेन्स के प्रश्न अभी अंग्रेज़ी में हैं। आधिकारिक प्रश्नपत्रों का हिंदी पाठ वर्ष-दर-वर्ष जोड़ा जा रहा है।",

    // practice
    "GS Paper I":"सामान्य अध्ययन प्रश्नपत्र I", "CSAT (Paper II)":"CSAT (प्रश्नपत्र II)", "Prelims practice, subject by subject":"प्रीलिम्स अभ्यास, विषयवार",
    "CSAT practice, section by section":"CSAT अभ्यास, खंडवार", "Attempted":"हल किए", "Correct":"सही", "Wrong":"गलत", "Score":"स्कोर",
    "Not attempted":"हल नहीं किए", "Answered wrong":"गलत उत्तर", "Newest year first":"नया वर्ष पहले", "Shuffled":"मिश्रित क्रम", "Result":"परिणाम",
    "Reset answers":"उत्तर मिटाएँ", "1. Subject":"1. विषय", "1. Section":"1. खंड", "All subjects":"सभी विषय", "All sections":"सभी खंड", "2. Years":"2. वर्ष",
    "3. Topics":"3. टॉपिक", "Leave all unselected to include every topic":"सभी टॉपिक शामिल करने के लिए कुछ न चुनें",
    "Pick a subject above to filter by its topics.":"टॉपिक से छाँटने के लिए ऊपर कोई विषय चुनें।", "Pick a section above to filter by its topics.":"टॉपिक से छाँटने के लिए ऊपर कोई खंड चुनें।",
    "Thematic analysis":"विषयगत विश्लेषण", "questions":"प्रश्न", "per year on average":"प्रति वर्ष औसतन", "of the paper":"प्रश्नपत्र का", "Year by year":"वर्ष-दर-वर्ष",
    "Questions per topic in each selected year. Darker means more.":"हर चुने गए वर्ष में प्रति टॉपिक प्रश्न। गहरा रंग यानी ज़्यादा।",
    "Test":"टेस्ट", "Finish and see result":"समाप्त करें और परिणाम देखें", "Green right · pink wrong · grey seen · underline bookmarked":"हरा सही · गुलाबी गलत · धूसर देखा गया · रेखांकित बुकमार्क",
    "Practice result":"अभ्यास का परिणाम", "Test result":"टेस्ट का परिणाम", "Review wrong":"गलत उत्तर दोबारा देखें", "Reset and retry":"मिटाकर फिर से करें",
    "Prelims paper":"प्रीलिम्स प्रश्नपत्र", "Which questions":"कौन से प्रश्न", "Order":"क्रम", "Time spent":"लगा समय", "More years coming":"और वर्ष जल्द",
    "CSAT · Paper II":"CSAT · प्रश्नपत्र II", "Choose at least one year to see the analysis.":"विश्लेषण देखने के लिए कम से कम एक वर्ष चुनें।",
    "No questions in this selection.":"इस चयन में कोई प्रश्न नहीं।", "Clear your answers for the questions in this selection?":"इस चयन के प्रश्नों के आपके उत्तर मिटा दें?",
    "Accuracy":"सटीकता", "Total marks":"कुल अंक", "Marks for correct":"सही उत्तरों के अंक", "Negative marks":"ऋणात्मक अंक", "Final score":"अंतिम स्कोर",
    "Dropped by UPSC (not scored)":"UPSC द्वारा हटाए गए (अंक नहीं)", "Back to test":"टेस्ट पर लौटें", "Finish ›":"समाप्त ›", "Select a year":"कोई वर्ष चुनें",
    "UPSC dropped this question; it carries no marks.":"UPSC ने यह प्रश्न हटा दिया; इसके कोई अंक नहीं हैं।", "Explanation (PYQ Astra)":"व्याख्या (PYQ Astra)",
    "Note on the official answer":"आधिकारिक उत्तर पर टिप्पणी", "Show answer without attempting":"बिना हल किए उत्तर देखें", "Dropped":"हटाया गया",
    "This answer is from UPSC's provisional key and may change when the final key is released.":"यह उत्तर UPSC की अनंतिम कुंजी से है और अंतिम कुंजी जारी होने पर बदल सकता है।",
    "Directions":"निर्देश", "Passage":"गद्यांश", "Review · answered wrong":"दोबारा देखें · गलत उत्तर", "all subjects":"सभी विषय", "all sections":"सभी खंड",
    "not attempted":"हल नहीं किए", "answered wrong":"गलत उत्तर", "no years":"कोई वर्ष नहीं", "Hindi coming soon":"हिंदी में जल्द",

    // prelims
    "Search Prelims questions":"प्रीलिम्स प्रश्न खोजें", "Prelims papers and answer keys":"प्रीलिम्स प्रश्नपत्र और उत्तर कुंजियाँ", "paper + key":"प्रश्नपत्र + कुंजी",
    "paper, key awaited":"प्रश्नपत्र, कुंजी प्रतीक्षित", "key only":"केवल कुंजी", "‹ All years":"‹ सभी वर्ष", "‹ Papers":"‹ प्रश्नपत्र",
    "General Studies I":"सामान्य अध्ययन I", "General Studies II (CSAT)":"सामान्य अध्ययन II (CSAT)", "Question paper":"प्रश्नपत्र", "Answer key":"उत्तर कुंजी",
    "Paper coming soon":"प्रश्नपत्र जल्द", "Key not yet released":"कुंजी अभी जारी नहीं हुई", "What this paper asked":"इस प्रश्नपत्र में क्या पूछा गया",
    "Subject counts use the tags on the Practice page.":"विषयों की गिनती अभ्यास पेज के टैग से है।", "Section counts use the tags on the Practice page.":"खंडों की गिनती अभ्यास पेज के टैग से है।",
    "This year is not on the Practice page yet.":"यह वर्ष अभी अभ्यास पेज पर नहीं है।",
    "Keys cover every booklet series; match the key to the series printed on your paper.":"कुंजियों में हर पुस्तिका सीरीज़ शामिल है; अपने प्रश्नपत्र पर छपी सीरीज़ से कुंजी मिलाएँ।",
    "This paper decides your Prelims cut-off. Negative marking: one-third of the marks for a question are deducted for each wrong answer.":"यही प्रश्नपत्र आपका प्रीलिम्स कट-ऑफ़ तय करता है। ऋणात्मक अंकन: हर गलत उत्तर पर उस प्रश्न के एक-तिहाई अंक काटे जाते हैं।",
    "Qualifying since 2015: you need 33% (66 marks) and the score does not count toward the cut-off. In 2013 and 2014 it was added to the merit score. Negative marking: one-third per wrong answer.":"2015 से क्वालिफ़ाइंग: 33% (66 अंक) चाहिए और इसके अंक कट-ऑफ़ में नहीं जुड़ते। 2013 और 2014 में यह मेरिट स्कोर में जोड़ा गया था। ऋणात्मक अंकन: हर गलत उत्तर पर एक-तिहाई।",
    "100 questions · 200 marks · 2 hours.":"100 प्रश्न · 200 अंक · 2 घंटे।", "80 questions · 200 marks · 2 hours.":"80 प्रश्न · 200 अंक · 2 घंटे।",
    "Checking which papers are available…":"देख रहे हैं कि कौन से प्रश्नपत्र उपलब्ध हैं…", "No papers uploaded yet for this paper.":"इस प्रश्नपत्र के लिए अभी कोई फ़ाइल नहीं है।",
    "Loading questions…":"प्रश्न लोड हो रहे हैं…", "The question list could not be loaded. Check your connection and try again.":"प्रश्न सूची लोड नहीं हो सकी। अपना कनेक्शन जाँचें और फिर कोशिश करें।",
    "Clear search":"खोज हटाएँ", "Subject":"विषय", "Years":"वर्ष", "Prelims papers":"प्रीलिम्स प्रश्नपत्र", "Official answer key":"आधिकारिक उत्तर कुंजी",
    "Provisional answer key":"अनंतिम उत्तर कुंजी", "Dropped by UPSC":"UPSC द्वारा हटाया गया", "may change when the final key is released":"अंतिम कुंजी जारी होने पर बदल सकता है",

    // sign-in (auth.js)
    "Sign in":"साइन इन", "Sign in with Google":"Google से साइन इन करें", "Sign in with Google to save your progress":"अपनी प्रगति सहेजने के लिए Google से साइन इन करें",
    "Your progress":"आपकी प्रगति", "Mains done":"मेन्स हुए", "Mains saved":"मेन्स सहेजे", "By subject":"विषयवार", "Delete my data":"मेरा डेटा मिटाएँ", "Sign out":"साइन आउट",
    "Start practising":"अभ्यास शुरू करें", "Student":"विद्यार्थी", "Continue with Google":"Google के साथ जारी रखें",
    "You haven't answered any questions yet. Your answers will be saved to your account as you practise.":"आपने अभी तक कोई प्रश्न हल नहीं किया है। अभ्यास करते समय आपके उत्तर आपके खाते में सहेजे जाएँगे।",
    "Sign up free to download papers":"प्रश्नपत्र डाउनलोड करने के लिए मुफ़्त साइन अप करें", "Download every UPSC Prelims and Mains paper and answer key as a PDF.":"UPSC प्रीलिम्स और मेन्स के सभी प्रश्नपत्र और उत्तर कुंजियाँ PDF में डाउनलोड करें।",
    "Sign up free to solve questions":"प्रश्न हल करने के लिए मुफ़्त साइन अप करें", "Practise 1,300 Prelims questions with instant marking, explanations and a score card.":"1,300 प्रीलिम्स प्रश्नों का अभ्यास करें, तुरंत अंक, व्याख्या और स्कोर कार्ड के साथ।",
    "Sign up free to track your practice":"अपना अभ्यास ट्रैक करने के लिए मुफ़्त साइन अप करें", "Mark questions as practised, bookmark tough ones and see your progress on any device.":"प्रश्नों को 'अभ्यास हुआ' चिह्नित करें, कठिन प्रश्न बुकमार्क करें और किसी भी डिवाइस पर अपनी प्रगति देखें।",
    "Free, no payment ever":"मुफ़्त, कभी कोई भुगतान नहीं", "One tap with your Google account":"अपने Google खाते से एक टैप में", "Your progress saved across phone and laptop":"आपकी प्रगति फ़ोन और लैपटॉप दोनों पर सहेजी जाती है",
    "You can keep browsing every question without an account.":"आप बिना खाते के भी सभी प्रश्न देख सकते हैं।",
    "Sign-in failed. Please try again.":"साइन इन नहीं हो सका। कृपया फिर कोशिश करें।", "Could not delete your data. Please try again.":"आपका डेटा नहीं मिटाया जा सका। कृपया फिर कोशिश करें।",
    "Permanently delete all your saved progress from PYQ Astra? This cannot be undone.":"PYQ Astra से अपनी सारी सहेजी गई प्रगति हमेशा के लिए मिटा दें? इसे वापस नहीं किया जा सकता।",

    // privacy
    "Privacy policy":"गोपनीयता नीति", "Last updated: 27 September 2026":"अंतिम अपडेट: 27 सितंबर 2026",
    "PYQ Astra (pyqastra.com) is a free study site for UPSC Civil Services aspirants. This page explains what we store and why.":"PYQ Astra (pyqastra.com) UPSC सिविल सेवा अभ्यर्थियों के लिए एक मुफ़्त अध्ययन साइट है। यह पेज बताता है कि हम क्या सहेजते हैं और क्यों।",
    "Without an account":"बिना खाते के",
    "You can browse every page and question without an account. Downloading papers and solving questions need a free account. Your light/dark theme choice is stored only in your own browser (local storage).":"आप बिना खाते के हर पेज और प्रश्न देख सकते हैं। प्रश्नपत्र डाउनलोड करने और प्रश्न हल करने के लिए मुफ़्त खाता चाहिए। आपकी लाइट/डार्क थीम और भाषा की पसंद केवल आपके अपने ब्राउज़र (local storage) में रहती है।",
    "When you sign in with Google":"जब आप Google से साइन इन करते हैं", "Sign-up and sign-in are handled by Google Firebase Authentication. We receive:":"साइन अप और साइन इन Google Firebase Authentication से होता है। हमें मिलता है:",
    "your name, email address and profile photo from your Google account, and":"आपके Google खाते से आपका नाम, ईमेल पता और प्रोफ़ाइल फ़ोटो, और", "a unique account ID created by Firebase.":"Firebase द्वारा बनाई गई एक विशिष्ट खाता ID।",
    "We then save your practice progress to Google Cloud Firestore under that account ID, so it is available on any device you sign in on. This includes the Prelims questions you answered and the option you chose, your bookmarks, the Mains questions you marked as practised, summary counts (questions attempted, correct, wrong, by subject), your name and the time of your last update.":"फिर हम आपकी अभ्यास प्रगति उसी खाता ID के तहत Google Cloud Firestore में सहेजते हैं, ताकि जिस भी डिवाइस पर आप साइन इन करें, वह वहाँ मिले। इसमें आपके हल किए प्रीलिम्स प्रश्न और चुना गया विकल्प, आपके बुकमार्क, 'अभ्यास हुआ' चिह्नित मेन्स प्रश्न, सारांश गिनती (हल किए, सही, गलत, विषयवार), आपका नाम और आखिरी अपडेट का समय शामिल है।",
    "How we use it":"हम इसका उपयोग कैसे करते हैं", "To show you your own progress and keep it in sync across devices.":"आपको आपकी प्रगति दिखाने और उसे सभी डिवाइस पर सिंक रखने के लिए।",
    "To understand, in aggregate, how the site is used so we can improve it.":"कुल मिलाकर यह समझने के लिए कि साइट का उपयोग कैसे होता है, ताकि हम उसे बेहतर बना सकें।",
    "We do not sell your data, show ads based on it, or share it with anyone except Google, which stores it for us as our service provider. Only you and the site owner can see your progress. Other students cannot.":"हम आपका डेटा नहीं बेचते, उसके आधार पर विज्ञापन नहीं दिखाते, और Google के अलावा किसी से साझा नहीं करते, जो हमारे सेवा प्रदाता के रूप में इसे सहेजता है। आपकी प्रगति केवल आप और साइट के मालिक देख सकते हैं। दूसरे विद्यार्थी नहीं।",
    "Other services":"अन्य सेवाएँ", "Pages load fonts from Google Fonts. Question papers are hosted on GitHub Pages. These services may log basic technical information such as your IP address, as any web server does.":"पेज Google Fonts से फ़ॉन्ट लोड करते हैं। प्रश्नपत्र GitHub Pages पर होस्ट हैं। ये सेवाएँ, किसी भी वेब सर्वर की तरह, आपके IP पते जैसी बुनियादी तकनीकी जानकारी दर्ज कर सकती हैं।",
    "Deleting your data":"अपना डेटा मिटाना", "Sign in, tap your photo at the top of any page, and choose":"साइन इन करें, किसी भी पेज के ऊपर अपनी फ़ोटो पर टैप करें, और चुनें",
    ". This permanently removes your saved progress from our database and signs you out. You can also remove PYQ Astra's access at":"। इससे आपकी सहेजी गई प्रगति हमारे डेटाबेस से हमेशा के लिए हट जाती है और आप साइन आउट हो जाते हैं। आप PYQ Astra की पहुँच यहाँ से भी हटा सकते हैं:",
    "Children":"बच्चे", "PYQ Astra is meant for adults preparing for the UPSC Civil Services Examination and is not directed at children under 18.":"PYQ Astra UPSC सिविल सेवा परीक्षा की तैयारी कर रहे वयस्कों के लिए है और 18 वर्ष से कम उम्र के बच्चों के लिए नहीं है।",
    "Changes":"बदलाव", "If we change this policy, we will update the date at the top of this page.":"अगर हम यह नीति बदलते हैं, तो इस पेज के ऊपर की तारीख अपडेट करेंगे।",

    // 404
    "This page isn't here":"यह पेज यहाँ नहीं है", "The link may be old or mistyped. Everything on PYQ Astra is reachable from the pages below.":"लिंक पुराना या गलत टाइप हो सकता है। PYQ Astra की हर चीज़ नीचे दिए पेजों से मिल जाएगी।",

    // titles
    "UPSC PYQ: Prelims & Mains Previous Year Questions (2013–2026) with Answer Keys | PYQ Astra":"UPSC PYQ: प्रीलिम्स और मेन्स के पिछले वर्षों के प्रश्न (2013–2026) उत्तर कुंजी सहित | PYQ Astra",
    "UPSC Prelims PYQ Practice Test Online with Answers | PYQ Astra":"UPSC प्रीलिम्स PYQ ऑनलाइन प्रैक्टिस टेस्ट, उत्तर सहित | PYQ Astra",
    "UPSC CSAT PYQ Practice Test Online with Answers | PYQ Astra":"UPSC CSAT PYQ ऑनलाइन प्रैक्टिस टेस्ट, उत्तर सहित | PYQ Astra",
    "Privacy policy — PYQ Astra":"गोपनीयता नीति — PYQ Astra", "Page not found — PYQ Astra":"पेज नहीं मिला — PYQ Astra"
  };
  var D = {}; for (var k in SUBJ) D[k] = SUBJ[k]; for (k in UI) D[k] = UI[k];

  var R = { I:'I', II:'II', III:'III', IV:'IV' };
  var PATTERNS = [
    [/^([\d,]+) questions?$/, '$1 प्रश्न'], [/^([\d,]+) GS I questions$/, 'GS I के $1 प्रश्न'], [/^([\d,]+) questions across GS I–IV$/, 'GS I–IV में $1 प्रश्न'],
    [/^Start test · (\d+)$/, 'टेस्ट शुरू करें · $1'], [/^Start · (\d+) questions?$/, 'शुरू करें · $1 प्रश्न'],
    [/^Resume test \((\d+) of (\d+)\)$/, 'टेस्ट जारी रखें ($1 / $2)'], [/^Resume \((\d+) of (\d+)\)$/, 'जारी रखें ($1 / $2)'],
    [/^Question (\d+) of (\d+)$/, 'प्रश्न $1 / $2'], [/^Question (\d+)$/, 'प्रश्न $1'], [/^(\d+) left$/, '$1 बाकी'],
    [/^Correct\. \+([\d.]+) marks$/, 'सही। +$1 अंक'], [/^Wrong\. The official answer is \(([a-d])\)\. −([\d.]+) marks$/, 'गलत। आधिकारिक उत्तर ($1) है। −$2 अंक'],
    [/^Official answer: \(([a-d])\)$/, 'आधिकारिक उत्तर: ($1)'], [/^marks scored out of ([\d.]+)$/, '$1 में से प्राप्त अंक'], [/^Answer \(([a-d])\)$/, 'उत्तर ($1)'],
    [/^Bookmark (\d{4}) Q(\d+)$/, '$1 Q$2 बुकमार्क करें'], [/^(\d+) practised, (\d+) to go$/, '$1 का अभ्यास हुआ, $2 बाकी'], [/^(\d+) practised \((\d+)%\)$/, '$1 का अभ्यास हुआ ($2%)'],
    [/^Show (\d{4})$/, '$1 दिखाएँ'], [/^(\d+) topics?$/, '$1 टॉपिक'], [/^(\d+) years$/, '$1 वर्ष'], [/^(\d+(?:\.\d+)?) marks$/, '$1 अंक'], [/^(\d+) words$/, '$1 शब्द'],
    [/^Show (\d+) more of (\d+) remaining$/, 'बाकी $2 में से $1 और दिखाएँ'], [/^Practise (\d{4}) online →$/, '$1 ऑनलाइन अभ्यास करें →'],
    [/^Download (\d{4}) paper$/, '$1 का प्रश्नपत्र डाउनलोड करें'], [/^Download (\d{4}) (GS\d) paper$/, '$1 $2 प्रश्नपत्र डाउनलोड करें'],
    [/^‹ Back to question (\d+)$/, '‹ प्रश्न $1 पर लौटें'], [/^GS Paper (I|II|III|IV)$/, 'सामान्य अध्ययन प्रश्नपत्र $1'], [/^General Studies (I|II|III|IV)$/, 'सामान्य अध्ययन $1'],
    [/^GS Paper (I|II|III|IV), (\d{4}), Q(\d+)$/, 'सामान्य अध्ययन प्रश्नपत्र $1, $2, Q$3'], [/^(GS\d) Mains PYQs — PYQ Astra$/, '$1 मेन्स PYQ — PYQ Astra'],
    [/^Prelims (GS I|CSAT) — PYQ Astra$/, 'प्रीलिम्स $1 — PYQ Astra'], [/^Search (GS I|CSAT) questions, e\.g\. (.+)$/, '$1 के प्रश्न खोजें, जैसे $2'],
    [/^No (GS I|CSAT) question matches that\..*$/, 'कोई $1 प्रश्न मेल नहीं खाता। छोटा शब्द, दूसरी वर्तनी आज़माएँ, या वर्ष और विषय के फ़िल्टर हटाएँ।'],
    [/^No answer counted in the official answer key$/, 'आधिकारिक उत्तर कुंजी में कोई उत्तर नहीं गिना गया'],
    [/^Prelims questions? practised$/, 'प्रीलिम्स प्रश्नों का अभ्यास किया'],
    [/^(\d+) questions from GS Paper I \(([^)]+)\), tagged by subject and topic\..*$/, '$1 प्रश्न, सामान्य अध्ययन प्रश्नपत्र I ($2) से, विषय और टॉपिक के अनुसार। कोई विषय चुनें, अपने वर्ष और टॉपिक चुनें, देखें UPSC इन्हें कितनी बार पूछता है, फिर टेस्ट शुरू करें: एक बार में एक प्रश्न, आधिकारिक उत्तर कुंजी से तुरंत जाँचा हुआ।'],
    [/^(\d+) questions from CSAT, Paper II \(([^)]+)\), tagged by section and topic.*$/, '$1 प्रश्न, CSAT प्रश्नपत्र II ($2) से, खंड और टॉपिक के अनुसार: बोधगम्यता, मात्रात्मक अभियोग्यता, तर्कशक्ति और बहुत कुछ। कोई खंड चुनें, अपने वर्ष और टॉपिक चुनें, फिर टेस्ट शुरू करें। आधिकारिक उत्तर कुंजी से तुरंत जाँच, प्रति प्रश्न 2.5 अंक और एक-तिहाई ऋणात्मक अंकन।'],
    [/^(\d+) questions? practised$/, '$1 प्रश्नों का अभ्यास हुआ']
  ];
  // patterns with a translatable part
  var FN = [
    [/^(\d+) questions from (\d{4}) to (\d{4})\. (.+)$/, function(m){ return m[1]+' प्रश्न, '+m[2]+' से '+m[3]+' तक। '+tr(m[4]); }],
    [/^(.+), (\d+) years \((\d{4})–(\d{4})\)$/, function(m){ return D[m[1]] ? D[m[1]]+', '+m[2]+' वर्ष ('+m[3]+'–'+m[4]+')' : null; }],
    [/^(.+), (\d{4})(?:: (\d+) questions?)?$/, function(m){ return D[m[1]] ? D[m[1]]+', '+m[2]+(m[3]!=null ? ': '+m[3]+' प्रश्न' : '') : null; }],
    [/^(.+) — your progress$/, function(m){ return m[1]+' — आपकी प्रगति'; }]
  ];

  function tr(s){
    if (D[s] != null) return D[s];
    for (var i=0;i<PATTERNS.length;i++) if (PATTERNS[i][0].test(s)) return s.replace(PATTERNS[i][0], PATTERNS[i][1]);
    for (i=0;i<FN.length;i++){ var m=s.match(FN[i][0]); if (m){ var r=FN[i][1](m); if (r!=null) return r; } }
    // "A · B · C": translate each piece
    if (s.indexOf(' · ')>0){ var parts=s.split(' · '), ch=false;
      for (i=0;i<parts.length;i++){ var t=tr(parts[i]); if (t!==parts[i]){ parts[i]=t; ch=true; } }
      if (ch) return parts.join(' · '); }
    // several sentences, each known
    var ss = s.split(/(?<=[.?!]) (?=[A-Z])/);
    if (ss.length>1){ var all=true; for (i=0;i<ss.length;i++){ var u=tr(ss[i]); if (u===ss[i]){ all=false; break; } ss[i]=u; } if (all) return ss.join(' '); }
    // "Topic A, Topic B" made of known topics
    if (s.indexOf(', ')>0){ var ps=s.split(', '), ok=true; for (i=0;i<ps.length;i++){ if (SUBJ[ps[i]]==null){ ok=false; break; } }
      if (ok) return ps.map(function(p){ return SUBJ[p]; }).join(', '); }
    return s;
  }
  function trText(raw){
    var s = raw.replace(/\s+/g,' ').trim(); if (!s || !/[A-Za-z]/.test(s)) return null;
    var t = tr(s); if (t===s) return null;
    var lead = /^\s/.test(raw) ? ' ' : '', tail = /\s$/.test(raw) ? ' ' : '';
    return lead + t + tail;
  }

  var SKIP = { SCRIPT:1, STYLE:1, TEXTAREA:1, CODE:1, PRE:1, KBD:1, NOSCRIPT:1 };
  var ATTRS = ['placeholder','aria-label','title','alt'];
  function skip(el){ for (; el && el.nodeType===1; el=el.parentNode){ if (SKIP[el.tagName] || el.hasAttribute('data-no-i18n')) return true; } return false; }
  function doText(n){
    if (skip(n.parentNode)) return;
    var p = n.parentNode;
    if (p && p.tagName==='OPTION' && !p.hasAttribute('value')) p.setAttribute('value', p.textContent);   // keep the English value the page reads
    var t = trText(n.nodeValue); if (t!=null) n.nodeValue = t;
  }
  function doAttrs(el){
    if (skip(el)) return;
    for (var i=0;i<ATTRS.length;i++){ var a=el.getAttribute(ATTRS[i]); if (a){ var t=trText(a); if (t!=null) el.setAttribute(ATTRS[i], t.trim()); } }
    if (el.tagName==='OPTGROUP' && el.label){ var g=trText(el.label); if (g!=null) el.label=g.trim(); }
  }
  function walk(node){
    if (node.nodeType===3) return doText(node);
    if (node.nodeType!==1 || SKIP[node.tagName]) return;
    doAttrs(node);
    var tw = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT), n;
    while ((n = tw.nextNode())) { if (n.nodeType===3) doText(n); else doAttrs(n); }
  }
  function title(){ var t = trText(document.title); if (t!=null) document.title = t.trim(); }

  /* ---------- Hindi question text ---------- */
  // window.PRE.years[y].questions[] (practice.html)
  function preHindi(years){
    var H = window.PRE_HI; if (L!=='hi' || !H) return;
    for (var y in years){ var h = H[y]; if (!h) continue;
      years[y].questions.forEach(function(q){ var x = h[q.n]; if (x){ q.q = x[0]; q.o = x[1]; q.hi = 1; } }); }
  }
  // window.PRE_SEARCH.qs rows [year, qno, subject, topic, question, options, answer] (prelims.html)
  function hiRows(X){
    var H = window.PRE_HI; if (L!=='hi' || !H || !X || X._hi) return; X._hi = 1;
    X.qs.forEach(function(r){ var x = H[r[0]] && H[r[0]][r[1]]; if (x){ r[4] = x[0]; r[5] = x[1]; r.hi = 1; } });
  }

  /* ---------- the switch ---------- */
  function setLang(v){ try { localStorage.setItem('pyq-lang', v); } catch(e){} location.reload(); }
  function addSwitch(){
    var hr = document.querySelector('.head-right'); if (!hr || hr.querySelector('.lang-sw')) return;
    var w = document.createElement('div'); w.className = 'lang-sw'; w.setAttribute('role','group'); w.setAttribute('aria-label','Language / भाषा'); w.setAttribute('data-no-i18n','');
    w.innerHTML = '<button type="button" data-l="en" lang="en" aria-pressed="'+(L==='en')+'">EN</button><button type="button" data-l="hi" lang="hi" aria-pressed="'+(L==='hi')+'">हिंदी</button>';
    w.addEventListener('click', function(e){ var b = e.target.closest('button'); if (b && b.dataset.l!==L) setLang(b.dataset.l); });
    var tt = document.getElementById('themeToggle'); hr.insertBefore(w, tt && tt.parentNode===hr ? tt : null);
  }
  var css = document.createElement('style');
  css.textContent = '.lang-sw{display:flex;background:var(--surface);border:1px solid var(--rule);border-radius:999px;padding:3px;box-shadow:var(--shadow);flex:none}'
    + '.lang-sw button{border:0;background:none;font:inherit;font-size:12.5px;font-weight:700;color:var(--muted);padding:5px 9px;border-radius:999px;cursor:pointer;line-height:1.2}'
    + '.lang-sw button[aria-pressed="true"]{background:var(--violet,#6b4fd8);color:var(--on-accent,#fff)}'
    + '.lang-sw button[lang="hi"]{font-family:"Noto Sans Devanagari",var(--body,sans-serif)}'
    + '@media (max-width:480px){.lang-sw button{padding:4px 7px;font-size:12px}}'
    + '.hi-soon{background:var(--surface-2)!important;color:var(--faint)!important;font-family:"Noto Sans Devanagari",var(--body,sans-serif)}'
    + 'html[data-lang="hi"] body{font-family:var(--body),"Noto Sans Devanagari",sans-serif}'
    + 'html[data-lang="hi"] .display,html[data-lang="hi"] h1,html[data-lang="hi"] h2,html[data-lang="hi"] h3{font-family:var(--display),"Noto Sans Devanagari",serif}'
    + '.i18n-wait body{visibility:hidden}'
    + '.hi-note{margin:14px 0 0;padding:10px 14px;border-radius:12px;background:var(--surface-2);color:var(--muted);font-size:14px;line-height:1.6}';
  document.head.appendChild(css);

  if (L==='hi'){
    root.lang = 'hi';
    root.classList.add('i18n-wait'); setTimeout(function(){ root.classList.remove('i18n-wait'); }, 2500);   // no flash of English while the page renders
    var f = document.createElement('link'); f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap';
    document.head.appendChild(f);
    // alerts and confirms raised by the page
    var ac = window.confirm, aa = window.alert;
    window.confirm = function(m){ return ac.call(window, tr(String(m))); };
    window.alert = function(m){ return aa.call(window, tr(String(m))); };
  }

  function start(){
    addSwitch();
    if (L!=='hi') return;
    walk(document.body); title(); root.classList.remove('i18n-wait');
    new MutationObserver(function(ms){
      for (var i=0;i<ms.length;i++){ var m=ms[i];
        if (m.type==='childList') for (var j=0;j<m.addedNodes.length;j++) walk(m.addedNodes[j]);
        else if (m.type==='characterData') doText(m.target);
        else if (m.type==='attributes') doAttrs(m.target);
      }
    }).observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:ATTRS });
    var te = document.querySelector('title');
    if (te) new MutationObserver(title).observe(te, { childList:true, characterData:true, subtree:true });
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.PYQ_I18N = { lang:L, t:function(s){ return L==='hi' ? tr(s) : s; }, preHindi:preHindi, hiRows:hiRows, set:setLang };
})();
