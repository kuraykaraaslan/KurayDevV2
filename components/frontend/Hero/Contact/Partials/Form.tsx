'use client';
import React, { useEffect, useState } from "react";
import axios from "axios";
import './styles/phoneInput.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';

//Fontawesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHourglass, faMessage } from "@fortawesome/free-solid-svg-icons";


const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

interface CountryCode extends String {
  name: string;
  dialCode: string;
  countryCode: string;
}



// @ts-ignore
const ContactForm = (props: { className?: string; token: string }) => {

  //React states
  const [token, setToken] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<any>("");
  const [message, setMessage] = useState<string>("");

  //Validation states

  const [isEmailValid, setIsEmailValid] = useState<boolean>(true);
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>(true);
  const [isNameValid, setIsNameValid] = useState<boolean>(true);
  const [isMessageValid, setIsMessageValid] = useState<boolean>(true);

  //Get country code
  const [geoInfo, setGeoInfo] = useState<any>([]);
  const [defaultCountry, setDefaultCountry] = useState<any>(undefined);

  //Timer 
  const [isSending, setIsSending] = useState<boolean>(false);

  function getCountry() {
    axios.get('https://ipapi.co/json/').then((response) => {
      let data = response.data;
      setGeoInfo(data);
      setDefaultCountry(data.country);

    }).catch((error) => {
      console.log(error);
    });
  }

  useEffect(() => {
    if (geoInfo.length > 0) {
      return;
    }
    getCountry();
    console.log("geoInfo", geoInfo);
  }, []);


  const claases = props.className;

  const onEmailChange = (e: any) => {
    setEmail(e.target.value);
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setIsEmailValid(regex.test(e.target.value));
  }

  const onPhoneChange = (e: any) => {
    setPhone(e);
  }

  const onNameChange = (e: any) => {
    setName(e.target.value);
    const regex = /^[a-zA-Z\sçÇğĞıİöÖşŞüÜ]{3,50}$/; // Modify the regex pattern to include Turkish characters
    setIsNameValid(regex.test(e.target.value));
  }

  const onMessageChange = (e: any) => {
    setMessage(e.target.value);
    // minimum 10 characters , maximum 500 characters, no sql injection
    const regex = /^[a-zA-Z0-9\s\WçÇğĞıİöÖşŞüÜ]{10,500}$/; // Modify the regex pattern to include Turkish characters

    setIsMessageValid(regex.test(e.target.value));

  }

  async function formSubmit() {

    if (token === "") {
      alert("Can not verify that you are not a robot.");
      return;
    }

    if (!isEmailValid || !isPhoneValid || !isNameValid || !isMessageValid) {
      alert("Please fill in the required fields correctly.");
      return;
    }

    if (email === "" || phone === "" || name === "" || message === "") {
      alert("Please fill in the required fields.");
      return;
    }

    const date = new Date();

    const data = {
      name: name,
      email: email,
      phone: phone,
      message: message,
      date: date,
    };

    //set timer
    setIsSending(true);


    axios.post("/api/contact/form", data, {
      headers: {
        "Content-Type": "application/json"
      }
    }).then((response) => {
      console.log(response.data);
      setIsSending(false);
      alert("Message sent successfully.");

    }).catch((error) => {
      console.log(error);
      setIsSending(false);
      alert("An error occurred while sending the message.");
    });

  }


  useEffect(() => {
    const token = props.token;
    setToken(token as string);
    console.log("token", token);
  }
    , []);


  return (
    <div className={claases}>
      <div className="mt-2">
        <label htmlFor="name" className="block mb-2 text-sm font-medium ">
          Name
        </label>
        <input
          type="text"
          id="name"
          className={"block p-3 w-full text-sm rounded-lg border border-1 border-gray-500 bg-gray-200 text-black " + (isNameValid ? "" : "text-red-500")}
          placeholder="Enter your name"
          required
          onChange={onNameChange}
        />
      </div>
      <div className="mt-2">
        <label htmlFor="email" className="block mb-2 text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          className={"block p-3 w-full text-sm rounded-lg border border-1 bg-gray-200 text-black " + (isEmailValid ? "" : "text-red-500")}
          placeholder="Enter your email"
          required
          onChange={onEmailChange}
        />
      </div>
      <div className="mt-2">
        <label htmlFor="phone" className="block mb-2 text-sm font-medium">
          Phone
        </label>
          <PhoneInput
            international
            className={"block pl-3 w-full text-sm rounded-lg border border-1 border-gray-500 bg-gray-200 text-black " + (isPhoneValid ? "" : "text-red-500")}
            placeholder="Enter your phone number"
            required
            // @ts-ignore
            defaultCountry={defaultCountry ? defaultCountry as string : "TR"}
            onChange={onPhoneChange}
          />
      </div>
      <div className="mt-2">
        <label htmlFor="message" className="block mb-2 text-sm font-medium">
          Message
        </label>
        {/* @ts-ignore */}
        <textarea
          id="message"
          className={"block p-2.5 w-full text-sm rounded-lg border border-1 border-gray-500 min-h-[150px] bg-gray-200 resize-none text-black " + (isMessageValid ? "" : "text-red-500")}
          placeholder="Enter your message, describe your project"
          required
          onChange={onMessageChange}
        ></textarea>
      </div>
      {isSending ? 
      <button
        type="submit"
        disabled
        className="mt-2 py-3 px-5 text-sm font-medium bg-base-300 rounded-lg hover:text-white focus:outline-none focus:bg-primary-600 border border-1 border-gray-500 light:placeholder-black"
      >
        <FontAwesomeIcon icon={faHourglass} spin className="w-3 h-3 mr-2" />
        Sending...
      </button>
      : <button
        type="submit"
        className="mt-2 py-3 px-5 text-sm font-medium bg-base-300 rounded-lg hover:text-white focus:outline-none focus:bg-primary-600 border border-1 border-gray-500 light:placeholder-black"
        onClick={formSubmit}
      >
        <FontAwesomeIcon icon={faMessage} className="w-3 h-3 mr-2" />
        Send
      </button>
      }
    </div>
  );
};

export default ContactForm;
