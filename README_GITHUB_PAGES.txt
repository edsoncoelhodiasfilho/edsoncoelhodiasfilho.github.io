ERALIS — pacote final para GitHub Pages

Conteúdo:
- index.html: página principal
- produtos.html: catálogo
- admin.html/admin.js/admin.css: administração
- public-supabase.js: integração pública com Supabase
- script.js/style.css: site principal
- obrigado.html: agradecimento de orçamento
- obrigado-email.html: agradecimento de e-mail
- demais arquivos SQL/README: suporte à configuração do Supabase

DEPLOY
1. Copie o conteúdo desta pasta para a raiz do repositório
   edsoncoelhodiasfilho.github.io
2. Preserve o CNAME que já existir no repositório.
3. Faça commit/push para a branch main.
4. No GitHub, em Settings > Pages, use Deploy from a branch:
   Branch: main
   Folder: / (root)

IMPORTANTE
- Não coloque service_role key, secret key ou qualquer segredo do Supabase no repositório.
- A Publishable Key pode permanecer no frontend.
- O admin depende das regras/autenticação configuradas no Supabase.
