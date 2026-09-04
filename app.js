(function(){
  'use strict';
  const phone='5579998080301';
  const defaultMsg='Olá! Vim do site da Eralis e quero saber mais sobre as peças 3D.';
  let products=[];
  let cart=JSON.parse(localStorage.getItem('eralisCart')||'[]');
  const container=document.getElementById('catalog-rows');
  const overlay=document.getElementById('modal-overlay');
  const image=document.getElementById('modal-image');
  const title=document.getElementById('modal-title');
  const size=document.getElementById('modal-size');
  const desc=document.getElementById('modal-desc');
  const price=document.getElementById('modal-price');
  const buy=document.getElementById('modal-buy');
  const thumbs=document.getElementById('modal-thumbs');
  const prev=document.getElementById('modal-prev');
  const next=document.getElementById('modal-next');
  let current=[], index=0, currentProduct=null;

  const fmt=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const wa=t=>`https://wa.me/${phone}?text=${encodeURIComponent(t)}`;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function setupWhatsApp(){ ['wa-header','wa-hero','wa-cta','wa-float'].forEach(id=>{const el=document.getElementById(id);if(el)el.href=wa(defaultMsg);}); }
  setupWhatsApp();

  // Orçamento personalizado — mesmo fluxo do site ERALIS anterior:
  // formulário em modal + envio pelo Forminit, incluindo imagem de referência.
  const FORMINIT_SDK_URL='https://forminit.com/sdk/v1/forminit.js';
  const FORMINIT_FORM_ID='r8qgx4ovcp0';
  let forminitInstance=null;
  function loadForminit(){
    if(window.Forminit){
      forminitInstance=forminitInstance||new window.Forminit();
      return Promise.resolve(forminitInstance);
    }
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-forminit-sdk="true"]');
      if(existing){
        existing.addEventListener('load',()=>{if(!window.Forminit){reject(new Error('O SDK do Forminit não está disponível.'));return;}forminitInstance=new window.Forminit();resolve(forminitInstance)},{once:true});
        existing.addEventListener('error',()=>reject(new Error('Não foi possível carregar o formulário de orçamento.')),{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=FORMINIT_SDK_URL;script.async=true;script.dataset.forminitSdk='true';
      script.onload=()=>{if(!window.Forminit){reject(new Error('O SDK do Forminit não está disponível.'));return;}forminitInstance=new window.Forminit();resolve(forminitInstance)};
      script.onerror=()=>reject(new Error('Não foi possível carregar o formulário de orçamento.'));
      document.head.appendChild(script);
    });
  }

  const quoteModal=document.getElementById('quoteModal');
  const quoteBtn=document.getElementById('quoteBtn');
  const quoteClose=document.getElementById('quoteClose');
  const quoteCancel=document.getElementById('quoteCancel');
  const quoteForm=document.getElementById('quoteForm');
  const referenceInput=document.getElementById('quoteReference');
  const uploadBox=document.getElementById('uploadBox');
  const fileName=document.getElementById('fileName');

  if(quoteBtn&&quoteModal) quoteBtn.addEventListener('click',()=>quoteModal.showModal());
  if(quoteClose&&quoteModal) quoteClose.addEventListener('click',()=>quoteModal.close());
  if(quoteCancel&&quoteModal) quoteCancel.addEventListener('click',()=>quoteModal.close());
  if(quoteModal) quoteModal.addEventListener('click',e=>{
    const r=quoteModal.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) quoteModal.close();
  });

  if(referenceInput){
    referenceInput.addEventListener('change',()=>{
      const file=referenceInput.files[0];
      if(fileName) fileName.textContent=file?file.name:'Nenhum arquivo selecionado';
    });
  }
  if(uploadBox){
    ['dragenter','dragover'].forEach(name=>uploadBox.addEventListener(name,e=>{e.preventDefault();uploadBox.classList.add('dragover')}));
    ['dragleave','drop'].forEach(name=>uploadBox.addEventListener(name,e=>{e.preventDefault();uploadBox.classList.remove('dragover')}));
    uploadBox.addEventListener('drop',e=>{
      const files=e.dataTransfer.files;
      if(files.length&&referenceInput){
        referenceInput.files=files;
        if(fileName) fileName.textContent=files[0].name;
      }
    });
  }

  if(quoteForm){
    quoteForm.addEventListener('submit',async e=>{
      e.preventDefault();
      const submit=quoteForm.querySelector('button[type="submit"]');
      if(submit){submit.disabled=true;submit.textContent='Enviando...'}
      try{
        const formData=new FormData(quoteForm);
        const description=formData.get('fi-text-description')||'';
        const h=formData.get('fi-number-height')||'';
        const w=formData.get('fi-number-width')||'';
        const l=formData.get('fi-number-length')||'';
        const d=formData.get('fi-number-depth')||'';
        const file=formData.get('fi-file-reference');
        const dims=[];
        if(h)dims.push(`Altura: ${h} cm`); if(w)dims.push(`Largura: ${w} cm`); if(l)dims.push(`Comprimento: ${l} cm`); if(d)dims.push(`Profundidade: ${d} cm`);

        const forminit=await loadForminit();
        const result=await forminit.submit(FORMINIT_FORM_ID,formData);
        if(result.error) throw new Error(result.error.message||'Erro ao enviar o orçamento.');

        let msg='Olá! Acabei de solicitar um orçamento pelo site da ERALIS.';
        if(description) msg+=`\\n\\nDescrição: ${description}`;
        if(dims.length) msg+=`\\n\\nDimensões: ${dims.join(' | ')}`;
        if(file&&file.name) msg+=`\\n\\nEnviei também uma imagem de referência no formulário.`;
        msg+='\\n\\nAguardo o orçamento.';
        quoteModal.close();
        quoteForm.reset();
        if(fileName) fileName.textContent='Nenhum arquivo selecionado';
        window.open(wa(msg),'_blank','noopener');
      }catch(err){
        console.error('Erro ao enviar orçamento:',err);
        alert('Não foi possível enviar o orçamento.\\n\\n'+(err?.message||'Tente novamente.'));
      }finally{
        if(submit){submit.disabled=false;submit.textContent='Enviar solicitação →'}
      }
    });
  }

  function normalize(p){
    return {id:p.id,name:p.name||'Produto ERALIS',price:Number(p.price||0),description:p.description||'',measurements:p.measurements||'',category:p.category?.name||p.category||'Produtos',image_url:p.image_url||'',image_url_2:p.image_url_2||'',video_url:p.video_url||''};
  }
  function images(p){return [p.image_url,p.image_url_2].filter(Boolean).slice(0,3);}

  function addToCart(p,qty=1){
    const found=cart.find(x=>String(x.id)===String(p.id));
    if(found) found.qty+=qty; else cart.push({id:p.id,qty});
    saveCart(); renderCart(); openCart();
  }
  function saveCart(){localStorage.setItem('eralisCart',JSON.stringify(cart));}
  function countCart(){return cart.reduce((s,x)=>s+Number(x.qty||0),0);}
  function totalCart(){return cart.reduce((s,x)=>{const p=products.find(y=>String(y.id)===String(x.id));return s+(p?Number(p.price)*Number(x.qty):0)},0);}

  function buildCard(p){
    const imgs=images(p), card=document.createElement('article'); card.className='card';
    card.innerHTML=`<div class="card-art ${imgs.length?'has-images':''}">${imgs[0]?`<img src="${esc(imgs[0])}" alt="${esc(p.name)}" loading="lazy">`:''}</div><div class="card-body"><h3>${esc(p.name)}</h3><p class="desc">${esc(p.description)}</p>${p.measurements?`<p class="measurements">${esc(p.measurements)}</p>`:''}<div class="card-foot"><div class="price">${fmt(p.price)}</div><button class="btn btn-accent btn-sm add">Adicionar</button></div></div>`;
    card.querySelector('.card-art').addEventListener('click',()=>openProduct(p));
    card.querySelector('.card-body h3').addEventListener('click',()=>openProduct(p));
    card.querySelector('.add').addEventListener('click',()=>addToCart(p));
    return card;
  }
  function renderCatalog(){
    container.innerHTML='';
    if(!products.length){container.innerHTML='<p class="loading-products">Nenhum produto disponível no momento.</p>';return;}
    [...new Set(products.map(p=>p.category||'Produtos'))].forEach(cat=>{
      const items=products.filter(p=>(p.category||'Produtos')===cat),row=document.createElement('div');row.className='cat-row';
      row.innerHTML=`<div class="cat-row-head"><h3>${esc(cat)}<span class="cat-count">${items.length} peças</span></h3><div class="cat-arrows"><button class="arrow-btn" data-dir="-1">‹</button><button class="arrow-btn" data-dir="1">›</button></div></div><div class="carousel-wrap"><div class="carousel-track"></div></div>`;
      const track=row.querySelector('.carousel-track');items.forEach(p=>track.appendChild(buildCard(p)));
      row.querySelectorAll('.arrow-btn').forEach(b=>b.addEventListener('click',()=>track.scrollBy({left:track.clientWidth*.85*Number(b.dataset.dir),behavior:'smooth'})));
      container.appendChild(row);
    });
  }

  function openProduct(p){
    currentProduct=p;current=images(p);index=0;title.textContent=p.name;size.textContent=p.measurements?`Tamanho: ${p.measurements}`:'';desc.textContent=p.description;price.textContent=fmt(p.price);buy.href=wa(`Olá! Quero pedir a peça "${p.name}" (${fmt(p.price)}) do catálogo da Eralis.`);renderProduct();overlay.hidden=false;document.body.style.overflow='hidden';
  }
  function renderProduct(){
    if(current.length){image.src=current[index];image.alt=currentProduct.name;image.hidden=false;} else {image.removeAttribute('src');image.hidden=true;}
    const multi=current.length>1;prev.hidden=!multi;next.hidden=!multi;thumbs.innerHTML='';
    current.forEach((src,i)=>{const b=document.createElement('button');b.className='modal-thumb'+(i===index?' active':'');b.innerHTML=`<img src="${esc(src)}" alt="">`;b.onclick=()=>{index=i;renderProduct()};thumbs.appendChild(b);});
    let add=document.getElementById('modal-add-cart');
    if(!add){add=document.createElement('button');add.id='modal-add-cart';add.className='btn btn-ghost';buy.parentNode.insertBefore(add,buy);}
    add.textContent='Adicionar ao carrinho';add.onclick=()=>addToCart(currentProduct);
  }
  function closeProduct(){overlay.hidden=true;document.body.style.overflow='';}
  document.getElementById('modal-close').onclick=closeProduct;overlay.addEventListener('click',e=>{if(e.target===overlay)closeProduct()});prev.onclick=()=>{index=(index-1+current.length)%current.length;renderProduct()};next.onclick=()=>{index=(index+1)%current.length;renderProduct()};

  function ensureCartUI(){
    if(document.getElementById('cart-float'))return;
    const b=document.createElement('button');b.id='cart-float';b.className='btn btn-accent cart-float';b.innerHTML='Carrinho <span id="cart-count">0</span>';b.onclick=openCart;document.body.appendChild(b);
    const o=document.createElement('div');o.id='cart-overlay';o.hidden=true;o.className='cart-overlay';o.innerHTML='<aside class="cart-panel"><button class="modal-close" id="cart-close">×</button><h2>Seu carrinho</h2><div id="cart-items"></div><div class="cart-total"><span>Total estimado</span><strong id="cart-total-value">R$ 0,00</strong></div><button id="cart-whatsapp" class="btn btn-accent">Finalizar pelo WhatsApp</button></aside>';document.body.appendChild(o);document.getElementById('cart-close').onclick=closeCart;o.addEventListener('click',e=>{if(e.target===o)closeCart()});document.getElementById('cart-whatsapp').onclick=checkout;
  }
  function renderCart(){ensureCartUI();document.getElementById('cart-count').textContent=countCart();const box=document.getElementById('cart-items');box.innerHTML='';
    cart=cart.filter(x=>products.some(p=>String(p.id)===String(x.id)));
    if(!cart.length){box.innerHTML='<p class="cart-empty">Seu carrinho está vazio.</p>';}else cart.forEach(x=>{const p=products.find(y=>String(y.id)===String(x.id));const item=document.createElement('div');item.className='cart-item';item.innerHTML=`<div><strong>${esc(p.name)}</strong><small>${fmt(p.price)} cada</small></div><div class="cart-controls"><button data-act="dec">−</button><b>${x.qty}</b><button data-act="inc">+</button><button data-act="del" aria-label="Remover">×</button></div>`;item.querySelector('[data-act="dec"]').onclick=()=>changeQty(p.id,-1);item.querySelector('[data-act="inc"]').onclick=()=>changeQty(p.id,1);item.querySelector('[data-act="del"]').onclick=()=>removeItem(p.id);box.appendChild(item);});
    document.getElementById('cart-total-value').textContent=fmt(totalCart());saveCart();
  }
  function changeQty(id,d){const x=cart.find(i=>String(i.id)===String(id));if(!x)return;x.qty+=d;if(x.qty<=0)cart=cart.filter(i=>String(i.id)!==String(id));renderCart();}
  function removeItem(id){cart=cart.filter(i=>String(i.id)!==String(id));renderCart();}
  function openCart(){ensureCartUI();renderCart();document.getElementById('cart-overlay').hidden=false;document.body.style.overflow='hidden';}
  function closeCart(){document.getElementById('cart-overlay').hidden=true;document.body.style.overflow='';}
  function checkout(){if(!cart.length){alert('Seu carrinho está vazio.');return;}const lines=cart.map(x=>{const p=products.find(y=>String(y.id)===String(x.id));return `• ${p.name} — ${x.qty} un. — ${fmt(p.price*x.qty)}`}).join('\n');const msg=`Olá! Quero fazer um pedido na ERALIS.\n\n${lines}\n\nMe envie o link para pagamento pelo Mercado Pago.\n\nTotal estimado: ${fmt(totalCart())}`;window.open(wa(msg),'_blank','noopener');}

  window.addEventListener('eralis-content-loaded',e=>{products=(e.detail.products||[]).map(normalize);products.forEach(p=>{p.category=p.category||'Produtos'});renderCatalog();renderCart();});
  ensureCartUI();renderCart();
})();
