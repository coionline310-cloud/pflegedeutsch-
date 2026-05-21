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
let _dataFromDB=false; // true after first Supabase loadAll() succeeds

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
let GS={xp:0,streak:1,mastered:0,flashDone:0,exDone:0,exPerfectRound:0,roleplays:0,dialogues:0,earnedBadges:[],lastDate:''};

function addXP(n,label=''){
  const prev=getLevel(GS.xp);
  GS.xp+=n;
  const cur=getLevel(GS.xp);
  updateXPUI();
  if(label) toast(`+${n} XP · ${label}`);
  if(cur.min>prev.min) showLevelUp(cur);
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
  const isCatPage=!['dashboard','exercise','dialogue','srs','roleplay'].includes(pg);
  const bnCats=document.getElementById('bn-cats-btn');
  if(bnCats) bnCats.classList.toggle('active',isCatPage);
  // Category sheet active item
  document.querySelectorAll('.cats-sheet-it').forEach(i=>i.classList.remove('active'));
  const sci=document.querySelector('.cats-sheet-it[data-page="'+pg+'"]');
  if(sci) sci.classList.add('active');
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pageEl=document.getElementById('page-'+pg);
  if(pageEl) pageEl.classList.add('active');
  if(isCatPage)ensurePage(pg);
  if(pg==='dashboard')renderDashboard();
  if(pg==='dialogue')renderDialogues();
  if(pg==='reading')renderReadingLessons();
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
  const commCats=_dynCats.filter(c=>c.section==='communication');
  const vocabCats=_dynCats.filter(c=>c.section!=='communication');
  const makeNavHTML=(cats,colorOff)=>cats.map((c,i)=>{
    const color=c.color||CAT_COLORS[(colorOff+i)%CAT_COLORS.length];
    return `<div class="nav-it" data-page="${c.key}" style="--tc:${color}" onclick="navTo('${c.key}')"><span class="nav-ic">${c.icon}</span>${c.label}<span class="nav-badge" id="cnt-${c.key}"></span></div>`;
  }).join('');
  commEl.innerHTML=makeNavHTML(commCats,0);
  vocabEl.innerHTML=makeNavHTML(vocabCats,4);
  // Ensure page divs exist for all categories (including new ones)
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
  // Populate mobile category sheet
  const sheetBody=document.getElementById('catsSheetBody');
  if(sheetBody){
    const commList=_dynCats.filter(c=>c.section==='communication');
    const vocabList=_dynCats.filter(c=>c.section!=='communication');
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

document.querySelectorAll('.nav-it[data-page]').forEach(it=>{
  it.addEventListener('click',()=>navTo(it.dataset.page));
});

// Render ngay từ CAT_META mặc định — Supabase sẽ gọi lại buildSidebarCats() khi load xong
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
    const note=p.n?('<div class="'+(isV?'vi2-n':'pi-note')+'">💡 '+p.n+'</div>'):'';
    const ex=p.ex?('<div class="pi-ex">📝 '+p.ex+'</div>'):'';
    const spk=`<button class="pi-speak" data-de="${safeDE}" onclick="speakDE(this.dataset.de);event.stopPropagation();" title="Phát âm">🔊</button>`;
    if(isV) return `<div class="vi2" ${dataStr} onclick="showDictPopup(this,event)"><div class="vi2-de">${p.de}${spk}</div><div class="vi2-vi">${p.vi}</div>${note}${ex}</div>`;
    return `<div class="pi" ${dataStr} onclick="showDictPopup(this,event)"><div class="pi-de">${p.de}${spk}</div><div class="pi-vi">${p.vi}</div>${note}${ex}</div>`;
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
          </div>
        </div>
      </div>
      <div class="fc-rate" id="srs-rate" style="display:none;">
        <button class="fc-rb hard" onclick="rateSRS(0)">😓 Khó</button>
        <button class="fc-rb ok"   onclick="rateSRS(3)">👍 Nhớ được</button>
        <button class="fc-rb easy" onclick="rateSRS(5)">⚡ Thuộc rồi</button>
      </div>
      <div class="srs-speak-row">
        <button class="srs-speak-btn" onclick="speakDE('${esc(card.de)}')">🔊 Nghe phát âm</button>
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
  updateXPUI();
  // Hard card: push a copy to end of queue so it repeats this session
  if(q===0) srsQ.queue.push({...srsQ.card});
  srsQ.idx++;
  setTimeout(renderSRSCard,280);
}

// ════════════════════════════════════════════════════════
// READING — Karaoke Luyện Nghe
// ════════════════════════════════════════════════════════
let READING_LESSONS=[];
let _rlCur=null,_rlRate=0.8;

function _renderRLList(){
  const el=document.getElementById('reading-main');
  if(!el)return;
  el.innerHTML=`<div class="rl-list">`+READING_LESSONS.map((l,i)=>`
    <div class="rl-card" onclick="openReadingLesson(${i})">
      <div class="rl-card-ic">${l.icon||'🎧'}</div>
      <div class="rl-card-body">
        <div class="rl-card-title">${l.title}</div>
        <div class="rl-card-de">${(l.de_text||'').slice(0,85)}${(l.de_text||'').length>85?'…':''}</div>
        ${l.audio_url?'<span class="rl-has-audio">🎙 Audio Drive</span>':''}
      </div>
      <div class="rl-diff diff-${l.difficulty||'easy'}">${l.difficulty==='hard'?'Nâng cao':l.difficulty==='medium'?'Trung bình':'Cơ bản'}</div>
    </div>`).join('')+`</div>`;
}
async function renderReadingLessons(){
  const el=document.getElementById('reading-main');
  if(!el)return;
  stopHighlight();
  if(READING_LESSONS.length){_renderRLList();return;}
  // Try live fetch if sbLive is available (handles RLS/timing issues)
  const sb=window.sbLive;
  if(!sb){
    el.innerHTML=`<div class="rl-empty"><div class="rl-empty-ic">🎧</div><div>Chưa có bài luyện nghe nào.<br>Thêm bài mới trong <a href="admin.html" style="color:var(--teal)">Admin → Karaoke Nghe</a>.</div></div>`;
    return;
  }
  el.innerHTML=`<div class="rl-empty"><div class="rl-empty-ic" style="font-size:1.4rem">⏳</div><div>Đang tải...</div></div>`;
  const {data,error}=await sb.from('reading_lessons').select('*').order('sort_order').order('id');
  if(error){
    console.warn('[reading] fetch error:',error.message);
    el.innerHTML=`<div class="rl-empty"><div class="rl-empty-ic">⚠️</div><div style="color:var(--yellow)">Lỗi tải dữ liệu.<br><small style="color:var(--t3)">${error.message}</small></div></div>`;
    return;
  }
  if((data||[]).length){
    READING_LESSONS=data;
    _renderRLList();
  } else {
    el.innerHTML=`<div class="rl-empty"><div class="rl-empty-ic">🎧</div><div>Chưa có bài luyện nghe nào.<br>Thêm bài mới trong <a href="admin.html" style="color:var(--teal)">Admin → Karaoke Nghe</a>.</div></div>`;
  }
}

function openReadingLesson(i){
  _rlCur=i;
  const l=READING_LESSONS[i];
  if(!l)return;
  stopHighlight();
  const el=document.getElementById('reading-main');
  const embedUrl=getDriveEmbedUrl(l.audio_url);
  const audioHtml=embedUrl?`
    <div class="rl-audio-wrap">
      <div class="rl-audio-lbl">🎙 Audio bản gốc (Google Drive)</div>
      <iframe src="${embedUrl}" class="rl-audio-frame" allow="autoplay" allowfullscreen></iframe>
    </div>`:'';
  const diff=l.difficulty==='hard'?'Nâng cao':l.difficulty==='medium'?'Trung bình':'Cơ bản';
  const navRow=READING_LESSONS.length>1?`
    <div class="rl-nav-row">
      ${i>0?`<button class="rl-nav-btn" onclick="openReadingLesson(${i-1})">← Bài trước</button>`:'<span></span>'}
      <span class="rl-nav-count">${i+1} / ${READING_LESSONS.length}</span>
      ${i<READING_LESSONS.length-1?`<button class="rl-nav-btn" onclick="openReadingLesson(${i+1})">Bài tiếp →</button>`:'<span></span>'}
    </div>`:'';
  el.innerHTML=`
    <div class="rl-player">
      <div class="rl-player-hdr">
        <button class="rl-back-btn" onclick="renderReadingLessons()">← Danh sách</button>
        <div class="rl-player-meta">
          <div class="rl-player-title">${l.title}</div>
          <span class="rl-diff diff-${l.difficulty||'easy'}">${diff}</span>
        </div>
      </div>
      ${audioHtml}
      <div class="rl-text-box">
        <div class="rl-de" id="rl-de-text">${l.de_text||''}</div>
        ${l.vi_text?`<div class="rl-vi">${l.vi_text}</div>`:''}
      </div>
      <div class="rl-controls">
        <button class="rl-play-btn" id="rl-play-btn" onclick="toggleRLPlay()">▶ Phát &amp; tô đậm từng chữ</button>
        <div class="rl-rates">
          <span class="rl-rate-lbl">Tốc độ:</span>
          ${[0.6,0.8,1.0].map(r=>`<button class="rl-rate-btn${_rlRate===r?' active':''}" onclick="setRLRate(${r},this)">×${r}</button>`).join('')}
        </div>
      </div>
      ${navRow}
    </div>`;
}

function toggleRLPlay(){
  const de=document.getElementById('rl-de-text');
  const btn=document.getElementById('rl-play-btn');
  if(!de||_rlCur===null)return;
  const l=READING_LESSONS[_rlCur];if(!l)return;
  if(_hl&&_hl.el===de){stopHighlight();}
  else{speakHighlight(l.de_text,de,btn,_rlRate);}
}
function setRLRate(rate,btn){
  _rlRate=rate;
  document.querySelectorAll('.rl-rate-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
}

// ════════════════════════════════════════════════════════
// DIALOGUES
// ════════════════════════════════════════════════════════
function renderDialogues(){
  const el=document.getElementById('dialogue-list');
  el.innerHTML=DIALOGUES.map((d,i)=>{
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
function backToExMenu(){clearTimeout(autoT);document.getElementById('exMenu').classList.remove('off');document.getElementById('exRunner').classList.remove('on');}
function resetEx(){clearTimeout(autoT);exPool=shuffle(flatAll()).slice(0,EX_ROUND);exIdx=0;exOk=0;exFail=0;exStreak=0;exRoundXP=0;updateExScore();loadExQ();}
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
  if(exIdx>=exPool.length){showRoundDone();return;}
  exAnswered=false;updateExScore();
  if(exType==='mcq')       loadMCQ();
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
function renderDashboard(){
  const lv=getLevel(GS.xp),nx=getNextLevel(GS.xp);
  const base=lv.min,top=nx?nx.min:GS.xp+1;
  const pct=Math.round((GS.xp-base)/(top-base)*100);
  // XP Card
  document.getElementById('dash-xp-card').innerHTML=`
    <div class="xp-card">
      <div class="xp-card-top">
        <div><div class="xp-level">${lv.emoji} ${lv.name}</div><div class="xp-level-lbl">Cấp độ hiện tại</div></div>
        <div class="xp-total">${GS.xp} XP${nx?' / '+nx.min+' XP':''}</div>
      </div>
      <div class="xp-bar-wrap"><div class="xp-bar-inner" style="width:${pct}%"></div></div>
      <div class="xp-bar-labels"><span>${lv.name}</span>${nx?'<span>'+nx.emoji+' '+nx.name+'</span>':''}</div>
    </div>`;
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
    return `<div class="sug-item" onclick="jumpTo('${p.cat}')">
      <div class="sug-dot" style="background:${CAT_META[p.cat].c}"></div>
      <div><div class="sug-de">${p.de} <span class="srs-due-badge" style="${sTag.tag==='due'?'':'background:rgba(79,163,255,.1);color:var(--blue);'}">${sTag.label}</span></div>
      <div class="sug-vi">${p.vi}</div></div>
      <div class="sug-cat">${CAT_META[p.cat].l}</div>
    </div>`;
  }).join('');
}
function jumpTo(cat){
  document.querySelectorAll('.nav-it').forEach(i=>i.classList.remove('active'));
  const ni=document.querySelector(`.nav-it[data-page="${cat}"]`);if(ni)ni.classList.add('active');
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+cat).classList.add('active');
  ensurePage(cat);
}

// ════════════════════════════════════════════════════════
// SEARCH
// ════════════════════════════════════════════════════════
function doSearch(q){
  const dd=document.getElementById('srDrop');
  q=q.trim().toLowerCase();
  if(!q){dd.classList.remove('open');return;}
  const res=flatAll().filter(p=>p.de.toLowerCase().includes(q)||p.vi.toLowerCase().includes(q)).slice(0,14);
  function hl(t){return t.replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<mark>$1</mark>');}
  if(!res.length){dd.innerHTML='<div style="padding:1rem;text-align:center;color:var(--t3);font-size:.8rem;">Không tìm thấy kết quả</div>';dd.classList.add('open');return;}
  dd.innerHTML=res.map(p=>`<div class="sr-it" onclick="jumpTo('${p.cat}');document.getElementById('srDrop').classList.remove('open');document.getElementById('searchInput').value='';">
    <div class="sr-cat">${CAT_META[p.cat].ic} ${CAT_META[p.cat].l}</div>
    <div class="sr-de">${hl(p.de)}</div><div class="sr-vi">${hl(p.vi)}</div>
  </div>`).join('');
  dd.classList.add('open');
}
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
    realtime: { params: { eventsPerSecond: 10 } }
  });
  window.sbLive = sb;

  // ════════════════════════════════════════════════════════
  // AUTH — Đăng nhập / Đăng ký / Tiến độ thành viên
  // ════════════════════════════════════════════════════════
  let _currentUser = null;
  let _cloudSaveTimer = null;

  // Debounced cloud save (2s after last change)
  function scheduleCloudSave(){
    clearTimeout(_cloudSaveTimer);
    _cloudSaveTimer = setTimeout(pushProgress, 2000);
  }
  window._scheduleCloudSave = scheduleCloudSave;

  async function pushProgress(){
    if(!_currentUser) return;
    const {error} = await sb.from('user_progress').upsert({
      user_id: _currentUser.id,
      srs_db: SRS_DB,
      game_state: GS,
      updated_at: new Date().toISOString()
    }, {onConflict:'user_id'});
    if(error) console.warn('[auth] save error:', error.message);
  }

  async function pullProgress(){
    if(!_currentUser) return;
    const {data,error} = await sb.from('user_progress')
      .select('*').eq('user_id',_currentUser.id).single();
    if(error && error.code!=='PGRST116'){
      console.warn('[auth] load error:', error.message); return;
    }
    if(data){
      if(data.srs_db && Object.keys(data.srs_db).length){
        SRS_DB = data.srs_db;
        try{localStorage.setItem('srs_db',JSON.stringify(SRS_DB));}catch(e){}
      }
      if(data.game_state && Object.keys(data.game_state).length){
        Object.assign(GS, data.game_state);
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
    if(!email||!pass){err.textContent='Vui lòng nhập email và mật khẩu.';return;}
    const btn=document.getElementById('auth-action-btn');
    btn.disabled=true; btn.textContent='Đang đăng nhập...';
    const {error} = await sb.auth.signInWithPassword({email,password:pass});
    btn.disabled=false; btn.textContent='Đăng nhập';
    if(error){err.textContent=error.message==='Invalid login credentials'?'Email hoặc mật khẩu không đúng.':error.message;}
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
    // Close dropdown immediately
    const d=document.getElementById('auth-drop');
    if(d) d.style.display='none';
    clearTimeout(_cloudSaveTimer);
    // Save progress — but don't let failure block signOut
    try { await pushProgress(); } catch(e){ console.warn('[auth] push failed:', e); }
    // Sign out
    const {error} = await sb.auth.signOut();
    if(error) console.warn('[auth] signOut error:', error.message);
    // Update UI immediately (don't wait for onAuthStateChange)
    renderAuthUI(null);
    loadSRS();
    Object.assign(GS,{xp:0,streak:1,mastered:0,flashDone:0,exDone:0,exPerfectRound:0,roleplays:0,dialogues:0,earnedBadges:[],lastDate:''});
    updateXPUI();
    renderDashboard();
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
    renderAuthUI(user);
    if(event==='SIGNED_IN'){
      window.closeAuthModal();
      await pullProgress();
      const name = user.user_metadata?.display_name || user.email.split('@')[0];
      toast(`Xin chào ${name}! Đã đồng bộ tiến độ học ☁️`);
      renderDashboard();
    } else if(event==='SIGNED_OUT'){
      loadSRS();
      Object.assign(GS,{xp:0,streak:1,mastered:0,flashDone:0,exDone:0,exPerfectRound:0,roleplays:0,dialogues:0,earnedBadges:[],lastDate:''});
      updateXPUI();
      renderDashboard();
    }
  });

  // Check existing session on load
  sb.auth.getSession().then(({data:{session}}) => {
    if(session){
      renderAuthUI(session.user);
      pullProgress().then(()=>renderDashboard());
    } else {
      renderAuthUI(null);
    }
  });

  // ── Đồng bộ danh mục từ DB → CAT_META + sidebar ──
  let _catsFirstLoad=true;
  async function syncCategories(){
    const {data,error}=await sb.from('categories').select('*').order('sort_order').order('id');
    if(error){
      console.warn('[live] categories: không đọc được (anon RLS?):', error.message);
      console.warn('[live] Fix: chạy trong Supabase SQL Editor:\nCREATE POLICY "categories_read_anon" ON public.categories FOR SELECT TO anon USING (true);');
      return false;
    }
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
    const [p, d, l, b, rl] = await Promise.all([
      sb.from('phrases').select('*').order('category').order('sort_order').order('id'),
      sb.from('dialogues').select('*, dialogue_lines(*)').order('sort_order').order('id'),
      sb.from('levels').select('*').order('min_xp'),
      sb.from('badges').select('*').order('sort_order').order('id'),
      sb.from('reading_lessons').select('*').order('sort_order').order('id')
    ]);
    // phrases & dialogues là bắt buộc; levels/badges/reading_lessons có thể dùng defaults
    if(p.error){ console.warn('[live] phrases error:', p.error?.message); return false; }
    if(d.error){ console.warn('[live] dialogues error:', d.error?.message); return false; }
    if(l.error) console.warn('[live] levels error (dùng defaults):', l.error?.message);
    if(b.error) console.warn('[live] badges error (dùng defaults):', b.error?.message);
    if(rl.error) console.warn('[live] reading_lessons error:', rl.error?.message);
    else if((rl.data||[]).length){ READING_LESSONS = rl.data.map(r=>({...r})); console.info('[live] reading_lessons: '+READING_LESSONS.length+' bài'); }
    else console.warn('[live] reading_lessons: trả về rỗng — kiểm tra RLS policy anon SELECT trên Supabase');
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
      if(!['dashboard','exercise','dialogue','srs','roleplay','reading'].includes(pg)) p.innerHTML = '';
    });
    // Clear dialogue list so renderDialogues() rebuilds with fresh Supabase data
    const dlEl=document.getElementById('dialogue-list');
    if(dlEl) dlEl.innerHTML='';
    // Clear reading-main so renderReadingLessons() rebuilds with fresh data
    const rlEl=document.getElementById('reading-main');
    if(rlEl) rlEl.innerHTML='';
    stopHighlight();
    Object.keys(flashState).forEach(k=>delete flashState[k]);
    recomputeCounts();
    updateXPUI();
    const pg = getActivePageId();
    if(pg==='dashboard')  renderDashboard();
    else if(pg==='dialogue') renderDialogues();
    else if(pg==='srs')      renderSRS();
    else if(pg==='roleplay') renderRoleplay();
    else if(pg==='reading')  renderReadingLessons();
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
  (async ()=>{
    await syncCategories(); // đồng bộ danh mục trước (cập nhật CAT_META)
    const ok = await loadAll(); // sau đó load phrases/dialogues/levels/badges
    if(ok){
      _dataFromDB = true;
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
})();
