(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').toLowerCase().replaceAll('-','_');
function employerStatus(e){return e?.archived_at?'archived':(norm(e?.status)||'inactive')}
const pretty=v=>String(v??'—').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const badge=v=>{const n=norm(v),c=['active','accepted','enabled'].includes(n)?'good':['suspended','revoked','inactive','closed','archived'].includes(n)?'bad':'warn';return `<span class="badge ${c}">${esc(pretty(v||'inactive'))}</span>`};
const fmt=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d)};
const personName=m=>m?.profiles?.full_name||m?.profiles?.display_name||[m?.profiles?.first_name,m?.profiles?.last_name].filter(Boolean).join(' ')||m?.profiles?.email||'Account User';
const roleName=(m,roles)=>m?.roles?.name||roles.find(r=>r.id===m?.role_id)?.name||pretty(m?.roles?.code||'Employer User');
const value=(o,k)=>o?.[k]??'';

function closeModal(){document.querySelector('.employer-modal-backdrop')?.remove()}
function toast(message,type='good'){
  let t=$('#employer-toast');if(!t){t=document.createElement('div');t.id='employer-toast';t.className='employer-toast';document.body.appendChild(t)}
  t.className=`employer-toast ${type}`;t.textContent=message;t.hidden=false;clearTimeout(t._timer);t._timer=setTimeout(()=>{t.hidden=true},3500);
}
function modalFrame(title,subtitle,body,actions=''){
  closeModal();const b=document.createElement('div');b.className='modal-backdrop employer-modal-backdrop';
  b.innerHTML=`<section class="modal employer-modal" role="dialog" aria-modal="true"><div class="employer-modal-head"><div><h2>${esc(title)}</h2>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div><button class="modal-x" type="button" data-close aria-label="Close">×</button></div><div class="employer-modal-error" data-modal-error hidden></div>${body}${actions}</section>`;
  document.body.appendChild(b);b.addEventListener('click',e=>{if(e.target===b||e.target.closest('[data-close]'))closeModal()});return b;
}
function setModalError(b,msg){const el=$('[data-modal-error]',b);el.textContent=msg;el.hidden=false}
function setBusy(btn,busy,label='Save'){btn.disabled=busy;btn.textContent=busy?'Working…':label}
function input(name,label,val='',type='text',full=false,required=false){return `<div class="field ${full?'full':''}"><label>${esc(label)}</label><input name="${esc(name)}" type="${esc(type)}" value="${esc(val)}" ${required?'required':''}></div>`}
function select(name,label,val,options,full=false){return `<div class="field ${full?'full':''}"><label>${esc(label)}</label><select name="${esc(name)}">${options.map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(val)?'selected':''}>${esc(o.label)}</option>`).join('')}</select></div>`}

function editorFields(e={},isEdit=false){
  const agencies=['FMCSA','FAA','FRA','FTA','PHMSA','USCG'];
  return `<div class="employer-form-sections">
    <div class="employer-form-section"><h3>Company</h3><div class="modal-grid">
      ${!isEdit?select('company_type','Company type',value(e,'company_type')||'employer',[{value:'employer',label:'Employer'},{value:'owner_operator_no_driver',label:'Owner-Operator — not a driver'},{value:'owner_operator_driver',label:'Owner-Operator — also the driver'}],true):''}
      ${input('legal_name','Legal company name',value(e,'legal_name'),'text',false,true)}
      ${input('dba_name','DBA / trade name',value(e,'dba_name'))}
      ${input('dot_number','USDOT number',value(e,'dot_number'))}
      ${input('mc_number','MC number',value(e,'mc_number'))}
      ${input('ein','EIN',value(e,'ein'))}
      ${input('business_type','Business type',value(e,'business_type'))}
      ${select('applicable_dot_agency','Primary DOT agency',value(e,'applicable_dot_agency')||'FMCSA',agencies.map(x=>({value:x,label:x})))}
      ${select('status','Status',value(e,'status')||'active',[{value:'active',label:'Active'},{value:'inactive',label:'Inactive'},{value:'suspended',label:'Suspended'}])}
      ${input('website','Website',value(e,'website'),'url')}
      ${input('phone','Company phone',value(e,'phone'),'tel')}
    </div></div>
    <div class="employer-form-section"><h3>Primary contact</h3><div class="modal-grid">
      ${input('primary_contact_name','Primary contact name',value(e,'primary_contact_name'))}
      ${input('primary_contact_email','Primary contact email',value(e,'primary_contact_email'),'email')}
      ${input('safety_manager_name','Safety manager',value(e,'safety_manager_name'))}
      ${input('safety_manager_email','Safety manager email',value(e,'safety_manager_email'),'email')}
      ${input('hr_contact_name','HR contact',value(e,'hr_contact_name'))}
      ${input('hr_contact_email','HR email',value(e,'hr_contact_email'),'email')}
      ${input('billing_contact_name','Billing contact',value(e,'billing_contact_name'))}
      ${input('billing_contact_email','Billing email',value(e,'billing_contact_email'),'email')}
    </div></div>
    <div class="employer-form-section" data-owner-driver-section hidden><h3>Owner-Operator Driver</h3><p class="section-help">This person will be created as a normal DOT driver and enrolled in the C/TPA's FMCSA consortium pool.</p><div class="modal-grid">
      ${input('driver_first_name','Driver first name',value(e,'driver_first_name'))}
      ${input('driver_middle_name','Driver middle name',value(e,'driver_middle_name'))}
      ${input('driver_last_name','Driver last name',value(e,'driver_last_name'))}
      ${input('driver_date_of_birth','Date of birth',value(e,'driver_date_of_birth'),'date')}
      ${input('driver_email','Driver email',value(e,'driver_email'),'email')}
      ${input('driver_mobile','Driver mobile',value(e,'driver_mobile'),'tel')}
      ${input('driver_cdl_number','CDL number',value(e,'driver_cdl_number'))}
      ${input('driver_cdl_state','CDL state',value(e,'driver_cdl_state'))}
      ${input('driver_hire_date','Hire / effective date',value(e,'driver_hire_date'),'date')}
      ${input('driver_job_title','Job title',value(e,'driver_job_title')||'Owner-Operator Driver')}
      ${input('driver_address_line1','Driver address line 1',value(e,'driver_address_line1'),'text',true)}
      ${input('driver_address_line2','Driver address line 2',value(e,'driver_address_line2'),'text',true)}
      ${input('driver_city','Driver city',value(e,'driver_city'))}
      ${input('driver_state','Driver state',value(e,'driver_state'))}
      ${input('driver_postal_code','Driver ZIP / postal code',value(e,'driver_postal_code'))}
      ${input('driver_country','Driver country',value(e,'driver_country')||'US')}
    </div></div>
    <div class="employer-form-section"><h3>Address</h3><div class="modal-grid">
      ${input('address_line1','Address line 1',value(e,'address_line1'),'text',true)}
      ${input('address_line2','Address line 2',value(e,'address_line2'),'text',true)}
      ${input('city','City',value(e,'city'))}
      ${input('state','State',value(e,'state'))}
      ${input('postal_code','ZIP / postal code',value(e,'postal_code'))}
      ${input('country','Country',value(e,'country')||'US')}
      ${select('timezone','Timezone',value(e,'timezone')||'America/Chicago',[
        {value:'America/New_York',label:'Eastern'},{value:'America/Chicago',label:'Central'},{value:'America/Denver',label:'Mountain'},{value:'America/Los_Angeles',label:'Pacific'},{value:'America/Anchorage',label:'Alaska'},{value:'Pacific/Honolulu',label:'Hawaii'}])}
    </div></div>
  </div>`;
}

function openEmployerEditor(e,afterSave){
  const isEdit=!!e?.id;
  const b=modalFrame(isEdit?'Edit Employer':'Add Employer',isEdit?'Update the company record managed by your C/TPA account.':'Create a client company and enable its DOT Employer Portal.',`<form data-employer-form>${editorFields(e,isEdit)}</form>`,`<div class="modal-actions"><button class="btn ghost" type="button" data-close>Cancel</button><button class="btn primary" type="submit" form="none" data-save-employer>${isEdit?'Save Changes':'Create Employer'}</button></div>`);
  const save=$('[data-save-employer]',b),form=$('[data-employer-form]',b);
  const companyType=form.elements.company_type,driverSection=$('[data-owner-driver-section]',form);
  const syncCompanyType=()=>{
    const driver=companyType?.value==='owner_operator_driver';
    if(driverSection)driverSection.hidden=!driver;
    ['driver_first_name','driver_last_name','driver_cdl_number','driver_cdl_state'].forEach(name=>{const el=form.elements[name];if(el)el.required=driver});
  };
  companyType?.addEventListener('change',syncCompanyType);syncCompanyType();
  save.onclick=async()=>{if(!form.reportValidity())return;setBusy(save,true,isEdit?'Save Changes':'Create Employer');try{const employer=Object.fromEntries(new FormData(form).entries());if(isEdit)employer.id=e.id;const r=await window.Portal.invoke('workforce-ctpa-employers',{action:'save_employer',employer});toast(isEdit?'Employer updated.':'Employer created.');closeModal();await afterSave?.(r.employer||employer,!isEdit)}catch(err){setBusy(save,false,isEdit?'Save Changes':'Create Employer');setModalError(b,err.message||String(err))}};
}

async function openInvite(employer,roles,afterSave){
  // Always refresh this Employer from the portal API before showing invite data.
  // The database is the source of truth; never rely on a stale object already in the browser.
  try{
    const fresh=await window.Portal.invoke('workforce-ctpa-employers',{action:'workspace'});
    employer=(fresh.employers||[]).find(x=>String(x.id)===String(employer.id))||employer;
  }catch(err){
    console.warn('Unable to refresh Employer before invite; using current portal record.',err);
  }
  const opts=(roles||[]).map(r=>({value:r.code,label:r.name||pretty(r.code)}));
  const fullName=String(employer.primary_contact_name||'').trim();
  const parts=fullName.split(/\s+/).filter(Boolean),first=parts.shift()||'',last=parts.join(' ');
  const email=String(employer.primary_contact_email||'').trim();
  const locked=(name,label,val,type='text',full=false)=>`<div class="field ${full?'full':''}"><label>${esc(label)}</label><input name="${esc(name)}" type="${esc(type)}" value="${esc(val)}" readonly aria-readonly="true" class="invite-locked"><small class="invite-locked-help">Edit this information from the Employer record.</small></div>`;
  const b=modalFrame('Invite Employer User',`Send access to ${employer.legal_name||'this employer'} in the Employer portal for its assigned DOT agency.`,`<form data-invite-form><div class="modal-grid">${locked('first_name','First name',first)}${locked('last_name','Last name',last)}${locked('email','Email address',email,'email',true)}${select('role_code','Portal role','employer_admin',opts,true)}</div><div class="invite-note">Contact information comes from the saved Employer record and cannot be changed here. Close this window and edit the Employer if the name or email needs to change.</div></form>`,`<div class="modal-actions"><button class="btn ghost" type="button" data-close>Cancel</button><button class="btn primary" type="button" data-send-invite>Send Invite</button></div>`);
  const btn=$('[data-send-invite]',b),form=$('[data-invite-form]',b);
  if(!first||!last||!email){setModalError(b,'The Employer record needs a complete primary contact name and email before an invite can be sent.');btn.disabled=true}
  btn.onclick=async()=>{if(!form.reportValidity())return;setBusy(btn,true,'Send Invite');try{const member=Object.fromEntries(new FormData(form).entries());const r=await window.Portal.invoke('workforce-ctpa-employers',{action:'invite_member',employer_id:employer.id,member});toast(r.email_delivery==='resend'?(r.invited?'Branded invitation sent through Resend.':'Portal access granted and confirmation sent through Resend.'):'Employer Portal access updated.');closeModal();await afterSave?.()}catch(err){setBusy(btn,false,'Send Invite');setModalError(b,err.message||String(err))}};
}

function parseCsv(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const ch=text[i],next=text[i+1];if(ch==='"'){if(q&&next==='"'){cell+='"';i++}else q=!q}else if(ch===','&&!q){row.push(cell.trim());cell=''}else if((ch==='\n'||ch==='\r')&&!q){if(ch==='\r'&&next==='\n')i++;row.push(cell.trim());cell='';if(row.some(v=>v!==''))rows.push(row);row=[]}else cell+=ch}row.push(cell.trim());if(row.some(v=>v!==''))rows.push(row);if(rows.length<2)return[];const h=rows[0].map(x=>x.trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''));return rows.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??''])))}
function openBulkImport(afterRefresh){const b=modalFrame('Bulk Add Employers','Upload a CSV to create and optionally invite large groups of DOT Employer customers. Imports are automatically processed in batches of 100.',`<div class="employer-form-sections"><div class="employer-form-section"><h3>CSV columns</h3><p style="font-size:0.625rem;line-height:1.6;color:#64768a">Required: <strong>legal_name</strong>. Recommended: <strong>applicable_dot_agency</strong>, <strong>dot_number</strong>, <strong>primary_contact_email</strong>, <strong>primary_contact_name</strong>. Optional: dba_name, phone, website, state, city, postal_code, billing_contact_email. If a primary contact email is supplied, an Employer Administrator invitation is sent.</p><div class="field"><label>Employer CSV</label><input type="file" accept=".csv,text/csv" data-bulk-file required></div><div class="invite-note" data-bulk-summary>Select a CSV file to review the row count before import.</div></div></div>`,`<div class="modal-actions"><button class="btn ghost" type="button" data-close>Cancel</button><button class="btn primary" type="button" data-run-bulk disabled>Import Employers</button></div>`);let rows=[];const file=$('[data-bulk-file]',b),run=$('[data-run-bulk]',b),summary=$('[data-bulk-summary]',b);file.onchange=async()=>{const f=file.files?.[0];rows=f?parseCsv(await f.text()):[];const valid=rows.filter(x=>String(x.legal_name||'').trim());summary.textContent=valid.length?`${valid.length.toLocaleString()} Employer row${valid.length===1?'':'s'} ready. Large files will be sent in batches of 100.`:'No valid Employer rows found.';rows=valid;run.disabled=!rows.length};run.onclick=async()=>{run.disabled=true;const total=rows.length,errors=[];let created=0;try{for(let i=0;i<rows.length;i+=100){run.textContent=`Importing ${Math.min(i+100,total)} of ${total}…`;const r=await window.Portal.invoke('workforce-ctpa-employers',{action:'bulk_import',employers:rows.slice(i,i+100)});created+=Number(r.created||0);errors.push(...(r.errors||[]).map(x=>({...x,batch_start:i+1})))}toast(`${created.toLocaleString()} Employer${created===1?'':'s'} created${errors.length?`; ${errors.length} row${errors.length===1?'':'s'} need review`:'.'}`,errors.length?'warn':'good');closeModal();await afterRefresh?.();if(errors.length)console.warn('Employer bulk import errors',errors)}catch(err){run.disabled=false;run.textContent='Import Employers';setModalError(b,err.message||String(err))}}}

function openMemberEditor(employer,m,roles,afterSave){
  const roleOpts=(roles||[]).map(r=>({value:r.id,label:r.name||pretty(r.code)}));
  const b=modalFrame('Manage Employer User',personName(m),`<form data-member-form><div class="modal-grid">${select('role_id','Portal role',m.role_id,roleOpts,true)}${select('status','Access status',m.status||'active',[{value:'active',label:'Active'},{value:'suspended',label:'Suspended'},{value:'revoked',label:'Revoked'}],true)}</div></form>`,`<div class="modal-actions"><button class="btn ghost" type="button" data-close>Cancel</button><button class="btn primary" type="button" data-save-member>Save Access</button></div>`);
  const btn=$('[data-save-member]',b),form=$('[data-member-form]',b);
  btn.onclick=async()=>{setBusy(btn,true,'Save Access');try{const member={id:m.id,...Object.fromEntries(new FormData(form).entries())};await window.Portal.invoke('workforce-ctpa-employers',{action:'save_member',employer_id:employer.id,member});toast('Employer user access updated.');closeModal();await afterSave?.()}catch(err){setBusy(btn,false,'Save Access');setModalError(b,err.message||String(err))}};
}

function details(employer,roles,canManage,canManageUsers,afterRefresh){
  const members=employer.account_members||[];
  const memberRows=members.length?members.map(m=>`<div class="employer-member-row"><div><strong>${esc(personName(m))}</strong><span>${esc(m.profiles?.email||'No email')} · ${esc(roleName(m,roles))}</span></div><div class="employer-member-meta">${badge(m.status)}<small>${m.password_created===false?'Invite pending — password not created':'Portal access active'}</small></div>${canManageUsers?`<button class="mini-btn" type="button" data-member="${esc(m.id)}">Manage</button>`:''}</div>`).join(''):'<div class="empty">No Employer Portal users have been invited yet.</div>';
  const b=modalFrame(employer.legal_name||'Employer',employer.dba_name||'DOT Employer account',`<div class="employer-detail-grid">
    <div class="employer-detail-card"><small>Status</small>${badge(employerStatus(employer))}</div><div class="employer-detail-card"><small>DOT agency</small><strong>${esc(employer.applicable_dot_agency||'—')}</strong></div><div class="employer-detail-card"><small>USDOT</small><strong>${esc(employer.dot_number||'—')}</strong></div><div class="employer-detail-card"><small>Covered people</small><strong>${Number(employer.employee_count_live||0)}</strong></div>
  </div><div class="employer-company-info"><div><small>Primary contact</small><strong>${esc(employer.primary_contact_name||'—')}</strong><span>${esc(employer.primary_contact_email||'—')}</span></div><div><small>Phone</small><strong>${esc(employer.phone||'—')}</strong><span>${esc(employer.website||'')}</span></div><div><small>Address</small><strong>${esc([employer.address_line1,employer.address_line2].filter(Boolean).join(', ')||'—')}</strong><span>${esc([employer.city,employer.state,employer.postal_code].filter(Boolean).join(', '))}</span></div></div><div class="employer-users-head"><div><h3>Employer Portal Users</h3><p>Users below access this company at employer-dot.screenings4u.com.</p></div>${canManageUsers&&!employer.archived_at?'<button class="btn primary" type="button" data-invite-user>Invite User</button>':''}</div><div class="employer-members">${memberRows}</div>`,`<div class="modal-actions"><button class="btn ghost" type="button" data-close>Close</button>${canManage?(employer.archived_at?'<button class="btn primary" type="button" data-restore-employer>Restore Employer</button><button class="btn secondary employer-edit-action" type="button" data-edit-employer>Edit Company</button>':'<button class="btn danger" type="button" data-archive-employer>Archive Employer</button><button class="btn secondary employer-edit-action" type="button" data-edit-employer>Edit Company</button>'):''}</div>`);
  $('[data-edit-employer]',b)?.addEventListener('click',()=>{location.href=`/employer-form.html?id=${encodeURIComponent(employer.id)}`});
  $('[data-invite-user]',b)?.addEventListener('click',()=>openInvite(employer,roles,afterRefresh));
  $('[data-archive-employer]',b)?.addEventListener('click',async()=>{
    const confirmFn=window.S4UDialog?.confirm||window.PortalUI?.confirm;
    const ok=confirmFn?await confirmFn(`Archive ${employer.legal_name||'this employer'}?\n\nThe employer will be removed from active C/TPA views and Employer Portal access will be disabled. Employees, testing, documents, invoices, compliance history, and other Supabase records will be preserved.`,{title:'Archive Employer',confirmText:'Archive Employer',cancelText:'Cancel',danger:true}):false;
    if(!ok)return;
    const btn=$('[data-archive-employer]',b);
    setBusy(btn,true,'Archive Employer');
    try{
      await window.Portal.invoke('workforce-ctpa-employers',{action:'archive_employer',employer_id:employer.id});
      closeModal();
      toast('Employer archived.');
      await afterRefresh?.();
    }catch(err){
      setBusy(btn,false,'Archive Employer');
      setModalError(b,err.message||String(err));
    }
  });
  $('[data-restore-employer]',b)?.addEventListener('click',async()=>{
    const confirmFn=window.PortalDialogs?.confirm;
    const ok=confirmFn?await confirmFn(`Restore ${employer.legal_name||'this employer'}?\n\nThe employer will return to active C/TPA management and its Employer Portal access and sponsored subscription will be re-enabled.`,{title:'Restore Employer',confirmText:'Restore Employer',cancelText:'Cancel'}):false;
    if(!ok)return;
    const btn=$('[data-restore-employer]',b);
    setBusy(btn,true,'Restore Employer');
    try{
      await window.Portal.invoke('workforce-ctpa-employers',{action:'restore_employer',employer_id:employer.id});
      toast('Employer restored.');
      closeModal();
      await afterRefresh?.();
    }catch(err){setBusy(btn,false,'Restore Employer');setModalError(b,err.message||String(err))}
  });
  $$('[data-member]',b).forEach(btn=>btn.onclick=()=>{const m=members.find(x=>String(x.id)===btn.dataset.member);if(m)openMemberEditor(employer,m,roles,afterRefresh)});
}

function render(d){
  const employers=d.employers||[],members=employers.flatMap(e=>e.account_members||[]),active=employers.filter(e=>!e.archived_at&&norm(e.status)==='active').length,archived=employers.filter(e=>!!e.archived_at).length,pending=members.filter(m=>m.status==='active'&&m.password_created===false).length;
  const rows=employers.length?employers.map(e=>{const ms=e.account_members||[],activeUsers=ms.filter(m=>norm(m.status)==='active'&&m.password_created!==false).length,type=e.account_type==='owner_operator'?'Owner-Operator':'Employer';return `<tr data-employer-row data-search="${esc([e.legal_name,e.dba_name,e.dot_number,e.primary_contact_email,e.applicable_dot_agency,e.state,type].filter(Boolean).join(' ').toLowerCase())}" data-status="${esc(employerStatus(e))}" data-agency="${esc(e.applicable_dot_agency||'')}"><td><strong>${esc(e.legal_name||'Employer')}</strong><small>${esc(e.dba_name||([e.city,e.state].filter(Boolean).join(', ')||'Client company'))}</small></td><td><span class="badge ${e.account_type==='owner_operator'?'warn':'good'}">${esc(type)}</span></td><td>${badge(employerStatus(e))}</td><td><strong>${esc(e.applicable_dot_agency||'—')}</strong><small>${e.dot_number?`USDOT ${esc(e.dot_number)}`:'No USDOT entered'}</small></td><td><strong>${esc(e.primary_contact_name||'—')}</strong><small>${esc(e.primary_contact_email||'No email')}</small></td><td><strong>${Number(e.employee_count_live||0)}</strong><small>covered people</small></td><td><strong>${e.archived_at?0:activeUsers}</strong><small>${e.archived_at?'Portal access disabled':(ms.length?`${ms.length} portal user${ms.length===1?'':'s'}`:'No portal users')}</small></td><td><button class="mini-btn primary" type="button" data-manage-employer="${esc(e.id)}">Manage</button></td></tr>`}).join(''):'<tr><td colspan="8"><div class="empty">No employers have been added yet. Use Add Employer to create the first client company.</div></td></tr>';
  const agencies=[...new Set(employers.map(e=>e.applicable_dot_agency).filter(Boolean))].sort();
  return `<div class="metrics employer-metrics"><div class="metric"><small>Client Accounts</small><strong>${employers.length}</strong><span>Employers and Owner-Operators managed by this C/TPA</span></div><div class="metric"><small>Active</small><strong>${active}</strong><span>Active client accounts</span></div><div class="metric"><small>Archived</small><strong>${archived}</strong><span>Accounts retained for history and restoration</span></div><div class="metric"><small>Pending Invites</small><strong>${pending}</strong><span>Portal invites where a password has not been created</span></div></div>
  <div class="section panel"><div class="panel-head employer-panel-head"><div><h2>Managed Employers</h2><p>Employers and Owner-Operators are managed together. Account Type identifies which kind of client record each company is.</p></div><span class="badge">${employers.length} account${employers.length===1?'':'s'}</span></div><div class="employers-toolbar"><div class="employers-search"><input type="search" id="employer-search" placeholder="Search employer, Owner-Operator, USDOT, contact…"><select id="employer-status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option><option value="archived">Archived</option></select><select id="employer-agency"><option value="">All DOT agencies</option>${agencies.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join('')}</select></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn secondary" type="button" data-bulk-employers>Bulk CSV</button><button class="btn primary" type="button" data-add-employer>Add Employer</button></div></div><div class="table-wrap"><table class="employers-table"><thead><tr><th>Employer</th><th>Account Type</th><th>Status</th><th>DOT Program</th><th>Primary Contact</th><th>People</th><th>Portal Access</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function bind(d){
  const employers=d.employers||[],roles=d.roles||[],canManage=d.can_manage!==false,canManageUsers=d.can_manage_users!==false;
  const refresh=async()=>window.Portal.refresh();
  const actions=$('#actions');if(actions){actions.innerHTML='';if(canManage){const bulk=document.createElement('button');bulk.className='btn secondary';bulk.textContent='Bulk CSV';bulk.onclick=()=>openBulkImport(refresh);actions.appendChild(bulk);const add=document.createElement('a');add.className='btn primary';add.textContent='Add Employer';add.href='/employer-form.html';actions.appendChild(add)}}
  $('[data-bulk-employers]')?.addEventListener('click',()=>openBulkImport(refresh));
  $('[data-add-employer]')?.addEventListener('click',()=>{location.href='/employer-form.html'});
  $$('[data-manage-employer]').forEach(btn=>btn.onclick=()=>{const e=employers.find(x=>String(x.id)===btn.dataset.manageEmployer);if(e)details(e,roles,canManage,canManageUsers,refresh)});
  const search=$('#employer-search'),status=$('#employer-status'),agency=$('#employer-agency');
  const filter=()=>{const q=String(search?.value||'').trim().toLowerCase(),st=status?.value||'',ag=agency?.value||'';$$('[data-employer-row]').forEach(r=>{const ok=(!q||r.dataset.search.includes(q))&&(!st||r.dataset.status===st)&&(!ag||r.dataset.agency===ag);r.hidden=!ok})};
  search?.addEventListener('input',filter);status?.addEventListener('change',filter);agency?.addEventListener('change',filter);
}

window.CtpaEmployers={render(d){this._lastData=d;return render(d)},bind(d){this._lastData=d;bind(d)},_lastData:null};
})();
