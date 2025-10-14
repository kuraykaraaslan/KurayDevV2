'use client';
import React, { useEffect, useState } from "react";
import axios from "axios";
import './styles/phoneInput.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';

//Fontawesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHourglass, faMessage } from "@fortawesome/free-solid-svg-icons";
import i18n from "@/libs/localize/localize";


const ContactForm = (props: { className?: string; token: string }) => {

  const { t } = i18n;
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
      setGeoInfo(response.data);
      setDefaultCountry(response.data.country);
    }).catch(() => {
    });
  }

  useEffect(() => {
    if (geoInfo.length > 0) {
      return;
    }
    getCountry();
  }, []);


  const claases = props.className;

  const onEmailChange = (e: any) => {
    setEmail(e.target.value);
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    setIsEmailValid(regex.test(e.target.value));
  }

  const onPhoneChange = (value: any) => {
    setPhone(value);
    setIsPhoneValid(isValidPhoneNumber(value || ""));
  };


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
    const date = new Date();

    // Boşluk kontrolü
    const isNameOk = /^[a-zA-Z\sçÇğĞıİöÖşŞüÜ]{3,50}$/.test(name);
    const isEmailOk = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    const isPhoneOk = isValidPhoneNumber(phone || "");
    const isMessageOk = /^[a-zA-Z0-9\s\WçÇğĞıİöÖşŞüÜ]{10,500}$/.test(message);

    setIsNameValid(isNameOk);
    setIsEmailValid(isEmailOk);
    setIsPhoneValid(isPhoneOk);
    setIsMessageValid(isMessageOk);

    if (!token) {
      alert(t("contact.can_not_verify_that_you_are_not_a_robot"));
      return;
    }

    if (!isNameOk || !isEmailOk || !isPhoneOk || !isMessageOk) {
      alert(t("contact.form.please_fill_in_all_fields"));
      return;
    }

    setIsSending(true);

    const data = {
      name,
      email,
      phone,
      message,
      date,
    };

    try {
      await axios.post("/api/contact/form", data, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      setIsSending(false);
      alert(t("contact.form.success"));
    } catch (error) {
      setIsSending(false);
      alert(t("contact.form.error"));
    }
  }



  useEffect(() => {
    const token = props.token;
    setToken(token as string);
  }
    , []);


  return (
    <div className={claases}>
      <div className="mt-2">
        <label htmlFor="name" className="block mb-2 text-sm font-medium ">
          {t("contact.form.name")}
        </label>
        <input
          type="text"
          id="name"
          className={"block p-3 w-full text-sm rounded-lg border border-1 border-gray-500 bg-gray-200 text-black " + (isNameValid ? "" : "text-red-500")}
          placeholder={t("contact.form.enter_your_name")}
          required
          onChange={onNameChange}
        />
      </div>
      <div className="mt-2">
        <label htmlFor="email" className="block mb-2 text-sm font-medium">
          {t("contact.form.email")}
        </label>
        <input
          type="email"
          id="email"
          className={"block p-3 w-full text-sm rounded-lg border border-1 bg-gray-200 text-black " + (isEmailValid ? "" : "text-red-500")}
          placeholder={t("contact.form.enter_your_email")}
          required
          onChange={onEmailChange}
        />
      </div>
      <div className="mt-2">
        <label htmlFor="phone" className="block mb-2 text-sm font-medium">
          {t("contact.form.phone")}
        </label>
        <PhoneInput
          international
          className={"block pl-3 w-full text-sm rounded-lg border border-1 border-gray-500 bg-gray-200 text-black " + (isPhoneValid ? "" : "text-red-500")}
          placeholder={t("contact.form.enter_your_phone")}
          required
          // @ts-ignore
          defaultCountry={defaultCountry ? defaultCountry as string : "TR"}
          onChange={onPhoneChange}
        />
      </div>
      <div className="mt-2">
        <label htmlFor="message" className="block mb-2 text-sm font-medium">
          {t("contact.form.message")}
        </label>
        {/* @ts-ignore */}
        <textarea
          id="message"
          className={"block p-2.5 w-full text-sm rounded-lg border border-1 border-gray-500 min-h-[150px] bg-gray-200 resize-none text-black " + (isMessageValid ? "" : "text-red-500")}
          placeholder={t("contact.form.enter_your_message")}
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
          {t("contact.form.loading")}
        </button>
        : <button
          type="submit"
          className="mt-2 py-3 px-5 text-sm font-medium bg-base-300 rounded-lg hover:text-white focus:outline-none focus:bg-primary-600 border border-1 border-gray-500 light:placeholder-black"
          onClick={formSubmit}
        >
          <FontAwesomeIcon icon={faMessage} className="w-3 h-3 mr-2" />
          {t("contact.form.send")}
        </button>
      }
    </div>
  );
};

export default ContactForm;
