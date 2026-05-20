import {
  faBoxesStacked,
  faCalendarCheck,
  faChartLine,
  faCheckCircle,
  faClinicMedical,
  faClock,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

export const pharmacistLinks = [
  {
    label: "Tableau de bord",
    shortLabel: "Home",
    path: "/pharmacien/dashboard",
    icon: faChartLine,
  },
  {
    label: "Profil pharmacie",
    shortLabel: "Profil",
    path: "/pharmacien/pharmacie",
    icon: faClinicMedical,
  },
  {
    label: "Horaires",
    shortLabel: "Horaires",
    path: "/pharmacien/horaires",
    icon: faClock,
  },
  {
    label: "Stocks",
    shortLabel: "Stocks",
    path: "/pharmacien/stocks",
    icon: faBoxesStacked,
  },
  {
    label: "Réservations",
    shortLabel: "Réserv.",
    path: "/pharmacien/reservations",
    icon: faCalendarCheck,
  },
];

export const adminLinks = [
  {
    label: "Dashboard",
    shortLabel: "Admin",
    path: "/admin/dashboard",
    icon: faChartLine,
  },
  {
    label: "Validation pharmacies",
    shortLabel: "Valid.",
    path: "/admin/pharmacies-validation",
    icon: faCheckCircle,
  },
  {
    label: "Utilisateurs",
    shortLabel: "Users",
    path: "/admin/users",
    icon: faUsers,
  },
  {
    label: "Pharmacies",
    shortLabel: "Pharma",
    path: "/admin/pharmacies",
    icon: faClinicMedical,
  },
];
