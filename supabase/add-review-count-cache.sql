-- webtoons 테이블에 리뷰 수 캐시 컬럼 추가
ALTER TABLE webtoons ADD COLUMN IF NOT EXISTS cached_review_count int NOT NULL DEFAULT 0;

-- 기존 리뷰 수 반영
UPDATE webtoons
SET cached_review_count = (SELECT COUNT(*) FROM reviews WHERE reviews.webtoon_id = webtoons.id);

-- reviews INSERT/UPDATE/DELETE 시 자동 갱신 트리거
CREATE OR REPLACE FUNCTION sync_webtoon_review_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  target_id uuid;
BEGIN
  target_id := COALESCE(NEW.webtoon_id, OLD.webtoon_id);
  UPDATE webtoons
  SET cached_review_count = (SELECT COUNT(*) FROM reviews WHERE webtoon_id = target_id)
  WHERE id = target_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS reviews_count_sync ON reviews;
CREATE TRIGGER reviews_count_sync
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION sync_webtoon_review_count();
