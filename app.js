// ════════════════════════════════════════════════════════
// DATA — defaults (sẽ bị Supabase ghi đè nếu đã cấu hình)
// ════════════════════════════════════════════════════════
const CAT_META={
  patient:  {l:'Bệnh nhân',     ic:'👤', c:'var(--c1)'},
  colleague:{l:'Đồng nghiệp',   ic:'👥', c:'var(--c2)'},
  handover: {l:'Bàn giao ca',   ic:'🔄', c:'var(--c3)'},
  emergency:{l:'Khẩn cấp',      ic:'🚨', c:'var(--c4)'},
  vocab:    {l:'Chuyên ngành',  ic:'📚', c:'var(--c5)'},
  anatomy:  {l:'Giải phẫu',     ic:'🫀', c:'var(--c6)'},
  medication:{l:'Thuốc & ĐT',   ic:'💊', c:'var(--c7)'},
  documentation:{l:'Hồ sơ',     ic:'📋', c:'var(--c8)'},
  nursing_process:{l:'Quy trình ĐD',ic:'🩺',c:'var(--pink)'},
  mental:   {l:'Tâm thần & Lão',ic:'🧠', c:'var(--purple)'},
};
const PHRASE_CATS=['patient','colleague','handover','emergency'];
const VOCAB_CATS=['vocab','anatomy','medication','documentation','nursing_process','mental'];
let _dynCats=[];
let _topics=[];
let _activeTopic=null;
let _dataFromDB=false;
let _bookmarks=new Set();
// XSS sanitizer — dùng cho mọi nội dung từ DB trước khi đưa vào innerHTML
function sanitize(s){if(typeof s!=='string')return String(s||'');return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function loadBookmarks(){try{_bookmarks=new Set(JSON.parse(localStorage.getItem('pd-bookmarks')||'[]'));}catch(e){_bookmarks=new Set();}updateBmBadge();}
function saveBookmarks(){localStorage.setItem('pd-bookmarks',JSON.stringify([..._bookmarks]));}
function updateBmBadge(){const el=document.getElementById('cnt-bookmarks');if(el)el.textContent=_bookmarks.size||'';}
function toggleBookmark(de,btn){
  if(_bookmarks.has(de)){_bookmarks.delete(de);if(btn){btn.textContent='🤍';btn.classList.remove('active');btn.title='Thêm yêu thích';}}
  else{_bookmarks.add(de);if(btn){btn.textContent='❤️';btn.classList.add('active');btn.title='Bỏ yêu thích';}}
  saveBookmarks();updateBmBadge();
  window._scheduleCloudSave?.(); // debounced cloud save for logged-in users
  const bp=document.getElementById('page-bookmarks');
  if(bp&&bp.classList.contains('active'))renderBookmarksPage();
}
loadBookmarks(); // true after first Supabase loadAll() succeeds

// Compact DATA — representative subset (full version has 300+ items)
let DATA={
patient:[
  {g:"Chào hỏi",i:[
    {de:"Guten Morgen! Wie geht es Ihnen heute?",vi:"Chào buổi sáng! Hôm nay bạn thế nào?"},
    {de:"Mein Name ist ___, ich bin Ihre Pflegefachkraft.",vi:"Tôi là ___, điều dưỡng phụ trách bạn."},
    {de:"Ich übernehme jetzt Ihre Pflege.",vi:"Từ bây giờ tôi sẽ chăm sóc cho bạn."},
    {de:"Ich bin heute für Sie zuständig.",vi:"Hôm nay tôi là người phụ trách bạn."},
    {de:"Darf ich mich kurz vorstellen?",vi:"Cho phép tôi tự giới thiệu một chút?"},
  ]},
  {g:"Hỏi triệu chứng",i:[
    {de:"Haben Sie Schmerzen? Wo genau?",vi:"Bạn có đau không? Đau ở đâu?"},
    {de:"Wie stark auf einer Skala von 1 bis 10?",vi:"Mức độ đau từ 1 đến 10?"},
    {de:"Ist der Schmerz stechend / dumpf / brennend?",vi:"Đau nhói / âm ỉ / rát bỏng?"},
    {de:"Strahlt der Schmerz irgendwo hin aus?",vi:"Cơn đau có lan ra đâu không?"},
    {de:"Seit wann haben Sie diese Beschwerden?",vi:"Triệu chứng này từ bao giờ?"},
    {de:"Haben Sie Atemnot / Übelkeit / Schwindel?",vi:"Bạn có khó thở / buồn nôn / chóng mặt không?"},
    {de:"Haben Sie Fieber oder Schüttelfrost?",vi:"Bạn có sốt hoặc rét run không?"},
    {de:"Haben Sie Husten oder Auswurf?",vi:"Bạn có ho hoặc khạc đờm không?"},
    {de:"Schlafen Sie gut?",vi:"Bạn ngủ có ngon không?"},
    {de:"Haben Sie heute schon gegessen und getrunken?",vi:"Hôm nay bạn đã ăn và uống chưa?"},
  ]},
  {g:"Thủ thuật & Chăm sóc",i:[
    {de:"Ich messe jetzt Ihren Blutdruck.",vi:"Tôi sẽ đo huyết áp cho bạn."},
    {de:"Ich nehme Ihre Körpertemperatur.",vi:"Tôi sẽ đo nhiệt độ cơ thể."},
    {de:"Ich messe Ihren Blutzucker.",vi:"Tôi sẽ đo đường huyết."},
    {de:"Ich gebe Ihnen jetzt Ihre Medikamente.",vi:"Bây giờ tôi cho bạn uống thuốc."},
    {de:"Ich muss Ihnen eine Spritze geben.",vi:"Tôi cần tiêm cho bạn.",n:"Thêm: 'Das tut kurz weh' = đau một chút"},
    {de:"Ich lege Ihnen einen Venenzugang.",vi:"Tôi sẽ đặt đường truyền tĩnh mạch."},
    {de:"Ich wechsle jetzt Ihren Verband.",vi:"Tôi sẽ thay băng cho bạn."},
    {de:"Bitte bleiben Sie ruhig liegen.",vi:"Xin hãy nằm yên."},
    {de:"Können Sie sich auf die Seite drehen?",vi:"Bạn có thể nằm nghiêng không?"},
    {de:"Ich helfe Ihnen beim Aufstehen.",vi:"Tôi sẽ giúp bạn ngồi dậy."},
    {de:"Bitte atmen Sie tief ein und aus.",vi:"Xin hít vào và thở ra thật sâu."},
  ]},
  {g:"Vệ sinh & Dinh dưỡng",i:[
    {de:"Möchten Sie sich waschen? Ich helfe Ihnen.",vi:"Bạn muốn tắm rửa không? Tôi giúp bạn."},
    {de:"Brauchen Sie die Bettpfanne / Urinflasche?",vi:"Bạn cần bô / bình tiểu không?"},
    {de:"Klingeln Sie bitte, wenn Sie etwas brauchen.",vi:"Nếu cần gì hãy bấm chuông nhé."},
    {de:"Haben Sie Allergien gegen Lebensmittel?",vi:"Bạn có dị ứng thức ăn nào không?"},
    {de:"Bitte trinken Sie ausreichend – 1,5 Liter täglich.",vi:"Hãy uống đủ nước – 1,5 lít mỗi ngày."},
    {de:"Erholen Sie sich gut!",vi:"Chúc bạn mau bình phục!"},
  ]},
],
colleague:[
  {g:"Giao tiếp chung",i:[
    {de:"Können Sie mir kurz helfen?",vi:"Bạn giúp tôi một chút được không?"},
    {de:"Ich brauche Unterstützung bei Zimmer ___.",vi:"Tôi cần hỗ trợ ở phòng ___."},
    {de:"Das liegt außerhalb meiner Kompetenz.",vi:"Điều đó nằm ngoài thẩm quyền của tôi.",n:"Quan trọng khi gặp tình huống vượt khả năng"},
    {de:"Ich informiere den Arzt sofort.",vi:"Tôi sẽ báo bác sĩ ngay."},
    {de:"Haben Sie das schon dokumentiert?",vi:"Bạn đã ghi vào hồ sơ chưa?"},
  ]},
  {g:"Báo cáo SBAR",i:[
    {de:"Ich möchte Ihnen einen Patienten vorstellen.",vi:"Tôi muốn báo cáo về một bệnh nhân."},
    {de:"Patient ___, ___ Jahre, Zimmer ___.",vi:"Bệnh nhân ___, ___ tuổi, phòng ___."},
    {de:"Aufnahme wegen ___. Aktuell klagt er über ___.",vi:"Nhập viện vì ___. Hiện than thở về ___."},
    {de:"Vitalzeichen: RR ___, Puls ___, Temp ___, SpO2 ___.",vi:"Sinh hiệu: HA ___, mạch ___, nhiệt độ ___, SpO2 ___."},
    {de:"Ich bitte um eine Anordnung für ___.",vi:"Tôi xin chỉ định cho ___."},
    {de:"Bitte schauen Sie sich den Patienten an.",vi:"Nhờ bác sĩ xem qua bệnh nhân."},
    {de:"Habe ich das richtig verstanden?",vi:"Tôi hiểu đúng chưa?"},
    {de:"Können Sie das bitte wiederholen?",vi:"Bạn có thể nhắc lại không?"},
  ]},
],
handover:[
  {g:"Cấu trúc SBAR",i:[
    {de:"S: Patient ___, ___ Jahre, Zimmer ___, aufgenommen wegen ___.",vi:"S: BN ___, ___ tuổi, phòng ___, nhập vì ___."},
    {de:"B: Vorerkrankungen: ___. Dauermedikation: ___.",vi:"B: Bệnh nền: ___. Thuốc dùng thường xuyên: ___."},
    {de:"A: Aktuell ist der Patient stabil / instabil.",vi:"A: BN hiện đang ổn định / không ổn định."},
    {de:"R: Bitte achten Sie besonders auf ___.",vi:"R: Nhờ chú ý đặc biệt đến ___."},
  ]},
  {g:"Nội dung bàn giao",i:[
    {de:"Die Medikamente wurden vollständig gegeben.",vi:"Thuốc đã được cho đầy đủ."},
    {de:"Die Abendmedikation steht noch aus.",vi:"Thuốc buổi tối vẫn chưa cho."},
    {de:"Die Infusion läuft mit ___ ml/h, Rest ___ ml.",vi:"Dịch truyền ___ ml/h, còn lại ___ ml."},
    {de:"Der Verband wurde heute Morgen gewechselt.",vi:"Đã thay băng sáng nay."},
    {de:"Patient war ruhig / unruhig / verwirrt.",vi:"BN bình thường / kích động / lú lẫn."},
    {de:"Stuhlgang: vorhanden / nicht vorhanden.",vi:"Đại tiện: có / không có."},
    {de:"Arzt und Angehörige wurden informiert.",vi:"Đã báo bác sĩ và gia đình."},
    {de:"Sonst keine Auffälligkeiten.",vi:"Ngoài ra không có gì bất thường."},
  ]},
],
emergency:[
  {g:"Gọi hỗ trợ",i:[
    {de:"Notruf! Kommen Sie sofort zu Zimmer ___!",vi:"Cấp cứu! Đến phòng ___ ngay!",n:"Nói to, rõ, chậm"},
    {de:"Ich brauche sofort Hilfe!",vi:"Tôi cần giúp đỡ ngay!"},
    {de:"Bitte rufen Sie das Reanimationsteam!",vi:"Gọi đội hồi sức ngay!"},
    {de:"Wir brauchen den Defibrillator sofort!",vi:"Cần máy sốc điện ngay!"},
  ]},
  {g:"Mô tả & Hành động",i:[
    {de:"Patient ist bewusstlos, reagiert nicht.",vi:"BN bất tỉnh, không phản ứng."},
    {de:"Keine Atmung und kein Puls feststellbar.",vi:"Không có nhịp thở và mạch."},
    {de:"Verdacht auf Herzinfarkt – Brustschmerzen.",vi:"Nghi nhồi máu cơ tim – đau ngực."},
    {de:"Verdacht auf Schlaganfall – Gesichtslähmung.",vi:"Nghi đột quỵ – liệt mặt.",n:"Test FAST: Face-Arm-Speech-Time"},
    {de:"Ich beginne mit der Herzdruckmassage!",vi:"Tôi bắt đầu ép tim!"},
    {de:"Defi laden – Alle weg vom Patienten!",vi:"Sạc máy sốc – Tất cả đứng ra xa!"},
    {de:"Geben Sie O2 über Maske mit 10–15 L/min!",vi:"Cho oxy qua mặt nạ 10–15 lít/phút!"},
    {de:"Dokumentieren Sie die Uhrzeit!",vi:"Ghi lại thời gian!"},
  ]},
],
vocab:[
  {g:"Bệnh lý tim mạch",i:[
    {de:"die Herzinsuffizienz",vi:"suy tim"},
    {de:"der Herzinfarkt (Myokardinfarkt)",vi:"nhồi máu cơ tim"},
    {de:"die Angina pectoris",vi:"đau thắt ngực"},
    {de:"das Vorhofflimmern",vi:"rung nhĩ"},
    {de:"die tiefe Venenthrombose (TVT)",vi:"huyết khối tĩnh mạch sâu"},
    {de:"die Lungenembolie",vi:"tắc mạch phổi"},
    {de:"die arterielle Hypertonie",vi:"tăng huyết áp"},
  ]},
  {g:"Bệnh lý hô hấp",i:[
    {de:"die Pneumonie",vi:"viêm phổi"},
    {de:"die COPD",vi:"bệnh phổi tắc nghẽn mãn tính"},
    {de:"das Asthma bronchiale",vi:"hen phế quản"},
    {de:"das Lungenödem",vi:"phù phổi"},
    {de:"die Schlafapnoe",vi:"ngưng thở khi ngủ"},
  ]},
  {g:"Bệnh lý khác",i:[
    {de:"der Schlaganfall (Apoplex)",vi:"đột quỵ"},
    {de:"die Epilepsie",vi:"động kinh"},
    {de:"der Diabetes mellitus Typ 1/2",vi:"đái tháo đường type 1/2"},
    {de:"die Niereninsuffizienz",vi:"suy thận"},
    {de:"die Leberzirrhose",vi:"xơ gan"},
    {de:"die Sepsis",vi:"nhiễm trùng huyết"},
    {de:"der Dekubitus",vi:"loét tỳ đè"},
    {de:"die Demenz",vi:"sa sút trí tuệ"},
  ]},
  {g:"Triệu chứng",i:[
    {de:"die Zyanose",vi:"tím tái"},
    {de:"das Ödem",vi:"phù nề"},
    {de:"die Tachykardie / Bradykardie",vi:"nhịp nhanh / nhịp chậm"},
    {de:"die Dyspnoe (Atemnot)",vi:"khó thở"},
    {de:"die Dysphagie",vi:"khó nuốt"},
    {de:"die Hemiparese",vi:"liệt nửa người"},
    {de:"die Aphasie",vi:"mất ngôn ngữ"},
    {de:"die Anurie / Oligurie",vi:"vô niệu / thiểu niệu"},
    {de:"die Hämatemesis",vi:"nôn ra máu"},
    {de:"die Hämaturie",vi:"tiểu ra máu"},
  ]},
  {g:"Dụng cụ y tế",i:[
    {de:"der periphere Venenkatheter (PVK)",vi:"catheter tĩnh mạch ngoại vi"},
    {de:"der zentralvenöse Katheter (ZVK)",vi:"catheter tĩnh mạch trung tâm"},
    {de:"der Blasenkatheter",vi:"ống thông tiểu"},
    {de:"die nasogastrale Sonde (NGT)",vi:"ống thông dạ dày mũi"},
    {de:"das Pulsoximeter",vi:"máy đo SpO2"},
    {de:"das Blutzuckermessgerät",vi:"máy đo đường huyết"},
    {de:"der Defibrillator / AED",vi:"máy sốc điện"},
    {de:"der Beatmungsbeutel (Ambu-Beutel)",vi:"bóng bóp hô hấp"},
    {de:"die Infusionspumpe / Spritzenpumpe",vi:"máy bơm truyền / bơm tiêm"},
    {de:"die Antidekubitusmatratze",vi:"đệm chống loét tỳ đè"},
  ]},
],
anatomy:[
  {g:"Đầu & Não",i:[
    {de:"das Gehirn",vi:"não"},{de:"der Hirnstamm",vi:"thân não"},{de:"das Kleinhirn",vi:"tiểu não"},
    {de:"die Schilddrüse",vi:"tuyến giáp"},{de:"die Hypophyse",vi:"tuyến yên"},
  ]},
  {g:"Tim & Phổi",i:[
    {de:"der linke / rechte Ventrikel",vi:"tâm thất trái / phải"},
    {de:"das linke / rechte Atrium",vi:"tâm nhĩ trái / phải"},
    {de:"die Mitralklappe / Aortenklappe",vi:"van hai lá / van động mạch chủ"},
    {de:"die Koronararterien",vi:"động mạch vành"},
    {de:"die Aorta",vi:"động mạch chủ"},
    {de:"die Bronchien / Alveolen",vi:"phế quản / phế nang"},
    {de:"das Zwerchfell",vi:"cơ hoành"},
  ]},
  {g:"Ổ bụng",i:[
    {de:"der Magen",vi:"dạ dày"},{de:"der Dünndarm / Dickdarm",vi:"ruột non / ruột già"},
    {de:"die Leber",vi:"gan"},{de:"die Gallenblase",vi:"túi mật"},
    {de:"die Bauchspeicheldrüse (Pankreas)",vi:"tuyến tụy"},
    {de:"die Milz",vi:"lá lách"},{de:"die Niere",vi:"thận"},
    {de:"die Harnblase",vi:"bàng quang"},{de:"die Nebenniere",vi:"tuyến thượng thận"},
  ]},
  {g:"Cơ xương & Mạch máu",i:[
    {de:"die Wirbelsäule",vi:"cột sống"},{de:"das Becken",vi:"khung chậu"},
    {de:"die Arterie / Vene / Kapillare",vi:"động mạch / tĩnh mạch / mao mạch"},
    {de:"das Erythrozyt / Leukozyten / Thrombozyt",vi:"hồng cầu / bạch cầu / tiểu cầu"},
    {de:"der Blutdruck (systolisch/diastolisch)",vi:"huyết áp tâm thu / tâm trương"},
  ]},
],
medication:[
  {g:"Đường dùng thuốc",i:[
    {de:"oral (p.o.) – per os",vi:"đường uống",n:"p.o. = per os"},
    {de:"intravenös (i.v.)",vi:"đường tĩnh mạch"},
    {de:"intramuskulär (i.m.)",vi:"đường tiêm bắp"},
    {de:"subkutan (s.c.)",vi:"đường tiêm dưới da"},
    {de:"transdermal / sublingual",vi:"qua da (miếng dán) / ngậm dưới lưỡi"},
    {de:"inhalativ / rektal",vi:"đường hít / đường hậu môn"},
  ]},
  {g:"Nhóm thuốc",i:[
    {de:"das Analgetikum / WHO-Stufe 1–3",vi:"thuốc giảm đau bậc 1–3"},
    {de:"das Antibiotikum / Antimykotikum",vi:"kháng sinh / kháng nấm"},
    {de:"das Antikoagulans",vi:"thuốc chống đông máu"},
    {de:"das Antihypertensivum / Diuretikum",vi:"hạ huyết áp / lợi tiểu"},
    {de:"das Insulin (Kurz-/Langzeit)",vi:"insulin tác dụng nhanh / chậm"},
    {de:"das Kortikosteroid",vi:"corticosteroid"},
    {de:"der Protonenpumpenhemmer (PPI)",vi:"ức chế bơm proton"},
    {de:"das Antiemetikum / Laxativum",vi:"chống nôn / nhuận tràng"},
  ]},
  {g:"Thuốc thông dụng",i:[
    {de:"Paracetamol / Metamizol",vi:"hạ sốt, giảm đau bậc 1"},
    {de:"Ibuprofen / Diclofenac",vi:"kháng viêm NSAID"},
    {de:"Morphin / Tramadol",vi:"giảm đau opioid mạnh / yếu"},
    {de:"Metoprolol / Bisoprolol",vi:"chẹn beta (tim mạch)"},
    {de:"Ramipril / Enalapril",vi:"ức chế ACE"},
    {de:"Furosemid / Spironolacton",vi:"lợi tiểu quai / kháng aldosteron"},
    {de:"Heparin / Enoxaparin (Clexane)",vi:"chống đông heparin / LMWH"},
    {de:"Pantoprazol / Omeprazol",vi:"PPI (giảm acid dạ dày)"},
    {de:"Ondansetron / Metoclopramid",vi:"chống nôn"},
    {de:"Lorazepam (Tavor) / Diazepam",vi:"an thần / chống động kinh"},
  ]},
  {g:"Dịch truyền & Giao tiếp thuốc",i:[
    {de:"NaCl 0,9% – Ringer-Laktat – Glukose 5%",vi:"muối sinh lý – Ringer – Glucose"},
    {de:"Nehmen Sie das Medikament ___ mal täglich.",vi:"Uống thuốc này ___ lần mỗi ngày."},
    {de:"Haben Sie Allergien gegen Medikamente?",vi:"Bạn có dị ứng thuốc nào không?"},
    {de:"Welche Medikamente nehmen Sie regelmäßig?",vi:"Bạn đang dùng thuốc gì thường xuyên?"},
  ]},
],
documentation:[
  {g:"Hồ sơ & Ghi chép",i:[
    {de:"die Patientenakte / Pflegedokumentation",vi:"hồ sơ bệnh án / hồ sơ điều dưỡng"},
    {de:"die Fieberkurve (Kurve)",vi:"phiếu theo dõi sinh hiệu"},
    {de:"die Arztanordnung / Pflegeplanung",vi:"y lệnh bác sĩ / kế hoạch chăm sóc"},
    {de:"der Entlassungsbrief / Aufnahmebogen",vi:"tóm tắt xuất viện / phiếu nhập viện"},
    {de:"das Sturzprotokoll",vi:"biên bản té ngã"},
  ]},
  {g:"Viết tắt quan trọng",i:[
    {de:"RR ___ / ___ mmHg",vi:"Huyết áp tâm thu / tâm trương",n:"RR = Riva-Rocci"},
    {de:"HF ___ /min · AF ___ /min · Temp ___ °C",vi:"Nhịp tim · Nhịp thở · Nhiệt độ"},
    {de:"SpO2 ___ % · BZ ___ mg/dl",vi:"Bão hòa oxy · Đường huyết"},
    {de:"GCS ___ / 15 · NRS ___ / 10",vi:"Điểm hôn mê Glasgow · Thang đau"},
    {de:"n.B. = nach Bedarf · V.a. = Verdacht auf",vi:"khi cần · nghi ngờ là"},
    {de:"o.B. = ohne Befund",vi:"không có phát hiện bất thường"},
    {de:"i.v. / i.m. / s.c. / p.o.",vi:"tĩnh mạch / bắp / dưới da / uống"},
  ]},
  {g:"Pháp lý & Đạo đức",i:[
    {de:"die informierte Einwilligung",vi:"đồng ý có thông tin (informed consent)"},
    {de:"die Schweigepflicht",vi:"nghĩa vụ bảo mật thông tin bệnh nhân"},
    {de:"die Patientenverfügung",vi:"di chúc điều trị"},
    {de:"die freiheitsentziehende Maßnahme (FEM)",vi:"biện pháp hạn chế tự do",n:"Cần y lệnh & quyết định tòa án"},
    {de:"die Meldepflicht (IfSG)",vi:"nghĩa vụ báo cáo bệnh truyền nhiễm"},
    {de:"MRSA / VRE / 3MRGN / 4MRGN",vi:"vi khuẩn đa kháng kháng sinh"},
    {de:"die hygienische Händedesinfektion",vi:"khử khuẩn tay (6 bước WHO)"},
  ]},
],
nursing_process:[
  {g:"5 bước quy trình",i:[
    {de:"1. Pflegeassessment – Informationssammlung",vi:"1. Thu thập thông tin / đánh giá"},
    {de:"2. Pflegediagnose (nach NANDA)",vi:"2. Chẩn đoán điều dưỡng"},
    {de:"3. Pflegeziele (SMART)",vi:"3. Đặt mục tiêu chăm sóc"},
    {de:"4. Pflegemaßnahmen planen & durchführen",vi:"4. Lập kế hoạch & thực hiện"},
    {de:"5. Evaluation / Wirkungskontrolle",vi:"5. Đánh giá & kiểm tra hiệu quả"},
  ]},
  {g:"Phòng ngừa (Prophylaxen)",i:[
    {de:"die Dekubitusprophylaxe",vi:"phòng ngừa loét tỳ đè"},
    {de:"die Sturzprophylaxe",vi:"phòng ngừa té ngã"},
    {de:"die Thromboseprophylaxe",vi:"phòng ngừa huyết khối"},
    {de:"die Pneumonieprophylaxe",vi:"phòng ngừa viêm phổi"},
    {de:"die Aspirationsprophylaxe",vi:"phòng ngừa hít sặc"},
    {de:"die Kontrakturprophylaxe",vi:"phòng ngừa co cứng khớp"},
    {de:"die Soorprophylaxe",vi:"phòng ngừa nấm miệng"},
    {de:"die Obstipationsprophylaxe",vi:"phòng ngừa táo bón"},
  ]},
  {g:"Thang điểm & Đánh giá",i:[
    {de:"die Braden-Skala",vi:"thang Braden – nguy cơ loét tỳ đè"},
    {de:"die Morse-Skala",vi:"thang Morse – nguy cơ té ngã"},
    {de:"der Barthel-Index",vi:"chỉ số Barthel – mức độ tự lập"},
    {de:"das MMSE",vi:"kiểm tra nhận thức tối thiểu"},
    {de:"das NRS 2002 / MUST-Score",vi:"sàng lọc nguy cơ dinh dưỡng"},
  ]},
  {g:"Kỹ thuật điều dưỡng",i:[
    {de:"die Wundversorgung / Verbandswechsel",vi:"chăm sóc vết thương / thay băng"},
    {de:"die subkutane / intramuskuläre Injektion",vi:"tiêm dưới da / tiêm bắp"},
    {de:"die Blutentnahme (venös / kapillär)",vi:"lấy máu tĩnh mạch / mao mạch"},
    {de:"das Absaugen (oropharyngeal/endotracheal)",vi:"hút đờm miệng hầu / nội khí quản"},
    {de:"das Stoma (Kolo-/Ileo-/Tracheostoma)",vi:"lỗ mở đại tràng / hồi tràng / khí quản"},
    {de:"die Lagerung: 30°-Lagerung",vi:"nằm nghiêng 30° – phòng loét tỳ đè"},
  ]},
],
mental:[
  {g:"Bệnh tâm thần",i:[
    {de:"die Schizophrenie",vi:"tâm thần phân liệt"},
    {de:"die bipolare Störung",vi:"rối loạn lưỡng cực"},
    {de:"die Major Depression",vi:"trầm cảm nặng"},
    {de:"die Angststörung / Panikstörung",vi:"rối loạn lo âu / hoảng loạn"},
    {de:"die Suizidalität",vi:"ý định tự tử"},
    {de:"das Delir (akute Verwirrtheit)",vi:"mê sảng / lú lẫn cấp"},
    {de:"die Substanzabhängigkeit",vi:"lệ thuộc chất"},
  ]},
  {g:"Giao tiếp tâm thần",i:[
    {de:"Fühlen Sie sich sicher?",vi:"Bạn có cảm thấy an toàn không?"},
    {de:"Haben Sie Gedanken, sich selbst zu verletzen?",vi:"Bạn có ý nghĩ tự làm hại không?",n:"Hỏi thẳng – không gây nguy hiểm"},
    {de:"Ich bin für Sie da. Sie sind hier sicher.",vi:"Tôi ở đây bên bạn. Bạn đang ở nơi an toàn."},
    {de:"Ich höre Ihnen zu.",vi:"Tôi đang lắng nghe bạn."},
  ]},
  {g:"Lão khoa",i:[
    {de:"die Multimorbidität",vi:"đa bệnh lý"},
    {de:"die Polypharmazie (≥5 Medikamente)",vi:"đa thuốc"},
    {de:"die Frailty (Gebrechlichkeit)",vi:"hội chứng suy yếu"},
    {de:"die Sarkopenie",vi:"mất cơ liên quan tuổi"},
    {de:"die Demenzpflege / Validation",vi:"chăm sóc sa sút trí tuệ / Validation"},
    {de:"die Sturzprävention im Alter",vi:"phòng té ngã ở người cao tuổi"},
  ]},
],
};

// ════════════════════════════════════════════════════════
// DIALOGUES
// ════════════════════════════════════════════════════════
let DIALOGUES=[
  {title:"Nhập viện – Hỏi thăm ban đầu",icon:"🏥",diff:"easy",lines:[
    {role:"nurse",de:"Guten Morgen! Mein Name ist Anna, ich bin Ihre Pflegefachkraft für heute.",vi:"Chào buổi sáng! Tôi là Anna, điều dưỡng phụ trách bạn hôm nay."},
    {role:"patient",de:"Guten Morgen. Ich bin Herr Nguyen.",vi:"Chào buổi sáng. Tôi là ông Nguyen."},
    {role:"nurse",de:"Wie geht es Ihnen heute, Herr Nguyen? Haben Sie gut geschlafen?",vi:"Hôm nay ông cảm thấy thế nào? Ông ngủ có ngon không?"},
    {role:"patient",de:"Nicht so gut. Ich habe Schmerzen im Bauch.",vi:"Không lắm. Tôi bị đau bụng."},
    {role:"nurse",de:"Das tut mir leid. Wie stark sind die Schmerzen auf einer Skala von 1 bis 10?",vi:"Tôi rất tiếc. Mức độ đau từ 1 đến 10 là bao nhiêu?"},
    {role:"patient",de:"Ungefähr eine 6.",vi:"Khoảng 6."},
    {role:"nurse",de:"Ich dokumentiere das und informiere den Arzt. Klingeln Sie bitte, wenn es schlimmer wird.",vi:"Tôi sẽ ghi lại và báo bác sĩ. Nhờ ông bấm chuông nếu đau hơn."},
  ]},
  {title:"Đo sinh hiệu & Thuốc",icon:"💊",diff:"easy",lines:[
    {role:"nurse",de:"Guten Morgen! Ich möchte Ihren Blutdruck und Puls messen.",vi:"Chào buổi sáng! Tôi muốn đo huyết áp và mạch của bạn."},
    {role:"patient",de:"Natürlich, kein Problem.",vi:"Được thôi, không sao."},
    {role:"nurse",de:"Ihr Blutdruck ist 135/85, Puls 78 – alles im normalen Bereich. Hier sind Ihre Morgentabletten.",vi:"Huyết áp 135/85, mạch 78 – đều trong phạm vi bình thường. Đây là thuốc buổi sáng của bạn."},
    {role:"patient",de:"Danke. Soll ich die Tabletten mit Wasser nehmen?",vi:"Cảm ơn. Tôi uống thuốc với nước nhé?"},
    {role:"nurse",de:"Ja, bitte nehmen Sie die Tabletten mit einem Glas Wasser nach dem Frühstück.",vi:"Vâng, uống thuốc với một cốc nước sau bữa sáng nhé."},
    {role:"patient",de:"Habe ich Allergien – darf ich das fragen?",vi:"Tôi có dị ứng không – tôi có thể hỏi không?"},
    {role:"nurse",de:"Laut Ihrer Akte keine bekannten Allergien. Wenn Sie Nebenwirkungen bemerken, sagen Sie mir bitte sofort Bescheid.",vi:"Theo hồ sơ, không có dị ứng nào được ghi nhận. Nếu bạn thấy tác dụng phụ, hãy báo tôi ngay."},
  ]},
  {title:"Bàn giao ca (Übergabe)",icon:"🔄",diff:"medium",lines:[
    {role:"nurse",de:"Ich gebe Ihnen jetzt die Übergabe für Zimmer 12.",vi:"Tôi bàn giao ca cho bạn về phòng 12."},
    {role:"nurse",de:"Patient Herr Schmidt, 68 Jahre, aufgenommen wegen dekompensierter Herzinsuffizienz.",vi:"BN ông Schmidt, 68 tuổi, nhập viện vì suy tim mất bù."},
    {role:"nurse",de:"Er ist aktuell stabil. Vitalzeichen: RR 130/80, Puls 88, Temp 37,1, SpO2 96% mit 2L O2.",vi:"Hiện đang ổn định. Sinh hiệu: HA 130/80, mạch 88, nhiệt độ 37,1, SpO2 96% với 2L oxy."},
    {role:"nurse",de:"Die Medikamente wurden vollständig gegeben. Die Furosemid-Infusion läuft mit 10 ml/h.",vi:"Thuốc đã cho đầy đủ. Truyền Furosemid đang chạy 10 ml/h."},
    {role:"nurse",de:"Bitte achten Sie auf die Urinausscheidung – Ziel: über 50 ml/h. Morgen steht eine Blutabnahme aus.",vi:"Chú ý lượng nước tiểu – mục tiêu trên 50 ml/h. Sáng mai cần lấy máu xét nghiệm."},
    {role:"nurse",de:"Haben Sie noch Fragen?",vi:"Bạn còn câu hỏi nào không?"},
    {role:"patient",de:"Nein, alles klar. Danke!",vi:"Không, rõ cả rồi. Cảm ơn!"},
  ]},
  {title:"Tình huống khẩn cấp – Ngã",icon:"🚨",diff:"hard",lines:[
    {role:"nurse",de:"Oh! Herr Müller, was ist passiert? Können Sie mich hören?",vi:"Ôi! Ông Müller, chuyện gì xảy ra vậy? Ông nghe tôi không?"},
    {role:"patient",de:"Ich bin... gefallen. Mein Bein tut weh.",vi:"Tôi... bị ngã. Chân tôi đau lắm."},
    {role:"nurse",de:"Ich bin bei Ihnen. Bitte bewegen Sie sich nicht. Ich hole sofort Hilfe.",vi:"Tôi ở đây với ông. Xin đừng cử động. Tôi đi gọi giúp đỡ ngay."},
    {role:"nurse",de:"[Ruft Kollegen] Notruf! Bitte kommen Sie sofort zu Zimmer 8! Patient gestürzt!",vi:"[Gọi đồng nghiệp] Cấp cứu! Đến phòng 8 ngay! Bệnh nhân bị ngã!"},
    {role:"nurse",de:"Herr Müller, ich überprüfe jetzt Ihre Vitalzeichen. Atmen Sie normal?",vi:"Ông Müller, tôi kiểm tra sinh hiệu. Ông thở bình thường không?"},
    {role:"patient",de:"Ja, ich atme... aber ich habe starke Schmerzen.",vi:"Có, tôi thở được... nhưng đau lắm."},
    {role:"nurse",de:"Ich gebe Ihnen etwas gegen den Schmerz. Verdacht auf Fraktur – ich dokumentiere alles und informiere den Arzt sofort.",vi:"Tôi sẽ cho ông thuốc giảm đau. Nghi gãy xương – tôi ghi lại tất cả và báo bác sĩ ngay."},
  ]},
  {title:"Chăm sóc vệ sinh cơ bản",icon:"🛁",diff:"easy",lines:[
    {role:"nurse",de:"Guten Morgen, Frau Weber. Möchten Sie sich heute waschen? Ich helfe Ihnen gerne.",vi:"Chào buổi sáng, bà Weber. Bà có muốn tắm rửa hôm nay không? Tôi rất vui được giúp."},
    {role:"patient",de:"Ja, das wäre schön. Aber ich kann mich kaum bewegen.",vi:"Vâng, tốt quá. Nhưng tôi gần như không thể cử động."},
    {role:"nurse",de:"Das ist kein Problem. Ich mache eine Ganzkörperwäsche im Bett. Ist Ihnen die Wassertemperatur so angenehm?",vi:"Không sao cả. Tôi sẽ tắm toàn thân cho bà trên giường. Nhiệt độ nước thế này có thoải mái không?"},
    {role:"patient",de:"Ja, das ist gut. Danke für Ihre Geduld.",vi:"Vâng, tốt lắm. Cảm ơn bạn đã kiên nhẫn."},
    {role:"nurse",de:"Gern geschehen. Ich achte auch auf den Hautzustand – ich sehe keine geröteten Stellen, das ist gut.",vi:"Không có gì. Tôi cũng kiểm tra tình trạng da – không thấy chỗ nào đỏ, tốt lắm."},
  ]},
  {title:"Báo cáo với bác sĩ",icon:"👨‍⚕️",diff:"medium",lines:[
    {role:"nurse",de:"Herr Doktor, darf ich kurz stören? Ich möchte Ihnen eine Patientin vorstellen.",vi:"Thưa bác sĩ, xin phép làm phiền một chút. Tôi muốn báo cáo về một bệnh nhân."},
    {role:"nurse",de:"Es handelt sich um Frau Kim, 55 Jahre, Zimmer 5. Sie klagt seit einer Stunde über zunehmende Atemnot.",vi:"Đây là bà Kim, 55 tuổi, phòng 5. Bà than khó thở ngày càng tăng từ một tiếng nay."},
    {role:"nurse",de:"Vitalzeichen: SpO2 88% unter 4L O2, RR 150/95, Puls 110, Atemfrequenz 26/min.",vi:"Sinh hiệu: SpO2 88% dưới 4L oxy, HA 150/95, mạch 110, nhịp thở 26 lần/phút."},
    {role:"nurse",de:"Ich vermute ein Lungenödem. Soll ich Furosemid 40mg i.v. geben?",vi:"Tôi nghi phù phổi. Tôi có nên cho Furosemid 40mg tĩnh mạch không?"},
    {role:"nurse",de:"Und ich habe den Patienten mit 30° hochgelagert und O2-Maske angelegt.",vi:"Tôi đã nâng đầu giường 30° và đặt mặt nạ oxy."},
  ]},
  {title:"Giải thích thủ thuật – Tiêm & Truyền",icon:"💉",diff:"medium",lines:[
    {role:"nurse",de:"Frau Tran, ich muss Ihnen jetzt eine Infusion legen. Darf ich Ihren Arm sehen?",vi:"Bà Tran, tôi cần đặt đường truyền cho bà bây giờ. Tôi xem tay bà được không?"},
    {role:"patient",de:"Natürlich. Aber ich habe Angst vor Nadeln.",vi:"Được. Nhưng tôi sợ kim tiêm."},
    {role:"nurse",de:"Das verstehe ich gut. Ich bin sehr vorsichtig. Sie werden nur kurz einen kleinen Druck spüren.",vi:"Tôi hiểu. Tôi sẽ rất cẩn thận. Bà sẽ chỉ cảm thấy một chút áp lực nhỏ."},
    {role:"nurse",de:"So, fertig! Der Zugang sitzt gut. Ich starte jetzt die Infusion mit NaCl 0,9%, 500ml über 4 Stunden.",vi:"Xong rồi! Đường truyền nằm tốt. Tôi bắt đầu truyền NaCl 0,9%, 500ml trong 4 tiếng."},
    {role:"patient",de:"Wann bekomme ich meine Medikamente?",vi:"Khi nào tôi được uống thuốc?"},
    {role:"nurse",de:"Ihre Tabletten bekommen Sie zum Frühstück um 8 Uhr. Falls Sie Schmerzen oder Rötungen an der Einstichstelle bemerken, sagen Sie mir bitte sofort Bescheid.",vi:"Thuốc viên của bà sẽ vào lúc 8 giờ sáng cùng bữa ăn. Nếu đau hoặc đỏ chỗ tiêm, hãy báo tôi ngay."},
  ]},
  {title:"Chăm sóc bệnh nhân mất trí nhớ",icon:"🧠",diff:"hard",lines:[
    {role:"nurse",de:"Guten Morgen, Herr Becker. Erkennen Sie mich? Ich bin Maria, Ihre Pflegefachkraft.",vi:"Chào buổi sáng, ông Becker. Ông có nhận ra tôi không? Tôi là Maria, điều dưỡng của ông."},
    {role:"patient",de:"Wo bin ich? Ich will nach Hause!",vi:"Tôi đang ở đâu vậy? Tôi muốn về nhà!"},
    {role:"nurse",de:"Sie sind im Krankenhaus, Herr Becker. Sie sind hier sicher. Ich passe auf Sie auf.",vi:"Ông đang ở bệnh viện, ông Becker. Ông an toàn ở đây. Tôi sẽ chăm sóc cho ông."},
    {role:"patient",de:"Meine Frau – wo ist meine Frau?",vi:"Vợ tôi – vợ tôi đâu rồi?"},
    {role:"nurse",de:"Ihre Frau kommt heute Nachmittag um 3 Uhr zu Besuch. Ich zeige Ihnen das Foto hier – sehen Sie?",vi:"Vợ ông sẽ đến thăm lúc 3 giờ chiều hôm nay. Tôi cho ông xem tấm ảnh này – ông thấy không?"},
    {role:"patient",de:"Ja... das ist Hilde. Meine Hilde.",vi:"Vâng... đó là Hilde. Hilde của tôi."},
    {role:"nurse",de:"Genau. Und bis dahin frühstücken wir erst. Ich helfe Ihnen beim Anziehen, ja?",vi:"Đúng vậy. Và đến lúc đó, trước tiên chúng ta ăn sáng đã. Tôi giúp ông mặc quần áo nhé?"},
  ]},
  {title:"Thuyết phục BN từ chối điều trị",icon:"🤝",diff:"hard",lines:[
    {role:"patient",de:"Ich will keine Spritze! Nehmen Sie das weg!",vi:"Tôi không muốn tiêm! Cất cái đó đi!"},
    {role:"nurse",de:"Ich höre Sie, Herr Park. Darf ich Ihnen kurz erklären, warum das wichtig ist?",vi:"Tôi nghe ông, ông Park. Ông cho phép tôi giải thích ngắn tại sao điều này quan trọng không?"},
    {role:"patient",de:"Ich habe Angst. Das tut doch so weh!",vi:"Tôi sợ. Nó đau lắm mà!"},
    {role:"nurse",de:"Das verstehe ich vollkommen. Darf ich fragen, was genau Sie befürchten?",vi:"Tôi hoàn toàn hiểu điều đó. Tôi có thể hỏi chính xác ông lo ngại điều gì không?"},
    {role:"nurse",de:"Diese Spritze ist Ihr Heparin – es schützt Sie vor Blutgerinnseln. Ohne es erhöht sich das Risiko für eine Thrombose.",vi:"Mũi tiêm này là Heparin – nó bảo vệ ông khỏi cục máu đông. Không có nó, nguy cơ huyết khối tăng cao."},
    {role:"patient",de:"Wenn Sie das so sagen... aber bitte seien Sie vorsichtig.",vi:"Nếu ông nói vậy... nhưng hãy cẩn thận nhé."},
    {role:"nurse",de:"Natürlich. Ich mache das sehr sanft. Sie können jederzeit stopp sagen.",vi:"Tất nhiên. Tôi sẽ làm rất nhẹ nhàng. Ông có thể nói dừng lại bất cứ lúc nào."},
  ]},
  {title:"Cuối ca – Nhận xét & Hồ sơ",icon:"📋",diff:"medium",lines:[
    {role:"nurse",de:"Ich komme gleich zu Ende meiner Schicht. Ich schreibe noch den Pflegebericht.",vi:"Tôi sắp hết ca. Tôi viết nốt báo cáo điều dưỡng."},
    {role:"nurse",de:"Herr Tran hat heute gut gegessen – 3/4 der Mahlzeit. Trinkmenge 1.200 ml. Stuhlgang einmal, normal.",vi:"Ông Tran hôm nay ăn tốt – 3/4 khẩu phần. Lượng nước uống 1.200 ml. Đại tiện một lần, bình thường."},
    {role:"nurse",de:"Blutdruck morgens 145/90 – Arzt informiert. Er hat eine neue Anordnung geschrieben: Blutdruck 3x täglich messen.",vi:"Huyết áp buổi sáng 145/90 – đã báo bác sĩ. Bác sĩ đã ra y lệnh mới: đo huyết áp 3 lần mỗi ngày."},
    {role:"nurse",de:"Besonderes Ereignis: Patient hat um 14:00 Uhr über Schwindel geklagt. Neurologische Symptome wurden ausgeschlossen.",vi:"Sự kiện đặc biệt: BN kêu chóng mặt lúc 14:00. Triệu chứng thần kinh đã được loại trừ."},
    {role:"nurse",de:"Alles dokumentiert. Übergabe an Spätschicht erfolgt. Gute Nacht, Kollegen!",vi:"Tất cả đã được ghi chép. Đã bàn giao cho ca chiều. Chúc đồng nghiệp ngủ ngon!"},
  ]},
];

const ABBR_DATA=[
  {abbr:'RR',full:'Blutdruck',vi:'Huyết áp',example:'RR 120/80 mmHg – normal',cat:'Vital'},
  {abbr:'HF',full:'Herzfrequenz',vi:'Nhịp tim',example:'HF 72/min – normal',cat:'Vital'},
  {abbr:'AF',full:'Atemfrequenz',vi:'Nhịp thở',example:'AF 16/min – normal',cat:'Vital'},
  {abbr:'T',full:'Temperatur',vi:'Nhiệt độ',example:'T 38,5°C – subfebril',cat:'Vital'},
  {abbr:'SpO₂',full:'Sauerstoffsättigung',vi:'Độ bão hòa oxy',example:'SpO₂ 96%',cat:'Vital'},
  {abbr:'BZ',full:'Blutzucker',vi:'Đường huyết',example:'BZ 110 mg/dl nüchtern',cat:'Vital'},
  {abbr:'GCS',full:'Glasgow Coma Scale',vi:'Thang điểm hôn mê',example:'GCS 15 – voll orientiert',cat:'Vital'},
  {abbr:'VZ',full:'Vitalzeichen',vi:'Dấu hiệu sinh tồn',example:'VZ stündlich messen',cat:'Vital'},
  {abbr:'i.v.',full:'intravenös',vi:'Tiêm tĩnh mạch',example:'Antibiose i.v. geben',cat:'Medikamente'},
  {abbr:'s.c.',full:'subkutan',vi:'Tiêm dưới da',example:'Insulin s.c. injizieren',cat:'Medikamente'},
  {abbr:'i.m.',full:'intramuskulär',vi:'Tiêm bắp',example:'Vitamin B12 i.m.',cat:'Medikamente'},
  {abbr:'p.o.',full:'per os',vi:'Uống qua miệng',example:'Tablette p.o. nehmen',cat:'Medikamente'},
  {abbr:'NW',full:'Nebenwirkung',vi:'Tác dụng phụ',example:'Mögliche NW: Übelkeit',cat:'Medikamente'},
  {abbr:'KI',full:'Kontraindikation',vi:'Chống chỉ định',example:'KI bei Niereninsuffizienz',cat:'Medikamente'},
  {abbr:'EKG',full:'Elektrokardiogramm',vi:'Điện tâm đồ',example:'12-Kanal-EKG schreiben',cat:'Diagnose'},
  {abbr:'OP',full:'Operation',vi:'Phẫu thuật',example:'OP morgen früh 8 Uhr',cat:'Diagnose'},
  {abbr:'DM',full:'Diabetes mellitus',vi:'Đái tháo đường',example:'DM Typ 2 seit 2010',cat:'Diagnose'},
  {abbr:'HT',full:'Hypertonie',vi:'Tăng huyết áp',example:'HT medikamentös eingestellt',cat:'Diagnose'},
  {abbr:'KHK',full:'Koronare Herzkrankheit',vi:'Bệnh mạch vành',example:'KHK, Z.n. Stent 2019',cat:'Diagnose'},
  {abbr:'COPD',full:'Chron. obstruktive Lungenerkrankung',vi:'Bệnh phổi tắc nghẽn mạn tính',example:'COPD GOLD III',cat:'Diagnose'},
  {abbr:'AZ',full:'Allgemeinzustand',vi:'Tình trạng toàn thân',example:'AZ reduziert',cat:'Dokument'},
  {abbr:'EZ',full:'Ernährungszustand',vi:'Tình trạng dinh dưỡng',example:'EZ gut, BMI 22',cat:'Dokument'},
  {abbr:'PA',full:'Pflegeanamnese',vi:'Tiền sử điều dưỡng',example:'PA bei Aufnahme erheben',cat:'Dokument'},
  {abbr:'PE',full:'Pflegeplanung',vi:'Kế hoạch điều dưỡng',example:'PE täglich aktualisieren',cat:'Dokument'},
  {abbr:'MDK',full:'Medizinischer Dienst',vi:'Dịch vụ y tế kiểm định',example:'MDK-Begutachtung am Dienstag',cat:'Pflege'},
  {abbr:'PG',full:'Pflegegrad',vi:'Mức độ chăm sóc',example:'PG 3 anerkannt',cat:'Pflege'},
  {abbr:'KH',full:'Krankenhaus',vi:'Bệnh viện',example:'Einweisung ins KH',cat:'Pflege'},
  {abbr:'PDL',full:'Pflegedienstleitung',vi:'Trưởng phòng điều dưỡng',example:'PDL informieren',cat:'Pflege'},
  {abbr:'SGB',full:'Sozialgesetzbuch',vi:'Bộ luật xã hội',example:'SGB XI Pflegeversicherung',cat:'Pflege'},
  {abbr:'WV',full:'Wundversorgung',vi:'Chăm sóc vết thương',example:'WV täglich durchführen',cat:'Pflege'},
];
const EMERGENCY_CARDS=[
  {de:'Notruf',vi:'Cuộc gọi khẩn cấp',ctx:'Einen Notruf absetzen – 112 anrufen'},
  {de:'Sturz',vi:'Té ngã',ctx:'Der Patient ist gestürzt – nicht bewegen!'},
  {de:'Bewusstlos',vi:'Bất tỉnh',ctx:'Patient bewusstlos – Notruf, Atemwege freihalten'},
  {de:'Atemnot',vi:'Khó thở',ctx:'Patient hat Atemnot – aufsetzen, O₂ geben'},
  {de:'Herzstillstand',vi:'Ngừng tim',ctx:'Herzstillstand – sofort Reanimation beginnen'},
  {de:'Reanimation',vi:'Hồi sức CPR',ctx:'30 Kompressionen : 2 Beatmungen'},
  {de:'Defibrillator',vi:'Máy sốc điện AED',ctx:'AED holen und einschalten'},
  {de:'Starke Blutung',vi:'Chảy máu nhiều',ctx:'Wunde abdrücken, Arzt rufen'},
  {de:'Krampfanfall',vi:'Co giật',ctx:'Sicherheit gewährleisten, Zeit stoppen, Arzt rufen'},
  {de:'Anaphylaxie',vi:'Sốc phản vệ',ctx:'Adrenalin-Pen, Notruf, hinlegen'},
  {de:'Hypoglykämie',vi:'Hạ đường huyết',ctx:'BZ < 70 mg/dl – Traubenzucker geben'},
  {de:'Hypertensive Krise',vi:'Cơn tăng huyết áp',ctx:'RR > 180/110 – Arzt sofort informieren'},
  {de:'Aspiration',vi:'Hít sặc dị vật',ctx:'Heimlich-Griff bei wachem Patient'},
  {de:'Verwirrtheit akut',vi:'Lú lẫn cấp tính',ctx:'Delir – Orientierung geben, Sicherheit'},
  {de:'Sturzsicherung',vi:'Phòng ngừa té ngã',ctx:'Bettgitter, Antirutschmatte, Rufanlage'},
  {de:'Sofortmaßnahmen',vi:'Biện pháp khẩn cấp',ctx:'ABCDE-Schema anwenden'},
  {de:'Notarzt',vi:'Bác sĩ cấp cứu',ctx:'Notarzt rufen – 112'},
  {de:'Intensivstation',vi:'ICU – Hồi sức tích cực',ctx:'Verlegung auf die ITS'},
  {de:'Erste Hilfe',vi:'Sơ cứu ban đầu',ctx:'Stabile Seitenlage bei Bewusstlosigkeit'},
  {de:'Schockzeichen',vi:'Dấu hiệu sốc',ctx:'Blass, kalt, RR↓, HF↑ – Schocklagerung'},
];
const SHIFT_SCENARIOS=[
  {room:'Zimmer 12',name:'Herr Müller',age:78,diag:'Herzinsuffizienz',
   situation:'Der Patient klingelt und sagt: "Ich habe starke Schmerzen im Bauch, NRS 7."',
   situationVI:'Bệnh nhân bấm chuông: "Tôi đau bụng rất dữ, mức độ 7/10"',
   options:[
     {text:'Den Arzt sofort informieren, Schmerzmittel erst nach Anordnung',correct:true,explain:'Richtig! Bei NRS 7 entscheidet der Arzt. Ohne Anordnung keine Medikamente.'},
     {text:'Dem Patienten selbst eine Schmerztablette geben',correct:false,explain:'Falsch! Medikamente nur nach ärztlicher Anordnung geben.'},
     {text:'"Das wird bald besser" sagen und weggehen',correct:false,explain:'Falsch! Starke Schmerzen müssen sofort behandelt werden.'},
     {text:'Den Patienten bitten zu warten bis zur nächsten Visite',correct:false,explain:'Falsch! NRS 7 ist dringend – nicht warten!'},
   ]},
  {room:'Zimmer 5',name:'Frau Schmidt',age:84,diag:'Demenz, Pflegegrad 4',
   situation:'Sie finden die Patientin auf dem Boden liegend neben dem Bett. Sie ist wach.',
   situationVI:'Bạn thấy bệnh nhân nằm trên sàn cạnh giường. Bà vẫn còn tỉnh.',
   options:[
     {text:'Nicht bewegen, Notruf absetzen, Vitalzeichen prüfen, beruhigen',correct:true,explain:'Richtig! Bei Sturz erst prüfen, nie sofort bewegen – Fraktur möglich.'},
     {text:'Patientin sofort aufheben und ins Bett legen',correct:false,explain:'Falsch! Vor dem Bewegen Verletzung ausschließen.'},
     {text:'Warten bis ein Kollege kommt',correct:false,explain:'Falsch! Sofort versorgen und Hilfe rufen.'},
     {text:'Patientin bitten selbst aufzustehen',correct:false,explain:'Falsch! Nach Sturz nicht ohne Unterstützung aufstehen lassen.'},
   ]},
  {room:'Zimmer 8',name:'Herr Braun',age:65,diag:'DM Typ 2, Hypertonie',
   situation:'Der Patient verweigert seine Medikamente: "Ich nehme die Tabletten nicht!"',
   situationVI:'Bệnh nhân từ chối uống thuốc: "Tôi không uống đâu!"',
   options:[
     {text:'Gründe erfragen, informieren, dokumentieren, Arzt informieren',correct:true,explain:'Richtig! Patientenautonomie respektieren, aber Dokumentation und Arzt sind Pflicht.'},
     {text:'Medikamente heimlich ins Essen mischen',correct:false,explain:'Falsch! Das ist ein schwerer Rechtsverstoß.'},
     {text:'Den Patienten zwingen',correct:false,explain:'Falsch! Zwang ist verboten.'},
     {text:'Medikamente weglassen ohne Dokumentation',correct:false,explain:'Falsch! Immer dokumentieren und Arzt informieren.'},
   ]},
  {room:'Zimmer 3',name:'Frau Weber',age:91,diag:'Hypertonie, KHK',
   situation:'RR 185/115, HF 92. Die Patientin klagt über Kopfschmerzen.',
   situationVI:'Huyết áp 185/115, nhịp tim 92. Bệnh nhân than đau đầu.',
   options:[
     {text:'Sofort Arzt benachrichtigen, hinlegen lassen, Ruhe, erneut messen',correct:true,explain:'Richtig! RR > 180/110 mit Symptomen = hypertensive Krise. Arzt sofort!'},
     {text:'Selbst ein Blutdruckmedikament geben',correct:false,explain:'Falsch! Medikamente nur nach ärztlicher Anordnung.'},
     {text:'Abwarten und in einer Stunde messen',correct:false,explain:'Falsch! Hypertensive Krise ist ein Notfall.'},
     {text:'Patientin aufstehen lassen',correct:false,explain:'Falsch! Bei hypertensiver Krise: Ruhe und hinlegen.'},
   ]},
  {room:'Zimmer 15',name:'Herr Fischer',age:72,diag:'Demenz, Pflegegrad 3',
   situation:'Der Patient ist agitiert und möchte das Haus verlassen: "Ich muss nach Hause!"',
   situationVI:'Bệnh nhân kích động muốn rời đi: "Tôi phải về nhà!"',
   options:[
     {text:'Ruhig ansprechen, validieren, ablenken, Sicherheit gewährleisten',correct:true,explain:'Richtig! Validation und Ablenkung – auf Emotion eingehen, nicht auf Inhalt.'},
     {text:'Den Patienten laut anschreien',correct:false,explain:'Falsch! Schreien verstärkt die Agitation bei Demenz.'},
     {text:'Zimmertür von außen abschließen',correct:false,explain:'Falsch! Freiheitsentzug ohne richterliche Genehmigung ist illegal.'},
     {text:'Patienten ignorieren',correct:false,explain:'Falsch! Demenzpatienten brauchen Zuwendung.'},
   ]},
];
const PG_DATA=[
  {grade:1,score:'12,5–26,9',color:'var(--green)',desc:'Geringe Beeinträchtigung der Selbstständigkeit',vi:'Giảm nhẹ khả năng tự chăm sóc',geld:'–',sach:'Entlastungsbetrag 125€',example:'Kann gehen, braucht gelegentlich Hilfe'},
  {grade:2,score:'27–47,4',color:'var(--blue)',desc:'Erhebliche Beeinträchtigung der Selbstständigkeit',vi:'Giảm đáng kể khả năng tự chăm sóc',geld:'332€',sach:'761€',example:'Hilfe beim Anziehen, Waschen nötig'},
  {grade:3,score:'47,5–69,9',color:'var(--orange)',desc:'Schwere Beeinträchtigung der Selbstständigkeit',vi:'Giảm nặng khả năng tự chăm sóc',geld:'573€',sach:'1.432€',example:'Umfangreiche Hilfe bei Körperpflege'},
  {grade:4,score:'70–89,9',color:'var(--red)',desc:'Schwerste Beeinträchtigung der Selbstständigkeit',vi:'Giảm rất nặng, gần như phụ thuộc hoàn toàn',geld:'765€',sach:'1.778€',example:'Fast vollständig pflegeabhängig'},
  {grade:5,score:'90–100',color:'var(--purple)',desc:'Schwerste Beeinträchtigung + besondere Anforderungen',vi:'Nặng nhất, yêu cầu chăm sóc đặc biệt',geld:'947€',sach:'2.200€',example:'Beatmungspflichtig, intensivpflichtig'},
];
const PG_QUIZ=[
  {q:'Welcher Pflegegrad bei 35 Punkten im NBA?',opts:['PG 1','PG 2','PG 3','PG 4'],correct:1,exp:'PG 2: 27–47,4 Punkte = erhebliche Beeinträchtigung'},
  {q:'Patient kann nicht selbst essen, trinken oder Toilette benutzen. Wahrscheinlich?',opts:['PG 2','PG 3','PG 4','PG 5'],correct:2,exp:'PG 4: schwerste Beeinträchtigung, fast vollständig pflegeabhängig'},
  {q:'Was misst das NBA (Neues Begutachtungsassessment)?',opts:['Pflegestunden pro Tag','Grad der Selbstständigkeit','Anzahl der Erkrankungen','Medikamentenbedarf'],correct:1,exp:'NBA misst den Grad der Selbstständigkeit in 6 Modulen'},
  {q:'Welches Modul hat die höchste Gewichtung im NBA?',opts:['Modul 1 – Mobilität','Modul 3 – Verhaltensweisen','Modul 4 – Selbstversorgung','Modul 6 – Alltagsleben'],correct:2,exp:'Modul 4 (Selbstversorgung) hat 40% Gewichtung'},
  {q:'Pflegegeld bei Pflegegrad 3?',opts:['332€/Monat','573€/Monat','765€/Monat','947€/Monat'],correct:1,exp:'PG 3: Pflegegeld 573€/Monat'},
  {q:'Wer führt die Pflegegradbegutachtung durch?',opts:['Hausarzt','MDK / Medicproof','Krankenhaus','Sozialamt'],correct:1,exp:'MDK (bei gesetzl. KV) oder Medicproof (bei privater KV)'},
  {q:'Bei welchem Pflegegrad gibt es keinen Anspruch auf Pflegegeld?',opts:['PG 1','PG 2','PG 3','PG 4'],correct:0,exp:'PG 1: nur Entlastungsbetrag 125€, kein Pflegegeld'},
  {q:'Was bedeutet "Pflegesachleistung"?',opts:['Geld direkt an Pflegebedürftigen','Leistungen durch ambulanten Pflegedienst','Stationäre Heimunterbringung','Hilfsmittel wie Rollator'],correct:1,exp:'Pflegesachleistung = professioneller Pflegedienst erbringt Leistungen'},
];
const PRONUNCIATION_GUIDE=[
  {sound:'ä',ipa:'/ɛ/',hint:"như 'e' trong 'xe'",word:'Zähne',meaning:'Răng'},
  {sound:'ö',ipa:'/ø/',hint:"môi tròn, nói 'e'",word:'Körper',meaning:'Cơ thể'},
  {sound:'ü',ipa:'/y/',hint:"môi tròn, nói 'i'",word:'Stühle',meaning:'Ghế'},
  {sound:'ch (i/e)',ipa:'/ç/',hint:"như 'h' nhẹ ở cổ họng",word:'ich',meaning:'Tôi'},
  {sound:'ch (a/o/u)',ipa:'/x/',hint:"như 'kh' tiếng Việt",word:'Bauch',meaning:'Bụng'},
  {sound:'sch',ipa:'/ʃ/',hint:"như 'sh' tiếng Anh",word:'Schmerz',meaning:'Cơn đau'},
  {sound:'st (đầu)',ipa:'/ʃt/',hint:"đọc là 'sht'",word:'Stethoskop',meaning:'Ống nghe'},
  {sound:'sp (đầu)',ipa:'/ʃp/',hint:"đọc là 'shp'",word:'Sprache',meaning:'Ngôn ngữ'},
  {sound:'w',ipa:'/v/',hint:"đọc như 'v' tiếng Việt",word:'Wunde',meaning:'Vết thương'},
  {sound:'v',ipa:'/f/',hint:"đọc như 'f'",word:'Verband',meaning:'Băng bó'},
  {sound:'z',ipa:'/ts/',hint:"đọc như 'ts'",word:'Zunge',meaning:'Lưỡi'},
  {sound:'ei',ipa:'/aɪ/',hint:"đọc như 'ai'",word:'Bein',meaning:'Chân'},
  {sound:'ie',ipa:'/iː/',hint:"đọc như 'i' dài",word:'Fieber',meaning:'Sốt'},
  {sound:'eu/äu',ipa:'/ɔɪ/',hint:"đọc như 'oi'",word:'Häufig',meaning:'Thường gặp'},
  {sound:'r (đầu)',ipa:'/ʁ/',hint:'rung cổ họng',word:'Rücken',meaning:'Lưng'},
];
let _emState={idx:0,flipped:false,known:0,total:EMERGENCY_CARDS.length};
let _ssState={idx:0,answered:false,score:0,done:false};
let _pgState={tab:'info',qIdx:0,score:0,done:false};

// ════════════════════════════════════════════════════════
// GAMIFICATION — XP, Levels, Badges, Streak
// ════════════════════════════════════════════════════════
let LEVELS=[
  {min:0,   name:"Anfänger",      emoji:"🌱"},
  {min:100, name:"Lernender",     emoji:"📖"},
  {min:300, name:"Fortgeschrittener",emoji:"⚡"},
  {min:600, name:"Kompetent",     emoji:"🎯"},
  {min:1000,name:"Erfahren",      emoji:"🏅"},
  {min:1500,name:"Experte",       emoji:"🥇"},
  {min:2500,name:"Meister",       emoji:"🏆"},
  {min:4000,name:"Pflegeprofi",   emoji:"🌟"},
];
let ALL_BADGES=[
  {id:"first_flash", emoji:"🃏", name:"Thẻ đầu tiên",    cond:s=>s.flashDone>=1},
  {id:"flash10",     emoji:"🔟", name:"10 thẻ flashcard", cond:s=>s.flashDone>=10},
  {id:"flash50",     emoji:"🎴", name:"50 thẻ flashcard", cond:s=>s.flashDone>=50},
  {id:"flash100",    emoji:"💎", name:"100 thẻ flashcard",cond:s=>s.flashDone>=100},
  {id:"ex_first",    emoji:"✏️", name:"Bài tập đầu tiên",cond:s=>s.exDone>=1},
  {id:"ex_perfect",  emoji:"💯", name:"Vòng hoàn hảo",   cond:s=>s.exPerfectRound>=1},
  {id:"ex_3perfect", emoji:"🎯", name:"3 vòng hoàn hảo", cond:s=>s.exPerfectRound>=3},
  {id:"streak3",     emoji:"🔥", name:"3 ngày liên tiếp", cond:s=>s.streak>=3},
  {id:"streak7",     emoji:"🌟", name:"7 ngày liên tiếp", cond:s=>s.streak>=7},
  {id:"streak30",    emoji:"👑", name:"30 ngày liên tiếp",cond:s=>s.streak>=30},
  {id:"mastered10",  emoji:"🏅", name:"Thuộc 10 mục",     cond:s=>s.mastered>=10},
  {id:"mastered50",  emoji:"🥇", name:"Thuộc 50 mục",     cond:s=>s.mastered>=50},
  {id:"mastered100", emoji:"🏆", name:"Thuộc 100 mục",    cond:s=>s.mastered>=100},
  {id:"roleplay1",   emoji:"🤖", name:"Roleplay đầu tiên",cond:s=>s.roleplays>=1},
  {id:"roleplay5",   emoji:"🎭", name:"5 buổi roleplay",  cond:s=>s.roleplays>=5},
  {id:"dialogue1",   emoji:"💬", name:"Xem hội thoại đầu",cond:s=>s.dialogues>=1},
  {id:"dialogue5",   emoji:"📖", name:"Xem 5 hội thoại",  cond:s=>s.dialogues>=5},
  {id:"srs_first",   emoji:"🔁", name:"SRS đầu tiên",     cond:s=>s.flashDone>=1},
  {id:"xp100",       emoji:"⭐", name:"100 XP",            cond:s=>s.xp>=100},
  {id:"xp500",       emoji:"🌠", name:"500 XP",            cond:s=>s.xp>=500},
  {id:"xp2000",      emoji:"💫", name:"2000 XP",           cond:s=>s.xp>=2000},
  {id:"xp5000",      emoji:"🌌", name:"5000 XP · Pflegeprofi",cond:s=>s.xp>=5000},
];
let GS={xp:0,streak:1,mastered:0,flashDone:0,exDone:0,exPerfectRound:0,roleplays:0,dialogues:0,earnedBadges:[],lastDate:'',xpHistory:[]};

function addXP(n,label=''){
  const prev=getLevel(GS.xp);
  GS.xp+=n;
  addTodayXP(n);
  // Track daily XP history (last 30 days)
  const today=new Date().toISOString().slice(0,10);
  if(!GS.xpHistory)GS.xpHistory=[];
  const last=GS.xpHistory[GS.xpHistory.length-1];
  if(last&&last.d===today)last.x+=n;
  else{GS.xpHistory.push({d:today,x:n});if(GS.xpHistory.length>30)GS.xpHistory.shift();}
  const cur=getLevel(GS.xp);
  updateXPUI();
  if(label) toast(`+${n} XP · ${label}`);
  if(cur.min>prev.min){showLevelUp(cur);checkCertificate();}
  checkBadges();
  if(window._scheduleCloudSave) window._scheduleCloudSave();
}
function getLevel(xp){
  let lv=LEVELS[0];
  for(const l of LEVELS) if(xp>=l.min) lv=l;
  return lv;
}
function getNextLevel(xp){
  for(const l of LEVELS) if(l.min>xp) return l;
  return null;
}
function updateXPUI(){
  const lv=getLevel(GS.xp),nx=getNextLevel(GS.xp);
  const base=lv.min,top=nx?nx.min:GS.xp+1;
  const pct=Math.round((GS.xp-base)/(top-base)*100);
  document.getElementById('sb-level-lbl').textContent=`${lv.emoji} ${lv.name}`;
  document.getElementById('sb-xp-val').textContent=GS.xp+' XP';
  document.getElementById('sb-xp-fill').style.width=pct+'%';
  document.getElementById('sb-streak-txt').textContent=GS.streak+' ngày liên tiếp';
  document.getElementById('tb-xp').textContent=`⭐ ${GS.xp} XP`;
  document.getElementById('s-mastered').textContent=GS.mastered;
  // Update CEFR badge in topbar
  const cefrBadge=document.getElementById('tb-cefr');
  if(cefrBadge){const c=getCEFR(GS.xp);cefrBadge.textContent=c.level;cefrBadge.style.background=c.color+'20';cefrBadge.style.color=c.color;cefrBadge.style.borderColor=c.color+'40';}
}
function showLevelUp(lv){
  const t=document.getElementById('lvlToast');
  document.getElementById('lvlToastTitle').textContent=`Level Up! ${lv.emoji} ${lv.name}`;
  document.getElementById('lvlToastSub').textContent='Bạn đã đạt cấp độ mới!';
  t.classList.add('on');
  setTimeout(()=>t.classList.remove('on'),3000);
}
function checkBadges(){
  ALL_BADGES.forEach(b=>{
    if(!GS.earnedBadges.includes(b.id)&&b.cond(GS)){
      GS.earnedBadges.push(b.id);
      toast(`🏅 Huy hiệu mới: ${b.emoji} ${b.name}`);
    }
  });
}

// ════════════════════════════════════════════════════════
// SRS — Spaced Repetition System (SM-2)
// ════════════════════════════════════════════════════════
let SRS_DB={};// key=de, val={interval,ease,due,reps}

function saveSRS(){
  try{localStorage.setItem('srs_db',JSON.stringify(SRS_DB));}catch(e){}
  if(window._scheduleCloudSave) window._scheduleCloudSave();
}
function loadSRS(){try{const d=localStorage.getItem('srs_db');if(d)SRS_DB=JSON.parse(d);}catch(e){}}

function reviewSRS(p,q){
  let s=SRS_DB[p.de]||{interval:1,ease:2.5,reps:0,due:0};
  if(q>=3){
    s.reps++;
    if(s.reps===1) s.interval=1;
    else if(s.reps===2) s.interval=6;
    else s.interval=Math.round(s.interval*s.ease);
    s.ease=Math.max(1.3,s.ease+(0.1-(5-q)*(0.08+(5-q)*0.02)));
  } else {
    s.reps=0;s.interval=1;
  }
  s.due=Date.now()+s.interval*86400000;
  SRS_DB[p.de]=s;
  saveSRS();
  if(q>=4){GS.mastered++;document.getElementById('s-mastered').textContent=GS.mastered;}
  addXP(q>=4?10:q>=3?5:2,'SRS');
  GS.flashDone++;
}
function countDue(cat){
  const cards=cat&&cat!=='all'?flatCat(cat):flatAll();
  return cards.filter(p=>{const s=SRS_DB[p.de];return s&&s.due<=Date.now();}).length;
}
function getSRSTag(p){
  const s=SRS_DB[p.de];
  if(!s) return {tag:'new',label:'Mới'};
  if(s.due<=Date.now()) return {tag:'due',label:'Cần ôn'};
  return {tag:'review',label:'Đã học'};
}

// Session state — queue-based to prevent premature "Done"
const srsQ={queue:[],idx:0,card:null,flipped:false,ok:0,done:0,cat:'all',newLimit:10,xpEarned:0};

function buildSRSQueue(cat,newLimit){
  const pool=cat&&cat!=='all'?flatCat(cat):flatAll();
  const now=Date.now();
  const due=shuffle(pool.filter(p=>{const s=SRS_DB[p.de];return s&&s.due<=now;}));
  const nw=pool.filter(p=>!SRS_DB[p.de]).slice(0,newLimit);
  return [...due,...nw];
}

// ── Smart Queue: phân tích điểm yếu từ SRS_DB ────────────
function getWeakItems(){
  return flatAll()
    .filter(p=>{const s=SRS_DB[p.de];return s&&s.ease<2.2;})
    .sort((a,b)=>(SRS_DB[a.de]?.ease||0)-(SRS_DB[b.de]?.ease||0));
}
function startSmartSRS(){
  const weak=getWeakItems();
  if(!weak.length){toast('Chưa có dữ liệu điểm yếu. Hãy ôn SRS vài buổi trước!');return;}
  const queue=shuffle(weak).slice(0,20);
  srsQ.queue=queue;srsQ.idx=0;srsQ.ok=0;srsQ.done=0;srsQ.xpEarned=0;srsQ.flipped=false;
  renderSRSCard();
}
window.startSmartSRS=startSmartSRS;

// ── XP Chart 7 ngày gần nhất ─────────────────────────────
function renderWeekChart(){
  const now=new Date();
  const days=[],labels=[];
  for(let i=6;i>=0;i--){
    const d=new Date(now);d.setDate(d.getDate()-i);
    days.push(d.toISOString().slice(0,10));
    labels.push(['CN','T2','T3','T4','T5','T6','T7'][d.getDay()]);
  }
  const hist=GS.xpHistory||[];
  const vals=days.map(d=>{const e=hist.find(h=>h.d===d);return e?e.x:0;});
  const today=now.toISOString().slice(0,10);
  const max=Math.max(...vals,10);
  return `<div class="week-chart">${vals.map((v,i)=>`
    <div class="wc-col">
      <div class="wc-bar-wrap"><div class="wc-bar${days[i]===today?' wc-today':''}" style="height:${Math.round(v/max*100)}%" title="${v} XP"></div></div>
      <div class="wc-lbl${days[i]===today?' wc-today':''}">${labels[i]}</div>
      <div class="wc-val">${v||''}</div>
    </div>`).join('')}
  </div>`;
}

// ════════════════════════════════════════════════════════
// CORE HELPERS
// ════════════════════════════════════════════════════════
const flashState={};
let activeFCCat=null;
function flatCat(cat){if(!DATA[cat])return[];let a=[];DATA[cat].forEach(g=>g.i.forEach(p=>a.push({...p,cat})));return a;}
function flatAll(){let a=[];Object.keys(DATA).forEach(c=>flatCat(c).forEach(p=>a.push(p)));return a;}
function shuffle(arr){let a=[...arr];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function esc(s){return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');}
function toast(msg,ms=2500){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),ms);}
function speakDE(text){
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';u.rate=0.82;
  const vs=window.speechSynthesis.getVoices().filter(v=>v.lang.startsWith('de'));
  if(vs.length)u.voice=vs[0];
  window.speechSynthesis.speak(u);
}

// ── Word-by-word highlight TTS ────────────────────────────
let _hl=null;
function stopHighlight(){
  window.speechSynthesis?.cancel();
  if(!_hl)return;
  const {el,btn,text}=_hl;
  // Remove spans, restore plain text
  if(el){el.querySelectorAll('.hl-w').forEach(w=>w.classList.remove('hl-active','hl-done'));}
  if(btn){btn.innerHTML='▶ Nghe theo dõi';btn.classList.remove('hl-playing');}
  _hl=null;
}
function speakHighlight(text,el,btn,rate=0.78){
  if(_hl&&_hl.el===el){stopHighlight();return;}
  stopHighlight();
  if(!window.speechSynthesis){speakDE(text);return;}
  // Pre-compute word positions in text
  const words=[];const re=/\S+/g;let m;
  while((m=re.exec(text))!==null) words.push({s:m.index,e:m.index+m[0].length,w:m[0]});
  // Render word spans
  let html='',last=0;
  words.forEach((wp,i)=>{html+=text.slice(last,wp.s);html+=`<span class="hl-w" data-i="${i}">${wp.w}</span>`;last=wp.e;});
  html+=text.slice(last);
  el.innerHTML=html;
  const wEls=el.querySelectorAll('.hl-w');
  const u=new SpeechSynthesisUtterance(text);
  u.lang='de-DE';u.rate=rate;
  const vs=window.speechSynthesis.getVoices().filter(v=>v.lang.startsWith('de'));
  if(vs.length)u.voice=vs[0];
  let cur=-1;
  u.onboundary=e=>{
    if(e.name!=='word')return;
    const i=words.findIndex(wp=>e.charIndex>=wp.s&&e.charIndex<wp.e);
    if(i<0||i===cur)return;
    if(cur>=0)wEls[cur]?.classList.replace('hl-active','hl-done');
    wEls[i]?.classList.add('hl-active');
    cur=i;
  };
  u.onend=u.onerror=()=>{
    wEls.forEach(w=>{w.classList.remove('hl-active');w.classList.add('hl-done');});
    setTimeout(()=>wEls.forEach(w=>w.classList.remove('hl-done')),700);
    if(btn){btn.innerHTML='▶ Nghe theo dõi';btn.classList.remove('hl-playing');}
    if(_hl?.el===el)_hl=null;
  };
  if(btn){btn.innerHTML='⏸ Dừng';btn.classList.add('hl-playing');}
  _hl={el,btn,text};
  window.speechSynthesis.speak(u);
}
function speakHL(elId,text,btn){
  const el=document.getElementById(elId);
  if(!el){speakDE(text);return;}
  speakHighlight(text,el,btn);
}
function getDriveEmbedUrl(url){
  if(!url||!url.trim())return null;
  // Extract Google Drive file ID from various URL formats
  const m=url.match(/\/d\/([a-zA-Z0-9_-]{10,})/)||url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if(m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return url; // return as-is if not a Drive URL
}
function speakCurrentFC(cat,e){e.stopPropagation();const s=flashState[cat];if(s)speakDE(s.items[s.idx].de);}
function speakCurrentTyping(cat){const s=typingState[cat];if(s)speakDE(s.items[s.idx].de);}

const typingState={};

// COUNT
let totalItems=0;
function recomputeCounts(){
  totalItems=0;
  Object.keys(DATA).forEach(cat=>{
    const n=flatCat(cat).length;totalItems+=n;
    const el=document.getElementById('cnt-'+cat);if(el)el.textContent=n||'';
    const sel=document.getElementById('scnt-'+cat);if(sel)sel.textContent=n||'';
  });
  const tEl=document.getElementById('s-total');if(tEl)tEl.textContent=totalItems;
}
recomputeCounts();

// ════════════════════════════════════════════════════════
// NAV — dynamic sidebar
// ════════════════════════════════════════════════════════
// Convert default CAT_META → format giống DB categories để dùng khi Supabase chưa load
function getDefaultCatsList(){
  const list=[];
  PHRASE_CATS.forEach((k,i)=>{
    if(CAT_META[k]) list.push({key:k,label:CAT_META[k].l,icon:CAT_META[k].ic,section:'communication',sort_order:i+1});
  });
  VOCAB_CATS.forEach((k,i)=>{
    if(CAT_META[k]) list.push({key:k,label:CAT_META[k].l,icon:CAT_META[k].ic,section:'vocabulary',sort_order:PHRASE_CATS.length+i+1});
  });
  return list;
}
const CAT_COLORS=['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)','var(--c7)','var(--c8)','var(--pink)','var(--purple)','var(--teal)','var(--orange)','var(--yellow)','var(--green)','var(--blue)'];

function navTo(pg){
  document.querySelectorAll('.nav-it').forEach(i=>i.classList.remove('active'));
  const ni=document.querySelector('.nav-it[data-page="'+pg+'"]');
  if(ni) ni.classList.add('active');
  // Bottom nav — fixed pages get their own button; category pages highlight "Học từ"
  document.querySelectorAll('.bn-item[data-page]').forEach(i=>i.classList.remove('active'));
  const bi=document.querySelector('.bn-item[data-page="'+pg+'"]');
  if(bi) bi.classList.add('active');
  const isCatPage=!['dashboard','exercise','dialogue','srs','roleplay','learning-path','body-diagram','bookmarks','typing-speed','abbr','emergency-fc','shift-sim','pflegegrad','pronunciation','voice-practice','forgetting','shift-adv'].includes(pg);
  const bnCats=document.getElementById('bn-cats-btn');
  if(bnCats) bnCats.classList.toggle('active',isCatPage);
  // Category sheet active item
  document.querySelectorAll('.cats-sheet-it').forEach(i=>i.classList.remove('active'));
  const sci=document.querySelector('.cats-sheet-it[data-page="'+pg+'"]');
  if(sci) sci.classList.add('active');
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pageEl=document.getElementById('page-'+pg);
  if(pageEl) pageEl.classList.add('active');
  if(pg==='bookmarks')renderBookmarksPage();
  else if(pg==='learning-path')renderLearningPath();
  else if(pg==='body-diagram')renderBodyDiagram();
  else if(pg==='typing-speed')renderTypingSpeed();
  else if(pg==='abbr')renderAbbr();
  else if(pg==='emergency-fc')renderEmergency();
  else if(pg==='shift-sim')renderShiftSim();
  else if(pg==='pflegegrad')renderPflegegrad();
  else if(pg==='pronunciation')renderPronunciation();
  else if(pg==='voice-practice')renderVoicePractice();
  else if(pg==='forgetting')renderForgettingCurve();
  else if(pg==='shift-adv')renderShiftAdv();
  else if(isCatPage)ensurePage(pg);
  if(pg==='dashboard')renderDashboard();
  if(pg==='dialogue')renderDialogues();
  if(pg==='srs')renderSRS();
  if(pg==='roleplay')renderRoleplay();
  if(window.innerWidth<720)document.getElementById('sidebar').classList.remove('open');
  closeCatsSheet();
}

function buildSidebarCats(catsList){
  if(catsList) _dynCats=catsList;
  if(!_dynCats.length) return;
  const commEl=document.getElementById('nav-comm-cats');
  const vocabEl=document.getElementById('nav-vocab-cats');
  if(!commEl||!vocabEl) return;
  // Filter by active topic when one is selected
  let visible=_dynCats;
  if(_activeTopic!==null){
    const tp=_topics.find(t=>t.key===_activeTopic);
    if(tp) visible=_dynCats.filter(c=>c.topic_id===tp.id);
  }
  const commCats=visible.filter(c=>c.section==='communication');
  const vocabCats=visible.filter(c=>c.section!=='communication');
  const makeNavHTML=(cats,colorOff)=>cats.map((c,i)=>{
    const color=c.color||CAT_COLORS[(colorOff+i)%CAT_COLORS.length];
    return `<div class="nav-it" data-page="${sanitize(c.key)}" style="--tc:${sanitize(color)}" onclick="navTo('${sanitize(c.key)}')"><span class="nav-ic">${sanitize(c.icon)}</span>${sanitize(c.label)}<span class="nav-badge" id="cnt-${sanitize(c.key)}"></span></div>`;
  }).join('');
  commEl.innerHTML=makeNavHTML(commCats,0);
  vocabEl.innerHTML=makeNavHTML(vocabCats,4);
  // Show/hide section headers based on visible items
  const commSec=document.getElementById('nav-sec-comm');
  const vocabSec=document.getElementById('nav-sec-vocab');
  if(commSec) commSec.style.display=commCats.length?'':'none';
  if(vocabSec) vocabSec.style.display=vocabCats.length?'':'none';
  // Ensure page divs exist for ALL categories (not just filtered ones)
  const main=document.querySelector('.main');
  const refPage=document.getElementById('page-dialogue');
  _dynCats.forEach(c=>{
    if(!document.getElementById('page-'+c.key)){
      const div=document.createElement('div');
      div.className='page';
      div.id='page-'+c.key;
      if(refPage&&main) main.insertBefore(div,refPage);
      else if(main) main.appendChild(div);
    }
  });
  // Populate mobile category sheet (filtered)
  const sheetBody=document.getElementById('catsSheetBody');
  if(sheetBody){
    const commList=visible.filter(c=>c.section==='communication');
    const vocabList=visible.filter(c=>c.section!=='communication');
    let sh='';
    if(commList.length){
      sh+=`<div class="cats-sheet-sec">💬 Giao tiếp</div>`;
      sh+=commList.map(c=>`<div class="cats-sheet-it" data-page="${c.key}" onclick="navTo('${c.key}')"><span class="cats-sheet-ic">${c.icon}</span>${c.label}<span class="cats-sheet-cnt" id="scnt-${c.key}"></span></div>`).join('');
    }
    if(vocabList.length){
      sh+=`<div class="cats-sheet-sec">📚 Từ vựng</div>`;
      sh+=vocabList.map(c=>`<div class="cats-sheet-it" data-page="${c.key}" onclick="navTo('${c.key}')"><span class="cats-sheet-ic">${c.icon}</span>${c.label}<span class="cats-sheet-cnt" id="scnt-${c.key}"></span></div>`).join('');
    }
    sheetBody.innerHTML=sh;
  }
  recomputeCounts();
}

function renderTopicTabs(){
  const el=document.getElementById('topicTabs');
  if(!el) return;
  if(!_topics.length){el.style.display='none';return;}
  let html=`<button class="topic-tab${_activeTopic===null?' active':''}" onclick="navToTopic(null)">🌐 Tất cả</button>`;
  html+=_topics.map(t=>`<button class="topic-tab${_activeTopic===t.key?' active':''}" onclick="navToTopic('${sanitize(t.key)}')" style="--tc:${sanitize(t.color||'var(--blue)')}">${sanitize(t.icon)} ${sanitize(t.label)}</button>`).join('');
  el.innerHTML=html;
  el.style.cssText='display:flex!important;gap:6px;padding:.55rem 1.1rem .45rem;background:var(--s1);border-bottom:1px solid var(--b1);overflow-x:auto;scrollbar-width:none;flex-shrink:0;';
  console.info('[live] renderTopicTabs called, topics:', _topics.length);
}

function navToTopic(key){
  _activeTopic=key;
  renderTopicTabs();
  buildSidebarCats();
  const active=document.querySelector('.page.active');
  if(active&&active.id==='page-dialogue') renderDialogues();
}

document.querySelectorAll('.nav-it[data-page]').forEach(it=>{
  it.addEventListener('click',()=>navTo(it.dataset.page));
});

// Render ngay từ CAT_META mặc định — Supabase sẽ gọi lại buildSidebarCats() khi load xong
function renderBookmarksPage(){
  const page=document.getElementById('page-bookmarks');
  if(!page)return;
  const all=flatAll().filter(p=>_bookmarks.has(p.de));
  if(!all.length){
    page.innerHTML='<div class="ph"><div class="pt">❤️ Yêu thích</div><div class="ps">Các mục bạn đã đánh dấu</div></div><div style="text-align:center;padding:3rem;color:var(--t3);font-size:.85rem;">Chưa có mục yêu thích.<br>Nhấn 🤍 trên bất kỳ từ nào để lưu.</div>';
    return;
  }
  const html=all.map(p=>{
    const meta=CAT_META[p.cat]||{ic:'📚',l:p.cat};
    const safeDE=p.de.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    return `<div class="pi">
      <div class="pi-de">${p.de}
        <button class="pi-speak" data-de="${safeDE}" onclick="speakDE(this.dataset.de);event.stopPropagation();" title="Phát âm">🔊</button>
        <button class="bm-btn active" data-de="${safeDE}" onclick="toggleBookmark(this.dataset.de,this);event.stopPropagation();" title="Bỏ yêu thích">❤️</button>
      </div>
      <div class="pi-vi">${p.vi}</div>
      ${p.n?`<div class="pi-note">💡 ${p.n}</div>`:''}
      <div style="font-size:.66rem;color:var(--t3);margin-top:3px;">${meta.ic} ${meta.l}</div>
    </div>`;
  }).join('');
  page.innerHTML=`<div class="ph"><div class="pt">❤️ Yêu thích</div><div class="ps">${all.length} mục đã lưu</div></div><div>${html}</div>`;
}

buildSidebarCats(getDefaultCatsList());
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');}
document.addEventListener('click',e=>{
  if(window.innerWidth<720&&!e.target.closest('.sidebar')&&!e.target.closest('.menu-btn'))
    document.getElementById('sidebar').classList.remove('open');
});

// ── Theme toggle (dark / light) ──────────────────────────
function toggleTheme(){
  const html=document.documentElement;
  const next=html.dataset.theme==='light'?'dark':'light';
  html.dataset.theme=next;
  const btn=document.getElementById('themeBtn');
  if(btn) btn.textContent=next==='light'?'☀️':'🌙';
  localStorage.setItem('pd-theme',next);
}
(function initTheme(){
  const t=localStorage.getItem('pd-theme')||'dark';
  document.documentElement.dataset.theme=t;
  const btn=document.getElementById('themeBtn');
  if(btn) btn.textContent=t==='light'?'☀️':'🌙';
})();

// ── Mobile category sheet ─────────────────────────────────
function showCatsSheet(){
  document.getElementById('catsOverlay').classList.add('open');
  document.getElementById('catsSheet').classList.add('open');
}
function closeCatsSheet(){
  const o=document.getElementById('catsOverlay'),s=document.getElementById('catsSheet');
  if(o)o.classList.remove('open');
  if(s)s.classList.remove('open');
}

// ════════════════════════════════════════════════════════
// VOCAB/PHRASE PAGES
// ════════════════════════════════════════════════════════
function ensurePage(cat){
  const page=document.getElementById('page-'+cat);
  if(!page||page.innerHTML)return;
  const meta=CAT_META[cat];
  if(!meta)return;
  const isV=VOCAB_CATS.includes(cat);
  // Show skeleton while Supabase is still loading
  if(!_dataFromDB&&(!DATA[cat]||!DATA[cat].length)){
    page.innerHTML=`<div class="ph"><span class="skel skel-title"></span><span class="skel skel-line" style="width:28%"></span></div>${'<span class="skel skel-card"></span>'.repeat(5)}`;
    return;
  }
  page.innerHTML=`
    <div class="ph">
      <div class="pt">${meta.ic} ${meta.l}</div>
      <div class="ps">${flatCat(cat).length} mục</div>
      <div class="mode-tabs">
        <button class="mt active" onclick="setPMode('${cat}','list',this)">📋 Danh sách</button>
        <button class="mt" onclick="setPMode('${cat}','flash',this)">🃏 Flashcard</button>
        <button class="mt" onclick="setPMode('${cat}','type',this)">⌨️ Gõ chính tả</button>
      </div>
    </div>
    ${renderCatVideo(cat)}
    <div id="${cat}-lv">${renderListH(cat,isV)}</div>
    <div id="${cat}-fv" style="display:none;"></div>
    <div id="${cat}-tv" style="display:none;"></div>`;
}
function renderListH(cat,isV){
  if(!DATA[cat]||!DATA[cat].length) return `<div style="text-align:center;padding:3rem 1rem;color:var(--t3);font-size:.85rem;">Chưa có nội dung. Hãy thêm qua trang <a href="admin.html" style="color:var(--blue)">Admin</a>.</div>`;
  function itemHTML(p){
    const safeDE=p.de.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    const safeVI=p.vi.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    const safeNote=(p.n||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    const safeEx=(p.ex||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    const dataStr=`data-de="${safeDE}" data-vi="${safeVI}" data-note="${safeNote}" data-ex="${safeEx}"`;
    const note=p.n?('<div class="'+(isV?'vi2-n':'pi-note')+'">💡 '+sanitize(p.n)+'</div>'):'';
    const ex=p.ex?('<div class="pi-ex">📝 '+sanitize(p.ex)+'</div>'):'';
    const spk=`<button class="pi-speak" data-de="${safeDE}" onclick="speakDE(this.dataset.de);event.stopPropagation();" title="Phát âm">🔊</button>`;
    const isBm=_bookmarks.has(p.de);
    const bm=`<button class="bm-btn${isBm?' active':''}" data-de="${safeDE}" onclick="toggleBookmark(this.dataset.de,this);event.stopPropagation();" title="${isBm?'Bỏ yêu thích':'Thêm yêu thích'}">${isBm?'❤️':'🤍'}</button>`;
    if(isV) return `<div class="vi2" ${dataStr} onclick="showDictPopup(this,event)"><div class="vi2-de">${p.de}${spk}${bm}</div><div class="vi2-vi">${p.vi}</div>${note}${ex}</div>`;
    return `<div class="pi" ${dataStr} onclick="showDictPopup(this,event)"><div class="pi-de">${p.de}${spk}${bm}</div><div class="pi-vi">${p.vi}</div>${note}${ex}</div>`;
  }
  return DATA[cat].map(g=>`
    <div class="grp">
      <div class="grp-lbl">${g.g}</div>
      ${isV?'<div class="vg">'+g.i.map(itemHTML).join('')+'</div>':g.i.map(itemHTML).join('')}
    </div>`).join('');
}
function setPMode(cat,mode,btn){
  btn.parentElement.querySelectorAll('.mt').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  document.getElementById(cat+'-lv').style.display=mode==='list'?'':'none';
  document.getElementById(cat+'-fv').style.display=mode==='flash'?'':'none';
  document.getElementById(cat+'-tv').style.display=mode==='type'?'':'none';
  activeFCCat=mode==='flash'?cat:null;
  if(mode==='flash'){initFC(cat);renderFC(cat);}
  if(mode==='type'){initTyping(cat);renderTyping(cat);}
}

// ════════════════════════════════════════════════════════
// FLASHCARD ENGINE
// ════════════════════════════════════════════════════════
function initFC(cat){
  if(!flashState[cat]){
    const all=shuffle(flatCat(cat));
    flashState[cat]={allItems:all,items:all,idx:0,flipped:false,filter:'all'};
  }
}
function renderFC(cat){
  const el=document.getElementById(cat+'-fv');
  if(!el)return;
  if(!el.innerHTML){
    el.innerHTML=`
      <div class="fc-wrap">
        <div class="fc-filter-row" id="${cat}-ffr">
          <button class="fc-flt on" onclick="filterFC('${cat}','all',this)">Tất cả <b id="${cat}-ffall">-</b></button>
          <button class="fc-flt" onclick="filterFC('${cat}','new',this)">🆕 Mới <b id="${cat}-ffnew">-</b></button>
          <button class="fc-flt" onclick="filterFC('${cat}','due',this)">🔁 Ôn <b id="${cat}-ffdue">-</b></button>
          <button class="fc-flt" onclick="filterFC('${cat}','done',this)">✅ Học rồi <b id="${cat}-ffdone">-</b></button>
        </div>
        <div class="fc-prog-row">
          <div class="fc-pb"><div class="fc-pb-fill" id="${cat}-fp" style="width:0%"></div></div>
          <div class="fc-pc" id="${cat}-fpc">&nbsp;</div>
        </div>
        <div class="fc-scene" onclick="flipFC('${cat}')">
          <div class="fc-card" id="${cat}-fc">
            <div class="fc-face fc-front">
              <button class="fc-speak" onclick="speakCurrentFC('${cat}',event)" title="Phát âm">🔊</button>
              <div class="fc-lang">🇩🇪 Tiếng Đức</div>
              <div class="fc-txt" id="${cat}-fft"></div>
              <div class="fc-note" id="${cat}-ffn"></div>
              <div class="fc-hint">Nhấn để xem nghĩa ↓</div>
            </div>
            <div class="fc-face fc-back">
              <div class="fc-lang">🇻🇳 Tiếng Việt</div>
              <div class="fc-txt" id="${cat}-fbt"></div>
              <div class="fc-ex" id="${cat}-fbex"></div>
              <div class="fc-hint">Nhấn để lật lại ↑</div>
            </div>
          </div>
        </div>
        <div class="fc-rate" id="${cat}-fcr" style="display:none;">
          <button class="fc-rb hard" onclick="rateFC('${cat}',0)">😓 Khó (+2 XP)</button>
          <button class="fc-rb ok"   onclick="rateFC('${cat}',3)">👍 Nhớ được (+5 XP)</button>
          <button class="fc-rb easy" onclick="rateFC('${cat}',5)">⚡ Thuộc rồi (+10 XP)</button>
        </div>
        <div class="fc-nav">
          <button class="fc-nb" onclick="navFC('${cat}',-1)">← Trước</button>
          <button class="fc-shuf" onclick="shuffleFC('${cat}')">🔀 Xáo</button>
          <button class="fc-nb" onclick="navFC('${cat}',1)">Tiếp →</button>
        </div>
      </div>`;
  }
  updateFC(cat);
}
function updateFC(cat){
  const s=flashState[cat],p=s.items[s.idx];
  const srsTag=getSRSTag(p);
  document.getElementById(cat+'-fft').textContent=p.de;
  document.getElementById(cat+'-ffn').textContent=p.n?'💡 '+p.n:'';
  document.getElementById(cat+'-fbt').textContent=p.vi;
  const exEl=document.getElementById(cat+'-fbex');
  if(exEl)exEl.textContent=p.ex?'📝 '+p.ex:'';
  const card=document.getElementById(cat+'-fc');
  card.classList.remove('flip');
  // SRS tag
  let tag=card.querySelector('.fc-srs-tag');
  if(!tag){tag=document.createElement('div');tag.className='fc-srs-tag';card.querySelector('.fc-front').appendChild(tag);}
  tag.className='fc-srs-tag '+srsTag.tag;tag.textContent=srsTag.label;
  document.getElementById(cat+'-fcr').style.display='none';
  s.flipped=false;
  const pct=Math.round((s.idx+1)/s.items.length*100);
  document.getElementById(cat+'-fp').style.width=pct+'%';
  document.getElementById(cat+'-fpc').textContent=`${s.idx+1}/${s.items.length}`;
  updateFCCounts(cat);
}
function flipFC(cat){
  const s=flashState[cat];
  const card=document.getElementById(cat+'-fc');
  if(!s.flipped){
    card.classList.add('flip');
    document.getElementById(cat+'-fcr').style.display='flex';
    s.flipped=true;
  } else {
    card.classList.remove('flip');
    document.getElementById(cat+'-fcr').style.display='none';
    s.flipped=false;
  }
}
function rateFC(cat,q){
  const s=flashState[cat],p=s.items[s.idx];
  reviewSRS(p,q);
  GS.flashDone++;
  progressMission('flash5');
  updateXPUI();
  navFC(cat,1);
}
function navFC(cat,d){const s=flashState[cat];s.idx=(s.idx+d+s.items.length)%s.items.length;updateFC(cat);}
function shuffleFC(cat){const s=flashState[cat];s.items=shuffle(s.items);s.idx=0;updateFC(cat);}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape') hideDictPopup();
  if(!activeFCCat) return;
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  if(e.code==='Space'){e.preventDefault();flipFC(activeFCCat);}
  else if(e.code==='ArrowRight'){e.preventDefault();navFC(activeFCCat,1);}
  else if(e.code==='ArrowLeft'){e.preventDefault();navFC(activeFCCat,-1);}
});
document.addEventListener('click',function(e){
  const p=document.getElementById('dict-popup');
  if(p&&p.style.display!=='none'&&!p.contains(e.target))hideDictPopup();
});

// ════════════════════════════════════════════════════════
// DICTIONARY POPUP
// ════════════════════════════════════════════════════════
function showDictPopup(el,e){
  e.stopPropagation();
  const de=el.dataset.de||'', vi=el.dataset.vi||'';
  const note=el.dataset.note||'', ex=el.dataset.ex||'';
  document.getElementById('dict-de-txt').textContent=de;
  document.getElementById('dict-vi-txt').textContent=vi;
  const noteEl=document.getElementById('dict-note');
  noteEl.textContent=note?'💡 '+note:''; noteEl.style.display=note?'':'none';
  const exEl=document.getElementById('dict-ex');
  exEl.textContent=ex?'📝 '+ex:''; exEl.style.display=ex?'':'none';
  const srsEl=document.getElementById('dict-srs');
  const r=SRS_DB[de];
  if(!r){srsEl.textContent='🆕 Chưa học';srsEl.className='dict-srs new';}
  else if(r.due<=Date.now()){srsEl.textContent='🔁 Cần ôn lại';srsEl.className='dict-srs due';}
  else{srsEl.textContent='✅ Đã học · Ôn: '+new Date(r.due).toLocaleDateString('vi-VN');srsEl.className='dict-srs done';}
  const popup=document.getElementById('dict-popup');
  popup.style.display='block';
  const pw=popup.offsetWidth||280, ph=popup.offsetHeight||180;
  let x=e.clientX+14, y=e.clientY+14;
  if(x+pw>window.innerWidth-12) x=e.clientX-pw-14;
  if(y+ph>window.innerHeight-12) y=e.clientY-ph-14;
  popup.style.left=Math.max(8,x)+'px';
  popup.style.top=Math.max(8,y)+'px';
}
function hideDictPopup(){
  const p=document.getElementById('dict-popup');
  if(p) p.style.display='none';
}

function filterFC(cat,filter,btn){
  const s=flashState[cat];
  document.getElementById(cat+'-ffr').querySelectorAll('.fc-flt').forEach(b=>b.classList.remove('on'));
  if(btn)btn.classList.add('on');
  s.filter=filter;
  const all=s.allItems;
  const now=Date.now();
  if(filter==='new') s.items=all.filter(p=>!SRS_DB[p.de]);
  else if(filter==='due') s.items=all.filter(p=>{const r=SRS_DB[p.de];return r&&r.due<=now;});
  else if(filter==='done') s.items=all.filter(p=>{const r=SRS_DB[p.de];return r&&r.due>now;});
  else s.items=all;
  if(!s.items.length){toast('Không có thẻ trong bộ lọc này');s.items=[...all];s.filter='all';document.getElementById(cat+'-ffr').querySelector('.fc-flt').classList.add('on');}
  s.idx=0;s.flipped=false;
  updateFC(cat);
}
function updateFCCounts(cat){
  const s=flashState[cat];if(!s)return;
  const all=s.allItems,now=Date.now();
  const safe=(id,n)=>{const el=document.getElementById(id);if(el)el.textContent=n;};
  safe(cat+'-ffall',all.length);
  safe(cat+'-ffnew',all.filter(p=>!SRS_DB[p.de]).length);
  safe(cat+'-ffdue',all.filter(p=>{const r=SRS_DB[p.de];return r&&r.due<=now;}).length);
  safe(cat+'-ffdone',all.filter(p=>{const r=SRS_DB[p.de];return r&&r.due>now;}).length);
}

// ════════════════════════════════════════════════════════
// TYPING MODE ENGINE
// ════════════════════════════════════════════════════════
function initTyping(cat){
  if(!typingState[cat])typingState[cat]={items:shuffle(flatCat(cat)),idx:0,answered:false};
}
function renderTyping(cat){
  const el=document.getElementById(cat+'-tv');
  if(!el)return;
  if(!el.innerHTML){
    el.innerHTML=`
      <div class="ty-wrap">
        <div class="fc-prog-row">
          <div class="fc-pb"><div class="fc-pb-fill" id="${cat}-tp" style="width:0%"></div></div>
          <div class="fc-pc" id="${cat}-tpc">&nbsp;</div>
        </div>
        <div class="ty-card">
          <div class="fc-lang">🇻🇳 Đọc nghĩa — Gõ tiếng Đức</div>
          <div class="ty-vi" id="${cat}-tvi"></div>
          <div class="ty-note" id="${cat}-tn"></div>
        </div>
        <div class="ty-input-row">
          <input class="ty-inp" id="${cat}-tinp" type="text"
            placeholder="Gõ tiếng Đức tại đây..."
            autocomplete="off" autocorrect="off" spellcheck="false" autocapitalize="none"
            onkeydown="handleTypingKey(event,'${cat}')">
        </div>
        <div class="ty-result" id="${cat}-tres" style="display:none;"></div>
        <div class="ty-actions" id="${cat}-tact">
          <button class="ty-btn ty-btn-hint" onclick="hintTyping('${cat}')">💡 Gợi ý</button>
          <button class="ty-btn ty-btn-check" onclick="submitTyping('${cat}')">✓ Kiểm tra</button>
        </div>
        <div class="fc-nav">
          <button class="fc-nb" onclick="navTyping('${cat}',-1)">← Trước</button>
          <button class="fc-shuf" onclick="shuffleTyping('${cat}')">🔀 Xáo</button>
          <button class="fc-nb" onclick="navTyping('${cat}',1)">Tiếp →</button>
        </div>
      </div>`;
  }
  updateTyping(cat);
}
function updateTyping(cat){
  const s=typingState[cat],p=s.items[s.idx];
  document.getElementById(cat+'-tvi').textContent=p.vi;
  document.getElementById(cat+'-tn').textContent=p.n?'💡 '+p.n:'';
  const inp=document.getElementById(cat+'-tinp');
  inp.value='';inp.disabled=false;inp.className='ty-inp';
  const res=document.getElementById(cat+'-tres');
  res.style.display='none';res.innerHTML='';
  document.getElementById(cat+'-tact').innerHTML=`
    <button class="ty-btn ty-btn-hint" onclick="hintTyping('${cat}')">💡 Gợi ý</button>
    <button class="ty-btn ty-btn-check" onclick="submitTyping('${cat}')">✓ Kiểm tra</button>`;
  s.answered=false;
  const pct=Math.round((s.idx+1)/s.items.length*100);
  document.getElementById(cat+'-tp').style.width=pct+'%';
  document.getElementById(cat+'-tpc').textContent=`${s.idx+1}/${s.items.length}`;
  inp.focus();
}
function handleTypingKey(e,cat){
  if(e.key!=='Enter')return;
  const inp=document.getElementById(cat+'-tinp');
  if(!inp.disabled)submitTyping(cat);
  else navTyping(cat,1);
}
function submitTyping(cat){
  const s=typingState[cat],p=s.items[s.idx];
  const inp=document.getElementById(cat+'-tinp');
  const ans=inp.value.trim();
  if(!ans){inp.focus();return;}
  const norm=t=>t.toLowerCase().trim().replace(/\s+/g,' ');
  const correct=norm(ans)===norm(p.de);
  inp.disabled=true;
  inp.classList.add(correct?'correct':'wrong');
  const res=document.getElementById(cat+'-tres');
  res.style.display='flex';
  if(correct){
    res.className='ty-result ty-correct';
    res.innerHTML=`✅ Chính xác! <button class="ty-speak-btn" onclick="speakCurrentTyping('${cat}')">🔊 Phát âm</button>`;
    if(p.ex) res.innerHTML += `<div class="ty-ex">📝 ${p.ex}</div>`;
    if(!s.answered){addXP(8,'Gõ đúng');GS.flashDone++;s.answered=true;}
  } else {
    res.className='ty-result ty-wrong';
    res.innerHTML=`❌ Đáp án: <strong>${p.de}</strong> <button class="ty-speak-btn" onclick="speakCurrentTyping('${cat}')">🔊</button>`;
    if(p.ex) res.innerHTML += `<div class="ty-ex">📝 ${p.ex}</div>`;
  }
  document.getElementById(cat+'-tact').innerHTML=
    `<button class="ty-btn ty-btn-next" onclick="navTyping('${cat}',1)">Tiếp theo →</button>`;
}
function hintTyping(cat){
  const s=typingState[cat],p=s.items[s.idx];
  const inp=document.getElementById(cat+'-tinp');
  if(inp.disabled)return;
  const hintLen=Math.max(2,Math.ceil(p.de.length/3));
  inp.value=p.de.substring(0,hintLen);
  inp.focus();inp.setSelectionRange(hintLen,hintLen);
}
function navTyping(cat,d){
  const s=typingState[cat];
  s.idx=(s.idx+d+s.items.length)%s.items.length;
  updateTyping(cat);
}
function shuffleTyping(cat){
  const s=typingState[cat];
  s.items=shuffle(s.items);s.idx=0;
  updateTyping(cat);
}

// ════════════════════════════════════════════════════════
// SRS PAGE
// ════════════════════════════════════════════════════════
function renderSRS(){
  const el=document.getElementById('srs-main');
  const all=flatAll();
  const now=Date.now();
  const dueCount=all.filter(p=>{const s=SRS_DB[p.de];return s&&s.due<=now;}).length;
  const newCount=all.filter(p=>!SRS_DB[p.de]).length;
  const learnedCount=all.filter(p=>{const s=SRS_DB[p.de];return s&&s.due>now;}).length;
  const totalReviewed=all.filter(p=>SRS_DB[p.de]).length;

  // Category options
  const cats=_dynCats.length?_dynCats:getDefaultCatsList();
  const catOpts=cats.map(c=>`<option value="${c.key}"${srsQ.cat===c.key?'selected':''}>${c.icon||''} ${c.label}</option>`).join('');

  el.innerHTML=`
    <div class="srs-overview">
      <div class="srs-stats-row">
        <div class="srs-stat-card srs-stat-due"><div class="srs-stat-num">${dueCount}</div><div class="srs-stat-lbl">Cần ôn hôm nay</div></div>
        <div class="srs-stat-card srs-stat-new"><div class="srs-stat-num">${newCount}</div><div class="srs-stat-lbl">Thẻ mới</div></div>
        <div class="srs-stat-card srs-stat-learned"><div class="srs-stat-num">${learnedCount}</div><div class="srs-stat-lbl">Đã thuộc</div></div>
      </div>
      <div class="srs-cfg">
        <div class="srs-cfg-row">
          <label class="srs-cfg-lbl">Danh mục</label>
          <select class="srs-cfg-sel" onchange="srsQ.cat=this.value">
            <option value="all"${srsQ.cat==='all'?' selected':''}>📚 Tất cả</option>
            ${catOpts}
          </select>
        </div>
        <div class="srs-cfg-row">
          <label class="srs-cfg-lbl">Thẻ mới mỗi phiên</label>
          <div class="srs-limit-btns">
            ${[5,10,20,50].map(n=>`<button class="srs-limit-btn${srsQ.newLimit===n?' active':''}" onclick="srsQ.newLimit=${n};renderSRS()">${n}</button>`).join('')}
          </div>
        </div>
      </div>
      <button class="srs-start-btn srs-start-big" onclick="startSRSSession()" ${dueCount===0&&newCount===0?'disabled':''}>
        ${dueCount>0?`🔁 Ôn ${dueCount} thẻ hôm nay`:`✨ Học ${Math.min(srsQ.newLimit,newCount)} thẻ mới`}
      </button>
      ${(()=>{const wk=getWeakItems();return wk.length?`<button class="srs-start-btn srs-smart-btn" onclick="startSmartSRS()">🎯 Học thông minh · ${wk.length} từ điểm yếu</button>`:'';})()}
      ${dueCount===0&&newCount===0?'<div class="srs-allgood">🎉 Tuyệt vời! Hôm nay bạn đã hoàn thành tất cả. Quay lại ngày mai nhé!</div>':''}
      ${totalReviewed>0?`<div class="srs-prog-row"><div class="srs-prog-bar" style="width:${Math.round(learnedCount/all.length*100)}%"></div></div><div class="srs-prog-lbl">${learnedCount}/${all.length} thẻ đã học (${Math.round(learnedCount/all.length*100)}%)</div>`:''}
    </div>`;
}

function startSRSSession(){
  const queue=buildSRSQueue(srsQ.cat,srsQ.newLimit);
  if(!queue.length){renderSRS();return;}
  srsQ.queue=queue;
  srsQ.idx=0;
  srsQ.ok=0;
  srsQ.done=0;
  srsQ.xpEarned=0;
  srsQ.flipped=false;
  renderSRSCard();
}

function renderSRSCard(){
  const el=document.getElementById('srs-main');
  const card=srsQ.queue[srsQ.idx];
  if(!card){renderSRSDone();return;}
  srsQ.card=card;
  srsQ.flipped=false;
  const tag=getSRSTag(card);
  const pct=Math.round(srsQ.idx/srsQ.queue.length*100);
  el.innerHTML=`
    <div class="srs-session-hdr">
      <button class="srs-back-btn" onclick="renderSRS()">← Thoát</button>
      <div class="srs-progress-wrap">
        <div class="srs-progress-bar"><div class="srs-progress-fill" style="width:${pct}%"></div></div>
        <div class="srs-progress-lbl">${srsQ.idx}/${srsQ.queue.length} · ✓${srsQ.ok} ✗${srsQ.done-srsQ.ok}</div>
      </div>
    </div>
    <div class="fc-wrap">
      <div class="fc-scene" onclick="flipSRS()">
        <div class="fc-card" id="srs-card">
          <div class="fc-face fc-front">
            <span class="fc-srs-tag ${tag.tag}">${tag.label}</span>
            <div class="fc-lang">🇩🇪 Tiếng Đức</div>
            <div class="fc-txt">${card.de}</div>
            ${card.n?'<div class="fc-note">💡 '+card.n+'</div>':''}
            <div class="fc-hint">Nhấn để xem nghĩa ↓</div>
          </div>
          <div class="fc-face fc-back">
            <span class="fc-srs-tag ${tag.tag}">${tag.label}</span>
            <div class="fc-lang">🇻🇳 Tiếng Việt</div>
            <div class="fc-txt">${card.vi}</div>
            <div style="font-size:.7rem;color:var(--t3);margin-top:.6rem;">${CAT_META[card.cat]?.ic||''} ${CAT_META[card.cat]?.l||''}</div>
            ${renderMemoSection(card.de)}
          </div>
        </div>
      </div>
      <div class="fc-rate" id="srs-rate" style="display:none;">
        <button class="fc-rb hard" onclick="rateSRS(0)">😓 Khó</button>
        <button class="fc-rb ok"   onclick="rateSRS(3)">👍 Nhớ được</button>
        <button class="fc-rb easy" onclick="rateSRS(5)">⚡ Thuộc rồi</button>
      </div>
      <div class="srs-speak-row" style="gap:6px;flex-wrap:wrap;">
        <button class="srs-speak-btn" onclick="speakDE('${esc(card.de)}')">🔊 Nghe phát âm</button>
        ${/[a-zäöüß]+en$/i.test(card.de.trim())?`<button class="srs-speak-btn" onclick="showConjugation('${esc(card.de.split(/[\s,]/)[0])}')">🔠 Chia động từ</button>`:''}
      </div>
    </div>`;
}

function renderSRSDone(){
  const el=document.getElementById('srs-main');
  el.innerHTML=`
    <div class="srs-done">
      <div class="srs-done-ic">🎉</div>
      <div class="srs-done-title">Phiên hoàn thành!</div>
      <div class="srs-done-stats">
        <div class="srs-done-stat"><span class="srs-done-n ok">${srsQ.ok}</span><span>đúng</span></div>
        <div class="srs-done-stat"><span class="srs-done-n fail">${srsQ.done-srsQ.ok}</span><span>sai</span></div>
        <div class="srs-done-stat"><span class="srs-done-n xp">+${srsQ.xpEarned}</span><span>XP</span></div>
      </div>
      <div class="srs-done-sub">Bạn đã ôn ${srsQ.done} thẻ. Hệ thống sẽ nhắc lại đúng lúc bạn sắp quên!</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button class="srs-start-btn" onclick="startSRSSession()">🔄 Ôn tiếp</button>
        <button class="srs-start-btn" style="background:var(--s3);color:var(--tx);" onclick="renderSRS()">← Về tổng quan</button>
      </div>
    </div>`;
}

function flipSRS(){
  if(!srsQ.flipped){
    document.getElementById('srs-card').classList.add('flip');
    document.getElementById('srs-rate').style.display='flex';
    srsQ.flipped=true;
  }
}
function rateSRS(q){
  reviewSRS(srsQ.card,q);
  srsQ.done++;
  if(q>=3) srsQ.ok++;
  srsQ.xpEarned+=(q>=4?10:q>=3?5:2);
  progressMission('srs10');
  updateXPUI();
  // Hard card: push a copy to end of queue so it repeats this session
  if(q===0) srsQ.queue.push({...srsQ.card});
  srsQ.idx++;
  setTimeout(renderSRSCard,280);
}

// ════════════════════════════════════════════════════════
// DIALOGUES
// ════════════════════════════════════════════════════════
function renderDialogues(){
  const el=document.getElementById('dialogue-list');
  let filtered=DIALOGUES;
  if(_activeTopic!==null){
    const tp=_topics.find(t=>t.key===_activeTopic);
    if(tp) filtered=DIALOGUES.filter(d=>d.topic_id===tp.id);
  }
  el.innerHTML=filtered.map((d,i)=>{
    const embedUrl=getDriveEmbedUrl(d.audio_url);
    const audioHtml=embedUrl?`<div class="dial-audio"><div class="dial-audio-lbl">🎙 Audio bản gốc</div><iframe src="${embedUrl}" class="dial-audio-frame" allow="autoplay" allowfullscreen></iframe></div>`:'';
    const diffLabel=d.diff==='easy'?'Cơ bản':d.diff==='medium'?'Trung bình':'Nâng cao';
    const lines=d.lines.map((l,j)=>{
      const id=`dl-${i}-${j}`;
      const av=l.role==='nurse'?'👩‍⚕️':l.role==='doctor'?'👨‍⚕️':'🧑‍🦱';
      const deEsc=esc(l.de);
      return `<div class="dial-line ${l.role}"><div class="dial-avatar">${av}</div><div><div class="dial-bubble"><div class="dial-de" id="${id}">${l.de}</div><div class="dial-vi">${l.vi}</div></div><button class="dial-speak" onclick="speakHL('${id}','${deEsc}',this)">▶ Nghe theo dõi</button></div></div>`;
    }).join('');
    return `<div class="dial-card" id="dial-${i}">
      <div class="dial-header" onclick="toggleDial(${i})">
        <div class="dial-icon">${d.icon}</div>
        <div class="dial-title">${d.title}</div>
        <div class="dial-meta"><span class="diff-${d.diff}" style="padding:2px 7px;border-radius:20px;font-size:.65rem;font-weight:600;background:rgba(255,255,255,.06);">${diffLabel}</span></div>
        <div class="dial-arrow">›</div>
      </div>
      <div class="dial-body">${audioHtml}${lines}</div>
    </div>`;
  }).join('');
}
function toggleDial(i){
  const c=document.getElementById('dial-'+i);
  c.classList.toggle('open');
  if(c.classList.contains('open')){GS.dialogues++;checkBadges();}
}

// ════════════════════════════════════════════════════════
// AI ROLEPLAY (Claude-powered via Anthropic API)
// ════════════════════════════════════════════════════════
const RP_SCENARIOS=[
  {id:'patient_pain',   icon:'🤕',title:'BN đau bụng',          desc:'Hỏi thăm & đánh giá cơn đau',           role:'Patient mit Bauchschmerzen',       diff:'easy',  color:'var(--green)',  hints:['Haben Sie Schmerzen?','Wie stark auf einer Skala?','Strahlt der Schmerz aus?','Seit wann haben Sie diese Beschwerden?']},
  {id:'patient_vitals', icon:'💉',title:'Đo sinh hiệu & thuốc', desc:'Tiến hành đo sinh hiệu, phát thuốc',    role:'Patient der Medikamente bekommt',  diff:'easy',  color:'var(--blue)',   hints:['Ich messe Ihren Blutdruck.','Ich gebe Ihnen Ihre Medikamente.','Haben Sie Allergien?','Nehmen Sie das Medikament nach dem Essen.']},
  {id:'patient_diet',   icon:'🥗',title:'Tư vấn dinh dưỡng',   desc:'Hỏi về dị ứng và chế độ ăn',            role:'Patient mit Ernährungsfragen',     diff:'easy',  color:'var(--teal)',   hints:['Haben Sie Allergien gegen Lebensmittel?','Bitte trinken Sie ausreichend.','Ich bringe Ihnen das Essen.','Können Sie selbstständig essen?']},
  {id:'colleague_report',icon:'📋',title:'Báo cáo SBAR bác sĩ', desc:'Báo cáo BN nặng theo chuẩn SBAR',       role:'Diensthabender Arzt',              diff:'medium',color:'var(--yellow)', hints:['Ich möchte einen Patienten vorstellen.','Die Vitalzeichen sind...','Ich bitte um eine Anordnung.','Soll ich Bedarfsmedikation geben?']},
  {id:'handover',       icon:'🔄',title:'Bàn giao ca Übergabe', desc:'Bàn giao ca theo chuẩn SBAR',           role:'Pflegekollege der Spätschicht',    diff:'medium',color:'var(--purple)', hints:['Ich gebe die Übergabe für...','Die Medikamente wurden gegeben.','Bitte achten Sie besonders auf...','Sonst keine Auffälligkeiten.']},
  {id:'dementia',       icon:'🧠',title:'BN mất trí nhớ',       desc:'Giao tiếp với BN có Demenz',            role:'Patient mit Demenz',               diff:'hard',  color:'var(--pink)',   hints:['Sie sind im Krankenhaus.','Sie sind hier sicher.','Ich bin bei Ihnen.','Möchten Sie frühstücken?']},
  {id:'emergency',      icon:'🚨',title:'Tình huống khẩn cấp',  desc:'BN ngã, hợp tác xử lý cấp cứu',        role:'Kollege in der Notfallsituation',  diff:'hard',  color:'var(--red)',    hints:['Notruf! Kommen Sie sofort!','Patient ist bewusstlos.','Ich beginne mit der CPR.','Defi bitte!']},
  {id:'refuse',         icon:'🤝',title:'BN từ chối điều trị',  desc:'Thuyết phục BN đồng ý thủ thuật',      role:'Patient der eine Spritze ablehnt', diff:'hard',  color:'var(--orange)', hints:['Ich höre Sie.','Darf ich erklären, warum das wichtig ist?','Sie können jederzeit stopp sagen.','Das verstehe ich vollkommen.']},
];
let rpActive=null,rpMsgs=[];
function renderRoleplay(){
  const el=document.getElementById('rp-main');
  if(rpActive){renderRPChat();return;}
  el.innerHTML=`
    <div class="rp-scenarios">${RP_SCENARIOS.map(s=>'<div class="rp-sc" style="--sc-color:'+s.color+'" onclick="startRP(\''+s.id+'\')"><div class="rp-sc-ic">'+s.icon+'</div><div class="rp-sc-title">'+s.title+'</div><div class="rp-sc-desc">'+s.desc+'</div><div class="rp-sc-diff diff-'+s.diff+'">'+(s.diff==='easy'?'Cơ bản':s.diff==='medium'?'Trung bình':'Nâng cao')+'</div></div>').join('')}</div>
    <div style="background:var(--s2);border:1px solid var(--b1);border-radius:var(--rl);padding:.85rem 1rem;font-size:.78rem;color:var(--t2);">
      💡 <strong style="color:var(--tx);">Cách dùng:</strong> Chọn tình huống → AI đóng vai bệnh nhân/đồng nghiệp → Bạn trả lời bằng tiếng Đức → AI phản hồi và sửa lỗi.
    </div>`;
}
async function startRP(id){
  rpActive=RP_SCENARIOS.find(s=>s.id===id);
  rpMsgs=[];
  GS.roleplays++;checkBadges();addXP(5,'Roleplay bắt đầu');
  renderRPChat();
  await sendRPMessage(null,true);
}
function renderRPChat(){
  const el=document.getElementById('rp-main');
  const s=rpActive;
  el.innerHTML=`
    <div class="rp-chat on">
      <div class="rp-chat-head">
        <div class="rp-ch-avatar">${s.icon}</div>
        <div class="rp-ch-info">
          <div class="rp-ch-name">${s.title}</div>
          <div class="rp-ch-role">AI đóng vai: ${s.role}</div>
        </div>
        <button class="rp-ch-back" onclick="endRP()">← Thoát</button>
      </div>
      <div class="rp-msgs" id="rp-msgs"></div>
      <div class="rp-hints" id="rp-hints">
        ${s.hints.map(h=>'<button class="rp-hint-btn" onclick="useHint(\''+esc(h)+'\')">'+h+'</button>').join('')}
      </div>
      <div class="rp-input-row">
        <textarea class="rp-input" id="rp-input" rows="2" placeholder="Gõ câu trả lời bằng tiếng Đức... (hoặc tiếng Việt)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendRP();}"></textarea>
        <button class="rp-send" onclick="sendRP()">Gửi ↵</button>
      </div>
      <div style="font-size:.68rem;color:var(--t3);margin-top:4px;">Enter để gửi · Shift+Enter xuống dòng · AI sẽ sửa lỗi tiếng Đức nếu cần</div>
    </div>`;
}
function addRPMsg(role,de,vi,hint){
  const c=document.getElementById('rp-msgs');
  if(!c)return;
  const d=document.createElement('div');
  d.className='rp-msg '+(role==='ai'?'ai':'user');
  d.innerHTML=`
    <div class="rp-av">${role==='ai'?(rpActive?rpActive.icon:'🤖'):'🧑‍⚕️'}</div>
    <div class="rp-bub">
      <div class="rp-bub-de">${de}</div>
      ${vi?'<div class="rp-bub-vi">'+vi+'</div>':''}
      ${hint?'<div class="rp-bub-hint">💡 '+hint+'</div>':''}
    </div>`;
  c.appendChild(d);c.scrollTop=c.scrollHeight;
}
function showTyping(){
  const c=document.getElementById('rp-msgs');if(!c)return;
  const d=document.createElement('div');d.className='rp-msg ai';d.id='rp-typing';
  d.innerHTML=`<div class="rp-av">${rpActive?rpActive.icon:'🤖'}</div><div class="rp-typing"><span></span><span></span><span></span></div>`;
  c.appendChild(d);c.scrollTop=c.scrollHeight;
}
function removeTyping(){const t=document.getElementById('rp-typing');if(t)t.remove();}
async function sendRPMessage(userMsg,isInit=false){
  if(isInit){showTyping();}
  const systemPrompt=`Du bist ein KI-Rollenspielpartner für vietnamesische Pflegeschüler, die Deutsch lernen.
Szenario: "${rpActive.title}". Du spielst die Rolle: "${rpActive.role}".

REGELN:
1. Antworte IMMER auf Deutsch (1-3 kurze Sätze, realistisch für die Situation)
2. Wenn der Nutzer Fehler macht: korrigiere freundlich auf Deutsch, dann antworte
3. Gib am Ende jeder Antwort eine kurze Übersetzung in eckigen Klammern: [Việt: ...]
4. Beim Start: Begrüße auf Deutsch und beginne das Rollenspiel direkt
5. Bleib in der Rolle, sei geduldig und ermutigend
6. Wenn der Nutzer auf Vietnamesisch schreibt: antworte kurz auf Vietnamesisch und bitte ihn, Deutsch zu versuchen`;

  const messages=isInit?[{role:'user',content:'Beginne das Rollenspiel.'}]:
    [...rpMsgs,{role:'user',content:userMsg||''}];

  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:300,system:systemPrompt,messages})
    });
    const data=await res.json();
    removeTyping();
    const reply=data.content?.[0]?.text||'[Lỗi kết nối AI]';
    // Parse DE and VI parts
    const viMatch=reply.match(/\[Việt:\s*(.*?)\]/s);
    const deText=reply.replace(/\[Việt:.*?\]/s,'').trim();
    const viText=viMatch?viMatch[1].trim():'';
    rpMsgs.push({role:'user',content:userMsg||'Beginne das Rollenspiel.'});
    rpMsgs.push({role:'assistant',content:reply});
    addRPMsg('ai',deText,viText);
    addXP(8,'Roleplay câu trả lời');
  }catch(e){
    removeTyping();
    addRPMsg('ai','[Lỗi: Không kết nối được AI. Vui lòng thử lại.]','');
  }
}
function sendRP(){
  const inp=document.getElementById('rp-input');
  const msg=inp.value.trim();if(!msg)return;
  inp.value='';
  addRPMsg('user',msg,'');
  showTyping();
  sendRPMessage(msg);
}
function useHint(h){const i=document.getElementById('rp-input');if(i)i.value=h;i.focus();}
function endRP(){rpActive=null;rpMsgs=[];renderRoleplay();}

// ════════════════════════════════════════════════════════
// EXERCISES ENGINE
// ════════════════════════════════════════════════════════
const EX_ROUND=10;
let exType='',exPool=[],exIdx=0,exOk=0,exFail=0,exStreak=0,exAnswered=false,exRoundXP=0;
let matchLeft=[],matchRight=[],matchCount=0;
let mSide='',mIdx=-1,mDe='';
let autoT=null;

function startEx(type){
  exType=type;exPool=shuffle(flatAll()).slice(0,EX_ROUND);
  exIdx=0;exOk=0;exFail=0;exStreak=0;exRoundXP=0;
  document.getElementById('exMenu').classList.add('off');
  document.getElementById('exRunner').classList.add('on');
  updateExScore();loadExQ();
}
let _mockInterval=null,_mockTimeLeft=0;
function startMockExam(){
  exType='mock';exPool=shuffle(flatAll()).slice(0,20);
  exIdx=0;exOk=0;exFail=0;exStreak=0;exRoundXP=0;
  document.getElementById('exMenu').classList.add('off');
  document.getElementById('exRunner').classList.add('on');
  const timerEl=document.getElementById('ex-timer');
  if(timerEl)timerEl.style.display='';
  _mockTimeLeft=300;
  clearInterval(_mockInterval);
  _mockInterval=setInterval(()=>{
    _mockTimeLeft--;
    const m=Math.floor(_mockTimeLeft/60),s=_mockTimeLeft%60;
    const el=document.getElementById('ex-timer');
    if(el)el.textContent=`⏱ ${m}:${String(s).padStart(2,'0')}`;
    if(_mockTimeLeft<=0){clearInterval(_mockInterval);showMockDone(true);}
  },1000);
  updateExScore();loadExQ();
}
function showMockDone(timeout=false){
  clearInterval(_mockInterval);
  const timerEl=document.getElementById('ex-timer');if(timerEl)timerEl.style.display='none';
  const total=exOk+exFail||1,pct=Math.round(exOk/total*100);
  const grade=pct>=90?'🏆 Xuất sắc':pct>=75?'🥇 Giỏi':pct>=60?'🥈 Khá':pct>=45?'🥉 Trung bình':'💪 Cần cố gắng thêm';
  GS.exDone+=exPool.length;if(pct===100)GS.exPerfectRound++;checkBadges();
  const bonusXP=Math.round(pct/5);addXP(bonusXP,'Thi thử');
  document.getElementById('exContent').innerHTML=`
    <div style="text-align:center;padding:2rem 1rem">
      <div style="font-size:3rem;margin-bottom:.5rem">${grade.split(' ')[0]}</div>
      <div style="font-size:1.2rem;font-weight:700;margin-bottom:.2rem">${grade.split(' ').slice(1).join(' ')}</div>
      ${timeout?'<div style="color:var(--red);font-size:.8rem;margin-bottom:.5rem">⏰ Hết giờ!</div>':''}
      <div style="font-size:2rem;font-weight:800;color:${pct>=60?'var(--teal)':'var(--orange)'};margin:.8rem 0">${pct}%</div>
      <div style="font-size:.85rem;color:var(--t2);margin-bottom:1.2rem">${exOk}/${total} câu đúng · +${bonusXP} XP</div>
      <div style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap">
        <button class="ib pri" onclick="startMockExam()">🔄 Thi lại</button>
        <button class="ib" onclick="backToExMenu()">← Quay lại</button>
      </div>
    </div>`;
}
window.startMockExam=startMockExam;
function backToExMenu(){
  clearTimeout(autoT);clearInterval(_mockInterval);
  const timerEl=document.getElementById('ex-timer');if(timerEl)timerEl.style.display='none';
  document.getElementById('exMenu').classList.remove('off');document.getElementById('exRunner').classList.remove('on');
}
function resetEx(){
  clearTimeout(autoT);clearInterval(_mockInterval);
  const timerEl=document.getElementById('ex-timer');if(timerEl)timerEl.style.display='none';
  exPool=shuffle(flatAll()).slice(0,EX_ROUND);exIdx=0;exOk=0;exFail=0;exStreak=0;exRoundXP=0;updateExScore();loadExQ();
}
function updateExScore(){
  document.getElementById('ex-ok').textContent=exOk+' đúng';
  document.getElementById('ex-fail').textContent=exFail+' sai';
  document.getElementById('ex-streak').textContent='🔥 '+exStreak;
  document.getElementById('ex-xp').textContent='+'+exRoundXP+' XP';
  const pf=document.getElementById('ex-prog-fill');if(pf)pf.style.width=(exIdx/exPool.length*100)+'%';
  const pc=document.getElementById('ex-prog-cnt');if(pc)pc.textContent=exIdx+'/'+exPool.length;
}
function loadExQ(){
  clearTimeout(autoT);
  if(exIdx>=exPool.length){exType==='mock'?showMockDone():showRoundDone();return;}
  exAnswered=false;updateExScore();
  if(exType==='mcq'||exType==='mock') loadMCQ();
  else if(exType==='de2vi') loadFill('de2vi');
  else if(exType==='vi2de') loadFill('vi2de');
  else if(exType==='match') loadMatch();
  else if(exType==='listening') loadListening();
  else if(exType==='context')   loadContext();

}
function showRoundDone(){
  const pct=Math.round(exOk/(exOk+exFail||1)*100);
  const m=pct>=90?'🏆':pct>=70?'🥈':pct>=50?'🥉':'💪';
  if(pct===100){GS.exPerfectRound++;checkBadges();}
  GS.exDone+=EX_ROUND;checkBadges();
  progressMission('ex1');
  document.getElementById('exContent').innerHTML=`
    <div style="text-align:center;padding:2rem 1rem;">
      <div style="font-size:3rem;margin-bottom:.5rem;">${m}</div>
      <div style="font-size:1.1rem;font-weight:700;margin-bottom:.3rem;">Vòng hoàn thành!</div>
      <div style="color:var(--t2);font-size:.83rem;margin-bottom:1.2rem;">${exOk} đúng · ${exFail} sai · ${pct}% · +${exRoundXP} XP</div>
      <div style="display:flex;gap:7px;justify-content:center;flex-wrap:wrap;">
        <button class="ex-sub" onclick="resetEx()">🔄 Vòng mới</button>
        <button class="ex-back" onclick="backToExMenu()" style="margin:0;">← Đổi bài tập</button>
      </div>
    </div>`;
}
const AUTO_OK=1200,AUTO_FAIL=2300;
function scheduleNext(ok){
  const d=ok?AUTO_OK:AUTO_FAIL;let r=d;
  const nxt=document.getElementById('ex-nxt'),cnt=nxt?.querySelector?.('.cnt');
  if(nxt)nxt.classList.add('on');
  const tick=setInterval(()=>{r-=100;if(cnt)cnt.textContent=`(${(r/1000).toFixed(1)}s)`;if(r<=0){clearInterval(tick);nextExQ();}},100);
  autoT=tick;
}
function nextExQ(){clearTimeout(autoT);exIdx++;loadExQ();}
function buildFrame(ql,qt,qh,body){
  const pct=exPool.length?(exIdx/exPool.length*100):0;
  return `
    <div style="display:flex;align-items:center;gap:9px;margin-bottom:.85rem;">
      <div style="flex:1;height:4px;background:var(--b2);border-radius:2px;overflow:hidden;">
        <div id="ex-prog-fill" style="height:100%;background:linear-gradient(90deg,var(--blue),var(--teal));border-radius:2px;width:${pct}%;transition:width .4s;"></div>
      </div>
      <div id="ex-prog-cnt" style="font-size:.7rem;color:var(--t3);">${exIdx}/${exPool.length}</div>
    </div>
    <div class="ex-hdr"><div class="ex-ql">${ql}</div><div class="ex-qt">${qt}</div>${qh?'<div class="ex-qh">'+qh+'</div>':''}</div>
    ${body}
    <div class="ex-fb" id="exfb"></div>
    <div style="display:flex;gap:7px;margin-top:.5rem;">
      <button class="ex-nxt" id="ex-nxt" onclick="nextExQ()">Câu tiếp → <span class="cnt" style="font-size:.68rem;opacity:.6;"></span></button>
    </div>`;
}
function showFB(ok,msg){const f=document.getElementById('exfb');if(!f)return;f.textContent=msg;f.className='ex-fb on '+(ok?'ok':'fail');}
function gradeEx(ok,msg=''){
  if(ok){exOk++;exStreak++;const xp=10+exStreak*2;exRoundXP+=xp;addXP(xp,'Bài tập đúng');}
  else{exFail++;exStreak=0;}
  updateExScore();showFB(ok,ok?'✓ Chính xác! '+msg:'✗ '+msg);scheduleNext(ok);
}

function loadMCQ(){
  const q=exPool[exIdx];
  const ws=shuffle(flatAll().filter(p=>p.vi!==q.vi)).slice(0,3).map(p=>p.vi);
  const opts=shuffle([q.vi,...ws]);
  document.getElementById('exContent').innerHTML=buildFrame(
    `🎯 Trắc nghiệm · ${CAT_META[q.cat]?.l||q.cat}`,q.de,q.n?'💡 '+q.n:'',
    '<div class="ex-opts">'+opts.map(o=>'<button class="ex-opt" onclick="ansMCQ(this,\''+esc(o)+'\',\''+esc(q.vi)+'\')">'+o+'</button>').join('')+'</div>');
}
function ansMCQ(btn,ch,cor){
  if(exAnswered)return;exAnswered=true;
  document.querySelectorAll('.ex-opt').forEach(b=>{b.disabled=true;if(b.textContent.trim()===cor)b.classList.add('cor');else if(b===btn&&ch!==cor)b.classList.add('wr');});
  gradeEx(ch===cor,ch!==cor?`Đáp án: ${cor}`:'');
}

function loadFill(dir){
  const q=exPool[exIdx],qt=dir==='de2vi'?q.de:q.vi,ans=dir==='de2vi'?q.vi:q.de;
  document.getElementById('exContent').innerHTML=buildFrame(
    dir==='de2vi'?'🔤 Điền nghĩa tiếng Việt':'🗣️ Dịch sang tiếng Đức',qt,'',
    `<input class="ex-fi" id="exfi" placeholder="Nhập câu trả lời rồi nhấn Enter..." onkeydown="if(event.key==='Enter')subFill('${esc(ans)}')">
     <button class="ex-sub" onclick="subFill('${esc(ans)}')">Kiểm tra ↵</button>`);
  setTimeout(()=>{const i=document.getElementById('exfi');if(i)i.focus();},60);
}
function subFill(cor){
  if(exAnswered)return;
  const inp=document.getElementById('exfi');const val=inp.value.trim().toLowerCase();
  exAnswered=true;inp.disabled=true;
  const ok=val===cor.toLowerCase()||lev(val,cor.toLowerCase())<=Math.max(2,Math.floor(cor.length*.15));
  inp.classList.add(ok?'cor':'wr');
  gradeEx(ok,ok?'':'Đáp án: '+cor);
}
function lev(a,b){
  const m=a.length,n=b.length,dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i?j?0:i:j));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}

function loadListening(){
  const q=exPool[exIdx];
  const ws=shuffle(flatAll().filter(p=>p.vi!==q.vi)).slice(0,3).map(p=>p.vi);
  const opts=shuffle([q.vi,...ws]);
  document.getElementById('exContent').innerHTML=buildFrame('👂 Nghe & Chọn nghĩa đúng','','',
    `<div style="text-align:center;margin-bottom:1rem;">
      <button class="ex-sub" onclick="speakDE('${esc(q.de)}')">🔊 Nghe lại tiếng Đức</button>
      <div style="font-size:.7rem;color:var(--t3);margin-top:4px;">Nhấn để nghe, rồi chọn nghĩa đúng</div>
    </div>
    <div class="ex-opts">${opts.map(o=>'<button class="ex-opt" onclick="ansMCQ(this,\''+esc(o)+'\',\''+esc(q.vi)+'\')">'+o+'</button>').join('')}</div>`);
  setTimeout(()=>speakDE(q.de),350);
}

const CTXS=[
  {s:"Buổi sáng bước vào phòng BN để bắt đầu ca.",q:"Câu chào hỏi phù hợp nhất?",cat:'patient',kw:'Guten Morgen'},
  {s:"BN kêu đau bụng, cần hỏi mức độ đau.",q:"Câu hỏi nào phù hợp?",cat:'patient',kw:'Skala'},
  {s:"BN than khó thở, SpO2 giảm.",q:"Bạn hỏi gì đầu tiên?",cat:'patient',kw:'Atemnot'},
  {s:"Bác sĩ ra y lệnh nhưng bạn chưa nghe rõ.",q:"Bạn nói gì với bác sĩ?",cat:'colleague',kw:'wiederholen'},
  {s:"Cần báo cáo sinh hiệu cho bác sĩ.",q:"Câu báo cáo chuẩn nào?",cat:'colleague',kw:'Vitalzeichen'},
  {s:"Đang bàn giao ca về dịch truyền.",q:"Câu nào phù hợp trong Übergabe?",cat:'handover',kw:'Infusion'},
  {s:"Bàn giao về tình trạng vết thương.",q:"Câu nào mô tả đúng?",cat:'handover',kw:'Verband'},
  {s:"BN ngã xuống sàn và bất tỉnh.",q:"Bạn phải nói gì đầu tiên?",cat:'emergency',kw:'Notruf'},
  {s:"Không thấy mạch và nhịp thở của BN.",q:"Hành động ngôn ngữ nào đúng?",cat:'emergency',kw:'Reanimation'},
  {s:"BN đau ngực dữ dội lan ra cánh tay.",q:"Bạn nghi ngờ gì và làm gì?",cat:'emergency',kw:'Herzinfarkt'},
];
function loadContext(){
  const ctx=CTXS[exIdx%CTXS.length];
  const pool=flatCat(ctx.cat);
  const correct=pool.find(p=>p.de.includes(ctx.kw)||p.vi.includes(ctx.kw))||pool[Math.floor(Math.random()*pool.length)];
  const ws=shuffle(pool.filter(p=>p.de!==correct.de)).slice(0,3).map(p=>p.de);
  const opts=shuffle([correct.de,...ws]);
  document.getElementById('exContent').innerHTML=buildFrame(
    '🏥 Tình huống lâm sàng · '+CAT_META[ctx.cat]?.l,ctx.s,'❓ '+ctx.q,
    '<div class="ex-opts">'+opts.map(o=>'<button class="ex-opt" onclick="ansCtx(this,\''+esc(o)+'\',\''+esc(correct.de)+'\',\''+esc(correct.vi)+'\')">'+o+'</button>').join('')+'</div>');
}
function ansCtx(btn,ch,cor,vi){
  if(exAnswered)return;exAnswered=true;
  document.querySelectorAll('.ex-opt').forEach(b=>{b.disabled=true;if(b.textContent.trim()===cor)b.classList.add('cor');else if(b===btn&&ch!==cor)b.classList.add('wr');});
  gradeEx(ch===cor,ch===cor?`🇻🇳 ${vi}`:`Đáp án: ${cor}`);
}

function loadMatch(){
  const PAIRS=4;const items=shuffle(flatAll()).slice(0,PAIRS);
  matchLeft=shuffle([...items]);matchRight=shuffle([...items]);matchCount=0;
  mSide='';mIdx=-1;mDe='';
  const pct=exPool.length?(exIdx/exPool.length*100):0;
  document.getElementById('exContent').innerHTML=`
    <div style="display:flex;align-items:center;gap:9px;margin-bottom:.85rem;">
      <div style="flex:1;height:4px;background:var(--b2);border-radius:2px;overflow:hidden;">
        <div id="ex-prog-fill" style="height:100%;background:linear-gradient(90deg,var(--blue),var(--teal));border-radius:2px;width:${pct}%;"></div>
      </div>
      <div id="ex-prog-cnt" style="font-size:.7rem;color:var(--t3);">${exIdx}/${exPool.length}</div>
    </div>
    <div class="ex-hdr"><div class="ex-ql">🔗 Ghép đôi · Nối cột trái ↔ phải</div>
      <div style="font-size:.7rem;color:var(--t3);margin-top:3px;">Còn <span id="match-rem">${PAIRS}</span> cặp</div>
    </div>
    <div class="match-grid">
      <div class="match-col" id="matchL">${matchLeft.map((p,i)=>'<div class="match-it" id="ml-'+i+'" onclick="selMatch(\'L\','+i+',\''+esc(p.de)+'\')">'+p.de+'</div>').join('')}</div>
      <div class="match-col" id="matchR">${matchRight.map((p,i)=>'<div class="match-it" id="mr-'+i+'" onclick="selMatch(\'R\','+i+',\''+esc(p.de)+'\')">'+p.vi+'</div>').join('')}</div>
    </div>
    <div class="ex-fb" id="exfb"></div>`;
}
function selMatch(side,idx,de){
  const el=document.getElementById((side==='L'?'ml-':'mr-')+idx);
  if(el.classList.contains('matched'))return;
  if(mSide===''||mSide===side){
    if(mIdx>=0)document.getElementById((mSide==='L'?'ml-':'mr-')+mIdx).classList.remove('sel');
    mSide=side;mIdx=idx;mDe=de;el.classList.add('sel');return;
  }
  const lDe=side==='R'?mDe:de,rDe=side==='R'?de:mDe;
  const lEl=document.getElementById((mSide==='L'?'ml-':'mr-')+mIdx);
  if(lDe===rDe){
    el.classList.remove('sel');el.classList.add('matched');lEl.classList.remove('sel');lEl.classList.add('matched');
    matchCount++;
    const xp=10;exRoundXP+=xp;exOk++;exStreak++;addXP(xp,'Ghép đúng');updateExScore();
    showFB(true,'✓ Đúng!');
    const rem=document.getElementById('match-rem');if(rem)rem.textContent=matchLeft.length-matchCount;
    setTimeout(()=>{const f=document.getElementById('exfb');if(f)f.className='ex-fb';},700);
    if(matchCount===matchLeft.length){showFB(true,'🎉 Hoàn thành vòng ghép!');setTimeout(()=>nextExQ(),1300);}
  }else{
    el.classList.add('wf');lEl.classList.add('wf');exFail++;exStreak=0;updateExScore();
    showFB(false,'✗ Không khớp, thử lại!');
    setTimeout(()=>{el.classList.remove('wf','sel');lEl.classList.remove('wf','sel');const f=document.getElementById('exfb');if(f)f.className='ex-fb';},700);
  }
  mSide='';mIdx=-1;
}

// ════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════
// GREETING / CEFR / DAILY-XP / MISSIONS / DAILY CHALLENGE
// ════════════════════════════════════════════════════════
function getGreeting(){
  const h=new Date().getHours();
  if(h>=6&&h<12) return 'Guten Morgen';
  if(h>=12&&h<18) return 'Guten Tag';
  if(h>=18) return 'Guten Abend';
  return 'Gute Nacht';
}

function getCEFR(xp){
  if(xp<50)   return {level:'A1',color:'#3b82f6'};
  if(xp<150)  return {level:'A2',color:'#22c55e'};
  if(xp<300)  return {level:'B1',color:'#f97316'};
  if(xp<500)  return {level:'B2',color:'#ef4444'};
  if(xp<800)  return {level:'C1',color:'#a855f7'};
  return        {level:'C2',color:'#eab308'};
}

// ── Daily XP goal ─────────────────────────────────────
function _getDailyXPStore(){
  const today=new Date().toISOString().slice(0,10);
  try{
    const s=JSON.parse(localStorage.getItem('pd-daily-xp')||'{}');
    if(s.date===today) return s;
  }catch(e){}
  const fresh={date:today,xp:0};
  localStorage.setItem('pd-daily-xp',JSON.stringify(fresh));
  return fresh;
}
function getTodayXP(){return _getDailyXPStore().xp;}
function addTodayXP(n){
  const s=_getDailyXPStore();
  const prev=s.xp;
  s.xp+=n;
  localStorage.setItem('pd-daily-xp',JSON.stringify(s));
  if(prev<50&&s.xp>=50) toast('🎉 Đạt mục tiêu hôm nay!');
}

// ── Missions ──────────────────────────────────────────
const MISSIONS_DEF=[
  {id:'flash5',  label:'Học 5 thẻ flashcard',  icon:'🃏', xp:15, target:5},
  {id:'srs10',   label:'Ôn 10 thẻ SRS',        icon:'🔁', xp:25, target:10},
  {id:'ex1',     label:'Hoàn thành 1 bài tập',  icon:'✏️', xp:20, target:1},
  {id:'search3', label:'Tra cứu 3 từ vựng',     icon:'🔍', xp:10, target:3},
];
function _getMissionsStore(){
  const today=new Date().toISOString().slice(0,10);
  try{
    const s=JSON.parse(localStorage.getItem('pd-missions')||'{}');
    if(s.date===today) return s;
  }catch(e){}
  const fresh={date:today,progress:{},claimed:[]};
  localStorage.setItem('pd-missions',JSON.stringify(fresh));
  return fresh;
}
function _saveMissions(s){localStorage.setItem('pd-missions',JSON.stringify(s));}
function getTodayMissions(){return _getMissionsStore();}
function progressMission(id){
  const s=_getMissionsStore();
  const m=MISSIONS_DEF.find(x=>x.id===id);
  if(!m) return;
  if(s.claimed.includes(id)) return;
  s.progress[id]=(s.progress[id]||0)+1;
  _saveMissions(s);
  // Re-render missions card if dashboard is active
  const dashPage=document.getElementById('page-dashboard');
  if(dashPage&&dashPage.classList.contains('active')){
    const mc=document.getElementById('dash-missions-card');
    if(mc) mc.innerHTML=_renderMissionsCardInner();
  }
}
function claimMission(id){
  const s=_getMissionsStore();
  const m=MISSIONS_DEF.find(x=>x.id===id);
  if(!m) return;
  if(s.claimed.includes(id)) return;
  if((s.progress[id]||0)<m.target) return;
  s.claimed.push(id);
  _saveMissions(s);
  addXP(m.xp,'Nhiệm vụ: '+m.label);
  const mc=document.getElementById('dash-missions-card');
  if(mc) mc.innerHTML=_renderMissionsCardInner();
}
window.claimMission=claimMission;

function _missionCountdown(){
  const now=new Date();
  const midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0);
  const diff=midnight-now;
  const h=Math.floor(diff/3600000);
  const m=Math.floor((diff%3600000)/60000);
  return `${h}h ${m}m`;
}
function _renderMissionsCardInner(){
  const s=getTodayMissions();
  return MISSIONS_DEF.map(m=>{
    const prog=Math.min(s.progress[m.id]||0,m.target);
    const pct=Math.round(prog/m.target*100);
    const claimed=s.claimed.includes(m.id);
    const done=prog>=m.target;
    return `<div class="mission-card">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:1.3rem">${m.icon}</span>
        <div style="flex:1">
          <div style="font-size:.82rem;font-weight:600;color:var(--tx)">${m.label}</div>
          <div class="mission-prog-wrap"><div class="mission-prog-fill" style="width:${pct}%"></div></div>
          <div style="font-size:.7rem;color:var(--t3);margin-top:2px">${prog}/${m.target}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          <span class="xp-badge">+${m.xp} XP</span>
          ${claimed?'<span style="font-size:.7rem;color:var(--teal)">✓ Đã nhận</span>':
            done?`<button class="ib pri" style="font-size:.7rem;padding:3px 9px;" onclick="claimMission('${m.id}')">Nhận thưởng</button>`:''}
        </div>
      </div>
    </div>`;
  }).join('')+`<div style="font-size:.7rem;color:var(--t3);text-align:right;margin-top:6px">⏰ Reset sau: ${_missionCountdown()}</div>`;
}

// ── Daily Challenge ────────────────────────────────────
function _dayOfYear(){
  const now=new Date();
  return Math.floor((now-new Date(now.getFullYear(),0,0))/86400000);
}
function _getDailyChallengeStore(){
  const today=new Date().toISOString().slice(0,10);
  try{
    const s=JSON.parse(localStorage.getItem('pd-daily-challenge')||'{}');
    if(s.date===today) return s;
  }catch(e){}
  const all=flatAll();
  const idx=_dayOfYear()%all.length;
  const fresh={date:today,wordIdx:idx,answered:false,correct:false};
  localStorage.setItem('pd-daily-challenge',JSON.stringify(fresh));
  return fresh;
}
function _saveDailyChallenge(s){localStorage.setItem('pd-daily-challenge',JSON.stringify(s));}
function _renderChallengeCard(){
  const s=_getDailyChallengeStore();
  const all=flatAll();
  if(!all.length) return '<div style="color:var(--t3);font-size:.8rem">Chưa có dữ liệu</div>';
  const word=all[s.wordIdx%all.length];
  const wrongs=shuffle(all.filter(x=>x.de!==word.de)).slice(0,3).map(x=>x.vi);
  const opts=shuffle([word.vi,...wrongs]);
  if(s.answered){
    return `<div style="font-size:1.1rem;font-weight:700;text-align:center;margin-bottom:.8rem">${sanitize(word.de)}</div>
      <div class="challenge-opts">${opts.map(o=>{
        const cls=o===word.vi?(s.correct?'challenge-opt correct':'challenge-opt correct'):'challenge-opt'+(o===s.chosen&&!s.correct?' wrong':'');
        return `<button class="${cls}" disabled>${sanitize(o)}</button>`;
      }).join('')}</div>
      <div style="text-align:center;margin-top:.6rem;font-size:.82rem;color:${s.correct?'var(--teal)':'var(--red)'}">
        ${s.correct?'✓ Chính xác! +20 XP':'✗ Sai rồi — đáp án: '+sanitize(word.vi)}
      </div>`;
  }
  return `<div style="font-size:1.1rem;font-weight:700;text-align:center;margin-bottom:.8rem">${sanitize(word.de)}</div>
    <div class="challenge-opts">${opts.map(o=>`<button class="challenge-opt" onclick="answerChallenge('${o.replace(/'/g,"&#39;").replace(/\\/g,'\\\\')}')">${sanitize(o)}</button>`).join('')}</div>`;
}
function answerChallenge(vi){
  const s=_getDailyChallengeStore();
  if(s.answered) return;
  const all=flatAll();
  const word=all[s.wordIdx%all.length];
  s.answered=true;
  s.correct=vi===word.vi;
  s.chosen=vi;
  _saveDailyChallenge(s);
  if(s.correct){addXP(20,'Thử thách hôm nay');}
  const cc=document.getElementById('dash-challenge-inner');
  if(cc) cc.innerHTML=_renderChallengeCard();
}
window.answerChallenge=answerChallenge;

// ════════════════════════════════════════════════════════
// TYPING SPEED TEST
// ════════════════════════════════════════════════════════
let _tsTimer=null;
function renderTypingSpeed(){
  const page=document.getElementById('page-typing-speed');
  if(!page)return;
  clearInterval(_tsTimer);_tsTimer=null;
  const best=parseInt(localStorage.getItem('pd-typing-best')||'0');
  page.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">⌨️ Tốc độ gõ</div></div>
<div style="padding:0 1rem 2rem">
<div style="margin-bottom:.9rem">
  <div class="ts-label">Chế độ luyện tập</div>
  <div class="ts-toggle" id="ts-mode-tog">
    <button class="ts-tog active" data-v="translate" onclick="window._tsMod('translate',this)">🇻🇳 → 🇩🇪 Dịch từ</button>
    <button class="ts-tog" data-v="spell" onclick="window._tsMod('spell',this)">🇩🇪 Chính tả</button>
  </div>
</div>
<div style="margin-bottom:.9rem">
  <div class="ts-label">Thời gian</div>
  <div class="ts-toggle" id="ts-dur-tog">
    <button class="ts-tog" onclick="window._tsDur(30,this)">30s</button>
    <button class="ts-tog active" onclick="window._tsDur(60,this)">60s</button>
    <button class="ts-tog" onclick="window._tsDur(120,this)">120s</button>
  </div>
</div>
${best>0?`<div style="font-size:.8rem;color:var(--t2);margin-bottom:1rem">🏆 Kỷ lục: <b style="color:var(--yellow)">${best} WPM</b></div>`:''}
<div id="ts-area"><div style="text-align:center;padding:3rem 1rem">
  <div style="font-size:3rem;margin-bottom:1rem">⌨️</div>
  <div style="color:var(--t2);font-size:.88rem;margin-bottom:1.5rem">Gõ đúng từ tiếng Đức — tự động chuyển khi đúng</div>
  <button class="btn btn-primary" onclick="window._tsStart()">▶ Bắt đầu</button>
</div></div>
</div>`;
  let _mode='translate',_dur=60;
  window._tsMod=(v,btn)=>{_mode=v;document.querySelectorAll('#ts-mode-tog .ts-tog').forEach(b=>b.classList.remove('active'));btn.classList.add('active');};
  window._tsDur=(v,btn)=>{_dur=v;document.querySelectorAll('#ts-dur-tog .ts-tog').forEach(b=>b.classList.remove('active'));btn.classList.add('active');};
  window._tsStart=()=>{
    clearInterval(_tsTimer);
    const pool=shuffle(flatAll());
    let idx=0,timeLeft=_dur,correct=0,total=0,skipped=0;
    const hist=[];
    const area=document.getElementById('ts-area');
    if(!area)return;
    function gw(){return pool[idx%pool.length];}
    function renderChars(target,typed){
      return target.split('').map((ch,i)=>{
        if(i>=typed.length)return`<span class="ts-ch">${ch==' '?'&nbsp;':esc(ch)}</span>`;
        return typed[i].toLowerCase()===ch.toLowerCase()?`<span class="ts-ch ok">${ch==' '?'&nbsp;':esc(ch)}</span>`:`<span class="ts-ch err">${ch==' '?'&nbsp;':esc(ch)}</span>`;
      }).join('')+(typed.length>target.length?`<span class="ts-ch extra">${esc(typed.slice(target.length))}</span>`:'');
    }
    function drawGame(){
      const w=gw();
      const elapsed=_dur-timeLeft;
      const wpm=elapsed>0?Math.round(correct/(elapsed/60)):0;
      const acc=total>0?Math.round(correct/total*100):100;
      const pct=Math.round(timeLeft/_dur*100);
      const tc=timeLeft<=10?'var(--red)':timeLeft<=20?'var(--orange)':'var(--teal)';
      area.innerHTML=`<div class="ts-bar-wrap"><div class="ts-bar-fill" id="ts-bar" style="width:${pct}%;background:${tc}"></div></div>
<div class="ts-stats-row">
  <span class="ts-time" id="ts-t" style="color:${timeLeft<=10?'var(--red)':timeLeft<=20?'var(--orange)':'var(--yellow)'}">${timeLeft}s</span>
  <span class="ts-stat">⚡ <b id="ts-wpm">${wpm}</b> WPM</span>
  <span class="ts-stat">✓ <b>${correct}</b>/${total}</span>
  <span class="ts-stat" style="color:${acc<80?'var(--red)':'var(--teal)'}">${acc}%</span>
</div>
<div class="ts-card" id="ts-card">
  ${_mode==='translate'
    ?`<div class="ts-plabel">Nghĩa tiếng Việt →</div><div class="ts-pvi" id="ts-pw">${esc(w.vi)}</div><div class="ts-phint">Gõ tiếng Đức bên dưới</div>`
    :`<div class="ts-plabel">Từ tiếng Đức →</div><div class="ts-pde" id="ts-pw">${esc(w.de)}</div><div class="ts-phint">Gõ lại chính xác</div>`}
  <div class="ts-chars" id="ts-chars">${renderChars(w.de,'')}</div>
  <input class="ts-inp" id="ts-inp" type="text" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" placeholder="Gõ ở đây..." oninput="window._tsType(this)">
</div>
<div style="text-align:center;margin-top:.5rem">
  <button class="btn" style="font-size:.75rem;padding:3px 12px;color:var(--t2)" onclick="window._tsSkip()">Bỏ qua →</button>
</div>`;
      document.getElementById('ts-inp')?.focus();
      window._tsType=(inp)=>{
        const typed=inp.value;
        const target=gw().de;
        const ch=document.getElementById('ts-chars');
        if(ch)ch.innerHTML=renderChars(target,typed);
        if(typed.toLowerCase().trim()===target.toLowerCase().trim()){
          correct++;total++;idx++;hist.push({de:target,vi:gw().vi,ok:true});
          inp.value='';
          const nw=gw();
          const pw=document.getElementById('ts-pw');
          if(pw)pw.textContent=_mode==='translate'?nw.vi:nw.de;
          const nc=document.getElementById('ts-chars');
          if(nc)nc.innerHTML=renderChars(nw.de,'');
          inp.oninput=null;inp.oninput=function(){window._tsType(this);};
          const card=document.getElementById('ts-card');
          if(card){card.classList.add('ts-ok');setTimeout(()=>card.classList.remove('ts-ok'),280);}
          const el=document.getElementById('ts-wpm');
          const ep=_dur-timeLeft;
          if(el&&ep>0)el.textContent=Math.round(correct/(ep/60));
        }
      };
    }
    window._tsSkip=()=>{
      const w=gw();hist.push({de:w.de,vi:w.vi,ok:false});total++;skipped++;idx++;
      const inp=document.getElementById('ts-inp');if(inp)inp.value='';
      const card=document.getElementById('ts-card');
      if(card){card.classList.add('ts-err');setTimeout(()=>card.classList.remove('ts-err'),280);}
      drawGame();
    };
    drawGame();
    _tsTimer=setInterval(()=>{
      timeLeft--;
      const tel=document.getElementById('ts-t'),tbar=document.getElementById('ts-bar');
      const tc=timeLeft<=10?'var(--red)':timeLeft<=20?'var(--orange)':'var(--teal)';
      if(tel){tel.textContent=timeLeft+'s';tel.style.color=timeLeft<=10?'var(--red)':timeLeft<=20?'var(--orange)':'var(--yellow)';}
      if(tbar){tbar.style.width=Math.round(timeLeft/_dur*100)+'%';tbar.style.background=tc;}
      const ep=_dur-timeLeft;const wpmEl=document.getElementById('ts-wpm');
      if(wpmEl&&ep>0)wpmEl.textContent=Math.round(correct/(ep/60));
      if(timeLeft<=0){
        clearInterval(_tsTimer);
        const wpm=Math.round(correct/(_dur/60));
        const acc=total>0?Math.round(correct/total*100):0;
        const prevBest=parseInt(localStorage.getItem('pd-typing-best')||'0');
        const isRec=wpm>prevBest;
        try{if(isRec)localStorage.setItem('pd-typing-best',String(wpm));}catch(e){}
        addXP(Math.min(correct*2,50),'Tốc độ gõ hoàn thành');
        area.innerHTML=`<div class="ts-result">
${isRec?'<div class="ts-new-rec">🎉 Kỷ lục mới!</div>':''}
<div class="ts-big-wpm">${wpm}</div>
<div style="color:var(--t2);font-size:.85rem;margin-bottom:1.2rem">WPM (từ / phút)</div>
<div class="ts-result-stats">
  <div class="ts-rs"><div class="ts-rv" style="color:var(--teal)">${acc}%</div><div class="ts-rl">Chính xác</div></div>
  <div class="ts-rs"><div class="ts-rv" style="color:var(--green)">${correct}</div><div class="ts-rl">Đúng</div></div>
  <div class="ts-rs"><div class="ts-rv" style="color:var(--red)">${skipped}</div><div class="ts-rl">Bỏ qua</div></div>
  <div class="ts-rs"><div class="ts-rv" style="color:var(--yellow)">${Math.max(wpm,prevBest)}</div><div class="ts-rl">Kỷ lục</div></div>
</div>
${hist.length?`<div class="ts-hist">${hist.map(h=>`<div class="ts-hist-row"><span>${h.ok?'✅':'❌'}</span><span class="ts-hist-de">${esc(h.de)}</span><span class="ts-hist-vi">${esc(h.vi)}</span></div>`).join('')}</div>`:''}
<button class="btn btn-primary" style="margin-top:.75rem" onclick="window._tsStart()">↺ Thử lại</button>
</div>`;
      }
    },1000);
  };
}
window.retryTyping=function(){window._tsStart&&window._tsStart();};
window.startTypingGame=function(){window._tsStart&&window._tsStart();};

// ════════════════════════════════════════════════════════
// NEW FEATURES: Abbr, Emergency FC, Shift Sim, Pflegegrad, Pronunciation
// ════════════════════════════════════════════════════════
function renderAbbr(){
  const el=document.getElementById('page-abbr');
  if(!el)return;
  let q='',cat='all';
  function draw(){
    const cats=['all',...new Set(ABBR_DATA.map(a=>a.cat))];
    const filtered=ABBR_DATA.filter(a=>{
      const matchCat=cat==='all'||a.cat===cat;
      const matchQ=!q||a.abbr.toLowerCase().includes(q.toLowerCase())||a.full.toLowerCase().includes(q.toLowerCase())||a.vi.toLowerCase().includes(q.toLowerCase());
      return matchCat&&matchQ;
    });
    const catColors={Vital:'var(--red)',Medikamente:'var(--blue)',Diagnose:'var(--orange)',Dokument:'var(--teal)',Pflege:'var(--purple)'};
    el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">🏷️ Từ viết tắt y tế</div></div>
<div style="padding:0 1rem 1rem">
<input class="abbr-search" id="abbr-q" placeholder="Tìm kiếm: RR, Blutdruck, huyết áp..." value="${esc(q)}" oninput="window._abbrSearch(this.value)">
<div class="abbr-chips">${cats.map(c=>`<button class="abbr-chip${cat===c?' active':''}" onclick="window._abbrCat('${esc(c)}')">${c==='all'?'Tất cả':c}</button>`).join('')}</div>
<div class="abbr-grid">${filtered.map(a=>`<div class="abbr-card">
  <span class="abbr-short" style="color:${catColors[a.cat]||'var(--blue)'}">${esc(a.abbr)}</span>
  <div class="abbr-long">${esc(a.full)}</div>
  <div class="abbr-vi">${esc(a.vi)}</div>
  <div class="abbr-example">${esc(a.example)}</div>
</div>`).join('')}${filtered.length===0?'<p style="color:var(--t3);grid-column:1/-1;text-align:center;padding:2rem">Không tìm thấy kết quả</p>':''}</div>
</div>`;
  }
  window._abbrSearch=v=>{q=v;draw();document.getElementById('abbr-q')&&(document.getElementById('abbr-q').focus())};
  window._abbrCat=v=>{cat=v;draw()};
  draw();
}

function renderEmergency(){
  const el=document.getElementById('page-emergency-fc');
  if(!el)return;
  _emState={idx:0,flipped:false,known:0,total:EMERGENCY_CARDS.length};
  function draw(){
    if(_emState.idx>=EMERGENCY_CARDS.length){
      el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">🚨 Flashcard Khẩn Cấp</div></div>
<div style="padding:1rem;text-align:center">
<div class="em-complete" style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.3);border-radius:var(--rl);padding:2rem;margin:1rem 0">
  <div style="font-size:2.5rem">🏆</div>
  <h3 style="color:var(--red);margin:.5rem 0">Hoàn thành!</h3>
  <p>Đã học <b>${_emState.known}</b>/${EMERGENCY_CARDS.length} thẻ</p>
  <p style="color:var(--t2);font-size:.85rem">+20 XP được thêm vào tài khoản</p>
  <button class="btn" style="margin-top:1rem;background:var(--red);color:#fff" onclick="renderEmergency()">Học lại 🔄</button>
</div></div>`;
      addXP(20,'Hoàn thành flashcard khẩn cấp');
      progressMission('flash5');
      return;
    }
    const card=EMERGENCY_CARDS[_emState.idx];
    const pct=Math.round((_emState.idx/EMERGENCY_CARDS.length)*100);
    el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">🚨 Flashcard Khẩn Cấp</div></div>
<div style="padding:0 1rem 1rem">
<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem">
  <div style="flex:1;height:5px;background:var(--b1);border-radius:3px;overflow:hidden"><div style="width:${pct}%;height:100%;background:var(--red);transition:.3s"></div></div>
  <span style="font-size:.75rem;color:var(--t3)">${_emState.idx+1}/${EMERGENCY_CARDS.length}</span>
</div>
<div class="em-card${_emState.flipped?' flipped':''}" onclick="window._emFlip()">
  <div class="em-front">
    <div class="em-de">${esc(card.de)}</div>
    <button class="em-speak" onclick="event.stopPropagation();speakDE('${esc(card.de)}')" title="Nghe">🔊</button>
    <div class="em-tap-hint">Nhấn để xem nghĩa</div>
  </div>
  <div class="em-back">
    <div class="em-vi">${esc(card.vi)}</div>
    <div class="em-ctx">${esc(card.ctx)}</div>
  </div>
</div>
${_emState.flipped?`<div style="display:flex;gap:.75rem;margin-top:1rem">
  <button class="btn" style="flex:1;background:rgba(239,68,68,.1);color:var(--red);border:1px solid rgba(239,68,68,.3)" onclick="window._emNext(false)">Cần ôn 🔄</button>
  <button class="btn" style="flex:1;background:rgba(37,203,168,.1);color:var(--teal);border:1px solid rgba(37,203,168,.3)" onclick="window._emNext(true)">Đã biết ✓</button>
</div>`:'<div style="text-align:center;color:var(--t3);font-size:.8rem;margin-top:.75rem">Nhấn vào thẻ để lật</div>'}
</div>`;
  }
  window._emFlip=()=>{_emState.flipped=!_emState.flipped;draw();};
  window._emNext=(known)=>{if(known)_emState.known++;_emState.idx++;_emState.flipped=false;draw();};
  draw();
}

function renderShiftSim(){
  const el=document.getElementById('page-shift-sim');
  if(!el)return;
  _ssState={idx:0,answered:false,score:0,done:false};
  function draw(){
    if(_ssState.done){
      const pct=Math.round((_ssState.score/SHIFT_SCENARIOS.length)*100);
      const msg=pct>=80?'Xuất sắc! Bạn là điều dưỡng giỏi! 🏆':pct>=60?'Tốt! Tiếp tục cố gắng! 💪':'Cần ôn thêm kiến thức điều dưỡng! 📚';
      el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">🏥 Ca Làm Việc</div></div>
<div style="padding:1rem;text-align:center">
<div style="background:linear-gradient(135deg,rgba(37,203,168,.08),var(--s2));border:1px solid rgba(37,203,168,.25);border-radius:var(--rl);padding:2rem;margin:1rem 0">
  <div style="font-size:2.5rem">🏥</div>
  <h3 style="color:var(--teal);margin:.5rem 0">Ca trực hoàn thành!</h3>
  <div style="font-size:2rem;font-weight:700;color:var(--tx)">${_ssState.score}/${SHIFT_SCENARIOS.length}</div>
  <p style="color:var(--t2)">${msg}</p>
  <p style="color:var(--t3);font-size:.8rem">+${_ssState.score*10} XP được thêm vào tài khoản</p>
  <button class="btn btn-primary" style="margin-top:1rem" onclick="renderShiftSim()">Ca trực mới 🔄</button>
</div></div>`;
      progressMission('ex1');
      return;
    }
    const sc=SHIFT_SCENARIOS[_ssState.idx];
    const pct=Math.round((_ssState.idx/SHIFT_SCENARIOS.length)*100);
    el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">🏥 Ca Làm Việc</div></div>
<div style="padding:0 1rem 1rem">
<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem">
  <div style="flex:1;height:5px;background:var(--b1);border-radius:3px;overflow:hidden"><div style="width:${pct}%;height:100%;background:var(--teal);transition:.3s"></div></div>
  <span style="font-size:.75rem;color:var(--t3)">Ca ${_ssState.idx+1}/${SHIFT_SCENARIOS.length}</span>
</div>
<div class="ss-patient">
  <div class="ss-patient-info">
    <span class="ss-room">${esc(sc.room)}</span>
    <span class="ss-name">${esc(sc.name)}, ${sc.age} Jahre</span>
    <span class="ss-diag">${esc(sc.diag)}</span>
  </div>
  <div class="ss-situation"><b>${esc(sc.situation)}</b></div>
  <div class="ss-situation-vi">${esc(sc.situationVI)}</div>
</div>
<div class="ss-opts" id="ss-opts">${sc.options.map((o,i)=>`<button class="ss-opt" onclick="window._ssAnswer(${i})">${esc(o.text)}</button>`).join('')}</div>
<div id="ss-explain" style="display:none"></div>
<div id="ss-next-btn" style="display:none;margin-top:.75rem"><button class="btn btn-primary" onclick="window._ssNext()">${_ssState.idx+1<SHIFT_SCENARIOS.length?'Bệnh nhân tiếp theo →':'Kết thúc ca trực 🏁'}</button></div>
</div>`;
  }
  window._ssAnswer=(i)=>{
    if(_ssState.answered)return;
    _ssState.answered=true;
    const sc=SHIFT_SCENARIOS[_ssState.idx];
    const opts=document.querySelectorAll('.ss-opt');
    opts.forEach((b,j)=>{
      b.disabled=true;
      if(sc.options[j].correct)b.classList.add('correct');
      else if(j===i&&!sc.options[j].correct)b.classList.add('wrong');
    });
    const ex=document.getElementById('ss-explain');
    const chosen=sc.options[i];
    if(ex){ex.style.display='block';ex.innerHTML=`<div class="ss-explain-box ${chosen.correct?'correct':'wrong'}"><b>${chosen.correct?'✅ Richtig!':'❌ Falsch!'}</b> ${esc(chosen.explain)}</div>`;}
    if(chosen.correct){_ssState.score++;addXP(10,'Ca làm việc: câu đúng');}
    const nb=document.getElementById('ss-next-btn');
    if(nb)nb.style.display='block';
  };
  window._ssNext=()=>{_ssState.idx++;_ssState.answered=false;if(_ssState.idx>=SHIFT_SCENARIOS.length)_ssState.done=true;draw();};
  draw();
}

function renderPflegegrad(){
  const el=document.getElementById('page-pflegegrad');
  if(!el)return;
  if(!_pgState||_pgState.tab===undefined)_pgState={tab:'info',qIdx:0,score:0,done:false};
  function draw(){
    const isInfo=_pgState.tab==='info';
    let content='';
    if(isInfo){
      content=`<div class="pg-ref-grid">${PG_DATA.map(pg=>`<div class="pg-card" style="border-left:4px solid ${pg.color}">
  <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
    <span class="pg-grade" style="background:${pg.color};color:#fff">PG ${pg.grade}</span>
    <span style="font-size:.75rem;color:var(--t3)">${esc(pg.score)} Punkte</span>
  </div>
  <div style="font-size:.82rem;color:var(--tx);font-weight:600;margin-bottom:3px">${esc(pg.desc)}</div>
  <div style="font-size:.78rem;color:var(--t2);margin-bottom:.5rem">${esc(pg.vi)}</div>
  <div style="font-size:.76rem;color:var(--t3)">💶 Pflegegeld: <b>${esc(pg.geld)}</b> | Sachleistung: <b>${esc(pg.sach)}</b></div>
  <div style="font-size:.76rem;color:var(--t3);margin-top:3px">📋 ${esc(pg.example)}</div>
</div>`).join('')}</div>
<div style="margin-top:1.2rem">
<h4 style="color:var(--t2);font-size:.82rem;margin-bottom:.75rem;text-transform:uppercase;letter-spacing:.05em">6 Module des NBA</h4>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px">
${[
  {n:1,t:'Mobilität',vi:'Di chuyển',w:'10%'},
  {n:2,t:'Kognition & Kommunikation',vi:'Nhận thức & Giao tiếp',w:'15%'},
  {n:3,t:'Verhaltensweisen',vi:'Hành vi & Tâm lý',w:'15%'},
  {n:4,t:'Selbstversorgung',vi:'Tự chăm sóc',w:'40%'},
  {n:5,t:'Therapie & Krankheit',vi:'Điều trị & Bệnh tật',w:'20%'},
  {n:6,t:'Alltagsleben & Soziales',vi:'Cuộc sống hàng ngày',w:'– (ergänzend)'},
].map(m=>`<div style="background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);padding:.6rem .8rem">
  <span style="font-size:.72rem;font-weight:700;color:var(--purple)">Modul ${m.n}</span>
  <div style="font-size:.8rem;color:var(--tx)">${m.t}</div>
  <div style="font-size:.73rem;color:var(--t3)">${m.vi} · ${m.w}</div>
</div>`).join('')}
</div></div>`;
    } else if(_pgState.done){
      const pass=_pgState.score>=6;
      content=`<div style="text-align:center;padding:1rem">
<div style="font-size:2.5rem">${pass?'🏆':'📚'}</div>
<h3 style="color:${pass?'var(--teal)':'var(--orange)'}">${pass?'Xuất sắc!':'Cần ôn thêm!'}</h3>
<p>${_pgState.score}/8 câu đúng ${pass?'– Bạn hiểu rõ hệ thống Pflegegrad!':'– Hãy đọc lại phần Tham khảo'}</p>
${pass?'<p style="color:var(--t3);font-size:.8rem">+15 XP được thêm vào</p>':''}
<button class="btn" style="margin-top:1rem" onclick="window._pgRestart()">Làm lại Quiz</button>
</div>`;
      if(pass)addXP(15,'Pflegegrad quiz hoàn thành');
    } else {
      const q=PG_QUIZ[_pgState.qIdx];
      content=`<div style="font-size:.75rem;color:var(--t3);margin-bottom:.75rem">Câu ${_pgState.qIdx+1}/${PG_QUIZ.length} · ${_pgState.score} đúng</div>
<div class="pg-question">${esc(q.q)}</div>
<div style="display:flex;flex-direction:column;gap:8px;margin-top:.75rem" id="pg-opts">
${q.opts.map((o,i)=>`<button class="ss-opt" onclick="window._pgAnswer(${i})">${esc(o)}</button>`).join('')}
</div>
<div id="pg-explain" style="display:none"></div>
<div id="pg-next" style="display:none;margin-top:.75rem"><button class="btn btn-primary" onclick="window._pgNext()">${_pgState.qIdx+1<PG_QUIZ.length?'Câu tiếp →':'Xem kết quả'}</button></div>`;
    }
    el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">📋 Pflegegrad</div></div>
<div style="padding:0 1rem 1rem">
<div style="display:flex;gap:4px;background:var(--s2);border-radius:var(--r);padding:3px;width:fit-content;margin-bottom:1rem">
  <button class="pg-tab${isInfo?' active':''}" onclick="window._pgTab('info')">📋 Tham khảo</button>
  <button class="pg-tab${!isInfo?' active':''}" onclick="window._pgTab('quiz')">🎯 Kiểm tra</button>
</div>
${content}
</div>`;
  }
  window._pgTab=(t)=>{_pgState.tab=t;if(t==='quiz')_pgState={tab:'quiz',qIdx:0,score:0,done:false};draw();};
  window._pgAnswer=(i)=>{
    const q=PG_QUIZ[_pgState.qIdx];
    const opts=document.querySelectorAll('#pg-opts .ss-opt');
    opts.forEach((b,j)=>{b.disabled=true;if(j===q.correct)b.classList.add('correct');else if(j===i&&i!==q.correct)b.classList.add('wrong');});
    if(i===q.correct)_pgState.score++;
    const ex=document.getElementById('pg-explain');
    if(ex){ex.style.display='block';ex.innerHTML=`<div class="ss-explain-box ${i===q.correct?'correct':'wrong'}" style="margin-top:.5rem"><b>${i===q.correct?'✅ Richtig!':'❌ Falsch!'}</b> ${esc(q.exp)}</div>`;}
    const nb=document.getElementById('pg-next');if(nb)nb.style.display='block';
  };
  window._pgNext=()=>{_pgState.qIdx++;if(_pgState.qIdx>=PG_QUIZ.length)_pgState.done=true;draw();};
  window._pgRestart=()=>{_pgState={tab:'quiz',qIdx:0,score:0,done:false};draw();};
  draw();
}

function renderPronunciation(){
  const el=document.getElementById('page-pronunciation');
  if(!el)return;
  let openIdx=-1;
  function draw(){
    el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">🗣️ Phát âm tiếng Đức</div></div>
<div style="padding:0 1rem 1rem">
<p style="color:var(--t2);font-size:.82rem;margin-bottom:1rem">Nhấn vào thẻ để nghe ví dụ và xem hướng dẫn phát âm</p>
<div class="pron-grid">${PRONUNCIATION_GUIDE.map((p,i)=>`<div class="pron-card${openIdx===i?' open':''}" onclick="window._pronToggle(${i})">
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div>
      <span class="pron-sound">${esc(p.sound)}</span>
      <span class="pron-ipa" style="margin-left:.4rem">${esc(p.ipa)}</span>
    </div>
    <span style="color:var(--t3);font-size:.7rem">${openIdx===i?'▲':'▼'}</span>
  </div>
  <div class="pron-vi">${esc(p.hint)}</div>
  ${openIdx===i?`<div class="pron-details">
    <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem">
      <span style="font-size:1.1rem;font-weight:600;color:var(--tx)">${esc(p.word)}</span>
      <button class="pron-listen" onclick="event.stopPropagation();speakDE('${esc(p.word)}')" title="Nghe">🔊</button>
      <span style="font-size:.78rem;color:var(--t3)">${esc(p.meaning)}</span>
    </div>
  </div>`:''}
</div>`).join('')}
</div>
</div>`;
  }
  window._pronToggle=(i)=>{openIdx=openIdx===i?-1:i;draw();};
  draw();
}

// ════════════════════════════════════════════════════════
// ADVANCED FEATURES: Voice Practice, Forgetting Curve, Branching Shift
// ════════════════════════════════════════════════════════

// ── Helpers ──────────────────────────────────────────────
function levenshtein(a,b){
  const m=a.length,n=b.length;
  const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}
function pronounceScore(target,heard){
  const t=target.toLowerCase().trim(),h=heard.toLowerCase().trim();
  if(t===h)return 100;
  const maxLen=Math.max(t.length,h.length);
  if(!maxLen)return 0;
  return Math.max(0,Math.round((1-levenshtein(t,h)/maxLen)*100));
}
function calcRetention(interval,dueMs){
  const lastReview=dueMs-interval*86400000;
  const daysSince=(Date.now()-lastReview)/86400000;
  const stability=Math.max(interval,1);
  return Math.max(0,Math.round(Math.exp(-daysSince/stability)*100));
}
function renderCurveSVG(interval,dueMs){
  const W=300,H=120,PAD=30;
  const days=Math.max(interval*2,2);
  const lastReview=dueMs-interval*86400000;
  const currentDay=Math.min((Date.now()-lastReview)/86400000,days);
  const pts=Array.from({length:50},(_,i)=>{
    const d=(i/49)*days;
    const r=Math.exp(-d/Math.max(interval,1));
    const x=PAD+(d/days)*(W-PAD*2);
    const y=PAD+(1-r)*(H-PAD*2);
    return x+','+y;
  }).join(' ');
  const cx=PAD+(currentDay/days)*(W-PAD*2);
  const cr=Math.exp(-currentDay/Math.max(interval,1));
  const cy=PAD+(1-cr)*(H-PAD*2);
  return `<svg width="${W}" height="${H}" style="width:100%;max-width:300px" viewBox="0 0 ${W} ${H}">
<rect x="${PAD}" y="${PAD}" width="${W-PAD*2}" height="${(H-PAD*2)*0.3}" fill="rgba(34,197,94,.08)"/>
<rect x="${PAD}" y="${PAD+(H-PAD*2)*0.3}" width="${W-PAD*2}" height="${(H-PAD*2)*0.3}" fill="rgba(234,179,8,.08)"/>
<rect x="${PAD}" y="${PAD+(H-PAD*2)*0.6}" width="${W-PAD*2}" height="${(H-PAD*2)*0.4}" fill="rgba(239,68,68,.08)"/>
<polyline points="${pts}" fill="none" stroke="#4fa3ff" stroke-width="2"/>
<line x1="${cx}" y1="${PAD}" x2="${cx}" y2="${H-PAD}" stroke="#f97316" stroke-width="1.5" stroke-dasharray="3,3"/>
<circle cx="${cx}" cy="${cy}" r="5" fill="#f97316" stroke="white" stroke-width="1.5"/>
<text x="${PAD}" y="${H-5}" font-size="9" fill="#888">0d</text>
<text x="${W-PAD-14}" y="${H-5}" font-size="9" fill="#888">${Math.round(days)}d</text>
<text x="2" y="${PAD+5}" font-size="9" fill="#888">100%</text>
<text x="2" y="${H-PAD+5}" font-size="9" fill="#888">0%</text>
</svg>`;
}

// ── State vars ────────────────────────────────────────────
let _vpState={idx:0,pool:[],sessionScores:[],recording:false,recognition:null};
let _saState={sceneId:'intro',health:60,score:0,totalXP:0,history:[],done:false};

// ── Branching Shift Data ──────────────────────────────────
const SHIFT_ADV={
  title:'Ca trực đêm — Khu Geriatrie',
  scenes:{
    intro:{id:'intro',title:'Bàn giao ca',
      text:'Es ist 22:00 Uhr. Die Tagschicht übergibt Ihnen die Station. Schwester Maria berichtet: "Frau Hoffmann in Zimmer 4 ist heute Abend sehr unruhig. Herr Braun in Zimmer 7 hat heute kaum gegessen."',
      textVI:'22:00 — Ca ngày bàn giao. Y tá Maria: "Bà Hoffmann phòng 4 rất bồn chồn. Ông Braun phòng 7 hầu như không ăn."',
      patientStatus:null,
      choices:[
        {text:'Übergabe sorgfältig aufschreiben und nachfragen',textVI:'Ghi chép bàn giao cẩn thận và hỏi thêm',healthDelta:5,xp:10,feedback:'Sehr gut! Gründliche Übergabe verhindert Fehler.',feedbackVI:'Rất tốt! Bàn giao kỹ lưỡng ngăn ngừa sai sót.',nextId:'scene2'},
        {text:'Übergabe kurz anhören und schnell anfangen',textVI:'Nghe bàn giao qua loa, bắt đầu ngay',healthDelta:-5,xp:0,feedback:'Nicht ideal. Wichtige Infos können verloren gehen.',feedbackVI:'Chưa tốt. Thông tin quan trọng có thể bị bỏ sót.',nextId:'scene2'},
      ]},
    scene2:{id:'scene2',title:'Frau Hoffmann — Zimmer 4',
      text:'Sie gehen zu Frau Hoffmann (84J, Demenz PG4). Sie ist aufgestanden und läuft verwirrt umher: "Wo ist mein Mann? Ich muss nach Hause!"',
      textVI:'Bà Hoffmann (84t, Dementia PG4) đứng dậy đi lơ ngơ: "Chồng tôi đâu? Tôi phải về nhà!"',
      patientStatus:'Frau Hoffmann — agitiert',
      choices:[
        {text:'Ruhig ansprechen, validieren: "Sie möchten nach Hause, das verstehe ich." Sanft ablenken.',textVI:'Nói nhẹ nhàng, xác nhận: "Bà muốn về nhà, tôi hiểu." Đánh lạc hướng nhẹ nhàng.',healthDelta:10,xp:15,feedback:'Perfekt! Validation ist die beste Methode bei Demenz-Agitation.',feedbackVI:'Hoàn hảo! Xác nhận cảm xúc là phương pháp tốt nhất với kích động Dementia.',nextId:'scene3'},
        {text:'Laut und bestimmt sagen: "Frau Hoffmann! Legen Sie sich sofort hin!"',textVI:'Nói to: "Bà Hoffmann! Nằm xuống ngay!"',healthDelta:-15,xp:0,feedback:'Falsch! Laute Ansprache verstärkt die Agitation erheblich.',feedbackVI:'Sai! Nói to sẽ làm bà kích động thêm nhiều.',nextId:'scene3_bad'},
        {text:'Bettgitter hochstellen und Zimmer verlassen',textVI:'Kéo thanh chắn giường lên rồi rời phòng',healthDelta:-20,xp:0,feedback:'Sehr falsch! Freiheitsentzug ohne richterliche Genehmigung ist illegal.',feedbackVI:'Rất sai! Hạn chế tự do không có lệnh tòa án là vi phạm pháp luật.',nextId:'scene3_bad'},
      ]},
    scene3:{id:'scene3',title:'Vitalzeichen-Kontrolle',
      text:'Bei Herrn Braun (72J, KHK, Hypertonie): RR 188/112 mmHg, HF 94/min. Er klagt über leichte Kopfschmerzen.',
      textVI:'Ông Braun (72t, KHK, Tăng HA): HA 188/112, nhịp tim 94. Ông than đau đầu nhẹ.',
      patientStatus:'Herr Braun — RR erhöht',
      choices:[
        {text:'Sofort Arzt anrufen, Patienten hinlegen lassen, erneut messen in 5 Min.',textVI:'Gọi bác sĩ ngay, cho bệnh nhân nằm, đo lại sau 5 phút.',healthDelta:10,xp:15,feedback:'Richtig! Hypertensive Krise erfordert sofortige ärztliche Beurteilung.',feedbackVI:'Đúng! Cơn tăng HA cần bác sĩ đánh giá ngay lập tức.',nextId:'scene4'},
        {text:'Warten und in einer Stunde nochmal messen',textVI:'Chờ và đo lại sau 1 tiếng',healthDelta:-15,xp:0,feedback:'Falsch! RR 188/112 mit Symptomen = hypertensive Krise. Sofort Arzt!',feedbackVI:'Sai! HA 188/112 kèm triệu chứng = Cơn tăng HA. Gọi bác sĩ ngay!',nextId:'scene4'},
        {text:'Selbst Nitro-Spray geben',textVI:'Tự lấy Nitro-Spray cho dùng',healthDelta:-10,xp:0,feedback:'Falsch! Medikamente nur nach ärztlicher Anordnung.',feedbackVI:'Sai! Thuốc chỉ dùng theo y lệnh bác sĩ.',nextId:'scene4'},
      ]},
    scene3_bad:{id:'scene3_bad',title:'Vitalzeichen-Kontrolle (schwieriger)',
      text:'Frau Hoffmann weint jetzt. Zudem: Herr Braun hat RR 192/115 und klagt über stärkere Kopfschmerzen und Sehstörungen.',
      textVI:'Bà Hoffmann giờ đang khóc. Thêm: Ông Braun HA 192/115, đau đầu nặng và mờ mắt.',
      patientStatus:'⚠️ Tình huống phức tạp hơn!',
      choices:[
        {text:'Zuerst Notarzt für Herrn Braun, dann Kollegen zu Frau Hoffmann bitten',textVI:'Gọi bác sĩ cho Ông Braun trước, nhờ đồng nghiệp xử lý Bà Hoffmann',healthDelta:5,xp:10,feedback:'Gut priorisiert! Lebensbedrohliche Situation zuerst.',feedbackVI:'Ưu tiên tốt! Xử lý tình huống nguy hiểm tính mạng trước.',nextId:'scene4'},
        {text:'Beide Situationen alleine bewältigen',textVI:'Tự xử lý cả hai tình huống một mình',healthDelta:-10,xp:0,feedback:'Riskant! In Notfällen immer Unterstützung holen.',feedbackVI:'Rủi ro! Trong cấp cứu, luôn phải kêu thêm người hỗ trợ.',nextId:'scene4'},
      ]},
    scene4:{id:'scene4',title:'Medikamentenverweigerung',
      text:'Um Mitternacht verweigert Herr Fischer (68J) seine Schlaftabletten: "Die machen mich schläfrig bis Mittag! Ich nehme die nicht mehr!"',
      textVI:'Nửa đêm, Ông Fischer (68t) từ chối thuốc ngủ: "Thuốc này làm tôi buồn ngủ đến trưa! Tôi không uống nữa!"',
      patientStatus:'Herr Fischer — verweigert Medikamente',
      choices:[
        {text:'Gründe erfragen, informieren, dokumentieren, Arzt am Morgen informieren',textVI:'Hỏi lý do, giải thích, ghi hồ sơ, báo bác sĩ vào sáng',healthDelta:5,xp:15,feedback:'Korrekt! Patientenautonomie respektieren + Dokumentationspflicht.',feedbackVI:'Đúng! Tôn trọng quyền bệnh nhân + nghĩa vụ ghi chép.',nextId:'scene5'},
        {text:'Medikamente heimlich in den Tee mischen',textVI:'Bí mật trộn thuốc vào trà',healthDelta:-20,xp:0,feedback:'Schwerer Rechtsverstoß! Körperverletzung und Straftat.',feedbackVI:'Vi phạm pháp luật nghiêm trọng! Phạm tội hình sự.',nextId:'scene5'},
        {text:'Patienten überreden bis er nachgibt',textVI:'Kiên trì thuyết phục cho đến khi bệnh nhân chịu uống',healthDelta:-5,xp:0,feedback:'Nicht korrekt. Psychischer Druck verletzt die Patientenrechte.',feedbackVI:'Không đúng. Áp lực tâm lý vi phạm quyền bệnh nhân.',nextId:'scene5'},
      ]},
    scene5:{id:'scene5',title:'Sturz um 3:00 Uhr',
      text:'Um 3:00 Uhr finden Sie Frau Weber (79J, PG3) auf dem Boden neben dem Bett. Sie ist wach, klagt über Schmerzen im rechten Hüftbereich.',
      textVI:'3:00 sáng — Bà Weber (79t, PG3) nằm trên sàn. Bà tỉnh, than đau vùng hông phải.',
      patientStatus:'🚨 Frau Weber — Sturz!',
      choices:[
        {text:'Nicht bewegen! Notruf intern, NRS, Vitalzeichen, beruhigen, dokumentieren',textVI:'Không di chuyển! Báo nội bộ, đánh giá đau, sinh hiệu, trấn an, ghi chép',healthDelta:15,xp:20,feedback:'Perfekt! SAMPLE-Schema beim Sturz. Fraktur muss ausgeschlossen werden.',feedbackVI:'Hoàn hảo! Quy trình đúng khi té ngã. Cần loại trừ gãy xương.',nextId:'end'},
        {text:'Patientin vorsichtig aufheben und ins Bett legen',textVI:'Nhẹ nhàng đỡ bệnh nhân dậy lên giường',healthDelta:-25,xp:0,feedback:'Falsch! Bei Sturz mit Schmerzen nie sofort bewegen — Fraktur möglich!',feedbackVI:'Sai! Khi té ngã kèm đau, tuyệt đối không di chuyển — có thể gãy xương!',nextId:'end'},
        {text:'Auf Kollegen warten, in der Zwischenzeit nichts tun',textVI:'Chờ đồng nghiệp, không làm gì',healthDelta:-10,xp:0,feedback:'Nicht akzeptabel. Sofortmaßnahmen sind immer notwendig.',feedbackVI:'Không chấp nhận được. Luôn phải thực hiện biện pháp ngay.',nextId:'end'},
      ]},
    end:{id:'end',type:'end',title:'Kết thúc ca trực',
      text:'Es ist 6:00 Uhr. Die Frühschicht kommt. Sie übergeben die Station.',
      textVI:'6:00 sáng. Ca sáng bắt đầu. Bạn bàn giao lại.',
    },
  }
};

function renderVoicePractice(){
  const el=document.getElementById('page-voice-practice');
  if(!el)return;
  _vpState={idx:0,pool:shuffle(flatAll()),sessionScores:[],recording:false,recognition:null};
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
    el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">🎙️ Luyện phát âm</div></div>
<div style="padding:2rem 1rem;text-align:center">
  <div style="font-size:3rem;margin-bottom:1rem">😔</div>
  <p style="color:var(--t2)">Trình duyệt không hỗ trợ nhận giọng nói.</p>
  <p style="color:var(--t3);font-size:.85rem">Vui lòng dùng <b>Chrome</b> hoặc <b>Edge</b> trên máy tính.</p>
  <button class="btn btn-primary" style="margin-top:1rem" onclick="navTo('dashboard')">← Quay lại</button>
</div>`;
    return;
  }
  function getBest(){try{return JSON.parse(localStorage.getItem('pd-voice-best')||'{}');}catch(e){return{};}}
  function saveBest(word,score){try{const b=getBest();if((b[word]||0)<score){b[word]=score;localStorage.setItem('pd-voice-best',JSON.stringify(b));}}catch(e){}}
  function draw(){
    const w=_vpState.pool[_vpState.idx%_vpState.pool.length];
    const best=getBest();
    const bestScore=best[w.de]||0;
    const done=_vpState.sessionScores.length;
    const avg=done?Math.round(_vpState.sessionScores.reduce((a,b)=>a+b,0)/done):0;
    el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">🎙️ Luyện phát âm</div></div>
<div style="padding:0 1rem 1.5rem">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.9rem;font-size:.8rem;color:var(--t2)">
  <span>🎙️ ${done} từ đã luyện${done?` · TB ${avg}%`:''}</span>
  ${bestScore?`<span>⭐ Kỷ lục: <b style="color:var(--yellow)">${bestScore}%</b></span>`:''}
</div>
<div class="vp-card">
  <button class="btn" style="font-size:.8rem;padding:4px 12px;margin-bottom:.9rem" onclick="speakDE('${esc(w.de)}')">🔊 Nghe mẫu</button>
  <div class="vp-word">${esc(w.de)}</div>
  <div class="vp-meaning">${esc(w.vi)}</div>
  <div id="vp-result" style="display:none" class="vp-result-wrap"></div>
  <button class="vp-mic-btn" id="vp-mic" onclick="window._vpRecord()">🎙️ Nhấn để nói</button>
  <div style="color:var(--t3);font-size:.72rem;margin-top:.5rem" id="vp-status">Nhấn mic để bắt đầu ghi âm</div>
</div>
<div style="display:flex;gap:.5rem;margin-top:.9rem;justify-content:center">
  <button class="btn" onclick="window._vpPrev()">← Từ trước</button>
  <button class="btn btn-primary" onclick="window._vpNext()">Từ tiếp →</button>
</div>
</div>`;
    window._vpRecord=()=>{
      if(_vpState.recording){
        if(_vpState.recognition)_vpState.recognition.stop();
        return;
      }
      const rec=new SR();
      rec.lang='de-DE';rec.interimResults=false;rec.maxAlternatives=1;
      _vpState.recognition=rec;_vpState.recording=true;
      const micBtn=document.getElementById('vp-mic');
      const status=document.getElementById('vp-status');
      if(micBtn)micBtn.classList.add('recording');
      if(status)status.textContent='🔴 Đang ghi âm... (nói tiếng Đức)';
      rec.onresult=(e)=>{
        const heard=e.results[0][0].transcript;
        const score=pronounceScore(w.de,heard);
        saveBest(w.de,score);
        _vpState.sessionScores.push(score);
        if(score>=5)progressMission('flash5');
        if(_vpState.sessionScores.length>=5)progressMission('flash5');
        if(score>=80){addXP(5,'Phát âm tốt');toast('✅ Phát âm tốt! +5 XP');}
        else if(score>=60){toast('🟡 Khá tốt! Cần luyện thêm');}
        else{toast('❌ Cần luyện thêm. Nhấn 🔊 để nghe lại');}
        const scoreColor=score>=80?'var(--teal)':score>=60?'var(--yellow)':'var(--red)';
        const icon=score>=80?'✅':score>=60?'🟡':'❌';
        const res=document.getElementById('vp-result');
        if(res){
          res.style.display='block';
          res.innerHTML=`<div class="vp-heard">Bạn nói: "<i>${esc(heard)}</i>"</div>
<div style="display:flex;align-items:center;gap:.5rem;margin-top:.4rem">
  <div class="vp-result-bar"><div class="vp-score-fill" style="width:${score}%;background:${scoreColor}"></div></div>
  <span style="font-weight:700;color:${scoreColor}">${score}% ${icon}</span>
</div>`;
        }
        _vpState.recording=false;
        const mb=document.getElementById('vp-mic');const st=document.getElementById('vp-status');
        if(mb)mb.classList.remove('recording');
        if(st)st.textContent='Nhấn mic để thử lại';
      };
      rec.onerror=(e)=>{
        _vpState.recording=false;
        const mb=document.getElementById('vp-mic');const st=document.getElementById('vp-status');
        if(mb)mb.classList.remove('recording');
        if(st)st.textContent=e.error==='not-allowed'?'⚠️ Cần cấp quyền microphone':'⚠️ Lỗi: '+e.error;
      };
      rec.onend=()=>{_vpState.recording=false;const mb=document.getElementById('vp-mic');if(mb)mb.classList.remove('recording');};
      try{rec.start();}catch(e){_vpState.recording=false;}
    };
    window._vpPrev=()=>{if(_vpState.idx>0)_vpState.idx--;draw();};
    window._vpNext=()=>{_vpState.idx++;draw();};
  }
  draw();
}

function renderForgettingCurve(){
  const el=document.getElementById('page-forgetting');
  if(!el)return;
  let activeTab='red',expandedWord=null;
  function draw(){
    const srsWords=Object.keys(SRS_DB);
    if(srsWords.length===0){
      el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">📈 Đường cong quên lãng</div></div>
<div style="padding:2rem 1rem;text-align:center">
  <div style="font-size:3rem;margin-bottom:1rem">📚</div>
  <p style="color:var(--t2)">Bạn chưa học SRS.</p>
  <p style="color:var(--t3);font-size:.85rem">Hãy vào Ôn SRS để bắt đầu tích lũy dữ liệu!</p>
  <button class="btn btn-primary" style="margin-top:1rem" onclick="navTo('srs')">→ Ôn SRS ngay</button>
</div>`;
      return;
    }
    const allVocab=flatAll();
    const srsSet=new Set(srsWords);
    const notLearned=allVocab.filter(v=>!srsSet.has(v.de));
    const words=srsWords.map(de=>{
      const s=SRS_DB[de];
      const ret=calcRetention(s.interval,s.due);
      const vi=allVocab.find(v=>v.de===de)?.vi||'';
      return{de,vi,ret,interval:s.interval,due:s.due};
    });
    const green=words.filter(w=>w.ret>=70);
    const yellow=words.filter(w=>w.ret>=40&&w.ret<70);
    const red=words.filter(w=>w.ret<40);
    const tabWords=activeTab==='red'?red:activeTab==='yellow'?yellow:activeTab==='green'?green:words;
    const tabDefs={red:{label:'Cần ôn gấp 🔴',color:'var(--red)'},yellow:{label:'Sắp quên 🟡',color:'var(--yellow)'},green:{label:'Nhớ tốt 🟢',color:'var(--green)'},all:{label:'Tất cả',color:'var(--blue)'}};
    el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">📈 Đường cong quên lãng</div></div>
<div style="padding:0 1rem 1.5rem">
<div class="fc-summary-grid">
  <div class="fc-sum-card" style="border-color:var(--green)" onclick="window._fcTab('green')"><div style="font-size:1.4rem;font-weight:800;color:var(--green)">${green.length}</div><div style="font-size:.72rem;color:var(--t3)">🟢 Nhớ tốt</div></div>
  <div class="fc-sum-card" style="border-color:var(--yellow)" onclick="window._fcTab('yellow')"><div style="font-size:1.4rem;font-weight:800;color:var(--yellow)">${yellow.length}</div><div style="font-size:.72rem;color:var(--t3)">🟡 Sắp quên</div></div>
  <div class="fc-sum-card" style="border-color:var(--red)" onclick="window._fcTab('red')"><div style="font-size:1.4rem;font-weight:800;color:var(--red)">${red.length}</div><div style="font-size:.72rem;color:var(--t3)">🔴 Cần ôn</div></div>
  <div class="fc-sum-card" style="border-color:var(--blue)" onclick="window._fcTab('all')"><div style="font-size:1.4rem;font-weight:800;color:var(--blue)">${notLearned.length}</div><div style="font-size:.72rem;color:var(--t3)">🔵 Chưa học</div></div>
</div>
<div class="fc-tabs" style="margin:.9rem 0 .6rem">
  ${Object.entries(tabDefs).map(([k,v])=>`<button class="fc-tab${activeTab===k?' active':''}" style="${activeTab===k?`background:${v.color};color:#fff`:''}" onclick="window._fcTab('${k}')">${v.label} (${k==='red'?red.length:k==='yellow'?yellow.length:k==='green'?green.length:words.length})</button>`).join('')}
</div>
<div class="fc-list">
${tabWords.length===0?`<p style="color:var(--t3);text-align:center;padding:1.5rem">Không có từ nào trong mục này</p>`:''}
${tabWords.map(w=>{
  const c=w.ret>=70?'var(--green)':w.ret>=40?'var(--yellow)':'var(--red)';
  const isExp=expandedWord===w.de;
  return`<div class="fc-row${isExp?' expanded':''}" onclick="window._fcExpand('${esc(w.de).replace(/'/g,"\\'")}')">
  <div class="fc-row-main">
    <div class="fc-ret-bar"><div class="fc-ret-fill" style="width:${w.ret}%;background:${c}"></div></div>
    <span style="font-size:.7rem;font-weight:700;color:${c};min-width:36px">${w.ret}%</span>
    <div class="fc-word-info"><span style="font-weight:600;color:var(--tx)">${esc(w.de)}</span> <span style="color:var(--t3);font-size:.78rem">${esc(w.vi)}</span></div>
    <button class="btn" style="padding:2px 8px;font-size:.72rem;margin-left:auto" onclick="event.stopPropagation();speakDE('${esc(w.de)}')">🔊</button>
    <button class="btn" style="padding:2px 8px;font-size:.72rem" onclick="event.stopPropagation();navTo('srs')">Ôn →</button>
  </div>
  ${isExp?`<div class="fc-curve-wrap">${renderCurveSVG(w.interval,w.due)}<div style="font-size:.72rem;color:var(--t3);margin-top:.3rem">Interval: ${w.interval}d · Retention: ${w.ret}%</div></div>`:''}
</div>`;}).join('')}
</div>
</div>`;
    window._fcTab=(t)=>{activeTab=t;expandedWord=null;draw();};
    window._fcExpand=(de)=>{expandedWord=expandedWord===de?null:de;draw();};
  }
  draw();
}

function renderShiftAdv(){
  const el=document.getElementById('page-shift-adv');
  if(!el)return;
  _saState={sceneId:'intro',health:60,score:0,totalXP:0,history:[],done:false};
  const SCENE_ORDER=['intro','scene2','scene3','scene3_bad','scene4','scene5'];
  const mainScenes=['intro','scene2','scene3','scene4','scene5'];
  function countProgress(){return _saState.history.length;}
  function draw(){
    if(_saState.done){
      const h=_saState.health;
      const isExc=h>=80,isOk=h>=55;
      const emoji=isExc?'🏆':isOk?'😊':'📚';
      const msg=isExc?'Xuất sắc! Bạn là một điều dưỡng giỏi!':isOk?'Tốt! Bạn xử lý được hầu hết tình huống.':'Cần luyện tập thêm. Đừng nản lòng!';
      const col=isExc?'var(--yellow)':isOk?'var(--teal)':'var(--orange)';
      el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">🏥 Ca trực nâng cao</div></div>
<div style="padding:0 1rem 1.5rem">
<div class="sa-ending" style="border-color:${col}">
  <div style="font-size:2.5rem">${emoji}</div>
  <h3 style="color:${col};margin:.4rem 0">${msg}</h3>
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:.75rem 0">
    <div style="text-align:center"><div style="font-size:1.3rem;font-weight:700;color:${col}">${h}</div><div style="font-size:.7rem;color:var(--t3)">Sức khỏe BN</div></div>
    <div style="text-align:center"><div style="font-size:1.3rem;font-weight:700;color:var(--teal)">${_saState.totalXP}</div><div style="font-size:.7rem;color:var(--t3)">XP kiếm được</div></div>
    <div style="text-align:center"><div style="font-size:1.3rem;font-weight:700;color:var(--blue)">${_saState.score}/${mainScenes.length}</div><div style="font-size:.7rem;color:var(--t3)">Quyết định đúng</div></div>
  </div>
  <div style="text-align:left;margin:.75rem 0">
    ${_saState.history.map(h=>`<div class="sa-hist-item"><span>${h.correct?'✅':'❌'}</span><span style="font-size:.8rem;color:var(--t2)">${esc(h.title)}</span><span style="font-size:.76rem;color:var(--t3)">${esc(h.choiceVI)}</span></div>`).join('')}
  </div>
  <button class="btn btn-primary" onclick="renderShiftAdv()">↺ Ca mới</button>
</div>
</div>`;
      return;
    }
    const scene=SHIFT_ADV.scenes[_saState.sceneId];
    if(!scene)return;
    const prog=countProgress();
    const hPct=Math.max(0,Math.min(100,_saState.health));
    const hCol=hPct>=70?'var(--green)':hPct>=40?'var(--yellow)':'var(--red)';
    el.innerHTML=`<div class="ph"><div class="ph-back" onclick="navTo('dashboard')">←</div><div class="ph-title">🏥 Ca trực nâng cao</div></div>
<div style="padding:0 1rem 1.5rem">
<div class="sa-header">
  <div style="flex:1">
    <div style="font-size:.72rem;color:var(--t3);margin-bottom:3px">Sức khỏe bệnh nhân</div>
    <div class="sa-health-bar"><div class="sa-health-fill" style="width:${hPct}%;background:${hCol}"></div></div>
    <div style="font-size:.72rem;color:${hCol};margin-top:2px">${hPct}/100</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:.72rem;color:var(--t3)">XP</div>
    <div style="font-size:1.1rem;font-weight:700;color:var(--teal)">${_saState.totalXP}</div>
  </div>
</div>
<div style="display:flex;gap:4px;margin:.6rem 0">
  ${mainScenes.map((_,i)=>`<div style="width:24px;height:6px;border-radius:3px;background:${i<prog?'var(--teal)':'var(--b2)'}"></div>`).join('')}
</div>
<div class="sa-scene-card">
  ${scene.patientStatus?`<div class="sa-scene-badge">${esc(scene.patientStatus)}</div>`:''}
  <div class="sa-scene-title">${esc(scene.title)}</div>
  <div class="sa-situation-de">${esc(scene.text)}</div>
  <div class="sa-situation-vi">${esc(scene.textVI)}</div>
  <div style="font-size:.75rem;color:var(--t3);margin:.75rem 0 .4rem;font-weight:600">QUYẾT ĐỊNH CỦA BẠN:</div>
  <div class="sa-choices" id="sa-choices">
    ${scene.choices.map((c,i)=>`<button class="sa-choice" onclick="window._saChoose(${i})">
      <span class="sa-choice-de">${esc(c.text)}</span>
      <span class="sa-choice-vi">${esc(c.textVI)}</span>
    </button>`).join('')}
  </div>
  <div id="sa-feedback" style="display:none"></div>
  <div id="sa-next" style="display:none;margin-top:.75rem"><button class="btn btn-primary" onclick="window._saNext()">Tiếp tục →</button></div>
</div>
</div>`;
    let _chosenNext=null;
    window._saChoose=(i)=>{
      const scene=SHIFT_ADV.scenes[_saState.sceneId];
      const choice=scene.choices[i];
      const opts=document.querySelectorAll('.sa-choice');
      opts.forEach((b,j)=>{b.disabled=true;if(j===i)b.classList.add(choice.healthDelta>0?'correct':'wrong');});
      _saState.health=Math.max(0,Math.min(100,_saState.health+choice.healthDelta));
      _saState.totalXP+=choice.xp;
      if(choice.xp>0){_saState.score++;addXP(choice.xp,'Ca trực nâng cao');}
      _saState.history.push({title:scene.title,choiceVI:choice.textVI,correct:choice.xp>0});
      _chosenNext=choice.nextId;
      const fb=document.getElementById('sa-feedback');
      if(fb){
        fb.style.display='block';
        fb.innerHTML=`<div class="sa-feedback-box ${choice.healthDelta>0?'good':'bad'}">
          <b>${choice.healthDelta>0?'✅':'❌'}</b> ${esc(choice.feedback)}<br>
          <span style="font-size:.78rem;color:var(--t2)">${esc(choice.feedbackVI)}</span>
          <span style="font-size:.75rem;color:var(--t3);display:block;margin-top:3px">${choice.healthDelta>0?`❤️ +${choice.healthDelta}`:`💔 ${choice.healthDelta}`} · ${choice.xp>0?`⚡ +${choice.xp} XP`:'Không có XP'}</span>
        </div>`;
      }
      const nb=document.getElementById('sa-next');if(nb)nb.style.display='block';
      // Update health bar
      const hFill=document.querySelector('.sa-health-fill');
      const hPct2=Math.max(0,Math.min(100,_saState.health));
      const hCol2=hPct2>=70?'var(--green)':hPct2>=40?'var(--yellow)':'var(--red)';
      if(hFill){hFill.style.width=hPct2+'%';hFill.style.background=hCol2;}
    };
    window._saNext=()=>{
      if(_chosenNext==='end'||!_chosenNext){
        _saState.done=true;
        progressMission('ex1');
        draw();
      } else {
        _saState.sceneId=_chosenNext;
        draw();
      }
    };
  }
  draw();
}

// ════════════════════════════════════════════════════════
function renderDashboard(){
  if(!document.getElementById('dash-xp-card')) return;
  const lv=getLevel(GS.xp),nx=getNextLevel(GS.xp);
  const base=lv.min,top=nx?nx.min:GS.xp+1;
  const pct=Math.round((GS.xp-base)/(top-base)*100);

  // ── Greeting Card (Feature 1 + Feature 3 + Feature 6) ─
  const cefr=getCEFR(GS.xp);
  const todayXP=getTodayXP();
  const dailyGoal=50;
  const dailyPct=Math.min(Math.round(todayXP/dailyGoal*100),100);
  const userName=(window._currentUser?.user_metadata?.name||window._currentUser?.email||'').split(' ').pop()||'bạn';
  document.getElementById('dash-xp-card').innerHTML=`
    <div class="greeting-card">
      <div class="greeting-top">
        <div style="flex:1">
          <div class="greeting-text">${getGreeting()}, <strong>${sanitize(userName)}</strong>!</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap;">
            <span class="cefr-badge" style="background:${cefr.color}20;color:${cefr.color};border:1px solid ${cefr.color}40">${cefr.level}</span>
            <span style="font-size:.78rem;color:var(--t2)">🔥 ${GS.streak} ngày liên tiếp</span>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:.72rem;color:var(--t3);margin-bottom:3px">Hôm nay</div>
          <div style="font-size:1rem;font-weight:700;color:var(--yellow)">${todayXP} / ${dailyGoal} XP</div>
        </div>
      </div>
      <div class="daily-goal-bar" style="margin-top:10px">
        <div class="daily-goal-fill" style="width:${dailyPct}%"></div>
      </div>
      <div style="font-size:.68rem;color:var(--t3);margin-top:4px">${dailyPct<100?`${dailyGoal-todayXP} XP nữa để đạt mục tiêu`:'🎉 Đã đạt mục tiêu hôm nay!'}</div>
    </div>
    <div class="xp-card" style="margin-top:10px">
      <div class="xp-card-top">
        <div><div class="xp-level">${lv.emoji} ${lv.name}</div><div class="xp-level-lbl">Cấp độ hiện tại</div></div>
        <div class="xp-total">${GS.xp} XP${nx?' / '+nx.min+' XP':''}</div>
      </div>
      <div class="xp-bar-wrap"><div class="xp-bar-inner" style="width:${pct}%"></div></div>
      <div class="xp-bar-labels"><span>${lv.name}</span>${nx?'<span>'+nx.emoji+' '+nx.name+'</span>':''}</div>
    </div>`;

  // ── Feature Grid (Feature 4) ────────────────────────────
  const FEAT_GRID=[
    {icon:'🔁',title:'Ôn SRS',      sub:'Ôn tập thông minh', page:'srs'},
    {icon:'✏️',title:'Bài tập',     sub:'Luyện tập kỹ năng',  page:'exercise'},
    {icon:'💬',title:'Hội thoại',   sub:'Mẫu câu thực tế',    page:'dialogue'},
    {icon:'🏥',title:'Sơ đồ cơ thể',sub:'Từ vựng y tế',       page:'body-diagram'},
    {icon:'🗺️',title:'Lộ trình',   sub:'Ưu tiên học tập',     page:'learning-path'},
    {icon:'⭐',title:'Yêu thích',   sub:'Từ đã đánh dấu',      page:'bookmarks'},
    {icon:'🤖',title:'Roleplay AI', sub:'Luyện hội thoại',     page:'roleplay'},
    {icon:'⌨️',title:'Tốc độ gõ',  sub:'Test typing speed',   page:'typing-speed'},
    {icon:'📖',title:'Từ viết tắt',sub:'30 ký hiệu y tế',page:'abbr'},
    {icon:'🚨',title:'Khẩn cấp FC',sub:'20 thẻ cấp cứu',page:'emergency-fc'},
    {icon:'🏥',title:'Ca làm việc',sub:'5 tình huống thực tế',page:'shift-sim'},
    {icon:'🏅',title:'Pflegegrad',sub:'PG1–5 + Quiz',page:'pflegegrad'},
    {icon:'🗣️',title:'Phát âm',sub:'15 âm tiếng Đức',page:'pronunciation'},
    {icon:'🎙️',title:'Phát âm',sub:'Voice recognition',page:'voice-practice'},
    {icon:'📈',title:'Quên lãng',sub:'Ebbinghaus curve',page:'forgetting'},
    {icon:'🏥',title:'Ca trực Pro',sub:'Kịch bản phân nhánh',page:'shift-adv'},
  ];
  let featGridSec=document.getElementById('dash-feat-grid-sec');
  if(!featGridSec){
    featGridSec=document.createElement('div');
    featGridSec.id='dash-feat-grid-sec';
    const xpCard=document.getElementById('dash-xp-card');
    xpCard.after(featGridSec);
  }
  featGridSec.innerHTML=`<div class="feat-grid">${FEAT_GRID.map(f=>`
    <div class="feat-card" onclick="navTo('${f.page}')">
      <div class="feat-ic">${f.icon}</div>
      <div class="feat-title">${f.title}</div>
      <div class="feat-sub">${f.sub}</div>
    </div>`).join('')}</div>`;
  // Streak
  document.getElementById('dash-streak-card').innerHTML=`
    <div class="streak-card">
      <div class="streak-fire-big">🔥</div>
      <div class="streak-info"><div class="streak-days">${GS.streak}</div><div class="streak-lbl">ngày học liên tiếp · Tiếp tục duy trì!</div></div>
    </div>`;
  // Stats
  document.getElementById('dash-stats').innerHTML=`
    <div class="dash-card"><div class="dash-num">${totalItems}</div><div class="dash-lbl">Tổng mục</div></div>
    <div class="dash-card"><div class="dash-num" style="color:var(--teal)">${GS.mastered}</div><div class="dash-lbl">Đã thuộc</div></div>
    <div class="dash-card"><div class="dash-num" style="color:var(--yellow)">${GS.flashDone}</div><div class="dash-lbl">Thẻ ôn</div></div>
    <div class="dash-card"><div class="dash-num" style="color:var(--purple)">${GS.xp}</div><div class="dash-lbl">XP tích lũy</div></div>`;
  // Badges
  document.getElementById('dash-badges').innerHTML=`
    <div class="badges-section">
      <div class="badges-title">🏅 Huy hiệu thành tích (${GS.earnedBadges.length}/${ALL_BADGES.length})</div>
      <div class="badges-grid">${ALL_BADGES.map(b=>'<div class="badge-item '+(GS.earnedBadges.includes(b.id)?'earned':'locked')+'" title="'+b.name+'"><div class="badge-emoji">'+b.emoji+'</div><div class="badge-name">'+b.name+'</div></div>').join('')}</div>
    </div>`;
  // Progress
  const cats=Object.keys(DATA),colors=['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)','var(--c7)','var(--c8)','var(--pink)','var(--purple)'];
  document.getElementById('dash-progress').innerHTML=cats.map((cat,i)=>{
    const n=flatCat(cat).length;
    const due=flatCat(cat).filter(p=>{const s=SRS_DB[p.de];return s&&s.due<=Date.now();}).length;
    const learned=flatCat(cat).filter(p=>SRS_DB[p.de]).length;
    const pct2=Math.round(learned/n*100);
    return `<div class="prog-row">
      <div class="prog-nm">${CAT_META[cat].ic} ${CAT_META[cat].l}</div>
      <div class="prog-bw"><div class="prog-bf" style="width:0%;background:${colors[i]}" data-w="${pct2}"></div></div>
      <div class="prog-pct">${n}</div>
    </div>`;
  }).join('');
  setTimeout(()=>document.querySelectorAll('.prog-bf').forEach(el=>el.style.width=el.dataset.w+'%'),80);
  // Topic progress
  const tpSec=document.getElementById('dash-topic-prog-sec');
  const tpEl=document.getElementById('dash-topic-progress');
  if(tpSec&&tpEl&&_topics.length){
    tpSec.style.display='';
    tpEl.innerHTML=_topics.map(t=>{
      const catKeys=_dynCats.filter(c=>c.topic_id===t.id).map(c=>c.key);
      const total=catKeys.reduce((s,k)=>s+flatCat(k).length,0);
      const learned=catKeys.reduce((s,k)=>s+flatCat(k).filter(p=>SRS_DB[p.de]).length,0);
      const pct=total>0?Math.round(learned/total*100):0;
      return `<div class="prog-row"><div class="prog-nm">${t.icon} ${t.label}</div>
        <div class="prog-bw"><div class="prog-bf" style="width:0%;background:${t.color||'var(--blue)'}" data-w="${pct}"></div></div>
        <div class="prog-pct">${total} từ</div></div>`;
    }).join('');
    setTimeout(()=>tpEl.querySelectorAll('.prog-bf').forEach(el=>el.style.width=el.dataset.w+'%'),80);
  }
  // SRS due count
  const due=countDue();
  const dc=document.getElementById('srs-due-count');
  if(dc)dc.textContent=due?due+' cần ôn':'';
  // Suggestions
  const pool=shuffle(flatAll());
  const dueFirst=pool.filter(p=>{const s=SRS_DB[p.de];return s&&s.due<=Date.now();}).slice(0,3);
  const newItems=pool.filter(p=>!SRS_DB[p.de]).slice(0,5-dueFirst.length);
  const suggest=[...dueFirst,...newItems];
  document.getElementById('dash-suggest').innerHTML=suggest.map((p,i)=>{
    const sTag=getSRSTag(p);
    return `<div class="sug-item" onclick="jumpTo('${sanitize(p.cat)}')">
      <div class="sug-dot" style="background:${CAT_META[p.cat]?.c||'var(--blue)'}"></div>
      <div><div class="sug-de">${sanitize(p.de)} <span class="srs-due-badge" style="${sTag.tag==='due'?'':'background:rgba(79,163,255,.1);color:var(--blue);'}">${sTag.label}</span></div>
      <div class="sug-vi">${sanitize(p.vi)}</div></div>
      <div class="sug-cat">${sanitize(CAT_META[p.cat]?.l||p.cat)}</div>
    </div>`;
  }).join('');

  // ── XP Activity Chart ────────────────────────────────
  let chartSec=document.getElementById('dash-xp-chart-sec');
  if(!chartSec){
    chartSec=document.createElement('div');
    chartSec.id='dash-xp-chart-sec';
    chartSec.className='prog-section';
    const suggest=document.querySelector('.sug-section');
    suggest?.parentNode.insertBefore(chartSec,suggest);
  }
  chartSec.innerHTML=`<div class="prog-title">📈 Hoạt động 7 ngày gần nhất</div>${renderWeekChart()}`;

  // ── Thông báo nhắc học ────────────────────────────────
  let notifSec=document.getElementById('dash-notif-sec');
  if(!notifSec){
    notifSec=document.createElement('div');
    notifSec.id='dash-notif-sec';
    notifSec.className='prog-section';
    chartSec.after(notifSec);
  }
  const notifOn=localStorage.getItem('pd-notif-on')==='1';
  const notifTime=localStorage.getItem('pd-notif-time')||'08:00';
  const notifSupported='Notification' in window;
  notifSec.innerHTML=`<div class="prog-title">🔔 Nhắc học hàng ngày</div>
    <div class="notif-row">
      ${notifSupported?`
        <label class="notif-toggle">
          <input type="checkbox" ${notifOn?'checked':''} onchange="toggleReminder(this.checked)">
          <span class="notif-slider"></span>
        </label>
        <span class="notif-lbl">${notifOn?'Đang bật':'Tắt'}</span>
        ${notifOn?`<input type="time" class="notif-time-inp" value="${notifTime}" onchange="saveReminderTime(this.value)">`:''}`
      :'<span style="color:var(--t3);font-size:.8rem">Trình duyệt không hỗ trợ thông báo</span>'}
    </div>`;

  // ── Chứng chỉ ────────────────────────────────────────
  const curLv=getLevel(GS.xp);
  if(curLv.min>=1000){
    let certSec=document.getElementById('dash-cert-sec');
    if(!certSec){
      certSec=document.createElement('div');
      certSec.id='dash-cert-sec';
      certSec.className='prog-section';
      notifSec.after(certSec);
    }
    certSec.innerHTML=`<div class="prog-title">🎓 Chứng chỉ hoàn thành</div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="flex:1;min-width:160px;font-size:.82rem;color:var(--t2)">Bạn đã đạt <strong>${curLv.emoji} ${curLv.name}</strong> — đủ điều kiện nhận chứng chỉ!</div>
        <button class="ib pri" onclick="generateCertificate()">🎓 Tải chứng chỉ</button>
      </div>`;
  }

  // ── Daily Missions (Feature 2) ─────────────────────────
  let missionsSec=document.getElementById('dash-missions-sec');
  if(!missionsSec){
    missionsSec=document.createElement('div');
    missionsSec.id='dash-missions-sec';
    missionsSec.className='prog-section';
    const sug=document.querySelector('.sug-section');
    if(sug) sug.parentNode.insertBefore(missionsSec,sug);
    else document.getElementById('page-dashboard').appendChild(missionsSec);
  }
  missionsSec.innerHTML=`<div class="prog-title">🎯 Nhiệm vụ hôm nay</div>
    <div id="dash-missions-card">${_renderMissionsCardInner()}</div>`;

  // ── Daily Challenge (Feature 5) ────────────────────────
  let challengeSec=document.getElementById('dash-challenge-sec');
  if(!challengeSec){
    challengeSec=document.createElement('div');
    challengeSec.id='dash-challenge-sec';
    challengeSec.className='prog-section';
    missionsSec.after(challengeSec);
  }
  challengeSec.innerHTML=`<div class="prog-title">🎯 Thử thách hôm nay</div>
    <div class="challenge-card" id="dash-challenge-inner">${_renderChallengeCard()}</div>`;

  // ── Community (Feature 8) ──────────────────────────────
  let commSec=document.getElementById('dash-comm-sec');
  if(!commSec){
    commSec=document.createElement('div');
    commSec.id='dash-comm-sec';
    document.getElementById('page-dashboard').appendChild(commSec);
  }
  commSec.innerHTML=`<div class="comm-section">
    <div class="comm-title">CỘNG ĐỒNG</div>
    <div class="comm-cards">
      <a class="comm-card" href="#" style="--cc:var(--blue)" onclick="event.preventDefault();toast('Link Zalo sẽ sớm có!')">
        <span class="comm-ic">💬</span>
        <div><div class="comm-name">Zalo</div><div class="comm-sub">Nhóm học tiếng Đức Pflege</div></div>
      </a>
      <a class="comm-card" href="#" style="--cc:var(--blue)" onclick="event.preventDefault();toast('Link Facebook sẽ sớm có!')">
        <span class="comm-ic">👥</span>
        <div><div class="comm-name">Facebook</div><div class="comm-sub">Nhóm học tiếng Đức Pflege</div></div>
      </a>
    </div>
  </div>`;
}
function jumpTo(cat, deWord){
  document.querySelectorAll('.nav-it').forEach(i=>i.classList.remove('active'));
  const ni=document.querySelector(`.nav-it[data-page="${cat}"]`);if(ni)ni.classList.add('active');
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+cat).classList.add('active');
  ensurePage(cat);
  if(deWord){
    setTimeout(()=>{
      const allPi=document.querySelectorAll('#page-'+cat+' .pi');
      for(const el of allPi){
        const deEl=el.querySelector('.pi-de');
        if(deEl&&deEl.textContent.trim().startsWith(deWord.trim())){
          el.scrollIntoView({behavior:'smooth',block:'center'});
          el.classList.add('word-highlight');
          setTimeout(()=>el.classList.remove('word-highlight'),2600);
          break;
        }
      }
    },120);
  }
}

// ════════════════════════════════════════════════════════
// SEARCH
// ════════════════════════════════════════════════════════
let _srFocus=-1;
function doSearch(q){
  const dd=document.getElementById('srDrop');
  _srFocus=-1;
  q=q.trim().toLowerCase();
  if(!q){dd.classList.remove('open');return;}
  let pool=flatAll();
  if(_activeTopic!==null){
    const tp=_topics.find(t=>t.key===_activeTopic);
    if(tp){const catKeys=new Set(_dynCats.filter(c=>c.topic_id===tp.id).map(c=>c.key));pool=pool.filter(p=>catKeys.has(p.cat));}
  }
  const res=pool.filter(p=>
    p.de.toLowerCase().includes(q)||
    p.vi.toLowerCase().includes(q)||
    (p.n&&p.n.toLowerCase().includes(q))
  ).slice(0,16);
  const esc2=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  function hl(t){return sanitize(t).replace(new RegExp('('+esc2(q)+')','gi'),'<mark>$1</mark>');}
  function srsTag(de){
    const s=SRS_DB[de];
    if(!s)return '<span class="sr-badge new">Chưa học</span>';
    if(s.due<=Date.now())return '<span class="sr-badge due">Cần ôn</span>';
    return '<span class="sr-badge learned">Đã học</span>';
  }
  if(!res.length){
    dd.innerHTML='<div class="sr-empty">Không tìm thấy kết quả cho "<b>'+sanitize(q)+'</b>"</div>';
    dd.classList.add('open');return;
  }
  progressMission('search3');
  dd.innerHTML=res.map((p,i)=>{
    const catMeta=CAT_META[p.cat]||{ic:'📚',l:p.cat};
    return `<div class="sr-it" data-idx="${i}" data-cat="${sanitize(p.cat)}" data-de="${p.de.replace(/"/g,'&quot;')}"
      onclick="srPick('${sanitize(p.cat)}','${p.de.replace(/'/g,"\\'")}')">
      <div class="sr-it-body">
        <div class="sr-cat">${catMeta.ic} ${sanitize(catMeta.l)}</div>
        <div class="sr-de">${hl(p.de)}</div>
        <div class="sr-vi">${hl(p.vi)}</div>
        ${p.n?`<div class="sr-note">💡 ${hl(p.n)}</div>`:''}
      </div>
      ${srsTag(p.de)}
    </div>`;
  }).join('')+`<div class="sr-footer">${res.length} kết quả · ↑↓ điều hướng · Enter chọn · Esc đóng</div>`;
  dd.classList.add('open');
}
function srPick(cat,de){
  document.getElementById('srDrop').classList.remove('open');
  document.getElementById('searchInput').value='';
  _srFocus=-1;
  jumpTo(cat,de);
}
window.srPick=srPick;
// Keyboard navigation
document.getElementById('searchInput').addEventListener('keydown',e=>{
  const dd=document.getElementById('srDrop');
  const items=dd.querySelectorAll('.sr-it');
  if(!dd.classList.contains('open')||!items.length)return;
  if(e.key==='ArrowDown'){e.preventDefault();_srFocus=Math.min(_srFocus+1,items.length-1);}
  else if(e.key==='ArrowUp'){e.preventDefault();_srFocus=Math.max(_srFocus-1,0);}
  else if(e.key==='Enter'&&_srFocus>=0){e.preventDefault();items[_srFocus].click();return;}
  else if(e.key==='Escape'){dd.classList.remove('open');document.getElementById('searchInput').blur();return;}
  items.forEach((it,i)=>it.classList.toggle('focus',i===_srFocus));
  if(_srFocus>=0)items[_srFocus].scrollIntoView({block:'nearest'});
});
document.addEventListener('click',e=>{if(!e.target.closest('#searchBox'))document.getElementById('srDrop').classList.remove('open');});

// ════════════════════════════════════════════════════════
// GOOGLE EXPORT
// ════════════════════════════════════════════════════════
let _scope='all';
function openGoogleModal(){document.getElementById('googleModal').classList.add('on');}
function closeGoogleModal(){document.getElementById('googleModal').classList.remove('on');}
document.getElementById('googleModal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeGoogleModal();});
function selScope(btn){document.querySelectorAll('.scope-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');_scope=btn.dataset.scope;document.getElementById('gexport-result').innerHTML='';}
function getCats(scope){return scope==='phrases'?PHRASE_CATS:scope==='vocab'?VOCAB_CATS:Object.keys(DATA);}
function doExportDocs(){
  const cats=getCats(_scope),lines=[];
  lines.push('PFLEGEFACHKRAFT DEUTSCH — Từ vựng & giao tiếp y tế');
  lines.push('Xuất: '+new Date().toLocaleDateString('vi-VN')+'\n');
  cats.forEach(cat=>{
    lines.push('\n'+'═'.repeat(38));lines.push(CAT_META[cat].ic+' '+CAT_META[cat].l.toUpperCase());lines.push('═'.repeat(38));
    DATA[cat].forEach(g=>{lines.push('\n▸ '+g.g+'\n'+'─'.repeat(28));g.i.forEach(p=>{lines.push('🇩🇪  '+p.de);lines.push('🇻🇳  '+p.vi);if(p.n)lines.push('💡  '+p.n);lines.push('');});});
  });
  const text=lines.join('\n');window._xt=text;
  navigator.clipboard.writeText(text).catch(()=>{});
  const total=cats.reduce((s,c)=>s+flatCat(c).length,0);
  document.getElementById('gexport-result').innerHTML=`
    <div class="ex-success">
      <div style="color:var(--green);font-size:.81rem;font-weight:600;margin-bottom:.3rem;">✓ Đã copy ${total} mục vào clipboard!</div>
      <ol class="ex-steps"><li>Nhấn <strong>"Mở Google Docs mới"</strong></li><li>Dán: <kbd>Ctrl+V</kbd> hoặc <kbd>⌘V</kbd></li></ol>
      <div style="display:flex;gap:5px;flex-wrap:wrap;">
        <button class="mact" onclick="window.open('https://docs.google.com/document/create','_blank')" style="font-size:.76rem;padding:5px 12px;">📄 Mở Google Docs mới</button>
        <button class="mclose" onclick="navigator.clipboard.writeText(window._xt||'').then(()=>toast('✓ Đã copy lại!'))" style="font-size:.76rem;">📋 Copy lại</button>
      </div>
    </div>`;
}
function doExportSheets(){
  const cats=getCats(_scope);
  const rows=[['Tiếng Đức','Tiếng Việt','Chủ đề','Nhóm','Ghi chú']];
  cats.forEach(cat=>DATA[cat].forEach(g=>g.i.forEach(p=>rows.push([p.de,p.vi,CAT_META[cat].l,g.g,p.n||'']))));
  const csv=rows.map(r=>r.map(c=>{const s=String(c).replace(/"/g,'""');return /[,"\n]/.test(s)?`"${s}"`:s;}).join(',')).join('\r\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;
  a.download='pflegedeutsch_'+_scope+'_'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(url);
  document.getElementById('gexport-result').innerHTML=`
    <div class="ex-success">
      <div style="color:var(--green);font-size:.81rem;font-weight:600;margin-bottom:.3rem;">✓ Đã tải file CSV (${rows.length-1} mục)!</div>
      <ol class="ex-steps"><li>Nhấn <strong>"Mở Google Sheets"</strong></li><li><strong>File → Import → Upload</strong> → kéo file CSV vào</li><li>Chọn <em>Replace spreadsheet</em> → Import</li></ol>
      <button class="mact" onclick="window.open('https://sheets.google.com','_blank')" style="font-size:.76rem;padding:5px 12px;background:linear-gradient(135deg,#0f9d58,#34a853);">📊 Mở Google Sheets</button>
    </div>`;
}

// ════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════
updateXPUI();
renderDashboard();
window.speechSynthesis&&window.speechSynthesis.getVoices();
// Welcome XP — only once per browser session, only for brand-new users
if(!sessionStorage.getItem('_wXP')){
  sessionStorage.setItem('_wXP','1');
  setTimeout(()=>{if(GS.xp===0)addXP(10,'Chào mừng đến PflegeDeutsch V4!');},2000);
}

// ════════════════════════════════════════════════════════
// 🔔 NHẮC HỌC HÀNG NGÀY (Daily Reminder)
// ════════════════════════════════════════════════════════
function checkDailyReminder(){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  if(localStorage.getItem('pd-notif-on')!=='1')return;
  const time=localStorage.getItem('pd-notif-time')||'08:00';
  const now=new Date();
  const [h,m]=time.split(':').map(Number);
  const todayStr=now.toDateString();
  if(localStorage.getItem('pd-notif-last')===todayStr)return;
  const target=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m,0);
  if(now>=target){
    try{
      new Notification('📚 PflegeDeutsch — Đến giờ học!',{
        body:`Duy trì streak ${GS.streak} ngày 🔥 — Hôm nay ôn ${countDue('all')||'các'} thẻ SRS!`,
        icon:'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><text y=%2226%22 font-size=%2228%22>📚</text></svg>'
      });
      localStorage.setItem('pd-notif-last',todayStr);
    }catch(e){}
  }
}
function toggleReminder(on){
  if(on){
    Notification.requestPermission().then(perm=>{
      if(perm==='granted'){
        localStorage.setItem('pd-notif-on','1');
        toast('🔔 Đã bật nhắc học!');
        renderDashboard();
      } else {
        localStorage.setItem('pd-notif-on','0');
        toast('Trình duyệt không cấp quyền thông báo');
        renderDashboard();
      }
    });
  } else {
    localStorage.setItem('pd-notif-on','0');
    toast('🔕 Đã tắt nhắc học');
    renderDashboard();
  }
}
function saveReminderTime(t){
  localStorage.setItem('pd-notif-time',t);
  toast('✓ Đã lưu giờ nhắc: '+t);
}
window.toggleReminder=toggleReminder;
window.saveReminderTime=saveReminderTime;
// Kiểm tra khi tab hiển thị lại
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkDailyReminder();});
// Kiểm tra sau khi app load xong
setTimeout(checkDailyReminder,3000);

// ════════════════════════════════════════════════════════
// 🏆 CHỨNG CHỈ HOÀN THÀNH
// ════════════════════════════════════════════════════════
function checkCertificate(){
  const lv=getLevel(GS.xp);
  if(lv.min>=1000) toast('🎓 Bạn đủ điều kiện nhận chứng chỉ! Xem Dashboard.',4000);
}
function generateCertificate(){
  const lv=getLevel(GS.xp);
  const user=window.sbLive?window._certUser:null;
  const name=user?.user_metadata?.display_name||user?.email?.split('@')[0]||'Học viên';
  const date=new Date().toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
  const w=window.open('','_blank','width=780,height=580');
  if(!w){toast('Trình duyệt chặn cửa sổ mới. Hãy cho phép popup.');return;}
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chứng chỉ PflegeDeutsch</title>
  <style>
    body{margin:0;padding:32px;background:#f0f4ff;font-family:Georgia,serif;color:#1a2340;}
    .cert{background:#fff;border:6px double #2563eb;border-radius:12px;padding:40px 48px;max-width:660px;margin:auto;text-align:center;box-shadow:0 8px 32px rgba(37,99,235,.15);}
    .logo{font-size:2rem;font-weight:900;color:#2563eb;letter-spacing:-.02em;margin-bottom:4px;}
    .cert-title{font-size:.85rem;text-transform:uppercase;letter-spacing:.15em;color:#64748b;margin-bottom:28px;}
    .cert-present{font-size:.9rem;color:#64748b;margin-bottom:6px;}
    .cert-name{font-size:2.1rem;font-weight:700;color:#1e3a8a;border-bottom:2px solid #2563eb;display:inline-block;padding-bottom:6px;margin-bottom:20px;}
    .cert-body{font-size:.95rem;line-height:1.9;color:#334155;margin-bottom:20px;}
    .cert-stats{display:flex;justify-content:center;gap:32px;margin:18px 0;padding:14px;background:#f0f7ff;border-radius:8px;}
    .cert-stat{text-align:center;}
    .cert-stat-n{font-size:1.6rem;font-weight:800;color:#2563eb;}
    .cert-stat-l{font-size:.72rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em;}
    .cert-level{font-size:1.3rem;font-weight:700;color:#7c3aed;margin:12px 0;}
    .cert-date{font-size:.8rem;color:#94a3b8;margin-top:24px;}
    .print-btn{margin-top:20px;padding:10px 28px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:.9rem;cursor:pointer;font-family:sans-serif;}
    @media print{.print-btn{display:none;}}
  </style></head><body>
  <div class="cert">
    <div class="logo">🇩🇪 PflegeDeutsch</div>
    <div class="cert-title">Zertifikat · Chứng nhận hoàn thành</div>
    <div class="cert-present">Chứng nhận rằng</div>
    <div class="cert-name">${name}</div>
    <div class="cert-body">đã hoàn thành chương trình học<br><strong>Tiếng Đức Y tế — PflegeDeutsch V4 Pro</strong></div>
    <div class="cert-stats">
      <div class="cert-stat"><div class="cert-stat-n">${GS.xp}</div><div class="cert-stat-l">XP tích lũy</div></div>
      <div class="cert-stat"><div class="cert-stat-n">${GS.mastered}</div><div class="cert-stat-l">Từ đã thuộc</div></div>
      <div class="cert-stat"><div class="cert-stat-n">${GS.streak}</div><div class="cert-stat-l">Ngày streak</div></div>
    </div>
    <div class="cert-level">${lv.emoji} Cấp độ: ${lv.name}</div>
    <div class="cert-date">Ngày cấp: ${date}</div>
  </div>
  <div style="text-align:center"><button class="print-btn" onclick="window.print()">🖨️ In / Lưu PDF</button></div>
  </body></html>`);
  w.document.close();
}
window.generateCertificate=generateCertificate;

// ════════════════════════════════════════════════════════
// 🌐 I18N — Đa ngôn ngữ UI (VI / DE)
// ════════════════════════════════════════════════════════
const I18N={
  vi:{
    nav_dashboard:'Dashboard',nav_bookmarks:'Yêu thích',nav_lp:'Lộ trình học',
    nav_dialogue:'Hội thoại mẫu',nav_srs:'Ôn tập thông minh',nav_roleplay:'Roleplay AI',
    nav_exercise:'Bài tập',nav_comm:'Giao tiếp',nav_vocab:'Từ vựng',nav_learning:'Học tập',
    dash_title:'Dashboard',dash_sub:'Tiến độ học tập & thành tích của bạn',
    dial_title:'Hội thoại mẫu',dial_sub:'Các đoạn hội thoại thực tế tại bệnh viện — nhấn để xem & nghe',
    srs_title:'Ôn tập thông minh (Spaced Repetition)',srs_sub:'Hệ thống nhắc nhở theo thuật toán SM-2 — ôn đúng lúc, nhớ lâu hơn',
    rp_title:'Roleplay AI',rp_sub:'Luyện tập hội thoại thực tế với AI đóng vai bệnh nhân hoặc đồng nghiệp',
    ex_title:'Bài tập luyện tập',ex_sub:'Chọn loại bài tập để bắt đầu',
    btn_login:'Đăng nhập',btn_logout:'Đăng xuất',btn_register:'Đăng ký',
    streak_lbl:'ngày liên tiếp',total_lbl:'Tổng mục',mastered_lbl:'Đã thuộc',
  },
  de:{
    nav_dashboard:'Übersicht',nav_bookmarks:'Favoriten',nav_lp:'Lernpfad',
    nav_dialogue:'Dialoge',nav_srs:'Wiederholung',nav_roleplay:'KI-Rollenspiel',
    nav_exercise:'Übungen',nav_comm:'Kommunikation',nav_vocab:'Wortschatz',nav_learning:'Lernen',
    dash_title:'Übersicht',dash_sub:'Dein Lernfortschritt & Erfolge',
    dial_title:'Musterdialoge',dial_sub:'Alltagsgespräche im Krankenhaus — anklicken zum Lesen & Hören',
    srs_title:'Intelligentes Wiederholen (SRS)',srs_sub:'SM-2-Algorithmus — zur richtigen Zeit wiederholen, länger behalten',
    rp_title:'KI-Rollenspiel',rp_sub:'Üben mit KI als Patient oder Kollege',
    ex_title:'Übungsaufgaben',ex_sub:'Übungstyp auswählen',
    btn_login:'Anmelden',btn_logout:'Abmelden',btn_register:'Registrieren',
    streak_lbl:'Tage in Folge',total_lbl:'Gesamt',mastered_lbl:'Gelernt',
  }
};
let _lang=localStorage.getItem('pd-lang')||'vi';
function t(k){return(I18N[_lang]&&I18N[_lang][k])||(I18N.vi&&I18N.vi[k])||k;}
function toggleLang(){
  _lang=_lang==='vi'?'de':'vi';
  localStorage.setItem('pd-lang',_lang);
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
  const lb=document.getElementById('lang-btn');
  if(lb)lb.textContent=_lang==='vi'?'🇩🇪 DE':'🇻🇳 VI';
}
window.t=t;window.toggleLang=toggleLang;

// ════════════════════════════════════════════════════════
// 🗺️ LỘTRÌNH HỌC CÁ NHÂN (Learning Path)
// ════════════════════════════════════════════════════════
function calcCatScore(cat){
  const items=flatCat(cat);if(!items.length)return null;
  const now=Date.now(),total=items.length;
  const notStarted=items.filter(p=>!SRS_DB[p.de]).length;
  const weak=items.filter(p=>{const s=SRS_DB[p.de];return s&&s.ease<2.2;}).length;
  const due=items.filter(p=>{const s=SRS_DB[p.de];return s&&s.due<=now;}).length;
  const done=items.filter(p=>{const s=SRS_DB[p.de];return s&&s.due>now;}).length;
  const score=(notStarted*3+weak*2+due*1.5)/total;
  const completion=Math.round(done/total*100);
  return{score,total,notStarted,weak,due,done,completion};
}
// ════════════════════════════════════════════════════════
// 🏥 SƠ ĐỒ CƠ THỂ (Body Diagram)
// ════════════════════════════════════════════════════════
const ART_COLOR={'der':'var(--blue)','die':'#f472b6','das':'var(--teal)'};
const BODY_PARTS=[
  // Đầu & mặt
  {id:'haar',         de:'das Haar',           vi:'Tóc',          cx:100,cy:13, shape:'ellipse',rx:24,ry:9},
  {id:'kopf',         de:'der Kopf',           vi:'Đầu',          cx:100,cy:38, shape:'circle', r:28},
  {id:'auge',         de:'das Auge',           vi:'Mắt',          cx:100,cy:29, shape:'ellipse',rx:14,ry:5,  sym:true,scx:88},
  {id:'nase',         de:'die Nase',           vi:'Mũi',          cx:100,cy:39, shape:'ellipse',rx:5, ry:7},
  {id:'mund',         de:'der Mund',           vi:'Miệng',        cx:100,cy:51, shape:'ellipse',rx:9, ry:5},
  {id:'ohr',          de:'das Ohr',            vi:'Tai',          cx:72, cy:35, shape:'circle', r:7,          sym:true},
  // Cổ & thân
  {id:'hals',         de:'der Hals',           vi:'Cổ',           cx:100,cy:69, shape:'ellipse',rx:11,ry:8},
  {id:'schulter',     de:'die Schulter',       vi:'Vai',          cx:60, cy:84, shape:'ellipse',rx:20,ry:12, sym:true},
  {id:'brust',        de:'die Brust',          vi:'Ngực',         cx:100,cy:110,shape:'ellipse',rx:28,ry:19},
  {id:'bauch',        de:'der Bauch',          vi:'Bụng',         cx:100,cy:148,shape:'ellipse',rx:24,ry:17},
  // Tay
  {id:'arm',          de:'der Arm',            vi:'Cánh tay',     cx:47, cy:122,shape:'ellipse',rx:11,ry:36, sym:true},
  {id:'ellbogen',     de:'der Ellbogen',       vi:'Khuỷu tay',    cx:44, cy:162,shape:'circle', r:10,         sym:true},
  {id:'hand',         de:'die Hand',           vi:'Bàn tay',      cx:45, cy:207,shape:'ellipse',rx:11,ry:14, sym:true},
  // Phần dưới
  {id:'hufte',        de:'die Hüfte',          vi:'Hông',         cx:100,cy:172,shape:'ellipse',rx:28,ry:11},
  {id:'oberschenkel', de:'der Oberschenkel',   vi:'Đùi',          cx:81, cy:214,shape:'ellipse',rx:15,ry:27, sym:true},
  {id:'knie',         de:'das Knie',           vi:'Đầu gối',      cx:81, cy:254,shape:'circle', r:13,         sym:true},
  {id:'unterschenkel',de:'der Unterschenkel',  vi:'Cẳng chân',    cx:81, cy:287,shape:'ellipse',rx:11,ry:22, sym:true},
  {id:'fuss',         de:'der Fuß',            vi:'Bàn chân',     cx:77, cy:330,shape:'ellipse',rx:18,ry:9,  sym:true},
];

let _bdQuizMode=false,_bdQuizPart=null,_bdQuizScore={ok:0,fail:0};

function bdShapeEl(p,cx,extraClass,extraStyle){
  const color=ART_COLOR[p.de.split(' ')[0]]||'var(--blue)';
  const attrs=`class="bd-zone${extraClass?' '+extraClass:''}" data-id="${p.id}" fill="${color}" fill-opacity="0.13" stroke="${color}" stroke-width="1.2" stroke-opacity="0.5" style="cursor:pointer;transition:fill-opacity .15s,stroke-opacity .15s${extraStyle?';'+extraStyle:''}"`;
  return p.shape==='circle'
    ?`<circle ${attrs} cx="${cx}" cy="${p.cy}" r="${p.r}"/>`
    :`<ellipse ${attrs} cx="${cx}" cy="${p.cy}" rx="${p.rx}" ry="${p.ry}"/>`;
}

function renderBodyDiagram(){
  const page=document.getElementById('page-body-diagram');
  if(!page)return;

  // Build SVG zones (left + mirrored right)
  const zones=BODY_PARTS.map(p=>{
    let html=bdShapeEl(p,p.cx,'','');
    if(p.sym) html+=bdShapeEl(p,200-p.cx,'','');
    return html;
  }).join('');

  // Article legend
  const legend=Object.entries(ART_COLOR).map(([art,col])=>
    `<span class="bd-art-chip" style="background:${col}20;color:${col};border:1px solid ${col}40">${art}</span>`
  ).join('');

  page.innerHTML=`
    <div class="ph">
      <div class="pt">🏥 Sơ đồ cơ thể</div>
      <div class="ps">Bấm vào bộ phận để xem từ tiếng Đức · màu sắc theo mạo từ</div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:.5rem">
        <div style="display:flex;gap:6px">${legend}</div>
        <div style="margin-left:auto;display:flex;gap:6px">
          <button class="bd-mode-btn active" id="bd-learn-btn" onclick="setBDMode('learn')">📖 Học</button>
          <button class="bd-mode-btn" id="bd-quiz-btn" onclick="setBDMode('quiz')">🎯 Quiz</button>
        </div>
      </div>
    </div>
    <div id="bd-quiz-bar" style="display:none" class="bd-quiz-bar">
      <div id="bd-quiz-q" style="font-size:.9rem;font-weight:600"></div>
      <div style="display:flex;gap:10px;font-size:.82rem">
        <span id="bd-qok"  style="color:var(--teal)">✓ 0</span>
        <span id="bd-qfail" style="color:var(--red)">✗ 0</span>
      </div>
    </div>
    <div class="bd-layout">
      <div class="bd-svg-wrap">
        <svg id="bd-svg" viewBox="0 0 200 348" xmlns="http://www.w3.org/2000/svg">
          <g fill="var(--s3)" stroke="var(--b2)" stroke-width="1">
            <ellipse cx="100" cy="13" rx="26" ry="11"/>
            <circle cx="100" cy="38" r="28"/>
            <rect x="91" y="63" width="18" height="15" rx="6"/>
            <ellipse cx="60" cy="84" rx="21" ry="12"/><ellipse cx="140" cy="84" rx="21" ry="12"/>
            <rect x="68" y="78" width="64" height="90" rx="10"/>
            <rect x="37" y="78" width="21" height="65" rx="10"/><rect x="142" y="78" width="21" height="65" rx="10"/>
            <rect x="39" y="143" width="17" height="56" rx="8"/><rect x="144" y="143" width="17" height="56" rx="8"/>
            <ellipse cx="47" cy="210" rx="11" ry="14"/><ellipse cx="153" cy="210" rx="11" ry="14"/>
            <rect x="66" y="164" width="68" height="32" rx="8"/>
            <rect x="69" y="192" width="26" height="63" rx="11"/><rect x="105" y="192" width="26" height="63" rx="11"/>
            <ellipse cx="82" cy="258" rx="14" ry="12"/><ellipse cx="118" cy="258" rx="14" ry="12"/>
            <rect x="71" y="268" width="22" height="57" rx="9"/><rect x="107" y="268" width="22" height="57" rx="9"/>
            <ellipse cx="78" cy="333" rx="20" ry="9"/><ellipse cx="122" cy="333" rx="20" ry="9"/>
          </g>
          <g id="bd-zones">${zones}</g>
        </svg>
      </div>
      <div class="bd-panel" id="bd-panel">
        <div class="bd-panel-hint">👆<br>Bấm vào<br>bộ phận</div>
        <div class="bd-word-list">
          ${BODY_PARTS.map(p=>{
            const c=ART_COLOR[p.de.split(' ')[0]]||'var(--blue)';
            return`<div class="bd-wl-item" data-id="${p.id}" onclick="selectBDPart('${p.id}')">
              <span class="bd-wl-dot" style="background:${c}"></span>
              <span class="bd-wl-de">${p.de}</span>
              <span class="bd-wl-vi">${p.vi}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;

  // Event delegation on SVG zones
  document.getElementById('bd-zones').addEventListener('click',e=>{
    const z=e.target.closest('.bd-zone');
    if(!z)return;
    _bdQuizMode?bdQuizCheck(z.dataset.id):selectBDPart(z.dataset.id);
  });
  document.getElementById('bd-zones').addEventListener('mouseover',e=>{
    const z=e.target.closest('.bd-zone');
    if(z)document.querySelectorAll(`.bd-zone[data-id="${z.dataset.id}"]`).forEach(el=>{el.style.fillOpacity='.35';el.style.strokeOpacity='1';});
  });
  document.getElementById('bd-zones').addEventListener('mouseout',e=>{
    const z=e.target.closest('.bd-zone');
    if(z)document.querySelectorAll(`.bd-zone[data-id="${z.dataset.id}"]`).forEach(el=>{
      if(!el.classList.contains('bd-sel')){el.style.fillOpacity='.13';el.style.strokeOpacity='.5';}
    });
  });
}

function selectBDPart(id){
  const p=BODY_PARTS.find(x=>x.id===id);if(!p)return;
  const color=ART_COLOR[p.de.split(' ')[0]]||'var(--blue)';
  const art=p.de.split(' ')[0];
  const bare=p.de.split(' ').slice(1).join(' ');
  // Highlight zones
  document.querySelectorAll('.bd-zone').forEach(z=>{z.classList.remove('bd-sel');z.style.fillOpacity='.13';z.style.strokeOpacity='.5';});
  document.querySelectorAll(`.bd-zone[data-id="${id}"]`).forEach(z=>{z.classList.add('bd-sel');z.style.fillOpacity='.4';z.style.strokeOpacity='1';z.style.strokeWidth='2';});
  // Highlight word list
  document.querySelectorAll('.bd-wl-item').forEach(el=>el.classList.toggle('active',el.dataset.id===id));
  // Check SRS
  const inSRS=!!(SRS_DB[p.de]||SRS_DB[bare]);
  const panel=document.getElementById('bd-panel');if(!panel)return;
  panel.innerHTML=`
    <div class="bd-info-card" style="border-color:${color}40">
      <div class="bd-info-art" style="background:${color}20;color:${color}">${art}</div>
      <div class="bd-info-de" style="color:${color}">${bare}</div>
      <div class="bd-info-vi">${p.vi}</div>
      <div class="bd-info-btns">
        <button class="bd-btn-speak" onclick="speakDE('${bare}')">🔊 Nghe</button>
        <button class="bd-btn-srs ${inSRS?'in-srs':''}" onclick="bdAddSRS('${p.id}')">
          ${inSRS?'✅ Có trong SRS':'➕ Thêm SRS'}
        </button>
      </div>
      <div class="bd-art-hint">
        <span style="background:${ART_COLOR['der']}20;color:${ART_COLOR['der']};border:1px solid ${ART_COLOR['der']}30" class="bd-art-chip">der</span> =nam &nbsp;
        <span style="background:${ART_COLOR['die']}20;color:${ART_COLOR['die']};border:1px solid ${ART_COLOR['die']}30" class="bd-art-chip">die</span> =nữ &nbsp;
        <span style="background:${ART_COLOR['das']}20;color:${ART_COLOR['das']};border:1px solid ${ART_COLOR['das']}30" class="bd-art-chip">das</span> =trung
      </div>
    </div>
    <div class="bd-word-list">
      ${BODY_PARTS.map(q=>{const c=ART_COLOR[q.de.split(' ')[0]]||'var(--blue)';
        return`<div class="bd-wl-item${q.id===id?' active':''}" data-id="${q.id}" onclick="selectBDPart('${q.id}')">
          <span class="bd-wl-dot" style="background:${c}"></span>
          <span class="bd-wl-de">${q.de}</span>
          <span class="bd-wl-vi">${q.vi}</span>
        </div>`;
      }).join('')}
    </div>`;
}

function bdAddSRS(id){
  const p=BODY_PARTS.find(x=>x.id===id);if(!p)return;
  const key=p.de;
  if(!SRS_DB[key]){
    SRS_DB[key]={interval:1,ease:2.5,reps:0,due:Date.now()};
    saveSRS();toast('✅ Đã thêm "'+p.de+'" vào SRS');
  }else{toast('Từ này đã có trong SRS!');}
  selectBDPart(id);
}

function setBDMode(mode){
  _bdQuizMode=mode==='quiz';
  document.getElementById('bd-learn-btn')?.classList.toggle('active',!_bdQuizMode);
  document.getElementById('bd-quiz-btn')?.classList.toggle('active',_bdQuizMode);
  const bar=document.getElementById('bd-quiz-bar');
  if(bar)bar.style.display=_bdQuizMode?'flex':'none';
  document.querySelectorAll('.bd-zone').forEach(z=>{z.classList.remove('bd-sel','bd-ok','bd-fail');z.style.fillOpacity='.13';z.style.strokeOpacity='.5';z.style.strokeWidth='1.2';});
  if(_bdQuizMode){_bdQuizScore={ok:0,fail:0};bdNextQuiz();}
}

function bdNextQuiz(){
  _bdQuizPart=BODY_PARTS[Math.floor(Math.random()*BODY_PARTS.length)];
  const q=document.getElementById('bd-quiz-q');
  if(q)q.innerHTML=`Bấm vào: <b style="color:${ART_COLOR[_bdQuizPart.de.split(' ')[0]]||'var(--blue)'}">${_bdQuizPart.de}</b> <span style="color:var(--t3)">(${_bdQuizPart.vi})</span>`;
  document.querySelectorAll('.bd-zone').forEach(z=>{z.classList.remove('bd-ok','bd-fail');z.style.fillOpacity='.13';z.style.strokeOpacity='.5';});
}

function bdQuizCheck(id){
  if(!_bdQuizPart)return;
  const correct=id===_bdQuizPart.id;
  if(correct){
    _bdQuizScore.ok++;
    document.querySelectorAll(`.bd-zone[data-id="${id}"]`).forEach(z=>{z.style.fillOpacity='.5';z.style.stroke='var(--teal)';z.style.strokeWidth='2.5';});
    speakDE(_bdQuizPart.de.split(' ').slice(1).join(' '));
    setTimeout(()=>{document.querySelectorAll('.bd-zone').forEach(z=>{z.style.stroke='';z.style.strokeWidth='1.2';});bdNextQuiz();},700);
  }else{
    _bdQuizScore.fail++;
    document.querySelectorAll(`.bd-zone[data-id="${id}"]`).forEach(z=>{z.style.fillOpacity='.4';z.style.stroke='var(--red)';z.style.strokeWidth='2';});
    document.querySelectorAll(`.bd-zone[data-id="${_bdQuizPart.id}"]`).forEach(z=>{z.style.fillOpacity='.5';z.style.stroke='var(--teal)';z.style.strokeWidth='2.5';});
    setTimeout(()=>{document.querySelectorAll('.bd-zone').forEach(z=>{z.style.stroke='';z.style.strokeWidth='1.2';});bdNextQuiz();},1100);
  }
  const ok=document.getElementById('bd-qok'),fail=document.getElementById('bd-qfail');
  if(ok)ok.textContent='✓ '+_bdQuizScore.ok;
  if(fail)fail.textContent='✗ '+_bdQuizScore.fail;
}
window.selectBDPart=selectBDPart;window.bdAddSRS=bdAddSRS;window.setBDMode=setBDMode;

function renderLearningPath(){
  const el=document.getElementById('page-learning-path');if(!el)return;
  const cats=Object.keys(CAT_META);
  const rows=cats.map(cat=>{const s=calcCatScore(cat);return s?{cat,meta:CAT_META[cat],...s}:null;})
    .filter(Boolean).sort((a,b)=>b.score-a.score);
  if(!rows.length){
    el.innerHTML=`<div class="ph"><div class="pt">🗺️ Lộ trình học cá nhân</div></div><div style="text-align:center;padding:3rem;color:var(--t2)">Chưa có dữ liệu. Hãy thêm từ vựng qua Admin.</div>`;
    return;
  }
  el.innerHTML=`
    <div class="ph"><div class="pt">🗺️ Lộ trình học cá nhân</div><div class="ps">Thứ tự đề xuất dựa trên dữ liệu SRS của bạn — ưu tiên những mục còn yếu</div></div>
    <div class="lp-list">
      ${rows.map((c,i)=>`
        <div class="lp-item" onclick="navTo('${c.cat}')">
          <div class="lp-rank ${c.completion===100?'lp-rank-done':''}">${c.completion===100?'✓':i+1}</div>
          <div class="lp-ic">${c.meta.ic}</div>
          <div class="lp-info">
            <div class="lp-name">${sanitize(c.meta.l)}</div>
            <div class="lp-tags">
              ${c.notStarted>0?`<span class="lp-tag lp-new">${c.notStarted} chưa học</span>`:''}
              ${c.weak>0?`<span class="lp-tag lp-weak">${c.weak} điểm yếu</span>`:''}
              ${c.due>0?`<span class="lp-tag lp-due">${c.due} cần ôn</span>`:''}
              ${c.completion===100?`<span class="lp-tag lp-ok">✓ Hoàn thành</span>`:''}
            </div>
            <div class="lp-bar-wrap"><div class="lp-bar-fill" style="width:${c.completion}%;background:${c.meta.c||'var(--blue)'}"></div></div>
          </div>
          <div class="lp-pct${c.completion===100?' lp-pct-done':''}">${c.completion}%</div>
        </div>`).join('')}
    </div>`;
}
window.renderLearningPath=renderLearningPath;

// ════════════════════════════════════════════════════════
// 🎬 VIDEO BÀI HỌC (Category Videos)
// ════════════════════════════════════════════════════════
function getCatVideos(){try{return JSON.parse(localStorage.getItem('pd-cat-videos')||'{}');}catch(e){return {};}}
function setCatVideo(cat,url){const v=getCatVideos();if(url)v[cat]=url;else delete v[cat];localStorage.setItem('pd-cat-videos',JSON.stringify(v));}
function renderCatVideo(cat){
  const url=(getCatVideos())[cat];
  const editBtn=`<button class="cv-edit-btn" onclick="openVideoEditor('${sanitize(cat)}');event.stopPropagation()" title="Cài/sửa video">⚙️</button>`;
  if(!url){
    return`<div class="cat-video-empty">
      <span>🎬 Chưa có video bài học</span>
      <button class="cv-add-btn" onclick="openVideoEditor('${sanitize(cat)}')">+ Cài video</button>
    </div>`;
  }
  const m=url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
  if(!m)return`<div class="cat-video-empty"><span>⚠️ URL không hợp lệ</span>${editBtn}</div>`;
  const vid=m[1];
  return`<div class="cat-video-wrap">
    <div class="cat-video-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.cvt').textContent=this.nextElementSibling.style.display==='none'?'▼':'▲'">
      <span>▶️ Video bài học</span>
      <div style="display:flex;align-items:center;gap:8px">${editBtn}<span class="cvt">▼</span></div>
    </div>
    <div class="cat-video-body" style="display:none">
      <div class="cat-video-container">
        <iframe src="https://www.youtube.com/embed/${vid}" frameborder="0" allowfullscreen allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"></iframe>
      </div>
    </div>
  </div>`;
}
function openVideoEditor(cat){
  document.getElementById('video-overlay')?.remove();
  const current=(getCatVideos())[cat]||'';
  const meta=CAT_META[cat]||{ic:'📚',l:cat};
  const ov=document.createElement('div');
  ov.id='video-overlay';
  ov.className='overlay on';
  ov.innerHTML=`
    <div class="mbox" style="max-width:420px;width:100%">
      <div style="font-weight:700;font-size:1rem;margin-bottom:1rem">🎬 Cài video — ${sanitize(meta.ic)} ${sanitize(meta.l)}</div>
      <label style="font-size:.78rem;color:var(--t2);display:block;margin-bottom:4px">Dán link YouTube:</label>
      <input id="video-url-inp" class="auth-inp" placeholder="https://youtube.com/watch?v=..." value="${sanitize(current)}"
        style="width:100%;box-sizing:border-box;margin-bottom:.3rem">
      <div style="font-size:.7rem;color:var(--t3);margin-bottom:1rem">Hỗ trợ: youtube.com/watch?v=… · youtu.be/… · /embed/…</div>
      <div style="display:flex;gap:8px">
        <button class="auth-submit-btn" style="flex:1" onclick="saveVideoUI('${sanitize(cat)}')">💾 Lưu</button>
        ${current?`<button class="auth-submit-btn" style="flex:1;background:rgba(255,77,77,.15);color:var(--red);border-color:var(--red)" onclick="removeVideoUI('${sanitize(cat)}')">🗑️ Xóa</button>`:''}
        <button class="auth-submit-btn" style="flex:1;background:var(--s3);color:var(--t2)" onclick="document.getElementById('video-overlay').remove()">Huỷ</button>
      </div>
    </div>`;
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
  document.body.appendChild(ov);
  setTimeout(()=>document.getElementById('video-url-inp')?.focus(),60);
}
function saveVideoUI(cat){
  const inp=document.getElementById('video-url-inp');
  const url=inp?inp.value.trim():'';
  if(url&&!url.match(/(?:youtube\.com|youtu\.be)/)){
    inp.style.borderColor='var(--red)';inp.focus();return;
  }
  setCatVideo(cat,url);
  document.getElementById('video-overlay')?.remove();
  // Re-render phần video trong trang danh mục
  const page=document.getElementById('page-'+cat);
  if(page){
    const old=page.querySelector('.cat-video-wrap,.cat-video-empty');
    const tmp=document.createElement('div');
    tmp.innerHTML=renderCatVideo(cat);
    const newEl=tmp.firstElementChild;
    if(old&&newEl)old.replaceWith(newEl);
    else if(newEl){const ph=page.querySelector('.ph');if(ph)ph.after(newEl);}
  }
  toast(url?'✅ Đã lưu video':'🗑️ Đã xóa video');
}
function removeVideoUI(cat){
  setCatVideo(cat,'');
  document.getElementById('video-overlay')?.remove();
  const page=document.getElementById('page-'+cat);
  if(page){
    const old=page.querySelector('.cat-video-wrap,.cat-video-empty');
    const tmp=document.createElement('div');
    tmp.innerHTML=renderCatVideo(cat);
    const newEl=tmp.firstElementChild;
    if(old&&newEl)old.replaceWith(newEl);
  }
  toast('🗑️ Đã xóa video');
}
window.getCatVideos=getCatVideos;window.setCatVideo=setCatVideo;window.renderCatVideo=renderCatVideo;
window.openVideoEditor=openVideoEditor;window.saveVideoUI=saveVideoUI;window.removeVideoUI=removeVideoUI;

// ════════════════════════════════════════════════════════
// 📝 MNEMONIC — Ghi nhớ cá nhân
// ════════════════════════════════════════════════════════
function getMemos(){try{return JSON.parse(localStorage.getItem('pd-memos')||'{}');}catch(e){return{};}}
function saveMemo(de,note,img){
  const m=getMemos();
  if(note||img)m[de]={note:note||'',img:img||''};else delete m[de];
  localStorage.setItem('pd-memos',JSON.stringify(m));
}
function renderMemoSection(de){
  const memo=(getMemos())[de]||{};
  return`<div class="memo-section">
    ${memo.img?`<img class="memo-img" src="${sanitize(memo.img)}" alt="" onerror="this.style.display='none'">`:''}
    ${memo.note?`<div class="memo-note">${sanitize(memo.note)}</div>`:''}
    <button class="memo-btn" onclick="openMemoEditor('${esc(de)}');event.stopPropagation()">${memo.note||memo.img?'✏️ Sửa ghi nhớ':'➕ Thêm ghi nhớ'}</button>
  </div>`;
}
function openMemoEditor(de){
  document.getElementById('memo-overlay')?.remove();
  const memo=(getMemos())[de]||{};
  const ov=document.createElement('div');
  ov.id='memo-overlay';ov.className='overlay on';
  ov.innerHTML=`<div class="mbox" style="max-width:420px">
    <div class="mbox-title">📝 Ghi nhớ cá nhân</div>
    <div class="mbox-sub" style="font-family:var(--serif);font-size:1rem;color:var(--tx)">${sanitize(de)}</div>
    <div class="auth-field">
      <label class="auth-lbl">Ghi chú / Mnemonic</label>
      <textarea class="auth-inp" id="m-note" rows="3" placeholder="Ví dụ: der Patient → bệnh nhân nam, nhớ bằng cách...">${sanitize(memo.note||'')}</textarea>
    </div>
    <div class="auth-field">
      <label class="auth-lbl">URL ảnh minh họa (tuỳ chọn)</label>
      <input class="auth-inp" id="m-img" type="url" placeholder="https://..." value="${sanitize(memo.img||'')}">
    </div>
    <div style="display:flex;gap:8px;margin-top:.5rem">
      <button class="auth-submit-btn" style="flex:1" onclick="saveMemoUI('${esc(de)}')">💾 Lưu</button>
      ${memo.note||memo.img?`<button class="mclose" style="color:var(--red)" onclick="deleteMemoUI('${esc(de)}')">🗑️</button>`:''}
      <button class="mclose" onclick="document.getElementById('memo-overlay').remove()">Hủy</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
}
function saveMemoUI(de){
  const note=document.getElementById('m-note')?.value.trim()||'';
  const img=document.getElementById('m-img')?.value.trim()||'';
  saveMemo(de,note,img);
  document.getElementById('memo-overlay')?.remove();
  renderSRSCard();toast('✓ Đã lưu ghi nhớ');
}
function deleteMemoUI(de){
  saveMemo(de,'','');
  document.getElementById('memo-overlay')?.remove();
  renderSRSCard();toast('Đã xóa ghi nhớ');
}
window.getMemos=getMemos;window.saveMemo=saveMemo;window.renderMemoSection=renderMemoSection;
window.openMemoEditor=openMemoEditor;window.saveMemoUI=saveMemoUI;window.deleteMemoUI=deleteMemoUI;

// ════════════════════════════════════════════════════════
// 🔠 CONJUGATION TABLE — Bảng chia động từ Đức
// ════════════════════════════════════════════════════════
const CONJ_IRR={
  sein:{pr:['bin','bist','ist','sind','seid','sind'],pt:['war','warst','war','waren','wart','waren'],aux:'sein',pp:'gewesen'},
  haben:{pr:['habe','hast','hat','haben','habt','haben'],pt:['hatte','hattest','hatte','hatten','hattet','hatten'],aux:'haben',pp:'gehabt'},
  werden:{pr:['werde','wirst','wird','werden','werdet','werden'],pt:['wurde','wurdest','wurde','wurden','wurdet','wurden'],aux:'sein',pp:'geworden'},
  gehen:{pr:['gehe','gehst','geht','gehen','geht','gehen'],pt:['ging','gingst','ging','gingen','gingt','gingen'],aux:'sein',pp:'gegangen'},
  kommen:{pr:['komme','kommst','kommt','kommen','kommt','kommen'],pt:['kam','kamst','kam','kamen','kamt','kamen'],aux:'sein',pp:'gekommen'},
  können:{pr:['kann','kannst','kann','können','könnt','können'],pt:['konnte','konntest','konnte','konnten','konntet','konnten'],aux:'haben',pp:'gekonnt'},
  müssen:{pr:['muss','musst','muss','müssen','müsst','müssen'],pt:['musste','musstest','musste','mussten','musstet','mussten'],aux:'haben',pp:'gemusst'},
  dürfen:{pr:['darf','darfst','darf','dürfen','dürft','dürfen'],pt:['durfte','durftest','durfte','durften','durftet','durften'],aux:'haben',pp:'gedurft'},
  sollen:{pr:['soll','sollst','soll','sollen','sollt','sollen'],pt:['sollte','solltest','sollte','sollten','solltet','sollten'],aux:'haben',pp:'gesollt'},
  wollen:{pr:['will','willst','will','wollen','wollt','wollen'],pt:['wollte','wolltest','wollte','wollten','wolltet','wollten'],aux:'haben',pp:'gewollt'},
  wissen:{pr:['weiß','weißt','weiß','wissen','wisst','wissen'],pt:['wusste','wusstest','wusste','wussten','wusstet','wussten'],aux:'haben',pp:'gewusst'},
  nehmen:{pr:['nehme','nimmst','nimmt','nehmen','nehmt','nehmen'],pt:['nahm','nahmst','nahm','nahmen','nahmt','nahmen'],aux:'haben',pp:'genommen'},
  geben:{pr:['gebe','gibst','gibt','geben','gebt','geben'],pt:['gab','gabst','gab','gaben','gabt','gaben'],aux:'haben',pp:'gegeben'},
  sehen:{pr:['sehe','siehst','sieht','sehen','seht','sehen'],pt:['sah','sahst','sah','sahen','saht','sahen'],aux:'haben',pp:'gesehen'},
  sprechen:{pr:['spreche','sprichst','spricht','sprechen','sprecht','sprechen'],pt:['sprach','sprachst','sprach','sprachen','spracht','sprachen'],aux:'haben',pp:'gesprochen'},
  helfen:{pr:['helfe','hilfst','hilft','helfen','helft','helfen'],pt:['half','halfst','half','halfen','halft','halfen'],aux:'haben',pp:'geholfen'},
  schreiben:{pr:['schreibe','schreibst','schreibt','schreiben','schreibt','schreiben'],pt:['schrieb','schriebst','schrieb','schrieben','schriebt','schrieben'],aux:'haben',pp:'geschrieben'},
  lesen:{pr:['lese','liest','liest','lesen','lest','lesen'],pt:['las','last','las','lasen','last','lasen'],aux:'haben',pp:'gelesen'},
  fahren:{pr:['fahre','fährst','fährt','fahren','fahrt','fahren'],pt:['fuhr','fuhrst','fuhr','fuhren','fuhrt','fuhren'],aux:'sein',pp:'gefahren'},
  laufen:{pr:['laufe','läufst','läuft','laufen','lauft','laufen'],pt:['lief','liefst','lief','liefen','lieft','liefen'],aux:'sein',pp:'gelaufen'},
  liegen:{pr:['liege','liegst','liegt','liegen','liegt','liegen'],pt:['lag','lagst','lag','lagen','lagt','lagen'],aux:'haben',pp:'gelegen'},
  stehen:{pr:['stehe','stehst','steht','stehen','steht','stehen'],pt:['stand','standst','stand','standen','standet','standen'],aux:'haben',pp:'gestanden'},
  messen:{pr:['messe','misst','misst','messen','messt','messen'],pt:['maß','maßt','maß','maßen','maßt','maßen'],aux:'haben',pp:'gemessen'},
  leiden:{pr:['leide','leidest','leidet','leiden','leidet','leiden'],pt:['litt','littest','litt','litten','littet','litten'],aux:'haben',pp:'gelitten'},
  sterben:{pr:['sterbe','stirbst','stirbt','sterben','sterbt','sterben'],pt:['starb','starbst','starb','starben','starbt','starben'],aux:'sein',pp:'gestorben'},
  bringen:{pr:['bringe','bringst','bringt','bringen','bringt','bringen'],pt:['brachte','brachtest','brachte','brachten','brachtet','brachten'],aux:'haben',pp:'gebracht'},
  denken:{pr:['denke','denkst','denkt','denken','denkt','denken'],pt:['dachte','dachtest','dachte','dachten','dachtet','dachten'],aux:'haben',pp:'gedacht'},
  kennen:{pr:['kenne','kennst','kennt','kennen','kennt','kennen'],pt:['kannte','kanntest','kannte','kannten','kanntet','kannten'],aux:'haben',pp:'gekannt'},
  pflegen:{pr:['pflege','pflegst','pflegt','pflegen','pflegt','pflegen'],pt:['pflegte','pflegtest','pflegte','pflegten','pflegtet','pflegten'],aux:'haben',pp:'gepflegt'},
  atmen:{pr:['atme','atmest','atmet','atmen','atmet','atmen'],pt:['atmete','atmetest','atmete','atmeten','atmetet','atmeten'],aux:'haben',pp:'geatmet'},
  waschen:{pr:['wasche','wäschst','wäscht','waschen','wascht','waschen'],pt:['wusch','wuschst','wusch','wuschen','wuscht','wuschen'],aux:'haben',pp:'gewaschen'},
  trinken:{pr:['trinke','trinkst','trinkt','trinken','trinkt','trinken'],pt:['trank','trankst','trank','tranken','trankt','tranken'],aux:'haben',pp:'getrunken'},
  essen:{pr:['esse','isst','isst','essen','esst','essen'],pt:['aß','aßt','aß','aßen','aßt','aßen'],aux:'haben',pp:'gegessen'},
  schlafen:{pr:['schlafe','schläfst','schläft','schlafen','schlaft','schlafen'],pt:['schlief','schliefst','schlief','schliefen','schlieft','schliefen'],aux:'haben',pp:'geschlafen'},
};
const PRON=['ich','du','er/sie','wir','ihr','sie/Sie'];
function conjugateVerb(inf){
  const lo=inf.toLowerCase().replace(/[,\s].*/,'');
  if(CONJ_IRR[lo]){
    const c=CONJ_IRR[lo];
    const auxForms=['habe','hast','hat','haben','habt','haben'];
    const auxSein=['bin','bist','ist','sind','seid','sind'];
    const auxArr=c.aux==='sein'?auxSein:auxForms;
    return{inf:lo,pres:c.pr,prät:c.pt,perf:auxArr.map(a=>`${a} ${c.pp}`),reg:false};
  }
  if(!lo.endsWith('en')&&!lo.endsWith('eln')&&!lo.endsWith('ern'))return null;
  const stem=lo.endsWith('eln')||lo.endsWith('ern')?lo.slice(0,-3):lo.slice(0,-2);
  const noGe=/^(be|er|ver|ent|ge|zer|emp|miss)/.test(stem);
  const pp=noGe?stem+'t':'ge'+stem+'t';
  return{
    inf:lo,reg:true,
    pres:[stem+'e',stem+'st',stem+'t',stem+'en',stem+'t',stem+'en'],
    prät:[stem+'te',stem+'test',stem+'te',stem+'ten',stem+'tet',stem+'ten'],
    perf:['habe','hast','hat','haben','habt','haben'].map(a=>`${a} ${pp}`)
  };
}
function showConjugation(word){
  const r=conjugateVerb(word);
  if(!r){toast(`"${word}" — không tìm thấy dạng chia`);return;}
  document.getElementById('conj-popup')?.remove();
  const pop=document.createElement('div');
  pop.id='conj-popup';pop.className='overlay on';
  pop.innerHTML=`<div class="mbox" style="max-width:560px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <div>
        <div class="mbox-title">🔠 ${sanitize(r.inf)}</div>
        <div style="font-size:.7rem;color:var(--t3)">${r.reg?'Động từ quy tắc (tự động chia)':'Động từ bất quy tắc'}</div>
      </div>
      <button class="mclose" onclick="document.getElementById('conj-popup').remove()">✕</button>
    </div>
    <div class="conj-table-wrap">
      <table class="conj-table">
        <thead><tr><th>Đại từ</th><th>Präsens</th><th>Präteritum</th><th>Perfekt</th></tr></thead>
        <tbody>${PRON.map((p,i)=>`<tr${i%2?'':' class="conj-alt"'}><td class="conj-pron">${p}</td><td>${sanitize(r.pres[i])}</td><td>${sanitize(r.prät[i])}</td><td class="conj-perf">${sanitize(r.perf[i])}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <div style="margin-top:.7rem;display:flex;gap:8px;justify-content:flex-end">
      <button class="srs-speak-btn" onclick="speakDE('${esc(r.inf)}')">🔊 Nghe</button>
    </div>
  </div>`;
  document.body.appendChild(pop);
  pop.addEventListener('click',e=>{if(e.target===pop)pop.remove();});
}
window.showConjugation=showConjugation;

// ════════════════════════════════════════════════════════
// 🔴 LIVE DATA — Supabase Realtime (đồng bộ với admin.html)
// ════════════════════════════════════════════════════════
(function liveDataLayer(){
  const URL = window.SUPABASE_URL, KEY = window.SUPABASE_ANON_KEY;
  if(!URL || !KEY || URL.includes('YOUR-PROJECT-REF') || KEY.includes('YOUR-ANON')){
    console.info('[live] Supabase chưa cấu hình — dùng dữ liệu mặc định trong index.html');
    return;
  }
  if(!window.supabase){
    console.warn('[live] supabase-js chưa load');
    return;
  }
  const sb = window.supabase.createClient(URL, KEY, {
    realtime: { params: { eventsPerSecond: 10 } },
    auth: { flowType: 'pkce', autoRefreshToken: true, persistSession: true }
  });
  window.sbLive = sb;

  // ════════════════════════════════════════════════════════
  // AUTH — Đăng nhập / Đăng ký / Tiến độ thành viên
  // ════════════════════════════════════════════════════════
  let _currentUser = null;
  let _cloudSaveTimer = null;
  let _loginAttempts = 0, _loginLockUntil = 0;

  // Debounced cloud save (2s after last change)
  function scheduleCloudSave(){
    clearTimeout(_cloudSaveTimer);
    _cloudSaveTimer = setTimeout(pushProgress, 2000);
  }
  window._scheduleCloudSave = scheduleCloudSave;

  async function pushProgress(){
    if(!_currentUser) return;
    const payload = {
      user_id: _currentUser.id,
      srs_db: SRS_DB,
      game_state: {...GS, bookmarks: [..._bookmarks]},
      updated_at: new Date().toISOString()
    };
    const {error} = await sb.from('user_progress').upsert(payload, {onConflict:'user_id'});
    if(error){
      console.error('[auth] pushProgress failed:', error.message, error.details||'');
      // Nếu lỗi do thiếu cột — nhắc user chạy migration SQL
      if(error.message && error.message.includes('column')){
        console.error('[auth] ⚠️ Bảng user_progress thiếu cột. Hãy chạy file supabase-progress-migration.sql trong Supabase SQL Editor!');
      }
    }
  }

  async function pullProgress(){
    if(!_currentUser) return;
    const {data,error} = await sb.from('user_progress')
      .select('*').eq('user_id',_currentUser.id).single();
    if(error && error.code!=='PGRST116'){
      console.warn('[auth] pullProgress error:', error.message); return;
    }
    if(data){
      if(data.srs_db && typeof data.srs_db==='object' && Object.keys(data.srs_db).length){
        SRS_DB = data.srs_db;
        try{localStorage.setItem('srs_db',JSON.stringify(SRS_DB));}catch(e){}
      }
      if(data.game_state && typeof data.game_state==='object' && Object.keys(data.game_state).length){
        const {bookmarks: bm, ...gsData} = data.game_state;
        Object.assign(GS, gsData);
        if(Array.isArray(bm) && bm.length){
          _bookmarks = new Set(bm);
          saveBookmarks();
          updateBmBadge();
        }
      }
      updateXPUI();
      rerenderActive();
    }
  }

  // ── UI helpers ──────────────────────────────────────────
  function getAvatarColor(email){
    let h=0; for(let i=0;i<email.length;i++) h=(h*31+email.charCodeAt(i))&0xffff;
    const colors=['#4fa3ff','#9f6ef5','#2fd17a','#ff8533','#f06090','#25cba8','#f0c040'];
    return colors[h%colors.length];
  }

  function renderAuthUI(user){
    _currentUser = user;
    window._certUser = user; // expose for generateCertificate()
    const el = document.getElementById('auth-area');
    if(!el) return;
    if(user){
      const email = user.email||'';
      const name = user.user_metadata?.display_name || email.split('@')[0];
      const initials = name.slice(0,2).toUpperCase();
      const color = getAvatarColor(email);
      el.innerHTML=`
        <div class="auth-user-wrap">
          <div class="auth-user" onclick="toggleUserMenu(event)">
            <div class="auth-avatar" style="background:${color}">${initials}</div>
            <span class="auth-uname">${name}</span>
            <span class="auth-chevron">▾</span>
          </div>
          <div class="auth-drop" id="auth-drop" style="display:none">
            <div class="auth-drop-hdr">
              <div class="auth-drop-av" style="background:${color}">${initials}</div>
              <div><div class="auth-drop-name">${name}</div><div class="auth-drop-email">${email}</div></div>
            </div>
            <div class="auth-drop-div"></div>
            <div class="auth-drop-it" onclick="navTo('dashboard');toggleUserMenu()">📊 Dashboard của tôi</div>
            <div class="auth-drop-it" onclick="navTo('srs');toggleUserMenu()">🔁 Ôn tập SRS</div>
            <div class="auth-drop-div"></div>
            <div class="auth-drop-it auth-drop-out" onclick="doSignOut()">🚪 Đăng xuất</div>
          </div>
        </div>`;
    } else {
      el.innerHTML=`<button class="auth-login-btn" onclick="openAuthModal()">👤 Đăng nhập</button>`;
    }
  }

  // ── Global functions exposed to HTML onclick ─────────────
  window.openAuthModal = function(tab){
    const m=document.getElementById('authModal');
    if(m){ m.classList.add('on'); switchAuthTab(tab||'login'); }
  };
  window.closeAuthModal = function(){
    const m=document.getElementById('authModal');
    if(m) m.classList.remove('on');
  };
  window.switchAuthTab = function(tab){
    document.getElementById('auth-tab-login').classList.toggle('active',tab==='login');
    document.getElementById('auth-tab-register').classList.toggle('active',tab==='register');
    document.getElementById('auth-form-login').style.display  = tab==='login'?'block':'none';
    document.getElementById('auth-form-register').style.display = tab==='register'?'block':'none';
    const err=document.getElementById('auth-err');
    err.textContent=''; err.className='auth-err';
    const btn=document.getElementById('auth-action-btn');
    btn.textContent = tab==='login'?'Đăng nhập':'Tạo tài khoản';
    btn.onclick     = tab==='login'?window.doLogin:window.doRegister;
    const sw=document.getElementById('auth-switch');
    sw.innerHTML = tab==='login'
      ? 'Chưa có tài khoản? <span onclick="switchAuthTab(\'register\')">Đăng ký ngay</span>'
      : 'Đã có tài khoản? <span onclick="switchAuthTab(\'login\')">Đăng nhập</span>';
  };
  window.doLogin = async function(){
    const email=document.getElementById('auth-email').value.trim();
    const pass=document.getElementById('auth-pass').value;
    const err=document.getElementById('auth-err');
    // Rate limiting: khóa 60s sau 5 lần thất bại
    const now=Date.now();
    if(now<_loginLockUntil){
      const secs=Math.ceil((_loginLockUntil-now)/1000);
      err.textContent=`Quá nhiều lần thất bại. Vui lòng đợi ${secs} giây.`;return;
    }
    if(!email||!pass){err.textContent='Vui lòng nhập email và mật khẩu.';return;}
    const btn=document.getElementById('auth-action-btn');
    btn.disabled=true; btn.textContent='Đang đăng nhập...';
    const {error} = await sb.auth.signInWithPassword({email,password:pass});
    btn.disabled=false; btn.textContent='Đăng nhập';
    if(error){
      _loginAttempts++;
      if(_loginAttempts>=5){_loginLockUntil=Date.now()+60000;_loginAttempts=0;}
      err.textContent=error.message==='Invalid login credentials'?'Email hoặc mật khẩu không đúng.':error.message;
    } else {
      _loginAttempts=0;
    }
  };
  window.doRegister = async function(){
    const name =document.getElementById('auth-reg-name').value.trim();
    const email=document.getElementById('auth-reg-email').value.trim();
    const pass =document.getElementById('auth-reg-pass').value;
    const pass2=document.getElementById('auth-reg-pass2').value;
    const err  =document.getElementById('auth-err');
    if(!email||!pass){err.textContent='Vui lòng nhập đầy đủ thông tin.';return;}
    if(pass!==pass2){err.textContent='Mật khẩu xác nhận không khớp.';return;}
    if(pass.length<6){err.textContent='Mật khẩu tối thiểu 6 ký tự.';return;}
    const btn=document.getElementById('auth-action-btn');
    btn.disabled=true; btn.textContent='Đang đăng ký...';
    const {error} = await sb.auth.signUp({
      email, password:pass,
      options:{data:{display_name:name||email.split('@')[0]}}
    });
    btn.disabled=false; btn.textContent='Tạo tài khoản';
    if(error){err.textContent=error.message;return;}
    err.className='auth-err ok';
    err.textContent='✓ Đăng ký thành công! Kiểm tra email để xác nhận tài khoản (hoặc đăng nhập ngay nếu không cần xác nhận).';
  };
  window.doSignOut = async function(){
    const d=document.getElementById('auth-drop');
    if(d) d.style.display='none';
    clearTimeout(_cloudSaveTimer);
    // Timeout so a slow/failing push never blocks sign-out
    try { await Promise.race([pushProgress(), new Promise(r=>setTimeout(r,3000))]); } catch(e){ console.warn('[auth] push failed:', e); }
    _currentUser = null; // clear before signOut so SIGNED_OUT handler skips re-render
    try { await sb.auth.signOut(); } catch(e){ console.warn('[auth] signOut error:', e.message); }
    _bookmarks = new Set();
    updateBmBadge();
    loadSRS();
    Object.assign(GS,{xp:0,streak:1,mastered:0,flashDone:0,exDone:0,exPerfectRound:0,roleplays:0,dialogues:0,earnedBadges:[],lastDate:'',xpHistory:[]});
    renderAuthUI(null);
    updateXPUI();
    try { renderTopicTabs(); } catch(e){}
    navTo('dashboard'); // navigate + render dashboard together
    toast('Đã đăng xuất');
  };
  window.toggleUserMenu = function(e){
    if(e) e.stopPropagation();
    const d=document.getElementById('auth-drop');
    if(d) d.style.display = d.style.display==='none'?'block':'none';
  };
  document.addEventListener('click', e=>{
    if(!e.target.closest('.auth-user-wrap')){
      const d=document.getElementById('auth-drop');
      if(d) d.style.display='none';
    }
  });
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
      window.closeAuthModal && window.closeAuthModal();
    }
  });

  // ── Auth state listener ──────────────────────────────────
  sb.auth.onAuthStateChange(async (event, session) => {
    const user = session?.user || null;
    if(event==='SIGNED_IN'){
      renderAuthUI(user);
      window.closeAuthModal();
      await pullProgress(); // restores GS + SRS + bookmarks from Supabase
      renderTopicTabs();
      const name = user.user_metadata?.display_name || user.email.split('@')[0];
      toast(`Xin chào ${name}! Đã đồng bộ tiến độ học ☁️`);
      renderDashboard();
    } else if(event==='SIGNED_OUT'){
      if(_currentUser !== null) renderAuthUI(null); // skip if doSignOut already handled it
      _bookmarks = new Set();
      updateBmBadge();
      loadSRS();
      Object.assign(GS,{xp:0,streak:1,mastered:0,flashDone:0,exDone:0,exPerfectRound:0,roleplays:0,dialogues:0,earnedBadges:[],lastDate:'',xpHistory:[]});
      updateXPUI();
      renderTopicTabs();
      renderDashboard();
    } else {
      renderAuthUI(user);
    }
  });

  // Check existing session on load
  sb.auth.getSession().then(({data:{session}}) => {
    if(session){
      renderAuthUI(session.user);
      pullProgress().then(()=>{ renderTopicTabs(); renderDashboard(); });
    } else {
      renderAuthUI(null);
    }
  });

  // ── Đồng bộ danh mục từ DB → CAT_META + sidebar ──
  let _catsFirstLoad=true;
  async function syncCategories(){
    const [{data,error},{data:tops,error:topsErr}]=await Promise.all([
      sb.from('categories').select('*').order('sort_order').order('id'),
      sb.from('topics').select('*').order('sort_order').order('id'),
    ]);
    if(error){
      console.warn('[live] categories: không đọc được (anon RLS?):', error.message);
      console.warn('[live] Fix: chạy trong Supabase SQL Editor:\nCREATE POLICY "categories_read_anon" ON public.categories FOR SELECT TO anon USING (true);');
      return false;
    }
    if(topsErr) console.warn('[live] topics fetch error:', topsErr.message);
    else if(tops&&tops.length){_topics=tops;renderTopicTabs();}
    if(!data||!data.length) return false;
    Object.keys(CAT_META).forEach(k=>delete CAT_META[k]);
    const newPhrase=[],newVocab=[];
    data.forEach(c=>{
      CAT_META[c.key]={l:c.label,ic:c.icon,c:c.color||'var(--t2)'};
      if(c.section==='communication') newPhrase.push(c.key);
      else newVocab.push(c.key);
    });
    PHRASE_CATS.splice(0,PHRASE_CATS.length,...newPhrase);
    VOCAB_CATS.splice(0,VOCAB_CATS.length,...newVocab);
    // Ensure DATA has an entry for every category (even if phrases not loaded yet)
    data.forEach(c=>{ if(!DATA[c.key]) DATA[c.key]=[]; });
    buildSidebarCats(data);
    // On realtime events (not first boot), refresh the active page so label/icon updates
    if(!_catsFirstLoad) rerenderActive();
    _catsFirstLoad=false;
    return true;
  }

  const COND_FACTORY = {
    xp:             v => s=>s.xp>=v,
    flashDone:      v => s=>s.flashDone>=v,
    exDone:         v => s=>s.exDone>=v,
    exPerfectRound: v => s=>s.exPerfectRound>=v,
    streak:         v => s=>s.streak>=v,
    mastered:       v => s=>s.mastered>=v,
    roleplays:      v => s=>s.roleplays>=v,
    dialogues:      v => s=>s.dialogues>=v
  };

  async function loadAll(){
    const [p, d, l, b] = await Promise.all([
      sb.from('phrases').select('*').order('category').order('sort_order').order('id'),
      sb.from('dialogues').select('*, dialogue_lines(*)').order('sort_order').order('id'),
      sb.from('levels').select('*').order('min_xp'),
      sb.from('badges').select('*').order('sort_order').order('id'),
    ]);
    // phrases & dialogues là bắt buộc; levels/badges có thể dùng defaults
    if(p.error){ console.warn('[live] phrases error:', p.error?.message); return false; }
    if(d.error){ console.warn('[live] dialogues error:', d.error?.message); return false; }
    if(l.error) console.warn('[live] levels error (dùng defaults):', l.error?.message);
    if(b.error) console.warn('[live] badges error (dùng defaults):', b.error?.message);
    // categories đã được xử lý bởi syncCategories() — không cần làm lại ở đây
    // ── Phrases → DATA ──
    if((p.data||[]).length){
      const newData = {};
      Object.keys(CAT_META).forEach(c => newData[c] = []);
      const grouped = {};
      p.data.forEach(row=>{
        const c = row.category;
        if(!grouped[c]) grouped[c] = {};
        const g = row.group_name;
        if(!grouped[c][g]) grouped[c][g] = [];
        const item = { de: row.de, vi: row.vi, _so: row.sort_order||0 };
        if(row.note) item.n = row.note;
        if(row.example) item.ex = row.example;
        grouped[c][g].push(item);
      });
      Object.entries(grouped).forEach(([c, gmap])=>{
        if(!newData[c]) newData[c] = [];
        newData[c] = Object.entries(gmap).map(([gname, items])=>({
          g: gname,
          i: items.sort((a,b)=>(a._so||0)-(b._so||0)).map(({_so, ...rest})=>rest)
        }));
      });
      DATA = newData;
      // Ensure all known categories have an entry (even if empty)
      Object.keys(CAT_META).forEach(c=>{ if(!DATA[c]) DATA[c]=[]; });
    }
    // ── Dialogues ──
    if((d.data||[]).length){
      DIALOGUES = d.data.map(row=>({
        title: row.title,
        icon: row.icon || '💬',
        diff: row.difficulty || 'easy',
        audio_url: row.audio_url || null,
        topic_id: row.topic_id || null,
        lines: (row.dialogue_lines||[])
          .sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))
          .map(L=>({ role: L.role, de: L.de, vi: L.vi }))
      }));
    }
    // ── Levels ──
    if((l.data||[]).length){
      LEVELS = l.data
        .slice()
        .sort((a,b)=>a.min_xp-b.min_xp)
        .map(r=>({ min: r.min_xp, name: r.name, emoji: r.emoji||'⭐' }));
    }
    // ── Badges ──
    if((b.data||[]).length){
      ALL_BADGES = b.data
        .slice()
        .sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))
        .map(r=>{
          const make = COND_FACTORY[r.condition_type] || (()=>()=>false);
          return { id: r.code, emoji: r.emoji||'🏅', name: r.name, cond: make(r.condition_value||0) };
        });
    }
    return true;
  }

  function getActivePageId(){
    const a = document.querySelector('.page.active');
    return a ? a.id.replace(/^page-/, '') : 'dashboard';
  }

  function rerenderActive(){
    // Xóa cache trang đã render để ensurePage() dựng lại với DATA mới
    document.querySelectorAll('.page').forEach(p=>{
      const pg = p.id.replace(/^page-/, '');
      if(!['dashboard','exercise','dialogue','srs','roleplay'].includes(pg)) p.innerHTML = '';
    });
    // Clear dialogue list so renderDialogues() rebuilds with fresh Supabase data
    const dlEl=document.getElementById('dialogue-list');
    if(dlEl) dlEl.innerHTML='';
    stopHighlight();
    Object.keys(flashState).forEach(k=>delete flashState[k]);
    recomputeCounts();
    updateXPUI();
    const pg = getActivePageId();
    if(pg==='dashboard')  renderDashboard();
    else if(pg==='dialogue') renderDialogues();
    else if(pg==='srs')      renderSRS();
    else if(pg==='roleplay') renderRoleplay();
    else if(pg && pg!=='exercise') ensurePage(pg);
  }

  let pending = false, firstSync = true;
  function debouncedReload(){
    if(pending) return;
    pending = true;
    setTimeout(async ()=>{
      pending = false;
      const ok = await loadAll();
      if(ok){
        rerenderActive();
        if(!firstSync) toast('🔄 Nội dung vừa được cập nhật từ admin');
        firstSync = false;
      }
    }, 350);
  }

  // Boot — categories trước để CAT_META sẵn sàng trước khi render phrases
  loadSRS(); // khôi phục tiến độ SRS từ localStorage

  // Load topics hoàn toàn độc lập — không chờ categories/phrases
  sb.from('topics').select('*').order('sort_order').order('id')
    .then(({data,error})=>{
      if(error){console.warn('[live] topics error:',error.message);return;}
      console.info('[live] Topics loaded:',data?.length||0);
      if(data&&data.length){_topics=data;renderTopicTabs();}
    });

  (async ()=>{
    await syncCategories(); // đồng bộ danh mục trước (cập nhật CAT_META)
    const ok = await loadAll(); // sau đó load phrases/dialogues/levels/badges
    if(ok){
      _dataFromDB = true;
      // Fallback nếu topics chưa load kịp
      if(!_topics.length){
        const {data:tops2}=await sb.from('topics').select('*').order('sort_order').order('id');
        if(tops2&&tops2.length){_topics=tops2;renderTopicTabs();}
      }
      rerenderActive();
      firstSync = false;
      console.info('[live] Đồng bộ Supabase OK');
    } else {
      console.warn('[live] Không tải được dữ liệu — dùng default. Kiểm tra RLS policy cho role anon.');
    }
  })();

  // Realtime — subscribe các bảng nội dung
  ['phrases','dialogues','dialogue_lines','levels','badges'].forEach(tbl=>{
    sb.channel('rt:'+tbl)
      .on('postgres_changes', { event:'*', schema:'public', table: tbl }, debouncedReload)
      .subscribe(status=>{ if(status==='SUBSCRIBED') console.info('[live] Realtime ON:', tbl); });
  });
  // categories cập nhật sidebar ngay lập tức, không cần reload toàn bộ
  sb.channel('rt:categories')
    .on('postgres_changes', { event:'*', schema:'public', table:'categories' }, ()=>syncCategories())
    .subscribe(status=>{ if(status==='SUBSCRIBED') console.info('[live] Realtime ON: categories'); });
  // topics cập nhật tab bar và sidebar ngay lập tức
  sb.channel('rt:topics')
    .on('postgres_changes', { event:'*', schema:'public', table:'topics' }, async()=>{
      const {data}=await sb.from('topics').select('*').order('sort_order').order('id');
      if(data){_topics=data;renderTopicTabs();buildSidebarCats();}
    })
    .subscribe(status=>{ if(status==='SUBSCRIBED') console.info('[live] Realtime ON: topics'); });
})();
