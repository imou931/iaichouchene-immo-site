# EI IAICHOUCHENE IMMOBILIER — V6

## Statut
Version V6 préparée pour le déploiement Netlify.

## Avant publication

### 1. Netlify — variables d'environnement
Dans le projet Netlify : **Project configuration → Environment variables**.
Créer :

- `RESEND_API_KEY` = votre clé API Resend
- `FROM_EMAIL` = une adresse expéditrice appartenant au domaine vérifié dans Resend (ex. `guides@iaichouchene-immo.fr`)

Ne jamais placer `RESEND_API_KEY` dans `index.html` ou dans un dépôt public.

### 2. Resend — domaine expéditeur
Dans Resend, ajouter puis vérifier `iaichouchene-immo.fr`.
Ajouter dans le DNS les enregistrements demandés par Resend (notamment SPF/DKIM), attendre la propagation, puis vérifier le domaine.

### 3. Netlify Forms — notifications
Dans Netlify : **Project configuration → Notifications → Emails and webhooks → Form submission notifications**.
Créer au minimum une notification email vers votre adresse pour les formulaires :

- `estimation`
- `guide-vendeur`
- `contact`
- `recrutement`

Les soumissions restent également visibles dans l'onglet Forms de Netlify.

### 4. Test Resend
Depuis le site en production :
1. demander chacun des 4 guides ;
2. vérifier la réception de l'email ;
3. vérifier que le bon PDF est joint ;
4. vérifier que la réponse vers l'expéditeur arrive bien sur `imou931@hotmail.com`.

### 5. Test des leads
Tester au moins :
- estimation ;
- guide ;
- contact ;
- recrutement.

Pour chaque test : vérifier la présence de la soumission dans Netlify Forms et la réception de la notification.

## Points de conformité / contenu

- Adresse professionnelle affichée : **Gagny (93220), France**.
- La calculatrice de plus-value est une **simulation indicative** et ne remplace pas le calcul du notaire.
- Elle couvre le régime général simplifié des plus-values immobilières des particuliers, avec abattements de durée de détention et taxe sur les plus-values immobilières élevées, mais ne couvre pas toutes les exonérations ou régimes particuliers.
- Les forfaits de 7,5 % pour frais d'acquisition et 15 % pour travaux sont appliqués uniquement dans le cadre simplifié indiqué dans l'interface.


## V6 — correction Resend

La fonction `netlify/functions/envoyer-guide.js` utilise directement l'API HTTP Resend via `fetch`. Aucun paquet npm `resend` n'est requis. Cette configuration évite les erreurs de dépendance lors d'un déploiement manuel Netlify.

Variables Netlify nécessaires : `RESEND_API_KEY` et `FROM_EMAIL`.
