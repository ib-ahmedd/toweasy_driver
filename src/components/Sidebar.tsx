'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const Sidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Available Jobs', href: '/active' },
    { name: 'Current Job', href: '/current' },
    { name: 'Job History', href: '/history' },
  ];

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button 
        className={`sidebar-toggle ${isOpen ? 'open' : ''}`} 
        onClick={handleToggle}
        aria-label="Toggle Navigation"
        aria-expanded={isOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <aside className={`driver-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>TowEasy Driver</h3>
          <button 
            className="sidebar-close" 
            onClick={() => setIsOpen(false)}
            aria-label="Close Navigation"
          >
            &times;
          </button>
        </div>
        <nav>
          <ul>
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={pathname === item.href ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(false)}
      ></div>
    </>
  );
};

export default Sidebar;
