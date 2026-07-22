
async function register(username,password) {
    const response=await fetch(`${API_BASE}/auth/register`,{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            username,password
        })

    });
    return response;
}

async function login(username,password) {
    const formData= new URLSearchParams();
    formData.append("username",username);
    formData.append("password",password);
    const response=await fetch(`${API_BASE}/auth/login`,{
        method:"POST",
        headers:{
            "Content-Type":"application/x-www-form-urlencoded"
        },
        body: formData
    });
    return response;
}

async function getCurrentUser(token) {
    const response=await fetch(`${API_BASE}/auth/me`,{
        method:"GET",
        headers:{
            "Authorization":`Bearer ${token}`
        }
    });
    return response;
}
async function getUserConversations(token) {
    return await fetch(`${API_BASE}/conversations`,{
        method:"GET",
        headers:{
            "Authorization":`Bearer ${token}`
        }
    });
}