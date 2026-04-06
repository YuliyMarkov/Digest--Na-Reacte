import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/useLanguage'
import { useCategories } from '../hooks/useCategories'

function Header() {
  const { language, setLanguage } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  const { categories } = useCategories()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [desktopSearchQuery, setDesktopSearchQuery] = useState('')
  const [mobileSearchQuery, setMobileSearchQuery] = useState('')
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  const burgerBtnRef = useRef(null)
  const navRef = useRef(null)

  const uiText = {
    ru: {
      homeLabel: 'Дайджест — на главную',
      socialsTitle: 'Мы в соцсетях',
      searchPlaceholder: 'Поиск по сайту...',
      searchButton: 'Поиск',
      searchToggle: 'Открыть поиск',
      navLabel: 'Основная навигация',
      langGroup: 'Переключение языка',
      themeLabel: 'Переключить тему',
      burgerLabel: 'Открыть меню',
    },
    uz: {
      homeLabel: 'Dayjest — bosh sahifaga',
      socialsTitle: 'Biz ijtimoiy tarmoqlarda',
      searchPlaceholder: 'Sayt bo‘ylab qidirish...',
      searchButton: 'Qidirish',
      searchToggle: 'Qidiruvni ochish',
      navLabel: 'Asosiy navigatsiya',
      langGroup: 'Tilni almashtirish',
      themeLabel: 'Mavzuni almashtirish',
      burgerLabel: 'Menyuni ochish',
    },
  }

  const t = uiText[language] || uiText.ru

  const visibleCategories = categories.filter((category) => category.isVisible)

  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark-theme')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkTheme])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isMenuOpen) return
      if (window.innerWidth > 700) return

      const clickedInsideNav = navRef.current?.contains(event.target)
      const clickedBurger = burgerBtnRef.current?.contains(event.target)

      if (!clickedInsideNav && !clickedBurger) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isMenuOpen])

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev)
  }

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev)
  }

  const handleThemeChange = () => {
    setIsDarkTheme((prev) => !prev)
  }

  const handleLangChange = (selectedLang) => {
    if (selectedLang === language) return

    setLanguage(selectedLang)

    const segments = location.pathname.split('/').filter(Boolean)

    if (segments.length === 0) {
      navigate(`/${selectedLang}`)
      return
    }

    if (segments[0] === 'ru' || segments[0] === 'uz') {
      segments[0] = selectedLang
      navigate(`/${segments.join('/')}`)
      return
    }

    navigate(`/${selectedLang}${location.pathname}`)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const submitSearch = (rawQuery, options = {}) => {
    const query = rawQuery.trim()

    if (!query) return

    navigate(`/${language}/search?q=${encodeURIComponent(query)}`)

    if (options.closeMenu) {
      setIsMenuOpen(false)
    }

    if (options.closeDesktopSearch) {
      setIsSearchOpen(false)
    }
  }

  const handleDesktopSearchSubmit = (e) => {
    e.preventDefault()
    submitSearch(desktopSearchQuery, { closeDesktopSearch: true })
  }

  const handleMobileSearchSubmit = (e) => {
    e.preventDefault()
    submitSearch(mobileSearchQuery, { closeMenu: true })
  }

  return (
    <header className="header">
      <div className="container header-container">
        <div className="logo">
          <Link to={`/${language}`} aria-label={t.homeLabel} onClick={closeMenu}>
            <img src="/New_Logo.webp" alt="Дайджест Logo" />
          </Link>
        </div>

        <nav
          ref={navRef}
          className={`nav ${isMenuOpen ? 'active' : ''}`}
          id="navMenu"
          aria-label={t.navLabel}
        >
          {visibleCategories.map((category) => (
            <Link
              key={category.id}
              to={`/${language}/category/${category.slug}`}
              onClick={closeMenu}
            >
              {language === 'uz' ? category.nameUz : category.nameRu}
            </Link>
          ))}

          <div className="mobile-socials-block" aria-label={t.socialsTitle}>
            <div className="mobile-socials-title">{t.socialsTitle}</div>

            <div className="mobile-socials-grid">
              <a
                href="https://t.me/+rI4mVrzYphxkZGYy"
                className="mobile-social-card"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
              >
                <span className="mobile-social-card-icon telegram"></span>
                <span className="mobile-social-card-text">Telegram</span>
              </a>

              <a
                href="https://www.instagram.com/digest.uzbekistan/"
                className="mobile-social-card"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <span className="mobile-social-card-icon instagram"></span>
                <span className="mobile-social-card-text">Instagram</span>
              </a>

              <a
                href="https://www.youtube.com/@digest.uzbekistan"
                className="mobile-social-card"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
              >
                <span className="mobile-social-card-icon youtube"></span>
                <span className="mobile-social-card-text">YouTube</span>
              </a>
            </div>
          </div>

          <form
            className="mobile-search-form"
            id="mobileSearchForm"
            role="search"
            onSubmit={handleMobileSearchSubmit}
          >
            <div className="mobile-search-row">
              <input
                type="search"
                id="mobileSearchInput"
                className="mobile-search-input"
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
              />
              <button type="submit" className="mobile-search-btn">
                {t.searchButton}
              </button>
            </div>
          </form>
        </nav>

        <div className="header-actions">
          <button
            className={`search-toggle ${isSearchOpen ? 'active' : ''}`}
            id="searchToggle"
            type="button"
            aria-label={t.searchToggle}
            aria-expanded={isSearchOpen}
            aria-controls="desktopSearchBar"
            onClick={toggleSearch}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
            </svg>
          </button>

          <div className="socials" aria-label="Социальные сети">
            <a
              href="https://t.me/+rI4mVrzYphxkZGYy"
              className="social telegram"
              aria-label="Telegram"
              target="_blank"
              rel="noopener noreferrer"
            ></a>
            <a
              href="https://www.instagram.com/digest.uzbekistan/"
              className="social instagram"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            ></a>
            <a
              href="https://www.youtube.com/@digest.uzbekistan"
              className="social youtube"
              aria-label="YouTube"
              target="_blank"
              rel="noopener noreferrer"
            ></a>
          </div>

          <div
            className="lang-switch"
            aria-label={t.langGroup}
            role="group"
          >
            <button
              className={`lang-btn ${language === 'ru' ? 'active' : ''}`}
              type="button"
              data-lang="ru"
              aria-label="Русский"
              aria-pressed={language === 'ru'}
              onClick={() => handleLangChange('ru')}
            >
              <span className="lang-btn-inner">
                <span className="lang-flag-img">
                  <img src="/Icons/Flag_RU.webp" alt="RU" />
                </span>
                <span className="lang-text">RU</span>
              </span>
            </button>

            <button
              className={`lang-btn ${language === 'uz' ? 'active' : ''}`}
              type="button"
              data-lang="uz"
              aria-label="O‘zbekcha"
              aria-pressed={language === 'uz'}
              onClick={() => handleLangChange('uz')}
            >
              <span className="lang-btn-inner">
                <span className="lang-flag-img">
                  <img src="/Icons/Flag_UZ.webp" alt="UZ" />
                </span>
                <span className="lang-text">UZ</span>
              </span>
            </button>
          </div>

          <div className="theme-switch-wrapper">
            <label className="theme-switch" aria-label={t.themeLabel}>
              <input
                type="checkbox"
                id="theme-toggle"
                checked={isDarkTheme}
                onChange={handleThemeChange}
              />
              <span className="slider"></span>
            </label>
          </div>

          <button
            ref={burgerBtnRef}
            className={`burger ${isMenuOpen ? 'active' : ''}`}
            id="burgerBtn"
            type="button"
            aria-label={t.burgerLabel}
            aria-expanded={isMenuOpen}
            aria-controls="navMenu"
            onClick={toggleMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      <div
        className={`desktop-search-wrap ${isSearchOpen ? 'active' : ''}`}
        id="desktopSearchBar"
      >
        <div className="container">
          <form
            className="desktop-search-form"
            id="desktopSearchForm"
            role="search"
            onSubmit={handleDesktopSearchSubmit}
          >
            <input
              type="search"
              id="desktopSearchInput"
              className="desktop-search-input"
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              value={desktopSearchQuery}
              onChange={(e) => setDesktopSearchQuery(e.target.value)}
            />
            <button type="submit" className="desktop-search-btn">
              {t.searchButton}
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}

export default Header