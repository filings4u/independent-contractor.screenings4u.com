(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=v=>String(v??'—').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const fmt=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?esc(v):new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d)};
const norm=v=>String(v||'').toLowerCase().replaceAll('-','_');
const badge=v=>{const s=String(v||'unknown'),k=/created|assigned|scheduled|at_collection|collected|laboratory|mro_review|final_result|closed|active|submitted/i.test(s)?'good':/failed|cancel|refused|no_show|unable|invalid|issue/i.test(s)?'bad':'warn';return `<span class="badge ${k}">${esc(pretty(s))}</span>`};
const byId=(a=[])=>new Map(a.map(x=>[x.id,x]));
function metric(label,value,note){return `<div class="metric"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(note)}</span></div>`}
function render(d){
 const employers=byId(d.employers),handoffs=byId((d.handoffs||[]).map(x=>({...x,id:x.dot_testing_order_id}))),orders=d.orders||[];
 const requests=(d.testing_requests||[]).filter(x=>['requested','under_review','approved'].includes(norm(x.status))).length;
 const ownerOps=(d.owner_operators||[]).filter(x=>!x.archived_at&&norm(x.status)==='active').length;
 const sent=orders.filter(o=>handoffs.get(o.id)?.screenings_testing_case_id).length;
 const rows=orders.length?orders.map(o=>{const e=employers.get(o.employer_id)||{},h=handoffs.get(o.id),emp=o.employees||{},p=o.programs||{},hs=h?.status||'not_started',editable=['created','assigned'].includes(norm(o.status));return `<tr data-test-row data-search="${esc([o.order_number,e.legal_name,emp.first_name,emp.last_name,p.name,o.reason,o.test_type,o.status,o.source_type,h?.screenings_case_number].filter(Boolean).join(' ').toLowerCase())}"><td><strong>${esc(o.order_number)}</strong><small>${fmt(o.created_at)} · ${esc(pretty(o.source_type||'legacy'))}</small></td><td>${esc(e.legal_name||'—')}</td><td><strong>${esc([emp.first_name,emp.last_name].filter(Boolean).join(' ')||'—')}</strong><small>${esc(emp.employee_number||'')}</small></td><td>${esc(p.name||'—')}<small>${esc(p.dot_agency||p.program_type||'')}</small></td><td>${esc(pretty(o.reason))}</td><td>${esc(pretty(o.test_type))}</td><td>${badge(o.status)}<small>Bill later</small></td><td>${h?.screenings_case_number?`<strong>${esc(h.screenings_case_number)}</strong><small>${esc(pretty(hs))}</small>`:'—'}</td><td><div class="selection-row-actions"><a class="mini-btn primary" href="/testing-order.html?id=${encodeURIComponent(o.id)}">View</a>${editable?`<a class="mini-btn" href="/testing-order.html?id=${encodeURIComponent(o.id)}&edit=1">Edit</a>`:''}<button class="mini-btn" data-archive-order="${esc(o.id)}">Archive</button></div></td></tr>`}).join(''):`<tr><td colspan="9"><div class="empty">No testing orders yet.</div></td></tr>`;
 return `<div class="metrics">${metric('Testing Orders',orders.length,'Active C/TPA testing orders')}${metric('Employer Requests',requests,'Awaiting C/TPA action')}${metric('Managed Owner-Operators',ownerOps,'Direct-order eligible accounts')}${metric('screenings4u Cases',sent,'Connected fulfillment cases')}</div>
 <div class="section panel"><div class="panel-head"><div><h2>Testing Orders</h2><p>Review every C/TPA testing order. Employer employees require an Employer request; Owner-Operators may be ordered directly; random orders originate from locked Selections.</p></div><div class="testing-filter"><input id="testing-search" type="search" placeholder="Search testing orders"></div></div><div class="table-wrap"><table><thead><tr><th>Order</th><th>Employer / Owner-Operator</th><th>Person</th><th>Program</th><th>Reason</th><th>Test</th><th>Status</th><th>screenings4u Case</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
async function archiveOrder(id,btn){if(!await window.S4UDialog.confirm('Archive this testing order? The record will remain in Supabase and audit history.'))return;btn.disabled=true;try{await window.Portal.invoke('workforce-ctpa-testing',{action:'archive_order',testing_order_id:id});await window.Portal.refresh()}catch(e){window.S4UDialog.alert(e.message||String(e));btn.disabled=false}}
function bind(d){
 const actions=$('#actions');if(actions){actions.innerHTML='';if(d.can_manage){const b=document.createElement('a');b.className='btn primary';b.textContent='Create Testing Order';b.href='/testing-order.html';actions.appendChild(b)}}
 const q=$('#testing-search');q?.addEventListener('input',()=>{const s=q.value.trim().toLowerCase();$$('[data-test-row]').forEach(r=>r.hidden=!!s&&!r.dataset.search.includes(s))});
 $$('[data-archive-order]').forEach(b=>b.onclick=()=>archiveOrder(b.dataset.archiveOrder,b));
}
window.CtpaTesting={render,bind};
})();
