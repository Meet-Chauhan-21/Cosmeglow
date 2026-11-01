import React, { useState } from 'react';

export interface VideoInfo {
  type: 'youtube' | 'vimeo' | 'drive' | 'direct';
  id?: string;
  embedUrl: string;
  originalUrl: string;
  platformName: string;
}

/**
 * Parses any video URL (YouTube watch, shorts, live, embed, youtu.be, Vimeo, Google Drive, direct mp4/webm/etc)
 * or even if the user pasted an iframe embed code.
 */
export const parseVideoUrl = (rawUrl: string): VideoInfo | null => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  let url = rawUrl.trim();
  if (!url) return null;

  // If user pasted an iframe embed snippet: <iframe ... src="..." ...>
  const iframeSrcMatch = url.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    url = iframeSrcMatch[1].trim();
  }

  // 1. YouTube
  // Matches:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/live/VIDEO_ID
  // - https://youtube.com/live/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube-nocookie.com/embed/VIDEO_ID
  const ytRegex = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      id: ytMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
      originalUrl: url,
      platformName: 'YouTube'
    };
  }

  // 2. Vimeo
  // Matches:
  // - https://vimeo.com/123456789
  // - https://player.vimeo.com/video/123456789
  // - https://vimeo.com/channels/.../123456789
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)(\d+)|player\.vimeo\.com\/video\/(\d+))/i;
  const vimeoMatch = url.match(vimeoRegex);
  const vimeoId = vimeoMatch ? (vimeoMatch[1] || vimeoMatch[2]) : null;
  if (vimeoId) {
    return {
      type: 'vimeo',
      id: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      originalUrl: url,
      platformName: 'Vimeo'
    };
  }

  // 3. Google Drive
  // Matches:
  // - https://drive.google.com/file/d/FILE_ID/view
  // - https://drive.google.com/open?id=FILE_ID
  const driveRegex = /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+)))/i;
  const driveMatch = url.match(driveRegex);
  const driveId = driveMatch ? (driveMatch[1] || driveMatch[2]) : null;
  if (driveId) {
    return {
      type: 'drive',
      id: driveId,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      originalUrl: url,
      platformName: 'Google Drive'
    };
  }

  // 4. Direct video URL or Cloudinary
  return {
    type: 'direct',
    embedUrl: url,
    originalUrl: url,
    platformName: url.includes('cloudinary') ? 'Cloudinary Video' : 'Direct Video'
  };
};

interface VideoPlayerProps {
  url: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  title?: string;
  onErrorFallback?: React.ReactNode;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  className = 'w-full h-full object-contain',
  autoPlay = false,
  muted = true,
  controls = true,
  title = 'Product Video',
  onErrorFallback
}) => {
  const [loadError, setLoadError] = useState(false);
  const info = parseVideoUrl(url);

  if (!info) {
    return null;
  }

  if (loadError) {
    return (
      onErrorFallback || (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-300 text-center">
          <p className="text-xs font-medium">Unable to preview this video link directly.</p>
          <a
            href={info.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-indigo-400 hover:text-indigo-300 underline mt-1.5"
          >
            Open video in new tab &rarr;
          </a>
        </div>
      )
    );
  }

  if (info.type === 'youtube') {
    const params = new URLSearchParams();
    if (autoPlay) {
      params.set('autoplay', '1');
      if (muted) params.set('mute', '1');
    }
    params.set('rel', '0');
    params.set('modestbranding', '1');
    const fullEmbedUrl = `${info.embedUrl}?${params.toString()}`;

    return (
      <iframe
        className={className}
        src={fullEmbedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onError={() => setLoadError(true)}
      />
    );
  }

  if (info.type === 'vimeo') {
    const params = new URLSearchParams();
    if (autoPlay) {
      params.set('autoplay', '1');
      if (muted) params.set('muted', '1');
    }
    const fullEmbedUrl = `${info.embedUrl}?${params.toString()}`;

    return (
      <iframe
        className={className}
        src={fullEmbedUrl}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        onError={() => setLoadError(true)}
      />
    );
  }

  if (info.type === 'drive') {
    return (
      <iframe
        className={className}
        src={info.embedUrl}
        title={title}
        allow="autoplay; fullscreen"
        allowFullScreen
        onError={() => setLoadError(true)}
      />
    );
  }

  // Direct video tag
  return (
    <video
      src={info.embedUrl}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      playsInline
      preload="metadata"
      onError={() => setLoadError(true)}
    />
  );
};

