export type Video = {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  video_path: string | null;
  external_url: string | null;
  thumbnail_path: string | null;
  frame_paths: string[];
  sort_order: number;
  published: boolean;
  created_at: string;
};

export type About = {
  id: number;
  name: string;
  headline: string | null;
  bio: string | null;
  photo_path: string | null;
  email: string | null;
  updated_at: string;
};
