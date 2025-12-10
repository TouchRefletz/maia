import { armazenarPromptQuestao } from './questoes.js';
import { criarQuestao } from './questoes.js';
import { resposta } from './questoes.js';
import { respostaPasso, extrairProficienciaUltimoPasso, solicitarPromptQuestao } from './passo.js';

export function gerarInputContainer() {
    document.body.innerHTML += `
    <div id="promptContainer">
        <!-- Início do Branding -->
        <div id="brandHeader">
            <img src="logo.png" alt="Logo Maia" id="brandLogo">
            <span id="brandName">Maia</span>
        </div>
        <!-- Fim do Branding -->

        <h1 id="promptTitle">O que vamos aprender <strong>hoje?</strong></h1>
        <div id="promptWrapper">
            <input type="text" id="promptInput" placeholder="Quero aprender sobre..." />
            <button id="promptButton">Enviar</button>
        </div>
    </div>
    `;

    document.getElementById('promptButton').addEventListener('click', () => {
        armazenarPromptQuestao(document.getElementById("promptInput").value);
        criarQuestao();

        const promptContainer = document.getElementById('promptContainer');
        promptContainer.classList.add('fade-out');

        setTimeout(() => {
            generateSkeletonAndQuestion(true);
        }, 500);
    });
}

let passosCompletos = false;

function generateSkeletonAndQuestion(firstQuestion = false) {
    if (firstQuestion) document.getElementById("promptContainer").remove();
    passosCompletos = false;
    document.body.innerHTML += `
    <div id="questionSkeleton">
        <div id="questionTextSkeleton"></div>
        <div id="answerOptionsSkeleton">
            <div class="answerOptionSkeleton"></div>
            <div class="answerOptionSkeleton"></div>
            <div class="answerOptionSkeleton"></div>
            <div class="answerOptionSkeleton"></div>
            <div class="answerOptionSkeleton"></div>
        </div>
        <div id="correctAnswerSkeleton"></div>
    </div>
    `;
    let respostaAnterior = resposta;

    const mensagens = [
        "Gerando questão, por favor aguarde...",
        "Gerando resposta pela Gemini API...",
        "Esse processo pode demorar cerca de um minuto...",
        "Quase lá, só mais um instante...",
        "Caso demore muito, tente recarregar a página..."
    ];
    let indice = 0;

    const alertHandle = customAlert(mensagens[indice], 0);

    const gerarTempo = () => 500 + Math.random() * 4500;

    let proximoTempo = gerarTempo();
    let ultimoTempo = Date.now();

    const intervalo = setInterval(() => {
        const agora = Date.now();

        if (resposta !== respostaAnterior && resposta !== undefined) {
            clearInterval(intervalo);
            alertHandle.close();
            customAlert("✅ Questão gerada com sucesso!", 2000);
            return;
        }

        if (agora - ultimoTempo >= proximoTempo) {
            indice = (indice + 1) % mensagens.length;
            alertHandle.update(mensagens[indice]);

            proximoTempo = gerarTempo();
            ultimoTempo = agora;
        }
    }, 100);
}

let alertTimeout;

function customAlert(message, duration = 5000) {
    let alertDiv = document.getElementById("customAlert");
    let messageDiv;

    if (!alertDiv) {
        alertDiv = document.createElement("div");
        alertDiv.id = "customAlert";

        messageDiv = document.createElement("div");
        messageDiv.id = "alertMessage";
        alertDiv.appendChild(messageDiv);

        document.body.appendChild(alertDiv);
    } else {
        messageDiv = document.getElementById("alertMessage");
    }

    messageDiv.innerText = message;

    void alertDiv.offsetWidth;

    alertDiv.classList.add("visible");

    if (alertTimeout) clearTimeout(alertTimeout);

    const removeAlert = () => {
        alertDiv.classList.remove("visible");
        setTimeout(() => {
            if (alertDiv && !alertDiv.classList.contains("visible")) {
                alertDiv.remove();
            }
        }, 500);
    };

    if (duration > 0) {
        alertTimeout = setTimeout(removeAlert, duration);
    }

    return {
        close: removeAlert,
        update: (newMsg) => customAlert(newMsg, duration)
    };
}

let questaoController = null;

export function gerarConteudoQuestao(resposta) {
    document.querySelectorAll("#questionSkeleton").forEach(skeleton => skeleton.remove());

    // 2. Se já existir um controller (de uma questão anterior), aborte ele!
    // Isso remove o event listener antigo automaticamente.
    if (questaoController) {
        questaoController.abort();
    }

    // 3. Crie um novo controller para a questão atual
    questaoController = new AbortController();

    document.body.innerHTML += `
        <div id="question" class="question">
            <div id="questionText">
                <p>${resposta.questao}</p>
            </div>
            <div id="answerOptions">
                ${resposta.alternativas.map((alt, index) => `
                    <div class="answerOption">
                        <span class="option-letter">${String.fromCharCode(65 + index)})</span>
                        <p class="option-text">${alt}</p>
                    </div>
                `).join('')}
            </div>
            <div id="correctAnswer">
                <h1>A resposta correta será revelada ao concluir todos os passos e ao responder a questão.</h1>
                <h4>Resposta Correta: ${resposta.resposta_correta}</h4>
                <p>Explicação: ${resposta.explicacao}</p> 
            </div>
        </div>
    `

    document.body.addEventListener('click', (e) => {
        const selecionada = e.target.closest('.answerOption');

        if (!selecionada) return;

        if (!passosCompletos) {
            customAlert("Realize todos os passos primeiro!");
            return;
        }

        var respostaCerta = resposta.resposta_correta;

        verificarRespostas(respostaCerta, selecionada, true);
    }, { signal: questaoController.signal });


    gerarSkeletonPasso();
}

function verificarRespostas(respostaCerta, selecionada, usuario) {
    document.querySelector('#correctAnswer h1').remove();
    document.querySelectorAll('#correctAnswer > h4, #correctAnswer > p').forEach(el => {
        el.style.filter = 'none';
    });

    // 1. Pega a letra e define se acertou
    const letraSelecionada = selecionada.querySelector(".option-letter").innerText.replace(")", "").trim();
    const acertou = (letraSelecionada === respostaCerta); // Retorna true ou false

    // 2. Feedback Visual Imediato
    if (!acertou) {
        selecionada.classList.add("wrong");
    } else {
        selecionada.classList.add("correct");
    }

    // 3. Lógica de transição (apenas se for o usuário)
    if (usuario) {
        const containerAtual = selecionada.parentElement;

        // Agora buscamos as opções apenas dentro desse container
        const todasAlternativas = containerAtual.querySelectorAll(".answerOption");

        todasAlternativas.forEach(op => op.style.pointerEvents = 'none');

        setTimeout(() => {
            todasAlternativas.forEach((alternativa) => {
                const letraAlternativa = alternativa.querySelector(".option-letter").innerText.replace(")", "").trim();

                // A lógica se mantém, mas agora aplicada apenas ao grupo certo
                if (letraAlternativa === respostaCerta && alternativa !== selecionada) {
                    alternativa.classList.add("correct");
                }
            });

            setTimeout(() => {
                document.getElementById("question").removeAttribute("id");
                document.querySelector(".answerButton").parentElement.remove();
                gerarFim(acertou);
            }, 1000);

        }, 1000);
    }
}


export function gerarSkeletonPasso() {
    document.body.innerHTML += `
        <div class="passoSkeleton">
            <div class="passoTextSkeleton"></div>
            <div class="passoContextSkeleton"></div>
            <div class="explicacaoSkeleton"></div>
            <div class="inputSkeleton">
                <div class="inputAreaSkeleton"></div>
            </div>
            <div class="passoButtonSkeleton">
                <button class="newPassoButtonSkeleton"></button>
                <button class="guessButtonSkeleton"></button>
            </div>
        </div>
    `

    let respostaAnterior = respostaPasso;

    const mensagens = [
        "Gerando passo, por favor aguarde...",
        "Gerando passo pela Gemini API...",
        "Esse processo pode demorar cerca de 30 segundos...",
        "Quase lá, só mais um instante...",
        "Caso demore muito, tente recarregar a página..."
    ];
    let indice = 0;

    const alertHandle = customAlert(mensagens[indice], 0);

    const gerarTempo = () => 500 + Math.random() * 4500;

    let proximoTempo = gerarTempo();
    let ultimoTempo = Date.now();

    const intervalo = setInterval(() => {
        const agora = Date.now();

        if (respostaPasso !== respostaAnterior && respostaPasso !== undefined) {
            clearInterval(intervalo);
            alertHandle.close();
            customAlert("✅ Passo gerado com sucesso!", 2000);
            return;
        }

        if (agora - ultimoTempo >= proximoTempo) {
            indice = (indice + 1) % mensagens.length;
            alertHandle.update(mensagens[indice]);

            proximoTempo = gerarTempo();
            ultimoTempo = agora;
        }
    }, 100);
}

export function criarPassoHTML(respostaPasso, numPasso, passoStatus) {
    document.querySelectorAll(".passoSkeleton").forEach(skeleton => skeleton.remove());
    var htmlFinal = ``;
    htmlFinal += `
        <div class="passo">
            <div class="passoText">
                <h2>Passo ${numPasso}:</h2>
                <p>${respostaPasso.pergunta}</p>
            </div>
    `;
    if (respostaPasso.contexto && Object.keys(respostaPasso.contexto).length > 0) {
        htmlFinal += `
        <div class="passoContext">
            <h3>Contexto Adicional:</h3>
            <pre>${JSON.stringify(respostaPasso.contexto, null, 2)}</pre>
        </div>
        `;
    }
    htmlFinal += `
            <div class="explicacao">
                <h1>A explicação somente será mostrada ao responder a pergunta.</h1>
                <h3>A pergunta era ${passoStatus ? "verdadeira" : "falsa"}</h3>
                <p>${respostaPasso.explicacao}</p>
            </div>
            <div class="input">
                <div class="inputArea">
                    <label id="falseLabel">❌</label><input type="range" min="0" max="100" id="guessRange"/><label id="trueLabel">✅</label>
                </div>
            </div>
            <div class="passoButton">
                <button class="newPassoButton">Não entendi/Não sei</button>
                <button class="guessButton">Enviar</button>
            </div>
        </div>
    `;
    document.body.innerHTML += htmlFinal;
    initializeGuessRange();
    document.querySelectorAll(".guessButton, .newPassoButton").forEach((element) => {
        element.addEventListener("click", () => {
            document.querySelector('.explicacao h1').remove();
            document.querySelectorAll('.explicacao > h3, .explicacao > p').forEach(el => {
                el.style.filter = 'none';
            });
        });
    });
}

function initializeGuessRange() {
    const guessRange = document.getElementById('guessRange');
    const falseLabel = document.getElementById('falseLabel');
    const trueLabel = document.getElementById('trueLabel');
    const inputArea = document.querySelector('.inputArea');

    function updateGuessRange(value) {
        value = parseInt(value);

        // Calcular a escala dos labels (de 1 a 2.2)
        // Quanto mais perto de 100, mais cresce o verdadeiro
        // Quanto mais perto de 0, mais cresce o falso
        const falseFactor = Math.max(1, 2.2 - (value / 100) * 1.2);
        const trueFactor = Math.max(1, 1 + (value / 100) * 1.2);

        // Aplicar transformação nos labels
        falseLabel.style.transform = `scale(${falseFactor})`;
        trueLabel.style.transform = `scale(${trueFactor})`;

        // Calcular cores
        let labelColor;
        if (value < 40) {
            labelColor = 'var(--color-error)';
            falseLabel.style.color = labelColor;
            trueLabel.style.color = 'var(--color-text-secondary)';
        } else if (value > 60) {
            labelColor = 'var(--color-success)';
            trueLabel.style.color = labelColor;
            falseLabel.style.color = 'var(--color-text-secondary)';
        } else {
            falseLabel.style.color = 'var(--color-text-secondary)';
            trueLabel.style.color = 'var(--color-text-secondary)';
        }

        // Tamanho do thumb (bolinha) cresce conforme se afasta do meio
        const thumbSize = 24 + Math.abs(value - 50) * 0.4;
        const thumbSizeClamp = Math.min(thumbSize, 36);
        guessRange.style.setProperty('--thumb-size', `${thumbSizeClamp}px`);

        // Atualizar cor do slider e borda
        if (value < 50) {
            // Gradiente para Falso (vermelho)
            const intensity = (50 - value) / 50;
            inputArea.style.borderColor = `rgba(192, 21, 47, ${0.3 + intensity * 0.4})`;
            inputArea.style.boxShadow = `0 4px 12px rgba(192, 21, 47, ${0.2 * intensity})`;
        } else {
            // Gradiente para Verdadeiro (teal)
            const intensity = (value - 50) / 50;
            inputArea.style.borderColor = `rgba(33, 128, 141, ${0.3 + intensity * 0.4})`;
            inputArea.style.boxShadow = `0 4px 12px rgba(33, 128, 141, ${0.2 * intensity})`;
        }
    }

    // Event listeners
    guessRange.addEventListener('input', (e) => {
        updateGuessRange(e.target.value);
    });

    guessRange.addEventListener('change', (e) => {
        updateGuessRange(e.target.value);
    });

    // Inicialização
    updateGuessRange(guessRange.value);
}

/**
 * Cria uma seção expansível de "Estatísticas para Nerds"
 * @param {Object} dadosPasso - Objeto contendo as métricas calculadas em avaliarPasso
 * @returns {HTMLElement} - Elemento da seção de estatísticas
 */
export function criarSecaoEstatisticas(dadosPasso) {
    const section = document.createElement('section');
    section.className = 'statsNerds';

    // Extrair dados
    const taxaAcerto = (dadosPasso.taxaDeAcerto * 100).toFixed(1);
    const taxaCerteza = (dadosPasso.taxaDeCerteza * 100).toFixed(1);

    // Lógica de Tempo: Gasto vs Ideal
    // Se tempo_ideal não vier da IA, assumimos um padrão (ex: 15s) para não quebrar
    const tempoIdeal = dadosPasso.contexto.tempo_ideal || 15;
    const tempoGasto = dadosPasso.contexto.tempo_gasto || 0; // Garantir que existe

    // Cálculo visual da barra de tempo (regra de 3 simples, limitando a 100%)
    // Se gastou o dobro do tempo ideal, a barra enche (100%). Se gastou metade, 50%.
    let pctTempo = (tempoGasto / tempoIdeal) * 50;
    if (pctTempo > 100) pctTempo = 100;

    // Cor da barra de tempo muda se estourar o tempo
    const corBarraTempo = tempoGasto > tempoIdeal ? 'var(--color-warning)' : 'var(--color-primary)';

    // Outros dados
    const pesoTempo = (dadosPasso.pesoTempo * 100).toFixed(1);
    const resultadoPasso = (dadosPasso.resultadoPasso * 100).toFixed(1);
    const mediaPassos = (dadosPasso.mediaPassos * 100).toFixed(1);
    const dificuldadeEstimada = ((1 - dadosPasso.resultadoPasso) * 100).toFixed(1);

    // Captura o raciocínio (com fallback caso venha vazio)
    const raciocinio = dadosPasso.contexto.raciocinio_adaptativo || "Nenhum raciocínio registrado para este passo.";

    // Determinar badges de status
    const statusAcerto = dadosPasso.taxaDeAcerto === 1
        ? '<span class="statsNerds__badge statsNerds__badge--acertou">✓ ACERTOU</span>'
        : '<span class="statsNerds__badge statsNerds__badge--errou">✗ ERROU</span>';

    const statusConfianca = dadosPasso.taxaDeCerteza > 0.8
        ? '<span class="statsNerds__badge statsNerds__badge--otimo">MUITO CONFIANTE</span>'
        : dadosPasso.taxaDeCerteza > 0.5
            ? '<span class="statsNerds__badge statsNerds__badge--bom">CONFIANTE</span>'
            : '<span class="statsNerds__badge statsNerds__badge--ruim">INCERTO</span>';

    const statusProficiencia = dadosPasso.mediaPassos > 0.8
        ? '<span class="statsNerds__badge statsNerds__badge--otimo">🚀 EXPERT</span>'
        : dadosPasso.mediaPassos > 0.5
            ? '<span class="statsNerds__badge statsNerds__badge--bom">📈 EM PROGRESSO</span>'
            : '<span class="statsNerds__badge statsNerds__badge--pessimo">📚 ESTUDANDO</span>';

    section.innerHTML = `
    <div class="statsNerds__header">
      <h3 class="statsNerds__title">
        <span class="statsNerds__icon">📊</span>
        Estatísticas para Nerds
      </h3>
      <div class="statsNerds__toggle">▼</div>
    </div>
    
    <div class="statsNerds__content">
      <div class="statsNerds__grid">
        <!-- Taxa de Acerto -->
        <div class="statsNerds__metric statsNerds__metric--accuracy">
          <span class="statsNerds__metric-label">Taxa de Acerto</span>
          <span class="statsNerds__metric-value">${taxaAcerto}%</span>
          <div class="statsNerds__metric-bar">
            <div class="statsNerds__metric-bar-fill" style="--fill-width: ${taxaAcerto}%"></div>
          </div>
        </div>
        
        <!-- Taxa de Certeza -->
        <div class="statsNerds__metric statsNerds__metric--confidence">
          <span class="statsNerds__metric-label">Certeza na Resposta</span>
          <span class="statsNerds__metric-value">${taxaCerteza}%</span>
          <div class="statsNerds__metric-bar">
            <div class="statsNerds__metric-bar-fill" style="--fill-width: ${taxaCerteza}%"></div>
          </div>
        </div>
        
        <!-- Eficiência Temporal (AGORA COM GASTO / IDEAL) -->
        <div class="statsNerds__metric statsNerds__metric--time">
          <span class="statsNerds__metric-label">Tempo (Gasto / Ideal)</span>
          <span class="statsNerds__metric-value" style="font-size: 0.9em;">${tempoGasto}s <span style="color:var(--color-text-secondary); font-size:0.8em;">/ ${tempoIdeal}s</span></span>
          <div class="statsNerds__metric-bar">
            <div class="statsNerds__metric-bar-fill" style="--fill-width: ${pctTempo}%; background: ${corBarraTempo};"></div>
          </div>
        </div>
        
        <!-- Resultado do Passo (Score) -->
        <div class="statsNerds__metric statsNerds__metric--score">
          <span class="statsNerds__metric-label">Score do Passo</span>
          <span class="statsNerds__metric-value">${resultadoPasso}%</span>
          <div class="statsNerds__metric-bar">
            <div class="statsNerds__metric-bar-fill" style="--fill-width: ${resultadoPasso}%"></div>
          </div>
        </div>
        
        <!-- Proficiência Média -->
        <div class="statsNerds__metric statsNerds__metric--confidence">
          <span class="statsNerds__metric-label">Proficiência Geral</span>
          <span class="statsNerds__metric-value">${mediaPassos}%</span>
          <div class="statsNerds__metric-bar">
            <div class="statsNerds__metric-bar-fill" style="--fill-width: ${mediaPassos}%"></div>
          </div>
        </div>
        
        <!-- Dificuldade Estimada -->
        <div class="statsNerds__metric statsNerds__metric--warning">
          <span class="statsNerds__metric-label">Dificuldade Estimada</span>
          <span class="statsNerds__metric-value">${dificuldadeEstimada}%</span>
          <div class="statsNerds__metric-bar">
            <div class="statsNerds__metric-bar-fill" style="--fill-width: ${dificuldadeEstimada}%"></div>
          </div>
        </div>
      </div>

      <!-- NOVA SEÇÃO: Raciocínio Adaptativo -->
      <div class="statsNerds__reasoning">
        <span class="statsNerds__reasoning-title">🧠 Raciocínio da IA</span>
        <p class="statsNerds__reasoning-text">${raciocinio}</p>
      </div>
      
      <!-- Resumo em linha -->
      <div class="statsNerds__summary">
        <div class="statsNerds__summary-item">
          <span>Resultado:</span>
          ${statusAcerto}
        </div>
        <div class="statsNerds__summary-item">
          <span>Nível de Confiança:</span>
          ${statusConfianca}
        </div>
        <div class="statsNerds__summary-item">
          <span>Seu Nível:</span>
          ${statusProficiencia}
        </div>
        <div class="statsNerds__summary-item">
          <span>Extremidade Esperada:</span>
          <span class="statsNerds__badge">${dadosPasso.extremidadeCorreta === 100 ? 'TRUE' : 'FALSE'}</span>
        </div>
      </div>
    </div>
  `;

    return section;
}


document.body.addEventListener('click', (e) => {
    if (e.target.closest('.statsNerds__header')) {
        const statsSection = e.target.closest('.statsNerds');
        statsSection?.classList.toggle('statsNerds--expanded');
    }
});

let dadosPassoAnteriorLocal;
let topicosRevisaoLocal;
export function criarPassoFinalizacao(dadosPassoAnterior, topicosRevisao) {
    document.querySelectorAll(".passoSkeleton").forEach(skeleton => skeleton.remove());
    window.location.hash = "question";
    passosCompletos = true;
    customAlert("Você completou todos os passos! Responda a questão!");
    var htmlFinal = ``;
    htmlFinal += `
        <div class="passo">
            <div class="passoText">
                <h2>Passo final:</h2>
                <p>Parabéns! Você chegou na resposta final! Por favor, selecione a alternativa correta.</p>
            </div>
    `;
    htmlFinal += `
            <div class="passoButton">
                <button class="answerButton" onclick="document.getElementById('question').scrollIntoView({behavior: 'smooth'})">Responder</button>
            </div>
        </div>
    `;
    document.body.innerHTML += htmlFinal;
    dadosPassoAnteriorLocal = dadosPassoAnterior;
    topicosRevisaoLocal = topicosRevisao;
}

function gerarFim(acertou) {
    var htmlFinal = ``;
    htmlFinal += `
        <div class="passo" id="end">
            <div class="passoText">
                <h2>Questão respondida</h2>
                <p>${acertou ? "Parabéns! Você respondeu corretamente!" : "Putz... não foi dessa vez."}</p>
                <p>O que deseja fazer a seguir?</p>
                ${topicosRevisaoLocal.length > 0 ? `<p>Tópicos para possível revisão: ${topicosRevisaoLocal.join(", ")}</p>` : ""}
            </div>
    `;
    htmlFinal += `
            <div class="passoButton">
                <button id="reiniciarButton">Nova questão</button>
                <button id="treinarButton">Treinar dificuldades</button>
                <button id="finalizarButton">Novo tópico</button>
            </div>
        </div>
    `;
    document.body.innerHTML += htmlFinal;
    window.location.hash = "end";

    document.getElementById('reiniciarButton').addEventListener('click', function () {
        document.getElementById("end").remove();
        criarQuestao(solicitarPromptQuestao(), extrairProficienciaUltimoPasso(dadosPassoAnteriorLocal));
        generateSkeletonAndQuestion();
    });
    document.getElementById('treinarButton').addEventListener('click', function () {
        if (topicosRevisaoLocal.length === 0) {
            customAlert("Nenhum tópico para revisão foi identificado durante o processo. Parabéns! Gerando nova questão");
            document.getElementById("end").remove();
            criarQuestao(solicitarPromptQuestao(), extrairProficienciaUltimoPasso(dadosPassoAnteriorLocal));
            generateSkeletonAndQuestion();
            return;
        }
        criarQuestao(topicosRevisaoLocal[0], extrairProficienciaUltimoPasso(dadosPassoAnteriorLocal));
        generateSkeletonAndQuestion();
    });
    document.getElementById('finalizarButton').addEventListener('click', function () {
        document.body.innerHTML = "";
        gerarInputContainer();
    });
}

function generateAPIKeyPopUp() {
    document.body.innerHTML += `
    <!-- Modal de API Key -->
    <div id="apiKeyModal" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <div class="icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path
                            d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                    </svg>
                </div>
                <h2>Configuração Necessária</h2>
            </div>

            <div class="modal-body">
                <p>Para utilizar o assistente, é necessária uma chave de API do Google Gemini. Ao inserir sua chave em nosso site, você está consciente dos possíveis riscos de vazamento dela. Para maior segurança, sugerimos que realize uma restrição nos domínios em que a chave de API pode ser utilizada.</p>

                <div class="info-box">
                    <p>Sua chave será salva apenas na memória do seu navegador.</p>
                    <a href="https://aistudio.google.com/api-keys" target="_blank" class="link-external">
                        Obter chave <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                </div>

                <form id="apiKeyForm">
                    <div class="form-group">
                        <label for="apiKeyInput" class="form-label">Cole sua API Key aqui</label>
                        <div class="input-wrapper">
                            <!-- Adicionado name="apiKey" para acessibilidade -->
                            <input type="password" id="apiKeyInput" name="apiKey" class="form-control"
                                placeholder="AIzaSy..." autocomplete="on">
                        </div>
                        <span id="apiError" class="error-message hidden">A chave não pode estar vazia.</span>
                    </div>

                    <div class="modal-footer">
                        <!-- Mudado para type="submit" -->
                        <button type="submit" id="saveApiKeyBtn" class="btn btn--primary btn--full-width">
                            Continuar para o App
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    `;
}

generateAPIKeyPopUp();
gerarInputContainer();