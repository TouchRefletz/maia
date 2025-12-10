import { gerarConteudoEmJSON } from './gemini.js';
import { criarQuestao } from './questoes.js';
import { avaliarPasso } from './avaliarPasso.js';
import { gerarInputContainer, criarPassoHTML, criarPassoFinalizacao } from './generateHTML.js';

let topicosRevisao = [];
let numPasso = 0;
export var respostaPasso;

export function solicitarPromptQuestao() {
    return localStorage.getItem('promptQuestao');
}

function gerarPromptIA(questao, passoStatus, dadosPassos) {
    // 1. CORREÇÃO DE ESTRUTURA DE DADOS
    let historicoLinear = [];
    if (Array.isArray(dadosPassos) && dadosPassos.length > 0) {
        historicoLinear = dadosPassos.map(item => {
            return Object.values(item)[0];
        });
    }

    const temHistorico = historicoLinear.length > 0;
    const ultimoPasso = temHistorico ? historicoLinear[historicoLinear.length - 1] : null;

    // 2. EXTRAIR LISTA DE ENUNCIADOS E EXPLICAÇÕES ANTERIORES
    let listaEnunciadosAnteriores = [];
    let historicoFormatado = "";

    if (temHistorico) {
        historicoFormatado = "\n\n**HISTÓRICO DE RASTREAMENTO (O que já foi perguntado e explicado):**\n";

        historicoLinear.forEach((passo, index) => {
            // GUARDAR ENUNCIADO NA LISTA
            listaEnunciadosAnteriores.push(passo.contexto.pergunta);

            historicoFormatado += `\nPasso ${index + 1}:`;
            historicoFormatado += `\n   - Pergunta Feita: "${passo.contexto.pergunta}"`;
            // --- NOVO: Adicionamos a explicação aqui para a IA analisar ---
            historicoFormatado += `\n   - Explicação dada ao usuário: "${passo.contexto.explicacao}"`;
            historicoFormatado += `\n   - O usuário acertou? ${passo.taxaDeAcerto === 1 ? "SIM" : "NÃO"}`;

            const certeza = passo.taxaDeCerteza ? (passo.taxaDeCerteza * 100).toFixed(1) : 0;
            historicoFormatado += `\n   - Confiança do usuário: ${certeza}%`;
            historicoFormatado += `\n   - Proficiência atual: ${(passo.mediaPassos * 100).toFixed(1)}%`;
            historicoFormatado += `\n   - Dificuldade estimada: ${((1 - passo.resultadoPasso) * 100).toFixed(1)}%\n`;
        });
    }

    // 3. MONTAR SEÇÃO EXPLÍCITA DE ENUNCIADOS PROIBIDOS
    let secaoEnunciadosProibidos = "";
    if (listaEnunciadosAnteriores.length > 0) {
        secaoEnunciadosProibidos = `\n\n**⚠️ ENUNCIADOS JÁ UTILIZADOS (PROIBIDO REPETIR):**\n`;
        listaEnunciadosAnteriores.forEach((enunciado, index) => {
            secaoEnunciadosProibidos += `${index + 1}. "${enunciado}"\n`;
        });
        secaoEnunciadosProibidos += `\n🚫 Você DEVE fazer uma pergunta COMPLETAMENTE DIFERENTE.`;
    }

    // 4. CONSTRUÇÃO DO PROMPT
    let promptDaIA = `Você é um tutor inteligente focado em Scaffolding.
    
    ESTADO ATUAL:
    - Questão Alvo (Objetivo Final): "${questao.questao}"
    - Resposta Alvo: "${questao.resposta_correta}"
    
    SUA MISSÃO:
    Crie a PRÓXIMA PERGUNTA de Verdadeiro ou Falso.
    A resposta correta desta nova pergunta DEVE ser: **${passoStatus ? "VERDADEIRA" : "FALSA"}**.

    ${secaoEnunciadosProibidos}

    REGRAS CRÍTICAS:
    1. **DIVERSIDADE**: Aborde um aspecto novo.
    2. **PROGRESSO**: Avance em direção à Questão Alvo.
    3. **AUTONOMIA**: A pergunta deve ser clara e independente.

    ${temHistorico ? historicoFormatado : "\n**HISTÓRICO:** Nenhum (Início)."}
    `;

    if (temHistorico && ultimoPasso) {
        promptDaIA += `\n\n**ANÁLISE ESTRATÉGICA DO ÚLTIMO PASSO:**
        - Resultado: ${ultimoPasso.taxaDeAcerto === 1 ? "✓ Acertou" : "✗ Errou"}
        - Proficiência: ${(ultimoPasso.mediaPassos * 100).toFixed(1)}%

        --- REGRA DE ENCERRAMENTO POR "SPOILER" (NOVO) ---
        Analise a última "Explicação dada ao usuário" no histórico acima.
        Se a explicação anterior JÁ REVELOU a resposta da Questão Alvo ("${questao.questao}") ou explicou o conceito final de forma que a Questão Alvo se tornou óbvia:
        1. NÃO gere nova pergunta.
        2. Retorne o JSON com "status": "Processo concluído".
        3. No campo "explicacao", diga: "O conceito final já foi explicado no passo anterior."
        --------------------------------------------------

        Se não houve spoiler:
        ${ultimoPasso.mediaPassos < 0.3
                ? "⚠️ O usuário está errando. Simplifique com conceito básico, mas PERGUNTA NOVA."
                : ultimoPasso.mediaPassos > 0.8
                    ? "🚀 High Performer. Vá para um conceito avançado ou finalize se já cobriu tudo."
                    : "Avance um passo lógico."
            }
        `;
    }

    promptDaIA += `\n\n**FORMATO DE RESPOSTA (JSON):**
    {
        "pergunta": "Sua pergunta V/F aqui",
        "resposta_correta": "Verdadeiro" ou "Falso",
        "explicacao": "Breve explicação",
        "topicos_para_revisao": ["tópico"] (caso não haja tópicos, envie "Nenhum"),
        "status": "Processo em andamento" ou "Processo concluído"
    }`;

    return promptDaIA;
}

export function extrairProficienciaUltimoPasso(dadosPassoAnterior) {
    // Converte para array linear (mesma lógica da função original)
    let historicoLinear = [];
    if (Array.isArray(dadosPassoAnterior) && dadosPassoAnterior.length > 0) {
        historicoLinear = dadosPassoAnterior.map(item => {
            return Object.values(item)[0];
        });
    }

    // Se não há histórico, retorna null ou 0
    if (historicoLinear.length === 0) {
        return null;
    }

    // Pega o último passo e extrai a proficiência
    const ultimoPasso = historicoLinear[historicoLinear.length - 1];
    return ultimoPasso.mediaPassos; // Retorna um valor entre 0 e 1
}


export async function passo(questao, passoStatus, dadosPassoAnterior = null) {
    let promptDaIA = gerarPromptIA(questao, passoStatus, dadosPassoAnterior);

    var JSONEsperado = {
        "type": "object",
        "properties": {
            "pergunta": {
                "type": "string",
                "description": "A pergunta verdadeiro ou falso clara e objetiva. Se o processo foi concluído, deve ser 'Processo concluído'."
            },
            "tempo_ideal": {
                "type": "number",
                "description": "O tempo ideal em segundos que o usuário deve levar para responder esta pergunta."
            },
            "raciocinio_adaptativo": {
                "type": "string",
                "description": "Explicação de como o desempenho anterior (acerto/erro, tempo, incerteza) influenciou a dificuldade e foco desta nova pergunta, e qual é o próximo passo esperado em caso de acerto ou erro."
            },
            "status": {
                "type": "string",
                "enum": ["em_andamento", "concluido"],
                "description": "Define se ainda há etapas a cumprir ('em_andamento') ou se a verificação de conhecimento finalizou ('concluido')."
            },
            "contexto": {
                "type": "object",
                "description": "Informações externas necessárias para a pergunta, se houver."
            },
            "topicos_para_revisao": {
                "type": "string",
                "description": "Tópicos que o usuário deve revisar com base no desempenho até agora."
            },
            "explicacao": {
                "type": "string",
                "description": "Explicação breve do porquê a pergunta é verdadeira ou falsa."
            }
        },
        "required": ["pergunta", "status", "raciocinio_adaptativo", "tempo_ideal", "contexto", "topicos_para_revisao", "explicacao"],
        "additionalProperties": false
    };

    respostaPasso = await gerarConteudoEmJSON(promptDaIA, JSONEsperado);
    numPasso++;

    if (respostaPasso.status === "concluido") {
        criarPassoFinalizacao(dadosPassoAnterior, topicosRevisao);
        return;
    }

    criarPassoHTML(respostaPasso, numPasso, passoStatus);
    let tempoPasso = Date.now();

    document.querySelectorAll('.guessButton').forEach(button => {
        button.addEventListener('click', function () {
            handleAnswer(document.getElementById('guessRange').value);
        });
    });

    document.querySelectorAll('.newPassoButton').forEach(button => {
        button.addEventListener('click', function () {
            handleAnswer(50);
        });
    });


    function handleAnswer(guessValue) {
        avaliarPasso(
            guessValue,
            passoStatus,
            ((Date.now() - tempoPasso) / 1000).toFixed(2),
            respostaPasso.tempo_ideal,
            respostaPasso,
            questao,
            numPasso
        );

        document.querySelectorAll('.input').forEach(element => element.remove());
        document.querySelectorAll('.passoButton').forEach(element => element.remove());
    }

    atualizarTopicosRevisao(respostaPasso.topicos_para_revisao);
}

function atualizarTopicosRevisao(novosTopicos) {
    if (novosTopicos && novosTopicos !== "Nenhum tópico para revisão, esta é a primeira pergunta." && novosTopicos !== "Nenhum" && novosTopicos !== "Nenhum.") {
        topicosRevisao.push(novosTopicos);
    }
}