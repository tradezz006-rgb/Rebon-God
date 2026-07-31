import React, { useRef, useEffect, useState } from 'react';
import { AvaStatus } from '../../types/avaVoice';

const AVATAR_VIDEO_URL = '/ava_talk_new.mp4';

interface AvatarProps {
  status: AvaStatus;
}

export const VoiceAvatar: React.FC<AvatarProps> = ({ status }) => {
  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const talkVideoRef = useRef<HTMLVideoElement>(null);
  const [halfTime, setHalfTime] = useState(0.5); // Default to 0.5s until metadata loads
  
  const isTalking = status === 'speaking' || status === 'thinking';

  // Load video duration to split it into two halves
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (e.currentTarget.duration) {
      setHalfTime(e.currentTarget.duration / 2);
    }
  };

  // Idle Loop: Play from 0 to halfTime
  const handleIdleTimeUpdate = () => {
    if (idleVideoRef.current && idleVideoRef.current.currentTime >= halfTime) {
      idleVideoRef.current.currentTime = 0;
    }
  };

  // Talk Loop: Play from halfTime to end
  const handleTalkTimeUpdate = () => {
    if (talkVideoRef.current) {
      // If native looping happens, catch it and force it back to the middle
      if (talkVideoRef.current.currentTime < halfTime) {
        talkVideoRef.current.currentTime = halfTime;
      }
    }
  };

  const handleTalkEnded = () => {
    if (talkVideoRef.current) {
      talkVideoRef.current.currentTime = halfTime;
      talkVideoRef.current.play().catch(()=>{});
    }
  };

  useEffect(() => {
    if (idleVideoRef.current) idleVideoRef.current.play().catch(e => console.log(e));
    if (talkVideoRef.current) talkVideoRef.current.play().catch(e => console.log(e));
  }, [status]);

  return (
    <div className="w-full h-full relative flex flex-col bg-[#0a1122] overflow-hidden pointer-events-none">
        <div className="relative w-full h-full flex items-center justify-center bg-[#0a1122]">
            {/* IDLE LAYER (First Half) */}
            <video
                ref={idleVideoRef}
                src={AVATAR_VIDEO_URL}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleIdleTimeUpdate}
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isTalking ? 'opacity-0' : 'opacity-100'}`}
            />
            {/* TALK LAYER (Second Half) */}
            <video
                ref={talkVideoRef}
                src={AVATAR_VIDEO_URL}
                onTimeUpdate={handleTalkTimeUpdate}
                onEnded={handleTalkEnded}
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isTalking ? 'opacity-100' : 'opacity-0'}`}
            />
            <div className="absolute inset-0 shadow-[inset_0_0_80px_40px_#0a1122,inset_0_0_30px_rgba(59,130,246,0.2)] pointer-events-none"></div>
        </div>
        
        <div className="absolute top-4 left-4 text-[10px] text-blue-400 font-mono tracking-widest opacity-80 z-10 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)] border border-blue-500/30 px-2 py-1 bg-blue-950/40 rounded">
            LARA_SYNC
        </div>
    </div>
  );
};
