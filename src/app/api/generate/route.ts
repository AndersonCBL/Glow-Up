import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Certifique-se de configurar a variável de ambiente GEMINI_API_KEY no seu arquivo .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const systemInstruction = `Você é um assistente de marketing especializado em clínicas de estética de luxo.
Seu objetivo é gerar conteúdo envolvente, profissional e sofisticado.
O conteúdo deve refletir exclusividade, alta qualidade e resultados reais, usando uma linguagem elegante.
Você receberá o nome/descrição de um procedimento e o tom de voz desejado.
Responda APENAS com um objeto JSON válido, contendo as seguintes chaves:
- "insta_caption": A legenda para o Instagram (inclua hashtags relevantes).
- "reels_script": Um roteiro curto e direto para um vídeo de Reels (ideias visuais e texto).
- "wa_message": Uma mensagem persuasiva e acolhedora para enviar aos clientes via WhatsApp.`;

export async function POST(request: Request) {
  try {
    const getErrorMessage = (err: unknown) => {
      if (err instanceof Error) return err.message;
      if (typeof err === 'string') return err;
      return undefined;
    };

    const body = await request.json();
    const { procedure, tone } = body;

    if (!procedure || !tone) {
      return NextResponse.json(
        { error: 'Os campos "procedure" e "tone" são obrigatórios.' },
        { status: 400 }
      );
    }

    // Inicializa o modelo configurando a instrução de sistema
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
    });

    const prompt = `Gere o conteúdo para o procedimento: "${procedure}" utilizando o tom de voz: "${tone}".`;

    // Chama a API do Gemini
    let responseText = '';
    try {
      const result = await model.generateContent(prompt);
      responseText = result.response.text();
    } catch (apiError: unknown) {
      console.error('Erro na API Gemini:', apiError);
      return NextResponse.json(
        { success: false, error: getErrorMessage(apiError) || 'Erro ao comunicar com a API do Gemini.' },
        { status: 500 }
      );
    }

    // Extrai o JSON da resposta caso venha formatado com markdown de bloco de código
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : responseText;

    try {
      const parsedData = JSON.parse(jsonString);
      return NextResponse.json(parsedData);
    } catch {
      console.error('Erro ao fazer o parse do JSON retornado pelo Gemini:', responseText);
      return NextResponse.json(
        { error: 'A resposta gerada não estava em um formato JSON válido.', details: responseText },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error('Erro ao processar a requisição:', error);
    return NextResponse.json(
      { success: false, error: (error instanceof Error ? error.message : undefined) || 'Ocorreu um erro ao gerar o conteúdo.' },
      { status: 500 }
    );
  }
}
