import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Update from "./pages/Update";
import Profile from "./pages/Profile";
import AddCar from "./pages/AddCar";
import { Context } from "./context/Context";
import AllCar from "./pages/AllCar";
import CarDetail from "./pages/CarDetail";
import Cart from "./pages/Cart";
import UpdateCar from "./pages/UpdateCar";
import CarList from "./pages/CarList";
import Dashboard from "./pages/Dashboard";
import Address from "./pages/Address";
import Pay from "./pages/Pay";
import Review from "./pages/Review";
import EditAddress from "./pages/EditAddress";
import VerifyCode from "./pages/verifyCode";
import Success from "./pages/Success";
import Falied from "./pages/Failed";
import Chat from "./pages/Chat";

const App = () => {
  const { token, isAdmin } = useContext(Context);

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Routes for non-user (not logged in) */}
      {!token && (
        <>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/allcars" element={<AllCar />} />
          <Route path="/car/car/:id" element={<CarDetail />} />
          <Route path="/verify/:username" element={<VerifyCode />} />
          <Route path="/success" element={<Success />} />
          <Route path="/failed" element={<Falied />} />
        </>
      )}

      {/* Routes for normal logged-in user */}
      {token && (
        <>
          <Route path="/profile" element={<Profile />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/address" element={<Address />} />
          <Route path="/pay" element={<Pay />} />
          <Route path="/review" element={<Review />} />
          <Route path="/editaddress" element={<EditAddress />}/>
          <Route path="/car/car/:id" element={<CarDetail />} />
          <Route path="/allcars" element={<AllCar />} />
          <Route path="/update" element={<Update />} />
          <Route path="/chat/:roomId" element={<Chat/>}/>
        </>
      )}

      {/* Routes for admin */}
      {isAdmin && (
        <>
          <Route path="/addcar" element={<AddCar />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/update" element={<Update />} />
          <Route path="/carlist" element={<CarList />} />
          <Route path="/update/:id" element={<UpdateCar />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat/:id" element={<Chat/>}/>
        </>
      )}
    </Routes>
  );
};

export default App;
