import {createClient} from "npm:@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"https://independent-contractor.screenings4u.com","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const reply=(v:any,status=200)=>new Response(JSON.stringify(v),{status,headers:H});
const htmlSafe=(v:any)=>String(v??"").replace(/[&<>"']/g,(c:string)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));
const brandedEmail=async(to:string[],subject:string,body:string)=>{const key=Deno.env.get("RESEND_API_KEY");if(!key||!to.length)return "unavailable";const html='<div style="background:#f3f6fa;padding:24px;font-family:Arial,sans-serif;color:#193a61"><div style="max-width:580px;margin:auto;background:white;border:1px solid #dbe4ed;border-radius:10px;overflow:hidden"><div style="border-bottom:4px solid #ff7100;padding:22px 25px"><img src="https://independent-contractor.screenings4u.com/images/logo.png" width="210" alt="screenings4u IC Network" style="display:block;max-width:100%;height:auto"></div><div style="padding:24px 25px"><h2 style="font-size:22px;margin:0 0 14px">'+htmlSafe(subject)+'</h2><p style="margin:0 0 18px;line-height:1.55">'+htmlSafe(body)+'</p><a href="https://app.screenings4u.com/ic-operations.html" style="display:inline-block;background:#24548d;padding:12px 18px;border-radius:7px;color:white;text-decoration:none">View in Management</a></div></div></div>';try{const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from:Deno.env.get("RESEND_FROM_EMAIL")||"screenings4u <notifications@screenings4u.com>",to,subject,html})});return r.ok?"sent":"failed"}catch{return "failed"}};

Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:H});if(req.method!=="POST")return reply({error:"Method not allowed"},405);
try{const url=Deno.env.get("SUPABASE_URL")||"",pub=Deno.env.get("SUPABASE_ANON_KEY")||"",secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();if(!token)return reply({error:"Authentication required"},401);
const userClient=createClient(url,pub,{auth:{persistSession:false}}),db=createClient(url,secret,{auth:{persistSession:false}});
const {data:{user},error}=await userClient.auth.getUser(token);if(error||!user?.email)return reply({error:"Authentication required"},401);
if(String(user.email).trim().toLowerCase().endsWith("@screenings4u.com"))return reply({error:"Internal staff addresses cannot access the IC portal."},403);
const granted=await db.from("account_type_assignments").select("id,ctpa_id,employer_id,account_types!inner(code)").eq("user_id",user.id).eq("status","active").is("archived_at",null).in("account_types.code",["dot_ctpa_contractor","dot_employer_contractor"]);if(granted.error)throw granted.error;
let authorized=false;
for(const grant of granted.data||[]){
 const code=String((grant as any).account_types?.code||"");
 if(code==="dot_ctpa_contractor"&&grant.ctpa_id){const sponsor=await db.from("ctpas").select("id").eq("id",grant.ctpa_id).eq("status","active").maybeSingle();if(sponsor.error)throw sponsor.error;if(sponsor.data){authorized=true;break}}
 if(code==="dot_employer_contractor"&&grant.employer_id){const employer=await db.from("employers").select("id").eq("id",grant.employer_id).eq("status","active").maybeSingle();if(employer.error)throw employer.error;if(employer.data){authorized=true;break}}
}
const ic=await db.from("ic_portal_access").select("enabled").eq("user_id",user.id).eq("enabled",true).maybeSingle();if(ic.error)throw ic.error;authorized=authorized||!!ic.data;
if(!authorized)return reply({error:"Contractor access not assigned"},403);
const approved=await db.from("collector_network_submissions").select("id").ilike("email",String(user.email).trim()).eq("status","approved").limit(1);if(approved.error)throw approved.error;
if(!approved.data?.length)return reply({error:"Your IC application must be approved before portal access is available."},403);
const blocked=await db.from("ic_application_denials").select("id").eq("email",String(user.email).trim().toLowerCase()).is("restored_at",null).limit(1);if(blocked.error)throw blocked.error;if(blocked.data?.length)return reply({error:"This application is denied. Contact management for restoration."},403);
const schedules=await db.from("ic_compensation_schedules").select("id,status,rates,issued_at,accepted_at").eq("contractor_user_id",user.id).order("created_at",{ascending:false}).limit(20);if(schedules.error)throw schedules.error;
const personalRates=await db.from("ic_contractor_rates").select("rate_code,amount,active").eq("contractor_user_id",user.id);if(personalRates.error)throw personalRates.error;const catalog=await db.from("ic_pricing_rates").select("code,label,currency,unit,sort_order").order("sort_order");if(catalog.error)throw catalog.error;const ownPricing=(catalog.data||[]).map((r:any)=>({...r,amount:(personalRates.data||[]).find((x:any)=>x.rate_code===r.code&&x.active)?.amount??null}));
const body=await req.json().catch(()=>({}));const section=String(body.section||"dashboard");
const valid=new Set(["dashboard","profile-account-settings","submitted-application","onboarding","assignments","assignment-details","work-orders","work-order-detail","availability-scheduling","timesheets-work-logs","invoices-payments","my-pricing","tax-center","documents","compliance-certifications","training-resources","messages-notifications","support-center","performance-reviews","company-policies","referral-program","shipping-supplies","sign-out-security"]);if(!valid.has(section))return reply({error:"Unsupported section"},400);
const writeSections=new Set(["profile-account-settings","onboarding","availability-scheduling","timesheets-work-logs","invoices-payments","tax-center","documents","compliance-certifications","training-resources","messages-notifications","support-center","performance-reviews","company-policies","referral-program","shipping-supplies"]);
if(body.action==="record_update"||body.action==="record_delete"){const rid=String(body.record_id||"");if(!/^[0-9a-f-]{36}$/i.test(rid))return reply({error:"Invalid record"},400);const existing=await db.from("ic_contractor_records").select("id,status,section").eq("id",rid).eq("user_id",user.id).eq("section",section).maybeSingle();if(existing.error)throw existing.error;if(!existing.data)return reply({error:"Record not found"},404);if(existing.data.status!=="submitted")return reply({error:"Only submitted requests can be edited or withdrawn"},409);if(body.action==="record_delete"){const q=await db.from("ic_contractor_records").update({status:"withdrawn",updated_at:new Date().toISOString()}).eq("id",rid).eq("user_id",user.id).eq("status","submitted").select("id").maybeSingle();if(q.error)throw q.error;return reply({ok:true,record:q.data})}const details=body.details||{},title=String(body.title||"").trim();if(!title||title.length>200||typeof details!=="object"||Array.isArray(details)||JSON.stringify(details).length>10000)return reply({error:"Invalid changes"},400);const keys=new Set(["description","date","hours","mileage","amount","phone","email","service_area","document_reference","notes","reference","start_date","end_date","recipient","subject","category","due_date","quantity","supply_type","shipping_address"]);if(Object.keys(details).some(k=>!keys.has(k)))return reply({error:"Unsupported field"},400);const q=await db.from("ic_contractor_records").update({title,details,updated_at:new Date().toISOString()}).eq("id",rid).eq("user_id",user.id).eq("status","submitted").select("id,title,details,status,created_at").maybeSingle();if(q.error)throw q.error;return reply({ok:true,record:q.data})}
if(body.action==="document_upload_url"||body.action==="document_attach"){if(!["documents","tax-center","onboarding","compliance-certifications"].includes(section))return reply({error:"Not a document section"},403);const kind=String(body.kind||"general").replace(/[^a-z0-9_-]/gi,"").slice(0,45)||"general";if(body.action==="document_upload_url"){const mime=String(body.mime||"");const supported:any={"application/pdf":"pdf","image/jpeg":"jpg","image/png":"png","image/webp":"webp","text/plain":"txt","text/csv":"csv","application/vnd.openxmlformats-officedocument.wordprocessingml.document":"docx","application/msword":"doc","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":"xlsx","application/vnd.ms-excel":"xls","application/vnd.openxmlformats-officedocument.presentationml.presentation":"pptx"};if(!supported[mime])return reply({error:"Unsupported file type"},400);const ext=supported[mime];const path="ic-portal/"+user.id+"/"+section+"/"+kind+"/"+crypto.randomUUID()+"."+ext;const ticket=await db.storage.from("testing-private-documents").createSignedUploadUrl(path);if(ticket.error)throw ticket.error;return reply({path,bucket:"testing-private-documents",token:ticket.data.token})}const path=String(body.path||"");if(!path.startsWith("ic-portal/"+user.id+"/"+section+"/"+kind+"/"))return reply({error:"Invalid document path"},400);const prefix=path.substring(0,path.lastIndexOf("/")),name=path.substring(path.lastIndexOf("/")+1);const files=await db.storage.from("testing-private-documents").list(prefix,{limit:100});if(files.error)throw files.error;if(!files.data?.some((x:any)=>x.name===name))return reply({error:"File not found"},404);const doc=await db.from("ic_portal_documents").insert({contractor_user_id:user.id,document_type:kind,filename:String(body.file_name||"Document").slice(0,150),storage_path:path,mime_type:({pdf:"application/pdf",jpg:"image/jpeg",png:"image/png",webp:"image/webp",txt:"text/plain",csv:"text/csv",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",doc:"application/msword",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",xls:"application/vnd.ms-excel",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation"} as any)[path.split(".").pop()?.toLowerCase()||""]||"application/octet-stream"}).select("id,status").single();if(doc.error){if(doc.error.code==="23505")return reply({error:"Document already registered"},409);throw doc.error;}const row=await db.from("ic_contractor_records").insert({user_id:user.id,section,title:String(body.title||"Uploaded document").slice(0,200),details:{category:kind,document_reference:path,file_name:String(body.file_name||"Document").slice(0,150)},status:"submitted"}).select("id,title,status,created_at").single();if(row.error)throw row.error;return reply({ok:true,record:row.data})}
if(body.action==="submit"){
 if(!writeSections.has(section))return reply({error:"Section is read only"},403);
 const title=String(body.title||"").trim();const details=body.details;
 if(title.length<1||title.length>200||!details||typeof details!=="object"||Array.isArray(details)||JSON.stringify(details).length>10000)return reply({error:"Invalid submission"},400);
 const allowedKeys=new Set(["description","date","hours","mileage","amount","phone","email","service_area","document_reference","notes","reference","start_date","end_date","recipient","subject","category","due_date","quantity","supply_type","shipping_address"]);
 if(Object.keys(details).some(k=>!allowedKeys.has(k)))return reply({error:"Unsupported submission field"},400);
 const inserted=await db.from("ic_contractor_records").insert({user_id:user.id,section,title,details,status:"submitted"}).select("id,section,title,details,status,created_at").single();
 if(inserted.error)throw inserted.error;
 return reply({ok:true,record:inserted.data});
}
const agreementRecord=await db.from("ic_agreement_submissions").select("id,tracking_number,status,agreement_version,created_at,accepted_at,agreement_url,shirt_size,mens_shirt_size").eq("email",user.email).order("created_at",{ascending:false}).limit(1);if(agreementRecord.error)throw agreementRecord.error;
const ownRecords=await db.from("ic_contractor_records").select("id,section,title,details,status,created_at").eq("user_id",user.id).eq("section",section).order("created_at",{ascending:false}).limit(100);
if(ownRecords.error)throw ownRecords.error;
const collectors=await db.from("collector_network_submissions").select("id,full_name,email,phone,company_name,city,state,availability_status,status").ilike("email",user.email).eq("status","approved").limit(10);if(collectors.error)throw collectors.error;
const ids=(collectors.data||[]).map((c:any)=>c.id);
if(section==="submitted-application"){
 const profile=(await db.from("collector_network_submissions").select("id,full_name,email,phone,company_name,city,state,zip_code,website,service_areas,application_details,status,created_at,updated_at").in("id",ids).eq("status","approved").order("created_at",{ascending:false}).limit(1)).data?.[0]||null;
 if(!profile)return reply({error:"No approved collector application is linked to this account."},403);
 if(body.action==="application_document_view"){
  const path=String(body.path||"");
  const docs=Array.isArray(profile.application_details?.supporting_documents)?profile.application_details.supporting_documents:[];
  if(!docs.some((d:any)=>d.path===path))return reply({error:"Document is not part of your application"},404);
  const signed=await db.storage.from("testing-private-documents").createSignedUrl(path,120);if(signed.error)throw signed.error;
  return reply({url:signed.data.signedUrl});
 }
 if(body.action)return reply({error:"Submitted applications are read only"},405);
 return reply({section,application:profile});
}

if(body.action==="respond_assignment"){
 const assignmentId=String(body.assignment_id||""),decision=String(body.decision||"");
 if(!/^[0-9a-f-]{36}$/i.test(assignmentId)||!["accept","decline"].includes(decision))return reply({error:"Invalid assignment response"},400);
 if(!ids.length)return reply({error:"An approved collector profile is required"},403);
 const existing=await db.from("testing_work_order_assignments").select("id,collector_id,status,work_order_id").eq("id",assignmentId).in("collector_id",ids).maybeSingle();
 if(existing.error)throw existing.error;if(!existing.data)return reply({error:"Assignment is not yours"},403);
 if(existing.data.status!=="pending")return reply({error:"Invitation is locked"},409);
 const response=body.checklist||{};
 if(decision==="accept"){
  if(response.supplies!==true||response.terms!==true||response.phone!==true||response.transport!==true||response.insurance_claimed!==true)return reply({error:"All acceptance confirmations are required"},400);
  const eta=String(response.eta||"");
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(eta)||!Number.isFinite(Date.parse(eta)))return reply({error:"Valid estimated arrival date and time required"},400);
 }
 const now=new Date().toISOString(),next=decision==="accept"?"pending_admin_review":"declined";
 const update:any={status:next,responded_at:now,terms_accepted_at:decision==="accept"?now:null};
 if(decision==="accept")update.metadata={acceptance_checklist:{...response,recorded_at:now,terms_accepted_at:now}};
 const updated=await db.from("testing_work_order_assignments").update(update).eq("id",assignmentId).eq("status","pending").in("collector_id",ids).select("id,status,responded_at").maybeSingle();
 if(updated.error)throw updated.error;if(!updated.data)return reply({error:"Already answered"},409);
 await db.from("testing_work_order_events").insert({work_order_id:existing.data.work_order_id,event_type:decision==="accept"?"collector_pending_admin_review":"collector_declined",actor_type:"collector",actor_user_id:user.id,collector_id:existing.data.collector_id,notes:"Response submitted through contractor portal"});
 if(decision==="accept"){
  const admins=await db.from("staff_role_assignments").select("user_id").eq("active",true).in("role_code",["super_admin","ic_operations_admin"]).limit(30);
  if(!admins.error){const recipients=await Promise.all((admins.data||[]).map(async(x:any)=>{const u=await db.auth.admin.getUserById(x.user_id);return u.data.user?.email||""}));await brandedEmail([...new Set(recipients.filter(Boolean))],"IC Work Order Awaiting Award Review","A contractor accepted an invitation and submitted the readiness checklist. Review the candidate in the admin IC Work Orders queue before awarding.");}
 }
 return reply({ok:true,assignment:updated.data});
}
if(["start_work_order","progress_view","progress_save","progress_upload_url","progress_attach"].includes(String(body.action||""))){
 const aid=String(body.assignment_id||"");if(!/^[0-9a-f-]{36}$/i.test(aid)||!ids.length)return reply({error:"Assignment unavailable"},403);
 const a=await db.from("testing_work_order_assignments").select("id,status,work_order_id,collector_id").eq("id",aid).in("collector_id",ids).maybeSingle();
 if(a.error)throw a.error;if(!a.data)return reply({error:"Assignment unavailable"},403);
 const existing=await db.from("ic_assignment_progress").select("details").eq("assignment_id",aid).eq("user_id",user.id).maybeSingle();
 if(existing.error)throw existing.error;const previous=existing.data?.details||{};
 if(body.action==="progress_view")return reply({progress:previous,assignment_status:a.data.status});
 if(body.action==="start_work_order"){
  if(a.data.status!=="awarded")return reply({error:"Work order has not been awarded"},409);
  const order=await db.from("testing_work_orders").select("assigned_collector_id,status").eq("id",a.data.work_order_id).maybeSingle();if(order.error)throw order.error;if(!order.data||order.data.assigned_collector_id!==a.data.collector_id)return reply({error:"Work order not awarded to you"},403);
  const docs=await db.from("ic_portal_documents").select("document_type,status,expires_on").eq("contractor_user_id",user.id).in("status",["verified","approved"]).limit(100);if(docs.error)throw docs.error;
  const today=new Date().toISOString().slice(0,10);if(!(docs.data||[]).some((d:any)=>/professional.?liability/i.test(d.document_type||"")&&d.expires_on&&d.expires_on>=today))return reply({error:"Valid Professional Liability insurance is required before starting"},409);
  const now=new Date().toISOString(),next={...previous,started_at:previous.started_at||now,updated_at:now};
  const up=await db.from("ic_assignment_progress").upsert({assignment_id:aid,user_id:user.id,details:next,updated_at:now},{onConflict:"assignment_id"});if(up.error)throw up.error;
  const w=await db.from("testing_work_orders").update({status:"in_progress"}).eq("id",a.data.work_order_id).eq("assigned_collector_id",a.data.collector_id).in("status",["scheduled","in_progress"]);if(w.error)throw w.error;
  return reply({ok:true,progress:next});
 }
 if(!["awarded","accepted"].includes(a.data.status))return reply({error:"This work order has not been awarded to you"},409);const parent=await db.from("testing_work_orders").select("assigned_collector_id").eq("id",a.data.work_order_id).single();if(parent.error)throw parent.error;if(parent.data.assigned_collector_id!==a.data.collector_id)return reply({error:"Management has not awarded this work order to you"},403);
 if(body.action==="progress_save"){
   if(a.data.status==="awarded"&&!previous.started_at)return reply({error:"Start the approved work order before recording collection activity"},409);
   const step=String(body.step||"");const allowed=["eta","arrival","pretest","incident","test_finished","departure","scan_confirmed","submit_review"];
   if(!allowed.includes(step))return reply({error:"Invalid step"},400);
   const fields=body.values||{},next={...previous};const date=new Date().toISOString();
   if(step==="eta"){if(!/^\d{4}-\d{2}-\d{2}T/.test(String(fields.estimated_arrival||"")))return reply({error:"Arrival estimate required"},400);next.estimated_arrival=String(fields.estimated_arrival)}
   if(step==="arrival"){const lat=Number(fields.latitude),lng=Number(fields.longitude),accuracy=Number(fields.accuracy);if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lng)||Math.abs(lng)>180||!Number.isFinite(accuracy)||accuracy<0||accuracy>10000)return reply({error:"Location permission and valid coordinates required"},400);next.arrived_at=next.arrived_at||date;next.location={latitude:lat,longitude:lng,accuracy_m:accuracy,captured_at:date}}
   if(step==="pretest"){if(!next.arrived_at)return reply({error:"Complete location check-in first"},409);if(!next.collector_selfie_path)return reply({error:"Upload the required collector uniform selfie before starting collection"},409);next.pretest_at=next.pretest_at||date}
   if(step==="incident"){const event=String(fields.event||"").slice(0,100),notes=String(fields.notes||"").slice(0,2500);if(!event)return reply({error:"Choose a collection event"},400);next.incidents=[...(Array.isArray(next.incidents)?next.incidents:[]),{event,notes,recorded_at:date}].slice(-50)}
   if(step==="test_finished"){if(!next.pretest_at)return reply({error:"Record the pre-test start first"},409);next.test_finished_at=next.test_finished_at||date}
   if(step==="departure"){if(!next.test_finished_at)return reply({error:"Record test completion first"},409);next.departed_at=next.departed_at||date}
   if(step==="scan_confirmed"){next.scan_confirmed_at=date;next.scan_confirmation_note=String(fields.note||"").slice(0,1000)}
   if(step==="submit_review"){if(!next.location||!next.pretest_at||!next.donor_id_path||!next.mro_copy2_path||!next.employer_copy5_path||!next.collector_selfie_path||!next.test_finished_at||!next.departed_at||!next.scan_confirmed_at)return reply({error:"Complete all required timestamps and documents, including both custody copies, before submission"},409);if(previous.corrections_required){const response=String(fields.corrections_response||"").trim().slice(0,3000);if(!response)return reply({error:"Explain the corrections made before resubmitting"},400);next.corrections_response=response;next.corrections_response_at=date;next.corrections_history=[...(Array.isArray(previous.corrections_history)?previous.corrections_history:[]),{requested_at:previous.corrections_requested_at,request:previous.corrections_required,response,responded_at:date}].slice(-20)}next.submitted_for_review_at=date;next.corrections_required=null;next.payment_hold=true}
   next.last_step=step;next.updated_at=date;
   const saved=await db.from("ic_assignment_progress").upsert({assignment_id:aid,user_id:user.id,details:next,updated_at:date},{onConflict:"assignment_id"});if(saved.error)throw saved.error;
   if(step==="submit_review"){const review=await db.from("ic_portal_payment_reviews").upsert({assignment_id:aid,contractor_user_id:user.id,review_status:"pending",review_notes:null,submitted_at:date},{onConflict:"assignment_id"});if(review.error)throw review.error;const completed=await db.from("testing_work_order_assignments").update({status:"completed"}).eq("id",aid).in("status",["accepted","awarded"]);if(completed.error)throw completed.error;const job=await db.from("testing_work_orders").update({status:"completed",completed_at:date}).eq("id",a.data.work_order_id).in("status",["accepted","scheduled","in_progress","completed"]);if(job.error)throw job.error;const admins=await db.from("staff_role_assignments").select("user_id").eq("active",true).in("role_code",["super_admin","finance_admin","ic_operations_admin"]).limit(50);if(!admins.error){const accounts=await Promise.all((admins.data||[]).slice(0,25).map(async(x:any)=>{const u=await db.auth.admin.getUserById(x.user_id);return u.data.user?.email||""}));await brandedEmail([...new Set(accounts.filter(Boolean))],"IC Work Order Ready for Review","A collector has submitted a completed work order. Open Management → Operations & Settlements → Payment Reviews to inspect the work order and approve or request changes.")}}
   if(step==="pretest"){const wo=await db.from("testing_work_orders").update({status:"in_progress"}).eq("id",a.data.work_order_id).in("status",["accepted","scheduled","sent","ready_to_assign"]);if(wo.error)throw wo.error;}return reply({ok:true,progress:next});
 }
 if(body.action==="progress_upload_url"){
   const kind=String(body.kind||""),mime=String(body.mime||"");if(!["donor_id","mro_copy2","employer_copy5","collector_selfie"].includes(kind)||!["image/jpeg","image/png","image/webp","application/pdf"].includes(mime))return reply({error:"Unsupported document type"},400);
   if(!previous.arrived_at&&kind!=="collector_selfie")return reply({error:"Check in at the site before uploading"},409);
   const ext=mime==="application/pdf"?"pdf":mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg";
   const path="ic-completion/"+aid+"/"+kind+"/"+crypto.randomUUID()+"."+ext;const tokenResult=await db.storage.from("testing-private-documents").createSignedUploadUrl(path);
   if(tokenResult.error)throw tokenResult.error;return reply({bucket:"testing-private-documents",path,token:tokenResult.data.token});
 }
 if(body.action==="progress_attach"){
   const kind=String(body.kind||""),path=String(body.path||"");if(!["donor_id","mro_copy2","employer_copy5","collector_selfie"].includes(kind)||!path.startsWith("ic-completion/"+aid+"/"+kind+"/"))return reply({error:"Invalid private attachment"},400);
   const list=await db.storage.from("testing-private-documents").list("ic-completion/"+aid+"/"+kind,{limit:100});if(list.error)throw list.error;
   if(!list.data?.some((file:any)=>path.endsWith("/"+file.name)))return reply({error:"Upload not found"},404);
   const next={...previous,[kind+"_path"]:path,[kind+"_uploaded_at"]:new Date().toISOString(),updated_at:new Date().toISOString()};const q=await db.from("ic_assignment_progress").upsert({assignment_id:aid,user_id:user.id,details:next,updated_at:next.updated_at},{onConflict:"assignment_id"});if(q.error)throw q.error;return reply({ok:true,progress:next});
 }
}
let assignments:any[]=[];
if(ids.length){const q=await db.from("testing_work_order_assignments").select("id,work_order_id,status,offered_amount,currency,sent_at,responded_at,terms_accepted_at").in("collector_id",ids).limit(100);if(q.error)throw q.error;assignments=q.data||[]}
const workIds=assignments.map(a=>a.work_order_id);let jobs:any[]=[];
if(workIds.length){const q=await db.from("testing_work_orders").select("id,work_order_number,work_order_title,status,site_name,city,state,requested_date,requested_start_time,requested_end_time,special_instructions,contact_name,contact_phone,company_name,site_name,address_line_1,address_line_2,postal_code,donor_count,work_order_type,metadata,terms_and_conditions").in("id",workIds).limit(100);if(q.error)throw q.error;jobs=q.data||[]}
const serviceRows=workIds.length?await db.from("testing_work_order_services").select("work_order_id,service_name,service_description,quantity").in("work_order_id",workIds).limit(500):{data:[],error:null};if(serviceRows.error)throw serviceRows.error;
const rows=assignments.map(a=>{const job=jobs.find(j=>j.id===a.work_order_id)||null;return {...a,job:job?{...job,metadata:undefined,operational_details:job.metadata?.operational_details||{},services:(serviceRows.data||[]).filter((x:any)=>x.work_order_id===a.work_order_id).map((x:any)=>({service_name:x.service_name,service_description:x.service_description,quantity:x.quantity}))}:null}});
return reply({section,agreement_submission:agreementRecord.data?.[0]||null,individual_pricing:ownPricing,compensation_schedules:schedules.data||[],records:ownRecords.data||[],profile:collectors.data?.[0]||null,assignments:rows,summary:{total:rows.length,active:rows.filter(x=>["accepted"].includes(x.status)).length,completed:rows.filter(x=>x.status==="completed").length},message:ids.length?null:"No approved collector profile is linked to this account."});
}catch(e){console.error("independent-contractor-workspace",e);return reply({error:"Unable to load contractor workspace"},500)}});