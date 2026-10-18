/* 1. Menu mobile (botão hambúrguer) */
const menuBotao = document.getElementById("menuBotao");
const menuPrincipal = document.getElementById("menuPrincipal");

menuBotao.addEventListener("click", function () {
    const aberto = menuPrincipal.classList.toggle("aberto");
    menuBotao.setAttribute("aria-expanded", aberto);
});

/* Fecha o menu ao escolher um link (as seções estão na mesma página) */
menuPrincipal.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
        menuPrincipal.classList.remove("aberto");
        menuBotao.setAttribute("aria-expanded", false);
    });
});

/* 2. Animação do botão de busca (visível só no desktop) */
const busca = document.getElementById("busca");
const campoBusca = document.getElementById("campoBusca");
const botaoBusca = document.getElementById("botaoBusca");
const desktop = window.matchMedia("(min-width: 1024px)");

function definirBusca(aberta) {
    busca.classList.toggle("ativa", aberta);
    botaoBusca.setAttribute("aria-expanded", aberta);
    if (aberta) {
        campoBusca.focus();
    }
}

busca.addEventListener("submit", function (evento) {
    evento.preventDefault(); /* ainda não há página de resultados */

    if (desktop.matches) {
        definirBusca(!busca.classList.contains("ativa"));
    }
});

campoBusca.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && desktop.matches) {
        definirBusca(false);
        botaoBusca.focus();
    }
});

/* 3. Formulário de contato (validação HTML5 + mensagem de retorno) */
const formContato = document.getElementById("formContato");
const statusForm = document.getElementById("statusForm");

formContato.addEventListener("submit", function (evento) {
    evento.preventDefault();


    const campos = formContato.querySelectorAll("input, select, textarea");
    let primeiroInvalido = null;

    campos.forEach(function (campo) {
        const valido = campo.checkValidity();
        campo.classList.toggle("invalido", !valido);
        campo.setAttribute("aria-invalid", !valido);
        if (!valido && !primeiroInvalido) {
            primeiroInvalido = campo;
        }
    });

    if (primeiroInvalido) {
        statusForm.textContent = "Confira os campos destacados e tente novamente.";
        statusForm.classList.add("erro");
        primeiroInvalido.focus();
        return;
    }

    statusForm.textContent = "Mensagem enviada! Em breve entraremos em contato.";
    statusForm.classList.remove("erro");
    formContato.reset();
});

/* 4. Aviso de cookies (LGPD) */
const cookies = document.getElementById("cookies");
const cookiesAceitar = document.getElementById("cookiesAceitar");

function cookiesJaAceitos() {
    try {
        return localStorage.getItem("ecovocacao-cookies") === "ok";
    } catch (erro) {
        return false;
    }
}

if (!cookiesJaAceitos()) {
    cookies.hidden = false;
}

cookiesAceitar.addEventListener("click", function () {
    try {
        localStorage.setItem("ecovocacao-cookies", "ok");
    } catch (erro) {
        /* sem armazenamento: o aviso só fecha nesta visita */
    }
    cookies.hidden = true;
});

/* 5. Ano atual no rodapé */
document.getElementById("ano").textContent = new Date().getFullYear();
