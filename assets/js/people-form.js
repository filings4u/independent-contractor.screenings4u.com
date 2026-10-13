(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),qs=k=>new URLSearchParams(location.search).get(k)||'';
const selected=(a,b)=>String(a??'')===String(b??'')?'selected':'';
function render(d){
  const employers=(d.employers||[]).filter(e=>!e.archived_at&&String(e.status)==='active'), id=qs('id'), preset=qs('employer_id');
  const person=id?(d.employees||[]).find(x=>String(x.id)===id):null;
  const title=person?'Edit Person':'Add Person', employerId=person?.employer_id||preset, type=person?.workforce_worker_type||'employee';
  return `<section class="panel section"><div class="panel-head"><div><h2>${title}</h2><p>Every person must be assigned to the Employer they work for.</p></div><a class="btn secondary" href="/people.html">Back to People</a></div>
  <form id="personForm" class="people-form-page" style="padding:18px"><input type="hidden" name="id" value="${esc(person?.id||'')}"><div class="modal-grid">
    <div class="field full"><label>Employer *</label><select name="employer_id" required><option value="">Choose Employer</option>${employers.map(e=>`<option value="${esc(e.id)}" ${selected(e.id,employerId)}>${esc(e.legal_name||e.dba_name||'Employer')}</option>`).join('')}</select><small class="form-help">People cannot be created without an Employer.</small></div>
    <div class="field"><label>Person type *</label><select name="workforce_worker_type" required><option value="employee" ${selected(type,'employee')}>Employee</option><option value="driver" ${selected(type,'driver')}>Driver</option><option value="staff" ${selected(type,'staff')}>Staff</option><option value="contractor" ${selected(type,'contractor')}>Contractor</option></select></div>
    <div class="field"><label>Employment status *</label><select name="employment_status" required><option value="active" ${selected(person?.employment_status||'active','active')}>Active</option><option value="pending_enrollment" ${selected(person?.employment_status,'pending_enrollment')}>Pending Enrollment</option><option value="inactive" ${selected(person?.employment_status,'inactive')}>Inactive</option></select></div>
    <div class="field"><label>First name *</label><input name="first_name" value="${esc(person?.first_name||'')}" required></div>
    <div class="field"><label>Middle name</label><input name="middle_name" value="${esc(person?.middle_name||'')}"></div>
    <div class="field"><label>Last name *</label><input name="last_name" value="${esc(person?.last_name||'')}" required></div>
    <div class="field"><label>Employee / contractor number</label><input name="employee_number" value="${esc(person?.employee_number||'')}"></div>
    <div class="field"><label>Job title</label><input name="job_title" value="${esc(person?.job_title||'')}"></div>
    <div class="field"><label>Email</label><input name="email" type="email" value="${esc(person?.email||'')}"></div>
    <div class="field"><label>Mobile</label><input name="mobile" type="tel" value="${esc(person?.mobile||'')}"></div>
    <div class="field"><label>Date of birth</label><input name="date_of_birth" type="date" value="${esc(person?.date_of_birth?String(person.date_of_birth).slice(0,10):'')}"></div>
    <div class="field"><label>DOT agency</label><select name="dot_agency"><option value="">Not assigned</option>${['FMCSA','FAA','FRA','FTA','PHMSA','USCG'].map(a=>`<option value="${a}" ${selected(person?.dot_agency,a)}>${a}</option>`).join('')}</select></div>
    <div class="field"><label>DOT covered</label><select name="dot_covered"><option value="true" ${selected(person?.dot_covered!==false,true)}>Yes</option><option value="false" ${selected(person?.dot_covered,false)}>No</option></select></div>
    <div class="field"><label>Safety-sensitive</label><select name="safety_sensitive"><option value="true" ${selected(person?.safety_sensitive!==false,true)}>Yes</option><option value="false" ${selected(person?.safety_sensitive,false)}>No</option></select></div>
    <div class="field driver-field"><label>CDL number</label><input name="cdl_number" value="${esc(person?.cdl_number||'')}"></div>
    <div class="field driver-field"><label>CDL state</label><input name="cdl_state" maxlength="2" value="${esc(person?.cdl_state||'')}"></div>
  </div><div id="personFormError" class="employer-modal-error" hidden></div><div class="modal-actions"><a class="btn ghost" href="/people.html">Cancel</a><button class="btn primary" type="submit">${person?'Save Changes':'Add Person'}</button></div></form></section>`;
}
async function save(){const form=$('#personForm');if(!form.reportValidity())return;const err=$('#personFormError'),button=form.querySelector('button[type="submit"]');button.disabled=true;err.hidden=true;try{const v=Object.fromEntries(new FormData(form).entries());v.dot_covered=v.dot_covered==='true';v.safety_sensitive=v.safety_sensitive==='true';if(!v.id)delete v.id;await window.Portal.invoke('workforce-ctpa-employees-programs',{action:'save_employee',employee:v});location.href='/people.html'}catch(x){err.textContent=x.message||String(x);err.hidden=false;button.disabled=false}}
function bind(){const form=$('#personForm');form?.addEventListener('submit',e=>{e.preventDefault();save()});}
window.CtpaPeopleForm={render,bind};
})();
