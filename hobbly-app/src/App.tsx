import React, { useEffect, useState } from 'react';
import './App.css';
import activitiesAPI from './api/activities.api';
import { Category } from './types';

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Тестируем подключение к Supabase
    const testConnection = async () => {
      try {
        console.log('Тестируем подключение к Supabase...');
        const data = await activitiesAPI.getCategories();
        setCategories(data);
        console.log('Успешно загружено категорий:', data.length);
      } catch (err: any) {
        console.error('Ошибка подключения:', err);
        setError(err.message || 'Ошибка подключения к базе данных');
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="App">
      <header className="App-header" style={{ padding: '20px' }}>
        <h1 style={{ color: '#65FF81' }}>🎯 Hobbly</h1>
        <p style={{ color: '#F5FF65' }}>Платформа для поиска хобби и активностей</p>
        
        <div style={{ marginTop: '40px', minWidth: '300px' }}>
          <h3>Статус подключения к Supabase:</h3>
          
          {loading && <p>⏳ Загрузка...</p>}
          
          {error && (
            <div style={{ color: '#ff6565', border: '1px solid #ff6565', padding: '10px', borderRadius: '5px' }}>
              ❌ {error}
              <br />
              <small>Проверьте настройки в файле .env</small>
            </div>
          )}
          
          {!loading && !error && (
            <div style={{ color: '#65FF81', border: '1px solid #65FF81', padding: '10px', borderRadius: '5px' }}>
              ✅ Подключение успешно!
              <br />
              Загружено категорий: {categories.length}
            </div>
          )}
          
          {categories.length > 0 && (
            <div style={{ marginTop: '20px', textAlign: 'left' }}>
              <h4>Категории в базе данных:</h4>
              <ul>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    {cat.icon} {cat.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '40px', fontSize: '14px', color: '#8F8F8F' }}>
          <p>📝 Следующие шаги:</p>
          <ol style={{ textAlign: 'left' }}>
            <li>Настройте переменные окружения в .env</li>
            <li>Выполните SQL скрипт в Supabase</li>
            <li>Создайте тестовые данные</li>
            <li>Начните разработку компонентов</li>
          </ol>
        </div>
      </header>
    </div>
  );
}

export default App;
