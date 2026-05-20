# Enkete

MVP mobile-first para criar enquetes compartilháveis com Angular, TailwindCSS e Supabase.

## Rodar localmente

Instale as dependências:

```bash
npm install
```

Configure as variáveis em um arquivo `.env`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
```

Gere o environment e rode:

```bash
npm run start
```

Abra `http://localhost:5000`.

Os scripts `prestart` e `prebuild` geram `src/environments/environment.ts` automaticamente a partir do `.env`.

## Banco Supabase

Execute o SQL em [supabase/schema.sql](supabase/schema.sql) no SQL Editor do Supabase.

O MVP deixa RLS desabilitado nas tabelas, conforme a tarefa.

## Deploy Vercel

No projeto da Vercel, configure:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

O arquivo [vercel.json](vercel.json) já define o build e o rewrite para as rotas do Angular.
