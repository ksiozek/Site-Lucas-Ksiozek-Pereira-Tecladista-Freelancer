# Lucas Ksiozek Pereira — landing page

Site estático de uma página. Sem build, sem dependências para instalar.

```
index.html   estrutura e conteúdo
style.css    estilos (tokens de cor, tipografia, 3D em CSS, responsivo)
script.js    navbar, carrossel, formulário e a cena 3D do Casio CT-X5000
```

O Three.js vem por CDN, já referenciado no final do `index.html`.

## Rodar no seu computador

Abrir o `index.html` no navegador já funciona. Se quiser um servidor local:

```bash
npx serve .
```

## Antes de publicar

1. Em `script.js`, troque a constante `TELEFONE` pelo seu número real
   (formato `55` + DDD + número, sem espaços ou traços).
2. Troque os depoimentos da seção Feedbacks por frases reais.
3. Nos cards do portfólio, o atributo `data-video` de cada `<figure class="slide">`
   aponta para o link que abre ao clicar.

## Publicar no GitHub

```bash
git init
git add .
git commit -m "Landing page"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

## Publicar na Vercel

Importe o repositório em vercel.com/new. Framework Preset: **Other**.
Build Command e Install Command ficam vazios, Output Directory também.

Alternativa sem Git:

```bash
npm i -g vercel
vercel
```
