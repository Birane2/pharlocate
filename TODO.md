# TODO - PharmaLocate (Pharmacien finance routing/sidebar)

## Étapes
- [x] 1) Confirmer et corriger le routage pour /pharmacien/finance, /pharmacien/payments, /pharmacien/transactions dans src/App.jsx (déjà OK)
- [x] 2) S’assurer que le layout DashboardLayout et PharmacienLayout utilisent bien la même logique de liens active (NavLink/paths)
- [x] 3) Mettre à jour la sidebar pharmacien (src/components/layout/PharmacienSidebar.jsx) : ajouter 💰 Finance, 💳 Paiements, 📈 Transactions avec les bons paths et un ordre cohérent
- [x] 4) Ajouter redirections/carts cliquables sur la page Finance (src/pages/pharmacien/FinanceDashboard.jsx) vers /pharmacien/payments et /pharmacien/transactions
- [x] 5) Implémenter la console temporaire console.log(location.pathname) sur les pages Finance/Payments/Transactions pour debug de la route active (patch)
- [x] 6) Vérifier les imports et noms de composants (FinanceDashboard, FinanceTransactions, PharmacienPayments) et corriger si besoin
- [ ] 7) Tester manuellement: URLs directement + navigation via sidebar + état actif (NavLink)

