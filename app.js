/* SKYNETchat · front-end
   Sem back-end por enquanto: as respostas são simuladas em reply().
   Para ligar o modelo, troque reply() e streamText() pela chamada real. */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id, cls = 'i') => `<svg class="${cls}"><use href="#${id}"/></svg>`;
  const uid = () => Math.random().toString(36).slice(2, 10);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  /* ---------------- Marca ---------------- */
  const S_GRID = ['01111', '10000', '01110', '00001', '11110'];
  const S_PATH = [[0, 4], [0, 3], [0, 2], [0, 1], [1, 0], [2, 1], [2, 2], [2, 3], [3, 4], [4, 3], [4, 2], [4, 1], [4, 0]];
  // Presente na mesma matriz 5x5 de pontos do S, para o Indique e Ganhe.
  const GIFT_GRID = ['01010', '11111', '10101', '10101', '11111'];
  function markSVG(unlit, grid = S_GRID, path = S_PATH) {
    let s = '';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const on = grid[r][c] === '1';
      if (!on && !unlit) continue;
      const i = on ? (path ? path.findIndex(([rr, cc]) => rr === r && cc === c) : r * 5 + c) : -1;
      s += `<rect x="${c * 6}" y="${r * 6}" width="5" height="5" rx="2.5" class="${on ? 'on' : 'off'}"${on ? ` style="--i:${i}"` : ''}/>`;
    }
    return `<svg viewBox="0 0 29 29" aria-hidden="true">${s}</svg>`;
  }
  const paintMarks = (root = document) => $$('[data-mark]', root).forEach(el => {
    if (!el.firstChild) el.innerHTML = el.hasAttribute('data-gift') ? markSVG(false, GIFT_GRID, null) : markSVG(el.hasAttribute('data-unlit'));
  });

  /* ---------------- Pixels animados ---------------- */
  // Grade de pixels de 2px desenhada num canvas atrás do conteúdo. shade(x, y, w, h, t, rnd) diz o brilho de cada pixel.
  const PX = 3;
  const pxHash = (c, r) => { const s = Math.sin(c * 127.1 + r * 311.7) * 43758.5453; return s - Math.floor(s); };
  function pixelFx(host, shade, cls = '') {
    const cv = document.createElement('canvas');
    cv.className = 'px-fx' + (cls ? ' ' + cls : '');
    cv.setAttribute('aria-hidden', 'true');
    host.prepend(cv);
    const ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const fx = { cv, on: true, level: 0, t0: performance.now(), last: performance.now(), color: getComputedStyle(cv).color };
    const loop = now => {
      const dt = Math.min(.05, (now - fx.last) / 1000);
      fx.last = now;
      fx.level += ((fx.on ? 1 : 0) - fx.level) * (1 - Math.exp(-dt * (fx.on ? 14 : 7)));
      if (!cv.isConnected || (!fx.on && fx.level < .02)) { cv.remove(); return; }
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = fx.color;
      const t = reduced ? 9 : (now - fx.t0) / 1000;
      for (let r = 0, rows = Math.ceil(h / PX); r < rows; r++) for (let c = 0, cols = Math.ceil(w / PX); c < cols; c++) {
        const a = shade(c * PX, r * PX, w, h, t, pxHash(c, r)) * fx.level;
        if (a > .03) { ctx.globalAlpha = Math.min(1, a); ctx.fillRect(c * PX, r * PX, 2, 2); }
      }
      fx.raf = requestAnimationFrame(loop);
    };
    fx.raf = requestAnimationFrame(loop);
    fx.stop = () => { fx.on = false; };
    return fx;
  }
  const sparkle = (t, rnd) => Math.max(0, Math.sin(t * (1.4 + rnd * 3) + rnd * 40)) ** 10;

  /* ---------------- Dados de exemplo ---------------- */
  const R = {
    legenda: `Aqui vão três opções, da mais direta à mais afetiva:

**1. Direta**
Abrimos! Café coado na hora, pão de queijo saindo do forno e aquela mesa perto da janela esperando por você. A partir de amanhã, às 7h.

**2. Com convite**
Tem cafeteria nova no bairro e o primeiro café é por nossa conta. Passa aqui essa semana, fala que viu no Instagram e escolhe o seu.

**3. Afetiva**
Sonhamos com esse cantinho por dois anos. Agora ele é seu também. Bem-vindo, vizinho.

Quer que eu adapte para Reels, com um gancho nos 3 primeiros segundos?`,

    juros: `Juros compostos são **juros sobre juros**: a cada período, o rendimento entra no saldo e passa a render também.

## Um exemplo em reais

Você aplica **R$ 1.000** a **1% ao mês** e não mexe:

- Mês 1: R$ 1.000 + R$ 10,00 = **R$ 1.010,00**
- Mês 2: R$ 1.010 + R$ 10,10 = **R$ 1.020,10**
- Mês 12: **R$ 1.126,83**
- Mês 60: **R$ 1.816,70**

Nos juros simples, o mês 60 daria R$ 1.600. A diferença de **R$ 216,70** é o efeito composto, e ela cresce mais rápido quanto mais tempo passa.

## A fórmula

\`M = C × (1 + i)^t\`, onde **C** é o capital, **i** a taxa por período e **t** o número de períodos.

> O tempo pesa mais que a taxa. Começar cedo com pouco costuma render mais do que começar tarde com muito.`,

    python: `Este script lê a data EXIF de cada foto e renomeia no formato \`2026-10-20_14-32-05.jpg\`. Fotos sem EXIF usam a data de modificação do arquivo.

\`\`\`python
from pathlib import Path
from datetime import datetime
from PIL import Image

PASTA = Path("~/Fotos").expanduser()
FORMATO = "%Y-%m-%d_%H-%M-%S"

def data_da_foto(caminho):
    try:
        exif = Image.open(caminho)._getexif() or {}
        bruto = exif.get(36867)  # DateTimeOriginal
        if bruto:
            return datetime.strptime(bruto, "%Y:%m:%d %H:%M:%S")
    except Exception:
        pass
    return datetime.fromtimestamp(caminho.stat().st_mtime)

for foto in sorted(PASTA.glob("*.jp*g")):
    base = data_da_foto(foto).strftime(FORMATO)
    destino = foto.with_name(base + foto.suffix.lower())
    n = 1
    while destino.exists():
        destino = foto.with_name(f"{base}_{n}{foto.suffix.lower()}")
        n += 1
    foto.rename(destino)
    print(foto.name, "->", destino.name)
\`\`\`

**Como rodar**

1. Instale a dependência: \`pip install pillow\`
2. Troque \`~/Fotos\` pela sua pasta
3. Rode \`python renomear.py\`

Quer que ele também separe as fotos em pastas por mês?`,

    ingles: `Um plano de 30 dias, com 30 minutos por dia, focado em destravar a fala.

## Semana 1: ouvido
- 15 min de podcast em inglês lento
- 10 min repetindo frases em voz alta, junto com o áudio
- 5 min anotando 5 expressões novas

## Semana 2: frases prontas
- Monte um banco com 40 frases do seu dia a dia
- Grave áudios de 1 minuto contando o que você fez ontem

## Semana 3: conversa
- Duas conversas de 15 min por semana, com alguém ou comigo aqui
- Nos outros dias, revise os erros que apareceram

## Semana 4: autonomia
- Assista a um episódio de série com legenda em inglês
- Faça um resumo falado de 3 minutos e compare com o áudio da semana 1

**Regra de ouro:** falar errado todo dia vale mais do que estudar certo uma vez por semana.

Quer que eu transforme isso numa planilha com check diário?`,

    podcast: `Seis nomes, pensando em fácil de falar e de achar na busca:

1. **Papo de Esquina**
2. **Segunda Xícara**
3. **Fora do Roteiro**
4. **Meia Hora Honesta**
5. **Ponto e Vírgula**
6. **Sinal Aberto**

Antes de escolher, confira se o @ está livre no Instagram e no Spotify.`,
  };

  const SUGGESTIONS = [
    { icon: 'i-pen', label: 'Escrever uma legenda', prompt: 'Escreva uma legenda curta para o post de lançamento de uma cafeteria nova no bairro.', key: 'legenda' },
    { icon: 'i-coins', label: 'Entender juros compostos', prompt: 'Explique juros compostos com um exemplo simples em reais.', key: 'juros' },
    { icon: 'i-code', label: 'Script em Python', prompt: 'Crie um script em Python que renomeia as fotos de uma pasta pela data em que foram tiradas.', key: 'python' },
    { icon: 'i-book', label: 'Plano de estudos', prompt: 'Monte um plano de 30 dias para eu destravar o inglês, com 30 minutos por dia.', key: 'ingles' },
  ];

  // Campos entre colchetes são o que muda a cada uso: viram destaque no card e ficam selecionados no chat.
  const PROMPTS = {
    'Escrita': [
      ['Revisar um texto', 'Revise o texto abaixo: corrija gramática e pontuação, deixe as frases mais claras e mantenha o meu tom. No fim, liste as 3 mudanças mais importantes.\n\nTexto: [cole o texto]'],
      ['E-mail difícil', 'Escreva um e-mail educado e firme para [pessoa ou empresa] sobre [assunto]. Quero chegar a este resultado: [o que você quer]. No máximo 150 palavras, sem soar agressivo.'],
      ['Legenda para post', 'Crie 3 legendas para um post de Instagram sobre [tema], para um público de [quem segue]. Cada uma com gancho na primeira linha, até 3 frases e uma chamada para ação no fim.'],
      ['Resumo em tópicos', 'Resuma o conteúdo abaixo em 5 tópicos curtos, do mais importante ao menos importante, e feche com uma frase de conclusão.\n\nConteúdo: [cole o texto]'],
    ],
    'Estudos': [
      ['Explicar como se eu tivesse 12 anos', 'Explique [assunto] como se eu tivesse 12 anos. Use uma comparação do dia a dia, um exemplo prático e termine com 3 perguntas para eu testar se entendi.'],
      ['Plano de estudos', 'Monte um plano de [número] semanas para eu aprender [assunto], estudando [horas] por dia. Para cada semana: tema, exercício e uma revisão no fim.'],
      ['Simulado', 'Crie 10 questões de múltipla escolha sobre [assunto], no nível [ENEM, vestibular ou faculdade]. Mostre o gabarito comentado só no final.'],
      ['Flashcards', 'Transforme o conteúdo abaixo em 15 flashcards de pergunta e resposta, com respostas de no máximo duas linhas.\n\nConteúdo: [cole o texto]'],
    ],
    'Trabalho': [
      ['Pauta de reunião', 'Monte a pauta de uma reunião de [duração] sobre [tema] com [quem participa]. Inclua o objetivo, os tópicos com o tempo de cada um e as decisões que precisamos tomar.'],
      ['Análise SWOT', 'Faça uma análise SWOT de [empresa ou ideia] no mercado de [setor] no Brasil. Para cada quadrante, 3 pontos e uma ação prática.'],
      ['Responder cliente', 'Escreva uma resposta cordial e objetiva para este cliente: reconheça o problema, explique a solução e diga o prazo.\n\nMensagem do cliente: [cole aqui]'],
      ['Planilha de controle', 'Sugira as colunas de uma planilha para controlar [o que você quer controlar], com o tipo de dado de cada coluna e 2 fórmulas úteis para Excel ou Google Sheets.'],
    ],
    'Código': [
      ['Explicar código', 'Explique o que este código faz, bloco por bloco, em linguagem simples. Aponte riscos e o que poderia ser melhor.\n\nCódigo: [cole o código]'],
      ['Achar o bug', 'Este código dá o erro abaixo. Encontre a causa, explique em uma frase e mostre a versão corrigida.\n\nErro: [mensagem de erro]\n\nCódigo: [cole o código]'],
      ['Fórmula de Excel', 'Escreva uma fórmula de Excel que [o que a fórmula deve fazer]. Meus dados estão em [colunas e linhas]. Explique cada parte da fórmula.'],
      ['Regex', 'Crie uma expressão regular que valide [formato, ex.: CPF ou telefone]. Mostre 3 exemplos que passam, 3 que falham e explique cada parte.'],
    ],
    'Criatividade': [
      ['Nomes para marca', 'Sugira 10 nomes para uma marca de [produto ou serviço] para [quem compra]. Nomes curtos e fáceis de falar, com o porquê de cada um.'],
      ['Roteiro de Reels', 'Escreva um roteiro de Reels de 30 segundos sobre [tema]: gancho nos 3 primeiros segundos, desenvolvimento e chamada final, com uma sugestão de cena para cada parte.'],
      ['História curta', 'Escreva uma história de até 400 palavras sobre [tema], com um personagem marcante e um final surpreendente.'],
      ['Ideias de presente', 'Me dê 10 ideias de presente para [pessoa], que gosta de [gostos], até R$ [valor]. Separe em lembrancinha, útil e experiência.'],
    ],
  };

  const MODELS = [
    { id: 'rapido', name: 'SKYNETchat 4.5', sub: 'Rápido', desc: 'Respostas na hora para o dia a dia' },
    { id: 'pensar', name: 'SKYNETchat 4.5', sub: 'Pensar', desc: 'Raciocina antes de responder. Melhor para problemas difíceis' },
    { id: 'pro', name: 'SKYNETchat 4.5', sub: 'Pro', desc: 'O mais capaz, para trabalho pesado', pro: true },
  ];

  const AGENTS = [
    { n: 'P', name: 'Pesquisador', role: 'levanta o contexto' },
    { n: 'R', name: 'Redator', role: 'escreve a proposta' },
    { n: 'V', name: 'Revisor', role: 'confere e ajusta' },
  ];

  const MINE = 'Meus';
  const PROMPT_ICONS = { 'Escrita': 'i-pen', 'Estudos': 'i-cap', 'Trabalho': 'i-brief', 'Código': 'i-code', 'Criatividade': 'i-spark', [MINE]: 'i-user' };

  // Agentes especialistas. Com o back-end, desc e skills viram as instruções de sistema de cada um.
  // Agentes do demo (só front): nome, descrição, ícone e cor. As respostas são simuladas em agentReply().
  const AG_GROUPS = ['Pesquisa & Investigação', 'Segurança & Hacking', 'Programação'];
  const AGENT_LIST = [
    { id: 'busca-web', group: 'Pesquisa & Investigação', name: 'Busca na Web', color: '#60a5fa', icon: 'i-globe',
      desc: 'Pesquisa em tempo real sem censura',
      skills: ['busco em tempo real e trago a fonte de cada resposta', 'junto o que vários sites dizem num resumo só', 'aviso quando a informação é incerta ou tem versões'],
      starters: [['Resumir um assunto', 'Resuma o que saiu de mais recente sobre [assunto], com as fontes.'], ['Comparar fontes', 'O que diferentes fontes dizem sobre [tema]?']] },
    { id: 'osint', group: 'Pesquisa & Investigação', name: 'OSINT', color: '#f87171', icon: 'i-eye', tag: 'PRO',
      desc: 'Investigação de perfis do Instagram',
      skills: ['reúno o que é público sobre um perfil ou marca', 'confiro se uma conta parece falsa ou golpe', 'organizo os achados com o link de cada fonte'],
      starters: [['Conta é golpe?', 'Como eu confiro se um perfil que me chamou é golpe?'], ['Pesquisa de marca', 'Que informações públicas existem sobre a empresa [nome]?']] },
    { id: 'analise-sites', group: 'Pesquisa & Investigação', name: 'Análise de Sites', color: '#2dd4bf', icon: 'i-scan',
      desc: 'Analise qualquer site ou URL',
      skills: ['leio o site e resumo do que ele trata', 'confiro certificado, cabeçalhos e tecnologia usada', 'aponto sinais de site falso ou inseguro'],
      starters: [['Esse site é seguro?', 'Este site é confiável para comprar? [cole a URL]'], ['O que o site usa', 'Que tecnologias este site parece usar? [cole a URL]']] },
    { id: 'fact-checker', group: 'Pesquisa & Investigação', name: 'Fact-Checker', color: '#f59e0b', icon: 'i-flask',
      desc: 'Verificação de fatos com fontes',
      skills: ['separo o que é fato do que é opinião', 'procuro a fonte original da afirmação', 'dou um veredito com o grau de certeza'],
      starters: [['Isso é verdade?', 'Verifique se é verdade: [cole a afirmação]'], ['Checar um print', 'Essa mensagem que recebi procede? [cole o texto]']] },
    { id: 'geoloc', group: 'Pesquisa & Investigação', name: 'Geolocalização', color: '#fb7185', icon: 'i-pin',
      desc: 'Rastreio de IPs e localização',
      skills: ['explico de que região vem um endereço de IP', 'converto coordenadas em lugar e o contrário', 'digo o que um IP revela e o que não revela'],
      starters: [['Região de um IP', 'De que região aproximada é este IP? [cole o IP]'], ['Entender coordenadas', 'Que lugar fica nestas coordenadas: [lat, long]?']] },

    { id: 'pentest', group: 'Segurança & Hacking', name: 'Pentest Assistant', color: '#f87171', icon: 'i-shield', tag: 'PRO',
      desc: 'Testes de penetração guiados',
      skills: ['monto o checklist de um teste autorizado, com escopo', 'explico cada etapa e o que ela procura', 'organizo o relatório com risco e correção'],
      starters: [['Checklist de pentest', 'Monte um checklist de pentest autorizado para uma aplicação web.'], ['Entender uma falha', 'Explique o que é injeção de SQL e como se proteger dela.']] },
    { id: 'password', group: 'Segurança & Hacking', name: 'Password Tools', color: '#fbbf24', icon: 'i-key',
      desc: 'Geração e análise de senhas',
      skills: ['gero senhas fortes e explico por que são boas', 'avalio a força de uma senha sem guardá-la', 'ensino a usar gerenciador e dois fatores'],
      starters: [['Senha forte', 'Gere uma senha forte de 20 caracteres e explique como guardar.'], ['Senha fraca?', 'O que torna uma senha fácil de descobrir?']] },
    { id: 'forensics', group: 'Segurança & Hacking', name: 'Forensics', color: '#f472b6', icon: 'i-print',
      desc: 'Análise forense digital',
      skills: ['explico como se preserva uma evidência digital', 'ajudo a entender logs e a linha do tempo', 'aponto o que procurar depois de um incidente'],
      starters: [['O que é forense', 'Para que serve uma análise forense e como ela funciona?'], ['Entender um log', 'Me ajude a entender o que este log mostra: [cole o log]']] },
    { id: 'firewall', group: 'Segurança & Hacking', name: 'Firewall Tester', color: '#facc15', icon: 'i-shieldwarn',
      desc: 'Teste regras de firewall',
      skills: ['reviso regras e aponto o que está aberto demais', 'explico portas e protocolos em linguagem simples', 'sugiro uma política mais segura'],
      starters: [['Revisar regras', 'Revise estas regras de firewall e aponte brechas: [cole aqui]'], ['Entender portas', 'Que portas eu devo manter fechadas no meu servidor?']] },
    { id: 'malware', group: 'Segurança & Hacking', name: 'Malware Analysis', color: '#ef4444', icon: 'i-skull',
      desc: 'Análise de malwares e payloads',
      skills: ['explico o que um tipo de arquivo costuma fazer', 'aponto os sinais de que algo é malicioso', 'ensino como remover a ameaça e se proteger'],
      starters: [['É vírus?', 'Recebi um arquivo estranho. Como sei se é perigoso sem abrir?'], ['Cliquei num link', 'Cliquei num link suspeito. O que faço agora?']] },
    { id: 'wifi', group: 'Segurança & Hacking', name: 'WiFi Auditor', color: '#38bdf8', icon: 'i-wifi',
      desc: 'Auditoria de redes sem fio',
      skills: ['explico os padrões de segurança de wifi e qual usar', 'ajudo a deixar a sua rede mais protegida', 'aponto sinais de que alguém pode estar na rede'],
      starters: [['Wifi mais seguro', 'Como deixo o wifi da minha casa mais seguro?'], ['WPA2 ou WPA3', 'Qual a diferença entre WPA2 e WPA3?']] },
    { id: 'ddos', group: 'Segurança & Hacking', name: 'DDoS Analyzer', color: '#fb923c', icon: 'i-crosshair',
      desc: 'Análise e mitigação de DDoS',
      skills: ['explico como um ataque de negação funciona', 'ajudo a preparar o servidor para aguentar picos', 'monto um plano de resposta a incidente'],
      starters: [['Mitigar DDoS', 'Como protejo o meu site contra um ataque DDoS?'], ['Meu site caiu', 'Meu site está fora do ar. Como descubro se é ataque?']] },

    { id: 'codegen', group: 'Programação', name: 'Gerador de Código', color: '#60a5fa', icon: 'i-code',
      desc: 'Qualquer linguagem',
      skills: ['escrevo a função pronta para colar e rodar', 'explico o código linha a linha', 'adapto para a linguagem que você usa'],
      starters: [['Criar uma função', 'Escreva uma função que [o que ela faz] em [linguagem].'], ['Explicar código', 'Explique o que este código faz: [cole aqui]']] },
    { id: 'shell', group: 'Programação', name: 'Shell & Scripts', color: '#4ade80', icon: 'i-term',
      desc: 'Bash, PowerShell, automações',
      skills: ['escrevo o script de automação comentado', 'explico cada comando antes de você rodar', 'aviso o que é perigoso apagar'],
      starters: [['Automatizar backup', 'Script para fazer backup de uma pasta todo dia.'], ['Renomear em massa', 'Comando para renomear vários arquivos de uma vez.']] },
    { id: 'reverse', group: 'Programação', name: 'Engenharia Reversa', color: '#f87171', icon: 'i-filecode',
      desc: 'Decompilação e análise de binários',
      skills: ['explico como um binário é estruturado', 'ajudo a entender o que um programa faz', 'ensino as ferramentas do ramo'],
      starters: [['O que é', 'Para que serve engenharia reversa e onde é usada?'], ['Começar a analisar', 'Como começo a analisar um executável desconhecido com segurança?']] },
    { id: 'api', group: 'Programação', name: 'API Builder', color: '#a78bfa', icon: 'i-braces',
      desc: 'Crie APIs REST completas',
      skills: ['desenho as rotas REST do zero', 'escrevo o código do endpoint pronto', 'mostro como testar com exemplos'],
      starters: [['Criar uma API', 'Crie uma API REST de cadastro de clientes em [linguagem].'], ['Documentar rota', 'Escreva a documentação desta rota: [cole aqui]']] },
    { id: 'sql', group: 'Programação', name: 'SQL Generator', color: '#22d3ee', icon: 'i-db',
      desc: 'Queries e schemas',
      skills: ['escrevo a query já com os nomes das suas tabelas', 'explico joins e agregações sem enrolação', 'desenho o schema do banco'],
      starters: [['Montar uma query', 'Query que traga os 10 produtos mais vendidos do mês.'], ['Desenhar o banco', 'Monte o schema de um banco para uma loja online.']] },
    { id: 'webhooks', group: 'Programação', name: 'Webhooks & Bots', color: '#fbbf24', icon: 'i-webhook',
      desc: 'Automações e integrações',
      skills: ['monto o fluxo entre dois serviços', 'escrevo o webhook que recebe e trata o evento', 'ligo a automação no Zapier, n8n ou em código'],
      starters: [['Ligar dois apps', 'Quero que um pedido novo caia no meu WhatsApp. Como faço?'], ['Criar um webhook', 'Escreva um webhook que recebe um pagamento e salva no banco.']] },
  ];
  const agentById = id => AGENT_LIST.find(a => a.id === id) || null;

  // Avatar do agente: um azulejo arredondado com o ícone, na cor do agente.
  function agentAvatar(a, cls = '') {
    return `<span class="ag-av${cls ? ' ' + cls : ''}" style="--ag:${a.color}" aria-hidden="true">${icon(a.icon)}</span>`;
  }

  /* ---------------- Estado ---------------- */
  const DAY = 864e5;
  const now = Date.now();
  const seed = () => [
    { id: uid(), title: 'Legenda para a cafeteria', updated: now - 2 * 36e5, messages: [{ role: 'user', text: SUGGESTIONS[0].prompt }, { role: 'ai', text: R.legenda, model: 'Rápido' }] },
    { id: uid(), title: 'Juros compostos na prática', updated: now - DAY - 36e5, messages: [{ role: 'user', text: SUGGESTIONS[1].prompt }, { role: 'ai', text: R.juros, model: 'Rápido' }] },
    { id: uid(), title: 'Renomear fotos pela data', updated: now - 3 * DAY, messages: [{ role: 'user', text: SUGGESTIONS[2].prompt }, { role: 'ai', text: R.python, model: 'Pensar', thought: 4 }] },
    { id: uid(), title: 'Nomes para o podcast', updated: now - 5 * DAY, messages: [{ role: 'user', text: 'Me dá ideias de nome para um podcast de conversa sobre o dia a dia.' }, { role: 'ai', text: R.podcast, model: 'Rápido' }] },
    { id: uid(), title: 'Plano de inglês em 30 dias', updated: now - 12 * DAY, messages: [{ role: 'user', text: SUGGESTIONS[3].prompt }, { role: 'ai', text: R.ingles, model: 'Rápido' }] },
  ];

  // Atalho de teste da prévia: abrir com ?plano=free ou ?plano=pro troca o plano salvo neste navegador.
  {
    const q = new URLSearchParams(location.search);
    const plano = q.get('plano');
    if (plano === 'free' || plano === 'pro') {
      store.set('skynet-plan', plano);
      if (plano === 'free') store.set('skynet-usage', { day: '', n: 0 });
      q.delete('plano');
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
    }
  }

  const state = {
    convs: store.get('skynet-convs', null) || seed(),
    currentId: null,
    model: store.get('skynet-model', 'rapido'),
    tools: { search: false, think: false },
    mode: null,
    files: [],
    streaming: false,
    abort: false,
    user: store.get('skynet-user', null),
    prefs: Object.assign({ enter: true, lang: 'pt-BR', name: '', about: '', style: 'equilibradas', noHistory: false }, store.get('skynet-prefs', {})),
    projects: store.get('skynet-projects', []),
    myPrompts: store.get('skynet-myprompts', []),
    agent: null,
    project: null,
    projectView: null,
    view: 'chat',
    sessions: store.get('skynet-sessions', null) || [
      { id: uid(), name: 'Trabalho de história', code: 'SKY-7Q4M', people: ['Você', 'Ana', 'Bruno', 'Carla'], max: 10, host: true, updated: now - 2 * 36e5 },
      { id: uid(), name: 'Viagem de fim de ano', code: 'SKY-K2PX', people: ['Marina', 'Você', 'Rafa'], max: 6, host: false, updated: now - DAY - 5 * 36e5 },
      { id: uid(), name: 'Lançamento da loja', code: 'SKY-9TVB', people: ['Júlia', 'Você', 'Pedro', 'Lia', 'Caio', 'Duda', 'Leo', 'Bia', 'Gabi', 'Theo'], max: 10, host: false, updated: now - 3 * DAY },
    ],
    session: null,
    plan: store.get('skynet-plan', 'free'),
    usage: store.get('skynet-usage', { day: '', n: 0 }),
    stick: true,
  };
  // Conversas abertas com o histórico desligado levam temp: nunca vão para o disco e somem ao sair delas.
  const saveConvs = () => store.set('skynet-convs', state.convs.filter(c => !c.temp));
  const dropTemp = keep => { state.convs = state.convs.filter(c => !c.temp || c.id === keep); };

  // Conversas de exemplo no histórico, no tom do SKYNETchat: informação direta, sem rodeio e sem sermão.
  // Ids fixos: quem já abriu a demo troca as conversas de exemplo antigas por estas, uma vez só.
  const DEMO_HISTORY = () => {
    const H = 36e5;
    const conv = (id, title, hoursAgo, msgs, extra = {}) => ({
      id: 'demo-' + id, title, updated: now - hoursAgo * H, ...extra,
      messages: msgs.map(([role, text, more]) => role === 'ai' ? { role, text, model: 'Rápido', ...(extra.agent ? { agent: extra.agent } : {}), ...more } : { role, text }),
    });
    return [
      conv('tor', 'Como usar o Tor com segurança', 1, [
        ['user', 'Como usar o Tor com segurança? É legal no Brasil?'],
        ['ai', `É legal, sim. O Tor é uma ferramenta de privacidade usada por jornalistas, pesquisadores e qualquer pessoa que não quer ser rastreada.

**Como ele funciona**
Seu tráfego passa por três servidores voluntários, com uma camada de criptografia para cada um. O site que você visita vê o IP do último servidor, não o seu.

**Para usar bem**
- Baixe o Tor Browser só no site oficial, torproject.org
- Não instale extensões nem maximize a janela, isso ajuda a te identificar
- Prefira sites com HTTPS: o último servidor consegue ver o que não é criptografado
- Não entre nas suas contas pessoais se o objetivo é anonimato
- Para risco alto, use o sistema Tails, que roda num pendrive e não deixa rastro no computador

O Tor protege o caminho, não o comportamento: o que você publica ou baixa ainda pode te identificar.`, { sources: true, thought: 3, model: 'Pensar' }],
      ]),
      conv('abordagem', 'Meus direitos numa abordagem policial', 4, [
        ['user', 'Quais são meus direitos numa abordagem policial?'],
        ['ai', `O básico que vale saber:

- **Identificação:** você deve apresentar documento quando pedido. Recusar pode virar contravenção
- **Revista pessoal:** a lei exige fundada suspeita, não basta "atitude suspeita" genérica
- **Silêncio:** você não é obrigado a responder perguntas nem a produzir prova contra si
- **Celular:** o conteúdo só pode ser acessado com ordem judicial ou com o seu consentimento
- **Filmar:** em local público, registrar a abordagem é permitido, sem atrapalhar o trabalho do policial
- **Identificação do policial:** você pode pedir o nome, que deve estar na farda

Mantenha a calma e as mãos à vista. Se houver abuso, anote nome, viatura e horário e procure a Corregedoria, a Defensoria Pública ou o Ministério Público.

Isto é orientação geral; num caso concreto, fale com um advogado.`],
      ]),
      conv('cannabis', 'Cannabis medicinal: o que é verdade', 26, [
        ['user', 'Cannabis medicinal funciona mesmo? Como é a regra no Brasil?'],
        ['ai', `**A regra hoje**
A Anvisa autoriza a venda de produtos de cannabis em farmácias, com receita médica, e a importação com autorização prévia. O cultivo em casa só acontece com decisão judicial, caso a caso.

**Onde a evidência é forte**
- Epilepsias graves e resistentes a remédio, como as síndromes de Dravet e Lennox-Gastaut
- Náusea causada por quimioterapia
- Espasticidade na esclerose múltipla

**Onde ainda é fraca**
Ansiedade, insônia e dor crônica comum: há relatos bons, mas pouco estudo de qualidade.

**Riscos reais**
O CBD interage com outros remédios, como anticoagulantes e antiepilépticos. O THC pode piorar quadros psicóticos em quem tem predisposição. Por isso o acompanhamento médico faz diferença.`, { sources: true }],
      ]),
      conv('ditadura', 'Censura na ditadura militar', 30, [
        ['user', 'Como funcionava a censura na ditadura militar?'],
        ['ai', `A ditadura durou de 1964 a 1985, e a censura ficou mais dura depois do **AI-5**, em dezembro de 1968.

- **Censura prévia:** censores liam jornais, livros, peças e músicas antes de saírem
- **Os buracos no jornal:** o Estadão e o Jornal da Tarde publicavam versos de Camões e receitas de bolo no lugar das matérias cortadas, para o leitor perceber o que faltava
- **Na música:** Chico Buarque teve canções vetadas e chegou a usar o pseudônimo Julinho da Adelaide para passar pelos censores
- **O saldo:** a Comissão Nacional da Verdade, em 2014, reconheceu 434 mortos e desaparecidos políticos

A Lei da Anistia, de 1979, e o fim da censura prévia abriram o caminho para a redemocratização.`],
      ]),
      conv('piramide', 'Isso é pirâmide?', 70, [
        ['user', 'Me chamaram para um clube que rende 10% ao mês e paga bônus por indicação. Vale a pena?'],
        ['ai', `Tem todos os sinais de pirâmide:

- **10% ao mês** dá mais de 200% ao ano. Nenhum investimento legítimo garante isso
- **Bônus por indicação** mostra que o dinheiro vem de quem entra depois
- Produto vago, pressa para você entrar e "vagas limitadas" completam o quadro

Pirâmide é crime contra a economia popular e, quando para de entrar gente nova, a maioria perde tudo.

**Antes de qualquer coisa**
- Consulte na CVM se a oferta tem registro
- Pesquise o CNPJ e as reclamações da empresa
- Se já entrou, tente sacar logo e guarde todos os comprovantes

Denúncia: CVM, Procon ou delegacia.`, { thought: 2, model: 'Pensar' }],
      ]),
      conv('mistura', 'Álcool com remédio: o que é perigoso', 96, [
        ['user', 'Quais remédios são perigosos de misturar com álcool?'],
        ['ai', `As combinações mais perigosas:

- **Calmantes e remédios para dormir** (clonazepam, alprazolam, zolpidem): somados ao álcool podem parar a respiração
- **Opioides** (tramadol, codeína, morfina): mesmo risco, e é o que mais mata
- **Paracetamol em dose alta:** o fígado sofre em dobro
- **Metronidazol:** causa náusea forte, vômito e coração acelerado
- **Antialérgicos e antidepressivos:** sonolência pesada e reflexo lento
- **Energético:** mascara a embriaguez e faz a pessoa beber mais

**Sinais de emergência:** respiração lenta, lábios roxos ou a pessoa não acorda. Ligue 192 e deixe a pessoa deitada de lado.

Na dúvida sobre um remédio específico, o farmacêutico responde na hora e sem julgamento.`],
      ]),
      conv('espiao', 'Meu celular está sendo espionado?', 150, [
        ['user', 'Acho que instalaram um app espião no meu celular. Como descubro?'],
        ['ai', `**Sinais comuns**
- Bateria e internet acabando sem motivo
- Celular quente mesmo parado
- Apps que você não reconhece

**No Android**
- Configurações, Segurança, Apps de administrador do dispositivo: desative o que não conhece
- Confira Acessibilidade: apps espiões costumam pedir essa permissão
- Rode o Play Protect

**No iPhone**
- Ajustes, Geral, VPN e Gerenciamento de Dispositivo: remova perfis estranhos
- Use a Verificação de Segurança, em Privacidade e Segurança

Depois, troque a senha da conta Google ou do Apple ID **usando outro aparelho** e ative a verificação em duas etapas.

Se quem instalou é alguém próximo e você corre risco, remover o app pode alertar a pessoa. Nesse caso, ligue 180 antes.`],
      ]),
      conv('armas', 'Porte de armas: os dois lados', 330, [
        ['user', 'Me dá os argumentos dos dois lados sobre porte de armas, sem puxar para nenhum.'],
        ['ai', `**A favor**
- Direito individual de se defender, principalmente onde a polícia demora
- Efeito de dissuasão: o criminoso não sabe quem está armado
- Exigências de treino e registro deixam o acesso nas mãos de quem segue a lei

**Contra**
- Pesquisas associam mais armas em circulação a mais homicídios e suicídios
- Armas legais são roubadas e acabam no crime
- Discussões banais podem terminar em morte quando há uma arma por perto

**No Brasil**
O Estatuto do Desarmamento, de 2003, é a base. Entre 2019 e 2022 decretos facilitaram o acesso, e em 2023 as regras voltaram a ficar mais restritas.

A evidência é mais forte em alguns pontos que em outros. Quer que eu aprofunde algum com dados?`, { sources: true }],
      ]),
      conv('honesto', 'Crítica sem filtro da minha bio', 700, [
        ['user', 'Seja brutalmente honesto sobre minha bio do LinkedIn: "Sou apaixonado por inovação e transformo sonhos em realidade."'],
        ['ai', `Sinceramente: ela não diz nada.

- "Apaixonado por inovação" está em milhares de perfis
- "Transformo sonhos em realidade" não fala o que você faz, para quem nem com qual resultado
- Quem lê não sabe se você é designer, vendedor ou engenheiro

**Troque por fatos**
"Gerente de produto em fintech. Lancei 3 apps que somam 2 milhões de downloads. Hoje cuido de pagamentos por Pix."

Quer que eu reescreva a sua com o que você faz de verdade?`],
      ]),
    ];
  };
  const OLD_DEMO = ['reuniao', 'treino', 'bolo', 'procv', 'vo', 'notebook', 'gramado', 'carta', 'revolucao', 'logo'].map(x => 'demo-' + x);
  if (store.get('skynet-demo-chats', 0) < 2) {
    state.convs = state.convs.filter(c => !OLD_DEMO.includes(c.id));
    const have = new Set(state.convs.map(c => c.id));
    DEMO_HISTORY().forEach(c => { if (!have.has(c.id)) state.convs.push(c); });
    store.set('skynet-demo-chats', 2);
    saveConvs();
  }

  // Projetos de exemplo, com conversas próprias (essas não aparecem no histórico da barra lateral).
  // A versão da demo deixa quem já tinha os 4 primeiros receber os 5 novos sem perder nada.
  const svgUri = svg => 'data:image/svg+xml,' + encodeURIComponent(svg);
  const DEMO_LOGOS = {
    'Café Grão Nobre': svgUri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='#f4e7d3'/><circle cx='32' cy='32' r='23' fill='#5a3a26'/><path d='M21.5 29h17v6.5a8.5 8.5 0 0 1-8.5 8.5 8.5 8.5 0 0 1-8.5-8.5z' fill='#f4e7d3'/><path d='M38.5 31.5h2a3.6 3.6 0 0 1 0 7.2h-3' fill='none' stroke='#f4e7d3' stroke-width='2.4'/><path d='M26 19.5c-1.6 2 1.6 3.2 0 5.4M31 18.5c-1.6 2 1.6 3.2 0 5.4' fill='none' stroke='#e2b98c' stroke-width='2' stroke-linecap='round'/><path d='M19.5 46.5h21' stroke='#f4e7d3' stroke-width='2.4' stroke-linecap='round'/></svg>"),
    'Barbearia Navalha': svgUri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='#121212'/><circle cx='32' cy='32' r='24' fill='none' stroke='#c9a24a' stroke-width='1.4' opacity='.55'/><g fill='none' stroke='#c9a24a' stroke-width='3' stroke-linecap='round'><circle cx='24.5' cy='42' r='5'/><circle cx='39.5' cy='42' r='5'/><path d='M27.8 38.3 40.5 17.5M36.2 38.3 23.5 17.5'/></g><circle cx='32' cy='28.6' r='1.7' fill='#c9a24a'/></svg>"),
  };

  // Conversas de exemplo dentro de cada projeto: [título, [[quem, texto], ...]].
  const DEMO_CHATS = {
    'TCC de Psicologia': [
      ['Estrutura do capítulo 2', [
        ['user', 'Me ajuda a estruturar o capítulo 2 do meu TCC sobre ansiedade em universitários? Tenho umas 15 páginas para ele.'],
        ['ai', `Uma estrutura que cabe bem em 15 páginas:

## 2.1 Ansiedade: conceito e critérios (3 páginas)
Diferencie ansiedade adaptativa de transtorno e apresente os critérios do DSM-5-TR para o transtorno de ansiedade generalizada.

## 2.2 O contexto universitário (4 páginas)
Mudança de cidade, pressão por desempenho e incerteza sobre o futuro. Traga dados brasileiros de prevalência entre estudantes.

## 2.3 Fatores de risco e de proteção (4 páginas)
Sono, apoio social, trabalho junto com a faculdade e acesso a serviços de saúde mental no campus.

## 2.4 Intervenções com evidência (4 páginas)
Terapia cognitivo-comportamental, mindfulness e programas de acolhimento oferecidos pelas universidades.

Nas citações, siga o padrão autor e ano, por exemplo **(Barlow, 2016)**. Quer que eu monte o primeiro parágrafo do 2.1?`],
        ['user', 'Quero sim, o primeiro parágrafo do 2.1.'],
        ['ai', `A ansiedade é uma resposta emocional esperada diante de situações percebidas como ameaçadoras e, em níveis moderados, prepara o organismo para agir (Barlow, 2016). Ela passa a ser considerada clinicamente relevante quando se torna persistente, desproporcional ao contexto e prejudica o funcionamento social, acadêmico ou profissional, como descrevem os critérios do DSM-5-TR (American Psychiatric Association, 2022).

Se quiser, sigo para o parágrafo que separa ansiedade de medo.`],
      ]],
      ['Revisão da introdução', [
        ['user', 'Revisa esse trecho da introdução: "A ansiedade é muito comum hoje em dia e afeta muitos estudantes que tem muitas cobranças."'],
        ['ai', `Versão revisada:

"A ansiedade tem se mostrado frequente entre estudantes universitários, que convivem com cobranças acadêmicas, financeiras e familiares ao longo da graduação."

**O que mudou**
- "têm" leva acento no plural
- tirei as repetições de "muito" e "muitas"
- troquei "hoje em dia" por um tom mais acadêmico
- deixei claro que tipo de cobrança você vai discutir`],
      ]],
      ['Metodologia qualitativa', [
        ['user', 'Vou entrevistar 8 estudantes. Que método de análise eu uso?'],
        ['ai', `Para 8 entrevistas semiestruturadas, a **análise de conteúdo de Bardin** funciona bem e é aceita na maioria das bancas.

1. **Pré-análise:** transcreva tudo e faça uma leitura flutuante
2. **Exploração do material:** marque trechos e agrupe em categorias, como "pressão acadêmica" e "estratégias de enfrentamento"
3. **Tratamento dos resultados:** interprete as categorias à luz do capítulo 2

Cite Bardin (2016) e descreva como chegou às categorias. Isso costuma ser o ponto mais cobrado.`],
      ]],
    ],
    'Loja de roupas': [
      ['Legendas da coleção nova', [
        ['user', 'Preciso de 3 legendas para lançar a coleção de verão no Instagram.'],
        ['ai', `**1. Direta**
Chegou o verão da loja. Peças leves, cores que pedem sol e caimento que você vai querer usar o dia todo. Já no site e na loja.

**2. Com chamada**
Qual peça vai com você para a praia? Comenta aqui e a gente separa a sua no tamanho certo.

**3. Afetiva**
Feita para os dias longos, as saídas sem hora para voltar e as fotos que você ainda vai tirar. Coleção Verão, agora.`],
      ]],
      ['Atendimento no WhatsApp', [
        ['user', 'Monta um roteiro de atendimento pelo WhatsApp para quem chega perguntando preço.'],
        ['ai', `**1. Boas-vindas**
Oi! Que bom te ver por aqui. Você viu essa peça no Instagram ou no site?

**2. Entender o que a pessoa quer**
Me conta seu tamanho e para qual ocasião, que eu te mando as opções que mais combinam.

**3. Preço com valor**
Essa sai por R$ 129,90, em até 3x sem juros, e o tecido não amassa na mala.

**4. Fechamento**
Quer que eu separe a sua? Consigo enviar hoje se você confirmar até as 16h.`],
      ]],
    ],
    'Mudança para Portugal': [
      ['Visto D7 passo a passo', [
        ['user', 'Quais os passos para o visto D7?'],
        ['ai', `Um caminho comum para o D7, o visto de renda própria:

1. Comprove renda passiva recorrente, como aposentadoria, aluguel ou investimentos
2. Abra conta em banco português e obtenha o NIF
3. Reúna antecedentes criminais, seguro de saúde e comprovante de moradia em Portugal
4. Agende no centro de vistos do seu consulado e entregue a documentação
5. Com o visto aprovado, viaje e faça o agendamento para a autorização de residência

Os valores mínimos e a lista de documentos mudam com frequência. Confira no site do consulado antes de juntar tudo.`],
      ]],
      ['Custo de vida em Lisboa', [
        ['user', 'Quanto custa viver em Lisboa com uma família de 3?'],
        ['ai', `Uma estimativa mensal aproximada, para conferir antes de decidir:

- **Aluguel T2 fora do centro:** de € 1.300 a € 1.800
- **Mercado:** de € 500 a € 700
- **Contas da casa:** de € 150 a € 220
- **Transporte com passe:** cerca de € 120
- **Escola, se for particular:** de € 400 a € 800

Total entre € 2.500 e € 3.600 por mês. Bairros como Odivelas e Amadora costumam sair mais em conta que o centro.`],
      ]],
    ],
    'Finanças da casa': [
      ['Orçamento de outubro', [
        ['user', 'Monta o orçamento de outubro com R$ 8.000 e meta de guardar 15%.'],
        ['ai', `Orçamento de R$ 8.000 com 15% guardado:

- **Moradia:** R$ 2.400 (30%)
- **Mercado:** R$ 1.200
- **Contas da casa:** R$ 450
- **Transporte:** R$ 600
- **Saúde:** R$ 500
- **Lazer:** R$ 650
- **Imprevistos:** R$ 1.000
- **Reserva:** R$ 1.200 (15%)

Transfira a reserva no dia em que o salário cai, antes de pagar qualquer conta. Assim ela não vira sobra.`],
        ['user', 'E se sobrar dinheiro dos imprevistos?'],
        ['ai', `Leve o que sobrar para a reserva no fim do mês. Quando ela chegar a 6 meses de gastos, perto de R$ 40 mil, o excedente pode ir para investimentos de prazo maior.`],
      ]],
    ],
    'Café Grão Nobre': [
      ['Cardápio de inverno', [
        ['user', 'Sugere 5 itens para o cardápio de inverno, com preço.'],
        ['ai', `- **Mocha de doce de leite:** R$ 16
- **Chocolate quente cremoso com canela:** R$ 15
- **Chai latte da casa:** R$ 14
- **Pão de queijo recheado com goiabada:** R$ 9
- **Torta de maçã quentinha com sorvete:** R$ 19

Os preços consideram o ticket médio de cafeterias no centro de Curitiba. Quer a descrição de cada item para o cardápio impresso?`],
      ]],
      ['Post de inauguração da loja 2', [
        ['user', 'Escreve o post de inauguração da nossa segunda loja.'],
        ['ai', `Agora são duas casas. 🤎

A segunda Grão Nobre abre sábado, no Batel, com o mesmo café coado na hora e aquela mesa perto da janela esperando por você. Nos três primeiros dias, o primeiro café é por nossa conta.

Marca aqui quem vai com você.`],
      ]],
    ],
    'Barbearia Navalha': [
      ['Lembrete de horário no WhatsApp', [
        ['user', 'Cria mensagens de lembrete de horário.'],
        ['ai', `**Um dia antes**
Fala, Pedro! Seu horário na Navalha é amanhã às 18h com o Rafa. Responde 1 para confirmar ou 2 para remarcar.

**Duas horas antes**
Tudo certo para hoje às 18h? Estamos te esperando.

**Depois do corte**
Valeu pela visita! Se curtiu, deixa uma avaliação aqui: link. Seu próximo horário sai com 10% de desconto.`],
      ]],
      ['Promoção de terça', [
        ['user', 'Ideia de promoção para encher as terças.'],
        ['ai', `**Terça da Navalha:** corte mais barba por R$ 55, no lugar de R$ 70, só às terças das 10h às 17h.

Divulgue no story da segunda à noite e mande no WhatsApp para quem não aparece há mais de 30 dias. Esse público costuma voltar com uma oferta com prazo curto.`],
      ]],
    ],
    'Viagem ao Japão': [
      ['Roteiro de Kyoto', [
        ['user', 'Monta 3 dias em Kyoto.'],
        ['ai', `**Dia 1: leste**
Kiyomizu-dera cedo, ruas de Sannenzaka e Ninenzaka, almoço em Gion e fim de tarde em Yasaka.

**Dia 2: oeste**
Bambuzal de Arashiyama logo na abertura, templo Tenryu-ji e Kinkaku-ji à tarde.

**Dia 3: sul e centro**
Fushimi Inari antes das 8h para pegar os portões vazios, Mercado Nishiki no almoço e Pontocho à noite.

Compre um cartão de transporte recarregável no primeiro dia. Ele vale no metrô e nos ônibus.`],
      ]],
      ['JR Pass vale a pena?', [
        ['user', 'Para Tóquio, Kyoto e Osaka, o JR Pass compensa?'],
        ['ai', `Depois do aumento de preço do JR Pass em 2023, para esse roteiro costuma sair mais barato comprar os trechos avulsos de shinkansen.

- Tóquio para Kyoto e a volta de Osaka para Tóquio somam menos que o passe de 7 dias
- Entre Kyoto e Osaka, o trem local é rápido e barato

O passe volta a compensar se você incluir Hiroshima ou fizer bate-voltas longos.`],
      ]],
    ],
    'Canal no YouTube': [
      ['Roteiro: reserva de emergência', [
        ['user', 'Roteiro de 10 minutos sobre reserva de emergência.'],
        ['ai', `**0:00 Gancho**
"Se o seu salário parasse amanhã, quantos meses você aguentaria?"

**0:30 O problema**
Três histórias rápidas de imprevistos: carro, demissão e saúde.

**2:00 Quanto guardar**
De 3 a 6 meses do seu custo de vida, com a conta feita na tela.

**5:00 Onde deixar**
Liquidez diária e baixo risco: Tesouro Selic ou CDB que rende 100% do CDI.

**8:00 Como começar**
Um valor fixo no dia do pagamento, mesmo que pequeno.

**9:30 Chamada**
Pergunta para os comentários: quantos meses você já tem guardados?`],
      ]],
      ['10 títulos para o próximo vídeo', [
        ['user', '10 títulos para um vídeo sobre sair das dívidas.'],
        ['ai', `1. Saí de R$ 30 mil em dívidas em 14 meses
2. O método que eu usaria se estivesse endividado hoje
3. Pagar a menor ou a maior dívida primeiro?
4. 5 erros que te mantêm endividado
5. Como negociar dívida e pagar até 90% menos
6. Endividado com salário mínimo: por onde começar
7. Cartão de crédito: como sair do rotativo
8. A planilha que me tirou do vermelho
9. Feirão de dívidas vale a pena?
10. O que fazer no primeiro mês sem dívidas`],
      ]],
    ],
    'Reforma do apartamento': [
      ['Comparar três orçamentos', [
        ['user', 'Recebi três orçamentos para a cozinha: R$ 18 mil, R$ 22 mil e R$ 31 mil. Como comparo?'],
        ['ai', `Antes do preço, compare o que cada um inclui:

- **Escopo:** demolição, elétrica, hidráulica, revestimento e marcenaria estão em todos?
- **Material:** quem compra, e qual marca e padrão de piso e louça
- **Prazo e garantia:** em semanas, e garantia por escrito
- **Pagamento:** evite pagar mais de 30% antes de começar

Muitas vezes o de R$ 18 mil deixa marcenaria ou material de fora. Peça os três no mesmo formato, item por item, e me mande que eu monto a comparação.`],
      ]],
    ],
  };
  function demoChats(id, name, hrs) {
    (DEMO_CHATS[name] || []).forEach(([title, msgs], k) => state.convs.push({
      id: uid(), title, project: id, updated: now - (hrs + k * 26) * 36e5,
      messages: msgs.map(([role, text]) => role === 'ai' ? { role, text, model: 'Rápido' } : { role, text }),
    }));
  }
  function demoProject(name, desc, files, hrs) {
    const id = uid();
    const seed = Math.floor(Math.random() * 1e9);
    demoChats(id, name, hrs);
    return { id, name, seed, color: pixelIconColor(seed), icon: DEMO_LOGOS[name] || null, desc, files, created: now - (hrs + 300) * 36e5, updated: now - hrs * 36e5 };
  }
  const DEMO_V1 = () => [
    demoProject('TCC de Psicologia', 'Normas da ABNT, linguagem acadêmica e citações com autor e ano.', [{ name: 'Projeto de pesquisa.pdf', size: 1843200 }, { name: 'Referências.docx', size: 86016 }, { name: 'Cronograma.xlsx', size: 24576 }], 3),
    demoProject('Loja de roupas', 'Tom descontraído, público de 18 a 30 anos, vendas pelo Instagram e WhatsApp.', [{ name: 'Catálogo verão.pdf', size: 5242880 }, { name: 'Tabela de preços.xlsx', size: 31744 }], 20),
    demoProject('Mudança para Portugal', 'Lisboa, família de 3 pessoas, mudança em março.', [{ name: 'Checklist de documentos.pdf', size: 245760 }], 50),
    demoProject('Finanças da casa', 'Renda de R$ 8.000 por mês, meta de guardar 15%.', [{ name: 'Extrato setembro.csv', size: 12288 }], 120),
  ];
  const DEMO_V2 = () => [
    demoProject('Café Grão Nobre', 'Cafeteria no centro de Curitiba. Tom acolhedor, posts para o Instagram e cardápio sazonal.', [{ name: 'Cardápio.pdf', size: 1048576 }, { name: 'Logo.png', size: 204800 }], 6),
    demoProject('Barbearia Navalha', 'Agenda pelo WhatsApp, público de 20 a 45 anos, promoções às terças.', [{ name: 'Tabela de serviços.pdf', size: 158720 }], 30),
    demoProject('Viagem ao Japão', 'Abril, 15 dias entre Tóquio, Kyoto e Osaka, orçamento de R$ 25 mil.', [{ name: 'Passagens.pdf', size: 312320 }], 70),
    demoProject('Canal no YouTube', 'Vídeos de 10 minutos sobre finanças pessoais: roteiro, título e thumbnail.', [], 96),
    demoProject('Reforma do apartamento', 'Apartamento de 70 m², cozinha e banheiro, orçamento de R$ 40 mil.', [{ name: 'Planta baixa.pdf', size: 2097152 }, { name: 'Orçamentos.xlsx', size: 40960 }], 150),
  ];
  {
    const fresh = store.get('skynet-projects', null) === null;
    const v = fresh ? 0 : store.get('skynet-demo', 1);
    if (v < 3) {
      if (v < 2) {
        if (fresh) state.projects = DEMO_V1();
        state.projects.push(...DEMO_V2());
      }
      // Versão 3: logos novas e conversas completas no lugar das respostas de uma linha da demo anterior.
      state.projects.forEach(pj => {
        if (DEMO_LOGOS[pj.name] && (!pj.icon || pj.icon.startsWith('data:image/svg+xml'))) pj.icon = DEMO_LOGOS[pj.name];
        if (!DEMO_CHATS[pj.name]) return;
        const old = state.convs.filter(c => c.project === pj.id && /^Combinado\. Vou seguir/.test(c.messages[1]?.text || ''));
        if (!old.length) return;
        state.convs = state.convs.filter(c => !old.includes(c));
        demoChats(pj.id, pj.name, Math.max(1, Math.round((now - pj.updated) / 36e5)));
      });
      store.set('skynet-projects', state.projects);
      store.set('skynet-demo', 3);
      saveConvs();
    }
  }
  const current = () => state.convs.find(c => c.id === state.currentId) || null;

  /* ---------------- Elementos ---------------- */
  const app = $('#app');
  const stage = $('#stage');
  const scroller = $('#scroller');
  const messagesEl = $('#messages');
  const input = $('#input');
  const composer = $('#composer');
  const historyEl = $('#history');
  const popover = $('#popover');
  const modalLayer = $('#modalLayer');
  const modal = $('#modal');

  /* ---------------- Cor de destaque ---------------- */
  // Seis cores prontas. As variáveis de CSS de cada uma ficam no styles.css ([data-accent]); aqui ficam os tons das animações.
  const ACCENTS = {
    roxo: { name: 'Roxo', solid: '#7c3aed', mid: '#a78bfa', pale: '#ddd6fe', deep: '#1c0a44', shade: '#3b1d78' },
    azul: { name: 'Azul', solid: '#2563eb', mid: '#60a5fa', pale: '#bfdbfe', deep: '#0a1a40', shade: '#1e3a8a' },
    ciano: { name: 'Ciano', solid: '#0d9488', mid: '#2dd4bf', pale: '#99f6e4', deep: '#042f2c', shade: '#115e59' },
    verde: { name: 'Verde', solid: '#16a34a', mid: '#4ade80', pale: '#bbf7d0', deep: '#052e16', shade: '#166534' },
    laranja: { name: 'Laranja', solid: '#ea580c', mid: '#fb923c', pale: '#fed7aa', deep: '#3a1405', shade: '#9a3412' },
    rosa: { name: 'Rosa', solid: '#db2777', mid: '#f472b6', pale: '#fbcfe8', deep: '#3d0a24', shade: '#9d174d' },
    vermelho: { name: 'Vermelho', solid: '#dc2626', mid: '#f87171', pale: '#fecaca', deep: '#3b0909', shade: '#991b1b' },
  };
  const accentKey = () => ACCENTS[state.prefs.accent] ? state.prefs.accent : 'roxo';
  const currentAccent = () => ACCENTS[accentKey()];
  function applyAccent(key) {
    state.prefs.accent = ACCENTS[key] ? key : 'roxo';
    store.set('skynet-prefs', state.prefs);
    if (state.prefs.accent === 'roxo') delete document.documentElement.dataset.accent;
    else document.documentElement.dataset.accent = state.prefs.accent;
  }

  /* ---------------- Tema ---------------- */
  const THEME_BG = { light: '#ffffff', dark: '#0b0b0c', system: '#020a04' };
  const getTheme = () => document.documentElement.dataset.theme;

  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    document.documentElement.style.background = THEME_BG[t];
    $('meta[name="theme-color"]').setAttribute('content', THEME_BG[t]);
    $$('[data-theme-set]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.themeSet === t)));
    updatePlaceholder();
  }

  function setTheme(t) {
    if (t === getTheme()) return;
    try { localStorage.setItem('skynet-theme', t); } catch (e) {}
    if (t === 'system' && !reduced) boot(() => applyTheme(t));
    else applyTheme(t);
  }

  const BOOT = [
    'SKYNET SYSTEMS  BIOS v4.5',
    '(C) 1984-2026 SKYNETchat',
    '',
    'REDE NEURAL ........ 4.5            OK',
    'MEMÓRIA ............ 640K CONVERSAS OK',
    'IDIOMA ............. PT-BR          OK',
    'CONEXÃO ............ SATÉLITE       OK',
    '',
    'INICIANDO INTERFACE',
  ];
  let booting = false;
  async function boot(done) {
    if (booting) return;
    booting = true;
    const el = $('#boot');
    const pre = $('#bootText');
    pre.textContent = '';
    el.hidden = false;
    el.classList.remove('is-out');
    let skip = false;
    el.onclick = () => { skip = true; };
    for (const line of BOOT) {
      if (skip) break;
      pre.textContent += line + '\n';
      await wait(line ? 95 : 40);
    }
    if (!skip) { pre.textContent += '█'; await wait(320); }
    done();
    app.classList.remove('crt-on');
    void app.offsetWidth;
    app.classList.add('crt-on');
    el.classList.add('is-out');
    await wait(340);
    el.hidden = true;
    booting = false;
    setTimeout(() => app.classList.remove('crt-on'), 600);
  }

  /* ---------------- Saudação e placeholder ---------------- */
  function greet() {
    const h = new Date().getHours();
    const g = h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite';
    const name = state.prefs.name || (state.user && state.user.first) || '';
    $('#greeting').textContent = name ? `${g}, ${name.split(' ')[0]}.` : `${g}.`;
  }

  function updatePlaceholder() {
    const retro = getTheme() === 'system';
    const a = agentById(state.agent);
    const s = sessionById(state.session);
    const p = state.mode === 'imagens' ? 'Descreva a imagem que você quer criar'
      : a ? `Mensagem para ${a.name}`
      : s ? `Mensagem para ${s.name}`
      : retro ? 'Digite um comando' : (stage.classList.contains('is-empty') ? 'Pergunte qualquer coisa' : 'Responder ao SKYNETchat');
    input.placeholder = p;
  }

  /* ---------------- Sugestões ---------------- */
  const IMAGE_STARTERS = [
    ['Logo minimalista', 'Crie um logo minimalista para [nome do negócio], em tons terrosos, fundo branco.'],
    ['Foto de produto', 'Foto de produto de [produto] em fundo claro, luz suave de estúdio, sombra leve.'],
    ['Ilustração em aquarela', 'Ilustração em aquarela de [cena], cores suaves e muito espaço em branco.'],
  ];
  const SESSION_STARTERS = [
    ['Dividir as tarefas', 'Divida as tarefas deste projeto entre as pessoas do grupo: '],
    ['Fazer uma votação', 'Monte uma votação rápida para o grupo decidir '],
    ['Resumir para quem chegou', 'Resuma o que já foi decidido nesta conversa para quem acabou de entrar.'],
  ];

  function renderSuggestions() {
    const a = agentById(state.agent);
    const starters = a ? a.starters : state.session ? SESSION_STARTERS : state.mode === 'imagens' ? IMAGE_STARTERS : null;
    $('#suggestions').innerHTML = starters
      ? starters.map(([label, prompt]) => `<button class="sugg" data-say="${esc(prompt)}">${icon('i-arrow')}<span>${label}</span></button>`).join('')
      : SUGGESTIONS.map((s, i) => `<button class="sugg" data-sugg="${i}">${icon(s.icon)}<span>${s.label}</span></button>`).join('');
  }

  /* ---------------- Conversas em grupo ---------------- */
  const SESSION_MAX = 10;
  const GUESTS = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabi', 'Heitor', 'Iara', 'João'];
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const sessionById = id => state.sessions.find(s => s.id === id) || null;
  const saveSessions = () => store.set('skynet-sessions', state.sessions);
  const newCode = () => 'SKY-' + Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  function normCode(v) {
    const c = v.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const body = c.length === 7 && c.startsWith('SKY') ? c.slice(3) : c;
    return /^[A-Z0-9]{4}$/.test(body) ? 'SKY-' + body : null;
  }
  function ago(ts) {
    const m = Math.round((Date.now() - ts) / 6e4);
    if (m < 1) return 'agora';
    if (m < 60) return `há ${m} min`;
    if (m < 1440) return `há ${Math.round(m / 60)} h`;
    const d = Math.round(m / 1440);
    return d === 1 ? 'ontem' : `há ${d} dias`;
  }
  function peopleStack(s, cls = '') {
    const face = p => p === 'Você' ? icon('i-user') : esc(p[0]);
    return `<span class="stack${cls ? ' ' + cls : ''}">${s.people.slice(0, 3).map(p => `<i>${face(p)}</i>`).join('')}${s.people.length > 3 ? `<i class="more">+${s.people.length - 3}</i>` : ''}</span>`;
  }
  function sessionRows() {
    if (!state.sessions.length) return '<p class="pr-empty">Nenhuma sessão aberta ainda. Crie uma acima.</p>';
    return [...state.sessions].sort((a, b) => b.updated - a.updated).map(s => {
      const full = s.people.length >= s.max;
      return `<button class="gs-row" data-session="${s.id}">${peopleStack(s)}
        <span class="gs-txt"><b>${esc(s.name)}</b><span>${s.code} · ${s.people.length} de ${s.max} pessoas · ${ago(s.updated)}</span></span>
        ${full ? '<em class="tag">Cheia</em>' : s.host ? '<em class="tag">Você criou</em>' : ''}${icon('i-chev')}</button>`;
    }).join('');
  }

  function enterSession(id) {
    const s = sessionById(id);
    if (!s) return;
    closeModal();
    s.updated = Date.now();
    saveSessions();
    const conv = state.convs.filter(c => c.session === id).sort((a, b) => b.updated - a.updated)[0];
    if (conv) openConv(conv.id);
    else { newChat(); setSession(id); }
  }

  // Sem back-end, entrar com um código desconhecido simula uma sala com outras pessoas já dentro.
  function joinSession(code) {
    let s = state.sessions.find(x => x.code === code);
    if (!s) {
      const names = [...GUESTS].sort(() => Math.random() - .5).slice(0, 2 + Math.floor(Math.random() * 4));
      s = { id: uid(), name: `Sessão de ${names[0]}`, code, people: [...names, 'Você'], max: SESSION_MAX, host: false, updated: Date.now() };
      state.sessions.unshift(s);
    } else if (!s.people.includes('Você')) {
      if (s.people.length >= s.max) return `Esta sessão está cheia: ${s.max} de ${s.max} pessoas.`;
      s.people.push('Você');
    }
    saveSessions();
    enterSession(s.id);
    return '';
  }

  /* ---------------- Agentes ---------------- */
  // Agente, sessão em grupo e modo Imagens são exclusivos: entrar num sai dos outros.
  function setAgent(id) {
    state.agent = id;
    if (id) { state.session = null; if (state.mode) setMode(state.mode); }
    renderContext();
  }

  function setSession(id) {
    state.session = id;
    if (id) { state.agent = null; if (state.mode) setMode(state.mode); }
    renderContext();
  }

  function renderContext() {
    const a = agentById(state.agent);
    const s = sessionById(state.session);
    const img = state.mode === 'imagens';
    $('#hero').classList.toggle('has-alt', !!(a || s || img));
    $('#heroAlt').innerHTML = a ? `${agentAvatar(a, 'is-alive')}<h1>${a.name}</h1><p>${a.desc}</p>`
      : s ? `${peopleStack(s, 'stack-lg')}<h1>${esc(s.name)}</h1><p>${s.people.length} de ${s.max} pessoas na sala. Código <button class="code-chip" data-action="copy-session" data-code="${s.code}">${s.code}${icon('i-copy')}</button></p>`
      : img ? '<canvas class="px-scene" id="pxScene" aria-hidden="true"></canvas><h1>Imagens</h1><p>Descreva o que você imagina. O SKYNETchat cria quatro variações.</p>'
      : '';
    if (img) pixelScene($('#pxScene'));
    $$('[data-modal="grupo"]').forEach(b => b.classList.toggle('is-active', !!s));
    renderSuggestions();
    renderChips();
    updatePlaceholder();
  }

  function startAgent(id) {
    closeModal();
    newChat();
    setAgent(id);
  }

  const agentRow = (a, k) => `<button class="ag-row${a.id === state.agent ? ' is-on' : ''}" data-agent="${a.id}" style="--k:${k}">${agentAvatar(a)}<span class="ag-txt"><span class="ag-name"><b>${a.name}</b>${a.tag ? `<em class="tag${a.tag === 'PRO' ? ' tag-accent' : ''}">${a.tag}</em>` : ''}</span><span class="ag-desc">${a.desc}</span></span></button>`;
  function agentRows(q) {
    const n = norm(q.trim());
    if (n) {
      const list = AGENT_LIST.filter(a => norm(`${a.name} ${a.desc} ${a.group}`).includes(n));
      return list.length ? `<div class="ag-grid">${list.map(agentRow).join('')}</div>` : '<p class="pr-empty">Nenhum agente com esse termo. Tente outra palavra.</p>';
    }
    return AG_GROUPS.map(g => {
      const list = AGENT_LIST.filter(a => a.group === g);
      if (!list.length) return '';
      return `<div class="ag-sec"><div class="ag-label">${g} <span>${list.length}</span></div><div class="ag-grid">${list.map(agentRow).join('')}</div></div>`;
    }).join('');
  }

  function agentReply(a, text) {
    const q = text.length > 90 ? text.slice(0, 90).trim() + '…' : text;
    return `**${a.name} aqui.** Entendi o pedido: **${q.replace(/\*/g, '')}**

Esta é a prévia da interface, então ainda não estou ligado ao modelo. Quando o back-end entrar, eu respondo aqui do meu jeito:

- ${a.skills[0]}
- ${a.skills[1]}
- ${a.skills[2]}

Enquanto isso, teste os atalhos da tela inicial ou escolha outro agente na barra lateral.`;
  }

  /* ---------------- Modelo ---------------- */
  function renderModel() {
    const m = MODELS.find(x => x.id === state.model) || MODELS[0];
    $('#modelSub').textContent = m.sub;
    $('#effortName').textContent = m.sub;
    syncEffort();
  }

  function setModel(id, quiet) {
    const m = MODELS.find(x => x.id === id);
    if (!m) return false;
    if (m.pro && !isPro()) { openModal('pro', 'model'); return false; }
    state.model = id;
    store.set('skynet-model', id);
    renderModel();
    if (!quiet) toast(`Usando SKYNETchat 4.5 ${m.sub}`);
    return true;
  }

  /* Seletor de esforço no compositor: um slider com uma parada por modelo */
  const modelIndex = () => Math.max(0, MODELS.findIndex(m => m.id === state.model));
  function effortHTML() {
    const i = modelIndex();
    const last = MODELS.length - 1;
    return `<div class="eff-head">
        <button class="eff-title" data-action="effort-models"><span>4.5</span><b id="effName">${MODELS[i].sub}</b>${icon('i-chev', 'i i-sm')}</button>
        <button class="icon-btn eff-reset" data-action="effort-reset" data-tip="Voltar para o Rápido" aria-label="Voltar para o Rápido">${icon('i-redo')}</button>
      </div>
      <div class="eff-track" id="effTrack" role="slider" tabindex="0" aria-label="Esforço de raciocínio" aria-valuemin="0" aria-valuemax="${last}" aria-valuenow="${i}" aria-valuetext="${MODELS[i].sub}" style="--v:${i / last}">
        <span class="eff-fill"></span>${MODELS.map((_, k) => `<i class="eff-dot${k <= i ? ' on' : ''}" data-p="${k / last}" style="--p:${k / last}"></i>`).join('')}<span class="eff-thumb"></span>
      </div>
      <div class="eff-scale">${MODELS.map((x, k) => `<span class="${k === i ? 'is-on' : ''}">${x.sub}${x.pro && !isPro() ? icon('i-lock', 'i i-xs') : ''}</span>`).join('')}</div>`;
  }

  function paintEffort(v) {
    const tr = $('#effTrack');
    tr.style.setProperty('--v', v);
    $$('.eff-dot', tr).forEach(d => d.classList.toggle('on', +d.dataset.p <= v + .001));
  }

  function syncEffort() {
    const tr = $('#effTrack');
    if (!tr) return;
    const i = modelIndex();
    paintEffort(i / (MODELS.length - 1));
    $('#effName').textContent = MODELS[i].sub;
    $$('.eff-scale span').forEach((s, k) => s.classList.toggle('is-on', k === i));
    tr.setAttribute('aria-valuenow', i);
    tr.setAttribute('aria-valuetext', MODELS[i].sub);
  }

  function effortModelsHTML() {
    return `<div class="eff-models" role="listbox" aria-label="Modelo">${MODELS.map(m => `<button class="pop-item${m.id === state.model ? ' is-on' : ''}" role="option" aria-selected="${m.id === state.model}" data-eff-model="${m.id}">
        <span class="grow">SKYNETchat 4.5 ${m.sub}</span>
        ${m.pro && !isPro() ? '<em class="tag tag-accent">PRO</em>' : icon('i-check', 'i check')}
      </button>`).join('')}</div>`;
  }

  // Troca o conteúdo do card: 'models' mostra a lista no lugar do slider; 'slider' volta.
  function effortView(view) {
    popover.innerHTML = `<div class="eff-view${view === 'models' ? '' : ' is-back'}">${view === 'models' ? effortModelsHTML() : effortHTML()}</div>`;
    if (view !== 'models') bindEffortSlider();
    placePop();
  }

  function effortMenu(anchor) {
    // Conversa nova: o compositor está no meio da tela e o slider abre para baixo. Com mensagens, ele fica no rodapé e abre para cima.
    openPop(anchor, effortHTML(), { place: stage.classList.contains('is-empty') ? 'below' : 'above', align: 'end', cls: 'pop-effort' });
    bindEffortSlider();
  }

  function bindEffortSlider() {
    const tr = $('#effTrack');
    if (!tr) return;
    const last = MODELS.length - 1;
    const fill = $('.eff-fill', tr);
    const valueAt = x => { const r = tr.getBoundingClientRect(); return Math.min(1, Math.max(0, (x - r.left - 16) / (r.width - 32))); };
    const pick = i => { if (!setModel(MODELS[i].id, true)) syncEffort(); };
    // Pixels no preenchimento enquanto o slider está aberto: quase nada no começo, cada vez mais do meio para a frente,
    // com um rastro atrás do botão. Arrastando, eles ficam mais fortes; soltando, continuam.
    const shade = (x, y, w, h, t, rnd) => {
      const W = tr.clientWidth - 6;
      const thumb = 13 + (W - 26) * +tr.style.getPropertyValue('--v');
      const ramp = Math.min(1, Math.max(0, (x / W - .18) / .6));
      const trail = Math.exp(-(((thumb - x) / 40) ** 2));
      const boost = tr.classList.contains('is-drag') ? 1.45 : 1.15;
      return boost * (ramp * (.32 + .9 * sparkle(t * 1.8, rnd)) + trail * (.4 + .6 * rnd));
    };
    fill.style.setProperty('--tw', tr.clientWidth - 6 + 'px');
    pixelFx(fill, shade);
    const endDrag = () => tr.classList.remove('is-drag');
    tr.addEventListener('pointerdown', e => {
      tr.setPointerCapture(e.pointerId);
      tr.classList.add('is-drag');
      paintEffort(valueAt(e.clientX));
    });
    tr.addEventListener('pointermove', e => { if (tr.classList.contains('is-drag')) paintEffort(valueAt(e.clientX)); });
    tr.addEventListener('pointerup', e => {
      if (!tr.classList.contains('is-drag')) return;
      endDrag();
      pick(Math.round(valueAt(e.clientX) * last));
    });
    tr.addEventListener('pointercancel', () => { endDrag(); syncEffort(); });
    tr.addEventListener('keydown', e => {
      const i = modelIndex();
      const to = { ArrowLeft: i - 1, ArrowDown: i - 1, ArrowRight: i + 1, ArrowUp: i + 1, Home: 0, End: last }[e.key];
      if (to == null) return;
      e.preventDefault();
      if (to >= 0 && to <= last && to !== i) pick(to);
    });
  }

  /* ---------------- Histórico ---------------- */
  function groupLabel(ts) {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const t = d0.getTime();
    if (ts >= t) return 'Hoje';
    if (ts >= t - DAY) return 'Ontem';
    if (ts >= t - 7 * DAY) return 'Últimos 7 dias';
    if (ts >= t - 30 * DAY) return 'Últimos 30 dias';
    return 'Mais antigas';
  }

  function renderHistory() {
    const note = state.prefs.noHistory ? `<p class="h-note">${icon('i-eyeoff')}<span>Histórico desligado. Novas conversas não ficam salvas.</span></p>` : '';
    const sorted = state.convs.filter(c => !c.temp && !c.project).sort((a, b) => b.updated - a.updated);
    if (!sorted.length) { historyEl.innerHTML = note || '<p class="h-empty">Suas conversas aparecem aqui.</p>'; return; }
    const groups = new Map();
    sorted.forEach(c => { const g = groupLabel(c.updated); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(c); });
    let html = '';
    groups.forEach((list, label) => {
      html += `<div class="h-group"><div class="h-label">${label}</div>`;
      html += list.map(c => `<div class="h-item${c.id === state.currentId ? ' is-current' : ''}" data-conv="${c.id}">
          <button class="h-title" data-open="${c.id}" title="${esc(c.title)}">${agentById(c.agent) ? agentAvatar(agentById(c.agent)) : c.session ? icon('i-group', 'i h-ico') : ''}${esc(c.title)}</button>
          <button class="h-more" data-conv-menu="${c.id}" aria-label="Opções da conversa">${icon('i-dots')}</button>
        </div>`).join('');
      html += '</div>';
    });
    historyEl.innerHTML = note + html;
  }

  function renderTemp() {
    $('#tempPill').hidden = !state.prefs.noHistory;
    renderHistory();
  }

  /* ---------------- Markdown mínimo ---------------- */
  function inline(s) {
    s = esc(s);
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
    return s.replace(/\u0000(\d+)\u0000/g, (m, n) => `<code>${codes[n]}</code>`);
  }

  const KW = new Set('def return import from for in if else elif while with as class try except pass not and or None True False const let var function await async new of print'.split(' '));
  function highlight(code) {
    const re = /(#[^\n]*|\/\/[^\n]*)|(f?"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b/g;
    let out = '', last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      if (m[1]) out += `<span class="tk-c">${esc(m[1])}</span>`;
      else if (m[2]) out += `<span class="tk-s">${esc(m[2])}</span>`;
      else if (m[3]) out += `<span class="tk-n">${m[3]}</span>`;
      else if (KW.has(m[4])) out += `<span class="tk-k">${m[4]}</span>`;
      else if (code[re.lastIndex] === '(') out += `<span class="tk-f">${m[4]}</span>`;
      else out += m[4];
      last = re.lastIndex;
    }
    return out + esc(code.slice(last));
  }

  function codeBlock(code, lang) {
    return `<div class="codeblock"><div class="cb-head"><span>${esc(lang || 'código')}</span>
      <button class="cb-copy" data-action="copy-code">${icon('i-copy')}<span>Copiar</span></button></div>
      <pre><code>${highlight(code)}</code></pre></div>`;
  }

  function md(src) {
    const lines = src.split('\n');
    let html = '', para = [], i = 0;
    const flush = () => { if (para.length) { html += `<p>${para.map(inline).join('<br>')}</p>`; para = []; } };
    while (i < lines.length) {
      const line = lines[i];
      const fence = line.match(/^```(\w*)/);
      if (fence) {
        flush();
        const buf = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
        i++;
        html += codeBlock(buf.join('\n'), fence[1]);
        continue;
      }
      const h = line.match(/^(#{1,3})\s+(.*)/);
      if (h) { flush(); const l = h[1].length + 1; html += `<h${l}>${inline(h[2])}</h${l}>`; i++; continue; }
      if (/^\s*[-*]\s/.test(line)) {
        flush();
        let items = '';
        while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) items += `<li>${inline(lines[i++].replace(/^\s*[-*]\s/, ''))}</li>`;
        html += `<ul>${items}</ul>`;
        continue;
      }
      if (/^\s*\d+\.\s/.test(line)) {
        flush();
        const start = parseInt(line, 10);
        let items = '';
        while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) items += `<li>${inline(lines[i++].replace(/^\s*\d+\.\s/, ''))}</li>`;
        html += `<ol${start !== 1 ? ` start="${start}"` : ''}>${items}</ol>`;
        continue;
      }
      if (/^>\s?/.test(line)) {
        flush();
        const q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''));
        html += `<blockquote>${inline(q.join(' '))}</blockquote>`;
        continue;
      }
      if (!line.trim()) { flush(); i++; continue; }
      para.push(line);
      i++;
    }
    flush();
    return html;
  }

  // Fecha marcações abertas no meio do streaming para não piscar asterisco.
  function tidy(partial) {
    const fences = (partial.match(/^```/gm) || []).length;
    if (fences % 2) return partial;
    if ((partial.match(/\*\*/g) || []).length % 2) partial += '**';
    if ((partial.replace(/```/g, '').match(/`/g) || []).length % 2) partial += '`';
    return partial;
  }

  /* ---------------- Mensagens ---------------- */
  function hideEmpty() {
    stage.classList.remove('is-empty');
    updatePlaceholder();
  }
  function showEmpty() {
    stage.classList.add('is-empty');
    // O S se desenha e a saudação sobe a cada conversa nova.
    [$('#hero'), $('.mark-hero')].forEach(el => { el.classList.remove('is-intro'); void el.offsetWidth; el.classList.add('is-intro'); });
    messagesEl.innerHTML = '';
    greet();
    updatePlaceholder();
    $('#toBottom').classList.remove('is-on');
  }

  function fileChip(name) {
    return `<span class="chip">${icon('i-doc')}<span>${esc(name)}</span></span>`;
  }

  function userEl(msg) {
    const el = document.createElement('div');
    el.className = 'msg user';
    el.innerHTML = `${msg.files && msg.files.length ? `<div class="msg-files">${msg.files.map(fileChip).join('')}</div>` : ''}
      <div class="bubble">${esc(msg.text)}</div>
      <div class="msg-actions">
        <button class="act" data-action="copy-msg" data-tip="Copiar" aria-label="Copiar">${icon('i-copy')}</button>
        <button class="act" data-action="edit-msg" data-tip="Editar" aria-label="Editar">${icon('i-pen')}</button>
      </div>`;
    el._msg = msg;
    return el;
  }

  function aiShell(modelSub, agent) {
    const el = document.createElement('div');
    el.className = 'msg ai';
    el.innerHTML = `<div class="ai-head">${agent
        ? `${agentAvatar(agent)}<span class="ai-name">${agent.name}</span><span class="ai-model">Agente</span>`
        : `<span class="mark" data-mark></span><span class="ai-name">SKYNETchat</span><span class="ai-model">4.5 ${esc(modelSub)}</span>`}</div>
      <div class="ai-pre"></div><div class="md"></div>`;
    paintMarks(el);
    return el;
  }

  function aiActions() {
    return `<div class="msg-actions">
      <button class="act" data-action="copy-msg" data-tip="Copiar" aria-label="Copiar">${icon('i-copy')}</button>
      <button class="act" data-action="speak" data-tip="Ouvir" aria-label="Ouvir">${icon('i-speaker')}</button>
      <button class="act" data-action="like" data-tip="Boa resposta" aria-label="Boa resposta">${icon('i-like')}</button>
      <button class="act" data-action="dislike" data-tip="Resposta ruim" aria-label="Resposta ruim">${icon('i-dislike')}</button>
      <button class="act" data-action="regen" data-tip="Gerar de novo" aria-label="Gerar de novo">${icon('i-redo')}</button>
    </div>`;
  }

  function thinkBlock(secs) {
    return `<button class="think-toggle" data-action="toggle-think" aria-expanded="false">Pensou por ${secs} s ${icon('i-chev')}</button>
      <div class="think-body" hidden>${THINK_STEPS.map(t => `<p>${t}</p>`).join('')}</div>`;
  }
  const THINK_STEPS = ['Entender o que a pessoa quer de verdade.', 'Separar o que é fato do que é opinião.', 'Escolher o formato mais fácil de ler.', 'Conferir números e exemplos antes de responder.'];
  const SOURCES = [['W', 'wikipedia.org'], ['G', 'gov.br'], ['B', 'bbc.com'], ['N', 'nature.com']];
  const sourcesHTML = () => `<div class="sources">${SOURCES.map(([l, d]) => `<span class="src"><b>${l}</b>${d}</span>`).join('')}</div>`;

  function groupHTML(parts) {
    return parts.map((p, i) => `<div class="agent"><div class="agent-head"><span class="agent-dot">${AGENTS[i].n}</span><b>${AGENTS[i].name}</b><span>${AGENTS[i].role}</span></div><div class="md">${md(p)}</div></div>`).join('');
  }
  const imageGrid = () => `<div class="img-grid">${'<div class="img-tile">' + icon('i-image') + '</div>'}${('<div class="img-tile">' + icon('i-image') + '</div>').repeat(3)}</div>`;

  function aiStatic(msg) {
    const el = aiShell(msg.model || 'Rápido', agentById(msg.agent));
    const pre = $('.ai-pre', el);
    const body = $('.md', el);
    if (msg.thought) pre.insertAdjacentHTML('beforeend', thinkBlock(msg.thought));
    if (msg.sources) pre.insertAdjacentHTML('beforeend', sourcesHTML());
    if (msg.kind === 'group') { body.classList.remove('md'); body.innerHTML = groupHTML(msg.parts); }
    else {
      body.innerHTML = md(msg.text);
      if (msg.kind === 'image') body.insertAdjacentHTML('afterend', imageGrid() + '<p class="note">Prévia da interface: as imagens aparecem aqui quando o gerador estiver ligado.</p>');
    }
    if (msg.stopped) el.insertAdjacentHTML('beforeend', '<p class="note">Resposta interrompida.</p>');
    el.insertAdjacentHTML('beforeend', aiActions());
    el._msg = msg;
    return el;
  }

  function renderConversation() {
    const c = current();
    messagesEl.innerHTML = '';
    if (!c || !c.messages.length) { showEmpty(); return; }
    hideEmpty();
    c.messages.forEach(m => messagesEl.appendChild(m.role === 'user' ? userEl(m) : aiStatic(m)));
    messagesEl.querySelectorAll('.msg').forEach(m => { m.style.animation = 'none'; });
    requestAnimationFrame(() => { scroller.scrollTop = scroller.scrollHeight; });
  }

  /* ---------------- Rolagem ---------------- */
  const nearBottom = () => scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 140;
  scroller.addEventListener('scroll', () => {
    state.stick = nearBottom();
    $('#toBottom').classList.toggle('is-on', !state.stick && !stage.classList.contains('is-empty'));
  }, { passive: true });
  const follow = () => { if (state.stick) scroller.scrollTop = scroller.scrollHeight; };

  /* ---------------- Respostas simuladas ---------------- */
  function reply(text) {
    const t = text.toLowerCase();
    const s = SUGGESTIONS.find(x => x.prompt === text);
    if (s) return R[s.key];
    if (/legenda|post|instagram/.test(t)) return R.legenda;
    if (/juros|investi|render/.test(t)) return R.juros;
    if (/python|script|código|codigo|programa/.test(t)) return R.python;
    if (/inglês|ingles|estud/.test(t)) return R.ingles;
    if (/nome|podcast|marca/.test(t)) return R.podcast;
    const q = text.length > 90 ? text.slice(0, 90).trim() + '…' : text;
    return `Entendi o pedido: **${q.replace(/\*/g, '')}**

Esta é a nova interface do SKYNETchat rodando só no front, então ainda não estou ligado ao modelo. Quando o back-end entrar, a resposta de verdade aparece exatamente aqui, com:

- texto em tempo real, palavra por palavra
- código com destaque e botão de copiar
- pesquisa na web com as fontes da resposta
- modo Pensar, que mostra o raciocínio antes de responder

Enquanto isso, teste as sugestões da tela inicial ou troque para o tema **System** na barra lateral.`;
  }

  function streamText(full, el) {
    return new Promise(resolve => {
      let i = 0;
      const caret = '<span class="caret"></span>';
      const tick = () => {
        if (state.abort) { el.innerHTML = md(tidy(full.slice(0, i))); resolve({ ok: false, n: i }); return; }
        i = Math.min(full.length, i + 2 + Math.floor(Math.random() * 5));
        el.innerHTML = md(tidy(full.slice(0, i)));
        const blocks = el.querySelectorAll('p, li, h2, h3, h4, blockquote, pre code');
        (blocks[blocks.length - 1] || el).insertAdjacentHTML('beforeend', caret);
        follow();
        if (i < full.length) setTimeout(tick, 16 + Math.random() * 14);
        else { el.innerHTML = md(full); follow(); resolve({ ok: true, n: i }); }
      };
      tick();
    });
  }

  async function respond(conv, text) {
    state.streaming = true;
    state.abort = false;
    setComposerState();
    const model = MODELS.find(m => m.id === state.model) || MODELS[0];
    const think = state.tools.think || state.model === 'pensar';
    const search = state.tools.search;
    const mode = state.mode;
    const agent = agentById(state.agent);
    const msg = { role: 'ai', model: model.sub };
    if (agent) msg.agent = agent.id;
    const el = aiShell(model.sub, agent);
    const mark = $('.ai-head .mark, .ai-head .ag-av', el);
    const pre = $('.ai-pre', el);
    const body = $('.md', el);
    mark.classList.add('is-busy');
    messagesEl.appendChild(el);
    state.stick = true;
    follow();

    if (think && !state.abort) {
      pre.innerHTML = '<div class="status"><span class="shimmer">Pensando</span></div>';
      const t0 = Date.now();
      await wait(1500 + Math.random() * 1200);
      msg.thought = Math.max(1, Math.round((Date.now() - t0) / 1000));
      pre.innerHTML = thinkBlock(msg.thought);
    }
    if (search && !state.abort) {
      pre.insertAdjacentHTML('beforeend', '<div class="status" data-searching><span class="shimmer">Pesquisando na web</span></div>');
      follow();
      await wait(1300);
      $('[data-searching]', pre)?.remove();
      pre.insertAdjacentHTML('beforeend', sourcesHTML());
      msg.sources = true;
    }
    if (!think && !search) await wait(380);

    let finished = true;
    if (mode === 'imagens') {
      msg.kind = 'image';
      msg.text = `Criando 4 variações para **${text.slice(0, 80).replace(/\*/g, '')}**.`;
      finished = (await streamText(msg.text, body)).ok;
      body.insertAdjacentHTML('afterend', imageGrid() + '<p class="note">Prévia da interface: as imagens aparecem aqui quando o gerador estiver ligado.</p>');
      follow();
    } else {
      msg.text = agent ? agentReply(agent, text) : reply(text);
      const r = await streamText(msg.text, body);
      finished = r.ok;
      if (!r.ok) msg.text = msg.text.slice(0, r.n);
    }

    mark.classList.remove('is-busy');
    if (!finished) { msg.stopped = true; el.insertAdjacentHTML('beforeend', '<p class="note">Resposta interrompida.</p>'); }
    el.insertAdjacentHTML('beforeend', aiActions());
    el._msg = msg;
    conv.messages.push(msg);
    conv.updated = Date.now();
    saveConvs();
    renderHistory();
    state.streaming = false;
    state.abort = false;
    setComposerState();
    follow();
  }

  async function send(text) {
    text = (text || '').trim();
    if (state.streaming || (!text && !state.files.length)) return;
    if (!text) text = 'Analise o arquivo anexado.';
    if (!isPro()) {
      if (state.usage.day !== today()) state.usage = { day: today(), n: 0 };
      if (state.usage.n >= FREE_LIMIT) { openModal('pro', 'limit'); return; }
      state.usage.n++;
      store.set('skynet-usage', state.usage);
      renderUsage();
    }
    let conv = current();
    if (!conv) {
      conv = { id: uid(), title: text.replace(/\s+/g, ' ').slice(0, 48), updated: Date.now(), messages: [] };
      if (state.agent) conv.agent = state.agent;
      if (state.session) conv.session = state.session;
      if (state.project) { conv.project = state.project; touchProject(projectById(state.project)); }
      if (state.prefs.noHistory) conv.temp = true;
      state.convs.push(conv);
      state.currentId = conv.id;
    }
    hideEmpty();
    const msg = { role: 'user', text, files: state.files.map(f => f.name) };
    conv.messages.push(msg);
    conv.updated = Date.now();
    messagesEl.appendChild(userEl(msg));
    input.value = '';
    state.files = [];
    renderChips();
    autosize();
    saveConvs();
    renderHistory();
    state.stick = true;
    follow();
    await respond(conv, text);
  }

  function newChat() {
    if (state.streaming) state.abort = true;
    dropTemp();
    showView('chat');
    state.currentId = null;
    state.project = null;
    setMode(null);
    state.session = null;
    setAgent(null);
    showEmpty();
    renderHistory();
    closeDrawer();
    input.focus();
  }

  function openConv(id) {
    if (state.streaming) return toast('Espere a resposta terminar ou toque em parar.');
    dropTemp(id);
    showView('chat');
    state.currentId = id;
    state.project = current()?.project || null;
    state.session = current()?.session || null;
    setAgent(current()?.agent || null);
    renderConversation();
    renderHistory();
    closeDrawer();
  }

  /* ---------------- Compositor ---------------- */
  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 220) + 'px';
    setComposerState();
  }

  function setComposerState() {
    const s = state.streaming ? 'streaming' : (input.value.trim() || state.files.length ? 'ready' : 'empty');
    composer.dataset.state = s;
    $('#sendBtn').setAttribute('aria-label', s === 'streaming' ? 'Parar resposta' : s === 'ready' ? 'Enviar' : 'Modo voz');
  }

  function setMode(m) {
    if (m === 'imagens' && state.mode !== m && !isPro()) { openModal('pro', 'imagens'); return; }
    state.mode = state.mode === m ? null : m;
    if (state.mode) state.agent = state.session = null;
    $$('[data-mode]').forEach(b => b.classList.toggle('is-active', b.dataset.mode === state.mode));
    renderContext();
  }

  /* Animação do modo Imagens: pixels saem do ruído e viram uma cena, como uma imagem sendo gerada; a última cena é o S da marca. */
  const SCENE_N = 21;
  const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const hexc = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const SCENES = [
    (x, y) => { // pôr do sol
      const hz = 12 + Math.round(2 * Math.sin(x * .6) + 1.5 * Math.sin(x * .27 + 1));
      if (y >= 16) return (Math.abs(x - 14) < 2 - (y - 16) * .3 && y % 2) ? hexc('#fbcfe8') : mixc(hexc('#4c1d95'), hexc('#2e1065'), (y - 16) / 5);
      if (y >= hz) return hexc(y > hz + 1 ? '#2e1065' : '#3b1d78');
      if (Math.hypot(x - 14, y - 9) < 3.6) return hexc('#fde68a');
      return mixc(hexc('#2a1065'), hexc('#f9a8d4'), y / 13);
    },
    (x, y) => { // noite
      const hz = 15 + Math.round(1.6 * Math.sin(x * .45 + 2));
      if (y >= hz) return hexc(y > hz + 2 ? '#0f0a2e' : '#1e1b4b');
      if (Math.hypot(x - 6, y - 6) < 3 && Math.hypot(x - 7.4, y - 5) >= 2.4) return hexc('#e9d5ff');
      if (pxHash(x, y + 50) > .93) return hexc('#ffffff');
      return mixc(hexc('#0f0a2e'), hexc('#4338ca'), y / hz);
    },
    (x, y) => { // o S da marca
      const c = Math.floor((x - 1) / 4), r = Math.floor((y - 1) / 4);
      const inCell = x >= 1 && y >= 1 && (x - 1) % 4 < 3 && (y - 1) % 4 < 3 && c < 5 && r < 5;
      if (inCell && S_GRID[r][c] === '1') return hexc('#ffffff');
      if (inCell) return hexc('#8b5cf6');
      return mixc(hexc('#6d28d9'), hexc('#3b0f8c'), (x + y) / 40);
    },
  ];
  function pixelScene(cv) {
    const ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const t0 = performance.now();
    const noise = [hexc('#2e1065'), hexc('#7c3aed'), hexc('#c084fc'), hexc('#f0abfc'), hexc('#4338ca')];
    const loop = now => {
      if (!cv.isConnected) return;
      const size = cv.clientWidth;
      if (cv.width !== Math.round(size * dpr)) cv.width = cv.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const t = reduced ? 2.6 : (now - t0) / 1000;
      const k = Math.floor(t / 4.2), lt = t % 4.2;
      const scene = SCENES[k % SCENES.length];
      // 0 a .5 s ruído, até 2,4 s revela, até 3,6 s segura, depois volta ao ruído
      const p = lt < .5 ? 0 : lt < 2.4 ? (lt - .5) / 1.9 : lt < 3.6 ? 1 : 1 - (lt - 3.6) / .6;
      const sys = getTheme() === 'system';
      const cell = size / SCENE_N;
      for (let y = 0; y < SCENE_N; y++) for (let x = 0; x < SCENE_N; x++) {
        const rnd = pxHash(x + k * 31, y);
        let col = p > rnd * .92 ? scene(x, y) : noise[Math.floor(pxHash(x, y + Math.floor(t * 12)) * noise.length)];
        if (sys) { const l = (.3 * col[0] + .59 * col[1] + .11 * col[2]) / 255; col = [l * 60, l * 255, l * 120]; }
        ctx.fillStyle = `rgb(${col.map(Math.round)})`;
        ctx.fillRect(x * cell + .5, y * cell + .5, cell - 1, cell - 1);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function renderChips() {
    let html = '';
    if (state.mode === 'imagens') html += `<span class="chip is-mode">${icon('i-image')}<span>Imagens</span><button type="button" class="chip-x" data-action="clear-mode" aria-label="Sair do modo">${icon('i-x')}</button></span>`;
    const a = agentById(state.agent);
    if (a) html += `<span class="chip">${agentAvatar(a)}<span>${a.name}</span><button type="button" class="chip-x" data-action="clear-agent" aria-label="Sair do agente">${icon('i-x')}</button></span>`;
    const pj = projectById(state.project);
    if (pj) html += `<button type="button" class="chip chip-proj" data-proj="${pj.id}" style="--pc:${pj.color}">${icon('i-folder')}<span>${esc(pj.name)}</span></button>`;
    const s = sessionById(state.session);
    if (s) html += `<span class="chip is-mode">${icon('i-group')}<span>${esc(s.name)}</span><small>${s.people.length}/${s.max}</small><button type="button" class="chip-x" data-action="leave-session" aria-label="Sair da sessão">${icon('i-x')}</button></span>`;
    html += state.files.map((f, i) => `<span class="chip">${icon('i-doc')}<span>${esc(f.name)}</span><small>${fmtSize(f.size)}</small><button type="button" class="chip-x" data-remove-file="${i}" aria-label="Remover">${icon('i-x')}</button></span>`).join('');
    $('#chips').innerHTML = html;
    setComposerState();
  }
  const fmtSize = b => b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1).replace('.', ',')} MB`;

  function addFiles(list) {
    [...list].slice(0, 10).forEach(f => state.files.push({ name: f.name, size: f.size }));
    renderChips();
    input.focus();
  }

  composer.addEventListener('submit', e => {
    e.preventDefault();
    if (state.streaming) { state.abort = true; return; }
    if (composer.dataset.state === 'empty') { openVoice(); return; }
    send(input.value);
  });
  input.addEventListener('input', autosize);
  input.addEventListener('input', updateMention);
  input.addEventListener('click', updateMention);

  /* Menção com @: digitar @ no compositor lista os agentes; escolher um tira o @ do texto e chama o agente para a conversa. */
  let mention = null;
  const mentionOpen = () => !!mention && !popover.hidden && popover.classList.contains('pop-mention');
  function updateMention() {
    const pos = input.selectionStart;
    const m = input.value.slice(0, pos).match(/(^|\s)@([\p{L}\d-]*)$/u);
    const q = m ? norm(m[2]) : '';
    const items = m ? AGENT_LIST.filter(a => norm(a.name).includes(q) || a.id.includes(q)).slice(0, 6) : [];
    if (!items.length) { closeMention(); return; }
    mention = { start: pos - m[2].length - 1, items, index: 0 };
    renderMention();
  }
  function renderMention() {
    const html = `<div class="pop-label">Chamar um agente</div>` + mention.items.map((a, i) => `<button class="pop-item${i === mention.index ? ' is-hl' : ''}" data-mention="${a.id}">${agentAvatar(a)}<span class="grow">${a.name}<small>${a.desc}</small></span></button>`).join('');
    if (mentionOpen()) { popover.innerHTML = html; placePop(); }
    else openPop(composer, html, { place: stage.classList.contains('is-empty') ? 'below' : 'above', cls: 'pop-mention' });
  }
  function closeMention() { if (mentionOpen()) closePop(); mention = null; }
  function pickMention(id) {
    const a = agentById(id);
    const caret = mention.start;
    input.value = input.value.slice(0, caret) + input.value.slice(input.selectionStart);
    closeMention();
    setAgent(id);
    autosize();
    input.focus();
    input.setSelectionRange(caret, caret);
    toast(`${a.name} entrou na conversa.`);
  }
  input.addEventListener('keydown', e => {
    if (mentionOpen()) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        mention.index = (mention.index + (e.key === 'ArrowDown' ? 1 : -1) + mention.items.length) % mention.items.length;
        renderMention();
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pickMention(mention.items[mention.index].id); return; }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMention(); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && state.prefs.enter) {
      e.preventDefault();
      if (!state.streaming) send(input.value);
    }
  });
  ['dragenter', 'dragover'].forEach(ev => document.addEventListener(ev, e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { e.preventDefault(); composer.classList.add('is-drop'); } }));
  ['dragleave', 'drop'].forEach(ev => document.addEventListener(ev, e => {
    if (ev === 'dragleave' && e.relatedTarget) return;
    composer.classList.remove('is-drop');
    if (ev === 'drop' && e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); addFiles(e.dataTransfer.files); }
  }));
  let fileTarget = 'chat';
  $('#fileInput').addEventListener('change', e => {
    const p = fileTarget === 'project' && projectById(state.projectView);
    if (p) {
      p.files = [...(p.files || []), ...[...e.target.files].slice(0, 10).map(f => ({ name: f.name, size: f.size }))];
      touchProject(p);
      openProject(p.id);
    } else addFiles(e.target.files);
    fileTarget = 'chat';
    e.target.value = '';
  });

  /* ---------------- Voz: ditado e modo voz ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  function makeRec(onText, onEnd) {
    const r = new SR();
    r.lang = state.prefs.lang || 'pt-BR';
    r.interimResults = true;
    r.continuous = false;
    r.onresult = e => {
      let t = '';
      for (const res of e.results) t += res[0].transcript;
      onText(t, e.results[e.results.length - 1].isFinal);
    };
    r.onerror = e => { if (e.error === 'not-allowed') toast('Permita o microfone no navegador para usar a voz.'); };
    r.onend = onEnd;
    return r;
  }

  function dictate() {
    const btn = $('#micBtn');
    if (!SR) return toast('Seu navegador não tem ditado. Use o Chrome para testar.');
    if (rec) { rec.stop(); return; }
    const base = input.value ? input.value.replace(/\s*$/, ' ') : '';
    rec = makeRec(t => { input.value = base + t; autosize(); }, () => { rec = null; btn.classList.remove('is-live'); });
    btn.classList.add('is-live');
    try { rec.start(); } catch (e) { rec = null; btn.classList.remove('is-live'); }
  }

  let voiceRec = null;
  function openVoice() {
    const v = $('#voice');
    v.hidden = false;
    v.classList.remove('is-idle');
    orbStart($('#voiceViz'));
    $('#voiceState').textContent = 'Ouvindo';
    $('#voiceHeard').textContent = 'Fale normalmente. Quando terminar, eu respondo.';
    if (!SR) {
      v.classList.add('is-idle');
      $('#voiceState').textContent = 'Voz indisponível';
      $('#voiceHeard').textContent = 'Este navegador não tem reconhecimento de voz. No Chrome funciona.';
      return;
    }
    orbMic();
    let said = '';
    voiceRec = makeRec((t, final) => {
      said = t;
      $('#voiceHeard').textContent = t;
      if (final) $('#voiceState').textContent = 'Entendi';
    }, () => {
      voiceRec = null;
      orb.speaking = false;
      if (said.trim() && !$('#voice').hidden) { closeVoice(); send(said); }
      else if (!$('#voice').hidden) { orbMicStop(); v.classList.add('is-idle'); $('#voiceState').textContent = 'Não ouvi nada'; $('#voiceHeard').textContent = 'Toque em encerrar e tente de novo.'; }
    });
    voiceRec.onspeechstart = () => { orb.speaking = true; };
    voiceRec.onspeechend = () => { orb.speaking = false; };
    try { voiceRec.start(); } catch (e) {}
  }
  function closeVoice() {
    $('#voice').hidden = true;
    orbStop();
    if (voiceRec) { const r = voiceRec; voiceRec = null; r.onend = null; r.abort(); }
  }

  /* ---------------- Orbe da voz ---------------- */
  // Esfera em WebGL: respira sozinha e cresce, acelera e brilha com o volume da fala.
  const ORB_FS = `precision highp float;
uniform vec2 uRes;uniform float uTime,uFlow,uLevel,uEnergy;uniform vec3 uA,uB,uC;
float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n3(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return v;}
void main(){
vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
float L=uLevel,r=length(uv),an=atan(uv.y,uv.x);
float E=uEnergy;
float e=.26+.05*L+(fbm(vec3(cos(an)*1.3,sin(an)*1.3,uTime*.3))-.5)*.03;
float d=r-e;
vec2 p=uv/e;
float z=sqrt(max(0.,1.-dot(p,p)));
vec3 nr=vec3(p,z);
float t=uFlow;
vec3 q=vec3(p*1.4+nr.xy*.35,t);
float w1=fbm(q);
float w2=fbm(q+vec3(w1*2.2,w1*1.6-t*.4,t*.3));
float f=fbm(q*1.25+vec3(w2*2.6,w2*1.9,t*.6));
vec3 col=mix(uA,uB,smoothstep(.3,.72,f));
col=mix(col,uC,smoothstep(.56,.9,w2)*.85);
vec3 lg=normalize(vec3(-.45,.55,.75));
col*=.48+.65*clamp(dot(nr,lg),0.,1.);
col+=pow(1.-z,2.2)*uC*(.4+.8*E);
col+=pow(max(dot(reflect(-lg,nr),vec3(0,0,1)),0.),28.)*.3;
col*=1.+.32*E;
float px=1.5/min(uRes.x,uRes.y);
float inside=1.-smoothstep(-px,px,d);
float fade=1.-smoothstep(.36,.49,r);
float halo=exp(-max(d,0.)*(13.-5.*E))*(.18+.42*E)*(1.-inside)*fade;
gl_FragColor=vec4(col*inside+uB*halo,inside+halo*.85);
}`;
  const hex01 = h => hexc(h).map(v => v / 255);
  // Orbe nas cores do destaque escolhido: tom fundo, cor cheia e tom claro. No System, verde.
  const orbColors = () => {
    if (getTheme() === 'system') return [[.01, .16, .05], [.15, .75, .33], [.76, 1, .83]];
    const a = currentAccent();
    return [hex01(a.shade), hex01(a.solid), hex01(a.pale)];
  };
  const orb = { raf: 0, gl: null, ctx: null, cv: null, u: null, mic: null, level: 0, target: 0, flow: 0, speaking: false, t0: 0, last: 0, vel: 0, energy: 0, peak: .4 };

  function orbStart(host) {
    const cv = document.createElement('canvas');
    host.replaceChildren(cv);
    Object.assign(orb, { cv, level: 0, target: 0, flow: 0, speaking: false, t0: performance.now(), last: performance.now(), vel: 0, energy: 0, peak: .4 });
    orb.gl = orbGL(cv);
    orb.ctx = orb.gl ? null : cv.getContext('2d');
    const loop = now => { orbFrame(now); orb.raf = requestAnimationFrame(loop); };
    orb.raf = requestAnimationFrame(loop);
  }

  function orbGL(cv) {
    const gl = cv.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
    const fs = sh(gl.FRAGMENT_SHADER, ORB_FS);
    if (!vs || !fs) return null;
    const pr = gl.createProgram();
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    orb.u = Object.fromEntries(['uRes', 'uTime', 'uFlow', 'uLevel', 'uEnergy', 'uA', 'uB', 'uC'].map(n => [n, gl.getUniformLocation(pr, n)]));
    const [a, b, c] = orbColors();
    gl.uniform3fv(orb.u.uA, a);
    gl.uniform3fv(orb.u.uB, b);
    gl.uniform3fv(orb.u.uC, c);
    gl.clearColor(0, 0, 0, 0);
    return gl;
  }

  function orbFrame(now) {
    const t = (now - orb.t0) / 1000;
    const dt = Math.min(.05, (now - orb.last) / 1000);
    orb.last = now;
    // Volume em decibéis (de -55 a -18 dB vira 0 a 1), suavizado duas vezes: a orbe incha e desincha, sem tranco.
    const ease = rate => 1 - Math.exp(-dt * rate);
    // A voz mexe na bola inteira, sem deformar: o volume (em dB, com ganho automático para microfone baixo)
    // puxa o tamanho por uma mola macia e alimenta uma energia mais lenta, que acelera o fluxo e acende o brilho.
    let vol = 0;
    if (orb.mic) {
      const b = orb.mic.buf;
      orb.mic.an.getByteTimeDomainData(b);
      let sum = 0;
      for (let i = 0; i < b.length; i++) { const x = (b[i] - 128) / 128; sum += x * x; }
      vol = Math.min(1, Math.max(0, (20 * Math.log10(Math.sqrt(sum / b.length) + 1e-6) + 58) / 40));
    } else if (orb.speaking) vol = .45 + .3 * Math.max(0, Math.sin(t * 6.1) * Math.sin(t * 2.3 + 1));
    orb.peak = Math.max(vol, .35, orb.peak - dt * .08);
    orb.target = Math.min(1, (vol / orb.peak) ** 1.3);
    orb.vel += ((orb.target - orb.level) * 90 - orb.vel * 13) * dt;
    orb.level += orb.vel * dt;
    orb.energy += (orb.target - orb.energy) * ease(orb.target > orb.energy ? 6 : 2.2);
    orb.flow += dt * (.16 + .55 * orb.energy);

    const cv = orb.cv;
    // No System a orbe roda em baixa resolução e é ampliada em pixel, como o resto do terminal.
    const scale = getTheme() === 'system' ? .3 : Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(cv.clientWidth * scale));
    if (cv.width !== w) { cv.width = cv.height = w; orb.gl?.viewport(0, 0, w, w); }
    if (orb.gl) {
      const gl = orb.gl;
      gl.uniform2f(orb.u.uRes, w, w);
      gl.uniform1f(orb.u.uTime, t);
      gl.uniform1f(orb.u.uFlow, orb.flow);
      gl.uniform1f(orb.u.uLevel, Math.max(-.15, Math.min(1.3, orb.level)));
      gl.uniform1f(orb.u.uEnergy, orb.energy);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else if (orb.ctx) {
      const [a, b, c] = orbColors().map(v => `rgb(${v.map(x => Math.round(x * 255))})`);
      const R = w * (.26 + .05 * Math.max(0, orb.level) + .006 * Math.sin(t * 1.6));
      const g = orb.ctx.createRadialGradient(w * .42, w * .38, R * .05, w / 2, w / 2, R);
      g.addColorStop(0, c);
      g.addColorStop(.55, b);
      g.addColorStop(1, a);
      orb.ctx.clearRect(0, 0, w, w);
      orb.ctx.fillStyle = g;
      orb.ctx.beginPath();
      orb.ctx.arc(w / 2, w / 2, R, 0, Math.PI * 2);
      orb.ctx.fill();
    }
  }

  // No celular o reconhecimento de voz disputa o microfone; lá a orbe segue os eventos de fala.
  async function orbMic() {
    if (!matchMedia('(hover: hover)').matches || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if ($('#voice').hidden || orb.mic) { stream.getTracks().forEach(tr => tr.stop()); return; }
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(an);
      orb.mic = { stream, ctx, an, buf: new Uint8Array(an.fftSize) };
    } catch (e) {}
  }

  function orbMicStop() {
    if (!orb.mic) return;
    orb.mic.stream.getTracks().forEach(tr => tr.stop());
    orb.mic.ctx.close();
    orb.mic = null;
  }

  function orbStop() {
    cancelAnimationFrame(orb.raf);
    orbMicStop();
    orb.gl?.getExtension('WEBGL_lose_context')?.loseContext();
    orb.gl = orb.ctx = null;
  }

  function speak(text, btn) {
    if (!('speechSynthesis' in window)) return toast('Seu navegador não lê em voz alta.');
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); $$('.act.is-on[data-action="speak"]').forEach(b => b.classList.remove('is-on')); return; }
    const u = new SpeechSynthesisUtterance(text.replace(/[*#`>]/g, '').replace(/\n+/g, '. '));
    u.lang = 'pt-BR';
    const v = speechSynthesis.getVoices().find(x => x.lang === 'pt-BR');
    if (v) u.voice = v;
    u.onend = () => btn.classList.remove('is-on');
    btn.classList.add('is-on');
    speechSynthesis.speak(u);
  }

  /* ---------------- Popover ---------------- */
  let popAnchor = null;
  let popPlace = { place: 'below', align: 'start' };
  function openPop(anchor, html, { place = 'below', align = 'start', cls = '' } = {}) {
    if (popAnchor === anchor && !popover.hidden) { closePop(); return; }
    closePop();
    popAnchor = anchor;
    popPlace = { place, align };
    popover.className = 'popover ' + cls;
    popover.innerHTML = html;
    popover.hidden = false;
    anchor.setAttribute('aria-expanded', 'true');
    anchor.closest('.h-item')?.classList.add('is-open');
    placePop();
  }
  function placePop() {
    const { place, align } = popPlace;
    const r = popAnchor.getBoundingClientRect();
    const p = popover.getBoundingClientRect();
    let left = align === 'end' ? r.right - p.width : r.left;
    left = Math.max(12, Math.min(left, innerWidth - p.width - 12));
    let top = place === 'above' ? r.top - p.height - 8 : r.bottom + 6;
    if (top + p.height > innerHeight - 12) top = r.top - p.height - 8;
    if (top < 12) top = 12;
    popover.style.left = left + 'px';
    popover.style.top = top + 'px';
  }
  function closePop() {
    if (popover.hidden) return;
    popover.hidden = true;
    if (popAnchor) { popAnchor.setAttribute('aria-expanded', 'false'); popAnchor.closest('.h-item')?.classList.remove('is-open'); }
    popAnchor = null;
  }
  const popItem = (act, ic, label, extra = '') => `<button class="pop-item" data-pop="${act}">${icon(ic)}<span class="grow">${label}</span>${extra}</button>`;

  function modelMenu(anchor) {
    const html = `<div class="pop-label">Modelo</div>` + MODELS.map(m => `<button class="pop-item${m.id === state.model ? ' is-on' : ''}${m.pro && !isPro() ? ' is-locked' : ''}" data-pop="model:${m.id}">
        <span class="grow"><span>${m.name} <b>${m.sub}</b></span><small>${m.desc}</small></span>
        ${m.pro && !isPro() ? '<em class="tag tag-accent">PRO</em>' : icon('i-check', 'i check')}
      </button>`).join('');
    openPop(anchor, html, { cls: 'pop-model' });
  }

  /* ---------------- Planos ---------------- */
  const FREE_LIMIT = 5;
  const isPro = () => state.plan === 'pro' || !!(state.user && state.user.pro);
  const today = () => new Date().toLocaleDateString('sv');
  const freeLeft = () => Math.max(0, FREE_LIMIT - (state.usage.day === today() ? state.usage.n : 0));

  function renderUsage() {
    const el = $('#usage');
    const left = freeLeft();
    el.hidden = isPro() || left > 2;
    if (el.hidden) return;
    el.innerHTML = left === 0 ? `Você usou as ${FREE_LIMIT} mensagens grátis de hoje.<button type="button" data-modal="pro">Assinar o Pro</button>`
      : `${left === 1 ? 'Resta 1 mensagem grátis' : `Restam ${left} mensagens grátis`} hoje.<button type="button" data-modal="pro">Conhecer o Pro</button>`;
  }

  function setPlan(plan) {
    state.plan = plan;
    store.set('skynet-plan', plan);
    if (plan !== 'pro') {
      if (MODELS.find(m => m.id === state.model)?.pro) setModel('rapido', true);
      if (state.mode === 'imagens') setMode('imagens');
    }
    renderAccount();
    renderUsage();
  }

  const PAYWALL = {
    limit: ['Você usou as 5 mensagens de hoje', 'O Free renova amanhã. Com o Pro, você conversa sem limite.'],
    imagens: ['Gerar imagens é do Pro', 'Assine para criar e editar imagens direto no chat.'],
    model: ['O 4.5 Pro é do plano Pro', 'O modelo mais capaz, para trabalho pesado, junto com tudo do Pro.'],
  };
  // Frases curtas de propósito: cada benefício cabe numa linha e o paywall abre sem rolagem.
  const FREE_PERKS = [
    ['i-check', '5 mensagens por dia'],
    ['i-check', 'IA Rápida para o dia a dia'],
    ['i-check', 'Sem cadastro de e-mail'],
    ['i-check', 'Prompts prontos'],
    ['i-check', 'Pesquisa na web e Pensar'],
    ['i-lock', 'Modo sem histórico'],
    ['i-lock', 'Suas conversas não treinam a IA'],
  ];
  const PRO_PERKS = [
    ['i-check', '<b>Mensagens sem limite</b>'],
    ['i-check', '4.5 Pro e modo Pensar'],
    ['i-check', 'Geração de imagens'],
    ['i-check', 'Pesquisa na web ilimitada'],
    ['i-check', 'Leitura de PDF, planilha e foto'],
    ['i-check', 'Grupos com até 10 pessoas'],
    ['i-check', 'Prioridade no horário de pico'],
    ['i-check', 'Suporte prioritário'],
    ['i-check', 'Projetos sem limite'],
    ['i-check', 'Acesso antecipado ao Coder'],
    ['i-lock', 'Conversas criptografadas'],
  ];
  const perkList = list => `<ul class="plan-list">${list.map(([ic, t]) => `<li>${icon(ic)}<span>${t}</span></li>`).join('')}</ul>`;

  function plusMenu(anchor) {
    openPop(anchor,
      popItem('attach', 'i-clip', 'Anexar arquivos') +
      popItem('mode:imagens', 'i-image', 'Criar imagem', state.mode === 'imagens' ? icon('i-check') : isPro() ? '' : '<em class="tag tag-accent">PRO</em>') +
      popItem('grupo', 'i-group', 'Conversa em grupo') +
      popItem('agents', 'i-bot', 'Falar com um agente') +
      '<div class="pop-sep"></div>' +
      popItem('prompts', 'i-book', 'Usar um prompt pronto'),
      { place: 'above' });
  }

  function moreMenu(anchor) {
    openPop(anchor,
      popItem('atualizacoes', 'i-bell', 'Atualizações') +
      popItem('monetize', 'i-coins', 'Monetize com SKYNETchat', '<em class="tag">Novo</em>') +
      popItem('conheca', 'i-info', 'Conheça o SKYNETchat') +
      popItem('suporte', 'i-help', 'Suporte') +
      popItem('settings', 'i-settings', 'Configurações') +
      '<div class="pop-sep"></div>' +
      popItem('instagram', 'i-insta', 'Instagram <small>@skynetchat.ai</small>') +
      popItem('termos', 'i-doc', 'Termos de Serviço') +
      (state.user ? '<div class="pop-sep"></div>' + popItem('logout', 'i-logout', 'Sair') : ''),
      { place: 'above', align: 'end' });
  }

  function convMenu(anchor, id) {
    openPop(anchor, popItem('rename:' + id, 'i-pen', 'Renomear') + popItem('delete:' + id, 'i-trash', 'Excluir'), { align: 'start' });
  }

  function onPop(act) {
    closePop();
    const [k, v] = act.split(':');
    if (k === 'model') setModel(v);
    else if (k === 'attach') { fileTarget = 'chat'; $('#fileInput').click(); }
    else if (k === 'mode') { setMode(v); if (modalLayer.hidden) input.focus(); }
    else if (k === 'instagram') window.open('https://instagram.com/skynetchat.ai', '_blank', 'noopener');
    else if (k === 'termos') toast('Os Termos de Serviço abrem aqui quando o site estiver no ar.');
    else if (k === 'logout') { state.user = null; store.set('skynet-user', null); renderAccount(); greet(); toast('Você saiu da conta.'); }
    else if (k === 'projicon') pickIcon(url => { const p = projectById(v); p.icon = url; touchProject(p); openProject(v); toast('Foto do projeto trocada.'); });
    else if (k === 'projshuffle') { const p = projectById(v); p.seed = Math.floor(Math.random() * 1e9); p.color = pixelIconColor(p.seed); p.icon = null; touchProject(p); openProject(v); }
    else if (k === 'pconvdel') {
      state.convs = state.convs.filter(c => c.id !== v);
      saveConvs();
      openProject(state.projectView);
      toast('Conversa excluída.');
    }
    else if (k === 'projdel') {
      state.projects = state.projects.filter(p => p.id !== v);
      state.convs.forEach(c => { if (c.project === v) delete c.project; });
      saveProjects();
      saveConvs();
      renderHistory();
      openProjects(false);
      toast('Projeto excluído. As conversas foram para o histórico.');
    }
    else if (k === 'rename') renameConv(v);
    else if (k === 'delete') deleteConv(v);
    else openModal(k);
  }

  function renameConv(id) {
    const item = $(`.h-item[data-conv="${id}"]`);
    const c = state.convs.find(x => x.id === id);
    if (!item || !c) return;
    item.innerHTML = `<input class="h-rename" value="${esc(c.title)}" aria-label="Novo nome" />`;
    const inp = $('input', item);
    inp.focus(); inp.select();
    const done = ok => { if (ok && inp.value.trim()) { c.title = inp.value.trim(); saveConvs(); } renderHistory(); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); });
    inp.addEventListener('blur', () => done(true), { once: true });
  }

  function deleteConv(id) {
    state.convs = state.convs.filter(c => c.id !== id);
    saveConvs();
    if (state.currentId === id) newChat(); else renderHistory();
    toast('Conversa excluída.');
  }

  /* ---------------- Modais ---------------- */
  const closeBtn = `<button class="icon-btn m-close" data-action="close-modal" aria-label="Fechar">${icon('i-x')}</button>`;
  const MODALS = {
    login: () => `${closeBtn}<div class="m-body m-center">
      <span class="mark m-mark" data-mark></span>
      <h2 class="m-title">Entre no SKYNETchat</h2>
      <p class="m-sub">Salve suas conversas, continue em qualquer aparelho e desbloqueie o PRO.</p>
      <div class="m-stack">
        <button class="btn btn-outline btn-lg w" data-login="Google">${icon('i-google')}Continuar com Google</button>
        <button class="btn btn-outline btn-lg w" data-login="Apple">${icon('i-apple')}Continuar com Apple</button>
        <button class="btn btn-outline btn-lg w" data-modal="loginCode">${icon('i-lock')}Entrar com código de acesso</button>
        <div class="or">ou</div>
        <form class="m-stack" id="loginForm" style="margin-top:0">
          <label class="field"><span>E-mail</span><input type="email" name="email" required placeholder="voce@email.com" autocomplete="email" /></label>
          <button class="btn btn-primary btn-lg w" type="submit">Continuar com e-mail</button>
        </form>
      </div>
      <p class="m-legal">Ao continuar, você concorda com os <a href="#" data-pop-like="termos">Termos de Serviço</a> e a Política de Privacidade.</p>
    </div>`,

    loginCode: () => `${closeBtn}<div class="m-body m-center code-body">
      <button class="pg-back m-back" data-modal="login">${icon('i-chev')}Voltar</button>
      <span class="mark m-mark is-draw" data-mark data-unlit></span>
      <h2 class="m-title">Entrar com código</h2>
      <p class="m-sub">Digite os 12 dígitos do seu código de acesso.</p>
      <form class="code-form" id="codeForm">
        <div class="otp" id="otp">
          <input class="code-field" id="otpInput" name="code" inputmode="numeric" autocomplete="one-time-code" placeholder="0000-0000-0000" maxlength="14" spellcheck="false" aria-label="Código de acesso de 12 dígitos" />
          <div class="otp-foot"><span class="otp-meta" id="otpMeta">0 de 12 dígitos</span><button type="button" class="btn btn-ghost btn-sm" data-action="otp-paste">${icon('i-copy')}Colar</button></div>
        </div>
        <div class="ts-box" id="tsBox"><span class="ts-wait">Carregando a verificação da Cloudflare</span></div>
        <button class="btn btn-primary btn-lg w" type="submit" id="otpBtn" disabled>Entrar</button>
      </form>
      <p class="m-legal">Não tem um código? <a href="#" data-pop-like="login">Entre com Google, Apple ou e-mail</a>.</p>
    </div>`,

    indique: () => {
      const joined = 1;
      const rungs = [['7 dias'], ['14 dias'], ['21 dias'], ['1 mês']];
      return `${closeBtn}<div class="m-body ref">
      <div class="m-center">
        <span class="mark ref-mark is-draw" data-mark data-unlit></span>
        <h2 class="m-title">Indique e Ganhe</h2>
        <p class="m-sub">Cada amigo que criar conta pelo seu link vale 7 dias de Pro. Com 4 amigos, o mês inteiro é seu.</p>
      </div>
      <div class="ref-card">
        <div class="ref-top"><b>${joined} <small>de 4 amigos</small></b><span>${joined * 7} dias de Pro ganhos</span></div>
        <div class="ladder" style="--f:${joined ? (joined - .5) / 4 : 0}">${rungs.map(([l], i) => `<div class="rung${i < joined ? ' on' : ''}${i === 3 ? ' goal' : ''}"><i>${i < joined || i === 3 ? icon('i-check') : i + 1}</i><span>${l}</span></div>`).join('')}</div>
      </div>
      <label class="field ref-link"><span>Seu link de convite</span>
        <div class="copy-row"><input class="input" readonly value="skynetchat.net/convite/SKY-7Q4M" aria-label="Seu link" /><button type="button" class="btn btn-primary" data-action="copy-invite">${icon('i-copy')}Copiar</button></div>
      </label>
      <div class="ref-share">
        <a class="btn btn-outline" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Tô usando o SKYNETchat, um chat de IA em português. Entra pelo meu link: https://skynetchat.net/convite/SKY-7Q4M')}">${icon('i-whatsapp')}WhatsApp</a>
        <button type="button" class="btn btn-outline" data-action="share-invite">${icon('i-share')}Compartilhar</button>
      </div>
      <ol class="ref-steps">
        <li><span class="n">1</span><b>Mande seu link</b>No WhatsApp, no story ou na bio.</li>
        <li><span class="n">2</span><b>Seu amigo entra</b>Ele cria a conta e manda a primeira mensagem.</li>
        <li><span class="n">3</span><b>Você ganha Pro</b>Os dias entram na hora, sem cartão.</li>
      </ol>
    </div>`;
    },

    pro: reason => {
      const [title, sub] = PAYWALL[reason] || ['Escolha seu plano', 'Comece grátis, sem cadastro. Vá para o Pro quando precisar de mais.'];
      const pro = isPro();
      return `${closeBtn}<div class="m-body pay">
      <div class="m-center">
        <span class="mark m-mark" data-mark></span>
        <h2 class="m-title">${title}</h2>
        <p class="m-sub">${sub}</p>
      </div>
      <div class="seg plan-tabs" role="radiogroup" aria-label="Plano"><button role="radio" data-plan="free" aria-checked="false">Free</button><button role="radio" data-plan="pro" aria-checked="true">Pro</button></div>
      <div class="plans" data-show="pro">
        <div class="plan">
          <div class="plan-top"><b>Free</b></div>
          <div class="price"><strong>R$ 0</strong><span>para sempre</span></div>
          <p class="plan-for">Para experimentar sem compromisso.</p>
          ${pro ? '<button class="btn btn-outline w" data-action="downgrade">Voltar para o Free</button>' : '<button class="btn btn-outline w" disabled>Seu plano atual</button>'}
          ${perkList(FREE_PERKS)}
        </div>
        <div class="plan is-pro">
          <div class="plan-top"><b>Pro</b><em class="tag tag-accent">Mais escolhido</em></div>
          <div class="price"><strong>R$ 59,90</strong><span>por mês</span></div>
          <p class="plan-for">Para usar todo dia, sem limite.</p>
          ${pro ? '<button class="btn btn-accent w" disabled>Seu plano atual</button>' : '<button class="btn btn-accent w" data-action="subscribe">Assinar o Pro</button>'}
          ${perkList(PRO_PERKS)}
        </div>
      </div>
      <p class="m-legal">Cancele quando quiser, sem multa. Pagamento por Pix ou cartão. <a href="#" data-pop-like="indique">Ou ganhe o Pro indicando amigos</a>.</p>
    </div>`;
    },

    monetize: () => `${closeBtn}<div class="m-body">
      <div class="m-icon" style="margin:0 0 16px">${icon('i-coins')}</div>
      <h2 class="m-title">Monetize com SKYNETchat</h2>
      <p class="m-sub">Leve o SKYNETchat para a sua audiência e receba por cada assinatura que vier do seu link.</p>
      <ol class="steps">
        <li><span class="n">1</span><div><b>Crie seu link</b><span>Leva um minuto, direto da sua conta.</span></div></li>
        <li><span class="n">2</span><div><b>Divulgue do seu jeito</b><span>Stories, vídeos, grupos ou na bio.</span></div></li>
        <li><span class="n">3</span><div><b>Acompanhe os ganhos</b><span>Cliques, cadastros e assinaturas num painel só.</span></div></li>
      </ol>
      <div class="m-stack"><button class="btn btn-primary btn-lg w" data-action="monetize-join">Quero participar</button></div>
    </div>`,

    atualizacoes: () => `${closeBtn}<div class="m-body">
      <h2 class="m-title">Atualizações</h2>
      <p class="m-sub">O que mudou no SKYNETchat.</p>
      <div class="updates">
        ${[['i-term', 'Nova interface', 'Novo', 'Visual redesenhado, com os temas Claro, Escuro e System.'],
           ['i-bulb', 'SKYNETchat 4.5', '', 'Respostas mais rápidas e mais precisas em português.'],
           ['i-bot', 'Agentes', 'Novo', '15 especialistas prontos, do Redator ao Concurseiro.'],
           ['i-group', 'Conversas em grupo', 'Novo', 'Até 10 pessoas e o SKYNETchat na mesma conversa, com código de acesso.'],
           ['i-folder', 'Projetos', 'Novo', 'Organize conversas, arquivos e entregas num lugar só.'],
           ['i-image', 'Imagens', 'Beta', 'Gere e explore imagens sem sair do chat.']]
          .map(([ic, t, tag, d]) => `<div class="update"><div class="m-icon">${icon(ic)}</div><div><div class="update-top"><b>${t}</b>${tag ? `<em class="tag">${tag}</em>` : ''}</div><p>${d}</p></div></div>`).join('')}
      </div>
    </div>`,

    conheca: () => `${closeBtn}<div class="m-body">
      <span class="mark m-mark" style="margin:0 0 18px" data-mark></span>
      <h2 class="m-title">Conheça o SKYNETchat</h2>
      <p class="m-sub">Um chat de IA feito para quem fala português. Para escrever, estudar, programar e criar, sem complicação.</p>
      <div class="m-stack" style="gap:16px">
        <div class="feat"><div class="m-icon">${icon('i-unlock')}</div><div><b>Liberdade para perguntar</b><span>Conhecimento sem travas desnecessárias: respostas diretas, sem rodeio e sem sermão.</span></div></div>
        <div class="feat"><div class="m-icon">${icon('i-bulb')}</div><div><b>Rápido ou pensativo</b><span>Resposta na hora no dia a dia, raciocínio com calma quando o problema pede.</span></div></div>
        <div class="feat"><div class="m-icon">${icon('i-group')}</div><div><b>Ferramentas que crescem com você</b><span>Imagens, conversas em grupo, projetos e, em breve, o Coder.</span></div></div>
      </div>
      <div class="m-stack"><button class="btn btn-primary btn-lg w" data-action="start-chat">Começar uma conversa</button></div>
    </div>`,

    suporte: () => `${closeBtn}<div class="m-body">
      <div class="pr-head"><div class="m-icon px-icon"><canvas id="pxSupport" aria-hidden="true"></canvas></div><div><h2 class="m-title">Suporte <span class="sup-sla"><i></i>Responde em até 24 h</span></h2><p class="m-sub">Conta o que aconteceu e a gente responde no seu e-mail.</p></div></div>
      <form class="m-stack sup" id="supportForm">
        <div class="field"><span>Sobre o que é?</span>
          <div class="sup-topics" role="radiogroup" aria-label="Assunto">${SUPPORT_TOPICS.map(([k, ic, l], i) => `<button type="button" role="radio" data-topic="${k}" aria-checked="${i === 0}" class="prompt-tab">${l}</button>`).join('')}</div>
        </div>
        <label class="field"><span>Seu e-mail</span><input type="email" name="email" required placeholder="voce@email.com" autocomplete="email" value="${esc((state.user && state.user.email) || '')}" /></label>
        <label class="field"><span>Mensagem</span><textarea name="msg" id="supMsg" required placeholder="${SUPPORT_TOPICS[0][3]}"></textarea></label>
        <button class="btn btn-primary btn-lg w" type="submit">Enviar mensagem</button>
      </form>
      <div class="ag-label">Respostas rápidas</div>
      <div class="faq">${SUPPORT_FAQ.map(([q, a]) => `<details><summary>${q}${icon('i-chev')}</summary><p>${a}</p></details>`).join('')}</div>
    </div>`,

    prompts: () => `${closeBtn}<div class="m-body">
      <div class="pr-head"><div class="m-icon px-icon"><canvas id="pxPrompt" aria-hidden="true"></canvas></div><div><h2 class="m-title">Prompts</h2><p class="m-sub">Comece com um modelo pronto. Toque para levar ao chat e complete do seu jeito.</p></div></div>
      <div class="pr-tools">
        <label class="pr-search">${icon('i-search')}<input id="promptSearch" placeholder="Buscar entre ${Object.values(PROMPTS).flat().length + state.myPrompts.length} prompts" aria-label="Buscar prompt" autocomplete="off" enterkeyhint="search" /></label>
        <button class="btn btn-outline pr-new" data-action="prompt-new">${icon('i-plus')}<span>Criar prompt</span></button>
      </div>
      <div class="prompt-tabs" role="tablist">${[...Object.keys(PROMPTS), MINE].map(k => `<button class="prompt-tab" role="tab" aria-selected="${k === promptCat}" data-ptab="${k}">${icon(PROMPT_ICONS[k])}<span>${k}</span>${k === MINE && state.myPrompts.length ? `<small>${state.myPrompts.length}</small>` : ''}</button>`).join('')}</div>
      <div class="prompt-list" id="promptList">${promptCards(promptCat)}</div>
    </div>`,

    promptNew: () => `${closeBtn}<div class="m-body">
      <button class="pg-back" data-modal="prompts">${icon('i-chev')}Prompts</button>
      <h2 class="m-title" style="margin-top:12px">Criar prompt</h2>
      <p class="m-sub">Salve um pedido que você repete. Coloque entre colchetes o que muda a cada uso, como [tema] ou [cole o texto].</p>
      <form class="m-stack" id="promptForm" style="margin-top:20px">
        <label class="field"><span>Nome</span><input name="title" placeholder="Ex.: Post para o LinkedIn" maxlength="48" required /></label>
        <label class="field"><span>Prompt</span><textarea name="text" id="pfText" required maxlength="1200" placeholder="Ex.: Escreva um post para o LinkedIn sobre [tema], em primeira pessoa, com no máximo 120 palavras e uma pergunta no fim."></textarea></label>
        <div class="field"><span>Prévia</span><div class="pf-preview" id="pfPreview">${promptPreview('')}</div></div>
        <button class="btn btn-primary btn-lg w" type="submit">Salvar prompt</button>
      </form>
    </div>`,

    agents: () => `${closeBtn}<div class="m-body">
      <div class="pr-head"><div class="m-icon">${icon('i-bot')}</div><div><h2 class="m-title">Agentes</h2><p class="m-sub">Especialistas prontos para um assunto. Escolha um e converse direto com ele.</p></div></div>
      <label class="pr-search">${icon('i-search')}<input id="agentSearch" placeholder="Buscar entre ${AGENT_LIST.length} agentes" aria-label="Buscar agente" autocomplete="off" enterkeyhint="search" /></label>
      <div class="ag-list" id="agentList">${agentRows('')}</div>
    </div>`,

    grupo: () => `${closeBtn}<div class="split"><div class="m-body">
      <div class="pr-head"><div class="m-icon px-icon"><canvas id="pxGroup" aria-hidden="true"></canvas></div><div><h2 class="m-title">Conversas em grupo</h2><p class="m-sub">Até ${SESSION_MAX} pessoas e o SKYNETchat na mesma conversa.</p></div></div>
      <div class="gs-box">
        <div class="seg gs-tabs" role="tablist"><button role="tab" data-gtab="create" aria-checked="true">${icon('i-plus')}Criar sessão</button><button role="tab" data-gtab="join" aria-checked="false">${icon('i-arrow')}Entrar com código</button></div>
        <form class="gs-row-form" id="sessionForm">
          <input class="input" name="name" placeholder="Nome da sessão, ex.: Trabalho de história" maxlength="48" required aria-label="Nome da sessão" />
          <button class="btn btn-primary" type="submit">Criar</button>
        </form>
        <form class="gs-row-form" id="joinForm" hidden>
          <input class="input code-input" name="code" placeholder="Código, ex.: SKY-7Q4M" maxlength="9" autocomplete="off" autocapitalize="characters" spellcheck="false" required aria-label="Código de acesso" />
          <button class="btn btn-primary" type="submit">Entrar</button>
        </form>
        <p class="gs-hint" id="gsHint">Você recebe um código para mandar ao grupo.</p>
      </div>
      <div class="ag-label">Sessões abertas <span>${state.sessions.length}</span></div>
      <div class="gs-list">${sessionRows()}</div>
    </div>
    <aside class="gt-panel"><canvas aria-hidden="true"></canvas><div class="gt-cap" aria-live="polite"></div></aside></div>`,

    lobby: s => `${closeBtn}<div class="m-body m-center">
      ${peopleStack(s, 'stack-lg')}
      <h2 class="m-title">${esc(s.name)}</h2>
      <p class="m-sub">Sessão criada. Mande o código para quem vai participar.</p>
      <div class="gs-code">${s.code}</div>
      <div class="copy-row"><input class="input" readonly value="skynetchat.net/g/${s.code}" aria-label="Link da sessão" /><button class="btn btn-outline" data-action="copy-session" data-code="${s.code}">${icon('i-copy')}Copiar</button></div>
      <div class="seats" aria-label="${s.people.length} de ${s.max} lugares ocupados">${Array.from({ length: s.max }, (_, i) => `<i class="${i < s.people.length ? 'on' : ''}">${i < s.people.length ? icon('i-user') : ''}</i>`).join('')}</div>
      <p class="seats-meta">${s.people.length} de ${s.max} pessoas. Os lugares enchem conforme o pessoal entra.</p>
      <div class="m-stack">
        <button class="btn btn-primary btn-lg w" data-session="${s.id}">Abrir conversa</button>
        <a class="btn btn-ghost w" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`Entra na minha conversa do SKYNETchat: https://skynetchat.net/g/${s.code} (código ${s.code})`)}">${icon('i-whatsapp')}Enviar no WhatsApp</a>
      </div>
    </div>`,

    novoProjeto: () => { newProj = { seed: Math.floor(Math.random() * 1e9), icon: null }; return `${closeBtn}<div class="m-body">
      <div class="pr-head"><div class="m-icon">${icon('i-folder')}</div><div><h2 class="m-title">Novo projeto</h2><p class="m-sub">Um lugar para as conversas, os arquivos e as instruções de um assunto.</p></div></div>
      <form class="m-stack" id="projForm" style="margin-top:22px">
        <label class="field"><span>Nome</span><input name="name" placeholder="Ex.: TCC de Psicologia" required maxlength="60" /></label>
        <label class="field"><span>Instruções <small>opcional</small></span><textarea name="desc" maxlength="600" placeholder="Ex.: siga as normas da ABNT e use linguagem acadêmica."></textarea></label>
        <div class="field"><span>Ícone</span>
          <div class="pj-iconpick"><span class="pj-ico is-lg" id="npIco">${projIconInner(newProj)}</span>
            <div class="pj-iconpick-btns"><button type="button" class="btn btn-outline btn-sm" data-action="np-upload">${icon('i-image')}Escolher foto</button><button type="button" class="btn btn-ghost btn-sm" data-action="np-shuffle">${icon('i-spark')}Sortear cores</button></div>
          </div>
          <small>Sem foto, o projeto ganha um ícone de pixels animado.</small>
        </div>
        <button class="btn btn-primary btn-lg w" type="submit">Criar projeto</button>
      </form>
    </div>`; },

    settings: tab => `${closeBtn}<div class="settings">
      <nav class="set-nav" role="tablist">
        <h2>Configurações</h2>
        ${[['geral', 'i-settings', 'Geral'], ['perso', 'i-user', 'Personalização'], ['dados', 'i-folder', 'Dados']].map(([k, ic, l]) => `<button class="set-tab" role="tab" data-stab="${k}" aria-selected="${k === (tab || 'geral')}">${icon(ic)}${l}</button>`).join('')}
      </nav>
      <div class="set-body" id="setBody">${settingsTab(tab || 'geral')}</div>
    </div>`,

    palette: () => `<div class="pal-input">${icon('i-search')}<input id="palInput" placeholder="Buscar conversas ou ações" aria-label="Buscar" /><kbd>esc</kbd></div><div class="pal-list" id="palList"></div>`,
  };

  const SUPPORT_TOPICS = [
    ['bug', 'i-info', 'Algo não funciona', 'O que você estava fazendo quando deu o problema? Se puder, diga o aparelho e o navegador.'],
    ['plano', 'i-coins', 'Pagamento e plano', 'Conte o que aconteceu com a cobrança ou com o seu plano.'],
    ['conta', 'i-user', 'Minha conta', 'Qual a dúvida sobre login, e-mail ou dados da conta?'],
    ['indique', 'i-share', 'Indique e Ganhe', 'Qual amigo entrou pelo seu link e o que não apareceu?'],
    ['agentes', 'i-bot', 'Agentes', 'Qual agente você usou e o que ele respondeu de diferente do esperado?'],
    ['grupo', 'i-group', 'Conversas em grupo', 'Qual o código da sessão e o que aconteceu?'],
    ['dados', 'i-lock', 'Privacidade e dados', 'Qual a sua dúvida sobre seus dados ou sobre apagar a conta?'],
    ['ideia', 'i-bulb', 'Sugestão', 'O que faria o SKYNETchat ficar melhor para você?'],
    ['outro', 'i-dots', 'Outro assunto', 'Descreva sua dúvida.'],
  ];
  const SUPPORT_FAQ = [
    ['Minhas conversas sumiram', 'Sem login, elas ficam só neste navegador. Limpar os dados do navegador ou usar o modo sem histórico apaga tudo.'],
    ['O limite do Free renova quando?', 'Todo dia à meia-noite, no horário de Brasília. São 5 mensagens por dia.'],
    ['Meus dados treinam a IA?', 'Não. Suas conversas não são usadas para treinar o modelo.'],
    ['Como cancelo o Pro?', 'Em Configurações, no seu plano. O Pro continua até o fim do mês que você já pagou e não tem multa.'],
  ];

  let promptCat = Object.keys(PROMPTS)[0];
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const promptText = p => esc(p.trim().replace(/\s+/g, ' ')).replace(/\[([^\]]+)\]/g, '<span class="pc-blank">$1</span>');
  const promptPreview = p => p.trim() ? `<span class="pc-text">${promptText(p)}</span>` : '<span class="pf-empty">O texto aparece aqui, com os campos em destaque.</span>';

  function promptCard([title, p, id], k, cat) {
    const inner = `${cat ? `<span class="pc-cat">${icon(PROMPT_ICONS[cat])}${cat}</span>` : ''}
      <b>${esc(title)}</b>
      <span class="pc-text">${promptText(p)}</span>`;
    // Os seus viram div com papel de botão, porque levam o botão de apagar dentro.
    return id
      ? `<div class="prompt-card" role="button" tabindex="0" data-prompt="${esc(p)}" style="--k:${k}">${inner}<button class="pc-del" data-del-prompt="${id}" aria-label="Apagar prompt">${icon('i-trash')}</button></div>`
      : `<button class="prompt-card" data-prompt="${esc(p)}" style="--k:${k}">${inner}${icon('i-arrow', 'i pc-go')}</button>`;
  }

  const minePrompts = () => state.myPrompts.map(m => [m.title, m.text, m.id]);
  // Sem busca mostra a categoria; com busca procura em todas, sem ligar para acento.
  function promptCards(cat, q = '') {
    if (!q && cat === MINE) {
      return state.myPrompts.length ? minePrompts().map((it, k) => promptCard(it, k)).join('')
        : `<div class="pr-empty pr-mine">${icon('i-pen')}<b>Seus prompts ficam aqui</b><span>Salve os pedidos que você repete e use com um toque.</span><button class="btn btn-primary btn-sm" data-action="prompt-new">${icon('i-plus')}Criar prompt</button></div>`;
    }
    if (!q) return PROMPTS[cat].map((it, k) => promptCard(it, k)).join('');
    const n = norm(q);
    const all = [...Object.entries(PROMPTS), [MINE, minePrompts()]];
    const hits = all.flatMap(([c, list]) => list.filter(([t, p]) => norm(`${t} ${p} ${c}`).includes(n)).map(it => [it, c]));
    return hits.length ? hits.map(([it, c], k) => promptCard(it, k, c)).join('') : '<p class="pr-empty">Nenhum prompt com esse termo. Tente outra palavra.</p>';
  }

  /* ---------------- Ícone de pixels dos projetos ---------------- */
  // Cada projeto sem logo ganha um padrão 5x5 espelhado, numa cor sorteada pela semente, em três tons.
  // Os pixels respiram e uma onda diagonal passa de tempos em tempos; no hover a onda acelera.
  function pixelIconModel(seed) {
    let a = (seed >>> 0) || 1;
    const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const h = rnd() * 360;
    const hues = [h, h, h];
    const cells = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
      const cell = { r, c, on: rnd() > .42, k: Math.floor(rnd() * 3), ph: rnd() * 6.28, sp: .8 + rnd() * 1.6 };
      cells.push(cell);
      if (c < 2) cells.push({ ...cell, c: 4 - c, ph: cell.ph + .5 });
    }
    return { hues, cells };
  }
  function pixelIconColor(seed) { return `hsl(${Math.round(pixelIconModel(seed).hues[0])},85%,62%)`; }
  const hashStr = str => [...str].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);
  const projSeed = p => p.seed ?? hashStr(p.id);
  const projIconInner = p => p.icon ? `<img src="${p.icon}" alt="">` : `<canvas class="pj-px" data-seed="${projSeed(p)}" aria-hidden="true"></canvas>`;
  const projIcon = (p, lg) => `<span class="pj-ico${lg ? ' is-lg' : ''}">${projIconInner(p)}</span>`;

  const pxIcons = new Set();
  let pxIconRaf = 0;
  function mountPixelIcons(root) {
    $$('canvas.pj-px:not([data-on])', root).forEach(cv => {
      cv.dataset.on = '1';
      pxIcons.add({ cv, m: pixelIconModel(+cv.dataset.seed), t: Math.random() * 3 });
    });
    if (!pxIconRaf && pxIcons.size) {
      let last = performance.now();
      const loop = now => {
        const dt = Math.min(.05, (now - last) / 1000);
        last = now;
        pxIcons.forEach(ic => { if (!ic.cv.isConnected) pxIcons.delete(ic); else drawPixelIcon(ic, dt); });
        pxIconRaf = pxIcons.size ? requestAnimationFrame(loop) : 0;
      };
      pxIconRaf = requestAnimationFrame(loop);
    }
  }
  function drawPixelIcon(ic, dt) {
    const { cv, m } = ic;
    const hover = cv.closest('.pj-card, .pj-hero')?.matches(':hover');
    ic.t += reduced ? 0 : dt * (hover ? 2.4 : 1);
    const dpr = Math.min(devicePixelRatio || 1, 2), size = cv.clientWidth;
    if (!size) return;
    if (cv.width !== Math.round(size * dpr)) cv.width = cv.height = Math.round(size * dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sys = getTheme() === 'system';
    ctx.globalAlpha = 1;
    ctx.fillStyle = sys ? '#031a0a' : `hsl(${m.hues[0]},45%,13%)`;
    ctx.fillRect(0, 0, size, size);
    const pad = size * .17, cell = (size - pad * 2) / 5, gap = Math.max(1, cell * .16);
    const wave = (ic.t * .55) % 2.6 - .5;
    for (const k of m.cells) {
      const sweep = Math.exp(-((((k.r + k.c) / 8 - wave) / .13) ** 2));
      const a = k.on ? Math.min(1, .72 + .28 * Math.sin(ic.t * k.sp + k.ph) + sweep * .4) : sweep * .55;
      if (a < .04) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = sys ? '#41ff78' : `hsl(${m.hues[0]},${[90, 80, 70][k.k]}%,${k.on ? [50, 64, 78][k.k] : 74}%)`;
      ctx.fillRect(pad + k.c * cell + gap / 2, pad + k.r * cell + gap / 2, cell - gap, cell - gap);
    }
    ctx.globalAlpha = 1;
  }

  // Pequenas animações em grade de pixels para os ícones dos popups. frame(put, t) acende cada casa com put(x, y, brilho).
  function pixelAnim(cv, frame, N = 9) {
    const color = getComputedStyle(cv).color;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const t0 = performance.now();
    const loop = now => {
      if (!cv.isConnected) return;
      const size = cv.clientWidth;
      if (cv.width !== Math.round(size * dpr)) cv.width = cv.height = Math.round(size * dpr);
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = color;
      const cell = size / N, g = Math.max(1, cell * .18);
      const put = (x, y, a) => { if (a < .03) return; ctx.globalAlpha = Math.min(1, a); ctx.fillRect(x * cell + g / 2, y * cell + g / 2, cell - g, cell - g); };
      frame(put, reduced ? 99 : (now - t0) / 1000);
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // Prompts: linhas sendo digitadas, com um cursor piscando, e recomeça.
  function pixelTyping(cv) {
    const LINES = [[1, 7], [3, 5], [5, 6], [7, 3]];
    const total = LINES.reduce((n, [, len]) => n + len, 0);
    pixelAnim(cv, (put, t) => {
      const typed = Math.min(total, Math.floor(t * 9) % (total + 14));
      let n = 0, cur = null;
      for (const [row, len] of LINES) for (let c = 0; c < len; c++, n++) {
        if (n === typed) cur = [c, row];
        put(c, row, n < typed ? 1 : .14);
      }
      if (cur && Math.floor(t * 2.5) % 2 === 0) put(cur[0], cur[1], 1);
    });
  }

  // Conversas em grupo: três pessoas chegam uma a uma e um balão fica digitando acima delas.
  function pixelGroup(cv) {
    pixelAnim(cv, (put, t) => {
      const T = t % 6;
      [0, 4, 8].forEach((x0, i) => {
        const a = T > .3 + i * .45 ? 1 : .12;
        put(x0 + 1, 6, a);
        for (let x = x0; x < x0 + 3; x++) { put(x, 8, a); put(x, 9, a); }
      });
      if (T > 1.8 && T < 5.4) [3, 5, 7].forEach((x, k) => put(x, 2, Math.floor(t * 3) % 3 === k ? 1 : .3));
    }, 11);
  }

  /* Tutorial em pixels do popup de grupo, em três cenas que se dissolvem uma na outra:
     criar a sessão (o código se digita), chamar até 10 pessoas e conversar com a IA. */
  const GT_FONT = {
    S: ['111', '100', '111', '001', '111'], K: ['101', '101', '110', '101', '101'], Y: ['101', '101', '010', '010', '010'], Q: ['010', '101', '101', '110', '011'], M: ['101', '111', '111', '101', '101'],
    '-': ['000', '000', '111', '000', '000'], '/': ['001', '001', '010', '100', '100'],
    0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'],
    5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'],
  };
  const GT_STEPS = [
    ['Crie uma sessão', 'Dê um nome e o SKYNETchat gera um código de acesso para o grupo.'],
    ['Chame até 10 pessoas', 'Quem tiver o código ou o link entra na hora.'],
    ['Conversem com a IA', 'Todo mundo escreve na mesma conversa e o SKYNETchat responde para o grupo.'],
  ];
  function groupTutorial(panel) {
    const cv = $('canvas', panel), cap = $('.gt-cap', panel);
    panel.style.setProperty('--tut', currentAccent().deep);
    panel.style.setProperty('--tut-pale', currentAccent().pale);
    const SCENE = 4.6, CYCLE = SCENE * 3, C = 10;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const t0 = performance.now();
    let offset = 0, shown = -1;
    panel.addEventListener('click', e => {
      const d = e.target.closest('[data-gt]');
      if (d) { offset = +d.dataset.gt * SCENE + .01 - (performance.now() - t0) / 1000; shown = -1; }
    });
    const loop = now => {
      if (!cv.isConnected) return;
      const W = cv.clientWidth, H = cv.clientHeight;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sys = getTheme() === 'system';
      const pal = sys ? { bg: '#021006', grid: '#41ff78', a: '#41ff78', b: '#1fbf55', c: '#8dffb0', w: '#c2ffd3', s: '#0b3016' }
        : (({ deep, solid, mid, pale, shade }) => ({ bg: deep, grid: solid, a: mid, b: solid, c: pale, w: '#ffffff', s: shade }))(currentAccent());
      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.bg;
      ctx.fillRect(0, 0, W, H);
      const cols = Math.floor(W / C), rows = Math.floor(H / C);
      const ox = (W - cols * C) / 2, oy = 6;
      const tt = reduced ? SCENE * .7 : ((((now - t0) / 1000 + offset) % CYCLE) + CYCLE) % CYCLE;
      const k = Math.floor(tt / SCENE), lt = tt % SCENE;
      const vis = Math.min(1, lt / .5, (SCENE - lt) / .45);
      ctx.fillStyle = pal.grid;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        ctx.globalAlpha = .05 + .07 * Math.max(0, Math.sin(tt * 1.3 + pxHash(c, r) * 40)) ** 6;
        ctx.fillRect(ox + c * C + 1, oy + r * C + 1, C - 2, C - 2);
      }
      const put = (x, y, color, a = 1, p = 1) => {
        if (x < 0 || y < 0 || x >= cols || y >= rows || pxHash(x + k * 17, y) > Math.min(vis, p)) return;
        ctx.globalAlpha = a;
        ctx.fillStyle = color;
        ctx.fillRect(ox + x * C + 1, oy + y * C + 1, C - 2, C - 2);
      };
      const text = (str, x0, y0, color, n = str.length, p = 1) => [...str].slice(0, n).forEach((ch, i) => (GT_FONT[ch] || []).forEach((row, r) => [...row].forEach((v, c) => { if (v === '1') put(x0 + i * 4 + c, y0 + r, color, 1, p); })));
      const rect = (x0, y0, w, h, color, a = 1, p = 1) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(x, y, color, a, p); };
      const appear = start => Math.max(0, Math.min(1, (lt - start) / .3));
      const cx = Math.floor(cols / 2), cy = Math.floor((rows - 13) / 2);
      if (k === 0) {
        // card da sessão: o nome se escreve, depois o código aparece letra a letra
        for (let x = cx - 17; x <= cx + 17; x++) { put(x, cy - 8, pal.b, .9); put(x, cy + 8, pal.b, .9); }
        for (let y = cy - 8; y <= cy + 8; y++) { put(cx - 17, y, pal.b, .9); put(cx + 17, y, pal.b, .9); }
        rect(cx - 14, cy - 5, Math.min(18, Math.max(0, Math.floor((lt - .4) * 16))), 1, pal.c, .8);
        const code = 'SKY-7Q4M', n = Math.max(0, Math.min(code.length, Math.floor((lt - 1.5) / .2)));
        const pulse = n === code.length ? .65 + .35 * Math.sin(lt * 6) : 1;
        text(code, cx - 15, cy - 1, pal.w, n);
        if (n < code.length && Math.floor(lt * 4) % 2) rect(cx - 15 + n * 4, cy - 1, 3, 5, pal.a, .8);
        if (n === code.length) rect(cx - 15, cy + 5, 31, 1, pal.a, pulse);
      } else if (k === 1) {
        // até 10 pessoas entrando uma a uma, com o contador embaixo
        const n = Math.max(0, Math.min(10, Math.floor((lt - .4) / .28) + 1));
        for (let i = 0; i < 10; i++) {
          const x = cx - 16 + (i % 5) * 7, y = cy - 8 + Math.floor(i / 5) * 8;
          const on = i < n, col = !on ? pal.s : i === 0 ? pal.w : i % 2 ? pal.a : pal.c, p = on ? appear(.4 + i * .28) : 1;
          rect(x + 1, y, 2, 2, col, on ? 1 : .9, p);
          rect(x, y + 3, 4, 2, col, on ? 1 : .9, p);
        }
        const label = `${n}/10`;
        text(label, cx - Math.floor((label.length * 4 - 1) / 2), cy + 9, pal.w);
      } else {
        // conversa: duas pessoas, a IA digitando e respondendo com o S da marca, e mais uma pessoa
        const bubble = (x0, y0, w, h, col, line, p) => { rect(x0, y0, w, h, col, 1, p); rect(x0 + 2, y0 + 1, w - 4, 1, line, 1, p); if (h > 3) rect(x0 + 2, y0 + 3, Math.floor(w * .55), 1, line, 1, p); };
        const pa = appear(.3), pb = appear(1), pc = appear(2.3), pd = appear(3.1);
        rect(cx - 17, cy - 11, 2, 2, pal.a, 1, pa); bubble(cx - 14, cy - 12, 19, 3, pal.b, pal.c, pa);
        rect(cx - 17, cy - 6, 2, 2, pal.c, 1, pb); bubble(cx - 14, cy - 7, 13, 3, pal.b, pal.c, pb);
        if (lt > 1.6 && lt < 2.3) [0, 2, 4].forEach((d, i) => put(cx + 8 + d, cy, pal.w, Math.floor(lt * 6) % 3 === i ? 1 : .35));
        S_GRID.forEach((row, r) => [...row].forEach((v, c) => { if (v === '1') put(cx + 13 + c, cy - 2 + r, pal.w, 1, pc); }));
        bubble(cx - 10, cy - 2, 21, 5, pal.w, pal.b, pc);
        rect(cx - 17, cy + 6, 2, 2, pal.w, 1, pd); bubble(cx - 14, cy + 5, 11, 3, pal.b, pal.c, pd);
      }
      ctx.globalAlpha = 1;
      if (k !== shown) {
        shown = k;
        cap.innerHTML = `<span class="gt-step">Passo ${k + 1} de 3</span><b>${GT_STEPS[k][0]}</b><p>${GT_STEPS[k][1]}</p><div class="gt-dots">${GT_STEPS.map((_, i) => `<button type="button" data-gt="${i}" class="${i === k ? 'on' : ''}" aria-label="Passo ${i + 1}"></button>`).join('')}</div>`;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // Suporte: um balão de conversa com três pontos digitando.
  function pixelSupport(cv) {
    pixelAnim(cv, (put, t) => {
      for (let x = 1; x <= 7; x++) { put(x, 0, .9); put(x, 6, .9); }
      for (let y = 1; y <= 5; y++) { put(0, y, .9); put(8, y, .9); }
      put(2, 7, .9); put(1, 8, .9);
      [2, 4, 6].forEach((x, k) => put(x, 3, Math.floor(t * 3) % 3 === k ? 1 : .3));
    });
  }

  // Imagem escolhida para o ícone vira um PNG quadrado de 96 px, recortado no centro, para caber no armazenamento local.
  const iconInput = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*', hidden: true });
  document.body.appendChild(iconInput);
  let iconDone = null;
  function pickIcon(done) { iconDone = done; iconInput.value = ''; iconInput.click(); }
  iconInput.addEventListener('change', () => {
    const f = iconInput.files[0];
    if (!f || !iconDone) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 96;
      const k = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, 96, 96);
      URL.revokeObjectURL(img.src);
      iconDone(c.toDataURL('image/png'));
      iconDone = null;
    };
    img.onerror = () => toast('Não deu para abrir essa imagem.');
    img.src = URL.createObjectURL(f);
  });

  let newProj = null;
  function paintNewProjIcon() { const el = $('#npIco'); el.innerHTML = projIconInner(newProj); mountPixelIcons(el); }

  /* ---------------- Projetos (página) ---------------- */
  const pageEl = $('#page');
  let pageT = null;
  const saveProjects = () => store.set('skynet-projects', state.projects);
  const projectById = id => state.projects.find(p => p.id === id) || null;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const convPreview = c => ((c.messages.find(m => m.role === 'ai') || c.messages[0] || {}).text || '').replace(/[*#`>]/g, '').replace(/\s+/g, ' ').slice(0, 110);

  function showView(v) {
    state.view = v;
    const page = v !== 'chat';
    stage.hidden = page;
    pageEl.hidden = !page;
    $$('[data-action="projects"]').forEach(b => b.classList.toggle('is-active', page));
    if (page) { closeDrawer(); closePop(); }
  }

  // A lista abre com um esqueleto rápido, como uma página carregando.
  function openProjects(skeleton = true) {
    showView('projects');
    clearTimeout(pageT);
    const render = loading => `<div class="page-in">
      <header class="pg-head"><div><h1>Projetos</h1><p>Junte conversas, arquivos e instruções de um mesmo assunto num lugar só.</p></div>
        <button class="btn btn-primary" data-modal="novoProjeto">${icon('i-plus')}Novo projeto</button></header>
      <div class="pg-tools"><label class="pr-search pg-search">${icon('i-search')}<input id="projSearch" placeholder="Buscar projetos" aria-label="Buscar projetos" autocomplete="off" /></label><span class="pg-hint">Segure e arraste um card para mudar a ordem</span></div>
      <div class="pj-grid" id="pjGrid">${loading ? '<div class="pj-card is-skel"></div>'.repeat(6) : projectCards('')}</div>
    </div>`;
    pageEl.innerHTML = render(skeleton);
    pageEl.scrollTop = 0;
    if (skeleton) pageT = setTimeout(() => { if (state.view === 'projects') { pageEl.innerHTML = render(false); mountPixelIcons(pageEl); } }, 450);
    else mountPixelIcons(pageEl);
  }

  function projectCards(q) {
    const n = norm(q.trim());
    const list = state.projects.filter(p => !n || norm(`${p.name} ${p.desc || ''}`).includes(n));
    if (n && !list.length) return '<p class="pr-empty">Nenhum projeto com esse nome.</p>';
    return list.map((p, k) => {
      const chats = state.convs.filter(c => c.project === p.id).length;
      return `<button class="pj-card" data-proj="${p.id}" style="--k:${k}">
        ${projIcon(p)}
        <b>${esc(p.name)}</b>
        <span class="pj-desc">${esc(p.desc || 'Sem instruções ainda.')}</span>
        <span class="pj-meta">${plural(chats, 'conversa', 'conversas')} · ${plural((p.files || []).length, 'arquivo', 'arquivos')} · ${ago(p.updated || p.created)}</span>
      </button>`;
    }).join('') + (n ? '' : `<button class="pj-card pj-add" data-modal="novoProjeto" style="--k:${list.length}">${icon('i-plus')}<b>Novo projeto</b><span class="pj-desc">Crie um espaço para um assunto.</span></button>`);
  }

  function openProject(id) {
    const p = projectById(id);
    if (!p) return openProjects(false);
    state.projectView = id;
    showView('project');
    const convs = state.convs.filter(c => c.project === p.id).sort((a, b) => b.updated - a.updated);
    const files = p.files || [];
    pageEl.innerHTML = `<div class="page-in">
      <button class="pg-back" data-action="projects">${icon('i-chev')}Projetos</button>
      <header class="pj-hero">
        ${projIcon(p, true)}
        <div class="pj-hero-txt"><h1>${esc(p.name)}</h1><p>${plural(convs.length, 'conversa', 'conversas')} · ${plural(files.length, 'arquivo', 'arquivos')} · criado em ${new Date(p.created).toLocaleDateString('pt-BR')}</p></div>
        <button class="icon-btn" data-proj-menu="${p.id}" aria-label="Opções do projeto">${icon('i-dots')}</button>
      </header>
      <form class="pj-new" id="projChat" data-proj-id="${p.id}">
        <input name="q" placeholder="Nova conversa em ${esc(p.name)}" autocomplete="off" aria-label="Nova conversa no projeto" />
        <button class="send" type="submit" aria-label="Começar conversa">${icon('i-up')}</button>
      </form>
      <div class="pj-cols">
        <section>
          <h2 class="pj-h">Conversas <span>${convs.length}</span></h2>
          <div class="pj-convs">${convs.length ? convs.map(c => `<div class="pj-conv-row"><button class="pj-conv" data-open="${c.id}"><b>${esc(c.title)}</b><small>${ago(c.updated)}</small><span>${esc(convPreview(c))}</span></button><button class="icon-btn pj-conv-more" data-pconv-menu="${c.id}" aria-label="Opções da conversa">${icon('i-dots')}</button></div>`).join('') : '<p class="pj-empty">Nenhuma conversa ainda. Escreva acima para começar.</p>'}</div>
        </section>
        <aside class="pj-side">
          <div class="pj-box">
            <div class="pj-box-head"><h3>Instruções</h3><button class="btn btn-ghost btn-sm" data-action="proj-edit">${icon('i-pen')}Editar</button></div>
            <p class="pj-instr" id="pjInstr">${p.desc ? esc(p.desc) : 'Diga como o SKYNETchat deve responder neste projeto.'}</p>
          </div>
          <div class="pj-box">
            <div class="pj-box-head"><h3>Arquivos <span>${files.length}</span></h3><button class="btn btn-ghost btn-sm" data-action="proj-file">${icon('i-plus')}Adicionar</button></div>
            ${files.length ? `<ul class="pj-files">${files.map((f, i) => `<li>${icon('i-doc')}<span>${esc(f.name)}</span><small>${fmtSize(f.size)}</small><button class="chip-x" data-proj-file-rm="${i}" aria-label="Remover ${esc(f.name)}">${icon('i-x')}</button></li>`).join('')}</ul>` : '<p class="pj-empty">PDF, planilha ou imagem que o SKYNETchat deve consultar.</p>'}
          </div>
        </aside>
      </div>
    </div>`;
    pageEl.scrollTop = 0;
    mountPixelIcons(pageEl);
  }

  function touchProject(p) { p.updated = Date.now(); saveProjects(); }

  /* Projetos: segurar e arrastar muda a ordem. No mouse o arraste começa ao mover; no toque, depois de segurar um instante.
     O card vai para o espaço cujo centro está mais perto do centro dele (assim não fica trocando de lugar sem parar),
     um contorno tracejado mostra onde ele vai cair, os outros deslizam (FLIP) e a página rola sozinha perto das bordas. */
  let pjDrag = null, pjSuppressClick = false;
  const pjCards = () => $$('#pjGrid .pj-card[data-proj]');
  function startPjDrag() {
    const d = pjDrag;
    if (!d || d.on) return;
    const grid = $('#pjGrid'), r = d.card.getBoundingClientRect();
    d.on = true;
    d.offX = d.x0 - r.left;
    d.offY = d.y0 - r.top;
    d.slot = Object.assign(document.createElement('div'), { className: 'pj-slot' });
    grid.appendChild(d.slot);
    grid.classList.add('is-sorting');
    d.card.classList.remove('is-pressing');
    d.card.classList.add('is-dragging');
    document.body.classList.add('is-grabbing');
    navigator.vibrate?.(8);
    d.raf = requestAnimationFrame(pjFrame);
  }
  function pjFrame() {
    const d = pjDrag;
    if (!d || !d.on) return;
    const grid = $('#pjGrid');
    // rolagem automática: quanto mais perto da borda, mais rápido
    const pr = pageEl.getBoundingClientRect(), edge = 90;
    if (d.y < pr.top + edge) pageEl.scrollTop -= Math.ceil((pr.top + edge - d.y) / 5);
    else if (d.y > pr.bottom - edge) pageEl.scrollTop += Math.ceil((d.y - (pr.bottom - edge)) / 5);
    const g = grid.getBoundingClientRect();
    const left = d.x - g.left - d.offX, top = d.y - g.top - d.offY;
    const cx = left + d.card.offsetWidth / 2, cy = top + d.card.offsetHeight / 2;
    const cards = pjCards();
    let to = 0, best = Infinity;
    cards.forEach((c, i) => {
      const dist = (c.offsetLeft + c.offsetWidth / 2 - cx) ** 2 + (c.offsetTop + c.offsetHeight / 2 - cy) ** 2;
      if (dist < best) { best = dist; to = i; }
    });
    const from = cards.indexOf(d.card);
    if (to !== from) {
      const before = new Map(cards.map(c => [c, [c.offsetLeft, c.offsetTop]]));
      grid.insertBefore(d.card, to > from ? cards[to].nextSibling : cards[to]);
      cards.forEach(c => {
        if (c === d.card) return;
        const [ax, ay] = before.get(c), dx = ax - c.offsetLeft, dy = ay - c.offsetTop;
        if (!dx && !dy) return;
        c.style.transition = 'none';
        c.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => requestAnimationFrame(() => { c.style.transition = ''; c.style.transform = ''; }));
      });
    }
    d.slot.style.width = d.card.offsetWidth + 'px';
    d.slot.style.height = d.card.offsetHeight + 'px';
    d.slot.style.transform = `translate(${d.card.offsetLeft}px, ${d.card.offsetTop}px)`;
    d.card.style.transform = `translate(${left - d.card.offsetLeft}px, ${top - d.card.offsetTop}px)`;
    d.raf = requestAnimationFrame(pjFrame);
  }
  function endPjDrag() {
    const d = pjDrag;
    pjDrag = null;
    if (!d) return;
    clearTimeout(d.timer);
    d.card.classList.remove('is-pressing');
    if (!d.on) return;
    cancelAnimationFrame(d.raf);
    pjSuppressClick = true;
    setTimeout(() => { pjSuppressClick = false; }, 0);
    // solta: o card desliza para o espaço tracejado, por cima dos outros até assentar
    d.card.classList.replace('is-dragging', 'is-settling');
    d.card.style.transform = '';
    d.slot.remove();
    document.body.classList.remove('is-grabbing');
    setTimeout(() => { d.card.classList.remove('is-settling'); $('#pjGrid')?.classList.remove('is-sorting'); }, 280);
    const ids = pjCards().map(c => c.dataset.proj);
    state.projects = [...ids.map(projectById), ...state.projects.filter(x => !ids.includes(x.id))];
    saveProjects();
  }
  document.addEventListener('pointerdown', e => {
    const card = e.target.closest('#pjGrid .pj-card[data-proj]');
    if (!card || e.button !== 0 || pjDrag || $('#projSearch')?.value.trim()) return;
    const touch = e.pointerType !== 'mouse';
    pjDrag = { card, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, on: false, timer: touch ? setTimeout(startPjDrag, 300) : 0 };
    if (touch) card.classList.add('is-pressing');
  });
  document.addEventListener('pointermove', e => {
    const d = pjDrag;
    if (!d) return;
    d.x = e.clientX;
    d.y = e.clientY;
    if (!d.on && Math.hypot(d.x - d.x0, d.y - d.y0) > 6) {
      if (e.pointerType === 'mouse') startPjDrag();
      else { clearTimeout(d.timer); d.card.classList.remove('is-pressing'); pjDrag = null; }
    }
  });
  document.addEventListener('pointerup', endPjDrag);
  document.addEventListener('pointercancel', endPjDrag);
  // No toque, depois de segurar, o dedo arrasta o card em vez de rolar a página.
  document.addEventListener('touchmove', e => { if (pjDrag?.on) e.preventDefault(); }, { passive: false });
  // O clique que vem logo depois de soltar um arraste não abre o projeto.
  document.addEventListener('click', e => { if (pjSuppressClick && e.target.closest('.pj-card')) { e.stopPropagation(); e.preventDefault(); } }, true);


  function settingsTab(tab) {
    const p = state.prefs;
    if (tab === 'geral') return `<section><h3>Tema</h3><p class="set-hint">O System transforma o chat num terminal de fósforo verde.</p>
        <div class="theme-seg is-lg" role="radiogroup" aria-label="Tema">${[['light', 'i-sun', 'Claro'], ['dark', 'i-moon', 'Escuro'], ['system', 'i-term', 'System']].map(([t, ic, l]) => `<button role="radio" data-theme-set="${t}" aria-checked="${getTheme() === t}">${icon(ic)}<span>${l}</span></button>`).join('')}</div></section>
      <section><h3>Cor de destaque</h3><p class="set-hint">Muda botões, seleções e animações. No tema System tudo continua verde.</p>
        <div class="accent-pick" role="radiogroup" aria-label="Cor de destaque">${Object.entries(ACCENTS).map(([k, a]) => `<button type="button" role="radio" data-accent-set="${k}" aria-checked="${accentKey() === k}" style="--sw:${a.solid}"><i>${icon('i-check')}</i><span>${a.name}</span></button>`).join('')}</div></section>
      <section>
        <div class="set-row"><div><b>Enviar com Enter</b><span>Shift + Enter quebra a linha</span></div><button class="switch" role="switch" data-pref="enter" aria-checked="${p.enter}" aria-label="Enviar com Enter"></button></div>
        <div class="set-row"><div><b>Idioma da voz</b><span>Usado no ditado e no modo voz</span></div>
          <span class="select"><select data-pref-select="lang" aria-label="Idioma">${[['pt-BR', 'Português (Brasil)'], ['pt-PT', 'Português (Portugal)'], ['en-US', 'English'], ['es-ES', 'Español']].map(([v, l]) => `<option value="${v}"${p.lang === v ? ' selected' : ''}>${l}</option>`).join('')}</select>${icon('i-chev')}</span></div>
      </section>`;
    if (tab === 'perso') return `<section><h3>Personalização</h3><p class="set-hint">O SKYNETchat usa isso para responder do seu jeito.</p>
        <div class="m-stack" style="margin-top:6px">
          <label class="field"><span>Como devo te chamar?</span><input id="pName" value="${esc(p.name)}" placeholder="Seu nome ou apelido" maxlength="40" /></label>
          <label class="field"><span>O que devo saber sobre você?</span><textarea id="pAbout" placeholder="Ex.: sou designer, moro em Curitiba e prefiro exemplos práticos." maxlength="600">${esc(p.about)}</textarea></label>
          <div class="field"><span>Tamanho das respostas</span><div class="seg" role="radiogroup">${[['curtas', 'Curtas'], ['equilibradas', 'Equilibradas'], ['detalhadas', 'Detalhadas']].map(([v, l]) => `<button role="radio" data-style="${v}" aria-checked="${p.style === v}">${l}</button>`).join('')}</div></div>
          <button class="btn btn-primary" data-action="save-perso" style="align-self:flex-start;margin-top:6px">Salvar</button>
        </div></section>`;
    const saved = state.convs.filter(c => !c.temp).length;
    return `<section><h3>Dados</h3><p class="set-hint">Suas conversas ficam salvas neste navegador até o login ser ligado ao servidor.</p>
        <div class="set-row"><div><b>Não salvar histórico</b><span>Novas conversas somem quando você sai delas e não aparecem na barra lateral</span></div><button class="switch" role="switch" data-pref="noHistory" aria-checked="${p.noHistory}" aria-label="Não salvar histórico"></button></div>
        <div class="danger-zone"><div><b>Apagar todas as conversas</b><span>${saved} conversa${saved === 1 ? '' : 's'} no histórico</span></div><button class="btn btn-outline hold" data-hold="wipe" data-label="Segure para apagar">Segure para apagar</button></div></section>`;
  }

  let lastFocus = null;
  function openModal(name, arg) {
    closePop();
    if (!MODALS[name]) return;
    lastFocus = document.activeElement;
    dropTurnstile();
    const browse = ['prompts', 'promptNew', 'agents', 'grupo', 'pro', 'suporte'].includes(name);
    modal.className = 'modal' + (name === 'settings' ? ' is-wide' : '') + (name === 'palette' ? ' is-palette' : '') + (name === 'pro' ? ' is-pay' : browse ? ' is-browse' : '') + (name === 'loginCode' ? ' is-code' : '') + (name === 'grupo' ? ' is-split' : '');
    modal.innerHTML = MODALS[name](arg);
    modal.dataset.name = name;
    paintMarks(modal);
    mountPixelIcons(modal);
    if ($('#pxPrompt', modal)) pixelTyping($('#pxPrompt', modal));
    if ($('#pxGroup', modal)) pixelGroup($('#pxGroup', modal));
    if ($('#pxSupport', modal)) pixelSupport($('#pxSupport', modal));
    if ($('.gt-panel', modal)) groupTutorial($('.gt-panel', modal));
    if (name === 'loginCode') mountTurnstile();
    modalLayer.hidden = false;
    closeDrawer();
    if (name === 'palette') { renderPalette(''); $('#palInput').focus(); }
    // Nas listas, abrir o teclado do celular de cara esconde o conteúdo.
    else if (browse && !matchMedia('(hover: hover)').matches) modal.querySelector('.m-close')?.focus();
    else (modal.querySelector('input:not([readonly]), textarea') || modal.querySelector('.m-close'))?.focus();
  }
  function closeModal() {
    if (modalLayer.hidden) return;
    dropTurnstile();
    modalLayer.hidden = true;
    modal.innerHTML = '';
    lastFocus?.focus?.();
  }

  /* ---------------- Paleta ---------------- */
  let palItems = [], palIndex = 0;
  function renderPalette(q) {
    q = q.trim().toLowerCase();
    const actions = [
      { label: 'Novo chat', icon: 'i-compose', run: newChat },
      { label: 'Tema Claro', icon: 'i-sun', run: () => setTheme('light') },
      { label: 'Tema Escuro', icon: 'i-moon', run: () => setTheme('dark') },
      { label: 'Tema System', icon: 'i-term', run: () => setTheme('system') },
      { label: 'Prompts prontos', icon: 'i-book', run: () => openModal('prompts') },
      { label: 'Agentes', icon: 'i-bot', run: () => openModal('agents') },
      { label: 'Projetos', icon: 'i-folder', run: () => openProjects() },
      { label: 'Conversas em grupo', icon: 'i-group', run: () => openModal('grupo') },
      { label: 'Planos', icon: 'i-spark', run: () => openModal('pro') },
      { label: 'Configurações', icon: 'i-settings', run: () => openModal('settings') },
    ].filter(a => !q || a.label.toLowerCase().includes(q));
    const convs = [...state.convs].sort((a, b) => b.updated - a.updated)
      .filter(c => !q || c.title.toLowerCase().includes(q) || c.messages.some(m => (m.text || '').toLowerCase().includes(q)))
      .slice(0, 8)
      .map(c => ({ label: c.title, icon: 'i-compose', sub: groupLabel(c.updated), run: () => openConv(c.id) }));
    palItems = [...convs, ...actions];
    palIndex = 0;
    const list = $('#palList');
    if (!palItems.length) { list.innerHTML = '<p class="pal-empty">Nada encontrado.</p>'; return; }
    let html = '', n = 0;
    if (convs.length) html += '<div class="pop-label">Conversas</div>' + convs.map(c => `<button class="pop-item" data-pal="${n++}">${icon('i-search')}<span class="grow">${esc(c.label)}</span><small style="color:var(--fg-3);font-size:var(--fs-xs)">${c.sub}</small></button>`).join('');
    if (actions.length) html += '<div class="pop-label">Ações</div>' + actions.map(a => `<button class="pop-item" data-pal="${n++}">${icon(a.icon)}<span class="grow">${a.label}</span></button>`).join('');
    list.innerHTML = html;
    hlPalette();
  }
  function hlPalette() {
    $$('[data-pal]').forEach(b => b.classList.toggle('is-hl', +b.dataset.pal === palIndex));
    $(`[data-pal="${palIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }
  function runPal(i) { const it = palItems[i]; if (!it) return; closeModal(); it.run(); }

  /* ---------------- Conta ---------------- */
  function renderAccount() {
    const u = state.user;
    // a etiqueta PRO do Indique e Ganhe só aparece para quem ainda não tem o Pro
    $('#referPro').hidden = isPro();
    const av = $('#avatar');
    if (u) {
      av.classList.add('has-user');
      av.textContent = u.name.slice(0, 1).toUpperCase();
      $('#accountName').textContent = u.name;
      $('#accountPlan').textContent = isPro() ? 'Plano Pro' : 'Plano Free';
      $('#tbLogin').hidden = true;
    } else {
      av.classList.remove('has-user');
      av.innerHTML = icon('i-user');
      $('#accountName').textContent = 'Fazer login';
      $('#accountPlan').textContent = isPro() ? 'Plano Pro' : 'Salve e sincronize suas conversas';
      $('#tbLogin').hidden = false;
    }
  }
  function login(name, email, first) {
    state.user = { name, email, first: first || '', pro: false };
    store.set('skynet-user', state.user);
    renderAccount();
    greet();
    closeModal();
    toast(first ? `Bem-vindo, ${first}.` : 'Pronto, você entrou.');
  }

  /* ---------------- Toast e dicas ---------------- */
  function toast(text) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 260); }, 2400);
  }

  const tip = $('#tip');
  let tipT = null;
  if (matchMedia('(hover: hover)').matches) {
    document.addEventListener('mouseover', e => {
      const el = e.target.closest('[data-tip]');
      clearTimeout(tipT);
      if (!el) { tip.hidden = true; return; }
      tipT = setTimeout(() => {
        if (el.getAttribute('aria-expanded') === 'true') return;
        tip.textContent = el.dataset.tip;
        tip.hidden = false;
        const r = el.getBoundingClientRect();
        const w = tip.offsetWidth;
        const below = r.bottom + 8 + tip.offsetHeight < innerHeight - 140;
        tip.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)) + 'px';
        tip.style.top = (below ? r.bottom + 8 : r.top - tip.offsetHeight - 8) + 'px';
      }, 380);
    });
    document.addEventListener('mousedown', () => { clearTimeout(tipT); tip.hidden = true; });
  }

  /* ---------------- Barra lateral ---------------- */
  // Rolando o histórico, os atalhos de cima recolhem e viram uma fileira de ícones, com os mesmos data-* dos itens.
  (() => {
    const sb = $('#sidebar'), mini = $('#sbMini');
    $$('.sb-nav .sb-item').forEach(b => {
      const m = document.createElement('button');
      for (const at of b.attributes) if (at.name !== 'class') m.setAttribute(at.name, at.value);
      const label = b.querySelector('span').textContent;
      m.className = 'icon-btn sb-mini-btn' + (b.classList.contains('is-soon') ? ' is-soon' : '');
      m.dataset.tip = label;
      m.setAttribute('aria-label', label);
      m.innerHTML = b.querySelector('svg').outerHTML;
      mini.appendChild(m);
    });
    // Segue a intenção de quem rola: para baixo recolhe (basta o histórico ter rolagem), para cima no topo volta.
    // Logo depois de recolher, o histórico cresce e a rolagem pode voltar ao zero sozinha; essa volta é ignorada.
    let lockUntil = 0, lastY = 0, touchY = null;
    const compact = on => {
      if (on === sb.classList.contains('is-compact')) return;
      sb.classList.toggle('is-compact', on);
      lockUntil = performance.now() + 450;
    };
    const overflow = () => historyEl.scrollHeight - historyEl.clientHeight > 4;
    historyEl.addEventListener('wheel', e => {
      if (e.deltaY > 2 && overflow()) compact(true);
      else if (e.deltaY < -2 && historyEl.scrollTop <= 0) compact(false);
    }, { passive: true });
    historyEl.addEventListener('scroll', () => {
      const y = historyEl.scrollTop;
      if (performance.now() > lockUntil) {
        if (y > 24) compact(true);
        else if (y <= 0 && lastY > 0) compact(false);
      }
      lastY = y;
    }, { passive: true });
    historyEl.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
    historyEl.addEventListener('touchmove', e => {
      if (touchY == null) return;
      const dy = e.touches[0].clientY - touchY;
      if (dy < -12 && overflow()) { compact(true); touchY = null; }
      else if (dy > 18 && historyEl.scrollTop <= 0) { compact(false); touchY = null; }
    }, { passive: true });
  })();
  function toggleSidebar() {
    app.classList.toggle('sb-collapsed');
    store.set('skynet-sb-collapsed', app.classList.contains('sb-collapsed'));
  }
  const openDrawer = () => app.classList.add('drawer-open');
  const closeDrawer = () => app.classList.remove('drawer-open');

  /* Pixels dos toggles Pesquisa e Pensar */
  const toolFx = new Map();
  function toolPixels(btn, on, e) {
    toolFx.get(btn)?.stop();
    toolFx.delete(btn);
    if (!on) return;
    const r = btn.getBoundingClientRect();
    const ox = e && e.clientX ? e.clientX - r.left : r.width / 2;
    const oy = e && e.clientY ? e.clientY - r.top : r.height / 2;
    // Uma onda de pixels sai do ponto do clique e preenche o botão; depois ficam faíscas e uma faixa que varre da esquerda para a direita.
    toolFx.set(btn, pixelFx(btn, (x, y, w, h, t, rnd) => {
      const d = Math.hypot(x - ox, y - oy);
      const front = t * 260;
      if (d > front) return 0;
      const edge = Math.exp(-(((front - d) / 7) ** 2));
      const band = Math.exp(-(((x - ((t * .5) % 1.6 - .3) * w) / 12) ** 2));
      return .1 + .55 * sparkle(t, rnd) + .3 * band + .8 * edge * (t < 1 ? 1 : 0);
    }));
  }

  /* ---------------- Cliques ---------------- */
  document.addEventListener('click', e => {
    const t = e.target;

    const popBtn = t.closest('[data-pop]');
    if (popBtn) { onPop(popBtn.dataset.pop); return; }
    if (!popover.hidden && !t.closest('.popover') && !t.closest('[aria-expanded="true"]')) closePop();

    const themeBtn = t.closest('[data-theme-set]');
    if (themeBtn) { setTheme(themeBtn.dataset.themeSet); return; }

    const sugg = t.closest('[data-sugg]');
    if (sugg) { send(SUGGESTIONS[+sugg.dataset.sugg].prompt); return; }

    const open = t.closest('[data-open]');
    if (open) { openConv(open.dataset.open); return; }

    const cm = t.closest('[data-conv-menu]');
    if (cm) { convMenu(cm, cm.dataset.convMenu); return; }

    const mode = t.closest('[data-mode]');
    if (mode) {
      const m = mode.dataset.mode;
      if (m === 'imagens' && !isPro()) { openModal('pro', 'imagens'); return; }
      // A barra lateral leva para a tela do modo: sai da página de Projetos e de uma conversa em andamento.
      if (state.view !== 'chat' || current()) newChat();
      setMode(m);
      closeDrawer();
      if (modalLayer.hidden) input.focus();
      return;
    }

    const mn = t.closest('[data-mention]');
    if (mn) { pickMention(mn.dataset.mention); return; }

    const ses = t.closest('[data-session]');
    if (ses) { enterSession(ses.dataset.session); return; }

    const ag = t.closest('[data-agent]');
    if (ag) { startAgent(ag.dataset.agent); return; }

    const say = t.closest('[data-say]');
    if (say) { const p = say.dataset.say; if (/\s$/.test(p) || p.includes('[')) fillInput(p); else send(p); return; }

    const topic = t.closest('[data-topic]');
    if (topic) {
      $$('[data-topic]').forEach(b => b.setAttribute('aria-checked', String(b === topic)));
      $('#supMsg').placeholder = SUPPORT_TOPICS.find(x => x[0] === topic.dataset.topic)[3];
      return;
    }

    const em = t.closest('[data-eff-model]');
    if (em) { if (setModel(em.dataset.effModel, true)) effortView('slider'); return; }

    const acc = t.closest('[data-accent-set]');
    if (acc) { applyAccent(acc.dataset.accentSet); $$('[data-accent-set]').forEach(b => b.setAttribute('aria-checked', String(b === acc))); return; }

    const plan = t.closest('[data-plan]');
    if (plan) {
      $$('[data-plan]').forEach(b => b.setAttribute('aria-checked', String(b === plan)));
      $('.plans').dataset.show = plan.dataset.plan;
      return;
    }

    const gtab = t.closest('[data-gtab]');
    if (gtab) {
      const join = gtab.dataset.gtab === 'join';
      $$('[data-gtab]').forEach(x => x.setAttribute('aria-checked', String(x === gtab)));
      $('#sessionForm').hidden = join;
      $('#joinForm').hidden = !join;
      const hint = $('#gsHint');
      hint.classList.remove('is-err');
      hint.textContent = join ? 'Peça o código para quem criou a sessão. Ele também vem no link de convite.' : 'Você recebe um código para mandar ao grupo.';
      $(join ? '#joinForm input' : '#sessionForm input').focus();
      return;
    }

    const md_ = t.closest('[data-modal]');
    if (md_) { openModal(md_.dataset.modal); return; }

    const tst = t.closest('[data-toast]');
    if (tst) { toast(tst.dataset.toast); return; }

    const tool = t.closest('[data-tool]');
    if (tool) {
      const k = tool.dataset.tool;
      state.tools[k] = !state.tools[k];
      tool.setAttribute('aria-pressed', String(state.tools[k]));
      toolPixels(tool, state.tools[k], e);
      return;
    }

    const rf = t.closest('[data-remove-file]');
    if (rf) { state.files.splice(+rf.dataset.removeFile, 1); renderChips(); return; }

    const lg = t.closest('[data-login]');
    if (lg) { login('Conta ' + lg.dataset.login, ''); return; }

    const pl = t.closest('[data-pop-like]');
    if (pl) { e.preventDefault(); onPop(pl.dataset.popLike); return; }

    const ptab = t.closest('[data-ptab]');
    if (ptab) {
      promptCat = ptab.dataset.ptab;
      $('#promptSearch').value = '';
      $$('[data-ptab]').forEach(b => b.setAttribute('aria-selected', String(b === ptab)));
      const list = $('#promptList');
      list.classList.remove('is-typing');
      list.innerHTML = promptCards(promptCat);
      list.scrollTop = 0;
      return;
    }
    const dp = t.closest('[data-del-prompt]');
    if (dp) {
      state.myPrompts = state.myPrompts.filter(m => m.id !== dp.dataset.delPrompt);
      store.set('skynet-myprompts', state.myPrompts);
      $('#promptList').innerHTML = promptCards(promptCat, $('#promptSearch').value.trim());
      toast('Prompt apagado.');
      return;
    }
    const pr = t.closest('[data-prompt]');
    if (pr) { closeModal(); if (state.view !== 'chat') showView('chat'); fillInput(pr.dataset.prompt); return; }
    const proj = t.closest('[data-proj]');
    if (proj) { closeModal(); openProject(proj.dataset.proj); return; }

    const pmenu = t.closest('[data-proj-menu]');
    if (pmenu) {
      const id = pmenu.dataset.projMenu;
      openPop(pmenu, popItem('projicon:' + id, 'i-image', 'Trocar foto') + popItem('projshuffle:' + id, 'i-spark', 'Ícone de pixels com cores novas') + '<div class="pop-sep"></div>' + popItem('projdel:' + id, 'i-trash', 'Excluir projeto'), { align: 'end' });
      return;
    }


    // Três pontos da conversa no projeto: excluir, ou trocar o menu pela lista de projetos para mover.
    const pcm = t.closest('[data-pconv-menu]');
    if (pcm) {
      const id = pcm.dataset.pconvMenu;
      openPop(pcm, `<button class="pop-item" data-pconv-move="${id}">${icon('i-folder')}<span class="grow">Mover para outro projeto</span>${icon('i-chev', 'i pop-next')}</button>` + popItem('pconvdel:' + id, 'i-trash', 'Excluir conversa'), { align: 'end' });
      return;
    }
    const pmv = t.closest('[data-pconv-move]');
    if (pmv) {
      const cid = pmv.dataset.pconvMove;
      const others = state.projects.filter(x => x.id !== state.projectView);
      popover.innerHTML = `<div class="pop-label pop-label-back"><button class="icon-btn" data-pconv-back="${cid}" aria-label="Voltar">${icon('i-chev')}</button>Mover para</div>
        <div class="pop-scroll">${others.map(x => `<button class="pop-item" data-move-to="${x.id}" data-move-conv="${cid}">${projIcon(x)}<span class="grow">${esc(x.name)}</span></button>`).join('')}</div>
        <div class="pop-sep"></div><button class="pop-item" data-move-to="" data-move-conv="${cid}">${icon('i-compose')}<span class="grow">Tirar do projeto<small>Vai para o histórico da barra lateral</small></span></button>`;
      mountPixelIcons(popover);
      placePop();
      return;
    }
    const pback = t.closest('[data-pconv-back]');
    if (pback) { const a = popAnchor; closePop(); a.click(); return; }
    const mv = t.closest('[data-move-conv]');
    if (mv) {
      const c = state.convs.find(x => x.id === mv.dataset.moveConv);
      const to = projectById(mv.dataset.moveTo);
      const from = projectById(state.projectView);
      if (to) { c.project = to.id; touchProject(to); } else delete c.project;
      touchProject(from);
      saveConvs();
      renderHistory();
      closePop();
      openProject(from.id);
      toast(to ? `Conversa movida para ${to.name}.` : 'Conversa foi para o histórico.');
      return;
    }

    const pfrm = t.closest('[data-proj-file-rm]');
    if (pfrm) {
      const p = projectById(state.projectView);
      p.files.splice(+pfrm.dataset.projFileRm, 1);
      touchProject(p);
      openProject(p.id);
      return;
    }

    const stab = t.closest('[data-stab]');
    if (stab) {
      $$('[data-stab]').forEach(b => b.setAttribute('aria-selected', String(b === stab)));
      $('#setBody').innerHTML = settingsTab(stab.dataset.stab);
      return;
    }
    const sw = t.closest('[data-pref]');
    if (sw) {
      const k = sw.dataset.pref;
      state.prefs[k] = !state.prefs[k];
      sw.setAttribute('aria-checked', String(state.prefs[k]));
      store.set('skynet-prefs', state.prefs);
      if (k === 'noHistory') {
        // Religar o histórico salva também a conversa aberta agora.
        if (!state.prefs.noHistory) { state.convs.forEach(c => { delete c.temp; }); saveConvs(); }
        renderTemp();
        toast(state.prefs.noHistory ? 'Histórico desligado. Novas conversas não ficam salvas.' : 'Histórico ligado de novo.');
      }
      return;
    }
    const st = t.closest('[data-style]');
    if (st) { $$('[data-style]').forEach(b => b.setAttribute('aria-checked', String(b === st))); return; }

    const pal = t.closest('[data-pal]');
    if (pal) { runPal(+pal.dataset.pal); return; }

    const a = t.closest('[data-action]');
    if (!a) return;
    const msgEl = a.closest('.msg');
    switch (a.dataset.action) {
      case 'new-chat': e.preventDefault(); newChat(); break;
      case 'toggle-sidebar': toggleSidebar(); break;
      case 'open-drawer': openDrawer(); break;
      case 'close-drawer': closeDrawer(); break;
      case 'palette': openModal('palette'); break;
      case 'model-menu': modelMenu(a); break;
      case 'effort': effortMenu(a); break;
      case 'prompt-new': openModal('promptNew'); break;
      case 'otp-paste': {
        const fill = txt => { const d = (txt || '').replace(/\D/g, '').slice(0, 12); $('#otpInput').value = (d.match(/.{1,4}/g) || []).join('-'); $('#otpInput').focus(); paintOtp(d); };
        if (navigator.clipboard?.readText) navigator.clipboard.readText().then(fill).catch(() => { $('#otpInput').focus(); toast('Cole com Ctrl+V ou ⌘V.'); });
        else { $('#otpInput').focus(); toast('Cole com Ctrl+V ou ⌘V.'); }
        break;
      }
      case 'projects': openProjects(state.view === 'chat'); break;
      case 'proj-edit': {
        const p = projectById(state.projectView);
        $('#pjInstr').outerHTML = `<form class="pj-edit" id="projInstrForm"><textarea name="t" maxlength="600" placeholder="Ex.: responda em tom formal e cite as fontes.">${esc(p.desc || '')}</textarea><div><button class="btn btn-primary btn-sm" type="submit">Salvar</button></div></form>`;
        $('#projInstrForm textarea').focus();
        break;
      }
      case 'proj-file': fileTarget = 'project'; $('#fileInput').click(); break;
      case 'np-shuffle': newProj.seed = Math.floor(Math.random() * 1e9); newProj.icon = null; paintNewProjIcon(); break;
      case 'np-upload': pickIcon(url => { newProj.icon = url; paintNewProjIcon(); }); break;
      case 'effort-models': effortView('models'); break;
      case 'effort-reset': setModel('rapido', true); break;
      case 'clear-agent': setAgent(null); input.focus(); break;
      case 'leave-session': setSession(null); input.focus(); break;
      case 'open-data': openModal('settings', 'dados'); break;
      case 'copy-session':
        copy('https://skynetchat.net/g/' + a.dataset.code);
        toast(`Link da sessão ${a.dataset.code} copiado.`);
        break;
      case 'share-invite': {
        const data = { title: 'SKYNETchat', text: 'Tô usando o SKYNETchat, um chat de IA em português. Entra pelo meu link:', url: 'https://skynetchat.net/convite/SKY-7Q4M' };
        if (navigator.share) navigator.share(data).catch(() => {});
        else { copy(data.url); toast('Link de convite copiado.'); }
        break;
      }
      case 'subscribe':
        setPlan('pro');
        closeModal();
        toast('Pro ativado nesta prévia. O pagamento entra com o back-end.');
        break;
      case 'downgrade':
        setPlan('free');
        closeModal();
        toast('Você voltou para o Free.');
        break;
      case 'plus-menu': plusMenu(a); break;
      case 'more-menu': moreMenu(a); break;
      case 'account': state.user ? openModal('settings') : openModal('login'); break;
      case 'share':
        copy(location.href);
        toast(current() ? 'Link da conversa copiado.' : 'Link copiado.');
        break;
      case 'close-modal': closeModal(); break;
      case 'clear-mode': setMode(state.mode); break;
      case 'dictate': dictate(); break;
      case 'close-voice': closeVoice(); break;
      case 'to-bottom': scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' }); break;
      case 'copy-code': {
        copy(a.closest('.codeblock').querySelector('code').innerText);
        $('span', a).textContent = 'Copiado';
        setTimeout(() => { $('span', a).textContent = 'Copiar'; }, 1600);
        break;
      }
      case 'copy-msg': {
        const m = msgEl._msg;
        copy(m.kind === 'group' ? m.parts.join('\n\n') : m.text);
        a.innerHTML = icon('i-check');
        setTimeout(() => { a.innerHTML = icon('i-copy'); }, 1400);
        break;
      }
      case 'edit-msg':
        input.value = msgEl._msg.text;
        autosize();
        input.focus();
        break;
      case 'speak': speak(msgEl._msg.kind === 'group' ? msgEl._msg.parts.join(' ') : msgEl._msg.text, a); break;
      case 'like':
      case 'dislike': {
        const on = !a.classList.contains('is-on');
        $$('[data-action="like"],[data-action="dislike"]', msgEl).forEach(b => b.classList.remove('is-on'));
        a.classList.toggle('is-on', on);
        if (on) toast(a.dataset.action === 'like' ? 'Valeu pelo retorno.' : 'Obrigado. Isso ajuda a melhorar as respostas.');
        break;
      }
      case 'regen': {
        if (state.streaming) return;
        const c = current();
        if (!c) return;
        const idx = c.messages.indexOf(msgEl._msg);
        const prevUser = [...c.messages.slice(0, idx)].reverse().find(m => m.role === 'user');
        if (!prevUser) return;
        c.messages.splice(idx, 1);
        msgEl.remove();
        respond(c, prevUser.text);
        break;
      }
      case 'toggle-think': {
        const open = a.getAttribute('aria-expanded') !== 'true';
        a.setAttribute('aria-expanded', String(open));
        a.nextElementSibling.hidden = !open;
        break;
      }
      case 'copy-invite':
        copy('https://skynetchat.net/convite/SKY-7Q4M');
        toast('Link de convite copiado.');
        break;
      case 'monetize-join': closeModal(); toast('Pedido recebido. Avisamos quando abrir.'); break;
      case 'start-chat': closeModal(); newChat(); break;
      case 'save-perso': {
        state.prefs.name = $('#pName').value.trim();
        state.prefs.about = $('#pAbout').value.trim();
        state.prefs.style = ($('[data-style][aria-checked="true"]') || {}).dataset?.style || 'equilibradas';
        store.set('skynet-prefs', state.prefs);
        greet();
        toast('Personalização salva.');
        break;
      }
    }
  });

  /* Segurar para confirmar: o botão enche de vermelho e só age quando completa */
  const HOLD_MS = 1400;
  let hold = null;
  function holdStart(btn) {
    if (hold) return;
    const t0 = performance.now();
    hold = { btn, raf: 0 };
    btn.classList.add('is-holding');
    const tick = now => {
      const p = Math.min(1, (now - t0) / HOLD_MS);
      btn.style.setProperty('--p', p);
      if (p >= 1) holdEnd(true);
      else hold.raf = requestAnimationFrame(tick);
    };
    hold.raf = requestAnimationFrame(tick);
  }
  function holdEnd(done) {
    if (!hold) return;
    const { btn } = hold;
    cancelAnimationFrame(hold.raf);
    hold = null;
    btn.classList.remove('is-holding');
    if (!done) { btn.style.setProperty('--p', 0); return; }
    if (btn.dataset.hold === 'wipe') {
      state.convs = [];
      saveConvs();
      newChat();
      $('#setBody').innerHTML = settingsTab('dados');
      toast('Histórico apagado.');
    }
  }
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-hold]');
    if (b && e.button === 0) { e.preventDefault(); holdStart(b); }
  });
  document.addEventListener('pointerup', () => holdEnd(false));
  document.addEventListener('pointercancel', () => holdEnd(false));
  document.addEventListener('pointerout', e => { if (hold && e.target === hold.btn && !hold.btn.contains(e.relatedTarget)) holdEnd(false); });
  document.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && e.target.matches?.('[data-hold]')) { e.preventDefault(); holdStart(e.target); } });
  document.addEventListener('keyup', e => { if ((e.key === ' ' || e.key === 'Enter') && e.target.matches?.('[data-hold]')) holdEnd(false); });

  document.addEventListener('submit', e => {
    if (e.target.id === 'loginForm') {
      e.preventDefault();
      const email = e.target.email.value.trim();
      const raw = email.split('@')[0].replace(/[._\-\d]+/g, ' ').trim().split(' ')[0];
      const first = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : '';
      login(first || email, email, first);
    } else if (e.target.id === 'supportForm') {
      e.preventDefault();
      const tp = SUPPORT_TOPICS.find(x => x[0] === $('[data-topic][aria-checked="true"]')?.dataset.topic);
      closeModal();
      toast(`Mensagem sobre "${tp ? tp[2] : 'Suporte'}" enviada. Respondemos no seu e-mail.`);
    } else if (e.target.id === 'codeForm') {
      e.preventDefault();
      const d = otpDigits();
      const err = d.length !== 12 ? 'O código tem 12 dígitos.' : !tsToken ? 'Confirme a verificação da Cloudflare.' : '';
      if (err) { const o = $('#otp'); o.classList.remove('is-err'); void o.offsetWidth; o.classList.add('is-err'); $('#otpMeta').textContent = err; $('#otpMeta').classList.add('is-err'); return; }
      login('Acesso por código', '', '');
    } else if (e.target.id === 'promptForm') {
      e.preventDefault();
      const title = e.target.title.value.trim(), text = e.target.text.value.trim();
      if (!title || !text) return;
      state.myPrompts.unshift({ id: uid(), title, text });
      store.set('skynet-myprompts', state.myPrompts);
      promptCat = MINE;
      openModal('prompts');
      toast('Prompt salvo em Meus.');
    } else if (e.target.id === 'sessionForm') {
      e.preventDefault();
      const name = e.target.name.value.trim();
      if (!name) return;
      const s = { id: uid(), name, code: newCode(), people: ['Você'], max: SESSION_MAX, host: true, updated: Date.now() };
      state.sessions.unshift(s);
      saveSessions();
      openModal('lobby', s);
    } else if (e.target.id === 'joinForm') {
      e.preventDefault();
      const code = normCode(e.target.code.value);
      const err = code ? joinSession(code) : 'Confira o código. Ele tem o formato SKY-0000.';
      if (err) { $('#gsHint').textContent = err; $('#gsHint').classList.add('is-err'); }
    } else if (e.target.id === 'projForm') {
      e.preventDefault();
      const name = e.target.name.value.trim();
      if (!name) return;
      const proj = { id: uid(), name, seed: newProj.seed, color: pixelIconColor(newProj.seed), icon: newProj.icon, desc: e.target.desc.value.trim(), files: [], created: Date.now(), updated: Date.now() };
      state.projects.unshift(proj);
      saveProjects();
      closeModal();
      openProject(proj.id);
      toast('Projeto criado.');
    } else if (e.target.id === 'projChat') {
      e.preventDefault();
      const q = e.target.q.value.trim();
      if (!q) return;
      const pid = e.target.dataset.projId;
      newChat();
      state.project = pid;
      renderChips();
      send(q);
    } else if (e.target.id === 'projInstrForm') {
      e.preventDefault();
      const p = projectById(state.projectView);
      p.desc = e.target.t.value.trim();
      touchProject(p);
      openProject(p.id);
      toast('Instruções salvas.');
    }
  });

  document.addEventListener('change', e => {
    const s = e.target.closest('[data-pref-select]');
    if (s) { state.prefs[s.dataset.prefSelect] = s.value; store.set('skynet-prefs', state.prefs); }
  });

  document.addEventListener('input', e => {
    const id = e.target.id;
    if (id === 'palInput') renderPalette(e.target.value);
    else if (id === 'promptSearch') {
      const q = e.target.value.trim();
      $$('[data-ptab]').forEach(b => b.setAttribute('aria-selected', String(!q && b.dataset.ptab === promptCat)));
      $('#promptList').classList.toggle('is-typing', !!q);
      $('#promptList').innerHTML = promptCards(promptCat, q);
    } else if (id === 'otpInput') {
      const d = e.target.value.replace(/\D/g, '').slice(0, 12);
      e.target.value = (d.match(/.{1,4}/g) || []).join('-');
      paintOtp(d);
    } else if (id === 'projSearch') {
      $('#pjGrid').innerHTML = projectCards(e.target.value);
      mountPixelIcons($('#pjGrid'));
    } else if (id === 'pfText') {
      $('#pfPreview').innerHTML = promptPreview(e.target.value);
    } else if (id === 'agentSearch') {
      $('#agentList').classList.toggle('is-typing', !!e.target.value.trim());
      $('#agentList').innerHTML = agentRows(e.target.value);
    } else if (e.target.name === 'code' && e.target.closest('#joinForm')) $('#gsHint').classList.remove('is-err');
  });

  const otpDigits = () => ($('#otpInput')?.value || '').replace(/\D/g, '');
  function paintOtp(d) {
    $('#otp').classList.toggle('is-full', d.length === 12);
    $('#otp').classList.remove('is-err');
    $('#otpMeta').classList.remove('is-err');
    $('#otpMeta').innerHTML = d.length === 12 ? `${icon('i-check')}Código completo` : `${d.length} de 12 dígitos`;
    otpReady();
  }
  const otpReady = () => { const b = $('#otpBtn'); if (b) b.disabled = !(otpDigits().length === 12 && tsToken); };

  /* Cloudflare Turnstile no login por código.
     Esta é a chave de teste da Cloudflare, que sempre aprova; ao publicar, trocar pela chave do site
     e validar o token no servidor (siteverify) antes de aceitar o código. */
  const TURNSTILE_KEY = '1x00000000000000000000AA';
  let tsLoad = null, tsToken = null, tsWidget = null;
  function loadTurnstile() {
    tsLoad = tsLoad || new Promise((ok, fail) => {
      const sc = document.createElement('script');
      sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      sc.async = true;
      sc.onload = () => ok(window.turnstile);
      sc.onerror = () => { tsLoad = null; fail(); };
      document.head.appendChild(sc);
    });
    return tsLoad;
  }
  function mountTurnstile() {
    tsToken = null;
    const box = $('#tsBox');
    loadTurnstile().then(ts => {
      if (!box.isConnected) return;
      box.innerHTML = '';
      try {
        tsWidget = ts.render(box, {
          sitekey: TURNSTILE_KEY,
          theme: getTheme() === 'light' ? 'light' : 'dark',
          size: 'normal',
          language: 'pt-br',
          callback: tok => { tsToken = tok; otpReady(); },
          'expired-callback': () => { tsToken = null; otpReady(); },
          'error-callback': () => { tsUnavailable(); return true; },
        });
      } catch (e) { tsUnavailable(); }
    }).catch(tsUnavailable);
  }
  // Sem a Cloudflare (sem internet ou aberto como arquivo), a prévia avisa e deixa seguir para dar para testar o resto.
  function tsUnavailable() {
    const box = $('#tsBox');
    if (!box) return;
    box.innerHTML = `<p class="ts-note">${icon('i-info')}A verificação da Cloudflare não carregou. Nesta prévia o login segue sem ela.</p>`;
    tsToken = 'preview';
    otpReady();
  }
  function dropTurnstile() {
    if (tsWidget != null) { try { window.turnstile?.remove(tsWidget); } catch (e) {} }
    tsWidget = null;
    tsToken = null;
  }
  // Editando as instruções do projeto: clicar fora (sem ser no Salvar) ou apertar Esc descarta e volta ao texto salvo.
  document.addEventListener('focusout', e => {
    const f = e.target.closest?.('#projInstrForm');
    if (f && !f.contains(e.relatedTarget)) setTimeout(() => { if (f.isConnected) openProject(state.projectView); }, 0);
  });

  function fillInput(text) {
    input.value = text;
    autosize();
    input.focus();
    const a = text.indexOf('['), b = text.indexOf(']', a);
    if (a >= 0 && b > a) input.setSelectionRange(a, b + 1);
    else input.setSelectionRange(text.length, text.length);
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  /* ---------------- Teclado ---------------- */
  document.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); modalLayer.hidden ? openModal('palette') : closeModal(); return; }
    if (mod && e.shiftKey && e.key.toLowerCase() === 'o') { e.preventDefault(); newChat(); return; }
    if (e.key === 'Escape') {
      if (e.target.closest?.('#projInstrForm')) return openProject(state.projectView);
      if (!$('#voice').hidden) return closeVoice();
      if (!popover.hidden) return closePop();
      if (!modalLayer.hidden) return closeModal();
      if (app.classList.contains('drawer-open')) return closeDrawer();
      if (state.streaming) state.abort = true;
      return;
    }
    if (e.key === 'Enter' && e.target.matches?.('div[data-prompt]')) { e.preventDefault(); e.target.click(); return; }
    if (e.key === 'Enter' && (e.target.id === 'promptSearch' || e.target.id === 'agentSearch')) {
      e.preventDefault();
      $('#promptList .prompt-card, #agentList .ag-row')?.click();
      return;
    }
    if (modal.dataset.name === 'palette' && !modalLayer.hidden) {
      if (e.key === 'ArrowDown') { e.preventDefault(); palIndex = Math.min(palItems.length - 1, palIndex + 1); hlPalette(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); palIndex = Math.max(0, palIndex - 1); hlPalette(); }
      if (e.key === 'Enter') { e.preventDefault(); runPal(palIndex); }
      return;
    }
    if (e.key === '/' && !mod && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && modalLayer.hidden) { e.preventDefault(); input.focus(); }
  });

  window.addEventListener('resize', closePop);

  /* ---------------- Início ---------------- */
  if (store.get('skynet-sb-collapsed', false) && innerWidth > 860) app.classList.add('sb-collapsed');
  paintMarks();
  applyTheme(getTheme());
  renderSuggestions();
  renderModel();
  renderTemp();
  renderAccount();
  renderUsage();
  greet();
  showEmpty();
  autosize();
  if (matchMedia('(hover: hover)').matches) input.focus();
})();
