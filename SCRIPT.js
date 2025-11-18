const ver = "V1.0";

// Configurações de atraso para as funcionalidades
const featureConfigs = {
    initialDelay:1500,
    subsequentDelays: [500, 1500, 500, 2000]
};

// Configurações das funcionalidades
window.features = {
    autoAnswer: false,
    questionSpoof: true
};

// Função para criar um delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Função para reproduzir áudio
const playAudio = url => {
    const audio = new Audio(url);
    audio.play();
};

// Função para exibir um toast (notificação)
function sendToast(text, duration = 5000, gravity = 'bottom', imageUrl = null, fontSize = '16px', fontFamily = 'Arial, sans-serif', color = '#ffffff') {
    const toast = Toastify({
        text: text,
        duration: duration,
        gravity: gravity,
        position: "center",
        stopOnFocus: true,
        style: {
            background: "#000000",
            fontSize: fontSize,
            fontFamily: fontFamily,
            color: color,
            padding: '10px 20px',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center'
        }
    });

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.width = '20px';
        img.style.height = '20px';
        img.style.marginRight = '10px';
        toast.toastElement.prepend(img);
    }

    toast.showToast();
}

// Função para encontrar e clicar em um elemento por classe
function findAndClickByClass(className) {
    const element = document.getElementsByClassName(className)[0];
    if (element) {
        element.click();
        if (element.textContent === 'Mostrar resumo') {
            sendToast("🐱‍👤 Os menor da Divsa", 3000);
            playAudio('https://r2.e-z.host/4d0a0bea-60f8-44d6-9e74-3032a64a9f32/4x5g14gj.wav');
        }
    }
    return !!element;
}

// Função para carregar um script externo
async function loadScript(url, label) {
    return fetch(url)
        .then(response => response.text())
        .then(script => {
            eval(script);
        });
}

// Função para carregar um arquivo CSS externo
async function loadCss(url) {
    return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        link.onload = () => resolve();
        document.head.appendChild(link);
    });
}

// Função para modificar as questões (spoof)
function spoofQuestion() {
    const phrases = [
        " [⚡Os Menor da Diviza On Top](https://discord.gg/8xVmMBy9k4)!",
        " 🐱‍👤 [@richinnersoul](https://guns.lol/richinnersoul).",
    ];

    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
        let body;
        if (input instanceof Request) body = await input.clone().text();
        else if (init && init.body) body = init.body;

        const originalResponse = await originalFetch.apply(this, arguments);
        const clonedResponse = originalResponse.clone();

        try {
            const responseBody = await clonedResponse.text();
            let responseObj = JSON.parse(responseBody);

            if (responseObj?.data?.assessmentItem?.item?.itemData) {
                let itemData = JSON.parse(responseObj.data.assessmentItem.item.itemData);

                if (itemData.question.content[0] === itemData.question.content[0].toUpperCase()) {
                    itemData.answerArea = {
                        "calculator": false,
                        "chi2Table": false,
                        "periodicTable": false,
                        "tTable": false,
                        "zTable": false
                    };

                    itemData.question.content = phrases[Math.floor(Math.random() * phrases.length)] + `[[☃ radio 1]]`;
                    itemData.question.widgets = {
                        "radio 1": {
                            options: {
                                choices: [
                                    { content: "😈.", correct: true }
                                ]
                            }
                        }
                    };

                    responseObj.data.assessmentItem.item.itemData = JSON.stringify(itemData);
                    sendToast("Contra o sistema 🤬", 3000);

                    return new Response(JSON.stringify(responseObj), {
                        status: originalResponse.status,
                        statusText: originalResponse.statusText,
                        headers: originalResponse.headers
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }

        return originalResponse;
    };
}

// Função para responder automaticamente às questões (versão diagnóstica e robusta)
function autoAnswer() {
    (async () => {

        // helper delay (define caso não exista)
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // helper para clicar com múltiplas estratégias
        function clickElement(el) {
            if (!el) return false;
            try {
                // tentativa padrão
                el.click();
                return true;
            } catch (e) {
                // fallback: disparar eventos de mouse
                try {
                    const evOpts = { bubbles: true, cancelable: true, view: window };
                    el.dispatchEvent(new MouseEvent('mousedown', evOpts));
                    el.dispatchEvent(new MouseEvent('mouseup', evOpts));
                    el.dispatchEvent(new MouseEvent('click', evOpts));
                    return true;
                } catch (err) {
                    console.warn("clickElement: falha ao dispatch events:", err);
                    return false;
                }
            }
        }

        // ---- Clicar na alternativa (A, B, C ou D) ----
        function clickAnswer() {
            try {
                const buttons = document.querySelectorAll('button[aria-label^="(Escolha"], button[role="button"][aria-pressed], button[data-choice-id], [data-choice]');

                for (const btn of buttons) {
                    const pressed = btn.getAttribute("aria-pressed");
                    // aceita both "false" string or absence (clicável)
                    if (pressed === "false" || pressed === null || pressed === undefined) {
                        console.log("clickAnswer: clicando alternativa:", btn);
                        clickElement(btn);
                        return true;
                    }
                }
            } catch (e) {
                console.error("clickAnswer erro:", e);
            }
            return false;
        }

        // ---- Clicar no botão Verificar / Próximo ----
        function clickCheckOrNext() {
            try {
                // tenta seletor já conhecido
                let btn = document.querySelector('button[data-testid="exercise-check-answer"]');

                // fallback por texto (p.ex. "Verificar", "Check", "Submit")
                if (!btn) {
                    const candidates = [...document.querySelectorAll("button, [role='button']")];
                    btn = candidates.find(el => {
                        const txt = (el.textContent || "").trim().toLowerCase();
                        return txt.includes("verificar") || txt.includes("check") || txt.includes("enviar") || txt.includes("submit");
                    });
                }

                if (btn) {
                    const ariaDisabled = btn.getAttribute("aria-disabled");
                    const disabled = btn.disabled || ariaDisabled === "true" || ariaDisabled === "True";
                    if (!disabled) {
                        console.log("clickCheckOrNext: clicando em verificar:", btn);
                        clickElement(btn);
                        return true;
                    } else {
                        console.log("clickCheckOrNext: botão verificar desabilitado");
                    }
                } else {
                    console.log("clickCheckOrNext: botão verificar não encontrado");
                }

            } catch (e) {
                console.error("clickCheckOrNext erro:", e);
            }
            return false;
        }

        // ---- Procurar o botão "Próxima pergunta" com várias estratégias ----
        function findNextButton() {
            // seletor exato principal
            let btn = document.querySelector('button[data-testid="exercise-next-question"]');
            if (btn) return btn;

            // procurar por botão que contenha um child com texto "próxima pergunta"
            const candidates = [...document.querySelectorAll("button, [role='button'], [data-testid]")];
            btn = candidates.find(el => {
                const txt = (el.textContent || "").trim().toLowerCase();
                return (
                    txt.includes("próxima pergunta") ||
                    txt.includes("próxima questão") ||
                    txt.includes("continuar") ||
                    txt.includes("tentar novamente") ||
                    txt.includes("refazer") ||
                    (txt.includes("próximo") && !txt.includes("item do curso")) // heurística
                );
            });

            if (btn) return btn;

            // busca por um filho com texto específico (caso o texto esteja em um div interno)
            const all = [...document.querySelectorAll("button")];
            for (const b of all) {
                const inner = b.querySelector("*");
                if (inner && (inner.textContent || "").trim().toLowerCase().includes("próxima pergunta")) {
                    return b;
                }
            }

            return null;
        }

        // ---- Clicar no botão "Próxima pergunta" usando MutationObserver para aguardar aparecimento ----
        async function clickNextQuestionRobust(timeoutMs = 6000) {
            console.log("clickNextQuestionRobust: procurando botão imediatamente...");
            // tentativa imediata
            let btn = findNextButton();
            if (btn && !btn.disabled) {
                console.log("clickNextQuestionRobust: achou imediatamente:", btn);
                clickElement(btn);
                return true;
            }

            // se não achou, observa mutações por até timeoutMs
            return await new Promise(resolve => {
                const start = Date.now();
                let resolved = false;

                const observer = new MutationObserver((mutations) => {
                    if (resolved) return;
                    const found = findNextButton();
                    if (found && !found.disabled) {
                        resolved = true;
                        observer.disconnect();
                        console.log("clickNextQuestionRobust: botão apareceu via MutationObserver:", found);
                        clickElement(found);
                        resolve(true);
                    } else if (Date.now() - start > timeoutMs) {
                        resolved = true;
                        observer.disconnect();
                        console.warn("clickNextQuestionRobust: timeout aguardando botão (", timeoutMs, "ms )");
                        resolve(false);
                    }
                });

                // observa mudanças no body subtree (inserções/remocões)
                observer.observe(document.body, { childList: true, subtree: true, characterData: true });

                // fallback: polling corto enquanto observer espera (garante que se já apareceu será clicado)
                (async function polling() {
                    while (!resolved && Date.now() - start <= timeoutMs) {
                        const found = findNextButton();
                        if (found && !found.disabled) {
                            resolved = true;
                            observer.disconnect();
                            console.log("clickNextQuestionRobust: botão apareceu via polling:", found);
                            clickElement(found);
                            resolve(true);
                            return;
                        }
                        await delay(150);
                    }
                    if (!resolved) {
                        resolved = true;
                        observer.disconnect();
                        console.warn("clickNextQuestionRobust: polling também expirou");
                        resolve(false);
                    }
                })();
            });
        }

        // ---- Loop principal (mantive sua lógica, só acrescentei logs e robustez) ----
        while (true) {

            try {
                if (window.features && window.features.autoAnswer && window.features.questionSpoof) {

                    console.log("autoAnswer: ciclo iniciado");

                    // delay inicial
                    await delay((featureConfigs && featureConfigs.initialDelay) ? featureConfigs.initialDelay : 200);

                    // clicar na alternativa
                    const answered = clickAnswer();

                    if (answered) {

                        // delay entre clicar na resposta e no botão "Verificar"
                        const subsequentDelays = (featureConfigs && featureConfigs.subsequentDelays) ? featureConfigs.subsequentDelays : [300, 400, 500];
                        const nextDelay = subsequentDelays[Math.floor(Math.random() * subsequentDelays.length)];

                        console.log("autoAnswer: aguardando", nextDelay, "ms antes de verificar");
                        await delay(nextDelay);

                        // clicar no botão "Verificar" / "Próximo"
                        const clickedCheck = clickCheckOrNext();
                        if (!clickedCheck) {
                            console.log("autoAnswer: não conseguiu clicar em Verificar (pode estar desabilitado). Vou tentar novamente mais tarde.");
                        }

                        // aguardar a troca de tela / modal / animação — e procurar ativamente o botão "próxima"
                        await delay(250); // breve pausa antes de começar a observar
                        const ok = await clickNextQuestionRobust(6000); // espera até 6s
                        console.log("autoAnswer: resultado tentativa nextQuestion:", ok);

                        if (!ok) {
                            // se não conseguiu achar/entrar, tenta clicar no "próximo" do canto superior/inferior (estratégia extra)
                            console.log("autoAnswer: tentativa alternativa de encontrar 'Próximo' genérico...");
                            const generic = [...document.querySelectorAll("button, [role='button']")]
                                .find(el => ((el.textContent||"").trim().toLowerCase().includes("próximo") || (el.textContent||"").trim().toLowerCase().includes("continuar")));
                            if (generic && !generic.disabled) {
                                console.log("autoAnswer: clicando botão genérico:", generic);
                                clickElement(generic);
                                await delay(200);
                            } else {
                                console.warn("autoAnswer: nenhum botão genérico encontrado como fallback.");
                            }
                        }
                    } else {
                        // se não encontrou alternativa, esperar um pouco antes de tentar novamente
                        console.log("autoAnswer: nenhuma alternativa clicada neste ciclo");
                    }

                } else {
                    // modo ocioso
                    await delay(750);
                }
            } catch (err) {
                console.error("autoAnswer: erro no loop principal:", err);
                await delay(1000);
            }
        }

    })();
}






// Função para exibir a tela de inicialização
async function showSplashScreen() {
    const splashScreen = document.createElement('div');
    splashScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.5s ease;
        user-select: none;
        color: white;
        font-family: MuseoSans, sans-serif;
        font-size: 30px;
        text-align: center;
    `;
    splashScreen.innerHTML = '<span style="color:white;">Os</span><span style="color:#00ff00;">Menor</span>';
    document.body.appendChild(splashScreen);
    setTimeout(() => splashScreen.style.opacity = '1', 10);

    await delay(2000);
    splashScreen.style.opacity = '0';
    await delay(1000);
    splashScreen.remove();
}

// Função para exibir o popup de doação
function showDonationPopup() {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #1e1e1e;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 10pxrgb(47, 0, 255);
        z-index: 10000;
        text-align: center;
        color: white;
        font-family: Arial, sans-serif;
    `;
    popup.innerHTML = `
        <div style="position: absolute; top: 10px; right: 10px; cursor: pointer; color: red; font-size: 20px;" onclick="this.parentElement.remove(); showDiscordPopup();">×</div>
        <img src="https://imgur.com/vkm3wZf.png" alt="Logo" style="width: 100px; height: 100px; margin-bottom: 10px;">
        <h2 style="color:rgb(47, 0, 255); text-shadow: 0 0 5pxrgb(47, 0, 255);">Bem Vindo!</h2>
        <p style="font-size: 14px;">Os meno da divisa 👻</p>
    `;
    document.body.appendChild(popup);
}


// Verifica se o script está sendo executado no site correto
if (!/^https?:\/\/pt\.khanacademy\.org/.test(window.location.href)) {
    alert("❌ Khan Destroyer Failed to Injected!\n\nVocê precisa executar o site do Khan Academy! (https://pt.khanacademy.org/)");
    window.location.href = "https://pt.khanacademy.org/";
}

// Carrega o Dark Reader e ativa o modo escuro
loadScript('https://cdn.jsdelivr.net/npm/darkreader@4.9.92/darkreader.min.js').then(async () => {
    DarkReader.setFetchMethod(window.fetch);
    DarkReader.enable();

    // Exibe o aviso "HACK ATIVO ENTRE NA ATIVIDADE"
    sendToast("HACK ATIVO ENTRE NA ATIVIDADE", 5000, 'top', null, '20px', 'Arial, sans-serif', '#00ff00');

    // Aguarda 1 segundo antes de exibir o toast do Dark Mode
    await delay(1000);

    // Exibe o toast do Dark Mode com a imagem
    sendToast("🌑 Dark Mode ativado!", 2000, 'bottom', 'https://cdn.discordapp.com/attachments/1326756804889280553/1351333793306247220/6c0df6a95ea7f835588f586a11bdbd4e.png?ex=67d9ff2a&is=67d8adaa&hm=1992d77fc05bd65a4417da3e860cead36b2d62395a28f1b6598d43a0ab953cc0&');
});

// Carrega o CSS do Toastify
loadCss('https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css');

// Carrega o Toastify e inicia as funcionalidades
loadScript('https://cdn.jsdelivr.net/npm/toastify-js').then(async () => {
    sendToast("🤑 Marcha pra cima", 5000, 'bottom');
    playAudio('https://r2.e-z.host/4d0a0bea-60f8-44d6-9e74-3032a64a9f32/4x5g14gj.wav');
    window.features.autoAnswer = true;
    spoofQuestion();
    autoAnswer();
    console.clear();

    // Exibe a tela de inicialização
    await showSplashScreen();
    showDonationPopup();
    
    
});
