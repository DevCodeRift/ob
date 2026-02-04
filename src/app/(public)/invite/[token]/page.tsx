"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface InvitationInfo {
  valid: boolean;
  displayName: string;
  title: string | null;
  clearanceLevel: number;
  departmentName: string | null;
}

export default function InviteRedeemPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
  });

  useEffect(() => {
    validateInvitation();
  }, [token]);

  async function validateInvitation() {
    try {
      const res = await fetch(`/api/invitations/${token}`);
      if (res.ok) {
        const data = await res.json();
        setInvitation(data);
      } else {
        const data = await res.json();
        setError(data.error || "Invalid invitation");
      }
    } catch (e) {
      setError("Failed to validate invitation");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          email: form.email,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create account");
      }
    } catch (e) {
      setError("Connection error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl text-gold animate-spin-slow mb-4">⚙</div>
          <p className="font-mono text-muted animate-pulse">
            VALIDATING INVITATION...
          </p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="text-6xl text-danger mb-6">⚠</div>
          <h1 className="font-display text-2xl text-danger mb-4">
            Invalid Invitation
          </h1>
          <p className="font-body text-secondary mb-6">{error}</p>
          <Link href="/" className="btn btn-secondary">
            RETURN TO GATEWAY
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="text-6xl text-class-green mb-6">✓</div>
          <h1 className="font-display text-3xl text-gold mb-4">
            Welcome to the Foundation
          </h1>
          <p className="font-body text-secondary mb-2">
            Your account has been created successfully.
          </p>
          <p className="font-mono text-gold mb-6">
            {invitation?.displayName}
          </p>
          <p className="latin-phrase text-sm mb-8">
            The serpent devours itself, and from its death, is reborn eternal.
          </p>
          <Link href="/" className="btn btn-primary">
            PROCEED TO GATEWAY
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl text-gold animate-breathe mb-4">◇</div>
          <h1 className="font-display text-3xl text-gold tracking-wide mb-2">
            INVITATION ACCEPTED
          </h1>
          <p className="font-mono text-xs text-muted tracking-widest">
            CREATE YOUR FOUNDATION IDENTITY
          </p>
        </div>

        <div className="card-document mb-6">
          <div className="bg-dark border-b border-border-dark px-5 py-3">
            <span className="font-mono text-xs text-gold tracking-widest">
              ◈ YOUR ASSIGNMENT
            </span>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-muted">DESIGNATION</span>
              <span className="font-mono text-lg text-gold">
                {invitation?.displayName}
              </span>
            </div>
            {invitation?.title && (
              <div className="flex items-center justify-between">
                <span className="font-mono text-muted">TITLE</span>
                <span className="font-mono text-secondary">{invitation.title}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-mono text-muted">CLEARANCE</span>
              <span className="font-mono text-gold">
                Level {invitation?.clearanceLevel}
              </span>
            </div>
            {invitation?.departmentName && (
              <div className="flex items-center justify-between">
                <span className="font-mono text-muted">DEPARTMENT</span>
                <span className="font-mono text-secondary">
                  {invitation.departmentName}
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="alert-banner alert-danger">
              <span className="font-mono">{error}</span>
            </div>
          )}

          <div className="card-document">
            <div className="bg-dark border-b border-border-dark px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ⚿ CREDENTIALS
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">
                  Username <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value.toLowerCase() })
                  }
                  className="input"
                  placeholder="Choose a username"
                  pattern="[a-z0-9_]+"
                  title="Lowercase letters, numbers, and underscores only"
                  required
                />
                <p className="font-mono text-xs text-muted mt-1">
                  Lowercase letters, numbers, underscores only
                </p>
              </div>

              <div>
                <label className="form-label">Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="form-label">
                  Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input"
                  placeholder="Choose a secure password"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  Confirm Password <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  className="input"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary py-4"
          >
            {submitting ? (
              <>
                <span className="animate-spin">⚙</span>
                <span className="ml-2">INITIALIZING...</span>
              </>
            ) : (
              <>
                <span>⛧</span>
                <span className="ml-2">CREATE ACCOUNT</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="latin-phrase text-sm">
            Through knowledge and vigilance, we secure the future.
          </p>
        </div>
      </div>
    </div>
  );
}
