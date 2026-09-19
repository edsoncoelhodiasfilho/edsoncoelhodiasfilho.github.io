(async function(){
  const url=window.ERALIS_SUPABASE_URL;
  const key=window.ERALIS_SUPABASE_KEY;
  if(!url||!key||url.includes('COLE_AQUI')||key.includes('COLE_AQUI')){
    console.warn('ERALIS: Supabase não configurado.');
    return;
  }
  try{
    const headers={apikey:key,Authorization:`Bearer ${key}`};
    const response=await fetch(`${url}/rest/v1/products?select=id,name,description,measurements,price,active,sort_order,category_id,category:product_categories(id,name,active),image_url,image_path,image_url_2,image_path_2,video_url,video_path&active=eq.true&order=sort_order.asc,created_at.asc`,{headers});
    if(!response.ok)throw new Error(`Produtos: HTTP ${response.status} ${await response.text()}`);
    const products=await response.json();
    window.ERALIS_CONTENT={products:products||[]};
    window.dispatchEvent(new CustomEvent('eralis-content-loaded',{detail:window.ERALIS_CONTENT}));
  }catch(error){console.error('ERALIS — erro ao carregar produtos do Supabase:',error);}
})();
