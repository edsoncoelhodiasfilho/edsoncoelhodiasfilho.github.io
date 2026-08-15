const products = [
  {id:1,name:"Torres de Eralis",price:89.90,tag:"ESTRATÉGIA",tagColor:"#ffc928",visual:"♜",glow:"rgba(226,155,64,.35)",desc:"Construa, proteja e domine o tabuleiro."},
  {id:2,name:"Caminhos da Lua",price:69.90,tag:"FAMÍLIA",tagColor:"#2d9cff",visual:"♟",glow:"rgba(53,165,255,.35)",desc:"Explore, colete e vença desafios."},
  {id:3,name:"Dragão Escarlate",price:49.90,tag:"AVENTURA",tagColor:"#ff594e",visual:"🐉",glow:"rgba(255,57,57,.35)",desc:"Miniatura premium impressa em 3D."},
  {id:4,name:"Kit Aventureiro",price:59.90,tag:"COLECIONÁVEL",tagColor:"#a85cff",visual:"◆",glow:"rgba(160,75,255,.35)",desc:"Dados, tokens e marcadores."}
];

let cart=JSON.parse(localStorage.getItem("eralisCart")||"[]");

const money=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

function renderProducts(){
  document.getElementById("productGrid").innerHTML=products.map(p=>`
    <article class="product-card">
      <div class="product-image" style="--product-glow:${p.glow}">
        <span class="product-tag" style="--tag:${p.tagColor}">${p.tag}</span>
        <div class="product-visual">${p.visual}</div>
      </div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="product-bottom">
          <span class="price">${money(p.price)}</span>
          <button class="add-product" onclick="addToCart(${p.id})" aria-label="Adicionar ${p.name}">🛒</button>
        </div>
      </div>
    </article>`).join("");
}

function addToCart(id){
  const item=cart.find(x=>x.id===id);
  if(item)item.qty++;
  else cart.push({id,qty:1});
  saveCart();openCart();
}
function changeQty(id,delta){
  const item=cart.find(x=>x.id===id);
  if(!item)return;
  item.qty+=delta;
  if(item.qty<=0)cart=cart.filter(x=>x.id!==id);
  saveCart();
}
function saveCart(){localStorage.setItem("eralisCart",JSON.stringify(cart));renderCart()}
function renderCart(){
  document.getElementById("cartCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
  const box=document.getElementById("cartItems");
  if(!cart.length)box.innerHTML='<p class="cart-note">Seu carrinho está vazio.</p>';
  else box.innerHTML=cart.map(x=>{
    const p=products.find(y=>y.id===x.id);
    return `<div class="cart-row"><div><strong>${p.name}</strong><small>${money(p.price)} cada</small></div><div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><b>${x.qty}</b><button onclick="changeQty(${p.id},1)">+</button></div></div>`;
  }).join("");
  const total=cart.reduce((s,x)=>s+products.find(p=>p.id===x.id).price*x.qty,0);
  document.getElementById("cartTotal").textContent=money(total);
}
function openCart(){document.getElementById("cartOverlay").hidden=false}
function closeCart(){document.getElementById("cartOverlay").hidden=true}

function checkout(){
  if(!cart.length){alert("Adicione um produto ao carrinho.");return}
  const phone="5579999999999"; // ALTERE PARA O WHATSAPP DA ERALIS
  const lines=cart.map(x=>{
    const p=products.find(y=>y.id===x.id);
    return `• ${p.name} — ${x.qty} un. — ${money(p.price*x.qty)}`;
  }).join("\n");
  const total=cart.reduce((s,x)=>s+products.find(p=>p.id===x.id).price*x.qty,0);
  const msg=`Olá! Quero fazer um pedido na ERALIS.\n\n${lines}\n\nTotal estimado: ${money(total)}\n\nGostaria de confirmar disponibilidade, frete e pagamento.`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,"_blank");
}

document.getElementById("openCart").onclick=openCart;
document.getElementById("closeCart").onclick=closeCart;
document.getElementById("checkoutButton").onclick=checkout;
document.getElementById("cartOverlay").addEventListener("click",e=>{if(e.target.id==="cartOverlay")closeCart()});

const whatsapp="5579999999999"; // ALTERE PARA O WHATSAPP DA ERALIS
document.getElementById("whatsappLink").href=`https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá! Quero conhecer os produtos da ERALIS.")}`;
document.getElementById("year").textContent=new Date().getFullYear();

renderProducts();
renderCart();

/* Animação contínua dos objetos ao redor da lua.
   Cada objeto percorre uma órbita elíptica diferente.
   O efeito é feito apenas com CSS/JS e não exige bibliotecas externas. */
const orbitObjects=[...document.querySelectorAll(".orbit-object")];
const start=performance.now();

const paths=[
  {rx:285,ry:112,phase:0,speed:.00038},
  {rx:310,ry:150,phase:1.3,speed:-.00031},
  {rx:308,ry:150,phase:3.3,speed:-.00031},
  {rx:308,ry:150,phase:4.8,speed:-.00031},
  {rx:235,ry:178,phase:2.1,speed:.00046},
  {rx:235,ry:178,phase:4.1,speed:.00046},
  {rx:280,ry:112,phase:4.9,speed:.00038},
  {rx:235,ry:178,phase:.5,speed:.00046},
  {rx:235,ry:178,phase:5.5,speed:.00046},
  {rx:285,ry:112,phase:2.4,speed:.00038}
];

function animateOrbits(now){
  const stage=document.querySelector(".orbit-stage");
  const cx=stage.clientWidth/2, cy=stage.clientHeight/2;
  const t=now-start;
  orbitObjects.forEach((el,i)=>{
    const p=paths[i];
    const a=p.phase+t*p.speed;
    let x=Math.cos(a)*p.rx;
    let y=Math.sin(a)*p.ry;
    // rotate the entire orbital system for a more natural perspective
    const rot=i%2?0.38:-0.30;
    const xr=x*Math.cos(rot)-y*Math.sin(rot);
    const yr=x*Math.sin(rot)+y*Math.cos(rot);
    const scale=.82 + ((yr+p.ry)/(2*p.ry))*.25;
    el.style.left=`${cx+xr}px`;
    el.style.top=`${cy+yr}px`;
    el.style.transform=`translate(-50%,-50%) scale(${scale}) rotate(${a*20}deg)`;
  });
  requestAnimationFrame(animateOrbits);
}
requestAnimationFrame(animateOrbits);



/* =========================================================
   ERALIS — CADASTRO LOCAL + SESSÃO
   ========================================================= */

const ACCOUNT_KEY = "eralisCustomer";
const SESSION_KEY = "eralisLoggedIn";

const form = document.getElementById("registerForm");
const preview = document.getElementById("accountPreview");
const message = document.getElementById("registerMessage");
const accountGreeting = document.getElementById("accountGreeting");
const accountDetails = document.getElementById("accountDetails");
const accountLabel = document.getElementById("accountLabel");
const accountLink = document.getElementById("accountLink");
const logoutButton = document.getElementById("logoutButton");

const phoneInput = document.getElementById("regPhone");
const cepInput = document.getElementById("regCep");
const addressInput = document.getElementById("regAddress");
const neighborhoodInput = document.getElementById("regNeighborhood");
const cityInput = document.getElementById("regCity");

function getAccount() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_KEY));
  } catch {
    return null;
  }
}

function loggedIn() {
  return localStorage.getItem(SESSION_KEY) === "true" && !!getAccount();
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

/*
 * Telefone brasileiro:
 * 10 dígitos -> (79) 9999-9999
 * 11 dígitos -> (79) 99999-9999
 *
 * A função nunca adiciona números e nunca perde o último dígito.
 */
function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);

  if (number.length <= 4) {
    return `(${ddd}) ${number}`;
  }

  if (digits.length <= 10) {
    return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
  }

  return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
}

function formatCep(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

phoneInput?.addEventListener("input", event => {
  event.target.value = formatPhone(event.target.value);
});

cepInput?.addEventListener("input", event => {
  event.target.value = formatCep(event.target.value);
});

let cepTimer = null;

cepInput?.addEventListener("input", () => {
  clearTimeout(cepTimer);

  const cep = cepInput.value.replace(/\D/g, "");

  if (cep.length !== 8) return;

  cepTimer = setTimeout(() => lookupCep(cep), 150);
});

async function lookupCep(cep) {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

    if (!response.ok) throw new Error("CEP request failed");

    const data = await response.json();

    if (data.erro) {
      addressInput.value = "";
      neighborhoodInput.value = "";
      cityInput.value = "";
      return;
    }

    addressInput.value = data.logradouro || "";
    neighborhoodInput.value = data.bairro || "";
    cityInput.value = data.localidade && data.uf
      ? `${data.localidade} / ${data.uf}`
      : (data.localidade || data.uf || "");

    message.textContent = "";
    message.className = "form-message";
  } catch {
    // Não exibe mensagem ao usuário; permite preenchimento manual.
  }
}

function renderAccount() {
  const account = getAccount();

  if (loggedIn() && account) {
    form.hidden = true;
    preview.hidden = false;

    accountLabel.textContent = account.name.split(" ")[0];
    logoutButton.hidden = false;

    accountGreeting.textContent = `Olá, ${account.name.split(" ")[0]}!`;
    accountDetails.innerHTML =
      `<strong>E-mail:</strong> ${escapeHtml(account.email)}<br>` +
      `<strong>WhatsApp:</strong> ${escapeHtml(account.phone)}<br>` +
      (account.cep ? `<strong>CEP:</strong> ${escapeHtml(account.cep)}<br>` : "") +
      (account.address ? `<strong>Endereço:</strong> ${escapeHtml(account.address)}<br>` : "") +
      (account.neighborhood ? `<strong>Bairro:</strong> ${escapeHtml(account.neighborhood)}<br>` : "") +
      (account.city ? `<strong>Cidade/UF:</strong> ${escapeHtml(account.city)}` : "");

    return;
  }

  form.hidden = false;
  preview.hidden = true;
  accountLabel.textContent = "Meu cadastro";
  logoutButton.hidden = true;
}

form?.addEventListener("submit", event => {
  event.preventDefault();

  const account = {
    name: document.getElementById("regName").value.trim(),
    phone: phoneInput.value.trim(),
    email: document.getElementById("regEmail").value.trim(),
    cep: cepInput.value.trim(),
    city: cityInput.value.trim(),
    address: addressInput.value.trim(),
    neighborhood: neighborhoodInput.value.trim(),
    marketing: document.getElementById("regMarketing").checked,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  localStorage.setItem(SESSION_KEY, "true");

  message.textContent = "";
  renderAccount();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("editAccount")?.addEventListener("click", () => {
  const account = getAccount();
  if (!account) return;

  document.getElementById("regName").value = account.name || "";
  phoneInput.value = formatPhone(account.phone || "");
  document.getElementById("regEmail").value = account.email || "";
  cepInput.value = formatCep(account.cep || "");
  cityInput.value = account.city || "";
  addressInput.value = account.address || "";
  neighborhoodInput.value = account.neighborhood || "";
  document.getElementById("regMarketing").checked = !!account.marketing;

  preview.hidden = true;
  form.hidden = false;
  document.getElementById("regName").focus();
});

document.getElementById("deleteAccount")?.addEventListener("click", () => {
  if (!confirm("Apagar o cadastro deste navegador?")) return;

  localStorage.removeItem(ACCOUNT_KEY);
  localStorage.removeItem(SESSION_KEY);
  form.reset();
  renderAccount();
});

logoutButton?.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  renderAccount();
});

accountLink?.addEventListener("click", event => {
  if (loggedIn()) {
    event.preventDefault();
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  }
});

renderAccount();
