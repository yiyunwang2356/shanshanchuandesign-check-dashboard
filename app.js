// ── DATA ──
const projects=[
  {id:1,name:'信義區住宅改造',client:'陳先生',date:'2025-06-01',designer:'王設計師',email:'designer.wang@shanchuan.com',note:'3F/4F 複合式住宅',status:'inprogress'},
  {id:2,name:'大安區辦公室設計',client:'科技新創有限公司',date:'2025-05-20',designer:'林設計師',email:'designer.lin@shanchuan.com',note:'整層辦公室翻修',status:'inprogress'},
  {id:3,name:'內湖透天厝新建',client:'林太太',date:'2025-04-15',designer:'陳設計師',email:'designer.chen@shanchuan.com',note:'B1~4F 全棟',status:'done'},
];
const people=[
  {name:'王設計師',email:'designer.wang@shanchuan.com'},
  {name:'林設計師',email:'designer.lin@shanchuan.com'},
  {name:'陳設計師',email:'designer.chen@shanchuan.com'},
  {name:'李設計師',email:'designer.li@shanchuan.com'},
  {name:'張設計師',email:'designer.chang@shanchuan.com'},
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
    {id:3,trade:'水電',content:'茶水間排水管漏水',qty:'1 處',status:'pending',deadline:'2025-06-09',note:'緊急處理'},
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
let curProjId=1,curFilter='all',defectQuery='',currentPhoto='',pendingDefectData=null;
let editingProjectId=null,editingDefectId=null,editingAddendumId=null;

// ── LOGIN ──
function handleLogin(e){
  e.preventDefault();
  const btn=e.target.querySelector('button[type=submit]');
  btn.textContent='登入中…';btn.disabled=true;
  setTimeout(()=>{showPage('app');showView('projects');},650);
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
    renderDashboard();
    renderProjects();
  }
  if(name==='defects'){
    syncProjectHeader();
    renderProjectTabs('defect-project-tabs');
    renderDefects();
  }
  if(name==='pdf'){
    renderProjectTabs('pdf-project-tabs');
    renderPDF();
  }
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
function renderProjects(q=''){
  const list=document.getElementById('project-list');
  const filtered=projects
    .filter(p=>!q||p.name.includes(q)||p.client.includes(q)||(p.designer||'').includes(q))
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

  document.getElementById('overview-list').innerHTML=projects
    .map(p=>{
      const list=defects[p.id]||[];
      const pendingCount=list.filter(x=>x.status==='pending').length;
      const next=list.filter(x=>x.status==='pending'&&x.deadline).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline))[0];
      return `<div class="overview-item">
        <div><strong>${p.name}</strong><span>${p.designer||'未指定'} · ${pendingCount} 待辦</span></div>
        <small>${next?`最近期限 ${next.deadline}`:'無待辦期限'}</small>
      </div>`;
    }).join('');

  const events=projects.flatMap(p=>(defects[p.id]||[])
    .filter(x=>x.status==='pending'&&x.deadline)
    .map(x=>({project:p.name,date:x.deadline,title:x.content})))
    .sort((a,b)=>new Date(a.date)-new Date(b.date))
  renderCalendar(events);
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
  const events=projects.flatMap(p=>(defects[p.id]||[])
    .filter(x=>x.status==='pending'&&x.deadline===date)
    .map(x=>({project:p.name,title:x.content,trade:x.trade||'其他'})));
  document.getElementById('calendar-detail').innerHTML=events.length
    ? `<strong>${date}</strong>${events.map(e=>`<div>${e.project}｜${e.trade}｜${e.title}</div>`).join('')}`
    : `<strong>${date}</strong><div>當天沒有待辦缺失</div>`;
}

function filterProjects(v){renderProjects(v)}

function openProject(id){
  curProjId=id;
  showView('defects');
}

function selectProject(id,view='defects'){
  curProjId=id;
  syncProjectHeader();
  if(view==='pdf'){
    renderProjectTabs('pdf-project-tabs');
    renderPDF();
    return;
  }
  renderProjectTabs('defect-project-tabs');
  renderDefects();
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
}

function populateTradeSelects(){
  document.querySelectorAll('#f-trade,#a-trade').forEach(select=>{
    select.innerHTML=trades.map(t=>`<option value="${t}">${t}</option>`).join('');
  });
}

function fillAssigneeEmail(nameInputId,emailInputId){
  const name=document.getElementById(nameInputId).value.trim();
  const emailInput=document.getElementById(emailInputId);
  const person=people.find(p=>p.name===name);
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
  const list=document.getElementById('defect-list');
  const d=defects[curProjId]||[];
  const p=projects.find(x=>x.id===curProjId);
  const q=defectQuery.trim();
  const filtered=d
    .filter(x=>curFilter==='all'||x.status===curFilter)
    .filter(x=>!q||`${x.trade||''} ${x.content} ${x.qty||''} ${x.note||''} ${p?.designer||''}`.includes(q))
    .sort((a,b)=>new Date(b.deadline||0)-new Date(a.deadline||0));
  if(!filtered.length){
    list.innerHTML=`<div class="empty"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" class="icon-line" stroke-width="1.2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></div><div class="empty-title">目前沒有缺失</div><div class="empty-desc">點擊「新增缺失」開始紀錄</div></div>`;
    return;
  }
  const today=new Date();
  list.innerHTML=filtered.map(x=>{
    const dl=x.deadline?new Date(x.deadline):null;
    const urgent=dl&&x.status==='pending'&&(dl-today)/(86400000)<3;
    return `<div class="defect-card ${x.status}">
      <div>
        <div class="defect-no">缺失 #${String(x.id).padStart(3,'0')}</div>
        <div class="defect-title">${x.content}</div>
        <div class="defect-note-text">工種：${x.trade||'其他'}</div>
        ${x.qty?`<div class="defect-note-text">數量：${x.qty}</div>`:''}
        <div class="defect-note-text">負責設計師：${p?.designer||'未指定'}${p?.email?` · ${p.email}`:''}</div>
        ${x.note?`<div class="defect-note-text">${x.note}</div>`:''}
        <div class="defect-footer-row">
          <span class="tag ${x.status==='pending'?'tag-pending':'tag-done'}">${x.status==='pending'?'待改善':'已完成'}</span>
          ${x.deadline?`<div class="deadline-text ${urgent?'urgent':''}">
            <svg width="11" height="11" viewBox="0 0 24 24" class="icon-line" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            期限 ${x.deadline}
          </div>`:''}
          <button class="mini-action" onclick="openOv('defect',${x.id})">編輯</button>
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
  curFilter=f;
  document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  renderDefects();
}

function toggleStatus(id){
  const d=defects[curProjId];
  const item=d.find(x=>x.id===id);
  if(item){
    item.status=item.status==='pending'?'done':'pending';
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
      <td>${x.content}<button class="table-edit" onclick="openOv('${type==='addendum'?'addendum':'defect'}',${x.id})">編輯</button></td>
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

function toggleReportCheck(type,id,button){
  const source=type==='addendum'?addendum:defects;
  const item=(source[curProjId]||[]).find(x=>x.id===id);
  if(item) item.status=item.status==='done'?'pending':'done';
  button.classList.toggle('checked');
  updateBadges();
}

function switchPdfTab(idx,el){
  document.querySelectorAll('.pdf-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.pdf-page').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('pdf-page-'+idx).classList.add('active');
}

// ── PANELS ──
function openOv(name,id=null){
  document.getElementById('ov-'+name).classList.add('open');
  populateProjectSelects();
  populateTradeSelects();
  if(name==='defect'){
    editingDefectId=id;
    const d=new Date(); d.setDate(d.getDate()+7);
    const item=id?(defects[curProjId]||[]).find(x=>x.id===id):null;
    currentPhoto=item?.photo||'';
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

function submitDefect(e){
  e.preventDefault();
  const data=gatherDefectFormData();
  if(!data.content) return;
  saveDefectData(data);
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

function saveDefectData(data){
  const {projectId,content,trade,qty,status,deadline,photo,note}=data;
  curProjId=projectId;
  const project=projects.find(p=>p.id===projectId);
  const d=defects[projectId]=defects[projectId]||[];
  const existing=editingDefectId?d.find(x=>x.id===editingDefectId):null;
  const newId=existing?.id||(d.length?Math.max(...d.map(x=>x.id))+1:1);
  const item={id:newId,content,trade,qty,status,deadline,photo,note};
  if(existing) Object.assign(existing,item);
  else d.push(item);
  if(project) queueReminder('defect',item,project);
  editingDefectId=null;
  currentPhoto='';
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

function submitAddendum(e){
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
  if(project) queueReminder('addendum',item,project);
  editingAddendumId=null;
  closeOv('addendum');
  renderProjectTabs('pdf-project-tabs');
  renderDashboard();
  renderPDF();
  updateBadges();
}

function submitProject(e){
  e.preventDefault();
  const name=document.getElementById('p-name').value.trim();
  if(!name) return;
  const existing=editingProjectId?projects.find(p=>p.id===editingProjectId):null;
  const newId=existing?.id||Math.max(...projects.map(p=>p.id))+1;
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

// ── INIT ──
(function(){
  setupLogoFallbacks();
  populatePeopleList();
  populateProjectSelects();
  populateTradeSelects();
  syncProjectHeader();
  updateBadges();
})();
