// ══════════════════════════════════════════════════════════
// INIT SUPABASE
// ══════════════════════════════════════════════════════════
const SB_URL = window.SUPABASE_URL;
const SB_KEY = window.SUPABASE_ANON_KEY;
const sb = window.supabase.createClient(SB_URL, SB_KEY);

const CAT_META = {
  patient:        {l:'Bệnh nhân',     ic:'👤'},
  colleague:      {l:'Đồng nghiệp',   ic:'👥'},
  handover:       {l:'Bàn giao ca',   ic:'🔄'},
  emergency:      {l:'Khẩn cấp',      ic:'🚨'},
  vocab:          {l:'Chuyên ngành',  ic:'📚'},
  anatomy:        {l:'Giải phẫu',     ic:'🫀'},
  medication:     {l:'Thuốc & ĐT',    ic:'💊'},
  documentation:  {l:'Hồ sơ',         ic:'📋'},
  nursing_process:{l:'Quy trình ĐD',  ic:'🩺'},
  mental:         {l:'Tâm thần & Lão',ic:'🧠'},
};
const COND_LABELS = {
  xp:'XP', flashDone:'Flashcard', exDone:'Bài tập',
  exPerfectRound:'Vòng hoàn hảo', streak:'Streak',
  mastered:'Đã thuộc', roleplays:'Roleplay', dialogues:'Hội thoại'
};
const ROLES = ['super_admin','editor','viewer','student'];

let currentUser = null;
let currentProfile = null;
let allPhrases = [];
let allDialogues = [];
let editPhraseId = null;
let editDialogueId = null;
let editLevelId = null;
let editBadgeId = null;

// ══════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════
let toastTimer;
function toast(msg, isErr=false){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast on' + (isErr?' err':'');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.className='toast', 3000);
}

// ══════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════
function showLoginErr(msg){
  const el = document.getElementById('loginErr');
  el.textContent = msg; el.style.display='block';
}
function hideLoginErr(){
  document.getElementById('loginErr').style.display='none';
}

async function doLogin(){
  const email = document.getElementById('loginEmail').value.trim();
  const pwd   = document.getElementById('loginPwd').value;
  const btn   = document.getElementById('loginBtn');
  hideLoginErr();
  if(!email||!pwd){showLoginErr('Vui lòng nhập email và mật khẩu.');return;}
  if(!window.supabase){showLoginErr('Lỗi: Thư viện Supabase chưa tải. Hãy kiểm tra kết nối mạng và tải lại trang.');return;}

  btn.disabled=true; btn.textContent='Đang đăng nhập...';
  try {
    const {data, error} = await sb.auth.signInWithPassword({email, password:pwd});
    if(error) throw error;
    currentUser = data.user;
    await initApp();
  } catch(e) {
    const msg = e.message||'';
    if(msg.includes('Invalid login credentials')) showLoginErr('Sai email hoặc mật khẩu. Hãy kiểm tra lại.');
    else if(msg.includes('Email not confirmed')) showLoginErr('Email chưa được xác nhận. Vào Supabase → Authentication → Users → Confirm email.');
    else if(msg.includes('Failed to fetch') || msg.includes('NetworkError')) showLoginErr('Không kết nối được Supabase. Kiểm tra SUPABASE_URL trong config.js và kết nối mạng.');
    else showLoginErr('Lỗi đăng nhập: ' + msg);
  } finally {
    btn.disabled=false; btn.textContent='Đăng nhập';
  }
}

async function doLogout(){
  try { await sb.auth.signOut(); } catch(e){}
  currentUser = null; currentProfile = null;
  document.getElementById('adminApp').style.display='none';
  document.getElementById('loginScreen').style.display='flex';
  hideLoginErr();
}

document.getElementById('loginPwd').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
document.getElementById('loginEmail').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('loginPwd').focus();});

// ══════════════════════════════════════════════════════════
// INIT APP
// ══════════════════════════════════════════════════════════
async function initApp(){
  // Load profile
  const {data:profile, error:profErr} = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
  if(profErr || !profile){
    // Profile chưa tồn tại — có thể trigger handle_new_user chưa chạy
    showLoginErr(
      'Không tìm thấy profile cho tài khoản này.\n' +
      'Hãy vào Supabase → SQL Editor → chạy:\n' +
      'select * from public.profiles;\n' +
      'Nếu không có dòng nào, chạy lại schema SQL để tạo trigger.'
    );
    await sb.auth.signOut();
    return;
  }
  if(!['super_admin','editor'].includes(profile.role)){
    showLoginErr(
      'Tài khoản này có role "' + profile.role + '" — chưa đủ quyền.\n' +
      'Cần role "super_admin" hoặc "editor".\n' +
      'Vào Supabase → SQL Editor → chạy:\n' +
      'update public.profiles set role=\'super_admin\' where username=\'' + (profile.username||'') + '\';'
    );
    await sb.auth.signOut();
    return;
  }
  currentProfile = profile;
  // Show app
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('adminApp').style.display='block';
  // Update sidebar user
  document.getElementById('sbAvatar').textContent = (profile.username||'?')[0].toUpperCase();
  document.getElementById('sbUserName').textContent = profile.full_name || profile.username;
  document.getElementById('sbUserRole').textContent = profile.role;
  // Hide users tab for non-super_admin
  if(profile.role!=='super_admin'){
    document.querySelectorAll('.admin-only').forEach(el=>el.style.display='none');
  }
  // Setup cat filter
  setupCatFilter();
  // Config info
  document.getElementById('configInfo').textContent =
    'URL: ' + SB_URL + '\nKey: ' + SB_KEY.slice(0,30) + '...';
  // Load data
  loadOverview();
  loadPhrases();
}

// ══════════════════════════════════════════════════════════
// NAV
// ══════════════════════════════════════════════════════════
const PANEL_TITLES = {
  overview:'Dashboard', phrases:'Từ vựng & Cụm từ', dialogues:'Hội thoại',
  levels:'Levels', badges:'Badges', users:'Người dùng', settings:'Cài đặt'
};
function showPanel(id){
  document.querySelectorAll('.adm-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-it').forEach(n=>n.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  const ni = document.querySelector(`.nav-it[data-panel="${id}"]`);
  if(ni) ni.classList.add('active');
  document.getElementById('topbarTitle').textContent = PANEL_TITLES[id]||id;
  document.getElementById('admSidebar').classList.remove('open');
  // Lazy load
  if(id==='dialogues') loadDialogues();
  else if(id==='levels') loadLevels();
  else if(id==='badges') loadBadges();
  else if(id==='users')  loadUsers();
  else if(id==='overview') loadOverview();
}

// ══════════════════════════════════════════════════════════
// OVERVIEW
// ══════════════════════════════════════════════════════════
async function loadOverview(){
  const [p,d,dl,l,b,u] = await Promise.all([
    sb.from('phrases').select('*', {count:'exact',head:true}),
    sb.from('dialogues').select('*', {count:'exact',head:true}),
    sb.from('dialogue_lines').select('*', {count:'exact',head:true}),
    sb.from('levels').select('*', {count:'exact',head:true}),
    sb.from('badges').select('*', {count:'exact',head:true}),
    sb.from('profiles').select('*', {count:'exact',head:true}),
  ]);
  document.getElementById('st-phrases').textContent = p.count??'—';
  document.getElementById('st-dialogues').textContent = d.count??'—';
  document.getElementById('st-lines').textContent = dl.count??'—';
  document.getElementById('st-levels').textContent = l.count??'—';
  document.getElementById('st-badges').textContent = b.count??'—';
  document.getElementById('st-users').textContent = u.count??'—';
  // Category breakdown
  const {data:catData} = await sb.from('phrases').select('category');
  if(catData){
    const counts = {};
    catData.forEach(r=>counts[r.category]=(counts[r.category]||0)+1);
    const html = Object.entries(CAT_META).map(([k,v])=>`
      <div style="display:flex;align-items:center;gap:8px;padding:.5rem 0;border-bottom:1px solid var(--b1);">
        <span style="font-size:1rem;width:24px;">${v.ic}</span>
        <span style="flex:1;font-size:.82rem;">${v.l}</span>
        <span style="font-size:.8rem;font-weight:600;color:var(--blue)">${counts[k]||0} mục</span>
      </div>`).join('');
    document.getElementById('overviewCats').innerHTML=`
      <div style="background:var(--s2);border:1px solid var(--b1);border-radius:var(--rl);padding:.9rem 1rem;">
        <div style="font-size:.8rem;font-weight:600;margin-bottom:.6rem;">Phân bổ theo danh mục</div>
        ${html}
      </div>`;
  }
}

// ══════════════════════════════════════════════════════════
// PHRASES
// ══════════════════════════════════════════════════════════
async function loadPhrases(){
  const {data, error} = await sb.from('phrases').select('*').order('category').order('group_name').order('sort_order').order('id');
  if(error){toast('Lỗi tải phrases: '+error.message,true);return;}
  allPhrases = data||[];
  updateGroupFilter();
  renderPhrases(allPhrases);
}

function setupCatFilter(){
  const sel = document.getElementById('catFilter');
  sel.innerHTML = '<option value="">Tất cả danh mục</option>';
  Object.entries(CAT_META).forEach(([k,v])=>{
    const o=document.createElement('option');o.value=k;o.textContent=v.ic+' '+v.l;sel.appendChild(o);
  });
  // Populate phrase modal select
  const pms = document.getElementById('pm-cat');
  pms.innerHTML='';
  Object.entries(CAT_META).forEach(([k,v])=>{
    const o=document.createElement('option');o.value=k;o.textContent=v.ic+' '+v.l;pms.appendChild(o);
  });
}

function updateGroupFilter(){
  const cat = document.getElementById('catFilter').value;
  const sel = document.getElementById('groupFilter');
  const src = cat ? allPhrases.filter(p=>p.category===cat) : allPhrases;
  const groups = [...new Set(src.map(p=>p.group_name))].sort();
  sel.innerHTML = '<option value="">Tất cả nhóm</option>';
  groups.forEach(g=>{const o=document.createElement('option');o.value=g;o.textContent=g;sel.appendChild(o);});
}

function filterPhrases(){
  updateGroupFilter();
  const q = document.getElementById('phraseSearch').value.toLowerCase();
  const cat = document.getElementById('catFilter').value;
  const grp = document.getElementById('groupFilter').value;
  const filtered = allPhrases.filter(p=>{
    if(cat && p.category!==cat) return false;
    if(grp && p.group_name!==grp) return false;
    if(q && !p.de.toLowerCase().includes(q) && !p.vi.toLowerCase().includes(q)) return false;
    return true;
  });
  renderPhrases(filtered);
}

function renderPhrases(list){
  document.getElementById('phraseCount').textContent = list.length + ' mục';
  const body = document.getElementById('phrasesBody');
  if(!list.length){
    body.innerHTML='<tr><td colspan="5" class="empty-row">Không có kết quả</td></tr>';
    return;
  }
  body.innerHTML = list.map(p=>`
    <tr>
      <td class="td-de">${esc(p.de)}<br>${p.note?'<span class="td-note">💡 '+esc(p.note)+'</span>':''}${p.example?'<span class="td-ex">📝 '+esc(p.example)+'</span>':''}</td>
      <td class="td-vi">${esc(p.vi)}</td>
      <td><span class="cat-badge">${CAT_META[p.category]?.ic||''} ${CAT_META[p.category]?.l||p.category}</span></td>
      <td style="color:var(--t2);font-size:.77rem;">${esc(p.group_name)}</td>
      <td class="td-actions">
        <button class="btn btn-blue btn-sm" onclick="openPhraseModal(${p.id})">✏️</button>
        <button class="btn btn-red btn-sm" onclick="deletePhrase(${p.id})">🗑️</button>
      </td>
    </tr>`).join('');
}

function openPhraseModal(id=null){
  editPhraseId = id;
  document.getElementById('phraseModalTitle').textContent = id?'Sửa từ vựng / cụm từ':'Thêm từ vựng / cụm từ';
  document.getElementById('phraseModalErr').style.display='none';
  if(id){
    const p = allPhrases.find(x=>x.id===id);
    if(!p) return;
    document.getElementById('pm-cat').value = p.category;
    document.getElementById('pm-group').value = p.group_name;
    document.getElementById('pm-de').value = p.de;
    document.getElementById('pm-vi').value = p.vi;
    document.getElementById('pm-note').value = p.note||'';
    document.getElementById('pm-example').value = p.example||'';
    document.getElementById('pm-sort').value = p.sort_order||0;
  } else {
    document.getElementById('pm-cat').value = 'patient';
    document.getElementById('pm-group').value = '';
    document.getElementById('pm-de').value = '';
    document.getElementById('pm-vi').value = '';
    document.getElementById('pm-note').value = '';
    document.getElementById('pm-example').value = '';
    document.getElementById('pm-sort').value = '0';
  }
  document.getElementById('phraseModal').classList.add('on');
  setTimeout(()=>document.getElementById('pm-de').focus(),100);
}
function closePhraseModal(){document.getElementById('phraseModal').classList.remove('on');}
document.getElementById('phraseModal').addEventListener('click',e=>{if(e.target===e.currentTarget)closePhraseModal();});

async function savePhrase(){
  const cat     = document.getElementById('pm-cat').value;
  const grp     = document.getElementById('pm-group').value.trim();
  const de      = document.getElementById('pm-de').value.trim();
  const vi      = document.getElementById('pm-vi').value.trim();
  const note    = document.getElementById('pm-note').value.trim();
  const example = document.getElementById('pm-example').value.trim();
  const sort    = parseInt(document.getElementById('pm-sort').value)||0;
  const errEl = document.getElementById('phraseModalErr');
  errEl.style.display='none';
  if(!grp||!de||!vi){errEl.textContent='Vui lòng điền đủ Nhóm, Tiếng Đức và Tiếng Việt.';errEl.style.display='block';return;}
  const btn = document.getElementById('pmSaveBtn');
  btn.disabled=true; btn.textContent='Đang lưu...';
  const payload = {category:cat, group_name:grp, de, vi, sort_order:sort};
  if(note) payload.note=note; else payload.note=null;
  payload.example = example || null;
  let error;
  if(editPhraseId){
    ({error} = await sb.from('phrases').update(payload).eq('id', editPhraseId));
  } else {
    ({error} = await sb.from('phrases').insert(payload));
  }
  btn.disabled=false; btn.textContent='Lưu';
  if(error){errEl.textContent='Lỗi: '+error.message;errEl.style.display='block';return;}
  closePhraseModal();
  toast(editPhraseId?'✓ Đã cập nhật!':'✓ Đã thêm mới!');
  await loadPhrases();
  filterPhrases();
}

async function deletePhrase(id){
  confirm2('Xóa mục này?','Dữ liệu sẽ bị xóa vĩnh viễn.',async()=>{
    const {data,error} = await sb.from('phrases').delete().eq('id',id).select();
    if(error){toast('Lỗi xóa: '+error.message,true);return;}
    if(!data||!data.length){toast('Lỗi: không xóa được — kiểm tra quyền Supabase',true);return;}
    toast('🗑️ Đã xóa!');
    await loadPhrases(); filterPhrases();
  });
}

// ══════════════════════════════════════════════════════════
// DIALOGUES
// ══════════════════════════════════════════════════════════
async function loadDialogues(){
  document.getElementById('dialoguesList').innerHTML='<div class="loading"><span class="spin"></span>Đang tải...</div>';
  const {data, error} = await sb.from('dialogues').select('*, dialogue_lines(*)').order('sort_order').order('id');
  if(error){toast('Lỗi tải hội thoại: '+error.message,true);return;}
  allDialogues = data||[];
  renderDialogues();
}

function renderDialogues(){
  const list = allDialogues;
  if(!list.length){
    document.getElementById('dialoguesList').innerHTML='<div style="text-align:center;padding:2rem;color:var(--t3);">Chưa có hội thoại nào.</div>';
    return;
  }
  const diffMap={easy:'Dễ',medium:'Trung bình',hard:'Khó'};
  const diffCls={easy:'diff-easy',medium:'diff-med',hard:'diff-hard'};
  document.getElementById('dialoguesList').innerHTML = list.map(d=>{
    const lines = (d.dialogue_lines||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
    return `
    <div class="dial-item" id="di-${d.id}">
      <div class="dial-head" onclick="toggleDial(${d.id})">
        <span class="dial-icon">${esc(d.icon||'💬')}</span>
        <span class="dial-title">${esc(d.title)}</span>
        <span class="diff-badge ${diffCls[d.difficulty]||'diff-easy'}">${diffMap[d.difficulty]||d.difficulty}</span>
        <span class="dial-meta">${lines.length} dòng</span>
        <span style="display:flex;gap:5px;margin-left:8px;">
          <button class="btn btn-blue btn-sm" onclick="event.stopPropagation();openDialogueModal(${d.id})">✏️</button>
          <button class="btn btn-red btn-sm" onclick="event.stopPropagation();deleteDialogue(${d.id})">🗑️</button>
        </span>
        <span class="dial-arrow">›</span>
      </div>
      <div class="dial-body">
        ${lines.length?`
        <table class="lines-tbl">
          <thead><tr><th>#</th><th>Role</th><th>Tiếng Đức</th><th>Tiếng Việt</th></tr></thead>
          <tbody>
            ${lines.map((l,i)=>`
              <tr>
                <td style="color:var(--t3);font-size:.72rem;">${i+1}</td>
                <td><span class="role-badge role-${l.role||'nurse'}">${esc(l.role||'nurse')}</span></td>
                <td class="td-de">${esc(l.de)}</td>
                <td class="td-vi">${esc(l.vi)}</td>
              </tr>`).join('')}
          </tbody>
        </table>`:'<div style="color:var(--t3);font-size:.78rem;padding:.4rem 0;">Chưa có dòng thoại nào.</div>'}
      </div>
    </div>`;
  }).join('');
}

function toggleDial(id){
  const el = document.getElementById('di-'+id);
  if(el) el.classList.toggle('open');
}

// Dialogue modal
let lineRows = [];
function openDialogueModal(id=null){
  editDialogueId = id;
  lineRows = [];
  document.getElementById('dialogueModalTitle').textContent = id?'Sửa hội thoại':'Thêm hội thoại';
  document.getElementById('dialogueModalErr').style.display='none';
  if(id){
    const d = allDialogues.find(x=>x.id===id);
    if(!d) return;
    document.getElementById('dm-title').value = d.title;
    document.getElementById('dm-icon').value  = d.icon||'💬';
    document.getElementById('dm-diff').value  = d.difficulty||'easy';
    document.getElementById('dm-sort').value  = d.sort_order||0;
    const lines = (d.dialogue_lines||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
    lines.forEach(l=>addLineRow(l));
  } else {
    document.getElementById('dm-title').value='';
    document.getElementById('dm-icon').value='💬';
    document.getElementById('dm-diff').value='easy';
    document.getElementById('dm-sort').value='0';
    document.getElementById('linesEditor').innerHTML='';
    addLineRow(); addLineRow();
  }
  document.getElementById('dialogueModal').classList.add('on');
}
function closeDialogueModal(){document.getElementById('dialogueModal').classList.remove('on');}
document.getElementById('dialogueModal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeDialogueModal();});

let lineIdx=0;
function addLineRow(data=null){
  const id='lr-'+(lineIdx++);
  lineRows.push(id);
  const editor = document.getElementById('linesEditor');
  const div=document.createElement('div');
  div.className='line-editor';div.id=id;
  div.innerHTML=`
    <button class="line-remove" onclick="removeLine('${id}')" title="Xóa dòng này">✕</button>
    <div class="line-editor-row">
      <div>
        <label class="flbl" style="font-size:.65rem;">Role</label>
        <select class="finp" style="padding:.35rem .5rem;font-size:.78rem;" data-field="role">
          <option value="nurse">🏥 nurse</option>
          <option value="patient">🤒 patient</option>
          <option value="doctor">👨‍⚕️ doctor</option>
        </select>
      </div>
      <div>
        <label class="flbl" style="font-size:.65rem;">Tiếng Đức *</label>
        <input class="finp" style="padding:.35rem .6rem;font-size:.82rem;" type="text" data-field="de" placeholder="..." value="${esc(data?.de||'')}">
      </div>
      <div>
        <label class="flbl" style="font-size:.65rem;">Tiếng Việt *</label>
        <input class="finp" style="padding:.35rem .6rem;font-size:.82rem;" type="text" data-field="vi" placeholder="..." value="${esc(data?.vi||'')}">
      </div>
    </div>`;
  if(data?.role) div.querySelector('[data-field="role"]').value=data.role;
  editor.appendChild(div);
}
function removeLine(id){
  lineRows=lineRows.filter(r=>r!==id);
  const el=document.getElementById(id);if(el)el.remove();
}

async function saveDialogue(){
  const title = document.getElementById('dm-title').value.trim();
  const icon  = document.getElementById('dm-icon').value.trim()||'💬';
  const diff  = document.getElementById('dm-diff').value;
  const sort  = parseInt(document.getElementById('dm-sort').value)||0;
  const errEl = document.getElementById('dialogueModalErr');
  errEl.style.display='none';
  if(!title){errEl.textContent='Vui lòng nhập tiêu đề.';errEl.style.display='block';return;}
  // Collect lines
  const lines=[];
  for(const lid of lineRows){
    const el=document.getElementById(lid);if(!el)continue;
    const role=el.querySelector('[data-field="role"]').value;
    const de=el.querySelector('[data-field="de"]').value.trim();
    const vi=el.querySelector('[data-field="vi"]').value.trim();
    if(de&&vi) lines.push({role,de,vi});
  }
  const btn=document.getElementById('dmSaveBtn');
  btn.disabled=true;btn.textContent='Đang lưu...';
  let dialId=editDialogueId;
  if(dialId){
    const {error}=await sb.from('dialogues').update({title,icon,difficulty:diff,sort_order:sort}).eq('id',dialId);
    if(error){errEl.textContent='Lỗi: '+error.message;errEl.style.display='block';btn.disabled=false;btn.textContent='Lưu';return;}
    // Delete old lines, re-insert
    await sb.from('dialogue_lines').delete().eq('dialogue_id',dialId);
  } else {
    const {data,error}=await sb.from('dialogues').insert({title,icon,difficulty:diff,sort_order:sort}).select().single();
    if(error){errEl.textContent='Lỗi: '+error.message;errEl.style.display='block';btn.disabled=false;btn.textContent='Lưu';return;}
    dialId=data.id;
  }
  if(lines.length){
    const linesPayload=lines.map((l,i)=>({dialogue_id:dialId,role:l.role,de:l.de,vi:l.vi,sort_order:i}));
    const {error}=await sb.from('dialogue_lines').insert(linesPayload);
    if(error){errEl.textContent='Lỗi khi lưu dòng thoại: '+error.message;errEl.style.display='block';btn.disabled=false;btn.textContent='Lưu';return;}
  }
  btn.disabled=false;btn.textContent='Lưu';
  closeDialogueModal();
  toast(editDialogueId?'✓ Đã cập nhật hội thoại!':'✓ Đã thêm hội thoại!');
  await loadDialogues();
}

async function deleteDialogue(id){
  confirm2('Xóa hội thoại này?','Tất cả dòng thoại bên trong cũng sẽ bị xóa.',async()=>{
    const {data,error}=await sb.from('dialogues').delete().eq('id',id).select();
    if(error){toast('Lỗi xóa: '+error.message,true);return;}
    if(!data||!data.length){toast('Lỗi: không xóa được — kiểm tra quyền Supabase',true);return;}
    toast('🗑️ Đã xóa hội thoại!');
    await loadDialogues();
  });
}

// ══════════════════════════════════════════════════════════
// LEVELS
// ══════════════════════════════════════════════════════════
async function loadLevels(){
  const {data,error}=await sb.from('levels').select('*').order('min_xp');
  if(error){toast('Lỗi: '+error.message,true);return;}
  const body=document.getElementById('levelsBody');
  if(!data||!data.length){body.innerHTML='<tr><td colspan="5" class="empty-row">Chưa có level nào.</td></tr>';return;}
  body.innerHTML=data.map(l=>`
    <tr>
      <td><strong>${l.min_xp}</strong> XP</td>
      <td>${esc(l.name)}</td>
      <td style="font-size:1.2rem;">${esc(l.emoji)}</td>
      <td style="color:var(--t3);">${l.sort_order}</td>
      <td class="td-actions">
        <button class="btn btn-blue btn-sm" onclick="openLevelModal(${JSON.stringify(l).replace(/"/g,'&quot;')})">✏️</button>
        <button class="btn btn-red btn-sm" onclick="deleteLevel(${l.id})">🗑️</button>
      </td>
    </tr>`).join('');
}

function openLevelModal(data=null){
  editLevelId = data?.id||null;
  document.getElementById('levelModalTitle').textContent = data?'Sửa level':'Thêm level';
  document.getElementById('levelModalErr').style.display='none';
  document.getElementById('lm-xp').value   = data?.min_xp??'';
  document.getElementById('lm-name').value = data?.name||'';
  document.getElementById('lm-emoji').value= data?.emoji||'⭐';
  document.getElementById('lm-sort').value = data?.sort_order??0;
  document.getElementById('levelModal').classList.add('on');
}
function closeLevelModal(){document.getElementById('levelModal').classList.remove('on');}
document.getElementById('levelModal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeLevelModal();});

async function saveLevel(){
  const xp   = parseInt(document.getElementById('lm-xp').value);
  const name = document.getElementById('lm-name').value.trim();
  const emoji= document.getElementById('lm-emoji').value.trim()||'⭐';
  const sort = parseInt(document.getElementById('lm-sort').value)||0;
  const errEl= document.getElementById('levelModalErr');
  errEl.style.display='none';
  if(isNaN(xp)||!name){errEl.textContent='Vui lòng điền Min XP và Tên.';errEl.style.display='block';return;}
  const btn=document.getElementById('lmSaveBtn');
  btn.disabled=true;btn.textContent='Đang lưu...';
  let error, data;
  if(editLevelId){
    ({data,error}=await sb.from('levels').update({min_xp:xp,name,emoji,sort_order:sort}).eq('id',editLevelId).select());
    if(!error&&(!data||!data.length)){errEl.textContent='Lỗi: không cập nhật được — kiểm tra quyền Supabase';errEl.style.display='block';btn.disabled=false;btn.textContent='Lưu';return;}
  } else {
    ({error}=await sb.from('levels').insert({min_xp:xp,name,emoji,sort_order:sort}));
  }
  btn.disabled=false;btn.textContent='Lưu';
  if(error){errEl.textContent='Lỗi: '+error.message;errEl.style.display='block';return;}
  closeLevelModal();
  toast(editLevelId?'✓ Đã cập nhật level!':'✓ Đã thêm level!');
  loadLevels();
}

async function deleteLevel(id){
  confirm2('Xóa level này?','',async()=>{
    const {data,error}=await sb.from('levels').delete().eq('id',id).select();
    if(error){toast('Lỗi xóa: '+error.message,true);return;}
    if(!data||!data.length){toast('Lỗi: không xóa được — kiểm tra quyền Supabase',true);return;}
    toast('🗑️ Đã xóa!'); loadLevels();
  });
}

// ══════════════════════════════════════════════════════════
// BADGES
// ══════════════════════════════════════════════════════════
async function loadBadges(){
  const {data,error}=await sb.from('badges').select('*').order('sort_order').order('id');
  if(error){toast('Lỗi: '+error.message,true);return;}
  const body=document.getElementById('badgesBody');
  if(!data||!data.length){body.innerHTML='<tr><td colspan="7" class="empty-row">Chưa có badge nào.</td></tr>';return;}
  body.innerHTML=data.map(b=>`
    <tr>
      <td style="font-size:1.2rem;">${esc(b.emoji)}</td>
      <td>${esc(b.name)}</td>
      <td style="color:var(--t3);font-size:.75rem;font-family:monospace;">${esc(b.code)}</td>
      <td style="color:var(--t2);font-size:.76rem;">${COND_LABELS[b.condition_type]||b.condition_type}</td>
      <td style="color:var(--yellow);font-weight:600;">${b.condition_value}</td>
      <td style="color:var(--t3);">${b.sort_order}</td>
      <td class="td-actions">
        <button class="btn btn-blue btn-sm" onclick="openBadgeModal(${JSON.stringify(b).replace(/"/g,'&quot;')})">✏️</button>
        <button class="btn btn-red btn-sm" onclick="deleteBadge(${b.id})">🗑️</button>
      </td>
    </tr>`).join('');
}

function openBadgeModal(data=null){
  editBadgeId = data?.id||null;
  document.getElementById('badgeModalTitle').textContent = data?'Sửa badge':'Thêm badge';
  document.getElementById('badgeModalErr').style.display='none';
  document.getElementById('bm-code').value  = data?.code||'';
  document.getElementById('bm-emoji').value = data?.emoji||'🏅';
  document.getElementById('bm-name').value  = data?.name||'';
  document.getElementById('bm-ctype').value = data?.condition_type||'xp';
  document.getElementById('bm-cval').value  = data?.condition_value??'';
  document.getElementById('bm-sort').value  = data?.sort_order??0;
  document.getElementById('badgeModal').classList.add('on');
}
function closeBadgeModal(){document.getElementById('badgeModal').classList.remove('on');}
document.getElementById('badgeModal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeBadgeModal();});

async function saveBadge(){
  const code  = document.getElementById('bm-code').value.trim();
  const emoji = document.getElementById('bm-emoji').value.trim()||'🏅';
  const name  = document.getElementById('bm-name').value.trim();
  const ctype = document.getElementById('bm-ctype').value;
  const cval  = parseInt(document.getElementById('bm-cval').value);
  const sort  = parseInt(document.getElementById('bm-sort').value)||0;
  const errEl = document.getElementById('badgeModalErr');
  errEl.style.display='none';
  if(!code||!name||isNaN(cval)){errEl.textContent='Vui lòng điền Code, Tên và Giá trị điều kiện.';errEl.style.display='block';return;}
  const btn=document.getElementById('bmSaveBtn');
  btn.disabled=true;btn.textContent='Đang lưu...';
  let error;
  const payload={code,emoji,name,condition_type:ctype,condition_value:cval,sort_order:sort};
  if(editBadgeId){
    ({error}=await sb.from('badges').update(payload).eq('id',editBadgeId));
  } else {
    ({error}=await sb.from('badges').insert(payload));
  }
  btn.disabled=false;btn.textContent='Lưu';
  if(error){errEl.textContent='Lỗi: '+error.message;errEl.style.display='block';return;}
  closeBadgeModal();
  toast(editBadgeId?'✓ Đã cập nhật badge!':'✓ Đã thêm badge!');
  loadBadges();
}

async function deleteBadge(id){
  confirm2('Xóa badge này?','',async()=>{
    const {data,error}=await sb.from('badges').delete().eq('id',id).select();
    if(error){toast('Lỗi xóa: '+error.message,true);return;}
    if(!data||!data.length){toast('Lỗi: không xóa được — kiểm tra quyền Supabase',true);return;}
    toast('🗑️ Đã xóa!'); loadBadges();
  });
}

// ══════════════════════════════════════════════════════════
// USERS (super_admin only)
// ══════════════════════════════════════════════════════════
async function loadUsers(){
  const body=document.getElementById('usersBody');
  body.innerHTML='<tr><td colspan="6" class="loading"><span class="spin"></span>Đang tải...</td></tr>';
  // Get profiles with auth emails via admin (only works if RLS allows)
  const {data,error}=await sb.from('profiles').select('*').order('created_at');
  if(error){body.innerHTML='<tr><td colspan="6" class="empty-row">Không thể tải (kiểm tra RLS)</td></tr>';return;}
  if(!data||!data.length){body.innerHTML='<tr><td colspan="6" class="empty-row">Chưa có người dùng nào.</td></tr>';return;}
  const roleCls={super_admin:'role-super',editor:'role-editor',viewer:'role-viewer',student:'role-student'};
  body.innerHTML=data.map(u=>`
    <tr>
      <td style="font-weight:600;">${esc(u.username)}</td>
      <td>${esc(u.full_name||'—')}</td>
      <td style="color:var(--t3);font-size:.75rem;">${esc(u.id)}</td>
      <td><span class="role-tag ${roleCls[u.role]||''}">${esc(u.role)}</span></td>
      <td style="color:var(--t3);font-size:.74rem;">${new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
      <td>
        <select class="role-select" onchange="changeUserRole('${u.id}',this.value)">
          ${ROLES.map(r=>`<option value="${r}" ${r===u.role?'selected':''}>${r}</option>`).join('')}
        </select>
      </td>
    </tr>`).join('');
}

async function changeUserRole(uid, role){
  const {error}=await sb.from('profiles').update({role}).eq('id',uid);
  if(error){toast('Lỗi đổi role: '+error.message,true);}
  else toast('✓ Đã đổi role!');
}

// ══════════════════════════════════════════════════════════
// SETTINGS — DIAGNOSTIC + SEED
// ══════════════════════════════════════════════════════════
function setSeedResult(html){document.getElementById('seedResult').innerHTML=html;}
function logSeed(msg){console.log('[seed]',msg);}

async function checkDB(){
  const btn=document.getElementById('checkDbBtn');
  btn.disabled=true;btn.textContent='Đang kiểm tra...';
  setSeedResult('<span style="color:var(--t2)">Đang kiểm tra Supabase…</span>');
  const lines=[];
  const ok=s=>`<span style="color:var(--green)">✓ ${s}</span>`;
  const fail=s=>`<span style="color:var(--red)">✗ ${s}</span>`;
  const warn=s=>`<span style="color:var(--yellow)">⚠ ${s}</span>`;

  // 1. Auth
  const {data:{user}}=await sb.auth.getUser();
  lines.push(user?ok('Đã đăng nhập: '+user.email):fail('Chưa đăng nhập'));

  // 2. Profile / role
  if(user){
    const {data:prof,error:pe}=await sb.from('profiles').select('role').eq('id',user.id).single();
    if(pe)lines.push(fail('Profile lỗi: '+pe.message));
    else lines.push(prof&&['super_admin','editor'].includes(prof.role)?ok('Role: '+prof.role):fail('Role không đủ quyền: '+(prof?.role||'?')));
  }

  // 3. Tables exist + read
  for(const tbl of ['phrases','dialogues','dialogue_lines','levels','badges']){
    const {count,error}=await sb.from(tbl).select('*',{count:'exact',head:true});
    if(error)lines.push(fail(`Bảng "${tbl}": ${error.message}`));
    else lines.push(ok(`Bảng "${tbl}": ${count} dòng`));
  }

  // 4. Write permission test
  const testRow={category:'__test__',group_name:'test',de:'test',vi:'test',sort_order:0};
  const {data:ins,error:insErr}=await sb.from('phrases').insert(testRow).select().single();
  if(insErr)lines.push(fail('Quyền INSERT phrases: '+insErr.message));
  else{
    lines.push(ok('Quyền INSERT phrases: OK'));
    const {error:delErr}=await sb.from('phrases').delete().eq('id',ins.id);
    lines.push(delErr?fail('Quyền DELETE phrases: '+delErr.message):ok('Quyền DELETE phrases: OK'));
  }

  // 5. Seed data check
  const sd=window.SEED_DATA_OBJ;
  if(!sd)lines.push(fail('window.SEED_DATA_OBJ: không tìm thấy (seed-data.js chưa load?)'));
  else{
    const cats=Object.keys(sd);
    const total=cats.reduce((s,c)=>s+sd[c].reduce((a,g)=>a+g.i.length,0),0);
    lines.push(ok(`Seed data: ${cats.length} danh mục, ${total} mục`));
  }
  const dialData=window.SEED_DIALOGUES;
  lines.push(dialData?ok(`Seed dialogues: ${dialData.length} hội thoại`):fail('window.SEED_DIALOGUES: không tìm thấy'));

  setSeedResult('<div style="line-height:1.9;font-size:.79rem;">'+lines.join('<br>')+'</div>');
  btn.disabled=false;btn.textContent='🔍 Kiểm tra kết nối';
}

async function seedPhrases(){
  const btn=document.getElementById('seedPhrasesBtn');
  const seedData=window.SEED_DATA_OBJ;
  if(!seedData||typeof seedData!=='object'||Array.isArray(seedData)){
    setSeedResult('<span style="color:var(--red)">✗ Không tìm thấy window.SEED_DATA_OBJ — seed-data.js chưa load?</span>');
    toast('Không tìm thấy seed data',true);return;
  }
  const cats=Object.keys(seedData).filter(c=>Array.isArray(seedData[c]));
  if(!cats.length){setSeedResult('<span style="color:var(--red)">✗ Seed data rỗng hoặc sai cấu trúc</span>');return;}

  btn.disabled=true;btn.textContent='Đang import...';
  showSeedProgress(0);
  let total=0;
  cats.forEach(c=>seedData[c].forEach(g=>total+=g.i.length));
  logSeed(`Bắt đầu import ${total} phrases / ${cats.length} danh mục`);

  let inserted=0,errs=[];
  for(const cat of cats){
    logSeed(`Xóa category: ${cat}`);
    const {error:delErr}=await sb.from('phrases').delete().eq('category',cat);
    if(delErr){
      const msg=`Xóa "${cat}" thất bại: ${delErr.message}`;
      logSeed('LỖI '+msg);errs.push(msg);continue;
    }
    for(const g of seedData[cat]){
      const batch=g.i.map((item,idx)=>({category:cat,group_name:g.g,de:item.de,vi:item.vi,note:item.n||null,sort_order:idx}));
      logSeed(`  Insert ${cat}/${g.g}: ${batch.length} mục`);
      const {error}=await sb.from('phrases').insert(batch);
      if(error){
        const msg=`Insert "${cat}/${g.g}" thất bại: ${error.message}`;
        logSeed('LỖI '+msg);errs.push(msg);continue;
      }
      inserted+=batch.length;
      showSeedProgress(Math.round(inserted/total*100));
    }
  }
  btn.disabled=false;btn.textContent='📥 Import Từ vựng & Cụm từ';
  hideSeedProgress();
  logSeed(`Xong: ${inserted} mục, ${errs.length} lỗi`);
  if(errs.length){
    setSeedResult(`<span style="color:var(--red)">✗ ${inserted} mục / ${errs.length} lỗi:</span><br><small style="color:var(--t2)">${errs.slice(0,5).map(e=>'• '+e).join('<br>')}${errs.length>5?`<br>... và ${errs.length-5} lỗi khác (xem console)`:''}</small>`);
    toast(`⚠️ Có ${errs.length} lỗi — xem kết quả`,true);
  } else {
    setSeedResult(`<span style="color:var(--green)">✓ Đã import ${inserted} mục từ vựng thành công!</span>`);
    toast('✓ Import từ vựng hoàn tất!');
  }
  await loadPhrases();filterPhrases();
  return errs.length===0;
}

async function seedDialogues(){
  const btn=document.getElementById('seedDialoguesBtn');
  const dials=window.SEED_DIALOGUES;
  if(!Array.isArray(dials)||!dials.length){
    setSeedResult('<span style="color:var(--red)">✗ Không tìm thấy window.SEED_DIALOGUES — seed-data.js chưa load?</span>');
    toast('Không tìm thấy seed dialogues',true);return;
  }
  btn.disabled=true;btn.textContent='Đang import...';
  showSeedProgress(0);
  logSeed(`Bắt đầu import ${dials.length} hội thoại`);

  let count=0,errs=[];
  for(let i=0;i<dials.length;i++){
    const d=dials[i];
    logSeed(`Xử lý hội thoại: "${d.title}"`);
    // Tìm dialogue đã tồn tại (bỏ qua lỗi .single() nếu không tìm thấy)
    const {data:existing,error:findErr}=await sb.from('dialogues').select('id').eq('title',d.title).maybeSingle();
    if(findErr){errs.push(`Tìm "${d.title}": ${findErr.message}`);continue;}

    let dialId;
    if(existing){
      dialId=existing.id;
      const {error:updErr}=await sb.from('dialogues').update({icon:d.icon||'💬',difficulty:d.diff||d.difficulty||'easy',sort_order:i}).eq('id',dialId);
      if(updErr){errs.push(`Cập nhật "${d.title}": ${updErr.message}`);continue;}
      const {error:delLErr}=await sb.from('dialogue_lines').delete().eq('dialogue_id',dialId);
      if(delLErr){errs.push(`Xóa lines "${d.title}": ${delLErr.message}`);continue;}
    } else {
      const {data:ins,error:insErr}=await sb.from('dialogues').insert({title:d.title,icon:d.icon||'💬',difficulty:d.diff||d.difficulty||'easy',sort_order:i}).select('id').single();
      if(insErr){errs.push(`Tạo "${d.title}": ${insErr.message}`);continue;}
      dialId=ins.id;
    }
    if(d.lines&&d.lines.length){
      const lp=d.lines.map((l,j)=>({dialogue_id:dialId,role:l.role,de:l.de,vi:l.vi,sort_order:j}));
      const {error:lInsErr}=await sb.from('dialogue_lines').insert(lp);
      if(lInsErr){errs.push(`Lines "${d.title}": ${lInsErr.message}`);continue;}
    }
    count++;
    showSeedProgress(Math.round((i+1)/dials.length*100));
  }
  btn.disabled=false;btn.textContent='📥 Import Hội thoại';
  hideSeedProgress();
  logSeed(`Xong: ${count} hội thoại, ${errs.length} lỗi`);
  if(errs.length){
    setSeedResult(`<span style="color:var(--red)">✗ ${count} hội thoại / ${errs.length} lỗi:</span><br><small style="color:var(--t2)">${errs.slice(0,5).map(e=>'• '+e).join('<br>')}${errs.length>5?`<br>... và ${errs.length-5} lỗi khác`:''}</small>`);
    toast(`⚠️ Có ${errs.length} lỗi khi import hội thoại`,true);
  } else {
    setSeedResult(`<span style="color:var(--green)">✓ Đã import ${count} hội thoại thành công!</span>`);
    toast('✓ Import hội thoại hoàn tất!');
  }
  await loadDialogues();
  return errs.length===0;
}

async function seedAll(){
  const btn=document.getElementById('seedAllBtn');
  btn.disabled=true;btn.textContent='Đang import tất cả...';
  setSeedResult('<span style="color:var(--t2)">Đang import…</span>');
  const okP=await seedPhrases();
  const okD=await seedDialogues();
  btn.disabled=false;btn.textContent='⚡ Import Tất cả';
  if(okP&&okD){
    setSeedResult('<span style="color:var(--green)">✓ Import tất cả hoàn tất!</span>');
    toast('✓ Đã import tất cả!');
  }
}

function showSeedProgress(pct){
  const w=document.getElementById('seedProgress');
  const f=document.getElementById('seedProgressFill');
  w.style.display='block';f.style.width=pct+'%';
}
function hideSeedProgress(){
  setTimeout(()=>{document.getElementById('seedProgress').style.display='none';},800);
}

async function confirmDeleteAll(tbl){
  confirm2(
    'Xóa tất cả '+tbl+'?',
    'Hành động này sẽ xóa TOÀN BỘ dữ liệu trong bảng "'+tbl+'". Không thể hoàn tác!',
    async()=>{
      const {error}=await sb.from(tbl).delete().neq('id',0);
      if(error){toast('Lỗi: '+error.message,true);return;}
      toast('🗑️ Đã xóa tất cả '+tbl+'!');
      if(tbl==='phrases'){await loadPhrases();filterPhrases();}
      else if(tbl==='dialogues') await loadDialogues();
    }
  );
}

// ══════════════════════════════════════════════════════════
// CONFIRM HELPER
// ══════════════════════════════════════════════════════════
let _confirmCb=null;
function confirm2(title,sub,cb){
  _confirmCb=cb;
  document.getElementById('confirmTitle').textContent=title;
  document.getElementById('confirmSub').textContent=sub||'Hành động này không thể hoàn tác.';
  document.getElementById('confirmModal').classList.add('on');
}
function closeConfirm(){document.getElementById('confirmModal').classList.remove('on');_confirmCb=null;}
async function executeConfirm(){
  const cb=_confirmCb;
  closeConfirm();
  if(cb) await cb();
}
document.getElementById('confirmModal').addEventListener('click',e=>{if(e.target===e.currentTarget)closeConfirm();});

// ══════════════════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════════════════
function esc(s){
  if(s==null)return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ══════════════════════════════════════════════════════════
// CSV IMPORT / EXPORT
// ══════════════════════════════════════════════════════════
function exportPhrasesCSV(){
  if(!allPhrases||!allPhrases.length){toast('Chưa có dữ liệu để xuất',true);return;}
  const headers=['de','vi','note','example','category','group','sort_order'];
  const rows=[headers];
  allPhrases.forEach(p=>rows.push([
    p.de,p.vi,p.note||'',p.example||'',p.category,p.group_name,p.sort_order||0
  ]));
  const csv=rows.map(r=>r.map(c=>{const s=String(c).replace(/"/g,'""');return /[,"\n\r]/.test(s)?`"${s}"`:s;}).join(',')).join('\r\n');
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download='pflegedeutsch_phrases_'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✓ Đã xuất '+allPhrases.length+' mục!');
}

async function importPhrasesCSV(file){
  if(!file)return;
  const resEl=document.getElementById('csv-import-result');
  resEl.style.display='block';resEl.style.color='var(--t2)';
  resEl.textContent='⏳ Đang đọc file...';
  let text;
  try{text=await file.text();}catch(e){resEl.style.color='var(--red)';resEl.textContent='Lỗi đọc file: '+e.message;return;}
  const lines=text.split(/\r?\n/);
  if(lines.length<2){resEl.style.color='var(--red)';resEl.textContent='File rỗng hoặc không đúng định dạng.';return;}
  const headers=parseCSVLine(lines[0]).map(h=>h.toLowerCase().trim());
  const required=['de','vi'];
  const missing=required.filter(h=>!headers.includes(h));
  if(missing.length){resEl.style.color='var(--red)';resEl.textContent='Thiếu cột bắt buộc: '+missing.join(', ')+'. Cần ít nhất: de, vi, category, group';return;}
  const idx={};headers.forEach((h,i)=>idx[h]=i);
  const rows=[];
  for(let i=1;i<lines.length;i++){
    if(!lines[i].trim())continue;
    const cols=parseCSVLine(lines[i]);
    const de=(cols[idx['de']]||'').trim();
    const vi=(cols[idx['vi']]||'').trim();
    if(!de||!vi)continue;
    const row={
      de,vi,
      category:(cols[idx['category']]||'vocab').trim(),
      group_name:(cols[idx['group']]||cols[idx['group_name']]||'Nhập CSV').trim(),
      sort_order:parseInt(cols[idx['sort_order']])||0,
      note:(cols[idx['note']]||'').trim()||null,
      example:(cols[idx['example']]||'').trim()||null,
    };
    rows.push(row);
  }
  if(!rows.length){resEl.style.color='var(--red)';resEl.textContent='Không tìm thấy dữ liệu hợp lệ.';return;}
  resEl.textContent=`⏳ Đang nhập ${rows.length} mục...`;
  const BATCH=50;let imported=0,errors=0;
  for(let i=0;i<rows.length;i+=BATCH){
    const batch=rows.slice(i,i+BATCH);
    const {error}=await sb.from('phrases').upsert(batch,{onConflict:'category,group_name,de'});
    if(error){errors+=batch.length;}else{imported+=batch.length;}
    resEl.textContent=`⏳ Đang nhập... ${Math.min(i+BATCH,rows.length)}/${rows.length}`;
  }
  resEl.style.color=errors?'var(--yellow)':'var(--green)';
  resEl.textContent=`✓ Nhập xong: ${imported} mục thành công${errors?' | '+errors+' lỗi':''}`;
  document.getElementById('csvFileInput').value='';
  toast(`✓ Nhập xong ${imported} mục!`);
  await loadPhrases();filterPhrases();
}
function parseCSVLine(line){
  const result=[];let field='',inQ=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"'){if(inQ&&line[i+1]==='"'){field+='"';i++;}else inQ=!inQ;}
    else if(c===','&&!inQ){result.push(field);field='';}
    else field+=c;
  }
  result.push(field);
  return result;
}

// ══════════════════════════════════════════════════════════
// AUTO-LOGIN CHECK
// ══════════════════════════════════════════════════════════
(async()=>{
  if(!window.supabase){
    showLoginErr('Lỗi: Không tải được thư viện Supabase. Kiểm tra kết nối mạng và tải lại trang.');
    return;
  }
  try {
    const {data:{session}} = await sb.auth.getSession();
    if(session){
      currentUser = session.user;
      await initApp();
    }
  } catch(e){
    showLoginErr('Lỗi kết nối Supabase: ' + (e.message||e));
  }
})();
