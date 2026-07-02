# Frontend TaskList

## Architecture

Cette SPA est construite avec React 19, TypeScript et Vite. L'application consomme l'API TaskList via `src/api/taskApi.ts`, avec un point d'entrée configurable par `VITE_API_URL` et, par défaut, le préfixe `/api`.

Le flux principal est simple:

1. Les composants d'interface vivent dans `src/components`.
2. Le hook `src/hooks/useTasks.ts` orchestre les chargements et les actions métier.
3. `src/api/taskApi.ts` encapsule les appels HTTP `fetch` vers `/tasks`.
4. Les tests unitaires et d'intégration légère sont regroupés dans `src/__tests__`.

## Prérequis

- Node.js 20 ou supérieur.
- npm.
- Docker pour construire et exécuter l'image de production.
- Jenkins avec les credentials `dockerhub-creds` et `sonar-token`.
- Une instance SonarQube nommée `sonarqube-local` dans Jenkins.
- Trivy et Syft accessibles via image Docker dans le pipeline.

## Outils et sorties

- Tests: Vitest + Testing Library + user-event.
- Couverture: `coverage/lcov.info`.
- Rapport d'exécution des tests: `reports/junit.xml`.
- Build frontend: `dist/`.
- SBOM: `sbom-spdx.json`.
- Image Docker finale: serveur statique Go servi depuis une image finale `scratch` sur le port 8080.

## Configuration Jenkins, Sonar et Docker

Le pipeline Jenkins suit l'ordre suivant: checkout, `npm ci`, tests avec couverture, build Vite, analyse SonarQube, Quality Gate, build de l'image Docker, scan Trivy, génération du SBOM SPDX, puis push Docker Hub.

Points importants:

- Les identifiants Jenkins sont utilisés uniquement via `withCredentials`.
- Le token Sonar est injecté au moment de l'analyse, jamais en clair dans le dépôt.
- Le Dockerfile est multi-stage pour garder l'image runtime minimale.
- `server/main.go` gère le routage côté client en renvoyant `index.html` pour les routes SPA.

## Stratégie de tests

Les tests couvrent deux zones:

- `taskApi.ts`: cas nominal et erreurs HTTP pour `getTasks`, `getTask`, `createTask`, `updateTask` et `deleteTask`.
- `TaskList`: état de chargement, erreur, état vide, puis interactions sur les contrôles de la liste avec `@testing-library/user-event`.

La cible est une couverture verte complète via `npm run test:coverage`.

## Stratégie de sécurité

- Les secrets restent côté Jenkins: `dockerhub-creds` pour Docker Hub et `sonar-token` pour SonarQube.
- Trivy bloque le pipeline sur les vulnérabilités `HIGH` et `CRITICAL`.
- Le build runtime n'embarque que les fichiers statiques nécessaires.
- Le `.dockerignore` évite d'envoyer `node_modules`, `dist`, `coverage` et les fichiers de test au contexte Docker.

## Génération des livrables

### Local

```bash
npm ci
npm run test:coverage
npm run build
```

### Docker

```bash
docker build -t cicd-tasklist-frontend .
docker run --rm -p 8080:8080 cicd-tasklist-frontend
```

## Lancer en local avec Docker

Le frontend est servi par Nginx via le Dockerfile multi-stage. La variable `VITE_API_URL` est injectée au moment du build de l'image.

Exécution standard:

```bash
docker compose up -d --build
```

Par défaut, `docker-compose.yml` utilise:

```text
VITE_API_URL=http://localhost:3001/api
```

Vous pouvez la surcharger selon votre backend:

Backend déployé:

```bash
VITE_API_URL=https://api.example.com/api docker compose up -d --build
```

Backend en Docker sur le même réseau Compose:

```bash
VITE_API_URL=http://backend:3001/api docker compose up -d --build
```

Le service frontend est exposé sur `http://localhost:5173`.

### CI/CD

Le fichier `Jenkinsfile` produit les livrables suivants:

- `coverage/lcov.info`
- `reports/junit.xml`
- `dist/`
- `sbom-spdx.json`
- l'image Docker taggée et poussée vers Docker Hub