# Wyłączenie WireGuard - Instrukcja

WireGuard został wyłączony na OVH. Poniżej instrukcje dla pozostałych serwerów.

## Status

| Serwer | IP | WireGuard | Status |
|--------|-----|-----------|--------|
| OVH | 147.135.211.101 | ✅ Wyłączony | Gotowy |
| Coolify | 5.189.139.149 | ❌ Do wyłączenia | Oczekuje |
| Contabo | 173.249.37.239 | ❌ Do wyłączenia | Oczekuje |

---

## Wyłączenie WireGuard na Coolify (5.189.139.149)

Zaloguj się na serwer Coolify (przez SSH lub konsolę web) i wykonaj:

```bash
# Zatrzymanie WireGuard
sudo wg-quick down wg0
sudo systemctl stop wg-quick@wg0
sudo systemctl disable wg-quick@wg0

# Weryfikacja
sudo wg show
# Powinno pokazać pusty wynik (brak aktywnych interfejsów)

# Sprawdzenie routingu
ip route | grep wg
# Nie powinno być żadnych routów przez wg0
```

---

## Wyłączenie WireGuard na Contabo (173.249.37.239)

Zaloguj się na serwer Contabo (przez SSH lub konsolę web) i wykonaj:

```bash
# Zatrzymanie WireGuard
sudo wg-quick down wg0
sudo systemctl stop wg-quick@wg0
sudo systemctl disable wg-quick@wg0

# Weryfikacja
sudo wg show
# Powinno pokazać pusty wynik

# Sprawdzenie routingu
ip route | grep wg
# Nie powinno być żadnych routów przez wg0
```

---

## Czyszczenie konfiguracji (opcjonalnie)

Jeśli chcesz całkowicie usunąć WireGuard (po potwierdzeniu że wszystko działa):

```bash
# Na każdym serwerze:
sudo rm -f /etc/wireguard/wg0.conf
sudo rm -f /etc/wireguard/privatekey /etc/wireguard/publickey
sudo rmdir /etc/wireguard 2>/dev/null || true
sudo apt remove wireguard wireguard-tools  # lub 'yum remove' dla RHEL
```

---

## Weryfikacja po wyłączeniu

Po wyłączeniu WireGuard na wszystkich serwerach:

1. **Sprawdź połączenie SSH** z każdego serwera na każdy:
   ```bash
   # Z Coolify na OVH
   ssh ubuntu@147.135.211.101 "echo 'OK'"
   
   # Z OVH na Coolify
   ssh root@5.189.139.149 "echo 'OK'"
   
   # Podobnie dla Contabo
   ```

2. **Sprawdź czy Coolify może połączyć się z OVH** (dodanie serwera w panelu)

3. **Sprawdź logi fail2ban** - upewnij się że nie ma błędnych prób logowania

---

## Dlaczego WireGuard został wyłączony?

WireGuard tworzył problemy z:
- Routingiem ruchu SSH (konflikty między publicznym IP a VPN IP)
- Firewall (iptables) - reguły mogły blokować ruch
- Fail2ban - bany na niewłaściwe adresy IP

Wszystkie serwery mają publiczne IP i bezpośrednie połączenie przez SSH jest prostsze i bardziej niezawodne.
