// ── DATA ──
const projects=[
  {id:1,name:'信義區住宅改造',client:'陳先生',date:'2025-06-01',designer:'王設計師',email:'designer.wang@gmail.com',note:'3F/4F 複合式住宅',status:'inprogress'},
  {id:2,name:'大安區辦公室設計',client:'科技新創有限公司',date:'2025-05-20',designer:'林設計師',email:'designer.lin@gmail.com',note:'整層辦公室翻修',status:'inprogress'},
  {id:3,name:'內湖透天厝新建',client:'林太太',date:'2025-04-15',designer:'陳設計師',email:'designer.chen@gmail.com',note:'B1~4F 全棟',status:'done'},
];
const people=[
  {name:'王設計師',email:'designer.wang@gmail.com'},
  {name:'林設計師',email:'designer.lin@gmail.com'},
  {name:'陳設計師',email:'designer.chen@gmail.com'},
  {name:'李設計師',email:'designer.li@gmail.com'},
  {name:'張設計師',email:'designer.chang@gmail.com'},
];
const trades=['油漆','泥作','水電','木工','系統櫃','玻璃','鐵件','清潔','其他'];
const defects={
  1:[
    {id:1,trade:'油漆',content:'主臥室牆面批土不平整，需重新處理',qty:'1 式',status:'pending',deadline:'2025-06-10',note:'師傅王大明負責'},
    {id:2,trade:'泥作',content:'廚房磁磚縫隙填縫不均勻',qty:'3 m²',status:'pending',deadline:'2025-06-08',note:''},
    {id:3,trade:'木工',content:'客廳木地板收邊條未固定',qty:'1 處',status:'done',deadline:'2025-06-05',note:'已完工確認'},
    {id:4,trade:'水電',content:'衛浴門縫隙過大，防水不足',qty:'1 樘',status:'pending',deadline:'2025-06-12',note:'需更換密封條'},
    {id:5,trade:'系統櫃',content:'主臥更衣室層架安裝角度偏斜',qty:'2 組',status:'done',deadline:'2025-06-03',note:''},
  ],
  2:[
    {id:1,trade:'水電',content:'會議室天花板燈具安裝偏位',qty:'4 盞',status:'pending',deadline:'2025-06-15',note:''},
    {id:2,trade:'泥作',content:'接待區地板大理石紋路未對齊',qty:'6 m²',status:'pending',deadline:'2025-06-20',note:'重新排列'},
    {id:3,trade:'水電',content:'茶水間排水管漏水',qty:'1 處',status:'pending',deadline:'2025-06-09',note:'需優先安排'},
  ],
  3:[
    {id:1,trade:'油漆',content:'外牆塗料顏色與設計稿不符',qty:'全棟',status:'done',deadline:'2025-04-20',note:'已重新噴漆'},
    {id:2,trade:'泥作',content:'屋頂防水層施工不完整',qty:'1 式',status:'done',deadline:'2025-04-25',note:''},
  ],
};
const addendum={
  1:[
    {id:1,trade:'水電',content:'業主要求增加主臥衛浴暖風機',qty:'1 台',status:'pending',deadline:'2025-06-20',note:'需業主確認品牌'},
    {id:2,trade:'水電',content:'玄關增設感應式燈帶',qty:'3 m',status:'pending',deadline:'2025-06-18',note:''},
    {id:3,trade:'木工',content:'廚房增加中島吧台',qty:'1 式',status:'done',deadline:'2025-06-15',note:'報價已確認'},
  ],
  2:[
    {id:1,trade:'玻璃',content:'辦公室增設隔音玻璃隔間',qty:'1 式',status:'pending',deadline:'2025-06-25',note:''},
  ],
  3:[],
};

const GAS_REMINDER_ENDPOINT='';
const firebaseConfig=window.SHANCHUAN_FIREBASE_CONFIG||null;
let firebaseAuth=null,firebaseDb=null,firebaseStorage=null;
let curProjId=1,curFilter='all',defectQuery='',currentPhoto='',currentPhotoFile=null,pendingDefectData=null;
let projectQuery='',projectDesignerFilter='',projectStatusFilter='',defectDesignerFilter='',calendarProjectFilter='';
let editingProjectId=null,editingDefectId=null,editingAddendumId=null;
let pendingDelete=null;

// ── LOGIN ──
function initFirebaseServices(){
  if(firebaseAuth&&firebaseDb&&firebaseStorage) return {auth:firebaseAuth,db:firebaseDb,storage:firebaseStorage};
  if(!window.firebase) return null;
  if(!firebaseConfig?.apiKey) throw new Error('Firebase 設定尚未載入，請建立 public/prototype/firebase-config.js');
  const app=window.firebase.apps?.length?window.firebase.app():window.firebase.initializeApp(firebaseConfig);
  firebaseAuth=window.firebase.auth(app);
  firebaseDb=window.firebase.firestore(app);
  firebaseStorage=window.firebase.storage(app);
  return {auth:firebaseAuth,db:firebaseDb,storage:firebaseStorage};
}

function initFirebaseAuth(){
  return initFirebaseServices()?.auth||null;
}

function normalizeProject(doc){
  const data=doc.data();
  return {
    id:Number(data.id||doc.id),
    name:data.name||'未命名專案',
    client:data.client||'待填寫',
    date:data.date||new Date().toISOString().split('T')[0],
    designer:data.designer||'未指定',
    email:data.email||'',
    note:data.note||'',
    status:data.status||'inprogress'
  };
}

function normalizeItem(doc){
  const data=doc.data();
  return {
    id:Number(data.id||doc.id),
    trade:data.trade||'其他',
    content:data.content||'',
    qty:data.qty||'',
    status:data.status||'pending',
    deadline:data.deadline||'',
    photo:data.photo||'',
    note:data.note||''
  };
}

function normalizeMember(doc){
  const data=doc.data();
  const name=data.name||data.memberName||data.displayName||data.Name||data['姓名'];
  const email=data.email||data.mail||data.Email||data['信箱'];
  return {
    id:doc.id,
    name:String(name||'').trim(),
    email:String(email||'').trim(),
    role:String(data.role||'member').trim().toLowerCase(),
    active:data.active!==false
  };
}

function docData(data){
  return {...data,updatedAt:new Date().toISOString()};
}

function getCloudErrorMessage(error){
  const code=error?.code||'';
  if(code.includes('permission-denied')) return 'Firebase 規則目前不允許寫入，請確認 Firestore Rules 是否允許已登入使用者讀寫。';
  if(code.includes('not-found')) return '找不到 Firestore Database，請確認 Cloud Firestore 已建立完成，而且目前看的 Firebase 專案是 shanshanchuan-check-dashboard。';
  if(code.includes('unavailable')) return 'Firebase 連線暫時失敗，請確認網路後再試一次。';
  if(code.includes('unauthenticated')) return '目前尚未完成登入，請重新登入後再儲存。';
  return error?.message||'Firebase 寫入失敗，請稍後再試。';
}

function showCloudError(error){
  console.error('Firebase sync failed',error);
  alert(getCloudErrorMessage(error));
}

function showPhotoUploadWarning(error){
  console.warn('Photo upload skipped',error);
  alert('照片目前無法上傳，缺失資料會先儲存。等 Storage 設定完成後，再補上照片即可。');
}

function setMembersStatus(message,type=''){
  const el=document.getElementById('members-status');
  if(!el) return;
  el.textContent=message;
  el.classList.toggle('ok',type==='ok');
  el.classList.toggle('warn',type==='warn');
}

async function loadFirebaseData(){
  if(!firebaseDb) return;
  await loadMembersData();
  const snapshot=await firebaseDb.collection('projects').get();
  if(snapshot.empty){
    populatePeopleList();
    return;
  }

  projects.splice(0,projects.length);
  Object.keys(defects).forEach(key=>delete defects[key]);
  Object.keys(addendum).forEach(key=>delete addendum[key]);

  for(const projectDoc of snapshot.docs){
    const project=normalizeProject(projectDoc);
    projects.push(project);

    const defectSnapshot=await projectDoc.ref.collection('defects').get();
    defects[project.id]=defectSnapshot.docs
      .map(normalizeItem)
      .sort((a,b)=>new Date(a.deadline||'2999-12-31')-new Date(b.deadline||'2999-12-31'));

    const addendumSnapshot=await projectDoc.ref.collection('addendums').get();
    addendum[project.id]=addendumSnapshot.docs
      .map(normalizeItem)
      .sort((a,b)=>new Date(a.deadline||'2999-12-31')-new Date(b.deadline||'2999-12-31'));
  }

  projects.sort((a,b)=>new Date(b.date)-new Date(a.date));
  curProjId=projects[0]?.id||0;
  populatePeopleList();
}

async function loadMembersData(){
  setMembersStatus('正在讀取 members...', '');
  try{
    if(!firebaseDb){
      initFirebaseServices();
    }
    if(!firebaseDb){
      setMembersStatus('Firebase 尚未準備完成，先使用預設名單。','warn');
      return;
    }
    const snapshot=await firebaseDb.collection('members').get();
    if(snapshot.empty){
      setMembersStatus('Firestore 的 members 集合目前沒有資料，先使用預設名單。','warn');
      return;
    }
    const rawMembers=snapshot.docs.map(normalizeMember);
    const members=rawMembers.filter(member=>member.active&&member.name&&member.email);
    if(!members.length){
      setMembersStatus('members 已讀到，但缺少 name / email / active 欄位，先使用預設名單。','warn');
      console.warn('Members documents were found but not usable',rawMembers);
      return;
    }
    console.info('Loaded members from Firestore',members);
    people.splice(0,people.length,...members.map(({name,email,role})=>({name,email,role})));
    setMembersStatus(`已從 Firestore 載入 ${members.length} 位 members。`,'ok');
  }catch(error){
    console.error('Failed to load members',error);
    setMembersStatus('members 讀取失敗，請確認 Firestore 規則允許讀取。','warn');
  }
}

function refreshCurrentView(){
  populateSmartFilters();
  populateProjectSelects();
  renderDashboard();
  renderProjects();
  syncProjectHeader();
  renderProjectTabs('defect-project-tabs');
  renderDefects();
  renderProjectTabs('pdf-project-tabs');
  renderPDF();
  updateBadges();
}

async function saveProjectCloud(project){
  if(!firebaseDb) return;
  await firebaseDb.collection('projects').doc(String(project.id)).set(docData(project),{merge:true});
}

async function saveDefectCloud(projectId,item){
  if(!firebaseDb) return;
  const project=projects.find(p=>p.id===projectId);
  if(project) await saveProjectCloud(project);
  await firebaseDb.collection('projects').doc(String(projectId))
    .collection('defects').doc(String(item.id)).set(docData(item),{merge:true});
}

async function saveAddendumCloud(projectId,item){
  if(!firebaseDb) return;
  const project=projects.find(p=>p.id===projectId);
  if(project) await saveProjectCloud(project);
  await firebaseDb.collection('projects').doc(String(projectId))
    .collection('addendums').doc(String(item.id)).set(docData(item),{merge:true});
}

async function deleteCloudRecord(type,id,projectId=curProjId){
  if(!firebaseDb) return;
  if(type==='project'){
    const ref=firebaseDb.collection('projects').doc(String(id));
    const [defectSnapshot,addendumSnapshot]=await Promise.all([
      ref.collection('defects').get(),
      ref.collection('addendums').get()
    ]);
    const batch=firebaseDb.batch();
    defectSnapshot.docs.forEach(doc=>batch.delete(doc.ref));
    addendumSnapshot.docs.forEach(doc=>batch.delete(doc.ref));
    batch.delete(ref);
    await batch.commit();
    return;
  }
  const collection=type==='addendum'?'addendums':'defects';
  await firebaseDb.collection('projects').doc(String(projectId))
    .collection(collection).doc(String(id)).delete();
}

async function uploadDefectPhoto(projectId,defectId,file){
  if(!firebaseStorage||!file) return currentPhoto;
  const safeName=file.name.replace(/[^\w.-]+/g,'-');
  const ref=firebaseStorage.ref(`projects/${projectId}/defects/${defectId}/${Date.now()}-${safeName}`);
  await ref.put(file);
  return ref.getDownloadURL();
}

function getLoginErrorMessage(error){
  const code=error?.code||'';
  if(code.includes('invalid-credential')||code.includes('wrong-password')) return 'Email 或密碼不正確，請再確認一次。';
  if(code.includes('user-not-found')) return '找不到這個帳號，請先到 Firebase Authentication 建立使用者。';
  if(code.includes('too-many-requests')) return '嘗試次數過多，請稍後再試或重設密碼。';
  if(code.includes('network-request-failed')) return '網路連線失敗，請確認網路後再試。';
  return '登入失敗，請確認 Firebase 已啟用 Email/Password 登入。';
}

async function handleLogin(e){
  e.preventDefault();
  const btn=e.target.querySelector('button[type=submit]');
  const err=document.getElementById('login-error');
  const email=document.getElementById('login-email').value.trim();
  const password=document.getElementById('login-password').value;
  if(err){
    err.classList.add('is-hidden');
    err.textContent='';
  }
  btn.textContent='登入中…';
  btn.disabled=true;
  try{
    const auth=initFirebaseAuth();
    if(!auth) throw new Error('Firebase SDK 尚未載入');
    await auth.signInWithEmailAndPassword(email,password);
    await loadFirebaseData();
    refreshCurrentView();
    showPage('app');
    showView('projects');
  }catch(error){
    if(err){
      err.textContent=getLoginErrorMessage(error);
      err.classList.remove('is-hidden');
    }
    btn.textContent='登入';
    btn.disabled=false;
  }
}

function restoreAuthSession(){
  if(!window.firebase||!firebaseConfig?.apiKey) return;
  let auth;
  try{
    auth=initFirebaseAuth();
  }catch(error){
    console.warn('Firebase auth restore skipped',error);
    return;
  }
  if(!auth) return;
  auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL).catch(console.warn);
  auth.onAuthStateChanged(async user=>{
    if(!user) return;
    try{
      await loadFirebaseData();
      refreshCurrentView();
      showPage('app');
      showView('projects');
    }catch(error){
      showCloudError(error);
    }
  });
}

async function logout(){
  try{
    const auth=initFirebaseAuth();
    if(auth) await auth.signOut();
  }catch(error){
    console.warn('Logout skipped',error);
  }
  showPage('login');
  const password=document.getElementById('login-password');
  if(password) password.value='';
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
}

// ── VIEWS ──
function showView(name){
  ['projects','defects','pdf'].forEach(v=>{
    const el=document.getElementById('view-'+v);
    if(el) el.classList.add('is-hidden');
  });
  document.getElementById('view-'+name).classList.remove('is-hidden');

  const titles={projects:'所有專案',defects:'缺失紀錄',pdf:'驗收報告'};
  document.getElementById('topbar-title').textContent=titles[name]||name;
  document.getElementById('back-btn').classList.toggle('is-hidden',name==='projects');

  // sidebar highlight
  document.querySelectorAll('[id^="snav-"]').forEach(n=>n.classList.remove('active'));
  const sn=document.getElementById('snav-'+name);
  if(sn) sn.classList.add('active');

  // topbar action button
  const ab=document.getElementById('topbar-action-btn');
  if(name==='projects'){
    ab.classList.remove('is-hidden');
    ab.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" class="icon-line" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 新增專案';
  } else if(name==='defects'){
    ab.classList.remove('is-hidden');
    ab.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" class="icon-line" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 新增缺失';
  } else if(name==='pdf'){
    ab.classList.remove('is-hidden');
    ab.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" class="icon-line" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 新增追加';
  } else {
    ab.classList.add('is-hidden');
  }

  if(name==='projects'){
    populateSmartFilters();
    renderDashboard();
    renderProjects();
  }
  if(name==='defects'){
    populateSmartFilters();
    syncProjectHeader();
    renderProjectTabs('defect-project-tabs');
    renderProjectSchedule();
    renderDefects();
  }
  if(name==='pdf'){
    renderProjectTabs('pdf-project-tabs');
    renderPDF();
  }
}

function scrollContentTop(){
  const content=document.querySelector('.content');
  if(content) content.scrollTo({top:0,behavior:'smooth'});
}

function handleTopAction(){
  const t=document.getElementById('topbar-title').textContent;
  if(t==='所有專案') openOv('project');
  else if(t==='缺失紀錄') openOv('defect');
  else if(t==='驗收報告') openOv('addendum');
}

function setMnav(el){
  document.querySelectorAll('.mnav-item').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
}

// ── RENDER PROJECTS ──
function renderProjects(q=projectQuery){
  projectQuery=q;
  const list=document.getElementById('project-list');
  const filtered=projects
    .filter(p=>!q||p.name.includes(q)||p.client.includes(q)||(p.designer||'').includes(q))
    .filter(p=>!projectDesignerFilter||(p.designer||'')===projectDesignerFilter)
    .filter(p=>!projectStatusFilter||p.status===projectStatusFilter)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!filtered.length){
    list.innerHTML=`<div class="empty"><div class="empty-icon"><svg width="44" height="44" viewBox="0 0 24 24" class="icon-line" stroke-width="1.2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8M12 3v4"/></svg></div><div class="empty-title">找不到符合的專案</div><div class="empty-desc">試試其他關鍵字</div></div>`;
    return;
  }
  const statusCls={inprogress:'tag-progress',done:'tag-done',pending:'tag-pending'};
  const statusLbl={inprogress:'進行中',done:'已完成',pending:'待處理'};
  list.innerHTML=filtered.map(p=>{
    const d=defects[p.id]||[];
    const done=d.filter(x=>x.status==='done').length;
    const pct=d.length?Math.round(done/d.length*100):0;
    return `<div class="project-card" onclick="openProject(${p.id})">
      <div>
        <div class="project-name">${p.name}</div>
        <div class="project-client">${p.client} · ${p.designer||'未指定設計師'}</div>
        <div class="project-tags">
          <span class="tag ${statusCls[p.status]}">${statusLbl[p.status]}</span>
          <span class="tag tag-neutral">
            <svg width="10" height="10" viewBox="0 0 24 24" class="icon-line" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${p.date}
          </span>
        </div>
      </div>
      <div class="project-right">
        <div class="prog-label">${done}/${d.length} 完成</div>
        <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
        <button class="mini-action" onclick="event.stopPropagation();openOv('project',${p.id})">編輯</button>
        <button class="mini-action mini-danger" onclick="event.stopPropagation();requestDelete('project',${p.id})">刪除</button>
      </div>
    </div>`;
  }).join('');
}

function renderDashboard(){
  const allDefects=Object.values(defects).flat();
  const active=projects.filter(p=>p.status!=='done').length;
  const pending=allDefects.filter(x=>x.status==='pending').length;
  const done=allDefects.filter(x=>x.status==='done').length;
  document.getElementById('stat-active-projects').textContent=active;
  document.getElementById('stat-pending-defects').textContent=pending;
  document.getElementById('stat-done-defects').textContent=done;
  renderDashboardVisuals(allDefects,done,pending);

  const recent=projects.flatMap(p=>(defects[p.id]||[])
    .filter(x=>isDueSoonDefect(x))
    .map(x=>({...x,projectId:p.id,project:p.name,designer:p.designer||'未指定'})))
    .sort((a,b)=>new Date(a.deadline||'2999-12-31')-new Date(b.deadline||'2999-12-31'))
    .slice(0,5);
  document.getElementById('overview-list').innerHTML=recent.length?recent.map(x=>`
    <button class="overview-item due-soon-item" onclick="openDueSoonDefect(${x.projectId},${x.id})">
      <div>
        <strong>即將到期｜${x.content}</strong>
        <span>${x.project} · ${x.designer} · ${x.trade||'其他'}</span>
      </div>
      <small>${x.deadline?`期限 ${x.deadline}`:'未設期限'}</small>
    </button>
  `).join(''):'<div class="empty-inline">目前沒有即將到期事件</div>';

  populateCalendarProjectFilter();
  const events=projects
    .filter(p=>!calendarProjectFilter||String(p.id)===calendarProjectFilter)
    .flatMap(p=>(defects[p.id]||[])
    .filter(x=>x.status==='pending'&&x.deadline)
    .map(x=>({projectId:p.id,project:p.name,date:x.deadline,title:x.content})))
    .sort((a,b)=>new Date(a.date)-new Date(b.date))
  renderCalendar(events);
}

function isDueSoonDefect(item){
  if(!item||item.status!=='pending') return false;
  if(!item.deadline) return false;
  const today=new Date();
  const deadline=new Date(item.deadline);
  return (deadline-today)/86400000<3;
}

function openDueSoonDefect(projectId,defectId){
  curProjId=projectId;
  showView('defects');
  setDefectFilter('dueSoon');
  setTimeout(()=>{
    const card=document.querySelector(`[data-defect-id="${defectId}"]`);
    if(card) card.scrollIntoView({behavior:'smooth',block:'center'});
  },0);
}

function renderDashboardVisuals(allDefects,done,pending){
  const total=allDefects.length;
  const rate=total?Math.round(done/total*100):0;
  const ring=document.getElementById('completion-ring');
  if(ring) ring.style.setProperty('--pct',rate);
  const rateEl=document.getElementById('completion-rate');
  if(rateEl) rateEl.textContent=rate+'%';
  const meta=document.getElementById('completion-meta');
  if(meta){
    meta.innerHTML=`
      <div><strong>${total}</strong><span>全部項目</span></div>
      <div><strong>${pending}</strong><span>待改善</span></div>
      <div><strong>${done}</strong><span>已完成</span></div>
    `;
  }
  const pendingByTrade=trades.map(trade=>({
    trade,
    count:allDefects.filter(x=>x.status==='pending'&&(x.trade||'其他')===trade).length
  })).filter(x=>x.count>0).slice(0,5);
  const max=Math.max(1,...pendingByTrade.map(x=>x.count));
  const bars=document.getElementById('trade-bars');
  if(bars){
    bars.innerHTML=pendingByTrade.length?pendingByTrade.map(x=>`
      <div class="trade-bar-row">
        <span>${x.trade}</span>
        <div class="trade-bar-track"><div style="width:${Math.max(10,Math.round(x.count/max*100))}%"></div></div>
        <strong>${x.count}</strong>
      </div>
    `).join(''):'<div class="empty-inline">目前沒有待改善工種</div>';
  }
}

function renderCalendar(events){
  const base=events[0]?.date?new Date(events[0].date):new Date();
  const year=base.getFullYear();
  const month=base.getMonth();
  const first=new Date(year,month,1);
  const days=new Date(year,month+1,0).getDate();
  const offset=first.getDay();
  const byDate=events.reduce((acc,e)=>{
    acc[e.date]=acc[e.date]||[];
    acc[e.date].push(e);
    return acc;
  },{});
  let cells='<div class="calendar-head">日</div><div class="calendar-head">一</div><div class="calendar-head">二</div><div class="calendar-head">三</div><div class="calendar-head">四</div><div class="calendar-head">五</div><div class="calendar-head">六</div>';
  for(let i=0;i<offset;i++) cells+='<div class="calendar-day muted"></div>';
  for(let day=1;day<=days;day++){
    const date=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const count=(byDate[date]||[]).length;
    cells+=`<button class="calendar-day ${count?'has-event':''}" onclick="selectCalendarDate('${date}')">
      <span>${day}</span>${count?`<small>${count}</small>`:''}
    </button>`;
  }
  document.getElementById('calendar-list').innerHTML=`<div class="calendar-month">${year}/${String(month+1).padStart(2,'0')}</div><div class="calendar-grid">${cells}</div>`;
  document.getElementById('calendar-detail').textContent='點選日期查看待辦細節';
}

function selectCalendarDate(date){
  const events=projects
    .filter(p=>!calendarProjectFilter||String(p.id)===calendarProjectFilter)
    .flatMap(p=>(defects[p.id]||[])
    .filter(x=>x.status==='pending'&&x.deadline===date)
    .map(x=>({project:p.name,title:x.content,trade:x.trade||'其他'})));
  document.getElementById('calendar-detail').innerHTML=events.length
    ? `<strong>${date}</strong>${events.map(e=>`<div>${e.project}｜${e.trade}｜${e.title}</div>`).join('')}`
    : `<strong>${date}</strong><div>當天沒有待辦缺失</div>`;
}

function populateCalendarProjectFilter(){
  const select=document.getElementById('calendar-project-filter');
  if(!select) return;
  select.innerHTML='<option value="">全部專案</option>'+projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  select.value=calendarProjectFilter;
}

function filterCalendarProject(v){
  calendarProjectFilter=v;
  renderDashboard();
}

function handleStatCard(type){
  document.querySelectorAll('.stat-card').forEach(card=>card.classList.remove('active'));
  const activeCard=document.querySelector(`[data-stat-card="${type}"]`);
  if(activeCard) activeCard.classList.add('active');
  if(type==='active'){
    projectStatusFilter='inprogress';
    const status=document.getElementById('project-status-filter');
    if(status) status.value='inprogress';
    renderProjects();
    document.getElementById('project-list').scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  if(type==='done'){
    projectStatusFilter='done';
    const status=document.getElementById('project-status-filter');
    if(status) status.value='done';
    renderProjects();
    document.getElementById('project-list').scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  if(type==='pending'){
    showView('defects');
    setDefectFilter('pending');
  }
}

function filterProjects(v){renderProjects(v)}

function filterProjectsByDesigner(v){
  projectDesignerFilter=v;
  renderProjects();
}

function filterProjectsByStatus(v){
  projectStatusFilter=v;
  renderProjects();
}

function populateSmartFilters(){
  const designers=[...new Set(projects.map(p=>p.designer).concat(people.map(p=>p.name)).filter(Boolean))];
  const designerOptions='<option value="">所有設計師</option>'+designers.map(name=>`<option value="${name}">${name}</option>`).join('');
  const projectDesigner=document.getElementById('project-designer-filter');
  if(projectDesigner){
    projectDesigner.innerHTML=designerOptions;
    projectDesigner.value=projectDesignerFilter;
  }
  const defectDesigner=document.getElementById('defect-designer-filter');
  if(defectDesigner){
    defectDesigner.innerHTML=designerOptions;
    defectDesigner.value=defectDesignerFilter;
  }
  const projectStatus=document.getElementById('project-status-filter');
  if(projectStatus) projectStatus.value=projectStatusFilter;
  const defectProject=document.getElementById('defect-project-filter');
  if(defectProject){
    defectProject.innerHTML='<option value="">選擇專案</option>'+projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
    defectProject.value=String(curProjId);
  }
  const projectList=document.getElementById('project-search-list');
  if(projectList) projectList.innerHTML=projects.map(p=>`<option value="${p.name}">${p.client} · ${p.designer||'未指定'}</option>`).join('');
  const defectList=document.getElementById('defect-search-list');
  if(defectList){
    const suggestions=projects.flatMap(p=>(defects[p.id]||[]).map(x=>x.content)).concat(designers,trades);
    defectList.innerHTML=[...new Set(suggestions)].map(v=>`<option value="${v}"></option>`).join('');
  }
}

function selectProjectFromFilter(v){
  if(!v) return;
  curProjId=Number(v);
  defectDesignerFilter='';
  const designerSelect=document.getElementById('defect-designer-filter');
  if(designerSelect) designerSelect.value='';
  renderProjectTabs('defect-project-tabs');
  syncProjectHeader();
  renderProjectSchedule();
  renderDefects();
  scrollContentTop();
}

function filterDefectsDesigner(v){
  defectDesignerFilter=v;
  if(!v){
    renderDefects();
    return;
  }
  const project=projects
    .filter(p=>(p.designer||'')===v)
    .sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  if(project){
    curProjId=project.id;
    const projectSelect=document.getElementById('defect-project-filter');
    if(projectSelect) projectSelect.value=String(project.id);
    renderProjectTabs('defect-project-tabs');
    syncProjectHeader();
    renderProjectSchedule();
  }
  renderDefects();
  scrollContentTop();
}

function openProject(id){
  curProjId=id;
  showView('defects');
  scrollContentTop();
}

function selectProject(id,view='defects'){
  curProjId=id;
  syncProjectHeader();
  if(view==='pdf'){
    renderProjectTabs('pdf-project-tabs');
    renderPDF();
    return;
  }
  defectDesignerFilter='';
  const designerSelect=document.getElementById('defect-designer-filter');
  if(designerSelect) designerSelect.value='';
  const projectSelect=document.getElementById('defect-project-filter');
  if(projectSelect) projectSelect.value=String(curProjId);
  renderProjectTabs('defect-project-tabs');
  renderProjectSchedule();
  renderDefects();
  scrollContentTop();
}

function syncProjectHeader(){
  const p=projects.find(x=>x.id===curProjId);
  const d=defects[curProjId]||[];
  if(!p) return;
  document.getElementById('detail-proj-name').textContent=p.name;
  document.getElementById('detail-client').textContent=`${p.client} · ${p.designer||'未指定設計師'}`;
  document.getElementById('detail-date').textContent=p.date;
  document.getElementById('detail-count').textContent=d.length+' 項缺失';
}

function renderProjectSchedule(){
  const list=defects[curProjId]||[];
  const total=list.length;
  const done=list.filter(x=>x.status==='done').length;
  const rate=total?Math.round(done/total*100):0;
  const rateEl=document.getElementById('project-schedule-rate');
  const progress=document.getElementById('project-schedule-progress');
  const timeline=document.getElementById('project-schedule-timeline');
  if(rateEl) rateEl.textContent=rate+'%';
  if(progress) progress.style.width=rate+'%';
  if(!timeline) return;
  const items=list
    .filter(x=>x.status==='pending'&&x.deadline)
    .sort((a,b)=>new Date(a.deadline)-new Date(b.deadline))
    .slice(0,5);
  timeline.innerHTML=items.length?items.map(x=>`
    <button class="schedule-item" onclick="setDefectFilter('all');setTimeout(()=>{const card=document.querySelector('[data-defect-id=${x.id}]');if(card)card.scrollIntoView({behavior:'smooth',block:'center'});},0)">
      <span>${x.deadline}</span>
      <strong>${x.trade||'其他'}</strong>
      <em>${x.content}</em>
    </button>
  `).join(''):'<div class="empty-inline">目前沒有待安排的收尾期限</div>';
}

function renderProjectTabs(targetId){
  const target=document.getElementById(targetId);
  if(!target) return;
  const view=targetId.startsWith('pdf')?'pdf':'defects';
  target.innerHTML=projects.map(p=>{
    const pending=(defects[p.id]||[]).filter(x=>x.status==='pending').length;
    return `<button class="project-tab ${p.id===curProjId?'active':''}" onclick="selectProject(${p.id},'${view}')">
      <span>${p.name}</span>
      <small>${pending} 待辦</small>
    </button>`;
  }).join('');
}

function populateProjectSelects(){
  document.querySelectorAll('[data-project-select]').forEach(select=>{
    select.innerHTML=projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
    select.value=String(curProjId);
  });
}

function populatePeopleList(){
  const list=document.getElementById('people-list');
  if(list) list.innerHTML=people.map(p=>`<option value="${p.name}">${p.email}</option>`).join('');
  const statusText=document.getElementById('members-status')?.textContent||'';
  if(people.length&&!statusText.includes('Firestore')){
    setMembersStatus(`目前可選 ${people.length} 位成員。`,'ok');
  }
}

function populateTradeSelects(){
  document.querySelectorAll('#f-trade,#a-trade').forEach(select=>{
    select.innerHTML=trades.map(t=>`<option value="${t}">${t}</option>`).join('');
  });
}

function fillAssigneeEmail(nameInputId,emailInputId){
  const name=document.getElementById(nameInputId).value.trim();
  const emailInput=document.getElementById(emailInputId);
  const person=people.find(p=>p.name.trim().toLowerCase()===name.toLowerCase());
  emailInput.value=person?person.email:'';
}

function getReminderDate(deadline){
  if(!deadline) return '';
  const date=new Date(deadline);
  date.setDate(date.getDate()-1);
  return date.toISOString().split('T')[0];
}

function queueReminder(type,item,project){
  const payload={
    type,
    projectName:project.name,
    content:item.content,
    assignee:project.designer,
    email:project.email,
    deadline:item.deadline,
    remindAt:getReminderDate(item.deadline)
  };
  console.info('Google Apps Script reminder payload',payload);
  if(GAS_REMINDER_ENDPOINT&&payload.email&&payload.deadline){
    fetch(GAS_REMINDER_ENDPOINT,{
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(payload)
    });
  }
}

// ── RENDER DEFECTS ──
function renderDefects(){
  renderProjectSchedule();
  const list=document.getElementById('defect-list');
  const d=defects[curProjId]||[];
  const p=projects.find(x=>x.id===curProjId);
  const q=defectQuery.trim();
  const filtered=d
    .filter(x=>curFilter==='all'||(curFilter==='dueSoon'?isDueSoonDefect(x):x.status===curFilter))
    .filter(x=>!q||`${x.trade||''} ${x.content} ${x.qty||''} ${x.note||''} ${p?.designer||''}`.includes(q))
    .sort((a,b)=>{
      if(a.status!==b.status) return a.status==='pending'?-1:1;
      return new Date(a.deadline||'2999-12-31')-new Date(b.deadline||'2999-12-31');
    });
  if(!filtered.length){
    list.innerHTML=`<div class="empty"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" class="icon-line" stroke-width="1.2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div><div class="empty-title">目前沒有缺失</div><div class="empty-desc">點擊「新增缺失」開始紀錄</div></div>`;
    return;
  }
  list.innerHTML=filtered.map(x=>{
    return `<div class="defect-card ${x.status}" data-defect-id="${x.id}">
      <div>
        <div class="defect-no">缺失 #${String(x.id).padStart(3,'0')}</div>
        <div class="defect-title">${x.content}</div>
        <div class="defect-note-text">工種：${x.trade||'其他'}</div>
        ${x.qty?`<div class="defect-note-text">數量：${x.qty}</div>`:''}
        <div class="defect-note-text">負責設計師：${p?.designer||'未指定'}${p?.email?` · ${p.email}`:''}</div>
        ${x.note?`<div class="defect-note-text">${x.note}</div>`:''}
        <div class="defect-footer-row">
          <span class="tag ${x.status==='pending'?'tag-pending':'tag-done'}">${x.status==='pending'?'待改善':'已完成'}</span>
          ${x.deadline?`<div class="deadline-text">
            <svg width="11" height="11" viewBox="0 0 24 24" class="icon-line" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            期限 ${x.deadline}
          </div>`:''}
          <button class="mini-action" onclick="openOv('defect',${x.id})">編輯</button>
          <button class="mini-action mini-danger" onclick="requestDelete('defect',${x.id})">刪除</button>
          <button class="mini-action" onclick="toggleStatus(${x.id})">${x.status==='pending'?'標為完成':'改回待改善'}</button>
        </div>
      </div>
      <button class="defect-photo-thumb" ${x.photo?`onclick="openImagePreview('${x.photo}')"`:''}>
        ${x.photo?`<img src="${x.photo}" alt="缺失照片">`:`<svg width="20" height="20" viewBox="0 0 24 24" class="icon-line" stroke-width="1.4"><rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.8"/><polyline points="21 15 16 10 5 21"/></svg>`}
      </button>
    </div>`;
  }).join('');
}

function filterDefectsText(v){
  defectQuery=v;
  renderDefects();
}

function filterDef(f,el){
  setDefectFilter(f,el);
}

function setDefectFilter(f,el=null){
  curFilter=f;
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  const label={dueSoon:'即將到期',pending:'待改善',done:'已完成',all:'全部'}[f]||'全部';
  const target=el||[...document.querySelectorAll('.chip')].find(c=>c.textContent.trim()===label);
  if(target) target.classList.add('active');
  renderDefects();
}

async function toggleStatus(id){
  const d=defects[curProjId];
  const item=d.find(x=>x.id===id);
  if(item){
    item.status=item.status==='pending'?'done':'pending';
    try{
      await saveDefectCloud(curProjId,item);
    }catch(error){
      showCloudError(error);
    }
    renderDefects();
    renderProjectTabs('defect-project-tabs');
    renderDashboard();
    if(!document.getElementById('view-projects').classList.contains('is-hidden')) renderProjects();
    updateBadges();
  }
}

// ── RENDER PDF ──
function renderPDF(){
  const p=projects.find(x=>x.id===curProjId);
  const d=defects[curProjId]||[];
  const add=addendum[curProjId]||[];
  const today=new Date().toLocaleDateString('zh-TW');

  document.getElementById('pdf-footer-date').textContent='產生日期：'+today;

  // Info blocks
  const infoHtml=`
    <div class="pdf-info-item"><div class="pdf-info-label">專案名稱</div><div class="pdf-info-value">${p?p.name:'-'}</div></div>
    <div class="pdf-info-item"><div class="pdf-info-label">設計師</div><div class="pdf-info-value">${p?.designer||'-'}</div></div>
    <div class="pdf-info-item"><div class="pdf-info-label">缺失總數</div><div class="pdf-info-value">${d.length} 項（待改善 ${d.filter(x=>x.status==='pending').length}）</div></div>
    <div class="pdf-info-item"><div class="pdf-info-label">驗收日期</div><div class="pdf-info-value">${p?p.date:'-'}</div></div>
    `;
  document.getElementById('pdf-info-0').innerHTML=infoHtml;
  document.getElementById('pdf-info-1').innerHTML=`
    <div class="pdf-info-item"><div class="pdf-info-label">專案名稱</div><div class="pdf-info-value">${p?p.name:'-'}</div></div>
    <div class="pdf-info-item"><div class="pdf-info-label">設計師</div><div class="pdf-info-value">${p?.designer||'-'}</div></div>
    <div class="pdf-info-item"><div class="pdf-info-label">追加項目數</div><div class="pdf-info-value">${add.length} 項</div></div>
    <div class="pdf-info-item"><div class="pdf-info-label">日期</div><div class="pdf-info-value">${today}</div></div>
    `;

  function tableRow(x,i,type){
    return `<tr>
      <td class="col-no">${i+1}</td>
      <td class="col-check">
        <button class="check-box ${x.status==='done'?'checked':''}" onclick="toggleReportCheck('${type}',${x.id},this)" aria-label="切換審核狀態"></button>
      </td>
      <td>${x.content}<button class="table-edit" onclick="openOv('${type==='addendum'?'addendum':'defect'}',${x.id})">編輯</button><button class="table-edit table-delete" onclick="requestDelete('${type}',${x.id})">刪除</button></td>
      <td class="col-qty text-center">${x.qty||'-'}</td>
      <td class="col-img">${x.photo?`<img class="pdf-thumb" src="${x.photo}" alt="現場照片">`:'-'}</td>
      <td class="col-note note-text">${x.note||'-'}</td>
    </tr>`;
  }

  function groupedRows(items,type){
    let index=0;
    return trades.map(trade=>{
      const rows=items.filter(x=>(x.trade||'其他')===trade);
      if(!rows.length) return '';
      return `<tr class="trade-group"><td colspan="6">${trade}</td></tr>${rows.map(x=>tableRow(x,index++,type)).join('')}`;
    }).join('');
  }

  document.getElementById('pdf-tbody-0').innerHTML=d.length
    ? groupedRows(d,'defect')
    : '<tr><td colspan="6" class="pdf-empty-cell">目前無缺失紀錄</td></tr>';

  document.getElementById('pdf-tbody-1').innerHTML=add.length
    ? groupedRows(add,'addendum')
    : '<tr><td colspan="6" class="pdf-empty-cell">目前無追加工程項目</td></tr>';
}

async function toggleReportCheck(type,id,button){
  const source=type==='addendum'?addendum:defects;
  const item=(source[curProjId]||[]).find(x=>x.id===id);
  if(item){
    item.status=item.status==='done'?'pending':'done';
    try{
      if(type==='addendum') await saveAddendumCloud(curProjId,item);
      else await saveDefectCloud(curProjId,item);
    }catch(error){
      showCloudError(error);
    }
    button.classList.toggle('checked');
    updateBadges();
  }
}

function switchPdfTab(idx,el){
  document.querySelectorAll('.pdf-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.pdf-page').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('pdf-page-'+idx).classList.add('active');
}

function safeFileName(value){
  return String(value||'驗收報告').replace(/[\\/:*?"<>|]+/g,'-').trim();
}

async function downloadPDF(){
  renderPDF();
  const page=document.querySelector('.pdf-page.active');
  if(!page) return;
  if(!window.html2pdf){
    alert('PDF 套件尚未載入完成，請稍等幾秒後再試一次。');
    return;
  }
  const p=projects.find(x=>x.id===curProjId);
  const isAddendum=page.id==='pdf-page-1';
  const filename=`${safeFileName(p?.name)}-${isAddendum?'工程追加單':'驗收缺失報告'}.pdf`;
  const button=document.querySelector('.pdf-btn[onclick="downloadPDF()"]');
  const originalHtml=button?.innerHTML||'下載 PDF';
  if(button){
    button.disabled=true;
    button.textContent='產生中...';
  }
  const cloneWrap=document.createElement('div');
  cloneWrap.className='pdf-export-clone';
  const clone=page.cloneNode(true);
  clone.querySelectorAll('.table-edit').forEach(el=>el.remove());
  cloneWrap.appendChild(clone);
  document.body.appendChild(cloneWrap);
  try{
    document.body.classList.add('exporting-pdf');
    await window.html2pdf().set({
      margin:0,
      filename,
      image:{type:'jpeg',quality:0.98},
      html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',scrollX:0,scrollY:0},
      jsPDF:{unit:'pt',format:'a4',orientation:'portrait'},
      pagebreak:{mode:['avoid-all','css','legacy']}
    }).from(clone).save();
  }catch(error){
    console.error('PDF download failed',error);
    alert('PDF 下載失敗，請再試一次。若仍失敗，我們再改用更穩定的列印版。');
  }finally{
    document.body.classList.remove('exporting-pdf');
    cloneWrap.remove();
    if(button){
      button.disabled=false;
      button.innerHTML=originalHtml;
    }
  }
}

// ── PANELS ──
async function openOv(name,id=null){
  document.getElementById('ov-'+name).classList.add('open');
  if(name==='project'){
    await loadMembersData();
    populatePeopleList();
    populateSmartFilters();
  }
  populateProjectSelects();
  populateTradeSelects();
  if(name==='defect'){
    editingDefectId=id;
    const d=new Date(); d.setDate(d.getDate()+7);
    const item=id?(defects[curProjId]||[]).find(x=>x.id===id):null;
    currentPhoto=item?.photo||'';
    currentPhotoFile=null;
    document.querySelector('#ov-defect .panel-title').textContent=id?'編輯缺失項目':'新增缺失項目';
    document.getElementById('f-deadline').value=item?.deadline||d.toISOString().split('T')[0];
    document.getElementById('f-project').value=String(curProjId);
    document.getElementById('f-trade').value=item?.trade||'油漆';
    document.getElementById('f-content').value=item?.content||'';
    document.getElementById('f-qty').value=item?.qty||'';
    document.getElementById('f-status').value=item?.status||'pending';
    document.getElementById('f-note').value=item?.note||'';
    document.getElementById('photo-file').value='';
    renderPhotoPreview(currentPhoto);
  }
  if(name==='addendum'){
    editingAddendumId=id;
    const d=new Date(); d.setDate(d.getDate()+7);
    const item=id?(addendum[curProjId]||[]).find(x=>x.id===id):null;
    document.querySelector('#ov-addendum .panel-title').textContent=id?'編輯工程追加項目':'新增工程追加項目';
    document.getElementById('a-deadline').value=item?.deadline||d.toISOString().split('T')[0];
    document.getElementById('a-project').value=String(curProjId);
    document.getElementById('a-trade').value=item?.trade||'其他';
    document.getElementById('a-content').value=item?.content||'';
    document.getElementById('a-qty').value=item?.qty||'';
    document.getElementById('a-status').value=item?.status||'pending';
    document.getElementById('a-note').value=item?.note||'';
  }
  if(name==='project'){
    editingProjectId=id;
    const p=id?projects.find(x=>x.id===id):null;
    document.querySelector('#ov-project .panel-title').textContent=id?'編輯驗收專案':'新增驗收專案';
    document.getElementById('p-date').value=p?.date||new Date().toISOString().split('T')[0];
    document.getElementById('p-name').value=p?.name||'';
    document.getElementById('p-client').value=p?.client||'';
    document.getElementById('p-designer').value=p?.designer||'';
    document.getElementById('p-email').value=p?.email||'';
    document.getElementById('p-note').value=p?.note||'';
  }
}
function closeOv(name,e){
  if(e&&e.target!==e.currentTarget) return;
  document.getElementById('ov-'+name).classList.remove('open');
}

function getDeleteMeta(type,id){
  if(type==='project'){
    const item=projects.find(p=>p.id===id);
    return {label:'專案',name:item?.name||'此專案'};
  }
  if(type==='addendum'){
    const item=(addendum[curProjId]||[]).find(x=>x.id===id);
    return {label:'工程追加項目',name:item?.content||'此追加項目'};
  }
  const item=(defects[curProjId]||[]).find(x=>x.id===id);
  return {label:'缺失項目',name:item?.content||'此缺失'};
}

function requestDelete(type,id){
  pendingDelete={type,id};
  const meta=getDeleteMeta(type,id);
  document.getElementById('delete-confirm-title').textContent=`確認刪除${meta.label}`;
  document.getElementById('delete-confirm-desc').textContent=`將刪除「${meta.name}」，刪除後無法復原。`;
  document.getElementById('delete-confirm').classList.remove('is-hidden');
}

function closeDeleteConfirm(e){
  if(e&&e.target!==e.currentTarget) return;
  pendingDelete=null;
  document.getElementById('delete-confirm').classList.add('is-hidden');
}

async function confirmDelete(){
  if(!pendingDelete) return;
  const {type,id}=pendingDelete;
  const projectId=curProjId;
  if(type==='project'){
    const index=projects.findIndex(p=>p.id===id);
    if(index>-1) projects.splice(index,1);
    delete defects[id];
    delete addendum[id];
    if(curProjId===id) curProjId=projects[0]?.id||0;
  } else {
    const source=type==='addendum'?addendum:defects;
    const list=source[curProjId]||[];
    const index=list.findIndex(x=>x.id===id);
    if(index>-1) list.splice(index,1);
  }
  try{
    await deleteCloudRecord(type,id,projectId);
  }catch(error){
    showCloudError(error);
  }
  closeDeleteConfirm();
  refreshAfterDelete(type);
}

function refreshAfterDelete(type){
  populateSmartFilters();
  populateProjectSelects();
  renderDashboard();
  renderProjects();
  updateBadges();
  if(type==='project'){
    if(!document.getElementById('view-defects').classList.contains('is-hidden')){
      syncProjectHeader();
      renderProjectTabs('defect-project-tabs');
      renderDefects();
    }
    if(!document.getElementById('view-pdf').classList.contains('is-hidden')){
      renderProjectTabs('pdf-project-tabs');
      renderPDF();
    }
    return;
  }
  syncProjectHeader();
  renderProjectTabs('defect-project-tabs');
  renderDefects();
  renderProjectTabs('pdf-project-tabs');
  renderPDF();
}

async function submitDefect(e){
  e.preventDefault();
  const data=gatherDefectFormData();
  if(!data.content) return;
  await saveDefectData(data);
}

function gatherDefectFormData(){
  const content=document.getElementById('f-content').value.trim();
  const projectId=Number(document.getElementById('f-project').value)||curProjId;
  return {
    projectId,
    content,
    trade:document.getElementById('f-trade').value,
    qty:document.getElementById('f-qty').value,
    status:document.getElementById('f-status').value,
    deadline:document.getElementById('f-deadline').value,
    photo:currentPhoto,
    note:document.getElementById('f-note').value
  };
}

async function saveDefectData(data){
  const {projectId,content,trade,qty,status,deadline,photo,note}=data;
  curProjId=projectId;
  const project=projects.find(p=>p.id===projectId);
  const d=defects[projectId]=defects[projectId]||[];
  const existing=editingDefectId?d.find(x=>x.id===editingDefectId):null;
  const newId=existing?.id||(d.length?Math.max(...d.map(x=>x.id))+1:1);
  let cloudPhoto=photo;
  try{
    cloudPhoto=currentPhotoFile?await uploadDefectPhoto(projectId,newId,currentPhotoFile):photo;
  }catch(error){
    showPhotoUploadWarning(error);
    cloudPhoto='';
  }
  const item={id:newId,content,trade,qty,status,deadline,photo:cloudPhoto,note};
  try{
    await saveDefectCloud(projectId,item);
  }catch(error){
    showCloudError(error);
    return;
  }
  if(existing) Object.assign(existing,item);
  else d.push(item);
  if(project) queueReminder('defect',item,project);
  editingDefectId=null;
  currentPhoto='';
  currentPhotoFile=null;
  pendingDefectData=null;
  closeOv('defect');
  syncProjectHeader();
  renderDashboard();
  if(document.getElementById('view-pdf').classList.contains('is-hidden')){
    renderProjectTabs('defect-project-tabs');
    renderDefects();
  } else {
    renderProjectTabs('pdf-project-tabs');
    renderPDF();
  }
  updateBadges();
  document.getElementById('detail-count').textContent=d.length+' 項缺失';
}

async function submitAddendum(e){
  e.preventDefault();
  const content=document.getElementById('a-content').value.trim();
  if(!content) return;
  const projectId=Number(document.getElementById('a-project').value)||curProjId;
  curProjId=projectId;
  const project=projects.find(p=>p.id===projectId);
  const list=addendum[projectId]=addendum[projectId]||[];
  const existing=editingAddendumId?list.find(x=>x.id===editingAddendumId):null;
  const newId=existing?.id||(list.length?Math.max(...list.map(x=>x.id))+1:1);
  const item={
    id:newId,
    content,
    trade:document.getElementById('a-trade').value,
    qty:document.getElementById('a-qty').value,
    status:document.getElementById('a-status').value,
    deadline:document.getElementById('a-deadline').value,
    note:document.getElementById('a-note').value
  };
  if(existing) Object.assign(existing,item);
  else list.push(item);
  try{
    await saveAddendumCloud(projectId,item);
  }catch(error){
    showCloudError(error);
    return;
  }
  if(project) queueReminder('addendum',item,project);
  editingAddendumId=null;
  closeOv('addendum');
  renderProjectTabs('pdf-project-tabs');
  renderDashboard();
  renderPDF();
  updateBadges();
}

async function submitProject(e){
  e.preventDefault();
  const name=document.getElementById('p-name').value.trim();
  if(!name) return;
  const existing=editingProjectId?projects.find(p=>p.id===editingProjectId):null;
  const newId=existing?.id||(projects.length?Math.max(...projects.map(p=>p.id))+1:1);
  const projectData={id:newId,name,
    client:document.getElementById('p-client').value||'待填寫',
    date:document.getElementById('p-date').value||new Date().toISOString().split('T')[0],
    designer:document.getElementById('p-designer').value||'未指定',
    email:document.getElementById('p-email').value||'',
    note:document.getElementById('p-note').value,status:existing?.status||'inprogress'};
  if(existing) Object.assign(existing,projectData);
  else {
    projects.push(projectData);
    defects[newId]=[];
    addendum[newId]=[];
  }
  try{
    await saveProjectCloud(projectData);
  }catch(error){
    showCloudError(error);
    return;
  }
  closeOv('project');
  editingProjectId=null;
  curProjId=newId;
  renderDashboard();
  renderProjects();
  populateProjectSelects();
  updateBadges();
}

function previewPhoto(input){
  if(input.files&&input.files[0]){
    currentPhotoFile=input.files[0];
    currentPhoto=URL.createObjectURL(input.files[0]);
    renderPhotoPreview(currentPhoto);
  }
}

function renderPhotoPreview(src){
  const pr=document.getElementById('photo-prev');
  if(!src){
    pr.classList.add('is-hidden');
    pr.innerHTML='';
    return;
  }
  pr.classList.remove('is-hidden');
  pr.innerHTML=`
    <div class="photo-preview-box">
      <img src="${src}" class="photo-preview-img" alt="預覽">
      <button type="button" class="photo-remove-btn" onclick="removeDefectPhoto(event)">移除照片</button>
    </div>
  `;
}

function removeDefectPhoto(event){
  if(event) event.stopPropagation();
  currentPhoto='';
  currentPhotoFile=null;
  document.getElementById('photo-file').value='';
  renderPhotoPreview('');
}

function openImagePreview(src){
  if(!src) return;
  document.getElementById('image-lightbox-img').src=src;
  document.getElementById('image-lightbox').classList.remove('is-hidden');
}

function closeImagePreview(event){
  if(event&&event.target!==event.currentTarget) return;
  document.getElementById('image-lightbox').classList.add('is-hidden');
  document.getElementById('image-lightbox-img').src='';
}

function updateBadges(){
  const pending=Object.values(defects).flat().filter(x=>x.status==='pending').length;
  document.getElementById('badge-defects').textContent=pending;
  document.getElementById('badge-projects').textContent=projects.length;
}

function setupLogoFallbacks(){
  document.querySelectorAll('[data-logo-fallback]').forEach(img=>{
    img.addEventListener('error',()=>{
      const type=img.dataset.logoFallback;
      const fallback={
        block:'<div class="logo-fallback">三彡川空間設計</div>',
        inline:'<span class="logo-fallback logo-fallback-inline">三彡川空間設計</span>',
        report:'<div class="logo-fallback logo-fallback-report">三彡川空間設計<br><span>SHAN SHAN CHUAN INTERIOR DESIGN</span></div>'
      }[type]||'<span class="logo-fallback">三彡川空間設計</span>';

      if(type==='block') img.parentNode.insertAdjacentHTML('afterbegin',fallback);
      else img.insertAdjacentHTML('afterend',fallback);
      img.remove();
    },{once:true});
  });
}

// ── DATE PICKER ──
const datePickerState={input:null,viewDate:new Date()};

function parseISODate(value){
  if(!value) return null;
  const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!match) return null;
  return new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
}

function formatISODate(date){
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,'0');
  const d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function getDatePicker(){
  let picker=document.getElementById('date-picker');
  if(picker) return picker;
  picker=document.createElement('div');
  picker.id='date-picker';
  picker.className='date-picker';
  picker.addEventListener('click',event=>event.stopPropagation());
  document.body.appendChild(picker);
  return picker;
}

function positionDatePicker(){
  const picker=getDatePicker();
  const input=datePickerState.input;
  if(!input) return;
  const rect=input.getBoundingClientRect();
  const gap=8;
  const width=Math.min(360,window.innerWidth-24);
  let left=Math.min(Math.max(12,rect.left),window.innerWidth-width-12);
  let top=rect.bottom+gap;
  const estimatedHeight=390;
  if(top+estimatedHeight>window.innerHeight-12) top=Math.max(12,rect.top-estimatedHeight-gap);
  picker.style.left=`${left}px`;
  picker.style.top=`${top}px`;
}

function renderDatePicker(){
  const picker=getDatePicker();
  const input=datePickerState.input;
  if(!input) return;
  const selected=parseISODate(input.value);
  const todayISO=formatISODate(new Date());
  const view=new Date(datePickerState.viewDate.getFullYear(),datePickerState.viewDate.getMonth(),1);
  const firstDay=view.getDay();
  const start=new Date(view);
  start.setDate(1-firstDay);
  const weekdays=['日','一','二','三','四','五','六'];
  const days=[];
  for(let i=0;i<42;i++){
    const date=new Date(start);
    date.setDate(start.getDate()+i);
    const iso=formatISODate(date);
    const classes=['date-picker-day'];
    if(date.getMonth()!==view.getMonth()) classes.push('muted');
    if(iso===todayISO) classes.push('today');
    if(selected&&iso===formatISODate(selected)) classes.push('selected');
    days.push(`<button type="button" class="${classes.join(' ')}" data-date="${iso}">${date.getDate()}</button>`);
  }
  picker.innerHTML=`
    <div class="date-picker-head">
      <div class="date-picker-title">${view.getFullYear()} 年 ${view.getMonth()+1} 月</div>
      <div class="date-picker-nav">
        <button type="button" class="date-picker-btn" data-month="-1" aria-label="上一個月">‹</button>
        <button type="button" class="date-picker-btn" data-month="1" aria-label="下一個月">›</button>
      </div>
    </div>
    <div class="date-picker-grid">
      ${weekdays.map(day=>`<div class="date-picker-weekday">${day}</div>`).join('')}
      ${days.join('')}
    </div>
  `;
  picker.querySelectorAll('[data-month]').forEach(button=>{
    button.addEventListener('click',()=>{
      datePickerState.viewDate.setMonth(datePickerState.viewDate.getMonth()+Number(button.dataset.month));
      renderDatePicker();
    });
  });
  picker.querySelectorAll('[data-date]').forEach(button=>{
    button.addEventListener('click',()=>{
      input.value=button.dataset.date;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
      closeDatePicker();
    });
  });
  positionDatePicker();
}

function openDatePicker(input){
  datePickerState.input=input;
  datePickerState.viewDate=parseISODate(input.value)||new Date();
  const picker=getDatePicker();
  picker.classList.add('open');
  renderDatePicker();
}

function closeDatePicker(){
  const picker=getDatePicker();
  picker.classList.remove('open');
  datePickerState.input=null;
}

function setupDatePickers(){
  document.querySelectorAll('.date-input').forEach(input=>{
    input.addEventListener('click',event=>{
      event.stopPropagation();
      openDatePicker(input);
    });
    input.addEventListener('focus',()=>openDatePicker(input));
  });
  document.addEventListener('click',event=>{
    const picker=document.getElementById('date-picker');
    if(!picker?.classList.contains('open')) return;
    if(event.target.closest('.date-picker')||event.target.closest('.date-input')) return;
    closeDatePicker();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape') closeDatePicker();
  });
  window.addEventListener('resize',positionDatePicker);
  window.addEventListener('scroll',positionDatePicker,true);
}

// ── INIT ──
(function(){
  setupLogoFallbacks();
  setupDatePickers();
  populatePeopleList();
  populateProjectSelects();
  populateTradeSelects();
  syncProjectHeader();
  updateBadges();
  restoreAuthSession();
})();
