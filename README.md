# 💊 PharmaLocate

PharmaLocate est une plateforme web et mobile permettant de localiser les pharmacies, rechercher des médicaments, consulter les stocks, effectuer des réservations et gérer les abonnements des pharmacies.

## 📌 Fonctionnalités principales

### 👤 Utilisateur
- Inscription et connexion sécurisées (JWT + OTP par e-mail)
- Recherche de pharmacies
- Recherche de médicaments
- Consultation des stocks
- Ajout des médicaments au panier
- Réservation de médicaments
- Choix entre retrait en pharmacie ou livraison à domicile
- Paiement mobile manuel (Bankily, Masrivi, Click, Sedad, BCI Pay)
- Suivi des réservations
- Notifications
- Gestion du profil

### 💊 Pharmacien
- Création et gestion de sa pharmacie
- Sélection de l'emplacement via Google Maps
- Gestion des stocks
- Gestion des réservations
- Validation ou refus des paiements
- Gestion des commandes
- Gestion des méthodes de paiement
- Gestion des abonnements
- Tableau de bord
- Gestion des finances
- Statistiques

### 🛠 Administrateur
- Validation des pharmacies
- Gestion des utilisateurs
- Gestion des abonnements
- Gestion des transactions
- Gestion des commissions
- Gestion des factures
- Gestion des remboursements
- Tableau de bord financier
- Statistiques globales

---

# 🏗 Architecture

Le projet est développé selon une architecture **Client-Serveur**.

### Backend
- Django
- Django REST Framework
- JWT Authentication
- MySQL

Architecture :
- MVT (Model View Template)
- Architecture REST
- Architecture en couches (Layered Architecture)

### Frontend Web
- React.js
- Vite
- Axios
- React Router
- Tailwind CSS
- Chart.js
- Font Awesome

Architecture :
- Feature-Based Architecture

### Application Mobile
- Flutter
- Dio
- Material 3
- Geolocator
- Image Picker

Architecture :
- Clean Architecture organisée par fonctionnalités

---

# 🚀 Technologies utilisées

## Backend
- Python
- Django
- Django REST Framework
- MySQL
- JWT
- Pillow

## Frontend Web
- React.js
- Vite
- Tailwind CSS
- Axios
- React Router DOM
- Chart.js
- Font Awesome

## Mobile
- Flutter
- Dart
- Dio
- Material 3
- Geolocator
- Image Picker

---

# 📁 Structure du projet

```
pharlocate/
│
├── backend/
├── frontend-web/
├── mobile/
└── README.md
```

---

# 🔐 Authentification

- JWT Authentication
- OTP par e-mail
- Réinitialisation du mot de passe
- Validation sécurisée

---

# 💳 Paiement

Paiement mobile manuel :

- Bankily
- Masrivi
- Click
- Sedad
- BCI Pay

Le pharmacien vérifie la transaction avant de confirmer la commande.

---

# 📦 Gestion des réservations

- Panier
- Réservation
- Retrait en pharmacie
- Livraison à domicile
- Calcul automatique des frais de livraison
- Paiement
- Notifications

---


# 📊 Fonctionnalités financières

- Paiements
- Transactions
- Commissions
- Factures
- Remboursements
- Tableau de bord financier

---

# 📍 Géolocalisation

- Google Maps
- Localisation des pharmacies
- Choix précis de l'emplacement
- Calcul automatique des distances

---

# 🔔 Notifications

- Confirmation de réservation
- Paiement validé ou refusé
- Notifications d'abonnement
- Notifications administrateur

---

# 👨‍💻 Développeur
