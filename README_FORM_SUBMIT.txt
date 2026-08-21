CORREÇÃO FORM SUBMIT

Os formulários agora usam URLs absolutas de produção para _next:

https://www.eralis.com.br/obrigado.html
https://www.eralis.com.br/obrigado-email.html

Isso evita que testes locais em http://localhost:8000 sejam usados como
destino de retorno pelo FormSubmit.

Após publicar no GitHub Pages, limpe o cache/recarregue com Ctrl+F5 se
o navegador ainda estiver usando uma versão antiga do script.js.
