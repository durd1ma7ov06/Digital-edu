export interface RoleRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleRequestWithProfile extends RoleRequest {
  profiles: {
    full_name: string;
    group_name: string;
    avatar_emoji: string;
  };
}
