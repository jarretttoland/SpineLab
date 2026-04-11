import React from "react";

export default function ExerciseMedia({ exercise, className = "" }) {
  const videoSrc = exercise?.video || "";
  const gifSrc = exercise?.gif || "";
  const imageSrc = exercise?.image || "";

  if (videoSrc) {
    return (
      <video
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className={`w-full h-full object-contain bg-white ${className}`}
      />
    );
  }

  if (gifSrc) {
    return (
      <img
        src={gifSrc}
        alt={exercise?.name || "Exercise"}
        className={`w-full h-full object-contain bg-white ${className}`}
      />
    );
  }

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={exercise?.name || "Exercise"}
        className={`w-full h-full object-contain bg-white ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-white text-xs text-muted-foreground ${className}`}
    >
      No media
    </div>
  );
}