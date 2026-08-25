(async function(){
  const url = window.ERALIS_SUPABASE_URL;
  const key = window.ERALIS_SUPABASE_KEY;

  if(!url || !key || url.includes("COLE_AQUI") || key.includes("COLE_AQUI")){
    console.warn("ERALIS: Supabase não configurado.");
    return;
  }

  try{
    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`
    };

    const productsResponse = await fetch(
      `${url}/rest/v1/products?select=id,name,description,measurements,price,active,sort_order,payment_url,image_url,image_path,image_url_2,image_path_2,video_url,video_path&active=eq.true&order=sort_order.asc,created_at.asc`,
      {headers}
    );

    if(!productsResponse.ok){
      const text=await productsResponse.text();
      throw new Error(`Produtos: HTTP ${productsResponse.status} ${text}`);
    }

    const ideasResponse = await fetch(
      `${url}/rest/v1/idea_images?select=id,title,image_url,image_path,active,sort_order,mobile_only,display_target,created_at&active=eq.true&order=sort_order.asc,created_at.asc`,
      {headers}
    );

    if(!ideasResponse.ok){
      const text=await ideasResponse.text();
      throw new Error(`Ideias: HTTP ${ideasResponse.status} ${text}`);
    }

    const products = await productsResponse.json();
    const ideas = await ideasResponse.json();

    console.log("ERALIS: produtos recebidos do Supabase:", products);

    window.ERALIS_CONTENT = {
      products: products || [],
      ideas: ideas || []
    };

    window.dispatchEvent(
      new CustomEvent("eralis-content-loaded", {
        detail: window.ERALIS_CONTENT
      })
    );
  }catch(error){
    console.error("ERALIS — erro ao carregar conteúdo do Supabase:", error);
  }
})();
