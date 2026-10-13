(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=v=>String(v??'—').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const $=(s,r=document)=>r.querySelector(s);
function metric(label,value,note){return `<div class="metric"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(note)}</span></div>`}
function render(d){
 const owners=d.owner_operators||[];
 const rows=owners.map(x=>{
   const employerId=x.employer_id||x.employer?.id||'';
   const href=employerId?`/employer-form.html?id=${encodeURIComponent(employerId)}`:'/employers.html';
   return `<tr><td><strong>${esc(x.legal_name||x.employer?.legal_name||x.dba_name||'Owner-Operator')}</strong><small>${x.dot_number?`USDOT ${esc(x.dot_number)}`:'No USDOT number'}</small></td><td>${esc(pretty(x.status))}</td><td>${esc(pretty(x.consortium_status))}</td><td>${esc(x.enrollment?.dot_agency||x.regulatory_capacity?.agency||x.employer?.applicable_dot_agency||'FMCSA')}</td><td>${esc(x.email||x.employer?.primary_contact_email||'—')}</td><td><a class="btn secondary btn-sm" href="${esc(href)}">View</a></td></tr>`;
 }).join('')||'<tr><td colspan="6"><div class="empty">No Owner-Operators are currently tied to this C/TPA.</div></td></tr>';
 return `<div class="metrics">${metric('Owner-Operators',owners.length,'Across this C/TPA account')}${metric('Active',owners.filter(x=>String(x.status)==='active').length,'Active Owner-Operators')}${metric('Management',d.can_manage?'Enabled':'Read Only','Based on C/TPA role')}</div><div class="section panel"><div class="panel-head"><div><h2>Owner-Operators</h2><p>Owner-Operators are Employer accounts. Use View to open the corresponding Employer record.</p></div></div><div class="table-wrap"><table><thead><tr><th>Owner-Operator</th><th>Status</th><th>Consortium</th><th>Agency</th><th>Contact</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function bind(){const a=$('#actions');if(a)a.innerHTML='';}
window.CtpaOwnerOperators={render,bind};
})();
