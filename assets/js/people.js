(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=v=>String(v??'—').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const statusClass=v=>/active|eligible/i.test(String(v))?'good':/inactive|terminated|archived|suspended/i.test(String(v))?'bad':'warn';
const badge=v=>`<span class="badge ${statusClass(v)}">${esc(pretty(v))}</span>`;
const employerLabel=e=>e?.legal_name||e?.dba_name||'Employer';

function render(d){
  const people=(d.employees||[]).filter(x=>!x.archived_at);
  const employers=(d.employers||[]).filter(e=>!e.archived_at&&String(e.status)==='active');
  return `<section class="panel people-directory">
    <div class="panel-head"><div><h2>Employer People Directory</h2><p>One row per managed Employer. Open an Employer to view its employees, drivers, staff, and contractors.</p></div><span class="badge" id="employerCount">${employers.length} ${employers.length===1?'employer':'employers'}</span></div>
    <div class="people-toolbar">
      <input id="employerSearch" type="search" placeholder="Search Employer, USDOT, city, state...">
      <select id="employerAgency"><option value="">All DOT Agencies</option><option>FMCSA</option><option>FAA</option><option>FRA</option><option>FTA</option><option>PHMSA</option><option>USCG</option></select>
      <select id="employerStatus"><option value="">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      <a class="btn primary" href="/people-form.html">Add Person</a>
    </div>
    <div class="table-wrap"><table class="people-table"><thead><tr><th>Employer</th><th>Location</th><th>USDOT / Agency</th><th>People</th><th>Status</th><th></th></tr></thead><tbody id="employerRows"></tbody></table></div>
  </section>`;
}

function bind(d){
  const people=(d.employees||[]).filter(x=>!x.archived_at);
  const employers=(d.employers||[]).filter(e=>!e.archived_at&&String(e.status)==='active');
  const renderRows=()=>{
    const q=String($('#employerSearch')?.value||'').trim().toLowerCase();
    const agency=$('#employerAgency')?.value||'';
    const status=$('#employerStatus')?.value||'';
    const rows=employers.filter(e=>{
      const hay=[employerLabel(e),e.dba_name,e.dot_number,e.mc_number,e.city,e.state,e.primary_contact_name,e.primary_contact_email].filter(Boolean).join(' ').toLowerCase();
      return (!q||hay.includes(q))&&(!agency||String(e.applicable_dot_agency||'')===agency)&&(!status||String(e.status||'')===status);
    }).sort((a,b)=>employerLabel(a).localeCompare(employerLabel(b)));
    if($('#employerCount'))$('#employerCount').textContent=`${rows.length} ${rows.length===1?'employer':'employers'}`;
    $('#employerRows').innerHTML=rows.map(e=>{
      const count=people.filter(p=>String(p.employer_id)===String(e.id)).length;
      const loc=[e.city,e.state].filter(Boolean).join(', ')||'—';
      const dot=[e.dot_number?`USDOT ${e.dot_number}`:'No USDOT',e.applicable_dot_agency||''].filter(Boolean).join(' · ');
      return `<tr><td><strong>${esc(employerLabel(e))}</strong><small>${esc(e.dba_name&&e.dba_name!==e.legal_name?e.dba_name:'')}</small></td><td>${esc(loc)}</td><td>${esc(dot||'—')}</td><td><strong>${count}</strong><small>${count===1?'person':'people'}</small></td><td>${badge(e.status||'active')}</td><td><a class="mini-btn" href="/people-company.html?id=${encodeURIComponent(e.id)}">View</a></td></tr>`;
    }).join('')||`<tr><td colspan="6"><div class="empty">No Employers match the current filters.</div></td></tr>`;
  };
  ['employerSearch','employerAgency','employerStatus'].forEach(id=>$('#'+id)?.addEventListener(id==='employerSearch'?'input':'change',renderRows));
  renderRows();
}
window.CtpaPeople={render,bind};
})();
