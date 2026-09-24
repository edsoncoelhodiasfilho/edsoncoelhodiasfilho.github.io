# ERALIS — Mercado Pago Checkout Pro

Esta versão integra o checkout atual do ERALIS ao **Checkout Pro via Orders API** do Mercado Pago. O frete continua sendo o **Correios simulado** já existente.

## 1. Banco de dados

No Supabase > SQL Editor, execute:

`supabase/migrations/20260923_mercado_pago.sql`

A migration adiciona os campos de rastreio do Mercado Pago, snapshot do pedido e endereço.

## 2. Segredos da Edge Function

No Supabase > Edge Functions > Secrets, cadastre:

- `MP_ACCESS_TOKEN` = Access Token do Mercado Pago (primeiro use a credencial de teste).
- `MP_WEBHOOK_SECRET` = chave secreta gerada em Mercado Pago > Sua integração > Webhooks.
- `ERALIS_SITE_URL` = `https://www.eralis.com.br`
- `ERALIS_ORIGIN_CEP` = CEP real de origem usado no cálculo simulado, por exemplo `49000-000`.

O Access Token e o Webhook Secret **não devem ser colocados em nenhum arquivo JavaScript público**.

## 3. Publicar as Edge Functions

Na pasta do projeto:

```bash
supabase functions deploy mercado-pago-create-order
supabase functions deploy mercado-pago-webhook --no-verify-jwt
```

Se o projeto ainda não estiver vinculado:

```bash
supabase login
supabase link --project-ref esawihsoczszybyzdkkt
```

## 4. Webhook do Mercado Pago

Configure no Mercado Pago a URL HTTPS:

`https://esawihsoczszybyzdkkt.supabase.co/functions/v1/mercado-pago-webhook`

Selecione o evento **Orders (Mercado Pago)**.

Depois use a ferramenta de **Simular notificação** do Mercado Pago para validar o recebimento.

## 5. Fluxo implementado

1. Cliente calcula PAC/SEDEX simulado.
2. Cliente escolhe o frete.
3. Checkout envia somente IDs do carrinho, endereço e frete para a Edge Function.
4. Backend valida usuário, endereço, produtos, preços e frete.
5. Backend cria o pedido no Supabase.
6. Backend cria a Order no Mercado Pago com `X-Idempotency-Key`.
7. Cliente é redirecionado para `checkout_url`.
8. Mercado Pago retorna para `pagamento.html`.
9. Webhook consulta a Order no Mercado Pago e atualiza o pedido no Supabase.
10. Área do cliente passa a mostrar o status atualizado.

## 6. Teste

Use primeiro as credenciais de teste e uma conta de teste compradora do Mercado Pago. O Mercado Pago orienta criar vendedor e comprador de teste para validar o fluxo antes de produção.

## 7. Produção

Antes de produção, trocar o Access Token de teste pelo de produção, manter HTTPS e validar criação de order, retorno, webhook, cancelamento e reembolso.
