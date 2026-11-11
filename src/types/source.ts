export type VideoSourceType = 'youtube' | 'drive' | 'rtsp' | 'direct' | 'file';

export type VideoSource =
  | { kind: 'camera' }
  | {
      kind: 'url';
      type: VideoSourceType;
      title: string;
      /** Same-origin playable URL (proxied stream, HLS playlist, or blob: for files) */
      streamUrl: string;
      /** Original user-provided URL (empty for local files) */
      sourceUrl: string;
    };
