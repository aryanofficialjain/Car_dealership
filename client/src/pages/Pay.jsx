import React, { useContext, useState } from "react";
import axios from "axios";
import { Context } from "../context/Context";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const Pay = () => {
  const { cartItems, token, setBuyerToken, buyCarId } = useContext(Context);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const navigate = useNavigate();

  const handleBuy = async () => {
    try {
      const carIds =
        cartItems.length > 0
          ? cartItems.map((item) => item._id.toString())
          : Array.isArray(buyCarId)
          ? buyCarId
          : [];

      console.log("Car IDs:", carIds);

      // Make the POST request to your backend for COD or UPI
      const response = await axios.post(
        `${import.meta.env.VITE_DOMAIN_URL}/cart/buy`,
        { ids: carIds, paymentMethod },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        alert("Order successfully accepted");
        setBuyerToken(token);

        if (paymentMethod === "cod") {
          if (cartItems.length === 0) {
            navigate("/review");
          } else {
            navigate("/");
          }
        } else if (paymentMethod === "upi") {
          // Redirect to UPI payment page
          try {
            const res = await axios.post(
              `${import.meta.env.VITE_DOMAIN_URL}/paypal/payment`
            );
            console.log(res.data);
            if (res && res.data) {
              let link = res.data.links[1].href;
              window.location.href = link;
            }
          } catch (error) {
            console.error("Error processing UPI payment:", error);
            alert("Failed to process UPI payment. Please try again later.");
          }
        }
      } else {
        console.error("Failed to purchase cars:", response.data);
        alert("Failed to purchase cars. Please try again later.");
      }
    } catch (error) {
      console.error("Error buying cars:", error);
      alert("Failed to purchase cars. Please try again later.");
    }
  };

  const handleChangePaymentMethod = (e) => {
    setPaymentMethod(e.target.value);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Select Payment Method
        </h2>

        <div className="flex items-center mb-4">
          <input
            type="radio"
            id="cod"
            name="paymentMethod"
            value="cod"
            checked={paymentMethod === "cod"}
            onChange={handleChangePaymentMethod}
            className="mr-2"
          />
          <label htmlFor="cod" className="mr-4">
            Cash on Delivery (COD)
          </label>
          <input
            type="radio"
            id="upi"
            name="paymentMethod"
            value="upi"
            checked={paymentMethod === "upi"}
            onChange={handleChangePaymentMethod}
            className="mr-2"
          />
          <label htmlFor="upi">UPI</label>
        </div>

        <button
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          onClick={handleBuy}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default Pay;