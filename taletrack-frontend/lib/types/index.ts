// User types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

// Media types
export type MediaType = 'Film' | 'Serie' | 'Book' | 'Comic';

export interface Media {
  id: number;
  title: string;
  type: MediaType;
  length?: number;
  description?: string;
  posterUrl?: string;
  author?: string;
  isbn?: string;
  firstTrackedAt: string;
  updatedAt: string;
}

export interface Book {
  id: number;
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
  pages?: number;
  finishedAt: string;
}

export interface GetUserBooksResponse {
  success: boolean;
  count: number;
  data: Book[];
}

export interface AddMediaRequest {
  title: string;
  type: MediaType;
  length?: number;
}

export interface AddMediaResponse {
  success: boolean;
  message: string;
}

// TrackingEvent types
export interface TrackingEvent {
  id: number;
  userId: number;
  mediaId: number;
  progress: number;
  eventDate: string;
  media?: Media;
}

export interface GetTrackingEventsRequest {
  type?: MediaType;
  limit?: number;
  orderBy?: string;
}

export interface GetTrackingEventsResponse {
  success: boolean;
  count: number;
  data: TrackingEvent[];
}

// Review types
export interface Review {
  id: number;
  userId: number;
  mediaId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddReviewRequest {
  mediaId: number;
  rating: number;
  comment?: string;
}

export interface AddReviewResponse {
  success: boolean;
  message: string;
}

// ─── Home / Library / Stats ──────────────────────────────────
// The backend uses these three type slugs for Media.type.
export type LibraryType = 'Book' | 'Movie' | 'Series';

export interface LibraryItem {
  mediaId: number;
  title: string;
  type: LibraryType;
  author?: string | null;
  posterUrl?: string | null;
  length: number;
  isbn?: string | null;
  progress?: number | null;
  lastEventDate: string;
  myRating?: number | null;
  myReviewId?: number | null;
}

export interface GetLibraryResponse {
  success: boolean;
  count: number;
  /** Total matching items before any limit — for "50 · see all" style counts. */
  total?: number;
  data: LibraryItem[];
}

export interface YearlyStats {
  year: number;
  total: number;
  byType: { book: number; movie: number; series: number };
  byMonth: number[]; // length 12, Jan → Dec
  reviewCount: number;
}

export interface GetStatsResponse {
  success: boolean;
  data: YearlyStats;
}

export interface ReviewItem {
  id: number;
  mediaId: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  media?: {
    id: number;
    title: string;
    type: LibraryType;
    posterUrl?: string | null;
    author?: string | null;
  };
}

export interface GetReviewsResponse {
  success: boolean;
  count: number;
  data: ReviewItem[];
}

export interface EditReviewRequest {
  rating: number;
  comment?: string;
}

export interface MediaDetailReview {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  username?: string | null;
  mine: boolean;
}

export interface MediaDetail {
  id: number;
  title: string;
  type: LibraryType;
  author?: string | null;
  posterUrl?: string | null;
  length: number;
  isbn?: string | null;
  description?: string | null;
  avgRating?: number | null;
  reviewCount: number;
  myProgress?: number | null;
  myLastEventDate?: string | null;
  myReviewId?: number | null;
  myRating?: number | null;
  myComment?: string | null;
  reviews: MediaDetailReview[];
}

export interface GetMediaDetailResponse {
  success: boolean;
  data: MediaDetail;
}
