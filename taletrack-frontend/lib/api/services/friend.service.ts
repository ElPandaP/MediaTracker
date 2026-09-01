import { apiClient } from '../client';
import type { FriendsResponse, ActivityResponse, UserSearchResponse } from '../../types';

export const friendService = {
  async getFriends(): Promise<FriendsResponse> {
    return apiClient.get<FriendsResponse>('/friends', true, false);
  },

  async searchByUsername(username: string): Promise<UserSearchResponse> {
    return apiClient.get<UserSearchResponse>(
      `/users/search?username=${encodeURIComponent(username)}`,
      true,
      false,
    );
  },

  async sendRequest(userId: number): Promise<{ success: boolean; message?: string }> {
    return apiClient.post('/friends/requests', { userId }, true, false);
  },

  async respond(requestId: number, accept: boolean): Promise<{ success: boolean }> {
    return apiClient.post(`/friends/requests/${requestId}`, { accept }, true, false);
  },

  async remove(userId: number): Promise<{ success: boolean }> {
    return apiClient.delete(`/friends/${userId}`, true, false);
  },
};

export const activityService = {
  async getFeed(scope: 'all' | 'mine' | 'friends' = 'all', limit = 200): Promise<ActivityResponse> {
    return apiClient.get<ActivityResponse>(`/activity?scope=${scope}&limit=${limit}`, true, false);
  },
};
