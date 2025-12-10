import { gerarConteudoEmJSON } from './gemini.js';
import { passo } from './passo.js';
import { gerarConteudoQuestao } from './generateHTML.js';

export function armazenarPromptQuestao(prompt) {
    localStorage.setItem('promptQuestao', prompt);
}

export var resposta;

export async function criarQuestao(promptUsuario = null, dificuldade = 0.5) {
  var promptDoUser = promptUsuario || document.getElementById("promptInput").value;
  var promptDaIA = `Você é um criador de questões para vestibulares. A sua tarefa é criar uma questão bem construída com a dificuldade ${dificuldade}, considerando que próximo de 0 é considerando uma questão extremamente fácil e 1 uma questão extremamente desafiadora, o que também é o seu nível de proeficiência estimado, sobre o tema baseado no prompt a seguir: "${promptDoUser}". A questão deve ser de múltipla escolha, com 4 a 5 alternativas disponíveis como resposta, e você deve indicar qual é a alternativa correta. As alternativas devem conter APENAS o texto da resposta, SEM prefixos como 'A)', 'B)', etc. A questão deve ser clara e objetiva, evitando ambiguidades. O seu objetivo com a criação das questões é avaliar o conhecimento do estudante sobre o tema proposto, visando avaliar o seu domínio sobre o assunto. Responda conforme a estrutura JSON solicitada, não fornecendo nenhuma informação adicional ao que foi solicitado. IMPORTANTE: O JSON retornado deve ser um objeto PLANO. NÃO envolva a resposta em uma chave raiz como "pergunta" ou "quiz". O objeto raíz deve conter DIRETAMENTE as chaves "questao", "alternativas", "resposta_correta" e "explicacao". NÃO TRADUZA AS CHAVES. Use estritamente as chaves em português definidas.`;
  var JSONEsperado = {
    type: "object",
    properties: {
      questao: {
        type: "string",
        description: "A questão de múltipla escolha bem formulada"
      },
      alternativas: {
        type: "array",
        items: {
          type: "string"
        },
        minItems: 4,
        maxItems: 5,
        description: "Lista de 4 a 5 alternativas para a questão"
      },
      resposta_correta: {
        type: "string",
        description: "A letra da alternativa correta (A, B, C, D ou E)"
      },
      explicacao: {
        type: "string",
        description: "Explicação breve do porquê a resposta está correta"
      }
    },
    required: ["questao", "alternativas", "resposta_correta", "explicacao"],
    additionalProperties: false
  };

  resposta = await gerarConteudoEmJSON(promptDaIA, JSONEsperado);

  gerarConteudoQuestao(resposta);

  var passoStatus = Math.random() < 0.5;
  passo(resposta, passoStatus);
}