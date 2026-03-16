import { CircleType, CirclePrivacy } from "@prisma/client";

export const CIRCLE_DEFAULTS: Record<
  CircleType,
  {
    maxMembers: number | null;
    privacy: CirclePrivacy;
    allowMemberInvites: boolean;
    verificationMethod?: string;
  }
> = {
  CREW: { maxMembers: 12, privacy: "PRIVATE", allowMemberInvites: true },
  GAME: { maxMembers: null, privacy: "PRIVATE", allowMemberInvites: true },
  NETWORK: { maxMembers: null, privacy: "PUBLIC", allowMemberInvites: true },
  CLUB: { maxMembers: null, privacy: "SECRET", allowMemberInvites: false, verificationMethod: "admin_approval" },
  LEAGUE: { maxMembers: null, privacy: "PRIVATE", allowMemberInvites: false },
};
