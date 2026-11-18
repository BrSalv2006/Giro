import { sanitizeText } from '../security/sanitize.js';

/**
 * Strips XSS payloads and common PII patterns (emails, phones, NIF/CC, personal contacts)
 * before any text leaves the backend boundary (RNF-SEG-05).
 */
export function sanitizePII(text) {
  if (typeof text !== 'string') return '';
  let clean = sanitizeText(text);
  clean = clean.replace(/(?:\bmailto:)?[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[EMAIL]');
  clean = clean.replace(/\btel:\s*(?:\+|00)?[\d\s().-]{7,18}\d/gi, '[TELEFONE]');
  clean = clean.replace(/(?:\+|00)\d{1,3}[\s.-]?(?:\(?\d{1,4}\)?[\s.-]?){2,5}\d{2,4}/g, '[TELEFONE]');
  clean = clean.replace(/(?<!\d)(?:\(\d{2,4}\)\s?\d{3,4}[\s.-]?\d{3,4}|\d{2,3}[\s.-]\d{3}[\s.-]\d{3,4})(?!\d)/g, '[TELEFONE]');
  clean = clean.replace(/\b(tel(?:efone|em[oó]vel)?|tlm|phone|mobile|fone|whatsapp)\b(\s*[:=-]?\s*)\d{9}\b/gi, '$1$2[TELEFONE]');
  clean = clean.replace(/\b\d{8}[\s-]?\d[\s-]?[A-Z]{2}\d\b/gi, '[NIF]');
  clean = clean.replace(/\b(cc|cart[aã]o de cidad[aã]o|bi)\b(\s*[:=-]?\s*)\d{8}\b/gi, '$1$2[NIF]');
  clean = clean.replace(/(?<![a-f0-9-])\b\d{9}\b(?![a-f0-9-])/gi, '[NIF]');
  clean = clean.replace(/(?<![a-f0-9-])\b\d{10,15}\b(?![a-f0-9-])/gi, '[TELEFONE]');
  clean = clean.replace(/https?:\/\/(?:www\.)?(?:linkedin\.com\/in|wa\.me|t\.me|instagram\.com|facebook\.com)\/[^\s,;)]+/gi, '[CONTACTO]');
  clean = clean.replace(/\b[A-Z]{2}\d{2}(?:\s?\d{4}){4,6}\s?\d{0,4}\b/g, '[CONTACTO]');
  clean = clean.replace(/(^|\s)@[a-zA-Z0-9_.-]{3,30}\b/g, '$1[CONTACTO]');
  clean = clean.replace(/\b(?:contacto|contato|skype|whatsapp|telegram|morada|endere[cç]o)\b\s*[:=]\s*(?!\[(?:EMAIL|TELEFONE|NIF|CONTACTO)\])[^\n,;]+/gi, '[CONTACTO]');
  return clean.trim();
}

function buildHeuristicPrioritization({ titulo, descricao, categoria, impactEstimate, sanitizedText, available }) {
  const combined = `${titulo} ${descricao}`.toLowerCase();
  const categoryBase = {
    SEGURANCA: 8,
    BUG: 8,
    NOVA_FUNCIONALIDADE: 7,
    MELHORIA: 6,
  }[String(categoria).toUpperCase()] ?? 5;

  const hasUrgency = /seguran[çc]a|cr[ií]tico|bloqueio|autentica[çc][aã]o|erro|falha|performance|dados/.test(combined);
  const rawImpact = Number.isFinite(Number(impactEstimate)) && impactEstimate !== null && impactEstimate !== ''
    ? Number(impactEstimate)
    : categoryBase + (hasUrgency ? 1 : 0);
  const impactoSugerido = Math.min(10, Math.max(1, Math.round(rawImpact)));

  const hasComplexity = /migra[çc][aã]o|integra[çc][aã]o|arquitetura|intelig[êe]ncia|relat[oó]rio|oauth|sso/.test(combined);
  const esforcoSugerido = hasComplexity
    ? (combined.length > 140 ? 8 : 5)
    : (combined.length > 160 ? 5 : combined.length > 60 ? 3 : 2);

  const rawScore = impactoSugerido * 0.7 + (11 - Math.min(esforcoSugerido, 10)) * 0.3;
  const scorePrioridade = Math.round(Math.min(10, Math.max(1, rawScore)) * 10) / 10;

  return {
    available,
    fallback: true,
    advisoryOnly: true,
    scorePrioridade,
    esforcoSugerido,
    impactoSugerido,
    justificacao: `Sugestão heurística consultiva para categoria ${categoria || 'GERAL'}: impacto ${impactoSugerido}/10 e esforço estimado ${esforcoSugerido} pts. A decisão final pertence ao Product Owner.`,
    sanitizedText,
  };
}

export class AIAdapter {
  get available() {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async suggestPrioritization({ titulo = '', descricao = '', categoria = '', impactEstimate } = {}) {
    const cleanTitle = sanitizePII(String(titulo ?? ''));
    const cleanDescription = sanitizePII(String(descricao ?? ''));
    const cleanCategory = sanitizePII(String(categoria ?? ''));
    const sanitizedText = [cleanTitle, cleanDescription, cleanCategory].filter(Boolean).join(' | ');
    const fallbackResult = buildHeuristicPrioritization({
      titulo: cleanTitle,
      descricao: cleanDescription,
      categoria: cleanCategory,
      impactEstimate,
      sanitizedText,
      available: this.available,
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return fallbackResult;

    try {
      const prompt = [
        'Analisa este pedido (sem PII) e responde APENAS com JSON válido:',
        '{ "scorePrioridade": number (1-10), "esforcoSugerido": number (1-13), "impactoSugerido": number (1-10), "justificacao": string }',
        `Categoria: ${cleanCategory || 'GERAL'}`,
        `Título: ${cleanTitle}`,
        `Descrição: ${cleanDescription}`,
        impactEstimate !== undefined && impactEstimate !== null ? `Impacto estimado inicial: ${impactEstimate}` : '',
      ].filter(Boolean).join('\n');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!response.ok) return fallbackResult;
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return fallbackResult;
      const parsed = JSON.parse(rawText);
      const clamp = (value, min, max, fallback) => {
        const n = Number(value);
        return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
      };
      return {
        available: true,
        fallback: false,
        advisoryOnly: true,
        scorePrioridade: Math.round(clamp(parsed.scorePrioridade, 1, 10, fallbackResult.scorePrioridade) * 10) / 10,
        esforcoSugerido: Math.round(clamp(parsed.esforcoSugerido, 1, 13, fallbackResult.esforcoSugerido)),
        impactoSugerido: Math.round(clamp(parsed.impactoSugerido, 1, 10, fallbackResult.impactoSugerido)),
        justificacao: sanitizePII(String(parsed.justificacao || fallbackResult.justificacao)),
        sanitizedText,
      };
    } catch {
      return fallbackResult;
    }
  }

  async suggest(text) {
    const sanitizedText = sanitizePII(String(text ?? ''));
    const result = await this.suggestPrioritization({ titulo: sanitizedText, descricao: '', categoria: 'GERAL' });
    if (!result.available) {
      return {
        ...result,
        code: 'AI_UNAVAILABLE',
        message: 'Serviço de IA indisponível: credenciais não configuradas.',
      };
    }
    return result;
  }
}
