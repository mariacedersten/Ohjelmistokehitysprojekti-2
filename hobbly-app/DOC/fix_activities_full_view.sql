-- ============================================================================
-- Исправление представления activities_full
-- ============================================================================
-- Описание: Пересоздает представление activities_full с включением поля isApproved
-- Дата: 2025-09-17
-- ============================================================================

-- Удаляем старое представление
DROP VIEW IF EXISTS activities_full;

-- Создаем новое представление с полем isApproved
CREATE OR REPLACE VIEW activities_full AS
SELECT 
    a.*,
    c.name as category_name,
    c.icon as category_icon,
    u.full_name as organizer_name,
    u.organization_name as organizer_organization,
    u.email as organizer_email,
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'id', t.id,
                'name', t.name,
                'color', t.color
            )
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::json
    ) as tags
FROM activities a
LEFT JOIN categories c ON a.category_id = c.id
LEFT JOIN user_profiles u ON a.user_id = u.id
LEFT JOIN activity_tags at ON a.id = at.activity_id
LEFT JOIN tags t ON at.tag_id = t.id
GROUP BY a.id, c.name, c.icon, u.full_name, u.organization_name, u.email;

-- Предоставляем доступ к представлению
GRANT SELECT ON activities_full TO anon, authenticated;

-- Сообщаем об успешном обновлении
DO $$
BEGIN
    RAISE NOTICE 'Представление activities_full успешно обновлено!';
    RAISE NOTICE 'Теперь включает поле isApproved из таблицы activities';
END $$;
