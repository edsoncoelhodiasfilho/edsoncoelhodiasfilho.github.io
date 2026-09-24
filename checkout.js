(function(){
  'use strict';

  // =========================================================
  // ERALIS — Checkout / Frete
  // ERALIS — Checkout + Correios simulado + Mercado Pago
  // O frete permanece simulado nesta etapa. O pagamento é criado no backend
  // via Supabase Edge Function para que o Access Token do Mercado Pago nunca
  // seja exposto no navegador.
  // =========================================================
  const SUPABASE_URL=window.ERALIS_SUPABASE_URL;
  const SUPABASE_KEY=window.ERALIS_SUPABASE_KEY;
  const MP_FUNCTION='mercado-pago-create-order';
  const $=s=>document.querySelector(s);
  let user=null,profile=null,addresses=[];
  let cart=JSON.parse(localStorage.getItem('eralisCart')||'[]');
  let shippingQuotes=[];
  let selectedShipping=null;
  let freightCalculated=false;
  let shippingDataReady=false;

  // Origem usada somente na simulação.
  // Quando houver integração real, esta informação deverá vir do backend/configuração segura.
  const SHIPPING_CONFIG={
    mode:'simulation',
    carrier:'Correios',
    originCep:'49000-000',
  };

  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const authRaw=localStorage.getItem('eralisAuth');
  function status(msg,type='error'){const el=$('#checkoutStatus');if(!el)return;el.textContent=msg||'';el.className='checkout-status '+type;el.hidden=!msg;}
  function headers(){const saved=authRaw?JSON.parse(authRaw):null;return {apikey:SUPABASE_KEY,Authorization:`Bearer ${saved?.access_token||SUPABASE_KEY}`};}
  async function rest(path,options={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{...headers(),...(options.headers||{})}});const text=await r.text();if(!r.ok)throw new Error(text||`HTTP ${r.status}`);return text?JSON.parse(text):null;}

  async function loadCartProducts(){
    const ids=[...new Set(cart.map(x=>String(x?.id||'')).filter(Boolean))];
    if(!ids.length){shippingDataReady=false;return;}
    const filter=ids.map(id=>encodeURIComponent(id)).join(',');
    const rows=await rest(`products?id=in.(${filter})&select=id,name,description,price,image_url,measurements,weight_kg,package_width_cm,package_height_cm,package_length_cm`);
    const byId=new Map((rows||[]).map(p=>[String(p.id),p]));
    cart=cart.map(item=>{
      const p=byId.get(String(item.id));
      if(!p)return {...item,missingProduct:true};
      return {...item,...p,qty:Number(item.qty||1)};
    });
    const missing=cart.filter(x=>x.missingProduct);
    const incomplete=cart.filter(x=>!x.missingProduct && (!Number(x.weight_kg)||!Number(x.package_width_cm)||!Number(x.package_height_cm)||!Number(x.package_length_cm)));
    shippingDataReady=!missing.length&&!incomplete.length;
    if(missing.length)throw new Error('Um ou mais produtos do carrinho não foram encontrados no catálogo.');
  }

  async function loadUser(){
    if(!authRaw){window.location.href='cliente.html?redirect=checkout.html';return false;}
    let saved;try{saved=JSON.parse(authRaw)}catch(_){saved=null}
    if(!saved?.access_token){window.location.href='cliente.html?redirect=checkout.html';return false;}
    const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:headers()});
    if(!r.ok){localStorage.removeItem('eralisAuth');window.location.href='cliente.html?redirect=checkout.html';return false;}
    user=await r.json();
    await loadCartProducts();
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
    const box=$('#cartItems');
    cart=cart.filter(x=>x&&x.id&&!x.missingProduct);
    if(!cart.length){
      status('Seu carrinho está vazio.','error');
      $('#continueBtn').disabled=true;
      box.innerHTML='<div class="checkout-empty">Seu carrinho está vazio.</div>';
      return;
    }

    box.innerHTML=cart.map(x=>{
      const price=Number(x.price||0),qty=Number(x.qty||0),line=price*qty;
      return `<div class="checkout-item">${x.image_url?`<img src="${esc(x.image_url)}" alt="">`:'<div></div>'}<div><strong>${esc(x.name||'Produto ERALIS')}</strong><small>${qty} unidade${qty===1?'':'s'} · ${money(price)} cada</small></div><strong class="checkout-item-price">${money(line)}</strong></div>`;
    }).join('');

    const subtotal=cart.reduce((s,x)=>s+Number(x.price||0)*Number(x.qty||0),0);
    $('#subtotal').textContent=money(subtotal);
    $('#total').textContent=money(subtotal+(selectedShipping?.price||0));
  }

  function renderAddresses(){
    const box=$('#addressList');
    if(!addresses.length){
      box.innerHTML='';
      $('#addressEmpty').hidden=false;
      $('#continueBtn').disabled=true;
      return;
    }
    $('#addressEmpty').hidden=true;
    const selected=addresses.find(a=>a.is_default)?.id||addresses[0].id;
    box.innerHTML=addresses.map(a=>`<label class="checkout-address ${String(a.id)===String(selected)?'selected':''}"><input type="radio" name="deliveryAddress" value="${esc(a.id)}" ${String(a.id)===String(selected)?'checked':''}><div><strong>${esc(a.label||'Endereço')}</strong><p>${esc(a.street)}, ${esc(a.number)}${a.complement?', '+esc(a.complement):''}<br>${esc(a.neighborhood)} — ${esc(a.city)}/${esc(a.state)}<br>CEP ${esc(a.zipcode)}</p></div></label>`).join('');
    box.querySelectorAll('input[name="deliveryAddress"]').forEach(input=>input.addEventListener('change',()=>{
      box.querySelectorAll('.checkout-address').forEach(el=>el.classList.remove('selected'));
      input.closest('.checkout-address').classList.add('selected');
      resetShipping();
    }));
    resetShipping();
  }

  function resetShipping(){
    freightCalculated=false;
    shippingQuotes=[];
    selectedShipping=null;
    const box=$('#shippingOptions');
    if(box){box.hidden=true;box.innerHTML='';}
    const shipping=$('#shipping');
    if(shipping){shipping.textContent='A calcular';shipping.classList.add('pending');}
    const total=cart.reduce((s,x)=>s+Number(x.price||0)*Number(x.qty||0),0);
    $('#total').textContent=money(total);
    const btn=$('#continueBtn');
    if(btn){btn.disabled=!$('input[name="deliveryAddress"]:checked');btn.textContent='Calcular frete →';}
    const note=$('#checkoutNote');
    if(note)note.textContent=shippingDataReady?'O frete será simulado com base no CEP, peso e dimensões da embalagem cadastradas no produto.':'Cadastre peso e dimensões da embalagem dos produtos antes de calcular o frete.';
    localStorage.removeItem('eralisShippingQuote');
  }

  function resetAddressForm(){ $('#addressForm').reset();$('#addressLabel').value='Casa';$('#addressDefault').checked=addresses.length===0; }

  async function cepLookup(){
    const cep=$('#addressZipcode').value.replace(/\D/g,'');
    if(cep.length!==8)return;
    try{
      const r=await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d=await r.json();
      if(d.erro)throw new Error('CEP não encontrado.');
      $('#addressStreet').value=d.logradouro||'';
      $('#addressNeighborhood').value=d.bairro||'';
      $('#addressCity').value=d.localidade||'';
      $('#addressState').value=d.uf||'';
      $('#addressNumber').focus();
    }catch(e){status(e.message,'error');}
  }

  async function saveAddress(e){
    e.preventDefault();
    const btn=e.submitter;btn.disabled=true;
    try{
      const payload={
        customer_id:user.id,
        label:$('#addressLabel').value.trim()||'Casa',
        zipcode:$('#addressZipcode').value.replace(/\D/g,''),
        street:$('#addressStreet').value.trim(),
        number:$('#addressNumber').value.trim(),
        complement:$('#addressComplement').value.trim(),
        neighborhood:$('#addressNeighborhood').value.trim(),
        city:$('#addressCity').value.trim(),
        state:$('#addressState').value.trim().toUpperCase(),
        is_default:$('#addressDefault').checked
      };
      if(payload.zipcode.length!==8)throw new Error('Informe um CEP válido.');
      if(!payload.street||!payload.number||!payload.neighborhood||!payload.city||!payload.state)throw new Error('Preencha o endereço completo.');
      if(payload.is_default)await rest(`customer_addresses?customer_id=eq.${encodeURIComponent(user.id)}`,{method:'PATCH',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({is_default:false})});
      await rest('customer_addresses',{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(payload)});
      addresses=await rest(`customer_addresses?customer_id=eq.${encodeURIComponent(user.id)}&select=*&order=is_default.desc,created_at.desc`)||[];
      $('#addressDialog').close();
      renderAddresses();
      status('Endereço salvo.','success');
      setTimeout(()=>status(''),1800);
    }catch(e){status('Não foi possível salvar o endereço. '+e.message,'error');}
    finally{btn.disabled=false;}
  }

  // ---------------------------------------------------------
  // Camada de frete — SIMULAÇÃO
  // ---------------------------------------------------------
  function buildShipment(){
    // Estrutura propositalmente compatível com uma futura integração real.
    // Os dados de peso e embalagem vêm diretamente do cadastro de cada produto.
    let weight=0;
    let volume=0;
    let maxWidth=0,maxHeight=0,maxLength=0;
    cart.forEach(item=>{
      const qty=Math.max(1,Number(item.qty||1));
      const w=Number(item.weight_kg);
      const width=Number(item.package_width_cm);
      const height=Number(item.package_height_cm);
      const length=Number(item.package_length_cm);
      if(!w||!width||!height||!length)throw new Error(`O produto \"${item.name||'sem nome'}\" está sem peso ou dimensões da embalagem cadastrados.`);
      weight+=w*qty;
      volume+=width*height*length*qty;
      maxWidth=Math.max(maxWidth,width);
      maxHeight+=height*qty;
      maxLength=Math.max(maxLength,length);
    });
    return {
      originCep:SHIPPING_CONFIG.originCep.replace(/\D/g,''),
      destinationCep:(()=>{const id=$('input[name="deliveryAddress"]:checked')?.value;const a=addresses.find(x=>String(x.id)===String(id));return String(a?.zipcode||'').replace(/\D/g,'');})(),
      weightKg:weight,
      widthCm:Math.max(10,maxWidth),
      heightCm:Math.max(5,maxHeight),
      lengthCm:Math.max(15,maxLength),
      volumeCm3:volume
    };
  }

  function simulatedDistanceFactor(originCep,destinationCep){
    const o=Number(String(originCep||'0').slice(0,3));
    const d=Number(String(destinationCep||'0').slice(0,3));
    const delta=Math.abs(o-d);
    return Math.min(1.9,1+(delta/900));
  }

  async function simulateCorreiosQuotes(shipment){
    // Valores deliberadamente simulados. Não representam tarifa oficial dos Correios.
    const factor=simulatedDistanceFactor(shipment.originCep,shipment.destinationCep);
    const weight=Math.max(.30,shipment.weightKg);
    const sizeFactor=Math.max(0,((shipment.widthCm*shipment.heightCm*shipment.lengthCm)/4000)-1);
    const base=14+(weight*10)+(sizeFactor*5);
    const pacPrice=Math.max(14.90,Math.round(base*factor*100)/100);
    const sedexPrice=Math.max(24.90,Math.round((base*1.58+5)*factor*100)/100);
    const delta=Math.abs(Number(shipment.originCep.slice(0,3))-Number(shipment.destinationCep.slice(0,3)));
    const pacDays=Math.min(18,4+Math.round(delta/120));
    const sedexDays=Math.min(10,2+Math.round(delta/180));
    return [
      {id:'pac',carrier:'Correios',service:'PAC',price:pacPrice,deliveryDays:pacDays,simulated:true},
      {id:'sedex',carrier:'Correios',service:'SEDEX',price:sedexPrice,deliveryDays:sedexDays,simulated:true}
    ];
  }

  // Ponto de troca futuro: aqui entrará a chamada ao backend/Edge Function.
  const shippingProvider={
    mode:'simulation',
    async quote(shipment){
      return simulateCorreiosQuotes(shipment);
    }
  };

  function renderShippingOptions(){
    const box=$('#shippingOptions');
    if(!box)return;
    box.innerHTML=`<div class="shipping-options-title"><div><span class="section-kicker">ENTREGA</span><h3>Escolha o frete</h3></div><small>Simulação Correios</small></div>`+
      shippingQuotes.map(q=>`<label class="shipping-option ${selectedShipping?.id===q.id?'selected':''}"><input type="radio" name="shippingMethod" value="${q.id}" ${selectedShipping?.id===q.id?'checked':''}><span class="shipping-option-main"><strong>${q.service}</strong><small>Entrega estimada: ${q.deliveryDays} dias úteis</small></span><strong>${money(q.price)}</strong></label>`).join('')+
      `<p class="shipping-simulation-note">Valores e prazos acima são apenas para teste do checkout e não correspondem a uma cotação oficial.</p>`;
    box.hidden=false;
    box.querySelectorAll('input[name="shippingMethod"]').forEach(input=>input.addEventListener('change',()=>{
      selectedShipping=shippingQuotes.find(q=>q.id===input.value)||null;
      applySelectedShipping();
    }));
  }

  function applySelectedShipping(){
    const shipping=$('#shipping');
    const subtotal=cart.reduce((s,x)=>s+Number(x.price||0)*Number(x.qty||0),0);
    if(selectedShipping){
      shipping.textContent=money(selectedShipping.price);
      shipping.classList.remove('pending');
      $('#total').textContent=money(subtotal+selectedShipping.price);
      localStorage.setItem('eralisShippingQuote',JSON.stringify(selectedShipping));
      $('#continueBtn').textContent='Continuar para pagamento →';
      $('#checkoutNote').textContent='Frete simulado selecionado. Na próxima etapa entraremos no pagamento.';
    }else{
      shipping.textContent='A calcular';
      shipping.classList.add('pending');
      $('#total').textContent=money(subtotal);
      $('#continueBtn').textContent='Calcular frete →';
    }
  }

  async function calculateShipping(){
    const selected=$('input[name="deliveryAddress"]:checked');
    if(!selected){status('Selecione um endereço de entrega.','error');return;}
    if(!shippingDataReady){status('Cadastre peso e as três dimensões da embalagem em todos os produtos do carrinho antes de calcular o frete.','error');return;}
    if(freightCalculated && selectedShipping){
      status('Selecione outra opção ou continue para o pagamento.','success');
      return;
    }

    const btn=$('#continueBtn');
    btn.disabled=true;
    btn.textContent='Calculando frete...';
    try{
      const shipment=buildShipment();
      if(shipment.destinationCep.length!==8)throw new Error('O CEP do endereço selecionado é inválido.');
      shippingQuotes=await shippingProvider.quote(shipment);
      freightCalculated=true;
      selectedShipping=shippingQuotes[0]||null;
      renderShippingOptions();
      applySelectedShipping();
      status('Frete simulado com sucesso. Escolha uma opção de entrega para continuar.','success');
    }catch(e){
      status('Não foi possível calcular o frete. '+(e.message||'Tente novamente.'),'error');
      btn.textContent='Calcular frete →';
    }finally{
      btn.disabled=!selectedShipping;
    }
  }

  async function continueToPayment(){
    if(!selectedShipping){await calculateShipping();return;}
    const selected=$('input[name="deliveryAddress"]:checked');
    if(!selected){status('Selecione um endereço de entrega.','error');return;}

    const btn=$('#continueBtn');
    btn.disabled=true;
    btn.textContent='Preparando pagamento...';
    status('Criando seu pedido com segurança...','success');
    try{
      const saved=authRaw?JSON.parse(authRaw):null;
      if(!saved?.access_token)throw new Error('Sua sessão expirou. Entre novamente na sua conta.');
      const address=addresses.find(a=>String(a.id)===String(selected.value));
      if(!address)throw new Error('Endereço de entrega não encontrado.');
      const payload={
        address_id:address.id,
        shipping:{
          id:selectedShipping.id,
          carrier:selectedShipping.carrier,
          service:selectedShipping.service,
          price:Number(selectedShipping.price||0),
          delivery_days:Number(selectedShipping.deliveryDays||0),
          simulated:true
        },
        cart:cart.map(x=>({id:x.id,qty:Number(x.qty||1)}))
      };
      const r=await fetch(`${SUPABASE_URL}/functions/v1/${MP_FUNCTION}`,{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${saved.access_token}`,apikey:SUPABASE_KEY},
        body:JSON.stringify(payload)
      });
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data?.error||data?.message||'Não foi possível iniciar o pagamento.');
      if(!data.checkout_url)throw new Error('O Mercado Pago não retornou a URL de pagamento.');
      localStorage.setItem('eralisPendingOrder',JSON.stringify({order_id:data.order_id,mp_order_id:data.mp_order_id,total:data.total}));
      window.location.href=data.checkout_url;
    }catch(e){
      console.error(e);
      status('Não foi possível iniciar o pagamento. '+(e.message||'Tente novamente.'),'error');
      btn.disabled=false;
      btn.textContent='Continuar para pagamento →';
    }
  }

  document.addEventListener('DOMContentLoaded',async()=>{
    try{
      if(!(await loadUser()))return;
      renderCustomer();
      renderCart();
      renderAddresses();
      resetShipping();
      $('#newAddressBtn').onclick=()=>{resetAddressForm();$('#addressDialog').showModal();};
      $('#addressClose').onclick=()=>$('#addressDialog').close();
      $('#addressCancel').onclick=()=>$('#addressDialog').close();
      $('#addressForm').addEventListener('submit',saveAddress);
      $('#addressZipcode').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,8).replace(/(\d{5})(\d)/,'$1-$2');});
      $('#addressZipcode').addEventListener('blur',cepLookup);
      $('#continueBtn').onclick=continueToPayment;
      $('#shippingOptions')?.addEventListener('change',()=>{});
    }catch(e){
      console.error(e);
      status('Não foi possível carregar o checkout. '+(e.message||'Tente novamente.'));
    }
  });
})();
