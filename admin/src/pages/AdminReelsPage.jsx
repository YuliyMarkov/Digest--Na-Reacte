import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE_URL = 'http://192.168.1.31:4000'

const initialForm = {
  id: null,
  titleRu: '',
  titleUz: '',
  previewImage: '',
  videoUrl: '',
  sortOrder: 0,
  isVisible: true,
}

function AdminReelsPage() {
  const token = localStorage.getItem('admin_token')

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(initialForm)

  const isEditing = form.id !== null

  const loadReels = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `${API_BASE_URL}/api/media?type=reel`
      )
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось загрузить reels')
      }

      setItems(data.mediaItems || [])
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить reels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReels()
  }, [])

  const resetForm = () => {
    setForm(initialForm)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleEdit = (item) => {
    setError('')
    setSuccess('')
    setForm({
      id: item.id,
      titleRu: item.titleRu || '',
      titleUz: item.titleUz || '',
      previewImage: item.previewImage || '',
      videoUrl: item.videoUrl || '',
      sortOrder: item.sortOrder ?? 0,
      isVisible: !!item.isVisible,
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Удалить этот reels?')
    if (!confirmed) return

    try {
      setError('')
      setSuccess('')

      const response = await fetch(`${API_BASE_URL}/api/media/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось удалить reels')
      }

      if (form.id === id) {
        resetForm()
      }

      setSuccess('Reels удалён')
      await loadReels()
    } catch (err) {
      console.error(err)
      setError('Не удалось удалить reels')
    }
  }

  const handleToggleVisible = async (item) => {
    try {
      setError('')
      setSuccess('')

      const payload = {
        titleRu: item.titleRu || '',
        titleUz: item.titleUz || '',
        type: 'reel',
        previewImage: item.previewImage || '',
        videoUrl: item.videoUrl || '',
        sortOrder: item.sortOrder ?? 0,
        isVisible: !item.isVisible,
      }

      const response = await fetch(`${API_BASE_URL}/api/media/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось обновить reels')
      }

      setSuccess('Видимость reels обновлена')
      await loadReels()
    } catch (err) {
      console.error(err)
      setError('Не удалось обновить reels')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const payload = {
        titleRu: form.titleRu.trim(),
        titleUz: form.titleUz.trim(),
        type: 'reel',
        previewImage: form.previewImage.trim(),
        videoUrl: form.videoUrl.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isVisible: !!form.isVisible,
      }

      if (!payload.previewImage || !payload.videoUrl) {
        throw new Error('Заполните ссылку на обложку и ссылку на reels')
      }

      const url = isEditing
        ? `${API_BASE_URL}/api/media/${form.id}`
        : `${API_BASE_URL}/api/media`

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'Не удалось сохранить reels')
      }

      setSuccess(isEditing ? 'Reels обновлён' : 'Reels добавлен')
      resetForm()
      await loadReels()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Не удалось сохранить reels')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-card">
        <div className="admin-dashboard-top">
          <div>
            <h1>Управление Reels</h1>
            <p>Добавляйте, редактируйте и скрывайте видео для главной страницы</p>
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
              <span>Заголовок RU</span>
              <input
                type="text"
                value={form.titleRu}
                onChange={(e) => handleChange('titleRu', e.target.value)}
                placeholder="Первый Reels"
              />
            </label>

            <label>
              <span>Заголовок UZ</span>
              <input
                type="text"
                value={form.titleUz}
                onChange={(e) => handleChange('titleUz', e.target.value)}
                placeholder="Birinchi Reels"
              />
            </label>

            <label>
              <span>Ссылка на обложку</span>
              <input
                type="text"
                value={form.previewImage}
                onChange={(e) => handleChange('previewImage', e.target.value)}
                placeholder="https://..."
                required
              />
            </label>

            <label>
              <span>Ссылка на reels / embed</span>
              <input
                type="text"
                value={form.videoUrl}
                onChange={(e) => handleChange('videoUrl', e.target.value)}
                placeholder="https://www.instagram.com/reel/.../embed"
                required
              />
            </label>

            <label>
              <span>Порядок</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => handleChange('sortOrder', e.target.value)}
              />
            </label>

            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(e) => handleChange('isVisible', e.target.checked)}
              />
              <span>Показывать на главной</span>
            </label>
          </div>

          {form.previewImage.trim() && (
            <div className="admin-form-section">
              <h2>Предпросмотр обложки</h2>
              <div className="admin-image-preview">
                <img
                  src={form.previewImage.trim()}
                  alt={form.titleRu || 'Preview'}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}

          {error && <p className="admin-login-error">{error}</p>}
          {success && <p className="admin-login-success">{success}</p>}

          <div className="admin-form-actions">
            <button type="submit" disabled={submitting}>
              {submitting
                ? 'Сохраняем...'
                : isEditing
                  ? 'Сохранить изменения'
                  : 'Добавить reels'}
            </button>

            {isEditing && (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={resetForm}
              >
                Отменить редактирование
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-dashboard-card" style={{ marginTop: '24px' }}>
        <div className="admin-dashboard-top">
          <div>
            <h2>Список Reels</h2>
            <p>Всего: {items.length}</p>
          </div>
        </div>

        {loading ? (
          <p>Загрузка reels...</p>
        ) : items.length === 0 ? (
          <p>Пока reels нет</p>
        ) : (
          <div className="admin-categories-group" style={{ display: 'grid', gap: '16px' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'grid',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {item.previewImage && (
                    <img
                      src={item.previewImage}
                      alt={item.titleRu || 'Reel'}
                      style={{
                        width: '120px',
                        height: '213px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <div style={{ minWidth: 0 }}>
                    <p><strong>ID:</strong> {item.id}</p>
                    <p><strong>RU:</strong> {item.titleRu || '—'}</p>
                    <p><strong>UZ:</strong> {item.titleUz || '—'}</p>
                    <p><strong>Порядок:</strong> {item.sortOrder}</p>
                    <p>
                      <strong>Статус:</strong>{' '}
                      {item.isVisible ? 'Показывается' : 'Скрыт'}
                    </p>
                    <p style={{ wordBreak: 'break-all' }}>
                      <strong>Видео:</strong> {item.videoUrl}
                    </p>
                  </div>
                </div>

                <div className="admin-form-actions">
                  <button type="button" onClick={() => handleEdit(item)}>
                    Редактировать
                  </button>

                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() => handleToggleVisible(item)}
                  >
                    {item.isVisible ? 'Скрыть' : 'Показать'}
                  </button>

                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => handleDelete(item.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default AdminReelsPage