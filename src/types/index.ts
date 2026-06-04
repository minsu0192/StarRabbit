export type Platform = 'naver' | 'kakao' | 'etc';
export type Status = 'ongoing' | 'completed';

export interface Webtoon {
  id: string;
  title: string;
  author: string;
  platform: Platform;
  genre: string | null;
  status: Status | null;
  created_at: string;
}

export interface WebtoonWithStats extends Webtoon {
  avg_score: number | null;
  review_count: number;
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

export type SortOption = 'score' | 'popular' | 'latest';

export interface ReviewWithProfile extends Omit<Review, 'profiles'> {
  profiles: Pick<Profile, 'nickname' | 'total_recommends'>;
}
