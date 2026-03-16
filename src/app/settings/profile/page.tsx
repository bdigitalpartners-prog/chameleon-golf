"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Camera, X, Check } from "lucide-react";

interface TagData {
  id: string;
  name: string;
  slug: string;
  category: string | null;
}

interface ProfileForm {
  bio: string;
  handicap: string;
  homeClub: string;
  location: string;
  isAvailableToPlay: boolean;
  avatarUrl: string;
  coverUrl: string;
}

export default function EditProfilePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const userId = (session?.user as any)?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [form, setForm] = useState<ProfileForm>({
    bio: "",
    handicap: "",
    homeClub: "",
    location: "",
    isAvailableToPlay: false,
    avatarUrl: "",
    coverUrl: "",
  });

  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // Load profile and tags
  useEffect(() => {
    if (!userId) return;

    Promise.all([
      fetch(`/api/profile/${userId}`).then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
    ])
      .then(([profileData, tagsData]) => {
        const p = profileData.profile;
        if (p) {
          setForm({
            bio: p.bio ?? "",
            handicap: p.handicap?.toString() ?? "",
            homeClub: p.homeClub ?? "",
            location: p.location ?? "",
            isAvailableToPlay: p.isAvailableToPlay ?? false,
            avatarUrl: p.avatarUrl ?? "",
            coverUrl: p.coverUrl ?? "",
          });
          setSelectedTagIds(p.tags?.map((t: any) => t.tag.id) ?? []);
        }
        setAllTags(tagsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleImageUpload = async (
    file: File,
    type: "avatars" | "covers"
  ) => {
    const isAvatar = type === "avatars";
    if (isAvatar) setUploadingAvatar(true);
    else setUploadingCover(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (res.ok && data.url) {
        setForm((prev) => ({
          ...prev,
          [isAvatar ? "avatarUrl" : "coverUrl"]: data.url,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isAvatar) setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) return prev.filter((id) => id !== tagId);
      if (prev.length >= 5) return prev;
      return [...prev, tagId];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save profile
      await fetch(`/api/profile/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: form.bio || null,
          handicap: form.handicap || null,
          homeClub: form.homeClub || null,
          location: form.location || null,
          isAvailableToPlay: form.isAvailableToPlay,
          avatarUrl: form.avatarUrl || null,
          coverUrl: form.coverUrl || null,
        }),
      });

      // Save tags
      await fetch("/api/tags/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: selectedTagIds }),
      });

      router.push(`/profile/${userId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: "var(--cg-accent)" }}
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className="mx-auto max-w-2xl px-4 py-20 text-center"
        style={{ color: "var(--cg-text-primary)" }}
      >
        <p>Please sign in to edit your profile.</p>
      </div>
    );
  }

  const categories = [...new Set(allTags.map((t) => t.category).filter(Boolean))] as string[];
  const filteredTags = allTags.filter((t) => {
    if (activeCategory && t.category !== activeCategory) return false;
    if (tagSearch && !t.name.toLowerCase().includes(tagSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1
        className="font-display text-2xl font-bold mb-8"
        style={{ color: "var(--cg-text-primary)" }}
      >
        Edit Profile
      </h1>

      {/* Cover photo */}
      <div className="mb-6">
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--cg-text-secondary)" }}
        >
          Cover Photo
        </label>
        <div
          className="relative h-40 rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => coverRef.current?.click()}
          style={{
            background: form.coverUrl
              ? `url(${form.coverUrl}) center / cover`
              : "linear-gradient(135deg, var(--cg-accent), var(--cg-accent-muted))",
          }}
        >
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploadingCover ? (
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            ) : (
              <Camera className="h-8 w-8 text-white" />
            )}
          </div>
          {form.coverUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setForm((prev) => ({ ...prev, coverUrl: "" }));
              }}
              className="absolute top-2 right-2 rounded-full p-1 bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <input
          ref={coverRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file, "covers");
          }}
        />
      </div>

      {/* Avatar */}
      <div className="mb-6">
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--cg-text-secondary)" }}
        >
          Avatar
        </label>
        <div className="flex items-center gap-4">
          <div
            className="relative h-20 w-20 rounded-full overflow-hidden cursor-pointer group flex-shrink-0"
            onClick={() => avatarRef.current?.click()}
            style={{ backgroundColor: "var(--cg-bg-tertiary)" }}
          >
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Camera className="h-6 w-6" style={{ color: "var(--cg-text-muted)" }} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
          </div>
          <span className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
            Click to upload. JPG, PNG, or WebP, max 5MB.
          </span>
        </div>
        <input
          ref={avatarRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file, "avatars");
          }}
        />
      </div>

      {/* Form fields */}
      <div
        className="space-y-5 rounded-xl p-6"
        style={{
          backgroundColor: "var(--cg-bg-card)",
          border: "1px solid var(--cg-border)",
        }}
      >
        <Field label="Bio" multiline>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell the golf world about yourself..."
            className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              color: "var(--cg-text-primary)",
              border: "1px solid var(--cg-border)",
            }}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Handicap Index">
            <input
              type="number"
              step="0.1"
              value={form.handicap}
              onChange={(e) => setForm({ ...form, handicap: e.target.value })}
              placeholder="e.g. 12.4"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--cg-bg-secondary)",
                color: "var(--cg-text-primary)",
                border: "1px solid var(--cg-border)",
              }}
            />
          </Field>

          <Field label="Home Club">
            <input
              type="text"
              value={form.homeClub}
              onChange={(e) => setForm({ ...form, homeClub: e.target.value })}
              placeholder="e.g. Pebble Beach Golf Links"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--cg-bg-secondary)",
                color: "var(--cg-text-primary)",
                border: "1px solid var(--cg-border)",
              }}
            />
          </Field>
        </div>

        <Field label="Location">
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Austin, TX"
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--cg-bg-secondary)",
              color: "var(--cg-text-primary)",
              border: "1px solid var(--cg-border)",
            }}
          />
        </Field>

        {/* Available to play toggle */}
        <div className="flex items-center justify-between">
          <div>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--cg-text-primary)" }}
            >
              Available to Play
            </span>
            <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
              Show others you&apos;re looking for a round
            </p>
          </div>
          <button
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                isAvailableToPlay: !prev.isAvailableToPlay,
              }))
            }
            className="relative h-6 w-11 rounded-full transition-colors"
            style={{
              backgroundColor: form.isAvailableToPlay
                ? "var(--cg-accent)"
                : "var(--cg-bg-tertiary)",
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform"
              style={{
                transform: form.isAvailableToPlay
                  ? "translateX(1.25rem)"
                  : "translateX(0)",
              }}
            />
          </button>
        </div>
      </div>

      {/* Tags section */}
      <div
        className="mt-6 rounded-xl p-6"
        style={{
          backgroundColor: "var(--cg-bg-card)",
          border: "1px solid var(--cg-border)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-display text-lg font-semibold"
            style={{ color: "var(--cg-text-primary)" }}
          >
            Golf Identity Tags
          </h2>
          <span className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
            {selectedTagIds.length}/5 selected
          </span>
        </div>

        {/* Search */}
        <input
          type="text"
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value)}
          placeholder="Search tags..."
          className="w-full rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2"
          style={{
            backgroundColor: "var(--cg-bg-secondary)",
            color: "var(--cg-text-primary)",
            border: "1px solid var(--cg-border)",
          }}
        />

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveCategory(null)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: !activeCategory
                ? "var(--cg-accent)"
                : "var(--cg-bg-tertiary)",
              color: !activeCategory
                ? "var(--cg-text-inverse)"
                : "var(--cg-text-secondary)",
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors"
              style={{
                backgroundColor:
                  activeCategory === cat
                    ? "var(--cg-accent)"
                    : "var(--cg-bg-tertiary)",
                color:
                  activeCategory === cat
                    ? "var(--cg-text-inverse)"
                    : "var(--cg-text-secondary)",
              }}
            >
              {cat.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-2">
          {filteredTags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                disabled={!isSelected && selectedTagIds.length >= 5}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1"
                style={{
                  backgroundColor: isSelected
                    ? "var(--cg-accent)"
                    : "var(--cg-bg-secondary)",
                  color: isSelected
                    ? "var(--cg-text-inverse)"
                    : "var(--cg-text-secondary)",
                  opacity:
                    !isSelected && selectedTagIds.length >= 5 ? 0.4 : 1,
                  border: `1px solid ${isSelected ? "var(--cg-accent)" : "var(--cg-border)"}`,
                }}
              >
                {isSelected && <Check className="h-3 w-3" />}
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all"
          style={{
            backgroundColor: "var(--cg-accent)",
            color: "var(--cg-text-inverse)",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  multiline,
}: {
  label: string;
  children: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: "var(--cg-text-secondary)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
