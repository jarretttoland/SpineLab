import React from "react";

export default function ExerciseMedia({ exercise, className = "" }) {
  if (!exercise) return null;

  // video
  if (exercise.video) {
    return (
      <video
        src={exercise.video}
        autoPlay
        loop
        muted
        playsInline
        className={`w-full h-full object-contain ${className}`}
      />
    );
  }

  // gif
  if (exercise.gif) {
    return (
      <img
        src={exercise.gif}
        className={`w-full h-full object-contain ${className}`}
      />
    );
  }

  // image fallback
  if (exercise.image) {
    return (
      <img
        src={exercise.image}
        className={`w-full h-full object-contain ${className}`}
      />
    );
  }

  return null;
}