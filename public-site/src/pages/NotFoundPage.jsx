import { Link } from "react-router-dom";
import { useLanguage } from "../context/useLanguage";
import Seo from "../components/Seo";

function NotFoundPage() {
  const { language } = useLanguage();

  const content = {
    ru: {
      title: "404 — Страница не найдена",
      description:
        "Запрашиваемая страница не найдена. Вернитесь на главную страницу сайта «Дайджест».",
      text: [
        "Похоже, такой страницы больше нет, ссылка устарела или адрес был введён с ошибкой.",
        "Вы можете вернуться на главную страницу и продолжить просмотр свежих новостей Узбекистана и мира.",
      ],
      backHome: "Вернуться на главную",
      imageAlt: "Страница не найдена",
    },

    uz: {
      title: "404 — Sahifa topilmadi",
      description:
        "So‘ralgan sahifa topilmadi. «Dayjest» saytining bosh sahifasiga qayting.",
      text: [
        "Ko‘rinishidan, bunday sahifa endi mavjud emas, havola eskirgan yoki manzil xato kiritilgan.",
        "Siz bosh sahifaga qaytib, O‘zbekiston va dunyo yangiliklarini ko‘rishda davom etishingiz mumkin.",
      ],
      backHome: "Bosh sahifaga qaytish",
      imageAlt: "Sahifa topilmadi",
    },
  };

  const t = content[language] || content.ru;
  const canonical = `/${language}/404`;

  return (
    <main className="main container about-page not-found-page">
      <Seo
        title={t.title}
        description={t.description}
        canonical={canonical}
        image="/Icons/404.webp"
        type="website"
      />

      <section className="article-page">
        <div className="article-layout">
          <article className="article-main not-found-card">
            <h1>{t.title}</h1>

            {/* 👇 ВАЖНО: две картинки */}
            <img
              src="/Icons/404.webp"
              alt={t.imageAlt}
              className="not-found-img light"
            />

            <img
              src="/Icons/404_Dark.webp"
              alt={t.imageAlt}
              className="not-found-img dark"
            />

            {t.text.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}

            <Link to={`/${language}`} className="not-found-button">
              {t.backHome}
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}

export default NotFoundPage;