import { passo } from './passo.js';
import { gerarSkeletonPasso, criarSecaoEstatisticas } from './generateHTML.js';

var passosResultados = [];
var passosAnteriores = [];

export function avaliarPasso(guess, respostaBoolean, tempoPasso, tempoIdeal, resposta, questao, numPasso) {
    var taxaDeCerteza = Math.abs(50 - guess) / 50;
    var extremidadeCorreta = respostaBoolean ? 100 : 0;
    var taxaDeAcerto = (extremidadeCorreta === 0) ? (guess < 50 ? 1 : 0) : (guess > 50 ? 1 : 0);
    const diferenca = tempoPasso - tempoIdeal;

    let pesoTempo = Math.exp(-0.05 * Math.sqrt(Math.abs(diferenca)));

    var resultadoPasso = taxaDeAcerto * pesoTempo * taxaDeCerteza;
    passosResultados.push(resultadoPasso);
    var mediaPassos = passosResultados.reduce((a, b) => a + b, 0) / passosResultados.length;

    var JSONPasso = {
        [`passo_${numPasso}`]: {
            pergunta: questao.questao,
            contexto: {
                pergunta: resposta.pergunta,
                contexto: resposta.contexto,
                raciocinio_adaptativo: resposta.raciocinio_adaptativo,
                status: resposta.status,
                tempo_ideal: resposta.tempo_ideal,
                tempo_gasto: tempoPasso,
                topicos_para_revisao: resposta.topicos_para_revisao,
                explicacao: resposta.explicacao
            },
            taxaDeCerteza: taxaDeCerteza,
            extremidadeCorreta: extremidadeCorreta,
            taxaDeAcerto: taxaDeAcerto,
            pesoTempo: pesoTempo,
            resultadoPasso: resultadoPasso,
            mediaPassos: mediaPassos
        }
    };

    passosAnteriores.push(JSONPasso);

    var passoStatus = Math.random() < 0.5;

    const dadosPasso = JSONPasso[`passo_${numPasso}`];
    const secaoStats = criarSecaoEstatisticas(dadosPasso);
    document.body.appendChild(secaoStats);

    gerarSkeletonPasso();
    passo(questao, passoStatus, passosAnteriores);
}