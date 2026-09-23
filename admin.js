function readLocalAdmin(key,fallback=null){try{const v=localStorage.getItem(key);return v===null?fallback:v}catch(_){return fallback}}
function writeLocalAdmin(key,value){try{localStorage.setItem(key,value)}catch(_){}}
function removeLocalAdmin(key){try{localStorage.removeItem(key)}catch(_){}}
const BUCKET=window.ERALIS_SUPABASE_BUCKET||"eralis-images";
const SB_URL=window.ERALIS_SUPABASE_URL;
const SB_KEY=window.ERALIS_SUPABASE_KEY;
const TOKEN_KEY="eralis_supabase_access_token";
let accessToken=readLocalAdmin(TOKEN_KEY);
let products=[],categories=[];

function money(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function escapeHtml(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function showError(e){console.error(e);alert(e?.message||"Não foi possível concluir a operação.");}
function headers(extra={}){return {apikey:SB_KEY,Authorization:`Bearer ${accessToken||SB_KEY}`,...extra};}
async function api(path,opt={}){const res=await fetch(`${SB_URL}${path}`,{...opt,headers:headers(opt.headers||{})});const text=await res.text();let data=null;try{data=text?JSON.parse(text):null}catch{}if(!res.ok)throw new Error(data?.message||data?.error_description||text||`HTTP ${res.status}`);return data;}

async function signIn(){
  const errorBox=document.querySelector("#loginError");errorBox.textContent="Entrando...";
  try{const email=document.querySelector("#loginEmail").value.trim(),password=document.querySelector("#loginPassword").value;
    const res=await fetch(`${SB_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:SB_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    const data=await res.json();if(!res.ok)throw new Error(data.error_description||data.msg||"E-mail ou senha inválidos.");
    accessToken=data.access_token;writeLocalAdmin(TOKEN_KEY,accessToken);errorBox.textContent="";await loadData();
  }catch(e){errorBox.textContent=e.message;}
}
async function requireAdmin(){
  const notice=document.querySelector("#supabaseNotice"),card=document.querySelector("#loginCard");
  if(!SB_URL||!SB_KEY||SB_URL.includes("COLE_AQUI")||SB_KEY.includes("COLE_AQUI")){notice.innerHTML="<strong>Supabase não configurado.</strong>";card.style.display="none";return false;}
  if(!accessToken){notice.innerHTML="<strong>Faça login para administrar o site.</strong>";card.style.display="block";return false;}
  try{const u=await api("/auth/v1/user");if(!u?.id)throw new Error("Sessão inválida.");card.style.display="none";notice.innerHTML="<strong>Supabase conectado.</strong> Você está autenticado.";return true;}
  catch(e){removeLocalAdmin(TOKEN_KEY);accessToken=null;notice.innerHTML="<strong>Faça login para administrar o site.</strong>";card.style.display="block";return false;}
}
async function loadData(){
  if(!await requireAdmin())return;
  try{
    [products,categories]=await Promise.all([
      api("/rest/v1/products?select=id,name,description,measurements,price,active,sort_order,category_id,weight_kg,package_width_cm,package_height_cm,package_length_cm,image_url,image_path,image_url_2,image_path_2,image_url_3,image_path_3,image_url_4,image_path_4,video_url,video_path&order=sort_order.asc,created_at.asc"),
      api("/rest/v1/product_categories?select=id,name,active,sort_order,created_at&order=sort_order.asc,created_at.asc")
    ]);
    render();
  }catch(e){showError(e);}
}
function categoryName(id){return categories.find(c=>String(c.id)===String(id))?.name||"Sem categoria";}
function render(){
  const catBox=document.querySelector("#categoriesAdmin");
  catBox.innerHTML=categories.length?categories.map(c=>{
    const count=products.filter(p=>String(p.category_id)===String(c.id)).length;
    return `<article class="admin-item category-item"><div class="admin-thumb category-thumb"><span>▦</span></div><div class="admin-item-body"><h3>${escapeHtml(c.name)}</h3><p>${count} produto${count===1?'':'s'} vinculado${count===1?'':'s'}</p><div class="admin-meta"><strong>Ordem ${Number(c.sort_order||0)+1}</strong><span class="status ${c.active?'on':'off'}">${c.active?'ATIVA':'INATIVA'}</span></div><div class="admin-item-actions"><button class="primary" onclick="editCategory(${c.id})">Editar</button><button onclick="toggleCategory(${c.id})">${c.active?'Desativar':'Ativar'}</button><button class="danger" onclick="deleteCategory(${c.id})">Excluir</button></div></div></article>`;
  }).join(''):'<div class="admin-empty">Nenhuma categoria cadastrada.</div>';

  const prodBox=document.querySelector("#productsAdmin");
  prodBox.innerHTML=products.length ? products.map(p=>`<article class="admin-item"><div class="admin-thumb">${p.image_url?`<img src="${p.image_url}" alt="${escapeHtml(p.name)}">`:`<span style="font-size:50px;color:#c7943e;font-weight:800">✦</span>`}</div><div class="admin-item-body"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description)}</p><div class="media-status"><span>Categoria: ${escapeHtml(categoryName(p.category_id))}</span><span>${p.image_url?"Imagem 1 ✓":"Imagem 1 —"}</span><span>${p.image_url_2?"Imagem 2 ✓":"Imagem 2 —"}</span><span>${p.image_url_3?"Imagem 3 ✓":"Imagem 3 —"}</span><span>${p.image_url_4?"Imagem 4 ✓":"Imagem 4 —"}</span><span>${p.video_url?"Vídeo ✓":"Vídeo —"}</span></div><div class="admin-meta"><strong>${money(p.price)}</strong><span class="status ${p.active?"on":"off"}">${p.active?"ATIVO":"INATIVO"}</span></div><div class="admin-meta"><small>Frete: ${p.weight_kg!=null?Number(p.weight_kg).toLocaleString("pt-BR",{minimumFractionDigits:3,maximumFractionDigits:3})+" kg":"não informado"} · ${p.package_width_cm!=null&&p.package_height_cm!=null&&p.package_length_cm!=null?[p.package_width_cm,p.package_height_cm,p.package_length_cm].map(v=>Number(v).toLocaleString("pt-BR",{maximumFractionDigits:1})).join(" × ")+" cm":"dimensões não informadas"}</small></div><div class="admin-item-actions"><button class="primary" onclick="editProduct(${p.id})">Editar</button><button onclick="toggleProduct(${p.id})">${p.active?"Desativar":"Ativar"}</button><button class="danger" onclick="deleteProduct(${p.id})">Excluir</button></div></div></article>`).join("") : `<div class="admin-empty">Nenhum produto cadastrado.</div>`;
  populateCategorySelect();
}
function populateCategorySelect(selected){
  const s=document.querySelector("#productCategory");if(!s)return;
  s.innerHTML=categories.filter(c=>c.active||String(c.id)===String(selected)).map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  if(selected!=null)s.value=String(selected);
}

window.editCategory=id=>{const c=categories.find(x=>x.id===id);if(!c)return;document.querySelector("#categoryDialogTitle").textContent="Editar categoria";document.querySelector("#categoryId").value=c.id;document.querySelector("#categoryName").value=c.name;document.querySelector("#categoryDialog").showModal();};
window.toggleCategory=async id=>{try{const c=categories.find(x=>x.id===id);await api(`/rest/v1/product_categories?id=eq.${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:!c.active})});await loadData();}catch(e){showError(e);}};
window.deleteCategory=async id=>{const c=categories.find(x=>x.id===id);if(!c)return;const count=products.filter(p=>String(p.category_id)===String(id)).length;const msg=count?`A categoria "${c.name}" possui ${count} produto(s). Excluí-la deixará esses produtos sem categoria. Continuar?`:`Excluir a categoria "${c.name}"?`;if(!confirm(msg))return;try{await api(`/rest/v1/product_categories?id=eq.${id}`,{method:"DELETE"});await loadData();}catch(e){showError(e);}};

async function ensureFourthImageColumns(){
  try{
    await api("/rest/v1/products?select=image_url_4,image_path_4&limit=1");
    return true;
  }catch(e){
    throw new Error("A 4ª imagem ainda não está disponível no banco de dados. Execute no Supabase o SQL atualizado para adicionar image_url_4 e image_path_4.");
  }
}
async function uploadMedia(file,folder,type){
  if(!file)return {url:null,path:null};const limit=type==="video"?30*1024*1024:6*1024*1024;
  if(file.size>limit)throw new Error(type==="video"?"O vídeo deve ter no máximo 30 MB.":"A imagem deve ter no máximo 6 MB.");
  if(type==="image"&&!file.type.startsWith("image/"))throw new Error("Selecione um arquivo de imagem.");
  if(type==="video"&&!file.type.startsWith("video/"))throw new Error("Selecione um arquivo de vídeo.");
  const ext=(file.name.split(".").pop()||(type==="video"?"mp4":"jpg")).toLowerCase(),path=`${folder}/${crypto.randomUUID()}.${ext}`;
  const res=await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${path}`,{method:"POST",headers:headers({"Content-Type":file.type}),body:file});
  if(!res.ok)throw new Error(await res.text()||"Falha no upload.");return {url:`${SB_URL}/storage/v1/object/public/${BUCKET}/${path}`,path};
}
async function removeImage(path){if(path)await fetch(`${SB_URL}/storage/v1/object/${BUCKET}`,{method:"DELETE",headers:headers({"Content-Type":"application/json"}),body:JSON.stringify({prefixes:[path]})});}

window.editProduct=id=>{const p=products.find(x=>x.id===id);if(!p)return;document.querySelector("#productDialogTitle").textContent="Editar produto";document.querySelector("#productId").value=p.id;document.querySelector("#productName").value=p.name;document.querySelector("#productDescription").value=p.description||"";document.querySelector("#productMeasurements").value=p.measurements||"";document.querySelector("#productWeightKg").value=p.weight_kg??"";document.querySelector("#productPackageWidth").value=p.package_width_cm??"";document.querySelector("#productPackageHeight").value=p.package_height_cm??"";document.querySelector("#productPackageLength").value=p.package_length_cm??"";document.querySelector("#productPrice").value=p.price;document.querySelector("#productActive").value=String(p.active);populateCategorySelect(p.category_id);document.querySelector("#productImage1").value="";document.querySelector("#productImage2").value="";document.querySelector("#productImage3").value="";document.querySelector("#productImage4").value="";document.querySelector("#productVideo").value="";document.querySelector("#productPreview1").innerHTML=p.image_url?`<img src="${p.image_url}" alt="">`:"Nenhuma imagem";document.querySelector("#productPreview2").innerHTML=p.image_url_2?`<img src="${p.image_url_2}" alt="">`:"Nenhuma imagem";document.querySelector("#productPreview3").innerHTML=p.image_url_3?`<img src="${p.image_url_3}" alt="">`:"Nenhuma imagem";document.querySelector("#productPreview4").innerHTML=p.image_url_4?`<img src="${p.image_url_4}" alt="">`:"Nenhuma imagem";document.querySelector("#productVideoPreview").innerHTML=p.video_url?`<video src="${p.video_url}" controls muted></video>`:"Nenhum vídeo";document.querySelector("#productDialog").showModal();};
window.toggleProduct=async id=>{try{const p=products.find(x=>x.id===id);await api(`/rest/v1/products?id=eq.${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({active:!p.active})});await loadData();}catch(e){showError(e);}};
window.deleteProduct=async id=>{if(!confirm("Excluir este produto?"))return;try{const p=products.find(x=>x.id===id);await api(`/rest/v1/products?id=eq.${id}`,{method:"DELETE"});await removeImage(p?.image_path);await removeImage(p?.image_path_2);await removeImage(p?.image_path_3);await removeImage(p?.image_path_4);await removeImage(p?.video_path);await loadData();}catch(e){showError(e);}};

document.querySelector("#addCategoryBtn").onclick=()=>{document.querySelector("#categoryForm").reset();document.querySelector("#categoryId").value="";document.querySelector("#categoryDialogTitle").textContent="Nova categoria";document.querySelector("#categoryDialog").showModal();};
document.querySelector("#categoryForm").onsubmit=async e=>{e.preventDefault();if(!await requireAdmin())return;try{const id=Number(document.querySelector("#categoryId").value),name=document.querySelector("#categoryName").value.trim();if(!name)throw new Error("Informe o nome da categoria.");if(categories.some(c=>c.name.trim().toLowerCase()===name.toLowerCase()&&String(c.id)!==String(id)))throw new Error("Já existe uma categoria com esse nome.");if(id)await api(`/rest/v1/product_categories?id=eq.${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})});else{const max=categories.reduce((m,c)=>Math.max(m,Number(c.sort_order||0)),0);await api("/rest/v1/product_categories",{method:"POST",headers:{"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({name,active:true,sort_order:max+1})});}document.querySelector("#categoryDialog").close();await loadData();}catch(e){showError(e);}};

document.querySelector("#addProductBtn").onclick=()=>{document.querySelector("#productForm").reset();document.querySelector("#productId").value="";document.querySelector("#productDialogTitle").textContent="Adicionar produto";document.querySelector("#productPreview1").textContent="Nenhuma imagem selecionada";document.querySelector("#productPreview2").textContent="Nenhuma imagem selecionada";document.querySelector("#productPreview3").textContent="Nenhuma imagem selecionada";document.querySelector("#productPreview4").textContent="Nenhuma imagem selecionada";document.querySelector("#productVideoPreview").textContent="Nenhum vídeo selecionado";populateCategorySelect(categories.find(c=>c.active)?.id);document.querySelector("#productDialog").showModal();};
function bindImagePreview(inputId,previewId){document.querySelector("#"+inputId).onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>document.querySelector("#"+previewId).innerHTML=`<img src="${r.result}" alt="">`;r.readAsDataURL(f);};}
bindImagePreview("productImage1","productPreview1");bindImagePreview("productImage2","productPreview2");bindImagePreview("productImage3","productPreview3");bindImagePreview("productImage4","productPreview4");
document.querySelector("#productVideo").onchange=e=>{const f=e.target.files[0];if(!f)return;document.querySelector("#productVideoPreview").innerHTML=`<video src="${URL.createObjectURL(f)}" controls muted></video>`;};

document.querySelector("#productForm").onsubmit=async e=>{e.preventDefault();if(!await requireAdmin())return;try{const id=Number(document.querySelector("#productId").value),old=products.find(p=>p.id===id),file1=document.querySelector("#productImage1").files[0],file2=document.querySelector("#productImage2").files[0],file3=document.querySelector("#productImage3").files[0],file4=document.querySelector("#productImage4").files[0],video=document.querySelector("#productVideo").files[0];if(file4)await ensureFourthImageColumns();let image_url=old?.image_url||null,image_path=old?.image_path||null,image_url_2=old?.image_url_2||null,image_path_2=old?.image_path_2||null,image_url_3=old?.image_url_3||null,image_path_3=old?.image_path_3||null,image_url_4=old?.image_url_4||null,image_path_4=old?.image_path_4||null,video_url=old?.video_url||null,video_path=old?.video_path||null;if(file1){const u=await uploadMedia(file1,"products","image");image_url=u.url;image_path=u.path;}if(file2){const u=await uploadMedia(file2,"products","image");image_url_2=u.url;image_path_2=u.path;}if(file3){const u=await uploadMedia(file3,"products","image");image_url_3=u.url;image_path_3=u.path;}if(file4){const u=await uploadMedia(file4,"products","image");image_url_4=u.url;image_path_4=u.path;}if(video){const u=await uploadMedia(video,"products","video");video_url=u.url;video_path=u.path;}const category_id=Number(document.querySelector("#productCategory").value);if(!category_id)throw new Error("Selecione uma categoria.");const weightValue=document.querySelector("#productWeightKg").value.trim();const widthValue=document.querySelector("#productPackageWidth").value.trim();const heightValue=document.querySelector("#productPackageHeight").value.trim();const lengthValue=document.querySelector("#productPackageLength").value.trim();if(!weightValue||!widthValue||!heightValue||!lengthValue)throw new Error("Informe peso e as três dimensões da embalagem para o cálculo do frete.");const weight_kg=Number(weightValue),package_width_cm=Number(widthValue),package_height_cm=Number(heightValue),package_length_cm=Number(lengthValue);if(!Number.isFinite(weight_kg)||weight_kg<=0)throw new Error("Informe um peso válido para o frete.");if([package_width_cm,package_height_cm,package_length_cm].some(v=>!Number.isFinite(v)||v<=0))throw new Error("Informe dimensões válidas para a embalagem.");const payload={name:document.querySelector("#productName").value.trim(),description:document.querySelector("#productDescription").value.trim(),measurements:document.querySelector("#productMeasurements").value.trim(),price:Number(document.querySelector("#productPrice").value||0),active:document.querySelector("#productActive").value==="true",category_id,weight_kg,package_width_cm,package_height_cm,package_length_cm,image_url,image_path,image_url_2,image_path_2,image_url_3,image_path_3,image_url_4,image_path_4,video_url,video_path};if(id)await api(`/rest/v1/products?id=eq.${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});else{const max=products.reduce((m,p)=>Math.max(m,p.sort_order||0),0);await api("/rest/v1/products",{method:"POST",headers:{"Content-Type":"application/json","Prefer":"return=minimal"},body:JSON.stringify({...payload,sort_order:max+1})});}if(file1&&old?.image_path&&old.image_path!==image_path)await removeImage(old.image_path);if(file2&&old?.image_path_2&&old.image_path_2!==image_path_2)await removeImage(old.image_path_2);if(file3&&old?.image_path_3&&old.image_path_3!==image_path_3)await removeImage(old.image_path_3);if(file4&&old?.image_path_4&&old.image_path_4!==image_path_4)await removeImage(old.image_path_4);if(video&&old?.video_path&&old.video_path!==video_path)await removeImage(old.video_path);document.querySelector("#productDialog").close();await loadData();}catch(e){showError(e);}};

document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>document.querySelector("#"+b.dataset.close).close());
document.querySelector("#logoutBtn").onclick=()=>{removeLocalAdmin(TOKEN_KEY);accessToken=null;location.reload();};
document.querySelector("#resetBtn").onclick=async()=>{if(confirm("Restaurar os exemplos? Isso apagará os produtos do Supabase."))try{await api("/rest/v1/products?id=gt.0",{method:"DELETE"});await loadData();}catch(e){showError(e);}};
document.querySelector("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify({products,categories},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="eralis-conteudo.json";a.click();};
document.querySelector("#loginForm").addEventListener("submit",e=>{e.preventDefault();signIn();});
if(SB_URL&&SB_KEY)loadData();else document.querySelector("#supabaseNotice").innerHTML="<strong>Supabase não configurado.</strong>";
