Correção do seletor "Onde exibir" no carrossel Criamos ideias.

1. Ao editar uma imagem, o formulário agora grava o ID no dataset.editId. Antes, o ID não era definido, então o submit entendia que era uma nova imagem; como nenhum novo arquivo era selecionado, o código retornava sem salvar.
2. O PATCH usa Prefer: return=representation para confirmar a atualização.
3. public-supabase.js agora inclui display_target na consulta pública, necessário para o modo "somente computador".
4. admin.html e index.html receberam cache-busting para carregar os JS corrigidos.
