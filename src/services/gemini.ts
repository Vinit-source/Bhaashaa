import { GoogleGenAI, Type } from "@google/genai";
import { LanguagePair } from '../db';

export async function generateSentences(apiKey: string, count: number, topics: string, difficulty: string, pair: LanguagePair) {
  if (!apiKey) {
    throw new Error("No Gemini API key provided. Please provide a valid key.");
  }

  const ai = new GoogleGenAI({ 
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  let diffInstruction = "Minimum length 3 words per sentence.";
  if (difficulty === 'medium') diffInstruction = "Minimum length 5 words per sentence.";
  if (difficulty === 'hard') diffInstruction = "Comprehensive sentences and conversational phrases. Longer sentences.";

  const languages = pair.sourceLanguage2 ? `${pair.sourceLanguage1}/${pair.sourceLanguage2}` : pair.sourceLanguage1;
  const scriptLang = (pair.sourceLanguage2 && pair.sourceLanguage2.toLowerCase() !== 'english') ? pair.sourceLanguage2 : pair.sourceLanguage1;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: `Generate ${count || 20} unique sentences in ${pair.targetLanguage} for someone learning spoken ${pair.targetLanguage} through ${languages}. 
    Focus on casual, everyday conversational phrases. Topics: ${topics || 'general everyday conversation'}.
    Difficulty level: ${difficulty || 'easy'}. ${diffInstruction}
    Provide the ${pair.targetLanguage} script, Romanised ${pair.targetLanguage} (transliteration), ${scriptLang} transliteration (${pair.targetLanguage} words written in ${scriptLang} script) if requested/applicable, ${pair.sourceLanguage1} translation, ${pair.sourceLanguage2 || 'an alternative'} translation, and a word-by-word meaning breakdown for each sentence.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            targetText: { type: Type.STRING, description: `The ${pair.targetLanguage} sentence in its native script` },
            transliteration: { type: Type.STRING, description: `The ${pair.targetLanguage} sentence in Roman script (capitalized preferably)` },
            nativeTransliteration: { type: Type.STRING, description: `The ${pair.targetLanguage} sentence written in ${scriptLang} script` },
            sourceText1: { type: Type.STRING, description: `The ${pair.sourceLanguage1} translation of the sentence` },
            sourceText2: { type: Type.STRING, description: `The ${pair.sourceLanguage2 || 'English'} translation of the sentence` },
            wordMeanings: {
              type: Type.ARRAY,
              description: `Word by word meaning of the ${pair.targetLanguage} sentence`,
              items: {
                type: Type.OBJECT,
                properties: {
                  targetText: { type: Type.STRING, description: `The ${pair.targetLanguage} word` },
                  transliteration: { type: Type.STRING, description: `The ${pair.targetLanguage} word in Roman script` },
                  nativeTransliteration: { type: Type.STRING, description: `The ${pair.targetLanguage} word in ${scriptLang} script` },
                  sourceText2: { type: Type.STRING, description: `${pair.sourceLanguage2 || 'English'} meaning` },
                  sourceText1: { type: Type.STRING, description: `${pair.sourceLanguage1} meaning` }
                },
                required: ["targetText", "sourceText2", "sourceText1"]
              }
            }
          },
          required: ["targetText", "transliteration", "sourceText1", "sourceText2", "wordMeanings"]
        }
      }
    }
  });

  const jsonStr = response.text?.trim() || "[]";
  try {
    const sentences = JSON.parse(jsonStr);
    return sentences;
  } catch (e) {
    throw new Error("Failed to parse AI response");
  }
}

export async function translateText(apiKey: string, text: string, sourceLang: string, pair: LanguagePair) {
  if (!apiKey) {
    throw new Error("No Gemini API key provided. Please provide a valid key.");
  }

  const ai = new GoogleGenAI({ 
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const scriptLang = (pair.sourceLanguage2 && pair.sourceLanguage2.toLowerCase() !== 'english') ? pair.sourceLanguage2 : pair.sourceLanguage1;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: `Translate the following ${sourceLang} text to spoken ${pair.targetLanguage}. Provide the ${pair.targetLanguage} script, Romanised ${pair.targetLanguage} (transliteration), ${scriptLang} transliteration (${pair.targetLanguage} words written in ${scriptLang} script) if possible, ${pair.sourceLanguage1} translation, ${pair.sourceLanguage2 || 'English'} translation, and a word-by-word meaning breakdown. 
    Text to translate: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          targetText: { type: Type.STRING, description: `The ${pair.targetLanguage} sentence in its native script` },
          transliteration: { type: Type.STRING, description: `The ${pair.targetLanguage} sentence in Roman script (capitalized preferably)` },
          nativeTransliteration: { type: Type.STRING, description: `The ${pair.targetLanguage} sentence written in ${scriptLang} script` },
          sourceText1: { type: Type.STRING, description: `The ${pair.sourceLanguage1} translation of the sentence` },
          sourceText2: { type: Type.STRING, description: `The ${pair.sourceLanguage2 || 'English'} translation of the sentence` },
          wordMeanings: {
            type: Type.ARRAY,
            description: `Word by word meaning of the ${pair.targetLanguage} sentence`,
            items: {
              type: Type.OBJECT,
              properties: {
                targetText: { type: Type.STRING, description: `The ${pair.targetLanguage} word` },
                transliteration: { type: Type.STRING, description: `The ${pair.targetLanguage} word in Roman script` },
                nativeTransliteration: { type: Type.STRING, description: `The ${pair.targetLanguage} word in ${scriptLang} script` },
                sourceText2: { type: Type.STRING, description: `${pair.sourceLanguage2 || 'English'} meaning` },
                sourceText1: { type: Type.STRING, description: `${pair.sourceLanguage1} meaning` }
              },
              required: ["targetText", "sourceText2", "sourceText1"]
            }
          }
        },
        required: ["targetText", "transliteration", "sourceText1", "sourceText2", "wordMeanings"]
      }
    }
  });

  const jsonStr = response.text?.trim() || "{}";
  try {
    const result = JSON.parse(jsonStr);
    return result;
  } catch (e) {
    throw new Error("Failed to parse AI response");
  }
}
