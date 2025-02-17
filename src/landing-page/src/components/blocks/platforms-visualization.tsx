"use client";

import React, { forwardRef, useRef } from "react";

import { AnimatedBeam } from "@/src/components/ui/animated-beam";
import { cn } from "@/src/lib/utils";
import Image from "next/image";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function PlatformsVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex w-full items-center justify-center"
      ref={containerRef}
    >
      <div className="flex size-full flex-col items-stretch justify-between gap-1 md:gap-10">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref} className="size-14">
            <Icons.zoom />
          </Circle>
          <Circle ref={div5Ref} className="size-14">
            <Icons.video />
            <p className="absolute hidden w-10 translate-x-14 text-left text-xs md:block">
              recording
            </p>
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref} className="size-14">
            <Icons.teams />
          </Circle>
          <Circle ref={div4Ref} className="size-20">
            <Icons.meetingbot />
          </Circle>
          <Circle ref={div6Ref} className="size-14">
            <Icons.transcript />
            <p className="absolute hidden w-10 translate-x-14 text-left text-xs md:block">
              transcript
            </p>
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div3Ref} className="size-14">
            <Icons.meets />
          </Circle>
          <Circle ref={div7Ref} className="size-14">
            <Icons.events />
            <p className="absolute hidden w-10 translate-x-14 text-left text-xs md:block">
              events
            </p>
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
      />
    </div>
  );
}

const Icons = {
  zoom: () => (
    <Image
      src="/zoom.svg"
      alt="zoom icon"
      className="size-full"
      width={100}
      height={100}
    />
  ),
  meet: () => (
    <Image
      src="/meet.svg"
      alt="meet icon"
      className="size-full"
      width={100}
      height={100}
    />
  ),
  teams: () => (
    <Image
      src="/teams.svg"
      alt="teams icon"
      className="size-full"
      width={100}
      height={100}
    />
  ),
  meetingbot: () => (
    <Image
      src="/logo.svg"
      alt="meetingbot icon"
      className="size-full"
      width={100}
      height={100}
    />
  ),
  video: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m10 11 5 3-5 3v-6Z" />
    </svg>
  ),
  transcript: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.5 22h.5a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M2 19a2 2 0 1 1 4 0v1a2 2 0 1 1-4 0v-4a6 6 0 0 1 12 0v4a2 2 0 1 1-4 0v-1a2 2 0 1 1 4 0" />
    </svg>
  ),
  events: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="black"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
      <path d="M3 6h.01" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M8 6h13" />
    </svg>
  ),
};
