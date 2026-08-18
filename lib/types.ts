export type GenerationStatus = "pending" | "processing" | "completed" | "failed";
export type AspectRatio = "16:9" | "9:16" | "1:1";
export type Resolution = "720p" | "1080p";

export type GenerationVideo = {
  id: string;
  generation_id: string;
  script_index: number;
  status: GenerationStatus;
  video_url: string | null;
  created_at: string;
};

export type Generation = {
  id: string;
  clerk_user_id: string;
  product_name: string;
  product_image_url: string;
  extra_product_image_urls: string[];
  custom_prompt: string | null;
  avatar_url: string | null;
  aspect_ratio: AspectRatio;
  resolution: Resolution;
  status: GenerationStatus;
  credit_cost: number | null;
  fal_request_id: string | null;
  created_at: string;
  generation_videos: GenerationVideo[];
};
