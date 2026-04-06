import { useLanguage } from "../context/useLanguage"
import Seo from "../components/Seo"

function AboutPage() {
  const { language } = useLanguage()

  const content = {
    ru: {
      title: "О нас",
      description:
        "О проекте «Дайджест» — русскоязычном новостном ресурсе об Узбекистане и мире.",
      text: [
        "«Дайджест» — это сеть русскоязычных новостных платформ, включающая Telegram-канал, Instagram, YouTube и TikTok. Мы освещаем ключевые события в Узбекистане и мире, делая новости понятными и доступными каждому.",
        "Наша общая аудитория превышает 320 000 человек. Мы ежедневно публикуем актуальную информацию в удобном формате, чтобы вы могли быстро ориентироваться в происходящем и не тратить время на сложные формулировки и длинные тексты.",
        "Основная аудитория проекта — молодые люди от 18 до 35 лет: студенты, специалисты и активные пользователи социальных сетей. Мы создаём контент, адаптированный под современное цифровое потребление — быстро, ясно и по делу.",
        "Сегодня «Дайджест» — один из самых популярных русскоязычных новостных ресурсов в Узбекистане, который продолжает активно развиваться и расширять своё присутствие на разных платформах."
      ]
    },

    uz: {
      title: "Biz haqimizda",
      description:
        "«Dayjest» loyihasi haqida — O‘zbekiston va dunyo yangiliklarini yorituvchi rus tilidagi media resurs.",
      text: [
        "«Dayjest» — bu Telegram, Instagram, YouTube va TikTok platformalarini o‘z ichiga olgan rus tilidagi yangiliklar tarmog‘i. Biz O‘zbekiston va dunyodagi muhim voqealarni sodda va tushunarli tarzda yoritamiz.",
        "Loyihamizning umumiy auditoriyasi 320 000 dan ortiq foydalanuvchini tashkil etadi. Biz har kuni dolzarb yangiliklarni qulay formatda yetkazib beramiz, shunda siz ortiqcha vaqt sarflamasdan muhim voqealardan xabardor bo‘lasiz.",
        "Asosiy auditoriyamiz — 18–35 yoshdagi yoshlar: talabalar, mutaxassislar va ijtimoiy tarmoqlarda faol foydalanuvchilar. Kontent zamonaviy raqamli iste’molga moslashtirilgan — tez, aniq va tushunarli.",
        "Bugungi kunda «Dayjest» O‘zbekistondagi eng ommabop rus tilidagi yangiliklar resurslaridan biri bo‘lib, turli platformalarda faol rivojlanishda va o‘z faoliyatini kengaytirishda davom etmoqda."
      ]
    }
  }

  const t = content[language] || content.ru
  const canonical = `/${language}/about`

  return (
    <main className="main container about-page">
      <Seo
        title={t.title}
        description={t.description}
        canonical={canonical}
        image="/Icons/O-Nas.webp"
        type="article"
      />

      <section className="article-page">
        <div className="article-layout">
          <article className="article-main">
            <h1>{t.title}</h1>

            <img
              src="/Icons/O-Nas.webp"
              alt={t.title}
            />

            {t.text.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </article>
        </div>
      </section>
    </main>
  )
}

export default AboutPage