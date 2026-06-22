"""
test_smtp.py - Tester la connexion Gmail SMTP pour PharmaLocate

Usage :
    python test_smtp.py

Ce script verifie :
  1. Les variables .env (EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
  2. La connexion SMTP a smtp.gmail.com
  3. L'authentification avec le mot de passe d'application
  4. L'envoi reel d'un email de test
"""

import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ── Lire .env ────────────────────────────────────────────────────────────────
env = {}
env_path = os.path.join(os.path.dirname(__file__), '.env')
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, _, v = line.partition('=')
            env[k.strip()] = v.strip()

HOST = 'smtp.gmail.com'
PORT = 587
USER = env.get('EMAIL_HOST_USER', '')
PASS = env.get('EMAIL_HOST_PASSWORD', '').replace(' ', '')
FROM = env.get('DEFAULT_FROM_EMAIL', f'PharmaLocate <{USER}>')
PLACEHOLDER = 'REMPLACER_PAR_NOUVEAU_APP_PASSWORD'

print('=' * 60)
print('TEST SMTP GMAIL - PharmaLocate')
print('=' * 60)
print()
print('EMAIL_HOST_USER    :', USER or 'MANQUANT')
print('EMAIL_HOST_PASSWORD:', f'{PASS[:4]}****{PASS[-4:]} ({len(PASS)} chars)' if PASS and PASS != PLACEHOLDER else 'NON CONFIGURE')
print('DEFAULT_FROM_EMAIL :', FROM)
print()

if not USER:
    print('[ERREUR] EMAIL_HOST_USER manquant dans .env')
    exit(1)

if not PASS or PASS == PLACEHOLDER:
    print('[ERREUR] EMAIL_HOST_PASSWORD non configure.')
    print()
    print('Etapes pour obtenir un App Password Gmail :')
    print('  1. Aller sur https://myaccount.google.com')
    print(f'  2. Se connecter avec {USER}')
    print('  3. Securite → Validation en 2 etapes → activer si pas fait')
    print('  4. Securite → Mots de passe des applications')
    print('  5. Creer un nouveau → nom : PharmaLocate')
    print('  6. Copier le code 16 caracteres (ex: abcdefghijklmnop)')
    print('  7. Remplacer EMAIL_HOST_PASSWORD dans .env')
    print('  8. Relancer : python test_smtp.py')
    exit(1)

# ── Test 1 : connexion TCP ──────────────────────────────────────────────────
print('Etape 1/4 : Connexion a smtp.gmail.com:587...')
try:
    server = smtplib.SMTP(HOST, PORT, timeout=15)
    print('[OK] Connexion TCP etablie')
except Exception as e:
    print(f'[ERREUR] Impossible de se connecter : {e}')
    print('  Verifier la connexion Internet ou le pare-feu.')
    exit(1)

# ── Test 2 : STARTTLS ───────────────────────────────────────────────────────
print('Etape 2/4 : STARTTLS...')
try:
    server.ehlo()
    server.starttls()
    server.ehlo()
    print('[OK] STARTTLS active')
except Exception as e:
    print(f'[ERREUR] STARTTLS echoue : {e}')
    server.quit()
    exit(1)

# ── Test 3 : authentification ───────────────────────────────────────────────
print(f'Etape 3/4 : Authentification avec {USER}...')
try:
    server.login(USER, PASS)
    print('[OK] Authentification reussie - App Password valide !')
except smtplib.SMTPAuthenticationError as e:
    print(f'[ERREUR AUTH] Code {e.smtp_code} : {e.smtp_error}')
    print()
    print('  -> Le mot de passe d\'application est revoque ou invalide.')
    print('  -> Solution : generer un NOUVEAU App Password Gmail :')
    print(f'     https://myaccount.google.com → Securite → Mots de passe des applications')
    print(f'     Creer → PharmaLocate → copier le code 16 chars → mettre dans .env')
    server.quit()
    exit(1)
except Exception as e:
    print(f'[ERREUR] {type(e).__name__}: {e}')
    server.quit()
    exit(1)

# ── Test 4 : envoi email ────────────────────────────────────────────────────
print(f'Etape 4/4 : Envoi email de test vers {USER}...')
try:
    msg = MIMEMultipart('alternative')
    msg['Subject'] = '[PharmaLocate] Test SMTP - Configuration OK'
    msg['From'] = FROM
    msg['To'] = USER

    body = MIMEText(
        f'Bonjour,\n\n'
        f'Ce message confirme que la configuration Gmail SMTP de PharmaLocate fonctionne.\n\n'
        f'Email SMTP : {USER}\n'
        f'Backend    : smtp.gmail.com:587\n\n'
        f'Les codes OTP seront desormais envoyes par email.\n\n'
        f'-- L\'equipe PharmaLocate',
        'plain',
        'utf-8',
    )
    msg.attach(body)

    server.sendmail(USER, [USER], msg.as_string())
    server.quit()
    print(f'[OK] Email envoye vers {USER}')
    print()
    print('=' * 60)
    print('SMTP CONFIGURE AVEC SUCCES !')
    print('Verifiez votre boite Gmail (et les spams).')
    print()
    print('Prochaine etape : redemarrer Django')
    print('  python manage.py runserver')
    print('=' * 60)
except Exception as e:
    print(f'[ERREUR envoi] {type(e).__name__}: {e}')
    server.quit()
    exit(1)
