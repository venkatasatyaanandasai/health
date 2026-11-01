import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentDots,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import "../Styles/LiveChat.css";

const welcomeMessage = {
  role: "assistant",
  content:
    "Hi! I’m the Health+ virtual assistant. I can help with general questions about our services and booking an appointment.",
};

function LiveChat({ isOpen, onOpen, onClose }) {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const transcriptRef = useRef(null);
  const openButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
        openButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;

    const userMessage = { role: "user", content: message };
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setDraft("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation.slice(-12) }),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error(
          "The chat server returned a web page instead of an API response. Restart the app with `npm start` to start both chat services."
        );
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("The chat server returned an invalid response. Please try again.");
      }

      if (!response.ok) {
        throw new Error(result.error || "Chat is temporarily unavailable.");
      }
      if (typeof result.reply !== "string" || !result.reply.trim()) {
        throw new Error("The assistant returned an empty response.");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: "assistant", content: result.reply.trim() },
      ]);
    } catch (requestError) {
      setMessages((currentMessages) => currentMessages.slice(0, -1));
      setDraft(message);
      setError(
        requestError.message ||
          "Unable to connect right now. Please try again in a moment."
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="live-chat-widget">
      {isOpen && (
        <section
          className="live-chat-panel"
          role="dialog"
          aria-label="Health Plus AI live chat"
          aria-describedby="live-chat-disclaimer"
        >
          <header className="live-chat-header">
            <span className="live-chat-avatar" aria-hidden="true">
              <FontAwesomeIcon icon={faCommentDots} />
            </span>
            <span className="live-chat-heading">
              <strong>Health+ assistant</strong>
              <small><span className="live-chat-status" /> Here to help</small>
            </span>
            <button
              className="live-chat-close"
              type="button"
              aria-label="Close live chat"
              onClick={() => {
                onClose();
                openButtonRef.current?.focus();
              }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </header>

          <p className="live-chat-disclaimer" id="live-chat-disclaimer">
            Messages go to our AI service to generate replies. This assistant
            provides general information, not diagnosis or medical advice. For
            emergencies, contact local emergency services. Don’t share sensitive
            personal or medical details.
          </p>

          <div
            className="live-chat-transcript"
            ref={transcriptRef}
            aria-live="polite"
            aria-relevant="additions text"
          >
            {messages.map((message, index) => (
              <p
                className={`live-chat-message live-chat-message-${message.role}`}
                key={`${message.role}-${index}`}
              >
                {message.content}
              </p>
            ))}
            {isSending && (
              <p className="live-chat-message live-chat-message-assistant" role="status">
                Thinking…
              </p>
            )}
          </div>

          {error && (
            <p className="live-chat-error" role="alert">
              {error}
            </p>
          )}

          <form className="live-chat-composer" onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor="live-chat-input">
              Message the Health+ assistant
            </label>
            <input
              id="live-chat-input"
              ref={inputRef}
              type="text"
              value={draft}
              maxLength={1000}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask a general question…"
              disabled={isSending}
              autoComplete="off"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={isSending || !draft.trim()}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </section>
      )}

      <button
        ref={openButtonRef}
        className={`live-chat-launcher${isOpen ? " live-chat-launcher-open" : ""}`}
        type="button"
        onClick={isOpen ? onClose : onOpen}
        aria-label={isOpen ? "Close live chat" : "Open live chat"}
        aria-expanded={isOpen}
      >
        <FontAwesomeIcon icon={isOpen ? faXmark : faCommentDots} />
        <span>{isOpen ? "Close chat" : "Chat with us"}</span>
      </button>
    </div>
  );
}

export default LiveChat;
