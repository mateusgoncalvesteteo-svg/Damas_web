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

      if (
        jogo.selecionada &&
        jogo.selecionada[0] === i &&
        jogo.selecionada[1] === j
      ) {
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

        if (peca === 'D' || peca === 'Q') {
          p.textContent = '♛';
        }

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
  } else if (
    ehDoJogador(jogo.tabuleiro[i][j], jogo.jogadorAtual) &&
    !jogo.emCadeia
  ) {
    jogo.selecionada = [i, j];
    jogo.destinos = movimentosPermitidos(i, j);
  } else if (!jogo.emCadeia) {
    jogo.selecionada = null;
    jogo.destinos = [];
  }

  mostrarTudo();
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
  const ehDama = peca === 'D' || peca === 'Q';

  const direcoes = ehDama
    ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
    : (jogador === 'B' ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]]);

  const lista = [];

  for (const [dx, dy] of direcoes) {
    let i = x + dx;
    let j = y + dy;

    if (ehDama) {
      let capturada = null;

      while (dentro(i, j)) {
        const q = jogo.tabuleiro[i][j];

        if (q === '.') {
          lista.push({ x: i, y: j, captura: capturada });
        } else if (ehDoJogador(q, jogador) || capturada) {
          break;
        } else {
          capturada = [i, j];
        }

        i += dx;
        j += dy;
      }
    } else if (dentro(i, j)) {
      const q = jogo.tabuleiro[i][j];

      if (q === '.') {
        lista.push({ x: i, y: j, captura: null });
      } else if (
        ehInimiga(q, jogador) &&
        dentro(i + dx, j + dy) &&
        jogo.tabuleiro[i + dx][j + dy] === '.'
      ) {
        lista.push({ x: i + dx, y: j + dy, captura: [i, j] });
      }
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

  let nova = peca;

  if (peca === 'B' && alvo.x === 0) nova = 'D';
  if (peca === 'P' && alvo.x === 7) nova = 'Q';

  jogo.tabuleiro[alvo.x][alvo.y] = nova;

  registrarJogada(x1, y1, alvo.x, alvo.y, alvo.captura !== null);

  if (alvo.captura) {
    const proximas = movimentosDaPeca(alvo.x, alvo.y).filter(m => m.captura);

    if (proximas.length > 0) {
      jogo.emCadeia = true;
      jogo.selecionada = [alvo.x, alvo.y];
      jogo.destinos = proximas;
      return;
    }
  }

  jogo.emCadeia = false;
  jogo.selecionada = null;
  jogo.destinos = [];

  passarTurno();
}

function registrarJogada(x1, y1, x2, y2, captura) {
  jogo.historico.push({
    rodada: jogo.historico.length + 1,
    jogador: jogo.jogadorAtual,
    x1,
    y1,
    x2,
    y2,
    captura: captura
  });
}

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

  const nome = jogo.nomes[vencedor];

  atualizarPerfil(nome);
  salvarHistoricoPartida(nome);
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
    aviso.textContent =
      jogo.nomes[jogo.fim.vencedor] + ' venceu: ' + jogo.fim.motivo + '.';
  } else {
    vez.textContent =
      'Vez de ' + jogo.nomes[jogo.jogadorAtual] +
      (jogo.jogadorAtual === 'B' ? ' (brancas)' : ' (pretas)');

    if (jogo.emCadeia) {
      aviso.textContent = 'Continue capturando com a mesma peça.';
    } else if (jogadorTemCaptura(jogo.jogadorAtual)) {
      aviso.textContent = 'Captura obrigatória.';
    } else {
      aviso.textContent = '';
    }
  }

  document.getElementById('placar').textContent =
    'Brancas: ' + contarPecas('B') + ' | Pretas: ' + contarPecas('P');

  document.getElementById('btn-desistir').hidden = jogo.fim !== null;
  document.getElementById('btn-nova').hidden = jogo.fim === null;

  const lista = document.getElementById('historico-partida');
  lista.innerHTML = '';

  for (const m of [...jogo.historico].reverse()) {
    const li = document.createElement('li');

    li.textContent =
      m.jogador + ' (' + m.x1 + ',' + m.y1 + ') → (' +
      m.x2 + ',' + m.y2 + ')' + (m.captura ? ' [CAPTURA]' : '');

    lista.appendChild(li);
  }
}

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

function movimentosPermitidos(x, y) {
  const lista = movimentosDaPeca(x, y);

  if (jogo.emCadeia || jogadorTemCaptura(jogo.jogadorAtual)) {
    return lista.filter(m => m.captura);
  }

  return lista;
}

function contarPecas(jogador) {
  let quantidade = 0;

  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (ehDoJogador(jogo.tabuleiro[x][y], jogador)) {
        quantidade++;
      }
    }
  }

  return quantidade;
}

function jogadorTemMovimentos(jogador) {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (
        ehDoJogador(jogo.tabuleiro[x][y], jogador) &&
        movimentosDaPeca(x, y).length > 0
      ) {
        return true;
      }
    }
  }

  return false;
}

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

function buscaRecursiva(perfis, nome, indice = 0) {
  if (indice >= perfis.length) return -1;
  if (perfis[indice].nome === nome) return indice;

  return buscaRecursiva(perfis, nome, indice + 1);
}

function atualizarPerfil(nome) {
  const perfis = carregarPerfis();
  const i = buscaRecursiva(perfis, nome);

  if (i !== -1) {
    perfis[i].vitorias++;
  } else {
    perfis.push({ nome: nome, vitorias: 1 });
  }

  salvarPerfis(perfis);
}

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
    const registro = {
      data: new Date().toLocaleDateString('pt-BR'),
      jogadas: jogo.historico
    };

    localStorage.setItem(
      'damas:historico:' + nome,
      JSON.stringify(registro)
    );
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

function mostrarTudo() {
  mostrarTabuleiro();
  atualizarPainel();
}

document.getElementById('btn-desistir').addEventListener('click', desistir);

inicializarTabuleiro();
mostrarTudo();