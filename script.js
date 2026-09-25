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



inicializarTabuleiro();
inicializarTabuleiro();
mostrarTabuleiro();