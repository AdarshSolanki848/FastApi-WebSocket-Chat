export function getToken(){
    return sessionStorage.getItem("token");
}

export function logout() {
    sessionStorage.removeItem("token");
    window.location.href = "login.html";
}

export function getCurrentUser() {
    const token = getToken();
    if (!token) {
        return null;
    }
    try {
        const payload = token.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.sub;
    }
    catch {
        return null;
    }
}