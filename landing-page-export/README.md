# Landing Page Hyperion Pay

Landing page profissional para sistema de pagamentos.

## Instalacao

```bash
npm install
```

## Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## Build para producao

```bash
npm run build
npm start
```

## Estrutura

```
├── app/
│   ├── page.tsx          # Pagina principal
│   ├── layout.tsx        # Layout
│   └── globals.css       # Estilos globais
├── components/
│   ├── landing/          # Componentes da landing
│   └── ui/               # Componentes UI (botoes, cards)
├── public/
│   ├── images/           # Imagens
│   ├── avatars/          # Avatares depoimentos
│   └── rewards/          # Imagens recompensas
└── lib/
    └── utils.ts          # Utilitarios
```

## Personalizacao

- **Logo**: Substitua `public/logo.png` e `public/mascote.png`
- **Cores**: Edite as variaveis CSS em `app/globals.css`
- **Textos**: Edite os componentes em `components/landing/`

## Tecnologias

- Next.js 15
- React 19
- Tailwind CSS 4
- Framer Motion
- Lucide Icons
