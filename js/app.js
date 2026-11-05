
const RANKS = ['رییس', 'کمک‌رییس', 'مسئول', 'عضو', 'کارآموز'];
const STORAGE_KEY = 'voxel_grouping_v5';

const DEFAULT_STUDENTS = [
  "محمدارمین ادمیزاد رنجبر", "امیرعلی افروز پور", "محمدفاضل امامی", "آراد ایزادی",
  "حسین ایمانی", "امیرحسین باز مانده", "سامان بهزادی", "محمدامین تخت روان",
  "پرهام جانی پور", "امیرعباس چار اختر", "امیرمحمد حسین پور", "سید عارف حسینی",
  "علی اکبر حیدرابادی", "ایلیا حیدرابادی", "یزدان خاکسار", "هادی خدادی",
  "امیرعلی خدای", "طاها خسروی", "یوسف خوش رفتار", "امیرعلی داوودی",
  "محمدطاها راینی پور", "طاها رنجبر", "علی روزدار", "رضا زاهدی",
  "سید محمد زهتاب", "محب سالار پور", "امیرعباس سعید", "امیرمحمد سلاجقه",
  "محمدرضا سنجری پور", "امید سیستانی پور", "علی شاهرحمانی", "امیرحسین قاسم پور",
  "امیرحسین کد خدا زاده", "امین معین الدینی", "حسام موسی پور", "امیرعباس میرزایی",
  "محمد یزدان میرمحمدی", "محمد مهدی همت زاده"
];

const VOXEL_MEMBERS = [
  { name: "پرهام جانی پور", role: "مسئول تست", rankName: "ارشد" },
  { name: "محمد یزدان میرمحمدی", role: "برنامه نویس", rankName: "مدیر،مالک" },
  { name: "امیرحسین قاسم پور", role: "مسئول تحقیقات", rankName: "عضو ذخیره" },
  { name: "محمدرضا سنجری پور", role: "طراح و هم دست", rankName: "مدیر ارشد" },
  { name: "سید محمد زهتاب", role: "کمک دست", rankName: "عضو ذخیره" },
  { name: "طاها خسروی", role: "هم دست و کمک کننده ی کار های اداری", rankName: "مدیر ارشد" }
];

let state = { students: [], groups: [] };
let currentGroupIdForAdd = null;

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{ state = JSON.parse(raw); }catch(e){ initDefault(); }
  }else{
    initDefault();
  }
}

function normalizeName(str) {
  return str.replace(/\s+/g, '').trim();
}

function initDefault(){
  state.students = DEFAULT_STUDENTS.map(function(name, i){
    return { id: 's' + i, name: name };
  });
  
  const voxelMembers = VOXEL_MEMBERS.map(function(vm, i){
    let studentObj = state.students.find(function(s){ 
      return normalizeName(s.name) === normalizeName(vm.name); 
    });
    if (!studentObj) {
      studentObj = { id: 's_voxel_' + i, name: vm.name };
      state.students.push(studentObj);
    }
    return { 
      studentId: studentObj.id, 
      rank: -1, 
      customRankName: vm.rankName,
      role: vm.role 
    };
  });

  state.groups = [{ 
    id: 'g0', 
    name: 'VOXEL Studio', 
    isDefault: true, 
    members: voxelMembers,
    task: null
  }];
  save();
}

function save(){ 
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); 
}

const $ = function(s){ return document.querySelector(s); };
const uid = function(p){ return p + Date.now().toString(36) + Math.random().toString(36).slice(2,6); };

function toast(msg, type){
  if(!type) type = 'success';
  const t = $('#toast');
  t.className = 'show ' + type;
  t.querySelector('span').textContent = msg;
  t.querySelector('i').className = type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-check';
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ t.className = ''; }, 2200);
}

function isAssigned(studentId){
  return state.groups.some(function(g){
    return g.members.some(function(m){ return m.studentId === studentId; });
  });
}

function render(){
  renderStudents();
  renderGroups();
  updateStats();
  save();
}

function updateStats(){
  const total = state.students.length;
  const assigned = state.students.filter(function(s){ return isAssigned(s.id); }).length;
  const groups = state.groups.length;
  $('#statTotal').textContent = total;
  $('#statAssigned').textContent = assigned;
  $('#statGroups').textContent = groups;
  $('#studentCount').textContent = total;
}

function renderStudents(){
  const list = $('#studentList');
  list.innerHTML = '';
  if(state.students.length === 0){
    list.innerHTML = '<div class="empty">هیچ دانش‌آموزی نیست</div>';
    return;
  }
  state.students.forEach(function(s){
    const assigned = isAssigned(s.id);
    const div = document.createElement('div');
    div.className = 'student-item' + (assigned ? ' assigned' : '');
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.title = s.name;
    nameSpan.textContent = s.name;
    
    const toolsDiv = document.createElement('div');
    toolsDiv.className = 'tools';
    
    const btnEdit = document.createElement('button');
    btnEdit.title = 'ویرایش';
    btnEdit.innerHTML = '<i class="fa-solid fa-pen"></i>';
    btnEdit.onclick = function(){ editStudent(s.id); };
    
    const btnDel = document.createElement('button');
    btnDel.className = 'del';
    btnDel.title = 'حذف';
    btnDel.innerHTML = '<i class="fa-solid fa-trash"></i>';
    btnDel.onclick = function(){ deleteStudent(s.id); };
    
    toolsDiv.appendChild(btnEdit);
    toolsDiv.appendChild(btnDel);
    div.appendChild(nameSpan);
    div.appendChild(toolsDiv);
    list.appendChild(div);
  });
}

function renderGroups(){
  const grid = $('#groupsGrid');
  grid.innerHTML = '';
  if(state.groups.length === 0){
    grid.innerHTML = '<div class="empty">هیچ گروهی ساخته نشده</div>';
    return;
  }
  state.groups.forEach(function(g){
    const card = document.createElement('div');
    card.className = 'group-card' + (g.isDefault ? ' default' : '');
    
    const head = document.createElement('div');
    head.className = 'group-head';
    const headLeft = document.createElement('div');
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'group-name';
    nameDiv.textContent = g.name;
    if(g.isDefault){
      const lock = document.createElement('i');
      lock.className = 'fa-solid fa-lock lock';
      nameDiv.appendChild(lock);
    }
    
    const metaDiv = document.createElement('div');
    metaDiv.className = 'group-meta';
    metaDiv.textContent = g.members.length + ' عضو';
    
    headLeft.appendChild(nameDiv);
    headLeft.appendChild(metaDiv);
    
    const actions = document.createElement('div');
    actions.className = 'group-actions';
    if(!g.isDefault) {
      const btnEdit = document.createElement('button');
      btnEdit.title = 'ویرایش نام';
      btnEdit.innerHTML = '<i class="fa-solid fa-pen"></i>';
      btnEdit.onclick = function(){ editGroup(g.id); };
      
      const btnDel = document.createElement('button');
      btnDel.className = 'del';
      btnDel.title = 'حذف گروه';
      btnDel.innerHTML = '<i class="fa-solid fa-trash"></i>';
      btnDel.onclick = function(){ deleteGroup(g.id); };
      
      actions.appendChild(btnEdit);
      actions.appendChild(btnDel);
    }
    head.appendChild(headLeft);
    head.appendChild(actions);
    
    const membersDiv = document.createElement('div');
    membersDiv.className = 'members';
    if(g.members.length === 0){
      membersDiv.innerHTML = '<div class="empty" style="padding:10px 0">هنوز عضوی اضافه نشده</div>';
    } else {
      g.members.forEach(function(m){
        const memberEl = createMemberElement(m, g.id, g.isDefault);
        membersDiv.appendChild(memberEl);
      });
    }
    
    card.appendChild(head);
    card.appendChild(membersDiv);
    
    if(g.task) {
      card.appendChild(renderTask(g));
    }
    
    if(!g.isDefault) {
      const btnAdd = document.createElement('button');
      btnAdd.className = 'btn btn-ghost btn-sm';
      btnAdd.style.justifyContent = 'center';
      btnAdd.innerHTML = '<i class="fa-solid fa-user-plus"></i> افزودن عضو';
      btnAdd.onclick = function(){ openAddMember(g.id); };
      card.appendChild(btnAdd);
    }
    
    const btnTask = document.createElement('button');
    btnTask.className = 'btn btn-ghost btn-sm';
    btnTask.style.justifyContent = 'center';
    btnTask.style.color = 'var(--orange)';
    btnTask.style.borderColor = 'var(--orange)';
    btnTask.innerHTML = '<i class="fa-solid fa-list-check"></i> ' + (g.task ? 'ویرایش وظیفه' : 'تعیین وظیفه');
    btnTask.onclick = function(){ openTask(g.id); };
    card.appendChild(btnTask);
    
    grid.appendChild(card);
  });
}

function createMemberElement(m, gid, isLocked){
  const student = state.students.find(function(s){ return s.id === m.studentId; });
  const name = student ? student.name : '—';
  
  const memberDiv = document.createElement('div');
  memberDiv.className = 'member';
  
  const topDiv = document.createElement('div');
  topDiv.className = 'member-top';
  
  const nameSpan = document.createElement('span');
  nameSpan.className = 'm-name';
  nameSpan.textContent = name;
  
  topDiv.appendChild(nameSpan);
  
  if(!isLocked) {
    const btnDel = document.createElement('button');
    btnDel.className = 'm-del';
    btnDel.title = 'حذف از گروه';
    btnDel.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    btnDel.onclick = function(){ removeMember(gid, m.studentId); };
    topDiv.appendChild(btnDel);
  }
  
  const roleDiv = document.createElement('div');
  roleDiv.className = 'member-row';
  
  const roleInput = document.createElement('input');
  roleInput.placeholder = 'شغل...';
  roleInput.value = m.role || '';
  if(!isLocked) {
    roleInput.onchange = function(){ setRole(gid, m.studentId, this.value); };
  } else {
    roleInput.readOnly = true;
    roleInput.style.opacity = '0.7';
  }
  roleDiv.appendChild(roleInput);
  
  const rankDiv = document.createElement('div');
  rankDiv.className = 'member-row';
  rankDiv.style.justifyContent = 'space-between';
  
  const rankBadge = document.createElement('span');
  
  if(isLocked) {
    rankBadge.className = 'rank-badge custom-rank';
    rankBadge.textContent = m.customRankName;
    rankDiv.appendChild(rankBadge);
  } else {
    const canUp = m.rank > 0;
    const canDown = m.rank < RANKS.length - 1;
    
    rankBadge.className = 'rank-badge rank-' + m.rank;
    rankBadge.textContent = RANKS[m.rank];
    
    const rankControls = document.createElement('div');
    rankControls.className = 'rank-controls';
    
    const btnUp = document.createElement('button');
    btnUp.title = 'ارتقا';
    btnUp.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
    if(!canUp) btnUp.disabled = true;
    btnUp.onclick = function(){ changeRank(gid, m.studentId, -1); };
    
    const btnDown = document.createElement('button');
    btnDown.title = 'تنزل';
    btnDown.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
    if(!canDown) btnDown.disabled = true;
    btnDown.onclick = function(){ changeRank(gid, m.studentId, 1); };
    
    rankControls.appendChild(btnUp);
    rankControls.appendChild(btnDown);
    rankDiv.appendChild(rankBadge);
    rankDiv.appendChild(rankControls);
  }
  
  if(isLocked) {
    rankDiv.appendChild(rankBadge);
  }
  
  memberDiv.appendChild(topDiv);
  memberDiv.appendChild(roleDiv);
  memberDiv.appendChild(rankDiv);
  
  return memberDiv;
}

function renderTask(g) {
  const taskBox = document.createElement('div');
  taskBox.className = 'task-box';
  if(Date.now() > g.task.deadline) {
    taskBox.classList.add('task-expired');
  }
  
  const header = document.createElement('div');
  header.className = 'task-header';
  header.innerHTML = '<span><i class="fa-solid fa-clock"></i> وظیفه محوله</span>';
  
  const text = document.createElement('div');
  text.className = 'task-text';
  text.textContent = g.task.text;
  
  const timer = document.createElement('div');
  timer.className = 'task-timer';
  timer.id = 'timer-' + g.id;
  timer.textContent = getTimeRemaining(g.task.deadline);
  
  taskBox.appendChild(header);
  taskBox.appendChild(text);
  taskBox.appendChild(timer);
  
  return taskBox;
}

function getTimeRemaining(deadline) {
  const diff = deadline - Date.now();
  if(diff <= 0) return 'زمان تمام شده';
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return m + ':' + (s < 10 ? '0' : '') + s;
}
setInterval(function(){
  state.groups.forEach(function(g){
    if(g.task) {
      const timerEl = document.getElementById('timer-' + g.id);
      if(timerEl) {
        timerEl.textContent = getTimeRemaining(g.task.deadline);
        if(Date.now() > g.task.deadline) {
          timerEl.parentElement.classList.add('task-expired');
          timerEl.classList.add('urgent');
        } else if (g.task.deadline - Date.now() < 60000) {
          timerEl.classList.add('urgent');
        }
      }
    }
  });
}, 1000);

function addStudent(){
  const inp = $('#newStudentInput');
  const name = inp.value.trim();
  if(!name) return toast('اسم خالیه', 'error');
  const exists = state.students.some(function(s){ return normalizeName(s.name) === normalizeName(name); });
  if(exists) return toast('این اسم قبلاً هست', 'error');
  state.students.push({ id: uid('s'), name: name });
  inp.value = '';
  render();
  toast('دانش‌آموز اضافه شد');
}

function editStudent(id){
  const s = state.students.find(function(x){ return x.id === id; });
  if(!s) return;
  const name = prompt('اسم جدید:', s.name);
  if(name === null) return;
  const trimmed = name.trim();
  if(!trimmed) return toast('اسم خالی مجاز نیست', 'error');
  s.name = trimmed;
  render();
  toast('ویرایش شد');
}

function deleteStudent(id){
  const s = state.students.find(function(x){ return x.id === id; });
  if(!s) return;
  if(!confirm('«' + s.name + '» حذف بشه؟')) return;
  state.groups.forEach(function(g){
    g.members = g.members.filter(function(m){ return m.studentId !== id; });
  });
  state.students = state.students.filter(function(x){ return x.id !== id; });
  render();
  toast('حذف شد');
}

function addGroup(){
  const name = prompt('اسم گروه جدید:');
  if(name === null) return;
  const trimmed = name.trim();
  if(!trimmed) return toast('اسم خالی مجاز نیست', 'error');
  const exists = state.groups.some(function(g){ return g.name === trimmed; });
  if(exists) return toast('این اسم گروه قبلاً هست', 'error');
  state.groups.push({ id: uid('g'), name: trimmed, members: [], task: null });
  render();
  toast('گروه ساخته شد');
}

function editGroup(id){
  const g = state.groups.find(function(x){ return x.id === id; });
  if(!g || g.isDefault) return;
  const name = prompt('اسم جدید گروه:', g.name);
  if(name === null) return;
  const trimmed = name.trim();
  if(!trimmed) return toast('اسم خالی مجاز نیست', 'error');
  g.name = trimmed;
  render();
  toast('نام گروه ویرایش شد');
}

function deleteGroup(id){
  const g = state.groups.find(function(x){ return x.id === id; });
  if(!g || g.isDefault) return;
  if(!confirm('گروه «' + g.name + '» با همه اعضا حذف بشه؟')) return;
  state.groups = state.groups.filter(function(x){ return x.id !== id; });
  render();
  toast('گروه حذف شد');
}

function openAddMember(gid){
  const g = state.groups.find(function(x){ return x.id === gid; });
  if(!g || g.isDefault) return;
  
  const free = state.students.filter(function(s){ return !isAssigned(s.id); });
  if(free.length === 0) return toast('همه دانش‌آموزها تو گروهی هستن', 'error');

  currentGroupIdForAdd = gid;
  $('#memberSearchInput').value = '';
  renderFreeStudentsList();
  $('#addMemberModal').classList.add('open');
  setTimeout(function(){ $('#memberSearchInput').focus(); }, 100);
}

function closeAddMember(){
  $('#addMemberModal').classList.remove('open');
  currentGroupIdForAdd = null;
}

function renderFreeStudentsList() {
  const list = $('#freeStudentsList');
  const query = normalizeName($('#memberSearchInput').value);
  list.innerHTML = '';

  const free = state.students.filter(function(s){ return !isAssigned(s.id); });
  
  const filtered = free.filter(function(s){
    return normalizeName(s.name).indexOf(query) !== -1;
  });

  if(filtered.length === 0) {
    list.innerHTML = '<div class="empty" style="padding:15px 0">دانش‌آموزی پیدا نشد</div>';
    return;
  }
  filtered.forEach(function(s){
    const div = document.createElement('div');
    div.className = 'select-item';
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = s.name;
    
    const btn = document.createElement('button');
    btn.className = 'btn-add';
    btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
    btn.onclick = function(){ addMemberToGroup(s.id); };
    
    div.appendChild(nameSpan);
    div.appendChild(btn);
    list.appendChild(div);
  });
}

function filterMembers() {
  renderFreeStudentsList();
}

function addMemberToGroup(sid) {
  const g = state.groups.find(function(x){ return x.id === currentGroupIdForAdd; });
  if(!g) return;

  g.members.push({ studentId: sid, rank: 3, role: '' });
  
  if(g.members.length < 3){
    toast('گروه شد ' + g.members.length + ' نفره (حداقل ۳ نفره)', 'error');
  } else {
    toast('عضو اضافه شد');
  }
  
  render();
  closeAddMember();
}

function removeMember(gid, sid){
  const g = state.groups.find(function(x){ return x.id === gid; });
  if(!g || g.isDefault) return;
  g.members = g.members.filter(function(m){ return m.studentId !== sid; });
  render();
  toast('از گروه حذف شد');
}

function setRole(gid, sid, val){
  const g = state.groups.find(function(x){ return x.id === gid; });
  if(!g || g.isDefault) return;
  const m = g.members.find(function(x){ return x.studentId === sid; });
  if(!m) return;
  m.role = val;
  save();
}

function changeRank(gid, sid, delta){
  const g = state.groups.find(function(x){ return x.id === gid; });
  if(!g || g.isDefault) return;
  const m = g.members.find(function(x){ return x.studentId === sid; });
  if(!m) return;
  const newRank = m.rank + delta;
  if(newRank < 0 || newRank >= RANKS.length) return;
  m.rank = newRank;
  render();
}

function openTask(gid) {
  const g = state.groups.find(function(x){ return x.id === gid; });
  if(!g) return;
  const text = prompt('متن وظیفه را وارد کنید:');
  if(text === null || text.trim() === '') return;
  const minsStr = prompt('چند دقیقه فرصت دارید؟ (عدد بزنید)');
  if(minsStr === null) return;
  const mins = parseInt(minsStr);
  if(isNaN(mins) || mins <= 0) return toast('زمان نامعتبر', 'error');
  const deadline = Date.now() + (mins * 60000);
  g.task = { text: text.trim(), deadline: deadline };
  save();
  render();
  toast('وظیفه تعیین شد');
}

function openAbout(){ $('#aboutModal').classList.add('open'); }
function closeAbout(){ $('#aboutModal').classList.remove('open'); }

load();
render();