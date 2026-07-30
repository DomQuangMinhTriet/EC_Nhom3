// src/layouts/MainLayout.jsx
import Header from '../components/Header';
import Footer from '../components/Footer';

const MainLayout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, padding: '0 1rem' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
