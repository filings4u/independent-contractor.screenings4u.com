(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=v=>String(v??'—').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const fmt=v=>v?new Date(v).toLocaleDateString():'—';
function metric(l,v,n){return `<div class="metric"><small>${esc(l)}</small><strong>${esc(v)}</strong><span>${esc(n)}</span></div>`}
function render(d){
 const assignments=(d.program_employers||[]).filter(x=>x.status==='active'&&!x.removed_at),programs=d.programs||[];
 const rows=programs.map(p=>{const count=assignments.filter(x=>x.program_id===p.id).length;return `<tr><td><strong>${esc(p.name)}</strong><small>${esc(pretty(p.regulatory_category||'random_testing'))}</small></td><td>${esc(p.dot_agency||'—')}</td><td>${count}</td><td>${p.drug_random_rate==null?'—':esc(p.drug_random_rate)+'%'}</td><td>${p.alcohol_random_rate==null?'—':esc(p.alcohol_random_rate)+'%'}</td><td>${esc(fmt(p.effective_date))}</td><td><span class="badge">${esc(pretty(p.status))}</span></td><td><div class="result-actions"><a class="btn secondary compact" href="/program-detail.html?id=${esc(p.id)}">Manage Employers</a><a class="btn secondary compact" href="/program-form.html?id=${esc(p.id)}">Edit</a></div></td></tr>`}).join('')||'<tr><td colspan="8"><div class="empty">No DOT programs yet. Create your first Program, then assign Employers to it.</div></td></tr>';
 return `<div class="metrics program-metrics">${metric('Programs',programs.length,'Unlimited C/TPA programs')}${metric('Employer Assignments',assignments.length,'Employers assigned to programs')}${metric('Managed Employers',(d.employers||[]).length,'Available client companies')}${metric('Workflow Step','3','Programs before Pools')}</div><div class="notice"><strong>Program model:</strong> Programs belong to the C/TPA. Employers are assigned to Programs. Employees, drivers, contractors, and staff are added later to Random Pools—not to Programs.</div><section class="panel section"><div class="panel-head"><div><h2>DOT Programs</h2><p>Create as many Programs as needed and assign managed Employers to each Program.</p></div>${d.can_manage_programs?'<a class="btn primary" href="/program-form.html">New Program</a>':''}</div><div class="table-wrap"><table><thead><tr><th>Program</th><th>DOT Agency</th><th>Employers</th><th>Drug Rate</th><th>Alcohol Rate</th><th>Effective</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
function bind(){}
window.CtpaPrograms={render,bind};
})();
