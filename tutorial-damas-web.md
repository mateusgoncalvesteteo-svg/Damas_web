# Jogo de Damas na web: tutorial passo a passo

Este tutorial leva o seu jogo de terminal em C++ (`main.cpp`, `funcoes.h`, `funcoes.cpp`) até um site que roda no navegador, em **HTML + CSS + JavaScript puro**, sem bibliotecas e sem servidor. Você vai construir tudo em etapas pequenas, testando a cada uma.

## Como usar (para o código ser realmente seu)

1. **Digite o código, não cole.** Digitar força você a ler cada linha. Se colar, pelo menos leia linha por linha e troque nomes de variáveis para os seus.
2. **Teste ao fim de cada etapa** antes de seguir. Cada etapa tem um "Teste" dizendo o que você deve ver.
3. **Faça um commit por etapa** (`git commit -m "etapa 3: movimento simples"`). Seu histórico do GitHub vai mostrar a sua evolução.
4. **Quando algo quebrar**, abra o console do navegador (F12, aba Console), leia a mensagem de erro e me mande junto com o trecho do código. Depurar junto é a melhor forma de aprender.
5. **Atualize o "Disclosure de Inteligência Artificial" do README** para incluir esta versão web e o que foi feito com ajuda de IA. Você já fez isso bem na versão em C++, e vale manter o padrão.

Comparação de referência: uma versão pronta e compacta está em https://claude.ai/artifact/MA16nznK5gK34YEXRkbynH. Use só para comparar o comportamento; os nomes das funções aqui são diferentes e mais próximos do seu C++.

---

## Ideia central: o que muda do C++ para a web

No terminal, o programa **pergunta** e **espera**: `cin >> x1 >> y1`, valida com `moverPeca()` e, se for inválido, pergunta de novo. No navegador não existe `cin`. O programa **reage a eventos**: um clique em uma casa chama uma função, que atualiza o estado do jogo e redesenha a tela.

Por isso a lógica muda de jeito, mas não de ideia:

| No C++ | Na web (JavaScript) |
|---|---|
| `struct Jogo` (tabuleiro, historico, rodada) | objeto `jogo` com os mesmos campos |
| `char tabuleiro[8][8]` | array de arrays `jogo.tabuleiro[i][j]`, com os mesmos caracteres (`B`, `P`, `D`, `Q`, `.`, ` `) |
| `inicializarTabuleiro()` | `inicializarTabuleiro()` (praticamente igual) |
| `mostrarTabuleiro()` com `cout` | `mostrarTabuleiro()` cria `<div>` na página |
| digitar linha/coluna e chamar `moverPeca()` | clicar na peça e escolher um destino da lista de `movimentosDaPeca()` |
| `existeCaptura()` / `jogadorTemCaptura()` | `movimentosDaPeca()` já marca quais jogadas são capturas; `jogadorTemCaptura()` só pergunta "alguma?" |
| `contarPecas()`, `jogadorTemMovimentos()` | iguais |
| `verificarFimDeJogo()` | `passarTurno()` decide se a partida acabou |
| `ranking.txt` e `historico_*.txt` | `localStorage` do navegador |
| `buscaRecursiva()`, Bubble Sort | iguais, em JS |
| `try/catch` em arquivos | `try/catch` em `localStorage` |

A grande mudança de estratégia: em vez de **validar** um movimento digitado (`moverPeca` devolve `true/false`), agora **calculamos as jogadas possíveis** de uma peça e o jogador clica em uma delas. O clique já é sempre válido, então não precisa de "movimento inválido".

---

## Etapa 0: preparar a pasta

Crie uma pasta nova (sugestão: um repositório novo chamado `damas-web`, por causa do GitHub Pages na etapa final) com três arquivos vazios:

```
damas-web/
├── index.html
├── style.css
└── script.js
```
Para abrir, basta dar dois cliques no `index.html`. Se usar o VS Code, a extensão **Live Server** recarrega a página sozinha a cada salvamento.

---

## Etapa 1: o tabuleiro como matriz

Objetivo: criar na memória o mesmo tabuleiro do C++.

**index.html** (versão mínima por enquanto):

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Jogo de Damas</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Damas</h1>
  <div id="tabuleiro"></div>
  <script src="script.js"></script>
</body>
</html>
```

**script.js**:

```js
// Estado do jogo (equivale à struct Jogo do C++)
let jogo = null;

function inicializarTabuleiro() {
  const tabuleiro = [];
  for (let i = 0; i < 8; i++) {
    const linha = [];
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 === 1) {
        if (i < 3) linha.push('P');       // pretas no topo
        else if (i > 4) linha.push('B');  // brancas embaixo
        else linha.push('.');             // casa vazia jogável
      } else {
        linha.push(' ');                  // casa inválida
      }
    }
    tabuleiro.push(linha);
  }

  jogo = {
    tabuleiro: tabuleiro,
    historico: [],          // lista de jogadas (como vector<Jogada>)
    jogadorAtual: 'B',      // as brancas começam
    selecionada: null,      // [linha, coluna] da peça clicada
    destinos: [],           // jogadas possíveis da peça selecionada
    emCadeia: false,        // true durante capturas múltiplas
    fim: null,              // {vencedor, motivo} quando a partida acaba
    nomes: { B: 'Brancas', P: 'Pretas' }
  };
}

inicializarTabuleiro();
console.table(jogo.tabuleiro);
```

**Teste:** abra a página, aperte F12 e olhe o Console. Deve aparecer uma tabela 8x8 igual ao tabuleiro do seu README. Digite `jogo.tabuleiro[5][0]` no c  onsole: deve responder `"B"`.

**Para estudar:** compare com o seu `inicializarTabuleiro()`. A regra `(i + j) % 2 === 1` é a mesma. Repare que `===` em JS é o "igual" sem conversão de tipo; prefira sempre ele ao `==`.

---

## Etapa 2: desenhar o tabuleiro

Objetivo: transformar a matriz em 64 quadradinhos na tela (a versão web do `mostrarTabuleiro()`).

Acrescente ao **script.js** (antes das duas últimas linhas de teste):

```js
function mostrarTabuleiro() {
  const el = document.getElementById('tabuleiro');
  el.innerHTML = '';

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const casa = document.createElement('div');
      casa.className = 'casa ' + ((i + j) % 2 === 1 ? 'escura' : 'clara');

      const peca = jogo.tabuleiro[i][j];
      if (peca !== '.' && peca !== ' ') {
        const p = document.createElement('span');
        p.className = 'peca ' + (peca === 'B' || peca === 'D' ? 'branca' : 'preta');
        if (peca === 'D' || peca === 'Q') p.textContent = '♛'; // dama
        casa.appendChild(p);
      }

      casa.addEventListener('click', () => aoClicar(i, j));
      el.appendChild(casa);
    }
  }
}

// Provisório: só mostra qual casa foi clicada
function aoClicar(i, j) {
  console.log('clicou em', i, j);
}
```

E troque as duas últimas linhas de teste por:

```js
inicializarTabuleiro();
mostrarTabuleiro();
```

**style.css**:

```css
:root {
  --escura: #2c5b69;
  --clara: #d3dfdc;
  --destaque: #e59f2f;
  --captura: #d2513c;
}

body {
  font-family: system-ui, sans-serif;
  max-width: 60rem;
  margin: 0 auto;
  padding: 1rem;
}

#tabuleiro {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  width: min(92vw, 480px);
  border: 4px solid var(--escura);
}

.casa {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  position: relative;
}
.escura { background: var(--escura); cursor: pointer; }
.clara  { background: var(--clara); }

.peca {
  width: 78%;
  aspect-ratio: 1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.3rem;
}
.branca { background: #f5f0e4; box-shadow: inset 0 0 0 3px #b9b19c; color: #8a6a1c; }
.preta  { background: #232a30; box-shadow: inset 0 0 0 3px #0c1013; color: var(--destaque); }

.selecionada { outline: 3px solid var(--destaque); outline-offset: -3px; }
.destino::after,
.destino-captura::after {
  content: "";
  position: absolute;
  width: 28%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--destaque);
}
.destino-captura::after { background: var(--captura); }
```

**Teste:** o tabuleiro aparece com 12 peças pretas em cima e 12 brancas embaixo. Clicar em uma casa escreve a posição no console.

**Para estudar:** `document.createElement` cria um elemento, `appendChild` o coloca na página. O laço duplo é o mesmo do seu `mostrarTabuleiro()` em C++, só que em vez de `cout << "[" ... "]"` você cria `<div>`. O `() => aoClicar(i, j)` é uma **função anônima** guardando os valores de `i` e `j` daquela casa.

---
//27092026 DOMINGO 
## Etapa 3: calcular movimentos (só passos simples)

Objetivo: dada uma peça, listar para onde ela pode andar. Ainda sem captura e sem dama.

```js
function dentro(x, y) {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function ehDoJogador(peca, jogador) {
  if (jogador === 'B') return peca === 'B' || peca === 'D';
  return peca === 'P' || peca === 'Q';
}

function ehInimiga(peca, jogador) {
  return peca !== '.' && peca !== ' ' && !ehDoJogador(peca, jogador);
}

function outroJogador(jogador) {
  return jogador === 'B' ? 'P' : 'B';
}

// Devolve uma lista de jogadas: { x, y, captura }
// captura = null (passo simples) ou [linha, coluna] da peça capturada
function movimentosDaPeca(x, y) {
  const peca = jogo.tabuleiro[x][y];
  const jogador = ehDoJogador(peca, 'B') ? 'B' : 'P';

  // Brancas sobem (linha diminui). Pretas descem (linha aumenta).
  const direcoes = jogador === 'B' ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]];
  const lista = [];

  for (const [dx, dy] of direcoes) {
    const i = x + dx;
    const j = y + dy;
    if (!dentro(i, j)) continue;

    const q = jogo.tabuleiro[i][j];
    if (q === '.') {
      lista.push({ x: i, y: j, captura: null });
    }
  }
  return lista;
}
```

**Teste:** no console, digite `movimentosDaPeca(5, 0)`. Deve devolver uma jogada: `{x: 4, y: 1, captura: null}`. Teste também `movimentosDaPeca(5, 2)`: devem vir duas.

**Para estudar:** `direcoes` é o mesmo truque da sua `existeCaptura()`, que também usa uma matriz de direções. `for (const [dx, dy] of direcoes)` é a forma moderna de percorrer a lista já separando os dois números.
//28092026 de manha
---

## Etapa 4: clicar, selecionar e mover

Objetivo: primeira jogada de verdade. Clicar numa peça mostra os destinos; clicar num destino move a peça.

Substitua o `aoClicar` provisório por este e acrescente `executarMovimento`:

```js
function aoClicar(i, j) {
  if (!jogo || jogo.fim) return;

  const alvo = jogo.destinos.find(d => d.x === i && d.y === j);

  if (jogo.selecionada && alvo) {
    executarMovimento(alvo);
  } else if (ehDoJogador(jogo.tabuleiro[i][j], jogo.jogadorAtual) && !jogo.emCadeia) {
    jogo.selecionada = [i, j];
    jogo.destinos = movimentosDaPeca(i, j);
  } else if (!jogo.emCadeia) {
    jogo.selecionada = null;
    jogo.destinos = [];
  }
  mostrarTabuleiro();
}

// Versão simples: move e passa a vez (vamos melhorar nas próximas etapas)
function executarMovimento(alvo) {
  const [x1, y1] = jogo.selecionada;
  jogo.tabuleiro[alvo.x][alvo.y] = jogo.tabuleiro[x1][y1];
  jogo.tabuleiro[x1][y1] = '.';
  jogo.selecionada = null;
  jogo.destinos = [];
  jogo.jogadorAtual = outroJogador(jogo.jogadorAtual);
}
```

Agora faça o `mostrarTabuleiro()` destacar a seleção e os destinos. Dentro do laço, logo depois de criar `casa.className = ...`, acrescente:

```js
      if (jogo.selecionada && jogo.selecionada[0] === i && jogo.selecionada[1] === j) {
        casa.classList.add('selecionada');
      }
      const destino = jogo.destinos.find(d => d.x === i && d.y === j);
      if (destino) {
        casa.classList.add(destino.captura ? 'destino-captura' : 'destino');
      }
```

**Teste:** clique numa peça branca da linha 5: aparecem bolinhas nos destinos. Clique numa bolinha: a peça anda e a vez passa às pretas. Ainda dá para "pular" sem captura, e nada acontece ao chegar no fim do tabuleiro. É esperado.

**Para estudar:** `.find()` devolve o primeiro item da lista que satisfaz a condição, ou `undefined`. Isso substitui o laço com `if` que você usaria em C++. O jogo agora tem um **estado** (`selecionada`, `destinos`), e cada clique só altera esse estado e chama `mostrarTabuleiro()` para redesenhar. Esse padrão (mudar estado, redesenhar) é a base de qualquer interface.

---

## Etapa 5: captura, promoção e histórico

Objetivo: comer peças, virar dama e registrar jogadas.

**5a. Captura de peça comum.** Em `movimentosDaPeca`, logo depois do `if (q === '.') { ... }`, acrescente um `else if`:

```js
    if (q === '.') {
      lista.push({ x: i, y: j, captura: null });
    } else if (ehInimiga(q, jogador) && dentro(i + dx, j + dy) && jogo.tabuleiro[i + dx][j + dy] === '.') {
      // inimigo na diagonal e casa vazia logo depois: dá para pular
      lista.push({ x: i + dx, y: j + dy, captura: [i, j] });
    }
```

Isso corresponde ao teste "inimigo no meio + espaço vazio depois" da sua `existeCaptura()`. Note que peças comuns só capturam **para frente**, como nas suas regras, porque `direcoes` só tem as duas direções da frente.

**5b. Executar com captura, promoção e histórico.** Substitua `executarMovimento` por:

```js
function executarMovimento(alvo) {
  const [x1, y1] = jogo.selecionada;
  const peca = jogo.tabuleiro[x1][y1];

  jogo.tabuleiro[x1][y1] = '.';
  if (alvo.captura) {
    jogo.tabuleiro[alvo.captura[0]][alvo.captura[1]] = '.';
  }

  // promoção a dama
  let nova = peca;
  if (peca === 'B' && alvo.x === 0) nova = 'D';
  if (peca === 'P' && alvo.x === 7) nova = 'Q';
  jogo.tabuleiro[alvo.x][alvo.y] = nova;

  registrarJogada(x1, y1, alvo.x, alvo.y, alvo.captura !== null);

  jogo.selecionada = null;
  jogo.destinos = [];
  passarTurno();
}

function registrarJogada(x1, y1, x2, y2, captura) {
  jogo.historico.push({
    rodada: jogo.historico.length + 1,
    jogador: jogo.jogadorAtual,
    x1, y1, x2, y2,
    captura: captura
  });
}

function passarTurno() {
  jogo.jogadorAtual = outroJogador(jogo.jogadorAtual);
}
```

**Teste:** monte uma captura jogando (brancas e pretas se enfrentando no centro). A peça capturada some. Depois de cada jogada, digite `jogo.historico` no console e veja a lista crescer.

**Para estudar:** `registrarJogada` é a sua `registrarJogada()` do C++, com o mesmo formato de `struct Jogada`. A forma `x1, y1, x2, y2` dentro das chaves é um atalho para `x1: x1, y1: y1, ...`.

---

## Etapa 6: a dama

Objetivo: a dama anda várias casas na diagonal e pode capturar de longe (como no seu `moverDama`, que percorre a diagonal casa por casa).

Substitua `movimentosDaPeca` inteira pela versão final abaixo (ela inclui tudo das etapas 3 e 5):

```js
function movimentosDaPeca(x, y) {
  const peca = jogo.tabuleiro[x][y];
  const jogador = ehDoJogador(peca, 'B') ? 'B' : 'P';
  const ehDama = peca === 'D' || peca === 'Q';

  const direcoes = ehDama
    ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
    : (jogador === 'B' ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]]);

  const lista = [];

  for (const [dx, dy] of direcoes) {
    let i = x + dx;
    let j = y + dy;

    if (ehDama) {
      // anda pela diagonal casa por casa
      let capturada = null;
      while (dentro(i, j)) {
        const q = jogo.tabuleiro[i][j];
        if (q === '.') {
          lista.push({ x: i, y: j, captura: capturada });
        } else if (ehDoJogador(q, jogador) || capturada) {
          break; // bateu numa aliada, ou tentou pular duas peças
        } else {
          capturada = [i, j]; // primeira inimiga encontrada
        }
        i += dx;
        j += dy;
      }
    } else if (dentro(i, j)) {
      const q = jogo.tabuleiro[i][j];
      if (q === '.') {
        lista.push({ x: i, y: j, captura: null });
      } else if (ehInimiga(q, jogador) && dentro(i + dx, j + dy) && jogo.tabuleiro[i + dx][j + dy] === '.') {
        lista.push({ x: i + dx, y: j + dy, captura: [i, j] });
      }
    }
  }
  return lista;
}
```

**Teste:** no console, force uma dama para testar: `jogo.tabuleiro[4][3] = 'D'; mostrarTabuleiro();`. Selecione-a e veja as diagonais. Depois reinicie a página.

**Para estudar:** a variável `capturada` é o "encontrouInimigo + captX/captY" do seu `moverDama`. O `break` sai do laço quando encontra aliada ou uma segunda inimiga, exatamente os dois `return false` do C++. Tente desenhar no papel uma dama em (4,3) com um inimigo em (2,5) e trace o laço.

---

## Etapa 7: captura obrigatória e captura múltipla

Objetivo: duas regras do seu jogo. Se existe captura, o jogador é obrigado a capturar; e uma peça que captura continua capturando enquanto puder.

**7a. Captura obrigatória.** Acrescente:

```js
function jogadorTemCaptura(jogador) {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (ehDoJogador(jogo.tabuleiro[x][y], jogador)) {
        if (movimentosDaPeca(x, y).some(m => m.captura)) return true;
      }
    }
  }
  return false;
}

// Só as jogadas que a regra permite agora
function movimentosPermitidos(x, y) {
  const lista = movimentosDaPeca(x, y);
  if (jogo.emCadeia || jogadorTemCaptura(jogo.jogadorAtual)) {
    return lista.filter(m => m.captura);
  }
  return lista;
}
```

No `aoClicar`, troque `movimentosDaPeca(i, j)` por `movimentosPermitidos(i, j)`.

**7b. Captura múltipla.** Em `executarMovimento`, logo depois de `registrarJogada(...)` e **antes** de `jogo.selecionada = null;`, acrescente:

```js
  // continua capturando com a mesma peça, se puder
  if (alvo.captura) {
    const proximas = movimentosDaPeca(alvo.x, alvo.y).filter(m => m.captura);
    if (proximas.length > 0) {
      jogo.emCadeia = true;
      jogo.selecionada = [alvo.x, alvo.y];
      jogo.destinos = proximas;
      return; // ainda é a vez do mesmo jogador
    }
  }
  jogo.emCadeia = false;
```

**Teste:** posicione um cenário pelo console e confira. Exemplo: `jogo.tabuleiro[3][2]='P'; jogo.tabuleiro[3][4]='P'; mostrarTabuleiro();` e jogue com as brancas até capturar; enquanto houver captura disponível, você não consegue clicar em outra peça.

**Para estudar:** `.some()` responde "existe algum item que...?" e substitui o laço com `return true` do seu `jogadorTemCaptura()` sobre a lista de jogadas. `.filter()` devolve uma nova lista só com os itens que passam no teste. Repare que agora a "captura obrigatória" é uma **filtragem da lista de jogadas**, muito mais simples que o `if (capturaObrigatoria && !existeCaptura(...) && distancia != 2)` do C++.

---

## Etapa 8: fim de jogo, placar e desistência

Objetivo: detectar o vencedor, mostrar de quem é a vez e permitir desistir.

**8a. HTML.** No `index.html`, troque `<div id="tabuleiro"></div>` por:

```html
  <div class="jogo">
    <div id="tabuleiro"></div>
    <aside class="painel">
      <p id="vez"></p>
      <p id="placar"></p>
      <p id="aviso"></p>
      <button id="btn-desistir">Desistir</button>
      <button id="btn-nova" hidden>Nova partida</button>
      <ol id="historico-partida" reversed></ol>
    </aside>
  </div>
```

E no `style.css`:

```css
.jogo { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start; }
.painel { min-width: 14rem; flex: 1; }
#vez { font-size: 1.4rem; font-weight: 800; margin: 0 0 .5rem; }
#aviso { color: var(--captura); font-weight: 600; min-height: 1.5rem; }
button { padding: .5rem 1rem; font: inherit; cursor: pointer; }
#historico-partida { max-height: 11rem; overflow-y: auto; font-family: monospace; font-size: .85rem; }
```

**8b. JavaScript.**

```js
function contarPecas(jogador) {
  let quantidade = 0;
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (ehDoJogador(jogo.tabuleiro[x][y], jogador)) quantidade++;
    }
  }
  return quantidade;
}

function jogadorTemMovimentos(jogador) {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (ehDoJogador(jogo.tabuleiro[x][y], jogador) && movimentosDaPeca(x, y).length > 0) {
        return true;
      }
    }
  }
  return false;
}

// Substitui a passarTurno simples da etapa 5
function passarTurno() {
  const proximo = outroJogador(jogo.jogadorAtual);
  if (contarPecas(proximo) === 0) {
    terminarPartida(jogo.jogadorAtual, 'capturou todas as peças');
    return;
  }
  if (!jogadorTemMovimentos(proximo)) {
    terminarPartida(jogo.jogadorAtual, 'adversário sem movimentos');
    return;
  }
  jogo.jogadorAtual = proximo;
}

function terminarPartida(vencedor, motivo) {
  jogo.fim = { vencedor: vencedor, motivo: motivo };
  // na etapa 9 vamos salvar ranking e histórico aqui
}

function desistir() {
  if (!jogo || jogo.fim) return;
  terminarPartida(outroJogador(jogo.jogadorAtual), 'desistência');
  mostrarTudo();
}

function atualizarPainel() {
  const vez = document.getElementById('vez');
  const aviso = document.getElementById('aviso');

  if (jogo.fim) {
    vez.textContent = 'Fim de jogo';
    aviso.textContent = jogo.nomes[jogo.fim.vencedor] + ' venceu: ' + jogo.fim.motivo + '.';
  } else {
    vez.textContent = 'Vez de ' + jogo.nomes[jogo.jogadorAtual] +
      (jogo.jogadorAtual === 'B' ? ' (brancas)' : ' (pretas)');
    if (jogo.emCadeia) aviso.textContent = 'Continue capturando com a mesma peça.';
    else if (jogadorTemCaptura(jogo.jogadorAtual)) aviso.textContent = 'Captura obrigatória.';
    else aviso.textContent = '';
  }

  document.getElementById('placar').textContent =
    'Brancas: ' + contarPecas('B') + ' | Pretas: ' + contarPecas('P');
  document.getElementById('btn-desistir').hidden = jogo.fim !== null;
  document.getElementById('btn-nova').hidden = jogo.fim === null;

  const lista = document.getElementById('historico-partida');
  lista.innerHTML = '';
  for (const m of [...jogo.historico].reverse()) {
    const li = document.createElement('li');
    li.textContent = m.jogador + ' (' + m.x1 + ',' + m.y1 + ') → (' + m.x2 + ',' + m.y2 + ')' +
      (m.captura ? ' [CAPTURA]' : '');
    lista.appendChild(li);
  }
}

function mostrarTudo() {
  mostrarTabuleiro();
  atualizarPainel();
}

document.getElementById('btn-desistir').addEventListener('click', desistir);
```

Agora ajuste dois pontos: no fim do `aoClicar`, troque `mostrarTabuleiro();` por `mostrarTudo();`; e nas linhas finais do arquivo, troque `mostrarTabuleiro();` por `mostrarTudo();`.

**Teste:** jogue até sobrar só peças de um lado (ou clique em Desistir): aparece "Fim de jogo" e o vencedor. O histórico aparece do lado, com a jogada mais recente no topo.

**Para estudar:** compare `passarTurno()` com o seu `verificarFimDeJogo()`. No C++ a checagem de "travado" usava o jogador que acabou de jogar; aqui checamos o **próximo** jogador, que é quem precisa ter movimentos. Também usamos `textContent` (e não `innerHTML`) para escrever nomes na tela: assim, se alguém digitar `<b>` como nick, não vira HTML. É uma boa prática de segurança para levar para outros projetos.

---

## Etapa 9: ranking e histórico com localStorage

Objetivo: substituir `ranking.txt` e `historico_*.txt`. O `localStorage` guarda texto no navegador, por site.

```js
function carregarPerfis() {
  try {
    return JSON.parse(localStorage.getItem('damas:ranking')) || [];
  } catch (e) {
    console.error('Erro ao carregar ranking', e);
    return [];
  }
} 

function salvarPerfis(perfis) {
  try {
    localStorage.setItem('damas:ranking', JSON.stringify(perfis));
  } catch (e) {
    console.error('Erro ao salvar ranking', e);
  }
}

// Busca recursiva (mesma ideia do C++)
function buscaRecursiva(perfis, nome, indice = 0) {
  if (indice >= perfis.length) return -1;
  if (perfis[indice].nome === nome) return indice;
  return buscaRecursiva(perfis, nome, indice + 1);
}

function atualizarPerfil(nome) {
  const perfis = carregarPerfis();
  const i = buscaRecursiva(perfis, nome);
  if (i !== -1) perfis[i].vitorias++;
  else perfis.push({ nome: nome, vitorias: 1 });
  salvarPerfis(perfis);
}

// Bubble Sort, decrescente por vitórias
function ordenaRankingPorVitorias(perfis) {
  for (let i = 0; i < perfis.length - 1; i++) {
    for (let j = 0; j < perfis.length - i - 1; j++) {
      if (perfis[j].vitorias < perfis[j + 1].vitorias) {
        [perfis[j], perfis[j + 1]] = [perfis[j + 1], perfis[j]];
      }
    }
  }
  return perfis;
}

function salvarHistoricoPartida(nome) {
  try {
    const registro = { data: new Date().toLocaleDateString('pt-BR'), jogadas: jogo.historico };
    localStorage.setItem('damas:historico:' + nome, JSON.stringify(registro));
  } catch (e) {
    console.error('Erro ao salvar histórico', e);
  }
}

function carregarHistorico(nome) {
  try {
    return JSON.parse(localStorage.getItem('damas:historico:' + nome));
  } catch (e) {
    return null;
  }
}
```

Depois, dentro de `terminarPartida`, substitua o comentário por:

```js
  const nome = jogo.nomes[vencedor];
  atualizarPerfil(nome);
  salvarHistoricoPartida(nome);
```

**Teste:** termine uma partida e, no console, digite `localStorage.getItem('damas:ranking')`. Deve aparecer o texto JSON com o nome e as vitórias do vencedor. (Também dá para ver em F12, aba Application, Local Storage.)

**Para estudar:**
- `JSON.stringify` transforma um objeto/array em texto para guardar; `JSON.parse` faz o caminho inverso. É o papel do `arquivo << nome << " " << vitorias` e do `arquivo >> nome >> vitorias`.
- O `[a, b] = [b, a]` troca dois valores sem variável temporária (o `swap` do C++).
- O `localStorage` é **por navegador**: outro computador terá outro ranking. Para um ranking online compartilhado, você precisaria de um servidor e um banco de dados (uma boa evolução futura).
- Um detalhe do seu C++ para pensar: `carregarEExibirHistorico` ordena o vetor **por vitórias** e depois faz **busca binária por nome**. Busca binária só funciona se a lista estiver ordenada pelo campo buscado. Veja o exercício 3 no final.

---

## Etapa 10: menu, telas e iniciar partida

Objetivo: montar o menu (Jogar, Ranking, Histórico, Regras, Créditos) e a tela de novo jogo, com nicks.

**index.html final** (substitua o seu por este):

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Jogo de Damas</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Damas</h1>
  <p class="sub">Projeto final de Algoritmos e Programação, TADS/UFRN</p>

  <nav id="menu">
    <button data-tela="jogo">Jogar</button>
    <button data-tela="ranking">Ranking</button>
    <button data-tela="historico">Histórico</button>
    <button data-tela="regras">Regras</button>
    <button data-tela="creditos">Créditos</button>
  </nav>

  <section id="tela-jogo" class="tela">
    <div id="config">
      <h2>Nova partida</h2>
      <p>Dois jogadores no mesmo aparelho. As brancas começam.</p>
      <label>Nick das brancas <input id="nick-b" maxlength="16" placeholder="Brancas"></label>
      <label>Nick das pretas <input id="nick-p" maxlength="16" placeholder="Pretas"></label>
      <button id="btn-iniciar">Iniciar partida</button>
    </div>

    <div id="partida" class="jogo" hidden>
      <div id="tabuleiro"></div>
      <aside class="painel">
        <p id="vez"></p>
        <p id="placar"></p>
        <p id="aviso"></p>
        <button id="btn-desistir">Desistir</button>
        <button id="btn-nova" hidden>Nova partida</button>
        <ol id="historico-partida" reversed></ol>
      </aside>
    </div>
  </section>

  <section id="tela-ranking" class="tela" hidden>
    <h2>Ranking de vencedores</h2>
    <p id="ranking-vazio" hidden>Nenhum vencedor registrado ainda.</p>
    <table id="tabela-ranking"></table>
  </section>

  <section id="tela-historico" class="tela" hidden>
    <h2>Histórico de partidas</h2>
    <label>Nick do jogador <input id="nick-busca" maxlength="16"></label>
    <button id="btn-buscar">Buscar</button>
    <p id="historico-aviso"></p>
    <ol id="lista-historico"></ol>
  </section>

  <section id="tela-regras" class="tela" hidden>
    <h2>Regras do jogo</h2>
    <h3>Objetivo</h3>
    <p>Capturar ou bloquear todas as peças do adversário.</p>
    <h3>Movimento</h3>
    <ul>
      <li>Peças andam 1 casa na diagonal para frente.</li>
      <li>Damas andam qualquer distância na diagonal.</li>
      <li>Brancas sobem (linha 7 para 0); pretas descem (linha 0 para 7).</li>
    </ul>
    <h3>Captura</h3>
    <ul>
      <li>Pule sobre uma peça do adversário para capturá-la.</li>
      <li>A captura é obrigatória quando disponível.</li>
      <li>É possível fazer várias capturas no mesmo turno.</li>
      <li>Peças comuns só capturam para frente.</li>
    </ul>
    <h3>Promoção</h3>
    <p>A peça que chega à linha oposta vira dama.</p>
    <h3>Fim de jogo</h3>
    <p>Perde quem ficar sem peças ou sem movimentos. Cada jogador pode desistir a qualquer momento.</p>
  </section>

  <section id="tela-creditos" class="tela" hidden>
    <h2>Créditos</h2>
    <p>Jogo de Damas, projeto final de Algoritmos e Programação.</p>
    <p>Desenvolvido por Mateus Gonçalves Teteo e Pablo Alves.</p>
    <p>Tecnologia em Análise e Desenvolvimento de Sistemas, UFRN.</p>
  </section>

  <script src="script.js"></script>
</body>
</html>
```

**CSS extra** (no fim do `style.css`):

```css
.sub { color: #5b6f79; margin-top: 0; }
#menu { display: flex; flex-wrap: wrap; gap: .25rem; margin: 1rem 0; border-bottom: 1px solid #c5d2d7; }
#menu button { background: none; border: 0; border-bottom: 3px solid transparent; }
#menu button.ativo { border-color: var(--destaque); font-weight: 600; }
label { display: block; margin: .75rem 0; font-weight: 600; }
input { display: block; padding: .5rem; font: inherit; }
table { border-collapse: collapse; }
th, td { padding: .4rem 1rem; text-align: left; border-bottom: 1px solid #c5d2d7; }
[hidden] { display: none !important; }
```

**JavaScript.** Apague as linhas do final do arquivo que faziam `inicializarTabuleiro(); mostrarTudo();` e acrescente:

```js
function mostrarTela(nome) {
  for (const t of document.querySelectorAll('.tela')) {
    t.hidden = t.id !== 'tela-' + nome;
  }
  for (const b of document.querySelectorAll('#menu button')) {
    b.classList.toggle('ativo', b.dataset.tela === nome);
  }
  if (nome === 'ranking') mostrarRanking();
}

function iniciarPartida() {
  inicializarTabuleiro();
  jogo.nomes.B = document.getElementById('nick-b').value.trim() || 'Brancas';
  jogo.nomes.P = document.getElementById('nick-p').value.trim() || 'Pretas';
  document.getElementById('config').hidden = true;
  document.getElementById('partida').hidden = false;
  mostrarTudo();
}

function novaPartida() {
  jogo = null;
  document.getElementById('config').hidden = false;
  document.getElementById('partida').hidden = true;
}

function linhaTabela(celulas, tag) {
  const tr = document.createElement('tr');
  for (const c of celulas) {
    const td = document.createElement(tag || 'td');
    td.textContent = c;
    tr.appendChild(td);
  }
  return tr;
}

function mostrarRanking() {
  const perfis = ordenaRankingPorVitorias(carregarPerfis());
  const tabela = document.getElementById('tabela-ranking');
  tabela.innerHTML = '';
  document.getElementById('ranking-vazio').hidden = perfis.length > 0;
  if (perfis.length === 0) return;

  tabela.appendChild(linhaTabela(['Pos', 'Nick', 'Vitórias'], 'th'));
  perfis.forEach((p, i) => tabela.appendChild(linhaTabela([i + 1, p.nome, p.vitorias])));
}

function mostrarHistorico() {
  const nome = document.getElementById('nick-busca').value.trim();
  const aviso = document.getElementById('historico-aviso');
  const lista = document.getElementById('lista-historico');
  lista.innerHTML = '';

  const registro = carregarHistorico(nome);
  if (!registro) {
    aviso.textContent = 'Não há partida salva para o jogador: ' + nome;
    return;
  }
  aviso.textContent = 'Última partida vencida em ' + registro.data;
  for (const m of registro.jogadas) {
    const li = document.createElement('li');
    li.textContent = m.jogador + ' (' + m.x1 + ',' + m.y1 + ') → (' + m.x2 + ',' + m.y2 + ')' +
      (m.captura ? ' [CAPTURA]' : '');
    lista.appendChild(li);
  }
}

document.getElementById('btn-iniciar').addEventListener('click', iniciarPartida);
document.getElementById('btn-nova').addEventListener('click', novaPartida);
document.getElementById('btn-buscar').addEventListener('click', mostrarHistorico);
document.querySelectorAll('#menu button').forEach(b =>
  b.addEventListener('click', () => mostrarTela(b.dataset.tela))
);

mostrarTela('jogo');
```

Cuidado com a ordem: o `addEventListener` do `btn-desistir` (etapa 8) também precisa estar no arquivo, e todas as funções precisam estar definidas **antes** da chamada `mostrarTela('jogo')` na última linha (ou, no mínimo, o arquivo deve ser lido até o fim antes do primeiro clique, o que sempre acontece).

**Teste:** navegue por todas as abas. Comece uma partida com nicks, jogue até o fim, veja o ranking e busque o histórico do vencedor.

**Para estudar:** aqui você tem o `menu()` e o `switch(opcaoEscolhida)` do `main.cpp`, agora como botões que chamam `mostrarTela`. O atributo `hidden` esconde uma seção sem apagá-la, e `dataset.tela` lê o atributo `data-tela` do botão.

---

## Etapa 11: publicar no GitHub Pages

1. Crie o repositório no GitHub (sugestão: `damas-web`) e envie os três arquivos na raiz:
   ```
   git init
   git add .
   git commit -m "versão web do jogo de damas"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/damas-web.git
   git push -u origin main
   ```
2. No GitHub: **Settings, Pages, Build and deployment**, escolha "Deploy from a branch", branch `main`, pasta `/ (root)`.
3. Em alguns minutos o site fica em `https://SEU-USUARIO.github.io/damas-web/`.
4. Coloque esse link no README do repositório do C++ e na descrição do seu perfil no GitHub.

---

## Como estudar este código

- **Brinque no console.** Com a página aberta, digite `jogo`, `jogo.tabuleiro`, `movimentosDaPeca(5, 2)`, `contarPecas('B')`. Você vê o estado do jogo por dentro.
- **Use `console.log`** dentro das funções para acompanhar o que acontece (por exemplo, dentro de `aoClicar`, mostre `jogo.selecionada` e `jogo.destinos`).
- **Use o depurador.** No F12, aba Sources, clique no número de uma linha para criar um *breakpoint*. A página para ali e você avança linha a linha, como faria em um depurador de C++.
- **Quebre de propósito.** Troque `-1` por `1` em `direcoes` e veja o que acontece. Tirar o `break` do laço da dama? Comentar o `filter` da captura obrigatória? Entender o defeito é entender a função.
- **Explique em voz alta** cada função, como se apresentasse para o professor. Se travar em alguma, é ali que você deve reler.
- **Trace no papel** uma jogada pequena: um tabuleiro com 3 peças e uma captura, anotando os valores de `x`, `y`, `dx`, `dy` a cada passo do laço.

## Exercícios (para deixar o projeto mais seu)

1. **Girar o tabuleiro** a cada turno, como o seu `mostrarTabuleiro(jogo, player)` fazia para as pretas. Dica: percorra `i` de 7 até 0 quando for a vez das pretas.
2. **Desfazer jogada** usando `jogo.historico` (você precisará guardar também qual peça foi capturada e se houve promoção).
3. **Corrigir a busca binária.** Para usá-la de verdade, ordene os perfis **por nome** (não por vitórias) antes de buscar, e use a busca binária em `carregarHistorico`. Escreva `buscaBinaria(perfis, nome)` em JS e compare com a versão do C++.
4. **Melhorar o placar:** mostrar quantas peças cada lado capturou.
5. **Jogador contra máquina.** Comece com uma IA que escolhe uma jogada aleatória dentre `movimentosPermitidos`, depois uma que prefere capturas.
6. **Regra alternativa:** permitir captura para trás de peças comuns (basta usar as quatro direções só para capturas). Isso muda algo nas regras que você escreveu no README?
7. **Modo escuro** com `@media (prefers-color-scheme: dark)` e variáveis de CSS.
8. **Ranking online**, usando um serviço como Firebase ou Supabase para o `localStorage` deixar de ser por navegador. É um bom projeto de continuação.

Quando terminar uma etapa (ou travar em uma), me mande o código e a mensagem do console. Posso revisar, explicar linha por linha ou propor o próximo exercício.
