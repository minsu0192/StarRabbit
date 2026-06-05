export type Platform = 'naver' | 'kakao' | 'ridi' | 'etc';
export type Status = 'ongoing' | 'completed';
export type Origin = 'korea' | 'japan' | 'china' | 'unknown';

export interface Webtoon {
  id: string;
  title: string;
  author: string;
  platform: Platform;
  genre: string | null;
  status: Status | null;
  created_at: string;
}

export interface WebtoonSource {
  id: string;
  webtoon_id: string;
  platform: Platform;
  external_id: string | null;
  source_url: string | null;
  title: string;
  author: string | null;
  status: Status | null;
  genre: string | null;
  last_seen_at: string;
  source_checked_at: string | null;
}

export interface WebtoonWithStats extends Webtoon {
  avg_score: number | null;
  review_count: number;
  weekly_avg_score: number | null;
  weekly_review_count: number;
  weekly_comment_count: number;
  low_score_count: number;
  high_score_count: number;
  one_score_count: number;
  ten_score_count: number;
  origin: Origin;
  sources: WebtoonSource[];
}

export interface Profile {
  id: string;
  nickname: string;
  total_recommends: number;
  created_at: string;
}

export interface Review {
  id: string;
  webtoon_id: string;
  user_id: string;
  score: number;
  comment: string;
  recommend_count: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export type SortOption = 'featured' | 'score' | 'popular' | 'weekly_score' | 'weekly_comments' | 'latest';

export interface ReviewWithProfile extends Omit<Review, 'profiles'> {
  profiles: Pick<Profile, 'nickname' | 'total_recommends'>;
}
