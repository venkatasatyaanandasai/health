import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentDots,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import "../Styles/Navbar.css";
import { Link } from "react-router-dom";

function Navbar({ onOpenChat }) {
  const [nav, setNav] = useState(false);
  const mobileNavButton = useRef(null);

  const openNav = () => {
    setNav(!nav);
  };

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setNav(false);
        mobileNavButton.current?.focus();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className="navbar-section">
      <h1 className="navbar-title">
        <Link to="/">
          Health <span className="navbar-sign">+</span>
        </Link>
      </h1>

      {/* Desktop */}
      <ul className="navbar-items">
        <li>
          <Link to="/" className="navbar-links">
            Home
          </Link>
        </li>
        <li>
          <a href="#services" className="navbar-links">
            Services
          </a>
        </li>
        <li>
          <a href="#about" className="navbar-links">
            About
          </a>
        </li>
        <li>
          <a href="#reviews" className="navbar-links">
            Reviews
          </a>
        </li>
        <li>
          <a href="#doctors" className="navbar-links">
            Doctors
          </a>
        </li>
      </ul>

      <button
        className="navbar-btn"
        type="button"
        onClick={onOpenChat}
        aria-label="Open live chat from navigation"
      >
        <FontAwesomeIcon icon={faCommentDots} /> Live Chat
      </button>

      {/* Mobile */}
      <nav
        id="mobile-navigation"
        className={`mobile-navbar ${nav ? "open-nav" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!nav}
      >
        <button
          type="button"
          onClick={() => setNav(false)}
          className="mobile-navbar-close"
          aria-label="Close navigation menu"
          tabIndex={nav ? 0 : -1}
        >
          <FontAwesomeIcon icon={faXmark} className="hamb-icon" />
        </button>

        <ul className="mobile-navbar-links">
          <li>
            <Link onClick={() => setNav(false)} to="/" tabIndex={nav ? 0 : -1}>
              Home
            </Link>
          </li>
          <li>
            <a onClick={() => setNav(false)} href="#services" tabIndex={nav ? 0 : -1}>
              Services
            </a>
          </li>
          <li>
            <a onClick={() => setNav(false)} href="#about" tabIndex={nav ? 0 : -1}>
              About
            </a>
          </li>
          <li>
            <a onClick={() => setNav(false)} href="#reviews" tabIndex={nav ? 0 : -1}>
              Reviews
            </a>
          </li>
          <li>
            <a onClick={() => setNav(false)} href="#doctors" tabIndex={nav ? 0 : -1}>
              Doctors
            </a>
          </li>
          <li>
            <a onClick={() => setNav(false)} href="#contact" tabIndex={nav ? 0 : -1}>
              Contact
            </a>
          </li>
          <li>
            <Link
              className="mobile-appointment-link"
              onClick={() => setNav(false)}
              to="/appointment"
              tabIndex={nav ? 0 : -1}
            >
              Book an appointment
            </Link>
          </li>
        </ul>
      </nav>

      {/* Hamburger Icon */}
      <button
        ref={mobileNavButton}
        type="button"
        className="mobile-nav"
        aria-label="Open navigation menu"
        aria-expanded={nav}
        aria-controls="mobile-navigation"
        onClick={openNav}
      >
        <FontAwesomeIcon icon={faBars} className="hamb-icon" />
      </button>
    </div>
  );
}

export default Navbar;