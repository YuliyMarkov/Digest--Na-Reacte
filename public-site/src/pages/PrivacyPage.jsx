import { useLanguage } from "../context/useLanguage"
import Seo from "../components/Seo"

function PrivacyPage() {
  const { language } = useLanguage()

  const content = {
    ru: {
      title: "Политика конфиденциальности",
      description:
        "Политика конфиденциальности сайта «Дайджест»: обработка данных, cookie, реклама и сторонние сервисы.",
    },
    uz: {
      title: "Maxfiylik siyosati",
      description:
        "«Dayjest» saytining maxfiylik siyosati: ma’lumotlarni qayta ishlash, cookie, reklama va uchinchi tomon servislar.",
    },
  }

  const t = content[language] || content.ru
  const isUZ = language === "uz"
  const canonical = `/${language}/privacy`

  return (
    <main className="main container about-page">
      <Seo
        title={t.title}
        description={t.description}
        canonical={canonical}
        image="/Icons/privacy.webp"
        type="article"
      />

      <section className="article-page">
        <div className="article-layout">
          <article className="article-main">
            <img src="/Icons/privacy.webp" alt={t.title} />

            <h1>{t.title}</h1>

            {!isUZ ? (
              <>
                <p>
                  Настоящая Политика конфиденциальности определяет порядок обработки и защиты информации
                  о пользователях сайта{" "}
                  <a href="https://digestnews.uz" target="_blank" rel="noopener noreferrer">
                    https://digestnews.uz
                  </a>.
                </p>

                <p>Используя Сайт, пользователь выражает согласие с настоящей Политикой.</p>

                <h2>1. Общие положения</h2>
                <p>
                  Сайт «Дайджест» является информационным ресурсом, публикующим новости и материалы о событиях
                  в Узбекистане и мире.
                </p>
                <p>На момент публикации сайт не зарегистрирован как средство массовой информации.</p>
                <p>Настоящая Политика применяется только к данному сайту.</p>

                <h2>2. Сбор информации</h2>
                <p>При использовании сайта автоматически собираются:</p>
                <ul>
                  <li>IP-адрес</li>
                  <li>данные о браузере и устройстве</li>
                  <li>посещённые страницы</li>
                  <li>время посещения</li>
                  <li>файлы cookie</li>
                </ul>

                <p>
                  Пользователь может добровольно предоставить данные через формы или сторонние сервисы
                  (например, Telegram).
                </p>

                <h2>3. Использование информации</h2>
                <ul>
                  <li>обеспечение работы сайта</li>
                  <li>анализ посещаемости</li>
                  <li>улучшение пользовательского опыта</li>
                  <li>показ рекламы</li>
                  <li>предотвращение сбоев</li>
                </ul>

                <h2>4. Реклама и Google AdSense</h2>
                <p>
                  Сайт может использовать Google AdSense. Пользователь может отключить персонализацию:{" "}
                  <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
                    adssettings.google.com
                  </a>
                </p>

                <h2>5. Файлы cookie</h2>
                <p>Сайт использует cookie для аналитики и персонализации.</p>

                <h2>6. Сторонние сервисы</h2>
                <ul>
                  <li>Google Analytics</li>
                  <li>Google AdSense</li>
                  <li>Telegram, Instagram, YouTube</li>
                </ul>

                <h2>7. Передача данных</h2>
                <p>Данные не передаются третьим лицам, кроме предусмотренных законом случаев.</p>

                <h2>8. Защита данных</h2>
                <p>Администрация принимает меры для защиты информации.</p>

                <h2>9. Права пользователя</h2>
                <ul>
                  <li>получать информацию о данных</li>
                  <li>требовать удаление</li>
                  <li>отключить cookie</li>
                  <li>прекратить использование сайта</li>
                </ul>

                <h2>10. Изменения политики</h2>
                <p>Политика может обновляться без уведомления.</p>

                <h2>11. Контакты</h2>
                <p>
                  Email: <a href="mailto:info@digestnews.uz">info@digestnews.uz</a>
                </p>
                <p>
                  Telegram:{" "}
                  <a href="https://t.me/digest_media" target="_blank" rel="noopener noreferrer">
                    @digest_media
                  </a>
                </p>

                <h2>12. Согласие</h2>
                <p>Используя сайт, пользователь подтверждает согласие с политикой.</p>
              </>
            ) : (
              <>
                <p>
                  Ushbu Maxfiylik siyosati{" "}
                  <a href="https://digestnews.uz" target="_blank" rel="noopener noreferrer">
                    https://digestnews.uz
                  </a>{" "}
                  sayt foydalanuvchilari haqidagi ma’lumotlarni qayta ishlash va himoya qilish tartibini belgilaydi.
                </p>

                <p>Saytdan foydalanish orqali foydalanuvchi ushbu siyosatga rozilik bildiradi.</p>

                <h2>1. Umumiy qoidalar</h2>
                <p>
                  «Dayjest» — O‘zbekiston va dunyodagi voqealar haqida axborot beruvchi yangiliklar platformasi.
                </p>
                <p>Hozirda sayt OAV sifatida ro‘yxatdan o‘tmagan.</p>

                <h2>2. Ma’lumotlarni yig‘ish</h2>
                <p>Saytdan foydalanganda quyidagi ma’lumotlar avtomatik yig‘iladi:</p>
                <ul>
                  <li>IP-manzil</li>
                  <li>brauzer va qurilma ma’lumotlari</li>
                  <li>ko‘rilgan sahifalar</li>
                  <li>kirish vaqti</li>
                  <li>cookie fayllar</li>
                </ul>

                <h2>3. Ma’lumotlardan foydalanish</h2>
                <ul>
                  <li>sayt ishlashini ta’minlash</li>
                  <li>tahlil va statistika</li>
                  <li>foydalanuvchi tajribasini yaxshilash</li>
                  <li>reklama ko‘rsatish</li>
                </ul>

                <h2>4. Reklama va Google AdSense</h2>
                <p>
                  Google reklama xizmatlari ishlatilishi mumkin. Sozlamalar:{" "}
                  <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
                    adssettings.google.com
                  </a>
                </p>

                <h2>5. Cookie fayllar</h2>
                <p>Cookie foydalanuvchi sozlamalari va tahlil uchun ishlatiladi.</p>

                <h2>6. Uchinchi tomon servislar</h2>
                <ul>
                  <li>Google Analytics</li>
                  <li>Google AdSense</li>
                  <li>Telegram, Instagram, YouTube</li>
                </ul>

                <h2>7. Ma’lumotlarni uzatish</h2>
                <p>Ma’lumotlar uchinchi shaxslarga berilmaydi, qonuniy holatlar bundan mustasno.</p>

                <h2>8. Himoya</h2>
                <p>Ma’lumotlar himoyasi uchun zarur choralar ko‘riladi.</p>

                <h2>9. Foydalanuvchi huquqlari</h2>
                <ul>
                  <li>ma’lumotlar haqida bilish</li>
                  <li>o‘chirishni talab qilish</li>
                  <li>cookie’ni o‘chirish</li>
                </ul>

                <h2>10. O‘zgarishlar</h2>
                <p>Siyosat yangilanib turishi mumkin.</p>

                <h2>11. Aloqa</h2>
                <p>
                  Email: <a href="mailto:info@digestnews.uz">info@digestnews.uz</a>
                </p>
                <p>
                  Telegram:{" "}
                  <a href="https://t.me/digest_media" target="_blank" rel="noopener noreferrer">
                    @digest_media
                  </a>
                </p>

                <h2>12. Rozilik</h2>
                <p>Saytdan foydalanish orqali foydalanuvchi siyosatga rozilik bildiradi.</p>
              </>
            )}
          </article>
        </div>
      </section>
    </main>
  )
}

export default PrivacyPage