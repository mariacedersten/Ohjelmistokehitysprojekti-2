// ContactForm.js
import React from "react";
import { useForm, ValidationError } from "@formspree/react";

export function ContactForm() {
  const [state, handleSubmit] = useForm("xanpnodz");

  return (
    <div className="contact-container" style={{ position: "relative" }}>
      {state.succeeded ? (
        <p className="thank-you-message">Thanks for joining us!</p>
      ) : (
        <form className="contact-grid" onSubmit={handleSubmit}>
          <div className="left-col">
            <input id="fullName" type="text" name="fullName" placeholder="Full name" required />
            <ValidationError prefix="Full Name" field="fullName" errors={state.errors} />
            <input id="email" type="email" name="email" placeholder="E-mail address" required />
            <ValidationError prefix="Email" field="email" errors={state.errors} />
            <input id="phone" type="tel" name="phone" placeholder="Phone number" />
            <ValidationError prefix="Phone" field="phone" errors={state.errors} />
          </div>
          <div className="right-col">
            <textarea id="message" name="message" placeholder="Your message" required />
            <ValidationError prefix="Message" field="message" errors={state.errors} />
            <div className="send-area">
              <button className="btn" type="submit" disabled={state.submitting}>
                Send message
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

