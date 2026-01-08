// Navbar.js

import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { Context } from "../context/Context";

const Navbar = () => {
  const { token, isAdmin } = useContext(Context);
  // console.log(token, isAdmin);

  return (
    <nav className="bg-gray-900 p-4 flex justify-center items-center relative">
      <div className="relative z-20">
        <ul className="flex space-x-4">
          <li>
            <Link to="/" className="text-white hover:text-gray-300">
              Home
            </Link>
          </li>
          {token ? (
            // Render when user is authenticated (token present)
            <>
              {/* Basic links */}
              <li>
                <Link to="/profile" className="text-white hover:text-gray-300">
                  User
                </Link>
              </li>
              {/* Render "Cart" link only if user is not admin */}
              {!isAdmin && (
                <li>
                  <Link to="/cart" className="text-white hover:text-gray-300">
                    Cart
                  </Link>
                </li>
              )}
              {/* Admin-specific links */}
              {isAdmin && (
                <>
                  <li>
                    <Link
                      to="/carlist"
                      className="text-white hover:text-gray-300"
                    >
                      CarList
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard"
                      className="text-white hover:text-gray-300"
                    >
                      Dashboard
                    </Link>
                  </li>
                </>
              )}
            </>
          ) : (
            // Render when user is not authenticated (token not present)
            <>
              <li>
                <Link to="/signup" className="text-white hover:text-gray-300">
                  Create An Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-white hover:text-gray-300">
                  Login
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
