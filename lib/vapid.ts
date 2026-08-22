// Chave publica VAPID (NAO e secreta - vai para o navegador de qualquer forma).
//
// IMPORTANTE: esta chave publica FORMA PAR com a VAPID_PRIVATE_KEY definida nas
// variaveis de ambiente do servidor. Elas precisam ser matematicamente compativeis,
// caso contrario o servico de push (FCM/Apple) rejeita o envio com o erro
// "403 invalid JWT provided" e nenhuma notificacao e entregue.
//
// A env NEXT_PUBLIC_VAPID_PUBLIC_KEY estava configurada com uma chave que NAO
// correspondia a chave privada, quebrando todas as notificacoes. Por isso usamos
// este valor fixo como fonte unica da verdade (a chave publica pode ser publica).
//
// Se um dia a chave privada for trocada, gere um novo par com
// `npx web-push generate-vapid-keys` e atualize AMBOS: este valor e a VAPID_PRIVATE_KEY.
export const VAPID_PUBLIC_KEY =
  "BFknSg178z66JdSpLl3FnGl-DzpDNhdYsYW6Zzc8Ic5HqKglx2ssp2MrU9evWYpJEZtngcTucPufx-Y_KvT6GHI";
