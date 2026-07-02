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
- Image Docker finale: Nginx servant les fichiers statiques du build.

## Configuration Jenkins, Sonar et Docker

Le pipeline Jenkins suit l'ordre suivant: checkout, `npm ci`, tests avec couverture, build Vite, analyse SonarQube, Quality Gate, build de l'image Docker, scan Trivy, génération du SBOM SPDX, puis push Docker Hub.

Points importants:

- Les identifiants Jenkins sont utilisés uniquement via `withCredentials`.
- Le token Sonar est injecté au moment de l'analyse, jamais en clair dans le dépôt.
- Le Dockerfile est multi-stage pour garder l'image runtime minimale.
- `nginx.conf` utilise `try_files $uri $uri/ /index.html;` pour le routage côté client.

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
docker run --rm -p 8080:80 cicd-tasklist-frontend
```

### CI/CD

Le fichier `Jenkinsfile` produit les livrables suivants:

- `coverage/lcov.info`
- `reports/junit.xml`
- `dist/`
- `sbom-spdx.json`
- l'image Docker taggée et poussée vers Docker Hub