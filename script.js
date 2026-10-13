let jogo = null;

function inicializarTabuleiro() {
  const tabuleiro = [];
  for (let i = 0; i < 8; i++) {
    const linha = [];
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 === 1) {
        if (i < 3) linha.push('P');       
        else if (i > 4) linha.push('B');  
        else linha.push('.');             
      } else {
        linha.push(' ');                  
      }
    }
    tabuleiro.push(linha);
  }

  jogo = {
    tabuleiro: tabuleiro,
    historico: [],          
    jogadorAtual: 'B',      
    selecionada: null,      
    destinos: [],           
    emCadeia: false,        
    fim: null,              
    nomes: { B: 'Brancas', P: 'Pretas' }
  };
}

function mostrarTabuleiro() {
  const el = document.getElementById('tabuleiro');
  el.innerHTML = '';

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const casa = document.createElement('div');
      casa.className = 'casa ' + ((i + j) % 2 === 1 ? 'escura' : 'clara');

      if (jogo.selecionada && jogo.selecionada[0] === i && jogo.selecionada[1] === j) {
        casa.classList.add('selecionada');
      }
      const destino = jogo.destinos.find(d => d.x === i && d.y === j);
      if (destino) {
        casa.classList.add(destino.captura ? 'destino-captura' : 'destino');
      }

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

function movimentosDaPeca(x, y) {
  const peca = jogo.tabuleiro[x][y];
  const jogador = ehDoJogador(peca, 'B') ? 'B' : 'P';

  const direcoes = jogador === 'B' ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]];
  const lista = [];

  for (const [dx, dy] of direcoes) {
    const i = x + dx;
    const j = y + dy;
    if (!dentro(i, j)) continue;

    const q = jogo.tabuleiro[i][j];
    if (q === '.') {
      lista.push({ x: i, y: j, captura: null });
    } else if (q === '.') {
      lista.push({ x: i, y: j, captura: null });
    } else if (ehInimiga(q, jogador) && dentro(i + dx, j + dy) && jogo.tabuleiro[i + dx][j + dy] === '.') {
      // inimigo na diagonal e casa vazia logo depois: dá para pular
      lista.push({ x: i + dx, y: j + dy, captura: [i, j] });
    }
  }
  return lista;
}

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

inicializarTabuleiro();
inicializarTabuleiro();
mostrarTabuleiro();