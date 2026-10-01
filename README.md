# Cvia — plateforme de création de CV (Bénin)

Application web (Next.js 15, TypeScript, Tailwind v4, Prisma) qui implémente le cœur du cahier des charges
`Cahier_des_charges_plateforme_CV_complet.docx` : modèles de CV, éditeur avec aperçu en direct, PDF A4,
paiement Mobile Money (FedaPay), tableau de bord et administration.
Le nom « Cvia » est un nom provisoire : changez `NEXT_PUBLIC_APP_NAME` dans `.env`.

## Démarrage rapide

```bash
npm install
cp .env.example .env          # puis adaptez AUTH_SECRET
npm run db:reset              # crée la base SQLite + données de départ
npm run pdf:install           # télécharge Chromium (génération des PDF)
# Linux : si Chromium ne démarre pas -> npx playwright install-deps chromium
npm run dev                   # http://localhost:3000
```

Comptes de démonstration (créés par le seed) :

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Administrateur | `admin@cvia.local` | `Admin#2026` |
| Candidat (avec un CV d’exemple) | `demo@cvia.local` | `Demo#2026` |

Codes promo de test : `BIENVENUE20` (−20 %), `ETUDIANT` (−300 F), `GRATUIT100` (gratuit, 20 usages).

## Paiement : mode démo ou FedaPay

- **Sans clé** (`FEDAPAY_SECRET_KEY` vide) : mode démo. Le paiement reste « en attente » et un encadré jaune permet de
  simuler la réponse de l’opérateur (accepté / refusé). Tout le reste de la logique (commande, droits, fenêtre de 30 jours,
  crédits, passes, parrainage) est la vraie.
- **Avec FedaPay** : renseignez `FEDAPAY_ENV=sandbox`, `FEDAPAY_SECRET_KEY` et `FEDAPAY_WEBHOOK_SECRET`, puis déclarez
  dans le tableau de bord FedaPay le webhook `https://VOTRE-DOMAINE/api/webhooks/fedapay` (événements `transaction.*`).
  Les numéros de test et le paiement sans redirection (`mtn_open`, `moov`, `sbin`) sont documentés sur docs.fedapay.com.
  La signature `X-FEDAPAY-SIGNATURE` est vérifiée sur le corps brut, les événements sont dédoublonnés, et un
  rapprochement automatique (toutes les 5 min) rattrape les webhooks manqués.

## Prix et règles (réglables dans /admin)

CV à l’unité 1 200 F · Pack 3 CV 3 000 F (12 mois) · Pass 30 j 2 500 F · Pass 90 j 5 500 F · Réactivation 500 F.
Règle d’accès (`src/lib/access.ts`) : PDF sans filigrane = pass actif **ou** fenêtre de 30 jours ouverte après déblocage.
Le contenu du CV reste toujours modifiable.

## Structure

```
prisma/schema.prisma        modèle de données (SQLite en dev, PostgreSQL en prod)
src/lib/templates/          5 modèles = fonctions pures -> HTML (aperçu, PDF et partage utilisent le même rendu)
src/lib/access.ts, pricing.ts   règles métier pures (testées)
src/lib/orders.ts           commandes, octroi idempotent des droits, remboursement, rapprochement
src/lib/payments/           interface PaymentGateway : FedaPay + passerelle simulée
src/lib/pdf.ts              Playwright/Chromium -> PDF A4 (réseau externe bloqué)
src/app/api/                API REST (auth, cvs, photo, pdf, orders, webhook, contact…)
src/app/(site) (auth) app admin   pages publiques, comptes, tableau de bord + éditeur, administration
tests/                      tests unitaires (npm test)   scripts/e2e.ts  test de bout en bout
```

## Vérifications

```bash
npm test                 # règles d'accès et de promo
npm run typecheck
npm run build && npm run start
npx tsx scripts/e2e.ts   # parcours complet sur le serveur lancé (inscription -> paiement simulé -> PDF -> sécurité -> webhook)
```
(`scripts/e2e.ts` et `scripts/shot-templates.ts` importent du code « server-only » : si `tsx` s’en plaint,
remplacez le contenu de `node_modules/server-only/index.js` par `module.exports = {}`.)

## Production

1. PostgreSQL : dans `schema.prisma`, `provider = "postgresql"`, `DATABASE_URL=postgresql://…`, puis `npx prisma db push` (ou migrations).
2. `AUTH_SECRET` long et aléatoire, `APP_URL` en HTTPS, clés FedaPay `live`.
3. Stockage : `STORAGE_DIR` sur un volume persistant (ou remplacer `src/lib/storage.ts` par S3/R2, même interface).
4. Limiteur de débit (`src/lib/rate-limit.ts`) et tâches périodiques (`src/instrumentation-node.ts`) : en mémoire, à remplacer
   par Redis/BullMQ dès que vous avez plusieurs instances.
5. E-mails : la réinitialisation de mot de passe écrit dans la table `OutboxMail` ; branchez un service d’envoi (Resend, Brevo…).
6. Complétez les textes légaux (`/legal/*`, textes de démonstration), déclarez le traitement à l’APDP.
7. `Dockerfile` fourni (image Playwright incluant Chromium).

## Périmètre : fait / non fait

**Implémenté** : site public (accueil, modèles, tarifs, FAQ, contact, pages légales), inscription/connexion e-mail + mot de passe
(scrypt, session JWT, verrouillage après 5 échecs), mot de passe oublié, brouillon invité conservé puis importé à l’inscription,
éditeur (10 sections, listes réordonnables, aperçu en direct, enregistrement auto, historique de versions côté API, 5 modèles,
couleurs, 6 polices, tailles, espacement, ordre/masquage des sections, FR/EN), photo recadrée et nettoyée, PDF A4 avec filigrane
ou sans, lien de partage révocable, tableau de bord, offres/crédits/passes/codes promo/parrainage, paiement FedaPay + mode démo,
reçus, profil (changement de mot de passe, suppression de compte), administration (statistiques, utilisateurs, commandes,
remboursement, prix, promos, modèles, messages, réglages, 2FA TOTP, journal d’audit).

**Non implémenté (feuille de route)** : connexion Google, SMS/OTP, aide à la rédaction par IA, import d’un CV existant,
lettre de motivation, espace recruteur, application Android, photo pour les invités (réservée aux comptes), e-mails réels,
interface d’historique de versions dans l’éditeur (l’API `/api/cvs/[id]/revisions` existe).
