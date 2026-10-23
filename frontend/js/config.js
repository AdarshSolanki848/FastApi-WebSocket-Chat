const TOKEN_KEY = "token";
const API_BASE = window.location.origin;
const WS_BASE = API_BASE
    .replace("http://", "ws://")
    .replace("https://", "wss://");