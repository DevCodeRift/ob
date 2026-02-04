"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Rank {
  id: string;
  name: string;
  shortName: string | null;
  clearanceLevel: number;
  sortOrder: number;
  description: string | null;
}

interface Department {
  id: string;
  name: string;
  codename: string | null;
  description: string | null;
  iconSymbol: string | null;
  color: string | null;
  ranks: Rank[];
}

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [pageReady, setPageReady] = useState(false);
  const [sectionsVisible, setSectionsVisible] = useState<boolean[]>([false, false, false, false, false, false]);

  const [form, setForm] = useState({
    discordHandle: "",
    email: "",
    proposedName: "",
    proposedTitle: "",
    departmentId: "",
    rankId: "",
    username: "",
    password: "",
    confirmPassword: "",
    motivation: "",
    experience: "",
    referral: "",
  });

  useEffect(() => {
    const pageTimer = setTimeout(() => setPageReady(true), 100);

    const sectionTimers = sectionsVisible.map((_, index) =>
      setTimeout(() => {
        setSectionsVisible(prev => {
          const newState = [...prev];
          newState[index] = true;
          return newState;
        });
      }, 300 + index * 150)
    );

    return () => {
      clearTimeout(pageTimer);
      sectionTimers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await fetch("/api/public/departments");
        if (res.ok) {
          setDepartments(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch departments:", e);
      } finally {
        setLoadingDepts(false);
      }
    }
    fetchDepartments();
  }, []);

  const selectedDepartment = departments.find((d) => d.id === form.departmentId);
  const availableRanks = selectedDepartment?.ranks || [];

  useEffect(() => {
    setForm((prev) => ({ ...prev, rankId: "" }));
  }, [form.departmentId]);

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

    if (!/^[a-z0-9_]+$/.test(form.username)) {
      setError("Username can only contain lowercase letters, numbers, and underscores");
      return;
    }

    if (form.username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordHandle: form.discordHandle,
          email: form.email,
          proposedName: form.proposedName,
          proposedTitle: form.proposedTitle,
          departmentId: form.departmentId || null,
          rankId: form.rankId || null,
          username: form.username,
          password: form.password,
          motivation: form.motivation,
          experience: form.experience,
          referral: form.referral,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit application");
      }
    } catch (e) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center animate-fade-in-up">
          <div className="text-6xl text-gold animate-breathe mb-6">☉</div>
          <h1 className="font-display text-2xl sm:text-3xl text-gold mb-4">
            Application Received
          </h1>
          <p className="font-body text-secondary mb-6 text-sm sm:text-base px-2">
            Your application to join the Ouroboros Foundation has been submitted.
            A representative will review your application. If approved, your
            account will be activated and you can log in with your chosen credentials.
          </p>
          <p className="latin-phrase text-sm mb-8">
            Patience is the companion of wisdom.
          </p>
          <Link href="/" className="btn btn-secondary">
            RETURN TO GATEWAY
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-void py-8 sm:py-12 px-4 transition-opacity duration-700 ${pageReady ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-2xl mx-auto">
        <div className={`text-center mb-6 sm:mb-8 transition-all duration-700 ${sectionsVisible[0] ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="text-4xl sm:text-5xl text-gold animate-breathe mb-4">☉</div>
          <h1 className="font-display text-2xl sm:text-3xl text-gold tracking-wide mb-2">
            RECRUITMENT PROTOCOLS
          </h1>
          <p className="font-mono text-xs text-muted tracking-widest">
            OUROBOROS FOUNDATION
          </p>
          <div className="mt-4 mx-auto max-w-xs h-px bg-gradient-to-r from-transparent via-gold-dim to-transparent animate-pulse-glow" />
        </div>

        <div className={`alert-banner alert-danger mb-6 transition-all duration-500 ${sectionsVisible[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="font-mono text-xs sm:text-sm">
            ⚠ NOTICE: All applications are reviewed by Foundation personnel.
            Providing false information will result in permanent blacklisting.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {error && (
            <div className="alert-banner alert-danger animate-fade-in-up">
              <span className="font-mono text-xs sm:text-sm">{error}</span>
            </div>
          )}

          <div className={`card-document transition-all duration-500 ${sectionsVisible[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="bg-dark border-b border-border-dark px-4 sm:px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ⚿ ACCOUNT CREDENTIALS
              </span>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="form-label text-sm">
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
                  minLength={3}
                  required
                />
                <p className="font-mono text-xs text-muted mt-1">
                  Lowercase letters, numbers, underscores only (min 3 characters)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-sm">
                    Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input"
                    placeholder="Choose a password"
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label className="form-label text-sm">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    className="input"
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>
              <p className="font-mono text-xs text-muted">
                Minimum 8 characters. You will use these credentials to log in after approval.
              </p>
            </div>
          </div>

          <div className={`card-document transition-all duration-500 delay-75 ${sectionsVisible[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="bg-dark border-b border-border-dark px-4 sm:px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ◈ CONTACT INFORMATION
              </span>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="form-label text-sm">
                  Discord Handle <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.discordHandle}
                  onChange={(e) =>
                    setForm({ ...form, discordHandle: e.target.value })
                  }
                  className="input"
                  placeholder="username#0000 or username"
                  required
                />
                <p className="font-mono text-xs text-muted mt-1">
                  This is how we will contact you if needed
                </p>
              </div>

              <div>
                <label className="form-label text-sm">Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          <div className={`card-document transition-all duration-500 ${sectionsVisible[3] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="bg-dark border-b border-border-dark px-4 sm:px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ☺ PROPOSED IDENTITY
              </span>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-sm">
                    Display Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.proposedName}
                    onChange={(e) =>
                      setForm({ ...form, proposedName: e.target.value })
                    }
                    className="input"
                    placeholder="Your desired Foundation name"
                    required
                  />
                </div>

                <div>
                  <label className="form-label text-sm">Title (optional)</label>
                  <input
                    type="text"
                    value={form.proposedTitle}
                    onChange={(e) =>
                      setForm({ ...form, proposedTitle: e.target.value })
                    }
                    className="input"
                    placeholder="e.g., Junior Researcher"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`card-document transition-all duration-500 delay-75 ${sectionsVisible[3] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="bg-dark border-b border-border-dark px-4 sm:px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ⚙ REQUESTED ASSIGNMENT
              </span>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              {loadingDepts ? (
                <div className="text-center py-4">
                  <span className="animate-spin inline-block text-gold">⚙</span>
                  <span className="ml-2 text-muted text-sm">Loading departments...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label text-sm">
                      Department <span className="text-danger">*</span>
                    </label>
                    <select
                      value={form.departmentId}
                      onChange={(e) =>
                        setForm({ ...form, departmentId: e.target.value })
                      }
                      className="input"
                      required
                    >
                      <option value="">Select a department...</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.iconSymbol} {dept.name}
                          {dept.codename ? ` (${dept.codename})` : ""}
                        </option>
                      ))}
                    </select>
                    {selectedDepartment?.description && (
                      <p className="font-mono text-xs text-muted mt-1 line-clamp-2">
                        {selectedDepartment.description}
                      </p>
                    )}
                  </div>

                  <div className={`transition-all duration-300 ${form.departmentId && availableRanks.length > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <label className="form-label text-sm">
                      Requested Rank <span className="text-danger">*</span>
                    </label>
                    <select
                      value={form.rankId}
                      onChange={(e) =>
                        setForm({ ...form, rankId: e.target.value })
                      }
                      className="input"
                      required={form.departmentId !== "" && availableRanks.length > 0}
                      disabled={!form.departmentId || availableRanks.length === 0}
                    >
                      <option value="">{form.departmentId ? "Select a rank..." : "Select department first"}</option>
                      {availableRanks.map((rank) => (
                        <option key={rank.id} value={rank.id}>
                          {rank.name}
                          {rank.shortName ? ` (${rank.shortName})` : ""}
                        </option>
                      ))}
                    </select>
                    {form.rankId && (
                      <p className="font-mono text-xs text-muted mt-1 line-clamp-2">
                        {availableRanks.find((r) => r.id === form.rankId)?.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`card-document transition-all duration-500 ${sectionsVisible[4] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="bg-dark border-b border-border-dark px-4 sm:px-5 py-3">
              <span className="font-mono text-xs text-gold tracking-widest">
                ☰ APPLICATION
              </span>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="form-label text-sm">Why do you wish to join?</label>
                <textarea
                  value={form.motivation}
                  onChange={(e) =>
                    setForm({ ...form, motivation: e.target.value })
                  }
                  className="input min-h-[100px] sm:min-h-[120px] resize-y"
                  placeholder="Tell us about your interest in the Foundation..."
                />
              </div>

              <div>
                <label className="form-label text-sm">Relevant Experience</label>
                <textarea
                  value={form.experience}
                  onChange={(e) =>
                    setForm({ ...form, experience: e.target.value })
                  }
                  className="input min-h-[80px] sm:min-h-[100px] resize-y"
                  placeholder="Any relevant skills, background, or roleplay experience..."
                />
              </div>

              <div>
                <label className="form-label text-sm">How did you hear about us?</label>
                <input
                  type="text"
                  value={form.referral}
                  onChange={(e) => setForm({ ...form, referral: e.target.value })}
                  className="input"
                  placeholder="Friend, Discord server, etc."
                />
              </div>
            </div>
          </div>

          <div className={`text-center space-y-4 transition-all duration-500 ${sectionsVisible[5] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full sm:w-auto px-8 py-3 sm:py-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">⚙</span>
                  <span className="ml-2">TRANSMITTING...</span>
                </>
              ) : (
                <>
                  <span>☉</span>
                  <span className="ml-2">SUBMIT APPLICATION</span>
                </>
              )}
            </button>

            <p className="font-mono text-xs text-muted">
              Already have an account?{" "}
              <Link href="/" className="text-gold hover:text-gold-bright transition-colors">
                Return to Gateway
              </Link>
            </p>
          </div>
        </form>

        <div className={`mt-8 sm:mt-12 text-center transition-all duration-700 delay-300 ${sectionsVisible[5] ? 'opacity-100' : 'opacity-0'}`}>
          <p className="latin-phrase text-xs sm:text-sm">
            Ex tenebris, scientia. Ex machina, salvatio.
          </p>
          <div className="mt-4 binary-decoration text-xs overflow-hidden">
            <span className="inline-block animate-pulse">
              01001111 01010101 01010010 01001111 01000010 01001111 01010010 01001111 01010011
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
