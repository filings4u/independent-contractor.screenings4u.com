(()=>{
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function mount(w,C,sb){
const el=document.querySelector('.section .panel');if(!el)return;document.querySelector('.hero')?.remove();el.classList.add('policies-app');
const token=(await sb.auth.getSession()).data.session?.access_token;if(!token)return;
const call=async(action,data={})=>{const r=await fetch(C.workforceUrl+'/functions/v1/ic-portal-operations',{method:'POST',headers:{apikey:C.workforceKey,authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({action,...data})});const d=await r.json();if(!r.ok||d.error)throw Error(d.error||'Request failed');return d};
el.innerHTML='<header><h1>Company Policies</h1><p>Published company policies and your acknowledgment history</p></header><div class="policy-stats"><div><small>Policies</small><strong id="pTotal">0</strong></div><div><small>Acknowledged</small><strong id="pAccepted">0</strong></div><div><small>Action needed</small><strong id="pPending">0</strong></div></div><div class="policy-layout"><section class="policy-panel"><h2>Policy library</h2><input id="pSearch" placeholder="Search policies" type="search"><select id="pFilter"><option value="all">All</option><option value="pending">Needs acknowledgment</option><option value="accepted">Acknowledged</option></select><div id="pList"></div></section><section class="policy-panel" id="pDetails">Select a policy to read.</section></div><section class="policy-panel"><h2>Acknowledgment history</h2><div id="pHistory"></div></section><p role="status" id="pStatus"></p>';
const $=q=>el.querySelector(q);let policies=[],acks=[],selected=null;
const got=p=>acks.find(a=>a.policy_code===p.policy_code&&a.policy_version===p.version);
function draw(){
$('#pTotal').textContent=policies.length;$('#pAccepted').textContent=policies.filter(got).length;$('#pPending').textContent=policies.filter(p=>p.requires_acknowledgment&&!got(p)).length;
const q=$('#pSearch').value.toLowerCase(),f=$('#pFilter').value;
$('#pList').innerHTML=policies.filter(p=>(f==='all'||f==='pending'&&p.requires_acknowledgment&&!got(p)||f==='accepted'&&got(p))&&[p.title,p.category].join(' ').toLowerCase().includes(q)).map(p=>'<button data-id="'+esc(p.id)+'"><strong>'+esc(p.title)+'</strong><small>'+esc(p.category)+' · Version '+esc(p.version)+'</small><span>'+ (got(p)?'Acknowledged':p.requires_acknowledgment?'Action required':'Read only')+'</span></button>').join('')||'<p>No published policies found.</p>';
$('#pHistory').innerHTML=acks.length?acks.map(a=>'<p>'+esc(a.policy_code)+' (v'+esc(a.policy_version)+') — '+new Date(a.accepted_at).toLocaleString()+'</p>').join(''):'No acknowledgments yet.';
$('#pList').querySelectorAll('button').forEach(b=>b.onclick=()=>show(b.dataset.id))
}
function show(id){selected=id;const p=policies.find(x=>x.id===id);if(!p)return;const a=got(p);$('#pDetails').innerHTML='<small>'+esc(p.category)+' · Version '+esc(p.version)+'</small><h2>'+esc(p.title)+'</h2><p>'+esc(p.summary||'')+'</p><article class="policy-body">'+esc(p.content)+'</article>'+(a?'<p>Acknowledged '+new Date(a.accepted_at).toLocaleString()+'</p>':p.requires_acknowledgment?'<label><input type="checkbox" id="pConsent"> I have read and acknowledge this policy.</label><button id="pAccept">Acknowledge</button>':'<p>No acknowledgment required.</p>');const b=$('#pAccept');if(b)b.onclick=async()=>{if(!$('#pConsent').checked)return $('#pStatus').textContent='Read and confirm acknowledgment first.';b.disabled=true;try{const r=await call('policy_acknowledge',{policy_id:id,confirm:true});acks.push({policy_code:p.policy_code,policy_version:p.version,accepted_at:r.acknowledgment.accepted_at});draw();show(id);$('#pStatus').textContent='Acknowledgment saved.'}catch(e){$('#pStatus').textContent=e.message;b.disabled=false}}}
$('#pSearch').oninput=draw;$('#pFilter').onchange=draw;
try{const d=await call('policy_center');policies=d.policies||[];acks=d.acknowledgments||[];draw();if(policies.length)show(policies[0].id)}catch(e){$('#pStatus').textContent=e.message}
}
window.ICPolicies={mount};
})();