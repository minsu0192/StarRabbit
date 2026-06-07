import { containsProfanity, containsPromoLink } from '@/lib/filter';

type ValidationError = { error: string };
type ReviewValidationSuccess = { score: number; comment: string };
type ReplyValidationSuccess = { comment: string };

export function normalizeScore(score: unknown) {
  const value = Number(score);
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value * 2) / 2;
  if (rounded < 1 || rounded > 10) return null;
  return rounded;
}

export function normalizeText(text: unknown) {
  return String(text ?? '').trim().replace(/\s+/g, ' ');
}

export function validateReviewInput(score: unknown, comment: unknown): ValidationError | ReviewValidationSuccess {
  const safeScore = normalizeScore(score);
  if (safeScore === null) {
    return { error: '평점은 1.0점부터 10.0점까지 0.5점 단위로 입력해주세요' };
  }

  const trimmed = normalizeText(comment);
  if (trimmed.length === 1) return { error: '한줄평은 비우거나 2자 이상 입력해주세요' };
  if (trimmed.length > 200) return { error: '한줄평은 200자 이하여야 합니다' };
  if (trimmed && containsProfanity(trimmed)) return { error: '금지된 표현이 포함되어 있습니다' };
  if (trimmed && containsPromoLink(trimmed)) return { error: '외부 링크나 홍보성 내용은 작성할 수 없습니다' };

  return { score: safeScore, comment: trimmed };
}

export function validateReplyInput(comment: unknown): ValidationError | ReplyValidationSuccess {
  const trimmed = normalizeText(comment);
  if (!trimmed) return { error: '내용을 입력해주세요' };
  if (trimmed.length > 300) return { error: '300자 이하로 입력해주세요' };
  if (containsProfanity(trimmed)) return { error: '금지된 표현이 포함되어 있습니다' };
  if (containsPromoLink(trimmed)) return { error: '외부 링크나 홍보성 내용은 작성할 수 없습니다' };

  return { comment: trimmed };
}
