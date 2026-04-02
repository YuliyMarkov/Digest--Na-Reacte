import { useLanguage } from "../context/useLanguage"
import Seo from "../components/Seo"

function ContactsPage() {
  const { language } = useLanguage()

  const content = {
    ru: {
      title: "Контакты",
      description:
        "Контакты редакции «Дайджест», рекламные размещения, Telegram и ссылки на соцсети.",
      blocks: [
        {
          title: "Связь с редакцией",
          items: [
            {
              label: "Email",
              text: "info@digestnews.uz",
              href: "mailto:info@digestnews.uz",
            },
          ],
        },
        {
          title: "По вопросам рекламы",
          items: [
            {
              label: "Telegram",
              text: "@digest_media",
              href: "https://t.me/digest_media",
            },
          ],
        },
        {
          title: "Предложить новость",
          items: [
            {
              label: "Telegram-бот",
              text: "@WriteUsAnythingBot",
              href: "https://t.me/WriteUsAnythingBot",
            },
          ],
        },
        {
          title: "Мы в соцсетях",
          items: [
            {
              label: "Telegram",
              text: "t.me/digest.uzbekistan",
              href: "https://t.me/+rI4mVrzYphxkZGYy",
            },
            {
              label: "Instagram",
              text: "instagram.com/digest.uzbekistan",
              href: "https://www.instagram.com/digest.uzbekistan",
            },
            {
              label: "YouTube",
              text: "youtube.com/@digest.uzbekistan",
              href: "https://www.youtube.com/@digest.uzbekistan",
            },
          ],
        },
      ],
    },

    uz: {
      title: "Kontaktlar",
      description:
        "«Dayjest» tahririyati kontaktlari, reklama bo‘yicha aloqa, Telegram va ijtimoiy tarmoqlar havolalari.",
      blocks: [
        {
          title: "Tahririyat bilan bog‘lanish",
          items: [
            {
              label: "Email",
              text: "info@digestnews.uz",
              href: "mailto:info@digestnews.uz",
            },
          ],
        },
        {
          title: "Reklama masalalari bo‘yicha",
          items: [
            {
              label: "Telegram",
              text: "@digest_media",
              href: "https://t.me/digest_media",
            },
          ],
        },
        {
          title: "Yangilik yuborish",
          items: [
            {
              label: "Telegram-bot",
              text: "@WriteUsAnythingBot",
              href: "https://t.me/WriteUsAnythingBot",
            },
          ],
        },
        {
          title: "Ijtimoiy tarmoqlardagi sahifalarimiz",
          items: [
            {
              label: "Telegram",
              text: "t.me/digest.uzbekistan",
              href: "https://t.me/+rI4mVrzYphxkZGYy",
            },
            {
              label: "Instagram",
              text: "instagram.com/digest.uzbekistan",
              href: "https://www.instagram.com/digest.uzbekistan",
            },
            {
              label: "YouTube",
              text: "youtube.com/@digest.uzbekistan",
              href: "https://www.youtube.com/@digest.uzbekistan",
            },
          ],
        },
      ],
    },
  }

  const t = content[language] || content.ru
  const canonical = `/${language}/contacts`

  return (
    <main className="main container about-page">
      <Seo
        title={t.title}
        description={t.description}
        canonical={canonical}
        image="/Icons/Kontakti.webp"
        type="article"
      />

      <section className="article-page">
        <div className="article-layout">
          <article className="article-main">
            <h1>{t.title}</h1>

            <img
              src="/Icons/Kontakti.webp"
              alt={t.title}
            />

            {t.blocks.map((block, index) => (
              <div key={index} style={{ marginBottom: "22px" }}>
                <h3 style={{ marginBottom: "8px" }}>{block.title}</h3>

                {block.items.map((item, i) => (
                  <p key={i}>
                    <strong>{item.label}:</strong>{" "}
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        item.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      style={{ color: "#ff1212", textDecoration: "none" }}
                    >
                      {item.text}
                    </a>
                  </p>
                ))}
              </div>
            ))}
          </article>
        </div>
      </section>
    </main>
  )
}

export default ContactsPage