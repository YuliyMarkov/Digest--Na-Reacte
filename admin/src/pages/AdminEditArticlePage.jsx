import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

const API_BASE_URL = 'http://localhost:4000'

function AdminEditArticlePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem('admin_token')

  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingArticle, setLoadingArticle] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [slug, setSlug] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)

  const [ruTitle, setRuTitle] = useState('')
  const [ruExcerpt, setRuExcerpt] = useState('')
  const [ruContent, setRuContent] = useState('')

  const [uzTitle, setUzTitle] = useState('')
  const [uzExcerpt, setUzExcerpt] = useState('')
  const [uzContent, setUzContent] = useState('')

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true)

        const res = await fetch(`${API_BASE_URL}/api/categories`)
        const data = await res.json()

        if (!res.ok || !data.ok) {
          throw new Error('Не удалось загрузить категории')
        }

        setCategories(data.categories || [])
      } catch (err) {
        console.error(err)
        setError('Не удалось загрузить категории')
      } finally {
        setLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoadingArticle(true)

        const res = await fetch(`${API_BASE_URL}/api/articles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = await res.json()

        if (!res.ok || !data.ok) {
          throw new Error('Не удалось загрузить статью')
        }

        const article = (data.articles || []).find(
          (item) => String(item.id) === String(id)
        )

        if (!article) {
          throw new Error('Статья не найдена')
        }

        setSlug(article.slug || '')
        setCategoryId(article.category?.id ? String(article.category.id) : '')
        setCoverImage(article.coverImage || '')
        setIsFeatured(!!article.isFeatured)

        const ruRes = await fetch(
          `${API_BASE_URL}/api/articles/${article.slug}?lang=ru`
        )
        const ruData = await ruRes.json()

        if (ruRes.ok && ruData.ok && ruData.article) {
          setRuTitle(ruData.article.translation?.title || '')
          setRuExcerpt(ruData.article.translation?.excerpt || '')
          setRuContent(ruData.article.translation?.content || '')
        }

        const uzRes = await fetch(
          `${API_BASE_URL}/api/articles/${article.slug}?lang=uz`
        )
        const uzData = await uzRes.json()

        if (uzRes.ok && uzData.ok && uzData.article) {
          setUzTitle(uzData.article.translation?.title || '')
          setUzExcerpt(uzData.article.translation?.excerpt || '')
          setUzContent(uzData.article.translation?.content || '')
        }
      } catch (err) {
        console.error(err)
        setError('Не удалось загрузить данные статьи')
      } finally {
        setLoadingArticle(false)
      }
    }

    loadArticle()
  }, [id, token])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError('')

      const payload = {
        slug,
        categoryId: Number(categoryId),
        coverImage: coverImage || null,
        isFeatured,
        ru: {
          title: ruTitle,
          excerpt: ruExcerpt,
          content: ruContent,
        },
        uz:
          uzTitle && uzContent
            ? {
                title: uzTitle,
                excerpt: uzExcerpt,
                content: uzContent,
              }
            : undefined,
      }

      const res = await fetch(`${API_BASE_URL}/api/articles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось обновить новость')
      }

      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setError('Не удалось обновить новость')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingArticle) {
    return (
      <main className="admin-dashboard-page">
        <div className="admin-dashboard-card">
          <p>Загрузка статьи...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-card">
        <div className="admin-dashboard-top">
          <div>
            <h1>Редактирование новости</h1>
            <p>Измените данные статьи</p>
          </div>

          <div className="admin-dashboard-actions">
            <Link to="/dashboard" className="admin-secondary-link">
              Назад
            </Link>
          </div>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label>
              <span>Slug</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </label>

            <label>
              <span>Категория</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                disabled={loadingCategories}
              >
                <option value="">Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameRu}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Путь к картинке</span>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="/Photos-for-Site/news.webp"
              />
            </label>

            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span>Показывать в главном</span>
            </label>
          </div>

          <div className="admin-form-section">
            <h2>Русская версия</h2>

            <label>
              <span>Заголовок</span>
              <input
                type="text"
                value={ruTitle}
                onChange={(e) => setRuTitle(e.target.value)}
                required
              />
            </label>

            <label>
              <span>Краткое описание</span>
              <textarea
                value={ruExcerpt}
                onChange={(e) => setRuExcerpt(e.target.value)}
                rows={3}
              />
            </label>

            <label>
              <span>Текст новости</span>
              <textarea
                value={ruContent}
                onChange={(e) => setRuContent(e.target.value)}
                rows={10}
                required
              />
            </label>
          </div>

          <div className="admin-form-section">
            <h2>Узбекская версия</h2>

            <label>
              <span>Заголовок</span>
              <input
                type="text"
                value={uzTitle}
                onChange={(e) => setUzTitle(e.target.value)}
              />
            </label>

            <label>
              <span>Краткое описание</span>
              <textarea
                value={uzExcerpt}
                onChange={(e) => setUzExcerpt(e.target.value)}
                rows={3}
              />
            </label>

            <label>
              <span>Текст новости</span>
              <textarea
                value={uzContent}
                onChange={(e) => setUzContent(e.target.value)}
                rows={10}
              />
            </label>
          </div>

          {error && <p className="admin-login-error">{error}</p>}

          <div className="admin-form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Сохраняем...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default AdminEditArticlePage