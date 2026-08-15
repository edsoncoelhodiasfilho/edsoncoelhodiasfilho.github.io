# ERALIS — carrinho condicionado ao cadastro

Esta versão foi construída diretamente a partir do site enviado pelo usuário.

Regra implementada:
- visitante sem cadastro: não consegue adicionar produtos ao carrinho;
- ao tentar adicionar, recebe orientação para fazer o cadastro e é levado à seção "Minha conta";
- usuário cadastrado: pode adicionar normalmente;
- carrinho não é persistido no localStorage enquanto não houver cadastro;
- qualquer carrinho anônimo existente é removido ao carregar a página.

O restante dos arquivos e alterações manuais existentes no site foram preservados.
