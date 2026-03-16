"use client";

import Link from "next/link";
import {
  MessageSquare,
  Users,
  CircleDot,
  UserPlus,
  Heart,
  Trophy,
  Star,
  Compass,
  type LucideIcon,
} from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: { label: string; href: string; primary?: boolean }[];
}

function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps) {
  return (
    <div
      className="rounded-xl p-8 text-center"
      style={{
        backgroundColor: "var(--cg-bg-card)",
        border: "1px solid var(--cg-border)",
      }}
    >
      <div
        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
        style={{ backgroundColor: "var(--cg-bg)" }}
      >
        <Icon className="h-8 w-8" style={{ color: "var(--cg-text-muted)", opacity: 0.6 }} />
      </div>
      <h3 className="text-lg font-display font-semibold mb-2" style={{ color: "var(--cg-text-primary)" }}>
        {title}
      </h3>
      <p className="text-sm max-w-sm mx-auto mb-5" style={{ color: "var(--cg-text-muted)" }}>
        {description}
      </p>
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: action.primary ? "var(--cg-accent)" : "var(--cg-bg)",
                color: action.primary ? "white" : "var(--cg-text-secondary)",
                border: action.primary ? "none" : "1px solid var(--cg-border)",
              }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmptyFeed() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Your Feed is Quiet"
      description="Join a circle or connect with friends to see what they're up to. Your feed fills up as your network grows."
      actions={[
        { label: "Explore Circles", href: "/circles", primary: true },
        { label: "Find Friends", href: "/discover" },
      ]}
    />
  );
}

export function EmptyCircleFeed({ circleName }: { circleName?: string }) {
  return (
    <EmptyState
      icon={MessageSquare}
      title={`Be the First to Post${circleName ? ` in ${circleName}` : ""}`}
      description="Start a conversation, share a round recap, or post a course photo. Your circle is waiting to hear from you."
      actions={[]}
    />
  );
}

export function EmptyCircles() {
  return (
    <EmptyState
      icon={CircleDot}
      title="Find Your Crew"
      description="Circles are communities of golfers who share courses, compete, and connect. Find one that fits your vibe."
      actions={[
        { label: "Discover Circles", href: "/circles?tab=discover", primary: true },
        { label: "Create a Circle", href: "/circles/create" },
      ]}
    />
  );
}

export function EmptyConnections() {
  return (
    <EmptyState
      icon={UserPlus}
      title="Golf is Better with Friends"
      description="Connect with golfers you know, or discover new ones through shared circles and courses."
      actions={[
        { label: "Find People", href: "/discover", primary: true },
        { label: "Invite Friends", href: "/settings/profile" },
      ]}
    />
  );
}

export function EmptyWishlist() {
  return (
    <EmptyState
      icon={Heart}
      title="Start Building Your Bucket List"
      description="Add courses you dream of playing. Browse top-rated courses from around the world and save your favorites."
      actions={[
        { label: "Browse Courses", href: "/courses", primary: true },
        { label: "Discover Recommendations", href: "/discover" },
      ]}
    />
  );
}

export function EmptyGames() {
  return (
    <EmptyState
      icon={Trophy}
      title="Ready to Compete?"
      description="Create a game or competition within your circle. Track scores, set stakes, and crown a champion."
      actions={[
        { label: "Create a Game", href: "/circles", primary: true },
      ]}
    />
  );
}

export function EmptyRatings() {
  return (
    <EmptyState
      icon={Star}
      title="Rate Your First Course"
      description="Course ratings power your Chameleon Score and help us recommend courses you'll love. Start with courses you know."
      actions={[
        { label: "Rate a Course", href: "/courses", primary: true },
        { label: "Complete Onboarding", href: "/onboarding" },
      ]}
    />
  );
}

export default EmptyState;
