(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pretty=v=>String(v??'—').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const fmt=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?esc(v):new Intl.DateTimeFormat('en-US',{month:'2-digit',day:'2-digit',year:'numeric',hour:'numeric',minute:'2-digit'}).format(d)};
const value=(...xs)=>xs.find(x=>x!==undefined&&x!==null&&x!=='')??'—';
const row=(label,val)=>`<div class="dot-result-row"><strong>${esc(label)}:</strong><span>${esc(val??'—')}</span></div>`;
function panelRows(result){const p=result?.sensitive_payload?.dot_drug_panel;return Array.isArray(p)?p:[]}
function render(d){
 const r=d.report||{},o=r.testing_orders||{},person=r.employees||{},employer=d.employer||{},result=d.result||{},panel=panelRows(result);
 const personName=[person.first_name,person.last_name].filter(Boolean).join(' ')||'—';
 const regulatory=String(value(r.regulatory_mode,person.dot_agency,employer.applicable_dot_agency)).replace(/^DOT:\s*/i,'');
 const delivery=d.delivery||null;
 const canDownload=!!(r.official_mro_document_id||r.document_url||r.view_url);
 return `<div class="result-detail-actions"><a class="btn secondary" href="/results.html">← Back to Results</a>${canDownload?`<button class="btn secondary" data-download="${esc(r.id)}">View Official PDF</button>`:''}${d.can_deliver&&!delivery?`<button class="btn primary" data-deliver="${esc(r.id)}">Send to Employer</button>`:''}</div>
 <article class="dot-mro-sheet">
   <header class="dot-mro-header"><div><img src="images/logo.png" alt="screenings4u DOT"></div><div class="dot-mro-attn"><strong>${esc(employer.legal_name||'Employer')}</strong>${employer.address_line1?`<span>${esc(employer.address_line1)}</span>`:''}${employer.city||employer.state||employer.postal_code?`<span>${esc([employer.city,employer.state,employer.postal_code].filter(Boolean).join(', ').replace(', '+(employer.postal_code||''),' '+(employer.postal_code||'')))}</span>`:''}</div></header>
   <h2>Medical Review Officer Report - Confidential (DOT Controlled Substance)</h2>
   <section class="dot-mro-two-col">
     <div>${row('Name',personName)}${row('Primary Id',value(person.employee_number,person.cdl_number))}${row('Secondary Id',person.cdl_number||'—')}${row('Specimen Id',value(r.specimen_external_id,result.specimen_id))}${row('Accession Id',value(r.report_number,o.order_number))}${row('Specimen Type',value(r.specimen_type,o.collection_type,'Urine'))}${row('Reason For Test',pretty(value(r.test_reason,o.reason)))}${row('Regulatory Mode','DOT: '+regulatory)}</div>
     <div>${row('Collection Site',value(r.collection_site_name,'—'))}${row('Collected Dt',fmt(o.collected_at))}${row('Lab',value(r.laboratory_name,'—'))}${row('Lab Reported Dt',fmt(result.result_date))}${row('MRO Verification Dt',fmt(value(r.mro_verified_at,r.finalized_at)))}${row('Testing Order',value(o.order_number,'—'))}${row('Employer',value(employer.legal_name,'—'))}${row('USDOT',value(employer.dot_number,'—'))}</div>
   </section>
   <section class="dot-panel-section"><div class="dot-panel-title"><strong>Panel:</strong><span>${esc(value(o.testing_panel,'DOT 5-Panel - Federal'))}</span></div><table class="dot-panel-table"><thead><tr><th>Drugs Tested</th><th>Screen Cutoff</th><th>Confirm Cutoff</th><th>Result</th></tr></thead><tbody>${panel.length?panel.map(x=>`<tr><td>${esc(x.analyte||'—')}</td><td>${esc([x.screen_cutoff,x.units].filter(Boolean).join(' '))}</td><td>${esc([x.confirm_cutoff,x.units].filter(Boolean).join(' '))}</td><td>${esc(pretty(x.result||'—'))}</td></tr>`).join(''):`<tr><td colspan="4">No analyte detail is stored for this finalized report.</td></tr>`}</tbody></table></section>
   <section class="dot-mro-outcome"><div><strong>Overall Verified Result:</strong><span class="dot-result-value ${/negative/i.test(r.verified_result||'')?'negative':'other'}">${esc(pretty(r.verified_result||result.final_status||'—'))}</span></div><div><strong>Medical Review Officer:</strong><span>${esc(r.mro_name||'—')}</span>${r.mro_verified_at?`<small>Verified ${esc(fmt(r.mro_verified_at))}</small>`:''}</div></section>
   <section class="dot-disposition"><strong>Disposition Comments:</strong><p>${esc(value(result?.sensitive_payload?.disposition_comments,'This DOT test was collected, tested and reviewed in accordance with applicable federal regulations.'))}</p></section>
 </article>`;
}
async function download(id,btn){const old=btn.textContent;btn.disabled=true;btn.textContent='Opening…';try{const r=await window.Portal.invoke('workforce-ctpa-results',{action:'download_report',report_id:id});if(!r.url)throw new Error('Official result document is unavailable.');window.open(r.url,'_blank','noopener')}catch(e){window.S4UDialog.alert(e.message||String(e))}finally{btn.disabled=false;btn.textContent=old}}
async function deliver(id,btn){const old=btn.textContent;btn.disabled=true;btn.textContent='Sending…';try{await window.Portal.invoke('workforce-ctpa-results',{action:'deliver_report',report_id:id});await window.Portal.refresh()}catch(e){window.S4UDialog.alert(e.message||String(e));btn.disabled=false;btn.textContent=old}}
function bind(){const d=$('[data-download]');if(d)d.onclick=()=>download(d.dataset.download,d);const s=$('[data-deliver]');if(s)s.onclick=()=>deliver(s.dataset.deliver,s)}
window.CtpaResultDetail={render,bind};
})();