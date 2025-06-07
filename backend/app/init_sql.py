from sqlalchemy import text
from app.database import engine

def create_sql_objects():
    with engine.begin() as conn:
        # 1. Funkcja: liczba zdjęć użytkownika
        conn.execute(text("""
        CREATE FUNCTION IF NOT EXISTS get_total_user_photos(p_user_id INT)
        RETURNS INT
        DETERMINISTIC
        READS SQL DATA
        BEGIN
            DECLARE total INT;
            SELECT COUNT(*) INTO total FROM photos WHERE owner_id = p_user_id;
            RETURN total;
        END
        """))

        # 2. Funkcja: suma koszyka użytkownika
        conn.execute(text("""
        CREATE FUNCTION IF NOT EXISTS cart_sum(uid INT)
        RETURNS FLOAT
        DETERMINISTIC
        READS SQL DATA
        BEGIN
            DECLARE total FLOAT DEFAULT 0;
            SELECT SUM(p.price) INTO total
            FROM cart c
            JOIN cart_items ci ON ci.cart_id = c.id
            JOIN photos p ON p.id = ci.photo_id
            WHERE c.user_id = uid;
            RETURN IFNULL(total, 0);
        END
        """))

        # 3. Procedura: usuwanie użytkownika i wszystkiego z nim związanego
        conn.execute(text("""
        CREATE PROCEDURE IF NOT EXISTS delete_user_and_related(IN uid INT)
        BEGIN
            DECLARE cartId INT;
            SELECT id INTO cartId FROM cart WHERE user_id = uid LIMIT 1;
            IF cartId IS NOT NULL THEN
                DELETE FROM cart_items WHERE cart_id = cartId;
                DELETE FROM cart WHERE id = cartId;
            END IF;
            DELETE pc FROM photo_categories pc
            JOIN photos p ON p.id = pc.photo_id
            WHERE p.owner_id = uid;
            DELETE FROM photos WHERE owner_id = uid;
            DELETE oi FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.user_id = uid;
            DELETE FROM orders WHERE user_id = uid;
            DELETE pay FROM payments pay
            JOIN orders o ON o.id = pay.order_id
            WHERE o.user_id = uid;
            DELETE FROM purchases WHERE user_id = uid;
            DELETE FROM users WHERE id = uid;
        END
        """))

        # 4. Procedura: dodanie zdjęcia
        conn.execute(text("""
        CREATE PROCEDURE IF NOT EXISTS add_photo(
            IN p_title VARCHAR(255),
            IN p_description VARCHAR(1024),
            IN p_category VARCHAR(100),
            IN p_price FLOAT,
            IN p_file_path VARCHAR(255),
            IN p_thumb_path VARCHAR(255),
            IN p_owner_id INT
        )
        BEGIN
            INSERT INTO photos 
                (title, description, category, price, file_path, thumb_path, owner_id, created_at)
            VALUES 
                (p_title, p_description, p_category, p_price, p_file_path, p_thumb_path, p_owner_id, NOW());
            SELECT LAST_INSERT_ID() AS photo_id;
        END
        """))

        # 5. Trigger: po zakupie czyści koszyk
        conn.execute(text("""
        CREATE TRIGGER IF NOT EXISTS clear_cart_after_purchase
        AFTER INSERT ON purchases
        FOR EACH ROW
        BEGIN
            DECLARE cartId INT;
            SELECT id INTO cartId FROM cart WHERE user_id = NEW.user_id LIMIT 1;
            DELETE FROM cart_items WHERE cart_id = cartId;
        END
        """))

        # 6. Trigger: logowanie płatności przy usunięciu zakupów
        conn.execute(text("""
        CREATE TRIGGER IF NOT EXISTS log_purchases_before_delete
        BEFORE DELETE ON purchases
        FOR EACH ROW
        BEGIN
            DECLARE user_email VARCHAR(255);
            SELECT email INTO user_email FROM users WHERE id = OLD.user_id LIMIT 1;
            INSERT INTO purchase_logs (
                user_id, email, photo_id, purchase_date,
                payment_status, total_cost, created_at, updated_at
            )
            VALUES (
                OLD.user_id, user_email, OLD.photo_id, OLD.purchase_date,
                OLD.payment_status, OLD.total_cost, OLD.created_at, OLD.updated_at
            );
        END
        """))

        # 7. Trigger: blokowanie usuwania użytkownika z nierozliczonymi zamówieniami
        conn.execute(text("""
        CREATE TRIGGER IF NOT EXISTS trg_user_before_delete_block
        BEFORE DELETE ON users
        FOR EACH ROW
        BEGIN
            IF EXISTS (
                SELECT 1 FROM orders
                WHERE user_id = OLD.id
                AND status NOT IN ('completed', 'paid', 'anulowane')
            ) THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Nie można usunąć użytkownika z nierozliczonymi zamówieniami';
            END IF;
        END
        """))

        # 8. Wstawienie 50 kategorii bez sprawdzania
        conn.execute(text("""
        INSERT IGNORE INTO categories (name) VALUES
        ("Portret"), ("Krajobraz"), ("Miasto"), ("Makro"), ("Sport"),
        ("Zwierzeta"), ("Technologia"), ("Czarno-biale"), ("Abstrakcja"), ("Architektura"),
        ("Podroze"), ("Jedzenie"), ("Ludzie"), ("Przyroda"), ("Astronomia"),
        ("Samochody"), ("Motoryzacja"), ("Minimalizm"), ("Kolory"), ("Geometria"),
        ("Moda"), ("Produkt"), ("Woda"), ("Gory"), ("Niebo"),
        ("Deszcz"), ("Slonce"), ("Natura"), ("Las"), ("Zima"),
        ("Jesien"), ("Wiosna"), ("Lato"), ("Zachod"), ("Wschod"),
        ("Dom"), ("Wnetrze"), ("Ulica"), ("Cienie"), ("Noc"),
        ("Swieta"), ("Halloween"), ("Wielkanoc"), ("Biznes"), ("Finanse"),
        ("Muzyka"), ("Instrumenty"), ("Sztuka"), ("Rzezba"), ("Dziecko"), ("Emocje")
        , ("Retro"), ("Kosmos"), ("Przemysl"), ("Przemysl"), ("Milosc"), ("Fantasy")
        , ("Edukacja"), ("IT"), ("Lotnictwo"), ("Rosliny")
        """))

        # 9. Funkcja: Statystyki systemowe
        conn.execute(text("""
        CREATE FUNCTION IF NOT EXISTS get_system_stats()
        RETURNS JSON
        DETERMINISTIC
        READS SQL DATA
        BEGIN
            DECLARE result JSON;
            SELECT JSON_OBJECT(
                'users',     (SELECT COUNT(*) FROM users),
                'photos',    (SELECT COUNT(*) FROM photos),
                'purchases', (SELECT COUNT(*) FROM purchases)
            ) INTO result;
            RETURN result;
        END
        """))
        # 10. Funkcja: Statystyki użytkowników
        conn.execute(text("""
        CREATE FUNCTION IF NOT EXISTS get_user_stats()
        RETURNS JSON
        DETERMINISTIC
        READS SQL DATA
        BEGIN
            DECLARE result JSON;
            SELECT JSON_OBJECT(
                'users_total',       (SELECT COUNT(*) FROM users),
                'users_active',      (SELECT COUNT(*) FROM users WHERE is_active = 1),
                'users_banned',      (SELECT COUNT(*) FROM users WHERE full_banned = 1),
                'users_upload_blocked', (SELECT COUNT(*) FROM users WHERE banned = 1),
                'admins_count',      (SELECT COUNT(*) FROM users WHERE role = 'admin')
            ) INTO result;
            RETURN result;
        END
        """))

        # 11. Funkcja: Statystyki zdjęć
        conn.execute(text("""
        CREATE FUNCTION IF NOT EXISTS get_photo_stats()
        RETURNS JSON
        DETERMINISTIC
        READS SQL DATA
        BEGIN
            DECLARE result JSON;
            SELECT JSON_OBJECT(
                'photos_total',           (SELECT COUNT(*) FROM photos),
                'photos_avg_price',       (SELECT ROUND(AVG(price), 2) FROM photos),
                'photos_without_category',(SELECT COUNT(*) FROM photos p LEFT JOIN photo_categories pc ON p.id = pc.photo_id WHERE pc.photo_id IS NULL),
                'photos_with_purchases',  (SELECT COUNT(DISTINCT photo_id) FROM purchases)
            ) INTO result;
            RETURN result;
        END
        """))

        # 12. Funkcja: Statystyki zakupów i płatności
        conn.execute(text("""
        CREATE FUNCTION IF NOT EXISTS get_purchase_stats()
        RETURNS JSON
        DETERMINISTIC
        READS SQL DATA
        BEGIN
            DECLARE result JSON;
            SELECT JSON_OBJECT(
                'purchases_total',     (SELECT COUNT(*) FROM purchases),
                'revenue_total',       (SELECT ROUND(SUM(p.price), 2) FROM purchases pu JOIN photos p ON pu.photo_id = p.id),
                'buyers_count',        (SELECT COUNT(DISTINCT user_id) FROM purchases),
                'avg_revenue_per_user',(SELECT ROUND(SUM(p.price)/COUNT(DISTINCT pu.user_id), 2)
                                        FROM purchases pu JOIN photos p ON pu.photo_id = p.id)
            ) INTO result;
            RETURN result;
        END
        """))

        # 13. Funkcja: Inne ciekawe statystyki
        conn.execute(text("""
        CREATE FUNCTION IF NOT EXISTS get_misc_stats()
        RETURNS JSON
        DETERMINISTIC
        READS SQL DATA
        BEGIN
            DECLARE result JSON;
            SELECT JSON_OBJECT(
                'categories_total',     (SELECT COUNT(*) FROM categories),
                'most_active_user_id', (SELECT owner_id FROM photos GROUP BY owner_id ORDER BY COUNT(*) DESC LIMIT 1),
                'largest_cart_value',  (SELECT ROUND(MAX(total), 2) FROM (
                                            SELECT SUM(p.price) AS total
                                            FROM cart c
                                            JOIN cart_items ci ON ci.cart_id = c.id
                                            JOIN photos p ON p.id = ci.photo_id
                                            GROUP BY c.id
                                        ) AS subq),
                'avg_cart_value',      (SELECT ROUND(AVG(total), 2) FROM (
                                            SELECT SUM(p.price) AS total
                                            FROM cart c
                                            JOIN cart_items ci ON ci.cart_id = c.id
                                            JOIN photos p ON p.id = ci.photo_id
                                            GROUP BY c.id
                                        ) AS subq)
            ) INTO result;
            RETURN result;
        END
        """))
        