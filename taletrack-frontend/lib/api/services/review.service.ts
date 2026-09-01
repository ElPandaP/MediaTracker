import { apiClient } from '../client';
import type {
  AddReviewResponse,
  GetReviewsResponse,
  EditReviewRequest,
} from '../../types';

export const reviewService = {
  /** Create a review. Backend policy: JWT + internal API key. */
  async addReview(mediaId: number, rating: number, comment?: string): Promise<AddReviewResponse> {
    return apiClient.post<AddReviewResponse>(
      '/review',
      { mediaId, rating, comment },
      true,
      true,
    );
  },

  async editReview(id: number, rating: number, comment?: string): Promise<AddReviewResponse> {
    return apiClient.put<AddReviewResponse>(
      `/review/${id}`,
      { rating, comment } as EditReviewRequest,
      true,
      true,
    );
  },

  async deleteReview(id: number): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/review/${id}`,
      true,
      true,
    );
  },

  /** Reviews written by the current user. Backend policy: JWT only. */
  async getMine(): Promise<GetReviewsResponse> {
    return apiClient.get<GetReviewsResponse>('/reviews', true, false);
  },
};
