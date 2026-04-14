import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE_URL = 'https://digest-news.uz'

function AdminDashboardPage() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = localStorage.getItem('admin_token')

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true)

        const res = await fetch(`${API_BASE_URL}/api/articles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        if (!data.ok) {
          throw new Error('Ошибка загрузки')
        }

        setArticles(data.articles || [])
      } catch (err) {
        console.error(err)
        setError('Не удалось загрузить статьи')
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [token])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    window.location.href = '/login'
  }

  const handleDelete = async (articleId) => {
    const confirmed = window.confirm('Удалить эту новость?')
    if (!confirmed) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось удалить новость')
      }

      setArticles((prev) => prev.filter((article) => article.id !== articleId))
    } catch (err) {
      console.error(err)
      alert('Не удалось удалить новость')
    }
  }

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-card">
        <div className="admin-dashboard-top">
          <div>
            <h1>Админ-панель</h1>
            <p>Управление контентом</p>
          </div>

          <div className="admin-dashboard-actions">
            <Link to="/articles/new" className="admin-primary-link">
              Создать новость
            </Link>

            {/* 🔥 ВОТ ЭТО МЫ ДОБАВИЛИ */}
            <Link to="/reels" className="admin-secondary-link">
              Управление Reels
            </Link>

            <button onClick={handleLogout}>Выйти</button>
          </div>
        </div>

        <h2>Новости</h2>

        {loading && <p>Загрузка...</p>}
        {error && <p>{error}</p>}
        {!loading && !articles.length && <p>Пока нет новостей</p>}

        <div className="admin-articles-list">
          {articles.map((article) => (
            <div key={article.id} className="admin-article-item">
              <div className="admin-article-main">
                <div>
                  <strong>{article.translation?.title || 'Без названия'}</strong>
                  <p>{article.slug}</p>
                </div>

                <div className="admin-article-actions">
                  <Link
                    to={`/articles/${article.id}/edit`}
                    className="admin-edit-link"
                  >
                    Редактировать
                  </Link>

                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => handleDelete(article.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export default AdminDashboardPage