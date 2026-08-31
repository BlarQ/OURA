import { DailyReview, WeeklyReview, MonthlyReview } from '@/types';
import { localStore } from '../supabase/client';

export const reviewService = {
  async getDailyReviews(): Promise<DailyReview[]> {
    return [...localStore.dailyReviews];
  },

  async createDailyReview(data: Omit<DailyReview, 'id' | 'user_id' | 'created_at'>): Promise<DailyReview> {
    const newReview: DailyReview = {
      ...data,
      id: `drev_${Date.now()}`,
      user_id: localStore.profile.id,
      created_at: new Date().toISOString(),
    };
    localStore.dailyReviews.unshift(newReview);
    return newReview;
  },

  async getWeeklyReviews(): Promise<WeeklyReview[]> {
    return [...localStore.weeklyReviews];
  },

  async getMonthlyReviews(): Promise<MonthlyReview[]> {
    return [...localStore.monthlyReviews];
  },
};
