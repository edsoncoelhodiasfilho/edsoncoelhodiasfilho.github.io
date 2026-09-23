(function(){
  'use strict';
  const SUPABASE_URL=window.ERALIS_SUPABASE_URL;
  const SUPABASE_KEY=window.ERALIS_SUPABASE_KEY;
  const $=s=>document.querySelector(s);
  let user=null,profile=null,addresses=[];
  let cart=JSON.parse(localStorage.getItem('eralisCart')||'[]');
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const authRaw=localStorage.getItem('eralisAuth');
  function status(msg,type='error'){const el=$('#checkoutStatus');if(!el)return;el.textContent=msg||'';el.className='checkout-status '+type;el.hidden=!msg;}
  function headers(){const saved=authRaw?JSON.parse(authRaw):null;return {apikey:SUPABASE_KEY,Authorization:`Bearer ${saved?.access_token||SUPABASE_KEY}`};}
  async function rest(path,options={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{...headers(),...(options.headers||{})}});const text=await r.text();if(!r.ok)throw new Error(text||`HTTP ${r.status}`);return text?JSON.parse(text):null;}
  async function loadUser(){
    if(!authRaw){window.location.href='cliente.html?redirect=checkout.html';return false;}
    let saved;try{saved=JSON.parse(authRaw)}catch(_){saved=null}
    if(!saved?.access_token){window.location.href='cliente.html?redirect=checkout.html';return false;}
    const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:headers()});
    if(!r.ok){localStorage.removeItem('eralisAuth');window.location.href='cliente.html?redirect=checkout.html';return false;}
    user=await r.json();
    const ps=await rest(`customer_profiles?id=eq.${encodeURIComponent(user.id)}&select=*`);
    profile=ps?.[0]||null;
    addresses=await rest(`customer_addresses?customer_id=eq.${encodeURIComponent(user.id)}&select=*&order=is_default.desc,created_at.desc`)||[];
    return true;
  }
  function renderCustomer(){
    $('#customerName').textContent=profile?.full_name||user.user_metadata?.full_name||'Cliente';
    $('#customerEmail').textContent=profile?.email||user.email||'';
    $('#customerPhone').textContent=profile?.phone||user.user_metadata?.phone||'';
  }
  function renderCart(){
    const box=$('#cartItems');cart=cart.filter(x=>x&&x.id);
    if(!cart.length){status('Seu carrinho está vazio.','error');$('#continueBtn').disabled=true;box.innerHTML='<div class="checkout-empty">Seu carrinho está vazio.</div>';return;}
    box.innerHTML=cart.map(x=>{const price=Number(x.price||0),qty=Number(x.qty||0),line=price*qty;return `<div class="checkout-item">${x.image_url?`<img src="${esc(x.image_url)}" alt="">`:'<div></div>'}<div><strong>${esc(x.name||'Produto ERALIS')}</strong><small>${qty} unidade${qty===1?'':'s'} · ${money(price)} cada</small></div><strong class="checkout-item-price">${money(line)}</strong></div>`}).join('');
    const subtotal=cart.reduce((s,x)=>s+Number(x.price||0)*Number(x.qty||0),0);
    $('#subtotal').textContent=money(subtotal);$('#total').textContent=money(subtotal);
  }
  function renderAddresses(){
    const box=$('#addressList');if(!addresses.length){box.innerHTML='';$('#addressEmpty').hidden=false;$('#continueBtn').disabled=true;return;}
    $('#addressEmpty').hidden=true;
    const selected=addresses.find(a=>a.is_default)?.id||addresses[0].id;
    box.innerHTML=addresses.map(a=>`<label class="checkout-address ${String(a.id)===String(selected)?'selected':''}"><input type="radio" name="deliveryAddress" value="${esc(a.id)}" ${String(a.id)===String(selected)?'checked':''}><div><strong>${esc(a.label||'Endereço')}</strong><p>${esc(a.street)}, ${esc(a.number)}${a.complement?', '+esc(a.complement):''}<br>${esc(a.neighborhood)} — ${esc(a.city)}/${esc(a.state)}<br>CEP ${esc(a.zipcode)}</p></div></label>`).join('');
    box.querySelectorAll('input[name="deliveryAddress"]').forEach(input=>input.addEventListener('change',()=>{box.querySelectorAll('.checkout-address').forEach(el=>el.classList.remove('selected'));input.closest('.checkout-address').classList.add('selected');$('#continueBtn').disabled=false;}));
    $('#continueBtn').disabled=!box.querySelector('input:checked');
  }
  function resetAddressForm(){ $('#addressForm').reset();$('#addressLabel').value='Casa';$('#addressDefault').checked=addresses.length===0; }
  async function cepLookup(){const cep=$('#addressZipcode').value.replace(/\D/g,'');if(cep.length!==8)return;try{const r=await fetch(`https://viacep.com.br/ws/${cep}/json/`);const d=await r.json();if(d.erro)throw new Error('CEP não encontrado.');$('#addressStreet').value=d.logradouro||'';$('#addressNeighborhood').value=d.bairro||'';$('#addressCity').value=d.localidade||'';$('#addressState').value=d.uf||'';$('#addressNumber').focus();}catch(e){status(e.message,'error');}}
  async function saveAddress(e){e.preventDefault();const btn=e.submitter;btn.disabled=true;try{const payload={customer_id:user.id,label:$('#addressLabel').value.trim()||'Casa',zipcode:$('#addressZipcode').value.replace(/\D/g,''),street:$('#addressStreet').value.trim(),number:$('#addressNumber').value.trim(),complement:$('#addressComplement').value.trim(),neighborhood:$('#addressNeighborhood').value.trim(),city:$('#addressCity').value.trim(),state:$('#addressState').value.trim().toUpperCase(),is_default:$('#addressDefault').checked};if(payload.zipcode.length!==8)throw new Error('Informe um CEP válido.');if(!payload.street||!payload.number||!payload.neighborhood||!payload.city||!payload.state)throw new Error('Preencha o endereço completo.');if(payload.is_default)await rest(`customer_addresses?customer_id=eq.${encodeURIComponent(user.id)}`,{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({is_default:false})});await rest('customer_addresses',{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(payload)});addresses=await rest(`customer_addresses?customer_id=eq.${encodeURIComponent(user.id)}&select=*&order=is_default.desc,created_at.desc`)||[];$('#addressDialog').close();renderAddresses();status('Endereço salvo.','success');setTimeout(()=>status(''),1800);}catch(e){status('Não foi possível salvar o endereço. '+e.message,'error');}finally{btn.disabled=false;}}
  function continueToPayment(){const selected=$('input[name="deliveryAddress"]:checked');if(!selected){status('Selecione um endereço de entrega.','error');return;}status('A próxima etapa será o cálculo do frete e o pagamento.','success');/* Mercado Pago/Jadlog serão conectados na próxima etapa. */}
  document.addEventListener('DOMContentLoaded',async()=>{try{if(!(await loadUser()))return;renderCustomer();renderCart();renderAddresses();$('#newAddressBtn').onclick=()=>{resetAddressForm();$('#addressDialog').showModal();};$('#addressClose').onclick=()=>$('#addressDialog').close();$('#addressCancel').onclick=()=>$('#addressDialog').close();$('#addressForm').addEventListener('submit',saveAddress);$('#addressZipcode').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,8).replace(/(\d{5})(\d)/,'$1-$2');});$('#addressZipcode').addEventListener('blur',cepLookup);$('#continueBtn').onclick=continueToPayment;}catch(e){console.error(e);status('Não foi possível carregar o checkout. '+(e.message||'Tente novamente.'));}});
})();
