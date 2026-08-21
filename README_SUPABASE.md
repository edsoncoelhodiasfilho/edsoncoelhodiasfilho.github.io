# ERALIS + Supabase

## 1. Criar as tabelas e Storage

Abra o **SQL Editor** do seu projeto Supabase e execute o arquivo:

`supabase_schema.sql`

Ele cria:
- `products`
- `idea_images`
- RLS das tabelas
- bucket público `eralis-images`
- políticas de leitura pública e escrita autenticada
- índices e `updated_at`

## 2. Criar o usuário administrador

No Supabase:
Authentication → Users → Add user

Crie o e-mail e senha que serão usados no `admin.html`.

## 3. Configurar o site

Abra `supabase-config.js` e substitua:

```js
window.ERALIS_SUPABASE_URL = "COLE_AQUI_A_URL_DO_SEU_PROJETO";
window.ERALIS_SUPABASE_KEY = "COLE_AQUI_A_PUBLISHABLE_KEY";
```

Use a **Publishable key** (`sb_publishable_...`) para o frontend.
NUNCA coloque `sb_secret_...` ou `service_role` no GitHub.

## 4. Testar

Na pasta do site:

```bash
python -m http.server 8000
```

Abra:

`http://localhost:8000/admin.html`

Faça login com o usuário criado no Supabase.

## 5. Imagens

O administrador envia as imagens para o bucket `eralis-images`.
Os caminhos ficam registrados nas tabelas e as URLs públicas são usadas pelo site.

A versão usa upload padrão para imagens de até 6 MB, conforme recomendação do Supabase para uploads pequenos.

## 6. GitHub Pages

Depois de testar:
- suba os arquivos para o repositório;
- ative GitHub Pages;
- configure o domínio, se houver;
- mantenha apenas a Publishable key no frontend.

## Próxima etapa

Depois que esta versão estiver funcionando, podemos:
1. melhorar a autenticação;
2. restringir RLS para somente o seu usuário administrador;
3. fazer o carrossel público consumir as imagens reais do Storage;
4. substituir definitivamente os produtos de exemplo pelos registros do banco.


## Configuração já preenchida

A versão deste ZIP já contém a Project URL e a Publishable Key fornecidas para o projeto ERALIS.
A Secret/service_role key não foi utilizada.


## Mídia por produto

O cadastro de produto agora suporta:
- até 2 imagens;
- 1 vídeo;
- imagens em `products/` no bucket `eralis-images`;
- vídeos também em `products/`.

Para um projeto Supabase já existente, execute `supabase_migration_multimedia.sql` uma vez no SQL Editor.
A versão completa do `supabase_schema.sql` também contém as novas colunas.
O limite do painel é 6 MB por imagem e 30 MB por vídeo.


## Carrossel no modal do produto

Ao clicar em comprar/abrir um produto, o modal agora apresenta as mídias cadastradas em carrossel:
- Imagem 1
- Imagem 2
- Vídeo

As setas navegam entre as mídias e os pontos permitem selecionar diretamente.
Também é possível usar as setas esquerda/direita do teclado.
O vídeo possui controles nativos.


### Correção do carrossel do modal
O modal do produto agora usa os campos `image_url`, `image_url_2` e `video_url`
diretamente no catálogo público. As setas laterais são renderizadas quando
existem 2 ou 3 mídias, e as miniaturas permitem seleção direta.

\n### Correção definitiva da galeria
A sincronização pública agora preserva `image_url_2`, `image_path_2`, `video_url` e `video_path`. A API pública também solicita explicitamente essas colunas. Os scripts receberam versionamento para evitar cache do navegador.

\n### Correção — Criamos ideias
As imagens cadastradas em `idea_images` agora substituem as imagens estáticas do carrossel da seção "Criamos ideias". O carrossel é reconstruído após a resposta do Supabase e continua com intervalo de 3 segundos.

\n### Ajuste — Criamos ideias sem corte
As imagens do carrossel agora preservam a proporção original (`object-fit: contain`) e a altura do slide não é mais fixada. O comportamento também foi ajustado para janelas desktop redimensionadas e para telas responsivas.

\n### Correção — Criamos ideias após ajuste responsivo
O carrossel agora usa CSS Grid para que a altura seja determinada pelo conteúdo da imagem. As imagens vindas do Supabase são reconstruídas no mesmo elemento do carrossel após o carregamento, evitando o problema de imagens não visíveis causado por slides absolutos com altura automática.

\n### Ajuste — cards de produtos
Todos os cards passaram a ter altura uniforme. A descrição da vitrine é limitada a 3 linhas com reticências; ao abrir o produto pelo botão Comprar, a descrição completa é exibida no modal.

\n### Modal de e-mail
Os links E-mail da página principal agora abrem um modal no mesmo padrão do modal de Solicitar orçamento. O visitante informa nome e assunto e o formulário é enviado pelo FormSubmit para eralis3d@gmail.com.

\n### Ajuste visual — modal de e-mail
O modal de e-mail foi centralizado e recebeu largura menor, formulário central, campos uniformes e botões alinhados. O modal de orçamento não foi alterado.

\n### Página de obrigado para e-mail
Foi criada uma página separada `obrigado-email.html`, usada somente após o envio do formulário de E-mail. A página exibe:
“Obrigado pelo e-mail. Daremos um retorno o mais rápido possível.”
e um botão para voltar ao site.

\n### Correção — redirecionamento do formulário de e-mail
O formulário agora declara explicitamente `method="POST"` e define `_next` como URL absoluta no momento do envio. Isso evita a tela intermediária “Form should POST” do FormSubmit e direciona para `obrigado-email.html`.

\n### Correção — logo da página de agradecimento
A referência da página `obrigado-email.html` foi corrigida de `assets/logo.png` para o mesmo arquivo de logo utilizado pelo site principal: `assets/eralis-logo.png`.

\n### Correção FormSubmit — POST
Os formulários de orçamento e e-mail foram reforçados com `method="POST"` explícito, `_captcha=false`, honeypot e redirecionamento `_next` absoluto calculado no momento do envio. O orçamento retorna para `obrigado.html` e o e-mail para `obrigado-email.html`.

\n### Correção definitiva — Solicitar orçamento / FormSubmit
O problema estava no campo `_next`: o formulário de orçamento tinha `method="POST"`, mas o JavaScript não estava preenchendo o `_next`, deixando-o vazio. O FormSubmit exige uma URL absoluta para `_next`. Agora `quoteNext` é preenchido no evento de submit com a URL absoluta de `obrigado.html`. O formulário continua usando `multipart/form-data` para permitir o upload da imagem.
