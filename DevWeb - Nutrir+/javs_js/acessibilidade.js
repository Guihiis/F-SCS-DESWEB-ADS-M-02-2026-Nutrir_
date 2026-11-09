(function () {
    'use strict';
 
    var CHAVE = 'nutrirAcessibilidade';
    var raiz = document.documentElement;
    var PADRAO = { dalt: 'nenhum', simular: false, fonte: 100, contraste: false, movimento: false };
    var estado = Object.assign({}, PADRAO);
 
    try {
        Object.assign(estado, JSON.parse(localStorage.getItem(CHAVE) || '{}'));
    } catch (e) { /* sem armazenamento: segue com o padrão */ }
 
    function salvar() {
        try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {}
    }

    var SIM = {
        protanopia:   [[0.567, 0.433, 0],     [0.558, 0.442, 0],     [0, 0.242, 0.758]],
        deuteranopia: [[0.625, 0.375, 0],     [0.7, 0.3, 0],         [0, 0.3, 0.7]],
        tritanopia:   [[0.95, 0.05, 0],       [0, 0.433, 0.567],     [0, 0.475, 0.525]]
    };
    var DESLOCA = {
        protanopia:   [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]],
        deuteranopia: [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]],
        tritanopia:   [[1, 0, 0.7], [0, 1, 0.7], [0, 0, 0]]
    };
 
    function corrigir(tipo) {
        var S = SIM[tipo], M = DESLOCA[tipo], C = [], i, j, k;
        for (i = 0; i < 3; i++) {
            C[i] = [];
            for (j = 0; j < 3; j++) {
                var erro = 0;
                for (k = 0; k < 3; k++) {
                    erro += M[i][k] * ((k === j ? 1 : 0) - S[k][j]);
                }
                C[i][j] = (i === j ? 1 : 0) + erro;
            }
        }
        return C;
    }
 
    function texto(m) {
        return m.map(function (l) { return l.join(' ') + ' 0 0'; }).join(' ') + ' 0 0 0 1 0';
    }
 
    /* ---- SVG com os filtros, criado pelo script (nenhuma página precisa dele) ---- */
    function criarFiltros() {
        if (document.getElementById('filtros-acessibilidade')) return;
        var html = '<svg id="filtros-acessibilidade" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">';
        Object.keys(SIM).forEach(function (t) {
            html += '<filter id="corrigir-' + t + '" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="' + texto(corrigir(t)) + '"/></filter>';
            html += '<filter id="simular-' + t + '" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="' + texto(SIM[t]) + '"/></filter>';
        });
        html += '</svg>';
        document.body.insertAdjacentHTML('beforeend', html);
    }
 
    function criarEstilo() {
        if (document.getElementById('estilo-acessibilidade')) return;
        var s = document.createElement('style');
        s.id = 'estilo-acessibilidade';
        s.textContent = 'html.sem-movimento, html.sem-movimento *, html.sem-movimento *::before, html.sem-movimento *::after' +
            '{animation:none !important;transition:none !important;scroll-behavior:auto !important}';
        document.head.appendChild(s);
    }
 
    /* ---- Aplicação ---- */
    function aplicar() {
        var filtros = [];
        if (estado.dalt !== 'nenhum') {
            filtros.push('url(#' + (estado.simular ? 'simular-' : 'corrigir-') + estado.dalt + ')');
        }
        if (estado.contraste) filtros.push('contrast(1.35)');
 
        raiz.style.filter = filtros.join(' ');
        raiz.style.fontSize = estado.fonte + '%';
        raiz.classList.toggle('sem-movimento', estado.movimento);
    }
 
    /* ---- Painel (só existe na página Acessibilidade) ---- */
    var NOMES = { protanopia: 'Protanopia', deuteranopia: 'Deuteranopia', tritanopia: 'Tritanopia' };
 
    function atualizarPainel(mensagem) {
        document.querySelectorAll('[data-dalt]').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.dataset.dalt === estado.dalt));
        });
        document.querySelectorAll('[data-alternar]').forEach(function (b) {
            b.setAttribute('aria-pressed', String(!!estado[b.dataset.alternar]));
        });
        var s = document.getElementById('statusAcess');
        if (s && mensagem) s.textContent = mensagem;
    }
 
    function ligarPainel() {
        var painel = document.querySelector('.painel');
        if (!painel) return;
 
        painel.addEventListener('click', function (e) {
            var b = e.target.closest('button');
            if (!b) return;
 
            if (b.dataset.dalt) {
                estado.dalt = b.dataset.dalt;
                atualizarMsg(estado.dalt === 'nenhum' ? 'Modo para daltonismo desativado.'
                    : 'Modo ' + NOMES[estado.dalt] + (estado.simular ? ' (simulação)' : '') + ' ativado.');
            } else if (b.dataset.fonte) {
                if (b.dataset.fonte === 'mais') estado.fonte = Math.min(150, estado.fonte + 10);
                if (b.dataset.fonte === 'menos') estado.fonte = Math.max(90, estado.fonte - 10);
                if (b.dataset.fonte === 'padrao') estado.fonte = 100;
                atualizarMsg('Tamanho do texto: ' + estado.fonte + '%.');
            } else if (b.dataset.alternar) {
                var k = b.dataset.alternar;
                estado[k] = !estado[k];
                if (k === 'simular' && estado.dalt === 'nenhum') {
                    atualizarMsg('Escolha um tipo de daltonismo para ver a simulação.');
                } else {
                    atualizarMsg((b.textContent.trim().split(':')[0]) + (estado[k] ? ' ativado.' : ' desativado.'));
                }
            } else if (b.hasAttribute('data-resetar')) {
                estado = Object.assign({}, PADRAO);
                atualizarMsg('Ajustes restaurados para o padrão.');
            } else {
                return;
            }
            salvar();
            aplicar();
        });
 
        function atualizarMsg(m) { atualizarPainel(m); }
        atualizarPainel('');
    }
 
    function iniciar() {
        criarFiltros();
        criarEstilo();
        aplicar();
        ligarPainel();
    }
 
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
 