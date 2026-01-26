# Maia.ai 🧠✨

> **Tutor Inteligente Baseado em IA Generativa e Scaffolding Adaptativo**

O **Maia.ai** é uma aplicação web educacional que utiliza Inteligência Artificial avançada para guiar estudantes através do conceito de *Scaffolding* (Andaimagem). Em vez de entregar respostas prontas, o sistema quebra conceitos complexos em "passos" gerenciáveis, adaptando-se em tempo real ao nível de proficiência, confiança e tempo de resposta do usuário.

---

## 🎯 Objetivo e Metodologia

O projeto foi construído sobre os pilares da **Zona de Desenvolvimento Proximal (ZPD)** de Lev Vygotsky. A IA atua como um "tutor competente", ajustando a dificuldade das perguntas para manter o aluno em sua zona ideal de aprendizado — nem fácil demais (tédio), nem difícil demais (frustração).

### Diferenciais Pedagógicos:
*   **Aprendizagem Passo a Passo:** Problemas complexos são decompostos em perguntas de Verdadeiro/Falso progressivas.
*   **Avaliação Multidimensional:** O sistema não avalia apenas se o aluno "acertou", mas cruza 4 métricas:
    *   ✅ **Precisão** (Acerto/Erro)
    *   ⏱️ **Eficiência Temporal** (Tempo gasto vs. Tempo ideal calculado pela IA)
    *   🤔 **Índice de Certeza** (Autoavaliação de confiança via slider)
    *   📉 **Raciocínio Adaptativo** (A IA justifica pedagogicamente por que facilitou ou dificultou o próximo passo)

---

## 🛠️ Tecnologias Utilizadas

### Core & IA
*   **Google Gemini API:** Integração robusta com a família de modelos Gemini (2.5 Flash, 2.0 Flash, 1.5 Pro) via `GoogleGenAI` SDK.
*   **JSON Schema Enforcement:** Uso estrito de esquemas JSON para garantir que a IA retorne dados estruturados (perguntas, tempo ideal, tópicos de revisão) sem alucinações de formato.
*   **Model Fallback System:** Sistema inteligente que tenta modelos alternativos automaticamente caso a API principal falhe ou esteja instável.

### Frontend
*   **Vanilla JS (ES6+):** Arquitetura modular sem frameworks pesados, focada em performance.
*   **CSS3 Moderno:** Uso extensivo de *CSS Variables*, *Flexbox*, *Grid* e animações fluidas (`shimmer effects` para loading).
*   **Design System Próprio:** Paleta de cores semântica (Teal/Coral/Slate) com suporte nativo a temas.

---

## 🚀 Funcionalidades Chave

1.  **Geração Dinâmica de Questões:** O usuário digita o que quer aprender e a IA cria uma questão de vestibular completa (Enunciado, Alternativas, Explicação) do zero.
2.  **Modo "Stats for Nerds":** Um painel detalhado que mostra os cálculos internos do sistema:
    *   Gráficos de barra para proficiência e confiança.
    *   Exibição do "Raciocínio da IA" (por que ela decidiu mudar a dificuldade).
    *   Comparativo de Tempo Real vs. Ideal.
3.  **Gestão Segura de API Key:**
    *   Interface amigável para inserção da chave da Google AI Studio.
    *   Armazenamento volátil (`sessionStorage`) para segurança.
    *   Validação de formato da chave antes do uso.

---

## 📂 Estrutura do Projeto

```
/
├── index.html            # Ponto de entrada
├── style.css             # Design System e estilos globais
├── gemini.js             # Wrapper da API do Google e lógica de retry/fallback
├── passo.js              # Controlador principal do fluxo de passos (Scaffolding)
├── questoes.js           # Gerador da questão alvo (objetivo final)
├── avaliarPasso.js       # Motor matemático de avaliação (Cálculo de Score/Peso)
├── generateHTML.js       # Manipulação do DOM, Renderização e Componentes Visuais
├── geminiAPIKeyHandle.js # Gerenciamento de segurança e UI da API Key
└── logo.png              # Branding do projeto
```

---

## ⚙️ Como Executar

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/maia-ai.git
    cd maia-ai
    ```

2.  **Servidor Local:**
    Como o projeto usa *ES6 Modules* (`import/export`), você precisa rodar em um servidor local para evitar erros de CORS.
    
    **Opção 1 - Python:**
    ```bash
    python -m http.server
    ```
    
    **Opção 2 - Node.js (http-server):**
    ```bash
    npx http-server
    ```
    
    **Opção 3 - VS Code (Live Server):**
    *   Instale a extensão "Live Server" no VS Code.
    *   Clique com botão direito no `index.html` e selecione "Open with Live Server".

3.  **Acesse a aplicação:**
    *   Abra o navegador no endereço local (ex: `http://localhost:8000`).
    *   Insira sua **Google Gemini API Key** quando solicitado.

4.  **Obter a API Key:**
    *   Acesse [Google AI Studio](https://aistudio.google.com/)
    *   Clique em "Get API Key"
    *   Crie uma chave e copie
    *   Cole na interface da Maia.ai

---

## 🔐 Segurança e Privacidade

*   ✅ A API Key é armazenada **apenas na memória do navegador** (`sessionStorage`)
*   ✅ Não é persisted em disco ou enviada para servidores terceiros
*   ✅ Recomenda-se **restringir a chave** no Google AI Studio para domínios específicos
*   ⚠️ Ao inserir sua chave em nosso site, você está consciente dos possíveis riscos de vazamento dela.

---

## 🧮 Motor de Avaliação (Snippet Técnico)

O coração da adaptação do aluno combina precisão, tempo e confiança:

```javascript
// Exemplo simplificado do motor de avaliação (avaliarPasso.js)
var taxaDeCerteza = Math.abs(50 - guess) / 50; 
// Quão longe do centro (50%) o slider estava [0-1]

var taxaDeAcerto = (respostaCorreta === respostaUsuario) ? 1 : 0;
// 1 = Acertou | 0 = Errou

// Penalidade suave baseada em curva exponencial
// Se demorar o dobro do ideal, penaliza ~60%
let pesoTempo = Math.exp(-0.05 * Math.sqrt(Math.abs(tempoGasto - tempoIdeal)));

// Score final do passo (0-1) impacta dificuldade da próxima pergunta
var resultadoPasso = taxaDeAcerto * pesoTempo * taxaDeCerteza;

// Média de todos os passos = Proficiência Geral do Usuário
var mediaPassos = passosResultados.reduce((a, b) => a + b, 0) / passosResultados.length;
```

---

## 🔄 Fluxo da Aplicação

```
1. Usuário digita tópico
   ↓
2. Gemini gera questão-alvo (com 5 alternativas)
   ↓
3. Gemini gera PASSO 1 (pergunta simpler True/False)
   ↓
4. Usuário responde com slider (False ← → True)
   ↓
5. Avalia: precisão × tempo × confiança = Score
   ↓
6. Raciocínio adaptativo ajusta dificuldade
   ↓
7. Gera PASSO 2, PASSO 3... até conclusão
   ↓
8. Usuário responde questão-alvo original
   ↓
9. Exibe análise de desempenho (Stats for Nerds)
   ↓
10. Opções: Nova questão, Treinar dificuldades, Novo tópico
```

---

## 📊 Métricas Coletadas

Cada passo gera um objeto JSON com:

```json
{
  "passo_1": {
    "pergunta": "A fotossíntese ocorre principalmente nas mitocôndrias?",
    "contexto": {
      "pergunta": "...",
      "contexto": "...",
      "raciocinio_adaptativo": "Aumentei a dificuldade porque o aluno mantém 85% de proficiência",
      "status": true,
      "tempo_ideal": 15,
      "tempo_gasto": 12,
      "topicos_para_revisao": ["Mitocôndrias", "Cloroplasto"],
      "explicacao": "A fotossíntese ocorre nos CLOROPLASTOS, não na mitocôndria..."
    },
    "taxaDeCerteza": 0.8,
    "taxaDeAcerto": 1,
    "pesoTempo": 0.95,
    "resultadoPasso": 0.76,
    "mediaPassos": 0.76
  }
}
```

---

## 🎓 Inspiração Pedagógica

Este projeto implementa conceitos de:
*   **Scaffolding de Vygotsky:** Suporte gradualmente reduzido conforme o aluno progride
*   **ZPD (Zona de Desenvolvimento Proximal):** Problemas no limite entre o que o aluno sabe e pode aprender
*   **Feedback Formativo:** Informações contínuas sobre desempenho, não apenas notas
*   **Gamificação Educacional:** Métricas visuais motivam engajamento

---

## 📄 Licença

Este projeto é protegido pela licença **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Isso significa que você é livre para usar, estudar, copiar, modificar e distribuir este software, inclusive para fins comerciais, **desde que** qualquer redistribuição (do projeto original ou de versões modificadas) mantenha os avisos de direitos autorais e a própria licença, e que o código-fonte (ou um meio válido de obtê-lo) seja disponibilizado junto da distribuição.

Além disso, a **AGPL-3.0** também se aplica ao uso do software **via rede**: se você modificar este projeto e disponibilizar a versão modificada para outras pessoas usarem por meio de um serviço online (por exemplo, um site, API ou aplicação hospedada), você deve disponibilizar o **código-fonte correspondente** dessa versão aos usuários do serviço, sob a mesma licença.

Em outras palavras: se você publicar uma versão modificada, incorporar este projeto em um trabalho derivado e distribuí-lo — ou executá-lo para terceiros através da internet — você também deve licenciar esse trabalho sob a **AGPL-3.0**, garantindo as mesmas liberdades para as próximas pessoas. Acreditamos que o conhecimento cresce quando é compartilhado — e que essas liberdades devem permanecer protegidas para todos.

---

## 👨‍💻 Desenvolvimento

### Stack Local Recomendado
*   **Editor:** VS Code com extensões: ES6 Linter, Prettier, Live Server
*   **Versionamento:** Git + GitHub
*   **Testing:** Console do navegador + DevTools

### Contribuindo
Se você deseja contribuir com melhorias:
1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/sua-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/sua-feature`)
5. Abra um Pull Request

---

> Desenvolvido com 💙 e ☕ por ToqueReflexo
>
> **Maia.ai** – Tornando a educação adaptativa, personalizada e inteligente.
>
> *"O melhor tutor é aquele que entende exatamente onde você está."* — Baseado em Vygotsky
