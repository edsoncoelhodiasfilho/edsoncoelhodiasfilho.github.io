(async function(){
  const url = window.ERALIS_SUPABASE_URL;
  const key = window.ERALIS_SUPABASE_KEY;
  if(!url || !key || url.includes("COLE_AQUI") || key.includes("COLE_AQUI")) return;
  try{
    const headers={apikey:key,Authorization:`Bearer ${key}`};
    const [pr,ir]=await Promise.all([
      fetch(`${url}/rest/v1/products?select=id,name,description,measurements,price,active,sort_order,payment_url,image_url,image_path,image_url_2,image_path_2,video_url,video_path&active=eq.true&order=sort_order.asc,created_at.asc`,{headers}),
      fetch(`${url}/rest/v1/idea_images?select=id,title,image_url,image_path,active,sort_order,mobile_only,display_target,created_at&active=eq.true&order=sort_order.asc,created_at.asc`,{headers})
    ]);
    if(!pr.ok) throw new Error(`Produtos: HTTP ${pr.status}`);
    if(!ir.ok) throw new Error(`Ideias: HTTP ${ir.status}`);
    const products=await pr.json(), ideas=await ir.json();
    window.ERALIS_CONTENT={products:products||[],ideas:ideas||[]};
    window.dispatchEvent(new CustomEvent('eralis-content-loaded',{detail:window.ERALIS_CONTENT}));
  }catch(e){ console.error('ERALIS — erro ao carregar Supabase:',e); }
})();
