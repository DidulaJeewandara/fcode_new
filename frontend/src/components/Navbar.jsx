import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
      <Link to="/" className="text-xl font-bold text-linkedin">
        LinkedClone
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/search" className="text-sm font-medium text-gray-700 hover:text-linkedin">
              Search
            </Link>
            <Link to="/connections" className="text-sm font-medium text-gray-700 hover:text-linkedin">
              My Network
            </Link>
            <Link to="/messages" className="text-sm font-medium text-gray-700 hover:text-linkedin">
              Messages
            </Link>
            <NotificationDropdown />
            <Link to={`/profile/${user.id}`} className="text-sm font-medium text-gray-700 hover:text-linkedin">
              Hi, {user.name}
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full border border-linkedin px-4 py-1 text-sm font-semibold text-linkedin hover:bg-blue-50"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-semibold text-linkedin">
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-linkedin px-4 py-1 text-sm font-semibold text-white hover:bg-linkedin-dark"
            >
              Join now
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
