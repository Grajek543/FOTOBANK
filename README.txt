# Instrukcja uruchamiania aplikacji FotoBank
Wymagania:
-Python
-Node.js
-Docker
-Mysql zintegrowany w dockerze

Poniższe kroki pokazują, jak uruchomić aplikację FotoBank z bazą danych MySQL oraz środowiskiem backendowym i frontendowym.

## Krok 1: Uruchomienie kontenera Docker z MySQL

Aby uruchomić bazę danych MySQL w kontenerze Docker, użyj poniższej komendy w CMD:

docker run --name fotobank_test_mysql ^
  -e MYSQL_ROOT_PASSWORD=rootpass ^
  -e MYSQL_DATABASE=fotobank_test ^
  -e MYSQL_USER=testuser ^
  -e MYSQL_PASSWORD=testpass ^
  -p 3307:3306 ^
  -d mysql:8 ^
  --log-bin-trust-function-creators=1

## Krok 2: Przygotowanie środowiska Python (backend)
Stwórz środowisko wirtualne:
W CMD w folderze backend wpisz:

python -m venv venv


Aktywuj środowisko wirtualne:

venv\Scripts\activate


Zainstaluj zależności wymagane przez aplikację:

pip install -r requirements.txt


Uruchom backend aplikacji:

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

## Krok 3: Instalacja i uruchomienie frontendowej aplikacji React
Zainstaluj zależności frontendowe:

npm install


Uruchom aplikację frontendową:

npm start


## Krok 4: Dostęp do bazy danych MySQL
Aby połączyć się z kontenerem MySQL i wykonać zapytanie SQL, użyj poniższej komendy:

docker exec -it fotobank_test_mysql mysql -u root -p

Następnie wprowadź hasło rootpass, aby uzyskać dostęp do bazy danych MySQL.


Po rejestracji pierwszego użytkownika, żeby nadać mu uprawnienia administratora napisz w bazie MySQL:

use fotobank_test;
update users set role = "admin" where id = 1;