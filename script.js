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
  console.log('clicou em', i, j);
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
    }
  }
  return lista;
}


inicializarTabuleiro();
inicializarTabuleiro();
mostrarTabuleiro();