import { GoogleGenAI } from "@google/genai/web";

// Adicionei 'const' para declarar corretamente a variável
const models = [
    "models/gemini-2.5-pro",
    "models/gemini-flash-latest",
    "models/gemini-flash-lite-latest",
    "models/gemini-2.5-flash",
    "models/gemini-2.5-flash-lite",
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-lite",
];


function getAIClient() {
    const apiKey = sessionStorage.getItem("GOOGLE_GENAI_API_KEY");
    
    if (!apiKey) {
        throw new Error("API Key não encontrada. Por favor, insira sua chave e tente novamente.");
    }
    
    return new GoogleGenAI({ apiKey });
}


export async function gerarConteudo(texto) {
    let ultimoErro = null;

    const ai = getAIClient(); 

    // Itera sobre cada modelo da lista
    for (const modelo of models) {
        try {
            // Tenta gerar com o modelo atual
            const resultado = await ai.models.generateContent({
                model: modelo, // Usa o modelo da iteração atual
                contents: texto,
            });

            // Se chegou aqui, funcionou: retorna a resposta e encerra a função
            const resposta = await resultado.text;
            return resposta;

        } catch (erro) {
            // Se falhar, registra um aviso e o loop continua para o próximo
            console.warn(`Erro com o modelo ${modelo}. Tentando o próximo...`, erro.message);
            ultimoErro = erro;
        }
    }

    // Se o loop terminar sem retornar nada, significa que todos falharam
    throw new Error(`Todos os modelos falharam. Último erro: ${ultimoErro?.message}`);
}

export async function gerarConteudoEmJSON(texto, schema = null) {
    let ultimoErro = null;

    const ai = getAIClient(); 

    for (const modelo of models) {
        try {
            const resultado = await ai.models.generateContent({
                model: modelo,
                contents: texto,
                config: {
                    responseMimeType: "application/json",
                    responseJsonSchema: schema,
                },
            });

            // Parseia e retorna se tiver sucesso
            let textoLimpo = resultado.text.replace(/```json|```/g, '').trim(); // Limpeza preventiva
            const resposta = JSON.parse(textoLimpo);
            return resposta;
            
        } catch (erro) {
            console.warn(`Erro JSON com o modelo ${modelo}. Tentando o próximo...`, erro.message);
            ultimoErro = erro;
        }
    }

    throw new Error(`Todos os modelos falharam na geração de JSON. Último erro: ${ultimoErro?.message}`);
}
