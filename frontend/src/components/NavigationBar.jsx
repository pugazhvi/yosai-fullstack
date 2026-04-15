import { Link, useLocation } from "react-router-dom";
import { RiAccountCircleLine } from "react-icons/ri";
import { CgShoppingBag, CgHomeAlt } from "react-icons/cg";
import { GiSewingNeedle } from "react-icons/gi";

const NavigationBar = () => {
  const location = useLocation();
  const path = location.pathname;

  // Hide bottom nav on checkout so the sticky pay bar has room
  if (path === "/checkout") return null;

  const isHomeActive = path === "/";
  const isAccessoriesActive = path === "/readymades";
  const isBookServiceActive = path === "/stitch-service";
  const isProfileActive = path === "/account";
  const isCartActive = path === "/cart";
  const isAnyLinkActive = isAccessoriesActive || isBookServiceActive || isProfileActive || isCartActive;

  return (
    <div>
      {/* Mobile Navigation - Fixed at the Bottom */}
      <div className="block md:hidden relative">
        <div className="flex fixed w-full rounded-t-lg bg-white shadow-2xl bottom-0 px-6 py-4 border-gray-300 z-50 left-0">
          <div className="flex h-full w-full mx-auto font-medium justify-between items-center">
            <Link
              to="/"
              className={`inline-flex flex-col items-center ${isHomeActive || !isAnyLinkActive ? "text-pink-600 rounded-lg" : ""} px-5 py-2 justify-center group`}
            >
              <CgHomeAlt className="text-2xl w-5 h-5 mb-2" />
              <span className="text-xs">Home</span>
            </Link>

            <Link
              to="/readymades"
              className={`inline-flex flex-col items-center ${isAccessoriesActive ? "text-pink-600 rounded-lg" : ""} px-4 py-2 justify-center group`}
            >
              <CgShoppingBag className="text-2xl w-5 h-5 mb-2" />
              <span className="text-xs">Shop</span>
            </Link>

            <Link
              to="/stitch-service"
              className={`inline-flex flex-col items-center ${isBookServiceActive ? "text-pink-600 rounded-lg" : ""} px-4 py-2 justify-center group`}
            >
              <GiSewingNeedle className="text-2xl w-5 h-5 mb-2" />
              <span className="text-xs">Stitch</span>
            </Link>

            <Link
              to="/account"
              className={`inline-flex flex-col items-center ${isProfileActive ? "text-pink-600 rounded-lg" : ""} px-4 py-2 justify-center group`}
            >
              <RiAccountCircleLine className="text-2xl w-5 h-5 mb-2" />
              <span className="text-xs">Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Padding for Main Content to Avoid Overlapping with NavBar */}
      <div className="md:hidden pt-[75px]"></div>
    </div>
  );
};

export default NavigationBar;
