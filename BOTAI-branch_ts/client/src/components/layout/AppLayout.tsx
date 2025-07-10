import { ReactNode } from "react";
import Navigation from "./Navigation";
import UserProfileMenu from "./UserProfileMenu";
import PlatformBanner from "./PlatformBanner";

export interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-white">
      <PlatformBanner />
      <div className="flex flex-1 min-h-0">
        <Navigation />
        <main className="flex-1 overflow-auto relative">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-3">
              <div>
                {title && <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>}
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
              </div>
              <UserProfileMenu />
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}