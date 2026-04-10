import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import RichTextEditor from "../components/RichTextEditor";

const API_BASE_URL = "http://localhost:4000";

function generateSlug(text = "") {
  return text
    .toLowerCase()
    .replace(/а/g, "a")
    .replace(/б/g, "b")
    .replace(/в/g, "v")
    .replace(/г/g, "g")
    .replace(/д/g, "d")
    .replace(/е/g, "e")
    .replace(/ё/g, "e")
    .replace(/ж/g, "zh")
    .replace(/з/g, "z")
    .replace(/и/g, "i")
    .replace(/й/g, "y")
    .replace(/к/g, "k")
    .replace(/л/g, "l")
    .replace(/м/g, "m")
    .replace(/н/g, "n")
    .replace(/о/g, "o")
    .replace(/п/g, "p")
    .replace(/р/g, "r")
    .replace(/с/g, "s")
    .replace(/т/g, "t")
    .replace(/у/g, "u")
    .replace(/ф/g, "f")
    .replace(/х/g, "h")
    .replace(/ц/g, "ts")
    .replace(/ч/g, "ch")
    .replace(/ш/g, "sh")
    .replace(/щ/g, "sch")
    .replace(/ы/g, "y")
    .replace(/э/g, "e")
    .replace(/ю/g, "yu")
    .replace(/я/g, "ya")
    .replace(/ъ|ь/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function AdminEditArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(true);
  const [categoryIds, setCategoryIds] = useState([]);
  const [coverImage, setCoverImage] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  const [ruTitle, setRuTitle] = useState("");
  const [ruExcerpt, setRuExcerpt] = useState("");
  const [ruContent, setRuContent] = useState("");
  const [ruSeoTitle, setRuSeoTitle] = useState("");
  const [ruSeoDescription, setRuSeoDescription] = useState("");
  const [ruTelegramEmbedUrl, setRuTelegramEmbedUrl] = useState("");

  const [uzTitle, setUzTitle] = useState("");
  const [uzExcerpt, setUzExcerpt] = useState("");
  const [uzContent, setUzContent] = useState("");
  const [uzSeoTitle, setUzSeoTitle] = useState("");
  const [uzSeoDescription, setUzSeoDescription] = useState("");
  const [uzTelegramEmbedUrl, setUzTelegramEmbedUrl] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);

        const res = await fetch(`${API_BASE_URL}/api/categories`);
        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error("Не удалось загрузить категории");
        }

        setCategories(data.categories || []);
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить категории");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoadingArticle(true);
        setError("");

        const res = await fetch(`${API_BASE_URL}/api/articles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error("Не удалось загрузить статью");
        }

        const article = (data.articles || []).find(
          (item) => String(item.id) === String(id)
        );

        if (!article) {
          throw new Error("Статья не найдена");
        }

        setSlug(article.slug || "");
        setIsSlugEdited(true);
        setCategoryIds(
          Array.isArray(article.categoryIds)
            ? article.categoryIds.map(Number).filter(Boolean)
            : article.category?.id
              ? [Number(article.category.id)]
              : []
        );
        setCoverImage(article.coverImage || "");
        setIsFeatured(!!article.isFeatured);

        const ruRes = await fetch(
          `${API_BASE_URL}/api/articles/${article.slug}?lang=ru`
        );
        const ruData = await ruRes.json();

        if (ruRes.ok && ruData.ok && ruData.article) {
          setRuTitle(ruData.article.translation?.title || "");
          setRuExcerpt(ruData.article.translation?.excerpt || "");
          setRuContent(ruData.article.translation?.content || "");
          setRuSeoTitle(ruData.article.translation?.seoTitle || "");
          setRuSeoDescription(ruData.article.translation?.seoDescription || "");
          setRuTelegramEmbedUrl(
            ruData.article.translation?.telegramEmbedUrl || ""
          );
        }

        const uzRes = await fetch(
          `${API_BASE_URL}/api/articles/${article.slug}?lang=uz`
        );
        const uzData = await uzRes.json();

        if (uzRes.ok && uzData.ok && uzData.article) {
          setUzTitle(uzData.article.translation?.title || "");
          setUzExcerpt(uzData.article.translation?.excerpt || "");
          setUzContent(uzData.article.translation?.content || "");
          setUzSeoTitle(uzData.article.translation?.seoTitle || "");
          setUzSeoDescription(uzData.article.translation?.seoDescription || "");
          setUzTelegramEmbedUrl(
            uzData.article.translation?.telegramEmbedUrl || ""
          );
        }
      } catch (err) {
        console.error(err);
        setError("Не удалось загрузить данные статьи");
      } finally {
        setLoadingArticle(false);
      }
    };

    loadArticle();
  }, [id, token]);

  useEffect(() => {
    if (!isSlugEdited) {
      setSlug(generateSlug(ruTitle));
    }
  }, [ruTitle, isSlugEdited]);

  const handleCategoryToggle = (categoryId) => {
    setCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((itemId) => itemId !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (!categoryIds.length) {
        throw new Error("Выберите хотя бы одну категорию");
      }

      const payload = {
        slug,
        categoryIds,
        coverImage: coverImage || null,
        isFeatured,
        ru: {
          title: ruTitle,
          excerpt: ruExcerpt,
          content: ruContent,
          seoTitle: ruSeoTitle,
          seoDescription: ruSeoDescription,
          telegramEmbedUrl: ruTelegramEmbedUrl.trim() || null,
        },
        uz:
          uzTitle && uzContent
            ? {
                title: uzTitle,
                excerpt: uzExcerpt,
                content: uzContent,
                seoTitle: uzSeoTitle,
                seoDescription: uzSeoDescription,
                telegramEmbedUrl: uzTelegramEmbedUrl.trim() || null,
              }
            : undefined,
      };

      const res = await fetch(`${API_BASE_URL}/api/articles/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Не удалось обновить новость");
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Не удалось обновить новость");
    } finally {
      setSubmitting(false);
    }
  };

  const normalizedPreviewUrl = coverImage.trim();

  if (loadingArticle) {
    return (
      <main className="admin-dashboard-page">
        <div className="admin-dashboard-card">
          <p>Загрузка статьи...</p>
        </div>
      </main>
    );
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
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugEdited(true);
                }}
                required
              />
            </label>

            <div>
              <span>Категории</span>
              <div className="admin-categories-group">
                {loadingCategories ? (
                  <p>Загрузка категорий...</p>
                ) : (
                  categories.map((category) => (
                    <label key={category.id} className="admin-checkbox">
                      <input
                        type="checkbox"
                        checked={categoryIds.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                      />
                      <span>{category.nameRu}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label>
                <span>Ссылка на картинку</span>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://example.com/news.webp"
                />
              </label>

              {normalizedPreviewUrl && (
                <div className="admin-image-preview">
                  <img
                    src={normalizedPreviewUrl}
                    alt="Предпросмотр"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

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

            <div className="admin-form-field">
              <span>Текст новости</span>
              <RichTextEditor
                value={ruContent}
                onChange={setRuContent}
                placeholder="Введите текст русской версии..."
              />
            </div>

            <label>
              <span>Telegram embed URL</span>
              <input
                type="text"
                value={ruTelegramEmbedUrl}
                onChange={(e) => setRuTelegramEmbedUrl(e.target.value)}
                placeholder="https://t.me/username/123?embed=1"
              />
            </label>

            <label>
              <span>SEO title</span>
              <input
                type="text"
                value={ruSeoTitle}
                onChange={(e) => setRuSeoTitle(e.target.value)}
                placeholder="Заголовок для поисковиков"
              />
            </label>

            <label>
              <span>SEO description</span>
              <textarea
                value={ruSeoDescription}
                onChange={(e) => setRuSeoDescription(e.target.value)}
                rows={3}
                placeholder="Описание для поисковиков"
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

            <div className="admin-form-field">
              <span>Текст новости</span>
              <RichTextEditor
                value={uzContent}
                onChange={setUzContent}
                placeholder="Matnni kiriting..."
              />
            </div>

            <label>
              <span>Telegram embed URL</span>
              <input
                type="text"
                value={uzTelegramEmbedUrl}
                onChange={(e) => setUzTelegramEmbedUrl(e.target.value)}
                placeholder="https://t.me/username/123?embed=1"
              />
            </label>

            <label>
              <span>SEO title</span>
              <input
                type="text"
                value={uzSeoTitle}
                onChange={(e) => setUzSeoTitle(e.target.value)}
                placeholder="Qidiruv tizimlari uchun sarlavha"
              />
            </label>

            <label>
              <span>SEO description</span>
              <textarea
                value={uzSeoDescription}
                onChange={(e) => setUzSeoDescription(e.target.value)}
                rows={3}
                placeholder="Qidiruv tizimlari uchun tavsif"
              />
            </label>
          </div>

          {error && <p className="admin-login-error">{error}</p>}

          <div className="admin-form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Сохраняем..." : "Сохранить изменения"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default AdminEditArticlePage;