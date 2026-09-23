(function(){
  'use strict';
  const SUPABASE_URL=window.ERALIS_SUPABASE_URL;
  const SUPABASE_KEY=window.ERALIS_SUPABASE_KEY;
  const $=s=>document.querySelector(s);
  let sb=null, user=null, profile=null, addresses=[];

  function status(msg,type='info'){
    // Durante login/cadastro, mostre a mensagem dentro do formulário,
    // logo abaixo dos campos, para que o usuário veja o erro imediatamente.
    const authVisible=!$('#authView')?.hidden;
    const el=authVisible?$('#authStatus'):$('#accountStatus');
    if(!el)return;
    el.textContent=msg||'';
    el.className='account-status '+type;
    el.hidden=!msg;
  }
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
  function authHeaders(){return {apikey:SUPABASE_KEY,Authorization:`Bearer ${sb?.session?.access_token||SUPABASE_KEY}`};}
  async function rest(path,options={}){
    const headers={...authHeaders(),...(options.headers||{})};
    const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers});
    if(!r.ok) throw new Error(await r.text()||`HTTP ${r.status}`);
    const text=await r.text(); return text?JSON.parse(text):null;
  }
  async function auth(path,options={}){
    const headers={apikey:SUPABASE_KEY,'Content-Type':'application/json',...(options.headers||{})};
    const r=await fetch(`${SUPABASE_URL}/auth/v1/${path}`,{...options,headers});
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.msg||data.error_description||data.message||'Não foi possível concluir a operação.');
    return data;
  }
  async function signIn(email,password){
    const data=await auth('token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
    localStorage.setItem('eralisAuth',JSON.stringify({access_token:data.access_token,refresh_token:data.refresh_token||''}));
    sb={session:data,user:data.user}; user=data.user; await loadAccount(); render();
  }
  async function signUp(name,email,emailConfirm,phone,cpf,password){
    if(email.toLowerCase()!==emailConfirm.toLowerCase()) throw new Error('Os e-mails não coincidem. Confira os dois campos.');
    const data=await auth('signup',{method:'POST',body:JSON.stringify({email,password,data:{full_name:name,phone,cpf}})});
    if(data.access_token){
      localStorage.setItem('eralisAuth',JSON.stringify({access_token:data.access_token,refresh_token:data.refresh_token||''}));
      sb={session:data,user:data.user};user=data.user;
      await loadAccount();
      // O perfil é criado pelo trigger do Supabase; se ainda não estiver disponível,
      // grava os dados básicos diretamente para que o cliente não precise clicar em Salvar.
      if(!profile){
        try{
          await rest('customer_profiles',{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({id:user.id,email:user.email,full_name:name,phone,cpf})});
          await loadAccount();
        }catch(_){}
      }
      render();
    }else throw new Error('Não foi possível concluir o cadastro. Verifique as configurações de autenticação do Supabase.');
  }
  async function signOut(){
    if(sb?.session?.access_token){await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:'POST',headers:authHeaders()}).catch(()=>{});}
    sb=null;user=null;profile=null;addresses=[];localStorage.removeItem('eralisAuth');
    window.location.href='index.html';
  }
  async function loadAccount(){
    if(!user)return;
    const ps=await rest(`customer_profiles?id=eq.${encodeURIComponent(user.id)}&select=*`);
    profile=ps?.[0]||null;
    addresses=await rest(`customer_addresses?customer_id=eq.${encodeURIComponent(user.id)}&select=*&order=is_default.desc,created_at.desc`)||[];
  }
  function render(){
    const logged=!!user;
    $('#authView').hidden=logged;
    $('#accountView').hidden=!logged;
    const isSignup=$('#authMode')?.value==='signup';
    $('#signupFields').hidden=!isSignup;
    $('#signupEmailConfirm').hidden=!isSignup;
    $('#signupEmailConfirmInput').required=isSignup;
    $('#signupName').required=isSignup;
    $('#loginPassword').autocomplete=isSignup?'new-password':'current-password';
    if(!logged)return;
    $('#profileName').value=profile?.full_name||user.user_metadata?.full_name||'';
    $('#profileEmail').value=profile?.email||user.email||'';
    $('#profilePhone').value=profile?.phone||user.user_metadata?.phone||'';
    $('#profileCpf').value=profile?.cpf||user.user_metadata?.cpf||'';
    renderAddresses();
    renderOrders();
  }
  function renderAddresses(){
    const box=$('#addressList');
    if(!box)return;
    if(!addresses.length){box.innerHTML='<div class="empty-card">Você ainda não cadastrou nenhum endereço.</div>';return;}
    box.innerHTML=addresses.map(a=>`<article class="address-card"><div><div class="address-head"><strong>${esc(a.label)}</strong>${a.is_default?'<span class="address-default">Padrão</span>':''}</div><p>${esc(a.street)}, ${esc(a.number)}${a.complement?', '+esc(a.complement):''}<br>${esc(a.neighborhood)} — ${esc(a.city)}/${esc(a.state)}<br>CEP ${esc(a.zipcode)}</p></div><div class="address-actions"><button type="button" data-address-edit="${a.id}">Editar</button><button type="button" data-address-delete="${a.id}">Excluir</button></div></article>`).join('');
  }
  async function renderOrders(){
    const box=$('#orderList'); if(!box)return;
    const orders=await rest(`orders?customer_id=eq.${encodeURIComponent(user.id)}&select=id,status,subtotal,shipping_cost,total,shipping_method,shipping_service,tracking_code,payment_status,created_at&order=created_at.desc`).catch(()=>[]);
    if(!orders.length){box.innerHTML='<div class="empty-card">Seus pedidos aparecerão aqui depois da primeira compra.</div>';return;}
    box.innerHTML=orders.map(o=>`<article class="order-card"><div><strong>Pedido #${String(o.id).padStart(6,'0')}</strong><small>${new Date(o.created_at).toLocaleDateString('pt-BR')}</small></div><div><span class="order-status">${esc(o.status)}</span><strong>${money(o.total)}</strong></div><div class="order-extra"><span>Pagamento: ${esc(o.payment_status)}</span><span>${o.shipping_service?`Envio: ${esc(o.shipping_service)}`:'Frete ainda não definido'}</span>${o.tracking_code?`<span>Rastreio: ${esc(o.tracking_code)}</span>`:''}</div></article>`).join('');
  }
  function resetAddressForm(){
    $('#addressForm').reset(); $('#addressId').value=''; $('#addressLabel').value='Casa'; $('#addressDefault').checked=addresses.length===0; $('#addressFormTitle').textContent='Novo endereço';
  }
  function fillAddress(a){
    $('#addressId').value=a.id; $('#addressLabel').value=a.label||'Casa'; $('#addressZipcode').value=a.zipcode||''; $('#addressStreet').value=a.street||''; $('#addressNumber').value=a.number||''; $('#addressComplement').value=a.complement||''; $('#addressNeighborhood').value=a.neighborhood||''; $('#addressCity').value=a.city||''; $('#addressState').value=a.state||''; $('#addressDefault').checked=!!a.is_default; $('#addressFormTitle').textContent='Editar endereço'; $('#addressDialog').showModal();
  }
  async function cepLookup(){
    const cep=$('#addressZipcode').value.replace(/\D/g,'');
    if(cep.length!==8)return;
    try{
      const r=await fetch(`https://viacep.com.br/ws/${cep}/json/`); const d=await r.json();
      if(d.erro)throw new Error('CEP não encontrado.');
      $('#addressStreet').value=d.logradouro||''; $('#addressNeighborhood').value=d.bairro||''; $('#addressCity').value=d.localidade||''; $('#addressState').value=d.uf||''; $('#addressNumber').focus();
    }catch(e){status(e.message,'error');}
  }
  async function saveProfile(e){
    e.preventDefault();
    try{
      const payload={full_name:$('#profileName').value.trim(),phone:$('#profilePhone').value.trim(),cpf:$('#profileCpf').value.trim()};
      await rest(`customer_profiles?id=eq.${encodeURIComponent(user.id)}`,{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(payload)});
      await loadAccount();status('Dados atualizados com sucesso.','success');
    }catch(e){status('Não foi possível salvar seus dados. '+e.message,'error');}
  }
  async function saveAddress(e){
    e.preventDefault();
    try{
      const id=$('#addressId').value;
      const payload={customer_id:user.id,label:$('#addressLabel').value.trim()||'Casa',zipcode:$('#addressZipcode').value.trim(),street:$('#addressStreet').value.trim(),number:$('#addressNumber').value.trim(),complement:$('#addressComplement').value.trim(),neighborhood:$('#addressNeighborhood').value.trim(),city:$('#addressCity').value.trim(),state:$('#addressState').value.trim().toUpperCase(),is_default:$('#addressDefault').checked};
      if(!payload.zipcode||!payload.street||!payload.number||!payload.neighborhood||!payload.city||!payload.state)throw new Error('Preencha o endereço completo.');
      if(payload.is_default) await rest(`customer_addresses?customer_id=eq.${encodeURIComponent(user.id)}`,{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({is_default:false})});
      if(id) await rest(`customer_addresses?id=eq.${encodeURIComponent(id)}&customer_id=eq.${encodeURIComponent(user.id)}`,{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(payload)});
      else await rest('customer_addresses',{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(payload)});
      $('#addressDialog').close();await loadAccount();renderAddresses();status('Endereço salvo.','success');
    }catch(e){status('Não foi possível salvar o endereço. '+e.message,'error');}
  }
  async function deleteAddress(id){
    if(!confirm('Excluir este endereço?'))return;
    try{await rest(`customer_addresses?id=eq.${encodeURIComponent(id)}&customer_id=eq.${encodeURIComponent(user.id)}`,{method:'DELETE'});await loadAccount();renderAddresses();status('Endereço excluído.','success');}catch(e){status('Não foi possível excluir o endereço. '+e.message,'error');}
  }
  async function resetPassword(){
    const email=$('#loginEmail').value.trim();
    if(!email){status('Informe seu e-mail primeiro.','error');return;}
    try{const redirectTo=new URL('redefinir-senha.html',window.location.href).href; await auth('recover?redirect_to='+encodeURIComponent(redirectTo),{method:'POST',body:JSON.stringify({email,gotrue_meta_security:{}})});status('Enviamos um link para redefinir sua senha, se o e-mail estiver cadastrado.','success');}catch(e){status(e.message,'error');}
  }
  function formatCpf(value){
    const digits=String(value||'').replace(/\D/g,'').slice(0,11);
    if(digits.length<=3)return digits;
    if(digits.length<=6)return digits.replace(/(\d{3})(\d+)/,'$1.$2');
    if(digits.length<=9)return digits.replace(/(\d{3})(\d{3})(\d+)/,'$1.$2.$3');
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/,'$1.$2.$3-$4');
  }
  function bindCpfMask(id){
    const el=$(id);
    if(!el)return;
    const sanitize=()=>{
      const digits=el.value.replace(/\D/g,'').slice(0,11);
      el.value=formatCpf(digits);
    };
    el.addEventListener('input',sanitize);
    el.addEventListener('paste',()=>setTimeout(sanitize,0));
    el.addEventListener('keydown',e=>{
      if(e.ctrlKey||e.metaKey||e.altKey)return;
      const allowed=['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
      if(allowed.includes(e.key))return;
      if(!/^[0-9]$/.test(e.key))e.preventDefault();
    });
  }

  function getSafeReturnUrl(){
    const raw=new URLSearchParams(window.location.search).get('redirect');
    if(!raw)return 'index.html';
    try{
      const u=new URL(raw,window.location.href);
      if(u.origin!==window.location.origin)return 'index.html';
      const path=u.pathname.split('/').pop()||'';
      if(['index.html','checkout.html','cliente.html'].includes(path))return u.pathname+u.search+u.hash;
    }catch(_){}
    return 'index.html';
  }

  function bind(){
    $('#authMode').addEventListener('change',render);
    bindCpfMask('#signupCpf');
    bindCpfMask('#profileCpf');
    $('#authForm').addEventListener('submit',async e=>{
      e.preventDefault();
      const form=e.currentTarget;
      const submit=$('#authSubmit');
      if(submit.disabled)return;
      status('');
      submit.disabled=true;
      const originalText=submit.textContent;
      submit.textContent=$('#authMode').value==='signup'?'Criando sua conta...':'Entrando...';
      try{
        const mode=$('#authMode').value;
        const email=$('#loginEmail').value.trim();
        const pass=$('#loginPassword').value;
        if(mode==='signup'){
          const emailConfirm=$('#signupEmailConfirmInput').value.trim();
          await signUp($('#signupName').value.trim(),email,emailConfirm,$('#signupPhone').value.trim(),$('#signupCpf').value.replace(/\D/g,''),pass);
        }else await signIn(email,pass);
        window.location.href=getSafeReturnUrl();
      }catch(e){status(e.message,'error');}
      finally{submit.disabled=false;submit.textContent=originalText;}
    });
    $('#forgotPassword').addEventListener('click',resetPassword);
    $('#profileForm').addEventListener('submit',saveProfile);
    $('#logoutBtn').addEventListener('click',signOut);
    $('#newAddressBtn').addEventListener('click',()=>{resetAddressForm();$('#addressDialog').showModal();});
    $('#addressClose').addEventListener('click',()=>$('#addressDialog').close());
    $('#addressCancel').addEventListener('click',()=>$('#addressDialog').close());
    $('#addressForm').addEventListener('submit',saveAddress);
    $('#addressZipcode').addEventListener('blur',cepLookup);
    $('#addressList').addEventListener('click',e=>{const edit=e.target.closest('[data-address-edit]');const del=e.target.closest('[data-address-delete]');if(edit){const a=addresses.find(x=>String(x.id)===String(edit.dataset.addressEdit));if(a)fillAddress(a);}if(del)deleteAddress(del.dataset.addressDelete);});
  }
  async function init(){
    if(!SUPABASE_URL||!SUPABASE_KEY){status('Supabase não configurado.','error');return;}
    bind();
    try{
      // Recupera a sessão persistida manualmente via localStorage usada por esta área.
      const saved=JSON.parse(localStorage.getItem('eralisAuth')||'null');
      if(saved?.access_token){
        const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${saved.access_token}`}});
        if(r.ok){user=await r.json();sb={session:{access_token:saved.access_token},user};await loadAccount();}
        else localStorage.removeItem('eralisAuth');
      }
      render();
    }catch(e){status('Não foi possível carregar sua conta. '+e.message,'error');}
  }
  init();
})();
