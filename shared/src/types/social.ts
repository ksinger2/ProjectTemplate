import { Media } from './media';
import { UserProfile } from './user';

export type FriendStatus = 'pending' | 'accepted' | 'blocked';

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: FriendStatus;
  createdAt: string;
}

export interface FriendWithProfile extends Friend {
  friend: UserProfile;
}

export interface Recommendation {
  id: string;
  fromUserId: string;
  toUserId: string;
  mediaId: string;
  message: string | null;
  seen: boolean;
  createdAt: string;
}

export interface RecommendationWithDetails extends Recommendation {
  fromUser: UserProfile;
  media: Media;
}
