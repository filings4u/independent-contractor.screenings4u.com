(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0));
const fmt=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d)};
const pretty=v=>String(v??'—').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const badge=v=>`<span class="badge ${/paid/i.test(String(v))?'good':/past_due|void/i.test(String(v))?'bad':'warn'}">${esc(pretty(v))}</span>`;
let currentData=null,currentCtx=null;
function employerName(id){const e=(currentData?.employers||[]).find(x=>x.id===id);return e?.legal_name||e?.dba_name||'Employer'}
function statusCounts(list){const out={draft:0,open:0,paid_external:0,past_due:0,void:0};for(const i of list)out[i.status]=(out[i.status]||0)+1;return out}
function remittanceText(r={}){return [r.remit_name,r.remit_address1,r.remit_address2,[r.remit_city,r.remit_state,r.remit_postal_code].filter(Boolean).join(', '),r.remit_email,r.remit_phone].filter(Boolean).join(' · ')}
function featureCard(d){
 const f=d.payment_processing_feature||{},req=d.payment_processing_request||null,enterprise=String(d.plan_code||'').toLowerCase()==='dot_ctpa_enterprise';
 if(d.client_payments){return `<div class="billing-capability ${d.payments_ready?'good':'warn'}"><div><small>PAYMENT PROCESSING</small><strong>${d.payments_ready?'Active':'Setup Pending'}</strong></div><p>${d.payments_ready?'Integrated Client Payments is active. Employers and Owner-Operators can pay eligible invoices online.':'The feature is enabled, but the payment processor profile still requires activation.'}</p></div>`}
 if(req?.status==='pending')return `<div class="billing-capability warn"><div><small>ENTERPRISE FEATURE</small><strong>Payment Processing — Pending</strong></div><p>Your Integrated Client Payments request is awaiting screenings4u approval.</p></div>`;
 if(!enterprise)return `<div class="billing-capability"><div><small>ENTERPRISE FEATURE</small><strong>Payment Processing</strong></div><p>Integrated Client Payments is available only with the C/TPA Enterprise plan.</p></div>`;
 return `<div class="billing-capability"><div><small>ENTERPRISE FEATURE</small><strong>Payment Processing</strong></div><p>${esc(f.description||'Accept online payments from Employer and Owner-Operator customers.')}</p><button class="btn primary" id="requestPaymentsBtn">Add Feature</button></div>`;
}
function render(d){
 currentData=d;const list=d.invoices||[],counts=statusCounts(list),outstanding=list.filter(i=>['open','past_due'].includes(i.status)).reduce((n,i)=>n+Number(i.amount_due||0),0);
 const paidMonth=d.client_payments?list.filter(i=>i.paid_at&&new Date(i.paid_at).getMonth()===new Date().getMonth()&&new Date(i.paid_at).getFullYear()===new Date().getFullYear()).reduce((n,i)=>n+Number(i.amount_paid||0),0):null;
 return `<div class="ctpa-billing-shell">
 <div class="metrics billing-metrics">
   <div class="metric"><small>Invoices</small><strong>${list.length}</strong><span>Employer and Owner-Operator invoices</span></div>
   <div class="metric"><small>Open Invoices</small><strong>${counts.open+counts.past_due}</strong><span>${counts.past_due} past due</span></div>
   <div class="metric"><small>Outstanding</small><strong>${money(outstanding)}</strong><span>Current client invoice balance</span></div>
   ${d.client_payments?`<div class="metric"><small>Paid This Month</small><strong>${money(paidMonth)}</strong><span>Integrated client payments</span></div>`:`<div class="metric"><small>Payment Collection</small><strong>Remit</strong><span>Use your remittance instructions until payments are enabled</span></div>`}
 </div>
 <div class="billing-capability-grid">
   ${featureCard(d)}
   <div class="billing-capability ${d.remittance?'good':''}"><div><small>REMITTANCE INFORMATION</small><strong>${d.remittance?'Configured':'Not Configured'}</strong></div><p>${d.remittance?esc(remittanceText(d.remittance)||'Remittance instructions are saved.'):'Add the name, address, ACH/check instructions, email, and phone customers should use when paying you outside the portal.'}</p><a class="btn ghost" href="/employer-remittance.html">${d.remittance?'Edit Remit Information':'Add Remit Information'}</a></div>
 </div>
 <div class="billing-page-links">
   <div><small>INVOICE TOOLS</small><strong>Create and manage Employer / Owner-Operator invoices</strong></div>
   <div class="billing-page-link-actions">
     ${d.can_manage?'<a class="btn primary" href="/employer-invoice-form.html">Create Invoice</a>':''}
     <a class="btn ghost" href="/employer-invoice-view.html">View Invoices</a>
     ${d.can_manage?'<a class="btn ghost" href="/employer-invoice-send.html">Push to Portal</a><a class="btn ghost" href="/employer-invoice-delete.html">Delete Invoice</a>':''}
     <a class="btn ghost" href="/employer-remittance.html">Remit Information</a>
   </div>
 </div>
 <div class="billing-toolbar">
   <div class="billing-search"><input id="invoiceSearch" type="search" placeholder="Search invoice, employer, owner-operator, or recipient"><select id="invoiceStatus"><option value="">All statuses</option><option value="draft">Draft</option><option value="open">Open</option><option value="past_due">Past Due</option><option value="paid_external">Paid</option></select></div>
   <div class="billing-toolbar-actions">${d.can_manage?'<a class="btn primary" href="/employer-invoice-form.html">Create Invoice</a>':''}</div>
 </div>
 <div class="panel"><div class="panel-head"><div><h2>Employer & Owner-Operator Invoices</h2><p>Create the invoice, edit it, push it to the customer portal, or delete it when there are no payments attached.</p></div><span class="badge" id="invoiceCount">${list.length} records</span></div>
   <div class="table-wrap"><table class="billing-table"><thead><tr><th>Invoice</th><th>Customer</th><th>Recipient</th><th>Issued / Due</th><th>Total</th>${d.client_payments?'<th>Paid</th><th>Balance</th>':''}<th>Status</th><th>Actions</th></tr></thead><tbody id="invoiceRows"></tbody></table></div>
 </div></div>`;
}
function rows(list){const hasPayments=currentData.client_payments;return list.map(i=>{const editable=!['paid_external','void'].includes(i.status)&&currentData.can_manage,hasRecorded=Number(i.amount_paid||0)>0||(i.ctpa_client_invoice_payments||[]).length>0;return `<tr data-invoice-id="${esc(i.id)}"><td><strong>${esc(i.invoice_number)}</strong><small>${fmt(i.created_at)}</small></td><td>${esc(employerName(i.employer_id))}</td><td>${esc(i.recipient_email||'—')}</td><td>${fmt(i.issued_at)}<small>Due ${fmt(i.due_at)}</small></td><td>${money(i.total)}</td>${hasPayments?`<td>${money(i.amount_paid)}</td><td>${money(i.amount_due)}</td>`:''}<td>${badge(i.status)}</td><td><div class="billing-row-actions"><a class="mini-btn" href="/employer-invoice-view.html?id=${encodeURIComponent(i.id)}">View</a>${editable?`<a class="mini-btn" href="/employer-invoice-form.html?id=${encodeURIComponent(i.id)}">Edit</a><a class="mini-btn primary" href="/employer-invoice-send.html?id=${encodeURIComponent(i.id)}">${i.sent_at?'Push Again':'Push to Portal'}</a>`:''}${currentData.can_manage&&!hasRecorded?`<a class="mini-btn danger" href="/employer-invoice-delete.html?id=${encodeURIComponent(i.id)}">Delete</a>`:''}</div></td></tr>`}).join('')||`<tr><td colspan="${hasPayments?9:7}"><div class="empty">No client invoices yet. <a class="btn primary" href="/employer-invoice-form.html" style="margin-left:8px">Create Invoice</a></div></td></tr>`}
function applyFilter(){const q=($('#invoiceSearch')?.value||'').trim().toLowerCase(),st=$('#invoiceStatus')?.value||'';const list=(currentData.invoices||[]).filter(i=>(!st||i.status===st)&&(!q||[i.invoice_number,employerName(i.employer_id),i.recipient_email].some(v=>String(v||'').toLowerCase().includes(q))));$('#invoiceRows').innerHTML=rows(list);$('#invoiceCount').textContent=`${list.length} record${list.length===1?'':'s'}`}
async function requestPayments(){const btn=$('#requestPaymentsBtn');if(!btn||!currentData.payment_processing_feature?.id)return;btn.disabled=true;btn.textContent='Requesting…';try{await window.Portal.invoke('workforce-ctpa-features',{action:'request_feature',feature_id:currentData.payment_processing_feature.id});await reload()}catch(e){btn.disabled=false;btn.textContent='Add Feature';const msg=$('#billingInlineStatus')||document.createElement('div');msg.id='billingInlineStatus';msg.className='notice';msg.textContent=e.message||String(e);$('.ctpa-billing-shell')?.prepend(msg)}}
async function reload(){currentData=await window.Portal.invoke('workforce-ctpa-admin',{action:'workspace',scope:'billing'});$('#content').innerHTML=render(currentData);bind(currentData,currentCtx)}
function bind(d,ctx){currentData=d;currentCtx=ctx;applyFilter();$('#invoiceSearch')?.addEventListener('input',applyFilter);$('#invoiceStatus')?.addEventListener('change',applyFilter);$('#requestPaymentsBtn')?.addEventListener('click',requestPayments)}
window.CtpaBilling={render,bind};
})();
