# 🔧 Настройка Supabase Storage для загрузки фотографий

## Проблема
Загрузка фотографий не работает из-за ошибки Row Level Security (RLS): `"new row violates row-level security policy"`

## Решение

### 1. Настройка Bucket

1. Зайдите в **Supabase Dashboard** → **Storage**
2. Найдите bucket `avatars` или создайте новый:
   - **Имя**: `avatars`
   - **Public bucket**: ✅ **ДА** (обязательно!)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/*`

### 2. Настройка RLS политик

Перейдите в **SQL Editor** и выполните следующие команды:

#### А) Включить RLS для storage.objects (если не включено)
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

#### Б) Создать политики доступа

```sql
-- 1. Политика для чтения файлов (публичный доступ к bucket avatars)
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

-- 2. Политика для загрузки файлов (только аутентифицированные пользователи)
CREATE POLICY "Allow authenticated uploads" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 3. Политика для обновления файлов (только владелец файла)
CREATE POLICY "Allow authenticated updates" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Политика для удаления файлов (только владелец файла)
CREATE POLICY "Allow authenticated deletes" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### В) Проверка существующих политик

```sql
-- Посмотреть все политики для storage.objects
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

### 3. Альтернативное решение (если проблема остается)

Если RLS политики не помогают, можно создать более простую политику:

```sql
-- Удалить существующие политики
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Создать универсальные политики
CREATE POLICY "Allow all for avatars bucket" ON storage.objects 
FOR ALL USING (bucket_id = 'avatars') 
WITH CHECK (bucket_id = 'avatars');
```

### 4. Проверка настроек bucket

В разделе **Storage → Settings** проверьте:

- **✅ Bucket `avatars` существует**
- **✅ Public bucket = true**
- **✅ File size limit >= 5MB**
- **✅ MIME types включают `image/*`**

### 5. Проверка URL

Убедитесь что URL правильно сформирован:
```
https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/avatars/filename.jpg
```

## Тестирование

После настройки политик:

1. Попробуйте загрузить фото через приложение
2. Проверьте консоль браузера на наличие ошибок
3. Убедитесь что файл появился в Storage Dashboard
4. Проверьте что публичный URL доступен

## Дополнительная диагностика

Если проблема остается, проверьте в консоли:

1. **Токен аутентификации** - должен присутствовать и быть валидным
2. **CORS настройки** - должны разрешать запросы с вашего домена
3. **Network tab** - посмотрите точный запрос и ответ сервера

## Типичные ошибки

- **400 Bad Request + RLS error** → Проблема с политиками (используйте решения выше)
- **401 Unauthorized** → Проблема с токеном аутентификации
- **403 Forbidden** → Bucket не публичный или политики запрещают доступ
- **404 Not Found** → Bucket не существует или неправильное имя