import { FeaturesSection } from "@/src/components/blocks/features-section";
// import { NewsletterForm } from "@/src/components/blocks/newsletter-form";
import { PlatformsVisualization } from "@/src/components/blocks/platforms-visualization";
import { ModeToggle } from "@/src/components/theme-toggle";
import { AnimatedBackground } from "@/src/components/ui/animated-background";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "../components/ui/button";
import { cn } from "../lib/utils";

export default function Component() {
  return (
    <AnimatedBackground className="relative flex w-full flex-col">
      <header className="fixed z-50 flex h-14 w-full items-center border-b bg-background/80 px-4 backdrop-blur-sm lg:px-6">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 font-semibold"
          prefetch={false}
        >
          <Image src="/logo.svg" alt="MeetingBot" width={28} height={28} />
          MeetingBot
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Link
            href="https://github.com/meetingbot/meetingbot"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            GitHub
          </Link>
          <ModeToggle />
        </nav>
      </header>
      <main className="flex-1">
        <section className="mt-[100px] flex w-full justify-center md:mt-0 md:h-[100dvh]">
          <div className="container flex flex-col items-center justify-center space-y-4 px-4 text-center md:px-6">
            <div className="space-y-4">
              <h1 className="whitespace-nowrap text-4xl font-bold sm:text-5xl md:text-6xl">
                Open Source
                <br />
                Meeting Bot API
              </h1>
              <p className="mx-auto max-w-[500px] text-lg text-muted-foreground md:text-xl">
                Easily create automated applications that leverage recordings
                across popular video meeting platforms
              </p>
            </div>
            <div className="flex w-full items-center md:h-[200px] md:w-[700px]">
              <PlatformsVisualization />
            </div>
            <div className="z-10 w-full max-w-sm space-y-2">
              <Link
                className={cn(buttonVariants({ size: "lg" }), "px-20")}
                href="https://discord.gg/md6HV2beJh"
              >
                Join Discord Server
              </Link>
              <p className="text-sm text-muted-foreground">
                Stay up to date with the latest features and updates
              </p>
              {/* <NewsletterForm /> */}
            </div>
          </div>
        </section>
        <section id="features" className="flex w-full justify-center pb-20">
          <FeaturesSection />
        </section>
      </main>
      <footer className="border-t bg-background py-6 md:py-8">
        <div className="container flex flex-col items-center gap-4 px-4 sm:flex-row md:px-6">
          <p className="text-sm text-muted-foreground">
            © 2025 MeetingBot. All rights reserved.
          </p>
          <nav className="flex gap-4 sm:ml-auto sm:gap-6">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </AnimatedBackground>
  );
}
