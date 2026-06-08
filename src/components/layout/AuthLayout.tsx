import { ReactNode } from "react";
import LearningIllustration from "@/assets/LearningIllustration";

interface AuthLayoutProps {
  jpDisplay: string;
  headline: string;
  highlight?: string;
  description: string;
  children: ReactNode;
}

const AuthLayout = ({ jpDisplay, headline, highlight, description, children }: AuthLayoutProps) => (
  <div className="min-h-screen bg-canvas p-3 md:p-4 flex items-center justify-center">
    <div className="w-full max-w-5xl nori-frame min-h-0">
      <div className="flex flex-col lg:flex-row flex-1 w-full">
        {/* Hero column */}
        <div className="hidden lg:flex flex-col justify-center p-10 lg:w-1/2 border-r border-border">
          <p className="nori-jp-display text-6xl mb-4">{jpDisplay}</p>
          <div className="nori-wavy-line mb-6" />
          <h1 className="text-3xl xl:text-4xl font-bold uppercase tracking-wide text-foreground leading-tight mb-4">
            {headline}{" "}
            {highlight && <span className="text-primary">{highlight}</span>}
          </h1>
          <p className="text-muted-foreground normal-case tracking-normal font-normal text-base max-w-sm">
            {description}
          </p>
          <div className="mt-10">
            <LearningIllustration className="w-full max-w-sm" />
          </div>
        </div>

        {/* Form column */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:w-1/2">
          <div className="lg:hidden mb-6 text-center">
            <p className="nori-jp-display text-4xl mb-2">{jpDisplay}</p>
            <div className="nori-wavy-line mx-auto mb-4" />
          </div>
          {children}
        </div>
      </div>
    </div>
  </div>
);

export default AuthLayout;
