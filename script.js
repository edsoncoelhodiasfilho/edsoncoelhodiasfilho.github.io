
const products=[
 {id:1,name:"Chaveiro ERALIS",price:24.90,type:"keyring",desc:"Chaveiro exclusivo com identidade ERALIS, produzido em impressão 3D."},
 {id:2,name:"Cacto — Coleção Encanto",price:29.90,type:"cactus",desc:"Peça decorativa inspirada no crochê para trazer personalidade ao ambiente."},
 {id:3,name:"Suporte para Celular",price:19.90,type:"holder",desc:"Suporte compacto e funcional para deixar o celular organizado."},
 {id:4,name:"Mini Figura Decorativa",price:34.90,type:"figure",desc:"Miniatura produzida em 3D para colecionar, decorar ou presentear."},
 {id:5,name:"Coelhinho — Encanto Crochê",price:39.90,type:"bunny",desc:"Peça decorativa delicada, inspirada no charme artesanal do crochê."},
 {id:6,name:"Gatinho — Encanto Crochê",price:39.90,type:"cat",desc:"Miniatura decorativa com visual acolhedor e acabamento inspirado em crochê."},
 {id:7,name:"Darth Vader — Coleção Encanto",price:59.90,type:"figure",desc:"Peça decorativa inspirada no universo de ficção científica."},
 {id:8,name:"Organizador de Mesa",price:32.90,type:"holder",desc:"Organizador compacto para deixar pequenos objetos sempre à mão."},
 {id:9,name:"Porta-Canetas Minimalista",price:27.90,type:"holder",desc:"Design minimalista para organizar canetas e acessórios de escritório."},
 {id:10,name:"Vaso Decorativo Geométrico",price:42.90,type:"cactus",desc:"Vaso de design geométrico para decoração de ambientes."},
 {id:11,name:"Porta-Celular de Mesa",price:24.90,type:"holder",desc:"Base funcional para apoiar o celular com praticidade."},
 {id:12,name:"Chaveiro Personalizado",price:29.90,type:"keyring",desc:"Chaveiro personalizado com nome, logo ou identidade visual."},
 {id:13,name:"Suporte para Fones",price:31.90,type:"holder",desc:"Suporte compacto para manter seus fones organizados."},
 {id:14,name:"Porta-Controle",price:44.90,type:"holder",desc:"Organizador para controles e pequenos acessórios."},
 {id:15,name:"Mini Planeta Decorativo",price:36.90,type:"shape",desc:"Peça decorativa para compor mesas, estantes e nichos."},
 {id:16,name:"Dragão Decorativo",price:49.90,type:"figure",desc:"Miniatura fantástica para colecionadores e decoração."},
 {id:17,name:"Caveira Decorativa",price:34.90,type:"shape",desc:"Peça decorativa com visual marcante e moderno."},
 {id:18,name:"Suporte para Controle",price:39.90,type:"holder",desc:"Suporte para manter controles organizados e acessíveis."},
 {id:19,name:"Vaso Mini Cacto",price:26.90,type:"cactus",desc:"Pequeno vaso decorativo para ambientes compactos."},
 {id:20,name:"Marcador de Página",price:14.90,type:"shape",desc:"Marcador leve e criativo para acompanhar sua leitura."},
 {id:21,name:"Porta-Joias",price:38.90,type:"shape",desc:"Peça compacta para organizar pequenos acessórios."},
 {id:22,name:"Luminária Decorativa",price:69.90,type:"figure",desc:"Peça decorativa com design diferenciado para ambientes."},
 {id:23,name:"Kit Organizadores",price:54.90,type:"holder",desc:"Conjunto de organizadores para mesa e pequenos objetos."},
 {id:24,name:"Trofeu Personalizado",price:79.90,type:"figure",desc:"Trofeu personalizado para eventos, equipes e ocasiões especiais."}
];

// Troque pelos seus links reais do Mercado Pago.
const paymentLinks={};
products.forEach(p=>paymentLinks[p.id]="https://mpago.la/SEU_LINK_"+p.id);

const grid=document.querySelector("#grid");
const modal=document.querySelector("#modal");
const body=document.querySelector("#modalBody");
function money(n){
  const value=Number(n ?? 0).toLocaleString("pt-BR",{
    style:"currency",
    currency:"BRL",
    minimumFractionDigits:2,
    maximumFractionDigits:2
  });
  const match=value.match(/^(.*?)(\d+),(\d{2})$/);
  if(!match) return value;

  return `${match[1]}${match[2]}<span class="price-cents">,${match[3]}</span>`;
}

function image(type, imageUrl){
  if(imageUrl){
    return `<div class="pic real-image"><img src="${imageUrl}" alt="" loading="lazy"></div>`;
  }
  const content=type==="keyring"?"E":"";
  return `<div class="pic"><div class="shape ${type}">${content}</div></div>`;
}

function render(list){
  if(!grid) return;
  grid.innerHTML=list.map(p=>`
    <article class="card">
      ${image(p.type,p.image_url)}
      <div class="info">
        <h3>${p.name}</h3>
        <p>${p.desc || p.description || ""}</p>
        ${p.measurements ? `<p class="product-measurements"><strong>Medidas:</strong> ${p.measurements}</p>` : ""}
        <div class="row">
          <span class="price">${money(p.price)}</span>
          <button class="buy" data-id="${p.id}">Comprar</button>
        </div>
      </div>
    </article>`).join("");
  document.querySelectorAll(".buy").forEach(b=>b.onclick=()=>openProduct(+b.dataset.id));
}

function openProduct(id){
  const p=products.find(x=>x.id===id);
  if(!p || !modal || !body) return;

  const media=[];
  if(p.image_url) media.push({type:"image",url:p.image_url});
  if(p.image_url_2) media.push({type:"image",url:p.image_url_2});
  if(p.video_url) media.push({type:"video",url:p.video_url});
  console.log("ERALIS: mídias do produto", p.name, {
    image1: !!p.image_url,
    image2: !!p.image_url_2,
    video: !!p.video_url,
    total: media.length
  });

  const gallery = media.length ? `
    <div class="product-modal-gallery" data-gallery>
      <div class="product-modal-stage">
        <button type="button" class="product-media-arrow product-media-prev" aria-label="Imagem anterior">‹</button>
        <div class="product-modal-media-current"></div>
        <button type="button" class="product-media-arrow product-media-next" aria-label="Próxima imagem">›</button>
      </div>
      <div class="product-modal-gallery-bottom">
        <div class="product-modal-thumbs"></div>
        <span class="product-modal-counter"></span>
      </div>
    </div>
  ` : image(p.type,p.image_url);

  body.innerHTML=`
    <div class="modal">
      ${gallery}
      <div>
        <label>ERALIS • PRODUTO</label>
        <h2>${p.name}</h2>
        <div class="price">${money(p.price)}</div>
        <p class="modal-description">${p.desc || p.description || ""}</p>
        ${p.measurements ? `<p class="modal-measurements"><strong>Medidas:</strong> ${p.measurements}</p>` : ""}
        <p><b>Produzido sob demanda.</b> Consulte prazo de entrega.</p>
        <a class="btn" href="${p.payment_url || paymentLinks[id] || "#"}" rel="noopener" target="_blank">Comprar via Mercado Pago →</a>
      </div>
    </div>`;

  if(media.length){
    const galleryEl=body.querySelector("[data-gallery]");
    const stage=galleryEl.querySelector(".product-modal-stage");
    const current=galleryEl.querySelector(".product-modal-media-current");
    const prev=galleryEl.querySelector(".product-media-prev");
    const next=galleryEl.querySelector(".product-media-next");
    const thumbs=galleryEl.querySelector(".product-modal-thumbs");
    const counter=galleryEl.querySelector(".product-modal-counter");
    let index=0;

    function renderMedia(){
      const item=media[index];

      if(item.type==="video"){
        current.innerHTML=`<video src="${item.url}" controls playsinline preload="metadata"></video>`;
      }else{
        current.innerHTML=`<img src="${item.url}" alt="${p.name}">`;
      }

      thumbs.innerHTML=media.map((m,i)=>{
        const thumb=m.type==="video"
          ? `<span class="product-thumb-video">▶</span>`
          : `<img src="${m.url}" alt="Miniatura ${i+1}">`;
        return `<button type="button" class="product-modal-thumb ${i===index?"active":""}" data-index="${i}" aria-label="Ver mídia ${i+1}">${thumb}</button>`;
      }).join("");

      counter.textContent=`${index+1} / ${media.length}`;

      // As setas ficam visíveis sempre que houver mais de uma mídia.
      const visible=media.length>1;
      prev.hidden=!visible;
      next.hidden=!visible;

      thumbs.querySelectorAll(".product-modal-thumb").forEach(btn=>{
        btn.addEventListener("click",()=>{
          index=Number(btn.dataset.index);
          renderMedia();
        });
      });
    }

    prev.addEventListener("click",()=>{
      index=(index-1+media.length)%media.length;
      renderMedia();
    });

    next.addEventListener("click",()=>{
      index=(index+1)%media.length;
      renderMedia();
    });

    stage.addEventListener("keydown",event=>{
      if(event.key==="ArrowLeft"){
        event.preventDefault();
        prev.click();
      }
      if(event.key==="ArrowRight"){
        event.preventDefault();
        next.click();
      }
    });

    renderMedia();
  }

  modal.showModal();
}

if(document.querySelector("#close")) document.querySelector("#close").onclick=()=>modal.close();

const allButton=document.querySelector("#all");
if(allButton){
  allButton.onclick=()=>{ window.location.href="produtos.html"; };
}

const menu=document.querySelector("#menu");
if(menu) menu.onclick=()=>document.querySelector("#nav").classList.toggle("open");

// Página inicial: carrossel de produtos em destaque.
const isCarousel=grid && grid.closest(".carousel-viewport");
if(grid){
  render(isCarousel ? products.slice(0,8) : products);
}

if(isCarousel){
  let current=0;
  let timer=null;

  function visibleCount(){
    if(window.innerWidth<=560) return 1;
    if(window.innerWidth<=900) return 2;
    return 4;
  }

  function maxIndex(){
    return Math.max(0, products.slice(0,8).length-visibleCount());
  }

  function updateCarousel(){
    const count=visibleCount();
    const gap=window.innerWidth<=560?12:22;
    const cardWidth=(grid.parentElement.clientWidth-(count-1)*gap)/count;
    grid.style.setProperty("--card-width",`${cardWidth}px`);
    grid.style.transform=`translateX(-${current*(cardWidth+gap)}px)`;
  }

  function next(){
    current = current >= maxIndex() ? 0 : current+1;
    updateCarousel();
  }

  function start(){
    clearInterval(timer);
    timer=setInterval(next,6000);
  }

  window.refreshEralisProductCarousel=function(){
    current=0;
    render(products.slice(0,8));
    updateCarousel();
    start();
  };

  window.addEventListener("resize",()=>{ current=Math.min(current,maxIndex()); updateCarousel(); });
  updateCarousel();
  start();

  const viewport=grid.parentElement;
  const productsControls=document.querySelector("#productsMobileControls");
  const productsPrev=document.querySelector("#productsPrev");
  const productsNext=document.querySelector("#productsNext");

  function goPrevious(){
    current=current<=0 ? maxIndex() : current-1;
    updateCarousel();
    start();
  }

  function goNext(){
    current=current>=maxIndex() ? 0 : current+1;
    updateCarousel();
    start();
  }

  if(productsPrev) productsPrev.addEventListener("click",goPrevious);
  if(productsNext) productsNext.addEventListener("click",goNext);

  viewport.addEventListener("mouseenter",()=>clearInterval(timer));
  viewport.addEventListener("mouseleave",start);
  viewport.addEventListener("touchstart",()=>clearInterval(timer),{passive:true});
  viewport.addEventListener("touchend",start,{passive:true});
}


const FORMINIT_SDK_URL = "https://forminit.com/sdk/v1/forminit.js";
let forminitInstance = null;

function loadForminit() {
  if (window.Forminit) {
    forminitInstance = forminitInstance || new window.Forminit();
    return Promise.resolve(forminitInstance);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-forminit-sdk="true"]');

    if (existing) {
      existing.addEventListener("load", () => {
        if (!window.Forminit) {
          reject(new Error("O SDK do Forminit foi carregado, mas Forminit não está disponível."));
          return;
        }
        forminitInstance = new window.Forminit();
        resolve(forminitInstance);
      }, { once: true });

      existing.addEventListener("error", () => {
        reject(new Error("Não foi possível carregar o SDK do Forminit."));
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = FORMINIT_SDK_URL;
    script.async = true;
    script.dataset.forminitSdk = "true";

    script.onload = () => {
      if (!window.Forminit) {
        reject(new Error("O SDK do Forminit foi carregado, mas Forminit não está disponível."));
        return;
      }
      forminitInstance = new window.Forminit();
      resolve(forminitInstance);
    };

    script.onerror = () => {
      reject(new Error("Não foi possível carregar o SDK do Forminit."));
    };

    document.head.appendChild(script);
  });
}

const FORMINIT_FORM_ID = "r8qgx4ovcp0";

// Modal de solicitação de orçamento
const quoteModal = document.querySelector("#quoteModal");
const quoteBtn = document.querySelector("#quoteBtn");
const quoteClose = document.querySelector("#quoteClose");
const quoteCancel = document.querySelector("#quoteCancel");
const quoteForm = document.querySelector("#quoteForm");

if (quoteBtn && quoteModal) quoteBtn.addEventListener("click", () => quoteModal.showModal());
if (quoteClose) quoteClose.addEventListener("click", () => quoteModal.close());
if (quoteCancel) quoteCancel.addEventListener("click", () => quoteModal.close());

if (quoteModal) {
  quoteModal.addEventListener("click", event => {
    const rect = quoteModal.getBoundingClientRect();
    const inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
    if (!inside) quoteModal.close();
  });
}

if (quoteForm) {
  quoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = quoteForm.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    try {
      const forminit = await loadForminit();
      const formData = new FormData(quoteForm);

      const { error } = await forminit.submit(FORMINIT_FORM_ID, formData);

      if (error) {
        console.error("Erro ao enviar orçamento pelo Forminit:", error);
        throw new Error(error.message || "Erro ao enviar o orçamento.");
      }

      window.location.href = "obrigado.html";
    } catch (error) {
      console.error("Erro ao enviar orçamento:", error);

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Enviar solicitação →";
      }

      alert(
        "Não foi possível enviar o orçamento. " +
        (error?.message ? "\n\n" + error.message : "Tente novamente.")
      );
    }
  });
}

// Modal de e-mail
const emailModal = document.querySelector("#emailModal");
const emailButtons = document.querySelectorAll(".email-modal-btn");
const emailClose = document.querySelector("#emailClose");
const emailCancel = document.querySelector("#emailCancel");
const emailForm = document.querySelector("#emailForm");
const emailSubject = document.querySelector("#emailSubject");
const emailSubjectHidden = document.querySelector("#emailSubjectHidden");

emailButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (emailModal) {
      emailModal.showModal();
      setTimeout(() => {
        const nameInput = document.querySelector("#emailName");
        if (nameInput) nameInput.focus();
      }, 50);
    }
  });
});

if (emailClose && emailModal) {
  emailClose.addEventListener("click", () => emailModal.close());
}

if (emailCancel && emailModal) {
  emailCancel.addEventListener("click", () => emailModal.close());
}

if (emailModal) {
  emailModal.addEventListener("click", event => {
    const rect = emailModal.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!inside) emailModal.close();
  });
}

if (emailForm) {
  emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = emailForm.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    try {
      const forminit = await loadForminit();
      const formData = new FormData(emailForm);

      const { error } = await forminit.submit(FORMINIT_FORM_ID, formData);

      if (error) {
        console.error("Erro ao enviar e-mail pelo Forminit:", error);
        throw new Error(error.message || "Erro ao enviar o e-mail.");
      }

      window.location.href = "obrigado-email.html";
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Enviar e-mail →";
      }

      alert(
        "Não foi possível enviar o e-mail. " +
        (error?.message ? "\n\n" + error.message : "Tente novamente.")
      );
    }
  });
}

// Upload da imagem de referência
const referenceInput=document.querySelector("#quoteReference");
const uploadBox=document.querySelector("#uploadBox");
const fileName=document.querySelector("#fileName");

if(referenceInput){
  referenceInput.addEventListener("change",()=>{
    const file=referenceInput.files[0];
    if(fileName) fileName.textContent=file?file.name:"Nenhum arquivo selecionado";
  });
}
if(uploadBox){
  ["dragenter","dragover"].forEach(eventName=>{
    uploadBox.addEventListener(eventName,event=>{event.preventDefault();uploadBox.classList.add("dragover");});
  });
  ["dragleave","drop"].forEach(eventName=>{
    uploadBox.addEventListener(eventName,event=>{event.preventDefault();uploadBox.classList.remove("dragover");});
  });
  uploadBox.addEventListener("drop",event=>{
    const files=event.dataTransfer.files;
    if(files.length&&referenceInput){
      referenceInput.files=files;
      if(fileName) fileName.textContent=files[0].name;
    }
  });
}


// Carrossel da área "Criamos ideias" — mesma regra do carrossel de produtos: 3 segundos.
const ideaCarousel = document.querySelector("#ideaCarousel");
if (ideaCarousel) {
  const slides = Array.from(ideaCarousel.querySelectorAll(".idea-slide"));
  const dots = Array.from(ideaCarousel.querySelectorAll(".idea-dots span"));
  let ideaCurrent = 0;
  let ideaTimer = null;

  function showIdeaSlide(index) {
    slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  }

  function nextIdeaSlide() {
    ideaCurrent = (ideaCurrent + 1) % slides.length;
    showIdeaSlide(ideaCurrent);
  }

  function startIdeaCarousel() {
    clearInterval(ideaTimer);
    ideaTimer = setInterval(nextIdeaSlide, 4000);
  }

  showIdeaSlide(ideaCurrent);
  startIdeaCarousel();

  ideaCarousel.addEventListener("mouseenter", () => clearInterval(ideaTimer));
  ideaCarousel.addEventListener("mouseleave", startIdeaCarousel);
  ideaCarousel.addEventListener("touchstart", () => clearInterval(ideaTimer), {passive:true});
  ideaCarousel.addEventListener("touchend", startIdeaCarousel, {passive:true});
}


/* =========================================================
   ERALIS — visualização ampliada de "Criamos ideias" no mobile
   Abre somente em telas mobile/tablet pequeno.
   ========================================================= */
(function(){
  let ideaLightbox = null;
  let ideaLightboxImage = null;

  function ensureIdeaLightbox(){
    if (ideaLightbox) return ideaLightbox;

    ideaLightbox = document.createElement("div");
    ideaLightbox.className = "idea-lightbox";
    ideaLightbox.setAttribute("aria-hidden", "true");
    ideaLightbox.innerHTML = `
      <button class="idea-lightbox-close" type="button" aria-label="Fechar imagem ampliada">×</button>
      <div class="idea-lightbox-content" role="dialog" aria-modal="true" aria-label="Imagem ampliada">
        <img class="idea-lightbox-image" alt="Imagem ampliada">
      </div>
    `;
    document.body.appendChild(ideaLightbox);
    ideaLightboxImage = ideaLightbox.querySelector(".idea-lightbox-image");

    function close(){
      if (!ideaLightbox) return;
      ideaLightbox.classList.remove("is-open");
      ideaLightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("idea-lightbox-open");
      if (ideaLightboxImage) {
        ideaLightboxImage.removeAttribute("src");
      }
    }

    ideaLightbox.querySelector(".idea-lightbox-close").addEventListener("click", close);
    ideaLightbox.addEventListener("click", function(event){
      if (event.target === ideaLightbox || event.target.classList.contains("idea-lightbox-content")) close();
    });
    document.addEventListener("keydown", function(event){
      if (event.key === "Escape" && ideaLightbox.classList.contains("is-open")) close();
    });

    ideaLightbox._open = function(src, alt){
      if (!window.matchMedia("(max-width: 760px)").matches) return;
      if (!src) return;
      ideaLightboxImage.src = src;
      ideaLightboxImage.alt = alt || "Imagem ampliada";
      ideaLightbox.classList.add("is-open");
      ideaLightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("idea-lightbox-open");
    };

    return ideaLightbox;
  }

  window.openEralisIdeaLightbox = function(src, alt){
    ensureIdeaLightbox()._open(src, alt);
  };
})();

/* =========================================================
   ERALIS — sincronização pública com o Supabase
   ========================================================= */
window.addEventListener("eralis-content-loaded", function(event){
  const data = event.detail || {};

  // Produtos
  if (Array.isArray(data.products)) {
    products.length = 0;

    data.products.forEach(function(p){
      products.push({
        id: p.id,
        name: p.name,
        price: Number(p.price || 0),
        type: p.type || "figure",
        desc: p.description || "",
        description: p.description || "",
        measurements: p.measurements || "",
        image_url: p.image_url || "",
        image_path: p.image_path || "",
        image_url_2: p.image_url_2 || "",
        image_path_2: p.image_path_2 || "",
        video_url: p.video_url || "",
        video_path: p.video_path || "",
        payment_url: p.payment_url || ""
      });
    });

    console.log("ERALIS: produtos recebidos:", products);

    if (grid) {
      render(isCarousel ? products.slice(0, 8) : products);
    }

    if (isCarousel && typeof window.refreshEralisProductCarousel === "function") {
      window.refreshEralisProductCarousel();
    }
  }

  // Criamos ideias — imagens podem ser gerais ou exclusivas para celular.
  if (Array.isArray(data.ideas) && ideaCarousel) {
    const allIdeaItems = data.ideas
      .filter(item => item && item.active !== false && item.image_url)
      .sort((a,b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

    const renderIdeaCarousel = () => {
      const mobile = window.matchMedia("(max-width: 760px)").matches;
      const ideaItems = allIdeaItems.filter(item => {
        const target = item.display_target || (item.mobile_only ? "mobile" : "all");
        return target === "all" || (target === "mobile" && mobile) || (target === "desktop" && !mobile);
      });
      const track = ideaCarousel.querySelector("#ideaCarouselTrack");
      const dotsContainer = ideaCarousel.querySelector("#ideaCarouselDots");

      if (window.eralisIdeaTimer) {
        clearInterval(window.eralisIdeaTimer);
        window.eralisIdeaTimer = null;
      }

      if (track) {
        track.innerHTML = ideaItems.map((item, index) => `
          <div class="idea-slide ${index === 0 ? "active" : ""}">
            <div class="idea-fog idea-fog-left" aria-hidden="true"></div>
            <div class="idea-fog idea-fog-right" aria-hidden="true"></div>
            <div class="idea-fog idea-fog-top" aria-hidden="true"></div>
            <div class="idea-fog idea-fog-bottom" aria-hidden="true"></div>
            <div class="idea-image-wrap">
              <img src="${item.image_url}" alt="${item.title || "Ideia ERALIS"}" loading="${index === 0 ? "eager" : "lazy"}">
            </div>
          </div>
        `).join("");
      }
      if (dotsContainer) {
        dotsContainer.innerHTML = ideaItems.map((_, index) => `<span class="${index === 0 ? "active" : ""}" data-index="${index}"></span>`).join("");
      }

      const slides = Array.from(ideaCarousel.querySelectorAll(".idea-slide"));
      const dots = Array.from(ideaCarousel.querySelectorAll(".idea-dots span"));
      let current = 0;
      const show = index => {
        slides.forEach((slide,i)=>slide.classList.toggle("active",i===index));
        dots.forEach((dot,i)=>dot.classList.toggle("active",i===index));
      };
      const next = () => { if (slides.length) { current=(current+1)%slides.length; show(current); } };
      show(0);
      if (slides.length > 1) window.eralisIdeaTimer=setInterval(next,4000);
      dots.forEach((dot,index)=>dot.onclick=()=>{
        current=index; show(current);
        if(slides.length>1){clearInterval(window.eralisIdeaTimer);window.eralisIdeaTimer=setInterval(next,3000);}
      });
      slides.forEach(slide=>{
         const img=slide.querySelector("img");
         if(img){
           img.addEventListener("click",()=>{
             if(window.matchMedia("(max-width: 760px)").matches){
               window.openEralisIdeaLightbox(img.currentSrc || img.src, img.alt);
             }
           });
         }
       });
      console.log("ERALIS: imagens de Criamos ideias exibidas:", ideaItems);
    };

    renderIdeaCarousel();
    let lastMobile=window.matchMedia("(max-width: 760px)").matches;
    window.addEventListener("resize",()=>{
      const nowMobile=window.matchMedia("(max-width: 760px)").matches;
      if(nowMobile!==lastMobile){lastMobile=nowMobile;renderIdeaCarousel();}
    });
  }
});

/* Recalcula a área de Criamos ideias quando uma imagem termina de carregar.
   Não define altura fixa: deixa o navegador respeitar a proporção original. */
