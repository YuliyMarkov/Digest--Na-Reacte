import { Link } from 'react-router-dom'
import { useLanguage } from '../context/useLanguage'

function Footer() {
  const { language } = useLanguage()

  const uiText = {
    ru: {
      copyright: '© 2026 Дайджест. Все права защищены.',
      navLabel: 'Навигация в подвале',
      about: 'О нас',
      privacy: 'Политика конфиденциальности',
      contacts: 'Контакты',
    },
    uz: {
      copyright: '© 2026 Dayjest. Barcha huquqlar himoyalangan.',
      navLabel: 'Footer navigatsiyasi',
      about: 'Biz haqimizda',
      privacy: 'Maxfiylik siyosati',
      contacts: 'Kontaktlar',
    },
  }

  const t = uiText[language] || uiText.ru

  return (
    <footer className="footer">
      <div className="container footer-container">
        <p>{t.copyright}</p>

        <nav className="footer-nav" aria-label={t.navLabel}>
          <Link to={`/${language}/about`}>{t.about}</Link>
          <Link to={`/${language}/privacy`}>{t.privacy}</Link>
          <Link to={`/${language}/contacts`}>{t.contacts}</Link>
        </nav>

        <div className="footer-socials">
          <a
            href="https://t.me/+rI4mVrzYphxkZGYy"
            className="footer-social telegram"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
          ></a>
          <a
            href="https://www.instagram.com/digest.uzbekistan/"
            className="footer-social instagram"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          ></a>
          <a
            href="https://www.youtube.com/@digest.uzbekistan"
            className="footer-social youtube"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
          ></a>
        </div>
      </div>
    </footer>
  )
}

export default Footer