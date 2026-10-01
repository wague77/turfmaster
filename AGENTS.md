<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Access gate: all app pages live under `src/routes/_protege/` (beforeLoad calls `checkAccess`); PMU server fns call `requireAccess()`. Why: data and UI must both be locked behind an access code.
- Access codes live in `public.access_codes`, read/written only via service-role server fns; admin auth = `ADMIN_PASSWORD` secret + encrypted session cookie (`SESSION_SECRET`). Why: no user accounts, admin-only management.
