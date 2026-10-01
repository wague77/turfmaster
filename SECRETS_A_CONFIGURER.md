# Clés secrètes à configurer (non incluses par sécurité)

- ADMIN_PASSWORD : votre mot de passe administrateur.
- SESSION_SECRET : une chaîne aléatoire de 64 caractères (ex. `openssl rand -hex 32`).
- LOVABLE_API_KEY : clé de l'IA (fournie automatiquement par Lovable).
- SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY : base de données.

Base de données : exécuter les fichiers SQL de `drizzle/migrations/0000_migration.sql` pour créer la table des codes d'accès.
Installation : `bun install` puis `bun run dev`.
