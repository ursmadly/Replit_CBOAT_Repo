import React, { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import Navigation from "./Navigation";
import ContentLayout from "./ContentLayout";

interface AiAgentsContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AiAgentsContainer({ children, title, subtitle }: AiAgentsContainerProps) {
  return (
    <div className="flex h-screen bg-white">
      <Navigation />
      <ContentLayout title={title} subtitle={subtitle}>
        {children}
      </ContentLayout>
    </div>
  );
}