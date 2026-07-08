/* Kalam authentication + data layer, backed by Supabase.
 * Degrades gracefully to demo mode when supabase-config.js is not filled in. */
(function () {
  const cfg = window.KALAM_SUPABASE || {};
  const configured = !!(cfg.url && cfg.anonKey && window.supabase);

  let sb = null;
  let currentUser = null;
  let currentProfile = null;
  const listeners = [];
  let resolveReady;
  const ready = new Promise((r) => (resolveReady = r));

  const AUTH = {
    enabled: configured,
    ready,
    user: () => currentUser,
    profile: () => currentProfile,
    onChange(cb) { listeners.push(cb); if (currentUser !== undefined) cb(currentUser, currentProfile); },
  };

  function emit() { listeners.forEach((cb) => cb(currentUser, currentProfile)); updateHeader(); }

  // ---- Header reflects auth state (runs after components.js injects it) ----
  function updateHeader() {
    const area = document.getElementById("authArea");
    if (!area) return;
    if (currentUser) {
      const name = (currentProfile && currentProfile.full_name) || currentUser.email;
      const first = String(name).split(" ")[0];
      area.innerHTML =
        `<a class="btn btn--ghost btn--sm" href="dashboard.html">${first}'s dashboard</a>` +
        `<button class="btn btn--primary btn--sm" onclick="AUTH.signOut()">Sign out</button>`;
    } else {
      area.innerHTML =
        `<a class="btn btn--ghost btn--sm" href="signin.html">Sign in</a>` +
        `<a class="btn btn--primary btn--sm" href="join.html">Join free</a>`;
    }
  }

  if (!configured) {
    // Demo mode: no backend. Resolve ready, keep header as default links.
    currentUser = null;
    document.addEventListener("DOMContentLoaded", updateHeader);
    Object.assign(AUTH, {
      async signUp() { return { error: { message: "backend-not-configured" } }; },
      async signIn() { return { error: { message: "backend-not-configured" } }; },
      async signOut() {},
      async addBook() { return { error: { message: "backend-not-configured" } }; },
      async addEvent() { return { error: { message: "backend-not-configured" } }; },
      async myBooks() { return []; },
      async myEvents() { return []; },
      async listBooks() { return []; },
      async listEvents() { return []; },
      async listProfiles() { return []; },
    });
    resolveReady(false);
    window.AUTH = AUTH;
    return;
  }

  sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  AUTH.client = sb;

  async function loadProfile(user) {
    if (!user) return null;
    const { data } = await sb.from("profiles").select("*").eq("id", user.id).single();
    return data || null;
  }

  Object.assign(AUTH, {
    async signUp({ email, password, full_name, role, city, language, org, bio }) {
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: {
          data: { full_name, role, city, language, org, bio },
          // Send the email-confirmation link back to the live sign-in page,
          // not Supabase's default localhost Site URL. (This URL must also be
          // added to Supabase → Authentication → URL Configuration → Redirect URLs.)
          emailRedirectTo: new URL("signin.html", window.location.href).href,
        },
      });
      if (error) return { error };
      // If email confirmation is off, a session exists immediately.
      const session = data.session;
      return { needsConfirmation: !session, user: data.user };
    },
    async signIn({ email, password }) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return { error };
      return { user: data.user };
    },
    async signOut() {
      await sb.auth.signOut();
      window.location.href = "index.html";
    },
    async addBook(b) {
      if (!currentUser) return { error: { message: "Not signed in" } };
      const row = {
        author_id: currentUser.id,
        author_name: (currentProfile && currentProfile.full_name) || "Author",
        title: b.title, genre: b.genre, language: b.language,
        price: parseInt(b.price || 0, 10), cover_idx: parseInt(b.cover_idx || 0, 10),
        description: b.description || null,
      };
      const { data, error } = await sb.from("books").insert(row).select().single();
      return { data, error };
    },
    async addEvent(e) {
      if (!currentUser) return { error: { message: "Not signed in" } };
      const row = {
        host_id: currentUser.id,
        host_name: (currentProfile && currentProfile.full_name) || "Host",
        type: e.type, title: e.title, event_date: e.event_date,
        event_time: e.event_time || null, mode: e.mode || null, description: e.description || null,
      };
      const { data, error } = await sb.from("events").insert(row).select().single();
      return { data, error };
    },
    async myBooks() {
      if (!currentUser) return [];
      const { data } = await sb.from("books").select("*").eq("author_id", currentUser.id).order("created_at", { ascending: false });
      return data || [];
    },
    async myEvents() {
      if (!currentUser) return [];
      const { data } = await sb.from("events").select("*").eq("host_id", currentUser.id).order("event_date", { ascending: true });
      return data || [];
    },
    async listBooks() {
      const { data } = await sb.from("books").select("*").order("created_at", { ascending: false }).limit(60);
      return data || [];
    },
    async listEvents() {
      const { data } = await sb.from("events").select("*").order("event_date", { ascending: true }).limit(60);
      return data || [];
    },
    async listProfiles() {
      const { data } = await sb.from("profiles").select("*").order("created_at", { ascending: false }).limit(60);
      return data || [];
    },
  });

  // ---- Initial session + change subscription ----
  (async () => {
    const { data: { session } } = await sb.auth.getSession();
    currentUser = session ? session.user : null;
    currentProfile = await loadProfile(currentUser);
    resolveReady(true);
    emit();
  })();

  sb.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session ? session.user : null;
    currentProfile = await loadProfile(currentUser);
    emit();
  });

  document.addEventListener("DOMContentLoaded", updateHeader);
  window.AUTH = AUTH;
})();
