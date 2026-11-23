(function () {
    'use strict';

    var CHAVE_MENSAGENS = 'nutrir_mensagens';
    var CHAVE_RASCUNHO = 'nutrir_rascunho_contato';

    /* ---------- Localiza o formulário da página atual ---------- */
    var form = document.getElementById('formFale') || document.getElementById('formContato');
    if (!form) return;

    var origem = form.id === 'formFale' ? 'contato.html' : 'index.html';
    var status = document.getElementById('statusFale') || document.getElementById('statusForm');

    var campos = {
        nome: document.getElementById('nome'),
        email: document.getElementById('email'),
        assunto: document.getElementById('assunto'),
        mensagem: document.getElementById('mensagem'),
        lgpd: document.getElementById('lgpd')
    };

    /* ---------- Garante um <span> de erro para cada campo ---------- */
    // No contato.html os spans já existem; na index.html são criados aqui.
    function garantirSpanErro(nome) {
        var campo = campos[nome];
        var span = document.getElementById('erro-' + nome);

        if (!span) {
            span = document.createElement('span');
            span.className = 'erro';
            span.id = 'erro-' + nome;
            span.style.color = '#B3261E';
            span.style.fontSize = '0.85rem';
            span.style.fontWeight = '600';

            var caixa = campo.closest('.campo');
            if (nome === 'lgpd' && caixa) {
                // checkbox: o erro fica logo depois da linha do checkbox
                caixa.insertAdjacentElement('afterend', span);
            } else if (caixa) {
                caixa.appendChild(span);
            } else {
                campo.insertAdjacentElement('afterend', span);
            }
        }

        // liga o campo ao seu erro para leitores de tela
        var descricao = campo.getAttribute('aria-describedby');
        if (!descricao || descricao.indexOf(span.id) === -1) {
            campo.setAttribute('aria-describedby', span.id);
        }
        return span;
    }

    Object.keys(campos).forEach(function (nome) {
        if (campos[nome]) garantirSpanErro(nome);
    });

    /* ---------- localStorage (com proteção contra falhas) ---------- */
    function lerStorage(chave, padrao) {
        try {
            var bruto = localStorage.getItem(chave);
            return bruto ? JSON.parse(bruto) : padrao;
        } catch (e) {
            return padrao;
        }
    }

    function gravarStorage(chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
            return true;
        } catch (e) {
            return false;
        }
    }

    function removerStorage(chave) {
        try {
            localStorage.removeItem(chave);
        } catch (e) { /* ignora */ }
    }

    /* ---------- Validação ---------- */
    var regraEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var validadores = {
        nome: function (v) {
            v = v.trim();
            if (!v) return 'Informe seu nome completo.';
            if (v.length < 3) return 'O nome deve ter pelo menos 3 caracteres.';
            return '';
        },
        email: function (v) {
            v = v.trim();
            if (!v) return 'Informe seu e-mail.';
            if (!regraEmail.test(v)) return 'Digite um e-mail válido, como nome@exemplo.com.';
            return '';
        },
        assunto: function (v) {
            if (!v) return 'Selecione um assunto.';
            return '';
        },
        mensagem: function (v) {
            v = v.trim();
            if (!v) return 'Escreva sua mensagem.';
            if (v.length < 10) return 'A mensagem deve ter pelo menos 10 caracteres.';
            return '';
        },
        lgpd: function (marcado) {
            if (!marcado) return 'É necessário concordar para enviar a mensagem.';
            return '';
        }
    };

    function mostrarErro(nome, texto) {
        var campo = campos[nome];
        var spanErro = document.getElementById('erro-' + nome);
        if (spanErro) spanErro.textContent = texto;

        if (texto) {
            campo.setAttribute('aria-invalid', 'true');
            campo.classList.add('invalido');      // classe usada no style-index.css
        } else {
            campo.removeAttribute('aria-invalid');
            campo.classList.remove('invalido');
        }
    }

    function validarCampo(nome) {
        var campo = campos[nome];
        var valor = nome === 'lgpd' ? campo.checked : campo.value;
        var erro = validadores[nome](valor);
        mostrarErro(nome, erro);
        return erro === '';
    }

    function validarTudo() {
        var primeiroInvalido = null;
        Object.keys(campos).forEach(function (nome) {
            if (!validarCampo(nome) && !primeiroInvalido) {
                primeiroInvalido = campos[nome];
            }
        });
        return primeiroInvalido;
    }

    /* ---------- Mensagem de status ---------- */
    function definirStatus(texto, ehErro) {
        if (!status) return;
        status.textContent = texto;
        // 'erro' é a classe do style-index.css; 'erro-status' é a do contato.css
        status.classList.toggle('erro', !!ehErro);
        status.classList.toggle('erro-status', !!ehErro);
    }

    /* ---------- Rascunho automático ---------- */
    function salvarRascunho() {
        gravarStorage(CHAVE_RASCUNHO, {
            nome: campos.nome.value,
            email: campos.email.value,
            assunto: campos.assunto.value,
            mensagem: campos.mensagem.value
        });
    }

    function carregarRascunho() {
        var r = lerStorage(CHAVE_RASCUNHO, null);
        if (!r) return;
        campos.nome.value = r.nome || '';
        campos.email.value = r.email || '';
        campos.assunto.value = r.assunto || '';
        campos.mensagem.value = r.mensagem || '';
    }

    /* ---------- Eventos ---------- */
    Object.keys(campos).forEach(function (nome) {
        var campo = campos[nome];
        var evento = (nome === 'assunto' || nome === 'lgpd') ? 'change' : 'blur';

        campo.addEventListener(evento, function () {
            validarCampo(nome);
        });

        campo.addEventListener('input', function () {
            if (campo.getAttribute('aria-invalid') === 'true') validarCampo(nome);
            if (nome !== 'lgpd') salvarRascunho();
        });
    });

    campos.assunto.addEventListener('change', salvarRascunho);

    form.addEventListener('submit', function (evento) {
        evento.preventDefault();
        definirStatus('', false);

        var primeiroInvalido = validarTudo();
        if (primeiroInvalido) {
            definirStatus('Corrija os campos destacados e tente novamente.', true);
            primeiroInvalido.focus();
            return;
        }

        var mensagens = lerStorage(CHAVE_MENSAGENS, []);
        if (!Array.isArray(mensagens)) mensagens = [];

        mensagens.push({
            id: Date.now(),
            enviadoEm: new Date().toISOString(),
            origem: origem,
            nome: campos.nome.value.trim(),
            email: campos.email.value.trim(),
            assunto: campos.assunto.value,
            mensagem: campos.mensagem.value.trim(),
            lgpd: true
        });

        if (!gravarStorage(CHAVE_MENSAGENS, mensagens)) {
            definirStatus('Não foi possível salvar sua mensagem neste navegador. Tente novamente.', true);
            return;
        }

        removerStorage(CHAVE_RASCUNHO);
        form.reset();
        Object.keys(campos).forEach(function (nome) { mostrarErro(nome, ''); });
        definirStatus('Mensagem enviada com sucesso! Obrigado por entrar em contato, retornaremos em breve.', false);
    });

    form.addEventListener('reset', function () {
        removerStorage(CHAVE_RASCUNHO);
    });

    carregarRascunho();
})();
